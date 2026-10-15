'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PieChart,
  Layers,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckSquare,
  Clock,
  ShieldCheck,
  Activity,
  Percent,
  Search,
  Filter,
  ArrowRight,
  Check,
  ListTodo,
  FileDown,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { KpiMetric, KpiCategory, KpiStatus, KpiTrend } from '@/lib/types/modules';
import { INITIAL_KPIS, KPI_CATEGORY_CONFIG } from '../modules/kpi-management/kpi-management-data';
import { useLiveModuleData } from '@/hooks/use-live-module-data';
import { KpiDetailsPage } from '../modules/kpi-management/KpiDetailsPage';
import { KpiEntryPage } from '../modules/kpi-management/KpiEntryPage';
import { DeleteKpiModal } from '../modules/kpi-management/DeleteKpiModal';
import { KpiExportModal } from '../modules/kpi-management/KpiExportModal';
import { KpiSingleExportModal } from '../modules/kpi-management/KpiSingleExportModal';
import { KpiSummaryCharts } from '../modules/kpi-management/KpiSummaryCharts';
import { useModulePermission } from '@/hooks/use-module-permission';

type KpiSubView =
  | { type: 'none' }
  | { type: 'details'; kpi: KpiMetric }
  | { type: 'add' }
  | { type: 'edit'; kpi: KpiMetric };

export function KpiManagementView() {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('kpi_management');
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [subView, setSubView] = useState<KpiSubView>({ type: 'none' });
  const [kpis, setKpis] = useLiveModuleData<KpiMetric[]>(
    'kpi_metrics',
    INITIAL_KPIS,
    'erp_kpis_v1'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Export Modals State
  const [isGlobalExportOpen, setIsGlobalExportOpen] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState<KpiMetric[]>([]);
  const [singleExportKpi, setSingleExportKpi] = useState<KpiMetric | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('ALL');

  // Deletion Modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    kpis: KpiMetric[];
  }>({
    isOpen: false,
    kpis: [],
  });

  // LocalStorage Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_kpi_management_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setKpis(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveKpis = (updated: KpiMetric[]) => {
    setKpis(updated);
    try {
      localStorage.setItem('erp_kpi_management_v1', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // KPIs Calculations
  const onTrackCount = kpis.filter((k) => k.status === 'ON_TRACK').length;
  const atRiskCount = kpis.filter((k) => k.status === 'AT_RISK').length;
  const criticalCount = kpis.filter((k) => k.status === 'CRITICAL').length;
  const exceededCount = kpis.filter((k) => k.status === 'EXCEEDED').length;

  // Executive Spotlight KPIs
  const kpiQA01 = kpis.find((k) => k.kpiCode === 'KPI-QA-01') || kpis[0];
  const kpiQA02 = kpis.find((k) => k.kpiCode === 'KPI-QA-02') || kpis[1];
  const kpiQA06 = kpis.find((k) => k.kpiCode === 'KPI-QA-06') || kpis.find((k) => k.metricName.toLowerCase().includes('audit')) || kpis[2];
  const kpiCS04 = kpis.find((k) => k.kpiCode === 'KPI-CS-04') || kpis.find((k) => k.category === 'COST') || kpis[3];

  // Cross-KPI Corrective Actions
  const allActionItems = kpis.flatMap((k) =>
    (k.actionItems || []).map((act) => ({
      ...act,
      kpiId: k.id,
      kpiCode: k.kpiCode || k.id,
      metricName: k.metricName,
    }))
  );
  const pendingActions = allActionItems.filter((a) => !a.completed).length;

  // Filtered KPIs for Main Table
  const filteredKpis = kpis.filter((k) => {
    if (categoryFilter !== 'ALL' && k.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && k.status !== statusFilter) return false;
    if (frequencyFilter !== 'ALL' && k.frequency !== frequencyFilter) return false;
    return true;
  });

  // Duplicate Handler
  const handleDuplicateKpi = (source: KpiMetric) => {
    const duplicated: KpiMetric = {
      ...source,
      id: `kpi-${Date.now()}`,
      kpiCode: `KPI-QA-${String(Math.floor(Math.random() * 90) + 10)}`,
      metricName: `${source.metricName} (Duplicate)`,
      status: 'ON_TRACK',
      history: source.history ? [...source.history] : [],
      actionItems: [],
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    const updated = [duplicated, ...kpis];
    saveKpis(updated);
    showToast(`Created duplicate indicator ${duplicated.kpiCode}`);
  };

  // Delete Handler
  const handleConfirmDelete = () => {
    const idsToDelete = new Set(deleteModalState.kpis.map((k) => k.id));
    const updated = kpis.filter((k) => !idsToDelete.has(k.id));
    saveKpis(updated);
    setDeleteModalState({ isOpen: false, kpis: [] });
    if (subView.type === 'details' && idsToDelete.has(subView.kpi.id)) {
      setSubView({ type: 'none' });
    }
    showToast(`Successfully deleted ${idsToDelete.size} KPI metric(s)`);
  };

  // Update Single KPI
  const handleUpdateKpi = (updatedKpi: KpiMetric) => {
    const updated = kpis.map((k) => (k.id === updatedKpi.id ? updatedKpi : k));
    saveKpis(updated);
  };

  // Toggle Action Item from Cross-KPI Tracker
  const handleToggleActionAcrossKpis = (kpiId: string, actionId: string) => {
    const targetKpi = kpis.find((k) => k.id === kpiId);
    if (!targetKpi) return;

    const updatedActions = (targetKpi.actionItems || []).map((act) => {
      if (act.id !== actionId) return act;
      const isNowDone = !act.completed;
      return {
        ...act,
        completed: isNowDone,
        completedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined,
      };
    });

    const updatedKpi: KpiMetric = {
      ...targetKpi,
      actionItems: updatedActions,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    handleUpdateKpi(updatedKpi);
    showToast('Updated remediation action status');
  };

  // Columns for Scorecard Table - Specially fitted to reduce horizontal scroll
  const columns: ColumnDef<KpiMetric>[] = [
    {
      key: 'metricName',
      header: 'Indicator & Domain',
      sortable: true,
      accessor: (item) => item.metricName,
      render: (item) => {
        const catCfg = KPI_CATEGORY_CONFIG[item.category] || {
          label: item.category,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };

        return (
          <div className="space-y-1 max-w-[260px]">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-blue-700 text-xs hover:underline cursor-pointer"
                onClick={() => setSubView({ type: 'details', kpi: item })}>
                {item.kpiCode || 'KPI'}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${catCfg.badgeClass}`}>
                {catCfg.label}
              </span>
            </div>
            <span
              onClick={() => setSubView({ type: 'details', kpi: item })}
              className="font-semibold text-slate-900 text-xs hover:text-blue-600 cursor-pointer line-clamp-1"
              title={item.metricName}
            >
              {item.metricName}
            </span>
          </div>
        );
      },
    },
    {
      key: 'currentValue',
      header: 'Actual vs Target',
      sortable: true,
      align: 'right',
      accessor: (item) => item.currentValue,
      render: (item) => {
        const isLowerBetter =
          item.desiredDirection === 'LOWER_IS_BETTER' ||
          item.metricName.toLowerCase().includes('dhu') ||
          item.metricName.toLowerCase().includes('cost');
        const delta = item.currentValue - item.targetValue;
        const isFavorable = isLowerBetter ? delta <= 0 : delta >= 0;

        return (
          <div className="text-right">
            <span className="font-mono font-bold text-xs text-slate-900 block">
              {item.currentValue} {item.unit}
            </span>
            <div className="text-[10px] font-mono flex items-center justify-end gap-1 mt-0.5">
              <span className="text-slate-500">Tgt: {item.targetValue}</span>
              <span className={isFavorable ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                ({delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)})
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'trend',
      header: 'Trend Direction',
      align: 'center',
      render: (item) => {
        const isLowerBetter =
          item.desiredDirection === 'LOWER_IS_BETTER' ||
          item.metricName.toLowerCase().includes('dhu') ||
          item.metricName.toLowerCase().includes('cost');

        const isPositive =
          (item.trend === 'DOWN' && isLowerBetter) ||
          (item.trend === 'UP' && !isLowerBetter);

        return (
          <div className="flex items-center justify-center gap-1 font-mono text-xs font-semibold">
            {item.trend === 'UP' ? (
              <TrendingUp className={`w-3.5 h-3.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
            ) : item.trend === 'DOWN' ? (
              <TrendingDown className={`w-3.5 h-3.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
            ) : (
              <span className="text-slate-400">—</span>
            )}
            <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>{item.trend}</span>
          </div>
        );
      },
    },
    {
      key: 'department',
      header: 'Department & Lead',
      render: (item) => (
        <div className="max-w-[170px] text-xs">
          <span className="font-medium text-slate-800 block truncate">
            {item.department || 'Production Floor'}
          </span>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {item.ownerName ? item.ownerName.split('(')[0] : 'QA Team'}
          </span>
        </div>
      ),
    },
    {
      key: 'benchmark',
      header: 'Standard Benchmark',
      render: (item) => (
        <div className="max-w-[160px] text-xs">
          <span className="text-slate-700 truncate block font-medium">
            {item.benchmark}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
            {item.frequency || 'Daily'} Check
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Health Status',
      sortable: true,
      align: 'center',
      accessor: (item) => item.status,
      render: (item) => {
        const variantMap: Record<string, any> = {
          ON_TRACK: 'emerald',
          AT_RISK: 'amber',
          CRITICAL: 'rose',
          EXCEEDED: 'blue',
        };
        return (
          <StatusBadge
            label={item.status.replace(/_/g, ' ')}
            variant={variantMap[item.status] || 'neutral'}
          />
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', kpi: item })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => setSubView({ type: 'edit', kpi: item })}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
              title="Edit Metric"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {canExport && (
            <button
              type="button"
              onClick={() => setSingleExportKpi(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
              title="Export Performance Dossier (PDF / Excel)"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => handleDuplicateKpi(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer hidden sm:inline-flex"
              title="Duplicate Metric"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleteModalState({ isOpen: true, kpis: [item] })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
              title="Delete Metric"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<KpiMetric>[] = [
    ...(canDelete
      ? [
          {
            label: 'Delete Selected',
            variant: 'danger' as const,
            icon: <Trash2 className="w-3.5 h-3.5" />,
            onClick: (selected: KpiMetric[]) => {
              setDeleteModalState({
                isOpen: true,
                kpis: selected,
              });
            },
          },
        ]
      : []),
    ...(canExport
      ? [
          {
            label: 'Export Selected',
            icon: <FileDown className="w-3.5 h-3.5" />,
            onClick: (selected: KpiMetric[]) => {
              setSelectedForExport(selected);
              setIsGlobalExportOpen(true);
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      {subView.type !== 'details' && (
        <ModuleHeader
          id="kpi-management-module"
          title="KPI Management"
          activeView={subView.type !== 'none' ? 'list' : viewMode}
          onViewChange={(mode) => {
            setSubView({ type: 'none' });
            setViewMode(mode);
          }}
          customTabs={[
            { id: 'summary', label: 'Summary' },
            { id: 'list', label: 'KPI Scorecard', count: kpis.length },
            { id: 'actions', label: 'Remediation Tracker', count: pendingActions },
          ]}
        />
      )}

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <KpiDetailsPage
          kpi={subView.kpi}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(k) => setSubView({ type: 'edit', kpi: k })}
          onDuplicate={(k) => {
            handleDuplicateKpi(k);
            setSubView({ type: 'none' });
          }}
          onDelete={(k) => {
            setDeleteModalState({ isOpen: true, kpis: [k] });
          }}
          onUpdateKpi={(updated) => {
            handleUpdateKpi(updated);
            setSubView({ type: 'details', kpi: updated });
          }}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <KpiEntryPage
          onSave={(newKpi) => {
            const updated = [newKpi, ...kpis];
            saveKpis(updated);
            setSubView({ type: 'details', kpi: newKpi });
            showToast(`Created performance metric ${newKpi.kpiCode || newKpi.metricName}`);
          }}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <KpiEntryPage
          initialKpi={subView.kpi}
          onSave={(updatedKpi) => {
            handleUpdateKpi(updatedKpi);
            setSubView({ type: 'details', kpi: updatedKpi });
            showToast(`Updated performance metric ${updatedKpi.kpiCode || updatedKpi.metricName}`);
          }}
          onCancel={() => setSubView({ type: 'details', kpi: subView.kpi })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Executive Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title={kpiQA01?.metricName ? (kpiQA01.metricName.length > 28 ? `${kpiQA01.metricName.substring(0, 25)}...` : kpiQA01.metricName) : "Floor DHU Rate"}
                  value={kpiQA01 ? `${kpiQA01.currentValue}${kpiQA01.unit}` : "1.8%"}
                  subtitle={kpiQA01 ? `Target ${kpiQA01.desiredDirection === 'LOWER_IS_BETTER' ? '≤' : '≥'} ${kpiQA01.targetValue}${kpiQA01.unit} Defect Benchmark` : "Target < 1.5% Defect Rate"}
                  icon={Target}
                  tone={kpiQA01?.status === 'CRITICAL' ? 'rose' : kpiQA01?.status === 'AT_RISK' ? 'amber' : 'emerald'}
                />
                <StatCard
                  title={kpiQA02?.metricName ? (kpiQA02.metricName.length > 28 ? `${kpiQA02.metricName.substring(0, 25)}...` : kpiQA02.metricName) : "Right First Time (RFT)"}
                  value={kpiQA02 ? `${kpiQA02.currentValue}${kpiQA02.unit}` : "94.6%"}
                  subtitle={kpiQA02 ? `Target ≥ ${kpiQA02.targetValue}${kpiQA02.unit} (Benchmark: ${kpiQA02.benchmark?.split(' ')[0] || '>95%'})` : "World-Class Benchmark >95%"}
                  icon={CheckCircle2}
                  tone={kpiQA02?.status === 'CRITICAL' ? 'rose' : kpiQA02?.status === 'AT_RISK' ? 'amber' : 'blue'}
                />
                <StatCard
                  title={kpiQA06?.metricName ? (kpiQA06.metricName.length > 28 ? `${kpiQA06.metricName.substring(0, 25)}...` : kpiQA06.metricName) : "Final Audit Pass"}
                  value={kpiQA06 ? `${kpiQA06.currentValue}${kpiQA06.unit}` : "98.8%"}
                  subtitle={kpiQA06 ? `Target ≥ ${kpiQA06.targetValue}${kpiQA06.unit} AQL Inspections` : "Pre-Shipment Inspections"}
                  icon={BarChart3}
                  tone={kpiQA06?.status === 'CRITICAL' ? 'rose' : kpiQA06?.status === 'AT_RISK' ? 'amber' : 'indigo'}
                />
                <StatCard
                  title={kpiCS04?.metricName ? (kpiCS04.metricName.length > 28 ? `${kpiCS04.metricName.substring(0, 25)}...` : kpiCS04.metricName) : "Cost of Quality (CoQ)"}
                  value={kpiCS04 ? `${kpiCS04.currentValue}${kpiCS04.unit}` : "1.15%"}
                  subtitle={kpiCS04 ? `Target ≤ ${kpiCS04.targetValue}${kpiCS04.unit} FOB Turnover` : "Percent of Total FOB Turnover"}
                  icon={AlertCircle}
                  tone={kpiCS04?.status === 'CRITICAL' ? 'rose' : kpiCS04?.status === 'AT_RISK' ? 'amber' : 'amber'}
                />
              </div>

              {/* Advanced Visual Charts & Graphical Intelligence Suite */}
              <KpiSummaryCharts
                kpis={kpis}
                onFilterCategory={(cat) => {
                  setCategoryFilter(cat);
                  setViewMode('list');
                }}
                onFilterStatus={(status) => {
                  setStatusFilter(status);
                  setViewMode('list');
                }}
                onNavigateToList={() => setViewMode('list')}
                onSelectKpiDetails={(kpi) => setSubView({ type: 'details', kpi })}
              />

              <SwitchToListBanner
                label="Open Complete KPI Performance Scorecard Register"
                recordCount={kpis.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: MAIN KPI SCORECARD REGISTER TABLE */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="kpi-scorecard-table"
                data={filteredKpis}
                columns={columns}
                searchPlaceholder="Search KPI metric code, title, department, or benchmark..."
                searchableKeys={[
                  'kpiCode',
                  'metricName',
                  'category',
                  'department',
                  'ownerName',
                  'benchmark',
                ]}
                secondaryAction={
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Domain Filter */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Operational Domains</option>
                      <option value="QUALITY">Quality Assurance</option>
                      <option value="PRODUCTIVITY">Plant Productivity</option>
                      <option value="DELIVERY">Supply Chain &amp; Delivery</option>
                      <option value="COST">Cost &amp; Efficiency</option>
                      <option value="SAFETY">Product Safety &amp; Metal</option>
                      <option value="COMPLIANCE">Compliance &amp; ESG</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Health Statuses</option>
                      <option value="ON_TRACK">On Track</option>
                      <option value="AT_RISK">At Risk</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="EXCEEDED">Exceeded</option>
                    </select>

                    {/* Frequency Filter */}
                    <select
                      value={frequencyFilter}
                      onChange={(e) => setFrequencyFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Frequencies</option>
                      <option value="DAILY">Daily Floor Check</option>
                      <option value="WEEKLY">Weekly Review</option>
                      <option value="MONTHLY">Monthly Scorecard</option>
                      <option value="PER_SHIPMENT">Per Shipment</option>
                    </select>
                  </div>
                }
                primaryAction={
                  <div className="flex items-center gap-2">
                    {canExport && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedForExport([]);
                          setIsGlobalExportOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
                      >
                        <FileDown className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export</span>
                      </button>
                    )}
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => setSubView({ type: 'add' })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Metric</span>
                      </button>
                    )}
                  </div>
                }
                batchActions={batchActions}
                moduleKey="kpi_management"
                canExport={canExport}
                canDelete={canDelete}
              />
            </div>
          )}

          {/* TAB 3: CROSS-KPI REMEDIATION ACTION TRACKER */}
          {viewMode === 'actions' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-blue-600" />
                    <span>Cross-KPI Corrective Action &amp; Remediation Plan (CAPA)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live accountability tracker for remediation tasks triggered by At-Risk and Critical quality indicators.
                  </p>
                </div>
              </div>

              {/* Action Items List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">Done</th>
                        <th className="py-3 px-3">Remediation Task</th>
                        <th className="py-3 px-3">Triggering KPI Indicator</th>
                        <th className="py-3 px-3">Assignee &amp; Dept</th>
                        <th className="py-3 px-3">Due Date</th>
                        <th className="py-3 px-3 text-center">Priority</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allActionItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                            No remediation action tasks logged across current performance indicators.
                          </td>
                        </tr>
                      ) : (
                        allActionItems.map((act) => {
                          const priorityBadgeClass =
                            act.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : act.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200';

                          return (
                            <tr
                              key={`${act.kpiId}-${act.id}`}
                              className={`hover:bg-slate-50/70 transition-colors ${
                                act.completed ? 'bg-emerald-50/20' : ''
                              }`}
                            >
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={() =>
                                    handleToggleActionAcrossKpis(act.kpiId, act.id)
                                  }
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer mx-auto disabled:cursor-not-allowed disabled:opacity-60 ${
                                    act.completed
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 hover:border-blue-500 bg-white'
                                  }`}
                                  title={act.completed ? 'Click to reopen' : 'Click to complete'}
                                >
                                  {act.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                              </td>
                              <td className="py-3 px-3 max-w-sm">
                                <span
                                  className={`font-semibold block ${
                                    act.completed ? 'line-through text-slate-400' : 'text-slate-900'
                                  }`}
                                >
                                  {act.task}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const k = kpis.find((x) => x.id === act.kpiId);
                                    if (k) setSubView({ type: 'details', kpi: k });
                                  }}
                                  className="text-blue-600 hover:underline font-bold block"
                                >
                                  {act.kpiCode}
                                </button>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                                  {act.metricName}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-800 block">
                                  {act.assignee}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {act.department || 'Quality Assurance'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-700">
                                {act.dueDate}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${priorityBadgeClass}`}
                                >
                                  {act.priority || 'MEDIUM'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    act.completed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {act.completed ? 'Done' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteKpiModal
        isOpen={deleteModalState.isOpen}
        kpis={deleteModalState.kpis}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, kpis: [] })}
      />

      {/* Global Export Modal */}
      <KpiExportModal
        isOpen={isGlobalExportOpen}
        onClose={() => setIsGlobalExportOpen(false)}
        allKpis={kpis}
        selectedKpis={selectedForExport}
      />

      {/* Single KPI Export Modal */}
      <KpiSingleExportModal
        isOpen={!!singleExportKpi}
        onClose={() => setSingleExportKpi(null)}
        kpi={singleExportKpi}
      />
    </div>
  );
}
