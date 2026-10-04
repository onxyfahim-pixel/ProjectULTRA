import { CheckpointItem } from '@/lib/types/erp';

export interface InspectionCheckpointDef {
  id: string;
  category: string;
  checkpoint: string;
  description: string;
}

export const STANDARD_11_CHECKPOINTS: InspectionCheckpointDef[] = [
  {
    id: 'cp-workmanship',
    category: 'Workmanship',
    checkpoint: 'Workmanship',
    description: 'Stitch tension, seam alignment, needle holes, zero fabric puckering or skipped stitches.',
  },
  {
    id: 'cp-styling',
    category: 'Styling',
    checkpoint: 'Styling',
    description: 'Silhouette, proportions, aesthetics, collar shape, and pocket placements match approved style spec.',
  },
  {
    id: 'cp-safety-check',
    category: 'Safety',
    checkpoint: 'Safety Check',
    description: '100% Needle detection calibration passed, no sharp edges, button pull test >= 90N / 10s.',
  },
  {
    id: 'cp-carton-mark',
    category: 'Packaging',
    checkpoint: 'Cross Check Carton Mark',
    description: 'Master carton buyer PO#, destination port, gross/net weight, and dimensional markings verified.',
  },
  {
    id: 'cp-sticker-mark',
    category: 'Packaging & Labels',
    checkpoint: 'Sticker Mark',
    description: 'Polybag warning, size stickers, UPC/EAN scannable barcode stickers, and carton side marks verified.',
  },
  {
    id: 'cp-accessories',
    category: 'Trims & Materials',
    checkpoint: 'Accessories',
    description: 'Buttons, zippers, rivets, drawstrings, eyelets, main labels, wash care labels, and hangtags verified.',
  },
  {
    id: 'cp-bom',
    category: 'Specifications',
    checkpoint: 'BOM',
    description: 'Bill of Materials compliance, thread color match, interlining, and approved trim suppliers cross-checked.',
  },
  {
    id: 'cp-measurement',
    category: 'Size & Tolerance',
    checkpoint: 'Measurement',
    description: 'Key point-of-measure dimensions verified within buyer tolerance limits across sampled sizes.',
  },
  {
    id: 'cp-test-record',
    category: 'Lab & Quality',
    checkpoint: 'Test Record',
    description: 'Fabric color fastness, shrinkage test report, fabric weight (GSM), and seam strength test records approved.',
  },
  {
    id: 'cp-pp-sample',
    category: 'Sample Approval',
    checkpoint: 'PP Sample',
    description: 'Bulk production garments audited 1:1 against buyer-sealed Pre-Production (PP) golden approval sample.',
  },
  {
    id: 'cp-working-env',
    category: 'Environment',
    checkpoint: 'Working Environment',
    description: 'Workstation cleanliness, 5S floor hygiene, adequate lux lighting, and clean garment handling ensured.',
  },
];

export function getDefaultCheckpoints(): CheckpointItem[] {
  return STANDARD_11_CHECKPOINTS.map((def) => ({
    id: def.id,
    category: def.category,
    checkpoint: def.checkpoint,
    status: 'PASS',
    notes: '',
  }));
}

export function syncRecordCheckpoints(existing?: CheckpointItem[]): CheckpointItem[] {
  if (!existing || existing.length === 0) {
    return getDefaultCheckpoints();
  }

  // Map each standard checkpoint to its existing status if already recorded
  return STANDARD_11_CHECKPOINTS.map((def) => {
    const match = existing.find(
      (e) =>
        e.id === def.id ||
        e.checkpoint.toLowerCase() === def.checkpoint.toLowerCase() ||
        (def.checkpoint === 'Measurement' && (e.checkpoint.toLowerCase().includes('measurement') || e.category.toLowerCase().includes('measurement'))) ||
        (def.checkpoint === 'Workmanship' && (e.checkpoint.toLowerCase().includes('workmanship') || e.category.toLowerCase().includes('workmanship'))) ||
        (def.checkpoint === 'Safety Check' && (e.checkpoint.toLowerCase().includes('safety') || e.category.toLowerCase().includes('safety') || e.checkpoint.toLowerCase().includes('needle'))) ||
        (def.checkpoint === 'Cross Check Carton Mark' && (e.checkpoint.toLowerCase().includes('carton') || e.checkpoint.toLowerCase().includes('mark'))) ||
        (def.checkpoint === 'Sticker Mark' && (e.checkpoint.toLowerCase().includes('sticker') || e.checkpoint.toLowerCase().includes('barcode'))) ||
        (def.checkpoint === 'Accessories' && (e.checkpoint.toLowerCase().includes('accessories') || e.checkpoint.toLowerCase().includes('trim'))) ||
        (def.checkpoint === 'BOM' && e.checkpoint.toLowerCase().includes('bom')) ||
        (def.checkpoint === 'Test Record' && e.checkpoint.toLowerCase().includes('test')) ||
        (def.checkpoint === 'PP Sample' && (e.checkpoint.toLowerCase().includes('sample') || e.checkpoint.toLowerCase().includes('pp'))) ||
        (def.checkpoint === 'Working Environment' && (e.checkpoint.toLowerCase().includes('environment') || e.checkpoint.toLowerCase().includes('cleanliness')))
    );

    return {
      id: def.id,
      category: def.category,
      checkpoint: def.checkpoint,
      status: match ? match.status : 'PASS',
      notes: match?.notes || '',
    };
  });
}
