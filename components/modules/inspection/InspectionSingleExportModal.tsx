'use client';

import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileDown,
  ShieldCheck,
  ClipboardCheck,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { InspectionRecord } from '@/lib/types/erp';
import {
  exportSingleInspectionPdf,
  exportSingleInspectionExcel,
} from './inspection-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface InspectionSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: InspectionRecord | null;
}

export function InspectionSingleExportModal({
  isOpen,
  onClose,
  record,
}: InspectionSingleExportModalProps) {
  if (!isOpen || !record) return null;

  const pdfSettings = loadPdfHeaderSettings();
  const poDisplay = record.poNumbers && record.poNumbers.length > 0 ? record.poNumbers.join(', ') : record.orderNumber || '-';

  const handleExportPdf = () => {
    exportSingleInspectionPdf(record);
    onClose();
  };

  const handleExportExcel = () => {
    exportSingleInspectionExcel(record);
    onClose();
  };

  const isPassed = record.status === 'PASSED';
  const isConditional = record.status === 'CONDITIONAL_PASS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono">{record.inspectionCode}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isPassed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : isConditional
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  }`}
                >
                  {record.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Export AQL inspection certificate, Size breakdown, defect breakdown &amp; QC checkpoints checklist
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
        <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">
              <strong>Header Linked from Settings:</strong> {pdfSettings.companyName || 'Valiant Garments'}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            Live Synced
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Order Details Preview Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  PO: <strong className="text-blue-700">{poDisplay}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Buyer: <strong className="text-slate-800">{record.buyer}</strong> • Style: {record.styleNumber}
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Stage: {record.stage?.replace(/_/g, ' ') || 'Final FRI'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-700">
                  {record.sampleSize} pcs sampled
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Lot Qty: {(record.lotQuantity || record.orderQuantity || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600">
              <div>
                <span className="text-slate-400 block">Critical / Major:</span>
                <span className="font-mono font-semibold text-rose-700">
                  {record.criticalDefects || 0} / {record.majorDefects || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Minor Defects:</span>
                <span className="font-mono font-semibold text-amber-700">{record.minorDefects || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Size Breakdown:</span>
                <span className="font-mono font-semibold text-indigo-700">
                  {record.sizeBreakdown?.length || 6} Sizes • {record.sampleSize} Pickups
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Auditor:</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {record.inspectorName?.split('(')[0] || 'QC Auditor'}
                </span>
              </div>
            </div>

            {/* Extended Mobile Inspection Details */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {record.hasZeroToleranceFail ? (
                  <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    ⚠️ 0-Tolerance Failed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ 0-Tol Cleared
                  </span>
                )}

                <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  📷 {(record.poSheetPhotos?.length || 0) + (record.sampleCartonPhotos?.length || 0) + (record.compliancePhotos?.length || 0) + (record.measurementSheetPhotos?.length || 0)} Photos
                </span>

                <span className="px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  🧪 {record.testRecords?.length || 0} Tests
                </span>
              </div>

              <span className={`px-2 py-0.5 rounded font-bold ${
                record.inspectorSignature && record.representativeSignature
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {record.inspectorSignature && record.representativeSignature ? '✓ Dual Signed' : 'Sign-Off Ready'}
              </span>
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
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      PDF AQL Certificate
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Official inspection certificate with photos, test records, 0-tolerance status, size breakdown &amp; dual signatures.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors shrink-0"
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
                      Excel Audit Sheet
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      .XLS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Full QC workbook with size breakdown, defects, test records, photo log &amp; dual sign-off metadata.
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
