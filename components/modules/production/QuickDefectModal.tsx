'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Zap,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Layers,
  Factory,
  Search,
  Filter,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Save,
  Tag,
} from 'lucide-react';
import { ProductionOrder, HourlyReportEntry, DefectCountEntry } from '@/lib/types/erp';
import { ProductionDefectItem } from '@/lib/types/production-management';
import {
  getProductionDefects,
  getCommonProductionDefects,
  addProductionDefect,
} from '@/lib/db/production-defects-store';

interface QuickDefectModalProps {
  isOpen: boolean;
  orders: ProductionOrder[];
  initialOrderId?: string | null;
  onSaveOrder: (updatedOrder: ProductionOrder) => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function QuickDefectModal({
  isOpen,
  orders,
  initialOrderId,
  onSaveOrder,
  onClose,
  showToast,
}: QuickDefectModalProps) {
  // Selected Order
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    if (initialOrderId) return initialOrderId;
    return orders[0]?.id || '';
  });

  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0] || null;
  }, [orders, selectedOrderId]);

  // Selected Hour Index
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);

  // Dynamic Defects from store
  const [allDefects, setAllDefects] = useState<ProductionDefectItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Working copy of hourly reports for the active order
  const [workingHourlyReports, setWorkingHourlyReports] = useState<HourlyReportEntry[]>([]);

  // Custom Defect Form
  const [isAddingCustomDefect, setIsAddingCustomDefect] = useState<boolean>(false);
  const [customDefectName, setCustomDefectName] = useState<string>('');
  const [customDefectCategory, setCustomDefectCategory] = useState<
    'Sewing' | 'Fabric' | 'Cutting' | 'Finishing' | 'Trims'
  >('Sewing');
  const [customDefectSeverity, setCustomDefectSeverity] = useState<'CRITICAL' | 'MAJOR' | 'MINOR'>('MAJOR');

  // Load defects
  const loadDefects = () => {
    setAllDefects(getProductionDefects());
  };

  useEffect(() => {
    loadDefects();
    window.addEventListener('erp_production_defects_updated', loadDefects);
    return () => window.removeEventListener('erp_production_defects_updated', loadDefects);
  }, []);

  // Sync working hourly reports whenever activeOrder changes or modal opens
  useEffect(() => {
    if (activeOrder) {
      if (activeOrder.hourlyReports && activeOrder.hourlyReports.length > 0) {
        setWorkingHourlyReports(JSON.parse(JSON.stringify(activeOrder.hourlyReports)));
      } else {
        // Create 8 default slots if order didn't have any
        const slots = [
          '08:00 - 09:00',
          '09:00 - 10:00',
          '10:00 - 11:00',
          '11:00 - 12:00',
          '12:00 - 13:00',
          '14:00 - 15:00',
          '15:00 - 16:00',
          '16:00 - 17:00',
        ];
        setWorkingHourlyReports(
          slots.map((slot, idx) => ({
            id: `hr-quick-${idx}`,
            hourSlot: slot,
            targetQty: 140,
            checkedQty: 0,
            passedQty: 0,
            defectQty: 0,
            rejectQty: 0,
            defectRate: 0,
            rftRate: 100,
            defectBreakdown: [],
            topDefect: 'None',
          }))
        );
      }
    }
  }, [activeOrder, isOpen]);

  // Current active hour
  const currentHour = workingHourlyReports[selectedHourIndex] || null;

  // Filtered defects for the keypad
  const filteredDefects = useMemo(() => {
    return allDefects.filter((d) => {
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allDefects, categoryFilter, searchQuery]);

  // Handle Defect Count Change on current hour
  const handleAdjustDefectCount = (defectName: string, delta: number) => {
    if (!currentHour) return;

    setWorkingHourlyReports((prev) => {
      const next = [...prev];
      const hour = { ...next[selectedHourIndex] };
      const breakdown = [...(hour.defectBreakdown || [])];

      const idx = breakdown.findIndex((b) => b.defectType === defectName);
      if (idx >= 0) {
        const newCount = Math.max(0, breakdown[idx].count + delta);
        if (newCount === 0) {
          breakdown.splice(idx, 1);
        } else {
          breakdown[idx] = { ...breakdown[idx], count: newCount };
        }
      } else if (delta > 0) {
        breakdown.push({ defectType: defectName, count: delta });
      }

      const totalDef = breakdown.reduce((sum, b) => sum + b.count, 0);
      hour.defectBreakdown = breakdown;
      hour.defectQty = totalDef;

      // Auto-adjust checkedQty if checked is 0 or less than defects
      if (hour.checkedQty < totalDef) {
        hour.checkedQty = totalDef + 10;
      }

      // Passed = Checked - Rejects (repairable defects are reworked)
      hour.passedQty = Math.max(0, hour.checkedQty - (hour.rejectQty || 0));

      // Calculate DHU% and RFT%
      const dhu = hour.checkedQty > 0 ? Number(((totalDef / hour.checkedQty) * 100).toFixed(2)) : 0;
      const rft =
        hour.checkedQty > 0
          ? Number((Math.max(0, (hour.checkedQty - totalDef - (hour.rejectQty || 0)) / hour.checkedQty) * 100).toFixed(1))
          : 100;

      hour.defectRate = dhu;
      hour.rftRate = rft;

      // Top defect
      if (breakdown.length > 0) {
        const sorted = [...breakdown].sort((a, b) => b.count - a.count);
        hour.topDefect = sorted[0].defectType;
      } else {
        hour.topDefect = 'None';
      }

      next[selectedHourIndex] = hour;
      return next;
    });
  };

  // Quick adjust checked pcs
  const handleAdjustCheckedPcs = (amount: number) => {
    if (!currentHour) return;
    setWorkingHourlyReports((prev) => {
      const next = [...prev];
      const hour = { ...next[selectedHourIndex] };
      hour.checkedQty = Math.max(0, (hour.checkedQty || 0) + amount);
      hour.passedQty = Math.max(0, hour.checkedQty - (hour.rejectQty || 0));

      const dhu = hour.checkedQty > 0 ? Number((((hour.defectQty || 0) / hour.checkedQty) * 100).toFixed(2)) : 0;
      const rft =
        hour.checkedQty > 0
          ? Number((Math.max(0, (hour.checkedQty - (hour.defectQty || 0) - (hour.rejectQty || 0)) / hour.checkedQty) * 100).toFixed(1))
          : 100;

      hour.defectRate = dhu;
      hour.rftRate = rft;

      next[selectedHourIndex] = hour;
      return next;
    });
  };

  // Add custom defect
  const handleAddCustomDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDefectName.trim()) return;

    const newDef = addProductionDefect({
      name: customDefectName.trim(),
      category: customDefectCategory,
      severity: customDefectSeverity,
      isCommon: true,
      description: 'Added via Quick Defect Logger',
    });

    handleAdjustDefectCount(newDef.name, 1);
    setCustomDefectName('');
    setIsAddingCustomDefect(false);
    showToast(`Added custom defect "${newDef.name}" & logged +1 to current hour`);
  };

  // Calculate live cumulative order totals
  const cumulativeTotals = useMemo(() => {
    const totalChecked = workingHourlyReports.reduce((s, h) => s + (h.checkedQty || 0), 0);
    const totalDefects = workingHourlyReports.reduce((s, h) => s + (h.defectQty || 0), 0);
    const totalPassed = workingHourlyReports.reduce((s, h) => s + (h.passedQty || 0), 0);
    const totalRejects = workingHourlyReports.reduce((s, h) => s + (h.rejectQty || 0), 0);

    const dhu = totalChecked > 0 ? Number(((totalDefects / totalChecked) * 100).toFixed(2)) : 0;
    const rft =
      totalChecked > 0
        ? Number((Math.max(0, (totalChecked - totalDefects - totalRejects) / totalChecked) * 100).toFixed(1))
        : 100;

    return { totalChecked, totalDefects, totalPassed, totalRejects, dhu, rft };
  }, [workingHourlyReports]);

  // Save to Production Record
  const handleSaveAndSync = () => {
    if (!activeOrder) return;

    // Calculate overall top 3 defects
    const defectMap: Record<string, number> = {};
    workingHourlyReports.forEach((hr) => {
      (hr.defectBreakdown || []).forEach((b) => {
        if (b.count > 0) defectMap[b.defectType] = (defectMap[b.defectType] || 0) + b.count;
      });
    });

    const topDefectsList = Object.entries(defectMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([defectType, count]) => ({
        defectType,
        count,
        percentage: cumulativeTotals.totalDefects > 0 ? Number(((count / cumulativeTotals.totalDefects) * 100).toFixed(1)) : 0,
      }));

    const updatedOrder: ProductionOrder = {
      ...activeOrder,
      hourlyReports: workingHourlyReports,
      completedQuantity: Math.max(activeOrder.completedQuantity || 0, cumulativeTotals.totalPassed),
      totalDefects: cumulativeTotals.totalDefects,
      defectRate: cumulativeTotals.dhu,
      dhuRate: cumulativeTotals.dhu,
      rftRate: cumulativeTotals.rft,
      rejectQuantity: cumulativeTotals.totalRejects,
      top3Defects: topDefectsList,
    };

    onSaveOrder(updatedOrder);
    showToast(
      `✓ Logged ${currentHour?.defectQty || 0} defects for Hour ${currentHour?.hourSlot} in ${activeOrder.sewingLine}`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Quick Defect Logger</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  Floor QC Mode
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Rapid tap-to-add defect counter for quality inspectors & line chiefs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS BAR: Order Selector + Hour Slot Switcher */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
          {/* Order / Line Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select Production Line & Order:
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.sewingLine} • PO: {o.orderNumber} • {o.buyer} ({o.styleNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Hour Slot Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Active Hourly Inspection Slot:
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {workingHourlyReports.map((slot, idx) => {
                const isSelected = idx === selectedHourIndex;
                const hasDefects = (slot.defectQty || 0) > 0;
                return (
                  <button
                    key={slot.id || idx}
                    type="button"
                    onClick={() => setSelectedHourIndex(idx)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : hasDefects
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{slot.hourSlot.split('-')[0].trim()}</span>
                    {hasDefects && (
                      <span
                        className={`text-[10px] px-1 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-800'
                        }`}
                      >
                        {slot.defectQty}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* LIVE HOUR TELEMETRY STRIP */}
        {currentHour && (
          <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-950">Hour: {currentHour.hourSlot}</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-600">
                Line: <strong className="text-slate-900">{activeOrder?.sewingLine}</strong>
              </span>
            </div>

            {/* Micro Live Metrics */}
            <div className="flex items-center flex-wrap gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Checked:</span>
                <span className="font-bold text-blue-700">{currentHour.checkedQty} pcs</span>
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustCheckedPcs(10)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 cursor-pointer"
                    title="Add 10 checked pcs"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCheckedPcs(50)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 cursor-pointer"
                    title="Add 50 checked pcs"
                  >
                    +50
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Defects:</span>
                <span className="font-bold text-rose-700">{currentHour.defectQty}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">DHU:</span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    currentHour.defectRate <= 2
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentHour.defectRate <= 3
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {currentHour.defectRate}%
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">RFT:</span>
                <span className="font-bold text-emerald-700">{currentHour.rftRate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* KEYPAD SEARCH & CATEGORY FILTER */}
        <div className="p-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'Sewing', 'Fabric', 'Cutting', 'Finishing', 'Trims'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search defect..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddingCustomDefect(!isAddingCustomDefect)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Custom Defect</span>
            </button>
          </div>
        </div>

        {/* INLINE CUSTOM DEFECT ADD BAR (EXPANDABLE) */}
        {isAddingCustomDefect && (
          <form
            onSubmit={handleAddCustomDefect}
            className="p-3 bg-amber-50/70 border-b border-amber-200 flex flex-wrap items-center gap-2.5 animate-in fade-in"
          >
            <div className="flex-1 min-w-[160px]">
              <input
                type="text"
                value={customDefectName}
                onChange={(e) => setCustomDefectName(e.target.value)}
                placeholder="New Defect Name (e.g. Broken Elastic)"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-900"
                required
              />
            </div>
            <select
              value={customDefectCategory}
              onChange={(e) => setCustomDefectCategory(e.target.value as any)}
              className="px-2 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-medium"
            >
              <option value="Sewing">Sewing</option>
              <option value="Fabric">Fabric</option>
              <option value="Cutting">Cutting</option>
              <option value="Finishing">Finishing</option>
              <option value="Trims">Trims</option>
            </select>
            <select
              value={customDefectSeverity}
              onChange={(e) => setCustomDefectSeverity(e.target.value as any)}
              className="px-2 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-medium"
            >
              <option value="MAJOR">MAJOR</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="MINOR">MINOR</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer"
            >
              Add & Log +1
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCustomDefect(false)}
              className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </form>
        )}

        {/* DEFECT KEYPAD GRID (LARGE TACTILE CARDS - TAP TO ADD) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/60">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredDefects.map((defect) => {
              const loggedCount =
                currentHour?.defectBreakdown?.find((b) => b.defectType === defect.name)?.count || 0;
              const hasCount = loggedCount > 0;

              return (
                <div
                  key={defect.id}
                  className={`p-3 rounded-2xl border transition-all select-none flex flex-col justify-between ${
                    hasCount
                      ? 'bg-rose-50/90 border-rose-300 shadow-sm ring-1 ring-rose-400/30'
                      : 'bg-white hover:bg-blue-50/40 border-slate-200 hover:border-blue-300 shadow-xs'
                  }`}
                >
                  {/* Top info */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400">{defect.code}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                          defect.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : defect.severity === 'MAJOR'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {defect.severity}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                      {defect.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{defect.category}</div>
                  </div>

                  {/* Tactile Counter Area */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-lg font-black font-mono ${
                        hasCount ? 'text-rose-700' : 'text-slate-300'
                      }`}
                    >
                      {loggedCount}
                    </span>

                    {/* Tap Actions */}
                    <div className="flex items-center gap-1">
                      {hasCount && (
                        <button
                          type="button"
                          onClick={() => handleAdjustDefectCount(defect.name, -1)}
                          className="w-7 h-7 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                          title="Reduce by 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAdjustDefectCount(defect.name, 1)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
                          hasCount
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        title="Tap to add +1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>1</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdjustDefectCount(defect.name, 5)}
                        className="px-1.5 py-1.5 rounded-lg font-bold text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                        title="Add +5 batch"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDefects.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No defects match "{searchQuery}". Click "+ Custom Defect" above to add on the fly.
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Cumulative: <strong className="text-slate-900">{cumulativeTotals.totalDefects} defects</strong> |{' '}
            Checked: <strong className="text-blue-700">{cumulativeTotals.totalChecked} pcs</strong> | DHU:{' '}
            <strong className="text-slate-900">{cumulativeTotals.dhu}%</strong> | RFT:{' '}
            <strong className="text-emerald-700">{cumulativeTotals.rft}%</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndSync}
              className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/25 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync to Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
