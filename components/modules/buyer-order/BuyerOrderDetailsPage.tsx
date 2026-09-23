'use client';

import React from 'react';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Package,
  Layers,
  FileCheck2,
  Mail,
  Phone,
  UserCheck,
  Tag,
  ShieldCheck,
  Clock,
  Printer,
  Edit,
  Copy,
  FileText,
  Trash2,
  Boxes,
  Plus,
  CheckCircle2,
  MapPin,
  Sparkles,
  ArrowDownLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { BuyerOrder } from '@/lib/types/modules';
import { InventoryItem, ReceiveRecord } from '@/lib/types/erp';
import { INITIAL_INVENTORY, INITIAL_RECEIVE_REGISTRY } from '@/lib/db/mock-data';
import { OrderBOMSection } from './OrderBOMSection';
import { OrderProductionTracking } from './OrderProductionTracking';
import { OrderLogisticsSection } from './OrderLogisticsSection';

interface BuyerOrderDetailsPageProps {
  order: BuyerOrder;
  onBack: () => void;
  onEdit: (order: BuyerOrder) => void;
  onDuplicate: (order: BuyerOrder) => void;
  onDelete?: (order: BuyerOrder) => void;
  showToast: (msg: string) => void;
  inventoryItems?: InventoryItem[];
  receiveRecords?: ReceiveRecord[];
  onOpenReceiveModalForOrder?: (order: BuyerOrder) => void;
}

const CATEGORY_COLORS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  FABRIC: { label: 'Fabric', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  SEWING_THREAD: { label: 'Thread', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  TRIMS_BUTTONS: { label: 'Trims/Buttons', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ZIPPERS: { label: 'Zippers', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  INTERLINING_ELASTIC: { label: 'Interlining', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  LABELS_PACKAGING: { label: 'Packaging', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  CHEMICALS_DYES: { label: 'Chemicals', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export function BuyerOrderDetailsPage({
  order,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  showToast,
  inventoryItems = INITIAL_INVENTORY,
  receiveRecords = INITIAL_RECEIVE_REGISTRY,
  onOpenReceiveModalForOrder,
}: BuyerOrderDetailsPageProps) {
  const totalValue = order.orderQuantity * order.fobPrice;

  // Filter linked GRN records and inventory items for this specific purchase order and style
  const linkedGrn = (receiveRecords || []).filter(
    (rec) =>
      (rec.buyerOrderId && rec.buyerOrderId === order.id) ||
      (rec.poNumber && rec.poNumber.trim().toLowerCase() === order.orderNumber.trim().toLowerCase()) ||
      (rec.styleNumber && rec.styleNumber.trim().toLowerCase() === order.styleNumber.trim().toLowerCase())
  );

  const linkedInventory = (inventoryItems || []).filter(
    (itm) =>
      (itm.buyerOrderId && itm.buyerOrderId === order.id) ||
      (itm.poNumber && itm.poNumber.trim().toLowerCase() === order.orderNumber.trim().toLowerCase()) ||
      (itm.styleNumber && itm.styleNumber.trim().toLowerCase() === order.styleNumber.trim().toLowerCase())
  );

  const totalInwardUnits = linkedGrn.reduce((acc, r) => acc + (Number(r.receivedQty) || 0), 0);
  const passedLotsCount = linkedGrn.filter(
    (r) => r.qcStatus === 'PASSED' || r.qualityGrade === 'GRADE_A'
  ).length;
  const qcPassRate = linkedGrn.length > 0 ? Math.round((passedLotsCount / linkedGrn.length) * 100) : 100;
  const uniqueBins = Array.from(new Set(linkedGrn.map((r) => r.warehouseLocation).filter(Boolean)));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Order List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {order.orderNumber}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {order.status.replace(/_/g, ' ')}
              </span>
              {linkedGrn.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{linkedGrn.length} Materials Inwarded (GRN)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {order.buyerName} • {order.brand || 'Main Line'} • Style: {order.styleNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenReceiveModalForOrder && (
            <button
              type="button"
              onClick={() => onOpenReceiveModalForOrder(order)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
              title="Inward Raw Materials against this Purchase Order"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inward Material (GRN)</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(order)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
              title="Delete this purchase order"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete PO</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onDuplicate(order)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate PO</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(order)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xs hover:shadow cursor-pointer"
            title="Open separate full page editor for this order"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Order</span>
          </button>
        </div>
      </div>

      {/* Style & Commercial Details Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {/* Left: Style Picture & Main Specs */}
        <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Product Image (Read-Only) */}
            <div className="w-full sm:w-36 h-40 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0 relative">
              {order.productImage ? (
                <img
                  src={order.productImage}
                  alt={order.styleDescription}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Package className="w-8 h-8" />
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                {order.styleNumber}
              </div>
            </div>

            {/* Style Title & Summary Details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    {order.season || 'SS-2026 Collection'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {order.styleDescription || 'Garment Production Order'}
                  </h3>
                </div>

                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tech Pack Attached</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-500 text-[10px]">Order Quantity</span>
                  <div className="font-bold text-slate-900 font-mono text-sm">
                    {order.orderQuantity.toLocaleString()} pcs
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-500 text-[10px]">Unit FOB Price</span>
                  <div className="font-bold text-blue-700 font-mono text-sm">
                    ${order.fobPrice.toFixed(2)} USD
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 text-[10px]">Total Order Value</span>
                  <div className="font-bold text-emerald-700 font-mono text-sm">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary specs bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-500 block">Cutting Start</span>
                <span className="font-semibold text-slate-800">
                  {order.cuttingStartDate || '2026-09-12'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-[10px] text-slate-500 block">Ex-Factory Ship</span>
                <span className="font-semibold text-slate-800 font-mono">{order.shipDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="text-[10px] text-slate-500 block">Quality Standard</span>
                <span className="font-semibold text-slate-800">
                  {order.qualityStandard || 'AQL 1.5/4.0'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[10px] text-slate-500 block">Buyer Brand</span>
                <span className="font-semibold text-slate-800">{order.buyerName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Merchandiser & Account Lead Info Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Assigned Merchandiser
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="font-bold text-slate-900 text-sm">
                {order.merchandiserName || 'Not Assigned'}
              </div>
              <div className="text-[11px] text-blue-700 font-medium">In-House Account Merchandiser</div>
            </div>

            <div className="space-y-1.5 text-slate-700">
              {order.merchandiserEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] truncate">
                    {order.merchandiserEmail}
                  </span>
                </div>
              )}
              {order.merchandiserPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-mono">
                    {order.merchandiserPhone}
                  </span>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">Factory Compliance</div>
              <div>BSCI &amp; OEKO-TEX Standard 100 Certified Line</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill of Materials (BOM) Section (Read-Only with Live Received Qty & Status) */}
      <OrderBOMSection
        orderId={order.id}
        orderQuantity={order.orderQuantity}
        initialBomItems={order.bomItems}
        showToast={showToast}
        readOnly={true}
      />

      {/* DEDICATED SECTION: LINKED INVENTORY & WAREHOUSE RECEIPTS (GRN) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Linked Inventory &amp; Warehouse Receipts (GRN Ledger)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {linkedGrn.length} Inward Lots
                </span>
              </div>
              <p className="text-xs text-slate-500">
                All raw materials (fabrics, sewing thread, trims, accessories) received and linked to {order.orderNumber}
              </p>
            </div>
          </div>

          {onOpenReceiveModalForOrder && (
            <button
              type="button"
              onClick={() => onOpenReceiveModalForOrder(order)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Inward Material for this PO</span>
            </button>
          )}
        </div>

        {/* 4 Micro Stat Cards for Inventory Fulfillment */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] block">Inward Lots (GRN)</span>
            <div className="font-bold text-slate-900 font-mono text-base mt-0.5">
              {linkedGrn.length} Lots Received
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] block">Total Units Inwarded</span>
            <div className="font-bold text-blue-700 font-mono text-base mt-0.5">
              {totalInwardUnits.toLocaleString()} units
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] block">QC Acceptance Rate</span>
            <div className="font-bold text-emerald-700 font-mono text-base mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{qcPassRate}% Passed (Grade A)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 text-[11px] block">Storage Bin Locations</span>
            <div className="font-semibold text-slate-800 font-mono text-xs mt-1 truncate">
              {uniqueBins.join(', ') || 'WH-R01-B04'}
            </div>
          </div>
        </div>

        {/* Table of Linked GRN Records */}
        {linkedGrn.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2.5">GRN # &amp; Date</th>
                  <th className="p-2.5">Material Category &amp; Item</th>
                  <th className="p-2.5">SKU &amp; Lot #</th>
                  <th className="p-2.5">Supplier / Mill</th>
                  <th className="p-2.5 text-right">Inward Qty</th>
                  <th className="p-2.5">Storage Bay</th>
                  <th className="p-2.5 text-center">QC Status &amp; Grade</th>
                  <th className="p-2.5">Store Receiver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {linkedGrn.map((rec) => {
                  const cat = CATEGORY_COLORS[rec.category] || {
                    label: rec.category,
                    color: 'text-slate-700',
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                  };

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-blue-700 block">
                          {rec.grnNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {rec.date}
                        </span>
                      </td>

                      <td className="p-2.5 max-w-xs">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border mb-1 ${cat.bg} ${cat.color} ${cat.border}`}
                        >
                          {cat.label}
                        </span>
                        <div className="font-semibold text-slate-900 truncate">
                          {rec.itemName}
                        </div>
                      </td>

                      <td className="p-2.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-700 text-[11px] block">
                          {rec.sku}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {rec.batchLot}
                        </span>
                      </td>

                      <td className="p-2.5 text-slate-600">{rec.supplierName}</td>

                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {rec.receivedQty.toLocaleString()} {rec.unit}
                        {rec.rollsReceived ? (
                          <span className="text-[10px] text-slate-500 font-normal block">
                            ({rec.rollsReceived} rolls)
                          </span>
                        ) : null}
                      </td>

                      <td className="p-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{rec.warehouseLocation}</span>
                        </span>
                      </td>

                      <td className="p-2.5 text-center whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              rec.qcStatus === 'PASSED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : rec.qcStatus === 'QUARANTINE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {rec.qcStatus}
                          </span>
                          {rec.qualityGrade && (
                            <div className="text-[9px] font-bold text-emerald-700 flex items-center justify-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{rec.qualityGrade.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-2.5 text-xs text-slate-600">
                        <div className="truncate max-w-[120px]">{rec.receivedBy.split('(')[0]}</div>
                        {rec.inspectedBy && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            QC: {rec.inspectedBy.split('(')[0]}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-2xs">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                No Raw Materials Received for PO {order.orderNumber} Yet
              </h4>
              <p className="text-xs text-slate-500">
                Inward fabric rolls, sewing thread cones, buttons, or packaging from the warehouse and link them to this purchase order to track BOM fulfillment in real time.
              </p>
            </div>
            {onOpenReceiveModalForOrder && (
              <button
                type="button"
                onClick={() => onOpenReceiveModalForOrder(order)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Inward First Material Lot (GRN)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Production Tracking Section (Read-Only) */}
      <OrderProductionTracking
        orderId={order.id}
        orderNumber={order.orderNumber}
        currentStatus={order.status as any}
        orderQuantity={order.orderQuantity}
        stagesData={order.productionTracking?.stages}
        showToast={showToast}
        readOnly={true}
      />

      {/* Logistics & Container Shipping Section (Read-Only) */}
      <OrderLogisticsSection
        orderId={order.id}
        orderNumber={order.orderNumber}
        shipDate={order.shipDate}
        initialLogistics={order.logistics}
        showToast={showToast}
        readOnly={true}
      />
    </div>
  );
}
