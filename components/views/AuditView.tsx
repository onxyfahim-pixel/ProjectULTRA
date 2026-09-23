'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  Calendar,
  FileText,
  PieChart,
  BarChart3,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building2,
  Users,
  Search,
  Filter,
  Check,
  Download,
  ExternalLink,
  ChevronRight,
  Layers,
  LayoutDashboard,
  Table2,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { QualityAudit, AuditCategory } from '@/lib/types/modules';
import { MOCK_AUDITS } from '@/lib/db/modules-mock-data';

// Subcomponents
import { AuditDetailsPage } from '../modules/audit/AuditDetailsPage';
import { AuditEntryPage } from '../modules/audit/AuditEntryPage';
import { AuditCalendarView } from '../modules/audit/AuditCalendarView';
import { DeleteAuditModal } from '../modules/audit/DeleteAuditModal';

type AuditSubView =
  | { type: 'none' }
  | { type: 'details'; audit: QualityAudit }
  | { type: 'add' }
  | { type: 'edit'; audit: QualityAudit };

export function AuditView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [audits, setAudits] = useState<QualityAudit[]>(MOCK_AUDITS);

  // Dedicated Separate Pages (Details, Add, Edit)
  const [subView, setSubView] = useState<AuditSubView>({ type: 'none' });

  // Sync subview details when audits state updates
  React.useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = audits.find((a) => a.id === subView.audit.id);
      if (refreshed && refreshed !== subView.audit) {
        setSubView({ type: 'details', audit: refreshed });
      }
    }
  }, [audits]);

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    audits: QualityAudit[];
  } | null>(null);

  // Filters & Search
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalCount = audits.length;
  const avgAuditScore = (
    audits.reduce((sum, a) => sum + (a.obtainedMarks ?? a.scorePercentage), 0) / (totalCount || 1)
  ).toFixed(1);

  const passedCount = audits.filter((a) => {
    const hasCritical = (a.criticalNCs ?? 0) > 0;
    if (hasCritical) return false;
    return a.isPassed !== undefined ? a.isPassed : (a.obtainedMarks ?? a.scorePercentage) >= 80;
  }).length;
  const passRate = Math.round((passedCount / (totalCount || 1)) * 100);

  const totalNCs = audits.reduce((sum, a) => sum + a.nonConformancesCount, 0);

  // Category counts
  const internalCount = audits.filter(
    (a) => a.auditCategory === 'INTERNAL' || a.auditType === 'INTERNAL' || a.auditType === 'INTERNAL_QMS'
  ).length;

  const externalCount = audits.filter(
    (a) =>
      a.auditCategory === 'EXTERNAL' ||
      a.auditType === 'EXTERNAL' ||
      a.auditType === 'BUYER_TECHNICAL' ||
      a.auditType === 'SOCIAL_COMPLIANCE' ||
      a.auditType === 'SUSTAINABILITY'
  ).length;

  const subSupplierCount = audits.filter(
    (a) => a.auditCategory === 'SUB_SUPPLIER' || a.auditType === 'SUB_SUPPLIER'
  ).length;

  // Scheduled audits count
  const scheduledCount = audits.filter((a) => a.nextAuditDate).length;

  // CRUD Handlers
  const handleSaveAudit = (auditToSave: QualityAudit) => {
    const exists = audits.some((a) => a.id === auditToSave.id);
    if (exists) {
      setAudits((prev) => prev.map((a) => (a.id === auditToSave.id ? auditToSave : a)));
    } else {
      setAudits((prev) => [auditToSave, ...prev]);
    }
    setSubView({ type: 'details', audit: auditToSave });
  };

  const handleDeleteAudit = (auditToDelete: QualityAudit) => {
    setDeleteModal({
      isOpen: true,
      audits: [auditToDelete],
    });
  };

  const confirmDelete = () => {
    if (!deleteModal || deleteModal.audits.length === 0) return;
    const idsToDelete = new Set(deleteModal.audits.map((a) => a.id));
    setAudits((prev) => prev.filter((a) => !idsToDelete.has(a.id)));

    if (subView.type === 'details' && idsToDelete.has(subView.audit.id)) {
      setSubView({ type: 'none' });
    } else if (subView.type === 'edit' && idsToDelete.has(subView.audit.id)) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.audits.length;
    showToast(
      count === 1
        ? `Deleted audit ${deleteModal.audits[0].auditCode}`
        : `Deleted ${count} audits successfully`
    );
    setDeleteModal(null);
  };

  // Filtered audits
  const filteredAudits = audits.filter((a) => {
    const isInternal =
      a.auditCategory === 'INTERNAL' || a.auditType === 'INTERNAL' || a.auditType === 'INTERNAL_QMS';
    const isSubSupplier =
      a.auditCategory === 'SUB_SUPPLIER' || a.auditType === 'SUB_SUPPLIER';
    const isExternal = !isInternal && !isSubSupplier;

    let matchesCategory = true;
    if (activeCategoryFilter === 'INTERNAL') matchesCategory = isInternal;
    else if (activeCategoryFilter === 'EXTERNAL') matchesCategory = isExternal;
    else if (activeCategoryFilter === 'SUB_SUPPLIER') matchesCategory = isSubSupplier;

    const matchesVerdict = verdictFilter === 'ALL' || a.verdict === verdictFilter;

    const matchesSearch =
      !searchQuery.trim() ||
      a.auditCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.standard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.auditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.supplierName && a.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.auditeeDepartment && a.auditeeDepartment.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesVerdict && matchesSearch;
  });

  // Table Columns Matching Buyer & Order Module Design
  const columns: ColumnDef<QualityAudit>[] = [
    {
      key: 'auditReference',
      header: 'Audit Reference',
      sortable: true,
      width: '18%',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center text-blue-600">
            {item.auditCategory === 'INTERNAL' || item.auditType === 'INTERNAL' ? (
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            ) : item.auditCategory === 'SUB_SUPPLIER' || item.auditType === 'SUB_SUPPLIER' ? (
              <Building2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Award className="w-4 h-4 text-indigo-600" />
            )}
          </div>
          <div className="min-w-0">
            <span
              onClick={() => setSubView({ type: 'details', audit: item })}
              className="font-mono font-bold text-blue-700 text-xs block leading-tight hover:underline cursor-pointer"
            >
              {item.auditCode}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block leading-tight">
              {item.auditDate}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Audit Type',
      sortable: true,
      width: '14%',
      render: (item) => {
        const isInternal =
          item.auditCategory === 'INTERNAL' || item.auditType === 'INTERNAL' || item.auditType === 'INTERNAL_QMS';
        const isSubSupplier =
          item.auditCategory === 'SUB_SUPPLIER' || item.auditType === 'SUB_SUPPLIER';

        return (
          <span
            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border inline-block ${
              isInternal
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : isSubSupplier
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            }`}
          >
            {isInternal ? 'INTERNAL ISO' : isSubSupplier ? 'SUB-SUPPLIER' : 'EXTERNAL'}
          </span>
        );
      },
    },
    {
      key: 'standard',
      header: 'Standard & Scope',
      sortable: true,
      width: '22%',
      render: (item) => (
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 text-xs truncate max-w-[210px]" title={item.standard}>
            {item.standard}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[210px]">
            {item.supplierName || item.auditeeDepartment || 'Factory Wide Operations'}
          </div>
        </div>
      ),
    },
    {
      key: 'auditor',
      header: 'Lead Auditor',
      sortable: true,
      width: '16%',
      render: (item) => (
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 text-xs truncate max-w-[150px]" title={item.auditorName}>
            {item.auditorName}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
            {item.auditorOrganization || 'QA Team'}
          </div>
        </div>
      ),
    },
    {
      key: 'scorePercentage',
      header: 'Score (100 Mark)',
      sortable: true,
      align: 'center',
      width: '12%',
      render: (item) => {
        const scoreVal = item.obtainedMarks ?? item.scorePercentage;
        const hasCritical = (item.criticalNCs ?? 0) > 0;
        const pass = !hasCritical && (item.isPassed !== undefined ? item.isPassed : scoreVal >= 80);
        return (
          <div className="text-center">
            <span
              className={`font-mono font-black text-xs px-2 py-0.5 rounded-md inline-block ${
                hasCritical
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 ring-1 ring-rose-400'
                  : pass
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {scoreVal}%
            </span>
            <div className={`text-[9px] font-bold font-mono mt-0.5 ${
              hasCritical
                ? 'text-rose-700 font-extrabold'
                : pass
                ? 'text-emerald-700'
                : 'text-rose-600'
            }`}>
              {hasCritical ? 'CRITICAL FAIL' : pass ? 'PASS (≥80)' : 'FAIL (<80)'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'nonConformancesCount',
      header: 'NCs',
      sortable: true,
      align: 'center',
      width: '8%',
      render: (item) => {
        const hasCritical = (item.criticalNCs ?? 0) > 0;
        return (
          <div className="text-center">
            <span
              className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                hasCritical
                  ? 'bg-rose-100 text-rose-900 border border-rose-300 ring-1 ring-rose-400'
                  : item.nonConformancesCount === 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : item.nonConformancesCount <= 2
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {item.nonConformancesCount}
            </span>
            {hasCritical && (
              <span className="block text-[8px] font-mono font-bold text-rose-700">
                {item.criticalNCs} Crit
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '10%',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {/* Details Button (Eye) */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', audit: item })}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button (Pencil) */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', audit: item })}
            className="p-1 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Audit"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button (Trash) */}
          <button
            type="button"
            onClick={() => handleDeleteAudit(item)}
            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Audit"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<QualityAudit>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({
          isOpen: true,
          audits: selected,
        });
      },
    },
  ];

  // ─── RENDER SUBVIEWS (SEPARATE PAGES) ────────────────────────────────────
  if (subView.type === 'details') {
    return (
      <AuditDetailsPage
        audit={subView.audit}
        onBack={() => setSubView({ type: 'none' })}
        onEdit={(auditToEdit) => setSubView({ type: 'edit', audit: auditToEdit })}
        onDelete={(auditToDelete) => {
          handleDeleteAudit(auditToDelete);
        }}
        onUpdateAudit={handleSaveAudit}
        showToast={showToast}
      />
    );
  }

  if (subView.type === 'add' || subView.type === 'edit') {
    return (
      <AuditEntryPage
        initialAudit={subView.type === 'edit' ? subView.audit : null}
        onBack={() => setSubView({ type: 'none' })}
        onSave={handleSaveAudit}
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

      {/* Module Header - only Quality & Compliance Audits remains, gap fixed, action inside header */}
      <ModuleHeader
        id="audits-compliance-module"
        title="Quality & Compliance Audits"
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
            label: 'Audit Records',
            icon: Table2,
            count: `${audits.length}`,
          },
          {
            id: 'calendar',
            label: 'Calendar',
            icon: Calendar,
            count: `${scheduledCount}`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setSubView({ type: 'add' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Conduct New Audit</span>
          </button>
        }
      />

      {/* ─── VIEW 1: SUMMARY (KPI STAT CARDS) ──────────────────────────────── */}
      {viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total QMS Audits"
              value={totalCount}
              subtitle="All Audit Categories"
              icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Average Audit Score"
              value={`${avgAuditScore}%`}
              subtitle="100-Mark Scale Target"
              delta={{ value: '+2.4%', isPositive: true, label: 'vs benchmark' }}
              icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
            />
            <StatCard
              title="Pass Rate (≥80 Marks)"
              value={`${passRate}%`}
              subtitle={`${passedCount} of ${totalCount} Passed`}
              delta={{ value: `${passRate}%`, isPositive: true, label: 'standard met' }}
              icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Non-Conformances"
              value={totalNCs}
              subtitle="Total Corrective Actions"
              delta={{ value: '-4', isPositive: true, label: 'resolved' }}
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Next Scheduled Audit"
              value="Oct 12"
              subtitle="Pacific Trims Re-Audit"
              icon={<Calendar className="w-5 h-5 text-purple-600" />}
            />
          </div>

          <SwitchToListBanner
            label="Open Audit Certification Registry"
            recordCount={filteredAudits.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      )}

      {/* ─── VIEW 2: CALENDAR VIEW ─────────────────────────────────────────── */}
      {viewMode === 'calendar' && (
        <AuditCalendarView
          audits={audits}
          onSelectAudit={(a) => setSubView({ type: 'details', audit: a })}
        />
      )}

      {/* ─── VIEW 3: AUDIT RECORDS (TABLE VIEW) ────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 4 Pill Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('ALL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Audits</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-slate-800">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('INTERNAL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'INTERNAL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Internal QMS (ISO 9001)</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                  {internalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('EXTERNAL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'EXTERNAL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50/50'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>External & Buyer</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                  {externalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('SUB_SUPPLIER')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'SUB_SUPPLIER'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Sub-Supplier</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {subSupplierCount}
                </span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search code, standard, auditor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-52 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <DataTable<QualityAudit>
            id="audits-compliance-table"
            title="Quality & Compliance Audits Register"
            data={filteredAudits}
            columns={columns}
            batchActions={batchActions}
          />
        </div>
      )}

      {/* Delete Audit Modal */}
      {deleteModal && (
        <DeleteAuditModal
          isOpen={deleteModal.isOpen}
          audits={deleteModal.audits}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
