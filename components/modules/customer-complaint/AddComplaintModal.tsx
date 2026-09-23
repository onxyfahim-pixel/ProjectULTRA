'use client';

import React, { useState } from 'react';
import {
  X,
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
  Tag,
  Search,
} from 'lucide-react';
import { CustomerComplaint } from '@/lib/types/modules';

interface AddComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (complaint: Partial<CustomerComplaint>) => void;
  initialData?: CustomerComplaint | null;
}

const BUYER_OPTIONS = [
  'H&M Hennes & Mauritz',
  'Inditex / Zara',
  'PVH Tommy Hilfiger',
  'Levi Strauss & Co',
  'Decathlon Sport',
  'Marks & Spencer',
  'Target Corporation',
];

export function AddComplaintModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddComplaintModalProps) {
  const [formData, setFormData] = useState<Partial<CustomerComplaint>>(() => ({
    complaintNumber: initialData?.complaintNumber || `CLM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    buyerName: initialData?.buyerName || BUYER_OPTIONS[0],
    brand: initialData?.brand || 'Main Brand Division',
    poNumber: initialData?.poNumber || 'PO-2026-001',
    styleNumber: initialData?.styleNumber || 'STY-001',
    styleDescription: initialData?.styleDescription || 'Garment Export Style',
    defectCategory: initialData?.defectCategory || 'COLOR_SHADING',
    severity: initialData?.severity || 'MAJOR',
    reportedDate: initialData?.reportedDate || new Date().toISOString().split('T')[0],
    targetResolutionDate: initialData?.targetResolutionDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    claimAmountUSD: initialData?.claimAmountUSD || 1500,
    affectedQuantityPcs: initialData?.affectedQuantityPcs || 500,
    sewingLineOrUnit: initialData?.sewingLineOrUnit || 'Sewing Line 02',
    status: initialData?.status || 'LOGGED',
    rootCauseSummary: initialData?.rootCauseSummary || '',
    containmentAction: initialData?.containmentAction || '100% quarantine inspection at warehouse stage.',
    correctiveAction: initialData?.correctiveAction || 'Machine calibration and process parameter adjustment.',
    preventiveAction: initialData?.preventiveAction || 'Updated standard operating procedure and daily audit logs.',
    assignedEngineer: initialData?.assignedEngineer || 'Tanzim Ahmed (QA Manager)',
    engineerEmail: initialData?.engineerEmail || 'tanzim.qa@texexport.com',
    engineerPhone: initialData?.engineerPhone || '+880 1712 334455',
    settlementType: initialData?.settlementType || 'RE_SCREENING',
  }));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.buyerName?.trim() || !formData.poNumber?.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header matching Buyer & Order module design */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Customer Quality Claim' : 'Log New Customer Complaint'}
              </h3>
              <p className="text-xs text-slate-500">
                Buyer notification, defect root cause tracking, and 8D CAPA resolution
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Claim Identity & Order PO Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Claim Identity &amp; Order PO
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Claim ID Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.complaintNumber}
                  onChange={(e) => setFormData({ ...formData, complaintNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Buyer Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.buyerName}
                  onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {BUYER_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Buyer Brand Division
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zara Man / Divided"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  PO Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-HM-99180"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Style Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. STY-TS-2026"
                  value={formData.styleNumber}
                  onChange={(e) => setFormData({ ...formData, styleNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Style Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oversized Organic Cotton Tee"
                  value={formData.styleDescription}
                  onChange={(e) => setFormData({ ...formData, styleDescription: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Defect Classification & Severity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Defect Classification &amp; Severity Impact
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Defect Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.defectCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, defectCategory: e.target.value as CustomerComplaint['defectCategory'] })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="COLOR_SHADING">Color Shading / Delta-E</option>
                  <option value="BROKEN_STITCH">Broken Stitch / Seam Burst</option>
                  <option value="MEASUREMENT_OUT_OF_TOLERANCE">Measurement Out of Tolerance</option>
                  <option value="STAIN_SOIL">Stain / Oil Spot</option>
                  <option value="FABRIC_FLAW">Fabric Flaw / Yarn Slub</option>
                  <option value="PACKAGING_ERROR">Packaging / Barcode Error</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Severity Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value as CustomerComplaint['severity'] })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="CRITICAL">Critical (Immediate Quarantine)</option>
                  <option value="MAJOR">Major (CAPA Mandatory)</option>
                  <option value="MINOR">Minor (Notice &amp; Re-screening)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Claim Value ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.claimAmountUSD}
                  onChange={(e) => setFormData({ ...formData, claimAmountUSD: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Affected Units (Pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.affectedQuantityPcs}
                  onChange={(e) => setFormData({ ...formData, affectedQuantityPcs: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reported Date
                </label>
                <input
                  type="date"
                  value={formData.reportedDate}
                  onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Target Resolution
                </label>
                <input
                  type="date"
                  value={formData.targetResolutionDate}
                  onChange={(e) => setFormData({ ...formData, targetResolutionDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Investigation Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as CustomerComplaint['status'] })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="LOGGED">Logged</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="CAPA_ISSUED">CAPA Issued</option>
                  <option value="SETTLED">Settled</option>
                  <option value="REJECTED">Rejected Claim</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Settlement Method
                </label>
                <select
                  value={formData.settlementType}
                  onChange={(e) =>
                    setFormData({ ...formData, settlementType: e.target.value as CustomerComplaint['settlementType'] })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="RE_SCREENING">100% Re-screening / Rework</option>
                  <option value="CREDIT_NOTE">Financial Credit Note</option>
                  <option value="REPLACEMENT_SHIPMENT">Replacement Air/Sea Shipment</option>
                  <option value="CONCESSION">Commercial Concession</option>
                  <option value="REJECTED_CLAIM">Claim Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: 8D Root Cause & CAPA Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                8D Root Cause &amp; CAPA Implementation
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Investigation Root Cause Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detailed findings on why the defect occurred (e.g., differential bath exhaustion rate, needle heat damage, etc.)..."
                  value={formData.rootCauseSummary}
                  onChange={(e) => setFormData({ ...formData, rootCauseSummary: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Containment Action (Immediate)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Immediate quarantine, 100% inspection at dock..."
                    value={formData.containmentAction}
                    onChange={(e) => setFormData({ ...formData, containmentAction: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Corrective Action (Floor Level)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Machine adjustment, parameter locking..."
                    value={formData.correctiveAction}
                    onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Preventive Action (Systemic SOP)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="SOP revision, training, barcode lock..."
                    value={formData.preventiveAction}
                    onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Responsible QA Engineer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <User className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Assigned Investigating QA Engineer
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Lead QA Engineer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanzim Ahmed (QA Manager)"
                  value={formData.assignedEngineer}
                  onChange={(e) => setFormData({ ...formData, assignedEngineer: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Engineer Email
                </label>
                <input
                  type="email"
                  placeholder="tanzim.qa@texexport.com"
                  value={formData.engineerEmail}
                  onChange={(e) => setFormData({ ...formData, engineerEmail: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Engineer Phone
                </label>
                <input
                  type="text"
                  placeholder="+880 1712 334455"
                  value={formData.engineerPhone}
                  onChange={(e) => setFormData({ ...formData, engineerPhone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer with exact Buyer & Order button styling */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{initialData ? 'Save Claim Changes' : 'Register Customer Claim'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
