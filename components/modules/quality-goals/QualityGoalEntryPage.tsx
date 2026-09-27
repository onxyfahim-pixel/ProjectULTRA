'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Target,
  Percent,
  Calendar,
  Building2,
  Clock,
  ShieldCheck,
  Flag,
  Plus,
  Trash2,
  Award,
} from 'lucide-react';
import {
  QualityGoal,
  GoalPillar,
  GoalStatus,
  GoalPriority,
  GoalMilestone,
  GoalActionPlan,
} from '@/lib/types/modules';

interface QualityGoalEntryPageProps {
  initialGoal?: QualityGoal | null;
  onSave: (goal: QualityGoal) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export function QualityGoalEntryPage({
  initialGoal,
  onSave,
  onCancel,
  showToast,
}: QualityGoalEntryPageProps) {
  const isEditing = Boolean(initialGoal);

  // Form State
  const [goalCode, setGoalCode] = useState(
    initialGoal?.goalCode || `QG-2026-${String(Math.floor(Math.random() * 90) + 10)}`
  );
  const [goalTitle, setGoalTitle] = useState(initialGoal?.goalTitle || '');
  const [pillar, setPillar] = useState<GoalPillar>(
    initialGoal?.pillar || 'DEFECT_REDUCTION'
  );
  const [priority, setPriority] = useState<GoalPriority>(
    initialGoal?.priority || 'HIGH'
  );
  const [department, setDepartment] = useState(
    initialGoal?.department || 'Sewing Production (Line 01-12)'
  );
  const [ownerName, setOwnerName] = useState(
    initialGoal?.ownerName || 'Tanzim Ahmed (Head of Quality)'
  );

  // Targets & Baselines
  const [targetMetric, setTargetMetric] = useState(
    initialGoal?.targetMetric || 'Sewing Defect Rate (DHU)'
  );
  const [baseline, setBaseline] = useState(
    initialGoal?.baseline || '2.8% DHU Average in 2025'
  );
  const [target, setTarget] = useState(
    initialGoal?.target || '< 1.5% DHU Factory Target'
  );
  const [currentAchievement, setCurrentAchievement] = useState(
    initialGoal?.currentAchievement || '1.8% Current Achievement'
  );
  const [percentageAchieved, setPercentageAchieved] = useState<number>(
    initialGoal?.percentageAchieved ?? 70
  );

  // Dates & Review
  const [startDate, setStartDate] = useState(
    initialGoal?.startDate || '2026-01-01'
  );
  const [deadline, setDeadline] = useState(
    initialGoal?.deadline || '2026-12-31'
  );
  const [reviewCycle, setReviewCycle] = useState<'QUARTERLY' | 'MONTHLY' | 'ANNUAL'>(
    initialGoal?.reviewCycle || 'QUARTERLY'
  );
  const [approvedBy, setApprovedBy] = useState(
    initialGoal?.approvedBy || 'Engr. M. A. Jalil (Managing Director)'
  );
  const [status, setStatus] = useState<GoalStatus>(
    initialGoal?.status || 'IN_PROGRESS'
  );
  const [description, setDescription] = useState(
    initialGoal?.description ||
      'Strategic quality objective established under ISO 9001:2015 Clause 6.2 to minimize rework and improve customer delivery compliance.'
  );

  // Milestones Builder
  const [milestones, setMilestones] = useState<GoalMilestone[]>(
    initialGoal?.milestones || [
      { id: 'm-1', title: 'Phase 1: Complete process capability study and baseline assessment', targetDate: '2026-03-31', completed: true, weightPercentage: 25 },
      { id: 'm-2', title: 'Phase 2: Deploy engineering retrofits and operator standard operating procedures', targetDate: '2026-06-30', completed: false, weightPercentage: 25 },
      { id: 'm-3', title: 'Phase 3: Conduct mid-year progress audit and calibration verification', targetDate: '2026-09-30', completed: false, weightPercentage: 25 },
      { id: 'm-4', title: 'Phase 4: Achieve sustained performance threshold for 60 consecutive days', targetDate: '2026-12-31', completed: false, weightPercentage: 25 },
    ]
  );
  const [newMsTitle, setNewMsTitle] = useState('');
  const [newMsDate, setNewMsDate] = useState('');

  // Action Initiatives Builder
  const [actionPlans, setActionPlans] = useState<GoalActionPlan[]>(
    initialGoal?.actionPlans || [
      { id: 'ap-1', task: 'Implement daily morning quality briefing across all production lines', assignee: 'Shamima Nasrin', department: 'Sewing', dueDate: '2026-10-15', completed: false },
    ]
  );
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');

  // Add Milestone
  const handleAddMilestone = () => {
    if (!newMsTitle.trim()) return;
    const newMs: GoalMilestone = {
      id: `m-${Date.now()}`,
      title: newMsTitle.trim(),
      targetDate: newMsDate || deadline,
      completed: false,
      weightPercentage: 25,
    };
    setMilestones([...milestones, newMs]);
    setNewMsTitle('');
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  // Add Action Plan
  const handleAddAction = () => {
    if (!newActionTask.trim() || !newActionAssignee.trim()) return;
    const newPlan: GoalActionPlan = {
      id: `ap-${Date.now()}`,
      task: newActionTask.trim(),
      assignee: newActionAssignee.trim(),
      department,
      dueDate: deadline,
      completed: false,
    };
    setActionPlans([...actionPlans, newPlan]);
    setNewActionTask('');
    setNewActionAssignee('');
  };

  const handleRemoveAction = (id: string) => {
    setActionPlans(actionPlans.filter((a) => a.id !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!goalTitle.trim()) {
      showToast('Please specify the quality objective title');
      return;
    }

    if (!target.trim() || !baseline.trim()) {
      showToast('Please specify baseline and target goals');
      return;
    }

    const goalToSave: QualityGoal = {
      id: initialGoal?.id || `qg-${Date.now()}`,
      goalCode: goalCode.trim().toUpperCase(),
      goalTitle: goalTitle.trim(),
      pillar,
      department: department.trim(),
      targetMetric: targetMetric.trim(),
      baseline: baseline.trim(),
      target: target.trim(),
      currentAchievement: currentAchievement.trim(),
      percentageAchieved: Number(percentageAchieved),
      ownerName: ownerName.trim(),
      startDate,
      deadline,
      status,
      priority,
      reviewCycle,
      approvedBy: approvedBy.trim(),
      description: description.trim(),
      milestones,
      actionPlans,
      lastReviewedDate: new Date().toISOString().split('T')[0],
      createdAt: initialGoal?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(goalToSave);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Header & Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Cancel and return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {goalCode}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {isEditing ? 'Edit Quality Objective' : 'New Quality Objective'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {isEditing ? `Edit: ${initialGoal?.goalTitle}` : 'Define Strategic Quality Policy Goal & Objective'}
            </h1>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Objective' : 'Publish Objective'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Objective Strategy & Scope */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Target className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Objective Strategy &amp; Identification
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Goal Ref Code *</label>
              <input
                type="text"
                value={goalCode}
                onChange={(e) => setGoalCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-blue-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Strategic Pillar *</label>
              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value as GoalPillar)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="CUSTOMER_SATISFACTION">Customer Satisfaction</option>
                <option value="DEFECT_REDUCTION">Defect Reduction (DHU)</option>
                <option value="PROCESS_EFFICIENCY">Process Efficiency &amp; Yield</option>
                <option value="COMPLIANCE_STANDARDS">Compliance &amp; Needle Safety</option>
                <option value="LAB_TESTING">Lab &amp; Testing Speed</option>
                <option value="SUSTAINABILITY">ESG &amp; Sustainability</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Strategic Objective Title *</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g., Achieve Zero Buyer Major Claims for A/W 2026 Season"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              >
                <option value="CRITICAL">Critical (Company Mandate)</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Responsible Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Sewing Lines 01-12 or Cutting Floor"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Goal Owner / Executive Lead</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g., Tanzim Ahmed (Head of Quality)"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Quantitative Targets & Baselines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Percent className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Quantitative Targets &amp; Baselines
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Key Metric *</label>
              <input
                type="text"
                value={targetMetric}
                onChange={(e) => setTargetMetric(e.target.value)}
                placeholder="e.g., Customer Claims Count, DHU Rate, TAT"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Baseline Starting Value *</label>
              <input
                type="text"
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
                placeholder="e.g., 7 Claims in 2025 or 3.4% DHU"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Quantitative Target Goal *</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g., 0 Major Claims or < 1.2% DHU"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-blue-700"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Current Milestone / Progress</label>
              <input
                type="text"
                value={currentAchievement}
                onChange={(e) => setCurrentAchievement(e.target.value)}
                placeholder="e.g., 1 Minor Claim (Settled) or 1.4% Rate reached"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-emerald-700"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Percentage Achieved (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={percentageAchieved}
                onChange={(e) => setPercentageAchieved(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Completion Deadline *</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Strategic Rationale & Governance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Strategic Scope &amp; Review Governance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Launch Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Review Cadence</label>
              <select
                value={reviewCycle}
                onChange={(e) => setReviewCycle(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
              >
                <option value="MONTHLY">Monthly Performance Review</option>
                <option value="QUARTERLY">Quarterly Executive Review</option>
                <option value="ANNUAL">Annual Management Audit</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Approved By</label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-semibold text-slate-700 block mb-1">Scope &amp; Technical Justification</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe alignment with Quality Policy, customer standards, and operational improvement goals..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Initial Milestone Roadmap */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Strategic Milestone Roadmaps ({milestones.length})
              </h2>
            </div>
          </div>

          {/* Add Milestone Row */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Milestone description..."
              value={newMsTitle}
              onChange={(e) => setNewMsTitle(e.target.value)}
              className="flex-1 p-2 rounded-lg border border-slate-200 bg-white text-xs"
            />
            <input
              type="date"
              value={newMsDate}
              onChange={(e) => setNewMsDate(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
            />
            <button
              type="button"
              onClick={handleAddMilestone}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shrink-0 cursor-pointer"
            >
              + Add Checkpoint
            </button>
          </div>

          {/* Milestones List */}
          <div className="space-y-2">
            {milestones.map((ms) => (
              <div
                key={ms.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-800 block truncate">{ms.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Target: {ms.targetDate}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(ms.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Objective' : 'Publish Objective'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
