'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Calendar,
  User,
  Sliders,
  ShieldCheck,
  Clock,
  Sparkles,
  Search,
  FileText,
  Building2,
  AlertCircle,
} from 'lucide-react';
import {
  InspectionRecord,
  InspectionType,
  InspectionStatus,
  InspectionStage,
  DefectItem,
  MeasurementAuditItem,
  CheckpointItem,
} from '@/lib/types/erp';
import { BuyerOrder } from '@/lib/types/modules';

interface InspectionEntryPageProps {
  mode?: 'add' | 'edit';
  record?: InspectionRecord | null;
  orders?: BuyerOrder[];
  onSave: (recordData: InspectionRecord) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const COMMON_GARMENT_DEFECTS = [
  'Skip Stitch',
  'Broken Stitch',
  'Seam Puckering',
  'Open / Raw Seam',
  'Needle Hole / Thread Pull',
  'Oil Stain / Spot',
  'Shade Variation (Band)',
  'Uneven Hem / Cuff',
  'Pleat / Fold Misalignment',
  'Label Position Off-Center',
  'Buttonhole Frayed / Misplaced',
  'Polybag Barcode Unreadable',
  'Carton Marking Inaccurate',
];

const DEFAULT_MEASUREMENT_POINTS: { point: string; spec: number; tol: string }[] = [
  { point: 'Chest Width (1" below armhole)', spec: 21.0, tol: '±0.5"' },
  { point: 'Body Length (HPS to bottom)', spec: 28.5, tol: '±0.5"' },
  { point: 'Sleeve Length from Shoulder', spec: 9.0, tol: '±0.25"' },
  { point: 'Waist / Bottom Sweep', spec: 20.5, tol: '±0.5"' },
  { point: 'Neck Width / Opening', spec: 7.5, tol: '±0.25"' },
];

const DEFAULT_CHECKPOINTS_BY_TYPE: Record<InspectionType, { category: string; checkpoint: string }[]> = {
  INLINE: [
    { category: 'Sewing Process', checkpoint: 'Stitches per inch (SPI) calibrated at 11-12 SPI' },
    { category: 'Sewing Process', checkpoint: 'Seam tension balanced across needle and looper threads' },
    { category: 'Safety Control', checkpoint: 'Active needle breakage protocol & replacement register' },
    { category: 'Workmanship', checkpoint: 'Workstation cleanliness & zero garment drag on floor' },
  ],
  PRE_FINAL: [
    { category: 'Packing Stage', checkpoint: 'Min 50%–80% garments packed into polybags & boxes' },
    { category: 'Assortment', checkpoint: 'Size & color pack ratio verified against buyer PO pack sheet' },
    { category: 'Packaging', checkpoint: 'Polybag safety warning and ventilation holes standard' },
    { category: 'Workmanship', checkpoint: 'Finishing trimming & thread suck inspection cleared' },
  ],
  FINAL: [
    { category: 'AQL 2.5 Sampling', checkpoint: 'Sample cartons pulled randomly from 100% finished lot' },
    { category: 'Safety & Metal', checkpoint: '100% Metal Detection calibration passed (Fe 1.0mm, Non-Fe 1.2mm, SS 1.5mm)' },
    { category: 'Carton Drop Test', checkpoint: 'ISTA 1A Carton Drop Test (1 corner, 3 edges, 6 faces) - No damage' },
    { category: 'Barcode & Marks', checkpoint: 'Master carton export markings, PO#, Destination & EAN barcodes scannable' },
  ],
};

export function InspectionEntryPage({
  mode = 'add',
  record,
  orders = [],
  onSave,
  onCancel,
  showToast,
}: InspectionEntryPageProps) {
  // Initial Inspection Type
  const initialType: InspectionType =
    record?.inspectionType ||
    (record?.stage === 'SEWING_IN_LINE' || record?.stage === 'CUTTING_INSPECTION'
      ? 'INLINE'
      : record?.stage === 'FINISHING_PACKING' && (record?.packedPercent || 100) < 80
      ? 'PRE_FINAL'
      : 'FINAL');

  // Form State - Unified All in One Page
  const [inspectionType, setInspectionType] = useState<InspectionType>(initialType);
  const [inspectionCode] = useState(
    record?.inspectionCode || `QMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string>(record?.buyerOrderId || '');
  const [orderNumber, setOrderNumber] = useState(record?.orderNumber || 'PO-EXP-9920');
  const [styleNumber, setStyleNumber] = useState(record?.styleNumber || 'STY-ZR-4882-09');
  const [styleDescription, setStyleDescription] = useState(
    record?.styleDescription || 'Slim Fit Stretch Denim Pants'
  );
  const [buyer, setBuyer] = useState(record?.buyer || 'Inditex (Zara)');
  const [lotNumber, setLotNumber] = useState(record?.lotNumber || 'LOT-TX-9042D');
  const [stage, setStage] = useState<InspectionStage>(
    record?.stage ||
      (initialType === 'INLINE'
        ? 'SEWING_IN_LINE'
        : 'FINISHING_PACKING')
  );
  const [orderQuantity, setOrderQuantity] = useState<number>(record?.orderQuantity || 10000);
  const [lotQuantity, setLotQuantity] = useState<number>(record?.lotQuantity || 10000);
  const [cartonCount, setCartonCount] = useState<number>(record?.cartonCount || 400);
  const [packedPercent, setPackedPercent] = useState<number>(
    record?.packedPercent !== undefined ? record.packedPercent : initialType === 'FINAL' ? 100 : 70
  );
  const [aqlLevel, setAqlLevel] = useState(record?.aqlLevel || 'AQL 2.5 General Inspection Level II');
  const [sampleSize, setSampleSize] = useState<number>(record?.sampleSize || 315);
  const [factoryUnit, setFactoryUnit] = useState(record?.factoryUnit || 'Unit 01 (Dhaka Complex)');
  const [sewingLine, setSewingLine] = useState(record?.sewingLine || 'Sewing Line 04 (Bottoms)');
  const [shift, setShift] = useState(record?.shift || 'Morning Shift A (08:00 - 16:30)');
  const [inspectorName, setInspectorName] = useState(record?.inspectorName || 'Md. Rafiqul Islam (Senior QA)');
  const [inspectorId] = useState(record?.inspectorId || 'usr_qa_lead');
  const [remarks, setRemarks] = useState(
    record?.remarks ||
      'Quality inspection audit conducted according to ISO 2859-1 standards. All sampling pieces checked.'
  );
  const [correctiveAction, setCorrectiveAction] = useState(
    record?.correctiveAction || ''
  );

  // Type-specific flags
  const [metalDetectionPassed, setMetalDetectionPassed] = useState(true);
  const [cartonDropTestPassed, setCartonDropTestPassed] = useState(true);
  const [spiCalibrated, setSpiCalibrated] = useState(true);

  // Defect Items State
  const [defects, setDefects] = useState<DefectItem[]>(
    record?.defects && record.defects.length > 0
      ? record.defects
      : [
          {
            id: `d-init-1`,
            defectType: 'Skip Stitch',
            severity: 'MAJOR',
            count: 2,
            location: 'Side Seam Line 04',
          },
          {
            id: `d-init-2`,
            defectType: 'Loose Thread Ends',
            severity: 'MINOR',
            count: 4,
            location: 'Cuff & Hem',
          },
        ]
  );

  // Measurements State
  const [measurements, setMeasurements] = useState<MeasurementAuditItem[]>(
    record?.measurements && record.measurements.length > 0
      ? record.measurements
      : DEFAULT_MEASUREMENT_POINTS.map((p, idx) => ({
          id: `m-${idx + 1}`,
          point: p.point,
          spec: p.spec,
          actual: p.spec,
          tol: p.tol,
          result: 'PASS',
        }))
  );

  // Checkpoints State
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>(
    record?.checkpoints && record.checkpoints.length > 0
      ? record.checkpoints
      : DEFAULT_CHECKPOINTS_BY_TYPE[initialType].map((c, idx) => ({
          id: `c-${idx + 1}`,
          category: c.category,
          checkpoint: c.checkpoint,
          status: 'PASS',
          notes: '',
        }))
  );

  // When user selects a BuyerOrder from dropdown
  const handleSelectBuyerOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ordId = e.target.value;
    setSelectedOrderId(ordId);
    const ord = orders.find((o) => o.id === ordId);
    if (ord) {
      setOrderNumber(ord.orderNumber);
      setStyleNumber(ord.styleNumber);
      setStyleDescription(ord.styleDescription || '');
      setBuyer(ord.buyerName);
      setOrderQuantity(ord.orderQuantity);
      setLotQuantity(ord.orderQuantity);
      setCartonCount(Math.ceil(ord.orderQuantity / 24));
    }
  };

  // Switching Inspection Type smoothly in the same page
  const handleTypeSwitch = (newType: InspectionType) => {
    setInspectionType(newType);
    if (newType === 'INLINE') {
      setStage('SEWING_IN_LINE');
      setPackedPercent(30);
      setSampleSize(125);
    } else if (newType === 'PRE_FINAL') {
      setStage('FINISHING_PACKING');
      setPackedPercent(70);
      setSampleSize(200);
    } else {
      setStage('FINISHING_PACKING');
      setPackedPercent(100);
      setSampleSize(315);
    }

    // Refresh checkpoints with the appropriate type defaults if none are custom
    setCheckpoints(
      DEFAULT_CHECKPOINTS_BY_TYPE[newType].map((c, idx) => ({
        id: `c-${Date.now()}-${idx}`,
        category: c.category,
        checkpoint: c.checkpoint,
        status: 'PASS',
        notes: '',
      }))
    );
  };

  // Calculations
  const criticalCount = defects
    .filter((d) => d.severity === 'CRITICAL')
    .reduce((sum, d) => sum + (Number(d.count) || 0), 0);
  const majorCount = defects
    .filter((d) => d.severity === 'MAJOR')
    .reduce((sum, d) => sum + (Number(d.count) || 0), 0);
  const minorCount = defects
    .filter((d) => d.severity === 'MINOR')
    .reduce((sum, d) => sum + (Number(d.count) || 0), 0);
  const totalDefects = criticalCount + majorCount + minorCount;
  const passCount = Math.max(0, sampleSize - totalDefects);

  // Auto Status Recommendation
  const computedVerdict: InspectionStatus =
    criticalCount > 0 || majorCount > 5
      ? 'REJECTED'
      : majorCount >= 3
      ? 'CONDITIONAL_PASS'
      : 'PASSED';

  const [status, setStatus] = useState<InspectionStatus>(record?.status || computedVerdict);

  // Sync recommendation if user hasn't explicitly overridden
  const handleAddDefect = () => {
    setDefects([
      ...defects,
      {
        id: `d-${Date.now()}`,
        defectType: COMMON_GARMENT_DEFECTS[0],
        severity: 'MAJOR',
        count: 1,
        location: 'Assembly Stitch',
      },
    ]);
  };

  const handleRemoveDefect = (id: string) => {
    setDefects(defects.filter((d) => d.id !== id));
  };

  const handleUpdateMeasurement = (id: string, actual: number) => {
    setMeasurements((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const diff = Math.abs(actual - m.spec);
          const isPass = diff <= 0.6; // tolerance threshold
          return {
            ...m,
            actual,
            result: isPass ? 'PASS' : 'FAIL',
          };
        }
        return m;
      })
    );
  };

  const handleToggleCheckpoint = (id: string) => {
    setCheckpoints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = c.status === 'PASS' ? 'FAIL' : c.status === 'FAIL' ? 'NA' : 'PASS';
          return { ...c, status: next };
        }
        return c;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalizedRecord: InspectionRecord = {
      id: record?.id || `insp-${Date.now().toString().slice(-6)}`,
      inspectionCode,
      inspectionType,
      orderNumber,
      buyerOrderId: selectedOrderId,
      styleNumber,
      styleDescription,
      lotNumber,
      stage,
      sampleSize: Number(sampleSize),
      orderQuantity: Number(orderQuantity),
      lotQuantity: Number(lotQuantity),
      cartonCount: Number(cartonCount),
      packedPercent: Number(packedPercent),
      aqlLevel,
      passCount,
      defectCount: totalDefects,
      majorDefects: majorCount,
      minorDefects: minorCount,
      criticalDefects: criticalCount,
      status,
      inspectorId,
      inspectorName,
      buyer,
      factoryUnit,
      sewingLine,
      shift,
      remarks,
      correctiveAction,
      createdAt: record?.createdAt || new Date().toISOString(),
      defects,
      measurements,
      checkpoints,
    };

    onSave(finalizedRecord);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
      {/* Top Action Bar - Exactly matching Buyer & Order module */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Cancel & return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{mode === 'edit' ? 'Edit Inspection Record' : 'Log New QMS Inspection Audit'}</span>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {inspectionCode}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              All-in-one quality audit dossier covering Inline, Pre-Final, and Final inspection stages
            </p>
          </div>
        </div>

        {/* Action Buttons - Styled identically to Buyer & Order module */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{mode === 'edit' ? 'Save All Changes' : 'Save & Sign-Off Inspection'}</span>
          </button>
        </div>
      </div>

      {/* THREE-TYPE SELECTOR BANNER - ALL IN ONE PAGE */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Select Inspection Stage (Three Core Apparel Types)</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Toggling tunes the form sections & checklist dynamically
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            {
              type: 'INLINE' as InspectionType,
              title: '1. Inline Inspection',
              subtitle: 'Sewing lines, cutting tables, SPI checks & live needle control',
              icon: '🧵',
              activeCls: 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs',
            },
            {
              type: 'PRE_FINAL' as InspectionType,
              title: '2. Pre-Final Inspection',
              subtitle: '50%–80% packed goods, carton packing, size assortment & polybagging',
              icon: '📦',
              activeCls: 'bg-amber-50/80 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 shadow-xs',
            },
            {
              type: 'FINAL' as InspectionType,
              title: '3. Final Inspection (FRI)',
              subtitle: '100% finished, AQL 2.5 random sampling, drop test & metal detection',
              icon: '🏆',
              activeCls: 'bg-emerald-50/80 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs',
            },
          ].map((item) => {
            const isSelected = inspectionType === item.type;
            return (
              <div
                key={item.type}
                onClick={() => handleTypeSwitch(item.type)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? item.activeCls
                    : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-bold">{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{item.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: ORDER & STYLE INFORMATION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span>1. Order & Product Specification</span>
          </h3>
          {orders.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Link Buyer Order:</span>
              <select
                value={selectedOrderId}
                onChange={handleSelectBuyerOrder}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Choose Active PO --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} ({o.buyerName} - {o.styleNumber})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Purchase Order (PO#)</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Style Number</label>
            <input
              type="text"
              value={styleNumber}
              onChange={(e) => setStyleNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Buyer Account</label>
            <select
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Inditex (Zara)">Inditex (Zara)</option>
              <option value="H&M Global">H&M Global</option>
              <option value="Nike Apparel">Nike Apparel</option>
              <option value="PVH (Tommy Hilfiger)">PVH (Tommy Hilfiger)</option>
              <option value="Fast Retailing (Uniqlo)">Fast Retailing (Uniqlo)</option>
              <option value="Gap Inc.">Gap Inc.</option>
              <option value="Target Global Sourcing">Target Global Sourcing</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lot / Batch Reference</label>
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Garment Style Description</label>
            <input
              type="text"
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Mens 100% Cotton Polo Shirt with Flatknit Collar"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Total Order Quantity (Pcs)</label>
            <input
              type="number"
              min="1"
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Available Lot Size (Pcs)</label>
            <input
              type="number"
              min="1"
              value={lotQuantity}
              onChange={(e) => setLotQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: AUDIT CONTEXT & TYPE-SPECIFIC PARAMETERS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>2. Audit Context & {inspectionType} Parameters</span>
          </h3>
          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Stage: {stage}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Factory Plant / Unit</label>
            <select
              value={factoryUnit}
              onChange={(e) => setFactoryUnit(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Unit 01 (Dhaka Complex)">Unit 01 (Dhaka Complex)</option>
              <option value="Unit 02 (Gazipur Facility)">Unit 02 (Gazipur Facility)</option>
              <option value="Unit 03 (Narayanganj Plant)">Unit 03 (Narayanganj Plant)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sewing Line / Department</label>
            <input
              type="text"
              value={sewingLine}
              onChange={(e) => setSewingLine(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Production Shift</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Morning Shift A (08:00 - 16:30)">Morning Shift A (08:00 - 16:30)</option>
              <option value="Evening Shift B (16:30 - 01:00)">Evening Shift B (16:30 - 01:00)</option>
              <option value="General Day Shift (09:00 - 18:00)">General Day Shift (09:00 - 18:00)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lead QC Auditor</label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* DYNAMIC PARAMETERS BASED ON SELECTED TYPE */}
          {inspectionType === 'INLINE' && (
            <>
              <div>
                <label className="block font-semibold text-blue-900 mb-1">Stitches Per Inch (SPI)</label>
                <input
                  type="text"
                  defaultValue="11 - 12 SPI"
                  className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-blue-50/50 font-mono text-blue-900"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="spi-calib"
                  checked={spiCalibrated}
                  onChange={(e) => setSpiCalibrated(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="spi-calib" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Machine Looper & Needle Tension Calibrated
                </label>
              </div>
            </>
          )}

          {inspectionType === 'PRE_FINAL' && (
            <>
              <div>
                <label className="block font-semibold text-amber-900 mb-1">Packed Percentage (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={packedPercent}
                  onChange={(e) => setPackedPercent(parseInt(e.target.value, 10) || 70)}
                  className="w-full px-3 py-2 border border-amber-200 rounded-xl bg-amber-50/50 font-mono font-bold text-amber-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-amber-900 mb-1">Cartons Ready for Audit</label>
                <input
                  type="number"
                  min="1"
                  value={cartonCount}
                  onChange={(e) => setCartonCount(parseInt(e.target.value, 10) || 100)}
                  className="w-full px-3 py-2 border border-amber-200 rounded-xl bg-amber-50/50 font-mono font-bold text-amber-900"
                />
              </div>
            </>
          )}

          {inspectionType === 'FINAL' && (
            <>
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Master Export Cartons</label>
                <input
                  type="number"
                  min="1"
                  value={cartonCount}
                  onChange={(e) => setCartonCount(parseInt(e.target.value, 10) || 400)}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-xl bg-emerald-50/50 font-mono font-bold text-emerald-900"
                />
              </div>
              <div className="flex items-center gap-3 pt-6 sm:col-span-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metalDetectionPassed}
                    onChange={(e) => setMetalDetectionPassed(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">100% Metal Detection Calibration Passed</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cartonDropTestPassed}
                    onChange={(e) => setCartonDropTestPassed(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Carton Drop Test (10 Drops) OK</span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 3: AQL 2.5 SAMPLING METRICS CALCULATOR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. AQL 2.5 Sampling Calculator & Defect Tolerances
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              computedVerdict === 'PASSED'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : computedVerdict === 'CONDITIONAL_PASS'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-rose-100 text-rose-800 border-rose-200'
            }`}
          >
            Auto Verdict: {computedVerdict.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">AQL Sampling Standard</label>
            <select
              value={aqlLevel}
              onChange={(e) => setAqlLevel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="AQL 2.5 General Inspection Level II">AQL 2.5 General Level II</option>
              <option value="AQL 1.5 Strict Inspection Level II">AQL 1.5 Strict Level II</option>
              <option value="AQL 4.0 Normal Inspection Level I">AQL 4.0 Normal Level I</option>
              <option value="100% Piece-by-Piece Screening">100% Piece Screening</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sample Size (Pcs)</label>
            <input
              type="number"
              min="1"
              value={sampleSize}
              onChange={(e) => setSampleSize(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-emerald-700 mb-1">Good Units Passed</label>
            <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 font-mono font-black text-emerald-800 text-sm">
              {passCount} / {sampleSize} pcs
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Calculated Pass Rate</label>
            <div className="px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 font-mono font-black text-slate-900 text-sm">
              {sampleSize > 0 ? ((passCount / sampleSize) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: INTERACTIVE DEFECT LOGGING MATRIX */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>4. Defect Logging Matrix ({defects.length} items logged)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Crit: <span className="font-bold text-rose-700">{criticalCount}</span> • Maj: <span className="font-bold text-amber-700">{majorCount}</span> • Min: <span className="font-bold text-slate-700">{minorCount}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddDefect}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Defect Entry</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {defects.map((d, index) => (
            <div
              key={d.id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Defect Type</label>
                  <input
                    type="text"
                    value={d.defectType}
                    list={`defect-list-${index}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDefects(defects.map((item) => (item.id === d.id ? { ...item, defectType: val } : item)));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <datalist id={`defect-list-${index}`}>
                    {COMMON_GARMENT_DEFECTS.map((def) => (
                      <option key={def} value={def} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Severity</label>
                  <select
                    value={d.severity}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setDefects(defects.map((item) => (item.id === d.id ? { ...item, severity: val } : item)));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="CRITICAL">🚨 Critical (Immediate Fail)</option>
                    <option value="MAJOR">⚠️ Major (AQL Defect)</option>
                    <option value="MINOR">ℹ️ Minor (Cosmetic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Garment Location</label>
                  <input
                    type="text"
                    value={d.location}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDefects(defects.map((item) => (item.id === d.id ? { ...item, location: val } : item)));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="e.g. Front Placket"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5 text-right">Count</label>
                  <input
                    type="number"
                    min="1"
                    value={d.count}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setDefects(defects.map((item) => (item.id === d.id ? { ...item, count: val } : item)));
                    }}
                    className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveDefect(d.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 mt-3 cursor-pointer"
                  title="Remove defect"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {defects.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No defects added yet. Click "Add Defect Entry" to record issues.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: GARMENT MEASUREMENTS & TOLERANCES */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>5. Garment Measurement Audit (Point of Measure vs Spec)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Tolerance evaluated according to buyer size charts</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Measurement Point</th>
                <th className="p-3 text-right font-mono">Spec (inch)</th>
                <th className="p-3 text-right font-mono">Actual Sample</th>
                <th className="p-3 text-center">Allowed Tol</th>
                <th className="p-3 text-center">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {measurements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-800">{m.point}</td>
                  <td className="p-3 text-right font-mono text-slate-600">{m.spec.toFixed(1)}"</td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      step="0.1"
                      value={m.actual}
                      onChange={(e) => handleUpdateMeasurement(m.id, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 rounded-lg bg-white"
                    />
                  </td>
                  <td className="p-3 text-center font-mono text-slate-500">{m.tol}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.result === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {m.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 6: QUALITY CHECKPOINTS AUDIT */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>6. Quality Checkpoints Checklist ({checkpoints.length} verification points)</span>
          </h3>
          <span className="text-[11px] text-slate-400">Click button to toggle status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checkpoints.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {c.category}
                </span>
                <div className="text-xs font-bold text-slate-800 mt-1">{c.checkpoint}</div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleCheckpoint(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                  c.status === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                    : c.status === 'FAIL'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                    : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                }`}
              >
                {c.status === 'PASS' ? '✓ Pass' : c.status === 'FAIL' ? '✗ Fail' : '~ N/A'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7: FINAL VERDICT, REMARKS & SIGN-OFF */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>7. Final Verdict & Digital Sign-off</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Official QC Verdict</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InspectionStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
            >
              <option value="PASSED">✓ PASSED (Acceptable to Ship / Next Stage)</option>
              <option value="CONDITIONAL_PASS">~ CONDITIONAL PASS (Minor Rework Required)</option>
              <option value="REJECTED">✗ REJECTED (100% Factory Rework Mandatory)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Auditor Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Summary notes from inspection..."
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-semibold text-rose-800 mb-1">
              Corrective & Preventive Actions (CAPA) - if any issues identified
            </label>
            <textarea
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Recommended actions for production floor supervisor..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{mode === 'edit' ? 'Save Changes' : 'Save & Sign-Off Inspection'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
