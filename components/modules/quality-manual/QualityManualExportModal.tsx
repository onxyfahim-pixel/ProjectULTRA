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
  BookOpen,
  Layers,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { QualityManualSection } from '@/lib/types/modules';
import {
  computeQualityManualKpis,
  exportQualityManualRegisterPdf,
  exportQualityManualRegisterExcel,
  exportQualityManualRegisterCsv,
} from './quality-manual-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface QualityManualExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSections: QualityManualSection[];
  selectedSections: QualityManualSection[];
}

export function QualityManualExportModal({
  isOpen,
  onClose,
  allSections,
  selectedSections,
}: QualityManualExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedSections.length > 0 ? 'selected' : 'all'
  );
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen) return null;

  const activeSections =
    exportScope === 'selected' && selectedSections.length > 0
      ? selectedSections
      : allSections;

  const kpis = computeQualityManualKpis(activeSections);
  const moduleConfig = getModuleExportConfig(pdfSettings, 'quality_manual', 'register');
  const docCode = moduleConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportQualityManualRegisterPdf(
        activeSections,
        exportScope === 'selected'
          ? `Selected ${activeSections.length} Chapters`
          : `All ${activeSections.length} Chapters`
      );
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportQualityManualRegisterExcel(
        activeSections,
        exportScope === 'selected'
          ? `Selected ${activeSections.length} Chapters`
          : `All ${activeSections.length} Chapters`
      );
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      exportQualityManualRegisterCsv(
        activeSections,
        exportScope === 'selected'
          ? `Selected ${activeSections.length} Chapters`
          : `All ${activeSections.length} Chapters`
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
                <h3 className="font-bold text-slate-900 text-base">Export Quality Manual Register</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-700 font-bold border border-blue-200">
                  {docCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate certified ISO 9001:2015 / ISO 14001:2015 governance register documentation
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
                  <span className="font-bold text-sm">All Chapters</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {allSections.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Export the complete Quality Manual master index
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('selected')}
                disabled={selectedSections.length === 0}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedSections.length === 0
                    ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                    : exportScope === 'selected'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Selected Chapters</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {selectedSections.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {selectedSections.length === 0
                    ? 'No chapters currently selected'
                    : `Export only the ${selectedSections.length} selected chapters`}
                </p>
              </button>
            </div>
          </div>

          {/* SUMMARY KPI METRIC PREVIEW */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Register Summary Preview
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {activeSections.length} Chapters In Scope
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Active</span>
                <span className="text-sm font-extrabold text-emerald-600">{kpis.active}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Under Review</span>
                <span className="text-sm font-extrabold text-amber-600">{kpis.underReview}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Commitments</span>
                <span className="text-sm font-extrabold text-blue-600">{kpis.totalCommitments}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Compliance Rate</span>
                <span className="text-sm font-extrabold text-indigo-600">{kpis.complianceRate}%</span>
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
              <span className="text-[10px] text-blue-700 mt-0.5">ISO Master Register</span>
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
          <span>Official controlled QMS chapter registry export</span>
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
