import {
  AuditTypeDefinition,
  ManagedAuditQuestion,
  AuditChecklistItem,
  AuditCategory,
} from '@/lib/types/modules';
import { ISO_9001_DEFAULT_CHECKLIST } from './iso9001ChecklistData';

export const STORAGE_KEY_AUDIT_TYPES = 'erp_audit_types_v1';
export const STORAGE_KEY_AUDIT_QUESTIONS = 'erp_audit_questions_v1';

// ─── INITIAL AUDIT TYPES ──────────────────────────────────────────────────────
export const INITIAL_AUDIT_TYPES: AuditTypeDefinition[] = [
  {
    id: 'type-safety-ehs',
    code: 'SAF-EHS',
    name: 'Safety, Health & Environment (EHS / OSHA)',
    category: 'SAFETY',
    standard: 'ISO 45001:2018 & National Fire & Safety Code',
    description:
      'Covers fire safety systems, emergency exits, machine needle/pulley guarding, personal protective equipment (PPE), chemical storage, electrical safety, and health clinic amenities.',
    defaultAuditorOrg: 'EHS & Occupational Safety Cell',
    defaultDepartment: 'Production, Maintenance & Chemical Store',
    badgeColor: 'amber',
    icon: 'AlertTriangle',
    totalAvailableMarks: 100,
    passMarksThreshold: 85,
    criticalNcFailsAudit: true,
    scoringScheme: {
      conformityRate: 1.0,
      minorNcRate: 0.75,
      majorNcRate: 0.5,
      criticalNcRate: 0.0,
    },
    isSystemDefault: true,
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
  },
  {
    id: 'type-iso-9001',
    code: 'ISO-9001',
    name: 'ISO 9001:2015 Quality Management System',
    category: 'INTERNAL',
    standard: 'ISO 9001:2015 Quality Management Standard',
    description:
      'Evaluates quality policy, risk-based thinking, leadership accountability, customer focus, process controls, traceability, internal auditing, and continual improvement across all operational departments.',
    defaultAuditorOrg: 'Valiant Internal Quality Assurance Dept.',
    defaultDepartment: 'Factory Wide (Cutting, Sewing, Finishing, Lab)',
    badgeColor: 'blue',
    icon: 'ShieldCheck',
    totalAvailableMarks: 100,
    passMarksThreshold: 80,
    criticalNcFailsAudit: true,
    scoringScheme: {
      conformityRate: 1.0,
      minorNcRate: 0.75,
      majorNcRate: 0.5,
      criticalNcRate: 0.0,
    },
    isSystemDefault: true,
    createdAt: '2026-01-10T08:30:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
  },
  {
    id: 'type-social-compliance',
    code: 'WRAP-SMETA',
    name: 'Social Compliance & Ethical Labor (WRAP / SMETA)',
    category: 'COMPLIANCE',
    standard: 'WRAP 12 Principles & SMETA 4-Pillar Ethical Code',
    description:
      'Covers worker compensation, working hours & voluntary overtime, child labor prohibition, forced labor prevention, non-discrimination, grievance redressal, and workplace sanitation.',
    defaultAuditorOrg: 'Social Compliance & Human Resources Dept.',
    defaultDepartment: 'HR, Payroll, Welfare & Canteen',
    badgeColor: 'purple',
    icon: 'Users',
    totalAvailableMarks: 100,
    passMarksThreshold: 80,
    criticalNcFailsAudit: true,
    scoringScheme: {
      conformityRate: 1.0,
      minorNcRate: 0.75,
      majorNcRate: 0.5,
      criticalNcRate: 0.0,
    },
    isSystemDefault: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
  },
  {
    id: 'type-5s-lean',
    code: '5S-LEAN',
    name: '5S Workplace Housekeeping & Visual Factory',
    category: 'INTERNAL',
    standard: 'Japanese 5S Methodology (Sort, Set in Order, Shine, Standardize, Sustain)',
    description:
      'Evaluates shopfloor cleanliness, gangway demarcation, tool shadow boards, red-tag sorting, visual SOP adherence, and daily 5S maintenance routines across sewing and cutting halls.',
    defaultAuditorOrg: 'Lean & Continuous Improvement Division',
    defaultDepartment: 'Cutting Floor, Sewing Hall, Finishing & Warehouse',
    badgeColor: 'emerald',
    icon: 'Sparkles',
    totalAvailableMarks: 100,
    passMarksThreshold: 80,
    criticalNcFailsAudit: false,
    scoringScheme: {
      conformityRate: 1.0,
      minorNcRate: 0.75,
      majorNcRate: 0.5,
      criticalNcRate: 0.0,
    },
    isSystemDefault: true,
    createdAt: '2026-02-15T11:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
  },
  {
    id: 'type-sub-supplier',
    code: 'VEND-EVAL',
    name: 'Sub-Supplier & Vendor Facility Evaluation',
    category: 'SUB_SUPPLIER',
    standard: 'Valiant Vendor Quality Assurance Manual (VQAM)',
    description:
      'Rigorous evaluation of raw material suppliers, printing & embroidery mills, washing plants, and accessories vendors covering incoming inspection, calibration, needle policy, and lot traceability.',
    defaultAuditorOrg: 'Valiant Vendor Quality Division',
    defaultDepartment: 'Sub-Contractor Mills & Inward Stores',
    badgeColor: 'indigo',
    icon: 'Building2',
    totalAvailableMarks: 100,
    passMarksThreshold: 80,
    criticalNcFailsAudit: true,
    scoringScheme: {
      conformityRate: 1.0,
      minorNcRate: 0.75,
      majorNcRate: 0.5,
      criticalNcRate: 0.0,
    },
    isSystemDefault: true,
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
  },
];

// ─── INITIAL QUESTIONS BANK ───────────────────────────────────────────────────
export const INITIAL_AUDIT_QUESTIONS: ManagedAuditQuestion[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. SAFETY & EHS AUDIT QUESTIONS (type-safety-ehs)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'saf-q1',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 1: Fire & Emergency Preparedness',
    clauseNumber: 'SAF-1.1',
    subClauseTitle: 'Fire Extinguisher & Hydrant Maintenance',
    question:
      'Are fire extinguishers inspected every 30 days, completely unobstructed, mounted at the correct height (1.2m), and tagged with valid inspection stamps?',
    guidance:
      'Inspect tags on all extinguishers across floor 1-4. Check pressure gauge in green zone and verify HR monthly extinguisher inspection logbook.',
    maxMarks: 5,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 1,
  },
  {
    id: 'saf-q2',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 1: Fire & Emergency Preparedness',
    clauseNumber: 'SAF-1.2',
    subClauseTitle: 'Emergency Exits & Evacuation Routes',
    question:
      'Are all emergency evacuation exits completely unlocked from inside during operating hours, free of fabric/carton obstructions, and marked with illuminated battery-backup EXIT signs?',
    guidance:
      'Physically check panic bars and push doors on all stairwells. Verify exit corridors have at least 1.15m clear gangway without temporary storage.',
    maxMarks: 5,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 2,
  },
  {
    id: 'saf-q3',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 1: Fire & Emergency Preparedness',
    clauseNumber: 'SAF-1.3',
    subClauseTitle: 'Fire Alarm & Emergency Lighting',
    question:
      'Are central fire alarm manual call points, heat/smoke detectors, and emergency battery-backed backup lights tested and fully operational during quarterly emergency mock drills?',
    guidance:
      'Check emergency lighting functional check test switch. Review fire drill report with evacuation timing (<3 minutes) and civil defense fire department participation records.',
    maxMarks: 5,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 3,
  },
  {
    id: 'saf-q4',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 2: Machine Safety & Electrical Guarding',
    clauseNumber: 'SAF-2.1',
    subClauseTitle: 'Sewing Machine Needle & Pulley Guards',
    question:
      'Are 100% of sewing machines equipped with physical finger needle guards, eye shields, and motor pulley belt covers securely attached and used by operators?',
    guidance:
      'Inspect minimum 20 active sewing machines across lines 1-12. Needle guards must be installed no more than 6mm above the needle plate.',
    maxMarks: 5,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 4,
  },
  {
    id: 'saf-q5',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 2: Machine Safety & Electrical Guarding',
    clauseNumber: 'SAF-2.2',
    subClauseTitle: 'Cutting Knife Mesh Glove Compliance',
    question:
      'Do all straight-knife, round-knife, and band-knife fabric cutting operators wear certified stainless-steel mesh safety gloves on their non-dominant hand during cutting?',
    guidance:
      'Audit cutting table 1 to 6. Verify operators have proper fitting steel gloves without tears and strap fastened securely.',
    maxMarks: 5,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 5,
  },
  {
    id: 'saf-q6',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 2: Machine Safety & Electrical Guarding',
    clauseNumber: 'SAF-2.3',
    subClauseTitle: 'Electrical Distribution Panels & ELCB',
    question:
      'Are electrical main boards and sub-distribution panels enclosed with metal doors, locked, equipped with functional Earth Leakage Circuit Breakers (ELCB/RCCB), and floored with rubber insulation mats?',
    guidance:
      'Inspect panel board doors, check danger warning signs in local language, and verify thermoscan / infrared inspection report for loose electrical terminals.',
    maxMarks: 5,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 6,
  },
  {
    id: 'saf-q7',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 3: Chemical Safety & Hazardous Materials',
    clauseNumber: 'SAF-3.1',
    subClauseTitle: 'Chemical Secondary Containment & MSDS',
    question:
      'Are spot lifters, screen printing inks, and maintenance solvents stored in secondary containment pallets (110% capacity) with updated Safety Data Sheets (MSDS) posted in the local language?',
    guidance:
      'Inspect chemical storage warehouse and spot cleaning rooms. Check chemical compatibility matrix, spill response kit (sand/absorbent pillows), and warning pictograms.',
    maxMarks: 5,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 7,
  },
  {
    id: 'saf-q8',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 3: Chemical Safety & Hazardous Materials',
    clauseNumber: 'SAF-3.2',
    subClauseTitle: 'Emergency Eyewash & Safety Showers',
    question:
      'Are emergency eyewash stations and drench showers accessible within 10 seconds of chemical handling zones, unobstructed, delivering clean potable water, and flushed weekly?',
    guidance:
      'Operate eyewash valves to check water flow rate, clarity, and inspect weekly inspection log card attached to each station.',
    maxMarks: 5,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 8,
  },
  {
    id: 'saf-q9',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 3: Chemical Safety & Hazardous Materials',
    clauseNumber: 'SAF-3.3',
    subClauseTitle: 'Chemical Worker PPE Enforcement',
    question:
      'Are workers involved in spot removal, printing, screen washing, and boiler operations equipped with and actively wearing nitrile gloves, organic vapor respirators, and safety goggles?',
    guidance:
      'Observe workers in spot cleaning booths. Check exhaust booth suction velocity (min 0.5 m/s) and PPE replacement logs.',
    maxMarks: 5,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 9,
  },
  {
    id: 'saf-q10',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 4: Occupational Health & First Aid',
    clauseNumber: 'SAF-4.1',
    subClauseTitle: 'First Aid Boxes & Certified Responders',
    question:
      'Are first aid boxes adequately stocked per regulatory standards, unobstructed, unlocked during working hours, and attended by certified first-aid trained personnel on every floor?',
    guidance:
      'Check inventory list inside first aid box (burn dressing, antiseptic, bandage, eye wash, scissors). Verify first aider certificates issued by Red Crescent / St. John.',
    maxMarks: 5,
    severityOnFailure: 'MINOR',
    status: 'CONFORMITY',
    sortOrder: 10,
  },
  {
    id: 'saf-q11',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 4: Occupational Health & First Aid',
    clauseNumber: 'SAF-4.2',
    subClauseTitle: 'Potable Drinking Water Sanitation',
    question:
      'Are hygienic drinking water stations provided with water temperature control, tested quarterly by an accredited laboratory for microbiological and chemical safety, and clearly marked?',
    guidance:
      'Inspect water dispensers, verify UV/RO filter maintenance record, and review recent 3rd party water potability test certificates.',
    maxMarks: 5,
    severityOnFailure: 'MINOR',
    status: 'CONFORMITY',
    sortOrder: 11,
  },
  {
    id: 'saf-q12',
    auditTypeId: 'type-safety-ehs',
    clause: 'Section 4: Occupational Health & First Aid',
    clauseNumber: 'SAF-4.3',
    subClauseTitle: 'Workplace Lighting & Ergonomics',
    question:
      'Is ambient and task lighting maintained above 500 lux at final inspection tables and 300 lux in sewing aisles, with ergonomic seating and anti-fatigue mats for standing workstations?',
    guidance:
      'Take lux meter readings at 5 random sewing and QA stations. Check operator chair height adjustability and anti-fatigue mats at fusing and cutting lines.',
    maxMarks: 5,
    severityOnFailure: 'MINOR',
    status: 'CONFORMITY',
    sortOrder: 12,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. ISO 9001:2015 CORE QUESTIONS (type-iso-9001)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'iso-core-1',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 4: Context of the Organization',
    clauseNumber: '4.1a',
    subClauseTitle: 'Context & Strategic Direction',
    question:
      'How has the organization determined external and internal issues relevant to its purpose and strategic direction? How do these affect the ability to achieve the intended result of the QMS?',
    guidance: 'Verify SWOT/PESTLE matrix, strategic plans, factory policy alignment, and risk registers.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 1,
  },
  {
    id: 'iso-core-2',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 5: Leadership',
    clauseNumber: '5.2a',
    subClauseTitle: 'Quality Policy Communication',
    question:
      'Is the quality policy available and maintained as documented information, communicated, understood, and applied within the organization, and available to relevant interested parties?',
    guidance: 'Check quality policy display boards, worker interview awareness, and supplier onboarding handbooks.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 2,
  },
  {
    id: 'iso-core-3',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 6: Planning',
    clauseNumber: '6.1a',
    subClauseTitle: 'Risks & Opportunities Actions',
    question:
      'Has the factory planned actions to address organizational and quality risks, integrate them into QMS processes, and evaluate the effectiveness of these actions?',
    guidance: 'Inspect Risk Assessment & Opportunity register, FMEA analysis for new product styles, and mitigation tracking.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 3,
  },
  {
    id: 'iso-core-4',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 7: Support',
    clauseNumber: '7.1.5a',
    subClauseTitle: 'Monitoring & Measuring Resources Calibration',
    question:
      'Are measurement instruments (fabric GSM cutters, GSM scales, crockmeters, light boxes, pull-test meters) calibrated against traceable national standards at specified intervals?',
    guidance: 'Inspect calibration stickers, master certificates from ISO 17025 accredited labs, and daily calibration check logs.',
    maxMarks: 10,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 4,
  },
  {
    id: 'iso-core-5',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 8: Operation',
    clauseNumber: '8.5.1a',
    subClauseTitle: 'Control of Production & Service Provision',
    question:
      'Are production lines operating under controlled conditions with approved Tech Packs, Golden Seal Samples, Pre-Production (PP) Meeting minutes, and Trim Cards at each workstation?',
    guidance: 'Audit sewing line 03. Verify line QA has signed PP sample, tech pack revision matches ERP, and pilot run defects addressed.',
    maxMarks: 10,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 5,
  },
  {
    id: 'iso-core-6',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 8: Operation',
    clauseNumber: '8.5.2a',
    subClauseTitle: 'Identification and Traceability',
    question:
      'Does the factory maintain positive identification of work-in-progress across cutting, bundle ticketing, sewing, finishing, and carton packing for end-to-end traceability?',
    guidance: 'Pick random carton from packing area, trace back to bundle ticket, cutting lay report, fabric roll number, and dye lot.',
    maxMarks: 10,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 6,
  },
  {
    id: 'iso-core-7',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 8: Operation',
    clauseNumber: '8.7a',
    subClauseTitle: 'Control of Nonconforming Outputs',
    question:
      'Are non-conforming materials and defective garments clearly quarantined in identified reject bins, documented on NCR registers, and prevented from unintended delivery?',
    guidance: 'Check red reject boxes in sewing & finishing, review Scrap Disposal Committee logs, and verify rework sign-offs.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 7,
  },
  {
    id: 'iso-core-8',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 9: Performance Evaluation',
    clauseNumber: '9.2a',
    subClauseTitle: 'Internal Audit Program',
    question:
      'Does the organization conduct internal audits at planned intervals, using competent and independent auditors, to provide information on whether the QMS conforms to planned arrangements?',
    guidance: 'Review annual internal audit calendar, auditor training certificates, non-conformance reports, and timely CAPA closure.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 8,
  },
  {
    id: 'iso-core-9',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 9: Performance Evaluation',
    clauseNumber: '9.3a',
    subClauseTitle: 'Management Review Process',
    question:
      'Does top management review the organization’s QMS at planned intervals to ensure its continuing suitability, adequacy, effectiveness, and alignment with strategic direction?',
    guidance: 'Inspect Management Review Meeting (MRM) minutes, action item logs, and resource allocation decisions.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 9,
  },
  {
    id: 'iso-core-10',
    auditTypeId: 'type-iso-9001',
    clause: 'Clause 10: Improvement',
    clauseNumber: '10.2a',
    subClauseTitle: 'Nonconformity and Corrective Action (CAPA)',
    question:
      'When a nonconformity occurs, does the organization react, evaluate the need for action to eliminate causes, implement corrective action, and review its effectiveness?',
    guidance: 'Verify 8D / 5-Why root cause analysis records, corrective action verification dates, and recurrence prevention proof.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 10,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. SOCIAL COMPLIANCE & LABOR QUESTIONS (type-social-compliance)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'soc-q1',
    auditTypeId: 'type-social-compliance',
    clause: 'Section 1: Child Labor & Young Workers',
    clauseNumber: 'SOC-1.1',
    subClauseTitle: 'Age Verification & Recruitment Protocol',
    question:
      'Does the factory maintain strict age verification systems (National ID verification, biometric scanning, medical age verification) ensuring no worker under 18 is employed in hazardous roles and no child labor exists?',
    guidance:
      'Review 25 personnel files across departments. Verify photocopies of National Identity Cards (NID) and verified recruitment records.',
    maxMarks: 15,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 1,
  },
  {
    id: 'soc-q2',
    auditTypeId: 'type-social-compliance',
    clause: 'Section 2: Working Hours & Overtime',
    clauseNumber: 'SOC-2.1',
    subClauseTitle: 'Working Hours & Rest Day Adherence',
    question:
      'Are normal working hours restricted to a maximum of 48 hours per week with at least one full 24-hour rest day in every 7-day cycle, and overtime strictly voluntary?',
    guidance:
      'Review electronic punch card / biometric attendance records for past 6 months including peak production periods.',
    maxMarks: 15,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 2,
  },
  {
    id: 'soc-q3',
    auditTypeId: 'type-social-compliance',
    clause: 'Section 3: Wages, Benefits & Compensation',
    clauseNumber: 'SOC-3.1',
    subClauseTitle: 'Statutory Minimum Wage & Overtime Premium',
    question:
      'Are all workers paid at or above government statutory minimum wages on or before the 7th working day of the month, with overtime compensated at double the basic hourly rate (200%)?',
    guidance:
      'Cross-examine payroll records, bank salary disbursement statements, and conduct private worker interviews.',
    maxMarks: 15,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 3,
  },
  {
    id: 'soc-q4',
    auditTypeId: 'type-social-compliance',
    clause: 'Section 4: Freedom of Association & Harassment Prevention',
    clauseNumber: 'SOC-4.1',
    subClauseTitle: 'Participation Committee & Grievance Redressal',
    question:
      'Is there an active, freely elected Workers Participation Committee (WPC) or trade union, an anti-harassment committee, and a confidential grievance drop-box mechanism without retaliation?',
    guidance:
      'Inspect WPC election minutes, monthly meeting agendas, grievance logbook, and check CCTV blind-spots near suggestion boxes.',
    maxMarks: 15,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 4,
  },
  {
    id: 'soc-q5',
    auditTypeId: 'type-social-compliance',
    clause: 'Section 5: Health, Sanitation & Welfare Facilities',
    clauseNumber: 'SOC-5.1',
    subClauseTitle: 'Dining Hall, Childcare & Restroom Hygiene',
    question:
      'Are clean dining facilities, child day-care center with qualified nurse, and gender-segregated clean toilets with running water and sanitary supplies available at adequate worker-to-toilet ratios?',
    guidance:
      'Inspect canteen food hygiene license, day-care center registry, and count working sanitary toilets against total workforce.',
    maxMarks: 15,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 5,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. 5S LEAN & HOUSEKEEPING QUESTIONS (type-5s-lean)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: '5s-q1',
    auditTypeId: 'type-5s-lean',
    clause: '1S: Sort (Seiri)',
    clauseNumber: '5S-1.1',
    subClauseTitle: 'Red Tag Strategy & Obsolete Item Removal',
    question:
      'Are unused fabric bolts, broken machine parts, surplus trims, and outdated paperwork red-tagged and relocated to the holding area within 24 hours to clear workstation space?',
    guidance:
      'Audit sewing floor corners and under cutting tables. Check red-tag holding area log and ensure zero unneeded clutter at line stations.',
    maxMarks: 10,
    severityOnFailure: 'MINOR',
    status: 'CONFORMITY',
    sortOrder: 1,
  },
  {
    id: '5s-q2',
    auditTypeId: 'type-5s-lean',
    clause: '2S: Set in Order (Seiton)',
    clauseNumber: '5S-2.1',
    subClauseTitle: 'Floor Demarcation & Shadow Boards',
    question:
      'Are walkways, WIP holding squares, waste bins, and tool racks clearly outlined with color-coded floor tape (yellow for aisles, red for scrap, green for finished goods) with shadow boards for tools?',
    guidance:
      'Observe scissors, screwdrivers, oil cans, and measuring tapes. Every tool must have a visual home with silhouette outlines.',
    maxMarks: 10,
    severityOnFailure: 'MINOR',
    status: 'CONFORMITY',
    sortOrder: 2,
  },
  {
    id: '5s-q3',
    auditTypeId: 'type-5s-lean',
    clause: '3S: Shine (Seiso)',
    clauseNumber: '5S-3.1',
    subClauseTitle: 'Daily Machine Cleaning & Lint Elimination',
    question:
      'Are sewing machine bobbin cases, needle plates, and motors cleaned of fabric lint and oil accumulation daily, with zero machine oil dripping onto floor or garment fabrics?',
    guidance:
      'Inspect underside of 10 sewing machines. Check machine cleanliness audit scorecards and daily operator cleaning checklists.',
    maxMarks: 10,
    severityOnFailure: 'MINOR',
    status: 'CONFORMITY',
    sortOrder: 3,
  },
  {
    id: '5s-q4',
    auditTypeId: 'type-5s-lean',
    clause: '4S: Standardize (Seiketsu)',
    clauseNumber: '5S-4.1',
    subClauseTitle: 'Visual Work Instructions & Color Coding',
    question:
      'Are visual 5S standard operating procedures, defect boundary samples, and cleaning assignment schedules visibly posted at each line and followed consistently across shifts?',
    guidance:
      'Check visual boards at line heads. Standard work sheets must show clear photo standards of "Clean vs Unacceptable".',
    maxMarks: 10,
    severityOnFailure: 'MINOR',
    status: 'CONFORMITY',
    sortOrder: 4,
  },
  {
    id: '5s-q5',
    auditTypeId: 'type-5s-lean',
    clause: '5S: Sustain (Shitsuke)',
    clauseNumber: '5S-5.1',
    subClauseTitle: 'Daily 5S Routine & Recognition Program',
    question:
      'Is the mandatory 5-minute end-of-shift 5S cleaning routine executed by all workers, with weekly 5S audits scored and celebrated on the factory communication dashboard?',
    guidance:
      'Observe line shutdown 5 minutes before bell rings. Review monthly 5S best line trophy and incentive disbursement records.',
    maxMarks: 10,
    severityOnFailure: 'MINOR',
    status: 'CONFORMITY',
    sortOrder: 5,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. SUB-SUPPLIER EVALUATION QUESTIONS (type-sub-supplier)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sub-q1',
    auditTypeId: 'type-sub-supplier',
    clause: 'Section 1: Inward Raw Material Quality',
    clauseNumber: 'SUB-1.1',
    subClauseTitle: '4-Point Fabric Inspection System',
    question:
      'Does the sub-supplier inspect at least 10% of incoming fabric rolls using the 4-Point System with calibrated inspection frames, recording defect penalty points per 100 square yards?',
    guidance:
      'Review fabric inspection reports for last 5 shipments. Verify defect acceptance limit (<20 points per 100 sq yards) is enforced.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 1,
  },
  {
    id: 'sub-q2',
    auditTypeId: 'type-sub-supplier',
    clause: 'Section 2: Metal Detection & Needle Policy',
    clauseNumber: 'SUB-2.1',
    subClauseTitle: 'Broken Needle Log & Metal Detection',
    question:
      'Does the vendor enforce a strict 9-point broken needle policy with locked replacement boxes, and pass 100% of garments through a conveyor metal detector calibrated with 1.0mm Fe test cards hourly?',
    guidance:
      'Inspect needle replacement log sheet with taped needle pieces. Observe metal detector 9-point calibration test in real time.',
    maxMarks: 15,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 2,
  },
  {
    id: 'sub-q3',
    auditTypeId: 'type-sub-supplier',
    clause: 'Section 3: Testing & Calibration',
    clauseNumber: 'SUB-3.1',
    subClauseTitle: 'In-House Physical & Color Fastness Testing',
    question:
      'Does the vendor laboratory conduct shade band grouping, color fastness to wash and crocking, dimensional stability (shrinkage/spirality), and pull-test verification with valid calibration records?',
    guidance:
      'Inspect lab equipment (AATCC crockmeter, light box, tumble washer). Verify third-party ISO 17025 calibration certificates.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 3,
  },
  {
    id: 'sub-q4',
    auditTypeId: 'type-sub-supplier',
    clause: 'Section 4: Lot Traceability & Quarantine',
    clauseNumber: 'SUB-4.1',
    subClauseTitle: 'Traceability Cards & Segregated Storage',
    question:
      'Are rejected goods stored in a locked quarantine cage, and are all finished carton lots identified with barcode stickers matching batch dye lot and yarn mill provenance?',
    guidance:
      'Inspect reject storage cage, check quarantine register, and scan carton labels to verify ERP traceability to raw materials.',
    maxMarks: 15,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 4,
  },
  {
    id: 'sub-q5',
    auditTypeId: 'type-sub-supplier',
    clause: 'Section 5: Chemical Management & Eco-Compliance',
    clauseNumber: 'SUB-5.1',
    subClauseTitle: 'ZDHC MRSL Level 3 & Chemical Secondary Containment',
    question:
      'Does the facility procure exclusively ZDHC MRSL Conformance Level 3 / OEKO-TEX certified formulation chemicals with valid SDS and 110% capacity secondary containment bunds?',
    guidance:
      'Review chemical inventory register against ZDHC Gateway. Verify secondary spill containment trays in chemical stores.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 5,
  },
  {
    id: 'sub-q6',
    auditTypeId: 'type-sub-supplier',
    clause: 'Section 6: In-Process Quality Controls',
    clauseNumber: 'SUB-6.1',
    subClauseTitle: 'Hourly In-Line Inspection Logs & Traffic Light System',
    question:
      'Are hourly quality logs maintained at each manufacturing stage (knitting, spreading, sewing, finishing) with red/green visual defect tags and immediate root cause containment?',
    guidance:
      'Examine current shift quality logs on the floor. Verify defect tagging and supervisory corrective action sign-offs.',
    maxMarks: 15,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 6,
  },
  {
    id: 'sub-q7',
    auditTypeId: 'type-sub-supplier',
    clause: 'Section 7: Snap Fastener & Accessory Attachment Strength',
    clauseNumber: 'SUB-7.1',
    subClauseTitle: 'Calibrated Pull-Tester 90N Holding Force Verification',
    question:
      'Are snap fasteners, shank buttons, rivets, and zipper pulls tested for attachment holding strength sustained at minimum 90N for 10 seconds with hourly digital pull-tester calibration logs?',
    guidance:
      'Witness an active pull test using calibrated SafQ pull gauge. Inspect daily attachment verification records.',
    maxMarks: 15,
    severityOnFailure: 'CRITICAL',
    status: 'CONFORMITY',
    sortOrder: 7,
  },
  {
    id: 'sub-q8',
    auditTypeId: 'type-sub-supplier',
    clause: 'Section 8: Pre-Shipment Inspection & Carton Release',
    clauseNumber: 'SUB-8.1',
    subClauseTitle: 'Final AQL 1.5/2.5 Audit & Certificate of Analysis (COA)',
    question:
      'Does the final quality assurance department conduct ANSI/ASQ Z1.4 Level II normal sampling audits prior to dispatch, issuing a stamped Certificate of Analysis with each outbound lot?',
    guidance:
      'Check final audit inspection reports and verify shipment release stamps on warehouse dispatch delivery chalan.',
    maxMarks: 10,
    severityOnFailure: 'MAJOR',
    status: 'CONFORMITY',
    sortOrder: 8,
  },
];

// ─── STORAGE UTILITIES ────────────────────────────────────────────────────────
export function getStoredAuditTypes(): AuditTypeDefinition[] {
  if (typeof window === 'undefined') return INITIAL_AUDIT_TYPES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_TYPES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AUDIT_TYPES, JSON.stringify(INITIAL_AUDIT_TYPES));
      return INITIAL_AUDIT_TYPES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load audit types from localStorage:', err);
  }
  return INITIAL_AUDIT_TYPES;
}

export function saveStoredAuditTypes(types: AuditTypeDefinition[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT_TYPES, JSON.stringify(types));
  } catch (err) {
    console.error('Failed to save audit types to localStorage:', err);
  }
}

export function getStoredAuditQuestions(): ManagedAuditQuestion[] {
  if (typeof window === 'undefined') return INITIAL_AUDIT_QUESTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_QUESTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AUDIT_QUESTIONS, JSON.stringify(INITIAL_AUDIT_QUESTIONS));
      return INITIAL_AUDIT_QUESTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure any newly added initial questions (e.g. sub-supplier questions) are merged
      const existingIds = new Set(parsed.map((q) => q.id));
      const missing = INITIAL_AUDIT_QUESTIONS.filter((q) => !existingIds.has(q.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(STORAGE_KEY_AUDIT_QUESTIONS, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load audit questions from localStorage:', err);
  }
  return INITIAL_AUDIT_QUESTIONS;
}

export function saveStoredAuditQuestions(questions: ManagedAuditQuestion[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT_QUESTIONS, JSON.stringify(questions));
  } catch (err) {
    console.error('Failed to save audit questions to localStorage:', err);
  }
}

// Convert ManagedAuditQuestion into AuditChecklistItem for running/conducting audits
export function convertManagedQuestionToChecklistItem(
  q: ManagedAuditQuestion,
  index?: number
): AuditChecklistItem {
  const maxScore = q.maxMarks || 1;
  return {
    id: q.id || `chk-${Date.now()}-${index ?? Math.random().toString(36).slice(2, 6)}`,
    clause: q.clause,
    clauseNumber: q.clauseNumber,
    subClauseTitle: q.subClauseTitle || `Requirement ${q.clauseNumber}`,
    question: q.question,
    guidance: q.guidance,
    status: q.status || 'CONFORMITY',
    maxScore,
    score: maxScore,
    remark: 'Verified compliant as per operational standard.',
    evidencePhotos: [],
  };
}

// Calculate score for managed questions in management preview or auditing
export function calculateAuditTypeScore(
  questions: ManagedAuditQuestion[],
  typeDef: AuditTypeDefinition
) {
  const totalWeight = questions.reduce((sum, q) => sum + (q.maxMarks || 1), 0);
  const targetScale = typeDef.totalAvailableMarks || 100;
  return {
    totalQuestions: questions.length,
    totalWeight,
    targetScale,
    passMarksThreshold: typeDef.passMarksThreshold || 80,
    criticalFailRule: typeDef.criticalNcFailsAudit !== false,
  };
}
