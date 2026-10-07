'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  PieChart,
  Activity,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Layers,
  Search,
  Filter,
  Check,
  Download,
  LayoutDashboard,
  Table2,
  Tag,
  Grid,
  Zap,
  Image as ImageIcon,
  ArrowUpDown,
  RefreshCw,
  Package,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { RiskFmeaItem, RiskAssessmentType, RiskLevel, RiskSectionType } from '@/lib/types/modules';
import { MOCK_RISK_FMEAS } from '@/lib/db/modules-mock-data';

// Subcomponents
import { RiskAssessmentEntryPage } from '../modules/risk-assessment/RiskAssessmentEntryPage';
import { RiskAssessmentDetailsPage } from '../modules/risk-assessment/RiskAssessmentDetailsPage';
import { DeleteRiskAssessmentModal } from '../modules/risk-assessment/DeleteRiskAssessmentModal';
import { getRiskLevel, getRiskLevelBadge } from '../modules/risk-assessment/riskAssessmentData';
import { RISK_SECTIONS, RISK_SECTION_ORDER } from '../modules/risk-assessment/riskAssessmentSections';
import { useLiveModuleData } from '@/hooks/use-live-module-data';
import { useModulePermission } from '@/hooks/use-module-permission';

const MODULE_KEY = 'risk_assessment';
const STORAGE_KEY = 'project_ultra_risk_assessments_v2';

type RiskSubView =
  | { type: 'none' }
  | { type: 'details'; record: RiskFmeaItem }
  | { type: 'add' }
  | { type: 'edit'; record: RiskFmeaItem };

export function RiskAssessmentView() {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('risk_assessment');
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [records, setRecords] = useLiveModuleData<RiskFmeaItem[]>(
    MODULE_KEY,
    MOCK_RISK_FMEAS,
    STORAGE_KEY
  );

  // Dedicated Separate Pages (Details, Add, Edit)
  const [subView, setSubView] = useState<RiskSubView>({ type: 'none' });

  // Sync subview details if records state updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = records.find((r) => r.id === subView.record.id);
      if (refreshed && refreshed !== subView.record) {
        setSubView({ type: 'details', record: refreshed });
      }
    }
  }, [records, subView]);

  // Save changes via useLiveModuleData
  const persistRecords = (updatedList: RiskFmeaItem[]) => {
    setRecords(updatedList);
  };

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    records: RiskFmeaItem[];
  } | null>(null);

  // Filters & Search
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalCount = records.length;
  const productCount = records.filter((r) => r.assessmentType === 'PRODUCT').length;
  const processCount = records.filter(
    (r) => !r.assessmentType || r.assessmentType === 'PROCESS'
  ).length;
  const criticalCount = records.filter(
    (r) => r.assessmentType === 'CRITICAL_PROCESS'
  ).length;

  const criticalRisksCount = records.filter((r) => {
    const level = r.riskLevel || getRiskLevel(r.rpn, r.severity);
    return level === 'CRITICAL' || level === 'HIGH';
  }).length;

  const mitigatedCount = records.filter(
    (r) => r.status === 'MITIGATED' || r.status === 'APPROVED' || r.status === 'CLOSED'
  ).length;

  const mitigationRate = totalCount ? Math.round((mitigatedCount / totalCount) * 100) : 0;
  const maxRpn = totalCount ? Math.max(...records.map((r) => r.rpn || 0)) : 0;

  // CRUD Handlers
  const handleSaveRecord = (recordToSave: RiskFmeaItem) => {
    const exists = records.some((r) => r.id === recordToSave.id);
    let updated: RiskFmeaItem[];
    if (exists) {
      updated = records.map((r) => (r.id === recordToSave.id ? recordToSave : r));
    } else {
      updated = [recordToSave, ...records];
    }
    persistRecords(updated);
    setSubView({ type: 'details', record: recordToSave });
  };

  const handleDeleteRecord = (recordToDelete: RiskFmeaItem) => {
    setDeleteModal({
      isOpen: true,
      records: [recordToDelete],
    });
  };

  const confirmDelete = () => {
    if (!deleteModal || deleteModal.records.length === 0) return;
    const idsToDelete = new Set(deleteModal.records.map((r) => r.id));
    const updated = records.filter((r) => !idsToDelete.has(r.id));
    persistRecords(updated);

    if (subView.type === 'details' && idsToDelete.has(subView.record.id)) {
      setSubView({ type: 'none' });
    } else if (subView.type === 'edit' && idsToDelete.has(subView.record.id)) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.records.length;
    showToast(
      count === 1
        ? `Deleted risk assessment ${deleteModal.records[0].fmeaCode}`
        : `Deleted ${count} risk assessment records`
    );
    setDeleteModal(null);
  };

  // Filtered records
  const filteredRecords = records.filter((item) => {
    // 1. Type Filter
    const itemType = item.assessmentType || 'PROCESS';
    if (activeTypeFilter !== 'ALL' && itemType !== activeTypeFilter) {
      return false;
    }

    // 2. Risk Level Filter
    const level = item.riskLevel || getRiskLevel(item.rpn, item.severity);
    if (riskLevelFilter !== 'ALL') {
      if (riskLevelFilter === 'HIGH_CRITICAL' && level !== 'CRITICAL' && level !== 'HIGH') {
        return false;
      }
      if (riskLevelFilter === 'MEDIUM' && level !== 'MEDIUM') {
        return false;
      }
      if (riskLevelFilter === 'LOW' && level !== 'LOW') {
        return false;
      }
    }

    // 3. Status Filter
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }

    // 4. Section Category Filter (Raw Material, Embellishment, Product Testing, Legal, etc.)
    if (sectionFilter !== 'ALL') {
      const matchPrimary = item.primarySection === sectionFilter;
      const matchSectionItem = item.sectionRisks?.some((r) => r.section === sectionFilter);
      if (!matchPrimary && !matchSectionItem) {
        return false;
      }
    }

    // 5. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = item.fmeaCode.toLowerCase().includes(q);
      const matchProcess = item.processStep.toLowerCase().includes(q);
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchStyle = (item.styleNumber || '').toLowerCase().includes(q);
      const matchOrder = (item.orderNumber || '').toLowerCase().includes(q);
      const matchDesc = (item.styleDescription || '').toLowerCase().includes(q);
      const matchBuyer = (item.buyer || '').toLowerCase().includes(q);
      const matchFailure = item.potentialFailureMode.toLowerCase().includes(q);
      const matchMitigation = item.mitigationAction.toLowerCase().includes(q);
      const matchLead = item.responsibleLead.toLowerCase().includes(q);
      const matchSectionRisk = item.sectionRisks?.some(
        (r) =>
          r.potentialFailureMode.toLowerCase().includes(q) ||
          r.processStep.toLowerCase().includes(q) ||
          r.mitigationAction.toLowerCase().includes(q)
      );

      if (
        !matchCode &&
        !matchProcess &&
        !matchTitle &&
        !matchStyle &&
        !matchOrder &&
        !matchDesc &&
        !matchBuyer &&
        !matchFailure &&
        !matchMitigation &&
        !matchLead &&
        !matchSectionRisk
      ) {
        return false;
      }
    }

    return true;
  });

  // Table Columns Matching Audit Module Design
  const columns: ColumnDef<RiskFmeaItem>[] = [
    {
      key: 'fmeaReference',
      header: 'Risk Reference',
      sortable: true,
      width: '18%',
      render: (item) => {
        const itemType = item.assessmentType || 'PROCESS';
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center text-blue-600">
              {item.productImage ? (
                <img
                  src={item.productImage}
                  alt={item.styleNumber}
                  className="w-full h-full object-cover"
                />
              ) : itemType === 'PRODUCT' ? (
                <Tag className="w-4 h-4 text-indigo-600" />
              ) : itemType === 'CRITICAL_PROCESS' ? (
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              ) : (
                <Layers className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="min-w-0">
              <span
                onClick={() => setSubView({ type: 'details', record: item })}
                className="font-mono font-bold text-blue-700 text-xs block leading-tight hover:underline cursor-pointer"
              >
                {item.fmeaCode}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono leading-tight mt-0.5">
                <span>{item.assessmentDate || '2026-09-24'}</span>
                {item.orderNumber && (
                  <span className="font-semibold text-slate-700 bg-slate-100 px-1 rounded-sm">
                    {item.orderNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Assessment Type',
      sortable: true,
      width: '13%',
      render: (item) => {
        const itemType = item.assessmentType || 'PROCESS';
        const isProduct = itemType === 'PRODUCT';
        const isCritical = itemType === 'CRITICAL_PROCESS';

        return (
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${
              isProduct
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : isCritical
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {isProduct ? 'PRODUCT' : isCritical ? 'CRITICAL PROCESS' : 'PROCESS'}
          </span>
        );
      },
    },
    {
      key: 'scope',
      header: 'Scope & Style Profile',
      sortable: true,
      width: '24%',
      render: (item) => {
        const hasSectionRisks = item.sectionRisks && item.sectionRisks.length > 0;
        return (
          <div className="min-w-0 space-y-0.5">
            <div
              className="font-bold text-slate-900 text-xs truncate max-w-[230px]"
              title={item.title || item.processStep}
            >
              {item.styleNumber ? `${item.styleNumber} — ` : ''}
              {item.styleDescription || item.processStep}
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[230px] flex items-center gap-1.5 flex-wrap">
              <span>{item.buyer || item.department || 'General Production'}</span>
            </div>
            {hasSectionRisks && (
              <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {item.sectionRisks?.length} Section Risks
                </span>
                {Array.from(new Set(item.sectionRisks?.map((r) => r.section))).slice(0, 3).map((sec) => (
                  <span
                    key={sec}
                    className="text-[9px] font-semibold px-1 rounded-sm bg-slate-100 text-slate-600 truncate max-w-[75px]"
                  >
                    {sec.replace('_', ' ').toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'rpn',
      header: 'FMEA RPN (S×O×D)',
      sortable: true,
      align: 'center',
      width: '13%',
      render: (item) => {
        const rpnScore = item.rpn || item.severity * item.occurrence * item.detection;
        const level = item.riskLevel || getRiskLevel(rpnScore, item.severity);
        const isCritical = level === 'CRITICAL';
        const isHigh = level === 'HIGH';
        const isMedium = level === 'MEDIUM';

        return (
          <div className="text-center">
            <span
              className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-md inline-block ${
                isCritical
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 ring-1 ring-rose-400'
                  : isHigh
                  ? 'bg-orange-100 text-orange-900 border border-orange-300'
                  : isMedium
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              RPN {rpnScore}
            </span>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">
              S{item.severity} · O{item.occurrence} · D{item.detection}
            </div>
          </div>
        );
      },
    },
    {
      key: 'mitigation',
      header: 'Mitigation Protocol & Lead',
      width: '18%',
      render: (item) => (
        <div className="min-w-0">
          <div
            className="text-slate-800 text-xs truncate max-w-[190px] font-medium"
            title={item.mitigationAction}
          >
            {item.mitigationAction}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[190px]">
            Lead: {item.responsibleLead}
          </div>
        </div>
      ),
    },
    {
      key: 'images',
      header: 'Visuals',
      align: 'center',
      width: '8%',
      render: (item) => {
        const hasProductImg = !!item.productImage;
        const hasProcessImg = !!item.processImage;
        if (!hasProductImg && !hasProcessImg) {
          return <span className="text-[10px] text-slate-400">—</span>;
        }
        return (
          <div className="flex items-center justify-center gap-1">
            {hasProductImg && (
              <span
                className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center"
                title="Product Image Attached"
              >
                <Tag className="w-3 h-3" />
              </span>
            )}
            {hasProcessImg && (
              <span
                className="w-5 h-5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center"
                title="Process Image Attached"
              >
                <Layers className="w-3 h-3" />
              </span>
            )}
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
          {/* Details Button (Eye) */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', record: item })}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button (Pencil) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setSubView({ type: 'edit', record: item })}
              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Edit Risk Assessment"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Button (Trash) */}
          {canDelete && (
            <button
              type="button"
              onClick={() => handleDeleteRecord(item)}
              className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete Risk Assessment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<RiskFmeaItem>[] = [
    ...(canDelete ? [{
      label: 'Delete Selected',
      variant: 'danger' as const,
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected: RiskFmeaItem[]) => {
        setDeleteModal({
          isOpen: true,
          records: selected,
        });
      },
    }] : []),
  ];

  // ─── RENDER SUBVIEWS (SEPARATE PAGES) ────────────────────────────────────
  if (subView.type === 'details') {
    return (
      <RiskAssessmentDetailsPage
        record={subView.record}
        onBack={() => setSubView({ type: 'none' })}
        onEdit={(recordToEdit) => setSubView({ type: 'edit', record: recordToEdit })}
        onDelete={(recordToDelete) => handleDeleteRecord(recordToDelete)}
        onUpdateStatus={handleSaveRecord}
        showToast={showToast}
      />
    );
  }

  if (subView.type === 'add' || subView.type === 'edit') {
    return (
      <RiskAssessmentEntryPage
        initialRecord={subView.type === 'edit' ? subView.record : null}
        onBack={() => setSubView({ type: 'none' })}
        onSave={handleSaveRecord}
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

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteRiskAssessmentModal
          isOpen={deleteModal.isOpen}
          records={deleteModal.records}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* ─── MODULE HEADER (AUDIT MODULE FORMAT WITH TOPBAR BUTTON) ───────────── */}
      <ModuleHeader
        id="risk-assessment-module"
        title="Risk Assessment"
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
            label: 'Risk Registers',
            icon: Table2,
            count: `${records.length}`,
          },
        ]}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={() => setSubView({ type: 'add' })}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Conduct Risk Assessment</span>
            </button>
          ) : undefined
        }
      />

      {/* ─── VIEW 1: SUMMARY (KPI STAT CARDS) ──────────────────────────────── */}
      {viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Risk Registers"
              value={totalCount}
              subtitle="All 3 Assessment Types"
              icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Critical / High Risk"
              value={criticalRisksCount}
              subtitle="RPN ≥ 80 or Severity ≥ 9"
              delta={{ value: `${criticalRisksCount}`, isPositive: false, label: 'high priority' }}
              icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
            />
            <StatCard
              title="Highest RPN Found"
              value={maxRpn}
              subtitle="Requires Poka-Yoke"
              icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Mitigation Rate"
              value={`${mitigationRate}%`}
              subtitle={`${mitigatedCount} of ${totalCount} Active`}
              delta={{ value: '+4.2%', isPositive: true, label: 'resolved' }}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Critical Gates"
              value={criticalCount}
              subtitle="Metal & Waterproof Gates"
              icon={<ShieldAlert className="w-5 h-5 text-purple-600" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Criticality Bands */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    RPN Criticality Distribution
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Threshold 80+</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] text-rose-700 font-semibold block">Critical / High (RPN ≥ 80)</span>
                  <div className="text-lg font-bold font-mono text-rose-900 mt-1">{criticalRisksCount}</div>
                  <span className="text-[10px] text-slate-500">Mandatory Poka-Yoke</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block">Medium (40 - 79)</span>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-1">
                    {records.filter((r) => {
                      const l = r.riskLevel || getRiskLevel(r.rpn, r.severity);
                      return l === 'MEDIUM';
                    }).length}
                  </div>
                  <span className="text-[10px] text-slate-500">Supervisory Check</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Low (&lt; 40)</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">
                    {records.filter((r) => {
                      const l = r.riskLevel || getRiskLevel(r.rpn, r.severity);
                      return l === 'LOW';
                    }).length}
                  </div>
                  <span className="text-[10px] text-slate-500">Standard SOP</span>
                </div>
              </div>
            </div>

            {/* Assessment Types Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Assessments by 3 Core Categories
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Active Registry</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-semibold text-slate-900 block">Product Risk Assessment</span>
                      <span className="text-[11px] text-slate-500">Garment construction, fabric recovery & fastness</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    {productCount} Assessments
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-semibold text-slate-900 block">Process Risk Assessment</span>
                      <span className="text-[11px] text-slate-500">Spreading, cutting, inline sewing & finishing lines</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {processCount} Assessments
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <div>
                      <span className="font-semibold text-slate-900 block">Critical Process Risk Assessment</span>
                      <span className="text-[11px] text-slate-500">9-point metal detection & waterproof seam sealing gates</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    {criticalCount} Assessments
                  </span>
                </div>
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete Risk Assessment & FMEA Register"
            recordCount={filteredRecords.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      )}

      {/* ─── VIEW 2: FMEA RISK MATRIX / HEATMAP ─────────────────────────────── */}
      {viewMode === 'matrix' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Severity vs Occurrence Risk Heatmap Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual map of garment failure modes mapped by Severity (Vertical) and Occurrence (Horizontal).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {records.length} Total Evaluated Steps
              </span>
            </div>

            {/* Matrix Grid Visualization */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {records.map((r) => {
                  const rpn = r.rpn || r.severity * r.occurrence * r.detection;
                  const level = r.riskLevel || getRiskLevel(rpn, r.severity);
                  const isHigh = level === 'CRITICAL' || level === 'HIGH';
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSubView({ type: 'details', record: r })}
                      className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                        isHigh
                          ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                          : level === 'MEDIUM'
                          ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                          : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs text-blue-700">
                          {r.fmeaCode}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800'
                              : level === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          RPN {rpn}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{r.processStep}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                        {r.potentialFailureMode}
                      </p>
                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>S:{r.severity} · O:{r.occurrence} · D:{r.detection}</span>
                        <span className="font-sans font-semibold text-blue-600 hover:underline">
                          View Details →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW 3: RISK RECORDS (TABLE VIEW MATCHING AUDIT MODULE) ────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 4 Pill Filter Tabs (Matching Audit Module Architecture) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTypeFilter('ALL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeTypeFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Risks</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-200 font-mono">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTypeFilter('PRODUCT')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeTypeFilter === 'PRODUCT'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Product Risks</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-mono">
                  {productCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTypeFilter('PROCESS')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeTypeFilter === 'PROCESS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Process Risks</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">
                  {processCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTypeFilter('CRITICAL_PROCESS')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeTypeFilter === 'CRITICAL_PROCESS'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Critical Process</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-mono">
                  {criticalCount}
                </span>
              </button>
            </div>

            {/* Secondary Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Risk Sections</option>
                {RISK_SECTION_ORDER.map((sk) => (
                  <option key={sk} value={sk}>
                    {RISK_SECTIONS[sk].label}
                  </option>
                ))}
              </select>

              <select
                value={riskLevelFilter}
                onChange={(e) => setRiskLevelFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All RPN Levels</option>
                <option value="HIGH_CRITICAL">Critical & High (RPN ≥ 80)</option>
                <option value="MEDIUM">Medium (RPN 40-79)</option>
                <option value="LOW">Low (&lt; 40)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="MITIGATED">Mitigated</option>
                <option value="APPROVED">Approved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            id="risk-assessment-table"
            title="Risk Assessment Register"
            data={filteredRecords}
            columns={columns}
            searchPlaceholder="Search risk code, process step, style, failure mode, or lead..."
            searchableKeys={[
              'fmeaCode',
              'processStep',
              'styleNumber',
              'buyer',
              'potentialFailureMode',
              'mitigationAction',
              'responsibleLead',
            ]}
            batchActions={batchActions}
            moduleKey="risk_assessment"
            canExport={canExport}
            canDelete={canDelete}
          />
        </div>
      )}
    </div>
  );
}
