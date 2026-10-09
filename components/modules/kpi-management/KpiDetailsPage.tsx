'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Building2,
  Layers,
  FileText,
  User,
  CheckSquare,
  Plus,
  Check,
  Percent,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  Activity,
  History,
  FileDown,
} from 'lucide-react';
import {
  KpiMetric,
  KpiStatus,
  KpiTrend,
  KpiHistoryPoint,
  KpiActionItem,
} from '@/lib/types/modules';
import { KPI_CATEGORY_CONFIG } from './kpi-management-data';
import { KpiSingleExportModal } from './KpiSingleExportModal';
import { useModulePermission } from '@/hooks/use-module-permission';

interface KpiDetailsPageProps {
  kpi: KpiMetric;
  onBack: () => void;
  onEdit: (kpi: KpiMetric) => void;
  onDuplicate: (kpi: KpiMetric) => void;
  onDelete: (kpi: KpiMetric) => void;
  onUpdateKpi?: (updated: KpiMetric) => void;
  showToast: (msg: string) => void;
}

export function KpiDetailsPage({
  kpi,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateKpi,
  showToast,
}: KpiDetailsPageProps) {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('kpi_management');
  const [currentKpi, setCurrentKpi] = useState<KpiMetric>(kpi);
  const [history, setHistory] = useState<KpiHistoryPoint[]>(kpi.history || []);
  const [actionItems, setActionItems] = useState<KpiActionItem[]>(kpi.actionItems || []);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Quick Log Measurement Form State
  const [showLogForm, setShowLogForm] = useState(false);
  const [logPeriod, setLogPeriod] = useState(`Week ${Math.floor(Math.random() * 40) + 1} 2026`);
  const [logValue, setLogValue] = useState<number>(kpi.currentValue);
  const [logSampleSize, setLogSampleSize] = useState<number>(100000);
  const [logRemarks, setLogRemarks] = useState('');
  const [logBy, setLogBy] = useState('Tanzim Ahmed');

  // Quick Add Corrective Action Form State
  const [showAddAction, setShowAddAction] = useState(false);
  const [actionTask, setActionTask] = useState('');
  const [actionAssignee, setActionAssignee] = useState('');
  const [actionDept, setActionDept] = useState(kpi.department || 'Quality Assurance');
  const [actionDueDate, setActionDueDate] = useState('');
  const [actionPriority, setActionPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // Update Status
  const handleStatusChange = (newStatus: KpiStatus) => {
    const updated: KpiMetric = {
      ...currentKpi,
      status: newStatus,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setCurrentKpi(updated);
    onUpdateKpi?.(updated);
    showToast(`KPI health status set to ${newStatus.replace('_', ' ')}`);
  };

  // Update Trend
  const handleTrendChange = (newTrend: KpiTrend) => {
    const updated: KpiMetric = {
      ...currentKpi,
      trend: newTrend,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setCurrentKpi(updated);
    onUpdateKpi?.(updated);
    showToast(`KPI trend direction set to ${newTrend}`);
  };

  // Log new measurement
  const handleLogMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(logValue)) {
      showToast('Please enter a valid numeric measurement');
      return;
    }

    const newPoint: KpiHistoryPoint = {
      id: `h-${Date.now()}`,
      period: logPeriod.trim(),
      value: Number(logValue),
      target: currentKpi.targetValue,
      sampleSize: Number(logSampleSize) || undefined,
      loggedBy: logBy.trim(),
      remarks: logRemarks.trim() || undefined,
    };

    const updatedHistory = [...history, newPoint];
    setHistory(updatedHistory);

    // Auto calculate trend and status based on latest reading
    let newTrend: KpiTrend = currentKpi.trend;
    if (history.length > 0) {
      const prev = history[history.length - 1].value;
      if (logValue > prev) newTrend = 'UP';
      else if (logValue < prev) newTrend = 'DOWN';
      else newTrend = 'STABLE';
    }

    const updated: KpiMetric = {
      ...currentKpi,
      currentValue: Number(logValue),
      trend: newTrend,
      history: updatedHistory,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setCurrentKpi(updated);
    onUpdateKpi?.(updated);
    setShowLogForm(false);
    setLogRemarks('');
    showToast(`Logged new reading: ${logValue} ${currentKpi.unit}`);
  };

  // Toggle Action item
  const handleToggleAction = (index: number) => {
    const updatedActions = [...actionItems];
    const item = updatedActions[index];
    const isNowDone = !item.completed;
    updatedActions[index] = {
      ...item,
      completed: isNowDone,
      completedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined,
    };
    setActionItems(updatedActions);

    const updated: KpiMetric = {
      ...currentKpi,
      actionItems: updatedActions,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setCurrentKpi(updated);
    onUpdateKpi?.(updated);
    showToast(isNowDone ? 'Action item marked as complete' : 'Action item reopened');
  };

  // Add Action Item
  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTask.trim() || !actionAssignee.trim()) {
      showToast('Please specify task and assignee');
      return;
    }

    const newAction: KpiActionItem = {
      id: `act-kpi-${Date.now()}`,
      task: actionTask.trim(),
      assignee: actionAssignee.trim(),
      department: actionDept.trim(),
      dueDate: actionDueDate || new Date().toISOString().split('T')[0],
      priority: actionPriority,
      completed: false,
    };

    const updatedActions = [...actionItems, newAction];
    setActionItems(updatedActions);

    const updated: KpiMetric = {
      ...currentKpi,
      actionItems: updatedActions,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setCurrentKpi(updated);
    onUpdateKpi?.(updated);

    setActionTask('');
    setActionAssignee('');
    setShowAddAction(false);
    showToast('Corrective action assigned');
  };

  // Category Configuration
  const catCfg = KPI_CATEGORY_CONFIG[currentKpi.category] || {
    label: currentKpi.category,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    tone: 'blue',
  };

  // Variance & Direction Calculation
  const isLowerBetter = currentKpi.desiredDirection === 'LOWER_IS_BETTER' || currentKpi.metricName.toLowerCase().includes('dhu') || currentKpi.metricName.toLowerCase().includes('cost') || currentKpi.metricName.toLowerCase().includes('incident');
  const delta = currentKpi.currentValue - currentKpi.targetValue;
  const isFavorable = isLowerBetter ? delta <= 0 : delta >= 0;
  const variancePct = currentKpi.targetValue !== 0 ? Math.abs((delta / currentKpi.targetValue) * 100).toFixed(1) : '0';

  const isTrendPositive =
    (currentKpi.trend === 'DOWN' && isLowerBetter) ||
    (currentKpi.trend === 'UP' && !isLowerBetter);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 xl:p-8 animate-in fade-in duration-150">
      <div className="w-full max-w-[1920px] mx-auto space-y-6 pb-20">
        {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Back to KPI Scorecard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {currentKpi.kpiCode || 'KPI-MOD-13'}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catCfg.badgeClass}`}>
                {catCfg.label}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1 line-clamp-1">
              {currentKpi.metricName}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Health Status Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Health:</span>
            <select
              value={currentKpi.status}
              disabled={!canEdit}
              onChange={(e) => handleStatusChange(e.target.value as KpiStatus)}
              className="text-xs font-bold bg-transparent border-none text-slate-800 focus:outline-hidden cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">At Risk</option>
              <option value="CRITICAL">Critical</option>
              <option value="EXCEEDED">Exceeded Target</option>
            </select>
          </div>

          {/* Trend Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Trend:</span>
            <select
              value={currentKpi.trend}
              disabled={!canEdit}
              onChange={(e) => handleTrendChange(e.target.value as KpiTrend)}
              className="text-xs font-bold bg-transparent border-none text-slate-800 focus:outline-hidden cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="UP">Upward</option>
              <option value="DOWN">Downward</option>
              <option value="STABLE">Stable</option>
            </select>
          </div>

          {/* Export Button */}
          {canExport && (
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Export Performance Dossier (PDF / Excel)"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Export</span>
            </button>
          )}

          {/* Duplicate Button */}
          {canCreate && (
            <button
              type="button"
              onClick={() => onDuplicate(currentKpi)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Duplicate Indicator"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Duplicate</span>
            </button>
          )}

          {/* Edit Button */}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(currentKpi)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Metric</span>
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(currentKpi)}
              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete Metric"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Hero Performance Metric Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Actual Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Current Reading</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
            {currentKpi.currentValue} <span className="text-sm font-normal text-slate-500">{currentKpi.unit}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono mt-1">
            <span className="text-slate-400">Target:</span>
            <span className="font-semibold text-slate-700">{currentKpi.targetValue} {currentKpi.unit}</span>
          </div>
        </div>

        {/* Variance vs Target */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Target Variance</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl sm:text-2xl font-bold ${isFavorable ? 'text-emerald-700' : 'text-amber-700'}`}>
              {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">({variancePct}%)</span>
          </div>
          <div className="text-[11px] font-medium mt-1">
            {isFavorable ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Favorable Variance
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Variance Attention Needed
              </span>
            )}
          </div>
        </div>

        {/* Directional Trend */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Directional Trend</span>
            {currentKpi.trend === 'UP' ? (
              <TrendingUp className={`w-4 h-4 ${isTrendPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
            ) : currentKpi.trend === 'DOWN' ? (
              <TrendingDown className={`w-4 h-4 ${isTrendPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
            ) : (
              <Activity className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 flex items-center gap-1.5">
            <span className={isTrendPositive ? 'text-emerald-700' : 'text-rose-700'}>
              {currentKpi.trend}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1">
            {isTrendPositive ? 'Improving trend momentum' : 'Adverse trajectory vs target'}
          </div>
        </div>

        {/* Benchmark Standard */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Industry Standard</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 line-clamp-1">
            {currentKpi.benchmark}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1">
            Freq: <span className="font-semibold text-slate-700">{currentKpi.frequency || 'Daily Floor Check'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Details & Actions, Right Column Specs & Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): History & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Trend History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Performance History &amp; Monthly Trajectory ({history.length} Readings)
                </h2>
              </div>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setShowLogForm(!showLogForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Measurement</span>
                </button>
              )}
            </div>

            {/* Quick Log Form */}
            {showLogForm && (
              <form onSubmit={handleLogMeasurement} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Record New Operational Reading</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Period / Date *</label>
                    <input
                      type="text"
                      value={logPeriod}
                      onChange={(e) => setLogPeriod(e.target.value)}
                      placeholder="e.g., Week 39 2026 or Oct 2026"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Measurement Value ({currentKpi.unit}) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={logValue}
                      onChange={(e) => setLogValue(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Sample Size (Units)</label>
                    <input
                      type="number"
                      value={logSampleSize}
                      onChange={(e) => setLogSampleSize(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Observations / Root-Cause Remarks</label>
                  <input
                    type="text"
                    value={logRemarks}
                    onChange={(e) => setLogRemarks(e.target.value)}
                    placeholder="e.g., Machine 12 timing adjusted; 0.2% drop in broken stitches observed..."
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLogForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Save Reading
                  </button>
                </div>
              </form>
            )}

            {/* Historical Readings Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3 text-right">Actual ({currentKpi.unit})</th>
                    <th className="py-2.5 px-3 text-right">Target</th>
                    <th className="py-2.5 px-3 text-right">Sample Size</th>
                    <th className="py-2.5 px-3">Logged By</th>
                    <th className="py-2.5 px-3">Remarks / Root Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((pt) => {
                    const diff = pt.value - (pt.target ?? currentKpi.targetValue);
                    const pointFavorable = isLowerBetter ? diff <= 0 : diff >= 0;

                    return (
                      <tr key={pt.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                          {pt.period}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={pointFavorable ? 'text-emerald-700' : 'text-amber-700'}>
                            {pt.value}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {pt.target ?? currentKpi.targetValue}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {pt.sampleSize ? pt.sampleSize.toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {pt.loggedBy || 'QA Inspector'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                          {pt.remarks || 'Standard production monitoring'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Corrective Action Plan (CAPA Linkage) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Corrective Actions &amp; Remediation Plan ({actionItems.length})
                </h2>
              </div>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setShowAddAction(!showAddAction)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Action</span>
                </button>
              )}
            </div>

            {/* Quick Add Action Form */}
            {showAddAction && (
              <form onSubmit={handleAddAction} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">New Corrective Action Task</h4>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Action Description *</label>
                  <input
                    type="text"
                    value={actionTask}
                    onChange={(e) => setActionTask(e.target.value)}
                    placeholder="e.g., Install edge guide attachments on Line 04 flatlock hem operations..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Assignee *</label>
                    <input
                      type="text"
                      value={actionAssignee}
                      onChange={(e) => setActionAssignee(e.target.value)}
                      placeholder="e.g., Babul Akter"
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Department</label>
                    <input
                      type="text"
                      value={actionDept}
                      onChange={(e) => setActionDept(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={actionDueDate}
                      onChange={(e) => setActionDueDate(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Priority</label>
                    <select
                      value={actionPriority}
                      onChange={(e) => setActionPriority(e.target.value as any)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAction(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Assign Task
                  </button>
                </div>
              </form>
            )}

            {/* Action Items List */}
            {actionItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                No active corrective actions assigned to this metric.
              </div>
            ) : (
              <div className="space-y-2.5">
                {actionItems.map((act, idx) => (
                  <div
                    key={act.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      act.completed
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggleAction(idx)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                          act.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-blue-500 bg-white'
                        }`}
                        title={act.completed ? 'Click to reopen' : 'Click to complete'}
                      >
                        {act.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p
                            className={`text-xs font-medium leading-snug ${
                              act.completed ? 'line-through text-slate-500' : 'text-slate-900 font-semibold'
                            }`}
                          >
                            {act.task}
                          </p>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              act.completed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {act.completed ? 'Done' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                          <span>Assignee: <strong className="text-slate-800">{act.assignee}</strong> ({act.department})</span>
                          <span className="font-mono">Due: <strong>{act.dueDate}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Operational Specs & Calculation Methodology */}
        <div className="space-y-6">
          {/* Operational Context Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Operational Scope &amp; Governance
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Department:
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {currentKpi.department || 'Garment Production'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Metric Owner:
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {currentKpi.ownerName || 'Quality Lead'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Frequency:
                </span>
                <span className="font-mono text-slate-800">
                  {currentKpi.frequency || 'Daily Floor Check'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-slate-400" /> Desired Direction:
                </span>
                <span className="font-semibold text-slate-800">
                  {isLowerBetter ? 'Lower is Better (Minimization)' : 'Higher is Better (Conformity)'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Last Calibration:
                </span>
                <span className="font-mono text-slate-800">
                  {currentKpi.lastUpdated || '2026-09-24'}
                </span>
              </div>
            </div>
          </div>

          {/* Mathematical Formula Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Calculation Logic &amp; Formula
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-xs text-slate-800 leading-relaxed">
              {currentKpi.formula || 'Standard Statistical Quality Control formula'}
            </div>

            {currentKpi.description && (
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentKpi.description}
              </p>
            )}

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-snug">
              Audited in compliance with ISO 9001:2015 Clause 9.1 (Monitoring, Measurement, Analysis & Evaluation).
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Individual KPI Export Modal */}
      <KpiSingleExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        kpi={currentKpi}
      />
    </div>
  );
}
