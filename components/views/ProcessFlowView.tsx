'use client';

import React, { useState, useMemo } from 'react';
import {
  Network,
  ListOrdered,
  Plus,
  Eye,
  FileDown,
  Trash2,
  Copy,
  Edit,
  Search,
  Sparkles,
  CheckCircle2,
  Layers,
  Clock,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ProcessFlowChart, ProcessFlowStep } from '@/lib/types/modules';
import { INITIAL_PROCESS_FLOW_CHARTS } from '../modules/process-flow/process-flow-data';
import { useLiveModuleData } from '@/hooks/use-live-module-data';
import { ProcessFlowVisualTree } from '../modules/process-flow/ProcessFlowVisualTree';
import { QuickNewFlowModal } from '../modules/process-flow/QuickNewFlowModal';
import { ProcessFlowSingleExportModal } from '../modules/process-flow/ProcessFlowSingleExportModal';
import { ProcessFlowExportModal } from '../modules/process-flow/ProcessFlowExportModal';
import { DeleteProcessFlowModal } from '../modules/process-flow/DeleteProcessFlowModal';
import { useModulePermission } from '@/hooks/use-module-permission';

export function ProcessFlowView() {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('process_flow');

  // Live Synchronized Central Storage
  const [rawFlows, setRawFlows] = useLiveModuleData<any[]>(
    'process_flow_library',
    INITIAL_PROCESS_FLOW_CHARTS,
    'erp_process_flow_library_v3'
  );

  // Validate and guarantee valid ProcessFlowChart array
  const flows: ProcessFlowChart[] = useMemo(() => {
    if (!Array.isArray(rawFlows) || rawFlows.length === 0) {
      return INITIAL_PROCESS_FLOW_CHARTS;
    }
    const isValid = rawFlows.every(
      (item) => item && typeof item === 'object' && 'flowCode' in item && Array.isArray(item.steps)
    );
    if (!isValid) return INITIAL_PROCESS_FLOW_CHARTS;
    return rawFlows as ProcessFlowChart[];
  }, [rawFlows]);

  const setFlows = (updatedOrUpdater: ProcessFlowChart[] | ((prev: ProcessFlowChart[]) => ProcessFlowChart[])) => {
    setRawFlows(updatedOrUpdater);
  };

  // Primary Tab: 'tree' (Visual Flowchart Studio) vs 'register' (Flow Register Directory)
  const [activeTab, setActiveTab] = useState<'tree' | 'register'>('tree');

  // Register display format: 'cards' (Clean modern cards) vs 'table' (Tabular register)
  const [registerLayout, setRegisterLayout] = useState<'cards' | 'table'>('cards');

  // Active Flow for Visual Tree Canvas (defaults to Sewing Section flow)
  const [selectedFlowId, setSelectedFlowId] = useState<string>('pfc-sew-01');

  const activeFlow: ProcessFlowChart = useMemo(() => {
    const found = flows.find((f) => f.id === selectedFlowId || f.flowCode === selectedFlowId);
    return found || flows[0] || INITIAL_PROCESS_FLOW_CHARTS[0];
  }, [flows, selectedFlowId]);

  // Search & Filter in Register
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; flows: ProcessFlowChart[] } | null>(null);
  const [isSingleExportOpen, setIsSingleExportOpen] = useState(false);
  const [singleExportFlow, setSingleExportFlow] = useState<ProcessFlowChart | null>(null);
  const [isGlobalExportOpen, setIsGlobalExportOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered flows for register
  const categories = useMemo(() => {
    const set = new Set(flows.map((f) => f.productCategory).filter(Boolean));
    return Array.from(set);
  }, [flows]);

  const filteredFlows = useMemo(() => {
    return flows.filter((f) => {
      const matchesSearch =
        searchQuery === '' ||
        f.flowCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || f.productCategory === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [flows, searchQuery, selectedCategory]);

  // Update a flow directly from canvas or edit
  const handleUpdateFlow = (updated: ProcessFlowChart) => {
    setFlows((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    showToast(`Updated "${updated.title}" successfully`);
  };

  // Create new flow
  const handleCreateFlow = (newFlow: ProcessFlowChart) => {
    setFlows((prev) => [newFlow, ...prev]);
    setSelectedFlowId(newFlow.id);
    setActiveTab('tree');
    showToast(`Created "${newFlow.title}" • Opened in Visual Tree`);
  };

  // Duplicate flow
  const handleDuplicateFlow = (flow: ProcessFlowChart) => {
    const duplicated: ProcessFlowChart = {
      ...JSON.parse(JSON.stringify(flow)),
      id: `pfc-${Date.now()}`,
      flowCode: `${flow.flowCode}-COPY`,
      title: `${flow.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFlows((prev) => [duplicated, ...prev]);
    setSelectedFlowId(duplicated.id);
    setActiveTab('tree');
    showToast(`Duplicated flowchart as ${duplicated.flowCode}`);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deleteModal || deleteModal.flows.length === 0) return;
    const ids = new Set(deleteModal.flows.map((f) => f.id));
    setFlows((prev) => prev.filter((f) => !ids.has(f.id)));
    if (ids.has(selectedFlowId)) {
      setSelectedFlowId('pfc-sew-01');
    }
    showToast('Deleted flowchart successfully');
    setDeleteModal(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Clean, Restructured Navigation Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              ISO 9001:2015 Clause 8.1
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {flows.length} Flowcharts Registered
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Process Flow Studio
          </h1>
          <p className="text-xs text-slate-500">
            Interactive visual flowcharts, quality gates, and decision trees on a clean white canvas.
          </p>
        </div>

        {/* Action Controls & Primary Tab Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Main 2-View Switcher: Visual Tree vs Directory */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('tree')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'tree'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Visual Flowchart Tree</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Flow Register Directory</span>
            </button>
          </div>

          {/* Create New Flowchart Button */}
          {canCreate && (
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Flowchart</span>
            </button>
          )}

          {/* Export Register Button */}
          {canExport && (
            <button
              type="button"
              onClick={() => setIsGlobalExportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
              title="Export Register (PDF / Excel / CSV)"
            >
              <FileDown className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: VISUAL FLOWCHART STUDIO (INTERACTIVE TREE ON WHITE CANVAS)        */}
      {/* ========================================================================= */}
      {activeTab === 'tree' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Quick 1-Click Flowchart Selector Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[11px] font-bold uppercase text-slate-400 whitespace-nowrap mr-1">
                Select Flowchart:
              </span>
              {flows.map((f) => {
                const isSelected = f.id === activeFlow.id;
                const isSewing = f.flowCode.includes('SEW');
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFlowId(f.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>
                      {isSewing
                        ? '🧵'
                        : f.flowCode.includes('CUT')
                        ? '✂️'
                        : f.flowCode.includes('DNM')
                        ? '👖'
                        : f.flowCode.includes('FIN')
                        ? '📦'
                        : '👕'}
                    </span>
                    <span>{f.flowCode}</span>
                    <span className={`text-[11px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      • {f.title.split(' ')[0]} {f.title.split(' ')[1] || ''}
                    </span>
                    {isSewing && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-bold ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        Ref Match
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Export for Active Flow */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSingleExportFlow(activeFlow);
                  setIsSingleExportOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                title="Export PDF Dossier"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-600" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* The Visual Tree Canvas Component (White Background) */}
          <ProcessFlowVisualTree
            flow={activeFlow}
            onUpdateFlow={handleUpdateFlow}
            showEditorToggle={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: FLOW REGISTER DIRECTORY (CLEAN CARDS & TABLE)                     */}
      {/* ========================================================================= */}
      {activeTab === 'register' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search, Filter & Layout Switcher */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-lg">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code, title, or department..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Layout Toggle: Cards vs Table */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRegisterLayout('cards')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    registerLayout === 'cards'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterLayout('table')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    registerLayout === 'table'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tabular List View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD GRID VIEW (DEAD-SIMPLE & INTUITIVE) */}
          {registerLayout === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFlows.map((flowItem) => {
                const isSewing = flowItem.flowCode.includes('SEW');
                const stagesCount = flowItem.steps?.length || 0;
                const criticalCount = (flowItem.steps || []).filter((s) => s.criticalGate).length;

                return (
                  <div
                    key={flowItem.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all p-5 flex flex-col justify-between space-y-4 group"
                  >
                    {/* Card Top */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            {flowItem.flowCode}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {flowItem.version}
                          </span>
                        </div>
                        {isSewing && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                            ★ Image Match
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {flowItem.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {flowItem.description}
                      </p>

                      <div className="text-[11px] text-slate-500 font-mono pt-1 flex items-center gap-2">
                        <span className="font-semibold text-indigo-700">{flowItem.productCategory}</span>
                        <span>•</span>
                        <span>{flowItem.department}</span>
                      </div>
                    </div>

                    {/* Stage & Cycle Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Stages</span>
                        <span className="font-mono font-bold text-slate-800">
                          {stagesCount} Steps ({criticalCount} Gates)
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Lead Time</span>
                        <span className="font-mono font-bold text-slate-800">
                          {flowItem.totalLeadTimeHours || 0} Hours
                        </span>
                      </div>
                    </div>

                    {/* PRIMARY ACTION: OPEN VISUAL FLOWCHART */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFlowId(flowItem.id);
                          setActiveTab('tree');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer"
                      >
                        <Network className="w-4 h-4" />
                        <span>Open Visual Flowchart</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSingleExportFlow(flowItem);
                          setIsSingleExportOpen(true);
                        }}
                        className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                        title="Export PDF"
                      >
                        <FileDown className="w-4 h-4 text-slate-600" />
                      </button>

                      {canCreate && (
                        <button
                          type="button"
                          onClick={() => handleDuplicateFlow(flowItem)}
                          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                          title="Duplicate Flowchart"
                        >
                          <Copy className="w-4 h-4 text-slate-600" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ isOpen: true, flows: [flowItem] })}
                          className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
                          title="Delete Flowchart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW (CLEAN & UN-CLUTTERED) */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-5 py-3.5">Flow Code</th>
                    <th className="px-5 py-3.5">Flowchart Title &amp; Category</th>
                    <th className="px-5 py-3.5">Stages</th>
                    <th className="px-5 py-3.5">Cycle Time</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFlows.map((flowItem) => (
                    <tr key={flowItem.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {flowItem.flowCode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {flowItem.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {flowItem.productCategory} • {flowItem.department}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {flowItem.steps?.length || 0} Stages
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700 whitespace-nowrap">
                        {flowItem.totalLeadTimeHours || 0}h (~{((flowItem.totalLeadTimeHours || 0) / 24).toFixed(1)}d)
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFlowId(flowItem.id);
                              setActiveTab('tree');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <Network className="w-3.5 h-3.5" />
                            <span>Open Tree</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSingleExportFlow(flowItem);
                              setIsSingleExportOpen(true);
                            }}
                            className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                            title="Export PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, flows: [flowItem] })}
                              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                              title="Delete Flowchart"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QUICK NEW FLOWCHART CREATION MODAL */}
      <QuickNewFlowModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateFlow}
      />

      {/* INDIVIDUAL EXPORT MODAL */}
      <ProcessFlowSingleExportModal
        isOpen={isSingleExportOpen}
        onClose={() => {
          setIsSingleExportOpen(false);
          setSingleExportFlow(null);
        }}
        flow={singleExportFlow}
      />

      {/* GLOBAL REGISTER EXPORT MODAL */}
      <ProcessFlowExportModal
        isOpen={isGlobalExportOpen}
        onClose={() => setIsGlobalExportOpen(false)}
        allFlows={flows}
        selectedFlows={[]}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <DeleteProcessFlowModal
          isOpen={deleteModal.isOpen}
          flows={deleteModal.flows}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
