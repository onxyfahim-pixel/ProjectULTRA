'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Copy,
  Target,
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  User,
  CheckSquare,
  Plus,
  Check,
  TrendingUp,
  Percent,
  ShieldCheck,
  Layers,
  ChevronRight,
  Flag,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  QualityGoal,
  GoalStatus,
  GoalPriority,
  GoalMilestone,
  GoalActionPlan,
} from '@/lib/types/modules';
import { GOAL_PILLAR_CONFIG } from './quality-goals-data';

interface QualityGoalDetailsPageProps {
  goal: QualityGoal;
  onBack: () => void;
  onEdit: (goal: QualityGoal) => void;
  onDuplicate: (goal: QualityGoal) => void;
  onDelete: (goal: QualityGoal) => void;
  onUpdateGoal?: (updated: QualityGoal) => void;
  showToast: (msg: string) => void;
}

export function QualityGoalDetailsPage({
  goal,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateGoal,
  showToast,
}: QualityGoalDetailsPageProps) {
  const [currentGoal, setCurrentGoal] = useState<QualityGoal>(goal);
  const [milestones, setMilestones] = useState<GoalMilestone[]>(goal.milestones || []);
  const [actionPlans, setActionPlans] = useState<GoalActionPlan[]>(goal.actionPlans || []);

  // Quick Add Milestone Form
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneTargetDate, setNewMilestoneTargetDate] = useState('');
  const [newMilestoneWeight, setNewMilestoneWeight] = useState<number>(25);

  // Quick Add Action Plan Form
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');
  const [newActionDept, setNewActionDept] = useState(goal.department || 'Quality Assurance');
  const [newActionDueDate, setNewActionDueDate] = useState('');

  // Status Change Handler
  const handleStatusChange = (newStatus: GoalStatus) => {
    const updated: QualityGoal = {
      ...currentGoal,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentGoal(updated);
    onUpdateGoal?.(updated);
    showToast(`Objective status set to ${newStatus.replace('_', ' ')}`);
  };

  // Priority Change Handler
  const handlePriorityChange = (newPriority: GoalPriority) => {
    const updated: QualityGoal = {
      ...currentGoal,
      priority: newPriority,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentGoal(updated);
    onUpdateGoal?.(updated);
    showToast(`Objective priority set to ${newPriority}`);
  };

  // Toggle Milestone Completion & Auto-Update Progress
  const handleToggleMilestone = (index: number) => {
    const updatedMilestones = [...milestones];
    const ms = updatedMilestones[index];
    const isNowDone = !ms.completed;

    updatedMilestones[index] = {
      ...ms,
      completed: isNowDone,
      completedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined,
    };
    setMilestones(updatedMilestones);

    // Calculate new percentage achieved based on milestones
    let newPercentage = currentGoal.percentageAchieved;
    if (updatedMilestones.length > 0) {
      const completedCount = updatedMilestones.filter((m) => m.completed).length;
      newPercentage = Math.round((completedCount / updatedMilestones.length) * 100);
    }

    const newStatus: GoalStatus =
      newPercentage >= 100 ? 'ACHIEVED' : newPercentage < 50 ? 'BEHIND' : 'IN_PROGRESS';

    const updated: QualityGoal = {
      ...currentGoal,
      milestones: updatedMilestones,
      percentageAchieved: newPercentage,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentGoal(updated);
    onUpdateGoal?.(updated);
    showToast(isNowDone ? 'Milestone achieved' : 'Milestone reopened');
  };

  // Add Milestone
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) {
      showToast('Please enter milestone title');
      return;
    }

    const newMs: GoalMilestone = {
      id: `m-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      targetDate: newMilestoneTargetDate || currentGoal.deadline,
      completed: false,
      weightPercentage: Number(newMilestoneWeight) || 25,
    };

    const updatedMilestones = [...milestones, newMs];
    setMilestones(updatedMilestones);

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const newPercentage = Math.round((completedCount / updatedMilestones.length) * 100);

    const updated: QualityGoal = {
      ...currentGoal,
      milestones: updatedMilestones,
      percentageAchieved: newPercentage,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentGoal(updated);
    onUpdateGoal?.(updated);
    setNewMilestoneTitle('');
    setShowAddMilestone(false);
    showToast('New milestone added to roadmap');
  };

  // Toggle Action Plan Task
  const handleToggleActionPlan = (index: number) => {
    const updatedPlans = [...actionPlans];
    const plan = updatedPlans[index];
    const isNowDone = !plan.completed;

    updatedPlans[index] = {
      ...plan,
      completed: isNowDone,
      completedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined,
    };
    setActionPlans(updatedPlans);

    const updated: QualityGoal = {
      ...currentGoal,
      actionPlans: updatedPlans,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentGoal(updated);
    onUpdateGoal?.(updated);
    showToast(isNowDone ? 'Action initiative marked as complete' : 'Action initiative reopened');
  };

  // Add Action Plan Task
  const handleAddActionPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTask.trim() || !newActionAssignee.trim()) {
      showToast('Please specify task and assignee');
      return;
    }

    const newPlan: GoalActionPlan = {
      id: `ap-${Date.now()}`,
      task: newActionTask.trim(),
      assignee: newActionAssignee.trim(),
      department: newActionDept.trim(),
      dueDate: newActionDueDate || currentGoal.deadline,
      completed: false,
    };

    const updatedPlans = [...actionPlans, newPlan];
    setActionPlans(updatedPlans);

    const updated: QualityGoal = {
      ...currentGoal,
      actionPlans: updatedPlans,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentGoal(updated);
    onUpdateGoal?.(updated);
    setNewActionTask('');
    setNewActionAssignee('');
    setShowAddAction(false);
    showToast('New action initiative assigned');
  };

  // Pillar Configuration
  const pillarCfg = currentGoal.pillar
    ? GOAL_PILLAR_CONFIG[currentGoal.pillar] || {
        label: currentGoal.pillar,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        tone: 'blue',
      }
    : { label: 'Strategic Quality Policy', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', tone: 'blue' };
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 xl:p-8 animate-in fade-in duration-150">
      <div className="w-full max-w-[1920px] mx-auto space-y-6 pb-20">
        {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Back to Quality Objectives List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {currentGoal.goalCode || 'QG-2026'}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${pillarCfg.badgeClass}`}>
                {pillarCfg.label}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1 line-clamp-1">
              {currentGoal.goalTitle}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Status:</span>
            <select
              value={currentGoal.status}
              onChange={(e) => handleStatusChange(e.target.value as GoalStatus)}
              className="text-xs font-bold bg-transparent border-none text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ACHIEVED">Achieved</option>
              <option value="BEHIND">Behind Schedule</option>
              <option value="PLANNED">Planned</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Priority:</span>
            <select
              value={currentGoal.priority || 'HIGH'}
              onChange={(e) => handlePriorityChange(e.target.value as GoalPriority)}
              className="text-xs font-bold bg-transparent border-none text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>


          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => onDuplicate(currentGoal)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Duplicate Objective Template"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Duplicate</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(currentGoal)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Goal</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(currentGoal)}
            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Objective"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI & Goal Progress Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Goal Achievement Progress */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Goal Progress</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>{currentGoal.percentageAchieved}%</span>
            <span className="text-xs font-normal text-slate-500 font-sans">Reached</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                currentGoal.percentageAchieved >= 100
                  ? 'bg-emerald-500'
                  : currentGoal.percentageAchieved >= 75
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(currentGoal.percentageAchieved, 100)}%` }}
            />
          </div>
        </div>

        {/* Milestone Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Current Milestone</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-emerald-700 line-clamp-1 mt-0.5">
            {currentGoal.currentAchievement}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {milestones.filter((m) => m.completed).length} of {milestones.length} checkpoints closed
          </div>
        </div>

        {/* Baseline vs Target */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Target Objective</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-blue-700 truncate">
            {currentGoal.target}
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate mt-1">
            Baseline: {currentGoal.baseline}
          </div>
        </div>

        {/* Target Deadline */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Target Deadline</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-mono text-sm font-bold text-slate-900">
            {currentGoal.deadline}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1">
            Review: <span className="font-semibold text-slate-700">{currentGoal.reviewCycle || 'Quarterly'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Milestones & Action Plan, Right Column Scope & Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Milestones & Action Plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strategic Milestones Roadmap */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Strategic Milestone Roadmap ({milestones.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMilestone(!showAddMilestone)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            {/* Quick Add Milestone Form */}
            {showAddMilestone && (
              <form onSubmit={handleAddMilestone} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Add Milestone Checkpoint</h4>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Milestone Description *</label>
                  <input
                    type="text"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="e.g., Phase 2: Deploy UV ink lot tracing across all cutting tables..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Target Date</label>
                    <input
                      type="date"
                      value={newMilestoneTargetDate}
                      onChange={(e) => setNewMilestoneTargetDate(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Weight Contribution (%)</label>
                    <input
                      type="number"
                      value={newMilestoneWeight}
                      onChange={(e) => setNewMilestoneWeight(Number(e.target.value))}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddMilestone(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Save Milestone
                  </button>
                </div>
              </form>
            )}

            {/* Milestones List with Direct Checkbox Toggling */}
            <div className="space-y-2.5">
              {milestones.map((ms, idx) => (
                <div
                  key={ms.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    ms.completed
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleMilestone(idx)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        ms.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-blue-500 bg-white'
                      }`}
                      title={ms.completed ? 'Click to reopen milestone' : 'Click to complete milestone'}
                    >
                      {ms.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className={`text-xs font-medium leading-snug ${
                            ms.completed ? 'line-through text-slate-500' : 'text-slate-900 font-semibold'
                          }`}
                        >
                          {ms.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ms.weightPercentage && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              Weight: {ms.weightPercentage}%
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              ms.completed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ms.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span className="font-mono">
                          Target Date: <strong className="text-slate-700">{ms.targetDate}</strong>
                        </span>
                        {ms.completed && ms.completedDate && (
                          <span className="text-emerald-700 font-mono">
                            Achieved on: {ms.completedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Action Plan (Implementation Initiatives) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Operational Action Initiatives ({actionPlans.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAction(!showAddAction)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Action</span>
              </button>
            </div>

            {/* Quick Add Action Form */}
            {showAddAction && (
              <form onSubmit={handleAddActionPlan} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">New Operational Initiative</h4>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Task Description *</label>
                  <input
                    type="text"
                    value={newActionTask}
                    onChange={(e) => setNewActionTask(e.target.value)}
                    placeholder="e.g., Conduct weekly light box calibration and install UV light tubes..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Assignee *</label>
                    <input
                      type="text"
                      value={newActionAssignee}
                      onChange={(e) => setNewActionAssignee(e.target.value)}
                      placeholder="e.g., Md. Al-Amin"
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Department</label>
                    <input
                      type="text"
                      value={newActionDept}
                      onChange={(e) => setNewActionDept(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newActionDueDate}
                      onChange={(e) => setNewActionDueDate(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAction(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Assign Task
                  </button>
                </div>
              </form>
            )}

            {/* Action Plans List */}
            {actionPlans.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                No active operational initiatives assigned to this objective.
              </div>
            ) : (
              <div className="space-y-2.5">
                {actionPlans.map((plan, idx) => (
                  <div
                    key={plan.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      plan.completed
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActionPlan(idx)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          plan.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-blue-500 bg-white'
                        }`}
                        title={plan.completed ? 'Click to reopen initiative' : 'Click to complete initiative'}
                      >
                        {plan.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p
                            className={`text-xs font-medium leading-snug ${
                              plan.completed ? 'line-through text-slate-500' : 'text-slate-900 font-semibold'
                            }`}
                          >
                            {plan.task}
                          </p>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              plan.completed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {plan.completed ? 'Done' : 'In Progress'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                          <span>Assignee: <strong className="text-slate-800">{plan.assignee}</strong> ({plan.department})</span>
                          <span className="font-mono">Due: <strong>{plan.dueDate}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Operational Scope & ISO 9001 Alignment */}
        <div className="space-y-6">
          {/* Operational Scope Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Operational Scope &amp; Ownership
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Department:
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {currentGoal.department || 'Plant-Wide QA'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Lead Owner:
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {currentGoal.ownerName}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-slate-400" /> Key Metric:
                </span>
                <span className="font-mono text-slate-800 truncate max-w-[170px]">
                  {currentGoal.targetMetric}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Launch Date:
                </span>
                <span className="font-mono text-slate-800">
                  {currentGoal.startDate || '2026-01-01'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Review Cycle:
                </span>
                <span className="font-semibold text-slate-800">
                  {currentGoal.reviewCycle || 'Quarterly Review'}
                </span>
              </div>
            </div>
          </div>

          {/* Strategic Rationale & Description */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Objective Charter &amp; Scope
            </h3>

            {currentGoal.description ? (
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {currentGoal.description}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Strategic objective established under annual Quality Management Review.
              </p>
            )}

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5 text-xs text-blue-900">
              <span className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> ISO 9001:2015 Clause 6.2 Compliance
              </span>
              <p className="text-[11px] text-blue-800 leading-snug">
                Quality objectives must be consistent with the Quality Policy, measurable, monitored, communicated, and updated as appropriate.
              </p>
              <div className="pt-1 text-[10px] text-slate-500 font-mono">
                Approved by: {currentGoal.approvedBy || 'Managing Directorate'}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
