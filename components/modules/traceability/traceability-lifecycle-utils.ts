import { BuyerOrder, TraceabilityStageKey, TraceabilityStageRecord } from '@/lib/types/modules';

export interface StageMeta {
  key: TraceabilityStageKey;
  stepNumber: number;
  label: string;
  shortName: string;
  description: string;
  defaultUnit: string;
  supplierLabel: string;
  challanLabel: string;
  defaultSupplier: string;
  sampleChallanImage: string;
  sampleChallanImageName: string;
}

export const STAGE_CONFIGS: Record<TraceabilityStageKey, StageMeta> = {
  RAW_MATERIAL: {
    key: 'RAW_MATERIAL',
    stepNumber: 1,
    label: 'Raw Material (Fiber / Yarn)',
    shortName: 'Raw Material',
    description: 'Cotton ginning, spinning mill procurement & inward verification',
    defaultUnit: 'kg',
    supplierLabel: 'Spinning Mill / Supplier',
    challanLabel: 'Mill Delivery Challan #',
    defaultSupplier: 'Square Spinning Mills Ltd (Unit 2)',
    sampleChallanImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    sampleChallanImageName: 'Raw_Material_Delivery_Challan_Verified.jpg',
  },
  FABRIC: {
    key: 'FABRIC',
    stepNumber: 2,
    label: 'Fabric (Knitting / Dyeing)',
    shortName: 'Fabric',
    description: 'Greige fabric knitting, dyeing house batch & roll QA clearance',
    defaultUnit: 'meters',
    supplierLabel: 'Fabric Mill / Dye House',
    challanLabel: 'Fabric Inward Challan #',
    defaultSupplier: 'Pacific Knit Composite Ltd',
    sampleChallanImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80',
    sampleChallanImageName: 'Fabric_Mill_Roll_Challan_Signed.jpg',
  },
  CUTTING: {
    key: 'CUTTING',
    stepNumber: 3,
    label: 'Cutting & Marker Spreading',
    shortName: 'Cutting',
    description: 'Fabric relaxation, CAD marker spreading, laser cutting & ply ticketing',
    defaultUnit: 'pcs',
    supplierLabel: 'Cutting Room / Table #',
    challanLabel: 'Cutting Requisition & Bundle Slip #',
    defaultSupplier: 'Cutting Table Lot CUT-TB-14',
    sampleChallanImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    sampleChallanImageName: 'Cutting_Floor_Bundle_Slip_CAD.jpg',
  },
  SEWING: {
    key: 'SEWING',
    stepNumber: 4,
    label: 'Sewing Assembly Line',
    shortName: 'Sewing',
    description: 'Bundle line input, garment assembly, inline QC & 100% defect inspection',
    defaultUnit: 'pcs',
    supplierLabel: 'Sewing Floor & Line #',
    challanLabel: 'Sewing Line Floor Challan #',
    defaultSupplier: 'Sewing Line 01 (Knits Division)',
    sampleChallanImage: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&auto=format&fit=crop&q=80',
    sampleChallanImageName: 'Sewing_Line_Assembly_Ticket.jpg',
  },
  FINISHING: {
    key: 'FINISHING',
    stepNumber: 5,
    label: 'Finishing & Garment QC',
    shortName: 'Finishing',
    description: 'Thread trimming, wash treatment, pressing, tunnel iron & final audit',
    defaultUnit: 'pcs',
    supplierLabel: 'Finishing Section & Station',
    challanLabel: 'QC Pass & Inspection Certificate #',
    defaultSupplier: 'Finishing Section Bay 02',
    sampleChallanImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    sampleChallanImageName: 'QC_Finishing_Inspection_Passed.jpg',
  },
  PACKING: {
    key: 'PACKING',
    stepNumber: 6,
    label: 'Packing & Carton Box Packaging',
    shortName: 'Packing',
    description: 'Polybagging, barcode hangtags, metal detection scan & export cartoning',
    defaultUnit: 'pcs',
    supplierLabel: 'Packing Station & Barcoding Room',
    challanLabel: 'Packing List & Carton Manifest #',
    defaultSupplier: 'Central Packing Hall 03',
    sampleChallanImage: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&auto=format&fit=crop&q=80',
    sampleChallanImageName: 'Carton_Packing_List_Manifest.jpg',
  },
  SHIPMENT: {
    key: 'SHIPMENT',
    stepNumber: 7,
    label: 'Shipment & Ex-Factory Clearance',
    shortName: 'Shipment',
    description: 'Container stuffing, customs clearance, commercial invoice & gate pass',
    defaultUnit: 'pcs',
    supplierLabel: 'Dispatch Bay & Freight Forwarder',
    challanLabel: 'Bill of Lading / Commercial Challan #',
    defaultSupplier: 'Kuehne + Nagel Logistics / Chittagong Port',
    sampleChallanImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=80',
    sampleChallanImageName: 'Bill_Of_Lading_Export_Clearance.jpg',
  },
};

export const STAGE_KEYS: TraceabilityStageKey[] = [
  'RAW_MATERIAL',
  'FABRIC',
  'CUTTING',
  'SEWING',
  'FINISHING',
  'PACKING',
  'SHIPMENT',
];

/**
 * Calculates excess/short quantity and type
 */
export function calculateStageExcessShort(
  receivedQty: number,
  issuedQty: number,
  stageKey: TraceabilityStageKey
): { variance: number; type: 'EXCESS' | 'SHORT' | 'BALANCED' } {
  const rec = Number(receivedQty) || 0;
  const iss = Number(issuedQty) || 0;

  if (stageKey === 'CUTTING') {
    // For cutting: received = planned cut target, issued = actual cut pcs produced
    const diff = iss - rec;
    if (diff > 0) return { variance: diff, type: 'EXCESS' };
    if (diff < 0) return { variance: Math.abs(diff), type: 'SHORT' };
    return { variance: 0, type: 'BALANCED' };
  }

  if (stageKey === 'SEWING' || stageKey === 'FINISHING') {
    // For sewing/finishing: received = input, issued = good output. Rejections cause shortfall
    const diff = rec - iss;
    if (diff > 0) return { variance: diff, type: 'SHORT' };
    if (diff < 0) return { variance: Math.abs(diff), type: 'EXCESS' };
    return { variance: 0, type: 'BALANCED' };
  }

  // General stages: received vs issued
  const diff = rec - iss;
  if (diff > 0) return { variance: diff, type: 'EXCESS' };
  if (diff < 0) return { variance: Math.abs(diff), type: 'SHORT' };
  return { variance: 0, type: 'BALANCED' };
}

/**
 * Formats a date offset by N days relative to a base date
 */
function offsetDate(baseDateStr: string, dayOffset: number): string {
  try {
    const base = new Date(baseDateStr);
    if (isNaN(base.getTime())) {
      const now = new Date();
      now.setDate(now.getDate() + dayOffset);
      return now.toISOString().slice(0, 10);
    }
    const d = new Date(base);
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().slice(0, 10);
  } catch {
    const now = new Date();
    now.setDate(now.getDate() + dayOffset);
    return now.toISOString().slice(0, 10);
  }
}

/**
 * Creates default 7 lifecycle stages when any PO is selected
 */
export function createDefaultLifecycleStages(order: Partial<BuyerOrder>): TraceabilityStageRecord[] {
  const orderQty = order.orderQuantity || 45000;
  const poNum = order.orderNumber || 'PO-ORD-101';
  const cleanPo = poNum.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || '99201';
  const shipDate = order.shipDate || new Date().toISOString().slice(0, 10);

  // Logical manufacturing dates stepping backwards from shipDate:
  // Shipment: day 0
  // Packing: day -3 to day -1
  // Finishing: day -8 to day -4
  // Sewing: day -18 to day -9
  // Cutting: day -25 to day -19
  // Fabric: day -35 to day -26
  // Raw Material: day -45 to day -36
  const dates = {
    rawRec: offsetDate(shipDate, -45),
    rawIss: offsetDate(shipDate, -36),
    fabRec: offsetDate(shipDate, -35),
    fabIss: offsetDate(shipDate, -26),
    cutRec: offsetDate(shipDate, -25),
    cutIss: offsetDate(shipDate, -19),
    sewRec: offsetDate(shipDate, -18),
    sewIss: offsetDate(shipDate, -9),
    finRec: offsetDate(shipDate, -8),
    finIss: offsetDate(shipDate, -4),
    pckRec: offsetDate(shipDate, -3),
    pckIss: offsetDate(shipDate, -1),
    shpRec: offsetDate(shipDate, -1),
    shpIss: offsetDate(shipDate, 0),
  };

  // Realistic quantities calculation based on industry textile conversion:
  // Yarn weight approx 0.22 kg/piece + 5% allowance
  const rawRec = Math.round(orderQty * 0.22 * 1.05); // 10,395 kg
  const rawIss = Math.round(orderQty * 0.22 * 1.02); // 10,098 kg
  const rawExcess = rawRec - rawIss; // +297 kg excess

  // Fabric meters approx 0.45 m/piece + 4% allowance
  const fabRec = Math.round(orderQty * 0.45 * 1.04); // 21,060 m
  const fabIss = Math.round(orderQty * 0.45 * 1.01); // 20,453 m
  const fabExcess = fabRec - fabIss; // +607 m excess

  // Cutting: Planned = orderQty, Cut = orderQty + 2.6% overcut
  const cutPlanned = orderQty;
  const cutActual = Math.round(orderQty * 1.026); // e.g. 46,170 pcs
  const cutExcess = cutActual - cutPlanned; // +1,170 pcs overcut

  // Sewing: Input = cutActual, Output = orderQty + 0.9% (defect variance)
  const sewInput = cutActual;
  const sewOutput = Math.round(orderQty * 1.009); // e.g. 45,405 pcs
  const sewShort = sewInput - sewOutput; // 765 pcs sewing rejects

  // Finishing: Input = sewOutput, Output = orderQty (45,000 pcs)
  const finInput = sewOutput;
  const finOutput = orderQty;
  const finShort = finInput - finOutput; // 405 pcs finishing rejects

  // Packing: Input = orderQty, Packed = orderQty (100% target met)
  const pckInput = orderQty;
  const pckOutput = orderQty;

  // Shipment: Loaded = orderQty, Cleared = orderQty
  const shpInput = orderQty;
  const shpOutput = orderQty;

  return [
    {
      id: `stg-${cleanPo}-1`,
      stageKey: 'RAW_MATERIAL',
      stageName: 'Raw Material (Fiber / Yarn)',
      receiveDate: dates.rawRec,
      issueDate: dates.rawIss,
      receivedQty: rawRec,
      issuedQty: rawIss,
      excessShortQty: rawExcess,
      excessShortType: 'EXCESS',
      unit: 'kg',
      challanNumber: `CHL-RM-${cleanPo}-01`,
      challanDate: dates.rawRec,
      challanImageUrl: STAGE_CONFIGS.RAW_MATERIAL.sampleChallanImage,
      challanImageName: STAGE_CONFIGS.RAW_MATERIAL.sampleChallanImageName,
      stationOrSupplier: order.buyerName ? `${order.buyerName} Nominated Spinning Mill` : 'Square Spinning Mills Ltd (Unit 2)',
      status: 'COMPLETED',
      remarks: '100% virgin ring-spun cotton certified. Raw store balance reconciled with 0 moisture loss.',
    },
    {
      id: `stg-${cleanPo}-2`,
      stageKey: 'FABRIC',
      stageName: 'Fabric (Knitting / Dyeing)',
      receiveDate: dates.fabRec,
      issueDate: dates.fabIss,
      receivedQty: fabRec,
      issuedQty: fabIss,
      excessShortQty: fabExcess,
      excessShortType: 'EXCESS',
      unit: 'meters',
      challanNumber: `CHL-FAB-${cleanPo}-02`,
      challanDate: dates.fabRec,
      challanImageUrl: STAGE_CONFIGS.FABRIC.sampleChallanImage,
      challanImageName: STAGE_CONFIGS.FABRIC.sampleChallanImageName,
      stationOrSupplier: 'Pacific Knit Composite Ltd (Dye House)',
      status: 'COMPLETED',
      remarks: 'Lab dip shade approved. 4-point fabric inspection passed with Grade A compliance score (14 points/100 sq yd).',
    },
    {
      id: `stg-${cleanPo}-3`,
      stageKey: 'CUTTING',
      stageName: 'Cutting & Marker Spreading',
      receiveDate: dates.cutRec,
      issueDate: dates.cutIss,
      receivedQty: cutPlanned,
      issuedQty: cutActual,
      excessShortQty: cutExcess,
      excessShortType: 'EXCESS',
      unit: 'pcs',
      challanNumber: `CUT-SLIP-${cleanPo}-03`,
      challanDate: dates.cutIss,
      challanImageUrl: STAGE_CONFIGS.CUTTING.sampleChallanImage,
      challanImageName: STAGE_CONFIGS.CUTTING.sampleChallanImageName,
      stationOrSupplier: 'Cutting Table Lot CUT-TB-14 (Auto Spreader)',
      status: 'COMPLETED',
      remarks: 'CAD marker efficiency 86.8%. Planned buffer +2.6% overcut to safeguard sewing line yield.',
    },
    {
      id: `stg-${cleanPo}-4`,
      stageKey: 'SEWING',
      stageName: 'Sewing Assembly Line',
      receiveDate: dates.sewRec,
      issueDate: dates.sewIss,
      receivedQty: sewInput,
      issuedQty: sewOutput,
      excessShortQty: sewShort,
      excessShortType: 'SHORT',
      unit: 'pcs',
      challanNumber: `BUN-SEW-${cleanPo}-04`,
      challanDate: dates.sewIss,
      challanImageUrl: STAGE_CONFIGS.SEWING.sampleChallanImage,
      challanImageName: STAGE_CONFIGS.SEWING.sampleChallanImageName,
      stationOrSupplier: 'Sewing Line 01 (Knits Assembly)',
      status: 'COMPLETED',
      remarks: 'End-line DHU 1.4%. 765 pcs rejected & defaced under buyer brand protection protocol.',
    },
    {
      id: `stg-${cleanPo}-5`,
      stageKey: 'FINISHING',
      stageName: 'Finishing & Garment QC',
      receiveDate: dates.finRec,
      issueDate: dates.finIss,
      receivedQty: finInput,
      issuedQty: finOutput,
      excessShortQty: finShort,
      excessShortType: 'SHORT',
      unit: 'pcs',
      challanNumber: `QC-FIN-${cleanPo}-05`,
      challanDate: dates.finIss,
      challanImageUrl: STAGE_CONFIGS.FINISHING.sampleChallanImage,
      challanImageName: STAGE_CONFIGS.FINISHING.sampleChallanImageName,
      stationOrSupplier: 'Finishing Room Bay 02 (Steam Tunnel)',
      status: 'COMPLETED',
      remarks: 'Tunnel steam iron & dimensional stability verified. 405 minor oil/iron reject units isolated for de-branding.',
    },
    {
      id: `stg-${cleanPo}-6`,
      stageKey: 'PACKING',
      stageName: 'Packing & Carton Box Packaging',
      receiveDate: dates.pckRec,
      issueDate: dates.pckIss,
      receivedQty: pckInput,
      issuedQty: pckOutput,
      excessShortQty: 0,
      excessShortType: 'BALANCED',
      unit: 'pcs',
      challanNumber: `PL-PCK-${cleanPo}-06`,
      challanDate: dates.pckIss,
      challanImageUrl: STAGE_CONFIGS.PACKING.sampleChallanImage,
      challanImageName: STAGE_CONFIGS.PACKING.sampleChallanImageName,
      stationOrSupplier: 'Central Packaging Hall (Station 4)',
      status: 'COMPLETED',
      remarks: `100% order met (${orderQty.toLocaleString()} pcs). Dual 9-point metal detector inspection passed.`,
    },
    {
      id: `stg-${cleanPo}-7`,
      stageKey: 'SHIPMENT',
      stageName: 'Shipment & Ex-Factory Clearance',
      receiveDate: dates.shpRec,
      issueDate: dates.shpIss,
      receivedQty: shpInput,
      issuedQty: shpOutput,
      excessShortQty: 0,
      excessShortType: 'BALANCED',
      unit: 'pcs',
      challanNumber: `BL-EXP-${cleanPo}-07`,
      challanDate: dates.shpIss,
      challanImageUrl: STAGE_CONFIGS.SHIPMENT.sampleChallanImage,
      challanImageName: STAGE_CONFIGS.SHIPMENT.sampleChallanImageName,
      stationOrSupplier: 'Ex-Factory Gate 01 / Freight Carrier',
      status: 'COMPLETED',
      remarks: 'Commercial invoice & Customs gate pass stamped. Container seal locked and verified for port transit.',
    },
  ];
}
