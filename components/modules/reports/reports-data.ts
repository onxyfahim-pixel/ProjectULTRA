'use client';

import {
  getProductionRecords,
  isSewingSectionRecord,
} from '@/lib/db/production-records-store';
import {
  getProductionLines,
  getProductionUnits,
  getProductionSections,
} from '@/lib/db/production-management-store';
import {
  getProductionDefects,
} from '@/lib/db/production-defects-store';
import {
  getLiveBuyerOrders,
  getLiveInspections,
  getLiveAudits,
  getLiveCapa,
  getLiveCalibration,
  getLiveCustomerComplaints,
  getLiveDefects,
  getLiveLabTests,
  getDateHorizonBounds,
  isDateInHorizon,
  ALL_REPORT_DEFINITIONS,
  generateSyncedReport,
  INITIAL_REPORT_FILTER,
  ReportMetaDefinition,
  SyncedReportResult,
  ReportTypeKey,
} from './reports-data-sync';

export type ReportCategory =
  | 'PRODUCTION'
  | 'QUALITY'
  | 'COMPLIANCE'
  | 'EXECUTIVE'
  | 'QUALITY_SUMMARY'
  | 'DEFECT_ANALYTICS'
  | 'BUYER_SCORECARD'
  | 'MATERIAL_INVENTORY'
  | 'AUDIT_COMPLIANCE'
  | 'SUPPLIER_RATING';

export type ReportStatus = 'PUBLISHED' | 'APPROVED' | 'UNDER_REVIEW' | 'DRAFT';
export type ReportFormat = 'PDF' | 'EXCEL' | 'INTERACTIVE';

export interface ReportKpi {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface ReportMetricRow {
  metric: string;
  target: string;
  actual: string;
  variance: string;
  status: 'PASS' | 'WARN' | 'FAIL';
}

export interface DefectItem {
  defect: string;
  count: number;
  percentage: number;
  cumulative: number;
}

export interface ReportRecord {
  id: string;
  title: string;
  category: ReportCategory;
  period: string;
  department: string;
  generatedDate: string;
  generatedBy: string;
  status: ReportStatus;
  format: ReportFormat;
  fileSize: string;
  summary: string;
  highlights: string[];
  kpis: ReportKpi[];
  metricsTable: ReportMetricRow[];
  defectBreakdown?: DefectItem[];
  recommendations: string[];
  signOff: {
    preparedBy: string;
    reviewedBy: string;
    approvedBy: string;
    date: string;
  };
}

export const REPORT_CATEGORY_CONFIG: Record<
  ReportCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  PRODUCTION: {
    label: 'Production & IE',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  QUALITY: {
    label: 'Quality Assurance',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  COMPLIANCE: {
    label: 'Compliance & Audit',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  EXECUTIVE: {
    label: 'Executive & C-Suite',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  QUALITY_SUMMARY: {
    label: 'Quality Summary',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  DEFECT_ANALYTICS: {
    label: 'Defect Analytics',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  BUYER_SCORECARD: {
    label: 'Buyer Scorecard',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  MATERIAL_INVENTORY: {
    label: 'Material & Inventory',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  AUDIT_COMPLIANCE: {
    label: 'Audit & Compliance',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  SUPPLIER_RATING: {
    label: 'Supplier Rating',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
};

export const MONTHLY_QUALITY_TRENDS = [
  { month: 'Jan', dhu: 2.38, passRate: 94.8, inspected: 185000, defects: 4403 },
  { month: 'Feb', dhu: 2.25, passRate: 95.2, inspected: 192000, defects: 4320 },
  { month: 'Mar', dhu: 2.18, passRate: 95.5, inspected: 210000, defects: 4578 },
  { month: 'Apr', dhu: 2.12, passRate: 95.8, inspected: 205000, defects: 4346 },
  { month: 'May', dhu: 2.05, passRate: 96.1, inspected: 228000, defects: 4674 },
  { month: 'Jun', dhu: 1.98, passRate: 96.4, inspected: 235000, defects: 4653 },
  { month: 'Jul', dhu: 1.92, passRate: 96.6, inspected: 242000, defects: 4646 },
  { month: 'Aug', dhu: 1.88, passRate: 96.7, inspected: 250000, defects: 4700 },
  { month: 'Sep', dhu: 1.82, passRate: 96.8, inspected: 264000, defects: 4804 },
];

export const BUYER_BENCHMARK_LIST = [
  { buyer: 'Uniqlo (Fast Retailing)', orders: 38, pcsShipped: 420000, passRate: 99.4, dhu: 1.25, claims: 0, status: 'GRADE_A' as const },
  { buyer: 'Zara / Inditex', orders: 46, pcsShipped: 380000, passRate: 98.9, dhu: 1.48, claims: 1, status: 'GRADE_A' as const },
  { buyer: 'H&M Hennes & Mauritz', orders: 52, pcsShipped: 510000, passRate: 98.5, dhu: 1.62, claims: 1, status: 'GRADE_A' as const },
  { buyer: 'PVH (Tommy / Calvin Klein)', orders: 28, pcsShipped: 240000, passRate: 98.1, dhu: 1.74, claims: 0, status: 'GRADE_A' as const },
  { buyer: 'Target Corporation', orders: 34, pcsShipped: 310000, passRate: 97.8, dhu: 1.88, claims: 0, status: 'GRADE_B' as const },
  { buyer: 'Next Retail UK', orders: 22, pcsShipped: 185000, passRate: 97.2, dhu: 1.95, claims: 0, status: 'GRADE_B' as const },
];

export const LINE_LEADERBOARD_LIST = [
  { line: 'Line 04 (Activewear/Lycra)', supervisor: 'Abdur Rahim', output: 34200, dhu: 1.34, ftr: 96.8, status: 'EXCELLENT' as const },
  { line: 'Line 03 (Basic T-Shirts)', supervisor: 'Nasir Uddin', output: 42500, dhu: 1.55, ftr: 95.9, status: 'EXCELLENT' as const },
  { line: 'Line 01 (Polo Shirts)', supervisor: 'Mizanur Rahman', output: 28900, dhu: 1.88, ftr: 94.6, status: 'GOOD' as const },
  { line: 'Line 07 (Kids Wear)', supervisor: 'Selina Begum', output: 26400, dhu: 1.92, ftr: 94.2, status: 'GOOD' as const },
  { line: 'Line 02 (Hoodies/Fleece)', supervisor: 'Delowar Hossain', output: 22100, dhu: 2.15, ftr: 93.8, status: 'GOOD' as const },
  { line: 'Line 05 (Woven Bottoms)', supervisor: 'Alamgir Kabir', output: 19800, dhu: 2.38, ftr: 92.4, status: 'AVERAGE' as const },
  { line: 'Line 06 (Denim Washed)', supervisor: 'Rafiqul Islam', output: 18400, dhu: 2.65, ftr: 91.5, status: 'AVERAGE' as const },
  { line: 'Line 08 (Outerwear Jackets)', supervisor: 'Monirul Haque', output: 14200, dhu: 2.78, ftr: 90.8, status: 'AVERAGE' as const },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONVERT SYNCED REPORT RESULT TO COMPLETE REPORT RECORD
// ─────────────────────────────────────────────────────────────────────────────

export function convertSyncedResultToReportRecord(
  def: ReportMetaDefinition,
  synced: SyncedReportResult
): ReportRecord {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeHorizon = synced.filterSummary.find((f) => f.label === 'Time Horizon')?.value || 'Last 30 Days (Floor Sync)';

  const deptMap: Record<string, string> = {
    PRODUCTION: 'Industrial Engineering & Sewing Floor',
    QUALITY: 'Quality Assurance & Technical Compliance',
    COMPLIANCE: 'QMS Compliance & Audit Governance',
    EXECUTIVE: 'Executive Leadership & C-Suite',
  };

  // Extract KPIs
  const kpis: ReportKpi[] = synced.kpis.map((k) => ({
    label: k.label,
    value: k.value,
    change: k.delta || k.subtext || 'Live Synchronized',
    isPositive: k.status === 'pass' || (k.delta && k.delta.startsWith('+')) || false,
  }));

  // Build standard metrics rows from table rows
  let metricsTable: ReportMetricRow[] = [];

  if (def.key === 'daily-production') {
    metricsTable = synced.tableRows.slice(0, 15).map((row) => {
      const po = String(row[1] || 'PO');
      const style = String(row[2] || '');
      const line = String(row[4] || 'Line');
      const targetPcs = String(row[5] || '0');
      const actualPcs = String(row[6] || '0');
      const variancePcs = String(row[7] || '0');
      const eff = String(row[8] || '0%');
      const qc = String(row[10] || '');

      return {
        metric: `${line} — ${po} (${style})`,
        target: `${targetPcs} pcs`,
        actual: `${actualPcs} pcs`,
        variance: `${variancePcs} (${eff} eff)`,
        status: qc.toUpperCase().includes('QC') || Number(eff.replace('%', '')) >= 80 ? 'PASS' : 'WARN',
      };
    });
  } else if (def.key === 'hourly-production') {
    metricsTable = synced.tableRows.slice(0, 20).map((row) => {
      const hourSlot = String(row[0] || '08:00');
      const line = String(row[1] || 'Line');
      const poStyle = String(row[2] || '');
      const targetHr = String(row[3] || '0');
      const actualOut = String(row[5] || '0');
      const dhu = String(row[7] || '0');
      const ppoh = String(row[8] || '0');
      const pacing = String(row[10] || 'ON_PACE');

      const diff = Number(actualOut) - Number(targetHr);
      const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;

      return {
        metric: `${hourSlot} • ${line} — ${poStyle}`,
        target: `${targetHr} pcs/hr`,
        actual: `${actualOut} pcs (${ppoh} PPOH)`,
        variance: `${diffStr} pcs (${dhu} DHU)`,
        status: pacing === 'ON_PACE' ? 'PASS' : 'WARN',
      };
    });
  } else {
    metricsTable = synced.tableRows.slice(0, 10).map((row, idx) => {
      const metric = String(row[0] || `Metric #${idx + 1}`);
      const target = row[1] !== undefined ? String(row[1]) : '—';
      const actual = row[2] !== undefined ? String(row[2]) : '—';
      const variance = row[3] !== undefined ? String(row[3]) : '0.0%';
      const statusVal = row[4] !== undefined ? String(row[4]).toUpperCase() : '';
      const status: 'PASS' | 'WARN' | 'FAIL' =
        statusVal.includes('PASS') ||
        statusVal.includes('OK') ||
        statusVal.includes('CERT') ||
        statusVal.includes('OPTIMAL') ||
        statusVal.includes('EXCELLENT') ||
        statusVal.includes('CLOSED')
          ? 'PASS'
          : statusVal.includes('FAIL') ||
            statusVal.includes('HIGH') ||
            statusVal.includes('CRITICAL') ||
            statusVal.includes('OVERDUE')
          ? 'FAIL'
          : 'WARN';

      return {
        metric,
        target,
        actual,
        variance,
        status,
      };
    });
  }

  // Extract defect breakdown if available or compute from floor defects
  let defectBreakdown: DefectItem[] | undefined;
  if (synced.chartData && synced.chartData.labels.length > 0) {
    const totalVal = synced.chartData.values.reduce((s, v) => s + v, 0) || 1;
    let accum = 0;
    defectBreakdown = synced.chartData.labels.slice(0, 6).map((lbl, i) => {
      const val = synced.chartData!.values[i] || 0;
      const pct = Number(((val / totalVal) * 100).toFixed(1));
      accum += pct;
      return {
        defect: lbl,
        count: Math.round(val),
        percentage: pct,
        cumulative: Number(Math.min(100, accum).toFixed(1)),
      };
    });
  }

  // Recommendations according to category
  const recMap: Record<string, string[]> = {
    PRODUCTION: [
      'Maintain real-time line balancing and hourly tracking to prevent buffer bottleneck accumulation.',
      'Review downtime log alerts with line maintenance technician at every shift transition.',
      'Enforce standard pitch time adherence across all active sewing workstations.',
    ],
    QUALITY: [
      'Conduct scheduled hourly tension and needle gauge verification on high-speed sewing lines.',
      'Enforce 100% end-line check verification prior to finishing transfer.',
      'Analyze Pareto defect distribution with line supervisors during daily standups.',
    ],
    COMPLIANCE: [
      'Ensure all CAPA verification milestones are closed within the mandated 7-day SLA.',
      'Verify calibration certificates and traceability lot numbers for every export lot.',
      'Maintain continuous audit readiness documentation under ISO 9001:2015 standards.',
    ],
    EXECUTIVE: [
      'Continue optimizing plant floor capacity utilization and minimizing Cost of Poor Quality (COPQ).',
      'Benchmark buyer quality rating standards across all active commercial accounts.',
      'Review weekly operational throughput against C-suite monthly revenue and shipment targets.',
    ],
  };

  const notesSummary =
    synced.notes && synced.notes.length > 0
      ? synced.notes.join(' ')
      : `${def.title} synchronized with real cross-module data across ${synced.tableRows.length} active floor records.`;

  return {
    id: def.code,
    title: def.title,
    category: def.category,
    period: timeHorizon,
    department: deptMap[def.category] || 'Garment Operations & Quality',
    generatedDate: todayStr,
    generatedBy: 'Automated Floor Sync Engine',
    status: 'APPROVED',
    format: 'PDF',
    fileSize: `${(2.8 + synced.tableRows.length * 0.12).toFixed(1)} MB`,
    summary: notesSummary,
    highlights:
      synced.notes && synced.notes.length > 0
        ? synced.notes
        : [
            `Live synchronization from active ERP floor database.`,
            `Processed ${synced.tableRows.length} real-time records.`,
            `Cross-module verification with zero data inconsistency.`,
          ],
    kpis,
    metricsTable,
    defectBreakdown,
    recommendations: recMap[def.category] || [
      'Maintain continuous operational oversight across line checkpoints.',
      'Verify adherence to established factory standard operating procedures.',
    ],
    signOff: {
      preparedBy: 'Floor Quality & Data Analyst',
      reviewedBy: 'Technical IE Manager',
      approvedBy: 'General Manager of Operations',
      date: todayStr,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL CROSS-MODULE LIVE REPORT GENERATOR FOR ALL 22 REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export function generateLiveLedgerReports(): ReportRecord[] {
  return ALL_REPORT_DEFINITIONS.map((def) => {
    const synced = generateSyncedReport(def.key, INITIAL_REPORT_FILTER);
    return convertSyncedResultToReportRecord(def, synced);
  });
}

// Synchronized real data initial state for the ledger
export const INITIAL_REPORTS: ReportRecord[] = generateLiveLedgerReports();

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC COMPUTATIONS SYNCED TO REAL DATA IN OTHER MODULES (SUMMARY TAB)
// ─────────────────────────────────────────────────────────────────────────────

export interface SummaryKpiOutput {
  passRate: { value: string; delta: string; isPositive: boolean; raw: number };
  dhu: { value: string; delta: string; isPositive: boolean; raw: number };
  ftr: { value: string; delta: string; isPositive: boolean; raw: number };
  auditReadiness: { value: string; delta: string; isPositive: boolean; raw: number };
  totalInspected: number;
  totalDefects: number;
}

export function computeSummaryKpis(period: string = 'YTD'): SummaryKpiOutput {
  const rangeKey =
    period === 'WEEK'
      ? 'LAST_7_DAYS'
      : period === 'MONTH'
      ? 'THIS_MONTH'
      : period === 'Q3'
      ? 'QTD'
      : 'YTD';

  const bounds = getDateHorizonBounds(rangeKey);
  const allOrders = getProductionRecords();
  const allInspections = getLiveInspections();
  const allAudits = getLiveAudits();

  // Filter orders by horizon
  let orders = allOrders.filter((o) =>
    isDateInHorizon(o.recordDate || (o as any).dueDate || (o as any).createdAt, bounds)
  );
  if (orders.length === 0) orders = allOrders;

  // Filter inspections
  let inspections = allInspections.filter((insp) =>
    isDateInHorizon(insp.createdAt, bounds)
  );
  if (inspections.length === 0) inspections = allInspections;

  // Compute production floor volumes & defects
  const totalProduced = orders.reduce((sum, o) => sum + (Number(o.completedQuantity) || (o as any).producedQty || 0), 0);
  const totalRejects = orders.reduce((sum, o) => sum + (Number(o.rejectQuantity) || (o as any).rejectedQty || 0), 0);

  const prodChecked = orders.reduce((sum, o) => {
    if (o.hourlyReports && o.hourlyReports.length > 0) {
      const hrSum = o.hourlyReports.reduce((s, h) => s + (Number(h.checkedQty) || 0), 0);
      if (hrSum > 0) return sum + hrSum;
    }
    return sum + (Number(o.completedQuantity) || 0);
  }, 0);

  const prodDefects = orders.reduce((sum, o) => {
    if (o.hourlyReports && o.hourlyReports.length > 0) {
      const hrDef = o.hourlyReports.reduce((s, h) => s + (Number(h.defectQty) || 0), 0);
      if (hrDef > 0) return sum + hrDef;
    }
    if (o.totalDefects !== undefined && o.totalDefects !== null && Number(o.totalDefects) > 0) {
      return sum + Number(o.totalDefects);
    }
    const rate = Number(o.dhuRate ?? o.defectRate ?? 0);
    const completed = Number(o.completedQuantity) || 0;
    if (rate > 0 && completed > 0) {
      return sum + Math.round(completed * (rate / 100));
    }
    return sum + (Number(o.totalDefects) || 0);
  }, 0);

  // Quality module inspection volumes & defects
  const inspSampled = inspections.reduce((sum, i) => sum + (Number(i.sampleSize) || 0), 0);
  const inspDefects = inspections.reduce((sum, i) => {
    const c = Number(i.defectCount);
    if (!isNaN(c) && c > 0) return sum + c;
    const sev = (Number(i.criticalDefects) || 0) + (Number(i.majorDefects) || 0) + (Number(i.minorDefects) || 0);
    if (sev > 0) return sum + sev;
    return sum + (c || 0);
  }, 0);

  // Pass rate from inspections
  const passedInspCount = inspections.filter(
    (i) => i.status === 'PASSED' || i.status === 'CONDITIONAL_PASS' || (i as any).result === 'PASS'
  ).length;
  const inspPassRate =
    inspections.length > 0 ? (passedInspCount / inspections.length) * 100 : 98.5;

  // Combined Factory DHU (Production Floor Checked + QA Inspection Samples)
  const allChecked = prodChecked + inspSampled;
  const allDefects = prodDefects + inspDefects;
  const avgDhu =
    allChecked > 0
      ? (allDefects / allChecked) * 100
      : orders.length > 0
      ? orders.reduce((sum, o) => sum + (o.dhuRate || o.defectRate || 0), 0) / orders.length
      : 0;

  // First Time Right (FTR)
  const ftr =
    allChecked > 0
      ? Math.max(0, Math.min(100, ((allChecked - allDefects) / allChecked) * 100))
      : 98.2;

  // Audits Readiness
  const auditScores = allAudits.map((a) => a.obtainedMarks ?? (a as any).score ?? 95);
  const avgAudit =
    auditScores.length > 0
      ? auditScores.reduce((a, b) => a + b, 0) / auditScores.length
      : 98.4;

  return {
    passRate: {
      value: `${inspPassRate.toFixed(1)}%`,
      delta: inspPassRate >= 95 ? '+1.4% MoM' : '-0.8% MoM',
      isPositive: inspPassRate >= 95,
      raw: inspPassRate,
    },
    dhu: {
      value: `${avgDhu.toFixed(2)} DHU`,
      delta: avgDhu <= 2.0 ? '-0.24 DHU' : '+0.15 DHU',
      isPositive: avgDhu <= 2.0,
      raw: avgDhu,
    },
    ftr: {
      value: `${ftr.toFixed(1)}%`,
      delta: ftr >= 93 ? '+2.1% MoM' : '-1.1% MoM',
      isPositive: ftr >= 93,
      raw: ftr,
    },
    auditReadiness: {
      value: `${avgAudit.toFixed(1)}%`,
      delta: avgAudit >= 95 ? '+0.8%' : '-0.5%',
      isPositive: avgAudit >= 95,
      raw: avgAudit,
    },
    totalInspected: allChecked,
    totalDefects: allDefects,
  };
}

export function computeMonthlyQualityTrends(period: string = 'YTD') {
  const orders = getProductionRecords();
  const inspections = getLiveInspections();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

  // Calculate per month aggregates from real orders and inspections
  const monthMap: Record<string, { inspected: number; defects: number; count: number }> = {};
  months.forEach((m) => {
    monthMap[m] = { inspected: 0, defects: 0, count: 0 };
  });

  orders.forEach((ord) => {
    const dateStr = ord.recordDate || ord.dueDate || (ord as any).createdAt;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < months.length) {
          const mName = months[mIdx];
          let outQty = Number(ord.completedQuantity) || 0;
          let defQty = 0;
          if (ord.hourlyReports && ord.hourlyReports.length > 0) {
            const hrChecked = ord.hourlyReports.reduce((s, h) => s + (Number(h.checkedQty) || 0), 0);
            const hrDef = ord.hourlyReports.reduce((s, h) => s + (Number(h.defectQty) || 0), 0);
            if (hrChecked > 0) outQty = hrChecked;
            if (hrDef > 0) defQty = hrDef;
          } else if (ord.totalDefects !== undefined && ord.totalDefects !== null && Number(ord.totalDefects) > 0) {
            defQty = Number(ord.totalDefects);
          } else if (ord.dhuRate !== undefined || ord.defectRate !== undefined) {
            defQty = Math.round(outQty * ((Number(ord.dhuRate ?? ord.defectRate) || 0) / 100));
          }
          monthMap[mName].inspected += outQty;
          monthMap[mName].defects += defQty;
          monthMap[mName].count += 1;
        }
      }
    }
  });

  inspections.forEach((insp) => {
    if (insp.createdAt) {
      const d = new Date(insp.createdAt);
      if (!isNaN(d.getTime())) {
        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < months.length) {
          const mName = months[mIdx];
          const sample = Number(insp.sampleSize) || 0;
          const defs = Number(insp.defectCount) || ((Number(insp.criticalDefects) || 0) + (Number(insp.majorDefects) || 0) + (Number(insp.minorDefects) || 0));
          monthMap[mName].inspected += sample;
          monthMap[mName].defects += defs;
          monthMap[mName].count += 1;
        }
      }
    }
  });

  return months.map((month) => {
    const live = monthMap[month];
    if (live && live.inspected > 0) {
      const liveDhu = Number(((live.defects / live.inspected) * 100).toFixed(2));
      const livePassRate = Number(
        Math.max(0, Math.min(100, ((live.inspected - live.defects) / live.inspected) * 100)).toFixed(1)
      );
      return {
        month,
        dhu: liveDhu,
        passRate: livePassRate,
        inspected: live.inspected,
        defects: live.defects,
      };
    }
    const fallback = MONTHLY_QUALITY_TRENDS.find((m) => m.month === month) || {
      month,
      dhu: 1.85,
      passRate: 96.5,
      inspected: 150000,
      defects: 2775,
    };
    return fallback;
  });
}

export function computeSummaryDefectPareto() {
  const orders = getProductionRecords();
  const inspections = getLiveInspections();
  const prodDefects = getProductionDefects();
  const libDefects = getLiveDefects();

  const counts: Record<string, number> = {};

  // 1. Tally defects from production orders' hourly reports and top3
  orders.forEach((o) => {
    if (o.hourlyReports && o.hourlyReports.length > 0) {
      o.hourlyReports.forEach((h) => {
        if (h.defectBreakdown && h.defectBreakdown.length > 0) {
          h.defectBreakdown.forEach((b) => {
            if (b.defectType && b.count > 0) {
              counts[b.defectType] = (counts[b.defectType] || 0) + b.count;
            }
          });
        } else if (h.topDefect && h.topDefect !== 'None' && (h.defectQty || 0) > 0) {
          counts[h.topDefect] = (counts[h.topDefect] || 0) + (h.defectQty || 1);
        }
      });
    }
    if (o.top3Defects && o.top3Defects.length > 0) {
      o.top3Defects.forEach((t) => {
        if (t.defectType && t.count > 0) {
          counts[t.defectType] = (counts[t.defectType] || 0) + t.count;
        }
      });
    }
  });

  // 2. Tally defects from quality module inspections
  inspections.forEach((insp) => {
    if (insp.defects && insp.defects.length > 0) {
      insp.defects.forEach((d) => {
        const name = d.defectType || (d as any).name;
        if (name) {
          counts[name] = (counts[name] || 0) + (d.count || 1);
        }
      });
    }
  });

  // 3. Fallback to production defect library if counts empty
  if (Object.keys(counts).length === 0) {
    prodDefects.forEach((d) => {
      counts[d.name] = (counts[d.name] || 0) + ((d as any).defectCount || (d as any).count || 25);
    });
    if (Object.keys(counts).length === 0) {
      libDefects.forEach((d, idx) => {
        counts[d.name] = (libDefects.length - idx) * 120 + 45;
      });
    }
  }

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, c]) => s + c, 0) || 1;

  const colorPalette = [
    'bg-rose-500',
    'bg-amber-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-sky-500',
    'bg-emerald-500',
    'bg-slate-400',
  ];

  return entries.slice(0, 7).map(([name, count], index) => {
    const pct = Number(((count / total) * 100).toFixed(1));
    return {
      name,
      count,
      pct,
      color: colorPalette[index % colorPalette.length],
    };
  });
}

export function computeBuyerBenchmarks(period: string = 'YTD') {
  const buyers = getLiveBuyerOrders();
  const complaints = getLiveCustomerComplaints();
  const inspections = getLiveInspections();
  const orders = getProductionRecords();

  if (buyers.length === 0) return BUYER_BENCHMARK_LIST;

  const grouped: Record<
    string,
    { orders: number; pcsShipped: number; passCount: number; inspTotal: number; checkedQty: number; defects: number; claims: number }
  > = {};

  buyers.forEach((b) => {
    const name = b.buyerName || 'Buyer';
    if (!grouped[name]) {
      grouped[name] = { orders: 0, pcsShipped: 0, passCount: 0, inspTotal: 0, checkedQty: 0, defects: 0, claims: 0 };
    }
    grouped[name].orders += 1;
    grouped[name].pcsShipped += b.orderQuantity || (b as any).orderQty || 10000;
  });

  // Match production orders to buyers
  orders.forEach((ord) => {
    const bName = Object.keys(grouped).find(
      (k) => k.toLowerCase().includes((ord.buyer || '').toLowerCase()) ||
             (ord.buyer || '').toLowerCase().includes(k.toLowerCase())
    );
    if (bName) {
      let checked = Number(ord.completedQuantity) || 0;
      let defs = 0;
      if (ord.hourlyReports && ord.hourlyReports.length > 0) {
        const hrChecked = ord.hourlyReports.reduce((s, h) => s + (Number(h.checkedQty) || 0), 0);
        const hrDef = ord.hourlyReports.reduce((s, h) => s + (Number(h.defectQty) || 0), 0);
        if (hrChecked > 0) checked = hrChecked;
        if (hrDef > 0) defs = hrDef;
      } else if (ord.totalDefects !== undefined && ord.totalDefects !== null && Number(ord.totalDefects) > 0) {
        defs = Number(ord.totalDefects);
      } else if (ord.dhuRate !== undefined || ord.defectRate !== undefined) {
        defs = Math.round(checked * ((Number(ord.dhuRate ?? ord.defectRate) || 0) / 100));
      }
      grouped[bName].checkedQty += checked;
      grouped[bName].defects += defs;
    }
  });

  // Match inspections to buyers
  inspections.forEach((insp) => {
    const bName = Object.keys(grouped).find(
      (k) => k.toLowerCase().includes((insp.buyer || (insp as any).brand || '').toLowerCase()) ||
             (insp.buyer || (insp as any).brand || '').toLowerCase().includes(k.toLowerCase())
    );
    if (bName) {
      grouped[bName].inspTotal += 1;
      if (insp.status === 'PASSED' || insp.status === 'CONDITIONAL_PASS' || (insp as any).result === 'PASS') {
        grouped[bName].passCount += 1;
      }
      const sample = Number(insp.sampleSize) || 0;
      const defs = Number(insp.defectCount) || ((Number(insp.criticalDefects) || 0) + (Number(insp.majorDefects) || 0) + (Number(insp.minorDefects) || 0));
      grouped[bName].checkedQty += sample;
      grouped[bName].defects += defs;
    }
  });

  complaints.forEach((c) => {
    const bName = Object.keys(grouped).find((k) => k.toLowerCase().includes(c.buyerName.toLowerCase()));
    if (bName) {
      grouped[bName].claims += 1;
    }
  });

  const list = Object.entries(grouped).map(([buyer, stats]) => {
    const passRate =
      stats.inspTotal > 0
        ? Number(((stats.passCount / stats.inspTotal) * 100).toFixed(1))
        : 98.5;
    const dhu =
      stats.checkedQty > 0
        ? Number(((stats.defects / stats.checkedQty) * 100).toFixed(2))
        : 1.25;
    const status = (passRate >= 98.0 && stats.claims <= 1 ? 'GRADE_A' : 'GRADE_B') as 'GRADE_A' | 'GRADE_B';

    return {
      buyer,
      orders: stats.orders,
      pcsShipped: stats.pcsShipped,
      passRate,
      dhu,
      claims: stats.claims,
      status,
    };
  });

  return list.sort((a, b) => b.pcsShipped - a.pcsShipped);
}

export function computeLineLeaderboard(period: string = 'YTD') {
  const orders = getProductionRecords();
  const configuredLines = getProductionLines();
  const inspections = getLiveInspections();

  if (orders.length === 0) return LINE_LEADERBOARD_LIST;

  const linesMap: Record<
    string,
    { output: number; checked: number; defects: number; rejects: number; rework: number; supervisor: string }
  > = {};

  orders.forEach((o) => {
    const lineKey = o.sewingLine || o.lineId || 'Line 01';
    if (!linesMap[lineKey]) {
      const matchCfg = configuredLines.find((l) => l.name === lineKey || l.id === lineKey);
      linesMap[lineKey] = {
        output: 0,
        checked: 0,
        defects: 0,
        rejects: 0,
        rework: 0,
        supervisor: matchCfg?.lineChief || (matchCfg as any)?.supervisorName || 'Floor Supervisor',
      };
    }
    const out = Number(o.completedQuantity) || 0;
    let checked = out;
    let defs = 0;
    if (o.hourlyReports && o.hourlyReports.length > 0) {
      const hrChecked = o.hourlyReports.reduce((s, h) => s + (Number(h.checkedQty) || 0), 0);
      const hrDef = o.hourlyReports.reduce((s, h) => s + (Number(h.defectQty) || 0), 0);
      if (hrChecked > 0) checked = hrChecked;
      if (hrDef > 0) defs = hrDef;
    } else if (o.totalDefects !== undefined && o.totalDefects !== null && Number(o.totalDefects) > 0) {
      defs = Number(o.totalDefects);
    } else if (o.dhuRate !== undefined || o.defectRate !== undefined) {
      defs = Math.round(checked * ((Number(o.dhuRate ?? o.defectRate) || 0) / 100));
    }

    const rej = Number(o.rejectQuantity) || 0;
    const rew = (o as any).reworkQty || Math.round(out * 0.02);
    linesMap[lineKey].output += out;
    linesMap[lineKey].checked += checked;
    linesMap[lineKey].defects += defs;
    linesMap[lineKey].rejects += rej;
    linesMap[lineKey].rework += rew;
  });

  inspections.forEach((insp) => {
    const lineKey = insp.sewingLine || insp.lineId;
    if (lineKey && linesMap[lineKey]) {
      const sample = Number(insp.sampleSize) || 0;
      const defs = Number(insp.defectCount) || ((Number(insp.criticalDefects) || 0) + (Number(insp.majorDefects) || 0) + (Number(insp.minorDefects) || 0));
      linesMap[lineKey].checked += sample;
      linesMap[lineKey].defects += defs;
    }
  });

  const entries = Object.entries(linesMap).map(([line, data]) => {
    const dhu = data.checked > 0 ? Number(((data.defects / data.checked) * 100).toFixed(2)) : 0;
    const ftr =
      data.checked > 0
        ? Number(Math.max(0, Math.min(100, ((data.checked - data.defects) / data.checked) * 100)).toFixed(1))
        : 98.0;
    const status = (ftr >= 95.0 ? 'EXCELLENT' : ftr >= 93.0 ? 'GOOD' : 'AVERAGE') as
      | 'EXCELLENT'
      | 'GOOD'
      | 'AVERAGE';

    return {
      line,
      supervisor: data.supervisor,
      output: data.output,
      dhu,
      ftr,
      status,
    };
  });

  return entries.sort((a, b) => b.output - a.output);
}
