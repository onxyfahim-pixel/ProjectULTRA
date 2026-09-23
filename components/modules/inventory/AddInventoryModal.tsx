'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Boxes,
  Layers,
  MapPin,
  DollarSign,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Barcode,
  Building2,
  FileSpreadsheet,
  Link as LinkIcon,
  Sparkles,
  ShoppingBag,
  Check,
} from 'lucide-react';
import { InventoryItem, QualityGrade, StockStatus, MaterialCategory } from '@/lib/types/erp';
import { BuyerOrder, SubSupplier } from '@/lib/types/modules';
import { MOCK_BUYER_ORDERS, MOCK_SUB_SUPPLIERS } from '@/lib/db/modules-mock-data';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<InventoryItem>) => void;
  initialData?: InventoryItem | null;
  orders?: BuyerOrder[];
  subSuppliers?: SubSupplier[];
}

const SAMPLE_LOCATIONS = [
  'WH-R01-B04',
  'WH-R02-B08',
  'WH-R03-B02',
  'WH-R04-B01',
  'WH-TRIM-A01',
  'WH-ACC-C01',
  'WH-PKG-A01',
  'WH-QUARANTINE-01',
  'WH-REJECT-BAY',
];

const MATERIAL_CATEGORIES: { id: MaterialCategory; label: string; defaultUnit: string }[] = [
  { id: 'FABRIC', label: 'Fabric (Knit / Woven)', defaultUnit: 'Meters' },
  { id: 'SEWING_THREAD', label: 'Sewing Thread', defaultUnit: 'Cones' },
  { id: 'TRIMS_BUTTONS', label: 'Trims & Buttons', defaultUnit: 'Gross' },
  { id: 'ZIPPERS', label: 'Zippers & Fasteners', defaultUnit: 'Pcs' },
  { id: 'INTERLINING_ELASTIC', label: 'Interlining & Elastic', defaultUnit: 'Meters' },
  { id: 'LABELS_PACKAGING', label: 'Packaging & Labels', defaultUnit: 'Pcs' },
  { id: 'CHEMICALS_DYES', label: 'Chemicals & Dyes', defaultUnit: 'Kgs' },
];

export function AddInventoryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  orders = MOCK_BUYER_ORDERS,
  subSuppliers = MOCK_SUB_SUPPLIERS,
}: AddInventoryModalProps) {
  // Extract unique styles and POs from existing orders
  const existingOrderOptions = orders.map((o) => ({
    id: o.id,
    poNumber: o.orderNumber,
    styleNumber: o.styleNumber,
    buyerName: o.buyerName,
    styleDescription: o.styleDescription || o.brand,
    bomItems: o.bomItems || [],
  }));

  const uniqueStyles = Array.from(new Set(orders.map((o) => o.styleNumber).filter(Boolean)));
  const uniquePOs = Array.from(new Set(orders.map((o) => o.orderNumber).filter(Boolean)));

  // Selected Order and Sub Supplier state
  const initialMatchingOrder = orders.find(
    (o) => o.id === initialData?.buyerOrderId || o.orderNumber === initialData?.poNumber || o.styleNumber === initialData?.styleNumber
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialMatchingOrder?.id || 'NONE');
  const [selectedBomId, setSelectedBomId] = useState<string>(initialData?.bomItemId || '');
  const [isCustomSupplier, setIsCustomSupplier] = useState<boolean>(false);
  const [selectedSubSupplierName, setSelectedSubSupplierName] = useState<string>(
    initialData?.supplierName || subSuppliers[0]?.name || 'Pacific Textiles Mills Ltd'
  );

  const [formData, setFormData] = useState<Partial<InventoryItem>>(() => ({
    sku: initialData?.sku || `FAB-${Math.floor(100 + Math.random() * 900)}-CTN`,
    category: initialData?.category || 'FABRIC',
    styleNumber: initialData?.styleNumber || initialMatchingOrder?.styleNumber || 'STY-TS-2026',
    poNumber: initialData?.poNumber || initialMatchingOrder?.orderNumber || 'PO-HM-99201',
    buyerOrderId: initialData?.buyerOrderId || initialMatchingOrder?.id,
    buyerName: initialData?.buyerName || initialMatchingOrder?.buyerName || 'H&M Hennes & Mauritz',
    fabricType: initialData?.fabricType || '100% Combed Cotton Single Jersey (180 GSM)',
    color: initialData?.color || 'Optic White',
    batchLot: initialData?.batchLot || `LOT-TX-${Math.floor(1000 + Math.random() * 9000)}A`,
    rollCount: initialData?.rollCount ?? 20,
    quantityMeters: initialData?.quantityMeters ?? 2000,
    unit: initialData?.unit || 'Meters',
    qualityGrade: initialData?.qualityGrade || 'GRADE_A',
    warehouseLocation: initialData?.warehouseLocation || SAMPLE_LOCATIONS[0],
    status: initialData?.status || 'IN_STOCK',
    unitCost: initialData?.unitCost ?? 4.25,
    supplierName: initialData?.supplierName || subSuppliers[0]?.name || 'Pacific Textiles Mills Ltd',
    gsm: initialData?.gsm || 180,
    widthInches: initialData?.widthInches || 60,
    shrinkagePercent: initialData?.shrinkagePercent || '-3.2% x -2.8%',
    deltaE: initialData?.deltaE || 0.65,
    fourPointScore: initialData?.fourPointScore || 14.5,
    barcode: initialData?.barcode || `BAR-${Date.now().toString().slice(-6)}`,
    rollWeightKg: initialData?.rollWeightKg || 420,
    inspectorName: initialData?.inspectorName || 'Rafiqul Islam (Warehouse QC)',
  }));

  const currentOrder = orders.find((o) => o.id === selectedOrderId);

  // When selected order changes, auto-populate Style, PO, and Buyer info
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedBomId('');

    if (orderId === 'NONE') {
      setFormData((prev) => ({
        ...prev,
        buyerOrderId: undefined,
        buyerName: undefined,
        bomItemId: undefined,
      }));
      return;
    }

    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      setFormData((prev) => ({
        ...prev,
        buyerOrderId: ord.id,
        buyerName: ord.buyerName,
        poNumber: ord.orderNumber,
        styleNumber: ord.styleNumber,
        bomItemId: undefined,
      }));
    }
  };

  // When PO is picked directly from dropdown
  const handlePoSelect = (po: string) => {
    if (po === 'CUSTOM') return;
    const ord = orders.find((o) => o.orderNumber === po);
    if (ord) {
      setSelectedOrderId(ord.id);
      setSelectedBomId('');
      setFormData((prev) => ({
        ...prev,
        poNumber: ord.orderNumber,
        styleNumber: ord.styleNumber,
        buyerOrderId: ord.id,
        buyerName: ord.buyerName,
      }));
    } else {
      setFormData((prev) => ({ ...prev, poNumber: po }));
    }
  };

  // When Style is picked directly from dropdown
  const handleStyleSelect = (st: string) => {
    if (st === 'CUSTOM') return;
    const ord = orders.find((o) => o.styleNumber === st);
    if (ord) {
      setSelectedOrderId(ord.id);
      setSelectedBomId('');
      setFormData((prev) => ({
        ...prev,
        poNumber: ord.orderNumber,
        styleNumber: ord.styleNumber,
        buyerOrderId: ord.id,
        buyerName: ord.buyerName,
      }));
    } else {
      setFormData((prev) => ({ ...prev, styleNumber: st }));
    }
  };

  // When BOM line item is picked from the chosen order
  const handleBomSelect = (bomId: string) => {
    setSelectedBomId(bomId);
    if (!currentOrder || !bomId) return;

    const bom = currentOrder.bomItems?.find((b) => b.id === bomId);
    if (!bom) return;

    let cat: MaterialCategory = 'FABRIC';
    let unit = 'Meters';

    if (bom.itemType === 'FABRIC') {
      cat = 'FABRIC';
      unit = bom.unit === 'kg' ? 'Kgs' : bom.unit === 'yds' ? 'Yards' : 'Meters';
    } else if (bom.itemType === 'THREAD') {
      cat = 'SEWING_THREAD';
      unit = 'Cones';
    } else if (bom.itemType === 'BUTTON') {
      cat = 'TRIMS_BUTTONS';
      unit = 'Gross';
    } else if (bom.itemType === 'ZIPPER') {
      cat = 'ZIPPERS';
      unit = 'Pcs';
    } else if (bom.itemType === 'INTERLINING' || bom.itemType === 'LINING') {
      cat = 'INTERLINING_ELASTIC';
      unit = 'Meters';
    } else if (bom.itemType === 'LABEL' || bom.itemType === 'POLYBAG' || bom.itemType === 'CARTON') {
      cat = 'LABELS_PACKAGING';
      unit = 'Pcs';
    }

    setFormData((prev) => ({
      ...prev,
      category: cat,
      fabricType: bom.description,
      sku: bom.itemCode || prev.sku,
      unitCost: bom.unitPriceUSD || prev.unitCost,
      unit: unit,
      supplierName: bom.supplier || prev.supplierName,
      bomItemId: bom.id,
    }));

    // If BOM supplier matches any SubSupplier, update selectedSubSupplierName
    const matchedSub = subSuppliers.find(
      (s) => s.name.toLowerCase() === (bom.supplier || '').toLowerCase()
    );
    if (matchedSub) {
      setSelectedSubSupplierName(matchedSub.name);
      setIsCustomSupplier(false);
    }
  };

  // When Sub Supplier is selected from the registered list
  const handleSubSupplierChange = (val: string) => {
    if (val === 'CUSTOM') {
      setIsCustomSupplier(true);
      return;
    }

    setIsCustomSupplier(false);
    setSelectedSubSupplierName(val);
    setFormData((prev) => ({
      ...prev,
      supplierName: val,
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku?.trim() || !formData.fabricType?.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header matching Buyer & Order module design */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Adjust Stock Item' : 'Add New Inventory Stock Batch'}
              </h3>
              <p className="text-xs text-slate-500">
                Register raw materials with Order PO/Style linkage and verified Sub-Supplier sourcing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: BUYER ORDER PO & STYLE SELECTION */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50 border border-blue-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                <LinkIcon className="w-4 h-4 text-blue-600" />
                <span>Link to Existing Buyer Order PO or Style</span>
              </div>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                Select from Active Orders
              </span>
            </div>

            {/* Quick Combined Order Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Select Active Buyer Purchase Order
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="NONE">-- No Order Link (General Stock / Factory Inventory) --</option>
                {existingOrderOptions.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    [{ord.poNumber}] {ord.buyerName} • Style: {ord.styleNumber} ({ord.styleDescription})
                  </option>
                ))}
              </select>
            </div>

            {/* Dual Independent Selectors: PO # and Style # */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Buyer Purchase Order (PO #)
                </label>
                <div className="flex gap-2">
                  <select
                    value={uniquePOs.includes(formData.poNumber || '') ? formData.poNumber : 'CUSTOM'}
                    onChange={(e) => handlePoSelect(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CUSTOM">-- Custom / Other PO --</option>
                    {uniquePOs.map((po) => (
                      <option key={po} value={po}>
                        {po}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Enter PO #"
                    value={formData.poNumber || ''}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    className="w-36 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Style Reference Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={uniqueStyles.includes(formData.styleNumber || '') ? formData.styleNumber : 'CUSTOM'}
                    onChange={(e) => handleStyleSelect(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CUSTOM">-- Custom / Other Style --</option>
                    {uniqueStyles.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Enter Style #"
                    value={formData.styleNumber || ''}
                    onChange={(e) => setFormData({ ...formData, styleNumber: e.target.value })}
                    className="w-36 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Optional BOM Item Line Selector if an order is active */}
            {currentOrder && currentOrder.bomItems && currentOrder.bomItems.length > 0 && (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Target BOM Line Item (Auto-fill specs from Order BOM)
                </label>
                <select
                  value={selectedBomId}
                  onChange={(e) => handleBomSelect(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose BOM Material Line --</option>
                  {currentOrder.bomItems.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.itemType}] {b.itemCode} - {b.description} (Req: {b.totalRequired.toLocaleString()} {b.unit}) • Supplier: {b.supplier}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentOrder && selectedOrderId !== 'NONE' && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/90 border border-blue-200 text-xs text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Linked to <b>{currentOrder.buyerName}</b> • PO: <b>{currentOrder.orderNumber}</b> • Style: <b>{currentOrder.styleNumber}</b>
                </span>
              </div>
            )}
          </div>

          {/* SECTION 2: MATERIAL IDENTITY & SPECIFICATIONS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Layers className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Material Construction &amp; Category
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Raw Material Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const cat = e.target.value as MaterialCategory;
                    const found = MATERIAL_CATEGORIES.find((c) => c.id === cat);
                    setFormData({
                      ...formData,
                      category: cat,
                      unit: found ? found.defaultUnit : 'Meters',
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  {MATERIAL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  SKU Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FAB-CTN-180-WHT"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Batch / Lot Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LOT-TX-9041A"
                  value={formData.batchLot}
                  onChange={(e) => setFormData({ ...formData, batchLot: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Material Description / Construction <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100% Combed Cotton Single Jersey (180 GSM)"
                  value={formData.fabricType}
                  onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Color / Shade Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Optic White / Deep Indigo"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* SECTION 2B: SUB-SUPPLIER SELECTION */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Supplier / Mill (Select from Sub Supplier Module) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  {subSuppliers.length} Registered Sub-Suppliers
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={isCustomSupplier ? 'CUSTOM' : selectedSubSupplierName}
                  onChange={(e) => handleSubSupplierChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="">-- Choose Registered Sub Supplier --</option>
                  {subSuppliers.map((sup) => (
                    <option key={sup.id} value={sup.name}>
                      [{sup.code}] {sup.name} • {sup.category.replace(/_/g, ' ')} ({sup.country}) • Grade {sup.qualityRating}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Custom / External Supplier</option>
                </select>

                {isCustomSupplier ? (
                  <input
                    type="text"
                    required
                    placeholder="Type supplier name..."
                    value={formData.supplierName || ''}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-300 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-600 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">
                      {formData.supplierName || 'Select a Sub Supplier'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* GSM & Width for Fabrics */}
            {formData.category === 'FABRIC' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Fabric Weight (GSM)
                  </label>
                  <input
                    type="number"
                    placeholder="180"
                    value={formData.gsm}
                    onChange={(e) => setFormData({ ...formData, gsm: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cuttable Width (Inches)
                  </label>
                  <input
                    type="number"
                    placeholder="60"
                    value={formData.widthInches}
                    onChange={(e) => setFormData({ ...formData, widthInches: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: QUANTITIES, UNIT & VALUATION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Quantity, Measurement Unit &amp; Valuation
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.quantityMeters}
                  onChange={(e) => setFormData({ ...formData, quantityMeters: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Measurement Unit <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Meters">Meters</option>
                  <option value="Yards">Yards</option>
                  <option value="Cones">Cones</option>
                  <option value="Gross">Gross</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Kgs">Kgs</option>
                  <option value="Rolls">Rolls</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Roll / Package Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.rollCount}
                  onChange={(e) => setFormData({ ...formData, rollCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Unit Cost ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: QUALITY CLASSIFICATION & WAREHOUSE LOCATION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Quality Classification &amp; Warehouse Location
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Quality Grade
                </label>
                <select
                  value={formData.qualityGrade}
                  onChange={(e) =>
                    setFormData({ ...formData, qualityGrade: e.target.value as QualityGrade })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="GRADE_A">Grade A (Export Ready)</option>
                  <option value="GRADE_B">Grade B (Commercial)</option>
                  <option value="ON_HOLD">On Hold (Lab Testing)</option>
                  <option value="REJECTED">Rejected (Quarantine)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Stock Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as StockStatus })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="IN_STOCK">In Stock</option>
                  <option value="INSPECTING">Inspecting</option>
                  <option value="ALLOCATED">Allocated to PO</option>
                  <option value="DISPATCHED">Dispatched to Line</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Warehouse Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH-R01-B04"
                  value={formData.warehouseLocation}
                  onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Inspector / Store QA
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rafiqul Islam"
                  value={formData.inspectorName}
                  onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer with exact Buyer & Order button styling */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>{initialData ? 'Save Stock Changes' : 'Save & Register Stock Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
