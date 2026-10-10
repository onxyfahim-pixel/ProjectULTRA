'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  RotateCcw,
  Compass,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Users,
  Eye,
  Check,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { Role } from '@/lib/types/erp';
import { CommercialInquiryModal } from './CommercialInquiryModal';
import { DemoTourModal } from './DemoTourModal';

interface DemoSalesBarProps {
  onNavigateTab: (tab: any) => void;
  onResetData?: () => void;
}

const DEMO_PERSONAS: Array<{
  role: Role;
  label: string;
  shortLabel: string;
  badge: string;
  desc: string;
}> = [
  {
    role: 'Super Admin',
    label: 'Super Admin',
    shortLabel: 'Admin',
    badge: 'Full Plant Control',
    desc: 'Unrestricted plant-wide access & system configuration',
  },
  {
    role: 'QC Manager',
    label: 'QC Manager',
    shortLabel: 'QC Head',
    badge: 'Quality & Lab',
    desc: 'Manage all inspections, lab tests, CAPA & defect approval',
  },
  {
    role: 'Inspector',
    label: 'Inspector',
    shortLabel: 'Floor QC',
    badge: 'Floor Inspections',
    desc: 'Perform inline & final AQL audits, 4-point fabric scans',
  },
  {
    role: 'Viewer',
    label: 'Viewer',
    shortLabel: 'Auditor',
    badge: 'Read-Only',
    desc: 'Executive analytics, buyer audits & reporting view',
  },
];

export function DemoSalesBar({ onNavigateTab, onResetData }: DemoSalesBarProps) {
  const { user, switchRole } = useErpAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleRoleSelect = async (role: Role) => {
    try {
      await switchRole(role);
    } catch (err) {
      console.warn('Failed switching role in demo:', err);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Restore factory sample data? This clears demo modifications and resets to fresh records.')) {
      return;
    }

    setIsResetting(true);
    try {
      // 1. Call database reset endpoint
      await fetch('/api/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'defaults' }),
      });

      // 2. Clear demo modification flags in localStorage
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'erp_buyer_orders_v1',
          'erp_production_records',
          'erp_inspections_v1',
          'erp_module_data_overrides',
        ];
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }

      if (onResetData) {
        onResetData();
      }

      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* Collapsed Pill Button */}
      {isCollapsed && (
        <div className="fixed top-2 right-4 z-40 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white border border-blue-500/40 shadow-xl backdrop-blur-md text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-blue-400">Demo Bar</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      )}

      {/* Main Demo Sales Bar */}
      {!isCollapsed && (
        <div className="relative z-30 w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-blue-500/20 shadow-md">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
            {/* Left: Demo Indicator & Badge */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE DEMO</span>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="text-white font-bold">Project ULTRA</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Garments QMS & Factory ERP</span>
              </div>
            </div>

            {/* Center: Live Role Persona Quick-Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
              <span className="hidden xl:inline text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Role:
              </span>
              {DEMO_PERSONAS.map((persona) => {
                const isActive = user?.role === persona.role;
                return (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => handleRoleSelect(persona.role)}
                    title={`${persona.label} — ${persona.desc}`}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                    <span className="hidden sm:inline">{persona.label}</span>
                    <span className="sm:hidden">{persona.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Actions (Tour, Reset, Buy License) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Guided Tour Button */}
              <button
                type="button"
                onClick={() => setIsTourOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Workflow Tour</span>
                <span className="sm:hidden">Tour</span>
              </button>

              {/* Reset Demo Data Button */}
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                title="Reset test modifications back to pristine demo data"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${isResetting ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{resetSuccess ? 'Reset Complete!' : 'Reset Data'}</span>
              </button>

              {/* Request License / Buy CTA Button */}
              <button
                type="button"
                onClick={() => setIsInquiryOpen(true)}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Buy / License</span>
              </button>

              {/* Minimize Bar Button */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Minimize demo bar"
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-0.5"
                aria-label="Collapse demo bar"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CommercialInquiryModal isOpen={isInquiryOpen} onClose={() => setIsInquiryOpen(false)} />

      <DemoTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={onNavigateTab}
      />
    </>
  );
}
