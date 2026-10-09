'use client';

import React from 'react';
import {
  Filter,
  Calendar,
  Layers,
  Building2,
  GitCompare,
  Download,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  ReportFilterState,
  getLiveBuyerOrders,
} from './reports-data-sync';

interface ReportFilterToolbarProps {
  filters: ReportFilterState;
  onFilterChange: (newFilters: ReportFilterState) => void;
  onDownloadCsv: () => void;
  onDownloadExcel: () => void;
  onPrintPdf: () => void;
  totalRecordsCount?: number;
  canExport?: boolean;
}

export function ReportFilterToolbar({
  filters,
  onFilterChange,
  onDownloadCsv,
  onDownloadExcel,
  onPrintPdf,
  totalRecordsCount,
  canExport = true,
}: ReportFilterToolbarProps) {
  const buyerOrders = getLiveBuyerOrders();

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, orderNumber: e.target.value });
  };

  const handleDatePresetChange = (preset: string) => {
    onFilterChange({ ...filters, dateRange: preset });
  };

  const handleLineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, lineId: e.target.value });
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, section: e.target.value });
  };

  const handleToggleComparison = () => {
    onFilterChange({ ...filters, isComparison: !filters.isComparison });
  };

  const handleCompareTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as ReportFilterState['compareType'];
    let defaultTarget = 'Line 02';
    if (val === 'ORDER') defaultTarget = buyerOrders[1]?.orderNumber || 'PO-ZARA-4482';
    if (val === 'PERIOD') defaultTarget = 'Previous Period';
    if (val === 'SECTION') defaultTarget = 'Finishing';

    onFilterChange({
      ...filters,
      compareType: val,
      compareTarget: defaultTarget,
    });
  };

  const handleCompareTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, compareTarget: e.target.value });
  };

  const handleResetFilters = () => {
    onFilterChange({
      orderNumber: 'ALL',
      dateRange: 'LAST_30_DAYS',
      customStartDate: '',
      customEndDate: '',
      lineId: 'ALL',
      section: 'ALL',
      buyer: 'ALL',
      isComparison: false,
      compareType: 'LINE',
      compareTarget: 'Line 02',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3.5">
      {/* Top Row: Main Filters & Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Primary Filter Selectors */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Customize:</span>
          </div>

          {/* Order / PO Selector */}
          <div className="relative">
            <select
              value={filters.orderNumber}
              onChange={handleOrderChange}
              className="pl-3 pr-8 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Buyer Orders ({buyerOrders.length})</option>
              {buyerOrders.map((ord) => (
                <option key={ord.id} value={ord.orderNumber}>
                  {ord.orderNumber} - {ord.buyerName.split(' ')[0]} ({ord.styleNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Line Selector */}
          <div className="relative">
            <select
              value={filters.lineId}
              onChange={handleLineChange}
              className="pl-3 pr-8 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Production Lines</option>
              <option value="Line 01">Line 01 (Basic Tee)</option>
              <option value="Line 02">Line 02 (Polo/Denim)</option>
              <option value="Line 03">Line 03 (Top Star)</option>
              <option value="Line 04">Line 04 (Heavy Knit)</option>
              <option value="Line 05">Line 05 (Woven Shirt)</option>
              <option value="Line 06">Line 06 (Finishing)</option>
              <option value="Line 07">Line 07 (Jackets)</option>
              <option value="Line 08">Line 08 (Activewear)</option>
            </select>
          </div>

          {/* Section Selector */}
          <div className="relative">
            <select
              value={filters.section}
              onChange={handleSectionChange}
              className="pl-3 pr-8 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Sections</option>
              <option value="Cutting">Cutting Section</option>
              <option value="Sewing">Sewing Section</option>
              <option value="Washing">Washing Section</option>
              <option value="Finishing">Finishing & Pressing</option>
              <option value="Packaging">Packaging & Carton</option>
              <option value="Quality">Quality Assurance</option>
            </select>
          </div>

          {/* Comparison Mode Toggle */}
          <button
            type="button"
            onClick={handleToggleComparison}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              filters.isComparison
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Mode</span>
            {filters.isComparison && <Check className="w-3 h-3 stroke-[3]" />}
          </button>

          {/* Reset Filters button */}
          {(filters.orderNumber !== 'ALL' ||
            filters.lineId !== 'ALL' ||
            filters.section !== 'ALL' ||
            filters.dateRange !== 'LAST_30_DAYS' ||
            filters.isComparison) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title="Reset all filters to default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Universal Download Action Buttons */}
        {canExport && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
              title="Download Comma Separated Values (.csv)"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={onDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Download Formatted Excel Workbook (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={onPrintPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Print or Save Formatted PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Date Horizon Presets Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Horizon:
          </span>
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
            { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'QTD', label: 'Quarter-to-Date' },
            { id: 'YTD', label: 'Year-to-Date (YTD)' },
            { id: 'CUSTOM', label: 'Custom Range...' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleDatePresetChange(preset.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                filters.dateRange === preset.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {totalRecordsCount !== undefined && (
          <span className="text-[11px] font-medium text-slate-400">
            {totalRecordsCount} data entries synced
          </span>
        )}
      </div>

      {/* Custom Date Pickers (Shown only when 'CUSTOM' is selected) */}
      {filters.dateRange === 'CUSTOM' && (
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          <span className="font-semibold text-slate-700">Date Range From:</span>
          <input
            type="date"
            value={filters.customStartDate || '2026-09-01'}
            onChange={(e) => onFilterChange({ ...filters, customStartDate: e.target.value })}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
          />
          <span className="font-semibold text-slate-700">To:</span>
          <input
            type="date"
            value={filters.customEndDate || '2026-10-03'}
            onChange={(e) => onFilterChange({ ...filters, customEndDate: e.target.value })}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
          />
        </div>
      )}

      {/* Comparison Engine Controls (Shown when compare mode is enabled) */}
      {filters.isComparison && (
        <div className="flex flex-wrap items-center gap-3 bg-purple-50/70 p-3 rounded-xl border border-purple-200/90 text-xs animate-in fade-in duration-200">
          <span className="font-bold text-purple-900 flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-purple-700" />
            Comparison Target:
          </span>

          <select
            value={filters.compareType}
            onChange={handleCompareTypeChange}
            className="px-2.5 py-1 bg-white border border-purple-300 rounded-lg font-semibold text-purple-900 cursor-pointer text-xs"
          >
            <option value="LINE">Line vs Line</option>
            <option value="ORDER">Order vs Order</option>
            <option value="PERIOD">Period vs Period</option>
            <option value="SECTION">Section vs Section</option>
          </select>

          <span className="text-purple-700 font-medium">Compare Against:</span>

          {filters.compareType === 'LINE' && (
            <select
              value={filters.compareTarget}
              onChange={handleCompareTargetChange}
              className="px-2.5 py-1 bg-white border border-purple-300 rounded-lg font-semibold text-purple-900 cursor-pointer text-xs"
            >
              <option value="Line 01">Line 01</option>
              <option value="Line 02">Line 02</option>
              <option value="Line 03">Line 03</option>
              <option value="Line 04">Line 04</option>
              <option value="Line 05">Line 05</option>
              <option value="Line 06">Line 06</option>
              <option value="Line 07">Line 07</option>
              <option value="Line 08">Line 08</option>
            </select>
          )}

          {filters.compareType === 'ORDER' && (
            <select
              value={filters.compareTarget}
              onChange={handleCompareTargetChange}
              className="px-2.5 py-1 bg-white border border-purple-300 rounded-lg font-semibold text-purple-900 cursor-pointer text-xs"
            >
              {buyerOrders.map((ord) => (
                <option key={ord.id} value={ord.orderNumber}>
                  {ord.orderNumber} ({ord.buyerName})
                </option>
              ))}
            </select>
          )}

          {filters.compareType === 'PERIOD' && (
            <select
              value={filters.compareTarget}
              onChange={handleCompareTargetChange}
              className="px-2.5 py-1 bg-white border border-purple-300 rounded-lg font-semibold text-purple-900 cursor-pointer text-xs"
            >
              <option value="Previous Week">Previous Week</option>
              <option value="Previous Month (August 2026)">Previous Month (August 2026)</option>
              <option value="Previous Quarter (Q2 2026)">Previous Quarter (Q2 2026)</option>
              <option value="Same Period Last Year">Same Period Last Year</option>
            </select>
          )}

          {filters.compareType === 'SECTION' && (
            <select
              value={filters.compareTarget}
              onChange={handleCompareTargetChange}
              className="px-2.5 py-1 bg-white border border-purple-300 rounded-lg font-semibold text-purple-900 cursor-pointer text-xs"
            >
              <option value="Cutting">Cutting Section</option>
              <option value="Sewing">Sewing Section</option>
              <option value="Washing">Washing Section</option>
              <option value="Finishing">Finishing & Packing</option>
            </select>
          )}
        </div>
      )}
    </div>
  );
}
