'use client';

import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Copy,
  Plus,
  PieChart,
  BarChart3,
  ShieldCheck,
  Search,
  Filter,
  LayoutGrid,
  List,
  Building2,
  Boxes,
  Tag,
  Scissors,
  Sparkles,
  Package,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { GradeBadge, StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { IncomingQCLot } from '@/lib/types/modules';
import { MOCK_INCOMING_QC } from '@/lib/db/modules-mock-data';
import { InventoryItem, MaterialCategory, QualityGrade } from '@/lib/types/erp';
import { INITIAL_INVENTORY } from '@/lib/db/mock-data';
import { AddInspectionModal } from '../modules/incoming-qc/AddInspectionModal';
import { IncomingQcDetailsPage } from '../modules/incoming-qc/IncomingQcDetailsPage';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';

interface IncomingQcViewProps {
  inventoryItems?: InventoryItem[];
  onUpdateInventoryItem?: (item: InventoryItem) => void;
}

type QcSubView =
  | { type: 'none' }
  | { type: 'details'; lot: IncomingQCLot };

const CATEGORY_MAP: Record<MaterialCategory, { label: string; bg: string; color: string; border: string }> = {
  FABRIC: { label: 'Fabric (Knit/Woven)', bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-200' },
  SEWING_THREAD: { label: 'Sewing Thread', bg: 'bg-indigo-50', color: 'text-indigo-700', border: 'border-indigo-200' },
  TRIMS_BUTTONS: { label: 'Trims & Buttons', bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-200' },
  ZIPPERS: { label: 'Zippers', bg: 'bg-purple-50', color: 'text-purple-700', border: 'border-purple-200' },
  INTERLINING_ELASTIC: { label: 'Interlining & Elastic', bg: 'bg-teal-50', color: 'text-teal-700', border: 'border-teal-200' },
  LABELS_PACKAGING: { label: 'Packaging & Labels', bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200' },
  CHEMICALS_DYES: { label: 'Chemicals & Dyes', bg: 'bg-rose-50', color: 'text-rose-700', border: 'border-rose-200' },
};

export function IncomingQcView({
  inventoryItems: initialInventory = INITIAL_INVENTORY,
  onUpdateInventoryItem,
}: IncomingQcViewProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'list' | 'cards'>('summary');
  const [lots, setLots] = useState<IncomingQCLot[]>(MOCK_INCOMING_QC);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);

  // Sub-view: Detailed single QC certificate view
  const [qcSubView, setQcSubView] = useState<QcSubView>({ type: 'none' });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lotToEdit, setLotToEdit] = useState<IncomingQCLot | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    items: IncomingQCLot[];
  } | null>(null);

  // Card view type
  const [cardViewType, setCardViewType] = useState<'grid' | 'table'>('grid');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | MaterialCategory>('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [cardSearch, setCardSearch] = useState('');

  // Floating Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync inventory prop
  React.useEffect(() => {
    if (initialInventory && initialInventory.length > 0) {
      setInventory(initialInventory);
    }
  }, [initialInventory]);

  // Handler: Save or Update Inspection
  const handleSaveInspection = (savedLot: IncomingQCLot, syncToInventory: boolean = true) => {
    if (lotToEdit) {
      setLots((prev) => prev.map((l) => (l.id === lotToEdit.id ? savedLot : l)));
      if (qcSubView.type === 'details' && qcSubView.lot.id === lotToEdit.id) {
        setQcSubView({ type: 'details', lot: savedLot });
      }
      showToast(`Updated inspection certificate for ${savedLot.lotNumber}`);
    } else {
      setLots((prev) => [savedLot, ...prev]);
      showToast(`Logged new incoming QC certificate for ${savedLot.lotNumber}`);
    }

    // Sync Quality Grade to linked Inventory item
    if (syncToInventory && savedLot.inventoryItemId) {
      const itemToUpdate = inventory.find(
        (i) => i.id === savedLot.inventoryItemId || i.sku === savedLot.inventorySku
      );
      if (itemToUpdate) {
        const updatedItem: InventoryItem = {
          ...itemToUpdate,
          qualityGrade: savedLot.qualityGradeAssigned,
          status: savedLot.result === 'ACCEPTED' ? 'IN_STOCK' : 'INSPECTING',
          lastUpdatedAt: new Date().toISOString(),
          updatedBy: savedLot.inspectorName,
        };

        setInventory((prev) =>
          prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        );

        if (onUpdateInventoryItem) {
          onUpdateInventoryItem(updatedItem);
        }
      }
    }
  };

  // Quick Action: Change status (Approve or Hold)
  const handleQuickStatusChange = (lot: IncomingQCLot, newResult: 'ACCEPTED' | 'REJECTED') => {
    const newGrade: QualityGrade = newResult === 'ACCEPTED' ? 'GRADE_A' : 'ON_HOLD';
    const updatedLot: IncomingQCLot = {
      ...lot,
      result: newResult,
      qualityGradeAssigned: newGrade,
    };

    setLots((prev) => prev.map((l) => (l.id === lot.id ? updatedLot : l)));
    if (qcSubView.type === 'details') {
      setQcSubView({ type: 'details', lot: updatedLot });
    }

    // Sync to inventory item
    if (lot.inventoryItemId) {
      const itemToUpdate = inventory.find((i) => i.id === lot.inventoryItemId);
      if (itemToUpdate) {
        const updatedItem: InventoryItem = {
          ...itemToUpdate,
          qualityGrade: newGrade,
          status: newResult === 'ACCEPTED' ? 'IN_STOCK' : 'INSPECTING',
          lastUpdatedAt: new Date().toISOString(),
        };
        setInventory((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
        if (onUpdateInventoryItem) onUpdateInventoryItem(updatedItem);
      }
    }

    showToast(`Inspection ${lot.lotNumber} marked as ${newResult.replace('_', ' ')} (Grade: ${newGrade})`);
  };

  // Delete Action
  const confirmDelete = () => {
    if (!deleteModal) return;
    const ids = new Set(deleteModal.items.map((i) => i.id));
    setLots((prev) => prev.filter((l) => !ids.has(l.id)));
    if (qcSubView.type === 'details' && ids.has(qcSubView.lot.id)) {
      setQcSubView({ type: 'none' });
    }
    showToast(`Deleted ${deleteModal.items.length} inspection records`);
    setDeleteModal(null);
  };

  // Filtered lots
  const filteredLots = lots.filter((l) => {
    if (categoryFilter !== 'ALL' && l.materialCategory !== categoryFilter) return false;
    if (resultFilter !== 'ALL' && l.result !== resultFilter) return false;
    return true;
  });

  const cardFilteredLots = filteredLots.filter((l) => {
    if (!cardSearch.trim()) return true;
    const q = cardSearch.toLowerCase();
    return (
      l.lotNumber.toLowerCase().includes(q) ||
      l.supplierName.toLowerCase().includes(q) ||
      (l.materialName && l.materialName.toLowerCase().includes(q)) ||
      (l.inventorySku && l.inventorySku.toLowerCase().includes(q))
    );
  });

  // KPI calculations
  const totalLots = lots.length;
  const acceptedCount = lots.filter((l) => l.result === 'ACCEPTED').length;
  const rejectedCount = lots.filter((l) => l.result === 'REJECTED').length;
  const passRate = totalLots > 0 ? Math.round((acceptedCount / totalLots) * 100) : 0;

  // Columns for DataTable
  const columns: ColumnDef<IncomingQCLot>[] = [
    {
      key: 'lotNumber',
      header: 'Lot # & Date',
      sortable: true,
      render: (item) => (
        <div className="py-1">
          <span className="font-mono font-bold text-blue-700 text-xs">{item.lotNumber}</span>
          <div className="text-[11px] text-slate-500">{item.inspectionDate}</div>
        </div>
      ),
    },
    {
      key: 'materialCategory',
      header: 'Material & SKU',
      sortable: true,
      render: (item) => {
        const catInfo = CATEGORY_MAP[item.materialCategory] || {
          label: item.materialCategory,
          bg: 'bg-slate-100',
          color: 'text-slate-700',
          border: 'border-slate-200',
        };

        return (
          <div className="max-w-xs text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}>
                {catInfo.label}
              </span>
              {item.inventorySku && (
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  {item.inventorySku}
                </span>
              )}
            </div>
            <div className="text-slate-900 font-semibold truncate mt-0.5" title={item.materialName}>
              {item.materialName || item.lotNumber}
            </div>
          </div>
        );
      },
    },
    {
      key: 'supplierName',
      header: 'Mill / Supplier',
      sortable: true,
      render: (item) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900">{item.supplierName}</span>
          {item.poNumber && (
            <div className="text-[10px] font-mono text-slate-500">PO: {item.poNumber}</div>
          )}
        </div>
      ),
    },
    {
      key: 'receivedQuantity',
      header: 'Inward / Inspected',
      sortable: true,
      render: (item) => (
        <div className="text-xs font-mono">
          <div className="font-bold text-slate-900">
            {item.inspectedQuantity.toLocaleString()} {item.unit}
          </div>
          <div className="text-[10px] text-slate-400">
            of {item.receivedQuantity.toLocaleString()} {item.unit}
          </div>
        </div>
      ),
    },
    {
      key: 'inspectionMethod',
      header: 'Test Protocol & Result',
      sortable: true,
      render: (item) => {
        const cat = item.materialCategory;
        return (
          <div className="text-xs">
            {cat === 'FABRIC' && (
              <div>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                    (item.pointsPer100SqYd || 0) <= 28
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {item.pointsPer100SqYd || 0} pts/100yd
                </span>
                <span className="block text-[10px] text-slate-400">Limit: 28 pts</span>
              </div>
            )}
            {cat === 'SEWING_THREAD' && (
              <div>
                <span className="font-mono font-bold text-blue-700">
                  {item.tensileStrengthCndtex || 38.5} cN/dtex
                </span>
                <span className="block text-[10px] text-slate-400">
                  {item.sewabilityBreaksPer100m === 0 ? '0 Breaks / 100m' : `${item.sewabilityBreaksPer100m} Breaks`}
                </span>
              </div>
            )}
            {cat === 'ZIPPERS' && (
              <div>
                <span className="font-mono font-bold text-purple-700">
                  {item.chainCrosswiseStrengthN || 440} N Chain
                </span>
                <span className="block text-[10px] text-slate-400">
                  Lock: {item.sliderLockStrengthN || 80} N
                </span>
              </div>
            )}
            {cat === 'TRIMS_BUTTONS' && (
              <div>
                <span className="font-mono font-bold text-amber-700">
                  {item.pullForceNewtons || 110} N Pull
                </span>
                <span className="block text-[10px] text-slate-400">Req: ≥ 90 N (10s)</span>
              </div>
            )}
            {cat === 'INTERLINING_ELASTIC' && (
              <div>
                <span className="font-mono font-bold text-teal-700">
                  {item.fusingPeelStrengthN5cm || 15.6} N/5cm
                </span>
                <span className="block text-[10px] text-slate-400">
                  Recovery: {item.elasticRecoveryPercent || 95}%
                </span>
              </div>
            )}
            {cat === 'LABELS_PACKAGING' && (
              <div>
                <span className="font-mono font-bold text-emerald-700">
                  {item.burstingStrengthKpa || 1450} kPa
                </span>
                <span className="block text-[10px] text-slate-400">
                  Barcode: Grade {item.barcodeGrade || 'A'}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'result',
      header: 'QC Verdict',
      sortable: true,
      render: (item) => {
        const isPass = item.result === 'ACCEPTED';
        const isQuarantine = item.result === 'REJECTED';
        return (
          <div className="space-y-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isPass
                  ? 'bg-emerald-100 text-emerald-800'
                  : isQuarantine
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {item.result.replace('_', ' ')}
            </span>
            <div className="block">
              <GradeBadge grade={item.qualityGradeAssigned || 'GRADE_A'} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'inspectorName',
      header: 'Inspector',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">{item.inspectorName}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={() => setQcSubView({ type: 'details', lot: item })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="View QC Certificate"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setLotToEdit(item);
              setIsAddModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Inspection"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, items: [item] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions on Table
  const batchActions: BatchAction<IncomingQCLot>[] = [
    {
      label: 'Approve & Release to Warehouse',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      variant: 'default',
      onClick: (selected) => {
        const ids = new Set(selected.map((s) => s.id));
        setLots((prev) =>
          prev.map((l) => (ids.has(l.id) ? { ...l, result: 'ACCEPTED', qualityGradeAssigned: 'GRADE_A' } : l))
        );
        showToast(`Approved & released ${selected.length} lots to bulk warehouse`);
      },
    },
    {
      label: 'Quarantine Selected',
      icon: <XCircle className="w-3.5 h-3.5" />,
      variant: 'danger',
      onClick: (selected) => {
        const ids = new Set(selected.map((s) => s.id));
        setLots((prev) =>
          prev.map((l) => (ids.has(l.id) ? { ...l, result: 'REJECTED', qualityGradeAssigned: 'ON_HOLD' } : l))
        );
        showToast(`Quarantined ${selected.length} lots for mill replacement`);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification matching Buyer & Order module */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Clean 3-tab layout matching Buyer & Order module */}
      <ModuleHeader
        title="Incoming Quality Control (IQC)"
        subtitle="Raw fabric ASTM D5430 4-point frames, thread tensile sewability, zipper durability, and trims testing with live inventory synchronization"
        activeView={qcSubView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setQcSubView({ type: 'none' });
          setViewMode(mode as any);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary', icon: BarChart3 },
          { id: 'list', label: 'Inspection Register', count: lots.length, icon: FileSpreadsheet },
          { id: 'cards', label: 'Inspection Cards', count: lots.length, icon: LayoutGrid },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGE IF ACTIVE */}
      {qcSubView.type === 'details' ? (
        <IncomingQcDetailsPage
          lot={qcSubView.lot}
          onBack={() => setQcSubView({ type: 'none' })}
          onEdit={(l) => {
            setLotToEdit(l);
            setIsAddModalOpen(true);
          }}
          onQuickStatusChange={handleQuickStatusChange}
          inventoryItem={inventory.find((i) => i.id === qcSubView.lot.inventoryItemId)}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* StatCards matching Buyer & Order module tones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Inward Lots"
                  value={totalLots}
                  subtitle="Fabrics, Threads, Trims, Zippers"
                  icon={Layers}
                  tone="blue"
                  delta={{ value: '+18.5%', isPositive: true }}
                />
                <StatCard
                  title="ASTM Pass Rate"
                  value={`${passRate}%`}
                  subtitle={`${acceptedCount} Lots Passed to Cutting`}
                  icon={CheckCircle2}
                  tone="emerald"
                  delta={{ value: `${passRate}%`, isPositive: true }}
                />
                <StatCard
                  title="Quarantine & Rejections"
                  value={rejectedCount}
                  subtitle="Held for Mill Credit Note"
                  icon={XCircle}
                  tone="rose"
                  delta={{ value: `${rejectedCount} Rejects`, isPositive: false }}
                />
                <StatCard
                  title="Avg ASTM Defect Score"
                  value="16.2 pts"
                  subtitle="Per 100 Sq Yd (Limit: 28 pts)"
                  icon={AlertTriangle}
                  tone="amber"
                  delta={{ value: '-3.2 pts', isPositive: true }}
                />
              </div>

              {/* MATERIAL-SPECIFIC TESTING PROTOCOLS OVERVIEW */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Standard Inspection Protocols by Material Category
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Open Inspection Matrix →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      cat: 'FABRIC' as MaterialCategory,
                      title: 'Fabric (Knit / Woven)',
                      method: 'ASTM D5430 (4-Point System)',
                      limit: 'Penalty points ≤ 28 pts/100 sq.yd, ΔE ≤ 0.8, Bowing < 3%',
                      icon: Layers,
                      color: 'text-blue-600',
                      bg: 'bg-blue-50/50',
                    },
                    {
                      cat: 'SEWING_THREAD' as MaterialCategory,
                      title: 'Sewing Thread',
                      method: 'ASTM D204 / ISO 2062',
                      limit: 'Tensile force ≥ 35 cN/dtex, 0 breaks at 5,000 RPM run',
                      icon: Boxes,
                      color: 'text-indigo-600',
                      bg: 'bg-indigo-50/50',
                    },
                    {
                      cat: 'ZIPPERS' as MaterialCategory,
                      title: 'Zippers & Fasteners',
                      method: 'ASTM D2061 / BS 3084',
                      limit: 'Chain strength ≥ 350 N, Slider lock ≥ 60 N, 500 open/close cycles',
                      icon: Sparkles,
                      color: 'text-purple-600',
                      bg: 'bg-purple-50/50',
                    },
                    {
                      cat: 'TRIMS_BUTTONS' as MaterialCategory,
                      title: 'Buttons & Rivets',
                      method: 'ASTM F963 / 16 CFR 1500',
                      limit: '90 N (21 lbs) 10-second pull test, Impact shatter resistance',
                      icon: Tag,
                      color: 'text-amber-600',
                      bg: 'bg-amber-50/50',
                    },
                    {
                      cat: 'INTERLINING_ELASTIC' as MaterialCategory,
                      title: 'Interlining & Elastic',
                      method: 'DIN 54310 / ISO 6330',
                      limit: 'Fusing peel bond ≥ 12.0 N/5cm, Elastic recovery ≥ 92%',
                      icon: Scissors,
                      color: 'text-teal-600',
                      bg: 'bg-teal-50/50',
                    },
                    {
                      cat: 'LABELS_PACKAGING' as MaterialCategory,
                      title: 'Packaging & Labels',
                      method: 'TAPPI T810 / ISO 2248',
                      limit: 'Carton burst ≥ 1200 kPa, 10-point drop test, Barcode Grade A/B',
                      icon: Package,
                      color: 'text-emerald-600',
                      bg: 'bg-emerald-50/50',
                    },
                  ].map((p) => {
                    const count = lots.filter((l) => l.materialCategory === p.cat).length;
                    return (
                      <div
                        key={p.cat}
                        onClick={() => {
                          setCategoryFilter(p.cat);
                          setViewMode('list');
                        }}
                        className={`p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer space-y-2 ${p.bg}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p.icon className={`w-4 h-4 ${p.color}`} />
                            <span className="text-xs font-bold text-slate-900">{p.title}</span>
                          </div>
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                            {count} Lots
                          </span>
                        </div>
                        <div className="font-mono text-[11px] font-semibold text-blue-700">{p.method}</div>
                        <p className="text-[11px] text-slate-500 leading-snug">{p.limit}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INSPECTION OUTCOMES BREAKDOWN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        QC Inspection Verdict Distribution
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Live Lots</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[11px] text-emerald-800 font-semibold block">Passed & Released</span>
                      <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{acceptedCount} Lots</div>
                      <span className="text-[10px] text-slate-500 font-mono">{passRate}% Pass Rate</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100">
                      <span className="text-[11px] text-rose-800 font-semibold block">Quarantined / Rejected</span>
                      <div className="text-xl font-bold font-mono text-rose-900 mt-1">{rejectedCount} Lots</div>
                      <span className="text-[10px] text-slate-500 font-mono">Held for Debit Notes</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Material Category Distribution
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Queue</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {Object.keys(CATEGORY_MAP).map((categoryKey) => {
                      const cKey = categoryKey as MaterialCategory;
                      const count = lots.filter((l) => l.materialCategory === cKey).length;
                      if (count === 0) return null;
                      const pct = Math.round((count / (lots.length || 1)) * 100);

                      return (
                        <div key={cKey} className="space-y-1">
                          <div className="flex justify-between text-slate-700 text-xs">
                            <span className="font-semibold">{CATEGORY_MAP[cKey]?.label || cKey}</span>
                            <span className="font-mono text-slate-500">{count} lots ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSPECTION REGISTER (DATATABLE) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Material Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    categoryFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Materials ({lots.length})
                </button>
                {(
                  [
                    { id: 'FABRIC', label: 'Fabric' },
                    { id: 'SEWING_THREAD', label: 'Sewing Thread' },
                    { id: 'TRIMS_BUTTONS', label: 'Trims & Buttons' },
                    { id: 'ZIPPERS', label: 'Zippers' },
                    { id: 'INTERLINING_ELASTIC', label: 'Interlining & Elastic' },
                    { id: 'LABELS_PACKAGING', label: 'Packaging & Labels' },
                  ] as const
                ).map((cat) => {
                  const count = lots.filter((l) => l.materialCategory === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                        categoryFilter === cat.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              <DataTable
                id="incoming-qc-register-table"
                data={filteredLots}
                columns={columns}
                searchPlaceholder="Search lot number, supplier mill, material, or SKU..."
                searchableKeys={['lotNumber', 'supplierName', 'materialName', 'inventorySku', 'inspectorName']}
                secondaryAction={
                  <select
                    value={resultFilter}
                    onChange={(e) => setResultFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Verdicts</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="CONDITIONAL_ACCEPT">Conditional Accept</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => {
                      setLotToEdit(null);
                      setIsAddModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Inspection</span>
                  </button>
                }
                batchActions={batchActions}
              />
            </div>
          )}

          {/* TAB 3: INSPECTION CARDS */}
          {viewMode === 'cards' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Toolbar matching Buyer & Order module */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search lot, material, supplier, or SKU..."
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="FABRIC">Fabric</option>
                    <option value="SEWING_THREAD">Sewing Thread</option>
                    <option value="ZIPPERS">Zippers</option>
                    <option value="TRIMS_BUTTONS">Trims & Buttons</option>
                    <option value="INTERLINING_ELASTIC">Interlining & Elastic</option>
                    <option value="LABELS_PACKAGING">Packaging & Labels</option>
                  </select>

                  <select
                    value={resultFilter}
                    onChange={(e) => setResultFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                  >
                    <option value="ALL">All Verdicts</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="CONDITIONAL_ACCEPT">Conditional</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLotToEdit(null);
                      setIsAddModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Inspection</span>
                  </button>
                </div>
              </div>

              {/* Cards Grid matching Buyer & Order styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {cardFilteredLots.map((lot) => {
                  const catInfo = CATEGORY_MAP[lot.materialCategory] || {
                    label: lot.materialCategory,
                    bg: 'bg-slate-50',
                    color: 'text-slate-700',
                    border: 'border-slate-200',
                  };
                  const isPass = lot.result === 'ACCEPTED';

                  return (
                    <div
                      key={lot.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl border border-blue-200 bg-blue-50 p-1 shrink-0 flex items-center justify-center text-blue-600 shadow-2xs">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="font-mono text-[10px] font-bold text-blue-700 uppercase">
                                {lot.lotNumber}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 leading-snug truncate max-w-[180px]">
                                {lot.materialName || lot.materialCategory}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Ref: <span className="font-mono font-semibold text-slate-700">{lot.inventorySku || 'N/A'}</span>
                              </p>
                            </div>
                          </div>

                          <GradeBadge grade={lot.qualityGradeAssigned || 'GRADE_A'} />
                        </div>

                        {/* Test Protocol Metrics Box */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Protocol:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {lot.inspectionMethod.split('_')[0]} {lot.inspectionMethod.split('_')[1] || ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Primary Reading:</span>
                            <span className="font-mono font-bold text-blue-700">
                              {lot.materialCategory === 'FABRIC' && `${lot.pointsPer100SqYd || 0} pts`}
                              {lot.materialCategory === 'SEWING_THREAD' && `${lot.tensileStrengthCndtex || 0} cN`}
                              {lot.materialCategory === 'ZIPPERS' && `${lot.chainCrosswiseStrengthN || 0} N`}
                              {lot.materialCategory === 'TRIMS_BUTTONS' && `${lot.pullForceNewtons || 0} N`}
                              {lot.materialCategory === 'INTERLINING_ELASTIC' && `${lot.fusingPeelStrengthN5cm || 0} N`}
                              {lot.materialCategory === 'LABELS_PACKAGING' && `${lot.burstingStrengthKpa || 0} kPa`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Observed Flaws:</span>
                            <span className="font-mono font-bold text-slate-700">{lot.defectCount} Defects</span>
                          </div>
                        </div>

                        {/* Mill Chip */}
                        <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-700 truncate">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate font-medium">{lot.supplierName}</span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {lot.result}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions matching Buyer & Order module */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-[10px] text-slate-500 font-mono">
                          QC: {lot.inspectorName.split(' ')[0]}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setLotToEdit(lot);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, items: [lot] })}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setQcSubView({ type: 'details', lot })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>View Certificate</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ADD / EDIT INSPECTION MODAL */}
      <AddInspectionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setLotToEdit(null);
        }}
        onSave={handleSaveInspection}
        inventoryItems={inventory}
        initialData={lotToEdit}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title={deleteModal.items.length > 1 ? 'Delete QC Inspections' : 'Delete QC Inspection'}
          itemTypeLabel="inspection certificate"
          confirmLabel={deleteModal.items.length > 1 ? 'Delete Inspections' : 'Delete Inspection'}
          items={deleteModal.items.map((i) => ({
            id: i.id,
            title: `${i.lotNumber} (${i.materialCategory})`,
            subtitle: `${i.supplierName} • ${i.materialName || i.inspectionMethod}`,
            value: `${i.result} (${i.qualityGradeAssigned || 'GRADE_A'})`,
          }))}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
