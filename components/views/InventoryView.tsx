'use client';

import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Edit,
  Copy,
  Trash2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Sliders,
  ShieldAlert,
  Layers,
  Archive,
  BarChart3,
  PieChart,
  DollarSign,
  Search,
  Filter,
  Eye,
  User,
  Tag,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Scissors,
  Factory,
  Package,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { GradeBadge, StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import {
  InventoryItem,
  MaterialCategory,
  QualityGrade,
  StockStatus,
  ReceiveRecord,
  IssueRecord,
} from '@/lib/types/erp';
import {
  INITIAL_INVENTORY,
  INITIAL_RECEIVE_REGISTRY,
  INITIAL_ISSUE_REGISTRY,
} from '@/lib/db/mock-data';
import { BuyerOrder, SubSupplier } from '@/lib/types/modules';
import { MOCK_BUYER_ORDERS, MOCK_SUB_SUPPLIERS } from '@/lib/db/modules-mock-data';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { AddInventoryModal } from '../modules/inventory/AddInventoryModal';
import { InventoryDetailsPage } from '../modules/inventory/InventoryDetailsPage';
import { ReceiveMaterialModal } from '../modules/inventory/ReceiveMaterialModal';
import { IssueMaterialModal } from '../modules/inventory/IssueMaterialModal';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';

interface InventoryViewProps {
  items?: InventoryItem[];
  orders?: BuyerOrder[];
  subSuppliers?: SubSupplier[];
  onOpenStockAdjust?: (item: InventoryItem) => void;
  onBatchGradeUpdate?: (ids: string[], grade: QualityGrade) => Promise<void>;
  onAddNewItem?: () => void;
  onReceiveRecord?: (record: ReceiveRecord, itemUpdate?: Partial<InventoryItem>) => void;
}

type InventorySubView =
  | { type: 'none' }
  | { type: 'details'; item: InventoryItem };

const CATEGORY_LABELS: Record<MaterialCategory, { label: string; color: string; bg: string; border: string }> = {
  FABRIC: { label: 'Fabric (Knit/Woven)', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  SEWING_THREAD: { label: 'Sewing Thread', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  TRIMS_BUTTONS: { label: 'Trims & Buttons', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ZIPPERS: { label: 'Zippers & Metal', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  INTERLINING_ELASTIC: { label: 'Interlining & Elastic', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  LABELS_PACKAGING: { label: 'Labels & Packaging', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  CHEMICALS_DYES: { label: 'Chemicals & Dyes', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export function InventoryView({
  items: initialItems,
  orders = MOCK_BUYER_ORDERS,
  subSuppliers = MOCK_SUB_SUPPLIERS,
  onOpenStockAdjust,
  onBatchGradeUpdate,
  onAddNewItem,
  onReceiveRecord,
}: InventoryViewProps) {
  // 4 Tabs: summary, stock (Master Ledger), receive (GRN), issue (SIV)
  const [viewMode, setViewMode] = useState<'summary' | 'stock' | 'receive' | 'issue'>('summary');
  
  // Active state ledgers
  const [items, setItems] = useState<InventoryItem[]>(initialItems && initialItems.length > 0 ? initialItems : INITIAL_INVENTORY);
  const [receiveRecords, setReceiveRecords] = useState<ReceiveRecord[]>(INITIAL_RECEIVE_REGISTRY);
  const [issueRecords, setIssueRecords] = useState<IssueRecord[]>(INITIAL_ISSUE_REGISTRY);

  const { user, permissions } = useErpAuth();

  // Sub-view: Detailed single-item view
  const [inventorySubView, setInventorySubView] = useState<InventorySubView>({ type: 'none' });

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [itemToIssue, setItemToIssue] = useState<InventoryItem | null>(null);

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    items: InventoryItem[];
  } | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | MaterialCategory>('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Floating Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync prop changes if parent updates
  React.useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [initialItems]);

  // --- HANDLER: INWARD RECEIVE MATERIAL (GRN) ---
  const handleReceiveMaterial = (newRecord: ReceiveRecord, itemUpdate?: Partial<InventoryItem>) => {
    setReceiveRecords((prev) => [newRecord, ...prev]);

    // Update or add to stock items
    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex((i) => i.id === newRecord.itemId || i.sku === newRecord.sku);
      if (existingIdx >= 0) {
        const existing = prevItems[existingIdx];
        const updatedQty = existing.quantityMeters + newRecord.receivedQty;
        const updatedRolls = (existing.rollCount || 0) + (newRecord.rollsReceived || 0);

        const updated: InventoryItem = {
          ...existing,
          quantityMeters: updatedQty,
          rollCount: updatedRolls,
          lastUpdatedAt: new Date().toISOString(),
          updatedBy: newRecord.receivedBy,
          warehouseLocation: newRecord.warehouseLocation || existing.warehouseLocation,
          qualityGrade: newRecord.qualityGrade || existing.qualityGrade,
          poNumber: newRecord.poNumber || existing.poNumber,
          styleNumber: newRecord.styleNumber || existing.styleNumber,
          buyerOrderId: newRecord.buyerOrderId || existing.buyerOrderId,
          buyerName: newRecord.buyerName || existing.buyerName,
          bomItemId: newRecord.bomItemId || existing.bomItemId,
        };

        const list = [...prevItems];
        list[existingIdx] = updated;
        return list;
      } else {
        // Create brand new item in inventory
        const newItem: InventoryItem = {
          id: newRecord.itemId || `inv-${Date.now()}`,
          sku: newRecord.sku,
          category: newRecord.category,
          styleNumber: newRecord.styleNumber || newRecord.poNumber || 'GENERAL-STOCK',
          fabricType: newRecord.itemName,
          color: 'Standard',
          batchLot: newRecord.batchLot,
          rollCount: newRecord.rollsReceived || 0,
          quantityMeters: newRecord.receivedQty,
          unit: newRecord.unit,
          qualityGrade: newRecord.qualityGrade,
          warehouseLocation: newRecord.warehouseLocation,
          status: 'IN_STOCK',
          unitCost: itemUpdate?.unitCost || 3.0,
          updatedBy: newRecord.receivedBy,
          lastUpdatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          supplierName: newRecord.supplierName,
          poNumber: newRecord.poNumber,
          buyerOrderId: newRecord.buyerOrderId,
          buyerName: newRecord.buyerName,
          bomItemId: newRecord.bomItemId,
        };
        return [newItem, ...prevItems];
      }
    });

    onReceiveRecord?.(newRecord, itemUpdate);

    showToast(`✓ Inwarded ${newRecord.receivedQty} ${newRecord.unit} under ${newRecord.grnNumber}`);
  };

  // --- HANDLER: ISSUE MATERIAL TO FLOOR (SIV) ---
  const handleIssueMaterial = (newSiv: IssueRecord, updatedItem: InventoryItem) => {
    setIssueRecords((prev) => [newSiv, ...prev]);

    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    );

    if (inventorySubView.type === 'details' && inventorySubView.item.id === updatedItem.id) {
      setInventorySubView({ type: 'details', item: updatedItem });
    }

    showToast(`✓ Issued ${newSiv.issuedQty} ${newSiv.unit} to ${newSiv.departmentDetail} (${newSiv.sivNumber})`);
  };

  // --- HANDLER: SAVE / EDIT ITEM ---
  const handleSaveItem = (itemData: Partial<InventoryItem>) => {
    if (itemToEdit) {
      const updated = items.map((i) =>
        i.id === itemToEdit.id ? ({ ...i, ...itemData, lastUpdatedAt: new Date().toISOString() } as InventoryItem) : i
      );
      setItems(updated);
      if (inventorySubView.type === 'details' && inventorySubView.item.id === itemToEdit.id) {
        setInventorySubView({
          type: 'details',
          item: { ...inventorySubView.item, ...itemData, lastUpdatedAt: new Date().toISOString() } as InventoryItem,
        });
      }
      showToast(`Updated material SKU ${itemData.sku}`);
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now().toString().slice(-4)}`,
        sku: itemData.sku || `RAW-${Math.floor(100 + Math.random() * 900)}`,
        category: itemData.category || 'FABRIC',
        styleNumber: itemData.styleNumber || 'GENERAL-PO',
        fabricType: itemData.fabricType || 'Raw Material Item',
        color: itemData.color || 'Standard',
        batchLot: itemData.batchLot || `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
        rollCount: itemData.rollCount || 0,
        quantityMeters: itemData.quantityMeters || 1000,
        unit: itemData.unit || 'Meters',
        qualityGrade: itemData.qualityGrade || 'GRADE_A',
        warehouseLocation: itemData.warehouseLocation || 'WH-R01-B01',
        status: itemData.status || 'IN_STOCK',
        unitCost: itemData.unitCost || 3.5,
        updatedBy: user?.name || 'Rafiqul Islam',
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        supplierName: itemData.supplierName || 'Pacific Textiles Mills Ltd',
        poNumber: itemData.poNumber,
        buyerOrderId: itemData.buyerOrderId,
        buyerName: itemData.buyerName,
        bomItemId: itemData.bomItemId,
      };
      setItems([newItem, ...items]);
      showToast(`Added raw material SKU ${newItem.sku}`);
    }
  };

  // --- HANDLER: DELETE CONFIRMATION ---
  const confirmDeleteItems = () => {
    if (!deleteModal) return;
    const idsToDelete = new Set(deleteModal.items.map((i) => i.id));
    setItems(items.filter((i) => !idsToDelete.has(i.id)));
    if (inventorySubView.type === 'details' && idsToDelete.has(inventorySubView.item.id)) {
      setInventorySubView({ type: 'none' });
    }
    showToast(`Deleted ${deleteModal.items.length} raw material items`);
    setDeleteModal(null);
  };

  // Filtered Stock Ledger Items
  const filteredStockItems = items.filter((i) => {
    if (categoryFilter !== 'ALL' && (i.category || 'FABRIC') !== categoryFilter) return false;
    if (gradeFilter !== 'ALL' && i.qualityGrade !== gradeFilter) return false;
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    return true;
  });

  // KPI Metrics Calculation
  const totalSKUs = items.length;
  const totalValuationUSD = items.reduce((sum, i) => sum + i.quantityMeters * i.unitCost, 0);
  const totalInwardQty = receiveRecords.reduce((sum, r) => sum + r.receivedQty, 0);
  const totalIssuedQty = issueRecords.reduce((sum, r) => sum + r.issuedQty, 0);
  const holdCount = items.filter((i) => i.qualityGrade === 'ON_HOLD' || i.qualityGrade === 'REJECTED').length;

  // Batch actions on Stock Ledger
  const batchActions: BatchAction<InventoryItem>[] = [
    {
      label: 'Update Grade to A (Pass)',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      variant: 'default',
      onClick: async (selected: InventoryItem[]) => {
        const ids = selected.map((s) => s.id);
        if (onBatchGradeUpdate) {
          await onBatchGradeUpdate(ids, 'GRADE_A');
        }
        setItems(items.map((i) => (ids.includes(i.id) ? { ...i, qualityGrade: 'GRADE_A' } : i)));
        showToast(`Updated ${ids.length} items to Grade A`);
      },
    },
    {
      label: 'Hold for Mill Inspection',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      variant: 'danger',
      onClick: async (selected: InventoryItem[]) => {
        const ids = selected.map((s) => s.id);
        if (onBatchGradeUpdate) {
          await onBatchGradeUpdate(ids, 'ON_HOLD');
        }
        setItems(items.map((i) => (ids.includes(i.id) ? { ...i, qualityGrade: 'ON_HOLD' } : i)));
        showToast(`Placed ${ids.length} items On Hold`);
      },
    },
    {
      label: 'Delete Selected',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      variant: 'danger',
      onClick: (selected: InventoryItem[]) => {
        setDeleteModal({ isOpen: true, items: selected });
      },
    },
  ];

  // Stock Ledger Table Columns matching Buyer & Order design
  const stockColumns: ColumnDef<InventoryItem>[] = [
    {
      key: 'sku',
      header: 'Material & SKU',
      sortable: true,
      render: (i) => {
        const cat = i.category || 'FABRIC';
        const catInfo = CATEGORY_LABELS[cat] || { label: cat, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' };

        return (
          <div className="flex items-start gap-3 py-1">
            <div className="w-10 h-10 rounded-xl border border-blue-200 bg-blue-50/70 p-1 shrink-0 flex items-center justify-center text-blue-600 shadow-2xs mt-0.5">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="min-w-0 max-w-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-700 uppercase">
                  {i.sku}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}>
                  {catInfo.label}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate mt-0.5" title={i.fabricType}>
                {i.fabricType}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full border border-slate-300 bg-slate-300 shrink-0" />
                <span>{i.color}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-[10px]">Lot: {i.batchLot}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'styleNumber',
      header: 'Order / Mill Ref',
      sortable: true,
      render: (i) => (
        <div className="text-xs space-y-0.5">
          <div className="font-mono font-bold text-slate-800">{i.styleNumber}</div>
          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
            {i.supplierName || 'Pacific Textiles Mills Ltd'}
          </div>
        </div>
      ),
    },
    {
      key: 'quantityMeters',
      header: 'On-Hand Stock',
      sortable: true,
      render: (i) => {
        const unit = i.unit || 'Meters';
        const isFabric = !i.category || i.category === 'FABRIC';

        return (
          <div className="text-xs">
            <div className="font-mono font-bold text-blue-700 text-sm">
              {i.quantityMeters.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
              <span className="text-xs font-semibold text-slate-600 font-sans">{unit}</span>
            </div>
            {isFabric && i.rollCount > 0 ? (
              <span className="text-[10px] text-slate-500 font-mono block">
                {i.rollCount} Rolls Staged
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 font-medium block">
                Ready for Floor
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'warehouseLocation',
      header: 'Storage Location',
      sortable: true,
      render: (i) => (
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-mono font-semibold text-slate-800">{i.warehouseLocation}</span>
        </div>
      ),
    },
    {
      key: 'unitCost',
      header: 'Valuation ($ USD)',
      sortable: true,
      render: (i) => {
        const total = i.quantityMeters * i.unitCost;
        return (
          <div className="text-xs">
            <div className="font-mono font-bold text-emerald-700">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              @ ${i.unitCost.toFixed(2)} / {i.unit || 'm'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'qualityGrade',
      header: 'Grade & QC',
      sortable: true,
      render: (i) => <GradeBadge grade={i.qualityGrade} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (i) => (
        <div className="flex items-center gap-1.5 justify-end">
          {/* Quick Issue Button */}
          <button
            type="button"
            onClick={() => {
              setItemToIssue(i);
              setIsIssueModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors cursor-pointer"
            title="Issue to Floor (SIV)"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Issue</span>
          </button>

          {/* View Specs Button */}
          <button
            type="button"
            onClick={() => setInventorySubView({ type: 'details', item: i })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="View Specifications"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => {
              setItemToEdit(i);
              setIsAddEditModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Modify Stock Item"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, items: [i] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Receive Register (GRN) Table Columns
  const receiveColumns: ColumnDef<ReceiveRecord>[] = [
    {
      key: 'grnNumber',
      header: 'GRN # & Date',
      sortable: true,
      render: (r) => (
        <div className="text-xs">
          <div className="font-mono font-bold text-blue-700">{r.grnNumber}</div>
          <div className="text-[11px] text-slate-500">{r.date}</div>
        </div>
      ),
    },
    {
      key: 'supplierName',
      header: 'Supplier & Challan',
      sortable: true,
      render: (r) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900">{r.supplierName}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Challan: {r.challanNumber} • PO: {r.poNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'itemName',
      header: 'Raw Material Item',
      sortable: true,
      render: (r) => {
        const catInfo = CATEGORY_LABELS[r.category] || { label: r.category, bg: 'bg-slate-100', color: 'text-slate-700', border: 'border-slate-200' };
        return (
          <div className="text-xs max-w-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-800">{r.sku}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}>
                {catInfo.label}
              </span>
            </div>
            <div className="text-slate-600 truncate mt-0.5">{r.itemName}</div>
          </div>
        );
      },
    },
    {
      key: 'receivedQty',
      header: 'Quantity Inwarded',
      sortable: true,
      render: (r) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-emerald-700 text-sm">
            +{r.receivedQty.toLocaleString()} {r.unit}
          </span>
          {r.rollsReceived && (
            <span className="block text-[10px] text-slate-500 font-mono">
              ({r.rollsReceived} Rolls / Lot: {r.batchLot})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'qcStatus',
      header: 'QC Inspection',
      sortable: true,
      render: (r) => {
        const isPassed = r.qcStatus === 'PASSED';
        const isQuarantine = r.qcStatus === 'QUARANTINE';
        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isPassed
                  ? 'bg-emerald-100 text-emerald-800'
                  : isQuarantine
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {r.qcStatus}
            </span>
            <GradeBadge grade={r.qualityGrade} />
          </div>
        );
      },
    },
    {
      key: 'warehouseLocation',
      header: 'Bay & Receiver',
      sortable: true,
      render: (r) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{r.warehouseLocation}</span>
          </div>
          <div className="text-[10px] text-slate-400">By: {r.receivedBy.split(' ')[0]}</div>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Remarks',
      render: (r) => (
        <div className="text-xs text-slate-600 truncate max-w-[200px]" title={r.notes}>
          {r.notes || 'Inspection passed with 0 defects.'}
        </div>
      ),
    },
  ];

  // Issue Register (SIV) Table Columns
  const issueColumns: ColumnDef<IssueRecord>[] = [
    {
      key: 'sivNumber',
      header: 'SIV # & Date',
      sortable: true,
      render: (s) => (
        <div className="text-xs">
          <div className="font-mono font-bold text-amber-800">{s.sivNumber}</div>
          <div className="text-[11px] text-slate-500">{s.date}</div>
        </div>
      ),
    },
    {
      key: 'departmentDetail',
      header: 'Destination Floor / Line',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            {s.issuedTo === 'CUTTING_FLOOR' ? (
              <Scissors className="w-3.5 h-3.5" />
            ) : (
              <Factory className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900">{s.departmentDetail}</div>
            <div className="text-[10px] text-slate-500 font-mono">Req: {s.requisitionNumber}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'styleNumber',
      header: 'Buyer Order / Style',
      sortable: true,
      render: (s) => (
        <div className="text-xs">
          <div className="font-mono font-bold text-blue-700">{s.poNumber}</div>
          <div className="text-[11px] text-slate-500">Style: {s.styleNumber}</div>
        </div>
      ),
    },
    {
      key: 'itemName',
      header: 'Material Issued',
      sortable: true,
      render: (s) => {
        const catInfo = CATEGORY_LABELS[s.category] || { label: s.category, bg: 'bg-slate-100', color: 'text-slate-700', border: 'border-slate-200' };
        return (
          <div className="text-xs max-w-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-800">{s.sku}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}>
                {catInfo.label}
              </span>
            </div>
            <div className="text-slate-600 truncate mt-0.5">{s.itemName}</div>
          </div>
        );
      },
    },
    {
      key: 'issuedQty',
      header: 'Quantity Issued',
      sortable: true,
      render: (s) => (
        <div className="text-xs font-mono font-bold text-amber-900 text-sm">
          -{s.issuedQty.toLocaleString()} {s.unit}
        </div>
      ),
    },
    {
      key: 'purpose',
      header: 'Operation Purpose',
      render: (s) => (
        <div className="text-xs text-slate-600 truncate max-w-[200px]" title={s.purpose}>
          {s.purpose}
        </div>
      ),
    },
    {
      key: 'receivedByFloor',
      header: 'Personnel Sign-Off',
      render: (s) => (
        <div className="text-xs text-slate-600">
          <div>Floor: <span className="font-semibold text-slate-900">{s.receivedByFloor.split(' ')[0]}</span></div>
          <div className="text-[10px] text-slate-400">Store: {s.issuedBy.split(' ')[0]}</div>
        </div>
      ),
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

      {/* TOP HEADER: 4-tab clean navigation matching Buyer & Order module */}
      <ModuleHeader
        title="Raw Material & Store Inventory"
        subtitle="Live multi-tier raw material ledger with Goods Received Note (GRN) inwarding & Floor Issue Voucher (SIV) tracking"
        activeView={inventorySubView.type !== 'none' ? 'stock' : viewMode}
        onViewChange={(mode) => {
          setInventorySubView({ type: 'none' });
          setViewMode(mode as any);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary', icon: BarChart3 },
          { id: 'stock', label: 'Stock Ledger', count: items.length, icon: Boxes },
          { id: 'receive', label: 'Receive Register (GRN)', count: receiveRecords.length, icon: ArrowDownLeft },
          { id: 'issue', label: 'Issue Register (SIV)', count: issueRecords.length, icon: ArrowUpRight },
        ]}
      />

      {/* SUB-PAGE: DEDICATED ITEM DETAILS */}
      {inventorySubView.type === 'details' ? (
        <InventoryDetailsPage
          item={inventorySubView.item}
          onBack={() => setInventorySubView({ type: 'none' })}
          onEdit={(itm) => {
            setItemToEdit(itm);
            setIsAddEditModalOpen(true);
          }}
          onDuplicate={(itm) => {
            handleSaveItem({
              ...itm,
              sku: `${itm.sku}-DUP`,
            });
            setInventorySubView({ type: 'none' });
          }}
          onDelete={(itm) => {
            setDeleteModal({ isOpen: true, items: [itm] });
          }}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 4 Stat Cards matching Buyer & Order tones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Material Valuation"
                  value={`$${(totalValuationUSD / 1000).toFixed(1)}k`}
                  subtitle={`${totalSKUs} Unique Raw Material SKUs`}
                  icon={DollarSign}
                  tone="blue"
                  delta={{ value: '+14.2%', isPositive: true }}
                />
                <StatCard
                  title="Total Inward GRN (MTD)"
                  value={`${(totalInwardQty / 1000).toFixed(1)}k Units`}
                  subtitle={`${receiveRecords.length} Supplier Deliveries Logged`}
                  icon={ArrowDownLeft}
                  tone="emerald"
                  delta={{ value: `${receiveRecords.length} GRNs`, isPositive: true }}
                />
                <StatCard
                  title="Total Issued to Floor (SIV)"
                  value={`${(totalIssuedQty / 1000).toFixed(1)}k Units`}
                  subtitle={`${issueRecords.length} Floor Requisitions Issued`}
                  icon={ArrowUpRight}
                  tone="indigo"
                  delta={{ value: `${issueRecords.length} SIVs`, isPositive: true }}
                />
                <StatCard
                  title="Quarantine & Quality Holds"
                  value={`${holdCount} Lots`}
                  subtitle="Testing or Mill Replacement"
                  icon={ShieldAlert}
                  tone="amber"
                  delta={{ value: `${holdCount} On Hold`, isPositive: false }}
                />
              </div>

              {/* RAW MATERIAL CATEGORIES BREAKDOWN */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Raw Material Categories in Stock
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Click category to filter in Stock Ledger
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {(
                    [
                      { id: 'FABRIC', label: 'Fabric (Knit/Woven)', icon: Layers },
                      { id: 'SEWING_THREAD', label: 'Sewing Thread', icon: Boxes },
                      { id: 'TRIMS_BUTTONS', label: 'Trims & Buttons', icon: Tag },
                      { id: 'ZIPPERS', label: 'Zippers', icon: Sparkles },
                      { id: 'INTERLINING_ELASTIC', label: 'Interlining & Elastic', icon: Scissors },
                      { id: 'LABELS_PACKAGING', label: 'Packaging & Labels', icon: Package },
                    ] as const
                  ).map((cat) => {
                    const catItems = items.filter((i) => (i.category || 'FABRIC') === cat.id);
                    const count = catItems.length;
                    const catValuation = catItems.reduce((s, i) => s + i.quantityMeters * i.unitCost, 0);

                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setCategoryFilter(cat.id);
                          setViewMode('stock');
                        }}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <cat.icon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                            {count} SKUs
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 leading-snug">
                          {cat.label}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 font-semibold">
                          ${(catValuation / 1000).toFixed(1)}k
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TWO SPLIT QUICK REGISTERS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Receipts (GRN) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Recent Material Receipts (GRN)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('receive')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      All GRNs ({receiveRecords.length}) →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {receiveRecords.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0 font-mono text-xs font-bold">
                            GRN
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {r.grnNumber} • {r.supplierName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {r.itemName} ({r.sku})
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold text-emerald-700 block">
                            +{r.receivedQty.toLocaleString()} {r.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{r.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Floor Issues (SIV) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Recent Factory Floor Issues (SIV)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('issue')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      All SIVs ({issueRecords.length}) →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {issueRecords.slice(0, 4).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 shrink-0 font-mono text-xs font-bold">
                            SIV
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {s.sivNumber} → {s.departmentDetail}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {s.itemName} • PO: {s.poNumber}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold text-amber-900 block">
                            -{s.issuedQty.toLocaleString()} {s.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{s.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STOCK LEDGER (MASTER INVENTORY BALANCE) */}
          {viewMode === 'stock' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Category Filter Pills Toolbar */}
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
                  All Raw Materials ({items.length})
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
                  const count = items.filter((i) => (i.category || 'FABRIC') === cat.id).length;
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

              {/* Master Stock DataTable with Search, Secondary Filters & Actions */}
              <DataTable
                id="warehouse-master-stock-ledger"
                data={filteredStockItems}
                columns={stockColumns}
                searchPlaceholder="Search SKU, raw material, lot#, color, or bay..."
                searchableKeys={['sku', 'fabricType', 'color', 'batchLot', 'warehouseLocation', 'styleNumber', 'supplierName']}
                secondaryAction={
                  <div className="flex items-center gap-2">
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="ALL">All Grades</option>
                      <option value="GRADE_A">Grade A (Export)</option>
                      <option value="GRADE_B">Grade B (Commercial)</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="IN_STOCK">In Stock</option>
                      <option value="ALLOCATED">Allocated</option>
                      <option value="INSPECTING">Inspecting</option>
                      <option value="DISPATCHED">Dispatched</option>
                    </select>
                  </div>
                }
                primaryAction={
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setItemToEdit(null);
                        setIsAddEditModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>+ Add Item</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setItemToIssue(null);
                        setIsIssueModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
                      <span>Issue (SIV)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsReceiveModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Receive Material (GRN)</span>
                    </button>
                  </div>
                }
                batchActions={batchActions}
              />
            </div>
          )}

          {/* TAB 3: RECEIVE REGISTER (GOODS RECEIVED NOTE - GRN) */}
          {viewMode === 'receive' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="warehouse-receive-grn-register"
                data={receiveRecords}
                columns={receiveColumns}
                searchPlaceholder="Search GRN number, supplier, challan, PO, or SKU..."
                searchableKeys={['grnNumber', 'supplierName', 'challanNumber', 'poNumber', 'sku', 'itemName', 'batchLot']}
                primaryAction={
                  <button
                    type="button"
                    onClick={() => setIsReceiveModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Inward Shipment (GRN)</span>
                  </button>
                }
              />
            </div>
          )}

          {/* TAB 4: ISSUE REGISTER (STORE ISSUE VOUCHER - SIV) */}
          {viewMode === 'issue' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="warehouse-issue-siv-register"
                data={issueRecords}
                columns={issueColumns}
                searchPlaceholder="Search SIV number, destination line, style, PO, or SKU..."
                searchableKeys={['sivNumber', 'departmentDetail', 'poNumber', 'styleNumber', 'requisitionNumber', 'sku', 'itemName']}
                primaryAction={
                  <button
                    type="button"
                    onClick={() => {
                      setItemToIssue(null);
                      setIsIssueModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Issue to Floor (SIV)</span>
                  </button>
                }
              />
            </div>
          )}
        </>
      )}

      {/* RECEIVE MATERIAL MODAL (GRN) */}
      <ReceiveMaterialModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        onReceive={handleReceiveMaterial}
        existingItems={items}
        orders={orders}
        subSuppliers={subSuppliers}
      />

      {/* ISSUE MATERIAL MODAL (SIV) */}
      <IssueMaterialModal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setItemToIssue(null);
        }}
        onIssue={handleIssueMaterial}
        items={items}
        preselectedItem={itemToIssue}
      />

      {/* ADD / EDIT ITEM MODAL */}
      <AddInventoryModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
        initialData={itemToEdit}
        orders={orders}
        subSuppliers={subSuppliers}
      />

      {/* DELETE CONFIRMATION MODAL matching Buyer & Order module */}
      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title={deleteModal.items.length > 1 ? 'Delete Stock Items' : 'Delete Stock Item'}
          itemTypeLabel="raw material stock item"
          confirmLabel={deleteModal.items.length > 1 ? 'Delete Stock Items' : 'Delete Stock Item'}
          items={deleteModal.items.map((i) => ({
            id: i.id,
            title: `${i.sku} (${i.color})`,
            subtitle: `${i.fabricType} • ${i.warehouseLocation}`,
            value: `${i.quantityMeters} ${i.unit || 'm'}`,
          }))}
          onConfirm={confirmDeleteItems}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
