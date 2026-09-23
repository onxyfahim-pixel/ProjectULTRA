'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  DollarSign,
  Calendar,
  CheckCircle2,
  Truck,
  Plus,
  Eye,
  X,
  Building2,
  ShieldCheck,
  Award,
  Globe,
  Mail,
  Phone,
  Search,
  Filter,
  Trash2,
  Clock,
  Layers,
  Edit,
  Copy,
  LayoutGrid,
  List,
  Package,
  Check,
  UserCheck,
  User,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { BuyerOrder, BuyerProfile } from '@/lib/types/modules';
import { MOCK_BUYER_ORDERS, MOCK_BUYER_PROFILES } from '@/lib/db/modules-mock-data';
import { BuyerOrderDetailsPage } from '../modules/buyer-order/BuyerOrderDetailsPage';
import { BuyerOrderAddPage } from '../modules/buyer-order/BuyerOrderAddPage';
import { BuyerOrderEditPage } from '../modules/buyer-order/BuyerOrderEditPage';
import { AddBuyerModal } from '../modules/buyer-order/AddBuyerModal';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';
import { ReceiveMaterialModal } from '../modules/inventory/ReceiveMaterialModal';
import { InventoryItem, ReceiveRecord } from '@/lib/types/erp';
import { INITIAL_INVENTORY, INITIAL_RECEIVE_REGISTRY } from '@/lib/db/mock-data';

export interface BuyerOrderViewProps {
  orders?: BuyerOrder[];
  onUpdateOrders?: (orders: BuyerOrder[]) => void;
  inventory?: InventoryItem[];
  receiveRecords?: ReceiveRecord[];
  onReceiveMaterial?: (record: ReceiveRecord, itemUpdate?: Partial<InventoryItem>) => void;
}

type OrderSubView =
  | { type: 'none' }
  | { type: 'details'; order: BuyerOrder }
  | { type: 'add' }
  | { type: 'edit'; order: BuyerOrder };

export function BuyerOrderView({
  orders: propOrders,
  onUpdateOrders,
  inventory: propInventory,
  receiveRecords: propReceiveRecords,
  onReceiveMaterial,
}: BuyerOrderViewProps = {}) {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [orders, setOrders] = useState<BuyerOrder[]>(propOrders && propOrders.length > 0 ? propOrders : MOCK_BUYER_ORDERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(propInventory && propInventory.length > 0 ? propInventory : INITIAL_INVENTORY);
  const [receiveRecords, setReceiveRecords] = useState<ReceiveRecord[]>(propReceiveRecords && propReceiveRecords.length > 0 ? propReceiveRecords : INITIAL_RECEIVE_REGISTRY);
  const [buyers, setBuyers] = useState<BuyerProfile[]>(MOCK_BUYER_PROFILES);

  // Sync prop changes
  React.useEffect(() => {
    if (propOrders && propOrders.length > 0) {
      setOrders(propOrders);
    }
  }, [propOrders]);

  React.useEffect(() => {
    if (propInventory && propInventory.length > 0) {
      setInventory(propInventory);
    }
  }, [propInventory]);

  React.useEffect(() => {
    if (propReceiveRecords && propReceiveRecords.length > 0) {
      setReceiveRecords(propReceiveRecords);
    }
  }, [propReceiveRecords]);

  // Dedicated Separate Pages for Orders (Details, Add, Edit)
  const [orderSubView, setOrderSubView] = useState<OrderSubView>({ type: 'none' });

  // Keep details page refreshed if order data updates
  React.useEffect(() => {
    if (orderSubView.type === 'details') {
      const refreshed = orders.find((o) => o.id === orderSubView.order.id);
      if (refreshed && refreshed !== orderSubView.order) {
        setOrderSubView({ type: 'details', order: refreshed });
      }
    }
  }, [orders]);

  // Inward Receive Modal State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [orderForReceiveModal, setOrderForReceiveModal] = useState<BuyerOrder | null>(null);

  // Delete Confirmation Modals
  const [orderDeleteModal, setOrderDeleteModal] = useState<{
    isOpen: boolean;
    orders: BuyerOrder[];
  } | null>(null);

  const [buyerDeleteModal, setBuyerDeleteModal] = useState<{
    isOpen: boolean;
    buyers: BuyerProfile[];
  } | null>(null);

  // Buyer modal state
  const [isAddBuyerOpen, setIsAddBuyerOpen] = useState(false);
  const [buyerToEdit, setBuyerToEdit] = useState<BuyerProfile | null>(null);
  const [selectedBuyerForModal, setSelectedBuyerForModal] = useState<BuyerProfile | null>(null);

  // Buyer View layout mode: Grid vs Table
  const [buyerViewType, setBuyerViewType] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderBuyerFilter, setOrderBuyerFilter] = useState('ALL');

  const [buyerSearch, setBuyerSearch] = useState('');
  const [buyerSegmentFilter, setBuyerSegmentFilter] = useState('ALL');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalOrders = orders.length;
  const totalVolume = orders.reduce((sum, o) => sum + o.orderQuantity, 0);
  const totalFOBValue = orders.reduce((sum, o) => sum + o.orderQuantity * o.fobPrice, 0);
  const totalActiveBuyers = buyers.filter((b) => b.status === 'ACTIVE').length;

  // Order CRUD Handlers
  const handleCreateOrder = (newOrder: BuyerOrder) => {
    const updated = [newOrder, ...orders];
    setOrders(updated);
    onUpdateOrders?.(updated);
    setOrderSubView({ type: 'details', order: newOrder });
    showToast(`Successfully created purchase order ${newOrder.orderNumber}`);
  };

  const handleUpdateOrder = (updatedOrder: BuyerOrder) => {
    const updated = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    setOrders(updated);
    onUpdateOrders?.(updated);
    setOrderSubView({ type: 'details', order: updatedOrder });
    showToast(`Saved all updates to order ${updatedOrder.orderNumber}`);
  };

  // Inward Material Receive Handler from Buyer Order Module
  const handleInwardReceive = (record: ReceiveRecord, itemUpdate?: Partial<InventoryItem>) => {
    setReceiveRecords((prev) => [record, ...prev]);

    if (itemUpdate) {
      setInventory((prev) => {
        const idx = prev.findIndex((i) => i.id === record.itemId || i.sku === record.sku);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantityMeters: updated[idx].quantityMeters + record.receivedQty,
            qualityGrade: record.qualityGrade,
            lastUpdatedAt: new Date().toISOString(),
          };
          return updated;
        } else {
          const newItem: InventoryItem = {
            id: record.itemId || `inv-${Date.now()}`,
            sku: record.sku,
            category: record.category,
            styleNumber: record.styleNumber || record.poNumber,
            fabricType: record.itemName,
            color: 'Standard',
            batchLot: record.batchLot,
            rollCount: record.rollsReceived || 0,
            quantityMeters: record.receivedQty,
            unit: record.unit,
            qualityGrade: record.qualityGrade,
            warehouseLocation: record.warehouseLocation,
            status: 'IN_STOCK',
            unitCost: itemUpdate?.unitCost || 3.0,
            updatedBy: record.receivedBy,
            lastUpdatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            supplierName: record.supplierName,
            buyerOrderId: record.buyerOrderId,
            buyerName: record.buyerName,
            poNumber: record.poNumber,
            bomItemId: record.bomItemId,
          };
          return [newItem, ...prev];
        }
      });
    }

    // Auto-update matching Buyer Order's BOM
    const updatedOrders = orders.map((o) => {
      if (o.id === record.buyerOrderId || o.orderNumber === record.poNumber) {
        let bomFound = false;
        const updatedBom = (o.bomItems || []).map((b) => {
          const isMatch =
            (record.bomItemId && b.id === record.bomItemId) ||
            (record.bomItemCode && b.itemCode === record.bomItemCode) ||
            (!record.bomItemId &&
              !bomFound &&
              ((b.itemType === 'FABRIC' && record.category === 'FABRIC') ||
                (b.itemType === 'THREAD' && record.category === 'SEWING_THREAD') ||
                (b.itemType === 'ZIPPER' && record.category === 'ZIPPERS') ||
                (b.itemType === 'BUTTON' && record.category === 'TRIMS_BUTTONS') ||
                (b.itemType === 'LABEL' && record.category === 'LABELS_PACKAGING')));

          if (isMatch && !bomFound) {
            bomFound = true;
            const newRecQty = (b.receivedQty || 0) + record.receivedQty;
            return {
              ...b,
              receivedQty: newRecQty,
              status: newRecQty >= b.totalRequired ? ('RECEIVED' as const) : ('PARTIALLY_RECEIVED' as const),
              grnNumber: record.grnNumber,
              receivedDate: record.date,
              qcGrade: record.qualityGrade,
              inventoryItemId: record.itemId,
            };
          }
          return b;
        });

        const updatedOrder = {
          ...o,
          bomItems: updatedBom,
        };

        if (orderSubView.type === 'details' && orderSubView.order.id === o.id) {
          setOrderSubView({ type: 'details', order: updatedOrder });
        }

        return updatedOrder;
      }
      return o;
    });

    setOrders(updatedOrders);
    onUpdateOrders?.(updatedOrders);
    onReceiveMaterial?.(record, itemUpdate);

    showToast(`✓ Inwarded ${record.receivedQty} ${record.unit} under ${record.grnNumber} for PO ${record.poNumber}`);
  };

  const handleDeleteOrder = (order: BuyerOrder) => {
    setOrderDeleteModal({
      isOpen: true,
      orders: [order],
    });
  };

  const confirmDeleteOrders = () => {
    if (!orderDeleteModal || orderDeleteModal.orders.length === 0) return;
    const idsToDelete = new Set(orderDeleteModal.orders.map((o) => o.id));
    setOrders((prev) => prev.filter((o) => !idsToDelete.has(o.id)));

    if (orderSubView.type === 'details' && idsToDelete.has(orderSubView.order.id)) {
      setOrderSubView({ type: 'none' });
    } else if (orderSubView.type === 'edit' && idsToDelete.has(orderSubView.order.id)) {
      setOrderSubView({ type: 'none' });
    }

    const count = orderDeleteModal.orders.length;
    showToast(
      count === 1
        ? `Deleted purchase order ${orderDeleteModal.orders[0].orderNumber}`
        : `Deleted ${count} purchase orders successfully`
    );
    setOrderDeleteModal(null);
  };

  const confirmDeleteBuyers = () => {
    if (!buyerDeleteModal || buyerDeleteModal.buyers.length === 0) return;
    const idsToDelete = new Set(buyerDeleteModal.buyers.map((b) => b.id));
    setBuyers((prev) => prev.filter((b) => !idsToDelete.has(b.id)));

    const count = buyerDeleteModal.buyers.length;
    showToast(
      count === 1
        ? `Deleted buyer ${buyerDeleteModal.buyers[0].name}`
        : `Deleted ${count} buyers successfully`
    );
    setBuyerDeleteModal(null);
  };

  const handleDuplicateOrder = (order: BuyerOrder) => {
    const duplicated: BuyerOrder = {
      ...order,
      id: `ord-dup-${Date.now()}`,
      orderNumber: `${order.orderNumber}-COPY`,
      status: 'PLANNED',
    };
    setOrders([duplicated, ...orders]);
    showToast(`Duplicated order as ${duplicated.orderNumber}`);
  };

  // Buyer CRUD Handlers
  const handleSaveBuyer = (buyerData: Partial<BuyerProfile>) => {
    if (buyerToEdit) {
      const updated = buyers.map((b) =>
        b.id === buyerToEdit.id ? ({ ...b, ...buyerData } as BuyerProfile) : b
      );
      setBuyers(updated);
      showToast(`Updated buyer ${buyerData.name}`);
    } else {
      const newBuyer: BuyerProfile = {
        id: `byr-${Date.now()}`,
        code: buyerData.code || `BYR-${Math.floor(100 + Math.random() * 900)}`,
        name: buyerData.name || 'New Global Buyer',
        brandDivision: buyerData.brandDivision || 'Main Division',
        country: buyerData.country || 'USA',
        segment: buyerData.segment || 'FAST_FASHION',
        aqlStandard: buyerData.aqlStandard || 'AQL 1.5 Major',
        complianceRating: buyerData.complianceRating || 'A+',
        auditScore: buyerData.auditScore || 95.0,
        contactPerson: buyerData.contactPerson || 'Sourcing Manager',
        email: buyerData.email || 'buyer@brand.com',
        phone: buyerData.phone || '+1 555 0199',
        paymentTerms: buyerData.paymentTerms || 'LC 60 Days',
        activeOrdersCount: 0,
        totalOrderUnits: 0,
        totalFobValueUSD: 0,
        passRatePercent: 99.0,
        logoUrl: buyerData.logoUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=150&auto=format&fit=crop&q=60',
        specialProtocols: buyerData.specialProtocols || ['OEKO-TEX Standard 100', '100% Metal Detection'],
        status: 'ACTIVE',
      };
      setBuyers([newBuyer, ...buyers]);
      showToast(`Registered new buyer ${newBuyer.name}`);
    }
    setIsAddBuyerOpen(false);
    setBuyerToEdit(null);
  };

  // Filtered Orders (filtered by status and buyer dropdowns, searchable via DataTable)
  const statusAndBuyerFilteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    const matchesBuyer = orderBuyerFilter === 'ALL' || o.buyerName === orderBuyerFilter;
    return matchesStatus && matchesBuyer;
  });

  // Filtered Buyers for Grid View
  const filteredBuyers = buyers.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(buyerSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(buyerSearch.toLowerCase()) ||
      b.country.toLowerCase().includes(buyerSearch.toLowerCase()) ||
      b.contactPerson.toLowerCase().includes(buyerSearch.toLowerCase());
    const matchesSegment = buyerSegmentFilter === 'ALL' || b.segment === buyerSegmentFilter;
    return matchesSearch && matchesSegment;
  });

  // Order List Column Definitions with Full Sorting & Column Filters
  const orderColumns: ColumnDef<BuyerOrder>[] = [
    {
      key: 'productImage',
      header: 'Product / Style',
      accessorKey: 'styleNumber',
      sortable: true,
      accessor: (row) => row.styleNumber,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
            {row.productImage ? (
              <img src={row.productImage} alt={row.styleNumber} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Package className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-mono font-bold text-blue-700 text-xs">{row.styleNumber}</div>
            <div className="text-[11px] text-slate-600 truncate max-w-[140px] sm:max-w-[200px]">
              {row.styleDescription}
            </div>
            <div className="text-[10px] text-slate-400">{row.season}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'orderNumber',
      header: 'PO & Buyer',
      accessorKey: 'orderNumber',
      sortable: true,
      accessor: (row) => row.orderNumber,
      cell: (row) => (
        <div>
          <div className="font-mono font-bold text-slate-900 text-xs">{row.orderNumber}</div>
          <div className="text-[11px] font-medium text-slate-700">{row.buyerName}</div>
          <div className="text-[10px] text-slate-500">{row.brand}</div>
        </div>
      ),
    },
    {
      key: 'merchandiser',
      header: 'Merchandiser',
      accessorKey: 'merchandiserName',
      sortable: true,
      accessor: (row) => row.merchandiserName || '',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800 truncate max-w-[140px]">
            {row.merchandiserName?.split('(')[0] || 'Farhan Rahman'}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
            {row.merchandiserEmail || 'merchandising@texexport.com'}
          </div>
        </div>
      ),
    },
    {
      key: 'orderQuantity',
      header: 'Order Qty',
      accessorKey: 'orderQuantity',
      sortable: true,
      accessor: (row) => row.orderQuantity,
      align: 'right',
      cell: (row) => (
        <div className="text-right">
          <span className="font-mono font-bold text-slate-900 text-xs">
            {row.orderQuantity.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">pcs</span>
        </div>
      ),
    },
    {
      key: 'fobPrice',
      header: 'FOB & Value',
      accessorKey: 'fobPrice',
      sortable: true,
      accessor: (row) => row.orderQuantity * row.fobPrice,
      align: 'right',
      cell: (row) => {
        const val = row.orderQuantity * row.fobPrice;
        return (
          <div className="text-right">
            <span className="font-mono font-bold text-emerald-700 text-xs">
              ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              @ ${row.fobPrice.toFixed(2)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'shipDate',
      header: 'Ship Date',
      accessorKey: 'shipDate',
      sortable: true,
      accessor: (row) => row.shipDate,
      cell: (row) => (
        <div className="text-xs font-mono">
          <div className="font-semibold text-slate-800">{row.shipDate}</div>
          <div className="text-[10px] text-slate-500">Cut: {row.cuttingStartDate || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      accessor: (row) => row.status,
      filterOptions: [
        { label: 'Planned', value: 'PLANNED' },
        { label: 'Cutting', value: 'CUTTING' },
        { label: 'Sewing', value: 'SEWING' },
        { label: 'Packing', value: 'PACKING' },
        { label: 'Ready Audit', value: 'READY_AUDIT' },
        { label: 'Shipped', value: 'SHIPPED' },
      ],
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* 1. Details Button */}
          <button
            type="button"
            onClick={() => setOrderSubView({ type: 'details', order: row })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Separate Order Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* 2. Edit Button */}
          <button
            type="button"
            onClick={() => setOrderSubView({ type: 'edit', order: row })}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Open Separate Order Edit Page"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* 3. Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateOrder(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate Order"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* 4. Delete Button */}
          <button
            type="button"
            onClick={() => setOrderDeleteModal({ isOpen: true, orders: [row] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Order"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Buyer List Column Definitions with Full Sorting & Filters
  const buyerColumns: ColumnDef<BuyerProfile>[] = [
    {
      key: 'name',
      header: 'Buyer / Brand',
      accessorKey: 'name',
      sortable: true,
      accessor: (b) => b.name,
      cell: (b) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg border border-slate-200 bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
            {b.logoUrl ? (
              <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain rounded-md" />
            ) : (
              <Building2 className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">{b.name}</div>
            <div className="text-[10px] text-slate-500 font-mono">
              {b.code} • {b.brandDivision}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country & Segment',
      accessorKey: 'country',
      sortable: true,
      accessor: (b) => b.country,
      filterOptions: [
        { label: 'USA', value: 'USA' },
        { label: 'Sweden', value: 'Sweden' },
        { label: 'Spain', value: 'Spain' },
        { label: 'Japan', value: 'Japan' },
        { label: 'UK', value: 'UK' },
        { label: 'Germany', value: 'Germany' },
        { label: 'France', value: 'France' },
      ],
      cell: (b) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{b.country}</div>
          <span className="text-[10px] text-slate-500">{b.segment.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Representative QA',
      accessorKey: 'contactPerson',
      sortable: true,
      accessor: (b) => b.contactPerson,
      cell: (b) => (
        <div className="text-xs">
          <div className="font-medium text-slate-900">{b.contactPerson}</div>
          <div className="text-[10px] text-slate-500">{b.email}</div>
          {b.phone && <div className="text-[10px] text-slate-400 font-mono">{b.phone}</div>}
        </div>
      ),
    },
    {
      key: 'merchandiser',
      header: 'Assigned Merchandiser',
      accessorKey: 'merchandiserName',
      sortable: true,
      accessor: (b) => b.merchandiserName || '',
      cell: (b) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{b.merchandiserName || 'Not Assigned'}</span>
          </div>
          {b.merchandiserEmail && (
            <div className="text-[10px] text-slate-500 truncate mt-0.5">{b.merchandiserEmail}</div>
          )}
          {b.merchandiserPhone && (
            <div className="text-[10px] text-slate-500 font-mono">{b.merchandiserPhone}</div>
          )}
        </div>
      ),
    },
    {
      key: 'complianceRating',
      header: 'AQL & Rating',
      accessorKey: 'complianceRating',
      sortable: true,
      accessor: (b) => b.complianceRating,
      filterOptions: [
        { label: 'A+ Tier', value: 'A+' },
        { label: 'A Tier', value: 'A' },
        { label: 'B+ Tier', value: 'B+' },
        { label: 'B Tier', value: 'B' },
      ],
      cell: (b) => (
        <div>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {b.complianceRating} ({b.auditScore}%)
          </span>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{b.aqlStandard}</div>
        </div>
      ),
    },
    {
      key: 'activeOrdersCount',
      header: 'Orders',
      accessorKey: 'activeOrdersCount',
      sortable: true,
      accessor: (b) => b.activeOrdersCount,
      align: 'right',
      cell: (b) => (
        <div className="text-right font-mono font-bold text-xs text-slate-900">
          {b.activeOrdersCount} POs
        </div>
      ),
    },
    {
      key: 'totalFobValueUSD',
      header: 'Total FOB Value',
      accessorKey: 'totalFobValueUSD',
      sortable: true,
      accessor: (b) => b.totalFobValueUSD,
      align: 'right',
      cell: (b) => (
        <div className="text-right font-mono font-bold text-xs text-emerald-700">
          ${(b.totalFobValueUSD / 1000).toFixed(0)}k
        </div>
      ),
    },
    {
      key: 'paymentTerms',
      header: 'Payment Terms',
      accessorKey: 'paymentTerms',
      sortable: true,
      accessor: (b) => b.paymentTerms,
      align: 'right',
      cell: (b) => (
        <div className="text-right font-mono text-xs text-slate-600">
          {b.paymentTerms}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      cell: (b) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => {
              setBuyerToEdit(b);
              setIsAddBuyerOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            title="Edit Buyer"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setBuyerDeleteModal({ isOpen: true, buyers: [b] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
            title="Delete Buyer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderBuyerFilter(b.name);
              setViewMode('list');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] cursor-pointer"
          >
            <span>Orders</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Clean 3-tab layout ONLY (Summary, Order List, Buyer List) */}
      <ModuleHeader
        title="Buyer & Order Management"
        activeView={orderSubView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setOrderSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Order List', count: orders.length },
          { id: 'buyer', label: 'Buyer List', count: buyers.length },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {orderSubView.type === 'details' ? (
        <BuyerOrderDetailsPage
          order={orderSubView.order}
          onBack={() => setOrderSubView({ type: 'none' })}
          onEdit={(ord) => setOrderSubView({ type: 'edit', order: ord })}
          onDuplicate={(ord) => {
            handleDuplicateOrder(ord);
            setOrderSubView({ type: 'none' });
          }}
          onDelete={(ord) => {
            setOrderDeleteModal({ isOpen: true, orders: [ord] });
          }}
          showToast={showToast}
          inventoryItems={inventory}
          receiveRecords={receiveRecords}
          onOpenReceiveModalForOrder={(ord) => {
            setOrderForReceiveModal(ord);
            setIsReceiveModalOpen(true);
          }}
        />
      ) : orderSubView.type === 'add' ? (
        <BuyerOrderAddPage
          buyerNames={buyers.map((b) => b.name)}
          buyers={buyers}
          onSave={(newOrder) => {
            setOrders([newOrder, ...orders]);
            setOrderSubView({ type: 'none' });
            showToast(`Successfully created purchase order ${newOrder.orderNumber}`);
          }}
          onCancel={() => setOrderSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : orderSubView.type === 'edit' ? (
        <BuyerOrderEditPage
          order={orderSubView.order}
          buyerNames={buyers.map((b) => b.name)}
          buyers={buyers}
          onSave={(updated) => {
            setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
            setOrderSubView({ type: 'details', order: updated });
            showToast(`Saved all updates to order ${updated.orderNumber}`);
          }}
          onCancel={() => setOrderSubView({ type: 'details', order: orderSubView.order })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Export Orders"
                  value={totalOrders.toString()}
                  subtitle="Active buyer contracts"
                  icon={ShoppingBag}
                  tone="blue"
                  delta={{ value: '+12.5%', isPositive: true }}
                />
                <StatCard
                  title="Total Production Units"
                  value={`${(totalVolume / 1000).toFixed(1)}k pcs`}
                  subtitle="Across all buyer styles"
                  icon={Layers}
                  tone="indigo"
                  delta={{ value: '+8.2%', isPositive: true }}
                />
                <StatCard
                  title="Total FOB Value"
                  value={`$${(totalFOBValue / 1000).toFixed(0)}k`}
                  subtitle="Commercial export invoice"
                  icon={DollarSign}
                  tone="emerald"
                  delta={{ value: '+14.1%', isPositive: true }}
                />
                <StatCard
                  title="Active Buyer Brands"
                  value={totalActiveBuyers.toString()}
                  subtitle="Global apparel partners"
                  icon={Building2}
                  tone="purple"
                  delta={{ value: '+4.5%', isPositive: true }}
                />
              </div>

              {/* Status Breakdown & Quick Links */}
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">
                      Production Pipeline by Stage
                    </h3>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View Order List →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    {[
                      { status: 'PLANNED', label: 'Pre-Production', color: 'bg-amber-500' },
                      { status: 'CUTTING', label: 'Cutting Floor', color: 'bg-indigo-500' },
                      { status: 'SEWING', label: 'Sewing Lines', color: 'bg-blue-600' },
                      { status: 'PACKING', label: 'Finishing & Pack', color: 'bg-purple-500' },
                      { status: 'READY_AUDIT', label: 'Final QC Audit', color: 'bg-emerald-600' },
                      { status: 'SHIPPED', label: 'Shipped & Gated', color: 'bg-slate-700' },
                    ].map((stage) => {
                      const count = orders.filter((o) => o.status === stage.status).length;
                      const qty = orders
                        .filter((o) => o.status === stage.status)
                        .reduce((sum, o) => sum + o.orderQuantity, 0);

                      return (
                        <div
                          key={stage.status}
                          onClick={() => {
                            setOrderStatusFilter(stage.status);
                            setViewMode('list');
                          }}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                              {count} POs
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {qty.toLocaleString()} pcs
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Buyers Widget */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Top Buyer Accounts</h3>
                    <button
                      type="button"
                      onClick={() => setViewMode('buyer')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      All Buyers →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {buyers.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBuyerForModal(b);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg border border-slate-200 bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                            {b.logoUrl ? (
                              <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain rounded-md" />
                            ) : (
                              <Building2 className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{b.name}</div>
                            <div className="text-[10px] text-slate-500">{b.country} • {b.segment.replace('_', ' ')}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono font-bold text-emerald-700">
                            ${(b.totalFobValueUSD / 1000).toFixed(0)}k
                          </span>
                          <span className="text-[10px] text-slate-400 block">{b.activeOrdersCount} POs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDER LIST (ONE UNIFIED SEARCH & FILTER BAR WITH ACCENDING/DESCENDING SORTING) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="buyer-orders-table"
                data={statusAndBuyerFilteredOrders}
                columns={orderColumns}
                searchPlaceholder="Search PO#, style, buyer, merchandiser, or season..."
                searchableKeys={[
                  'orderNumber',
                  'buyerName',
                  'styleNumber',
                  'styleDescription',
                  'season',
                  'merchandiserName',
                  'brand',
                  'status',
                ]}
                secondaryAction={
                  <div className="flex items-center gap-2">
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PLANNED">Planned</option>
                      <option value="CUTTING">Cutting</option>
                      <option value="SEWING">Sewing</option>
                      <option value="PACKING">Packing</option>
                      <option value="READY_AUDIT">Ready Audit</option>
                      <option value="SHIPPED">Shipped</option>
                    </select>

                    <select
                      value={orderBuyerFilter}
                      onChange={(e) => setOrderBuyerFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[160px]"
                    >
                      <option value="ALL">All Buyers</option>
                      {buyers.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => setOrderSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Order</span>
                  </button>
                }
                batchActions={[
                  {
                    label: 'Delete Selected',
                    variant: 'danger',
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      setOrderDeleteModal({
                        isOpen: true,
                        orders: selected,
                      });
                    },
                  },
                  {
                    label: 'Export Selected',
                    onClick: (selected) => {
                      showToast(`Exported ${selected.length} purchase orders`);
                    },
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 3: BUYER LIST (WITH ADD BUYER BUTTON & GRID/TABLE VIEW TOGGLE) */}
          {viewMode === 'buyer' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* GRID VIEW RENDERING */}
              {buyerViewType === 'grid' && (
                <>
                  {/* Buyer List Toolbar for Grid View */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {/* Search */}
                      <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search buyer name, code, country..."
                          value={buyerSearch}
                          onChange={(e) => setBuyerSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Segment Filter */}
                      <select
                        value={buyerSegmentFilter}
                        onChange={(e) => setBuyerSegmentFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                      >
                        <option value="ALL">All Segments</option>
                        <option value="FAST_FASHION">Fast Fashion</option>
                        <option value="PREMIUM_APPAREL">Premium Apparel</option>
                        <option value="SPORTSWEAR">Sportswear</option>
                        <option value="DENIM_CASUAL">Denim &amp; Casual</option>
                        <option value="BASIC_ESSENTIALS">Basic Essentials</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* GRID VS TABLE TOGGLE */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setBuyerViewType('grid')}
                          className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white text-blue-600 shadow-xs"
                          title="Grid Card View"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Grid</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuyerViewType('table')}
                          className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
                          title="Table List View"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Table</span>
                        </button>
                      </div>

                      {/* ADD BUYER BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setBuyerToEdit(null);
                          setIsAddBuyerOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Buyer</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredBuyers.map((b) => (
                      <div
                        key={b.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3.5 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Card Header with Logo & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                                {b.logoUrl ? (
                                  <img
                                    src={b.logoUrl}
                                    alt={b.name}
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                ) : (
                                  <Building2 className="w-6 h-6 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-mono text-[10px] font-bold text-blue-700 uppercase">
                                  {b.code}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                  {b.name}
                                </h4>
                                <p className="text-[11px] text-slate-500">{b.country} • {b.brandDivision}</p>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {b.complianceRating} Tier
                            </span>
                          </div>

                          {/* Commercial Stats */}
                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Active POs</span>
                              <span className="font-bold text-slate-900 text-xs font-mono">
                                {b.activeOrdersCount} Orders
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Total Units</span>
                              <span className="font-bold text-slate-900 text-xs font-mono">
                                {(b.totalOrderUnits / 1000).toFixed(0)}k pcs
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">FOB Value</span>
                              <span className="font-bold text-emerald-700 text-xs font-mono">
                                ${(b.totalFobValueUSD / 1000).toFixed(0)}k
                              </span>
                            </div>
                          </div>

                          {/* Assigned Merchandiser & Contact */}
                          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/90 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-blue-950 flex items-center gap-1.5 truncate">
                                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="truncate">{b.merchandiserName || 'Merchandiser Unassigned'}</span>
                              </div>
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded shrink-0">
                                Merch Lead
                              </span>
                            </div>
                            <div className="text-slate-600 truncate flex items-center gap-1.5 text-[10px]">
                              {b.merchandiserEmail && <span className="truncate">{b.merchandiserEmail}</span>}
                              {b.merchandiserEmail && b.merchandiserPhone && <span className="text-slate-300">•</span>}
                              {b.merchandiserPhone && <span className="font-mono text-slate-700 shrink-0">{b.merchandiserPhone}</span>}
                            </div>
                          </div>

                          {/* Representative QA Contact */}
                          <div className="text-[11px] space-y-0.5 pt-0.5 text-slate-600">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="text-[10px] text-slate-400 font-normal">Buyer QA:</span>
                              <span className="truncate">{b.contactPerson}</span>
                            </div>
                            <div className="text-slate-500 truncate text-[10px] pl-5">{b.email} • {b.phone}</div>
                          </div>

                          {/* Special Protocols Chips */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Special QA Protocols:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {b.specialProtocols.slice(0, 2).map((p, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-medium border border-blue-100 truncate max-w-[200px]"
                                >
                                  {p}
                                </span>
                              ))}
                              {b.specialProtocols.length > 2 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                                  +{b.specialProtocols.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-[10px] text-slate-500 font-mono">
                            Terms: {b.paymentTerms}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setBuyerToEdit(b);
                                setIsAddBuyerOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                              title="Edit Buyer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setBuyerDeleteModal({ isOpen: true, buyers: [b] })}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                              title="Delete Buyer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOrderBuyerFilter(b.name);
                                setViewMode('list');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <span>View Orders</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TABLE VIEW RENDERING WITH DATATABLE SORTING & CSV EXPORT */}
              {buyerViewType === 'table' && (
                <DataTable
                  id="buyers-data-table"
                  data={buyers}
                  columns={buyerColumns}
                  searchPlaceholder="Search buyer by name, code, country, or contact..."
                  searchableKeys={['name', 'code', 'country', 'contactPerson', 'brandDivision', 'email']}
                  secondaryAction={
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setBuyerViewType('grid')}
                        className="p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
                        title="Grid Card View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuyerViewType('table')}
                        className="p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white text-blue-600 shadow-xs"
                        title="Table List View"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Table</span>
                      </button>
                    </div>
                  }
                  primaryAction={
                    <button
                      type="button"
                      onClick={() => {
                        setBuyerToEdit(null);
                        setIsAddBuyerOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Buyer</span>
                    </button>
                  }
                  batchActions={[
                    {
                      label: 'Delete Selected',
                      variant: 'danger',
                      icon: <Trash2 className="w-3.5 h-3.5" />,
                      onClick: (selected) => {
                        setBuyerDeleteModal({
                          isOpen: true,
                          buyers: selected,
                        });
                      },
                    },
                    {
                      label: 'Export Selected',
                      onClick: (selected) => {
                        showToast(`Exported ${selected.length} buyer profiles`);
                      },
                    },
                  ]}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: ADD / EDIT BUYER */}
      <AddBuyerModal
        isOpen={isAddBuyerOpen}
        onClose={() => {
          setIsAddBuyerOpen(false);
          setBuyerToEdit(null);
        }}
        onSave={handleSaveBuyer}
        initialData={buyerToEdit}
      />

      {/* MODAL: CONFIRM DELETE ORDERS */}
      <DeleteConfirmationModal
        isOpen={Boolean(orderDeleteModal?.isOpen)}
        title={
          orderDeleteModal?.orders.length === 1
            ? `Delete Order ${orderDeleteModal.orders[0].orderNumber}`
            : `Delete ${orderDeleteModal?.orders.length || 0} Purchase Orders`
        }
        itemTypeLabel="purchase order"
        items={
          orderDeleteModal?.orders.map((o) => ({
            id: o.id,
            title: `${o.orderNumber} (${o.buyerName})`,
            subtitle: `Style: ${o.styleNumber} • ${o.styleDescription}`,
            value: `${o.orderQuantity.toLocaleString()} pcs ($${((o.orderQuantity * o.fobPrice) / 1000).toFixed(1)}k)`,
          })) || []
        }
        onConfirm={confirmDeleteOrders}
        onCancel={() => setOrderDeleteModal(null)}
      />

      {/* MODAL: CONFIRM DELETE BUYERS */}
      <DeleteConfirmationModal
        isOpen={Boolean(buyerDeleteModal?.isOpen)}
        title={
          buyerDeleteModal?.buyers.length === 1
            ? `Delete Buyer ${buyerDeleteModal.buyers[0].name}`
            : `Delete ${buyerDeleteModal?.buyers.length || 0} Buyers`
        }
        itemTypeLabel="buyer profile"
        items={
          buyerDeleteModal?.buyers.map((b) => ({
            id: b.id,
            title: `${b.name} (${b.code})`,
            subtitle: `${b.country} • ${b.brandDivision}`,
            value: `${b.activeOrdersCount} POs ($${(b.totalFobValueUSD / 1000).toFixed(0)}k)`,
          })) || []
        }
        onConfirm={confirmDeleteBuyers}
        onCancel={() => setBuyerDeleteModal(null)}
      />

      {/* Receive Material Modal for Inwarding PO goods directly */}
      {isReceiveModalOpen && (
        <ReceiveMaterialModal
          isOpen={isReceiveModalOpen}
          onClose={() => {
            setIsReceiveModalOpen(false);
            setOrderForReceiveModal(null);
          }}
          onReceive={handleInwardReceive}
          existingItems={inventory}
          orders={orders}
          preSelectedOrderId={orderForReceiveModal?.id}
          preSelectedPoNumber={orderForReceiveModal?.orderNumber}
          preSelectedStyleNumber={orderForReceiveModal?.styleNumber}
        />
      )}
    </div>
  );
}
