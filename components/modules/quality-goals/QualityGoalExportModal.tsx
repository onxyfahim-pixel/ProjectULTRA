'use client';

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  FileDown,
  ShieldCheck,
  Check,
  Target,
} from 'lucide-react';
import { QualityGoal } from '@/lib/types/modules';
import {
  computeGoalsReportKpis,
  exportQualityGoalsSummaryPdf,
  exportQualityGoalsSummaryExcel,
} from './quality-goals-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';

interface QualityGoalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allGoals: QualityGoal[];
  selectedGoals: QualityGoal[];
}

export function QualityGoalExportModal({
  isOpen,
  onClose,
  allGoals,
  selectedGoals,
}: QualityGoalExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedGoals.length > 0 ? 'selected' : 'all'
  );

  React.useEffect(() => {
    if (selectedGoals.length > 0) {
      setExportScope('selected');
    } else {
      setExportScope('all');
    }
  }, [selectedGoals.length, isOpen]);

  if (!isOpen) return null;

  const targetGoals = exportScope === 'selected' && selectedGoals.length > 0 ? selectedGoals : allGoals;
  const metrics = computeGoalsReportKpis(targetGoals);
  const pdfSettings = loadPdfHeaderSettings();

  const handleExportPdf = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Records (${targetGoals.length} of ${allGoals.length} Objectives)`
        : `All Records (${allGoals.length} Objectives)`;
    exportQualityGoalsSummaryPdf(targetGoals, scopeLabel);
    onClose();
  };

  const handleExportExcel = () => {
    const scopeLabel =
      exportScope === 'selected'
        ? `Selected Records (${targetGoals.length} of ${allGoals.length} Objectives)`
        : `All Records (${allGoals.length} Objectives)`;
    exportQualityGoalsSummaryExcel(targetGoals, scopeLabel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Global Export: Quality Goals</h3>
              <p className="text-xs text-slate-400">
                Generate strategic quality objectives register in PDF or Excel format
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Linked PDF Header Notice */}
        <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">
              <strong>Header Linked from Settings:</strong> {pdfSettings.companyName || 'Valiant Garments'} ({pdfSettings.layoutStyle.replace('_', ' ')})
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
            Live Synced
          </span>
        </div>

        <div className="p-6 space-y-5">
          {/* Export Scope Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Export Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">All Objectives</span>
                  {exportScope === 'all' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Export complete register ({allGoals.length} strategic quality goals)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('selected')}
                disabled={selectedGoals.length === 0}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedGoals.length === 0
                    ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                    : exportScope === 'selected'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 cursor-pointer'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Selected Objectives ({selectedGoals.length})
                  </span>
                  {exportScope === 'selected' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedGoals.length > 0
                    ? `Export only the ${selectedGoals.length} items checked in table`
                    : 'Check checkboxes in table to select objectives'}
                </p>
              </button>
            </div>
          </div>

          {/* Goals Summary Preview */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Export Scope Summary</span>
              <span className="font-mono text-blue-700 font-bold">{targetGoals.length} Goals Selected</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Achieved</div>
                <div className="text-sm font-black font-mono text-emerald-600">{metrics.achievedCount}</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">In Progress</div>
                <div className="text-sm font-black font-mono text-blue-600">{metrics.inProgressCount}</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Behind Target</div>
                <div className="text-sm font-black font-mono text-rose-600">{metrics.behindCount}</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Avg Progress</div>
                <div className="text-sm font-black font-mono text-indigo-600">{metrics.avgProgress}%</div>
              </div>
            </div>
          </div>

          {/* Export Format Action Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Output Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PDF Button */}
              <div
                onClick={handleExportPdf}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-600 bg-white hover:bg-blue-50/20 transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        PDF Objectives Register
                      </h4>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        .PDF
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Formatted A4 landscape report with milestone roadmap & KPIs
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors shrink-0"
                >
                  Print / Save
                </button>
              </div>

              {/* Excel Button */}
              <div
                onClick={handleExportExcel}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Excel Register
                      </h4>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        .XLS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Raw data spreadsheet with objectives, baselines, and milestones
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white rounded-lg transition-colors shrink-0"
                >
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
