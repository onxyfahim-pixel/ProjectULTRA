'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Clock,
  User,
  Eye,
  History,
  GitCommit,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Download,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Smartphone,
  Info,
} from 'lucide-react';
import { AuditLog, RecordChangeDiff, RecordViewEntry, RecordViewStats } from '@/lib/types/erp';
import {
  trackEntityView,
  getAuditHistoryForEntity,
  getViewStatsForEntity,
  AUDIT_LOGS_UPDATED_EVENT,
  RECORD_VIEWS_UPDATED_EVENT,
} from '@/lib/services/audit-trail-service';
import { useErpAuth } from '@/hooks/use-erp-auth';

export interface RecordAuditHistoryProps {
  entity?: string; // e.g. 'BuyerOrder', 'ProductionOrder', 'InspectionRecord', 'InventoryItem', etc.
  entityId?: string; // e.g. 'ord-101', 'po-206'
  recordId?: string; // alias for entityId
  recordCode?: string; // alias for entityCode
  entityCode?: string; // e.g. 'PO-HM-99201', 'FIN-01'
  moduleName?: string; // e.g. 'Buyer Order', 'Production & Quality'
  data?: any; // record payload for change context
  createdAt?: string;
  createdBy?: string;
  createdByRole?: string;
  updatedAt?: string;
  updatedBy?: string;
  lastUpdatedAt?: string; // alias for updatedAt
  lastUpdatedBy?: string; // alias for updatedBy
  updatedByRole?: string;
  className?: string;
}

export function RecordAuditHistory({
  entity: rawEntity,
  entityId: rawEntityId,
  recordId,
  recordCode,
  entityCode: rawEntityCode,
  moduleName = 'General',
  data,
  createdAt: propCreatedAt,
  createdBy: propCreatedBy,
  createdByRole: propCreatedByRole,
  updatedAt: propUpdatedAt,
  updatedBy: propUpdatedBy,
  lastUpdatedAt,
  lastUpdatedBy,
  updatedByRole: propUpdatedByRole,
  className = '',
}: RecordAuditHistoryProps) {
  const entity = rawEntity || moduleName.replace(/[^a-zA-Z0-9]/g, '');
  const entityId = rawEntityId || recordId || 'REC-UNKNOWN';
  const entityCode = rawEntityCode || recordCode || entityId;
  const propUpdated = propUpdatedAt || lastUpdatedAt;
  const propUpdater = propUpdatedBy || lastUpdatedBy;
  const { user } = useErpAuth();
  const [activeTab, setActiveTab] = useState<'timeline' | 'diffs' | 'views'>('timeline');
  const [logs, setLogs] = useState<AuditLog[]>(() => getAuditHistoryForEntity(entity, entityId));
  const [viewStats, setViewStats] = useState<RecordViewStats>(() => getViewStatsForEntity(entity, entityId));
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Track view on initial mount and update live stats
  useEffect(() => {
    if (!entity || !entityId) return;

    // Track view in audit trail service
    const stats = trackEntityView({
      entity,
      entityId,
      entityCode,
      moduleName,
      user: {
        id: user?.id,
        name: user?.name,
        role: user?.role,
        avatarUrl: user?.avatarUrl,
      },
    });
    setViewStats(stats);
    setLogs(getAuditHistoryForEntity(entity, entityId));

    // Listen for live audit updates
    const handleLogsUpdate = () => {
      setLogs(getAuditHistoryForEntity(entity, entityId));
    };

    const handleViewsUpdate = () => {
      setViewStats(getViewStatsForEntity(entity, entityId));
    };

    window.addEventListener(AUDIT_LOGS_UPDATED_EVENT, handleLogsUpdate);
    window.addEventListener(RECORD_VIEWS_UPDATED_EVENT, handleViewsUpdate);

    return () => {
      window.removeEventListener(AUDIT_LOGS_UPDATED_EVENT, handleLogsUpdate);
      window.removeEventListener(RECORD_VIEWS_UPDATED_EVENT, handleViewsUpdate);
    };
  }, [entity, entityId, entityCode, moduleName, user?.name]);

  // Derive creation trace
  const creationTrace = useMemo(() => {
    const createLog = logs.find((l) => l.action === 'CREATE');
    return {
      author: propCreatedBy || createLog?.performedBy || 'System Administrator',
      role: propCreatedByRole || createLog?.userRole || 'ADMIN',
      timestamp: propCreatedAt || createLog?.timestamp || '2026-09-01T08:00:00.000Z',
    };
  }, [logs, propCreatedBy, propCreatedByRole, propCreatedAt]);

  // Derive last edit trace
  const editTrace = useMemo(() => {
    const editLogs = logs.filter((l) => l.action !== 'CREATE' && l.action !== 'VIEW');
    const latestEdit = editLogs[0];
    return {
      author: propUpdater || latestEdit?.performedBy || creationTrace.author,
      role: propUpdatedByRole || latestEdit?.userRole || creationTrace.role,
      timestamp: propUpdated || latestEdit?.timestamp || creationTrace.timestamp,
      action: latestEdit?.action || 'Initial Creation',
    };
  }, [logs, propUpdater, propUpdatedByRole, propUpdated, creationTrace]);

  // All field changes aggregated across history
  const allFieldDiffs = useMemo(() => {
    const diffs: { log: AuditLog; diff: RecordChangeDiff }[] = [];
    logs.forEach((log) => {
      if (log.changes && log.changes.length > 0) {
        log.changes.forEach((c) => {
          diffs.push({ log, diff: c });
        });
      }
    });
    return diffs;
  }, [logs]);

  const handleExportHistory = () => {
    try {
      const headers = ['Timestamp', 'Action', 'Author', 'Role', 'Details', 'Changes'];
      const rows = logs.map((l) => {
        const changesText = (l.changes || [])
          .map((c) => `${c.fieldLabel || c.field}: ${c.oldValue ?? 'None'} -> ${c.newValue}`)
          .join('; ');
        return [
          l.timestamp,
          `"${l.action}"`,
          `"${l.performedBy}"`,
          `"${l.userRole}"`,
          `"${(l.details || '').replace(/"/g, '""')}"`,
          `"${changesText.replace(/"/g, '""')}"`,
        ];
      });

      const csvContent =
        'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${entity}_${entityCode || entityId}_AuditTrail.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportNotice('Audit trail exported successfully!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      setExportNotice('Failed to export audit trail.');
    }
  };

  const getBadgeForAction = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('DELETE') || a.includes('REJECT')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (a.includes('UPDATE') || a.includes('ADJUST') || a.includes('CHANGE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (a.includes('CREATE') || a.includes('APPROVE') || a.includes('PASSED')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (a.includes('VIEW')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const formatRelativeTime = (iso: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diffSec < 60) return 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden ${className}`}
    >
      {/* 1. TOP SUMMARY BANNER: CREATOR, EDITOR & LIVE VIEW COUNTER */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Audit Trail &amp; View History System
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                100% Traceable
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live lifecycle trace for record <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{entityCode || entityId}</span> in {moduleName || entity}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={handleExportHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Download CSV Dossier"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export Audit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border-b border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* 2. THREE SUMMARY CARDS: CREATED BY, LAST MODIFIED BY, LIVE VIEWS */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800">
        {/* CARD A: CREATED BY */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3 text-emerald-600" />
              Created By
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {creationTrace.role}
            </span>
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
              {creationTrace.author}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatDateTime(creationTrace.timestamp)}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Initial Record Entry ({formatRelativeTime(creationTrace.timestamp)})
            </div>
          </div>
        </div>

        {/* CARD B: LAST MODIFIED BY */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GitCommit className="w-3 h-3 text-amber-600" />
              Last Changed By
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {editTrace.role}
            </span>
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
              {editTrace.author}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatDateTime(editTrace.timestamp)}</span>
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              {editTrace.action} ({formatRelativeTime(editTrace.timestamp)})
            </div>
          </div>
        </div>

        {/* CARD C: LIVE VIEW SYSTEM METRICS */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-cyan-600" />
              Record View System
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              LIVE TRACE
            </span>
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{viewStats.viewCount || 1} Total Views</span>
              <span className="text-[10px] font-normal text-slate-400">
                ({(viewStats.history || []).length} log entries)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Last viewed by <strong className="text-slate-700 dark:text-slate-300">{viewStats.lastViewedBy || user?.name || 'Authorized Staff'}</strong>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {viewStats.lastViewedAt ? formatDateTime(viewStats.lastViewedAt) : 'Just now'} ({formatRelativeTime(viewStats.lastViewedAt || new Date().toISOString())})
            </div>
          </div>
        </div>
      </div>

      {/* 3. COLLAPSIBLE ACCORDION DETAILS (TABS: TIMELINE, FIELD DIFFS, VIEWERS) */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2 flex-wrap">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Timeline ({logs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('diffs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'diffs'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>What Changed ({allFieldDiffs.length} Diffs)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('views')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'views'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Viewers Log ({(viewStats.history || []).length})</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Synchronized with Central Settings Audit Store
            </div>
          </div>

          {/* TAB 1: AUDIT TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3.5">
              {logs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No chronological audit records registered yet for this item.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {logs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline Node Dot */}
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-2xs space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${getBadgeForAction(log.action)}`}
                            >
                              {log.action}
                            </span>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {log.performedBy}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {log.userRole}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDateTime(log.timestamp)}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-slate-500 font-sans">{formatRelativeTime(log.timestamp)}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {log.details || 'System operation executed.'}
                        </p>

                        {/* Inline Changes Diff Preview if present */}
                        {log.changes && log.changes.length > 0 && (
                          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Specific Changes:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {log.changes.map((ch, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2"
                                >
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                    {ch.fieldLabel || ch.field}:
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                                    <span className="text-rose-600 dark:text-rose-400 line-through text-[10px]">
                                      {ch.oldValue ?? 'None'}
                                    </span>
                                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                      {ch.newValue}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FIELD CHANGES DIFF (WHAT CHANGED) */}
          {activeTab === 'diffs' && (
            <div className="space-y-3">
              {allFieldDiffs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                  No individual field modifications recorded yet. All values remain at their initial creation state.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Field Name</th>
                        <th className="py-2.5 px-3">Previous Value</th>
                        <th className="py-2.5 px-3">Updated Value</th>
                        <th className="py-2.5 px-3">Changed By</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {allFieldDiffs.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {item.diff.fieldLabel || item.diff.field}
                          </td>
                          <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60">
                              {item.diff.oldValue !== null && item.diff.oldValue !== undefined
                                ? String(item.diff.oldValue)
                                : 'Empty / Initial'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
                              {String(item.diff.newValue)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                            <div className="font-bold">{item.log.performedBy}</div>
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400">{item.log.userRole}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {formatDateTime(item.log.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VIEWERS LOG */}
          {activeTab === 'views' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40 text-xs text-cyan-800 dark:text-cyan-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-600" />
                  <span>
                    Records every authorized user view event with device context and precise chronological timestamp.
                  </span>
                </div>
                <span className="font-bold font-mono">
                  {viewStats.viewCount || 1} Total Impressions
                </span>
              </div>

              {(viewStats.history || []).length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No viewer impressions recorded yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Viewer Name</th>
                        <th className="py-2.5 px-3">Role Designation</th>
                        <th className="py-2.5 px-3">Device / Client</th>
                        <th className="py-2.5 px-3">Viewed Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {(viewStats.history || []).map((entry, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                              {entry.userName.charAt(0)}
                            </div>
                            <span>{entry.userName}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {entry.userRole}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 flex items-center gap-1.5">
                            {entry.device === 'Mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <Monitor className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>{entry.device || 'Desktop Browser'}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {formatDateTime(entry.viewedAt)} ({formatRelativeTime(entry.viewedAt)})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
