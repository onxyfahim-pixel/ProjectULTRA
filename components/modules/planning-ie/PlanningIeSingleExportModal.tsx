'use client';

import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileDown,
  ShieldCheck,
  ShoppingBag,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Gauge,
  Sliders,
} from 'lucide-react';
import {
  ProductionOrderPlan,
  StyleOperationBulletin,
  ProductionPlanSchedule,
} from '@/lib/types/planning-ie';
import {
  exportSingleProductionOrderPlanPdf,
  exportSingleProductionOrderPlanExcel,
  exportSingleOperationBulletinPdf,
  exportSingleOperationBulletinExcel,
} from './planning-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface PlanningIeSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: ProductionOrderPlan | null;
  bulletin?: StyleOperationBulletin | null;
  schedule?: ProductionPlanSchedule | null;
}

export function PlanningIeSingleExportModal({
  isOpen,
  onClose,
  order,
  bulletin,
  schedule,
}: PlanningIeSingleExportModalProps) {
  if (!isOpen || (!order && !bulletin && !schedule)) return null;

  const pdfSettings = loadPdfHeaderSettings();

  const handleExportPdf = () => {
    if (order) {
      exportSingleProductionOrderPlanPdf(order);
    } else if (bulletin) {
      exportSingleOperationBulletinPdf(bulletin);
    }
    onClose();
  };

  const handleExportExcel = () => {
    if (order) {
      exportSingleProductionOrderPlanExcel(order);
    } else if (bulletin) {
      exportSingleOperationBulletinExcel(bulletin);
    }
    onClose();
  };

  const titleCode = order
    ? order.orderNumber
    : bulletin
    ? bulletin.styleNumber
    : schedule
    ? schedule.orderNumber
    : 'RECORD';

  const titleType = order
    ? 'Production Order Plan'
    : bulletin
    ? 'Style Operation Bulletin'
    : 'MPS Line Schedule';

  const statusBadge = order?.status || bulletin?.approvalStatus || schedule?.status || 'ACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono">{titleCode}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {statusBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Export individual {titleType} in PDF or Excel format
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Linked PDF Header Notice */}
        <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">
              <strong>Header Linked from Settings:</strong>{' '}
              {pdfSettings.companyName || 'Valiant Garments'}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            Live Synced
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Order Details Preview Box */}
          {order && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{order.style}</div>
                  <div className="text-[11px] text-slate-500">
                    Buyer: <strong className="text-blue-700">{order.buyer}</strong> &bull; PO: {order.po}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {order.assignedLine || 'Sewing Line 01'} ({order.assignedDepartment || 'SEWING'})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-700">
                    {(order.plannedQuantity || 0).toLocaleString()} pcs planned
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Order: {(order.orderQuantity || 0).toLocaleString()} pcs
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">SMV:</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {(order.smv || 11.2).toFixed(2)} min
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Timeline:</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {order.productionStartDate} &rarr; {order.deliveryDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Material:</span>
                  <span className="font-semibold text-emerald-700 truncate block">
                    {order.fabricStatus ? order.fabricStatus.split('-')[0] : 'In-House'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bulletin Details Preview Box */}
          {bulletin && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{bulletin.styleDescription}</div>
                  <div className="text-[11px] text-slate-500">
                    Buyer: <strong className="text-blue-700">{bulletin.buyerName}</strong> &bull; Type: {bulletin.garmentType}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {bulletin.operations?.length || 0} Operations Planned
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-blue-700">
                    {(bulletin.totalSmv || 0).toFixed(3)} min SMV
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    Balancing: {(bulletin.balancingEfficiency || 82).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">Target Ops:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {bulletin.targetLineOperators || 28} Operators
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pitch Time:</span>
                  <span className="font-semibold text-blue-700">
                    {(bulletin.linePitchTimeSec || 24).toFixed(1)} sec
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Shift Target:</span>
                  <span className="font-semibold text-emerald-700">
                    {(bulletin.plannedDailyOutput || 1200).toLocaleString()} pcs
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Export Format Cards */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose Export Format
            </label>

            {/* Option 1: PDF */}
            <div
              onClick={handleExportPdf}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      PDF Document
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Printable technical specification sheet with synced company header &amp; QR verification.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors shrink-0"
              >
                Export PDF
              </button>
            </div>

            {/* Option 2: Excel */}
            <div
              onClick={handleExportExcel}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Excel Spreadsheet
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      .XLS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Individual data sheet formatted for spreadsheet software.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white rounded-lg transition-colors shrink-0"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
