'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Search,
  Filter,
  CheckSquare,
  Square,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Award,
  Check,
  Building2,
  Users,
  Sparkles,
  Info,
} from 'lucide-react';
import { ManagedAuditQuestion, AuditTypeDefinition } from '@/lib/types/modules';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAuditType: AuditTypeDefinition;
  availableAuditTypes: AuditTypeDefinition[];
  allQuestions: ManagedAuditQuestion[];
  onImportQuestions: (importedQuestions: ManagedAuditQuestion[]) => void;
  showToast: (msg: string) => void;
}

export function ImportQuestionsModal({
  isOpen,
  onClose,
  targetAuditType,
  availableAuditTypes,
  allQuestions,
  onImportQuestions,
  showToast,
}: ImportQuestionsModalProps) {
  // Filter out the target audit type from source options
  const sourceAuditTypes = useMemo(() => {
    return availableAuditTypes.filter((t) => t.id !== targetAuditType.id);
  }, [availableAuditTypes, targetAuditType]);

  const [selectedSourceTypeId, setSelectedSourceTypeId] = useState<string>(
    sourceAuditTypes[0]?.id || ''
  );
  const [clauseFilter, setClauseFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Import options
  const [assignToClauseOption, setAssignToClauseOption] = useState<'keep' | 'custom'>('keep');
  const [targetCustomClause, setTargetCustomClause] = useState<string>('');
  const [overrideMarksOption, setOverrideMarksOption] = useState<'keep' | 'override'>('keep');
  const [overrideMarksValue, setOverrideMarksValue] = useState<number>(5);

  // Available questions from selected source type
  const sourceQuestions = useMemo(() => {
    return allQuestions.filter((q) => q.auditTypeId === selectedSourceTypeId);
  }, [allQuestions, selectedSourceTypeId]);

  // Distinct clauses in the source type
  const sourceClauses = useMemo(() => {
    const set = new Set<string>();
    sourceQuestions.forEach((q) => {
      if (q.clause) set.add(q.clause);
    });
    return Array.from(set);
  }, [sourceQuestions]);

  // Filtered source questions
  const filteredQuestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sourceQuestions.filter((item) => {
      const matchesClause = clauseFilter === 'ALL' || item.clause === clauseFilter;
      const matchesSearch =
        !q ||
        item.clauseNumber.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        (item.subClauseTitle && item.subClauseTitle.toLowerCase().includes(q)) ||
        (item.guidance && item.guidance.toLowerCase().includes(q));
      return matchesClause && matchesSearch;
    });
  }, [sourceQuestions, clauseFilter, searchQuery]);

  if (!isOpen) return null;

  const currentSourceType = availableAuditTypes.find((t) => t.id === selectedSourceTypeId);

  const toggleSelect = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      filteredQuestions.forEach((q) => next.add(q.id));
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      filteredQuestions.forEach((q) => next.delete(q.id));
      return next;
    });
  };

  const handleExecuteImport = () => {
    if (selectedQuestionIds.size === 0) {
      showToast('Please select at least one question to import.');
      return;
    }

    const questionsToClone = allQuestions.filter((q) => selectedQuestionIds.has(q.id));

    const clonedQuestions: ManagedAuditQuestion[] = questionsToClone.map((orig, idx) => {
      const finalClause =
        assignToClauseOption === 'custom' && targetCustomClause.trim()
          ? targetCustomClause.trim()
          : orig.clause;

      const finalMarks =
        overrideMarksOption === 'override' ? Number(overrideMarksValue) || 1 : orig.maxMarks;

      return {
        id: `imp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        auditTypeId: targetAuditType.id,
        clause: finalClause,
        clauseNumber: orig.clauseNumber,
        subClauseTitle: orig.subClauseTitle,
        question: orig.question,
        guidance: orig.guidance,
        maxMarks: finalMarks,
        severityOnFailure: orig.severityOnFailure || 'MAJOR',
        status: 'CONFORMITY',
        sortOrder: Date.now() + idx,
      };
    });

    onImportQuestions(clonedQuestions);
    showToast(
      `Successfully imported ${clonedQuestions.length} question(s) into ${targetAuditType.name}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Copy className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Import / Borrow Questions from Other Audit Types
              </h3>
              <p className="text-xs text-slate-500">
                Target Audit: <span className="font-bold text-slate-800">{targetAuditType.name}</span>{' '}
                ({targetAuditType.code})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Controls: Choose Source Type & Search Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Source Audit Type Dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Select Source Audit Type
              </label>
              <select
                value={selectedSourceTypeId}
                onChange={(e) => {
                  setSelectedSourceTypeId(e.target.value);
                  setClauseFilter('ALL');
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                {sourceAuditTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Source Clause Filter */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Filter by Clause</label>
              <select
                value={clauseFilter}
                onChange={(e) => setClauseFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Clauses ({sourceQuestions.length} Questions)</option>
                {sourceClauses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Search Keywords</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search requirement, clause, guidance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Selection Bar & Count Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">
                Found <span className="font-bold text-slate-900">{filteredQuestions.length}</span> question(s)
              </span>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Select All ({filteredQuestions.length})
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Deselect All
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl text-blue-800 font-bold">
              <Check className="w-3.5 h-3.5 text-blue-600" />
              <span>{selectedQuestionIds.size} Selected for Import</span>
            </div>
          </div>
        </div>

        {/* Questions List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <div className="font-bold text-slate-700 text-xs">No questions found matching criteria</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Try selecting a different source audit type or clearing your search filter.
              </p>
            </div>
          ) : (
            filteredQuestions.map((item) => {
              const isSelected = selectedQuestionIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        {item.clauseNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[280px]">
                        {item.clause}
                      </span>
                      {item.subClauseTitle && (
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                          • {item.subClauseTitle}
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.maxMarks} Marks
                      </span>
                      {item.severityOnFailure === 'CRITICAL' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Critical NC
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-medium text-slate-900 leading-snug">
                      {item.question}
                    </div>

                    {item.guidance && (
                      <div className="text-[11px] text-slate-500 mt-1 leading-relaxed bg-slate-100/70 px-2.5 py-1 rounded-lg">
                        <span className="font-semibold text-slate-700">Verification: </span>
                        {item.guidance}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Import Preferences Bar (Clause & Marks Customization) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Clause Assignment Preference */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Clause Destination in {targetAuditType.name}
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="assignClause"
                    checked={assignToClauseOption === 'keep'}
                    onChange={() => setAssignToClauseOption('keep')}
                    className="accent-blue-600"
                  />
                  <span>Keep Original Clause Names</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="assignClause"
                    checked={assignToClauseOption === 'custom'}
                    onChange={() => setAssignToClauseOption('custom')}
                    className="accent-blue-600"
                  />
                  <span>Assign to New Clause</span>
                </label>
              </div>

              {assignToClauseOption === 'custom' && (
                <input
                  type="text"
                  placeholder="e.g. Imported Verification Requirements"
                  value={targetCustomClause}
                  onChange={(e) => setTargetCustomClause(e.target.value)}
                  className="mt-1.5 w-full px-3 py-1.5 rounded-xl border border-blue-400 text-xs text-slate-800 bg-white"
                />
              )}
            </div>

            {/* Marks Assignment Preference */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Marks Weightage</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="overrideMarks"
                    checked={overrideMarksOption === 'keep'}
                    onChange={() => setOverrideMarksOption('keep')}
                    className="accent-blue-600"
                  />
                  <span>Keep Source Marks</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="overrideMarks"
                    checked={overrideMarksOption === 'override'}
                    onChange={() => setOverrideMarksOption('override')}
                    className="accent-blue-600"
                  />
                  <span>Set Fixed Marks:</span>
                </label>
                {overrideMarksOption === 'override' && (
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={overrideMarksValue}
                    onChange={(e) => setOverrideMarksValue(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs font-bold bg-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <div className="text-xs text-slate-500">
              Selected: <span className="font-bold text-slate-900">{selectedQuestionIds.size}</span> question(s)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={selectedQuestionIds.size === 0}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  selectedQuestionIds.size > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Import {selectedQuestionIds.size} Question(s)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
