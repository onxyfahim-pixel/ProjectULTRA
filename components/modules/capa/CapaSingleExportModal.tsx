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
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitPullRequest,
  FileText,
} from 'lucide-react';
import { CapaItem } from '@/lib/types/modules';
import {
  exportSingleCapaPdf,
  exportSingleCapaExcel,
  downloadCapaCsv,
} from './capa-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface CapaSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  capa: CapaItem | null;
}

export function CapaSingleExportModal({
  isOpen,
  onClose,
  capa,
}: CapaSingleExportModalProps) {
  if (!isOpen || !capa) return null;

  const pdfSettings = loadPdfHeaderSettings();

  const handleExportPdf = () => {
    exportSingleCapaPdf(capa);
    onClose();
  };

  const handleExportExcel = () => {
    exportSingleCapaExcel(capa);
    onClose();
  };

  const handleExportCsv = () => {
    const rows = [
      ['CAPA Number', capa.capaNumber],
      ['Issue Title', capa.issueTitle],
      ['Trigger Source', capa.source],
      ['Department', capa.department || 'QA'],
      ['Severity', capa.severity || 'MAJOR'],
      ['Responsible Lead', capa.responsiblePerson],
      ['Date Raised', capa.dateRaised || 'N/A'],
      ['Target Date', capa.targetCompletionDate],
      ['Actual Completion', capa.actualCompletionDate || 'Pending'],
      ['Status', capa.status],
      ['Root Cause', capa.rootCause || 'N/A'],
      ['Containment Action', capa.containmentAction || 'N/A'],
      ['Corrective Action', capa.correctiveAction || 'N/A'],
      ['Preventive Action', capa.preventiveAction || 'N/A'],
      ['SOP Updated', capa.sopUpdateRequired ? 'YES' : 'NO'],
      ['Training Required', capa.trainingRequired ? 'YES' : 'NO'],
      ['Effectiveness Verified', capa.effectivenessVerified ? 'YES' : 'NO'],
      ['Verified By', capa.verifiedBy || 'N/A'],
      ['Verification Date', capa.verificationDate || 'N/A'],
    ];

    downloadCapaCsv(
      `${capa.capaNumber}_8D_Resolution_Summary_${new Date().toISOString().split('T')[0]}`,
      ['Field', 'Value'],
      rows
    );
    onClose();
  };

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
                <h3 className="text-base font-bold font-mono">{capa.capaNumber}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    capa.status === 'CLOSED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : capa.status === 'VERIFICATION_PENDING'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                      : capa.status === 'IN_PROGRESS'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  }`}
                >
                  {capa.status.replace(/_/g, ' ')}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    capa.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
                  }`}
                >
                  {capa.severity || 'MAJOR'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Export 8D resolution plan, root causes &amp; verification signatures
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

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* CAPA Details Preview Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {capa.issueTitle}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-blue-700">
                    {capa.source.replace(/_/g, ' ')}
                  </span>
                  <span>&bull;</span>
                  <span>{capa.department || 'General QA'}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Lead: {capa.responsiblePerson}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Identified Root Cause:</strong>{' '}
              {capa.rootCause || 'Root cause investigation in progress.'}
            </div>

            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
              <div>
                <span className="text-slate-400 block">Date Raised:</span>
                <span className="font-semibold text-slate-800">{capa.dateRaised || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Date:</span>
                <span className="font-semibold text-slate-800">{capa.targetCompletionDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Verification:</span>
                <span className={`font-semibold ${capa.effectivenessVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {capa.effectivenessVerified ? 'Verified Effective' : 'Pending Verification'}
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
                      PDF 8D Resolution Report
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Formatted document with 8D phases, 5-Whys, containment, corrective actions &amp; sign-offs.
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
                      Excel 8D Workbook
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      .XLS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Individual 8D resolution worksheet formatted for audits, suppliers, and customer reviews.
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

            {/* Option 3: CSV */}
            <div
              onClick={handleExportCsv}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      CSV Data Export
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      .CSV
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Raw key-value pairs of all 8D stages and verification fields for digital archiving.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors shrink-0"
              >
                Export CSV
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
