'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  FileSpreadsheet,
  Table2,
  CheckCircle2,
  Building2,
  GraduationCap,
  Users,
  Award,
} from 'lucide-react';
import { TrainingMatrixItem } from '@/lib/types/modules';
import {
  exportSingleTrainingPdf,
  exportSingleTrainingExcel,
  downloadTrainingCsv,
} from './training-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface TrainingSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: TrainingMatrixItem | null;
}

export function TrainingSingleExportModal({
  isOpen,
  onClose,
  course,
}: TrainingSingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !course) return null;

  const moduleConfig = getModuleExportConfig(pdfSettings, 'training', 'single', course.courseCode);
  const docCode = moduleConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportSingleTrainingPdf(course);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportSingleTrainingExcel(course);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'Course Code',
        'Title',
        'Category',
        'Department',
        'Target Audience',
        'Trainer Name',
        'Frequency',
        'Trained Personnel',
        'Pass Rate %',
        'Next Scheduled Date',
        'Venue',
        'Duration Hours',
        'ISO Standard Clause',
        'Status',
        'Notes',
      ];

      const row = [
        course.courseCode,
        course.title,
        course.category || '',
        course.department || '',
        course.targetAudience,
        course.trainerName,
        course.frequency,
        course.trainedCount || 0,
        course.passRatePercent || 0,
        course.nextScheduledDate || '',
        course.venue || '',
        course.durationHours || 4,
        course.isoClause || 'ISO 9001:2015 Clause 7.2',
        course.status,
        course.notes || '',
      ];

      downloadTrainingCsv(
        `Training_Dossier_${course.courseCode}_${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        [row]
      );
    } finally {
      setIsExporting(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200';
      case 'SCHEDULED':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200';
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
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Export Training Program Dossier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official syllabus lesson plan, attendee records & competency assessment
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
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
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
          <div className="p-4 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/40 to-blue-50/20 dark:from-indigo-950/20 dark:to-blue-950/10">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {course.courseCode}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {course.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Dept: {course.department || 'Quality Assurance'} • Trainer: {course.trainerName}
                </p>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(course.status)}`}
              >
                {course.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-indigo-200/40 dark:border-indigo-900/30 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Trained Count:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {course.trainedCount || 0} Persons
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Pass Rate:</span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {course.passRatePercent || 0}%
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Next Session:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {course.nextScheduledDate || 'TBD'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Duration:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {course.durationHours || 4} Hours
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
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Print / Save PDF
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Course Dossier
                  </div>
                </div>
              </button>

              {/* Excel Card */}
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={isExporting !== null}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Excel Workbook
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Formatted .XLS Sheet
                  </div>
                </div>
              </button>

              {/* CSV Card */}
              <button
                type="button"
                onClick={handleCsvExport}
                disabled={isExporting !== null}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Table2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    CSV Raw Data
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Standard Dataset (.csv)
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ready to generate course dossier</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
