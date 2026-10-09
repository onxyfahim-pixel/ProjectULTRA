export interface PdfHeaderSettings {
  // Sync Flag
  autoSyncWithGeneral: boolean;

  // Company Identity (Auto-synced from General Settings with override capability)
  companyName: string;
  companySubtitle: string;
  logoUrl: string;
  logoPosition: 'left' | 'center' | 'right';
  logoWidth: number; // in pixels (e.g. 130)
  showLogo: boolean;

  // Address & Contacts (Auto-synced from General Settings with override capability)
  factoryAddress: string;
  phone: string;
  email: string;
  website: string;
  taxRegistrationNumber: string; // e.g. BIN / TIN / Reg No

  // Header Design & Layout Presets
  layoutStyle: 'modern_split' | 'classic_bordered' | 'executive_centered' | 'ribbon_accent' | 'compact_clean';
  accentColor: string; // Primary brand accent hex color
  secondaryColor: string; // Secondary border / line color
  headerBgColor: 'white' | 'tint' | 'dark' | 'gradient';
  headerDensity: 'compact' | 'standard' | 'spacious';
  fontFamily: 'inter' | 'roboto' | 'helvetica' | 'times';
  headerBorderBottom: 'solid' | 'double' | 'gradient' | 'none';

  // Badges & Compliance Details on the Header
  showIsoCertification: boolean;
  isoStandardBadge: string;
  showDocumentMetadata: boolean;
  docCodePrefix: string;
  defaultOrientation?: 'portrait' | 'landscape';
  recordDocCodes?: Record<string, string>;
  moduleWiseConfigs?: Record<string, ModuleCustomHeaderConfig>;
  showQrVerificationCode: boolean;
  qrCodeText: string;
  showConfidentialNotice: boolean;
  confidentialNoticeText: string;

  // Module Scope (Applies to all ERP modules)
  appliedModules: string[];
  lastUpdatedAt?: string;
}

export interface ModuleCustomHeaderConfig {
  registerTitle?: string;
  registerDocCode?: string;
  singleTitle?: string;
  singleDocCode?: string;
}

export interface ModuleHeaderDefinition {
  key: string;
  name: string;
  category: string;
  department: string;
  defaultRegisterTitle: string;
  defaultRegisterDocCode: string;
  defaultSingleTitle: string;
  defaultSingleDocCode: string;
}

export const DEFAULT_MODULE_HEADER_CONFIGS: ModuleHeaderDefinition[] = [
  {
    key: 'production',
    name: 'Production Operations',
    category: 'Manufacturing & Operations',
    department: 'Garment Manufacturing & Floor Production Control',
    defaultRegisterTitle: 'PRODUCTION & FLOOR OPERATIONS MASTER REGISTER',
    defaultRegisterDocCode: 'PRD-REG',
    defaultSingleTitle: 'DAILY PRODUCTION BATCH & LINE INSPECTION DOSSIER',
    defaultSingleDocCode: 'PRD-SPEC',
  },
  {
    key: 'buyer_order',
    name: 'Buyer & Purchase Orders',
    category: 'Manufacturing & Operations',
    department: 'Buyer & Merchandising Division',
    defaultRegisterTitle: 'BUYER ORDERS & PRODUCTION SUMMARY REGISTER',
    defaultRegisterDocCode: 'PO-REG',
    defaultSingleTitle: 'PURCHASE ORDER & TECH PACK SPECIFICATION DOSSIER',
    defaultSingleDocCode: 'PO-SPEC',
  },
  {
    key: 'planning_ie',
    name: 'Planning & Industrial Engineering',
    category: 'Manufacturing & Operations',
    department: 'Industrial Engineering & Planning Division',
    defaultRegisterTitle: 'LINE BALANCING & PRODUCTION PLANNING REGISTER',
    defaultRegisterDocCode: 'IE-REG',
    defaultSingleTitle: 'OPERATION BULLETIN & ORDER PLANNING DOSSIER',
    defaultSingleDocCode: 'IE-PLAN',
  },
  {
    key: 'inventory',
    name: 'Warehouse & Inventory',
    category: 'Supply Chain & Inventory',
    department: 'Supply Chain & Warehouse Logistics',
    defaultRegisterTitle: 'WAREHOUSE INVENTORY & RAW MATERIAL REGISTER',
    defaultRegisterDocCode: 'INV-REG',
    defaultSingleTitle: 'MATERIAL GOODS RECEIVED NOTE (GRN) DOSSIER',
    defaultSingleDocCode: 'GRN-REC',
  },
  {
    key: 'inspections',
    name: 'Quality Inspections (AQL)',
    category: 'Quality Management',
    department: 'Quality Assurance & Quality Control',
    defaultRegisterTitle: 'QUALITY INSPECTION & AQL AUDIT MASTER REGISTER',
    defaultRegisterDocCode: 'QC-INSP',
    defaultSingleTitle: 'FINAL QUALITY AUDIT & AQL 2.5 INSPECTION REPORT',
    defaultSingleDocCode: 'QC-SPEC',
  },
  {
    key: 'incoming_qc',
    name: 'Incoming Raw Material QC',
    category: 'Quality Management',
    department: 'Incoming Raw Material Laboratory',
    defaultRegisterTitle: 'FABRIC & ACCESSORIES INWARD QC MASTER REGISTER',
    defaultRegisterDocCode: 'IQC-REG',
    defaultSingleTitle: 'RAW MATERIAL 4-POINT INWARD TEST CERTIFICATE',
    defaultSingleDocCode: 'IQC-CERT',
  },
  {
    key: 'testing',
    name: 'Laboratory Testing',
    category: 'Quality Management',
    department: 'Physical & Chemical Textile Testing Laboratory',
    defaultRegisterTitle: 'LABORATORY TESTING & CERTIFICATION REGISTER',
    defaultRegisterDocCode: 'LAB-REG',
    defaultSingleTitle: 'FABRIC & GARMENT TECHNICAL TEST REPORT',
    defaultSingleDocCode: 'LAB-TEST',
  },
  {
    key: 'defects_library',
    name: 'Defect Classification Library',
    category: 'Quality Management',
    department: 'Quality Engineering & Defect Prevention',
    defaultRegisterTitle: 'GARMENT DEFECT CATALOG & CLASSIFICATION REGISTER',
    defaultRegisterDocCode: 'DEF-CAT',
    defaultSingleTitle: 'DEFECT TECHNICAL CLASSIFICATION SPECIFICATION',
    defaultSingleDocCode: 'DEF-SPEC',
  },
  {
    key: 'quality_manual',
    name: 'Quality Manual (ISO 9001)',
    category: 'Quality Management',
    department: 'Executive Quality Assurance & ISO Governance',
    defaultRegisterTitle: 'ISO 9001:2015 QUALITY MANUAL MASTER REGISTER',
    defaultRegisterDocCode: 'QM-REG',
    defaultSingleTitle: 'QUALITY MANUAL SECTION & POLICY SPECIFICATION',
    defaultSingleDocCode: 'QM-MANUAL',
  },
  {
    key: 'quality_goals',
    name: 'Annual Quality Objectives',
    category: 'Quality Management',
    department: 'Strategic Planning & Quality Steering Committee',
    defaultRegisterTitle: 'ANNUAL QUALITY OBJECTIVES & KPI TARGETS REGISTER',
    defaultRegisterDocCode: 'QG-REG',
    defaultSingleTitle: 'QUALITY GOAL KPI TARGET CHARTER & TRACKING DOSSIER',
    defaultSingleDocCode: 'QG-SPEC',
  },
  {
    key: 'capa',
    name: 'CAPA Corrective Actions',
    category: 'Audits & Compliance',
    department: 'Compliance & Technical Auditing',
    defaultRegisterTitle: 'CORRECTIVE & PREVENTIVE ACTIONS (CAPA) REGISTER',
    defaultRegisterDocCode: 'CAPA-REG',
    defaultSingleTitle: 'CAPA 8D CORRECTIVE & PREVENTIVE ACTION REPORT',
    defaultSingleDocCode: 'CAPA-ACT',
  },
  {
    key: 'audit',
    name: 'Quality & Compliance Audits',
    category: 'Audits & Compliance',
    department: 'Internal Audit & Compliance Assurance',
    defaultRegisterTitle: 'QUALITY & SOCIAL COMPLIANCE AUDIT REGISTER',
    defaultRegisterDocCode: 'AUD-REG',
    defaultSingleTitle: 'INTERNAL & BUYER AUDIT ASSESSMENT DOSSIER',
    defaultSingleDocCode: 'AUD-INT',
  },
  {
    key: 'root_cause',
    name: 'Root Cause Analysis (RCA)',
    category: 'Audits & Compliance',
    department: 'Continuous Improvement & Quality Assurance',
    defaultRegisterTitle: 'ROOT CAUSE ANALYSIS (RCA) INVESTIGATION REGISTER',
    defaultRegisterDocCode: 'RCA-REG',
    defaultSingleTitle: 'RCA 5-WHY & ISHIKAWA INVESTIGATION DOSSIER',
    defaultSingleDocCode: 'RCA-8D',
  },
  {
    key: 'risk_assessment',
    name: 'Risk Assessment & FMEA',
    category: 'Audits & Compliance',
    department: 'Risk Management & Operational Governance',
    defaultRegisterTitle: 'OPERATIONAL RISK ASSESSMENT & FMEA REGISTER',
    defaultRegisterDocCode: 'RSK-REG',
    defaultSingleTitle: 'RISK ASSESSMENT & FAILURE MODE (FMEA) DOSSIER',
    defaultSingleDocCode: 'RSK-FMEA',
  },
  {
    key: 'customer_complaint',
    name: 'Customer Complaints',
    category: 'Audits & Compliance',
    department: 'Customer Satisfaction & Quality Assurance',
    defaultRegisterTitle: 'CUSTOMER & BUYER COMPLAINT MASTER REGISTER',
    defaultRegisterDocCode: 'CLM-REG',
    defaultSingleTitle: '8D CUSTOMER COMPLAINT INVESTIGATION DOSSIER',
    defaultSingleDocCode: 'CLM-8D',
  },
  {
    key: 'certificate',
    name: 'Certifications & Accreditations',
    category: 'Audits & Compliance',
    department: 'Regulatory Compliance & Certification',
    defaultRegisterTitle: 'FACTORY ACCREDITATION & CERTIFICATES MASTER REGISTER',
    defaultRegisterDocCode: 'CERT-REG',
    defaultSingleTitle: 'FACTORY ACCREDITATION & CERTIFICATE DOSSIER',
    defaultSingleDocCode: 'CERT-SPEC',
  },
  {
    key: 'sub_supplier',
    name: 'Sub-Supplier & Mills',
    category: 'Supply Chain & Inventory',
    department: 'Supply Chain Quality & Vendor Assurance',
    defaultRegisterTitle: 'SUB-SUPPLIER & FABRIC MILL AUDIT REGISTER',
    defaultRegisterDocCode: 'SUP-REG',
    defaultSingleTitle: 'SUB-SUPPLIER QUALIFICATION & AUDIT DOSSIER',
    defaultSingleDocCode: 'SUP-AUD',
  },
  {
    key: 'traceability',
    name: 'Traceability & Passports',
    category: 'Supply Chain & Inventory',
    department: 'Digital Traceability & Chain of Custody',
    defaultRegisterTitle: 'SUPPLY CHAIN & LOT TRACEABILITY MASTER REGISTER',
    defaultRegisterDocCode: 'TRC-REG',
    defaultSingleTitle: 'PRODUCT TRACEABILITY CHAIN & AUDIT TRAIL DOSSIER',
    defaultSingleDocCode: 'TRC-AUD',
  },
  {
    key: 'calibration',
    name: 'Calibration & Metrology',
    category: 'Standards & Engineering',
    department: 'Metrology & Equipment Maintenance Section',
    defaultRegisterTitle: 'EQUIPMENT CALIBRATION & METROLOGY MASTER REGISTER',
    defaultRegisterDocCode: 'CAL-REG',
    defaultSingleTitle: 'EQUIPMENT CALIBRATION & VERIFICATION CERTIFICATE',
    defaultSingleDocCode: 'CAL-CERT',
  },
  {
    key: 'procedure',
    name: 'Standard Procedures',
    category: 'Standards & Engineering',
    department: 'Process Engineering & Quality Management',
    defaultRegisterTitle: 'STANDARD OPERATING PROCEDURES (SOP) MASTER REGISTER',
    defaultRegisterDocCode: 'PRC-REG',
    defaultSingleTitle: 'PROCEDURE SPECIFICATION & PROCESS FLOW DOSSIER',
    defaultSingleDocCode: 'PRC-SPEC',
  },
  {
    key: 'process_flow',
    name: 'Process Flow Maps',
    category: 'Standards & Engineering',
    department: 'Industrial Engineering & Process Control',
    defaultRegisterTitle: 'GARMENT MANUFACTURING PROCESS FLOW REGISTER',
    defaultRegisterDocCode: 'PFC-REG',
    defaultSingleTitle: 'PROCESS FLOW CHART & QUALITY GATE DOSSIER',
    defaultSingleDocCode: 'PFC-MAP',
  },
  {
    key: 'sop_management',
    name: 'SOP Protocols Library',
    category: 'Standards & Engineering',
    department: 'Technical Standards & Process Engineering',
    defaultRegisterTitle: 'STANDARD OPERATING PROCEDURES LIBRARY REGISTER',
    defaultRegisterDocCode: 'SOP-REG',
    defaultSingleTitle: 'STANDARD OPERATING PROCEDURE SPECIFICATION DOSSIER',
    defaultSingleDocCode: 'SOP-MANUAL',
  },
  {
    key: 'document_control',
    name: 'Document Control Register',
    category: 'Standards & Engineering',
    department: 'Document Control & Information Management',
    defaultRegisterTitle: 'CONTROLLED DOCUMENTS MASTER REGISTER',
    defaultRegisterDocCode: 'DOC-REG',
    defaultSingleTitle: 'CONTROLLED DOCUMENT ARCHIVE & SPECIFICATION DOSSIER',
    defaultSingleDocCode: 'DOC-SPEC',
  },
  {
    key: 'training',
    name: 'Training & Skill Matrix',
    category: 'Organization & Workforce',
    department: 'Human Resources & Technical Training Institute',
    defaultRegisterTitle: 'SKILLS MATRIX & QUALITY TRAINING REGISTER',
    defaultRegisterDocCode: 'TRN-MAT',
    defaultSingleTitle: 'TECHNICAL TRAINING PROGRAM & CURRICULUM DOSSIER',
    defaultSingleDocCode: 'TRN-CURR',
  },
  {
    key: 'job_description',
    name: 'Job Descriptions',
    category: 'Organization & Workforce',
    department: 'Human Resources & Organizational Development',
    defaultRegisterTitle: 'FACTORY JOB DESCRIPTIONS & HIERARCHY REGISTER',
    defaultRegisterDocCode: 'JD-REG',
    defaultSingleTitle: 'EMPLOYMENT POSITION & JOB DESCRIPTION SPECIFICATION',
    defaultSingleDocCode: 'JD-SPEC',
  },
  {
    key: 'organogram',
    name: 'Organogram & Hierarchy',
    category: 'Organization & Workforce',
    department: 'Human Capital & Operational Hierarchy Board',
    defaultRegisterTitle: 'CORPORATE & FACTORY ORGANIZATIONAL STRUCTURE REGISTER',
    defaultRegisterDocCode: 'ORG-REG',
    defaultSingleTitle: 'DEPARTMENT ORGANOGRAM & REPORTING STRUCTURE DOSSIER',
    defaultSingleDocCode: 'ORG-CHART',
  },
  {
    key: 'communication',
    name: 'Communication Portal',
    category: 'Organization & Workforce',
    department: 'Internal Factory Communications & HR Affairs',
    defaultRegisterTitle: 'FACTORY NOTICES & OPERATIONAL DIRECTIVES REGISTER',
    defaultRegisterDocCode: 'COM-REG',
    defaultSingleTitle: 'OFFICIAL FACTORY NOTICE & DIRECTIVE BULLETIN',
    defaultSingleDocCode: 'COM-NOT',
  },
  {
    key: 'meeting_minutes',
    name: 'Management Review Meetings',
    category: 'Organization & Workforce',
    department: 'Corporate Governance & Executive Administration',
    defaultRegisterTitle: 'MANAGEMENT REVIEW MEETING MINUTES REGISTER',
    defaultRegisterDocCode: 'MOM-REG',
    defaultSingleTitle: 'MANAGEMENT REVIEW MEETING RESOLUTIONS DOSSIER',
    defaultSingleDocCode: 'MOM-SPEC',
  },
  {
    key: 'events',
    name: 'Factory Events & Audits',
    category: 'Organization & Workforce',
    department: 'Factory Operations & Compliance Scheduling',
    defaultRegisterTitle: 'FACTORY AUDITS & REGULATORY EVENTS REGISTER',
    defaultRegisterDocCode: 'EVT-REG',
    defaultSingleTitle: 'COMPLIANCE EVENT & AUDIT SCHEDULE DOSSIER',
    defaultSingleDocCode: 'EVT-SPEC',
  },
  {
    key: 'report_analysis',
    name: 'Reports & Analytics',
    category: 'Executive & Reporting',
    department: 'Business Intelligence & Executive Analytics',
    defaultRegisterTitle: 'CENTRAL REPORTING & ANALYTICAL AUDIT REGISTER',
    defaultRegisterDocCode: 'RPT-REG',
    defaultSingleTitle: 'ANALYTICAL PERFORMANCE REPORT DOSSIER',
    defaultSingleDocCode: 'RPT-SPEC',
  },
  {
    key: 'kpi_management',
    name: 'KPI Management',
    category: 'Executive & Reporting',
    department: 'Performance Management & Strategic Steering',
    defaultRegisterTitle: 'PLANT PERFORMANCE & OPERATIONAL KPI MASTER REGISTER',
    defaultRegisterDocCode: 'KPI-REG',
    defaultSingleTitle: 'KEY PERFORMANCE INDICATOR (KPI) SPECIFICATION DOSSIER',
    defaultSingleDocCode: 'KPI-SPEC',
  },
];

export const DEFAULT_PDF_HEADER_SETTINGS: PdfHeaderSettings = {
  autoSyncWithGeneral: true,
  moduleWiseConfigs: {},

  companyName: 'Valiant Garments Manufacturing Ltd.',
  companySubtitle: 'Precision Quality, Production & Global Compliance Suite',
  logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=160&h=160&fit=crop&q=80',
  logoPosition: 'left',
  logoWidth: 125,
  showLogo: true,

  factoryAddress: 'Complex 14, Gazipur Industrial Area, Dhaka Division, Bangladesh',
  phone: '+880 2 9845120',
  email: 'qms.operations@valiantgarments.com',
  website: 'https://valiantgarments.com',
  taxRegistrationNumber: 'BIN-00291048201 / BGMEA-7721',

  layoutStyle: 'modern_split',
  accentColor: '#1e3a8a',
  secondaryColor: '#3b82f6',
  headerBgColor: 'white',
  headerDensity: 'standard',
  fontFamily: 'inter',
  headerBorderBottom: 'solid',

  showIsoCertification: true,
  isoStandardBadge: 'ISO 9001:2015 • WRAP • OEKO-TEX Standard 100 Certified',
  showDocumentMetadata: true,
  docCodePrefix: 'VAL-QMS',
  defaultOrientation: 'landscape',
  recordDocCodes: {
    buyerOrderSummary: 'PO-REG',
    buyerOrderSingle: 'PO-SPEC',
    inspectionReport: 'QC-INSP',
    capaRecord: 'CAPA-ACT',
    capaRegister: 'CAPA-REG',
    auditReport: 'AUD-INT',
    inventoryGrn: 'GRN-REC',
    testReport: 'LAB-TEST',
    testingRegister: 'LAB-REG',
    planningRegister: 'VAL-IE-REG',
    planningOrderPlan: 'PO-PLAN',
    operationBulletin: 'VAL-OB',
    reportsRegister: 'VAL-RPT-REG',
    reportSingle: 'VAL-RPT-SPEC',
    incomingQcRegister: 'IQC-REG',
    incomingQcCertificate: 'IQC-CERT',
    complaintRegister: 'CLM-REG',
    complaintInvestigation: 'CLM-8D',
    supplierRegister: 'SUP-REG',
    supplierAudit: 'SUP-AUD',
    riskRegister: 'RSK-REG',
    riskReport: 'RSK-FMEA',
    calibrationRegister: 'CAL-REG',
    calibrationCertificate: 'CAL-CERT',
    defectCatalog: 'DEF-CAT',
    defectSpecSheet: 'DEF-SPEC',
    trainingMatrix: 'TRN-MAT',
    trainingCurriculum: 'TRN-CURR',
    docControlRegister: 'DOC-REG',
    controlledDocumentDossier: 'DOC-SPEC',
    rcaRegister: 'RCA-REG',
    rcaDossier: 'RCA-8D',
    meetingMinutesRegister: 'MOM-REG',
    meetingMinutesDossier: 'MOM-SPEC',
    factoryEventsRegister: 'EVT-REG',
    factoryEventDossier: 'EVT-SPEC',
    sopRegister: 'SOP-REG',
    sopManual: 'SOP-MANUAL',
    jobDescriptionRegister: 'JD-REG',
    jobDescriptionDossier: 'JD-SPEC',
    qualityManualRegister: 'QM-REG',
    qualityManualDossier: 'QM-MANUAL',
    traceabilityRegister: 'TRC-REG',
    traceabilityDossier: 'TRC-AUD',
    certificateRegister: 'CERT-REG',
    certificateDossier: 'CERT-SPEC',
    organogramRegister: 'ORG-REG',
    organogramChart: 'ORG-CHART',
    procedureRegister: 'PRC-REG',
    procedureDossier: 'PRC-SPEC',
    processFlowRegister: 'PFC-REG',
    processFlowDossier: 'PFC-MAP',
    communicationRegister: 'COM-REG',
    communicationDossier: 'COM-NOT',
  },
  showQrVerificationCode: true,
  qrCodeText: 'https://valiantgarments.com/verify-qms-doc',
  showConfidentialNotice: true,
  confidentialNoticeText: 'STRICTLY CONFIDENTIAL • FOR INTERNAL AUDIT & BUYER VERIFICATION ONLY',

  appliedModules: [
    'buyer_order',
    'report_analysis',
    'inspections',
    'inventory',
    'production',
    'planning_ie',
    'capa',
    'audit',
    'testing',
    'sub_supplier',
    'risk_assessment',
    'calibration',
    'defects_library',
    'training',
    'document_control',
    'root_cause',
    'meeting_minutes',
    'events',
    'sop_management',
    'job_description',
    'quality_manual',
    'traceability',
    'certificate',
    'organogram',
    'procedure',
    'process_flow',
    'communication',
  ],
  lastUpdatedAt: new Date().toISOString(),
};

const STORAGE_KEYS = {
  PDF_HEADER: 'garments_erp_pdf_header_settings',
  GENERAL_SETTINGS: 'garments_erp_general_settings',
};

/**
 * Loads current general settings from storage
 */
export function getGeneralSettingsFromStorage(): Record<string, any> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GENERAL_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Helper to fetch record-specific doc code prefix from settings
 */
export function getRecordDocCode(recordType: string, fallbackPrefix: string = 'DOC'): string {
  const settings = loadPdfHeaderSettings();
  if (settings.recordDocCodes && settings.recordDocCodes[recordType]) {
    return settings.recordDocCodes[recordType];
  }
  return fallbackPrefix || settings.docCodePrefix || 'VAL-QMS';
}

/**
 * Loads the PDF Header Settings, auto-syncing from General Settings if autoSyncWithGeneral is true
 */
export function loadPdfHeaderSettings(): PdfHeaderSettings {
  let settings = { ...DEFAULT_PDF_HEADER_SETTINGS };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PDF_HEADER);
      if (raw) {
        const parsed = JSON.parse(raw);
        settings = {
          ...settings,
          ...parsed,
          recordDocCodes: {
            ...DEFAULT_PDF_HEADER_SETTINGS.recordDocCodes,
            ...(parsed.recordDocCodes || {}),
          },
          moduleWiseConfigs: {
            ...(parsed.moduleWiseConfigs || {}),
          },
        };
      }
    } catch {
      // fallback
    }

    // Auto-sync company name, logo, address, phone, email, and tax reg from General Settings
    if (settings.autoSyncWithGeneral) {
      const general = getGeneralSettingsFromStorage();
      if (general) {
        if (general.companyLegalName || general.tradeName) {
          settings.companyName = general.companyLegalName || general.tradeName;
        }
        if (general.erpTagline) {
          settings.companySubtitle = general.erpTagline;
        }
        if (general.erpLogoUrl) {
          settings.logoUrl = general.erpLogoUrl;
        }
        if (general.factoryAddress || general.hqAddress) {
          settings.factoryAddress = general.factoryAddress || general.hqAddress;
        }
        if (general.supportPhone) {
          settings.phone = general.supportPhone;
        }
        if (general.officialEmail) {
          settings.email = general.officialEmail;
        }
        if (general.websiteUrl) {
          settings.website = general.websiteUrl;
        }
        if (general.vatRegistrationNo || general.taxIdentificationNo) {
          settings.taxRegistrationNumber = [general.vatRegistrationNo, general.bgmeaRegNo]
            .filter(Boolean)
            .join(' / ');
        }
      }
    }
  }

  return settings;
}

/**
 * Saves PDF Header Settings to localStorage and pushes to backend module store
 */
export function savePdfHeaderSettings(settings: PdfHeaderSettings): void {
  if (typeof window === 'undefined') return;

  const payload: PdfHeaderSettings = {
    ...settings,
    lastUpdatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEYS.PDF_HEADER, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('erp_pdf_header_updated', { detail: payload }));
  } catch (err) {
    console.error('Failed to save PDF header settings to localStorage:', err);
  }

  // Asynchronously persist to backend module store
  fetch('/api/modules/pdf_header_settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  }).catch((err) => {
    console.warn('Failed to sync PDF header settings to server:', err);
  });
}

/**
 * Resolves the configured Record Title and Document Code for any module,
 * prioritizing user customizations from settings and falling back to QMS standard defaults.
 */
export function getModuleExportConfig(
  settings: PdfHeaderSettings,
  moduleKey: string,
  type: 'register' | 'single' = 'register',
  itemIdentifier?: string
): {
  title: string;
  docCode: string;
  fullDocCode: string;
  department: string;
  prefix: string;
} {
  const normalizedKey =
    moduleKey === 'complaint' ? 'customer_complaint' :
    moduleKey === 'rca' ? 'root_cause' :
    moduleKey === 'sop' ? 'sop_management' :
    moduleKey === 'planning' ? 'planning_ie' :
    moduleKey === 'inspection' ? 'inspections' :
    moduleKey === 'defect_library' ? 'defects_library' :
    moduleKey === 'reports' ? 'report_analysis' :
    moduleKey;

  const definition = DEFAULT_MODULE_HEADER_CONFIGS.find((m) => m.key === normalizedKey || m.key === moduleKey);
  const custom = settings.moduleWiseConfigs?.[normalizedKey] || settings.moduleWiseConfigs?.[moduleKey];
  const prefix = settings.docCodePrefix || 'VAL-QMS';

  let title = '';
  let docCode = '';
  const department = definition?.department || 'Quality Assurance & Compliance Division';

  const legacyDocCode = type === 'register' ? (
    settings.recordDocCodes?.[normalizedKey + 'Register'] ||
    settings.recordDocCodes?.[moduleKey + 'Register'] ||
    (normalizedKey === 'customer_complaint' ? settings.recordDocCodes?.complaintRegister : undefined) ||
    (normalizedKey === 'capa' ? settings.recordDocCodes?.capaRegister : undefined) ||
    (normalizedKey === 'buyer_order' ? settings.recordDocCodes?.buyerOrderSummary : undefined) ||
    (normalizedKey === 'calibration' ? settings.recordDocCodes?.calibrationRegister : undefined) ||
    (normalizedKey === 'inspections' ? settings.recordDocCodes?.inspectionReport : undefined)
  ) : (
    settings.recordDocCodes?.[normalizedKey + 'Single'] ||
    settings.recordDocCodes?.[moduleKey + 'Single'] ||
    (normalizedKey === 'customer_complaint' ? settings.recordDocCodes?.complaintInvestigation : undefined) ||
    (normalizedKey === 'capa' ? settings.recordDocCodes?.capaRecord : undefined) ||
    (normalizedKey === 'buyer_order' ? settings.recordDocCodes?.buyerOrderSingle : undefined) ||
    (normalizedKey === 'calibration' ? settings.recordDocCodes?.calibrationCertificate : undefined) ||
    (normalizedKey === 'inspections' ? settings.recordDocCodes?.inspectionReport : undefined)
  );

  if (type === 'register') {
    title = custom?.registerTitle?.trim() || definition?.defaultRegisterTitle || 'MASTER RECORD REGISTER';
    docCode = custom?.registerDocCode?.trim() || legacyDocCode || definition?.defaultRegisterDocCode || 'REG';
  } else {
    title = custom?.singleTitle?.trim() || definition?.defaultSingleTitle || 'TECHNICAL RECORD DOSSIER';
    docCode = custom?.singleDocCode?.trim() || legacyDocCode || definition?.defaultSingleDocCode || 'SPEC';
  }

  const fullDocCode = itemIdentifier ? `${prefix}-${docCode}-${itemIdentifier}` : `${prefix}-${docCode}`;

  return {
    title,
    docCode,
    fullDocCode,
    department,
    prefix,
  };
}

/**
 * Convenient helper to render the PDF Header HTML directly using the module's configured settings
 */
export function renderPdfHeaderHtmlForModule(
  settings: PdfHeaderSettings,
  moduleKey: string,
  type: 'register' | 'single' = 'register',
  itemIdentifier?: string,
  docDate: string = new Date().toISOString().split('T')[0]
): string {
  const config = getModuleExportConfig(settings, moduleKey, type, itemIdentifier);
  return renderPdfHeaderHtml(settings, config.title, config.fullDocCode, docDate, config.department);
}

/**
 * Generates the clean HTML and inline CSS for printing this header across any module report/export
 */
export function renderPdfHeaderHtml(
  settings: PdfHeaderSettings,
  docTitle: string,
  docCode: string,
  docDate: string = new Date().toISOString().split('T')[0],
  department: string = 'Quality Assurance & Compliance Division'
): string {
  const {
    companyName,
    companySubtitle,
    logoUrl,
    logoWidth,
    showLogo,
    factoryAddress,
    phone,
    email,
    website,
    taxRegistrationNumber,
    layoutStyle,
    accentColor,
    secondaryColor,
    headerDensity,
    showIsoCertification,
    isoStandardBadge,
    showDocumentMetadata,
    showQrVerificationCode,
    showConfidentialNotice,
    confidentialNoticeText,
  } = settings;

  const paddingY = headerDensity === 'compact' ? '8px' : headerDensity === 'spacious' ? '16px' : '12px';
  const logoImgHtml = showLogo && logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 58px; max-width: ${logoWidth}px; object-fit: contain; border-radius: 4px;" />`
    : '';

  const qrHtml = showQrVerificationCode
    ? `
    <div style="text-align: right; margin-left: 14px;">
      <div style="display: inline-block; padding: 4px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center;">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="44" height="44" fill="white"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M4 4H18V18H4V4ZM6 6H16V16H6V6ZM8 8H14V14H8V8ZM4 26H18V40H4V26ZM6 28H16V38H6V28ZM8 30H14V36H8V30ZM26 4H40V18H26V4ZM28 6H38V16H28V6ZM30 8H36V14H30V8ZM22 4H24V10H22V4ZM22 14H24V20H22V14ZM4 22H10V24H4V22ZM14 22H20V24H14V22ZM26 22H30V26H26V22ZM34 22H40V24H34V22ZM22 26H24V32H22V26ZM32 26H36V30H32V26ZM38 26H40V32H38V26ZM26 32H30V36H26V32ZM36 32H38V38H36V32ZM22 36H24V40H22V36ZM30 36H34V40H30V36ZM40 36H42V40H40V36Z" fill="#0f172a"/>
        </svg>
        <div style="font-size: 7px; font-weight: 700; color: #64748b; margin-top: 1px; font-family: monospace;">VERIFIED</div>
      </div>
    </div>`
    : '';

  // 1. Layout Style: Executive Centered
  if (layoutStyle === 'executive_centered') {
    return `
      <header class="universal-pdf-header" style="padding: ${paddingY} 0; border-bottom: 2px solid ${accentColor}; margin-bottom: 14px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${showLogo ? `<div style="margin-bottom: 6px;">${logoImgHtml}</div>` : ''}
        <div style="font-size: 19px; font-weight: 900; color: ${accentColor}; letter-spacing: 0.5px; text-transform: uppercase;">${companyName}</div>
        ${companySubtitle ? `<div style="font-size: 11px; font-weight: 600; color: #475569; margin-top: 2px;">${companySubtitle}</div>` : ''}
        <div style="font-size: 9.5px; color: #64748b; margin-top: 3px;">
          ${factoryAddress} • Tel: ${phone} • Email: ${email}
          ${taxRegistrationNumber ? ` • ${taxRegistrationNumber}` : ''}
        </div>
        ${showIsoCertification ? `<div style="display: inline-block; margin-top: 5px; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; font-size: 8.5px; font-weight: 700; color: ${accentColor}; border: 1px solid #e2e8f0;">${isoStandardBadge}</div>` : ''}
        
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; text-align: left;">
          <div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${docTitle}</div>
            <div style="font-size: 9px; color: #64748b;">${department}</div>
          </div>
          ${showDocumentMetadata ? `
          <div style="text-align: right; font-size: 9px; font-family: monospace; color: #334155;">
            <div><strong>DOC NO:</strong> ${docCode}</div>
            <div><strong>DATE:</strong> ${docDate}</div>
          </div>` : ''}
        </div>
        ${showConfidentialNotice ? `<div style="margin-top: 4px; font-size: 8px; font-weight: 800; color: #b91c1c; letter-spacing: 0.5px;">${confidentialNoticeText}</div>` : ''}
      </header>
    `;
  }

  // 2. Layout Style: Classic Bordered Factory
  if (layoutStyle === 'classic_bordered') {
    return `
      <header class="universal-pdf-header" style="padding: ${paddingY}; border: 2px solid ${accentColor}; border-radius: 6px; margin-bottom: 14px; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${logoImgHtml}
            <div>
              <div style="font-size: 17px; font-weight: 900; color: ${accentColor}; text-transform: uppercase;">${companyName}</div>
              <div style="font-size: 9.5px; color: #475569;">${factoryAddress} • Email: ${email}</div>
            </div>
          </div>
          ${qrHtml}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${docTitle}</span>
            ${showIsoCertification ? `<span style="margin-left: 8px; font-size: 8.5px; font-weight: 700; color: #047857; background: #ecfdf5; padding: 1px 6px; border-radius: 3px;">${isoStandardBadge}</span>` : ''}
          </div>
          ${showDocumentMetadata ? `
          <div style="font-size: 9px; font-family: monospace; color: #475569;">
            <span>REF: <strong>${docCode}</strong></span> | <span>DATE: <strong>${docDate}</strong></span>
          </div>` : ''}
        </div>
      </header>
    `;
  }

  // 3. Layout Style: Ribbon Accent Top
  if (layoutStyle === 'ribbon_accent') {
    return `
      <header class="universal-pdf-header" style="margin-bottom: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="height: 5px; background: linear-gradient(90deg, ${accentColor} 0%, ${secondaryColor} 100%); border-radius: 2px;"></div>
        <div style="padding: ${paddingY} 0; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #cbd5e1;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${logoImgHtml}
            <div>
              <div style="font-size: 18px; font-weight: 900; color: ${accentColor}; letter-spacing: 0.3px;">${companyName}</div>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${factoryAddress} • Tel: ${phone} • ${website}</div>
              ${showIsoCertification ? `<div style="font-size: 8.5px; font-weight: 700; color: ${accentColor}; margin-top: 3px;">✓ ${isoStandardBadge}</div>` : ''}
            </div>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="text-align: right;">
              <div style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase;">${docTitle}</div>
              ${showDocumentMetadata ? `
              <div style="font-size: 9px; font-family: monospace; color: #475569; margin-top: 2px;">
                <div>CODE: <strong>${docCode}</strong></div>
                <div>DATE: <strong>${docDate}</strong></div>
              </div>` : ''}
            </div>
            ${qrHtml}
          </div>
        </div>
        ${showConfidentialNotice ? `<div style="font-size: 7.5px; font-weight: 700; color: #991b1b; text-align: center; margin-top: 3px; letter-spacing: 0.5px;">${confidentialNoticeText}</div>` : ''}
      </header>
    `;
  }

  // 4. Layout Style: Compact Clean (for multi-page floor sheets)
  if (layoutStyle === 'compact_clean') {
    return `
      <header class="universal-pdf-header" style="padding: 6px 0; border-bottom: 1.5px solid #0f172a; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${logoImgHtml}
          <div>
            <span style="font-size: 14px; font-weight: 900; color: ${accentColor};">${companyName}</span>
            <span style="font-size: 9px; color: #64748b; margin-left: 8px;">${factoryAddress}</span>
          </div>
        </div>
        <div style="text-align: right; font-size: 9px;">
          <span style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-right: 10px;">${docTitle}</span>
          <span style="font-family: monospace; color: #475569;">${docCode} • ${docDate}</span>
        </div>
      </header>
    `;
  }

  // 5. Default: Modern Split (Default standard high-impact split header)
  return `
    <header class="universal-pdf-header" style="padding: ${paddingY} 0; border-bottom: 2.5px solid ${accentColor}; margin-bottom: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <!-- Left: Logo & Company Identity -->
        <div style="display: flex; align-items: flex-start; gap: 14px;">
          ${logoImgHtml}
          <div>
            <div style="font-size: 18px; font-weight: 900; color: ${accentColor}; letter-spacing: 0.5px; text-transform: uppercase;">
              ${companyName}
            </div>
            ${companySubtitle ? `<div style="font-size: 10.5px; font-weight: 600; color: #475569; margin-top: 1px;">${companySubtitle}</div>` : ''}
            <div style="font-size: 9px; color: #64748b; margin-top: 3px; max-width: 520px; line-height: 1.35;">
              ${factoryAddress}<br />
              <span>Tel: ${phone}</span> • <span>Email: ${email}</span> • <span>Web: ${website}</span>
              ${taxRegistrationNumber ? ` • <span>Reg: ${taxRegistrationNumber}</span>` : ''}
            </div>
            ${showIsoCertification ? `
            <div style="display: inline-block; margin-top: 4px; padding: 2px 7px; border-radius: 4px; background: #f8fafc; font-size: 8.5px; font-weight: 700; color: ${accentColor}; border: 1px solid #e2e8f0;">
              ✓ ${isoStandardBadge}
            </div>` : ''}
          </div>
        </div>

        <!-- Right: Document Info & QR Verification -->
        <div style="display: flex; align-items: flex-start;">
          <div style="text-align: right;">
            <div style="font-size: 15px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px;">
              ${docTitle}
            </div>
            <div style="font-size: 9.5px; font-weight: 600; color: #64748b; margin-top: 1px;">
              ${department}
            </div>
            ${showDocumentMetadata ? `
            <div style="margin-top: 4px; font-family: monospace; font-size: 9px; color: #334155; line-height: 1.4;">
              <div>DOC CODE: <strong style="color: ${accentColor};">${docCode}</strong></div>
              <div>DATE: <strong>${docDate}</strong></div>
            </div>` : ''}
          </div>
          ${qrHtml}
        </div>
      </div>

      ${showConfidentialNotice ? `
      <div style="margin-top: 6px; padding-top: 3px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 8px; color: #64748b;">
        <span style="font-weight: 800; color: #b91c1c; letter-spacing: 0.5px;">${confidentialNoticeText}</span>
        <span>Generated by Project ULTRA Garments QMS ERP</span>
      </div>` : ''}
    </header>
  `;
}
