'use client';

import React, { useState, useEffect } from 'react';
import {
  FileDown,
  Printer,
  Sparkles,
  Save,
  Check,
  RefreshCw,
  Building2,
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  QrCode,
  Layers,
  Palette,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Zap,
  Layout,
  ExternalLink,
  ChevronDown,
  Search,
  RotateCcw,
  FileText,
  Tag,
  Filter,
} from 'lucide-react';
import {
  PdfHeaderSettings,
  DEFAULT_PDF_HEADER_SETTINGS,
  DEFAULT_MODULE_HEADER_CONFIGS,
  ModuleHeaderDefinition,
  loadPdfHeaderSettings,
  savePdfHeaderSettings,
  getGeneralSettingsFromStorage,
  getModuleExportConfig,
  renderPdfHeaderHtml,
} from '@/lib/pdf/pdf-header-store';

const COLOR_PRESETS = [
  { name: 'Navy Blue (Default)', hex: '#1e3a8a', secondary: '#3b82f6' },
  { name: 'Classic Slate', hex: '#0f172a', secondary: '#475569' },
  { name: 'Emerald Forest', hex: '#065f46', secondary: '#10b981' },
  { name: 'Royal Sapphire', hex: '#1d4ed8', secondary: '#60a5fa' },
  { name: 'Deep Burgundy', hex: '#831843', secondary: '#ec4899' },
  { name: 'Charcoal Industrial', hex: '#18181b', secondary: '#71717a' },
  { name: 'Imperial Violet', hex: '#581c87', secondary: '#a855f7' },
];

const LAYOUT_PRESETS: {
  id: PdfHeaderSettings['layoutStyle'];
  title: string;
  desc: string;
  badge: string;
}[] = [
  {
    id: 'modern_split',
    title: 'Modern Split Header',
    desc: 'Branded logo & factory details on the left, document classification & QR verification on the right.',
    badge: 'Recommended',
  },
  {
    id: 'classic_bordered',
    title: 'Classic Framed Factory',
    desc: 'Formal industrial bordered box with dual-section header, reference numbers, and compliance strip.',
    badge: 'Formal Standard',
  },
  {
    id: 'executive_centered',
    title: 'Executive Centered',
    desc: 'Corporate watermarked center crest with full-width address line, ideal for Buyer POs and Invoices.',
    badge: 'Executive',
  },
  {
    id: 'ribbon_accent',
    title: 'Accent Ribbon Top',
    desc: 'High-contrast gradient brand ribbon across the page top with clean technical typography.',
    badge: 'Modern QMS',
  },
  {
    id: 'compact_clean',
    title: 'Compact Floor Density',
    desc: 'Minimal vertical height specifically optimized for high-density multi-page packing and cutting sheets.',
    badge: 'Max Density',
  },
];

export function ExportTemplatesTab() {
  const [settings, setSettings] = useState<PdfHeaderSettings>(DEFAULT_PDF_HEADER_SETTINGS);
  const [selectedSampleDoc, setSelectedSampleDoc] = useState(0);
  const [canvasViewMode, setCanvasViewMode] = useState<'portrait' | 'landscape'>('landscape');
  const [saving, setSaving] = useState(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [selectedModuleCategory, setSelectedModuleCategory] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Load saved settings and listen for general settings updates
  useEffect(() => {
    const loaded = loadPdfHeaderSettings();
    setSettings(loaded);
    if (loaded.defaultOrientation) {
      setCanvasViewMode(loaded.defaultOrientation);
    }

    const handleGeneralUpdated = (e: any) => {
      const generalData = e.detail;
      if (generalData) {
        setSettings((prev) => {
          if (!prev.autoSyncWithGeneral) return prev;
          return {
            ...prev,
            companyName: generalData.companyLegalName || generalData.tradeName || prev.companyName,
            companySubtitle: generalData.erpTagline || prev.companySubtitle,
            logoUrl: generalData.erpLogoUrl || prev.logoUrl,
            factoryAddress: generalData.factoryAddress || generalData.hqAddress || prev.factoryAddress,
            phone: generalData.supportPhone || prev.phone,
            email: generalData.officialEmail || prev.email,
            website: generalData.websiteUrl || prev.website,
            taxRegistrationNumber:
              [generalData.vatRegistrationNo, generalData.bgmeaRegNo].filter(Boolean).join(' / ') ||
              prev.taxRegistrationNumber,
          };
        });
        setStatusMessage({
          type: 'info',
          text: 'Auto-synchronized latest company profile from General Settings!',
        });
      }
    };

    window.addEventListener('erp_general_settings_updated', handleGeneralUpdated as EventListener);
    return () => {
      window.removeEventListener('erp_general_settings_updated', handleGeneralUpdated as EventListener);
    };
  }, []);

  // Force re-sync from General Tab
  const handleForceSyncFromGeneral = () => {
    const general = getGeneralSettingsFromStorage();
    if (general) {
      setSettings((prev) => ({
        ...prev,
        autoSyncWithGeneral: true,
        companyName: general.companyLegalName || general.tradeName || prev.companyName,
        companySubtitle: general.erpTagline || prev.companySubtitle,
        logoUrl: general.erpLogoUrl || prev.logoUrl,
        factoryAddress: general.factoryAddress || general.hqAddress || prev.factoryAddress,
        phone: general.supportPhone || prev.phone,
        email: general.officialEmail || prev.email,
        website: general.websiteUrl || prev.website,
        taxRegistrationNumber:
          [general.vatRegistrationNo, general.bgmeaRegNo].filter(Boolean).join(' / ') ||
          prev.taxRegistrationNumber,
      }));
      setStatusMessage({
        type: 'success',
        text: 'Successfully refreshed Company Name, Logo & Address from General Settings!',
      });
    } else {
      setStatusMessage({
        type: 'info',
        text: 'General settings are already at default values.',
      });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Save Settings
  const handleSave = () => {
    setSaving(true);
    try {
      savePdfHeaderSettings(settings);
      setStatusMessage({
        type: 'success',
        text: 'Universal PDF & Document Header Template saved! All modules will now render this official header.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to save: ${err.message}`,
      });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Dynamic sample docs for all 31 modules reflecting live customizations
  const dynamicSampleDocs = DEFAULT_MODULE_HEADER_CONFIGS.map((mod) => {
    const config = getModuleExportConfig(settings, mod.key, 'register');
    return {
      key: mod.key,
      module: mod.name,
      title: config.title,
      code: config.fullDocCode,
      dept: config.department,
    };
  });

  const sample = dynamicSampleDocs[selectedSampleDoc] || dynamicSampleDocs[0];
  const liveHeaderHtml = renderPdfHeaderHtml(
    settings,
    sample.title,
    sample.code,
    new Date().toISOString().split('T')[0],
    sample.dept
  );

  // Open real print window preview
  const handleTestPrint = () => {
    const headerHtml = renderPdfHeaderHtml(
      settings,
      sample.title,
      sample.code,
      new Date().toISOString().split('T')[0],
      sample.dept
    );

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to preview the printable PDF document.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${sample.code} - Official PDF Header Test</title>
          <meta charset="utf-8" />
          <style>
            @page { size: ${canvasViewMode === 'landscape' ? 'A4 landscape' : 'A4 portrait'}; margin: 10mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 16px;
              font-size: 11px;
            }
            .sample-body-box {
              padding: 24px;
              border: 1px dashed #cbd5e1;
              border-radius: 8px;
              background: #f8fafc;
              text-align: center;
              color: #64748b;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          ${headerHtml}
          <div class="sample-body-box">
            <h3 style="margin: 0 0 8px 0; color: #334155;">Document Body Content Area</h3>
            <p style="margin: 0; font-size: 12px;">This printable preview confirms your header layout (${settings.layoutStyle}) rendering accurately for ${sample.module}.</p>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-700/10 via-indigo-600/10 to-transparent border border-blue-200/60 dark:border-blue-900/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-white shadow-md shadow-blue-700/20">
            <FileDown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Universal PDF Header & Export Template Designer
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                All Modules Scope
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Design the official document header applied across Buyer Orders, Reports & Analysis, QMS Inspections, and CAPA. Auto-synced with Company Name, Logo & Address from General Settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleForceSyncFromGeneral}
            title="Refresh values from Tab 2: General Setting"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            Sync from General Tab
          </button>

          <button
            type="button"
            onClick={handleTestPrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            Test Print Window
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Header Template'}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold border animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <Zap className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Left Controls (Designer), Right Live Preview Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Customization Controls */}
        <div className="lg:col-span-6 space-y-4">
          {/* Card 1: Company Name, Logo & Factory Address (Auto-Sync from General Settings) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Company Identity & Address
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Auto-synchronized from Tab 2: General Setting
                  </p>
                </div>
              </div>

              {/* Auto-Sync Toggle Switch */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.autoSyncWithGeneral}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSettings({ ...settings, autoSyncWithGeneral: checked });
                    if (checked) handleForceSyncFromGeneral();
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative"></div>
                <span className="text-[11px]">
                  {settings.autoSyncWithGeneral ? 'Auto-Sync ON' : 'Custom Override'}
                </span>
              </label>
            </div>

            {settings.autoSyncWithGeneral && (
              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300 font-semibold">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Linked live with General Settings (Legal Name, Brand Logo, Factory Address).</span>
                </div>
                <button
                  type="button"
                  onClick={handleForceSyncFromGeneral}
                  className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 shrink-0 cursor-pointer"
                >
                  Re-Sync
                </button>
              </div>
            )}

            {/* Company Legal Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Official Company / Factory Name (Header Title)
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="Valiant Garments Manufacturing Ltd."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tagline / Subtitle */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Company Subtitle / Tagline
              </label>
              <input
                type="text"
                value={settings.companySubtitle}
                onChange={(e) => setSettings({ ...settings, companySubtitle: e.target.value })}
                placeholder="Global Woven & Knitwear Export Manufacturing Group"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Logo Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Brand Logo URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    placeholder="https://... logo.png"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {settings.logoUrl && (
                    <div className="w-10 h-10 rounded-lg border border-slate-200 p-1 bg-white shrink-0 flex items-center justify-center overflow-hidden">
                      <img src={settings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Logo Size & Position
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="70"
                      max="180"
                      value={settings.logoWidth}
                      onChange={(e) => setSettings({ ...settings, logoWidth: Number(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-[10px] text-slate-400 text-right font-mono">{settings.logoWidth}px width</div>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showLogo}
                      onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                      className="rounded"
                    />
                    <span>Show</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Factory Address */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Factory Facility Address
              </label>
              <input
                type="text"
                value={settings.factoryAddress}
                onChange={(e) => setSettings({ ...settings, factoryAddress: e.target.value })}
                placeholder="Complex 14, Gazipur Industrial Area, Dhaka Division, Bangladesh"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Support Telephone
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+880 2 9845120"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Official Email
                </label>
                <input
                  type="text"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="qms.operations@valiantgarments.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Website URL
                </label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  placeholder="https://valiantgarments.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  BIN / TIN / Trade Reg No
                </label>
                <input
                  type="text"
                  value={settings.taxRegistrationNumber}
                  onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                  placeholder="BIN-00291048201 / BGMEA-7721"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Layout Style & Visual Accents */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Layout className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Header Layout Structure & Aesthetics
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select header layout preset and brand color palette
                </p>
              </div>
            </div>

            {/* Layout Presets Grid */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Layout Preset Styles
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LAYOUT_PRESETS.map((p) => {
                  const isSelected = settings.layoutStyle === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSettings({ ...settings, layoutStyle: p.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-slate-900 dark:text-white">{p.title}</span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette Presets */}
            <div className="pt-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSettings({ ...settings, accentColor: c.hex, secondaryColor: c.secondary })}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      settings.accentColor === c.hex
                        ? 'border-slate-900 dark:border-white shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: c.hex }}></span>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">{c.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Header Density */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Header Vertical Density
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'standard', 'spacious'] as const).map((density) => (
                  <button
                    key={density}
                    type="button"
                    onClick={() => setSettings({ ...settings, headerDensity: density })}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                      settings.headerDensity === density
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance & Security Badges Toggles */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Header Badges & Verification Elements
              </label>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-semibold cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ISO Certification & Factory Compliance Badge</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showIsoCertification}
                    onChange={(e) => setSettings({ ...settings, showIsoCertification: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-semibold cursor-pointer">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>Document Authenticity QR Verification Code</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showQrVerificationCode}
                    onChange={(e) => setSettings({ ...settings, showQrVerificationCode: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-semibold cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Document Code Reference & Date Block</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showDocumentMetadata}
                    onChange={(e) => setSettings({ ...settings, showDocumentMetadata: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Document Code Configuration by Record Type & Page Orientation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Module-Wise Record Name &amp; Document Code Configuration
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Customize the official printed record title and reference code for every ERP operational module (All 31 Modules)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all 31 modules to standard ISO QMS Record Names and Document Codes?')) {
                    setSettings((prev) => ({
                      ...prev,
                      moduleWiseConfigs: {},
                    }));
                    setStatusMessage({
                      type: 'info',
                      text: 'All 31 modules reset to ISO 9001 standard default titles and codes.',
                    });
                    setTimeout(() => setStatusMessage(null), 4000);
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Reset all modules to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Defaults</span>
              </button>
            </div>

            {/* Document Code Prefix & Page Orientation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
              {/* Document Code Global Prefix */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Global Document Code Prefix</span>
                  <span className="text-[10px] font-mono text-slate-400">Default: VAL-QMS</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.docCodePrefix ?? 'VAL-QMS'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        docCodePrefix: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="VAL-QMS"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                    PREFIX
                  </span>
                </div>
              </div>

              {/* Default Page Orientation */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Default PDF Orientation
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, defaultOrientation: 'landscape' });
                      setCanvasViewMode('landscape');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      (settings.defaultOrientation || 'landscape') === 'landscape'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, defaultOrientation: 'portrait' });
                      setCanvasViewMode('portrait');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      settings.defaultOrientation === 'portrait'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Portrait
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Category Filter Toolbar */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={moduleSearchQuery}
                    onChange={(e) => setModuleSearchQuery(e.target.value)}
                    placeholder="Search 31 modules by name, code or department..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {moduleSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setModuleSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-bold text-slate-400 shrink-0 self-center">
                  Showing {
                    DEFAULT_MODULE_HEADER_CONFIGS.filter((m) => {
                      const matchCat =
                        selectedModuleCategory === 'ALL' || m.category === selectedModuleCategory;
                      const q = moduleSearchQuery.toLowerCase();
                      const matchQuery =
                        !q ||
                        m.name.toLowerCase().includes(q) ||
                        m.key.toLowerCase().includes(q) ||
                        m.defaultRegisterTitle.toLowerCase().includes(q) ||
                        m.defaultRegisterDocCode.toLowerCase().includes(q) ||
                        (settings.moduleWiseConfigs?.[m.key]?.registerTitle || '')
                          .toLowerCase()
                          .includes(q) ||
                        (settings.moduleWiseConfigs?.[m.key]?.registerDocCode || '')
                          .toLowerCase()
                          .includes(q);
                      return matchCat && matchQuery;
                    }).length
                  } of 31 Modules
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
                {[
                  'ALL',
                  'Manufacturing & Operations',
                  'Quality Management',
                  'Audits & Compliance',
                  'Standards & Engineering',
                  'Organization & Workforce',
                  'Supply Chain & Inventory',
                  'Executive & Reporting',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedModuleCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                      selectedModuleCategory === cat
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'ALL' ? 'All (31)' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Module Configuration Cards List */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {DEFAULT_MODULE_HEADER_CONFIGS.filter((m) => {
                const matchCat =
                  selectedModuleCategory === 'ALL' || m.category === selectedModuleCategory;
                const q = moduleSearchQuery.toLowerCase();
                const matchQuery =
                  !q ||
                  m.name.toLowerCase().includes(q) ||
                  m.key.toLowerCase().includes(q) ||
                  m.defaultRegisterTitle.toLowerCase().includes(q) ||
                  m.defaultRegisterDocCode.toLowerCase().includes(q) ||
                  (settings.moduleWiseConfigs?.[m.key]?.registerTitle || '')
                    .toLowerCase()
                    .includes(q) ||
                  (settings.moduleWiseConfigs?.[m.key]?.registerDocCode || '')
                    .toLowerCase()
                    .includes(q);
                return matchCat && matchQuery;
              }).map((mod) => {
                const custom = settings.moduleWiseConfigs?.[mod.key];
                const isCustomized =
                  Boolean(custom?.registerTitle) ||
                  Boolean(custom?.registerDocCode) ||
                  Boolean(custom?.singleTitle) ||
                  Boolean(custom?.singleDocCode);

                const currentRegisterTitle = custom?.registerTitle ?? mod.defaultRegisterTitle;
                const currentRegisterDocCode = custom?.registerDocCode ?? mod.defaultRegisterDocCode;
                const currentSingleTitle = custom?.singleTitle ?? mod.defaultSingleTitle;
                const currentSingleDocCode = custom?.singleDocCode ?? mod.defaultSingleDocCode;
                const prefix = settings.docCodePrefix || 'VAL-QMS';

                return (
                  <div
                    key={mod.key}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 transition-colors space-y-3"
                  >
                    {/* Module Header Bar */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {mod.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                          {mod.key}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-800">
                          {mod.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCustomized ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Customized
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Default ISO
                          </span>
                        )}

                        {isCustomized && (
                          <button
                            type="button"
                            onClick={() => {
                              setSettings((prev) => {
                                const copy = { ...(prev.moduleWiseConfigs || {}) };
                                delete copy[mod.key];
                                return {
                                  ...prev,
                                  moduleWiseConfigs: copy,
                                };
                              });
                            }}
                            className="text-[10px] text-slate-400 hover:text-rose-600 font-bold underline cursor-pointer"
                            title="Reset this module to default"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dual Form: Global Register & Single Dossier */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Left: Global Register Config */}
                      <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Global Register Export
                          </span>
                          <span className="text-[9.5px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {prefix}-{currentRegisterDocCode}
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block">
                            Register Record Name (PDF Title):
                          </label>
                          <input
                            type="text"
                            value={currentRegisterTitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSettings((prev) => ({
                                ...prev,
                                moduleWiseConfigs: {
                                  ...(prev.moduleWiseConfigs || {}),
                                  [mod.key]: {
                                    ...(prev.moduleWiseConfigs?.[mod.key] || {}),
                                    registerTitle: val,
                                  },
                                },
                              }));
                            }}
                            placeholder={mod.defaultRegisterTitle}
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block">
                            Register Document Code:
                          </label>
                          <input
                            type="text"
                            value={currentRegisterDocCode}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setSettings((prev) => ({
                                ...prev,
                                moduleWiseConfigs: {
                                  ...(prev.moduleWiseConfigs || {}),
                                  [mod.key]: {
                                    ...(prev.moduleWiseConfigs?.[mod.key] || {}),
                                    registerDocCode: val,
                                  },
                                },
                              }));
                            }}
                            placeholder={mod.defaultRegisterDocCode}
                            className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Right: Individual Dossier Config */}
                      <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Individual Dossier Export
                          </span>
                          <span className="text-[9.5px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {prefix}-{currentSingleDocCode}-[ID]
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block">
                            Dossier Record Name (Single Spec Title):
                          </label>
                          <input
                            type="text"
                            value={currentSingleTitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSettings((prev) => ({
                                ...prev,
                                moduleWiseConfigs: {
                                  ...(prev.moduleWiseConfigs || {}),
                                  [mod.key]: {
                                    ...(prev.moduleWiseConfigs?.[mod.key] || {}),
                                    singleTitle: val,
                                  },
                                },
                              }));
                            }}
                            placeholder={mod.defaultSingleTitle}
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 block">
                            Dossier Document Code:
                          </label>
                          <input
                            type="text"
                            value={currentSingleDocCode}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setSettings((prev) => ({
                                ...prev,
                                moduleWiseConfigs: {
                                  ...(prev.moduleWiseConfigs || {}),
                                  [mod.key]: {
                                    ...(prev.moduleWiseConfigs?.[mod.key] || {}),
                                    singleDocCode: val,
                                  },
                                },
                              }));
                            }}
                            placeholder={mod.defaultSingleDocCode}
                            className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Live Interactive WYSIWYG PDF Header Canvas */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Live Real-Time PDF Canvas Preview
                </h3>
              </div>

              {/* Canvas Orientation Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setCanvasViewMode('landscape')}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                    canvasViewMode === 'landscape' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  A4 Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasViewMode('portrait')}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                    canvasViewMode === 'portrait' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  A4 Portrait
                </button>
              </div>
            </div>

            {/* Sample Document Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1 block">
                Simulate Header with Sample ERP Document:
              </label>
              <div className="relative">
                <select
                  value={selectedSampleDoc}
                  onChange={(e) => setSelectedSampleDoc(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 appearance-none pr-8 cursor-pointer"
                >
                  {dynamicSampleDocs.map((doc, idx) => (
                    <option key={doc.key} value={idx}>
                      [{doc.module}] {doc.title} ({doc.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Paper Canvas Container (Simulates authentic high-grade A4 export paper) */}
            <div className="p-4 sm:p-6 bg-slate-200/80 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner overflow-x-auto">
              <div
                className={`mx-auto bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-8 transition-all duration-200 border border-slate-200 ${
                  canvasViewMode === 'landscape' ? 'min-w-[580px] max-w-2xl' : 'min-w-[420px] max-w-lg'
                }`}
                style={{ minHeight: '380px' }}
              >
                {/* Dynamically Injected WYSIWYG Header */}
                <div dangerouslySetInnerHTML={{ __html: liveHeaderHtml }} />

                {/* Simulated Document Body to demonstrate real PDF page appearance */}
                <div className="mt-6 pt-4 border-t border-slate-200 border-dashed text-slate-400 text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Header validated for {sample.module}</span>
                  </div>

                  <div className="space-y-2 opacity-50">
                    <div className="h-3 bg-slate-200 rounded-sm w-3/4 mx-auto"></div>
                    <div className="h-3 bg-slate-200 rounded-sm w-full mx-auto"></div>
                    <div className="h-3 bg-slate-200 rounded-sm w-5/6 mx-auto"></div>
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      <div className="h-8 bg-slate-100 rounded-sm"></div>
                      <div className="h-8 bg-slate-100 rounded-sm"></div>
                      <div className="h-8 bg-slate-100 rounded-sm"></div>
                      <div className="h-8 bg-slate-100 rounded-sm"></div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-2 font-mono">
                    Page 1 of 1 • Project ULTRA ERP Universal Print Engine
                  </div>
                </div>
              </div>
            </div>

            {/* Applied Modules Ledger */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Active PDF Header Binding in ERP Modules:</span>
                <span className="text-[10px] font-mono text-emerald-600 font-extrabold">100% UNIFIED</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Buyer & Purchase Orders',
                  'Daily Production Reports',
                  'AQL Quality Inspections',
                  'CAPA 8D Reports',
                  'Fabric Inward QC',
                  'Lab Testing Certificates',
                  'Line Balancing Bulletins',
                  'ISO Audit Checklists',
                  'Traceability Passports',
                ].map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1"
                  >
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
