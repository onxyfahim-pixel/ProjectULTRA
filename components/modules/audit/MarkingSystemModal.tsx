'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Percent,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { AuditTypeDefinition, ManagedAuditQuestion } from '@/lib/types/modules';

interface MarkingSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditType: AuditTypeDefinition;
  questions: ManagedAuditQuestion[];
  onSaveConfig: (
    updatedType: AuditTypeDefinition,
    updatedQuestions?: ManagedAuditQuestion[]
  ) => void;
  showToast: (msg: string) => void;
}

export function MarkingSystemModal({
  isOpen,
  onClose,
  auditType,
  questions,
  onSaveConfig,
  showToast,
}: MarkingSystemModalProps) {
  const [totalAvailableMarks, setTotalAvailableMarks] = useState<number>(
    auditType.totalAvailableMarks || 100
  );
  const [passMarksThreshold, setPassMarksThreshold] = useState<number>(
    auditType.passMarksThreshold || 80
  );
  const [criticalNcFailsAudit, setCriticalNcFailsAudit] = useState<boolean>(
    auditType.criticalNcFailsAudit !== false
  );

  // Batch Marks operation state
  const [batchAction, setBatchAction] = useState<'none' | 'distribute' | 'fixed'>('none');
  const [fixedMarksVal, setFixedMarksVal] = useState<number>(5);

  useEffect(() => {
    setTotalAvailableMarks(auditType.totalAvailableMarks || 100);
    setPassMarksThreshold(auditType.passMarksThreshold || 80);
    setCriticalNcFailsAudit(auditType.criticalNcFailsAudit !== false);
    setBatchAction('none');
  }, [auditType, isOpen]);

  if (!isOpen) return null;

  const currentQuestionsSum = questions.reduce((sum, q) => sum + (q.maxMarks || 1), 0);

  const handleSave = () => {
    let updatedQuestions: ManagedAuditQuestion[] | undefined = undefined;

    if (batchAction === 'distribute' && questions.length > 0) {
      const perQuestion = Number((totalAvailableMarks / questions.length).toFixed(2));
      updatedQuestions = questions.map((q) => ({
        ...q,
        maxMarks: perQuestion,
      }));
    } else if (batchAction === 'fixed') {
      const val = Math.max(0.5, Number(fixedMarksVal) || 1);
      updatedQuestions = questions.map((q) => ({
        ...q,
        maxMarks: val,
      }));
    }

    const updatedType: AuditTypeDefinition = {
      ...auditType,
      totalAvailableMarks: Number(totalAvailableMarks) || 100,
      passMarksThreshold: Number(passMarksThreshold) || 80,
      criticalNcFailsAudit,
      updatedAt: new Date().toISOString(),
    };

    onSaveConfig(updatedType, updatedQuestions);
    showToast(`Marking system updated for ${auditType.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Marking System & Scoring Parameters
              </h3>
              <p className="text-xs text-slate-500">
                Configure scale, passing benchmark, and weightage for{' '}
                <span className="font-bold text-slate-800">{auditType.name}</span>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Current Status Overview */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Question Count
              </div>
              <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                {questions.length}
              </div>
              <div className="text-[10px] text-slate-400">Total in Checklist</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Current Sum of Marks
              </div>
              <div className="text-lg font-mono font-bold text-blue-600 mt-0.5">
                {currentQuestionsSum.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-400">Across All Questions</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Target Passing Marks
              </div>
              <div className="text-lg font-mono font-bold text-emerald-600 mt-0.5">
                {passMarksThreshold}%
              </div>
              <div className="text-[10px] text-slate-400">Pass Benchmark</div>
            </div>
          </div>

          {/* Scale & Passing Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Target Total Scale (Standard 100 Marks)
              </label>
              <input
                type="number"
                min={10}
                max={1000}
                value={totalAvailableMarks}
                onChange={(e) => setTotalAvailableMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Standard industry audits are evaluated on a 100-mark scale.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Passing Benchmark Percentage (%)
              </label>
              <input
                type="number"
                min={50}
                max={99}
                value={passMarksThreshold}
                onChange={(e) => setPassMarksThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Audits meeting or exceeding this % receive a Pass verdict.
              </span>
            </div>
          </div>

          {/* Critical NC Immediate Failure Rule */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Critical Non-Conformance Auto-Fail Rule</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                When enabled, if even 1 Critical Non-Conformance (e.g. locked emergency exits, missing
                machine mesh glove, child labor) is discovered, the entire audit is marked Failed
                immediately regardless of numerical percentage score.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={criticalNcFailsAudit}
                onChange={(e) => setCriticalNcFailsAudit(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {/* 5-Tier Scoring Logic Reference */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Scoring Multipliers & Non-Conformance Penalty Rules</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-800 block">Conformity</span>
                <span className="font-mono text-xs font-black text-emerald-600 block mt-0.5">
                  100%
                </span>
                <span className="text-[10px] text-emerald-700">Full Question Marks</span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-800 block">Minor NC</span>
                <span className="font-mono text-xs font-black text-amber-600 block mt-0.5">
                  75%
                </span>
                <span className="text-[10px] text-amber-700">25% deduction</span>
              </div>

              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200">
                <span className="font-bold text-orange-800 block">Major NC</span>
                <span className="font-mono text-xs font-black text-orange-600 block mt-0.5">
                  50%
                </span>
                <span className="text-[10px] text-orange-700">50% deduction</span>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="font-bold text-rose-800 block">Critical NC</span>
                <span className="font-mono text-xs font-black text-rose-600 block mt-0.5">0%</span>
                <span className="text-[10px] text-rose-700">+ Auto-Fail Trigger</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Questions marked N/A are fairly excluded from the calculation denominator.
            </p>
          </div>

          {/* Batch Marks Tools */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
            <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Batch Questions Marks Distribution (Optional)</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="radio"
                  name="batchMarksOption"
                  checked={batchAction === 'none'}
                  onChange={() => setBatchAction('none')}
                  className="accent-blue-600"
                />
                <span>Leave existing question marks unchanged</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="radio"
                  name="batchMarksOption"
                  checked={batchAction === 'distribute'}
                  onChange={() => setBatchAction('distribute')}
                  className="accent-blue-600"
                />
                <span>
                  Automatically distribute {totalAvailableMarks} marks evenly across all{' '}
                  {questions.length} questions (~
                  {questions.length > 0 ? (totalAvailableMarks / questions.length).toFixed(2) : 0}{' '}
                  marks each)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="batchMarksOption"
                    checked={batchAction === 'fixed'}
                    onChange={() => setBatchAction('fixed')}
                    className="accent-blue-600"
                  />
                  <span>Set all questions to a fixed weight:</span>
                </label>
                {batchAction === 'fixed' && (
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    max={50}
                    value={fixedMarksVal}
                    onChange={(e) => setFixedMarksVal(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs font-bold bg-white"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Marking Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
