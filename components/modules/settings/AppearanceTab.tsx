'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Sun, Moon, Monitor, LayoutGrid, Check, Sparkles, Sliders, Type } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'indigo' | 'emerald' | 'violet' | 'rose' | 'amber';
export type Density = 'comfortable' | 'compact';
export type FontSize = 'normal' | 'medium' | 'large';

export interface AppearanceConfig {
  theme: ThemeMode;
  accent: AccentColor;
  density: Density;
  fontSize: FontSize;
  enableAnimations: boolean;
  enableGlassmorphism: boolean;
}

const DEFAULT_APPEARANCE: AppearanceConfig = {
  theme: 'light',
  accent: 'blue',
  density: 'comfortable',
  fontSize: 'normal',
  enableAnimations: true,
  enableGlassmorphism: true,
};

export function AppearanceTab() {
  const [config, setConfig] = useState<AppearanceConfig>(DEFAULT_APPEARANCE);
  const [savedNotice, setSavedNotice] = useState(false);

  // Load saved appearance on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('garments_erp_appearance');
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig((prev) => ({ ...prev, ...parsed }));
        applyThemeToDocument(parsed.theme, parsed.accent, parsed.fontSize);
      }
    } catch {
      // Fallback
    }
  }, []);

  const applyThemeToDocument = (theme: ThemeMode, accent: AccentColor, fontSize: FontSize) => {
    const root = document.documentElement;

    // 1. Dark Mode
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }

    // 2. Font Size
    if (fontSize === 'medium') {
      root.style.fontSize = '17px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }

    // 3. Accent Color dataset
    root.dataset.accent = accent;
  };

  const handleUpdate = (updates: Partial<AppearanceConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    localStorage.setItem('garments_erp_appearance', JSON.stringify(next));
    applyThemeToDocument(next.theme, next.accent, next.fontSize);

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const accents: { id: AccentColor; name: string; bg: string; ring: string }[] = [
    { id: 'blue', name: 'Electric Blue', bg: 'bg-blue-600', ring: 'ring-blue-500' },
    { id: 'indigo', name: 'Royal Indigo', bg: 'bg-indigo-600', ring: 'ring-indigo-500' },
    { id: 'emerald', name: 'Eco Emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-500' },
    { id: 'violet', name: 'Deep Violet', bg: 'bg-violet-600', ring: 'ring-violet-500' },
    { id: 'rose', name: 'Vibrant Rose', bg: 'bg-rose-600', ring: 'ring-rose-500' },
    { id: 'amber', name: 'Warm Amber', bg: 'bg-amber-600', ring: 'ring-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-200/50 dark:border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appearance & UI Customization</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize theme modes, plant monitor densities, and factory floor terminal styling in real time.
            </p>
          </div>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Applied in Real Time
          </div>
        )}
      </div>

      {/* 1. Theme Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
          <Sun className="w-4 h-4 text-amber-500" />
          Theme Mode
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Select dark mode for high-contrast inspection booths or light mode for administrative offices.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Light Mode */}
          <button
            type="button"
            onClick={() => handleUpdate({ theme: 'light' })}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
              config.theme === 'light'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">Light Clean</span>
                <span className="text-xs text-slate-500">Daytime Office Mode</span>
              </div>
            </div>
            {config.theme === 'light' && <Check className="w-5 h-5 text-blue-600" />}
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => handleUpdate({ theme: 'dark' })}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
              config.theme === 'dark'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-800 text-slate-200">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">Dark High-Contrast</span>
                <span className="text-xs text-slate-500">Inspection & Night Shift</span>
              </div>
            </div>
            {config.theme === 'dark' && <Check className="w-5 h-5 text-blue-600" />}
          </button>

          {/* System Default */}
          <button
            type="button"
            onClick={() => handleUpdate({ theme: 'system' })}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
              config.theme === 'system'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">Auto System</span>
                <span className="text-xs text-slate-500">Sync with OS Mode</span>
              </div>
            </div>
            {config.theme === 'system' && <Check className="w-5 h-5 text-blue-600" />}
          </button>
        </div>
      </div>

      {/* 2. Brand Accent Colors */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Brand Accent Color
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Select primary highlight color applied to action buttons, focus borders, and telemetry badges.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {accents.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleUpdate({ accent: item.id })}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                config.accent === item.id
                  ? 'border-slate-900 dark:border-white ring-2 ring-blue-500/40 bg-slate-50 dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full ${item.bg} flex items-center justify-center text-white shadow-xs`}>
                {config.accent === item.id && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Display Density & Font Scaling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Density */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <LayoutGrid className="w-4 h-4 text-emerald-500" />
            Table & List Density
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Compact mode allows viewing 40% more fabric rolls and inspection lots per screen.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleUpdate({ density: 'comfortable' })}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.density === 'comfortable'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Comfortable</span>
              <span className="text-[11px] text-slate-500">Spacious padding for touch tablets</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdate({ density: 'compact' })}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.density === 'compact'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Compact</span>
              <span className="text-[11px] text-slate-500">Dense tables for high-volume QC</span>
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Type className="w-4 h-4 text-purple-500" />
            Font Scaling
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Scale text size for better readability on distant production floor displays.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleUpdate({ fontSize: 'normal' })}
              className={`p-3 rounded-xl border text-center transition-all ${
                config.fontSize === 'normal'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Standard</span>
              <span className="text-[10px] text-slate-500">100% (16px)</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdate({ fontSize: 'medium' })}
              className={`p-3 rounded-xl border text-center transition-all ${
                config.fontSize === 'medium'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Medium</span>
              <span className="text-[10px] text-slate-500">106% (17px)</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdate({ fontSize: 'large' })}
              className={`p-3 rounded-xl border text-center transition-all ${
                config.fontSize === 'large'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Large</span>
              <span className="text-[10px] text-slate-500">115% (18px)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
