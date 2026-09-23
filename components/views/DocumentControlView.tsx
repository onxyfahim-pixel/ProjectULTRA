'use client';

import React, { useState } from 'react';
import { Files, FileText, CheckCircle2, Clock, Download, Eye, PieChart, CheckCircle } from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { ControlledDocument } from '@/lib/types/modules';
import { MOCK_CONTROLLED_DOCS } from '@/lib/db/modules-mock-data';

export function DocumentControlView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [docs, setDocs] = useState<ControlledDocument[]>(MOCK_CONTROLLED_DOCS);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeCount = docs.filter((d) => d.status === 'APPROVED_ACTIVE').length;
  const underRevisionCount = docs.filter((d) => d.status === 'UNDER_REVISION').length;
  const obsoleteCount = docs.filter((d) => d.status === 'OBSOLETE').length;

  const handleDownload = (title: string) => {
    setFeedback(`Controlled PDF with security watermark downloaded for: ${title}`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const columns: ColumnDef<ControlledDocument>[] = [
    {
      key: 'docNumber',
      header: 'Document #',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
          {item.docNumber}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Controlled Title',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
          <div className="text-[11px] text-slate-500">Approved By: {item.approvedBy}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Doc Category',
      sortable: true,
      filterOptions: [
        { label: 'Policy', value: 'POLICY' },
        { label: 'SOP', value: 'SOP' },
        { label: 'Work Instruction', value: 'WORK_INSTRUCTION' },
      ],
      render: (item) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
          {item.category.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'version',
      header: 'Current Revision',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          {item.version}
        </span>
      ),
    },
    {
      key: 'effectiveDate',
      header: 'Effective & Review Date',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-mono text-xs text-slate-800">{item.effectiveDate}</span>
          <div className="text-[10px] text-slate-500 font-mono">Next: {item.nextReviewDate}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => {
        const variantMap: Record<string, any> = {
          APPROVED_ACTIVE: 'emerald',
          UNDER_REVISION: 'amber',
          OBSOLETE: 'rose',
        };
        return <StatusBadge label={item.status.replace(/_/g, ' ')} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
    {
      key: 'actions',
      header: 'File',
      align: 'center',
      render: (item) => (
        <button
          onClick={() => handleDownload(item.title)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Download Controlled Document PDF"
        >
          <Download className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="document-control-module"
        moduleCode="MOD-22"
        badge="Document Management"
        title="Master Document Register (MDR) & Version Control"
        subtitle="Controlled policies, operational procedures, work instructions, and revision approval logs"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${docs.length} Controlled Docs`}
      />

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Controlled Documents"
              value={docs.length}
              subtitle="Master Document Register (MDR)"
              icon={<Files className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Active Approved"
              value={`${activeCount} / ${docs.length}`}
              subtitle="Current Revision in Use"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Revision Compliance"
              value="100%"
              subtitle="Annual Review Cycle"
              icon={<Clock className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="ISO 9001 Clause"
              value="Clause 7.5"
              subtitle="Documented Information"
              icon={<FileText className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Lifecycle &amp; Approval Status
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">ISO 9001</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Active Approved</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{activeCount}</div>
                  <span className="text-[10px] text-slate-500">Authorized in floor</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block">Under Revision</span>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-1">{underRevisionCount}</div>
                  <span className="text-[10px] text-slate-500">Pending sign-off</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] text-rose-700 font-semibold block">Obsolete</span>
                  <div className="text-lg font-bold font-mono text-rose-900 mt-1">{obsoleteCount}</div>
                  <span className="text-[10px] text-slate-500">Archived</span>
                </div>
              </div>
            </div>

            {/* Document Categories */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Category Breakdown
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Tiers</span>
              </div>
              <div className="space-y-2 text-xs">
                {['POLICY', 'SOP', 'WORK_INSTRUCTION'].map((cat) => {
                  const count = docs.filter((d) => d.category === cat).length;
                  return (
                    <div key={cat} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800 text-xs">{cat.replace(/_/g, ' ')}</span>
                      <span className="font-mono font-bold text-slate-700 text-xs">{count} documents</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Master Document Register (MDR) Table"
            recordCount={docs.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="document-control-table"
            title="Master Document Register (MDR) & Version Control"
            subtitle="Controlled policies, operational procedures, work instructions, and revision approval logs"
            data={docs}
            columns={columns}
            searchPlaceholder="Search document number, title, or category..."
            searchableKeys={['docNumber', 'title', 'category', 'approvedBy', 'version']}
          />
        </div>
      )}
    </div>
  );
}
