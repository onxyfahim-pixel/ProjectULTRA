import { ProcedureItem, ControlledDocument } from '@/lib/types/modules';
import { MOCK_CONTROLLED_DOCS } from '@/lib/db/modules-mock-data';

// Helper to fetch documents from Document Control Module
export function getAvailableControlledDocuments(): ControlledDocument[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('erp_controlled_documents_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed loading controlled documents from storage:', e);
    }
  }
  return MOCK_CONTROLLED_DOCS;
}

export const INITIAL_CONFORMING_PROCESS_CONTROL: ProcedureItem = {
  id: 'prc-qms-1163',
  procedureCode: 'PRC-QMS-1163',
  title: 'Standard Procedure for Conforming Process Control',
  companyName: 'Apex Quality Apparel Ltd.',
  department: 'QUALITY',
  documentType: 'Standard Operating Procedure (SOP)',
  documentReference: 'SOP/QMS/1163',
  issueNo: '05',
  revision: 'Rev 5.0',
  status: 'ACTIVE',
  approvalDate: '2024-03-06',
  nextReviewDate: '2025-03-07',
  effectiveDate: '2024-03-10',
  authorName: 'Management Representative (MR)',
  authorSignature: 'Lead QMS Auditor',
  approvedByName: 'Managing Director (MD)',
  approvedBySignature: 'Managing Director',
  controlledDocument: true,
  station: 'FULL_PROCESS_CHAIN',
  purposeAndScope:
    'To define the operational procedures and quality control gates across all garment manufacturing stages to guarantee conforming product flow and full traceability.',
  responsibilities: [
    {
      id: 'resp-1',
      role: 'Section Managers',
      responsibility:
        'Responsible for implementing and maintaining the conforming product control system, including maintaining records.',
      authorityLevel: 'Executive Operational Authority',
    },
    {
      id: 'resp-2',
      role: 'Line In-Charge, Supervisors & Quality Controllers',
      responsibility: 'Responsible for reviewing, inspecting, and dispositioning conforming product at every gate.',
      authorityLevel: 'Technical Line Quality Authority',
    },
    {
      id: 'resp-3',
      role: 'Line Operators & Floor Employees',
      responsibility:
        'Responsible for immediately identifying and segregating conforming and non-conforming product.',
      authorityLevel: 'Floor Segregation Authority',
    },
  ],
  departmentProcesses: [
    {
      id: 'dept-1',
      departmentName: 'Marketing, Merchandizing & Commercial',
      departmentCode: '3.1',
      inChargeRole: 'Senior Merchandiser',
      steps: [
        {
          id: 'step-3-1-1',
          stepNumber: '3.1.1',
          title: 'Tech Pack & Quotation Reception',
          description: 'Receive tech pack & quotation from buyer and initiate manufacturing review.',
          inspectionFrequency: '100% of New Orders',
          acceptanceCriteria: 'Complete technical pack with BOM and measurement specs.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'LOW',
        },
        {
          id: 'step-3-1-2',
          stepNumber: '3.1.2',
          title: 'Fabrics & Trims Consumption Calculation',
          description: 'Check consumptions of fabrics & trims using standard CAD markers.',
          inspectionFrequency: 'Per style / colorway',
          acceptanceCriteria: 'Variance under +/- 1.5% compared to commercial budget.',
          relatedFormCode: 'DOC-SOP-SEW-04',
          riskLevel: 'MEDIUM',
        },
        {
          id: 'step-3-1-3',
          stepNumber: '3.1.3',
          title: 'Costing & Development Submission',
          description: 'Prepare price & send development as per buyer requirement.',
          inspectionFrequency: 'Each costing submission',
          acceptanceCriteria: 'Signed costing breakdown agreed with factory GM.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'MEDIUM',
        },
        {
          id: 'step-3-1-4',
          stepNumber: '3.1.4',
          title: 'Sampling Program & Buyer Approvals',
          description: 'Send samples (Proto, Fit, PP, Sealer, TOP) to buyer for written approval.',
          inspectionFrequency: 'Every sample stage',
          acceptanceCriteria: 'Formal written buyer approval comments or sealed sample.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'HIGH',
        },
      ],
    },
    {
      id: 'dept-2',
      departmentName: 'Sample Development',
      departmentCode: '3.2',
      inChargeRole: 'Sample Room Manager',
      steps: [
        {
          id: 'step-3-2-1',
          stepNumber: '3.2.1',
          title: 'Technical Package & Approval Trim Card Verification',
          description:
            'Receive technical package, reference sample, approval trim card and make sample as per customer requirements.',
          inspectionFrequency: '100% of Sample Runs',
          acceptanceCriteria: 'Exact match with buyer approved spec sheet and fabric hand-feel.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'HIGH',
        },
        {
          id: 'step-3-2-2',
          stepNumber: '3.2.2',
          title: 'Sample Record Maintenance & Correction Tracking',
          description:
            'Must be checked all samples and maintained records. If any further correction is needed, communicate with sample Head.',
          inspectionFrequency: '100% of Sample Outputs',
          acceptanceCriteria: 'Complete QA audit report signed by sample QC and pattern master.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'MEDIUM',
        },
      ],
    },
    {
      id: 'dept-3',
      departmentName: 'Store & Raw Materials',
      departmentCode: '3.3',
      inChargeRole: 'Warehouse Manager',
      steps: [
        {
          id: 'step-3-3-1',
          stepNumber: '3.3.1',
          title: 'Inward Reference Verification',
          description: 'Receive technical package, reference sample, approval trim card before material offloading.',
          inspectionFrequency: 'Every incoming consignment',
          acceptanceCriteria: 'Current tech pack & signed trim card present at store dock.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'LOW',
        },
        {
          id: 'step-3-3-2',
          stepNumber: '3.3.2',
          title: 'Accessories & Trims Inspection Sampling',
          description:
            'Inspect 10% of total received trims (100% for barcodes, price tags, and care labels).',
          inspectionFrequency: '10% general / 100% barcodes & tags',
          acceptanceCriteria: 'Zero barcode scanning error; trims dimensions within spec.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'HIGH',
        },
        {
          id: 'step-3-3-3',
          stepNumber: '3.3.3',
          title: 'Fabric 4-Point System Inspection',
          description:
            'Fabrics inspection 10% by 4-point system. If ok then release to cutting, otherwise quarantine in non-conforming area.',
          inspectionFrequency: 'Minimum 10% of rolls per dye lot',
          acceptanceCriteria: 'Penalty points under 24 points per 100 sq. yards.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'CRITICAL',
        },
        {
          id: 'step-3-3-4',
          stepNumber: '3.3.4',
          title: 'Dimensional Stability & Shrinkage Test',
          description:
            'Shrinkage test done on 10% of cotton fabrics and 100% of spandex fabrics.',
          inspectionFrequency: '10% Cotton / 100% Spandex rolls',
          acceptanceCriteria: 'Shrinkage within length +/- 3%, width +/- 2%.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'CRITICAL',
        },
      ],
    },
    {
      id: 'dept-4',
      departmentName: 'Cutting Section',
      departmentCode: '3.4',
      inChargeRole: 'Cutting Floor Manager',
      steps: [
        {
          id: 'step-3-4-1',
          stepNumber: '3.4.1',
          title: 'CAD Marker & Pattern Verification',
          description:
            'Receive technical package and approval trim card, then make pattern and marker by CAD section.',
          inspectionFrequency: '100% of markers prior to plot',
          acceptanceCriteria: 'Efficiency > 86%, grainline parallel to selvedge.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'HIGH',
        },
        {
          id: 'step-3-4-2',
          stepNumber: '3.4.2',
          title: 'Fabric Relaxation & Spreading Quality Check',
          description:
            'Before bulk cutting, fabric must relax for prescribed period (minimum 24h for knits) and check spreading alignment.',
          inspectionFrequency: 'Every spread lay',
          acceptanceCriteria: 'Relaxation confirmed, ply alignment within +/- 2mm, tension-free.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'HIGH',
        },
        {
          id: 'step-3-4-3',
          stepNumber: '3.4.3',
          title: 'Cut Panel Verification & Replacement',
          description:
            'Verify cut panels. If any defect found, replace panel from same dye lot and maintain replacement log.',
          inspectionFrequency: 'Top, Middle, Bottom ply audit',
          acceptanceCriteria: 'Tolerance +/- 1mm, notch depth 1.5mm.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'CRITICAL',
        },
      ],
    },
    {
      id: 'dept-5',
      departmentName: 'Sewing Department',
      departmentCode: '3.5',
      inChargeRole: 'Sewing Production Manager',
      steps: [
        {
          id: 'step-3-5-1',
          stepNumber: '3.5.1',
          title: 'Production Setup & Pilot Swatch Verification',
          description: 'Receive technical package, reference sample & approval trim card for line setup.',
          inspectionFrequency: 'Line setup prior to pilot run',
          acceptanceCriteria: 'Mock-up assembly signed by QC In-charge and line supervisor.',
          relatedFormCode: 'DOC-SOP-SEW-04',
          riskLevel: 'MEDIUM',
        },
        {
          id: 'step-3-5-2',
          stepNumber: '3.5.2',
          title: 'Inline, Endline & Random AQL 2.5 Quality Audit',
          description:
            'Check all garments inline & endline, and audit randomly by AQL 2.5. Rectify defects or segregate non-conforming goods.',
          inspectionFrequency: 'Continuous 100% end-line + hourly AQL 2.5 audit',
          acceptanceCriteria: 'Critical defects = 0, Major defects within AQL 2.5.',
          relatedFormCode: 'DOC-SOP-SEW-04',
          riskLevel: 'CRITICAL',
        },
      ],
    },
    {
      id: 'dept-6',
      departmentName: 'Finishing & Final Packing',
      departmentCode: '3.6',
      inChargeRole: 'Finishing Manager',
      steps: [
        {
          id: 'step-3-6-1',
          stepNumber: '3.6.1',
          title: 'Button Pull Test & 100% Security Check',
          description: 'Perform button pull test and 100% button security check after attaching.',
          inspectionFrequency: '100% manual check + 5 garments per line/hour pull test',
          acceptanceCriteria: 'Withstand 90N / 9.2 kgf tension for minimum 10 seconds.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'CRITICAL',
        },
        {
          id: 'step-3-6-2',
          stepNumber: '3.6.2',
          title: '100% Inside & Top Side Garment Visual Inspection',
          description: 'Check 100% garments inside, top side, and overall get-up.',
          inspectionFrequency: '100% of finished garments',
          acceptanceCriteria: 'Zero loose threads > 3mm, zero stains or skipped stitches.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'HIGH',
        },
        {
          id: 'step-3-6-3',
          stepNumber: '3.6.3',
          title: '100% Ferrous Needle / Metal Detector Scan',
          description: '100% of finished garments must pass through the metal detector conveyor.',
          inspectionFrequency: '100% of all packed units (Calibrate 9-point sphere every 60 min)',
          acceptanceCriteria: 'Zero metal contamination detected (0.8mm Ferrous sphere detection gate).',
          relatedFormCode: 'DOC-SOP-SEW-04',
          riskLevel: 'CRITICAL',
        },
        {
          id: 'step-3-6-4',
          stepNumber: '3.6.4',
          title: 'Final Pre-Shipment Inspection & Release',
          description:
            'Random cartons taken to final inspection room and audited per buyer procedure prior to shipment signoff.',
          inspectionFrequency: '100% of export shipping orders',
          acceptanceCriteria: 'Final inspection certificate signed; container loading authorized.',
          relatedFormCode: 'DOC-QM-01',
          riskLevel: 'CRITICAL',
        },
      ],
    },
  ],
  relatedDocuments: [
    { id: 'rd-1', documentTitle: 'Factory Quality Assurance Manual (QAM)', documentCode: 'DOC-QM-01', category: 'Quality Assurance', isMandatory: true, frequency: 'Standing SOP', retentionPeriod: 'Permanent' },
    { id: 'rd-2', documentTitle: 'Needle Replacement & Broken Needle Search SOP', documentCode: 'DOC-SOP-SEW-04', category: 'Production & Sewing', isMandatory: true, frequency: 'Daily per line', retentionPeriod: '3 Years' },
    { id: 'rd-3', documentTitle: 'Raw Material 4-Point Inspection Record', documentCode: 'DOC-QC-1005', category: 'Store & Warehouse', isMandatory: true, frequency: '10% of rolls', retentionPeriod: '5 Years' },
    { id: 'rd-4', documentTitle: 'Sewing Inline & End-line Audit Sheet', documentCode: 'DOC-QC-1017', category: 'Sewing Department', isMandatory: true, frequency: 'Continuous hourly', retentionPeriod: '2 Years' },
    { id: 'rd-5', documentTitle: 'Button Attachment Pull Test Verification', documentCode: 'DOC-QC-1025', category: 'Finishing Department', isMandatory: true, frequency: 'Hourly pull test', retentionPeriod: '3 Years' },
    { id: 'rd-6', documentTitle: 'Pre-Shipment Final Inspection Signoff', documentCode: 'DOC-QC-1035', category: 'Quality Assurance', isMandatory: true, frequency: 'Per export PO', retentionPeriod: '5 Years' },
  ],
  distribution: [
    { id: 'dist-1', departmentOrFile: 'Central Quality Assurance File', copyType: 'CONTROLLED_PHYSICAL', recipientName: 'Document Controller', status: 'ACKNOWLEDGED' },
    { id: 'dist-2', departmentOrFile: 'QMS Intranet Portal', copyType: 'CONTROLLED_ELECTRONIC', recipientName: 'Head of Quality Assurance', status: 'ACKNOWLEDGED' },
    { id: 'dist-3', departmentOrFile: 'Production Floor Notice Station', copyType: 'CONTROLLED_PHYSICAL', recipientName: 'Floor Operations Manager', status: 'DISTRIBUTED' },
    { id: 'dist-4', departmentOrFile: 'Finishing & Inspection Station', copyType: 'CONTROLLED_PHYSICAL', recipientName: 'GPQ & Finishing In-Charge', status: 'DISTRIBUTED' },
  ],
  criticalCheckpoints: [
    '100% Ferrous Needle / Metal Detector scan prior to carton sealing',
    'Sewing random inline and end-line audit under AQL level 2.5',
    'Fabric shrinkage testing (10% cotton fabrics & 100% spandex fabrics)',
    'Button pull test withstands 90N / 9.2 kgf tension for 10 seconds',
    '10% fabric inspection by 4-point system (< 24 pts / 100 sq. yds)',
  ],
  ppeRequirement: 'Cut-resistant steel mesh gloves, safety goggles, hair nets, anti-static footwear',
  tags: ['QMS', 'Conforming Process', 'Manufacturing Gates', 'ISO 9001:2015'],
  notes: 'Subject to annual periodic review to maintain system effectiveness.',
  createdAt: '2024-03-06T09:00:00Z',
  updatedAt: '2026-09-25T11:00:00Z',
};

export const INITIAL_PROCEDURES_LIBRARY: ProcedureItem[] = [
  INITIAL_CONFORMING_PROCESS_CONTROL,
  {
    id: 'prc-cut-01',
    procedureCode: 'PRC-CUT-01',
    title: 'Fabric Spreading & Natural Relaxation Protocol',
    companyName: 'Apex Quality Apparel Ltd.',
    department: 'CUTTING',
    documentType: 'Work Instruction (WI)',
    documentReference: 'WI/CUT/012',
    issueNo: '03',
    revision: 'Rev 2.0',
    status: 'ACTIVE',
    approvalDate: '2024-01-15',
    nextReviewDate: '2025-01-15',
    authorName: 'CAD & Cutting Superintendent',
    approvedByName: 'Production Director',
    controlledDocument: true,
    station: 'SPREADING_CUTTING',
    purposeAndScope:
      'Standard protocol to eliminate residual tension in knit and woven rolls before cutting, ensuring dimensional stability and preventing post-wash garment twisting.',
    responsibilities: [
      { id: 'r1', role: 'Spreading Table In-Charge', responsibility: 'Record relaxation unroll time, ambient moisture and table tension.' },
      { id: 'r2', role: 'Cut Panel QC Inspector', responsibility: 'Perform bow, skew and shrinkage checks across top/bottom plies.' },
    ],
    departmentProcesses: [
      {
        id: 'dp-cut-1',
        departmentName: 'Spreading & Relaxation Dock',
        departmentCode: 'CUT-01',
        steps: [
          { id: 'cs1', stepNumber: '1.1', title: 'Roll De-packaging & Fluffing', description: 'De-roll knit fabrics onto relaxation racks with minimum 24 hours rest period.', inspectionFrequency: '100% rolls', relatedFormCode: 'DOC-QC-1005', riskLevel: 'HIGH' },
          { id: 'cs2', stepNumber: '1.2', title: 'Spreading Tensionless Feed', description: 'Ensure automatic spreader tension control is set to 0.0 draft tension.', inspectionFrequency: 'Every lay', relatedFormCode: 'DOC-QM-01', riskLevel: 'MEDIUM' },
        ],
      },
    ],
    relatedDocuments: [
      { id: 'rd-c1', documentTitle: 'Raw Material 4-Point Inspection Record', documentCode: 'DOC-QC-1005', category: 'Cutting', isMandatory: true },
    ],
    distribution: [
      { id: 'd-c1', departmentOrFile: 'Cutting Room Floor', copyType: 'CONTROLLED_PHYSICAL', status: 'ACKNOWLEDGED' },
    ],
    criticalCheckpoints: [
      'Relax knit fabrics for minimum 24 hours prior to cutting',
      'Check ply tension with zero drag across vacuum table',
      'Verify marker alignment against fabric selvedge straightness',
    ],
    ppeRequirement: 'Cut-resistant steel mesh gloves, safety goggles',
    tags: ['Cutting', 'Relaxation', 'Spreading'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'prc-sew-01',
    procedureCode: 'PRC-SEW-01',
    title: 'Sewing Machine Daily Lubrication & Tension Setting',
    companyName: 'Apex Quality Apparel Ltd.',
    department: 'SEWING',
    documentType: 'Work Instruction (WI)',
    documentReference: 'WI/SEW/045',
    issueNo: '04',
    revision: 'Rev 3.0',
    status: 'ACTIVE',
    approvalDate: '2024-05-10',
    nextReviewDate: '2025-05-10',
    authorName: 'Senior Maintenance Engineer',
    approvedByName: 'Head of Manufacturing',
    controlledDocument: true,
    station: 'SEWING_ASSEMBLY',
    purposeAndScope:
      'Standardized morning preventive maintenance and SPI tension audit for all lockstitch, overlock and interlock sewing workstations.',
    responsibilities: [
      { id: 'rs1', role: 'Machine Operators', responsibility: 'Daily cleaning of bobbin case, needle plate and oil level check before shift.' },
      { id: 'rs2', role: 'Line Maintenance Mechanics', responsibility: 'Tension calibration, looper clearance and needle bar height verification.' },
    ],
    departmentProcesses: [
      {
        id: 'dp-sew-1',
        departmentName: 'Sewing Assembly Lines',
        departmentCode: 'SEW-01',
        steps: [
          { id: 'ss1', stepNumber: '1.1', title: 'Oil Level & Lint Clear', description: 'Inspect sight glass oil reservoir, clear lint under feed dog with air blower.', inspectionFrequency: 'Every morning shift', relatedFormCode: 'DOC-SOP-SEW-04', riskLevel: 'MEDIUM' },
          { id: 'ss2', stepNumber: '1.2', title: 'SPI & Tension Swatch', description: 'Run test swatch to calibrate 10-12 Stitches Per Inch under calibrated tension gauge.', inspectionFrequency: 'Twice daily', relatedFormCode: 'DOC-QC-1017', riskLevel: 'HIGH' },
        ],
      },
    ],
    relatedDocuments: [
      { id: 'rd-s1', documentTitle: 'Needle Replacement & Broken Needle Search SOP', documentCode: 'DOC-SOP-SEW-04', category: 'Sewing', isMandatory: true },
      { id: 'rd-s2', documentTitle: 'Sewing Inline & End-line Audit Sheet', documentCode: 'DOC-QC-1017', category: 'Sewing', isMandatory: true },
    ],
    distribution: [
      { id: 'd-s1', departmentOrFile: 'Sewing Maintenance Station', copyType: 'CONTROLLED_PHYSICAL', status: 'ACKNOWLEDGED' },
    ],
    criticalCheckpoints: [
      'Inspect oil window level before morning power-on',
      'Sew test swatch to verify 10 to 12 SPI (Stitches Per Inch)',
      'Check needle point with fingernail test for burrs',
    ],
    ppeRequirement: 'Hair net, ergonomic wrist support, needle shield guard',
    tags: ['Sewing', 'Maintenance', 'SPI Control'],
    createdAt: '2024-05-10T08:00:00Z',
    updatedAt: '2026-09-22T14:30:00Z',
  },
];
