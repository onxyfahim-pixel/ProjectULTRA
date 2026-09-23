'use client';

import React, { useState } from 'react';
import { MessageSquare, Bell, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { CommunicationNotice } from '@/lib/types/modules';
import { MOCK_NOTICES } from '@/lib/db/modules-mock-data';

export function CommunicationPortalView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [notices, setNotices] = useState<CommunicationNotice[]>(MOCK_NOTICES);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMsg, setNewNoticeMsg] = useState('');

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle || !newNoticeMsg) return;

    const newObj: CommunicationNotice = {
      id: `ntc-${Date.now()}`,
      noticeNumber: `QA-ALRT-2026-${Math.floor(Math.random() * 90 + 10)}`,
      title: newNoticeTitle,
      urgency: 'HIGH_PRIORITY',
      author: 'Tanzim Ahmed (QA Manager)',
      targetDepartment: 'Cutting, Sewing & Finishing All Lines',
      publishedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      content: newNoticeMsg,
      isRead: false,
    };

    setNotices([newObj, ...notices]);
    setNewNoticeTitle('');
    setNewNoticeMsg('');
  };

  const urgentCount = notices.filter((n) => n.urgency === 'HIGH_PRIORITY').length;

  const columns: ColumnDef<CommunicationNotice>[] = [
    {
      key: 'noticeNumber',
      header: 'Notice Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
          {item.noticeNumber}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Bulletin Title & Department',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
          <div className="text-[11px] text-slate-500">{item.targetDepartment}</div>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Notice Content',
      render: (item) => (
        <p className="text-xs text-slate-600 truncate max-w-sm" title={item.content}>
          {item.content}
        </p>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency',
      sortable: true,
      align: 'center',
      render: (item) => {
        const variantMap: Record<string, string> = {
          HIGH_PRIORITY: 'rose',
          STANDARD: 'blue',
          INFO: 'emerald',
        };
        return (
          <StatusBadge
            label={item.urgency.replace('_', ' ')}
            variant={variantMap[item.urgency] || 'neutral'}
          />
        );
      },
    },
    {
      key: 'publishedDate',
      header: 'Published Date',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-slate-700">{item.publishedDate}</span>
      ),
    },
    {
      key: 'author',
      header: 'Author / Origin',
      render: (item) => (
        <span className="text-xs font-medium text-slate-800">{item.author}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="communication-portal-module"
        moduleCode="MOD-30"
        badge="Plant Bulletin & Floor Alerts"
        title="Quality Bulletin & Communications Log"
        subtitle="Flash quality alerts, needle policy updates, shade alerts, and mandatory floor supervisor acknowledgments"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${notices.length} Bulletins`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Bulletins"
              value={notices.length}
              subtitle="Plant-Wide Quality Alerts"
              icon={<Bell className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Floor Read Status"
              value="94.2%"
              subtitle="Supervisors Acknowledged"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Urgent Alerts"
              value={urgentCount}
              subtitle="Immediate Floor Actions"
              icon={<AlertTriangle className="w-5 h-5" />}
              tone="rose"
            />
            <StatCard
              title="Avg Broadcast Speed"
              value="Instant"
              subtitle="Floor Kiosks & Mobile App"
              icon={<MessageSquare className="w-5 h-5" />}
              tone="indigo"
            />
          </div>

          {/* Broadcast Flash Alert Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Broadcast Immediate Quality Flash Bulletin to Floor
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Instant push notification and floor kiosk alert sent to Line Supervisors, QA Staff, and Cutting Leads.
            </p>

            <form onSubmit={handlePostNotice} className="space-y-3">
              <input
                type="text"
                value={newNoticeTitle}
                onChange={(e) => setNewNoticeTitle(e.target.value)}
                placeholder="Bulletin Title (e.g. Critical Shade Banding Alert on Style HM-8829)"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoticeMsg}
                  onChange={(e) => setNewNoticeMsg(e.target.value)}
                  placeholder="Immediate floor action instructions / mandatory containment steps..."
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Broadcast Alert
                </button>
              </div>
            </form>
          </div>

          {/* Recent Urgent Bulletins Preview */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Active Floor Bulletins &amp; Advisories
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{notices.length} notices posted</span>
            </div>
            <div className="space-y-2">
              {notices.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{n.noticeNumber}</span>
                      <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{n.content}</p>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {n.targetDepartment} • By: {n.author} • {n.publishedDate}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                    n.urgency === 'HIGH_PRIORITY' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {n.urgency.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete Quality Bulletin & Communications Log"
            recordCount={notices.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="communication-notices-table"
            title="Quality Bulletin & Communications Log"
            subtitle="Flash quality alerts, needle policy updates, shade alerts, and mandatory floor supervisor acknowledgments"
            data={notices}
            columns={columns}
            searchPlaceholder="Search bulletin title, author, or department..."
            searchableKeys={['noticeNumber', 'title', 'author', 'targetDepartment', 'content']}
          />
        </div>
      )}
    </div>
  );
}
