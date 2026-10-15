'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  Table2,
  ListFilter,
  Check,
} from 'lucide-react';
import { AnnualTrainingScheduleItem } from '@/lib/types/modules';
import {
  exportTrainingCalendarPdf,
  exportTrainingCalendarExcel,
  exportTrainingCalendarCsv,
  filterScheduleForExport,
  TrainingCalendarExportOptions,
} from './training-calendar-export-utils';
import { PdfSignatureMode } from '@/lib/pdf/pdf-header-store';

interface TrainingCalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleItems: AnnualTrainingScheduleItem[];
  defaultMonth?: number;
  defaultSection?: string;
}

const MONTH_OPTIONS = [
  { index: 0, label: 'Full Year 2026 (All 12 Months)' },
  { index: 1, label: 'January 2026' },
  { index: 2, label: 'February 2026' },
  { index: 3, label: 'March 2026' },
  { index: 4, label: 'April 2026' },
  { index: 5, label: 'May 2026' },
  { index: 6, label: 'June 2026' },
  { index: 7, label: 'July 2026' },
  { index: 8, label: 'August 2026' },
  { index: 9, label: 'September 2026' },
  { index: 10, label: 'October 2026' },
  { index: 11, label: 'November 2026' },
  { index: 12, label: 'December 2026' },
];

const SECTION_OPTIONS = [
  { key: 'ALL', label: 'All Factory Divisions' },
  { key: 'CUTTING_SECTION', label: 'Cutting Division' },
  { key: 'SEWING_SECTION', label: 'Sewing Production' },
  { key: 'FINISHING_PACKING', label: 'Finishing & Packing' },
  { key: 'FABRIC_LAB', label: 'Fabric Warehouse & Lab' },
  { key: 'QUALITY_ASSURANCE', label: 'Quality Assurance' },
  { key: 'MAINTENANCE_SAFETY', label: 'Maintenance & Safety' },
];

export function TrainingCalendarExportModal({
  isOpen,
  onClose,
  scheduleItems,
  defaultMonth = 0,
  defaultSection = 'ALL',
}: TrainingCalendarExportModalProps) {
  const [exportType, setExportType] = useState<'combined' | 'calendar_only' | 'matrix_only' | 'agenda_only'>('combined');
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [selectedSection, setSelectedSection] = useState<string>(defaultSection);
  const [signatureMode, setSignatureMode] = useState<PdfSignatureMode>('quad');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportOptions: TrainingCalendarExportOptions = {
    exportType,
    selectedMonth,
    selectedSection,
    year: 2026,
    signatureMode,
    includeMarkings: true,
    includeMatrix: true,
    includeAgenda: true,
    includeSignatures: signatureMode !== 'none',
  };

  const filteredPreviewItems = filterScheduleForExport(scheduleItems, exportOptions);
  const totalSeats = filteredPreviewItems.reduce((acc, i) => acc + (i.targetSeats || 0), 0);
  const completedCount = filteredPreviewItems.filter((i) => i.status === 'COMPLETED').length;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportTrainingCalendarPdf(scheduleItems, exportOptions);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportTrainingCalendarExcel(scheduleItems, exportOptions);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      exportTrainingCalendarCsv(scheduleItems, exportOptions);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Export Annual Training Calendar &amp; Matrix
                </h3>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  ISO 9001 Clause 7.2
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate high-resolution printable PDF, Excel matrix sheets, or CSV schedules with date markings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* 1. DOCUMENT PREVIEW STRIP */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Document Summary Preview
              </span>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                ULTRA-QA-TRN-CAL-2026
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Active Scope Sessions</span>
                <strong className="text-slate-900 font-mono text-sm">{filteredPreviewItems.length} Sessions</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Completed / Logged</span>
                <strong className="text-emerald-700 font-mono text-sm">{completedCount} Completed</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Target Seat Capacity</span>
                <strong className="text-indigo-700 font-mono text-sm">{totalSeats} Trainee Seats</strong>
              </div>
            </div>
          </div>

          {/* 2. EXPORT PACKAGE / LAYOUT TYPE */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Select Document Layout Package:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setExportType('combined')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  exportType === 'combined'
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${exportType === 'combined' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Complete Master Package</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Visual Calendar Grid + 12M Section Matrix + Detailed Session Agenda &amp; Sign-off
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportType('calendar_only')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  exportType === 'calendar_only'
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${exportType === 'calendar_only' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Visual Monthly Calendar</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Monthly calendar grid with day cells, session markings, time slots, and room locations
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportType('matrix_only')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  exportType === 'matrix_only'
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${exportType === 'matrix_only' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Table2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">12-Month Section Matrix</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Landscape wall-chart matrix cross-mapping all 6 sections against Jan–Dec
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportType('agenda_only')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  exportType === 'agenda_only'
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${exportType === 'agenda_only' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <ListFilter className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Day-of-Training Agenda</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Tabular master schedule listing dates, trainers, venues, seat capacities, and notes
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. TIME PERIOD & DIVISION FILTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Month Range:</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Section / Factory Division:</span>
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {SECTION_OPTIONS.map((sec) => (
                  <option key={sec.key} value={sec.key}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. COMPLIANCE SIGNATURE MODE */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Compliance Authorization Sign-Off Blocks:</span>
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { mode: 'quad', label: 'Quad (4 Signatures)', desc: 'Prepared, QA, HR, GM' },
                { mode: 'triple', label: 'Triple (3 Signatures)', desc: 'Prepared, QA, GM' },
                { mode: 'dual', label: 'Dual (2 Signatures)', desc: 'Prepared, GM' },
                { mode: 'none', label: 'None', desc: 'No signature slots' },
              ].map((s) => (
                <button
                  key={s.mode}
                  type="button"
                  onClick={() => setSignatureMode(s.mode as PdfSignatureMode)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    signatureMode === s.mode
                      ? 'bg-indigo-50/70 border-indigo-400 text-indigo-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[11px] font-bold">{s.label.split(' ')[0]}</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5 truncate">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER WITH EXPORT ACTIONS */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExcelExport}
              disabled={isExporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xls)</span>
            </button>
            <button
              type="button"
              onClick={handleCsvExport}
              disabled={isExporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV Schedule</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePdfExport}
              disabled={isExporting !== null}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isExporting === 'pdf' ? 'Generating PDF...' : 'Print / Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
