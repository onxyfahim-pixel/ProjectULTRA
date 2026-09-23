'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Building2, Layers, ShieldCheck, Target, Activity } from 'lucide-react';
import { ProductionOrder, LineStatus } from '@/lib/types/erp';
import { getProductionUnits, getProductionLines } from '@/lib/db/production-management-store';
import { ProductionUnit, ProductionLine } from '@/lib/types/production-management';

interface AddProductionOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: NewProductionOrderData) => void;
  orderToEdit?: ProductionOrder | null;
}

export interface NewProductionOrderData {
  id?: string;
  orderNumber: string;
  buyer: string;
  styleName: string;
  styleNumber: string;
  unit: string;
  section: string;
  targetQuantity: number;
  completedQuantity: number;
  totalDefects: number;
  dhuRate: number;
  rftRate: number;
  efficiencyPercent: number;
  rejectQuantity: number;
  sewingLine: string;
  lineId: string;
  status: LineStatus;
  dueDate: string;
  operatorCount: number;
  supervisorName: string;
  remarks: string;
}

const MANUFACTURING_UNITS = [
  'Unit 01 (Dhaka Complex)',
  'Unit 02 (Chittagong SEZ)',
  'Unit 03 (Ashulia Modern Plant)',
  'Unit 04 (Gazipur Export Zone)',
];

const SECTIONS_AND_LINES = [
  { id: 'Line 01', label: 'Sewing Line 01 (Knit Tops)' },
  { id: 'Line 02', label: 'Sewing Line 02 (Knit Polo & Fleece)' },
  { id: 'Line 03', label: 'Sewing Line 03 (Woven Bottoms)' },
  { id: 'Line 04', label: 'Sewing Line 04 (Heavy Denim)' },
  { id: 'Line 05', label: 'Sewing Line 05 (Precision Knit)' },
  { id: 'Line 06', label: 'Sewing Line 06 (Fleece Assembly)' },
  { id: 'Line 07', label: 'Sewing Line 07 (Cargo & Utility)' },
  { id: 'Line 08', label: 'Sewing Line 08 (Intimates & Activewear)' },
  { id: 'Cutting', label: 'Cutting Floor Section 01' },
  { id: 'Finishing', label: 'Finishing & Packing Section 01' },
  { id: 'Washing', label: 'Industrial Washing Floor' },
];

const BUYERS = [
  'Inditex (Zara)',
  'H&M Global',
  'Nike Apparel',
  'Tommy Hilfiger',
  'Uniqlo (Fast Retailing)',
  'Gap Inc.',
  'M&S (Marks & Spencer)',
  'Next PLC',
  'Adidas',
];

export function AddProductionOrderModal({
  isOpen,
  onClose,
  onSave,
  orderToEdit,
}: AddProductionOrderModalProps) {
  const [form, setForm] = useState<Partial<NewProductionOrderData>>({
    unit: 'Unit 01 (Dhaka Complex)',
    section: 'Sewing Line 01 (Knit Tops)',
    lineId: 'Line 01',
    status: 'RUNNING',
    targetQuantity: 10000,
    completedQuantity: 0,
    totalDefects: 50,
    dhuRate: 1.1,
    rftRate: 98.5,
    efficiencyPercent: 82,
    rejectQuantity: 15,
    operatorCount: 45,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [managedUnits, setManagedUnits] = useState<ProductionUnit[]>([]);
  const [managedLines, setManagedLines] = useState<ProductionLine[]>([]);

  useEffect(() => {
    const load = () => {
      setManagedUnits(getProductionUnits());
      setManagedLines(getProductionLines());
    };
    load();
    window.addEventListener('erp_production_management_updated', load);
    return () => window.removeEventListener('erp_production_management_updated', load);
  }, []);

  useEffect(() => {
    if (orderToEdit) {
      setForm({
        id: orderToEdit.id,
        orderNumber: orderToEdit.orderNumber,
        buyer: orderToEdit.buyer,
        styleName: orderToEdit.styleName,
        styleNumber: orderToEdit.styleNumber || '',
        unit: orderToEdit.unit || 'Unit 01 (Dhaka Complex)',
        section: orderToEdit.section || orderToEdit.sewingLine || 'Sewing Line 01 (Knit Tops)',
        lineId: orderToEdit.lineId || 'Line 01',
        targetQuantity: orderToEdit.targetQuantity,
        completedQuantity: orderToEdit.completedQuantity || 0,
        totalDefects: orderToEdit.totalDefects ?? Math.round(orderToEdit.completedQuantity * ((orderToEdit.dhuRate || orderToEdit.defectRate || 1.2) / 100)),
        dhuRate: orderToEdit.dhuRate ?? orderToEdit.defectRate ?? 1.2,
        rftRate: orderToEdit.rftRate ?? 98.2,
        efficiencyPercent: orderToEdit.efficiencyPercent ?? 82,
        rejectQuantity: orderToEdit.rejectQuantity ?? 15,
        status: orderToEdit.status,
        dueDate: orderToEdit.dueDate ? orderToEdit.dueDate.split('T')[0] : '',
        operatorCount: orderToEdit.operatorCount || 45,
        supervisorName: orderToEdit.supervisorName || '',
        remarks: orderToEdit.remarks || '',
      });
    } else {
      setForm({
        unit: 'Unit 01 (Dhaka Complex)',
        section: 'Sewing Line 01 (Knit Tops)',
        lineId: 'Line 01',
        status: 'RUNNING',
        targetQuantity: 10000,
        completedQuantity: 0,
        totalDefects: 50,
        dhuRate: 1.1,
        rftRate: 98.5,
        efficiencyPercent: 82,
        rejectQuantity: 15,
        operatorCount: 45,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
      });
    }
  }, [orderToEdit, isOpen]);

  const set = (field: keyof NewProductionOrderData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.orderNumber?.trim()) {
      setError('Order / Work Order Number is required.');
      return;
    }
    if (!form.buyer?.trim()) {
      setError('Buyer name is required.');
      return;
    }
    if (!form.styleName?.trim()) {
      setError('Style name is required.');
      return;
    }
    if (!form.targetQuantity || form.targetQuantity <= 0) {
      setError('Target quantity must be greater than 0.');
      return;
    }
    if (!form.dueDate) {
      setError('Due date / ship date is required.');
      return;
    }

    const matchedLine = SECTIONS_AND_LINES.find((s) => s.id === form.lineId || s.label === form.section);

    onSave({
      id: form.id,
      orderNumber: form.orderNumber.trim(),
      buyer: form.buyer.trim(),
      styleName: form.styleName.trim(),
      styleNumber: form.styleNumber?.trim() || `STY-${Math.floor(1000 + Math.random() * 9000)}`,
      unit: form.unit || 'Unit 01 (Dhaka Complex)',
      section: form.section || matchedLine?.label || 'Sewing Line 01 (Knit Tops)',
      targetQuantity: Number(form.targetQuantity) || 10000,
      completedQuantity: Number(form.completedQuantity) || 0,
      totalDefects: Number(form.totalDefects) || 0,
      dhuRate: Number(form.dhuRate) || 1.2,
      rftRate: Number(form.rftRate) || 98.0,
      efficiencyPercent: Number(form.efficiencyPercent) || 82,
      rejectQuantity: Number(form.rejectQuantity) || 0,
      sewingLine: matchedLine?.label || form.section || 'Line 01',
      lineId: form.lineId || 'Line 01',
      status: (form.status as LineStatus) || 'RUNNING',
      dueDate: form.dueDate,
      operatorCount: Number(form.operatorCount) || 45,
      supervisorName: form.supervisorName?.trim() || 'Floor Supervisor',
      remarks: form.remarks?.trim() || '',
    });

    onClose();
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header styled cleanly like Buyer & Order */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {orderToEdit ? `Edit Record: ${orderToEdit.orderNumber}` : 'New Production & Quality Record'}
              </h2>
              <p className="text-xs text-slate-500">
                Record Unit, Section, Buyer, Style, Target, Production, Defects, DHU, RFT, Efficiency & Rejects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Facility & Location (Unit & Section) */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              1. Manufacturing Unit & Section
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit (Manufacturing Plant / Facility) *
                </label>
                <select
                  value={form.unit || ''}
                  onChange={(e) => set('unit', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {(managedUnits.length > 0 ? managedUnits.map((u) => u.name) : MANUFACTURING_UNITS).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section & Production Line (From Management) *
                </label>
                <select
                  value={form.section || ''}
                  onChange={(e) => {
                    const selManaged = managedLines.find((l) => l.name === e.target.value || l.id === e.target.value);
                    if (selManaged) {
                      set('section', selManaged.name);
                      set('lineId', selManaged.lineCode || selManaged.id);
                      if (selManaged.unitName) set('unit', selManaged.unitName);
                      if (selManaged.lineChief) set('supervisorName', selManaged.lineChief);
                      if (selManaged.operatorCount) set('operatorCount', selManaged.operatorCount);
                    } else {
                      const sel = SECTIONS_AND_LINES.find((s) => s.label === e.target.value);
                      set('section', e.target.value);
                      if (sel) set('lineId', sel.id);
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  {managedLines.length > 0 ? (
                    managedLines.map((l) => (
                      <option key={l.id} value={l.name}>
                        {l.name} ({l.lineCode}) • Chief: {l.lineChief} • QC: {l.qualityController}
                      </option>
                    ))
                  ) : (
                    SECTIONS_AND_LINES.map((s) => (
                      <option key={s.id} value={s.label}>
                        {s.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Order, Buyer & Style */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              2. Order Identity, Buyer & Style
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order / PO Number *
                </label>
                <input
                  value={form.orderNumber || ''}
                  onChange={(e) => set('orderNumber', e.target.value)}
                  placeholder="e.g. PO-HM-2026-14"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer Name *
                </label>
                <input
                  list="buyer-options"
                  value={form.buyer || ''}
                  onChange={(e) => set('buyer', e.target.value)}
                  placeholder="e.g. H&M Global, Inditex"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="buyer-options">
                  {BUYERS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Style Number *
                </label>
                <input
                  value={form.styleNumber || ''}
                  onChange={(e) => set('styleNumber', e.target.value)}
                  placeholder="e.g. STY-HM-2026-01"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Style Name & Description *
              </label>
              <input
                value={form.styleName || ''}
                onChange={(e) => set('styleName', e.target.value)}
                placeholder="e.g. Essential Organic Tee Crew Neck"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 3: Target, Production & Quality Metrics */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              3. Target, Total Production, Defects, DHU, RFT, Efficiency & Reject
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target (pcs) *
                </label>
                <input
                  type="number"
                  value={form.targetQuantity || ''}
                  onChange={(e) => set('targetQuantity', parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Production (pcs) *
                </label>
                <input
                  type="number"
                  value={form.completedQuantity !== undefined ? form.completedQuantity : ''}
                  onChange={(e) => set('completedQuantity', parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Defects (count) *
                </label>
                <input
                  type="number"
                  value={form.totalDefects !== undefined ? form.totalDefects : ''}
                  onChange={(e) => {
                    const def = parseInt(e.target.value) || 0;
                    set('totalDefects', def);
                    // auto calculate DHU if total production > 0
                    if (form.completedQuantity && form.completedQuantity > 0) {
                      set('dhuRate', Number(((def / form.completedQuantity) * 100).toFixed(2)));
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-amber-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DHU Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.dhuRate !== undefined ? form.dhuRate : ''}
                  onChange={(e) => set('dhuRate', parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RFT (Right First Time %) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.rftRate !== undefined ? form.rftRate : ''}
                  onChange={(e) => set('rftRate', parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-emerald-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Efficiency (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.efficiencyPercent !== undefined ? form.efficiencyPercent : ''}
                  onChange={(e) => set('efficiencyPercent', parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reject (Garment Scrap pcs) *
                </label>
                <input
                  type="number"
                  value={form.rejectQuantity !== undefined ? form.rejectQuantity : ''}
                  onChange={(e) => set('rejectQuantity', parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-rose-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order Status *
                </label>
                <select
                  value={form.status || 'RUNNING'}
                  onChange={(e) => set('status', e.target.value as LineStatus)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="RUNNING">Running</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PAUSED">Paused / Hold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Operations & Scheduling */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ship / Due Date *
              </label>
              <input
                type="date"
                value={form.dueDate || ''}
                onChange={(e) => set('dueDate', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operator Count
              </label>
              <input
                type="number"
                value={form.operatorCount || ''}
                onChange={(e) => set('operatorCount', parseInt(e.target.value) || 0)}
                placeholder="e.g. 45"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Line Supervisor
              </label>
              <input
                value={form.supervisorName || ''}
                onChange={(e) => set('supervisorName', e.target.value)}
                placeholder="e.g. Kabir Hossain"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks & Technical Quality Notes
            </label>
            <textarea
              value={form.remarks || ''}
              onChange={(e) => set('remarks', e.target.value)}
              rows={2}
              placeholder="e.g. Needle breakage logs verified, shade tolerance delta E < 0.5"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer styled cleanly like Buyer & Order */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{orderToEdit ? 'Save Changes' : 'Create Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
