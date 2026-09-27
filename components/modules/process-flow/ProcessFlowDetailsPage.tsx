'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Printer,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  GitCommit,
  Factory,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sliders,
  Layers,
  Sparkles,
  Download,
  AlertTriangle,
  FileText,
  UserCheck,
  Check,
} from 'lucide-react';
import { ProcessFlowChart, ProcessFlowStep } from '@/lib/types/modules';

interface ProcessFlowDetailsPageProps {
  flow: ProcessFlowChart;
  onBack: () => void;
  onEdit: (flow: ProcessFlowChart) => void;
  onDuplicate: (flow: ProcessFlowChart) => void;
  onDelete: (flow: ProcessFlowChart) => void;
  onUpdateStatus?: (updated: ProcessFlowChart) => void;
  showToast: (msg: string) => void;
}

export function ProcessFlowDetailsPage({
  flow,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateStatus,
  showToast,
}: ProcessFlowDetailsPageProps) {
  const steps = flow.steps || [];
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const activeStep = steps[selectedStepIndex] || steps[0];

  const totalHours = steps.reduce((sum, s) => sum + (Number(s.leadTimeHours) || 0), 0);
  const totalDays = (totalHours / 24).toFixed(1);
  const criticalGates = steps.filter((s) => s.criticalGate).length;

  const handleStatusChange = (newStatus: ProcessFlowChart['status']) => {
    const updated: ProcessFlowChart = {
      ...flow,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateStatus?.(updated);
    showToast(`Process flow status updated to ${newStatus}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP NAVIGATION & ACTION BAR (EXACT STYLE OF BUYER & ORDER MODULE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Process Flow Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {flow.flowCode}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                {flow.version || 'Rev 1.0'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${
                  flow.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : flow.status === 'UNDER_REVIEW'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {flow.status || 'ACTIVE'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sliders className="w-3 h-3 text-indigo-600" />
                <span>{flow.productCategory || 'Apparel Manufacturing'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Department: {flow.department || 'Industrial Engineering'} • Effective:{' '}
              {flow.effectiveDate || '2026-01-15'}
            </p>
          </div>
        </div>

        {/* Action Buttons styled like Buyer Order */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick status selector */}
          <select
            value={flow.status || 'ACTIVE'}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="DRAFT">Status: Draft</option>
            <option value="UNDER_REVIEW">Status: Under Review</option>
            <option value="ACTIVE">Status: Active</option>
            <option value="ARCHIVED">Status: Archived</option>
          </select>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Print Process Flowchart"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Flowchart</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(flow)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Duplicate Flowchart"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(flow)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Edit Flowchart"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Flowchart</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(flow)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
            title="Delete Flowchart"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* FLOW OVERVIEW SUMMARY CARD (CLEAN LIGHT THEME - NO DARK CARD) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {flow.flowCode}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-1.5">
              {flow.title}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed mt-1 max-w-3xl">
              {flow.description}
            </p>
          </div>
          <div className="shrink-0 text-right font-mono text-xs text-slate-500">
            <div>Author: <strong className="text-slate-800">{flow.author || 'Industrial Engineering'}</strong></div>
            <div>Approved: <strong className="text-slate-800">{flow.approvedBy || 'Operations Head'}</strong></div>
          </div>
        </div>

        {/* 4 Quick Stat KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pipeline Stages</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">{steps.length} Stages</div>
            <span className="text-[11px] text-blue-600">Sequential manufacturing flow</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Operating Cycle</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">{totalHours} Hours</div>
            <span className="text-[11px] text-indigo-600 font-medium">~{totalDays} Calendar Days</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Inspection Gates</span>
            <div className="text-lg font-bold text-emerald-700 mt-0.5 font-mono">{criticalGates} Critical Gates</div>
            <span className="text-[11px] text-emerald-600 font-medium">100% In-line validation</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Product Category</span>
            <div className="text-sm font-bold text-purple-800 mt-1 truncate">{flow.productCategory}</div>
            <span className="text-[10px] text-slate-400 font-mono">Governed under IE Standard</span>
          </div>
        </div>
      </div>

      {/* VISUAL FLOWCHART DIAGRAM (INTERACTIVE PIPELINE) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Interactive Manufacturing Flowchart Diagram
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Click any node along the pipeline to inspect quality gates &amp; tooling
          </span>
        </div>

        {/* Horizontal Scrollable Flow Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1">
          {steps.map((st, idx) => {
            const isSelected = selectedStepIndex === idx;
            return (
              <React.Fragment key={st.id || idx}>
                <button
                  type="button"
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`p-3 rounded-xl border text-left shrink-0 transition-all cursor-pointer min-w-[190px] max-w-[210px] ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                        isSelected ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st.stepNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {st.leadTimeHours}h
                    </span>
                  </div>
                  <div className="font-semibold text-xs truncate" title={st.stageName}>
                    {st.stageName}
                  </div>
                  <div
                    className={`text-[10px] font-mono truncate mt-0.5 ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {st.department}
                  </div>
                  {st.criticalGate && (
                    <span
                      className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.2 rounded mt-1.5 ${
                        isSelected ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      ★ Critical Gate
                    </span>
                  )}
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected Stage Detail Inspector */}
        {activeStep && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 mt-2 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">
                  Stage 0{activeStep.stepNumber}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{activeStep.stageName}</h4>
                <span className="text-xs text-slate-500 font-mono">({activeStep.department})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-slate-700 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                  Lead Time: {activeStep.leadTimeHours} Hours
                </span>
                {activeStep.criticalGate && (
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    Mandatory Quality Gate
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase block">
                  Input Raw Materials
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {activeStep.inputMaterials || 'Specified in BOM'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase block">
                  Process Transformation
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {activeStep.transformation}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-emerald-700 text-[10px] uppercase block">
                  Quality Gate &amp; Standard Machinery
                </span>
                <p className="text-slate-800 font-semibold leading-relaxed">
                  {activeStep.qualityGate}
                </p>
                <div className="text-[11px] text-blue-700 font-mono mt-1 pt-1 border-t border-slate-100">
                  Machine: {activeStep.standardTool}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COMPLETE STAGE-BY-STAGE SPECIFICATION TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Manufacturing Process Pipeline Specification ({steps.length} Stages)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Industrial Engineering Standard</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-14">Seq</th>
                <th className="py-2.5 px-3">Stage &amp; Department</th>
                <th className="py-2.5 px-3">Input Materials</th>
                <th className="py-2.5 px-3">Process Transformation</th>
                <th className="py-2.5 px-3">Quality Gate &amp; Tolerance</th>
                <th className="py-2.5 px-3">Standard Tool / Machinery</th>
                <th className="py-2.5 px-3 text-right w-20">Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {steps.map((st) => (
                <tr key={st.stepNumber} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100 block text-center">
                      0{st.stepNumber}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{st.stageName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{st.department}</div>
                    {st.criticalGate && (
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Critical Gate
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 max-w-[150px]">
                    <span className="line-clamp-2" title={st.inputMaterials}>{st.inputMaterials}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-[200px]">
                    <span className="line-clamp-2" title={st.transformation}>{st.transformation}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-800 max-w-[200px]">
                    <span className="font-medium block leading-snug">{st.qualityGate}</span>
                    {st.toleranceSpecs && (
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        Tol: {st.toleranceSpecs}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-blue-700">
                    {st.standardTool}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    {st.leadTimeHours} hrs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDUSTRIAL ENGINEERING GOVERNANCE SIGN-OFF */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Industrial Engineering &amp; Operational Governance
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Sign-off Verification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Prepared By</span>
            <div className="font-bold text-slate-900">{flow.author || 'Industrial Engineering (IE) Lead'}</div>
            <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" />
              <span>Standard Motion &amp; Time Study Verified</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Signoff</span>
            <div className="font-bold text-slate-900">{flow.approvedBy || 'Head of Quality Assurance'}</div>
            <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" />
              <span>Critical AQL Quality Gates Authorized</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Effective Window</span>
            <div className="font-mono font-semibold text-slate-800">
              {flow.effectiveDate} to {flow.reviewDate || 'Annual Review'}
            </div>
            <div className="text-[10px] text-slate-400">
              Standard manufacturing protocol for all line allocations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
