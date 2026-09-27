'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, GraduationCap, FileText, ClipboardCheck } from 'lucide-react';
import { TrainingMatrixItem, TrainingExamPaper, TrainingEvaluationRecord } from '@/lib/types/modules';

interface DeleteTrainingModalProps {
  isOpen: boolean;
  itemType: 'COURSE' | 'EXAM' | 'EVALUATION';
  items: any[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTrainingModal({
  isOpen,
  itemType,
  items = [],
  onConfirm,
  onCancel,
}: DeleteTrainingModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const count = items.length;
  const typeLabel =
    itemType === 'COURSE'
      ? 'Training Course'
      : itemType === 'EXAM'
      ? 'Exam Paper'
      : 'Evaluation Record';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 bg-rose-50/70 border-b border-rose-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {count === 1 ? `Delete ${typeLabel}` : `Delete ${count} ${typeLabel}s`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                This action will permanently delete the selected training record(s) from the QMS competency database.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3 max-h-60 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-700">
            Are you sure you want to remove the following {count === 1 ? typeLabel.toLowerCase() : `${typeLabel.toLowerCase()}s`}?
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                    {itemType === 'COURSE' ? (
                      <GraduationCap className="w-3.5 h-3.5" />
                    ) : itemType === 'EXAM' ? (
                      <FileText className="w-3.5 h-3.5" />
                    ) : (
                      <ClipboardCheck className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {item.courseCode || item.examCode || item.evaluationCode} — {item.title || item.courseTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.trainerName || item.createdBy || item.evaluatorName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
            <strong>Warning:</strong> Deleting certified training or evaluation records may compromise ISO 9001 Clause 7.2 (Competency) auditor verification trails.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
