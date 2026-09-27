'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  FileSpreadsheet,
  Target,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  Download,
  Filter,
  Columns,
  Eye,
  Edit,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  UserCheck,
  Check,
  FileText,
  AlertCircle,
  HelpCircle,
  QrCode,
  GitPullRequest,
  BarChart2,
  Boxes,
  FileBarChart,
  GraduationCap,
  Sparkles,
  Layers,
  X,
  ExternalLink,
} from 'lucide-react';
import { InventoryItem, InspectionRecord, ProductionOrder } from '@/lib/types/erp';
import { useLiveSync } from '@/hooks/use-live-sync';
import { useErpAuth } from '@/hooks/use-erp-auth';

interface DashboardViewProps {
  inventory: InventoryItem[];
  inspections: InspectionRecord[];
  productionOrders: ProductionOrder[];
  onNavigateTab: (tab: any) => void;
  onOpenNewInspection: () => void;
  onOpenStockAdjust: (item: InventoryItem) => void;
}

export function DashboardView({
  inventory,
  inspections,
  productionOrders,
  onNavigateTab,
  onOpenNewInspection,
  onOpenStockAdjust,
}: DashboardViewProps) {
  const { user } = useErpAuth();
  const { simulateMultiUserActivity } = useLiveSync();

  // Interactive filters
  const [chartPeriod, setChartPeriod] = useState<'today' | '7days' | '30days' | '3months'>('today');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [showQuickCommand, setShowQuickCommand] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Orders data matching the screenshot table
  const allOrders = [
    {
      poNo: 'PO-10823',
      buyer: 'H&M',
      style: 'ST-4167',
      orderQty: 12000,
      inspectionQty: 11980,
      defectQty: 28,
      rft: 98.8,
      status: 'On Going',
    },
    {
      poNo: 'PO-10822',
      buyer: 'C&A',
      style: 'ST-4432',
      orderQty: 8500,
      inspectionQty: 8420,
      defectQty: 72,
      rft: 97.1,
      status: 'On Going',
    },
    {
      poNo: 'PO-10821',
      buyer: 'ZARA',
      style: 'ST-3990',
      orderQty: 15000,
      inspectionQty: 14850,
      defectQty: 42,
      rft: 98.9,
      status: 'On Going',
    },
    {
      poNo: 'PO-10820',
      buyer: 'Walmart',
      style: 'ST-4721',
      orderQty: 10000,
      inspectionQty: 9950,
      defectQty: 50,
      rft: 96.5,
      status: 'Completed',
    },
    {
      poNo: 'PO-10819',
      buyer: 'Mango',
      style: 'ST-3612',
      orderQty: 6800,
      inspectionQty: 6700,
      defectQty: 18,
      rft: 98.5,
      status: 'Completed',
    },
  ];

  const filteredOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return allOrders;
    const q = orderSearchQuery.toLowerCase();
    return allOrders.filter(
      (o) =>
        o.poNo.toLowerCase().includes(q) ||
        o.buyer.toLowerCase().includes(q) ||
        o.style.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [orderSearchQuery]);

  const handleExportReport = () => {
    setExportNotice('Exporting QMS Executive Command Report (PDF/Excel)...');
    setTimeout(() => {
      setExportNotice(null);
    }, 3000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Export notification toast */}
      {exportNotice && (
        <div className="fixed top-16 right-8 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl z-50 text-xs flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* TOP COMMAND CENTER HEADER */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Factory Quality Command Center
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time quality, production and compliance overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {/* Date Picker Button */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Today — 27 Sep 2026</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>

          {/* + New Inspection Button */}
          <button
            type="button"
            id="cmd-new-inspection-btn"
            onClick={onOpenNewInspection}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Inspection</span>
          </button>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 6 TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Quality Score */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 tracking-tight">Quality Score</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">98.6%</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className="text-emerald-600 font-bold flex items-center">
                ↑ 0.8%
              </span>
              <span className="text-slate-400 font-medium">Target 95%</span>
            </div>
          </div>
          {/* Sparkline curve */}
          <div className="h-6 w-full mt-2">
            <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 20 Q 25 15, 50 18 T 100 6"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* 2. DHU */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 tracking-tight">DHU</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">1.42</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className="text-emerald-600 font-bold flex items-center">
                ↓ 12.3%
              </span>
              <span className="text-slate-400 font-medium">Target ≤ 2.0</span>
            </div>
          </div>
          {/* Sparkline curve */}
          <div className="h-6 w-full mt-2">
            <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 6 Q 30 18, 60 10 T 100 19"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* 3. RFT */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 tracking-tight">RFT</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">97.8%</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className="text-emerald-600 font-bold flex items-center">
                ↑ 0.6%
              </span>
              <span className="text-slate-400 font-medium">Target ≥ 95%</span>
            </div>
          </div>
          {/* Sparkline curve */}
          <div className="h-6 w-full mt-2">
            <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 18 Q 30 14, 55 16 T 100 8"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* 4. Production */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <Factory className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 tracking-tight">Production</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">48,250 <span className="text-xs font-medium text-slate-500">pcs</span></div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className="text-emerald-600 font-bold flex items-center">
                ↑ 8.4%
              </span>
              <span className="text-slate-400 font-medium">Target 45,000</span>
            </div>
          </div>
          {/* Sparkline curve */}
          <div className="h-6 w-full mt-2">
            <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 20 Q 25 10, 50 14 T 100 4"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* 5. Open CAPA */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 tracking-tight">Open CAPA</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">14</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className="text-emerald-600 font-bold flex items-center">
                ↓ 36.4%
              </span>
              <span className="text-slate-400 font-medium">Target ≤ 20</span>
            </div>
          </div>
          {/* Sparkline curve */}
          <div className="h-6 w-full mt-2">
            <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 8 Q 30 18, 60 12 T 100 21"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* 6. Audit Compliance */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 tracking-tight">Audit Compliance</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">96.4%</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className="text-emerald-600 font-bold flex items-center">
                ↑ 1.2%
              </span>
              <span className="text-slate-400 font-medium">Target ≥ 95%</span>
            </div>
          </div>
          {/* Sparkline curve */}
          <div className="h-6 w-full mt-2">
            <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 19 Q 30 15, 60 18 T 100 8"
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN GRID: MAIN CONTENT (9 COLS) + RIGHT WIDGETS (3 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER MAIN COLUMN */}
        <div className="xl:col-span-9 space-y-5">
          {/* ROW 1: Factory Quality Health & Production vs Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Factory Quality Health Card (Donut Gauge + Surrounding Stats) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Factory Quality Health</h2>
                
                {/* Orbiting Stats around circular donut chart */}
                <div className="relative py-2 flex items-center justify-center min-h-[220px]">
                  {/* Surrounding Stats - Top Left */}
                  <div className="absolute top-0 left-2 text-left">
                    <div className="text-[11px] font-bold text-slate-800">DHU 1.42</div>
                    <div className="text-[10px] text-slate-400">(Target ≤ 2.0)</div>
                  </div>

                  {/* Surrounding Stats - Top Right */}
                  <div className="absolute top-0 right-2 text-right">
                    <div className="text-[11px] font-bold text-slate-800 flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      RFT 97.8%
                    </div>
                    <div className="text-[10px] text-slate-400">(Target ≥ 95%)</div>
                  </div>

                  {/* Surrounding Stats - Mid Left */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 text-left">
                    <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Audit 95.4%
                    </div>
                    <div className="text-[10px] text-slate-400">(Target ≥ 95%)</div>
                  </div>

                  {/* Surrounding Stats - Mid Right */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-0 text-right">
                    <div className="text-[11px] font-bold text-slate-800 flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      Final Inspection 98.2%
                    </div>
                    <div className="text-[10px] text-slate-400">(Target ≥ 95%)</div>
                  </div>

                  {/* Surrounding Stats - Bottom Left */}
                  <div className="absolute bottom-0 left-2 text-left">
                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Customer Complaint 0.6%
                    </div>
                    <div className="text-[10px] text-slate-400">(Target ≤ 1.0%)</div>
                  </div>

                  {/* Surrounding Stats - Bottom Right */}
                  <div className="absolute bottom-0 right-2 text-right">
                    <div className="text-[11px] font-bold text-slate-800 flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      CAPA 92.3%
                    </div>
                    <div className="text-[10px] text-slate-400">(Target ≥ 90%)</div>
                  </div>

                  {/* Central Donut Chart */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e2e8f0"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* Active colored segments */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#10b981"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset="12"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#06b6d4"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset="180"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>

                    {/* Inner Content */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">98.6%</span>
                      <span className="text-[10px] text-slate-500 font-medium max-w-[80px] leading-tight">
                        Overall Quality Score
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Production vs Quality Chart Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-sm font-bold text-slate-900">Production vs Quality</h2>
                  
                  {/* Period Filter Tabs */}
                  <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setChartPeriod('today')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        chartPeriod === 'today' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartPeriod('7days')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        chartPeriod === '7days' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartPeriod('30days')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        chartPeriod === '30days' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartPeriod('3months')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        chartPeriod === '3months' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3 Months
                    </button>
                  </div>
                </div>

                {/* Chart Legend */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600 flex-wrap mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                    <span>Production Qty</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                    <span>Inspection Qty</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Defect Qty</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Rework Qty</span>
                  </div>
                </div>

                {/* Clustered Bar & Line SVG Chart */}
                <div className="w-full h-44 relative mt-2">
                  <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                    {/* Gridlines */}
                    <line x1="35" y1="20" x2="490" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="35" y1="55" x2="490" y2="55" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="35" y1="90" x2="490" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="35" y1="125" x2="490" y2="125" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="35" y1="140" x2="490" y2="140" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Y-Axis Labels */}
                    <text x="5" y="24" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">20K</text>
                    <text x="5" y="59" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">15K</text>
                    <text x="5" y="94" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">10K</text>
                    <text x="10" y="129" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">5K</text>
                    <text x="16" y="144" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">0</text>

                    {/* 7 Days Clusters: 21 Sep to 27 Sep */}
                    {[
                      { day: '21 Sep', prodH: 95, inspH: 88, defY: 132, rewY: 135 },
                      { day: '22 Sep', prodH: 102, inspH: 96, defY: 130, rewY: 133 },
                      { day: '23 Sep', prodH: 98, inspH: 92, defY: 131, rewY: 134 },
                      { day: '24 Sep', prodH: 110, inspH: 104, defY: 128, rewY: 132 },
                      { day: '25 Sep', prodH: 106, inspH: 100, defY: 129, rewY: 133 },
                      { day: '26 Sep', prodH: 115, inspH: 110, defY: 126, rewY: 130 },
                      { day: '27 Sep', prodH: 120, inspH: 116, defY: 125, rewY: 129 },
                    ].map((col, idx) => {
                      const xCenter = 65 + idx * 62;
                      return (
                        <g key={col.day}>
                          {/* Production bar */}
                          <rect
                            x={xCenter - 14}
                            y={140 - col.prodH}
                            width="12"
                            height={col.prodH}
                            fill="#2563eb"
                            rx="2"
                          />
                          {/* Inspection bar */}
                          <rect
                            x={xCenter}
                            y={140 - col.inspH}
                            width="12"
                            height={col.inspH}
                            fill="#06b6d4"
                            rx="2"
                          />
                          {/* X-axis date label */}
                          <text
                            x={xCenter}
                            y="155"
                            fontSize="9"
                            fill="#64748b"
                            textAnchor="middle"
                            fontFamily="sans-serif"
                            fontWeight="500"
                          >
                            {col.day}
                          </text>
                        </g>
                      );
                    })}

                    {/* Defect Line (red) */}
                    <path
                      d="M 65 132 L 127 130 L 189 131 L 251 128 L 313 129 L 375 126 L 437 125"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                    {[65, 127, 189, 251, 313, 375, 437].map((x, i) => (
                      <circle
                        key={i}
                        cx={x}
                        cy={[132, 130, 131, 128, 129, 126, 125][i]}
                        r="3"
                        fill="#ef4444"
                      />
                    ))}

                    {/* Rework Line (orange) */}
                    <path
                      d="M 65 135 L 127 133 L 189 134 L 251 132 L 313 133 L 375 130 L 437 129"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2"
                    />
                    {[65, 127, 189, 251, 313, 375, 437].map((x, i) => (
                      <circle
                        key={i}
                        cx={x}
                        cy={[135, 133, 134, 132, 133, 130, 129][i]}
                        r="3"
                        fill="#f97316"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Top 5 Defects Analysis, Quality Heatmap & Live Factory Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 1. Top 5 Defect Frequency & Pareto Chart (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                      Top 5 Defect Frequency (Pareto)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      80/20 root cause distribution across sewing and finishing lines
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('defects_library')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Defect Library</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Pareto Chart Bars with Frequency, Share & Severity */}
                <div className="space-y-2.5 mt-2">
                  {[
                    {
                      rank: 1,
                      name: 'Broken Stitch / Skip Overlock',
                      line: 'Line 04, 07',
                      count: 38,
                      pct: 31,
                      severity: 'Major',
                      color: 'bg-rose-500',
                      textColor: 'text-rose-600',
                      bgBadge: 'bg-rose-50 text-rose-700 border-rose-200',
                    },
                    {
                      rank: 2,
                      name: 'Shade & Color Variation',
                      line: 'Lot #882',
                      count: 29,
                      pct: 23,
                      severity: 'Major',
                      color: 'bg-amber-500',
                      textColor: 'text-amber-600',
                      bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
                    },
                    {
                      rank: 3,
                      name: 'Needle Holes & Fiber Snagging',
                      line: 'Line 01, 05',
                      count: 22,
                      pct: 18,
                      severity: 'Critical',
                      color: 'bg-purple-600',
                      textColor: 'text-purple-600',
                      bgBadge: 'bg-purple-50 text-purple-700 border-purple-200',
                    },
                    {
                      rank: 4,
                      name: 'Tension Puckering / Seam Slub',
                      line: 'Finishing',
                      count: 19,
                      pct: 15,
                      severity: 'Minor',
                      color: 'bg-blue-500',
                      textColor: 'text-blue-600',
                      bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
                    },
                    {
                      rank: 5,
                      name: 'Measurement Out-of-Tolerance',
                      line: 'Cutting',
                      count: 16,
                      pct: 13,
                      severity: 'Major',
                      color: 'bg-teal-500',
                      textColor: 'text-teal-600',
                      bgBadge: 'bg-teal-50 text-teal-700 border-teal-200',
                    },
                  ].map((defect) => (
                    <div key={defect.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {defect.rank}
                          </span>
                          <span className="font-semibold text-slate-800 text-[11px] truncate">
                            {defect.name}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${defect.bgBadge}`}>
                            {defect.line}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-500">{defect.count} def.</span>
                          <span className={`text-xs font-bold ${defect.textColor}`}>{defect.pct}%</span>
                        </div>
                      </div>
                      {/* Animated Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`${defect.color} h-1.5 rounded-full transition-all duration-500`}
                          style={{ width: `${defect.pct * 2.8}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pareto Cumulative Curve & Distribution Sparkline */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="font-medium">Total: 124 Defects</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-600 font-bold">Top 2 = 54% of DHU</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    AQL ≤ 2.5% Pass
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Quality Heatmap (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Quality Heatmap
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('inspections')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                        <th className="pb-2">Process</th>
                        <th className="pb-2 text-center">DHU</th>
                        <th className="pb-2 text-center">Defects</th>
                        <th className="pb-2 text-center">RFT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[11px]">
                      {[
                        { proc: 'Cutting', dhu: '1.8', def: '12', rft: '96.2%', dhuColor: 'bg-emerald-50 text-emerald-700', defColor: 'bg-amber-50 text-amber-700', rftColor: 'bg-emerald-50 text-emerald-700' },
                        { proc: 'Sewing', dhu: '2.4', def: '18', rft: '94.8%', dhuColor: 'bg-rose-50 text-rose-700', defColor: 'bg-rose-100 text-rose-800 font-bold', rftColor: 'bg-rose-50 text-rose-700' },
                        { proc: 'Finishing', dhu: '1.2', def: '7', rft: '97.6%', dhuColor: 'bg-emerald-100 text-emerald-800', defColor: 'bg-emerald-50 text-emerald-700', rftColor: 'bg-emerald-100 text-emerald-800' },
                        { proc: 'Washing', dhu: '0.9', def: '4', rft: '98.7%', dhuColor: 'bg-emerald-100 text-emerald-800', defColor: 'bg-emerald-50 text-emerald-700', rftColor: 'bg-emerald-100 text-emerald-800' },
                        { proc: 'Printing', dhu: '1.7', def: '11', rft: '96.8%', dhuColor: 'bg-amber-50 text-amber-700', defColor: 'bg-amber-50 text-amber-700', rftColor: 'bg-emerald-50 text-emerald-700' },
                        { proc: 'Embroidery', dhu: '2.1', def: '14', rft: '95.9%', dhuColor: 'bg-rose-50 text-rose-700', defColor: 'bg-amber-50 text-amber-700', rftColor: 'bg-emerald-50 text-emerald-700' },
                        { proc: 'Packing', dhu: '1.3', def: '6', rft: '98.1%', dhuColor: 'bg-emerald-50 text-emerald-700', defColor: 'bg-emerald-50 text-emerald-700', rftColor: 'bg-emerald-100 text-emerald-800' },
                        { proc: 'Final Inspection', dhu: '0.8', def: '3', rft: '99.2%', dhuColor: 'bg-emerald-100 text-emerald-800', defColor: 'bg-emerald-50 text-emerald-700', rftColor: 'bg-emerald-100 text-emerald-800' },
                      ].map((row) => (
                        <tr key={row.proc} className="hover:bg-slate-50/50">
                          <td className="py-1.5 font-medium text-slate-800">{row.proc}</td>
                          <td className="py-1.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${row.dhuColor}`}>{row.dhu}</span>
                          </td>
                          <td className="py-1.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${row.defColor}`}>{row.def}</span>
                          </td>
                          <td className="py-1.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${row.rftColor}`}>{row.rft}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. Live Factory Activity (3 cols) */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Live Factory Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('audit')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Inspection completed', sub: 'PO-10023 - Final QC', time: '10:24 AM', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
                    { title: 'CAPA created', sub: 'CAPA-2026-014', time: '09:52 AM', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
                    { title: 'Audit finding updated', sub: 'ISO 9001:2015', time: '09:47 AM', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
                    { title: 'New defect added', sub: 'Defect #D-1023', time: '09:12 AM', icon: AlertCircle, color: 'text-purple-600 bg-purple-50' },
                    { title: 'Training completed', sub: 'Sewing Department', time: '07:34 AM', icon: GraduationCap, color: 'text-pink-600 bg-pink-50' },
                    { title: 'Risk assessment updated', sub: 'HIRA-2026-006', time: '06:50 AM', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
                    { title: 'Shipment dispatched', sub: 'PO-10022 - Logistics', time: '05:21 AM', icon: Boxes, color: 'text-teal-600 bg-teal-50' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${act.color}`}>
                          <act.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-slate-800 leading-tight truncate">
                            {act.title}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{act.sub}</div>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">
                        {act.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: Buyer & Order Intelligence (7 cols) & CAPA Performance (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Buyer & Order Intelligence Table (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Buyer &amp; Order Intelligence
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Quality compliance and AQL audit pass rate per global retail partner
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('buyer_order')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-2 px-2.5">Buyer</th>
                        <th className="py-2 px-2.5 text-center">Orders</th>
                        <th className="py-2 px-2.5 text-center">Inspection</th>
                        <th className="py-2 px-2.5 text-center">RFT</th>
                        <th className="py-2 px-2.5 text-center">DHU</th>
                        <th className="py-2 px-2.5 text-center">Complaints</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[11px]">
                      {[
                        { buyer: 'H&M', orders: 12, insp: 12, rft: '98.5%', dhu: '1.32', comp: 0, status: 'Good' },
                        { buyer: 'C&A', orders: 9, insp: 9, rft: '97.6%', dhu: '1.68', comp: 1, status: 'Good' },
                        { buyer: 'ZARA', orders: 8, insp: 8, rft: '96.7%', dhu: '1.94', comp: 2, status: 'Watch' },
                        { buyer: 'Walmart', orders: 7, insp: 7, rft: '99.1%', dhu: '1.21', comp: 0, status: 'Good' },
                        { buyer: 'Mango', orders: 6, insp: 6, rft: '97.9%', dhu: '1.76', comp: 1, status: 'Good' },
                      ].map((row) => (
                        <tr key={row.buyer} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2.5 font-bold text-slate-900">{row.buyer}</td>
                          <td className="py-2 px-2.5 text-center text-slate-600">{row.orders}</td>
                          <td className="py-2 px-2.5 text-center text-slate-600">{row.insp}</td>
                          <td className="py-2 px-2.5 text-center font-medium text-emerald-700 font-semibold">{row.rft}</td>
                          <td className="py-2 px-2.5 text-center text-slate-600">{row.dhu}</td>
                          <td className="py-2 px-2.5 text-center text-slate-600">{row.comp}</td>
                          <td className="py-2 px-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status === 'Good'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CAPA Performance Card (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      CAPA Performance &amp; Resolution
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      8D corrective action turnaround and root-cause closure rate
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('capa')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>View 8D CAPA</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 my-2">
                  {/* Donut Gauge */}
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e2e8f0"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#10b981"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset="28"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-lg font-extrabold text-slate-900 leading-tight">
                        89.2%
                      </div>
                      <div className="text-[8px] text-slate-400 font-medium">Closure Rate</div>
                    </div>
                  </div>

                  {/* Legend list & metrics */}
                  <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Open</span>
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">14</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>In Progress</span>
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">8</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Overdue</span>
                      </div>
                      <div className="text-base font-bold text-rose-600 mt-0.5">3</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Resolved</span>
                      </div>
                      <div className="text-base font-bold text-emerald-600 mt-0.5">126</div>
                    </div>
                  </div>
                </div>

                {/* Horizontal progress */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Resolution Performance Pace</span>
                    <span className="font-bold text-emerald-600">89.2% (Target ≥ 85%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '89.2%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 4: Recent Orders Table */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {/* Search input */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search orders..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Filter button */}
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filter</span>
                </button>

                {/* Columns button */}
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Columns className="w-3.5 h-3.5 text-slate-500" />
                  <span>Columns</span>
                </button>

                {/* Export button */}
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50/60">
                    <th className="py-2.5 px-3">PO No.</th>
                    <th className="py-2.5 px-3">Buyer</th>
                    <th className="py-2.5 px-3">Style</th>
                    <th className="py-2.5 px-3 text-right">Order Qty</th>
                    <th className="py-2.5 px-3 text-right">Inspection Qty</th>
                    <th className="py-2.5 px-3 text-right">Defect Qty</th>
                    <th className="py-2.5 px-3 text-right">RFT</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredOrders.map((order) => (
                    <tr key={order.poNo} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-blue-700">{order.poNo}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{order.buyer}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{order.style}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        {order.orderQty.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        {order.inspectionQty.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        {order.defectQty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        {order.rft}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'On Going'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-400">
                          <button
                            type="button"
                            onClick={() => onNavigateTab('buyer_order')}
                            title="View Order"
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateTab('buyer_order')}
                            title="Edit Order"
                            className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleExportReport}
                            title="Download Details"
                            className="p-1 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing 1-5 of 42 orders</span>
              <div className="flex items-center gap-1 font-medium">
                <button
                  type="button"
                  disabled={orderPage === 1}
                  onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOrderPage(1)}
                  className={`px-2.5 py-0.5 rounded border ${
                    orderPage === 1 ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => setOrderPage(2)}
                  className={`px-2.5 py-0.5 rounded border ${
                    orderPage === 2 ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => setOrderPage(3)}
                  className={`px-2.5 py-0.5 rounded border ${
                    orderPage === 3 ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  3
                </button>
                <button
                  type="button"
                  disabled={orderPage === 3}
                  onClick={() => setOrderPage((p) => Math.min(3, p + 1))}
                  className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT WIDGETS COLUMN (3 COLS) */}
        <div className="xl:col-span-3 space-y-5">
          {/* 1. Recent Activities Widget */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent Activities
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('inspections')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Act 1 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 leading-snug">
                    Inspection Report <span className="font-mono text-blue-600">#INS-2026-0927</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Completed by Rahim (QC)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">2 hours ago</div>
                </div>
              </div>

              {/* Act 2 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 leading-snug">
                    CAPA <span className="font-mono text-amber-600">#CAPA-2026-014</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Status updated to In Progress</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">3 hours ago</div>
                </div>
              </div>

              {/* Act 3 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 leading-snug">
                    Audit <span className="font-mono text-indigo-600">#AUD-2026-008</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Closed with 0 NC</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">5 hours ago</div>
                </div>
              </div>

              {/* Act 4 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 leading-snug">
                    Defect Library
                  </div>
                  <div className="text-[11px] text-slate-500">New defect added: Hole</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">6 hours ago</div>
                </div>
              </div>

              {/* Act 5 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 leading-snug">
                    Training Record <span className="font-mono text-purple-600">#TR-2026-021</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Completed by 12 employees</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">8 hours ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Quick Actions (8 Vibrant Colored Buttons) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3.5">
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Inspection */}
              <button
                type="button"
                onClick={() => onNavigateTab('inspections')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">Inspection</span>
              </button>

              {/* CAPA */}
              <button
                type="button"
                onClick={() => onNavigateTab('capa')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <GitPullRequest className="w-4 h-4 shrink-0" />
                <span className="truncate">CAPA</span>
              </button>

              {/* Audit */}
              <button
                type="button"
                onClick={() => onNavigateTab('audit')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="truncate">Audit</span>
              </button>

              {/* Risk */}
              <button
                type="button"
                onClick={() => onNavigateTab('risk_assessment')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="truncate">Risk</span>
              </button>

              {/* Traceability */}
              <button
                type="button"
                onClick={() => onNavigateTab('traceability')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span className="truncate">Traceability</span>
              </button>

              {/* Report */}
              <button
                type="button"
                onClick={handleExportReport}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <FileBarChart className="w-4 h-4 shrink-0" />
                <span className="truncate">Report</span>
              </button>

              {/* Document */}
              <button
                type="button"
                onClick={() => onNavigateTab('document_control')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-500 hover:bg-slate-600 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">Document</span>
              </button>

              {/* Training */}
              <button
                type="button"
                onClick={() => onNavigateTab('training')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span className="truncate">Training</span>
              </button>
            </div>
          </div>


          {/* 4. System Information Widget */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              System Information
            </h3>

            <div className="flex items-center justify-center my-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset="28"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-base font-extrabold text-slate-900 leading-tight">
                    89.2%
                  </div>
                  <div className="text-[8px] text-slate-400 font-medium">Closure Rate</div>
                </div>
              </div>
            </div>

            {/* Counts list */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 mt-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Open: 14</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>In Prog: 8</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Overdue: 3</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Closed: 126</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 font-medium">Closure Rate</span>
              <span className="font-bold text-slate-900">88.2%</span>
            </div>
          </div>

          {/* 5. Quick Command Floating Box */}
          {showQuickCommand && (
            <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-lg animate-in slide-in-from-bottom-2">
              {/* Header */}
              <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Quick Command</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickCommand(false)}
                  className="text-blue-100 hover:text-white p-0.5 rounded cursor-pointer"
                  title="Close Quick Command"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Commands Grid */}
              <div className="p-3.5 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={onOpenNewInspection}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">New inspection</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('risk_assessment')}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Add Risk</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('capa')}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">New CAPA</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('document_control')}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">Add Document</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('audit')}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">New Audit</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportReport}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer text-left"
                >
                  <FileBarChart className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">Generate Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('defects_library')}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors cursor-pointer text-left col-span-2"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Add Defect</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
