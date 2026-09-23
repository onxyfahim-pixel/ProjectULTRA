'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  FileSpreadsheet,
  Layers,
  Calendar,
  DollarSign,
  UserCheck,
  Tag,
  ShieldCheck,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Scissors,
  Check,
  Sparkles,
  User,
  Phone,
  RefreshCw,
} from 'lucide-react';
import {
  BuyerOrder,
  BuyerProfile,
  BOMItem,
  ProductionStageDetail,
  LogisticsDetail,
} from '@/lib/types/modules';

interface BuyerOrderEditPageProps {
  order: BuyerOrder;
  buyerNames: string[];
  buyers?: BuyerProfile[];
  onSave: (updatedOrder: BuyerOrder) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
  initialTab?: 'general' | 'upload' | 'stages' | 'bom' | 'logistics';
}

const SAMPLE_PRODUCT_IMAGES = [
  { name: 'Crewneck T-Shirt', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60' },
  { name: 'Indigo Denim Jeans', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60' },
  { name: 'Pique Polo Shirt', url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
  { name: 'Denim Jacket', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60' },
  { name: 'Hooded Sweatshirt', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60' },
];

const DEFAULT_STAGES: ProductionStageDetail[] = [
  {
    stage: 'PLANNED',
    startDate: '2026-09-01',
    actualEndDate: '2026-09-10',
    plannedPcs: 25000,
    actualPcs: 25000,
    status: 'COMPLETED',
    notes: 'Buyer approved lab dips, gold seal sample, and master tech pack.',
  },
  {
    stage: 'CUTTING',
    startDate: '2026-09-12',
    targetEndDate: '2026-09-22',
    actualEndDate: '2026-09-20',
    plannedPcs: 25000,
    actualPcs: 25250,
    status: 'COMPLETED',
    notes: 'Fabric relaxed 24h before cutting. 1% over-cut buffer included.',
    inspector: 'Ziaur Rahman (Cutting QC)',
  },
  {
    stage: 'SEWING',
    startDate: '2026-09-22',
    targetEndDate: '2026-10-14',
    plannedPcs: 25000,
    actualPcs: 16800,
    efficiencyPercent: 79.5,
    rejectionPcs: 142,
    status: 'IN_PROGRESS',
    assignedLines: ['Sewing Line 02', 'Sewing Line 05', 'Sewing Line 08'],
    notes: 'Assembly running across 3 lines. Daily target 1,200 pcs/line.',
    inspector: 'Monirul Islam (Senior Inline QA)',
  },
  {
    stage: 'PACKING',
    startDate: '2026-10-15',
    targetEndDate: '2026-10-22',
    plannedPcs: 25000,
    actualPcs: 0,
    status: 'PENDING',
    notes: 'Thread trimming, tunnel ironing, hangtag attachment, carton packing.',
  },
  {
    stage: 'READY_AUDIT',
    startDate: '2026-10-23',
    targetEndDate: '2026-10-25',
    plannedPcs: 25000,
    status: 'PENDING',
    notes: 'Pre-shipment Final Random Inspection (FRI) per AQL 1.5 Major / 4.0 Minor.',
  },
  {
    stage: 'SHIPPED',
    startDate: '2026-10-28',
    status: 'PENDING',
    notes: 'Container loaded, seal verified, gated in at export port.',
  },
];

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

export function BuyerOrderEditPage({
  order,
  buyerNames,
  buyers = [],
  onSave,
  onCancel,
  showToast,
  initialTab = 'general',
}: BuyerOrderEditPageProps) {
  // Navigation Section Active State
  const [activeSection, setActiveSection] = useState<
    'general' | 'upload' | 'stages' | 'bom' | 'logistics'
  >(initialTab);

  // Core Form State
  const [formData, setFormData] = useState<BuyerOrder>({
    ...order,
    productionTracking: order.productionTracking || {
      currentStage: order.status,
      overallProgressPercent: 50,
      stages: DEFAULT_STAGES,
    },
    bomItems: order.bomItems || [],
    logistics: order.logistics || { ...DEFAULT_LOGISTICS, etdDate: order.shipDate },
  });

  const [techPackFileName, setTechPackFileName] = useState<string>(
    'TECHPACK_' + order.styleNumber + '_v2.3.pdf'
  );
  const [techPackUploadTime, setTechPackUploadTime] = useState<string>('Uploaded Today at 10:45 AM');
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Handle General Specs Field Changes
  const handleInputChange = (
    field: keyof BuyerOrder,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Auto-paste Merchandiser & Buyer specifications when Buyer is changed
  const handleBuyerChange = (newBuyerName: string) => {
    const matched = buyers?.find((b) => b.name === newBuyerName);
    setFormData((prev) => ({
      ...prev,
      buyerName: newBuyerName,
      brand: matched?.brandDivision || prev.brand,
      qualityStandard: matched?.aqlStandard || prev.qualityStandard,
      merchandiserName: matched?.merchandiserName || prev.merchandiserName,
      merchandiserEmail: matched?.merchandiserEmail || prev.merchandiserEmail,
      merchandiserPhone: matched?.merchandiserPhone || prev.merchandiserPhone,
    }));

    if (matched?.merchandiserName) {
      showToast(`Auto-pasted merchandiser: ${matched.merchandiserName} for ${newBuyerName}`);
    } else {
      showToast(`Switched buyer to ${newBuyerName}`);
    }
  };

  const handleResyncMerchandiser = () => {
    const matched = buyers?.find((b) => b.name === formData.buyerName);
    if (matched && matched.merchandiserName) {
      setFormData((prev) => ({
        ...prev,
        merchandiserName: matched.merchandiserName || prev.merchandiserName,
        merchandiserEmail: matched.merchandiserEmail || prev.merchandiserEmail,
        merchandiserPhone: matched.merchandiserPhone || prev.merchandiserPhone,
      }));
      showToast(`Re-synced merchandiser details from ${matched.name} profile`);
    } else {
      showToast(`No preset merchandiser found for this buyer`);
    }
  };

  // Handle Garment Image File Upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setFormData((prev) => ({
            ...prev,
            productImage: reader.result as string,
          }));
          showToast(`Uploaded garment image: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Tech Pack / CAD File Upload
  const handleTechPackFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTechPackFileName(file.name);
      setTechPackUploadTime('Uploaded just now');
      showToast(`Attached Tech Pack document: ${file.name}`);
    }
  };

  // Handle Stage Editing
  const handleStageChange = (
    index: number,
    field: keyof ProductionStageDetail,
    value: any
  ) => {
    const updatedStages = [...(formData.productionTracking?.stages || DEFAULT_STAGES)];
    updatedStages[index] = {
      ...updatedStages[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      productionTracking: {
        currentStage: prev.status,
        overallProgressPercent: prev.productionTracking?.overallProgressPercent || 50,
        stages: updatedStages,
      },
    }));
  };

  // Handle BOM Excel / Tech Pack Upload Simulation
  const handleBOMExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const fileName = file ? file.name : 'BOM_Spec_Matrix.xlsx';

    const parsedItems: BOMItem[] = [
      {
        id: `bom-imp-1-${Date.now()}`,
        itemType: 'FABRIC',
        itemCode: 'IMP-SHELL-DENIM',
        description: 'Imported Organic Indigo Denim 12.5oz (Ring Spun)',
        supplier: 'Arvind Mills Ltd',
        consumptionPerGarment: 1.52,
        unit: 'yds',
        unitPriceUSD: 3.85,
        totalRequired: Math.ceil(1.52 * formData.orderQuantity),
        status: 'RECEIVED',
      },
      {
        id: `bom-imp-2-${Date.now()}`,
        itemType: 'ZIPPER',
        itemCode: 'IMP-YKK-M4',
        description: 'YKK Metal Zipper Brass Teeth Auto-lock with Puller',
        supplier: 'YKK Fastening',
        consumptionPerGarment: 1,
        unit: 'pcs',
        unitPriceUSD: 0.32,
        totalRequired: formData.orderQuantity,
        status: 'RECEIVED',
      },
      {
        id: `bom-imp-3-${Date.now()}`,
        itemType: 'THREAD',
        itemCode: 'THR-COATS-DUET',
        description: 'Coats Epic 120s Core Spun Poly Thread',
        supplier: 'Coats Bangladesh',
        consumptionPerGarment: 120,
        unit: 'meters',
        unitPriceUSD: 0.002,
        totalRequired: formData.orderQuantity * 120,
        status: 'RECEIVED',
      },
      {
        id: `bom-imp-4-${Date.now()}`,
        itemType: 'BUTTON',
        itemCode: 'BTN-RIVET-JEAN',
        description: 'Antiqued Brass Shank Button 24L + 6 Rivets set',
        supplier: 'Prym Fashion',
        consumptionPerGarment: 7,
        unit: 'pcs',
        unitPriceUSD: 0.025,
        totalRequired: formData.orderQuantity * 7,
        status: 'IN_TRANSIT',
      },
    ];

    const combined = [...(formData.bomItems || []), ...parsedItems];
    setFormData((prev) => ({ ...prev, bomItems: combined }));
    showToast(`Parsed & imported ${parsedItems.length} BOM lines from ${fileName}`);
  };

  // Add new empty BOM item
  const handleAddBOMItem = () => {
    const newItem: BOMItem = {
      id: `bom-${Date.now()}`,
      itemType: 'FABRIC',
      itemCode: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      description: 'New Material Specification',
      supplier: 'Local / Sourced Supplier',
      consumptionPerGarment: 1.0,
      unit: 'pcs',
      unitPriceUSD: 1.0,
      totalRequired: formData.orderQuantity,
      status: 'PENDING',
    };
    setFormData((prev) => ({
      ...prev,
      bomItems: [...(prev.bomItems || []), newItem],
    }));
  };

  // Update specific BOM item
  const handleBOMItemChange = (index: number, field: keyof BOMItem, value: any) => {
    const updated = [...(formData.bomItems || [])];
    const current = { ...updated[index], [field]: value };

    if (field === 'consumptionPerGarment') {
      current.totalRequired = Math.ceil(Number(value) * formData.orderQuantity);
    }

    updated[index] = current;
    setFormData((prev) => ({ ...prev, bomItems: updated }));
  };

  // Remove BOM item
  const handleRemoveBOMItem = (index: number) => {
    const updated = (formData.bomItems || []).filter((_, idx) => idx !== index);
    setFormData((prev) => ({ ...prev, bomItems: updated }));
  };

  // Handle Logistics Field Changes
  const handleLogisticsChange = (field: keyof LogisticsDetail, value: any) => {
    setFormData((prev) => ({
      ...prev,
      logistics: {
        ...(prev.logistics || DEFAULT_LOGISTICS),
        [field]: value,
      },
    }));
  };

  // Calculated Metrics
  const calculatedTotalValue = formData.orderQuantity * formData.fobPrice;
  const totalBOMCostPerGarment = (formData.bomItems || []).reduce(
    (sum, item) => sum + item.consumptionPerGarment * item.unitPriceUSD,
    0
  );

  const handleSaveAll = () => {
    onSave(formData);
    showToast(`Successfully saved all changes to ${formData.orderNumber}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header with Navigation & Save Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Cancel & Return to Details"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-xs font-bold">
                EDIT FULL PAGE
              </span>
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {formData.orderNumber}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                ({formData.buyerName} • Style: {formData.styleNumber})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Unified workspace for specifications, tech pack uploads, stage tracking, BOM &amp; logistics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Discard Changes</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm hover:shadow cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save &amp; Update Order</span>
          </button>
        </div>
      </div>

      {/* Section Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-semibold">
        {[
          { id: 'general', label: '1. Commercial & Style Specs', icon: Tag },
          { id: 'upload', label: '2. Garment Photo & Tech Pack Upload', icon: Upload },
          { id: 'stages', label: '3. Production Stages Tracking', icon: Clock },
          { id: 'bom', label: '4. BOM & Material Matrix', icon: Layers },
          { id: 'logistics', label: '5. Logistics & Shipping', icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: COMMERCIAL & STYLE SPECIFICATIONS */}
      {/* ========================================================================= */}
      {activeSection === 'general' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Commercial Terms &amp; Order Specifications</span>
              </h3>
              <p className="text-xs text-slate-500">
                Buyer identification, style numbers, pricing matrix, and contract delivery dates
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              Total PO: ${calculatedTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Purchase Order (PO) Number *
              </label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="PO-EXP-7020"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Buyer Brand Name *
              </label>
              <select
                value={formData.buyerName}
                onChange={(e) => handleBuyerChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-900"
              >
                {buyerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Division / Sub-Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Main Collection / Denim Div"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Style Code / Reference Number *
              </label>
              <input
                type="text"
                value={formData.styleNumber}
                onChange={(e) => handleInputChange('styleNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="STY-SS-2026-01"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Style Description
              </label>
              <input
                type="text"
                value={formData.styleDescription}
                onChange={(e) => handleInputChange('styleDescription', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Men's 100% Combed Cotton Regular Fit Polo Shirt with Jacquard Collar"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Season / Collection
              </label>
              <input
                type="text"
                value={formData.season}
                onChange={(e) => handleInputChange('season', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Spring/Summer 2026"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Order Quantity (Pcs) *
              </label>
              <input
                type="number"
                value={formData.orderQuantity}
                onChange={(e) => handleInputChange('orderQuantity', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Unit FOB Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.fobPrice}
                onChange={(e) => handleInputChange('fobPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                min="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Cutting Planned Start Date
              </label>
              <input
                type="date"
                value={formData.cuttingStartDate}
                onChange={(e) => handleInputChange('cuttingStartDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Ex-Factory / Ship Date *
              </label>
              <input
                type="date"
                value={formData.shipDate}
                onChange={(e) => handleInputChange('shipDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Production Stage Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
              >
                <option value="PLANNED">Planned (Pre-Production)</option>
                <option value="CUTTING">Cutting Floor</option>
                <option value="SEWING">Sewing Assembly</option>
                <option value="PACKING">Finishing &amp; Packing</option>
                <option value="READY_AUDIT">Final QA Audit</option>
                <option value="SHIPPED">Shipped &amp; Ex-Factory</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Quality Assurance Standard
              </label>
              <input
                type="text"
                value={formData.qualityStandard}
                onChange={(e) => handleInputChange('qualityStandard', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="AQL 1.5 Major / 4.0 Minor"
              />
            </div>

            {/* Merchandiser Information Header Banner */}
            <div className="md:col-span-3 pt-3 pb-1 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-100 text-blue-700">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Assigned In-House Merchandiser</span>
                  <span className="text-[10px] text-slate-500">Auto-pastes from selected Buyer Profile</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Linked: {formData.buyerName}
                </span>
                <button
                  type="button"
                  onClick={handleResyncMerchandiser}
                  className="px-2 py-1 text-[11px] text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors"
                  title="Re-sync merchandiser info from selected buyer profile"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-sync from Buyer</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Assigned Merchandiser Name
              </label>
              <input
                type="text"
                value={formData.merchandiserName || ''}
                onChange={(e) => handleInputChange('merchandiserName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/20 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Farhan Rahman (Senior Merchandiser)"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Merchandiser Email
              </label>
              <input
                type="email"
                value={formData.merchandiserEmail || ''}
                onChange={(e) => handleInputChange('merchandiserEmail', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/20 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="farhan.merchandising@texexport.com"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Merchandiser Contact Phone
              </label>
              <input
                type="tel"
                value={formData.merchandiserPhone || ''}
                onChange={(e) => handleInputChange('merchandiserPhone', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/20 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="+880 1711 982341"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: GARMENT PHOTO & TECH PACK UPLOAD */}
      {/* ========================================================================= */}
      {activeSection === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Garment Sample Photo Upload Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Garment Style Sample Photo
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    High-resolution front/back sample garment picture
                  </p>
                </div>
              </div>
            </div>

            {/* Current Picture Preview */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-44 h-48 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50 flex items-center justify-center relative shrink-0">
                {formData.productImage ? (
                  <img
                    src={formData.productImage}
                    alt="Garment Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-[11px]">No image uploaded</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Upload Local Garment Image File
                  </label>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors font-semibold">
                    <Upload className="w-4 h-4" />
                    <span>Choose PNG / JPG File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Or Enter Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customImageUrl) {
                          setFormData((prev) => ({ ...prev, productImage: customImageUrl }));
                          showToast('Applied custom image URL');
                          setCustomImageUrl('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-white hover:bg-slate-900 cursor-pointer font-semibold"
                    >
                      Set
                    </button>
                  </div>
                </div>

                {/* Sample Presets */}
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                    Sample Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_PRODUCT_IMAGES.map((img) => (
                      <button
                        key={img.name}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, productImage: img.url }));
                          showToast(`Selected sample: ${img.name}`);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] font-medium border border-slate-200 cursor-pointer"
                      >
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Master Tech Pack & CAD Document Upload Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Master Tech Pack &amp; Specification Sheets
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Graded measurement charts, construction guides, print/embroidery artwork
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs font-mono">
                      {techPackFileName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {techPackUploadTime} • 4.8 MB • TechPack v2.3 Approved
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  Approved
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Revised Tech Pack PDF</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.cad"
                    onChange={handleTechPackFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => showToast('Opening tech pack previewer...')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  View Attachment
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <div className="font-semibold text-blue-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Tech Pack Versioning Guarantee</span>
              </div>
              <p>
                All revisions uploaded here automatically synchronize with Cutting, Inline QA, and Finishing inspection terminals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: PRODUCTION STAGES & TRACKING EDITOR */}
      {/* ========================================================================= */}
      {activeSection === 'stages' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Production Stage Milestones &amp; Line Tracking Editor</span>
              </h3>
              <p className="text-xs text-slate-500">
                Update stage dates, planned vs actual quantities, sewing line assignments, QC leads, and stage notes
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Active Order Status:</span>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as any)}
                className="px-2.5 py-1 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 font-bold outline-none cursor-pointer"
              >
                <option value="PLANNED">Planned</option>
                <option value="CUTTING">Cutting</option>
                <option value="SEWING">Sewing</option>
                <option value="PACKING">Packing</option>
                <option value="READY_AUDIT">Ready for Audit</option>
                <option value="SHIPPED">Shipped</option>
              </select>
            </div>
          </div>

          {/* Stages Editor Grid */}
          <div className="space-y-4">
            {(formData.productionTracking?.stages || DEFAULT_STAGES).map((st, idx) => {
              const isCurrent = formData.status === st.stage;
              return (
                <div
                  key={st.stage}
                  className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                    isCurrent
                      ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        Stage: {st.stage.replace(/_/g, ' ')}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                          CURRENT ACTIVE STAGE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-slate-500 font-semibold">Stage Status:</label>
                      <select
                        value={st.status}
                        onChange={(e) => handleStageChange(idx, 'status', e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 outline-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="DELAYED">DELAYED</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={st.startDate || ''}
                        onChange={(e) => handleStageChange(idx, 'startDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Target End Date
                      </label>
                      <input
                        type="date"
                        value={st.targetEndDate || ''}
                        onChange={(e) => handleStageChange(idx, 'targetEndDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Planned Target (Pcs)
                      </label>
                      <input
                        type="number"
                        value={st.plannedPcs || 0}
                        onChange={(e) => handleStageChange(idx, 'plannedPcs', parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Actual Output (Pcs)
                      </label>
                      <input
                        type="number"
                        value={st.actualPcs || 0}
                        onChange={(e) => handleStageChange(idx, 'actualPcs', parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-blue-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Efficiency (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={st.efficiencyPercent || ''}
                        onChange={(e) => handleStageChange(idx, 'efficiencyPercent', parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono outline-none"
                        placeholder="e.g. 82.5"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Rejections / Defects (Pcs)
                      </label>
                      <input
                        type="number"
                        value={st.rejectionPcs || ''}
                        onChange={(e) => handleStageChange(idx, 'rejectionPcs', parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-rose-700 outline-none"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        QC Lead / Inspector
                      </label>
                      <input
                        type="text"
                        value={st.inspector || ''}
                        onChange={(e) => handleStageChange(idx, 'inspector', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none"
                        placeholder="e.g. Ziaur Rahman (QC)"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Assigned Lines (comma separated)
                      </label>
                      <input
                        type="text"
                        value={(st.assignedLines || []).join(', ')}
                        onChange={(e) =>
                          handleStageChange(
                            idx,
                            'assignedLines',
                            e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none"
                        placeholder="Line 02, Line 05"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-4">
                      <label className="block text-slate-600 font-semibold mb-1">
                        Stage Notes &amp; Quality Audit Remarks
                      </label>
                      <input
                        type="text"
                        value={st.notes || ''}
                        onChange={(e) => handleStageChange(idx, 'notes', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none"
                        placeholder="Notes on machine setup, bottleneck resolution, or quality parameters..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: BOM & RAW MATERIAL CONSUMPTION MATRIX */}
      {/* ========================================================================= */}
      {activeSection === 'bom' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Bill of Materials (BOM) &amp; Consumption Matrix Editor</span>
              </h3>
              <p className="text-xs text-slate-500">
                Manage fabrics, threads, buttons, packaging materials, and unit consumption
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload BOM (Excel / Tech Pack)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBOMExcelUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleAddBOMItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material Line</span>
              </button>
            </div>
          </div>

          {/* BOM Financial Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">Material Items:</span>
              <div className="font-bold text-slate-900 mt-0.5 font-mono">
                {(formData.bomItems || []).length} lines
              </div>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Unit Material Cost:</span>
              <div className="font-bold text-blue-700 mt-0.5 font-mono">
                ${totalBOMCostPerGarment.toFixed(3)} USD / pc
              </div>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Total BOM Order Cost:</span>
              <div className="font-bold text-emerald-700 mt-0.5 font-mono">
                ${((formData.bomItems || []).reduce((acc, it) => acc + it.totalRequired * it.unitPriceUSD, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
              </div>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Sourcing Readiness:</span>
              <div className="font-bold text-slate-800 mt-0.5">
                {Math.round(
                  (((formData.bomItems || []).filter((i) => i.status === 'RECEIVED').length) /
                    Math.max((formData.bomItems || []).length, 1)) *
                    100
                )}% In Warehouse
              </div>
            </div>
          </div>

          {/* BOM Editable Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Item Code</th>
                    <th className="p-2.5">Description &amp; Specs</th>
                    <th className="p-2.5">Supplier</th>
                    <th className="p-2.5 text-right">Consumption / Pc</th>
                    <th className="p-2.5 text-center">Unit</th>
                    <th className="p-2.5 text-right">Unit Price ($)</th>
                    <th className="p-2.5 text-right">Total Req.</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {(formData.bomItems || []).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80">
                      <td className="p-2">
                        <select
                          value={item.itemType}
                          onChange={(e) => handleBOMItemChange(idx, 'itemType', e.target.value)}
                          className="px-2 py-1 rounded border border-slate-200 bg-white font-semibold text-[11px] outline-none"
                        >
                          <option value="FABRIC">Fabric</option>
                          <option value="LINING">Lining</option>
                          <option value="BUTTON">Button</option>
                          <option value="ZIPPER">Zipper</option>
                          <option value="THREAD">Thread</option>
                          <option value="LABEL">Label</option>
                          <option value="HANGTAG">Hangtag</option>
                          <option value="POLYBAG">Polybag</option>
                          <option value="CARTON">Carton</option>
                          <option value="INTERLINING">Interlining</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          value={item.itemCode}
                          onChange={(e) => handleBOMItemChange(idx, 'itemCode', e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-200 font-mono text-[11px] outline-none"
                          placeholder="FAB-01"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleBOMItemChange(idx, 'description', e.target.value)}
                          className="w-full min-w-[200px] px-2 py-1 rounded border border-slate-200 text-[11px] outline-none"
                          placeholder="Material description &amp; weave..."
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          value={item.supplier}
                          onChange={(e) => handleBOMItemChange(idx, 'supplier', e.target.value)}
                          className="w-28 px-2 py-1 rounded border border-slate-200 text-[11px] outline-none"
                          placeholder="Supplier name"
                        />
                      </td>

                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.001"
                          value={item.consumptionPerGarment}
                          onChange={(e) =>
                            handleBOMItemChange(idx, 'consumptionPerGarment', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 rounded border border-slate-200 font-mono text-right text-[11px] outline-none"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleBOMItemChange(idx, 'unit', e.target.value)}
                          className="w-14 px-1 py-1 rounded border border-slate-200 text-center text-[11px] outline-none"
                        />
                      </td>

                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.001"
                          value={item.unitPriceUSD}
                          onChange={(e) =>
                            handleBOMItemChange(idx, 'unitPriceUSD', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 rounded border border-slate-200 font-mono text-right text-[11px] outline-none"
                        />
                      </td>

                      <td className="p-2 text-right font-mono font-bold text-slate-700 text-[11px]">
                        {item.totalRequired.toLocaleString()}
                      </td>

                      <td className="p-2 text-center">
                        <select
                          value={item.status}
                          onChange={(e) => handleBOMItemChange(idx, 'status', e.target.value)}
                          className="px-2 py-1 rounded border border-slate-200 bg-white font-bold text-[10px] outline-none"
                        >
                          <option value="SOURCED">SOURCED</option>
                          <option value="IN_TRANSIT">IN_TRANSIT</option>
                          <option value="RECEIVED">RECEIVED</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBOMItem(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: LOGISTICS & SHIPPING */}
      {/* ========================================================================= */}
      {activeSection === 'logistics' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Logistics, Export Shipping &amp; Container Tracking</span>
              </h3>
              <p className="text-xs text-slate-500">
                Port assignments, Bill of Lading, shipping forwarders, and container tracking
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Shipment Mode
              </label>
              <select
                value={formData.logistics?.shipmentMode || 'OCEAN_FCL'}
                onChange={(e) => handleLogisticsChange('shipmentMode', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
              >
                <option value="OCEAN_FCL">Ocean FCL (Full Container)</option>
                <option value="OCEAN_LCL">Ocean LCL (Loose Cargo)</option>
                <option value="AIR_CARGO">Air Freight Express</option>
                <option value="MULTIMODAL">Sea-Air Multimodal</option>
                <option value="COURIER">Courier Sample</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Freight Forwarder / Shipping Agent
              </label>
              <input
                type="text"
                value={formData.logistics?.forwarder || ''}
                onChange={(e) => handleLogisticsChange('forwarder', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Maersk Logistics Bangladesh"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Port of Loading (POL)
              </label>
              <input
                type="text"
                value={formData.logistics?.portOfLoading || ''}
                onChange={(e) => handleLogisticsChange('portOfLoading', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Chattogram (Chittagong) Port, BD"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Port of Discharge (POD) / Destination
              </label>
              <input
                type="text"
                value={formData.logistics?.portOfDischarge || ''}
                onChange={(e) => handleLogisticsChange('portOfDischarge', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Port of Hamburg, Germany"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Booking Reference Number
              </label>
              <input
                type="text"
                value={formData.logistics?.bookingNumber || ''}
                onChange={(e) => handleLogisticsChange('bookingNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="BKG-MAE-2026-8819"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Bill of Lading (BL) / AWB Number
              </label>
              <input
                type="text"
                value={formData.logistics?.blAwbNumber || ''}
                onChange={(e) => handleLogisticsChange('blAwbNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="MSKU-BL-991204"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Container Number
              </label>
              <input
                type="text"
                value={formData.logistics?.containerNumber || ''}
                onChange={(e) => handleLogisticsChange('containerNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="MSKU-9948210"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Seal Number
              </label>
              <input
                type="text"
                value={formData.logistics?.sealNumber || ''}
                onChange={(e) => handleLogisticsChange('sealNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="SEAL-HM-7781"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Vessel / Flight Carrier Name
              </label>
              <input
                type="text"
                value={formData.logistics?.vesselFlightName || ''}
                onChange={(e) => handleLogisticsChange('vesselFlightName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Maersk Mc-Kinney Moller V.2604"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Estimated Departure (ETD)
              </label>
              <input
                type="date"
                value={formData.logistics?.etdDate || ''}
                onChange={(e) => handleLogisticsChange('etdDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Estimated Arrival (ETA)
              </label>
              <input
                type="date"
                value={formData.logistics?.etaDate || ''}
                onChange={(e) => handleLogisticsChange('etaDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Customs Clearance Status
              </label>
              <select
                value={formData.logistics?.customsStatus || 'CUSTOMS_SUBMITTED'}
                onChange={(e) => handleLogisticsChange('customsStatus', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
              >
                <option value="PENDING_DOCS">Pending Documents</option>
                <option value="CUSTOMS_SUBMITTED">Customs Submitted</option>
                <option value="CLEARED">Customs Cleared</option>
                <option value="GATED_IN">Gated in at Port</option>
                <option value="ON_VESSEL">Loaded on Vessel</option>
                <option value="DELIVERED">Delivered to Buyer</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            Ready to commit updates to Order <strong>{formData.orderNumber}</strong> ({formData.orderQuantity.toLocaleString()} pcs • ${calculatedTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
