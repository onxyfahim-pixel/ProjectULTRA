'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { CommunicationNotice } from '@/lib/types/modules';

interface DeleteNoticeModalProps {
  isOpen: boolean;
  notices: CommunicationNotice[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteNoticeModal({
  isOpen,
  notices,
  onConfirm,
  onCancel,
}: DeleteNoticeModalProps) {
  if (!isOpen || notices.length === 0) return null;

  const isMultiple = notices.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isMultiple ? `Delete ${notices.length} Bulletins?` : 'Delete Communication Bulletin?'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Action requires compliance authorization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {isMultiple ? (
              <>
                You are about to permanently remove <strong className="text-slate-900">{notices.length}</strong> communication circulars and associated floor acknowledgments from the central factory log.
              </>
            ) : (
              <>
                Are you sure you want to delete bulletin <strong className="font-mono text-slate-900">{notices[0].noticeNumber}</strong>?
                <br />
                <span className="italic text-slate-500 block mt-1">"{notices[0].title}"</span>
              </>
            )}
          </p>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 leading-snug">
            ⚠️ <strong>ISO 9001 Notice:</strong> Deleting published quality alerts or buyer advisories may affect traceability audits if supervisors have already acknowledged containment procedures.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Deletion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
