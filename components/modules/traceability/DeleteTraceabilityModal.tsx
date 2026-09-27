'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { TraceabilityChain } from '@/lib/types/modules';

interface DeleteTraceabilityModalProps {
  isOpen: boolean;
  records: TraceabilityChain[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTraceabilityModal({
  isOpen,
  records,
  onConfirm,
  onCancel,
}: DeleteTraceabilityModalProps) {
  if (!isOpen || records.length === 0) return null;

  const count = records.length;

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
              {count === 1 ? 'Delete Traceability Record' : `Delete ${count} Traceability Records`}
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
                {records[0].cartonBarcode} ({records[0].styleNumber})
              </span>
            ) : (
              <span className="font-semibold text-slate-900">{count} traceability records</span>
            )}
            ? All associated digital chain of custody records, yarn lot genealogy, barcode logs, and audit passports will be permanently removed.
          </p>

          {count === 1 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Carton Barcode:</span>
                <span className="font-mono font-bold text-blue-700">{records[0].cartonBarcode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Garment QR:</span>
                <span className="font-mono text-slate-800">{records[0].garmentSerial}</span>
              </div>
              {records[0].poNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">PO Number:</span>
                  <span className="font-mono font-semibold text-slate-800">{records[0].poNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Style / Buyer:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {records[0].styleNumber} • {records[0].buyer}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fiber Origin:</span>
                <span className="text-slate-700 truncate max-w-[200px]">{records[0].cottonOrigin}</span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
            ⚠️ This action cannot be undone. Make sure digital chain logs are exported if needed for compliance.
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
