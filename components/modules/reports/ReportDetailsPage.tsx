'use client';

import React, { useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  FileCheck,
  Layers,
  Sparkles,
  PieChart,
  Target,
  Clock,
  Send,
  BadgeCheck,
  FileDown,
} from 'lucide-react';
import {
  ReportRecord,
  REPORT_CATEGORY_CONFIG,
  ReportStatus,
} from './reports-data';
import { useModulePermission } from '@/hooks/use-module-permission';
import { ReportSingleExportModal } from './ReportSingleExportModal';

interface ReportDetailsPageProps {
  report: ReportRecord;
  onBack: () => void;
  onUpdateStatus?: (report: ReportRecord) => void;
  onExportCsv?: (report: ReportRecord) => void;
}

export function ReportDetailsPage({
  report,
  onBack,
  onUpdateStatus,
  onExportCsv,
}: ReportDetailsPageProps) {
  const { canEdit, canExport } = useModulePermission('report_analysis');
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  // ESC key listener to exit full-screen view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const catConfig = REPORT_CATEGORY_CONFIG[report.category] || {
    label: report.category,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Published
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Approved
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Review
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  const handleQuickStatusCycle = () => {
    const sequence: ReportStatus[] = ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'];
    const currentIndex = sequence.indexOf(report.status);
    const nextStatus = sequence[(currentIndex + 1) % sequence.length];
    onUpdateStatus?.({
      ...report,
      status: nextStatus,
    });
  };

  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv(report);
      return;
    }
    // Instant CSV generation
    const rows = [
      ['Metric', 'Target', 'Actual', 'Variance', 'Status'],
      ...report.metricsTable.map((m) => [m.metric, m.target, m.actual, m.variance, m.status]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.id}_metrics_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 xl:p-8 animate-in fade-in duration-150">
      <div className="w-full max-w-[1920px] mx-auto space-y-6 pb-20">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Return to Report List (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {report.id}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
                >
                  {catConfig.label}
                </span>
                {getStatusBadge(report.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {canEdit && (
              <button
                type="button"
                onClick={handleQuickStatusCycle}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                title="Cycle status: Draft -> Under Review -> Approved -> Published"
              >
                <BadgeCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Update Status</span>
              </button>
            )}

            {canExport && (
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Report Hero Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{report.department}</span>
                <span>•</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{report.period}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {report.title}
              </h1>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Author</p>
                  <p className="font-medium text-slate-800">{report.generatedBy}</p>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Generated Date</p>
                <p className="font-medium text-slate-800">{report.generatedDate}</p>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Format & Size</p>
                <p className="font-medium text-slate-800">
                  {report.format} • {report.fileSize}
                </p>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="pt-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Executive Summary
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              {report.summary}
            </p>
          </div>
        </div>

        {/* KPI Metrics Snapshot Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Key Performance Indicator Snapshot
            </h2>
            <span className="text-xs text-slate-500">Benchmark vs Target Baseline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</p>
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                      kpi.isPositive
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-rose-700 bg-rose-50'
                    }`}
                  >
                    {kpi.isPositive ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    )}
                    {kpi.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Audited Parameters & Operational Metrics
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              {report.metricsTable.length} verification checkpoints
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold">Checkpoint / Parameter</th>
                  <th className="py-3 px-4 font-semibold">Target Spec</th>
                  <th className="py-3 px-4 font-semibold">Audited Actual</th>
                  <th className="py-3 px-4 font-semibold">Variance</th>
                  <th className="py-3 px-4 font-semibold">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.metricsTable.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{row.metric}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{row.target}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono text-xs">
                      {row.actual}
                    </td>
                    <td
                      className={`py-3 px-4 font-semibold text-xs ${
                        row.status === 'PASS'
                          ? 'text-emerald-600'
                          : row.status === 'WARN'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {row.variance}
                    </td>
                    <td className="py-3 px-4">
                      {row.status === 'PASS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Meets Standard
                        </span>
                      ) : row.status === 'WARN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Caution / Alert
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Non-Compliant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Defect Pareto Breakdown if present */}
        {report.defectBreakdown && report.defectBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Defect Pareto Distribution (80/20 Rule)
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Sorted by highest contribution to rework
              </span>
            </div>

            <div className="space-y-3">
              {report.defectBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      {idx + 1}. {item.defect}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {item.count} defects ({item.percentage}%) • Cumulative: {item.cumulative}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Highlights and Action Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Highlights */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Observed Highlights & Achievements
            </h3>
            <ul className="space-y-2.5">
              {report.highlights.map((h, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Recommendations */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-indigo-600" />
              Corrective Actions & Directives
            </h3>
            <ul className="space-y-2.5">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Governance & Sign-Off Authorization */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <BadgeCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Governance, Digital Sign-off & Audit Authorization
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <p className="text-[10px] uppercase font-semibold text-slate-400">1. Prepared By</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-1">
                {report.signOff.preparedBy}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Date: {report.signOff.date}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <p className="text-[10px] uppercase font-semibold text-slate-400">2. Technical Review</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-1">
                {report.signOff.reviewedBy}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified & Signed Digitally</p>
            </div>

            <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200/70">
              <p className="text-[10px] uppercase font-semibold text-indigo-700">3. Final Approval</p>
              <p className="text-xs sm:text-sm font-semibold text-indigo-950 mt-1">
                {report.signOff.approvedBy}
              </p>
              <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                Executive Authorization Confirmed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Report Export Modal */}
      <ReportSingleExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        report={report}
      />
    </div>
  );
}
