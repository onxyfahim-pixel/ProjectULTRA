'use client';

import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileDown,
  ShieldCheck,
  Package,
  Layers,
  DollarSign,
  Calendar,
  CheckCircle2,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { BuyerOrder } from '@/lib/types/modules';
import { ReceiveRecord, InventoryItem } from '@/lib/types/erp';
import {
  exportSingleBuyerOrderPdf,
  exportSingleBuyerOrderExcel,
} from './buyer-order-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';
import {
  computeWIPRecordForPO,
  calculateWIPPipelineMetrics,
} from '@/lib/db/wip-record-store';

interface BuyerOrderSingleExportModalProps {
  order: BuyerOrder | null;
  isOpen: boolean;
  onClose: () => void;
  linkedGrn?: ReceiveRecord[];
  linkedInventory?: InventoryItem[];
}

export function BuyerOrderSingleExportModal({
  order,
  isOpen,
  onClose,
  linkedGrn = [],
  linkedInventory = [],
}: BuyerOrderSingleExportModalProps) {
  if (!isOpen || !order) return null;

  const pdfSettings = loadPdfHeaderSettings();
  const totalValue = order.orderQuantity * order.fobPrice;
  const bomCount = order.bomItems?.length || 0;

  // Compute live WIP Record and Pipeline Metrics so exports and preview have real floor numbers
  const wip = React.useMemo(() => {
    return computeWIPRecordForPO(
      order.orderNumber,
      order.orderQuantity,
      order.wipRecord,
      order.productionTracking?.stages,
      order.status,
      order.styleNumber
    );
  }, [order]);

  const pipelineMetrics = React.useMemo(() => {
    if (!wip) return null;
    return calculateWIPPipelineMetrics(wip, order.orderQuantity);
  }, [wip, order.orderQuantity]);

  const handleExportPdf = () => {
    const orderWithWip = wip ? { ...order, wipRecord: wip } : order;
    exportSingleBuyerOrderPdf(orderWithWip, linkedGrn, linkedInventory);
    onClose();
  };

  const handleExportExcel = () => {
    const orderWithWip = wip ? { ...order, wipRecord: wip } : order;
    exportSingleBuyerOrderExcel(orderWithWip, linkedGrn, linkedInventory);
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
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono">PO {order.orderNumber}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Export individual purchase order specification &amp; tech pack
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
              <strong>Header Linked from Settings:</strong> {pdfSettings.companyName || 'Valiant Garments'}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            Live Synced
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Order Details Preview Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">{order.buyerName}</div>
                <div className="text-[11px] text-slate-500">
                  Style: <strong className="text-blue-700">{order.styleNumber}</strong> • {order.season}
                </div>
                <div className="text-[11px] text-slate-600">{order.styleDescription}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-700">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {order.orderQuantity.toLocaleString()} pcs @ ${order.fobPrice.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600">
              <div>
                <span className="text-slate-400 block">Ex-Factory:</span>
                <span className="font-mono font-semibold text-slate-800">{order.shipDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Breakdown:</span>
                <span className="font-semibold text-indigo-700">
                  {order.colorSizeBreakdown?.length || 0} Colors / {order.colorSizeBreakdown?.reduce((acc, c) => acc + (c.sizeBreakdown?.length || 0), 0) || 0} Sizes
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">BOM Items:</span>
                <span className="font-semibold text-slate-800">{bomCount} allocated</span>
              </div>
              <div>
                <span className="text-slate-400 block">Inward Receipts:</span>
                <span className="font-semibold text-emerald-700">{linkedGrn.length} GRNs linked</span>
              </div>
            </div>
          </div>

          {/* Live Production WIP Progress Preview */}
          {wip && (
            <div className="p-3.5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-xl border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Production WIP Live Floor Record</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {pipelineMetrics?.overallProgressPercent || 0}% Pipeline Completed
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="text-[9px] text-slate-500 font-medium">Cut Output</div>
                  <div className="text-xs font-bold font-mono text-slate-900">
                    {(wip.cuttingActual || 0).toLocaleString()}
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono">
                    {Math.round(((wip.cuttingActual || 0) / (wip.cuttingPlanned || order.orderQuantity || 1)) * 100)}%
                  </div>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="text-[9px] text-slate-500 font-medium">Sewn Output</div>
                  <div className="text-xs font-bold font-mono text-blue-700">
                    {(wip.sewingComplete || 0).toLocaleString()}
                  </div>
                  <div className="text-[8px] text-blue-500 font-mono">
                    {Math.round(((wip.sewingComplete || 0) / (order.orderQuantity || 1)) * 100)}%
                  </div>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="text-[9px] text-slate-500 font-medium">Finished</div>
                  <div className="text-xs font-bold font-mono text-slate-900">
                    {(wip.finishingQuantity || 0).toLocaleString()}
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono">
                    {Math.round(((wip.finishingQuantity || 0) / (order.orderQuantity || 1)) * 100)}%
                  </div>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="text-[9px] text-slate-500 font-medium">Packed</div>
                  <div className="text-xs font-bold font-mono text-purple-700">
                    {(wip.packedQuantity || 0).toLocaleString()}
                  </div>
                  <div className="text-[8px] text-purple-500 font-mono">
                    {Math.round(((wip.packedQuantity || 0) / (order.orderQuantity || 1)) * 100)}%
                  </div>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-emerald-200 shadow-2xs bg-emerald-50/30">
                  <div className="text-[9px] text-emerald-700 font-medium">QC Pass</div>
                  <div className="text-xs font-bold font-mono text-emerald-700">
                    {(wip.inspectionCompletedQuantity || 0).toLocaleString()}
                  </div>
                  <div className="text-[8px] text-emerald-600 font-mono">
                    {wip.inspectionCompletedQuantity >= order.orderQuantity ? 'Passed' : 'QA Track'}
                  </div>
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
                      PDF Tech Pack
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Specification sheet with Color &amp; Size matrix, BOM requirements &amp; live floor WIP.
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
                    Full PO workbook with Color &amp; Size breakdown, BOM items, WIP tracking &amp; inward GRNs.
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
