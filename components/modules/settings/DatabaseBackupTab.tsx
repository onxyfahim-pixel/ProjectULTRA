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
} from 'lucide-react';

interface BackupFile {
  fileName: string;
  sizeBytes: number;
  sizeKB: string;
  createdAt: string;
}

export function DatabaseBackupTab() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [isMysqlConnected, setIsMysqlConnected] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackupsAndStats = async () => {
    setLoading(true);
    try {
      const [backupsRes, hostRes] = await Promise.all([
        fetch('/api/database/backup'),
        fetch('/api/host-info'),
      ]);

      if (backupsRes.ok) {
        const data = await backupsRes.json();
        if (data.backups) setBackups(data.backups);
        setIsMysqlConnected(data.isMysqlConnected);
      }

      if (hostRes.ok) {
        const hostData = await hostRes.json();
        setDbStats(hostData.stats);
        if (hostData.isMysqlConnected !== undefined) {
          setIsMysqlConnected(hostData.isMysqlConnected);
        }
      }
    } catch (err) {
      console.error('Failed to load database backup info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupsAndStats();
  }, []);

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
        fetchBackupsAndStats();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create snapshot.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating snapshot.' });
    } finally {
      setCreating(false);
      setTimeout(() => setMessage(null), 5000);
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
        fetchBackupsAndStats();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to restore backup.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Invalid backup file: ${err.message}` });
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMessage(null), 6000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-transparent border border-blue-200/50 dark:border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Database & Disaster Recovery</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage Host MySQL tables, generate zero-downtime backups, and restore snapshots on demand.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Download JSON
          </button>

          <button
            type="button"
            onClick={handleCreateSnapshot}
            disabled={creating}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${creating ? 'animate-spin' : ''}`} />
            {creating ? 'Creating Snapshot...' : 'Create Server Snapshot'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold border animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Database Connection & Table Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Engine Status</span>
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isMysqlConnected
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isMysqlConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}
              ></span>
              {isMysqlConnected ? 'MySQL 8.0 Connected' : 'Local Fallback'}
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mb-1">
            {isMysqlConnected ? 'garments_erp' : 'erp-central-store.json'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {isMysqlConnected ? 'localhost:3306 (InnoDB Pool)' : 'data/erp-central-store.json'}
          </p>
        </div>

        {/* Live Records Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Core Data Rows</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mb-1">
            {(dbStats?.itemCount || 0) + (dbStats?.inspectionCount || 0) + (dbStats?.activeOrders || 0)} Active Records
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {dbStats?.itemCount || 0} Inventory Batches • {dbStats?.inspectionCount || 0} Inspections
          </p>
        </div>

        {/* Restore Backup Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Disaster Recovery</span>
              <Upload className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Upload a previous JSON backup snapshot to restore all tables.
            </p>
          </div>

          <div>
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
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer ${
                restoring ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              {restoring ? 'Restoring Database...' : 'Select JSON to Restore'}
            </label>
          </div>
        </div>
      </div>

      {/* Snapshots History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Host PC Disk Snapshots ({backups.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Location: data/backups/</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Backup Snapshot File</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Created Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No backups created yet. Click "Create Server Snapshot" to take your first backup.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.fileName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-500" />
                      {b.fileName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {b.sizeKB} KB
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" />
                        Host Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
