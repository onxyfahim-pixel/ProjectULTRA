'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  Boxes,
  Scissors,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Factory,
} from 'lucide-react';
import { InventoryItem, IssueRecord } from '@/lib/types/erp';

interface IssueMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssue: (record: IssueRecord, updatedItem: InventoryItem) => void;
  items: InventoryItem[];
  preselectedItem?: InventoryItem | null;
}

const DEPARTMENTS: {
  id: 'CUTTING_FLOOR' | 'SEWING_LINE' | 'FINISHING_DEPT' | 'SAMPLE_SECTION';
  label: string;
  defaultDetails: string[];
}[] = [
  {
    id: 'CUTTING_FLOOR',
    label: 'Cutting Section (Spreading & Fusing)',
    defaultDetails: [
      'Cutting Spreading Table 01',
      'Cutting Spreading Table 02',
      'Cutting Spreading Table 03',
      'Band Knife Cutting Machine',
      'Fusing Machine Section 01',
      'Fusing Machine Section 02',
    ],
  },
  {
    id: 'SEWING_LINE',
    label: 'Sewing Production Lines',
    defaultDetails: [
      'Sewing Line 01 (Knit Tops)',
      'Sewing Line 02 (Basic Polo)',
      'Sewing Line 03 (Crewneck Tee)',
      'Sewing Line 04 (Hoodies & Fleece)',
      'Sewing Line 05 (Woven Shirts)',
      'Sewing Line 06 (Chino Pants)',
      'Sewing Line 07 (Denim 5-Pocket)',
      'Sewing Line 08 (Cargo Shorts)',
    ],
  },
  {
    id: 'FINISHING_DEPT',
    label: 'Finishing & Packing Floor',
    defaultDetails: [
      'Thread Sucking & Trimming Section',
      'Garment Washing Plant',
      'Steam Pressing / Ironing Table 01',
      'Steam Pressing / Ironing Table 02',
      'Finishing Packing Table 01',
      'Metal Detector & Needle Check Section',
    ],
  },
  {
    id: 'SAMPLE_SECTION',
    label: 'Sample Development Room',
    defaultDetails: ['Sampling Line 01 (Proto / Fit)', 'Sampling Line 02 (PP / Size Set)'],
  },
];

export function IssueMaterialModal({
  isOpen,
  onClose,
  onIssue,
  items,
  preselectedItem,
}: IssueMaterialModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState({
    sivNumber: `SIV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    issuedTo: 'CUTTING_FLOOR' as 'CUTTING_FLOOR' | 'SEWING_LINE' | 'FINISHING_DEPT' | 'SAMPLE_SECTION',
    departmentDetail: 'Cutting Spreading Table 01',
    poNumber: 'PO-HM-99201',
    styleNumber: 'STY-HM-2026-01',
    requisitionNumber: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
    issuedQty: 100,
    issuedBy: 'Rafiqul Islam (Store Head)',
    receivedByFloor: 'Kamal Hossain (Cutting Master)',
    purpose: 'Bulk production cut lay spreading',
    notes: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or update selected item
  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id);
      setSelectedItem(preselectedItem);
      setFormData((prev) => ({
        ...prev,
        styleNumber: preselectedItem.styleNumber || prev.styleNumber,
      }));
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
      setSelectedItem(items[0]);
    }
  }, [preselectedItem, items, selectedItemId]);

  useEffect(() => {
    if (selectedItemId) {
      const itm = items.find((i) => i.id === selectedItemId);
      if (itm) {
        setSelectedItem(itm);
        if (itm.styleNumber) {
          setFormData((prev) => ({ ...prev, styleNumber: itm.styleNumber }));
        }
      }
    }
  }, [selectedItemId, items]);

  if (!isOpen) return null;

  const currentMaxAvailable = selectedItem ? selectedItem.quantityMeters : 0;
  const currentUnit = selectedItem?.unit || 'Meters';

  const handleDeptChange = (deptId: any) => {
    const dept = DEPARTMENTS.find((d) => d.id === deptId);
    setFormData((prev) => ({
      ...prev,
      issuedTo: deptId,
      departmentDetail: dept ? dept.defaultDetails[0] : '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedItem) {
      setErrorMsg('Please select a material to issue.');
      return;
    }

    const qtyToIssue = Number(formData.issuedQty);
    if (qtyToIssue <= 0) {
      setErrorMsg('Issue quantity must be greater than zero.');
      return;
    }

    if (qtyToIssue > selectedItem.quantityMeters) {
      setErrorMsg(
        `Cannot issue ${qtyToIssue} ${currentUnit}. Available on-hand balance is only ${selectedItem.quantityMeters} ${currentUnit}.`
      );
      return;
    }

    const newSivRecord: IssueRecord = {
      id: `siv-${Date.now()}`,
      sivNumber: formData.sivNumber,
      date: formData.date,
      itemId: selectedItem.id,
      sku: selectedItem.sku,
      category: selectedItem.category || 'FABRIC',
      itemName: selectedItem.fabricType,
      issuedTo: formData.issuedTo,
      departmentDetail: formData.departmentDetail,
      poNumber: formData.poNumber,
      styleNumber: formData.styleNumber,
      requisitionNumber: formData.requisitionNumber,
      issuedQty: qtyToIssue,
      unit: currentUnit,
      issuedBy: formData.issuedBy,
      receivedByFloor: formData.receivedByFloor,
      purpose: formData.purpose,
      notes: formData.notes,
    };

    // Calculate updated stock item
    const newQty = selectedItem.quantityMeters - qtyToIssue;
    const rollsDeducted =
      selectedItem.category === 'FABRIC' && selectedItem.rollCount > 0
        ? Math.max(0, Math.round(selectedItem.rollCount * (newQty / (selectedItem.quantityMeters || 1))))
        : selectedItem.rollCount;

    const updatedItem: InventoryItem = {
      ...selectedItem,
      quantityMeters: newQty,
      rollCount: rollsDeducted,
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: formData.issuedBy,
    };

    onIssue(newSivRecord, updatedItem);
    onClose();
  };

  const activeDeptObj = DEPARTMENTS.find((d) => d.id === formData.issuedTo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header matching Buyer & Order Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                Store Issue Voucher (SIV) - Material Issue
              </h3>
              <p className="text-xs text-blue-100">
                Issue raw material to Cutting, Sewing, or Finishing lines
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Material from Stock */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Select Raw Material to Issue *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
            >
              {items.map((itm) => (
                <option key={itm.id} value={itm.id}>
                  [{itm.category || 'FABRIC'}] {itm.sku} - {itm.fabricType} ({itm.color}) • Stock Available: {itm.quantityMeters.toLocaleString()} {itm.unit || 'Meters'} • Loc: {itm.warehouseLocation}
                </option>
              ))}
            </select>

            {selectedItem && (
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Current Available Balance</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    {selectedItem.quantityMeters.toLocaleString()} {currentUnit}
                  </span>
                  {selectedItem.category === 'FABRIC' && selectedItem.rollCount > 0 && (
                    <span className="text-[11px] text-slate-500 ml-2 font-mono">
                      ({selectedItem.rollCount} Rolls in {selectedItem.warehouseLocation})
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px] block">Unit Valuation</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ${selectedItem.unitCost.toFixed(2)} / {currentUnit}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Row 1: SIV Number, Date, Requisition Slip # */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SIV Voucher # *
              </label>
              <input
                type="text"
                value={formData.sivNumber}
                onChange={(e) => setFormData({ ...formData, sivNumber: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Floor Requisition Slip # *
              </label>
              <input
                type="text"
                value={formData.requisitionNumber}
                onChange={(e) => setFormData({ ...formData, requisitionNumber: e.target.value })}
                placeholder="REQ-CUT-2026-088"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Row 2: Destination Department & Specific Section / Line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destination Department *
              </label>
              <select
                value={formData.issuedTo}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specific Sewing Line / Cutting Table *
              </label>
              <select
                value={formData.departmentDetail}
                onChange={(e) => setFormData({ ...formData, departmentDetail: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {activeDeptObj?.defaultDetails.map((det) => (
                  <option key={det} value={det}>
                    {det}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Target PO Number & Style Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Buyer PO # Reference *
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                placeholder="PO-HM-99201"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Garment Style # *
              </label>
              <input
                type="text"
                value={formData.styleNumber}
                onChange={(e) => setFormData({ ...formData, styleNumber: e.target.value })}
                placeholder="STY-HM-2026-01"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Row 4: Issue Quantity & Unit */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950">
                Quantity to Issue ({currentUnit}) *
              </label>
              <span className="text-[11px] text-amber-800 font-mono">
                Max Allowed: {currentMaxAvailable.toLocaleString()} {currentUnit}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step="any"
                max={currentMaxAvailable}
                value={formData.issuedQty}
                onChange={(e) => setFormData({ ...formData, issuedQty: parseFloat(e.target.value) || 0 })}
                required
                className="flex-1 px-3.5 py-2 text-sm rounded-xl bg-white border border-amber-300 focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900"
              />
              <span className="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs">
                {currentUnit}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Remaining Balance after issue:{' '}
                <strong className="text-slate-800 font-mono">
                  {Math.max(0, currentMaxAvailable - (Number(formData.issuedQty) || 0)).toLocaleString()} {currentUnit}
                </strong>
              </span>
              <span>
                Floor Value Issued:{' '}
                <strong className="text-emerald-700 font-mono">
                  ${((Number(formData.issuedQty) || 0) * (selectedItem?.unitCost || 0)).toFixed(2)}
                </strong>
              </span>
            </div>
          </div>

          {/* Row 5: Store Issuer & Floor Receiver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Issued By (Store Officer) *
              </label>
              <input
                type="text"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Received By (Floor Supervisor / In-Charge) *
              </label>
              <input
                type="text"
                value={formData.receivedByFloor}
                onChange={(e) => setFormData({ ...formData, receivedByFloor: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Issue Purpose & Operation Notes
            </label>
            <textarea
              rows={2}
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g. Spreading lay #04, waistband attachment, or zipper fly insertion..."
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
              <span>Confirm SIV Issue & Deduct Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
