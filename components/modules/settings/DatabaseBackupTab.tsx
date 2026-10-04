'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Check,
  AlertCircle,
  FileText,
  Server,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Terminal,
  HelpCircle,
  Clock,
  Activity,
  CheckSquare,
} from 'lucide-react';

interface BackupFile {
  fileName: string;
  sizeBytes: number;
  sizeKB: string;
  createdAt: string;
}

interface TableStat {
  name: string;
  rowCount: number;
  engine: string;
  status: 'READY' | 'EMPTY' | 'NOT_CREATED';
  lastUpdated?: string;
}

export function DatabaseBackupTab() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [isMysqlConnected, setIsMysqlConnected] = useState(false);
  const [tables, setTables] = useState<TableStat[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);

  // Connection Setup Form State
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('garments_erp');
  const [showPassword, setShowPassword] = useState(false);

  // Action status states
  const [testing, setTesting] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    details?: string;
  } | null>(null);

  const [activeGuideTab, setActiveGuideTab] = useState<'xampp' | 'installer' | 'docker' | 'bat'>('xampp');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDatabaseStatus = async () => {
    setLoading(true);
    try {
      const [statusRes, backupsRes] = await Promise.all([
        fetch('/api/database/status'),
        fetch('/api/database/backup'),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setIsMysqlConnected(data.isConnected);
        if (data.tables) setTables(data.tables);
        if (data.stats) setDbStats(data.stats);
        if (data.telemetry) {
          setTelemetry(data.telemetry);
          if (data.telemetry.host) setHost(data.telemetry.host);
          if (data.telemetry.port) setPort(String(data.telemetry.port));
          if (data.telemetry.user) setUser(data.telemetry.user);
          if (data.telemetry.database) setDatabase(data.telemetry.database);
        }
      }

      if (backupsRes.ok) {
        const bData = await backupsRes.json();
        if (bData.backups) setBackups(bData.backups);
      }
    } catch (err) {
      console.error('Failed to load database status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  // Preset Configurations
  const applyPreset = (preset: 'xampp' | 'mysql-root' | 'mysql-password' | 'blank') => {
    setHost('localhost');
    setPort('3306');
    setUser('root');
    setDatabase('garments_erp');

    if (preset === 'xampp' || preset === 'blank') {
      setPassword('');
      setMessage({
        type: 'info',
        text: 'Applied XAMPP preset (User: root, Password: empty). Click "Test Connection" to verify.',
      });
    } else if (preset === 'mysql-root') {
      setPassword('root');
      setMessage({
        type: 'info',
        text: 'Applied Standard MySQL preset (User: root, Password: root).',
      });
    } else if (preset === 'mysql-password') {
      setPassword('password');
      setMessage({
        type: 'info',
        text: 'Applied Standard MySQL preset (User: root, Password: password).',
      });
    }
  };

  // 1. Test Connection
  const handleTestConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/database/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, password, database }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: data.message,
          details: `Latency: ${data.latencyMs}ms | Version: ${data.serverVersion}`,
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Connection test failed.',
          details: 'Check if MySQL is running (e.g. XAMPP Control Panel) or verify password.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Network error: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  // 2. Save & 1-Click Initialize Schema
  const handleSetupDatabase = async () => {
    setInitializing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/database/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, password, database }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: data.message,
        });
        setIsMysqlConnected(true);
        if (data.tables) setTables(data.tables);
        if (data.telemetry) setTelemetry(data.telemetry);
        fetchDatabaseStatus();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to initialize MySQL database.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Setup error: ${err.message}`,
      });
    } finally {
      setInitializing(false);
    }
  };

  // 3. Full Re-Migration & Sync
  const handleMigrateAll = async () => {
    setMigrating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/database/migrate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: data.message,
        });
        if (data.tables) setTables(data.tables);
        fetchDatabaseStatus();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Migration failed.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Migration error: ${err.message}` });
    } finally {
      setMigrating(false);
    }
  };

  // Create real server-side snapshot
  const handleCreateSnapshot = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/database/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Snapshot created: ${data.fileName} (${data.sizeKB} KB) containing ${data.inventoryCount} items and ${data.inspectionsCount} inspections!`,
        });
        fetchDatabaseStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create snapshot.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating snapshot.' });
    } finally {
      setCreating(false);
    }
  };

  // Trigger browser download
  const handleDownload = () => {
    window.location.href = '/api/database/backup?action=download';
  };

  // Restore from uploaded JSON file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Are you sure you want to restore data from "${file.name}"? This will update the database state.`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setRestoring(true);
    setMessage(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch('/api/database/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Database restored! Successfully imported ${data.restoredInventoryCount} inventory items, ${data.restoredInspectionsCount} inspections, and ${data.restoredModulesCount} QMS modules.`,
        });
        fetchDatabaseStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to restore backup.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Invalid backup file: ${err.message}` });
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-200/60 dark:border-blue-900/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                MySQL Enterprise Database Setup & Management
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                  isMysqlConnected
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {isMysqlConnected ? '✓ MySQL 8.0 Active' : '⚡ Local JSON Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Full relational persistence for Buyer Orders (with 9-Stage WIP), Floor Production Records, AQL Inspections, Inventory, and 28 QMS modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchDatabaseStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Download JSON Dump
          </button>
        </div>
      </div>

      {/* Alert / Feedback Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-xs font-semibold border animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : message.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-bold">{message.text}</div>
            {message.details && (
              <div className="text-[11px] opacity-80 mt-1 font-mono">{message.details}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Column Section: Left = Easy Setup Configuration, Right = Live Telemetry & Table Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick MySQL Setup Wizard */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    1-Click MySQL Connection Setup
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connect local XAMPP, standalone MySQL, or remote host
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Port: {port}
              </span>
            </div>

            {/* Quick Presets Buttons */}
            <div className="mb-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Quick Setup Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('xampp')}
                  className="px-2.5 py-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100/60 transition-colors text-center cursor-pointer"
                >
                  <div className="font-black text-[11px]">XAMPP Default</div>
                  <div className="text-[10px] opacity-75 font-normal">root / (no pass)</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('mysql-root')}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-colors text-center cursor-pointer"
                >
                  <div className="font-black text-[11px]">Standard MySQL</div>
                  <div className="text-[10px] opacity-75 font-normal">root / root</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('mysql-password')}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-colors text-center cursor-pointer"
                >
                  <div className="font-black text-[11px]">Default Pass</div>
                  <div className="text-[10px] opacity-75 font-normal">root / password</div>
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    MySQL Host / IP
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost or 127.0.0.1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Port
                  </label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="3306"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Database User
                  </label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="root"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                    Database Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank if no password"
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 block">
                  Database Name
                </label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="garments_erp"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 text-blue-600 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="button"
                onClick={handleSetupDatabase}
                disabled={initializing}
                className="flex-1 min-w-[170px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${initializing ? 'animate-spin' : ''}`} />
                {initializing ? 'Initializing Tables...' : 'Save & Initialize Database'}
              </button>

              <button
                type="button"
                onClick={handleMigrateAll}
                disabled={migrating || !isMysqlConnected}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                title="Migrates all ERP Buyer Orders, WIP records, Inspections, and 28 QMS modules into MySQL"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
                {migrating ? 'Migrating...' : 'Migrate All ERP Data'}
              </button>
            </div>
          </div>

          {/* Easy Setup Step-by-Step Guide Accordion */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Easy Setup Assistant (How to Start MySQL)
                </h4>
              </div>
            </div>

            {/* Guide Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              {[
                { id: 'xampp', label: '1. XAMPP (Easiest)' },
                { id: 'installer', label: '2. Standalone MySQL' },
                { id: 'docker', label: '3. Docker' },
                { id: 'bat', label: '4. Batch Tool' },
              ].map((gt) => (
                <button
                  key={gt.id}
                  type="button"
                  onClick={() => setActiveGuideTab(gt.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    activeGuideTab === gt.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {gt.label}
                </button>
              ))}
            </div>

            {/* Guide Content */}
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
              {activeGuideTab === 'xampp' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <span>Download and install free <strong>XAMPP for Windows</strong> (from apachefriends.org).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <span>Open <strong>XAMPP Control Panel</strong> and click the green <strong>"Start"</strong> button next to <strong>MySQL</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <span>Click the <strong>"XAMPP Default"</strong> preset button above, then click <strong>"Save & Initialize Database"</strong>. Everything runs automatically!</span>
                  </div>
                </div>
              )}

              {activeGuideTab === 'installer' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <span>If you have MySQL Server installed via MySQL Installer, make sure the Windows service is running.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <span>In Windows Command Prompt (Admin), you can start it with: <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">net start MySQL80</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <span>Enter your root password above and click <strong>"Save & Initialize Database"</strong>.</span>
                  </div>
                </div>
              )}

              {activeGuideTab === 'docker' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <p>Run this single command in PowerShell or Terminal to spin up MySQL instantly:</p>
                  <pre className="p-2.5 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto select-all">
                    docker run -d -p 3306:3306 --name garments-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=garments_erp mysql:8.0
                  </pre>
                  <p className="text-[11px]">Then select the "Standard MySQL (root/root)" preset above and click Save.</p>
                </div>
              )}

              {activeGuideTab === 'bat' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <p>
                    You can also double-click <strong className="text-slate-900 dark:text-white">easy-mysql-setup.bat</strong> in the project root folder.
                  </p>
                  <p className="text-[11px]">
                    The batch tool will detect running MySQL instances, test passwords, configure <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">.env.local</code>, create all 10 relational tables, and migrate all ERP modules in 5 seconds!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Telemetry, Table Health, and Disaster Recovery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Engine Status Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Database Engine Telemetry
              </span>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                  isMysqlConnected
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isMysqlConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {isMysqlConnected ? 'Host PC MySQL Active' : 'Offline Fallback'}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Database</div>
                <div className="text-sm font-black text-slate-900 dark:text-white truncate font-mono">
                  {telemetry?.database || 'garments_erp'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Ping Latency</div>
                <div className="text-sm font-black text-emerald-600 font-mono">
                  {telemetry?.latencyMs !== null && telemetry?.latencyMs !== undefined
                    ? `${telemetry.latencyMs} ms`
                    : 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Connection</div>
                <div className="text-sm font-black text-slate-900 dark:text-white truncate font-mono">
                  {telemetry?.host || 'localhost'}:{telemetry?.port || 3306}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Relational Tables</div>
                <div className="text-sm font-black text-blue-600 font-mono">
                  {tables.filter((t) => t.status === 'READY').length} / {tables.length || 9}
                </div>
              </div>
            </div>

            {/* Table Health Inspector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Relational Tables & Record Counts
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Engine: InnoDB</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {tables.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No MySQL tables inspected yet. Connect MySQL to inspect table ledger.
                  </div>
                ) : (
                  tables.map((tbl) => (
                    <div
                      key={tbl.name}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare
                          className={`w-3.5 h-3.5 ${
                            tbl.status === 'READY' ? 'text-emerald-500' : 'text-slate-300'
                          }`}
                        />
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {tbl.name}
                        </span>
                        {tbl.name === 'buyer_orders' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 text-blue-700">
                            WIP PIPELINE
                          </span>
                        )}
                        {tbl.name === 'production_records' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-700">
                            HOURLY FLOOR
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black ${
                            tbl.rowCount > 0
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {tbl.rowCount.toLocaleString()} rows
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Disaster Recovery Snapshots Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Zero-Downtime Snapshots & JSON Restore
                </h4>
              </div>

              <button
                type="button"
                onClick={handleCreateSnapshot}
                disabled={creating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${creating ? 'animate-spin' : ''}`} />
                {creating ? 'Creating...' : 'Take Snapshot'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="restore-upload-input"
              />
              <label
                htmlFor="restore-upload-input"
                className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer ${
                  restoring ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                {restoring ? 'Restoring Database...' : 'Upload & Restore Backup JSON'}
              </label>
            </div>

            {/* Snapshots list */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
              {backups.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No snapshots recorded yet. Click "Take Snapshot" to archive current state.
                </div>
              ) : (
                backups.map((b) => (
                  <div
                    key={b.fileName}
                    className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono font-bold truncate text-slate-800 dark:text-slate-200">
                        {b.fileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-slate-500">
                      <span>{b.sizeKB} KB</span>
                      <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
