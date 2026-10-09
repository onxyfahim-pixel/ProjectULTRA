'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  FileSpreadsheet,
  Table2,
  Building2,
  QrCode,
  Layers,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { TraceabilityChain } from '@/lib/types/modules';
import {
  exportTraceabilitySinglePdf,
  exportTraceabilitySingleExcel,
  exportTraceabilitySingleCsv,
} from './traceability-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface TraceabilitySingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TraceabilityChain | null;
}

export function TraceabilitySingleExportModal({
  isOpen,
  onClose,
  record,
}: TraceabilitySingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !record) return null;

  const moduleConfig = getModuleExportConfig(pdfSettings, 'traceability', 'single', record.cartonBarcode);
  const docCode = moduleConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportTraceabilitySinglePdf(record);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportTraceabilitySingleExcel(record);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      exportTraceabilitySingleCsv(record);
    } finally {
      setIsExporting(null);
    }
  };

  const stages = record.lifecycleStages || [];
  const completedStages = stages.filter((s) => s.status === 'COMPLETED').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Export Traceability Dossier</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-700 font-bold border border-blue-200">
                  {record.cartonBarcode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                End-to-end supply chain custody audit certificate
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
          {/* CHAIN SUMMARY CARD */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  {record.cartonBarcode}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  {record.buyer} • {record.styleNumber}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Origin: {record.cottonOrigin} • PO: {record.poNumber || record.orderNumber || '-'}
                </p>
              </div>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  record.status === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : record.status === 'FLAGGED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {record.status || 'VERIFIED'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="block text-[9px] uppercase font-bold text-slate-400">7-Stages</span>
                <span className="text-xs font-bold text-slate-700">{completedStages}/7 Done</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="block text-[9px] uppercase font-bold text-slate-400">Order Qty</span>
                <span className="text-xs font-bold text-slate-700">
                  {record.orderQuantity ? record.orderQuantity.toLocaleString() : '-'}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="block text-[9px] uppercase font-bold text-slate-400">Sewing Line</span>
                <span className="text-xs font-bold text-slate-700">{record.sewingLine}</span>
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
                  Doc Code: {docCode} • ISO: {pdfSettings.isoStandardBadge}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-200/60 text-blue-800">
              Synced
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
              <span className="text-[10px] text-blue-700 mt-0.5">Audit Certificate</span>
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
              <span className="font-bold text-xs">Excel Sheet</span>
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
          <span>Official controlled supply chain audit certificate</span>
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
