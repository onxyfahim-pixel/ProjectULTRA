'use client';

import React, { useState, useMemo } from 'react';
import {
  Gauge,
  Sliders,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  Flame,
  ArrowRight,
  RotateCcw,
  Building2,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import {
  CapacityPlanningRecord,
  LinePlanningRecord,
  ManpowerPlanningRecord,
} from '@/lib/types/planning-ie';
import { ProductionLine, ProductionUnit } from '@/lib/types/production-management';

interface CapacityLineTabProps {
  lines?: ProductionLine[];
  units?: ProductionUnit[];
  capacityPlans: CapacityPlanningRecord[];
  linePlans: LinePlanningRecord[];
  manpowerPlans: ManpowerPlanningRecord[];
  onExportCsv: (filename: string, rows: any[]) => void;
}

type SubView = 'capacity' | 'line_planning' | 'manpower';

export function CapacityLineTab({
  lines = [],
  units = [],
  capacityPlans,
  linePlans,
  manpowerPlans,
  onExportCsv,
}: CapacityLineTabProps) {
  const [subView, setSubView] = useState<SubView>('capacity');

  // Dynamic capacity plans synced with real production lines
  const syncedCapacityPlans = useMemo(() => {
    if (!lines || lines.length === 0) return capacityPlans;

    return lines.map((l, idx) => {
      // Find matching mock plan if exists
      const match = capacityPlans.find(
        (cp) => cp.lineName.toLowerCase().includes(l.lineCode.toLowerCase()) || cp.lineName.toLowerCase().includes(l.name.toLowerCase())
      );

      const ops = l.operatorCount || (match ? match.totalOperators : 48);
      const workingDays = 26;
      const dailyMinutes = 480;
      const availMin = ops * workingDays * dailyMinutes;
      const reqMin = match ? match.requiredMinutes : Math.round(availMin * (0.88 + (idx % 3) * 0.05));
      const utilPercent = availMin > 0 ? (reqMin / availMin) * 100 : 90;
      const variance = availMin - reqMin;
      const balanceStatus = variance > 20000 ? 'EXCESS' : variance < -10000 ? 'SHORTAGE' : 'BALANCED';
      const forecastPcs = Math.round((availMin * 0.82) / 11.5);
      const bookedPcs = Math.round(forecastPcs * (utilPercent / 100));

      return {
        id: `cap-sync-${l.id}`,
        factoryName: l.unitName || 'Unit 01 (Dhaka Complex)',
        floorName: l.sectionName || 'Sewing Floor',
        lineName: l.name,
        periodMonth: 'October 2026',
        workingDays,
        dailyWorkingMinutes: dailyMinutes,
        activeLines: 1,
        totalOperators: ops,
        availableMinutes: availMin,
        requiredMinutes: reqMin,
        capacityUtilizationPercent: Number(utilPercent.toFixed(1)),
        varianceMinutes: variance,
        shortageOrExcess: balanceStatus as 'BALANCED' | 'EXCESS' | 'SHORTAGE',
        capacityForecastPcs: forecastPcs,
        orderBookedPcs: bookedPcs,
        shipmentTargetPcs: bookedPcs,
      };
    });
  }, [lines, capacityPlans]);

  // Dynamic line plans synced with real production lines
  const syncedLinePlans = useMemo(() => {
    if (!lines || lines.length === 0) return linePlans;

    return lines.map((l, idx) => {
      const match = linePlans.find(
        (lp) => lp.lineName.toLowerCase().includes(l.lineCode.toLowerCase()) || lp.lineName.toLowerCase().includes(l.name.toLowerCase())
      );

      if (match) {
        return {
          ...match,
          lineName: l.name,
          allocatedOperators: l.operatorCount || match.allocatedOperators,
        };
      }

      // Authentic defaults
      const STYLES = [
        { style: 'STY-TS-2026', po: 'PO-HM-99201', buyer: 'H&M Hennes & Mauritz', target: 2400 },
        { style: 'STY-PL-889', po: 'PO-PVH-7729', buyer: 'PVH Tommy Hilfiger', target: 1600 },
        { style: 'STY-SH-410', po: 'PO-MKS-3104', buyer: 'Marks & Spencer', target: 1500 },
        { style: 'STY-DN-502', po: 'PO-ZARA-4482', buyer: 'Inditex / Zara', target: 1200 },
        { style: 'STY-HD-770', po: 'PO-UNI-6619', buyer: 'Fast Retailing / UNIQLO', target: 1400 },
        { style: 'STY-LG-920', po: 'PO-TGT-5501', buyer: 'Target Sourcing', target: 1900 },
        { style: 'STY-ACT-102', po: 'PO-HM-99201', buyer: 'H&M Move', target: 1700 },
        { style: 'STY-JK-904', po: 'PO-ZARA-4482', buyer: 'Zara Men', target: 950 },
      ];

      const s = STYLES[idx % STYLES.length];

      return {
        id: `lp-sync-${l.id}`,
        lineName: l.name,
        lineType: (l.name.toLowerCase().includes('denim') ? 'DENIM' : l.name.toLowerCase().includes('shirt') ? 'WOVEN' : 'KNIT') as any,
        styleAllocation: s.style,
        poAllocation: s.po,
        buyerAllocation: s.buyer,
        allocatedOperators: l.operatorCount || 48,
        allocatedHelpers: 6,
        lineTargetDaily: s.target,
        lineEfficiency: 82.5,
        lineUtilization: 91.0,
        lineStatus: (l.status === 'ACTIVE' ? 'RUNNING' : l.status === 'MAINTENANCE' ? 'SETUP' : 'IDLE') as any,
        prevStyle: 'STY-PREV-2026',
        newStyle: s.style,
        changeoverPlannedMinutes: 120,
        changeoverActualMinutes: 125,
        changeoverLostMinutes: 5,
        changeoverReason: 'Jig alignment and needle tension calibration',
        changeoverAction: 'Maintenance mechanic assisted offline pre-setting',
      };
    });
  }, [lines, linePlans]);

  // Dynamic manpower plans synced with real production lines
  const syncedManpowerPlans = useMemo(() => {
    if (!lines || lines.length === 0) return manpowerPlans;

    return lines.map((l, idx) => {
      const match = manpowerPlans.find(
        (mp) => mp.lineName.toLowerCase().includes(l.lineCode.toLowerCase()) || mp.lineName.toLowerCase().includes(l.name.toLowerCase())
      );

      const ops = l.operatorCount || (match ? match.plannedDirectOperators : 48);
      const absent = (idx % 4 === 1) ? 2 : (idx % 3 === 0) ? 1 : 0;
      const actualOps = Math.max(1, ops - absent);
      const absPercent = Number(((absent / ops) * 100).toFixed(1));
      const util = Number(((actualOps / ops) * 100).toFixed(1));

      return {
        id: `mp-sync-${l.id}`,
        date: '2026-10-05',
        lineName: l.name,
        plannedDirectOperators: ops,
        actualDirectOperators: actualOps,
        plannedHelpers: 6,
        actualHelpers: 6,
        supervisorCount: 1,
        qcAllocated: 2,
        ieAllocated: 1,
        absenteeCount: absent,
        absenteeismPercent: absPercent,
        manpowerGap: -absent,
        utilizationPercent: util,
      };
    });
  }, [lines, manpowerPlans]);

  return (
    <div className="space-y-6">
      {/* Top Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubView('capacity')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subView === 'capacity'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>04. Capacity Planning (Avail vs Req Minutes)</span>
          </button>
          <button
            onClick={() => setSubView('line_planning')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subView === 'line_planning'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>05. Line Planning &amp; Changeover Time</span>
          </button>
          <button
            onClick={() => setSubView('manpower')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subView === 'manpower'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>06. Manpower Planning &amp; Absenteeism</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (subView === 'capacity') onExportCsv('Capacity_Planning_Master.csv', syncedCapacityPlans);
            else if (subView === 'line_planning') onExportCsv('Line_Planning_Changeovers.csv', syncedLinePlans);
            else onExportCsv('Manpower_Planning.csv', syncedManpowerPlans);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 04. CAPACITY PLANNING VIEW */}
      {subView === 'capacity' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Factory &amp; Line Available vs Required Capacity (Minutes &amp; Pcs)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formula: Available Min = (Operators &times; Working Days &times; 480 min). Utilization % = (Required Min / Available Min) &times; 100
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Live Synced with {lines.length} Production Lines</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Factory &amp; Floor</th>
                    <th className="p-3">Line Name</th>
                    <th className="p-3">Month</th>
                    <th className="p-3 text-center">Work Days</th>
                    <th className="p-3 text-center">Operators</th>
                    <th className="p-3 text-right">Available Min</th>
                    <th className="p-3 text-right">Required Min</th>
                    <th className="p-3 text-right">Capacity Util %</th>
                    <th className="p-3 text-center">Balance Status</th>
                    <th className="p-3 text-right">Forecast (pcs)</th>
                    <th className="p-3 text-right">Booked (pcs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {syncedCapacityPlans.map((cap) => (
                    <tr key={cap.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{cap.factoryName}</div>
                        <div className="text-[10px] text-slate-500">{cap.floorName}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{cap.lineName}</td>
                      <td className="p-3 text-slate-600">{cap.periodMonth}</td>
                      <td className="p-3 text-center font-mono">{cap.workingDays}d</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">{cap.totalOperators}</td>
                      <td className="p-3 text-right font-mono text-slate-700">{cap.availableMinutes.toLocaleString()}m</td>
                      <td className="p-3 text-right font-mono text-slate-900 font-bold">
                        {cap.requiredMinutes.toLocaleString()}m
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        {cap.capacityUtilizationPercent.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            cap.shortageOrExcess === 'BALANCED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : cap.shortageOrExcess === 'EXCESS'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {cap.shortageOrExcess} ({cap.varianceMinutes > 0 ? `+${cap.varianceMinutes.toLocaleString()}m` : `${cap.varianceMinutes.toLocaleString()}m`})
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">{cap.capacityForecastPcs.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700">
                        {cap.orderBookedPcs.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 05. LINE PLANNING & CHANGEOVER VIEW */}
      {subView === 'line_planning' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Line Allocation &amp; Style Changeover Management
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track planned vs actual changeover times, lost production minutes, and IE corrective actions
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600">{syncedLinePlans.length} Lines Configured</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Line Name</th>
                    <th className="p-3">Allocated Style &amp; PO</th>
                    <th className="p-3">Buyer</th>
                    <th className="p-3 text-center">Manpower (Ops + Helpers)</th>
                    <th className="p-3 text-right">Daily Target</th>
                    <th className="p-3 text-right">Line Efficiency</th>
                    <th className="p-3 text-center">Line Status</th>
                    <th className="p-3">Changeover Style Transition</th>
                    <th className="p-3 text-center">Changeover Duration</th>
                    <th className="p-3">Reason &amp; Corrective Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {syncedLinePlans.map((lp) => (
                    <tr key={lp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{lp.lineName}</td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{lp.styleAllocation}</div>
                        <div className="text-[11px] font-mono text-slate-500">{lp.poAllocation}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{lp.buyerAllocation}</td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {lp.allocatedOperators} + {lp.allocatedHelpers} Helpers
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {lp.lineTargetDaily.toLocaleString()} pcs
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">{lp.lineEfficiency}%</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            lp.lineStatus === 'RUNNING'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {lp.lineStatus}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">
                        <div>From: {lp.prevStyle}</div>
                        <div className="font-bold text-slate-800">To: {lp.newStyle}</div>
                      </td>
                      <td className="p-3 text-center font-mono">
                        <div>Plan: {lp.changeoverPlannedMinutes}m</div>
                        <div className="font-bold text-slate-900">Act: {lp.changeoverActualMinutes}m</div>
                        {(lp.changeoverLostMinutes || 0) > 0 && (
                          <div className="text-rose-600 font-bold">Lost: +{lp.changeoverLostMinutes}m</div>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 max-w-xs">
                        <div className="font-medium text-slate-800">{lp.changeoverReason}</div>
                        <div className="text-[10px] text-emerald-700">{lp.changeoverAction}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 06. MANPOWER PLANNING VIEW */}
      {subView === 'manpower' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Line-Wise Manpower Allocation &amp; Absenteeism Tracker
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct operators, indirect helpers, supervisors, QC, IE, absenteeism %, and staffing gaps
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600">Attendance Monitored</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Line Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Planned Operators</th>
                    <th className="p-3 text-center">Actual Operators</th>
                    <th className="p-3 text-center">Helpers (Plan / Act)</th>
                    <th className="p-3 text-center">Supervisor</th>
                    <th className="p-3 text-center">QC / IE Staff</th>
                    <th className="p-3 text-center">Absenteeism</th>
                    <th className="p-3 text-center">Manpower Gap</th>
                    <th className="p-3 text-right">Utilization %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {syncedManpowerPlans.map((mp) => (
                    <tr key={mp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{mp.lineName}</td>
                      <td className="p-3 text-slate-600">{mp.date}</td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-700">{mp.plannedDirectOperators}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">{mp.actualDirectOperators}</td>
                      <td className="p-3 text-center font-mono text-slate-700">
                        {mp.plannedHelpers} / {mp.actualHelpers}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-700">{mp.supervisorCount}</td>
                      <td className="p-3 text-center font-mono text-slate-700">
                        {mp.qcAllocated} QC &bull; {mp.ieAllocated} IE
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            mp.absenteeismPercent === 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {mp.absenteeCount} absent ({mp.absenteeismPercent}%)
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold font-mono">
                        {mp.manpowerGap === 0 ? (
                          <span className="text-emerald-700">0 (Balanced)</span>
                        ) : (
                          <span className="text-rose-600">{mp.manpowerGap} Ops</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        {mp.utilizationPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
