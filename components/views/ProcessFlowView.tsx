'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  Clock,
  CheckCircle2,
  Factory,
  ChevronRight,
  Layers,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  Sliders,
  ShieldCheck,
  Search,
  Download,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { ProcessFlowChart, ProcessFlowStep } from '@/lib/types/modules';
import {
  INITIAL_PROCESS_FLOW_CHARTS,
  MASTER_GARMENT_FLOW_STEPS,
} from '../modules/process-flow/process-flow-data';
import { ProcessFlowDetailsPage } from '../modules/process-flow/ProcessFlowDetailsPage';
import { ProcessFlowEntryPage } from '../modules/process-flow/ProcessFlowEntryPage';
import { DeleteProcessFlowModal } from '../modules/process-flow/DeleteProcessFlowModal';

type ProcessFlowSubView =
  | { type: 'none' }
  | { type: 'details'; flow: ProcessFlowChart }
  | { type: 'add' }
  | { type: 'edit'; flow: ProcessFlowChart };

export function ProcessFlowView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  // Load from localStorage or fallback to INITIAL_PROCESS_FLOW_CHARTS
  const [flows, setFlows] = useState<ProcessFlowChart[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('erp_process_flow_library_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed parsing stored process flows:', err);
      }
    }
    return INITIAL_PROCESS_FLOW_CHARTS;
  });

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('erp_process_flow_library_v1', JSON.stringify(flows));
      } catch (err) {
        console.warn('Failed saving process flows to localStorage:', err);
      }
    }
  }, [flows]);

  // Subview State (Details, Add, Edit)
  const [subView, setSubView] = useState<ProcessFlowSubView>({ type: 'none' });

  // Sync subview details if flow data updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = flows.find((f) => f.id === subView.flow.id);
      if (refreshed && refreshed !== subView.flow) {
        setSubView({ type: 'details', flow: refreshed });
      }
    }
  }, [flows, subView]);

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    flows: ProcessFlowChart[];
  } | null>(null);

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Selected stage in the summary interactive pipeline
  const [selectedSummaryStep, setSelectedSummaryStep] = useState<ProcessFlowStep>(
    MASTER_GARMENT_FLOW_STEPS[3] // Default: Warehouse Inward & 4-Point QC
  );

  // CRUD Handlers
  const handleCreateFlow = (newFlow: ProcessFlowChart) => {
    const updated = [newFlow, ...flows];
    setFlows(updated);
    setSubView({ type: 'details', flow: newFlow });
    showToast(`Successfully created flow chart ${newFlow.flowCode}`);
  };

  const handleUpdateFlow = (updatedFlow: ProcessFlowChart) => {
    const updated = flows.map((f) => (f.id === updatedFlow.id ? updatedFlow : f));
    setFlows(updated);
    if (subView.type === 'edit' || subView.type === 'details') {
      setSubView({ type: 'details', flow: updatedFlow });
    }
    showToast(`Saved changes to flow chart ${updatedFlow.flowCode}`);
  };

  const handleDuplicateFlow = (flow: ProcessFlowChart) => {
    const duplicated: ProcessFlowChart = {
      ...JSON.parse(JSON.stringify(flow)),
      id: `pfc-${Date.now()}`,
      flowCode: `${flow.flowCode}-COPY`,
      title: `${flow.title} (Copy)`,
      status: 'DRAFT',
      version: 'Rev 1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...flows];
    setFlows(updated);
    setSubView({ type: 'details', flow: duplicated });
    showToast(`Duplicated process flow as ${duplicated.flowCode}`);
  };

  const confirmDeleteFlows = () => {
    if (!deleteModal || deleteModal.flows.length === 0) return;
    const idsToDelete = new Set(deleteModal.flows.map((f) => f.id));
    setFlows((prev) => prev.filter((f) => !idsToDelete.has(f.id)));

    if (
      (subView.type === 'details' && idsToDelete.has(subView.flow.id)) ||
      (subView.type === 'edit' && idsToDelete.has(subView.flow.id))
    ) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.flows.length;
    showToast(
      count === 1
        ? `Deleted process flow ${deleteModal.flows[0].flowCode}`
        : `Deleted ${count} process flows successfully`
    );
    setDeleteModal(null);
  };

  // Filtered Flowcharts
  const filteredFlows = flows.filter((f) => {
    if (categoryFilter !== 'ALL' && f.productCategory !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    return true;
  });

  const categories = Array.from(new Set(flows.map((f) => f.productCategory)));

  // KPIs
  const totalStagesAcrossFlows = flows.reduce((sum, f) => sum + (f.steps?.length || 0), 0);
  const avgCycleHours =
    flows.length > 0
      ? Math.round(
          flows.reduce((sum, f) => sum + (f.totalLeadTimeHours || 0), 0) / flows.length
        )
      : 0;
  const totalCriticalGates = flows.reduce(
    (sum, f) => sum + ((f.steps || []).filter((s) => s.criticalGate).length || 0),
    0
  );

  // Table Columns - Designed to fit without horizontal scrolling!
  const columns: ColumnDef<ProcessFlowChart>[] = [
    {
      key: 'flowCode',
      header: 'Code & Status',
      sortable: true,
      accessor: (f) => f.flowCode,
      render: (item) => (
        <div className="space-y-1">
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 block w-fit">
            {item.flowCode}
          </span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold border font-mono inline-block ${
              item.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : item.status === 'UNDER_REVIEW'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {item.status}
          </span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Flowchart Title & Category',
      sortable: true,
      accessor: (f) => f.title,
      render: (item) => (
        <div className="min-w-[200px] max-w-sm">
          <div
            className="font-bold text-slate-900 text-xs hover:text-blue-600 cursor-pointer transition-colors leading-snug"
            onClick={() => setSubView({ type: 'details', flow: item })}
          >
            {item.title}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center flex-wrap gap-1.5">
            <span className="text-indigo-700 font-semibold">{item.productCategory}</span>
            <span>•</span>
            <span>{item.department}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'stages',
      header: 'Pipeline Stages',
      render: (item) => {
        const crit = (item.steps || []).filter((s) => s.criticalGate).length;
        return (
          <div className="text-xs space-y-0.5 whitespace-nowrap">
            <div className="font-mono text-slate-800 font-bold">
              {item.steps?.length || 0} Stages
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              {crit} Critical Quality Gates
            </div>
          </div>
        );
      },
    },
    {
      key: 'leadTime',
      header: 'Cycle Time',
      sortable: true,
      accessor: (f) => f.totalLeadTimeHours || 0,
      render: (item) => (
        <div className="text-xs font-mono whitespace-nowrap">
          <span className="font-bold text-slate-800">
            {item.totalLeadTimeHours || 0} hrs
          </span>
          <div className="text-[10px] text-slate-400">
            ~{((item.totalLeadTimeHours || 0) / 24).toFixed(1)} Days
          </div>
        </div>
      ),
    },
    {
      key: 'version',
      header: 'Version',
      sortable: true,
      accessor: (f) => f.version,
      render: (item) => (
        <div className="text-xs font-mono whitespace-nowrap">
          <span className="font-bold text-slate-800">{item.version}</span>
          <div className="text-[10px] text-slate-400">{item.effectiveDate}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1 shrink-0">
          {/* Details Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', flow: item })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Separate Flowchart Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', flow: item })}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Open Separate Flowchart Edit Page"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateFlow(item)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate Flowchart"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, flows: [item] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Flowchart"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: 3-tab layout (Summary, Flow Register, Master Pipeline) */}
      <ModuleHeader
        id="process-flow-module"
        moduleCode="MOD-26"
        badge="Manufacturing Pipeline"
        title="Process Flow Chart & Manufacturing Pipeline"
        subtitle="End-to-end industrial engineering stages, quality validation gates, and machine transformation cycles"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Process Flow Register', count: flows.length },
          { id: 'pipeline', label: 'Master Pipeline Flowchart' },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <ProcessFlowDetailsPage
          flow={subView.flow}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(f) => setSubView({ type: 'edit', flow: f })}
          onDuplicate={(f) => handleDuplicateFlow(f)}
          onDelete={(f) => setDeleteModal({ isOpen: true, flows: [f] })}
          onUpdateStatus={handleUpdateFlow}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <ProcessFlowEntryPage
          onSave={handleCreateFlow}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <ProcessFlowEntryPage
          initialFlow={subView.flow}
          onSave={handleUpdateFlow}
          onCancel={() => setSubView({ type: 'details', flow: subView.flow })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 4 StatCards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Standard Flowcharts"
                  value={flows.length}
                  subtitle="Active Manufacturing Pipelines"
                  icon={GitCommit}
                  tone="blue"
                  delta={{ value: '+1 Release', isPositive: true }}
                />
                <StatCard
                  title="Average Cycle Time"
                  value={`${avgCycleHours} Hours`}
                  subtitle={`~${(avgCycleHours / 24).toFixed(1)} Operating Days`}
                  icon={Clock}
                  tone="indigo"
                />
                <StatCard
                  title="Critical Quality Gates"
                  value={totalCriticalGates}
                  subtitle="100% In-Line Inspection Gates"
                  icon={CheckCircle2}
                  tone="emerald"
                />
                <StatCard
                  title="Automation Machinery"
                  value="CNC & Direct-Drive"
                  subtitle="Industry 4.0 Equipment"
                  icon={Factory}
                  tone="amber"
                />
              </div>

              {/* Clean Light-Themed Highlight Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Industrial Engineering Master Flow</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Garment Quality Process Flowchart Architecture
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Standardized engineering pipelines defining input raw materials, progressive machine
                    transformations, and mandatory AQL quality gates across knitwear, denim, and performance lines.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const master = flows[0] || INITIAL_PROCESS_FLOW_CHARTS[0];
                      setSubView({ type: 'details', flow: master });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Master Flow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Flow Chart</span>
                  </button>
                </div>
              </div>

              {/* Interactive Horizontal Pipeline Visualizer */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Master Garment Manufacturing Quality Process Pipeline
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any stage along the manufacturing flow to inspect quality gates, standard tools, and input transformation criteria.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 self-start sm:self-auto">
                    {MASTER_GARMENT_FLOW_STEPS.length} Stages • 218 Operating Hours
                  </span>
                </div>

                {/* Steps Ribbon */}
                <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1">
                  {MASTER_GARMENT_FLOW_STEPS.map((step) => {
                    const isSelected = selectedSummaryStep.stepNumber === step.stepNumber;
                    return (
                      <React.Fragment key={step.stepNumber}>
                        <button
                          type="button"
                          onClick={() => setSelectedSummaryStep(step)}
                          className={`p-3 rounded-xl border text-left shrink-0 transition-all cursor-pointer min-w-[190px] max-w-[210px] ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                                isSelected ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              0{step.stepNumber}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/70 text-slate-600'
                              }`}
                            >
                              {step.leadTimeHours}h
                            </span>
                          </div>
                          <div className="font-semibold text-xs truncate" title={step.stageName}>
                            {step.stageName}
                          </div>
                          <div
                            className={`text-[10px] font-mono truncate mt-0.5 ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            {step.department}
                          </div>
                        </button>
                        {step.stepNumber < MASTER_GARMENT_FLOW_STEPS.length && (
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Selected Stage Detail Inspector */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">
                        Stage 0{selectedSummaryStep.stepNumber}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{selectedSummaryStep.stageName}</h4>
                      <span className="text-xs text-slate-500 font-mono">({selectedSummaryStep.department})</span>
                    </div>
                    <span className="font-mono text-xs text-slate-700 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                      Operating Time: {selectedSummaryStep.leadTimeHours} Hours
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-400 text-[10px] uppercase block">
                        Input Raw Materials
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {selectedSummaryStep.inputMaterials}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-400 text-[10px] uppercase block">
                        Process Transformation
                      </span>
                      <p className="text-slate-800 leading-relaxed">
                        {selectedSummaryStep.transformation}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-emerald-700 text-[10px] uppercase block">
                        Quality Gate &amp; Standard Tool
                      </span>
                      <p className="text-slate-800 font-semibold leading-relaxed">
                        {selectedSummaryStep.qualityGate}
                      </p>
                      <div className="text-[11px] text-blue-700 font-mono mt-1 pt-1 border-t border-slate-100">
                        Tool: {selectedSummaryStep.standardTool}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <SwitchToListBanner
                label="Open Process Flow Charts & Engineering Register"
                recordCount={flows.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: PROCESS FLOW REGISTER (DATATABLE CONFIGURED TO FIT WITHOUT HORIZONTAL SCROLL) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="process-flow-table"
                title="Industrial Engineering Process Flow Charts"
                subtitle="Governed under standard factory motion & time studies and AQL inspection gates"
                data={filteredFlows}
                columns={columns}
                searchPlaceholder="Search flow code, title, product category, or department..."
                searchableKeys={['flowCode', 'title', 'productCategory', 'department', 'author']}
                secondaryAction={
                  <div className="flex items-center gap-2">
                    {/* Category filter */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Flow Chart</span>
                  </button>
                }
                batchActions={[
                  {
                    label: 'Delete Selected',
                    variant: 'danger',
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      setDeleteModal({
                        isOpen: true,
                        flows: selected,
                      });
                    },
                  },
                  {
                    label: 'Export Selected',
                    icon: <Download className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      showToast(`Exported ${selected.length} process flow records`);
                    },
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 3: MASTER PIPELINE FLOWCHART */}
          {viewMode === 'pipeline' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Master Manufacturing Flow Comparison &amp; Category Overview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparative cycle time, tooling, and critical quality gate distribution
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubView({ type: 'add' })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Flow Chart</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flows.map((f) => {
                  const crit = (f.steps || []).filter((s) => s.criticalGate).length;
                  return (
                    <div
                      key={f.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800">
                            {f.flowCode}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-600">
                            {f.totalLeadTimeHours || 0} hrs (~{((f.totalLeadTimeHours || 0) / 24).toFixed(1)}d)
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{f.title}</h4>
                        <div className="text-[11px] text-slate-500">
                          {f.productCategory} • {f.department}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {f.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          {f.steps?.length || 0} Stages ({crit} Critical)
                        </span>
                        <button
                          type="button"
                          onClick={() => setSubView({ type: 'details', flow: f })}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <span>Open Flow</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <DeleteProcessFlowModal
          isOpen={deleteModal.isOpen}
          flows={deleteModal.flows}
          onConfirm={confirmDeleteFlows}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
