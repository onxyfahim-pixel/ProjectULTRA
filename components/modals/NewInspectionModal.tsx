'use client';

import React, { useState } from 'react';
import { X, Check, ClipboardCheck, AlertCircle, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { InspectionRecord, InspectionStage, InspectionStatus } from '@/lib/types/erp';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { calculateAqlInspection, evaluateAqlVerdict, calculateQuantityVariance } from '@/lib/aql';

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<InspectionRecord, 'id' | 'createdAt' | 'inspectionCode'>) => Promise<void>;
}

export function NewInspectionModal({ isOpen, onClose, onSave }: NewInspectionModalProps) {
  const { user, permissions } = useErpAuth();

  const [styleNumber, setStyleNumber] = useState('STY-ZR-4882-09');
  const [poList, setPoList] = useState<string[]>(['PO-EXP-9920', 'PO-EXP-9921']);
  const [newPoInput, setNewPoInput] = useState('');
  const [lotNumber, setLotNumber] = useState('LOT-TX-9042D');
  const [buyer, setBuyer] = useState('Inditex (Zara)');
  const [stage, setStage] = useState<InspectionStage>('FABRIC_INWARD');
  const [orderQuantity, setOrderQuantity] = useState<number>(10000);
  const [lotQuantity, setLotQuantity] = useState<number>(10000);

  // AQL and Variance Engine
  const aqlCalc = React.useMemo(() => calculateAqlInspection(lotQuantity, '2.5', '4.0'), [lotQuantity]);
  const qtyVariance = React.useMemo(() => calculateQuantityVariance(orderQuantity, lotQuantity), [orderQuantity, lotQuantity]);

  const [sampleSize, setSampleSize] = useState<number>(aqlCalc.sampleSize);
  const [defectCount, setDefectCount] = useState<number>(4);
  const [majorDefects, setMajorDefects] = useState<number>(1);
  const [minorDefects, setMinorDefects] = useState<number>(3);
  const [criticalDefects, setCriticalDefects] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically sync sample size when lot quantity changes
  React.useEffect(() => {
    setSampleSize(aqlCalc.sampleSize);
  }, [aqlCalc.sampleSize]);

  if (!isOpen) return null;

  // AQL 2.5 Dynamic Verdict Calculation
  const passCount = Math.max(0, sampleSize - defectCount);
  const aqlVerdictResult = evaluateAqlVerdict(criticalDefects, majorDefects, minorDefects, aqlCalc);
  const computedStatus: InspectionStatus = aqlVerdictResult.verdict;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canPerformInspection) {
      setError(`Permission Denied: User role ${user.role} cannot submit QMS inspection records.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const poNumbers = poList.filter(Boolean);
    try {
      await onSave({
        styleNumber,
        lotNumber,
        buyer,
        orderNumber: poNumbers.join(', '),
        poNumbers: poNumbers.length > 0 ? poNumbers : undefined,
        isCombinedInspection: poNumbers.length > 1,
        stage,
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
        sampleSize: Number(sampleSize),
        passCount,
        defectCount: Number(defectCount),
        majorDefects: Number(majorDefects),
        minorDefects: Number(minorDefects),
        criticalDefects: Number(criticalDefects),
        status: computedStatus,
        inspectorId: user.id,
        inspectorName: user.name,
        defects: [
          {
            id: `d-${Date.now()}`,
            defectType: 'Routine AQL Batch Inspection Audit',
            severity: majorDefects > 0 ? 'MAJOR' : 'MINOR',
            count: defectCount,
            location: 'Random Sampling Unit',
          },
        ],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit inspection record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Log New QMS AQL 2.5 Inspection
              </h3>
              <p className="text-xs text-slate-500">
                Inspector: <span className="font-semibold text-slate-700">{user.name}</span> (
                {user.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Garment Style Number
              </label>
              <input
                type="text"
                value={styleNumber}
                onChange={(e) => setStyleNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lot / Batch Number
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Multiple POs Combine Inspection Manager */}
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-indigo-950">
                Purchase Orders ({poList.length} POs Combined)
              </label>
              {poList.length > 1 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  ⚡ Combine Inspection
                </span>
              )}
            </div>

            {/* PO Badges list */}
            <div className="flex flex-wrap gap-1.5">
              {poList.map((po, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs"
                >
                  <span>{po}</span>
                  {poList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPoList(poList.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>

            {/* Add PO Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newPoInput}
                onChange={(e) => setNewPoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newPoInput.trim() && !poList.includes(newPoInput.trim())) {
                      setPoList([...poList, newPoInput.trim()]);
                      setNewPoInput('');
                    }
                  }
                }}
                placeholder="Type PO# and click Add (e.g. PO-ZR-8821)"
                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (newPoInput.trim() && !poList.includes(newPoInput.trim())) {
                    setPoList([...poList, newPoInput.trim()]);
                    setNewPoInput('');
                  }
                }}
                className="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                + Add PO
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                International Buyer
              </label>
              <select
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="Inditex (Zara)">Inditex (Zara)</option>
                <option value="H&M Global">H&M Global</option>
                <option value="Nike Apparel">Nike Apparel</option>
                <option value="PVH (Tommy Hilfiger)">PVH (Tommy Hilfiger)</option>
                <option value="Fast Retailing (Uniqlo)">Fast Retailing (Uniqlo)</option>
                <option value="Gap Inc.">Gap Inc.</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as InspectionStage)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="FABRIC_INWARD">Fabric Inward (4-Point)</option>
                <option value="CUTTING_INSPECTION">Cutting &amp; Spreading</option>
                <option value="SEWING_IN_LINE">Sewing In-Line (Lines 1-8)</option>
                <option value="END_LINE_QC">End-Line AQL Audit</option>
                <option value="FINISHING_PACKING">Finishing &amp; Carton Packing</option>
              </select>
            </div>
          </div>

          {/* Order vs Inspection Quantity Reconciliation */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span>Order vs Inspected Lot Reconciliation</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${qtyVariance.badgeCls}`}>
                {qtyVariance.isExcess ? `+${qtyVariance.excessQty.toLocaleString()} pcs (+${qtyVariance.percentage}% Excess)` : qtyVariance.isShort ? `-${qtyVariance.shortQty.toLocaleString()} pcs (${qtyVariance.percentage}% Short)` : 'Exact Match (0 Variance)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Total Order Quantity (Pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-900 mb-0.5">
                  Total Inspection Qty (Offered Lot)
                </label>
                <input
                  type="number"
                  min="1"
                  value={lotQuantity}
                  onChange={(e) => setLotQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-blue-300 rounded bg-blue-50/50 font-mono text-blue-800"
                />
              </div>
            </div>
          </div>

          {/* Sample Size & Defect Counters with AQL Allowances */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  AQL 2.5 Sampling Engine (Code {aqlCalc.codeLetter})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Major Ac: {aqlCalc.majorAc} (Re: {aqlCalc.majorRe}) • Minor Ac: {aqlCalc.minorAc} (Re: {aqlCalc.minorRe})
                </span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  computedStatus === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : computedStatus === 'CONDITIONAL_PASS'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                Verdict: {computedStatus}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Sample (Auto)</label>
                <input
                  type="number"
                  min="1"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-blue-300 rounded bg-blue-50/40 text-blue-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Minor (Ac:{aqlCalc.minorAc})</label>
                <input
                  type="number"
                  min="0"
                  value={minorDefects}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setMinorDefects(val);
                    setDefectCount(val + majorDefects + criticalDefects);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Major (Ac:{aqlCalc.majorAc})</label>
                <input
                  type="number"
                  min="0"
                  value={majorDefects}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setMajorDefects(val);
                    setDefectCount(minorDefects + val + criticalDefects);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white text-amber-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Critical (Ac:0)</label>
                <input
                  type="number"
                  min="0"
                  value={criticalDefects}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setCriticalDefects(val);
                    setDefectCount(minorDefects + majorDefects + val);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white text-rose-700 font-bold"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>
                Calculated Pass Units: <strong className="text-slate-800">{passCount}</strong> /{' '}
                {sampleSize}
              </span>
              <span>
                Pass Ratio:{' '}
                <strong className="text-emerald-700">
                  {((passCount / sampleSize) * 100).toFixed(1)}%
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !permissions.canPerformInspection}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Log &amp; Sign Off Inspection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
