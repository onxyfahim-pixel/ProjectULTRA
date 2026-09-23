'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowDownLeft,
  Boxes,
  Truck,
  FileText,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Tag,
  ShoppingBag,
  Building2,
} from 'lucide-react';
import { InventoryItem, MaterialCategory, QualityGrade, ReceiveRecord } from '@/lib/types/erp';
import { BuyerOrder, BOMItem, SubSupplier } from '@/lib/types/modules';
import { MOCK_BUYER_ORDERS, MOCK_SUB_SUPPLIERS } from '@/lib/db/modules-mock-data';

interface ReceiveMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceive: (record: ReceiveRecord, updatedItem?: Partial<InventoryItem>) => void;
  existingItems: InventoryItem[];
  orders?: BuyerOrder[];
  subSuppliers?: SubSupplier[];
  preSelectedOrderId?: string;
  preSelectedPoNumber?: string;
  preSelectedStyleNumber?: string;
}

const CATEGORIES: { id: MaterialCategory; label: string; defaultUnit: string }[] = [
  { id: 'FABRIC', label: 'Fabric (Knit / Woven)', defaultUnit: 'Meters' },
  { id: 'SEWING_THREAD', label: 'Sewing Thread', defaultUnit: 'Cones' },
  { id: 'TRIMS_BUTTONS', label: 'Trims & Buttons / Rivets', defaultUnit: 'Gross' },
  { id: 'ZIPPERS', label: 'Zippers & Fasteners', defaultUnit: 'Pcs' },
  { id: 'INTERLINING_ELASTIC', label: 'Interlining & Elastic', defaultUnit: 'Meters' },
  { id: 'LABELS_PACKAGING', label: 'Labels, Polybags & Cartons', defaultUnit: 'Pcs' },
  { id: 'CHEMICALS_DYES', label: 'Chemicals & Finishing Dyes', defaultUnit: 'Kgs' },
];

const PRESET_SUPPLIERS = [
  'Square Textiles Ltd',
  'Pacific Textiles Mills Ltd',
  'Ha-Meem Denim Mills Ltd',
  'Envoy Textiles Ltd',
  'Coats Bangladesh Ltd',
  'YKK Fastening Auto Products',
  'Avery Dennison RBIS',
  'Kufner Interlining Asia',
  'Apex Elastic Industries',
  'Bengal Poly & Carton Ltd',
  'Sonali Paper & Packaging',
  'KDS Packaging Ltd',
];

export function ReceiveMaterialModal({
  isOpen,
  onClose,
  onReceive,
  existingItems,
  orders = MOCK_BUYER_ORDERS,
  subSuppliers = MOCK_SUB_SUPPLIERS,
  preSelectedOrderId,
  preSelectedPoNumber,
  preSelectedStyleNumber,
}: ReceiveMaterialModalProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // Extract unique styles and POs from existing orders
  const uniqueStyles = Array.from(new Set(orders.map((o) => o.styleNumber).filter(Boolean)));
  const uniquePOs = Array.from(new Set(orders.map((o) => o.orderNumber).filter(Boolean)));

  // Buyer Order Linkage state
  const initialOrderId =
    preSelectedOrderId ||
    (preSelectedPoNumber ? orders.find((o) => o.orderNumber === preSelectedPoNumber)?.id : undefined) ||
    (preSelectedStyleNumber ? orders.find((o) => o.styleNumber === preSelectedStyleNumber)?.id : undefined) ||
    orders[0]?.id ||
    'NONE';

  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId);
  const [selectedBomItemId, setSelectedBomItemId] = useState<string>('');
  const [isCustomSupplier, setIsCustomSupplier] = useState<boolean>(false);
  const [selectedSubSupplierName, setSelectedSubSupplierName] = useState<string>(
    subSuppliers[0]?.name || 'Pacific Textiles Mills Ltd'
  );

  const currentLinkedOrder = orders.find((o) => o.id === selectedOrderId);

  const [formData, setFormData] = useState<{
    grnNumber: string;
    date: string;
    category: MaterialCategory;
    sku: string;
    itemName: string;
    color: string;
    batchLot: string;
    supplierName: string;
    poNumber: string;
    styleNumber: string;
    buyerOrderId?: string;
    buyerName?: string;
    bomItemId: string;
    bomItemCode: string;
    challanNumber: string;
    receivedQty: number;
    unit: string;
    rollsReceived: number;
    unitCost: number;
    warehouseLocation: string;
    qcStatus: 'PASSED' | 'CONDITIONAL' | 'QUARANTINE' | 'REJECTED';
    qualityGrade: QualityGrade;
    receivedBy: string;
    inspectedBy: string;
    notes: string;
  }>({
    grnNumber: `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    category: 'FABRIC' as MaterialCategory,
    sku: '',
    itemName: '',
    color: '',
    batchLot: '',
    supplierName: subSuppliers[0]?.name || 'Pacific Textiles Mills Ltd',
    poNumber: preSelectedPoNumber || currentLinkedOrder?.orderNumber || (uniquePOs[0] || 'PO-HM-99201'),
    styleNumber: preSelectedStyleNumber || currentLinkedOrder?.styleNumber || (uniqueStyles[0] || 'STY-TS-2026'),
    buyerOrderId: currentLinkedOrder?.id,
    buyerName: currentLinkedOrder?.buyerName || 'H&M Hennes & Mauritz',
    bomItemId: '',
    bomItemCode: '',
    challanNumber: `CH-${Math.floor(10000 + Math.random() * 90000)}`,
    receivedQty: 1000,
    unit: 'Meters',
    rollsReceived: 10,
    unitCost: 3.5,
    warehouseLocation: 'WH-R01-B04',
    qcStatus: 'PASSED' as 'PASSED' | 'CONDITIONAL' | 'QUARANTINE' | 'REJECTED',
    qualityGrade: 'GRADE_A' as QualityGrade,
    receivedBy: 'Rafiqul Islam (Store Officer)',
    inspectedBy: 'Kazi Farhan (Senior QC)',
    notes: '',
  });

  // Keep order link in sync if preSelected props change
  useEffect(() => {
    if (preSelectedOrderId) {
      setSelectedOrderId(preSelectedOrderId);
      const ord = orders.find((o) => o.id === preSelectedOrderId);
      if (ord) {
        setFormData((prev) => ({
          ...prev,
          poNumber: ord.orderNumber,
          styleNumber: ord.styleNumber,
          buyerOrderId: ord.id,
          buyerName: ord.buyerName,
        }));
      }
    } else if (preSelectedPoNumber) {
      const ord = orders.find((o) => o.orderNumber === preSelectedPoNumber);
      if (ord) {
        setSelectedOrderId(ord.id);
        setFormData((prev) => ({
          ...prev,
          poNumber: ord.orderNumber,
          styleNumber: ord.styleNumber,
          buyerOrderId: ord.id,
          buyerName: ord.buyerName,
        }));
      }
    }
  }, [preSelectedOrderId, preSelectedPoNumber, orders]);

  // When existing item is selected, populate fields
  useEffect(() => {
    if (mode === 'existing' && selectedItemId) {
      const itm = existingItems.find((i) => i.id === selectedItemId);
      if (itm) {
        setFormData((prev) => ({
          ...prev,
          sku: itm.sku,
          itemName: itm.fabricType,
          color: itm.color,
          category: itm.category || 'FABRIC',
          unit: itm.unit || 'Meters',
          warehouseLocation: itm.warehouseLocation,
          supplierName: itm.supplierName || prev.supplierName,
          unitCost: itm.unitCost,
          batchLot: itm.batchLot,
          poNumber: itm.poNumber || prev.poNumber,
          styleNumber: itm.styleNumber || prev.styleNumber,
          buyerName: itm.buyerName || prev.buyerName,
          buyerOrderId: itm.buyerOrderId || prev.buyerOrderId,
        }));
        if (itm.buyerOrderId) {
          setSelectedOrderId(itm.buyerOrderId);
        }
        if (itm.supplierName) {
          const matchedSub = subSuppliers.find(
            (s) => s.name.toLowerCase() === itm.supplierName?.toLowerCase()
          );
          if (matchedSub) {
            setSelectedSubSupplierName(matchedSub.name);
            setIsCustomSupplier(false);
          } else {
            setSelectedSubSupplierName(itm.supplierName);
            setIsCustomSupplier(true);
          }
        }
      }
    } else if (mode === 'new') {
      setSelectedItemId('');
    }
  }, [mode, selectedItemId, existingItems, subSuppliers]);

  // When selected order changes, auto-set PO and Style references
  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedBomItemId('');

    if (orderId === 'NONE') {
      setFormData((prev) => ({
        ...prev,
        buyerOrderId: undefined,
        buyerName: undefined,
        bomItemId: '',
        bomItemCode: '',
      }));
      return;
    }

    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      setFormData((prev) => ({
        ...prev,
        poNumber: ord.orderNumber,
        styleNumber: ord.styleNumber,
        buyerOrderId: ord.id,
        buyerName: ord.buyerName,
        bomItemId: '',
        bomItemCode: '',
      }));
    }
  };

  // When PO is picked directly from dropdown
  const handlePoSelect = (po: string) => {
    if (po === 'CUSTOM') return;
    const ord = orders.find((o) => o.orderNumber === po);
    if (ord) {
      setSelectedOrderId(ord.id);
      setSelectedBomItemId('');
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
      setSelectedBomItemId('');
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

  // When Sub-Supplier is selected from registered list
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

  // When a BOM item from the order is selected, auto-populate all related material fields
  const handleBomItemSelect = (bomId: string) => {
    setSelectedBomItemId(bomId);
    if (!currentLinkedOrder || !bomId) return;

    const bom = currentLinkedOrder.bomItems?.find((b) => b.id === bomId);
    if (!bom) return;

    // Map BOM itemType to MaterialCategory
    let matchedCategory: MaterialCategory = 'FABRIC';
    let defaultUnit = 'Meters';

    if (bom.itemType === 'FABRIC') {
      matchedCategory = 'FABRIC';
      defaultUnit = bom.unit === 'kg' ? 'Kgs' : bom.unit === 'yds' ? 'Yards' : 'Meters';
    } else if (bom.itemType === 'THREAD') {
      matchedCategory = 'SEWING_THREAD';
      defaultUnit = 'Cones';
    } else if (bom.itemType === 'BUTTON') {
      matchedCategory = 'TRIMS_BUTTONS';
      defaultUnit = bom.unit === 'gross' ? 'Gross' : 'Pcs';
    } else if (bom.itemType === 'ZIPPER') {
      matchedCategory = 'ZIPPERS';
      defaultUnit = 'Pcs';
    } else if (bom.itemType === 'INTERLINING' || bom.itemType === 'LINING') {
      matchedCategory = 'INTERLINING_ELASTIC';
      defaultUnit = bom.unit === 'yds' ? 'Yards' : 'Meters';
    } else if (
      bom.itemType === 'LABEL' ||
      bom.itemType === 'HANGTAG' ||
      bom.itemType === 'POLYBAG' ||
      bom.itemType === 'CARTON'
    ) {
      matchedCategory = 'LABELS_PACKAGING';
      defaultUnit = 'Pcs';
    }

    const remainingQty = Math.max(0, bom.totalRequired - (bom.receivedQty || 0));

    setFormData((prev) => ({
      ...prev,
      category: matchedCategory,
      sku: bom.itemCode || prev.sku,
      itemName: bom.description,
      supplierName: bom.supplier || prev.supplierName,
      unit: defaultUnit,
      unitCost: bom.unitPriceUSD || prev.unitCost,
      receivedQty: remainingQty > 0 ? remainingQty : bom.totalRequired,
      bomItemId: bom.id,
      bomItemCode: bom.itemCode,
      notes: `GRN linked to BOM line [${bom.itemCode}] ${bom.description}. Auto-sync to Buyer Order ${currentLinkedOrder.orderNumber}.`,
    }));

    // If BOM supplier matches any SubSupplier, update selectedSubSupplierName
    const matchedSub = subSuppliers.find(
      (s) => s.name.toLowerCase() === (bom.supplier || '').toLowerCase()
    );
    if (matchedSub) {
      setSelectedSubSupplierName(matchedSub.name);
      setIsCustomSupplier(false);
    } else if (bom.supplier) {
      setSelectedSubSupplierName(bom.supplier);
      setIsCustomSupplier(true);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: ReceiveRecord = {
      id: `grn-${Date.now()}`,
      grnNumber: formData.grnNumber,
      date: formData.date,
      itemId: selectedItemId || `inv-${Date.now().toString().slice(-4)}`,
      sku: formData.sku || `RAW-${Math.floor(100 + Math.random() * 900)}`,
      category: formData.category,
      itemName: formData.itemName,
      supplierName: formData.supplierName,
      poNumber: formData.poNumber,
      styleNumber: formData.styleNumber,
      buyerOrderId: selectedOrderId !== 'NONE' ? selectedOrderId : undefined,
      buyerName: formData.buyerName,
      bomItemId: formData.bomItemId || undefined,
      bomItemCode: formData.bomItemCode || undefined,
      challanNumber: formData.challanNumber,
      receivedQty: Number(formData.receivedQty),
      unit: formData.unit,
      rollsReceived: formData.category === 'FABRIC' ? Number(formData.rollsReceived) : undefined,
      batchLot: formData.batchLot || `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      qcStatus: formData.qcStatus,
      qualityGrade: formData.qualityGrade,
      warehouseLocation: formData.warehouseLocation,
      receivedBy: formData.receivedBy,
      inspectedBy: formData.inspectedBy,
      notes: formData.notes,
    };

    const itemUpdate: Partial<InventoryItem> = {
      sku: newRecord.sku,
      category: newRecord.category,
      fabricType: newRecord.itemName,
      color: formData.color || 'Standard',
      batchLot: newRecord.batchLot,
      quantityMeters: newRecord.receivedQty,
      unit: newRecord.unit,
      rollCount: newRecord.rollsReceived || 0,
      qualityGrade: newRecord.qualityGrade,
      warehouseLocation: newRecord.warehouseLocation,
      supplierName: newRecord.supplierName,
      styleNumber: newRecord.styleNumber,
      poNumber: newRecord.poNumber,
      buyerOrderId: newRecord.buyerOrderId,
      buyerName: newRecord.buyerName,
      bomItemId: newRecord.bomItemId,
      linkedOrderNumber: newRecord.poNumber,
      unitCost: Number(formData.unitCost) || 1.0,
      status: 'IN_STOCK',
      updatedBy: formData.receivedBy,
    };

    onReceive(newRecord, itemUpdate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header matching Buyer & Order Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-2xs">
              <ArrowDownLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight flex items-center gap-2">
                <span>Inward Material Receive (GRN)</span>
                <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  Inventory &amp; PO Auto-Sync
                </span>
              </h3>
              <p className="text-xs text-blue-100">
                Log Goods Arrival Note, link to Buyer Order PO/Style, and update BOM fulfillment
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
          {/* SECTION 1: BUYER ORDER & STYLE LINKAGE */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                <LinkIcon className="w-4 h-4 text-blue-600" />
                <span>Link to Existing Buyer Order PO or Style</span>
              </div>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
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
                onChange={(e) => handleOrderChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-300 focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 shadow-2xs"
              >
                <option value="NONE">-- No Order Link (General Stock / Inward Stock) --</option>
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    [{ord.orderNumber}] {ord.buyerName} • Style: {ord.styleNumber} ({ord.styleDescription || 'Apparel'})
                  </option>
                ))}
              </select>
            </div>

            {/* Dual Independent Selectors: PO # and Style # from existing orders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Buyer Purchase Order (PO #) <span className="text-slate-400 font-normal">Selectable from Orders</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={uniquePOs.includes(formData.poNumber || '') ? formData.poNumber : 'CUSTOM'}
                    onChange={(e) => handlePoSelect(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 shadow-2xs"
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
                    className="w-32 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Style Reference Number <span className="text-slate-400 font-normal">Selectable from Orders</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={uniqueStyles.includes(formData.styleNumber || '') ? formData.styleNumber : 'CUSTOM'}
                    onChange={(e) => handleStyleSelect(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 shadow-2xs"
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
                    className="w-32 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Target Order BOM Line Item */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Target Order BOM Line Item (Auto-fill specs from Order BOM)
              </label>
              <select
                value={selectedBomItemId}
                onChange={(e) => handleBomItemSelect(e.target.value)}
                disabled={selectedOrderId === 'NONE' || !currentLinkedOrder}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-300 focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">-- Choose BOM Line Item to Fulfill --</option>
                {currentLinkedOrder?.bomItems?.map((bom) => (
                  <option key={bom.id} value={bom.id}>
                    [{bom.itemType}] {bom.itemCode} - {bom.description} • Req: {bom.totalRequired.toLocaleString()} {bom.unit} (Recv: {(bom.receivedQty || 0).toLocaleString()} {bom.unit}) • Supplier: {bom.supplier}
                  </option>
                ))}
              </select>
            </div>

            {currentLinkedOrder && selectedOrderId !== 'NONE' && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/90 border border-blue-200 text-xs">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800">{currentLinkedOrder.buyerName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono font-semibold text-blue-700">PO: {currentLinkedOrder.orderNumber}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-600">Style: {currentLinkedOrder.styleNumber}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{currentLinkedOrder.styleDescription}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Linked &amp; Synced to Order Details</span>
                </div>
              </div>
            )}
          </div>

          {/* Mode Selector: Existing SKU vs New Raw Material */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Receipt Type:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'existing'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Inward Existing SKU
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'new'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                + New Raw Material SKU
              </button>
            </div>
          </div>

          {/* Existing SKU Selector */}
          {mode === 'existing' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Existing Inventory Item *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Choose In-Stock Material --</option>
                {existingItems.map((itm) => (
                  <option key={itm.id} value={itm.id}>
                    [{itm.category || 'FABRIC'}] {itm.sku} - {itm.fabricType} ({itm.color}) • Current: {itm.quantityMeters} {itm.unit || 'Meters'} {itm.poNumber ? `(PO: ${itm.poNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Row 1: GRN Number, Date, Material Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GRN Number *
              </label>
              <input
                type="text"
                value={formData.grnNumber}
                onChange={(e) => setFormData({ ...formData, grnNumber: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receive Date *
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
                Raw Material Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value as MaterialCategory;
                  const found = CATEGORIES.find((c) => c.id === cat);
                  setFormData({
                    ...formData,
                    category: cat,
                    unit: found ? found.defaultUnit : 'Pcs',
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: SKU, Item Description & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Item SKU / Code *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. FAB-CTN-180 or TRD-COATS-120"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Material Description *
              </label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="e.g. 100% Cotton Single Jersey or Spun Poly Cones"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Color / Shade Reference
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g. Optic White #01"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Sub-Supplier Selection, PO #, Challan # */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Supplier / Mill (Select from Sub Supplier Module) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                {subSuppliers.length} Registered Sub-Suppliers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Sub Supplier Select Dropdown */}
              <div className="sm:col-span-2">
                <div className="flex gap-2">
                  <select
                    value={isCustomSupplier ? 'CUSTOM' : selectedSubSupplierName}
                    onChange={(e) => handleSubSupplierChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="">-- Choose Registered Sub Supplier --</option>
                    {subSuppliers.map((sup) => (
                      <option key={sup.id} value={sup.name}>
                        [{sup.code}] {sup.name} • {sup.category.replace(/_/g, ' ')} ({sup.country}) • Grade {sup.qualityRating}★
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
                      className="w-48 px-3 py-2 text-xs rounded-xl bg-white border border-blue-300 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-600 truncate max-w-[200px]">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {formData.supplierName || 'Select Sub-Supplier'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Challan / Invoice # */}
              <div>
                <input
                  type="text"
                  placeholder="Delivery Challan / Invoice # *"
                  value={formData.challanNumber}
                  onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Quantity, Unit, Rolls (if Fabric), Lot# */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100">
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1">
                Received Qty *
              </label>
              <input
                type="number"
                step="any"
                value={formData.receivedQty}
                onChange={(e) => setFormData({ ...formData, receivedQty: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1">
                Measurement Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Meters">Meters</option>
                <option value="Yards">Yards</option>
                <option value="Cones">Cones</option>
                <option value="Gross">Gross (144 pcs)</option>
                <option value="Pcs">Pcs</option>
                <option value="Kgs">Kgs</option>
                <option value="Packs">Packs</option>
                <option value="Rolls">Rolls</option>
              </select>
            </div>

            {formData.category === 'FABRIC' && (
              <div>
                <label className="block text-xs font-bold text-blue-950 mb-1">
                  Roll Count
                </label>
                <input
                  type="number"
                  value={formData.rollsReceived}
                  onChange={(e) => setFormData({ ...formData, rollsReceived: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1">
                Dyeing / Mill Lot # *
              </label>
              <input
                type="text"
                value={formData.batchLot}
                onChange={(e) => setFormData({ ...formData, batchLot: e.target.value })}
                placeholder="LOT-TX-9041A"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Row 5: Unit Cost, Warehouse Rack, QC Status, Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit Cost ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Storage Bay / Bin *
              </label>
              <input
                type="text"
                value={formData.warehouseLocation}
                onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                placeholder="WH-R01-B04"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                QC Status *
              </label>
              <select
                value={formData.qcStatus}
                onChange={(e) => setFormData({ ...formData, qcStatus: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="PASSED">Passed (Ready for Spreading/Floor)</option>
                <option value="CONDITIONAL">Conditional Pass</option>
                <option value="QUARANTINE">Quarantine (Lab Testing)</option>
                <option value="REJECTED">Rejected (Return to Mill)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quality Grade *
              </label>
              <select
                value={formData.qualityGrade}
                onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value as QualityGrade })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="GRADE_A">Grade A (Export Tier)</option>
                <option value="GRADE_B">Grade B (Commercial)</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Row 6: Receiver, Inspector & Inspection Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receiving Store Officer
              </label>
              <input
                type="text"
                value={formData.receivedBy}
                onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Inspected By (QC Officer)
              </label>
              <input
                type="text"
                value={formData.inspectedBy}
                onChange={(e) => setFormData({ ...formData, inspectedBy: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Inspection / Challan Verification Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Record any shade variation, roll weight discrepancies, packaging defects..."
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
              <span>Post GRN to Stock Ledger &amp; Sync Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
