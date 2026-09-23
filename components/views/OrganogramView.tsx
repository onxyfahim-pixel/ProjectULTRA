'use client';

import React, { useState } from 'react';
import { Users, UserCheck, Shield, ChevronDown, Network, Mail, Award } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { MOCK_ORGANOGRAM } from '@/lib/db/modules-mock-data';
import { OrganogramNode } from '@/lib/types/modules';

export function OrganogramView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [nodes] = useState<OrganogramNode[]>(MOCK_ORGANOGRAM);

  const totalHeadcount = nodes.reduce((sum, n) => sum + n.headcount, 0);

  const topNode = nodes.find((n) => !n.reportsToId);
  const secondTier = nodes.filter((n) => n.reportsToId === topNode?.id);
  const thirdTier = nodes.filter((n) => secondTier.some((st) => st.id === n.reportsToId));

  const columns: ColumnDef<OrganogramNode>[] = [
    {
      key: 'grade',
      header: 'Level / Grade',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-100">
          {item.grade}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Leader Name & Email',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{item.name}</span>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-slate-400" /> {item.email}
          </div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Designation & Title',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-medium text-slate-800">{item.title}</span>
      ),
    },
    {
      key: 'department',
      header: 'Department / Division',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
          {item.department}
        </span>
      ),
    },
    {
      key: 'headcount',
      header: 'Direct & Indirect Headcount',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
          {item.headcount} Staff
        </span>
      ),
    },
    {
      key: 'reportsToId',
      header: 'Reporting Superior',
      render: (item) => {
        const superior = nodes.find((n) => n.id === item.reportsToId);
        return (
          <span className="text-xs text-slate-600">
            {superior ? superior.name : 'Executive Board / CEO'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="organogram-module"
        moduleCode="MOD-24"
        badge="Governance & Org Chart"
        title="Quality Assurance & Operations Organizational Chart (Organogram)"
        subtitle="Hierarchical reporting structure from VP Operations down to Specialized Quality Leads and Laboratory Technologists"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${nodes.length} Key Roles`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Factory QA Division"
              value={nodes.length}
              subtitle="Key Leadership Nodes"
              icon={<Users className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Total QA Headcount"
              value={`${nodes.find((n) => n.id === 'org-2')?.headcount || 65} Staff`}
              subtitle="In-Line & Lab Inspectors"
              icon={<UserCheck className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Executive Reporting"
              value="Direct to VP"
              subtitle="Autonomous Quality Role"
              icon={<Shield className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Inspector-to-Operator"
              value="1 : 8 Ratio"
              subtitle="High Sampling Density"
              icon={<ChevronDown className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          {/* Visual Hierarchy Tree */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-0.5">
                  Visual Reporting Hierarchy
                </h2>
                <p className="text-xs text-slate-500">
                  Autonomous quality line reporting directly to Executive Management
                </p>
              </div>
              <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 font-semibold">
                ISO 9001 Clause 5.3 Compliant
              </span>
            </div>

            {/* Tier 1: Executive Top Node */}
            {topNode && (
              <div className="flex justify-center mb-6">
                <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-xs border-2 border-blue-500 text-center max-w-sm w-full">
                  <span className="text-[10px] font-mono text-blue-600 font-semibold uppercase tracking-wider block">
                    {topNode.grade} • {topNode.department}
                  </span>
                  <h3 className="text-sm font-bold mt-1 text-slate-900">{topNode.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{topNode.title}</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                    {topNode.email} • Total Org: {topNode.headcount}
                  </div>
                </div>
              </div>
            )}

            <div className="w-0.5 h-6 bg-slate-300 mx-auto -mt-6 mb-6" />

            {/* Tier 2: Department Heads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
              {secondTier.map((node) => (
                <div key={node.id} className="bg-blue-50 border border-blue-200 p-4 rounded-2xl shadow-xs text-center">
                  <span className="text-[10px] font-mono text-blue-700 font-semibold uppercase tracking-wider block">
                    {node.grade} • {node.department}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{node.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{node.title}</p>
                  <div className="mt-2 pt-2 border-t border-blue-200 text-[10px] text-slate-500 font-mono">
                    Direct Reports: {node.headcount} QA Personnel
                  </div>
                </div>
              ))}
            </div>

            <div className="w-0.5 h-6 bg-slate-300 mx-auto -mt-6 mb-6" />

            {/* Tier 3: Quality Leads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {thirdTier.map((node) => (
                <div key={node.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-xs text-left">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    {node.department}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 mt-0.5">{node.name}</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">{node.title}</p>
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                    Team Size: {node.headcount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SwitchToListBanner
            label="Open Full QA Personnel Roster & Reporting Matrix"
            recordCount={nodes.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="organogram-table"
            title="Quality Assurance & Operations Organogram Master Roster"
            subtitle="Complete tabular list of designated leaders, grades, reporting lines, and headcount allocations"
            data={nodes}
            columns={columns}
            searchPlaceholder="Search leader name, department, title, or grade..."
            searchableKeys={['name', 'title', 'department', 'grade', 'email']}
          />
        </div>
      )}
    </div>
  );
}
