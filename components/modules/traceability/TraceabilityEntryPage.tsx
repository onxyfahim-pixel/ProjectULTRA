'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Package,
  Sparkles,
  Layers,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  QrCode,
  Barcode,
  Factory,
  Check,
  RefreshCw,
  Plus,
  ShieldCheck,
  HelpCircle,
  Tag,
  Scissors,
  Truck,
  RotateCcw,
  UploadCloud,
  Trash2,
  FileCheck,
  Camera,
  Image as ImageIcon,
  ShieldAlert,
  Percent,
  Calculator,
} from 'lucide-react';
import { TraceabilityChain, BuyerOrder, TraceabilityEvidenceFile, TraceabilityDestructionPhoto } from '@/lib/types/modules';
import { TraceabilityOrderSelectorModal } from './TraceabilityOrderSelectorModal';

interface TraceabilityEntryPageProps {
  initialRecord?: TraceabilityChain | null;
  onBack: () => void;
  onSave: (record: TraceabilityChain) => void;
  showToast: (msg: string) => void;
}

export function TraceabilityEntryPage({
  initialRecord,
  onBack,
  onSave,
  showToast,
}: TraceabilityEntryPageProps) {
  const isEditing = Boolean(initialRecord);

  // Form state initialized with rich defaults
  const [formData, setFormData] = useState<TraceabilityChain>(() => {
    if (initialRecord) {
      return { ...initialRecord };
    }
    const todayStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const dateOnly = new Date().toISOString().slice(0, 10);
    const rand5 = Math.floor(10000 + Math.random() * 90000);
    const rand4 = Math.floor(1000 + Math.random() * 9000);

    return {
      id: `trc-${Date.now()}`,
      cartonBarcode: `CTN-HM-${rand5}-${rand4}`,
      garmentSerial: `GRM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      styleNumber: 'STY-TS-2026',
      poNumber: 'PO-HM-99201',
      orderNumber: 'PO-HM-99201',
      articleName: 'Men Heavyweight Cotton Crewneck Tee',
      styleDescription: 'Men Heavyweight Cotton Crewneck Tee',
      buyer: 'H&M Hennes & Mauritz',
      orderQuantity: 45000,
      season: 'Autumn/Winter 2026',
      colorWay: 'Jet Black / Melange Grey',
      sewingLine: 'Sewing Line 01 (Knits)',
      cuttingTableLot: `CUT-TB-${Math.floor(10 + Math.random() * 30)}`,
      fabricRollBarcode: `FB-ROL-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`,
      dyeingBatch: `DYE-PAC-${Math.floor(100 + Math.random() * 900)}-A`,
      yarnLot: `YRN-SPIN-${Math.floor(1000 + Math.random() * 9000)}`,
      cottonOrigin: 'Texas U.S. Cotton Trust Protocol Certified',
      spinningMill: 'Square Spinning Mills Ltd (Unit 2)',
      fabricMill: 'Pacific Knit Composite Ltd',
      ginningLocation: 'Lubbock Ginning Co-Op, Texas, USA',
      passedFinalDate: todayStr,
      status: 'VERIFIED',
      traceabilityScore: 100,
      certificateStandard: 'U.S. Cotton Trust Protocol / OEKO-TEX Standard 100',
      certificateNumber: 'USCTP-88419-TX',
      inspectorName: 'Md. Tariqul Islam (Lead Auditor)',
      metalDetectionStatus: 'PASSED',
      needlePolicyVerified: true,
      notes: 'Full backward chain and brand protection reconciliation demonstrated. 100% verified against buyer standards.',
      rfidTag: `EPC-96-${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}`,

      // Quantity Verification & Reconciliation
      receivedQty: 46500,
      issuedQty: 46200,
      cutQty: 46200,
      passedQty: 45000,
      rejectQty: 780,
      excessQty: 420,
      wasteQty: 300,
      varianceQty: 0,
      reconciliationStatus: '100%_RECONCILED',

      // Inbound Challan & Invoice Evidence
      invoiceNumber: `INV-SQ-${new Date().getFullYear()}-${rand4}`,
      invoiceDate: dateOnly,
      challanNumber: `CHL-PKC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      challanDate: dateOnly,
      gatePassNumber: `GP-IN-${Math.floor(1000 + Math.random() * 9000)}`,
      challanEvidenceFiles: [
        { id: 'f-init-1', name: 'Delivery_Challan_Verified.pdf', url: '#challan', uploadDate: dateOnly, fileType: 'application/pdf', size: '1.2 MB' },
        { id: 'f-init-2', name: 'Commercial_Invoice_Scanned.pdf', url: '#invoice', uploadDate: dateOnly, fileType: 'application/pdf', size: '1.8 MB' },
      ],

      // Brand Protection & Disposal
      brandProtectionStatus: 'DISPOSED_CERTIFIED',
      disposalRecordId: `DISP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      disposedExcessQty: 1200, // Rejects + Excess = 780 + 420
      disposalMethod: 'SHREDDING',
      disposalDate: dateOnly,
      disposalFacility: 'In-House Secure Shredder Room Bay 3',
      witnessedBy: 'Lt. Col. (Retd) Anwar Hossain (Chief Security Officer)',
      certificateOfDestructionNumber: `COD-HM-${new Date().getFullYear()}-${rand4}`,
      destructionEvidencePhotos: [
        { id: 'dp-init-1', url: 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=400&auto=format&fit=crop&q=60', caption: 'Defaced branded labels & tags bundled for shredder', timestamp: '10:30 AM' },
        { id: 'dp-init-2', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&auto=format&fit=crop&q=60', caption: 'Post-shredding remnant inspection by Buyer QA', timestamp: '11:15 AM' },
      ],
    };
  });

  const [isOrderSelectorOpen, setIsOrderSelectorOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Live Automatic Reconciliation Balance Calculation
  const received = formData.receivedQty || 0;
  const passed = formData.passedQty || 0;
  const reject = formData.rejectQty || 0;
  const excess = formData.excessQty || 0;
  const waste = formData.wasteQty || 0;

  const totalAccounted = passed + reject + excess + waste;
  const variance = received - totalAccounted;
  const isReconciled = variance === 0 && received > 0;

  // Auto-sync variance when quantities change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      varianceQty: variance,
      reconciliationStatus: isReconciled
        ? '100%_RECONCILED'
        : variance !== 0
        ? 'VARIANCE_FLAGGED'
        : 'PENDING_RECONCILIATION',
      // Auto-suggest disposed excess qty = reject + excess if not manually set
      disposedExcessQty: prev.disposedExcessQty || (reject + excess),
    }));
  }, [received, passed, reject, excess, waste, variance, isReconciled]);

  const handleOrderSelected = (order: BuyerOrder) => {
    const defaultReceived = Math.round(order.orderQuantity * 1.03); // +3% standard factory allowance
    const defaultPassed = order.orderQuantity;
    const defaultReject = Math.round(order.orderQuantity * 0.018); // ~1.8% reject
    const defaultExcess = Math.round(order.orderQuantity * 0.008); // ~0.8% leftover
    const defaultWaste = defaultReceived - (defaultPassed + defaultReject + defaultExcess);

    setFormData((prev) => ({
      ...prev,
      poNumber: order.orderNumber,
      orderNumber: order.orderNumber,
      styleNumber: order.styleNumber,
      articleName: order.styleDescription || order.styleNumber,
      styleDescription: order.styleDescription || order.styleNumber,
      buyer: order.buyerName,
      orderQuantity: order.orderQuantity,
      season: order.season || prev.season,
      receivedQty: defaultReceived,
      issuedQty: defaultReceived,
      cutQty: defaultReceived,
      passedQty: defaultPassed,
      rejectQty: defaultReject,
      excessQty: defaultExcess,
      wasteQty: defaultWaste > 0 ? defaultWaste : 0,
      disposedExcessQty: defaultReject + defaultExcess,
    }));
    showToast(`Loaded ${order.orderNumber} (${order.styleNumber}) from Buyer & Order module`);
  };

  const handleEvidenceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: TraceabilityEvidenceFile[] = Array.from(files).map((file, idx) => ({
      id: `f-${Date.now()}-${idx}`,
      name: file.name,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toISOString().slice(0, 10),
      fileType: file.type || 'application/pdf',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    }));

    setFormData((prev) => ({
      ...prev,
      challanEvidenceFiles: [...(prev.challanEvidenceFiles || []), ...newFiles],
    }));
    showToast(`Uploaded ${newFiles.length} challan/invoice evidence file(s)`);
  };

  const removeEvidenceFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      challanEvidenceFiles: (prev.challanEvidenceFiles || []).filter((f) => f.id !== fileId),
    }));
    showToast('Removed evidence document');
  };

  const handleDestructionPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: TraceabilityDestructionPhoto[] = Array.from(files).map((file, idx) => ({
      id: `dp-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      caption: file.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    setFormData((prev) => ({
      ...prev,
      destructionEvidencePhotos: [...(prev.destructionEvidencePhotos || []), ...newPhotos],
    }));
    showToast(`Attached ${newPhotos.length} destruction evidence photo(s)`);
  };

  const removeDestructionPhoto = (photoId: string) => {
    setFormData((prev) => ({
      ...prev,
      destructionEvidencePhotos: (prev.destructionEvidencePhotos || []).filter((p) => p.id !== photoId),
    }));
    showToast('Removed destruction photo');
  };

  const generateNewBarcodes = () => {
    const buyerPrefix = (formData.buyer || 'HM').split(' ')[0].toUpperCase().slice(0, 4);
    const rand5 = Math.floor(10000 + Math.random() * 90000);
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    const rand6 = Math.floor(100000 + Math.random() * 900000);

    setFormData((prev) => ({
      ...prev,
      cartonBarcode: `CTN-${buyerPrefix}-${rand5}-${rand4}`,
      garmentSerial: `GRM-${new Date().getFullYear()}-${rand6}`,
      fabricRollBarcode: `FB-ROL-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`,
      dyeingBatch: `DYE-${buyerPrefix}-${Math.floor(100 + Math.random() * 900)}-${['A', 'B', 'INDIGO'][Math.floor(Math.random() * 3)]}`,
      yarnLot: `YRN-${['SPIN', 'RING', 'SUPIMA', 'OE'][Math.floor(Math.random() * 4)]}-${Math.floor(1000 + Math.random() * 9000)}`,
      cuttingTableLot: `CUT-TB-${Math.floor(10 + Math.random() * 30)}`,
      disposalRecordId: `DISP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    }));
    showToast('Auto-generated fresh barcodes and Disposal Record ID');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.styleNumber.trim()) newErrors.styleNumber = 'Style / Article Number is required';
    if (!formData.buyer.trim()) newErrors.buyer = 'Buyer Name is required';
    if (!formData.invoiceNumber?.trim()) newErrors.invoiceNumber = 'Invoice Number is required';
    if (!formData.challanNumber?.trim()) newErrors.challanNumber = 'Challan Number is required';
    if (!formData.receivedQty || formData.receivedQty <= 0) newErrors.receivedQty = 'Received Quantity must be > 0';
    if (!formData.passedQty || formData.passedQty <= 0) newErrors.passedQty = 'Passed / Packed Quantity is required';
    if (!formData.disposalRecordId?.trim()) newErrors.disposalRecordId = 'Disposal Record ID is required for Brand Protection';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix required fields highlighted in red');
      return;
    }

    onSave({
      ...formData,
      status: formData.status || 'VERIFIED',
      traceabilityScore: formData.traceabilityScore || 100,
      updatedAt: new Date().toISOString(),
    });

    showToast(isEditing ? 'Traceability chain updated successfully' : 'New traceability record saved');
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching Audit Module style */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Cancel and Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {isEditing ? 'EDIT ENTRY' : 'NEW TRACEABILITY ENTRY'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {formData.disposalRecordId ? `Disposal: ${formData.disposalRecordId}` : 'Brand Protection Verification'}
                </span>
              </div>
              <h1 className="text-base font-bold text-slate-900 mt-0.5">
                {isEditing ? 'Edit Traceability & Reconciliation Record' : 'Record Traceability, Quantity Verification & Brand Protection'}
              </h1>
              <p className="text-xs text-slate-500">
                Verify quantity across receive, issue, packed, reject, and excess with invoice/challan evidence and secure disposal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={generateNewBarcodes}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Auto-generate fresh codes"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate Codes</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Save Traceability Record'}</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── SECTION 1: BUYER & ORDER SELECTION BANNER ────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Step 1: Buyer &amp; Order Selection
                  </h3>
                  {formData.poNumber && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                      PO: {formData.poNumber}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Choose an active purchase order to automatically sync Buyer Name, Style/Article, Description, and Order Quantity
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOrderSelectorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Package className="w-3.5 h-3.5" />
              <span>{formData.poNumber ? 'Change PO / Article' : 'Select PO / Article'}</span>
            </button>
          </div>

          {formData.buyer ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                    PO: {formData.poNumber || 'N/A'}
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    Style: {formData.styleNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Buyer: {formData.buyer}
                  </span>
                </div>
                {formData.styleDescription && (
                  <p className="text-xs font-medium text-slate-700">{formData.styleDescription}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span>
                    Order Qty: <strong className="font-mono text-slate-800">{formData.orderQuantity?.toLocaleString() || '45,000'} pcs</strong>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">Automatic baseline reconciliation synced</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50/70 border border-dashed border-slate-300 text-center py-6">
              <p className="text-xs text-slate-600 font-medium">
                No buyer purchase order selected yet.
              </p>
              <button
                type="button"
                onClick={() => setIsOrderSelectorOpen(true)}
                className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
              >
                + Select an active Purchase Order to auto-populate
              </button>
            </div>
          )}
        </div>

        {/* ─── SECTION 2: INVOICE & CHALLAN EVIDENCE UPLOAD ────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Step 2: Inbound Commercial Invoice & Delivery Challan Evidence
                </h3>
                <p className="text-xs text-slate-500">
                  Documentary proof of all incoming raw materials, fabrics, and branded trims received
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Audit Inbound Proof
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Supplier Invoice Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.invoiceNumber || ''}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="e.g. INV-SQ-2026-9901"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border ${
                  errors.invoiceNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.invoiceNumber && <p className="text-[11px] text-rose-500">{errors.invoiceNumber}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Invoice Date
              </label>
              <input
                type="date"
                value={formData.invoiceDate || ''}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Delivery Challan Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.challanNumber || ''}
                onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                placeholder="e.g. CHL-PKC-2026-8841"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border ${
                  errors.challanNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.challanNumber && <p className="text-[11px] text-rose-500">{errors.challanNumber}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Challan Date / Gate Pass
              </label>
              <input
                type="text"
                value={formData.gatePassNumber || ''}
                onChange={(e) => setFormData({ ...formData, gatePassNumber: e.target.value })}
                placeholder="e.g. GP-IN-7712"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Challan & Invoice Evidence Files Upload */}
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Attach Challan & Invoice Document Evidence (PDF / Scans)</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Required for buyer compliance audit verification. Upload signed challans and mill invoices.
                </p>
              </div>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Documents</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleEvidenceFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {formData.challanEvidenceFiles && formData.challanEvidenceFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                {formData.challanEvidenceFiles.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 truncate block max-w-[170px]" title={f.name}>
                          {f.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {f.size || 'Verified'} • {f.uploadDate}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidenceFile(f.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── SECTION 3: STEP-BY-STEP QUANTITY VERIFICATION CALCULATOR ─────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Step 3: Step-by-Step Quantity Verification (Receive &rarr; Issue &rarr; Cut &rarr; Pack &rarr; Reject &rarr; Excess)
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time factory balance reconciliation: Received = Packed + Rejects + Excess + Waste
                </p>
              </div>
            </div>

            {/* Reconciliation Live Status Badge */}
            <div className="self-start sm:self-auto">
              {isReconciled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% RECONCILED (Variance: 0 pcs)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Variance: {variance > 0 ? `+${variance}` : variance} pcs discrepancy!</span>
                </span>
              )}
            </div>
          </div>

          {/* Quantity Inputs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* 1. Received */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">
                1. Received Qty
              </span>
              <input
                type="number"
                value={formData.receivedQty ?? ''}
                onChange={(e) => setFormData({ ...formData, receivedQty: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm font-mono font-black text-blue-900 bg-white rounded-lg border border-blue-200"
              />
              <span className="text-[10px] text-blue-600 font-medium block">From Challan</span>
            </div>

            {/* 2. Issued */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-700 uppercase block">
                2. Issued Qty
              </span>
              <input
                type="number"
                value={formData.issuedQty ?? ''}
                onChange={(e) => setFormData({ ...formData, issuedQty: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm font-mono font-black text-slate-900 bg-white rounded-lg border border-slate-200"
              />
              <span className="text-[10px] text-slate-500 font-medium block">To Cutting/Sewing</span>
            </div>

            {/* 3. Cut Qty */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-700 uppercase block">
                3. Cut Units
              </span>
              <input
                type="number"
                value={formData.cutQty ?? ''}
                onChange={(e) => setFormData({ ...formData, cutQty: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm font-mono font-black text-slate-900 bg-white rounded-lg border border-slate-200"
              />
              <span className="text-[10px] text-slate-500 font-medium block">Spreading Table</span>
            </div>

            {/* 4. Good / Packed Qty */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                4. Passed / Packed
              </span>
              <input
                type="number"
                value={formData.passedQty ?? ''}
                onChange={(e) => setFormData({ ...formData, passedQty: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm font-mono font-black text-emerald-900 bg-white rounded-lg border border-emerald-200"
              />
              <span className="text-[10px] text-emerald-600 font-medium block">Export Order Met</span>
            </div>

            {/* 5. Reject Qty */}
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 space-y-1">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">
                5. Total Rejects
              </span>
              <input
                type="number"
                value={formData.rejectQty ?? ''}
                onChange={(e) => setFormData({ ...formData, rejectQty: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm font-mono font-black text-rose-900 bg-white rounded-lg border border-rose-200"
              />
              <span className="text-[10px] text-rose-600 font-medium block">Sewing/Wash Rej</span>
            </div>

            {/* 6. Excess / Leftover Qty */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">
                6. Excess / Leftover
              </span>
              <input
                type="number"
                value={formData.excessQty ?? ''}
                onChange={(e) => setFormData({ ...formData, excessQty: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm font-mono font-black text-amber-900 bg-white rounded-lg border border-amber-200"
              />
              <span className="text-[10px] text-amber-600 font-medium block">Surplus Production</span>
            </div>

            {/* 7. Waste / Scrap */}
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-1">
              <span className="text-[10px] font-bold text-purple-800 uppercase block">
                7. Cutting Waste
              </span>
              <input
                type="number"
                value={formData.wasteQty ?? ''}
                onChange={(e) => setFormData({ ...formData, wasteQty: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm font-mono font-black text-purple-900 bg-white rounded-lg border border-purple-200"
              />
              <span className="text-[10px] text-purple-600 font-medium block">End bits / Salvage</span>
            </div>
          </div>

          {/* Quick Balanced Helper Button */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
            <span className="text-slate-600">
              Total Accounted: <strong className="font-mono text-slate-900">{totalAccounted.toLocaleString()} pcs</strong> of <strong className="font-mono text-blue-700">{received.toLocaleString()} pcs</strong> received.
            </span>

            {variance !== 0 && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    wasteQty: (prev.wasteQty || 0) + variance,
                  }));
                  showToast('Auto-balanced variance into waste log');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Auto-balance discrepancy into cutting waste ({variance > 0 ? `+${variance}` : variance} pcs)
              </button>
            )}
          </div>
        </div>

        {/* ─── SECTION 4: BRAND PROTECTION & DISPOSAL RECORD ───────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-mono font-bold text-xs">
                04
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Step 4: Brand Protection Audit & Secure Disposal Record
                </h3>
                <p className="text-xs text-slate-500">
                  Mandatory destruction of branded labels, price tags, and reject/excess apparel to protect brand integrity
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Anti-Grey Market Control
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Disposal Record ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.disposalRecordId || ''}
                onChange={(e) => setFormData({ ...formData, disposalRecordId: e.target.value })}
                placeholder="e.g. DISP-2026-0891"
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border ${
                  errors.disposalRecordId ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.disposalRecordId && <p className="text-[11px] text-rose-500">{errors.disposalRecordId}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Disposed Excess & Reject Units
              </label>
              <input
                type="number"
                value={formData.disposedExcessQty ?? ''}
                onChange={(e) => setFormData({ ...formData, disposedExcessQty: Number(e.target.value) })}
                placeholder="e.g. 1200"
                className="w-full px-3 py-2 text-xs font-mono font-bold text-rose-700 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Disposal Method
              </label>
              <select
                value={formData.disposalMethod || 'SHREDDING'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    disposalMethod: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="SHREDDING">Industrial Shredding (De-fibered)</option>
                <option value="DE_LABELING">Complete De-Labeling & De-Branding</option>
                <option value="INCINERATION">High-Temperature Incineration</option>
                <option value="AUTHORIZED_RECYCLER">Certified Environmental Recycler</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Brand Protection Status
              </label>
              <select
                value={formData.brandProtectionStatus || 'DISPOSED_CERTIFIED'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    brandProtectionStatus: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="DISPOSED_CERTIFIED">DISPOSED & CERTIFIED (Destroyed)</option>
                <option value="SECURED">SECURED IN QUARANTINE VAULT</option>
                <option value="PENDING_DESTRUCTION">PENDING DESTRUCTION RUN</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Disposal Date
              </label>
              <input
                type="date"
                value={formData.disposalDate || ''}
                onChange={(e) => setFormData({ ...formData, disposalDate: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Disposal Facility / Location
              </label>
              <input
                type="text"
                value={formData.disposalFacility || ''}
                onChange={(e) => setFormData({ ...formData, disposalFacility: e.target.value })}
                placeholder="e.g. In-House Secure Shredder Room Bay 3"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Certificate of Destruction (COD #)
              </label>
              <input
                type="text"
                value={formData.certificateOfDestructionNumber || ''}
                onChange={(e) => setFormData({ ...formData, certificateOfDestructionNumber: e.target.value })}
                placeholder="e.g. COD-HM-2026-0891"
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-800 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Witnessed & Signed By
              </label>
              <input
                type="text"
                value={formData.witnessedBy || ''}
                onChange={(e) => setFormData({ ...formData, witnessedBy: e.target.value })}
                placeholder="e.g. Lt. Col. Anwar (Security) & QA Lead"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Destruction Photo Evidence Upload */}
          <div className="p-4 bg-rose-50/40 rounded-xl border border-dashed border-rose-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-rose-600" />
                  <span>Attach Destruction & Shredding Photo Evidence</span>
                </span>
                <p className="text-[11px] text-rose-700">
                  Upload photos before and after destruction of labels, swing tags, and rejected branded garments.
                </p>
              </div>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleDestructionPhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {formData.destructionEvidencePhotos && formData.destructionEvidencePhotos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {formData.destructionEvidencePhotos.map((p) => (
                  <div key={p.id} className="relative group bg-white rounded-xl border border-rose-200 overflow-hidden shadow-xs">
                    <img
                      src={p.url}
                      alt={p.caption || 'Destruction'}
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-2 text-[10px] space-y-0.5">
                      <span className="font-semibold text-slate-800 block truncate" title={p.caption}>
                        {p.caption || 'Destruction Evidence'}
                      </span>
                      <span className="text-slate-400 font-mono block">{p.timestamp || 'Verified'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDestructionPhoto(p.id)}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/90 text-rose-600 rounded-full shadow-xs hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── SECTION 5: CUSTODY STAGES & BARCODES ─────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-mono font-bold text-xs">
              05
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Step 5: Physical Manufacturing Barcodes & Custody Tags
              </h3>
              <p className="text-xs text-slate-500">
                Carton barcode, garment QR serial, fabric roll barcode, and spinning lot
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Master Carton Barcode
              </label>
              <input
                type="text"
                value={formData.cartonBarcode}
                onChange={(e) => setFormData({ ...formData, cartonBarcode: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-700 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Garment QR Serial
              </label>
              <input
                type="text"
                value={formData.garmentSerial}
                onChange={(e) => setFormData({ ...formData, garmentSerial: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Sewing Line
              </label>
              <input
                type="text"
                value={formData.sewingLine}
                onChange={(e) => setFormData({ ...formData, sewingLine: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Dyeing Batch ID
              </label>
              <input
                type="text"
                value={formData.dyeingBatch}
                onChange={(e) => setFormData({ ...formData, dyeingBatch: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Yarn Lot #
              </label>
              <input
                type="text"
                value={formData.yarnLot}
                onChange={(e) => setFormData({ ...formData, yarnLot: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Cotton Origin Standard
              </label>
              <input
                type="text"
                value={formData.cottonOrigin}
                onChange={(e) => setFormData({ ...formData, cottonOrigin: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* ─── BOTTOM SAVE ACTIONS BAR ─────────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Save Traceability & Disposal Record'}</span>
          </button>
        </div>
      </form>

      {/* PO / Article Selector Modal */}
      {isOrderSelectorOpen && (
        <TraceabilityOrderSelectorModal
          isOpen={isOrderSelectorOpen}
          onClose={() => setIsOrderSelectorOpen(false)}
          onSelectOrder={handleOrderSelected}
          selectedPoNumber={formData.poNumber}
          selectedStyleNumber={formData.styleNumber}
        />
      )}
    </div>
  );
}
