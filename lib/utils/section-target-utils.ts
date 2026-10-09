import {
  BuyerOrder,
  ProductionSectionKey,
  SectionTargetConfig,
  SectionWiseTargets,
} from '@/lib/types/modules';

export type { ProductionSectionKey, SectionTargetConfig, SectionWiseTargets };

export const SECTION_KEYS: ProductionSectionKey[] = [
  'cutting',
  'sewing',
  'washing',
  'finishing',
  'packing',
  'qa',
];

export interface SectionMetadata {
  key: ProductionSectionKey;
  name: string;
  shortLabel: string;
  defaultSmvRatio: number; // Ratio compared to garment base sewing SMV
  defaultManpower: number;
  defaultEff: number;
  unitLabel: string;
  accentColor: string;
  badgeBg: string;
  description: string;
}

export const SECTION_METADATA: Record<ProductionSectionKey, SectionMetadata> = {
  cutting: {
    key: 'cutting',
    name: 'Cutting Floor',
    shortLabel: 'Cutting',
    defaultSmvRatio: 0.13, // e.g. 2.4 min if sewing is 18.5
    defaultManpower: 16,
    defaultEff: 85,
    unitLabel: 'panels/hr',
    accentColor: '#0284c7', // Sky-600
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Fabric spreading, auto/manual cutting table & bundling',
  },
  sewing: {
    key: 'sewing',
    name: 'Sewing Floor',
    shortLabel: 'Sewing',
    defaultSmvRatio: 1.0, // Primary assembly benchmark (e.g. 18.5 min)
    defaultManpower: 48,
    defaultEff: 82,
    unitLabel: 'pcs/hr',
    accentColor: '#4f46e5', // Indigo-600
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Component prep & main line garment stitching',
  },
  washing: {
    key: 'washing',
    name: 'Industrial Washing',
    shortLabel: 'Washing',
    defaultSmvRatio: 0.22, // e.g. 4.0 min
    defaultManpower: 18,
    defaultEff: 80,
    unitLabel: 'pcs/hr',
    accentColor: '#06b6d4', // Cyan-600
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Enzyme wash, tinting, softening & hydro-extraction',
  },
  finishing: {
    key: 'finishing',
    name: 'Finishing Floor',
    shortLabel: 'Finishing',
    defaultSmvRatio: 0.30, // e.g. 5.5 min
    defaultManpower: 24,
    defaultEff: 84,
    unitLabel: 'pcs/hr',
    accentColor: '#9333ea', // Purple-600
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Thread trimming, steam tunnel pressing & iron finish',
  },
  packing: {
    key: 'packing',
    name: 'Packing & Warehouse',
    shortLabel: 'Packing',
    defaultSmvRatio: 0.17, // e.g. 3.2 min
    defaultManpower: 18,
    defaultEff: 88,
    unitLabel: 'pcs/hr',
    accentColor: '#d97706', // Amber-600
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Polybagging, barcode retail hangtags & carton boxing',
  },
  qa: {
    key: 'qa',
    name: 'Quality Assurance (QA)',
    shortLabel: 'Quality / QA',
    defaultSmvRatio: 0.12, // e.g. 2.2 min
    defaultManpower: 10,
    defaultEff: 90,
    unitLabel: 'inspected/hr',
    accentColor: '#059669', // Emerald-600
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: '100% end-line inspection, measurement check & AQL audit',
  },
};

/**
 * Normalizes any section name or line string into a canonical ProductionSectionKey
 */
export function normalizeSectionKey(sectionNameOrLine?: string): ProductionSectionKey {
  if (!sectionNameOrLine) return 'sewing';
  const s = sectionNameOrLine.toLowerCase();
  if (s.includes('cut') || s.includes('spread') || s.includes('marker')) return 'cutting';
  if (s.includes('wash') || s.includes('laundry') || s.includes('dye')) return 'washing';
  if (s.includes('finish') || s.includes('iron') || s.includes('press') || s.includes('trim')) return 'finishing';
  if (s.includes('pack') || s.includes('carton') || s.includes('poly') || s.includes('box') || s.includes('warehouse')) return 'packing';
  if (s.includes('qa') || s.includes('qc') || s.includes('quality') || s.includes('audit') || s.includes('inspect')) return 'qa';
  return 'sewing';
}

/**
 * Standard IE Formula:
 * Target / Hour = (Manpower × 60 / SMV) × (Efficiency% / 100)
 */
export function calculateHourlyTarget(smv: number, manpower: number, efficiencyPercent: number): number {
  if (!smv || smv <= 0) return 0;
  const raw = ((manpower * 60) / smv) * (efficiencyPercent / 100);
  return Math.max(1, Math.round(raw));
}

/**
 * Reverse calculate SMV from Hourly Target:
 * SMV = (Manpower × 60 / HourlyTarget) × (Efficiency% / 100)
 */
export function calculateSmvFromHourlyTarget(hourlyTarget: number, manpower: number, efficiencyPercent: number): number {
  if (!hourlyTarget || hourlyTarget <= 0) return 1.0;
  const raw = ((manpower * 60) / hourlyTarget) * (efficiencyPercent / 100);
  return Math.max(0.1, Math.round(raw * 10) / 10);
}

/**
 * Generates balanced section-wise targets for an order
 */
export function getDefaultSectionTargets(
  baseSmv: number = 18.5,
  dailyTarget?: number,
  washApplicable: boolean = false
): SectionWiseTargets {
  const safeBaseSmv = baseSmv > 0 ? baseSmv : 18.5;
  const safeDailyTarget = dailyTarget && dailyTarget > 0 ? dailyTarget : 1200;
  const sewingHourlyPace = Math.max(1, Math.round(safeDailyTarget / 8));

  // Compute realistic section SMVs based on apparel engineering ratios
  const sewingSmv = Math.round(safeBaseSmv * 10) / 10;
  const cuttingSmv = Math.max(0.8, Math.round(safeBaseSmv * SECTION_METADATA.cutting.defaultSmvRatio * 10) / 10);
  const washingSmv = Math.max(1.5, Math.round(safeBaseSmv * SECTION_METADATA.washing.defaultSmvRatio * 10) / 10);
  const finishingSmv = Math.max(1.8, Math.round(safeBaseSmv * SECTION_METADATA.finishing.defaultSmvRatio * 10) / 10);
  const packingSmv = Math.max(1.0, Math.round(safeBaseSmv * SECTION_METADATA.packing.defaultSmvRatio * 10) / 10);
  const qaSmv = Math.max(0.8, Math.round(safeBaseSmv * SECTION_METADATA.qa.defaultSmvRatio * 10) / 10);

  // Derive section hourly targets based on manpower & efficiency
  const cuttingHourly = calculateHourlyTarget(
    cuttingSmv,
    SECTION_METADATA.cutting.defaultManpower,
    SECTION_METADATA.cutting.defaultEff
  );

  const sewingHourly = sewingHourlyPace > 0
    ? sewingHourlyPace
    : calculateHourlyTarget(
        sewingSmv,
        SECTION_METADATA.sewing.defaultManpower,
        SECTION_METADATA.sewing.defaultEff
      );

  const washingHourly = washApplicable
    ? calculateHourlyTarget(
        washingSmv,
        SECTION_METADATA.washing.defaultManpower,
        SECTION_METADATA.washing.defaultEff
      )
    : 0;

  const finishingHourly = calculateHourlyTarget(
    finishingSmv,
    SECTION_METADATA.finishing.defaultManpower,
    SECTION_METADATA.finishing.defaultEff
  );

  const packingHourly = calculateHourlyTarget(
    packingSmv,
    SECTION_METADATA.packing.defaultManpower,
    SECTION_METADATA.packing.defaultEff
  );

  const qaHourly = calculateHourlyTarget(
    qaSmv,
    SECTION_METADATA.qa.defaultManpower,
    SECTION_METADATA.qa.defaultEff
  );

  return {
    cutting: {
      sectionKey: 'cutting',
      sectionName: 'Cutting Floor',
      smv: cuttingSmv,
      hourlyTarget: cuttingHourly,
      dailyTarget: cuttingHourly * 8,
      manpower: SECTION_METADATA.cutting.defaultManpower,
      efficiency: SECTION_METADATA.cutting.defaultEff,
      targetEfficiency: SECTION_METADATA.cutting.defaultEff,
      workingHours: 8,
      notes: 'Spreading and marker ratio auto-balanced to order volume',
    },
    sewing: {
      sectionKey: 'sewing',
      sectionName: 'Sewing Floor',
      smv: sewingSmv,
      hourlyTarget: sewingHourly,
      dailyTarget: sewingHourly * 8,
      manpower: SECTION_METADATA.sewing.defaultManpower,
      efficiency: SECTION_METADATA.sewing.defaultEff,
      targetEfficiency: SECTION_METADATA.sewing.defaultEff,
      workingHours: 8,
      notes: 'Main garment assembly pacing linked to IE bulletin',
    },
    washing: {
      sectionKey: 'washing',
      sectionName: 'Industrial Washing',
      smv: washingSmv,
      hourlyTarget: washingHourly,
      dailyTarget: washingHourly * 8,
      manpower: SECTION_METADATA.washing.defaultManpower,
      efficiency: SECTION_METADATA.washing.defaultEff,
      targetEfficiency: SECTION_METADATA.washing.defaultEff,
      workingHours: 8,
      notes: washApplicable ? 'Industrial laundry bay batch target' : 'Non-wash style (bypassed)',
    },
    finishing: {
      sectionKey: 'finishing',
      sectionName: 'Finishing Floor',
      smv: finishingSmv,
      hourlyTarget: finishingHourly,
      dailyTarget: finishingHourly * 8,
      manpower: SECTION_METADATA.finishing.defaultManpower,
      efficiency: SECTION_METADATA.finishing.defaultEff,
      targetEfficiency: SECTION_METADATA.finishing.defaultEff,
      workingHours: 8,
      notes: 'Steam tunnel pressing and thread trimming output',
    },
    packing: {
      sectionKey: 'packing',
      sectionName: 'Packing & Warehouse',
      smv: packingSmv,
      hourlyTarget: packingHourly,
      dailyTarget: packingHourly * 8,
      manpower: SECTION_METADATA.packing.defaultManpower,
      efficiency: SECTION_METADATA.packing.defaultEff,
      targetEfficiency: SECTION_METADATA.packing.defaultEff,
      workingHours: 8,
      notes: 'Polybag & master carton barcode packing',
    },
    qa: {
      sectionKey: 'qa',
      sectionName: 'Quality Assurance (QA)',
      smv: qaSmv,
      hourlyTarget: qaHourly,
      dailyTarget: qaHourly * 8,
      manpower: SECTION_METADATA.qa.defaultManpower,
      efficiency: SECTION_METADATA.qa.defaultEff,
      targetEfficiency: SECTION_METADATA.qa.defaultEff,
      workingHours: 8,
      notes: '100% end-line QA and pre-final AQL inspection',
    },
  };
}

/**
 * Gets the active SectionTargetConfig for an order and a section
 */
export function getSectionTargetForOrder(
  order: BuyerOrder | null | undefined,
  sectionNameOrLine?: string
): SectionTargetConfig {
  const key = normalizeSectionKey(sectionNameOrLine);
  const existingConfig =
    order?.sectionTargets?.[key] ||
    order?.wipRecord?.sectionTargets?.[key];

  if (existingConfig && existingConfig.hourlyTarget > 0 && existingConfig.smv > 0) {
    return {
      ...existingConfig,
      targetEfficiency: existingConfig.targetEfficiency || existingConfig.efficiency,
    };
  }

  const defaults = getDefaultSectionTargets(
    order?.smv,
    order?.productionTarget || order?.dailyTarget,
    Boolean(order?.wipRecord?.washApplicable)
  );

  return defaults[key];
}

/**
 * Get section label and styling details
 */
export function getSectionBadgeInfo(sectionNameOrLine?: string): {
  key: ProductionSectionKey;
  label: string;
  badgeCls: string;
} {
  const key = normalizeSectionKey(sectionNameOrLine);
  const meta = SECTION_METADATA[key];
  return {
    key,
    label: meta.shortLabel,
    badgeCls: meta.badgeBg,
  };
}
