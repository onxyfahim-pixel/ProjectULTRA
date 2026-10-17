'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  GitCommit,
  Clock,
  Sliders,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Layers,
  Factory,
  ChevronRight,
  ShieldAlert,
  Network,
  Eye,
} from 'lucide-react';
import { ProcessFlowChart, ProcessFlowStep } from '@/lib/types/modules';
import {
  MASTER_GARMENT_FLOW_STEPS,
  SEWING_SECTION_FLOW_STEPS,
  INITIAL_PROCESS_FLOW_CHARTS,
} from './process-flow-data';
import { ProcessFlowVisualTree } from './ProcessFlowVisualTree';

interface ProcessFlowEntryPageProps {
  initialFlow?: ProcessFlowChart | null;
  onSave: (flow: ProcessFlowChart) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export function ProcessFlowEntryPage({
  initialFlow,
  onSave,
  onCancel,
  showToast,
}: ProcessFlowEntryPageProps) {
  const isEditing = Boolean(initialFlow);

  const [activeTab, setActiveTab] = useState<'general' | 'sequencer' | 'preview'>('general');
  const [showLiveTreePreview, setShowLiveTreePreview] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<ProcessFlowChart>(() => {
    if (initialFlow) {
      return JSON.parse(JSON.stringify(initialFlow));
    }
    return {
      id: `pfc-${Date.now()}`,
      flowCode: `PFC-GAR-${Math.floor(10 + Math.random() * 90)}`,
      title: '',
      productCategory: 'Knitwear & T-Shirts',
      department: 'Garment Manufacturing',
      version: 'Rev 1.0',
      status: 'ACTIVE',
      author: 'Industrial Engineering (IE) Team',
      approvedBy: 'Head of Quality Assurance',
      effectiveDate: new Date().toISOString().split('T')[0],
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description:
        'Standard operational sequence and quality gates pipeline from raw material intake to final packing.',
      steps: [
        {
          id: `step-${Date.now()}-1`,
          stepNumber: 1,
          stageName: 'Fabric Inward & 4-Point QC',
          department: 'Raw Material Warehouse',
          inputMaterials: 'Finished Fabric Rolls & Packing Slips',
          transformation: 'Inspection on illuminated rolling frame, lot grading A/B/C',
          qualityGate: 'ASTM 4-Point score < 24 points per 100 sq yds',
          standardTool: 'CFL Backlit Fabric Inspection Machine',
          leadTimeHours: 24,
          responsibleRole: 'Warehouse QC Inspector',
          criticalGate: true,
          toleranceSpecs: 'Points < 24 / 100 sq. yds',
        },
        {
          id: `step-${Date.now()}-2`,
          stepNumber: 2,
          stageName: 'CAD Spreading & Automatic Cutting',
          department: 'Cutting Room',
          inputMaterials: 'Relaxed Fabric Rolls & Approved Nested Markers',
          transformation: 'Automatic vacuum table cutting, bundle numbering, fusing',
          qualityGate: 'Top-middle-bottom ply measurement audit (± 1.0mm tolerance)',
          standardTool: 'Lectra / Gerber Vector Automatic CNC Cutter',
          leadTimeHours: 12,
          responsibleRole: 'Cutting Master',
          criticalGate: false,
          toleranceSpecs: 'Ply tolerance ± 1.0mm',
        },
        {
          id: `step-${Date.now()}-3`,
          stepNumber: 3,
          stageName: 'Sewing Assembly Lines',
          department: 'Production Floor',
          inputMaterials: 'Cut Bundles, Thread, Labels, Zippers',
          transformation: 'Progressive bundle sewing assembly across progressive line',
          qualityGate: '100% In-line QC check + 100% End-of-line inspection table (AQL 2.5)',
          standardTool: 'Juki DDL-9000C Direct Drive & Pegasus Overlockers',
          leadTimeHours: 10,
          responsibleRole: 'Sewing GPQ In-Charge',
          criticalGate: true,
          toleranceSpecs: 'AQL 2.5 Major, 0 Critical',
        },
        {
          id: `step-${Date.now()}-4`,
          stepNumber: 4,
          stageName: '100% Metal Detection & Packing',
          department: 'Finishing Department',
          inputMaterials: 'Finished Stitched Garments, Polybags, Cartons',
          transformation: '100% conveyor metal scan, barcode scan, carton sealing',
          qualityGate: '0.8mm Ferrous sphere detection gate 100% passed',
          standardTool: 'Conveyor Metal Detector & Barcode Scanners',
          leadTimeHours: 8,
          responsibleRole: 'Finishing QA Lead',
          criticalGate: true,
          toleranceSpecs: '0.8mm Ferrous 100%',
        },
      ],
      totalLeadTimeHours: 54,
      criticalGatesCount: 3,
      tags: ['Standard Flow', 'Garment Manufacturing'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Calculate stats
  const totalHours = (formData.steps || []).reduce(
    (sum, s) => sum + (Number(s.leadTimeHours) || 0),
    0
  );
  const criticalGates = (formData.steps || []).filter((s) => s.criticalGate).length;

  // Template pre-loaders
  const handleLoadTemplate = (templateIndex: number) => {
    const template = INITIAL_PROCESS_FLOW_CHARTS[templateIndex];
    if (!template) return;
    const cloned = JSON.parse(JSON.stringify(template));
    setFormData((prev) => ({
      ...prev,
      title: cloned.title,
      productCategory: cloned.productCategory,
      department: cloned.department,
      description: cloned.description,
      steps: cloned.steps.map((st: ProcessFlowStep) => ({
        ...st,
        id: `pfs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      })),
      totalLeadTimeHours: cloned.totalLeadTimeHours,
      criticalGatesCount: cloned.criticalGatesCount,
    }));
    showToast(`Loaded "${template.title}" template`);
  };

  // Start Clean Blank Tree
  const handleStartBlankFlow = () => {
    setFormData((prev) => ({
      ...prev,
      title: prev.title || 'Custom Process Flow',
      steps: [
        {
          id: `step-${Date.now()}-1`,
          stepNumber: 1,
          stageName: 'Initial Material Check & Setup',
          department: prev.department || 'Production',
          inputMaterials: 'Work Order, Raw Materials',
          transformation: 'Incoming lot inspection & line parameter setup',
          qualityGate: '100% Parameter Verification',
          standardTool: 'Standard Inspection Table',
          leadTimeHours: 1,
          responsibleRole: 'Quality Inspector',
          criticalGate: false,
          shape: 'oval',
          nodeType: 'START',
          actionTag: 'KEEP RECORD',
          actionTagPosition: 'right',
        },
        {
          id: `step-${Date.now()}-2`,
          stepNumber: 2,
          stageName: 'Main Production Operation',
          department: prev.department || 'Production',
          inputMaterials: 'Verified Components',
          transformation: 'Assembly / processing operation according to tech pack',
          qualityGate: 'In-line Inspection Acceptance',
          standardTool: 'Standard Machine',
          leadTimeHours: 4,
          responsibleRole: 'Line Operator',
          criticalGate: true,
          shape: 'rectangle',
          nodeType: 'PROCESS',
        },
      ],
      totalLeadTimeHours: 5,
      criticalGatesCount: 1,
    }));
    showToast('Clean blank tree initialized. Add stages to build your custom flow.');
  };

  // Step Management
  const handleAddStep = () => {
    const nextSeq = (formData.steps?.length || 0) + 1;
    const newStep: ProcessFlowStep = {
      id: `step-${Date.now()}`,
      stepNumber: nextSeq,
      stageName: `Stage ${nextSeq} Operation`,
      department: 'Production Floor',
      inputMaterials: 'Semi-finished parts / materials',
      transformation: 'Operation transformation details...',
      qualityGate: 'Quality inspection tolerance criteria',
      standardTool: 'Direct Drive Industrial Machine',
      leadTimeHours: 8,
      responsibleRole: 'Line In-Charge',
      criticalGate: false,
      toleranceSpecs: 'Standard specification',
    };
    setFormData((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), newStep],
    }));
  };

  const handleAddDecisionSplit = () => {
    const nextSeq = (formData.steps?.length || 0) + 1;
    const parentCheck: ProcessFlowStep = {
      id: `step-${Date.now()}-check`,
      stepNumber: nextSeq,
      stageName: 'Quality Inspection Check',
      department: 'Quality Assurance',
      inputMaterials: 'Assembled Units',
      transformation: '100% Quality & Tolerance Inspection Gate',
      qualityGate: 'Acceptance Criteria Check',
      standardTool: 'Inspection Table & Gauge',
      leadTimeHours: 1,
      responsibleRole: 'QC Inspector',
      criticalGate: true,
      shape: 'diamond',
      nodeType: 'DECISION',
      actionTag: 'MAKE REPORT',
      actionTagPosition: 'left',
    };

    const passNode: ProcessFlowStep = {
      id: `step-${Date.now()}-pass`,
      stepNumber: nextSeq + 1,
      stageName: 'Send to Finishing / Next Stage',
      department: 'Finishing Department',
      inputMaterials: 'Passed Units',
      transformation: 'Release to downstream manufacturing stream',
      qualityGate: '100% Passed Lot Clearance',
      standardTool: 'Conveyor Stream',
      leadTimeHours: 2,
      responsibleRole: 'Finishing In-Charge',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      decisionBranch: 'PASS',
    };

    const failNode: ProcessFlowStep = {
      id: `step-${Date.now()}-fail`,
      stepNumber: nextSeq + 2,
      stageName: 'Return to Sewing for Rectify',
      department: 'Production Floor',
      inputMaterials: 'Defective Units',
      transformation: 'Rework and stitch defect rectification',
      qualityGate: 'Rework Clearance Audit',
      standardTool: 'Rework Machine Station',
      leadTimeHours: 2,
      responsibleRole: 'Rework Operator',
      criticalGate: true,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      decisionBranch: 'FAIL',
    };

    setFormData((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), parentCheck, passNode, failNode],
    }));
    showToast('Added Decision Gate with connected PASS & FAIL branches!');
  };

  const handleAddParallelSplit = () => {
    const nextSeq = (formData.steps?.length || 0) + 1;
    const parentNode: ProcessFlowStep = {
      id: `step-${Date.now()}-split`,
      stepNumber: nextSeq,
      stageName: 'Component Prep & Dual Stream Splitting',
      department: 'Production Floor',
      inputMaterials: 'Bundle Cuts / Materials',
      transformation: 'Distribution to parallel assembly line stations',
      qualityGate: 'Bundle Count & Pattern Conformance',
      standardTool: 'Line Distribution Table',
      leadTimeHours: 1,
      responsibleRole: 'Line Supervisor',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
    };

    const leftNode: ProcessFlowStep = {
      id: `step-${Date.now()}-left`,
      stepNumber: nextSeq + 1,
      stageName: 'Stream A: Front Panel Assembly',
      department: 'Sewing Line A',
      inputMaterials: 'Front Panel Components',
      transformation: 'Progressive front panel sewing and pocket fusing',
      qualityGate: 'Tolerance ± 1.0mm',
      standardTool: 'Single Needle Lockstitch',
      leadTimeHours: 3,
      responsibleRole: 'Sewing Operator A',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      decisionBranch: 'LEFT',
    };

    const rightNode: ProcessFlowStep = {
      id: `step-${Date.now()}-right`,
      stepNumber: nextSeq + 2,
      stageName: 'Stream B: Back Panel Assembly',
      department: 'Sewing Line B',
      inputMaterials: 'Back Panel Components',
      transformation: 'Back panel dart stitching and yoke attaching',
      qualityGate: 'Tolerance ± 1.0mm',
      standardTool: 'Single Needle Lockstitch',
      leadTimeHours: 3,
      responsibleRole: 'Sewing Operator B',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      decisionBranch: 'RIGHT',
    };

    setFormData((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), parentNode, leftNode, rightNode],
    }));
    showToast('Added Parallel Dual Stream (Left & Right) without PASS/FAIL badges!');
  };

  const handleAddThreeWaySplit = () => {
    const nextSeq = (formData.steps?.length || 0) + 1;
    const parentId = `step-${Date.now()}-split3`;
    const parentNode: ProcessFlowStep = {
      id: parentId,
      stepNumber: nextSeq,
      stageName: 'Component Prep & 3-Way Tri-Stream Split',
      department: 'Production Floor',
      inputMaterials: 'Bundle Cuts / Trims / Materials',
      transformation: 'Distribution across 3 parallel specialized sub-assembly lines',
      qualityGate: 'Bundle Conformance Audit',
      standardTool: 'Line Distribution Conveyor Table',
      leadTimeHours: 1,
      responsibleRole: 'Line Supervisor',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
    };

    const streamA: ProcessFlowStep = {
      id: `step-${Date.now()}-stream-a`,
      stepNumber: nextSeq + 1,
      stageName: 'Stream A: Front Panel Prep',
      department: 'Sewing Line A',
      inputMaterials: 'Front Panel Cuts',
      transformation: 'Front placket fusing and pocket attachment',
      qualityGate: 'Tolerance ± 1.0mm',
      standardTool: 'Single Needle Lockstitch',
      leadTimeHours: 3,
      responsibleRole: 'Sewing Operator A',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      parentStepId: parentId,
      branchLabel: 'Stream A',
    };

    const streamB: ProcessFlowStep = {
      id: `step-${Date.now()}-stream-b`,
      stepNumber: nextSeq + 2,
      stageName: 'Stream B: Back Panel Prep',
      department: 'Sewing Line B',
      inputMaterials: 'Back Panel Cuts',
      transformation: 'Yoke joining and pleat stitching',
      qualityGate: 'Tolerance ± 1.0mm',
      standardTool: 'Single Needle Lockstitch',
      leadTimeHours: 3,
      responsibleRole: 'Sewing Operator B',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      parentStepId: parentId,
      branchLabel: 'Stream B',
    };

    const streamC: ProcessFlowStep = {
      id: `step-${Date.now()}-stream-c`,
      stepNumber: nextSeq + 3,
      stageName: 'Stream C: Collar & Cuff Sub-Assembly',
      department: 'Sewing Line C',
      inputMaterials: 'Collar & Cuff Interlinings',
      transformation: 'Automatic collar runstitching and point turning',
      qualityGate: 'Point Angle Symmetry ± 0.5mm',
      standardTool: 'Specialized Profile Stitcher',
      leadTimeHours: 2.5,
      responsibleRole: 'Sewing Operator C',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      parentStepId: parentId,
      branchLabel: 'Stream C',
    };

    setFormData((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), parentNode, streamA, streamB, streamC],
    }));
    showToast('Added 3-Way Parallel Split (Stream A, B, and C)!');
  };

  const handleAddBranchUnderStage = (parentIndex: number) => {
    const parent = formData.steps?.[parentIndex];
    if (!parent) return;

    // Count existing children under this parent
    const existingChildren = (formData.steps || []).filter((s) => s.parentStepId === parent.id);
    const branchLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const branchLetter = branchLetters[existingChildren.length] || `Stream ${existingChildren.length + 1}`;
    const defaultBranchLabel = `Stream ${branchLetter}`;

    const nextSeq = (formData.steps?.length || 0) + 1;
    const newBranch: ProcessFlowStep = {
      id: `step-${Date.now()}-branch-${existingChildren.length + 1}`,
      stepNumber: nextSeq,
      stageName: `${defaultBranchLabel}: ${parent.stageName} Branch`,
      department: parent.department || 'Production Floor',
      inputMaterials: `Output components from Stage ${parent.stepNumber}`,
      transformation: `Parallel operation stream ${branchLetter} execution`,
      qualityGate: 'Branch Acceptance Specification',
      standardTool: 'Standard Industrial Machine',
      leadTimeHours: 2,
      responsibleRole: parent.responsibleRole || 'Line Specialist',
      criticalGate: false,
      shape: 'rectangle',
      nodeType: 'PROCESS',
      parentStepId: parent.id,
      branchLabel: defaultBranchLabel,
    };

    // Insert new branch right after the parent or at the end
    setFormData((prev) => {
      const steps = [...(prev.steps || [])];
      steps.splice(parentIndex + 1 + existingChildren.length, 0, newBranch);
      const renumbered = steps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
      return { ...prev, steps: renumbered };
    });
    showToast(`Added branch "${defaultBranchLabel}" under "${parent.stageName}"!`);
  };

  const handleUpdateStep = (index: number, field: keyof ProcessFlowStep, val: any) => {
    setFormData((prev) => {
      const list = [...(prev.steps || [])];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, steps: list };
    });
  };

  const handleRemoveStep = (index: number) => {
    setFormData((prev) => {
      const list = (prev.steps || [])
        .filter((_, i) => i !== index)
        .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
      return { ...prev, steps: list };
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const list = [...(prev.steps || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      // Re-number
      const renumbered = list.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
      return { ...prev, steps: renumbered };
    });
  };

  // Save Validation
  const handleSave = (statusToSet?: ProcessFlowChart['status']) => {
    if (!formData.title.trim()) {
      showToast('Please provide a Process Flow Title');
      setActiveTab('general');
      return;
    }
    if (!formData.flowCode.trim()) {
      showToast('Please enter a Flow Code (e.g. PFC-GAR-01)');
      setActiveTab('general');
      return;
    }
    if (!formData.steps || formData.steps.length === 0) {
      showToast('Please add at least one manufacturing stage');
      setActiveTab('sequencer');
      return;
    }

    const flowToSave: ProcessFlowChart = {
      ...formData,
      status: statusToSet || formData.status || 'ACTIVE',
      totalLeadTimeHours: totalHours,
      criticalGatesCount: criticalGates,
      updatedAt: new Date().toISOString(),
    };

    onSave(flowToSave);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* TOP HEADER & ACTION BAR (EXACT STYLE OF BUYER & ORDER ADD PAGE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Cancel & Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? `Edit Flowchart: ${formData.flowCode}` : 'Create Process Flow Chart'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                {formData.version || 'Rev 1.0'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Industrial Engineering Manufacturing Pipeline &amp; Quality Gate Architecture
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('ACTIVE')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save Changes' : 'Save & Release Flowchart'}</span>
          </button>
        </div>
      </div>

      {/* SECTION TABS */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>1. Flow Overview &amp; Scope</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sequencer')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sequencer'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>2. Sequential Stages ({formData.steps?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>3. Visual Flow Preview</span>
        </button>
      </div>

      {/* TAB 1: GENERAL & SCOPE */}
      {activeTab === 'general' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Process Flow Identification &amp; Scope
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">IE Standard Flow</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Flow Code */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Flow Code *</label>
                <input
                  type="text"
                  value={formData.flowCode}
                  onChange={(e) => setFormData({ ...formData, flowCode: e.target.value })}
                  placeholder="e.g. PFC-GAR-01"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Version */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Revision Version</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g. Rev 1.0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              {/* Title (Full Width) */}
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <label className="font-semibold text-slate-700">Process Flow Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Master Garment Manufacturing & Quality Process Flow"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Product Category */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Product Category</label>
                <select
                  value={formData.productCategory}
                  onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Knitwear & T-Shirts">Knitwear &amp; T-Shirts</option>
                  <option value="Woven Denim">Woven Denim</option>
                  <option value="Activewear & Sportswear">Activewear &amp; Sportswear</option>
                  <option value="Outerwear & Jackets">Outerwear &amp; Jackets</option>
                  <option value="Intimate Apparel">Intimate Apparel</option>
                  <option value="Uniforms & Workwear">Uniforms &amp; Workwear</option>
                </select>
              </div>

              {/* Responsible Department */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Assigned Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Garment Manufacturing">Garment Manufacturing</option>
                  <option value="Wet Processing & Laundry">Wet Processing &amp; Laundry</option>
                  <option value="Cutting & Pre-Sewing">Cutting &amp; Pre-Sewing</option>
                  <option value="Finishing & Packing">Finishing &amp; Packing</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Industrial Engineering">Industrial Engineering</option>
                </select>
              </div>

              {/* Effective Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Effective Date</label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Author */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Prepared By (IE Engineer)</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Industrial Engineering Team"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Approved By */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Approved By (Operations Head)</label>
                <input
                  type="text"
                  value={formData.approvedBy}
                  onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                  placeholder="e.g. Head of Quality Assurance"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Review Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Next Review Date</label>
                <input
                  type="date"
                  value={formData.reviewDate || ''}
                  onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description (Full Width) */}
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <label className="font-semibold text-slate-700">Manufacturing Flow Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed operational scope and product guidelines..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STEP-BY-STEP FLOW SEQUENCER */}
      {activeTab === 'sequencer' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Actions & Quick Visual Templates */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {(formData.steps || []).length} Stages Configured
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                • {totalHours} Total Hours • {criticalGates} Critical Gates
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleStartBlankFlow}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 mr-1"
                title="Initialize a fresh blank flowchart with 2 initial stages"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>✨ Start Clean Blank Tree</span>
              </button>

              <span className="text-[11px] font-bold uppercase text-slate-400 mr-1 hidden md:inline">
                Preset Trees:
              </span>
              <button
                type="button"
                onClick={() => handleLoadTemplate(0)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                title="Sewing Section Standard Flow Chart (Exact Image Match)"
              >
                <span>🧵 Sewing Tree (Image Match)</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadTemplate(1)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Full Factory Master Garment Flow"
              >
                👕 Master Knit
              </button>
              <button
                type="button"
                onClick={() => handleLoadTemplate(2)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Spreading & CAD Cutting Flow"
              >
                ✂️ Cutting CAD
              </button>
              <button
                type="button"
                onClick={() => handleLoadTemplate(3)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Denim Wet & Dry Wash Flow"
              >
                👖 Denim
              </button>
              <button
                type="button"
                onClick={() => handleLoadTemplate(4)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Finishing & Needle Detection Flow"
              >
                📦 Finishing
              </button>

              <button
                type="button"
                onClick={() => setShowLiveTreePreview((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs ml-1 ${
                  showLiveTreePreview
                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/30'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
                title="Toggle in-line live Visual Tree flowchart preview"
              >
                <Network className="w-3.5 h-3.5" />
                <span>{showLiveTreePreview ? 'Hide Live Tree' : 'Live Tree Preview'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddParallelSplit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors shadow-2xs cursor-pointer ml-1"
                title="Add two parallel branches without PASS/FAIL badges (e.g. Stream A and Stream B)"
              >
                <Network className="w-3.5 h-3.5" />
                <span>+ Parallel Split (Stream A / B)</span>
              </button>

              <button
                type="button"
                onClick={handleAddThreeWaySplit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs cursor-pointer ml-1"
                title="Add 3 parallel branches (Stream A, Stream B, Stream C)"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>+ 3-Way Split (A / B / C)</span>
              </button>

              <button
                type="button"
                onClick={handleAddDecisionSplit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors shadow-2xs cursor-pointer ml-1"
                title="Add a decision node with connected PASS and FAIL branches"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>+ Split (PASS / FAIL)</span>
              </button>

              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stage</span>
              </button>
            </div>
          </div>

          {/* DOCKED LIVE VISUAL TREE PREVIEW (SHOWN WHEN TOGGLED) */}
          {showLiveTreePreview && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white">Live Visual Flowchart Tree Preview</span>
                  <span className="text-slate-400 font-mono">({formData.steps?.length || 0} Stages Connected)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
                >
                  Open Fullscreen Preview Tab &rarr;
                </button>
              </div>
              <ProcessFlowVisualTree
                flow={formData}
                onUpdateFlow={(updated) => setFormData(updated)}
              />
            </div>
          )}

          {/* Sequential Step Cards */}
          <div className="space-y-3">
            {(formData.steps || []).map((step, idx) => (
              <div
                key={step.id || idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-200 transition-colors"
              >
                {/* Stage Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs flex items-center justify-center border border-blue-200">
                      0{step.stepNumber}
                    </span>
                    <input
                      type="text"
                      value={step.stageName}
                      onChange={(e) => handleUpdateStep(idx, 'stageName', e.target.value)}
                      placeholder="Stage Name"
                      className="font-bold text-xs text-slate-900 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 flex-1 min-w-[200px]"
                    />
                    <input
                      type="text"
                      value={step.department}
                      onChange={(e) => handleUpdateStep(idx, 'department', e.target.value)}
                      placeholder="Department"
                      className="text-xs text-slate-600 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 w-44"
                    />
                  </div>

                  {/* Actions & Reorder */}
                  <div className="flex items-center flex-wrap gap-1.5 self-end sm:self-auto">
                    {step.parentStepId && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        ↳ Branch: {step.branchLabel || 'Child Stream'}
                      </span>
                    )}

                    {(() => {
                      const childCount = (formData.steps || []).filter((s) => s.parentStepId === step.id).length;
                      return childCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          🌿 {childCount} Branch{childCount > 1 ? 'es' : ''}
                        </span>
                      ) : null;
                    })()}

                    <button
                      type="button"
                      onClick={() => handleAddBranchUnderStage(idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs cursor-pointer mr-1"
                      title="Add a new branch connected under this stage"
                    >
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>+ Branch from Here</span>
                    </button>

                    <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer mr-2">
                      <input
                        type="checkbox"
                        checked={step.criticalGate || false}
                        onChange={(e) => handleUpdateStep(idx, 'criticalGate', e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-600"
                      />
                      <span className="font-semibold text-[11px] text-emerald-800">
                        Critical Gate
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, 'up')}
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Move Step Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (formData.steps?.length || 0) - 1}
                      onClick={() => handleMoveStep(idx, 'down')}
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Move Step Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer ml-1"
                      title="Remove Stage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stage Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 block">
                      Input Materials
                    </label>
                    <input
                      type="text"
                      value={step.inputMaterials}
                      onChange={(e) => handleUpdateStep(idx, 'inputMaterials', e.target.value)}
                      placeholder="e.g. Finished Fabric Rolls, Yarns..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 block">
                      Process Transformation Operation
                    </label>
                    <input
                      type="text"
                      value={step.transformation}
                      onChange={(e) => handleUpdateStep(idx, 'transformation', e.target.value)}
                      placeholder="e.g. Automatic vacuum table cutting, bundle numbering..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-emerald-700 block">
                      Quality Gate &amp; Acceptance Tolerances
                    </label>
                    <input
                      type="text"
                      value={step.qualityGate}
                      onChange={(e) => handleUpdateStep(idx, 'qualityGate', e.target.value)}
                      placeholder="e.g. ASTM 4-Point score < 24 points..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 block">
                      Standard Machinery / Tooling
                    </label>
                    <input
                      type="text"
                      value={step.standardTool}
                      onChange={(e) => handleUpdateStep(idx, 'standardTool', e.target.value)}
                      placeholder="e.g. Juki DDL-9000C, Lectra CNC..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-blue-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block">
                        Lead Time (Hrs)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={step.leadTimeHours}
                        onChange={(e) =>
                          handleUpdateStep(idx, 'leadTimeHours', Number(e.target.value) || 1)
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block">
                        Role
                      </label>
                      <input
                        type="text"
                        value={step.responsibleRole || ''}
                        onChange={(e) => handleUpdateStep(idx, 'responsibleRole', e.target.value)}
                        placeholder="In-Charge"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Visual Tree Node & Documentation Tag Linking */}
                  <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/70 p-2.5 rounded-xl text-xs md:col-span-2 lg:col-span-3">
                    {/* 1. Branch Origin (Parent Stage) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-indigo-700 block flex items-center gap-1">
                        <GitCommit className="w-3 h-3 text-indigo-600" />
                        <span>Branch Origin (Parent Node)</span>
                      </label>
                      <select
                        value={step.parentStepId || ''}
                        onChange={(e) => {
                          const pId = e.target.value || undefined;
                          handleUpdateStep(idx, 'parentStepId', pId);
                          if (pId && !step.branchLabel) {
                            handleUpdateStep(idx, 'branchLabel', 'Stream A');
                          }
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium text-xs truncate"
                      >
                        <option value="">-- Main Sequential Stream --</option>
                        {(formData.steps || [])
                          .filter((s) => s.id !== step.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              Branch under #{s.stepNumber}: {s.stageName.slice(0, 24)}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 2. Branch Name / Stream Label */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-blue-700 block">
                        Branch Label / Stream
                      </label>
                      <input
                        type="text"
                        value={step.branchLabel || (step.decisionBranch && step.decisionBranch !== 'ROOT' ? step.decisionBranch : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateStep(idx, 'branchLabel', val);
                          handleUpdateStep(idx, 'decisionBranch', val);
                        }}
                        placeholder="e.g. Stream A, PASS, FAIL..."
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium text-xs"
                      />
                    </div>

                    {/* 3. Tree Node Shape */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block flex items-center gap-1">
                        <Network className="w-3 h-3 text-blue-600" />
                        <span>Tree Node Shape</span>
                      </label>
                      <select
                        value={step.shape || (step.nodeType === 'DECISION' ? 'diamond' : step.nodeType === 'START' || step.nodeType === 'END' || idx === 0 ? 'oval' : 'rectangle')}
                        onChange={(e) => {
                          const shape = e.target.value as 'rectangle' | 'oval' | 'diamond';
                          handleUpdateStep(idx, 'shape', shape);
                          const nodeType = shape === 'diamond' ? 'DECISION' : shape === 'oval' ? 'START' : 'PROCESS';
                          handleUpdateStep(idx, 'nodeType', nodeType);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium text-xs"
                      >
                        <option value="rectangle">Standard Rectangle</option>
                        <option value="oval">Capsule / Oval (Terminal)</option>
                        <option value="diamond">Diamond (Decision Gate)</option>
                      </select>
                    </div>

                    {/* 4. Side Action Tag */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-amber-700 block">
                        Side Action Tag
                      </label>
                      <select
                        value={step.actionTag || ''}
                        onChange={(e) => handleUpdateStep(idx, 'actionTag', e.target.value || undefined)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium text-xs"
                      >
                        <option value="">No Action Tag</option>
                        <option value="KEEP RECORD">KEEP RECORD (Gold Badge)</option>
                        <option value="MAKE REPORT">MAKE REPORT (Orange Badge)</option>
                        <option value="MAKE RECORD">MAKE RECORD (Yellow Badge)</option>
                      </select>
                    </div>

                    {/* 5. Tag Side Position */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block">
                        Tag Side Position
                      </label>
                      <select
                        value={step.actionTagPosition || 'right'}
                        onChange={(e) => handleUpdateStep(idx, 'actionTagPosition', e.target.value)}
                        disabled={!step.actionTag}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium text-xs disabled:opacity-40"
                      >
                        <option value="right">Right Side (Standard)</option>
                        <option value="left">Left Side</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL FLOW PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b pb-3">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {formData.flowCode}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{formData.title || 'Untitled Process Flow'}</h2>
              <p className="text-xs text-slate-500 font-mono">
                {formData.productCategory} • {formData.department} • {totalHours} Operating Hours
              </p>
            </div>

            {/* Visual Tree Interactive Preview */}
            <ProcessFlowVisualTree
              flow={formData}
              onUpdateFlow={(updated) => setFormData(updated)}
            />

            {/* Pipeline Preview */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Sequential Pipeline Ribbon
              </h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1">
                {(formData.steps || []).map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 min-w-[180px] max-w-[200px] shrink-0 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <span className="font-bold text-slate-600">{step.leadTimeHours}h</span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 truncate">{step.stageName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{step.department}</div>
                      {step.criticalGate && (
                        <span className="inline-block text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          Critical Gate
                        </span>
                      )}
                    </div>
                    {idx < (formData.steps?.length || 0) - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleSave('ACTIVE')}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Confirm &amp; Release Flowchart</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
