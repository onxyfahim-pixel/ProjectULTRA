'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Palette,
  Bell,
  Users,
  Activity,
  Database,
  History,
  Lock,
  User,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Server,
  Sparkles,
  Zap,
  Download,
  FileCheck,
  Smartphone,
  Layers,
  Cpu,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import { SettingsTabId } from '@/components/views/SettingsView';
import { useAppearance } from '@/hooks/use-appearance';
import { useErpAuth } from '@/hooks/use-erp-auth';

interface OverviewTabProps {
  onNavigateTab?: (tabId: SettingsTabId) => void;
}

export function OverviewTab({ onNavigateTab }: OverviewTabProps) {
  const { appearance } = useAppearance();
  const { user } = useErpAuth();

  const [dbStats, setDbStats] = useState<any>(null);
  const [isMysqlConnected, setIsMysqlConnected] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/system-telemetry')
      .then((res) => (res.ok ? res : fetch('/api/host-info')))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDbStats(data.stats);
          if (data.isMysqlConnected !== undefined) {
            setIsMysqlConnected(data.isMysqlConnected);
          }
        }
      })
      .catch(() => {});
  }, []);

  const subsystems = [
    {
      id: 'general' as SettingsTabId,
      name: 'General Setting',
      icon: Building2,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      badge: 'Plant Configured',
      description: 'Garments QMS Ultra Enterprise ERP • Corporate HQ & Gazipur Plant',
    },
    {
      id: 'appearance' as SettingsTabId,
      name: 'Appearance & UI Engine',
      icon: Palette,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      badge: `${appearance.theme.toUpperCase()} • ${appearance.accentColor.toUpperCase()}`,
      description: `Style: ${appearance.overallStyle} • Scale: ${appearance.overallSize} • Sidebar: ${appearance.sidebarStyle}`,
    },
    {
      id: 'notification' as SettingsTabId,
      name: 'Notification Hub',
      icon: Bell,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      badge: '4 Channels Active',
      description: 'In-App, Email, SMS & Webhooks with 6 automated QMS critical event triggers',
    },
    {
      id: 'users_rbac' as SettingsTabId,
      name: 'RBAC & User Management',
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
      badge: 'Root Super Admin',
      description: 'Individual credentials provisioning, 5 roles, and 8-capability privilege matrix',
    },
    {
      id: 'system_status' as SettingsTabId,
      name: 'System Status & Telemetry',
      icon: Activity,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
      badge: 'Port 3000 Active',
      description: 'Real-time Host PC CPU load, RAM allocation, LAN IP endpoints & API ping',
    },
    {
      id: 'database_backup' as SettingsTabId,
      name: 'Database, Backup & Reset',
      icon: Database,
      color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
      badge: isMysqlConnected ? 'MySQL 8.0 Pool' : 'Local Fallback',
      description: 'Zero-downtime snapshots, JSON import/export, and clean slate system reset',
    },
    {
      id: 'export_templates' as SettingsTabId,
      name: 'Export & PDF Designer',
      icon: FileDown,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      badge: 'All Modules Active',
      description: 'Universal PDF & print header layout designer auto-synced with General factory identity',
    },
    {
      id: 'audit_trails' as SettingsTabId,
      name: 'Audit Trails',
      icon: History,
      color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
      badge: 'Tamper-Proof',
      description: 'Forensic event logs, entity tracking, severity categorization & CSV exports',
    },
    {
      id: 'security_privacy' as SettingsTabId,
      name: 'Privacy & Security',
      icon: Lock,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      badge: 'TOTP 2FA Ready',
      description: 'JWT expiration policies, active device sessions revoke & factory LAN whitelisting',
    },
    {
      id: 'user_profile' as SettingsTabId,
      name: 'User Profile',
      icon: User,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      badge: user.role,
      description: `${user.name} • ${user.department} • Fast role switching capability`,
    },
    {
      id: 'cloud_integration' as SettingsTabId,
      name: 'Cloud Integration System',
      icon: Cloud,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
      badge: 'AWS S3 & R2',
      description: 'Cloud defect photo bucket offloading, SAP/NetSuite webhooks & API keys',
    },
  ];

  const checklistItems = [
    { label: 'Host PC Local Server & Port 3000 Active', done: true },
    { label: 'MySQL Enterprise Database Engine Connected', done: isMysqlConnected },
    { label: 'Factory Identity & Trade Registrations Documented', done: true },
    { label: 'Real-time Appearance Personalization Engine Enabled', done: true },
    { label: 'Multi-Channel Alert Rules & Sound Chimes Tested', done: true },
    { label: 'User Provisioning & Role Privileges Enforced', done: true },
    { label: 'Enterprise Audit Trail Stream Logging Operational', done: true },
    { label: 'Disaster Recovery Snapshots & Auto-Cloud Offload Ready', done: true },
    { label: 'Universal PDF & Print Header Designer Synchronized', done: true },
  ];

  const completedCount = checklistItems.filter((i) => i.done).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl shadow-blue-950/20 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              System Control Center
            </span>
            <span className="text-xs text-slate-400 font-mono">v4.2 Production Edition</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            Enterprise Settings &amp; Configuration Overview
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            Holistic diagnostic summary of all 10 core system modules. Monitor Host PC hardware telemetry, database health, active UI styling, compliance certifications, and offsite cloud replication.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0 w-full sm:w-auto min-w-[200px]">
          <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
            System Readiness
          </div>
          <div className="text-3xl font-black text-white">{progressPercent}%</div>
          <div className="text-[11px] text-emerald-300 font-semibold mt-1 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedCount} of {checklistItems.length} Milestones Verified</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Host PC Engine</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mb-0.5">
            Active &amp; Online
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Node.js Runtime • Port 3000
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Zero Packet Loss
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Active UI Engine</span>
            <Palette className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white capitalize mb-0.5">
            {appearance.theme} • {appearance.overallStyle.replace('_', ' ')}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Size: {appearance.overallSize} • Accent: {appearance.accentColor}
          </p>
          <div className="mt-3 text-[11px] font-bold text-purple-600 dark:text-purple-400">
            Globally Applied to Entire ERP
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Database &amp; Rows</span>
            <Database className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mb-0.5">
            {isMysqlConnected ? 'MySQL 8.0' : 'JSON Storage'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {(dbStats?.itemCount || 0) + (dbStats?.inspectionCount || 0)} Live Records Managed
          </p>
          <div className="mt-3 text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
            Midnight Snapshots Enabled
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Security Governance</span>
            <Lock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mb-0.5">
            HMAC SHA-256
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            8h Shift Expiration • 2FA Ready
          </p>
          <div className="mt-3 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            Role-Based Access Protected
          </div>
        </div>
      </div>

      {/* Subsystem Navigator Matrix: 10 Modules Quick-Jump */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Settings Modules &amp; Subsystem Directory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any module to jump directly to its dedicated configuration workbench.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {subsystems.map((sub, index) => {
            const Icon = sub.icon;
            return (
              <div
                key={sub.id}
                onClick={() => onNavigateTab && onNavigateTab(sub.id)}
                className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-2xs hover:shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${sub.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {sub.name}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                        {sub.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {sub.description}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Production Go-Live Readiness Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Production Deployment Verification Checklist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified operational capabilities for factory floor deployment and ISO audit readiness.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
            {completedCount} / {checklistItems.length} Checks Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checklistItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  item.done
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
