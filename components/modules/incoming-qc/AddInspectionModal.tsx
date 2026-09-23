'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Boxes,
  Scissors,
  Sparkles,
  Tag,
  Package,
  Plus,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { InventoryItem, MaterialCategory, QualityGrade } from '@/lib/types/erp';
import { IncomingQCLot, DefectFinding } from '@/lib/types/modules';

interface AddInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lot: IncomingQCLot, syncToInventory?: boolean) => void;
  inventoryItems?: InventoryItem[];
  initialData?: IncomingQCLot | null;
}

const PROTOCOL_OPTIONS: Record<
  MaterialCategory,
  { method: string; standard: string; defaultLimit: string }
> = {
  FABRIC: {
    method: 'ASTM_D5430_4_POINT',
    standard: 'ASTM D5430 4-Point System (Limit: 28 pts/100 sq.yd)',
    defaultLimit: '≤ 28 points / 100 sq. yd',
  },
  SEWING_THREAD: {
    method: 'ASTM_D204_THREAD',
    standard: 'ASTM D204 / ISO 2062 Tensile & 5,000 RPM Sewability',
    defaultLimit: 'Tensile ≥ 35.0 cN/dtex, 0 breaks/100m',
  },
  ZIPPERS: {
    method: 'ASTM_D2061_ZIPPER',
    standard: 'ASTM D2061 / BS 3084 Chain Strength & Slider Locking',
    defaultLimit: 'Chain ≥ 350N, Slider lock ≥ 60N',
  },
  TRIMS_BUTTONS: {
    method: 'ASTM_F963_BUTTON',
    standard: 'ASTM F963 / 16 CFR 1500 (90N Pull Test & Impact)',
    defaultLimit: 'Pull force ≥ 90N held 10s',
  },
  INTERLINING_ELASTIC: {
    method: 'DIN_54310_INTERLINING',
    standard: 'DIN 54310 / ISO 6330 Fusing Peel Strength',
    defaultLimit: 'Peel strength ≥ 12.0 N/5cm, Shrinkage < 1.5%',
  },
  LABELS_PACKAGING: {
    method: 'TAPPI_T810_PACKAGING',
    standard: 'TAPPI T810 Mullen Bursting & 10-Point Drop Test',
    defaultLimit: 'Carton bursting ≥ 1200 kPa, Barcode Grade A/B',
  },
  CHEMICALS_DYES: {
    method: 'ISO_3071_PH_CONCENTRATION',
    standard: 'ISO 3071 pH Value & Concentration Purity',
    defaultLimit: 'pH 6.0 - 7.5, Purity ≥ 98%',
  },
};

export function AddInspectionModal({
  isOpen,
  onClose,
  onSave,
  inventoryItems = [],
  initialData,
}: AddInspectionModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [syncToInventory, setSyncToInventory] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    lotNumber: '',
    inventoryItemId: '',
    inventorySku: '',
    materialCategory: 'FABRIC' as MaterialCategory,
    materialName: '',
    supplierName: '',
    poNumber: 'PO-HM-99201',
    styleNumber: 'STY-HM-2026-01',
    receivedQuantity: 1000,
    unit: 'Meters',
    inspectedQuantity: 100,
    inspectionMethod: 'ASTM_D5430_4_POINT',
    aqlStandard: 'ASTM 4-Point System (Limit: 28 pts/100 sq.yd)',
    // Fabric params
    pointsPer100SqYd: 14.0,
    actualGsm: 180,
    targetGsm: 180,
    rollWidthInches: 60,
    deltaE: 0.4,
    bowingPercent: 1.0,
    rollsInspected: 5,
    // Thread params
    tensileStrengthCndtex: 38.0,
    elongationPercent: 18.0,
    tpiTwistPerInch: 28.0,
    sewabilityBreaksPer100m: 0,
    // Zipper params
    chainCrosswiseStrengthN: 420,
    sliderLockStrengthN: 80,
    reciprocityCycles500: true,
    // Button params
    pullForceNewtons: 110,
    holdingTimeSeconds: 10,
    impactPassed: true,
    ligneSize: 24,
    // Interlining params
    fusingPeelStrengthN5cm: 15.0,
    washShrinkagePercent: 0.8,
    elasticRecoveryPercent: 95.0,
    // Packaging params
    burstingStrengthKpa: 1400,
    dropTestPassed: true,
    barcodeGrade: 'A' as 'A' | 'B' | 'C' | 'FAIL',
    // Outcome
    result: 'ACCEPTED' as 'ACCEPTED' | 'REJECTED' | 'CONDITIONAL_ACCEPT',
    qualityGradeAssigned: 'GRADE_A' as QualityGrade,
    inspectorName: 'Kazi Farhan (Senior QC)',
    inspectionDate: new Date().toISOString().split('T')[0],
    shadeEvaluation: 'MATCH_APPROVED_SWATCH' as any,
    notes: '',
  });

  const [defectsList, setDefectsList] = useState<DefectFinding[]>([]);
  const [newDefect, setNewDefect] = useState({
    defectName: '',
    count: 1,
    points: 1,
    severity: 'MINOR' as 'CRITICAL' | 'MAJOR' | 'MINOR',
  });

  // Populate from initialData or set defaults
  useEffect(() => {
    if (initialData) {
      setFormData({
        lotNumber: initialData.lotNumber || '',
        inventoryItemId: initialData.inventoryItemId || '',
        inventorySku: initialData.inventorySku || '',
        materialCategory: initialData.materialCategory || 'FABRIC',
        materialName: initialData.materialName || '',
        supplierName: initialData.supplierName || '',
        poNumber: initialData.poNumber || '',
        styleNumber: initialData.styleNumber || '',
        receivedQuantity: initialData.receivedQuantity || 1000,
        unit: initialData.unit || 'Meters',
        inspectedQuantity: initialData.inspectedQuantity || 100,
        inspectionMethod: initialData.inspectionMethod || 'ASTM_D5430_4_POINT',
        aqlStandard: initialData.aqlStandard || '',
        pointsPer100SqYd: initialData.pointsPer100SqYd || 14,
        actualGsm: initialData.actualGsm || 180,
        targetGsm: initialData.targetGsm || 180,
        rollWidthInches: initialData.rollWidthInches || 60,
        deltaE: initialData.deltaE || 0.4,
        bowingPercent: initialData.bowingPercent || 1.0,
        rollsInspected: initialData.rollsInspected || 5,
        tensileStrengthCndtex: initialData.tensileStrengthCndtex || 38,
        elongationPercent: initialData.elongationPercent || 18,
        tpiTwistPerInch: initialData.tpiTwistPerInch || 28,
        sewabilityBreaksPer100m: initialData.sewabilityBreaksPer100m || 0,
        chainCrosswiseStrengthN: initialData.chainCrosswiseStrengthN || 420,
        sliderLockStrengthN: initialData.sliderLockStrengthN || 80,
        reciprocityCycles500: initialData.reciprocityCycles500 ?? true,
        pullForceNewtons: initialData.pullForceNewtons || 110,
        holdingTimeSeconds: initialData.holdingTimeSeconds || 10,
        impactPassed: initialData.impactPassed ?? true,
        ligneSize: initialData.ligneSize || 24,
        fusingPeelStrengthN5cm: initialData.fusingPeelStrengthN5cm || 15,
        washShrinkagePercent: initialData.washShrinkagePercent || 0.8,
        elasticRecoveryPercent: initialData.elasticRecoveryPercent || 95,
        burstingStrengthKpa: initialData.burstingStrengthKpa || 1400,
        dropTestPassed: initialData.dropTestPassed ?? true,
        barcodeGrade: initialData.barcodeGrade || 'A',
        result: initialData.result || 'ACCEPTED',
        qualityGradeAssigned: initialData.qualityGradeAssigned || 'GRADE_A',
        inspectorName: initialData.inspectorName || 'Kazi Farhan (Senior QC)',
        inspectionDate: initialData.inspectionDate || new Date().toISOString().split('T')[0],
        shadeEvaluation: initialData.shadeEvaluation || 'MATCH_APPROVED_SWATCH',
        notes: initialData.notes || '',
      });
      setSelectedItemId(initialData.inventoryItemId || '');
      setDefectsList(initialData.defectsList || []);
    } else {
      setFormData((prev) => ({
        ...prev,
        lotNumber: `LOT-QC-${Math.floor(1000 + Math.random() * 9000)}`,
      }));
      setDefectsList([]);
    }
  }, [initialData, isOpen]);

  // When inventory item is selected, auto-populate details & appropriate testing protocol
  const handleSelectInventoryItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = inventoryItems.find((i) => i.id === itemId);
    if (!item) return;

    const cat = item.category || 'FABRIC';
    const proto = PROTOCOL_OPTIONS[cat] || PROTOCOL_OPTIONS.FABRIC;

    setFormData((prev) => ({
      ...prev,
      inventoryItemId: item.id,
      inventorySku: item.sku,
      materialCategory: cat,
      materialName: item.fabricType,
      supplierName: item.supplierName || 'Pacific Textiles Mills Ltd',
      styleNumber: item.styleNumber || 'STY-HM-2026-01',
      receivedQuantity: item.quantityMeters,
      unit: item.unit || 'Meters',
      inspectedQuantity: Math.max(1, Math.round(item.quantityMeters * 0.1)),
      lotNumber: item.batchLot || prev.lotNumber,
      inspectionMethod: proto.method,
      aqlStandard: proto.standard,
      actualGsm: item.gsm || 180,
      targetGsm: item.gsm || 180,
      rollWidthInches: item.widthInches || 60,
    }));
  };

  if (!isOpen) return null;

  const handleAddDefect = () => {
    if (!newDefect.defectName.trim()) return;
    setDefectsList([...defectsList, { ...newDefect, id: `def-${Date.now()}` }]);
    setNewDefect({ defectName: '', count: 1, points: 1, severity: 'MINOR' });
  };

  const handleRemoveDefect = (index: number) => {
    setDefectsList(defectsList.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalDefectCount = defectsList.reduce((sum, d) => sum + d.count, 0);

    const record: IncomingQCLot = {
      id: initialData?.id || `iqc-${Date.now()}`,
      lotNumber: formData.lotNumber,
      inventoryItemId: formData.inventoryItemId || selectedItemId,
      inventorySku: formData.inventorySku,
      materialCategory: formData.materialCategory,
      materialName: formData.materialName,
      materialType: formData.materialCategory,
      supplierName: formData.supplierName,
      poNumber: formData.poNumber,
      styleNumber: formData.styleNumber,
      receivedQuantity: Number(formData.receivedQuantity),
      unit: formData.unit,
      inspectedQuantity: Number(formData.inspectedQuantity),
      inspectionMethod: formData.inspectionMethod,
      aqlStandard: formData.aqlStandard,
      pointsPer100SqYd: formData.materialCategory === 'FABRIC' ? Number(formData.pointsPer100SqYd) : undefined,
      actualGsm: formData.materialCategory === 'FABRIC' ? Number(formData.actualGsm) : undefined,
      targetGsm: formData.materialCategory === 'FABRIC' ? Number(formData.targetGsm) : undefined,
      gsmVariancePercent:
        formData.materialCategory === 'FABRIC' && formData.targetGsm
          ? Math.round(Math.abs((Number(formData.actualGsm) - Number(formData.targetGsm)) / Number(formData.targetGsm)) * 1000) / 10
          : undefined,
      rollWidthInches: formData.materialCategory === 'FABRIC' ? Number(formData.rollWidthInches) : undefined,
      deltaE: formData.materialCategory === 'FABRIC' ? Number(formData.deltaE) : undefined,
      bowingPercent: formData.materialCategory === 'FABRIC' ? Number(formData.bowingPercent) : undefined,
      rollsInspected: formData.materialCategory === 'FABRIC' ? Number(formData.rollsInspected) : undefined,
      tensileStrengthCndtex: formData.materialCategory === 'SEWING_THREAD' ? Number(formData.tensileStrengthCndtex) : undefined,
      elongationPercent: formData.materialCategory === 'SEWING_THREAD' ? Number(formData.elongationPercent) : undefined,
      tpiTwistPerInch: formData.materialCategory === 'SEWING_THREAD' ? Number(formData.tpiTwistPerInch) : undefined,
      sewabilityBreaksPer100m: formData.materialCategory === 'SEWING_THREAD' ? Number(formData.sewabilityBreaksPer100m) : undefined,
      chainCrosswiseStrengthN: formData.materialCategory === 'ZIPPERS' ? Number(formData.chainCrosswiseStrengthN) : undefined,
      sliderLockStrengthN: formData.materialCategory === 'ZIPPERS' ? Number(formData.sliderLockStrengthN) : undefined,
      reciprocityCycles500: formData.materialCategory === 'ZIPPERS' ? formData.reciprocityCycles500 : undefined,
      pullForceNewtons: formData.materialCategory === 'TRIMS_BUTTONS' ? Number(formData.pullForceNewtons) : undefined,
      holdingTimeSeconds: formData.materialCategory === 'TRIMS_BUTTONS' ? Number(formData.holdingTimeSeconds) : undefined,
      impactPassed: formData.materialCategory === 'TRIMS_BUTTONS' ? formData.impactPassed : undefined,
      ligneSize: formData.materialCategory === 'TRIMS_BUTTONS' ? Number(formData.ligneSize) : undefined,
      fusingPeelStrengthN5cm: formData.materialCategory === 'INTERLINING_ELASTIC' ? Number(formData.fusingPeelStrengthN5cm) : undefined,
      washShrinkagePercent: formData.materialCategory === 'INTERLINING_ELASTIC' ? Number(formData.washShrinkagePercent) : undefined,
      elasticRecoveryPercent: formData.materialCategory === 'INTERLINING_ELASTIC' ? Number(formData.elasticRecoveryPercent) : undefined,
      burstingStrengthKpa: formData.materialCategory === 'LABELS_PACKAGING' ? Number(formData.burstingStrengthKpa) : undefined,
      dropTestPassed: formData.materialCategory === 'LABELS_PACKAGING' ? formData.dropTestPassed : undefined,
      barcodeGrade: formData.materialCategory === 'LABELS_PACKAGING' ? formData.barcodeGrade : undefined,
      defectCount: totalDefectCount,
      defectsList: defectsList,
      result: formData.result,
      qualityGradeAssigned: formData.qualityGradeAssigned,
      inspectorName: formData.inspectorName,
      inspectionDate: formData.inspectionDate,
      shadeEvaluation: formData.shadeEvaluation,
      notes: formData.notes,
    };

    onSave(record, syncToInventory);
    onClose();
  };

  const cat = formData.materialCategory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header matching Buyer & Order module */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {initialData ? 'Edit Incoming QC Inspection' : 'New Incoming Material Inspection'}
              </h3>
              <p className="text-xs text-blue-100">
                Execute material-specific testing protocol and synchronize quality grade
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: LINK TO INVENTORY ITEM */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>Link to In-Stock Raw Material (Inventory)</span>
              </span>
              <label className="flex items-center gap-2 text-xs font-semibold text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToInventory}
                  onChange={(e) => setSyncToInventory(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Auto-sync QC verdict to Inventory Grade</span>
              </label>
            </div>

            <select
              value={selectedItemId}
              onChange={(e) => handleSelectInventoryItem(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
            >
              <option value="">-- Choose Raw Material Item to Inspect --</option>
              {inventoryItems.map((itm) => (
                <option key={itm.id} value={itm.id}>
                  [{itm.category || 'FABRIC'}] {itm.sku} - {itm.fabricType} ({itm.color}) • Stock: {itm.quantityMeters} {itm.unit || 'm'} • Lot: {itm.batchLot}
                </option>
              ))}
            </select>
          </div>

          {/* SECTION 2: BASIC SHIPMENT INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Inspection / Lot Number *
              </label>
              <input
                type="text"
                value={formData.lotNumber}
                onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Material Category *
              </label>
              <select
                value={formData.materialCategory}
                onChange={(e) => {
                  const newCat = e.target.value as MaterialCategory;
                  const proto = PROTOCOL_OPTIONS[newCat] || PROTOCOL_OPTIONS.FABRIC;
                  setFormData({
                    ...formData,
                    materialCategory: newCat,
                    inspectionMethod: proto.method,
                    aqlStandard: proto.standard,
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              >
                <option value="FABRIC">Fabric (Knit/Woven)</option>
                <option value="SEWING_THREAD">Sewing Thread</option>
                <option value="ZIPPERS">Zippers & Fasteners</option>
                <option value="TRIMS_BUTTONS">Trims & Buttons / Rivets</option>
                <option value="INTERLINING_ELASTIC">Interlining & Elastic</option>
                <option value="LABELS_PACKAGING">Packaging, Polybags & Labels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Testing Protocol Standard *
              </label>
              <input
                type="text"
                value={formData.aqlStandard}
                onChange={(e) => setFormData({ ...formData, aqlStandard: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supplier / Mill *
              </label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Received Quantity & Unit
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={formData.receivedQuantity}
                  onChange={(e) => setFormData({ ...formData, receivedQuantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <span className="px-2.5 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
                  {formData.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sample Size Inspected *
              </label>
              <input
                type="number"
                step="any"
                value={formData.inspectedQuantity}
                onChange={(e) => setFormData({ ...formData, inspectedQuantity: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
              />
            </div>
          </div>

          {/* SECTION 3: DYNAMIC MATERIAL-SPECIFIC TEST READINGS */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Material Technical Test Parameters:</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px]">
                  {cat}
                </span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Standard: {PROTOCOL_OPTIONS[cat]?.defaultLimit}
              </span>
            </div>

            {/* FABRIC: ASTM D5430 (4-Point System, GSM, Delta E, Bowing) */}
            {cat === 'FABRIC' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4-Point Penalty Score *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.pointsPer100SqYd}
                    onChange={(e) => setFormData({ ...formData, pointsPer100SqYd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-500">Max limit: 28.0 pts</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Actual GSM (Cut Weight)
                  </label>
                  <input
                    type="number"
                    value={formData.actualGsm}
                    onChange={(e) => setFormData({ ...formData, actualGsm: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Target: {formData.targetGsm} GSM (±5%)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CIE Shade Delta E (D65)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.deltaE}
                    onChange={(e) => setFormData({ ...formData, deltaE: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Tolerance: ΔE ≤ 0.8</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Weft Bowing & Skewing %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bowingPercent}
                    onChange={(e) => setFormData({ ...formData, bowingPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Max limit: &lt; 3.0%</span>
                </div>
              </div>
            )}

            {/* SEWING THREAD: ASTM D204 (Tensile Breaking Force, Elongation, TPI, Sewability) */}
            {cat === 'SEWING_THREAD' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tensile Strength (cN/dtex) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tensileStrengthCndtex}
                    onChange={(e) => setFormData({ ...formData, tensileStrengthCndtex: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-500">Standard: ≥ 35.0 cN/dtex</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Elongation % at Break
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.elongationPercent}
                    onChange={(e) => setFormData({ ...formData, elongationPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Range: 15% - 22%</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Twist per Inch (TPI)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tpiTwistPerInch}
                    onChange={(e) => setFormData({ ...formData, tpiTwistPerInch: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Target: 28 ± 2 TPI</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    5,000 RPM Sewability Breaks
                  </label>
                  <input
                    type="number"
                    value={formData.sewabilityBreaksPer100m}
                    onChange={(e) => setFormData({ ...formData, sewabilityBreaksPer100m: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Req: 0 breaks / 100m run</span>
                </div>
              </div>
            )}

            {/* ZIPPERS: ASTM D2061 (Crosswise Chain Strength, Slider Locking, Reciprocity) */}
            {cat === 'ZIPPERS' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Crosswise Chain Strength (N) *
                  </label>
                  <input
                    type="number"
                    value={formData.chainCrosswiseStrengthN}
                    onChange={(e) => setFormData({ ...formData, chainCrosswiseStrengthN: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-500">Standard: ≥ 350 N</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slider Lock Holding Force (N)
                  </label>
                  <input
                    type="number"
                    value={formData.sliderLockStrengthN}
                    onChange={(e) => setFormData({ ...formData, sliderLockStrengthN: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Standard: ≥ 60 N</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    500 Cycle Reciprocity Test
                  </label>
                  <select
                    value={formData.reciprocityCycles500 ? 'PASS' : 'FAIL'}
                    onChange={(e) => setFormData({ ...formData, reciprocityCycles500: e.target.value === 'PASS' })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="PASS">PASSED (500 open/close cycles)</option>
                    <option value="FAIL">FAILED (Teeth jam or separation)</option>
                  </select>
                </div>
              </div>
            )}

            {/* BUTTONS / RIVETS: ASTM F963 (90N Pull Test, Impact Shatter, Ligne Size) */}
            {cat === 'TRIMS_BUTTONS' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pull-Off Attachment Force (N) *
                  </label>
                  <input
                    type="number"
                    value={formData.pullForceNewtons}
                    onChange={(e) => setFormData({ ...formData, pullForceNewtons: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-500">Requirement: ≥ 90 N (21 lbs)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Holding Time Duration
                  </label>
                  <input
                    type="number"
                    value={formData.holdingTimeSeconds}
                    onChange={(e) => setFormData({ ...formData, holdingTimeSeconds: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Standard: 10 seconds continuous</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Impact Shatter Resistance
                  </label>
                  <select
                    value={formData.impactPassed ? 'PASS' : 'FAIL'}
                    onChange={(e) => setFormData({ ...formData, impactPassed: e.target.value === 'PASS' })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="PASS">PASSED (No rim chip or shatter)</option>
                    <option value="FAIL">FAILED (Cracked/shattered)</option>
                  </select>
                </div>
              </div>
            )}

            {/* INTERLINING / ELASTIC: DIN 54310 (Fusing Peel Strength, Wash Shrinkage) */}
            {cat === 'INTERLINING_ELASTIC' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fusing Peel Strength (N/5cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fusingPeelStrengthN5cm}
                    onChange={(e) => setFormData({ ...formData, fusingPeelStrengthN5cm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-500">Requirement: ≥ 12.0 N/5cm</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wash Shrinkage % (ISO 6330)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.washShrinkagePercent}
                    onChange={(e) => setFormData({ ...formData, washShrinkagePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Tolerance: &lt; 1.5%</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Elastic Recovery % (after 100% stretch)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.elasticRecoveryPercent}
                    onChange={(e) => setFormData({ ...formData, elasticRecoveryPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Requirement: ≥ 92.0%</span>
                </div>
              </div>
            )}

            {/* PACKAGING & LABELS: TAPPI T810 (Mullen Bursting, Drop Test, Barcode) */}
            {cat === 'LABELS_PACKAGING' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Carton Bursting Strength (kPa) *
                  </label>
                  <input
                    type="number"
                    value={formData.burstingStrengthKpa}
                    onChange={(e) => setFormData({ ...formData, burstingStrengthKpa: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-500">Requirement: ≥ 1200 kPa</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    10-Point Drop Test (75cm)
                  </label>
                  <select
                    value={formData.dropTestPassed ? 'PASS' : 'FAIL'}
                    onChange={(e) => setFormData({ ...formData, dropTestPassed: e.target.value === 'PASS' })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="PASS">PASSED (Zero structural burst)</option>
                    <option value="FAIL">FAILED (Corner split / rupture)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barcode ANSI Verification Grade
                  </label>
                  <select
                    value={formData.barcodeGrade}
                    onChange={(e) => setFormData({ ...formData, barcodeGrade: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  >
                    <option value="A">Grade A (95-100% scan rate)</option>
                    <option value="B">Grade B (85-94% scan rate)</option>
                    <option value="C">Grade C (Marginal)</option>
                    <option value="FAIL">FAIL (Unscannable)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: DEFECT LOGGER */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Observed Quality Flaws & Defect Breakdown
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Defect name (e.g. Slub, Oil Mark, Burr, Broken Tooth)..."
                value={newDefect.defectName}
                onChange={(e) => setNewDefect({ ...newDefect, defectName: e.target.value })}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={newDefect.count}
                onChange={(e) => setNewDefect({ ...newDefect, count: parseInt(e.target.value) || 1 })}
                className="w-16 px-2 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-center font-mono"
              />
              <select
                value={newDefect.severity}
                onChange={(e) => setNewDefect({ ...newDefect, severity: e.target.value as any })}
                className="px-2 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium"
              >
                <option value="MINOR">Minor</option>
                <option value="MAJOR">Major</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <button
                type="button"
                onClick={handleAddDefect}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log</span>
              </button>
            </div>

            {defectsList.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {defectsList.map((d, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="font-medium text-slate-800">{d.defectName}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-600">{d.count} pcs</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          d.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : d.severity === 'MAJOR'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {d.severity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDefect(idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5: FINAL VERDICT & GRADE ASSIGNMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                Final QC Inspection Verdict *
              </label>
              <select
                value={formData.result}
                onChange={(e) => {
                  const res = e.target.value as any;
                  setFormData({
                    ...formData,
                    result: res,
                    qualityGradeAssigned:
                      res === 'ACCEPTED' ? 'GRADE_A' : res === 'CONDITIONAL_ACCEPT' ? 'GRADE_B' : 'ON_HOLD',
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-emerald-300 focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              >
                <option value="ACCEPTED">ACCEPTED (Pass to Bulk Cutting / Warehouse)</option>
                <option value="CONDITIONAL_ACCEPT">CONDITIONAL ACCEPT (Commercial Tolerance)</option>
                <option value="REJECTED">REJECTED (Quarantine & Return to Mill)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                Assigned Quality Grade (Inventory Sync) *
              </label>
              <select
                value={formData.qualityGradeAssigned}
                onChange={(e) => setFormData({ ...formData, qualityGradeAssigned: e.target.value as QualityGrade })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-emerald-300 focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              >
                <option value="GRADE_A">GRADE A (Export Standard Tier)</option>
                <option value="GRADE_B">GRADE B (Secondary / Domestic Line)</option>
                <option value="ON_HOLD">ON HOLD (Quarantine Testing)</option>
                <option value="REJECTED">REJECTED (Scrap / Supplier Debit)</option>
              </select>
            </div>
          </div>

          {/* Inspector & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                QC Inspector Name *
              </label>
              <input
                type="text"
                value={formData.inspectorName}
                onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Inspection Date *
              </label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Certificate Inspection Notes & Recommendations
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Record any special observations, shade deviation comments, or supplier corrective recommendations..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Buttons matching Buyer & Order design */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Sync Inspection Certificate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
