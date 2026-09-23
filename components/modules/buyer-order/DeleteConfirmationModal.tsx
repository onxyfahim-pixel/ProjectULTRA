'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  items?: DeleteConfirmationItem[];
  itemTypeLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  title = 'Confirm Deletion',
  message,
  items = [],
  itemTypeLabel = 'record',
  confirmLabel = 'Confirm Delete',
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const count = items.length;

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
        aria-labelledby="delete-dialog-title"
      >
        {/* Modal Header */}
        <div className="p-5 bg-rose-50/70 border-b border-rose-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                {count > 1 ? `${count} ${itemTypeLabel}s selected` : `1 ${itemTypeLabel} selected`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {message || (
              <>
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-slate-900">
                  {count > 1 ? `these ${count} ${itemTypeLabel}s` : `this ${itemTypeLabel}`}
                </span>
                ? This action cannot be reversed, and all associated tracking data, BOM records, and specifications will be removed.
              </>
            )}
          </p>

          {/* List of items being deleted */}
          {items.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="p-2.5 flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-slate-900 truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  {item.value && (
                    <div className="text-right shrink-0 font-mono font-semibold text-slate-700 text-[11px]">
                      {item.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-amber-800 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Please double-check the selection before confirming. Export any required purchase order records if you need an audit trail.
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
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
