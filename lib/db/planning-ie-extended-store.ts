import {
  FactoryMaster,
  ProductionLineMaster,
  MachineMasterItem,
  OperatorMasterItem,
  SkillMatrixItem,
  OperationMasterItem,
  ProductionOrderPlan,
  CapacityPlanningRecord,
  LinePlanningRecord,
  ManpowerPlanningRecord,
  MethodStudyRecord,
  MotionStudyRecord,
  TargetSettingRecord,
  ProductionExecutionRecord,
  HourlyMonitoringRecord,
  WipManagementRecord,
  ProductionLossRecord,
  DowntimeManagementRecord,
  ProductionQualityLink,
  ProductionReworkRecord,
  ProductionRejectionRecord,
  ProductionFollowUpRecord,
  KaizenImprovementRecord,
  ProductionAlertItem,
  UniversalAuditRecord,
} from '@/lib/types/planning-ie';

// 01. Factory & Line Hierarchy Master Data
export const INITIAL_FACTORIES: FactoryMaster[] = [
  {
    id: 'fac-1',
    name: 'Apex Horizon Apparel Plant A',
    code: 'FAC-A-01',
    location: 'Gazipur Industrial Zone, Dhaka',
    totalBuildings: 3,
    totalLines: 12,
  },
  {
    id: 'fac-2',
    name: 'Apex Horizon Denim Mill Unit B',
    code: 'FAC-B-02',
    location: 'Narayanganj Export Processing Zone',
    totalBuildings: 2,
    totalLines: 8,
  },
];

export const INITIAL_LINES: ProductionLineMaster[] = [
  {
    id: 'line-01',
    unitId: 'Unit 01',
    name: 'Sewing Line 01 (Knit Crewneck)',
    lineCode: 'LN-01-KNIT',
    lineType: 'KNIT',
    floor: 'Floor 2, Building A',
    capacityOperators: 28,
    capacityMachines: 32,
    standardEfficiency: 82,
    status: 'ACTIVE',
  },
  {
    id: 'line-02',
    unitId: 'Unit 01',
    name: 'Sewing Line 02 (Polo Specialist)',
    lineCode: 'LN-02-POLO',
    lineType: 'KNIT',
    floor: 'Floor 2, Building A',
    capacityOperators: 34,
    capacityMachines: 38,
    standardEfficiency: 80,
    status: 'ACTIVE',
  },
  {
    id: 'line-03',
    unitId: 'Unit 01',
    name: 'Sewing Line 03 (Heavy T-Shirt & Hoodies)',
    lineCode: 'LN-03-HOOD',
    lineType: 'KNIT',
    floor: 'Floor 3, Building A',
    capacityOperators: 32,
    capacityMachines: 36,
    standardEfficiency: 85,
    status: 'ACTIVE',
  },
  {
    id: 'line-04',
    unitId: 'Unit 02',
    name: 'Sewing Line 04 (Heavy Denim 12oz)',
    lineCode: 'LN-04-DNM',
    lineType: 'DENIM',
    floor: 'Floor 1, Building B',
    capacityOperators: 48,
    capacityMachines: 54,
    standardEfficiency: 78,
    status: 'ACTIVE',
  },
  {
    id: 'line-05',
    unitId: 'Unit 02',
    name: 'Sewing Line 05 (Woven Dress Shirts)',
    lineCode: 'LN-05-WVN',
    lineType: 'WOVEN',
    floor: 'Floor 2, Building B',
    capacityOperators: 42,
    capacityMachines: 46,
    standardEfficiency: 81,
    status: 'CHANGEOVER',
  },
  {
    id: 'line-06',
    unitId: 'Unit 02',
    name: 'Sewing Line 06 (Technical Outerwear)',
    lineCode: 'LN-06-OUT',
    lineType: 'OUTERWEAR',
    floor: 'Floor 3, Building B',
    capacityOperators: 36,
    capacityMachines: 40,
    standardEfficiency: 76,
    status: 'ACTIVE',
  },
];

// 07. Operation Master Library
export const INITIAL_OPERATION_MASTERS: OperationMasterItem[] = [
  {
    id: 'opm-1',
    operationCode: 'OP-KN-01',
    operationName: 'Shoulder Join (with Mobilon Tape)',
    operationSequence: 1,
    department: 'PREPARATION',
    machineType: '4-Thread Overlock',
    machineClass: 'Pegasus M900',
    attachment: 'Mobilon Elastic Tape Feeder Guide',
    skillLevel: 2,
    smv: 0.65,
    sam: 0.72,
    standardTimeSec: 39,
    cycleTimeSec: 22,
    targetPerHour: 75,
    operationCapacityPcs: 600,
  },
  {
    id: 'opm-2',
    operationCode: 'OP-KN-02',
    operationName: 'Rib Collar Prepare & Loop Join',
    operationSequence: 2,
    department: 'PREPARATION',
    machineType: 'Single Needle Lockstitch (SNLS)',
    machineClass: 'Juki DDL-9000C',
    attachment: 'Edge Guide Foot & Tension Gauge',
    skillLevel: 2,
    smv: 0.55,
    sam: 0.61,
    standardTimeSec: 33,
    cycleTimeSec: 26,
    targetPerHour: 88,
    operationCapacityPcs: 704,
  },
  {
    id: 'opm-3',
    operationCode: 'OP-KN-03',
    operationName: 'Attach Rib Neck to Body',
    operationSequence: 3,
    department: 'ASSEMBLY',
    machineType: '4-Thread Overlock (Differential)',
    machineClass: 'Pegasus EXT Differential',
    attachment: 'Cylinder Bed Collar Folder',
    skillLevel: 4,
    smv: 1.15,
    sam: 1.28,
    standardTimeSec: 69,
    cycleTimeSec: 23.5,
    targetPerHour: 42,
    operationCapacityPcs: 336,
  },
  {
    id: 'opm-4',
    operationCode: 'OP-KN-04',
    operationName: 'Neck Topstitch / Binding',
    operationSequence: 4,
    department: 'ASSEMBLY',
    machineType: 'Flatlock 2-Needle 4-Thread',
    machineClass: 'Yamato FD-62DR',
    attachment: 'Tape Binding Folder 15mm',
    skillLevel: 3,
    smv: 0.90,
    sam: 1.01,
    standardTimeSec: 54,
    cycleTimeSec: 25.0,
    targetPerHour: 53,
    operationCapacityPcs: 424,
  },
  {
    id: 'opm-5',
    operationCode: 'OP-KN-05',
    operationName: 'Back Neck Tape Attach & Folder',
    operationSequence: 5,
    department: 'ASSEMBLY',
    machineType: 'Single Needle Chainstitch',
    machineClass: 'Juki MH-481',
    attachment: 'Herringbone Folder 12mm',
    skillLevel: 3,
    smv: 0.80,
    sam: 0.89,
    standardTimeSec: 48,
    cycleTimeSec: 23.0,
    targetPerHour: 60,
    operationCapacityPcs: 480,
  },
  {
    id: 'opm-6',
    operationCode: 'OP-KN-06',
    operationName: 'Sleeve Open Hem Fold & Stitch',
    operationSequence: 6,
    department: 'PREPARATION',
    machineType: 'Flatlock Bottom Hem',
    machineClass: 'Yamato VC-2700',
    attachment: 'Hemming Air Folder & Sensor',
    skillLevel: 2,
    smv: 1.10,
    sam: 1.22,
    standardTimeSec: 66,
    cycleTimeSec: 22.5,
    targetPerHour: 44,
    operationCapacityPcs: 352,
  },
  {
    id: 'opm-7',
    operationCode: 'OP-KN-07',
    operationName: 'Sleeve Attach to Armhole (Both sides)',
    operationSequence: 7,
    department: 'ASSEMBLY',
    machineType: '4-Thread Overlock',
    machineClass: 'Pegasus M900 Heavy',
    attachment: 'Synchronized Puller',
    skillLevel: 4,
    smv: 1.45,
    sam: 1.62,
    standardTimeSec: 87,
    cycleTimeSec: 22.0,
    targetPerHour: 33,
    operationCapacityPcs: 264,
  },
  {
    id: 'opm-8',
    operationCode: 'OP-KN-08',
    operationName: 'Side Seam Close with Care Label Insert',
    operationSequence: 8,
    department: 'ASSEMBLY',
    machineType: '4-Thread Overlock',
    machineClass: 'Pegasus M900 Heavy',
    attachment: 'Air Suction Thread Trimmer',
    skillLevel: 3,
    smv: 1.55,
    sam: 1.72,
    standardTimeSec: 93,
    cycleTimeSec: 23.8,
    targetPerHour: 31,
    operationCapacityPcs: 248,
  },
  {
    id: 'opm-9',
    operationCode: 'OP-KN-09',
    operationName: 'Bottom Hem Fold & Flatlock Stitch',
    operationSequence: 9,
    department: 'ASSEMBLY',
    machineType: 'Flatlock 3-Needle Cylinder Bed',
    machineClass: 'Yamato VC-3800',
    attachment: 'Cylinder Bed Circular Hemmer',
    skillLevel: 3,
    smv: 1.30,
    sam: 1.44,
    standardTimeSec: 78,
    cycleTimeSec: 25.2,
    targetPerHour: 37,
    operationCapacityPcs: 296,
  },
  {
    id: 'opm-10',
    operationCode: 'OP-KN-10',
    operationName: 'Bartack at Neck Joint & Side Seam Ends',
    operationSequence: 10,
    department: 'FINISHING',
    machineType: 'Electronic Bartack',
    machineClass: 'Brother KE-430FX',
    attachment: 'Standard Needle Clamp 28-Stitch',
    skillLevel: 2,
    smv: 0.60,
    sam: 0.67,
    standardTimeSec: 36,
    cycleTimeSec: 18.0,
    targetPerHour: 80,
    operationCapacityPcs: 640,
  },
  {
    id: 'opm-11',
    operationCode: 'OP-DN-01',
    operationName: 'Front Pocket Bag Prepare & Serging',
    operationSequence: 1,
    department: 'PREPARATION',
    machineType: '3-Thread Overlock',
    machineClass: 'Siruba 747K',
    attachment: 'Chain Cutter Suction',
    skillLevel: 2,
    smv: 1.20,
    sam: 1.35,
    standardTimeSec: 72,
    cycleTimeSec: 27.0,
    targetPerHour: 40,
    operationCapacityPcs: 320,
  },
  {
    id: 'opm-12',
    operationCode: 'OP-DN-02',
    operationName: 'Coin Pocket Attach & Rivet Marking',
    operationSequence: 2,
    department: 'PREPARATION',
    machineType: 'Double Needle Lockstitch (DNLS)',
    machineClass: 'Brother T-8420C',
    attachment: '1/4 Gauge Split Needle Bar',
    skillLevel: 3,
    smv: 0.85,
    sam: 0.95,
    standardTimeSec: 51,
    cycleTimeSec: 24.0,
    targetPerHour: 56,
    operationCapacityPcs: 448,
  },
  {
    id: 'opm-13',
    operationCode: 'OP-DN-03',
    operationName: 'Back Pocket Attach to Back Panel',
    operationSequence: 3,
    department: 'ASSEMBLY',
    machineType: 'Twin Needle Post Bed with Guide',
    machineClass: 'Juki LH-3568A',
    attachment: 'Laser Alignment Cross-Line',
    skillLevel: 4,
    smv: 2.10,
    sam: 2.35,
    standardTimeSec: 126,
    cycleTimeSec: 27.5,
    targetPerHour: 23,
    operationCapacityPcs: 184,
  },
  {
    id: 'opm-14',
    operationCode: 'OP-DN-04',
    operationName: 'Inseam Join with Double Lap Seam',
    operationSequence: 4,
    department: 'ASSEMBLY',
    machineType: 'Feed-off-the-Arm Chainstitch',
    machineClass: 'Union Special 35800',
    attachment: 'Lap Seam Folder Heavy 14oz',
    skillLevel: 4,
    smv: 2.20,
    sam: 2.46,
    standardTimeSec: 132,
    cycleTimeSec: 27.5,
    targetPerHour: 22,
    operationCapacityPcs: 176,
  },
  {
    id: 'opm-15',
    operationCode: 'OP-DN-05',
    operationName: 'Waistband Attach (Multi-Needle)',
    operationSequence: 5,
    department: 'ASSEMBLY',
    machineType: 'Kansai Special Waistband Machine',
    machineClass: 'Kansai DVK-1704PQ',
    attachment: 'Automatic Tension Strip Feeder',
    skillLevel: 4,
    smv: 2.80,
    sam: 3.12,
    standardTimeSec: 168,
    cycleTimeSec: 27.8,
    targetPerHour: 17,
    operationCapacityPcs: 136,
  },
];

// 25 & 26. Machine Management & Utilization Master Data
export const INITIAL_MACHINE_MASTERS: MachineMasterItem[] = [
  {
    id: 'mac-1',
    machineId: 'SNLS-01',
    machineType: 'Single Needle Lockstitch (SNLS)',
    machineGroup: 'SEWING',
    machineCategory: 'Lockstitch General',
    brand: 'Juki',
    model: 'DDL-9000C-SMS',
    serialNumber: 'JK-99482104',
    lineId: 'line-01',
    lineName: 'Sewing Line 01',
    operationName: 'Rib Collar Prepare & Loop Join',
    capacityRpm: 5000,
    status: 'RUNNING',
    availableMinutesDaily: 480,
    runningMinutes: 420,
    idleMinutes: 40,
    breakdownMinutes: 20,
    utilizationPercent: 87.5,
    machineEfficiency: 92.4,
    lastMaintenanceDate: '2026-09-18',
  },
  {
    id: 'mac-2',
    machineId: '4T-OVL-01',
    machineType: '4-Thread Overlock',
    machineGroup: 'SEWING',
    machineCategory: 'Overlock High-Speed',
    brand: 'Pegasus',
    model: 'M952-52-2X4',
    serialNumber: 'PG-4409128',
    lineId: 'line-01',
    lineName: 'Sewing Line 01',
    operationName: 'Shoulder Join (with Mobilon Tape)',
    capacityRpm: 7000,
    status: 'RUNNING',
    availableMinutesDaily: 480,
    runningMinutes: 445,
    idleMinutes: 35,
    breakdownMinutes: 0,
    utilizationPercent: 92.7,
    machineEfficiency: 95.1,
    lastMaintenanceDate: '2026-09-20',
  },
  {
    id: 'mac-3',
    machineId: 'FL-01',
    machineType: 'Flatlock 2-Needle 4-Thread',
    machineGroup: 'SEWING',
    machineCategory: 'Interlock Cylinder Bed',
    brand: 'Yamato',
    model: 'FD-62DR-01MR',
    serialNumber: 'YM-7810023',
    lineId: 'line-01',
    lineName: 'Sewing Line 01',
    operationName: 'Neck Topstitch / Binding',
    capacityRpm: 6000,
    status: 'RUNNING',
    availableMinutesDaily: 480,
    runningMinutes: 410,
    idleMinutes: 50,
    breakdownMinutes: 20,
    utilizationPercent: 85.4,
    machineEfficiency: 89.2,
    lastMaintenanceDate: '2026-09-12',
  },
  {
    id: 'mac-4',
    machineId: 'KANSAI-01',
    machineType: 'Kansai Special Waistband Machine',
    machineGroup: 'SEWING',
    machineCategory: 'Multi-Needle Specialized',
    brand: 'Kansai Special',
    model: 'DVK-1704PQ',
    serialNumber: 'KS-1200499',
    lineId: 'line-04',
    lineName: 'Sewing Line 04 (Denim)',
    operationName: 'Waistband Attach',
    capacityRpm: 4500,
    status: 'MAINTENANCE',
    availableMinutesDaily: 480,
    runningMinutes: 310,
    idleMinutes: 60,
    breakdownMinutes: 110,
    utilizationPercent: 64.6,
    machineEfficiency: 74.0,
    lastMaintenanceDate: '2026-09-28',
  },
  {
    id: 'mac-5',
    machineId: 'FOA-01',
    machineType: 'Feed-off-the-Arm Lap Seam',
    machineGroup: 'SEWING',
    machineCategory: 'Chainstitch Heavy',
    brand: 'Union Special',
    model: '35800 DNU',
    serialNumber: 'US-8834192',
    lineId: 'line-04',
    lineName: 'Sewing Line 04 (Denim)',
    operationName: 'Back Yoke Join & Inseam Join',
    capacityRpm: 4000,
    status: 'RUNNING',
    availableMinutesDaily: 480,
    runningMinutes: 430,
    idleMinutes: 40,
    breakdownMinutes: 10,
    utilizationPercent: 89.6,
    machineEfficiency: 91.8,
    lastMaintenanceDate: '2026-09-24',
  },
  {
    id: 'mac-6',
    machineId: 'BT-01',
    machineType: 'Electronic Bartack',
    machineGroup: 'FINISHING',
    machineCategory: 'Programmable Cyclic',
    brand: 'Brother',
    model: 'KE-430FX-01',
    serialNumber: 'BR-3329011',
    lineId: 'line-01',
    lineName: 'Sewing Line 01',
    operationName: 'Bartack at Neck Joint',
    capacityRpm: 3200,
    status: 'AVAILABLE',
    availableMinutesDaily: 480,
    runningMinutes: 390,
    idleMinutes: 90,
    breakdownMinutes: 0,
    utilizationPercent: 81.2,
    machineEfficiency: 96.0,
    lastMaintenanceDate: '2026-09-22',
  },
];

// 23. Operator Master Data
export const INITIAL_OPERATOR_MASTERS: OperatorMasterItem[] = [
  {
    id: 'op-user-1',
    operatorId: 'OP-4412',
    name: 'Rasheda Begum',
    department: 'SEWING',
    lineId: 'line-01',
    lineName: 'Sewing Line 01',
    primaryOperation: 'Shoulder Join (with Mobilon Tape)',
    skillLevel: 4,
    grade: 'A+',
    joiningDate: '2021-03-15',
    status: 'ACTIVE',
    attendanceStatus: 'PRESENT',
    efficiencyRate: 94.5,
    performanceRating: 108,
    multiSkillCount: 4,
  },
  {
    id: 'op-user-2',
    operatorId: 'OP-4489',
    name: 'Sharmin Akter',
    department: 'SEWING',
    lineId: 'line-01',
    lineName: 'Sewing Line 01',
    primaryOperation: 'Rib Collar Prepare & Loop Join',
    skillLevel: 2,
    grade: 'B',
    joiningDate: '2024-02-10',
    status: 'ACTIVE',
    attendanceStatus: 'PRESENT',
    efficiencyRate: 76.2,
    performanceRating: 92,
    multiSkillCount: 2,
  },
  {
    id: 'op-user-3',
    operatorId: 'OP-5102',
    name: 'Abdul Malek',
    department: 'SEWING',
    lineId: 'line-04',
    lineName: 'Sewing Line 04 (Denim)',
    primaryOperation: 'Inseam Join with Double Lap Seam',
    skillLevel: 4,
    grade: 'A',
    joiningDate: '2019-11-04',
    status: 'ACTIVE',
    attendanceStatus: 'PRESENT',
    efficiencyRate: 92.0,
    performanceRating: 110,
    multiSkillCount: 5,
  },
  {
    id: 'op-user-4',
    operatorId: 'OP-5140',
    name: 'Fatema Khatun',
    department: 'SEWING',
    lineId: 'line-01',
    lineName: 'Sewing Line 01',
    primaryOperation: 'Attach Rib Neck to Body',
    skillLevel: 4,
    grade: 'A+',
    joiningDate: '2020-07-22',
    status: 'ACTIVE',
    attendanceStatus: 'PRESENT',
    efficiencyRate: 96.2,
    performanceRating: 114,
    multiSkillCount: 4,
  },
  {
    id: 'op-user-5',
    operatorId: 'OP-5205',
    name: 'Nazmul Islam',
    department: 'SEWING',
    lineId: 'line-04',
    lineName: 'Sewing Line 04 (Denim)',
    primaryOperation: 'Waistband Attach (Kansai Special)',
    skillLevel: 3,
    grade: 'B',
    joiningDate: '2023-05-18',
    status: 'ACTIVE',
    attendanceStatus: 'PRESENT',
    efficiencyRate: 81.5,
    performanceRating: 96,
    multiSkillCount: 3,
  },
  {
    id: 'op-user-6',
    operatorId: 'OP-4991',
    name: 'Sultana Razia',
    department: 'SEWING',
    lineId: 'line-01',
    lineName: 'Sewing Line 01',
    primaryOperation: 'Neck Topstitch / Binding',
    skillLevel: 3,
    grade: 'A',
    joiningDate: '2022-01-14',
    status: 'ACTIVE',
    attendanceStatus: 'PRESENT',
    efficiencyRate: 88.0,
    performanceRating: 102,
    multiSkillCount: 3,
  },
];

// 24. Skill Matrix Master Data
export const INITIAL_SKILL_MATRIX: SkillMatrixItem[] = [
  {
    id: 'skm-1',
    operatorId: 'OP-4412',
    operatorName: 'Rasheda Begum',
    lineName: 'Sewing Line 01',
    operationCode: 'OP-KN-01',
    operationName: 'Shoulder Join (with Mobilon)',
    skillLevel: 4,
    trainingNeeded: false,
    certifiedDate: '2026-01-15',
  },
  {
    id: 'skm-2',
    operatorId: 'OP-4412',
    operatorName: 'Rasheda Begum',
    lineName: 'Sewing Line 01',
    operationCode: 'OP-KN-07',
    operationName: 'Sleeve Attach to Armhole',
    skillLevel: 4,
    trainingNeeded: false,
    certifiedDate: '2026-02-10',
  },
  {
    id: 'skm-3',
    operatorId: 'OP-4489',
    operatorName: 'Sharmin Akter',
    lineName: 'Sewing Line 01',
    operationCode: 'OP-KN-02',
    operationName: 'Rib Collar Prepare & Loop Join',
    skillLevel: 2,
    trainingNeeded: true,
    certifiedDate: '2026-04-01',
  },
  {
    id: 'skm-4',
    operatorId: 'OP-5140',
    operatorName: 'Fatema Khatun',
    lineName: 'Sewing Line 01',
    operationCode: 'OP-KN-03',
    operationName: 'Attach Rib Neck to Body',
    skillLevel: 4,
    trainingNeeded: false,
    certifiedDate: '2025-11-20',
  },
  {
    id: 'skm-5',
    operatorId: 'OP-4991',
    operatorName: 'Sultana Razia',
    lineName: 'Sewing Line 01',
    operationCode: 'OP-KN-04',
    operationName: 'Neck Topstitch / Binding',
    skillLevel: 3,
    trainingNeeded: false,
    certifiedDate: '2026-03-05',
  },
  {
    id: 'skm-6',
    operatorId: 'OP-5102',
    operatorName: 'Abdul Malek',
    lineName: 'Sewing Line 04',
    operationCode: 'OP-DN-04',
    operationName: 'Inseam Join with Double Lap Seam',
    skillLevel: 4,
    trainingNeeded: false,
    certifiedDate: '2025-09-12',
  },
];

// 02. Production Orders Master Data
export const INITIAL_PRODUCTION_ORDER_PLANS: ProductionOrderPlan[] = [
  {
    id: 'po-plan-1',
    orderNumber: 'PRD-ORD-2026-001',
    buyer: 'H&M Hennes & Mauritz',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    article: 'ART-TEE-COTTON-01',
    product: 'Crewneck Heavy Tee 220 GSM',
    productCategory: 'Knit Tops',
    color: 'Washed Black & Forest Green',
    size: 'S - XXL',
    sizeRange: 'S, M, L, XL, XXL',
    orderQuantity: 45000,
    plannedQuantity: 46350,
    productionStartDate: '2026-09-19',
    productionEndDate: '2026-10-14',
    deliveryDate: '2026-10-22',
    priority: 'HIGH',
    assignedLine: 'Sewing Line 01',
    assignedDepartment: 'SEWING',
    status: 'IN_PRODUCTION',
    remarks: 'Pre-production sample approved by H&M Gothenburg hub. 3% allowance buffer included.',
    createdAt: '2026-09-10T09:00:00Z',
  },
  {
    id: 'po-plan-2',
    orderNumber: 'PRD-ORD-2026-002',
    buyer: 'Inditex / Zara',
    style: 'STY-DN-502',
    po: 'PO-ZARA-4482',
    article: 'ART-DENIM-SLIM-12',
    product: 'Slim Fit Washed Indigo Denim Jeans 12oz',
    productCategory: 'Denim Bottoms',
    color: 'Medium Vintage Wash',
    size: '28 - 38',
    sizeRange: '28, 30, 32, 34, 36, 38',
    orderQuantity: 28000,
    plannedQuantity: 28840,
    productionStartDate: '2026-09-29',
    productionEndDate: '2026-10-28',
    deliveryDate: '2026-11-05',
    priority: 'URGENT',
    assignedLine: 'Sewing Line 04',
    assignedDepartment: 'SEWING',
    status: 'PLANNED',
    remarks: 'Kansai waistband special folder alignment check required before first production cut feed.',
    createdAt: '2026-09-15T11:00:00Z',
  },
  {
    id: 'po-plan-3',
    orderNumber: 'PRD-ORD-2026-003',
    buyer: 'PVH Tommy Hilfiger',
    style: 'STY-PL-889',
    po: 'PO-PVH-7729',
    article: 'ART-POLO-PIQUE-88',
    product: 'Pique Cotton Polo with Flat-Knit Collar',
    productCategory: 'Knit Tops',
    color: 'Classic Navy & Bright White',
    size: 'XS - XXL',
    sizeRange: 'XS, S, M, L, XL, XXL',
    orderQuantity: 32000,
    plannedQuantity: 32960,
    productionStartDate: '2026-10-05',
    productionEndDate: '2026-11-02',
    deliveryDate: '2026-11-12',
    priority: 'HIGH',
    assignedLine: 'Sewing Line 02',
    assignedDepartment: 'SEWING',
    status: 'RELEASED',
    remarks: 'Placket fusing interlining tests passed; flat-knit collar delivery verified at raw store.',
    createdAt: '2026-09-18T14:30:00Z',
  },
  {
    id: 'po-plan-4',
    orderNumber: 'PRD-ORD-2026-004',
    buyer: 'Target Corporation',
    style: 'STY-HD-109',
    po: 'PO-TGT-5501',
    article: 'ART-HOODIE-FLEECE-09',
    product: 'Heavyweight Brushed Fleece Pullover Hoodie',
    productCategory: 'Fleece Outerwear',
    color: 'Heather Grey',
    size: 'S - 3XL',
    sizeRange: 'S, M, L, XL, XXL, 3XL',
    orderQuantity: 20000,
    plannedQuantity: 20600,
    productionStartDate: '2026-10-15',
    productionEndDate: '2026-11-10',
    deliveryDate: '2026-11-20',
    priority: 'MEDIUM',
    assignedLine: 'Sewing Line 03',
    assignedDepartment: 'SEWING',
    status: 'DRAFT',
    remarks: 'Operation bulletin undergoing IE review for kangaroo pocket automated setting jig.',
    createdAt: '2026-09-22T10:15:00Z',
  },
];

// 04. Capacity Planning Master Data
export const INITIAL_CAPACITY_PLANS: CapacityPlanningRecord[] = [
  {
    id: 'cap-1',
    factoryName: 'Apex Horizon Apparel Plant A',
    floorName: 'Floor 2 (Knit Unit)',
    lineName: 'Sewing Line 01',
    periodMonth: 'October 2026',
    workingDays: 26,
    dailyWorkingMinutes: 480,
    activeLines: 1,
    totalOperators: 28,
    availableMinutes: 349440,
    requiredMinutes: 312000,
    capacityUtilizationPercent: 89.3,
    varianceMinutes: 37440,
    shortageOrExcess: 'EXCESS',
    capacityForecastPcs: 31200,
    orderBookedPcs: 28500,
    shipmentTargetPcs: 28000,
  },
  {
    id: 'cap-2',
    factoryName: 'Apex Horizon Denim Mill Unit B',
    floorName: 'Floor 1 (Denim Unit)',
    lineName: 'Sewing Line 04',
    periodMonth: 'October 2026',
    workingDays: 26,
    dailyWorkingMinutes: 480,
    activeLines: 1,
    totalOperators: 48,
    availableMinutes: 599040,
    requiredMinutes: 627200,
    capacityUtilizationPercent: 104.7,
    varianceMinutes: -28160,
    shortageOrExcess: 'SHORTAGE',
    capacityForecastPcs: 26700,
    orderBookedPcs: 28000,
    shipmentTargetPcs: 28000,
  },
  {
    id: 'cap-3',
    factoryName: 'Apex Horizon Apparel Plant A',
    floorName: 'Floor 2 (Knit Unit)',
    lineName: 'Sewing Line 02',
    periodMonth: 'October 2026',
    workingDays: 26,
    dailyWorkingMinutes: 480,
    activeLines: 1,
    totalOperators: 34,
    availableMinutes: 424320,
    requiredMinutes: 384000,
    capacityUtilizationPercent: 90.5,
    varianceMinutes: 40320,
    shortageOrExcess: 'BALANCED',
    capacityForecastPcs: 28200,
    orderBookedPcs: 25600,
    shipmentTargetPcs: 25000,
  },
];

// 05. Line Planning & Changeover Master Data
export const INITIAL_LINE_PLANS: LinePlanningRecord[] = [
  {
    id: 'lp-1',
    lineName: 'Sewing Line 01',
    lineType: 'KNIT',
    styleAllocation: 'STY-TS-2026',
    poAllocation: 'PO-HM-99201',
    buyerAllocation: 'H&M Hennes & Mauritz',
    allocatedOperators: 28,
    allocatedHelpers: 4,
    lineTargetDaily: 1800,
    lineEfficiency: 82.5,
    lineUtilization: 91.2,
    lineStatus: 'RUNNING',
    prevStyle: 'STY-TS-1800 (Basic Tee)',
    newStyle: 'STY-TS-2026 (Crewneck Heavy)',
    changeoverPlannedMinutes: 120,
    changeoverActualMinutes: 135,
    changeoverLostMinutes: 15,
    changeoverReason: 'Collar rib tensioner micro-adjustment',
    changeoverAction: 'Standardized folder jig pre-mounted on spare machine head',
  },
  {
    id: 'lp-2',
    lineName: 'Sewing Line 04',
    lineType: 'DENIM',
    styleAllocation: 'STY-DN-502',
    poAllocation: 'PO-ZARA-4482',
    buyerAllocation: 'Inditex / Zara',
    allocatedOperators: 48,
    allocatedHelpers: 6,
    lineTargetDaily: 950,
    lineEfficiency: 78.0,
    lineUtilization: 86.4,
    lineStatus: 'RUNNING',
    prevStyle: 'STY-DN-410 (Chino Pants)',
    newStyle: 'STY-DN-502 (Slim Jeans 12oz)',
    changeoverPlannedMinutes: 240,
    changeoverActualMinutes: 285,
    changeoverLostMinutes: 45,
    changeoverReason: 'Feed-off-the-arm heavy needle timing readjustment',
    changeoverAction: 'Maintenance team dedicated mechanic assigned 2h before transition',
  },
  {
    id: 'lp-3',
    lineName: 'Sewing Line 02',
    lineType: 'KNIT',
    styleAllocation: 'STY-PL-889',
    poAllocation: 'PO-PVH-7729',
    buyerAllocation: 'PVH Tommy Hilfiger',
    allocatedOperators: 34,
    allocatedHelpers: 5,
    lineTargetDaily: 1400,
    lineEfficiency: 80.2,
    lineUtilization: 88.0,
    lineStatus: 'SETUP',
    prevStyle: 'STY-TS-2026',
    newStyle: 'STY-PL-889',
    changeoverPlannedMinutes: 180,
    changeoverActualMinutes: 180,
    changeoverLostMinutes: 0,
    changeoverReason: 'Automated placket folder setup',
    changeoverAction: 'Laser guide template calibration performed on offline mock table',
  },
];

// 06. Manpower Planning Master Data
export const INITIAL_MANPOWER_PLANS: ManpowerPlanningRecord[] = [
  {
    id: 'mp-1',
    date: '2026-10-01',
    lineName: 'Sewing Line 01',
    plannedDirectOperators: 28,
    actualDirectOperators: 27,
    plannedHelpers: 4,
    actualHelpers: 4,
    supervisorCount: 1,
    qcAllocated: 2,
    ieAllocated: 1,
    absenteeCount: 1,
    absenteeismPercent: 3.6,
    manpowerGap: -1,
    utilizationPercent: 96.4,
  },
  {
    id: 'mp-2',
    date: '2026-10-01',
    lineName: 'Sewing Line 04',
    plannedDirectOperators: 48,
    actualDirectOperators: 46,
    plannedHelpers: 6,
    actualHelpers: 6,
    supervisorCount: 2,
    qcAllocated: 3,
    ieAllocated: 1,
    absenteeCount: 2,
    absenteeismPercent: 4.2,
    manpowerGap: -2,
    utilizationPercent: 95.8,
  },
  {
    id: 'mp-3',
    date: '2026-10-01',
    lineName: 'Sewing Line 02',
    plannedDirectOperators: 34,
    actualDirectOperators: 34,
    plannedHelpers: 5,
    actualHelpers: 5,
    supervisorCount: 1,
    qcAllocated: 2,
    ieAllocated: 1,
    absenteeCount: 0,
    absenteeismPercent: 0,
    manpowerGap: 0,
    utilizationPercent: 100.0,
  },
];

// 10. Method Study Master Data
export const INITIAL_METHOD_STUDIES: MethodStudyRecord[] = [
  {
    id: 'ms-1',
    studyNumber: 'MTH-2026-012',
    style: 'STY-TS-2026',
    operation: 'Back Neck Tape Attach & Folder',
    existingMethod: 'Operator manually cuts tape with hand scissors after finishing each piece, then reaches to right bin.',
    proposedMethod: 'Install pneumatic air cutter triggered by photo-sensor at throat plate; position disposal chute underneath table.',
    operationComparisonNotes: 'Eliminates 2 manual scissor pick/cut motions per cycle. Reduces worker wrist fatigue.',
    motionReductionPercent: 24.5,
    workstationAnalysis: 'Chute angle adjusted to 35 degrees gravity slide into bundle tray.',
    ergonomicReview: 'RULA score improved from 5 (Medium Risk) to 2 (Low Risk).',
    productivityImpactPercent: 14.8,
    qualityImpact: 'Zero jagged cut tape ends, 100% uniform tape overhang of 6mm.',
    costImpactMonthly: 3850,
    status: 'IMPLEMENTED',
  },
  {
    id: 'ms-2',
    studyNumber: 'MTH-2026-013',
    style: 'STY-DN-502',
    operation: 'Front Pocket Bag Prepare & Serging',
    existingMethod: 'Bundle placed on left floor trolley; operator lifts stacks of 20 pieces onto sewing table.',
    proposedMethod: 'Deploy spring-loaded self-leveling bin next to machine needle at table height.',
    operationComparisonNotes: 'Removes deep bending motion and torso twisting during bundle retrieval.',
    motionReductionPercent: 18.0,
    workstationAnalysis: 'Spring tension calibrated for 12oz denim stack weight (8kg max).',
    ergonomicReview: 'Back flexion eliminated entirely during work cycle.',
    productivityImpactPercent: 9.5,
    qualityImpact: 'Reduces fabric creasing prior to overlock stitch.',
    costImpactMonthly: 2400,
    status: 'APPROVED',
  },
];

// 11. Motion Study Master Data
export const INITIAL_MOTION_STUDIES: MotionStudyRecord[] = [
  {
    id: 'mot-1',
    motionId: 'MOT-01-A',
    operationCode: 'OP-KN-01',
    operationName: 'Shoulder Join (with Mobilon Tape)',
    motionElement: 'Pick front & back panels and align shoulder notch',
    motionType: 'VALUE_ADDED',
    motionTimeSec: 6.5,
    motionReductionPercent: 8,
    improvementAction: 'Add pneumatic fabric flap alignment guide',
    result: 'Reduced time from 6.5s to 5.8s',
  },
  {
    id: 'mot-2',
    motionId: 'MOT-01-B',
    operationCode: 'OP-KN-01',
    operationName: 'Shoulder Join (with Mobilon Tape)',
    motionElement: 'Reach for scissors to cut stray mobilon tail',
    motionType: 'UNNECESSARY',
    motionTimeSec: 4.2,
    motionReductionPercent: 100,
    improvementAction: 'Mount automatic suction blade on overlock needle plate',
    result: 'Completely eliminated motion element (0.0s)',
  },
  {
    id: 'mot-3',
    motionId: 'MOT-01-C',
    operationCode: 'OP-KN-01',
    operationName: 'Shoulder Join (with Mobilon Tape)',
    motionElement: 'Reposition cut bundle on back horse',
    motionType: 'NON_VALUE_ADDED',
    motionTimeSec: 3.8,
    motionReductionPercent: 50,
    improvementAction: 'Install gravity slider tray direct to next operator station',
    result: 'Reduced handling to 1.9s',
  },
];

// 13. Target Setting Master Data
export const INITIAL_TARGET_SETTINGS: TargetSettingRecord[] = [
  {
    id: 'tgt-1',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    smv: 11.2,
    workingMinutes: 480,
    manpower: 28,
    efficiencyPercent: 82,
    targetPerHour: 225,
    targetPerDay: 1800,
    targetPerShift: 1800,
  },
  {
    id: 'tgt-2',
    lineName: 'Sewing Line 04',
    style: 'STY-DN-502',
    po: 'PO-ZARA-4482',
    smv: 22.4,
    workingMinutes: 480,
    manpower: 48,
    efficiencyPercent: 78,
    targetPerHour: 119,
    targetPerDay: 950,
    targetPerShift: 950,
  },
  {
    id: 'tgt-3',
    lineName: 'Sewing Line 02',
    style: 'STY-PL-889',
    po: 'PO-PVH-7729',
    smv: 15.0,
    workingMinutes: 480,
    manpower: 34,
    efficiencyPercent: 80,
    targetPerHour: 175,
    targetPerDay: 1400,
    targetPerShift: 1400,
  },
];

// 14. Production Execution Master Data
export const INITIAL_PRODUCTION_EXECUTIONS: ProductionExecutionRecord[] = [
  {
    id: 'pe-1',
    date: '2026-10-01',
    shift: 'General Day Shift (08:00 - 17:00)',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    color: 'Washed Black',
    size: 'L',
    targetQty: 1800,
    actualQty: 1740,
    balanceQty: 60,
    achievementPercent: 96.7,
    efficiencyPercent: 79.5,
    wipQty: 320,
    reworkQty: 24,
    rejectionQty: 6,
  },
  {
    id: 'pe-2',
    date: '2026-10-01',
    shift: 'General Day Shift (08:00 - 17:00)',
    lineName: 'Sewing Line 04',
    style: 'STY-DN-502',
    po: 'PO-ZARA-4482',
    color: 'Vintage Wash',
    size: '32',
    targetQty: 950,
    actualQty: 890,
    balanceQty: 60,
    achievementPercent: 93.7,
    efficiencyPercent: 73.1,
    wipQty: 480,
    reworkQty: 38,
    rejectionQty: 11,
  },
];

// 15. Hourly Monitoring Master Data
export const INITIAL_HOURLY_MONITORING: HourlyMonitoringRecord[] = [
  {
    id: 'hr-1',
    date: '2026-10-01',
    hourSlot: '08:00 - 09:00',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    hourlyTarget: 225,
    hourlyActual: 198,
    difference: -27,
    achievementPercent: 88.0,
    currentWip: 280,
    downtimeMinutes: 8,
    downtimeReason: 'Morning briefing & mobilon spool replace',
    remarks: 'Slow startup during first 15 mins.',
    hasAlert: true,
    alertType: 'TARGET_BELOW_PLAN',
  },
  {
    id: 'hr-2',
    date: '2026-10-01',
    hourSlot: '09:00 - 10:00',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    hourlyTarget: 225,
    hourlyActual: 222,
    difference: -3,
    achievementPercent: 98.7,
    currentWip: 295,
    downtimeMinutes: 0,
    remarks: 'Line reached steady pace.',
  },
  {
    id: 'hr-3',
    date: '2026-10-01',
    hourSlot: '10:00 - 11:00',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    hourlyTarget: 225,
    hourlyActual: 231,
    difference: 6,
    achievementPercent: 102.7,
    currentWip: 310,
    downtimeMinutes: 0,
    remarks: 'Target exceeded; bottleneck station helper assisted.',
  },
  {
    id: 'hr-4',
    date: '2026-10-01',
    hourSlot: '11:00 - 12:00',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    hourlyTarget: 225,
    hourlyActual: 215,
    difference: -10,
    achievementPercent: 95.6,
    currentWip: 320,
    downtimeMinutes: 5,
    downtimeReason: 'Flatlock needle breakage',
    remarks: 'Mechanic replaced needle within 5 mins.',
  },
  {
    id: 'hr-5',
    date: '2026-10-01',
    hourSlot: '13:00 - 14:00',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    hourlyTarget: 225,
    hourlyActual: 228,
    difference: 3,
    achievementPercent: 101.3,
    currentWip: 305,
    downtimeMinutes: 0,
    remarks: 'Smooth flow after lunch break.',
  },
  {
    id: 'hr-6',
    date: '2026-10-01',
    hourSlot: '14:00 - 15:00',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    hourlyTarget: 225,
    hourlyActual: 220,
    difference: -5,
    achievementPercent: 97.8,
    currentWip: 315,
    downtimeMinutes: 0,
    remarks: 'Consistent output.',
  },
  {
    id: 'hr-7',
    date: '2026-10-01',
    hourSlot: '15:00 - 16:00',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    hourlyTarget: 225,
    hourlyActual: 216,
    difference: -9,
    achievementPercent: 96.0,
    currentWip: 310,
    downtimeMinutes: 0,
  },
  {
    id: 'hr-8',
    date: '2026-10-01',
    hourSlot: '16:00 - 17:00',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    hourlyTarget: 225,
    hourlyActual: 210,
    difference: -15,
    achievementPercent: 93.3,
    currentWip: 320,
    downtimeMinutes: 4,
    downtimeReason: 'End of shift line cleaning & bundle count',
    remarks: 'Daily total output: 1,740 pcs.',
  },
];

// 16. WIP Management Master Data
export const INITIAL_WIP_TRACKING: WipManagementRecord[] = [
  {
    id: 'wip-1',
    po: 'PO-HM-99201',
    style: 'STY-TS-2026',
    buyer: 'H&M Hennes & Mauritz',
    cuttingQty: 45000,
    inputQty: 44200,
    sewingQty: 42800,
    endlineQty: 42100,
    finishingQty: 40900,
    packingQty: 39800,
    reworkQty: 380,
    rejectionQty: 85,
    balanceQty: 5200,
    agingDays: 4,
    location: 'Building A, 2nd Floor In-Line Transit',
  },
  {
    id: 'wip-2',
    po: 'PO-ZARA-4482',
    style: 'STY-DN-502',
    buyer: 'Inditex / Zara',
    cuttingQty: 28000,
    inputQty: 26500,
    sewingQty: 24200,
    endlineQty: 23600,
    finishingQty: 21800,
    packingQty: 20500,
    reworkQty: 540,
    rejectionQty: 140,
    balanceQty: 7500,
    agingDays: 6,
    location: 'Building B, Washing & Finishing Buffer',
  },
  {
    id: 'wip-3',
    po: 'PO-PVH-7729',
    style: 'STY-PL-889',
    buyer: 'PVH Tommy Hilfiger',
    cuttingQty: 32000,
    inputQty: 31200,
    sewingQty: 29500,
    endlineQty: 29000,
    finishingQty: 27800,
    packingQty: 26500,
    reworkQty: 290,
    rejectionQty: 60,
    balanceQty: 5500,
    agingDays: 3,
    location: 'Building A, Floor 2 Preparation Bay',
  },
];

// 17. Production Loss Master Data
export const INITIAL_PRODUCTION_LOSSES: ProductionLossRecord[] = [
  {
    id: 'loss-1',
    date: '2026-10-01',
    lineName: 'Sewing Line 04',
    style: 'STY-DN-502',
    po: 'PO-ZARA-4482',
    lossCategory: 'MACHINE_BREAKDOWN',
    lostMinutes: 35,
    lostQuantity: 69,
    lossReason: 'Kansai waistband looper thread timing slip',
    responsibleDepartment: 'MAINTENANCE',
    correctiveAction: 'Replaced worn looper assembly and set screw.',
  },
  {
    id: 'loss-2',
    date: '2026-10-01',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    lossCategory: 'MATERIAL_SHORTAGE',
    lostMinutes: 20,
    lostQuantity: 75,
    lossReason: 'Matching thread cones delayed from raw store delivery',
    responsibleDepartment: 'WAREHOUSE',
    correctiveAction: 'Implemented 2-hour minimum safety stock buffer at line head.',
  },
  {
    id: 'loss-3',
    date: '2026-09-30',
    lineName: 'Sewing Line 02',
    style: 'STY-PL-889',
    po: 'PO-PVH-7729',
    lossCategory: 'LINE_CHANGEOVER',
    lostMinutes: 45,
    lostQuantity: 130,
    lossReason: 'Placket folding guide template alignment re-calibration',
    responsibleDepartment: 'INDUSTRIAL_ENGINEERING',
    correctiveAction: 'Fabricated fixed quick-release mounting bracket.',
  },
];

// 18. Downtime Management Master Data
export const INITIAL_DOWNTIME_RECORDS: DowntimeManagementRecord[] = [
  {
    id: 'dt-1',
    date: '2026-10-01',
    lineName: 'Sewing Line 04',
    machineId: 'KANSAI-01',
    downtimeType: 'MACHINE',
    plannedOrUnplanned: 'UNPLANNED',
    downtimeCategory: 'BREAKDOWN',
    durationMinutes: 35,
    mttrMinutes: 22,
    mtbfHours: 46.5,
    status: 'RESOLVED',
  },
  {
    id: 'dt-2',
    date: '2026-10-01',
    lineName: 'Sewing Line 01',
    machineId: 'FL-01',
    downtimeType: 'LINE',
    plannedOrUnplanned: 'UNPLANNED',
    downtimeCategory: 'MATERIAL_WAITING',
    durationMinutes: 20,
    mttrMinutes: 12,
    mtbfHours: 64.0,
    status: 'RESOLVED',
  },
  {
    id: 'dt-3',
    date: '2026-09-29',
    lineName: 'Sewing Line 02',
    machineId: 'APS-01',
    downtimeType: 'PROCESS',
    plannedOrUnplanned: 'PLANNED',
    downtimeCategory: 'MAINTENANCE',
    durationMinutes: 40,
    mttrMinutes: 35,
    mtbfHours: 120.0,
    status: 'RESOLVED',
  },
];

// 20. Quality Link Master Data
export const INITIAL_QUALITY_LINKS: ProductionQualityLink[] = [
  {
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    inspectedQty: 1740,
    defectQty: 24,
    dhuPercent: 1.38,
    rftPercent: 98.6,
    reworkPercent: 1.38,
    rejectionPercent: 0.34,
    linkedNcrId: 'NCR-2026-0081',
    linkedCapaId: 'CAPA-2026-0044',
  },
  {
    lineName: 'Sewing Line 04',
    style: 'STY-DN-502',
    po: 'PO-ZARA-4482',
    inspectedQty: 890,
    defectQty: 38,
    dhuPercent: 4.27,
    rftPercent: 95.7,
    reworkPercent: 4.27,
    rejectionPercent: 1.24,
    linkedNcrId: 'NCR-2026-0085',
  },
];

// 27. Rework Master Data
export const INITIAL_REWORK_RECORDS: ProductionReworkRecord[] = [
  {
    id: 'rwk-1',
    date: '2026-10-01',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    lineName: 'Sewing Line 01',
    operationName: 'Neck Topstitch / Binding',
    defectName: 'Skip Stitch on collar curve',
    quantity: 14,
    reason: 'Incorrect needle-to-looper clearance after bobbin thread change',
    responsibleProcess: 'SEWING_ASSEMBLY',
    startTime: '11:15',
    endTime: '12:00',
    status: 'COMPLETED',
  },
  {
    id: 'rwk-2',
    date: '2026-10-01',
    style: 'STY-DN-502',
    po: 'PO-ZARA-4482',
    lineName: 'Sewing Line 04',
    operationName: 'Waistband Attach',
    defectName: 'Uneven waistband overhang (>4mm variance)',
    quantity: 22,
    reason: 'Operator pulled waistband elastic unevenly',
    responsibleProcess: 'SEWING_ASSEMBLY',
    startTime: '14:30',
    endTime: '16:00',
    status: 'IN_PROGRESS',
  },
];

// 28. Rejection Master Data
export const INITIAL_REJECTION_RECORDS: ProductionRejectionRecord[] = [
  {
    id: 'rej-1',
    date: '2026-10-01',
    product: 'Crewneck Heavy Tee 220 GSM',
    style: 'STY-TS-2026',
    po: 'PO-HM-99201',
    processStage: 'SEWING_ENDLINE',
    defectName: 'Needle Cut / Fabric Rupture on Armhole',
    quantity: 6,
    unitCostUsd: 4.80,
    totalCostUsd: 28.80,
    reason: 'Burred needle tip punctured knit jersey yarns beyond repair',
    disposition: 'FABRIC_RECYCLE',
  },
  {
    id: 'rej-2',
    date: '2026-10-01',
    product: 'Slim Fit Washed Indigo Denim Jeans',
    style: 'STY-DN-502',
    po: 'PO-ZARA-4482',
    processStage: 'WASHING_INSPECTION',
    defectName: 'Severe uneven shade streaking across front panel',
    quantity: 11,
    unitCostUsd: 12.50,
    totalCostUsd: 137.50,
    reason: 'Chemical enzyme dosage spike in washer chamber #3',
    disposition: 'OFF_SPEC_CLEARANCE',
  },
];

// 29 & 31. Production Follow-Up & TNA Link Master Data
export const INITIAL_FOLLOW_UP_RECORDS: ProductionFollowUpRecord[] = [
  {
    id: 'pfu-1',
    orderNumber: 'PRD-ORD-2026-001',
    po: 'PO-HM-99201',
    buyer: 'H&M Hennes & Mauritz',
    style: 'STY-TS-2026',
    plannedQty: 45000,
    producedQty: 42800,
    balanceQty: 2200,
    shipmentDate: '2026-10-22',
    riskStatus: 'ON_TRACK',
    daysToShipment: 21,
    actionRequired: 'Maintain daily target of 1,800 pcs; packaging carton feed verified.',
  },
  {
    id: 'pfu-2',
    orderNumber: 'PRD-ORD-2026-002',
    po: 'PO-ZARA-4482',
    buyer: 'Inditex / Zara',
    style: 'STY-DN-502',
    plannedQty: 28000,
    producedQty: 24200,
    balanceQty: 3800,
    shipmentDate: '2026-11-05',
    riskStatus: 'PRODUCTION_DELAY',
    daysToShipment: 35,
    actionRequired: 'Line 04 running at 73% efficiency; IE intervention to balance waistband station.',
  },
  {
    id: 'pfu-3',
    orderNumber: 'PRD-ORD-2026-003',
    po: 'PO-PVH-7729',
    buyer: 'PVH Tommy Hilfiger',
    style: 'STY-PL-889',
    plannedQty: 32000,
    producedQty: 29500,
    balanceQty: 2500,
    shipmentDate: '2026-11-12',
    riskStatus: 'ON_TRACK',
    daysToShipment: 42,
    actionRequired: 'Normal line flow; QA inline audits passing at 1.4% DHU.',
  },
];

// 35. Kaizen & Continuous Improvement Master Data
export const INITIAL_KAIZEN_RECORDS: KaizenImprovementRecord[] = [
  {
    id: 'kz-1',
    kaizenNumber: 'KZ-2026-004',
    title: 'Automated Rib Neck Folder Jig Installation',
    category: 'SMV_REDUCTION',
    lineName: 'Sewing Line 01',
    style: 'STY-TS-2026',
    department: 'SEWING_ASSEMBLY',
    beforeSmv: 12.4,
    afterSmv: 11.2,
    beforeManpower: 30,
    afterManpower: 28,
    beforeEfficiency: 76.5,
    afterEfficiency: 82.5,
    beforeOutput: 1650,
    afterOutput: 1800,
    estimatedCostSavings: 6200,
    champion: 'Kamal Hossain (IE Executive)',
    status: 'STANDARDIZED',
    date: '2026-09-15',
  },
  {
    id: 'kz-2',
    kaizenNumber: 'KZ-2026-005',
    title: 'Denim Waistband In-Line Pre-Creasing Jig',
    category: 'LINE_BALANCE_IMPROVEMENT',
    lineName: 'Sewing Line 04',
    style: 'STY-DN-502',
    department: 'SEWING_PREPARATION',
    beforeSmv: 24.2,
    afterSmv: 22.4,
    beforeManpower: 52,
    afterManpower: 48,
    beforeEfficiency: 71.0,
    afterEfficiency: 78.0,
    beforeOutput: 820,
    afterOutput: 950,
    estimatedCostSavings: 11400,
    champion: 'Mohiuddin Ahmed (Senior IE)',
    status: 'IMPLEMENTED',
    date: '2026-09-24',
  },
];

// 41. Production Automatic Alerts Master Data
export const INITIAL_PRODUCTION_ALERTS: ProductionAlertItem[] = [
  {
    id: 'alt-1',
    timestamp: '2026-10-01 09:05',
    severity: 'WARNING',
    title: 'First Hour Target Below Plan (-12%)',
    message: 'Sewing Line 01 produced 198 pcs vs planned target of 225 pcs in Hour 1.',
    line: 'Sewing Line 01',
    type: 'PRODUCTION_BELOW_TARGET',
  },
  {
    id: 'alt-2',
    timestamp: '2026-10-01 10:15',
    severity: 'CRITICAL',
    title: 'Bottleneck Detected at Waistband Station',
    message: 'Cycle time (30.8s) exceeds line pitch time (28.0s) on Sewing Line 04.',
    line: 'Sewing Line 04',
    type: 'BOTTLENECK_DETECTED',
  },
  {
    id: 'alt-3',
    timestamp: '2026-10-01 11:20',
    severity: 'WARNING',
    title: 'High WIP Accumulation (>480 pcs)',
    message: 'Washing & finishing buffer on Line 04 exceeds 4-hour WIP threshold.',
    line: 'Sewing Line 04',
    type: 'EXCESS_WIP',
  },
  {
    id: 'alt-4',
    timestamp: '2026-10-01 13:40',
    severity: 'INFO',
    title: 'Changeover Completed Under Budget',
    message: 'Line 02 polo folder setup completed in 180 mins with 0 lost minutes.',
    line: 'Sewing Line 02',
    type: 'CHANGEOVER_EXCEEDED',
  },
];

// 40. Universal Audit Logs
export const INITIAL_AUDIT_LOGS: UniversalAuditRecord[] = [
  {
    id: 'aud-1',
    timestamp: '2026-10-01T08:15:00Z',
    action: 'UPDATE',
    entity: 'StyleOperationBulletin',
    recordIdentifier: 'STY-TS-2026 (OB v1.2)',
    performedBy: 'Kamal Hossain (IE Executive)',
    details: 'Adjusted pitch time from 25.0s to 24.0s based on Kaizen rib neck jig rollout.',
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-01T09:00:00Z',
    action: 'CREATE',
    entity: 'ProductionOrderPlan',
    recordIdentifier: 'PRD-ORD-2026-004',
    performedBy: 'Nasreen Jahan (Planning Head)',
    details: 'Initiated production order plan for Target PO-TGT-5501 (20,000 pcs).',
  },
  {
    id: 'aud-3',
    timestamp: '2026-09-30T16:30:00Z',
    action: 'APPROVE',
    entity: 'TimeStudy',
    recordIdentifier: 'TMS-2026-041',
    performedBy: 'Mohiuddin Ahmed (Senior IE)',
    details: 'Verified and approved SMV 0.65 min for Shoulder Join operation.',
  },
];

// Helper Functions for LocalStorage Persistence
const FACTORIES_STORAGE_KEY = 'erp_planning_factories_v1';
const LINES_STORAGE_KEY = 'erp_planning_lines_v1';
const MACHINES_STORAGE_KEY = 'erp_planning_machines_v1';
const OPERATORS_STORAGE_KEY = 'erp_planning_operators_v1';
const SKILLS_STORAGE_KEY = 'erp_planning_skills_v1';
const OPERATIONS_STORAGE_KEY = 'erp_planning_operations_v1';
const ORDERS_STORAGE_KEY = 'erp_planning_orders_v1';
const CAPACITY_STORAGE_KEY = 'erp_planning_capacity_v1';
const LINE_PLANS_STORAGE_KEY = 'erp_planning_line_plans_v1';
const MANPOWER_STORAGE_KEY = 'erp_planning_manpower_v1';
const METHOD_STORAGE_KEY = 'erp_planning_method_studies_v1';
const MOTION_STORAGE_KEY = 'erp_planning_motion_studies_v1';
const TARGETS_STORAGE_KEY = 'erp_planning_targets_v1';
const EXECUTIONS_STORAGE_KEY = 'erp_planning_executions_v1';
const HOURLY_STORAGE_KEY = 'erp_planning_hourly_v1';
const WIP_STORAGE_KEY = 'erp_planning_wip_v1';
const LOSSES_STORAGE_KEY = 'erp_planning_losses_v1';
const DOWNTIME_STORAGE_KEY = 'erp_planning_downtime_v1';
const QUALITY_STORAGE_KEY = 'erp_planning_quality_v1';
const REWORK_STORAGE_KEY = 'erp_planning_rework_v1';
const REJECTION_STORAGE_KEY = 'erp_planning_rejection_v1';
const FOLLOWUP_STORAGE_KEY = 'erp_planning_followup_v1';
const KAIZEN_STORAGE_KEY = 'erp_planning_kaizen_v1';
const ALERTS_STORAGE_KEY = 'erp_planning_alerts_v1';
const AUDIT_STORAGE_KEY = 'erp_planning_audit_v1';

function getOrInit<T>(key: string, initial: T[]): T[] {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return initial;
}

function saveOrDispatch<T>(key: string, data: T[], eventName: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event(eventName));
  } catch {
    // ignore
  }
}

export function getStoredLines(): ProductionLineMaster[] {
  return getOrInit(LINES_STORAGE_KEY, INITIAL_LINES);
}
export function saveStoredLines(lines: ProductionLineMaster[]): void {
  saveOrDispatch(LINES_STORAGE_KEY, lines, 'erp_lines_updated');
}

export function getStoredMachines(): MachineMasterItem[] {
  return getOrInit(MACHINES_STORAGE_KEY, INITIAL_MACHINE_MASTERS);
}
export function saveStoredMachines(machines: MachineMasterItem[]): void {
  saveOrDispatch(MACHINES_STORAGE_KEY, machines, 'erp_machines_updated');
}

export function getStoredOperators(): OperatorMasterItem[] {
  return getOrInit(OPERATORS_STORAGE_KEY, INITIAL_OPERATOR_MASTERS);
}
export function saveStoredOperators(operators: OperatorMasterItem[]): void {
  saveOrDispatch(OPERATORS_STORAGE_KEY, operators, 'erp_operators_updated');
}

export function getStoredSkillMatrix(): SkillMatrixItem[] {
  return getOrInit(SKILLS_STORAGE_KEY, INITIAL_SKILL_MATRIX);
}
export function saveStoredSkillMatrix(skills: SkillMatrixItem[]): void {
  saveOrDispatch(SKILLS_STORAGE_KEY, skills, 'erp_skills_updated');
}

export function getStoredOperations(): OperationMasterItem[] {
  return getOrInit(OPERATIONS_STORAGE_KEY, INITIAL_OPERATION_MASTERS);
}
export function saveStoredOperations(ops: OperationMasterItem[]): void {
  saveOrDispatch(OPERATIONS_STORAGE_KEY, ops, 'erp_operations_updated');
}

export function getStoredProductionOrders(): ProductionOrderPlan[] {
  return getOrInit(ORDERS_STORAGE_KEY, INITIAL_PRODUCTION_ORDER_PLANS);
}
export function saveStoredProductionOrders(orders: ProductionOrderPlan[]): void {
  saveOrDispatch(ORDERS_STORAGE_KEY, orders, 'erp_production_orders_updated');
}

export function getStoredCapacityPlans(): CapacityPlanningRecord[] {
  return getOrInit(CAPACITY_STORAGE_KEY, INITIAL_CAPACITY_PLANS);
}
export function saveStoredCapacityPlans(plans: CapacityPlanningRecord[]): void {
  saveOrDispatch(CAPACITY_STORAGE_KEY, plans, 'erp_capacity_updated');
}

export function getStoredLinePlans(): LinePlanningRecord[] {
  return getOrInit(LINE_PLANS_STORAGE_KEY, INITIAL_LINE_PLANS);
}
export function saveStoredLinePlans(plans: LinePlanningRecord[]): void {
  saveOrDispatch(LINE_PLANS_STORAGE_KEY, plans, 'erp_line_plans_updated');
}

export function getStoredManpowerPlans(): ManpowerPlanningRecord[] {
  return getOrInit(MANPOWER_STORAGE_KEY, INITIAL_MANPOWER_PLANS);
}
export function saveStoredManpowerPlans(plans: ManpowerPlanningRecord[]): void {
  saveOrDispatch(MANPOWER_STORAGE_KEY, plans, 'erp_manpower_updated');
}

export function getStoredMethodStudies(): MethodStudyRecord[] {
  return getOrInit(METHOD_STORAGE_KEY, INITIAL_METHOD_STUDIES);
}
export function saveStoredMethodStudies(studies: MethodStudyRecord[]): void {
  saveOrDispatch(METHOD_STORAGE_KEY, studies, 'erp_method_updated');
}

export function getStoredMotionStudies(): MotionStudyRecord[] {
  return getOrInit(MOTION_STORAGE_KEY, INITIAL_MOTION_STUDIES);
}
export function saveStoredMotionStudies(studies: MotionStudyRecord[]): void {
  saveOrDispatch(MOTION_STORAGE_KEY, studies, 'erp_motion_updated');
}

export function getStoredHourlyMonitoring(): HourlyMonitoringRecord[] {
  return getOrInit(HOURLY_STORAGE_KEY, INITIAL_HOURLY_MONITORING);
}
export function saveStoredHourlyMonitoring(records: HourlyMonitoringRecord[]): void {
  saveOrDispatch(HOURLY_STORAGE_KEY, records, 'erp_hourly_updated');
}

export function getStoredWipTracking(): WipManagementRecord[] {
  return getOrInit(WIP_STORAGE_KEY, INITIAL_WIP_TRACKING);
}
export function saveStoredWipTracking(records: WipManagementRecord[]): void {
  saveOrDispatch(WIP_STORAGE_KEY, records, 'erp_wip_updated');
}

export function getStoredProductionLosses(): ProductionLossRecord[] {
  return getOrInit(LOSSES_STORAGE_KEY, INITIAL_PRODUCTION_LOSSES);
}
export function saveStoredProductionLosses(records: ProductionLossRecord[]): void {
  saveOrDispatch(LOSSES_STORAGE_KEY, records, 'erp_losses_updated');
}

export function getStoredDowntimeRecords(): DowntimeManagementRecord[] {
  return getOrInit(DOWNTIME_STORAGE_KEY, INITIAL_DOWNTIME_RECORDS);
}
export function saveStoredDowntimeRecords(records: DowntimeManagementRecord[]): void {
  saveOrDispatch(DOWNTIME_STORAGE_KEY, records, 'erp_downtime_updated');
}

export function getStoredQualityLinks(): ProductionQualityLink[] {
  return getOrInit(QUALITY_STORAGE_KEY, INITIAL_QUALITY_LINKS);
}
export function saveStoredQualityLinks(records: ProductionQualityLink[]): void {
  saveOrDispatch(QUALITY_STORAGE_KEY, records, 'erp_quality_links_updated');
}

export function getStoredReworkRecords(): ProductionReworkRecord[] {
  return getOrInit(REWORK_STORAGE_KEY, INITIAL_REWORK_RECORDS);
}
export function saveStoredReworkRecords(records: ProductionReworkRecord[]): void {
  saveOrDispatch(REWORK_STORAGE_KEY, records, 'erp_rework_updated');
}

export function getStoredRejectionRecords(): ProductionRejectionRecord[] {
  return getOrInit(REJECTION_STORAGE_KEY, INITIAL_REJECTION_RECORDS);
}
export function saveStoredRejectionRecords(records: ProductionRejectionRecord[]): void {
  saveOrDispatch(REJECTION_STORAGE_KEY, records, 'erp_rejection_updated');
}

export function getStoredFollowUpRecords(): ProductionFollowUpRecord[] {
  return getOrInit(FOLLOWUP_STORAGE_KEY, INITIAL_FOLLOW_UP_RECORDS);
}
export function saveStoredFollowUpRecords(records: ProductionFollowUpRecord[]): void {
  saveOrDispatch(FOLLOWUP_STORAGE_KEY, records, 'erp_followup_updated');
}

export function getStoredKaizenRecords(): KaizenImprovementRecord[] {
  return getOrInit(KAIZEN_STORAGE_KEY, INITIAL_KAIZEN_RECORDS);
}
export function saveStoredKaizenRecords(records: KaizenImprovementRecord[]): void {
  saveOrDispatch(KAIZEN_STORAGE_KEY, records, 'erp_kaizen_updated');
}

export function getStoredProductionAlerts(): ProductionAlertItem[] {
  return getOrInit(ALERTS_STORAGE_KEY, INITIAL_PRODUCTION_ALERTS);
}
export function saveStoredProductionAlerts(alerts: ProductionAlertItem[]): void {
  saveOrDispatch(ALERTS_STORAGE_KEY, alerts, 'erp_alerts_updated');
}

export function getStoredAuditLogs(): UniversalAuditRecord[] {
  return getOrInit(AUDIT_STORAGE_KEY, INITIAL_AUDIT_LOGS);
}
export function saveStoredAuditLogs(logs: UniversalAuditRecord[]): void {
  saveOrDispatch(AUDIT_STORAGE_KEY, logs, 'erp_audit_updated');
}

export function addAuditLog(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'APPROVE' | 'EXPORT',
  entity: string,
  recordIdentifier: string,
  details: string,
  performedBy: string = 'Current User (IE & Planning Head)'
): void {
  const current = getStoredAuditLogs();
  const newLog: UniversalAuditRecord = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    entity,
    recordIdentifier,
    performedBy,
    details,
  };
  saveStoredAuditLogs([newLog, ...current]);
}
