'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  BarChart3,
  PieChart,
  XCircle,
  Eye,
  Edit,
  Copy,
  Trash2,
  Layers,
  Search,
  Package,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Sparkles,
  Sliders,
  Check,
  Filter,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { InspectionRecord, InspectionStatus, InspectionStage, InspectionType } from '@/lib/types/erp';
import { BuyerOrder } from '@/lib/types/modules';
import { INITIAL_INSPECTIONS } from '@/lib/db/mock-data';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { InspectionDetailsPage } from '../modules/inspection/InspectionDetailsPage';
import { InspectionEntryPage } from '../modules/inspection/InspectionEntryPage';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';

export interface InspectionsViewProps {
  records?: InspectionRecord[];
  onUpdateRecords?: (records: InspectionRecord[]) => void;
  onOpenNewInspection?: () => void;
  orders?: BuyerOrder[];
}

type InspectionSubView =
  | { type: 'none' }
  | { type: 'details'; record: InspectionRecord }
  | { type: 'add' }
  | { type: 'edit'; record: InspectionRecord };

const STAGE_LABELS: Record<InspectionStage, string> = {
  FABRIC_INWARD: 'Fabric Inward (4-Point)',
  CUTTING_INSPECTION: 'Cutting & Spreading',
  SEWING_IN_LINE: 'Sewing In-Line QC',
  END_LINE_QC: 'End-Line QC Audit',
  FINISHING_PACKING: 'Finishing & Packing',
};

const TYPE_BADGES: Record<InspectionType, { label: string; cls: string; icon: string }> = {
  INLINE: {
    label: 'Inline',
    cls: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: '🧵',
  },
  PRE_FINAL: {
    label: 'Pre-Final',
    cls: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: '📦',
  },
  FINAL: {
    label: 'Final (FRI)',
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: '🏆',
  },
};

const STATUS_CHIP: Record<InspectionStatus, { cls: string; label: string }> = {
  PASSED: { cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200', label: '✓ Passed' },
  CONDITIONAL_PASS: { cls: 'bg-amber-100 text-amber-800 border border-amber-200', label: '~ Conditional' },
  REJECTED: { cls: 'bg-rose-100 text-rose-800 border border-rose-200', label: '✗ Rejected' },
};

function InspectionStatusChip({ status }: { status: InspectionStatus }) {
  const { cls, label } = STATUS_CHIP[status] || STATUS_CHIP.PASSED;
  return <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export function InspectionsView({
  records: propRecords,
  onUpdateRecords,
  onOpenNewInspection,
  orders = [],
}: InspectionsViewProps) {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [records, setRecords] = useState<InspectionRecord[]>(
    propRecords && propRecords.length > 0 ? propRecords : INITIAL_INSPECTIONS
  );
  const { user, permissions } = useErpAuth();

  // Sync prop records
  useEffect(() => {
    if (propRecords && propRecords.length > 0) {
      setRecords(propRecords);
    }
  }, [propRecords]);

  // Dedicated Separate Sub-Pages Routing (matching BuyerOrderView pattern)
  const [subView, setSubView] = useState<InspectionSubView>({ type: 'none' });

  // Keep details page refreshed if record updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = records.find((r) => r.id === subView.record.id);
      if (refreshed && refreshed !== subView.record) {
        setSubView({ type: 'details', record: refreshed });
      }
    }
  }, [records]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    records: InspectionRecord[];
  } | null>(null);

  // Filter States for Inspection List
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [buyerFilter, setBuyerFilter] = useState<string>('ALL');

  // KPIs
  const passedCount = records.filter((r) => r.status === 'PASSED').length;
  const failedCount = records.filter((r) => r.status === 'REJECTED').length;
  const conditionalCount = records.filter((r) => r.status === 'CONDITIONAL_PASS').length;
  const passRate = ((passedCount / (records.length || 1)) * 100).toFixed(1);
  const totalAuditedPcs = records.reduce((sum, r) => sum + r.sampleSize, 0);
  const criticalHolds = records.filter((r) => r.criticalDefects > 0).length;

  const inlineCount = records.filter((r) => (r.inspectionType || 'INLINE') === 'INLINE').length;
  const preFinalCount = records.filter((r) => r.inspectionType === 'PRE_FINAL').length;
  const finalCount = records.filter((r) => r.inspectionType === 'FINAL').length;

  // Handlers for Save, Edit, Duplicate, Delete
  const handleSaveInspection = async (recordData: InspectionRecord) => {
    const existingIndex = records.findIndex((r) => r.id === recordData.id);
    let updatedList: InspectionRecord[];

    if (existingIndex >= 0) {
      updatedList = records.map((r) => (r.id === recordData.id ? recordData : r));
      showToast(`Updated inspection record ${recordData.inspectionCode}`);
      setSubView({ type: 'details', record: recordData });
    } else {
      updatedList = [recordData, ...records];
      showToast(`Logged new ${recordData.inspectionType || ''} inspection ${recordData.inspectionCode}`);
      setSubView({ type: 'none' });
    }

    setRecords(updatedList);
    if (onUpdateRecords) {
      onUpdateRecords(updatedList);
    }

    // Attempt backend persistence
    try {
      if (existingIndex >= 0) {
        await fetch('/api/qms/inspections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData),
        });
      } else {
        await fetch('/api/qms/inspections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData),
        });
      }
    } catch {
      // Offline fallback
    }
  };

  const handleDuplicateInspection = (rec: InspectionRecord) => {
    const duplicated: InspectionRecord = {
      ...rec,
      id: `insp-dup-${Date.now()}`,
      inspectionCode: `QMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...records];
    setRecords(updated);
    if (onUpdateRecords) onUpdateRecords(updated);
    showToast(`Duplicated audit as ${duplicated.inspectionCode}`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal || deleteModal.records.length === 0) return;
    const deleteIds = deleteModal.records.map((r) => r.id);
    const updated = records.filter((r) => !deleteIds.includes(r.id));
    setRecords(updated);
    if (onUpdateRecords) onUpdateRecords(updated);

    const count = deleteModal.records.length;
    showToast(count === 1 ? `Deleted audit ${deleteModal.records[0].inspectionCode}` : `Deleted ${count} inspection audits`);

    if (subView.type === 'details' && deleteModal.records.some((r) => r.id === subView.record.id)) {
      setSubView({ type: 'none' });
    }

    // Backend deletion
    try {
      for (const r of deleteModal.records) {
        await fetch(`/api/qms/inspections?id=${r.id}`, { method: 'DELETE' });
      }
    } catch {
      // ignore
    }

    setDeleteModal(null);
  };

  // Filtered Records
  const filteredRecords = records.filter((r) => {
    const recType = r.inspectionType || 'INLINE';
    const matchesType = typeFilter === 'ALL' || recType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesBuyer = buyerFilter === 'ALL' || r.buyer === buyerFilter;
    return matchesType && matchesStatus && matchesBuyer;
  });

  // Unique Buyers list for dropdown
  const uniqueBuyers = Array.from(new Set(records.map((r) => r.buyer).filter(Boolean)));

  // Batch Actions - Styled identically to Buyer & Order module
  const batchActions: BatchAction<InspectionRecord>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({ isOpen: true, records: selected });
      },
    },
    {
      label: 'Export Selected',
      variant: 'default',
      icon: <Download className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        showToast(`Exported ${selected.length} inspection audit dossiers (PDF/Excel)`);
      },
    },
    {
      label: 'Sign-Off & Approve',
      variant: 'success',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        if (!permissions.canApproveQualityGrade) {
          showToast(`RBAC Alert: Only QA Managers and Admins can sign off audits. Your role: ${user.role}`);
          return;
        }
        showToast(`Signed off QA certificates for ${selected.length} inspection lot(s).`);
      },
    },
  ];

  // Column Definitions - Rich, Interactive, with Actions Styled like Buyer & Order module
  const columns: ColumnDef<InspectionRecord>[] = [
    {
      key: 'inspectionCode',
      header: 'Audit Code',
      accessorKey: 'inspectionCode',
      sortable: true,
      accessor: (r) => r.inspectionCode,
      cell: (r) => (
        <div>
          <span className="font-mono font-bold text-blue-700 text-xs block">{r.inspectionCode}</span>
          {r.orderNumber && (
            <span className="text-[10px] font-mono text-slate-500">PO: {r.orderNumber}</span>
          )}
        </div>
      ),
    },
    {
      key: 'inspectionType',
      header: 'Inspection Type',
      accessorKey: 'inspectionType',
      sortable: true,
      accessor: (r) => r.inspectionType || 'INLINE',
      cell: (r) => {
        const typeKey: InspectionType = r.inspectionType || 'INLINE';
        const badge = TYPE_BADGES[typeKey] || TYPE_BADGES.INLINE;
        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </span>
        );
      },
    },
    {
      key: 'styleNumber',
      header: 'Style & Lot',
      accessorKey: 'styleNumber',
      sortable: true,
      accessor: (r) => r.styleNumber,
      cell: (r) => (
        <div className="min-w-0">
          <div className="font-mono font-bold text-slate-900 text-xs truncate max-w-[150px]">
            {r.styleNumber}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
            Lot: {r.lotNumber}
          </div>
          {r.styleDescription && (
            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
              {r.styleDescription}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'buyer',
      header: 'Buyer Brand',
      accessorKey: 'buyer',
      sortable: true,
      accessor: (r) => r.buyer,
      cell: (r) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800">{r.buyer}</span>
          {r.factoryUnit && (
            <span className="text-[10px] text-slate-400 block">{r.factoryUnit.split('(')[0]}</span>
          )}
        </div>
      ),
    },
    {
      key: 'sampleSize',
      header: 'AQL Sampling',
      accessorKey: 'sampleSize',
      sortable: true,
      accessor: (r) => r.sampleSize,
      align: 'right',
      cell: (r) => {
        const pr = ((r.passCount / r.sampleSize) * 100).toFixed(0);
        return (
          <div className="text-right">
            <span className="font-mono font-bold text-slate-900 text-xs block">
              {r.passCount}/{r.sampleSize}
            </span>
            <span className="text-[10px] text-slate-400 block">{pr}% pass rate</span>
          </div>
        );
      },
    },
    {
      key: 'defectCount',
      header: 'Defects (Crit/Maj/Min)',
      accessorKey: 'defectCount',
      sortable: true,
      accessor: (r) => r.defectCount,
      cell: (r) => (
        <div className="flex items-center gap-1 text-[10px] font-mono">
          {r.criticalDefects > 0 && (
            <span className="px-1.5 py-0.5 rounded font-black bg-rose-100 text-rose-800 border border-rose-200">
              Crit:{r.criticalDefects}
            </span>
          )}
          {r.majorDefects > 0 && (
            <span className="px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Maj:{r.majorDefects}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Min:{r.minorDefects}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'QC Verdict',
      accessorKey: 'status',
      sortable: true,
      accessor: (r) => r.status,
      cell: (r) => <InspectionStatusChip status={r.status} />,
    },
    {
      key: 'inspectorName',
      header: 'Auditor & Date',
      accessorKey: 'inspectorName',
      sortable: true,
      accessor: (r) => r.inspectorName,
      cell: (r) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800 truncate max-w-[120px]">
            {r.inspectorName.split('(')[0]}
          </div>
          <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      cell: (r) => (
        <div className="flex items-center justify-center gap-1">
          {/* View Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', record: r })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors cursor-pointer"
            title="View full audit details"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', record: r })}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit audit record"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateInspection(r)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate audit record"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, records: [r] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete audit record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification Matching Buyer & Order Module */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Quality Inspection Audit"
          message={
            deleteModal.records.length === 1
              ? `Are you sure you want to permanently delete audit ${deleteModal.records[0].inspectionCode} for style ${deleteModal.records[0].styleNumber}?`
              : `Are you sure you want to permanently delete these ${deleteModal.records.length} inspection audits?`
          }
          items={deleteModal.records.map((r) => ({
            id: r.id,
            title: r.inspectionCode,
            subtitle: `${r.buyer} • Style: ${r.styleNumber} • ${r.stage}`,
            value: `${r.passCount}/${r.sampleSize} (${r.status})`,
          }))}
          itemTypeLabel="inspection record"
          confirmLabel="Delete Audit"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* TOP MODULE HEADER: 3 Tabs (Summary, Inspection List, Stage Breakdown) */}
      <ModuleHeader
        title="Quality Assurance & Inspection Audits"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Inspection List', count: records.length },
          { id: 'stages', label: '3-Stage Pipeline (Inline, Pre-Final, Final)' },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGES */}
      {subView.type === 'details' ? (
        <InspectionDetailsPage
          record={subView.record}
          allRecords={records}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(rec) => setSubView({ type: 'edit', record: rec })}
          onDuplicate={handleDuplicateInspection}
          onDelete={(rec) => setDeleteModal({ isOpen: true, records: [rec] })}
          onSelectRecord={(rec) => setSubView({ type: 'details', record: rec })}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <InspectionEntryPage
          mode="add"
          orders={orders}
          onSave={handleSaveInspection}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <InspectionEntryPage
          mode="edit"
          record={subView.record}
          orders={orders}
          onSave={handleSaveInspection}
          onCancel={() => setSubView({ type: 'details', record: subView.record })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Cards - Styled identically to Buyer & Order module */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Audits Logged"
                  value={records.length.toString()}
                  subtitle="All inspection stages"
                  icon={ClipboardCheck}
                  tone="blue"
                  delta={{ value: '+14.2%', isPositive: true }}
                />
                <StatCard
                  title="AQL Pass Rate"
                  value={`${passRate}%`}
                  subtitle={`${passedCount} Passed, ${failedCount} Failed`}
                  icon={CheckCircle2}
                  tone="emerald"
                  delta={{ value: '+2.1%', isPositive: true }}
                />
                <StatCard
                  title="Sampled Garments"
                  value={`${(totalAuditedPcs / 1000).toFixed(1)}k pcs`}
                  subtitle="Statistically audited"
                  icon={ShieldCheck}
                  tone="indigo"
                  delta={{ value: '+9.4%', isPositive: true }}
                />
                <StatCard
                  title="Critical Rejections"
                  value={criticalHolds.toString()}
                  subtitle={`${conditionalCount} conditional passes`}
                  icon={XCircle}
                  tone={criticalHolds > 0 ? 'rose' : 'purple'}
                  delta={{ value: criticalHolds > 0 ? 'Action Req' : 'Zero Critical', isPositive: criticalHolds === 0 }}
                />
              </div>

              {/* Three-Type Inspection Stage Distribution Strip */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Three Core Apparel Inspection Stages
                      </h3>
                      <p className="text-xs text-slate-500">Inline, Pre-Final, and Final inspection volume & pass rates</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View All Audits →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        type: 'INLINE',
                        label: 'Inline Inspection',
                        count: inlineCount,
                        color: 'bg-blue-600',
                        badge: 'Sewing & Assembly',
                        desc: 'Active line inspection during cutting & sewing',
                      },
                      {
                        type: 'PRE_FINAL',
                        label: 'Pre-Final Inspection',
                        count: preFinalCount,
                        color: 'bg-amber-500',
                        badge: '50%–80% Packed',
                        desc: 'Carton assortment, packaging & workmanship check',
                      },
                      {
                        type: 'FINAL',
                        label: 'Final Inspection (FRI)',
                        count: finalCount,
                        color: 'bg-emerald-600',
                        badge: '100% Finished',
                        desc: 'AQL 2.5 random sampling, drop test & metal check',
                      },
                    ].map((stage) => (
                      <div
                        key={stage.type}
                        onClick={() => {
                          setTypeFilter(stage.type);
                          setViewMode('list');
                        }}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                            {stage.count} Audits
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{stage.desc}</div>
                        <div className="pt-2 flex items-center justify-between text-[11px]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {stage.badge}
                          </span>
                          <span className="text-blue-600 font-semibold text-xs">Filter →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verdict Distribution Donut / Metric Widget */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">AQL Verdict Compliance</h3>
                    <span className="text-[10px] font-mono text-slate-400">ISO 2859-1</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                      <div className="text-[10px] text-emerald-700 font-bold mb-1">Passed</div>
                      <div className="text-2xl font-black font-mono text-emerald-900">{passedCount}</div>
                      <div className="text-[10px] text-emerald-600 mt-0.5">Cleared</div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                      <div className="text-[10px] text-amber-700 font-bold mb-1">Conditional</div>
                      <div className="text-2xl font-black font-mono text-amber-900">{conditionalCount}</div>
                      <div className="text-[10px] text-amber-600 mt-0.5">Review</div>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200">
                      <div className="text-[10px] text-rose-700 font-bold mb-1">Rejected</div>
                      <div className="text-2xl font-black font-mono text-rose-900">{failedCount}</div>
                      <div className="text-[10px] text-rose-600 mt-0.5">Rework</div>
                    </div>
                  </div>

                  {/* Quick button to switch to list */}
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log New Quality Inspection</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSPECTION LIST (MATCHING BUYER & ORDER TABLE AND BUTTON DESIGNS) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="qms-inspections-table"
                data={filteredRecords}
                columns={columns}
                searchPlaceholder="Search audit code, style#, PO#, buyer, auditor, or lot..."
                searchableKeys={[
                  'inspectionCode',
                  'styleNumber',
                  'orderNumber',
                  'buyer',
                  'lotNumber',
                  'inspectorName',
                  'stage',
                ]}
                secondaryAction={
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Inspection Type Filter */}
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Inspection Types</option>
                      <option value="INLINE">🧵 Inline Inspection</option>
                      <option value="PRE_FINAL">📦 Pre-Final Inspection</option>
                      <option value="FINAL">🏆 Final Inspection (FRI)</option>
                    </select>

                    {/* Verdict Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Verdicts</option>
                      <option value="PASSED">Passed</option>
                      <option value="CONDITIONAL_PASS">Conditional Pass</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Buyer Filter */}
                    <select
                      value={buyerFilter}
                      onChange={(e) => setBuyerFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[160px]"
                    >
                      <option value="ALL">All Buyers</option>
                      {uniqueBuyers.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
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
                    <span>Add Inspection</span>
                  </button>
                }
                batchActions={batchActions}
              />
            </div>
          )}

          {/* TAB 3: STAGES BREAKDOWN & PIPELINE */}
          {viewMode === 'stages' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      End-to-End Inspection Pipeline (Inline ➔ Pre-Final ➔ Final)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tracking garment quality audits across all production checkpoints
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Inspection</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Inline Stage Column */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🧵</span>
                        <span className="font-bold text-xs text-slate-900">Inline Inspection</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {inlineCount} Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Checks during cutting lay and active sewing lines. Monitored for stitches per inch (SPI), seam strength, machine tension, and needle control.
                    </p>
                    <div className="space-y-2 pt-2">
                      {records
                        .filter((r) => (r.inspectionType || 'INLINE') === 'INLINE')
                        .slice(0, 4)
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => setSubView({ type: 'details', record: r })}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-2xs transition-all cursor-pointer text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-blue-700">{r.inspectionCode}</span>
                              <InspectionStatusChip status={r.status} />
                            </div>
                            <div className="font-semibold text-slate-800 truncate">{r.styleNumber}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{r.buyer} • {r.passCount}/{r.sampleSize} pass</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Pre-Final Stage Column */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📦</span>
                        <span className="font-bold text-xs text-slate-900">Pre-Final Inspection</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {preFinalCount} Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Conducted when order is 50%–80% packed. Verifies polybags, size & color assortment, folding specs, carton packing, and workmanship prior to final buyer audit.
                    </p>
                    <div className="space-y-2 pt-2">
                      {records
                        .filter((r) => r.inspectionType === 'PRE_FINAL')
                        .slice(0, 4)
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => setSubView({ type: 'details', record: r })}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:shadow-2xs transition-all cursor-pointer text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-amber-700">{r.inspectionCode}</span>
                              <InspectionStatusChip status={r.status} />
                            </div>
                            <div className="font-semibold text-slate-800 truncate">{r.styleNumber}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{r.buyer} • {r.packedPercent || 70}% packed</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Final Stage Column */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏆</span>
                        <span className="font-bold text-xs text-slate-900">Final Random Inspection (FRI)</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {finalCount} Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Conducted at 100% finished & ≥80% packed. Official buyer acceptance audit with AQL 2.5 Level II sampling, 10-side carton drop test, 100% metal detection, and shipping marks check.
                    </p>
                    <div className="space-y-2 pt-2">
                      {records
                        .filter((r) => r.inspectionType === 'FINAL')
                        .slice(0, 4)
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => setSubView({ type: 'details', record: r })}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-2xs transition-all cursor-pointer text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-emerald-700">{r.inspectionCode}</span>
                              <InspectionStatusChip status={r.status} />
                            </div>
                            <div className="font-semibold text-slate-800 truncate">{r.styleNumber}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{r.buyer} • 100% packed • {r.passCount}/{r.sampleSize} pass</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
