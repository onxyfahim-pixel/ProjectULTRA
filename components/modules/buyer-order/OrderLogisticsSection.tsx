'use client';

import React, { useState } from 'react';
import {
  Truck,
  Ship,
  Plane,
  Edit,
  CheckCircle2,
  Anchor,
  FileText,
  Clock,
  X,
  MapPin,
  Building2,
  Calendar,
} from 'lucide-react';
import { LogisticsDetail } from '@/lib/types/modules';

interface OrderLogisticsSectionProps {
  orderId: string;
  orderNumber: string;
  shipDate: string;
  initialLogistics?: LogisticsDetail;
  onUpdateLogistics?: (logistics: LogisticsDetail) => void;
  showToast: (msg: string) => void;
  readOnly?: boolean;
}

const DEFAULT_LOGISTICS: LogisticsDetail = {
  shipmentMode: 'OCEAN_FCL',
  forwarder: 'Maersk Logistics Bangladesh',
  portOfLoading: 'Chattogram (Chittagong) Port, BD',
  portOfDischarge: 'Port of Hamburg, Germany',
  containerNumber: 'MSKU-9948210',
  sealNumber: 'SEAL-HM-7781',
  bookingNumber: 'BKG-MAE-2026-8819',
  blAwbNumber: 'MSKU-BL-991204',
  vesselFlightName: 'Maersk Mc-Kinney Moller V.2604',
  etdDate: '2026-10-25',
  etaDate: '2026-11-28',
  customsStatus: 'CUSTOMS_SUBMITTED',
  shippingTerms: 'FOB',
};

export function OrderLogisticsSection({
  orderNumber,
  shipDate,
  initialLogistics,
  onUpdateLogistics,
  showToast,
  readOnly = false,
}: OrderLogisticsSectionProps) {
  const [logistics, setLogistics] = useState<LogisticsDetail>(
    initialLogistics || { ...DEFAULT_LOGISTICS, etdDate: shipDate }
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<LogisticsDetail>(logistics);

  const handleOpenEdit = () => {
    if (readOnly) return;
    setEditForm({ ...logistics });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setLogistics(editForm);
    onUpdateLogistics?.(editForm);
    setIsEditModalOpen(false);
    showToast(`Updated logistics details for ${orderNumber}`);
  };

  const getModeIcon = () => {
    switch (logistics.shipmentMode) {
      case 'AIR_CARGO':
        return <Plane className="w-4 h-4 text-blue-600" />;
      case 'OCEAN_FCL':
      case 'OCEAN_LCL':
        return <Ship className="w-4 h-4 text-indigo-600" />;
      default:
        return <Truck className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Logistics, Export Shipping &amp; Container Tracking
            </h3>
            <p className="text-[11px] text-slate-500">
              Booking details, Bill of Lading, container seal numbers, and port ETD/ETA
            </p>
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Logistics</span>
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Card 1: Mode & Carrier */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">Transport Mode &amp; Terms:</span>
            <div className="flex items-center gap-1">
              {getModeIcon()}
              <span className="font-bold text-slate-900 font-mono text-[11px]">
                {logistics.shippingTerms} ({logistics.shipmentMode.replace(/_/g, ' ')})
              </span>
            </div>
          </div>
          <div className="text-slate-900 font-semibold">{logistics.forwarder}</div>
          <div className="text-[11px] text-slate-500">Vessel: {logistics.vesselFlightName}</div>
        </div>

        {/* Card 2: Routing Ports */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <span className="text-slate-500 text-[11px]">Port of Origin &amp; Destination:</span>
          <div className="flex items-start gap-1.5 text-slate-900 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div>{logistics.portOfLoading}</div>
              <div className="text-slate-500 text-[11px]">→ {logistics.portOfDischarge}</div>
            </div>
          </div>
        </div>

        {/* Card 3: Container & BL tracking */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <span className="text-slate-500 text-[11px]">B/L &amp; Container Number:</span>
          <div className="font-mono font-bold text-blue-700">
            {logistics.containerNumber || 'Pending Allocation'}
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            B/L: {logistics.blAwbNumber} • Seal: {logistics.sealNumber || 'N/A'}
          </div>
        </div>

        {/* Card 4: ETD/ETA & Customs */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-indigo-900 font-bold text-[11px]">Customs Status:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {logistics.customsStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-indigo-950 pt-1">
            <span>ETD: <strong>{logistics.etdDate}</strong></span>
            <span>ETA: <strong>{logistics.etaDate}</strong></span>
          </div>
        </div>
      </div>

      {/* EDIT LOGISTICS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Logistics Details for {orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Shipment Mode</label>
                  <select
                    value={editForm.shipmentMode}
                    onChange={(e) => setEditForm({ ...editForm, shipmentMode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  >
                    <option value="OCEAN_FCL">Ocean FCL (Full Container Load)</option>
                    <option value="OCEAN_LCL">Ocean LCL (Less Container Load)</option>
                    <option value="AIR_CARGO">Air Freight Express</option>
                    <option value="MULTIMODAL">Multimodal (Sea-Air)</option>
                    <option value="COURIER">Courier Sample / Express</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Shipping Terms (Incoterms)</label>
                  <select
                    value={editForm.shippingTerms}
                    onChange={(e) => setEditForm({ ...editForm, shippingTerms: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  >
                    <option value="FOB">FOB (Free On Board)</option>
                    <option value="CIF">CIF (Cost, Insurance &amp; Freight)</option>
                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                    <option value="CFR">CFR (Cost &amp; Freight)</option>
                    <option value="EXW">EXW (Ex Works)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Freight Forwarder / Carrier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maersk Logistics, Kuehne+Nagel"
                    value={editForm.forwarder}
                    onChange={(e) => setEditForm({ ...editForm, forwarder: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Vessel / Flight Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Maersk Mc-Kinney Moller V.2604"
                    value={editForm.vesselFlightName}
                    onChange={(e) => setEditForm({ ...editForm, vesselFlightName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Port of Loading (Origin)</label>
                  <input
                    type="text"
                    value={editForm.portOfLoading}
                    onChange={(e) => setEditForm({ ...editForm, portOfLoading: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Port of Discharge (Destination)</label>
                  <input
                    type="text"
                    value={editForm.portOfDischarge}
                    onChange={(e) => setEditForm({ ...editForm, portOfDischarge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Container Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MSKU-9948210"
                    value={editForm.containerNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, containerNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Seal Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SEAL-7781"
                    value={editForm.sealNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, sealNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Bill of Lading / AWB</label>
                  <input
                    type="text"
                    placeholder="e.g. MSKU-BL-991204"
                    value={editForm.blAwbNumber}
                    onChange={(e) => setEditForm({ ...editForm, blAwbNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Estimated ETD</label>
                  <input
                    type="date"
                    value={editForm.etdDate}
                    onChange={(e) => setEditForm({ ...editForm, etdDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Estimated ETA</label>
                  <input
                    type="date"
                    value={editForm.etaDate}
                    onChange={(e) => setEditForm({ ...editForm, etaDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Customs Clearance</label>
                  <select
                    value={editForm.customsStatus}
                    onChange={(e) => setEditForm({ ...editForm, customsStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  >
                    <option value="PENDING_DOCS">Pending Docs</option>
                    <option value="CUSTOMS_SUBMITTED">Customs Submitted</option>
                    <option value="CLEARED">Cleared by Customs</option>
                    <option value="GATED_IN">Gated In at Port</option>
                    <option value="ON_VESSEL">On Vessel</option>
                    <option value="DELIVERED">Delivered to Buyer</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Save Logistics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
