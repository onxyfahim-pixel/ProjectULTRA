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
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { FactoryEventItem } from '@/lib/types/modules';
import {
  exportSingleEventPdf,
  exportSingleEventExcel,
  downloadEventCsv,
} from './event-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface EventSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FactoryEventItem | null;
}

export function EventSingleExportModal({
  isOpen,
  onClose,
  event,
}: EventSingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !event) return null;

  const moduleConfig = getModuleExportConfig(pdfSettings, 'events', 'single', event.eventCode);
  const docCode = moduleConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportSingleEventPdf(event);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportSingleEventExcel(event);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'Event Code',
        'Title',
        'Type',
        'Start Date',
        'End Date',
        'Time Slot',
        'Location',
        'Lead Organizer',
        'Buyer',
        'Department',
        'Priority',
        'Delegates Count',
        'Readiness %',
        'Status',
        'Description',
      ];

      const row = [
        event.eventCode,
        event.title,
        event.type ? String(event.type).replace(/_/g, ' ') : 'EVENT',
        event.eventDate,
        event.endDate || '',
        event.timeSlot || '',
        event.location,
        event.leadOrganizer,
        event.buyerName || '',
        event.department || '',
        event.priority || 'MEDIUM',
        event.attendeesCount || event.delegationMembers?.length || 0,
        event.readinessPercentage || 0,
        event.status,
        event.description || event.agendaSummary || '',
      ];

      downloadEventCsv(
        `Event_Dossier_${event.eventCode}_${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        [row]
      );
    } finally {
      setIsExporting(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'CONCLUDED':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200';
      case 'UPCOMING':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200';
      case 'POSTPONED':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Export Event &amp; Delegation Dossier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official delegation briefing, itinerary schedule &amp; preparation protocol
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
              <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
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
          <div className="p-4 rounded-xl border border-violet-200/60 dark:border-violet-900/40 bg-gradient-to-br from-violet-50/40 to-indigo-50/20 dark:from-violet-950/20 dark:to-indigo-950/10">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
                  {event.eventCode}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {event.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Type: {event.type ? String(event.type).replace(/_/g, ' ') : 'Event'} • Organizer: {event.leadOrganizer}
                </p>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(event.status)}`}
              >
                {event.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-violet-200/40 dark:border-violet-900/30 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Date &amp; Time:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {event.eventDate} {event.timeSlot ? `(${event.timeSlot})` : ''}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Location:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {event.location}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Delegates:</span>
                <p className="font-semibold text-violet-600 dark:text-violet-400">
                  {event.attendeesCount || event.delegationMembers?.length || 0} Persons
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Readiness:</span>
                <p className="font-semibold text-teal-600 dark:text-teal-400">
                  {event.readinessPercentage || 0}% Prepared
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
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 hover:bg-violet-50/5 dark:hover:bg-violet-50/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Print / Save PDF
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Official Event Dossier
                  </div>
                </div>
              </button>

              {/* Excel Card */}
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={isExporting !== null}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/5 dark:hover:bg-emerald-50/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
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
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-50/5 dark:hover:bg-sky-50/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
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
