import { BuyerOrder, BuyerOrderWIPRecord, ProductionStageDetail } from '@/lib/types/modules';
import { ProductionOrder, InspectionRecord } from '@/lib/types/erp';
import {
  getProductionRecords,
  getSewingProductionTrackForPO,
  calculateRecordCheckedQty,
  SewingProductionTrackSummary,
} from '@/lib/db/production-records-store';
import { INITIAL_INSPECTIONS } from '@/lib/db/mock-data';

export const WIP_RECORDS_UPDATED_EVENT = 'erp_wip_records_updated';

const STORAGE_KEYS = {
  INSPECTIONS: 'erp_inspections_v1',
  BUYER_ORDERS: 'erp_buyer_orders_v1',
  BUYER_ORDERS_LEGACY: 'erp_buyer_orders',
};

/**
 * Get all inspection records from storage with mock fallback
 */
export function getStoredInspections(): InspectionRecord[] {
  if (typeof window === 'undefined') return INITIAL_INSPECTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
      return INITIAL_INSPECTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INSPECTIONS;
  } catch {
    return INITIAL_INSPECTIONS;
  }
}

/**
 * Save inspection records to storage
 */
export function saveStoredInspections(records: InspectionRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('erp_inspection_records_updated'));
    window.dispatchEvent(new CustomEvent(WIP_RECORDS_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to save inspections to localStorage:', err);
  }
}

/**
 * Summary for Cutting Floor Records for a given PO
 */
export interface CuttingProductionTrackSummary {
  totalCutQty: number;
  recordsCount: number;
  tables: string[];
  inspectors: string[];
  lastDate: string;
}

/**
 * Aggregate Cutting Records for a specific PO or Style
 */
export function getCuttingProductionTrackForPO(
  poNumber: string,
  styleNumber?: string
): CuttingProductionTrackSummary {
  if (!poNumber && !styleNumber) {
    return { totalCutQty: 0, recordsCount: 0, tables: [], inspectors: [], lastDate: '' };
  }

  const allRecords = getProductionRecords();
  const cleanTargetPO = (poNumber || '').trim().toLowerCase();
  const cleanTargetStyle = (styleNumber || '').trim().toLowerCase();

  const matchingCutting = allRecords.filter((rec) => {
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

    const sec = (rec.section || '').toLowerCase();
    const line = (rec.sewingLine || '').toLowerCase();
    const isCutting =
      sec.includes('cut') ||
      line.includes('cut') ||
      sec.includes('spread') ||
      rec.styleName?.toLowerCase().includes('cutting');

    return (isMatchingPO || isMatchingStyle) && isCutting;
  });

  const totalCutQty = matchingCutting.reduce((sum, r) => {
    return sum + (calculateRecordCheckedQty(r) || Number(r.completedQuantity) || 0);
  }, 0);

  const tables = Array.from(
    new Set(matchingCutting.map((r) => r.section || r.sewingLine || 'Cutting Table').filter(Boolean))
  );

  const inspectors = Array.from(
    new Set(matchingCutting.map((r) => r.qualityInspector || '').filter(Boolean))
  );

  const lastDate = matchingCutting[0]?.recordDate || '';

  return {
    totalCutQty,
    recordsCount: matchingCutting.length,
    tables,
    inspectors,
    lastDate,
  };
}

/**
 * Summary for Finishing Floor Records for a given PO
 */
export interface FinishingProductionTrackSummary {
  totalFinishingQty: number;
  recordsCount: number;
  sections: string[];
  inspectors: string[];
  lastDate: string;
}

/**
 * Aggregate Finishing Records for a specific PO or Style
 */
export function getFinishingProductionTrackForPO(
  poNumber: string,
  styleNumber?: string
): FinishingProductionTrackSummary {
  if (!poNumber && !styleNumber) {
    return { totalFinishingQty: 0, recordsCount: 0, sections: [], inspectors: [], lastDate: '' };
  }

  const allRecords = getProductionRecords();
  const cleanTargetPO = (poNumber || '').trim().toLowerCase();
  const cleanTargetStyle = (styleNumber || '').trim().toLowerCase();

  const matchingFinishing = allRecords.filter((rec) => {
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

    const sec = (rec.section || '').toLowerCase();
    const line = (rec.sewingLine || '').toLowerCase();
    const isFinishing =
      sec.includes('finish') ||
      line.includes('finish') ||
      sec.includes('pack') ||
      sec.includes('iron') ||
      line.includes('pack');

    return (isMatchingPO || isMatchingStyle) && isFinishing;
  });

  const totalFinishingQty = matchingFinishing.reduce((sum, r) => {
    return sum + (calculateRecordCheckedQty(r) || Number(r.completedQuantity) || 0);
  }, 0);

  const sections = Array.from(
    new Set(matchingFinishing.map((r) => r.section || r.sewingLine || 'Finishing Dept').filter(Boolean))
  );

  const inspectors = Array.from(
    new Set(matchingFinishing.map((r) => r.qualityInspector || '').filter(Boolean))
  );

  const lastDate = matchingFinishing[0]?.recordDate || '';

  return {
    totalFinishingQty,
    recordsCount: matchingFinishing.length,
    sections,
    inspectors,
    lastDate,
  };
}

/**
 * Summary for Final Inspection Records for a given PO
 */
export interface FinalInspectionTrackSummary {
  totalPassedQty: number;
  totalLotQty: number;
  totalSampleInspected: number;
  recordsCount: number;
  inspectionCodes: string[];
  inspectors: string[];
  verdict: 'PASSED' | 'CONDITIONAL_PASS' | 'REJECTED' | 'NO_RECORDS';
  lastInspectionDate: string;
}

/**
 * Aggregate Final Inspection Records for a specific PO or Style
 */
export function getFinalInspectionTrackForPO(
  poNumber: string,
  styleNumber?: string
): FinalInspectionTrackSummary {
  if (!poNumber && !styleNumber) {
    return {
      totalPassedQty: 0,
      totalLotQty: 0,
      totalSampleInspected: 0,
      recordsCount: 0,
      inspectionCodes: [],
      inspectors: [],
      verdict: 'NO_RECORDS',
      lastInspectionDate: '',
    };
  }

  const allInspections = getStoredInspections();
  const cleanTargetPO = (poNumber || '').trim().toLowerCase();
  const cleanTargetStyle = (styleNumber || '').trim().toLowerCase();

  const matchingInspections = allInspections.filter((rec) => {
    const singlePO = (rec.orderNumber || '').trim().toLowerCase();
    const multiPOs = (rec.poNumbers || []).map((p) => p.trim().toLowerCase());
    const combinedPOs = (rec.combinedOrders || []).map((c) => c.poNumber.trim().toLowerCase());
    const recStyle = ((rec as any).styleNumber || (rec as any).styleName || '').trim().toLowerCase();

    const isPoMatch =
      cleanTargetPO &&
      (singlePO.includes(cleanTargetPO) ||
        cleanTargetPO.includes(singlePO) ||
        multiPOs.some((p) => p === cleanTargetPO || cleanTargetPO.includes(p) || p.includes(cleanTargetPO)) ||
        combinedPOs.some((p) => p === cleanTargetPO || cleanTargetPO.includes(p) || p.includes(cleanTargetPO)));

    const isStyleMatch =
      cleanTargetStyle &&
      (recStyle === cleanTargetStyle ||
        recStyle.includes(cleanTargetStyle) ||
        cleanTargetStyle.includes(recStyle));

    const isFinalOrPreFinal =
      rec.inspectionType === 'FINAL' ||
      rec.inspectionType === 'PRE_FINAL' ||
      rec.stage === 'FINISHING_PACKING' ||
      (rec.stage as string) === 'FINAL_INSPECTION';

    return (isPoMatch || isStyleMatch) && isFinalOrPreFinal;
  });

  if (matchingInspections.length === 0) {
    return {
      totalPassedQty: 0,
      totalLotQty: 0,
      totalSampleInspected: 0,
      recordsCount: 0,
      inspectionCodes: [],
      inspectors: [],
      verdict: 'NO_RECORDS',
      lastInspectionDate: '',
    };
  }

  // Calculate passed quantity:
  let totalPassedLot = 0;
  let totalLot = 0;
  let totalSample = 0;

  matchingInspections.forEach((rec) => {
    let poLot = Number(rec.lotQuantity) || Number(rec.orderQuantity) || Number(rec.sampleSize) || 0;
    if (rec.combinedOrders && rec.combinedOrders.length > 0 && cleanTargetPO) {
      const matchCombo = rec.combinedOrders.find(
        (c) => c.poNumber.trim().toLowerCase() === cleanTargetPO || cleanTargetPO.includes(c.poNumber.trim().toLowerCase())
      );
      if (matchCombo && matchCombo.orderQuantity) {
        poLot = matchCombo.orderQuantity;
      }
    }

    totalLot += poLot;
    totalSample += Number(rec.sampleSize) || 0;

    if (rec.status === 'PASSED' || rec.status === 'CONDITIONAL_PASS') {
      totalPassedLot += poLot;
    }
  });

  const inspectionCodes = matchingInspections.map((r) => r.inspectionCode).filter(Boolean);
  const inspectors = Array.from(new Set(matchingInspections.map((r) => r.inspectorName).filter(Boolean)));
  const latest = matchingInspections[0];

  return {
    totalPassedQty: totalPassedLot,
    totalLotQty: totalLot,
    totalSampleInspected: totalSample,
    recordsCount: matchingInspections.length,
    inspectionCodes,
    inspectors,
    verdict: latest ? latest.status : 'NO_RECORDS',
    lastInspectionDate: latest ? (latest.createdAt ? latest.createdAt.split('T')[0] : '') : '',
  };
}

/**
 * Computes a unified BuyerOrderWIPRecord for a given PO,
 * automatically pulling live numbers from Cutting, Sewing, Finishing, and Quality Final Inspection.
 * Seamlessly falls back to stagesData and production order status to ensure WIP is never erroneously zero.
 */
export function computeWIPRecordForPO(
  poNumber: string,
  orderQuantity: number,
  existingWIP?: Partial<BuyerOrderWIPRecord> | null,
  stagesData?: ProductionStageDetail[],
  orderStatus?: string,
  styleNumber?: string
): BuyerOrderWIPRecord {
  const cuttingTrack = getCuttingProductionTrackForPO(poNumber, styleNumber);
  const sewingTrack = getSewingProductionTrackForPO(poNumber, styleNumber);
  const finishingTrack = getFinishingProductionTrackForPO(poNumber, styleNumber);
  const inspectionTrack = getFinalInspectionTrackForPO(poNumber, styleNumber);

  // Fallbacks from existing stagesData
  const cuttingStage = stagesData?.find((s) => s.stage === 'CUTTING');
  const sewingStage = stagesData?.find((s) => s.stage === 'SEWING');
  const packingStage = stagesData?.find((s) => s.stage === 'PACKING');
  const auditStage = stagesData?.find((s) => s.stage === 'READY_AUDIT');
  const shippingStage = stagesData?.find((s) => s.stage === 'SHIPPED');

  const manualOverrides = existingWIP?.manualOverrides || {};
  const statusUpper = (orderStatus || '').toUpperCase();

  // 1. Cutting Planned
  const defaultCuttingPlanned =
    (existingWIP?.cuttingPlanned && existingWIP.cuttingPlanned > 0)
      ? existingWIP.cuttingPlanned
      : (cuttingStage?.plannedPcs && cuttingStage.plannedPcs > 0)
      ? cuttingStage.plannedPcs
      : Math.round(orderQuantity * 1.01) || orderQuantity;

  // 2. Cutting Actual (Auto-synced from cutting records, stages, or status)
  let cuttingActual = 0;
  let cuttingSource = 'Manual / Default';
  if (manualOverrides.cutting && existingWIP?.cuttingActual !== undefined) {
    cuttingActual = existingWIP.cuttingActual;
    cuttingSource = 'Manual Override';
  } else if (cuttingTrack.totalCutQty > 0) {
    cuttingActual = cuttingTrack.totalCutQty;
    cuttingSource = `Auto (${cuttingTrack.recordsCount} Cutting Record${cuttingTrack.recordsCount > 1 ? 's' : ''})`;
  } else if (existingWIP?.cuttingActual !== undefined && existingWIP.cuttingActual > 0) {
    cuttingActual = existingWIP.cuttingActual;
    cuttingSource = 'Existing Record';
  } else if (cuttingStage?.actualPcs && cuttingStage.actualPcs > 0) {
    cuttingActual = cuttingStage.actualPcs;
    cuttingSource = 'Stage Baseline';
  } else if (['SEWING', 'FINISHING', 'PACKING', 'READY_AUDIT', 'SHIPPED'].includes(statusUpper)) {
    cuttingActual = defaultCuttingPlanned;
    cuttingSource = 'Synchronized with Completed Stage';
  } else if (statusUpper === 'CUTTING') {
    cuttingActual = Math.round(orderQuantity * 0.45) || orderQuantity;
    cuttingSource = 'Cutting Line Active';
  }

  // 3. Sewing Input
  const sewingInput =
    (existingWIP?.sewingInput && existingWIP.sewingInput > 0)
      ? existingWIP.sewingInput
      : (sewingStage?.plannedPcs && sewingStage.plannedPcs > 0)
      ? sewingStage.plannedPcs
      : (cuttingActual > 0
          ? cuttingActual
          : ['SEWING', 'FINISHING', 'PACKING', 'READY_AUDIT', 'SHIPPED'].includes(statusUpper)
          ? orderQuantity
          : 0);

  // 4. Sewing Complete Quantity (Auto-synced from sewing records, stages, or status)
  let sewingComplete = 0;
  let sewingSource = 'Manual / Default';
  if (manualOverrides.sewing && existingWIP?.sewingComplete !== undefined) {
    sewingComplete = existingWIP.sewingComplete;
    sewingSource = 'Manual Override';
  } else if (sewingTrack.totalCheckedQty > 0) {
    sewingComplete = sewingTrack.totalCheckedQty;
    sewingSource = `Auto (${sewingTrack.recordsCount} Sewing Record${sewingTrack.recordsCount > 1 ? 's' : ''})`;
  } else if (existingWIP?.sewingComplete !== undefined && existingWIP.sewingComplete > 0) {
    sewingComplete = existingWIP.sewingComplete;
    sewingSource = 'Existing Record';
  } else if (sewingStage?.actualPcs && sewingStage.actualPcs > 0) {
    sewingComplete = sewingStage.actualPcs;
    sewingSource = 'Stage Baseline';
  } else if (['FINISHING', 'PACKING', 'READY_AUDIT', 'SHIPPED'].includes(statusUpper)) {
    sewingComplete = orderQuantity;
    sewingSource = 'Assembly Completed';
  } else if (statusUpper === 'SEWING') {
    sewingComplete = Math.round(orderQuantity * 0.55);
    sewingSource = 'Assembly Floor In Progress';
  }

  // 5. Wash Sent & Received
  const washApplicable = existingWIP?.washApplicable ?? false;
  const washSent =
    (existingWIP?.washSent && existingWIP.washSent > 0)
      ? existingWIP.washSent
      : (washApplicable ? (sewingComplete > 0 ? sewingComplete : 0) : 0);
  const washReceived =
    (existingWIP?.washReceived && existingWIP.washReceived > 0)
      ? existingWIP.washReceived
      : (washApplicable
          ? (['FINISHING', 'PACKING', 'READY_AUDIT', 'SHIPPED'].includes(statusUpper)
              ? washSent
              : Math.round(washSent * 0.85))
          : 0);

  // 6. Finishing Quantity (Auto-synced from finishing floor records)
  let finishingQuantity = 0;
  let finishingSource = 'Manual / Default';
  if (manualOverrides.finishing && existingWIP?.finishingQuantity !== undefined) {
    finishingQuantity = existingWIP.finishingQuantity;
    finishingSource = 'Manual Override';
  } else if (finishingTrack.totalFinishingQty > 0) {
    finishingQuantity = finishingTrack.totalFinishingQty;
    finishingSource = `Auto (${finishingTrack.recordsCount} Finishing Record${finishingTrack.recordsCount > 1 ? 's' : ''})`;
  } else if (existingWIP?.finishingQuantity !== undefined && existingWIP.finishingQuantity > 0) {
    finishingQuantity = existingWIP.finishingQuantity;
    finishingSource = 'Existing Record';
  } else if (packingStage?.actualPcs && packingStage.actualPcs > 0) {
    finishingQuantity = packingStage.actualPcs;
    finishingSource = 'Stage Baseline';
  } else if (['READY_AUDIT', 'SHIPPED'].includes(statusUpper)) {
    finishingQuantity = orderQuantity;
    finishingSource = 'Finishing Completed';
  } else if (statusUpper === 'PACKING') {
    finishingQuantity = Math.round(orderQuantity * 0.90);
    finishingSource = 'Finishing Floor Active';
  } else if (statusUpper === 'FINISHING') {
    finishingQuantity = Math.round(orderQuantity * 0.70);
    finishingSource = 'Finishing Floor In Progress';
  } else if (sewingComplete > orderQuantity * 0.5) {
    finishingQuantity = Math.round(sewingComplete * 0.60);
    finishingSource = 'Synchronized with Sewing';
  }

  // 7. Packed Quantity
  let packedQuantity = 0;
  if (existingWIP?.packedQuantity !== undefined && existingWIP.packedQuantity > 0) {
    packedQuantity = existingWIP.packedQuantity;
  } else if (packingStage?.actualPcs && packingStage.actualPcs > 0) {
    packedQuantity = packingStage.actualPcs;
  } else if (['READY_AUDIT', 'SHIPPED'].includes(statusUpper)) {
    packedQuantity = orderQuantity;
  } else if (statusUpper === 'PACKING') {
    packedQuantity = Math.round(orderQuantity * 0.75);
  } else if (finishingQuantity > 0) {
    packedQuantity = Math.round(finishingQuantity * 0.92);
  }

  // 8. Inspection Completed Quantity (Auto-synced from Quality Final Inspection records)
  let inspectionCompletedQuantity = 0;
  let inspectionSource = 'Manual / Default';
  if (manualOverrides.inspection && existingWIP?.inspectionCompletedQuantity !== undefined) {
    inspectionCompletedQuantity = existingWIP.inspectionCompletedQuantity;
    inspectionSource = 'Manual Override';
  } else if (inspectionTrack.totalPassedQty > 0) {
    inspectionCompletedQuantity = inspectionTrack.totalPassedQty;
    inspectionSource = `Auto (${inspectionTrack.inspectionCodes.join(', ') || 'Quality Pass'})`;
  } else if (existingWIP?.inspectionCompletedQuantity !== undefined && existingWIP.inspectionCompletedQuantity > 0) {
    inspectionCompletedQuantity = existingWIP.inspectionCompletedQuantity;
    inspectionSource = 'Existing Record';
  } else if (auditStage?.actualPcs && auditStage.actualPcs > 0) {
    inspectionCompletedQuantity = auditStage.actualPcs;
    inspectionSource = 'Stage Baseline';
  } else if (statusUpper === 'READY_AUDIT') {
    inspectionCompletedQuantity = Math.round(orderQuantity * 0.95);
    inspectionSource = 'Pre-Shipment Audit Underway';
  } else if (statusUpper === 'SHIPPED') {
    inspectionCompletedQuantity = orderQuantity;
    inspectionSource = 'Final Inspection 100% Passed';
  }

  // 9. Shipped Quantity
  let shippedQuantity = 0;
  if (existingWIP?.shippedQuantity !== undefined && existingWIP.shippedQuantity > 0) {
    shippedQuantity = existingWIP.shippedQuantity;
  } else if (shippingStage?.actualPcs && shippingStage.actualPcs > 0) {
    shippedQuantity = shippingStage.actualPcs;
  } else if (statusUpper === 'SHIPPED') {
    shippedQuantity = orderQuantity;
  }

  return {
    cuttingPlanned: defaultCuttingPlanned,
    cuttingActual,
    sewingInput,
    sewingComplete,
    washApplicable,
    washSent,
    washReceived,
    finishingQuantity,
    packedQuantity,
    inspectionCompletedQuantity,
    shippedQuantity,
    autoSyncFlags: {
      cutting: cuttingTrack.totalCutQty > 0 && !manualOverrides.cutting,
      sewing: sewingTrack.totalCheckedQty > 0 && !manualOverrides.sewing,
      finishing: finishingTrack.totalFinishingQty > 0 && !manualOverrides.finishing,
      inspection: inspectionTrack.totalPassedQty > 0 && !manualOverrides.inspection,
    },
    manualOverrides,
    syncSources: {
      cutting: cuttingSource,
      sewing: sewingSource,
      finishing: finishingSource,
      inspection: inspectionSource,
    },
    stageNotes: existingWIP?.stageNotes || {},
    sectionTargets: existingWIP?.sectionTargets,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Synchronize WIP Record data into traditional ProductionStageDetail[]
 * so any legacy component or report continues to see accurate stage numbers.
 */
export function syncWIPToStages(
  wip: BuyerOrderWIPRecord,
  currentStages: ProductionStageDetail[] = [],
  orderQuantity: number
): ProductionStageDetail[] {
  const stageMap = new Map<string, ProductionStageDetail>();
  currentStages.forEach((st) => stageMap.set(st.stage, { ...st }));

  // CUTTING
  const cutting = stageMap.get('CUTTING') || { stage: 'CUTTING', plannedPcs: wip.cuttingPlanned, status: 'PENDING' };
  cutting.plannedPcs = wip.cuttingPlanned;
  cutting.actualPcs = wip.cuttingActual;
  cutting.status =
    wip.cuttingActual >= wip.cuttingPlanned && wip.cuttingPlanned > 0
      ? 'COMPLETED'
      : wip.cuttingActual > 0
      ? 'IN_PROGRESS'
      : cutting.status;
  stageMap.set('CUTTING', cutting);

  // SEWING
  const sewing = stageMap.get('SEWING') || { stage: 'SEWING', plannedPcs: orderQuantity, status: 'PENDING' };
  sewing.actualPcs = wip.sewingComplete;
  sewing.status =
    wip.sewingComplete >= orderQuantity && orderQuantity > 0
      ? 'COMPLETED'
      : wip.sewingComplete > 0
      ? 'IN_PROGRESS'
      : sewing.status;
  stageMap.set('SEWING', sewing);

  // PACKING / FINISHING
  const packing = stageMap.get('PACKING') || { stage: 'PACKING', plannedPcs: orderQuantity, status: 'PENDING' };
  packing.actualPcs = wip.packedQuantity || wip.finishingQuantity;
  packing.status =
    (wip.packedQuantity >= orderQuantity || wip.finishingQuantity >= orderQuantity) && orderQuantity > 0
      ? 'COMPLETED'
      : wip.packedQuantity > 0 || wip.finishingQuantity > 0
      ? 'IN_PROGRESS'
      : packing.status;
  stageMap.set('PACKING', packing);

  // READY_AUDIT / FINAL INSPECTION
  const audit = stageMap.get('READY_AUDIT') || { stage: 'READY_AUDIT', plannedPcs: orderQuantity, status: 'PENDING' };
  audit.actualPcs = wip.inspectionCompletedQuantity;
  audit.status =
    wip.inspectionCompletedQuantity >= orderQuantity && orderQuantity > 0
      ? 'COMPLETED'
      : wip.inspectionCompletedQuantity > 0
      ? 'IN_PROGRESS'
      : audit.status;
  stageMap.set('READY_AUDIT', audit);

  // SHIPPED
  const shipped = stageMap.get('SHIPPED') || { stage: 'SHIPPED', plannedPcs: orderQuantity, status: 'PENDING' };
  shipped.actualPcs = wip.shippedQuantity;
  shipped.status =
    wip.shippedQuantity >= orderQuantity && orderQuantity > 0
      ? 'COMPLETED'
      : wip.shippedQuantity > 0
      ? 'IN_PROGRESS'
      : shipped.status;
  stageMap.set('SHIPPED', shipped);

  // Ensure PLANNED stage is kept
  if (!stageMap.has('PLANNED')) {
    stageMap.set('PLANNED', {
      stage: 'PLANNED',
      plannedPcs: orderQuantity,
      actualPcs: orderQuantity,
      status: 'COMPLETED',
    });
  }

  // Preserve order: PLANNED, CUTTING, SEWING, PACKING, READY_AUDIT, SHIPPED
  const order: Array<ProductionStageDetail['stage']> = [
    'PLANNED',
    'CUTTING',
    'SEWING',
    'PACKING',
    'READY_AUDIT',
    'SHIPPED',
  ];

  return order.map((s) => stageMap.get(s)!).filter(Boolean);
}

/**
 * Calculates comprehensive WIP pipeline metrics, balance balances,
 * and identifies manufacturing bottlenecks.
 */
export function calculateWIPPipelineMetrics(wip: BuyerOrderWIPRecord, orderQuantity: number) {
  const targetQty = orderQuantity || 1;

  // 1. Cutting Progress
  const cuttingProgressPct = Math.min(
    100,
    Math.round((wip.cuttingActual / (wip.cuttingPlanned || targetQty)) * 100)
  );

  // 2. Sewing Line Floor WIP (Input minus Completed)
  const sewingFloorWip = Math.max(0, wip.sewingInput - wip.sewingComplete);

  // 3. Wash Floor WIP (Sent minus Received)
  const washFloorWip = wip.washApplicable ? Math.max(0, wip.washSent - wip.washReceived) : 0;
  const washShortage = wip.washApplicable ? Math.max(0, wip.washSent - wip.washReceived) : 0;

  // 4. Finishing Floor WIP
  const finishingBaseInput = wip.washApplicable ? wip.washReceived : wip.sewingComplete;
  const finishingFloorWip = Math.max(0, finishingBaseInput - wip.finishingQuantity);

  // 5. Packing WIP
  const packingFloorWip = Math.max(0, wip.finishingQuantity - wip.packedQuantity);

  // 6. Inspection WIP (Packed ready for inspection minus inspected)
  const inspectionWip = Math.max(0, wip.packedQuantity - wip.inspectionCompletedQuantity);

  // 7. Shipping WIP (Inspected passed garments awaiting dispatch)
  const readyToShipWip = Math.max(0, wip.inspectionCompletedQuantity - wip.shippedQuantity);

  // 8. Overall Pipeline Completion
  const primaryProgressQty = wip.shippedQuantity > 0
    ? wip.shippedQuantity
    : wip.inspectionCompletedQuantity > 0
    ? wip.inspectionCompletedQuantity
    : wip.packedQuantity > 0
    ? wip.packedQuantity
    : wip.sewingComplete > 0
    ? wip.sewingComplete
    : wip.cuttingActual;

  const overallProgressPercent = Math.min(100, Math.round((primaryProgressQty / targetQty) * 100));

  // 9. Bottleneck detection
  const bottlenecks: Array<{ stage: string; severity: 'low' | 'medium' | 'high'; message: string }> = [];

  if (sewingFloorWip > targetQty * 0.25) {
    bottlenecks.push({
      stage: 'Sewing Floor',
      severity: 'high',
      message: `High Floor WIP: ${sewingFloorWip.toLocaleString()} pcs in sewing line queue awaiting completion.`,
    });
  }

  if (wip.washApplicable && washFloorWip > 1000) {
    bottlenecks.push({
      stage: 'Wash Plant',
      severity: 'medium',
      message: `Wash Plant Backlog: ${washFloorWip.toLocaleString()} pcs sent but not yet received back.`,
    });
  }

  if (finishingFloorWip > targetQty * 0.2) {
    bottlenecks.push({
      stage: 'Finishing Dept',
      severity: 'medium',
      message: `Finishing Bottleneck: ${finishingFloorWip.toLocaleString()} sewn garments awaiting thread trim & iron.`,
    });
  }

  if (packingFloorWip > 2000) {
    bottlenecks.push({
      stage: 'Carton Packing',
      severity: 'low',
      message: `Packing Queue: ${packingFloorWip.toLocaleString()} finished pcs awaiting polybag and carton boxing.`,
    });
  }

  if (readyToShipWip > 0 && wip.shippedQuantity === 0) {
    bottlenecks.push({
      stage: 'Export Logistics',
      severity: 'low',
      message: `Ready for Commercial Dispatch: ${readyToShipWip.toLocaleString()} passed inspection pcs ready to ship.`,
    });
  }

  return {
    cuttingProgressPct,
    sewingFloorWip,
    washFloorWip,
    washShortage,
    finishingFloorWip,
    packingFloorWip,
    inspectionWip,
    readyToShipWip,
    overallProgressPercent,
    bottlenecks,
  };
}
