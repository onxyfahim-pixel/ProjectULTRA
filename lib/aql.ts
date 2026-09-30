/**
 * Standard ISO 2859-1 / ANSI/ASQ Z1.4 / MIL-STD-105E
 * General Inspection Level II - Normal Single Sampling Plans for Garments QMS
 */

export interface AqlSamplingTier {
  minLot: number;
  maxLot: number;
  codeLetter: string;
  sampleSize: number;
  // AQL 1.0 (Strict luxury / critical)
  aql10Ac: number;
  aql10Re: number;
  // AQL 1.5 (Strict garments standard)
  aql15Ac: number;
  aql15Re: number;
  // AQL 2.5 (Industry standard for Major defects)
  aql25Ac: number;
  aql25Re: number;
  // AQL 4.0 (Industry standard for Minor defects)
  aql40Ac: number;
  aql40Re: number;
}

export const AQL_SAMPLING_TABLE: AqlSamplingTier[] = [
  { minLot: 2, maxLot: 8, codeLetter: 'A', sampleSize: 2, aql10Ac: 0, aql10Re: 1, aql15Ac: 0, aql15Re: 1, aql25Ac: 0, aql25Re: 1, aql40Ac: 0, aql40Re: 1 },
  { minLot: 9, maxLot: 15, codeLetter: 'B', sampleSize: 3, aql10Ac: 0, aql10Re: 1, aql15Ac: 0, aql15Re: 1, aql25Ac: 0, aql25Re: 1, aql40Ac: 0, aql40Re: 1 },
  { minLot: 16, maxLot: 25, codeLetter: 'C', sampleSize: 5, aql10Ac: 0, aql10Re: 1, aql15Ac: 0, aql15Re: 1, aql25Ac: 0, aql25Re: 1, aql40Ac: 0, aql40Re: 1 },
  { minLot: 26, maxLot: 50, codeLetter: 'D', sampleSize: 8, aql10Ac: 0, aql10Re: 1, aql15Ac: 0, aql15Re: 1, aql25Ac: 0, aql25Re: 1, aql40Ac: 1, aql40Re: 2 },
  { minLot: 51, maxLot: 90, codeLetter: 'E', sampleSize: 13, aql10Ac: 0, aql10Re: 1, aql15Ac: 0, aql15Re: 1, aql25Ac: 1, aql25Re: 2, aql40Ac: 1, aql40Re: 2 },
  { minLot: 91, maxLot: 150, codeLetter: 'F', sampleSize: 20, aql10Ac: 0, aql10Re: 1, aql15Ac: 1, aql15Re: 2, aql25Ac: 1, aql25Re: 2, aql40Ac: 2, aql40Re: 3 },
  { minLot: 151, maxLot: 280, codeLetter: 'G', sampleSize: 32, aql10Ac: 1, aql10Re: 2, aql15Ac: 1, aql15Re: 2, aql25Ac: 2, aql25Re: 3, aql40Ac: 3, aql40Re: 4 },
  { minLot: 281, maxLot: 500, codeLetter: 'H', sampleSize: 50, aql10Ac: 1, aql10Re: 2, aql15Ac: 2, aql15Re: 3, aql25Ac: 3, aql25Re: 4, aql40Ac: 5, aql40Re: 6 },
  { minLot: 501, maxLot: 1200, codeLetter: 'J', sampleSize: 80, aql10Ac: 2, aql10Re: 3, aql15Ac: 3, aql15Re: 4, aql25Ac: 5, aql25Re: 6, aql40Ac: 7, aql40Re: 8 },
  { minLot: 1201, maxLot: 3200, codeLetter: 'K', sampleSize: 125, aql10Ac: 3, aql10Re: 4, aql15Ac: 5, aql15Re: 6, aql25Ac: 7, aql25Re: 8, aql40Ac: 10, aql40Re: 11 },
  { minLot: 3201, maxLot: 10000, codeLetter: 'L', sampleSize: 200, aql10Ac: 5, aql10Re: 6, aql15Ac: 7, aql15Re: 8, aql25Ac: 10, aql25Re: 11, aql40Ac: 14, aql40Re: 15 },
  { minLot: 10001, maxLot: 35000, codeLetter: 'M', sampleSize: 315, aql10Ac: 7, aql10Re: 8, aql15Ac: 10, aql15Re: 11, aql25Ac: 14, aql25Re: 15, aql40Ac: 21, aql40Re: 22 },
  { minLot: 35001, maxLot: 150000, codeLetter: 'N', sampleSize: 500, aql10Ac: 10, aql10Re: 11, aql15Ac: 14, aql15Re: 15, aql25Ac: 21, aql25Re: 22, aql40Ac: 21, aql40Re: 22 },
  { minLot: 150001, maxLot: 500000, codeLetter: 'P', sampleSize: 800, aql10Ac: 14, aql10Re: 15, aql15Ac: 21, aql15Re: 22, aql25Ac: 21, aql25Re: 22, aql40Ac: 21, aql40Re: 22 },
  { minLot: 500001, maxLot: Infinity, codeLetter: 'Q', sampleSize: 1250, aql10Ac: 21, aql10Re: 22, aql15Ac: 21, aql15Re: 22, aql25Ac: 21, aql25Re: 22, aql40Ac: 21, aql40Re: 22 },
];

export interface AqlCalculationResult {
  codeLetter: string;
  sampleSize: number;
  lotSize: number;
  criticalAc: number; // always 0 in garments
  criticalRe: number; // always 1
  majorAc: number;    // Ac: Maximum allowed major defects to PASS
  majorRe: number;    // Re: Rejection point (majorAc + 1)
  minorAc: number;    // Ac: Maximum allowed minor defects to PASS
  minorRe: number;    // Re: Rejection point (minorAc + 1)
  aqlStandardName: string;
}

/**
 * Calculates sample size and defect allowances according to ISO 2859-1 Level II.
 */
export function calculateAqlInspection(
  lotSize: number,
  majorAqlStandard: '1.0' | '1.5' | '2.5' | '4.0' = '2.5',
  minorAqlStandard: '2.5' | '4.0' = '4.0'
): AqlCalculationResult {
  const safeLot = Math.max(2, Number(lotSize) || 2);
  const tier =
    AQL_SAMPLING_TABLE.find((t) => safeLot >= t.minLot && safeLot <= t.maxLot) ||
    AQL_SAMPLING_TABLE[AQL_SAMPLING_TABLE.length - 1];

  let majorAc = tier.aql25Ac;
  let majorRe = tier.aql25Re;
  if (majorAqlStandard === '1.0') {
    majorAc = tier.aql10Ac;
    majorRe = tier.aql10Re;
  } else if (majorAqlStandard === '1.5') {
    majorAc = tier.aql15Ac;
    majorRe = tier.aql15Re;
  } else if (majorAqlStandard === '4.0') {
    majorAc = tier.aql40Ac;
    majorRe = tier.aql40Re;
  }

  let minorAc = tier.aql40Ac;
  let minorRe = tier.aql40Re;
  if (minorAqlStandard === '2.5') {
    minorAc = tier.aql25Ac;
    minorRe = tier.aql25Re;
  }

  return {
    codeLetter: tier.codeLetter,
    sampleSize: tier.sampleSize,
    lotSize: safeLot,
    criticalAc: 0,
    criticalRe: 1,
    majorAc,
    majorRe,
    minorAc,
    minorRe,
    aqlStandardName: `ISO 2859-1 (Level II) • Code ${tier.codeLetter}`,
  };
}

/**
 * Determines inspection verdict based on actual defects vs AQL allowance.
 */
export function evaluateAqlVerdict(
  criticalDefects: number,
  majorDefects: number,
  minorDefects: number,
  aql: AqlCalculationResult
): {
  verdict: 'PASSED' | 'CONDITIONAL_PASS' | 'REJECTED';
  reason: string;
} {
  if (criticalDefects > aql.criticalAc) {
    return {
      verdict: 'REJECTED',
      reason: `Rejected: Found ${criticalDefects} critical defect(s). Critical threshold is 0.`,
    };
  }

  if (majorDefects >= aql.majorRe) {
    return {
      verdict: 'REJECTED',
      reason: `Rejected: Major defects (${majorDefects}) exceeded rejection threshold of ${aql.majorRe} (Max Allowed: ${aql.majorAc}).`,
    };
  }

  if (minorDefects >= aql.minorRe) {
    return {
      verdict: 'REJECTED',
      reason: `Rejected: Minor defects (${minorDefects}) exceeded rejection threshold of ${aql.minorRe} (Max Allowed: ${aql.minorAc}).`,
    };
  }

  // If Major is at the exact limit, flag as conditional or tight pass
  if (majorDefects === aql.majorAc && aql.majorAc > 0) {
    return {
      verdict: 'CONDITIONAL_PASS',
      reason: `Conditional Pass: Major defects (${majorDefects}) reached maximum acceptance limit (${aql.majorAc}). 100% carton re-check recommended.`,
    };
  }

  return {
    verdict: 'PASSED',
    reason: `Passed: Major (${majorDefects} <= ${aql.majorAc}) and Minor (${minorDefects} <= ${aql.minorAc}) within AQL limits.`,
  };
}

export interface QuantityVarianceResult {
  orderQuantity: number;
  inspectionQuantity: number;
  diff: number;
  percentage: number;
  isExcess: boolean;
  isShort: boolean;
  isExact: boolean;
  excessQty: number;
  shortQty: number;
  label: string;
  badgeCls: string;
}

/**
 * Calculates excess and short quantities between total order quantity and inspected lot size.
 */
export function calculateQuantityVariance(
  orderQuantity: number,
  inspectionQuantity: number
): QuantityVarianceResult {
  const ord = Math.max(1, Number(orderQuantity) || 1);
  const insp = Math.max(0, Number(inspectionQuantity) || 0);
  const diff = insp - ord;
  const percentage = Number(((diff / ord) * 100).toFixed(2));

  const isExcess = diff > 0;
  const isShort = diff < 0;
  const isExact = diff === 0;

  const excessQty = isExcess ? diff : 0;
  const shortQty = isShort ? Math.abs(diff) : 0;

  let label = 'Exact Quantity Match (0 Variance)';
  let badgeCls = 'bg-slate-100 text-slate-700 border-slate-200';

  if (isExcess) {
    label = `Excess: +${excessQty.toLocaleString()} pcs (+${percentage}%)`;
    badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (isShort) {
    label = `Shortage: -${shortQty.toLocaleString()} pcs (${percentage}%)`;
    badgeCls = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return {
    orderQuantity: ord,
    inspectionQuantity: insp,
    diff,
    percentage,
    isExcess,
    isShort,
    isExact,
    excessQty,
    shortQty,
    label,
    badgeCls,
  };
}
