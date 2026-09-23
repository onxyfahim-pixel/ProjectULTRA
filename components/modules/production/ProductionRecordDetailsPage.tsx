'use client';

import React from 'react';
import {
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Gauge,
  Target,
  Edit,
  Trash2,
  Activity,
  Plus,
  Building2,
  Tag,
  Users,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  Package,
  Award,
} from 'lucide-react';
import { ProductionOrder, LineStatus, TopDefectSummary } from '@/lib/types/erp';
import { OutputLogEntry } from './LogOutputModal';

interface ProductionRecordDetailsPageProps {
  order: ProductionOrder;
  outputLogs?: OutputLogEntry[];
  onBack: () => void;
  onEdit: (order: ProductionOrder) => void;
  onDelete: (order: ProductionOrder) => void;
  onLogOutput?: () => void;
  showToast: (msg: string) => void;
}

export function ProductionRecordDetailsPage({
  order,
  outputLogs = [],
  onBack,
  onEdit,
  onDelete,
  onLogOutput,
  showToast,
}: ProductionRecordDetailsPageProps) {
  const target = order.targetQuantity || 1;
  const completed = order.completedQuantity || 0;
  const pct = Math.min(Math.round((completed / target) * 100), 100);
  const defects = order.totalDefects ?? Math.round(completed * ((order.dhuRate || order.defectRate || 1.2) / 100));
  const dhu = Number((order.dhuRate ?? order.defectRate ?? 1.2).toFixed(2));
  const rft = Number((order.rftRate ?? (100 - dhu * 1.2)).toFixed(1));
  const eff = Number((order.efficiencyPercent ?? 82).toFixed(1));
  const reject = order.rejectQuantity ?? Math.max(Math.round(completed * 0.002), 5);
  const rejectRate = completed > 0 ? ((reject / completed) * 100).toFixed(2) : '0.00';

  const daysLeft = Math.ceil(
    (new Date(order.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Compute Top 3 Defects from record or hourly breakdown
  const top3Defects: TopDefectSummary[] = order.top3Defects && order.top3Defects.length > 0
    ? order.top3Defects
    : (() => {
        const map: Record<string, number> = {};
        (order.hourlyReports || []).forEach((hr) => {
          if (hr.defectBreakdown && hr.defectBreakdown.length > 0) {
            hr.defectBreakdown.forEach((db) => {
              if (db.count > 0 && db.defectType && db.defectType !== 'None') {
                map[db.defectType] = (map[db.defectType] || 0) + db.count;
              }
            });
          } else if (hr.topDefect && hr.topDefect !== 'None' && hr.topDefect !== 'None / Clean Pass' && hr.defectQty > 0) {
            map[hr.topDefect] = (map[hr.topDefect] || 0) + hr.defectQty;
          }
        });
        const tot = Object.values(map).reduce((a, b) => a + b, 0);
        return Object.entries(map)
          .filter(([_, c]) => c > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([defectType, count]) => ({
            defectType,
            count,
            percentage: tot > 0 ? Number(((count / tot) * 100).toFixed(1)) : 0,
          }));
      })();

  const orderLogs = outputLogs.filter((l) => l.productionOrderId === order.id);

  const statusMap: Record<LineStatus, { label: string; cls: string }> = {
    RUNNING: { label: 'Running', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    PAUSED: { label: 'Paused / Hold', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  const statusInfo = statusMap[order.status] || statusMap.RUNNING;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Navigation Bar matching Buyer & Order */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Records"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {order.orderNumber}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.cls}`}>
                {statusInfo.label}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span>{order.recordDate || order.createdAt?.split('T')[0] || 'Today'}</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Building2 className="w-3 h-3 text-slate-500" />
                <span>{order.unit || 'Unit 01'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>QC: {order.qualityInspector?.split('(')[0].trim() || 'Md. Rafiqul Islam'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {order.buyer} • Style: {order.styleNumber || 'STY-PROD'} — {order.styleName} • Section: {order.section || order.sewingLine} {order.shift ? `• ${order.shift.split('(')[0]}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(order)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Record</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(order)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 px-6 py-5 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                  {order.orderNumber}
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-200 font-semibold px-2.5 py-0.5 rounded-md border border-emerald-400/30">
                  <Calendar className="w-3 h-3" />
                  <span>Record Date: {order.recordDate || order.createdAt?.split('T')[0] || 'Active'}</span>
                </span>
                {order.shift && (
                  <span className="inline-flex items-center gap-1 text-xs bg-indigo-500/20 text-indigo-200 font-semibold px-2.5 py-0.5 rounded-md border border-indigo-400/30">
                    <Clock className="w-3 h-3" />
                    <span>{order.shift}</span>
                  </span>
                )}
                <span className="text-xs bg-blue-500/20 text-blue-200 font-semibold px-2 py-0.5 rounded-md border border-blue-400/30">
                  {order.unit || 'Unit 01'}
                </span>
                <span className="text-xs bg-slate-500/30 text-slate-200 font-semibold px-2 py-0.5 rounded-md border border-slate-400/30">
                  {order.section || order.sewingLine}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {order.styleName}
              </h1>
              <p className="text-xs text-blue-200 font-medium">
                Buyer: <strong className="text-white">{order.buyer}</strong> | Style Code: <span className="font-mono text-white">{order.styleNumber || 'STY-001'}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/15">
              <div>
                <div className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">Ship Date / Deadline</div>
                <div className="text-sm font-bold font-mono text-white">
                  {new Date(order.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded-md ${daysLeft < 0 ? 'bg-rose-500/30 text-rose-200' : daysLeft <= 7 ? 'bg-amber-500/30 text-amber-200' : 'bg-emerald-500/30 text-emerald-200'}`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d Overdue` : `${daysLeft}d left`}
              </div>
            </div>
          </div>
        </div>

        {/* 11-METRIC KPI STRIP ACROSS RECORD */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/60 p-4 gap-y-3">
          <div className="px-3 py-1">
            <div className="text-[11px] font-semibold text-slate-500">Target</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {target.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">Pcs scheduled</div>
          </div>

          <div className="px-3 py-1">
            <div className="text-[11px] font-semibold text-slate-500">Total Production</div>
            <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">
              {completed.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">{pct}% of target</div>
          </div>

          <div className="px-3 py-1">
            <div className="text-[11px] font-semibold text-slate-500">Total Defects</div>
            <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
              {defects.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">Defect events</div>
          </div>

          <div className="px-3 py-1">
            <div className="text-[11px] font-semibold text-slate-500">DHU Rate</div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${dhu <= 2.0 ? 'text-emerald-700' : dhu <= 3.0 ? 'text-amber-700' : 'text-rose-700'}`}>
              {dhu}%
            </div>
            <div className="text-[10px] text-slate-400">Limit: ≤ 2.0%</div>
          </div>

          <div className="px-3 py-1">
            <div className="text-[11px] font-semibold text-slate-500">RFT (Right First Time)</div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${rft >= 95 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {rft}%
            </div>
            <div className="text-[10px] text-slate-400">Target: ≥ 95.0%</div>
          </div>

          <div className="px-3 py-1">
            <div className="text-[11px] font-semibold text-slate-500">Efficiency & Rejects</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-lg font-bold font-mono ${eff >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {eff}%
              </span>
              <span className="text-xs text-rose-600 font-mono font-semibold">
                / {reject} rej
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Scrap: {rejectRate}%</div>
          </div>
        </div>
      </div>

      {/* Production & Quality Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Target Accomplishment & Quality Breakdown */}
        <div className="lg:col-span-2 space-y-5">
          {/* Progress & Target Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Production Pacing & Target Completion
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-slate-700">
                {completed.toLocaleString()} / {target.toLocaleString()} pcs
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Output Progress</span>
                <span className="font-bold text-slate-900">{pct}% Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-blue-600' : 'bg-amber-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Completed: <strong className="text-slate-800 font-mono">{completed.toLocaleString()}</strong> pcs</span>
                <span>Remaining: <strong className="text-slate-800 font-mono">{Math.max(target - completed, 0).toLocaleString()}</strong> pcs</span>
              </div>
            </div>

            {/* Section & Line Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-medium">Manufacturing Unit</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{order.unit || 'Unit 01'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-medium">Floor Section</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{order.section || order.sewingLine}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-medium">Active Operators</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{order.operatorCount || 48} Operators</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-medium">SMV Target</div>
                <div className="text-xs font-bold text-indigo-700 mt-0.5 font-mono">{order.smvTarget || 18.5} min</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-medium">Supervisor</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{order.supervisorName || 'Floor Sup'}</div>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                <div className="text-[10px] text-emerald-800 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Quality Inspector
                </div>
                <div className="text-xs font-bold text-emerald-950 mt-0.5 truncate" title={order.qualityInspector || 'Assigned QC'}>
                  {order.qualityInspector || 'Md. Rafiqul Islam'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-medium">Item / Material</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={order.itemInfo || 'Export Garment Fabric'}>
                  {order.itemInfo || 'Export Garment Fabric'}
                </div>
              </div>
            </div>
          </div>

          {/* Quality Analysis & Defect Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Quality Audit & Defect Control
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                ISO 9001:2015 & AQL 1.5 Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                <div className="text-xs text-slate-500 font-medium">DHU (Defects / 100 Units)</div>
                <div className={`text-2xl font-black font-mono ${dhu <= 2.0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {dhu}%
                </div>
                <div className="text-[11px] text-slate-500">
                  {dhu <= 2.0 ? '✓ Within tolerance threshold' : '⚠ Exceeds 2.0% target'}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                <div className="text-xs text-slate-500 font-medium">RFT (Right First Time)</div>
                <div className={`text-2xl font-black font-mono ${rft >= 95 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {rft}%
                </div>
                <div className="text-[11px] text-slate-500">
                  {rft >= 95 ? '✓ Passing first-pass QA' : 'Needs rework reduction'}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                <div className="text-xs text-slate-500 font-medium">Garment Rejection / Scrap</div>
                <div className="text-2xl font-black font-mono text-rose-700">
                  {reject} <span className="text-xs font-normal text-slate-500">pcs ({rejectRate}%)</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Unrecoverable scrap count
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Logs & Operator Pace */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Shift Production Logs
                </h3>
              </div>
            </div>

            {orderLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No shift logs recorded today for this order.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
                {orderLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200/80 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span>Shift {log.shift} • {log.date}</span>
                      <span className="font-mono font-bold text-blue-700">+{log.actualOutput} pcs</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Eff: <strong className="text-slate-700 font-mono">{log.efficiencyPercent}%</strong></span>
                      <span>DHU: <strong className="text-slate-700 font-mono">{log.dhuPercent}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remarks & Technical notes */}
          {order.remarks && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-slate-500" />
                Supervisor Notes
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {order.remarks}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED HOURLY PRODUCTION & QUALITY REPORT SHEET */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Hourly Production & Quality Monitoring Sheet
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {order.hourlyReports && order.hourlyReports.length > 0
                    ? `${order.hourlyReports.length} Hours Tracked`
                    : 'Not Logged'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Hour-by-hour output, garments checked, defective count, granular defect breakdown, and inline DHU% & RFT% pacing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onEdit(order)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Hourly Sheet</span>
          </button>
        </div>

        {/* TOP 3 IDENTIFIED DEFECTS BANNER */}
        {top3Defects.length > 0 && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-xl text-white shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Top 3 Identified Defects
                </h4>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">
                Pareto QC defect ranking for this production record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              {top3Defects.map((td, rank) => {
                const rankLabels = ['Rank #1 (Major Issue)', 'Rank #2', 'Rank #3'];
                const rankBadges = [
                  'bg-amber-400/20 text-amber-300 border-amber-400/40',
                  'bg-slate-300/20 text-slate-200 border-slate-300/40',
                  'bg-amber-700/30 text-amber-200 border-amber-600/40',
                ];

                return (
                  <div
                    key={td.defectType}
                    className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${rankBadges[rank]}`}>
                        {rankLabels[rank]}
                      </span>
                      <span className="font-mono font-bold text-sm text-white">
                        {td.count} <span className="text-[10px] font-normal text-slate-300">pcs ({td.percentage}%)</span>
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {td.defectType}
                    </div>
                    <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(td.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.hourlyReports && order.hourlyReports.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-32">Hour Slot</th>
                    <th className="py-2.5 px-3 w-24 text-right">Target</th>
                    <th className="py-2.5 px-3 w-28 text-right bg-blue-50/50">Total Checked</th>
                    <th className="py-2.5 px-3 w-24 text-right bg-emerald-50/50">Passed</th>
                    <th className="py-2.5 px-3 w-24 text-right bg-rose-50/50">Defects</th>
                    <th className="py-2.5 px-3 w-24 text-right">DHU %</th>
                    <th className="py-2.5 px-3 w-24 text-right">RFT %</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Specific Defects Logged</th>
                    <th className="py-2.5 px-3">Workstation / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.hourlyReports.map((hr, idx) => {
                    const dhu = hr.defectRate || 0;
                    const rftVal = hr.rftRate ?? (hr.checkedQty > 0 ? Number((Math.max(0, hr.checkedQty - hr.defectQty) / hr.checkedQty * 100).toFixed(1)) : 100);

                    const dhuBadge =
                      dhu === 0
                        ? 'bg-slate-100 text-slate-600'
                        : dhu <= 1.5
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : dhu <= 2.5
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200';

                    const rftBadge =
                      rftVal >= 97
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : rftVal >= 94
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200';

                    const breakdown = hr.defectBreakdown || [];

                    return (
                      <tr key={hr.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {hr.hourSlot}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {hr.targetQty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/20">
                          {hr.checkedQty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">
                          {hr.passedQty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 bg-rose-50/20">
                          {hr.defectQty}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${dhuBadge}`}
                          >
                            {dhu.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${rftBadge}`}
                          >
                            {rftVal.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {breakdown.length > 0 ? (
                              breakdown.map((db) => (
                                <span
                                  key={db.defectType}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                                >
                                  <span>{db.defectType}:</span>
                                  <strong className="font-mono">{db.count}</strong>
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium">
                                {hr.topDefect || 'None / Clean Pass'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {hr.remarks || hr.operatorId || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Aggregated Totals Row */}
            {(() => {
              const totTarget = order.hourlyReports.reduce((s, h) => s + (h.targetQty || 0), 0);
              const totChecked = order.hourlyReports.reduce((s, h) => s + (h.checkedQty || 0), 0);
              const totPassed = order.hourlyReports.reduce((s, h) => s + (h.passedQty || 0), 0);
              const totDefects = order.hourlyReports.reduce((s, h) => s + (h.defectQty || 0), 0);
              const avgDhu = totChecked > 0 ? ((totDefects / totChecked) * 100).toFixed(2) : '0.00';
              const avgRft = totChecked > 0 ? (Math.max(0, (totChecked - totDefects) / totChecked) * 100).toFixed(1) : '100.0';

              return (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Scheduled Target</div>
                    <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">{totTarget.toLocaleString()} pcs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-600 font-semibold uppercase">Total Checked By QC</div>
                    <div className="text-sm font-bold font-mono text-blue-700 mt-0.5">{totChecked.toLocaleString()} pcs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600 font-semibold uppercase">Total Quality Passed</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">{totPassed.toLocaleString()} pcs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-600 font-semibold uppercase">Total Defects Found</div>
                    <div className="text-sm font-bold font-mono text-rose-700 mt-0.5">{totDefects.toLocaleString()} def</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Overall Line DHU%</div>
                    <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">{avgDhu}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-indigo-600 font-semibold uppercase">Overall Line RFT%</div>
                    <div className="text-sm font-bold font-mono text-indigo-700 mt-0.5">{avgRft}%</div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-3">
            <Activity className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-xs font-semibold text-slate-700">No hourly reports recorded for this production date yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Log hourly sewing inspections to monitor real-time sewing line defect rates and efficiency.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(order)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hourly Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

