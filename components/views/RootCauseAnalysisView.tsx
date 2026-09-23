'use client';

import React, { useState } from 'react';
import { HelpCircle, Network, CheckCircle, ArrowRight, Layers, Sparkles, Eye } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { MOCK_ROOT_CAUSE_CASES } from '@/lib/db/modules-mock-data';
import { RootCauseCase } from '@/lib/types/modules';

export function RootCauseAnalysisView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [cases] = useState<RootCauseCase[]>(MOCK_ROOT_CAUSE_CASES);
  const [activeCase, setActiveCase] = useState<RootCauseCase>(cases[0]);
  const [activeTab, setActiveTab] = useState<'5why' | 'fishbone'>('5why');

  const columns: ColumnDef<RootCauseCase>[] = [
    {
      key: 'caseCode',
      header: 'Case Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
          {item.caseCode}
        </span>
      ),
    },
    {
      key: 'problemTitle',
      header: 'Quality Problem & Incident',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.problemTitle}</span>
          <div className="text-[11px] text-slate-500">Style: {item.styleAffected}</div>
        </div>
      ),
    },
    {
      key: 'occurredLocation',
      header: 'Floor Location',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">{item.occurredLocation}</span>
      ),
    },
    {
      key: 'createdDate',
      header: 'Incident Date',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">{item.createdDate}</span>
      ),
    },
    {
      key: 'finalRootCause',
      header: 'Isolated Systemic Root Cause',
      render: (item) => (
        <span className="text-xs text-emerald-800 font-medium truncate max-w-md block" title={item.finalRootCause}>
          {item.finalRootCause}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Drilldown',
      align: 'center',
      render: (item) => (
        <button
          onClick={() => {
            setActiveCase(item);
            setViewMode('summary');
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect 5-Why</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="root-cause-module"
        moduleCode="MOD-19"
        badge="Quality Engineering & RCA"
        title="Root Cause Analysis: 5-Why & Ishikawa Fishbone"
        subtitle="Lean Six Sigma DMAIC methodology: sequential causality chains and 6M manufacturing factor isolation"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${cases.length} RCA Cases`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="RCA Investigation Cases"
              value={cases.length}
              subtitle="Persistent Floor Issues"
              icon={<HelpCircle className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Analysis Framework"
              value="5-Why & Ishikawa"
              subtitle="6M Manufacturing Model"
              icon={<Network className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Resolution Status"
              value="100% Solved"
              subtitle="Root Cause Isolated"
              icon={<CheckCircle className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Standard Methodology"
              value="Lean Six Sigma"
              subtitle="DMAIC Root Cause Gate"
              icon={<Sparkles className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          {/* Case Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {activeCase.caseCode}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Logged on {activeCase.createdDate}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{activeCase.problemTitle}</h2>
                <div className="text-xs text-slate-600 mt-0.5">
                  Location: <span className="font-semibold text-slate-800">{activeCase.occurredLocation}</span> | 
                  Style: <span className="font-mono font-semibold text-slate-800">{activeCase.styleAffected}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('5why')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === '5why' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  5-Why Drilldown
                </button>
                <button
                  onClick={() => setActiveTab('fishbone')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'fishbone' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  6M Fishbone (Ishikawa)
                </button>
              </div>
            </div>

            {/* 5-Why Interactive View */}
            {activeTab === '5why' && (
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Five-Why Sequential Causality Chain:
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'Why 1 (Primary Symptom)', text: activeCase.fiveWhys.why1 },
                    { label: 'Why 2 (Immediate Cause)', text: activeCase.fiveWhys.why2 },
                    { label: 'Why 3 (Technical Parameter)', text: activeCase.fiveWhys.why3 },
                    { label: 'Why 4 (Human / Setup Factor)', text: activeCase.fiveWhys.why4 },
                    { label: 'Why 5 (Systemic Root Cause)', text: activeCase.fiveWhys.why5 },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                        idx === 4
                          ? 'bg-rose-50/70 border-rose-200'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          idx === 4 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-xs font-bold ${
                            idx === 4 ? 'text-rose-900' : 'text-slate-700'
                          }`}
                        >
                          {item.label}
                        </div>
                        <p
                          className={`text-xs mt-0.5 leading-relaxed ${
                            idx === 4 ? 'text-rose-950 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-4">
                  <div className="text-xs font-bold text-emerald-900">Confirmed Systemic Root Cause:</div>
                  <p className="text-xs text-emerald-800 mt-1 font-medium leading-relaxed">
                    {activeCase.finalRootCause}
                  </p>
                </div>
              </div>
            )}

            {/* 6M Ishikawa Fishbone View */}
            {activeTab === 'fishbone' && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Ishikawa Cause &amp; Effect Matrix (6M Manufacturing Categories):
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Man (Personnel)', factors: activeCase.fishboneFactors.man, tone: 'blue' },
                    { title: 'Machine (Equipment)', factors: activeCase.fishboneFactors.machine, tone: 'indigo' },
                    { title: 'Material (Raw Fabric/Thread)', factors: activeCase.fishboneFactors.material, tone: 'amber' },
                    { title: 'Method (SOP & Work Instructions)', factors: activeCase.fishboneFactors.method, tone: 'purple' },
                    { title: 'Measurement (Inspection & Gauges)', factors: activeCase.fishboneFactors.measurement, tone: 'emerald' },
                    { title: 'Milieu (Environment / Climate)', factors: activeCase.fishboneFactors.milieu, tone: 'slate' },
                  ].map((m, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-700" />
                        {m.title}
                      </div>
                      <ul className="space-y-1.5">
                        {m.factors.map((f, fIdx) => (
                          <li key={fIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="text-slate-400 font-bold">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Target Effect / Problem:</span>
                    <div className="font-bold text-sm text-slate-900 mt-0.5">{activeCase.problemTitle}</div>
                  </div>
                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Action Mandated
                  </span>
                </div>
              </div>
            )}
          </div>

          <SwitchToListBanner
            label="Open RCA Investigation Cases Table"
            recordCount={cases.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="root-cause-cases-table"
            title="Root Cause Analysis Cases Ledger"
            subtitle="Full register of DMAIC quality engineering investigations with 5-Why and Ishikawa drilldowns"
            data={cases}
            columns={columns}
            searchPlaceholder="Search RCA case by code, problem, style, or root cause..."
            searchableKeys={['caseCode', 'problemTitle', 'occurredLocation', 'styleAffected', 'finalRootCause']}
          />
        </div>
      )}
    </div>
  );
}
