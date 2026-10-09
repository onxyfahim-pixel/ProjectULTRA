'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  FileSpreadsheet,
  Table2,
  Building2,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { CommunicationNotice } from '@/lib/types/modules';
import {
  exportCommunicationSinglePdf,
  exportCommunicationSingleExcel,
  exportCommunicationSingleCsv,
} from './communication-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface CommunicationSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: CommunicationNotice | null;
}

export function CommunicationSingleExportModal({
  isOpen,
  onClose,
  notice,
}: CommunicationSingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !notice) return null;

  const exportConfig = getModuleExportConfig(pdfSettings, 'communication', 'single', notice.noticeNumber);
  const docCode = exportConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportCommunicationSinglePdf(notice);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportCommunicationSingleExcel(notice);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      exportCommunicationSingleCsv(notice);
    } finally {
      setIsExporting(null);
    }
  };

  const isUrgent = notice.urgency === 'HIGH_PRIORITY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isUrgent
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Export Directive Bulletin</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-700 font-bold border border-indigo-200">
                  {notice.noticeNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official plant circular, instructions &amp; digital acknowledgment record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTICE PROFILE CARD */}
        <div className="p-6 space-y-5">
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{notice.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>Issued By: <strong className="text-slate-700">{notice.author}</strong></span>
                  <span>•</span>
                  <span>Target: <strong className="text-slate-700">{notice.targetDepartment}</strong></span>
                </div>
              </div>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border shrink-0 ${
                  isUrgent
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : notice.urgency === 'STANDARD'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {notice.urgency.replace('_', ' ')}
              </span>
            </div>

            {notice.content && (
              <p className="text-xs text-slate-600 line-clamp-2 bg-white/70 p-2.5 rounded-lg border border-slate-200/60 font-serif italic">
                "{notice.content}"
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs">
              <div className="bg-white/80 p-2 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Broadcast Date
                </span>
                <span className="font-semibold text-slate-700 font-mono text-[11px] mt-0.5 block">
                  {notice.publishedDate}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" /> Category
                </span>
                <span className="font-semibold text-slate-700 text-[11px] mt-0.5 block truncate">
                  {(notice.category || 'ANNOUNCEMENT').replace(/_/g, ' ')}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" /> Acknowledged
                </span>
                <span className="font-semibold text-emerald-600 font-mono text-[11px] mt-0.5 block">
                  {notice.acknowledgedCount || 0} / {notice.totalRecipientsCount || 20}
                </span>
              </div>
            </div>
          </div>

          {/* EXPORT ACTION BUTTONS */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Choose Export Format
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* PDF EXPORT */}
              <button
                onClick={handlePdfExport}
                disabled={!!isExporting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">
                      Official Directive PDF Notice
                    </h5>
                    <p className="text-xs text-slate-500">
                      Standard ISO-compliant plant directive with management sign-off blocks
                    </p>
                  </div>
                </div>
                <FileDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              {/* EXCEL EXPORT */}
              <button
                onClick={handleExcelExport}
                disabled={!!isExporting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">
                      Excel Workbook Dossier (.xls)
                    </h5>
                    <p className="text-xs text-slate-500">
                      Directive specs with digital sign-off log for auditing
                    </p>
                  </div>
                </div>
                <FileDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              {/* CSV EXPORT */}
              <button
                onClick={handleCsvExport}
                disabled={!!isExporting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Table2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">
                      Notice Dataset (.csv)
                    </h5>
                    <p className="text-xs text-slate-500">
                      Tabular format suitable for ERP integration and databases
                    </p>
                  </div>
                </div>
                <FileDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">DOC:</span>
            <span className="font-mono text-[10px] font-bold text-slate-600 px-1.5 py-0.5 rounded bg-white border border-slate-200">
              {docCode}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
