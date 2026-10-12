'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Clock,
  Layers,
  Award,
  Sparkles,
} from 'lucide-react';
import { ProductionOrder } from '@/lib/types/erp';
import { useErpAuth } from '@/hooks/use-erp-auth';

interface ProductionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder | null;
  onSaveReview: (
    orderId: string,
    reviewData: {
      isReviewed: boolean;
      reviewStatus: 'PENDING' | 'REVIEWED';
      reviewedBy: string;
      reviewedById?: string;
      reviewedByRole: string;
      reviewedAt: string;
      reviewNotes: string;
    }
  ) => void;
}

export function ProductionReviewModal({
  isOpen,
  onClose,
  order,
  onSaveReview,
}: ProductionReviewModalProps) {
  const { user } = useErpAuth();

  const [reviewAction, setReviewAction] = useState<'REVIEWED' | 'PENDING'>('REVIEWED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial state when modal opens
  React.useEffect(() => {
    if (order) {
      if (order.isReviewed || order.reviewStatus === 'REVIEWED') {
        setReviewAction('REVIEWED');
        setReviewNotes(order.reviewNotes || '');
      } else {
        setReviewAction('REVIEWED');
        setReviewNotes('Verified hourly output sheets, rework alteration logs, and end-line QC checkpoints.');
      }
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const reviewerName = user?.name || 'Authorized QC Auditor';
  const reviewerRole = user?.role || 'QC Manager';
  const reviewerId = user?.id || 'usr_reviewer';
  const nowFormatted = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (reviewAction === 'REVIEWED') {
        onSaveReview(order.id, {
          isReviewed: true,
          reviewStatus: 'REVIEWED',
          reviewedBy: reviewerName,
          reviewedById: reviewerId,
          reviewedByRole: reviewerRole,
          reviewedAt: nowFormatted,
          reviewNotes: reviewNotes.trim() || 'Record verified according to factory standard operating procedures.',
        });
      } else {
        onSaveReview(order.id, {
          isReviewed: false,
          reviewStatus: 'PENDING',
          reviewedBy: '',
          reviewedById: undefined,
          reviewedByRole: '',
          reviewedAt: '',
          reviewNotes: reviewNotes.trim(),
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono tracking-tight">{order.orderNumber}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase">
                  Technical Review
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Production &amp; Quality Record Audit Sign-off
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Order Summary Snapshot */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">{order.styleName}</div>
                <div className="text-[11px] text-slate-500">
                  Buyer: <strong className="text-blue-700">{order.buyer}</strong> • Style Ref: {order.styleNumber || '-'}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {order.sewingLine} ({order.section || 'Sewing Floor'})
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-700">
                  {(order.completedQuantity || 0).toLocaleString()} pcs
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  DHU: {order.dhuRate ?? order.defectRate ?? 0}%
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Current Status:</span>
              {order.isReviewed || order.reviewStatus === 'REVIEWED' ? (
                <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  <CheckCircle2 className="w-3 h-3 text-purple-600" />
                  Reviewed by {order.reviewedBy} ({order.reviewedByRole})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Pending Review
                </span>
              )}
            </div>
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Review Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewAction('REVIEWED')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  reviewAction === 'REVIEWED'
                    ? 'border-purple-500 bg-purple-50/50 text-purple-900 ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  reviewAction === 'REVIEWED' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Mark Reviewed</div>
                  <div className="text-[10px] text-slate-500">Approve &amp; sign record</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReviewAction('PENDING')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  reviewAction === 'PENDING'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  reviewAction === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Pending Review</div>
                  <div className="text-[10px] text-slate-500">Leave unconfirmed</div>
                </div>
              </button>
            </div>
          </div>

          {/* Active Reviewer Credential Box */}
          <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                Reviewing Officer:
              </span>
              <span className="font-bold font-mono text-purple-800">{reviewerName}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>Designation / Role:</span>
              <span className="font-bold text-slate-800">{reviewerRole}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>Timestamp:</span>
              <span className="font-mono text-slate-500">{nowFormatted}</span>
            </div>
          </div>

          {/* Review Remarks / Notes Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Review Notes &amp; Observations
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Verified hourly line outputs, DHU rate, and inline quality checklists. Approved for daily report consolidation."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-[10px] text-slate-400">
              These notes and your user name/role will be permanently linked to this record and visible in the Details and Export pages.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{reviewAction === 'REVIEWED' ? 'Confirm & Sign Review' : 'Save as Pending'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
