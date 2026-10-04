'use client';

import React from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  FileDown,
  ShieldCheck,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { KpiMetric } from '@/lib/types/modules';
import { exportSingleKpiPdf, exportSingleKpiExcel } from './kpi-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface KpiSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpi: KpiMetric | null;
}

export function KpiSingleExportModal({
  isOpen,
  onClose,
  kpi,
}: KpiSingleExportModalProps) {
  if (!isOpen || !kpi) return null;

  const pdfSettings = loadPdfHeaderSettings();

  const handleExportPdf = () => {
    exportSingleKpiPdf(kpi);
    onClose();
  };

  const handleExportExcel = () => {
    exportSingleKpiExcel(kpi);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono">{kpi.kpiCode || 'KPI'}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {kpi.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{kpi.metricName}</p>
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

        <div className="p-6 space-y-4">
          {/* KPI Snapshot Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {kpi.category} • {kpi.department || 'Operations'}
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{kpi.metricName}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Owner: <strong>{kpi.ownerName || 'Department Lead'}</strong>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold">Actual / Target</div>
              <div className="text-base font-black font-mono text-blue-700">
                {kpi.currentValue} / {kpi.targetValue} {kpi.unit}
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="grid grid-cols-1 gap-3">
            {/* PDF Option */}
            <div
              onClick={handleExportPdf}
              className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-600 bg-white hover:bg-blue-50/20 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      PDF Performance Dossier
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      .PDF
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Individual KPI dossier with calculation formula, trend history, and CAPA tasks
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors shrink-0"
              >
                Print / Save
              </button>
            </div>

            {/* Excel Option */}
            <div
              onClick={handleExportExcel}
              className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Excel Performance Workbook
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      .XLS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Metric specification with historical periods and remediation tracker
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
