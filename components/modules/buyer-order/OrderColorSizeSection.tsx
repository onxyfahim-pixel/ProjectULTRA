'use client';

import React, { useState, useMemo } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  X,
  PieChart,
  Hash,
  Scale,
  ArrowRightLeft,
} from 'lucide-react';
import { OrderColorSizeBreakdown, OrderSizeRatio } from '@/lib/types/modules';
import {
  getAllUniqueSizes,
  calculateBreakdownTotal,
  calculateSizeTotals,
  SIZE_PRESETS,
  POPULAR_GARMENT_COLORS,
  STANDARD_ADULT_SIZES,
  generateDefaultBreakdown,
} from './order-breakdown-utils';

interface OrderColorSizeSectionProps {
  breakdown?: OrderColorSizeBreakdown[];
  orderQuantity: number;
  fobPrice?: number;
  readOnly?: boolean;
  onChange?: (newBreakdown: OrderColorSizeBreakdown[]) => void;
  onSyncOrderQuantity?: (newQuantity: number) => void;
  showToast?: (msg: string) => void;
}

export function OrderColorSizeSection({
  breakdown: propBreakdown,
  orderQuantity,
  fobPrice = 0,
  readOnly = false,
  onChange,
  onSyncOrderQuantity,
  showToast,
}: OrderColorSizeSectionProps) {
  // Ensure we have active breakdowns
  const [internalBreakdown, setInternalBreakdown] = useState<OrderColorSizeBreakdown[]>(() => {
    if (propBreakdown && propBreakdown.length > 0) return propBreakdown;
    return generateDefaultBreakdown(orderQuantity || 10000);
  });

  const activeBreakdown = propBreakdown && propBreakdown.length > 0 ? propBreakdown : internalBreakdown;

  // New size column input modal/popover state
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');

  // New color row modal state
  const [isAddColorOpen, setIsAddColorOpen] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('');
  const [newColorHex, setNewColorHex] = useState('#1e3a8a');

  // Compute active unique sizes
  const sizes = useMemo(() => getAllUniqueSizes(activeBreakdown), [activeBreakdown]);
  const breakdownTotal = useMemo(() => calculateBreakdownTotal(activeBreakdown), [activeBreakdown]);
  const sizeTotals = useMemo(() => calculateSizeTotals(activeBreakdown, sizes), [activeBreakdown, sizes]);
  const discrepancy = breakdownTotal - orderQuantity;

  // Update helper
  const updateBreakdown = (updated: OrderColorSizeBreakdown[]) => {
    // Recalculate row totals
    const recalculated = updated.map((b) => {
      const sum = (b.sizeBreakdown || []).reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
      return { ...b, totalQuantity: sum };
    });
    setInternalBreakdown(recalculated);
    if (onChange) {
      onChange(recalculated);
    }
  };

  // Cell quantity change handler
  const handleCellChange = (colorIndex: number, sizeName: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const updated = activeBreakdown.map((colorItem, cIdx) => {
      if (cIdx !== colorIndex) return colorItem;

      const existingRatios = [...(colorItem.sizeBreakdown || [])];
      const sIdx = existingRatios.findIndex((r) => r.size === sizeName);

      if (sIdx >= 0) {
        existingRatios[sIdx] = { ...existingRatios[sIdx], quantity: num };
      } else {
        existingRatios.push({ size: sizeName, quantity: num });
      }

      const totalQuantity = existingRatios.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
      return { ...colorItem, sizeBreakdown: existingRatios, totalQuantity };
    });

    updateBreakdown(updated);
  };

  // Add Size Column
  const handleAddSizeColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSizeName.trim().toUpperCase();
    if (!clean) return;
    if (sizes.includes(clean)) {
      showToast?.(`Size "${clean}" already exists in the matrix`);
      return;
    }

    const updated = activeBreakdown.map((colorItem) => ({
      ...colorItem,
      sizeBreakdown: [...(colorItem.sizeBreakdown || []), { size: clean, quantity: 0 }],
    }));

    updateBreakdown(updated);
    setNewSizeName('');
    setIsAddSizeOpen(false);
    showToast?.(`Added size column "${clean}"`);
  };

  // Remove Size Column
  const handleRemoveSizeColumn = (sizeNameToRemove: string) => {
    if (sizes.length <= 1) {
      showToast?.('A matrix must have at least one size column');
      return;
    }
    const updated = activeBreakdown.map((colorItem) => ({
      ...colorItem,
      sizeBreakdown: (colorItem.sizeBreakdown || []).filter((r) => r.size !== sizeNameToRemove),
    }));
    updateBreakdown(updated);
    showToast?.(`Removed size column "${sizeNameToRemove}"`);
  };

  // Add Color Row
  const handleAddColorRow = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newColorName.trim();
    if (!cleanName) {
      showToast?.('Please enter a color name');
      return;
    }

    const newRow: OrderColorSizeBreakdown = {
      id: `csb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      colorName: cleanName,
      colorCode: newColorCode.trim() || undefined,
      colorHex: newColorHex || '#475569',
      sizeBreakdown: sizes.map((sz) => ({ size: sz, quantity: 0 })),
      totalQuantity: 0,
    };

    const updated = [...activeBreakdown, newRow];
    updateBreakdown(updated);
    setNewColorName('');
    setNewColorCode('');
    setIsAddColorOpen(false);
    showToast?.(`Added colorway "${cleanName}"`);
  };

  // Remove Color Row
  const handleRemoveColorRow = (colorIndex: number) => {
    if (activeBreakdown.length <= 1) {
      showToast?.('A matrix must have at least one colorway');
      return;
    }
    const colorNameToRemove = activeBreakdown[colorIndex]?.colorName;
    const updated = activeBreakdown.filter((_, idx) => idx !== colorIndex);
    updateBreakdown(updated);
    showToast?.(`Removed colorway "${colorNameToRemove}"`);
  };

  // Quick Preset Application
  const handleApplyPreset = (presetId: string) => {
    const preset = SIZE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const updated = activeBreakdown.map((colorItem) => {
      const currentMap: Record<string, number> = {};
      (colorItem.sizeBreakdown || []).forEach((r) => {
        currentMap[r.size] = r.quantity;
      });

      const newRatios: OrderSizeRatio[] = preset.sizes.map((sz) => ({
        size: sz,
        quantity: currentMap[sz] || 0,
      }));

      const totalQuantity = newRatios.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
      return { ...colorItem, sizeBreakdown: newRatios, totalQuantity };
    });

    updateBreakdown(updated);
    showToast?.(`Applied size preset "${preset.name}"`);
  };

  // Auto-Balance Discrepancy or Auto-Distribute
  const handleAutoDistribute = () => {
    const regenerated = generateDefaultBreakdown(orderQuantity);
    updateBreakdown(regenerated);
    showToast?.(`Auto-allocated ${orderQuantity.toLocaleString()} pcs across standard colorways & sizes`);
  };

  // Sync PO Quantity to match Matrix Grand Total
  const handleSyncToPoQuantity = () => {
    if (onSyncOrderQuantity && breakdownTotal > 0) {
      onSyncOrderQuantity(breakdownTotal);
      showToast?.(`Updated PO Quantity to match breakdown total (${breakdownTotal.toLocaleString()} pcs)`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 transition-all">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>Color &amp; Size Breakdown Matrix</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {activeBreakdown.length} Colorway{activeBreakdown.length === 1 ? '' : 's'} • {sizes.length} Sizes
              </span>
              {discrepancy === 0 ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>100% Allocated ({breakdownTotal.toLocaleString()} pcs)</span>
                </span>
              ) : (
                <span
                  className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    discrepancy > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    {discrepancy > 0 ? `+${discrepancy.toLocaleString()} pcs over PO` : `${discrepancy.toLocaleString()} pcs unallocated`}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Garment size-wise and color-wise allocation grid for cutting, line loading, and carton packing
            </p>
          </div>
        </div>

        {/* Action Toolbar for Edit Mode */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Presets dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Size Presets</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-1.5 hidden group-hover:block animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Size Preset
                </div>
                {SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer flex flex-col"
                  >
                    <span className="font-semibold">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">[{preset.sizes.join(', ')}]</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Size Column Button */}
            <button
              type="button"
              onClick={() => setIsAddSizeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
              title="Add a new size column (e.g. 3XL, 40, etc.)"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              <span>Add Size</span>
            </button>

            {/* Add Colorway Button */}
            <button
              type="button"
              onClick={() => setIsAddColorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Colorway</span>
            </button>

            {/* Auto Distribute Helper */}
            <button
              type="button"
              onClick={handleAutoDistribute}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
              title="Distribute order quantity smoothly across colors and sizes"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Auto-Balance</span>
            </button>
          </div>
        )}
      </div>

      {/* Discrepancy Alert Banner */}
      {!readOnly && discrepancy !== 0 && (
        <div
          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in duration-200 ${
            discrepancy > 0
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${discrepancy > 0 ? 'text-amber-600' : 'text-rose-600'}`} />
            <div>
              <span className="font-bold">
                {discrepancy > 0
                  ? `Breakdown total (${breakdownTotal.toLocaleString()} pcs) exceeds PO quantity (${orderQuantity.toLocaleString()} pcs) by ${discrepancy.toLocaleString()} pcs.`
                  : `Breakdown total (${breakdownTotal.toLocaleString()} pcs) is short of PO quantity (${orderQuantity.toLocaleString()} pcs) by ${Math.abs(discrepancy).toLocaleString()} pcs.`}
              </span>
              <span className="block text-[11px] opacity-80 mt-0.5">
                Adjust quantities in the matrix or click to automatically synchronize the PO quantity.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {onSyncOrderQuantity && (
              <button
                type="button"
                onClick={handleSyncToPoQuantity}
                className="px-3 py-1 rounded-lg bg-white shadow-2xs border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold transition-all cursor-pointer text-xs"
              >
                Sync PO Qty to {breakdownTotal.toLocaleString()} pcs
              </button>
            )}
            <button
              type="button"
              onClick={handleAutoDistribute}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-2xs cursor-pointer text-xs"
            >
              Auto-Distribute PO Qty
            </button>
          </div>
        </div>
      )}

      {/* Visual Color Distribution Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-purple-600" />
            <span>Colorway Share &amp; Quantity Distribution</span>
          </span>
          <span className="font-mono text-[11px]">
            {breakdownTotal.toLocaleString()} / {orderQuantity.toLocaleString()} pcs (
            {orderQuantity > 0 ? Math.round((breakdownTotal / orderQuantity) * 100) : 100}%)
          </span>
        </div>

        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {activeBreakdown.map((item, idx) => {
            const pct = breakdownTotal > 0 ? (item.totalQuantity / breakdownTotal) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={item.id || idx}
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.colorHex || '#475569',
                }}
                className="h-full relative group transition-all"
                title={`${item.colorName}: ${item.totalQuantity.toLocaleString()} pcs (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Color Legend Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {activeBreakdown.map((item, idx) => {
            const pct = breakdownTotal > 0 ? (item.totalQuantity / breakdownTotal) * 100 : 0;
            return (
              <div
                key={item.id || idx}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: item.colorHex || '#475569' }}
                />
                <span className="font-semibold text-slate-900">{item.colorName}</span>
                {item.colorCode && (
                  <span className="text-[9px] font-mono text-slate-400">({item.colorCode})</span>
                )}
                <span className="font-mono font-bold text-purple-700 ml-0.5">
                  {item.totalQuantity.toLocaleString()} pcs
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({pct.toFixed(0)}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Color & Size Matrix Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3 w-10 text-center text-slate-400">#</th>
              <th className="p-3 min-w-[200px]">Colorway &amp; Spec Code</th>
              {sizes.map((sz) => (
                <th key={sz} className="p-3 text-center min-w-[70px] relative group font-mono">
                  <div className="flex items-center justify-center gap-1">
                    <span>{sz}</span>
                    {!readOnly && sizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeColumn(sz)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-opacity p-0.5 rounded cursor-pointer"
                        title={`Remove ${sz} size column`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-3 text-right min-w-[90px] bg-slate-100/60 font-mono">Total Pcs</th>
              <th className="p-3 text-right min-w-[70px] font-mono">Ratio %</th>
              {fobPrice > 0 && (
                <th className="p-3 text-right min-w-[100px] font-mono">FOB Value ($)</th>
              )}
              {!readOnly && <th className="p-3 w-10 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {activeBreakdown.map((colorItem, cIdx) => {
              const rowPct = breakdownTotal > 0 ? (colorItem.totalQuantity / breakdownTotal) * 100 : 0;
              const rowValue = colorItem.totalQuantity * fobPrice;
              const ratioMap: Record<string, number> = {};
              (colorItem.sizeBreakdown || []).forEach((r) => {
                ratioMap[r.size] = r.quantity;
              });

              return (
                <tr key={colorItem.id || cIdx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                    {cIdx + 1}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                        style={{ backgroundColor: colorItem.colorHex || '#475569' }}
                      />
                      <div>
                        {!readOnly ? (
                          <div className="space-y-0.5">
                            <input
                              type="text"
                              value={colorItem.colorName}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...activeBreakdown];
                                updated[cIdx] = { ...updated[cIdx], colorName: val };
                                updateBreakdown(updated);
                              }}
                              className="font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1 py-0.5 transition-all text-xs"
                              placeholder="Color name"
                            />
                            <input
                              type="text"
                              value={colorItem.colorCode || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...activeBreakdown];
                                updated[cIdx] = { ...updated[cIdx], colorCode: val };
                                updateBreakdown(updated);
                              }}
                              className="block text-[10px] font-mono text-slate-500 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1 py-0.5 transition-all"
                              placeholder="PANTONE / Color Code"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-900">{colorItem.colorName}</div>
                            {colorItem.colorCode && (
                              <div className="text-[10px] font-mono text-slate-500">
                                {colorItem.colorCode}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Size Quantities */}
                  {sizes.map((sz) => {
                    const qVal = ratioMap[sz] || 0;
                    return (
                      <td key={sz} className="p-2 text-center">
                        {!readOnly ? (
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={qVal === 0 ? '' : qVal}
                            placeholder="0"
                            onChange={(e) => handleCellChange(cIdx, sz, e.target.value)}
                            className="w-16 text-center py-1 px-1 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-400 font-mono font-semibold text-slate-900 text-xs transition-all hover:border-slate-300"
                          />
                        ) : (
                          <span
                            className={`font-mono font-semibold text-xs ${
                              qVal > 0 ? 'text-slate-900' : 'text-slate-300'
                            }`}
                          >
                            {qVal > 0 ? qVal.toLocaleString() : '-'}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Row Total */}
                  <td className="p-3 text-right font-mono font-bold text-purple-700 bg-slate-50/50">
                    {colorItem.totalQuantity.toLocaleString()} pcs
                  </td>

                  {/* Row Ratio % */}
                  <td className="p-3 text-right font-mono text-slate-600 text-[11px]">
                    {rowPct.toFixed(1)}%
                  </td>

                  {/* Row Value */}
                  {fobPrice > 0 && (
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ${rowValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  )}

                  {/* Row Action */}
                  {!readOnly && (
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveColorRow(cIdx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete colorway"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer: Size Totals and Grand Total */}
          <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
            <tr>
              <td colSpan={2} className="p-3 text-left uppercase tracking-wider text-[11px] text-slate-700">
                Total per Size
              </td>
              {sizes.map((sz) => {
                const sTotal = sizeTotals[sz] || 0;
                const sPct = breakdownTotal > 0 ? (sTotal / breakdownTotal) * 100 : 0;
                return (
                  <td key={sz} className="p-3 text-center font-mono">
                    <div className="text-slate-900">{sTotal.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-500 font-normal">{sPct.toFixed(0)}%</div>
                  </td>
                );
              })}
              <td className="p-3 text-right font-mono font-black text-purple-900 bg-purple-100/60 text-sm">
                {breakdownTotal.toLocaleString()} pcs
              </td>
              <td className="p-3 text-right font-mono text-slate-700">
                100%
              </td>
              {fobPrice > 0 && (
                <td className="p-3 text-right font-mono font-black text-emerald-800 text-sm">
                  ${(breakdownTotal * fobPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              )}
              {!readOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Size Column Modal / Dialog */}
      {isAddSizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                <span>Add Size Column</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddSizeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSizeColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Size Label / Code
                </label>
                <input
                  type="text"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  placeholder="e.g. 3XL, 4XL, 40, 14Y, ONE SIZE"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-400 text-xs font-mono uppercase"
                  autoFocus
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-[10px] text-slate-500 font-medium block mb-1.5">
                  Or pick suggested size:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['3XL', '4XL', '5XL', '26', '38', '40', '42', '14Y', 'FREE'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setNewSizeName(sz)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 font-mono text-[10px] border border-slate-200 transition-colors cursor-pointer"
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSizeOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSizeName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Add Size Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Colorway Modal / Dialog */}
      {isAddColorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>Add Colorway</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddColorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddColorRow} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Color Name *
                </label>
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="e.g. Heather Grey, Dusty Rose, Khaki Beige"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-400 text-xs"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Color Code / Pantone
                  </label>
                  <input
                    type="text"
                    value={newColorCode}
                    onChange={(e) => setNewColorCode(e.target.value)}
                    placeholder="e.g. 19-3923 TCX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-400 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Color Swatch
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-9 h-8 p-0 border border-slate-300 rounded-lg cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Popular apparel colors presets */}
              <div>
                <span className="text-[10px] text-slate-500 font-medium block mb-1.5">
                  Or pick from popular standard garment colorways:
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {POPULAR_GARMENT_COLORS.map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => {
                        setNewColorName(col.name);
                        setNewColorCode(col.code);
                        setNewColorHex(col.hex);
                      }}
                      className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition-colors cursor-pointer"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <div className="truncate">
                        <div className="text-[11px] font-semibold text-slate-800 truncate">{col.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono truncate">{col.code}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddColorOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newColorName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Add Colorway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
