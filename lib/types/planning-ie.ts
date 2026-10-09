import { ProductionSectionKey } from './modules';

export type GarmentType = 'T-Shirt' | 'Polo Shirt' | 'Denim Jeans' | 'Jacket' | 'Hoodie' | 'Woven Shirt' | 'Activewear';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ObApprovalStatus = 'DRAFT' | 'IE_REVIEW' | 'IE_MANAGER_APPROVAL' | 'ACTIVE' | 'REVISED' | 'OBSOLETE';

export type ProductionOrderStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'RELEASED'
  | 'IN_PRODUCTION'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export type MachineStatus = 'AVAILABLE' | 'RUNNING' | 'BREAKDOWN' | 'MAINTENANCE' | 'IDLE';

export type SkillLevelGrade = 0 | 1 | 2 | 3 | 4; // 0=Not Trained, 1=Trainee, 2=Basic, 3=Competent, 4=Expert

// 01. Hierarchy & Master Data
export interface FactoryMaster {
  id: string;
  name: string;
  code: string;
  location: string;
  totalBuildings: number;
  totalLines: number;
}

export interface BuildingMaster {
  id: string;
  factoryId: string;
  name: string;
  floorsCount: number;
}

export interface FloorMaster {
  id: string;
  buildingId: string;
  floorNumber: string;
  department: string;
}

export interface ProductionUnitMaster {
  id: string;
  name: string;
  code: string;
  capacityDailyPcs: number;
  activeLines: number;
}

export interface ProductionLineMaster {
  id: string;
  unitId: string;
  name: string;
  lineCode: string;
  lineType: 'KNIT' | 'WOVEN' | 'DENIM' | 'INTIMATE' | 'OUTERWEAR';
  floor: string;
  capacityOperators: number;
  capacityMachines: number;
  standardEfficiency: number;
  status: 'ACTIVE' | 'IDLE' | 'CHANGEOVER' | 'MAINTENANCE';
}

export interface ShiftMaster {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workingMinutes: number;
}

export interface WorkingCalendarDay {
  date: string;
  dayOfWeek: string;
  isWorkingDay: boolean;
  shift: string;
  holidayName?: string;
  notes?: string;
}

export interface MachineMasterItem {
  id: string;
  machineId: string;
  machineType: string;
  machineGroup: 'CUTTING' | 'SEWING' | 'FINISHING' | 'SPECIAL';
  machineCategory: string;
  brand: string;
  model: string;
  serialNumber: string;
  lineId: string;
  lineName: string;
  operationName: string;
  capacityRpm: number;
  status: MachineStatus;
  availableMinutesDaily: number;
  runningMinutes: number;
  idleMinutes: number;
  breakdownMinutes: number;
  utilizationPercent: number;
  machineEfficiency: number;
  lastMaintenanceDate: string;
  breakdownCountMonth: number;
}

export interface OperatorMasterItem {
  id: string;
  operatorId: string;
  name: string;
  department: string;
  lineId: string;
  lineName: string;
  primaryOperation: string;
  skillLevel: SkillLevelGrade;
  grade: 'A+' | 'A' | 'B' | 'C' | 'TRAINEE';
  joiningDate: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE';
  efficiencyRate: number;
  performanceRating: number;
  multiSkillCount: number;
  skillGrade: string;
  avgEfficiencyPercent: number;
  dhuPercent: number;
  attendancePercent: number;
}

export interface SkillMatrixItem {
  id: string;
  operatorId: string;
  operatorName: string;
  lineName: string;
  operationCode: string;
  operationName: string;
  skillLevel: SkillLevelGrade; // 0 to 4
  trainingNeeded: boolean;
  certifiedDate?: string;
  cycleTimeSec: number;
  efficiencyPercent: number;
}

export interface OperationMasterItem {
  id: string;
  operationCode: string;
  operationName: string;
  operationSequence: number;
  department: 'CUTTING' | 'PREPARATION' | 'ASSEMBLY' | 'FINISHING' | 'PACKING';
  machineType: string;
  machineClass: string;
  attachment: string;
  skillLevel: SkillLevelGrade;
  smv: number;
  sam: number;
  standardTimeSec: number;
  cycleTimeSec: number;
  targetPerHour: number;
  operationCapacityPcs: number;
}

// 02. Production Order
export interface ProductionOrderPlan {
  id: string;
  orderNumber: string;
  buyer: string;
  style: string;
  po: string;
  article: string;
  product: string;
  productCategory: string;
  color: string;
  size: string;
  sizeRange: string;
  orderQuantity: number;
  plannedQuantity: number;
  productionStartDate: string;
  productionEndDate: string;
  deliveryDate: string;
  priority: PriorityLevel;
  assignedLine: string;
  assignedDepartment: string;
  status: ProductionOrderStatus;
  remarks?: string;
  createdAt: string;
  // Commercial ERP & Cross-Module Sync Fields
  buyerOrderId?: string;
  fabricStatus?: string;
  cuttingStatus?: string;
  smv?: number;
  fobPrice?: number;
  syncSource?: string;
  isSyncedWithBuyerOrder?: boolean;
  fabricReadinessPercent?: number;
}

// 03. Production Planning & Scheduling
export interface ProductionPlanSchedule {
  id: string;
  lineId: string;
  lineName: string;
  orderNumber: string;
  buyerName: string;
  styleNumber: string;
  styleDescription: string;
  orderQuantity: number;
  smv: number;
  allocatedOperators: number;
  plannedDailyTarget: number;
  startDate: string;
  endDate: string;
  daysRequired: number;
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'DELAYED';
  learningCurveRampUp: {
    day1Percent: number;
    day2Percent: number;
    day3Percent: number;
    day4PlusPercent: number;
  };
  notes?: string;
  actualProducedQty?: number;
  planVsActualPercent?: number;
  // Commercial PPC Fields
  buyerOrderId?: string;
  fabricStatus?: string;
  targetEfficiency?: number;
  pitchTimeSec?: number;
  dailyRampUpPcs?: { day1: number; day2: number; day3: number; day4: number };
}

// 04. Capacity Planning
export interface CapacityPlanningRecord {
  id: string;
  factoryName: string;
  floorName: string;
  lineName: string;
  periodMonth: string;
  workingDays: number;
  dailyWorkingMinutes: number;
  activeLines: number;
  totalOperators: number;
  availableMinutes: number;
  requiredMinutes: number;
  capacityUtilizationPercent: number;
  varianceMinutes: number;
  shortageOrExcess: 'EXCESS' | 'BALANCED' | 'SHORTAGE';
  capacityForecastPcs: number;
  orderBookedPcs: number;
  shipmentTargetPcs: number;
}

// 05. Line Planning & Changeover
export interface LinePlanningRecord {
  id: string;
  lineName: string;
  lineType: string;
  styleAllocation: string;
  poAllocation: string;
  buyerAllocation: string;
  allocatedOperators: number;
  allocatedHelpers: number;
  lineTargetDaily: number;
  lineEfficiency: number;
  lineUtilization: number;
  lineStatus: 'RUNNING' | 'CHANGEOVER' | 'IDLE' | 'SETUP';
  prevStyle?: string;
  newStyle?: string;
  changeoverPlannedMinutes?: number;
  changeoverActualMinutes?: number;
  changeoverLostMinutes?: number;
  changeoverReason?: string;
  changeoverAction?: string;
}

// 06. Manpower Planning
export interface ManpowerPlanningRecord {
  id: string;
  date: string;
  lineName: string;
  plannedDirectOperators: number;
  actualDirectOperators: number;
  plannedHelpers: number;
  actualHelpers: number;
  supervisorCount: number;
  qcAllocated: number;
  ieAllocated: number;
  absenteeCount: number;
  absenteeismPercent: number;
  manpowerGap: number;
  utilizationPercent: number;
}

// 07 & 08. Operation Bulletin (OB)
export interface OperationBulletinItem {
  id: string;
  seqNumber: number;
  operationCode?: string;
  operationName: string;
  section: 'PREPARATION' | 'ASSEMBLY' | 'FINISHING';
  machineType: string;
  machineCode: string;
  machineClass?: string;
  attachment?: string;
  smv: number; // Standard Minute Value
  sam?: number;
  skillLevel?: SkillLevelGrade;
  theoreticalOperators: number;
  allocatedOperators: number;
  cycleTimeSec: number;
  pitchTimeSec: number;
  targetPerHour?: number;
  workstation?: string;
  isBottleneck?: boolean;
  remarks?: string;
}

export interface StyleOperationBulletin {
  id: string;
  obNumber?: string;
  styleNumber: string;
  styleDescription: string;
  buyerName: string;
  poNumber?: string;
  color?: string;
  sizeRange?: string;
  garmentType: GarmentType;
  version?: string;
  approvalStatus?: ObApprovalStatus;
  approvedBy?: string;
  approvalDate?: string;
  totalSmv: number;
  totalSam?: number;
  targetLineOperators: number;
  linePitchTimeSec: number;
  taktTimeSec?: number;
  targetEfficiency: number;
  plannedDailyOutput: number;
  balancingEfficiency: number; // %
  operations: OperationBulletinItem[];
  createdAt: string;
  updatedAt: string;
}

// 09. Time Study
export interface TimeMotionStudy {
  id: string;
  studyCode: string;
  studyNumber?: string;
  styleNumber?: string;
  date: string;
  lineName: string;
  operatorName: string;
  operatorId: string;
  operationName: string;
  machineType: string;
  observer?: string;
  cycleTimesSec: [number, number, number, number, number]; // 5 cycles
  avgCycleTimeSec: number;
  performanceRatingPercent: number; // e.g. 105%
  ratingFactor?: number; // e.g. 1.05
  basicTimeSec?: number;
  normalTimeSec?: number;
  allowancePercent: number; // e.g. 15%
  standardTimeSec?: number;
  standardMinuteValue: number; // SMV in minutes
  sam?: number;
  status: 'VERIFIED' | 'NEEDS_TRAINING' | 'BENCHMARK_EXCEEDED';
  approvalStatus?: 'DRAFT' | 'REVIEWED' | 'APPROVED';
  studiedBy: string;
}

// 10. Method Study
export interface MethodStudyRecord {
  id: string;
  studyNumber: string;
  style: string;
  operation: string;
  existingMethod: string;
  proposedMethod: string;
  operationComparisonNotes: string;
  motionReductionPercent: number;
  workstationAnalysis: string;
  ergonomicReview: string;
  productivityImpactPercent: number;
  qualityImpact: string;
  costImpactMonthly: number;
  status: 'EVALUATING' | 'APPROVED' | 'IMPLEMENTED';
}

// 11. Motion Study
export interface MotionStudyRecord {
  id: string;
  motionId: string;
  operationCode: string;
  operationName: string;
  motionElement: string;
  motionType: 'VALUE_ADDED' | 'NON_VALUE_ADDED' | 'UNNECESSARY';
  motionTimeSec: number;
  motionReductionPercent: number;
  improvementAction: string;
  result: string;
}

// 13 & 14 & 15. Target Setting, Production Execution & Hourly Monitoring
export interface TargetSettingRecord {
  id: string;
  lineName: string;
  section?: string; // e.g. 'Cutting Floor', 'Sewing Floor', 'Finishing Floor', etc.
  sectionKey?: ProductionSectionKey;
  style: string;
  po: string;
  smv: number;
  workingMinutes: number;
  manpower: number;
  efficiencyPercent: number;
  targetPerHour: number;
  targetPerDay: number;
  targetPerShift: number;
}

export interface ProductionExecutionRecord {
  id: string;
  date: string;
  shift: string;
  lineName: string;
  section?: string;
  style: string;
  po: string;
  color: string;
  size: string;
  targetQty: number;
  actualQty: number;
  balanceQty: number;
  achievementPercent: number;
  efficiencyPercent: number;
  wipQty: number;
  reworkQty: number;
  rejectionQty: number;
}

export interface HourlyMonitoringRecord {
  id: string;
  date: string;
  hourSlot: string; // e.g. "08:00 - 09:00"
  lineName: string;
  section?: string;
  sectionKey?: ProductionSectionKey;
  style: string;
  po: string;
  hourlyTarget: number;
  hourlyActual: number;
  difference: number;
  achievementPercent: number;
  currentWip: number;
  downtimeMinutes: number;
  downtimeReason?: string;
  remarks?: string;
  hasAlert?: boolean;
  alertType?: 'TARGET_BELOW_PLAN' | 'LINE_STOPPED' | 'HIGH_WIP' | 'LOW_EFFICIENCY';
}

// 16. WIP Management
export interface WipManagementRecord {
  id: string;
  po: string;
  style: string;
  buyer: string;
  cuttingQty: number;
  inputQty: number;
  sewingQty: number;
  endlineQty: number;
  finishingQty: number;
  packingQty: number;
  reworkQty: number;
  rejectionQty: number;
  balanceQty: number;
  agingDays: number;
  location: string;
}

// 17 & 18. Production Loss & Downtime Management
export interface ProductionLossRecord {
  id: string;
  date: string;
  lineName: string;
  style: string;
  po: string;
  lossCategory:
    | 'MACHINE_BREAKDOWN'
    | 'MATERIAL_SHORTAGE'
    | 'MANPOWER_SHORTAGE'
    | 'QUALITY_PROBLEM'
    | 'STYLE_CHANGE'
    | 'LINE_CHANGEOVER'
    | 'WAITING_TIME'
    | 'POWER_FAILURE'
    | 'MAINTENANCE'
    | 'MEETING_TIME'
    | 'OTHER';
  lostMinutes: number;
  lostQuantity: number;
  lossReason: string;
  responsibleDepartment: string;
  correctiveAction: string;
}

export interface DowntimeManagementRecord {
  id: string;
  date: string;
  lineName: string;
  machineId: string;
  downtimeType: 'MACHINE' | 'LINE' | 'PROCESS';
  plannedOrUnplanned: 'PLANNED' | 'UNPLANNED';
  downtimeCategory: 'BREAKDOWN' | 'MATERIAL_WAITING' | 'QUALITY_WAITING' | 'MANPOWER_WAITING' | 'MAINTENANCE';
  durationMinutes: number;
  mttrMinutes: number;
  mtbfHours: number;
  status: 'RESOLVED' | 'UNDER_REPAIR' | 'ESCALATED';
}

// 20, 27, 28. Quality Link, Rework & Rejection
export interface ProductionQualityLink {
  lineName: string;
  style: string;
  po: string;
  inspectedQty: number;
  defectQty: number;
  dhuPercent: number;
  rftPercent: number;
  reworkPercent: number;
  rejectionPercent: number;
  linkedNcrId?: string;
  linkedCapaId?: string;
  unitName?: string;
  qualityController?: string;
  lineChief?: string;
}

export interface ProductionReworkRecord {
  id: string;
  date: string;
  style: string;
  po: string;
  lineName: string;
  operationName: string;
  defectName: string;
  quantity: number;
  reason: string;
  responsibleProcess: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface ProductionRejectionRecord {
  id: string;
  date: string;
  product: string;
  style: string;
  po: string;
  processStage: string;
  defectName: string;
  quantity: number;
  unitCostUsd: number;
  totalCostUsd: number;
  reason: string;
  disposition: 'SCRAP' | 'FABRIC_RECYCLE' | 'OFF_SPEC_CLEARANCE';
}

// 29 & 31. Production Follow-Up & TNA Link
export interface ProductionFollowUpRecord {
  id: string;
  orderNumber: string;
  po: string;
  buyer: string;
  style: string;
  plannedQty: number;
  producedQty: number;
  balanceQty: number;
  shipmentDate: string;
  riskStatus: 'ON_TRACK' | 'SHIPMENT_RISK' | 'CAPACITY_RISK' | 'PRODUCTION_DELAY';
  daysToShipment: number;
  actionRequired: string;
}

// 35. IE Improvement (Kaizen)
export interface KaizenImprovementRecord {
  id: string;
  kaizenNumber: string;
  title: string;
  category:
    | 'PRODUCTIVITY_IMPROVEMENT'
    | 'METHOD_IMPROVEMENT'
    | 'MOTION_REDUCTION'
    | 'SMV_REDUCTION'
    | 'MANPOWER_REDUCTION'
    | 'LINE_BALANCE_IMPROVEMENT'
    | 'COST_SAVING';
  lineName: string;
  style: string;
  department: string;
  beforeSmv: number;
  afterSmv: number;
  beforeManpower: number;
  afterManpower: number;
  beforeEfficiency: number;
  afterEfficiency: number;
  beforeOutput: number;
  afterOutput: number;
  estimatedCostSavings: number;
  champion: string;
  status: 'IDEA' | 'TRIAL' | 'IMPLEMENTED' | 'STANDARDIZED';
  date: string;
}

// 41. Automatic Alerts
export interface ProductionAlertItem {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  line: string;
  type:
    | 'PRODUCTION_BELOW_TARGET'
    | 'EFFICIENCY_BELOW_TARGET'
    | 'HIGH_DHU'
    | 'HIGH_REWORK'
    | 'HIGH_REJECTION'
    | 'EXCESS_WIP'
    | 'LINE_DOWNTIME'
    | 'MACHINE_BREAKDOWN'
    | 'CAPACITY_SHORTAGE'
    | 'MANPOWER_SHORTAGE'
    | 'SHIPMENT_RISK'
    | 'PRODUCTION_DELAY'
    | 'SKILL_SHORTAGE'
    | 'BOTTLENECK_DETECTED'
    | 'CHANGEOVER_EXCEEDED';
  isDismissed?: boolean;
}

// 40. Universal Audit Trail
export interface UniversalAuditRecord {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'APPROVE' | 'EXPORT';
  entity: string;
  recordIdentifier: string;
  performedBy: string;
  details: string;
}

