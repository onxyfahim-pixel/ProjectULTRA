// Extended types for the comprehensive 30 Garments QMS ERP Modules
import { QualityGrade, DefectSeverity, InspectionStatus, MaterialCategory } from './erp';

// 1. Buyer & Order
export interface BOMItem {
  id: string;
  itemType: 'FABRIC' | 'LINING' | 'BUTTON' | 'ZIPPER' | 'THREAD' | 'LABEL' | 'HANGTAG' | 'POLYBAG' | 'CARTON' | 'INTERLINING' | 'OTHER';
  itemCode: string;
  description: string;
  supplier: string;
  consumptionPerGarment: number;
  unit: string;
  unitPriceUSD: number;
  totalRequired: number;
  status: 'SOURCED' | 'IN_TRANSIT' | 'RECEIVED' | 'PENDING' | 'PARTIALLY_RECEIVED';
  receivedQty?: number;
  inventoryItemId?: string;
  grnNumber?: string;
  receivedDate?: string;
  qcGrade?: QualityGrade;
}

export interface ProductionStageDetail {
  stage: 'PLANNED' | 'CUTTING' | 'SEWING' | 'PACKING' | 'READY_AUDIT' | 'SHIPPED';
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string;
  plannedPcs?: number;
  actualPcs?: number;
  rejectionPcs?: number;
  efficiencyPercent?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  notes?: string;
  assignedLines?: string[];
  inspector?: string;
}

export interface LogisticsDetail {
  shipmentMode: 'OCEAN_FCL' | 'OCEAN_LCL' | 'AIR_CARGO' | 'MULTIMODAL' | 'COURIER';
  forwarder: string;
  portOfLoading: string;
  portOfDischarge: string;
  containerNumber?: string;
  sealNumber?: string;
  bookingNumber: string;
  blAwbNumber: string;
  vesselFlightName: string;
  etdDate: string;
  etaDate: string;
  customsStatus: 'PENDING_DOCS' | 'CUSTOMS_SUBMITTED' | 'CLEARED' | 'GATED_IN' | 'ON_VESSEL' | 'DELIVERED';
  shippingTerms: 'FOB' | 'CIF' | 'DDP' | 'CFR' | 'EXW';
}

export interface BuyerOrderWIPRecord {
  // 1. Cutting Planned
  cuttingPlanned: number;
  // 2. Cutting Actual (Auto-synced from cutting floor records)
  cuttingActual: number;
  // 3. Sewing Input (Sewing line input)
  sewingInput: number;
  // 4. Sewing Complete Quantity (Auto-synced from production sewing records)
  sewingComplete: number;
  // 5. Wash Sent & Wash Received (Toggle if style requires garment wash)
  washApplicable: boolean;
  washSent: number;
  washReceived: number;
  // 6. Finishing Quantity (Auto-synced from finishing floor records)
  finishingQuantity: number;
  // 7. Packed Quantity
  packedQuantity: number;
  // 8. Inspection Completed Quantity (Auto-synced from Final Inspection records)
  inspectionCompletedQuantity: number;
  // 9. Shipped Quantity
  shippedQuantity: number;

  // Metadata & Auto Sync Indicators
  autoSyncFlags?: {
    cutting: boolean;
    sewing: boolean;
    finishing: boolean;
    inspection: boolean;
  };
  manualOverrides?: {
    cutting?: boolean;
    sewing?: boolean;
    finishing?: boolean;
    inspection?: boolean;
  };
  syncSources?: {
    cutting?: string;
    sewing?: string;
    finishing?: string;
    inspection?: string;
  };
  stageNotes?: {
    cutting?: string;
    sewing?: string;
    wash?: string;
    finishing?: string;
    packing?: string;
    inspection?: string;
    shipping?: string;
  };
  lastSyncedAt?: string;
}

export type OrderAttachmentCategory =
  | 'MEASUREMENT_SPEC'
  | 'TECHNICAL_SPEC'
  | 'TEST_RECORD'
  | 'ETC';

export interface OrderAttachment {
  id: string;
  category: OrderAttachmentCategory;
  fileName: string;
  fileSize?: number; // Size in bytes
  fileType?: string; // MIME type or extension like 'application/pdf', 'image/png'
  fileData?: string; // Base64 data URL
  uploadedAt: string;
  uploadedBy?: string;
  notes?: string;
}

export interface BuyerOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  brand: string;
  styleNumber: string;
  styleDescription: string;
  season: string;
  orderQuantity: number;
  fobPrice: number;
  currency: string;
  shipDate: string;
  cuttingStartDate: string;
  status: 'PLANNED' | 'CUTTING' | 'SEWING' | 'PACKING' | 'READY_AUDIT' | 'SHIPPED';
  qualityStandard: string;
  productImage?: string;
  merchandiserName?: string;
  merchandiserEmail?: string;
  merchandiserPhone?: string;
  smv?: number; // Standard Minute Value (SMV / SAM in minutes, e.g. 18.5)
  productionTarget?: number; // Planned Daily or Hourly Production Target (linked to IE & Production)
  dailyTarget?: number; // Planned Daily Output Target (pcs/day)
  productionTracking?: {
    currentStage: 'PLANNED' | 'CUTTING' | 'SEWING' | 'PACKING' | 'READY_AUDIT' | 'SHIPPED';
    stages: ProductionStageDetail[];
    overallProgressPercent: number;
  };
  wipRecord?: BuyerOrderWIPRecord;
  bomItems?: BOMItem[];
  logistics?: LogisticsDetail;
  attachments?: OrderAttachment[];
}

export interface BuyerProfile {
  id: string;
  code: string;
  name: string;
  brandDivision: string;
  country: string;
  segment: 'FAST_FASHION' | 'DENIM_CASUAL' | 'PREMIUM_APPAREL' | 'SPORTSWEAR' | 'BASIC_ESSENTIALS';
  aqlStandard: string;
  complianceRating: 'A+' | 'A' | 'B+';
  auditScore: number;
  contactPerson: string;
  email: string;
  phone: string;
  merchandiserName?: string;
  merchandiserEmail?: string;
  merchandiserPhone?: string;
  paymentTerms: string;
  activeOrdersCount: number;
  totalOrderUnits: number;
  totalFobValueUSD: number;
  passRatePercent: number;
  specialProtocols: string[];
  status: 'ACTIVE' | 'ON_HOLD' | 'PROSPECT';
  logoUrl?: string;
}

// 2. Sub Supplier
export interface SubSupplier {
  id: string;
  code: string;
  name: string;
  category: 'FABRIC_MILL' | 'DYEING_HOUSE' | 'TRIMS_BUTTONS' | 'ZIPPERS' | 'LABELS_PACKAGING' | 'THREAD_MILL';
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  qualityRating: 'A+' | 'A' | 'B' | 'C';
  complianceStatus: 'APPROVED' | 'PROVISIONAL' | 'AUDIT_PENDING' | 'BLACKLISTED';
  auditScore: number;
  leadTimeDays: number;
  logoUrl?: string;
  certifications?: string[];
  materialsSupplied?: string[];
  capacityPerMonth?: string;
  onTimeDeliveryRate?: number;
  defectRatePercent?: number;
  assignedQALead?: string;
  assignedQAEmail?: string;
  assignedQAPhone?: string;
  facilityLocation?: string;
  lastAuditDate?: string;
  nextAuditDate?: string;
  moq?: string;
  paymentTerms?: string;
}

// 3. Customer Complaint
export interface CustomerComplaint {
  id: string;
  complaintNumber: string;
  buyerName: string;
  styleNumber: string;
  poNumber: string;
  defectCategory: 'MEASUREMENT_OUT_OF_TOLERANCE' | 'COLOR_SHADING' | 'BROKEN_STITCH' | 'STAIN_SOIL' | 'FABRIC_FLAW' | 'PACKAGING_ERROR';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  reportedDate: string;
  claimAmountUSD: number;
  status: 'LOGGED' | 'INVESTIGATING' | 'CAPA_ISSUED' | 'SETTLED' | 'REJECTED';
  rootCauseSummary: string;
  assignedEngineer: string;
  engineerEmail?: string;
  engineerPhone?: string;
  affectedQuantityPcs?: number;
  brand?: string;
  styleDescription?: string;
  sewingLineOrUnit?: string;
  containmentAction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  targetResolutionDate?: string;
  settlementType?: 'CREDIT_NOTE' | 'RE_SCREENING' | 'REPLACEMENT_SHIPMENT' | 'CONCESSION' | 'REJECTED_CLAIM';
  resolutionDate?: string;
  buyerFeedback?: string;
}

// 4. Incoming QC (Fabric 4-Point & Raw Material Testing)
export interface DefectFinding {
  id?: string;
  defectName: string;
  count: number;
  points?: number;
  severity: DefectSeverity;
  zone?: string;
}

export interface IncomingQCLot {
  id: string;
  lotNumber: string;
  inventoryItemId?: string;
  inventorySku?: string;
  materialCategory: MaterialCategory;
  materialName?: string;
  materialType?: string; // backwards compatibility
  supplierName: string;
  poNumber?: string;
  styleNumber?: string;
  receivedQuantity: number;
  unit: string;
  inspectedQuantity: number;
  inspectionMethod: string;
  aqlStandard?: string;
  // Fabric technical test params (ASTM D5430)
  pointsPer100SqYd?: number;
  actualGsm?: number;
  targetGsm?: number;
  gsmVariancePercent?: number;
  rollWidthInches?: number;
  deltaE?: number;
  bowingPercent?: number;
  skewingPercent?: number;
  rollsInspected?: number;
  // Sewing Thread test params (ASTM D204)
  tensileStrengthCndtex?: number;
  elongationPercent?: number;
  tpiTwistPerInch?: number;
  sewabilityBreaksPer100m?: number;
  // Zipper test params (ASTM D2061)
  chainCrosswiseStrengthN?: number;
  sliderLockStrengthN?: number;
  reciprocityCycles500?: boolean;
  // Button/Rivet test params (ASTM F963)
  pullForceNewtons?: number;
  holdingTimeSeconds?: number;
  impactPassed?: boolean;
  ligneSize?: number;
  // Interlining/Elastic test params (DIN 54310)
  fusingPeelStrengthN5cm?: number;
  washShrinkagePercent?: number;
  elasticRecoveryPercent?: number;
  // Packaging/Label test params (TAPPI T810)
  burstingStrengthKpa?: number;
  dropTestPassed?: boolean;
  barcodeGrade?: 'A' | 'B' | 'C' | 'FAIL';
  rubFastnessPassed?: boolean;
  // Outcome & Verdict
  defectCount: number;
  defectsList?: DefectFinding[];
  result: 'ACCEPTED' | 'REJECTED' | 'CONDITIONAL_ACCEPT';
  qualityGradeAssigned: QualityGrade;
  inspectorName: string;
  inspectionDate: string;
  shadeEvaluation?: 'MATCH_APPROVED_SWATCH' | 'SLIGHT_VARIATION_COMMERCIAL' | 'OFF_SHADE_REJECTED';
  notes?: string;
}

// 5. Defects Library
export type DefectZone = 'ZONE_A_VISIBLE' | 'ZONE_B_LESS_VISIBLE' | 'ZONE_C_INSIDE' | 'ZONE_A' | 'ZONE_B' | 'ZONE_C';

export type DefectCategory =
  | 'SEWING'
  | 'FABRIC'
  | 'STAIN_SOIL'
  | 'MEASUREMENT'
  | 'FINISHING'
  | 'PACKAGING'
  | 'CUTTING'
  | 'WASHING'
  | 'TRIMS_ACCESSORIES'
  | 'PRINT_EMBROIDERY';

export interface DefectDefinition {
  id: string;
  defectCode: string;
  name: string;
  category: DefectCategory | string;
  severity: DefectSeverity;
  zone: DefectZone | string;
  description: string;
  defectImageUrl?: string;
  okImageUrl?: string;
  isoStandard?: string;
  location?: string;
  rootCause?: string;
  rootCauseHint?: string;
  correctiveAction?: string;
  correctiveActionHint?: string;
  remarks?: string;
  suggestedRemedy?: string;
  responsibleDepartment?: string;
  inspectionCheckpoint?: string;
  frequencyRank?: number;
  status?: 'ACTIVE' | 'ARCHIVED' | 'UNDER_REVIEW';
  updatedAt?: string;
}

// 6. Testing (Lab Testing)
export type LabTestType =
  | 'GSM_WEIGHT'
  | 'DIMENSIONAL_SHRINKAGE'
  | 'COLOR_FASTNESS_WASHING'
  | 'COLOR_FASTNESS_CROCKING'
  | 'COLOR_FASTNESS_LIGHT'
  | 'COLOR_FASTNESS_PERSPIRATION'
  | 'COLOR_FASTNESS_WATER'
  | 'TENSILE_STRENGTH'
  | 'TEAR_STRENGTH'
  | 'SEAM_SLIPPAGE'
  | 'PILLING_RESISTANCE'
  | 'ABRASION_RESISTANCE'
  | 'SPIRALITY_TORQUE'
  | 'PH_VALUE'
  | 'FIBER_COMPOSITION'
  | 'BUTTON_PULL_STRENGTH'
  | 'WATER_REPELLENCY'
  | 'BURSTING_STRENGTH';

export interface LabTestRecord {
  id: string;
  testReportNo: string;
  styleNumber: string;
  fabricBatch: string;
  buyerName?: string;
  orderNumber?: string;
  garmentItem?: string;
  testType: LabTestType | string;
  testStandard: string; // e.g. AATCC 135, ISO 105-C06, ASTM D3776
  requirement: string;
  actualResult: string;
  verdict: 'PASS' | 'FAIL' | 'PENDING';
  testedBy: string;
  testDate: string;
  labName: string;
  testImageUrl?: string; // Apparatus / Testing procedure photo
  specimenImageUrl?: string; // Tested swatch / specimen photo
  apparatusUsed?: string;
  conditioningHours?: number;
  temperatureCelsius?: number;
  humidityPercentage?: number;
  remarks?: string;
  rootCause?: string;
  correctiveAction?: string;
  calibratedInstrumentId?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface GarmentIsoTestMethod {
  id: string;
  code: string;
  name: string;
  category: 'PHYSICAL' | 'CHEMICAL' | 'COLOR_FASTNESS' | 'MECHANICAL' | 'SAFETY';
  isoStandard: string;
  aatccAstmStandard?: string;
  description: string;
  apparatus: string;
  sampleSpecimen: string;
  testingProcedure: string;
  acceptanceCriteria: string;
  imageUrl: string;
  specimenImageUrl?: string;
}

// 7. Calibration
export interface CalibrationHistoryRecord {
  id: string;
  calibrationDate: string;
  expiryDate: string;
  certificateNumber: string;
  agency: string;
  isThirdParty: boolean;
  calibratedBy: string;
  standardUsed: string;
  result: 'PASS' | 'ADJUSTED' | 'OUT_OF_TOLERANCE';
  toleranceFound: string;
  notes?: string;
  certificateFileUrl?: string;
  certificateFileName?: string;
  certificateFileType?: 'PDF' | 'IMAGE';
}

export interface CalibrationDevice {
  id: string;
  deviceTag: string;
  deviceName: string;
  brandName?: string;
  model: string;
  serialNumber?: string;
  equipmentImage?: string;
  location: string;
  department?: string;
  standardBasis?: string; // ISO 17025 / ASTM / ISO standard
  accuracyTolerance?: string; // e.g. ±0.01g, ±0.5 mm
  measurementRange?: string; // e.g. 0 - 220g, 0 - 5000 N
  lastCalibrationDate: string;
  nextDueDate: string;
  calibrationFrequencyMonths: number;
  status: 'CALIBRATED' | 'DUE_SOON' | 'OVERDUE';
  isThirdPartyCertified?: boolean;
  certificateNumber: string;
  calibrationAgency: string;
  certificateFileUrl?: string;
  certificateFileName?: string;
  certificateFileType?: 'PDF' | 'IMAGE';
  calibratedBy?: string;
  calibrationResult?: 'PASS' | 'ADJUSTED' | 'OUT_OF_TOLERANCE';
  remarks?: string;
  calibrationHistory?: CalibrationHistoryRecord[];
}

// 8. KPI Metric
export type KpiCategory = 'QUALITY' | 'PRODUCTIVITY' | 'DELIVERY' | 'COST' | 'SAFETY' | 'COMPLIANCE';
export type KpiStatus = 'ON_TRACK' | 'AT_RISK' | 'CRITICAL' | 'EXCEEDED';
export type KpiTrend = 'UP' | 'DOWN' | 'STABLE';
export type KpiFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PER_SHIPMENT';

export interface KpiHistoryPoint {
  id: string;
  period: string;
  value: number;
  target?: number;
  sampleSize?: number;
  loggedBy?: string;
  remarks?: string;
}

export interface KpiActionItem {
  id: string;
  task: string;
  assignee: string;
  department?: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  completedDate?: string;
}

export interface KpiMetric {
  id: string;
  kpiCode?: string;
  metricName: string;
  category: KpiCategory | 'QUALITY' | 'PRODUCTIVITY' | 'DELIVERY' | 'COST';
  department?: string;
  ownerName?: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  benchmark: string;
  status: KpiStatus | 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
  trend: KpiTrend | 'UP' | 'DOWN' | 'STABLE';
  frequency?: KpiFrequency | string;
  formula?: string;
  desiredDirection?: 'LOWER_IS_BETTER' | 'HIGHER_IS_BETTER';
  toleranceThreshold?: number;
  history?: KpiHistoryPoint[];
  actionItems?: KpiActionItem[];
  description?: string;
  lastUpdated?: string;
  createdAt?: string;
}

// 9. Quality Goal & Achieve
export type GoalPillar =
  | 'CUSTOMER_SATISFACTION'
  | 'DEFECT_REDUCTION'
  | 'PROCESS_EFFICIENCY'
  | 'COMPLIANCE_STANDARDS'
  | 'LAB_TESTING'
  | 'SUSTAINABILITY';

export type GoalStatus = 'ACHIEVED' | 'IN_PROGRESS' | 'BEHIND' | 'PLANNED';
export type GoalPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface GoalMilestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
  weightPercentage?: number;
}

export interface GoalActionPlan {
  id: string;
  task: string;
  assignee: string;
  department?: string;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
}

export interface QualityGoal {
  id: string;
  goalCode?: string;
  goalTitle: string;
  pillar?: GoalPillar;
  department?: string;
  targetMetric: string;
  baseline: string;
  target: string;
  currentAchievement: string;
  percentageAchieved: number;
  ownerName: string;
  startDate?: string;
  deadline: string;
  status: GoalStatus | 'ACHIEVED' | 'IN_PROGRESS' | 'BEHIND';
  priority?: GoalPriority;
  description?: string;
  milestones?: GoalMilestone[];
  actionPlans?: GoalActionPlan[];
  reviewCycle?: 'QUARTERLY' | 'MONTHLY' | 'ANNUAL';
  lastReviewedDate?: string;
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 10. Audit Record
export type AuditCategory =
  | 'INTERNAL'
  | 'EXTERNAL'
  | 'SUB_SUPPLIER'
  | 'SAFETY'
  | 'COMPLIANCE'
  | 'CUSTOM'
  | string;

export type AuditQuestionStatus =
  | 'CONFORMITY'
  | 'MINOR_NC'
  | 'MAJOR_NC'
  | 'CRITICAL_NC'
  | 'NON_CONFORMITY'
  | 'NA'
  | 'UNANSWERED';

export interface AuditPhotoEvidence {
  id: string;
  url: string;
  caption?: string;
  timestamp?: string;
}

export interface AuditChecklistItem {
  id: string;
  clause: string; // e.g., 'Clause 4: Context of the Organization'
  clauseNumber: string; // e.g., '4.1a'
  subClauseTitle: string; // e.g., 'Understanding the organization and its context'
  question: string; // Specific auditing requirement
  guidance?: string; // Evidence/verification criteria
  status: AuditQuestionStatus;
  remark?: string;
  evidencePhoto?: string; // Single photo (backward compatibility)
  evidencePhotos?: AuditPhotoEvidence[]; // Multiple image evidence uploads!
  photoTimestamp?: string;
  maxScore: number; // e.g. 1
  score: number; // Earned points (e.g. maxScore for Conformity, 0 for Non-conformity)
}

export interface AuditUploadedFile {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadDate: string;
  uploadedBy?: string;
  fileUrl?: string;
}

export interface AuditTypeDefinition {
  id: string;
  code: string;
  name: string;
  category: AuditCategory;
  standard: string;
  description: string;
  defaultAuditorOrg?: string;
  defaultDepartment?: string;
  badgeColor?: string;
  icon?: string;
  totalAvailableMarks: number;
  passMarksThreshold: number;
  criticalNcFailsAudit: boolean;
  scoringScheme?: {
    conformityRate: number;
    minorNcRate: number;
    majorNcRate: number;
    criticalNcRate: number;
  };
  isSystemDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedAuditQuestion {
  id: string;
  auditTypeId: string;
  clause: string;
  clauseNumber: string;
  subClauseTitle: string;
  question: string;
  guidance?: string;
  maxMarks: number;
  severityOnFailure?: 'MINOR' | 'MAJOR' | 'CRITICAL';
  status?: AuditQuestionStatus;
  tags?: string[];
  sortOrder?: number;
}

export interface QualityAudit {
  id: string;
  auditCode: string;
  auditType:
    | 'INTERNAL'
    | 'EXTERNAL'
    | 'SUB_SUPPLIER'
    | 'INTERNAL_QMS'
    | 'BUYER_TECHNICAL'
    | 'SOCIAL_COMPLIANCE'
    | 'SECURITY_CTPAT'
    | 'SUSTAINABILITY'
    | 'SAFETY'
    | '5S'
    | string;
  auditCategory?: AuditCategory;
  standard: string; // e.g. ISO 9001:2015, HIGG FEM, WRAP, SMETA 4-PILLAR, Buyer QMS
  auditorName: string;
  auditorOrganization?: string;
  auditeeDepartment?: string;
  supplierName?: string;
  supplierCategory?: string;
  // Sub-Supplier Module Synced Fields (Only for Sub Supplier Audit)
  subSupplierId?: string;
  subSupplierCode?: string;
  subSupplierCountry?: string;
  subSupplierLocation?: string;
  subSupplierContact?: string;
  subSupplierEmail?: string;
  subSupplierPhone?: string;
  subSupplierRating?: string;
  subSupplierAuditScore?: number;
  subSupplierLogoUrl?: string;
  subSupplierCertifications?: string[];
  auditDate: string;
  totalMarks?: number; // Usually 100
  obtainedMarks?: number; // Marks earned out of 100
  passMarks?: number; // Passing threshold (Default 80)
  scorePercentage: number;
  isPassed?: boolean;
  nonConformancesCount: number;
  criticalNCs?: number;
  majorNCs?: number;
  minorNCs?: number;
  observations?: number;
  verdict: 'PASSED_GRADE_A' | 'PASSED_WITH_OBSERVATIONS' | 'ACTION_PLAN_REQUIRED' | 'FAILED';
  nextAuditDate: string;
  checklist?: AuditChecklistItem[];
  uploadedFiles?: AuditUploadedFile[];
  executiveSummary?: string;
  leadAuditee?: string;
  approvalStatus?: 'APPROVED' | 'CONDITIONAL' | 'PENDING' | 'REJECTED';
}

// 11. CAPA
export type CapaSource =
  | 'INTERNAL_AUDIT'
  | 'CUSTOMER_COMPLAINT'
  | 'NCR'
  | 'SUPPLIER'
  | 'QUALITY_INSPECTION'
  | 'PROCESS_AUDIT'
  | 'MANAGEMENT_REVIEW'
  | 'BUYER_AUDIT'
  | 'LINE_REJECTION';

export type CapaSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export type CapaStatus = 'OPEN' | 'IN_PROGRESS' | 'VERIFICATION_PENDING' | 'CLOSED';

export interface CapaEvidenceImage {
  id: string;
  url: string;
  caption?: string;
  timestamp?: string;
  type?: 'ROOT_CAUSE' | 'BEFORE' | 'AFTER' | 'COMPLETION';
}

export interface CapaFiveWhys {
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCauseConclusion?: string;
}

export interface CapaFishboneFactors {
  man: string[];
  machine: string[];
  material: string[];
  method: string[];
  measurement: string[];
  milieu: string[]; // Environment
}

export interface CapaIssueItem {
  id: string;
  issueTitle: string;
  category?: 'SEWING' | 'FABRIC' | 'NEEDLE_SAFETY' | 'TRIMS' | 'MEASUREMENT' | 'FINISHING' | 'STAIN_SOIL' | 'SOP_COMPLIANCE' | 'OTHER' | string;
  severity?: CapaSeverity;
  department?: string;
  processStage?: string;
  description?: string;
  correctiveAction: string;
  preventiveAction: string;
  evidenceImage?: string;
  evidenceCaption?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  responsiblePerson?: string;
  targetDate?: string;
}

export interface CapaItem {
  id: string;
  capaNumber: string;
  dateRaised?: string;
  source: CapaSource;
  sourceReference?: string;
  severity?: CapaSeverity;
  department?: string;
  processStage?: string;
  issueTitle: string;
  problemDescription?: string;
  problemStatement?: string;
  // Multiple registered issues in one CAPA record:
  issues?: CapaIssueItem[];
  rootCause: string;
  fiveWhys?: CapaFiveWhys;
  fishboneFactors?: CapaFishboneFactors;
  rcaSupportingEvidence?: string;
  rcaEvidenceImages?: CapaEvidenceImage[];
  containmentAction: string;
  containmentDate?: string;
  containmentOwner?: string;
  correctiveAction: string;
  preventiveAction: string;
  sopUpdateRequired?: boolean;
  sopReference?: string;
  trainingRequired?: boolean;
  trainingDetails?: string;
  responsiblePerson: string;
  raisedBy?: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  status: CapaStatus;
  effectivenessVerified: boolean;
  verificationNotes?: string;
  verifiedBy?: string;
  verificationDate?: string;
  effectivenessRating?: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE' | 'PENDING';
  completionEvidenceImages?: CapaEvidenceImage[];
}

// 12. Root Cause Analysis
export type RcaStatus = 'DRAFT' | 'INVESTIGATING' | 'ROOT_CAUSE_IDENTIFIED' | 'CAPA_ASSIGNED' | 'VERIFIED_CLOSED' | 'COMPLETED';
export type RcaSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface RcaEvidenceImage {
  id: string;
  url: string;
  caption?: string;
  timestamp?: string;
}

export interface RootCauseCase {
  id: string;
  caseCode: string;
  problemTitle: string;
  occurredLocation: string;
  styleAffected: string;
  fiveWhys: {
    why1: string;
    why2: string;
    why3: string;
    why4: string;
    why5: string;
  };
  fishboneFactors: {
    man: string[];
    machine: string[];
    material: string[];
    method: string[];
    measurement: string[];
    milieu: string[];
  };
  finalRootCause: string;
  createdDate: string;
  status: RcaStatus;
  department?: string;
  buyer?: string;
  orderNumber?: string;
  severity?: RcaSeverity;
  targetClosureDate?: string;
  actualClosureDate?: string;
  investigationLead?: string;
  teamMembers?: string[];
  containmentAction?: string;
  problemDescription?: string;
  linkedCapaId?: string;
  linkedDefectCode?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  verificationNotes?: string;
  appliedMethods?: ('FIVE_WHY' | 'FISHBONE' | string)[];
  evidenceImages?: RcaEvidenceImage[];
}

// 13. Risk Assessment (FMEA)
export type RiskAssessmentType = 'PRODUCT' | 'PROCESS' | 'CRITICAL_PROCESS';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskStatus = 'DRAFT' | 'IN_PROGRESS' | 'MITIGATED' | 'APPROVED' | 'CLOSED';

export type RiskSectionType =
  | 'RAW_MATERIAL'
  | 'EMBELLISHMENT'
  | 'PRODUCT_TESTING'
  | 'LEGAL_REQUIREMENT'
  | 'CUTTING'
  | 'SEWING'
  | 'PACKAGING_FINISHING'
  | 'OTHER';

export interface RiskSectionItem {
  id: string;
  section: RiskSectionType;
  sectionLabel?: string;
  processStep: string;
  potentialFailureMode: string;
  potentialEffect: string;
  potentialCauses?: string;
  currentControls?: string;
  severity: number; // 1-10
  occurrence: number; // 1-10
  detection: number; // 1-10
  rpn: number; // Severity * Occurrence * Detection (1-1000)
  riskLevel?: RiskLevel;
  mitigationAction: string;
  responsibleLead?: string;
  targetDate?: string;
  status?: RiskStatus;
  notes?: string;
}

export interface RiskFmeaItem {
  id: string;
  fmeaCode: string;
  assessmentType?: RiskAssessmentType;
  assessmentDate?: string;
  title?: string;
  styleNumber?: string;
  buyer?: string;
  department?: string;
  processStep: string;
  potentialFailureMode: string;
  potentialEffect: string;
  potentialCauses?: string;
  currentControls?: string;
  severity: number; // 1-10
  occurrence: number; // 1-10
  detection: number; // 1-10
  rpn: number; // Severity * Occurrence * Detection (1-1000)
  riskLevel?: RiskLevel;
  mitigationAction: string;
  responsibleLead: string;
  targetDate?: string;
  status?: RiskStatus;
  productImage?: string; // Base64 data URL or image path
  processImage?: string; // Base64 data URL or image path
  assessorName?: string;
  assessorTeam?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;

  // Extended fields for Buyer & Order module integration & multi-section risks
  orderNumber?: string;
  buyerOrderId?: string;
  styleDescription?: string;
  season?: string;
  orderQuantity?: number;
  sectionRisks?: RiskSectionItem[];
  primarySection?: RiskSectionType;
}

export type RiskAssessmentRecord = RiskFmeaItem;

// 14. Traceability Record & Brand Protection Reconciliation
export interface TraceabilityEvidenceFile {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
  fileType: string;
  size?: string;
}

export interface TraceabilityDestructionPhoto {
  id: string;
  url: string;
  caption?: string;
  timestamp?: string;
}

export type TraceabilityStageKey =
  | 'RAW_MATERIAL'
  | 'FABRIC'
  | 'CUTTING'
  | 'SEWING'
  | 'FINISHING'
  | 'PACKING'
  | 'SHIPMENT';

export interface TraceabilityStageRecord {
  id: string;
  stageKey: TraceabilityStageKey;
  stageName: string;
  receiveDate: string;
  issueDate: string;
  receivedQty: number;
  issuedQty: number;
  excessShortQty: number;
  excessShortType: 'EXCESS' | 'SHORT' | 'BALANCED';
  unit: string;
  challanNumber?: string;
  challanDate?: string;
  challanImageUrl?: string;
  challanImageName?: string;
  stationOrSupplier?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  remarks?: string;
}

export interface TraceabilityChain {
  id: string;
  cartonBarcode: string;
  garmentSerial: string;
  styleNumber: string;
  buyer: string;
  sewingLine: string;
  cuttingTableLot: string;
  fabricRollBarcode: string;
  dyeingBatch: string;
  yarnLot: string;
  cottonOrigin: string;
  passedFinalDate: string;
  // End-to-End 7 Lifecycle Stages Tracking (Raw Material, Fabric, Cutting, Sewing, Finishing, Packing, Shipment)
  lifecycleStages?: TraceabilityStageRecord[];
  // Enhanced buyer order & custody attributes
  poNumber?: string;
  orderNumber?: string;
  articleName?: string;
  styleDescription?: string;
  orderQuantity?: number;
  season?: string;
  colorWay?: string;
  status?: 'VERIFIED' | 'IN_PROGRESS' | 'FLAGGED' | 'INCOMPLETE';
  traceabilityScore?: number;
  certificateStandard?: string;
  certificateNumber?: string;
  spinningMill?: string;
  fabricMill?: string;
  ginningLocation?: string;
  inspectorName?: string;
  metalDetectionStatus?: 'PASSED' | 'FAILED' | 'PENDING';
  needlePolicyVerified?: boolean;
  notes?: string;
  qrCodeUrl?: string;
  rfidTag?: string;
  updatedAt?: string;

  // Step-by-Step Quantity Verification (Receive, Issue, Packed, Reject, Excess)
  receivedQty?: number;
  issuedQty?: number;
  cutQty?: number;
  passedQty?: number;
  rejectQty?: number;
  excessQty?: number;
  wasteQty?: number;
  varianceQty?: number;
  reconciliationStatus?: '100%_RECONCILED' | 'PENDING_RECONCILIATION' | 'VARIANCE_FLAGGED';

  // Inbound Challan & Invoice Evidence
  invoiceNumber?: string;
  invoiceDate?: string;
  challanNumber?: string;
  challanDate?: string;
  gatePassNumber?: string;
  challanEvidenceFiles?: TraceabilityEvidenceFile[];

  // Brand Protection & Disposal Record
  brandProtectionStatus?: 'SECURED' | 'PENDING_DESTRUCTION' | 'DISPOSED_CERTIFIED';
  disposalRecordId?: string;
  disposedExcessQty?: number;
  disposalMethod?: 'SHREDDING' | 'DE_LABELING' | 'INCINERATION' | 'AUTHORIZED_RECYCLER';
  disposalDate?: string;
  disposalFacility?: string;
  witnessedBy?: string;
  disposalWitnessSignature?: string;
  certificateOfDestructionNumber?: string;
  destructionEvidencePhotos?: TraceabilityDestructionPhoto[];
  destructionCertificateFile?: string;
}

export interface CertificateAttachment {
  id: string;
  name: string;
  size: string;
  fileType: string;
  uploadDate: string;
  url?: string;
}

// 15. Certificate
export interface FactoryCertificate {
  id: string;
  certCode: string;
  name: string;
  issuingBody: string;
  certificateNumber: string;
  category?: 'QUALITY_QMS' | 'SOCIAL_COMPLIANCE' | 'ENVIRONMENTAL' | 'CHEMICAL_SAFETY' | 'TRANSACTION_TC' | 'SUPPLY_CHAIN';
  standardType?: string;
  validFrom: string;
  validUntil: string;
  daysRemaining: number;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  scope: string;
  documentUrl?: string;
  // Link to Buyer & Order module
  poNumber?: string;
  orderNumber?: string;
  styleNumber?: string;
  articleName?: string;
  buyerName?: string;
  brand?: string;
  orderQuantity?: number;
  season?: string;
  // Audit & Facility Information
  facilityLocation?: string;
  leadAuditor?: string;
  auditAgency?: string;
  renewalLeadDays?: number;
  verifiedBy?: string;
  remarks?: string;
  qrCode?: string;
  attachments?: CertificateAttachment[];
  updatedAt?: string;
}

// 16. Document Control
export interface DocumentAttachment {
  id: string;
  name: string;
  size: string;
  fileType: string;
  uploadDate: string;
  url?: string;
  revCaption?: string;
}

export interface DocumentRevision {
  id: string;
  version: string;
  changeDescription: string;
  changedBy: string;
  approvedBy: string;
  releaseDate: string;
  reasonForChange?: string;
}

export interface ControlledDocument {
  id: string;
  docNumber: string;
  title: string;
  department: string;
  category: 'POLICY' | 'SOP' | 'WORK_INSTRUCTION' | 'FORM_TEMPLATE' | 'SPECIFICATION';
  version: string;
  approvedBy: string;
  effectiveDate: string;
  nextReviewDate: string;
  status: 'APPROVED_ACTIVE' | 'UNDER_REVISION' | 'OBSOLETE';
  // Rich Enterprise Document Control extensions
  scope?: string;
  purpose?: string;
  preparedBy?: string;
  reviewedBy?: string;
  isoClause?: string;
  distributionList?: string[];
  confidentialityLevel?: 'INTERNAL_CONFIDENTIAL' | 'RESTRICTED' | 'GENERAL_FACILITY' | 'PUBLIC';
  documentLocation?: string;
  reviewFrequencyMonths?: number;
  daysRemaining?: number;
  changeLog?: DocumentRevision[];
  attachments?: DocumentAttachment[];
  remarks?: string;
  qrCode?: string;
  updatedAt?: string;
}

// 17. SOP Item & Operational Management
export interface SopStep {
  id: string;
  stepNumber: number;
  stepTitle: string;
  actionDetails: string;
  qualityControlPoints?: string;
  responsibleRole?: string;
  safetyInstructions?: string;
  requiredTools?: string;
  // legacy compatibility
  checkpoint?: string;
  safetyPpe?: string;
}

export interface SopAcknowledgement {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  acknowledgedDate: string;
  status: 'ACKNOWLEDGED' | 'PENDING' | 'OVERDUE';
  signatureNote?: string;
}

export interface SopTrainingRecord {
  id: string;
  trainingTopic: string;
  trainerName: string;
  trainingDate: string;
  traineesCount: number;
  averageScorePercent: number;
  passRatePercent: number;
  status: 'COMPLETED' | 'SCHEDULED' | 'RETRAIN_REQUIRED';
  notes?: string;
}

export interface SopApproval {
  preparedBy: string;
  preparedDate?: string;
  reviewedBy: string;
  reviewedDate?: string;
  approvedBy: string;
  approvalDate?: string;
}

export interface SopItem {
  id: string;
  sopNumber: string; // SOP ID (e.g. SOP-QA-001)
  title: string; // SOP Title
  department: string; // Department
  process: string; // Process (e.g. Fabric 4-Point Inspection)
  version: string; // Version (e.g. v3.1 or Rev 3.1)
  revision?: string; // backwards compatibility
  effectiveDate: string; // Effective Date
  reviewDate: string; // Review Date
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'DRAFT' | 'EXPIRED' | 'REVIEW_DUE'; // Status
  purpose: string; // Purpose
  scope: string; // Scope
  responsibility: string; // Responsibility roles
  procedure: SopStep[]; // Procedure
  steps?: SopStep[]; // backwards compatibility
  stepsCount: number; // Step count
  safetyInstructions: string; // Safety Instructions
  qualityControlPoints: string[]; // Quality Control Points
  requiredEquipment: string[]; // Required Equipment
  attachments?: DocumentAttachment[]; // Attachments
  approval?: SopApproval; // Approval
  preparedBy?: string; // backwards compatibility
  reviewedBy?: string; // backwards compatibility
  approvedBy?: string; // backwards compatibility
  revisionHistory?: { date: string; version: string; description: string; author: string }[];
  acknowledgements?: SopAcknowledgement[]; // SOP Acknowledgement
  trainingRecords?: SopTrainingRecord[]; // SOP Training
  expiryReminderDays?: number; // Expiry Reminder days
  expiryStatus?: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'; // Expiry Reminder status
  // Additional context
  applicability?: string; // backwards compatibility
  lastReviewed?: string; // backwards compatibility
  nextReviewDate?: string; // backwards compatibility
  sopCategory?: 'PRODUCTION' | 'QUALITY' | 'MAINTENANCE' | 'SAFETY_COMPLIANCE' | 'HR_ADMIN';
  ppeRequirements?: string[];
  criticalSafetyRules?: string[];
  reviewFrequencyMonths?: number;
  daysRemaining?: number;
  targetStations?: string[];
  distributionList?: string[];
  changeLog?: DocumentRevision[];
  qrCode?: string;
  remarks?: string;
  updatedAt?: string;
}

// 18. Quality Manual Section
export type QualityManualStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'DRAFT' | 'OBSOLETE';

export interface QualityManualComplianceItem {
  id: string;
  requirement: string;
  verificationMethod: string;
  frequency: string;
  status: 'COMPLIANT' | 'NEEDS_ACTION' | 'NOT_APPLICABLE';
}

export interface QualityManualLinkedDoc {
  docNumber: string;
  title: string;
  docType: 'SOP' | 'PROCEDURE' | 'POLICY' | 'WORK_INSTRUCTION' | 'FORM';
}

export interface QualityManualRevision {
  revision: string;
  changeDate: string;
  changedBy: string;
  description: string;
}

export interface QualityManualSection {
  id: string;
  chapterNumber: string;
  title: string;
  clauseReference: string; // e.g. ISO 9001:2015 Clause 5.2
  summary: string;
  responsibleDepartment: string;
  updatedAt: string;
  // Rich Enterprise Extensions
  status?: QualityManualStatus;
  version?: string;
  effectiveDate?: string;
  nextReviewDate?: string;
  approvedBy?: string;
  scope?: string;
  isoStandard?: string;
  confidentiality?: 'INTERNAL_RESTRICTED' | 'GENERAL_FACILITY' | 'PUBLIC_POLICY';
  policyCommitments?: string[];
  complianceRequirements?: QualityManualComplianceItem[];
  linkedDocuments?: QualityManualLinkedDoc[];
  revisionHistory?: QualityManualRevision[];
  author?: string;
  reviewedBy?: string;
  notes?: string;
  createdAt?: string;
}

// 19. Procedure
export type ProcedureStation =
  | 'FABRIC_INSPECTION'
  | 'SPREADING_CUTTING'
  | 'FUSING'
  | 'SEWING_ASSEMBLY'
  | 'IRONING_FINISHING'
  | 'PACKING_CARTONING'
  | 'FULL_PROCESS_CHAIN'
  | 'MERCHANDISING_COMMERCIAL'
  | 'QUALITY_ASSURANCE'
  | 'SAMPLE_DEVELOPMENT';

export type ProcedureStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';

export interface ProcedureResponsibility {
  id?: string;
  role: string;
  responsibility: string;
  authorityLevel?: string;
}

export interface ProcedureStepItem {
  id?: string;
  stepNumber: string; // e.g. "3.1.1"
  title: string;
  description: string;
  inspectionFrequency?: string; // e.g. "100%", "10% by 4 points system", "AQL 2.5"
  acceptanceCriteria?: string;
  relatedFormCode?: string; // e.g. "NFFL/4/1005"
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ProcedureDepartmentProcess {
  id?: string;
  departmentName: string;
  departmentCode?: string;
  inChargeRole?: string;
  steps: ProcedureStepItem[];
}

export interface ProcedureRelatedDocument {
  id?: string;
  documentTitle: string;
  documentCode: string;
  category?: string;
  frequency?: string;
  retentionPeriod?: string;
  isMandatory?: boolean;
}

export interface ProcedureDistributionEntry {
  id?: string;
  departmentOrFile: string;
  copyType: 'CONTROLLED_PHYSICAL' | 'CONTROLLED_ELECTRONIC' | 'INFORMATIONAL';
  recipientName?: string;
  status?: 'DISTRIBUTED' | 'ACKNOWLEDGED' | 'PENDING';
}

export interface ProcedureItem {
  id: string;
  procedureCode: string;
  title: string;
  companyName?: string;
  department?: string;
  documentType?: string;
  documentReference?: string;
  issueNo?: string;
  revision: string;
  status?: ProcedureStatus;
  approvalDate?: string;
  nextReviewDate?: string;
  effectiveDate?: string;
  authorName?: string;
  authorSignature?: string;
  approvedByName?: string;
  approvedBySignature?: string;
  controlledDocument?: boolean;

  // 1.0 Purpose & Scope
  purposeAndScope?: string;

  // 2.0 Responsibilities and Authorities
  responsibilities?: ProcedureResponsibility[];

  // 3.0 Department-wise Process Control
  departmentProcesses?: ProcedureDepartmentProcess[];

  // 4.0 Related Documents
  relatedDocuments?: ProcedureRelatedDocument[];

  // 5.0 Distribution
  distribution?: ProcedureDistributionEntry[];

  // Station and legacy fields
  station: ProcedureStation;
  criticalCheckpoints: string[];
  ppeRequirement: string;

  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 20. Process Flow Step & Process Flow Chart
export interface ProcessFlowStep {
  id: string;
  stepNumber: number;
  stageName: string;
  department: string;
  inputMaterials: string;
  transformation: string;
  qualityGate: string;
  standardTool: string;
  leadTimeHours: number;
  responsibleRole?: string;
  criticalGate?: boolean;
  toleranceSpecs?: string;
}

export type ProcessFlowStatus = 'ACTIVE' | 'DRAFT' | 'UNDER_REVIEW' | 'ARCHIVED';

export interface ProcessFlowChart {
  id: string;
  flowCode: string;
  title: string;
  productCategory: string; // e.g. 'Knitwear', 'Woven Denim', 'Outerwear', 'Activewear'
  department: string;
  version: string;
  status: ProcessFlowStatus;
  author: string;
  approvedBy: string;
  effectiveDate: string;
  reviewDate?: string;
  description: string;
  steps: ProcessFlowStep[];
  totalLeadTimeHours?: number;
  criticalGatesCount?: number;
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 21. Organogram Node
export type OrganogramStatus = 'ACTIVE' | 'ON_LEAVE' | 'VACANT';

export interface OrganogramNode {
  id: string;
  name: string;
  title: string;
  department: string;
  reportsToId?: string;
  email: string;
  headcount: number;
  grade: string;
  phone?: string;
  officeLocation?: string;
  status?: OrganogramStatus;
  responsibilities?: string[];
  certifications?: string[];
  decisionAuthority?: string;
  avatarUrl?: string;
  joinedDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 22. Job Description
export type JobDescriptionStatus = 'ACTIVE' | 'VACANT' | 'UNDER_REVISION' | 'ARCHIVED';

export interface JobDescriptionKpi {
  kpiName: string;
  target: string;
  measurementFrequency: string;
}

export interface JobDescriptionItem {
  id: string;
  roleCode: string;
  title: string;
  department: string;
  level: string;
  keyResponsibilities: string[];
  educationRequirement: string;
  experienceYears: number;
  technicalSkills: string[];
  // Rich Enterprise & ISO Audit Extensions
  incumbentName?: string;
  companyIdNo?: string;
  supervisorName?: string;
  supervisorTitle?: string;
  supervisorIdNo?: string;
  status?: JobDescriptionStatus;
  employmentType?: 'FULL_TIME' | 'CONTRACT' | 'PROBATIONARY';
  isoClauseMapping?: string[];
  decisionAuthority?: string;
  kpiMetrics?: JobDescriptionKpi[];
  certificationsRequired?: string[];
  reportingSubordinates?: string[];
  workstationLocation?: string;
  effectiveDate?: string;
  revision?: string;
  approvedBy?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 23. Training Record & Examination System
export type TrainingFrequency = 'ONBOARDING' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
export type TrainingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface TrainingAttendee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  sectionLine?: string;
  designation: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  checkInTime?: string;
  signatureVerified?: boolean;
  preTestScore?: number;
  postTestScore?: number;
  practicalScore?: number;
  finalScore?: number;
  result?: 'PASSED' | 'FAILED' | 'RETEST_REQUIRED';
  certificateNo?: string;
  remarks?: string;
}

export interface AnnualTrainingScheduleItem {
  id: string;
  scheduleCode: string;
  month: string;
  monthIndex: number;
  dayOfWeek: string;
  date: string;
  timeSlot: string;
  durationHours: number;
  section: 'CUTTING_SECTION' | 'SEWING_SECTION' | 'FINISHING_PACKING' | 'FABRIC_LAB' | 'QUALITY_ASSURANCE' | 'MAINTENANCE_SAFETY';
  sectionName: string;
  courseCode: string;
  topicTitle: string;
  trainerName: string;
  venue: string;
  targetSeats: number;
  status: 'SCHEDULED' | 'UPCOMING' | 'COMPLETED' | 'OVERDUE';
  mandatoryFor: string;
  notes?: string;
}

export interface TrainingExamQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'PRACTICAL_CHECK' | 'VIVA';
  options?: string[];
  correctAnswer?: string;
  points: number;
  evaluationCriteria?: string;
}

export interface TrainingExamPaper {
  id: string;
  examCode: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  targetDepartment: string;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  questions: TrainingExamQuestion[];
  instructions?: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingEvaluationRecord {
  id: string;
  evaluationCode: string;
  trainingId: string;
  courseCode: string;
  courseTitle: string;
  sessionDate: string;
  trainerName: string;
  evaluatorName: string;
  evaluatorTitle: string;
  totalAttendees: number;
  passedCount: number;
  failedCount: number;
  averageScorePercent: number;
  trainees: TrainingAttendee[];
  trainerRemarks?: string;
  competencyCertified: boolean;
  status: 'COMPLETED' | 'DRAFT' | 'VERIFIED';
  updatedAt?: string;
}

export interface TrainingMatrixItem {
  id: string;
  courseCode: string;
  title: string;
  targetAudience: string;
  trainerName: string;
  frequency: TrainingFrequency;
  trainedCount: number;
  passRatePercent: number;
  nextScheduledDate: string;
  status: TrainingStatus;
  // Rich Enterprise Extensions
  department?: string;
  section?: string;
  scheduledDay?: string;
  timeSlot?: string;
  category?: 'SAFETY_COMPLIANCE' | 'TECHNICAL_QMS' | 'MACHINE_OPERATION' | 'CHEMICAL_ENVIRONMENTAL' | 'MANAGEMENT_AUDITING';
  durationHours?: number;
  venue?: string;
  maxCapacity?: number;
  syllabusTopics?: string[];
  prerequisites?: string;
  isoClause?: string;
  examPaperId?: string;
  examCode?: string;
  attendees?: TrainingAttendee[];
  latestEvaluationId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MeetingType =
  | 'PRE_PRODUCTION'
  | 'BUYER_QUALITY_REVIEW'
  | 'WEEKLY_QMS'
  | 'NEEDLE_SAFETY'
  | 'CUSTOMER_CLAIM_CAPA'
  | 'MANAGEMENT_REVIEW'
  | 'INTERNAL_AUDIT';

export type MeetingStatus = 'CLOSED' | 'ACTIONS_PENDING' | 'IN_REVIEW' | 'DRAFT';

export interface MeetingAttendee {
  id: string;
  name: string;
  organization: 'FACTORY' | 'BUYER' | 'SUPPLIER' | 'THIRD_PARTY';
  department: string;
  role: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  signatureConfirmed?: boolean;
}

export interface MeetingActionItem {
  id?: string;
  task: string;
  assignee: string;
  department?: string;
  dueDate: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  completedDate?: string;
  verificationNotes?: string;
}

// 24. Meeting Minutes
export interface MeetingMinutesItem {
  id: string;
  meetingCode: string;
  title: string;
  meetingDate: string;
  meetingTime?: string;
  durationMinutes?: number;
  venue?: string;
  meetingType?: MeetingType;
  chairperson: string;
  scribeName?: string;
  buyerName?: string;
  orderPoNumber?: string;
  styleNumber?: string;
  attendeesCount: number;
  attendees?: MeetingAttendee[];
  agenda: string;
  discussionNotes?: string[];
  actionItems: MeetingActionItem[];
  status: MeetingStatus;
  preparedBy?: string;
  approvedBy?: string;
  targetClosureDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 25. Event Item
export type EventType =
  | 'BUYER_VISIT'
  | 'PRE_PRODUCTION_MEETING'
  | 'QUALITY_MONTH'
  | 'AUDIT_INSPECTION'
  | 'MAINTENANCE_SHUTDOWN'
  | 'TRAINING_SEMINAR'
  | 'MANAGEMENT_REVIEW';

export type EventStatus = 'UPCOMING' | 'IN_PROGRESS' | 'CONCLUDED' | 'POSTPONED' | 'CANCELLED';
export type EventPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface EventAttendee {
  id: string;
  name: string;
  organization: 'BUYER' | 'FACTORY' | 'AUDITOR' | 'SUPPLIER';
  department?: string;
  role: string;
  confirmed: boolean;
}

export interface EventScheduleItem {
  id: string;
  timeSlot: string;
  activity: string;
  location: string;
  facilitator: string;
  completed: boolean;
}

export interface EventChecklistItem {
  id: string;
  task: string;
  responsiblePerson: string;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
}

export interface FactoryEventItem {
  id: string;
  eventCode: string;
  title: string;
  type: EventType | 'BUYER_VISIT' | 'PRE_PRODUCTION_MEETING' | 'QUALITY_MONTH' | 'AUDIT_INSPECTION' | 'MAINTENANCE_SHUTDOWN';
  eventDate: string;
  endDate?: string;
  timeSlot?: string;
  location: string;
  leadOrganizer: string;
  buyerName?: string;
  department?: string;
  priority?: EventPriority;
  status: EventStatus | 'UPCOMING' | 'IN_PROGRESS' | 'CONCLUDED';
  description?: string;
  agendaSummary?: string;
  readinessPercentage?: number;
  attendeesCount?: number;
  delegationMembers?: EventAttendee[];
  itinerary?: EventScheduleItem[];
  preparationChecklist?: EventChecklistItem[];
  outcomesSummary?: string;
  keyFindings?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// 26. Communication Notice
export type NoticeCategory =
  | 'QUALITY_FLASH'
  | 'BUYER_ADVISORY'
  | 'OPERATIONAL_CIRCULAR'
  | 'COMPLIANCE_SAFETY'
  | 'COMMENDATION';

export type NoticeUrgency = 'HIGH_PRIORITY' | 'STANDARD' | 'INFO';

export type NoticeStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface NoticeAcknowledgment {
  id: string;
  userName: string;
  userRole: string;
  department: string;
  acknowledgedAt: string;
  actionTakenNotes?: string;
}

export interface NoticeComment {
  id: string;
  authorName: string;
  authorRole: string;
  department: string;
  timestamp: string;
  comment: string;
}

export interface CommunicationNotice {
  id: string;
  noticeNumber: string;
  title: string;
  urgency: NoticeUrgency;
  category?: NoticeCategory;
  author: string;
  authorRole?: string;
  targetDepartment: string;
  targetAudience?: string[];
  publishedDate: string;
  effectiveUntil?: string;
  content: string;
  actionRequired?: string;
  isRead: boolean;
  status?: NoticeStatus;
  buyerRef?: string;
  orderRef?: string;
  styleRef?: string;
  attachments?: { name: string; size: string; type: string }[];
  acknowledgments?: NoticeAcknowledgment[];
  comments?: NoticeComment[];
  totalRecipientsCount?: number;
  acknowledgedCount?: number;
  pinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 27. System Setting
export interface SystemConfigSetting {
  id: string;
  settingKey: string;
  label: string;
  category: 'AQL_TOLERANCE' | 'INSPECTION_RULES' | 'FABRIC_PARAMETERS' | 'NOTIFICATIONS';
  currentValue: string;
  unit?: string;
  description: string;
}

// 28. Texpedia Textile & Garments Knowledge Community
export type TexpediaCategory =
  | 'FABRIC_WEAVING'
  | 'DYEING_WASHING'
  | 'CUTTING_PATTERN'
  | 'SEWING_MACHINERY'
  | 'FINISHING_PACKING'
  | 'QUALITY_AUDIT'
  | 'TECHNICAL_TIPS';

export interface TexpediaImage {
  id: string;
  url: string;
  caption: string;
  highlightDefect?: boolean;
}

export interface TexpediaComment {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  department: string;
  timestamp: string;
  content: string;
  likesCount?: number;
}

export interface TexpediaPost {
  id: string;
  title: string;
  slug?: string;
  category: TexpediaCategory;
  tags: string[];
  content: string;
  summary?: string;
  author: {
    name: string;
    role: string;
    department: string;
    avatarUrl?: string;
    badges?: string[];
  };
  images: TexpediaImage[];
  upvotesCount: number;
  hasUpvoted?: boolean;
  isBookmarked?: boolean;
  isVerifiedSolution?: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt?: string;
  comments: TexpediaComment[];
}

