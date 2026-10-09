'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  FileSpreadsheet,
  Table2,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FlaskConical,
  Layers,
  Thermometer,
} from 'lucide-react';
import { LabTestRecord } from '@/lib/types/modules';
import {
  exportSingleTestPdf,
  exportSingleTestExcel,
  downloadTestingCsv,
} from './testing-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface TestingSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: LabTestRecord | null;
}

export function TestingSingleExportModal({
  isOpen,
  onClose,
  test,
}: TestingSingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !test) return null;

  const moduleConfig = getModuleExportConfig(pdfSettings, 'testing', 'single', test.testReportNo);
  const docCode = moduleConfig.fullDocCode;
  const isPassed = test.verdict === 'PASS';
  const isFailed = test.verdict === 'FAIL';

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportSingleTestPdf(test);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportSingleTestExcel(test);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'Test Report No',
        'Style Number',
        'Fabric Batch',
        'Buyer Name',
        'Order Number',
        'Garment Item',
        'Test Type',
        'Test Standard',
        'Requirement',
        'Actual Result',
        'Verdict',
        'Tested By',
        'Lab Facility',
        'Apparatus Used',
        'Conditioning Hours',
        'Temperature C',
        'Humidity %',
        'Test Date',
        'Remarks',
        'Root Cause',
        'Corrective Action',
      ];

      const row = [
        test.testReportNo,
        test.styleNumber,
        test.fabricBatch,
        test.buyerName || '',
        test.orderNumber || '',
        test.garmentItem || '',
        test.testType,
        test.testStandard,
        test.requirement,
        test.actualResult,
        test.verdict,
        test.testedBy,
        test.labName,
        test.apparatusUsed || '',
        test.conditioningHours || '',
        test.temperatureCelsius || '',
        test.humidityPercentage || '',
        test.testDate,
        test.remarks || '',
        test.rootCause || '',
        test.correctiveAction || '',
      ];

      downloadTestingCsv(`Lab_Certificate_${test.testReportNo}`, headers, [row]);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 via-white to-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Export Lab Test Certificate
                </h3>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {docCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {test.testReportNo} • Style {test.styleNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* LIVE HEADER SYNC BADGE */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-blue-700" />
              <div>
                <span className="text-xs font-bold text-blue-950 block">
                  {pdfSettings.companyName}
                </span>
                <span className="text-[10px] text-blue-700 font-medium">
                  {pdfSettings.isoStandardBadge || 'ISO 9001:2015 & ISO/IEC 17025 Compliant'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Header Synced</span>
            </div>
          </div>

          {/* RECORD SUMMARY PREVIEW */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {String(test.testType).replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Method: {test.testStandard}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isPassed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : isFailed
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : isFailed ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{test.verdict}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Buyer Spec:</span>{' '}
                <span className="font-semibold text-slate-700">{test.requirement}</span>
              </div>
              <div>
                <span className="text-slate-500">Actual Result:</span>{' '}
                <span
                  className={`font-bold font-mono ${
                    isPassed ? 'text-emerald-700' : isFailed ? 'text-rose-700' : 'text-amber-700'
                  }`}
                >
                  {test.actualResult}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Batch:</span>{' '}
                <span className="font-mono text-slate-700">{test.fabricBatch}</span>
              </div>
              <div>
                <span className="text-slate-500">Tested By:</span>{' '}
                <span className="font-semibold text-slate-700">{test.testedBy}</span>
              </div>
            </div>
          </div>

          {/* EXPORT FORMATS */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              Available Formats
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PDF CERTIFICATE */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2.5">
                    <Printer className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Lab Certificate</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Printable ISO 17025 certificate with signatures & stamps
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePdfExport}
                  disabled={isExporting !== null}
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3 h-3" />
                  <span>{isExporting === 'pdf' ? 'Preparing...' : 'Print PDF'}</span>
                </button>
              </div>

              {/* EXCEL CERTIFICATE */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Excel Report</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Full test details, environmental condition & formulas (.xls)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExcelExport}
                  disabled={isExporting !== null}
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>{isExporting === 'excel' ? 'Exporting...' : 'Excel (.xls)'}</span>
                </button>
              </div>

              {/* CSV DATA */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-2.5">
                    <Table2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">CSV Record</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Single test row with all technical parameter fields
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCsvExport}
                  disabled={isExporting !== null}
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Table2 className="w-3 h-3" />
                  <span>{isExporting === 'csv' ? 'Exporting...' : 'CSV (.csv)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Certified Laboratory Document • Doc Code {docCode}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
