'use client';

import React, { useState } from 'react';
import {
  Layers,
  Code2,
  CheckCircle2,
  TableProperties,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Copy,
  Sparkles,
  Smartphone,
  Monitor,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatusBadge, GradeBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';

interface DemoItem {
  id: string;
  code: string;
  moduleName: string;
  department: string;
  status: string;
  complianceRate: number;
}

export function StandardsView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [copied, setCopied] = useState(false);

  // Mock data illustrating how any future module uses this standard
  const demoItems: DemoItem[] = [
    {
      id: 'm-1',
      code: 'MOD-CUT-01',
      moduleName: 'Cutting & CAD Spreading Room',
      department: 'Cutting Operations',
      status: 'IN_STOCK',
      complianceRate: 98.4,
    },
    {
      id: 'm-2',
      code: 'MOD-DYE-02',
      moduleName: 'Washing & Dyeing Laboratory',
      department: 'Wet Processing',
      status: 'INSPECTING',
      complianceRate: 94.2,
    },
    {
      id: 'm-3',
      code: 'MOD-EMB-03',
      moduleName: 'Embroidery & Screen Printing',
      department: 'Value Added Services',
      status: 'PASSED',
      complianceRate: 99.1,
    },
    {
      id: 'm-4',
      code: 'MOD-LOG-04',
      moduleName: 'Container Packing & Export Shipping',
      department: 'Logistics',
      status: 'ALLOCATED',
      complianceRate: 96.7,
    },
  ];

  const columns: ColumnDef<DemoItem>[] = [
    {
      key: 'code',
      header: 'Module Code',
      sortable: true,
      render: (i) => <span className="font-mono font-bold text-blue-700">{i.code}</span>,
    },
    {
      key: 'moduleName',
      header: 'Module Spec',
      sortable: true,
      render: (i) => <span className="font-semibold text-slate-900">{i.moduleName}</span>,
    },
    {
      key: 'department',
      header: 'Factory Department',
      sortable: true,
      filterOptions: [
        { label: 'Cutting Operations', value: 'Cutting Operations' },
        { label: 'Wet Processing', value: 'Wet Processing' },
        { label: 'Value Added Services', value: 'Value Added Services' },
        { label: 'Logistics', value: 'Logistics' },
      ],
      render: (i) => <span className="text-slate-600">{i.department}</span>,
    },
    {
      key: 'complianceRate',
      header: 'Standard Compliance',
      sortable: true,
      align: 'right',
      render: (i) => (
        <span className="font-mono font-bold text-emerald-700">{i.complianceRate}%</span>
      ),
    },
    {
      key: 'status',
      header: 'Standard Status',
      sortable: true,
      filterOptions: [
        { label: 'Active (Passed)', value: 'PASSED' },
        { label: 'In Stock', value: 'IN_STOCK' },
        { label: 'Auditing', value: 'INSPECTING' },
      ],
      render: (i) => <StatusBadge status={i.status} />,
    },
  ];

  const codeSnippet = `// Standard Pattern for Future Modules
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';

export function MyNewFutureModule({ data }) {
  const columns: ColumnDef<MyEntity>[] = [
    { key: 'code', header: 'Record Code', sortable: true },
    { 
      key: 'status', 
      header: 'Status', 
      sortable: true, 
      filterOptions: [{ label: 'Passed', value: 'PASSED' }] 
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Standard Module Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">...</div>

      {/* 2. Standard Responsive DataTable */}
      <DataTable
        id="my-future-module-table"
        title="My Module Registry"
        data={data}
        columns={columns}
        searchPlaceholder="Filter records..."
      />
    </div>
  );
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="standards-module"
        moduleCode="DEV-STD"
        badge="Enterprise Design System"
        title="Future Module Standard & UI Architecture"
        subtitle="A unified architectural specification ensuring identical look-and-feel, table controls, and responsive styling across all modules"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 Pillars"
        listCount={`${demoItems.length} Instances`}
        actions={
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Boilerplate!' : 'Copy Module Template'}</span>
          </button>
        }
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Design System"
              value="Tailwind 4"
              subtitle="Semantic Slate & Blue Palette"
              icon={<Layers className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Framework Target"
              value="Next.js 15"
              subtitle="React 19 Server/Client Hybrid"
              icon={<Cpu className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="UI Standard"
              value="Unified Views"
              subtitle="Dedicated Summary & List Toggles"
              icon={<ShieldCheck className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Responsiveness"
              value="100% Fluid"
              subtitle="Mobile Drawer & Desktop Sidebar"
              icon={<Smartphone className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          {/* 4 Pillars of the Module Standard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Filter className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">1. Instant Filter Search</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Every table includes a unified search bar scanning across all relevant alphanumeric keys
                with reset filters button.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ArrowUpDown className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">2. Asc / Desc Sorting</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Every table column header supports three-state sorting (Ascending, Descending, Clear) with
                directional arrow indicators.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <TableProperties className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">3. Header Select Dropdowns</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Integrated dropdown selectors in column headers for categorical filters (Grades, Stages,
                Buyers, Locations) with item counts.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">4. Header Multi-Select</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Select-all checkbox in header with row checkboxes and sticky batch action toolbar for bulk
                approvals or CSV export.
              </p>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Interactive Standard Table & Code Architecture"
            recordCount={demoItems.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Interactive Standard Component Preview
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Responsive Mobile &amp; Desktop Tested</span>
                <Monitor className="w-3.5 h-3.5 ml-2" />
              </div>
            </div>

            <DataTable<DemoItem>
              id="standards-demo-table"
              title="Sample Future Module Instance"
              subtitle="Demonstrates the identical look-and-feel, table header controls, and multi-select behavior"
              data={demoItems}
              columns={columns}
              searchPlaceholder="Search module code, spec, or department..."
              defaultSortKey="code"
              defaultSortDirection="asc"
            />
          </div>

          {/* Code Snippet Box */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 text-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Standard Code Architecture for Future Modules
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                TypeScript / React 19
              </span>
            </div>
            <pre className="mt-3 text-[11px] font-mono leading-relaxed overflow-x-auto text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200">
              {codeSnippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
