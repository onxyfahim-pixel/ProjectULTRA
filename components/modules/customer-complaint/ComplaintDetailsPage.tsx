'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  DollarSign,
  FileText,
  User,
  Clock,
  ShieldAlert,
  Layers,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  Edit,
  Trash2,
  Copy,
  Check,
  MapPin,
  Tag,
  ShieldCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { CustomerComplaint } from '@/lib/types/modules';
import { StatusBadge } from '@/components/ui/Badge';

interface ComplaintDetailsPageProps {
  complaint: CustomerComplaint;
  onBack: () => void;
  onEdit: (complaint: CustomerComplaint) => void;
  onDuplicate: (complaint: CustomerComplaint) => void;
  onDelete: (complaint: CustomerComplaint) => void;
  showToast?: (msg: string) => void;
}

export function ComplaintDetailsPage({
  complaint,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  showToast,
}: ComplaintDetailsPageProps) {
  const [activeTab, setActiveTab] = useState<'investigation' | 'capa' | 'settlement'>('investigation');

  const defectCategoryLabel = complaint.defectCategory.replace(/_/g, ' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Action Bar matching Buyer & Order module design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Back to Claims Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {complaint.complaintNumber}
              </span>
              <span className="text-xs font-medium text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-900">{complaint.buyerName}</span>
              <span className="text-xs font-medium text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-500">{complaint.poNumber}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {defectCategoryLabel} — Style {complaint.styleNumber}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(complaint)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Claim</span>
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => onDuplicate(complaint)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(complaint)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl border border-rose-200 bg-rose-50 p-2 shrink-0 flex items-center justify-center text-rose-600 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{complaint.complaintNumber}</h3>
                <span
                  className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                    complaint.severity === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : complaint.severity === 'MAJOR'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}
                >
                  {complaint.severity} Severity
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    complaint.status === 'SETTLED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : complaint.status === 'CAPA_ISSUED'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : complaint.status === 'INVESTIGATING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {complaint.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-2">
                <span className="font-semibold text-slate-800">{complaint.buyerName}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-500">PO: {complaint.poNumber}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Style: {complaint.styleNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Claim Value
              </span>
              <span className="text-lg font-bold font-mono text-rose-700">
                ${complaint.claimAmountUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Affected Units
              </span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {(complaint.affectedQuantityPcs || 0).toLocaleString()} Pcs
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Reported Date
              </span>
              <span className="text-sm font-bold font-mono text-slate-800 mt-1 block">
                {complaint.reportedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('investigation')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'investigation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Investigation &amp; Root Cause
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('capa')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'capa'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            8D CAPA Action Plan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settlement')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'settlement'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Settlement &amp; Sign-Off
          </button>
        </div>

        {/* Tab 1: Investigation & Root Cause */}
        {activeTab === 'investigation' && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Defect Context */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>Defect Parameters &amp; Order Context</span>
                </h4>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Defect Classification:</span>
                    <span className="font-semibold text-slate-900">{defectCategoryLabel}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Target Resolution Date:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {complaint.targetResolutionDate || '2026-09-30'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Impacted Production Line:</span>
                    <span className="font-semibold text-slate-900">
                      {complaint.sewingLineOrUnit || 'Sewing Line 02 / Floor 03'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Buyer Brand Division:</span>
                    <span className="font-semibold text-slate-900">
                      {complaint.brand || 'Main Export Division'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Style Description:</span>
                    <span className="font-semibold text-slate-900">
                      {complaint.styleDescription || 'Commercial Style Garment'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Root Cause Summary Card */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Root Cause Analysis Finding</span>
                </h4>

                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-3">
                  <p className="text-xs text-rose-950 font-medium leading-relaxed">
                    {complaint.rootCauseSummary}
                  </p>
                  <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-800">
                    <span>5-Why Protocol Verified</span>
                    <span className="font-mono font-semibold">ISO 9001 Clause 10.2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 8D CAPA Action Plan */}
        {activeTab === 'capa' && (
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Corrective &amp; Preventive Action (CAPA) Roadmap</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* D3: Containment */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900">1. Immediate Containment</span>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    D3 Active
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {complaint.containmentAction || '100% quarantine inspection at warehouse stage.'}
                </p>
              </div>

              {/* D5: Corrective */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900">2. Root Cause Correction</span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    D5 Implemented
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {complaint.correctiveAction || 'Machine calibration and process parameter adjustment.'}
                </p>
              </div>

              {/* D7: Preventive */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900">3. Systemic Prevention</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    D7 Verified
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {complaint.preventiveAction || 'Updated standard operating procedure and daily audit logs.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Settlement & Sign-Off */}
        {activeTab === 'settlement' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Settlement Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Commercial Settlement &amp; Financial Impact</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Agreed Settlement Type:</span>
                  <span className="font-semibold text-slate-900">
                    {(complaint.settlementType || 'RE_SCREENING').replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Total Liability:</span>
                  <span className="font-bold text-rose-700 font-mono">
                    ${complaint.claimAmountUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Resolution Date:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {complaint.resolutionDate || 'In Progress'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Buyer Sign-Off Feedback:</span>
                  <span className="font-semibold text-emerald-700">
                    {complaint.buyerFeedback || 'Pending final buyer technical review'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Engineer Card matching Buyer & Order merchandiser box */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                <span>Lead QA Engineer Responsible</span>
              </h4>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{complaint.assignedEngineer}</span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded">
                    Claims Lead
                  </span>
                </div>
                <div className="text-slate-600 flex items-center gap-2 pt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{complaint.engineerEmail || 'tanzim.qa@texexport.com'}</span>
                </div>
                <div className="text-slate-600 flex items-center gap-2 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{complaint.engineerPhone || '+880 1712 334455'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
