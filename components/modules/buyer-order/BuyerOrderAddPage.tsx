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
} from 'lucide-react';
import {
  BuyerOrder,
  BuyerProfile,
  BOMItem,
  ProductionStageDetail,
  LogisticsDetail,
} from '@/lib/types/modules';

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
  }));

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

  // Save new order
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.styleNumber || !formData.styleDescription) {
      showToast('Please enter PO Number, Style Number, and Description');
      setActiveTab('general');
      return;
    }
    onSave(formData);
    showToast(`Created new purchase order ${formData.orderNumber}`);
  };

  const calculatedTotalValue = formData.orderQuantity * formData.fobPrice;

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
              Enter buyer commercial specifications, upload tech pack &amp; style photo, setup initial stages, BOM and shipping plan
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
          { id: 'upload', label: '2. Style Image & Tech Pack', icon: Upload },
          { id: 'stages', label: '3. Production Stages Plan', icon: Clock },
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

      {/* TAB 2: STYLE IMAGE & TECH PACK */}
      {activeTab === 'upload' && (
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
      )}

      {/* TAB 3: PRODUCTION STAGES */}
      {activeTab === 'stages' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Initial Production Stage Timeline &amp; Targets</span>
            </h3>
            <p className="text-xs text-slate-500">
              Set planned start dates, target milestones, and sewing line assignments
            </p>
          </div>

          <div className="space-y-3">
            {(formData.productionTracking?.stages || INITIAL_STAGES).map((st, idx) => (
              <div
                key={st.stage}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900">
                      {st.stage.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-semibold">
                    {st.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-0.5">Start Date</label>
                    <input
                      type="date"
                      value={st.startDate || ''}
                      onChange={(e) => handleStageChange(idx, 'startDate', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-0.5">Target End Date</label>
                    <input
                      type="date"
                      value={st.targetEndDate || ''}
                      onChange={(e) => handleStageChange(idx, 'targetEndDate', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-0.5">Planned Target (Pcs)</label>
                    <input
                      type="number"
                      value={st.plannedPcs || formData.orderQuantity}
                      onChange={(e) => handleStageChange(idx, 'plannedPcs', parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
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
