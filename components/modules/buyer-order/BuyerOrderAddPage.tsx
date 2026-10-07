'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Image as ImageIcon,
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
  FileText,
  Clock,
  User,
  Check,
  Phone,
  RefreshCw,
  Activity,
  Zap,
  Scissors,
  Droplets,
  Package,
  AlertTriangle,
  ArrowRight,
  FileSpreadsheet,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import {
  BuyerOrder,
  BuyerProfile,
  BOMItem,
  ProductionStageDetail,
  LogisticsDetail,
  BuyerOrderWIPRecord,
} from '@/lib/types/modules';
import {
  computeWIPRecordForPO,
  syncWIPToStages,
  calculateWIPPipelineMetrics,
} from '@/lib/db/wip-record-store';
import { OrderAttachmentsUploader } from './OrderAttachmentsUploader';

interface BuyerOrderAddPageProps {
  buyerNames: string[];
  buyers?: BuyerProfile[];
  onSave: (newOrder: BuyerOrder) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const SAMPLE_PRODUCT_IMAGES = [
  { name: 'Crewneck T-Shirt', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60' },
  { name: 'Indigo Denim Jeans', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60' },
  { name: 'Pique Polo Shirt', url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
  { name: 'Denim Jacket', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60' },
  { name: 'Hooded Sweatshirt', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60' },
];

const INITIAL_STAGES: ProductionStageDetail[] = [
  {
    stage: 'PLANNED',
    startDate: '2026-10-01',
    targetEndDate: '2026-10-10',
    plannedPcs: 10000,
    actualPcs: 0,
    status: 'IN_PROGRESS',
    notes: 'Lab dips approval, trims booking and production sample signoff.',
  },
  {
    stage: 'CUTTING',
    startDate: '2026-10-12',
    targetEndDate: '2026-10-20',
    plannedPcs: 10000,
    actualPcs: 0,
    status: 'PENDING',
    notes: 'CAD marker planning, fabric relaxation and spreading.',
  },
  {
    stage: 'SEWING',
    startDate: '2026-10-22',
    targetEndDate: '2026-11-10',
    plannedPcs: 10000,
    actualPcs: 0,
    status: 'PENDING',
    assignedLines: ['Sewing Line 01', 'Sewing Line 04'],
    notes: 'Assembly operations, inline QA checkpoints, daily monitoring.',
  },
  {
    stage: 'PACKING',
    startDate: '2026-11-12',
    targetEndDate: '2026-11-18',
    plannedPcs: 10000,
    actualPcs: 0,
    status: 'PENDING',
    notes: 'Thread suck, needle detection, polybagging, carton packing.',
  },
  {
    stage: 'READY_AUDIT',
    startDate: '2026-11-19',
    targetEndDate: '2026-11-20',
    plannedPcs: 10000,
    status: 'PENDING',
    notes: 'Buyer pre-shipment inspection (AQL standard).',
  },
  {
    stage: 'SHIPPED',
    startDate: '2026-11-25',
    status: 'PENDING',
    notes: 'Factory ex-factory gate out and container departure.',
  },
];

const INITIAL_LOGISTICS: LogisticsDetail = {
  shipmentMode: 'OCEAN_FCL',
  forwarder: 'Maersk Logistics Bangladesh',
  portOfLoading: 'Chattogram (Chittagong) Port, BD',
  portOfDischarge: 'Port of Hamburg, Germany',
  containerNumber: '',
  sealNumber: '',
  bookingNumber: '',
  blAwbNumber: '',
  vesselFlightName: 'Vessel TBA',
  etdDate: '2026-11-25',
  etaDate: '2026-12-28',
  customsStatus: 'PENDING_DOCS',
  shippingTerms: 'FOB',
};

export function BuyerOrderAddPage({
  buyerNames,
  buyers,
  onSave,
  onCancel,
  showToast,
}: BuyerOrderAddPageProps) {
  const [activeTab, setActiveTab] = useState<
    'general' | 'upload' | 'stages' | 'bom' | 'logistics'
  >('general');

  // Find initial buyer profile if available
  const initialBuyerName = buyerNames[0] || 'H&M Hennes & Mauritz';
  const initialBuyer = buyers?.find((b) => b.name === initialBuyerName);

  // Form State
  const [formData, setFormData] = useState<BuyerOrder>(() => ({
    id: `ord-${Date.now()}`,
    orderNumber: `PO-EXP-${Math.floor(2000 + Math.random() * 8000)}`,
    buyerName: initialBuyerName,
    brand: initialBuyer?.brandDivision || 'Main Collection',
    styleNumber: `STY-${Math.floor(100 + Math.random() * 900)}`,
    styleDescription: '',
    season: 'Spring/Summer 2026',
    orderQuantity: 10000,
    fobPrice: 5.5,
    currency: 'USD',
    shipDate: '2026-11-25',
    cuttingStartDate: '2026-10-12',
    status: 'PLANNED',
    qualityStandard: initialBuyer?.aqlStandard || 'AQL 1.5 Major / 4.0 Minor',
    smv: 18.5,
    productionTarget: 1200,
    dailyTarget: 1200,
    productImage: SAMPLE_PRODUCT_IMAGES[0].url,
    merchandiserName: initialBuyer?.merchandiserName || 'Farhan Rahman (Senior Merchandiser)',
    merchandiserEmail: initialBuyer?.merchandiserEmail || 'farhan.merchandising@texexport.com',
    merchandiserPhone: initialBuyer?.merchandiserPhone || '+880 1711 982341',
    productionTracking: {
      currentStage: 'PLANNED',
      overallProgressPercent: 10,
      stages: INITIAL_STAGES,
    },
    bomItems: [
      {
        id: `bom-init-1`,
        itemType: 'FABRIC',
        itemCode: 'FAB-MAIN-KNIT',
        description: '100% Combed Cotton Single Jersey 180 GSM',
        supplier: 'Square Textiles Ltd',
        consumptionPerGarment: 0.32,
        unit: 'kg',
        unitPriceUSD: 6.8,
        totalRequired: 3200,
        status: 'SOURCED',
      },
      {
        id: `bom-init-2`,
        itemType: 'THREAD',
        itemCode: 'THR-POLY-120',
        description: 'Spun Polyester Sewing Thread 120s',
        supplier: 'Coats Bangladesh',
        consumptionPerGarment: 100,
        unit: 'meters',
        unitPriceUSD: 0.002,
        totalRequired: 1000000,
        status: 'SOURCED',
      },
      {
        id: `bom-init-3`,
        itemType: 'LABEL',
        itemCode: 'LBL-CARE-MAIN',
        description: 'Woven Satin Brand + Care Label',
        supplier: 'Avery Dennison BD',
        consumptionPerGarment: 2,
        unit: 'pcs',
        unitPriceUSD: 0.02,
        totalRequired: 20000,
        status: 'SOURCED',
      },
    ],
    logistics: INITIAL_LOGISTICS,
    attachments: [],
  }));

  // Dedicated WIP Record State for new order
  const [wipData, setWipData] = useState<BuyerOrderWIPRecord>(() =>
    computeWIPRecordForPO(
      formData.orderNumber,
      formData.orderQuantity,
      null,
      INITIAL_STAGES
    )
  );

  const handleAutoDetectWIPFromFloor = () => {
    const fresh = computeWIPRecordForPO(
      formData.orderNumber,
      formData.orderQuantity,
      null,
      formData.productionTracking?.stages || INITIAL_STAGES
    );
    setWipData(fresh);
    showToast(
      `Detected floor records: Cut ${fresh.cuttingActual} pcs, Sew ${fresh.sewingComplete} pcs, Insp ${fresh.inspectionCompletedQuantity} pcs`
    );
  };

  const handleWIPFieldChange = (field: keyof BuyerOrderWIPRecord, value: any) => {
    setWipData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [techPackFileName, setTechPackFileName] = useState<string>('TechPack_Specification_Draft.pdf');
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Handle Input Changes
  const handleInputChange = (field: keyof BuyerOrder, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'orderQuantity') {
        const qty = parseInt(value) || 0;
        // recalculate BOM total quantities
        const updatedBom = (prev.bomItems || []).map((b) => ({
          ...b,
          totalRequired: Math.ceil(b.consumptionPerGarment * qty),
        }));
        updated.bomItems = updatedBom;
      }
      return updated;
    });
  };

  // Handle Buyer Selection with Auto-paste of Merchandiser & Buyer details
  const handleBuyerSelect = (selectedName: string) => {
    const matched = buyers?.find((b) => b.name === selectedName);
    setFormData((prev) => ({
      ...prev,
      buyerName: selectedName,
      brand: matched?.brandDivision || prev.brand,
      qualityStandard: matched?.aqlStandard || prev.qualityStandard,
      merchandiserName: matched?.merchandiserName || prev.merchandiserName,
      merchandiserEmail: matched?.merchandiserEmail || prev.merchandiserEmail,
      merchandiserPhone: matched?.merchandiserPhone || prev.merchandiserPhone,
    }));

    if (matched?.merchandiserName) {
      showToast(`Auto-pasted merchandiser: ${matched.merchandiserName} for ${selectedName}`);
    } else {
      showToast(`Selected buyer: ${selectedName}`);
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
      showToast(`No preset merchandiser found in buyer profile`);
    }
  };

  // Image File Upload
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
          showToast(`Uploaded garment photo: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Tech Pack Upload
  const handleTechPackFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTechPackFileName(file.name);
      showToast(`Attached Tech Pack: ${file.name}`);
    }
  };

  // Handle Stage Change
  const handleStageChange = (index: number, field: keyof ProductionStageDetail, value: any) => {
    const updatedStages = [...(formData.productionTracking?.stages || INITIAL_STAGES)];
    updatedStages[index] = {
      ...updatedStages[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      productionTracking: {
        currentStage: prev.status,
        overallProgressPercent: prev.productionTracking?.overallProgressPercent || 10,
        stages: updatedStages,
      },
    }));
  };

  // BOM Excel Upload
  const handleBOMExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const fileName = file ? file.name : 'BOM_Import.xlsx';
    const parsedItems: BOMItem[] = [
      {
        id: `bom-imp-${Date.now()}-1`,
        itemType: 'FABRIC',
        itemCode: 'FAB-SHELL-IMP',
        description: 'Cotton Twill Fabric 220 GSM Bio-Washed',
        supplier: 'Envoy Textiles Ltd',
        consumptionPerGarment: 1.45,
        unit: 'yds',
        unitPriceUSD: 3.2,
        totalRequired: Math.ceil(1.45 * formData.orderQuantity),
        status: 'SOURCED',
      },
      {
        id: `bom-imp-${Date.now()}-2`,
        itemType: 'BUTTON',
        itemCode: 'BTN-SHANK-20L',
        description: 'Engraved Metal Shank Button 20L',
        supplier: 'YKK Fastening',
        consumptionPerGarment: 6,
        unit: 'pcs',
        unitPriceUSD: 0.025,
        totalRequired: 6 * formData.orderQuantity,
        status: 'SOURCED',
      },
    ];
    setFormData((prev) => ({
      ...prev,
      bomItems: [...(prev.bomItems || []), ...parsedItems],
    }));
    showToast(`Imported ${parsedItems.length} items from ${fileName}`);
  };

  // Add BOM Item
  const handleAddBOMItem = () => {
    const newItem: BOMItem = {
      id: `bom-${Date.now()}`,
      itemType: 'FABRIC',
      itemCode: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      description: 'New Material Specification',
      supplier: 'Local / Sourced Mill',
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

  // Update BOM item
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

  // Handle Logistics Change
  const handleLogisticsChange = (field: keyof LogisticsDetail, value: any) => {
    setFormData((prev) => ({
      ...prev,
      logistics: {
        ...(prev.logistics || INITIAL_LOGISTICS),
        [field]: value,
      },
    }));
  };

  // Save new order with synchronized WIP Record and Stages
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.styleNumber || !formData.styleDescription) {
      showToast('Please enter PO Number, Style Number, and Description');
      setActiveTab('general');
      return;
    }

    const updatedStages = syncWIPToStages(
      wipData,
      formData.productionTracking?.stages || INITIAL_STAGES,
      formData.orderQuantity
    );
    const metrics = calculateWIPPipelineMetrics(wipData, formData.orderQuantity);

    const finalOrder: BuyerOrder = {
      ...formData,
      wipRecord: wipData,
      productionTracking: {
        currentStage: formData.status,
        overallProgressPercent: metrics.overallProgressPercent,
        stages: updatedStages,
      },
    };

    onSave(finalOrder);
    showToast(`Created new purchase order ${formData.orderNumber}`);
  };

  const calculatedTotalValue = formData.orderQuantity * formData.fobPrice;
  const pipelineMetrics = calculateWIPPipelineMetrics(wipData, formData.orderQuantity);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Order List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-xs font-bold">
                NEW ORDER
              </span>
              <h2 className="text-base font-bold text-slate-900 font-mono">
                Create New Purchase Order
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter buyer commercial specifications, upload tech pack &amp; style photo, setup initial WIP pipeline, BOM and shipping plan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={handleSaveOrder}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Create &amp; Save Order</span>
          </button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-semibold">
        {[
          { id: 'general', label: '1. Commercial & Style Specs', icon: Tag },
          { id: 'upload', label: '2. Style Image & Attachments', icon: Paperclip },
          { id: 'stages', label: '3. WIP Record & Pipeline Setup', icon: Activity },
          { id: 'bom', label: '4. Bill of Materials (BOM)', icon: Layers },
          { id: 'logistics', label: '5. Logistics & Shipping', icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* TAB 1: COMMERCIAL & STYLE SPECS */}
      {activeTab === 'general' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Commercial Terms &amp; Order Specifications</span>
              </h3>
              <p className="text-xs text-slate-500">
                Buyer identification, style references, pricing matrix, and contract delivery dates
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
                onChange={(e) => handleBuyerSelect(e.target.value)}
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
                Style Description *
              </label>
              <input
                type="text"
                value={formData.styleDescription}
                onChange={(e) => handleInputChange('styleDescription', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Men's 100% Combed Cotton Regular Fit Polo Shirt with Jacquard Collar"
                required
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
                Quality Standard
              </label>
              <input
                type="text"
                value={formData.qualityStandard}
                onChange={(e) => handleInputChange('qualityStandard', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="AQL 1.5 Major / 4.0 Minor"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Standard Minute Value (SMV / SAM)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={formData.smv ?? 18.5}
                onChange={(e) => handleInputChange('smv', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="18.5"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Target minutes per piece (auto-links to Production & Quality)
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Planned Daily Production Target (Pcs)
              </label>
              <input
                type="number"
                min="1"
                value={formData.productionTarget ?? formData.dailyTarget ?? 1200}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  handleInputChange('productionTarget', val);
                  handleInputChange('dailyTarget', val);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="1200"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Scheduled daily line output for production monitoring
              </span>
            </div>

            {/* Merchandiser Information Header Banner */}
            <div className="md:col-span-3 pt-3 pb-1 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-100 text-blue-700">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Assigned In-House Merchandiser</span>
                  <span className="text-[10px] text-slate-500">Auto-populated from selected Buyer Profile</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Auto-linked: {formData.buyerName}
                </span>
                <button
                  type="button"
                  onClick={handleResyncMerchandiser}
                  className="px-2 py-1 text-[11px] text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors"
                  title="Re-sync merchandiser info from selected buyer profile"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-sync</span>
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

      {/* TAB 2: STYLE IMAGE & DOCUMENT ATTACHMENTS */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Garment Image Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Garment Style Sample Photo</h3>
                  <p className="text-[11px] text-slate-500">Upload or pick a sample photo for visual identification</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-40 h-44 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50 flex items-center justify-center relative shrink-0">
                  {formData.productImage ? (
                    <img
                      src={formData.productImage}
                      alt="Garment Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[11px]">No image</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Upload Garment Image File
                    </label>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer font-semibold">
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
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                      Or select a preset:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_PRODUCT_IMAGES.map((img) => (
                        <button
                          key={img.name}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, productImage: img.url }));
                            showToast(`Selected: ${img.name}`);
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

            {/* Tech Pack Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Master Tech Pack Attachment</h3>
                  <p className="text-[11px] text-slate-500">Attach CAD specifications and measurements sheet</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 font-mono text-xs">{techPackFileName}</div>
                    <div className="text-[10px] text-slate-500">Ready for initial production review</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Tech Pack PDF</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.cad"
                      onChange={handleTechPackFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* DEDICATED MULTIPLE FILE UPLOADER FOR MEASUREMENT SPEC, TECHNICAL SPEC, TEST RECORD, ETC */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <OrderAttachmentsUploader
              attachments={formData.attachments || []}
              onChange={(newAtts) => setFormData((prev) => ({ ...prev, attachments: newAtts }))}
              orderNumber={formData.orderNumber}
              styleNumber={formData.styleNumber}
              showToast={showToast}
            />
          </div>
        </div>
      )}

      {/* TAB 3: WIP RECORD & PRODUCTION PIPELINE SETUP */}
      {activeTab === 'stages' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>WIP Record &amp; Production Pipeline Initialization</span>
              </h3>
              <p className="text-xs text-slate-500">
                Setup initial manufacturing WIP targets, wash requirements, and floor link parameters for PO {formData.orderNumber}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoDetectWIPFromFloor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 cursor-pointer transition-colors"
              title="Query existing cutting, sewing, and final inspection records for this PO"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Auto-detect from Floor Records</span>
            </button>
          </div>

          {/* 9 Stages WIP Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* 1. Cutting Planned */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Cutting Planned</span>
                </span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                  Target +1%
                </span>
              </div>
              <input
                type="number"
                value={wipData.cuttingPlanned || 0}
                onChange={(e) => handleWIPFieldChange('cuttingPlanned', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 outline-none"
              />
              <span className="text-[10px] text-slate-400 block">Planned marker consumption target</span>
            </div>

            {/* 2. Cutting Actual */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Cutting Actual</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {wipData.cuttingActual > 0 ? '⚡ Auto-detected' : 'Initial: 0'}
                </span>
              </div>
              <input
                type="number"
                value={wipData.cuttingActual || 0}
                onChange={(e) => handleWIPFieldChange('cuttingActual', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono font-bold text-emerald-800 outline-none"
              />
              <span className="text-[10px] text-slate-400 block">Actual garments cut on floor tables</span>
            </div>

            {/* 3. Sewing Line Input */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3. Sewing Line Input</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleWIPFieldChange('sewingInput', wipData.cuttingActual || formData.orderQuantity)}
                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                >
                  Match Cut
                </button>
              </div>
              <input
                type="number"
                value={wipData.sewingInput || 0}
                onChange={(e) => handleWIPFieldChange('sewingInput', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-indigo-800 outline-none"
              />
              <span className="text-[10px] text-slate-400 block">Bundles loaded into sewing lines</span>
            </div>

            {/* 4. Sewing Complete Quantity */}
            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  <span>4. Sewing Complete</span>
                </span>
                <span className="text-[10px] text-indigo-700 font-bold">
                  {wipData.sewingComplete > 0 ? '⚡ Auto-detected' : 'Initial: 0'}
                </span>
              </div>
              <input
                type="number"
                value={wipData.sewingComplete || 0}
                onChange={(e) => handleWIPFieldChange('sewingComplete', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white font-mono font-bold text-indigo-900 outline-none"
              />
              <span className="text-[10px] text-slate-400 block">Sewing output checked &amp; passed</span>
            </div>

            {/* 5. Wash Sent & Received */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              wipData.washApplicable ? 'border-sky-300 bg-sky-50/40' : 'border-slate-200 bg-slate-50/70'
            }`}>
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>5. Wash (S / R)</span>
                </span>
                <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-sky-800">
                  <input
                    type="checkbox"
                    checked={wipData.washApplicable}
                    onChange={(e) => handleWIPFieldChange('washApplicable', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 w-3 h-3"
                  />
                  <span>Wash Required</span>
                </label>
              </div>
              {wipData.washApplicable ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={wipData.washSent || 0}
                    onChange={(e) => handleWIPFieldChange('washSent', parseInt(e.target.value) || 0)}
                    placeholder="Sent"
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sky-900 outline-none text-xs"
                  />
                  <input
                    type="number"
                    value={wipData.washReceived || 0}
                    onChange={(e) => handleWIPFieldChange('washReceived', parseInt(e.target.value) || 0)}
                    placeholder="Recv"
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sky-900 outline-none text-xs"
                  />
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 py-1 italic">
                  Non-wash style (Direct sewing to finishing)
                </div>
              )}
            </div>

            {/* 6. Finishing Quantity */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>6. Finishing Quantity</span>
                </span>
                <span className="text-[10px] text-purple-700 font-bold">
                  {wipData.finishingQuantity > 0 ? '⚡ Auto-detected' : 'Initial: 0'}
                </span>
              </div>
              <input
                type="number"
                value={wipData.finishingQuantity || 0}
                onChange={(e) => handleWIPFieldChange('finishingQuantity', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white font-mono font-bold text-purple-900 outline-none"
              />
              <span className="text-[10px] text-slate-400 block">Ironing, trimming &amp; tag attachment</span>
            </div>

            {/* 7. Packed Quantity */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <span>7. Packed Quantity</span>
                </span>
                <span className="text-[10px] text-amber-700 font-bold font-mono">
                  &asymp; {Math.ceil((wipData.packedQuantity || 0) / 48)} ctn
                </span>
              </div>
              <input
                type="number"
                value={wipData.packedQuantity || 0}
                onChange={(e) => handleWIPFieldChange('packedQuantity', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-amber-900 outline-none"
              />
              <span className="text-[10px] text-slate-400 block">Cartoned pieces ready for inspection</span>
            </div>

            {/* 8. Inspection Completed Quantity */}
            <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/30 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>8. Inspection Completed</span>
                </span>
                <span className="text-[10px] text-teal-700 font-bold">
                  {wipData.inspectionCompletedQuantity > 0 ? '⚡ Passed QA' : 'AQL 1.5 Target'}
                </span>
              </div>
              <input
                type="number"
                value={wipData.inspectionCompletedQuantity || 0}
                onChange={(e) =>
                  handleWIPFieldChange('inspectionCompletedQuantity', parseInt(e.target.value) || 0)
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-teal-300 bg-white font-mono font-bold text-teal-900 outline-none"
              />
              <span className="text-[10px] text-slate-400 block">Passed Final Inspection quantity</span>
            </div>

            {/* 9. Shipped Quantity */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>9. Shipped Quantity</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">COMMERCIAL</span>
              </div>
              <input
                type="number"
                value={wipData.shippedQuantity || 0}
                onChange={(e) => handleWIPFieldChange('shippedQuantity', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-emerald-800 outline-none"
              />
              <span className="text-[10px] text-slate-400 block">Factory ex-factory gate out pieces</span>
            </div>
          </div>

          {/* Timeline Milestones Table */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Initial Stage Timeline &amp; Dates
            </h4>
            <div className="space-y-2.5">
              {(formData.productionTracking?.stages || INITIAL_STAGES).map((st, idx) => (
                <div
                  key={st.stage}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900">
                      {st.stage.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                    <div>
                      <label className="block text-slate-400 text-[10px] font-semibold mb-0.5">Start Date</label>
                      <input
                        type="date"
                        value={st.startDate || ''}
                        onChange={(e) => handleStageChange(idx, 'startDate', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-semibold mb-0.5">Target End Date</label>
                      <input
                        type="date"
                        value={st.targetEndDate || ''}
                        onChange={(e) => handleStageChange(idx, 'targetEndDate', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white outline-none text-xs"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-slate-400 text-[10px] font-semibold mb-0.5">Assigned Lines</label>
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
                        placeholder="Line 01, Line 02"
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BOM & MATERIALS */}
      {activeTab === 'bom' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Bill of Materials (BOM) &amp; Consumption Matrix</span>
              </h3>
              <p className="text-xs text-slate-500">
                Define fabric, trims, threads, and packaging lines
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload BOM (Excel)</span>
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material Line</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Item Code</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Supplier</th>
                  <th className="p-2.5 text-right">Consumption / Pc</th>
                  <th className="p-2.5 text-center">Unit</th>
                  <th className="p-2.5 text-right">Price ($)</th>
                  <th className="p-2.5 text-right">Total Req.</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {(formData.bomItems || []).map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-2">
                      <select
                        value={item.itemType}
                        onChange={(e) => handleBOMItemChange(idx, 'itemType', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 bg-white font-semibold text-[11px]"
                      >
                        <option value="FABRIC">Fabric</option>
                        <option value="BUTTON">Button</option>
                        <option value="ZIPPER">Zipper</option>
                        <option value="THREAD">Thread</option>
                        <option value="LABEL">Label</option>
                        <option value="HANGTAG">Hangtag</option>
                        <option value="POLYBAG">Polybag</option>
                        <option value="CARTON">Carton</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.itemCode}
                        onChange={(e) => handleBOMItemChange(idx, 'itemCode', e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-slate-200 font-mono text-[11px]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleBOMItemChange(idx, 'description', e.target.value)}
                        className="w-full min-w-[180px] px-2 py-1 rounded border border-slate-200 text-[11px]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.supplier}
                        onChange={(e) => handleBOMItemChange(idx, 'supplier', e.target.value)}
                        className="w-28 px-2 py-1 rounded border border-slate-200 text-[11px]"
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
                        className="w-16 px-2 py-1 rounded border border-slate-200 font-mono text-right text-[11px]"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleBOMItemChange(idx, 'unit', e.target.value)}
                        className="w-12 px-1 py-1 rounded border border-slate-200 text-center text-[11px]"
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
                        className="w-16 px-2 py-1 rounded border border-slate-200 font-mono text-right text-[11px]"
                      />
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-700 text-[11px]">
                      {item.totalRequired.toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveBOMItem(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
      )}

      {/* TAB 5: LOGISTICS */}
      {activeTab === 'logistics' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Logistics &amp; Export Shipping Arrangement</span>
            </h3>
            <p className="text-xs text-slate-500">
              Initial port routing, freight forwarder, terms, and estimated delivery dates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Shipment Mode</label>
              <select
                value={formData.logistics?.shipmentMode || 'OCEAN_FCL'}
                onChange={(e) => handleLogisticsChange('shipmentMode', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
              >
                <option value="OCEAN_FCL">Ocean FCL (Full Container)</option>
                <option value="OCEAN_LCL">Ocean LCL (Loose Cargo)</option>
                <option value="AIR_CARGO">Air Freight Express</option>
                <option value="MULTIMODAL">Sea-Air Multimodal</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Freight Forwarder</label>
              <input
                type="text"
                value={formData.logistics?.forwarder || ''}
                onChange={(e) => handleLogisticsChange('forwarder', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Maersk Logistics Bangladesh"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Port of Loading (POL)</label>
              <input
                type="text"
                value={formData.logistics?.portOfLoading || ''}
                onChange={(e) => handleLogisticsChange('portOfLoading', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Chattogram (Chittagong) Port, BD"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Port of Discharge (POD)</label>
              <input
                type="text"
                value={formData.logistics?.portOfDischarge || ''}
                onChange={(e) => handleLogisticsChange('portOfDischarge', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Port of Hamburg, Germany"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Estimated Departure (ETD)</label>
              <input
                type="date"
                value={formData.logistics?.etdDate || ''}
                onChange={(e) => handleLogisticsChange('etdDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Estimated Arrival (ETA)</label>
              <input
                type="date"
                value={formData.logistics?.etaDate || ''}
                onChange={(e) => handleLogisticsChange('etaDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Action Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            Ready to create Order <strong>{formData.orderNumber}</strong> ({formData.orderQuantity.toLocaleString()} pcs • ${calculatedTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveOrder}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Create &amp; Save Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
