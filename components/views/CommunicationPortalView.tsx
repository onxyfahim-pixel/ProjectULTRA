'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Bell,
  AlertTriangle,
  Send,
  CheckCircle2,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Search,
  Filter,
  Users,
  ShieldCheck,
  FileText,
  Clock,
  Pin,
  Building2,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, ModuleViewMode } from '@/components/ui/ModuleHeader';
import {
  CommunicationNotice,
  NoticeCategory,
  NoticeUrgency,
  NoticeStatus,
} from '@/lib/types/modules';
import {
  INITIAL_NOTICES,
  NOTICE_CATEGORY_CONFIG,
  NOTICE_URGENCY_CONFIG,
  FACTORY_DEPARTMENTS,
} from '../modules/communication/communication-data';
import { NoticeDetailsPage } from '../modules/communication/NoticeDetailsPage';
import { NoticeEntryPage } from '../modules/communication/NoticeEntryPage';
import { DeleteNoticeModal } from '../modules/communication/DeleteNoticeModal';

const STORAGE_KEY = 'erp_communication_notices_v1';

type SubView =
  | { type: 'none' }
  | { type: 'details'; notice: CommunicationNotice }
  | { type: 'entry'; notice?: CommunicationNotice };

export function CommunicationPortalView() {
  const [activeTab, setActiveTab] = useState<'summary' | 'list' | 'acknowledgments'>('summary');
  const [notices, setNotices] = useState<CommunicationNotice[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.error('Error loading notices from localStorage:', err);
      }
    }
    return INITIAL_NOTICES;
  });

  const [subView, setSubView] = useState<SubView>({ type: 'none' });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    notices: CommunicationNotice[];
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
    } catch (err) {
      console.error('Failed to save notices to localStorage:', err);
    }
  }, [notices]);

  // Keep details page synced if notice changes
  useEffect(() => {
    if (subView.type === 'details') {
      const fresh = notices.find((n) => n.id === subView.notice.id);
      if (fresh && fresh !== subView.notice) {
        setSubView({ type: 'details', notice: fresh });
      }
    }
  }, [notices, subView]);

  // Quick Duplicate Handler
  const handleDuplicate = (notice: CommunicationNotice) => {
    const duplicated: CommunicationNotice = {
      ...notice,
      id: `ntc-dup-${Date.now()}`,
      noticeNumber: `${notice.noticeNumber}-REV`,
      title: `${notice.title} (Copy)`,
      publishedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isRead: false,
      acknowledgedCount: 0,
      acknowledgments: [],
      comments: [],
    };
    setNotices([duplicated, ...notices]);
    showToast(`Duplicated notice as ${duplicated.noticeNumber}`);
  };

  // Save / Update Notice from Entry Page
  const handleSaveNotice = (saved: CommunicationNotice) => {
    const exists = notices.some((n) => n.id === saved.id);
    if (exists) {
      setNotices(notices.map((n) => (n.id === saved.id ? saved : n)));
      showToast(`Updated notice ${saved.noticeNumber}`);
    } else {
      setNotices([saved, ...notices]);
      showToast(`Broadcasted new bulletin ${saved.noticeNumber}`);
    }
    setSubView({ type: 'none' });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!deleteModal || deleteModal.notices.length === 0) return;
    const deleteIds = new Set(deleteModal.notices.map((n) => n.id));
    setNotices((prev) => prev.filter((n) => !deleteIds.has(n.id)));

    if (subView.type === 'details' && deleteIds.has(subView.notice.id)) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.notices.length;
    showToast(
      count === 1
        ? `Deleted bulletin ${deleteModal.notices[0].noticeNumber}`
        : `Deleted ${count} bulletins successfully`
    );
    setDeleteModal(null);
  };

  // KPI Calculations
  const urgentCount = notices.filter((n) => n.urgency === 'HIGH_PRIORITY').length;
  const totalSignoffs = notices.reduce((acc, curr) => acc + (curr.acknowledgedCount || 0), 0);
  const totalTargetRecipients = notices.reduce(
    (acc, curr) => acc + (curr.totalRecipientsCount || 20),
    0
  );
  const overallComplianceRate = totalTargetRecipients
    ? Math.round((totalSignoffs / totalTargetRecipients) * 100)
    : 0;

  // Filtered Notices
  const filteredNotices = notices.filter((n) => {
    const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
    const matchesUrgency = selectedUrgency === 'ALL' || n.urgency === selectedUrgency;
    const matchesDept = selectedDept === 'ALL' || n.targetDepartment.includes(selectedDept);
    const matchesSearch =
      searchQuery === '' ||
      n.noticeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.targetDepartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.buyerRef && n.buyerRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.styleRef && n.styleRef.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesUrgency && matchesDept && matchesSearch;
  });

  // Table Column Definitions with Truncated Subtext to Eliminate Horizontal Scroll
  const columns: ColumnDef<CommunicationNotice>[] = [
    {
      key: 'noticeNumber',
      header: 'Code & Type',
      sortable: true,
      accessor: (n) => n.noticeNumber,
      cell: (row) => {
        const catCfg =
          (row.category && NOTICE_CATEGORY_CONFIG[row.category]) ||
          NOTICE_CATEGORY_CONFIG.QUALITY_FLASH;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {row.noticeNumber}
              </span>
              {row.pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
            </div>
            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}>
              {catCfg.label}
            </div>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Subject & Mandatory Action',
      sortable: true,
      accessor: (n) => n.title,
      cell: (row) => (
        <div className="max-w-[340px]">
          <div
            onClick={() => setSubView({ type: 'details', notice: row })}
            className="font-semibold text-slate-900 text-xs hover:text-blue-600 cursor-pointer line-clamp-1"
            title={row.title}
          >
            {row.title}
          </div>
          {row.actionRequired ? (
            <div className="text-[11px] text-amber-800 line-clamp-1 mt-0.5 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="truncate">{row.actionRequired}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{row.content}</div>
          )}
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Publisher & Scope',
      sortable: true,
      accessor: (n) => n.author,
      cell: (row) => (
        <div className="text-xs space-y-0.5 max-w-[200px]">
          <div className="font-semibold text-slate-900 truncate">{row.author}</div>
          <div className="text-[11px] text-slate-500 truncate" title={row.targetDepartment}>
            {row.targetDepartment}
          </div>
        </div>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency & Date',
      sortable: true,
      accessor: (n) => n.urgency,
      cell: (row) => {
        const urgCfg = NOTICE_URGENCY_CONFIG[row.urgency];
        return (
          <div className="space-y-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                row.urgency === 'HIGH_PRIORITY'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : row.urgency === 'STANDARD'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {urgCfg.label.split(' ')[0]}
            </span>
            <div className="text-[10px] font-mono text-slate-400">
              {row.publishedDate.split(' ')[0]}
            </div>
          </div>
        );
      },
    },
    {
      key: 'acknowledgments',
      header: 'Sign-off Rate',
      sortable: true,
      accessor: (n) => n.acknowledgedCount || 0,
      cell: (row) => {
        const total = row.totalRecipientsCount || 20;
        const count = row.acknowledgedCount || 0;
        const pct = Math.round((count / Math.max(total, 1)) * 100);
        return (
          <div className="space-y-1 w-28">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>{count}/{total}</span>
              <span className="font-bold text-slate-900">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', notice: row })}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="View Full Notice & Sign-offs"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSubView({ type: 'entry', notice: row })}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Bulletin"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDuplicate(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate Bulletin"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, notices: [row] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Bulletin"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<CommunicationNotice>[] = [
    {
      label: 'Delete Selected',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      variant: 'danger',
      onClick: (selectedItems: CommunicationNotice[]) => {
        setDeleteModal({ isOpen: true, notices: selectedItems });
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Clean 3-tab layout matching Buyer & Order Module */}
      <ModuleHeader
        title="Quality Bulletin & Communications Log"
        activeView={subView.type !== 'none' ? 'list' : activeTab}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setActiveTab(mode as 'summary' | 'list' | 'acknowledgments');
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Bulletins Log', count: notices.length },
          { id: 'acknowledgments', label: 'Floor Sign-offs & Advisories', count: totalSignoffs },
        ]}
      />

      {/* SEPARATE FULL SUB-PAGES */}
      {subView.type === 'details' && (
        <NoticeDetailsPage
          notice={subView.notice}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(n) => setSubView({ type: 'entry', notice: n })}
          onDuplicate={handleDuplicate}
          onDelete={(n) => setDeleteModal({ isOpen: true, notices: [n] })}
          onUpdateNotice={(updated) => {
            setNotices((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
          }}
          showToast={showToast}
        />
      )}

      {subView.type === 'entry' && (
        <NoticeEntryPage
          initialNotice={subView.notice}
          onBack={() => setSubView({ type: 'none' })}
          onSave={handleSaveNotice}
          showToast={showToast}
        />
      )}

      {/* MAIN VIEW: SUMMARY */}
      {subView.type === 'none' && activeTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 4 StatCards matching Buyer & Order Tone Styling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Bulletins"
              value={notices.length}
              subtitle="Plant-Wide Quality Alerts"
              icon={<Bell className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Floor Sign-off Rate"
              value={`${overallComplianceRate}%`}
              subtitle={`${totalSignoffs} of ${totalTargetRecipients} Acknowledged`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Critical Flashes"
              value={urgentCount}
              subtitle="Immediate Floor Actions Required"
              icon={<AlertTriangle className="w-5 h-5" />}
              tone="rose"
            />
            <StatCard
              title="Broadcast Speed"
              value="Instant"
              subtitle="Floor Kiosks & Supervisor Tablets"
              icon={<MessageSquare className="w-5 h-5" />}
              tone="indigo"
            />
          </div>

          {/* Quick Broadcast Action Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Central Quality Broadcast Center
              </span>
              <h2 className="text-lg font-bold text-white">
                Dispatch Real-time Quality Alerts to Sewing, Cutting &amp; Finishing
              </h2>
              <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
                Send critical shade alerts, buyer technical pack updates, needle control policies, and audit notices to floor kiosks in seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubView({ type: 'entry' })}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Broadcast Notice</span>
            </button>
          </div>

          {/* Urgent Bulletins Feed & Department Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Urgent Quality Bulletins (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Active Floor Quality Alerts &amp; Critical Circulars
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  View All ({notices.length}) →
                </button>
              </div>

              <div className="space-y-2.5">
                {notices.slice(0, 4).map((n) => {
                  const catCfg =
                    (n.category && NOTICE_CATEGORY_CONFIG[n.category]) ||
                    NOTICE_CATEGORY_CONFIG.QUALITY_FLASH;
                  return (
                    <div
                      key={n.id}
                      onClick={() => setSubView({ type: 'details', notice: n })}
                      className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors cursor-pointer flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-blue-700">
                            {n.noticeNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{n.title}</span>
                          {n.pinned && (
                            <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">{n.content}</p>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3 pt-1">
                          <span>{n.targetDepartment}</span>
                          <span>•</span>
                          <span>By: {n.author}</span>
                          <span>•</span>
                          <span>{n.publishedDate}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            n.urgency === 'HIGH_PRIORITY'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {n.urgency.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {n.acknowledgedCount || 0} signed off
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Breakdown & Classification (1 col) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Category Distribution
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {Object.entries(NOTICE_CATEGORY_CONFIG).map(([key, cfg]) => {
                  const count = notices.filter((n) => n.category === key).length;
                  return (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                Click any category in the Bulletins Log tab to filter broadcasts by department or buyer.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW: BULLETINS LOG (TABLE FIT, ZERO HORIZONTAL SCROLL) */}
      {subView.type === 'none' && activeTab === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top Filter & Action Bar matching Buyer & Order */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bulletin code, subject, department, or author..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Categories</option>
                {Object.entries(NOTICE_CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>

              {/* Urgency Filter */}
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ALL">All Urgencies</option>
                <option value="HIGH_PRIORITY">High Priority</option>
                <option value="STANDARD">Standard</option>
                <option value="INFO">Informational</option>
              </select>

              {/* Primary + Broadcast Button styled like Buyer & Order */}
              <button
                type="button"
                onClick={() => setSubView({ type: 'entry' })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Broadcast Notice</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            id="bulletins-log-table"
            title="Quality Bulletin & Communications Log"
            subtitle={`${filteredNotices.length} Active Circulars, Containment Advisories & Commendations`}
            data={filteredNotices}
            columns={columns}
            batchActions={batchActions}
            emptyMessage="No notices matching selected filters."
          />
        </div>
      )}

      {/* MAIN VIEW: FLOOR SIGN-OFFS & ADVISORIES */}
      {subView.type === 'none' && activeTab === 'acknowledgments' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Floor Supervisor Digital Sign-off &amp; Compliance Audit Roster
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aggregated sign-offs across all quality alerts, WRAP mandates, and buyer tech advisories
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubView({ type: 'entry' })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Broadcast Notice</span>
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {notices.map((n) => {
                const acks = n.acknowledgments || [];
                const total = n.totalRecipientsCount || 20;
                const pct = Math.round((acks.length / Math.max(total, 1)) * 100);
                return (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                          {n.noticeNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{n.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600">
                          {acks.length} / {total} Verified ({pct}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => setSubView({ type: 'details', notice: n })}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>

                    {acks.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                        {acks.map((ack) => (
                          <div
                            key={ack.id}
                            className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {ack.userName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {ack.acknowledgedAt.split(' ')[0]}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {ack.userRole} • {ack.department}
                            </div>
                            {ack.actionTakenNotes && (
                              <div className="text-[10px] text-slate-700 italic truncate" title={ack.actionTakenNotes}>
                                "{ack.actionTakenNotes}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        No sign-offs recorded yet for this circular.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteNoticeModal
        isOpen={!!deleteModal?.isOpen}
        notices={deleteModal?.notices || []}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
