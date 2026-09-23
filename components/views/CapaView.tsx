'use client';

import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Eye,
  Edit,
  Trash2,
  PieChart,
  BarChart3,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Check,
  Calendar,
  Layers,
  Sparkles,
  LayoutDashboard,
  Table2,
  AlertTriangle,
  Building2,
  User,
  ArrowRight,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { CapaItem, CapaSource, CapaStatus } from '@/lib/types/modules';
import { MOCK_CAPA } from '@/lib/db/modules-mock-data';

// Subcomponents
import { CapaDetailsPage } from '../modules/capa/CapaDetailsPage';
import { CapaEntryPage } from '../modules/capa/CapaEntryPage';
import { DeleteCapaModal } from '../modules/capa/DeleteCapaModal';

type CapaSubView =
  | { type: 'none' }
  | { type: 'details'; capa: CapaItem }
  | { type: 'add' }
  | { type: 'edit'; capa: CapaItem };

export function CapaView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [capas, setCapas] = useState<CapaItem[]>(MOCK_CAPA);

  // Dedicated Separate Pages (Details, Add, Edit)
  const [subView, setSubView] = useState<CapaSubView>({ type: 'none' });

  // Sync subview details if record updates
  React.useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = capas.find((c) => c.id === subView.capa.id);
      if (refreshed && refreshed !== subView.capa) {
        setSubView({ type: 'details', capa: refreshed });
      }
    }
  }, [capas]);

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    capas: CapaItem[];
  } | null>(null);

  // Filters & Search
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalCount = capas.length;
  const closedCount = capas.filter((c) => c.status === 'CLOSED').length;
  const inProgressCount = capas.filter((c) => c.status === 'IN_PROGRESS').length;
  const pendingCount = capas.filter((c) => c.status === 'OPEN' || c.status === 'VERIFICATION_PENDING').length;
  const criticalCount = capas.filter((c) => c.severity === 'CRITICAL').length;
  const closedRate = Math.round((closedCount / (totalCount || 1)) * 100);

  // Filtered Records
  const filteredCapas = capas.filter((c) => {
    const matchesSource = activeSourceFilter === 'ALL' || c.source === activeSourceFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesDept = departmentFilter === 'ALL' || c.department === departmentFilter;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.capaNumber.toLowerCase().includes(query) ||
      c.issueTitle.toLowerCase().includes(query) ||
      (c.department && c.department.toLowerCase().includes(query)) ||
      c.rootCause.toLowerCase().includes(query) ||
      c.responsiblePerson.toLowerCase().includes(query) ||
      (c.sourceReference && c.sourceReference.toLowerCase().includes(query)) ||
      (c.issues &&
        c.issues.some(
          (iss) =>
            iss.issueTitle.toLowerCase().includes(query) ||
            iss.correctiveAction.toLowerCase().includes(query) ||
            iss.preventiveAction.toLowerCase().includes(query) ||
            (iss.category && iss.category.toLowerCase().includes(query))
        ));

    return matchesSource && matchesStatus && matchesDept && matchesSearch;
  });

  // Save / Update Handler
  const handleSaveCapa = (savedCapa: CapaItem) => {
    setCapas((prev) => {
      const exists = prev.some((c) => c.id === savedCapa.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCapa.id ? savedCapa : c));
      }
      return [savedCapa, ...prev];
    });

    if (subView.type === 'edit') {
      setSubView({ type: 'details', capa: savedCapa });
      showToast(`Updated CAPA plan ${savedCapa.capaNumber}`);
    } else {
      setSubView({ type: 'none' });
      showToast(`Raised new CAPA plan ${savedCapa.capaNumber}`);
    }
  };

  // Delete Handler
  const handleDeleteCapa = (capaToDelete: CapaItem) => {
    setDeleteModal({
      isOpen: true,
      capas: [capaToDelete],
    });
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    const idsToDelete = new Set(deleteModal.capas.map((c) => c.id));
    setCapas((prev) => prev.filter((c) => !idsToDelete.has(c.id)));
    if (subView.type === 'details' && idsToDelete.has(subView.capa.id)) {
      setSubView({ type: 'none' });
    }
    showToast(
      deleteModal.capas.length === 1
        ? `Deleted CAPA ${deleteModal.capas[0].capaNumber}`
        : `Deleted ${deleteModal.capas.length} CAPA records`
    );
    setDeleteModal(null);
  };

  // Table Columns Matching Audit Module Design
  const columns: ColumnDef<CapaItem>[] = [
    {
      key: 'capaReference',
      header: 'CAPA Reference',
      sortable: true,
      width: '18%',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-md border overflow-hidden shrink-0 flex items-center justify-center ${
              item.severity === 'CRITICAL'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : item.severity === 'MAJOR'
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span
              onClick={() => setSubView({ type: 'details', capa: item })}
              className="font-mono font-bold text-blue-700 text-xs block leading-tight hover:underline cursor-pointer"
            >
              {item.capaNumber}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block leading-tight">
              {item.dateRaised || '2026-09-14'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source & Section',
      sortable: true,
      width: '18%',
      render: (item) => {
        const sourceMap: Record<string, { label: string; color: string }> = {
          INTERNAL_AUDIT: { label: 'INTERNAL AUDIT', color: 'bg-blue-50 text-blue-800 border-blue-200' },
          CUSTOMER_COMPLAINT: { label: 'CUSTOMER CLAIM', color: 'bg-rose-50 text-rose-800 border-rose-200' },
          NCR: { label: 'NCR / REJECT', color: 'bg-amber-50 text-amber-800 border-amber-200' },
          SUPPLIER: { label: 'SUB-SUPPLIER', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
          QUALITY_INSPECTION: { label: 'QC INSPECTION', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
          PROCESS_AUDIT: { label: 'PROCESS AUDIT', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
        };
        const conf = sourceMap[item.source] || { label: item.source.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-700 border-slate-200' };

        return (
          <div className="min-w-0">
            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${conf.color}`}>
              {conf.label}
            </span>
            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
              {item.department || 'General QA'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'issueTitle',
      header: 'Problem Description & Scope',
      sortable: true,
      width: '28%',
      render: (item) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              onClick={() => setSubView({ type: 'details', capa: item })}
              className="font-semibold text-slate-900 text-xs truncate max-w-[260px] block hover:text-blue-700 cursor-pointer"
              title={item.issueTitle}
            >
              {item.issueTitle}
            </span>
            {item.severity === 'CRITICAL' && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase font-mono">
                Critical
              </span>
            )}
            {item.issues && item.issues.length > 1 && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200 uppercase font-mono">
                {item.issues.length} Issues
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[260px] mt-0.5" title={item.rootCause}>
            RCA: {item.rootCause}
          </div>
        </div>
      ),
    },
    {
      key: 'responsiblePerson',
      header: 'Lead & Target Date',
      sortable: true,
      width: '16%',
      render: (item) => (
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 text-xs truncate max-w-[130px]" title={item.responsiblePerson}>
            {item.responsiblePerson}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Target: {item.targetCompletionDate}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: '8D Status',
      sortable: true,
      width: '12%',
      align: 'center',
      render: (item) => {
        const isClosed = item.status === 'CLOSED';
        const isPending = item.status === 'VERIFICATION_PENDING';
        const isInProgress = item.status === 'IN_PROGRESS';

        return (
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${
              isClosed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isPending
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : isInProgress
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {item.status.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '8%',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {/* Details Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', capa: item })}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open CAPA 8D Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', capa: item })}
            className="p-1 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Resolution Plan"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => handleDeleteCapa(item)}
            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete CAPA"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<CapaItem>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({
          isOpen: true,
          capas: selected,
        });
      },
    },
    {
      label: 'Mark as Closed & Verified',
      variant: 'primary',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        const ids = new Set(selected.map((s) => s.id));
        setCapas((prev) =>
          prev.map((c) =>
            ids.has(c.id)
              ? {
                  ...c,
                  status: 'CLOSED',
                  effectivenessVerified: true,
                  actualCompletionDate: new Date().toISOString().split('T')[0],
                }
              : c
          )
        );
        showToast(`Marked ${selected.length} CAPA records as Closed & Verified`);
      },
    },
  ];

  // ─── RENDER SUBVIEWS (SEPARATE DEDICATED PAGES) ──────────────────────────
  if (subView.type === 'details') {
    return (
      <CapaDetailsPage
        capa={subView.capa}
        onBack={() => setSubView({ type: 'none' })}
        onEdit={(capaToEdit) => setSubView({ type: 'edit', capa: capaToEdit })}
        onDelete={(capaToDelete) => {
          handleDeleteCapa(capaToDelete);
        }}
        onUpdateCapa={handleSaveCapa}
        showToast={showToast}
      />
    );
  }

  if (subView.type === 'add' || subView.type === 'edit') {
    return (
      <CapaEntryPage
        initialCapa={subView.type === 'edit' ? subView.capa : null}
        onBack={() => setSubView({ type: 'none' })}
        onSave={handleSaveCapa}
        showToast={showToast}
      />
    );
  }

  // ─── RENDER MAIN VIEW ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Header - Matching Audit Module design without clutter */}
      <ModuleHeader
        id="capa-8d-module"
        title="Corrective & Preventive Actions (CAPA)"
        activeView={viewMode}
        onViewChange={setViewMode}
        customTabs={[
          {
            id: 'summary',
            label: 'Summary',
            icon: LayoutDashboard,
            count: '5 KPIs',
          },
          {
            id: 'list',
            label: 'CAPA Records',
            icon: Table2,
            count: `${capas.length}`,
          },
          {
            id: 'matrix',
            label: '8D & RCA Matrix',
            icon: GitPullRequest,
            count: `${pendingCount} Active`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setSubView({ type: 'add' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise New CAPA</span>
          </button>
        }
      />

      {/* ─── VIEW 1: SUMMARY (KPI STAT CARDS & ANALYTICS) ───────────────────── */}
      {viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total CAPA Files"
              value={totalCount}
              subtitle="8D Methodology Records"
              icon={<GitPullRequest className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Closed & Verified"
              value={`${closedCount} / ${totalCount}`}
              subtitle={`${closedRate}% Resolution Rate`}
              delta={{ value: `${closedRate}%`, isPositive: true, label: 'effectiveness' }}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Under Execution"
              value={inProgressCount}
              subtitle="D5-D6 Actions Deployed"
              icon={<Clock className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Critical Severity"
              value={criticalCount}
              subtitle="Zero-Defect Priority"
              delta={{ value: `${criticalCount}`, isPositive: criticalCount === 0, label: 'high priority' }}
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
            />
            <StatCard
              title="Resolution SLA"
              value="14 Days"
              subtitle="Average Closing Lead Time"
              icon={<Calendar className="w-5 h-5 text-purple-600" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Breakdown Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    CAPA Resolution Funnel
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">8D Stages</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Closed (D8 Done)</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{closedCount}</div>
                  <span className="text-[10px] text-slate-500">Zero recurrence confirmed</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="text-[11px] text-blue-700 font-semibold block">In Progress (D5-D6)</span>
                  <div className="text-lg font-bold font-mono text-blue-900 mt-1">{inProgressCount}</div>
                  <span className="text-[10px] text-slate-500">Active counter-measures</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block">Pending Review</span>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-1">{pendingCount}</div>
                  <span className="text-[10px] text-slate-500">Awaiting sign-off audit</span>
                </div>
              </div>
            </div>

            {/* Source Origin Breakdown Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    CAPA Sources & Triggers
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Root Triggers</span>
              </div>
              <div className="space-y-2 text-xs">
                {Array.from(new Set(capas.map((c) => c.source))).map((src) => {
                  const count = capas.filter((c) => c.source === src).length;
                  const pct = Math.round((count / (totalCount || 1)) * 100);
                  return (
                    <div key={src} className="space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span className="font-semibold text-slate-800">{src.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-slate-500">{count} cases ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open CAPA Action Registry"
            recordCount={filteredCapas.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      )}

      {/* ─── VIEW 2: CAPA RECORDS REGISTRY TABLE ───────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Source Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: 'All Triggers', value: 'ALL' },
                  { label: 'Internal Audit', value: 'INTERNAL_AUDIT' },
                  { label: 'Customer Claim', value: 'CUSTOMER_COMPLAINT' },
                  { label: 'NCR / Rejection', value: 'NCR' },
                  { label: 'Sub-Supplier', value: 'SUPPLIER' },
                  { label: 'Quality Inspection', value: 'QUALITY_INSPECTION' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveSourceFilter(tab.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activeSourceFilter === tab.value
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status and Department Dropdown */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="VERIFICATION_PENDING">Verification Pending</option>
                  <option value="CLOSED">Closed & Verified</option>
                </select>

                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Cutting">Cutting</option>
                  <option value="Sewing Line 04">Sewing Line 04</option>
                  <option value="Sewing Line 08">Sewing Line 08</option>
                  <option value="Warehouse & Storage">Warehouse & Storage</option>
                  <option value="Quality Inspection & Testing Lab">Testing Lab</option>
                </select>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CAPA reference, issue description, department, root cause, or responsible lead..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* DataTable */}
          <DataTable<CapaItem>
            id="capa-registry-table"
            title="Corrective & Preventive Action (CAPA) Master Registry"
            subtitle="ISO 9001:2015 Clause 10.2 compliant resolution workflows with 8D root cause verification"
            data={filteredCapas}
            columns={columns}
            batchActions={batchActions}
          />
        </div>
      )}

      {/* ─── VIEW 3: 8D & RCA MATRIX VIEW ──────────────────────────────────── */}
      {viewMode === 'matrix' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">8D Problem Solving & Root Cause Matrix</h3>
                <p className="text-xs text-slate-500">Live view of containment, 5-Whys analysis, and preventive standardizations</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                {capas.length} Active Records
              </span>
            </div>

            <div className="space-y-4">
              {capas.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 text-xs">{item.capaNumber}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-900">{item.issueTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSubView({ type: 'details', capa: item })}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>View 8D</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-amber-700 block mb-0.5">D3: Containment</span>
                      <p className="text-slate-700 line-clamp-2">{item.containmentAction}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-blue-700 block mb-0.5">D4: Root Cause (RCA)</span>
                      <p className="text-slate-700 line-clamp-2">{item.rootCause}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-0.5">D7: Preventive SOP</span>
                      <p className="text-slate-700 line-clamp-2">{item.preventiveAction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteCapaModal
          isOpen={deleteModal.isOpen}
          capas={deleteModal.capas}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
