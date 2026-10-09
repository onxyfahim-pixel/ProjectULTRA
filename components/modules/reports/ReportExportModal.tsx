'use client';

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  FileDown,
  ShieldCheck,
  Check,
  FileText,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ReportRecord } from './reports-data';
import {
  computeReportLedgerKpis,
  exportReportLedgerPdf,
  exportReportLedgerExcel,
  downloadCsv,
} from './reports-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allReports: ReportRecord[];
  selectedReports: ReportRecord[];
}

export function ReportExportModal({
  isOpen,
  onClose,
  allReports,
  selectedReports,
}: ReportExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedReports.length > 0 ? 'selected' : 'all'
  );

  React.useEffect(() => {
    if (selectedReports.length > 0) {
      setExportScope('selected');
    } else {
      setExportScope('all');
    }
  }, [selectedReports.length, isOpen]);

  if (!isOpen) return null;

  const targetReports =
    exportScope === 'selected' && selectedReports.length > 0
      ? selectedReports
      : allReports;

  const kpis = computeReportLedgerKpis(targetReports);
  const pdfSettings = loadPdfHeaderSettings();

  const handleExportPdf = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Reports (${targetReports.length} of ${allReports.length} Reports)`
        : `All Active Reports (${allReports.length} Reports)`;
    exportReportLedgerPdf(targetReports, scopeLabel);
    onClose();
  };

  const handleExportExcel = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Reports (${targetReports.length} of ${allReports.length} Reports)`
        : `All Active Reports (${allReports.length} Reports)`;
    exportReportLedgerExcel(targetReports, scopeLabel);
    onClose();
  };

  const handleExportCsv = () => {
    const rows = targetReports.map((r) => [
      r.id,
      r.title,
      r.category,
      r.period,
      r.department,
      r.generatedBy,
      r.status,
      r.format,
      r.fileSize,
      r.generatedDate,
    ]);
    downloadCsv(
      `reports_ledger_${exportScope}_${new Date().toISOString().split('T')[0]}`,
      [
        'Report ID',
        'Report Title',
        'Category',
        'Period',
        'Department',
        'Author',
        'Status',
        'Format',
        'File Size',
        'Date Generated',
      ],
      rows
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Global Export: Report &amp; Analysis Module
              </h3>
              <p className="text-xs text-slate-400">
                Generate executive analytics ledger, KPI summaries &amp; management scorecards
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
        <div className="px-6 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">
              <strong>Header Linked from Settings:</strong>{' '}
              {pdfSettings.companyName || 'Valiant Garments'} (
              {pdfSettings.layoutStyle.replace('_', ' ')})
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
            Live Synced
          </span>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Scope Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Choose Record Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Selected */}
              <button
                type="button"
                disabled={selectedReports.length === 0}
                onClick={() => setExportScope('selected')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'selected'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                    : selectedReports.length === 0
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        exportScope === 'selected'
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {exportScope === 'selected' && (
                        <Check className="w-3 h-3 stroke-3" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      Selected Records
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                      selectedReports.length > 0
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {selectedReports.length} Reports
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6">
                  {selectedReports.length > 0
                    ? `Only export the ${selectedReports.length} reports selected in the table.`
                    : 'Select reports in the table to enable this scope.'}
                </p>
              </button>

              {/* Option B: All Records */}
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        exportScope === 'all'
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {exportScope === 'all' && (
                        <Check className="w-3 h-3 stroke-3" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      All Records
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {allReports.length} Reports
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6">
                  Export complete register of all {allReports.length} reports across quality, production &amp; compliance.
                </p>
              </button>
            </div>
          </div>

          {/* Scope Preview Metrics */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Reports Ledger Scope Preview ({targetReports.length} Reports)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Total Reports</div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {kpis.total}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Published</div>
                <div className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                  {kpis.published}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Approved</div>
                <div className="text-sm font-mono font-bold text-blue-700 mt-0.5">
                  {kpis.approved}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Under Review</div>
                <div className="text-sm font-mono font-bold text-amber-700 mt-0.5">
                  {kpis.underReview}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-500 font-medium">Approval Rate</div>
                <div className="text-sm font-mono font-bold text-indigo-700 mt-0.5">
                  {kpis.completionRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Choose Format */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Choose Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PDF Option Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 transition-all flex flex-col justify-between space-y-3 group">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                      <Printer className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    PDF Analytical Ledger
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Official management ledger with live company header, approval metrics &amp; sign-off columns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export PDF ({targetReports.length})</span>
                </button>
              </div>

              {/* Excel Option Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between space-y-3 group">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      .XLS
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Excel Workbook
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Formatted multi-column spreadsheet with KPI summary banner, departments &amp; statuses.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel ({targetReports.length})</span>
                </button>
              </div>

              {/* CSV Option Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all flex flex-col justify-between space-y-3 group">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      .CSV
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    CSV Data Export
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Raw delimited data register ready for BI tools, Python pipelines &amp; external warehousing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export CSV ({targetReports.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Targeting <strong>{targetReports.length}</strong> of {allReports.length} reports
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
