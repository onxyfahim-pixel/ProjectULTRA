'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  FileSpreadsheet,
  Table2,
  Building2,
  Calendar,
  Users,
  CheckSquare,
  Clock,
  ListTodo,
} from 'lucide-react';
import { MeetingMinutesItem } from '@/lib/types/modules';
import {
  exportSingleMeetingPdf,
  exportSingleMeetingExcel,
  downloadMeetingCsv,
} from './meeting-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface MeetingSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingMinutesItem | null;
}

export function MeetingSingleExportModal({
  isOpen,
  onClose,
  meeting,
}: MeetingSingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !meeting) return null;

  const moduleConfig = getModuleExportConfig(pdfSettings, 'meeting_minutes', 'single', meeting.meetingCode);
  const docCode = moduleConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportSingleMeetingPdf(meeting);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportSingleMeetingExcel(meeting);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'MOM Code',
        'Title',
        'Meeting Type',
        'Date',
        'Time',
        'Duration Mins',
        'Venue',
        'Chairperson',
        'Scribe',
        'Buyer',
        'Order / PO',
        'Style',
        'Attendees Count',
        'Agenda',
        'Action Items Count',
        'Closed Actions Count',
        'Status',
      ];

      const row = [
        meeting.meetingCode,
        meeting.title,
        meeting.meetingType || 'GENERAL',
        meeting.meetingDate,
        meeting.meetingTime || '',
        meeting.durationMinutes || 60,
        meeting.venue || '',
        meeting.chairperson,
        meeting.scribeName || '',
        meeting.buyerName || '',
        meeting.orderPoNumber || '',
        meeting.styleNumber || '',
        meeting.attendeesCount || meeting.attendees?.length || 0,
        meeting.agenda || '',
        meeting.actionItems?.length || 0,
        meeting.actionItems?.filter((a) => a.completed).length || 0,
        meeting.status,
      ];

      downloadMeetingCsv(
        `MOM_Dossier_${meeting.meetingCode}_${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        [row]
      );
    } finally {
      setIsExporting(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'CLOSED':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200';
      case 'ACTIONS_PENDING':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200';
      case 'IN_REVIEW':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  const actionsCount = meeting.actionItems?.length || 0;
  const closedActionsCount = meeting.actionItems?.filter((a) => a.completed).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Export Meeting Minutes Dossier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official minutes of meeting document with attendance &amp; action resolution log
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
              <Building2 className="w-4 h-4 text-teal-500 shrink-0" />
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

          {/* Record Quick Profile Card */}
          <div className="p-4 rounded-xl border border-teal-200/60 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/40 to-emerald-50/20 dark:from-teal-950/20 dark:to-emerald-950/10">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                  {meeting.meetingCode}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {meeting.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Type: {meeting.meetingType ? meeting.meetingType.replace(/_/g, ' ') : 'General'} • Chair: {meeting.chairperson}
                </p>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(meeting.status)}`}
              >
                {meeting.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-teal-200/40 dark:border-teal-900/30 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Date &amp; Time:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {meeting.meetingDate} {meeting.meetingTime ? `(${meeting.meetingTime})` : ''}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Venue:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {meeting.venue || 'HQ Boardroom'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Attendees:</span>
                <p className="font-semibold text-teal-600 dark:text-teal-400">
                  {meeting.attendeesCount || meeting.attendees?.length || 0} Persons
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Action Items:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {closedActionsCount}/{actionsCount} Closed
                </p>
              </div>
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
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:bg-teal-500/5 dark:hover:bg-teal-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Print / Save PDF
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Official MOM Dossier
                  </div>
                </div>
              </button>

              {/* Excel Card */}
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={isExporting !== null}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/5 dark:hover:bg-emerald-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Excel Workbook
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Structured .XLS
                  </div>
                </div>
              </button>

              {/* CSV Card */}
              <button
                type="button"
                onClick={handleCsvExport}
                disabled={isExporting !== null}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 dark:hover:bg-sky-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
                  <Table2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Raw Data (CSV)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Universal Data Format
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
