'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  Network,
  CheckCircle,
  ArrowRight,
  Layers,
  Sparkles,
  Eye,
  Plus,
  Download,
  Filter,
  Trash2,
  Edit,
  Building2,
  Calendar,
  AlertTriangle,
  GitPullRequest,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { MOCK_ROOT_CAUSE_CASES } from '@/lib/db/modules-mock-data';
import { RootCauseCase, RcaStatus, RcaSeverity } from '@/lib/types/modules';
import { useLiveModuleData } from '@/hooks/use-live-module-data';
import { useModulePermission } from '@/hooks/use-module-permission';

// Subcomponents
import { RcaDetailsPage } from '../modules/root-cause/RcaDetailsPage';
import { RcaEntryPage } from '../modules/root-cause/RcaEntryPage';
import { DeleteRcaModal } from '../modules/root-cause/DeleteRcaModal';

type RcaSubView =
  | { type: 'none' }
  | { type: 'details'; rcaCase: RootCauseCase }
  | { type: 'add' }
  | { type: 'edit'; rcaCase: RootCauseCase };

const STATUS_BADGES: Record<
  string,
  { label: string; cls: string; dot: string }
> = {
  DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' },
  INVESTIGATING: { label: 'Investigating', cls: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-600' },
  ROOT_CAUSE_IDENTIFIED: { label: 'Root Cause Isolated', cls: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-600' },
  CAPA_ASSIGNED: { label: 'CAPA Mandated', cls: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-600' },
  VERIFIED_CLOSED: { label: 'Verified & Closed', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-600' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-600' },
};

const SEVERITY_BADGES: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: 'Critical', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
  MAJOR: { label: 'Major', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  MINOR: { label: 'Minor', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
};

export function RootCauseAnalysisView() {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('root_cause');
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [cases, setCases] = useLiveModuleData<RootCauseCase[]>('root_cause_cases', MOCK_ROOT_CAUSE_CASES);
  const [activeCase, setActiveCase] = useState<RootCauseCase>(cases[0] || MOCK_ROOT_CAUSE_CASES[0]);
  const [activeTab, setActiveTab] = useState<'5why' | 'fishbone'>('5why');

  // Subview State
  const [subView, setSubView] = useState<RcaSubView>({ type: 'none' });

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    cases: RootCauseCase[];
  } | null>(null);

  // Filters State
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keep details subview synced if cases update
  React.useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = cases.find((c) => c.id === subView.rcaCase.id);
      if (refreshed && refreshed !== subView.rcaCase) {
        setSubView({ type: 'details', rcaCase: refreshed });
      }
    }
  }, [cases]);

  // KPIs
  const totalCount = cases.length;
  const investigatingCount = cases.filter(
    (c) => c.status === 'INVESTIGATING' || c.status === 'DRAFT'
  ).length;
  const isolatedCount = cases.filter(
    (c) => c.status === 'ROOT_CAUSE_IDENTIFIED' || c.status === 'CAPA_ASSIGNED' || c.status === 'COMPLETED' || c.status === 'VERIFIED_CLOSED'
  ).length;
  const criticalCount = cases.filter((c) => c.severity === 'CRITICAL').length;
  const resolutionRate = Math.round((isolatedCount / (totalCount || 1)) * 100);

  // CRUD Handlers
  const handleSaveCase = (savedCase: RootCauseCase) => {
    const exists = cases.some((c) => c.id === savedCase.id);
    if (exists) {
      setCases(cases.map((c) => (c.id === savedCase.id ? savedCase : c)));
      showToast(`Updated RCA case ${savedCase.caseCode}`);
    } else {
      setCases([savedCase, ...cases]);
      showToast(`Created new RCA investigation ${savedCase.caseCode}`);
    }
    setActiveCase(savedCase);
    setSubView({ type: 'details', rcaCase: savedCase });
  };

  const handleDeleteCase = (caseToDelete: RootCauseCase) => {
    setDeleteModal({
      isOpen: true,
      cases: [caseToDelete],
    });
  };

  const confirmDelete = () => {
    if (!deleteModal || deleteModal.cases.length === 0) return;
    const idsToDelete = new Set(deleteModal.cases.map((c) => c.id));
    setCases((prev) => prev.filter((c) => !idsToDelete.has(c.id)));

    if (subView.type === 'details' && idsToDelete.has(subView.rcaCase.id)) {
      setSubView({ type: 'none' });
    } else if (subView.type === 'edit' && idsToDelete.has(subView.rcaCase.id)) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.cases.length;
    showToast(
      count === 1
        ? `Deleted RCA case ${deleteModal.cases[0].caseCode}`
        : `Deleted ${count} RCA cases successfully`
    );
    setDeleteModal(null);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Case Code',
      'Problem Title',
      'Department',
      'Location',
      'Style Affected',
      'Buyer',
      'Severity',
      'Status',
      'Incident Date',
      'Final Root Cause',
    ];
    const rows = cases.map((c) => [
      `"${c.caseCode}"`,
      `"${c.problemTitle.replace(/"/g, '""')}"`,
      `"${c.department || 'Sewing'}"`,
      `"${c.occurredLocation.replace(/"/g, '""')}"`,
      `"${c.styleAffected}"`,
      `"${c.buyer || 'N/A'}"`,
      `"${c.severity || 'MAJOR'}"`,
      `"${c.status}"`,
      `"${c.createdDate}"`,
      `"${c.finalRootCause.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RCA_Investigation_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported RCA ledger to CSV');
  };

  // Filtered List
  const filteredCases = cases.filter((c) => {
    const matchesDept = departmentFilter === 'ALL' || c.department === departmentFilter;
    const matchesSev = severityFilter === 'ALL' || c.severity === severityFilter;
    const matchesStat = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesDept && matchesSev && matchesStat;
  });

  // Table Columns
  const columns: ColumnDef<RootCauseCase>[] = [
    {
      key: 'caseCode',
      header: 'Case Code',
      sortable: true,
      width: '12%',
      render: (item) => (
        <button
          onClick={() => setSubView({ type: 'details', rcaCase: item })}
          className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors text-left cursor-pointer"
        >
          {item.caseCode}
        </button>
      ),
    },
    {
      key: 'problemTitle',
      header: 'Quality Problem & Incident',
      sortable: true,
      width: '26%',
      render: (item) => (
        <div>
          <button
            onClick={() => setSubView({ type: 'details', rcaCase: item })}
            className="font-semibold text-slate-900 text-xs hover:text-blue-600 transition-colors text-left block"
          >
            {item.problemTitle}
          </button>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className="font-mono">{item.styleAffected}</span>
            {item.buyer && <span>• {item.buyer}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department & Floor',
      sortable: true,
      width: '16%',
      render: (item) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{item.department || 'Sewing'}</span>
          <div className="text-[11px] text-slate-500 truncate" title={item.occurredLocation}>
            {item.occurredLocation}
          </div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      width: '10%',
      render: (item) => {
        const sev = SEVERITY_BADGES[item.severity || 'MAJOR'] || SEVERITY_BADGES.MAJOR;
        return (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${sev.cls}`}>
            {sev.label}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '14%',
      render: (item) => {
        const st = STATUS_BADGES[item.status] || STATUS_BADGES.COMPLETED;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        );
      },
    },
    {
      key: 'finalRootCause',
      header: 'Isolated Systemic Root Cause',
      width: '14%',
      render: (item) => (
        <span
          className="text-xs text-emerald-900 font-medium truncate max-w-[200px] block"
          title={item.finalRootCause}
        >
          {item.finalRootCause}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '8%',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setSubView({ type: 'details', rcaCase: item })}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Inspect Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <button
              onClick={() => setSubView({ type: 'edit', rcaCase: item })}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
              title="Edit RCA"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteCase(item)}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<RootCauseCase>[] = [
    ...(canDelete ? [{
      label: 'Delete Selected',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: (selectedItems: RootCauseCase[]) => {
        setDeleteModal({
          isOpen: true,
          cases: selectedItems,
        });
      },
    }] : []),
  ];

  // RENDER SUB-VIEWS
  if (subView.type === 'details') {
    return (
      <RcaDetailsPage
        rcaCase={subView.rcaCase}
        onBack={() => setSubView({ type: 'none' })}
        onEdit={(c) => setSubView({ type: 'edit', rcaCase: c })}
        onDelete={handleDeleteCase}
        onUpdateCase={handleSaveCase}
        showToast={showToast}
      />
    );
  }

  if (subView.type === 'add') {
    return (
      <RcaEntryPage
        mode="create"
        onBack={() => setSubView({ type: 'none' })}
        onSave={handleSaveCase}
        showToast={showToast}
      />
    );
  }

  if (subView.type === 'edit') {
    return (
      <RcaEntryPage
        mode="edit"
        initialData={subView.rcaCase}
        onBack={() => setSubView({ type: 'details', rcaCase: subView.rcaCase })}
        onSave={handleSaveCase}
        showToast={showToast}
      />
    );
  }

  // RENDER MAIN VIEW (Summary / List)
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Header */}
      <ModuleHeader
        id="root-cause-module"
        title="Root Cause Analysis"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${cases.length} RCA Cases`}
        actions={
          <div className="flex items-center gap-2">
            {canExport && (
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                title="Export RCA Ledger to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => setSubView({ type: 'add' })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New RCA Investigation</span>
              </button>
            )}
          </div>
        }
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="RCA Investigation Cases"
              value={totalCount}
              subtitle="Total DMAIC investigations"
              icon={<HelpCircle className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Active Investigations"
              value={investigatingCount}
              subtitle="Floor analysis underway"
              icon={<Network className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Root Causes Isolated"
              value={`${resolutionRate}%`}
              subtitle={`${isolatedCount} of ${totalCount} solved`}
              icon={<CheckCircle className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Critical Priority Cases"
              value={criticalCount}
              subtitle="Zero-tolerance safety/pull fails"
              icon={<Sparkles className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          {/* Department Breakdown Mini-Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                RCA Cases by Manufacturing Department:
              </h3>
              <span className="text-[11px] text-slate-500">Cross-plant DMAIC coverage</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {['Sewing', 'Cutting', 'Finishing', 'Washing', 'Printing', 'Quality Assurance'].map(
                (dept) => {
                  const count = cases.filter(
                    (c) =>
                      c.department?.toLowerCase() === dept.toLowerCase() ||
                      (dept === 'Printing' && c.department?.toLowerCase().includes('print'))
                  ).length;
                  return (
                    <div
                      key={dept}
                      onClick={() => {
                        setDepartmentFilter(dept);
                        setViewMode('list');
                      }}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer"
                    >
                      <div className="text-[11px] font-semibold text-slate-600 truncate">{dept}</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{count}</div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Featured Case Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {activeCase.caseCode}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Logged on {activeCase.createdDate}
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {activeCase.department || 'Sewing'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{activeCase.problemTitle}</h2>
                <div className="text-xs text-slate-600 mt-0.5">
                  Location: <span className="font-semibold text-slate-800">{activeCase.occurredLocation}</span> | 
                  Style: <span className="font-mono font-semibold text-slate-800">{activeCase.styleAffected}</span> |
                  Lead: <span className="font-semibold text-slate-800">{activeCase.investigationLead || 'Lead QA'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('5why')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === '5why' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    5-Why Drilldown
                  </button>
                  <button
                    onClick={() => setActiveTab('fishbone')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'fishbone' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    6M Fishbone
                  </button>
                </div>
                <button
                  onClick={() => setSubView({ type: 'details', rcaCase: activeCase })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Dossier</span>
                </button>
              </div>
            </div>

            {/* 5-Why Interactive View */}
            {activeTab === '5why' && (
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Five-Why Sequential Causality Chain:
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'Why 1 (Primary Symptom)', text: activeCase.fiveWhys.why1 },
                    { label: 'Why 2 (Immediate Cause)', text: activeCase.fiveWhys.why2 },
                    { label: 'Why 3 (Technical Parameter)', text: activeCase.fiveWhys.why3 },
                    { label: 'Why 4 (Human / Setup Factor)', text: activeCase.fiveWhys.why4 },
                    { label: 'Why 5 (Systemic Root Cause)', text: activeCase.fiveWhys.why5 },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                        idx === 4
                          ? 'bg-rose-50/70 border-rose-200'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          idx === 4 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-xs font-bold ${
                            idx === 4 ? 'text-rose-900' : 'text-slate-700'
                          }`}
                        >
                          {item.label}
                        </div>
                        <p
                          className={`text-xs mt-0.5 leading-relaxed ${
                            idx === 4 ? 'text-rose-950 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-4">
                  <div className="text-xs font-bold text-emerald-900">Confirmed Systemic Root Cause:</div>
                  <p className="text-xs text-emerald-800 mt-1 font-medium leading-relaxed">
                    {activeCase.finalRootCause}
                  </p>
                </div>
              </div>
            )}

            {/* 6M Ishikawa Fishbone View */}
            {activeTab === 'fishbone' && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Ishikawa Cause &amp; Effect Matrix (6M Manufacturing Categories):
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Man (Personnel)', factors: activeCase.fishboneFactors?.man || [] },
                    { title: 'Machine (Equipment)', factors: activeCase.fishboneFactors?.machine || [] },
                    { title: 'Material (Raw Fabric/Thread)', factors: activeCase.fishboneFactors?.material || [] },
                    { title: 'Method (SOP & Work Instructions)', factors: activeCase.fishboneFactors?.method || [] },
                    { title: 'Measurement (Inspection & Gauges)', factors: activeCase.fishboneFactors?.measurement || [] },
                    { title: 'Milieu (Environment / Climate)', factors: activeCase.fishboneFactors?.milieu || [] },
                  ].map((m, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-700" />
                        {m.title}
                      </div>
                      <ul className="space-y-1.5">
                        {m.factors.length > 0 ? (
                          m.factors.map((f, fIdx) => (
                            <li key={fIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <span className="text-slate-400 font-bold">•</span>
                              <span>{f}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-400 italic">None recorded</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Target Effect / Problem:</span>
                    <div className="font-bold text-sm text-slate-900 mt-0.5">{activeCase.problemTitle}</div>
                  </div>
                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Action Mandated
                  </span>
                </div>
              </div>
            )}
          </div>

          <SwitchToListBanner
            label="Open RCA Investigation Cases Table"
            recordCount={cases.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* List Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                Filters:
              </span>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="Sewing">Sewing</option>
                <option value="Cutting">Cutting</option>
                <option value="Finishing">Finishing</option>
                <option value="Washing">Washing</option>
                <option value="Knitting">Knitting</option>
                <option value="Printing">Printing</option>
                <option value="Quality Assurance">Quality Assurance</option>
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="MAJOR">Major</option>
                <option value="MINOR">Minor</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="ROOT_CAUSE_IDENTIFIED">Root Cause Isolated</option>
                <option value="CAPA_ASSIGNED">CAPA Mandated</option>
                <option value="VERIFIED_CLOSED">Verified &amp; Closed</option>
                <option value="COMPLETED">Completed</option>
                <option value="DRAFT">Draft</option>
              </select>

              {(departmentFilter !== 'ALL' || severityFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setDepartmentFilter('ALL');
                    setSeverityFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Showing {filteredCases.length} of {cases.length} cases
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            id="root-cause-cases-table"
            title="Root Cause Cases"
            data={filteredCases}
            columns={columns}
            batchActions={batchActions}
            searchPlaceholder="Search RCA case by code, problem, style, department, or root cause..."
            searchableKeys={[
              'caseCode',
              'problemTitle',
              'occurredLocation',
              'styleAffected',
              'finalRootCause',
              'department',
              'buyer',
              'investigationLead',
            ]}
            moduleKey="root_cause"
            canExport={canExport}
            canDelete={canDelete}
          />
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <DeleteRcaModal
          isOpen={deleteModal.isOpen}
          cases={deleteModal.cases}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
