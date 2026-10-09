'use client';

import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileDown,
  ShieldCheck,
  Building2,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { QualityAudit } from '@/lib/types/modules';
import {
  exportSingleAuditPdf,
  exportSingleAuditExcel,
} from './audit-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface AuditSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: QualityAudit | null;
}

export function AuditSingleExportModal({
  isOpen,
  onClose,
  audit,
}: AuditSingleExportModalProps) {
  if (!isOpen || !audit) return null;

  const pdfSettings = loadPdfHeaderSettings();
  const scoreVal = audit.obtainedMarks ?? audit.scorePercentage ?? 0;
  const hasCritical = (audit.criticalNCs ?? 0) > 0;
  const isPassed =
    !hasCritical &&
    (audit.isPassed !== undefined ? audit.isPassed : scoreVal >= (audit.passMarks ?? 80));

  const handleExportPdf = () => {
    exportSingleAuditPdf(audit);
    onClose();
  };

  const handleExportExcel = () => {
    exportSingleAuditExcel(audit);
    onClose();
  };

  const auditeeTitle =
    audit.supplierName || audit.auditeeDepartment || 'Factory Operations';

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
                <h3 className="text-base font-bold font-mono">{audit.auditCode}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    hasCritical
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  }`}
                >
                  {hasCritical ? 'CRITICAL FAIL' : isPassed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Export audit assessment report, checklist findings &amp; evidence
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
              <strong>Header Linked from Settings:</strong>{' '}
              {pdfSettings.companyName || 'Valiant Garments'}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            Live Synced
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Audit Details Preview Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">{audit.standard}</div>
                <div className="text-[11px] text-slate-500">
                  Auditee: <strong className="text-blue-700">{auditeeTitle}</strong> &bull; Type: {audit.auditType}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Lead Auditor: {audit.auditorName} ({audit.auditorOrganization || 'QA Team'})
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-mono font-bold ${
                    hasCritical ? 'text-rose-700' : isPassed ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {scoreVal}% Score
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  NCs: {audit.nonConformancesCount || 0} ({audit.criticalNCs || 0} Crit)
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
              <div>
                <span className="text-slate-400 block">Date Audited:</span>
                <span className="font-mono font-semibold text-slate-800">{audit.auditDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Next Due:</span>
                <span className="font-semibold text-blue-700 truncate block">
                  {audit.nextAuditDate || 'TBD'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Checklist Items:</span>
                <span className="font-semibold text-slate-800">
                  {audit.checklist?.length || 0} Questions
                </span>
              </div>
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
                      PDF Audit Report
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Printable audit sheet with verified clauses, score breakdowns, remarks &amp; signatures.
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
                      Excel Spreadsheet
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      .XLS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Individual audit findings workbook formatted for spreadsheets and analysis.
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
