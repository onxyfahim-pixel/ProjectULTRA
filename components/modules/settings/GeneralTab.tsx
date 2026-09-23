'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Globe, Scale, Mail, Save, Check, RefreshCw, AlertCircle, Clock } from 'lucide-react';

export interface GeneralSettings {
  factoryName: string;
  plantCode: string;
  unitName: string;
  country: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  aqlFabricInward: string;
  aqlSewingInline: string;
  aqlPackingFinal: string;
  astmMaxPoints: number;
  alertEmail: string;
  lastUpdatedAt?: string;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  factoryName: 'Valiant Garments Manufacturing Ltd.',
  plantCode: 'FAC-BD-01',
  unitName: 'Unit 01 - Main Export Complex',
  country: 'Bangladesh',
  timezone: 'Asia/Dhaka (GMT+6)',
  currency: 'USD ($)',
  dateFormat: 'YYYY-MM-DD',
  aqlFabricInward: '1.5',
  aqlSewingInline: '2.5',
  aqlPackingFinal: '1.5',
  astmMaxPoints: 28,
  alertEmail: 'qms.alerts@valiantgarments.com',
};

export function GeneralTab() {
  const [form, setForm] = useState<GeneralSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load from real backend API (/api/modules/system_settings)
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
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
      const res = await fetch('/api/modules/system_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (res.ok) {
        setForm(payload);
        setStatusMessage({
          type: 'success',
          text: 'General settings saved and permanently synced to MySQL Host Database!',
        });
      } else {
        const errJson = await res.json();
        setStatusMessage({ type: 'error', text: errJson.error || 'Failed to save settings.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error saving settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200/50 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">General Plant & System Configuration</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage manufacturing plant profile, international currency, timezones, and enterprise AQL tolerances.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
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

      {/* 1. Factory & Facility Profile */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Building2 className="w-4 h-4 text-emerald-600" />
          Factory & Facility Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Factory Name
            </label>
            <input
              type="text"
              value={form.factoryName}
              onChange={(e) => setForm({ ...form, factoryName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              required
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
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
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
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Operations & Localization */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Globe className="w-4 h-4 text-blue-600" />
          Regional Operations & Formats
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Timezone
            </label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="Asia/Dhaka (GMT+6)">Asia/Dhaka (GMT+6)</option>
              <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
              <option value="Asia/Ho_Chi_Minh (GMT+7)">Asia/Ho_Chi_Minh (GMT+7)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="America/New_York (EST)">America/New_York (EST)</option>
              <option value="Europe/London (GMT)">Europe/London (GMT)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Primary Currency
            </label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="USD ($)">USD ($) - US Dollar</option>
              <option value="BDT (৳)">BDT (৳) - Bangladeshi Taka</option>
              <option value="EUR (€)">EUR (€) - Euro</option>
              <option value="GBP (£)">GBP (£) - British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Date Display Format
            </label>
            <select
              value={form.dateFormat}
              onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (UK / Bangladesh)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Global Quality Tolerances & AQL */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Scale className="w-4 h-4 text-purple-600" />
          Plant Quality AQL Acceptance Standards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Fabric Inward Acceptance
            </label>
            <select
              value={form.aqlFabricInward}
              onChange={(e) => setForm({ ...form, aqlFabricInward: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
            >
              <option value="1.0">AQL 1.0 (Strict)</option>
              <option value="1.5">AQL 1.5 (Standard Buyer)</option>
              <option value="2.5">AQL 2.5 (Commercial)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Sewing Inline QC Threshold
            </label>
            <select
              value={form.aqlSewingInline}
              onChange={(e) => setForm({ ...form, aqlSewingInline: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
            >
              <option value="1.5">AQL 1.5 (Zero-Defect Line)</option>
              <option value="2.5">AQL 2.5 (Industry Standard)</option>
              <option value="4.0">AQL 4.0 (Relaxed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Final Pre-Shipment AQL
            </label>
            <select
              value={form.aqlPackingFinal}
              onChange={(e) => setForm({ ...form, aqlPackingFinal: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
            >
              <option value="1.0">AQL 1.0 Major / 2.5 Minor</option>
              <option value="1.5">AQL 1.5 Major / 4.0 Minor (Zara / H&M)</option>
              <option value="2.5">AQL 2.5 Major / 4.0 Minor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ASTM D5430 Max 4-Points
            </label>
            <input
              type="number"
              value={form.astmMaxPoints}
              onChange={(e) => setForm({ ...form, astmMaxPoints: parseInt(e.target.value) || 28 })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
            />
            <span className="text-[10px] text-slate-400">Pts per 100 sq. yards</span>
          </div>
        </div>
      </div>

      {/* 4. Automated Alert Recipients */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Mail className="w-4 h-4 text-amber-600" />
          Critical Quality Alert Dispatch
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              QA Management Escalation Email
            </label>
            <input
              type="email"
              value={form.alertEmail}
              onChange={(e) => setForm({ ...form, alertEmail: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              required
            />
            <span className="text-[10px] text-slate-400">
              Receives instant notifications if an inspection fails or shade Delta-E exceeds threshold.
            </span>
          </div>

          <div className="flex items-center justify-end pt-5">
            {form.lastUpdatedAt && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Last updated: {new Date(form.lastUpdatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
