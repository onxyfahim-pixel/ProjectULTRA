'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Layers,
  Building2,
  GitCompare,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  BarChart3,
  PieChart,
  Search,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  ReportTypeKey,
  ReportFilterState,
  INITIAL_REPORT_FILTER,
  generateSyncedReport,
  ALL_REPORT_DEFINITIONS,
} from './reports-data-sync';
import { ReportFilterToolbar } from './ReportFilterToolbar';
import {
  downloadCsv,
  downloadExcel,
  printReportPdf,
  PrintableReportConfig,
} from './reports-export-utils';
import { useModulePermission } from '@/hooks/use-module-permission';

interface UniversalReportViewerProps {
  reportKey: ReportTypeKey;
  onBack: () => void;
  showToast: (msg: string) => void;
}

export function UniversalReportViewer({
  reportKey,
  onBack,
  showToast,
}: UniversalReportViewerProps) {
  const { canExport } = useModulePermission('report_analysis');
  const [filters, setFilters] = useState<ReportFilterState>(INITIAL_REPORT_FILTER);
  const [tableSearch, setTableSearch] = useState('');

  // Dynamically compute the synced real data based on current active filters
  const reportData = useMemo(() => {
    return generateSyncedReport(reportKey, filters);
  }, [reportKey, filters]);

  const { metaDef, filterSummary, kpis, tableHeaders, tableRows, chartData, comparisonData, notes } = reportData;

  // Filter table rows by search input
  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return tableRows;
    const q = tableSearch.toLowerCase();
    return tableRows.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(q))
    );
  }, [tableRows, tableSearch]);

  // Export handlers
  const handleDownloadCsv = () => {
    downloadCsv(
      `${metaDef.code}_${metaDef.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      tableHeaders,
      tableRows,
      filterSummary
    );
    showToast(`Downloaded CSV: ${metaDef.title}`);
  };

  const handleDownloadExcel = () => {
    const config: PrintableReportConfig = {
      reportTitle: metaDef.title,
      reportCode: metaDef.code,
      category: metaDef.category,
      generatedDate: new Date().toLocaleString(),
      generatedBy: 'Apex Horizon QMS & Production IE',
      meta: filterSummary,
      kpis: kpis.map((k) => ({
        label: k.label,
        value: k.value,
        subtext: k.subtext,
        status: k.status,
      })),
      tableHeaders,
      tableRows,
      summaryNotes: notes,
      comparisonData: comparisonData
        ? {
          title: comparisonData.title,
          entityA: comparisonData.entityA,
          entityB: comparisonData.entityB,
          metrics: comparisonData.metrics,
        }
        : undefined,
    };

    downloadExcel(
      `${metaDef.code}_${metaDef.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      config
    );
    showToast(`Downloaded Excel: ${metaDef.title}`);
  };

  const handlePrintPdf = () => {
    const config: PrintableReportConfig = {
      reportTitle: metaDef.title,
      reportCode: metaDef.code,
      category: metaDef.category,
      generatedDate: new Date().toLocaleString(),
      generatedBy: 'Apex Horizon QMS & Production IE',
      meta: filterSummary,
      kpis: kpis.map((k) => ({
        label: k.label,
        value: k.value,
        subtext: k.subtext,
        status: k.status,
      })),
      tableHeaders,
      tableRows,
      summaryNotes: notes,
      comparisonData: comparisonData
        ? {
          title: comparisonData.title,
          entityA: comparisonData.entityA,
          entityB: comparisonData.entityB,
          metrics: comparisonData.metrics,
        }
        : undefined,
    };

    printReportPdf(config);
    showToast(`Opened printable PDF window for ${metaDef.title}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Report Directory</span>
            </button>
            <span>/</span>
            <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {metaDef.category}
            </span>
            <span>/</span>
            <span className="text-slate-800 font-mono font-bold text-xs">{metaDef.code}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {metaDef.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real Data Synchronized
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 max-w-3xl">{metaDef.description}</p>
        </div>

        {/* Quick Actions */}
        {canExport && (
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Print or Save PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Customization Filter Toolbar */}
      <ReportFilterToolbar
        filters={filters}
        onFilterChange={setFilters}
        onDownloadCsv={handleDownloadCsv}
        onDownloadExcel={handleDownloadExcel}
        onPrintPdf={handlePrintPdf}
        totalRecordsCount={tableRows.length}
        canExport={canExport}
      />

      {/* 4 Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const tone =
            kpi.status === 'pass'
              ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800'
              : kpi.status === 'warn'
                ? 'border-amber-200 bg-amber-50/40 text-amber-800'
                : kpi.status === 'fail'
                  ? 'border-rose-200 bg-rose-50/40 text-rose-800'
                  : 'border-slate-200 bg-white text-slate-800';

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border shadow-2xs transition-all ${tone}`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <span>{kpi.label}</span>
                {kpi.delta && (
                  <span className="font-bold text-[11px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {kpi.delta}
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{kpi.value}</div>
              {kpi.subtext && (
                <div className="text-[11px] text-slate-500 mt-1 font-medium">{kpi.subtext}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Analytical Visual & Distribution Section */}
      {chartData && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                {chartData.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live aggregated distribution based on current filter parameters
              </p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              Live Chart
            </span>
          </div>

          <div className="pt-2">
            <div className="flex items-end justify-between gap-3 h-48 border-b border-slate-100 pb-2">
              {chartData.labels.map((lbl, i) => {
                const val = chartData.values[i];
                const maxVal = Math.max(...chartData.values, 1);
                const heightPercent = Math.max(14, (val / maxVal) * 100);
                const color = chartData.colors?.[i] || '#4f46e5';

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md pointer-events-none transition-opacity whitespace-nowrap z-10 font-mono">
                      {lbl}: {val}
                    </div>

                    <span className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {val > 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                    </span>

                    <div
                      className="w-full rounded-t-md transition-all hover:opacity-90"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: color,
                      }}
                    />

                    <span className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-1 text-center max-w-[80px]">
                      {lbl}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Engine Variance Box (If active) */}
      {comparisonData && (
        <div className="bg-purple-50/60 rounded-2xl border border-purple-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-purple-700" />
              <h3 className="text-sm font-bold text-purple-950 uppercase tracking-wider">
                {comparisonData.title}
              </h3>
            </div>
            <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
              Comparative Analysis Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-purple-100/70 text-purple-900 border-b border-purple-200">
                  <th className="py-2.5 px-3 font-bold">Performance Metric</th>
                  <th className="py-2.5 px-3 font-bold text-indigo-900">{comparisonData.entityA}</th>
                  <th className="py-2.5 px-3 font-bold text-purple-900">{comparisonData.entityB}</th>
                  <th className="py-2.5 px-3 font-bold text-right">Variance / Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {comparisonData.metrics.map((m, i) => (
                  <tr key={i} className="hover:bg-purple-100/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{m.label}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-900">{m.valA}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-900">{m.valB}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded ${String(m.delta).startsWith('+')
                            ? 'bg-emerald-100 text-emerald-800'
                            : String(m.delta).startsWith('-')
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                      >
                        {m.delta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Granular Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Search & Title Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Detailed Operational Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredRows.length} of {tableRows.length} records matching current criteria
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search in table..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Scrollable Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200">
                {tableHeaders.map((head, i) => (
                  <th key={i} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="py-8 text-center text-slate-400">
                    No data records found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                    {row.map((cell, cIdx) => {
                      const strCell = String(cell);
                      const isPass = strCell === 'PASS' || strCell === 'ON_PACE' || strCell === 'COMPLIANT' || strCell.includes('Grade A') || strCell === 'VALID';
                      const isWarn = strCell === 'WARN' || strCell === 'WARNING' || strCell === 'BEHIND' || strCell === 'MEDIUM RISK' || strCell === 'UNDER_REVIEW';
                      const isFail = strCell === 'FAIL' || strCell === 'OVERDUE' || strCell === 'HIGH RISK';

                      return (
                        <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap text-slate-800">
                          {isPass ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {strCell}
                            </span>
                          ) : isWarn ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              {strCell}
                            </span>
                          ) : isFail ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {strCell}
                            </span>
                          ) : (
                            strCell
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Remarks & Authorization Strip */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Quality Assurance & Industrial Engineering Remarks
          </h4>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
            {notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>

        {/* Dual Sign-off and Authorization Strip */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Prepared By
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Quality / IE Engineer</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Floor In-Charge</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Verified By
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Production Manager</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Manufacturing Division</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quality Assurance Head
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">QMS Senior DGM</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Factory Compliance</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Authorized & Approved By
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Factory General Manager</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Apex Horizon Apparel</div>
          </div>
        </div>
      </div>
    </div>
  );
}
