export type Role = 
  | 'ADMIN' 
  | 'QA_MANAGER' 
  | 'WAREHOUSE_INSPECTOR' 
  | 'PRODUCTION_HEAD' 
  | 'OPERATOR'
  | 'Super Admin'
  | 'QC Manager'
  | 'Inspector'
  | 'Viewer'
  | (string & {});

export type QualityGrade = 'GRADE_A' | 'GRADE_B' | 'REJECTED' | 'ON_HOLD';

export type StockStatus = 'IN_STOCK' | 'INSPECTING' | 'ALLOCATED' | 'DISPATCHED';

export type InspectionStage = 
  | 'FABRIC_INWARD' 
  | 'CUTTING_INSPECTION' 
  | 'SEWING_IN_LINE' 
  | 'END_LINE_QC' 
  | 'FINISHING_PACKING';

export type InspectionStatus = 'PASSED' | 'REJECTED' | 'CONDITIONAL_PASS';

export type DefectSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: Role;
  department: string;
  avatarUrl?: string;
  isSuperAdmin?: boolean;
  phone?: string;
  designation?: string;
  employeeId?: string;
  factoryUnit?: string;
  workShift?: string;
  emergencyContact?: string;
  timezone?: string;
  language?: string;
  bio?: string;
}

export interface AppUser extends UserSession {
  username: string;
  password: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}


export type MaterialCategory = 
  | 'FABRIC' 
  | 'SEWING_THREAD' 
  | 'TRIMS_BUTTONS' 
  | 'ZIPPERS' 
  | 'INTERLINING_ELASTIC' 
  | 'LABELS_PACKAGING' 
  | 'CHEMICALS_DYES';

export interface InventoryItem {
  id: string;
  sku: string;
  category?: MaterialCategory;
  styleNumber: string;
  fabricType: string; // Used as Material / Item Description
  color: string;
  batchLot: string;
  rollCount: number;
  quantityMeters: number; // Primary stock quantity
  unit?: string; // 'Meters', 'Yards', 'Cones', 'Gross', 'Pcs', 'Kgs', 'Rolls'
  allocatedQty?: number;
  reorderLevel?: number;
  qualityGrade: QualityGrade;
  warehouseLocation: string;
  status: StockStatus;
  unitCost: number;
  updatedBy: string;
  lastUpdatedAt: string;
  createdAt: string;
  supplierName?: string;
  buyerOrderId?: string;
  buyerName?: string;
  poNumber?: string;
  bomItemId?: string;
  linkedOrderNumber?: string;
  gsm?: number;
  widthInches?: number;
  shrinkagePercent?: string;
  deltaE?: number;
  fourPointScore?: number;
  barcode?: string;
  rollWeightKg?: number;
  inspectorName?: string;
  dyeingMethod?: string;
  yarnCount?: string;
  weavingType?: string;
  shadeLot?: string;
}

export interface ReceiveRecord {
  id: string;
  grnNumber: string; // e.g. GRN-2026-0891
  date: string;
  itemId?: string;
  sku: string;
  category: MaterialCategory;
  itemName: string;
  supplierName: string;
  poNumber: string;
  challanNumber: string;
  receivedQty: number;
  unit: string;
  rollsReceived?: number;
  batchLot: string;
  qcStatus: 'PASSED' | 'CONDITIONAL' | 'QUARANTINE' | 'REJECTED';
  qualityGrade: QualityGrade;
  warehouseLocation: string;
  receivedBy: string;
  inspectedBy?: string;
  notes?: string;
  buyerOrderId?: string;
  buyerName?: string;
  styleNumber?: string;
  bomItemId?: string;
  bomItemCode?: string;
}

export interface IssueRecord {
  id: string;
  sivNumber: string; // e.g. SIV-2026-0422
  date: string;
  itemId: string;
  sku: string;
  category: MaterialCategory;
  itemName: string;
  issuedTo: 'CUTTING_FLOOR' | 'SEWING_LINE' | 'FINISHING_DEPT' | 'SAMPLE_SECTION';
  departmentDetail: string; // e.g. 'Sewing Line 04', 'Cutting Table 02'
  poNumber: string;
  styleNumber: string;
  requisitionNumber: string;
  issuedQty: number;
  unit: string;
  issuedBy: string;
  receivedByFloor: string;
  purpose: string;
  rollsIssued?: number;
  buyerName?: string;
  approvedBy?: string;
  notes?: string;
}

export type InspectionType = 'INLINE' | 'PRE_FINAL' | 'FINAL';

export interface DefectItem {
  id: string;
  defectType: string;
  severity: DefectSeverity;
  count: number;
  location: string;
}

export interface MeasurementAuditItem {
  id: string;
  point: string;
  spec: number;
  actual: number;
  tol: string;
  result: 'PASS' | 'FAIL';
  size?: string;
  pointOfMeasure?: string;
  specValue?: number;
  tolerance?: string;
  actualValue?: number;
  deviation?: number;
  status?: 'PASS' | 'FAIL';
}

export interface CheckpointItem {
  id: string;
  category: string;
  checkpoint: string;
  status: 'PASS' | 'FAIL' | 'NA';
  notes?: string;
}

export interface CombinedPoItem {
  poNumber: string;
  orderQuantity: number;
  cartonCount?: number;
  styleNumber?: string;
  colorOrDestination?: string;
}

export interface InspectionSizeBreakdownItem {
  id?: string;
  size: string;
  orderQuantity: number;
  inspectedQuantity: number; // Presented lot quantity for this size (can be plus/short)
  samplePickupQuantity: number; // Auto-calculated proportional to total sample size, editable
  defectCount?: number;
  passedCount?: number;
  status?: 'PASS' | 'FAIL' | 'PENDING';
  cartonCount?: number;
  colorName?: string;
  notes?: string;
}

export interface InspectionRecord {
  id: string;
  inspectionCode: string;
  inspectionType?: InspectionType;
  orderNumber?: string;
  poNumbers?: string[];
  combinedOrders?: CombinedPoItem[];
  isCombinedInspection?: boolean;
  buyerOrderId?: string;
  styleNumber: string;
  styleDescription?: string;
  lotNumber: string;
  stage: InspectionStage;
  sampleSize: number;
  orderQuantity?: number;
  lotQuantity?: number;
  excessQuantity?: number; // Calculated overproduction (if lotQuantity > orderQuantity)
  shortQuantity?: number; // Calculated shortage (if lotQuantity < orderQuantity)
  quantityVariance?: number; // lotQuantity - orderQuantity
  sizeBreakdown?: InspectionSizeBreakdownItem[]; // Size-wise breakdown with order, inspected, and sample pickups
  aqlCodeLetter?: string; // ISO 2859-1 Code letter (e.g. 'A' through 'Q')
  maxAllowedMajor?: number; // AQL Major acceptance limit (Ac)
  majorRejectionPoint?: number; // AQL Major rejection limit (Re)
  maxAllowedMinor?: number; // AQL Minor acceptance limit (Ac)
  minorRejectionPoint?: number; // AQL Minor rejection limit (Re)
  maxAllowedCritical?: number; // AQL Critical acceptance limit (always 0)
  cartonCount?: number;
  packedPercent?: number;
  aqlLevel?: string;
  passCount: number;
  defectCount: number;
  majorDefects: number;
  minorDefects: number;
  criticalDefects: number;
  status: InspectionStatus;
  inspectorId: string;
  inspectorName: string;
  buyer: string;
  sewingLine?: string;
  factoryUnit?: string;
  unit?: string;
  section?: string;
  lineId?: string;
  shift?: string;
  remarks?: string;
  correctiveAction?: string;
  inspectorSignature?: string;
  createdAt: string;
  defects?: DefectItem[];
  measurements?: MeasurementAuditItem[];
  checkpoints?: CheckpointItem[];
}

export type LineStatus = 'RUNNING' | 'COMPLETED' | 'PAUSED';

export interface DefectCountEntry {
  defectType: string;
  count: number;
}

export interface TopDefectSummary {
  defectType: string;
  count: number;
  percentage: number;
}

export interface HourlyReportEntry {
  id: string;
  hourSlot: string; // e.g. "08:00 - 09:00", "09:00 - 10:00"
  targetQty: number; // Target production for this hour
  checkedQty: number; // Total inspected pieces count for this hour
  passedQty: number; // Good pieces passed
  defectQty: number; // Defective pieces found (sum of defectBreakdown counts - repairable)
  rejectQty?: number; // Unrecoverable scrap pieces (cannot be repaired, excluded from production)
  repairedQty?: number; // Defective pieces repaired and added to good production
  defectRate: number; // Defect rate / DHU %: (defectQty / checkedQty) * 100
  rftRate?: number; // Right First Time %: ((checkedQty - defectQty - (rejectQty || 0)) / checkedQty) * 100
  defectBreakdown?: DefectCountEntry[]; // Granular list of which defects occurred and their counts
  topDefect?: string; // Common apparel defect name (e.g., "Skip Stitch", "Puckering")
  operatorId?: string; // Operator / workstation ID
  remarks?: string; // Supervisor or QC notes
  hour?: number | string;
  timeSlot?: string;
  target?: number;
  actual?: number;
  efficiency?: number;
  dhuRate?: number;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  recordDate?: string; // Date of the production / QC record (e.g., "2026-09-21")
  shift?: string; // Working shift (e.g., "Shift A (Morning)", "Shift B (Evening)", "General")
  buyer: string;
  styleName: string;
  styleNumber?: string;
  itemInfo?: string; // Item / fabric description pulled from buyer order BOM
  smvTarget?: number; // Standard Minute Value (SMV) Target
  unit?: string; // Manufacturing Unit / Plant (e.g., 'Unit 01', 'Unit 02')
  section?: string; // Manufacturing Section (e.g., 'Sewing Line 04', 'Cutting Floor')
  targetQuantity: number;
  completedQuantity: number; // Total Production output
  totalDefects?: number; // Total defects identified
  defectRate: number; // Defect rate %
  dhuRate?: number; // Defects per Hundred Units %
  rftRate?: number; // Right First Time %
  efficiencyPercent?: number; // Line / Section Efficiency %
  rejectQuantity?: number; // Reject count pcs
  sewingLine: string;
  lineId?: string;
  status: LineStatus;
  dueDate: string;
  operatorCount?: number;
  supervisorName?: string;
  qualityInspector?: string; // Quality Inspector / QC Auditor name who performed the inspection
  remarks?: string;
  createdAt?: string;
  hourlyReports?: HourlyReportEntry[]; // Comprehensive hour-by-hour output and quality log
  top3Defects?: TopDefectSummary[]; // Top 3 defects aggregated across the record
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  performedBy: string;
  userRole: Role;
  timestamp: string;
  details?: string;
}

export interface RolePermissions {
  canViewDashboard: boolean;
  canEditInventory: boolean;
  canApproveQualityGrade: boolean;
  canPerformInspection: boolean;
  canDeleteRecords: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canAccessApi: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  ADMIN: {
    canViewDashboard: true,
    canEditInventory: true,
    canApproveQualityGrade: true,
    canPerformInspection: true,
    canDeleteRecords: true,
    canManageUsers: true,
    canExportData: true,
    canAccessApi: true,
  },
  QA_MANAGER: {
    canViewDashboard: true,
    canEditInventory: true,
    canApproveQualityGrade: true,
    canPerformInspection: true,
    canDeleteRecords: false,
    canManageUsers: false,
    canExportData: true,
    canAccessApi: true,
  },
  WAREHOUSE_INSPECTOR: {
    canViewDashboard: true,
    canEditInventory: true,
    canApproveQualityGrade: false,
    canPerformInspection: true,
    canDeleteRecords: false,
    canManageUsers: false,
    canExportData: true,
    canAccessApi: true,
  },
  PRODUCTION_HEAD: {
    canViewDashboard: true,
    canEditInventory: false,
    canApproveQualityGrade: false,
    canPerformInspection: false,
    canDeleteRecords: false,
    canManageUsers: false,
    canExportData: true,
    canAccessApi: true,
  },
  OPERATOR: {
    canViewDashboard: true,
    canEditInventory: false,
    canApproveQualityGrade: false,
    canPerformInspection: false,
    canDeleteRecords: false,
    canManageUsers: false,
    canExportData: false,
    canAccessApi: false,
  },
  'Super Admin': {
    canViewDashboard: true,
    canEditInventory: true,
    canApproveQualityGrade: true,
    canPerformInspection: true,
    canDeleteRecords: true,
    canManageUsers: true,
    canExportData: true,
    canAccessApi: true,
  },
  'QC Manager': {
    canViewDashboard: true,
    canEditInventory: true,
    canApproveQualityGrade: true,
    canPerformInspection: true,
    canDeleteRecords: false,
    canManageUsers: false,
    canExportData: true,
    canAccessApi: true,
  },
  Inspector: {
    canViewDashboard: true,
    canEditInventory: true,
    canApproveQualityGrade: false,
    canPerformInspection: true,
    canDeleteRecords: false,
    canManageUsers: false,
    canExportData: true,
    canAccessApi: true,
  },
  Viewer: {
    canViewDashboard: true,
    canEditInventory: false,
    canApproveQualityGrade: false,
    canPerformInspection: false,
    canDeleteRecords: false,
    canManageUsers: false,
    canExportData: true,
    canAccessApi: false,
  },
};

export type RealTimeEvent = 
  | { type: 'STOCK_UPDATED'; item: InventoryItem; user: string; timestamp: string }
  | { type: 'BATCH_GRADE_CHANGED'; ids: string[]; grade: QualityGrade; user: string; timestamp: string }
  | { type: 'INSPECTION_RECORDED'; record: InspectionRecord; user: string; timestamp: string }
  | { type: 'INSPECTION_DELETED'; id: string; user: string; timestamp: string }
  | { type: 'PRODUCTION_RECORD_UPSERTED'; record: ProductionOrder; user: string; timestamp: string }
  | { type: 'PRODUCTION_RECORD_DELETED'; id: string; orderNumber?: string; user: string; timestamp: string }
  | { type: 'BUYER_ORDER_UPSERTED'; order: any; user: string; timestamp: string }
  | { type: 'BUYER_ORDER_DELETED'; id: string; orderNumber?: string; user: string; timestamp: string }
  | { type: 'MODULE_DATA_UPDATED'; moduleKey: string; data: any; user?: string; timestamp: string }
  | { type: 'SYSTEM_RESET'; mode: 'blank' | 'defaults'; user: string; timestamp: string }
  | { type: 'WAREHOUSE_ACTIVITY'; message: string; user: string; timestamp: string; location: string };
