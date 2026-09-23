'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  Image as ImageIcon,
  Upload,
  Globe,
  Award,
  CreditCard,
  FileCheck,
  Plus,
  Trash2,
  User,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { SubSupplier } from '@/lib/types/modules';

interface AddSubSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Partial<SubSupplier>) => void;
  initialData?: SubSupplier | null;
}

const SAMPLE_SUPPLIER_LOGOS = [
  { name: 'Fabric Mill', url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=150&auto=format&fit=crop&q=60' },
  { name: 'Zippers & Hardware', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150&auto=format&fit=crop&q=60' },
  { name: 'Thread Mill', url: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=150&auto=format&fit=crop&q=60' },
  { name: 'Dyeing House', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop&q=60' },
  { name: 'Labels & Packaging', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150&auto=format&fit=crop&q=60' },
  { name: 'Denim Mill', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=150&auto=format&fit=crop&q=60' },
];

export function AddSubSupplierModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddSubSupplierModalProps) {
  const [formData, setFormData] = useState<Partial<SubSupplier>>(() => ({
    logoUrl: initialData?.logoUrl || SAMPLE_SUPPLIER_LOGOS[0].url,
    code: initialData?.code || `SUP-${Math.floor(100 + Math.random() * 900)}`,
    name: initialData?.name || '',
    category: initialData?.category || 'FABRIC_MILL',
    country: initialData?.country || 'Bangladesh',
    facilityLocation: initialData?.facilityLocation || 'Gazipur Industrial Zone',
    contactPerson: initialData?.contactPerson || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    qualityRating: initialData?.qualityRating || 'A+',
    complianceStatus: initialData?.complianceStatus || 'APPROVED',
    auditScore: initialData?.auditScore || 95.0,
    leadTimeDays: initialData?.leadTimeDays || 14,
    capacityPerMonth: initialData?.capacityPerMonth || '1,500,000 Yards',
    onTimeDeliveryRate: initialData?.onTimeDeliveryRate || 98.5,
    defectRatePercent: initialData?.defectRatePercent || 0.5,
    assignedQALead: initialData?.assignedQALead || 'Tariqul Islam (Fabric QA)',
    assignedQAEmail: initialData?.assignedQAEmail || 'tariqul.fabric@texexport.com',
    assignedQAPhone: initialData?.assignedQAPhone || '+880 1711 902341',
    moq: initialData?.moq || '1,000 Yards',
    paymentTerms: initialData?.paymentTerms || 'LC 60 Days / CAD',
    certifications: initialData?.certifications || [
      'OEKO-TEX Standard 100 Class I',
      'Higg Facility Environmental Module (FEM 3.0)',
      'ISO 9001:2015 Quality Management',
    ],
    materialsSupplied: initialData?.materialsSupplied || [
      '100% Combed Cotton Single Jersey 180 GSM',
      'Cotton / Spandex French Terry 240 GSM',
    ],
  }));

  const [newCertInput, setNewCertInput] = useState('');
  const [newMaterialInput, setNewMaterialInput] = useState('');
  const [customLogoInput, setCustomLogoInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    onSave(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setFormData({ ...formData, logoUrl: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCert = () => {
    if (!newCertInput.trim()) return;
    const certs = [...(formData.certifications || []), newCertInput.trim()];
    setFormData({ ...formData, certifications: certs });
    setNewCertInput('');
  };

  const handleRemoveCert = (idx: number) => {
    const certs = (formData.certifications || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, certifications: certs });
  };

  const handleAddMaterial = () => {
    if (!newMaterialInput.trim()) return;
    const materials = [...(formData.materialsSupplied || []), newMaterialInput.trim()];
    setFormData({ ...formData, materialsSupplied: materials });
    setNewMaterialInput('');
  };

  const handleRemoveMaterial = (idx: number) => {
    const materials = (formData.materialsSupplied || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, materialsSupplied: materials });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Sub-Supplier Profile' : 'Register New Sub-Supplier'}
              </h3>
              <p className="text-xs text-slate-500">
                Fabric mill, dyeing house, zipper plant, or trims partner specification
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
          {/* Section 1: Logo & Brand Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Mill Logo &amp; Identity
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_SUPPLIER_LOGOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: sample.url })}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        formData.logoUrl === sample.url
                          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Or paste external image URL..."
                    value={customLogoInput}
                    onChange={(e) => {
                      setCustomLogoInput(e.target.value);
                      if (e.target.value.trim()) {
                        setFormData({ ...formData, logoUrl: e.target.value.trim() });
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Basic Mill Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Supplier &amp; Sourcing Details
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Supplier Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pacific Textiles Mills Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Supplier Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUP-PAC-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Material Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as SubSupplier['category'] })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="FABRIC_MILL">Fabric Mill (Knit / Woven)</option>
                  <option value="DYEING_HOUSE">Dyeing &amp; Finishing House</option>
                  <option value="ZIPPERS">Zippers &amp; Sliders</option>
                  <option value="THREAD_MILL">Thread Mill (Spun Poly / Core)</option>
                  <option value="LABELS_PACKAGING">Labels &amp; Packaging</option>
                  <option value="TRIMS_BUTTONS">Trims, Buttons &amp; Hardware</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Country / Origin
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangladesh / Vietnam / Japan"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Facility Location / Mill Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot #12-14, Export Processing Zone (EPZ), Dhaka"
                  value={formData.facilityLocation}
                  onChange={(e) => setFormData({ ...formData, facilityLocation: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Quality & Audit Credentials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Award className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Quality Rating &amp; Compliance Audit
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  QMS Quality Grade
                </label>
                <select
                  value={formData.qualityRating}
                  onChange={(e) =>
                    setFormData({ ...formData, qualityRating: e.target.value as SubSupplier['qualityRating'] })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="A+">Grade A+ (Premium Top Tier)</option>
                  <option value="A">Grade A (Approved Standard)</option>
                  <option value="B">Grade B (Provisional)</option>
                  <option value="C">Grade C (Critical Audit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Compliance Status
                </label>
                <select
                  value={formData.complianceStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, complianceStatus: e.target.value as SubSupplier['complianceStatus'] })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="APPROVED">Approved Mill</option>
                  <option value="PROVISIONAL">Provisional Approval</option>
                  <option value="AUDIT_PENDING">Audit Pending</option>
                  <option value="BLACKLISTED">Blacklisted</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Audit Score (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.auditScore}
                  onChange={(e) => setFormData({ ...formData, auditScore: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Lead Time (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.leadTimeDays}
                  onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Monthly Capacity
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2,000,000 Yards"
                  value={formData.capacityPerMonth}
                  onChange={(e) => setFormData({ ...formData, capacityPerMonth: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  On-Time Delivery (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.onTimeDeliveryRate}
                  onChange={(e) => setFormData({ ...formData, onTimeDeliveryRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Min Order Qty (MOQ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1,000 Yards / Shade"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. LC 60 Days / CAD"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Contact & Responsible Personnel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <User className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Supplier Contact &amp; Assigned QA Lead
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Supplier Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. David Chen"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Supplier Email
                </label>
                <input
                  type="email"
                  placeholder="d.chen@pacific-textiles.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Supplier Phone
                </label>
                <input
                  type="text"
                  placeholder="+84 274 382 9901"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assigned In-House QA Lead
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tariqul Islam (Fabric QA)"
                  value={formData.assignedQALead}
                  onChange={(e) => setFormData({ ...formData, assignedQALead: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assigned QA Email
                </label>
                <input
                  type="email"
                  placeholder="tariqul.fabric@texexport.com"
                  value={formData.assignedQAEmail}
                  onChange={(e) => setFormData({ ...formData, assignedQAEmail: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assigned QA Phone
                </label>
                <input
                  type="text"
                  placeholder="+880 1711 902341"
                  value={formData.assignedQAPhone}
                  onChange={(e) => setFormData({ ...formData, assignedQAPhone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Certifications & Materials Chips */}
          <div className="space-y-4">
            {/* Certifications Chips */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Accreditations &amp; Environmental Certifications
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add certification (e.g. Higg FEM 3.0, GOTS Organic, OEKO-TEX 100)..."
                  value={newCertInput}
                  onChange={(e) => setNewCertInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCert();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddCert}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Cert</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(formData.certifications || []).map((cert, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-medium"
                  >
                    <span>{cert}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCert(idx)}
                      className="text-indigo-400 hover:text-indigo-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Materials Supplied Chips */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Materials &amp; Components Supplied
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add material line (e.g. 100% Combed Cotton 180 GSM, Metal 4.5# Brass Zipper)..."
                  value={newMaterialInput}
                  onChange={(e) => setNewMaterialInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMaterial();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Material</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(formData.materialsSupplied || []).map((mat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-medium"
                  >
                    <span>{mat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(idx)}
                      className="text-blue-400 hover:text-blue-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer with the exact Buyer & Order button styling */}
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
              <Building2 className="w-3.5 h-3.5" />
              <span>{initialData ? 'Save Changes' : 'Register Sub-Supplier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
