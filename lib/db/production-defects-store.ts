import { ProductionDefectItem } from '@/lib/types/production-management';

export const INITIAL_PRODUCTION_DEFECTS: ProductionDefectItem[] = [
  {
    id: 'def-01',
    code: 'DEF-SEW-001',
    name: 'Broken Stitch',
    category: 'Sewing',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Severed needle or looper thread stitch along garment seam line.',
    standardReworkTimeSec: 60,
  },
  {
    id: 'def-02',
    code: 'DEF-SEW-002',
    name: 'Skip Stitch',
    category: 'Sewing',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Missing interlacing of needle and bobbin thread over 1 or more stitches.',
    standardReworkTimeSec: 45,
  },
  {
    id: 'def-03',
    code: 'DEF-SEW-003',
    name: 'Puckering / Pleats',
    category: 'Sewing',
    severity: 'MINOR',
    isCommon: true,
    description: 'Gathered fabric ripples along seam caused by excessive thread tension or feed dog.',
    standardReworkTimeSec: 90,
  },
  {
    id: 'def-04',
    code: 'DEF-SEW-004',
    name: 'Open Seam / Run-off',
    category: 'Sewing',
    severity: 'CRITICAL',
    isCommon: true,
    description: 'Uncaught seam edge leaving a gap or opening in the garment assembly.',
    standardReworkTimeSec: 75,
  },
  {
    id: 'def-05',
    code: 'DEF-SEW-005',
    name: 'Raw Edge / Fraying',
    category: 'Sewing',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Unfinished fabric edge exposed outside overlock or hem stitch margins.',
    standardReworkTimeSec: 40,
  },
  {
    id: 'def-06',
    code: 'DEF-SEW-006',
    name: 'Uneven Hem / Collar',
    category: 'Sewing',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Asymmetry in bottom hem fold or collar point balance exceeding tolerance.',
    standardReworkTimeSec: 120,
  },
  {
    id: 'def-07',
    code: 'DEF-SEW-007',
    name: 'Wavy Seam / Twisted Stitch',
    category: 'Sewing',
    severity: 'MINOR',
    isCommon: true,
    description: 'Differential feeding causing roping or wave distortion along side seams.',
    standardReworkTimeSec: 50,
  },
  {
    id: 'def-08',
    code: 'DEF-SEW-008',
    name: 'High-Low Seam Alignment',
    category: 'Sewing',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Misaligned waistband, cross-seam, or yoke points between joined panels.',
    standardReworkTimeSec: 85,
  },
  {
    id: 'def-09',
    code: 'DEF-SEW-009',
    name: 'Slanted Pocket / Flap',
    category: 'Sewing',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Back patch pocket or front flap attached out of level by more than 1/8".',
    standardReworkTimeSec: 110,
  },
  {
    id: 'def-10',
    code: 'DEF-FAB-001',
    name: 'Oil / Dirt Stain',
    category: 'Fabric',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Lubricant droplet, sewing oil, or rust spot requiring spot cleaning treatment.',
    standardReworkTimeSec: 180,
  },
  {
    id: 'def-11',
    code: 'DEF-FAB-002',
    name: 'Needle Mark / Fabric Cut',
    category: 'Fabric',
    severity: 'CRITICAL',
    isCommon: true,
    description: 'Blunt needle puncture or hole damaging knit yarn structure.',
    standardReworkTimeSec: 15,
  },
  {
    id: 'def-12',
    code: 'DEF-FAB-003',
    name: 'Shade Variation',
    category: 'Fabric',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Color hue discrepancy between front, back, and sleeve panels within single garment.',
    standardReworkTimeSec: 30,
  },
  {
    id: 'def-13',
    code: 'DEF-FAB-004',
    name: 'Broken Needle Chip',
    category: 'Fabric',
    severity: 'CRITICAL',
    isCommon: true,
    description: 'Fragment of broken needle lodged in fabric; requires 100% metal detector protocol.',
    standardReworkTimeSec: 15,
  },
  {
    id: 'def-14',
    code: 'DEF-CUT-001',
    name: 'Measurement Out of Spec',
    category: 'Cutting',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Garment dimensions deviate from tech pack POM table beyond allowed tolerance.',
    standardReworkTimeSec: 60,
  },
  {
    id: 'def-15',
    code: 'DEF-CUT-002',
    name: 'Notch Cut Too Deep',
    category: 'Cutting',
    severity: 'MAJOR',
    isCommon: false,
    description: 'Alignment notch penetrates past seam allowance into the visible garment body.',
    standardReworkTimeSec: 45,
  },
  {
    id: 'def-16',
    code: 'DEF-FIN-001',
    name: 'Loose Thread Ends',
    category: 'Finishing',
    severity: 'MINOR',
    isCommon: true,
    description: 'Untrimmed thread tails exceeding 1/4 inch at bartack or seam junctions.',
    standardReworkTimeSec: 20,
  },
  {
    id: 'def-17',
    code: 'DEF-FIN-002',
    name: 'Uneven Pressing / Iron Shine',
    category: 'Finishing',
    severity: 'MINOR',
    isCommon: false,
    description: 'Glossy iron shine mark or pressure glaze across delicate polyester or viscose fabric.',
    standardReworkTimeSec: 60,
  },
  {
    id: 'def-18',
    code: 'DEF-TRM-001',
    name: 'Button / Trim Defect',
    category: 'Trims',
    severity: 'MAJOR',
    isCommon: true,
    description: 'Cracked, chipped, missing button, loose shank, or defective snap fastener.',
    standardReworkTimeSec: 90,
  },
  {
    id: 'def-19',
    code: 'DEF-TRM-002',
    name: 'Zipper Teeth Jammed / Stiff',
    category: 'Trims',
    severity: 'MAJOR',
    isCommon: false,
    description: 'Slider malfunction, crooked zipper stop, or missing teeth in fly assembly.',
    standardReworkTimeSec: 120,
  },
];

const STORAGE_KEY = 'erp_production_defects';

export function getProductionDefects(): ProductionDefectItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTION_DEFECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTION_DEFECTS));
      return INITIAL_PRODUCTION_DEFECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTION_DEFECTS;
  } catch (err) {
    console.error('Failed to load production defects from storage', err);
    return INITIAL_PRODUCTION_DEFECTS;
  }
}

export function getCommonProductionDefects(): ProductionDefectItem[] {
  return getProductionDefects().filter((d) => d.isCommon);
}

export function saveProductionDefects(defects: ProductionDefectItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defects));
    window.dispatchEvent(new Event('erp_production_defects_updated'));
  } catch (err) {
    console.error('Failed to save production defects to storage', err);
  }
}

export function addProductionDefect(
  defect: Omit<ProductionDefectItem, 'id' | 'code'> & { id?: string; code?: string }
): ProductionDefectItem {
  const current = getProductionDefects();
  const newDefect: ProductionDefectItem = {
    id: defect.id || `def-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    code: defect.code || `DEF-${defect.category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    name: defect.name.trim(),
    category: defect.category,
    severity: defect.severity,
    isCommon: defect.isCommon ?? true,
    description: defect.description?.trim() || '',
    standardReworkTimeSec: defect.standardReworkTimeSec || 60,
    department: defect.department || 'Production & Quality',
  };

  const updated = [newDefect, ...current];
  saveProductionDefects(updated);
  return newDefect;
}

export function updateProductionDefect(
  id: string,
  updates: Partial<ProductionDefectItem>
): ProductionDefectItem[] {
  const current = getProductionDefects();
  const next = current.map((d) => (d.id === id ? ({ ...d, ...updates } as ProductionDefectItem) : d));
  saveProductionDefects(next);
  return next;
}

export function deleteProductionDefect(id: string): ProductionDefectItem[] {
  const current = getProductionDefects();
  const next = current.filter((d) => d.id !== id);
  saveProductionDefects(next);
  return next;
}

export function toggleCommonProductionDefect(id: string): ProductionDefectItem[] {
  const current = getProductionDefects();
  const next = current.map((d) => (d.id === id ? { ...d, isCommon: !d.isCommon } : d));
  saveProductionDefects(next);
  return next;
}

export function resetProductionDefectsToDefault(): ProductionDefectItem[] {
  saveProductionDefects(INITIAL_PRODUCTION_DEFECTS);
  return INITIAL_PRODUCTION_DEFECTS;
}
