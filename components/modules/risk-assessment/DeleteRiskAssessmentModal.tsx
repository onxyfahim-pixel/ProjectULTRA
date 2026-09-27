'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { RiskFmeaItem } from '@/lib/types/modules';

interface DeleteRiskAssessmentModalProps {
  isOpen: boolean;
  records: RiskFmeaItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteRiskAssessmentModal({
  isOpen,
  records,
  onConfirm,
  onCancel,
}: DeleteRiskAssessmentModalProps) {
  if (!isOpen || records.length === 0) return null;

  const count = records.length;
  const single = records[0];

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
              {count === 1 ? 'Delete Risk Assessment' : `Delete ${count} Risk Assessments`}
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
                {single.fmeaCode} ({single.title || single.processStep})
              </span>
            ) : (
              <span className="font-semibold text-slate-900">{count} risk assessment records</span>
            )}
            ? All associated FMEA scoring, mitigation protocols, and uploaded process/product images will be permanently removed.
          </p>

          {count === 1 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Assessment Code:</span>
                <span className="font-mono font-bold text-blue-700">{single.fmeaCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assessment Type:</span>
                <span className="font-semibold text-slate-800">
                  {single.assessmentType === 'PRODUCT'
                    ? 'Product Risk'
                    : single.assessmentType === 'CRITICAL_PROCESS'
                    ? 'Critical Process Risk'
                    : 'Process Risk'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Process Step / Scope:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {single.processStep}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RPN Score & Level:</span>
                <span
                  className={`font-mono font-bold ${
                    single.rpn >= 100 ? 'text-rose-600' : single.rpn >= 60 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  RPN {single.rpn} • {single.rpn >= 100 ? 'HIGH / CRITICAL' : single.rpn >= 60 ? 'MEDIUM' : 'LOW'}
                </span>
              </div>
              {single.assessmentDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Assessment Date:</span>
                  <span className="font-mono text-slate-700">{single.assessmentDate}</span>
                </div>
              )}
            </div>
          )}

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
            ⚠️ This action cannot be undone. Ensure risk mitigation logs are archived before deletion.
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
