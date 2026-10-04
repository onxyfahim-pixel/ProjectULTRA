'use client';

import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  Check,
  Sparkles,
  Sliders,
  Type,
  Maximize2,
  Minimize2,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Layers,
  Square,
  CircleDot,
  RotateCcw,
  Sparkle,
} from 'lucide-react';
import {
  useAppearance,
  OverallUiStyle,
  OverallUiSize,
  SidebarStyle,
  TopbarStyle,
  CardStyle,
  ButtonStyle,
  AccentColor,
  FontFamily,
  ThemeMode,
} from '@/hooks/use-appearance';

export function AppearanceTab() {
  const { appearance, updateAppearance, resetAppearance } = useAppearance();
  const [savedNotice, setSavedNotice] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const triggerChange = (updates: any, actionName: string) => {
    updateAppearance(updates);
    setLastAction(actionName);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const accents: { id: AccentColor; name: string; bg: string; hex: string }[] = [
    { id: 'blue', name: 'Electric Blue', bg: 'bg-blue-600', hex: '#2563eb' },
    { id: 'indigo', name: 'Royal Indigo', bg: 'bg-indigo-600', hex: '#4f46e5' },
    { id: 'emerald', name: 'Eco Emerald', bg: 'bg-emerald-600', hex: '#059669' },
    { id: 'violet', name: 'Deep Violet', bg: 'bg-violet-600', hex: '#7c3aed' },
    { id: 'rose', name: 'Vibrant Rose', bg: 'bg-rose-600', hex: '#e11d48' },
    { id: 'amber', name: 'Warm Amber', bg: 'bg-amber-600', hex: '#d97706' },
    { id: 'cyan', name: 'Precision Cyan', bg: 'bg-cyan-600', hex: '#0891b2' },
  ];

  const overallStyles: {
    id: OverallUiStyle;
    name: string;
    description: string;
    previewClass: string;
    badge: string;
  }[] = [
    {
      id: 'clean',
      name: 'Clean Minimalist',
      description: 'Clean slate surfaces, refined 1px borders, and auto-matched stark readable typography',
      previewClass: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
      badge: 'Balanced Productivity',
    },
    {
      id: 'brutalist',
      name: 'Brutalist Overall',
      description: 'Stark 2.5px solid borders, hard drop shadows, punchy contrast, and bold industrial typography',
      previewClass: 'bg-white dark:bg-slate-950 border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]',
      badge: 'High Contrast Bold',
    },
    {
      id: 'neumorphism',
      name: 'Neumorphism (Soft UI)',
      description: 'Dual-light soft extruded shadows, debossed controls, and auto-matched charcoal font colors',
      previewClass: 'bg-slate-200 dark:bg-slate-900 shadow-[5px_5px_10px_#cbd5e1,-5px_-5px_10px_#ffffff] dark:shadow-[5px_5px_10px_#050810,-5px_-5px_10px_#18233c] border-none',
      badge: 'Tactile Embossed',
    },
    {
      id: 'blueprint',
      name: 'Technical Blueprint',
      description: 'Precision CAD coordinate grid, glowing cyan accents, and auto-matched monospace technical fonts',
      previewClass: 'bg-[#071322] border border-sky-500 shadow-[0_0_12px_rgba(2,132,199,0.3)] text-sky-400 font-mono',
      badge: 'Engineering CAD',
    },
    {
      id: 'glassmorphism',
      name: 'Frosted Glassmorphism',
      description: 'Translucent glass surfaces with 16px backdrop blur, light reflections, and luminous shadows',
      previewClass: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/40 dark:border-slate-700/50',
      badge: 'Luminous Depth',
    },
    {
      id: 'midnight',
      name: 'Midnight Cyber Dark',
      description: 'Deep OLED cosmic black surfaces with ambient neon glows for low-light factory control rooms',
      previewClass: 'bg-black border border-slate-800 text-slate-100 shadow-[0_0_15px_rgba(0,0,0,0.8)]',
      badge: 'Low-Light OLED',
    },
  ];

  const uiSizes: {
    id: OverallUiSize;
    name: string;
    scale: string;
    description: string;
  }[] = [
    {
      id: 'compact',
      name: 'Compact Density',
      scale: '90%',
      description: 'Maximum data rows on screen. Best for dense tables & multi-line sewing dashboards',
    },
    {
      id: 'standard',
      name: 'Standard Balanced',
      scale: '100%',
      description: 'Default calibrated ergonomics. Optimal for standard desktop displays & laptops',
    },
    {
      id: 'roomy',
      name: 'Roomy Touch',
      scale: '110%',
      description: 'Generous tap targets. Engineered for warehouse tablets & touch terminal kiosks',
    },
    {
      id: 'large',
      name: 'High-Legibility',
      scale: '120%',
      description: 'Extra-large font scaling. Ideal for factory floor overhead monitoring TVs',
    },
  ];

  const sidebarStyles: {
    id: SidebarStyle;
    name: string;
    badge: string;
    preview: string;
  }[] = [
    {
      id: 'clean_light',
      name: 'Clean Minimalist Light',
      badge: 'Light Theme',
      preview: 'bg-white border-r border-slate-200 text-slate-800',
    },
    {
      id: 'dark_slate',
      name: 'Dark Slate Navy',
      badge: 'High Contrast',
      preview: 'bg-slate-900 border-r border-slate-800 text-slate-100',
    },
    {
      id: 'frosted_glass',
      name: 'Frosted Glassmorphic',
      badge: 'Translucent',
      preview: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-white/40 text-slate-800 dark:text-slate-100',
    },
    {
      id: 'vibrant_accent',
      name: 'Vibrant Accent Gradient',
      badge: 'Brand Gradient',
      preview: 'bg-gradient-to-b from-blue-950 via-slate-900 to-indigo-950 text-white border-r border-blue-900',
    },
    {
      id: 'deep_indigo',
      name: 'Deep Enterprise Indigo',
      badge: 'Executive',
      preview: 'bg-indigo-950 text-indigo-100 border-r border-indigo-900',
    },
  ];

  const topbarStyles: {
    id: TopbarStyle;
    name: string;
    description: string;
  }[] = [
    {
      id: 'clean_white',
      name: 'Clean Sticky Header',
      description: 'Classic crisp topbar with subtle border matching content area',
    },
    {
      id: 'glassmorphic',
      name: 'Modern Glassmorphic',
      description: 'Frosted glass translucent blur allowing content to scroll underneath smoothly',
    },
    {
      id: 'dark_contrast',
      name: 'High Contrast Dark',
      description: 'Sleek dark slate topbar with luminous search and control buttons',
    },
    {
      id: 'accent_tint',
      name: 'Brand Accent Tinted',
      description: 'Softly tinted background matched with the selected primary accent color',
    },
  ];

  const cardStyles: {
    id: CardStyle;
    name: string;
    description: string;
    preview: string;
  }[] = [
    {
      id: 'bordered',
      name: 'Modern Bordered',
      description: 'Standard 1px subtle borders, clean and distraction-free',
      preview: 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    },
    {
      id: 'elevated',
      name: 'Soft Elevated Shadow',
      description: 'Multi-layer ambient shadow with depth and lift on hover',
      preview: 'border border-slate-200/60 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900',
    },
    {
      id: 'glassmorphic',
      name: 'Frosted Glass Blur',
      description: 'Translucent background with backdrop blur and soft rim light',
      preview: 'border border-white/50 dark:border-slate-700/50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70',
    },
    {
      id: 'flat',
      name: 'Flat Clean Surfaces',
      description: 'Border-free flat solid background tiles for clean scannability',
      preview: 'border-0 bg-slate-100 dark:bg-slate-800',
    },
    {
      id: 'crisp_pop',
      name: 'Neo-Brutalist Crisp',
      description: 'Solid 2px border with high-contrast tactile shadow pop',
      preview: 'border-2 border-slate-900 dark:border-slate-100 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] bg-white dark:bg-slate-900',
    },
  ];

  const buttonStyles: {
    id: ButtonStyle;
    name: string;
    previewStyle: string;
    description: string;
  }[] = [
    {
      id: 'rounded',
      name: 'Standard Rounded (12px)',
      previewStyle: 'rounded-xl',
      description: 'Modern rounded corners matching system controls',
    },
    {
      id: 'pill',
      name: 'Soft Pill Capsule',
      previewStyle: 'rounded-full',
      description: 'Full curved pill shape for modern touch-first feel',
    },
    {
      id: 'sharp',
      name: 'Sharp Industrial (4px)',
      previewStyle: 'rounded-xs',
      description: 'Crisp technical corners for high-density industrial applications',
    },
    {
      id: 'elevated_3d',
      name: 'Tactile 3D Bevel',
      previewStyle: 'rounded-xl border-b-4 border-black/30 active:border-b-0 active:translate-y-1',
      description: 'Physical tactile button feel with bottom shadow press effect',
    },
    {
      id: 'radiant_glow',
      name: 'Radiant Accent Glow',
      previewStyle: 'rounded-xl shadow-lg shadow-blue-500/40',
      description: 'Luminous ambient colored aura around primary action buttons',
    },
  ];

  const fontOptions: { id: FontFamily; name: string; sample: string }[] = [
    { id: 'inter', name: 'Inter (Default)', sample: 'Clean modern neo-grotesque sans-serif' },
    { id: 'roboto', name: 'Roboto', sample: 'Geometric friendly corporate typeface' },
    { id: 'outfit', name: 'Outfit', sample: 'Premium modern display rounded styling' },
    { id: 'mono', name: 'JetBrains Mono', sample: 'Technical monospace for factory coding & lot tracking' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-blue-200/60 dark:border-blue-900/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Global ERP Appearance &amp; UI Engine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                Live Reactive
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personalize themes, Overall UI Style, UI Scaling, Sidebar, Topbar, Card Style, Button Style, and Accent colors. All changes apply globally in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Applied to Full ERP ({lastAction})</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              resetAppearance();
              setLastAction('Reset Defaults');
              setSavedNotice(true);
              setTimeout(() => setSavedNotice(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
            title="Reset to default settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* 1. Theme Mode Selection (Light / Dark / System) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              System Color Theme Mode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Switch between Light, Dark, or System Synchronized presentation across all factory screens.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => triggerChange({ theme: 'light' }, 'Light Mode')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              appearance.theme === 'light'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Light Mode</span>
                <span className="text-[11px] text-slate-500">Daytime standard contrast</span>
              </div>
            </div>
            {appearance.theme === 'light' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => triggerChange({ theme: 'dark' }, 'Dark Mode')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              appearance.theme === 'dark'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Dark Mode</span>
                <span className="text-[11px] text-slate-500">Night shift eye-protection</span>
              </div>
            </div>
            {appearance.theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => triggerChange({ theme: 'system' }, 'System Match')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              appearance.theme === 'system'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">System Auto</span>
                <span className="text-[11px] text-slate-500">Match operating system</span>
              </div>
            </div>
            {appearance.theme === 'system' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
          </button>
        </div>
      </div>

      {/* 2. Overall UI Style (Requested Feature) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Overall UI Style &amp; Visual Framework
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Transforms the global container, card background filters, and border aesthetics of the entire software.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {overallStyles.map((st) => {
            const isSelected = appearance.overallStyle === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => triggerChange({ overallStyle: st.id }, st.name)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/40 dark:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                      {st.name}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {st.description}
                  </p>
                </div>

                <div className={`p-2.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-between ${st.previewClass}`}>
                  <span>{st.badge}</span>
                  <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60">
                    {st.id}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Overall UI Size (Requested Feature) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Overall UI Size &amp; Density Scaling
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instantly scales root typography and interface elements to fit tablets, laptops, or large factory monitors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {uiSizes.map((sz) => {
            const isSelected = appearance.overallSize === sz.id;
            return (
              <button
                key={sz.id}
                type="button"
                onClick={() => triggerChange({ overallSize: sz.id }, sz.name)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{sz.name}</span>
                    <span className="font-mono text-xs font-black text-blue-600">{sz.scale}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {sz.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Scale Root</span>
                  {isSelected ? (
                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Select</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sidebar Style & Topbar Style (Requested Features) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sidebar Style Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-600" />
              Sidebar Visual Style
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Changes the physical sidebar container color, border, and navigation items.
            </p>
          </div>

          <div className="space-y-2.5">
            {sidebarStyles.map((sb) => {
              const isSelected = appearance.sidebarStyle === sb.id;
              return (
                <button
                  key={sb.id}
                  type="button"
                  onClick={() => triggerChange({ sidebarStyle: sb.id }, sb.name)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${sb.preview}`}>
                      <span className="text-[10px] font-bold">Q</span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                        {sb.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{sb.badge}</span>
                    </div>
                  </div>

                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topbar Style Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Square className="w-4 h-4 text-teal-600" />
              Topbar Header Style
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Alters the sticky header bar containing global search, notifications, and user profiles.
            </p>
          </div>

          <div className="space-y-2.5">
            {topbarStyles.map((tb) => {
              const isSelected = appearance.topbarStyle === tb.id;
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => triggerChange({ topbarStyle: tb.id }, tb.name)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {tb.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      {tb.description}
                    </span>
                  </div>

                  {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Card Style & Button Style (Requested Features) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Style */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Card Elevation &amp; Border Style
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Applies to all metric cards, data tables, and modal windows throughout the ERP.
            </p>
          </div>

          <div className="space-y-2.5">
            {cardStyles.map((cd) => {
              const isSelected = appearance.cardStyle === cd.id;
              return (
                <button
                  key={cd.id}
                  type="button"
                  onClick={() => triggerChange({ cardStyle: cd.id }, cd.name)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {cd.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      {cd.description}
                    </span>
                  </div>

                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Button Style */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-rose-600" />
              Button Geometry &amp; Press Feedback
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Defines the corner curvature, tactile 3D bevels, or radiant glows on actionable buttons.
            </p>
          </div>

          <div className="space-y-2.5">
            {buttonStyles.map((bt) => {
              const isSelected = appearance.buttonStyle === bt.id;
              return (
                <button
                  key={bt.id}
                  type="button"
                  onClick={() => triggerChange({ buttonStyle: bt.id }, bt.name)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`px-3 py-1 bg-blue-600 text-white text-[10px] font-bold shrink-0 ${bt.previewStyle}`}
                    >
                      Action
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                        {bt.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {bt.description}
                      </span>
                    </div>
                  </div>

                  {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Accent Color & Typography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary Accent Color */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Primary Accent Color Palette
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tint applied to primary action buttons, active navigation states, badges, and progress meters.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {accents.map((acc) => {
              const isSelected = appearance.accentColor === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => triggerChange({ accentColor: acc.id }, acc.name)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    isSelected
                      ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/20 shadow-md bg-slate-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${acc.bg} flex items-center justify-center text-white shadow-xs`}>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-center">
                    {acc.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Family Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-600" />
              Application Typography Family
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Engineered for readability in apparel manufacturing specifications, tech packs, and barcode scans.
            </p>
          </div>

          <div className="space-y-2">
            {fontOptions.map((fn) => {
              const isSelected = appearance.fontFamily === fn.id;
              return (
                <button
                  key={fn.id}
                  type="button"
                  onClick={() => triggerChange({ fontFamily: fn.id }, fn.name)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {fn.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {fn.sample}
                    </span>
                  </div>

                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. Live Interactive Preview Component Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Real-Time Interactive ERP Component Preview
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Instant Visual Feedback</span>
        </div>

        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                Active Component Configuration
              </span>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Garments QMS Ultra • Style #HM-DENIM-992
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Ring Spun Cotton Denim • 4-Point ASTM D5430 Inspection Grade A
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                AQL 1.5 Accepted
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                Line 04 Running
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>Production Progress</span>
              <span>8,450 / 10,000 Pcs (84.5%)</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500 w-[84.5%]"></div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md shadow-blue-600/20"
            >
              Primary Action Button
            </button>
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
            >
              Secondary Outline
            </button>
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 cursor-pointer border border-rose-200"
            >
              Quality Hold Trigger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
