'use client';

import React, { useState } from 'react';
import { X, Plus, Boxes, Check, AlertCircle } from 'lucide-react';
import { InventoryItem, QualityGrade } from '@/lib/types/erp';
import { useErpAuth } from '@/hooks/use-erp-auth';

interface InwardBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<InventoryItem, 'id' | 'lastUpdatedAt' | 'updatedBy'>) => Promise<void>;
}

export function InwardBatchModal({ isOpen, onClose, onSave }: InwardBatchModalProps) {
  const { user, permissions } = useErpAuth();

  const [sku, setSku] = useState('SKU-FB-8840');
  const [fabricType, setFabricType] = useState('100% Combed Cotton Single Jersey (180 GSM)');
  const [color, setColor] = useState('Heather Grey');
  const [batchLot, setBatchLot] = useState('LOT-HG-480');
  const [quantityMeters, setQuantityMeters] = useState(1200);
  const [rollCount, setRollCount] = useState(24);
  const [warehouseLocation, setWarehouseLocation] = useState('WH-R02-B05');
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>('GRADE_A');
  const [styleNumber, setStyleNumber] = useState('STY-TS-2026');
  const [unitCost, setUnitCost] = useState(3.85);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canEditInventory) {
      setError(`User role ${user.role} does not have warehouse inward authorization.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        sku,
        fabricType,
        color,
        batchLot,
        quantityMeters: Number(quantityMeters),
        rollCount: Number(rollCount),
        warehouseLocation,
        qualityGrade,
        status: 'IN_STOCK',
        styleNumber,
        unitCost: Number(unitCost),
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to inward fabric');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Inward New Fabric Batch</h3>
              <p className="text-xs text-slate-500">Warehouse Receipt &amp; Raw Material Staging</p>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch / Lot #</label>
              <input
                type="text"
                value={batchLot}
                onChange={(e) => setBatchLot(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fabric Composition
            </label>
            <input
              type="text"
              value={fabricType}
              onChange={(e) => setFabricType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Color / Shade</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Style Reference</label>
              <input
                type="text"
                value={styleNumber}
                onChange={(e) => setStyleNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meters</label>
              <input
                type="number"
                min="1"
                value={quantityMeters}
                onChange={(e) => setQuantityMeters(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rolls</label>
              <input
                type="number"
                min="1"
                value={rollCount}
                onChange={(e) => setRollCount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bin Location</label>
              <input
                type="text"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Inspection Grade
            </label>
            <select
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value as QualityGrade)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="GRADE_A">Grade A (Passed Inward 4-Point)</option>
              <option value="GRADE_B">Grade B (Commercial)</option>
              <option value="ON_HOLD">On Hold (Pending Shade/Shrinkage Lab)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Inward &amp; Broadcast</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
