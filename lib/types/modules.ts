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
  productionTracking?: {
    currentStage: 'PLANNED' | 'CUTTING' | 'SEWING' | 'PACKING' | 'READY_AUDIT' | 'SHIPPED';
    stages: ProductionStageDetail[];
    overallProgressPercent: number;
  };
  bomItems?: BOMItem[];
  logistics?: LogisticsDetail;
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
export interface KpiMetric {
  id: string;
  metricName: string;
  category: 'QUALITY' | 'PRODUCTIVITY' | 'DELIVERY' | 'COST';
  currentValue: number;
  targetValue: number;
  unit: string;
  benchmark: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
  trend: 'UP' | 'DOWN' | 'STABLE';
}

// 9. Quality Goal & Achieve
export interface QualityGoal {
  id: string;
  goalTitle: string;
  targetMetric: string;
  baseline: string;
  target: string;
  currentAchievement: string;
  percentageAchieved: number;
  ownerName: string;
  deadline: string;
  status: 'ACHIEVED' | 'IN_PROGRESS' | 'BEHIND';
}

// 10. Audit Record
export type AuditCategory = 'INTERNAL' | 'EXTERNAL' | 'SUB_SUPPLIER';

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
    | 'SUSTAINABILITY';
  auditCategory?: AuditCategory;
  standard: string; // e.g. ISO 9001:2015, HIGG FEM, WRAP, SMETA 4-PILLAR, Buyer QMS
  auditorName: string;
  auditorOrganization?: string;
  auditeeDepartment?: string;
  supplierName?: string;
  supplierCategory?: string;
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
  status: 'COMPLETED' | 'DRAFT';
}

// 13. Risk Assessment (FMEA)
export interface RiskFmeaItem {
  id: string;
  fmeaCode: string;
  processStep: string;
  potentialFailureMode: string;
  potentialEffect: string;
  severity: number; // 1-10
  occurrence: number; // 1-10
  detection: number; // 1-10
  rpn: number; // Severity * Occurrence * Detection
  mitigationAction: string;
  responsibleLead: string;
}

// 14. Traceability Record
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
}

// 15. Certificate
export interface FactoryCertificate {
  id: string;
  certCode: string;
  name: string;
  issuingBody: string;
  certificateNumber: string;
  validFrom: string;
  validUntil: string;
  daysRemaining: number;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  scope: string;
  documentUrl: string;
}

// 16. Document Control
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
}

// 17. SOP Item
export interface SopItem {
  id: string;
  sopNumber: string;
  title: string;
  department: string;
  revision: string;
  purpose: string;
  stepsCount: number;
  applicability: string;
  lastReviewed: string;
  status: 'ACTIVE' | 'DRAFT' | 'REVIEW_DUE';
}

// 18. Quality Manual Section
export interface QualityManualSection {
  id: string;
  chapterNumber: string;
  title: string;
  clauseReference: string; // e.g. ISO 9001 Clause 7.1
  summary: string;
  responsibleDepartment: string;
  updatedAt: string;
}

// 19. Procedure
export interface ProcedureItem {
  id: string;
  procedureCode: string;
  title: string;
  station: 'FABRIC_INSPECTION' | 'SPREADING_CUTTING' | 'FUSING' | 'SEWING_ASSEMBLY' | 'IRONING_FINISHING' | 'PACKING_CARTONING';
  criticalCheckpoints: string[];
  ppeRequirement: string;
  revision: string;
}

// 20. Process Flow Step
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
}

// 21. Organogram Node
export interface OrganogramNode {
  id: string;
  name: string;
  title: string;
  department: string;
  reportsToId?: string;
  email: string;
  headcount: number;
  grade: string;
}

// 22. Job Description
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
}

// 23. Training Record
export interface TrainingMatrixItem {
  id: string;
  courseCode: string;
  title: string;
  targetAudience: string;
  trainerName: string;
  frequency: 'ONBOARDING' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  trainedCount: number;
  passRatePercent: number;
  nextScheduledDate: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'OVERDUE';
}

// 24. Meeting Minutes
export interface MeetingMinutesItem {
  id: string;
  meetingCode: string;
  title: string;
  meetingDate: string;
  chairperson: string;
  attendeesCount: number;
  agenda: string;
  actionItems: {
    task: string;
    assignee: string;
    dueDate: string;
    completed: boolean;
  }[];
  status: 'CLOSED' | 'ACTIONS_PENDING';
}

// 25. Event Item
export interface FactoryEventItem {
  id: string;
  eventCode: string;
  title: string;
  type: 'BUYER_VISIT' | 'PRE_PRODUCTION_MEETING' | 'QUALITY_MONTH' | 'AUDIT_INSPECTION' | 'MAINTENANCE_SHUTDOWN';
  eventDate: string;
  location: string;
  leadOrganizer: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'CONCLUDED';
}

// 26. Communication Notice
export interface CommunicationNotice {
  id: string;
  noticeNumber: string;
  title: string;
  urgency: 'HIGH_PRIORITY' | 'STANDARD' | 'INFO';
  author: string;
  targetDepartment: string;
  publishedDate: string;
  content: string;
  isRead: boolean;
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
