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
  Scale,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import {
  InspectionRecord,
  InspectionType,
  InspectionStatus,
  InspectionStage,
  DefectItem,
  CheckpointItem,
  CombinedPoItem,
} from '@/lib/types/erp';
import { BuyerOrder } from '@/lib/types/modules';
import {
  calculateAqlInspection,
  evaluateAqlVerdict,
  calculateQuantityVariance,
  AqlCalculationResult,
  QuantityVarianceResult,
} from '@/lib/aql';
import {
  STANDARD_11_CHECKPOINTS,
  syncRecordCheckpoints,
  getDefaultCheckpoints,
} from './inspection-checkpoints';

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
  const [lotQuantity, setLotQuantity] = useState<number>(record?.lotQuantity || record?.orderQuantity || 10000);
  const [majorAqlStandard, setMajorAqlStandard] = useState<'1.0' | '1.5' | '2.5' | '4.0'>('2.5');
  const [minorAqlStandard, setMinorAqlStandard] = useState<'2.5' | '4.0'>('4.0');
  const [isSampleSizeManual, setIsSampleSizeManual] = useState<boolean>(false);

  // Auto-calculated ISO 2859-1 Level II Sampling Plan & Defect Tolerances
  const aqlCalc: AqlCalculationResult = React.useMemo(() => {
    return calculateAqlInspection(lotQuantity, majorAqlStandard, minorAqlStandard);
  }, [lotQuantity, majorAqlStandard, minorAqlStandard]);

  // Order Quantity vs Inspection Quantity Variance (Excess / Shortage)
  const qtyVariance: QuantityVarianceResult = React.useMemo(() => {
    return calculateQuantityVariance(orderQuantity, lotQuantity);
  }, [orderQuantity, lotQuantity]);

  const [cartonCount, setCartonCount] = useState<number>(record?.cartonCount || 400);
  const [packedPercent, setPackedPercent] = useState<number>(
    record?.packedPercent !== undefined ? record.packedPercent : initialType === 'FINAL' ? 100 : 70
  );
  const [aqlLevel, setAqlLevel] = useState(
    record?.aqlLevel || `AQL 2.5 General Inspection Level II (Code ${aqlCalc.codeLetter})`
  );
  const [sampleSize, setSampleSize] = useState<number>(record?.sampleSize || aqlCalc.sampleSize);

  // Automatically keep sampleSize synchronized with ISO 2859-1 AQL chart unless user explicitly sets manual override
  React.useEffect(() => {
    if (!isSampleSizeManual) {
      setSampleSize(aqlCalc.sampleSize);
    }
  }, [aqlCalc.sampleSize, isSampleSizeManual]);
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

  // Multiple POs for Combined Inspection
  const initialCombinedOrders: CombinedPoItem[] =
    record?.combinedOrders && record.combinedOrders.length > 0
      ? record.combinedOrders
      : record?.poNumbers && record.poNumbers.length > 0
      ? record.poNumbers.map((po, idx) => ({
          poNumber: po,
          orderQuantity: Math.round((record?.orderQuantity || 10000) / record.poNumbers!.length),
          cartonCount: Math.round((record?.cartonCount || 400) / record.poNumbers!.length),
          styleNumber: record?.styleNumber || 'STY-ZR-4882-09',
          colorOrDestination: `Destination 0${idx + 1}`,
        }))
      : [
          {
            poNumber: record?.orderNumber || 'PO-EXP-9920',
            orderQuantity: record?.orderQuantity || 10000,
            cartonCount: record?.cartonCount || 400,
            styleNumber: record?.styleNumber || 'STY-ZR-4882-09',
            colorOrDestination: 'Main Shipment',
          },
        ];

  const [combinedOrders, setCombinedOrders] = useState<CombinedPoItem[]>(initialCombinedOrders);
  const [isCombinedInspection, setIsCombinedInspection] = useState<boolean>(
    record?.isCombinedInspection || initialCombinedOrders.length > 1
  );

  const handleAddPo = () => {
    const nextIdx = combinedOrders.length + 1;
    const newPo: CombinedPoItem = {
      poNumber: `PO-${buyer.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'EXP'}-${Math.floor(1000 + Math.random() * 9000)}`,
      orderQuantity: 3000,
      cartonCount: 120,
      styleNumber: styleNumber,
      colorOrDestination: `Destination Split 0${nextIdx}`,
    };
    const updated = [...combinedOrders, newPo];
    setCombinedOrders(updated);
    setIsCombinedInspection(true);

    // Auto-sum Total Order Quantity from all combined POs
    const totalQty = updated.reduce((s, p) => s + (Number(p.orderQuantity) || 0), 0);
    const totalCartons = updated.reduce((s, p) => s + (Number(p.cartonCount) || 0), 0);
    setOrderQuantity(totalQty);
    setCartonCount(totalCartons);
    setOrderNumber(updated.map((p) => p.poNumber).join(', '));
  };

  const handleRemovePo = (index: number) => {
    if (combinedOrders.length <= 1) return;
    const updated = combinedOrders.filter((_, i) => i !== index);
    setCombinedOrders(updated);
    if (updated.length <= 1) {
      setIsCombinedInspection(false);
    }
    // Auto-sum Total Order Quantity from remaining POs
    const totalQty = updated.reduce((s, p) => s + (Number(p.orderQuantity) || 0), 0);
    const totalCartons = updated.reduce((s, p) => s + (Number(p.cartonCount) || 0), 0);
    setOrderQuantity(totalQty);
    setCartonCount(totalCartons);
    setOrderNumber(updated.map((p) => p.poNumber).join(', '));
  };

  const handleUpdatePo = (index: number, field: keyof CombinedPoItem, value: any) => {
    const updated = combinedOrders.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    setCombinedOrders(updated);
    if (field === 'orderQuantity' || field === 'cartonCount') {
      // Auto-sum Total Order Quantity from all POs
      const totalQty = updated.reduce((s, p) => s + (Number(p.orderQuantity) || 0), 0);
      const totalCartons = updated.reduce((s, p) => s + (Number(p.cartonCount) || 0), 0);
      setOrderQuantity(totalQty);
      setCartonCount(totalCartons);
    }
    if (field === 'poNumber') {
      setOrderNumber(updated.map((p) => p.poNumber).join(', '));
    }
  };

  const handleQuickAddBuyerOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ordId = e.target.value;
    if (!ordId) return;
    const ord = orders.find((o) => o.id === ordId);
    if (ord) {
      if (combinedOrders.some((p) => p.poNumber === ord.orderNumber)) {
        showToast(`PO ${ord.orderNumber} is already in the combined inspection.`);
        return;
      }
      const newPo: CombinedPoItem = {
        poNumber: ord.orderNumber,
        orderQuantity: ord.orderQuantity || 5000,
        cartonCount: Math.ceil((ord.orderQuantity || 5000) / 24),
        styleNumber: ord.styleNumber || styleNumber,
        colorOrDestination: `${ord.buyerName} Shipment`,
      };
      const updated = isCombinedInspection ? [...combinedOrders, newPo] : [combinedOrders[0], newPo];
      setCombinedOrders(updated);
      setIsCombinedInspection(true);
      const totalQty = updated.reduce((s, p) => s + (Number(p.orderQuantity) || 0), 0);
      const totalCartons = updated.reduce((s, p) => s + (Number(p.cartonCount) || 0), 0);
      setOrderQuantity(totalQty);
      setCartonCount(totalCartons);
      setOrderNumber(updated.map((p) => p.poNumber).join(', '));
      showToast(`Added ${ord.orderNumber} to combined inspection lot.`);
    }
  };

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

  // Checkpoints State - Standard 11 Verifications with clean Tik mark
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>(() =>
    syncRecordCheckpoints(record?.checkpoints)
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

  // Dynamic AQL Verdict Evaluation based on ISO 2859-1 Defect Allowances
  const aqlVerdictResult = React.useMemo(() => {
    return evaluateAqlVerdict(criticalCount, majorCount, minorCount, aqlCalc);
  }, [criticalCount, majorCount, minorCount, aqlCalc]);

  const computedVerdict: InspectionStatus = aqlVerdictResult.verdict;

  const [status, setStatus] = useState<InspectionStatus>(record?.status || computedVerdict);

  // Automatically update status recommendation when defects change
  React.useEffect(() => {
    setStatus(computedVerdict);
  }, [computedVerdict]);

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

  const handleToggleCheckpoint = (id: string) => {
    setCheckpoints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = c.status === 'PASS' ? 'FAIL' : 'PASS';
          return { ...c, status: next };
        }
        return c;
      })
    );
  };

  const handleMarkAllCheckpoints = (status: 'PASS' | 'FAIL') => {
    setCheckpoints((prev) => prev.map((c) => ({ ...c, status })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const poNumbers = combinedOrders.map((p) => p.poNumber.trim()).filter(Boolean);
    const finalizedRecord: InspectionRecord = {
      id: record?.id || `insp-${Date.now().toString().slice(-6)}`,
      inspectionCode,
      inspectionType,
      orderNumber: poNumbers.length > 0 ? poNumbers.join(', ') : orderNumber,
      poNumbers: poNumbers.length > 0 ? poNumbers : [orderNumber],
      combinedOrders: isCombinedInspection ? combinedOrders : undefined,
      isCombinedInspection: isCombinedInspection && combinedOrders.length > 1,
      buyerOrderId: selectedOrderId,
      styleNumber,
      styleDescription,
      lotNumber,
      stage,
      sampleSize: Number(sampleSize),
      orderQuantity: Number(orderQuantity),
      lotQuantity: Number(lotQuantity),
      excessQuantity: qtyVariance.excessQty,
      shortQuantity: qtyVariance.shortQty,
      quantityVariance: qtyVariance.diff,
      aqlCodeLetter: aqlCalc.codeLetter,
      maxAllowedMajor: aqlCalc.majorAc,
      majorRejectionPoint: aqlCalc.majorRe,
      maxAllowedMinor: aqlCalc.minorAc,
      minorRejectionPoint: aqlCalc.minorRe,
      maxAllowedCritical: 0,
      cartonCount: Number(cartonCount),
      packedPercent: Number(packedPercent),
      aqlLevel: aqlCalc.aqlStandardName,
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
      measurements: [],
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

      {/* SECTION 1: ORDER & PRODUCT SPECIFICATION (WITH COMBINED MULTI-PO SUPPORT) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Order & Product Specification
            </h3>
            {isCombinedInspection && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                ⚡ Combined ({combinedOrders.length} POs)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Switch Tabs */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsCombinedInspection(false);
                  if (combinedOrders.length > 1) {
                    setCombinedOrders([combinedOrders[0]]);
                    setOrderNumber(combinedOrders[0].poNumber);
                    setOrderQuantity(combinedOrders[0].orderQuantity);
                    setLotQuantity(combinedOrders[0].orderQuantity);
                    setCartonCount(combinedOrders[0].cartonCount || 400);
                  }
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  !isCombinedInspection
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single PO
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCombinedInspection(true);
                  if (combinedOrders.length === 1) {
                    handleAddPo();
                  }
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isCombinedInspection
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Combine Multiple POs</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                  {combinedOrders.length}
                </span>
              </button>
            </div>

            {/* Quick Link Buyer Order Dropdown */}
            {orders.length > 0 && (
              <select
                value=""
                onChange={handleQuickAddBuyerOrder}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-700 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">+ Quick Add Active PO...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    + {o.orderNumber} ({o.buyerName} - {o.orderQuantity.toLocaleString()} pcs)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* COMBINED MULTI-PO LOT SECTION */}
        {isCombinedInspection ? (
          <div className="space-y-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Combined Purchase Orders in this Inspection Lot</span>
                </h4>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Combine multiple POs into one unified audit. AQL 2.5 sample sizes and defect rates automatically apply to the combined sum.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddPo}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another PO</span>
              </button>
            </div>

            {/* Combined POs Table */}
            <div className="overflow-x-auto bg-white rounded-lg border border-indigo-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-indigo-50/70 text-indigo-900 border-b border-indigo-200 font-semibold">
                    <th className="py-2 px-3 w-10">#</th>
                    <th className="py-2 px-3">Purchase Order (PO#)</th>
                    <th className="py-2 px-3">Style Reference</th>
                    <th className="py-2 px-3">Order Qty (pcs)</th>
                    <th className="py-2 px-3">Carton Count</th>
                    <th className="py-2 px-3">Split / Color / Destination</th>
                    <th className="py-2 px-2 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {combinedOrders.map((po, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-400 text-center">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={po.poNumber}
                          onChange={(e) => handleUpdatePo(idx, 'poNumber', e.target.value)}
                          placeholder="e.g. PO-ZR-1049"
                          className="w-full px-2.5 py-1 text-xs font-mono font-bold text-indigo-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={po.styleNumber || styleNumber}
                          onChange={(e) => handleUpdatePo(idx, 'styleNumber', e.target.value)}
                          placeholder="Style #"
                          className="w-full px-2.5 py-1 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          value={po.orderQuantity}
                          onChange={(e) =>
                            handleUpdatePo(idx, 'orderQuantity', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-28 px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={po.cartonCount || 0}
                          onChange={(e) =>
                            handleUpdatePo(idx, 'cartonCount', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-20 px-2.5 py-1 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={po.colorOrDestination || ''}
                          onChange={(e) =>
                            handleUpdatePo(idx, 'colorOrDestination', e.target.value)
                          }
                          placeholder="e.g. Navy / USA Outlet"
                          className="w-full px-2.5 py-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          disabled={combinedOrders.length <= 1}
                          onClick={() => handleRemovePo(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                          title="Remove PO from Combined Lot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Combined Totals Footer */}
              <div className="bg-indigo-50/50 px-4 py-2.5 border-t border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <span className="font-semibold text-indigo-900">
                  Combined Lot Aggregate Totals:
                </span>
                <div className="flex items-center gap-4 font-mono font-bold text-indigo-950">
                  <span>
                    Total Combined Units:{' '}
                    <span className="text-emerald-700 text-sm">
                      {orderQuantity.toLocaleString()} pcs
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    Total Cartons:{' '}
                    <span className="text-blue-700 text-sm">{cartonCount} boxes</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80 flex items-center justify-between text-xs">
            <span className="text-blue-800">
              Auditing a single purchase order. Need to inspect multiple POs together?
            </span>
            <button
              type="button"
              onClick={() => {
                setIsCombinedInspection(true);
                handleAddPo();
              }}
              className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enable Combined Multi-PO Audit</span>
            </button>
          </div>
        )}

        {/* STYLE, BUYER, LOT AND DESCRIPTION FIELDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {!isCombinedInspection && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Order (PO#)</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value);
                  setCombinedOrders([
                    {
                      ...combinedOrders[0],
                      poNumber: e.target.value,
                    },
                  ]);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                required
              />
            </div>
          )}

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

          <div className={isCombinedInspection ? 'sm:col-span-3' : 'sm:col-span-2'}>
            <label className="block font-semibold text-slate-700 mb-1">Garment Style Description</label>
            <input
              type="text"
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Mens 100% Cotton Polo Shirt with Flatknit Collar"
            />
          </div>

          {!isCombinedInspection ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Total Order Quantity (Pcs)</label>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Auto / Order
                </span>
              </div>
              <input
                type="number"
                min="1"
                value={orderQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setOrderQuantity(val);
                  setCombinedOrders([
                    {
                      ...combinedOrders[0],
                      orderQuantity: val,
                    },
                  ]);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Total Order Quantity (Pcs)</label>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ⚡ Auto Summed
                </span>
              </div>
              <div className="w-full px-3 py-2 border border-indigo-200 rounded-xl bg-indigo-50/60 font-mono font-black text-indigo-950 text-sm flex items-center justify-between">
                <span>{orderQuantity.toLocaleString()} pcs</span>
                <span className="text-[10px] font-normal text-indigo-600">({combinedOrders.length} POs)</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-blue-900">
                Total Inspection Quantity (Offered Lot)
              </label>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Manual Input
              </span>
            </div>
            <input
              type="number"
              min="1"
              value={lotQuantity}
              onChange={(e) => setLotQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3 py-2 border border-blue-300 rounded-xl bg-blue-50/40 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700 text-sm"
              placeholder="Enter presented lot size"
              required
            />
          </div>
        </div>

        {/* INTERACTIVE QUANTITY RECONCILIATION & EXCESS / SHORTAGE CARD */}
        <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 shadow-2xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Quantity Reconciliation &amp; Variance Engine
                </h4>
                <p className="text-[11px] text-slate-500">
                  Total Order Quantity vs Total Inspection Quantity (Presented). Excess or shortage is automatically calculated.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLotQuantity(orderQuantity);
                showToast('Synchronized Total Inspection Quantity to match Order Quantity (100% offered).');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="Set Presented Inspection Quantity equal to Total Order Quantity"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Presented = Order Qty</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Total Order Quantity */}
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Order Quantity (Auto)</div>
              <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                {orderQuantity.toLocaleString()} <span className="text-xs font-medium text-slate-500">pcs</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {isCombinedInspection ? `Summed from ${combinedOrders.length} combined POs` : `Linked buyer order`}
              </div>
            </div>

            {/* Total Inspection Quantity */}
            <div className="p-3 bg-white rounded-xl border border-blue-300 ring-2 ring-blue-500/10">
              <div className="text-[10px] text-blue-700 font-bold uppercase">Total Inspection Qty (Manual Presented)</div>
              <div className="text-lg font-black font-mono text-blue-700 mt-0.5">
                {lotQuantity.toLocaleString()} <span className="text-xs font-medium text-slate-500">pcs</span>
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5">
                Offered by sewing/finishing line for audit
              </div>
            </div>

            {/* Excess / Shortage Quantity */}
            <div className={`p-3 rounded-xl border ${qtyVariance.badgeCls}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {qtyVariance.isExcess ? 'Excess Quantity (+)' : qtyVariance.isShort ? 'Short Quantity (-)' : 'Variance'}
                </span>
                {qtyVariance.isExcess && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    <TrendingUp className="w-3 h-3" /> Overproduction
                  </span>
                )}
                {qtyVariance.isShort && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                    <TrendingDown className="w-3 h-3" /> Shortage
                  </span>
                )}
                {qtyVariance.isExact && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    Exact Match
                  </span>
                )}
              </div>

              <div className="text-lg font-black font-mono mt-0.5">
                {qtyVariance.isExcess && `+${qtyVariance.excessQty.toLocaleString()} pcs`}
                {qtyVariance.isShort && `-${qtyVariance.shortQty.toLocaleString()} pcs`}
                {qtyVariance.isExact && '0 pcs variance'}
              </div>

              <div className="text-[10px] font-medium mt-0.5">
                {qtyVariance.isExcess && <span>Overproduction rate: +{qtyVariance.percentage}% against PO</span>}
                {qtyVariance.isShort && <span>Shortage: {qtyVariance.percentage}% below order quantity</span>}
                {qtyVariance.isExact && <span>100% of order quantity presented for inspection</span>}
              </div>
            </div>
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

      {/* SECTION 3: AQL 2.5 SAMPLING CALCULATOR & DEFECT TOLERANCES */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. ISO 2859-1 / ANSI/ASQ Z1.4 Level II AQL Sampling Engine
              </h3>
              <p className="text-[11px] text-slate-500">
                Code Letter: <strong className="text-slate-900 font-mono">Code {aqlCalc.codeLetter}</strong> • Auto Sample Size: <strong className="text-blue-700 font-mono">{sampleSize} pcs</strong> (Based on offered lot of {lotQuantity.toLocaleString()} pcs)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                computedVerdict === 'PASSED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : computedVerdict === 'CONDITIONAL_PASS'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-rose-100 text-rose-800 border-rose-200'
              }`}
            >
              AQL Verdict: {computedVerdict.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* AQL Chart Parameters & Defect Allowances Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Major AQL Standard */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Major Defects AQL Standard
            </label>
            <select
              value={majorAqlStandard}
              onChange={(e) => setMajorAqlStandard(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="2.5">AQL 2.5 (Industry Garment Standard)</option>
              <option value="1.5">AQL 1.5 (Strict Quality Standard)</option>
              <option value="1.0">AQL 1.0 (Luxury / Tailored)</option>
              <option value="4.0">AQL 4.0 (Relaxed Standard)</option>
            </select>
          </div>

          {/* Minor AQL Standard */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Minor Defects AQL Standard
            </label>
            <select
              value={minorAqlStandard}
              onChange={(e) => setMinorAqlStandard(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="4.0">AQL 4.0 (Normal Garments Standard)</option>
              <option value="2.5">AQL 2.5 (Strict Cosmetic Standard)</option>
            </select>
          </div>

          {/* Sample Size (Auto with manual override option) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Sample Size (Pcs)</label>
              <span className="text-[10px] text-blue-600 font-bold">Auto AQL</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={sampleSize}
                onChange={(e) => {
                  setIsSampleSizeManual(true);
                  setSampleSize(parseInt(e.target.value, 10) || 1);
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-xl bg-blue-50/40 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-black text-blue-900 text-sm"
              />
              {isSampleSizeManual && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSampleSizeManual(false);
                    setSampleSize(aqlCalc.sampleSize);
                  }}
                  className="absolute right-2 top-2 text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Reset Auto
                </button>
              )}
            </div>
          </div>

          {/* Good Units Passed & Pass Rate */}
          <div>
            <label className="block font-semibold text-emerald-700 mb-1">Good Units Passed</label>
            <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 font-mono font-black text-emerald-800 text-sm flex items-center justify-between">
              <span>{passCount} / {sampleSize} pcs</span>
              <span className="text-xs font-bold text-emerald-600">
                {sampleSize > 0 ? ((passCount / sampleSize) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* AQL DEFECT ALLOWANCE THRESHOLDS DISPLAY (CRITICAL, MAJOR, MINOR) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Critical Defect Allowance */}
          <div className={`p-3.5 rounded-xl border text-xs ${criticalCount > 0 ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1">
                <span>🚨</span> Critical Flaws
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${criticalCount > 0 ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'}`}>
                {criticalCount > 0 ? 'REJECTED' : 'PASSED'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-mono text-xl font-black">
                {criticalCount} <span className="text-xs font-normal text-slate-500">found</span>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-600">
                Max Allowed: <strong className="text-slate-900 font-bold">{aqlCalc.criticalAc}</strong> (Re: {aqlCalc.criticalRe})
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Zero tolerance policy: 1 critical defect immediately fails the entire lot.
            </div>
          </div>

          {/* Major Defect Allowance */}
          <div className={`p-3.5 rounded-xl border text-xs ${majorCount >= aqlCalc.majorRe ? 'bg-rose-50 border-rose-300 text-rose-900' : majorCount === aqlCalc.majorAc ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-emerald-50/50 border-emerald-200 text-slate-800'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1">
                <span>⚠️</span> Major Defect Allowance (AQL {majorAqlStandard})
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${majorCount >= aqlCalc.majorRe ? 'bg-rose-200 text-rose-900' : majorCount === aqlCalc.majorAc ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                {majorCount >= aqlCalc.majorRe ? 'EXCEEDED' : majorCount === aqlCalc.majorAc ? 'AT LIMIT' : 'WITHIN LIMIT'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-mono text-xl font-black">
                {majorCount} <span className="text-xs font-normal text-slate-500">/ {aqlCalc.majorAc} Max Allowed</span>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-600">
                Accept (Ac): <strong className="text-emerald-700">{aqlCalc.majorAc}</strong> • Reject (Re): <strong className="text-rose-700">{aqlCalc.majorRe}</strong>
              </div>
            </div>
            {/* Visual Allowance Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${majorCount >= aqlCalc.majorRe ? 'bg-rose-600' : majorCount >= aqlCalc.majorAc * 0.7 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                style={{ width: `${Math.min(100, (majorCount / Math.max(1, aqlCalc.majorRe)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Minor Defect Allowance */}
          <div className={`p-3.5 rounded-xl border text-xs ${minorCount >= aqlCalc.minorRe ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1">
                <span>ℹ️</span> Minor Defect Allowance (AQL {minorAqlStandard})
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${minorCount >= aqlCalc.minorRe ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'}`}>
                {minorCount >= aqlCalc.minorRe ? 'EXCEEDED' : 'WITHIN LIMIT'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="font-mono text-xl font-black">
                {minorCount} <span className="text-xs font-normal text-slate-500">/ {aqlCalc.minorAc} Max Allowed</span>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-600">
                Accept (Ac): <strong className="text-emerald-700">{aqlCalc.minorAc}</strong> • Reject (Re): <strong className="text-rose-700">{aqlCalc.minorRe}</strong>
              </div>
            </div>
            {/* Visual Allowance Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${minorCount >= aqlCalc.minorRe ? 'bg-rose-600' : 'bg-blue-600'}`}
                style={{ width: `${Math.min(100, (minorCount / Math.max(1, aqlCalc.minorRe)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Verdict Reason Banner */}
        <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          computedVerdict === 'PASSED'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : computedVerdict === 'CONDITIONAL_PASS'
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {computedVerdict === 'PASSED' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : computedVerdict === 'CONDITIONAL_PASS' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{aqlVerdictResult.reason}</span>
          </div>
          <span className="font-mono text-[11px] text-slate-600 font-bold shrink-0">
            {aqlCalc.aqlStandardName}
          </span>
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

      {/* SECTION 5: INSPECTION CHECKPOINTS VERIFICATION (11 CHECKPOINTS WITH TIK MARK) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                5. Inspection Checkpoints Verification ({checkpoints.filter((c) => c.status === 'PASS').length} of {checkpoints.length} Tik OK ✓)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click individual checkpoint or toggle quick action to verify all checkpoints
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAllCheckpoints('PASS')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tik All ✓ OK</span>
            </button>
            <button
              type="button"
              onClick={() => handleMarkAllCheckpoints('FAIL')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {checkpoints.map((c, idx) => {
            const isPass = c.status === 'PASS';
            return (
              <div
                key={c.id || idx}
                onClick={() => handleToggleCheckpoint(c.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                  isPass
                    ? 'bg-emerald-50/50 border-emerald-200/90 hover:bg-emerald-50 hover:border-emerald-300'
                    : 'bg-rose-50/50 border-rose-200/90 hover:bg-rose-50 hover:border-rose-300'
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCheckpoint(c.id);
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                      isPass
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isPass ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>✓ OK</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>✗ Issue</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 6: FINAL VERDICT, REMARKS & SIGN-OFF */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>6. Final Verdict & Digital Sign-off</span>
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
