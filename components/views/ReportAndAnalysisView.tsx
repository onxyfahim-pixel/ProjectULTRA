'use client';

import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Layers,
  Calendar,
  Building2,
  Users,
  Award,
  ShieldCheck,
  Check,
  FileText,
  BarChart3,
  PieChart,
  Gauge,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  Wrench,
  GitCommit,
  GraduationCap,
  MessageSquareWarning,
  FileCheck,
  AlertOctagon,
  ArrowRight,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import {
  ReportRecord,
  ReportCategory,
  ReportStatus,
  INITIAL_REPORTS,
  REPORT_CATEGORY_CONFIG,
  MONTHLY_QUALITY_TRENDS,
  BUYER_BENCHMARK_LIST,
  LINE_LEADERBOARD_LIST,
} from '../modules/reports/reports-data';
import { ReportDetailsPage } from '../modules/reports/ReportDetailsPage';
import { NewReportModal } from '../modules/reports/NewReportModal';
import {
  ReportTypeKey,
  ALL_REPORT_DEFINITIONS,
  ReportMetaDefinition,
  generateSyncedReport,
  INITIAL_REPORT_FILTER,
} from '../modules/reports/reports-data-sync';
import { UniversalReportViewer } from '../modules/reports/UniversalReportViewer';
import {
  downloadCsv,
  downloadExcel,
  printReportPdf,
  PrintableReportConfig,
} from '../modules/reports/reports-export-utils';

type ReportSubView =
  | { type: 'none' }
  | { type: 'details'; report: ReportRecord }
  | { type: 'synced-report'; reportKey: ReportTypeKey };

type MainNavigationTab = 'hub' | 'summary' | 'ledger';

export function ReportAndAnalysisView() {
  const [activeTab, setActiveTab] = useState<MainNavigationTab>('hub');
  const [subView, setSubView] = useState<ReportSubView>({ type: 'none' });
  const [reports, setReports] = useState<ReportRecord[]>(INITIAL_REPORTS);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hub Category Filter & Search
  const [hubCategory, setHubCategory] = useState<'ALL' | 'PRODUCTION' | 'QUALITY' | 'COMPLIANCE' | 'EXECUTIVE'>('ALL');
  const [hubSearchQuery, setHubSearchQuery] = useState('');

  // Filters for Ledger / DataTable view
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters for Summary view
  const [summaryPeriod, setSummaryPeriod] = useState<string>('YTD');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered 22-report catalogue items for the Hub
  const filteredReportCatalog = useMemo(() => {
    return ALL_REPORT_DEFINITIONS.filter((item) => {
      const matchCat = hubCategory === 'ALL' || item.category === hubCategory;
      const q = hubSearchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.targetAudience.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [hubCategory, hubSearchQuery]);

  // Filtered reports for DataTable
  const filteredReports = useMemo(() => {
    return reports.filter((rpt) => {
      const matchCategory = categoryFilter === 'ALL' || rpt.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || rpt.status === statusFilter;
      const matchQuery =
        !searchQuery.trim() ||
        rpt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpt.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpt.generatedBy.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchStatus && matchQuery;
    });
  }, [reports, categoryFilter, statusFilter, searchQuery]);

  const handleUpdateStatus = (updatedReport: ReportRecord) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    );
    if (subView.type === 'details' && subView.report.id === updatedReport.id) {
      setSubView({ type: 'details', report: updatedReport });
    }
    showToast(`Updated ${updatedReport.id} status to ${updatedReport.status}`);
  };

  const handleDeleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    showToast(`Deleted report ${id}`);
  };

  const handleSaveNewReport = (newReport: ReportRecord) => {
    setReports((prev) => [newReport, ...prev]);
    showToast(`Successfully created report ${newReport.id}`);
  };

  const handleExportCsv = (rpt: ReportRecord) => {
    const rows = [
      ['Metric', 'Target', 'Actual', 'Variance', 'Status'],
      ...rpt.metricsTable.map((m) => [m.metric, m.target, m.actual, m.variance, m.status]),
    ];
    downloadCsv(`${rpt.id}_metrics_export`, ['Metric', 'Target', 'Actual', 'Variance', 'Status'], rows);
    showToast(`Exported ${rpt.id} CSV`);
  };

  const handleExportAllReports = () => {
    const rows = reports.map((r) => [
      r.id,
      r.title,
      r.category,
      r.period,
      r.department,
      r.generatedBy,
      r.status,
      r.format,
    ]);
    downloadCsv(
      `all_quality_reports_${new Date().toISOString().split('T')[0]}`,
      ['ID', 'Title', 'Category', 'Period', 'Department', 'Author', 'Status', 'Format'],
      rows
    );
    showToast(`Exported ${reports.length} reports to CSV`);
  };

  // Quick direct downloads for any catalog report directly from the hub cards
  const handleQuickDownloadCatalogCsv = (def: ReportMetaDefinition) => {
    const data = generateSyncedReport(def.key, INITIAL_REPORT_FILTER);
    downloadCsv(
      `${def.code}_${def.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      data.tableHeaders,
      data.tableRows,
      data.filterSummary
    );
    showToast(`Exported CSV: ${def.title}`);
  };

  const handleQuickDownloadCatalogExcel = (def: ReportMetaDefinition) => {
    const data = generateSyncedReport(def.key, INITIAL_REPORT_FILTER);
    const config: PrintableReportConfig = {
      reportTitle: def.title,
      reportCode: def.code,
      category: def.category,
      generatedDate: new Date().toLocaleString(),
      generatedBy: 'Apex Horizon QMS & Production IE',
      meta: data.filterSummary,
      kpis: data.kpis.map((k) => ({
        label: k.label,
        value: k.value,
        subtext: k.subtext,
        status: k.status,
      })),
      tableHeaders: data.tableHeaders,
      tableRows: data.tableRows,
      summaryNotes: data.notes,
    };
    downloadExcel(
      `${def.code}_${def.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      config
    );
    showToast(`Exported Excel: ${def.title}`);
  };

  const handleQuickPrintCatalogPdf = (def: ReportMetaDefinition) => {
    const data = generateSyncedReport(def.key, INITIAL_REPORT_FILTER);
    const config: PrintableReportConfig = {
      reportTitle: def.title,
      reportCode: def.code,
      category: def.category,
      generatedDate: new Date().toLocaleString(),
      generatedBy: 'Apex Horizon QMS & Production IE',
      meta: data.filterSummary,
      kpis: data.kpis.map((k) => ({
        label: k.label,
        value: k.value,
        subtext: k.subtext,
        status: k.status,
      })),
      tableHeaders: data.tableHeaders,
      tableRows: data.tableRows,
      summaryNotes: data.notes,
    };
    printReportPdf(config);
    showToast(`Opened printable PDF window for ${def.title}`);
  };

  // Icon mapping helper
  const renderCatalogIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-indigo-600" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'Gauge':
        return <Gauge className="w-5 h-5 text-amber-600" />;
      case 'Users':
        return <Users className="w-5 h-5 text-violet-600" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-sky-600" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'Trash2':
        return <Trash2 className="w-5 h-5 text-rose-500" />;
      case 'RotateCcw':
        return <RotateCcw className="w-5 h-5 text-indigo-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'PieChart':
        return <PieChart className="w-5 h-5 text-rose-600" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5 text-blue-600" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'Award':
        return <Award className="w-5 h-5 text-amber-600" />;
      case 'AlertOctagon':
        return <AlertOctagon className="w-5 h-5 text-orange-600" />;
      case 'GitCommit':
        return <GitCommit className="w-5 h-5 text-teal-600" />;
      case 'MessageSquareWarning':
        return <MessageSquareWarning className="w-5 h-5 text-rose-600" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-purple-600" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5 text-slate-600" />;
      case 'FileCheck':
        return <FileCheck className="w-5 h-5 text-indigo-600" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'Building2':
      default:
        return <Building2 className="w-5 h-5 text-indigo-600" />;
    }
  };

  // DataTable column definitions for Ledger view
  const columns: ColumnDef<ReportRecord>[] = [
    {
      key: 'id',
      header: 'Report ID',
      sortable: true,
      render: (rpt) => {
        const catCfg = REPORT_CATEGORY_CONFIG[rpt.category];
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-200/80 w-fit">
              {rpt.id}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border w-fit ${catCfg.bg} ${catCfg.color} ${catCfg.border}`}
            >
              {catCfg.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Report Title & Scope',
      sortable: true,
      render: (rpt) => (
        <div className="max-w-md">
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', report: rpt })}
            className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-left line-clamp-1 cursor-pointer"
          >
            {rpt.title}
          </button>
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{rpt.summary}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period & Dept',
      sortable: true,
      render: (rpt) => (
        <div className="text-xs">
          <p className="font-medium text-slate-800 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {rpt.period}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            {rpt.department}
          </p>
        </div>
      ),
    },
    {
      key: 'generatedDate',
      header: 'Author & Date',
      sortable: true,
      render: (rpt) => (
        <div className="text-xs">
          <p className="font-medium text-slate-800">{rpt.generatedBy.split(' ')[0]}</p>
          <p className="text-[11px] text-slate-500">{rpt.generatedDate}</p>
        </div>
      ),
    },
    {
      key: 'format',
      header: 'Format & Size',
      render: (rpt) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {rpt.format}
          </span>
          <p className="text-[10px] text-slate-500 mt-1">{rpt.fileSize}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (rpt) => {
        switch (rpt.status) {
          case 'PUBLISHED':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Published
              </span>
            );
          case 'APPROVED':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                Approved
              </span>
            );
          case 'UNDER_REVIEW':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                Under Review
              </span>
            );
          case 'DRAFT':
          default:
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Draft
              </span>
            );
        }
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (rpt) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', report: rpt })}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="View Fullscreen Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv(rpt)}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteReport(rpt.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Report"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const batchActions: BatchAction<ReportRecord>[] = [
    {
      label: 'Export Selected CSV',
      icon: <Download className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        const rows = selected.map((s) => [s.id, s.title, s.category, s.period, s.status]);
        downloadCsv(`selected_reports_${selected.length}`, ['ID', 'Title', 'Category', 'Period', 'Status'], rows);
        showToast(`Exported ${selected.length} reports`);
      },
    },
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        const ids = new Set(selected.map((s) => s.id));
        setReports((prev) => prev.filter((r) => !ids.has(r.id)));
        showToast(`Deleted ${selected.length} reports`);
      },
    },
  ];

  // SUBVIEW 1: Interactive Fullscreen Synced Report Viewer (for any of the 22 reports)
  if (subView.type === 'synced-report') {
    return (
      <UniversalReportViewer
        reportKey={subView.reportKey}
        onBack={() => setSubView({ type: 'none' })}
        showToast={showToast}
      />
    );
  }

  // SUBVIEW 2: Custom Document Report Details Page
  if (subView.type === 'details') {
    return (
      <ReportDetailsPage
        report={subView.report}
        onBack={() => setSubView({ type: 'none' })}
        onUpdateStatus={handleUpdateStatus}
        onExportCsv={handleExportCsv}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Module Header with Tab Switching */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md uppercase">
                QMS & ERP INTELLIGENCE
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Floor Sync Active
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Report And Analysis
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
              Centralized intelligence hub for 22 specialized production, quality, compliance, and executive dashboards with order, line, date filters, comparison, and universal CSV/Excel/PDF export.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportAllReports}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Custom Report</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('hub')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'hub'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>22 Reports & Dashboards Suite</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'hub' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              22
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'summary'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Executive Analytics & Trends</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Generated Reports Ledger</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'ledger' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {reports.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: 22 REPORTS & DASHBOARDS SUITE */}
      {activeTab === 'hub' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Category Filter Chips & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'All 22 Reports', count: ALL_REPORT_DEFINITIONS.length },
                {
                  id: 'PRODUCTION',
                  label: 'Production (9)',
                  count: ALL_REPORT_DEFINITIONS.filter((r) => r.category === 'PRODUCTION').length,
                },
                {
                  id: 'QUALITY',
                  label: 'Quality QA (4)',
                  count: ALL_REPORT_DEFINITIONS.filter((r) => r.category === 'QUALITY').length,
                },
                {
                  id: 'COMPLIANCE',
                  label: 'Compliance & Lab (7)',
                  count: ALL_REPORT_DEFINITIONS.filter((r) => r.category === 'COMPLIANCE').length,
                },
                {
                  id: 'EXECUTIVE',
                  label: 'Executive Dashboards (2)',
                  count: ALL_REPORT_DEFINITIONS.filter((r) => r.category === 'EXECUTIVE').length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHubCategory(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    hubCategory === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={hubSearchQuery}
                onChange={(e) => setHubSearchQuery(e.target.value)}
                placeholder="Search reports by title, code, topic..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 22 Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReportCatalog.map((def) => {
              const catBadge =
                def.category === 'PRODUCTION'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : def.category === 'QUALITY'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : def.category === 'COMPLIANCE'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <div
                  key={def.key}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs p-5 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header with Icon, Code, and Category */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                          {renderCatalogIcon(def.iconName)}
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {def.code}
                          </span>
                          <span
                            className={`block text-[9.5px] font-bold px-1.5 py-0.2 rounded border w-fit mt-0.5 ${catBadge}`}
                          >
                            {def.category}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                        {def.frequency}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                      {def.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {def.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="line-clamp-1">Audience: {def.targetAudience}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Open & Customize Button */}
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'synced-report', reportKey: def.key })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-all cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Open & Customize</span>
                    </button>

                    {/* Quick Direct Download Action Icons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickDownloadCatalogCsv(def)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Quick Download CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickDownloadCatalogExcel(def)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Quick Download Excel (.xls)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickPrintCatalogPdf(def)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Quick Print or Save PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SUMMARY VIEW */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Filter & Date Range Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                Time Horizon:
              </span>
              {(['WEEK', 'MONTH', 'Q3', 'YTD'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSummaryPeriod(period)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    summaryPeriod === period
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {period === 'WEEK'
                    ? 'Last 7 Days'
                    : period === 'MONTH'
                    ? 'September 2026'
                    : period === 'Q3'
                    ? 'Q3 2026'
                    : 'Year-to-Date (YTD)'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportAllReports}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export Master Ledger</span>
              </button>
            </div>
          </div>

          {/* 4 StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Factory Quality Pass Rate"
              value="96.8%"
              subtitle="Target: > 95.0% • AQL 2.5 Normal"
              delta={{ value: '+1.4% MoM', isPositive: true }}
              icon={ShieldCheck}
              tone="emerald"
            />
            <StatCard
              title="Average Factory DHU"
              value="1.82 DHU"
              subtitle="Defects per 100 units (Goal < 2.0)"
              delta={{ value: '-0.24 DHU', isPositive: true }}
              icon={TrendingDown}
              tone="indigo"
            />
            <StatCard
              title="First Time Right (FTR)"
              value="94.2%"
              subtitle="Straight-pass before rework"
              delta={{ value: '+2.1% MoM', isPositive: true }}
              icon={Award}
              tone="blue"
            />
            <StatCard
              title="Audit & ISO Readiness"
              value="98.4%"
              subtitle="Zero major NCs recorded"
              delta={{ value: '+0.8%', isPositive: true }}
              icon={FileBarChart}
              tone="purple"
            />
          </div>

          {/* Analytical Visuals: Monthly Quality Trend & Defect Pareto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Monthly DHU Reduction & Inspection Volume
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Steady DHU decline from 2.38 in Jan to 1.82 in Sep
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  -23.5% DHU YTD
                </span>
              </div>

              {/* Chart Visual */}
              <div className="space-y-3 pt-2">
                <div className="flex items-end justify-between gap-2 h-44 border-b border-slate-100 pb-2">
                  {MONTHLY_QUALITY_TRENDS.map((item) => {
                    const heightPercent = Math.max(15, ((item.dhu - 1.0) / 1.5) * 100);
                    return (
                      <div
                        key={item.month}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md pointer-events-none transition-opacity whitespace-nowrap z-10">
                          {item.month}: {item.dhu} DHU ({item.passRate}% Pass)
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {item.dhu}
                        </span>
                        <div
                          className="w-full bg-indigo-100 hover:bg-indigo-600 transition-colors rounded-t-md"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[11px] font-semibold text-slate-500 mt-1">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Target Threshold: &lt; 2.00 DHU</span>
                  <span className="font-semibold text-slate-700">Total YTD Inspected: 2.01M Garments</span>
                </div>
              </div>
            </div>

            {/* Defect Pareto Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-rose-600" />
                    Top Defect Pareto Distribution (80/20)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Addressing top 3 defects eliminates 68.2% of rework
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  3,840 Defects
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'Broken / Skipped Stitches', pct: 31.2, count: 1198, color: 'bg-rose-500' },
                  { name: 'Shade / Color Variation', pct: 20.7, count: 795, color: 'bg-amber-500' },
                  { name: 'Seam Puckering (Armhole/Collar)', pct: 16.3, count: 626, color: 'bg-indigo-500' },
                  { name: 'Oil & Machine Grease Stains', pct: 12.5, count: 480, color: 'bg-purple-500' },
                  { name: 'Measurement Variance (±1/4")', pct: 9.8, count: 376, color: 'bg-sky-500' },
                  { name: 'Open / Wavy Seams', pct: 6.1, count: 234, color: 'bg-emerald-500' },
                  { name: 'Trim / Snap Misalignment', pct: 3.4, count: 131, color: 'bg-slate-400' },
                ].map((defect, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">
                        {i + 1}. {defect.name}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {defect.count} pcs • {defect.pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${defect.color}`}
                        style={{ width: `${defect.pct * 2.8}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buyer Benchmark & Line Leaderboard Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Buyer Scorecard */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Buyer Quality & Audit Scorecard
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    AQL acceptance and delivery ratings by global retail client
                  </p>
                </div>
                <span className="text-xs text-slate-400">YTD Performance</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3 font-semibold">Retail Buyer</th>
                      <th className="py-2.5 px-3 font-semibold">Orders / Pcs</th>
                      <th className="py-2.5 px-3 font-semibold">Pass %</th>
                      <th className="py-2.5 px-3 font-semibold">DHU</th>
                      <th className="py-2.5 px-3 font-semibold">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {BUYER_BENCHMARK_LIST.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{b.buyer}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {b.orders} POs ({b.pcsShipped.toLocaleString()} pcs)
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{b.passRate}%</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{b.dhu}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'GRADE_A'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {b.status === 'GRADE_A' ? 'Grade A (Gold)' : 'Grade B (Silver)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Factory Line Quality Leaderboard */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Sewing Line Quality & DHU Leaderboard
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live floor efficiency and First Time Right rankings
                  </p>
                </div>
                <span className="text-xs text-slate-400">Lines 01 - 08</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3 font-semibold">Production Line</th>
                      <th className="py-2.5 px-3 font-semibold">Supervisor</th>
                      <th className="py-2.5 px-3 font-semibold">Output Pcs</th>
                      <th className="py-2.5 px-3 font-semibold">DHU</th>
                      <th className="py-2.5 px-3 font-semibold">FTR %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {LINE_LEADERBOARD_LIST.map((line, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{line.line}</td>
                        <td className="py-2.5 px-3 text-slate-600">{line.supervisor}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {line.output.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                          {line.dhu}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-semibold ${
                              line.ftr >= 95
                                ? 'text-emerald-700'
                                : line.ftr >= 93
                                ? 'text-blue-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {line.ftr}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEDGER VIEW (DataTable) */}
      {activeTab === 'ledger' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Reports ({reports.length})
            </button>
            {Object.entries(REPORT_CATEGORY_CONFIG).map(([key, cfg]) => {
              const count = reports.filter((r) => r.category === key).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategoryFilter(key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === key
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports by ID, title, department, author..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="APPROVED">Approved</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="DRAFT">Draft</option>
              </select>

              <button
                type="button"
                onClick={handleExportAllReports}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export Ledger</span>
              </button>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            data={filteredReports}
            columns={columns}
            batchActions={batchActions}
            dense
            emptyMessage="No reports found matching your current filter criteria."
          />
        </div>
      )}

      {/* New Report Modal */}
      <NewReportModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleSaveNewReport}
      />
    </div>
  );
}
