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
  Smartphone,
  QrCode,
  ShieldAlert,
  LogOut,
  Laptop,
  Tablet,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';

interface ActiveSession {
  id: string;
  device: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  ipAddress: string;
  location: string;
  loginTime: string;
  isCurrent: boolean;
}

export function SecurityPrivacyTab() {
  const { user, token, switchRole } = useErpAuth();

  // Policy Settings
  const [jwtExpiry, setJwtExpiry] = useState('8');
  const [inactivityTimeout, setInactivityTimeout] = useState('30');
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState('5');
  const [savedPolicy, setSavedPolicy] = useState(false);

  // 2FA State
  const [is2FaEnabled, setIs2FaEnabled] = useState(false);
  const [is2FaModalOpen, setIs2FaModalOpen] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpVerified, setTotpVerified] = useState(false);

  // Token inspector
  const [copied, setCopied] = useState(false);
  const [refreshedNotice, setRefreshedNotice] = useState(false);

  // IP Whitelist
  const [ipList, setIpList] = useState<string[]>([
    '192.168.1.0/24 (Factory Floor LAN)',
    '10.0.4.0/24 (Executive Management Wi-Fi)',
    '127.0.0.1 (Localhost Direct)',
  ]);
  const [newIp, setNewIp] = useState('');

  // Active Sessions
  const [sessions, setSessions] = useState<ActiveSession[]>([
    {
      id: 'sess-1',
      device: 'Windows 11 PC (Host Server)',
      deviceType: 'desktop',
      ipAddress: '127.0.0.1',
      location: 'Main Factory Plant - QC Server Room',
      loginTime: 'Today at 08:30 AM',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'Samsung Galaxy Tab S9 (Warehouse #2)',
      deviceType: 'tablet',
      ipAddress: '192.168.1.142',
      location: 'Fabric Inward Inspection Dock',
      loginTime: 'Today at 09:15 AM',
      isCurrent: false,
    },
    {
      id: 'sess-3',
      device: 'iPad Pro (Sewing Floor Line #4)',
      deviceType: 'tablet',
      ipAddress: '192.168.1.168',
      location: 'Finishing & Packing Section',
      loginTime: 'Today at 10:04 AM',
      isCurrent: false,
    },
  ]);

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

  const handleVerify2Fa = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length === 6) {
      setTotpVerified(true);
      setIs2FaEnabled(true);
      setTimeout(() => {
        setIs2FaModalOpen(false);
        setTotpVerified(false);
        setTotpCode('');
      }, 1200);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    setIpList((prev) => [...prev, newIp.trim()]);
    setNewIp('');
  };

  const handleRemoveIp = (index: number) => {
    setIpList((prev) => prev.filter((_, i) => i !== index));
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security &amp; Privacy Governance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure JSON Web Token lifetimes, enforce two-factor authentication (2FA), firewall rules, and inspect active terminal sessions.
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

      {/* 1. Two-Factor Authentication & Password Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Two-Factor Authentication Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-rose-500" />
                Two-Factor Authentication (2FA / TOTP)
              </h3>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  is2FaEnabled
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {is2FaEnabled ? 'ENFORCED' : 'OPTIONAL'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
              Require factory supervisors and managers to supply a 6-digit TOTP authenticator code (Google Authenticator, Microsoft Authenticator) alongside password on login.
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Authenticator App Status
                </span>
                <span className="text-[11px] text-slate-500">
                  {is2FaEnabled ? 'Linked with root authentication hardware key' : 'No 2FA device paired currently'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (is2FaEnabled) {
                    setIs2FaEnabled(false);
                  } else {
                    setIs2FaModalOpen(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  is2FaEnabled
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20'
                }`}
              >
                {is2FaEnabled ? 'Disable 2FA' : 'Enable 2FA Setup'}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0 text-blue-600" />
            <span>Recommended for ISO 9001 and buyer C-TPAT supply chain security compliance.</span>
          </div>
        </div>

        {/* Password Governance Form */}
        <form onSubmit={handleSavePolicies} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Password Complexity &amp; Lockout Rules
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Length
              </label>
              <select
                value={minPasswordLength}
                onChange={(e) => setMinPasswordLength(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
              >
                <option value="6">6 Characters</option>
                <option value="8">8 Characters (Recommended)</option>
                <option value="12">12 Characters (High Security)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Brute-Force Lock Threshold
              </label>
              <select
                value={maxFailedAttempts}
                onChange={(e) => setMaxFailedAttempts(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
              >
                <option value="3">3 Failed Attempts</option>
                <option value="5">5 Failed Attempts</option>
                <option value="10">10 Failed Attempts</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={requireSpecialChar}
                onChange={(e) => setRequireSpecialChar(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              Require at least one special symbol (!@#$%^&amp;*)
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={requireNumbers}
                onChange={(e) => setRequireNumbers(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              Require numeric digits (0-9)
            </label>
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
      </div>

      {/* 2. JWT & Session Expiration Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Key className="w-4 h-4 text-amber-500" />
          Authentication &amp; Session Expiry Policy
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
      </div>

      {/* 3. Active User Sessions Inspector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Active Terminal Sessions &amp; Device Tokens ({sessions.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Remote sign-out revokes session JWT immediately</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Device &amp; Operating System</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Floor Location</th>
                <th className="py-3 px-4">Connected Time</th>
                <th className="py-3 px-4 text-right">Session Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {sess.deviceType === 'desktop' ? (
                        <Laptop className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Tablet className="w-4 h-4 text-purple-500" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {sess.device}
                          {sess.isCurrent && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded border border-emerald-300">
                              THIS DEVICE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{sess.ipAddress}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{sess.location}</td>
                  <td className="py-3 px-4 text-slate-500">{sess.loginTime}</td>
                  <td className="py-3 px-4 text-right">
                    {sess.isCurrent ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Current Session</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Factory LAN IP Whitelist */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Globe className="w-4 h-4 text-indigo-500" />
          Factory Wi-Fi Subnet &amp; Tablet IP Whitelist
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Only devices connecting from these designated factory subnets can communicate with the Host PC on Port 3000.
        </p>

        <div className="flex flex-wrap gap-2">
          {ipList.map((ip, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200"
            >
              <span>{ip}</span>
              <button
                type="button"
                onClick={() => handleRemoveIp(idx)}
                className="text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddIp} className="flex gap-2 max-w-md pt-2">
          <input
            type="text"
            placeholder="e.g. 192.168.2.0/24 (Cutting Floor)"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
          >
            Add Subnet
          </button>
        </form>
      </div>

      {/* 5. Active JWT Token Inspector & Firewall */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Active User Claims &amp; JWT Bearer Token
          </h3>

          <button
            type="button"
            onClick={handleRefreshToken}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshedNotice ? 'animate-spin' : ''}`} />
            Revoke &amp; Refresh Session Token
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

      {/* 2FA Setup Modal */}
      {is2FaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-rose-600" />
                Setup Two-Factor Authenticator
              </h3>
              <button
                type="button"
                onClick={() => setIs2FaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Scan this QR code with Google Authenticator or Microsoft Authenticator:
              </p>

              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 inline-block border border-slate-200 dark:border-slate-700">
                <QrCode className="w-36 h-36 mx-auto text-slate-900 dark:text-white" />
              </div>

              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                Manual Key: <strong className="text-slate-800 dark:text-slate-200 select-all">JBSWY3DPEHPK3PXP</strong>
              </div>
            </div>

            <form onSubmit={handleVerify2Fa} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 6-Digit TOTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {totpVerified && (
                <div className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Pairing verified successfully!
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIs2FaModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={totpCode.length !== 6}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 cursor-pointer"
                >
                  Verify &amp; Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
