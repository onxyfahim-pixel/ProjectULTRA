'use client';

import React, { useState } from 'react';
import {
  Settings,
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
  Sparkles,
  ChevronRight,
  FileDown,
} from 'lucide-react';

// 12 Settings Sub-Modules including Overview and Export Templates
import { OverviewTab } from '@/components/modules/settings/OverviewTab';
import { GeneralTab } from '@/components/modules/settings/GeneralTab';
import { AppearanceTab } from '@/components/modules/settings/AppearanceTab';
import { NotificationTab } from '@/components/modules/settings/NotificationTab';
import { UsersRbacTab } from '@/components/modules/settings/UsersRbacTab';
import { SystemHealthTab } from '@/components/modules/settings/SystemHealthTab';
import { DatabaseBackupTab } from '@/components/modules/settings/DatabaseBackupTab';
import { ExportTemplatesTab } from '@/components/modules/settings/ExportTemplatesTab';
import { AuditTrailsTab } from '@/components/modules/settings/AuditTrailsTab';
import { SecurityPrivacyTab } from '@/components/modules/settings/SecurityPrivacyTab';
import { UserProfileTab } from '@/components/modules/settings/UserProfileTab';
import { CloudIntegrationTab } from '@/components/modules/settings/CloudIntegrationTab';

export type SettingsTabId =
  | 'overview'
  | 'general'
  | 'appearance'
  | 'notification'
  | 'users_rbac'
  | 'system_status'
  | 'database_backup'
  | 'export_templates'
  | 'audit_trails'
  | 'security_privacy'
  | 'user_profile'
  | 'cloud_integration';

interface SettingsTabDef {
  id: SettingsTabId;
  sequence: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  description: string;
}

const SETTINGS_TABS: SettingsTabDef[] = [
  {
    id: 'overview',
    sequence: 1,
    label: 'Overview',
    icon: LayoutDashboard,
    tag: 'System Dashboard',
    description: 'Diagnostic summary, configuration milestones & direct subsystem launcher',
  },
  {
    id: 'general',
    sequence: 2,
    label: 'General Setting',
    icon: Building2,
    tag: 'Enterprise Identity',
    description: 'ERP name, brand logo, company profile, factory address, and AQL standards',
  },
  {
    id: 'appearance',
    sequence: 3,
    label: 'Appearance',
    icon: Palette,
    tag: 'Visual System',
    description: 'UI Style, UI Size, Sidebar style, Topbar style, Card & Button styles, Theme & Accents',
  },
  {
    id: 'notification',
    sequence: 4,
    label: 'Notification',
    icon: Bell,
    tag: 'Alert Engine',
    description: 'Multi-channel delivery, QMS event triggers, quiet hours & test alerts',
  },
  {
    id: 'users_rbac',
    sequence: 5,
    label: 'RBAC & User Management',
    icon: Users,
    tag: 'Access Control',
    description: 'User accounts directory, credentials provisioning & full permissions matrix',
  },
  {
    id: 'system_status',
    sequence: 6,
    label: 'System Status',
    icon: Activity,
    tag: 'Host Telemetry',
    description: 'CPU load, RAM utilization, process uptime, MySQL engine & LAN endpoints',
  },
  {
    id: 'database_backup',
    sequence: 7,
    label: 'Database & Backup',
    icon: Database,
    tag: 'Disaster Recovery',
    description: 'Live MySQL status, zero-downtime snapshots, manual download & JSON restore',
  },
  {
    id: 'export_templates',
    sequence: 8,
    label: 'Export & PDF Designer',
    icon: FileDown,
    tag: 'Universal PDF Header',
    description: 'Design official PDF & print header for all ERP modules, auto-synced with General Settings',
  },
  {
    id: 'audit_trails',
    sequence: 9,
    label: 'Audit Trails',
    icon: History,
    tag: 'Compliance Logs',
    description: 'Tamper-proof event logs, filter by category, forensic inspection & CSV export',
  },
  {
    id: 'security_privacy',
    sequence: 10,
    label: 'Privacy & Security',
    icon: Lock,
    tag: 'Protection',
    description: '2FA authentication, password complexity rules, session tokens & IP whitelist',
  },
  {
    id: 'user_profile',
    sequence: 11,
    label: 'User Profile',
    icon: User,
    tag: 'Personal Account',
    description: 'Personal identity, factory facility, photo upload, bio & account security credentials',
  },
  {
    id: 'cloud_integration',
    sequence: 12,
    label: 'Cloud Integration System',
    icon: Cloud,
    tag: 'External Sync',
    description: 'AWS S3 / Cloudflare R2 storage, SAP / NetSuite webhooks & API keys',
  },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('settings_active_tab') as SettingsTabId;
      if (saved && SETTINGS_TABS.some((t) => t.id === saved)) return saved;
    }
    return 'overview';
  });

  React.useEffect(() => {
    const handleSubtabNav = (e: any) => {
      const target = e.detail as SettingsTabId;
      if (target && SETTINGS_TABS.some((t) => t.id === target)) {
        setActiveTab(target);
      }
    };
    window.addEventListener('navigate-settings-subtab', handleSubtabNav as EventListener);
    return () => {
      window.removeEventListener('navigate-settings-subtab', handleSubtabNav as EventListener);
    };
  }, []);

  const handleTabSelect = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('settings_active_tab', tabId);
    }
  };

  const currentTab = SETTINGS_TABS.find((t) => t.id === activeTab) || SETTINGS_TABS[0];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-900 dark:from-white dark:to-slate-200 text-white dark:text-slate-950 shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Enterprise System Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wide">
                Production Control
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Centralized administrative console for factory identity, visual appearance, real-time alerts, RBAC access, hardware telemetry, database backups, audit compliance, security, and cloud sync.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Host PC Engine: Active</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar: Horizontal scrollable with clean modern styling */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`settings-tab-${tab.id}`}
                onClick={() => handleTabSelect(tab.id)}
                className={`group flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md ring-1 ring-slate-900/10 dark:ring-white/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  }`}
                >
                  {tab.sequence}
                </span>

                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-blue-400 dark:text-blue-600' : 'text-slate-400'
                  }`}
                />

                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Context Sub-header */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Tab {currentTab.sequence} of {SETTINGS_TABS.length}: {currentTab.label}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>{currentTab.description}</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hidden sm:inline-block">
          {currentTab.tag}
        </span>
      </div>

      {/* Tab Content Display Area */}
      <div className="transition-all duration-300">
        {activeTab === 'overview' && (
          <OverviewTab onNavigateTab={(tab) => handleTabSelect(tab)} />
        )}
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'notification' && <NotificationTab />}
        {activeTab === 'users_rbac' && <UsersRbacTab />}
        {activeTab === 'system_status' && <SystemHealthTab />}
        {activeTab === 'database_backup' && <DatabaseBackupTab />}
        {activeTab === 'export_templates' && <ExportTemplatesTab />}
        {activeTab === 'audit_trails' && <AuditTrailsTab />}
        {activeTab === 'security_privacy' && <SecurityPrivacyTab />}
        {activeTab === 'user_profile' && <UserProfileTab />}
        {activeTab === 'cloud_integration' && <CloudIntegrationTab />}
      </div>
    </div>
  );
}
