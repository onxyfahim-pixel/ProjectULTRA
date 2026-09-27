import { ProcessFlowChart, ProcessFlowStep } from '@/lib/types/modules';
import { MOCK_PROCESS_FLOW } from '@/lib/db/modules-mock-data';

export const MASTER_GARMENT_FLOW_STEPS: ProcessFlowStep[] = [
  ...MOCK_PROCESS_FLOW.map((s, idx) => ({
    ...s,
    responsibleRole:
      idx === 0
        ? 'Lab Chemist & Inward QC'
        : idx === 1
        ? 'Knitting Master'
        : idx === 2
        ? 'Dyeing In-Charge'
        : idx === 3
        ? 'Fabric Warehouse QC'
        : idx === 4
        ? 'CAD Pattern Master'
        : idx === 5
        ? 'Line Supervisor & GPQ'
        : idx === 6
        ? 'Washing Plant Chemist'
        : idx === 7
        ? 'Finishing In-Charge'
        : 'Logistics Officer',
    criticalGate: idx === 0 || idx === 2 || idx === 3 || idx === 5 || idx === 7,
    toleranceSpecs:
      idx === 0
        ? 'Count variance < 1.0%, CSP > 2800'
        : idx === 2
        ? 'Delta E < 0.8 vs master swatch'
        : idx === 3
        ? '4-Point penalty < 24 per 100 sq yds'
        : idx === 4
        ? 'Ply measurement ± 1.0mm'
        : idx === 5
        ? 'AQL 2.5 Major, 0 Critical defects'
        : idx === 7
        ? '0.8mm Ferrous detection gate 100%'
        : 'Standard commercial dispatch',
  })),
];

export const INITIAL_PROCESS_FLOW_CHARTS: ProcessFlowChart[] = [
  {
    id: 'pfc-01',
    flowCode: 'PFC-GAR-01',
    title: 'Master Garment Manufacturing & Quality Process Flow',
    productCategory: 'Knitwear & T-Shirts',
    department: 'Garment Manufacturing',
    version: 'Rev 4.0',
    status: 'ACTIVE',
    author: 'Industrial Engineering (IE) Team',
    approvedBy: 'Head of Quality Assurance & Operations',
    effectiveDate: '2026-01-15',
    reviewDate: '2027-01-15',
    description:
      'End-to-end standard manufacturing pipeline from yarn cone inward inspection through circular knitting, dyeing, spreading, sewing, and 100% needle detection to export carton sealing.',
    steps: MASTER_GARMENT_FLOW_STEPS,
    totalLeadTimeHours: 218,
    criticalGatesCount: 5,
    tags: ['Master Flow', 'ISO 9001:2015', 'Full Factory', 'Knitwear'],
    notes: 'Mandatory standard reference for all new buyer onboarding and pre-production meetings.',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-09-20T14:30:00Z',
  },
  {
    id: 'pfc-02',
    flowCode: 'PFC-DNM-02',
    title: 'Woven Denim Bottoms Wet & Dry Process Flow',
    productCategory: 'Woven Denim',
    department: 'Wet Processing & Laundry',
    version: 'Rev 2.5',
    status: 'ACTIVE',
    author: 'Denim Laundry Technical Specialist',
    approvedBy: 'Plant General Manager',
    effectiveDate: '2026-02-10',
    reviewDate: '2027-02-10',
    description:
      'Standardized operational sequence for premium 5-pocket denim pants including laser whiskering, enzyme desize wash, ozone bleach, 3D resin curing, and tensile strength audit.',
    steps: [
      {
        id: 'pfs-d-1',
        stepNumber: 1,
        stageName: 'Raw Denim Inward & Skewness Check',
        department: 'Warehouse & Lab',
        inputMaterials: 'Indigo Raw Denim Rolls (12-14 oz)',
        transformation: 'Weight verification, twill direction check, ASTM 4-point scan',
        qualityGate: 'Weft skewness < 3.0%, Shrinkage length 4-6%',
        standardTool: 'Backlit Fabric Inspection Frame & Steam Press',
        leadTimeHours: 24,
        responsibleRole: 'Denim Lab QC',
        criticalGate: true,
        toleranceSpecs: 'Skewness tolerance < 3.0%',
      },
      {
        id: 'pfs-d-2',
        stepNumber: 2,
        stageName: 'CAD Cutting & Panel Numbering',
        department: 'Cutting Room',
        inputMaterials: 'Relaxed Denim Plies',
        transformation: 'Automatic vacuum knife cutting, bundle sequencing to avoid shade variance',
        qualityGate: 'Shade band segregation (Groups A, B, C, D)',
        standardTool: 'Lectra High-Ply CNC Cutter & UV Barcode Tagging',
        leadTimeHours: 16,
        responsibleRole: 'Cutting Master',
        criticalGate: false,
        toleranceSpecs: 'Ply tolerance ± 0.8mm',
      },
      {
        id: 'pfs-d-3',
        stepNumber: 3,
        stageName: 'Heavy-Duty Twin-Needle Sewing',
        department: 'Production Floor',
        inputMaterials: 'Cut Bundles, Core-Spun Threads, Rivets',
        transformation: 'Chainstitch inseam, flat-felled back yoke, coin pocket attachment',
        qualityGate: 'Inline SPI 7-9 check, rivet pull force > 90N',
        standardTool: 'Union Special / Juki Direct Drive Heavy Automats',
        leadTimeHours: 12,
        responsibleRole: 'Denim Line Supervisor',
        criticalGate: true,
        toleranceSpecs: 'SPI 8 ± 1, pull test > 90N',
      },
      {
        id: 'pfs-d-4',
        stepNumber: 4,
        stageName: 'Dry Process: Laser Whisker & Hand Scrape',
        department: 'Denim Dry Room',
        inputMaterials: 'Raw Stitched Trousers',
        transformation: 'Jeanologia laser burning of whiskers, hand scraping on inflatable dummies',
        qualityGate: 'Laser intensity calibration & pattern symmetry vs approved sample',
        standardTool: 'Jeanologia Twin Laser Machine & Sanding Racks',
        leadTimeHours: 8,
        responsibleRole: 'Dry Process Expert',
        criticalGate: false,
        toleranceSpecs: 'Symmetry variance < 5mm',
      },
      {
        id: 'pfs-d-5',
        stepNumber: 5,
        stageName: 'Wet Laundry: Enzyme Wash & Ozone Neutralization',
        department: 'Washing Plant',
        inputMaterials: 'Scraped Denim, Eco Enzymes, Ozone Gas',
        transformation: 'Desizing, cellulase enzyme bio-stone wash, Jeanologia G2 ozone decoloration',
        qualityGate: 'Shade master swatches check under D65/TL84 light, tear strength > 15 kgf',
        standardTool: 'Tonello Belly Washer & Jeanologia Ozone Tumbler',
        leadTimeHours: 28,
        responsibleRole: 'Washing Plant Chemist',
        criticalGate: true,
        toleranceSpecs: 'Tear strength > 15 kgf, pH 6.0 - 7.5',
      },
      {
        id: 'pfs-d-6',
        stepNumber: 6,
        stageName: 'Hydro-Extraction & Oven Resin Curing',
        department: 'Finishing & Cure',
        inputMaterials: 'Wet Washed Trousers, 3D Resin',
        transformation: 'High-G centrifugal extraction, 3D wrinkle pinning, conveyor oven baking at 150°C',
        qualityGate: 'Formaldehyde free test (ZDHC MRSL), shape retention rating 4.0',
        standardTool: 'Centrifugal Extractor & Continuous Tunnel Oven',
        leadTimeHours: 14,
        responsibleRole: 'Finishing Supervisor',
        criticalGate: false,
        toleranceSpecs: 'Oven temperature 150°C ± 2°C',
      },
      {
        id: 'pfs-d-7',
        stepNumber: 7,
        stageName: '100% Needle Detection, Hangtag & Carton Packing',
        department: 'Final Finishing',
        inputMaterials: 'Cured Jeans, Leather Patches, Care Labels, Polybags',
        transformation: 'Thread trimming, pocket pouch inspection, 100% conveyor metal detector scan',
        qualityGate: '0.8mm Ferrous sphere detection, barcode UPC scan 100%',
        standardTool: 'Hashima Conveyor Needle Detector & Zebra Barcode Scanners',
        leadTimeHours: 8,
        responsibleRole: 'Final QC Manager',
        criticalGate: true,
        toleranceSpecs: '0.8mm Ferrous 100% pass',
      },
    ],
    totalLeadTimeHours: 110,
    criticalGatesCount: 4,
    tags: ['Denim', 'Dry Process', 'Wet Wash', 'Laser & Ozone'],
    notes: 'Requires daily calibration of laser exhaust and water consumption recycling logs.',
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-09-22T11:15:00Z',
  },
  {
    id: 'pfc-03',
    flowCode: 'PFC-ACT-03',
    title: 'Synthetic Activewear Seamless Construction Flow',
    productCategory: 'Activewear & Sportswear',
    department: 'Performance Apparel Unit',
    version: 'Rev 1.8',
    status: 'ACTIVE',
    author: 'Technical Sportswear Engineer',
    approvedBy: 'Head of Quality Assurance',
    effectiveDate: '2026-03-01',
    reviewDate: '2027-03-01',
    description:
      'High-performance compression tights and sports bra process flow featuring ultrasonic bonding, flatlock seam stitching, and moisture-wicking wicking testing.',
    steps: [
      {
        id: 'pfs-a-1',
        stepNumber: 1,
        stageName: 'Nylon/Spandex Fabric Inward & Recovery Test',
        department: 'Performance Lab',
        inputMaterials: 'Polyamide / Elastane 4-Way Stretch Rolls',
        transformation: 'Stretch & recovery elasticity testing, moisture management wicking rate test',
        qualityGate: 'Recovery > 94% after 30 mins elongation, wicking height > 100mm in 10 mins',
        standardTool: 'SDL Atlas Fabric Stretch Tester & Moisture Wicking Frame',
        leadTimeHours: 24,
        responsibleRole: 'Activewear Lab Specialist',
        criticalGate: true,
      },
      {
        id: 'pfs-a-2',
        stepNumber: 2,
        stageName: 'Laser Cutting & Ultrasonic Edge Welding',
        department: 'Clean Cutting Room',
        inputMaterials: 'Tensionless Relaxed High-Stretch Fabrics',
        transformation: 'Sealed-edge optical laser cutting to prevent fraying and curl',
        qualityGate: 'Edge melted bead uniformity, notch alignment',
        standardTool: 'Golden Laser Vision Scanner & Sonotrode Welder',
        leadTimeHours: 12,
        responsibleRole: 'Laser Operator',
        criticalGate: false,
      },
      {
        id: 'pfs-a-3',
        stepNumber: 3,
        stageName: '4-Needle 6-Thread Flatlock Assembly',
        department: 'Activewear Line',
        inputMaterials: 'Laser Panels, Textured Micro-Filament Threads',
        transformation: 'Chafe-free flatlock seam construction with differential feed tension control',
        qualityGate: 'Zero thread breakage under 80% seam stretch extension test',
        standardTool: 'Yamato FD-62 Dry-Head Flatlock Seamer',
        leadTimeHours: 10,
        responsibleRole: 'Flatlock Line Leader',
        criticalGate: true,
      },
      {
        id: 'pfs-a-4',
        stepNumber: 4,
        stageName: 'Silicone Grip & Reflective Heat Transfer',
        department: 'Bonding Station',
        inputMaterials: 'Stitched Garments, Reflective Logos, Silicone Leg Grippers',
        transformation: 'Pneumatic heat press transfer at 165°C under 4 bar pressure for 15s',
        qualityGate: 'Wash durability (5 washes at 40°C with zero edge lift)',
        standardTool: 'Siser TS-One Pneumatic Double Platen Heat Press',
        leadTimeHours: 6,
        responsibleRole: 'Bonding QC',
        criticalGate: false,
      },
      {
        id: 'pfs-a-5',
        stepNumber: 5,
        stageName: 'AQL 1.5 Performance Audit & Anti-Bacterial Pack',
        department: 'Clean Finishing',
        inputMaterials: 'Finished Compression Garments, Recycled Polybags',
        transformation: 'Full stretch dimensional audit, 100% metal scan, anti-static silica pouching',
        qualityGate: 'AQL 1.5 Major standard, zero needle fragments detected',
        standardTool: 'Conveyor Metal Detector & Digital Tension Calipers',
        leadTimeHours: 6,
        responsibleRole: 'Activewear QA Auditor',
        criticalGate: true,
      },
    ],
    totalLeadTimeHours: 58,
    criticalGatesCount: 3,
    tags: ['Activewear', 'Seamless', 'Laser Cut', 'Flatlock'],
    notes: 'Operates in cleanroom environment with climate-controlled humidity.',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-09-24T16:00:00Z',
  },
];
