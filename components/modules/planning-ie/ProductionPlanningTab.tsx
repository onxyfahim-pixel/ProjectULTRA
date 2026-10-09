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
  FileDown,
  Plus,
  Play,
  RotateCcw,
  GitCommit,
  Truck,
  ShieldAlert,
  Send,
  Sparkles,
  Link2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useModulePermission } from '@/hooks/use-module-permission';
import {
  ProductionPlanSchedule,
  ProductionOrderPlan,
} from '@/lib/types/planning-ie';
import { ProductionLine } from '@/lib/types/production-management';

interface ProductionPlanningTabProps {
  lines?: ProductionLine[];
  schedules: ProductionPlanSchedule[];
  orders: ProductionOrderPlan[];
  onAddSchedule: (schedule: ProductionPlanSchedule) => void;
  onUpdateScheduleStatus: (id: string, newStatus: any) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
  onExportSingleSchedule?: (schedule: ProductionPlanSchedule) => void;
  onOpenGlobalExport?: () => void;
}

type ViewMode = 'mps' | 'gantt' | 'tna' | 'loading';

export function ProductionPlanningTab({
  lines = [],
  schedules,
  orders,
  onAddSchedule,
  onUpdateScheduleStatus,
  onExportCsv,
  onExportSingleSchedule,
  onOpenGlobalExport,
}: ProductionPlanningTabProps) {
  const { canExport } = useModulePermission('planning_ie');
  const [viewMode, setViewMode] = useState<ViewMode>('mps');
  const [selectedPeriod, setSelectedPeriod] = useState<'MONTHLY' | 'WEEKLY' | 'DAILY'>('MONTHLY');
  const [pushedMessage, setPushedMessage] = useState<string | null>(null);

  // Dynamic Line specifications library
  const LINE_SPECS = useMemo(() => {
    if (lines && lines.length > 0) {
      const specs: Record<string, { name: string; standardOps: number; defaultEff: number }> = {};
      lines.forEach((l) => {
        const key = l.lineCode || l.name;
        specs[key] = {
          name: l.name,
          standardOps: l.operatorCount || 48,
          defaultEff: 82,
        };
      });
      return specs;
    }
    return {
      'L-01': { name: 'Sewing Line 01 (Knit Tops)', standardOps: 48, defaultEff: 82 },
      'L-02': { name: 'Sewing Line 02 (Knit Polo & Fleece)', standardOps: 52, defaultEff: 80 },
      'L-03': { name: 'Sewing Line 03 (Woven Bottoms)', standardOps: 54, defaultEff: 84 },
      'L-04': { name: 'Sewing Line 04 (Heavy Denim)', standardOps: 58, defaultEff: 78 },
      'L-05': { name: 'Sewing Line 05 (Casual Shirts)', standardOps: 46, defaultEff: 82 },
      'L-06': { name: 'Sewing Line 06 (Undergarments & Lingerie)', standardOps: 44, defaultEff: 84 },
      'L-07': { name: 'Sewing Line 07 (Activewear & Sports)', standardOps: 50, defaultEff: 86 },
      'L-08': { name: 'Sewing Line 08 (Outerwear Jackets)', standardOps: 60, defaultEff: 76 },
    };
  }, [lines]);

  // Add Schedule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const [formLineId, setFormLineId] = useState(lines[0]?.lineCode || 'L-01');
  const [formLineName, setFormLineName] = useState(lines[0]?.name || 'Sewing Line 01 (Knit Tops)');
  const [formOrderNumber, setFormOrderNumber] = useState('PO-HM-99201');
  const [formBuyerName, setFormBuyerName] = useState('H&M Hennes & Mauritz');
  const [formStyleNumber, setFormStyleNumber] = useState('STY-TS-2026');
  const [formStyleDesc, setFormStyleDesc] = useState('Men Heavyweight Cotton Crewneck Tee');
  const [formOrderQty, setFormOrderQty] = useState<number>(45000);
  const [formSmv, setFormSmv] = useState<number>(11.2);
  const [formAllocatedOps, setFormAllocatedOps] = useState<number>(lines[0]?.operatorCount || 48);
  const [formTargetEff, setFormTargetEff] = useState<number>(82);
  const [formStartDate, setFormStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'SCHEDULED' | 'RUNNING'>('SCHEDULED');
  const [formNotes, setFormNotes] = useState('');

  // Live auto-calculated metrics for modal
  const calculatedDailyTarget = useMemo(() => {
    if (formSmv <= 0) return 0;
    // Formula: (Allocated Operators * 480 working minutes * (Efficiency / 100)) / SMV
    const dailyAvailableMinutes = formAllocatedOps * 480 * (formTargetEff / 100);
    return Math.round(dailyAvailableMinutes / formSmv);
  }, [formAllocatedOps, formSmv, formTargetEff]);

  const calculatedDaysRequired = useMemo(() => {
    if (calculatedDailyTarget <= 0) return 0;
    return Math.ceil(formOrderQty / calculatedDailyTarget);
  }, [formOrderQty, calculatedDailyTarget]);

  const calculatedEndDate = useMemo(() => {
    if (!formStartDate || calculatedDaysRequired <= 0) return '';
    const date = new Date(formStartDate);
    let addedDays = 0;
    while (addedDays < calculatedDaysRequired) {
      date.setDate(date.getDate() + 1);
      // Skip Sundays (standard factory weekly off)
      if (date.getDay() !== 0) {
        addedDays++;
      }
    }
    return date.toISOString().split('T')[0];
  }, [formStartDate, calculatedDaysRequired]);

  // Handle line change in modal
  const handleLineChange = (lineId: string) => {
    setFormLineId(lineId);
    const spec = LINE_SPECS[lineId];
    if (spec) {
      setFormLineName(spec.name);
      setFormAllocatedOps(spec.standardOps);
      setFormTargetEff(spec.defaultEff);
    }
  };

  // Handle order selection in modal
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!ord) return;

    setFormOrderNumber(ord.po);
    setFormBuyerName(ord.buyer);
    setFormStyleNumber(ord.style);
    setFormStyleDesc(ord.product);
    setFormOrderQty(ord.orderQuantity);
    if (ord.smv) setFormSmv(ord.smv);
    if (ord.productionStartDate) setFormStartDate(ord.productionStartDate);

    // Auto-select best line based on assignedLine or productCategory
    if (ord.assignedLine) {
      const match = Object.keys(LINE_SPECS).find((k) => ord.assignedLine.includes(k));
      if (match) handleLineChange(match);
    }
  };

  const handleOpenAddSchedule = () => {
    if (orders.length > 0) {
      handleOrderSelect(orders[0].id);
    }
    setIsModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const newSchedule: ProductionPlanSchedule = {
      id: `mps-${Date.now()}`,
      lineId: formLineId,
      lineName: formLineName,
      orderNumber: formOrderNumber,
      buyerName: formBuyerName,
      styleNumber: formStyleNumber,
      styleDescription: formStyleDesc,
      orderQuantity: formOrderQty,
      smv: formSmv,
      allocatedOperators: formAllocatedOps,
      plannedDailyTarget: calculatedDailyTarget,
      startDate: formStartDate,
      endDate: calculatedEndDate || formStartDate,
      daysRequired: calculatedDaysRequired,
      status: formStatus,
      learningCurveRampUp: {
        day1Percent: 42,
        day2Percent: 65,
        day3Percent: 85,
        day4PlusPercent: 100,
      },
      notes: formNotes || `Scheduled via PPC Master Production Board. Target pace: ${calculatedDailyTarget} pcs/day.`,
      actualProducedQty: 0,
      planVsActualPercent: 0,
      fabricStatus: '100% In-House - Passed QC',
      targetEfficiency: formTargetEff,
      pitchTimeSec: Math.round(((formSmv * 60) / formAllocatedOps) * 10) / 10,
    };

    onAddSchedule(newSchedule);
    setIsModalOpen(false);
  };

  // Push schedules to production floor lines
  const handlePushToProductionFloor = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('erp_push_schedules_to_production', {
          detail: { schedules, timestamp: new Date().toISOString() },
        })
      );
    }
    setPushedMessage(`Successfully pushed ${schedules.length} line loading schedules to Shop Floor Sewing Lines!`);
    setTimeout(() => setPushedMessage(null), 4000);
  };

  // Total metrics
  const totalPlannedOutput = useMemo(() => {
    return schedules.reduce((acc, s) => acc + (s.orderQuantity || 0), 0);
  }, [schedules]);

  const totalDailyTarget = useMemo(() => {
    return schedules.reduce((acc, s) => acc + (s.plannedDailyTarget || 0), 0);
  }, [schedules]);

  const activeRunningLines = useMemo(() => {
    return schedules.filter((s) => s.status === 'RUNNING').length;
  }, [schedules]);

  return (
    <div className="space-y-6">
      {/* Toast Alert for Push Action */}
      {pushedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pushedMessage}</span>
        </div>
      )}

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
            <span>Line Loading &amp; Ramp-Up</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          {/* PUSH TO FLOOR LINES */}
          <button
            onClick={handlePushToProductionFloor}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Push schedule assignments and hourly targets to Shop Floor Sewing Lines"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>Push to Floor</span>
          </button>

          {/* ADD SCHEDULE BUTTON */}
          <button
            onClick={handleOpenAddSchedule}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Line</span>
          </button>

          {/* GLOBAL EXPORT BUTTON */}
          {canExport && onOpenGlobalExport && (
            <button
              onClick={onOpenGlobalExport}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Global Export: Production Orders, MPS & Operation Bulletins (PDF or Excel)"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Register</span>
            </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Scheduled Order Qty</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{totalPlannedOutput.toLocaleString()} pcs</div>
              <div className="text-[11px] text-blue-600 font-medium mt-0.5">Across {schedules.length} Active Lines</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Daily Plant Target</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{totalDailyTarget.toLocaleString()} pcs/day</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">8h Standard Pace Target</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Active Running Lines</div>
              <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                {activeRunningLines} of {schedules.length} Running
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Line efficiency monitored hourly</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">PPC Approval Stage</div>
              <div className="text-base font-bold text-teal-800 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>IE &amp; PPC RELEASED</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">TNA Milestones Synchronized</div>
            </div>
          </div>

          {/* MPS Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Line &amp; Unit</th>
                    <th className="p-3">Order # &amp; Buyer</th>
                    <th className="p-3">Style &amp; Description</th>
                    <th className="p-3 text-right">Order Qty</th>
                    <th className="p-3 text-right">SMV</th>
                    <th className="p-3 text-center">Allocated Manpower</th>
                    <th className="p-3 text-right">Daily Target</th>
                    <th className="p-3">Schedule Duration</th>
                    <th className="p-3">Produced / Progress</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((sch) => {
                    const actualProduced = sch.actualProducedQty || 0;
                    const progressPercent = sch.orderQuantity > 0 ? Math.round((actualProduced / sch.orderQuantity) * 100) : 0;
                    return (
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
                        <td className="p-3">
                          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                            <span className="font-bold text-slate-800">{actualProduced.toLocaleString()} pcs</span>
                            <span className="text-blue-700 font-bold">{progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(100, progressPercent)}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              sch.status === 'RUNNING'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : sch.status === 'SCHEDULED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : sch.status === 'COMPLETED'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
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
                    );
                  })}
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
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-teal-600 inline-block"></span> Woven Line
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {schedules.map((sch, idx) => {
              const startDay = new Date(sch.startDate).getDate();
              const duration = sch.daysRequired;
              const leftPercent = Math.max(2, Math.min(65, ((startDay + idx * 4) / 45) * 100));
              const widthPercent = Math.max(20, Math.min(75, (duration / 40) * 100));

              const lineBg = sch.lineId.includes('04')
                ? 'bg-indigo-600'
                : sch.lineId.includes('05')
                ? 'bg-teal-600'
                : 'bg-blue-600';

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
                      className={`h-full rounded-lg shadow-xs flex items-center justify-between px-3 text-white text-xs font-semibold transition-all ${lineBg}`}
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
          <div className="pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Time &amp; Action (TNA) Critical Path &amp; Milestone Synchronizer
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Production progress linked to buyer delivery deadlines, fabric in-house dates, and QA audit gates
            </p>
          </div>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700">{ord.orderNumber}</span>
                    <span className="text-xs font-semibold text-slate-800">&bull; {ord.buyer}</span>
                    <span className="text-xs text-slate-500">({ord.style})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Ex-Factory Delivery:</span>
                    <span className="font-bold text-emerald-700 font-mono">{ord.deliveryDate}</span>
                  </div>
                </div>

                {/* Milestone Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                    <div className="text-[10px] font-bold text-emerald-600">1. PO Placed</div>
                    <div className="text-[11px] font-bold text-slate-800 mt-1">CONFIRMED</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                    <div className="text-[10px] font-bold text-emerald-600">2. Fabric Inward</div>
                    <div className="text-[11px] font-bold text-emerald-700 mt-1">100% IN-HOUSE</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                    <div className="text-[10px] font-bold text-emerald-600">3. Cutting</div>
                    <div className="text-[11px] font-bold text-slate-800 mt-1">
                      {ord.status === 'IN_PRODUCTION' ? '100% CUT' : 'IN PROGRESS'}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-300 shadow-2xs bg-blue-50/30">
                    <div className="text-[10px] font-bold text-blue-600">4. Sewing</div>
                    <div className="text-[11px] font-bold text-blue-700 mt-1">{ord.assignedLine}</div>
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
              Standard Apparel Learning Ramp: Day 1 (40%), Day 2 (65%), Day 3 (85%), Day 4+ (100% Target)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map((sch) => (
              <div key={sch.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{sch.lineName}</span>
                  <span className="text-[11px] font-mono text-blue-700 font-bold">{sch.styleNumber}</span>
                </div>
                <div className="text-xs text-slate-600 line-clamp-1">{sch.styleDescription}</div>

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

      {/* ADD LINE SCHEDULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Schedule Line on Master Production Board (MPS)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Allocate style and quantity to sewing line with dynamic daily target and duration calculations.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              {/* Select from existing production orders */}
              {orders.length > 0 && (
                <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl">
                  <label className="block text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Select Production Order to Schedule:</span>
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-blue-200 bg-white text-slate-800 font-medium"
                  >
                    {orders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        {ord.po} - {ord.buyer} | {ord.style} ({ord.orderQuantity.toLocaleString()} pcs)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Sewing Line *</label>
                  <select
                    value={formLineId}
                    onChange={(e) => handleLineChange(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
                  >
                    {Object.entries(LINE_SPECS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.name} ({v.standardOps} Ops)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer PO Number *</label>
                  <input
                    type="text"
                    required
                    value={formOrderNumber}
                    onChange={(e) => setFormOrderNumber(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Buyer Name</label>
                  <input
                    type="text"
                    required
                    value={formBuyerName}
                    onChange={(e) => setFormBuyerName(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Style Number *</label>
                  <input
                    type="text"
                    required
                    value={formStyleNumber}
                    onChange={(e) => setFormStyleNumber(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Scheduled Quantity (Pcs) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formOrderQty}
                    onChange={(e) => setFormOrderQty(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Garment SMV (Minutes) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    required
                    value={formSmv}
                    onChange={(e) => setFormSmv(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Allocated Operators</label>
                  <input
                    type="number"
                    min={1}
                    value={formAllocatedOps}
                    onChange={(e) => setFormAllocatedOps(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Planned Efficiency %</label>
                  <input
                    type="number"
                    min={40}
                    max={100}
                    value={formTargetEff}
                    onChange={(e) => setFormTargetEff(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sewing Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="RUNNING">RUNNING</option>
                  </select>
                </div>
              </div>

              {/* Live Auto-Calculated PPC Metrics Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Calculated Daily Target</div>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                    {calculatedDailyTarget.toLocaleString()} pcs/day
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Days Required</div>
                  <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
                    {calculatedDaysRequired} Working Days
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Calculated End Date</div>
                  <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                    {calculatedEndDate || '--'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Planning Notes / Pre-Requisites</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                  placeholder="Machine setup notes, critical folder guides, fabric in-house status..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Confirm &amp; Schedule Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
