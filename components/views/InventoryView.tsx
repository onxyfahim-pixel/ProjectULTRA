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
  Clock,
  Sparkles,
  FileDown,
  ShieldCheck,
  XCircle,
  X,
  Check,
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
import { useModulePermission } from '@/hooks/use-module-permission';
import {
  trackEntityCreate,
  trackEntityUpdate,
  trackEntityDelete,
} from '@/lib/services/audit-trail-service';
import { AddInventoryModal } from '../modules/inventory/AddInventoryModal';
import { InventoryDetailsPage } from '../modules/inventory/InventoryDetailsPage';
import { ReceiveMaterialModal } from '../modules/inventory/ReceiveMaterialModal';
import { IssueMaterialModal } from '../modules/inventory/IssueMaterialModal';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';
import {
  InventoryExportModal,
  InventoryRegisterTab,
} from '../modules/inventory/InventoryExportModal';
import {
  InventorySingleExportModal,
  InventorySingleExportTarget,
} from '../modules/inventory/InventorySingleExportModal';

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
  
  // Active state ledgers with localStorage persistence
  const [items, setItems] = useState<InventoryItem[]>(initialItems && initialItems.length > 0 ? initialItems : INITIAL_INVENTORY);
  const [receiveRecords, setReceiveRecords] = useState<ReceiveRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_inventory_receive_records');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return INITIAL_RECEIVE_REGISTRY;
  });
  const [issueRecords, setIssueRecords] = useState<IssueRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_inventory_issue_records');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return INITIAL_ISSUE_REGISTRY;
  });

  // Sync to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_inventory_receive_records', JSON.stringify(receiveRecords));
    }
  }, [receiveRecords]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_inventory_issue_records', JSON.stringify(issueRecords));
    }
  }, [issueRecords]);

  const { user, permissions } = useErpAuth();
  const { canCreate, canEdit, canDelete, canExport, canApprove } = useModulePermission('inventory');

  // Approval Modal State
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    type: 'receive' | 'issue';
    record: ReceiveRecord | IssueRecord;
  } | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  const openApprovalDialog = (type: 'receive' | 'issue', record: ReceiveRecord | IssueRecord) => {
    setApprovalModal({ isOpen: true, type, record });
    setApprovalDecision(record.approvalStatus === 'REJECTED' ? 'REJECTED' : 'APPROVED');
    setApprovalNotes(
      record.approvalNotes ||
        (type === 'receive'
          ? 'Physical fabric/raw material inspection passed. Authorized for inventory intake.'
          : 'Requisition verified against production line quota. Authorized for dispatch.')
    );
  };

  const handleProcessApproval = (
    type: 'receive' | 'issue',
    recordId: string,
    decision: 'APPROVED' | 'REJECTED',
    notes: string
  ) => {
    const approverName = user?.name || 'Authorized Supervisor';
    const approverId = user?.id || 'usr_auth';
    const approverRole = user?.role || 'QC Manager';
    const nowISO = new Date().toISOString();
    const formattedDate = nowISO.replace('T', ' ').substring(0, 16);

    if (type === 'receive') {
      setReceiveRecords((prev) =>
        prev.map((r) => {
          if (r.id === recordId) {
            const updated: ReceiveRecord = {
              ...r,
              approvalStatus: decision,
              approvedBy: approverName,
              approvedById: approverId,
              approvedByRole: approverRole,
              approvedAt: formattedDate,
              approvalNotes: notes || (decision === 'APPROVED' ? 'Approved for inventory receipt' : 'Rejected by authorized supervisor'),
            };
            trackEntityUpdate(
              'INVENTORY_RECEIVE',
              r.id,
              r.grnNumber,
              r,
              updated,
              {
                userName: approverName,
                userRole: approverRole,
                userId: approverId,
                summary: `${decision === 'APPROVED' ? 'Approved' : 'Rejected'} Inward GRN ${r.grnNumber} (${r.itemName})`,
              }
            );
            return updated;
          }
          return r;
        })
      );
      showToast(`✓ Inward GRN transaction ${decision === 'APPROVED' ? 'Approved' : 'Rejected'} by ${approverName} (${approverRole})`);
    } else {
      setIssueRecords((prev) =>
        prev.map((s) => {
          if (s.id === recordId) {
            const updated: IssueRecord = {
              ...s,
              approvalStatus: decision,
              approvedBy: approverName,
              approvedById: approverId,
              approvedByRole: approverRole,
              approvedAt: formattedDate,
              approvalNotes: notes || (decision === 'APPROVED' ? 'Approved for production floor dispatch' : 'Rejected by authorized supervisor'),
            };
            trackEntityUpdate(
              'INVENTORY_ISSUE',
              s.id,
              s.sivNumber,
              s,
              updated,
              {
                userName: approverName,
                userRole: approverRole,
                userId: approverId,
                summary: `${decision === 'APPROVED' ? 'Approved' : 'Rejected'} SIV Issue ${s.sivNumber} to ${s.departmentDetail}`,
              }
            );
            return updated;
          }
          return s;
        })
      );
      showToast(`✓ Store Issue SIV transaction ${decision === 'APPROVED' ? 'Approved' : 'Rejected'} by ${approverName} (${approverRole})`);
    }

    setApprovalModal(null);
  };

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

  // Global & Individual Export states
  const [isGlobalExportModalOpen, setIsGlobalExportModalOpen] = useState(false);
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
  const [selectedReceiveIds, setSelectedReceiveIds] = useState<string[]>([]);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);

  const [isSingleExportModalOpen, setIsSingleExportModalOpen] = useState(false);
  const [singleExportTarget, setSingleExportTarget] = useState<InventorySingleExportTarget | null>(null);

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
      const updatedItem = { ...itemToEdit, ...itemData, lastUpdatedAt: new Date().toISOString() } as InventoryItem;
      const updated = items.map((i) =>
        i.id === itemToEdit.id ? updatedItem : i
      );
      setItems(updated);
      trackEntityUpdate(
        'INVENTORY',
        itemToEdit.id,
        itemToEdit.sku,
        itemToEdit,
        updatedItem,
        {
          userName: user?.name || 'Warehouse Officer',
          userRole: user?.role || 'INVENTORY_MANAGER',
          userId: user?.id,
          summary: `Updated inventory item ${itemToEdit.sku} (${itemToEdit.fabricType})`,
        }
      );
      if (inventorySubView.type === 'details' && inventorySubView.item.id === itemToEdit.id) {
        setInventorySubView({
          type: 'details',
          item: updatedItem,
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
      trackEntityCreate(
        'INVENTORY',
        newItem.id,
        newItem.sku,
        newItem,
        {
          userName: user?.name || newItem.updatedBy || 'Warehouse Officer',
          userRole: user?.role || 'INVENTORY_MANAGER',
          userId: user?.id,
          summary: `Added new raw material ${newItem.sku} (${newItem.fabricType}) - Qty: ${newItem.quantityMeters} ${newItem.unit}`,
        }
      );
      showToast(`Added raw material SKU ${newItem.sku}`);
    }
  };

  // --- HANDLER: DELETE CONFIRMATION ---
  const confirmDeleteItems = () => {
    if (!deleteModal) return;
    const idsToDelete = new Set(deleteModal.items.map((i) => i.id));
    for (const item of deleteModal.items) {
      trackEntityDelete(
        'INVENTORY',
        item.id,
        item.sku,
        item,
        {
          userName: user?.name || 'Warehouse Officer',
          userRole: user?.role || 'INVENTORY_MANAGER',
          userId: user?.id,
          summary: `Deleted raw material ${item.sku} (${item.fabricType})`,
        }
      );
    }
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
      label: 'Export Selected (PDF/Excel)',
      icon: <FileDown className="w-3.5 h-3.5" />,
      onClick: (selected: InventoryItem[]) => {
        setSelectedStockIds(selected.map((s) => s.id));
        setIsGlobalExportModalOpen(true);
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

  // Stock Ledger Table Columns with reduced gaps and tight fit
  const stockColumns: ColumnDef<InventoryItem>[] = [
    {
      key: 'sku',
      header: 'Material & SKU',
      sortable: true,
      width: '230px',
      render: (i) => {
        const cat = i.category || 'FABRIC';
        const catInfo = CATEGORY_LABELS[cat] || { label: cat, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' };

        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg border border-blue-200 bg-blue-50/80 shrink-0 flex items-center justify-center text-blue-600 shadow-2xs">
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-700 uppercase whitespace-nowrap">
                  {i.sku}
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${catInfo.bg} ${catInfo.color} ${catInfo.border} whitespace-nowrap`}>
                  {catInfo.label}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate max-w-[170px]" title={i.fabricType}>
                {i.fabricType}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 whitespace-nowrap">
                <span>{i.color}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono">Lot: {i.batchLot}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'styleNumber',
      header: 'Order / Mill',
      sortable: true,
      width: '130px',
      render: (i) => (
        <div className="text-xs space-y-0.5 min-w-0">
          <div className="font-mono font-bold text-slate-800 truncate" title={i.styleNumber}>{i.styleNumber}</div>
          <div className="text-[10px] text-slate-500 truncate max-w-[125px]" title={i.supplierName}>
            {i.supplierName || 'Pacific Textiles'}
          </div>
        </div>
      ),
    },
    {
      key: 'quantityMeters',
      header: 'On-Hand Stock',
      sortable: true,
      width: '110px',
      render: (i) => {
        const unit = i.unit || 'Meters';
        const isFabric = !i.category || i.category === 'FABRIC';

        return (
          <div className="text-xs whitespace-nowrap">
            <div className="font-mono font-bold text-blue-700">
              {i.quantityMeters.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
              <span className="text-[10px] font-semibold text-slate-600 font-sans">{unit}</span>
            </div>
            {isFabric && i.rollCount > 0 ? (
              <span className="text-[10px] text-slate-500 font-mono block">
                {i.rollCount} Rolls
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 font-medium block">
                Ready
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'warehouseLocation',
      header: 'Location',
      sortable: true,
      width: '100px',
      render: (i) => (
        <div className="flex items-center gap-1 text-xs whitespace-nowrap">
          <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
          <span className="font-mono font-semibold text-slate-800">{i.warehouseLocation}</span>
        </div>
      ),
    },
    {
      key: 'unitCost',
      header: 'Valuation',
      sortable: true,
      width: '105px',
      render: (i) => {
        const total = i.quantityMeters * i.unitCost;
        return (
          <div className="text-xs whitespace-nowrap">
            <div className="font-mono font-bold text-emerald-700">
              ${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              @${i.unitCost.toFixed(1)}/{i.unit?.slice(0, 1) || 'm'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'qualityGrade',
      header: 'Grade',
      sortable: true,
      width: '90px',
      render: (i) => <GradeBadge grade={i.qualityGrade} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '95px',
      render: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '155px',
      align: 'right',
      render: (i) => (
        <div className="flex items-center gap-1 justify-end">
          {/* Quick Issue Button */}
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setItemToIssue(i);
                setIsIssueModalOpen(true);
              }}
              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
              title="Issue to Floor (SIV)"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* View Specs Button */}
          <button
            type="button"
            onClick={() => setInventorySubView({ type: 'details', item: i })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="View Specifications"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Individual Export Button (PDF or Excel) */}
          {canExport && (
            <button
              type="button"
              onClick={() => {
                const linkedGrns = receiveRecords.filter(
                  (r) => r.sku === i.sku || (r.batchLot && r.batchLot === i.batchLot)
                );
                const linkedIssues = issueRecords.filter((s) => s.sku === i.sku);
                setSingleExportTarget({
                  type: 'stock',
                  item: i,
                  linkedGrns,
                  linkedIssues,
                });
                setIsSingleExportModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
              title="Export Item Record (PDF or Excel)"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Edit Button */}
          {canEdit && (
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
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleteModal({ isOpen: true, items: [i] })}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete Item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Receive Register (GRN) Table Columns with compact widths
  const receiveColumns: ColumnDef<ReceiveRecord>[] = [
    {
      key: 'grnNumber',
      header: 'GRN # & Date',
      sortable: true,
      width: '110px',
      render: (r) => (
        <div className="text-xs">
          <div className="font-mono font-bold text-blue-700">{r.grnNumber}</div>
          <div className="text-[10px] text-slate-500">{r.date}</div>
        </div>
      ),
    },
    {
      key: 'supplierName',
      header: 'Supplier & Challan',
      sortable: true,
      width: '160px',
      render: (r) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-900 truncate max-w-[150px]" title={r.supplierName}>{r.supplierName}</div>
          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
            Ch: {r.challanNumber} • PO: {r.poNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'itemName',
      header: 'Material & SKU',
      sortable: true,
      width: '210px',
      render: (r) => {
        const catInfo = CATEGORY_LABELS[r.category] || { label: r.category, bg: 'bg-slate-100', color: 'text-slate-700', border: 'border-slate-200' };
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-800">{r.sku}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}>
                {catInfo.label}
              </span>
            </div>
            <div className="text-slate-600 truncate mt-0.5 max-w-[190px]" title={r.itemName}>{r.itemName}</div>
          </div>
        );
      },
    },
    {
      key: 'receivedQty',
      header: 'Inward Qty',
      sortable: true,
      width: '110px',
      render: (r) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-emerald-700">
            +{r.receivedQty.toLocaleString()} {r.unit}
          </span>
          {r.rollsReceived && (
            <span className="block text-[10px] text-slate-500 font-mono">
              {r.rollsReceived} Rolls • Lot: {r.batchLot}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'qcStatus',
      header: 'QC Inspection',
      sortable: true,
      width: '125px',
      render: (r) => {
        const isPassed = r.qcStatus === 'PASSED';
        const isQuarantine = r.qcStatus === 'QUARANTINE';
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
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
      header: 'Location & By',
      sortable: true,
      width: '110px',
      render: (r) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>{r.warehouseLocation}</span>
          </div>
          <div className="text-[10px] text-slate-400">By: {r.receivedBy.split(' ')[0]}</div>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Remarks',
      width: '140px',
      render: (r) => (
        <div className="text-xs text-slate-600 truncate max-w-[130px]" title={r.notes}>
          {r.notes || 'Inspection passed with 0 defects.'}
        </div>
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Approval Status',
      sortable: true,
      width: '140px',
      render: (r) => {
        const isApproved = r.approvalStatus === 'APPROVED';
        const isRejected = r.approvalStatus === 'REJECTED';
        return (
          <div className="text-xs">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : isRejected
                  ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : isRejected ? (
                <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
              ) : (
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              )}
              {r.approvalStatus || 'PENDING'}
            </span>
            <div
              className="text-[10px] text-slate-500 truncate mt-0.5 max-w-[130px]"
              title={r.approvedBy ? `Approved by ${r.approvedBy} (${r.approvedByRole || 'Auth'}) on ${r.approvedAt || 'N/A'}` : 'Pending Authorization'}
            >
              {r.approvedBy ? (
                <span className="font-semibold text-slate-700 dark:text-slate-300">By: {r.approvedBy.split(' ')[0]}</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium">Needs Approval</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '105px',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {canApprove && (
            <button
              type="button"
              onClick={() => openApprovalDialog('receive', r)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                r.approvalStatus === 'APPROVED'
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : r.approvalStatus === 'REJECTED'
                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300 ring-2 ring-amber-400/30 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
              title={
                r.approvalStatus === 'APPROVED'
                  ? `Approved by ${r.approvedBy || 'Admin'}. Click to re-review decision`
                  : `Review & Authorize Inward GRN ${r.grnNumber}`
              }
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          )}

          {canExport && (
            <button
              type="button"
              onClick={() => {
                const matched = items.find((i) => i.sku === r.sku);
                setSingleExportTarget({ type: 'receive', record: r, matchedItem: matched });
                setIsSingleExportModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
              title="Export GRN (PDF or Excel)"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Issue Register (SIV) Table Columns with compact widths
  const issueColumns: ColumnDef<IssueRecord>[] = [
    {
      key: 'sivNumber',
      header: 'SIV # & Date',
      sortable: true,
      width: '110px',
      render: (s) => (
        <div className="text-xs">
          <div className="font-mono font-bold text-amber-800">{s.sivNumber}</div>
          <div className="text-[10px] text-slate-500">{s.date}</div>
        </div>
      ),
    },
    {
      key: 'departmentDetail',
      header: 'Floor / Line',
      sortable: true,
      width: '150px',
      render: (s) => (
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            {s.issuedTo === 'CUTTING_FLOOR' ? (
              <Scissors className="w-3 h-3" />
            ) : (
              <Factory className="w-3 h-3" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate max-w-[110px]" title={s.departmentDetail}>{s.departmentDetail}</div>
            <div className="text-[10px] text-slate-500 font-mono">Req: {s.requisitionNumber}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'styleNumber',
      header: 'Order / Style',
      sortable: true,
      width: '120px',
      render: (s) => (
        <div className="text-xs">
          <div className="font-mono font-bold text-blue-700">{s.poNumber}</div>
          <div className="text-[10px] text-slate-500">Style: {s.styleNumber}</div>
        </div>
      ),
    },
    {
      key: 'itemName',
      header: 'Material & SKU',
      sortable: true,
      width: '210px',
      render: (s) => {
        const catInfo = CATEGORY_LABELS[s.category] || { label: s.category, bg: 'bg-slate-100', color: 'text-slate-700', border: 'border-slate-200' };
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-800">{s.sku}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}>
                {catInfo.label}
              </span>
            </div>
            <div className="text-slate-600 truncate mt-0.5 max-w-[190px]" title={s.itemName}>{s.itemName}</div>
          </div>
        );
      },
    },
    {
      key: 'issuedQty',
      header: 'Issued Qty',
      sortable: true,
      width: '110px',
      render: (s) => (
        <div className="text-xs font-mono font-bold text-amber-900">
          -{s.issuedQty.toLocaleString()} {s.unit}
        </div>
      ),
    },
    {
      key: 'purpose',
      header: 'Purpose',
      width: '130px',
      render: (s) => (
        <div className="text-xs text-slate-600 truncate max-w-[120px]" title={s.purpose}>
          {s.purpose}
        </div>
      ),
    },
    {
      key: 'receivedByFloor',
      header: 'Sign-Off',
      width: '110px',
      render: (s) => (
        <div className="text-xs text-slate-600">
          <div>Floor: <span className="font-semibold text-slate-900">{s.receivedByFloor.split(' ')[0]}</span></div>
          <div className="text-[10px] text-slate-400">Store: {s.issuedBy.split(' ')[0]}</div>
        </div>
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Approval Status',
      sortable: true,
      width: '140px',
      render: (s) => {
        const isApproved = s.approvalStatus === 'APPROVED';
        const isRejected = s.approvalStatus === 'REJECTED';
        return (
          <div className="text-xs">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : isRejected
                  ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : isRejected ? (
                <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
              ) : (
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              )}
              {s.approvalStatus || 'PENDING'}
            </span>
            <div
              className="text-[10px] text-slate-500 truncate mt-0.5 max-w-[130px]"
              title={s.approvedBy ? `Approved by ${s.approvedBy} (${s.approvedByRole || 'Auth'}) on ${s.approvedAt || 'N/A'}` : 'Pending Authorization'}
            >
              {s.approvedBy ? (
                <span className="font-semibold text-slate-700 dark:text-slate-300">By: {s.approvedBy.split(' ')[0]}</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium">Needs Approval</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '105px',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          {canApprove && (
            <button
              type="button"
              onClick={() => openApprovalDialog('issue', s)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                s.approvalStatus === 'APPROVED'
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : s.approvalStatus === 'REJECTED'
                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300 ring-2 ring-amber-400/30 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
              title={
                s.approvalStatus === 'APPROVED'
                  ? `Approved by ${s.approvedBy || 'Admin'}. Click to re-review decision`
                  : `Review & Authorize SIV ${s.sivNumber}`
              }
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          )}

          {canExport && (
            <button
              type="button"
              onClick={() => {
                const matched = items.find((i) => i.sku === s.sku);
                setSingleExportTarget({ type: 'issue', record: s, matchedItem: matched });
                setIsSingleExportModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
              title="Export SIV (PDF or Excel)"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>
          )}
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

      {/* TOP HEADER: Clean navigation matching Buyer & Order module */}
      {inventorySubView.type !== 'details' && (
        <ModuleHeader
          title="All Inventory"
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
          actions={
            canExport ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedStockIds([]);
                  setSelectedReceiveIds([]);
                  setSelectedIssueIds([]);
                  setIsGlobalExportModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
                title="Global Export: Register Summary Sheet (PDF or Excel)"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Register</span>
              </button>
            ) : null
          }
        />
      )}

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
          onExport={(itm) => {
            const linkedGrns = receiveRecords.filter(
              (r) => r.sku === itm.sku || (r.batchLot && r.batchLot === itm.batchLot)
            );
            const linkedIssues = issueRecords.filter((s) => s.sku === itm.sku);
            setSingleExportTarget({
              type: 'stock',
              item: itm,
              linkedGrns,
              linkedIssues,
            });
            setIsSingleExportModalOpen(true);
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

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
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
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer space-y-2 group min-w-0"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <cat.icon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shrink-0 whitespace-nowrap">
                            {count} SKUs
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 leading-snug truncate" title={cat.label}>
                          {cat.label}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 font-semibold whitespace-nowrap">
                          ${(catValuation / 1000).toFixed(1)}k
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TWO SPLIT QUICK REGISTERS */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Receipts (GRN) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 min-w-0">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        Recent Material Receipts (GRN)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('receive')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      All GRNs ({receiveRecords.length}) →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {receiveRecords.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 gap-3"
                      >
                        <div className="min-w-0 flex items-center gap-2.5 sm:gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0 font-mono text-xs font-bold">
                            GRN
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate" title={`${r.grnNumber} • ${r.supplierName}`}>
                              {r.grnNumber} • {r.supplierName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate" title={`${r.itemName} (${r.sku})`}>
                              {r.itemName} ({r.sku})
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold text-emerald-700 block whitespace-nowrap">
                            +{r.receivedQty.toLocaleString()} {r.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block whitespace-nowrap">{r.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Floor Issues (SIV) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 min-w-0">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ArrowUpRight className="w-4 h-4 text-amber-600 shrink-0" />
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        Recent Factory Floor Issues (SIV)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('issue')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      All SIVs ({issueRecords.length}) →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {issueRecords.slice(0, 4).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 gap-3"
                      >
                        <div className="min-w-0 flex items-center gap-2.5 sm:gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 shrink-0 font-mono text-xs font-bold">
                            SIV
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate" title={`${s.sivNumber} → ${s.departmentDetail}`}>
                              {s.sivNumber} → {s.departmentDetail}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate" title={`${s.itemName} • PO: ${s.poNumber}`}>
                              {s.itemName} • PO: {s.poNumber}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold text-amber-900 block whitespace-nowrap">
                            -{s.issuedQty.toLocaleString()} {s.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block whitespace-nowrap">{s.date}</span>
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
                dense
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
                  canCreate ? (
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setItemToEdit(null);
                          setIsAddEditModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>+ Add Item</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setItemToIssue(null);
                          setIsIssueModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Issue (SIV)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsReceiveModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                        <span>Receive (GRN)</span>
                      </button>
                    </div>
                  ) : null
                }
                moduleKey="inventory"
                onExport={(exportItems) => {
                  setSelectedStockIds(exportItems.map((x) => x.id));
                  setIsGlobalExportModalOpen(true);
                }}
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
                dense
                searchPlaceholder="Search GRN number, supplier, challan, PO, or SKU..."
                searchableKeys={['grnNumber', 'supplierName', 'challanNumber', 'poNumber', 'sku', 'itemName', 'batchLot']}
                primaryAction={
                  canCreate ? (
                    <button
                      type="button"
                      onClick={() => setIsReceiveModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Inward Shipment (GRN)</span>
                    </button>
                  ) : null
                }
                moduleKey="inventory"
                onExport={(exportRecords) => {
                  setSelectedReceiveIds(exportRecords.map((r) => r.id));
                  setIsGlobalExportModalOpen(true);
                }}
                batchActions={[
                  {
                    label: 'Export Selected (PDF/Excel)',
                    icon: <FileDown className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      setSelectedReceiveIds(selected.map((r) => r.id));
                      setIsGlobalExportModalOpen(true);
                    },
                  },
                ]}
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
                dense
                searchPlaceholder="Search SIV number, destination line, style, PO, or SKU..."
                searchableKeys={['sivNumber', 'departmentDetail', 'poNumber', 'styleNumber', 'requisitionNumber', 'sku', 'itemName']}
                primaryAction={
                  canCreate ? (
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
                  ) : null
                }
                moduleKey="inventory"
                onExport={(exportRecords) => {
                  setSelectedIssueIds(exportRecords.map((s) => s.id));
                  setIsGlobalExportModalOpen(true);
                }}
                batchActions={[
                  {
                    label: 'Export Selected (PDF/Excel)',
                    icon: <FileDown className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      setSelectedIssueIds(selected.map((s) => s.id));
                      setIsGlobalExportModalOpen(true);
                    },
                  },
                ]}
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

      {/* GLOBAL REGISTER EXPORT MODAL: PDF / EXCEL */}
      <InventoryExportModal
        isOpen={isGlobalExportModalOpen}
        onClose={() => {
          setIsGlobalExportModalOpen(false);
          setSelectedStockIds([]);
          setSelectedReceiveIds([]);
          setSelectedIssueIds([]);
        }}
        activeRegister={
          viewMode === 'receive' ? 'receive' : viewMode === 'issue' ? 'issue' : 'stock'
        }
        stockItems={items}
        receiveRecords={receiveRecords}
        issueRecords={issueRecords}
        selectedStockIds={selectedStockIds}
        selectedReceiveIds={selectedReceiveIds}
        selectedIssueIds={selectedIssueIds}
      />

      {/* INDIVIDUAL RECORD EXPORT MODAL: Stock Item, GRN, or SIV */}
      <InventorySingleExportModal
        isOpen={isSingleExportModalOpen}
        onClose={() => {
          setIsSingleExportModalOpen(false);
          setSingleExportTarget(null);
        }}
        target={singleExportTarget}
      />

      {/* ========================================================================= */}
      {/* MODAL: INVENTORY TRANSACTION APPROVAL & AUTHORIZATION DIALOG               */}
      {/* ========================================================================= */}
      {approvalModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">
                    {approvalModal.type === 'receive'
                      ? `Authorize GRN: ${(approvalModal.record as ReceiveRecord).grnNumber}`
                      : `Authorize SIV: ${(approvalModal.record as IssueRecord).sivNumber}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    RBAC Authorized Multi-User Verification &amp; Store Approval
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setApprovalModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Approver Authorization & Identity Banner */}
            <div className="px-6 py-3 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Authorizing Officer:</strong> {user?.name || 'Administrator'} ({user?.role || 'Super Admin'})
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                <Check className="w-3 h-3 text-emerald-600" />
                RBAC Approved Role
              </span>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Creator check warning if the same user created it */}
              {(() => {
                const creator =
                  approvalModal.type === 'receive'
                    ? (approvalModal.record as ReceiveRecord).receivedBy
                    : (approvalModal.record as IssueRecord).issuedBy;
                const isSameUser =
                  Boolean(user?.name) &&
                  creator.toLowerCase().includes((user?.name || '').toLowerCase());

                if (isSameUser && !user?.isSuperAdmin && user?.role !== 'Super Admin' && user?.role !== 'ADMIN') {
                  return (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2.5 text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong>Dual-Authorization Policy:</strong> You originally logged this transaction. Standard warehouse controls require approval by a separate supervisor or manager. Super Admins may bypass.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Transaction Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {approvalModal.record.itemName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      SKU: {approvalModal.record.sku} &bull; PO: {approvalModal.record.poNumber || 'N/A'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold text-sm ${approvalModal.type === 'receive' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {approvalModal.type === 'receive'
                        ? `+${(approvalModal.record as ReceiveRecord).receivedQty} ${(approvalModal.record as ReceiveRecord).unit}`
                        : `-${(approvalModal.record as IssueRecord).issuedQty} ${(approvalModal.record as IssueRecord).unit}`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Date: {approvalModal.record.date}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      {approvalModal.type === 'receive' ? 'Supplier / Mill:' : 'Destination Floor:'}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {approvalModal.type === 'receive'
                        ? (approvalModal.record as ReceiveRecord).supplierName
                        : (approvalModal.record as IssueRecord).departmentDetail}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Logged By (Creator):</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {approvalModal.type === 'receive'
                        ? (approvalModal.record as ReceiveRecord).receivedBy
                        : (approvalModal.record as IssueRecord).issuedBy}
                    </span>
                  </div>
                </div>

                {approvalModal.record.approvedBy && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Current Decision:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {approvalModal.record.approvalStatus} by {approvalModal.record.approvedBy} ({approvalModal.record.approvedAt || 'N/A'})
                    </span>
                  </div>
                )}
              </div>

              {/* Decision Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  Select Authorization Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('APPROVED')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      approvalDecision === 'APPROVED'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve Transaction</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApprovalDecision('REJECTED')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      approvalDecision === 'REJECTED'
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 ring-2 ring-rose-500/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Reject Transaction</span>
                  </button>
                </div>
              </div>

              {/* Remarks / Notes Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Approval Remarks / Authorization Notes
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Enter remarks for the approval record and printable voucher..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setApprovalModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  handleProcessApproval(
                    approvalModal.type,
                    approvalModal.record.id,
                    approvalDecision,
                    approvalNotes
                  )
                }
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                  approvalDecision === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Confirm {approvalDecision === 'APPROVED' ? 'Approval' : 'Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
