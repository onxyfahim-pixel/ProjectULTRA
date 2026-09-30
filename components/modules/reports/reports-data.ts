export type ReportCategory =
  | 'QUALITY_SUMMARY'
  | 'DEFECT_ANALYTICS'
  | 'BUYER_SCORECARD'
  | 'MATERIAL_INVENTORY'
  | 'AUDIT_COMPLIANCE'
  | 'SUPPLIER_RATING';

export type ReportStatus = 'PUBLISHED' | 'APPROVED' | 'UNDER_REVIEW' | 'DRAFT';
export type ReportFormat = 'PDF' | 'EXCEL' | 'INTERACTIVE';

export interface ReportKpi {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface ReportMetricRow {
  metric: string;
  target: string;
  actual: string;
  variance: string;
  status: 'PASS' | 'WARN' | 'FAIL';
}

export interface DefectItem {
  defect: string;
  count: number;
  percentage: number;
  cumulative: number;
}

export interface ReportRecord {
  id: string;
  title: string;
  category: ReportCategory;
  period: string;
  department: string;
  generatedDate: string;
  generatedBy: string;
  status: ReportStatus;
  format: ReportFormat;
  fileSize: string;
  summary: string;
  highlights: string[];
  kpis: ReportKpi[];
  metricsTable: ReportMetricRow[];
  defectBreakdown?: DefectItem[];
  recommendations: string[];
  signOff: {
    preparedBy: string;
    reviewedBy: string;
    approvedBy: string;
    date: string;
  };
}

export const REPORT_CATEGORY_CONFIG: Record<
  ReportCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  QUALITY_SUMMARY: {
    label: 'Quality Summary',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  DEFECT_ANALYTICS: {
    label: 'Defect Analytics',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  BUYER_SCORECARD: {
    label: 'Buyer Scorecard',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  MATERIAL_INVENTORY: {
    label: 'Material & Inventory',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  AUDIT_COMPLIANCE: {
    label: 'Audit & Compliance',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  SUPPLIER_RATING: {
    label: 'Supplier Rating',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
};

export const INITIAL_REPORTS: ReportRecord[] = [
  {
    id: 'RPT-2026-001',
    title: 'Executive Monthly Quality & QMS Governance Audit',
    category: 'QUALITY_SUMMARY',
    period: 'September 2026',
    department: 'Quality Assurance & Technical',
    generatedDate: '2026-09-30',
    generatedBy: 'Fahim Rahman (Head of Quality)',
    status: 'PUBLISHED',
    format: 'INTERACTIVE',
    fileSize: '4.8 MB',
    summary:
      'Consolidated monthly performance across all 8 factory sewing lines, cutting room, and finishing departments. Overall factory DHU reached 1.82 against a target of < 2.00, demonstrating a 0.24 DHU improvement MoM with zero major critical rejections during final buyer inspections.',
    highlights: [
      'Factory First Time Right (FTR) improved to 94.2% (+2.1% from August).',
      'Final buyer audit pass rate recorded 98.4% on first submission across 142 lots.',
      'Cutting room end-loss reduced from 2.1% to 1.6% utilizing automated CAD nesting.',
      'Zero critical metal contamination or broken needle incidents recorded factory-wide.',
    ],
    kpis: [
      { label: 'Overall Pass Rate', value: '96.8%', change: '+1.4%', isPositive: true },
      { label: 'Factory DHU', value: '1.82', change: '-0.24', isPositive: true },
      { label: 'First Time Right', value: '94.2%', change: '+2.1%', isPositive: true },
      { label: 'Audit Readiness', value: '98.4%', change: '+0.8%', isPositive: true },
    ],
    metricsTable: [
      { metric: 'Fabric 4-Point Acceptance', target: '> 95.0%', actual: '97.2%', variance: '+2.2%', status: 'PASS' },
      { metric: 'Cutting Accuracy Tolerance (±1mm)', target: '> 98.0%', actual: '98.6%', variance: '+0.6%', status: 'PASS' },
      { metric: 'Sewing Inline DHU', target: '< 2.50', actual: '2.15', variance: '-0.35', status: 'PASS' },
      { metric: 'End-of-Line Check Pass Rate', target: '> 94.0%', actual: '95.1%', variance: '+1.1%', status: 'PASS' },
      { metric: 'Finishing & Pressing Quality', target: '> 98.0%', actual: '98.8%', variance: '+0.8%', status: 'PASS' },
      { metric: 'Needle Detector 100% Scan Pass', target: '100.0%', actual: '100.0%', variance: '0.0%', status: 'PASS' },
      { metric: 'Customer Complaint Resolution SLA', target: '< 5 Days', actual: '4.2 Days', variance: '-0.8 Days', status: 'PASS' },
    ],
    defectBreakdown: [
      { defect: 'Broken / Skipped Stitches', count: 184, percentage: 31.2, cumulative: 31.2 },
      { defect: 'Shade / Color Variation', count: 122, percentage: 20.7, cumulative: 51.9 },
      { defect: 'Puckering at Armhole/Collar', count: 96, percentage: 16.3, cumulative: 68.2 },
      { defect: 'Oil / Soil Stains', count: 74, percentage: 12.5, cumulative: 80.7 },
      { defect: 'Measurement Out-of-Spec', count: 58, percentage: 9.8, cumulative: 90.5 },
      { defect: 'Open / Wavy Seams', count: 36, percentage: 6.1, cumulative: 96.6 },
      { defect: 'Button / Trims Misalignment', count: 20, percentage: 3.4, cumulative: 100.0 },
    ],
    recommendations: [
      'Maintain weekly machine tension calibration checks on Lines 3 and 7 to sustain low broken stitch occurrences.',
      'Mandate strict roll-to-roll shade lot segregation during spreading in cutting bay #2.',
      'Conduct 15-minute refresher training for sewing operators on top-stitch puckering mitigation.',
    ],
    signOff: {
      preparedBy: 'Sadia Islam (Lead QA Analyst)',
      reviewedBy: 'Tariqul Alam (Technical QA Manager)',
      approvedBy: 'Fahim Rahman (VP of Quality & Compliance)',
      date: '2026-09-30',
    },
  },
  {
    id: 'RPT-2026-002',
    title: 'Comprehensive Defect Pareto & Line Root-Cause Report',
    category: 'DEFECT_ANALYTICS',
    period: 'Q3 2026',
    department: 'Sewing Operations & Quality Control',
    generatedDate: '2026-09-28',
    generatedBy: 'Rashid Khan (Quality Control Lead)',
    status: 'APPROVED',
    format: 'PDF',
    fileSize: '6.2 MB',
    summary:
      'Quarterly statistical analysis of 3,840 recorded defects across 240,000 garment units produced in Q3. The 80/20 Pareto principle reveals top 3 defects (broken stitch, shade variation, and seam puckering) account for 68.2% of all rework.',
    highlights: [
      'Top 3 defect categories represent 68.2% of overall production rework hours.',
      'Line 4 achieved the lowest DHU of the quarter at 1.34 following motor upgrades.',
      'Root cause 5-Why analysis conducted on needle heat friction; Teflon-coated needles deployed.',
      'Total rework cost reduced by $18,400 compared to Q2 benchmark.',
    ],
    kpis: [
      { label: 'Total Defects Analyzed', value: '3,840', change: '-14.2%', isPositive: true },
      { label: 'Average Sewing DHU', value: '1.94', change: '-0.31', isPositive: true },
      { label: 'Rework Recovery %', value: '98.6%', change: '+1.2%', isPositive: true },
      { label: 'Rework Cost Impact', value: '$12,450', change: '-28%', isPositive: true },
    ],
    metricsTable: [
      { metric: 'Line 1 (Polo Shirts)', target: '< 2.20 DHU', actual: '1.88 DHU', variance: '-0.32', status: 'PASS' },
      { metric: 'Line 2 (Hoodies & Fleece)', target: '< 2.50 DHU', actual: '2.42 DHU', variance: '-0.08', status: 'PASS' },
      { metric: 'Line 3 (Basic T-Shirts)', target: '< 1.80 DHU', actual: '1.55 DHU', variance: '-0.25', status: 'PASS' },
      { metric: 'Line 4 (Activewear / Lycra)', target: '< 2.00 DHU', actual: '1.34 DHU', variance: '-0.66', status: 'PASS' },
      { metric: 'Line 5 (Woven Bottoms)', target: '< 2.40 DHU', actual: '2.48 DHU', variance: '+0.08', status: 'WARN' },
      { metric: 'Line 6 (Denim Washed)', target: '< 2.80 DHU', actual: '2.65 DHU', variance: '-0.15', status: 'PASS' },
    ],
    defectBreakdown: [
      { defect: 'Broken / Skipped Stitches', count: 1198, percentage: 31.2, cumulative: 31.2 },
      { defect: 'Color Shade Discrepancy', count: 795, percentage: 20.7, cumulative: 51.9 },
      { defect: 'Seam Puckering', count: 626, percentage: 16.3, cumulative: 68.2 },
      { defect: 'Oil & Machine Grease', count: 480, percentage: 12.5, cumulative: 80.7 },
      { defect: 'Measurement Variance', count: 376, percentage: 9.8, cumulative: 90.5 },
      { defect: 'Open Seam / Needle Cut', count: 234, percentage: 6.1, cumulative: 96.6 },
      { defect: 'Accessories / Snap Defects', count: 131, percentage: 3.4, cumulative: 100.0 },
    ],
    recommendations: [
      'Line 5 requires mechanic overhaul on automatic pocket welting machines.',
      'Standardize thread tension gauge calibration every Monday morning across all lines.',
      'Install oil leak catch trays with daily inspection checklist on older Brother machines.',
    ],
    signOff: {
      preparedBy: 'Rashid Khan (QC Lead)',
      reviewedBy: 'Tariqul Alam (Technical QA Manager)',
      approvedBy: 'Fahim Rahman (VP of Quality)',
      date: '2026-09-28',
    },
  },
  {
    id: 'RPT-2026-003',
    title: 'Tier-1 Buyer Shipment Quality & AQL Audit Scorecard',
    category: 'BUYER_SCORECARD',
    period: 'YTD 2026',
    department: 'Merchandising & Compliance',
    generatedDate: '2026-09-25',
    generatedBy: 'Anisul Hoque (Customer Compliance Specialist)',
    status: 'PUBLISHED',
    format: 'EXCEL',
    fileSize: '3.4 MB',
    summary:
      'Consolidated scorecard of 6 global retail buyers (H&M, Zara / Inditex, PVH, Target, Uniqlo, Next). Over 1.25M garments delivered YTD with an aggregate buyer final inspection pass rate of 98.7% and zero port-of-entry rejections.',
    highlights: [
      'Uniqlo awarded gold standard vendor rating with 99.4% first-time inspection acceptance.',
      'H&M organic cotton program passed all GOTS traceability and chemical residue testing.',
      'PVH claim rate dropped to 0.04% of total order billing value.',
      'On-time in-full (OTIF) delivery performance maintained at 97.8% across 64 purchase orders.',
    ],
    kpis: [
      { label: 'Audited Buyer Lots', value: '284 Lots', change: '+32 Lots', isPositive: true },
      { label: 'AQL 2.5 Pass Rate', value: '98.7%', change: '+1.1%', isPositive: true },
      { label: 'Overall OTIF %', value: '97.8%', change: '+2.4%', isPositive: true },
      { label: 'Customer Claim Ratio', value: '0.06%', change: '-0.04%', isPositive: true },
    ],
    metricsTable: [
      { metric: 'Uniqlo (Japan & US)', target: '> 99.0%', actual: '99.4%', variance: '+0.4%', status: 'PASS' },
      { metric: 'Zara / Inditex (EU)', target: '> 98.0%', actual: '98.9%', variance: '+0.9%', status: 'PASS' },
      { metric: 'H&M (Global)', target: '> 98.0%', actual: '98.5%', variance: '+0.5%', status: 'PASS' },
      { metric: 'PVH (Tommy/Calvin Klein)', target: '> 97.5%', actual: '98.1%', variance: '+0.6%', status: 'PASS' },
      { metric: 'Target (USA Stores)', target: '> 97.0%', actual: '97.8%', variance: '+0.8%', status: 'PASS' },
      { metric: 'Next Retail (UK)', target: '> 97.5%', actual: '97.2%', variance: '-0.3%', status: 'WARN' },
    ],
    recommendations: [
      'Focus QA attention on Next retail specifications regarding carton drop-test standards.',
      'Leverage Uniqlo best-practice needle detection log sheet for PVH shipments.',
      'Automate shipping label barcode verification to eliminate occasional scan delays at freight hub.',
    ],
    signOff: {
      preparedBy: 'Anisul Hoque (Compliance Specialist)',
      reviewedBy: 'Farzana Yeasmin (Head of Merchandising)',
      approvedBy: 'Fahim Rahman (VP of Quality)',
      date: '2026-09-25',
    },
  },
  {
    id: 'RPT-2026-004',
    title: 'Raw Material Fabric Inwarding & 4-Point System Assessment',
    category: 'MATERIAL_INVENTORY',
    period: 'September 2026',
    department: 'Fabric Warehouse & Incoming QC',
    generatedDate: '2026-09-22',
    generatedBy: 'Mahmudul Hasan (Warehouse QA Manager)',
    status: 'PUBLISHED',
    format: 'INTERACTIVE',
    fileSize: '5.1 MB',
    summary:
      'ASTM D5430 4-Point inspection results for 485,000 linear meters of knit and woven fabrics received from 12 mills. Average penalty points registered at 14.8 points per 100 sq yards, well below buyer tolerance limits of 28 points.',
    highlights: [
      '96.4% of inspected rolls cleared on first inspection under ASTM D5430 standards.',
      'Only 3 out of 118 dye lots quarantined for shade band delta E > 1.0 against master swatch.',
      'Inventory turns improved to 8.4x with automated barcode bin tracking in warehouse bay A-D.',
      'Zero mold or moisture content issues recorded after monsoon warehouse dehumidification upgrade.',
    ],
    kpis: [
      { label: 'Inspected Fabric', value: '485,000 m', change: '+45,000 m', isPositive: true },
      { label: 'Avg 4-Pt Penalty', value: '14.8 pts', change: '-2.3 pts', isPositive: true },
      { label: 'Quarantine Rate', value: '2.5%', change: '-0.9%', isPositive: true },
      { label: 'Shade Match Delta E', value: '< 0.75', change: 'Optimal', isPositive: true },
    ],
    metricsTable: [
      { metric: 'Knitted Single Jersey 100% Cotton', target: '< 20 pts', actual: '12.4 pts', variance: '-7.6 pts', status: 'PASS' },
      { metric: 'Cotton Spandex Rib 1x1', target: '< 24 pts', actual: '16.8 pts', variance: '-7.2 pts', status: 'PASS' },
      { metric: 'French Terry 280 GSM', target: '< 22 pts', actual: '15.1 pts', variance: '-6.9 pts', status: 'PASS' },
      { metric: 'Denim Twill 12.5 oz', target: '< 25 pts', actual: '19.4 pts', variance: '-5.6 pts', status: 'PASS' },
      { metric: 'Polyester Interlock Active', target: '< 18 pts', actual: '11.2 pts', variance: '-6.8 pts', status: 'PASS' },
      { metric: 'Viscose Rayon Printed Woven', target: '< 22 pts', actual: '21.5 pts', variance: '-0.5 pts', status: 'PASS' },
    ],
    recommendations: [
      'Issue warning notice to Mill #4 regarding occasional yarn slub defects in French Terry deliveries.',
      'Upgrade fabric relaxing tables in cutting bay to ensure minimum 24-hour relaxation for lycra blends.',
    ],
    signOff: {
      preparedBy: 'Mahmudul Hasan (Warehouse QA)',
      reviewedBy: 'Tariqul Alam (Technical QA Manager)',
      approvedBy: 'Fahim Rahman (VP of Quality)',
      date: '2026-09-22',
    },
  },
  {
    id: 'RPT-2026-005',
    title: 'ISO 9001:2015 & Technical Quality Audit Readiness Scorecard',
    category: 'AUDIT_COMPLIANCE',
    period: 'Q3 2026',
    department: 'Compliance & Governance',
    generatedDate: '2026-09-18',
    generatedBy: 'Sabrina Akter (Internal Audit Officer)',
    status: 'APPROVED',
    format: 'PDF',
    fileSize: '7.4 MB',
    summary:
      'Internal comprehensive audit evaluation evaluating 10 key ISO 9001:2015 clauses, risk mitigation FMEA protocols, calibration logs, and corrective action effectiveness. Overall factory readiness score achieved 98.4%.',
    highlights: [
      'Zero Major non-conformances (NCs) identified during 3-day internal mock audit.',
      'Calibration compliance for scales, pull testers, and spectrophotometers maintained at 100%.',
      'All 24 SOP documents updated to revision 3.2 with digital document control signatures.',
      'Training matrix coverage reached 96.8% for certified line inspectors and mechanics.',
    ],
    kpis: [
      { label: 'Overall ISO Score', value: '98.4%', change: '+1.2%', isPositive: true },
      { label: 'Major NCs', value: '0', change: '0', isPositive: true },
      { label: 'Minor Observations', value: '4', change: '-3', isPositive: true },
      { label: 'Calibration Up-to-Date', value: '100%', change: '0.0%', isPositive: true },
    ],
    metricsTable: [
      { metric: 'Clause 4: Context of the Organization', target: '> 95.0%', actual: '100.0%', variance: '+5.0%', status: 'PASS' },
      { metric: 'Clause 5: Leadership & Policy', target: '> 95.0%', actual: '98.0%', variance: '+3.0%', status: 'PASS' },
      { metric: 'Clause 6: Planning & Risk (FMEA)', target: '> 95.0%', actual: '97.5%', variance: '+2.5%', status: 'PASS' },
      { metric: 'Clause 7: Support & Calibration', target: '> 98.0%', actual: '99.2%', variance: '+1.2%', status: 'PASS' },
      { metric: 'Clause 8: Operation & In-Line QC', target: '> 96.0%', actual: '98.6%', variance: '+2.6%', status: 'PASS' },
      { metric: 'Clause 9: Performance Evaluation', target: '> 95.0%', actual: '97.0%', variance: '+2.0%', status: 'PASS' },
      { metric: 'Clause 10: Improvement & CAPA', target: '> 95.0%', actual: '98.5%', variance: '+3.5%', status: 'PASS' },
    ],
    recommendations: [
      'Close out 4 minor housekeeping observations in chemical storage area by October 10.',
      'Schedule external certification surveillance audit with SGS for late November.',
    ],
    signOff: {
      preparedBy: 'Sabrina Akter (Audit Officer)',
      reviewedBy: 'Tariqul Alam (Technical QA Manager)',
      approvedBy: 'Fahim Rahman (VP of Quality)',
      date: '2026-09-18',
    },
  },
  {
    id: 'RPT-2026-006',
    title: 'Tier-2 Sub-Supplier & Mill Quality Benchmark Evaluation',
    category: 'SUPPLIER_RATING',
    period: 'Q3 2026',
    department: 'Supply Chain & Sourcing QC',
    generatedDate: '2026-09-15',
    generatedBy: 'Kamrul Islam (Supply Chain QA Lead)',
    status: 'PUBLISHED',
    format: 'EXCEL',
    fileSize: '4.2 MB',
    summary:
      'Performance audit of 18 active sub-suppliers supplying yarns, woven fabrics, zippers, sewing threads, polybags, and corrugated shipping cartons. 15 suppliers retained Grade A status, 3 suppliers placed on Grade B improvement plans.',
    highlights: [
      'Top supplier Apex Textile achieved 99.2% quality score and zero shade rejections.',
      'YKK Bangladesh maintained 100% pull-strength certification compliance across 50,000 zippers.',
      'Average supplier on-time delivery reached 96.4% across 320 purchase order dispatches.',
      'Carton burst strength (BST) test pass rate maintained at 98.6% with certified corrugation vendor.',
    ],
    kpis: [
      { label: 'Active Suppliers', value: '18 Mills', change: '+2', isPositive: true },
      { label: 'Grade A Vendors', value: '15 (83.3%)', change: '+2', isPositive: true },
      { label: 'Avg Quality Score', value: '95.6%', change: '+1.8%', isPositive: true },
      { label: 'Rejection Cost %', value: '0.42%', change: '-0.18%', isPositive: true },
    ],
    metricsTable: [
      { metric: 'Apex Textile Mill (Fabric)', target: '> 95.0%', actual: '99.2%', variance: '+4.2%', status: 'PASS' },
      { metric: 'Square Fashion Ltd (Yarn/Knit)', target: '> 95.0%', actual: '98.4%', variance: '+3.4%', status: 'PASS' },
      { metric: 'YKK Fastening Systems (Trims)', target: '> 98.0%', actual: '99.8%', variance: '+1.8%', status: 'PASS' },
      { metric: 'Coats Bangladesh (Thread)', target: '> 96.0%', actual: '97.9%', variance: '+1.9%', status: 'PASS' },
      { metric: 'Bengal Corrugation (Carton)', target: '> 95.0%', actual: '94.2%', variance: '-0.8%', status: 'WARN' },
      { metric: 'Green Packaging (Polybags)', target: '> 95.0%', actual: '95.8%', variance: '+0.8%', status: 'PASS' },
    ],
    recommendations: [
      'Request Bengal Corrugation to submit edge-crush test (ECT) re-calibration cert within 14 days.',
      'Schedule annual on-site environmental chemical audit at yarn dyeing partner facilities.',
    ],
    signOff: {
      preparedBy: 'Kamrul Islam (Supply Chain QA)',
      reviewedBy: 'Farzana Yeasmin (Head of Sourcing)',
      approvedBy: 'Fahim Rahman (VP of Quality)',
      date: '2026-09-15',
    },
  },
  {
    id: 'RPT-2026-007',
    title: 'Customer Claims & Corrective Action (CAPA) Impact Analysis',
    category: 'AUDIT_COMPLIANCE',
    period: 'Q3 2026',
    department: 'Customer Relations & Technical QA',
    generatedDate: '2026-09-10',
    generatedBy: 'Sadia Islam (Lead QA Analyst)',
    status: 'UNDER_REVIEW',
    format: 'INTERACTIVE',
    fileSize: '3.9 MB',
    summary:
      'Detailed root cause and financial analysis of buyer claims submitted during Q3. Overall claim incidence rate dropped to 0.05% of shipments, with average CAPA resolution cycle shortened from 8.5 to 4.2 business days.',
    highlights: [
      'Total claims reduced from 7 incidents in Q2 to only 2 minor incidents in Q3.',
      'Average CAPA closure cycle improved by 50.6% via automated floor ticketing.',
      'Zero financial chargebacks incurred; all minor claims resolved via replacement lots.',
      '8D root-cause corrective methodology successfully implemented for packaging barcode error.',
    ],
    kpis: [
      { label: 'Total Claims Q3', value: '2', change: '-71.4%', isPositive: true },
      { label: 'Claim Value USD', value: '$1,850', change: '-82.0%', isPositive: true },
      { label: 'Avg CAPA SLA', value: '4.2 Days', change: '-4.3 Days', isPositive: true },
      { label: '100% Closed CAPAs', value: '94.5%', change: '+6.5%', isPositive: true },
    ],
    metricsTable: [
      { metric: 'Claim #CLM-2026-014 (H&M Barcode)', target: '< 5 Days', actual: '3 Days', variance: '-2 Days', status: 'PASS' },
      { metric: 'Claim #CLM-2026-015 (Zara Trim Shade)', target: '< 5 Days', actual: '4 Days', variance: '-1 Day', status: 'PASS' },
      { metric: 'CAPA Preventive Verification Rate', target: '> 90.0%', actual: '96.2%', variance: '+6.2%', status: 'PASS' },
      { metric: 'Supplier Chargeback Recovery', target: '> 80.0%', actual: '100.0%', variance: '+20.0%', status: 'PASS' },
    ],
    recommendations: [
      'Incorporate barcode scanner verification at final polybag heat-sealing station.',
      'Maintain quarterly claim trend reviews with retail buyer account managers.',
    ],
    signOff: {
      preparedBy: 'Sadia Islam (Lead QA Analyst)',
      reviewedBy: 'Tariqul Alam (Technical QA Manager)',
      approvedBy: 'Fahim Rahman (VP of Quality)',
      date: '2026-09-10',
    },
  },
  {
    id: 'RPT-2026-008',
    title: 'Laboratory Testing & Chemical Compliance Digest',
    category: 'QUALITY_SUMMARY',
    period: 'September 2026',
    department: 'Central Physical & Chemical Laboratory',
    generatedDate: '2026-09-05',
    generatedBy: 'Dr. Shahabuddin (Chief Lab Chemist)',
    status: 'PUBLISHED',
    format: 'PDF',
    fileSize: '5.6 MB',
    summary:
      'Monthly test summary of 412 physical, wash-fastness, tensile strength, and OEKO-TEX Standard 100 chemical tests conducted in the in-house accredited laboratory. 99.0% tests cleared on primary evaluation.',
    highlights: [
      'Color fastness to washing (ISO 105-C06) maintained at Grade 4-5 across all dyed fabrics.',
      'Dimensional stability (shrinkage) kept within ±2.5% lengthwise and widthwise.',
      'Zero detection of restricted azo dyes, formaldehyde, or heavy metals.',
      'Tensile and burst strength tested on 85 denim and twill styles without failures.',
    ],
    kpis: [
      { label: 'Tests Conducted', value: '412', change: '+28', isPositive: true },
      { label: 'Pass Rate %', value: '99.0%', change: '+0.5%', isPositive: true },
      { label: 'Fastness Avg Grade', value: '4.5 / 5', change: 'Grade 5', isPositive: true },
      { label: 'OEKO-TEX Certified', value: '100%', change: 'Zero Fail', isPositive: true },
    ],
    metricsTable: [
      { metric: 'Color Fastness to Washing (ISO 105-C06)', target: '> 4.0 Grade', actual: '4.5 Grade', variance: '+0.5', status: 'PASS' },
      { metric: 'Fastness to Rubbing/Crocking (ISO 105-X12)', target: '> 3.5 Grade', actual: '4.0 Grade', variance: '+0.5', status: 'PASS' },
      { metric: 'Dimensional Stability / Shrinkage (ISO 6330)', target: '< ±3.0%', actual: '±1.8%', variance: '-1.2%', status: 'PASS' },
      { metric: 'Fabric Bursting Strength (ASTM D3786)', target: '> 250 kPa', actual: '345 kPa', variance: '+95 kPa', status: 'PASS' },
      { metric: 'Formaldehyde Content (ISO 14184-1)', target: '< 20 ppm', actual: '< 5 ppm', variance: '-15 ppm', status: 'PASS' },
    ],
    recommendations: [
      'Standardize tumble drying cycle calibrations to maintain test uniformity.',
      'Participate in inter-laboratory round-robin testing with SGS Bangladesh.',
    ],
    signOff: {
      preparedBy: 'Dr. Shahabuddin (Chief Chemist)',
      reviewedBy: 'Tariqul Alam (Technical QA Manager)',
      approvedBy: 'Fahim Rahman (VP of Quality)',
      date: '2026-09-05',
    },
  },
];

export const MONTHLY_QUALITY_TRENDS = [
  { month: 'Jan', dhu: 2.38, passRate: 94.8, inspected: 185000, defects: 4403 },
  { month: 'Feb', dhu: 2.25, passRate: 95.2, inspected: 192000, defects: 4320 },
  { month: 'Mar', dhu: 2.18, passRate: 95.5, inspected: 210000, defects: 4578 },
  { month: 'Apr', dhu: 2.12, passRate: 95.8, inspected: 205000, defects: 4346 },
  { month: 'May', dhu: 2.05, passRate: 96.1, inspected: 228000, defects: 4674 },
  { month: 'Jun', dhu: 1.98, passRate: 96.4, inspected: 235000, defects: 4653 },
  { month: 'Jul', dhu: 1.92, passRate: 96.6, inspected: 242000, defects: 4646 },
  { month: 'Aug', dhu: 1.88, passRate: 96.7, inspected: 250000, defects: 4700 },
  { month: 'Sep', dhu: 1.82, passRate: 96.8, inspected: 264000, defects: 4804 },
];

export const BUYER_BENCHMARK_LIST = [
  { buyer: 'Uniqlo (Fast Retailing)', orders: 38, pcsShipped: 420000, passRate: 99.4, dhu: 1.25, claims: 0, status: 'GRADE_A' },
  { buyer: 'Zara / Inditex', orders: 46, pcsShipped: 380000, passRate: 98.9, dhu: 1.48, claims: 1, status: 'GRADE_A' },
  { buyer: 'H&M Hennes & Mauritz', orders: 52, pcsShipped: 510000, passRate: 98.5, dhu: 1.62, claims: 1, status: 'GRADE_A' },
  { buyer: 'PVH (Tommy / Calvin Klein)', orders: 28, pcsShipped: 240000, passRate: 98.1, dhu: 1.74, claims: 0, status: 'GRADE_A' },
  { buyer: 'Target Corporation', orders: 34, pcsShipped: 310000, passRate: 97.8, dhu: 1.88, claims: 0, status: 'GRADE_B' },
  { buyer: 'Next Retail UK', orders: 22, pcsShipped: 185000, passRate: 97.2, dhu: 1.95, claims: 0, status: 'GRADE_B' },
];

export const LINE_LEADERBOARD_LIST = [
  { line: 'Line 04 (Activewear/Lycra)', supervisor: 'Abdur Rahim', output: 34200, dhu: 1.34, ftr: 96.8, status: 'EXCELLENT' },
  { line: 'Line 03 (Basic T-Shirts)', supervisor: 'Nasir Uddin', output: 42500, dhu: 1.55, ftr: 95.9, status: 'EXCELLENT' },
  { line: 'Line 01 (Polo Shirts)', supervisor: 'Mizanur Rahman', output: 28900, dhu: 1.88, ftr: 94.6, status: 'GOOD' },
  { line: 'Line 07 (Kids Wear)', supervisor: 'Selina Begum', output: 26400, dhu: 1.92, ftr: 94.2, status: 'GOOD' },
  { line: 'Line 02 (Hoodies/Fleece)', supervisor: 'Delowar Hossain', output: 22100, dhu: 2.15, ftr: 93.8, status: 'GOOD' },
  { line: 'Line 05 (Woven Bottoms)', supervisor: 'Alamgir Kabir', output: 19800, dhu: 2.38, ftr: 92.4, status: 'AVERAGE' },
  { line: 'Line 06 (Denim Washed)', supervisor: 'Rafiqul Islam', output: 18400, dhu: 2.65, ftr: 91.5, status: 'AVERAGE' },
  { line: 'Line 08 (Outerwear Jackets)', supervisor: 'Monirul Haque', output: 14200, dhu: 2.78, ftr: 90.8, status: 'AVERAGE' },
];
