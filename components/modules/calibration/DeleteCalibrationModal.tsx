'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { CalibrationDevice } from '@/lib/types/modules';

interface DeleteCalibrationModalProps {
  isOpen: boolean;
  devices: CalibrationDevice[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteCalibrationModal({
  isOpen,
  devices,
  onConfirm,
  onCancel,
}: DeleteCalibrationModalProps) {
  if (!isOpen || devices.length === 0) return null;

  const count = devices.length;

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
              {count === 1 ? 'Delete Equipment Record' : `Delete ${count} Equipment Records`}
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
                {devices[0].deviceTag} ({devices[0].deviceName})
              </span>
            ) : (
              <span className="font-semibold text-slate-900">{count} equipment records</span>
            )}
            ? All associated calibration history, certificate records, and ISO traceability logs will be removed.
          </p>

          {count === 1 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Device Tag:</span>
                <span className="font-mono font-bold text-slate-900">{devices[0].deviceTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Brand & Model:</span>
                <span className="font-semibold text-slate-800">
                  {devices[0].brandName || 'Brand'} • {devices[0].model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Serial Number:</span>
                <span className="font-mono text-slate-700">{devices[0].serialNumber || 'SN-UNKNOWN'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Certificate:</span>
                <span className="font-mono text-slate-700">{devices[0].certificateNumber}</span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
            ⚠️ This action cannot be undone. Make sure backups are verified before purging calibration registry data.
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
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
