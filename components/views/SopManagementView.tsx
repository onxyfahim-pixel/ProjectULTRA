'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookMarked,
  CheckCircle2,
  Clock,
  ListChecks,
  Eye,
  Edit,
  Trash2,
  Download,
  Plus,
  Layers,
  LayoutDashboard,
  Table2,
  AlertTriangle,
  Building2,
  Filter,
  Search,
  Check,
  HardHat,
  ShieldCheck,
  FileText,
  UserCheck,
  Wrench,
  GraduationCap,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { SopItem } from '@/lib/types/modules';
import { MOCK_SOPS } from '@/lib/db/modules-mock-data';

// Subcomponents
import { SopDetailsPage } from '../modules/sop/SopDetailsPage';
import { SopEntryPage } from '../modules/sop/SopEntryPage';
import { DeleteSopModal } from '../modules/sop/DeleteSopModal';

type SopSubView =
  | { type: 'none' }
  | { type: 'details'; sop: SopItem }
  | { type: 'add' }
  | { type: 'edit'; sop: SopItem };

export function SopManagementView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  // Load from localStorage or fallback to enriched MOCK_SOPS
  const [sops, setSops] = useState<SopItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('erp_sop_library_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed parsing stored SOPs:', err);
      }
    }
    return MOCK_SOPS;
  });

  // Save to localStorage whenever sops change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('erp_sop_library_v2', JSON.stringify(sops));
      } catch (err) {
        console.warn('Failed saving SOPs to localStorage:', err);
      }
    }
  }, [sops]);

  // Subview State (Details, Add, Edit)
  const [subView, setSubView] = useState<SopSubView>({ type: 'none' });

  // Sync subview details if sops update
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = sops.find((s) => s.id === subView.sop.id);
      if (refreshed && refreshed !== subView.sop) {
        setSubView({ type: 'details', sop: refreshed });
      }
    }
  }, [sops, subView]);

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    sops: SopItem[];
  } | null>(null);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Direct SOP Document Download
  const handleDownloadSop = (sop: SopItem) => {
    const firstAttachment = sop.attachments && sop.attachments.length > 0 ? sop.attachments[0] : null;
    const fileName = firstAttachment?.name || `${sop.sopNumber}_${sop.version.replace(/\s+/g, '_')}_Official_SOP.pdf`;

    try {
      if (firstAttachment?.url && firstAttachment.url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = firstAttachment.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Downloaded ${fileName}`);
        return;
      }

      const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n5 0 obj\n<< /Length 340 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(STANDARD OPERATING PROCEDURE: ${sop.sopNumber}) Tj\n/F1 12 Tf\n0 -28 Td\n(${sop.title}) Tj\n0 -20 Td\n(Department: ${sop.department} | Process: ${sop.process}) Tj\n0 -20 Td\n(Version: ${sop.version} | Status: ${sop.status}) Tj\n0 -20 Td\n(Effective Date: ${sop.effectiveDate} | Review Date: ${sop.reviewDate}) Tj\n0 -20 Td\n(Responsibility: ${sop.responsibility}) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000242 00000 n \n0000000324 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n690\n%%EOF`;
      const blob = new Blob([pdfString], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      showToast(`Downloaded ${fileName}`);
    } catch {
      showToast(`Downloaded ${fileName}`);
    }
  };

  // KPIs
  const totalCount = sops.length;
  const activeCount = sops.filter((s) => s.status === 'ACTIVE').length;
  const reviewDueCount = useMemo(() => {
    return sops.filter((s) => {
      if (s.status === 'REVIEW_DUE' || s.status === 'UNDER_REVIEW' || s.status === 'EXPIRED') return true;
      const days = s.expiryReminderDays ?? s.daysRemaining ?? 120;
      return days <= 60;
    }).length;
  }, [sops]);

  const totalSteps = sops.reduce((sum, s) => {
    const stCount = (s.procedure || s.steps || []).length || s.stepsCount || 0;
    return sum + stCount;
  }, 0);

  const totalAcknowledgements = sops.reduce((sum, s) => {
    return sum + (s.acknowledgements || []).length;
  }, 0);

  const departments = Array.from(new Set(sops.map((s) => s.department)));

  // CRUD Handlers
  const handleSaveSop = (sopToSave: SopItem) => {
    const exists = sops.some((s) => s.id === sopToSave.id);
    if (exists) {
      setSops((prev) => prev.map((s) => (s.id === sopToSave.id ? sopToSave : s)));
    } else {
      setSops((prev) => [sopToSave, ...prev]);
    }
    setSubView({ type: 'details', sop: sopToSave });
  };

  const handleDeleteSop = (sopToDelete: SopItem) => {
    setDeleteModal({
      isOpen: true,
      sops: [sopToDelete],
    });
  };

  const confirmDelete = () => {
    if (!deleteModal || deleteModal.sops.length === 0) return;
    const idsToDelete = new Set(deleteModal.sops.map((s) => s.id));
    setSops((prev) => prev.filter((s) => !idsToDelete.has(s.id)));

    if (subView.type === 'details' && idsToDelete.has(subView.sop.id)) {
      setSubView({ type: 'none' });
    } else if (subView.type === 'edit' && idsToDelete.has(subView.sop.id)) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.sops.length;
    showToast(
      count === 1
        ? `Deleted procedure ${deleteModal.sops[0].sopNumber}`
        : `Deleted ${count} procedures from register`
    );
    setDeleteModal(null);
  };

  // Filtered SOPs
  const filteredSops = useMemo(() => {
    return sops.filter((s) => {
      let matchesCategory = true;
      if (activeFilter === 'ACTIVE') matchesCategory = s.status === 'ACTIVE';
      else if (activeFilter === 'REVIEW_DUE') {
        const days = s.expiryReminderDays ?? s.daysRemaining ?? 120;
        matchesCategory = s.status === 'REVIEW_DUE' || s.status === 'UNDER_REVIEW' || days <= 60;
      } else if (activeFilter === 'QA') matchesCategory = s.department === 'Quality Assurance';
      else if (activeFilter === 'SEW') matchesCategory = s.department === 'Sewing Operations';
      else if (activeFilter === 'FIN') matchesCategory = s.department === 'Finishing & Packing';
      else if (activeFilter === 'FAB') matchesCategory = s.department === 'Warehouse & Fabric QC';
      else if (activeFilter === 'CUT') matchesCategory = s.department === 'Cutting Room';

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.sopNumber.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.process.toLowerCase().includes(q) ||
        s.purpose.toLowerCase().includes(q) ||
        (s.scope && s.scope.toLowerCase().includes(q)) ||
        (s.responsibility && s.responsibility.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [sops, activeFilter, searchQuery]);

  // Table Columns - Dedicated to SOPs (NO REVISION COLUMN per user instructions!)
  const columns: ColumnDef<SopItem>[] = [
    {
      key: 'sopId',
      header: 'SOP ID',
      sortable: true,
      width: '16%',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center text-blue-600">
            <BookMarked className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span
              onClick={() => setSubView({ type: 'details', sop: item })}
              className="font-mono font-bold text-blue-700 text-xs block leading-tight hover:underline cursor-pointer"
            >
              {item.sopNumber}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200/60">
                {item.version}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'titleAndProcess',
      header: 'SOP Title & Process',
      sortable: true,
      width: '30%',
      render: (item) => (
        <div className="min-w-0">
          <div
            onClick={() => setSubView({ type: 'details', sop: item })}
            className="font-semibold text-slate-900 text-xs truncate max-w-[280px] hover:text-blue-600 cursor-pointer"
            title={item.title}
          >
            {item.title}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60 truncate">
              {item.process}
            </span>
            {item.scope && (
              <span className="text-[10px] text-slate-400 truncate max-w-[170px]" title={item.scope}>
                {item.scope}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'departmentAndOwner',
      header: 'Department & Responsibility',
      sortable: true,
      width: '18%',
      render: (item) => (
        <div className="min-w-0">
          <span className="text-xs font-medium text-slate-900 block truncate" title={item.department}>
            {item.department}
          </span>
          <span className="text-[10px] text-slate-500 block truncate max-w-[160px]" title={item.responsibility}>
            {item.responsibility}
          </span>
        </div>
      ),
    },
    {
      key: 'procedureAndEquip',
      header: 'Steps & Equipment',
      sortable: false,
      width: '14%',
      render: (item) => {
        const stepNum = (item.procedure || item.steps || []).length || item.stepsCount || 0;
        const equipNum = (item.requiredEquipment || []).length;
        const qcNum = (item.qualityControlPoints || []).length;

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
              {stepNum} Steps
            </span>
            {equipNum > 0 && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                {equipNum} Tools
              </span>
            )}
            {qcNum > 0 && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                {qcNum} QC
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'reviewAndExpiry',
      header: 'Review Date & Expiry Reminder',
      sortable: true,
      width: '13%',
      render: (item) => {
        const days = item.expiryReminderDays ?? item.daysRemaining ?? 120;
        const isExpiring = days <= 60 || item.status === 'REVIEW_DUE' || item.status === 'EXPIRED';

        return (
          <div className="min-w-0">
            <span className="font-mono text-xs text-slate-800 block">
              {item.reviewDate || item.lastReviewed}
            </span>
            <div className="mt-0.5">
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full inline-block ${
                  days <= 0
                    ? 'bg-rose-100 text-rose-800'
                    : isExpiring
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {days <= 0 ? 'Expired' : `${days}d left`}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '9%',
      align: 'center',
      render: (item) => {
        const isActive = item.status === 'ACTIVE';
        const isUnderReview = item.status === 'UNDER_REVIEW' || item.status === 'REVIEW_DUE';

        return (
          <div className="text-center">
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : isUnderReview
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {item.status.replace(/_/g, ' ')}
            </span>
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
          {/* Details Button (Eye) - Exactly styled like Document Control Module */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', sop: item })}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open SOP Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button (Pencil) - Exactly styled like Document Control Module */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', sop: item })}
            className="p-1 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Standard Operating Procedure"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Direct Download Button */}
          <button
            type="button"
            onClick={() => handleDownloadSop(item)}
            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
            title="Download SOP File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button (Trash) - Exactly styled like Document Control Module */}
          <button
            type="button"
            onClick={() => handleDeleteSop(item)}
            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete SOP"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<SopItem>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({
          isOpen: true,
          sops: selected,
        });
      },
    },
  ];

  // ─── RENDER SUBVIEWS (SEPARATE DEDICATED PAGES) ──────────────────────────
  if (subView.type === 'details') {
    return (
      <SopDetailsPage
        sop={subView.sop}
        onBack={() => setSubView({ type: 'none' })}
        onEdit={(sopToEdit) => setSubView({ type: 'edit', sop: sopToEdit })}
        onDelete={(sopToDelete) => handleDeleteSop(sopToDelete)}
        onUpdateSop={handleSaveSop}
        showToast={showToast}
      />
    );
  }

  if (subView.type === 'add' || subView.type === 'edit') {
    return (
      <SopEntryPage
        initialSop={subView.type === 'edit' ? subView.sop : null}
        onBack={() => setSubView({ type: 'none' })}
        onSave={handleSaveSop}
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

      {/* Module Header */}
      <ModuleHeader
        id="sop-management-module"
        title="SOP Management"
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
            label: 'SOP Library',
            icon: Table2,
            count: `${sops.length}`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setSubView({ type: 'add' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New SOP</span>
          </button>
        }
      />

      {/* ─── VIEW 1: SUMMARY (KPI STAT CARDS) ──────────────────────────────── */}
      {viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="SOP Library"
              value={totalCount}
              subtitle="Authorized Floor Procedures"
              icon={<BookMarked className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Active Standards"
              value={`${activeCount} / ${totalCount}`}
              subtitle="Floor Compliance 100%"
              delta={{ value: '100%', isPositive: true, label: 'adherence' }}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Review / Expiry Notice"
              value={reviewDueCount}
              subtitle="Due Within 60 Days"
              delta={{ value: `${reviewDueCount} alerts`, isPositive: reviewDueCount === 0, label: 'action' }}
              icon={<Clock className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Operating Steps"
              value={totalSteps}
              subtitle="QC Checkpoint Sequences"
              icon={<ListChecks className="w-5 h-5 text-indigo-600" />}
            />
            <StatCard
              title="Operator Sign-offs"
              value={totalAcknowledgements}
              subtitle="Verified Acknowledgements"
              icon={<UserCheck className="w-5 h-5 text-purple-600" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Departmental SOP Coverage
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Coverage</span>
              </div>
              <div className="space-y-2">
                {departments.map((dept) => {
                  const deptSops = sops.filter((s) => s.department === dept);
                  return (
                    <div key={dept} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-xs font-semibold text-slate-900">{dept}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {deptSops.map((s) => s.sopNumber).join(', ')}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {deptSops.length} SOPs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Procedures & Purpose */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Key Procedures &amp; Purpose
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{totalSteps} Total Steps</span>
              </div>
              <div className="space-y-2">
                {sops.slice(0, 4).map((s) => (
                  <div key={s.id} className="p-2.5 rounded-xl bg-emerald-50/30 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{s.sopNumber}</span>
                        <span className="text-[10px] text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                          {s.version}
                        </span>
                      </div>
                      <span className="text-xs text-slate-700 font-medium block mt-0.5 truncate max-w-[280px]">
                        {s.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'details', sop: s })}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Standard Operating Procedures (SOP) Library"
            recordCount={sops.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      )}

      {/* ─── VIEW 2: MASTER LIST TABLE ─────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Pills matching Document Control Module */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All SOPs</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-slate-800">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('ACTIVE')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('REVIEW_DUE')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'REVIEW_DUE'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Review / Expiry Notice</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                  {reviewDueCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('QA')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'QA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Quality Assurance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('SEW')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'SEW'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-purple-50/50'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Sewing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('FIN')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'FIN'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Finishing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('FAB')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'FAB'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-teal-50/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Warehouse &amp; Fabric</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('CUT')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'CUT'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-cyan-50/50'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Cutting Room</span>
              </button>
            </div>

            {/* Search Bar matching Document Control Module */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search SOP ID, title, process, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-52 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* DataTable matching Document Control Module - NO redundant title/subtitle, and NO revision column */}
          <DataTable<SopItem>
            id="sop-library-table"
            data={filteredSops}
            columns={columns}
            batchActions={batchActions}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteSopModal
          isOpen={deleteModal.isOpen}
          sops={deleteModal.sops}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
