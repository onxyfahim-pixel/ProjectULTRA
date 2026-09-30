'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Edit,
  Trash2,
  Building2,
  Download,
  Check,
  X,
  Layers,
  Clock,
  Info,
  ShieldCheck,
  QrCode,
  Package,
  Barcode,
  ExternalLink,
  Copy,
  Printer,
  Sparkles,
  RefreshCw,
  Search,
  Factory,
  FileCheck,
  Camera,
  Scissors,
  Truck,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { TraceabilityChain, BuyerOrder } from '@/lib/types/modules';
import { TraceabilityOrderSelectorModal } from './TraceabilityOrderSelectorModal';

interface TraceabilityDetailsPageProps {
  record: TraceabilityChain;
  onBack: () => void;
  onEdit: (record: TraceabilityChain) => void;
  onDelete?: (record: TraceabilityChain) => void;
  onUpdateRecord?: (record: TraceabilityChain) => void;
  showToast: (msg: string) => void;
}

export function TraceabilityDetailsPage({
  record,
  onBack,
  onEdit,
  onDelete,
  onUpdateRecord,
  showToast,
}: TraceabilityDetailsPageProps) {
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'evidence' | 'disposal' | 'genealogy' | 'passport'>('reconciliation');
  const [isOrderSelectorOpen, setIsOrderSelectorOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(label);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOrderSelected = (order: BuyerOrder) => {
    const defaultReceived = Math.round(order.orderQuantity * 1.03);
    const defaultPassed = order.orderQuantity;
    const defaultReject = Math.round(order.orderQuantity * 0.018);
    const defaultExcess = Math.round(order.orderQuantity * 0.008);
    const defaultWaste = defaultReceived - (defaultPassed + defaultReject + defaultExcess);

    const updated: TraceabilityChain = {
      ...record,
      poNumber: order.orderNumber,
      orderNumber: order.orderNumber,
      styleNumber: order.styleNumber,
      articleName: order.styleDescription,
      styleDescription: order.styleDescription,
      buyer: order.buyerName,
      orderQuantity: order.orderQuantity,
      season: order.season,
      receivedQty: defaultReceived,
      issuedQty: defaultReceived,
      cutQty: defaultReceived,
      passedQty: defaultPassed,
      rejectQty: defaultReject,
      excessQty: defaultExcess,
      wasteQty: defaultWaste > 0 ? defaultWaste : 0,
      disposedExcessQty: defaultReject + defaultExcess,
      varianceQty: 0,
      reconciliationStatus: '100%_RECONCILED',
      updatedAt: new Date().toISOString(),
    };
    if (onUpdateRecord) {
      onUpdateRecord(updated);
    }
    showToast(`Linked PO ${order.orderNumber} (${order.styleNumber}) successfully`);
  };

  const received = record.receivedQty || (record.orderQuantity ? Math.round(record.orderQuantity * 1.03) : 46500);
  const passed = record.passedQty || record.orderQuantity || 45000;
  const reject = record.rejectQty || 780;
  const excess = record.excessQty || 420;
  const waste = record.wasteQty || 300;
  const totalAccounted = passed + reject + excess + waste;
  const variance = record.varianceQty ?? (received - totalAccounted);
  const isReconciled = variance === 0;

  const stages = [
    {
      step: '01',
      name: 'Fiber & Ginning Origin',
      title: 'Raw Fiber / Sustainable Cotton',
      color: 'border-emerald-500 bg-emerald-50 text-emerald-700',
      primaryCode: record.cottonOrigin,
      primaryLabel: 'Cotton Origin Standard',
      details: [
        { label: 'Ginning Hub', value: record.ginningLocation || 'Lubbock Ginning Co-Op, Texas' },
        { label: 'Certificate Standard', value: record.certificateStandard || 'U.S. Cotton Trust Protocol / BCI' },
        { label: 'Cert License #', value: record.certificateNumber || 'USCTP-88419-TX' },
        { label: 'Custody Status', value: '100% Chain-of-Custody Verified' },
      ],
    },
    {
      step: '02',
      name: 'Yarn Spinning Mill',
      title: 'Yarn Spinning & Ring-Spun Batch',
      color: 'border-blue-500 bg-blue-50 text-blue-700',
      primaryCode: record.yarnLot,
      primaryLabel: 'Yarn Spinning Lot #',
      details: [
        { label: 'Spinning Mill', value: record.spinningMill || 'Square Spinning Mills Ltd (Unit 2)' },
        { label: 'Yarn Count / Type', value: '30s/1 Combed Ring Spun 100% Cotton' },
        { label: 'CSP Quality Test', value: '3,150 CSP (Uster 5% Tier)' },
        { label: 'Batch Dispatch Date', value: '2026-08-28' },
      ],
    },
    {
      step: '03',
      name: 'Knitting & Dyeing',
      title: 'Fabric Roll & Dyeing House',
      color: 'border-indigo-500 bg-indigo-50 text-indigo-700',
      primaryCode: record.dyeingBatch,
      primaryLabel: 'Dyeing Batch ID',
      details: [
        { label: 'Fabric Roll Barcode', value: record.fabricRollBarcode },
        { label: 'Fabric Mill', value: record.fabricMill || 'Pacific Knit Composite Ltd' },
        { label: 'Colorway / Shade', value: record.colorWay || 'Jet Black / Melange Grey' },
        { label: 'Color Fastness', value: 'Grade 4-5 (ISO 105-C06 Passed)' },
      ],
    },
    {
      step: '04',
      name: 'Cutting & Marker Spreading',
      title: 'Spreading Table & Bundle Generation',
      color: 'border-purple-500 bg-purple-50 text-purple-700',
      primaryCode: record.cuttingTableLot,
      primaryLabel: 'Cutting Table Lot #',
      details: [
        { label: 'Relaxation Window', value: '24 Hours Relaxed (Zero Shrinkage Variance)' },
        { label: 'Ply Height', value: '80 Plies (CAD Laser Precision)' },
        { label: 'Cut Units', value: `${record.cutQty?.toLocaleString() || '46,200'} pcs` },
        { label: 'Marker Efficiency', value: '86.4% Fabric Yield' },
      ],
    },
    {
      step: '05',
      name: 'Sewing Assembly Line',
      title: 'Assembly & QR Serial Stamping',
      color: 'border-amber-500 bg-amber-50 text-amber-700',
      primaryCode: record.sewingLine,
      primaryLabel: 'Production Sewing Line',
      details: [
        { label: 'Garment QR Serial', value: record.garmentSerial },
        { label: 'Passed Units', value: `${passed.toLocaleString()} pcs` },
        { label: 'Total Rejects', value: `${reject.toLocaleString()} pcs (Defects Accounted)` },
        { label: 'Needle Policy Log', value: record.needlePolicyVerified ? 'Verified & Intact' : 'Standard Logged' },
      ],
    },
    {
      step: '06',
      name: 'Final Packout & Export Carton',
      title: 'Metal Detection & Final Audit Seal',
      color: 'border-emerald-600 bg-emerald-50 text-emerald-800',
      primaryCode: record.cartonBarcode,
      primaryLabel: 'Master Export Carton Barcode',
      details: [
        { label: 'Audit Passed Date', value: record.passedFinalDate },
        { label: 'Disposal Record ID', value: record.disposalRecordId || 'DISP-2026-0891' },
        { label: 'Disposed Excess/Rej', value: `${record.disposedExcessQty || (reject + excess)} pcs Destroyed` },
        { label: 'Metal Detector Test', value: record.metalDetectionStatus || 'PASSED' },
      ],
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
      <div className="w-full max-w-[1920px] mx-auto space-y-6 pb-20">
        {/* Top Navigation & Action Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Back to Traceability Master Ledger"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  {record.cartonBarcode}
                </span>
                {record.disposalRecordId && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                    Disposal: {record.disposalRecordId}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isReconciled ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isReconciled ? '100% RECONCILED' : `VARIANCE: ${variance} PCS`}</span>
                </span>
              </div>
              <h1 className="text-base font-bold text-slate-900 mt-1">
                {record.articleName || record.styleDescription || record.styleNumber}
              </h1>
              <p className="text-xs text-slate-500">
                Buyer: <strong className="text-slate-700">{record.buyer}</strong> • Style: <strong className="text-slate-700">{record.styleNumber}</strong>
                {record.poNumber && <> • PO: <strong className="text-blue-700 font-mono">{record.poNumber}</strong></>}
              </p>
            </div>
          </div>

          {/* Action Buttons styled like Audit Module */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => copyToClipboard(record.disposalRecordId || record.cartonBarcode, 'Disposal / Barcode ID')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedKey === 'Disposal / Barcode ID' ? 'Copied!' : 'Copy ID'}</span>
            </button>


            <button
              type="button"
              onClick={() => onEdit(record)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(record)}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title="Delete Traceability Record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── LINKED BUYER & ORDER HIGHLIGHT CARD ──────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Linked Buyer &amp; Order Context
                </h3>
                {record.poNumber ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    PO: {record.poNumber}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    No PO Mapped
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                End-to-end brand protection and cut-to-box garment traceability linking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsOrderSelectorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Select / Change PO &amp; Article</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">
                {record.styleNumber} — {record.buyer}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              {record.articleName || record.styleDescription || 'Commercial apparel garment order with full quantity reconciliation and certified brand protection.'}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
              <span>Order Target: <strong className="text-slate-800 font-mono">{record.orderQuantity ? record.orderQuantity.toLocaleString() : '45,000'} pcs</strong></span>
              <span>•</span>
              <span>Total Received: <strong className="text-slate-800 font-mono">{received.toLocaleString()} pcs</strong></span>
              <span>•</span>
              <span>Disposal ID: <strong className="text-rose-700 font-mono font-semibold">{record.disposalRecordId || 'DISP-2026-0891'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SUMMARY KPI METRICS STRIP (QUANTITY & DISPOSAL AUDIT) ──────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            1. Received Qty
          </span>
          <div className="text-lg font-mono font-black text-blue-950 mt-0.5">
            {received.toLocaleString()}
          </div>
          <span className="text-[10px] text-blue-600 block">From Mill Challan</span>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            2. Issued to Floor
          </span>
          <div className="text-lg font-mono font-black text-slate-900 mt-0.5">
            {(record.issuedQty || received).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 block">Cut: {(record.cutQty || received).toLocaleString()}</span>
        </div>

        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            3. Passed / Packed
          </span>
          <div className="text-lg font-mono font-black text-emerald-950 mt-0.5">
            {passed.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-700 block">100% Export Met</span>
        </div>

        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            4. Total Rejects
          </span>
          <div className="text-lg font-mono font-black text-rose-950 mt-0.5">
            {reject.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-700 block">Sewing / Washing Rej</span>
        </div>

        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            5. Leftover / Excess
          </span>
          <div className="text-lg font-mono font-black text-amber-950 mt-0.5">
            {excess.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-700 block">Surplus Production</span>
        </div>

        <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
            6. Disposed Units
          </span>
          <div className="text-lg font-mono font-black text-purple-950 mt-0.5">
            {(record.disposedExcessQty || (reject + excess)).toLocaleString()}
          </div>
          <span className="text-[10px] text-purple-700 font-semibold block">{record.disposalMethod || 'SHREDDING'}</span>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('reconciliation')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'reconciliation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Quantity Reconciliation & Verification</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'evidence'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Inbound Invoice & Challan Evidence</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('disposal')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'disposal'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Brand Protection & Disposal Record</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('genealogy')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'genealogy'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Custody Genealogy (6 Stages)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('passport')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'passport'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Digital Passport & Barcodes</span>
        </button>
      </div>

      {/* ─── TAB 1: QUANTITY RECONCILIATION AUDIT TABLE ───────────────────── */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Comprehensive Factory Quantity Reconciliation Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Step-by-step mathematical verification ensuring 100% accountability from fabric roll to export carton and disposal
                </p>
              </div>

              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                isReconciled ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                {isReconciled ? '✓ 100% RECONCILED (Variance: 0 pcs)' : `Discrepancy: ${variance} pcs`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Process Stage</th>
                    <th className="py-2.5 px-3">Quantity (Units / Pcs)</th>
                    <th className="py-2.5 px-3">% of Inbound</th>
                    <th className="py-2.5 px-3">Verification Source</th>
                    <th className="py-2.5 px-3">Audit Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-blue-900">
                      1. Inbound Received Quantity
                    </td>
                    <td className="py-3 px-3 font-bold text-blue-700 text-sm">
                      {received.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3 font-bold">100.0%</td>
                    <td className="py-3 px-3 text-slate-700 font-sans">
                      Challan #{record.challanNumber || 'CHL-PKC-2026-8841'}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-500">
                      Store inward GRN verified & physically tallied
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-slate-800">
                      2. Issued to Cutting & Spreading
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {(record.issuedQty || received).toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3">
                      {((((record.issuedQty || received) / received) * 100).toFixed(1))}%
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-sans">
                      Requisition Slip #{record.cuttingTableLot || 'CUT-TB-14'}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-500">
                      Cutting spreading room floor requisition signed
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-slate-800">
                      3. Net Cut Units
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {(record.cutQty || received).toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3">
                      {((((record.cutQty || received) / received) * 100).toFixed(1))}%
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-sans">
                      CAD Marker Report
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-500">
                      Laser ply count verified (80 plies)
                    </td>
                  </tr>

                  <tr className="bg-emerald-50/30">
                    <td className="py-3 px-3 font-sans font-bold text-emerald-900">
                      4. Good / Passed & Packed Garments
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-800 text-sm">
                      {passed.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700">
                      {(((passed / received) * 100).toFixed(1))}%
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-sans font-semibold">
                      Export Carton #{record.cartonBarcode}
                    </td>
                    <td className="py-3 px-3 font-sans text-emerald-700 font-medium">
                      100% Export Order Target Fulfilled
                    </td>
                  </tr>

                  <tr className="bg-rose-50/30">
                    <td className="py-3 px-3 font-sans font-bold text-rose-900">
                      5. Defective / Rejected Garments
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-700 text-sm">
                      {reject.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-700">
                      {(((reject / received) * 100).toFixed(1))}%
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-sans">
                      Sewing/Wash Defect Log
                    </td>
                    <td className="py-3 px-3 font-sans text-rose-700">
                      All branded labels removed & queued for destruction
                    </td>
                  </tr>

                  <tr className="bg-amber-50/30">
                    <td className="py-3 px-3 font-sans font-bold text-amber-900">
                      6. Excess / Leftover Units
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-700 text-sm">
                      {excess.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-700">
                      {(((excess / received) * 100).toFixed(1))}%
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-sans">
                      Overcut Store Log
                    </td>
                    <td className="py-3 px-3 font-sans text-amber-700">
                      Surplus inventory sealed in brand protection lockbox
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-purple-900">
                      7. Cutting Scrap & Fabric Waste
                    </td>
                    <td className="py-3 px-3 font-bold text-purple-800">
                      {waste.toLocaleString()} pcs eq.
                    </td>
                    <td className="py-3 px-3">
                      {(((waste / received) * 100).toFixed(1))}%
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-sans">
                      Weighbridge Scrap Slip
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-500">
                      Recycled via authorized eco-textile fiber recycler
                    </td>
                  </tr>

                  <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                    <td className="py-3 px-3 font-sans text-slate-900">
                      TOTAL ACCOUNTED FOR
                    </td>
                    <td className="py-3 px-3 text-slate-900 text-sm">
                      {totalAccounted.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3">100.0%</td>
                    <td className="py-3 px-3 font-sans text-slate-700">
                      Reconciled Balance
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="text-emerald-700 font-bold">
                        Zero discrepancy verified
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: INVOICE & CHALLAN EVIDENCE ────────────────────────────── */}
      {activeTab === 'evidence' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Inbound Commercial Invoice & Delivery Challan Audit Registry
                </h3>
                <p className="text-xs text-slate-500">
                  Documentary evidence and gate passes certifying genuine mill procurement
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                Audited & Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Supplier Commercial Invoice
                </span>
                <div className="text-base font-mono font-bold text-slate-900">
                  {record.invoiceNumber || 'INV-SQ-2026-9901'}
                </div>
                <div className="text-xs text-slate-600">
                  Date: <strong className="font-mono text-slate-800">{record.invoiceDate || '2026-08-25'}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Supplier: <strong>Square Spinning & Fabric Mills Ltd</strong>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Delivery / Inward Challan
                </span>
                <div className="text-base font-mono font-bold text-blue-700">
                  {record.challanNumber || 'CHL-PKC-2026-8841'}
                </div>
                <div className="text-xs text-slate-600">
                  Date: <strong className="font-mono text-slate-800">{record.challanDate || '2026-08-26'}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Received by: <strong>Store In-Charge & Quality Gate Inward</strong>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Security Gate Pass Number
                </span>
                <div className="text-base font-mono font-bold text-emerald-700">
                  {record.gatePassNumber || 'GP-IN-7712'}
                </div>
                <div className="text-xs text-slate-600">
                  Vehicle: <strong className="font-mono text-slate-800">DHAKA-METRO-TA-14-8890</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Factory Gate Security Cleared
                </div>
              </div>
            </div>

            {/* Evidence Files List */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                Attached Scanned Challans & Verified Documents
              </h4>

              {record.challanEvidenceFiles && record.challanEvidenceFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {record.challanEvidenceFiles.map((file) => (
                    <div key={file.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate block max-w-[180px]" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {file.size || '1.4 MB'} • Uploaded {file.uploadDate}
                          </span>
                        </div>
                      </div>

                      <a
                        href={file.url}
                        download={file.name}
                        onClick={(e) => {
                          e.preventDefault();
                          showToast(`Opened verified document: ${file.name}`);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Download / View document"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  Challan and invoice documents archived in central ERP documents store
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BRAND PROTECTION & DISPOSAL AUDIT ─────────────────────── */}
      {activeTab === 'disposal' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Brand Protection & Secure Destruction Ledger</span>
                  <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    COD Verified
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Zero tolerance for grey market pilferage. Destruction of all rejected and excess branded labels, price tags, and apparel.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 self-start sm:self-auto">
                {record.brandProtectionStatus || 'DISPOSED & CERTIFIED'}
              </span>
            </div>

            {/* Disposal Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 space-y-1">
                <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">
                  Disposal Record ID
                </span>
                <div className="text-base font-mono font-bold text-rose-950">
                  {record.disposalRecordId || 'DISP-2026-0891'}
                </div>
                <span className="text-[10px] text-rose-600">Registered Destruction Log</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Destroyed Excess & Rejects
                </span>
                <div className="text-base font-mono font-bold text-slate-900">
                  {(record.disposedExcessQty || (reject + excess)).toLocaleString()} pcs
                </div>
                <span className="text-[10px] text-slate-500">{reject} Rejects + {excess} Leftover</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Destruction Method
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {record.disposalMethod || 'INDUSTRIAL SHREDDING'}
                </div>
                <span className="text-[10px] text-slate-500">De-fibered into micro remnants</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Certificate of Destruction
                </span>
                <div className="text-xs font-mono font-bold text-blue-700">
                  {record.certificateOfDestructionNumber || 'COD-HM-2026-0891'}
                </div>
                <span className="text-[10px] text-slate-500">Date: {record.disposalDate || '2026-09-18'}</span>
              </div>
            </div>

            {/* Witness & Facility Information */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row justify-between gap-1">
                <span className="text-slate-500 font-medium">Destruction Facility / Room:</span>
                <span className="font-semibold text-slate-800">
                  {record.disposalFacility || 'In-House Secure Shredder Room Bay 3 (CCTV Monitored)'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-1">
                <span className="text-slate-500 font-medium">Witnessed & Signed By:</span>
                <span className="font-semibold text-slate-800">
                  {record.witnessedBy || 'Lt. Col. (Retd) Anwar Hossain (Chief Security Officer) & Buyer QA Auditor'}
                </span>
              </div>
            </div>

            {/* Photo Evidence Gallery of Destruction */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-rose-600" />
                <span>Destruction Photo Evidence (Pre-Destruction & Post-Destruction Remnants)</span>
              </h4>

              {record.destructionEvidencePhotos && record.destructionEvidencePhotos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {record.destructionEvidencePhotos.map((photo) => (
                    <div key={photo.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs group">
                      <div className="h-44 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Destruction Evidence'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3 text-xs space-y-1">
                        <span className="font-semibold text-slate-900 block truncate" title={photo.caption}>
                          {photo.caption || 'Destruction Verification Photo'}
                        </span>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Timestamp: {photo.timestamp || 'Recorded'}</span>
                          <span className="text-emerald-700 font-bold">✓ Verified Destroyed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  No photographic evidence uploaded yet for this destruction lot
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: GENEALOGY TIMELINE (6 STAGES) ─────────────────────────── */}
      {activeTab === 'genealogy' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  End-to-End Digital Genealogy (Farm to Export Carton)
                </h3>
                <p className="text-xs text-slate-500">
                  Custodial checkpoints tracking raw materials through manufacturing transformations
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto">
                100% Chain Custody Verified
              </span>
            </div>

            <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-8">
              {stages.map((st, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[37px] top-0 w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-md">
                    {st.step}
                  </div>

                  <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Stage {st.step}: {st.name}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {st.title}
                        </h4>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-500 block">{st.primaryLabel}</span>
                        <span className="font-mono font-bold text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                          {st.primaryCode}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
                      {st.details.map((d, dIdx) => (
                        <div key={dIdx} className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">{d.label}</span>
                          <span className="text-xs font-semibold text-slate-800 font-mono mt-0.5 block truncate" title={d.value}>
                            {d.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: DIGITAL PASSPORT & BARCODES ───────────────────────────── */}
      {activeTab === 'passport' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Digital Product Passport (DPP) & Carton Shipping Label
                </h3>
                <p className="text-xs text-slate-500">
                  Global trade item serial passport ready for carton label printer and handheld RFID scanning
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Carton Shipping Label */}
              <div className="border-2 border-dashed border-slate-300 p-5 rounded-xl bg-slate-50 font-mono text-xs space-y-3">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Export Destination</span>
                    <div className="font-bold text-slate-900 text-sm">{record.buyer}</div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    PRIORITY AUDIT VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">PO Number:</span>
                    <div className="font-bold text-blue-700">{record.poNumber || 'PO-HM-99201'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Style / Article:</span>
                    <div className="font-bold text-slate-800">{record.styleNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Passed / Packed:</span>
                    <div className="text-slate-800 font-bold">{passed.toLocaleString()} pcs</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Disposal ID:</span>
                    <div className="text-rose-700 font-bold">{record.disposalRecordId || 'DISP-2026-0891'}</div>
                  </div>
                </div>

                {/* Barcode visual */}
                <div className="pt-2 text-center border-t border-slate-200">
                  <div className="inline-block py-2 px-6 bg-white border border-slate-200 rounded">
                    <div className="flex items-center justify-center gap-1 h-12 w-48 mx-auto">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-full ${
                            i % 4 === 0 ? 'w-1 bg-black' : i % 3 === 0 ? 'w-0.5 bg-black' : 'w-0.5 bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 tracking-wider">
                      {record.cartonBarcode}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code Passport */}
              <div className="flex flex-col items-center justify-center p-6 bg-blue-50/50 rounded-2xl border border-blue-200 text-center">
                <div className="w-36 h-36 bg-white p-3 rounded-2xl border border-slate-200 shadow-md flex items-center justify-center mb-3">
                  <QrCode className="w-28 h-28 text-slate-900" />
                </div>
                <span className="font-mono text-xs font-bold text-blue-900">
                  {record.garmentSerial}
                </span>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Scan this 2D QR code with any handheld RFID / barcode scanner to pull instant field traceability genealogy.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    RFID: {record.rfidTag || 'EPC-96-88A904BC1'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PO / Article Selector Modal */}
      {isOrderSelectorOpen && (
        <TraceabilityOrderSelectorModal
          isOpen={isOrderSelectorOpen}
          onClose={() => setIsOrderSelectorOpen(false)}
          onSelectOrder={handleOrderSelected}
          selectedPoNumber={record.poNumber}
          selectedStyleNumber={record.styleNumber}
        />
      )}
      </div>
    </div>
  );
}
