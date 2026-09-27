'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Files,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  PieChart,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  Check,
  Layers,
  LayoutDashboard,
  Table2,
  Sparkles,
  AlertTriangle,
  Building2,
  ClipboardList,
  Filter,
  Lock,
  Search,
  Award,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { ControlledDocument } from '@/lib/types/modules';
import { MOCK_CONTROLLED_DOCS } from '@/lib/db/modules-mock-data';

// Subcomponents matching Certificate module architecture
import { DocumentControlDetailsPage } from '../modules/document-control/DocumentControlDetailsPage';
import { DocumentControlEntryPage } from '../modules/document-control/DocumentControlEntryPage';
import { DeleteDocumentModal } from '../modules/document-control/DeleteDocumentModal';

type DocumentSubView =
  | { type: 'none' }
  | { type: 'details'; doc: ControlledDocument }
  | { type: 'add' }
  | { type: 'edit'; doc: ControlledDocument };

export function DocumentControlView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  // Load from localStorage or fallback to enriched MOCK_CONTROLLED_DOCS
  const [docs, setDocs] = useState<ControlledDocument[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('erp_controlled_documents_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed parsing stored controlled documents:', err);
      }
    }
    return MOCK_CONTROLLED_DOCS;
  });

  // Save to localStorage whenever docs change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('erp_controlled_documents_v1', JSON.stringify(docs));
      } catch (err) {
        console.warn('Failed saving controlled documents to localStorage:', err);
      }
    }
  }, [docs]);

  // Subview State (Details, Add, Edit)
  const [subView, setSubView] = useState<DocumentSubView>({ type: 'none' });

  // Sync subview details if docs update
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = docs.find((d) => d.id === subView.doc.id);
      if (refreshed && refreshed !== subView.doc) {
        setSubView({ type: 'details', doc: refreshed });
      }
    }
  }, [docs, subView]);

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    documents: ControlledDocument[];
  } | null>(null);

  const handleDownloadDoc = (doc: ControlledDocument) => {
    const firstAttachment = doc.attachments && doc.attachments.length > 0 ? doc.attachments[0] : null;
    const fileName = firstAttachment?.name || `${doc.docNumber}_${doc.version.replace(/\s+/g, '_')}_Controlled.pdf`;

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

      const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n5 0 obj\n<< /Length 300 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(${doc.docNumber}: ${doc.title}) Tj\n/F1 12 Tf\n0 -30 Td\n(Revision: ${doc.version} | Effective: ${doc.effectiveDate}) Tj\n0 -20 Td\n(Department: ${doc.department} | Category: ${doc.category}) Tj\n0 -20 Td\n(Approved By: ${doc.approvedBy}) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000242 00000 n \n0000000324 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n680\n%%EOF`;
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

  // Filters & Search
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalCount = docs.length;
  const activeCount = docs.filter((d) => d.status === 'APPROVED_ACTIVE').length;
  const underRevisionCount = docs.filter((d) => d.status === 'UNDER_REVISION').length;
  const obsoleteCount = docs.filter((d) => d.status === 'OBSOLETE').length;

  const reviewDueCount = useMemo(() => {
    return docs.filter((d) => {
      if (d.status === 'OBSOLETE') return false;
      const days = d.daysRemaining ?? 180;
      return days <= 60;
    }).length;
  }, [docs]);

  const policiesCount = docs.filter((d) => d.category === 'POLICY').length;
  const sopsCount = docs.filter((d) => d.category === 'SOP').length;
  const workInstructionsCount = docs.filter((d) => d.category === 'WORK_INSTRUCTION').length;
  const formsSpecsCount = docs.filter(
    (d) => d.category === 'FORM_TEMPLATE' || d.category === 'SPECIFICATION'
  ).length;

  // CRUD Handlers
  const handleSaveDoc = (docToSave: ControlledDocument) => {
    const exists = docs.some((d) => d.id === docToSave.id);
    if (exists) {
      setDocs((prev) => prev.map((d) => (d.id === docToSave.id ? docToSave : d)));
    } else {
      setDocs((prev) => [docToSave, ...prev]);
    }
    setSubView({ type: 'details', doc: docToSave });
  };

  const handleDeleteDoc = (docToDelete: ControlledDocument) => {
    setDeleteModal({
      isOpen: true,
      documents: [docToDelete],
    });
  };

  const confirmDelete = () => {
    if (!deleteModal || deleteModal.documents.length === 0) return;
    const idsToDelete = new Set(deleteModal.documents.map((d) => d.id));
    setDocs((prev) => prev.filter((d) => !idsToDelete.has(d.id)));

    if (subView.type === 'details' && idsToDelete.has(subView.doc.id)) {
      setSubView({ type: 'none' });
    } else if (subView.type === 'edit' && idsToDelete.has(subView.doc.id)) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.documents.length;
    showToast(
      count === 1
        ? `Deleted document ${deleteModal.documents[0].docNumber}`
        : `Deleted ${count} documents from register`
    );
    setDeleteModal(null);
  };

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      let matchesCategory = true;
      if (activeCategoryFilter === 'APPROVED_ACTIVE') matchesCategory = d.status === 'APPROVED_ACTIVE';
      else if (activeCategoryFilter === 'UNDER_REVISION') matchesCategory = d.status === 'UNDER_REVISION';
      else if (activeCategoryFilter === 'OBSOLETE') matchesCategory = d.status === 'OBSOLETE';
      else if (activeCategoryFilter === 'POLICY') matchesCategory = d.category === 'POLICY';
      else if (activeCategoryFilter === 'SOP') matchesCategory = d.category === 'SOP';
      else if (activeCategoryFilter === 'WORK_INSTRUCTION') matchesCategory = d.category === 'WORK_INSTRUCTION';
      else if (activeCategoryFilter === 'FORMS_SPECS') {
        matchesCategory = d.category === 'FORM_TEMPLATE' || d.category === 'SPECIFICATION';
      }

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.docNumber.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.version.toLowerCase().includes(q) ||
        d.approvedBy.toLowerCase().includes(q) ||
        (d.scope && d.scope.toLowerCase().includes(q)) ||
        (d.purpose && d.purpose.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [docs, activeCategoryFilter, searchQuery]);

  // Table Columns Matching Certificate Module Design with all Rev Nos & Dates
  const columns: ColumnDef<ControlledDocument>[] = [
    {
      key: 'docReference',
      header: 'Document ID',
      sortable: true,
      width: '18%',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center text-blue-600">
            {item.category === 'POLICY' ? (
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            ) : item.category === 'SOP' ? (
              <FileText className="w-4 h-4 text-blue-600" />
            ) : item.category === 'WORK_INSTRUCTION' ? (
              <ClipboardList className="w-4 h-4 text-emerald-600" />
            ) : (
              <Layers className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div className="min-w-0">
            <span
              onClick={() => setSubView({ type: 'details', doc: item })}
              className="font-mono font-bold text-blue-700 text-xs block leading-tight hover:underline cursor-pointer"
            >
              {item.docNumber}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block leading-tight truncate max-w-[130px]">
              {item.department}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title & Category',
      sortable: true,
      width: '26%',
      render: (item) => (
        <div className="min-w-0">
          <div
            onClick={() => setSubView({ type: 'details', doc: item })}
            className="font-semibold text-slate-900 text-xs truncate max-w-[240px] hover:text-blue-600 cursor-pointer"
            title={item.title}
          >
            {item.title}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60 truncate">
              {item.category.replace(/_/g, ' ')}
            </span>
            {item.scope && (
              <span className="text-[10px] text-slate-400 truncate max-w-[150px]" title={item.scope}>
                {item.scope}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'revisions',
      header: 'All Revisions & Dates',
      sortable: false,
      width: '24%',
      render: (item) => {
        const revList =
          item.changeLog && item.changeLog.length > 0
            ? item.changeLog
            : [
                {
                  id: 'rev-init',
                  version: item.version,
                  releaseDate: item.effectiveDate,
                  changeDescription: 'Initial issue',
                  reasonForChange: 'Master release',
                },
              ];
        return (
          <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
            {revList.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-1 text-[11px] font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80"
                title={r.changeDescription || r.reasonForChange}
              >
                <span className="font-bold text-blue-700">{r.version}</span>
                <span className="text-[10px] text-slate-500 font-semibold">{r.releaseDate}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'approvals',
      header: 'Signatory & Next Review',
      sortable: true,
      width: '15%',
      render: (item) => {
        const days = item.daysRemaining ?? 180;
        return (
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-800 block truncate max-w-[140px]" title={item.approvedBy}>
              {item.approvedBy}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-[10px] font-mono font-semibold ${
                  days <= 30
                    ? 'text-rose-600'
                    : days <= 60
                    ? 'text-amber-600'
                    : 'text-slate-500'
                }`}
              >
                Due: {item.nextReviewDate}
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
        const isActive = item.status === 'APPROVED_ACTIVE';
        const isRevision = item.status === 'UNDER_REVISION';

        return (
          <div className="text-center">
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : isRevision
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {item.status === 'APPROVED_ACTIVE' ? 'ACTIVE' : item.status.replace(/_/g, ' ')}
            </span>
          </div>
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
          {/* Details Button (Eye) - Exactly styled like Certificate Module */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', doc: item })}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button (Pencil) - Exactly styled like Certificate Module */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', doc: item })}
            className="p-1 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Controlled Document"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Direct Download Button */}
          <button
            type="button"
            onClick={() => handleDownloadDoc(item)}
            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
            title="Download Document File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button (Trash) - Exactly styled like Certificate Module */}
          <button
            type="button"
            onClick={() => handleDeleteDoc(item)}
            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Controlled Document"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions matching Certificate module
  const batchActions: BatchAction<ControlledDocument>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({
          isOpen: true,
          documents: selected,
        });
      },
    },
  ];

  // ─── RENDER SUBVIEWS (SEPARATE PAGES) ────────────────────────────────────
  if (subView.type === 'details') {
    return (
      <DocumentControlDetailsPage
        doc={subView.doc}
        onBack={() => setSubView({ type: 'none' })}
        onEdit={(docToEdit) => setSubView({ type: 'edit', doc: docToEdit })}
        onDelete={(docToDelete) => handleDeleteDoc(docToDelete)}
        onUpdateDoc={handleSaveDoc}
        showToast={showToast}
      />
    );
  }

  if (subView.type === 'add' || subView.type === 'edit') {
    return (
      <DocumentControlEntryPage
        initialDoc={subView.type === 'edit' ? subView.doc : null}
        onBack={() => setSubView({ type: 'none' })}
        onSave={handleSaveDoc}
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

      {/* Module Header - styled identically to Certificate Module with clean tabs and blue action button */}
      <ModuleHeader
        id="document-control-module"
        title="Master Document Register (MDR) & Version Control"
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
            label: 'Master Document Register',
            icon: Table2,
            count: `${docs.length}`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setSubView({ type: 'add' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Controlled Document</span>
          </button>
        }
      />

      {/* ─── VIEW 1: SUMMARY (KPI STAT CARDS) ──────────────────────────────── */}
      {viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Controlled Documents"
              value={totalCount}
              subtitle="Master Document Register"
              icon={<Files className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Active In Effect"
              value={`${activeCount} / ${totalCount}`}
              subtitle="Authorized on Factory Floor"
              delta={{ value: '100%', isPositive: true, label: 'validity target' }}
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Review Due Soon"
              value={reviewDueCount}
              subtitle="Within 60 Days Notice"
              delta={{ value: `${reviewDueCount} alerts`, isPositive: reviewDueCount === 0, label: 'action' }}
              icon={<Clock className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Under Revision"
              value={underRevisionCount}
              subtitle="Draft Approval Pending"
              delta={{ value: `${underRevisionCount}`, isPositive: underRevisionCount === 0, label: 'status' }}
              icon={<AlertTriangle className="w-5 h-5 text-purple-600" />}
            />
            <StatCard
              title="ISO 9001 Compliance"
              value="Clause 7.5"
              subtitle="Documented Information"
              delta={{ value: '100% audit ready', isPositive: true }}
              icon={<CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Lifecycle &amp; Approval Status
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">ISO 9001</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Active Approved</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{activeCount}</div>
                  <span className="text-[10px] text-slate-500">Authorized in floor</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block">Under Revision</span>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-1">{underRevisionCount}</div>
                  <span className="text-[10px] text-slate-500">Pending sign-off</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] text-rose-700 font-semibold block">Obsolete</span>
                  <div className="text-lg font-bold font-mono text-rose-900 mt-1">{obsoleteCount}</div>
                  <span className="text-[10px] text-slate-500">Archived history</span>
                </div>
              </div>
            </div>

            {/* Document Categories */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Master Category Breakdown
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Hierarchy</span>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { cat: 'POLICY', label: 'Quality Policies & Manuals (Tier 1)', count: policiesCount },
                  { cat: 'SOP', label: 'Standard Operating Procedures (Tier 2)', count: sopsCount },
                  { cat: 'WORK_INSTRUCTION', label: 'Work Instructions (WI - Tier 3)', count: workInstructionsCount },
                  { cat: 'FORMS_SPECS', label: 'Forms, Templates & Specifications (Tier 4)', count: formsSpecsCount },
                ].map((item) => (
                  <div
                    key={item.cat}
                    onClick={() => {
                      setActiveCategoryFilter(item.cat);
                      setViewMode('list');
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800 text-xs hover:text-blue-600">
                      {item.label}
                    </span>
                    <span className="font-mono font-bold text-slate-700 text-xs bg-slate-200/60 px-2 py-0.5 rounded-full">
                      {item.count} docs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete Master Document Register (MDR) Table"
            recordCount={filteredDocs.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      )}

      {/* ─── VIEW 2: MASTER DOCUMENT REGISTER (TABLE VIEW) ──────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Pill Tabs matching Certificate Module design */}
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
                <span>All Documents</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-slate-800">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('APPROVED_ACTIVE')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'APPROVED_ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50/50'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active Approved</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('UNDER_REVISION')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'UNDER_REVISION'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Under Revision</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                  {underRevisionCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('OBSOLETE')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'OBSOLETE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50/50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Obsolete</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                  {obsoleteCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('POLICY')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'POLICY'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-purple-50/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Policies</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800">
                  {policiesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('SOP')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'SOP'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>SOPs</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                  {sopsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('WORK_INSTRUCTION')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'WORK_INSTRUCTION'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50/50'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Work Instructions</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                  {workInstructionsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('FORMS_SPECS')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'FORMS_SPECS'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-cyan-50/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Forms &amp; Specs</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800">
                  {formsSpecsCount}
                </span>
              </button>
            </div>

            {/* Search Bar matching Certificate module */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search document #, title, dept, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-52 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* DataTable matching Certificate module */}
          <DataTable<ControlledDocument>
            id="document-control-table"
            data={filteredDocs}
            columns={columns}
            batchActions={batchActions}
          />
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {deleteModal && (
        <DeleteDocumentModal
          isOpen={deleteModal.isOpen}
          documents={deleteModal.documents}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
