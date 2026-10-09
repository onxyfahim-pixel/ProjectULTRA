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
  Gauge,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { CalibrationDevice } from '@/lib/types/modules';
import {
  exportSingleCalibrationPdf,
  exportSingleCalibrationExcel,
  downloadCalibrationCsv,
} from './calibration-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface CalibrationSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: CalibrationDevice | null;
}

export function CalibrationSingleExportModal({
  isOpen,
  onClose,
  device,
}: CalibrationSingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !device) return null;

  const exportConfig = getModuleExportConfig(pdfSettings, 'calibration', 'single', device.deviceTag);
  const docCode = exportConfig.fullDocCode;
  const isCalibrated = device.status === 'CALIBRATED';

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportSingleCalibrationPdf(device);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportSingleCalibrationExcel(device);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'Device Tag',
        'Device Name',
        'Model',
        'Serial Number',
        'Brand / Manufacturer',
        'Department / Section',
        'Location / Room',
        'Status',
        'Calibration Frequency',
        'Last Calibration Date',
        'Next Due Date',
        'Calibrated By',
        'Calibration Agency',
        'Certificate Number',
        'Accreditation Standard',
        'Uncertainty Budget',
        'Acceptance Criteria',
        'Result',
        'Third Party Certified',
        'Notes',
      ];

      const row = [
        device.deviceTag,
        device.deviceName,
        device.model,
        device.serialNumber || 'N/A',
        device.brandName || 'N/A',
        device.department || 'N/A',
        device.location,
        device.status,
        `${device.calibrationFrequencyMonths || 6} Months`,
        device.lastCalibrationDate,
        device.nextDueDate,
        device.calibratedBy || 'In-House Metrology',
        device.calibrationAgency || 'Internal Calibration Lab',
        device.certificateNumber || 'N/A',
        device.standardBasis || 'ISO/IEC 17025',
        device.accuracyTolerance || '±0.05 mm / 0.1%',
        device.accuracyTolerance || '±0.1% Full Scale',
        device.calibrationResult || 'PASS / CONFORMING',
        device.isThirdPartyCertified ? 'Yes' : 'No',
        device.remarks || '',
      ];

      downloadCalibrationCsv(
        `Calibration_Certificate_${device.deviceTag.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        [row]
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
                Export Calibration Certificate
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official metrology calibration dossier & certification records
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

          {/* Record Quick Profile Card */}
          <div className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/40 to-orange-50/20 dark:from-amber-950/20 dark:to-orange-950/10">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  {device.deviceTag}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {device.deviceName}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Model: {device.model} • SN: {device.serialNumber || 'N/A'} • Dept: {device.department || 'N/A'}
                </p>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isCalibrated
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                {device.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-amber-200/40 dark:border-amber-900/30 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Last Calibration:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {device.lastCalibrationDate || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Next Due:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {device.nextDueDate}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Standard:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {device.standardBasis || 'ISO/IEC 17025'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Agency:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {device.calibrationAgency || 'Internal Lab'}
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
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-all text-center gap-2 shadow-sm disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Print / Save PDF
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Official Certificate
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
            <span>Ready to generate certificate</span>
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
