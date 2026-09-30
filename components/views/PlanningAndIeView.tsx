'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  Calculator,
  Layers,
  Factory,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Target,
  Users,
  Gauge,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Download,
  Calendar,
  Building2,
  Cpu,
  BarChart3,
  HelpCircle,
  FileSpreadsheet,
  Zap,
  Flame,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { BuyerOrder } from '@/lib/types/modules';
import { ProductionOrder } from '@/lib/types/erp';
import {
  StyleOperationBulletin,
  ProductionPlanSchedule,
  TimeMotionStudy,
  OperationBulletinItem,
} from '@/lib/types/planning-ie';
import {
  getStoredBulletins,
  saveStoredBulletins,
  getStoredSchedules,
  saveStoredSchedules,
  getStoredTimeStudies,
  saveStoredTimeStudies,
  INITIAL_OPERATION_BULLETINS,
  INITIAL_PRODUCTION_SCHEDULES,
  INITIAL_TIME_STUDIES,
} from '@/lib/db/planning-ie-store';

interface PlanningAndIeViewProps {
  orders?: BuyerOrder[];
  productionOrders?: ProductionOrder[];
}

type PlanningTab = 'summary' | 'bulletin' | 'planning' | 'timestudy' | 'calculator';

export function PlanningAndIeView({ orders = [], productionOrders = [] }: PlanningAndIeViewProps) {
  const [activeTab, setActiveTab] = useState<PlanningTab>('summary');
  const [bulletins, setBulletins] = useState<StyleOperationBulletin[]>(getStoredBulletins);
  const [schedules, setSchedules] = useState<ProductionPlanSchedule[]>(getStoredSchedules);
  const [timeStudies, setTimeStudies] = useState<TimeMotionStudy[]>(getStoredTimeStudies);
  const [selectedBulletinId, setSelectedBulletinId] = useState<string>(bulletins[0]?.id || 'ob-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isAddOpModalOpen, setIsAddOpModalOpen] = useState(false);
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [isNewStudyModalOpen, setIsNewStudyModalOpen] = useState(false);

  // Live Calculator State
  const [calcOperators, setCalcOperators] = useState<number>(48);
  const [calcHours, setCalcHours] = useState<number>(8);
  const [calcSmv, setCalcSmv] = useState<number>(18.5);
  const [calcEfficiency, setCalcEfficiency] = useState<number>(85);
  const [calcDemand, setCalcDemand] = useState<number>(1200);

  // Sync with storage on mount and events
  useEffect(() => {
    const handleUpdate = () => {
      setBulletins(getStoredBulletins());
      setSchedules(getStoredSchedules());
      setTimeStudies(getStoredTimeStudies());
    };
    window.addEventListener('erp_bulletins_updated', handleUpdate);
    window.addEventListener('erp_schedules_updated', handleUpdate);
    window.addEventListener('erp_timestudies_updated', handleUpdate);
    return () => {
      window.removeEventListener('erp_bulletins_updated', handleUpdate);
      window.removeEventListener('erp_schedules_updated', handleUpdate);
      window.removeEventListener('erp_timestudies_updated', handleUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentBulletin = useMemo(() => {
    return bulletins.find((b) => b.id === selectedBulletinId) || bulletins[0];
  }, [bulletins, selectedBulletinId]);

  // Aggregate Metrics
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

  const totalDailyTargetPcs = useMemo(() => {
    return schedules.reduce((acc, s) => acc + (s.plannedDailyTarget || 0), 0);
  }, [schedules]);

  // Calculator outputs
  const calcOutput = useMemo(() => {
    const hourlyPace = calcSmv > 0
      ? Math.round(((calcOperators * 60) / calcSmv) * (calcEfficiency / 100))
      : 0;
    const dailyTarget = hourlyPace * calcHours;
    const pitchTimeSec = calcOperators > 0 ? Math.round(((calcSmv * 60) / calcOperators) * 10) / 10 : 0;
    const taktTimeSec = calcDemand > 0 ? Math.round(((calcHours * 3600) / calcDemand) * 10) / 10 : 0;
    return {
      hourlyPace,
      dailyTarget,
      pitchTimeSec,
      taktTimeSec,
    };
  }, [calcOperators, calcHours, calcSmv, calcEfficiency, calcDemand]);

  // Handle Add Operation to current bulletin
  const [newOpName, setNewOpName] = useState('');
  const [newOpMachine, setNewOpMachine] = useState('Single Needle Lockstitch (SNLS)');
  const [newOpMachineCode, setNewOpMachineCode] = useState('SNLS-01');
  const [newOpSmv, setNewOpSmv] = useState<number>(1.2);
  const [newOpSection, setNewOpSection] = useState<'PREPARATION' | 'ASSEMBLY' | 'FINISHING'>('ASSEMBLY');
  const [newOpAllocatedOps, setNewOpAllocatedOps] = useState<number>(2);

  const handleSaveOperation = () => {
    if (!newOpName.trim()) {
      showToast('Please enter an operation name.');
      return;
    }
    if (!currentBulletin) return;

    const pitchSec = currentBulletin.linePitchTimeSec || 24;
    const cycleSec = newOpAllocatedOps > 0 ? Math.round(((newOpSmv * 60) / newOpAllocatedOps) * 10) / 10 : 0;
    const isBottle = cycleSec > pitchSec;

    const newOp: OperationBulletinItem = {
      id: `op-${Date.now()}`,
      seqNumber: currentBulletin.operations.length + 1,
      operationName: newOpName.trim(),
      section: newOpSection,
      machineType: newOpMachine,
      machineCode: newOpMachineCode,
      smv: Number(newOpSmv) || 1.0,
      theoreticalOperators: Math.round(((newOpSmv * 60) / pitchSec) * 10) / 10,
      allocatedOperators: Number(newOpAllocatedOps) || 1,
      cycleTimeSec: cycleSec,
      pitchTimeSec: pitchSec,
      isBottleneck: isBottle,
    };

    const updatedOps = [...currentBulletin.operations, newOp];
    const newTotalSmv = Math.round(updatedOps.reduce((a, b) => a + b.smv, 0) * 10) / 10;
    const updatedBulletins = bulletins.map((b) =>
      b.id === currentBulletin.id
        ? {
            ...b,
            operations: updatedOps,
            totalSmv: newTotalSmv,
            updatedAt: new Date().toISOString(),
          }
        : b
    );

    setBulletins(updatedBulletins);
    saveStoredBulletins(updatedBulletins);
    setIsAddOpModalOpen(false);
    setNewOpName('');
    showToast(`✓ Added operation "${newOp.operationName}" to bulletin.`);
  };

  // Handle New Schedule Allocation
  const [schedLine, setSchedLine] = useState('Line 01');
  const [schedPO, setSchedPO] = useState('');
  const [schedTarget, setSchedTarget] = useState<number>(1500);
  const [schedOperators, setSchedOperators] = useState<number>(40);
  const [schedStartDate, setSchedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedDays, setSchedDays] = useState<number>(20);

  const handleSaveSchedule = () => {
    if (!schedPO.trim()) {
      showToast('Please enter or select a Buyer Order PO.');
      return;
    }
    const matchedBO = orders.find((o) => o.orderNumber.toLowerCase() === schedPO.trim().toLowerCase());

    const newSched: ProductionPlanSchedule = {
      id: `sched-${Date.now()}`,
      lineId: schedLine,
      lineName: `Sewing ${schedLine}`,
      orderNumber: schedPO.trim(),
      buyerName: matchedBO?.buyerName || 'Global Buyer',
      styleNumber: matchedBO?.styleNumber || 'STY-GEN-01',
      styleDescription: matchedBO?.styleDescription || 'General Garment Style',
      orderQuantity: matchedBO?.orderQuantity || 30000,
      smv: matchedBO?.smv || 18.0,
      allocatedOperators: schedOperators,
      plannedDailyTarget: schedTarget,
      startDate: schedStartDate,
      endDate: new Date(Date.now() + schedDays * 86400000).toISOString().split('T')[0],
      daysRequired: schedDays,
      status: 'SCHEDULED',
      learningCurveRampUp: {
        day1Percent: 40,
        day2Percent: 65,
        day3Percent: 85,
        day4PlusPercent: 100,
      },
      notes: 'Line balancing confirmed by IE department.',
    };

    const updated = [newSched, ...schedules];
    setSchedules(updated);
    saveStoredSchedules(updated);
    setIsNewScheduleModalOpen(false);
    showToast(`✓ Scheduled ${newSched.orderNumber} on ${newSched.lineName}`);
  };

  // Handle New Time Study
  const [studyOperator, setStudyOperator] = useState('');
  const [studyOpName, setStudyOpName] = useState('');
  const [studyLine, setStudyLine] = useState('Sewing Line 03');
  const [studyC1, setStudyC1] = useState<number>(22.0);
  const [studyC2, setStudyC2] = useState<number>(21.5);
  const [studyC3, setStudyC3] = useState<number>(22.8);
  const [studyC4, setStudyC4] = useState<number>(21.9);
  const [studyC5, setStudyC5] = useState<number>(22.3);
  const [studyRating, setStudyRating] = useState<number>(100);
  const [studyAllowance, setStudyAllowance] = useState<number>(15);

  const handleSaveStudy = () => {
    if (!studyOperator.trim() || !studyOpName.trim()) {
      showToast('Operator and Operation Name are required.');
      return;
    }
    const cycles: [number, number, number, number, number] = [
      studyC1,
      studyC2,
      studyC3,
      studyC4,
      studyC5,
    ];
    const avg = Math.round((cycles.reduce((a, b) => a + b, 0) / 5) * 10) / 10;
    const basic = Math.round((avg * (studyRating / 100)) * 10) / 10;
    const smv = Math.round(((basic * (1 + studyAllowance / 100)) / 60) * 100) / 100;

    const newStudy: TimeMotionStudy = {
      id: `tms-${Date.now()}`,
      studyCode: `TMS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      lineName: studyLine,
      operatorName: studyOperator.trim(),
      operatorId: `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      operationName: studyOpName.trim(),
      machineType: 'Standard Machine',
      cycleTimesSec: cycles,
      avgCycleTimeSec: avg,
      performanceRatingPercent: studyRating,
      basicTimeSec: basic,
      allowancePercent: studyAllowance,
      standardMinuteValue: smv,
      status: studyRating >= 105 ? 'BENCHMARK_EXCEEDED' : studyRating < 95 ? 'NEEDS_TRAINING' : 'VERIFIED',
      studiedBy: 'IE Floor Officer',
    };

    const updated = [newStudy, ...timeStudies];
    setTimeStudies(updated);
    saveStoredTimeStudies(updated);
    setIsNewStudyModalOpen(false);
    showToast(`✓ Time Study ${newStudy.studyCode} logged: SMV ${smv} min.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Header */}
      <ModuleHeader
        title="Planning & IE"
        activeView={activeTab}
        onViewChange={(mode) => setActiveTab(mode as PlanningTab)}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'bulletin', label: 'Operation Bulletin (OB)', count: currentBulletin?.operations.length },
          { id: 'planning', label: 'Production Scheduling', count: schedules.length },
          { id: 'timestudy', label: 'Time & Motion Study', count: timeStudies.length },
          { id: 'calculator', label: 'Capacity Calculator' },
        ]}
      />

      {/* TAB 1: SUMMARY & OVERVIEW */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Top 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Line Balancing Efficiency"
              value={`${avgBalancingEfficiency}%`}
              delta={{ value: '+2.4% vs benchmark', isPositive: true }}
              icon={Sliders}
              tone="blue"
              subtitle="Factory-wide active lines"
            />
            <StatCard
              title="Running Style Avg SMV"
              value={`${currentBulletin?.totalSmv || 18.5} min`}
              delta={{ value: 'Target standard', isPositive: true }}
              icon={Clock}
              tone="indigo"
              subtitle="Current style complexity"
            />
            <StatCard
              title="Daily Planned Capacity"
              value={`${totalDailyTargetPcs.toLocaleString()} pcs`}
              delta={{ value: 'Target output across lines', isPositive: true }}
              icon={Target}
              tone="emerald"
              subtitle="8-hour standard pace"
            />
            <StatCard
              title="Active Line Bottlenecks"
              value={`${totalBottlenecks} stations`}
              delta={{
                value: totalBottlenecks > 0 ? 'Requires line rebalance' : 'Balanced pace',
                isPositive: totalBottlenecks === 0,
              }}
              icon={AlertTriangle}
              tone="amber"
              subtitle="Cycle time > pitch time"
            />
          </div>

          {/* Quick Line Balancing & Pitch Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Bulletins Quick Card */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Active Style Operation Bulletins (OB)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('bulletin')}
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {bulletins.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBulletinId(b.id);
                      setActiveTab('bulletin');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedBulletinId === b.id
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-blue-700">{b.styleNumber}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {b.garmentType}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 line-clamp-1">{b.styleDescription}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{b.buyerName}</div>
                    <div className="flex items-center justify-between text-[11px] font-mono mt-3 pt-2 border-t border-slate-200/60">
                      <span className="text-slate-500">SMV: <strong className="text-slate-800">{b.totalSmv}m</strong></span>
                      <span className="text-emerald-700 font-bold">Bal: {b.balancingEfficiency}%</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Bottleneck Stations Warning Banner */}
              {totalBottlenecks > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Flame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-900">
                      Bottleneck Operations Detected ({totalBottlenecks} stations)
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Stations exceeding pitch time will restrict production line throughput. Consider adding helper operators, splitting operations, or installing specialized work aids (e.g. automated binders/folders).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Live Interactive IE Target Simulation Preview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Quick Line Target Calculator
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('calculator')}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Full Suite
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Line Operators</span>
                    <span className="font-mono font-bold text-slate-900">{calcOperators} ops</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="70"
                    value={calcOperators}
                    onChange={(e) => setCalcOperators(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Style SMV (Minutes)</span>
                    <span className="font-mono font-bold text-indigo-700">{calcSmv} min</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="60"
                    value={calcSmv}
                    onChange={(e) => setCalcSmv(parseFloat(e.target.value) || 15)}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Target Efficiency (%)</span>
                    <span className="font-mono font-bold text-emerald-700">{calcEfficiency}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={calcEfficiency}
                    onChange={(e) => setCalcEfficiency(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Hourly Line Pace:</span>
                    <span className="font-mono font-bold text-blue-700">{calcOutput.hourlyPace} pcs/hr</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">8-Hour Daily Target:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">{calcOutput.dailyTarget.toLocaleString()} pcs</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Line Pitch Time:</span>
                    <span className="font-mono font-bold text-indigo-700">{calcOutput.pitchTimeSec} sec</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Master Production Schedules (T&A) Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Current Master Production Schedules (MPS)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('planning')}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full T&A Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Line</th>
                    <th className="py-2.5 px-3">Buyer & Order PO</th>
                    <th className="py-2.5 px-3">Style Details</th>
                    <th className="py-2.5 px-3 text-right">Order Qty</th>
                    <th className="py-2.5 px-3 text-center">SMV</th>
                    <th className="py-2.5 px-3 text-right">Daily Target</th>
                    <th className="py-2.5 px-3">Schedule Dates</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Factory className="w-3 h-3 text-slate-500" />
                          {s.lineId}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-blue-700">{s.orderNumber}</div>
                        <div className="text-[11px] text-slate-500">{s.buyerName}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{s.styleDescription}</div>
                        <div className="text-[11px] font-mono text-slate-500">{s.styleNumber}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {s.orderQuantity.toLocaleString()} pcs
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700">
                        {s.smv} min
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {s.plannedDailyTarget.toLocaleString()} pcs/day
                      </td>
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-600 whitespace-nowrap">
                        {s.startDate} → {s.endDate}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'RUNNING'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATION BULLETIN (OB) & LINE BALANCING */}
      {activeTab === 'bulletin' && currentBulletin && (
        <div className="space-y-6">
          {/* Style Selector Toolbar & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Select Style Bulletin:
              </label>
              <select
                value={selectedBulletinId}
                onChange={(e) => setSelectedBulletinId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {bulletins.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.styleNumber} — {b.styleDescription} ({b.buyerName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Operation</span>
              </button>
            </div>
          </div>

          {/* Bulletin Header KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-medium">Garment Type</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">{currentBulletin.garmentType}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-medium">Total Garment SMV</div>
              <div className="text-xs font-bold text-indigo-700 font-mono mt-0.5">
                {currentBulletin.totalSmv} minutes
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-medium">Line Pitch Time</div>
              <div className="text-xs font-bold text-blue-700 font-mono mt-0.5">
                {currentBulletin.linePitchTimeSec} seconds
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-medium">Target Operators</div>
              <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                {currentBulletin.targetLineOperators} Operators
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-medium">Balancing Efficiency</div>
              <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5">
                {currentBulletin.balancingEfficiency}%
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-medium">Daily Target Pace</div>
              <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                {currentBulletin.plannedDailyOutput} pcs/day
              </div>
            </div>
          </div>

          {/* Operation Bulletin Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Operations Breakdown Bulletin — {currentBulletin.styleDescription}
                </h3>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Pitch Target: <strong className="text-slate-800">{currentBulletin.linePitchTimeSec}s</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center">#</th>
                    <th className="py-2.5 px-3">Operation Description</th>
                    <th className="py-2.5 px-3">Section</th>
                    <th className="py-2.5 px-3">Machine Type</th>
                    <th className="py-2.5 px-3 text-center">Machine Code</th>
                    <th className="py-2.5 px-3 text-center font-mono">SMV (Min)</th>
                    <th className="py-2.5 px-3 text-center">Theo. Ops</th>
                    <th className="py-2.5 px-3 text-center">Alloc. Ops</th>
                    <th className="py-2.5 px-3">Cycle vs Pitch Time</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentBulletin.operations.map((op) => {
                    const ratio = Math.min(Math.round((op.cycleTimeSec / (op.pitchTimeSec || 24)) * 100), 150);
                    return (
                      <tr
                        key={op.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          op.isBottleneck ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                          {op.seqNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {op.operationName}
                          {op.remarks && (
                            <div className="text-[10px] text-slate-400 font-normal italic">{op.remarks}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              op.section === 'PREPARATION'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : op.section === 'ASSEMBLY'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}
                          >
                            {op.section}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{op.machineType}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                          {op.machineCode}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                          {op.smv.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {op.theoreticalOperators}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                          {op.allocatedOperators}
                        </td>
                        <td className="py-2.5 px-3 min-w-[160px]">
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className={op.isBottleneck ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                              {op.cycleTimeSec}s
                            </span>
                            <span className="text-slate-400">/ {op.pitchTimeSec}s</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                op.isBottleneck
                                  ? 'bg-amber-500'
                                  : ratio > 90
                                  ? 'bg-blue-600'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(ratio, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {op.isBottleneck ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Bottleneck
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Balanced
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTION PLANNING & SCHEDULING (T&A) */}
      {activeTab === 'planning' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sewing Line Master Production Schedules</h3>
              <p className="text-xs text-slate-500">
                Track production allocation, learning curve ramp-ups, and SMV pacing across lines.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Line Order</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Factory className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-xs">{s.lineName}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === 'RUNNING'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700 text-sm">{s.orderNumber}</span>
                    <span className="text-xs font-semibold text-slate-700">{s.buyerName}</span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium line-clamp-1">{s.styleDescription}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Quantity</span>
                    <span className="font-mono font-bold text-slate-800">{s.orderQuantity.toLocaleString()} pcs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Style SMV</span>
                    <span className="font-mono font-bold text-indigo-700">{s.smv} min</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Daily Target</span>
                    <span className="font-mono font-bold text-emerald-700">{s.plannedDailyTarget} pcs/day</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Line Operators</span>
                    <span className="font-mono font-bold text-slate-800">{s.allocatedOperators} Ops</span>
                  </div>
                </div>

                {/* Learning curve ramp up badges */}
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Learning Curve Ramp-Up Pace:
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                    <div className="p-1 rounded bg-slate-100 border border-slate-200">
                      <span className="text-slate-400 block">Day 1</span>
                      <strong className="text-slate-700">{s.learningCurveRampUp.day1Percent}%</strong>
                    </div>
                    <div className="p-1 rounded bg-slate-100 border border-slate-200">
                      <span className="text-slate-400 block">Day 2</span>
                      <strong className="text-slate-700">{s.learningCurveRampUp.day2Percent}%</strong>
                    </div>
                    <div className="p-1 rounded bg-slate-100 border border-slate-200">
                      <span className="text-slate-400 block">Day 3</span>
                      <strong className="text-slate-700">{s.learningCurveRampUp.day3Percent}%</strong>
                    </div>
                    <div className="p-1 rounded bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-600 block">Day 4+</span>
                      <strong className="text-emerald-800">{s.learningCurveRampUp.day4PlusPercent}%</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                  <span>{s.startDate} → {s.endDate}</span>
                  <span className="font-bold text-slate-700">{s.daysRequired} Working Days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TIME & MOTION STUDY */}
      {activeTab === 'timestudy' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stopwatch Time & Motion Work Studies</h3>
              <p className="text-xs text-slate-500">
                Observe operator cycle times, apply rating factors and allowances to calculate standard SMV.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewStudyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Work Study</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Study Code</th>
                    <th className="py-2.5 px-3">Date & Line</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Operation Description</th>
                    <th className="py-2.5 px-3 text-center">Observed Cycles (Sec)</th>
                    <th className="py-2.5 px-3 text-center">Avg Time</th>
                    <th className="py-2.5 px-3 text-center">Rating</th>
                    <th className="py-2.5 px-3 text-center">Basic Time</th>
                    <th className="py-2.5 px-3 text-center">Allowance</th>
                    <th className="py-2.5 px-3 text-center">Calculated SMV</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeStudies.map((ts) => (
                    <tr key={ts.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{ts.studyCode}</td>
                      <td className="py-3 px-3 text-[11px]">
                        <div className="font-semibold text-slate-800">{ts.lineName}</div>
                        <div className="text-slate-400 font-mono">{ts.date}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{ts.operatorName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{ts.operatorId}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{ts.operationName}</td>
                      <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-600">
                        {ts.cycleTimesSec.join('s, ')}s
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {ts.avgCycleTimeSec}s
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-indigo-700 font-bold">
                        {ts.performanceRatingPercent}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {ts.basicTimeSec}s
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {ts.allowancePercent}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 text-sm">
                        {ts.standardMinuteValue}m
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ts.status === 'BENCHMARK_EXCEEDED'
                              ? 'bg-purple-100 text-purple-800'
                              : ts.status === 'NEEDS_TRAINING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {ts.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CAPACITY & TARGET CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Garments Industrial Engineering Simulation & Capacity Suite
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Calculate line targets, required operators, takt times, and production capacities based on standard IE formulas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Inputs Column */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Simulation Parameters
                </h4>

                <div>
                  <label className="text-xs font-bold text-slate-800 flex justify-between mb-1">
                    <span>Number of Operators on Line</span>
                    <span className="font-mono text-blue-700">{calcOperators} Operators</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={calcOperators}
                    onChange={(e) => setCalcOperators(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 flex justify-between mb-1">
                    <span>Working Hours per Shift</span>
                    <span className="font-mono text-slate-700">{calcHours} Hours</span>
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    value={calcHours}
                    onChange={(e) => setCalcHours(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 flex justify-between mb-1">
                    <span>Garment Style SMV (Minutes)</span>
                    <span className="font-mono text-indigo-700">{calcSmv} Min</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="2"
                    max="70"
                    value={calcSmv}
                    onChange={(e) => setCalcSmv(parseFloat(e.target.value) || 15)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 flex justify-between mb-1">
                    <span>Target Floor Efficiency (%)</span>
                    <span className="font-mono text-emerald-700">{calcEfficiency}%</span>
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={calcEfficiency}
                    onChange={(e) => setCalcEfficiency(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 flex justify-between mb-1">
                    <span>Daily Buyer Demand / Target</span>
                    <span className="font-mono text-slate-700">{calcDemand} pcs</span>
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="50"
                    value={calcDemand}
                    onChange={(e) => setCalcDemand(parseInt(e.target.value, 10) || 1000)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Standard IE Output Calculations
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Target Hourly Production Pace
                    </span>
                    <div className="font-mono font-bold text-2xl text-blue-900 mt-1">
                      {calcOutput.hourlyPace} <span className="text-xs font-normal">pcs/hour</span>
                    </div>
                    <p className="text-[11px] text-blue-800/80 mt-1">
                      Formula: <code>((Operators × 60) ÷ SMV) × Efficiency%</code>
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Full Shift Daily Target Output
                    </span>
                    <div className="font-mono font-bold text-2xl text-emerald-900 mt-1">
                      {calcOutput.dailyTarget.toLocaleString()} <span className="text-xs font-normal">pcs/shift</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 mt-1">
                      Based on {calcHours} working hours per operating shift.
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Line Pitch Time (Seconds)
                    </span>
                    <div className="font-mono font-bold text-2xl text-indigo-900 mt-1">
                      {calcOutput.pitchTimeSec} <span className="text-xs font-normal">seconds</span>
                    </div>
                    <p className="text-[11px] text-indigo-800/80 mt-1">
                      Formula: <code>(Total SMV × 60) ÷ Operators</code>
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                      Customer Takt Time (Seconds)
                    </span>
                    <div className="font-mono font-bold text-2xl text-purple-900 mt-1">
                      {calcOutput.taktTimeSec} <span className="text-xs font-normal">seconds</span>
                    </div>
                    <p className="text-[11px] text-purple-800/80 mt-1">
                      Formula: <code>Available Working Seconds ÷ Customer Demand</code>
                    </p>
                  </div>
                </div>

                {/* Practical IE Insights */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>IE Balancing Advice:</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {calcOutput.pitchTimeSec > calcOutput.taktTimeSec
                      ? `⚠️ Line Pitch Time (${calcOutput.pitchTimeSec}s) is slower than Customer Takt Time (${calcOutput.taktTimeSec}s). The line cannot meet the daily target without adding operators or improving floor efficiency.`
                      : `✓ Line Pitch Time (${calcOutput.pitchTimeSec}s) is faster than Customer Takt Time (${calcOutput.taktTimeSec}s). The line has adequate capacity to satisfy buyer order delivery with a safety buffer.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD OPERATION TO BULLETIN */}
      {isAddOpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Operation to Bulletin</h3>
              <button
                type="button"
                onClick={() => setIsAddOpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Operation Name</label>
                <input
                  type="text"
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  placeholder="e.g. Sleeve Hemming / Collar Join"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Section</label>
                <select
                  value={newOpSection}
                  onChange={(e) => setNewOpSection(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="PREPARATION">PREPARATION</option>
                  <option value="ASSEMBLY">ASSEMBLY</option>
                  <option value="FINISHING">FINISHING</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Machine Type</label>
                  <input
                    type="text"
                    value={newOpMachine}
                    onChange={(e) => setNewOpMachine(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Machine Code</label>
                  <input
                    type="text"
                    value={newOpMachineCode}
                    onChange={(e) => setNewOpMachineCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Operation SMV (Min)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={newOpSmv}
                    onChange={(e) => setNewOpSmv(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Allocated Operators</label>
                  <input
                    type="number"
                    min="1"
                    value={newOpAllocatedOps}
                    onChange={(e) => setNewOpAllocatedOps(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddOpModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOperation}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                Save Operation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE NEW ORDER */}
      {isNewScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Schedule Order to Sewing Line</h3>
              <button
                type="button"
                onClick={() => setIsNewScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Sewing Line</label>
                <select
                  value={schedLine}
                  onChange={(e) => setSchedLine(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  {['Line 01', 'Line 02', 'Line 03', 'Line 04', 'Line 05', 'Line 06', 'Line 07', 'Line 08'].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Buyer Order PO</label>
                <input
                  type="text"
                  value={schedPO}
                  onChange={(e) => setSchedPO(e.target.value)}
                  placeholder="e.g. PO-HM-99201"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Daily Target (Pcs)</label>
                  <input
                    type="number"
                    value={schedTarget}
                    onChange={(e) => setSchedTarget(parseInt(e.target.value, 10) || 1000)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Operators</label>
                  <input
                    type="number"
                    value={schedOperators}
                    onChange={(e) => setSchedOperators(parseInt(e.target.value, 10) || 40)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={schedStartDate}
                    onChange={(e) => setSchedStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Production Days</label>
                  <input
                    type="number"
                    value={schedDays}
                    onChange={(e) => setSchedDays(parseInt(e.target.value, 10) || 20)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewScheduleModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG NEW TIME STUDY */}
      {isNewStudyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Log Stopwatch Time & Motion Study</h3>
              <button
                type="button"
                onClick={() => setIsNewStudyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Operator Name</label>
                <input
                  type="text"
                  value={studyOperator}
                  onChange={(e) => setStudyOperator(e.target.value)}
                  placeholder="e.g. Rasheda Begum"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Operation Name</label>
                <input
                  type="text"
                  value={studyOpName}
                  onChange={(e) => setStudyOpName(e.target.value)}
                  placeholder="e.g. Collar Stitch / Front Pocket Attach"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">5 Observed Cycles (Seconds)</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { val: studyC1, set: setStudyC1 },
                    { val: studyC2, set: setStudyC2 },
                    { val: studyC3, set: setStudyC3 },
                    { val: studyC4, set: setStudyC4 },
                    { val: studyC5, set: setStudyC5 },
                  ].map((c, i) => (
                    <input
                      key={i}
                      type="number"
                      step="0.1"
                      value={c.val}
                      onChange={(e) => c.set(parseFloat(e.target.value) || 0)}
                      className="px-2 py-1.5 text-xs text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rating Factor (%)</label>
                  <input
                    type="number"
                    value={studyRating}
                    onChange={(e) => setStudyRating(parseInt(e.target.value, 10) || 100)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Allowances (%)</label>
                  <input
                    type="number"
                    value={studyAllowance}
                    onChange={(e) => setStudyAllowance(parseInt(e.target.value, 10) || 15)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewStudyModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStudy}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                Save Work Study
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
