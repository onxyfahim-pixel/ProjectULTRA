'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Clock,
  Layers,
  ArrowDown,
  Eye,
  Info,
  Check,
  X,
  Play,
  Edit3,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  Sun,
  Palette,
  Sparkles,
} from 'lucide-react';
import { ProcessFlowChart, ProcessFlowStep } from '@/lib/types/modules';

export interface ProcessFlowVisualTreeProps {
  flow: ProcessFlowChart;
  onSelectStep?: (step: ProcessFlowStep) => void;
  selectedStepId?: string;
  className?: string;
  onUpdateFlow?: (updatedFlow: ProcessFlowChart) => void;
  initialMode?: 'view' | 'edit';
  showEditorToggle?: boolean;
}

export function ProcessFlowVisualTree({
  flow,
  onSelectStep,
  selectedStepId,
  className = '',
  onUpdateFlow,
  initialMode = 'view',
  showEditorToggle = true,
}: ProcessFlowVisualTreeProps) {
  // Working copy for live canvas editing
  const [activeFlow, setActiveFlow] = useState<ProcessFlowChart>(flow);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Editor vs View Mode
  const [canvasMode, setCanvasMode] = useState<'view' | 'edit'>(initialMode);

  // Canvas Theme: 'white' (Default requested by user), 'grid' (Drafting paper), 'dark' (Night mode)
  const [canvasTheme, setCanvasTheme] = useState<'white' | 'grid' | 'dark'>('white');

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Inspecting / Editing Step
  const [inspectingStep, setInspectingStep] = useState<ProcessFlowStep | null>(
    activeFlow?.steps?.[0] || null
  );

  // Path Flow Simulation
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulatedPath, setSimulatedPath] = useState<'standard_pass' | 'rejection_rectify'>('standard_pass');

  // Sync external flow updates
  useEffect(() => {
    setActiveFlow(flow);
    setIsDirty(false);
  }, [flow]);

  // Sync inspecting step when steps or selectedStepId change
  useEffect(() => {
    if (!activeFlow?.steps || activeFlow.steps.length === 0) {
      setInspectingStep(null);
      return;
    }
    if (selectedStepId) {
      const match = activeFlow.steps.find((s) => s.id === selectedStepId);
      if (match) {
        setInspectingStep(match);
        return;
      }
    }
    if (!inspectingStep || !activeFlow.steps.some((s) => s.id === inspectingStep.id)) {
      setInspectingStep(activeFlow.steps[0]);
    }
  }, [activeFlow, selectedStepId]);

  if (!activeFlow) {
    return (
      <div className={`p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 ${className}`}>
        No process flow chart available to visualize.
      </div>
    );
  }

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(0.6, Number((prev + delta).toFixed(2))), 1.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleNodeClick = (step: ProcessFlowStep) => {
    setInspectingStep(step);
    onSelectStep?.(step);
  };

  // ----------------------------------------------------------------
  // LIVE CANVAS EDITOR ACTIONS
  // ----------------------------------------------------------------

  const updateCurrentStepField = <K extends keyof ProcessFlowStep>(
    field: K,
    val: ProcessFlowStep[K]
  ) => {
    if (!inspectingStep) return;
    const updatedStep = { ...inspectingStep, [field]: val };
    const updatedSteps = (activeFlow.steps || []).map((s) =>
      s.id === inspectingStep.id ? updatedStep : s
    );

    const updatedFlow: ProcessFlowChart = {
      ...activeFlow,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    };

    setActiveFlow(updatedFlow);
    setInspectingStep(updatedStep);
    setIsDirty(true);
    onUpdateFlow?.(updatedFlow);
  };

  const handleAddStepToFlow = () => {
    const steps = activeFlow.steps || [];
    const nextSeq = steps.length + 1;
    const newStep: ProcessFlowStep = {
      id: `step-${Date.now()}`,
      stepNumber: nextSeq,
      stageName: `NEW STAGE ${nextSeq}`,
      department: 'Sewing / Production Floor',
      inputMaterials: 'Semi-finished parts & component trims',
      transformation: 'Standard transformation operation specifications',
      qualityGate: '100% Quality Acceptance Criteria',
      standardTool: 'Industrial Sewing Machinery',
      leadTimeHours: 2,
      responsibleRole: 'Line QC Inspector',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
    };

    const updatedFlow: ProcessFlowChart = {
      ...activeFlow,
      steps: [...steps, newStep],
      updatedAt: new Date().toISOString(),
    };

    setActiveFlow(updatedFlow);
    setInspectingStep(newStep);
    setIsDirty(true);
    onUpdateFlow?.(updatedFlow);

    setSaveToast(`Added new stage #${nextSeq} to flowchart`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleAddBranchUnderNode = (parentId: string, customLabel?: string) => {
    const parent = (activeFlow.steps || []).find((s) => s.id === parentId);
    if (!parent) return;

    const existingChildren = (activeFlow.steps || []).filter((s) => s.parentStepId === parent.id);
    const branchLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const branchLetter = branchLetters[existingChildren.length] || `Stream ${existingChildren.length + 1}`;
    const defaultBranchLabel = customLabel || `Stream ${branchLetter}`;

    const steps = activeFlow.steps || [];
    const nextSeq = steps.length + 1;
    const newBranch: ProcessFlowStep = {
      id: `step-${Date.now()}-branch-${existingChildren.length + 1}`,
      stepNumber: nextSeq,
      stageName: `${defaultBranchLabel}: ${parent.stageName} Branch`,
      department: parent.department || 'Production Floor',
      inputMaterials: `Output from Stage ${parent.stepNumber}`,
      transformation: 'Specialized branch processing / alternative line operation',
      qualityGate: 'Branch Acceptance Specification',
      standardTool: 'Standard Tooling Station',
      leadTimeHours: 2,
      responsibleRole: parent.responsibleRole || 'Line Specialist',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      parentStepId: parent.id,
      branchLabel: defaultBranchLabel,
    };

    const parentIdx = steps.findIndex((s) => s.id === parent.id);
    const newSteps = [...steps];
    newSteps.splice(parentIdx + 1 + existingChildren.length, 0, newBranch);
    const renumbered = newSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

    const updatedFlow: ProcessFlowChart = {
      ...activeFlow,
      steps: renumbered,
      updatedAt: new Date().toISOString(),
    };

    setActiveFlow(updatedFlow);
    setInspectingStep(newBranch);
    setIsDirty(true);
    onUpdateFlow?.(updatedFlow);

    setSaveToast(`Added branch "${defaultBranchLabel}" under "${parent.stageName}"!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleAddThreeWaySplitUnderNode = (parentId: string) => {
    const parent = (activeFlow.steps || []).find((s) => s.id === parentId);
    if (!parent) return;

    const steps = activeFlow.steps || [];
    const nextSeq = steps.length + 1;

    const streamA: ProcessFlowStep = {
      id: `step-${Date.now()}-stream-a`,
      stepNumber: nextSeq,
      stageName: `Stream A: ${parent.stageName} Branch 1`,
      department: parent.department || 'Production Floor',
      inputMaterials: `Output from Stage ${parent.stepNumber}`,
      transformation: 'Parallel processing stream A',
      qualityGate: 'Acceptance Criteria Check',
      standardTool: 'Standard Machine A',
      leadTimeHours: 2,
      responsibleRole: parent.responsibleRole || 'Operator A',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      parentStepId: parent.id,
      branchLabel: 'Stream A',
    };

    const streamB: ProcessFlowStep = {
      id: `step-${Date.now()}-stream-b`,
      stepNumber: nextSeq + 1,
      stageName: `Stream B: ${parent.stageName} Branch 2`,
      department: parent.department || 'Production Floor',
      inputMaterials: `Output from Stage ${parent.stepNumber}`,
      transformation: 'Parallel processing stream B',
      qualityGate: 'Acceptance Criteria Check',
      standardTool: 'Standard Machine B',
      leadTimeHours: 2,
      responsibleRole: parent.responsibleRole || 'Operator B',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      parentStepId: parent.id,
      branchLabel: 'Stream B',
    };

    const streamC: ProcessFlowStep = {
      id: `step-${Date.now()}-stream-c`,
      stepNumber: nextSeq + 2,
      stageName: `Stream C: ${parent.stageName} Branch 3`,
      department: parent.department || 'Production Floor',
      inputMaterials: `Output from Stage ${parent.stepNumber}`,
      transformation: 'Parallel processing stream C',
      qualityGate: 'Acceptance Criteria Check',
      standardTool: 'Standard Machine C',
      leadTimeHours: 2,
      responsibleRole: parent.responsibleRole || 'Operator C',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      parentStepId: parent.id,
      branchLabel: 'Stream C',
    };

    const parentIdx = steps.findIndex((s) => s.id === parent.id);
    const newSteps = [...steps];
    newSteps.splice(parentIdx + 1, 0, streamA, streamB, streamC);
    const renumbered = newSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

    const updatedFlow: ProcessFlowChart = {
      ...activeFlow,
      steps: renumbered,
      updatedAt: new Date().toISOString(),
    };

    setActiveFlow(updatedFlow);
    setInspectingStep(streamA);
    setIsDirty(true);
    onUpdateFlow?.(updatedFlow);

    setSaveToast(`Split into 3 parallel branches (Stream A, B, C) under "${parent.stageName}"!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeleteStep = (stepId: string) => {
    const steps = (activeFlow.steps || []).filter((s) => s.id !== stepId);
    if (steps.length === 0) {
      alert('A flowchart must have at least one stage.');
      return;
    }
    const renumbered = steps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    const updatedFlow: ProcessFlowChart = {
      ...activeFlow,
      steps: renumbered,
      updatedAt: new Date().toISOString(),
    };

    setActiveFlow(updatedFlow);
    setInspectingStep(renumbered[0] || null);
    setIsDirty(true);
    onUpdateFlow?.(updatedFlow);

    setSaveToast('Stage removed from flowchart');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    const list = [...(activeFlow.steps || [])];
    const index = list.findIndex((s) => s.id === stepId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const renumbered = list.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    const updatedFlow: ProcessFlowChart = {
      ...activeFlow,
      steps: renumbered,
      updatedAt: new Date().toISOString(),
    };

    setActiveFlow(updatedFlow);
    setInspectingStep(list[targetIndex]);
    setIsDirty(true);
    onUpdateFlow?.(updatedFlow);
  };

  const handleManualSave = () => {
    onUpdateFlow?.(activeFlow);
    setIsDirty(false);
    setSaveToast('Flowchart changes saved successfully!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Only the fixed built-in reference flowchart uses the specialized sewing layout
  const isSewingFlow =
    activeFlow.id === 'pfc-sew-01' &&
    activeFlow.flowCode === 'PFC-SEW-01' &&
    (activeFlow.steps?.length || 0) >= 15;

  // Canvas background styles
  const isDark = canvasTheme === 'dark';
  const isGrid = canvasTheme === 'grid';

  const canvasBackgroundStyle = isDark
    ? {
        backgroundColor: '#090d16',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }
    : isGrid
    ? {
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1.2px, transparent 0)',
        backgroundSize: '20px 20px',
      }
    : {
        backgroundColor: '#ffffff', // Crisp pure white requested by user!
      };

  return (
    <div
      className={`relative bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col ${className}`}
    >
      {/* Toast feedback */}
      {saveToast && (
        <div className="absolute top-16 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* TOP TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {/* Canvas Mode Indicator & Switcher */}
          {showEditorToggle ? (
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold border border-slate-300">
              <button
                type="button"
                onClick={() => setCanvasMode('view')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  canvasMode === 'view'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>View & Trace</span>
              </button>
              <button
                type="button"
                onClick={() => setCanvasMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  canvasMode === 'edit'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Live Canvas Editor</span>
              </button>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>White Canvas Visual Tree</span>
            </div>
          )}

          {isDirty && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Unsaved Edits</span>
            </span>
          )}
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Editor Mode Controls */}
          {canvasMode === 'edit' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddStepToFlow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Add a new stage to this flowchart"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Node</span>
              </button>
              <button
                type="button"
                onClick={handleManualSave}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Commit and save all changes"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Tree</span>
              </button>
            </div>
          ) : (
            /* Path Simulation Toggle in View Mode */
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSimulationActive(true);
                  setSimulatedPath('standard_pass');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  simulationActive && simulatedPath === 'standard_pass'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pass Route
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulationActive(true);
                  setSimulatedPath('rejection_rectify');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  simulationActive && simulatedPath === 'rejection_rectify'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rework Route
              </button>
              {simulationActive && (
                <button
                  type="button"
                  onClick={() => setSimulationActive(false)}
                  className="px-2 py-1 text-slate-400 hover:text-slate-700 text-[11px] font-mono cursor-pointer"
                  title="Clear simulation highlight"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Canvas Background Theme Switcher */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setCanvasTheme('white')}
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                canvasTheme === 'white'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Crisp Pure White Canvas (Default)"
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">White</span>
            </button>
            <button
              type="button"
              onClick={() => setCanvasTheme('grid')}
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                canvasTheme === 'grid'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Architectural Drafting Grid Paper"
            >
              <Palette className="w-3 h-3 text-blue-500" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setCanvasTheme('dark')}
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                canvasTheme === 'dark'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Dark Mode Drafting"
            >
              <span className="hidden sm:inline">Dark</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 text-[11px] font-mono text-slate-700 hover:text-slate-900 transition-colors cursor-pointer font-bold"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Sub-Header for Live Editor Mode Notice */}
      {canvasMode === 'edit' && (
        <div className="px-5 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>
              <strong>Live Canvas Editor Active:</strong> Click any node on the canvas to edit its name, shape, action tags, and cycle times in real-time.
            </span>
          </div>
          <span className="font-mono text-[11px] text-blue-700 font-bold">
            {(activeFlow.steps || []).length} Total Nodes
          </span>
        </div>
      )}

      {/* MAIN FLOW CANVAS (WHITE BACKGROUND) */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto p-6 md:p-12 min-h-[700px] max-h-[850px] flex flex-col items-center select-none transition-colors duration-200"
        style={canvasBackgroundStyle}
      >
        <div
          className="transition-transform duration-200 origin-top flex flex-col items-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* OFFICIAL CHART HEADER BANNER (Authentic framed box matching image) */}
          <div className="mb-8 text-center">
            <div
              className={`inline-block px-8 py-2 rounded-md border-2 shadow-sm ${
                isDark
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                  : 'bg-white border-green-800 text-green-900'
              }`}
            >
              <h1 className="text-sm md:text-base font-extrabold tracking-widest uppercase font-mono">
                {activeFlow.title.toUpperCase() || 'SEWING SECTION FLOW CHART'}
              </h1>
            </div>
            <div
              className={`text-[11px] font-mono mt-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Doc Ref: {activeFlow.flowCode} • Quality Standard: ISO 9001:2015 Clause 8.1 / 8.5
            </div>
          </div>

          {/* TREE STRUCTURE */}
          {isSewingFlow ? (
            <SewingSectionTreeDiagram
              flow={activeFlow}
              inspectingStep={inspectingStep}
              onNodeClick={handleNodeClick}
              simulationActive={simulationActive}
              simulatedPath={simulatedPath}
              isDark={isDark}
              isEditorMode={canvasMode === 'edit'}
            />
          ) : (
            <GenericSequentialTreeDiagram
              flow={activeFlow}
              inspectingStep={inspectingStep}
              onNodeClick={handleNodeClick}
              simulationActive={simulationActive}
              isDark={isDark}
              isEditorMode={canvasMode === 'edit'}
            />
          )}
        </div>
      </div>

      {/* NODE INSPECTOR & LIVE EDITOR DRAWER */}
      {inspectingStep && (
        <div
          className={`p-4 border-t transition-colors duration-200 ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-100'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          {canvasMode === 'edit' ? (
            /* LIVE CANVAS NODE EDITOR CONTROLS */
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Editing Node #{inspectingStep.stepNumber}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    Canvas Node Properties Inspector
                  </h4>
                </div>

                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddBranchUnderNode(inspectingStep.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                    title="Add a parallel branch directly connected under this node"
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>+ Add Branch Under Here</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddThreeWaySplitUnderNode(inspectingStep.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition-colors shadow-2xs cursor-pointer"
                    title="Split this node into 3 parallel branches (Stream A, B, C)"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>+ 3-Way Split (A/B/C)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveStep(inspectingStep.id, 'up')}
                    disabled={inspectingStep.stepNumber === 1}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 cursor-pointer ml-1"
                    title="Move Step Up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveStep(inspectingStep.id, 'down')}
                    disabled={inspectingStep.stepNumber === (activeFlow.steps?.length || 0)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                    title="Move Step Down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStep(inspectingStep.id)}
                    className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer ml-1"
                    title="Delete Node from Canvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Node Live Editable Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Node Title */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">
                    Node Stage Name (Live on Canvas)
                  </label>
                  <input
                    type="text"
                    value={inspectingStep.stageName}
                    onChange={(e) => updateCurrentStepField('stageName', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    placeholder="Enter stage name..."
                  />
                </div>

                {/* Parent Node (Branch Origin) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-indigo-700 block flex items-center gap-1">
                    <GitCommit className="w-3 h-3 text-indigo-600" />
                    <span>Parent Node (Branch Origin)</span>
                  </label>
                  <select
                    value={inspectingStep.parentStepId || ''}
                    onChange={(e) => {
                      const pId = e.target.value || undefined;
                      updateCurrentStepField('parentStepId', pId);
                      if (pId && !inspectingStep.branchLabel) {
                        updateCurrentStepField('branchLabel', 'Stream A');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 font-medium text-slate-800 text-xs"
                  >
                    <option value="">-- Main Stream (Root) --</option>
                    {(activeFlow.steps || [])
                      .filter((s) => s.id !== inspectingStep.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          Branch under #{s.stepNumber}: {s.stageName.slice(0, 22)}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Branch Label / Stream */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-blue-700 block">
                    Branch Label / Stream
                  </label>
                  <input
                    type="text"
                    value={inspectingStep.branchLabel || inspectingStep.decisionBranch || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateCurrentStepField('branchLabel', val);
                      updateCurrentStepField('decisionBranch', val);
                    }}
                    placeholder="e.g. Stream A, PASS, FAIL..."
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 font-medium text-slate-800 text-xs"
                  />
                </div>

                {/* Node Shape */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">
                    Node Canvas Shape
                  </label>
                  <select
                    value={inspectingStep.shape || 'rectangle'}
                    onChange={(e) => updateCurrentStepField('shape', e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 font-medium text-slate-800"
                  >
                    <option value="rectangle">Standard Rectangle</option>
                    <option value="oval">Oval / Capsule (Terminal)</option>
                    <option value="diamond">Diamond (Decision Gate)</option>
                  </select>
                </div>

                {/* Documentation Action Tag */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-amber-700 block">
                    Side Action Tag
                  </label>
                  <select
                    value={inspectingStep.actionTag || ''}
                    onChange={(e) => updateCurrentStepField('actionTag', e.target.value || undefined)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 font-medium text-slate-800"
                  >
                    <option value="">No Action Tag</option>
                    <option value="KEEP RECORD">KEEP RECORD (Gold Tag)</option>
                    <option value="MAKE REPORT">MAKE REPORT (Orange Tag)</option>
                    <option value="MAKE RECORD">MAKE RECORD (Yellow Tag)</option>
                  </select>
                </div>

                {/* Tag Position */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">
                    Tag Side Position
                  </label>
                  <select
                    value={inspectingStep.actionTagPosition || 'right'}
                    onChange={(e) => updateCurrentStepField('actionTagPosition', e.target.value as any)}
                    disabled={!inspectingStep.actionTag}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 font-medium text-slate-800 disabled:opacity-40"
                  >
                    <option value="right">Right Side (Standard)</option>
                    <option value="left">Left Side</option>
                  </select>
                </div>

                {/* Machinery / Tool */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">
                    Standard Tool / Machinery
                  </label>
                  <input
                    type="text"
                    value={inspectingStep.standardTool || ''}
                    onChange={(e) => updateCurrentStepField('standardTool', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-mono text-[11px]"
                    placeholder="e.g. Juki DDL-9000C"
                  />
                </div>

                {/* Lead Time Hours */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">
                    Cycle Time (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={inspectingStep.leadTimeHours || 1}
                    onChange={(e) => updateCurrentStepField('leadTimeHours', Number(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono font-bold"
                  />
                </div>

                {/* Critical Gate Checkbox */}
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(inspectingStep.criticalGate)}
                      onChange={(e) => updateCurrentStepField('criticalGate', e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-xs text-rose-700">
                      Mandatory Quality Gate (!)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE INSPECTOR (CLEAN TECHNICAL SUMMARY) */
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Step #{inspectingStep.stepNumber}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                    {inspectingStep.stageName}
                  </h3>
                  {inspectingStep.criticalGate && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Critical Quality Gate</span>
                    </span>
                  )}
                  {inspectingStep.actionTag && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {inspectingStep.actionTag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Transformation:</strong> {inspectingStep.transformation}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-1">
                  <span><strong>Gate Spec:</strong> {inspectingStep.qualityGate}</span>
                  <span><strong>Machine:</strong> {inspectingStep.standardTool}</span>
                  <span><strong>Role:</strong> {inspectingStep.responsibleRole || inspectingStep.department}</span>
                  <span><strong>Lead Time:</strong> {inspectingStep.leadTimeHours}h</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCanvasMode('edit')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit on Canvas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// EXACT SEWING SECTION TREE DIAGRAM MATCHING USER'S IMAGE
// (Rendered with crisp white canvas aesthetics)
// -------------------------------------------------------------
function SewingSectionTreeDiagram({
  flow,
  inspectingStep,
  onNodeClick,
  simulationActive,
  simulatedPath,
  isDark = false,
  isEditorMode = false,
}: {
  flow: ProcessFlowChart;
  inspectingStep: ProcessFlowStep | null;
  onNodeClick: (step: ProcessFlowStep) => void;
  simulationActive: boolean;
  simulatedPath: 'standard_pass' | 'rejection_rectify';
  isDark?: boolean;
  isEditorMode?: boolean;
}) {
  const steps = flow.steps || [];

  const getStep = (idx: number, fallbackName: string) => {
    return (
      steps[idx] || {
        id: `virtual-${idx}`,
        stepNumber: idx + 1,
        stageName: fallbackName,
        department: 'Sewing Department',
        inputMaterials: 'Standard Garment Assembly',
        transformation: `Standard operation for ${fallbackName}`,
        qualityGate: '100% Quality Acceptance',
        standardTool: 'Standard Machinery',
        leadTimeHours: 1,
        shape: 'rectangle',
      }
    );
  };

  const step1 = getStep(0, 'PRE PRODUCTION MEETING');
  const step2 = getStep(1, 'SEND TO SEWING');
  const step3 = getStep(2, 'MAKE TRIM CARD');
  const step4 = getStep(3, 'DUPLICATE COUNTER SAMPLE');
  const step5 = getStep(4, 'BACK FRONT MATCHING IF RQRD');
  const step6 = getStep(5, 'SPI MONITORING');
  const step7 = getStep(6, 'CRITICAL PROCESS 100 % CHECK');
  const step8 = getStep(7, 'KEY MEASUREMENT AREA CHECK');
  const step9 = getStep(8, 'PRODUCTION AND QUALITY MEETING TO REVIEW THE ROOT CAUSE OF REJECTION');

  // Branch steps
  const stepTraffic = getStep(9, 'TRAFFIC LIGHT SYSTEM');
  const stepLabel = getStep(10, 'LABEL CHECK');
  const stepFirstOutput = getStep(11, 'FIRST OUTPUT CHECK WITH C/S');
  const stepInitialCheck = getStep(12, 'INITIAL CHECK');
  const stepSendFinishing = getStep(13, 'SEND TO FINISHING');
  const stepReturnRectify = getStep(14, 'RETURN TO SEWING FOR RECTIFY');
  const stepReinspection = getStep(15, 'RE-INSPECTION');

  // Fail branch steps
  const stepStopAdjust = getStep(16, 'STOP PRODUCTION & ADJUST MACHINE');
  const stepKeyMeasureFinished = getStep(17, 'KEY MEASUREMENT CHECK AGAINST FINISHED PATTERN');

  return (
    <div className="flex flex-col items-center w-full max-w-[960px] relative">
      {/* 1. PRE PRODUCTION MEETING (Oval/Capsule) */}
      <div className="relative flex items-center justify-center w-full">
        <button
          type="button"
          onClick={() => onNodeClick(step1)}
          className={`w-[260px] py-2.5 px-4 rounded-full text-center transition-all cursor-pointer font-bold text-xs uppercase tracking-wide border-2 shadow-sm ${
            inspectingStep?.id === step1.id
              ? 'bg-sky-400 text-slate-950 border-blue-600 ring-4 ring-sky-300'
              : 'bg-sky-400 hover:bg-sky-300 text-slate-950 border-sky-600'
          }`}
        >
          {step1.stageName}
        </button>

        {/* Side Tag: KEEP RECORD */}
        <div className="absolute left-[calc(50%+140px)] flex items-center gap-1.5">
          <div className="w-5 h-0.5 bg-slate-800" />
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-slate-800" />
          <span className="px-3 py-1 bg-amber-400 border border-amber-600 rounded font-black text-[10px] text-slate-950 uppercase tracking-wider shadow-xs font-mono whitespace-nowrap">
            {step1.actionTag || 'KEEP RECORD'}
          </span>
        </div>
      </div>

      <TreeArrowDown isDark={isDark} />

      {/* 2. SEND TO SEWING (Rectangle) */}
      <FlowNodeRect
        step={step2}
        isSelected={inspectingStep?.id === step2.id}
        onClick={() => onNodeClick(step2)}
      />

      <TreeArrowDown isDark={isDark} />

      {/* 3. MAKE TRIM CARD (Rectangle + Left Tag: KEEP RECORD) */}
      <div className="relative flex items-center justify-center w-full">
        {/* Left Tag */}
        <div className="absolute right-[calc(50%+140px)] flex items-center gap-1.5">
          <span className="px-3 py-1 bg-amber-400 border border-amber-600 rounded font-black text-[10px] text-slate-950 uppercase tracking-wider shadow-xs font-mono whitespace-nowrap">
            {step3.actionTag || 'KEEP RECORD'}
          </span>
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-slate-800" />
          <div className="w-5 h-0.5 bg-slate-800" />
        </div>

        <FlowNodeRect
          step={step3}
          isSelected={inspectingStep?.id === step3.id}
          onClick={() => onNodeClick(step3)}
        />
      </div>

      <TreeArrowDown isDark={isDark} />

      {/* 4. DUPLICATE COUNTER SAMPLE */}
      <FlowNodeRect
        step={step4}
        isSelected={inspectingStep?.id === step4.id}
        onClick={() => onNodeClick(step4)}
      />

      <TreeArrowDown isDark={isDark} />

      {/* 5. BACK FRONT MATCHING IF RQRD */}
      <FlowNodeRect
        step={step5}
        isSelected={inspectingStep?.id === step5.id}
        onClick={() => onNodeClick(step5)}
      />

      <TreeArrowDown isDark={isDark} />

      {/* 6. SPI MONITORING */}
      <FlowNodeRect
        step={step6}
        isSelected={inspectingStep?.id === step6.id}
        onClick={() => onNodeClick(step6)}
      />

      <TreeArrowDown isDark={isDark} />

      {/* 7. CRITICAL PROCESS 100 % CHECK (Right Tag: MAKE REPORT) */}
      <div className="relative flex items-center justify-center w-full">
        <FlowNodeRect
          step={step7}
          isSelected={inspectingStep?.id === step7.id}
          onClick={() => onNodeClick(step7)}
        />

        <div className="absolute left-[calc(50%+140px)] flex items-center gap-1.5">
          <div className="w-5 h-0.5 bg-slate-800" />
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-slate-800" />
          <span className="px-3 py-1 bg-amber-400 border border-amber-600 rounded font-black text-[10px] text-slate-950 uppercase tracking-wider shadow-xs font-mono whitespace-nowrap">
            {step7.actionTag || 'MAKE REPORT'}
          </span>
        </div>
      </div>

      <TreeArrowDown isDark={isDark} />

      {/* 8. KEY MEASUREMENT AREA CHECK (Right Tag: MAKE REPORT) */}
      <div className="relative flex items-center justify-center w-full">
        <FlowNodeRect
          step={step8}
          isSelected={inspectingStep?.id === step8.id}
          onClick={() => onNodeClick(step8)}
        />

        <div className="absolute left-[calc(50%+140px)] flex items-center gap-1.5">
          <div className="w-5 h-0.5 bg-slate-800" />
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-slate-800" />
          <span className="px-3 py-1 bg-amber-400 border border-amber-600 rounded font-black text-[10px] text-slate-950 uppercase tracking-wider shadow-xs font-mono whitespace-nowrap">
            {step8.actionTag || 'MAKE REPORT'}
          </span>
        </div>
      </div>

      <TreeArrowDown isDark={isDark} />

      {/* 9. ROOT CAUSE REVIEW MEETING (Wide Rectangle) */}
      <FlowNodeRect
        step={step9}
        isSelected={inspectingStep?.id === step9.id}
        onClick={() => onNodeClick(step9)}
        className="w-[320px] max-w-[340px]"
      />

      {/* MAIN SPLIT CONNECTOR (T-Junction) */}
      <div className="w-full flex justify-center my-1 relative">
        <svg width="920" height="34" className="overflow-visible pointer-events-none">
          {/* Vertical stem from step 9 */}
          <line x1="460" y1="0" x2="460" y2="16" stroke="#1e293b" strokeWidth="2.5" />
          {/* Horizontal crossbar */}
          <line x1="220" y1="16" x2="700" y2="16" stroke="#1e293b" strokeWidth="2.5" />
          {/* Left drop toward PASS */}
          <line x1="220" y1="16" x2="220" y2="34" stroke="#1e293b" strokeWidth="2.5" />
          <polygon points="216,29 224,29 220,34" fill="#1e293b" />
          {/* Right drop toward FAIL */}
          <line x1="700" y1="16" x2="700" y2="34" stroke="#1e293b" strokeWidth="2.5" />
          <polygon points="696,29 704,29 700,34" fill="#1e293b" />
        </svg>
      </div>

      {/* DUAL DECISION BRANCHES: PASS (LEFT) vs FAIL (RIGHT) */}
      <div className="flex justify-center items-start gap-10 w-full max-w-[920px] pt-1">
        {/* ================= LEFT BRANCH: PASS ROUTE ================= */}
        <div
          className={`flex flex-col items-center w-[440px] shrink-0 p-3 rounded-2xl transition-all ${
            simulationActive && simulatedPath === 'standard_pass'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/50'
              : ''
          }`}
        >
          {/* PASS Diamond */}
          <DecisionDiamond label="PASS" variant="pass" />

          <TreeArrowDown isDark={isDark} />

          {/* 10. TRAFFIC LIGHT SYSTEM (with left tag: MAKE RECORD) */}
          <div className="relative flex items-center justify-center w-full">
            <div className="absolute right-[calc(50%+135px)] flex items-center gap-1">
              <span className="px-2.5 py-1 bg-amber-400 border border-amber-600 rounded font-black text-[9px] text-slate-950 uppercase tracking-wider font-mono shadow-xs whitespace-nowrap">
                {stepTraffic.actionTag || 'MAKE RECORD'}
              </span>
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-slate-800" />
              <div className="w-3.5 h-0.5 bg-slate-800" />
            </div>

            <FlowNodeRect
              step={stepTraffic}
              isSelected={inspectingStep?.id === stepTraffic.id}
              onClick={() => onNodeClick(stepTraffic)}
              className="w-[240px]"
            />
          </div>

          <TreeArrowDown isDark={isDark} />

          {/* 11. LABEL CHECK */}
          <FlowNodeRect
            step={stepLabel}
            isSelected={inspectingStep?.id === stepLabel.id}
            onClick={() => onNodeClick(stepLabel)}
            className="w-[240px]"
          />

          <TreeArrowDown isDark={isDark} />

          {/* 12. FIRST OUTPUT CHECK WITH C/S */}
          <FlowNodeRect
            step={stepFirstOutput}
            isSelected={inspectingStep?.id === stepFirstOutput.id}
            onClick={() => onNodeClick(stepFirstOutput)}
            className="w-[240px]"
          />

          <TreeArrowDown isDark={isDark} />

          {/* 13. INITIAL CHECK (with left tag: MAKE REPORT) */}
          <div className="relative flex items-center justify-center w-full">
            <div className="absolute right-[calc(50%+135px)] flex items-center gap-1">
              <span className="px-2.5 py-1 bg-amber-400 border border-amber-600 rounded font-black text-[9px] text-slate-950 uppercase tracking-wider font-mono shadow-xs whitespace-nowrap">
                {stepInitialCheck.actionTag || 'MAKE REPORT'}
              </span>
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-slate-800" />
              <div className="w-3.5 h-0.5 bg-slate-800" />
            </div>

            <FlowNodeRect
              step={stepInitialCheck}
              isSelected={inspectingStep?.id === stepInitialCheck.id}
              onClick={() => onNodeClick(stepInitialCheck)}
              className="w-[240px]"
            />
          </div>

          {/* SPLIT UNDER INITIAL CHECK: PASS vs FAIL */}
          <div className="w-full flex justify-center my-1 relative">
            <svg width="440" height="30" className="overflow-visible pointer-events-none">
              <line x1="220" y1="0" x2="220" y2="14" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="112" y1="14" x2="328" y2="14" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="112" y1="14" x2="112" y2="30" stroke="#1e293b" strokeWidth="2.5" />
              <polygon points="108,25 116,25 112,30" fill="#1e293b" />
              <line x1="328" y1="14" x2="328" y2="30" stroke="#1e293b" strokeWidth="2.5" />
              <polygon points="324,25 332,25 328,30" fill="#1e293b" />
            </svg>
          </div>

          {/* SUB-BRANCHES */}
          <div className="relative w-full flex justify-center pt-1">
            <div className="grid grid-cols-2 gap-8 w-[402px] relative pb-8">
              {/* PASS Sub-Branch -> SEND TO FINISHING */}
              <div className="flex flex-col items-center w-[185px]">
                <DecisionDiamond label="PASS" variant="pass" small />
                <TreeArrowDown isDark={isDark} />
                <FlowNodeRect
                  step={stepSendFinishing}
                  isSelected={inspectingStep?.id === stepSendFinishing.id}
                  onClick={() => onNodeClick(stepSendFinishing)}
                  className="w-[185px] min-w-0 max-w-[185px] py-2 px-2 text-[10px] leading-tight"
                />
              </div>

              {/* FAIL Sub-Branch -> RETURN TO SEWING FOR RECTIFY -> RE-INSPECTION -> PASS */}
              <div className="flex flex-col items-center w-[185px] relative">
                <DecisionDiamond label="FAIL" variant="fail" small />
                <TreeArrowDown isDark={isDark} />

                <FlowNodeRect
                  step={stepReturnRectify}
                  isSelected={inspectingStep?.id === stepReturnRectify.id}
                  onClick={() => onNodeClick(stepReturnRectify)}
                  className="w-[185px] min-w-0 max-w-[185px] py-2 px-2 text-[10px] leading-tight"
                />

                <TreeArrowDown isDark={isDark} />

                <FlowNodeRect
                  step={stepReinspection}
                  isSelected={inspectingStep?.id === stepReinspection.id}
                  onClick={() => onNodeClick(stepReinspection)}
                  className="w-[185px] min-w-0 max-w-[185px] py-2 px-2 text-[10px] leading-tight"
                />

                <TreeArrowDown isDark={isDark} />

                <DecisionDiamond label="PASS" variant="pass" small />
              </div>

              {/* Loopback arrow: RE-INSPECTION PASS -> SEND TO FINISHING */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              >
                <path
                  d="M 310 248 L 310 268 L 92 268 L 92 106"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
                <polygon points="87,110 97,110 92,102" fill="#10b981" />
              </svg>
            </div>
          </div>
        </div>

        {/* ================= RIGHT BRANCH: FAIL REWORK LOOP ================= */}
        <div
          className={`flex flex-col items-center w-[440px] shrink-0 p-3 rounded-2xl transition-all relative ${
            simulationActive && simulatedPath === 'rejection_rectify'
              ? 'ring-2 ring-rose-500 bg-rose-50/50'
              : ''
          }`}
        >
          {/* FAIL Diamond */}
          <DecisionDiamond label="FAIL" variant="fail" />

          <TreeArrowDown isDark={isDark} />

          {/* 14. STOP PRODUCTION & ADJUST MACHINE */}
          <div className="relative flex items-center justify-center w-full">
            <FlowNodeRect
              step={stepStopAdjust}
              isSelected={inspectingStep?.id === stepStopAdjust.id}
              onClick={() => onNodeClick(stepStopAdjust)}
              className="w-[240px]"
            />

            <div className="absolute left-[calc(50%+130px)] flex items-center gap-1">
              <div className="w-3.5 h-0.5 bg-slate-800" />
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-slate-800" />
              <span className="px-2.5 py-1 bg-amber-400 border border-amber-600 rounded font-black text-[9px] text-slate-950 uppercase tracking-wider font-mono shadow-xs whitespace-nowrap">
                {stepStopAdjust.actionTag || 'MAKE REPORT'}
              </span>
            </div>
          </div>

          <TreeArrowDown isDark={isDark} />

          {/* 15. KEY MEASUREMENT CHECK AGAINST FINISHED PATTERN */}
          <FlowNodeRect
            step={stepKeyMeasureFinished}
            isSelected={inspectingStep?.id === stepKeyMeasureFinished.id}
            onClick={() => onNodeClick(stepKeyMeasureFinished)}
            className="w-[250px]"
          />

          <TreeArrowDown isDark={isDark} />

          {/* PASS Diamond looping back to Traffic Light System */}
          <div className="relative flex items-center justify-center w-full my-2">
            <DecisionDiamond label="PASS" variant="pass" />

            {/* Loopback SVG returning into left branch TRAFFIC LIGHT SYSTEM */}
            <svg
              width="500"
              height="350"
              className="absolute -left-[300px] top-[26px] pointer-events-none overflow-visible"
            >
              <path
                d="M 520 0 L 520 28 L 280 28 L 280 -255 L 195 -255"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />
              <polygon points="199,-259 199,-251 193,-255" fill="#059669" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// GENERIC SEQUENTIAL / BRANCHING TREE FOR ANY PROCESS FLOW
// -------------------------------------------------------------
// -------------------------------------------------------------
// MULTI-BRANCH SPLIT CONNECTOR & BADGES
// -------------------------------------------------------------
function MultiBranchSplitConnector({
  branchCount,
  colWidth = 190,
  gap = 24,
  isDark = false,
}: {
  branchCount: number;
  colWidth?: number;
  gap?: number;
  isDark?: boolean;
}) {
  const strokeColor = isDark ? '#cbd5e1' : '#1e293b';
  const totalWidth = Math.max(320, branchCount * colWidth + (branchCount - 1) * gap);
  const parentCenter = totalWidth / 2;

  const colCenters = Array.from(
    { length: branchCount },
    (_, i) => i * (colWidth + gap) + colWidth / 2
  );
  const leftX = colCenters[0];
  const rightX = colCenters[colCenters.length - 1];

  return (
    <div className="w-full flex justify-center my-1 relative overflow-visible">
      <svg
        width={totalWidth}
        height="32"
        className="overflow-visible pointer-events-none"
      >
        {/* Stem down from parent node center */}
        <line x1={parentCenter} y1="0" x2={parentCenter} y2="16" stroke={strokeColor} strokeWidth="2.5" />
        {/* Horizontal crossbar across all branch column centers */}
        <line x1={leftX} y1="16" x2={rightX} y2="16" stroke={strokeColor} strokeWidth="2.5" />
        {/* Drop arrows to each branch column */}
        {colCenters.map((cx, idx) => (
          <React.Fragment key={idx}>
            <line x1={cx} y1="16" x2={cx} y2="32" stroke={strokeColor} strokeWidth="2.5" />
            <polygon points={`${cx - 4},27 ${cx + 4},27 ${cx},32`} fill={strokeColor} />
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
}

function BranchHeaderBadge({
  label,
  isDark = false,
}: {
  label: string;
  isDark?: boolean;
}) {
  const upper = label?.trim().toUpperCase() || '';
  if (upper === 'PASS') {
    return <DecisionDiamond label="PASS" variant="pass" small />;
  }
  if (upper === 'FAIL') {
    return <DecisionDiamond label="FAIL" variant="fail" small />;
  }

  // Color scheme based on stream letter / keyword
  let badgeStyle = 'text-blue-800 bg-blue-50 border-blue-200';
  if (upper.includes('A') || upper.includes('LEFT') || upper.includes('1')) {
    badgeStyle = 'text-sky-800 bg-sky-50 border-sky-300';
  } else if (upper.includes('B') || upper.includes('RIGHT') || upper.includes('2')) {
    badgeStyle = 'text-indigo-800 bg-indigo-50 border-indigo-300';
  } else if (upper.includes('C') || upper.includes('3')) {
    badgeStyle = 'text-amber-800 bg-amber-50 border-amber-300';
  } else if (upper.includes('D') || upper.includes('4')) {
    badgeStyle = 'text-purple-800 bg-purple-50 border-purple-300';
  } else if (upper.includes('REWORK')) {
    badgeStyle = 'text-rose-800 bg-rose-50 border-rose-300';
  }

  if (label && label.trim() !== '') {
    return (
      <span
        className={`text-[10px] font-mono font-bold uppercase tracking-wider border px-3 py-1 rounded-full mb-1 shadow-2xs ${badgeStyle}`}
      >
        {label}
      </span>
    );
  }
  return null;
}

// -------------------------------------------------------------
// GENERIC SEQUENTIAL / MULTI-BRANCHING TREE FOR ANY PROCESS FLOW
// -------------------------------------------------------------
function GenericSequentialTreeDiagram({
  flow,
  inspectingStep,
  onNodeClick,
  simulationActive,
  isDark = false,
  isEditorMode = false,
}: {
  flow: ProcessFlowChart;
  inspectingStep: ProcessFlowStep | null;
  onNodeClick: (step: ProcessFlowStep) => void;
  simulationActive: boolean;
  isDark?: boolean;
  isEditorMode?: boolean;
}) {
  const steps = flow.steps || [];

  // Group steps by their hierarchy / branching
  const stepIdSet = new Set(steps.map((s) => s.id));
  const childStepsByParentId: Record<string, ProcessFlowStep[]> = {};
  const isBranchChild: Record<string, boolean> = {};

  steps.forEach((s) => {
    if (s.parentStepId && stepIdSet.has(s.parentStepId)) {
      if (!childStepsByParentId[s.parentStepId]) {
        childStepsByParentId[s.parentStepId] = [];
      }
      childStepsByParentId[s.parentStepId].push(s);
      isBranchChild[s.id] = true;
    }
  });

  // Also support legacy/convenience decisionBranch (PASS, FAIL, LEFT, RIGHT) when parentStepId not explicitly given
  steps.forEach((s, idx) => {
    if (!isBranchChild[s.id] && s.decisionBranch && s.decisionBranch !== 'ROOT') {
      for (let pIdx = idx - 1; pIdx >= 0; pIdx--) {
        if (!isBranchChild[steps[pIdx].id] && (!steps[pIdx].decisionBranch || steps[pIdx].decisionBranch === 'ROOT')) {
          const parentId = steps[pIdx].id;
          if (!childStepsByParentId[parentId]) {
            childStepsByParentId[parentId] = [];
          }
          childStepsByParentId[parentId].push(s);
          isBranchChild[s.id] = true;
          break;
        }
      }
    }
  });

  // Top-level main stream steps
  const mainSteps = steps.filter((s) => !isBranchChild[s.id]);

  const renderNodeElement = (st: ProcessFlowStep, isFirst: boolean, isLast: boolean) => {
    const isSelected = inspectingStep?.id === st.id;
    const isDiamond = st.shape === 'diamond' || st.nodeType === 'DECISION';
    const isOval = st.shape === 'oval' || st.nodeType === 'START' || st.nodeType === 'END' || isFirst;

    return (
      <div className="relative flex items-center justify-center w-full">
        {/* Left Action Tag */}
        {st.actionTag && st.actionTagPosition === 'left' && (
          <div className="absolute right-[calc(50%+140px)] flex items-center gap-1.5 z-10">
            <span className="px-3 py-1 bg-amber-400 border border-amber-600 rounded font-black text-[10px] text-slate-950 uppercase tracking-wider font-mono shadow-xs whitespace-nowrap">
              {st.actionTag}
            </span>
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-slate-800" />
            <div className="w-4 h-0.5 bg-slate-800" />
          </div>
        )}

        {/* Node Shape */}
        {isDiamond ? (
          <div className="relative flex items-center justify-center my-3">
            <button
              type="button"
              onClick={() => onNodeClick(st)}
              className={`w-28 h-28 rotate-45 rounded-md border-2 shadow-sm flex items-center justify-center cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 border-amber-600 ring-4 ring-amber-300'
                  : st.criticalGate
                  ? 'bg-rose-500 hover:bg-rose-400 text-white border-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
              }`}
            />
            <span
              onClick={() => onNodeClick(st)}
              className="absolute font-bold text-[10px] uppercase tracking-wide text-center px-2 pointer-events-none max-w-[90px] leading-tight text-white drop-shadow-xs"
            >
              {st.stageName}
            </span>
            {st.criticalGate && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-mono font-bold shadow-xs border border-white z-10"
                title="Mandatory Quality Gate"
              >
                !
              </span>
            )}
          </div>
        ) : isOval ? (
          <button
            type="button"
            onClick={() => onNodeClick(st)}
            className={`w-[260px] py-2.5 px-4 rounded-full text-center transition-all cursor-pointer font-bold text-xs uppercase tracking-wide border-2 shadow-sm relative ${
              isSelected
                ? 'bg-sky-400 text-slate-950 border-blue-600 ring-4 ring-sky-300'
                : 'bg-sky-400 hover:bg-sky-300 text-slate-950 border-sky-600'
            }`}
          >
            <span>{st.stageName}</span>
            {st.criticalGate && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-mono font-bold shadow-xs border border-white"
                title="Mandatory Quality Gate"
              >
                !
              </span>
            )}
          </button>
        ) : isLast && !childStepsByParentId[st.id] ? (
          <button
            type="button"
            onClick={() => onNodeClick(st)}
            className={`w-[260px] py-2.5 px-4 rounded-xl text-center transition-all cursor-pointer font-bold text-xs uppercase tracking-wide border-2 shadow-sm relative ${
              isSelected
                ? 'bg-emerald-500 text-white border-emerald-700 ring-4 ring-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
            }`}
          >
            <span>{st.stageName}</span>
            {st.criticalGate && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-mono font-bold shadow-xs border border-white"
                title="Mandatory Quality Gate"
              >
                !
              </span>
            )}
          </button>
        ) : (
          <FlowNodeRect
            step={st}
            isSelected={isSelected}
            onClick={() => onNodeClick(st)}
          />
        )}

        {/* Right Action Tag */}
        {st.actionTag && st.actionTagPosition !== 'left' && (
          <div className="absolute left-[calc(50%+140px)] flex items-center gap-1.5 z-10">
            <div className="w-4 h-0.5 bg-slate-800" />
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-slate-800" />
            <span className="px-3 py-1 bg-amber-400 border border-amber-600 rounded font-black text-[10px] text-slate-950 uppercase tracking-wider font-mono shadow-xs whitespace-nowrap">
              {st.actionTag}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[1000px]">
      {mainSteps.map((st, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === mainSteps.length - 1;
        const children = childStepsByParentId[st.id] || [];
        const hasChildren = children.length > 0;

        // Group children by branchLabel or decisionBranch
        const branchGroups: Record<string, ProcessFlowStep[]> = {};
        children.forEach((cStep) => {
          const bLabel = cStep.branchLabel || cStep.decisionBranch || 'Branch';
          if (!branchGroups[bLabel]) {
            branchGroups[bLabel] = [];
          }
          branchGroups[bLabel].push(cStep);
        });
        const branchEntries = Object.entries(branchGroups);
        const branchCount = branchEntries.length;

        return (
          <React.Fragment key={st.id || idx}>
            {/* Render the parent node */}
            {renderNodeElement(st, isFirst, isLast && !hasChildren)}

            {/* If this node has child branches: render multi-branch split! */}
            {hasChildren && (
              <div className="w-full flex flex-col items-center my-2">
                {/* SVG Multi-Branch Split Connector */}
                <MultiBranchSplitConnector
                  branchCount={branchCount}
                  colWidth={190}
                  gap={24}
                  isDark={isDark}
                />

                {/* Branch Columns Rendered Side by Side */}
                <div className="flex justify-center items-start gap-6 w-full max-w-full overflow-x-auto pt-1 pb-4">
                  {branchEntries.map(([bLabel, bSteps], bIdx) => {
                    const isPass = bLabel.toUpperCase() === 'PASS';
                    const isFail = bLabel.toUpperCase() === 'FAIL';
                    const colBg = isPass
                      ? 'bg-emerald-50/40 border-emerald-200/60'
                      : isFail
                      ? 'bg-rose-50/40 border-rose-200/60'
                      : 'bg-slate-50/60 border-slate-200/70';

                    return (
                      <div
                        key={bIdx}
                        className={`flex flex-col items-center w-[190px] shrink-0 p-3 rounded-2xl border shadow-2xs ${colBg}`}
                      >
                        <BranchHeaderBadge label={bLabel} isDark={isDark} />
                        <TreeArrowDown isDark={isDark} />
                        {bSteps.map((childStep, cIdx) => {
                          const subChildren = childStepsByParentId[childStep.id] || [];
                          const hasSubChildren = subChildren.length > 0;
                          const subBranchGroups: Record<string, ProcessFlowStep[]> = {};
                          if (hasSubChildren) {
                            subChildren.forEach((sc) => {
                              const sLabel = sc.branchLabel || sc.decisionBranch || 'Branch';
                              if (!subBranchGroups[sLabel]) subBranchGroups[sLabel] = [];
                              subBranchGroups[sLabel].push(sc);
                            });
                          }
                          const subEntries = Object.entries(subBranchGroups);
                          return (
                            <React.Fragment key={childStep.id || cIdx}>
                              {renderNodeElement(childStep, false, false)}
                              {hasSubChildren && (
                                <div className="w-full flex flex-col items-center my-2">
                                  <MultiBranchSplitConnector
                                    branchCount={subEntries.length}
                                    colWidth={150}
                                    gap={12}
                                    isDark={isDark}
                                  />
                                  <div className="flex justify-center items-start gap-3 w-full overflow-x-auto pt-1">
                                    {subEntries.map(([sLabel, sSteps], sIdx) => (
                                      <div
                                        key={sIdx}
                                        className="flex flex-col items-center w-[150px] shrink-0 p-2 rounded-xl border border-slate-200 bg-white shadow-2xs"
                                      >
                                        <BranchHeaderBadge label={sLabel} isDark={isDark} />
                                        <TreeArrowDown isDark={isDark} />
                                        {sSteps.map((subStep, ssIdx) => (
                                          <React.Fragment key={subStep.id || ssIdx}>
                                            {renderNodeElement(subStep, false, false)}
                                            {ssIdx < sSteps.length - 1 && <TreeArrowDown isDark={isDark} />}
                                          </React.Fragment>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {cIdx < bSteps.length - 1 && <TreeArrowDown isDark={isDark} />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Down arrow to next sequential main step */}
            {!isLast && <TreeArrowDown isDark={isDark} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------
// REUSABLE SUB-COMPONENTS
// -------------------------------------------------------------

function FlowNodeRect({
  step,
  isSelected,
  onClick,
  className = '',
}: {
  step: ProcessFlowStep;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}) {
  const hasCustomW = className.includes('w-') || className.includes('min-w-');
  const hasCustomMaxW = className.includes('max-w-');
  const defaultWidth = hasCustomW ? '' : 'min-w-[240px]';
  const defaultMaxWidth = hasCustomMaxW ? '' : 'max-w-[280px]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${defaultWidth} ${defaultMaxWidth} py-2.5 px-3 rounded-lg text-center transition-all cursor-pointer font-bold text-xs uppercase tracking-wide border shadow-sm relative leading-snug ${
        isSelected
          ? 'bg-sky-400 text-slate-950 border-blue-600 ring-4 ring-sky-300 shadow-md'
          : 'bg-sky-400 hover:bg-sky-300 text-slate-950 border-sky-600'
      } ${className}`}
    >
      <span>{step.stageName}</span>
      {step.criticalGate && (
        <span
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-mono font-bold shadow-xs border border-white"
          title="Mandatory Quality Gate"
        >
          !
        </span>
      )}
    </button>
  );
}

function TreeArrowDown({ isDark = false }: { isDark?: boolean }) {
  const color = isDark ? '#cbd5e1' : '#1e293b';
  return (
    <div className="flex flex-col items-center my-0.5">
      <div className="w-0.5 h-4" style={{ backgroundColor: color }} />
      <div
        className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]"
        style={{ borderTopColor: color }}
      />
    </div>
  );
}

function DecisionDiamond({
  label,
  variant,
  small = false,
}: {
  label: string;
  variant: 'pass' | 'fail';
  small?: boolean;
}) {
  const isPass = variant === 'pass';
  const sizeClass = small ? 'w-10 h-10' : 'w-14 h-14';
  const textClass = small ? 'text-[9px]' : 'text-[11px]';

  return (
    <div className="relative flex items-center justify-center my-1">
      {/* 45-deg Rotated Diamond */}
      <div
        className={`${sizeClass} rotate-45 rounded-sm border-2 shadow-sm flex items-center justify-center ${
          isPass
            ? 'bg-emerald-600 border-emerald-700'
            : 'bg-red-600 border-red-700'
        }`}
      />
      {/* Label (un-rotated) */}
      <span
        className={`absolute font-black tracking-wider uppercase text-white font-mono pointer-events-none ${textClass}`}
      >
        {label}
      </span>
    </div>
  );
}
