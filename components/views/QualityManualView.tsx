'use client';

import React, { useState } from 'react';
import { BookOpen, ShieldCheck, FileCheck, Layers, ChevronRight, Bookmark } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { MOCK_QUALITY_MANUAL } from '@/lib/db/modules-mock-data';
import { QualityManualSection } from '@/lib/types/modules';

export function QualityManualView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [sections] = useState<QualityManualSection[]>(MOCK_QUALITY_MANUAL);
  const [selectedSection, setSelectedSection] = useState<QualityManualSection>(sections[0]);

  const columns: ColumnDef<QualityManualSection>[] = [
    {
      key: 'chapterNumber',
      header: 'Chapter #',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-100">
          {item.chapterNumber}
        </span>
      ),
    },
    {
      key: 'clauseReference',
      header: 'ISO Clause Ref',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {item.clauseReference}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Quality Manual Section Title',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
          <p className="text-[11px] text-slate-500 max-w-md truncate mt-0.5" title={item.summary}>
            {item.summary}
          </p>
        </div>
      ),
    },
    {
      key: 'responsibleDepartment',
      header: 'Responsible Department',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-medium text-slate-800">{item.responsibleDepartment}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last Revised',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">{item.updatedAt}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="quality-manual-module"
        moduleCode="MOD-27"
        badge="Quality System Governance"
        title="Plant Quality Policy & Master Manual (ISO 9001:2015)"
        subtitle="Foundational corporate quality policy, leadership commitments, scope statements, and ISO clause mapping"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${sections.length} Chapters`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Quality Manual Version"
              value="Rev 4.2"
              subtitle="ISO 9001:2015 Compliant"
              icon={<BookOpen className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Core Chapters"
              value={sections.length}
              subtitle="Complete Quality System"
              icon={<Layers className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Executive Sign-Off"
              value="Managing Dir."
              subtitle="Mandated for All Staff"
              icon={<ShieldCheck className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Audit Compliance"
              value="100% Aligned"
              subtitle="Zero Policy NCs"
              icon={<FileCheck className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chapter List */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Table of Contents (ISO 9001 Framework):
              </h3>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSection(sec)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedSection.id === sec.id
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700 block">{sec.chapterNumber}</span>
                    <span className="text-xs font-semibold text-slate-900 block mt-0.5">{sec.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{sec.clauseReference}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>

            {/* Selected Chapter Content */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {selectedSection.chapterNumber}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{selectedSection.clauseReference}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{selectedSection.title}</h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Custodian: <span className="font-semibold text-slate-700">{selectedSection.responsibleDepartment}</span> • 
                  Last Updated: <span className="font-mono">{selectedSection.updatedAt}</span>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Executive Summary:</span>
                  <p className="text-slate-700 leading-relaxed">{selectedSection.summary}</p>
                </div>

                <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-950 block mb-1">Quality System Commitments:</span>
                  <ul className="list-disc pl-4 space-y-1.5 text-blue-900">
                    <li>Every department lead must ensure daily adherence to approved technical specifications and tech packs.</li>
                    <li>No substandard fabric or trims may be released into cutting without formal lab approval.</li>
                    <li>Operators are empowered with &quot;Stop-the-Line&quot; authority upon discovering recurring sewing defects.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Quality Manual Chapters Master Index"
            recordCount={sections.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="quality-manual-table"
            title="Quality Manual Chapters Master Index (ISO 9001:2015)"
            subtitle="Tabular overview of quality clauses, chapter custodians, and latest review dates"
            data={sections}
            columns={columns}
            searchPlaceholder="Search chapter number, title, clause, or department..."
            searchableKeys={['chapterNumber', 'clauseReference', 'title', 'responsibleDepartment']}
          />
        </div>
      )}
    </div>
  );
}
