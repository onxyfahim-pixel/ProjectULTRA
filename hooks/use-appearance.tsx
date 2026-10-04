'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type OverallUiStyle =
  | 'clean'
  | 'brutalist'
  | 'neumorphism'
  | 'blueprint'
  | 'glassmorphism'
  | 'midnight';

export type OverallUiSize = 'compact' | 'standard' | 'roomy' | 'large';
export type SidebarStyle = 'dark_slate' | 'clean_light' | 'frosted_glass' | 'vibrant_accent' | 'deep_indigo';
export type TopbarStyle = 'clean_white' | 'glassmorphic' | 'dark_contrast' | 'accent_tint';
export type CardStyle = 'bordered' | 'elevated' | 'glassmorphic' | 'flat' | 'crisp_pop';
export type ButtonStyle = 'rounded' | 'pill' | 'sharp' | 'elevated_3d' | 'radiant_glow';
export type AccentColor = 'blue' | 'indigo' | 'emerald' | 'violet' | 'rose' | 'amber' | 'cyan';
export type FontFamily = 'inter' | 'roboto' | 'outfit' | 'mono';

export interface AppearanceSettings {
  theme: ThemeMode;
  overallStyle: OverallUiStyle;
  overallSize: OverallUiSize;
  sidebarStyle: SidebarStyle;
  topbarStyle: TopbarStyle;
  cardStyle: CardStyle;
  buttonStyle: ButtonStyle;
  accentColor: AccentColor;
  fontFamily: FontFamily;
  enableAnimations: boolean;
  highContrast: boolean;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: 'light',
  overallStyle: 'clean',
  overallSize: 'standard',
  sidebarStyle: 'clean_light',
  topbarStyle: 'clean_white',
  cardStyle: 'bordered',
  buttonStyle: 'rounded',
  accentColor: 'blue',
  fontFamily: 'inter',
  enableAnimations: true,
  highContrast: false,
};

interface AppearanceContextType {
  appearance: AppearanceSettings;
  updateAppearance: (updates: Partial<AppearanceSettings>) => void;
  resetAppearance: () => void;
  isDark: boolean;
  sidebarClasses: string;
  topbarClasses: string;
  cardClasses: string;
  buttonClasses: string;
  primaryButtonClasses: string;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const STORAGE_KEY = 'garments_qms_ultra_appearance_v4';

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearance] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Load saved appearance on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...DEFAULT_APPEARANCE, ...parsed };
        setAppearance(merged);
        applyGlobalStyles(merged);
      } else {
        applyGlobalStyles(DEFAULT_APPEARANCE);
      }
    } catch {
      applyGlobalStyles(DEFAULT_APPEARANCE);
    }
    setMounted(true);
  }, []);

  const applyGlobalStyles = (cfg: AppearanceSettings) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    // 1. Theme (Dark / Light / System)
    let darkModeActive = cfg.theme === 'dark';
    if (cfg.theme === 'system') {
      darkModeActive = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDark(darkModeActive);

    if (darkModeActive) {
      root.classList.add('dark');
      root.dataset.theme = 'dark';
    } else {
      root.classList.remove('dark');
      root.dataset.theme = 'light';
    }

    // 2. Data Attributes on root for global CSS selector hook
    root.dataset.uiStyle = cfg.overallStyle;
    root.dataset.uiSize = cfg.overallSize;
    root.dataset.sidebarStyle = cfg.sidebarStyle;
    root.dataset.topbarStyle = cfg.topbarStyle;
    root.dataset.cardStyle = cfg.cardStyle;
    root.dataset.buttonStyle = cfg.buttonStyle;
    root.dataset.accent = cfg.accentColor;
    root.dataset.font = cfg.fontFamily;

    // 3. UI Size / Font Scaling
    if (cfg.overallSize === 'compact') {
      root.style.fontSize = '14.5px';
      root.style.setProperty('--erp-scale-ratio', '0.92');
    } else if (cfg.overallSize === 'roomy') {
      root.style.fontSize = '17px';
      root.style.setProperty('--erp-scale-ratio', '1.08');
    } else if (cfg.overallSize === 'large') {
      root.style.fontSize = '18.5px';
      root.style.setProperty('--erp-scale-ratio', '1.16');
    } else {
      // standard
      root.style.fontSize = '16px';
      root.style.setProperty('--erp-scale-ratio', '1.0');
    }

    // 4. Auto-Match Font Family based on Overall Style or User Selection
    if (cfg.overallStyle === 'blueprint') {
      body.style.fontFamily = "'JetBrains Mono', 'Courier New', monospace";
    } else if (cfg.fontFamily === 'roboto') {
      body.style.fontFamily = "'Roboto', system-ui, -apple-system, sans-serif";
    } else if (cfg.fontFamily === 'outfit') {
      body.style.fontFamily = "'Outfit', system-ui, -apple-system, sans-serif";
    } else if (cfg.fontFamily === 'mono') {
      body.style.fontFamily = "'JetBrains Mono', 'Courier New', monospace";
    } else {
      body.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
    }

    // 5. Accent Color Hex mappings
    const accentColorsHex: Record<AccentColor, { primary: string; hover: string; light: string; ring: string }> = {
      blue: { primary: '#2563eb', hover: '#1d4ed8', light: '#eff6ff', ring: 'rgba(37, 99, 235, 0.3)' },
      indigo: { primary: '#4f46e5', hover: '#4338ca', light: '#eef2ff', ring: 'rgba(79, 70, 229, 0.3)' },
      emerald: { primary: '#059669', hover: '#047857', light: '#ecfdf5', ring: 'rgba(5, 150, 105, 0.3)' },
      violet: { primary: '#7c3aed', hover: '#6d28d9', light: '#f5f3ff', ring: 'rgba(124, 58, 237, 0.3)' },
      rose: { primary: '#e11d48', hover: '#be123c', light: '#fff1f2', ring: 'rgba(225, 29, 72, 0.3)' },
      amber: { primary: '#d97706', hover: '#b45309', light: '#fffbeb', ring: 'rgba(217, 119, 6, 0.3)' },
      cyan: { primary: '#0891b2', hover: '#0e7490', light: '#ecfeff', ring: 'rgba(8, 145, 178, 0.3)' },
    };

    const cur = accentColorsHex[cfg.accentColor] || accentColorsHex.blue;
    root.style.setProperty('--erp-accent', cur.primary);
    root.style.setProperty('--erp-accent-hover', cur.hover);
    root.style.setProperty('--erp-accent-light', cur.light);
    root.style.setProperty('--erp-accent-ring', cur.ring);
  };

  const updateAppearance = (updates: Partial<AppearanceSettings>) => {
    setAppearance((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      applyGlobalStyles(next);
      return next;
    });
  };

  const resetAppearance = () => {
    setAppearance(DEFAULT_APPEARANCE);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APPEARANCE));
    } catch {
      // ignore
    }
    applyGlobalStyles(DEFAULT_APPEARANCE);
  };

  // Compute reactive sidebar styles
  let sidebarClasses = 'bg-white text-slate-700 border-r border-slate-200/80';
  if (appearance.sidebarStyle === 'dark_slate') {
    sidebarClasses = 'bg-slate-900 text-slate-200 border-r border-slate-800 shadow-xl';
  } else if (appearance.sidebarStyle === 'frosted_glass') {
    sidebarClasses = 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-800 dark:text-slate-200 border-r border-white/30 dark:border-slate-800/60 shadow-lg';
  } else if (appearance.sidebarStyle === 'vibrant_accent') {
    sidebarClasses = 'bg-gradient-to-b from-blue-950 via-slate-900 to-indigo-950 text-white border-r border-blue-900/40 shadow-2xl';
  } else if (appearance.sidebarStyle === 'deep_indigo') {
    sidebarClasses = 'bg-indigo-950 text-indigo-100 border-r border-indigo-900/60 shadow-2xl';
  }

  // Compute reactive topbar styles
  let topbarClasses = 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200/80 dark:border-slate-800';
  if (appearance.topbarStyle === 'glassmorphic') {
    topbarClasses = 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-800 dark:text-slate-100 border-b border-white/40 dark:border-slate-800/60 shadow-sm';
  } else if (appearance.topbarStyle === 'dark_contrast') {
    topbarClasses = 'bg-slate-950 text-white border-b border-slate-800 shadow-md';
  } else if (appearance.topbarStyle === 'accent_tint') {
    topbarClasses = 'bg-blue-50/90 dark:bg-blue-950/70 backdrop-blur-md text-slate-900 dark:text-white border-b border-blue-200/80 dark:border-blue-900/60';
  }

  // Compute reactive card styles
  let cardClasses = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs';
  if (appearance.cardStyle === 'elevated') {
    cardClasses = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/70 hover:shadow-2xl transition-shadow';
  } else if (appearance.cardStyle === 'glassmorphic') {
    cardClasses = 'bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg shadow-black/5';
  } else if (appearance.cardStyle === 'flat') {
    cardClasses = 'bg-slate-100/80 dark:bg-slate-800/70 rounded-2xl border-none shadow-none';
  } else if (appearance.cardStyle === 'crisp_pop') {
    cardClasses = 'bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-900 dark:border-slate-100 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]';
  }

  // Compute reactive button styles
  let buttonClasses = 'rounded-xl transition-all cursor-pointer font-bold';
  let primaryButtonClasses = 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20';

  if (appearance.buttonStyle === 'pill') {
    buttonClasses = 'rounded-full transition-all cursor-pointer font-bold';
  } else if (appearance.buttonStyle === 'sharp') {
    buttonClasses = 'rounded-md transition-all cursor-pointer font-bold';
  } else if (appearance.buttonStyle === 'elevated_3d') {
    buttonClasses = 'rounded-xl transition-all cursor-pointer font-bold border-b-4 border-black/25 active:border-b-0 active:translate-y-1 shadow-md';
  } else if (appearance.buttonStyle === 'radiant_glow') {
    buttonClasses = 'rounded-xl transition-all cursor-pointer font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02]';
  }

  return (
    <AppearanceContext.Provider
      value={{
        appearance,
        updateAppearance,
        resetAppearance,
        isDark,
        sidebarClasses,
        topbarClasses,
        cardClasses,
        buttonClasses,
        primaryButtonClasses,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    return {
      appearance: DEFAULT_APPEARANCE,
      updateAppearance: () => {},
      resetAppearance: () => {},
      isDark: false,
      sidebarClasses: 'bg-white text-slate-700 border-r border-slate-200/80',
      topbarClasses: 'bg-white text-slate-800 border-b border-slate-200/80',
      cardClasses: 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs',
      buttonClasses: 'rounded-xl transition-all cursor-pointer font-bold',
      primaryButtonClasses: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20',
    };
  }
  return context;
}
