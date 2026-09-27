'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ShieldCheck,
  FileCheck,
  Layers,
  ChevronRight,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Download,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  FileText,
  Award,
  Check,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { QualityManualSection, QualityManualStatus } from '@/lib/types/modules';
import { INITIAL_QUALITY_MANUAL_SECTIONS } from '../modules/quality-manual/quality-manual-data';
import { QualityManualDetailsPage } from '../modules/quality-manual/QualityManualDetailsPage';
import { QualityManualEntryPage } from '../modules/quality-manual/QualityManualEntryPage';
import { DeleteQualityManualModal } from '../modules/quality-manual/DeleteQualityManualModal';

type QualityManualSubView =
  | { type: 'none' }
  | { type: 'details'; section: QualityManualSection }
  | { type: 'add' }
  | { type: 'edit'; section: QualityManualSection };

export function QualityManualView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  // Load chapters from localStorage or fallback to INITIAL_QUALITY_MANUAL_SECTIONS
  const [sections, setSections] = useState<QualityManualSection[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('erp_quality_manual_chapters_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed parsing stored quality manual chapters:', err);
      }
    }
    return INITIAL_QUALITY_MANUAL_SECTIONS;
  });

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('erp_quality_manual_chapters_v1', JSON.stringify(sections));
      } catch (err) {
        console.warn('Failed saving quality manual chapters to localStorage:', err);
      }
    }
  }, [sections]);

  // Subview State (Details, Add, Edit)
  const [subView, setSubView] = useState<QualityManualSubView>({ type: 'none' });

  // Currently selected section for the summary interactive explorer
  const [selectedSummarySection, setSelectedSummarySection] = useState<QualityManualSection>(
    sections[0] || INITIAL_QUALITY_MANUAL_SECTIONS[0]
  );

  // Sync subview details if section data updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = sections.find((s) => s.id === subView.section.id);
      if (refreshed && refreshed !== subView.section) {
        setSubView({ type: 'details', section: refreshed });
      }
    }
  }, [sections, subView]);

  // Modal State for Deletions
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    sections: QualityManualSection[];
  } | null>(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct lists for filters
  const departments = Array.from(new Set(sections.map((s) => s.responsibleDepartment))).sort();

  // Filtered chapters
  const filteredSections = sections.filter((s) => {
    const matchesDept = departmentFilter === 'ALL' || s.responsibleDepartment === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || (s.status || 'ACTIVE') === statusFilter;
    return matchesDept && matchesStatus;
  });

  // CRUD Handlers
  const handleCreateSection = (newSection: QualityManualSection) => {
    const updated = [newSection, ...sections];
    setSections(updated);
    setSubView({ type: 'details', section: newSection });
    setSelectedSummarySection(newSection);
    showToast(`Successfully created chapter ${newSection.chapterNumber}`);
  };

  const handleUpdateSection = (updatedSection: QualityManualSection) => {
    const updated = sections.map((s) => (s.id === updatedSection.id ? updatedSection : s));
    setSections(updated);
    if (subView.type === 'edit' || subView.type === 'details') {
      setSubView({ type: 'details', section: updatedSection });
    }
    if (selectedSummarySection.id === updatedSection.id) {
      setSelectedSummarySection(updatedSection);
    }
    showToast(`Saved changes to chapter ${updatedSection.chapterNumber}`);
  };

  const handleDuplicateSection = (sec: QualityManualSection) => {
    const duplicated: QualityManualSection = {
      ...JSON.parse(JSON.stringify(sec)),
      id: `qm-${Date.now()}`,
      chapterNumber: `${sec.chapterNumber}-COPY`,
      title: `${sec.title} (Copy)`,
      status: 'DRAFT',
      version: 'Rev 1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [duplicated, ...sections];
    setSections(updated);
    setSubView({ type: 'details', section: duplicated });
    showToast(`Duplicated chapter as ${duplicated.chapterNumber}`);
  };

  const confirmDeleteSections = () => {
    if (!deleteModal) return;
    const idsToDelete = new Set(deleteModal.sections.map((s) => s.id));
    const updated = sections.filter((s) => !idsToDelete.has(s.id));
    setSections(updated);

    if (subView.type === 'details' && idsToDelete.has(subView.section.id)) {
      setSubView({ type: 'none' });
    }
    if (idsToDelete.has(selectedSummarySection.id) && updated.length > 0) {
      setSelectedSummarySection(updated[0]);
    }
    showToast(`Deleted ${deleteModal.sections.length} quality manual chapter(s)`);
    setDeleteModal(null);
  };

  // 6 Compact Table Columns (Table fit, NO horizontal scroll)
  const columns: ColumnDef<QualityManualSection>[] = [
    {
      key: 'chapterNumber',
      header: 'Chapter & Rev',
      sortable: true,
      render: (item) => {
        const isDraft = item.status === 'DRAFT';
        const isReview = item.status === 'UNDER_REVIEW';
        return (
          <div className="space-y-1">
            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 inline-block">
              {item.chapterNumber}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDraft ? 'bg-amber-500' : isReview ? 'bg-indigo-500' : 'bg-emerald-500'
                }`}
              />
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {item.version || 'Rev 1.0'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Chapter Title & Summary',
      sortable: true,
      render: (item) => (
        <div className="min-w-0 pr-2">
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', section: item })}
            className="font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors text-left block truncate cursor-pointer"
            title={item.title}
          >
            {item.title}
          </button>
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={item.summary}>
            {item.summary}
          </p>
        </div>
      ),
    },
    {
      key: 'clauseReference',
      header: 'ISO Clause Ref',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block truncate max-w-[180px]">
            {item.clauseReference}
          </span>
          <div className="text-[10px] text-slate-400 font-mono">
            {item.isoStandard || 'ISO 9001:2015'}
          </div>
        </div>
      ),
    },
    {
      key: 'responsibleDepartment',
      header: 'Department Custodian',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="text-xs font-medium text-slate-800 block truncate">
            {item.responsibleDepartment}
          </span>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            Sign-off: {item.approvedBy?.split('(')[0] || 'Managing Director'}
          </div>
        </div>
      ),
    },
    {
      key: 'compliance',
      header: 'Checkpoints',
      sortable: false,
      render: (item) => {
        const count = item.complianceRequirements?.length || 3;
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{count} Checkpoints</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {/* Details Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', section: item })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Separate Chapter Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', section: item })}
            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
            title="Edit Chapter"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateSection(item)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate Chapter"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, sections: [item] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Chapter"
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

      {/* TOP HEADER: 3-tab layout (Summary, Chapters Index, ISO Clause Matrix) */}
      <ModuleHeader
        id="quality-manual-module"
        moduleCode="MOD-27"
        badge="Quality System Governance"
        title="Plant Quality Policy & Master Manual (ISO 9001:2015)"
        subtitle="Foundational corporate quality policy, leadership commitments, line-stop authority, and ISO clause mapping"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Quality Manual Chapters Index', count: sections.length },
          { id: 'matrix', label: 'ISO 9001 Clause Matrix' },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <QualityManualDetailsPage
          section={subView.section}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(sec) => setSubView({ type: 'edit', section: sec })}
          onDuplicate={(sec) => handleDuplicateSection(sec)}
          onDelete={(sec) => setDeleteModal({ isOpen: true, sections: [sec] })}
          onUpdateStatus={handleUpdateSection}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <QualityManualEntryPage
          onSave={handleCreateSection}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <QualityManualEntryPage
          initialSection={subView.section}
          onSave={handleUpdateSection}
          onCancel={() => setSubView({ type: 'details', section: subView.section })}
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
                  title="Quality Manual Master"
                  value="Rev 4.5"
                  subtitle="ISO 9001:2015 Certified"
                  icon={BookOpen}
                  tone="blue"
                  delta={{ value: '+1 Chapter Added', isPositive: true }}
                />
                <StatCard
                  title="Governing Chapters"
                  value={sections.length}
                  subtitle="Comprehensive QMS Coverage"
                  icon={Layers}
                  tone="indigo"
                />
                <StatCard
                  title="Executive Sign-Off"
                  value="Managing Dir."
                  subtitle="100% Policy Mandated"
                  icon={ShieldCheck}
                  tone="emerald"
                />
                <StatCard
                  title="Surveillance Audit"
                  value="100% Pass"
                  subtitle="Zero Major Non-Conformances"
                  icon={FileCheck}
                  tone="amber"
                />
              </div>

              {/* Clean Light-Themed Highlight Banner: Buyer & Order Style Buttons */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>ISO 9001:2015 Clause 5.2 Quality Policy &amp; Corporate Governance</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Factory Master Quality Manual &amp; Operating Policies
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Supreme governance document establishing factory quality commitments, defect escalation thresholds,
                    unilateral line-stop authority, and audit verification matrices across knitwear, woven, and denim divisions.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const master = sections[0] || INITIAL_QUALITY_MANUAL_SECTIONS[0];
                      setSubView({ type: 'details', section: master });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Foundational Chapter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Create Quality Manual Chapter</span>
                  </button>
                </div>
              </div>

              {/* Interactive Chapter Explorer (Clean Light Styling) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chapter List Column */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Table of Contents
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {sections.length} Chapters
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                    {sections.map((sec) => {
                      const isSelected = selectedSummarySection.id === sec.id;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setSelectedSummarySection(sec)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs ring-1 ring-blue-400/30'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-mono text-[11px] font-bold text-blue-700 block">
                              {sec.chapterNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-900 block truncate mt-0.5">
                              {sec.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono truncate block mt-0.5">
                              {sec.clauseReference}
                            </span>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-blue-600' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Chapter Inspector Column */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            {selectedSummarySection.chapterNumber}
                          </span>
                          <span className="text-xs font-mono text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                            {selectedSummarySection.clauseReference}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                            {selectedSummarySection.version || 'Rev 1.0'}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mt-1.5">
                          {selectedSummarySection.title}
                        </h2>
                      </div>
                      <div className="text-xs text-slate-500 self-start sm:self-auto">
                        Custodian: <span className="font-semibold text-slate-800">{selectedSummarySection.responsibleDepartment}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <span className="font-bold text-slate-900 block">Executive Summary:</span>
                      <p className="text-slate-700 leading-relaxed">{selectedSummarySection.summary}</p>
                    </div>

                    {/* Commitments list preview */}
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-2 text-xs">
                      <span className="font-bold text-blue-950 block">Key Policy Commitments:</span>
                      <ul className="space-y-1.5">
                        {(selectedSummarySection.policyCommitments &&
                        selectedSummarySection.policyCommitments.length > 0
                          ? selectedSummarySection.policyCommitments.slice(0, 3)
                          : [
                              'Strict adherence to buyer approved technical specs & tech packs.',
                              'No substandard fabric or trims released to cutting without lab approval.',
                              'Operators empowered with unilateral Stop-the-Line authority.',
                            ]
                        ).map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-800 font-medium">
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">
                      Approved: {selectedSummarySection.approvedBy || 'Managing Director'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'details', section: selectedSummarySection })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                    >
                      <span>Open Full Chapter Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <SwitchToListBanner
                label="Open Full Quality Manual Chapters Master Index"
                recordCount={sections.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: CHAPTERS INDEX (Compact Table, No Horizontal Scroll) */}
          {viewMode === 'list' && (
            <div className="animate-in fade-in duration-200">
              <DataTable
                id="quality-manual-table"
                title="Quality Manual Chapters Master Index (ISO 9001:2015)"
                subtitle="Complete registry of corporate quality chapters, standard clause references, and review cycles"
                data={filteredSections}
                columns={columns}
                searchPlaceholder="Search chapter number, title, clause, department, or summary..."
                searchableKeys={['chapterNumber', 'clauseReference', 'title', 'responsibleDepartment', 'summary']}
                secondaryAction={
                  <div className="flex items-center gap-2">
                    {/* Department filter */}
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
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
                    <span>+ Create Quality Manual Chapter</span>
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
                        sections: selected,
                      });
                    },
                  },
                  {
                    label: 'Export Index',
                    icon: <Download className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      showToast(`Exported ${selected.length} quality manual records`);
                    },
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 3: ISO 9001 CLAUSE MATRIX */}
          {viewMode === 'matrix' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ISO 9001:2015 Standard Clauses Alignment Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cross-functional mapping of standard clauses (Clause 4 to Clause 10) against garments factory divisions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubView({ type: 'add' })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Chapter</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800">
                          {sec.chapterNumber}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {sec.version || 'Rev 1.0'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{sec.title}</h4>
                      <div className="text-[11px] font-mono text-slate-500 font-semibold">
                        {sec.clauseReference}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {sec.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
                        {sec.responsibleDepartment}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSubView({ type: 'details', section: sec })}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <span>Inspect Chapter</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
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
        <DeleteQualityManualModal
          isOpen={deleteModal.isOpen}
          sections={deleteModal.sections}
          onConfirm={confirmDeleteSections}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
