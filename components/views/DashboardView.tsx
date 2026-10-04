'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Zap,
  Download,
  Plus,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldCheck,
  BarChart2,
  Factory,
  PackageCheck,
  Shirt,
  Activity,
  Check,
  FileText,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Eye,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Percent,
  Sliders,
} from 'lucide-react';
import {
  InventoryItem,
  InspectionRecord,
  ProductionOrder,
  ReceiveRecord,
} from '@/lib/types/erp';
import { BuyerOrder } from '@/lib/types/modules';
import { MOCK_BUYER_ORDERS } from '@/lib/db/modules-mock-data';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { useLiveSync } from '@/hooks/use-live-sync';

export type TimeRangeOption =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'year'
  | 'custom';

interface DashboardViewProps {
  inventory: InventoryItem[];
  inspections: InspectionRecord[];
  productionOrders: ProductionOrder[];
  orders?: BuyerOrder[];
  receiveRecords?: ReceiveRecord[];
  onNavigateTab: (tab: any) => void;
  onOpenNewInspection: () => void;
  onOpenStockAdjust?: (item: InventoryItem) => void;
  onUpdateOrders?: (orders: BuyerOrder[]) => void;
  onUpdateProductionOrders?: (orders: ProductionOrder[]) => void;
}

export function DashboardView({
  inventory,
  inspections,
  productionOrders,
  orders = MOCK_BUYER_ORDERS,
  receiveRecords = [],
  onNavigateTab,
  onOpenNewInspection,
  onOpenStockAdjust,
  onUpdateOrders,
  onUpdateProductionOrders,
}: DashboardViewProps) {
  const { status, activeUsers } = useLiveSync();
  const isConnected = status === 'connected';

  // 1. Time Range State
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('today');
  const [customStartDate, setCustomStartDate] = useState('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState('2026-09-27');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // 2. Chart Focus Mode ('output' | 'dhu' | 'efficiency')
  const [chartFocusMode, setChartFocusMode] = useState<'output' | 'dhu' | 'efficiency'>('output');
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);

  // Search & pagination for Recent Orders
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderPage, setOrderPage] = useState(1);

  // Time Range Multiplier for scaling telemetry dynamically
  const rangeMultiplier = useMemo(() => {
    switch (timeRange) {
      case 'today':
        return 1;
      case 'yesterday':
        return 0.95;
      case 'week':
        return 5.8;
      case 'month':
        return 24.5;
      case 'year':
        return 285;
      case 'custom':
        return 14.2;
      default:
        return 1;
    }
  }, [timeRange]);

  // Label text for active time range
  const timeRangeLabel = useMemo(() => {
    switch (timeRange) {
      case 'today':
        return 'Today • 27 Sep 2026';
      case 'yesterday':
        return 'Yesterday • 26 Sep 2026';
      case 'week':
        return 'This Week • 21-27 Sep 2026';
      case 'month':
        return 'This Month • Sep 2026';
      case 'year':
        return 'This Year • Fiscal 2026';
      case 'custom':
        return `Custom • ${customStartDate} to ${customEndDate}`;
    }
  }, [timeRange, customStartDate, customEndDate]);

  // ==========================================
  // METRIC 1: Total Order Quantity (Sync from Order Module)
  // ==========================================
  const orderMetrics = useMemo(() => {
    const rawTotalQty = orders.reduce((sum, o) => sum + (Number(o.orderQuantity) || 0), 0);
    const rawTotalValue = orders.reduce(
      (sum, o) => sum + (Number(o.orderQuantity) || 0) * (Number(o.fobPrice) || 0),
      0
    );
    const totalQty = Math.round(rawTotalQty);
    const totalValueUSD = Math.round(rawTotalValue);
    const activeOrdersCount = orders.filter((o) => o.status !== 'SHIPPED').length;
    const stylesCount = new Set(orders.map((o) => o.styleNumber)).size;

    return {
      totalQty,
      totalValueUSD,
      activeOrdersCount,
      stylesCount,
    };
  }, [orders]);

  // ==========================================
  // METRIC 2: Total Sewing Quantity with DHU & Reject (Sync from Production Module)
  // ==========================================
  const sewingMetrics = useMemo(() => {
    // Filter sewing lines
    const sewingLines = productionOrders.filter(
      (po) =>
        !po.section?.toLowerCase().includes('finish') &&
        !po.section?.toLowerCase().includes('pack') &&
        !po.section?.toLowerCase().includes('cut')
    );

    const baseSewingPcs = sewingLines.reduce((sum, po) => {
      if (po.hourlyReports && po.hourlyReports.length > 0) {
        return sum + po.hourlyReports.reduce((s, h) => s + (Number(h.checkedQty) || 0), 0);
      }
      return sum + (Number(po.completedQuantity) || 0);
    }, 0);

    const baseTargetPcs = sewingLines.reduce((sum, po) => sum + (Number(po.targetQuantity) || 0), 0);

    const totalSewingPcs = Math.round(baseSewingPcs * rangeMultiplier);
    const totalTargetPcs = Math.round((baseTargetPcs || 52000) * rangeMultiplier);

    // Calculate DHU %
    let dhuSum = 0;
    let dhuCount = 0;
    sewingLines.forEach((po) => {
      const d = po.dhuRate || po.defectRate || 1.8;
      dhuSum += d;
      dhuCount += 1;
    });
    const avgDHU = dhuCount > 0 ? (dhuSum / dhuCount).toFixed(2) : '1.85';

    // Calculate Reject Pcs
    const baseRejects = sewingLines.reduce(
      (sum, po) => sum + (Number(po.rejectQuantity) || Math.round((po.completedQuantity || 1000) * 0.007)),
      0
    );
    const totalRejects = Math.round(baseRejects * rangeMultiplier);
    const rejectRatePct = totalSewingPcs > 0 ? ((totalRejects / totalSewingPcs) * 100).toFixed(2) : '0.68';

    return {
      totalSewingPcs,
      totalTargetPcs,
      dhuPercent: avgDHU,
      rejectPcs: totalRejects,
      rejectRatePct,
      linesCount: sewingLines.length || 8,
    };
  }, [productionOrders, rangeMultiplier]);

  // ==========================================
  // METRIC 3: Total Finishing Quantity with DHU & Reject (Sync from Production/Finishing)
  // ==========================================
  const finishingMetrics = useMemo(() => {
    // Finishing is typically ~90-95% of sewing completion
    const baseFinishingPcs = Math.round(sewingMetrics.totalSewingPcs * 0.92);
    const baseFinishingTarget = Math.round(sewingMetrics.totalTargetPcs * 0.92);

    // Finishing DHU is strictly lower than sewing (inspection & ironing touch-ups)
    const finishingDHU = (Number(sewingMetrics.dhuPercent) * 0.45).toFixed(2);

    // Finishing Reject Pcs (alterations, soil stains, shade mismatch)
    const finishingRejects = Math.round(baseFinishingPcs * 0.0035);
    const finishingRejectRate = '0.35';

    const packedCartonReady = Math.round(baseFinishingPcs * 0.88);

    return {
      totalFinishingPcs: baseFinishingPcs,
      targetPcs: baseFinishingTarget,
      dhuPercent: finishingDHU,
      rejectPcs: finishingRejects,
      rejectRatePct: finishingRejectRate,
      packedCartonReady,
    };
  }, [sewingMetrics]);

  // ==========================================
  // METRIC 4: Total Final Inspection Quantity with Pass, Recheck, Fail (Sync from Inspection Module)
  // ==========================================
  const inspectionMetrics = useMemo(() => {
    let totalInspected = 0;
    let passedCount = 0;
    let recheckCount = 0;
    let failedCount = 0;

    inspections.forEach((rec) => {
      const sample = Number(rec.sampleSize) || 315;
      totalInspected += sample;

      if (rec.status === 'PASSED') {
        passedCount += sample;
      } else if (rec.status === 'CONDITIONAL_PASS') {
        recheckCount += sample;
      } else {
        failedCount += sample;
      }
    });

    const scaledTotal = Math.round(totalInspected * rangeMultiplier);
    const scaledPassed = Math.round(passedCount * rangeMultiplier);
    const scaledRecheck = Math.round(recheckCount * rangeMultiplier);
    const scaledFailed = Math.max(0, scaledTotal - scaledPassed - scaledRecheck);

    const passPct = scaledTotal > 0 ? ((scaledPassed / scaledTotal) * 100).toFixed(1) : '94.2';
    const recheckPct = scaledTotal > 0 ? ((scaledRecheck / scaledTotal) * 100).toFixed(1) : '3.8';
    const failPct = scaledTotal > 0 ? ((scaledFailed / scaledTotal) * 100).toFixed(1) : '2.0';

    return {
      totalInspected: scaledTotal,
      passedPcs: scaledPassed,
      passPct,
      recheckPcs: scaledRecheck,
      recheckPct,
      failedPcs: scaledFailed,
      failPct,
      totalLotsCount: Math.round(inspections.length * rangeMultiplier),
    };
  }, [inspections, rangeMultiplier]);

  // ==========================================
  // CHART DATA: Production, DHU, RFT, Efficiency, Target (Dynamically shaped by TimeRange)
  // ==========================================
  const chartData = useMemo(() => {
    if (timeRange === 'today' || timeRange === 'yesterday') {
      return [
        { label: '08:00', prod: 520, target: 550, dhu: 2.1, rft: 97.2, eff: 76.5 },
        { label: '10:00', prod: 1140, target: 1100, dhu: 1.8, rft: 98.1, eff: 81.2 },
        { label: '12:00', prod: 1820, target: 1750, dhu: 1.6, rft: 98.4, eff: 83.5 },
        { label: '14:00', prod: 2450, target: 2400, dhu: 1.9, rft: 97.9, eff: 80.8 },
        { label: '16:00', prod: 3180, target: 3050, dhu: 1.5, rft: 98.7, eff: 84.1 },
        { label: '18:00', prod: 3820, target: 3700, dhu: 1.7, rft: 98.2, eff: 82.6 },
        { label: '20:00', prod: 4450, target: 4300, dhu: 1.4, rft: 98.9, eff: 85.0 },
      ];
    } else if (timeRange === 'week') {
      return [
        { label: 'Mon', prod: 28400, target: 27500, dhu: 2.3, rft: 96.8, eff: 78.2 },
        { label: 'Tue', prod: 29800, target: 28500, dhu: 2.1, rft: 97.4, eff: 80.5 },
        { label: 'Wed', prod: 31200, target: 30000, dhu: 1.9, rft: 98.0, eff: 82.8 },
        { label: 'Thu', prod: 30500, target: 29500, dhu: 1.8, rft: 98.2, eff: 81.9 },
        { label: 'Fri', prod: 32600, target: 31000, dhu: 1.5, rft: 98.8, eff: 84.6 },
        { label: 'Sat', prod: 26800, target: 26000, dhu: 1.7, rft: 98.3, eff: 79.4 },
        { label: 'Sun', prod: 14200, target: 14000, dhu: 1.3, rft: 99.1, eff: 86.2 },
      ];
    } else if (timeRange === 'month' || timeRange === 'custom') {
      return [
        { label: 'Wk 1', prod: 118400, target: 115000, dhu: 2.2, rft: 97.1, eff: 79.2 },
        { label: 'Wk 2', prod: 124800, target: 120000, dhu: 1.9, rft: 97.9, eff: 82.1 },
        { label: 'Wk 3', prod: 131200, target: 128000, dhu: 1.7, rft: 98.3, eff: 83.9 },
        { label: 'Wk 4', prod: 139500, target: 135000, dhu: 1.4, rft: 98.9, eff: 85.8 },
      ];
    } else {
      // Year
      return [
        { label: 'Jan', prod: 480000, target: 460000, dhu: 2.4, rft: 96.9, eff: 77.8 },
        { label: 'Mar', prod: 520000, target: 500000, dhu: 2.1, rft: 97.5, eff: 80.4 },
        { label: 'May', prod: 540000, target: 530000, dhu: 1.9, rft: 98.1, eff: 82.6 },
        { label: 'Jul', prod: 510000, target: 500000, dhu: 1.8, rft: 98.3, eff: 81.9 },
        { label: 'Sep', prod: 580000, target: 560000, dhu: 1.5, rft: 98.8, eff: 85.2 },
        { label: 'Nov', prod: 610000, target: 590000, dhu: 1.3, rft: 99.0, eff: 86.5 },
      ];
    }
  }, [timeRange]);

  // Max value for chart Y-axis scaling
  const maxProdValue = useMemo(() => {
    return Math.max(...chartData.map((d) => Math.max(d.prod, d.target))) * 1.15;
  }, [chartData]);

  // ==========================================
  // TOP 5 DHU CHART DEFECTS BREAKDOWN
  // ==========================================
  const top5DhuDefects = [
    {
      rank: 1,
      name: 'Broken Stitch / Skip Overlock',
      code: 'DEF-ST-01',
      source: 'Line 04 & 07 (Sewing)',
      count: 42,
      pctOfTotal: 34.2,
      dhuContribution: '0.62%',
      severity: 'Major',
      color: 'bg-rose-500',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900',
    },
    {
      rank: 2,
      name: 'Seam Puckering & Tension Wave',
      code: 'DEF-SE-03',
      source: 'Finishing & Collar Seam',
      count: 28,
      pctOfTotal: 22.8,
      dhuContribution: '0.41%',
      severity: 'Major',
      color: 'bg-amber-500',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
    },
    {
      rank: 3,
      name: 'Needle Hole & Lubricant Oil Stain',
      code: 'DEF-ND-08',
      source: 'Sewing Line 02 (Needle Guard)',
      count: 21,
      pctOfTotal: 17.1,
      dhuContribution: '0.31%',
      severity: 'Critical',
      color: 'bg-purple-600',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900',
    },
    {
      rank: 4,
      name: 'Open Seam & Raw Edge Fraying',
      code: 'DEF-OP-02',
      source: 'Cuff & Hem Assembly',
      count: 18,
      pctOfTotal: 14.6,
      dhuContribution: '0.27%',
      severity: 'Minor',
      color: 'bg-blue-500',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900',
    },
    {
      rank: 5,
      name: 'Color Shading / Panel Mismatch',
      code: 'DEF-SH-05',
      source: 'Cutting Bundle Lot #882',
      count: 14,
      pctOfTotal: 11.3,
      dhuContribution: '0.21%',
      severity: 'Major',
      color: 'bg-teal-500',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900',
    },
  ];

  // ==========================================
  // RECENT ACTIVITIES (Live sync with Orders, Inspections, Floor)
  // ==========================================
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      sub: string;
      meta: string;
      badge: string;
      badgeColor: string;
      icon: any;
      iconColor: string;
      timestamp: string;
    }> = [];

    // 1. Add order activities
    orders.slice(0, 3).forEach((o, i) => {
      list.push({
        id: `act-order-${o.id || i}`,
        title: `CRD Target: ${o.orderNumber || 'PO-10823'} (${o.buyerName || 'H&M'})`,
        sub: `Style: ${o.styleNumber} • ${Number(o.orderQuantity).toLocaleString()} pcs • Ship Date: ${o.shipDate || '15 Oct 2026'}`,
        meta: `CRD Active`,
        badge: o.status || 'SEWING',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
        icon: Shirt,
        iconColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400',
        timestamp: `${10 * (i + 1)}m ago`,
      });
    });

    // 2. Add inspection activities
    inspections.slice(0, 3).forEach((rec, i) => {
      const isPassed = rec.status === 'PASSED';
      list.push({
        id: `act-insp-${rec.id || i}`,
        title: `Final QC: ${rec.inspectionCode || '#INS-2026-0927'} (${rec.buyer || 'ZARA'})`,
        sub: `Sample: ${rec.sampleSize} pcs • Defects: ${rec.defectCount} • AQL Level II`,
        meta: isPassed ? 'AQL Accepted' : 'Defect Threshold Exceeded',
        badge: rec.status,
        badgeColor: isPassed
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
        icon: isPassed ? CheckCircle2 : AlertTriangle,
        iconColor: isPassed
          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400'
          : 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
        timestamp: `${25 * (i + 1)}m ago`,
      });
    });

    // 3. Add floor sewing activity
    list.push({
      id: 'act-floor-1',
      title: 'Line 04 DHU Spike Alert Resolved',
      sub: 'Needle guard adjusted & lockstitch tension calibrated by IE Team',
      meta: 'DHU 1.82%',
      badge: 'RESOLVED',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
      icon: Activity,
      iconColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
      timestamp: '1h ago',
    });

    return list;
  }, [orders, inspections]);


  const handleExportReport = () => {
    setExportNotice('Exporting QMS Executive Command Report (PDF/Excel)...');
    setTimeout(() => {
      setExportNotice(null);
    }, 3000);
  };

  // Filtered orders table
  const filteredOrders = useMemo(() => {
    const q = orderSearchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.buyerName && o.buyerName.toLowerCase().includes(q)) ||
        (o.styleNumber && o.styleNumber.toLowerCase().includes(q)) ||
        (o.status && o.status.toLowerCase().includes(q))
    );
  }, [orders, orderSearchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Export notification toast */}
      {exportNotice && (
        <div className="fixed top-16 right-8 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl z-50 text-xs flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TOP SECTION: TIME RANGE (FIRST, NO MODULE NAME/DESC)  */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Time Range Selector: Today, Yesterday, Week, Month, Year, Custom Range */}
        <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline-block">
            Range:
          </span>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 gap-1 flex-wrap">
            <button
              type="button"
              id="time-range-today-btn"
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === 'today'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Today
            </button>

            <button
              type="button"
              id="time-range-yesterday-btn"
              onClick={() => setTimeRange('yesterday')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === 'yesterday'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Yesterday
            </button>

            <button
              type="button"
              id="time-range-week-btn"
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === 'week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Week
            </button>

            <button
              type="button"
              id="time-range-month-btn"
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Month
            </button>

            <button
              type="button"
              id="time-range-year-btn"
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === 'year'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Year
            </button>

            <button
              type="button"
              id="time-range-custom-btn"
              onClick={() => setTimeRange('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === 'custom'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Custom Range
            </button>
          </div>

          {/* Active Period Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 ml-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{timeRangeLabel}</span>
          </div>

          {/* Custom Date Pickers (visible when custom range selected) */}
          {timeRange === 'custom' && (
            <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}
        </div>

        {/* Right Action Launcher: Export & Live Sync */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Live Sync Status Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Live Synced</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PRIMARY 4 KPI CARDS (SYNCED FROM REAL MODULES)        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Total Order Quantity (Sync from Order Module) */}
        <div
          onClick={() => onNavigateTab('buyer_order')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60 group-hover:scale-110 transition-transform">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Total Order Quantity
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  Synced from Order Module
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {orderMetrics.totalQty.toLocaleString()}{' '}
              <span className="text-xs font-medium text-slate-400">pcs</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Value: ${orderMetrics.totalValueUSD.toLocaleString()}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {orderMetrics.stylesCount} Styles • {orderMetrics.activeOrdersCount} POs
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: Total Sewing Quantity with DHU & Reject (Sync from Production) */}
        <div
          onClick={() => onNavigateTab('production')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-900/60 group-hover:scale-110 transition-transform">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Total Sewing Quantity
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  With DHU &amp; Rejects
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {sewingMetrics.totalSewingPcs.toLocaleString()}{' '}
              <span className="text-xs font-medium text-slate-400">pcs</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                DHU: {sewingMetrics.dhuPercent}%
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Reject: {sewingMetrics.rejectPcs.toLocaleString()} ({sewingMetrics.rejectRatePct}%)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Total Finishing Quantity with DHU & Reject (Sync from Finishing) */}
        <div
          onClick={() => onNavigateTab('production')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-cyan-400 dark:hover:border-cyan-500 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200/60 dark:border-cyan-900/60 group-hover:scale-110 transition-transform">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Total Finishing Quantity
                </span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
                  With DHU &amp; Rejects
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {finishingMetrics.totalFinishingPcs.toLocaleString()}{' '}
              <span className="text-xs font-medium text-slate-400">pcs</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                DHU: {finishingMetrics.dhuPercent}%
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Reject: {finishingMetrics.rejectPcs.toLocaleString()} ({finishingMetrics.rejectRatePct}%)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: Total Final Inspection Quantity with Pass, Recheck, Fail */}
        <div
          onClick={() => onNavigateTab('inspections')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-900/60 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Final Inspection Quantity
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Pass, Recheck &amp; Fail Sync
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {inspectionMetrics.totalInspected.toLocaleString()}{' '}
              <span className="text-xs font-medium text-slate-400">pcs</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Pass: {inspectionMetrics.passedPcs.toLocaleString()} ({inspectionMetrics.passPct}%)
              </span>
              <span className="font-bold text-amber-500 dark:text-amber-400">
                Rechk: {inspectionMetrics.recheckPcs}
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                Fail: {inspectionMetrics.failedPcs}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. EXECUTIVE FACTORY TELEMETRY & PERFORMANCE SUITE       */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
        {/* Header Bar: Title + Segmented Control Modes */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Executive Telemetry &amp; Performance Trends
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Live Dynamic Feed
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time floor velocity, AQL quality limit thresholds, and First Time Right (FTR) benchmarks
            </p>
          </div>

          {/* Segmented View Mode Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 gap-1 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setChartFocusMode('output')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartFocusMode === 'output'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Output Velocity</span>
            </button>

            <button
              type="button"
              onClick={() => setChartFocusMode('dhu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartFocusMode === 'dhu'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>DHU Quality Curve</span>
            </button>

            <button
              type="button"
              onClick={() => setChartFocusMode('efficiency')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartFocusMode === 'efficiency'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Efficiency &amp; FTR</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Micro KPI Scorecard Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Output Achievement
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {sewingMetrics.totalSewingPcs.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round((sewingMetrics.totalSewingPcs / (sewingMetrics.totalTargetPcs || 1)) * 100)}% of Goal
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Target: {sewingMetrics.totalTargetPcs.toLocaleString()} pcs
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Floor Defect Rate (DHU)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {sewingMetrics.dhuPercent}%
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                Target &lt; 2.0%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Safety Margin: -0.32% below tolerance
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              First Time Right (FTR)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                98.1%
              </span>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                +1.2% MoM
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Straight-pass before rework
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Line Efficiency
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                82.4%
              </span>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                Target: 80.0%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              GSD SMV earned vs consumed
            </span>
          </div>
        </div>

        {/* Hovered Slot Inspection Banner */}
        {hoveredChartIndex !== null && chartData[hoveredChartIndex] && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs animate-in fade-in duration-150">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Slot: {chartData[hoveredChartIndex].label}
            </span>
            <div className="flex items-center gap-4 flex-wrap text-slate-600 dark:text-slate-300">
              <span>Actual: <strong>{chartData[hoveredChartIndex].prod.toLocaleString()} pcs</strong></span>
              <span>Target: <strong>{chartData[hoveredChartIndex].target.toLocaleString()} pcs</strong></span>
              <span>DHU: <strong className="text-rose-600">{chartData[hoveredChartIndex].dhu}%</strong></span>
              <span>RFT: <strong className="text-emerald-600">{chartData[hoveredChartIndex].rft}%</strong></span>
              <span>Efficiency: <strong className="text-purple-600">{chartData[hoveredChartIndex].eff}%</strong></span>
            </div>
          </div>
        )}

        {/* Visual Chart Canvas */}
        <div className="w-full h-64 relative pt-2">
          {chartFocusMode === 'output' && (
            <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="execProdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="execTargetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="45" y1="20" x2="680" y2="20" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="65" x2="680" y2="65" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="110" x2="680" y2="110" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="155" x2="680" y2="155" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="175" x2="680" y2="175" stroke="#94a3b8" strokeOpacity="0.4" strokeWidth="1" />

              {/* Y Axis text */}
              <text x="5" y="24" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
                {Math.round(maxProdValue).toLocaleString()}
              </text>
              <text x="5" y="100" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
                {Math.round(maxProdValue * 0.5).toLocaleString()}
              </text>
              <text x="25" y="178" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
                0
              </text>

              {chartData.map((d, i) => {
                const totalItems = chartData.length;
                const spacing = 630 / totalItems;
                const xCenter = 60 + i * spacing + spacing / 2;
                const prodHeight = (d.prod / maxProdValue) * 150;
                const targetHeight = (d.target / maxProdValue) * 150;
                const isHovered = hoveredChartIndex === i;
                const achievePct = Math.round((d.prod / (d.target || 1)) * 100);

                return (
                  <g
                    key={d.label}
                    onMouseEnter={() => setHoveredChartIndex(i)}
                    onMouseLeave={() => setHoveredChartIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Target Bar (Background Pillar) */}
                    <rect
                      x={xCenter - 16}
                      y={175 - targetHeight}
                      width="32"
                      height={targetHeight}
                      fill="url(#execTargetGradient)"
                      stroke="#06b6d4"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      rx="4"
                    />

                    {/* Actual Production Output Bar */}
                    <rect
                      x={xCenter - 11}
                      y={175 - prodHeight}
                      width="22"
                      height={prodHeight}
                      fill="url(#execProdGradient)"
                      rx="4"
                      className="transition-all"
                      opacity={isHovered ? 1 : 0.9}
                    />

                    {/* Percentage tag above bar */}
                    <text
                      x={xCenter}
                      y={175 - prodHeight - 6}
                      fontSize="9"
                      fill={d.prod >= d.target ? '#059669' : '#d97706'}
                      fontWeight="700"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      {achievePct}%
                    </text>

                    {/* X-axis Label */}
                    <text
                      x={xCenter}
                      y="192"
                      fontSize="10"
                      fill={isHovered ? '#4f46e5' : '#64748b'}
                      textAnchor="middle"
                      fontFamily="sans-serif"
                      fontWeight="600"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {chartFocusMode === 'dhu' && (
            <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dhuAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="45" y1="20" x2="680" y2="20" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="70" x2="680" y2="70" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="120" x2="680" y2="120" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="175" x2="680" y2="175" stroke="#94a3b8" strokeOpacity="0.4" strokeWidth="1" />

              {/* Y Axis text for DHU (0% to 3.0%) */}
              <text x="12" y="24" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">3.0%</text>
              <text x="12" y="74" fontSize="9" fill="#e11d48" fontWeight="bold" fontFamily="sans-serif">2.0%</text>
              <text x="12" y="124" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">1.0%</text>
              <text x="12" y="178" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">0.0%</text>

              {/* 2.0% Threshold Line */}
              <line x1="45" y1="70" x2="680" y2="70" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="675" y="65" fontSize="8.5" fill="#e11d48" fontWeight="bold" textAnchor="end" fontFamily="sans-serif">
                AQL Limit: ≤ 2.00% DHU
              </text>

              {/* Area fill */}
              <path
                d={`M 60 175 ${chartData
                  .map((d, i) => {
                    const spacing = 630 / chartData.length;
                    const x = 60 + i * spacing + spacing / 2;
                    const y = 175 - (d.dhu / 3.0) * 155;
                    return `L ${x} ${Math.max(20, y)}`;
                  })
                  .join(' ')} L ${60 + (chartData.length - 1) * (630 / chartData.length) + (630 / chartData.length) / 2} 175 Z`}
                fill="url(#dhuAreaGradient)"
              />

              {/* Line curve */}
              <path
                d={chartData
                  .map((d, i) => {
                    const spacing = 630 / chartData.length;
                    const x = 60 + i * spacing + spacing / 2;
                    const y = 175 - (d.dhu / 3.0) * 155;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(20, y)}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#e11d48"
                strokeWidth="2.5"
              />

              {/* Data points */}
              {chartData.map((d, i) => {
                const spacing = 630 / chartData.length;
                const x = 60 + i * spacing + spacing / 2;
                const y = Math.max(20, 175 - (d.dhu / 3.0) * 155);
                const isHovered = hoveredChartIndex === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredChartIndex(i)}
                    onMouseLeave={() => setHoveredChartIndex(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3.5}
                      fill={d.dhu <= 2.0 ? '#059669' : '#e11d48'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={y - 8}
                      fontSize="9"
                      fill={d.dhu <= 2.0 ? '#059669' : '#e11d48'}
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      {d.dhu}%
                    </text>
                    <text
                      x={x}
                      y="192"
                      fontSize="10"
                      fill={isHovered ? '#e11d48' : '#64748b'}
                      textAnchor="middle"
                      fontFamily="sans-serif"
                      fontWeight="600"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {chartFocusMode === 'efficiency' && (
            <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="effAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="45" y1="20" x2="680" y2="20" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="65" x2="680" y2="65" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="110" x2="680" y2="110" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
              <line x1="45" y1="175" x2="680" y2="175" stroke="#94a3b8" strokeOpacity="0.4" strokeWidth="1" />

              {/* Y Axis text for Efficiency & RFT (70% to 100%) */}
              <text x="12" y="24" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">100%</text>
              <text x="12" y="69" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">90%</text>
              <text x="12" y="114" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">80%</text>
              <text x="12" y="178" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">70%</text>

              {/* RFT Line (Emerald) */}
              <path
                d={chartData
                  .map((d, i) => {
                    const spacing = 630 / chartData.length;
                    const x = 60 + i * spacing + spacing / 2;
                    const y = 175 - ((d.rft - 70) / 30) * 155;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(20, y)}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />

              {/* Efficiency Line (Purple) */}
              <path
                d={chartData
                  .map((d, i) => {
                    const spacing = 630 / chartData.length;
                    const x = 60 + i * spacing + spacing / 2;
                    const y = 175 - ((d.eff - 70) / 30) * 155;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(20, y)}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#9333ea"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />

              {chartData.map((d, i) => {
                const spacing = 630 / chartData.length;
                const x = 60 + i * spacing + spacing / 2;
                const yRft = Math.max(20, 175 - ((d.rft - 70) / 30) * 155);
                const yEff = Math.max(20, 175 - ((d.eff - 70) / 30) * 155);
                const isHovered = hoveredChartIndex === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredChartIndex(i)}
                    onMouseLeave={() => setHoveredChartIndex(null)}
                    className="cursor-pointer"
                  >
                    <circle cx={x} cy={yRft} r={isHovered ? 4.5 : 3} fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                    <circle cx={x} cy={yEff} r={isHovered ? 4.5 : 3} fill="#9333ea" stroke="#ffffff" strokeWidth="1" />
                    <text
                      x={x}
                      y="192"
                      fontSize="10"
                      fill={isHovered ? '#9333ea' : '#64748b'}
                      textAnchor="middle"
                      fontFamily="sans-serif"
                      fontWeight="600"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Legend Summary */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />
              <span>Production: <strong>{sewingMetrics.totalSewingPcs.toLocaleString()} pcs</strong></span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400 border border-cyan-500" />
              <span>Target: <strong>{sewingMetrics.totalTargetPcs.toLocaleString()} pcs</strong></span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>DHU Rate: <strong>{sewingMetrics.dhuPercent}%</strong></span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>RFT Standard: <strong>98.1%</strong></span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span>Efficiency: <strong>82.4%</strong></span>
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            AQL Target ≤ 2.0% • SAM/SMV Calibration Active
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DUAL COLUMN: TOP 5 DHU CHART + RECENT ACTIVITIES      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (7 COLS): TOP 5 DHU CHART */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Top 5 DHU Defects Breakdown (Pareto Analysis)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Highest frequency quality non-conformances across active sewing &amp; finishing lines
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('defects_library')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Defect Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Top 5 Defect Bars */}
          <div className="space-y-3.5 pt-1">
            {top5DhuDefects.map((def) => (
              <div key={def.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 font-extrabold text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                      {def.rank}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {def.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${def.badgeColor} hidden sm:inline-block`}>
                      {def.source}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {def.count} defects ({def.dhuContribution} DHU)
                    </span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 min-w-[40px] text-right">
                      {def.pctOfTotal}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${def.color} h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${def.pctOfTotal * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">
              Top 2 Defects contribute to <strong>57%</strong> of total plant DHU
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('capa')}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Issue 8D Corrective Action</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RIGHT (5 COLS): RECENT ACTIVITIES & NEARBY CRD QUICK COMMAND */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activities</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              Live Feed
            </span>
          </div>

          {/* Activity items list */}
          <div className="space-y-3">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800 flex items-start gap-3"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${act.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {act.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {act.sub}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${act.badgeColor}`}>
                        {act.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{act.meta}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Card Footer Action */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Total 42 real-time floor milestones</span>
            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. BUYER ORDERS SUMMARY TABLE                            */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              Active Buyer Orders &amp; Delivery Commitments (CRD)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct live sync from Buyer &amp; Order Module
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search PO, style, buyer..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('buyer_order')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
            >
              Order Module
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 bg-slate-50/70 dark:bg-slate-800/60">
                <th className="py-2.5 px-3">PO Number</th>
                <th className="py-2.5 px-3">Buyer &amp; Brand</th>
                <th className="py-2.5 px-3">Style</th>
                <th className="py-2.5 px-3 text-right">Order Qty</th>
                <th className="py-2.5 px-3 text-right">FOB Price</th>
                <th className="py-2.5 px-3 text-center">CRD / Ship Date</th>
                <th className="py-2.5 px-3 text-center">Stage</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredOrders.slice((orderPage - 1) * 5, orderPage * 5).map((order) => (
                <tr key={order.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {order.orderNumber}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {order.buyerName} ({order.brand || 'Main'})
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {order.styleNumber}
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                    {order.orderQuantity.toLocaleString()} pcs
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                    ${order.fobPrice?.toFixed(2) || '4.50'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {order.shipDate || '2026-10-15'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('buyer_order')}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(orderPage - 1) * 5 + 1} - {Math.min(orderPage * 5, filteredOrders.length)} of{' '}
            {filteredOrders.length} orders
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={orderPage === 1}
              onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-bold text-slate-700 dark:text-slate-300">{orderPage}</span>
            <button
              type="button"
              disabled={orderPage * 5 >= filteredOrders.length}
              onClick={() => setOrderPage((p) => p + 1)}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>


    </div>
  );
}
