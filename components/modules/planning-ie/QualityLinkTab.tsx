'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Download,
  RotateCcw,
  Sparkles,
  Link2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  ProductionQualityLink,
  ProductionReworkRecord,
  ProductionRejectionRecord,
} from '@/lib/types/planning-ie';

interface QualityLinkTabProps {
  qualityLinks: ProductionQualityLink[];
  reworks: ProductionReworkRecord[];
  rejections: ProductionRejectionRecord[];
  onExportCsv: (filename: string, rows: any[]) => void;
}

type SubTab = 'qms_link' | 'rework' | 'rejection';

export function QualityLinkTab({
  qualityLinks,
  reworks,
  rejections,
  onExportCsv,
}: QualityLinkTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('qms_link');

  return (
    <div className="space-y-6">
      {/* Top Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('qms_link')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'qms_link'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>20. Production &amp; QMS Quality Link (DHU &bull; RFT)</span>
          </button>
          <button
            onClick={() => setSubTab('rework')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'rework'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>27. Production Rework Register ({reworks.length})</span>
          </button>
          <button
            onClick={() => setSubTab('rejection')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'rejection'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>28. Production Rejection &amp; Scrap ({rejections.length})</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (subTab === 'qms_link') onExportCsv('Production_QMS_Link.csv', qualityLinks);
            else if (subTab === 'rework') onExportCsv('Production_Rework_Register.csv', reworks);
            else onExportCsv('Production_Rejection_Scrap.csv', rejections);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* SUB-VIEW 1: QMS QUALITY INTEGRATION LINK */}
      {subTab === 'qms_link' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  43. Fully Integrated Production &rarr; QMS Pipeline
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Production data automatically synchronizes with Inspection Logs, Defect Library, DHU, Non-Conformance Reports (NCR), and Corrective Actions (CAPA).
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              QMS Connected
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Line Name</th>
                    <th className="p-3">Style &amp; PO</th>
                    <th className="p-3 text-right">Inspected Pcs</th>
                    <th className="p-3 text-right">Defect Pcs</th>
                    <th className="p-3 text-right font-bold text-emerald-700">DHU %</th>
                    <th className="p-3 text-right font-bold text-blue-700">RFT % (Right First Time)</th>
                    <th className="p-3 text-right font-bold text-amber-700">Rework %</th>
                    <th className="p-3 text-right font-bold text-rose-600">Rejection %</th>
                    <th className="p-3 text-center">Linked NCR</th>
                    <th className="p-3 text-center">Linked CAPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {qualityLinks.map((ql, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{ql.lineName}</td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{ql.style}</div>
                        <div className="text-[10px] font-mono text-slate-500">{ql.po}</div>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-800">{ql.inspectedQty.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-rose-600 font-bold">{ql.defectQty}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        {ql.dhuPercent.toFixed(2)}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700 text-sm">
                        {ql.rftPercent.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700">
                        {ql.reworkPercent.toFixed(2)}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">
                        {ql.rejectionPercent.toFixed(2)}%
                      </td>
                      <td className="p-3 text-center font-mono">
                        {ql.linkedNcrId ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {ql.linkedNcrId}
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {ql.linkedCapaId ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {ql.linkedCapaId}
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
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

      {/* SUB-VIEW 2: PRODUCTION REWORK REGISTER */}
      {subTab === 'rework' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                27. Production Rework Register (Operation &bull; Defect &bull; Reason)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Track and re-route repairable garments without slowing main line assembly flow
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Style &amp; PO</th>
                    <th className="p-3">Line &amp; Operation</th>
                    <th className="p-3">Identified Defect</th>
                    <th className="p-3 text-right font-bold text-amber-700">Rework Qty</th>
                    <th className="p-3">Root Cause Reason</th>
                    <th className="p-3">Responsible Section</th>
                    <th className="p-3 text-center">Time Slot</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reworks.map((rwk) => (
                    <tr key={rwk.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{rwk.date}</td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{rwk.style}</div>
                        <div className="text-[10px] font-mono text-slate-500">{rwk.po}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{rwk.lineName}</div>
                        <div className="text-[11px] text-slate-600">{rwk.operationName}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{rwk.defectName}</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700 text-sm">
                        {rwk.quantity} pcs
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs">{rwk.reason}</td>
                      <td className="p-3 text-slate-700 font-medium">{rwk.responsibleProcess}</td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-500">
                        {rwk.startTime} - {rwk.endTime}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            rwk.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {rwk.status}
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

      {/* SUB-VIEW 3: PRODUCTION REJECTION REGISTER */}
      {subTab === 'rejection' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                28. Production Rejection Register &amp; Scrap Accounting
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial impact tracking of non-repairable scrap and disposition routing
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Product &amp; Style</th>
                    <th className="p-3">PO #</th>
                    <th className="p-3">Inspection Stage</th>
                    <th className="p-3">Defect Reason</th>
                    <th className="p-3 text-right font-bold text-rose-600">Scrap Qty</th>
                    <th className="p-3 text-right">Unit Cost</th>
                    <th className="p-3 text-right font-bold text-rose-700">Total Loss ($)</th>
                    <th className="p-3 text-center">Disposition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rejections.map((rej) => (
                    <tr key={rej.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{rej.date}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{rej.product}</div>
                        <div className="font-mono text-[10px] text-slate-500">{rej.style}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-700">{rej.po}</td>
                      <td className="p-3 font-medium text-slate-700">{rej.processStage}</td>
                      <td className="p-3 text-slate-600 max-w-xs">{rej.defectName}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 text-sm">
                        {rej.quantity} pcs
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">${rej.unitCostUsd.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-700 text-sm">
                        ${rej.totalCostUsd.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                          {rej.disposition}
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
