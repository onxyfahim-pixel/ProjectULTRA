'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Upload,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  DollarSign,
  Package,
  X,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { BOMItem } from '@/lib/types/modules';

interface OrderBOMSectionProps {
  orderId: string;
  orderQuantity: number;
  initialBomItems?: BOMItem[];
  onUpdateBOM?: (items: BOMItem[]) => void;
  showToast: (msg: string) => void;
  readOnly?: boolean;
}

const DEFAULT_SAMPLE_BOM: BOMItem[] = [
  {
    id: 'bom-1',
    itemType: 'FABRIC',
    itemCode: 'FAB-CTN-180',
    description: '100% Combed Cotton Single Jersey 180 GSM (Enzyme Washed)',
    supplier: 'Square Textiles Ltd',
    consumptionPerGarment: 0.32,
    unit: 'kg',
    unitPriceUSD: 7.20,
    totalRequired: 14400,
    status: 'RECEIVED',
  },
  {
    id: 'bom-2',
    itemType: 'THREAD',
    itemCode: 'THR-ASTRA-40',
    description: 'Astra Spun Poly Sewing Thread 120s (Match to Fabric)',
    supplier: 'Coats Bangladesh',
    consumptionPerGarment: 110,
    unit: 'meters',
    unitPriceUSD: 0.002,
    totalRequired: 4950000,
    status: 'RECEIVED',
  },
  {
    id: 'bom-3',
    itemType: 'BUTTON',
    itemCode: 'BTN-POLY-18L',
    description: '4-Hole Engraved Polyester Pearl Button 18L',
    supplier: 'YKK Fastening Products',
    consumptionPerGarment: 7,
    unit: 'pcs',
    unitPriceUSD: 0.015,
    totalRequired: 315000,
    status: 'RECEIVED',
  },
  {
    id: 'bom-4',
    itemType: 'LABEL',
    itemCode: 'LBL-WVN-MAIN',
    description: 'Damask Woven Main Neck Label + OEKO-TEX certified',
    supplier: 'Avery Dennison BD',
    consumptionPerGarment: 1,
    unit: 'pcs',
    unitPriceUSD: 0.045,
    totalRequired: 45000,
    status: 'IN_TRANSIT',
  },
  {
    id: 'bom-5',
    itemType: 'POLYBAG',
    itemCode: 'PLY-RECYCLE',
    description: '100% Recycled Self-Adhesive Polybag with Warning Notice',
    supplier: 'KDS Packaging Ltd',
    consumptionPerGarment: 1,
    unit: 'pcs',
    unitPriceUSD: 0.030,
    totalRequired: 45000,
    status: 'SOURCED',
  },
  {
    id: 'bom-6',
    itemType: 'CARTON',
    itemCode: 'CTN-7PLY-EXP',
    description: '7-Ply Heavy Corrugated Export Carton (48 pcs/box standard)',
    supplier: 'Sonali Paper & Packaging',
    consumptionPerGarment: 0.021,
    unit: 'pcs',
    unitPriceUSD: 1.85,
    totalRequired: 940,
    status: 'PENDING',
  },
];

export function OrderBOMSection({
  orderQuantity,
  initialBomItems,
  onUpdateBOM,
  showToast,
  readOnly = false,
}: OrderBOMSectionProps) {
  const [bomItems, setBomItems] = useState<BOMItem[]>(
    initialBomItems && initialBomItems.length > 0 ? initialBomItems : DEFAULT_SAMPLE_BOM
  );

  React.useEffect(() => {
    if (initialBomItems && initialBomItems.length > 0) {
      setBomItems(initialBomItems);
    }
  }, [initialBomItems]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // New BOM Item Form
  const [newItem, setNewItem] = useState<Partial<BOMItem>>({
    itemType: 'FABRIC',
    itemCode: '',
    description: '',
    supplier: '',
    consumptionPerGarment: 1,
    unit: 'yds',
    unitPriceUSD: 1.5,
    status: 'SOURCED',
  });

  const totalBOMCostPerGarment = bomItems.reduce(
    (sum, item) => sum + item.consumptionPerGarment * item.unitPriceUSD,
    0
  );
  const totalBOMOrderCost = totalBOMCostPerGarment * orderQuantity;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.itemCode || !newItem.description) return;

    const consumption = Number(newItem.consumptionPerGarment) || 1;
    const itemToAdd: BOMItem = {
      id: `bom-${Date.now()}`,
      itemType: (newItem.itemType as any) || 'OTHER',
      itemCode: newItem.itemCode.toUpperCase(),
      description: newItem.description,
      supplier: newItem.supplier || 'Local Mills',
      consumptionPerGarment: consumption,
      unit: newItem.unit || 'pcs',
      unitPriceUSD: Number(newItem.unitPriceUSD) || 0.5,
      totalRequired: Math.ceil(consumption * orderQuantity),
      status: (newItem.status as any) || 'PENDING',
    };

    const updated = [...bomItems, itemToAdd];
    setBomItems(updated);
    onUpdateBOM?.(updated);
    setIsAddModalOpen(false);
    showToast(`Added BOM item ${itemToAdd.itemCode}`);

    setNewItem({
      itemType: 'FABRIC',
      itemCode: '',
      description: '',
      supplier: '',
      consumptionPerGarment: 1,
      unit: 'yds',
      unitPriceUSD: 1.5,
      status: 'SOURCED',
    });
  };

  const handleDeleteItem = (id: string, code: string) => {
    const updated = bomItems.filter((b) => b.id !== id);
    setBomItems(updated);
    onUpdateBOM?.(updated);
    showToast(`BOM item ${code} removed`);
  };

  const handleSimulateUpload = (fileName: string) => {
    const generatedItems: BOMItem[] = [
      {
        id: `bom-imp-1-${Date.now()}`,
        itemType: 'FABRIC',
        itemCode: 'IMP-SHELL-DENIM',
        description: 'Imported Organic Indigo Denim 12.5oz',
        supplier: 'Arvind Mills Ltd',
        consumptionPerGarment: 1.52,
        unit: 'yds',
        unitPriceUSD: 3.85,
        totalRequired: Math.ceil(1.52 * orderQuantity),
        status: 'RECEIVED',
      },
      {
        id: `bom-imp-2-${Date.now()}`,
        itemType: 'ZIPPER',
        itemCode: 'IMP-YKK-M4',
        description: 'YKK Metal Zipper Brass Teeth Auto-lock',
        supplier: 'YKK Fastening',
        consumptionPerGarment: 1,
        unit: 'pcs',
        unitPriceUSD: 0.32,
        totalRequired: orderQuantity,
        status: 'RECEIVED',
      },
      {
        id: `bom-imp-3-${Date.now()}`,
        itemType: 'INTERLINING',
        itemCode: 'INT-WOVEN-FUSE',
        description: 'Microdot Woven Fusible Interlining 75 GSM',
        supplier: 'Vilene / Freudenberg',
        consumptionPerGarment: 0.18,
        unit: 'meters',
        unitPriceUSD: 0.85,
        totalRequired: Math.ceil(0.18 * orderQuantity),
        status: 'IN_TRANSIT',
      },
    ];

    const updated = [...bomItems, ...generatedItems];
    setBomItems(updated);
    onUpdateBOM?.(updated);
    setIsUploadModalOpen(false);
    showToast(`Successfully parsed & imported 3 items from ${fileName}`);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bill of Materials (BOM) &amp; Consumption Matrix
            </h3>
            <p className="text-[11px] text-slate-500">
              Fabrics, trims, packaging specifications and unit consumption per garment
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload BOM</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>
        )}
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
        <div>
          <span className="text-slate-500 text-[11px]">BOM Line Items:</span>
          <div className="font-bold text-slate-900 mt-0.5">{bomItems.length} Materials</div>
        </div>
        <div>
          <span className="text-slate-500 text-[11px]">Material Cost / Garment:</span>
          <div className="font-bold font-mono text-blue-700 mt-0.5">
            ${totalBOMCostPerGarment.toFixed(3)} USD
          </div>
        </div>
        <div>
          <span className="text-slate-500 text-[11px]">Total Order BOM Cost:</span>
          <div className="font-bold font-mono text-emerald-700 mt-0.5">
            ${totalBOMOrderCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
          </div>
        </div>
        <div>
          <span className="text-slate-500 text-[11px]">Sourcing Readiness:</span>
          <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {Math.round(
                (bomItems.filter((b) => b.status === 'RECEIVED').length / (bomItems.length || 1)) * 100
              )}
              % In-House
            </span>
          </div>
        </div>
      </div>

      {/* BOM Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="p-2.5">Item Code &amp; Type</th>
              <th className="p-2.5">Material Description</th>
              <th className="p-2.5">Supplier / Mill</th>
              <th className="p-2.5 text-right">Consumption</th>
              <th className="p-2.5 text-right">Unit Price</th>
              <th className="p-2.5 text-right">Required Qty</th>
              <th className="p-2.5 text-right">Received (GRN)</th>
              <th className="p-2.5 text-center">GRN / QC Grade</th>
              <th className="p-2.5 text-center">Fulfillment Status</th>
              {!readOnly && <th className="p-2.5 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {bomItems.map((item) => {
              const statusColors: Record<string, string> = {
                RECEIVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                PARTIALLY_RECEIVED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200',
                SOURCED: 'bg-amber-50 text-amber-700 border-amber-200',
                PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
              };

              const receivedQty = item.receivedQty ?? (item.status === 'RECEIVED' ? item.totalRequired : 0);
              const percent = Math.min(100, Math.round((receivedQty / (item.totalRequired || 1)) * 100));

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5">
                    <span className="font-mono font-bold text-blue-700 text-xs">{item.itemCode}</span>
                    <div className="text-[10px] text-slate-500 uppercase">{item.itemType}</div>
                  </td>
                  <td className="p-2.5 font-medium max-w-xs">{item.description}</td>
                  <td className="p-2.5 text-slate-600">{item.supplier}</td>
                  <td className="p-2.5 text-right font-mono">
                    {item.consumptionPerGarment} <span className="text-[10px] text-slate-500">{item.unit}</span>
                  </td>
                  <td className="p-2.5 text-right font-mono">${item.unitPriceUSD.toFixed(3)}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                    {item.totalRequired.toLocaleString()} {item.unit}
                  </td>
                  <td className="p-2.5 text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {receivedQty.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                    </div>
                    <div className="w-24 ml-auto mt-1 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent >= 100 ? 'bg-emerald-500' : percent > 0 ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-semibold">{percent}% fulfilled</span>
                  </td>
                  <td className="p-2.5 text-center">
                    {item.grnNumber ? (
                      <div className="space-y-0.5">
                        <span className="inline-block px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.grnNumber}
                        </span>
                        {item.qcGrade && (
                          <div className="text-[9px] font-bold text-emerald-700 flex items-center justify-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{item.qcGrade.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Pending GRN</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        statusColors[item.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  {!readOnly && (
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.itemCode)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete BOM item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD BOM ITEM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Add Material to BOM</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Material Category</label>
                  <select
                    value={newItem.itemType}
                    onChange={(e) => setNewItem({ ...newItem, itemType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  >
                    <option value="FABRIC">Fabric (Shell / Pocketing)</option>
                    <option value="LINING">Lining</option>
                    <option value="BUTTON">Buttons / Snaps</option>
                    <option value="ZIPPER">Zippers</option>
                    <option value="THREAD">Sewing Thread</option>
                    <option value="LABEL">Labels (Main / Care / Size)</option>
                    <option value="HANGTAG">Hangtag / Price Ticket</option>
                    <option value="POLYBAG">Polybag</option>
                    <option value="CARTON">Export Carton</option>
                    <option value="INTERLINING">Interlining</option>
                    <option value="OTHER">Other Trims</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAB-DEN-12OZ"
                    value={newItem.itemCode}
                    onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description / Spec *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100% Cotton 3/1 Right Hand Twill Indigo 12.5oz"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Supplier / Mill</label>
                  <input
                    type="text"
                    placeholder="e.g. Envoy Textiles Ltd"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status</label>
                  <select
                    value={newItem.status}
                    onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  >
                    <option value="SOURCED">Sourced / Ordered</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="RECEIVED">Received in Warehouse</option>
                    <option value="PENDING">Pending Approval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Consumption / pc</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={newItem.consumptionPerGarment}
                    onChange={(e) => setNewItem({ ...newItem, consumptionPerGarment: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Unit</label>
                  <input
                    type="text"
                    placeholder="yds, kg, pcs, m"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Unit Cost ($ USD)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={newItem.unitPriceUSD}
                    onChange={(e) => setNewItem({ ...newItem, unitPriceUSD: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Add to BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD / IMPORT BOM FILE */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Upload &amp; Import BOM Spreadsheet</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Drag & drop upload box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const files = e.dataTransfer.files;
                  if (files && files[0]) {
                    handleSimulateUpload(files[0].name);
                  }
                }}
                className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-2 cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
                onClick={() => handleSimulateUpload('TechPack_BOM_Master_SS26.xlsx')}
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-800">
                  Click to choose Excel / CSV or drag &amp; drop BOM file here
                </div>
                <p className="text-[11px] text-slate-500">
                  Supports .XLSX, .XLS, .CSV format with columns for Item Code, Consumption, Unit, Cost, Supplier
                </p>
              </div>

              {/* Sample Files Ready to Load */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Quick Load Preset Tech Pack BOMs:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateUpload('Denim_Pants_Full_BOM_Inditex.xlsx')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900">Denim Jeans Tech Pack</div>
                    <div className="text-[10px] text-slate-500">Fabric, YKK zipper, rivets, shank</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateUpload('Knit_Crewneck_BOM_HM_Divided.xlsx')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900">Knit T-Shirt BOM</div>
                    <div className="text-[10px] text-slate-500">Jersey 180gsm, rib, neck tape</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 mt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
