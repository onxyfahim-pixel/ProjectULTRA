'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Award, ShieldAlert } from 'lucide-react';
import { FactoryCertificate } from '@/lib/types/modules';

interface DeleteCertificateModalProps {
  isOpen: boolean;
  certificates: FactoryCertificate[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteCertificateModal({
  isOpen,
  certificates,
  onConfirm,
  onCancel,
}: DeleteCertificateModalProps) {
  if (!isOpen || certificates.length === 0) return null;

  const isBatch = certificates.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isBatch ? `Delete ${certificates.length} Certificates?` : 'Delete Certificate?'}
              </h3>
              <p className="text-[11px] text-slate-500">
                This compliance accreditation will be permanently removed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Compliance Warning</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Deleting active factory certificates may impact buyer audit readiness and cause PO compliance validation failures in export shipments.
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-slate-900 block truncate">
                      {cert.certCode} • {cert.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {cert.issuingBody} ({cert.certificateNumber})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                  {cert.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
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
