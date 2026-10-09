'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  FileSpreadsheet,
  Table2,
  Building2,
  GitCommit,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ProcessFlowChart } from '@/lib/types/modules';
import {
  exportProcessFlowSinglePdf,
  exportProcessFlowSingleExcel,
  exportProcessFlowSingleCsv,
} from './process-flow-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface ProcessFlowSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  flow: ProcessFlowChart | null;
}

export function ProcessFlowSingleExportModal({
  isOpen,
  onClose,
  flow,
}: ProcessFlowSingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !flow) return null;

  const moduleConfig = getModuleExportConfig(pdfSettings, 'process_flow', 'single', flow.flowCode);
  const docCode = moduleConfig.fullDocCode;

  const totalHours = (flow.steps || []).reduce((sum, s) => sum + (Number(s.leadTimeHours) || 0), 0);
  const totalDays = (totalHours / 24).toFixed(1);
  const criticalGatesCount = (flow.steps || []).filter((s) => s.criticalGate).length;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportProcessFlowSinglePdf(flow);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportProcessFlowSingleExcel(flow);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      exportProcessFlowSingleCsv(flow);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Export Process Flow Dossier</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-700 font-bold border border-blue-200">
                  {flow.flowCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full manufacturing sequence chart &amp; quality gate matrix
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
          {/* FLOW PROFILE SNAPSHOT CARD */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block font-mono">
                  {flow.flowCode} • {flow.productCategory} ({flow.version})
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{flow.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{flow.description}</p>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  flow.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : flow.status === 'UNDER_REVIEW'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {flow.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Stages:</span>
                <span className="font-semibold text-slate-800">
                  {flow.steps?.length || 0} Sequence Steps
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Cycle Lead Time:</span>
                <span className="font-semibold text-blue-700 font-mono">
                  {totalDays} Days ({totalHours}h)
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Critical Gates:</span>
                <span className="font-semibold text-rose-600">
                  {criticalGatesCount} QC Checkpoints
                </span>
              </div>
            </div>
          </div>

          {/* EXPORT FORMATS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Select Output Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* PDF DOSSIER BUTTON */}
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
                <span className="text-[10px] text-slate-500 mt-0.5">Formal Map Dossier</span>
              </button>

              {/* EXCEL SHEET BUTTON */}
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
                <span className="text-[10px] text-slate-500 mt-0.5">Stage Mapping Sheet</span>
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
                <span className="text-xs font-bold">CSV Data</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Sequential Steps</span>
              </button>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Document Code: <strong className="font-mono">{docCode}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
