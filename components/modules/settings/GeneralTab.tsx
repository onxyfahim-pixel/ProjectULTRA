'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  Scale,
  Mail,
  Save,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  Upload,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface GeneralSettings {
  // ERP Identity
  erpName: string;
  erpTagline: string;
  erpLogoUrl: string;

  // Company Profile
  companyLegalName: string;
  tradeName: string;
  companyDescription: string;
  plantCode: string;
  unitName: string;

  // Addresses
  hqAddress: string;
  hqCity: string;
  hqCountry: string;
  factoryAddress: string;

  // Registrations & Compliance
  tradeLicenseNo: string;
  taxIdentificationNo: string;
  vatRegistrationNo: string;
  bgmeaRegNo: string;

  // Contact Info
  officialEmail: string;
  supportPhone: string;
  websiteUrl: string;

  // Operations & Regional Localization
  timezone: string;
  currency: string;
  dateFormat: string;
  fiscalYearStart: string;

  // Quality Tolerances
  aqlFabricInward: string;
  aqlSewingInline: string;
  aqlPackingFinal: string;
  astmMaxPoints: number;

  lastUpdatedAt?: string;
}

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  erpName: 'Project ULTRA Garments QMS ERP',
  erpTagline: 'Precision Quality, Production & Global Compliance Suite',
  erpLogoUrl: '',

  companyLegalName: 'Valiant Garments Manufacturing Ltd.',
  tradeName: 'Valiant Apparel Global',
  companyDescription:
    'Tier-1 export-oriented woven & knit apparel manufacturing group operating across Dhaka and Chittagong. Certified by ISO 9001:2015, WRAP, and OEKO-TEX Standard 100.',
  plantCode: 'FAC-BD-01',
  unitName: 'Unit 01 - Main Export Complex',

  hqAddress: 'Plot 42, Export Processing Zone, Sector 03',
  hqCity: 'Dhaka',
  hqCountry: 'Bangladesh',
  factoryAddress: 'Complex 14, Gazipur Industrial Area, Dhaka Division',

  tradeLicenseNo: 'TRAD/DNCC/2026/08912',
  taxIdentificationNo: 'TIN-48920194821',
  vatRegistrationNo: 'BIN-00291048201',
  bgmeaRegNo: 'BGMEA-REG-7721',

  officialEmail: 'qms.operations@valiantgarments.com',
  supportPhone: '+880 2 9845120',
  websiteUrl: 'https://valiantgarments.com',

  timezone: 'Asia/Dhaka (GMT+6)',
  currency: 'USD ($)',
  dateFormat: 'YYYY-MM-DD',
  fiscalYearStart: 'January',

  aqlFabricInward: '1.5',
  aqlSewingInline: '2.5',
  aqlPackingFinal: '1.5',
  astmMaxPoints: 28,
};

const LOGO_PRESETS = [
  {
    name: 'Industrial Shield (Blue)',
    url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=120&h=120&fit=crop&q=80',
  },
  {
    name: 'Textile Fabric Loom (Teal)',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&h=120&fit=crop&q=80',
  },
  {
    name: 'Modern Geometric (Navy)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&q=80',
  },
];

export function GeneralTab() {
  const [form, setForm] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load from real backend API or localStorage fallback
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('garments_erp_general_settings') : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (isMounted) setForm((prev) => ({ ...prev, ...parsed }));
          } catch {
            // fallback
          }
        }

        const res = await fetch('/api/modules/system_settings');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data && typeof json.data === 'object') {
            setForm((prev) => ({ ...prev, ...json.data }));
          }
        }
      } catch (err) {
        console.warn('Failed loading general settings, using defaults:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const payload = {
      ...form,
      lastUpdatedAt: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('garments_erp_general_settings', JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent('erp_general_settings_updated', { detail: payload }));
      }

      const res = await fetch('/api/modules/system_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (res.ok) {
        setForm(payload);
        setStatusMessage({
          type: 'success',
          text: 'General ERP settings and organization profile saved and synchronized across all modules!',
        });
      } else {
        const errJson = await res.json();
        setStatusMessage({ type: 'error', text: errJson.error || 'Failed to save settings to server.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error saving settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-200/60 dark:border-blue-900/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              General System Settings &amp; Company Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure ERP branding, company identity, factory addresses, compliance licenses, and quality thresholds.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold border animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. ERP BRANDING & LOGO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <ImageIcon className="w-4 h-4 text-blue-600" />
          ERP Branding &amp; System Logo
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Logo Preview & Uploader (4 cols) */}
          <div className="lg:col-span-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              System Logo Preview
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                {form.erpLogoUrl ? (
                  <img
                    src={form.erpLogoUrl}
                    alt="ERP Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=120&h=120&fit=crop&q=80';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-center p-2">
                    <Building2 className="w-8 h-8 text-blue-600 mb-1" />
                    <span className="text-[9px] font-bold">ERP Logo</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {form.erpName || 'ERP System'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recommended: 256x256 PNG or SVG with transparent background
                </div>
              </div>
            </div>

            {/* Logo Presets Selection */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-2">Or select from presets:</div>
              <div className="flex items-center gap-2">
                {LOGO_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setForm({ ...form, erpLogoUrl: preset.url })}
                    className={`w-9 h-9 rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
                      form.erpLogoUrl === preset.url
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                    title={preset.name}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ERP Name & Tagline Inputs (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ERP System Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.erpName}
                onChange={(e) => setForm({ ...form, erpName: e.target.value })}
                placeholder="e.g. Project ULTRA Garments QMS ERP"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ERP System Tagline / Subtitle
              </label>
              <input
                type="text"
                value={form.erpTagline}
                onChange={(e) => setForm({ ...form, erpTagline: e.target.value })}
                placeholder="e.g. Precision Quality, Production & Global Compliance Suite"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Logo Image URL
              </label>
              <input
                type="url"
                value={form.erpLogoUrl}
                onChange={(e) => setForm({ ...form, erpLogoUrl: e.target.value })}
                placeholder="https://your-domain.com/assets/logo.png"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMPANY PROFILE & DESCRIPTION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Building2 className="w-4 h-4 text-emerald-600" />
          Company Profile &amp; Description
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Company Legal Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.companyLegalName}
              onChange={(e) => setForm({ ...form, companyLegalName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Brand / Commercial Trade Name
            </label>
            <input
              type="text"
              value={form.tradeName}
              onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Company Description &amp; Operations Overview
            </label>
            <textarea
              rows={3}
              value={form.companyDescription}
              onChange={(e) => setForm({ ...form, companyDescription: e.target.value })}
              placeholder="Detailed company profile, manufacturing specialties, export destinations, and international compliance overview..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Plant / Facility Code
            </label>
            <input
              type="text"
              value={form.plantCode}
              onChange={(e) => setForm({ ...form, plantCode: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Manufacturing Unit / Division
            </label>
            <input
              type="text"
              value={form.unitName}
              onChange={(e) => setForm({ ...form, unitName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              required
            />
          </div>
        </div>
      </div>

      {/* 3. HEADQUARTERS & FACTORY ADDRESSES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <MapPin className="w-4 h-4 text-rose-600" />
          Headquarters &amp; Manufacturing Plant Addresses
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Headquarters Corporate Street Address
            </label>
            <input
              type="text"
              value={form.hqAddress}
              onChange={(e) => setForm({ ...form, hqAddress: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              City &amp; Country
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={form.hqCity}
                onChange={(e) => setForm({ ...form, hqCity: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
              <input
                type="text"
                value={form.hqCountry}
                onChange={(e) => setForm({ ...form, hqCountry: e.target.value })}
                placeholder="Country"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Manufacturing Complex / Factory Floor Physical Location
            </label>
            <input
              type="text"
              value={form.factoryAddress}
              onChange={(e) => setForm({ ...form, factoryAddress: e.target.value })}
              placeholder="e.g. Complex 14, Gazipur Industrial Area, Dhaka Division"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 4. BUSINESS REGISTRATION & CONTACT INFORMATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4 h-4 text-indigo-600" />
          Legal Registrations &amp; Communication Channels
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Trade License Number
            </label>
            <input
              type="text"
              value={form.tradeLicenseNo}
              onChange={(e) => setForm({ ...form, tradeLicenseNo: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tax ID / TIN Number
            </label>
            <input
              type="text"
              value={form.taxIdentificationNo}
              onChange={(e) => setForm({ ...form, taxIdentificationNo: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              VAT / BIN Registration
            </label>
            <input
              type="text"
              value={form.vatRegistrationNo}
              onChange={(e) => setForm({ ...form, vatRegistrationNo: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              BGMEA / Association Reg. No.
            </label>
            <input
              type="text"
              value={form.bgmeaRegNo}
              onChange={(e) => setForm({ ...form, bgmeaRegNo: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Official QMS Alert Email
            </label>
            <input
              type="email"
              value={form.officialEmail}
              onChange={(e) => setForm({ ...form, officialEmail: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Plant Support Telephone
            </label>
            <input
              type="tel"
              value={form.supportPhone}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Official Corporate Website URL
            </label>
            <input
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 5. OPERATIONS, LOCALIZATION & QUALITY STANDARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Localization */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Globe className="w-4 h-4 text-blue-600" />
            Operations &amp; Regional Localization
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="Asia/Dhaka (GMT+6)">Asia/Dhaka (GMT+6)</option>
                <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
                <option value="Asia/Ho_Chi_Minh (GMT+7)">Asia/Ho_Chi_Minh (GMT+7)</option>
                <option value="UTC">UTC (Universal Time)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="USD ($)">USD ($) - US Dollar</option>
                <option value="BDT (৳)">BDT (৳) - Bangladeshi Taka</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date Format</label>
              <select
                value={form.dateFormat}
                onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (UK/BD)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fiscal Year Start</label>
              <select
                value={form.fiscalYearStart}
                onChange={(e) => setForm({ ...form, fiscalYearStart: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="January">January</option>
                <option value="July">July (Bangladesh Standard)</option>
                <option value="April">April (UK / India)</option>
                <option value="October">October (US Federal)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quality Standards */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Scale className="w-4 h-4 text-emerald-600" />
            Factory AQL Quality Thresholds
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Fabric Inward AQL Level
              </label>
              <select
                value={form.aqlFabricInward}
                onChange={(e) => setForm({ ...form, aqlFabricInward: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                <option value="1.0">AQL 1.0 (Strict)</option>
                <option value="1.5">AQL 1.5 (Standard Export)</option>
                <option value="2.5">AQL 2.5 (Commercial)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Sewing Inline AQL Level
              </label>
              <select
                value={form.aqlSewingInline}
                onChange={(e) => setForm({ ...form, aqlSewingInline: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                <option value="1.5">AQL 1.5 (High Spec)</option>
                <option value="2.5">AQL 2.5 (Standard Floor)</option>
                <option value="4.0">AQL 4.0 (Basic Workwear)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pre-Shipment FRI AQL Level
              </label>
              <select
                value={form.aqlPackingFinal}
                onChange={(e) => setForm({ ...form, aqlPackingFinal: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                <option value="1.0">AQL 1.0 (Japan / High Luxury)</option>
                <option value="1.5">AQL 1.5 (EU / US Retailers)</option>
                <option value="2.5">AQL 2.5 (Standard Commercial)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ASTM 4-Point Max Points/100yd²
              </label>
              <input
                type="number"
                min={10}
                max={50}
                value={form.astmMaxPoints}
                onChange={(e) => setForm({ ...form, astmMaxPoints: Number(e.target.value) || 28 })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
