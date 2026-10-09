import { InspectionSizeBreakdownItem } from '@/lib/types/erp';
import { BuyerOrder } from '@/lib/types/modules';

export const STANDARD_INSPECTION_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

/**
 * Proportional Hamilton / Largest Remainder algorithm for calculating sample pickups per size.
 * Guarantees that the sum of all samplePickupQuantity values matches totalSampleSize exactly.
 */
export function calculateSizeSamplePickups(
  sizes: InspectionSizeBreakdownItem[],
  totalSampleSize: number
): InspectionSizeBreakdownItem[] {
  if (!sizes || sizes.length === 0) return [];
  if (totalSampleSize <= 0) {
    return sizes.map((s) => ({ ...s, samplePickupQuantity: 0 }));
  }

  const totalInspected = sizes.reduce((sum, s) => sum + (Math.max(0, Number(s.inspectedQuantity)) || 0), 0);

  if (totalInspected === 0) {
    // Distribute evenly if all inspected quantities are 0
    const basePerSize = Math.floor(totalSampleSize / sizes.length);
    let remainder = totalSampleSize - basePerSize * sizes.length;
    return sizes.map((s, idx) => ({
      ...s,
      samplePickupQuantity: basePerSize + (idx < remainder ? 1 : 0),
    }));
  }

  // Calculate proportional shares with fractional remainder
  const computed = sizes.map((s, index) => {
    const inspected = Math.max(0, Number(s.inspectedQuantity)) || 0;
    const exact = (inspected / totalInspected) * totalSampleSize;
    const base = Math.floor(exact);
    const fraction = exact - base;
    return {
      index,
      base,
      fraction,
    };
  });

  const sumBase = computed.reduce((acc, c) => acc + c.base, 0);
  let remainder = Math.max(0, totalSampleSize - sumBase);

  // Distribute remaining units to items with largest fractional parts
  const sortedByFraction = [...computed].sort((a, b) => b.fraction - a.fraction);
  const extraAllocations = new Set<number>();
  for (let i = 0; i < remainder && i < sortedByFraction.length; i++) {
    extraAllocations.add(sortedByFraction[i].index);
  }

  return sizes.map((s, idx) => {
    const calc = computed.find((c) => c.index === idx);
    const bonus = extraAllocations.has(idx) ? 1 : 0;
    const finalPickup = (calc ? calc.base : 0) + bonus;
    return {
      ...s,
      samplePickupQuantity: finalPickup,
    };
  });
}

/**
 * Derive size breakdown items from a linked BuyerOrder or default distribution.
 */
export function deriveSizeBreakdownFromBuyerOrder(
  order?: BuyerOrder | null,
  fallbackLotQty = 10000,
  targetSampleSize = 315
): InspectionSizeBreakdownItem[] {
  // If order has colorSizeBreakdown populated, aggregate quantities by size
  if (order?.colorSizeBreakdown && order.colorSizeBreakdown.length > 0) {
    const sizeMap: Record<string, number> = {};

    for (const color of order.colorSizeBreakdown) {
      if (color.sizeBreakdown && color.sizeBreakdown.length > 0) {
        for (const sb of color.sizeBreakdown) {
          const sName = sb.size.trim();
          sizeMap[sName] = (sizeMap[sName] || 0) + (Number(sb.quantity) || 0);
        }
      }
    }

    const sizeKeys = Object.keys(sizeMap);
    if (sizeKeys.length > 0) {
      const items: InspectionSizeBreakdownItem[] = sizeKeys.map((sz, idx) => ({
        id: `sz-${idx + 1}-${sz.toLowerCase()}`,
        size: sz,
        orderQuantity: sizeMap[sz],
        inspectedQuantity: sizeMap[sz],
        samplePickupQuantity: 0,
        defectCount: 0,
        status: 'PASS',
      }));

      return calculateSizeSamplePickups(items, targetSampleSize);
    }
  }

  // Standard ratio curves (XS: 10%, S: 20%, M: 30%, L: 25%, XL: 10%, 2XL: 5%)
  const totalQty = order?.orderQuantity || fallbackLotQty || 10000;
  const ratioMap: Record<string, number> = {
    XS: 0.1,
    S: 0.2,
    M: 0.3,
    L: 0.25,
    XL: 0.1,
    '2XL': 0.05,
  };

  let allocated = 0;
  const items: InspectionSizeBreakdownItem[] = STANDARD_INSPECTION_SIZES.map((sz, idx) => {
    const ratio = ratioMap[sz] || 1 / STANDARD_INSPECTION_SIZES.length;
    let qty = Math.round(totalQty * ratio);
    if (idx === STANDARD_INSPECTION_SIZES.length - 1) {
      qty = Math.max(0, totalQty - allocated);
    } else {
      allocated += qty;
    }
    return {
      id: `sz-${idx + 1}-${sz.toLowerCase()}`,
      size: sz,
      orderQuantity: qty,
      inspectedQuantity: qty,
      samplePickupQuantity: 0,
      defectCount: 0,
      status: 'PASS',
    };
  });

  return calculateSizeSamplePickups(items, targetSampleSize);
}

/**
 * Summary calculations for size breakdown table
 */
export function summarizeInspectionSizeBreakdown(items?: InspectionSizeBreakdownItem[]) {
  if (!items || items.length === 0) {
    return {
      totalOrderQuantity: 0,
      totalInspectedQuantity: 0,
      totalSamplePickup: 0,
      totalDefects: 0,
      variance: 0,
      isPlus: false,
      isShort: false,
      variancePercent: 0,
      sizeCount: 0,
    };
  }

  const totalOrderQuantity = items.reduce((s, i) => s + (Number(i.orderQuantity) || 0), 0);
  const totalInspectedQuantity = items.reduce((s, i) => s + (Number(i.inspectedQuantity) || 0), 0);
  const totalSamplePickup = items.reduce((s, i) => s + (Number(i.samplePickupQuantity) || 0), 0);
  const totalDefects = items.reduce((s, i) => s + (Number(i.defectCount) || 0), 0);
  const variance = totalInspectedQuantity - totalOrderQuantity;
  const isPlus = variance > 0;
  const isShort = variance < 0;
  const variancePercent = totalOrderQuantity > 0 ? (variance / totalOrderQuantity) * 100 : 0;

  return {
    totalOrderQuantity,
    totalInspectedQuantity,
    totalSamplePickup,
    totalDefects,
    variance,
    isPlus,
    isShort,
    variancePercent,
    sizeCount: items.length,
  };
}
