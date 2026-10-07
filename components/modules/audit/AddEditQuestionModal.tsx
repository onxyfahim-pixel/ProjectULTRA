'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileQuestion,
  HelpCircle,
  AlertTriangle,
  ShieldAlert,
  Check,
  Award,
  Hash,
  Tag,
} from 'lucide-react';
import { ManagedAuditQuestion, AuditTypeDefinition } from '@/lib/types/modules';

interface AddEditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: ManagedAuditQuestion) => void;
  questionToEdit?: ManagedAuditQuestion | null;
  activeAuditType: AuditTypeDefinition;
  existingClauses: string[];
}

export function AddEditQuestionModal({
  isOpen,
  onClose,
  onSave,
  questionToEdit,
  activeAuditType,
  existingClauses,
}: AddEditQuestionModalProps) {
  const isEditing = Boolean(questionToEdit);

  const [clause, setClause] = useState('');
  const [customClause, setCustomClause] = useState('');
  const [isCustomClause, setIsCustomClause] = useState(false);

  const [clauseNumber, setClauseNumber] = useState('');
  const [subClauseTitle, setSubClauseTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [guidance, setGuidance] = useState('');
  const [maxMarks, setMaxMarks] = useState<number>(5);
  const [severityOnFailure, setSeverityOnFailure] = useState<'MINOR' | 'MAJOR' | 'CRITICAL'>('MAJOR');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questionToEdit) {
      if (existingClauses.includes(questionToEdit.clause)) {
        setClause(questionToEdit.clause);
        setIsCustomClause(false);
      } else {
        setClause('__custom__');
        setCustomClause(questionToEdit.clause);
        setIsCustomClause(true);
      }
      setClauseNumber(questionToEdit.clauseNumber);
      setSubClauseTitle(questionToEdit.subClauseTitle || '');
      setQuestion(questionToEdit.question);
      setGuidance(questionToEdit.guidance || '');
      setMaxMarks(questionToEdit.maxMarks || 5);
      setSeverityOnFailure(questionToEdit.severityOnFailure || 'MAJOR');
    } else {
      const defaultClause = existingClauses[0] || 'General Audit Requirements';
      setClause(defaultClause);
      setCustomClause('');
      setIsCustomClause(false);
      setClauseNumber(`${activeAuditType.code || 'AUD'}-${Date.now().toString().slice(-3)}`);
      setSubClauseTitle('');
      setQuestion('');
      setGuidance('');
      setMaxMarks(5);
      setSeverityOnFailure('MAJOR');
    }
    setError(null);
  }, [questionToEdit, activeAuditType, existingClauses, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClause = isCustomClause ? customClause.trim() : clause.trim();

    if (!finalClause) {
      setError('Please provide or select a Clause / Section.');
      return;
    }
    if (!clauseNumber.trim()) {
      setError('Please provide a Clause Number / Code (e.g. SAF-1.4).');
      return;
    }
    if (!question.trim()) {
      setError('Please enter the question text / auditing requirement.');
      return;
    }

    const savedItem: ManagedAuditQuestion = {
      id: questionToEdit?.id || `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      auditTypeId: activeAuditType.id,
      clause: finalClause,
      clauseNumber: clauseNumber.trim(),
      subClauseTitle: subClauseTitle.trim() || `Section ${clauseNumber.trim()} Requirement`,
      question: question.trim(),
      guidance: guidance.trim() || undefined,
      maxMarks: Math.max(0.5, Number(maxMarks) || 1),
      severityOnFailure,
      status: questionToEdit?.status || 'CONFORMITY',
      sortOrder: questionToEdit?.sortOrder || Date.now(),
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Edit Audit Question' : 'Add New Question'}
              </h3>
              <p className="text-xs text-slate-500">
                Belongs to: <span className="font-semibold text-slate-800">{activeAuditType.name}</span>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Clause Section Dropdown + Custom */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">
              Clause / Section <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={isCustomClause ? '__custom__' : clause}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomClause(true);
                  } else {
                    setIsCustomClause(false);
                    setClause(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {existingClauses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">+ Add New Custom Clause / Section...</option>
              </select>

              {isCustomClause ? (
                <input
                  type="text"
                  value={customClause}
                  onChange={(e) => setCustomClause(e.target.value)}
                  placeholder="Enter new clause or section title..."
                  className="w-full px-3 py-2 rounded-xl border border-blue-400 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              ) : (
                <div className="text-[11px] text-slate-500 flex items-center px-1">
                  Section grouping for question sorting and scoring.
                </div>
              )}
            </div>
          </div>

          {/* Clause Number & Sub-Clause Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Clause / Question Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clauseNumber}
                  onChange={(e) => setClauseNumber(e.target.value)}
                  placeholder="e.g. SAF-1.2, 8.5.1, 5S-2.1"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Sub-Clause / Topic Title</label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={subClauseTitle}
                  onChange={(e) => setSubClauseTitle(e.target.value)}
                  placeholder="e.g. Emergency Exit Clearance"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Question & Auditing Requirement <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="State the explicit audit requirement or verification question that the auditor will examine..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              required
            />
          </div>

          {/* Guidance */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Audit Guidance / Verification Criteria (Evidence Checklist)
            </label>
            <textarea
              rows={2}
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              placeholder="What evidence should the auditor verify? (e.g. Check inspection log cards, test emergency stop switch, verify SOP registers)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Marking System & Severity Controls */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>Marking Weightage & Non-Conformance Classification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Question Max Marks (Weightage)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="flex items-center gap-1">
                    {[1, 2, 5, 10].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMaxMarks(preset)}
                        className={`px-2 py-1 text-[10px] font-mono font-bold rounded-md border transition-colors cursor-pointer ${
                          maxMarks === preset
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {preset}M
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Conformity earns 100% of this value; Minor NC earns 75%; Major earns 50%.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Severity Risk on Failure
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSeverityOnFailure('MINOR')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                      severityOnFailure === 'MINOR'
                        ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    Minor NC
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeverityOnFailure('MAJOR')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                      severityOnFailure === 'MAJOR'
                        ? 'bg-orange-100 text-orange-900 border-orange-300 ring-2 ring-orange-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50'
                    }`}
                  >
                    Major NC
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeverityOnFailure('CRITICAL')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                      severityOnFailure === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-900 border-rose-300 ring-2 ring-rose-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    Critical NC
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {severityOnFailure === 'CRITICAL'
                    ? '⚠️ Critical: Triggers immediate overall audit failure!'
                    : severityOnFailure === 'MAJOR'
                    ? 'Significant non-conformance requiring priority CAPA.'
                    : 'Procedural isolated lapse with low direct risk.'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Question Changes' : 'Add Question'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
