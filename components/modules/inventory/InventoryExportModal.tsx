'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  FileDown,
  ShieldCheck,
  Check,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { InventoryItem, ReceiveRecord, IssueRecord } from '@/lib/types/erp';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';
import {
  computeStockKpis,
  computeReceiveKpis,
  computeIssueKpis,
  exportStockSummaryPdf,
  exportStockSummaryExcel,
  exportReceiveSummaryPdf,
  exportReceiveSummaryExcel,
  exportIssueSummaryPdf,
  exportIssueSummaryExcel,
} from './inventory-export-utils';

export type InventoryRegisterTab = 'stock' | 'receive' | 'issue';

interface InventoryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRegister?: InventoryRegisterTab;
  stockItems: InventoryItem[];
  receiveRecords: ReceiveRecord[];
  issueRecords: IssueRecord[];
  selectedStockIds?: string[];
  selectedReceiveIds?: string[];
  selectedIssueIds?: string[];
}

export function InventoryExportModal({
  isOpen,
  onClose,
  activeRegister = 'stock',
  stockItems,
  receiveRecords,
  issueRecords,
  selectedStockIds = [],
  selectedReceiveIds = [],
  selectedIssueIds = [],
}: InventoryExportModalProps) {
  const [currentRegister, setCurrentRegister] = useState<InventoryRegisterTab>(activeRegister);
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');

  // Update current register when modal opens or activeRegister prop changes
  useEffect(() => {
    if (isOpen) {
      const reg = activeRegister === 'stock' || activeRegister === 'receive' || activeRegister === 'issue'
        ? activeRegister
        : 'stock';
      setCurrentRegister(reg);
    }
  }, [isOpen, activeRegister]);

  // Adjust scope whenever active register or selection changes
  useEffect(() => {
    let hasSelected = false;
    if (currentRegister === 'stock') {
      hasSelected = selectedStockIds.length > 0;
    } else if (currentRegister === 'receive') {
      hasSelected = selectedReceiveIds.length > 0;
    } else {
      hasSelected = selectedIssueIds.length > 0;
    }
    setExportScope(hasSelected ? 'selected' : 'all');
  }, [currentRegister, selectedStockIds.length, selectedReceiveIds.length, selectedIssueIds.length, isOpen]);

  if (!isOpen) return null;

  const pdfSettings = loadPdfHeaderSettings();

  // Active dataset & selected slice
  let totalCount = 0;
  let selectedCount = 0;
  let unitLabel = 'items';

  if (currentRegister === 'stock') {
    totalCount = stockItems.length;
    selectedCount = selectedStockIds.length;
    unitLabel = 'SKUs';
  } else if (currentRegister === 'receive') {
    totalCount = receiveRecords.length;
    selectedCount = selectedReceiveIds.length;
    unitLabel = 'GRNs';
  } else {
    totalCount = issueRecords.length;
    selectedCount = selectedIssueIds.length;
    unitLabel = 'SIVs';
  }

  // Target records based on scope
  const targetStock =
    exportScope === 'selected' && selectedStockIds.length > 0
      ? stockItems.filter((i) => selectedStockIds.includes(i.id))
      : stockItems;

  const targetReceive =
    exportScope === 'selected' && selectedReceiveIds.length > 0
      ? receiveRecords.filter((r) => selectedReceiveIds.includes(r.id))
      : receiveRecords;

  const targetIssue =
    exportScope === 'selected' && selectedIssueIds.length > 0
      ? issueRecords.filter((s) => selectedIssueIds.includes(s.id))
      : issueRecords;

  const activeTargetCount =
    currentRegister === 'stock'
      ? targetStock.length
      : currentRegister === 'receive'
      ? targetReceive.length
      : targetIssue.length;

  // KPI calculations
  const stockKpis = computeStockKpis(targetStock);
  const receiveKpis = computeReceiveKpis(targetReceive);
  const issueKpis = computeIssueKpis(targetIssue);

  // Trigger PDF
  const handleExportPdf = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Records (${activeTargetCount} of ${totalCount} ${unitLabel})`
        : `All Records (${totalCount} ${unitLabel})`;

    if (currentRegister === 'stock') {
      exportStockSummaryPdf(targetStock, scopeLabel);
    } else if (currentRegister === 'receive') {
      exportReceiveSummaryPdf(targetReceive, scopeLabel);
    } else {
      exportIssueSummaryPdf(targetIssue, scopeLabel);
    }
    onClose();
  };

  // Trigger Excel
  const handleExportExcel = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Records (${activeTargetCount} of ${totalCount} ${unitLabel})`
        : `All Records (${totalCount} ${unitLabel})`;

    if (currentRegister === 'stock') {
      exportStockSummaryExcel(targetStock, scopeLabel);
    } else if (currentRegister === 'receive') {
      exportReceiveSummaryExcel(targetReceive, scopeLabel);
    } else {
      exportIssueSummaryExcel(targetIssue, scopeLabel);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Global Export: Inventory Module</h3>
              <p className="text-xs text-slate-400">
                Generate register sheets in PDF or Excel format
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
        <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">
              <strong>Header Linked from Settings:</strong> {pdfSettings.companyName || 'Valiant Garments'} ({pdfSettings.layoutStyle.replace('_', ' ')})
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            Live Synced
          </span>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Register Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Inventory Register
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCurrentRegister('stock')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  currentRegister === 'stock'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>Stock Ledger ({stockItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentRegister('receive')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  currentRegister === 'receive'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Receive GRN ({receiveRecords.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentRegister('issue')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  currentRegister === 'issue'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-amber-600" />
                <span>Issue SIV ({issueRecords.length})</span>
              </button>
            </div>
          </div>

          {/* Step 1: Record Scope Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Choose Record Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Selected */}
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setExportScope('selected')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'selected'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                    : selectedCount === 0
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        exportScope === 'selected'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {exportScope === 'selected' && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                    <span className="text-xs font-bold text-slate-900">Selected Records</span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                      selectedCount > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {selectedCount} {unitLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6">
                  {selectedCount > 0
                    ? `Export only the ${selectedCount} rows currently selected in the table.`
                    : 'Select rows in the table to enable this scope.'}
                </p>
              </button>

              {/* Option B: All Records */}
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        exportScope === 'all'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {exportScope === 'all' && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                    <span className="text-xs font-bold text-slate-900">All Records</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {totalCount} {unitLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6">
                  Export complete register of all {totalCount} records in this register.
                </p>
              </button>
            </div>
          </div>

          {/* Scope Preview Metrics */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              {currentRegister === 'stock' && `Stock Ledger Summary (${activeTargetCount} SKUs)`}
              {currentRegister === 'receive' && `Receive Register Summary (${activeTargetCount} GRNs)`}
              {currentRegister === 'issue' && `Issue Register Summary (${activeTargetCount} SIVs)`}
            </div>

            {currentRegister === 'stock' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Total Items</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {stockKpis.totalSKUs} SKUs
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Stock Volume</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {(stockKpis.totalQuantity / 1000).toFixed(1)}k Units
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Material Valuation</div>
                  <div className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                    ${(stockKpis.totalValuation / 1000).toFixed(1)}k
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Grade A Export</div>
                  <div className="text-sm font-mono font-bold text-blue-700 mt-0.5">
                    {stockKpis.gradeACount} Lots
                  </div>
                </div>
              </div>
            )}

            {currentRegister === 'receive' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Total Deliveries</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {receiveKpis.totalGRNs} GRNs
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Received Volume</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {(receiveKpis.totalReceivedQty / 1000).toFixed(1)}k Units
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Total Rolls</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {receiveKpis.totalRollsReceived} Rolls
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">QC Passed</div>
                  <div className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                    {receiveKpis.passedCount} Lots
                  </div>
                </div>
              </div>
            )}

            {currentRegister === 'issue' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Total Issues</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {issueKpis.totalSIVs} SIVs
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Issued Volume</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {(issueKpis.totalIssuedQty / 1000).toFixed(1)}k Units
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Cutting Floor</div>
                  <div className="text-sm font-mono font-bold text-amber-700 mt-0.5">
                    {(issueKpis.cuttingQty / 1000).toFixed(1)}k Units
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Sewing &amp; Lines</div>
                  <div className="text-sm font-mono font-bold text-blue-700 mt-0.5">
                    {(issueKpis.sewingQty / 1000).toFixed(1)}k Units
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Choose Format */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Choose Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PDF Option Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all flex flex-col justify-between space-y-3 group">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                      <Printer className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      Printable
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    PDF Register Sheet
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Clean printable report with register KPIs &amp; detailed item audit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export PDF ({activeTargetCount} {unitLabel})</span>
                </button>
              </div>

              {/* Excel Option Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between space-y-3 group">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      .XLS
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Excel Spreadsheet
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Full spreadsheet with ledger values, SKU parameters &amp; balances.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel ({activeTargetCount} {unitLabel})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Targeting <strong>{activeTargetCount}</strong> of {totalCount} {unitLabel}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
