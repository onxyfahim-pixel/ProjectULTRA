'use client';

import React, { useState, useMemo } from 'react';
import {
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  TargetSettingRecord,
  ProductionExecutionRecord,
  HourlyMonitoringRecord,
} from '@/lib/types/planning-ie';

interface ExecutionHourlyTabProps {
  targets: TargetSettingRecord[];
  executions: ProductionExecutionRecord[];
  hourlyRecords: HourlyMonitoringRecord[];
  onAddHourlyRecord: (rec: HourlyMonitoringRecord) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
}

type SubTab = 'hourly_monitor' | 'execution_register' | 'target_setting';

export function ExecutionHourlyTab({
  targets,
  executions,
  hourlyRecords,
  onAddHourlyRecord,
  onExportCsv,
}: ExecutionHourlyTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('hourly_monitor');

  // Modal for new hourly log entry
  const [isHourlyModalOpen, setIsHourlyModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState('11:00 - 12:00');
  const [newLine, setNewLine] = useState('Sewing Line 01');
  const [newStyle, setNewStyle] = useState('STY-TS-2026');
  const [newPo, setNewPo] = useState('PO-HM-99201');
  const [newTarget, setNewTarget] = useState(225);
  const [newActual, setNewActual] = useState(220);
  const [newDowntime, setNewDowntime] = useState(0);
  const [newDowntimeReason, setNewDowntimeReason] = useState('');
  const [newRemarks, setNewRemarks] = useState('');

  const handleAddHourlySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const diff = newActual - newTarget;
    const achievementPercent = newTarget > 0 ? Math.round((newActual / newTarget) * 1000) / 10 : 0;
    const hasAlert = achievementPercent < 90 || newDowntime > 15;
    const alertType =
      achievementPercent < 90
        ? 'TARGET_BELOW_PLAN'
        : newDowntime > 15
        ? 'LINE_STOPPED'
        : undefined;

    const record: HourlyMonitoringRecord = {
      id: `hr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      hourSlot: newSlot,
      lineName: newLine,
      style: newStyle,
      po: newPo,
      hourlyTarget: newTarget,
      hourlyActual: newActual,
      difference: diff,
      achievementPercent,
      currentWip: 310,
      downtimeMinutes: newDowntime,
      downtimeReason: newDowntimeReason,
      remarks: newRemarks,
      hasAlert,
      alertType,
    };

    onAddHourlyRecord(record);
    setIsHourlyModalOpen(false);
  };

  const totalHourlyActual = useMemo(() => {
    return hourlyRecords.reduce((acc, h) => acc + (h.hourlyActual || 0), 0);
  }, [hourlyRecords]);

  const totalHourlyTarget = useMemo(() => {
    return hourlyRecords.reduce((acc, h) => acc + (h.hourlyTarget || 0), 0);
  }, [hourlyRecords]);

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('hourly_monitor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'hourly_monitor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>15. Hourly Production Monitor (Real-Time Floor)</span>
          </button>
          <button
            onClick={() => setSubTab('execution_register')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'execution_register'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>14. Daily Production Execution Register</span>
          </button>
          <button
            onClick={() => setSubTab('target_setting')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'target_setting'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>13. Target Setting (Hour / Day / Shift)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (subTab === 'hourly_monitor') onExportCsv('Hourly_Production_Log.csv', hourlyRecords);
              else if (subTab === 'execution_register') onExportCsv('Production_Execution_Register.csv', executions);
              else onExportCsv('Target_Settings_Master.csv', targets);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          {subTab === 'hourly_monitor' && (
            <button
              onClick={() => setIsHourlyModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Hourly Output</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-VIEW 1: HOURLY PRODUCTION MONITOR */}
      {subTab === 'hourly_monitor' && (
        <div className="space-y-4">
          {/* Real-time Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Today Running Target</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{totalHourlyTarget.toLocaleString()} pcs</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Cumulative standard pace</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Today Actual Output</div>
              <div className="text-xl font-bold text-blue-700 mt-1">{totalHourlyActual.toLocaleString()} pcs</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {totalHourlyTarget > 0 ? `${((totalHourlyActual / totalHourlyTarget) * 100).toFixed(1)}% Achieved` : '0%'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Overall Variance</div>
              <div className={`text-xl font-bold mt-1 ${totalHourlyActual >= totalHourlyTarget ? 'text-emerald-700' : 'text-amber-700'}`}>
                {totalHourlyActual - totalHourlyTarget > 0 ? `+${totalHourlyActual - totalHourlyTarget}` : `${totalHourlyActual - totalHourlyTarget}`} pcs
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Net balance across lines</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Floor Downtime Logged</div>
              <div className="text-xl font-bold text-slate-900 mt-1">17 min</div>
              <div className="text-[11px] text-amber-600 font-medium mt-0.5">Needle change &amp; spool refit</div>
            </div>
          </div>

          {/* Hourly Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Hour-by-Hour Production Tracking Board
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time floor inputs with automatic anomaly and variance alerts
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Shift 08:00 - 17:00 Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Hour Slot</th>
                    <th className="p-3">Line Name</th>
                    <th className="p-3">Style &amp; PO</th>
                    <th className="p-3 text-right">Target (pcs)</th>
                    <th className="p-3 text-right">Actual (pcs)</th>
                    <th className="p-3 text-right">Difference</th>
                    <th className="p-3 text-right">Achieve %</th>
                    <th className="p-3 text-right">Current WIP</th>
                    <th className="p-3 text-center">Downtime (min)</th>
                    <th className="p-3">Reason / Remarks</th>
                    <th className="p-3 text-center">Floor Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hourlyRecords.map((hr) => (
                    <tr
                      key={hr.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        hr.hasAlert ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-900">{hr.hourSlot}</td>
                      <td className="p-3 font-semibold text-slate-800">{hr.lineName}</td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{hr.style}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{hr.po}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">{hr.hourlyTarget}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{hr.hourlyActual}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={hr.difference >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {hr.difference >= 0 ? `+${hr.difference}` : hr.difference}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        {hr.achievementPercent}%
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">{hr.currentWip} pcs</td>
                      <td className="p-3 text-center font-mono">
                        {hr.downtimeMinutes > 0 ? (
                          <span className="text-amber-700 font-bold">{hr.downtimeMinutes}m</span>
                        ) : (
                          <span className="text-slate-400">0m</span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 max-w-xs">
                        {hr.downtimeReason && (
                          <span className="font-semibold text-amber-800 mr-1">[{hr.downtimeReason}]</span>
                        )}
                        <span>{hr.remarks || 'Normal line pace'}</span>
                      </td>
                      <td className="p-3 text-center">
                        {hr.hasAlert ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {hr.alertType?.replace('_', ' ') || 'ALERT'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700">&bull; Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DAILY PRODUCTION EXECUTION REGISTER */}
      {subTab === 'execution_register' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Daily Production Execution Register (Shift &bull; Line &bull; Style &bull; PO)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track Target, Actual, Balance, Achievement %, Efficiency %, WIP, Rework, Rejection
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Date &amp; Shift</th>
                    <th className="p-3">Line Name</th>
                    <th className="p-3">Style &amp; PO</th>
                    <th className="p-3">Color / Size</th>
                    <th className="p-3 text-right">Target</th>
                    <th className="p-3 text-right">Actual</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3 text-right">Achieve %</th>
                    <th className="p-3 text-right">Efficiency %</th>
                    <th className="p-3 text-right">WIP</th>
                    <th className="p-3 text-right text-amber-700">Rework</th>
                    <th className="p-3 text-right text-rose-600">Rejection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {executions.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{ex.date}</div>
                        <div className="text-[10px] text-slate-500">{ex.shift}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{ex.lineName}</td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{ex.style}</div>
                        <div className="text-[10px] font-mono text-slate-500">{ex.po}</div>
                      </td>
                      <td className="p-3 text-slate-600">
                        {ex.color} &bull; <span className="font-bold text-slate-800">{ex.size}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">
                        {ex.targetQty.toLocaleString()} pcs
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {ex.actualQty.toLocaleString()} pcs
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-600">
                        {ex.balanceQty.toLocaleString()} pcs
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {ex.achievementPercent}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        {ex.efficiencyPercent}%
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">{ex.wipQty} pcs</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700">{ex.reworkQty} pcs</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">{ex.rejectionQty} pcs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: TARGET SETTING */}
      {subTab === 'target_setting' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                13. Target Setting Master (Inputs: SMV &bull; Minutes &bull; Manpower &bull; Efficiency)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Formula: Target/Hour = (Manpower &times; 60 / SMV) &times; Efficiency% &bull; Target/Day = Target/Hour &times; 8
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Line Name</th>
                    <th className="p-3">Style &amp; PO</th>
                    <th className="p-3 text-right">SMV</th>
                    <th className="p-3 text-center">Working Minutes</th>
                    <th className="p-3 text-center">Manpower Deployed</th>
                    <th className="p-3 text-right">Target Efficiency</th>
                    <th className="p-3 text-right font-bold text-indigo-700">Target / Hour</th>
                    <th className="p-3 text-right font-bold text-emerald-700">Target / Day</th>
                    <th className="p-3 text-right font-bold text-blue-700">Target / Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {targets.map((tgt) => (
                    <tr key={tgt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{tgt.lineName}</td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{tgt.style}</div>
                        <div className="text-[10px] text-slate-500">{tgt.po}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">{tgt.smv}m</td>
                      <td className="p-3 text-center font-mono">{tgt.workingMinutes}m</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">{tgt.manpower} Ops</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">{tgt.efficiencyPercent}%</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700 text-sm">
                        {tgt.targetPerHour} pcs/h
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        {tgt.targetPerDay.toLocaleString()} pcs/d
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700 text-sm">
                        {tgt.targetPerShift.toLocaleString()} pcs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Entry Modal */}
      {isHourlyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Log Real-Time Hourly Output</h3>
              <button
                onClick={() => setIsHourlyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddHourlySubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Hour Slot</label>
                  <select
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="08:00 - 09:00">08:00 - 09:00</option>
                    <option value="09:00 - 10:00">09:00 - 10:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="11:00 - 12:00">11:00 - 12:00</option>
                    <option value="13:00 - 14:00">13:00 - 14:00</option>
                    <option value="14:00 - 15:00">14:00 - 15:00</option>
                    <option value="15:00 - 16:00">15:00 - 16:00</option>
                    <option value="16:00 - 17:00">16:00 - 17:00</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Line Name</label>
                  <input
                    type="text"
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Style Number</label>
                  <input
                    type="text"
                    value={newStyle}
                    onChange={(e) => setNewStyle(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Customer PO #</label>
                  <input
                    type="text"
                    value={newPo}
                    onChange={(e) => setNewPo(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Hourly Target (pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={newTarget}
                    onChange={(e) => setNewTarget(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Hourly Actual (pcs)</label>
                  <input
                    type="number"
                    min="0"
                    value={newActual}
                    onChange={(e) => setNewActual(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Downtime Minutes</label>
                  <input
                    type="number"
                    min="0"
                    value={newDowntime}
                    onChange={(e) => setNewDowntime(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Downtime Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Needle break, thread shade"
                    value={newDowntimeReason}
                    onChange={(e) => setNewDowntimeReason(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Floor Supervisor Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Smooth run, target exceeded"
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHourlyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Submit Hourly Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
