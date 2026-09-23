'use client';

import React, { useState } from 'react';
import { Target, Award, CheckCircle2, Clock, PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { QualityGoal } from '@/lib/types/modules';
import { MOCK_QUALITY_GOALS } from '@/lib/db/modules-mock-data';

export function QualityGoalsView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [goals, setGoals] = useState<QualityGoal[]>(MOCK_QUALITY_GOALS);

  const achievedCount = goals.filter((g) => g.status === 'ACHIEVED').length;
  const inProgressCount = goals.filter((g) => g.status === 'IN_PROGRESS').length;
  const behindCount = goals.filter((g) => g.status === 'BEHIND').length;
  const avgProgress = (
    goals.reduce((sum, g) => sum + g.percentageAchieved, 0) / (goals.length || 1)
  ).toFixed(0);

  const columns: ColumnDef<QualityGoal>[] = [
    {
      key: 'goalTitle',
      header: 'Strategic Quality Objective',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{item.goalTitle}</span>
          <div className="text-[11px] text-slate-500 font-mono">Owner: {item.ownerName}</div>
        </div>
      ),
    },
    {
      key: 'baseline',
      header: 'Baseline vs Target',
      render: (item) => (
        <div className="text-xs">
          <div className="text-slate-500">From: <span className="font-mono text-slate-700">{item.baseline}</span></div>
          <div className="text-blue-700 font-semibold">Goal: <span className="font-mono">{item.target}</span></div>
        </div>
      ),
    },
    {
      key: 'currentAchievement',
      header: 'Current Milestone',
      render: (item) => (
        <span className="font-mono font-semibold text-xs text-emerald-700">
          {item.currentAchievement}
        </span>
      ),
    },
    {
      key: 'percentageAchieved',
      header: 'Goal Progress',
      sortable: true,
      render: (item) => (
        <div className="w-36">
          <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-700 mb-1">
            <span>Progress</span>
            <span>{item.percentageAchieved}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                item.percentageAchieved >= 100
                  ? 'bg-emerald-600'
                  : item.percentageAchieved >= 80
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(item.percentageAchieved, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'deadline',
      header: 'Target Deadline',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-mono text-slate-800">{item.deadline}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterOptions: [
        { label: 'Achieved', value: 'ACHIEVED' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Behind', value: 'BEHIND' },
      ],
      render: (item) => {
        const variantMap: Record<string, any> = {
          ACHIEVED: 'emerald',
          IN_PROGRESS: 'blue',
          BEHIND: 'rose',
        };
        return <StatusBadge label={item.status.replace('_', ' ')} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="quality-goals-module"
        moduleCode="MOD-14"
        badge="Strategic Objectives & Roadmaps"
        title="Quality Policy Goals & Milestone Achievement"
        subtitle="Departmental and plant-wide objectives for zero defects, customer satisfaction, and lab turnaround speed"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${goals.length} Goals`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Quality Objectives"
              value={goals.length}
              subtitle="Annual 2026 Roadmap"
              icon={<Target className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Average Goal Progress"
              value={`${avgProgress}%`}
              subtitle="Milestones Reached"
              icon={<Award className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Fully Achieved Goals"
              value={achievedCount}
              subtitle="Target Met Early"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="In Progress Initiatives"
              value={inProgressCount}
              subtitle="On Target for Year End"
              icon={<Clock className="w-5 h-5" />}
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
                    Goal Milestone Status
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Execution</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Achieved</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{achievedCount}</div>
                  <span className="text-[10px] text-slate-500">Goal complete</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="text-[11px] text-blue-700 font-semibold block">In Progress</span>
                  <div className="text-lg font-bold font-mono text-blue-900 mt-1">{inProgressCount}</div>
                  <span className="text-[10px] text-slate-500">Active milestones</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] text-rose-700 font-semibold block">Behind</span>
                  <div className="text-lg font-bold font-mono text-rose-900 mt-1">{behindCount}</div>
                  <span className="text-[10px] text-slate-500">Attention needed</span>
                </div>
              </div>
            </div>

            {/* Individual Progress Bars */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Top Strategic Initiatives
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Progress %</span>
              </div>
              <div className="space-y-2.5 text-xs">
                {goals.slice(0, 4).map((g) => (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-semibold truncate max-w-[220px]">{g.goalTitle}</span>
                      <span className="font-mono text-slate-600">{g.percentageAchieved}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          g.percentageAchieved >= 100
                            ? 'bg-emerald-500'
                            : g.percentageAchieved >= 75
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(g.percentageAchieved, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open All Quality Policy Goals"
            recordCount={goals.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="quality-goals-table"
            title="Quality Policy Goals & Milestone Achievement"
            subtitle="Departmental and plant-wide objectives for zero defects, customer satisfaction, and lab turnaround speed"
            data={goals}
            columns={columns}
            searchPlaceholder="Search quality goals or owners..."
            searchableKeys={['goalTitle', 'targetMetric', 'ownerName', 'currentAchievement']}
          />
        </div>
      )}
    </div>
  );
}
