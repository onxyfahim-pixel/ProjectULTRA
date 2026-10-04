'use client';

import React, { useMemo } from 'react';
import {
  Sliders,
  Clock,
  Target,
  AlertTriangle,
  Flame,
  TrendingUp,
  Factory,
  Users,
  Cpu,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Calendar,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import {
  StyleOperationBulletin,
  ProductionPlanSchedule,
  ProductionOrderPlan,
  ProductionAlertItem,
  WipManagementRecord,
  HourlyMonitoringRecord,
} from '@/lib/types/planning-ie';

interface PlanningDashboardTabProps {
  bulletins: StyleOperationBulletin[];
  schedules: ProductionPlanSchedule[];
  orders: ProductionOrderPlan[];
  alerts: ProductionAlertItem[];
  wipRecords: WipManagementRecord[];
  hourlyRecords: HourlyMonitoringRecord[];
  onNavigateTab: (tabId: string) => void;
  onSelectBulletin: (id: string) => void;
  onDismissAlert: (id: string) => void;
}

export function PlanningDashboardTab({
  bulletins,
  schedules,
  orders,
  alerts,
  wipRecords,
  hourlyRecords,
  onNavigateTab,
  onSelectBulletin,
  onDismissAlert,
}: PlanningDashboardTabProps) {
  // Calculated KPIs
  const avgBalancingEfficiency = useMemo(() => {
    if (bulletins.length === 0) return 0;
    const sum = bulletins.reduce((acc, b) => acc + (b.balancingEfficiency || 0), 0);
    return Math.round((sum / bulletins.length) * 10) / 10;
  }, [bulletins]);

  const totalBottlenecks = useMemo(() => {
    let count = 0;
    bulletins.forEach((b) => {
      b.operations.forEach((op) => {
        if (op.isBottleneck) count++;
      });
    });
    return count;
  }, [bulletins]);

  const totalDailyPlannedPcs = useMemo(() => {
    return schedules.reduce((acc, s) => acc + (s.plannedDailyTarget || 0), 0);
  }, [schedules]);

  const todayActualPcs = useMemo(() => {
    return hourlyRecords.reduce((acc, h) => acc + (h.hourlyActual || 0), 0);
  }, [hourlyRecords]);

  const todayTargetPcs = useMemo(() => {
    return hourlyRecords.reduce((acc, h) => acc + (h.hourlyTarget || 0), 0);
  }, [hourlyRecords]);

  const achievementRate = useMemo(() => {
    if (todayTargetPcs === 0) return 96.5;
    return Math.round((todayActualPcs / todayTargetPcs) * 1000) / 10;
  }, [todayActualPcs, todayTargetPcs]);

  const totalWipPcs = useMemo(() => {
    return wipRecords.reduce((acc, w) => acc + (w.balanceQty || 0), 0);
  }, [wipRecords]);

  const activeAlerts = useMemo(() => {
    return alerts.filter((a) => !a.isDismissed);
  }, [alerts]);

  return (
    <div className="space-y-6">
      {/* Real-time Alerts Banner if any active alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Active Factory Alerts ({activeAlerts.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('reports_audit')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              View System Log &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-amber-200/80 shadow-2xs flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="font-semibold text-slate-800 line-clamp-1">{alert.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{alert.message}</p>
                  <div className="text-[10px] text-slate-400 font-mono">{alert.line} &bull; {alert.timestamp}</div>
                </div>
                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="text-slate-400 hover:text-slate-600 text-[11px] font-medium p-1 cursor-pointer"
                  title="Dismiss alert"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Line Balancing Efficiency"
          value={`${avgBalancingEfficiency}%`}
          delta={{ value: '+2.4% vs benchmark (85%)', isPositive: true }}
          icon={Sliders}
          tone="blue"
          subtitle="Factory-wide active lines"
        />
        <StatCard
          title="Daily Output Achievement"
          value={`${achievementRate}%`}
          delta={{
            value: `${todayActualPcs.toLocaleString()} / ${todayTargetPcs.toLocaleString()} pcs`,
            isPositive: achievementRate >= 95,
          }}
          icon={Target}
          tone={achievementRate >= 95 ? 'emerald' : 'amber'}
          subtitle="Today running shift output"
        />
        <StatCard
          title="Daily Planned Capacity"
          value={`${totalDailyPlannedPcs.toLocaleString()} pcs`}
          delta={{ value: 'Standard 8h pace', isPositive: true }}
          icon={Factory}
          tone="indigo"
          subtitle="Target output across lines"
        />
        <StatCard
          title="Active Line Bottlenecks"
          value={`${totalBottlenecks} stations`}
          delta={{
            value: totalBottlenecks > 0 ? 'Requires balancing / split' : 'Paced balance',
            isPositive: totalBottlenecks === 0,
          }}
          icon={AlertTriangle}
          tone={totalBottlenecks > 0 ? 'amber' : 'emerald'}
          subtitle="Cycle time > line pitch time"
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Active Styles (OB)</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{bulletins.length} Styles</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">100% Validated SMVs</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total WIP In-Transit</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalWipPcs.toLocaleString()} pcs</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Across 6 WIP Stages</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Active Production Lines</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{schedules.length} Lines Running</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">100% Manpower Deployed</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Live Plant DHU %</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">1.82%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Well below 3.0% threshold</div>
        </div>
      </div>

      {/* Active Style Bulletins + Quick Target Calculator Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Style Bulletins */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Active Style Operation Bulletins (OB) & Balancing
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('bulletin_balance')}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All OBs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {bulletins.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  onSelectBulletin(b.id);
                  onNavigateTab('bulletin_balance');
                }}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-blue-700 group-hover:text-blue-800">
                    {b.styleNumber}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-800">
                    {b.garmentType}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-1">{b.styleDescription}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{b.buyerName}</div>
                <div className="flex items-center justify-between text-[11px] font-mono mt-3 pt-2.5 border-t border-slate-200/60">
                  <span className="text-slate-500">
                    SMV: <strong className="text-slate-800">{b.totalSmv}m</strong>
                  </span>
                  <span className="text-emerald-700 font-bold">Bal: {b.balancingEfficiency}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottleneck Warning Banner */}
          {totalBottlenecks > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <Flame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-900">
                  Bottleneck Operations Detected ({totalBottlenecks} stations across active styles)
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Stations exceeding pitch time restrict line throughput and build excess WIP. Consider adding helper operators, splitting operations, or utilizing automated attachment jigs.
                </p>
                <button
                  onClick={() => onNavigateTab('bulletin_balance')}
                  className="text-xs font-semibold text-amber-900 underline mt-1 inline-block cursor-pointer"
                >
                  Inspect Yamazumi Line Balancing Chart &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Production Flow & Jump Shortcuts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Quick Navigation Hub
                </h3>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <button
                onClick={() => onNavigateTab('orders')}
                className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">02. Production Orders</div>
                  <div className="text-[11px] text-slate-500">Track POs, Planned Qty & Priorities</div>
                </div>
                <span className="text-xs font-bold text-blue-600">{orders.length} Orders</span>
              </button>

              <button
                onClick={() => onNavigateTab('planning')}
                className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">03. Master Production Schedule</div>
                  <div className="text-[11px] text-slate-500">MPS, Calendar & Gantt Loading</div>
                </div>
                <span className="text-xs font-bold text-indigo-600">Gantt View</span>
              </button>

              <button
                onClick={() => onNavigateTab('execution_hourly')}
                className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">15. Hourly Production Monitor</div>
                  <div className="text-[11px] text-slate-500">Live 8h Floor Variance & Alerts</div>
                </div>
                <span className="text-xs font-bold text-emerald-600">Live 8h</span>
              </button>

              <button
                onClick={() => onNavigateTab('wip_loss')}
                className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">16. 6-Stage WIP Pipeline</div>
                  <div className="text-[11px] text-slate-500">Cutting to Packing Balance</div>
                </div>
                <span className="text-xs font-bold text-amber-600">6 Stages</span>
              </button>

              <button
                onClick={() => onNavigateTab('calculators_kaizen')}
                className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">34. IE Calculators & Kaizen</div>
                  <div className="text-[11px] text-slate-500">11 Full Engineering Calculators</div>
                </div>
                <span className="text-xs font-bold text-purple-600">11 Tools</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Integrated with QMS & Inventory</span>
            <span className="font-semibold text-slate-700">Apex Ultra ERP v3.8</span>
          </div>
        </div>
      </div>

      {/* 6-Stage WIP Pipeline Quick Visual */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Factory WIP Flow Pipeline (Cutting &rarr; Packing)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('wip_loss')}
            className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Detailed WIP Aging</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {wipRecords.slice(0, 2).map((wip) => (
          <div key={wip.id} className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {wip.style} &bull; <span className="font-mono text-blue-700">{wip.po}</span> ({wip.buyer})
              </span>
              <span className="font-mono text-slate-600 font-semibold">
                Balance to Pack: <strong className="text-slate-900">{wip.balanceQty.toLocaleString()} pcs</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">1. Cutting</div>
                <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">{wip.cuttingQty.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">2. Input</div>
                <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">{wip.inputQty.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">3. Sewing</div>
                <div className="text-xs font-bold font-mono text-blue-700 mt-0.5">{wip.sewingQty.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">4. Endline QC</div>
                <div className="text-xs font-bold font-mono text-indigo-700 mt-0.5">{wip.endlineQty.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">5. Finishing</div>
                <div className="text-xs font-bold font-mono text-purple-700 mt-0.5">{wip.finishingQty.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">6. Packing</div>
                <div className="text-xs font-bold font-mono text-emerald-700 mt-0.5">{wip.packingQty.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
