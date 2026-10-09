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

export function isCuttingSectionRecord(record: ProductionOrder): boolean {
  const sec = (record.section || '').toLowerCase();
  const line = (record.sewingLine || '').toLowerCase();
  const lineId = (record.lineId || '').toLowerCase();
  return sec.includes('cut') || line.includes('cut') || lineId.includes('cut') || sec.includes('spread');
}

export function isFinishingSectionRecord(record: ProductionOrder): boolean {
  const sec = (record.section || '').toLowerCase();
  const line = (record.sewingLine || '').toLowerCase();
  const lineId = (record.lineId || '').toLowerCase();
  return (
    sec.includes('finish') ||
    sec.includes('iron') ||
    sec.includes('press') ||
    line.includes('finish') ||
    lineId.includes('fin')
  );
}

export function isPackingSectionRecord(record: ProductionOrder): boolean {
  const sec = (record.section || '').toLowerCase();
  const line = (record.sewingLine || '').toLowerCase();
  const lineId = (record.lineId || '').toLowerCase();
  return sec.includes('pack') || line.includes('pack') || lineId.includes('pack') || sec.includes('carton');
}

export function isWashingSectionRecord(record: ProductionOrder): boolean {
  const sec = (record.section || '').toLowerCase();
  const line = (record.sewingLine || '').toLowerCase();
  const lineId = (record.lineId || '').toLowerCase();
  return sec.includes('wash') || line.includes('wash') || lineId.includes('wash');
}

export function isQualitySectionRecord(record: ProductionOrder): boolean {
  const sec = (record.section || '').toLowerCase();
  const line = (record.sewingLine || '').toLowerCase();
  return sec.includes('qa') || sec.includes('qc') || sec.includes('quality') || sec.includes('audit');
}

export function getRecordSectionCategory(
  record: ProductionOrder
): 'Sewing' | 'Cutting' | 'Finishing' | 'Packing' | 'Washing' | 'QA' {
  if (isCuttingSectionRecord(record)) return 'Cutting';
  if (isFinishingSectionRecord(record)) return 'Finishing';
  if (isPackingSectionRecord(record)) return 'Packing';
  if (isWashingSectionRecord(record)) return 'Washing';
  if (isQualitySectionRecord(record)) return 'QA';
  return 'Sewing';
}

export function isSewingSectionRecord(record: ProductionOrder): boolean {
  const sec = (record.section || '').toLowerCase();
  const line = (record.sewingLine || '').toLowerCase();
  const lineId = (record.lineId || '').toLowerCase();

  if (isCuttingSectionRecord(record)) return false;
  if (isFinishingSectionRecord(record)) return false;
  if (isPackingSectionRecord(record)) return false;
  if (isWashingSectionRecord(record)) return false;
  if (isQualitySectionRecord(record)) return false;

  return (
    sec.includes('sew') ||
    sec.includes('line') ||
    line.includes('sew') ||
    line.includes('line') ||
    lineId.includes('line') ||
    sec === ''
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
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTION_ORDERS, JSON.stringify(INITIAL_PRODUCTION_ORDERS));
      return INITIAL_PRODUCTION_ORDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveProductionRecords(orders: ProductionOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('erp_production_records_updated'));
    window.dispatchEvent(new CustomEvent('erp_production_orders_updated'));
    window.dispatchEvent(new CustomEvent('erp_wip_records_updated'));

    // Cross-tab live broadcast
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('garments_erp_sync');
        bc.postMessage({
          type: 'PRODUCTION_RECORDS_UPDATED',
          orders,
          timestamp: new Date().toISOString(),
        });
        bc.close();
      } catch {}
    }

    // Dual-sync to Central Host Server
    fetch('/api/modules/production_records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: orders }),
    }).catch((err) => console.warn('[Production Store] Server sync warning:', err));
  } catch (err) {
    console.error('Failed to save production records to localStorage:', err);
  }
}

export async function deleteProductionRecordFromBackend(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/production-records?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Production Store] Backend delete error:', err);
    return false;
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
export function getSewingProductionTrackForPO(
  poNumber: string,
  styleNumber?: string
): SewingProductionTrackSummary {
  if (!poNumber && !styleNumber) {
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
  const cleanTargetPO = (poNumber || '').trim().toLowerCase();
  const cleanTargetStyle = (styleNumber || '').trim().toLowerCase();

  const matchingSewingRecords = allRecords.filter((rec) => {
    const recPO = (rec.orderNumber || '').trim().toLowerCase();
    const recStyle = (rec.styleNumber || rec.styleName || '').trim().toLowerCase();

    const isMatchingPO =
      cleanTargetPO &&
      (recPO === cleanTargetPO ||
        cleanTargetPO.includes(recPO) ||
        recPO.includes(cleanTargetPO));

    const isMatchingStyle =
      cleanTargetStyle &&
      (recStyle === cleanTargetStyle ||
        cleanTargetStyle.includes(recStyle) ||
        recStyle.includes(cleanTargetStyle));

    return (isMatchingPO || isMatchingStyle) && isSewingSectionRecord(rec);
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
 * Automatically syncs an uploaded production section record (Sewing, Finishing, Cutting, Packing)
 * to the corresponding Buyer Order's stages and WIP record in Buyer & Order module
 */
export function syncProductionRecordToBuyerOrders(savedRecord: ProductionOrder): {
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

  const cleanPO = savedRecord.orderNumber.trim().toLowerCase();

  // Aggregate quantities for this PO across all sections
  const matchingRecords = updatedRecords.filter((rec) => {
    const recPO = (rec.orderNumber || '').trim().toLowerCase();
    return recPO === cleanPO || cleanPO.includes(recPO) || recPO.includes(cleanPO);
  });

  const sewingRecords = matchingRecords.filter((r) => isSewingSectionRecord(r));
  const totalSewingQty = sewingRecords.reduce((s, r) => s + calculateRecordCheckedQty(r), 0);

  const cuttingRecords = matchingRecords.filter((r) => isCuttingSectionRecord(r));
  const totalCuttingQty = cuttingRecords.reduce((s, r) => s + calculateRecordCheckedQty(r), 0);

  const finishingRecords = matchingRecords.filter((r) => isFinishingSectionRecord(r));
  const totalFinishingQty = finishingRecords.reduce((s, r) => s + calculateRecordCheckedQty(r), 0);

  const packingRecords = matchingRecords.filter((r) => isPackingSectionRecord(r));
  const totalPackingQty = packingRecords.reduce((s, r) => s + calculateRecordCheckedQty(r), 0);

  const currentSection = getRecordSectionCategory(savedRecord);
  const sewingTrack = getSewingProductionTrackForPO(savedRecord.orderNumber);

  if (typeof window === 'undefined') {
    return {
      synced: true,
      poNumber: savedRecord.orderNumber,
      totalCheckedQty: totalSewingQty || calculateRecordCheckedQty(savedRecord),
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

    let orderFound = false;

    const updatedBuyerOrders = buyerOrders.map((bo) => {
      const boPO = bo.orderNumber.trim().toLowerCase();
      const isMatch = boPO === cleanPO || cleanPO.includes(boPO) || boPO.includes(cleanPO);

      if (isMatch) {
        orderFound = true;
        const currentStages = bo.productionTracking?.stages || [];
        let updatedStages = [...currentStages];

        // 1. UPDATE OR INSERT SEWING STAGE
        const sewingIndex = updatedStages.findIndex((st) => st.stage === 'SEWING');
        const effectiveSewingQty = totalSewingQty > 0 ? totalSewingQty : (updatedStages[sewingIndex]?.actualPcs || 0);
        if (sewingIndex >= 0) {
          updatedStages[sewingIndex] = {
            ...updatedStages[sewingIndex],
            actualPcs: effectiveSewingQty,
            status:
              effectiveSewingQty >= (updatedStages[sewingIndex].plannedPcs || bo.orderQuantity)
                ? 'COMPLETED'
                : effectiveSewingQty > 0
                ? 'IN_PROGRESS'
                : updatedStages[sewingIndex].status,
            assignedLines: sewingTrack.lines.length > 0 ? sewingTrack.lines : updatedStages[sewingIndex].assignedLines,
            inspector: savedRecord.qualityInspector || updatedStages[sewingIndex].inspector,
            notes: `Auto-linked from sewing records (${effectiveSewingQty.toLocaleString()} pcs checked)`,
          };
        } else if (totalSewingQty > 0) {
          updatedStages.push({
            stage: 'SEWING',
            startDate: savedRecord.recordDate || new Date().toISOString().split('T')[0],
            plannedPcs: bo.orderQuantity,
            actualPcs: totalSewingQty,
            status: totalSewingQty >= bo.orderQuantity ? 'COMPLETED' : 'IN_PROGRESS',
            assignedLines: sewingTrack.lines,
            inspector: savedRecord.qualityInspector || sewingTrack.inspectors[0],
            notes: `Auto-linked from sewing records (${totalSewingQty.toLocaleString()} pcs checked)`,
          });
        }

        // 2. UPDATE OR INSERT CUTTING STAGE
        const cuttingIndex = updatedStages.findIndex((st) => st.stage === 'CUTTING');
        const effectiveCuttingQty = totalCuttingQty > 0 ? totalCuttingQty : (updatedStages[cuttingIndex]?.actualPcs || 0);
        if (cuttingIndex >= 0) {
          if (totalCuttingQty > 0) {
            updatedStages[cuttingIndex] = {
              ...updatedStages[cuttingIndex],
              actualPcs: effectiveCuttingQty,
              status:
                effectiveCuttingQty >= (updatedStages[cuttingIndex].plannedPcs || bo.orderQuantity)
                  ? 'COMPLETED'
                  : 'IN_PROGRESS',
              notes: `Auto-linked from cutting records (${effectiveCuttingQty.toLocaleString()} pcs cut)`,
            };
          }
        } else if (totalCuttingQty > 0) {
          updatedStages.push({
            stage: 'CUTTING',
            startDate: savedRecord.recordDate || new Date().toISOString().split('T')[0],
            plannedPcs: bo.orderQuantity,
            actualPcs: totalCuttingQty,
            status: totalCuttingQty >= bo.orderQuantity ? 'COMPLETED' : 'IN_PROGRESS',
            notes: `Auto-linked from cutting records (${totalCuttingQty.toLocaleString()} pcs cut)`,
          });
        }

        // 3. UPDATE OR INSERT PACKING / FINISHING STAGE
        const packingIndex = updatedStages.findIndex((st) => st.stage === 'PACKING');
        const effectivePackingQty = Math.max(totalFinishingQty, totalPackingQty);
        if (packingIndex >= 0) {
          if (effectivePackingQty > 0) {
            updatedStages[packingIndex] = {
              ...updatedStages[packingIndex],
              actualPcs: effectivePackingQty,
              status:
                effectivePackingQty >= (updatedStages[packingIndex].plannedPcs || bo.orderQuantity)
                  ? 'COMPLETED'
                  : 'IN_PROGRESS',
              notes: `Auto-linked from finishing/packing records (${effectivePackingQty.toLocaleString()} pcs)`,
            };
          }
        } else if (effectivePackingQty > 0) {
          updatedStages.push({
            stage: 'PACKING',
            startDate: savedRecord.recordDate || new Date().toISOString().split('T')[0],
            plannedPcs: bo.orderQuantity,
            actualPcs: effectivePackingQty,
            status: effectivePackingQty >= bo.orderQuantity ? 'COMPLETED' : 'IN_PROGRESS',
            notes: `Auto-linked from finishing/packing records (${effectivePackingQty.toLocaleString()} pcs)`,
          });
        }

        // 4. UPDATE WIP RECORD
        const prevWip = bo.wipRecord || {
          orderNumber: bo.orderNumber,
          buyerName: bo.buyerName,
          styleNumber: bo.styleNumber,
          orderQuantity: bo.orderQuantity,
          cuttingPlanned: Math.round(bo.orderQuantity * 1.01),
          cuttingActual: 0,
          sewingInput: bo.orderQuantity,
          sewingComplete: 0,
          finishingQuantity: 0,
          packedQuantity: 0,
          inspectionCompletedQuantity: 0,
          shippedQuantity: 0,
          lastUpdated: new Date().toISOString(),
        };

        const updatedWip = {
          ...prevWip,
          cuttingActual: totalCuttingQty > 0 ? totalCuttingQty : prevWip.cuttingActual,
          sewingComplete: totalSewingQty > 0 ? totalSewingQty : prevWip.sewingComplete,
          finishingQuantity: totalFinishingQty > 0 ? totalFinishingQty : prevWip.finishingQuantity,
          packedQuantity: totalPackingQty > 0 ? totalPackingQty : prevWip.packedQuantity,
          lastUpdated: new Date().toISOString(),
        };

        // Determine current production stage
        let activeStageName: any = bo.productionTracking?.currentStage || 'SEWING';
        if (totalPackingQty >= bo.orderQuantity * 0.9) activeStageName = 'READY_AUDIT';
        else if (totalFinishingQty > 0 || totalPackingQty > 0) activeStageName = 'PACKING';
        else if (totalSewingQty > 0) activeStageName = 'SEWING';
        else if (totalCuttingQty > 0) activeStageName = 'CUTTING';

        const leadQty = Math.max(
          updatedWip.packedQuantity || 0,
          updatedWip.finishingQuantity || 0,
          updatedWip.sewingComplete || 0,
          updatedWip.cuttingActual || 0
        );

        const overallProgress = Math.min(
          100,
          Math.round((leadQty / (bo.orderQuantity || 1)) * 100)
        );

        return {
          ...bo,
          wipRecord: updatedWip,
          productionTracking: {
            currentStage: activeStageName,
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
            totalCheckedQty: totalSewingQty,
            recordsCount: sewingRecords.length,
          },
        })
      );
      window.dispatchEvent(new CustomEvent('erp_wip_records_updated'));
      window.dispatchEvent(new CustomEvent('erp_buyer_orders_updated'));
      window.dispatchEvent(new CustomEvent('erp_production_orders_updated'));
    }

    return {
      synced: orderFound,
      poNumber: savedRecord.orderNumber,
      totalCheckedQty: totalSewingQty || calculateRecordCheckedQty(savedRecord),
    };
  } catch (err) {
    console.error('Error syncing production record to buyer orders:', err);
    return {
      synced: false,
      poNumber: savedRecord.orderNumber,
      totalCheckedQty: totalSewingQty || calculateRecordCheckedQty(savedRecord),
    };
  }
}

/**
 * Backward-compatible alias for syncProductionRecordToBuyerOrders
 */
export function syncSewingRecordToBuyerOrders(savedRecord: ProductionOrder) {
  return syncProductionRecordToBuyerOrders(savedRecord);
}

