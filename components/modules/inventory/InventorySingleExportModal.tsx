'use client';

import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileDown,
  ShieldCheck,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  MapPin,
  DollarSign,
  Package,
} from 'lucide-react';
import { InventoryItem, ReceiveRecord, IssueRecord } from '@/lib/types/erp';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';
import {
  exportSingleStockItemPdf,
  exportSingleStockItemExcel,
  exportSingleReceiveRecordPdf,
  exportSingleReceiveRecordExcel,
  exportSingleIssueRecordPdf,
  exportSingleIssueRecordExcel,
} from './inventory-export-utils';

export type InventorySingleExportTarget =
  | {
      type: 'stock';
      item: InventoryItem;
      linkedGrns?: ReceiveRecord[];
      linkedIssues?: IssueRecord[];
    }
  | {
      type: 'receive';
      record: ReceiveRecord;
      matchedItem?: InventoryItem;
    }
  | {
      type: 'issue';
      record: IssueRecord;
      matchedItem?: InventoryItem;
    };

interface InventorySingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: InventorySingleExportTarget | null;
}

export function InventorySingleExportModal({
  isOpen,
  onClose,
  target,
}: InventorySingleExportModalProps) {
  if (!isOpen || !target) return null;

  const pdfSettings = loadPdfHeaderSettings();

  const handleExportPdf = () => {
    if (target.type === 'stock') {
      exportSingleStockItemPdf(target.item, target.linkedGrns || [], target.linkedIssues || []);
    } else if (target.type === 'receive') {
      exportSingleReceiveRecordPdf(target.record, target.matchedItem);
    } else {
      exportSingleIssueRecordPdf(target.record, target.matchedItem);
    }
    onClose();
  };

  const handleExportExcel = () => {
    if (target.type === 'stock') {
      exportSingleStockItemExcel(target.item, target.linkedGrns || [], target.linkedIssues || []);
    } else if (target.type === 'receive') {
      exportSingleReceiveRecordExcel(target.record, target.matchedItem);
    } else {
      exportSingleIssueRecordExcel(target.record, target.matchedItem);
    }
    onClose();
  };

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
              {target.type === 'stock' && (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono">{target.item.sku}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {target.item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Export individual raw material stock specification &amp; movement history
                  </p>
                </>
              )}

              {target.type === 'receive' && (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono">{target.record.grnNumber}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {target.record.qcStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Export Goods Received Note &amp; warehouse inward QC report
                  </p>
                </>
              )}

              {target.type === 'issue' && (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono">{target.record.sivNumber}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {target.record.issuedTo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Export Store Issue Voucher &amp; floor requisition slip
                  </p>
                </>
              )}
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
              <strong>Header Linked from Settings:</strong> {pdfSettings.companyName || 'Valiant Garments'}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            Live Synced
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Target Preview Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            {target.type === 'stock' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{target.item.fabricType}</div>
                    <div className="text-[11px] text-slate-500">
                      Color: <strong className="text-blue-700">{target.item.color}</strong> • Lot: {target.item.batchLot}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                      Bay: {target.item.warehouseLocation} • Grade: {target.item.qualityGrade}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-700">
                      ${((target.item.quantityMeters || 0) * (target.item.unitCost || 0)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {(target.item.quantityMeters || 0).toLocaleString()} {target.item.unit || 'm'} @ ${target.item.unitCost.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Roll Count:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {target.item.rollCount || 0} Rolls
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Inward GRNs:</span>
                    <span className="font-semibold text-emerald-700">
                      {(target.linkedGrns || []).length} linked
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Floor Issues:</span>
                    <span className="font-semibold text-amber-700">
                      {(target.linkedIssues || []).length} SIVs
                    </span>
                  </div>
                </div>
              </>
            )}

            {target.type === 'receive' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{target.record.supplierName}</div>
                    <div className="text-[11px] text-slate-500">
                      Challan: <strong className="text-blue-700">{target.record.challanNumber}</strong> • PO: {target.record.poNumber}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {target.record.itemName} ({target.record.sku})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-700">
                      +{target.record.receivedQty.toLocaleString()} {target.record.unit}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {target.record.rollsReceived ? `${target.record.rollsReceived} Rolls • ` : ''}Date: {target.record.date}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Location:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {target.record.warehouseLocation}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">QC Status:</span>
                    <span className="font-semibold text-emerald-700">
                      {target.record.qcStatus} ({target.record.qualityGrade})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Received By:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {target.record.receivedBy}
                    </span>
                  </div>
                </div>
              </>
            )}

            {target.type === 'issue' && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{target.record.departmentDetail}</div>
                    <div className="text-[11px] text-slate-500">
                      PO: <strong className="text-blue-700">{target.record.poNumber}</strong> • Style: {target.record.styleNumber}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {target.record.itemName} ({target.record.sku})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-amber-900">
                      -{target.record.issuedQty.toLocaleString()} {target.record.unit}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Req: {target.record.requisitionNumber} • Date: {target.record.date}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Purpose:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {target.record.purpose}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Floor Sign:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {target.record.receivedByFloor}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Store Sign:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {target.record.issuedBy}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

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
                      {target.type === 'stock' && 'PDF Material Specification'}
                      {target.type === 'receive' && 'PDF Goods Received Note'}
                      {target.type === 'issue' && 'PDF Store Issue Voucher'}
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {target.type === 'stock' && 'Item ledger card with full specifications & audit history.'}
                    {target.type === 'receive' && 'Formal GRN receiving document with QC sign-off.'}
                    {target.type === 'issue' && 'Official factory floor delivery slip & authorization.'}
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
                      Excel Workbook
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      .XLS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Structured workbook with complete item properties &amp; movement log.
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
