'use client';

import React, { useState } from 'react';
import { ClipboardList, ShieldAlert, CheckCircle2, Sliders, ChevronRight, Layers, ShieldCheck } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { ProcedureItem } from '@/lib/types/modules';
import { MOCK_PROCEDURES } from '@/lib/db/modules-mock-data';

export function ProcedureView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [procedures] = useState<ProcedureItem[]>(MOCK_PROCEDURES);

  const stations = Array.from(new Set(procedures.map((p) => p.station)));

  const columns: ColumnDef<ProcedureItem>[] = [
    {
      key: 'procedureCode',
      header: 'Procedure Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
          {item.procedureCode}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Operational Procedure Title',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
          <div className="text-[11px] text-slate-500 font-mono">Station: {item.station.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      key: 'criticalCheckpoints',
      header: 'Critical Checkpoints & Gates',
      render: (item) => (
        <ul className="text-xs text-slate-700 space-y-0.5">
          {item.criticalCheckpoints.map((cp, idx) => (
            <li key={idx} className="flex items-start gap-1">
              <span className="text-blue-600 font-bold">•</span>
              <span>{cp}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'ppeRequirement',
      header: 'PPE Safety Requirement',
      render: (item) => (
        <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {item.ppeRequirement}
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
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="procedures-module"
        moduleCode="MOD-25"
        badge="Standard Operating Procedures"
        title="Standard Operational Procedures & Workstation Instructions"
        subtitle="Step-by-step manufacturing guidelines, required PPE, and critical quality checkpoints"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${procedures.length} Procedures`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Operational Procedures"
              value={procedures.length}
              subtitle="Floor Work Instructions"
              icon={<ClipboardList className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="PPE Enforcement"
              value="100% Mandatory"
              subtitle="Steel Mesh & Goggles"
              icon={<ShieldAlert className="w-5 h-5" />}
              tone="amber"
            />
            <StatCard
              title="Station Coverage"
              value="Spreading to Packing"
              subtitle="Full Garment Cycle"
              icon={<Sliders className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Operator Certification"
              value="Required"
              subtitle="Before Line Allocation"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manufacturing Station Coverage */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Floor Station Allocation
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Coverage</span>
              </div>
              <div className="space-y-2">
                {stations.map((st) => {
                  const stProcs = procedures.filter((p) => p.station === st);
                  return (
                    <div key={st} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-xs font-semibold text-slate-800">{st.replace(/_/g, ' ')}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {stProcs.map((p) => p.procedureCode).join(', ')}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {stProcs.length} WIs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Critical Safety & PPE Gates */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Mandatory PPE &amp; Safety Compliance
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">HSE Protocol</span>
              </div>
              <div className="space-y-2">
                {procedures.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900">{p.title}</span>
                      <div className="text-[10px] text-amber-800 font-mono mt-0.5">
                        PPE: {p.ppeRequirement}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      Rev {p.revision}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Standard Work Instruction & Procedure Register"
            recordCount={procedures.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="procedures-table"
            title="Standard Operational Procedures & Workstation Instructions"
            subtitle="Step-by-step manufacturing guidelines, required PPE, and critical quality checkpoints"
            data={procedures}
            columns={columns}
            searchPlaceholder="Search procedure code, station, or checkpoints..."
            searchableKeys={['procedureCode', 'title', 'station', 'ppeRequirement']}
          />
        </div>
      )}
    </div>
  );
}
