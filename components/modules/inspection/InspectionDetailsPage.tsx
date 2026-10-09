'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Camera,
  Smartphone,
  Eye,
  PenTool,
  Award,
  CheckSquare,
  X,
  ExternalLink,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import {
  InspectionRecord,
  InspectionType,
  InspectionStatus,
  InspectionStage,
  InspectionPhotoEvidence,
  InspectionTestRecord,
  InspectionCompliancePhoto,
  PackingZeroToleranceItem,
} from '@/lib/types/erp';
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

type DetailsTab =
  | 'overview'
  | 'photos'
  | 'tests'
  | 'packing'
  | 'defects'
  | 'sizes'
  | 'measurements'
  | 'checkpoints'
  | 'signatures';

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

// Safe accessors for flexible image/evidence fields
function getPhotoUrl(p: any): string {
  if (!p) return '';
  return p.photoUrl || p.url || '';
}

function getPhotoRemark(p: any): string {
  if (!p) return '';
  return p.remark || p.caption || '';
}

function getPhotoTime(p: any): string {
  if (!p) return '';
  const t = p.capturedAt || p.timestamp;
  return t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

function getTestPass(t: any): boolean {
  if (!t) return false;
  return t.result === 'PASS' || t.status === 'PASS';
}

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
  const [activeTab, setActiveTab] = useState<DetailsTab>('overview');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [complianceFilter, setComplianceFilter] = useState<string>('ALL');

  const syncedCheckpoints = syncRecordCheckpoints(record.checkpoints);
  const checkpointsPassedCount = syncedCheckpoints.filter((c) => c.status === 'PASS').length;

  const sizeBreakdown = useMemo(() => {
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

  // Evidence collections with safe defaults
  const poSheetPhotos: InspectionPhotoEvidence[] = record.poSheetPhotos || [];
  const sampleCartonPhotos: InspectionPhotoEvidence[] = record.sampleCartonPhotos || [];
  const testRecords: InspectionTestRecord[] = record.testRecords || [];
  const compliancePhotos: InspectionCompliancePhoto[] = record.compliancePhotos || [];
  const zeroToleranceChecks: PackingZeroToleranceItem[] = record.packingZeroToleranceChecks || [];
  const measurementPhotos: InspectionPhotoEvidence[] = record.measurementSheetPhotos || [];

  const totalPhotosCount =
    poSheetPhotos.length +
    sampleCartonPhotos.length +
    compliancePhotos.length +
    measurementPhotos.length;

  const zeroToleranceFailedItem = zeroToleranceChecks.find(
    (z) => z.hasDefect || z.isPass === false || (z.defectCount !== undefined && z.defectCount > 0)
  );
  const hasZeroToleranceFail = record.hasZeroToleranceFail || Boolean(zeroToleranceFailedItem);

  // Filter compliance gallery
  const filteredCompliancePhotos = useMemo(() => {
    if (complianceFilter === 'ALL') return compliancePhotos;
    return compliancePhotos.filter((p) => p.category === complianceFilter);
  }, [compliancePhotos, complianceFilter]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, lightboxImage]);

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 xl:p-8 animate-in fade-in duration-150">
      <div className="w-full max-w-[1920px] mx-auto space-y-3.5 pb-20">
        {/* Top Navigation Bar */}
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
                {/* Mobile Entry Badge */}
                {record.isMobileEntry && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    <Smartphone className="w-3 h-3" />
                    <span>Mobile Entry</span>
                  </span>
                )}
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

          {/* Action Buttons */}
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

        {/* 0-TOLERANCE CRITICAL DEFECT WARNING BANNER */}
        {hasZeroToleranceFail && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-sm flex items-start gap-3.5 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                  Critical Zero-Tolerance Breach
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono">
                  AUTO REJECTED
                </span>
              </div>
              <h4 className="text-sm font-bold text-rose-950 mt-0.5">
                {zeroToleranceFailedItem
                  ? `Critical Non-Compliance: ${zeroToleranceFailedItem.name}${zeroToleranceFailedItem.defectCount ? ` (${zeroToleranceFailedItem.defectCount} defect(s))` : ''}`
                  : 'Inspection lot automatically failed due to Zero-Tolerance packing defect violation.'}
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                According to international buyer standards (AQL Level II), zero-tolerance defects (mold, live insects, broken needle, wrong barcode, wet garments, or sharp hazard) cause immediate shipment block regardless of other sample scores.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('packing')}
              className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-white border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
            >
              View 0-Tolerance Check →
            </button>
          </div>
        )}

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

        {/* HERO CARD */}
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
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      record.status === 'PASSED'
                        ? 'bg-emerald-500/90 text-white'
                        : record.status === 'CONDITIONAL_PASS'
                        ? 'bg-amber-500/90 text-white'
                        : 'bg-rose-500/90 text-white'
                    }`}
                  >
                    {record.status.replace('_', ' ')}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {record.styleDescription || typeConfig.stageName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 font-medium">
                  Buyer: <span className="font-bold text-white">{record.buyer}</span> • Style:{' '}
                  <span className="font-mono font-bold text-white">{record.styleNumber}</span>
                  {record.orderNumber && (
                    <>
                      {' '}• PO: <span className="font-mono text-white font-bold">{record.orderNumber}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="text-right sm:self-center bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                <div className="text-[11px] text-white/80 font-medium">QC Pass Ratio</div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white">{passRate}%</div>
                <div className="text-[10px] text-white/70">
                  {record.passCount} of {record.sampleSize} sampled units
                </div>
              </div>
            </div>
          </div>

          {/* METRICS KPI STRIP */}
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
              <div
                className={`text-xl font-black font-mono mt-0.5 ${
                  record.defectCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {record.defectCount} pcs
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{defectRate}% defect rate</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-semibold text-slate-500">Major / Critical</div>
              <div className="text-xl font-black font-mono mt-0.5">
                <span className={record.majorDefects > maxMajor ? 'text-rose-600' : 'text-slate-900'}>
                  {record.majorDefects}
                </span>
                <span className="text-slate-400 text-xs"> / {maxMajor} Ac</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Rejection: ≥{reMajor}</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-semibold text-slate-500">Minor Defect Allowed</div>
              <div className="text-xl font-black font-mono mt-0.5">
                <span className={record.minorDefects > maxMinor ? 'text-rose-600' : 'text-slate-900'}>
                  {record.minorDefects}
                </span>
                <span className="text-slate-400 text-xs"> / {maxMinor} Ac</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Rejection: ≥{reMinor}</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-semibold text-slate-500">Offered vs PO Qty</div>
              <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                {inspQty.toLocaleString()} pcs
              </div>
              <div
                className={`text-[10px] font-bold mt-0.5 ${
                  variance.diff > 0
                    ? 'text-emerald-600'
                    : variance.diff < 0
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {variance.label} ({variance.diff > 0 ? `+${variance.diff}` : variance.diff} pcs)
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS WITH RICH COUNTERS */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview' as DetailsTab, label: 'Audit Overview' },
            {
              id: 'photos' as DetailsTab,
              label: `Visual Evidences (${totalPhotosCount})`,
              badge: totalPhotosCount > 0 ? 'Camera' : undefined,
            },
            {
              id: 'tests' as DetailsTab,
              label: `On-Site Tests (${testRecords.length})`,
              alert: testRecords.some((t) => !getTestPass(t)),
            },
            {
              id: 'packing' as DetailsTab,
              label: '0-Tolerance Packing Check',
              alert: hasZeroToleranceFail,
            },
            {
              id: 'defects' as DetailsTab,
              label: `Defects & AQL (${record.defects?.length || 0})`,
              badge: record.defectCount > 0 ? `${record.defectCount} pcs` : undefined,
            },
            { id: 'sizes' as DetailsTab, label: `Size Breakdown (${sizeBreakdown.length})` },
            {
              id: 'measurements' as DetailsTab,
              label: `Measurement Sheet (${measurementPhotos.length})`,
            },
            {
              id: 'checkpoints' as DetailsTab,
              label: `11 Checkpoints (${checkpointsPassedCount}/${syncedCheckpoints.length} ✓)`,
            },
            {
              id: 'signatures' as DetailsTab,
              label: 'Dual Signatures & Authorization',
              badge: record.inspectorSignature && record.representativeSignature ? 'Signed' : undefined,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                {tab.badge && !tab.alert && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-100 text-blue-700">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Col: Type Specific Breakdown */}
              <div className="lg:col-span-2 space-y-5">
                {/* Audit Context Details Card */}
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
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Lead Inspector</div>
                      <div className="font-bold text-slate-800 mt-0.5">{record.inspectorName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ID: {record.inspectorId}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Factory Representative</div>
                      <div className="font-bold text-slate-800 mt-0.5">{record.representativeName || 'Factory QA Manager'}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Signed: {record.representativeSignature ? 'Yes' : 'Pending'}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Audit Date & Time</div>
                      <div className="font-bold text-slate-800 mt-0.5">{new Date(record.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Packing Condition</div>
                      <div className="font-bold text-slate-800 mt-0.5">{record.packedPercent || 100}% Packed</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{record.cartonCount || Math.ceil(inspQty / 24)} Cartons</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">AQL Sampling Standard</div>
                      <div className="font-bold text-slate-800 mt-0.5">ISO 2859-1 Level II</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Normal Single Sampling</div>
                    </div>
                  </div>
                </div>

                {/* Evidence Quick Photo Gallery Strip */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-purple-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Audit Photos & Evidence Snapshots ({totalPhotosCount} Files)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('photos')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View All in Gallery →
                    </button>
                  </div>

                  {totalPhotosCount > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {/* PO Sheet Preview */}
                      {poSheetPhotos.slice(0, 2).map((p, idx) => {
                        const url = getPhotoUrl(p);
                        const remark = getPhotoRemark(p);
                        return (
                          <div
                            key={`po-${idx}`}
                            onClick={() => setLightboxImage({ url, title: 'PO Sheet Evidence', subtitle: remark })}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:shadow-md transition-all"
                          >
                            <img src={url} alt="PO Sheet" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-1.5">
                              <span className="text-[9px] font-bold text-white block truncate">PO Sheet</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Sample Carton Preview */}
                      {sampleCartonPhotos.slice(0, 2).map((p, idx) => {
                        const url = getPhotoUrl(p);
                        const remark = getPhotoRemark(p);
                        return (
                          <div
                            key={`carton-${idx}`}
                            onClick={() => setLightboxImage({ url, title: 'Sample Carton Evidence', subtitle: remark })}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:shadow-md transition-all"
                          >
                            <img src={url} alt="Sample Carton" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-1.5">
                              <span className="text-[9px] font-bold text-white block truncate">Carton Pickup</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Compliance Photos Preview */}
                      {compliancePhotos.slice(0, 4).map((p, idx) => {
                        const url = getPhotoUrl(p);
                        const title = p.categoryTitle || p.categoryLabel || p.category;
                        return (
                          <div
                            key={`comp-${idx}`}
                            onClick={() => setLightboxImage({ url, title, subtitle: p.remark })}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:shadow-md transition-all"
                          >
                            <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-1.5">
                              <span className="text-[9px] font-bold text-white block truncate">{title}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                      <Camera className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <span>No photos attached to this audit report.</span>
                    </div>
                  )}
                </div>

                {/* Combined PO Details Card if applicable */}
                {(record.isCombinedInspection || (record.poNumbers && record.poNumbers.length > 1)) && (
                  <div className="bg-white p-5 rounded-2xl border border-indigo-200/90 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Combined Purchase Orders Breakdown
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            This audit covers multiple buyer purchase orders combined into a unified sample.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                        ⚡ {record.poNumbers?.length || 1} POs Combined
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {record.poNumbers?.map((po, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-mono font-bold text-slate-800">{po}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Col: Summary Sidebars */}
              <div className="space-y-5">
                {/* Test Records Status Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <span>On-Site Test Records</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tests')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Details →
                    </button>
                  </div>

                  {testRecords.length > 0 ? (
                    <div className="space-y-2">
                      {testRecords.map((t, idx) => {
                        const isPass = getTestPass(t);
                        return (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-800 block">{t.testName}</span>
                              <span className="text-[10px] text-slate-400">{t.value || t.remark || (isPass ? 'Meets Spec' : 'Failed')}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isPass ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 py-3 text-center">
                      Physical test records completed with normal standards.
                    </div>
                  )}
                </div>

                {/* 0-Tolerance Check Status Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>0-Tolerance Packing Check</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('packing')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Audit View →
                    </button>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    hasZeroToleranceFail ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div>
                      <span className={`text-xs font-bold block ${hasZeroToleranceFail ? 'text-rose-900' : 'text-emerald-900'}`}>
                        {hasZeroToleranceFail ? 'Critical Failure Detected' : 'All 0-Tolerance Checks Passed'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {hasZeroToleranceFail ? 'Mold / Needle / Insect violation' : '6 Critical parameters 100% clear'}
                      </span>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      hasZeroToleranceFail ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {hasZeroToleranceFail ? 'FAILED' : 'CLEARED'}
                    </span>
                  </div>
                </div>

                {/* Dual Signatures Preview Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-purple-600" />
                      <span>Signatures & Verification</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('signatures')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View Pads →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Inspector Sign</div>
                      {record.inspectorSignature ? (
                        <div className="h-10 my-1 flex items-center justify-center">
                          <img src={record.inspectorSignature} alt="Inspector Signature" className="max-h-10 max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="h-10 my-1 flex items-center justify-center text-[10px] text-slate-400 italic">
                          Electronic Sign
                        </div>
                      )}
                      <span className="font-bold text-slate-800 truncate block text-[11px]">{record.inspectorName}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Factory Rep Sign</div>
                      {record.representativeSignature ? (
                        <div className="h-10 my-1 flex items-center justify-center">
                          <img src={record.representativeSignature} alt="Rep Signature" className="max-h-10 max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="h-10 my-1 flex items-center justify-center text-[10px] text-slate-400 italic">
                          Pending Pad
                        </div>
                      )}
                      <span className="font-bold text-slate-800 truncate block text-[11px]">{record.representativeName || 'Factory Representative'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL & COMPLIANCE GALLERY */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'ALL', label: `All Photos (${totalPhotosCount})` },
                { id: 'po_sheet', label: `PO Sheets (${poSheetPhotos.length})` },
                { id: 'sample_carton', label: `Cartons (${sampleCartonPhotos.length})` },
                { id: 'carton_exterior', label: 'Carton Exterior' },
                { id: 'shipping_mark_sticker', label: 'Stickers' },
                { id: 'trims_accessories', label: 'Accessories' },
                { id: 'product_front_back', label: 'Front & Back View' },
                { id: 'ratio_folding', label: 'Ratio & Folding' },
                { id: 'care_brand_labels', label: 'Labels' },
                { id: 'polybag_hangers', label: 'Poly & Hanger' },
                { id: 'measurement', label: `Measurements (${measurementPhotos.length})` },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setComplianceFilter(cat.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    complianceFilter === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {/* PO Sheet Photos */}
              {(complianceFilter === 'ALL' || complianceFilter === 'po_sheet') &&
                poSheetPhotos.map((p, idx) => {
                  const url = getPhotoUrl(p);
                  const remark = getPhotoRemark(p);
                  const time = getPhotoTime(p);
                  return (
                    <div
                      key={`po-card-${idx}`}
                      onClick={() => setLightboxImage({ url, title: 'PO Sheet Attachment', subtitle: remark })}
                      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        <img src={url} alt="PO Sheet" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white shadow-sm">
                          PO Sheet
                        </span>
                      </div>
                      <div className="p-3 text-xs">
                        <p className="font-semibold text-slate-800 line-clamp-2">{remark || 'PO Master Sheet verification photo'}</p>
                        {time && <span className="text-[10px] text-slate-400 mt-1 block">{time}</span>}
                      </div>
                    </div>
                  );
                })}

              {/* Sample Carton Photos */}
              {(complianceFilter === 'ALL' || complianceFilter === 'sample_carton') &&
                sampleCartonPhotos.map((p, idx) => {
                  const url = getPhotoUrl(p);
                  const remark = getPhotoRemark(p);
                  const time = getPhotoTime(p);
                  return (
                    <div
                      key={`carton-card-${idx}`}
                      onClick={() => setLightboxImage({ url, title: 'Sample Carton Attachment', subtitle: remark })}
                      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        <img src={url} alt="Sample Carton" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-600 text-white shadow-sm">
                          Carton Pickup
                        </span>
                      </div>
                      <div className="p-3 text-xs">
                        <p className="font-semibold text-slate-800 line-clamp-2">{remark || 'Sample carton selection & seal evidence'}</p>
                        {time && <span className="text-[10px] text-slate-400 mt-1 block">{time}</span>}
                      </div>
                    </div>
                  );
                })}

              {/* Compliance Category Photos */}
              {filteredCompliancePhotos.map((p, idx) => {
                const url = getPhotoUrl(p);
                const title = p.categoryTitle || p.categoryLabel || p.category;
                const time = getPhotoTime(p);
                return (
                  <div
                    key={`comp-card-${idx}`}
                    onClick={() => setLightboxImage({ url, title, subtitle: p.remark })}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                      <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-600 text-white shadow-sm">
                        {title}
                      </span>
                    </div>
                    <div className="p-3 text-xs">
                      <p className="font-semibold text-slate-800 line-clamp-2">{p.remark || 'Compliance evidence picture'}</p>
                      {time && <span className="text-[10px] text-slate-400 mt-1 block">{time}</span>}
                    </div>
                  </div>
                );
              })}

              {/* Measurement Photos */}
              {(complianceFilter === 'ALL' || complianceFilter === 'measurement') &&
                measurementPhotos.map((p, idx) => {
                  const url = getPhotoUrl(p);
                  const remark = getPhotoRemark(p);
                  const time = getPhotoTime(p);
                  return (
                    <div
                      key={`meas-card-${idx}`}
                      onClick={() => setLightboxImage({ url, title: 'Measurement Spec Sheet', subtitle: remark })}
                      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        <img src={url} alt="Measurement Spec" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-600 text-white shadow-sm">
                          Measurement Sheet
                        </span>
                      </div>
                      <div className="p-3 text-xs">
                        <p className="font-semibold text-slate-800 line-clamp-2">{remark || 'Garment measurement points & grading table'}</p>
                        {time && <span className="text-[10px] text-slate-400 mt-1 block">{time}</span>}
                      </div>
                    </div>
                  );
                })}
            </div>

            {totalPhotosCount === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>No captured photos found for this inspection audit.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ON-SITE TEST RECORDS */}
        {activeTab === 'tests' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>On-Site Physical Test Records &amp; Performance Audits</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mandatory on-site quality tests including Barcode scanner readability, ISTA 1A drop test, 100% metal detection, fabric GSM, and seam pull tests.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {testRecords.length} Tests Logged
              </span>
            </div>

            {testRecords.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {testRecords.map((t, idx) => {
                  const isPass = getTestPass(t);
                  const testPhotos = t.photos || (t.photoUrl ? [t.photoUrl] : []);
                  return (
                    <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isPass ? '✓' : '✗'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{t.testName}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isPass ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          {(t.value || t.remark) && (
                            <p className="text-xs font-semibold text-slate-700 mt-1">
                              Specification / Measured Value: <span className="font-mono text-blue-700">{t.value || t.remark}</span>
                            </p>
                          )}
                          {(t.notes || t.remark) && <p className="text-xs text-slate-500 mt-0.5">Notes: {t.notes || t.remark}</p>}
                        </div>
                      </div>

                      {/* Attached Test Evidence Photos */}
                      {testPhotos.length > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                          {testPhotos.map((url: string, pIdx: number) => (
                            <div
                              key={pIdx}
                              onClick={() => setLightboxImage({ url, title: `${t.testName} Evidence` })}
                              className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-all shrink-0 bg-slate-100"
                            >
                              <img src={url} alt="Test evidence" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                <CheckSquare className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                <span>No physical test records registered for this audit.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PACKING 0-TOLERANCE CHECK */}
        {activeTab === 'packing' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Packing Check &amp; 0-Tolerance Critical Defects Verification</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Strict zero-tolerance parameters: Mold, insect contamination, broken needle fragments, wrong barcode, wet garments, or sharp hazard triggers immediate failure.
                </p>
              </div>
              <span
                className={`text-xs font-black px-3 py-1 rounded-full uppercase ${
                  hasZeroToleranceFail
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {hasZeroToleranceFail ? '⚠️ 0-Tolerance Failed' : '✓ 0-Tolerance Cleared'}
              </span>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  {
                    id: 'mold_mildew',
                    name: 'Mold / Mildew Contamination',
                    desc: 'Any signs of fungal growth or musty moisture odor',
                  },
                  {
                    id: 'live_insect',
                    name: 'Live Insects / Biological Contamination',
                    desc: 'Pest activity or biological hazard in goods or cartons',
                  },
                  {
                    id: 'broken_needle',
                    name: 'Broken Needle Fragment',
                    desc: 'Missing needle tip or metal contamination in garments',
                  },
                  {
                    id: 'wrong_barcode',
                    name: 'Incorrect Barcode / Wrong SKU',
                    desc: 'Scanned barcode mismatches buyer purchase order SKU',
                  },
                  {
                    id: 'wet_garments',
                    name: 'Damp / Wet Garments',
                    desc: 'Moisture content exceeds maximum allowable buyer threshold',
                  },
                  {
                    id: 'sharp_hazard',
                    name: 'Sharp Hazard / Metal Burr',
                    desc: 'Exposed staple, razor fragment, or dangerous trim element',
                  },
                ].map((item) => {
                  const checkItem = zeroToleranceChecks.find((z) => z.id === item.id);
                  const isFail = checkItem
                    ? checkItem.hasDefect || checkItem.isPass === false || (checkItem.defectCount !== undefined && checkItem.defectCount > 0)
                    : false;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        isFail
                          ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                            isFail
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isFail ? 'FAIL (0-Tol)' : 'PASS (0-Tol)'}
                        </span>
                      </div>

                      {checkItem && checkItem.notes && (
                        <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200 mt-2">
                          <strong>Inspector Notes:</strong> {checkItem.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DEFECTS & AQL ANALYSIS */}
        {activeTab === 'defects' && (
          <div className="space-y-4">
            {/* AQL Limits Ac/Re Meter Strip */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    AQL 2.5 Normal Single Sampling Plan (ISO 2859-1 Level II)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Code Letter: <strong className="text-blue-700">{codeLetter}</strong> • Sample Size:{' '}
                  <strong className="text-blue-700">{record.sampleSize}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Critical Defects</span>
                    <span className="font-mono font-bold text-rose-700">Allowed Ac: 0</span>
                  </div>
                  <div className="text-2xl font-black font-mono mt-1 text-slate-900">
                    {record.criticalDefects || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {record.criticalDefects === 0 ? '✓ Within 0-defect limit' : '✗ Failed: Zero tolerance breached'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Major Defects (AQL 2.5)</span>
                    <span className="font-mono font-bold text-amber-700">
                      Ac: {maxMajor} / Re: {reMajor}
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-black font-mono mt-1 ${
                      record.majorDefects > maxMajor ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {record.majorDefects || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {record.majorDefects <= maxMajor
                      ? `✓ Within tolerance (${maxMajor - record.majorDefects} spare)`
                      : `✗ Exceeded by ${record.majorDefects - maxMajor} defect(s)`}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Minor Defects (AQL 4.0)</span>
                    <span className="font-mono font-bold text-blue-700">
                      Ac: {maxMinor} / Re: {reMinor}
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-black font-mono mt-1 ${
                      record.minorDefects > maxMinor ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {record.minorDefects || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {record.minorDefects <= maxMinor
                      ? `✓ Within tolerance (${maxMinor - record.minorDefects} spare)`
                      : `✗ Exceeded by ${record.minorDefects - maxMinor} defect(s)`}
                  </div>
                </div>
              </div>
            </div>

            {/* Defects Registry with Photo Thumbnails */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Garment Defects Registry &amp; Photo Evidence</h3>
                  <p className="text-xs text-slate-500">Itemized defect instances captured on the inspection line</p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {record.defects?.length || 0} Defect Types Logged
                </span>
              </div>

              {record.defects && record.defects.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {record.defects.map((d, index) => (
                    <div
                      key={d.id || index}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {d.photoUrl ? (
                          <div
                            onClick={() => setLightboxImage({ url: d.photoUrl!, title: d.defectType, subtitle: d.remark || d.location })}
                            className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:shadow-md bg-slate-100"
                          >
                            <img src={d.photoUrl} alt={d.defectType} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold">
                            No Pic
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 truncate">{d.defectType}</span>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                d.severity === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : d.severity === 'MAJOR'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {d.severity}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Location: <span className="font-semibold text-slate-700">{d.location || 'Main body'}</span>
                            {d.remark && (
                              <>
                                {' '}• Remark: <span className="italic text-slate-600">{d.remark}</span>
                              </>
                            )}
                          </div>
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
                  <span>Zero visual defects identified during sample inspection.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SIZES BREAKDOWN */}
        {activeTab === 'sizes' && (
          <div className="space-y-4">
            <InspectionSizeBreakdownSection
              items={sizeBreakdown}
              totalSampleSize={record.sampleSize || 315}
              readOnly={true}
            />
          </div>
        )}

        {/* TAB 7: MEASUREMENT SPEC SHEET */}
        {activeTab === 'measurements' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Garment Measurement Spec Sheets &amp; POM Charts</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Measurement spec sheet captures, points of measure tolerance checks, and sizing conformity records.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {measurementPhotos.length} Sheets Attached
              </span>
            </div>

            {measurementPhotos.length > 0 ? (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {measurementPhotos.map((p, idx) => {
                  const url = getPhotoUrl(p);
                  const remark = getPhotoRemark(p);
                  const time = getPhotoTime(p);
                  return (
                    <div
                      key={idx}
                      onClick={() => setLightboxImage({ url, title: 'Measurement Spec Sheet', subtitle: remark })}
                      className="group bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="aspect-4/3 bg-slate-100 overflow-hidden relative">
                        <img src={url} alt="Measurement Sheet" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/60 text-white backdrop-blur-xs">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="p-3 text-xs">
                        <p className="font-semibold text-slate-800">{remark || `Measurement Chart #${idx + 1}`}</p>
                        {time && (
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Captured: {time}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>No measurement spec sheet uploaded for this inspection record.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: 11 STANDARD CHECKPOINTS */}
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

        {/* TAB 9: DUAL DIGITAL SIGNATURES & QUALITY SIGN-OFF */}
        {activeTab === 'signatures' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span>Official Quality Inspection Sign-Off &amp; Authorization</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Formal certificate endorsement signed by the certified lead QA inspector and authorized factory representative.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Lead Inspector Card */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Lead QA Inspector</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Certified Auditor
                    </span>
                  </div>

                  <div className="pt-2 space-y-1">
                    <div className="text-sm font-bold text-slate-900">{record.inspectorName || 'Lead Auditor'}</div>
                    <div className="text-xs text-slate-500">ID: {record.inspectorId || 'QC-01'}</div>
                    <div className="text-[11px] text-slate-400">Date: {new Date(record.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Signature Preview Canvas */}
                <div className="border border-slate-200 rounded-xl bg-white p-3 h-32 flex items-center justify-center relative shadow-2xs">
                  {record.inspectorSignature ? (
                    <img
                      src={record.inspectorSignature}
                      alt="Inspector Digital Signature"
                      className="max-h-28 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 text-xs italic">
                      <PenTool className="w-6 h-6 mx-auto mb-1 opacity-40" />
                      <span>Digital Signature Not On File</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400">Digital Seal</span>
                </div>

                <div className="text-[10px] text-slate-500 text-center">
                  Verified according to AQL ISO 2859-1 Quality Assurance Standards.
                </div>
              </div>

              {/* Factory Representative Card */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Factory / Vendor Representative
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Manufacturer Rep
                    </span>
                  </div>

                  <div className="pt-2 space-y-1">
                    <div className="text-sm font-bold text-slate-900">
                      {record.representativeName || 'Factory Representative'}
                    </div>
                    <div className="text-xs text-slate-500">Factory: {record.factoryUnit || 'Unit 01 Production Floor'}</div>
                    <div className="text-[11px] text-slate-400">Date: {new Date(record.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Signature Preview Canvas */}
                <div className="border border-slate-200 rounded-xl bg-white p-3 h-32 flex items-center justify-center relative shadow-2xs">
                  {record.representativeSignature ? (
                    <img
                      src={record.representativeSignature}
                      alt="Representative Digital Signature"
                      className="max-h-28 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 text-xs italic">
                      <PenTool className="w-6 h-6 mx-auto mb-1 opacity-40" />
                      <span>Factory Representative Signature Pending</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400">Factory Seal</span>
                </div>

                <div className="text-[10px] text-slate-500 text-center">
                  Acknowledgement of audit findings, sample counts, and defect classifications.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="px-5 py-3.5 bg-slate-950/90 flex items-center justify-between border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">{lightboxImage.title}</h4>
                {lightboxImage.subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{lightboxImage.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 overflow-auto flex items-center justify-center max-h-[75vh]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
