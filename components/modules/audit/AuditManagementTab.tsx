'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Sparkles,
  Building2,
  Award,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Filter,
  Sliders,
  CheckCircle,
  FileQuestion,
  Layers,
  Check,
  ArrowRight,
  ShieldAlert,
  Percent,
  Download,
  Share2,
  CheckSquare,
  Square,
  ChevronRight,
  BookOpen,
  Info,
} from 'lucide-react';
import {
  AuditTypeDefinition,
  ManagedAuditQuestion,
  AuditCategory,
} from '@/lib/types/modules';
import {
  INITIAL_AUDIT_TYPES,
  INITIAL_AUDIT_QUESTIONS,
  getStoredAuditTypes,
  saveStoredAuditTypes,
  getStoredAuditQuestions,
  saveStoredAuditQuestions,
} from './audit-management-data';
import { AddEditAuditTypeModal } from './AddEditAuditTypeModal';
import { AddEditQuestionModal } from './AddEditQuestionModal';
import { ImportQuestionsModal } from './ImportQuestionsModal';
import { MarkingSystemModal } from './MarkingSystemModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface AuditManagementTabProps {
  onConductAudit?: (auditType: AuditTypeDefinition, questions: ManagedAuditQuestion[]) => void;
  showToast: (msg: string) => void;
}

export function AuditManagementTab({ onConductAudit, showToast }: AuditManagementTabProps) {
  // ─── STATE ──────────────────────────────────────────────────────────────────
  const [auditTypes, setAuditTypes] = useState<AuditTypeDefinition[]>(() => getStoredAuditTypes());
  const [questions, setQuestions] = useState<ManagedAuditQuestion[]>(() =>
    getStoredAuditQuestions()
  );

  // Active Selected Audit Type
  const [activeTypeId, setActiveTypeId] = useState<string>(() => {
    const stored = getStoredAuditTypes();
    return stored[0]?.id || 'type-safety-ehs';
  });

  // Filters & Search for Questions within Selected Audit Type
  const [selectedClause, setSelectedClause] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Batch Selection of Questions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Modals State
  const [isAddEditTypeModalOpen, setIsAddEditTypeModalOpen] = useState(false);
  const [typeToEdit, setTypeToEdit] = useState<AuditTypeDefinition | null>(null);

  const [isAddEditQuestionModalOpen, setIsAddEditQuestionModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<ManagedAuditQuestion | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMarkingModalOpen, setIsMarkingModalOpen] = useState(false);

  // Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'question' | 'batch_questions' | 'audit_type';
    question?: ManagedAuditQuestion;
    auditType?: AuditTypeDefinition;
  }>({
    isOpen: false,
    type: 'question',
  });

  // LocalStorage Sync
  useEffect(() => {
    saveStoredAuditTypes(auditTypes);
  }, [auditTypes]);

  useEffect(() => {
    saveStoredAuditQuestions(questions);
  }, [questions]);

  // Active Audit Type Definition
  const activeType = useMemo(() => {
    return auditTypes.find((t) => t.id === activeTypeId) || auditTypes[0] || INITIAL_AUDIT_TYPES[0];
  }, [auditTypes, activeTypeId]);

  // Questions of Active Audit Type
  const activeTypeQuestions = useMemo(() => {
    return questions.filter((q) => q.auditTypeId === activeType?.id);
  }, [questions, activeType]);

  // Distinct Clauses for Active Audit Type
  const distinctClauses = useMemo(() => {
    const set = new Set<string>();
    activeTypeQuestions.forEach((q) => {
      if (q.clause) set.add(q.clause);
    });
    return Array.from(set);
  }, [activeTypeQuestions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return activeTypeQuestions.filter((item) => {
      const matchesClause = selectedClause === 'ALL' || item.clause === selectedClause;
      const matchesSeverity = severityFilter === 'ALL' || item.severityOnFailure === severityFilter;
      const matchesSearch =
        !q ||
        item.clauseNumber.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        (item.subClauseTitle && item.subClauseTitle.toLowerCase().includes(q)) ||
        (item.guidance && item.guidance.toLowerCase().includes(q));

      return matchesClause && matchesSeverity && matchesSearch;
    });
  }, [activeTypeQuestions, selectedClause, severityFilter, searchQuery]);

  // Marking System Stats for Active Type
  const currentTotalMarks = useMemo(() => {
    return activeTypeQuestions.reduce((sum, item) => sum + (item.maxMarks || 1), 0);
  }, [activeTypeQuestions]);

  const criticalQuestionsCount = useMemo(() => {
    return activeTypeQuestions.filter((item) => item.severityOnFailure === 'CRITICAL').length;
  }, [activeTypeQuestions]);

  // ─── CRUD HANDLERS: AUDIT TYPES ─────────────────────────────────────────────
  const handleSaveAuditType = (savedType: AuditTypeDefinition, templateSource?: string) => {
    const exists = auditTypes.some((t) => t.id === savedType.id);
    let updatedTypes: AuditTypeDefinition[];

    if (exists) {
      updatedTypes = auditTypes.map((t) => (t.id === savedType.id ? savedType : t));
      showToast(`Updated audit type "${savedType.name}"`);
    } else {
      updatedTypes = [...auditTypes, savedType];
      showToast(`Created new audit type "${savedType.name}"`);

      // If template source was selected, clone template questions into the new audit type!
      if (templateSource && templateSource !== 'none') {
        const templateQuestions = questions.filter((q) => q.auditTypeId === templateSource);
        if (templateQuestions.length > 0) {
          const cloned = templateQuestions.map((q, idx) => ({
            ...q,
            id: `q-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            auditTypeId: savedType.id,
          }));
          setQuestions((prev) => [...prev, ...cloned]);
          showToast(`Cloned ${cloned.length} starter questions into ${savedType.name}`);
        }
      }
    }

    setAuditTypes(updatedTypes);
    setActiveTypeId(savedType.id);
    setSelectedClause('ALL');
  };

  const handleDeleteAuditType = (typeToDelete: AuditTypeDefinition) => {
    if (auditTypes.length <= 1) {
      showToast('Cannot delete the last audit type.');
      return;
    }
    const updatedTypes = auditTypes.filter((t) => t.id !== typeToDelete.id);
    // Also remove questions associated with this audit type
    setQuestions((prev) => prev.filter((q) => q.auditTypeId !== typeToDelete.id));
    setAuditTypes(updatedTypes);
    setActiveTypeId(updatedTypes[0].id);
    showToast(`Deleted audit type "${typeToDelete.name}" and its questions.`);
  };

  // ─── CRUD HANDLERS: QUESTIONS ───────────────────────────────────────────────
  const handleSaveQuestion = (savedQuestion: ManagedAuditQuestion) => {
    const exists = questions.some((q) => q.id === savedQuestion.id);
    if (exists) {
      setQuestions((prev) => prev.map((q) => (q.id === savedQuestion.id ? savedQuestion : q)));
      showToast(`Updated question ${savedQuestion.clauseNumber}`);
    } else {
      setQuestions((prev) => [savedQuestion, ...prev]);
      showToast(`Added question ${savedQuestion.clauseNumber} to ${activeType.name}`);
    }
  };

  const handleDeleteQuestion = (questionToDelete: ManagedAuditQuestion) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionToDelete.id));
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      next.delete(questionToDelete.id);
      return next;
    });
    showToast(`Deleted question ${questionToDelete.clauseNumber}`);
  };

  const handleBatchDeleteQuestions = () => {
    if (selectedQuestionIds.size === 0) return;
    const count = selectedQuestionIds.size;
    setQuestions((prev) => prev.filter((q) => !selectedQuestionIds.has(q.id)));
    setSelectedQuestionIds(new Set());
    showToast(`Deleted ${count} question(s) successfully`);
  };

  const handleDuplicateQuestion = (q: ManagedAuditQuestion) => {
    const duplicated: ManagedAuditQuestion = {
      ...q,
      id: `q-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clauseNumber: `${q.clauseNumber}-copy`,
      subClauseTitle: `${q.subClauseTitle || ''} (Copy)`.trim(),
      sortOrder: Date.now(),
    };
    setQuestions((prev) => [duplicated, ...prev]);
    showToast(`Duplicated question ${q.clauseNumber}`);
  };

  const handleImportQuestions = (newQuestions: ManagedAuditQuestion[]) => {
    setQuestions((prev) => [...prev, ...newQuestions]);
  };

  // Quick Inline Change of Question Marks
  const handleQuickChangeMarks = (questionId: string, delta: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const current = q.maxMarks || 1;
          const nextVal = Math.max(0.5, Number((current + delta).toFixed(1)));
          return { ...q, maxMarks: nextVal };
        }
        return q;
      })
    );
  };

  // Toggle selection for batch actions
  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (selectedQuestionIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedQuestionIds(new Set());
    } else {
      const next = new Set<string>();
      filteredQuestions.forEach((q) => next.add(q.id));
      setSelectedQuestionIds(next);
    }
  };

  // Helper for Type Category Badges
  const getCategoryTheme = (category?: AuditCategory) => {
    switch (category) {
      case 'SAFETY':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          activeBg: 'bg-amber-500 text-white',
          icon: AlertTriangle,
        };
      case 'COMPLIANCE':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          activeBg: 'bg-purple-600 text-white',
          icon: Users,
        };
      case 'SUB_SUPPLIER':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          activeBg: 'bg-indigo-600 text-white',
          icon: Building2,
        };
      case 'INTERNAL':
      default:
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          activeBg: 'bg-blue-600 text-white',
          icon: ShieldCheck,
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── SECTION 1: AUDIT TYPES DIRECTORY (CARDS & QUICK SWITCHER) ────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Audit Types Directory</h3>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {auditTypes.length} Configured
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage audit frameworks, standards, question banks, and scoring models.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setTypeToEdit(null);
              setIsAddEditTypeModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Audit Type</span>
          </button>
        </div>

        {/* Audit Types Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {auditTypes.map((type) => {
            const isActive = type.id === activeType.id;
            const theme = getCategoryTheme(type.category);
            const IconComp = theme.icon;
            const typeQuestionsCount = questions.filter((q) => q.auditTypeId === type.id).length;
            const typeMarksSum = questions
              .filter((q) => q.auditTypeId === type.id)
              .reduce((sum, q) => sum + (q.maxMarks || 1), 0);

            return (
              <div
                key={type.id}
                onClick={() => {
                  setActiveTypeId(type.id);
                  setSelectedClause('ALL');
                  setSelectedQuestionIds(new Set());
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between group select-none ${
                  isActive
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${theme.bg}`}
                    >
                      <IconComp className="w-3 h-3" />
                      <span>{type.code}</span>
                    </span>

                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                        Active
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {type.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5" title={type.standard}>
                    {type.standard}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="font-mono text-slate-700">
                    <span className="font-bold text-slate-900">{typeQuestionsCount}</span> Qs •{' '}
                    <span className="font-bold text-blue-700">{typeMarksSum}M</span>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-emerald-700">
                    Pass ≥{type.passMarksThreshold}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION 2: ACTIVE AUDIT TYPE COMMAND BAR & MARKING SYSTEM ─────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Command Bar Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              {activeType.category === 'SAFETY' ? (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              ) : activeType.category === 'COMPLIANCE' ? (
                <Users className="w-6 h-6 text-purple-600" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{activeType.name}</h2>
                <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  {activeType.code}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {activeType.category}
                </span>
                {activeType.criticalNcFailsAudit && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    <span>Crit Fail Rule</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                {activeType.description || activeType.standard}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-2">
                <div>
                  <span className="font-semibold text-slate-700">Standard: </span>
                  <span className="font-mono text-slate-800">{activeType.standard}</span>
                </div>
                {activeType.defaultDepartment && (
                  <div>
                    <span className="font-semibold text-slate-700">Department: </span>
                    <span>{activeType.defaultDepartment}</span>
                  </div>
                )}
                {activeType.defaultAuditorOrg && (
                  <div>
                    <span className="font-semibold text-slate-700">Auditor Org: </span>
                    <span>{activeType.defaultAuditorOrg}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {onConductAudit && (
              <button
                type="button"
                onClick={() => onConductAudit(activeType, activeTypeQuestions)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
                title="Conduct a new audit using this audit type"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Conduct This Audit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setTypeToEdit(activeType);
                setIsAddEditTypeModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Edit Audit Type Standard and Details"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Type</span>
            </button>

            {!activeType.isSystemDefault && (
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({
                    isOpen: true,
                    type: 'audit_type',
                    auditType: activeType,
                  })
                }
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title="Delete Audit Type"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Marking System Strip (Detailed KPIs & Scoring Parameters) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Total Questions
              </div>
              <div className="text-sm font-mono font-bold text-slate-900">
                {activeTypeQuestions.length} Questions
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {distinctClauses.length} Sections / Clauses
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Total Weightage
              </div>
              <div className="text-sm font-mono font-bold text-blue-700">
                {currentTotalMarks.toFixed(1)} Marks
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Target: {activeType.totalAvailableMarks || 100} Marks
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Pass Threshold
              </div>
              <div className="text-sm font-mono font-bold text-emerald-700">
                ≥ {activeType.passMarksThreshold || 80}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Passing Benchmark
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Critical Questions
              </div>
              <div className="text-sm font-mono font-bold text-rose-700">
                {criticalQuestionsCount} Critical
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {activeType.criticalNcFailsAudit ? 'Auto-Fail Active' : 'Graded only'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsMarkingModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Configure Marking System</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: QUESTIONS WORKBENCH (FULL CRUD & IMPORT) ─────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Toolbar: Clause Filter, Search & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Clause Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedClause('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                selectedClause === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Sections</span>
              <span className="font-mono text-[11px] ml-1.5 px-1.5 py-0.2 rounded-full bg-slate-200/50 text-slate-800">
                {activeTypeQuestions.length}
              </span>
            </button>

            {distinctClauses.map((c) => {
              const count = activeTypeQuestions.filter((q) => q.clause === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedClause(c)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer truncate max-w-[220px] ${
                    selectedClause === c
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title={c}
                >
                  <span>{c}</span>
                  <span className="font-mono text-[11px] ml-1.5 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Severity, Add & Import Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search requirement, code, guidance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-48 sm:w-56"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical NC Only</option>
              <option value="MAJOR">Major NC</option>
              <option value="MINOR">Minor NC</option>
            </select>

            {/* Import Questions from other audit types */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
              title="Borrow/clone existing questions from other audit types"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>Import Questions</span>
            </button>

            {/* Add Question Button */}
            <button
              type="button"
              onClick={() => {
                setQuestionToEdit(null);
                setIsAddEditQuestionModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Batch Selection Banner */}
        {selectedQuestionIds.size > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <span className="font-bold">{selectedQuestionIds.size}</span> question(s) selected
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedQuestionIds(new Set())}
                className="px-2.5 py-1 rounded-lg text-slate-600 hover:bg-blue-100 font-semibold cursor-pointer"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({
                    isOpen: true,
                    type: 'batch_questions',
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-colors shadow-2xs"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected ({selectedQuestionIds.size})</span>
              </button>
            </div>
          </div>
        )}

        {/* Questions Table / List View */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className="cursor-pointer text-slate-500 hover:text-slate-800"
                  >
                    {selectedQuestionIds.size === filteredQuestions.length &&
                    filteredQuestions.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3 w-28">Code & Clause</th>
                <th className="p-3">Auditing Requirement & Verification Guidance</th>
                <th className="p-3 w-32 text-center">Max Marks</th>
                <th className="p-3 w-28 text-center">Severity</th>
                <th className="p-3 w-32 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center bg-white">
                    <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700 text-xs">
                      No questions found in {activeType.name}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Click "+ Add Question" to create one, or "Import Questions" to borrow from
                      another audit type.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.has(q.id);
                  return (
                    <tr
                      key={q.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectQuestion(q.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* Code & Clause */}
                      <td className="p-3 align-top">
                        <div className="font-mono text-xs font-bold text-blue-700">
                          {q.clauseNumber}
                        </div>
                        <div
                          className="text-[10px] text-slate-500 truncate max-w-[150px] mt-0.5"
                          title={q.clause}
                        >
                          {q.clause}
                        </div>
                        {q.subClauseTitle && (
                          <div
                            className="text-[9px] text-slate-400 truncate max-w-[150px]"
                            title={q.subClauseTitle}
                          >
                            {q.subClauseTitle}
                          </div>
                        )}
                      </td>

                      {/* Question Text & Guidance */}
                      <td className="p-3 align-top">
                        <div className="text-xs font-semibold text-slate-900 leading-snug">
                          {q.question}
                        </div>
                        {q.guidance && (
                          <div className="text-[11px] text-slate-500 mt-1.5 bg-slate-50 border border-slate-100 rounded-lg p-2 leading-relaxed">
                            <span className="font-bold text-slate-700">Verification Evidence: </span>
                            {q.guidance}
                          </div>
                        )}
                      </td>

                      {/* Max Marks with Inline Adjusters */}
                      <td className="p-3 align-top text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleQuickChangeMarks(q.id, -0.5)}
                            className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                            title="Decrease Marks"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-xs px-2 text-slate-900">
                            {q.maxMarks || 1}M
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickChangeMarks(q.id, 0.5)}
                            className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                            title="Increase Marks"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                          Question Weight
                        </span>
                      </td>

                      {/* Severity */}
                      <td className="p-3 align-top text-center">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            q.severityOnFailure === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 ring-1 ring-rose-400'
                              : q.severityOnFailure === 'MAJOR'
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {q.severityOnFailure || 'MAJOR'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setQuestionToEdit(q);
                              setIsAddEditQuestionModalOpen(true);
                            }}
                            className="p-1 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="Edit Question"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Clone/Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(q)}
                            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                            title="Duplicate Question"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                type: 'question',
                                question: q,
                              })
                            }
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900">{filteredQuestions.length}</span> of{' '}
            <span className="font-bold text-slate-900">{activeTypeQuestions.length}</span> total
            questions in {activeType.name}
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            Total Marks: <span className="font-bold text-blue-700">{currentTotalMarks.toFixed(1)}</span> • Pass:{' '}
            <span className="font-bold text-emerald-700">≥ {activeType.passMarksThreshold || 80}%</span>
          </div>
        </div>
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────────────────── */}
      {/* Add / Edit Audit Type Modal */}
      {isAddEditTypeModalOpen && (
        <AddEditAuditTypeModal
          isOpen={isAddEditTypeModalOpen}
          onClose={() => {
            setIsAddEditTypeModalOpen(false);
            setTypeToEdit(null);
          }}
          onSave={handleSaveAuditType}
          auditTypeToEdit={typeToEdit}
          existingTypes={auditTypes}
        />
      )}

      {/* Add / Edit Question Modal */}
      {isAddEditQuestionModalOpen && (
        <AddEditQuestionModal
          isOpen={isAddEditQuestionModalOpen}
          onClose={() => {
            setIsAddEditQuestionModalOpen(false);
            setQuestionToEdit(null);
          }}
          onSave={handleSaveQuestion}
          questionToEdit={questionToEdit}
          activeAuditType={activeType}
          existingClauses={distinctClauses}
        />
      )}

      {/* Import Questions Modal (Borrow from other audit types) */}
      {isImportModalOpen && (
        <ImportQuestionsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          targetAuditType={activeType}
          availableAuditTypes={auditTypes}
          allQuestions={questions}
          onImportQuestions={handleImportQuestions}
          showToast={showToast}
        />
      )}

      {/* Marking System Modal */}
      {isMarkingModalOpen && (
        <MarkingSystemModal
          isOpen={isMarkingModalOpen}
          onClose={() => setIsMarkingModalOpen(false)}
          auditType={activeType}
          questions={activeTypeQuestions}
          onSaveConfig={(updatedType, updatedQuestions) => {
            setAuditTypes((prev) => prev.map((t) => (t.id === updatedType.id ? updatedType : t)));
            if (updatedQuestions) {
              setQuestions((prev) => {
                const map = new Map(updatedQuestions.map((q) => [q.id, q]));
                return prev.map((q) => map.get(q.id) || q);
              });
            }
          }}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() =>
            setDeleteModal({
              isOpen: false,
              type: 'question',
            })
          }
          onConfirm={() => {
            if (deleteModal.type === 'question' && deleteModal.question) {
              handleDeleteQuestion(deleteModal.question);
            } else if (deleteModal.type === 'batch_questions') {
              handleBatchDeleteQuestions();
            } else if (deleteModal.type === 'audit_type' && deleteModal.auditType) {
              handleDeleteAuditType(deleteModal.auditType);
            }
          }}
          title={
            deleteModal.type === 'audit_type'
              ? 'Delete Audit Type?'
              : deleteModal.type === 'batch_questions'
              ? `Delete ${selectedQuestionIds.size} Selected Questions?`
              : 'Delete Question?'
          }
          message={
            deleteModal.type === 'audit_type'
              ? `Are you sure you want to delete the audit type "${deleteModal.auditType?.name}"? All associated questions will also be removed.`
              : deleteModal.type === 'batch_questions'
              ? `Are you sure you want to permanently delete ${selectedQuestionIds.size} questions from ${activeType.name}?`
              : `Are you sure you want to delete question "${deleteModal.question?.clauseNumber}"?`
          }
          itemDescription={
            deleteModal.type === 'question'
              ? `${deleteModal.question?.clauseNumber}: ${deleteModal.question?.question}`
              : deleteModal.type === 'audit_type'
              ? `${deleteModal.auditType?.code} — ${deleteModal.auditType?.name}`
              : undefined
          }
        />
      )}
    </div>
  );
}
