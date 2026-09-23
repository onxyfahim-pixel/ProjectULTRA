'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { CapaItem } from '@/lib/types/modules';

interface DeleteCapaModalProps {
  isOpen: boolean;
  capas: CapaItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteCapaModal({
  isOpen,
  capas,
  onConfirm,
  onCancel,
}: DeleteCapaModalProps) {
  if (!isOpen || capas.length === 0) return null;

  const count = capas.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-600">
            <div className="p-2 rounded-xl bg-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {count === 1 ? 'Delete CAPA Record' : `Delete ${count} CAPA Records`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            {count === 1 ? (
              <span className="font-semibold text-slate-900">
                {capas[0].capaNumber} ({capas[0].issueTitle})
              </span>
            ) : (
              <span className="font-semibold text-slate-900">{count} CAPA records</span>
            )}
            ? All associated 5 Whys analysis, Ishikawa fishbone factors, containment logs, and photographic completion evidence will be removed.
          </p>

          {count === 1 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">CAPA Ref:</span>
                <span className="font-mono font-bold text-blue-700">{capas[0].capaNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source:</span>
                <span className="font-semibold text-slate-800">
                  {capas[0].source.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700">{capas[0].department || 'General QA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Responsible Lead:</span>
                <span className="text-slate-700">{capas[0].responsiblePerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-mono font-bold text-rose-600">
                  {capas[0].status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>This action cannot be undone. CAPA records are audit-controlled QMS documents under ISO 9001 Clause 10.2.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm Deletion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
