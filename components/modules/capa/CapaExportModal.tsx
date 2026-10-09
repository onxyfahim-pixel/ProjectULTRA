'use client';

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  FileDown,
  ShieldCheck,
  Check,
  GitPullRequest,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { CapaItem } from '@/lib/types/modules';
import {
  computeCapaKpis,
  exportCapaSummaryPdf,
  exportCapaSummaryExcel,
  downloadCapaCsv,
} from './capa-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface CapaExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCapas: CapaItem[];
  selectedCapas: CapaItem[];
}

export function CapaExportModal({
  isOpen,
  onClose,
  allCapas,
  selectedCapas,
}: CapaExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedCapas.length > 0 ? 'selected' : 'all'
  );

  React.useEffect(() => {
    if (selectedCapas.length > 0) {
      setExportScope('selected');
    } else {
      setExportScope('all');
    }
  }, [selectedCapas.length, isOpen]);

  if (!isOpen) return null;

  const targetCapas =
    exportScope === 'selected' && selectedCapas.length > 0
      ? selectedCapas
      : allCapas;

  const kpis = computeCapaKpis(targetCapas);
  const pdfSettings = loadPdfHeaderSettings();

  const handleExportPdf = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Records (${targetCapas.length} of ${allCapas.length} CAPA Files)`
        : `All Active Records (${allCapas.length} CAPA Files)`;
    exportCapaSummaryPdf(targetCapas, scopeLabel);
    onClose();
  };

  const handleExportExcel = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Records (${targetCapas.length} of ${allCapas.length} CAPA Files)`
        : `All Active Records (${allCapas.length} CAPA Files)`;
    exportCapaSummaryExcel(targetCapas, scopeLabel);
    onClose();
  };

  const handleExportCsv = () => {
    const rows = targetCapas.map((c) => [
      c.capaNumber,
      c.issueTitle,
      c.source,
      c.department || '',
      c.severity || 'MAJOR',
      c.responsiblePerson,
      c.targetCompletionDate,
      c.actualCompletionDate || '',
      c.rootCause || '',
      c.containmentAction || '',
      c.correctiveAction || '',
      c.preventiveAction || '',
      c.status,
      c.effectivenessVerified ? 'YES' : 'NO',
      c.verifiedBy || '',
    ]);
    downloadCapaCsv(
      `capa_master_register_${exportScope}_${new Date().toISOString().split('T')[0]}`,
      [
        'CAPA Ref',
        'Issue Title',
        'Trigger Source',
        'Department',
        'Severity',
        'Responsible Lead',
        'Target Date',
        'Actual Completion',
        'Root Cause',
        'Containment Action',
        'Corrective Action',
        'Preventive Action',
        '8D Status',
        'Effectiveness Verified',
        'Verified By',
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
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Global Export: CAPA &amp; 8D Resolution Module
              </h3>
              <p className="text-xs text-slate-400">
                Generate corrective action registers, RCA summaries &amp; ISO 9001 compliance logs
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
        <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">
              <strong>Header Linked from Settings:</strong>{' '}
              {pdfSettings.companyName || 'Valiant Garments'} (
              {pdfSettings.layoutStyle.replace('_', ' ')})
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
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
                disabled={selectedCapas.length === 0}
                onClick={() => setExportScope('selected')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'selected'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                    : selectedCapas.length === 0
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        exportScope === 'selected'
                          ? 'border-blue-600 bg-blue-600 text-white'
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
                      selectedCapas.length > 0
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {selectedCapas.length} Files
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6">
                  {selectedCapas.length > 0
                    ? `Only export the ${selectedCapas.length} CAPA files selected in the table.`
                    : 'Select records in the table to enable this scope.'}
                </p>
              </button>

              {/* Option B: All Records */}
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        exportScope === 'all'
                          ? 'border-blue-600 bg-blue-600 text-white'
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
                    {allCapas.length} Files
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6">
                  Export complete register of all {allCapas.length} CAPA files across audits, complaints &amp; NCRs.
                </p>
              </button>
            </div>
          </div>

          {/* Scope Preview Metrics */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              CAPA Master Scope Preview ({targetCapas.length} Files)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Total CAPAs</div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {kpis.total}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Closed &amp; Verified</div>
                <div className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                  {kpis.closed}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">In Progress</div>
                <div className="text-sm font-mono font-bold text-amber-700 mt-0.5">
                  {kpis.inProgress}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Critical Priority</div>
                <div className="text-sm font-mono font-bold text-rose-700 mt-0.5">
                  {kpis.critical}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-500 font-medium">Resolution Rate</div>
                <div className="text-sm font-mono font-bold text-blue-700 mt-0.5">
                  {kpis.closedRate}%
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
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all flex flex-col justify-between space-y-3 group">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                      <Printer className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    PDF Master Register
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Comprehensive compliance log with root causes, target dates, severity &amp; 4-way signatures.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export PDF ({targetCapas.length})</span>
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
                    Structured multi-column spreadsheet with KPI summary banner, departments &amp; statuses.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel ({targetCapas.length})</span>
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
                    Raw delimited data register with 15 fields ready for ERP integration &amp; BI reporting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export CSV ({targetCapas.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Targeting <strong>{targetCapas.length}</strong> of {allCapas.length} CAPA records
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
