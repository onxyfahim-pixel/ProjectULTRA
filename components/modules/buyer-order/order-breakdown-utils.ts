import { OrderColorSizeBreakdown, OrderSizeRatio, BuyerOrder } from '@/lib/types/modules';

export const STANDARD_ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
export const EXTENDED_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
export const BOTTOMS_WAIST_SIZES = ['28', '30', '32', '34', '36', '38'];
export const KIDS_SIZES = ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'];
export const NUMERIC_SIZES = ['0', '2', '4', '6', '8', '10', '12'];

export interface SizePreset {
  id: string;
  name: string;
  sizes: string[];
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'tops', name: 'T-Shirt / Tops (XS - 2XL)', sizes: STANDARD_ADULT_SIZES },
  { id: 'extended', name: 'Extended Fit (XS - 4XL)', sizes: EXTENDED_SIZES },
  { id: 'bottoms', name: 'Denim / Pants (28 - 38)', sizes: BOTTOMS_WAIST_SIZES },
  { id: 'kids', name: 'Kids Wear (2Y - 12Y)', sizes: KIDS_SIZES },
  { id: 'numeric', name: 'Numeric (0 - 12)', sizes: NUMERIC_SIZES },
];

export const POPULAR_GARMENT_COLORS = [
  { name: 'Navy Blue', code: 'PANTONE 19-3923 TCX', hex: '#1e3a8a' },
  { name: 'Washed Black', code: 'PANTONE 19-4008 TCX', hex: '#1e293b' },
  { name: 'Optic White', code: 'PANTONE 11-0601 TCX', hex: '#f8fafc' },
  { name: 'Heather Grey', code: 'PANTONE 14-4102 TCX', hex: '#94a3b8' },
  { name: 'Olive Green', code: 'PANTONE 18-0527 TCX', hex: '#3f6212' },
  { name: 'Burgundy Red', code: 'PANTONE 19-1650 TCX', hex: '#881337' },
  { name: 'Sky Blue', code: 'PANTONE 14-4115 TCX', hex: '#0284c7' },
  { name: 'Khaki Beige', code: 'PANTONE 16-1109 TCX', hex: '#d97706' },
  { name: 'Charcoal Grey', code: 'PANTONE 18-0601 TCX', hex: '#475569' },
  { name: 'Indigo Denim', code: 'PANTONE 19-4027 TCX', hex: '#1e40af' },
];

/**
 * Extracts all unique sizes present across color breakdowns in order of appearance
 */
export function getAllUniqueSizes(breakdowns?: OrderColorSizeBreakdown[]): string[] {
  if (!breakdowns || breakdowns.length === 0) return STANDARD_ADULT_SIZES;
  const sizeSet = new Set<string>();
  breakdowns.forEach((b) => {
    (b.sizeBreakdown || []).forEach((s) => {
      if (s.size) sizeSet.add(s.size);
    });
  });
  const result = Array.from(sizeSet);
  return result.length > 0 ? result : STANDARD_ADULT_SIZES;
}

/**
 * Calculates total breakdown quantity
 */
export function calculateBreakdownTotal(breakdowns?: OrderColorSizeBreakdown[]): number {
  if (!breakdowns || breakdowns.length === 0) return 0;
  return breakdowns.reduce((sum, b) => {
    const colorTotal = (b.sizeBreakdown || []).reduce((cSum, s) => cSum + (Number(s.quantity) || 0), 0);
    return sum + colorTotal;
  }, 0);
}

/**
 * Calculates quantity per size across all colors
 */
export function calculateSizeTotals(
  breakdowns?: OrderColorSizeBreakdown[],
  sizes?: string[]
): Record<string, number> {
  const activeSizes = sizes || getAllUniqueSizes(breakdowns);
  const totals: Record<string, number> = {};
  activeSizes.forEach((s) => {
    totals[s] = 0;
  });

  if (!breakdowns) return totals;

  breakdowns.forEach((b) => {
    (b.sizeBreakdown || []).forEach((s) => {
      totals[s.size] = (totals[s.size] || 0) + (Number(s.quantity) || 0);
    });
  });

  return totals;
}

/**
 * Generates an intuitive, readable summary line for tables and exports
 * Example: "3 Colors: Navy Blue (15,000), Washed Black (15,000), Optic White (15,000) • Sizes: XS-2XL"
 */
export function formatBreakdownSummary(breakdowns?: OrderColorSizeBreakdown[]): string {
  if (!breakdowns || breakdowns.length === 0) return 'No Size/Color Breakdown';
  const colorCount = breakdowns.length;
  const sizes = getAllUniqueSizes(breakdowns);
  const sizeRange = sizes.length > 0 ? `${sizes[0]}-${sizes[sizes.length - 1]}` : 'N/A';
  const colorNames = breakdowns.map((b) => `${b.colorName} (${b.totalQuantity.toLocaleString()} pcs)`).join(', ');
  return `${colorCount} Color${colorCount === 1 ? '' : 's'}: ${colorNames} • Sizes: ${sizeRange}`;
}

/**
 * Generates sensible default color & size matrix for orders that lack one,
 * proportioned smoothly to match the order quantity.
 */
export function generateDefaultBreakdown(
  orderQty: number,
  styleDescription: string = 'Garments Style'
): OrderColorSizeBreakdown[] {
  const isDenim = styleDescription.toLowerCase().includes('denim') || styleDescription.toLowerCase().includes('jean');
  const isKids = styleDescription.toLowerCase().includes('kids') || styleDescription.toLowerCase().includes('child');

  const chosenSizes = isDenim
    ? BOTTOMS_WAIST_SIZES
    : isKids
    ? KIDS_SIZES
    : STANDARD_ADULT_SIZES;

  const defaultColors = isDenim
    ? [
        { name: 'Dark Indigo Raw', code: 'PANTONE 19-4027 TCX', hex: '#1e3a8a', ratio: 0.5 },
        { name: 'Medium Stonewash', code: 'PANTONE 18-4020 TCX', hex: '#2563eb', ratio: 0.3 },
        { name: 'Washed Black Denim', code: 'PANTONE 19-4008 TCX', hex: '#1e293b', ratio: 0.2 },
      ]
    : [
        { name: 'Navy Blue', code: 'PANTONE 19-3923 TCX', hex: '#1e3a8a', ratio: 0.4 },
        { name: 'Optic White', code: 'PANTONE 11-0601 TCX', hex: '#f8fafc', ratio: 0.35 },
        { name: 'Heather Grey', code: 'PANTONE 14-4102 TCX', hex: '#94a3b8', ratio: 0.25 },
      ];

  // Bell-curve-like size distribution weights (M, L usually higher)
  const sizeWeights: Record<string, number> = {
    XS: 1,
    S: 2,
    M: 3.5,
    L: 3.5,
    XL: 2,
    '2XL': 1,
    '28': 1.5,
    '30': 2.5,
    '32': 3.5,
    '34': 3.5,
    '36': 2,
    '38': 1,
    '2Y': 1.5,
    '4Y': 2.5,
    '6Y': 3,
    '8Y': 3,
    '10Y': 2,
    '12Y': 1.5,
  };

  const totalWeight = chosenSizes.reduce((w, s) => w + (sizeWeights[s] || 2), 0);

  let allocatedRunning = 0;
  const breakdowns: OrderColorSizeBreakdown[] = defaultColors.map((col, cIdx) => {
    const isLastColor = cIdx === defaultColors.length - 1;
    const colorTarget = isLastColor
      ? orderQty - allocatedRunning
      : Math.round(orderQty * col.ratio);

    allocatedRunning += colorTarget;

    let colorSizesRunning = 0;
    const sizeItems: OrderSizeRatio[] = chosenSizes.map((sz, sIdx) => {
      const isLastSize = sIdx === chosenSizes.length - 1;
      const weight = sizeWeights[sz] || 2;
      const szTarget = isLastSize
        ? colorTarget - colorSizesRunning
        : Math.round((colorTarget * weight) / totalWeight);

      colorSizesRunning += szTarget;
      return {
        size: sz,
        quantity: Math.max(0, szTarget),
      };
    });

    const totalQuantity = sizeItems.reduce((acc, s) => acc + s.quantity, 0);

    return {
      id: `csb-${cIdx + 1}-${Date.now()}`,
      colorName: col.name,
      colorCode: col.code,
      colorHex: col.hex,
      sizeBreakdown: sizeItems,
      totalQuantity,
    };
  });

  return breakdowns;
}

/**
 * Ensures an order has a valid colorSizeBreakdown array, falling back to defaults
 */
export function ensureColorSizeBreakdown(order: BuyerOrder): OrderColorSizeBreakdown[] {
  if (order.colorSizeBreakdown && order.colorSizeBreakdown.length > 0) {
    return order.colorSizeBreakdown;
  }
  return generateDefaultBreakdown(order.orderQuantity, order.styleDescription);
}
