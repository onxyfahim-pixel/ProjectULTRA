'use client';

import React, { useState } from 'react';
import {
  Layers,
  AlertTriangle,
  Clock,
  Download,
  BarChart3,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Package,
} from 'lucide-react';
import {
  WipManagementRecord,
  ProductionLossRecord,
  DowntimeManagementRecord,
} from '@/lib/types/planning-ie';

interface WipLossTabProps {
  wipRecords: WipManagementRecord[];
  losses: ProductionLossRecord[];
  downtimes: DowntimeManagementRecord[];
  onExportCsv: (filename: string, rows: any[]) => void;
}

type SubTab = 'wip' | 'losses' | 'downtime';

export function WipLossTab({
  wipRecords,
  losses,
  downtimes,
  onExportCsv,
}: WipLossTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('wip');

  return (
    <div className="space-y-6">
      {/* Top Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('wip')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'wip'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>16. 6-Stage WIP Pipeline (Cutting &rarr; Packing)</span>
          </button>
          <button
            onClick={() => setSubTab('losses')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'losses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>17. Production Loss Management ({losses.length})</span>
          </button>
          <button
            onClick={() => setSubTab('downtime')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'downtime'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>18. Downtime Management (MTTR &amp; MTBF)</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (subTab === 'wip') onExportCsv('WIP_Pipeline_Tracking.csv', wipRecords);
            else if (subTab === 'losses') onExportCsv('Production_Loss_Register.csv', losses);
            else onExportCsv('Downtime_Management.csv', downtimes);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* SUB-VIEW 1: 6-STAGE WIP PIPELINE */}
      {subTab === 'wip' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  6-Stage Work In Process (WIP) Tracking Matrix
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stages: CUTTING &rarr; INPUT &rarr; SEWING &rarr; ENDLINE &rarr; FINISHING &rarr; PACKING
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Aging Threshold: 5 Days
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">PO &amp; Buyer</th>
                    <th className="p-3">Style</th>
                    <th className="p-3 text-right">1. Cutting</th>
                    <th className="p-3 text-right">2. Input</th>
                    <th className="p-3 text-right">3. Sewing</th>
                    <th className="p-3 text-right">4. Endline</th>
                    <th className="p-3 text-right">5. Finishing</th>
                    <th className="p-3 text-right">6. Packing</th>
                    <th className="p-3 text-right font-bold text-slate-900">WIP Balance</th>
                    <th className="p-3 text-center">WIP Aging</th>
                    <th className="p-3">Buffer Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wipRecords.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{w.po}</div>
                        <div className="text-[11px] text-slate-500">{w.buyer}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{w.style}</td>
                      <td className="p-3 text-right font-mono text-slate-700">{w.cuttingQty.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-700">{w.inputQty.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">{w.sewingQty.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-indigo-700">{w.endlineQty.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-purple-700">{w.finishingQty.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{w.packingQty.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {w.balanceQty.toLocaleString()} pcs
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            w.agingDays > 5
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {w.agingDays} Days
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 max-w-xs truncate">{w.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: PRODUCTION LOSS MANAGEMENT */}
      {subTab === 'losses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Production Loss Log (Lost Minutes &bull; Lost Quantity &bull; Corrective Action)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Categories: Machine Breakdown, Material Shortage, Manpower Shortage, Quality Problem, Style Change, Waiting Time
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Line &amp; Style</th>
                    <th className="p-3">Loss Category</th>
                    <th className="p-3 text-right font-bold text-rose-600">Lost Minutes</th>
                    <th className="p-3 text-right font-bold text-slate-900">Lost Quantity</th>
                    <th className="p-3">Loss Root Cause Reason</th>
                    <th className="p-3">Responsible Dept</th>
                    <th className="p-3">IE Corrective Action Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {losses.map((loss) => (
                    <tr key={loss.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{loss.date}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{loss.lineName}</div>
                        <div className="font-mono text-[10px] text-blue-700">{loss.style} ({loss.po})</div>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {loss.lossCategory.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 text-sm">
                        {loss.lostMinutes} min
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {loss.lostQuantity} pcs
                      </td>
                      <td className="p-3 text-slate-700 font-medium max-w-xs">{loss.lossReason}</td>
                      <td className="p-3 font-semibold text-slate-600">{loss.responsibleDepartment}</td>
                      <td className="p-3 text-[11px] text-emerald-800 font-medium max-w-sm">
                        {loss.correctiveAction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: DOWNTIME MANAGEMENT (MTTR & MTBF) */}
      {subTab === 'downtime' && (
        <div className="space-y-4">
          {/* MTTR & MTBF KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Logged Downtime</div>
              <div className="text-xl font-bold text-rose-700 mt-1">95 min</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across active lines</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Factory Downtime %</div>
              <div className="text-xl font-bold text-blue-700 mt-1">2.4%</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Target &le; 3.5%</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Mean Time to Repair (MTTR)</div>
              <div className="text-xl font-bold text-indigo-700 mt-1">23.0 min</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Average repair turnaround</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Mean Time Between Failures (MTBF)</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">76.8 hrs</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">High reliability benchmark</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Line &amp; Machine ID</th>
                    <th className="p-3">Downtime Type</th>
                    <th className="p-3 text-center">Nature</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right font-bold text-rose-600">Duration</th>
                    <th className="p-3 text-right">MTTR (min)</th>
                    <th className="p-3 text-right">MTBF (hrs)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {downtimes.map((dt) => (
                    <tr key={dt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{dt.date}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{dt.lineName}</div>
                        <div className="font-mono text-[10px] text-blue-700">{dt.machineId}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{dt.downtimeType}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            dt.plannedOrUnplanned === 'PLANNED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {dt.plannedOrUnplanned}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{dt.downtimeCategory.replace('_', ' ')}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 text-sm">
                        {dt.durationMinutes} min
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700">{dt.mttrMinutes}m</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{dt.mtbfHours}h</td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {dt.status}
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
    </div>
  );
}
