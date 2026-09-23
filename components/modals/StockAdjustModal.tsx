'use client';

import React, { useState } from 'react';
import { X, Check, AlertTriangle, Boxes, MapPin } from 'lucide-react';
import { InventoryItem, QualityGrade, StockStatus } from '@/lib/types/erp';
import { useErpAuth } from '@/hooks/use-erp-auth';

interface StockAdjustModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
}

function StockAdjustInnerForm({
  item,
  onClose,
  onSave,
}: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
}) {
  const { permissions, user } = useErpAuth();

  const [quantityMeters, setQuantityMeters] = useState<number>(item.quantityMeters);
  const [rollCount, setRollCount] = useState<number>(item.rollCount);
  const [warehouseLocation, setWarehouseLocation] = useState<string>(item.warehouseLocation);
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>(item.qualityGrade);
  const [status, setStatus] = useState<StockStatus>(item.status);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canEditInventory) {
      setError(`Permission Denied: User role ${user.role} is not permitted to modify warehouse inventory.`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(item.id, {
        quantityMeters: Number(quantityMeters),
        rollCount: Number(rollCount),
        warehouseLocation,
        qualityGrade,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update inventory item');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Adjust Fabric Stock &amp; Location
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                SKU: {item.sku} • Lot: {item.batchLot}
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
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fabric Description
            </label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium">
              {item.fabricType} — <span className="text-blue-600">{item.color}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity (Meters)
              </label>
              <input
                id="adjust-quantity-input"
                type="number"
                step="0.1"
                min="0"
                value={quantityMeters}
                onChange={(e) => setQuantityMeters(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roll Count
              </label>
              <input
                id="adjust-rollcount-input"
                type="number"
                min="1"
                value={rollCount}
                onChange={(e) => setRollCount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Warehouse Location Bin
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  id="adjust-location-input"
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="e.g. WH-R02-B08"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Status
              </label>
              <select
                id="adjust-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as StockStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="IN_STOCK">IN STOCK</option>
                <option value="INSPECTING">INSPECTING</option>
                <option value="ALLOCATED">ALLOCATED</option>
                <option value="DISPATCHED">DISPATCHED</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Quality Classification Grade
              </label>
              {!permissions.canApproveQualityGrade && (
                <span className="text-[10px] text-amber-600 font-medium">
                  Requires QA Manager or Admin
                </span>
              )}
            </div>
            <select
              id="adjust-grade-select"
              disabled={!permissions.canApproveQualityGrade}
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value as QualityGrade)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="GRADE_A">Grade A (Approved for Cutting/Export)</option>
              <option value="GRADE_B">Grade B (Commercial / Secondary)</option>
              <option value="ON_HOLD">On Hold (Pending Shade/Shrinkage Lab Test)</option>
              <option value="REJECTED">Rejected (Major Flaws / High Defect Rate)</option>
            </select>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 leading-relaxed">
            <span className="font-semibold">⚡ Low-Latency Sync:</span> Saving this change will
            dispatch a real-time event across the WebSocket server, immediately updating screens
            for all active warehouse supervisors.
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-adjust-stock-btn"
              type="submit"
              disabled={isSaving || !permissions.canEditInventory}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Broadcast &amp; Save Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StockAdjustModal({
  item,
  isOpen,
  onClose,
  onSave,
}: StockAdjustModalProps) {
  if (!isOpen || !item) return null;

  return (
    <StockAdjustInnerForm
      key={item.id}
      item={item}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
