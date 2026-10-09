'use client';

import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileDown,
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ReportRecord, REPORT_CATEGORY_CONFIG } from './reports-data';
import {
  exportSingleReportRecordPdf,
  exportSingleReportRecordExcel,
  downloadCsv,
} from './reports-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface ReportSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportRecord | null;
}

export function ReportSingleExportModal({
  isOpen,
  onClose,
  report,
}: ReportSingleExportModalProps) {
  if (!isOpen || !report) return null;

  const pdfSettings = loadPdfHeaderSettings();
  const catConfig = REPORT_CATEGORY_CONFIG[report.category] || {
    label: report.category,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  };

  const handleExportPdf = () => {
    exportSingleReportRecordPdf(report);
    onClose();
  };

  const handleExportExcel = () => {
    exportSingleReportRecordExcel(report);
    onClose();
  };

  const handleExportCsv = () => {
    const rows = report.metricsTable.map((m) => [
      m.metric,
      m.target,
      m.actual,
      m.variance,
      m.status,
    ]);
    downloadCsv(
      `${report.id}_metrics_${new Date().toISOString().split('T')[0]}`,
      ['Metric', 'Target Benchmark', 'Actual Recorded', 'Variance', 'Status'],
      rows,
      [
        { label: 'Report ID', value: report.id },
        { label: 'Report Title', value: report.title },
        { label: 'Category', value: report.category },
        { label: 'Period', value: report.period },
        { label: 'Department', value: report.department },
        { label: 'Author', value: report.generatedBy },
      ]
    );
    onClose();
  };

  const passCount = report.metricsTable.filter((m) => m.status === 'PASS').length;
  const warnCount = report.metricsTable.filter((m) => m.status === 'WARN').length;
  const failCount = report.metricsTable.filter((m) => m.status === 'FAIL').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono">{report.id}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    report.status === 'PUBLISHED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : report.status === 'APPROVED'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                      : report.status === 'UNDER_REVIEW'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
                  }`}
                >
                  {report.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Export analytical report, scorecard &amp; metric variances
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Linked PDF Header Notice */}
        <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">
              <strong>Header Linked from Settings:</strong>{' '}
              {pdfSettings.companyName || 'Valiant Garments'}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
            Live Synced
          </span>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Report Details Preview Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {report.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span
                    className={`font-semibold px-1.5 py-0.2 rounded text-[10px] border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
                  >
                    {catConfig.label}
                  </span>
                  <span>&bull;</span>
                  <span>{report.department}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {report.metricsTable.length} Metrics
                </span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed italic">
              &ldquo;{report.summary}&rdquo;
            </div>

            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
              <div>
                <span className="text-slate-400 block">Period:</span>
                <span className="font-semibold text-slate-800">{report.period}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Author:</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {report.generatedBy}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Metric Verdicts:</span>
                <span className="font-semibold text-slate-800">
                  <span className="text-emerald-700">{passCount} Pass</span> /{' '}
                  <span className="text-amber-700">{warnCount} W</span> /{' '}
                  <span className="text-rose-700">{failCount} F</span>
                </span>
              </div>
            </div>
          </div>

          {/* Export Format Cards */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose Export Format
            </label>

            {/* Option 1: PDF */}
            <div
              onClick={handleExportPdf}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      PDF Analytical Report
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Formatted document with executive summary, variance table, highlights &amp; sign-off block.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white rounded-lg transition-colors shrink-0"
              >
                Export PDF
              </button>
            </div>

            {/* Option 2: Excel */}
            <div
              onClick={handleExportExcel}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Excel Spreadsheet
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      .XLS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Individual report workbook formatted with targets, actuals, variance math &amp; styling.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white rounded-lg transition-colors shrink-0"
              >
                Export Excel
              </button>
            </div>

            {/* Option 3: CSV */}
            <div
              onClick={handleExportCsv}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      CSV Data Export
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      .CSV
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Raw delimited metric rows with header metadata for spreadsheet imports.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors shrink-0"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
