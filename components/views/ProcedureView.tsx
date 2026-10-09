'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  Layers,
  ShieldCheck,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  FileText,
  Download,
  FileDown,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { ProcedureItem } from '@/lib/types/modules';
import { INITIAL_PROCEDURES_LIBRARY, INITIAL_CONFORMING_PROCESS_CONTROL } from '../modules/procedure/procedure-data';
import { useLiveModuleData } from '@/hooks/use-live-module-data';
import { ProcedureDetailsPage } from '../modules/procedure/ProcedureDetailsPage';
import { ProcedureEntryPage } from '../modules/procedure/ProcedureEntryPage';
import { DeleteProcedureModal } from '../modules/procedure/DeleteProcedureModal';
import { ProcedureExportModal } from '../modules/procedure/ProcedureExportModal';
import { ProcedureSingleExportModal } from '../modules/procedure/ProcedureSingleExportModal';
import { useModulePermission } from '@/hooks/use-module-permission';

type ProcedureSubView =
  | { type: 'none' }
  | { type: 'details'; procedure: ProcedureItem }
  | { type: 'add' }
  | { type: 'edit'; procedure: ProcedureItem };

export function ProcedureView() {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('procedure');
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  const [procedures, setProcedures] = useLiveModuleData<ProcedureItem[]>(
    'procedure_library',
    INITIAL_PROCEDURES_LIBRARY,
    'erp_procedure_library_v2'
  );

  // Subview State (Details, Add, Edit)
  const [subView, setSubView] = useState<ProcedureSubView>({ type: 'none' });

  // Sync subview details if procedure updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = procedures.find((p) => p.id === subView.procedure.id);
      if (refreshed && refreshed !== subView.procedure) {
        setSubView({ type: 'details', procedure: refreshed });
      }
    }
  }, [procedures, subView]);

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    procedures: ProcedureItem[];
  } | null>(null);

  // Global & Individual Export States
  const [isGlobalExportModalOpen, setIsGlobalExportModalOpen] = useState(false);
  const [selectedProceduresForExport, setSelectedProceduresForExport] = useState<ProcedureItem[]>([]);
  const [isSingleExportModalOpen, setIsSingleExportModalOpen] = useState(false);
  const [procedureForSingleExport, setProcedureForSingleExport] = useState<ProcedureItem | null>(null);

  // Filters & Search
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // CRUD Handlers
  const handleCreateProcedure = (newProcedure: ProcedureItem) => {
    const updated = [newProcedure, ...procedures];
    setProcedures(updated);
    setSubView({ type: 'details', procedure: newProcedure });
    showToast(`Successfully created procedure ${newProcedure.procedureCode}`);
  };

  const handleUpdateProcedure = (updatedProcedure: ProcedureItem) => {
    const updated = procedures.map((p) => (p.id === updatedProcedure.id ? updatedProcedure : p));
    setProcedures(updated);
    if (subView.type === 'edit' || subView.type === 'details') {
      setSubView({ type: 'details', procedure: updatedProcedure });
    }
    showToast(`Saved all changes to procedure ${updatedProcedure.procedureCode}`);
  };

  const handleDuplicateProcedure = (procedure: ProcedureItem) => {
    const duplicated: ProcedureItem = {
      ...JSON.parse(JSON.stringify(procedure)),
      id: `prc-${Date.now()}`,
      procedureCode: `${procedure.procedureCode}-COPY`,
      title: `${procedure.title} (Copy)`,
      status: 'DRAFT',
      issueNo: '01',
      revision: 'Rev 1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...procedures];
    setProcedures(updated);
    setSubView({ type: 'details', procedure: duplicated });
    showToast(`Duplicated procedure as ${duplicated.procedureCode}`);
  };

  const confirmDeleteProcedures = () => {
    if (!deleteModal || deleteModal.procedures.length === 0) return;
    const idsToDelete = new Set(deleteModal.procedures.map((p) => p.id));
    setProcedures((prev) => prev.filter((p) => !idsToDelete.has(p.id)));

    if (
      (subView.type === 'details' && idsToDelete.has(subView.procedure.id)) ||
      (subView.type === 'edit' && idsToDelete.has(subView.procedure.id))
    ) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.procedures.length;
    showToast(
      count === 1
        ? `Deleted procedure ${deleteModal.procedures[0].procedureCode}`
        : `Deleted ${count} procedures successfully`
    );
    setDeleteModal(null);
  };

  // Filtering
  const filteredProcedures = procedures.filter((p) => {
    if (deptFilter !== 'ALL' && (p.department || 'QUALITY') !== deptFilter) return false;
    if (statusFilter !== 'ALL' && (p.status || 'ACTIVE') !== statusFilter) return false;
    return true;
  });

  const stations = Array.from(new Set(procedures.map((p) => p.station)));
  const departments = Array.from(new Set(procedures.map((p) => p.department || 'QUALITY')));

  // Compact Table Columns (Fitted to eliminate horizontal scrolling!)
  const columns: ColumnDef<ProcedureItem>[] = [
    {
      key: 'procedureCode',
      header: 'Code & Status',
      sortable: true,
      accessor: (p) => p.procedureCode,
      render: (item) => {
        const st = item.status || 'ACTIVE';
        return (
          <div className="space-y-1">
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 block w-fit">
              {item.procedureCode}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold border font-mono inline-block ${
                st === 'ACTIVE' || st === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : st === 'UNDER_REVIEW'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {st}
            </span>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Operational Procedure Title',
      sortable: true,
      accessor: (p) => p.title,
      render: (item) => (
        <div className="min-w-[200px] max-w-sm">
          <div
            className="font-bold text-slate-900 text-xs hover:text-blue-600 cursor-pointer transition-colors leading-snug"
            onClick={() => setSubView({ type: 'details', procedure: item })}
          >
            {item.title}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center flex-wrap gap-1.5">
            <span className="text-slate-700 font-semibold">{item.department || 'QUALITY'}</span>
            <span>•</span>
            <span>Station: {item.station.replace(/_/g, ' ')}</span>
          </div>
          {item.ppeRequirement && (
            <div className="text-[10px] text-amber-800 bg-amber-50/70 px-1.5 py-0.5 rounded mt-1 border border-amber-200/50 truncate">
              PPE: {item.ppeRequirement}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'coverage',
      header: 'Scope & Records',
      render: (item) => {
        const stepCount = (item.departmentProcesses || []).reduce(
          (acc, d) => acc + (d.steps?.length || 0),
          0
        );
        const formCount = (item.relatedDocuments || []).length;
        return (
          <div className="text-xs space-y-0.5 whitespace-nowrap">
            <div className="font-mono text-slate-800 font-semibold text-[11px]">
              {item.departmentProcesses?.length || 1} Depts / {stepCount || item.criticalCheckpoints.length} Steps
            </div>
            <div className="text-[11px] text-blue-600 font-mono">
              {formCount > 0 ? `${formCount} QA Forms` : 'Standard WI'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'issueRevision',
      header: 'Issue / Rev',
      sortable: true,
      accessor: (p) => p.issueNo || p.revision,
      render: (item) => (
        <div className="text-xs font-mono whitespace-nowrap">
          <span className="font-bold text-slate-800">
            {item.issueNo ? `Issue ${item.issueNo}` : item.revision}
          </span>
          <div className="text-[10px] text-slate-400">
            {item.nextReviewDate ? `Rev: ${item.nextReviewDate}` : 'Annual'}
          </div>
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
            onClick={() => setSubView({ type: 'details', procedure: item })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Separate Procedure Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Individual Export Button */}
          {canExport && (
            <button
              type="button"
              onClick={() => {
                setProcedureForSingleExport(item);
                setIsSingleExportModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
              title="Export Procedure Dossier (PDF / Excel / CSV)"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Edit Button */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setSubView({ type: 'edit', procedure: item })}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Open Separate Procedure Edit Page"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicate Button */}
          {canCreate && (
            <button
              type="button"
              onClick={() => handleDuplicateProcedure(item)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Duplicate Procedure"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleteModal({ isOpen: true, procedures: [item] })}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete Procedure"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
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

      {/* TOP HEADER: 3-tab layout (Summary, Procedure Register, Department Processes) */}
      {subView.type !== 'details' && (
        <ModuleHeader
          id="procedures-module"
          title="Guidelines & Procedures"
          activeView={subView.type !== 'none' ? 'list' : viewMode}
          onViewChange={(mode) => {
            setSubView({ type: 'none' });
            setViewMode(mode);
          }}
          customTabs={[
            { id: 'summary', label: 'Summary' },
            { id: 'list', label: 'Procedure Register', count: procedures.length },
            { id: 'departments', label: 'Department Processes', count: 6 },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {canExport && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProceduresForExport(procedures);
                    setIsGlobalExportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                  title="Export Procedures Register (PDF / Excel / CSV)"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export Register</span>
                </button>
              )}
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setSubView({ type: 'add' })}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Procedure</span>
                </button>
              )}
            </div>
          }
        />
      )}

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <ProcedureDetailsPage
          procedure={subView.procedure}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(p) => setSubView({ type: 'edit', procedure: p })}
          onDuplicate={(p) => handleDuplicateProcedure(p)}
          onDelete={(p) => setDeleteModal({ isOpen: true, procedures: [p] })}
          onUpdateStatus={handleUpdateProcedure}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <ProcedureEntryPage
          onSave={handleCreateProcedure}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <ProcedureEntryPage
          initialProcedure={subView.procedure}
          onSave={handleUpdateProcedure}
          onCancel={() => setSubView({ type: 'details', procedure: subView.procedure })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Controlled Procedures"
                  value={procedures.length}
                  subtitle="Active QMS Standard Protocols"
                  icon={ClipboardList}
                  tone="blue"
                  delta={{ value: '+2 New', isPositive: true }}
                />
                <StatCard
                  title="PPE Enforcement"
                  value="100% Mandatory"
                  subtitle="Cut Mesh, Hairnets & Masks"
                  icon={ShieldAlert}
                  tone="amber"
                />
                <StatCard
                  title="Station Coverage"
                  value="Full Process Chain"
                  subtitle="Marketing to Final Packing"
                  icon={Sliders}
                  tone="indigo"
                />
                <StatCard
                  title="Approval Governance"
                  value="ISO 9001:2015"
                  subtitle="MD & QMS Executed"
                  icon={CheckCircle2}
                  tone="emerald"
                />
              </div>

              {/* CLEAN LIGHT-THEMED HIGHLIGHT CARD (REPLACED DARK CARD) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span>Quality Operating Standard</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Standard Procedure For Conforming Process Control
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Integrated quality control system governing Marketing, Sampling, Raw Materials Store,
                    Cutting, Sewing, and Finishing with linked QA reports from the Document Control Module.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const flagship = procedures[0] || INITIAL_CONFORMING_PROCESS_CONTROL;
                      setSubView({ type: 'details', procedure: flagship });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Flagship SOP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Procedure</span>
                  </button>
                </div>
              </div>

              {/* Station Allocation & Safety Gates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Station Allocation */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Floor Station Allocation
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Coverage</span>
                  </div>
                  <div className="space-y-2">
                    {stations.map((st) => {
                      const stProcs = procedures.filter((p) => p.station === st);
                      return (
                        <div key={st} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <span className="text-xs font-semibold text-slate-800">{st.replace(/_/g, ' ')}</span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {stProcs.map((p) => p.procedureCode).join(', ')}
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {stProcs.length} SOPs
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Critical Safety & PPE Gates */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Mandatory PPE &amp; Safety Compliance
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">HSE Protocol</span>
                  </div>
                  <div className="space-y-2">
                    {procedures.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSubView({ type: 'details', procedure: p })}
                        className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-100 flex items-center justify-between hover:bg-amber-50 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-semibold text-slate-900 truncate block">{p.title}</span>
                          <div className="text-[10px] text-amber-800 font-mono mt-0.5 truncate">
                            PPE: {p.ppeRequirement}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded shrink-0">
                          {p.issueNo ? `Issue ${p.issueNo}` : p.revision}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <SwitchToListBanner
                label="Open Standard Work Instruction & Procedure Register"
                recordCount={procedures.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: PROCEDURE LIST (WITH UNIFIED FILTERS & SEARCH + BUYER ORDER STYLE BUTTONS) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="procedures-table"
                title="Procedures & Work Instructions"
                data={filteredProcedures}
                columns={columns}
                searchPlaceholder="Search procedure code, title, station, or PPE..."
                searchableKeys={['procedureCode', 'title', 'station', 'ppeRequirement', 'department']}
                secondaryAction={
                  <div className="flex items-center gap-2">
                    {/* Department filter */}
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
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
                      <option value="APPROVED">Approved</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>
                }
                primaryAction={
                  canCreate ? (
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'add' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Procedure</span>
                    </button>
                  ) : undefined
                }
                batchActions={[
                  ...(canExport
                    ? [
                        {
                          label: 'Export Selected (PDF/Excel)',
                          icon: <FileDown className="w-3.5 h-3.5" />,
                          onClick: (selected: ProcedureItem[]) => {
                            setSelectedProceduresForExport(selected);
                            setIsGlobalExportModalOpen(true);
                          },
                        },
                      ]
                    : []),
                  ...(canDelete
                    ? [
                        {
                          label: 'Delete Selected',
                          variant: 'danger' as const,
                          icon: <Trash2 className="w-3.5 h-3.5" />,
                          onClick: (selected: ProcedureItem[]) => {
                            setDeleteModal({
                              isOpen: true,
                              procedures: selected,
                            });
                          },
                        },
                      ]
                    : []),
                ]}
                moduleKey="procedure"
                canExport={canExport}
                canDelete={canDelete}
                onExport={
                  canExport
                    ? (items) => {
                        setSelectedProceduresForExport(items.length < procedures.length ? items : []);
                        setIsGlobalExportModalOpen(true);
                      }
                    : undefined
                }
              />
            </div>
          )}

          {/* TAB 3: DEPARTMENT PROCESSES (GRID VIEW OF 6 FACTORY DIVISIONS) */}
          {viewMode === 'departments' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Garment Manufacturing Department Process Flow (Clause 3.0)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cross-department conforming control gates and operational inspection steps
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const flagship = procedures[0] || INITIAL_CONFORMING_PROCESS_CONTROL;
                    setSubView({ type: 'details', procedure: flagship });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Conforming Control SOP</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { code: '3.1', name: 'Marketing, Merchandizing & Commercial', steps: '4 Clauses', forms: 'DOC-QM-01, DOC-SOP-SEW-04', role: 'Commercial Merchandiser' },
                  { code: '3.2', name: 'Sample Development', steps: '2 Clauses', forms: 'Sample Approval Signoff', role: 'Sample Room Manager' },
                  { code: '3.3', name: 'Store & Raw Materials', steps: '4 Clauses', forms: 'DOC-QC-1005 (4-Point Inspection)', role: 'Warehouse In-Charge' },
                  { code: '3.4', name: 'Cutting Department', steps: '3 Clauses', forms: 'Relaxation & Spreading Reports', role: 'CAD & Cutting Head' },
                  { code: '3.5', name: 'Sewing Assembly Lines', steps: '2 Clauses', forms: 'DOC-QC-1017 (AQL 2.5 Inline/Endline)', role: 'Sewing Production GPQ' },
                  { code: '3.6', name: 'Finishing & Packing', steps: '4 Clauses', forms: 'Pull Test, 100% Metal Detection', role: 'Finishing Manager & GPQ' },
                ].map((d) => (
                  <div key={d.code} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800">
                        {d.code}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-500">{d.steps}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{d.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">In-Charge: {d.role}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-500 block text-[10px] uppercase">Associated Forms:</span>
                      <span className="font-mono text-blue-700">{d.forms}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <DeleteProcedureModal
          isOpen={deleteModal.isOpen}
          procedures={deleteModal.procedures}
          onConfirm={confirmDeleteProcedures}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* Global & Batch Procedure Register Export Modal */}
      <ProcedureExportModal
        isOpen={isGlobalExportModalOpen}
        onClose={() => {
          setIsGlobalExportModalOpen(false);
          setSelectedProceduresForExport([]);
        }}
        allProcedures={procedures}
        selectedProcedures={selectedProceduresForExport}
      />

      {/* Individual Procedure Dossier Export Modal */}
      <ProcedureSingleExportModal
        isOpen={isSingleExportModalOpen}
        onClose={() => {
          setIsSingleExportModalOpen(false);
          setProcedureForSingleExport(null);
        }}
        procedure={procedureForSingleExport}
      />
    </div>
  );
}
