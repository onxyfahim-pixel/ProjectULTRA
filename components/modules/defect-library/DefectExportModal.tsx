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
  AlertOctagon,
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { DefectDefinition } from '@/lib/types/modules';
import {
  computeDefectKpis,
  exportDefectCatalogPdf,
  exportDefectCatalogExcel,
  downloadDefectCsv,
} from './defect-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface DefectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allDefects: DefectDefinition[];
  selectedDefects: DefectDefinition[];
}

export function DefectExportModal({
  isOpen,
  onClose,
  allDefects,
  selectedDefects,
}: DefectExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedDefects.length > 0 ? 'selected' : 'all'
  );
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Sync with general PDF header settings
  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen) return null;

  const activeDefects =
    exportScope === 'selected' && selectedDefects.length > 0 ? selectedDefects : allDefects;

  const kpis = computeDefectKpis(activeDefects);
  const moduleConfig = getModuleExportConfig(pdfSettings, 'defect_library', 'register');
  const docCode = moduleConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      const scopeLabel =
        exportScope === 'selected' && selectedDefects.length > 0
          ? `Selected Defects (${selectedDefects.length} of ${allDefects.length} items)`
          : `Complete Defects Catalog (${allDefects.length} items)`;
      exportDefectCatalogPdf(activeDefects, scopeLabel);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      const scopeLabel =
        exportScope === 'selected' && selectedDefects.length > 0
          ? `Selected Defects (${selectedDefects.length} of ${allDefects.length} items)`
          : `Complete Defects Catalog (${allDefects.length} items)`;
      exportDefectCatalogExcel(activeDefects, scopeLabel);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'Defect Code',
        'Defect Name',
        'Category',
        'Severity',
        'Zone Classification',
        'Responsible Department',
        'Inspection Checkpoint',
        'ISO Standard',
        'Potential Root Cause',
        'Corrective Action',
        'Remedy Guideline',
        'Status',
      ];

      const rows = activeDefects.map((d) => [
        d.defectCode,
        d.name,
        d.category || '',
        d.severity,
        d.zone || '',
        d.responsibleDepartment || '',
        d.inspectionCheckpoint || '',
        d.isoStandard || 'ISO 9001 / AQL',
        d.rootCause || d.rootCauseHint || '',
        d.correctiveAction || d.correctiveActionHint || '',
        d.suggestedRemedy || '',
        d.status || 'ACTIVE',
      ]);

      const fileName = `Defects_Catalog_Register_${exportScope}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadDefectCsv(fileName, headers, rows);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Export Defects Catalog & Standards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official quality defect master catalog & specification sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Synchronized Header Settings Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Building2 className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                Header Sync:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {pdfSettings.companyName || 'Standard Factory Setting'}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              Doc Code: {docCode}
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Export Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  exportScope === 'all'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">All Defects in Library</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Complete catalog register ({allDefects.length} items)
                  </div>
                </div>
                {exportScope === 'all' && <CheckCircle2 className="w-4 h-4 text-rose-500" />}
              </button>

              <button
                type="button"
                disabled={selectedDefects.length === 0}
                onClick={() => setExportScope('selected')}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  selectedDefects.length === 0
                    ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : exportScope === 'selected'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">Selected Defects</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedDefects.length > 0
                      ? `${selectedDefects.length} selected in table`
                      : 'None selected in table'}
                  </div>
                </div>
                {exportScope === 'selected' && <CheckCircle2 className="w-4 h-4 text-rose-500" />}
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {kpis.total}
              </div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Total Defects</div>
            </div>

            <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {kpis.critical}
              </div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Critical</div>
            </div>

            <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {kpis.major}
              </div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Major</div>
            </div>

            <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {kpis.minor}
              </div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Minor</div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Output Format
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PDF Card */}
              <button
                type="button"
                onClick={handlePdfExport}
                disabled={isExporting !== null}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Print / Save PDF
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Catalog Dossier
                  </div>
                </div>
              </button>

              {/* Excel Card */}
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={isExporting !== null}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Excel Workbook
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Formatted .XLS Sheet
                  </div>
                </div>
              </button>

              {/* CSV Card */}
              <button
                type="button"
                onClick={handleCsvExport}
                disabled={isExporting !== null}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Table2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    CSV Raw Data
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Standard Dataset (.csv)
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ready to generate export file</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
