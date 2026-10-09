'use client';

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  FileDown,
  ShieldCheck,
  Check,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { IncomingQCLot } from '@/lib/types/modules';
import {
  computeIncomingQcKpis,
  exportIncomingQcSummaryPdf,
  exportIncomingQcSummaryExcel,
  downloadIncomingQcCsv,
} from './incoming-qc-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface IncomingQcExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allLots: IncomingQCLot[];
  selectedLots: IncomingQCLot[];
}

export function IncomingQcExportModal({
  isOpen,
  onClose,
  allLots,
  selectedLots,
}: IncomingQcExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedLots.length > 0 ? 'selected' : 'all'
  );

  React.useEffect(() => {
    if (selectedLots.length > 0) {
      setExportScope('selected');
    } else {
      setExportScope('all');
    }
  }, [selectedLots.length, isOpen]);

  if (!isOpen) return null;

  const targetLots =
    exportScope === 'selected' && selectedLots.length > 0
      ? selectedLots
      : allLots;

  const kpis = computeIncomingQcKpis(targetLots);
  const pdfSettings = loadPdfHeaderSettings();

  const handleExportPdf = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Records (${targetLots.length} of ${allLots.length} Inward Lots)`
        : `All Active Records (${allLots.length} Inward Lots)`;
    exportIncomingQcSummaryPdf(targetLots, scopeLabel);
    onClose();
  };

  const handleExportExcel = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Records (${targetLots.length} of ${allLots.length} Inward Lots)`
        : `All Active Records (${allLots.length} Inward Lots)`;
    exportIncomingQcSummaryExcel(targetLots, scopeLabel);
    onClose();
  };

  const handleExportCsv = () => {
    const rows = targetLots.map((l) => [
      l.lotNumber,
      l.materialName || l.lotNumber,
      l.materialCategory,
      l.supplierName,
      l.poNumber || '',
      l.receivedQuantity,
      l.inspectedQuantity,
      l.unit,
      l.result,
      l.qualityGradeAssigned || 'GRADE_A',
      l.inspectorName,
      l.inspectionDate,
    ]);
    downloadIncomingQcCsv(
      `incoming_qc_register_${exportScope}_${new Date().toISOString().split('T')[0]}`,
      [
        'Lot Number',
        'Material Name',
        'Category',
        'Supplier / Mill',
        'PO Number',
        'Received Quantity',
        'Inspected Quantity',
        'Unit',
        'QC Verdict',
        'Quality Grade',
        'Inspector Name',
        'Inspection Date',
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
                Global Export: Incoming QC Module
              </h3>
              <p className="text-xs text-slate-400">
                Generate receiving inspection logs, material test ledgers &amp; mill quality records
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
                disabled={selectedLots.length === 0}
                onClick={() => setExportScope('selected')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'selected'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                    : selectedLots.length === 0
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
                      selectedLots.length > 0
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {selectedLots.length} Lots
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6">
                  {selectedLots.length > 0
                    ? `Only export the ${selectedLots.length} inward lots selected in the table.`
                    : 'Select rows in the table to enable this scope.'}
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
                    {allLots.length} Lots
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6">
                  Export complete register of all {allLots.length} received material lots across fabric, thread &amp; trims.
                </p>
              </button>
            </div>
          </div>

          {/* Scope Preview Metrics */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Inward Inspection Scope Preview ({targetLots.length} Lots)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Total Inward Lots</div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {kpis.total}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Accepted</div>
                <div className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                  {kpis.accepted}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Conditional</div>
                <div className="text-sm font-mono font-bold text-amber-700 mt-0.5">
                  {kpis.conditional}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Rejected / Hold</div>
                <div className="text-sm font-mono font-bold text-rose-700 mt-0.5">
                  {kpis.rejected}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-500 font-medium">Acceptance Rate</div>
                <div className="text-sm font-mono font-bold text-blue-700 mt-0.5">
                  {kpis.acceptanceRate}%
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
                    PDF Receiving Register
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Official receiving log with supplier codes, tested quantities, verdicts &amp; 4-way signatures.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export PDF ({targetLots.length})</span>
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
                    Formatted multi-column spreadsheet with KPI summary banner, suppliers &amp; material grades.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel ({targetLots.length})</span>
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
                    Raw delimited receiving data ready for inventory reconciliations &amp; external ERP ingestion.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export CSV ({targetLots.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Targeting <strong>{targetLots.length}</strong> of {allLots.length} inward lots
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
