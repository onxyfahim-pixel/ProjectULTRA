'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Layers,
  Clock,
  Target,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Download,
  Plus,
  Play,
  RotateCcw,
  GitCommit,
  Truck,
  ShieldAlert,
} from 'lucide-react';
import {
  ProductionPlanSchedule,
  ProductionOrderPlan,
} from '@/lib/types/planning-ie';

interface ProductionPlanningTabProps {
  schedules: ProductionPlanSchedule[];
  orders: ProductionOrderPlan[];
  onAddSchedule: (schedule: ProductionPlanSchedule) => void;
  onUpdateScheduleStatus: (id: string, newStatus: any) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
}

type ViewMode = 'mps' | 'gantt' | 'tna' | 'loading';

export function ProductionPlanningTab({
  schedules,
  orders,
  onAddSchedule,
  onUpdateScheduleStatus,
  onExportCsv,
}: ProductionPlanningTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('mps');
  const [selectedPeriod, setSelectedPeriod] = useState<'MONTHLY' | 'WEEKLY' | 'DAILY'>('MONTHLY');

  // Total metrics
  const totalPlannedOutput = useMemo(() => {
    return schedules.reduce((acc, s) => acc + (s.orderQuantity || 0), 0);
  }, [schedules]);

  const totalDailyTarget = useMemo(() => {
    return schedules.reduce((acc, s) => acc + (s.plannedDailyTarget || 0), 0);
  }, [schedules]);

  return (
    <div className="space-y-6">
      {/* Top Planning View Selector & Period Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setViewMode('mps')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'mps'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>03. Master Production Schedule (MPS)</span>
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'gantt'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>30. Interactive Gantt Timeline</span>
          </button>
          <button
            onClick={() => setViewMode('tna')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'tna'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>31. TNA / Delivery Milestones Link</span>
          </button>
          <button
            onClick={() => setViewMode('loading')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'loading'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Line Loading & Ramp-Up</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'mps' && (
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs">
              {(['MONTHLY', 'WEEKLY', 'DAILY'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 font-semibold cursor-pointer ${
                    selectedPeriod === period
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => onExportCsv('Master_Production_Schedules.csv', schedules)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MASTER PRODUCTION SCHEDULE (MPS) */}
      {viewMode === 'mps' && (
        <div className="space-y-4">
          {/* Top Capacity Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Scheduled Order Qty</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{totalPlannedOutput.toLocaleString()} pcs</div>
              <div className="text-[11px] text-blue-600 font-medium mt-0.5">Across {schedules.length} Active Lines</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Daily Scheduled Pace</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">{totalDailyTarget.toLocaleString()} pcs/day</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">8h Standard Pace Target</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Plan Approval Stage</div>
              <div className="text-xl font-bold text-indigo-700 mt-1">APPROVED &amp; RELEASED</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">IE Manager &amp; Planning Head Signed</div>
            </div>
          </div>

          {/* MPS Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Line & Unit</th>
                    <th className="p-3">Order # & Buyer</th>
                    <th className="p-3">Style & Description</th>
                    <th className="p-3 text-right">Order Qty</th>
                    <th className="p-3 text-right">SMV</th>
                    <th className="p-3 text-center">Allocated Manpower</th>
                    <th className="p-3 text-right">Daily Target</th>
                    <th className="p-3">Schedule Duration</th>
                    <th className="p-3 text-center">Status & Approval</th>
                    <th className="p-3 text-center">Plan Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{sch.lineName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{sch.lineId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{sch.orderNumber}</div>
                        <div className="text-slate-600 font-medium">{sch.buyerName}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-800">{sch.styleNumber}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{sch.styleDescription}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {sch.orderQuantity.toLocaleString()} pcs
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">{sch.smv}m</td>
                      <td className="p-3 text-center font-bold text-slate-800">{sch.allocatedOperators} Ops</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {sch.plannedDailyTarget.toLocaleString()} pcs
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">
                        <div>Start: {sch.startDate}</div>
                        <div>End: {sch.endDate} ({sch.daysRequired} days)</div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            sch.status === 'RUNNING'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sch.status === 'SCHEDULED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sch.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={sch.status}
                          onChange={(e) => onUpdateScheduleStatus(sch.id, e.target.value)}
                          className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="SCHEDULED">SCHEDULED</option>
                          <option value="RUNNING">RUNNING</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="DELAYED">DELAYED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE GANTT TIMELINE */}
      {viewMode === 'gantt' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Visual Line Loading Gantt Timeline (Sep &ndash; Nov 2026)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-line allocation, style changeover gaps, and learning curve ramp-ups
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> Knit Lines
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span> Denim Line
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {schedules.map((sch) => {
              const startDay = new Date(sch.startDate).getDate();
              const duration = sch.daysRequired;
              const leftPercent = Math.max(5, Math.min(75, (startDay / 30) * 100));
              const widthPercent = Math.max(15, Math.min(85, (duration / 40) * 100));

              return (
                <div key={sch.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{sch.lineName}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {sch.styleNumber} ({sch.orderNumber}) &bull; {sch.startDate} &rarr; {sch.endDate}
                    </span>
                  </div>

                  <div className="w-full h-11 bg-slate-100 rounded-xl relative overflow-hidden flex items-center p-1">
                    {/* Time Grid Guidelines */}
                    <div className="absolute inset-0 flex justify-between px-4 pointer-events-none opacity-20">
                      <div className="border-r border-slate-400 h-full"></div>
                      <div className="border-r border-slate-400 h-full"></div>
                      <div className="border-r border-slate-400 h-full"></div>
                      <div className="border-r border-slate-400 h-full"></div>
                    </div>

                    <div
                      className={`h-full rounded-lg shadow-xs flex items-center justify-between px-3 text-white text-xs font-semibold transition-all ${
                        sch.lineId.includes('04') ? 'bg-indigo-600' : 'bg-blue-600'
                      }`}
                      style={{
                        marginLeft: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      <div className="truncate">
                        <span>{sch.styleNumber}</span> &bull;{' '}
                        <span className="font-mono text-[11px] opacity-90">{sch.plannedDailyTarget} pcs/d</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/20 shrink-0">
                        {sch.daysRequired}d
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: TNA / DELIVERY MILESTONES LINK */}
      {viewMode === 'tna' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Time &amp; Action (TNA) &amp; Order Delivery Risk Engine
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Order &rarr; Cutting &rarr; Sewing &rarr; Finishing &rarr; QA Final &rarr; Packing &rarr; Shipment
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Live TNA Linked
            </span>
          </div>

          <div className="space-y-4">
            {orders.slice(0, 3).map((ord) => (
              <div key={ord.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{ord.buyer}</span> &bull;{' '}
                    <span className="font-mono text-blue-700 font-bold">{ord.po}</span> ({ord.style})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-600">
                      Planned Delivery: <strong className="text-slate-900">{ord.deliveryDate}</strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        ord.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {ord.priority === 'URGENT' ? 'CRITICAL TNA' : 'ON TRACK'}
                    </span>
                  </div>
                </div>

                {/* Milestone Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                    <div className="text-[10px] font-bold text-emerald-600">1. PO Placed</div>
                    <div className="text-[11px] font-bold text-slate-800 mt-1">COMPLETED</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                    <div className="text-[10px] font-bold text-emerald-600">2. Fabric Inward</div>
                    <div className="text-[11px] font-bold text-slate-800 mt-1">PASSED</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                    <div className="text-[10px] font-bold text-emerald-600">3. Cutting</div>
                    <div className="text-[11px] font-bold text-slate-800 mt-1">100% CUT</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-300 shadow-2xs bg-blue-50/30">
                    <div className="text-[10px] font-bold text-blue-600">4. Sewing</div>
                    <div className="text-[11px] font-bold text-blue-700 mt-1">IN PROGRESS</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400">5. Finishing</div>
                    <div className="text-[11px] font-bold text-slate-600 mt-1">QUEUED</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400">6. AQL Final</div>
                    <div className="text-[11px] font-bold text-slate-600 mt-1">SCHEDULED</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400">7. Shipment</div>
                    <div className="text-[11px] font-bold text-slate-600 mt-1">{ord.deliveryDate}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: LINE LOADING & RAMP-UP */}
      {viewMode === 'loading' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Style Learning Curve &amp; Daily Ramp-Up Targets
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Target efficiency ramp: Day 1 (40%), Day 2 (65%), Day 3 (85%), Day 4+ (100% Target)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map((sch) => (
              <div key={sch.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{sch.lineName}</span>
                  <span className="text-[11px] font-mono text-blue-700 font-bold">{sch.styleNumber}</span>
                </div>
                <div className="text-xs text-slate-600">{sch.styleDescription}</div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Day 1 Ramp:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {Math.round(sch.plannedDailyTarget * (sch.learningCurveRampUp.day1Percent / 100))} pcs ({sch.learningCurveRampUp.day1Percent}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Day 2 Ramp:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {Math.round(sch.plannedDailyTarget * (sch.learningCurveRampUp.day2Percent / 100))} pcs ({sch.learningCurveRampUp.day2Percent}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Day 3 Ramp:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {Math.round(sch.plannedDailyTarget * (sch.learningCurveRampUp.day3Percent / 100))} pcs ({sch.learningCurveRampUp.day3Percent}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200/40">
                    <span>Full Target (Day 4+):</span>
                    <span className="font-mono">{sch.plannedDailyTarget} pcs/day</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
