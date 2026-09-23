'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { QualityAudit } from '@/lib/types/modules';

interface DeleteAuditModalProps {
  isOpen: boolean;
  audits: QualityAudit[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteAuditModal({
  isOpen,
  audits,
  onConfirm,
  onCancel,
}: DeleteAuditModalProps) {
  if (!isOpen || audits.length === 0) return null;

  const count = audits.length;

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
              {count === 1 ? 'Delete Audit Record' : `Delete ${count} Audit Records`}
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
                {audits[0].auditCode} ({audits[0].standard})
              </span>
            ) : (
              <span className="font-semibold text-slate-900">{count} audit records</span>
            )}
            ? All associated checklist evaluation entries, evidence photos, uploaded reports, and scoring history will be removed.
          </p>

          {count === 1 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Audit Code:</span>
                <span className="font-mono font-bold text-blue-700">{audits[0].auditCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Standard / Scope:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {audits[0].standard}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auditor:</span>
                <span className="text-slate-700">{audits[0].auditorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Score & Result:</span>
                <span className={`font-mono font-bold ${(audits[0].obtainedMarks ?? audits[0].scorePercentage) >= 80 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {audits[0].scorePercentage}% • {(audits[0].obtainedMarks ?? audits[0].scorePercentage) >= 80 ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
            ⚠️ This action cannot be undone. Make sure audit compliance logs are archived before deleting.
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
}
