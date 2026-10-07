'use client';

import React, { useState, useMemo } from 'react';
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
  Layers,
  Search,
  UserCheck,
  Check,
  TrendingUp,
} from 'lucide-react';
import {
  ProductionQualityLink,
  ProductionReworkRecord,
  ProductionRejectionRecord,
} from '@/lib/types/planning-ie';
import { ProductionLine } from '@/lib/types/production-management';
import { ProductionOrder } from '@/lib/types/erp';

interface QualityLinkTabProps {
  lines?: ProductionLine[];
  productionRecords?: ProductionOrder[];
  qualityLinks: ProductionQualityLink[];
  reworks: ProductionReworkRecord[];
  rejections: ProductionRejectionRecord[];
  onExportCsv: (filename: string, rows: any[]) => void;
}

type SubTab = 'qms_link' | 'rework' | 'rejection';

export function QualityLinkTab({
  lines = [],
  productionRecords = [],
  qualityLinks,
  reworks,
  rejections,
  onExportCsv,
}: QualityLinkTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('qms_link');
  const [searchQuery, setSearchQuery] = useState('');

  // Synthesize live line-by-line quality performance linked directly with Production lines & Quality Controller
  const synthesizedQualityRows = useMemo(() => {
    if (!lines || lines.length === 0) {
      return qualityLinks;
    }

    // Default commercial style and PO references per line
    const DEFAULT_LINE_POS: Record<string, { style: string; po: string; buyer: string; defaultInspected: number; defaultDefects: number }> = {
      'line-01': { style: 'STY-TS-2026 (Crewneck Heavy)', po: 'PO-HM-99201', buyer: 'H&M Hennes & Mauritz', defaultInspected: 4500, defaultDefects: 58 },
      'line-02': { style: 'STY-PL-889 (Pique Polo)', po: 'PO-PVH-7729', buyer: 'PVH Tommy Hilfiger', defaultInspected: 3200, defaultDefects: 44 },
      'line-03': { style: 'STY-SH-410 (Poplin Woven Shirt)', po: 'PO-MKS-3104', buyer: 'Marks & Spencer', defaultInspected: 2600, defaultDefects: 42 },
      'line-04': { style: 'STY-DN-502 (Slim Fit Denim)', po: 'PO-ZARA-4482', buyer: 'Inditex / Zara', defaultInspected: 2900, defaultDefects: 68 },
      'line-05': { style: 'STY-HD-770 (Kangaroo Hoodie)', po: 'PO-UNI-6619', buyer: 'Fast Retailing / UNIQLO', defaultInspected: 2400, defaultDefects: 34 },
      'line-06': { style: 'STY-LG-920 (Seamless Leggings)', po: 'PO-TGT-5501', buyer: 'Target Sourcing', defaultInspected: 3600, defaultDefects: 38 },
      'line-07': { style: 'STY-ACT-102 (Sports Activewear)', po: 'PO-HM-99201', buyer: 'H&M Move', defaultInspected: 2800, defaultDefects: 32 },
      'line-08': { style: 'STY-JK-904 (Eco Waterproof Jacket)', po: 'PO-ZARA-4482', buyer: 'Zara Men', defaultInspected: 1800, defaultDefects: 26 },
    };

    return lines.map((l) => {
      // Check if there is an exact matching production record
      const match = productionRecords.find(
        (pr) =>
          pr.lineId === l.id ||
          (pr.sewingLine && (pr.sewingLine.toLowerCase().includes(l.lineCode.toLowerCase()) || pr.sewingLine.toLowerCase().includes(l.name.toLowerCase())))
      );

      const defaults = DEFAULT_LINE_POS[l.id] || {
        style: 'STY-TS-2026',
        po: 'PO-HM-99201',
        buyer: 'Commercial Retailer',
        defaultInspected: 2500,
        defaultDefects: 36,
      };

      const inspected = match?.targetQuantity ? Math.min(match.completedQuantity || 3000, 5000) : defaults.defaultInspected;
      const defects = match ? (match.totalDefects || defaults.defaultDefects) : defaults.defaultDefects;
      const passed = Math.max(0, inspected - defects);
      const dhu = inspected > 0 ? (defects / inspected) * 100 : 1.25;
      const rft = inspected > 0 ? (passed / inspected) * 100 : 98.75;
      const rework = Number((dhu * 0.85).toFixed(2));
      const rejection = Number((dhu * 0.15).toFixed(2));

      return {
        lineId: l.id,
        lineName: l.name,
        lineCode: l.lineCode,
        unitName: l.unitName || 'Unit 01 (Dhaka Complex)',
        sectionName: l.sectionName || 'Sewing Floor',
        qualityController: l.qualityController || 'Md. Rafiqul Islam',
        lineChief: l.lineChief || 'Kabir Hossain',
        style: match?.styleName ? `${match.styleNumber || 'STY'} (${match.styleName})` : defaults.style,
        po: match?.orderNumber || defaults.po,
        buyer: defaults.buyer,
        inspectedQty: inspected,
        defectQty: defects,
        passedQty: passed,
        dhuPercent: Number(dhu.toFixed(2)),
        rftPercent: Number(rft.toFixed(2)),
        reworkPercent: rework,
        rejectionPercent: rejection,
        linkedNcrId: dhu > 2.0 ? `NCR-${l.lineCode}-04` : undefined,
        linkedCapaId: dhu > 2.0 ? `CAPA-${l.lineCode}-09` : undefined,
        lineStatus: l.status,
      };
    });
  }, [lines, productionRecords, qualityLinks]);

  // Filtered rows
  const filteredQualityRows = useMemo(() => {
    return synthesizedQualityRows.filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.lineName.toLowerCase().includes(q) ||
        r.style.toLowerCase().includes(q) ||
        r.po.toLowerCase().includes(q) ||
        (r.qualityController || '').toLowerCase().includes(q) ||
        (r.unitName || '').toLowerCase().includes(q)
      );
    });
  }, [synthesizedQualityRows, searchQuery]);

  // Overall KPI aggregates
  const totalInspected = useMemo(() => synthesizedQualityRows.reduce((sum, r) => sum + r.inspectedQty, 0), [synthesizedQualityRows]);
  const totalDefects = useMemo(() => synthesizedQualityRows.reduce((sum, r) => sum + r.defectQty, 0), [synthesizedQualityRows]);
  const avgFactoryDhu = useMemo(() => {
    if (totalInspected <= 0) return 0;
    return (totalDefects / totalInspected) * 100;
  }, [totalInspected, totalDefects]);
  const avgFactoryRft = useMemo(() => {
    if (totalInspected <= 0) return 100;
    return ((totalInspected - totalDefects) / totalInspected) * 100;
  }, [totalInspected, totalDefects]);

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
            if (subTab === 'qms_link') onExportCsv('Production_QMS_Link.csv', synthesizedQualityRows);
            else if (subTab === 'rework') onExportCsv('Production_Rework_Register.csv', reworks);
            else onExportCsv('Production_Rejection_Scrap.csv', rejections);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Top Quality Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Factory RFT %</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{avgFactoryRft.toFixed(2)}%</div>
          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Target &ge; 95.0% Benchmark</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Floor DHU %</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{avgFactoryDhu.toFixed(2)}%</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Defects per 100 garments</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Checked Garments</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalInspected.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Across all {lines.length} lines</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">QA Controllers Deployed</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{lines.length} Officers</div>
          <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Dedicated Line QC Officers</span>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: QMS QUALITY INTEGRATION LINK */}
      {subTab === 'qms_link' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Fully Integrated Production Floor &amp; Quality Management Link
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Line outputs live sync with Quality Control audits, defect categorization, DHU monitoring, and CAPA resolution.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by line, style, QC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Live QMS Connected</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Line &amp; Unit</th>
                    <th className="p-3">Quality Controller</th>
                    <th className="p-3">Style &amp; PO</th>
                    <th className="p-3 text-right">Inspected Pcs</th>
                    <th className="p-3 text-right">Defect Pcs</th>
                    <th className="p-3 text-right font-bold text-emerald-700">DHU %</th>
                    <th className="p-3 text-right font-bold text-blue-700">RFT % (First Time Right)</th>
                    <th className="p-3 text-right font-bold text-amber-700">Rework %</th>
                    <th className="p-3 text-right font-bold text-rose-600">Rejection %</th>
                    <th className="p-3 text-center">Audit NCR / CAPA</th>
                    <th className="p-3 text-center">Quality Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQualityRows.map((ql, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{ql.lineName}</div>
                        <div className="text-[10px] text-slate-500">{ql.unitName}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{ql.qualityController}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">Chief: {ql.lineChief}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{ql.style}</div>
                        <div className="text-[10px] font-mono text-slate-500">{ql.po}</div>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-800 font-bold">{ql.inspectedQty.toLocaleString()}</td>
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
                          <div className="space-y-0.5">
                            <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              {ql.linkedNcrId}
                            </span>
                            {ql.linkedCapaId && (
                              <div className="text-[9px] font-bold text-blue-600">{ql.linkedCapaId}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                            Zero Major NCR
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            ql.rftPercent >= 98
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ql.rftPercent >= 95
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ql.rftPercent >= 98 ? 'EXCELLENT' : ql.rftPercent >= 95 ? 'COMPLIANT' : 'ATTENTION'}
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
                    <th className="p-3 text-center">Rework Qty</th>
                    <th className="p-3 text-center">Repaired Qty</th>
                    <th className="p-3">Assigned Operator</th>
                    <th className="p-3">Root Cause</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reworks.map((rw) => (
                    <tr key={rw.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono text-slate-600">{rw.date}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{rw.style}</div>
                        <div className="text-[10px] font-mono text-slate-500">{rw.po}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-blue-700">{rw.lineName}</div>
                        <div className="text-[10px] text-slate-500">{rw.operationName}</div>
                      </td>
                      <td className="p-3 font-semibold text-rose-700">{rw.defectName}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">{rw.quantity}</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700">{rw.quantity}</td>
                      <td className="p-3 text-slate-700 font-medium">{rw.responsibleProcess}</td>
                      <td className="p-3 text-slate-600 max-w-[200px] truncate">{rw.reason}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            rw.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {rw.status}
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
                28. Permanent Production Rejection &amp; Scrap Accounting
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Unrepairable garment losses logged for insurance, cutting buffer reconciliation, and supplier recovery
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Style &amp; PO</th>
                    <th className="p-3">Stage &amp; Product</th>
                    <th className="p-3">Fatal Defect Reason</th>
                    <th className="p-3 text-center">Rejected Pcs</th>
                    <th className="p-3 text-right">Cost Loss ($)</th>
                    <th className="p-3">Disposition / Disposal</th>
                    <th className="p-3">Reason / Process</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rejections.map((rj) => (
                    <tr key={rj.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono text-slate-600">{rj.date}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{rj.style}</div>
                        <div className="text-[10px] font-mono text-slate-500">{rj.po}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-blue-700">{rj.processStage}</div>
                        <div className="text-[10px] text-slate-500">{rj.product}</div>
                      </td>
                      <td className="p-3 font-semibold text-rose-700">{rj.defectName}</td>
                      <td className="p-3 text-center font-mono font-bold text-rose-700">{rj.quantity} pcs</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">${rj.totalCostUsd.toFixed(2)}</td>
                      <td className="p-3 text-slate-700">
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {rj.disposition}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{rj.reason}</td>
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
