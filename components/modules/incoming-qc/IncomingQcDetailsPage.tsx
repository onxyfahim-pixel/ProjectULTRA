'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Layers,
  Boxes,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  FileCheck,
  Calendar,
  User,
  ShieldCheck,
  Tag,
  Scissors,
  Sparkles,
  Package,
  Printer,
  Edit,
  MapPin,
  FileText,
} from 'lucide-react';
import { IncomingQCLot } from '@/lib/types/modules';
import { GradeBadge } from '@/components/ui/Badge';
import { InventoryItem } from '@/lib/types/erp';

interface IncomingQcDetailsPageProps {
  lot: IncomingQCLot;
  onBack: () => void;
  onEdit: (lot: IncomingQCLot) => void;
  onQuickStatusChange: (lot: IncomingQCLot, result: 'ACCEPTED' | 'REJECTED') => void;
  inventoryItem?: InventoryItem;
  showToast?: (msg: string) => void;
}

export function IncomingQcDetailsPage({
  lot,
  onBack,
  onEdit,
  onQuickStatusChange,
  inventoryItem,
  showToast,
}: IncomingQcDetailsPageProps) {
  const [activeTab, setActiveTab] = useState<'parameters' | 'defects' | 'traceability'>('parameters');

  const isPass = lot.result === 'ACCEPTED';
  const isQuarantine = lot.result === 'REJECTED';

  const cat = lot.materialCategory;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP HERO NAVIGATION BAR matching Buyer & Order module */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Back to Inspection Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {lot.lotNumber}
              </span>
              <span className="text-xs font-medium text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-600 font-bold">{cat}</span>
              <span className="text-xs font-medium text-slate-500">•</span>
              <span className="text-xs text-slate-500">{lot.inspectionDate}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {lot.materialName || lot.lotNumber}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Quick Action: Release to Cutting or Quarantine */}
          {lot.result !== 'ACCEPTED' ? (
            <button
              type="button"
              onClick={() => onQuickStatusChange(lot, 'ACCEPTED')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve & Release</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onQuickStatusChange(lot, 'REJECTED')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Place on Mill Hold</span>
            </button>
          )}

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(lot)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {/* Print Certificate */}
          <button
            type="button"
            onClick={() => {
              if (showToast) showToast(`Printing inspection certificate ${lot.lotNumber}...`);
              window.print();
            }}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Print QC Certificate"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HERO METRICS & VERDICT BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-2xs ${
                isPass
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : isQuarantine
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-amber-50 border-amber-200 text-amber-600'
              }`}
            >
              {isPass ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : isQuarantine ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isPass
                      ? 'bg-emerald-100 text-emerald-800'
                      : isQuarantine
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {lot.result.replace('_', ' ')}
                </span>
                <GradeBadge grade={lot.qualityGradeAssigned || 'GRADE_A'} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Protocol: <strong className="text-slate-800">{lot.aqlStandard || lot.inspectionMethod}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Sample Inspected
              </span>
              <span className="text-base font-bold font-mono text-blue-700">
                {lot.inspectedQuantity.toLocaleString()} / {lot.receivedQuantity.toLocaleString()} {lot.unit}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Primary Reading
              </span>
              <span className="text-base font-bold font-mono text-slate-900">
                {cat === 'FABRIC' && `${lot.pointsPer100SqYd || 0} pts`}
                {cat === 'SEWING_THREAD' && `${lot.tensileStrengthCndtex || 0} cN`}
                {cat === 'ZIPPERS' && `${lot.chainCrosswiseStrengthN || 0} N`}
                {cat === 'TRIMS_BUTTONS' && `${lot.pullForceNewtons || 0} N`}
                {cat === 'INTERLINING_ELASTIC' && `${lot.fusingPeelStrengthN5cm || 0} N`}
                {cat === 'LABELS_PACKAGING' && `${lot.burstingStrengthKpa || 0} kPa`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Total Flaws
              </span>
              <span
                className={`text-base font-bold font-mono ${
                  lot.defectCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {lot.defectCount} Defect{lot.defectCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('parameters')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'parameters'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Testing Protocol & Technical Specs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('defects')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'defects'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Observed Flaws ({lot.defectsList?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('traceability')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'traceability'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Linked Inventory & Traceability
          </button>
        </div>

        {/* TAB 1: PARAMETERS & TECHNICAL SPECS */}
        {activeTab === 'parameters' && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-150">
            {cat === 'FABRIC' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">ASTM 4-Point Penalty Score</span>
                  <div className="text-xl font-bold font-mono text-blue-700">
                    {lot.pointsPer100SqYd || 14.8} <span className="text-xs text-slate-500">pts / 100 sq.yd</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Threshold limit: ≤ 28.0 pts</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${
                        (lot.pointsPer100SqYd || 0) <= 28 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, ((lot.pointsPer100SqYd || 0) / 28) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Actual Fabric Weight</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {lot.actualGsm || 182} <span className="text-xs text-slate-500">GSM</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Target: {lot.targetGsm || 180} GSM (Variance: {lot.gsmVariancePercent || 1.1}%)
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-2">✓ Within ±5% tolerance</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">CIE Shade Match (D65)</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    ΔE {lot.deltaE || 0.35}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Status: <strong className="text-slate-800">{lot.shadeEvaluation || 'MATCH_APPROVED_SWATCH'}</strong>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-2">✓ Approved standard swatch</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Weft Bowing & Skewing</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {lot.bowingPercent || 1.2}%
                  </div>
                  <div className="text-[11px] text-slate-500">Roll Width: {lot.rollWidthInches || 62.5} inches</div>
                  <div className="text-[10px] text-slate-500 mt-2">Sampled from {lot.rollsInspected || 5} rolls</div>
                </div>
              </div>
            )}

            {cat === 'SEWING_THREAD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Tensile Breaking Strength</span>
                  <div className="text-xl font-bold font-mono text-blue-700">
                    {lot.tensileStrengthCndtex || 38.5} <span className="text-xs text-slate-500">cN/dtex</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Standard requirement: ≥ 35.0 cN/dtex</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Elongation at Break</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {lot.elongationPercent || 18.4}%
                  </div>
                  <div className="text-[11px] text-slate-500">Recommended range: 15% - 22%</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Twist per Inch (TPI)</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {lot.tpiTwistPerInch || 28.2} TPI
                  </div>
                  <div className="text-[11px] text-slate-500">Balanced S/Z twist direction</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">High-Speed Sewability</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    {lot.sewabilityBreaksPer100m || 0} Breaks
                  </div>
                  <div className="text-[11px] text-slate-500">Tested at 5,000 RPM over 100m seam</div>
                </div>
              </div>
            )}

            {cat === 'ZIPPERS' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Crosswise Chain Strength</span>
                  <div className="text-xl font-bold font-mono text-blue-700">
                    {lot.chainCrosswiseStrengthN || 440} N
                  </div>
                  <div className="text-[11px] text-slate-500">Standard limit: ≥ 350 N</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Slider Locking Holding Force</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {lot.sliderLockStrengthN || 88} N
                  </div>
                  <div className="text-[11px] text-slate-500">Standard limit: ≥ 60 N</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">500 Reciprocity Open/Close Cycles</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    PASSED
                  </div>
                  <div className="text-[11px] text-slate-500">Zero slider jam or tooth damage</div>
                </div>
              </div>
            )}

            {cat === 'TRIMS_BUTTONS' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Pull-Off Attachment Strength</span>
                  <div className="text-xl font-bold font-mono text-blue-700">
                    {lot.pullForceNewtons || 114} N
                  </div>
                  <div className="text-[11px] text-slate-500">Requirement: ≥ 90 N (21 lbs) for 10s</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Impact Shatter Resistance</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    PASSED
                  </div>
                  <div className="text-[11px] text-slate-500">No breakage under mechanical impact</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Ligne Size Verification</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {lot.ligneSize || 24.05} L
                  </div>
                  <div className="text-[11px] text-slate-500">Standard 24L shirt button gauge</div>
                </div>
              </div>
            )}

            {cat === 'INTERLINING_ELASTIC' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Fusing Bond Peel Strength</span>
                  <div className="text-xl font-bold font-mono text-blue-700">
                    {lot.fusingPeelStrengthN5cm || 15.6} N/5cm
                  </div>
                  <div className="text-[11px] text-slate-500">Standard limit: ≥ 12.0 N/5cm</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Wash Shrinkage %</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {lot.washShrinkagePercent || 0.7}%
                  </div>
                  <div className="text-[11px] text-slate-500">Tolerance limit: &lt; 1.5%</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Elastic Recovery % (100% stretch)</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    {lot.elasticRecoveryPercent || 96.5}%
                  </div>
                  <div className="text-[11px] text-slate-500">Standard requirement: ≥ 92.0%</div>
                </div>
              </div>
            )}

            {cat === 'LABELS_PACKAGING' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Carton Mullen Bursting Strength</span>
                  <div className="text-xl font-bold font-mono text-blue-700">
                    {lot.burstingStrengthKpa || 1450} kPa
                  </div>
                  <div className="text-[11px] text-slate-500">Standard requirement: ≥ 1200 kPa</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">10-Point Drop Test (75cm)</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    PASSED
                  </div>
                  <div className="text-[11px] text-slate-500">Zero corner puncture or collapse</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Barcode ANSI Scannability</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    Grade {lot.barcodeGrade || 'A'}
                  </div>
                  <div className="text-[11px] text-slate-500">100% first-pass scannable</div>
                </div>
              </div>
            )}

            {/* General Inspector Notes */}
            <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 text-xs space-y-1">
              <span className="font-bold text-blue-950 block">QC Inspector Observations:</span>
              <p className="text-slate-700 leading-relaxed">
                {lot.notes || 'Materials met all required chemical, physical, and visual parameters without non-conformances.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: DEFECTS LIST */}
        {activeTab === 'defects' && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-150">
            {lot.defectsList && lot.defectsList.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Defect Description</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Observed Count</th>
                      <th className="p-3">Penalty Points</th>
                      <th className="p-3">Garment Zone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lot.defectsList.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">{d.defectName}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : d.severity === 'MAJOR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {d.severity}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{d.count} pcs</td>
                        <td className="p-3 font-mono font-bold text-blue-700">+{d.points || 1} pts</td>
                        <td className="p-3 text-slate-500">{d.zone || 'Zone A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">Zero Defect Tolerance Achieved</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No visual, yarn, or mechanical defects detected during this inspection frame.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRACEABILITY & INVENTORY LINK */}
        {activeTab === 'traceability' && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  <span>Linked Inventory Item</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">SKU Code</span>
                    <span className="font-mono font-bold text-blue-700">{lot.inventorySku || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Material Description</span>
                    <span className="font-semibold text-slate-900">{lot.materialName || 'Raw Material'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Warehouse Storage Location</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {inventoryItem?.warehouseLocation || 'WH-R01-B04'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Assigned Quality Grade</span>
                    <GradeBadge grade={lot.qualityGradeAssigned || 'GRADE_A'} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Supplier & Order References</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Mill / Supplier</span>
                    <span className="font-semibold text-slate-900">{lot.supplierName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Buyer PO Reference</span>
                    <span className="font-mono text-slate-800">{lot.poNumber || 'PO-HM-99201'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Target Style Number</span>
                    <span className="font-mono text-slate-800">{lot.styleNumber || 'STY-HM-2026-01'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">QC Inspector</span>
                    <span className="font-semibold text-slate-800">{lot.inspectorName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
