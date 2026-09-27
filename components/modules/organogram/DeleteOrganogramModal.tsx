'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { OrganogramNode } from '@/lib/types/modules';

interface DeleteOrganogramModalProps {
  isOpen: boolean;
  nodes: OrganogramNode[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteOrganogramModal({
  isOpen,
  nodes = [],
  onConfirm,
  onCancel,
}: DeleteOrganogramModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const count = nodes.length;

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
                Confirm Hierarchy Node Deletion
              </h3>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                {count > 1 ? `${count} leadership nodes selected` : `1 leadership node selected`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-slate-900">
              {count > 1 ? `these ${count} organization roles` : `this organization role`}
            </span>
            ? Any subordinates directly reporting to this position will need their reporting line updated.
          </p>

          {/* List of items being deleted */}
          {nodes.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100">
              {nodes.map((n) => (
                <div key={n.id} className="p-2.5 flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {n.name}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {n.title} • {n.department}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100 shrink-0">
                    {n.grade}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-amber-800 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Please verify that signing authorities and quality escalation chains have an active interim delegate assigned.
            </span>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs hover:shadow-md cursor-pointer focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
