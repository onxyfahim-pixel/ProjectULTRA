'use client';

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Download,
  Search,
  Sparkles,
  BarChart3,
  Sliders,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  TimeMotionStudy,
  MethodStudyRecord,
  MotionStudyRecord,
} from '@/lib/types/planning-ie';

interface WorkStudyTabProps {
  timeStudies: TimeMotionStudy[];
  methodStudies: MethodStudyRecord[];
  motionStudies: MotionStudyRecord[];
  onAddTimeStudy: (study: TimeMotionStudy) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
}

type WorkSubTab = 'time_study' | 'method_study' | 'motion_study';

export function WorkStudyTab({
  timeStudies,
  methodStudies,
  motionStudies,
  onAddTimeStudy,
  onExportCsv,
}: WorkStudyTabProps) {
  const [activeTab, setActiveTab] = useState<WorkSubTab>('time_study');

  // Modal for new time study
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studyOpName, setStudyOpName] = useState('Shoulder Join (with Mobilon Tape)');
  const [studyOperator, setStudyOperator] = useState('Rasheda Begum');
  const [studyOperatorId, setStudyOperatorId] = useState('OP-4412');
  const [studyLine, setStudyLine] = useState('Sewing Line 01');
  const [studyMachine, setStudyMachine] = useState('4-Thread Overlock');
  const [c1, setC1] = useState(21.5);
  const [c2, setC2] = useState(22.0);
  const [c3, setC3] = useState(21.8);
  const [c4, setC4] = useState(23.2);
  const [c5, setC5] = useState(22.5);
  const [rating, setRating] = useState(105);
  const [allowance, setAllowance] = useState(14); // 14% allowance

  // Live dynamic calculations
  const avgCycle = Math.round(((c1 + c2 + c3 + c4 + c5) / 5) * 10) / 10;
  const normalTime = Math.round(avgCycle * (rating / 100) * 10) / 10;
  const standardTime = Math.round(normalTime * (1 + allowance / 100) * 10) / 10;
  const calculatedSmv = Math.round((standardTime / 60) * 100) / 100;

  const handleSaveStudy = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudy: TimeMotionStudy = {
      id: `tms-${Date.now()}`,
      studyCode: `TMS-2026-${String(timeStudies.length + 40).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      lineName: studyLine,
      operatorName: studyOperator,
      operatorId: studyOperatorId,
      operationName: studyOpName,
      machineType: studyMachine,
      cycleTimesSec: [c1, c2, c3, c4, c5],
      avgCycleTimeSec: avgCycle,
      performanceRatingPercent: rating,
      normalTimeSec: normalTime,
      allowancePercent: allowance,
      standardTimeSec: standardTime,
      standardMinuteValue: calculatedSmv,
      sam: Math.round(calculatedSmv * 1.12 * 100) / 100,
      status: calculatedSmv <= 0.7 ? 'BENCHMARK_EXCEEDED' : 'VERIFIED',
      studiedBy: 'Kamal Hossain (IE Executive)',
    };
    onAddTimeStudy(newStudy);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('time_study')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'time_study'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>09. Time Study Register ({timeStudies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('method_study')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'method_study'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>10. Method Study &amp; Ergonomics ({methodStudies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('motion_study')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'motion_study'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>11. Motion Study (VA vs NVA) ({motionStudies.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'time_study') onExportCsv('Time_Study_Register.csv', timeStudies);
              else if (activeTab === 'method_study') onExportCsv('Method_Study_Register.csv', methodStudies);
              else onExportCsv('Motion_Study_Register.csv', motionStudies);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          {activeTab === 'time_study' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Time Study</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-VIEW 1: TIME STUDY REGISTER */}
      {activeTab === 'time_study' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Time Study Register (5 Cycles &bull; Rating &bull; Allowance &bull; SMV)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculations: Avg Cycle = &Sigma;(C1..C5)/5 &bull; Normal Time = Avg &times; Rating &bull; Standard Time = Normal &times; (1 + Allowance%) &bull; SMV = Std Time / 60
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Study # &amp; Date</th>
                    <th className="p-3">Operator Name &amp; ID</th>
                    <th className="p-3">Operation &amp; Machine</th>
                    <th className="p-3">Line</th>
                    <th className="p-3 text-center">Cycles (1 &rarr; 5)</th>
                    <th className="p-3 text-right">Avg Cycle</th>
                    <th className="p-3 text-right">Rating %</th>
                    <th className="p-3 text-right">Normal Time</th>
                    <th className="p-3 text-right">Allow %</th>
                    <th className="p-3 text-right font-bold">Standard SMV</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeStudies.map((ts) => (
                    <tr key={ts.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{ts.studyCode}</div>
                        <div className="text-[10px] text-slate-400">{ts.date}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{ts.operatorName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{ts.operatorId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{ts.operationName}</div>
                        <div className="text-[10px] text-slate-400">{ts.machineType}</div>
                      </td>
                      <td className="p-3 text-slate-600">{ts.lineName}</td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                        {ts.cycleTimesSec.join('s, ')}s
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-900">
                        {ts.avgCycleTimeSec.toFixed(1)}s
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        {ts.performanceRatingPercent}%
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        {ts.normalTimeSec ? ts.normalTimeSec.toFixed(1) : (ts.avgCycleTimeSec * (ts.performanceRatingPercent / 100)).toFixed(1)}s
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">{ts.allowancePercent}%</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {ts.standardMinuteValue.toFixed(2)} min
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            ts.status === 'BENCHMARK_EXCEEDED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ts.status === 'VERIFIED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ts.status.replace('_', ' ')}
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

      {/* SUB-VIEW 2: METHOD STUDY */}
      {activeTab === 'method_study' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methodStudies.map((ms) => (
              <div key={ms.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-mono font-bold text-blue-700">{ms.studyNumber}</span> &bull;{' '}
                    <span className="font-bold text-slate-900">{ms.operation}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {ms.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 space-y-1">
                    <div className="font-bold text-rose-800 uppercase text-[10px]">Existing Method</div>
                    <p className="text-slate-700 leading-relaxed">{ms.existingMethod}</p>
                  </div>
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 space-y-1">
                    <div className="font-bold text-emerald-800 uppercase text-[10px]">Proposed Method</div>
                    <p className="text-slate-700 leading-relaxed">{ms.proposedMethod}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-slate-600">
                  <div>
                    <strong className="text-slate-800">Comparison Impact:</strong> {ms.operationComparisonNotes}
                  </div>
                  <div>
                    <strong className="text-slate-800">Workstation Setup:</strong> {ms.workstationAnalysis}
                  </div>
                  <div>
                    <strong className="text-slate-800">Ergonomics Review:</strong> {ms.ergonomicReview}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Motion Reduction</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">-{ms.motionReductionPercent}%</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Productivity Boost</div>
                    <div className="text-sm font-bold text-blue-700 mt-0.5">+{ms.productivityImpactPercent}%</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Est. Monthly Saving</div>
                    <div className="text-sm font-bold text-indigo-700 mt-0.5">${ms.costImpactMonthly.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: MOTION STUDY */}
      {activeTab === 'motion_study' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Motion Element Analysis (Value Added &bull; Non-Value Added &bull; Unnecessary Motion)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Breakdown of hand movements, reaching distance, grasp, align, and cut elements to eliminate waste
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Motion ID</th>
                    <th className="p-3">Operation Code &amp; Name</th>
                    <th className="p-3">Motion Element Description</th>
                    <th className="p-3 text-center">Motion Type</th>
                    <th className="p-3 text-right">Motion Time</th>
                    <th className="p-3 text-right">Reduction %</th>
                    <th className="p-3">IE Improvement Action</th>
                    <th className="p-3">Result Observed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {motionStudies.map((mot) => (
                    <tr key={mot.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-700">{mot.motionId}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{mot.operationName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{mot.operationCode}</div>
                      </td>
                      <td className="p-3 text-slate-800 font-medium">{mot.motionElement}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            mot.motionType === 'VALUE_ADDED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : mot.motionType === 'NON_VALUE_ADDED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {mot.motionType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{mot.motionTimeSec}s</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        -{mot.motionReductionPercent}%
                      </td>
                      <td className="p-3 text-slate-600">{mot.improvementAction}</td>
                      <td className="p-3 text-emerald-700 font-medium">{mot.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Time Study Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record 5-Cycle Time &amp; Motion Study</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStudy} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Operation Name</label>
                <input
                  type="text"
                  required
                  value={studyOpName}
                  onChange={(e) => setStudyOpName(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Operator Name</label>
                  <input
                    type="text"
                    required
                    value={studyOperator}
                    onChange={(e) => setStudyOperator(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Operator ID</label>
                  <input
                    type="text"
                    required
                    value={studyOperatorId}
                    onChange={(e) => setStudyOperatorId(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">5 Observed Cycle Times (seconds)</div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'C1', val: c1, set: setC1 },
                    { label: 'C2', val: c2, set: setC2 },
                    { label: 'C3', val: c3, set: setC3 },
                    { label: 'C4', val: c4, set: setC4 },
                    { label: 'C5', val: c5, set: setC5 },
                  ].map((cycle) => (
                    <div key={cycle.label}>
                      <span className="text-[10px] text-slate-500 font-bold">{cycle.label}</span>
                      <input
                        type="number"
                        step="0.1"
                        value={cycle.val}
                        onChange={(e) => cycle.set(Number(e.target.value))}
                        className="w-full p-1.5 mt-0.5 rounded-lg border border-slate-200 text-center font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Rating Factor (Pace %)</label>
                  <input
                    type="number"
                    min="60"
                    max="140"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Allowance % (Personal &amp; Fatigue)</label>
                  <input
                    type="number"
                    min="5"
                    max="25"
                    value={allowance}
                    onChange={(e) => setAllowance(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Live Calculated Results Box */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-blue-900">Real-Time Calculations:</div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500">Avg Cycle</div>
                    <div className="font-mono font-bold text-slate-900">{avgCycle}s</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Normal Time</div>
                    <div className="font-mono font-bold text-slate-900">{normalTime}s</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Std Time</div>
                    <div className="font-mono font-bold text-slate-900">{standardTime}s</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Result SMV</div>
                    <div className="font-mono font-bold text-emerald-700">{calculatedSmv} min</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Confirm &amp; Record Study
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
