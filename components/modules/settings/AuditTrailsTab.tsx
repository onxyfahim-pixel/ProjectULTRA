'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Activity,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Sparkles,
  GitCommit,
  ArrowRight,
  Clock,
  Layers,
  Building2,
  Check,
  FileText,
} from 'lucide-react';
import { AuditLog, RecordChangeDiff } from '@/lib/types/erp';
import {
  getStoredAuditLogs,
  exportAuditLogsToCsv,
  AUDIT_LOGS_UPDATED_EVENT,
} from '@/lib/services/audit-trail-service';

export function AuditTrailsTab() {
  const [logs, setLogs] = useState<AuditLog[]>(() => getStoredAuditLogs());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Fetch audit logs from backend REST API or fallback to localStorage
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs) && data.logs.length > 0) {
          // Merge API logs with local stored logs for completeness
          const local = getStoredAuditLogs();
          const map = new Map<string, AuditLog>();
          data.logs.forEach((l: AuditLog) => map.set(l.id, l));
          local.forEach((l: AuditLog) => {
            if (!map.has(l.id)) map.set(l.id, l);
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setLogs(merged);
        } else {
          setLogs(getStoredAuditLogs());
        }
      } else {
        setLogs(getStoredAuditLogs());
      }
    } catch {
      setLogs(getStoredAuditLogs());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Listen for live updates across ERP modules and tabs
    const handleUpdate = () => {
      setLogs(getStoredAuditLogs());
    };

    window.addEventListener(AUDIT_LOGS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(AUDIT_LOGS_UPDATED_EVENT, handleUpdate);
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Module filter
      let matchesModule = true;
      if (moduleFilter !== 'ALL') {
        const ent = (log.entity || '').toUpperCase();
        const mod = (log.moduleName || '').toUpperCase();
        if (moduleFilter === 'BUYER_ORDER') {
          matchesModule = ent.includes('ORDER') || mod.includes('ORDER') || mod.includes('BUYER');
        } else if (moduleFilter === 'PRODUCTION') {
          matchesModule = ent.includes('PRODUCTION') || mod.includes('PRODUCTION') || ent.includes('FLOOR');
        } else if (moduleFilter === 'INSPECTION') {
          matchesModule = ent.includes('INSPECTION') || mod.includes('INSPECTION') || ent.includes('QMS');
        } else if (moduleFilter === 'INVENTORY') {
          matchesModule = ent.includes('INVENTORY') || mod.includes('INVENTORY') || mod.includes('STOCK');
        } else if (moduleFilter === 'CAPA') {
          matchesModule = ent.includes('CAPA') || mod.includes('CAPA');
        } else if (moduleFilter === 'AUDIT') {
          matchesModule = ent.includes('AUDIT') || mod.includes('AUDIT');
        } else if (moduleFilter === 'VIEWS') {
          matchesModule = log.action === 'VIEW';
        } else if (moduleFilter === 'SYSTEM') {
          matchesModule = ent.includes('USER') || ent.includes('SYSTEM') || ent.includes('AUTH');
        } else {
          matchesModule = mod.includes(moduleFilter.toUpperCase()) || ent.includes(moduleFilter.toUpperCase());
        }
      }

      // 2. Action filter
      let matchesAction = true;
      if (actionFilter !== 'ALL') {
        matchesAction = log.action.toUpperCase() === actionFilter.toUpperCase();
      }

      // 3. Search query
      const q = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (q) {
        matchesSearch = Boolean(
          log.action.toLowerCase().includes(q) ||
          log.entity.toLowerCase().includes(q) ||
          (log.entityCode && log.entityCode.toLowerCase().includes(q)) ||
          log.entityId.toLowerCase().includes(q) ||
          (log.moduleName && log.moduleName.toLowerCase().includes(q)) ||
          log.performedBy.toLowerCase().includes(q) ||
          (log.userRole && String(log.userRole).toLowerCase().includes(q)) ||
          (log.details && log.details.toLowerCase().includes(q))
        );
      }

      return matchesModule && matchesAction && matchesSearch;
    });
  }, [logs, moduleFilter, actionFilter, searchQuery]);

  // Pagination
  const pageSize = 10;
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage]);

  // Export CSV
  const handleExportCsv = () => {
    try {
      const csv = exportAuditLogsToCsv(filteredLogs);
      const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Enterprise_Audit_Trails_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportNotice('Audit trail exported successfully! Downloaded comprehensive security dossier.');
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      setExportNotice('Failed generating CSV.');
    }
  };

  const getActionBadgeColor = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('DELETE') || a.includes('REJECT') || a.includes('REVOKE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (a.includes('UPDATE') || a.includes('ADJUST') || a.includes('CHANGE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (a.includes('LOGIN') || a.includes('SIGN_OFF') || a.includes('APPROVE') || a.includes('CREATE') || a.includes('PASSED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (a.includes('VIEW')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200/60 dark:border-indigo-900/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Enterprise Central Audit Trails &amp; Change Forensics
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                FULL ERP SYNC ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chronological log of creators, editors, field diffs, quality sign-offs, and view impressions across all 30 ERP modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search user, action, entity, field diffs..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'VIEW', 'DELETE'].map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => {
                  setActionFilter(act);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  actionFilter === act
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {act === 'ALL' ? 'All Actions' : act.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Module Category Selector & Specific Module Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Modules' },
              { id: 'BUYER_ORDER', label: 'Buyer Orders' },
              { id: 'PRODUCTION', label: 'Production' },
              { id: 'INSPECTION', label: 'Inspections' },
              { id: 'INVENTORY', label: 'Inventory' },
              { id: 'CAPA', label: 'CAPA 8D' },
              { id: 'AUDIT', label: 'Audits' },
              { id: 'VIEWS', label: 'Views Log' },
              { id: 'SYSTEM', label: 'Auth & System' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setModuleFilter(cat.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  moduleFilter === cat.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Filter Specific Module:</span>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              <option value="ALL">-- All 33 Modules --</option>
              <option value="BUYER">Buyer Order Management</option>
              <option value="PRODUCTION">Production Operations & Sewing</option>
              <option value="INSPECTION">Quality Inspections</option>
              <option value="INVENTORY">Warehouse Inventory</option>
              <option value="CAPA">CAPA & 8D Actions</option>
              <option value="AUDIT">Quality Audits</option>
              <option value="COMPLAINT">Customer Complaints</option>
              <option value="SUPPLIER">Sub-Suppliers & Mills</option>
              <option value="DEFECT">Defects Library</option>
              <option value="CALIBRATION">Equipment Calibration</option>
              <option value="CERTIFICATE">Compliance Certificates</option>
              <option value="COMMUNICATION">Notices & Communication</option>
              <option value="DOCUMENT CONTROL">Document Control & ISO</option>
              <option value="EVENT">Company Events & Audits</option>
              <option value="INCOMING">Incoming QC</option>
              <option value="JOB">Job Descriptions</option>
              <option value="KPI">KPI Management</option>
              <option value="MEETING">Meeting Minutes</option>
              <option value="ORGANOGRAM">Factory Organogram</option>
              <option value="PLANNING">Planning & IE</option>
              <option value="PROCEDURE">Standard Procedures</option>
              <option value="PROCESS FLOW">Process Engineering Flows</option>
              <option value="GOAL">Quality Objectives & Goals</option>
              <option value="MANUAL">Quality Manual</option>
              <option value="REPORT">Reports & Analytics</option>
              <option value="RISK">Style Risk Assessment</option>
              <option value="ROOT CAUSE">Root Cause Analysis</option>
              <option value="SOP">Standard Operating Procedures</option>
              <option value="TESTING">Lab Testing & Fabric Tests</option>
              <option value="TEXPEDIA">Texpedia Knowledge Base</option>
              <option value="TRACEABILITY">Batch Traceability</option>
              <option value="TRAINING">Training & Skill Matrix</option>
              <option value="SYSTEM">Auth & System Settings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 bg-slate-50/60 dark:bg-slate-800/40">
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Module &amp; Entity</th>
                <th className="py-3 px-4">Actor / Role</th>
                <th className="py-3 px-4">Audit Details / What Changed</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      <div>{new Date(log.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 dark:text-white font-bold">{log.moduleName || log.entity}</span>
                      </div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                        {log.entityCode || log.entityId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{log.performedBy}</span>
                      </div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold pl-4.5">
                        {log.userRole}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      <div className="truncate font-medium">{log.details || 'System operation executed.'}</div>
                      {log.changes && log.changes.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                          <GitCommit className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate">
                            {log.changes
                              .slice(0, 2)
                              .map((c) => `${c.fieldLabel || c.field}: ${c.oldValue ?? 'None'} → ${c.newValue}`)
                              .join('; ')}
                            {log.changes.length > 2 ? ` (+${log.changes.length - 2} more)` : ''}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer"
                        title="View Full Changes"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            Showing <strong className="text-slate-900 dark:text-white">{filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> -{' '}
            <strong className="text-slate-900 dark:text-white">
              {Math.min(currentPage * pageSize, filteredLogs.length)}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-white">{filteredLogs.length}</strong> activities
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* INSPECT LOG MODAL: DETAILED FIELD DIFFS & SECURITY INFORMATION */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Audit Event &amp; Change Inspector
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Log ID: {selectedLog.id}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Action Event</span>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getActionBadgeColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Timestamp</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200 mt-1">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Target Entity</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">
                    {selectedLog.moduleName || selectedLog.entity} ({selectedLog.entityCode || selectedLog.entityId})
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Performed By</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                    <span>{selectedLog.performedBy}</span>
                    <span className="text-[10px] text-indigo-600 font-normal">({selectedLog.userRole})</span>
                  </div>
                </div>
              </div>

              {/* Event Details Narrative */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Event Narrative / Details
                </span>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {selectedLog.details || 'System operation executed.'}
                </div>
              </div>

              {/* Field Changes Diff (What Changed) */}
              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Exact Field Changes (Diff)
                  </span>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                          <th className="p-2.5">Field</th>
                          <th className="p-2.5">Before</th>
                          <th className="p-2.5">After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {selectedLog.changes.map((c, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                              {c.fieldLabel || c.field}
                            </td>
                            <td className="p-2.5 text-rose-600 line-through">
                              {c.oldValue !== null && c.oldValue !== undefined ? String(c.oldValue) : 'None'}
                            </td>
                            <td className="p-2.5 text-emerald-600 font-bold">
                              {String(c.newValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Additional Metadata JSON if present */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Security Metadata
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
