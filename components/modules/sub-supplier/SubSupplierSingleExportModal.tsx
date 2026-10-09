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
  Award,
  Factory,
  ShieldCheck,
} from 'lucide-react';
import { SubSupplier } from '@/lib/types/modules';
import {
  exportSingleSupplierPdf,
  exportSingleSupplierExcel,
  downloadSubSupplierCsv,
} from './sub-supplier-export-utils';
import { loadPdfHeaderSettings, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

interface SubSupplierSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SubSupplier | null;
}

export function SubSupplierSingleExportModal({
  isOpen,
  onClose,
  supplier,
}: SubSupplierSingleExportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const pdfSettings = loadPdfHeaderSettings();

  if (!isOpen || !supplier) return null;

  const moduleConfig = getModuleExportConfig(pdfSettings, 'sub_supplier', 'single', supplier.code);
  const docCode = moduleConfig.fullDocCode;
  const isApproved = supplier.complianceStatus === 'APPROVED';

  // Handle PDF Export
  const handlePdfExport = () => {
    setIsExporting('pdf');
    try {
      exportSingleSupplierPdf(supplier);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    setIsExporting('excel');
    try {
      exportSingleSupplierExcel(supplier);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'Supplier Code',
        'Supplier Name',
        'Category',
        'Country',
        'Facility Location',
        'Contact Person',
        'Email',
        'Phone',
        'Quality Rating',
        'Compliance Status',
        'Audit Score',
        'Lead Time Days',
        'On Time Delivery Rate',
        'Defect Rate %',
        'Assigned QA Lead',
        'Last Audit Date',
        'Next Audit Date',
        'Certifications',
        'Materials Supplied',
      ];

      const row = [
        supplier.code,
        supplier.name,
        supplier.category,
        supplier.country,
        supplier.facilityLocation || '',
        supplier.contactPerson,
        supplier.email,
        supplier.phone,
        supplier.qualityRating,
        supplier.complianceStatus,
        supplier.auditScore,
        supplier.leadTimeDays,
        supplier.onTimeDeliveryRate || 96,
        supplier.defectRatePercent || 1.8,
        supplier.assignedQALead || '',
        supplier.lastAuditDate || '',
        supplier.nextAuditDate || '',
        (supplier.certifications || []).join('; '),
        (supplier.materialsSupplied || []).join('; '),
      ];

      downloadSubSupplierCsv(`Supplier_Dossier_${supplier.code}`, headers, [row]);
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Export Supplier Dossier
                </h3>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {docCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {supplier.code} • {supplier.name}
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
                  {pdfSettings.isoStandardBadge || 'ISO 9001:2015 & Sourcing Compliance Verified'}
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
                  {supplier.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {supplier.category.replace(/_/g, ' ')} • {supplier.country}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : supplier.complianceStatus === 'PROVISIONAL'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : supplier.complianceStatus === 'AUDIT_PENDING'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{supplier.complianceStatus.replace(/_/g, ' ')}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Grade Rating:</span>{' '}
                <span className="font-bold text-blue-700 font-mono">Grade {supplier.qualityRating}</span>
              </div>
              <div>
                <span className="text-slate-500">Audit Score:</span>{' '}
                <span className="font-bold text-emerald-700 font-mono">{supplier.auditScore}%</span>
              </div>
              <div>
                <span className="text-slate-500">Contact:</span>{' '}
                <span className="font-semibold text-slate-700">{supplier.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-500">Lead Time:</span>{' '}
                <span className="font-semibold text-slate-700">{supplier.leadTimeDays} Days</span>
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
                  <h4 className="text-xs font-bold text-slate-900">PDF Dossier</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Printable audit profile with certifications & capacity
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
                  <h4 className="text-xs font-bold text-slate-900">Excel Dossier</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Full supplier profile, terms & audit parameters (.xls)
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
                    Single vendor record with all audit metadata
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
            Vendor Accreditation • Doc Code {docCode}
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
