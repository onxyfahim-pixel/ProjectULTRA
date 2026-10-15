'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  Upload,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileCode,
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
  renderPdfFooterSignaturesHtml,
  DEFAULT_PDF_SIGNATURE_SETTINGS,
  PdfSignatureSettings,
  PdfSignatureMode,
  getModuleSignatureSettings,
  getActiveSignatureSlots,
  SignatureSlotConfig,
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

const ALL_SIGNATURE_SLOTS = [
  {
    key: 'slot1' as const,
    num: 1 as const,
    roleTag: 'Initiator / Floor QC',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    defaultTitle: 'PREPARED & INSPECTED BY',
    defaultDesignation: 'Lead Quality Auditor / Line QC',
    defaultDept: 'Quality Assurance & Operations',
  },
  {
    key: 'slot2' as const,
    num: 2 as const,
    roleTag: 'Supervisor / Verifier',
    badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    defaultTitle: 'CHECKED & REVIEWED BY',
    defaultDesignation: 'Production Supervisor / Section In-Charge',
    defaultDept: 'Garment Manufacturing & Floor Control',
  },
  {
    key: 'slot3' as const,
    num: 3 as const,
    roleTag: 'Technical / IE Specialist',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    defaultTitle: 'TECHNICAL & IE VERIFICATION',
    defaultDesignation: 'Industrial Engineering & Work Study Lead',
    defaultDept: 'Industrial Engineering Division',
  },
  {
    key: 'slot4' as const,
    num: 4 as const,
    roleTag: 'QA Head / QMS Manager',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    defaultTitle: 'QUALITY ASSURANCE HEAD',
    defaultDesignation: 'Quality Assurance Manager / QMS Lead',
    defaultDept: 'Executive Quality Assurance Directorate',
  },
  {
    key: 'slot5' as const,
    num: 5 as const,
    roleTag: 'Factory GM / Operations Review',
    badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    defaultTitle: 'OPERATIONS & FACTORY REVIEW',
    defaultDesignation: 'AGM Operations / Factory Manager',
    defaultDept: 'Plant Operations & Manufacturing Directorate',
  },
  {
    key: 'slot6' as const,
    num: 6 as const,
    roleTag: 'Executive / Final Approver',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    defaultTitle: 'AUTHORIZED & APPROVED BY',
    defaultDesignation: 'General Manager / Executive Director',
    defaultDept: 'Executive Factory Directorate',
  },
];

const SIGNATURE_MODES: {
  id: PdfSignatureMode;
  count: number;
  label: string;
  sub: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'single',
    count: 1,
    label: '1 (Single)',
    sub: 'Solo Approver',
    badge: 'Solo',
    description: 'Single executive sign-off block on the right. Ideal for rapid verification slips and packing tallies.',
  },
  {
    id: 'dual',
    count: 2,
    label: '2 (Dual)',
    sub: 'Prepared + Approved',
    badge: 'ISO Standard',
    description: 'Standard dual sign-off: Prepared & Inspected (Left) and Authorized & Approved (Right). Default for standard QMS records.',
  },
  {
    id: 'triple',
    count: 3,
    label: '3 (Triple)',
    sub: '3-Tier Sign-Off',
    badge: 'Tri-Tier',
    description: '3-tier authorization: Initiator (Left), Checked & Reviewed (Center), and Authorized & Approved (Right).',
  },
  {
    id: 'quad',
    count: 4,
    label: '4 (Quad)',
    sub: '4-Tier Operational',
    badge: '4-Tier Audit',
    description: '4-tier operational review: Inspector + Floor Supervisor + QA Head + Factory Approver across balanced columns.',
  },
  {
    id: 'penta',
    count: 5,
    label: '5 (Penta)',
    sub: '5-Tier Plant Hierarchy',
    badge: '5-Tier Hierarchy',
    description: '5-tier hierarchy: Auditor + Supervisor + Technical/IE Specialist + QA Head + Operations Approver.',
  },
  {
    id: 'hexa',
    count: 6,
    label: '6 (Hexa)',
    sub: '6-Tier Full Hierarchy',
    badge: 'Max 6 (Enterprise)',
    description: 'Maximum 6-tier executive hierarchy: Auditor + Supervisor + IE Specialist + QA Head + Factory GM + Managing Director. Formatted in 2 balanced rows on A4.',
  },
];

function isSlotActiveInMode(
  slotNum: 1 | 2 | 3 | 4 | 5 | 6,
  mode: PdfSignatureMode
): boolean {
  if (mode === 'single') return slotNum === 6;
  if (mode === 'dual') return slotNum === 1 || slotNum === 6;
  if (mode === 'triple') return slotNum === 1 || slotNum === 2 || slotNum === 6;
  if (mode === 'quad') return slotNum === 1 || slotNum === 2 || slotNum === 4 || slotNum === 6;
  if (mode === 'penta') return slotNum === 1 || slotNum === 2 || slotNum === 3 || slotNum === 4 || slotNum === 6;
  if (mode === 'hexa') return true;
  return slotNum === 1 || slotNum === 6;
}

const SETTINGS_SECTIONS = [
  { id: 'branding' as const, label: 'Company & Logo', icon: Building2, desc: 'Name, logo, positions & address' },
  { id: 'layout' as const, label: 'Layout & Aesthetics', icon: Layout, desc: 'Presets, colors, density & badges' },
  { id: 'signatures' as const, label: 'Signatures Matrix', icon: FileText, badge: '1-6 Tiers', desc: 'Global & module authorization' },
  { id: 'doc_codes' as const, label: 'Document Codes', icon: Sliders, badge: `${DEFAULT_MODULE_HEADER_CONFIGS.length} Modules`, desc: 'Record titles & prefix codes' },
  { id: 'all' as const, label: 'View All', icon: Layers, desc: 'Show all settings cards' },
];

export function ExportTemplatesTab() {
  const [settings, setSettings] = useState<PdfHeaderSettings>(DEFAULT_PDF_HEADER_SETTINGS);
  const [activeSection, setActiveSection] = useState<'branding' | 'layout' | 'signatures' | 'doc_codes' | 'all'>('branding');
  const [selectedSampleDoc, setSelectedSampleDoc] = useState(0);
  const [canvasViewMode, setCanvasViewMode] = useState<'portrait' | 'landscape'>('landscape');
  const [saving, setSaving] = useState(false);
  const [signatureScope, setSignatureScope] = useState<'global' | string>('global');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [selectedModuleCategory, setSelectedModuleCategory] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const brandLogoFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleBrandLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a valid image file (PNG, JPG, SVG, WebP).',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'Logo image must be smaller than 2MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setSettings((prev) => ({
          ...prev,
          logoUrl: dataUrl,
          showLogo: true,
        }));

        // Also sync back to General Settings so both tabs are 100% aligned
        try {
          const existingGen = localStorage.getItem('garments_erp_general_settings');
          if (existingGen) {
            const parsedGen = JSON.parse(existingGen);
            parsedGen.erpLogoUrl = dataUrl;
            localStorage.setItem('garments_erp_general_settings', JSON.stringify(parsedGen));
          }
        } catch {}

        window.dispatchEvent(
          new CustomEvent('erp_general_settings_updated', {
            detail: { erpLogoUrl: dataUrl },
          })
        );

        setStatusMessage({
          type: 'success',
          text: 'Brand logo uploaded successfully! Preview updated.',
        });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Failed to read the logo file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBrandLogo = () => {
    setSettings((prev) => ({ ...prev, logoUrl: '', showLogo: false }));
    try {
      const existingGen = localStorage.getItem('garments_erp_general_settings');
      if (existingGen) {
        const parsedGen = JSON.parse(existingGen);
        parsedGen.erpLogoUrl = '';
        localStorage.setItem('garments_erp_general_settings', JSON.stringify(parsedGen));
      }
    } catch {}
    window.dispatchEvent(
      new CustomEvent('erp_general_settings_updated', {
        detail: { erpLogoUrl: '' },
      })
    );
    setStatusMessage({
      type: 'info',
      text: 'Brand logo removed.',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Derived signature scope helpers
  const isGlobalScope = signatureScope === 'global';
  const activeModuleDef = useMemo(() => {
    if (isGlobalScope) return null;
    return DEFAULT_MODULE_HEADER_CONFIGS.find((m) => m.key === signatureScope) || null;
  }, [isGlobalScope, signatureScope]);

  const isModuleCustomized = Boolean(
    !isGlobalScope &&
    settings.moduleWiseSignatures?.[signatureScope] &&
    settings.moduleWiseSignatures[signatureScope].useModuleCustom !== false
  );

  const currentScopeSignatures: PdfSignatureSettings = useMemo(() => {
    if (isGlobalScope) {
      return settings.signatureSettings || DEFAULT_PDF_SIGNATURE_SETTINGS;
    }
    if (isModuleCustomized) {
      return settings.moduleWiseSignatures![signatureScope];
    }
    return {
      ...(settings.signatureSettings || DEFAULT_PDF_SIGNATURE_SETTINGS),
      useModuleCustom: false,
    };
  }, [isGlobalScope, isModuleCustomized, settings.signatureSettings, settings.moduleWiseSignatures, signatureScope]);

  const updateCurrentScopeSignatures = (
    updater: (prev: PdfSignatureSettings) => PdfSignatureSettings
  ) => {
    setSettings((prev) => {
      if (isGlobalScope) {
        const current = prev.signatureSettings || DEFAULT_PDF_SIGNATURE_SETTINGS;
        return {
          ...prev,
          signatureSettings: updater(current),
        };
      } else {
        const currentGlobal = prev.signatureSettings || DEFAULT_PDF_SIGNATURE_SETTINGS;
        const currentModule = prev.moduleWiseSignatures?.[signatureScope] || {
          ...currentGlobal,
          useModuleCustom: true,
        };
        const updated = updater({
          ...currentModule,
          useModuleCustom: true,
        });
        return {
          ...prev,
          moduleWiseSignatures: {
            ...(prev.moduleWiseSignatures || {}),
            [signatureScope]: updated,
          },
        };
      }
    });
  };

  const updateSlotField = (
    slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4' | 'slot5' | 'slot6',
    field: 'title' | 'designation' | 'department' | 'name',
    value: string
  ) => {
    updateCurrentScopeSignatures((prev) => {
      const existingSlot = prev[slotKey] || DEFAULT_PDF_SIGNATURE_SETTINGS[slotKey] || { title: '', designation: '', name: '' };
      const updatedSlot = {
        ...existingSlot,
        [field]: value,
      };
      const newSettings: PdfSignatureSettings = {
        ...prev,
        [slotKey]: updatedSlot,
      };
      // Keep legacy slot3 in sync if slot6 was modified for older modules
      if (slotKey === 'slot6' && field === 'title') {
        newSettings.slot3 = { ...(newSettings.slot3 || existingSlot), [field]: value };
      }
      return newSettings;
    });
  };

  const customizedModulesCount = useMemo(() => {
    return Object.keys(settings.moduleWiseSignatures || {}).filter(
      (k) => settings.moduleWiseSignatures?.[k]?.useModuleCustom !== false
    ).length;
  }, [settings.moduleWiseSignatures]);

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
  const previewSignatureModuleKey = signatureScope !== 'global' ? signatureScope : undefined;
  const liveSignaturesHtml = renderPdfFooterSignaturesHtml(settings, {
    moduleKey: previewSignatureModuleKey,
  });

  // Open real print window preview
  const handleTestPrint = () => {
    const headerHtml = renderPdfHeaderHtml(
      settings,
      sample.title,
      sample.code,
      new Date().toISOString().split('T')[0],
      sample.dept
    );
    const signaturesHtml = renderPdfFooterSignaturesHtml(settings, {
      moduleKey: previewSignatureModuleKey,
    });

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to preview the printable PDF document.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${sample.code} - Official PDF Export & Signatures Test</title>
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
            <p style="margin: 0; font-size: 12px;">This printable preview confirms your header layout (${settings.layoutStyle}) and optional signature blocks rendering accurately for ${sample.module}.</p>
          </div>
          ${signaturesHtml}
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

      {/* Category Navigation Pills Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
        {SETTINGS_SECTIONS.map((sec) => {
          const isSelected = activeSection === sec.id;
          const IconComp = sec.icon;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{sec.label}</span>
              {sec.badge && (
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/60 dark:border-slate-700'
                  }`}
                >
                  {sec.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Controls (Designer), Right Live Preview Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (6 cols): Customization Controls */}
        <div className="lg:col-span-6 space-y-4">
          {/* Card 1: Company Name, Logo & Factory Address (Auto-Sync from General Settings) */}
          {(activeSection === 'branding' || activeSection === 'all') && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Company Identity &amp; Header Alignment
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
                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300 font-semibold">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Linked live with General Settings (Legal Name, Brand Logo, Factory Address).</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleForceSyncFromGeneral}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 shrink-0 cursor-pointer shadow-2xs"
                  >
                    Re-Sync Now
                  </button>
                </div>
              )}

              {/* Sub-Card 1: Company Legal Identity */}
              <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Factory Legal Name &amp; Tagline</span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                      Official Company / Factory Name (Header Title)
                    </label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      placeholder="Valiant Garments Manufacturing Ltd."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                      Company Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={settings.companySubtitle}
                      onChange={(e) => setSettings({ ...settings, companySubtitle: e.target.value })}
                      placeholder="Global Woven &amp; Knitwear Export Manufacturing Group"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Card 2: Brand Logo & File Upload */}
              <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Brand Logo
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showLogo}
                      onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Show Logo in Header</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Logo Preview box */}
                  <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 p-1.5 bg-white shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Upload & Clear buttons */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={brandLogoFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleBrandLogoFileUpload}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => brandLogoFileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo File</span>
                      </button>
                      {settings.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveBrandLogo}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Direct URL / Path input */}
                    <input
                      type="text"
                      value={settings.logoUrl}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      placeholder="https://... logo.png or upload image above"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Logo Width slider */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                    Logo Size:
                  </span>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    value={settings.logoWidth}
                    onChange={(e) => setSettings({ ...settings, logoWidth: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-[10px] text-slate-500 font-mono w-12 text-right font-bold">
                    {settings.logoWidth}px
                  </span>
                </div>
              </div>

              {/* Sub-Card 3: Header Element Positions & Alignments */}
              <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Header Element Positions &amp; Alignment
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Live Canvas Updates</span>
                </div>

                {/* 1. Company Name Position */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Company Name &amp; Details Position
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'left' as const, label: 'Left (Default)', icon: AlignLeft },
                      { id: 'center' as const, label: 'Center', icon: AlignCenter },
                      { id: 'right' as const, label: 'Right', icon: AlignRight },
                    ].map((pos) => {
                      const isSelected = (settings.companyPosition || 'left') === pos.id;
                      const IconComp = pos.icon;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setSettings({ ...settings, companyPosition: pos.id })}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{pos.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Brand Logo Position */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Brand Logo Position (Relative to Company Name)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'left' as const, label: 'Left of Name' },
                      { id: 'top' as const, label: 'Above Name (Top)' },
                      { id: 'right' as const, label: 'Right of Name' },
                    ].map((lpos) => {
                      const isSelected = (settings.logoPosition || 'left') === lpos.id;
                      return (
                        <button
                          key={lpos.id}
                          type="button"
                          onClick={() => setSettings({ ...settings, logoPosition: lpos.id })}
                          className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          {lpos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Document Code Position ("doc code") */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Document Code &amp; Date Position
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'right' as const, label: 'Top Right (Default)' },
                      { id: 'left' as const, label: 'Top Left' },
                      { id: 'below_title' as const, label: 'Under Title (Badge)' },
                      { id: 'center' as const, label: 'Centered' },
                    ].map((dcpos) => {
                      const isSelected = (settings.docCodePosition || 'right') === dcpos.id;
                      return (
                        <button
                          key={dcpos.id}
                          type="button"
                          onClick={() => setSettings({ ...settings, docCodePosition: dcpos.id })}
                          className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          {dcpos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sub-Card 4: Factory Facility Address & Contacts */}
              <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Facility Address &amp; Contact Information
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                    Factory Facility Address
                  </label>
                  <input
                    type="text"
                    value={settings.factoryAddress}
                    onChange={(e) => setSettings({ ...settings, factoryAddress: e.target.value })}
                    placeholder="Complex 14, Gazipur Industrial Area, Dhaka Division, Bangladesh"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                      Support Telephone
                    </label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="+880 2 9845120"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                      Official Email
                    </label>
                    <input
                      type="text"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      placeholder="qms.operations@valiantgarments.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                      Website URL
                    </label>
                    <input
                      type="text"
                      value={settings.website}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      placeholder="https://valiantgarments.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                      BIN / TIN / Trade Reg No
                    </label>
                    <input
                      type="text"
                      value={settings.taxRegistrationNumber}
                      onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                      placeholder="BIN-00291048201 / BGMEA-7721"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Layout Style & Visual Accents */}
          {(activeSection === 'layout' || activeSection === 'all') && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                  <Layout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Header Layout Structure &amp; Aesthetics
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select header layout preset, brand accent colors, density &amp; compliance badges
                  </p>
                </div>
              </div>

              {/* Layout Presets Grid */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Layout Preset Styles
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LAYOUT_PRESETS.map((p) => {
                    const isSelected = settings.layoutStyle === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, layoutStyle: p.id })}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-600/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-850 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-xs text-slate-900 dark:text-white">{p.title}</span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200/60'
                            }`}
                          >
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Palette Presets */}
              <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Brand Accent Color Palette
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSettings({ ...settings, accentColor: c.hex, secondaryColor: c.secondary })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        settings.accentColor === c.hex
                          ? 'border-blue-600 bg-white text-blue-900 ring-2 ring-blue-600/20 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ background: c.hex }}></span>
                      <span className="text-[11px]">{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Header Density */}
              <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Header Vertical Spacing Density
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'standard', 'spacious'] as const).map((density) => (
                    <button
                      key={density}
                      type="button"
                      onClick={() => setSettings({ ...settings, headerDensity: density })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        settings.headerDensity === density
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliance & Security Badges Toggles */}
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Header Compliance &amp; Security Badges
                </label>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/60 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>ISO Certification &amp; Factory Compliance Badge</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showIsoCertification}
                      onChange={(e) => setSettings({ ...settings, showIsoCertification: e.target.checked })}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/60 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-blue-600" />
                      <span>Document Authenticity QR Verification Code</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showQrVerificationCode}
                      onChange={(e) => setSettings({ ...settings, showQrVerificationCode: e.target.checked })}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/60 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <span>Document Code Reference &amp; Date Block</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showDocumentMetadata}
                      onChange={(e) => setSettings({ ...settings, showDocumentMetadata: e.target.checked })}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Card: Document Signatures & Authorization Sign-Off Configuration */}
          {(activeSection === 'signatures' || activeSection === 'all') && (
            <div
              id="signatures-config-card"
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4"
            >
              {/* Header: Title and Reset/Restore Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Document Signatures &amp; Authorization Hierarchy
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        1 to 6 Signatures
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Configure official signatory titles, roles, designations, and departments. Customize globally or independently per ERP module (All 31 Modules).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isGlobalScope ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset Global Default Signatures to factory standard ISO defaults?')) {
                          setSettings((prev) => ({
                            ...prev,
                            signatureSettings: DEFAULT_PDF_SIGNATURE_SETTINGS,
                          }));
                          setStatusMessage({
                            type: 'info',
                            text: 'Restored Global Default ISO QMS signatures to factory defaults.',
                          });
                          setTimeout(() => setStatusMessage(null), 3500);
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Reset global signatures to default"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Global Defaults</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isModuleCustomized && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Revert signatures for ${activeModuleDef?.name || signatureScope} to Global Defaults?`)) {
                              setSettings((prev) => {
                                const copy = { ...(prev.moduleWiseSignatures || {}) };
                                delete copy[signatureScope];
                                return {
                                  ...prev,
                                  moduleWiseSignatures: copy,
                                };
                              });
                              setStatusMessage({
                                type: 'info',
                                text: `Reverted ${activeModuleDef?.name || signatureScope} signatures to Global Defaults.`,
                              });
                              setTimeout(() => setStatusMessage(null), 3500);
                            }
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                          title="Revert this module to inherit global signatures"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revert to Global</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const globalBase = settings.signatureSettings || DEFAULT_PDF_SIGNATURE_SETTINGS;
                          setSettings((prev) => ({
                            ...prev,
                            moduleWiseSignatures: {
                              ...(prev.moduleWiseSignatures || {}),
                              [signatureScope]: {
                                ...JSON.parse(JSON.stringify(globalBase)),
                                useModuleCustom: true,
                              },
                            },
                          }));
                          setStatusMessage({
                            type: 'success',
                            text: `Copied Global Default Signatures to ${activeModuleDef?.name || signatureScope}.`,
                          });
                          setTimeout(() => setStatusMessage(null), 3500);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Copy global signatures into this module"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy from Global</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Scope Switcher: Global vs. Module-Wise (31 Modules) */}
              <div className="p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Configuration Scope:
                    </span>
                    {customizedModulesCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200/80">
                        {customizedModulesCount} of 31 modules customized
                      </span>
                    )}
                  </div>

                  {/* Scope selector tabs */}
                  <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 self-start sm:self-auto text-xs font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setSignatureScope('global')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        isGlobalScope
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>🌐 Global Default Signatures</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isGlobalScope) {
                          setSignatureScope(DEFAULT_MODULE_HEADER_CONFIGS[0].key);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        !isGlobalScope
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>🧩 Module Specific Override</span>
                    </button>
                  </div>
                </div>

              {/* Module Dropdown Selector (Active when a module or module scope is chosen) */}
              {!isGlobalScope && (
                <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/40 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      Select ERP Module to Configure:
                    </label>
                    <div className="relative flex-1">
                      <select
                        value={signatureScope}
                        onChange={(e) => {
                          const newKey = e.target.value;
                          setSignatureScope(newKey);
                          const sampleIdx = dynamicSampleDocs.findIndex((d) => d.key === newKey);
                          if (sampleIdx >= 0) setSelectedSampleDoc(sampleIdx);
                        }}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none pr-8 cursor-pointer shadow-2xs"
                      >
                        {[
                          'Manufacturing & Operations',
                          'Quality Management',
                          'Audits & Compliance',
                          'Standards & Engineering',
                          'Organization & Workforce',
                          'Supply Chain & Inventory',
                          'Executive & Reporting',
                        ].map((cat) => {
                          const modsInCat = DEFAULT_MODULE_HEADER_CONFIGS.filter((m) => m.category === cat);
                          if (modsInCat.length === 0) return null;
                          return (
                            <optgroup key={cat} label={`── ${cat} ──`}>
                              {modsInCat.map((m) => {
                                const hasCustom = Boolean(
                                  settings.moduleWiseSignatures?.[m.key]?.useModuleCustom !== false &&
                                    settings.moduleWiseSignatures?.[m.key]
                                );
                                return (
                                  <option key={m.key} value={m.key}>
                                    {m.name} ({m.key}) {hasCustom ? '★ [CUSTOM SIGNATURES]' : ''}
                                  </option>
                                );
                              })}
                            </optgroup>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Module Inheritance Banner & Quick Customizer */}
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isModuleCustomized ? 'bg-purple-600 ring-2 ring-purple-600/30' : 'bg-blue-500'
                        }`}
                      />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {isModuleCustomized ? (
                          <>
                            <strong>Custom Signatures Active:</strong> This module uses its own dedicated{' '}
                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                              {currentScopeSignatures.mode?.toUpperCase()} (
                              {getActiveSignatureSlots(currentScopeSignatures).length} Signatures)
                            </span>{' '}
                            hierarchy.
                          </>
                        ) : (
                          <>
                            <strong>Inheriting Global Defaults:</strong> Currently using the universal Global signatures.
                            Edit any slot below to create an independent custom profile.
                          </>
                        )}
                      </span>
                    </div>

                    {!isModuleCustomized && (
                      <button
                        type="button"
                        onClick={() => {
                          const globalBase = settings.signatureSettings || DEFAULT_PDF_SIGNATURE_SETTINGS;
                          setSettings((prev) => ({
                            ...prev,
                            moduleWiseSignatures: {
                              ...(prev.moduleWiseSignatures || {}),
                              [signatureScope]: {
                                ...JSON.parse(JSON.stringify(globalBase)),
                                useModuleCustom: true,
                              },
                            },
                          }));
                          setStatusMessage({
                            type: 'success',
                            text: `Enabled custom signatures for ${activeModuleDef?.name || signatureScope}.`,
                          });
                          setTimeout(() => setStatusMessage(null), 3500);
                        }}
                        className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Create Custom Profile</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Scope Active Notification Banner */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">
                  Editing Target:
                </span>
                <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  {isGlobalScope ? (
                    '🌐 Global Default (All 31 Modules without overrides)'
                  ) : (
                    <>
                      <span>{activeModuleDef?.name || signatureScope}</span>
                      <span className="font-mono text-[10px] text-slate-400">({signatureScope})</span>
                    </>
                  )}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                Mode: {currentScopeSignatures.mode?.toUpperCase() || 'DUAL'} (
                {getActiveSignatureSlots(currentScopeSignatures).length} Active)
              </span>
            </div>

            {/* Global/Module Enable & Print Date Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white hover:bg-slate-50/60 dark:bg-slate-800/40 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      currentScopeSignatures.enabled !== false
                        ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Include Signatures on PDF Exports
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      {isGlobalScope ? 'Enable by default across ERP exports' : `Print signatures for ${activeModuleDef?.name || signatureScope}`}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentScopeSignatures.enabled !== false}
                  onChange={(e) => {
                    const val = e.target.checked;
                    updateCurrentScopeSignatures((prev) => ({
                      ...prev,
                      enabled: val,
                    }));
                  }}
                  className="rounded text-purple-600 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white hover:bg-slate-50/60 dark:bg-slate-800/40 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      currentScopeSignatures.showDate !== false
                        ? 'bg-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Print Sign-Off Date on Signature Blocks
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Prints formatted export date underneath designation
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentScopeSignatures.showDate !== false}
                  onChange={(e) => {
                    const val = e.target.checked;
                    updateCurrentScopeSignatures((prev) => ({
                      ...prev,
                      showDate: val,
                    }));
                  }}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Visual Presentation Style */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Visual Presentation Style:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'classic_line', label: 'Dashed Line', sub: 'Standard ISO line' },
                  { id: 'bordered_card', label: 'Bordered Box', sub: 'Formal stamped box' },
                  { id: 'modern_minimal', label: 'Clean Solid', sub: 'Executive solid line' },
                ].map((st) => {
                  const isSelected = (currentScopeSignatures.style || 'classic_line') === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        updateCurrentScopeSignatures((prev) => ({
                          ...prev,
                          style: st.id as any,
                        }));
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-300 hover:bg-purple-50/20 shadow-2xs'
                      }`}
                    >
                      <div className="text-xs font-bold">{st.label}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                        {st.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Signature Authorization Mode (Maximum 6 Signatures) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Signature Authorization Count</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/80">
                      Maximum 6 Options
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Select between 1 and 6 signature approval slots to match your factory hierarchy:
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 self-start sm:self-auto">
                  Active: {currentScopeSignatures.mode?.toUpperCase() || 'DUAL'} ({getActiveSignatureSlots(currentScopeSignatures).length} of 6 Slots)
                </span>
              </div>

              {/* 6 Mode Options Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {SIGNATURE_MODES.map((m) => {
                  const isSelected = (currentScopeSignatures.mode || 'dual') === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        updateCurrentScopeSignatures((prev) => ({
                          ...prev,
                          mode: m.id,
                          count: m.count,
                        }));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white shadow-xs ring-2 ring-purple-600/20'
                          : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-purple-300 hover:bg-purple-50/20 dark:hover:border-purple-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black">{m.label}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-purple-800 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] leading-tight line-clamp-2 mt-1 ${
                          isSelected ? 'text-purple-100 font-medium' : 'text-slate-500'
                        }`}
                      >
                        {m.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mode Description helper banner */}
              {(() => {
                const activeModeObj =
                  SIGNATURE_MODES.find((m) => m.id === (currentScopeSignatures.mode || 'dual')) ||
                  SIGNATURE_MODES[1];
                return (
                  <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/60 flex items-start gap-2.5 text-xs text-purple-950 dark:text-purple-300 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{activeModeObj.label} Mode: </span>
                      <span className="text-purple-800/90 dark:text-purple-300/90">{activeModeObj.description}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Editable Signature Slots Grid (Slots 1 to 6) */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                    Configure Signature Slots 1 Through 6
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Edit official labels, roles, departments, and printed names. Active slots are printed according to the selected mode.
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60">
                  {getActiveSignatureSlots(currentScopeSignatures).length} of 6 Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ALL_SIGNATURE_SLOTS.map((slot) => {
                  const currentMode = currentScopeSignatures.mode || 'dual';
                  const isActive = isSlotActiveInMode(slot.num, currentMode);
                  const slotConfig =
                    currentScopeSignatures[slot.key] ||
                    (slot.key === 'slot6' ? currentScopeSignatures.slot3 : undefined) ||
                    DEFAULT_PDF_SIGNATURE_SETTINGS[slot.key] || {
                      title: slot.defaultTitle,
                      designation: slot.defaultDesignation,
                      department: slot.defaultDept,
                      name: '',
                    };

                  const titleVal = slotConfig.title ?? slot.defaultTitle;
                  const designationVal = slotConfig.designation ?? slot.defaultDesignation;
                  const departmentVal = slotConfig.department ?? slot.defaultDept;
                  const nameVal = slotConfig.name ?? '';

                  return (
                    <div
                      key={slot.key}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        isActive
                          ? 'border-purple-200/90 dark:border-purple-900/50 bg-white dark:bg-slate-800/80 shadow-xs ring-1 ring-purple-500/10'
                          : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
                      }`}
                    >
                      {/* Slot Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isActive
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {slot.num}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              Signature {slot.num}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${slot.badgeClass}`}
                          >
                            {slot.roleTag}
                          </span>
                          {isActive ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title / Label */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 flex items-center justify-between">
                          <span>Sign-Off Title / Printed Header:</span>
                          <span className="text-[9px] font-normal text-slate-400">UPPERCASE</span>
                        </label>
                        <input
                          type="text"
                          value={titleVal}
                          onChange={(e) => updateSlotField(slot.key, 'title', e.target.value.toUpperCase())}
                          placeholder={slot.defaultTitle}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-purple-500 shadow-2xs"
                        />
                      </div>

                      {/* Designation / Role */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 block">
                          Designation / Official Job Role:
                        </label>
                        <input
                          type="text"
                          value={designationVal}
                          onChange={(e) => updateSlotField(slot.key, 'designation', e.target.value)}
                          placeholder={slot.defaultDesignation}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 shadow-2xs"
                        />
                      </div>

                      {/* Department / Division */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 block">
                          Department / Operational Unit:
                        </label>
                        <input
                          type="text"
                          value={departmentVal}
                          onChange={(e) => updateSlotField(slot.key, 'department', e.target.value)}
                          placeholder={slot.defaultDept}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 shadow-2xs"
                        />
                      </div>

                      {/* Printed Name (Optional) */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 flex items-center justify-between">
                          <span>Printed Signatory Name (Optional):</span>
                          <span className="text-[9px] text-slate-400 font-normal">Leave blank for ink sign</span>
                        </label>
                        <input
                          type="text"
                          value={nameVal}
                          onChange={(e) => updateSlotField(slot.key, 'name', e.target.value)}
                          placeholder="Leave blank for manual pen signature / rubber stamp"
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500 shadow-2xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

          {/* Card 3: Document Code Configuration by Record Type & Page Orientation */}
          {(activeSection === 'doc_codes' || activeSection === 'all') && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Module-Wise Record Name &amp; Document Code Configuration
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Customize the official printed record title and reference code for every ERP operational module (All {DEFAULT_MODULE_HEADER_CONFIGS.length} Modules)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Reset all ${DEFAULT_MODULE_HEADER_CONFIGS.length} modules to standard ISO QMS Record Names and Document Codes?`)) {
                      setSettings((prev) => ({
                        ...prev,
                        moduleWiseConfigs: {},
                      }));
                      setStatusMessage({
                        type: 'info',
                        text: `All ${DEFAULT_MODULE_HEADER_CONFIGS.length} modules reset to ISO 9001 standard default titles and codes.`,
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
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
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase shadow-2xs"
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
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
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
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
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
                      placeholder={`Search ${DEFAULT_MODULE_HEADER_CONFIGS.length} modules by name, code or department...`}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
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
                    } of {DEFAULT_MODULE_HEADER_CONFIGS.length} Modules
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
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                        selectedModuleCategory === cat
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs'
                      }`}
                    >
                      {cat === 'ALL' ? `All (${DEFAULT_MODULE_HEADER_CONFIGS.length})` : cat}
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
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-xs transition-all space-y-3"
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
                          {/* Module Signature Quick Indicator & Jump */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection('signatures');
                              setSignatureScope(mod.key);
                              const sampleIdx = dynamicSampleDocs.findIndex((d) => d.key === mod.key);
                              if (sampleIdx >= 0) setSelectedSampleDoc(sampleIdx);
                              const el = document.getElementById('signatures-config-card');
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                              settings.moduleWiseSignatures?.[mod.key]?.useModuleCustom !== false &&
                              settings.moduleWiseSignatures?.[mod.key]
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600'
                            }`}
                            title="Configure custom signatures for this module"
                          >
                            <FileText className="w-3 h-3 text-purple-500" />
                            <span>
                              {settings.moduleWiseSignatures?.[mod.key]?.useModuleCustom !== false &&
                              settings.moduleWiseSignatures?.[mod.key]
                                ? `Signatures: ${settings.moduleWiseSignatures[mod.key].mode?.toUpperCase() || 'CUSTOM'} (${
                                    getActiveSignatureSlots(settings.moduleWiseSignatures[mod.key]).length
                                  })`
                                : 'Signatures: Global'}
                            </span>
                          </button>

                          {isCustomized ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Custom Doc Code
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
                        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 shadow-2xs">
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
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
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
                              className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Right: Individual Dossier Config */}
                        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 shadow-2xs">
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
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
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
                              className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (6 cols): Live Interactive WYSIWYG PDF Header Canvas */}
        <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-4 self-start">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 appearance-none pr-8 cursor-pointer shadow-2xs"
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
            <div className="p-4 sm:p-6 bg-slate-100/90 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto">
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

                {/* Live Real-time Signatures Preview Block */}
                {Boolean(liveSignaturesHtml) && (
                  <div className="mt-4 pt-2 border-t border-slate-200">
                    <div className="text-[9px] font-bold text-purple-600 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1">
                      <span>
                        ✓ Official Signatures Preview •{' '}
                        {isGlobalScope ? 'Global Default' : (activeModuleDef?.name || signatureScope)}{' '}
                        ({currentScopeSignatures.mode?.toUpperCase() || 'DUAL'} MODE —{' '}
                        {getActiveSignatureSlots(currentScopeSignatures).length} SIGNATURES)
                      </span>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: liveSignaturesHtml }} />
                  </div>
                )}
              </div>
            </div>

            {/* Applied Modules Ledger */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
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
