'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  Table2,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  Briefcase,
  Users,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { JobDescriptionItem } from '@/lib/types/modules';
import {
  computeJobKpis,
  exportJobRegisterPdf,
  exportJobRegisterExcel,
  downloadJobCsv,
} from './job-description-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface JobDescriptionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allJobs: JobDescriptionItem[];
  selectedJobs: JobDescriptionItem[];
}

export function JobDescriptionExportModal({
  isOpen,
  onClose,
  allJobs,
  selectedJobs,
}: JobDescriptionExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedJobs.length > 0 ? 'selected' : 'all'
  );
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen) return null;

  const activeJobs =
    exportScope === 'selected' && selectedJobs.length > 0
      ? selectedJobs
      : allJobs;

  const kpis = computeJobKpis(activeJobs);
  const moduleConfig = getModuleExportConfig(pdfSettings, 'job_description', 'register');
  const docCode = moduleConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportJobRegisterPdf(
        activeJobs,
        exportScope === 'selected'
          ? `Selected ${activeJobs.length} Positions`
          : `All ${activeJobs.length} Positions`
      );
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportJobRegisterExcel(activeJobs);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'Role Code',
        'Title',
        'Department',
        'Level',
        'Incumbent Name',
        'Staff ID',
        'Reports To',
        'Education Required',
        'Experience Years',
        'Status',
        'Employment Type',
        'Technical Skills',
        'Key Responsibilities',
        'Authority Scope',
      ];

      const rows = activeJobs.map((j) => [
        j.roleCode,
        j.title,
        j.department,
        j.level,
        j.incumbentName || 'VACANT',
        j.companyIdNo || '',
        j.supervisorTitle || j.supervisorName || '',
        j.educationRequirement,
        j.experienceYears,
        j.status || 'ACTIVE',
        j.employmentType || 'FULL_TIME',
        j.technicalSkills?.join('; ') || '',
        j.keyResponsibilities?.join('; ') || '',
        j.decisionAuthority || '',
      ]);

      downloadJobCsv(
        `Job_Descriptions_Register_${exportScope}_${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        rows
      );
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Export Job Descriptions &amp; Role Specifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official ISO 9001 Clause 5.3 role specifications &amp; competency matrix register
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
              <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
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

          {/* Export Scope Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Export Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  exportScope === 'all'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">All Positions</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Complete position roster ({allJobs.length} roles)
                  </div>
                </div>
                {exportScope === 'all' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setExportScope('selected')}
                disabled={selectedJobs.length === 0}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedJobs.length === 0
                    ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : exportScope === 'selected'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Selected Positions</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedJobs.length > 0
                      ? `${selectedJobs.length} chosen records`
                      : 'None selected in table'}
                  </div>
                </div>
                {exportScope === 'selected' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Scope Summary Metrics
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs text-slate-500">Roles</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {kpis.total}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs text-slate-500">Active Roles</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {kpis.active}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs text-slate-500">Vacancies</div>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {kpis.vacant}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs text-slate-500">Fill Rate</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {kpis.filledRate}%
                </div>
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
                disabled={isExporting !== null || activeJobs.length === 0}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/5 dark:hover:bg-amber-50/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Print / Save PDF
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Official Position Register
                  </div>
                </div>
              </button>

              {/* Excel Card */}
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={isExporting !== null || activeJobs.length === 0}
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
                    Formatted .XLS Sheet
                  </div>
                </div>
              </button>

              {/* CSV Card */}
              <button
                type="button"
                onClick={handleCsvExport}
                disabled={isExporting !== null || activeJobs.length === 0}
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
                    Universal Data Export
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
