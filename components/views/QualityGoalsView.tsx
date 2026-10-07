'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Award,
  CheckCircle2,
  Clock,
  PieChart,
  BarChart3,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckSquare,
  Building2,
  Calendar,
  Percent,
  Layers,
  Flag,
  Check,
  Search,
  Filter,
  FileDown,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { QualityGoal, GoalPillar, GoalStatus, GoalPriority } from '@/lib/types/modules';
import { INITIAL_QUALITY_GOALS, GOAL_PILLAR_CONFIG } from '../modules/quality-goals/quality-goals-data';
import { useLiveModuleData } from '@/hooks/use-live-module-data';
import { QualityGoalDetailsPage } from '../modules/quality-goals/QualityGoalDetailsPage';
import { QualityGoalEntryPage } from '../modules/quality-goals/QualityGoalEntryPage';
import { DeleteGoalModal } from '../modules/quality-goals/DeleteGoalModal';
import { QualityGoalExportModal } from '../modules/quality-goals/QualityGoalExportModal';
import { QualityGoalSingleExportModal } from '../modules/quality-goals/QualityGoalSingleExportModal';

type GoalSubView =
  | { type: 'none' }
  | { type: 'details'; goal: QualityGoal }
  | { type: 'add' }
  | { type: 'edit'; goal: QualityGoal };

export function QualityGoalsView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [subView, setSubView] = useState<GoalSubView>({ type: 'none' });
  const [goals, setGoals] = useLiveModuleData<QualityGoal[]>(
    'quality_goals',
    INITIAL_QUALITY_GOALS,
    'erp_quality_goals_v1'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [pillarFilter, setPillarFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Deletion Modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    goals: QualityGoal[];
  }>({
    isOpen: false,
    goals: [],
  });

  // Export Modal States
  const [isGlobalExportOpen, setIsGlobalExportOpen] = useState(false);
  const [exportSelectedGoals, setExportSelectedGoals] = useState<QualityGoal[]>([]);
  const [singleExportGoal, setSingleExportGoal] = useState<QualityGoal | null>(null);

  // LocalStorage Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_quality_goals_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGoals(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveGoals = (updated: QualityGoal[]) => {
    setGoals(updated);
    try {
      localStorage.setItem('erp_quality_goals_v1', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Calculations for KPIs
  const totalGoals = goals.length;
  const achievedCount = goals.filter((g) => g.status === 'ACHIEVED').length;
  const inProgressCount = goals.filter((g) => g.status === 'IN_PROGRESS').length;
  const behindCount = goals.filter((g) => g.status === 'BEHIND').length;
  const avgProgress = totalGoals > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.percentageAchieved, 0) / totalGoals)
    : 0;

  // Cross-Goal Milestones
  const allMilestones = goals.flatMap((g) =>
    (g.milestones || []).map((ms) => ({
      ...ms,
      goalId: g.id,
      goalCode: g.goalCode || g.id,
      goalTitle: g.goalTitle,
      pillar: g.pillar,
    }))
  );
  const totalMilestonesCount = allMilestones.length;

  // Filtered Goals for Main Table
  const filteredGoals = goals.filter((g) => {
    if (pillarFilter !== 'ALL' && g.pillar !== pillarFilter) return false;
    if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && g.priority !== priorityFilter) return false;
    return true;
  });

  // Duplicate Goal
  const handleDuplicateGoal = (source: QualityGoal) => {
    const duplicated: QualityGoal = {
      ...source,
      id: `qg-${Date.now()}`,
      goalCode: `QG-2026-${String(Math.floor(Math.random() * 90) + 10)}`,
      goalTitle: `${source.goalTitle} (Copy)`,
      percentageAchieved: 0,
      status: 'PLANNED',
      milestones: (source.milestones || []).map((m, i) => ({
        ...m,
        id: `m-${Date.now()}-${i}`,
        completed: false,
        completedDate: undefined,
      })),
      actionPlans: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [duplicated, ...goals];
    saveGoals(updated);
    showToast(`Created duplicate objective ${duplicated.goalCode}`);
  };

  // Delete Handler
  const handleConfirmDelete = () => {
    const idsToDelete = new Set(deleteModalState.goals.map((g) => g.id));
    const updated = goals.filter((g) => !idsToDelete.has(g.id));
    saveGoals(updated);
    setDeleteModalState({ isOpen: false, goals: [] });
    if (subView.type === 'details' && idsToDelete.has(subView.goal.id)) {
      setSubView({ type: 'none' });
    }
    showToast(`Successfully deleted ${idsToDelete.size} quality objective(s)`);
  };

  // Update Single Goal
  const handleUpdateGoal = (updatedGoal: QualityGoal) => {
    const updated = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    saveGoals(updated);
  };

  // Toggle Milestone from Cross-Goal Milestone Roadmap
  const handleToggleMilestoneAcrossGoals = (goalId: string, milestoneId: string) => {
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    const updatedMilestones = (targetGoal.milestones || []).map((ms) => {
      if (ms.id !== milestoneId) return ms;
      const isNowDone = !ms.completed;
      return {
        ...ms,
        completed: isNowDone,
        completedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined,
      };
    });

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const newPct = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);
    const newStatus: GoalStatus = newPct >= 100 ? 'ACHIEVED' : newPct < 50 ? 'BEHIND' : 'IN_PROGRESS';

    const updatedGoal: QualityGoal = {
      ...targetGoal,
      milestones: updatedMilestones,
      percentageAchieved: newPct,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    handleUpdateGoal(updatedGoal);
    showToast('Updated milestone completion progress');
  };

  // Columns for Main Quality Objectives Table - Designed for FIT & ZERO HORIZONTAL SCROLL
  const columns: ColumnDef<QualityGoal>[] = [
    {
      key: 'goalTitle',
      header: 'Strategic Objective & Pillar',
      sortable: true,
      accessor: (item) => item.goalTitle,
      render: (item) => {
        const pillarCfg = item.pillar
          ? GOAL_PILLAR_CONFIG[item.pillar] || { label: item.pillar, badgeClass: 'bg-slate-100 text-slate-700' }
          : { label: 'Policy Objective', badgeClass: 'bg-slate-100 text-slate-700' };

        return (
          <div className="space-y-1 max-w-[260px]">
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => setSubView({ type: 'details', goal: item })}
                className="font-mono font-bold text-blue-700 text-xs hover:underline cursor-pointer"
              >
                {item.goalCode || 'QG'}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${pillarCfg.badgeClass}`}>
                {pillarCfg.label}
              </span>
            </div>
            <span
              onClick={() => setSubView({ type: 'details', goal: item })}
              className="font-semibold text-slate-900 text-xs hover:text-blue-600 cursor-pointer line-clamp-1"
              title={item.goalTitle}
            >
              {item.goalTitle}
            </span>
          </div>
        );
      },
    },
    {
      key: 'target',
      header: 'Baseline vs Target',
      render: (item) => (
        <div className="text-xs max-w-[150px]">
          <span className="font-semibold text-blue-700 block truncate" title={item.target}>
            {item.target}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block truncate mt-0.5">
            Base: {item.baseline}
          </span>
        </div>
      ),
    },
    {
      key: 'currentAchievement',
      header: 'Current Achievement',
      render: (item) => (
        <div className="text-xs max-w-[170px]">
          <span className="font-semibold text-emerald-700 block truncate" title={item.currentAchievement}>
            {item.currentAchievement}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
            {item.milestones?.filter((m) => m.completed).length || 0}/{item.milestones?.length || 0} Milestones
          </span>
        </div>
      ),
    },
    {
      key: 'percentageAchieved',
      header: 'Progress %',
      sortable: true,
      accessor: (item) => item.percentageAchieved,
      render: (item) => (
        <div className="w-24">
          <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-700 mb-0.5">
            <span>{item.percentageAchieved}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                item.percentageAchieved >= 100
                  ? 'bg-emerald-500'
                  : item.percentageAchieved >= 75
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
      key: 'department',
      header: 'Department & Lead',
      render: (item) => (
        <div className="max-w-[150px] text-xs">
          <span className="font-medium text-slate-800 block truncate">
            {item.department || 'Plant-Wide QA'}
          </span>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {item.ownerName.split('(')[0]}
          </span>
        </div>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      sortable: true,
      accessor: (item) => item.deadline,
      render: (item) => (
        <span className="font-mono text-xs text-slate-800">
          {item.deadline}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => item.status,
      align: 'center',
      render: (item) => {
        const variantMap: Record<string, any> = {
          ACHIEVED: 'emerald',
          IN_PROGRESS: 'blue',
          BEHIND: 'rose',
          PLANNED: 'neutral',
        };
        return (
          <StatusBadge
            label={item.status.replace(/_/g, ' ')}
            variant={variantMap[item.status] || 'neutral'}
          />
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', goal: item })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', goal: item })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Goal"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSingleExportGoal(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
            title="Export Goal Charter"
          >
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDuplicateGoal(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer hidden sm:inline-flex"
            title="Duplicate Objective"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalState({ isOpen: true, goals: [item] })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
            title="Delete Objective"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<QualityGoal>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModalState({
          isOpen: true,
          goals: selected,
        });
      },
    },
    {
      label: 'Export Selected',
      icon: <FileDown className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setExportSelectedGoals(selected);
        setIsGlobalExportOpen(true);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      {subView.type !== 'details' && (
        <ModuleHeader
          id="quality-goals-module"
          title="Quality Goals"
          activeView={subView.type !== 'none' ? 'list' : viewMode}
          onViewChange={(mode) => {
            setSubView({ type: 'none' });
            setViewMode(mode);
          }}
          customTabs={[
            { id: 'summary', label: 'Summary' },
            { id: 'list', label: 'Quality Objectives', count: goals.length },
            { id: 'milestones', label: 'Milestone Roadmap', count: totalMilestonesCount },
          ]}
        />
      )}

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <QualityGoalDetailsPage
          goal={subView.goal}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(g) => setSubView({ type: 'edit', goal: g })}
          onDuplicate={(g) => {
            handleDuplicateGoal(g);
            setSubView({ type: 'none' });
          }}
          onDelete={(g) => {
            setDeleteModalState({ isOpen: true, goals: [g] });
          }}
          onUpdateGoal={(updated) => {
            handleUpdateGoal(updated);
            setSubView({ type: 'details', goal: updated });
          }}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <QualityGoalEntryPage
          onSave={(newGoal) => {
            const updated = [newGoal, ...goals];
            saveGoals(updated);
            setSubView({ type: 'details', goal: newGoal });
            showToast(`Created quality objective ${newGoal.goalCode || newGoal.goalTitle}`);
          }}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <QualityGoalEntryPage
          initialGoal={subView.goal}
          onSave={(updatedGoal) => {
            handleUpdateGoal(updatedGoal);
            setSubView({ type: 'details', goal: updatedGoal });
            showToast(`Updated quality objective ${updatedGoal.goalCode || updatedGoal.goalTitle}`);
          }}
          onCancel={() => setSubView({ type: 'details', goal: subView.goal })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Executive Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Quality Objectives"
                  value={totalGoals.toString()}
                  subtitle="Annual 2026 Policy Roadmap"
                  icon={Target}
                  tone="blue"
                />
                <StatCard
                  title="Average Goal Progress"
                  value={`${avgProgress}%`}
                  subtitle="Milestones Reached Across Plant"
                  icon={Award}
                  tone="indigo"
                />
                <StatCard
                  title="Fully Achieved Goals"
                  value={achievedCount.toString()}
                  subtitle="Targets Exceeded Early"
                  icon={CheckCircle2}
                  tone="emerald"
                />
                <StatCard
                  title="In Progress Initiatives"
                  value={inProgressCount.toString()}
                  subtitle="On Track for Year End"
                  icon={Clock}
                  tone="amber"
                />
              </div>

              {/* 2-Column Summary Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Milestone Status Distribution */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Objective Milestone Status
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ISO 9001 Clause 6.2</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div
                      onClick={() => {
                        setStatusFilter('ACHIEVED');
                        setViewMode('list');
                      }}
                      className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-100/60 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] text-emerald-700 font-semibold block">Achieved</span>
                      <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{achievedCount}</div>
                      <span className="text-[10px] text-slate-500">100% completed</span>
                    </div>
                    <div
                      onClick={() => {
                        setStatusFilter('IN_PROGRESS');
                        setViewMode('list');
                      }}
                      className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 hover:bg-blue-100/60 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] text-blue-700 font-semibold block">In Progress</span>
                      <div className="text-lg font-bold font-mono text-blue-900 mt-1">{inProgressCount}</div>
                      <span className="text-[10px] text-slate-500">Active trajectory</span>
                    </div>
                    <div
                      onClick={() => {
                        setStatusFilter('BEHIND');
                        setViewMode('list');
                      }}
                      className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 hover:bg-rose-100/60 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] text-rose-700 font-semibold block">Behind</span>
                      <div className="text-lg font-bold font-mono text-rose-900 mt-1">{behindCount}</div>
                      <span className="text-[10px] text-slate-500">Remediation plan</span>
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
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {goals.slice(0, 4).map((g) => (
                      <div
                        key={g.id}
                        onClick={() => setSubView({ type: 'details', goal: g })}
                        className="space-y-1 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between text-slate-700">
                          <span className="font-semibold truncate max-w-[220px]">{g.goalTitle}</span>
                          <span className="font-mono text-slate-600">{g.percentageAchieved}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              g.percentageAchieved >= 100
                                ? 'bg-emerald-500'
                                : g.percentageAchieved >= 75
                                ? 'bg-blue-600'
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
                label="Open All Quality Policy Goals &amp; Milestone Roadmaps"
                recordCount={goals.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: MAIN QUALITY OBJECTIVES REGISTER TABLE */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="quality-goals-table"
                data={filteredGoals}
                columns={columns}
                searchPlaceholder="Search objective code, title, owner, or target..."
                searchableKeys={[
                  'goalCode',
                  'goalTitle',
                  'targetMetric',
                  'target',
                  'baseline',
                  'ownerName',
                  'department',
                ]}
                secondaryAction={
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Pillar Filter */}
                    <select
                      value={pillarFilter}
                      onChange={(e) => setPillarFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Strategic Pillars</option>
                      <option value="CUSTOMER_SATISFACTION">Customer Satisfaction</option>
                      <option value="DEFECT_REDUCTION">Defect Reduction (DHU)</option>
                      <option value="PROCESS_EFFICIENCY">Process Efficiency &amp; Yield</option>
                      <option value="COMPLIANCE_STANDARDS">Compliance &amp; Needle</option>
                      <option value="LAB_TESTING">Lab &amp; Testing Speed</option>
                      <option value="SUSTAINABILITY">ESG &amp; Sustainability</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACHIEVED">Achieved</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="BEHIND">Behind</option>
                      <option value="PLANNED">Planned</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                    </select>
                  </div>
                }
                primaryAction={
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExportSelectedGoals([]);
                        setIsGlobalExportOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
                    >
                      <FileDown className="w-3.5 h-3.5 text-slate-600" />
                      <span>Export</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'add' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Objective</span>
                    </button>
                  </div>
                }
                batchActions={batchActions}
              />
            </div>
          )}

          {/* TAB 3: CROSS-GOAL MILESTONE ROADMAP */}
          {viewMode === 'milestones' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-blue-600" />
                    <span>Cross-Plant Strategic Milestone Roadmaps</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live accountability checklist for quarterly milestone gates across all Quality Policy goals.
                  </p>
                </div>
              </div>

              {/* Milestones List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">Done</th>
                        <th className="py-3 px-3">Milestone Checkpoint</th>
                        <th className="py-3 px-3">Parent Quality Goal</th>
                        <th className="py-3 px-3">Target Date</th>
                        <th className="py-3 px-3 text-center">Weight</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allMilestones.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                            No milestone checkpoints defined in the quality roadmap.
                          </td>
                        </tr>
                      ) : (
                        allMilestones.map((ms) => (
                          <tr
                            key={`${ms.goalId}-${ms.id}`}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              ms.completed ? 'bg-emerald-50/20' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleMilestoneAcrossGoals(ms.goalId, ms.id)
                                }
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer mx-auto ${
                                  ms.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 hover:border-blue-500 bg-white'
                                }`}
                                title={ms.completed ? 'Click to reopen' : 'Click to complete'}
                              >
                                {ms.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            </td>
                            <td className="py-3 px-3 max-w-sm">
                              <span
                                className={`font-semibold block ${
                                  ms.completed ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {ms.title}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono">
                              <button
                                type="button"
                                onClick={() => {
                                  const g = goals.find((x) => x.id === ms.goalId);
                                  if (g) setSubView({ type: 'details', goal: g });
                                }}
                                className="text-blue-600 hover:underline font-bold block"
                              >
                                {ms.goalCode}
                              </button>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                                {ms.goalTitle}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-700">
                              {ms.targetDate}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                {ms.weightPercentage || 25}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  ms.completed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {ms.completed ? 'Achieved' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteGoalModal
        isOpen={deleteModalState.isOpen}
        goals={deleteModalState.goals}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, goals: [] })}
      />

      {/* Global Quality Goals Export Modal */}
      <QualityGoalExportModal
        isOpen={isGlobalExportOpen}
        onClose={() => setIsGlobalExportOpen(false)}
        allGoals={goals}
        selectedGoals={exportSelectedGoals}
      />

      {/* Individual Quality Goal Single Export Modal */}
      {singleExportGoal && (
        <QualityGoalSingleExportModal
          isOpen={!!singleExportGoal}
          onClose={() => setSingleExportGoal(null)}
          goal={singleExportGoal}
        />
      )}
    </div>
  );
}
