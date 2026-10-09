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
  ClipboardList,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { ProcedureItem } from '@/lib/types/modules';
import {
  computeProcedureKpis,
  exportProcedureRegisterPdf,
  exportProcedureRegisterExcel,
  exportProcedureRegisterCsv,
} from './procedure-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface ProcedureExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProcedures: ProcedureItem[];
  selectedProcedures: ProcedureItem[];
}

export function ProcedureExportModal({
  isOpen,
  onClose,
  allProcedures,
  selectedProcedures,
}: ProcedureExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedProcedures.length > 0 ? 'selected' : 'all'
  );
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen) return null;

  const activeProcedures =
    exportScope === 'selected' && selectedProcedures.length > 0
      ? selectedProcedures
      : allProcedures;

  const kpis = computeProcedureKpis(activeProcedures);
  const config = getModuleExportConfig(pdfSettings, 'procedure', 'register');
  const docCode = config.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportProcedureRegisterPdf(
        activeProcedures,
        exportScope === 'selected'
          ? `Selected ${activeProcedures.length} Procedures`
          : `All ${activeProcedures.length} Procedures`
      );
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportProcedureRegisterExcel(
        activeProcedures,
        exportScope === 'selected'
          ? `Selected ${activeProcedures.length} Procedures`
          : `All ${activeProcedures.length} Procedures`
      );
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      exportProcedureRegisterCsv(
        activeProcedures,
        exportScope === 'selected'
          ? `Selected ${activeProcedures.length} Procedures`
          : `All ${activeProcedures.length} Procedures`
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
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{config.title}</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-700 font-bold border border-blue-200">
                  {docCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate controlled ISO 9001:2015 Clause 4.4 procedures register
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-6 space-y-6">
          {/* SCOPE SELECTION */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Export Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">All Standard Procedures</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                    {allProcedures.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Export complete operations and department-wise procedures
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('selected')}
                disabled={selectedProcedures.length === 0}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedProcedures.length === 0
                    ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                    : exportScope === 'selected'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Selected Procedures</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                    {selectedProcedures.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {selectedProcedures.length > 0
                    ? `Export only the ${selectedProcedures.length} checked procedures`
                    : 'Select procedures using the table checkboxes first'}
                </p>
              </button>
            </div>
          </div>

          {/* SUMMARY KPI PILLS */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Dataset Preview ({activeProcedures.length} Procedures)
            </span>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                <span className="text-xs text-slate-500 block">Active & In-Force</span>
                <span className="font-mono text-sm font-bold text-emerald-600">{kpis.active}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                <span className="text-xs text-slate-500 block">Under Review</span>
                <span className="font-mono text-sm font-bold text-blue-600">{kpis.underReview}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                <span className="text-xs text-slate-500 block">Process Gates</span>
                <span className="font-mono text-sm font-bold text-purple-600">{kpis.totalSteps}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                <span className="text-xs text-slate-500 block">Linked QA Forms</span>
                <span className="font-mono text-sm font-bold text-amber-600">{kpis.totalForms}</span>
              </div>
            </div>
          </div>

          {/* EXPORT FORMATS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Select Output Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* PDF BUTTON */}
              <button
                type="button"
                onClick={handlePdfExport}
                disabled={isExporting !== null}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-blue-200 bg-blue-50/30 hover:bg-blue-50 text-blue-700 hover:border-blue-300 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Print / PDF</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Corporate Standard</span>
              </button>

              {/* EXCEL BUTTON */}
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={isExporting !== null}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Excel (.xls)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Styled Spreadsheet</span>
              </button>

              {/* CSV BUTTON */}
              <button
                type="button"
                onClick={handleCsvExport}
                disabled={isExporting !== null}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <Table2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">CSV Raw Data</span>
                <span className="text-[10px] text-slate-500 mt-0.5">ERP Raw Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Company Branding: <strong>{pdfSettings.companyName}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
