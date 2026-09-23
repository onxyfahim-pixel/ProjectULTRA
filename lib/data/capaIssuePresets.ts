import { CapaSeverity, CapaIssueItem } from '@/lib/types/modules';

export interface CapaIssuePreset {
  id: string;
  issueTitle: string;
  category: 'SEWING' | 'FABRIC' | 'NEEDLE_SAFETY' | 'TRIMS' | 'MEASUREMENT' | 'FINISHING' | 'STAIN_SOIL' | 'SOP_COMPLIANCE' | 'PACKAGING' | 'OTHER';
  severity: CapaSeverity;
  department: string;
  processStage: string;
  description: string;
  correctiveAction: string;
  preventiveAction: string;
  evidenceImage: string;
  evidenceCaption: string;
  tags: string[];
}

export const CAPA_ISSUE_PRESETS: CapaIssuePreset[] = [
  {
    id: 'preset-needle-control',
    issueTitle: 'Needle Control Log Missing Shift Sign-off & Unlogged Tip Deflection',
    category: 'NEEDLE_SAFETY',
    severity: 'CRITICAL',
    department: 'Sewing Line 04',
    processStage: 'Needle & Sharp Tool Dispensary',
    description: 'Line operated with 2 broken needle replacements without immediate supervisor sign-off or magnetic fragment search records in physical register.',
    correctiveAction: 'Immediately quarantined 185 garments from affected line run. Ran 100% through 9-point conveyor metal detector; retrieved all fractured needle tips.',
    preventiveAction: 'Mounted acrylic digital locked needle dispensary box line-side. Updated SOP-QMS-04 to require dual operator + supervisor biometric sign-off.',
    evidenceImage: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'Deflected needle tip retrieved from waste tray under microscopic inspection',
    tags: ['needle', 'metal', 'safety', 'critical', 'sign-off', 'fragment', 'detector'],
  },
  {
    id: 'preset-color-shading',
    issueTitle: 'Color Shading Delta-E > 1.2 Variance Between Rib Collar & Body Panels',
    category: 'FABRIC',
    severity: 'MAJOR',
    department: 'Cutting',
    processStage: 'Fabric Spreading & Lot Grouping',
    description: 'Buyer reported shade dissimilarity between body fabric and collar rib trim exceeding maximum Delta-E threshold of 0.80 under D65 daylight.',
    correctiveAction: 'Quarantined remaining 400 cut bundles at sewing input; 100% shade sorted under VeriVide D65 color matching cabinet to re-pair matching lots.',
    preventiveAction: 'Updated ERP marker module to restrict spreading to identical dye lots and stamped UV fluorescent marker lot codes on roll headers before spreading.',
    evidenceImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'Spectrophotometric shade evaluation under VeriVide D65 illuminant',
    tags: ['shading', 'color', 'delta-e', 'fabric', 'cutting', 'dye lot', 'rib'],
  },
  {
    id: 'preset-seam-slippage',
    issueTitle: 'Seam Slippage & Broken Stitches Across Heavy Denim Crotch Cross-Seam',
    category: 'SEWING',
    severity: 'MAJOR',
    department: 'Sewing Line 08',
    processStage: 'Denim Inseam Flat Felling',
    description: 'End-of-line QC rejected 48 consecutive pairs due to skipped stitches, broken needle thread, and thread tension puckering across the heavy 4-layer crotch fold.',
    correctiveAction: 'Halted station #9 immediately. Replaced needle plate, feed dogs, and looper mechanism with heavy-denim set. Recalibrated thread draw tension to 120 cN.',
    preventiveAction: 'Updated Style Changeover Protocol (SCP-SEW-08) to require 5-sample cross-seam tensile pull test evaluated at 250 N minimum before releasing bulk.',
    evidenceImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'Microscopic inspection of burred needle plate aperture and skipped stitch',
    tags: ['seam', 'stitch', 'denim', 'slippage', 'needle plate', 'thread tension'],
  },
  {
    id: 'preset-zipper-puller',
    issueTitle: 'Metal Zipper Puller Snap Detachment Failing 70N Safety Pull Requirement',
    category: 'TRIMS',
    severity: 'CRITICAL',
    department: 'Quality Inspection & Testing Lab',
    processStage: 'Inward Trims QC',
    description: 'Laboratory pull testing on #5 antique brass metal zippers failed safety standard ASTM F963 with puller detachment at 42 N (minimum spec: 70 N).',
    correctiveAction: 'Placed all 25,000 zippers on immediate quarantine. Supplier re-tooled crimping dies with tungsten carbide inserts and re-crimped lot under factory QA surveillance.',
    preventiveAction: 'Demoted supplier to Conditional Probation. Mandated batch-specific digital video evidence of 70 N pull test before authorizing dispatch.',
    evidenceImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'SafQ snap pull tester load curve showing detachment failure at 42 N',
    tags: ['zipper', 'trims', 'puller', 'pull test', '70n', 'safety', 'supplier'],
  },
  {
    id: 'preset-warehouse-humidity',
    issueTitle: 'Carton Storage Warehouse Relative Humidity Exceeding 75% Mildew Risk',
    category: 'FINISHING',
    severity: 'MINOR',
    department: 'Warehouse & Storage',
    processStage: 'Finished Goods Storage',
    description: 'Digital thermo-hygrometers in finished goods bay logged humidity levels of 78% RH over 3 rainy days, exceeding safe threshold of 65% RH for packed cotton.',
    correctiveAction: 'Deployed 3 emergency mobile commercial dehumidifiers to Bay 4 within 2 hours. Reduced humidity to 58% RH; verified garment moisture at safe 8.2%.',
    preventiveAction: 'Repaired primary compressor DH-02. Installed network-connected IoT hygrometers with automated SMS/Email alarms if RH exceeds 65% for >15 minutes.',
    evidenceImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'Digital hygrometer reading 78.4% RH in Bay 4 storage corridor',
    tags: ['humidity', 'warehouse', 'mildew', 'mold', 'carton', 'storage', 'dehumidifier'],
  },
  {
    id: 'preset-measurement-out-of-spec',
    issueTitle: 'Neck Opening & Chest Width Measurements Out of AQL Tolerance by ±0.75"',
    category: 'MEASUREMENT',
    severity: 'MAJOR',
    department: 'Sewing Line 01',
    processStage: 'Collar Setting & Final Assembly',
    description: 'AQL 2.5 final audit identified 14 garments with neck circumference 3/4" under tolerance due to excessive tension during collar overlock stitching.',
    correctiveAction: '100% measurement screening of current 600-piece lot. Steam-relaxed collars on calibrated form dummies to restore dimensional tolerance.',
    preventiveAction: 'Installed pneumatic differential feed guide on collar setting workstations and revised first-bundle measurement sign-off to 2-hour intervals.',
    evidenceImage: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'Digital caliper and steel tape verification showing collar circumference out of spec',
    tags: ['measurement', 'dimension', 'neck', 'chest', 'tolerance', 'aql', 'collar'],
  },
  {
    id: 'preset-oil-stain',
    issueTitle: 'Sewing Machine Needle Bar Oil & Grease Splatter on Front Garment Panels',
    category: 'STAIN_SOIL',
    severity: 'MINOR',
    department: 'Sewing Line 12',
    processStage: 'Front Placket Assembly',
    description: 'Inspection identified dark lubricant droplets around placket topstitch on 22 white poplin shirts caused by over-oiled needle bar felt washers.',
    correctiveAction: 'Replaced saturated felt oil wicks on 4 lockstitch machines. Cleaned affected shirts using ultrasonic solvent spot gun and warm air drying station.',
    preventiveAction: 'Instituted mandatory pre-shift blotter paper oil drip check for all operators prior to running white or light-shade production orders.',
    evidenceImage: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'Needle bar oil splatter marks inspected under UV inspection lamp',
    tags: ['oil', 'stain', 'lubricant', 'needle bar', 'soil', 'white fabric', 'spot gun'],
  },
  {
    id: 'preset-heat-transfer-peel',
    issueTitle: 'Neck Care Heat Transfer Label Edge Peeling After Single Home Wash Test',
    category: 'TRIMS',
    severity: 'MAJOR',
    department: 'Finishing & Packaging',
    processStage: 'Heat Seal Label Transfer',
    description: 'Quality audit wash test (AATCC 135) revealed 40% label delamination due to inadequate presser platen temperature and dwell time.',
    correctiveAction: 'Adjusted pneumatic heat transfer press to 165°C, 4.5 bar pressure, and 12-second dwell. Re-applied labels to affected 350-piece bundle.',
    preventiveAction: 'Equipped heat transfer station with wireless digital contact pyrometer to verify platen temperature at 2-hour intervals.',
    evidenceImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'Delaminated heat transfer care label after 40°C accelerated wash cycle',
    tags: ['heat transfer', 'label', 'peeling', 'delamination', 'wash test', 'temperature'],
  },
  {
    id: 'preset-sop-noncompliance',
    issueTitle: 'Missing SOP Work Instruction & Quality Gate Verification at Fusing Press',
    category: 'SOP_COMPLIANCE',
    severity: 'MINOR',
    department: 'Cutting',
    processStage: 'Interlining Fusing',
    description: 'Internal QMS audit discovered fusing press machine operating without approved temperature/speed calibration sheet posted at workstation.',
    correctiveAction: 'Conducted immediate peel-strength test (DIN 54310) on current batch (achieved 14 N/5cm, passed). Laminated and posted current SOP-CUT-04 at line.',
    preventiveAction: 'Included SOP document verification in weekly QA surveillance audit and added QR code on fusing machine linking to live digital procedure.',
    evidenceImage: 'https://images.unsplash.com/photo-158109226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'Mounted digital SOP workstation tablet display with calibration parameters',
    tags: ['sop', 'compliance', 'fusing', 'work instruction', 'audit', 'iso 9001'],
  },
  {
    id: 'preset-rivet-button-pull',
    issueTitle: 'Shank Metal Button Rivet Loose & Pull Resistance Below 90N Specification',
    category: 'TRIMS',
    severity: 'CRITICAL',
    department: 'Finishing & Packaging',
    processStage: 'Automatic Button Attaching',
    description: 'Tension pull testing revealed rivet button displacement at 65 N due to misaligned pneumatic punch die on automated rivet machine #3.',
    correctiveAction: '100% pull gauge inspection of entire 1,200 pcs order. Replaced punch die assembly and securely re-riveted all failing buttons.',
    preventiveAction: 'Added mandatory 5-piece destructive pull test at the start of every production shift before operator signs off on machine clearance.',
    evidenceImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=60',
    evidenceCaption: 'Button rivet head deformation and pull force failure reading on digital gauge',
    tags: ['button', 'rivet', 'shank', 'pull force', 'snap', 'hardware', 'critical'],
  },
];

// Quick suggestion chips for Corrective Actions
export const CORRECTIVE_ACTION_CHIPS = [
  'Quarantine current production lot and perform 100% sorting',
  'Halt machine station, replace worn tooling/needle, and recalibrate tension',
  'Rework affected garments using manual single-needle reinforcement',
  '100% scan through calibrated 9-point conveyor metal detector',
  'Spot clean soiled panels with ultrasonic solvent gun and warm air drying',
  'Steam-mold and relax panels on calibrated form dummies to restore spec',
  'Return rejected batch to supplier for re-tooling and punch die replacement',
  'Conduct immediate peel/tensile test to verify structural compliance',
];

// Quick suggestion chips for Preventive Actions
export const PREVENTIVE_ACTION_CHIPS = [
  'Update SOP and mandate pre-shift operator verification checklist',
  'Automate barcode verification gate in ERP to block incompatible lots',
  'Mount acrylic digital locked dispensary box line-side with dual sign-off',
  'Mandate 5-sample destructive tensile pull test prior to bulk production',
  'Install IoT telemetry sensors with automated SMS threshold alerts',
  'Conduct mandatory 30-min refresher training for all line operators & supervisors',
  'Equip workstation with digital contact pyrometer for 2-hour temperature logging',
  'Place supplier on Conditional Probation with mandatory video test verification',
];

// Quick factory evidence photos for 1-click photo selection
export const INDUSTRY_EVIDENCE_PHOTOS = [
  {
    label: 'Deflected Needle Tip',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60',
    caption: 'Deflected needle tip retrieved from waste tray',
  },
  {
    label: 'Spectrophotometer Shade Check',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=60',
    caption: 'Color spectrophotometer Delta-E test result',
  },
  {
    label: 'Seam Burst & Inseam Stitching',
    url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=60',
    caption: 'Needle plate burr and seam slippage inspection',
  },
  {
    label: 'SafQ Snap Pull Tester',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
    caption: 'Zipper snap pull load graph at 42 N failure',
  },
  {
    label: 'Warehouse Digital Hygrometer',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=60',
    caption: 'Warehouse digital thermo-hygrometer display',
  },
  {
    label: 'Digital Caliper Thickness / Spec',
    url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=60',
    caption: 'Calibrated digital micrometer measurement verification',
  },
  {
    label: 'Fabric Inspection & UV Lamp',
    url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&auto=format&fit=crop&q=60',
    caption: 'UV marker inspection under optical inspection bench',
  },
  {
    label: 'Installed Acrylic Needle Safe',
    url: 'https://images.unsplash.com/photo-158109226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
    caption: 'Mounted line-side digital needle dispensary lockbox',
  },
];

export function createBlankIssue(index = 1): CapaIssueItem {
  return {
    id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    issueTitle: `Issue #${index}`,
    category: 'SEWING',
    severity: 'MAJOR',
    description: '',
    correctiveAction: '',
    preventiveAction: '',
    evidenceImage: '',
    evidenceCaption: '',
    status: 'OPEN',
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
}

export function createIssueFromPreset(preset: CapaIssuePreset): CapaIssueItem {
  return {
    id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    issueTitle: preset.issueTitle,
    category: preset.category,
    severity: preset.severity,
    department: preset.department,
    processStage: preset.processStage,
    description: preset.description,
    correctiveAction: preset.correctiveAction,
    preventiveAction: preset.preventiveAction,
    evidenceImage: preset.evidenceImage,
    evidenceCaption: preset.evidenceCaption,
    status: 'OPEN',
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
}
