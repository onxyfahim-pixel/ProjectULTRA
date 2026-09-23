'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Download,
  ShieldCheck,
  BarChart3,
  Layers,
  Search,
  Printer,
  Edit,
  Copy,
  Trash2,
  Package,
  User,
  Clock,
  Sparkles,
  Check,
  Sliders,
  AlertCircle,
  FileText,
  BadgeAlert,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { InspectionRecord, InspectionType, InspectionStatus, InspectionStage } from '@/lib/types/erp';

interface InspectionDetailsPageProps {
  record: InspectionRecord;
  allRecords?: InspectionRecord[];
  onBack: () => void;
  onEdit: (record: InspectionRecord) => void;
  onDuplicate: (record: InspectionRecord) => void;
  onDelete: (record: InspectionRecord) => void;
  onSelectRecord?: (record: InspectionRecord) => void;
  showToast: (msg: string) => void;
}

const TYPE_CONFIG: Record<
  InspectionType,
  {
    label: string;
    stageName: string;
    badgeCls: string;
    borderCls: string;
    heroGradient: string;
    icon: string;
    description: string;
  }
> = {
  INLINE: {
    label: 'Inline Inspection',
    stageName: 'Sewing & Assembly In-Line QC',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    borderCls: 'border-blue-500',
    heroGradient: 'from-blue-600 via-indigo-600 to-slate-900',
    icon: '🧵',
    description: 'Active process QC during cutting & sewing lines: SPI tension, workstation audits, needle checks',
  },
  PRE_FINAL: {
    label: 'Pre-Final Inspection',
    stageName: 'Mid-Packaging & Assortment Audit',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
    borderCls: 'border-amber-500',
    heroGradient: 'from-amber-600 via-orange-600 to-slate-900',
    icon: '📦',
    description: 'Conducted at 50%–80% packed goods: carton packing, size assortment, shade consistency & workmanship',
  },
  FINAL: {
    label: 'Final Inspection (FRI)',
    stageName: 'Final Random Inspection / AQL 2.5',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderCls: 'border-emerald-500',
    heroGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    icon: '🏆',
    description: 'Official pre-shipment audit at 100% finished & ≥80% packed: AQL sampling, carton drop test & metal detection',
  },
};

const STATUS_MAP: Record<InspectionStatus, { label: string; cls: string; pill: string; icon: any }> = {
  PASSED: {
    label: 'Passed',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pill: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: CheckCircle2,
  },
  CONDITIONAL_PASS: {
    label: 'Conditional Pass',
    cls: 'bg-amber-100 text-amber-800 border-amber-200',
    pill: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: AlertTriangle,
  },
  REJECTED: {
    label: 'Rejected',
    cls: 'bg-rose-100 text-rose-800 border-rose-200',
    pill: 'text-rose-700 bg-rose-50 border-rose-200',
    icon: XCircle,
  },
};

export function InspectionDetailsPage({
  record,
  allRecords = [],
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onSelectRecord,
  showToast,
}: InspectionDetailsPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'defects' | 'measurements' | 'checkpoints'>('overview');

  const inspectionType: InspectionType =
    record.inspectionType ||
    (record.stage === 'SEWING_IN_LINE' || record.stage === 'CUTTING_INSPECTION'
      ? 'INLINE'
      : record.stage === 'FABRIC_INWARD'
      ? 'INLINE'
      : record.packedPercent && record.packedPercent < 80
      ? 'PRE_FINAL'
      : 'FINAL');

  const typeConfig = TYPE_CONFIG[inspectionType];
  const statusConfig = STATUS_MAP[record.status] || STATUS_MAP.PASSED;
  const StatusIcon = statusConfig.icon;

  const passRate = record.sampleSize > 0 ? ((record.passCount / record.sampleSize) * 100).toFixed(1) : '100.0';
  const defectRate = record.sampleSize > 0 ? ((record.defectCount / record.sampleSize) * 100).toFixed(1) : '0.0';

  // Find other inspection records for the same style/order to demonstrate the 3-Stage Lifecycle
  const relatedStyleRecords = allRecords.filter(
    (r) =>
      (r.styleNumber && r.styleNumber === record.styleNumber) ||
      (r.orderNumber && record.orderNumber && r.orderNumber === record.orderNumber)
  );

  const inlineRecord = relatedStyleRecords.find((r) => (r.inspectionType || '') === 'INLINE');
  const preFinalRecord = relatedStyleRecords.find((r) => (r.inspectionType || '') === 'PRE_FINAL');
  const finalRecord = relatedStyleRecords.find((r) => (r.inspectionType || '') === 'FINAL');

  const stagesLifecycle = [
    {
      type: 'INLINE' as InspectionType,
      label: '1. Inline Inspection',
      rec: inlineRecord || (inspectionType === 'INLINE' ? record : null),
      status: inlineRecord ? inlineRecord.status : inspectionType === 'INLINE' ? record.status : 'PENDING',
    },
    {
      type: 'PRE_FINAL' as InspectionType,
      label: '2. Pre-Final Inspection',
      rec: preFinalRecord || (inspectionType === 'PRE_FINAL' ? record : null),
      status: preFinalRecord ? preFinalRecord.status : inspectionType === 'PRE_FINAL' ? record.status : 'PENDING',
    },
    {
      type: 'FINAL' as InspectionType,
      label: '3. Final Inspection (FRI)',
      rec: finalRecord || (inspectionType === 'FINAL' ? record : null),
      status: finalRecord ? finalRecord.status : inspectionType === 'FINAL' ? record.status : 'PENDING',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-3.5 animate-in fade-in duration-200">
      {/* Top Navigation Bar - Identical styling to Buyer & Order module */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Inspection List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight">
                {record.inspectionCode}
              </h2>
              {/* Inspection Type Pill */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeConfig.badgeCls}`}>
                <span>{typeConfig.icon}</span>
                <span>{typeConfig.label}</span>
              </span>
              {/* Verdict Pill */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.cls}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusConfig.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {record.buyer} • Style: <span className="font-semibold text-slate-700">{record.styleNumber}</span>
              {record.orderNumber && (
                <>
                  {' '}• PO: <span className="font-mono text-blue-600 font-semibold">{record.orderNumber}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons - Styled identically to Buyer & Order module */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              window.print();
              showToast('Ready for printing / export to PDF dossier');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Print Inspection Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(record)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Duplicate as new audit template"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate Audit</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(record)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Edit this inspection record"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Inspection</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(record)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
            title="Delete this audit record"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* THREE-STAGE APPAREL QC PIPELINE TRACKER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3-Stage Apparel Inspection Pipeline (Inline ➔ Pre-Final ➔ Final)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Style: <span className="font-mono font-semibold text-slate-800">{record.styleNumber}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stagesLifecycle.map((st) => {
            const isCurrent = st.type === inspectionType;
            const hasRec = Boolean(st.rec);
            const statusLabel = hasRec
              ? st.rec?.status === 'PASSED'
                ? 'Passed'
                : st.rec?.status === 'CONDITIONAL_PASS'
                ? 'Conditional'
                : 'Rejected'
              : 'Not Logged';

            return (
              <div
                key={st.type}
                onClick={() => {
                  if (st.rec && st.rec.id !== record.id && onSelectRecord) {
                    onSelectRecord(st.rec);
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                    : hasRec
                    ? 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer'
                    : 'bg-slate-50/50 border-slate-200/60 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>
                    {st.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      hasRec && st.rec?.status === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : hasRec && st.rec?.status === 'CONDITIONAL_PASS'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : hasRec && st.rec?.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  {hasRec && st.rec ? (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-600 font-medium">{st.rec.inspectionCode}</span>
                      <span className="font-mono text-slate-700 font-semibold">
                        {st.rec.passCount}/{st.rec.sampleSize} pass
                      </span>
                    </div>
                  ) : (
                    <span>Audit checkpoint pending for this order</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HERO CARD - Rich Modern Aesthetic Matching Buyer Order Module */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className={`bg-gradient-to-r ${typeConfig.heroGradient} px-6 py-6 text-white`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg text-white border border-white/20">
                  {record.inspectionCode}
                </span>
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-white backdrop-blur-md">
                  {typeConfig.icon} {typeConfig.label}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  record.status === 'PASSED'
                    ? 'bg-emerald-500/90 text-white'
                    : record.status === 'CONDITIONAL_PASS'
                    ? 'bg-amber-500/90 text-white'
                    : 'bg-rose-500/90 text-white'
                }`}>
                  {record.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {record.styleDescription || typeConfig.stageName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                Buyer: <span className="font-bold text-white">{record.buyer}</span> • Style: <span className="font-mono font-bold text-white">{record.styleNumber}</span>
                {record.orderNumber && (
                  <> • PO: <span className="font-mono text-white font-bold">{record.orderNumber}</span></>
                )}
              </p>
            </div>

            <div className="text-right sm:self-center bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
              <div className="text-[11px] text-white/80 font-medium">QC Pass Ratio</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {passRate}%
              </div>
              <div className="text-[10px] text-white/70">
                {record.passCount} of {record.sampleSize} sampled units
              </div>
            </div>
          </div>
        </div>

        {/* METRICS KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50">
          <div className="p-4">
            <div className="text-[11px] font-semibold text-slate-500">Sampled Pieces</div>
            <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
              {record.sampleSize.toLocaleString()} pcs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{record.aqlLevel || 'AQL 2.5 Level II'}</div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-semibold text-slate-500">Total Defect Count</div>
            <div className={`text-xl font-black font-mono mt-0.5 ${record.defectCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {record.defectCount} pcs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{defectRate}% defect rate</div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-semibold text-slate-500">Order & Lot Size</div>
            <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
              {(record.lotQuantity || record.orderQuantity || 10000).toLocaleString()} pcs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lot: {record.lotNumber}</div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-semibold text-slate-500">Packaging Status</div>
            <div className="text-xl font-black font-mono text-indigo-700 mt-0.5">
              {record.packedPercent !== undefined ? `${record.packedPercent}%` : inspectionType === 'FINAL' ? '100%' : '70%'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {record.cartonCount ? `${record.cartonCount} Master Cartons` : 'Polybagged & folded'}
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Audit Overview & Checklist' },
          { id: 'defects', label: `Defect Breakdown (${record.defects?.length || 0})` },
          { id: 'measurements', label: `Garment Measurements (${record.measurements?.length || 0})` },
          { id: 'checkpoints', label: `QC Specifications (${record.checkpoints?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Col: Type Specific Breakdown */}
            <div className="lg:col-span-2 space-y-5">
              {/* Type Specific Context Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeConfig.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{typeConfig.label} Specifications</h3>
                      <p className="text-[11px] text-slate-500">{typeConfig.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                    Stage: {record.stage}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Inspection Location</div>
                    <div className="font-bold text-slate-800 mt-0.5">{record.factoryUnit || 'Unit 01 (Dhaka Complex)'}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{record.sewingLine || 'Main Assembly Line'}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Auditor / Inspector</div>
                    <div className="font-bold text-slate-800 mt-0.5">{record.inspectorName}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">ID: {record.inspectorId}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Audit Date & Time</div>
                    <div className="font-bold text-slate-800 mt-0.5">{new Date(record.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>

                  {inspectionType === 'INLINE' && (
                    <>
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                        <div className="text-[10px] text-blue-600 font-semibold uppercase">Stitches Per Inch (SPI)</div>
                        <div className="font-bold text-blue-900 mt-0.5">11 – 12 SPI Calibrated</div>
                        <div className="text-[10px] text-blue-700 mt-0.5">Overlock & lockstitch checked</div>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                        <div className="text-[10px] text-blue-600 font-semibold uppercase">Needle Control</div>
                        <div className="font-bold text-blue-900 mt-0.5">9-Point Log Verified</div>
                        <div className="text-[10px] text-blue-700 mt-0.5">Zero broken needle slips</div>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                        <div className="text-[10px] text-blue-600 font-semibold uppercase">Workmanship Verdict</div>
                        <div className="font-bold text-blue-900 mt-0.5">Line in Regular Operation</div>
                        <div className="text-[10px] text-blue-700 mt-0.5">Next check: Hourly DHU log</div>
                      </div>
                    </>
                  )}

                  {inspectionType === 'PRE_FINAL' && (
                    <>
                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                        <div className="text-[10px] text-amber-700 font-semibold uppercase">Packed Percentage</div>
                        <div className="font-bold text-amber-900 mt-0.5">{record.packedPercent || 70}% Packed</div>
                        <div className="text-[10px] text-amber-700 mt-0.5">Target: min 50%–80% for Pre-Final</div>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                        <div className="text-[10px] text-amber-700 font-semibold uppercase">Carton Assortment</div>
                        <div className="font-bold text-amber-900 mt-0.5">Solid Size / Solid Color</div>
                        <div className="text-[10px] text-amber-700 mt-0.5">Ratio verified against PO pack sheet</div>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                        <div className="text-[10px] text-amber-700 font-semibold uppercase">Polybag Warning Check</div>
                        <div className="font-bold text-amber-900 mt-0.5">Suffocation Warning OK</div>
                        <div className="text-[10px] text-amber-700 mt-0.5">Ventilation holes standard</div>
                      </div>
                    </>
                  )}

                  {inspectionType === 'FINAL' && (
                    <>
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <div className="text-[10px] text-emerald-700 font-semibold uppercase">100% Metal Detection</div>
                        <div className="font-bold text-emerald-900 mt-0.5">Passed Calibration</div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">Fe 1.0mm, Non-Fe 1.2mm, SS 1.5mm</div>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <div className="text-[10px] text-emerald-700 font-semibold uppercase">ISTA 1A Carton Drop Test</div>
                        <div className="font-bold text-emerald-900 mt-0.5">10 Drops Completed</div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">1 Corner, 3 Edges, 6 Faces - No damage</div>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <div className="text-[10px] text-emerald-700 font-semibold uppercase">Barcode Scan Readability</div>
                        <div className="font-bold text-emerald-900 mt-0.5">100% Scan Pass Rate</div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">EAN / UPC code clear & scannable</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Remarks & Corrective Action (CAPA) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Inspector Verdict & Corrective Action Required (CAPA)
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Auditor Remarks:</span>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 leading-relaxed font-sans">
                      {record.remarks || 'Standard inspection audit completed. Results recorded according to international garments quality requirements.'}
                    </p>
                  </div>

                  {record.correctiveAction && (
                    <div>
                      <span className="font-bold text-rose-700 block mb-1">Mandatory Corrective Action:</span>
                      <p className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-900 leading-relaxed">
                        {record.correctiveAction}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Defect Severity Distribution & Verdict Donut */}
            <div className="space-y-5">
              {/* Defect Breakdown Cards */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Defect Classification (AQL 2.5)</span>
                </h3>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚨</span>
                      <div>
                        <div className="font-bold text-xs text-rose-900">Critical Defects</div>
                        <div className="text-[10px] text-rose-700">Immediate Lot Rejection (0 Allowed)</div>
                      </div>
                    </div>
                    <span className="text-xl font-black font-mono text-rose-700">{record.criticalDefects}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <div>
                        <div className="font-bold text-xs text-amber-900">Major Defects</div>
                        <div className="text-[10px] text-amber-700">Functional / Appearance flaws</div>
                      </div>
                    </div>
                    <span className="text-xl font-black font-mono text-amber-700">{record.majorDefects}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-base">ℹ️</span>
                      <div>
                        <div className="font-bold text-xs text-slate-800">Minor Defects</div>
                        <div className="text-[10px] text-slate-500">Cosmetic trimming / loose thread</div>
                      </div>
                    </div>
                    <span className="text-xl font-black font-mono text-slate-700">{record.minorDefects}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Defective Pcs:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {record.defectCount} pcs ({defectRate}%)
                  </span>
                </div>
              </div>

              {/* Quick Summary of individual defects */}
              {record.defects && record.defects.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Identified Defects</h4>
                    <button
                      onClick={() => setActiveTab('defects')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {record.defects.slice(0, 3).map((d) => (
                      <div key={d.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900 truncate">{d.defectType}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              d.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : d.severity === 'MAJOR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {d.severity}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex justify-between">
                          <span>Loc: {d.location}</span>
                          <span className="font-mono font-bold text-slate-700">{d.count} pcs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DEFECTS MATRIX */}
      {activeTab === 'defects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Garment Defects Registry</h3>
              <p className="text-xs text-slate-500">Itemized defect instances logged during sampling</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {record.defects?.length || 0} Defect Types Logged
            </span>
          </div>

          {record.defects && record.defects.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {record.defects.map((d, index) => (
                <div key={d.id || index} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        d.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : d.severity === 'MAJOR'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {d.severity}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{d.defectType}</div>
                      <div className="text-xs text-slate-500">Location on garment: <span className="font-semibold text-slate-700">{d.location}</span></div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black font-mono text-slate-900">{d.count} pcs</span>
                    <span className="block text-[10px] text-slate-400">
                      {(((d.count || 1) / record.sampleSize) * 100).toFixed(1)}% of sample
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              <span>Zero defects recorded during this quality audit.</span>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MEASUREMENTS AUDIT */}
      {activeTab === 'measurements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Garment Dimension & Specification Verification</h3>
              <p className="text-xs text-slate-500">Spec measurement sheets compared against audited garments (inches / cm)</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {record.measurements?.length || 0} Points Measured
            </span>
          </div>

          {record.measurements && record.measurements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Point of Measure</th>
                    <th className="p-3.5 text-right font-mono">Tech Pack Spec</th>
                    <th className="p-3.5 text-right font-mono">Actual Sample</th>
                    <th className="p-3.5 text-center">Tolerance Allowed</th>
                    <th className="p-3.5 text-right font-mono">Deviation</th>
                    <th className="p-3.5 text-center">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.measurements.map((m, idx) => {
                    const dev = (m.actual - m.spec).toFixed(2);
                    const devNum = parseFloat(dev);
                    return (
                      <tr key={m.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-800">{m.point}</td>
                        <td className="p-3.5 text-right font-mono text-slate-700">{m.spec.toFixed(1)}"</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">{m.actual.toFixed(1)}"</td>
                        <td className="p-3.5 text-center font-mono text-slate-500">{m.tol}</td>
                        <td className={`p-3.5 text-right font-mono font-bold ${devNum > 0 ? 'text-blue-600' : devNum < 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {devNum > 0 ? `+${dev}"` : `${dev}"`}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.result === 'PASS'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {m.result}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Sliders className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <span>No measurement audit table logged for this audit.</span>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CHECKPOINTS */}
      {activeTab === 'checkpoints' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mandatory QC Checkpoint Checklist</h3>
              <p className="text-xs text-slate-500">Fabric, trims, workmanship, needle detection, and packaging verifications</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {record.checkpoints?.length || 0} Checkpoints
            </span>
          </div>

          {record.checkpoints && record.checkpoints.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {record.checkpoints.map((c, idx) => (
                <div key={c.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {c.category}
                    </span>
                    <div className="text-sm font-bold text-slate-900 mt-1">{c.checkpoint}</div>
                    {c.notes && <div className="text-xs text-rose-600 mt-0.5">Note: {c.notes}</div>}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                      c.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : c.status === 'FAIL'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {c.status === 'PASS' ? '✓ Pass' : c.status === 'FAIL' ? '✗ Fail' : '~ N/A'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <span>Standard audit checkpoints were approved during line inspection.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
