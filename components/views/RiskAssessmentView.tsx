'use client';

import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2, TrendingDown, PieChart, Activity } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { RiskFmeaItem } from '@/lib/types/modules';
import { MOCK_RISK_FMEAS } from '@/lib/db/modules-mock-data';

export function RiskAssessmentView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [fmeas, setFmeas] = useState<RiskFmeaItem[]>(MOCK_RISK_FMEAS);

  const maxRpn = Math.max(...fmeas.map((f) => f.rpn));
  const highRiskCount = fmeas.filter((f) => f.rpn >= 100).length;
  const mediumRiskCount = fmeas.filter((f) => f.rpn >= 60 && f.rpn < 100).length;
  const lowRiskCount = fmeas.filter((f) => f.rpn < 60).length;

  const columns: ColumnDef<RiskFmeaItem>[] = [
    {
      key: 'fmeaCode',
      header: 'FMEA Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
          {item.fmeaCode}
        </span>
      ),
    },
    {
      key: 'processStep',
      header: 'Garment Process Step',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-slate-900 text-xs">{item.processStep}</span>
      ),
    },
    {
      key: 'potentialFailureMode',
      header: 'Potential Failure & Effect',
      render: (item) => (
        <div className="text-xs">
          <div className="font-medium text-rose-700">{item.potentialFailureMode}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{item.potentialEffect}</div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'S (Sev)',
      sortable: true,
      align: 'center',
      render: (item) => <span className="font-mono text-xs font-semibold text-slate-800">{item.severity}</span>,
    },
    {
      key: 'occurrence',
      header: 'O (Occ)',
      sortable: true,
      align: 'center',
      render: (item) => <span className="font-mono text-xs font-semibold text-slate-800">{item.occurrence}</span>,
    },
    {
      key: 'detection',
      header: 'D (Det)',
      sortable: true,
      align: 'center',
      render: (item) => <span className="font-mono text-xs font-semibold text-slate-800">{item.detection}</span>,
    },
    {
      key: 'rpn',
      header: 'RPN Score',
      sortable: true,
      align: 'center',
      render: (item) => (
        <span
          className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full ${
            item.rpn >= 100
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : item.rpn >= 60
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}
        >
          {item.rpn}
        </span>
      ),
    },
    {
      key: 'mitigationAction',
      header: 'Mandatory Mitigation Protocol & Lead',
      render: (item) => (
        <div className="text-xs max-w-sm">
          <div className="text-slate-800 leading-relaxed font-medium">{item.mitigationAction}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Lead: {item.responsibleLead}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="risk-assessment-module"
        moduleCode="MOD-17"
        badge="Risk & Process FMEA"
        title="Pre-Production Risk Assessment & Process FMEA Matrix"
        subtitle="Failure Mode and Effects Analysis: Severity (S) × Occurrence (O) × Detection (D) = Risk Priority Number (RPN)"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${fmeas.length} FMEA Steps`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="FMEA Risk Assessments"
              value={fmeas.length}
              subtitle="Pre-Production Line Trials"
              icon={<ShieldAlert className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Highest RPN Found"
              value={maxRpn}
              subtitle="Embroidery Alignment Risk"
              icon={<AlertCircle className="w-5 h-5" />}
              tone="rose"
            />
            <StatCard
              title="High-Risk Steps (>100)"
              value={highRiskCount}
              subtitle="Engineering Poka-Yoke Needed"
              icon={<TrendingDown className="w-5 h-5" />}
              tone="amber"
            />
            <StatCard
              title="Mitigation Enforcement"
              value="100% Active"
              subtitle="Assigned to IE & QA Leads"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RPN Risk Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    RPN Risk Criticality Bands
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Threshold 100+</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] text-rose-700 font-semibold block">High (RPN ≥ 100)</span>
                  <div className="text-lg font-bold font-mono text-rose-900 mt-1">{highRiskCount}</div>
                  <span className="text-[10px] text-slate-500">Urgent poka-yoke</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block">Medium (60-99)</span>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-1">{mediumRiskCount}</div>
                  <span className="text-[10px] text-slate-500">Supervisory check</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Low (&lt; 60)</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{lowRiskCount}</div>
                  <span className="text-[10px] text-slate-500">Standard SOP</span>
                </div>
              </div>
            </div>

            {/* Critical Process Steps */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Top Evaluated Process Steps
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Failure Modes</span>
              </div>
              <div className="space-y-2 text-xs">
                {fmeas.slice(0, 3).map((f) => (
                  <div key={f.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 block">{f.processStep}</span>
                      <span className="text-[11px] text-slate-500">{f.potentialFailureMode}</span>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        f.rpn >= 100 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      RPN {f.rpn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete FMEA Risk Matrix & Mitigations"
            recordCount={fmeas.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="risk-assessment-table"
            title="Pre-Production Risk Assessment & Process FMEA Matrix"
            subtitle="Failure Mode and Effects Analysis: Severity (S) × Occurrence (O) × Detection (D) = Risk Priority Number (RPN)"
            data={fmeas}
            columns={columns}
            searchPlaceholder="Search failure mode, process step or mitigation..."
            searchableKeys={['fmeaCode', 'processStep', 'potentialFailureMode', 'potentialEffect', 'mitigationAction', 'responsibleLead']}
          />
        </div>
      )}
    </div>
  );
}
