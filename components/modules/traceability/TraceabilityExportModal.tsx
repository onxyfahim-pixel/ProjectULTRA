'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  Table2,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  QrCode,
  Layers,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { TraceabilityChain } from '@/lib/types/modules';
import {
  computeTraceabilityKpis,
  exportTraceabilityRegisterPdf,
  exportTraceabilityRegisterExcel,
  exportTraceabilityRegisterCsv,
} from './traceability-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface TraceabilityExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: TraceabilityChain[];
  selectedRecords: TraceabilityChain[];
}

export function TraceabilityExportModal({
  isOpen,
  onClose,
  allRecords,
  selectedRecords,
}: TraceabilityExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedRecords.length > 0 ? 'selected' : 'all'
  );
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen) return null;

  const activeRecords =
    exportScope === 'selected' && selectedRecords.length > 0
      ? selectedRecords
      : allRecords;

  const kpis = computeTraceabilityKpis(activeRecords);
  const moduleConfig = getModuleExportConfig(pdfSettings, 'traceability', 'register');
  const docCode = moduleConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportTraceabilityRegisterPdf(
        activeRecords,
        exportScope === 'selected'
          ? `Selected ${activeRecords.length} Chains`
          : `All ${activeRecords.length} Chains`
      );
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportTraceabilityRegisterExcel(
        activeRecords,
        exportScope === 'selected'
          ? `Selected ${activeRecords.length} Chains`
          : `All ${activeRecords.length} Chains`
      );
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      exportTraceabilityRegisterCsv(
        activeRecords,
        exportScope === 'selected'
          ? `Selected ${activeRecords.length} Chains`
          : `All ${activeRecords.length} Chains`
      );
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Export Traceability Ledger</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-700 font-bold border border-blue-200">
                  {docCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate certified 7-stage chain-of-custody audit register documentation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* SCOPE SELECTOR */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Export Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  exportScope === 'all'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">All Chains</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {allRecords.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Export complete supply chain traceability master ledger
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('selected')}
                disabled={selectedRecords.length === 0}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedRecords.length === 0
                    ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                    : exportScope === 'selected'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Selected Chains</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {selectedRecords.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {selectedRecords.length === 0
                    ? 'No chains currently selected'
                    : `Export only the ${selectedRecords.length} selected chains`}
                </p>
              </button>
            </div>
          </div>

          {/* SUMMARY KPI METRIC PREVIEW */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ledger Summary Preview
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {activeRecords.length} Chains In Scope
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Verified</span>
                <span className="text-sm font-extrabold text-emerald-600">{kpis.verified}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">In Progress</span>
                <span className="text-sm font-extrabold text-blue-600">{kpis.inProgress}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Flagged</span>
                <span className="text-sm font-extrabold text-rose-600">{kpis.flagged}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Verification Rate</span>
                <span className="text-sm font-extrabold text-indigo-600">{kpis.verificationRate}%</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC HEADER SYNC BADGE */}
          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-950">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold block">{pdfSettings.companyName}</span>
                <span className="text-[10px] text-blue-700">
                  Header layout: {pdfSettings.layoutStyle} • ISO Badge: {pdfSettings.isoStandardBadge}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-200/60 text-blue-800">
              Header Synced
            </span>
          </div>

          {/* EXPORT ACTION BUTTONS */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handlePdfExport}
              disabled={isExporting !== null}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition-all text-blue-900 group shadow-xs cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs">Print / PDF</span>
              <span className="text-[10px] text-blue-700 mt-0.5">Master Ledger</span>
            </button>

            <button
              type="button"
              onClick={handleExcelExport}
              disabled={isExporting !== null}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-emerald-900 group shadow-xs cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs">Excel Workbook</span>
              <span className="text-[10px] text-emerald-700 mt-0.5">Styled .xls Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleCsvExport}
              disabled={isExporting !== null}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-800 group shadow-xs cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <Table2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs">CSV Data</span>
              <span className="text-[10px] text-slate-600 mt-0.5">Raw Tabular Export</span>
            </button>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Official controlled supply chain custody register export</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
