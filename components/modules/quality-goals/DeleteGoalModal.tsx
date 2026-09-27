'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { QualityGoal } from '@/lib/types/modules';

interface DeleteGoalModalProps {
  isOpen: boolean;
  goals: QualityGoal[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteGoalModal({
  isOpen,
  goals = [],
  onConfirm,
  onCancel,
}: DeleteGoalModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const count = goals.length;

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
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Confirm Quality Goal Deletion
              </h3>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                {count > 1 ? `${count} strategic objectives selected for deletion` : `1 strategic objective selected`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete {count > 1 ? 'these quality objectives' : 'this quality objective'}?
            All associated milestone roadmap progress, target thresholds, and linked operational action plans will be removed.
          </p>

          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1.5">
            {goals.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-mono font-bold text-slate-900 block truncate">
                    {g.goalCode || g.id}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate block">
                    {g.goalTitle}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-mono text-xs font-bold text-slate-800 block">
                    {g.percentageAchieved}% Reached
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Due: {g.deadline}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-snug">
              <strong>ISO 9001 Compliance Warning:</strong> Clause 6.2 (Quality objectives and planning to achieve them) requires active, documented objectives at all relevant functions, levels, and processes.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete {count > 1 ? `(${count}) Objectives` : 'Objective'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
