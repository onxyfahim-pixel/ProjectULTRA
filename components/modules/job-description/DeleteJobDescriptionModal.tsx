'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, Briefcase, User } from 'lucide-react';
import { JobDescriptionItem } from '@/lib/types/modules';

interface DeleteJobDescriptionModalProps {
  isOpen: boolean;
  jobs: JobDescriptionItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteJobDescriptionModal({
  isOpen,
  jobs = [],
  onConfirm,
  onCancel,
}: DeleteJobDescriptionModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const count = jobs.length;

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
                {count === 1 ? 'Delete Job Description' : `Delete ${count} Job Descriptions`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                This action will permanently remove the role profile and ISO 9001 Clause 5.3 accountability record.
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

        {/* Modal Body: Role List */}
        <div className="p-5 space-y-3 max-h-60 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-700">
            Are you sure you want to remove the following {count === 1 ? 'job description' : 'job descriptions'}?
          </p>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {job.roleCode} — {job.title}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{job.incumbentName || 'Vacant Role'}</span>
                      {job.companyIdNo && (
                        <span className="font-bold text-slate-700">({job.companyIdNo})</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold shrink-0 ml-2">
                  {job.level}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
            <strong>Warning:</strong> Deleting signed job descriptions may generate findings during ISO 9001 Clause 7.2 (Competence) and buyer social compliance audits.
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
