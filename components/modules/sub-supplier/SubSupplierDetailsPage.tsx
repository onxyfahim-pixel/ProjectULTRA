'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Award,
  ShieldCheck,
  Clock,
  Mail,
  Phone,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Factory,
  MapPin,
  Calendar,
  Layers,
  FileCheck,
  Check,
  User,
  UserCheck,
  FileText,
  AlertCircle,
  Truck,
  TrendingUp,
} from 'lucide-react';
import { SubSupplier } from '@/lib/types/modules';
import { StatusBadge } from '@/components/ui/Badge';

interface SubSupplierDetailsPageProps {
  supplier: SubSupplier;
  onBack: () => void;
  onEdit: (supplier: SubSupplier) => void;
  onDuplicate: (supplier: SubSupplier) => void;
  onDelete: (supplier: SubSupplier) => void;
  showToast?: (msg: string) => void;
}

export function SubSupplierDetailsPage({
  supplier,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  showToast,
}: SubSupplierDetailsPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'audits'>('overview');

  const categoryLabel = supplier.category.replace(/_/g, ' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Action Bar matching Buyer & Order module design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Back to Supplier Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {supplier.code}
              </span>
              <span className="text-xs font-medium text-slate-500">•</span>
              <span className="text-xs text-slate-500">{categoryLabel}</span>
              <span className="text-xs font-medium text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-700">{supplier.country}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{supplier.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(supplier)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Mill</span>
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => onDuplicate(supplier)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(supplier)}
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
            <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
              {supplier.logoUrl ? (
                <img
                  src={supplier.logoUrl}
                  alt={supplier.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <Building2 className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{supplier.name}</h3>
                <span
                  className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                    supplier.qualityRating === 'A+'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : supplier.qualityRating === 'A'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  Grade {supplier.qualityRating}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    supplier.complianceStatus === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : supplier.complianceStatus === 'PROVISIONAL'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : supplier.complianceStatus === 'AUDIT_PENDING'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {supplier.complianceStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{supplier.facilityLocation || `${supplier.country} Manufacturing Hub`}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-500">{supplier.country}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Technical Audit
              </span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {supplier.auditScore.toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Mill Lead Time
              </span>
              <span className="text-lg font-bold font-mono text-blue-600">
                {supplier.leadTimeDays} Days
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                On-Time SLA
              </span>
              <span className="text-lg font-bold font-mono text-emerald-700">
                {supplier.onTimeDeliveryRate || 98.5}%
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview &amp; Personnel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'materials'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Material Supply Lines ({supplier.materialsSupplied?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audits')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'audits'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Higg &amp; ISO Accreditations ({supplier.certifications?.length || 0})
          </button>
        </div>

        {/* Tab 1: Overview & Personnel */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Operational Specs */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Factory className="w-4 h-4 text-blue-600" />
                <span>Manufacturing &amp; Commercial Terms</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Monthly Capacity:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {supplier.capacityPerMonth || '2,000,000 Yards'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Minimum Order Qty (MOQ):</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {supplier.moq || '1,000 Yards / Shade'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Standard Payment Terms:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {supplier.paymentTerms || 'LC 60 Days / CAD'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Historical Defect Rate:</span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    {supplier.defectRatePercent || 0.65}% (Within AQL 1.5)
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Last QMS Audit Date:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {supplier.lastAuditDate || '2026-06-15'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Next Audit Scheduled:</span>
                  <span className="font-semibold text-blue-700 font-mono">
                    {supplier.nextAuditDate || '2027-06-14'}
                  </span>
                </div>
              </div>
            </div>

            {/* Personnel & Communication */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                <span>Contact Directory &amp; Assigned QA Lead</span>
              </h4>

              {/* In-House QA Lead Box styled like Buyer Card's Merchandiser */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{supplier.assignedQALead || 'Tariqul Islam (Fabric QA)'}</span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded">
                    In-House QA Lead
                  </span>
                </div>
                <div className="text-slate-600 flex items-center gap-2 text-[11px]">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{supplier.assignedQAEmail || 'tariqul.fabric@texexport.com'}</span>
                </div>
                <div className="text-slate-600 flex items-center gap-2 text-[11px] font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{supplier.assignedQAPhone || '+880 1711 902341'}</span>
                </div>
              </div>

              {/* Supplier Key Contact Person */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>{supplier.contactPerson}</span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                    Mill Representative
                  </span>
                </div>
                <div className="text-slate-600 flex items-center gap-2 text-[11px]">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{supplier.email}</span>
                </div>
                <div className="text-slate-600 flex items-center gap-2 text-[11px] font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{supplier.phone}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Material Supply Lines */}
        {activeTab === 'materials' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Approved Fabric, Trims &amp; Hardware Products</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                {supplier.materialsSupplied?.length || 0} active SKU lines
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(supplier.materialsSupplied || [
                'Combed Cotton 180 GSM Single Jersey',
                'Poly Spandex Stretch Interlock',
              ]).map((material, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900">{material}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Pass
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                    <span>AQL 4-Point Standard</span>
                    <span>Lead: {supplier.leadTimeDays}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Accreditations & Higg FEM */}
        {activeTab === 'audits' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Environmental &amp; Quality Accreditations</span>
              </h4>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Higg FEM &amp; ISO Verified</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(supplier.certifications || [
                'OEKO-TEX Standard 100 Class I',
                'Higg Facility Environmental Module (FEM 3.0)',
                'ISO 9001:2015 Quality Management',
              ]).map((cert, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-900">{cert}</h5>
                    <p className="text-[11px] text-slate-500">
                      Scope: Zero discharge of hazardous chemicals &amp; social compliance verified.
                    </p>
                    <span className="text-[10px] text-emerald-700 font-mono font-medium block pt-1">
                      Status: Active / Certified (Audit Score: {supplier.auditScore}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
