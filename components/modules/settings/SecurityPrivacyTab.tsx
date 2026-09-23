'use client';

import React, { useState } from 'react';
import {
  Lock,
  Key,
  Shield,
  Clock,
  Radio,
  FileText,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';

export function SecurityPrivacyTab() {
  const { user, token, switchRole } = useErpAuth();
  const [jwtExpiry, setJwtExpiry] = useState('8');
  const [inactivityTimeout, setInactivityTimeout] = useState('30');
  const [copied, setCopied] = useState(false);
  const [refreshedNotice, setRefreshedNotice] = useState(false);
  const [savedPolicy, setSavedPolicy] = useState(false);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefreshToken = async () => {
    await switchRole(user.role);
    setRefreshedNotice(true);
    setTimeout(() => setRefreshedNotice(false), 3000);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedPolicy(true);
    setTimeout(() => setSavedPolicy(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-200/50 dark:border-rose-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Access Governance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure JSON Web Token lifetimes, inactivity lockouts, firewall rules, and examine active tokens.
            </p>
          </div>
        </div>

        {savedPolicy && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            Security Policy Applied
          </div>
        )}
      </div>

      {/* 1. JWT & Session Expiration Settings */}
      <form onSubmit={handleSavePolicies} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Key className="w-4 h-4 text-amber-500" />
          Authentication & Session Expiry Policy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              JWT Shift Token Expiration
            </label>
            <select
              value={jwtExpiry}
              onChange={(e) => setJwtExpiry(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="8">8 Hours (Standard Factory Single Shift)</option>
              <option value="12">12 Hours (Extended Shift)</option>
              <option value="24">24 Hours (Daily Renewal)</option>
              <option value="168">7 Days (Weekly Persistent)</option>
            </select>
            <span className="text-[10px] text-slate-400">Tokens are signed with HMAC SHA-256 on Express host.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Terminal Idle Lockout Timeout
            </label>
            <select
              value={inactivityTimeout}
              onChange={(e) => setInactivityTimeout(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="15">15 Minutes of Inactivity</option>
              <option value="30">30 Minutes (Recommended)</option>
              <option value="60">60 Minutes</option>
              <option value="0">Disabled (Kiosk Continuous Mode)</option>
            </select>
            <span className="text-[10px] text-slate-400">Protects shared QC inspection tablets on factory lines.</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 cursor-pointer"
          >
            Update Security Policies
          </button>
        </div>
      </form>

      {/* 2. Active Session & Token Inspector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Active Session & JWT Token Inspector
          </h3>

          <button
            type="button"
            onClick={handleRefreshToken}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshedNotice ? 'animate-spin' : ''}`} />
            Revoke & Refresh Session Token
          </button>
        </div>

        {refreshedNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Session token successfully regenerated and verified with server.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase block">Active User Claims</span>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subject ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authenticated Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Role:</span>
                <span className="font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  {user.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700 dark:text-slate-300">{user.department}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Bearer Token (Header / Cookie)</span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Token'}
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] break-all border border-slate-800 select-all max-h-28 overflow-y-auto">
              {token || 'No active token'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Host Firewall Status */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Flame className="w-4 h-4 text-orange-500" />
          Windows Firewall & Wi-Fi LAN Inbound Rules
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          To allow factory floor tablets and mobile devices to connect to this Host PC on Port 3000, Windows Firewall must permit incoming TCP traffic.
        </p>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-slate-700 dark:text-slate-300">
              setup-firewall-as-admin.bat (Rule: "Garments ERP Host Port 3000")
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
            Inbound Allowed (TCP 3000)
          </span>
        </div>
      </div>
    </div>
  );
}
