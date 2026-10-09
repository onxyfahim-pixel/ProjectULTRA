'use client';

import React, { useState } from 'react';
import {
  Layers,
  Calculator,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Percent,
  Check,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
} from 'lucide-react';
import { InspectionSizeBreakdownItem } from '@/lib/types/erp';
import {
  calculateSizeSamplePickups,
  summarizeInspectionSizeBreakdown,
  STANDARD_INSPECTION_SIZES,
} from './inspection-size-utils';

interface InspectionSizeBreakdownSectionProps {
  items: InspectionSizeBreakdownItem[];
  onChange?: (updated: InspectionSizeBreakdownItem[]) => void;
  totalSampleSize: number;
  readOnly?: boolean;
  onSyncLotQuantityToSizes?: (totalInspectedSum: number) => void;
  currentLotQuantity?: number;
  currentOrderQuantity?: number;
}

export function InspectionSizeBreakdownSection({
  items = [],
  onChange,
  totalSampleSize = 315,
  readOnly = false,
  onSyncLotQuantityToSizes,
  currentLotQuantity,
  currentOrderQuantity,
}: InspectionSizeBreakdownSectionProps) {
  const [newSizeInput, setNewSizeInput] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  const summary = summarizeInspectionSizeBreakdown(items);

  // Auto-calculate sample pickups proportionally
  const handleAutoCalculatePickups = () => {
    if (!onChange) return;
    const recalculated = calculateSizeSamplePickups(items, totalSampleSize);
    onChange(recalculated);
  };

  // Reset Inspected Quantity to equal Order Quantity for all sizes
  const handleResetToOrderQuantity = () => {
    if (!onChange) return;
    const resetItems = items.map((s) => ({
      ...s,
      inspectedQuantity: s.orderQuantity,
    }));
    const withPickups = calculateSizeSamplePickups(resetItems, totalSampleSize);
    onChange(withPickups);
  };

  // Update a single item field
  const handleUpdateItem = (
    index: number,
    field: keyof InspectionSizeBreakdownItem,
    value: any
  ) => {
    if (!onChange) return;
    const updated = items.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [field]: value };
    });

    // If inspectedQuantity was changed, re-evaluate sample pickups proportionally
    if (field === 'inspectedQuantity') {
      const recalculated = calculateSizeSamplePickups(updated, totalSampleSize);
      onChange(recalculated);
    } else {
      onChange(updated);
    }
  };

  // Add a new size row
  const handleAddSize = (sizeName: string) => {
    if (!onChange) return;
    const trimmed = sizeName.trim().toUpperCase();
    if (!trimmed) return;
    if (items.some((i) => i.size.toUpperCase() === trimmed)) {
      return;
    }

    const newItem: InspectionSizeBreakdownItem = {
      id: `sz-${Date.now()}-${trimmed.toLowerCase()}`,
      size: trimmed,
      orderQuantity: 1000,
      inspectedQuantity: 1000,
      samplePickupQuantity: 0,
      defectCount: 0,
      status: 'PASS',
    };

    const updated = [...items, newItem];
    const withPickups = calculateSizeSamplePickups(updated, totalSampleSize);
    onChange(withPickups);
    setNewSizeInput('');
    setShowAddCustom(false);
  };

  // Remove a size row
  const handleRemoveSize = (index: number) => {
    if (!onChange || items.length <= 1) return;
    const updated = items.filter((_, idx) => idx !== index);
    const withPickups = calculateSizeSamplePickups(updated, totalSampleSize);
    onChange(withPickups);
  };

  // Status discrepancy between samplePickup sum and totalSampleSize
  const sampleDiff = summary.totalSamplePickup - totalSampleSize;
  const isSampleExact = sampleDiff === 0;

  // Lot difference between size inspected sum and overall lotQuantity
  const lotDiscrepancy =
    currentLotQuantity !== undefined ? summary.totalInspectedQuantity - currentLotQuantity : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold tracking-tight">
                Final Inspection Size Breakdown &amp; Sample Pickup Plan
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                AQL 2.5 ISO 2859-1
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Size-wise sample pickup quantity is automatically calculated from total sample size ({totalSampleSize} pcs). Fill in manual plus/short inspection quantities per size.
            </p>
          </div>
        </div>

        {/* Action Controls for Edit Mode */}
        {!readOnly && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleAutoCalculatePickups}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-2xs cursor-pointer"
              title="Recalculate proportional sample pickup allocations based on inspected quantities"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Auto-Calculate Pickups</span>
            </button>

            <button
              type="button"
              onClick={handleResetToOrderQuantity}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Reset all inspected quantities to match 100% of order quantity"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset to Order Qty</span>
            </button>

            {onSyncLotQuantityToSizes && lotDiscrepancy !== 0 && (
              <button
                type="button"
                onClick={() => onSyncLotQuantityToSizes(summary.totalInspectedQuantity)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer shadow-2xs animate-pulse"
                title="Update Offered Lot Quantity to match the sum of all size inspected quantities"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sync Lot Qty ({summary.totalInspectedQuantity.toLocaleString()} pcs)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Reconciliations Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50 border-b border-slate-200 text-xs">
        {/* Metric 1: Total Order Quantity */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Order Qty (Sum of Sizes)
          </div>
          <div className="text-base font-black font-mono text-slate-900 mt-0.5">
            {summary.totalOrderQuantity.toLocaleString()}{' '}
            <span className="text-[10px] font-normal text-slate-500">pcs</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Across {summary.sizeCount} garment sizes
          </div>
        </div>

        {/* Metric 2: Total Inspected / Presented Quantity */}
        <div className="p-3 bg-white rounded-xl border border-blue-200/80 shadow-2xs bg-blue-50/20">
          <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider flex items-center justify-between">
            <span>Inspected (Offered Lot)</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
              Live
            </span>
          </div>
          <div className="text-base font-black font-mono text-blue-900 mt-0.5">
            {summary.totalInspectedQuantity.toLocaleString()}{' '}
            <span className="text-[10px] font-normal text-blue-600">pcs</span>
          </div>
          <div className="text-[10px] text-blue-700 mt-0.5">
            Sum of presented lot sizes
          </div>
        </div>

        {/* Metric 3: Variance / Plus vs Short */}
        <div
          className={`p-3 rounded-xl border shadow-2xs ${
            summary.isPlus
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
              : summary.isShort
              ? 'bg-rose-50/50 border-rose-200 text-rose-900'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
            <Scale className="w-3 h-3" />
            <span>Size Lot Variance</span>
          </div>
          <div className="text-base font-black font-mono mt-0.5 flex items-center gap-1.5">
            {summary.isPlus && <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />}
            {summary.isShort && <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>
              {summary.variance > 0 ? `+${summary.variance.toLocaleString()}` : summary.variance.toLocaleString()}{' '}
              <span className="text-[10px] font-normal">pcs</span>
            </span>
          </div>
          <div className="text-[10px] font-semibold mt-0.5">
            {summary.isPlus && (
              <span className="text-emerald-700">
                +{summary.variancePercent.toFixed(1)}% Plus (Over-inspection lot)
              </span>
            )}
            {summary.isShort && (
              <span className="text-rose-700">
                {summary.variancePercent.toFixed(1)}% Short (Under-shipped lot)
              </span>
            )}
            {!summary.isPlus && !summary.isShort && (
              <span className="text-slate-500">100% Balanced with order</span>
            )}
          </div>
        </div>

        {/* Metric 4: Total Sample Pickup Allocation */}
        <div
          className={`p-3 rounded-xl border shadow-2xs ${
            isSampleExact
              ? 'bg-indigo-50/40 border-indigo-200 text-indigo-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider flex items-center justify-between">
            <span>Sample Pickups</span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                isSampleExact
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-amber-200 text-amber-900'
              }`}
            >
              {isSampleExact ? '100% Allocated' : 'Discrepancy'}
            </span>
          </div>
          <div className="text-base font-black font-mono mt-0.5">
            {summary.totalSamplePickup.toLocaleString()}{' '}
            <span className="text-[10px] font-normal text-slate-500">
              / {totalSampleSize.toLocaleString()} pcs
            </span>
          </div>
          <div className="text-[10px] mt-0.5 font-medium">
            {isSampleExact ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Exact AQL Level II match
              </span>
            ) : (
              <span className="text-amber-800 font-bold">
                {sampleDiff > 0 ? `+${sampleDiff} extra` : `${sampleDiff} missing`} pickup units
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Proportional Sampling Visual Distribution Bar */}
      {items.length > 0 && summary.totalSamplePickup > 0 && (
        <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium mb-1.5">
            <span className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-indigo-600" />
              <span>Proportional Sample Pickup Distribution ({totalSampleSize} garments)</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {items.map((i) => `${i.size}: ${i.samplePickupQuantity}`).join(' • ')}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
            {items.map((item, idx) => {
              const share =
                summary.totalSamplePickup > 0
                  ? (item.samplePickupQuantity / summary.totalSamplePickup) * 100
                  : 0;
              const colors = [
                'bg-blue-500',
                'bg-indigo-500',
                'bg-purple-500',
                'bg-emerald-500',
                'bg-amber-500',
                'bg-cyan-500',
                'bg-rose-500',
                'bg-teal-500',
              ];
              const barColor = colors[idx % colors.length];
              return (
                <div
                  key={item.id || idx}
                  style={{ width: `${share}%` }}
                  className={`${barColor} transition-all duration-300 relative group`}
                  title={`${item.size}: ${item.samplePickupQuantity} pcs (${share.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Breakdown Specification Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold">
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 w-28">Garment Size</th>
              <th className="py-2.5 px-3 w-36">Order Qty (pcs)</th>
              <th className="py-2.5 px-3 w-48">
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-900">Inspected / Offered Lot</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                    Plus/Short
                  </span>
                </div>
              </th>
              <th className="py-2.5 px-3 w-36">
                <span>Lot Variance</span>
              </th>
              <th className="py-2.5 px-3 w-40">
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-900">Sample Pickup</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                    Auto
                  </span>
                </div>
              </th>
              <th className="py-2.5 px-3 w-24 text-center">Sampling Share</th>
              <th className="py-2.5 px-3 w-28 text-center">Defects Found</th>
              <th className="py-2.5 px-3 w-28 text-center">QC Status</th>
              {!readOnly && <th className="py-2.5 px-2 text-center w-12">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const sizeVariance = (item.inspectedQuantity || 0) - (item.orderQuantity || 0);
              const isSizePlus = sizeVariance > 0;
              const isSizeShort = sizeVariance < 0;
              const variancePct =
                item.orderQuantity > 0 ? (sizeVariance / item.orderQuantity) * 100 : 0;
              const samplingSharePct =
                summary.totalSamplePickup > 0
                  ? ((item.samplePickupQuantity || 0) / summary.totalSamplePickup) * 100
                  : 0;

              return (
                <tr
                  key={item.id || idx}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* # */}
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                    {idx + 1}
                  </td>

                  {/* Garment Size */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-slate-900 text-white font-mono font-black text-xs shadow-2xs">
                        {item.size}
                      </span>
                      {item.colorName && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                          {item.colorName}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Order Quantity */}
                  <td className="py-2.5 px-3">
                    {readOnly ? (
                      <span className="font-mono font-bold text-slate-800">
                        {item.orderQuantity.toLocaleString()} pcs
                      </span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={item.orderQuantity}
                        onChange={(e) =>
                          handleUpdateItem(
                            idx,
                            'orderQuantity',
                            Math.max(0, parseInt(e.target.value, 10) || 0)
                          )
                        }
                        className="w-28 px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </td>

                  {/* Inspected / Offered Lot (Manual Fillup for Plus/Short) */}
                  <td className="py-2.5 px-3">
                    {readOnly ? (
                      <span className="font-mono font-black text-blue-900 text-sm">
                        {item.inspectedQuantity.toLocaleString()} pcs
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="number"
                          min="0"
                          value={item.inspectedQuantity}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              'inspectedQuantity',
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            )
                          }
                          placeholder="Offered lot"
                          className="w-32 px-2.5 py-1 text-xs font-mono font-black text-blue-700 bg-blue-50/50 border border-blue-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </td>

                  {/* Lot Variance Badge */}
                  <td className="py-2.5 px-3 font-mono text-xs">
                    {isSizePlus ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        +{sizeVariance.toLocaleString()} (+{variancePct.toFixed(1)}%)
                      </span>
                    ) : isSizeShort ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        {sizeVariance.toLocaleString()} ({variancePct.toFixed(1)}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Exact (0%)</span>
                    )}
                  </td>

                  {/* Sample Pickup Quantity (Auto-Calculated / Editable) */}
                  <td className="py-2.5 px-3">
                    {readOnly ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-indigo-700 text-sm">
                          {item.samplePickupQuantity} pcs
                        </span>
                        <span className="text-[10px] text-slate-400">sampled</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={item.samplePickupQuantity}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              'samplePickupQuantity',
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            )
                          }
                          className="w-20 px-2 py-1 text-xs font-mono font-bold text-indigo-900 bg-indigo-50/60 border border-indigo-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">pcs</span>
                      </div>
                    )}
                  </td>

                  {/* Sampling Share */}
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600">
                    {samplingSharePct.toFixed(1)}%
                  </td>

                  {/* Defects Found */}
                  <td className="py-2.5 px-3 text-center">
                    {readOnly ? (
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded ${
                          (item.defectCount || 0) > 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.defectCount || 0}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={item.defectCount || 0}
                        onChange={(e) =>
                          handleUpdateItem(
                            idx,
                            'defectCount',
                            Math.max(0, parseInt(e.target.value, 10) || 0)
                          )
                        }
                        className="w-16 px-2 py-1 text-xs font-mono font-bold text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-400"
                      />
                    )}
                  </td>

                  {/* QC Status */}
                  <td className="py-2.5 px-3 text-center">
                    {readOnly ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.status === 'FAIL' || (item.defectCount || 0) > 3
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {item.status === 'FAIL' || (item.defectCount || 0) > 3 ? 'FAIL' : 'PASS'}
                      </span>
                    ) : (
                      <select
                        value={item.status || 'PASS'}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'status', e.target.value as 'PASS' | 'FAIL' | 'PENDING')
                        }
                        className={`px-2 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${
                          item.status === 'FAIL'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    )}
                  </td>

                  {/* Remove Button */}
                  {!readOnly && (
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        disabled={items.length <= 1}
                        onClick={() => handleRemoveSize(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded disabled:opacity-20 cursor-pointer"
                        title="Remove size row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>

          {/* Table Totals Footer */}
          <tfoot>
            <tr className="bg-slate-100/90 text-slate-900 border-t-2 border-slate-300 font-bold">
              <td colSpan={2} className="py-3 px-3 text-right uppercase text-[11px] tracking-wider">
                Total Matrix Aggregate:
              </td>
              <td className="py-3 px-3 font-mono font-black text-slate-900">
                {summary.totalOrderQuantity.toLocaleString()} pcs
              </td>
              <td className="py-3 px-3 font-mono font-black text-blue-900 text-sm">
                {summary.totalInspectedQuantity.toLocaleString()} pcs
              </td>
              <td className="py-3 px-3 font-mono">
                {summary.isPlus ? (
                  <span className="text-emerald-700 font-bold">
                    +{summary.variance.toLocaleString()} pcs
                  </span>
                ) : summary.isShort ? (
                  <span className="text-rose-700 font-bold">
                    {summary.variance.toLocaleString()} pcs
                  </span>
                ) : (
                  <span className="text-slate-500">0 pcs</span>
                )}
              </td>
              <td className="py-3 px-3 font-mono font-black text-indigo-900 text-sm">
                {summary.totalSamplePickup} pcs
              </td>
              <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                100.0%
              </td>
              <td className="py-3 px-3 text-center font-mono font-bold text-rose-700">
                {summary.totalDefects}
              </td>
              <td className="py-3 px-3 text-center">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    summary.totalDefects > 14
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {summary.totalDefects > 14 ? 'OVER LIMIT' : 'LOT PASSED'}
                </span>
              </td>
              {!readOnly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Custom Size Toolbar */}
      {!readOnly && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">Quick Add Size:</span>
            {STANDARD_INSPECTION_SIZES.filter(
              (s) => !items.some((i) => i.size.toUpperCase() === s.toUpperCase())
            ).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => handleAddSize(sz)}
                className="px-2 py-0.5 font-mono font-bold text-xs bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded shadow-2xs transition-colors cursor-pointer"
              >
                + {sz}
              </button>
            ))}

            {showAddCustom ? (
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="text"
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSize(newSizeInput);
                    }
                  }}
                  placeholder="e.g. 3XL, 32W"
                  className="w-24 px-2 py-1 text-xs bg-white border border-indigo-400 rounded focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleAddSize(newSizeInput)}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-colors cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="px-1.5 py-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddCustom(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-slate-600 hover:text-indigo-700 bg-white border border-slate-200 hover:border-indigo-300 transition-colors font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Custom Size...</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            Sampling is conducted across carton packs per ISO 2859-1 Level II normal sampling.
          </div>
        </div>
      )}
    </div>
  );
}
