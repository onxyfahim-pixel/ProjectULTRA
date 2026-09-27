import { RiskAssessmentType, RiskLevel, RiskStatus, RiskFmeaItem } from '@/lib/types/modules';

export interface AssessmentTypeOption {
  type: RiskAssessmentType;
  label: string;
  badgeLabel: string;
  shortDesc: string;
  description: string;
  scopeList: string[];
  color: string;
  accentBg: string;
  borderColor: string;
  iconBg: string;
}

export const RISK_ASSESSMENT_TYPES: AssessmentTypeOption[] = [
  {
    type: 'PRODUCT',
    label: 'Product Risk Assessment',
    badgeLabel: 'PRODUCT',
    shortDesc: 'Garment construction, fabric integrity, seam strength, fit & aesthetics',
    description: 'Evaluates design specifications, fabric shrinkages, dye migration, decorative trims, button pull force, and dimensional stability.',
    scopeList: [
      'Fabric elasticity & recovery rate',
      'Wash fastness & color bleeding',
      'Seam slippage & tensile strength',
      'Button / snap / zipper pull strength',
      'Care label legibility & compliance',
    ],
    color: 'text-indigo-700',
    accentBg: 'bg-indigo-50/70',
    borderColor: 'border-indigo-200',
    iconBg: 'bg-indigo-100 text-indigo-700',
  },
  {
    type: 'PROCESS',
    label: 'Process Risk Assessment',
    badgeLabel: 'PROCESS',
    shortDesc: 'Garment manufacturing lines, operator methods, machine setups & tooling',
    description: 'Evaluates spreading ply tension, computerized knife cutting, inline sewing attachments, pressing heat dwell time, and carton packing.',
    scopeList: [
      'Fabric tensionless spreading relaxation',
      'Marker matching & grain line precision',
      'Sewing differential feed & puckering',
      'Steam iron temperature & pressure',
      'Carton barcode scanning & assortment',
    ],
    color: 'text-blue-700',
    accentBg: 'bg-blue-50/70',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100 text-blue-700',
  },
  {
    type: 'CRITICAL_PROCESS',
    label: 'Critical Process Risk Assessment',
    badgeLabel: 'CRITICAL PROCESS',
    shortDesc: 'Mandatory consumer safety gates, chemical barriers & regulatory compliance',
    description: 'Zero-tolerance safety controls including 9-point conveyor metal detection, broken needle lockdown, waterproof tape hydrostatic tests, and small parts choking hazard.',
    scopeList: [
      '100% 9-point conveyor metal detection (Fe 1.0mm)',
      'Broken needle search magnet & lockbox log',
      'Waterproof seam sealing hydrostatic resistance (>10,000mm)',
      'Childrenswear small parts 90N pull test',
      'Ultrasonic bonding / high-tension heat transfer',
    ],
    color: 'text-rose-700',
    accentBg: 'bg-rose-50/70',
    borderColor: 'border-rose-200',
    iconBg: 'bg-rose-100 text-rose-700',
  },
];

// FMEA Rubrics
export const SEVERITY_RUBRIC: Record<number, { label: string; desc: string }> = {
  1: { label: 'None', desc: 'No discernible effect on garment quality or fit.' },
  2: { label: 'Very Minor', desc: 'Slight aesthetic imperfection; noticed only by trained inspectors.' },
  3: { label: 'Minor', desc: 'Minor cosmetic flaw; passes AQL 2.5 with slight remark.' },
  4: { label: 'Very Low', desc: 'Slight customer dissatisfaction; garment fully wearable.' },
  5: { label: 'Low', desc: 'Minor customer complaint; garment requires minor pressing/trimming.' },
  6: { label: 'Moderate', desc: 'Garment requires factory rework; minor fit tolerance deviation.' },
  7: { label: 'High', desc: 'Major defect; customer return likely; buyer price markdown.' },
  8: { label: 'Very High', desc: 'Severe failure; full production lot rejection; fabric breach.' },
  9: { label: 'Hazardous (With Warning)', desc: 'Safety hazard or regulatory violation with detectable pre-warning.' },
  10: { label: 'Hazardous (Zero Warning)', desc: 'Critical consumer hazard (broken needle, choking part, chemical ban).' },
};

export const OCCURRENCE_RUBRIC: Record<number, { label: string; desc: string }> = {
  1: { label: 'Extremely Unlikely', desc: 'Failure rate < 1 in 100,000 garments (< 0.001%).' },
  2: { label: 'Remote', desc: 'Failure rate ~ 1 in 50,000 garments (~ 0.002%).' },
  3: { label: 'Very Low', desc: 'Isolated failure; ~ 1 in 10,000 garments (~ 0.01%).' },
  4: { label: 'Low', desc: 'Occurs occasionally on complex operations; ~ 1 in 2,000 (~ 0.05%).' },
  5: { label: 'Moderate Low', desc: 'Occurs once or twice per production run; ~ 1 in 1,000 (~ 0.1%).' },
  6: { label: 'Moderate', desc: 'Documented recurring defect; ~ 1 in 500 garments (~ 0.2%).' },
  7: { label: 'Frequent', desc: 'Common operator issue without jig; ~ 1 in 200 (~ 0.5%).' },
  8: { label: 'High', desc: 'Persistent assembly defect; ~ 1 in 100 garments (~ 1%).' },
  9: { label: 'Very High', desc: 'High failure frequency; ~ 1 in 50 garments (~ 2%).' },
  10: { label: 'Extremely High', desc: 'Inevitably fails without engineering poka-yoke (> 5%).' },
};

export const DETECTION_RUBRIC: Record<number, { label: string; desc: string }> = {
  1: { label: 'Almost Certain', desc: 'Automated 100% optical sensor / in-line interlock stops defect.' },
  2: { label: 'Very High', desc: 'Dedicated 100% inline checkpoint with gauge detection.' },
  3: { label: 'High', desc: 'Standard 100% end-line table inspection detects defect.' },
  4: { label: 'Moderately High', desc: 'Frequent statistical bundle inspection (AQL 1.0).' },
  5: { label: 'Moderate', desc: 'Random roving QA check; defect easily visible when present.' },
  6: { label: 'Low', desc: 'Defect is subtle; requires manual dimensional measurement.' },
  7: { label: 'Very Low', desc: 'Detected only during specialized lab / destructive wash testing.' },
  8: { label: 'Remote', desc: 'Hidden inside inner seam or waistband; rarely caught before customer.' },
  9: { label: 'Very Remote', desc: 'Inspection method has unproven reliability or depends on fatigue.' },
  10: { label: 'Undetectable', desc: 'Cannot be detected in factory; only discovered by consumer after use.' },
};

export function computeRpn(severity: number, occurrence: number, detection: number): number {
  const s = Math.max(1, Math.min(10, severity || 1));
  const o = Math.max(1, Math.min(10, occurrence || 1));
  const d = Math.max(1, Math.min(10, detection || 1));
  return s * o * d;
}

export function getRiskLevel(rpn: number, severity?: number): RiskLevel {
  if (severity && severity >= 9) return 'CRITICAL';
  if (rpn >= 125) return 'CRITICAL';
  if (rpn >= 80) return 'HIGH';
  if (rpn >= 40) return 'MEDIUM';
  return 'LOW';
}

export function getRiskLevelBadge(level: RiskLevel): {
  label: string;
  badgeClass: string;
  tone: 'rose' | 'amber' | 'blue' | 'emerald';
} {
  switch (level) {
    case 'CRITICAL':
      return {
        label: 'CRITICAL RISK',
        badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-400 font-extrabold',
        tone: 'rose',
      };
    case 'HIGH':
      return {
        label: 'HIGH RISK',
        badgeClass: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
        tone: 'amber',
      };
    case 'MEDIUM':
      return {
        label: 'MEDIUM RISK',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
        tone: 'amber',
      };
    case 'LOW':
    default:
      return {
        label: 'LOW RISK',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
        tone: 'emerald',
      };
  }
}

export const SAMPLE_BUYERS = [
  'H&M Hennes & Mauritz',
  'Zara / Inditex',
  'Target Sourcing',
  'Patagonia Outerwear',
  'Tommy Hilfiger',
  'Uniqlo / Fast Retailing',
  'Marks & Spencer',
  'Nike Performance',
];

export const SAMPLE_DEPARTMENTS = [
  'Fabric Quality & Lab',
  'Cutting Room',
  'Sewing Assembly',
  'Embroidery & Embellishment',
  'Washing & Dyeing',
  'Finishing & Packaging',
  'Technical Outerwear',
  'Product Safety QA',
];
