import { ProductionOrder } from '@/lib/types/erp';
import { BuyerOrder } from '@/lib/types/modules';
import { INITIAL_PRODUCTION_ORDERS } from '@/lib/db/mock-data';
import { MOCK_BUYER_ORDERS } from '@/lib/db/modules-mock-data';

const STORAGE_KEYS = {
  PRODUCTION_ORDERS: 'erp_production_orders_v1',
  BUYER_ORDERS: 'erp_buyer_orders_v1',
  BUYER_ORDERS_LEGACY: 'erp_buyer_orders',
};

// Custom event dispatched when sewing records change
export const SEWING_TRACK_UPDATED_EVENT = 'erp_sewing_track_updated';

export function isSewingSectionRecord(record: ProductionOrder): boolean {
  const sec = (record.section || '').toLowerCase();
  const line = (record.sewingLine || '').toLowerCase();
  const lineId = (record.lineId || '').toLowerCase();

  return (
    sec.includes('sew') ||
    sec.includes('line') ||
    line.includes('sew') ||
    line.includes('line') ||
    lineId.includes('line') ||
    (!sec.includes('cut') && !sec.includes('wash') && !sec.includes('finish') && !sec.includes('qa'))
  );
}

export function calculateRecordCheckedQty(record: ProductionOrder): number {
  if (record.hourlyReports && record.hourlyReports.length > 0) {
    const hrSum = record.hourlyReports.reduce((sum, h) => sum + (Number(h.checkedQty) || 0), 0);
    if (hrSum > 0) return hrSum;
  }
  return Number(record.completedQuantity) || 0;
}

export function getProductionRecords(): ProductionOrder[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTION_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTION_ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTION_ORDERS, JSON.stringify(INITIAL_PRODUCTION_ORDERS));
      return INITIAL_PRODUCTION_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTION_ORDERS;
  } catch {
    return INITIAL_PRODUCTION_ORDERS;
  }
}

export function saveProductionRecords(orders: ProductionOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('erp_production_records_updated'));
  } catch (err) {
    console.error('Failed to save production records to localStorage:', err);
  }
}

export interface SewingProductionTrackSummary {
  totalCheckedQty: number;
  records: ProductionOrder[];
  recordsCount: number;
  totalPassedQty: number;
  totalDefects: number;
  avgDHU: number;
  avgRFT: number;
  lines: string[];
  inspectors: string[];
  lastRecordDate: string;
}

/**
 * Aggregates all uploaded sewing section records for a specific PO
 * Returns the exact Sewing Total Checked Quantity along with QA summary
 */
export function getSewingProductionTrackForPO(poNumber: string): SewingProductionTrackSummary {
  if (!poNumber) {
    return {
      totalCheckedQty: 0,
      records: [],
      recordsCount: 0,
      totalPassedQty: 0,
      totalDefects: 0,
      avgDHU: 0,
      avgRFT: 100,
      lines: [],
      inspectors: [],
      lastRecordDate: '',
    };
  }

  const allRecords = getProductionRecords();
  const cleanTargetPO = poNumber.trim().toLowerCase();

  const matchingSewingRecords = allRecords.filter((rec) => {
    const recPO = (rec.orderNumber || '').trim().toLowerCase();
    const isMatchingPO =
      recPO === cleanTargetPO ||
      cleanTargetPO.includes(recPO) ||
      recPO.includes(cleanTargetPO);

    return isMatchingPO && isSewingSectionRecord(rec);
  });

  const totalCheckedQty = matchingSewingRecords.reduce((sum, rec) => {
    return sum + calculateRecordCheckedQty(rec);
  }, 0);

  const totalDefects = matchingSewingRecords.reduce((sum, rec) => {
    if (rec.hourlyReports && rec.hourlyReports.length > 0) {
      const hrDefects = rec.hourlyReports.reduce((s, h) => s + (Number(h.defectQty) || 0), 0);
      if (hrDefects > 0) return sum + hrDefects;
    }
    return sum + (Number(rec.totalDefects) || 0);
  }, 0);

  const totalPassedQty = Math.max(0, totalCheckedQty - totalDefects);

  const avgDHU =
    totalCheckedQty > 0
      ? Number(((totalDefects / totalCheckedQty) * 100).toFixed(2))
      : matchingSewingRecords.length > 0
      ? Number(
          (
            matchingSewingRecords.reduce((s, r) => s + (r.dhuRate || r.defectRate || 1.15), 0) /
            matchingSewingRecords.length
          ).toFixed(2)
        )
      : 0;

  const avgRFT =
    totalCheckedQty > 0
      ? Number((Math.max(0, (totalCheckedQty - totalDefects) / totalCheckedQty) * 100).toFixed(1))
      : 98.2;

  const lines = Array.from(
    new Set(
      matchingSewingRecords
        .map((r) => r.section || r.sewingLine || r.lineId || '')
        .filter(Boolean)
    )
  );

  const inspectors = Array.from(
    new Set(matchingSewingRecords.map((r) => r.qualityInspector || '').filter(Boolean))
  );

  const lastRecordDate =
    matchingSewingRecords.length > 0
      ? matchingSewingRecords[0].recordDate ||
        (matchingSewingRecords[0].createdAt ? matchingSewingRecords[0].createdAt.split('T')[0] : '')
      : '';

  return {
    totalCheckedQty,
    records: matchingSewingRecords,
    recordsCount: matchingSewingRecords.length,
    totalPassedQty,
    totalDefects,
    avgDHU,
    avgRFT,
    lines,
    inspectors,
    lastRecordDate,
  };
}

/**
 * Automatically syncs an uploaded sewing section record to the corresponding Buyer Order's
 * Sewing production track record in Buyer & Order module
 */
export function syncSewingRecordToBuyerOrders(savedRecord: ProductionOrder): {
  synced: boolean;
  poNumber: string;
  totalCheckedQty: number;
} {
  if (!savedRecord.orderNumber) {
    return { synced: false, poNumber: '', totalCheckedQty: 0 };
  }

  // Ensure production records store has this record saved
  const currentRecords = getProductionRecords();
  const exists = currentRecords.findIndex((r) => r.id === savedRecord.id);
  let updatedRecords: ProductionOrder[];
  if (exists >= 0) {
    updatedRecords = currentRecords.map((r) => (r.id === savedRecord.id ? savedRecord : r));
  } else {
    updatedRecords = [savedRecord, ...currentRecords];
  }
  saveProductionRecords(updatedRecords);

  const sewingTrack = getSewingProductionTrackForPO(savedRecord.orderNumber);

  if (typeof window === 'undefined') {
    return {
      synced: true,
      poNumber: savedRecord.orderNumber,
      totalCheckedQty: sewingTrack.totalCheckedQty,
    };
  }

  try {
    // Load existing buyer orders
    let buyerOrders: BuyerOrder[] = [...MOCK_BUYER_ORDERS];
    const rawBO =
      localStorage.getItem(STORAGE_KEYS.BUYER_ORDERS) ||
      localStorage.getItem(STORAGE_KEYS.BUYER_ORDERS_LEGACY);
    if (rawBO) {
      try {
        const parsed = JSON.parse(rawBO);
        if (Array.isArray(parsed) && parsed.length > 0) buyerOrders = parsed;
      } catch {
        // ignore
      }
    }

    const cleanPO = savedRecord.orderNumber.trim().toLowerCase();
    let orderFound = false;

    const updatedBuyerOrders = buyerOrders.map((bo) => {
      const boPO = bo.orderNumber.trim().toLowerCase();
      const isMatch = boPO === cleanPO || cleanPO.includes(boPO) || boPO.includes(cleanPO);

      if (isMatch) {
        orderFound = true;
        const currentStages = bo.productionTracking?.stages || [];
        const hasSewingStage = currentStages.some((st) => st.stage === 'SEWING');

        let updatedStages = currentStages;
        if (hasSewingStage) {
          updatedStages = currentStages.map((st) => {
            if (st.stage === 'SEWING') {
              return {
                ...st,
                // Automatically set the Sewing Total Checked Quantity
                actualPcs: sewingTrack.totalCheckedQty,
                status:
                  sewingTrack.totalCheckedQty >= (st.plannedPcs || bo.orderQuantity)
                    ? ('COMPLETED' as const)
                    : sewingTrack.totalCheckedQty > 0
                    ? ('IN_PROGRESS' as const)
                    : st.status,
                assignedLines: sewingTrack.lines.length > 0 ? sewingTrack.lines : st.assignedLines,
                inspector:
                  savedRecord.qualityInspector ||
                  (sewingTrack.inspectors[0] ? sewingTrack.inspectors[0] : st.inspector),
                notes: `Auto-linked from sewing records (${sewingTrack.totalCheckedQty.toLocaleString()} pcs checked across ${sewingTrack.recordsCount} record${sewingTrack.recordsCount > 1 ? 's' : ''})`,
              };
            }
            return st;
          });
        } else {
          // If no sewing stage exists yet, insert standard sewing stage with total checked quantity
          updatedStages = [
            ...currentStages,
            {
              stage: 'SEWING',
              startDate: savedRecord.recordDate || new Date().toISOString().split('T')[0],
              plannedPcs: bo.orderQuantity,
              actualPcs: sewingTrack.totalCheckedQty,
              status:
                sewingTrack.totalCheckedQty >= bo.orderQuantity
                  ? ('COMPLETED' as const)
                  : ('IN_PROGRESS' as const),
              assignedLines: sewingTrack.lines,
              inspector: savedRecord.qualityInspector || sewingTrack.inspectors[0],
              notes: `Auto-linked from sewing records (${sewingTrack.totalCheckedQty.toLocaleString()} pcs checked)`,
            },
          ];
        }

        const overallProgress = Math.min(
          100,
          Math.round((sewingTrack.totalCheckedQty / (bo.orderQuantity || 1)) * 100)
        );

        return {
          ...bo,
          productionTracking: {
            currentStage: bo.productionTracking?.currentStage || 'SEWING',
            overallProgressPercent: overallProgress,
            stages: updatedStages,
          },
        };
      }

      return bo;
    });

    if (orderFound) {
      localStorage.setItem(STORAGE_KEYS.BUYER_ORDERS, JSON.stringify(updatedBuyerOrders));
      localStorage.setItem(STORAGE_KEYS.BUYER_ORDERS_LEGACY, JSON.stringify(updatedBuyerOrders));
      window.dispatchEvent(
        new CustomEvent(SEWING_TRACK_UPDATED_EVENT, {
          detail: {
            poNumber: savedRecord.orderNumber,
            totalCheckedQty: sewingTrack.totalCheckedQty,
            recordsCount: sewingTrack.recordsCount,
          },
        })
      );
      window.dispatchEvent(new CustomEvent('erp_buyer_orders_updated'));
    }

    return {
      synced: orderFound,
      poNumber: savedRecord.orderNumber,
      totalCheckedQty: sewingTrack.totalCheckedQty,
    };
  } catch (err) {
    console.error('Error syncing sewing record to buyer orders:', err);
    return {
      synced: false,
      poNumber: savedRecord.orderNumber,
      totalCheckedQty: sewingTrack.totalCheckedQty,
    };
  }
}
