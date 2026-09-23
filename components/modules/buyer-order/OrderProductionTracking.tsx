'use client';

import React, { useState } from 'react';
import {
  Activity,
  Edit,
  CheckCircle2,
  Clock,
  Scissors,
  Check,
  Calendar,
  Layers,
  Sparkles,
  X,
  Plus,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { ProductionStageDetail } from '@/lib/types/modules';
import {
  getSewingProductionTrackForPO,
  calculateRecordCheckedQty,
  SewingProductionTrackSummary,
  SEWING_TRACK_UPDATED_EVENT,
} from '@/lib/db/production-records-store';

interface OrderProductionTrackingProps {
  orderId: string;
  orderNumber: string;
  currentStatus: 'PLANNED' | 'CUTTING' | 'SEWING' | 'PACKING' | 'READY_AUDIT' | 'SHIPPED';
  orderQuantity: number;
  stagesData?: ProductionStageDetail[];
  onUpdateStages?: (stages: ProductionStageDetail[], newStatus: any) => void;
  showToast: (msg: string) => void;
  readOnly?: boolean;
}

const DEFAULT_STAGES: ProductionStageDetail[] = [
  {
    stage: 'PLANNED',
    startDate: '2026-09-01',
    actualEndDate: '2026-09-10',
    plannedPcs: 25000,
    actualPcs: 25000,
    status: 'COMPLETED',
    notes: 'Buyer approved lab dips, gold seal sample, and master tech pack.',
  },
  {
    stage: 'CUTTING',
    startDate: '2026-09-12',
    targetEndDate: '2026-09-22',
    actualEndDate: '2026-09-20',
    plannedPcs: 25000,
    actualPcs: 25250,
    status: 'COMPLETED',
    notes: 'Fabric relaxed 24h before cutting. 1% over-cut buffer included.',
    inspector: 'Ziaur Rahman (Cutting QC)',
  },
  {
    stage: 'SEWING',
    startDate: '2026-09-22',
    targetEndDate: '2026-10-14',
    plannedPcs: 25000,
    actualPcs: 16800,
    efficiencyPercent: 79.5,
    rejectionPcs: 142,
    status: 'IN_PROGRESS',
    assignedLines: ['Sewing Line 02', 'Sewing Line 05', 'Sewing Line 08'],
    notes: 'Assembly running across 3 lines. Daily target 1,200 pcs/line.',
    inspector: 'Monirul Islam (Senior Inline QA)',
  },
  {
    stage: 'PACKING',
    startDate: '2026-10-15',
    targetEndDate: '2026-10-22',
    plannedPcs: 25000,
    actualPcs: 0,
    status: 'PENDING',
    notes: 'Thread trimming, tunnel ironing, hangtag attachment, carton packing.',
  },
  {
    stage: 'READY_AUDIT',
    startDate: '2026-10-23',
    targetEndDate: '2026-10-25',
    plannedPcs: 25000,
    status: 'PENDING',
    notes: 'Pre-shipment Final Random Inspection (FRI) per AQL 1.5 Major / 4.0 Minor.',
  },
  {
    stage: 'SHIPPED',
    startDate: '2026-10-28',
    status: 'PENDING',
    notes: 'Container loaded, seal verified, gated in at export port.',
  },
];

export function OrderProductionTracking({
  orderId,
  orderNumber,
  currentStatus,
  orderQuantity,
  stagesData,
  onUpdateStages,
  showToast,
  readOnly = false,
}: OrderProductionTrackingProps) {
  const [stages, setStages] = useState<ProductionStageDetail[]>(
    stagesData && stagesData.length > 0 ? stagesData : DEFAULT_STAGES
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStageForEdit, setSelectedStageForEdit] = useState<ProductionStageDetail | null>(null);

  // Live Auto-Linked Sewing Production Track for this specific PO
  const [sewingTrack, setSewingTrack] = useState<SewingProductionTrackSummary>(() =>
    getSewingProductionTrackForPO(orderNumber)
  );

  React.useEffect(() => {
    const refreshSewing = () => {
      setSewingTrack(getSewingProductionTrackForPO(orderNumber));
    };
    refreshSewing();

    const handleUpdate = () => refreshSewing();
    window.addEventListener(SEWING_TRACK_UPDATED_EVENT, handleUpdate);
    window.addEventListener('erp_production_records_updated', handleUpdate);
    return () => {
      window.removeEventListener(SEWING_TRACK_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('erp_production_records_updated', handleUpdate);
    };
  }, [orderNumber]);

  // Merge stages with auto-linked Sewing Total Checked Quantity
  const displayStages = React.useMemo(() => {
    return stages.map((st) => {
      if (st.stage === 'SEWING' && sewingTrack.totalCheckedQty > 0) {
        return {
          ...st,
          actualPcs: sewingTrack.totalCheckedQty, // ONLY Sewing Total Checked Quantity
          status:
            sewingTrack.totalCheckedQty >= (st.plannedPcs || orderQuantity)
              ? ('COMPLETED' as const)
              : ('IN_PROGRESS' as const),
          assignedLines: sewingTrack.lines.length > 0 ? sewingTrack.lines : st.assignedLines,
          inspector:
            sewingTrack.inspectors.length > 0
              ? sewingTrack.inspectors.join(', ')
              : st.inspector,
          notes: `Auto-linked from sewing records (${sewingTrack.totalCheckedQty.toLocaleString()} checked pcs across ${sewingTrack.recordsCount} record${sewingTrack.recordsCount > 1 ? 's' : ''})`,
        };
      }
      return st;
    });
  }, [stages, sewingTrack, orderQuantity]);

  // Active stage helper
  const stageWeights: Record<string, number> = {
    PLANNED: 1,
    CUTTING: 2,
    SEWING: 3,
    PACKING: 4,
    READY_AUDIT: 5,
    SHIPPED: 6,
  };

  const handleOpenEditStage = (stageObj: ProductionStageDetail) => {
    if (readOnly) return;
    setSelectedStageForEdit({ ...stageObj });
    setIsEditModalOpen(true);
  };

  const handleSaveStageEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !selectedStageForEdit) return;

    const updated = stages.map((s) =>
      s.stage === selectedStageForEdit.stage ? selectedStageForEdit : s
    );
    setStages(updated);

    // If marked completed and there's a next stage, allow status advancement
    if (selectedStageForEdit.status === 'COMPLETED') {
      const nextMap: Record<string, any> = {
        PLANNED: 'CUTTING',
        CUTTING: 'SEWING',
        SEWING: 'PACKING',
        PACKING: 'READY_AUDIT',
        READY_AUDIT: 'SHIPPED',
      };
      if (nextMap[selectedStageForEdit.stage]) {
        onUpdateStages?.(updated, nextMap[selectedStageForEdit.stage]);
      } else {
        onUpdateStages?.(updated, currentStatus);
      }
    } else {
      onUpdateStages?.(updated, currentStatus);
    }

    setIsEditModalOpen(false);
    showToast(`Updated production stage ${selectedStageForEdit.stage}`);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Header with Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Production Floor Tracking &amp; Stage Milestones
            </h3>
            <p className="text-[11px] text-slate-500">
              Output monitoring across cutting, sewing lines, finishing, and pre-shipment audit
            </p>
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              const activeStageObj = stages.find((s) => s.stage === currentStatus) || stages[0];
              handleOpenEditStage(activeStageObj);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Active Stage</span>
          </button>
        )}
      </div>

      {/* Visual Stepper Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {displayStages.map((st, idx) => {
          const currentWeight = stageWeights[currentStatus] || 1;
          const thisWeight = idx + 1;
          const isPassed = thisWeight < currentWeight || st.status === 'COMPLETED';
          const isCurrent = thisWeight === currentWeight && st.status !== 'COMPLETED';

          return (
            <div
              key={st.stage}
              onClick={() => {
                if (!readOnly) handleOpenEditStage(st);
              }}
              className={`p-3 rounded-xl border text-xs transition-all duration-200 ${
                !readOnly ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'
              } ${
                isCurrent
                  ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : isPassed
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-bold ${
                    isCurrent ? 'text-blue-900' : isPassed ? 'text-emerald-900' : 'text-slate-600'
                  }`}
                >
                  {idx + 1}. {st.stage.replace('_', ' ')}
                </span>
                {isPassed ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                ) : !readOnly ? (
                  <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                ) : null}
              </div>

              <div className="text-[10px] space-y-0.5">
                <div className={isCurrent ? 'text-blue-700 font-semibold' : 'text-slate-500'}>
                  {st.status.replace('_', ' ')}
                </div>
                {st.actualPcs !== undefined && (
                  <div className="font-mono text-[10px] text-slate-700">
                    {st.actualPcs.toLocaleString()} pcs
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Stage Detailed Breakdown Card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Active Stage Progress: {currentStatus.replace(/_/g, ' ')}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              In Production
            </span>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                const active = stages.find((s) => s.stage === currentStatus) || stages[0];
                handleOpenEditStage(active);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Update Stage Details</span>
              <Edit className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Metric Cards inside current stage */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[10px]">Planned Target:</span>
            <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
              {orderQuantity.toLocaleString()} pcs
            </div>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[10px]">Current Completed Output:</span>
            <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
              {(stages.find((s) => s.stage === currentStatus)?.actualPcs || Math.round(orderQuantity * 0.55)).toLocaleString()} pcs
            </div>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[10px]">Sewing Efficiency:</span>
            <div className="font-mono font-bold text-blue-700 text-sm mt-0.5">
              {stages.find((s) => s.stage === currentStatus)?.efficiencyPercent || 78.5}%
            </div>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-500 text-[10px]">Assigned Sewing Lines:</span>
            <div className="font-semibold text-slate-800 text-xs mt-0.5 truncate">
              {stages.find((s) => s.stage === currentStatus)?.assignedLines?.join(', ') || 'Line 02, Line 05, Line 08'}
            </div>
          </div>
        </div>

        {/* Stage Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 text-[11px]">Cumulative Stage Completion:</span>
            <span className="font-mono font-bold text-slate-900">
              {Math.min(
                100,
                Math.round(
                  (((displayStages.find((s) => s.stage === currentStatus)?.actualPcs || orderQuantity * 0.55) /
                    orderQuantity) *
                    100)
                )
              )}
              %
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (((displayStages.find((s) => s.stage === currentStatus)?.actualPcs || orderQuantity * 0.55) /
                      orderQuantity) *
                      100)
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* REAL-TIME AUTO-LINKED SEWING PRODUCTION TRACK RECORD (TOTAL CHECKED QUANTITY) */}
      {sewingTrack.totalCheckedQty > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/90 via-blue-50/70 to-indigo-50/50 border border-emerald-200 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Sewing Production Track — Total Checked Quantity</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Auto-Linked from Production Module
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Total garment units checked across {sewingTrack.recordsCount} uploaded sewing floor record{sewingTrack.recordsCount > 1 ? 's' : ''} for PO {orderNumber}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-0 border-emerald-200">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Sewing Total Checked</span>
              <span className="font-mono font-bold text-base text-emerald-700">
                {sewingTrack.totalCheckedQty.toLocaleString()} pcs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
              <span className="text-slate-400 text-[10px] block">Sewing Checked Pcs</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {sewingTrack.totalCheckedQty.toLocaleString()} pcs
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
              <span className="text-slate-400 text-[10px] block">Passed Quality (RFT)</span>
              <span className="font-mono font-bold text-blue-700 text-sm">
                {sewingTrack.totalPassedQty.toLocaleString()} pcs ({sewingTrack.avgRFT}%)
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
              <span className="text-slate-400 text-[10px] block">Defects &amp; DHU%</span>
              <span className="font-mono font-bold text-amber-700 text-sm">
                {sewingTrack.totalDefects.toLocaleString()} pcs ({sewingTrack.avgDHU}% DHU)
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
              <span className="text-slate-400 text-[10px] block">Active Sewing Line(s)</span>
              <span className="font-semibold text-slate-800 text-xs truncate block" title={sewingTrack.lines.join(', ')}>
                {sewingTrack.lines.join(', ') || 'Sewing Floor'}
              </span>
            </div>
          </div>

          {/* Uploaded Sewing Records Breakdown Table */}
          <div className="border border-emerald-100 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 px-3">Record Date</th>
                  <th className="py-2 px-3">Sewing Section &amp; Line</th>
                  <th className="py-2 px-3">Quality Inspector</th>
                  <th className="py-2 px-3 text-right">Checked Qty</th>
                  <th className="py-2 px-3 text-right">Passed</th>
                  <th className="py-2 px-3 text-right">Defects (DHU%)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sewingTrack.records.map((r) => {
                  const chk = calculateRecordCheckedQty(r);
                  const def = r.totalDefects || 0;
                  const pass = Math.max(0, chk - def);
                  const dhu = r.dhuRate || (chk > 0 ? Number(((def / chk) * 100).toFixed(2)) : 0);
                  const dateStr = r.recordDate || (r.createdAt ? r.createdAt.split('T')[0] : '2026-09-21');

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-semibold text-slate-700">{dateStr}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{r.section || r.sewingLine}</td>
                      <td className="py-2 px-3 text-slate-600">{r.qualityInspector || 'Assigned QC'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        {chk.toLocaleString()} pcs
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        {pass.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-amber-700">
                        {def} ({dhu}%)
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCTION STAGE */}
      {isEditModalOpen && selectedStageForEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Stage: {selectedStageForEdit.stage.replace(/_/g, ' ')}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStageEdit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Stage Status</label>
                  <select
                    value={selectedStageForEdit.status}
                    onChange={(e) =>
                      setSelectedStageForEdit({
                        ...selectedStageForEdit,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Actual Completed Output (pcs)</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedStageForEdit.actualPcs || 0}
                    onChange={(e) =>
                      setSelectedStageForEdit({
                        ...selectedStageForEdit,
                        actualPcs: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={selectedStageForEdit.startDate || ''}
                    onChange={(e) =>
                      setSelectedStageForEdit({
                        ...selectedStageForEdit,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target / End Date</label>
                  <input
                    type="date"
                    value={selectedStageForEdit.targetEndDate || selectedStageForEdit.actualEndDate || ''}
                    onChange={(e) =>
                      setSelectedStageForEdit({
                        ...selectedStageForEdit,
                        targetEndDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Assigned Inspector / QA</label>
                  <input
                    type="text"
                    placeholder="e.g. Monirul Islam"
                    value={selectedStageForEdit.inspector || ''}
                    onChange={(e) =>
                      setSelectedStageForEdit({
                        ...selectedStageForEdit,
                        inspector: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Line Efficiency %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={selectedStageForEdit.efficiencyPercent || 78}
                    onChange={(e) =>
                      setSelectedStageForEdit({
                        ...selectedStageForEdit,
                        efficiencyPercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Production Stage Notes</label>
                <textarea
                  rows={2}
                  value={selectedStageForEdit.notes || ''}
                  onChange={(e) =>
                    setSelectedStageForEdit({
                      ...selectedStageForEdit,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  placeholder="Record line output notes, QC findings, or defect details..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Save Stage Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
