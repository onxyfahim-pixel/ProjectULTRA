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
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { RiskFmeaItem } from '@/lib/types/modules';
import {
  exportSingleRiskPdf,
  exportSingleRiskExcel,
  downloadRiskCsv,
} from './risk-assessment-export-utils';
import { getRiskLevel } from './riskAssessmentData';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface RiskAssessmentSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RiskFmeaItem | null;
}

export function RiskAssessmentSingleExportModal({
  isOpen,
  onClose,
  record,
}: RiskAssessmentSingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !record) return null;

  const moduleConfig = getModuleExportConfig(pdfSettings, 'risk_assessment', 'single', record.fmeaCode);
  const docCode = moduleConfig.fullDocCode;
  const rpn = record.rpn || (record.severity || 1) * (record.occurrence || 1) * (record.detection || 1);
  const level = record.riskLevel || getRiskLevel(rpn, record.severity || 1);

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportSingleRiskPdf(record);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportSingleRiskExcel(record);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'FMEA Code',
        'Assessment Type',
        'Assessment Date',
        'Style Number',
        'Buyer',
        'Order Number',
        'Department',
        'Process Step',
        'Potential Failure Mode',
        'Potential Effect',
        'Potential Causes',
        'Current Controls',
        'Severity',
        'Occurrence',
        'Detection',
        'RPN',
        'Risk Level',
        'Mitigation Action',
        'Responsible Lead',
        'Target Date',
        'Status',
        'Assessor Name',
      ];

      const row = [
        record.fmeaCode,
        record.assessmentType || 'PROCESS',
        record.assessmentDate || '',
        record.styleNumber || '',
        record.buyer || '',
        record.orderNumber || '',
        record.department || '',
        record.processStep,
        record.potentialFailureMode,
        record.potentialEffect,
        record.potentialCauses || '',
        record.currentControls || '',
        record.severity,
        record.occurrence,
        record.detection,
        rpn,
        level,
        record.mitigationAction,
        record.responsibleLead,
        record.targetDate || '',
        record.status || 'IN_PROGRESS',
        record.assessorName || '',
      ];

      downloadRiskCsv(`Risk_FMEA_${record.fmeaCode}`, headers, [row]);
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
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Export FMEA Assessment Report
                </h3>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {docCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {record.fmeaCode} • {record.styleNumber || 'Standard'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                  {pdfSettings.isoStandardBadge || 'ISO 9001:2015 & Pre-Production FMEA Protocol'}
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
                <span className="text-sm font-bold text-slate-900 block">
                  {record.processStep}
                </span>
                <span className="text-[11px] text-slate-500">
                  Style: {record.styleNumber || 'Standard'} {record.buyer ? `• Buyer: ${record.buyer}` : ''}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  level === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : level === 'HIGH'
                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                    : level === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{level} (RPN {rpn})</span>
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
              <span className="text-rose-700 font-bold block mb-0.5">Potential Failure Mode:</span>
              <p className="text-[11px] text-slate-600">{record.potentialFailureMode}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <span className="text-slate-500">Severity/Occ/Det:</span>{' '}
                <span className="font-bold text-slate-800 font-mono">
                  S{record.severity} · O{record.occurrence} · D{record.detection}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Responsible Lead:</span>{' '}
                <span className="font-semibold text-slate-800">{record.responsibleLead}</span>
              </div>
            </div>
          </div>

          {/* EXPORT FORMATS */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              Available Formats
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PDF DOSSIER */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2.5">
                    <Printer className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">PDF Report</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Printable FMEA assessment sheet with matrices & sign-offs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePdfExport}
                  disabled={isExporting !== null}
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isExporting === 'pdf' ? 'Preparing...' : 'Print PDF'}</span>
                </button>
              </div>

              {/* EXCEL REPORT */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Excel Report</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    FMEA worksheet with RPN calculations & controls (.xls)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExcelExport}
                  disabled={isExporting !== null}
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
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
                    Single risk row with all FMEA variables
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCsvExport}
                  disabled={isExporting !== null}
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>{isExporting === 'csv' ? 'Exporting...' : 'CSV (.csv)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            FMEA Quality System • Doc Code {docCode}
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
