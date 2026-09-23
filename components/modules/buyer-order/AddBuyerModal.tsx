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
} from 'lucide-react';
import { BuyerProfile } from '@/lib/types/modules';

interface AddBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (buyer: Partial<BuyerProfile>) => void;
  initialData?: BuyerProfile | null;
}

const SAMPLE_BUYER_LOGOS = [
  { name: 'H&M Hennes & Mauritz', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=150&auto=format&fit=crop&q=60' },
  { name: 'Inditex / Zara', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&auto=format&fit=crop&q=60' },
  { name: 'PVH Tommy Hilfiger', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=150&auto=format&fit=crop&q=60' },
  { name: 'Levi Strauss & Co', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=150&auto=format&fit=crop&q=60' },
  { name: 'Decathlon Sport', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=60' },
];

export function AddBuyerModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddBuyerModalProps) {
  const [formData, setFormData] = useState<Partial<BuyerProfile>>(() => ({
    logoUrl: initialData?.logoUrl || SAMPLE_BUYER_LOGOS[0].url,
    code: initialData?.code || 'BYR-901',
    name: initialData?.name || '',
    brandDivision: initialData?.brandDivision || '',
    country: initialData?.country || 'United States',
    segment: initialData?.segment || 'FAST_FASHION',
    aqlStandard: initialData?.aqlStandard || 'AQL 1.5 Major / 4.0 Minor',
    complianceRating: initialData?.complianceRating || 'A+',
    auditScore: initialData?.auditScore || 95.0,
    contactPerson: initialData?.contactPerson || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    merchandiserName: initialData?.merchandiserName || '',
    merchandiserEmail: initialData?.merchandiserEmail || '',
    merchandiserPhone: initialData?.merchandiserPhone || '',
    paymentTerms: initialData?.paymentTerms || 'LC 60 Days',
    specialProtocols: initialData?.specialProtocols || [
      'Chemical Restrictions & OEKO-TEX Standard 100',
      '100% Metal Detection in Closed QC Tunnel',
    ],
    status: initialData?.status || 'ACTIVE',
  }));

  const [newProtocolInput, setNewProtocolInput] = useState('');
  const [customLogoInput, setCustomLogoInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleAddProtocol = () => {
    if (!newProtocolInput.trim()) return;
    const protocols = [...(formData.specialProtocols || []), newProtocolInput.trim()];
    setFormData({ ...formData, specialProtocols: protocols });
    setNewProtocolInput('');
  };

  const handleRemoveProtocol = (idx: number) => {
    const protocols = (formData.specialProtocols || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, specialProtocols: protocols });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              {initialData?.id ? 'Edit Buyer Profile' : 'Register New Global Buyer Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* 1. BUYER LOGO UPLOAD & PREVIEW */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Buyer Brand Logo (Upload or Select Preset) *</span>
              </label>
              <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 p-1 flex items-center justify-center">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Buyer Logo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <span className="text-[11px] font-semibold text-slate-600">Sample Buyer Logos:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_BUYER_LOGOS.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: b.url })}
                      className={`px-2 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                        formData.logoUrl === b.url
                          ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Or enter logo URL..."
                    value={customLogoInput}
                    onChange={(e) => {
                      setCustomLogoInput(e.target.value);
                      if (e.target.value) {
                        setFormData({ ...formData, logoUrl: e.target.value });
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. BUYER BASIC DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Buyer Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700">Company / Brand Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Target Corporation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Brand Division</label>
              <input
                type="text"
                placeholder="e.g. Menswear & Casual"
                value={formData.brandDivision}
                onChange={(e) => setFormData({ ...formData, brandDivision: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Country / Region</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Industry Segment</label>
              <select
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
              >
                <option value="FAST_FASHION">Fast Fashion</option>
                <option value="PREMIUM_APPAREL">Premium Apparel</option>
                <option value="SPORTSWEAR">Technical Sportswear</option>
                <option value="DENIM_CASUAL">Denim &amp; Casual</option>
                <option value="BASIC_ESSENTIALS">Basic Essentials</option>
                <option value="WORKWEAR">Safety &amp; Workwear</option>
              </select>
            </div>
          </div>

          {/* 3. QUALITY & COMPLIANCE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">AQL Standard</label>
              <input
                type="text"
                value={formData.aqlStandard}
                onChange={(e) => setFormData({ ...formData, aqlStandard: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Compliance Rating</label>
              <select
                value={formData.complianceRating}
                onChange={(e) => setFormData({ ...formData, complianceRating: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-emerald-700"
              >
                <option value="A+">A+ (Tier 1 Accredited)</option>
                <option value="A">A (Standard Approved)</option>
                <option value="B+">B+ (Conditional)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* 4. CONTACT PERSON */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="font-bold text-slate-900 text-xs">Buyer Representative / Sourcing QA</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-slate-600 text-[11px]">Contact Person Name</span>
                <input
                  type="text"
                  placeholder="e.g. Karin Lindqvist"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <span className="text-slate-600 text-[11px]">Email Address</span>
                <input
                  type="email"
                  placeholder="buyer.qa@brand.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <span className="text-slate-600 text-[11px]">Phone / Office</span>
                <input
                  type="tel"
                  placeholder="+46 8 796 5500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 5. ASSIGNED MERCHANDISER & CONTACT */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Assigned In-House Merchandiser &amp; Contact</span>
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md font-medium">
                Auto-pastes into Orders
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-slate-700 font-medium text-[11px]">Merchandiser Name</span>
                <input
                  type="text"
                  placeholder="e.g. Farhan Rahman (Senior Merchandiser)"
                  value={formData.merchandiserName || ''}
                  onChange={(e) => setFormData({ ...formData, merchandiserName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <span className="text-slate-700 font-medium text-[11px]">Merchandiser Email</span>
                <input
                  type="email"
                  placeholder="farhan.merch@texexport.com"
                  value={formData.merchandiserEmail || ''}
                  onChange={(e) => setFormData({ ...formData, merchandiserEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <span className="text-slate-700 font-medium text-[11px]">Merchandiser Contact Phone</span>
                <input
                  type="tel"
                  placeholder="+880 1711 982341"
                  value={formData.merchandiserPhone || ''}
                  onChange={(e) => setFormData({ ...formData, merchandiserPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 5. SPECIAL PROTOCOLS */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700">Special QA &amp; Compliance Protocols</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add special testing requirement (e.g. 100% Broken Needle Tracking)..."
                value={newProtocolInput}
                onChange={(e) => setNewProtocolInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddProtocol();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddProtocol}
                className="px-3 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.specialProtocols?.map((proto, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px]"
                >
                  <span>{proto}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProtocol(idx)}
                    className="text-blue-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              {initialData?.id ? 'Save Buyer Changes' : 'Register Buyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
