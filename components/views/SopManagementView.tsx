'use client';

import React, { useState } from 'react';
import { BookMarked, CheckCircle2, Clock, ListChecks, Eye, X, FileText, Layers } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { SopItem } from '@/lib/types/modules';
import { MOCK_SOPS } from '@/lib/db/modules-mock-data';

export function SopManagementView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [sops, setSops] = useState<SopItem[]>(MOCK_SOPS);
  const [selectedSop, setSelectedSop] = useState<SopItem | null>(null);

  const departments = Array.from(new Set(sops.map((s) => s.department)));
  const totalSteps = sops.reduce((sum, s) => sum + s.stepsCount, 0);

  const columns: ColumnDef<SopItem>[] = [
    {
      key: 'sopNumber',
      header: 'SOP Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
          {item.sopNumber}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Standard Operating Procedure Title',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
          <div className="text-[11px] text-slate-500 font-mono">Applicability: {item.applicability}</div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-xs text-slate-700">{item.department}</span>
      ),
    },
    {
      key: 'stepsCount',
      header: 'Step Count',
      sortable: true,
      align: 'center',
      render: (item) => (
        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          {item.stepsCount} Steps
        </span>
      ),
    },
    {
      key: 'revision',
      header: 'Revision',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">{item.revision}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => {
        const variantMap: Record<string, any> = {
          ACTIVE: 'emerald',
          DRAFT: 'amber',
          REVIEW_DUE: 'rose',
        };
        return <StatusBadge label={item.status} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
    {
      key: 'actions',
      header: 'View Steps',
      align: 'center',
      render: (item) => (
        <button
          onClick={() => setSelectedSop(item)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          title="View Step-by-Step SOP Work Breakdown"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="sop-management-module"
        moduleCode="MOD-28"
        badge="SOP Library"
        title="Standard Operating Procedures (SOP) Library"
        subtitle="Operational standards for 4-point fabric inspection, needle control, metal detection, and finishing compliance"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${sops.length} SOPs`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active SOPs"
              value={sops.length}
              subtitle="Factory Operating Rules"
              icon={<BookMarked className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Active Execution"
              value="100%"
              subtitle="Fully Audited on Floor"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Critical Safety SOPs"
              value="Needle / Metal"
              subtitle="Zero Contamination Rules"
              icon={<ListChecks className="w-5 h-5" />}
              tone="amber"
            />
            <StatCard
              title="Review Cycle"
              value="Annual"
              subtitle="Auditor Sign-off"
              icon={<Clock className="w-5 h-5" />}
              tone="indigo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Departmental SOP Coverage
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Coverage</span>
              </div>
              <div className="space-y-2">
                {departments.map((dept) => {
                  const deptSops = sops.filter((s) => s.department === dept);
                  return (
                    <div key={dept} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-xs font-semibold text-slate-900">{dept}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {deptSops.map((s) => s.sopNumber).join(', ')}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {deptSops.length} SOPs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Critical Compliance Protocols */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Key Procedures &amp; Purpose
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{totalSteps} Total Steps</span>
              </div>
              <div className="space-y-2">
                {sops.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-xl bg-emerald-50/30 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{s.sopNumber}</span>
                        <span className="text-[10px] text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                          {s.revision}
                        </span>
                      </div>
                      <span className="text-xs text-slate-700 font-medium block mt-0.5">{s.title}</span>
                    </div>
                    <button
                      onClick={() => setSelectedSop(s)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Standard Operating Procedures (SOP) Master Register"
            recordCount={sops.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="sop-management-table"
            title="Standard Operating Procedures (SOP) Management"
            subtitle="Standardized procedures for fabric 4-point inspection, needle control, and metal detection"
            data={sops}
            columns={columns}
            searchPlaceholder="Search SOP code, title, or department..."
            searchableKeys={['sopNumber', 'title', 'department', 'purpose', 'applicability']}
          />
        </div>
      )}

      {/* SOP Detail Modal */}
      {selectedSop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedSop.sopNumber} - {selectedSop.revision}</h3>
                <p className="text-xs text-slate-500 font-mono">Department: {selectedSop.department}</p>
              </div>
              <button
                onClick={() => setSelectedSop(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-900 block mb-1">Title:</span>
                <span className="font-medium text-slate-800">{selectedSop.title}</span>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <span className="font-semibold text-blue-900 block mb-1">Operational Purpose:</span>
                <p className="text-blue-800 leading-relaxed">{selectedSop.purpose}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-900 block mb-1">Applicability Scope:</span>
                <p className="text-slate-700 leading-relaxed">{selectedSop.applicability}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedSop(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close Procedure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
