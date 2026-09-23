'use client';

import React, { useState } from 'react';
import {
  Settings,
  Palette,
  Building2,
  Users,
  Activity,
  Database,
  Lock,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

// 7 Organized Sub-Tab Modules
import { AppearanceTab } from '@/components/modules/settings/AppearanceTab';
import { GeneralTab } from '@/components/modules/settings/GeneralTab';
import { UsersRbacTab } from '@/components/modules/settings/UsersRbacTab';
import { SystemHealthTab } from '@/components/modules/settings/SystemHealthTab';
import { DatabaseBackupTab } from '@/components/modules/settings/DatabaseBackupTab';
import { SecurityPrivacyTab } from '@/components/modules/settings/SecurityPrivacyTab';
import { UserProfileTab } from '@/components/modules/settings/UserProfileTab';

export type SettingsTabId =
  | 'appearance'
  | 'general'
  | 'users_rbac'
  | 'system_health'
  | 'database_backup'
  | 'security_privacy'
  | 'user_profile';

interface SettingsTabDef {
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SETTINGS_TABS: SettingsTabDef[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Theme modes, brand accents & layout density',
  },
  {
    id: 'general',
    label: 'General',
    icon: Building2,
    description: 'Plant identity, localization & AQL standards',
  },
  {
    id: 'users_rbac',
    label: 'User Management & RBAC',
    icon: Users,
    description: 'User directory, privileges & permissions matrix',
  },
  {
    id: 'system_health',
    label: 'System Health',
    icon: Activity,
    description: 'CPU, RAM, latency & multi-device network status',
  },
  {
    id: 'database_backup',
    label: 'Database & Backup',
    icon: Database,
    description: 'MySQL host connection, snapshots & disaster recovery',
  },
  {
    id: 'security_privacy',
    label: 'Security & Privacy',
    icon: Lock,
    description: 'JWT policies, firewall rules & session tokens',
  },
  {
    id: 'user_profile',
    label: 'User Profile',
    icon: User,
    description: 'Account attributes, password & fast role switching',
  },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('appearance');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Enterprise System Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                Production Control
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive control center for Host PC hardware telemetry, MySQL database, security, and UI personalization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Host PC Engine: Active</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400 dark:text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display Area */}
      <div>
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'users_rbac' && <UsersRbacTab />}
        {activeTab === 'system_health' && <SystemHealthTab />}
        {activeTab === 'database_backup' && <DatabaseBackupTab />}
        {activeTab === 'security_privacy' && <SecurityPrivacyTab />}
        {activeTab === 'user_profile' && <UserProfileTab />}
      </div>
    </div>
  );
}
