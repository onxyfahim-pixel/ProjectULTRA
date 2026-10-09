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
  Scale,
  TrendingUp,
  TrendingDown,
  FileDown,
} from 'lucide-react';
import { InspectionRecord, InspectionType, InspectionStatus, InspectionStage } from '@/lib/types/erp';
import { calculateAqlInspection, calculateQuantityVariance } from '@/lib/aql';
import { syncRecordCheckpoints } from './inspection-checkpoints';
import { useModulePermission } from '@/hooks/use-module-permission';
import { InspectionSizeBreakdownSection } from './InspectionSizeBreakdownSection';
import { deriveSizeBreakdownFromBuyerOrder } from './inspection-size-utils';

interface InspectionDetailsPageProps {
  record: InspectionRecord;
  allRecords?: InspectionRecord[];
  onBack: () => void;
  onEdit: (record: InspectionRecord) => void;
  onDuplicate: (record: InspectionRecord) => void;
  onDelete: (record: InspectionRecord) => void;
  onExport?: (record: InspectionRecord) => void;
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
  onExport,
  onSelectRecord,
  showToast,
}: InspectionDetailsPageProps) {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('inspections');
  const [activeTab, setActiveTab] = useState<'overview' | 'sizes' | 'defects' | 'checkpoints'>('overview');
  const syncedCheckpoints = syncRecordCheckpoints(record.checkpoints);
  const checkpointsPassedCount = syncedCheckpoints.filter((c) => c.status === 'PASS').length;

  const sizeBreakdown = React.useMemo(() => {
    if (record.sizeBreakdown && record.sizeBreakdown.length > 0) {
      return record.sizeBreakdown;
    }
    return deriveSizeBreakdownFromBuyerOrder(
      null,
      record.lotQuantity || record.orderQuantity || 10000,
      record.sampleSize || 315
    );
  }, [record]);

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

  const orderQty = record.orderQuantity || 10000;
  const inspQty = record.lotQuantity || record.orderQuantity || 10000;
  const variance = calculateQuantityVariance(orderQty, inspQty);
  const aqlDetails = calculateAqlInspection(inspQty);
  const maxMajor = record.maxAllowedMajor !== undefined ? record.maxAllowedMajor : aqlDetails.majorAc;
  const reMajor = record.majorRejectionPoint !== undefined ? record.majorRejectionPoint : aqlDetails.majorRe;
  const maxMinor = record.maxAllowedMinor !== undefined ? record.maxAllowedMinor : aqlDetails.minorAc;
  const reMinor = record.minorRejectionPoint !== undefined ? record.minorRejectionPoint : aqlDetails.minorRe;
  const codeLetter = record.aqlCodeLetter || aqlDetails.codeLetter;

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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 xl:p-8 animate-in fade-in duration-150">
      <div className="w-full max-w-[1920px] mx-auto space-y-3.5 pb-20">
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
          {canExport && onExport && (
            <button
              type="button"
              onClick={() => onExport(record)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
              title="Export AQL Inspection Report (PDF or Excel)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Certificate</span>
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={() => onDuplicate(record)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
              title="Duplicate as new audit template"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplicate Audit</span>
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
              title="Edit this inspection record"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Inspection</span>
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(record)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
              title="Delete this audit record"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
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
                {record.isCombinedInspection || (record.poNumbers && record.poNumbers.length > 1) ? (
                  <>
                    {' '}•{' '}
                    <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-white font-bold backdrop-blur-md">
                      ⚡ Combined Inspection ({record.poNumbers?.length || record.combinedOrders?.length || record.orderNumber?.split(',').length} POs)
                    </span>
                  </>
                ) : record.orderNumber ? (
                  <> • PO: <span className="font-mono text-white font-bold">{record.orderNumber}</span></>
                ) : null}
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

        {/* METRICS KPI STRIP - 5 ENHANCED METRICS INCLUDING ORDER VS INSPECTED VARIANCE */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50">
          <div className="p-4">
            <div className="text-[11px] font-semibold text-slate-500">Sampled Pieces</div>
            <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
              {record.sampleSize.toLocaleString()} pcs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">ISO 2859-1 • Code {codeLetter}</div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-semibold text-slate-500">Total Defect Count</div>
            <div className={`text-xl font-black font-mono mt-0.5 ${record.defectCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {record.defectCount} pcs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{defectRate}% defect rate</div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Order Quantity</span>
              <span className="text-[9px] font-bold font-mono px-1 rounded bg-blue-50 text-blue-700">Auto</span>
            </div>
            <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
              {orderQty.toLocaleString()} pcs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {record.isCombinedInspection ? `${record.combinedOrders?.length || record.poNumbers?.length || 1} POs combined` : `Target order size`}
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-semibold text-blue-900 flex items-center justify-between">
              <span>Inspected Lot</span>
              <span className="text-[9px] font-bold font-mono px-1 rounded bg-amber-50 text-amber-700">Manual</span>
            </div>
            <div className="text-xl font-black font-mono text-blue-700 mt-0.5">
              {inspQty.toLocaleString()} pcs
            </div>
            <div className="mt-1">
              {variance.isExcess && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  +{variance.excessQty.toLocaleString()} pcs (+{variance.percentage}% Excess)
                </span>
              )}
              {variance.isShort && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  -{variance.shortQty.toLocaleString()} pcs ({variance.percentage}% Short)
                </span>
              )}
              {variance.isExact && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Exact Match (0 Variance)
                </span>
              )}
            </div>
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
          { id: 'overview', label: 'Audit Overview' },
          { id: 'sizes', label: `Size Breakdown (${sizeBreakdown.length} Sizes)` },
          { id: 'defects', label: `Defect Breakdown (${record.defects?.length || 0})` },
          { id: 'checkpoints', label: `Inspection Checkpoints (${checkpointsPassedCount}/${syncedCheckpoints.length} ✓)` },
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

              {/* COMBINED PURCHASE ORDERS CARD (WHEN COMBINED INSPECTION IS ACTIVE) */}
              {(record.isCombinedInspection || (record.poNumbers && record.poNumbers.length > 1) || (record.combinedOrders && record.combinedOrders.length > 0) || (record.orderNumber && record.orderNumber.includes(','))) && (
                <div className="bg-white p-5 rounded-2xl border border-indigo-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Combined Purchase Orders Breakdown
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          This inspection covers multiple buyer purchase orders audited together as a single unified lot.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                      ⚡ Combined Lot ({record.combinedOrders?.length || record.poNumbers?.length || record.orderNumber?.split(',').length} POs)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">PO Number</th>
                          <th className="py-2 px-3">Style Reference</th>
                          <th className="py-2 px-3">Order Qty</th>
                          <th className="py-2 px-3">Cartons</th>
                          <th className="py-2 px-3">Destination / Split</th>
                          <th className="py-2 px-3 text-right">Lot Share %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {record.combinedOrders && record.combinedOrders.length > 0
                          ? record.combinedOrders.map((po, idx) => {
                              const share = record.orderQuantity
                                ? ((po.orderQuantity / record.orderQuantity) * 100).toFixed(1)
                                : '—';
                              return (
                                <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                  <td className="py-2 px-3 font-bold text-slate-400">{idx + 1}</td>
                                  <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                                    {po.poNumber}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-slate-700">
                                    {po.styleNumber || record.styleNumber}
                                  </td>
                                  <td className="py-2 px-3 font-bold text-slate-900 font-mono">
                                    {po.orderQuantity.toLocaleString()} pcs
                                  </td>
                                  <td className="py-2 px-3 font-mono text-slate-700">
                                    {po.cartonCount ? `${po.cartonCount} boxes` : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">
                                    {po.colorOrDestination || 'Main Destination'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                                    {share}%
                                  </td>
                                </tr>
                              );
                            })
                          : (record.poNumbers || record.orderNumber?.split(', ') || []).map((po, idx) => (
                              <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="py-2 px-3 font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                                  {po.trim()}
                                </td>
                                <td className="py-2 px-3 font-mono text-slate-700">{record.styleNumber}</td>
                                <td className="py-2 px-3 font-mono text-slate-900">
                                  Combined in lot
                                </td>
                                <td className="py-2 px-3 font-mono text-slate-700">—</td>
                                <td className="py-2 px-3 text-slate-600">Combined PO Split</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">—</td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SIZE BREAKDOWN & SAMPLE PICKUP SPECIFICATION */}
              <InspectionSizeBreakdownSection
                items={sizeBreakdown}
                totalSampleSize={record.sampleSize || 315}
                readOnly={true}
              />

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
              {/* QUANTITY VARIANCE SUMMARY CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>Order vs Inspected Variance</span>
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${variance.badgeCls}`}>
                    {variance.isExcess ? 'Excess' : variance.isShort ? 'Shortage' : 'Balanced'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Order (Auto)</div>
                    <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                      {orderQty.toLocaleString()} pcs
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="text-[10px] text-blue-700 font-bold uppercase">Inspected Lot (Manual)</div>
                    <div className="text-base font-black font-mono text-blue-700 mt-0.5">
                      {inspQty.toLocaleString()} pcs
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border text-xs ${variance.badgeCls}`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Net Quantity Variance:</span>
                    <span className="font-mono text-sm">
                      {variance.isExcess && `+${variance.excessQty.toLocaleString()} pcs`}
                      {variance.isShort && `-${variance.shortQty.toLocaleString()} pcs`}
                      {variance.isExact && '0 pcs'}
                    </span>
                  </div>
                  <div className="text-[10px] mt-1 font-medium">
                    {variance.isExcess && `Overproduction rate of +${variance.percentage}% presented for quality inspection.`}
                    {variance.isShort && `Short shipment rate of ${variance.percentage}% below purchase order size.`}
                    {variance.isExact && 'Offered inspection lot quantity exactly matches total purchase order.'}
                  </div>
                </div>
              </div>

              {/* Defect Breakdown Cards with AQL Allowance */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>AQL Defect Tolerances (Code {codeLetter})</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Sample: {record.sampleSize} pcs
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Critical */}
                  <div className={`p-3 rounded-xl border ${record.criticalDefects > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚨</span>
                        <div>
                          <div className="font-bold text-xs text-rose-900">Critical Defects</div>
                          <div className="text-[10px] text-slate-500">Max Allowed: 0 (Re: 1)</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black font-mono text-rose-700">{record.criticalDefects}</span>
                        <span className={`block text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 ${record.criticalDefects > 0 ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'}`}>
                          {record.criticalDefects > 0 ? 'REJECT' : 'PASS'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Major */}
                  <div className={`p-3 rounded-xl border ${record.majorDefects >= reMajor ? 'bg-rose-50 border-rose-200' : record.majorDefects === maxMajor ? 'bg-amber-50 border-amber-200' : 'bg-amber-50/40 border-amber-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚠️</span>
                        <div>
                          <div className="font-bold text-xs text-amber-900">Major Defects</div>
                          <div className="text-[10px] text-slate-600">
                            Max Allowed (Ac): <strong className="text-emerald-700">{maxMajor}</strong> • Re: <strong className="text-rose-700">{reMajor}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black font-mono text-amber-700">{record.majorDefects}</span>
                        <span className={`block text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 ${record.majorDefects >= reMajor ? 'bg-rose-200 text-rose-900' : record.majorDefects === maxMajor ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                          {record.majorDefects >= reMajor ? 'EXCEEDED' : record.majorDefects === maxMajor ? 'AT LIMIT' : 'WITHIN TOLERANCE'}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1 mt-2 overflow-hidden">
                      <div
                        className={`h-1 rounded-full ${record.majorDefects >= reMajor ? 'bg-rose-600' : record.majorDefects >= maxMajor * 0.7 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                        style={{ width: `${Math.min(100, (record.majorDefects / Math.max(1, reMajor)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Minor */}
                  <div className={`p-3 rounded-xl border ${record.minorDefects >= reMinor ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">ℹ️</span>
                        <div>
                          <div className="font-bold text-xs text-slate-800">Minor Defects</div>
                          <div className="text-[10px] text-slate-500">
                            Max Allowed (Ac): <strong className="text-emerald-700">{maxMinor}</strong> • Re: <strong className="text-rose-700">{reMinor}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black font-mono text-slate-700">{record.minorDefects}</span>
                        <span className={`block text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 ${record.minorDefects >= reMinor ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'}`}>
                          {record.minorDefects >= reMinor ? 'EXCEEDED' : 'WITHIN TOLERANCE'}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1 mt-2 overflow-hidden">
                      <div
                        className={`h-1 rounded-full ${record.minorDefects >= reMinor ? 'bg-rose-600' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(100, (record.minorDefects / Math.max(1, reMinor)) * 100)}%` }}
                      />
                    </div>
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

      {/* TAB CONTENT: SIZES MATRIX */}
      {activeTab === 'sizes' && (
        <div className="space-y-4">
          <InspectionSizeBreakdownSection
            items={sizeBreakdown}
            totalSampleSize={record.sampleSize || 315}
            readOnly={true}
          />
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

      {/* TAB CONTENT: CHECKPOINTS AUDIT (11 STANDARD VERIFICATION POINTS WITH TIK MARK) */}
      {activeTab === 'checkpoints' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Inspection Checkpoints Verification Checklist</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard 11 Verification Points: Workmanship, Styling, Safety Check, Cross Check Carton Mark, Sticker Mark, Accessories, BOM, Measurement, Test Record, PP Sample, Working Environment
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                {checkpointsPassedCount} of {syncedCheckpoints.length} Verified OK
              </span>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {syncedCheckpoints.map((c, idx) => {
                const isPass = c.status === 'PASS';
                return (
                  <div
                    key={c.id || idx}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isPass
                        ? 'bg-emerald-50/40 border-emerald-200/90'
                        : 'bg-rose-50/40 border-rose-200/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                          isPass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block leading-tight truncate">
                          {c.checkpoint}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                          {c.category}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border shadow-2xs ${
                          isPass
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {isPass ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>✓ Tik OK</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>✗ Issue</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
