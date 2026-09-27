import { RiskSectionType, RiskSectionItem, RiskLevel } from '@/lib/types/modules';
import { computeRpn, getRiskLevel } from './riskAssessmentData';

export interface RiskSectionMeta {
  type: RiskSectionType;
  label: string;
  shortDesc: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  lightBg: string;
  iconName: 'raw-material' | 'embellishment' | 'testing' | 'legal' | 'cutting' | 'sewing' | 'finishing' | 'other';
}

export const RISK_SECTIONS: Record<RiskSectionType, RiskSectionMeta> = {
  RAW_MATERIAL: {
    type: 'RAW_MATERIAL',
    label: 'Raw Material',
    shortDesc: 'Fabrics, yarns, dyes, interlining, zippers, buttons & base trims',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    lightBg: 'bg-emerald-50/60',
    iconName: 'raw-material',
  },
  EMBELLISHMENT: {
    type: 'EMBELLISHMENT',
    label: 'Embellishment',
    shortDesc: 'Screen printing, embroidery, heat seals, foil, rhinestones & badges',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-300',
    lightBg: 'bg-purple-50/60',
    iconName: 'embellishment',
  },
  PRODUCT_TESTING: {
    type: 'PRODUCT_TESTING',
    label: 'Product Testing',
    shortDesc: 'Seam strength, wash stability, button pull, tear & tensile performance',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    borderColor: 'border-sky-300',
    lightBg: 'bg-sky-50/60',
    iconName: 'testing',
  },
  LEGAL_REQUIREMENT: {
    type: 'LEGAL_REQUIREMENT',
    label: 'Legal Requirement',
    shortDesc: 'Care labeling compliance, REACH, OEKO-TEX, CPSIA safety & flammability',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    borderColor: 'border-rose-300',
    lightBg: 'bg-rose-50/60',
    iconName: 'legal',
  },
  CUTTING: {
    type: 'CUTTING',
    label: 'Cutting & Preparation',
    shortDesc: 'Pattern matching, grain line accuracy, spreading tension & ply relaxation',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    borderColor: 'border-cyan-300',
    lightBg: 'bg-cyan-50/60',
    iconName: 'cutting',
  },
  SEWING: {
    type: 'SEWING',
    label: 'Sewing & Construction',
    shortDesc: 'Assembly operations, seam puckering, needle cutting & stitch tension',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-300',
    lightBg: 'bg-amber-50/60',
    iconName: 'sewing',
  },
  PACKAGING_FINISHING: {
    type: 'PACKAGING_FINISHING',
    label: 'Finishing & Packaging',
    shortDesc: 'Pressing marks, moisture/mold prevention, barcode accuracy & metal detection',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-300',
    lightBg: 'bg-indigo-50/60',
    iconName: 'finishing',
  },
  OTHER: {
    type: 'OTHER',
    label: 'Other & General',
    shortDesc: 'Logistics, packaging accessories, warehouse handling & special requirements',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    borderColor: 'border-slate-300',
    lightBg: 'bg-slate-50/60',
    iconName: 'other',
  },
};

export const RISK_SECTION_ORDER: RiskSectionType[] = [
  'RAW_MATERIAL',
  'EMBELLISHMENT',
  'PRODUCT_TESTING',
  'LEGAL_REQUIREMENT',
  'SEWING',
  'CUTTING',
  'PACKAGING_FINISHING',
  'OTHER',
];

export interface RiskSectionPreset {
  id: string;
  section: RiskSectionType;
  processStep: string;
  potentialFailureMode: string;
  potentialEffect: string;
  potentialCauses: string;
  currentControls: string;
  severity: number;
  occurrence: number;
  detection: number;
  mitigationAction: string;
  responsibleLead: string;
  notes?: string;
}

export const RISK_SECTION_PRESETS: RiskSectionPreset[] = [
  // ─── 1. RAW MATERIAL PRESETS ────────────────────────────────────────────────
  {
    id: 'pre-rm-1',
    section: 'RAW_MATERIAL',
    processStep: 'Knit / Woven Fabric Sourcing & Inspection',
    potentialFailureMode: 'Fabric Shrinkage & Dimensional Distortion After Wash (>5% length/width)',
    potentialEffect: 'Finished garments undersized after buyer home laundering; widespread consumer returns.',
    potentialCauses: 'Inadequate fabric compaction during sanforizing / stenter finishing at dyeing mill.',
    currentControls: 'Standard random 10% 4-point inspection on arrival without pre-wash relaxation.',
    severity: 8,
    occurrence: 5,
    detection: 4,
    mitigationAction: 'Mandatory 4-hour pre-production wash shrinkage audit for each dye lot + calculate marker shrinkage compensation buffer.',
    responsibleLead: 'Fabric Lab Head & Cutting In-charge',
    notes: 'Shrinkage tolerance threshold strictly set to max -3.0% / +1.0%.',
  },
  {
    id: 'pre-rm-2',
    section: 'RAW_MATERIAL',
    processStep: 'Fabric Reactive Dyeing & Shade Assessment',
    potentialFailureMode: 'Color Bleeding & Wash / Crocking Fastness Failure (< Grade 4)',
    potentialEffect: 'Contrast trim staining and color bleeding onto lighter panels during consumer wash.',
    potentialCauses: 'Unfixed reactive dye molecules left due to insufficient hot water soaping cycles at textile mill.',
    currentControls: 'Supplier mill test report certificate review only; no factory internal cross-check.',
    severity: 8,
    occurrence: 4,
    detection: 3,
    mitigationAction: '100% internal lab multi-fiber wash fastness testing (ISO 105-C06) before fabric roll release to cutting floor.',
    responsibleLead: 'Senior Quality Lab Chemist',
    notes: 'Special attention required for dark shades (Navy, Black, Maroon) with white trims.',
  },
  {
    id: 'pre-rm-3',
    section: 'RAW_MATERIAL',
    processStep: 'Fabric Roll Shade Sorting & Grouping',
    potentialFailureMode: 'Center-to-Selvage Shading & Roll-to-Roll Color Deviation (Delta E > 0.8)',
    potentialEffect: 'Noticeable color tone mismatch between front/back garment panels on assembled garments.',
    potentialCauses: 'Uneven dye liquor pickup across the width in padder; combining different dye batches in one marker.',
    currentControls: 'Manual visual inspection under inconsistent natural daylight.',
    severity: 7,
    occurrence: 5,
    detection: 3,
    mitigationAction: 'Mandatory light-box inspection under D65/TL84 standardized lighting + group rolls by 555 shade sorting bins.',
    responsibleLead: 'Textile Inspection Supervisor',
    notes: 'No mixed shade rolls allowed on the same cutting spreading table.',
  },
  {
    id: 'pre-rm-4',
    section: 'RAW_MATERIAL',
    processStep: 'Spandex / Lycra Yarn & Elastic Interlining',
    potentialFailureMode: 'Spandex Filament Breakage & Lycra Puckering After Curing / Steaming',
    potentialEffect: 'Wavy fabric surface, permanent puckering lines, and loss of garment stretch recovery.',
    potentialCauses: 'Excessive tension during yarn drafting or exceeding maximum stenter heat temperature.',
    currentControls: 'Visual checking of rolled fabric without stretch elongation test.',
    severity: 7,
    occurrence: 4,
    detection: 4,
    mitigationAction: 'Perform stretch and recovery test (ASTM D3107) on arrival + limit steam iron temperature to max 130°C.',
    responsibleLead: 'Fabric Quality Specialist',
  },
  {
    id: 'pre-rm-5',
    section: 'RAW_MATERIAL',
    processStep: 'Fabric Weight & GSM Verification',
    potentialFailureMode: 'Fabric GSM Variance Exceeding Buyer Spec (±10 GSM deviation)',
    potentialEffect: 'Garments too sheer/lightweight or excessively heavy; buyer shipment price renegotiation.',
    potentialCauses: 'Yarn count variation and uncalibrated circular knitting machine stitch length.',
    currentControls: 'Single GSM cutter sample taken from roll head only.',
    severity: 6,
    occurrence: 4,
    detection: 3,
    mitigationAction: 'Take 3 GSM cutter discs across width (left, center, right) for 10% of rolls; reject lots outside ±3% spec.',
    responsibleLead: 'Fabric Warehouse QA Inspector',
  },

  // ─── 2. EMBELLISHMENT PRESETS ──────────────────────────────────────────────
  {
    id: 'pre-emb-1',
    section: 'EMBELLISHMENT',
    processStep: 'Screen Printing (Pigment / Plastisol / Water-based)',
    potentialFailureMode: 'Screen Print Cracking, Peeling & Color Washout After 5 Washes',
    potentialEffect: 'Severe customer aesthetic defect; buyer brand reputation damage and product recall.',
    potentialCauses: 'Incomplete curing tunnel dwell time (< 2.5 min) or drying temperature under 160°C.',
    currentControls: 'Surface touch check and visual ink opacity inspection only.',
    severity: 8,
    occurrence: 4,
    detection: 3,
    mitigationAction: 'Hourly thermo-probe oven temperature profiling (curing tunnel verification) + 50-times stretch and wash test.',
    responsibleLead: 'Printing Section Manager & QA Specialist',
    notes: 'Minimum stretch elasticity requirement: print must recover 95% after 2x pull.',
  },
  {
    id: 'pre-emb-2',
    section: 'EMBELLISHMENT',
    processStep: 'High-Density Chest Embroidery',
    potentialFailureMode: 'Fabric Puckering, Needle Cutting Holes & Backing Scratching Skin',
    potentialEffect: 'Wavy distortion on jersey fabric, wearer skin irritation, and structural seam failure.',
    potentialCauses: 'Overly high stitch density, blunt embroidery needle, or stiff non-dissolvable stabilizer paper.',
    currentControls: 'Visual panel audit by line checker.',
    severity: 7,
    occurrence: 5,
    detection: 3,
    mitigationAction: 'Optimize digitized embroidery stitch density by 15% + use SES light ballpoint needles #65 + soft tear-away backing.',
    responsibleLead: 'Embroidery Production Head',
    notes: 'Mandatory fuse backing covering layer on all infant / childrenswear garments.',
  },
  {
    id: 'pre-emb-3',
    section: 'EMBELLISHMENT',
    processStep: 'Heat Seal Transfer Labels & Reflective Film',
    potentialFailureMode: 'Heat Transfer Logo Edge Delamination & Washing Lift-off',
    potentialEffect: 'Brand logo peeling off completely after customer washing cycles; brand rejection.',
    potentialCauses: 'Inaccurate heat press plate temperature, low pneumatic pressure, or insufficient dwell time.',
    currentControls: 'Manual peel test by hand fingernail after pressing.',
    severity: 8,
    occurrence: 3,
    detection: 4,
    mitigationAction: 'Install calibrated digital pneumatic heat press with verified 165°C temp, 4 bar pressure, and 12-second dwell timer.',
    responsibleLead: 'Finishing & Embellishment Supervisor',
  },
  {
    id: 'pre-emb-4',
    section: 'EMBELLISHMENT',
    processStep: 'Discharge & Reactive Rotary Printing',
    potentialFailureMode: 'Sublimation Dye Migration & Bleed Through into Print Ink on Poly-Blends',
    potentialEffect: 'White print ink turns pink/grey due to disperse dye vaporizing during heat curing.',
    potentialCauses: 'Disperse dye migration from polyester substrate into standard plastisol ink layer.',
    currentControls: 'Immediate visual check before heat curing.',
    severity: 7,
    occurrence: 4,
    detection: 3,
    mitigationAction: 'Mandatory low-bleed / anti-migration carbon grey barrier underbase print before top color application.',
    responsibleLead: 'Printing R&D Lead',
  },

  // ─── 3. PRODUCT TESTING PRESETS ────────────────────────────────────────────
  {
    id: 'pre-pt-1',
    section: 'PRODUCT_TESTING',
    processStep: 'Garment Seam Strength & Seam Slippage Test',
    potentialFailureMode: 'Seam Slippage & Yarn Dislocation Along Side Seam / Inseam (< 6mm AQL)',
    potentialEffect: 'Garment splits open at seams under mild physical strain during normal wear.',
    potentialCauses: 'Low fabric warp/weft yarn density, improper SPI (stitches per inch), or low seam allowance margin.',
    currentControls: 'Visual inspection of sewn garment without tensile testing.',
    severity: 8,
    occurrence: 4,
    detection: 3,
    mitigationAction: 'Conduct ISO 13936-2 seam slippage tensile test on pilot run garments + adjust seam allowance to 1.2cm minimum.',
    responsibleLead: 'Accredited Lab QA Manager',
  },
  {
    id: 'pre-pt-2',
    section: 'PRODUCT_TESTING',
    processStep: 'Button / Snap / Rivet Mechanical Pull Test',
    potentialFailureMode: 'Snap Button Detachment Under Less than 90N Pull Force (Small Parts Safety Hazard)',
    potentialEffect: 'Severe consumer hazard (infant choking risk); regulatory product recall under US CPSC / EU Safety Gate.',
    potentialCauses: 'Incorrect die setting on pneumatic snap machine; fabric weave tearing under snap prongs.',
    currentControls: 'Manual pull test with fingers; periodic snap holding check.',
    severity: 10,
    occurrence: 3,
    detection: 2,
    mitigationAction: 'Calibrated pneumatic digital pull-gauge testing (SafQ 90N for 10 seconds) on 5 pcs per line per hour with reinforcement interlining.',
    responsibleLead: 'Product Safety Compliance Auditor',
    notes: 'Zero tolerance: 100% lockbox log required for any detachment failure.',
  },
  {
    id: 'pre-pt-3',
    section: 'PRODUCT_TESTING',
    processStep: 'Garment Dimensional Stability & Spirality Wash Test',
    potentialFailureMode: 'Garment Body Torquing / Spirality Exceeding 5% After 3 Domestic Wash Cycles',
    potentialEffect: 'Side seams twist to front and back of garment; unwearable twisted look causing retail rejection.',
    potentialCauses: 'Yarn twist lively torque in single jersey knit fabric not heat-set during finishing.',
    currentControls: 'Checking unwashed sample garment measurements only.',
    severity: 7,
    occurrence: 5,
    detection: 4,
    mitigationAction: 'Conduct ISO 16322 spirality washing test on first production batch + adjust yarn S/Z twist balance at knitting.',
    responsibleLead: 'Washing Lab In-charge',
  },
  {
    id: 'pre-pt-4',
    section: 'PRODUCT_TESTING',
    processStep: 'Metal / Nylon Zipper Lateral Strength Test',
    potentialFailureMode: 'Zipper Cross-Pull Separation & Slider Puller Breakage Below Standard (>150N)',
    potentialEffect: 'Zipper teeth burst open on outerwear jacket; consumer inability to close garment.',
    potentialCauses: 'Inferior zipper tape weave or substandard zinc alloy slider puller casting.',
    currentControls: 'Checking supplier brand certificate without destructive physical testing.',
    severity: 8,
    occurrence: 3,
    detection: 3,
    mitigationAction: 'Perform ASTM D2061 zipper lateral strength and slider locking resistance audit for every trim batch.',
    responsibleLead: 'Trim Inspection QA',
  },

  // ─── 4. LEGAL REQUIREMENT PRESETS ──────────────────────────────────────────
  {
    id: 'pre-leg-1',
    section: 'LEGAL_REQUIREMENT',
    processStep: 'Care Label & Fiber Content Declaration Audit',
    potentialFailureMode: 'Incorrect Care Label Symbols, Wrong Fiber % Declaration or Missing Country of Origin',
    potentialEffect: 'Immediate customs seizure at port of entry; heavy administrative fines and mandatory re-labeling penalty.',
    potentialCauses: 'Typographical error in tech pack translation or using wrong label batch across mixed styles.',
    currentControls: 'Operator self-check during label attachment operation.',
    severity: 9,
    occurrence: 2,
    detection: 3,
    mitigationAction: 'Three-way cross verification protocol: Tech Pack vs. Buyer Care Spec vs. Physical Label Barcode before attachment release.',
    responsibleLead: 'Compliance & Export Documentation Officer',
    notes: 'Must comply with US FTC 16 CFR Part 303 & EU Textile Regulation 1007/2011.',
  },
  {
    id: 'pre-leg-2',
    section: 'LEGAL_REQUIREMENT',
    processStep: 'Chemical Compliance (REACH, OEKO-TEX, SVHC)',
    potentialFailureMode: 'Restricted Substances Detected: Formaldehyde, Azo Dyes, Alkylphenols or Phthalates',
    potentialEffect: 'Hazardous chemical ban violation; total shipment destruction order and buyer supplier blacklisting.',
    potentialCauses: 'Sub-supplier using banned synthetic auxiliary agents or chemical lubricants in fabric processing.',
    currentControls: 'Annual buyer RSL (Restricted Substance List) declaration signed by supplier.',
    severity: 10,
    occurrence: 2,
    detection: 3,
    mitigationAction: 'Demand third-party accredited laboratory test report (OEKO-TEX Standard 100 Class I/II) for each bulk fabric lot.',
    responsibleLead: 'Head of Chemical Safety & Environmental Compliance',
  },
  {
    id: 'pre-leg-3',
    section: 'LEGAL_REQUIREMENT',
    processStep: 'Childrenswear Safety (Drawstrings, Choking, Lead Limits)',
    potentialFailureMode: 'Non-compliant Hood / Waist Drawstrings Exceeding Length Limits (Choking / Entrapment Risk)',
    potentialEffect: 'Severe child strangulation risk; mandatory US CPSC / EU RAPEX public recall alert.',
    potentialCauses: 'Pattern cutting team overlooking drawstring length safety regulations for ages 0-14.',
    currentControls: 'Visual trim assembly inspection without measuring cord free ends.',
    severity: 10,
    occurrence: 2,
    detection: 2,
    mitigationAction: 'Enforce EN 14682 & ASTM F1816 safety standard: no drawstrings in hood/neck for childrenswear; bar-tack cords at midpoint.',
    responsibleLead: 'Pattern Master & Senior QA Compliance Auditor',
    notes: 'Zero tolerance: drawstrings in infant sizes must be replaced with flat elastics or velcro.',
  },
  {
    id: 'pre-leg-4',
    section: 'LEGAL_REQUIREMENT',
    processStep: 'Apparel Flammability Testing (16 CFR Part 1610)',
    potentialFailureMode: 'Raised Fiber Surface Fabric Failing 45-Degree Flammability Burn Time Rate',
    potentialEffect: 'Violation of Consumer Product Safety Act; burn injury hazard and mandatory product recall.',
    potentialCauses: 'High pile fleece / brushed French terry with rapid surface flash ignition.',
    currentControls: 'Supplier general certificate of conformity without batch flame testing.',
    severity: 10,
    occurrence: 2,
    detection: 2,
    mitigationAction: 'Conduct certified 16 CFR Part 1610 flammability burn rate test on fleece/brushed fabrics prior to cutting approval.',
    responsibleLead: 'Quality Safety Lab Technician',
  },
  {
    id: 'pre-leg-5',
    section: 'LEGAL_REQUIREMENT',
    processStep: 'Nickel Release in Metal Components for Direct Skin Contact',
    potentialFailureMode: 'Nickel Leaching Exceeding 0.5 µg/cm²/week from Rivets, Snaps or Zippers (BS EN 1811)',
    potentialEffect: 'Skin allergy and dermatitis for consumer; non-compliance with EU REACH Annex XVII entry 27.',
    potentialCauses: 'Metal plating facility using uncertified nickel-alloy base metal without protective lacquer.',
    currentControls: 'Visual color check of metal trims.',
    severity: 9,
    occurrence: 2,
    detection: 3,
    mitigationAction: 'Perform certified DMG (Dimethylglyoxime) spot test and EN 1811 laboratory nickel release audit for all metallic trims.',
    responsibleLead: 'Trim Compliance Officer',
  },

  // ─── 5. SEWING & CONSTRUCTION PRESETS ──────────────────────────────────────
  {
    id: 'pre-sew-1',
    section: 'SEWING',
    processStep: 'Collar Rib & Armhole Binding Attachment',
    potentialFailureMode: 'Differential Feed Seam Puckering & Wavy Neckline Opening',
    potentialEffect: 'Garment collar opening out of tolerance; rejected at buyer AQL 1.5 final inspection.',
    potentialCauses: 'Operator manual stretching of fabric during overlock feeding without metering roller.',
    currentControls: 'Manual tape measure check on 5 garments per bundle.',
    severity: 7,
    occurrence: 5,
    detection: 3,
    mitigationAction: 'Install synchronized tension-free motorized metering device on all collar overlock machines + circumference jig.',
    responsibleLead: 'Industrial Engineering (IE) Head & Line Supervisor',
  },
  {
    id: 'pre-sew-2',
    section: 'SEWING',
    processStep: 'Lockstitch & Flatlock Seam Construction',
    potentialFailureMode: 'Needle Cutting Holes Along Seam Line Causing Fabric Runs After Washing',
    potentialEffect: 'Holes develop around seams after 1-2 customer washes; massive consumer returns.',
    potentialCauses: 'Using blunt needles, incorrect needle size (#90 instead of #70/75), or oversized needle points on delicate knits.',
    currentControls: 'Checking needle changes once per week.',
    severity: 8,
    occurrence: 4,
    detection: 3,
    mitigationAction: 'Enforce strict 4-hour ballpoint needle change policy (Groz-Beckert FFG/FF points) + thumbnail slide check on seamline.',
    responsibleLead: 'Sewing Maintenance & Line Quality In-charge',
  },

  // ─── 6. FINISHING & PACKAGING PRESETS ──────────────────────────────────────
  {
    id: 'pre-fin-1',
    section: 'PACKAGING_FINISHING',
    processStep: 'Final Garment Pressing & Carton Packaging',
    potentialFailureMode: 'High Moisture Content Resulting in Mold Growth During Ocean Transit (>12% RH)',
    potentialEffect: 'Entire container shipment condemned upon destination arrival due to mold odor and discoloration.',
    potentialCauses: 'Packing warm garments directly off steam irons into airtight polybags without adequate cooling tunnel time.',
    currentControls: 'Spot checking outer cartons visually prior to container loading.',
    severity: 9,
    occurrence: 3,
    detection: 3,
    mitigationAction: 'Mandatory moisture meter check (<10% moisture content) before bagging + insert certified anti-mold chip (Micro-Pak) in each carton.',
    responsibleLead: 'Finishing Manager & Shipping QA Lead',
  },
  {
    id: 'pre-fin-2',
    section: 'PACKAGING_FINISHING',
    processStep: 'Conveyor Metal Detection 9-Point Security Gate',
    potentialFailureMode: 'Broken Needle Fragment Entrapment Undetected Due to Sensor Blind Spot',
    potentialEffect: 'Customer puncture injury; zero-tolerance buyer crisis, lawsuit and immediate factory suspension.',
    potentialCauses: 'Uncalibrated metal detector conveyor or orientation-dependent detection angle miss.',
    currentControls: 'Manual magnetic sweep wand and daily startup test log.',
    severity: 10,
    occurrence: 2,
    detection: 2,
    mitigationAction: 'Pass all garments through 100% 9-point conveyor metal detector (calibrated with 1.0mm Fe / 1.2mm Non-Fe) with hourly test-strip log.',
    responsibleLead: 'Product Safety Lockbox Officer',
  },
];

/**
 * Calculates a summary of risks grouped by section.
 */
export function computeSectionRiskStats(sectionRisks: RiskSectionItem[]) {
  const totalRisks = sectionRisks.length;
  const sectionCounts: Record<RiskSectionType, number> = {
    RAW_MATERIAL: 0,
    EMBELLISHMENT: 0,
    PRODUCT_TESTING: 0,
    LEGAL_REQUIREMENT: 0,
    CUTTING: 0,
    SEWING: 0,
    PACKAGING_FINISHING: 0,
    OTHER: 0,
  };

  let maxRpn = 0;
  let highestSeverity = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const item of sectionRisks) {
    const s = item.section || 'OTHER';
    if (sectionCounts[s] !== undefined) {
      sectionCounts[s] = (sectionCounts[s] || 0) + 1;
    } else {
      sectionCounts.OTHER = (sectionCounts.OTHER || 0) + 1;
    }

    const rpn = item.rpn || computeRpn(item.severity, item.occurrence, item.detection);
    if (rpn > maxRpn) maxRpn = rpn;
    if (item.severity > highestSeverity) highestSeverity = item.severity;

    const level = item.riskLevel || getRiskLevel(rpn, item.severity);
    if (level === 'CRITICAL') criticalCount++;
    else if (level === 'HIGH') highCount++;
    else if (level === 'MEDIUM') mediumCount++;
    else lowCount++;
  }

  const overallLevel = getRiskLevel(maxRpn, highestSeverity);

  return {
    totalRisks,
    sectionCounts,
    maxRpn,
    highestSeverity,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    overallLevel,
  };
}
