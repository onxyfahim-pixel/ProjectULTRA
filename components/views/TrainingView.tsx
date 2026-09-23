'use client';

import React, { useState } from 'react';
import { GraduationCap, Users, CheckCircle2, Clock, Calendar, Award, BookOpen } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { TrainingMatrixItem } from '@/lib/types/modules';
import { MOCK_TRAINING_MODULES } from '@/lib/db/modules-mock-data';

export function TrainingView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [courses, setCourses] = useState<TrainingMatrixItem[]>(MOCK_TRAINING_MODULES);

  const totalTrained = courses.reduce((sum, c) => sum + c.trainedCount, 0);
  const avgPassRate = (
    courses.reduce((sum, c) => sum + c.passRatePercent, 0) / (courses.length || 1)
  ).toFixed(1);

  const columns: ColumnDef<TrainingMatrixItem>[] = [
    {
      key: 'courseCode',
      header: 'Course Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
          {item.courseCode}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Training Curriculum Title',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
          <div className="text-[11px] text-slate-500 font-mono">Trainer: {item.trainerName}</div>
        </div>
      ),
    },
    {
      key: 'targetAudience',
      header: 'Target Trainees',
      render: (item) => (
        <span className="text-xs text-slate-700">{item.targetAudience}</span>
      ),
    },
    {
      key: 'trainedCount',
      header: 'Staff Certified',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          {item.trainedCount} Trainees
        </span>
      ),
    },
    {
      key: 'passRatePercent',
      header: 'Exam Pass Rate',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-xs text-emerald-700">
          {item.passRatePercent.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'nextScheduledDate',
      header: 'Next Session',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-mono text-xs text-slate-800">{item.nextScheduledDate}</span>
          <div className="text-[10px] text-slate-500 font-mono">{item.frequency}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => {
        const variantMap: Record<string, any> = {
          SCHEDULED: 'blue',
          COMPLETED: 'emerald',
          OVERDUE: 'rose',
        };
        return <StatusBadge label={item.status} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="training-module"
        moduleCode="MOD-29"
        badge="Quality Training & Competency"
        title="Factory Quality Training Matrix & Competency Certifications"
        subtitle="Needle safety protocols, ASTM 4-point fabric grading, garment defect identification, and operator skill licensing"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${courses.length} Training Programs`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Training Modules"
              value={courses.length}
              subtitle="Needle, 4-Pt, Defect ID"
              icon={<GraduationCap className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Total Certified Workers"
              value={`${totalTrained} Staff`}
              subtitle="Operators & QCs Trained"
              icon={<Users className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Training Pass Rate"
              value={`${avgPassRate}%`}
              subtitle="Practical & Written Score"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Upcoming Session"
              value="Oct 05"
              subtitle="Needle Safety Recertification"
              icon={<Calendar className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Training Programs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Curriculum &amp; Cadence
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Frequency</span>
              </div>
              <div className="space-y-2">
                {courses.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-700">{c.courseCode}</span>
                        <span className="text-xs font-semibold text-slate-900">{c.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Target: {c.targetAudience} • Cadence: {c.frequency}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                      {c.trainedCount} Staff
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certification Performance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Exam Performance &amp; Next Run
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Benchmark ≥ 90%</span>
              </div>
              <div className="space-y-2">
                {courses.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900">{c.title}</span>
                      <div className="text-[10px] text-emerald-800 font-mono mt-0.5">
                        Trainer: {c.trainerName} • Next Date: {c.nextScheduledDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded block">
                        {c.passRatePercent}% Pass
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Quality Training Matrix & Competency Register"
            recordCount={courses.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="training-matrix-table"
            title="Factory Quality Training Matrix & Competency Certifications"
            subtitle="Needle safety protocols, ASTM 4-point fabric grading, garment defect identification, and operator skill licensing"
            data={courses}
            columns={columns}
            searchPlaceholder="Search training course title, audience, or trainer..."
            searchableKeys={['courseCode', 'title', 'targetAudience', 'trainerName']}
          />
        </div>
      )}
    </div>
  );
}
