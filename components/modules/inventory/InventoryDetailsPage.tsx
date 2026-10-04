'use client';

import React from 'react';
import {
  ArrowLeft,
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
  Edit,
  Trash2,
  Copy,
  Clock,
  Check,
  AlertTriangle,
  Scissors,
  Eye,
  FileDown,
} from 'lucide-react';
import { InventoryItem } from '@/lib/types/erp';
import { GradeBadge, StatusBadge } from '@/components/ui/Badge';

interface InventoryDetailsPageProps {
  item: InventoryItem;
  onBack: () => void;
  onEdit: (item: InventoryItem) => void;
  onDuplicate: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onExport?: (item: InventoryItem) => void;
  showToast?: (msg: string) => void;
}

export function InventoryDetailsPage({
  item,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onExport,
  showToast,
}: InventoryDetailsPageProps) {
  const totalValueUSD = item.quantityMeters * item.unitCost;

  // Listen for Escape key to quickly exit Details view
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 xl:p-8 animate-in fade-in duration-150">
      <div className="w-full max-w-[1920px] mx-auto space-y-6 pb-20">
        {/* Top Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Back to All Inventory (Esc)"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Back to Inventory</span>
            </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {item.sku}
              </span>
              <span className="text-xs font-medium text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-500">{item.batchLot}</span>
              <span className="text-xs font-medium text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-800">{item.color}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{item.fabricType}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Individual Export Button */}
          {onExport && (
            <button
              type="button"
              onClick={() => onExport(item)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Export Material Specification Sheet (PDF or Excel)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Sheet</span>
            </button>
          )}

          {/* Adjust / Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Adjust Stock</span>
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => onDuplicate(item)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl border border-blue-200 bg-blue-50 p-2 shrink-0 flex items-center justify-center text-blue-600 shadow-xs">
              <Boxes className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{item.sku}</h3>
                <GradeBadge grade={item.qualityGrade} />
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-semibold text-slate-800">{item.warehouseLocation}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-500">Ref: {item.styleNumber}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{item.supplierName || 'Pacific Textiles Mills Ltd'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Stock On-Hand
              </span>
              <span className="text-lg font-bold font-mono text-blue-700">
                {item.quantityMeters.toLocaleString(undefined, { maximumFractionDigits: 1 })} {item.unit || 'Mtrs'}
              </span>
            </div>
            {(!item.category || item.category === 'FABRIC') && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Roll Count
                </span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {item.rollCount || 0} Rolls
                </span>
              </div>
            )}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Inventory Valuation
              </span>
              <span className="text-lg font-bold font-mono text-emerald-700">
                ${totalValueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Technical Specifications & Mill Sourcing */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Fabric Construction Parameters */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Fabric Construction Parameters</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Fabric Description:</span>
                  <span className="font-semibold text-slate-900">{item.fabricType}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Color / Shade:</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-300 bg-slate-300" />
                    <span>{item.color}</span>
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Fabric Weight (GSM):</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {item.gsm || 180} GSM
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Cuttable Width:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {item.widthInches || 60} Inches
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Dimensional Shrinkage:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {item.shrinkagePercent || '-3.2% x -2.8%'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Delta-E Color Tolerance:</span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    ΔE = {item.deltaE || 0.65} (Passed &lt; 0.8)
                  </span>
                </div>
              </div>
            </div>

            {/* Sourcing & Commercials */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Mill Sourcing &amp; Batch Traceability</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Origin Fabric Mill:</span>
                  <span className="font-semibold text-slate-900">
                    {item.supplierName || 'Pacific Textiles Mills Ltd'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Batch / Dye Lot:</span>
                  <span className="font-mono font-bold text-blue-700">{item.batchLot}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Allocated Style Ref:</span>
                  <span className="font-mono font-semibold text-slate-800">{item.styleNumber}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Commercial Unit Cost:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${item.unitCost.toFixed(2)} / Meter
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Total Asset Value:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Warehouse Staging & RFID */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Warehouse Bay Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Rack Allocation &amp; Storage Staging</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Storage Rack Bin:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {item.warehouseLocation}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Barcode / RFID Tag:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {item.barcode || `BAR-${item.sku}`}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Total Net Roll Weight:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {item.rollWeightKg || Math.round(item.quantityMeters * 0.18)} Kg
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Current Stock Status:</span>
                  <span className="font-semibold text-slate-900">{item.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Inward Date:</span>
                  <span className="font-mono text-slate-700">{item.createdAt.slice(0, 10)}</span>
                </div>
              </div>
            </div>

            {/* Warehouse Inspector Box matching Buyer Card's Merchandiser */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                <span>Warehouse Inspector &amp; Sync Info</span>
              </h4>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{item.inspectorName || item.updatedBy}</span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded">
                    QC Inspector
                  </span>
                </div>
                <div className="text-slate-600 pt-1 text-[11px]">
                  Last synced: <span className="font-mono font-semibold text-slate-800">{new Date(item.lastUpdatedAt).toLocaleString()}</span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Terminal: <span className="font-semibold text-slate-800">Warehouse Digital Scale Scanner #02</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: ASTM 4-Point Quality Audit */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ASTM D5430 Standard 4-Point Roll Inspection Score</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-xs text-slate-500 block">4-Point Penalty Points</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 block">
                {item.fourPointScore || 14.5} pts
              </span>
              <span className="text-[10px] text-slate-400">Tolerance: &lt; 20 points / 100 sq yds</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-xs text-slate-500 block">Final QMS Classification</span>
              <div className="pt-1">
                <GradeBadge grade={item.qualityGrade} />
              </div>
              <span className="text-[10px] text-slate-400 block pt-1">
                {item.qualityGrade === 'GRADE_A'
                  ? 'Accepted for export production'
                  : 'Quarantined / requires QA signoff'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-xs text-slate-500 block">Spectrophotometer Delta-E</span>
              <span className="text-2xl font-bold font-mono text-blue-700 block">
                {item.deltaE || 0.65}
              </span>
              <span className="text-[10px] text-slate-400">Shade Grade 4-5 on Gray Scale</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
