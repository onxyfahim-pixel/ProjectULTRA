'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  Table2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Building2,
  Award,
  Layers,
} from 'lucide-react';
import { LabTestRecord } from '@/lib/types/modules';
import {
  computeTestingKpis,
  exportTestingSummaryPdf,
  exportTestingSummaryExcel,
  downloadTestingCsv,
} from './testing-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface TestingExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTests: LabTestRecord[];
  selectedTests: LabTestRecord[];
}

export function TestingExportModal({
  isOpen,
  onClose,
  allTests,
  selectedTests,
}: TestingExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedTests.length > 0 ? 'selected' : 'all'
  );
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Sync with general PDF header settings
  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen) return null;

  const activeTests =
    exportScope === 'selected' && selectedTests.length > 0 ? selectedTests : allTests;

  const kpis = computeTestingKpis(activeTests);
  const moduleConfig = getModuleExportConfig(pdfSettings, 'testing', 'register');
  const docCode = moduleConfig.fullDocCode;

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      const scopeLabel =
        exportScope === 'selected' && selectedTests.length > 0
          ? `Selected Lab Tests (${selectedTests.length} of ${allTests.length} records)`
          : `All Lab Tests (${allTests.length} records)`;
      exportTestingSummaryPdf(activeTests, scopeLabel);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportTestingSummaryExcel(activeTests);
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

      const rows = activeTests.map((t) => [
        t.testReportNo,
        t.styleNumber,
        t.fabricBatch,
        t.buyerName || '',
        t.orderNumber || '',
        t.garmentItem || '',
        t.testType,
        t.testStandard,
        t.requirement,
        t.actualResult,
        t.verdict,
        t.testedBy,
        t.labName,
        t.apparatusUsed || '',
        t.conditioningHours || '',
        t.temperatureCelsius || '',
        t.humidityPercentage || '',
        t.testDate,
        t.remarks || '',
        t.rootCause || '',
        t.correctiveAction || '',
      ]);

      downloadTestingCsv('Lab_Testing_Master_Register', headers, rows);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 via-white to-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Export Lab Testing Register
                </h3>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {docCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Accredited ISO/IEC 17025 test logs, compliance certificates & datasets
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

          {/* SCOPE SELECTION */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Export Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  exportScope === 'all'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">All Lab Records</span>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    {allTests.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Full laboratory history including passed, failed & pending tests
                </p>
              </button>

              <button
                type="button"
                disabled={selectedTests.length === 0}
                onClick={() => setExportScope('selected')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  exportScope === 'selected'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : selectedTests.length === 0
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Selected Tests</span>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    {selectedTests.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedTests.length === 0
                    ? 'Select tests in registry table using checkboxes'
                    : `Filtered selection of ${selectedTests.length} tests`}
                </p>
              </button>
            </div>
          </div>

          {/* ACTIVE SUMMARY KPIS */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Scope Quality Metrics ({activeTests.length} Tests)
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 block">Total</span>
                <span className="text-base font-extrabold text-slate-900">{kpis.total}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs font-bold text-emerald-600 block">Passed</span>
                <span className="text-base font-extrabold text-emerald-700">{kpis.passed}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-xs font-bold text-rose-600 block">Failed</span>
                <span className="text-base font-extrabold text-rose-700">{kpis.failed}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <span className="text-xs font-bold text-blue-600 block">Pass Rate</span>
                <span className="text-base font-extrabold text-blue-700">{kpis.passRate}%</span>
              </div>
            </div>
          </div>

          {/* EXPORT FORMATS */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              Available Formats
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PDF CARD */}
              <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">PDF Master Report</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Printable landscape document with logo, ISO badges, metrics & sign-offs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePdfExport}
                  disabled={isExporting !== null}
                  className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isExporting === 'pdf' ? 'Preparing...' : 'Print / Save PDF'}</span>
                </button>
              </div>

              {/* EXCEL CARD */}
              <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Excel Spreadsheet</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Formatted .xls workbook with color-coded verdicts & test conditions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExcelExport}
                  disabled={isExporting !== null}
                  className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{isExporting === 'excel' ? 'Exporting...' : 'Export Excel (.xls)'}</span>
                </button>
              </div>

              {/* CSV CARD */}
              <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                    <Table2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">CSV Raw Data</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Standard comma-separated format for ERP imports & statistical analysis
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCsvExport}
                  disabled={isExporting !== null}
                  className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>{isExporting === 'csv' ? 'Exporting...' : 'Export CSV (.csv)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Compliant with ISO/IEC 17025, AATCC & ASTM textile standards
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
