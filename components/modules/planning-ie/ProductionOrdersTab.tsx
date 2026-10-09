'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  Download,
  FileDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Copy,
  Edit,
  Eye,
  ArrowUpDown,
  Tag,
  Clock,
  Printer,
  Sparkles,
  RefreshCw,
  Link2,
  ShieldCheck,
  Layers,
  Box,
  Truck,
  FileCheck,
  Zap,
} from 'lucide-react';
import {
  ProductionOrderPlan,
  ProductionOrderStatus,
  PriorityLevel,
} from '@/lib/types/planning-ie';
import { BuyerOrder } from '@/lib/types/modules';
import { ProductionLine } from '@/lib/types/production-management';
import { useModulePermission } from '@/hooks/use-module-permission';

interface ProductionOrdersTabProps {
  orders: ProductionOrderPlan[];
  buyerOrders?: BuyerOrder[];
  lines?: ProductionLine[];
  onAddOrder: (newOrder: ProductionOrderPlan) => void;
  onUpdateOrder: (updated: ProductionOrderPlan) => void;
  onDeleteOrder: (id: string) => void;
  onDuplicateOrder: (order: ProductionOrderPlan) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
  onPrintOrders: () => void;
  onExportSingleOrder?: (order: ProductionOrderPlan) => void;
  onExportOrdersBatch?: (selectedOrders: ProductionOrderPlan[]) => void;
  onOpenGlobalExport?: () => void;
}

export function ProductionOrdersTab({
  orders,
  buyerOrders = [],
  lines = [],
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onDuplicateOrder,
  onExportCsv,
  onPrintOrders,
  onExportSingleOrder,
  onExportOrdersBatch,
  onOpenGlobalExport,
}: ProductionOrdersTabProps) {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('planning_ie');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncFilterBuyer, setSyncFilterBuyer] = useState<string>('ALL');

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrderPlan | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ProductionOrderPlan>>({
    orderNumber: '',
    buyer: 'H&M Hennes & Mauritz',
    style: '',
    po: '',
    article: '',
    product: '',
    productCategory: 'Knit Tops',
    color: '',
    size: 'S - XXL',
    sizeRange: 'S, M, L, XL, XXL',
    orderQuantity: 25000,
    plannedQuantity: 25750,
    productionStartDate: new Date().toISOString().split('T')[0],
    productionEndDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
    priority: 'HIGH',
    assignedLine: 'Sewing Line 01',
    assignedDepartment: 'SEWING',
    status: 'PLANNED',
    remarks: '',
    smv: 11.2,
    fabricStatus: '100% In-House - Passed 4-Point Inspection',
    cuttingStatus: 'Scheduled',
    isSyncedWithBuyerOrder: false,
  });

  // Calculate planned quantity with default 3% allowance
  const handleOrderQtyChange = (val: number) => {
    const planned = Math.round(val * 1.03);
    setFormData((prev) => ({
      ...prev,
      orderQuantity: val,
      plannedQuantity: planned,
    }));
  };

  // Convert BuyerOrder to ProductionOrderPlan
  const convertBuyerOrderToPlan = (bo: BuyerOrder): ProductionOrderPlan => {
    const desc = bo.styleDescription.toLowerCase();
    const isKnit = desc.includes('tee') || desc.includes('crew');
    const isPolo = desc.includes('polo');
    const isDenim = desc.includes('jeans') || desc.includes('denim');
    const isHoodie = desc.includes('hoodie') || desc.includes('fleece');
    const isShirt = desc.includes('shirt') && !isPolo && !isKnit;

    let assignedLine = 'Sewing Line 01';
    let productCategory = 'Knit Tops';
    if (isDenim) {
      assignedLine = 'Sewing Line 04';
      productCategory = 'Denim Bottoms';
    } else if (isPolo) {
      assignedLine = 'Sewing Line 02';
      productCategory = 'Knit Tops';
    } else if (isHoodie) {
      assignedLine = 'Sewing Line 03';
      productCategory = 'Fleece Outerwear';
    } else if (isShirt) {
      assignedLine = 'Sewing Line 05';
      productCategory = 'Woven Tops';
    }

    const fabricBom = bo.bomItems?.find((b) => b.itemType === 'FABRIC');
    const fabricStatus =
      fabricBom?.status === 'RECEIVED'
        ? '100% In-House - Passed 4-Point Inspection'
        : fabricBom?.status === 'PARTIALLY_RECEIVED'
        ? 'Partial Inward - Ready for Relaxation'
        : 'Fabric Sourced - Pending Mill Delivery';

    const plannedQty = Math.round(bo.orderQuantity * 1.03); // 3% commercial cutting & rework allowance

    return {
      id: `po-plan-${bo.orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      orderNumber: `PRD-ORD-${bo.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
      buyer: bo.buyerName,
      style: bo.styleNumber,
      po: bo.orderNumber,
      article: `ART-${bo.styleNumber}`,
      product: bo.styleDescription,
      productCategory,
      color: 'Standard Tech Pack Colorways',
      size: 'S - XXL',
      sizeRange: 'S, M, L, XL, XXL',
      orderQuantity: bo.orderQuantity,
      plannedQuantity: plannedQty,
      productionStartDate: bo.cuttingStartDate || new Date().toISOString().split('T')[0],
      productionEndDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
      deliveryDate: bo.shipDate,
      priority: 'HIGH',
      assignedLine,
      assignedDepartment: 'SEWING',
      status: bo.status === 'SEWING' ? 'IN_PRODUCTION' : bo.status === 'CUTTING' ? 'RELEASED' : 'PLANNED',
      remarks: `Synchronized from Buyer Order ${bo.orderNumber}. 3.0% overcut allowance applied for cutting & rework buffer.`,
      createdAt: new Date().toISOString(),
      buyerOrderId: bo.id,
      fabricStatus,
      cuttingStatus: bo.status === 'SEWING' ? '100% Cut & Numbered' : bo.status === 'CUTTING' ? '50% Cut - Spreading Active' : 'Scheduled',
      smv: bo.smv || 14.5,
      fobPrice: bo.fobPrice,
      isSyncedWithBuyerOrder: true,
      syncSource: 'Buyer Order Module',
      fabricReadinessPercent: fabricBom?.status === 'RECEIVED' ? 100 : 70,
    };
  };

  // Sync a single buyer order
  const handleSyncSingleBuyerOrder = (bo: BuyerOrder) => {
    const existing = orders.find((o) => o.po === bo.orderNumber || o.buyerOrderId === bo.id);
    const converted = convertBuyerOrderToPlan(bo);
    if (existing) {
      onUpdateOrder({
        ...existing,
        ...converted,
        id: existing.id,
        orderNumber: existing.orderNumber,
      });
    } else {
      onAddOrder(converted);
    }
  };

  // Batch sync all buyer orders
  const handleSyncAllBuyerOrders = () => {
    buyerOrders.forEach((bo) => {
      handleSyncSingleBuyerOrder(bo);
    });
    setIsSyncModalOpen(false);
  };

  const openAddModal = () => {
    setEditingOrder(null);
    setFormData({
      orderNumber: `PRD-ORD-2026-${String(orders.length + 1).padStart(3, '0')}`,
      buyer: 'H&M Hennes & Mauritz',
      style: 'STY-TS-2026',
      po: `PO-HM-${Math.floor(10000 + Math.random() * 90000)}`,
      article: 'ART-TEE-COTTON',
      product: 'Men Heavyweight Cotton Tee',
      productCategory: 'Knit Tops',
      color: 'Black / Navy',
      size: 'S - XXL',
      sizeRange: 'S, M, L, XL, XXL',
      orderQuantity: 30000,
      plannedQuantity: 30900,
      productionStartDate: new Date().toISOString().split('T')[0],
      productionEndDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      priority: 'HIGH',
      assignedLine: 'Sewing Line 01',
      assignedDepartment: 'SEWING',
      status: 'PLANNED',
      remarks: '3.0% over-allowance buffer added for cutting & rework buffer.',
      smv: 11.2,
      fabricStatus: '100% In-House - Passed 4-Point Inspection',
      cuttingStatus: 'Scheduled',
      isSyncedWithBuyerOrder: false,
    });
    setValidationError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (order: ProductionOrderPlan) => {
    setEditingOrder(order);
    setFormData({ ...order });
    setValidationError(null);
    setIsModalOpen(true);
  };

  // When user picks a buyer order inside the Add/Edit form
  const handleAutoFillFromBuyerOrder = (poNumber: string) => {
    const bo = buyerOrders.find((b) => b.orderNumber === poNumber);
    if (!bo) return;
    const converted = convertBuyerOrderToPlan(bo);
    setFormData((prev) => ({
      ...prev,
      buyer: converted.buyer,
      style: converted.style,
      po: converted.po,
      article: converted.article,
      product: converted.product,
      productCategory: converted.productCategory,
      orderQuantity: converted.orderQuantity,
      plannedQuantity: converted.plannedQuantity,
      productionStartDate: converted.productionStartDate,
      productionEndDate: converted.productionEndDate,
      deliveryDate: converted.deliveryDate,
      assignedLine: converted.assignedLine,
      smv: converted.smv,
      fabricStatus: converted.fabricStatus,
      cuttingStatus: converted.cuttingStatus,
      buyerOrderId: converted.buyerOrderId,
      isSyncedWithBuyerOrder: true,
      syncSource: 'Buyer Order Module',
      remarks: converted.remarks,
    }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.po || !formData.style || !formData.buyer) {
      setValidationError('Please fill in all required fields (Order Number, PO, Style, Buyer).');
      return;
    }
    if ((formData.orderQuantity || 0) <= 0) {
      setValidationError('Order quantity must be a positive number greater than 0.');
      return;
    }
    if ((formData.plannedQuantity || 0) < (formData.orderQuantity || 0)) {
      setValidationError('Planned quantity cannot be less than customer order quantity.');
      return;
    }
    if (formData.productionStartDate && formData.productionEndDate && formData.productionStartDate > formData.productionEndDate) {
      setValidationError('Production end date cannot be earlier than start date.');
      return;
    }
    if (formData.productionEndDate && formData.deliveryDate && formData.productionEndDate > formData.deliveryDate) {
      setValidationError('Customer delivery date cannot be earlier than production end date.');
      return;
    }

    if (editingOrder) {
      onUpdateOrder({
        ...editingOrder,
        ...(formData as ProductionOrderPlan),
      });
    } else {
      const newPlan: ProductionOrderPlan = {
        ...(formData as ProductionOrderPlan),
        id: `po-plan-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      onAddOrder(newPlan);
    }
    setIsModalOpen(false);
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchSearch =
        ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.po.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.assignedLine.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || ord.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || ord.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [orders, searchQuery, statusFilter, priorityFilter]);

  // Overall KPI Metrics
  const totalOrderUnits = useMemo(() => orders.reduce((acc, o) => acc + (o.orderQuantity || 0), 0), [orders]);
  const totalPlannedUnits = useMemo(() => orders.reduce((acc, o) => acc + (o.plannedQuantity || 0), 0), [orders]);
  const syncedOrdersCount = useMemo(() => orders.filter((o) => o.isSyncedWithBuyerOrder || o.buyerOrderId).length, [orders]);
  const fabricReadyOrdersCount = useMemo(
    () => orders.filter((o) => o.fabricStatus?.includes('100%') || o.fabricReadinessPercent === 100).length,
    [orders]
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Priority Chip Renderer
  const renderPriorityBadge = (priority: PriorityLevel) => {
    const config = {
      LOW: 'bg-slate-100 text-slate-700 border-slate-200',
      MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
      HIGH: 'bg-amber-100 text-amber-800 border-amber-300',
      URGENT: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    }[priority] || 'bg-slate-100 text-slate-700';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config}`}>
        {priority}
      </span>
    );
  };

  // Status Chip Renderer
  const renderStatusBadge = (status: ProductionOrderStatus) => {
    const config = {
      DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
      PLANNED: 'bg-blue-50 text-blue-700 border-blue-200',
      RELEASED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      IN_PRODUCTION: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-300',
      COMPLETED: 'bg-teal-50 text-teal-800 border-teal-300',
      CLOSED: 'bg-purple-50 text-purple-700 border-purple-200',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-300',
    }[status] || 'bg-slate-100 text-slate-700';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI Commercial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Registered POs</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">{orders.length} Orders</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">{syncedOrdersCount} synced</span> with Buyer Orders
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Customer Order Qty</span>
            <Box className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">{totalOrderUnits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Confirmed buyer order volume</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Planned Production</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">{totalPlannedUnits.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            +{(totalPlannedUnits - totalOrderUnits).toLocaleString()} pcs (+3.0% cutting buffer)
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Fabric In-House Rate</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-700">
            {orders.length > 0 ? Math.round((fabricReadyOrdersCount / orders.length) * 100) : 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {fabricReadyOrdersCount} of {orders.length} ready for line feed
          </div>
        </div>
      </div>

      {/* Top Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PO, Style, Buyer, Order # or Line..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PLANNED">PLANNED</option>
            <option value="RELEASED">RELEASED</option>
            <option value="IN_PRODUCTION">IN PRODUCTION</option>
            <option value="ON_HOLD">ON HOLD</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          {/* SYNC FROM BUYER ORDERS BUTTON */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
            title="Sync orders directly from Buyer Orders / Merchandising"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Sync Buyer Orders</span>
            {buyerOrders.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {buyerOrders.length}
              </span>
            )}
          </button>

          {/* Global Export Register (PDF / Excel) */}
          {canExport && (
            <button
              onClick={() => {
                if (onOpenGlobalExport) {
                  onOpenGlobalExport();
                } else {
                  onExportCsv('Production_Orders_Register.csv', filteredOrders);
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Global Export: Production Orders Register (PDF or Excel)"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Register</span>
            </button>
          )}

          {/* Export CSV */}
          {canExport && (
            <button
              onClick={() => onExportCsv('Production_Orders_Register.csv', filteredOrders)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Print */}
          {canExport && (
            <button
              onClick={onPrintOrders}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          )}

          {/* New Production Order Button */}
          {canCreate && (
            <button
              onClick={openAddModal}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Production Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Strip if selected */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <span className="font-semibold text-blue-900">
            {selectedIds.size} production orders selected
          </span>
          <div className="flex items-center gap-2">
            {canExport && (
              <button
                onClick={() => {
                  const selected = orders.filter((o) => selectedIds.has(o.id));
                  if (onExportOrdersBatch) {
                    onExportOrdersBatch(selected);
                  } else {
                    onExportCsv('Selected_Production_Orders.csv', selected);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-800 font-semibold hover:bg-blue-100 cursor-pointer shadow-2xs"
                title="Export Selected Orders (PDF or Excel)"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Selected (PDF/Excel)</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedIds.size} selected orders?`)) {
                    selectedIds.forEach((id) => onDeleteOrder(id));
                    setSelectedIds(new Set());
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

      {/* Production Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="p-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-3">Order # &amp; PO</th>
                <th className="p-3">Buyer &amp; Style</th>
                <th className="p-3">Product Description &amp; Category</th>
                <th className="p-3">Color / Size</th>
                <th className="p-3 text-right">Order Qty</th>
                <th className="p-3 text-right">Planned (+3%)</th>
                <th className="p-3">Dates (Start &rarr; Del)</th>
                <th className="p-3">Assigned Line &amp; SMV</th>
                <th className="p-3">Material Readiness</th>
                <th className="p-3 text-center">Priority</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400">
                    No production orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isSynced = ord.isSyncedWithBuyerOrder || Boolean(ord.buyerOrderId);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(ord.id)}
                          onChange={() => toggleSelect(ord.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-700">{ord.orderNumber}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-600 font-semibold">{ord.po}</span>
                          {isSynced && (
                            <span
                              title="Synced with Buyer Order Module"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold"
                            >
                              <Link2 className="w-2.5 h-2.5" />
                              Synced
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{ord.buyer}</div>
                        <div className="text-[11px] font-mono font-medium text-slate-600">{ord.style}</div>
                      </td>
                      <td className="p-3 text-slate-800">
                        <div className="font-medium line-clamp-1">{ord.product}</div>
                        <div className="text-[10px] text-blue-600 font-semibold">{ord.productCategory}</div>
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="truncate max-w-[120px]">{ord.color}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ord.sizeRange}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {ord.orderQuantity.toLocaleString()} pcs
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        <div>{ord.plannedQuantity.toLocaleString()} pcs</div>
                        <div className="text-[9px] text-emerald-600 font-medium">
                          +{Math.max(0, ord.plannedQuantity - ord.orderQuantity).toLocaleString()} buf
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">
                        <div>Start: {ord.productionStartDate}</div>
                        <div className="font-semibold text-emerald-700">Del: {ord.deliveryDate}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{ord.assignedLine}</div>
                        {ord.smv && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            SMV: <strong>{ord.smv} min</strong>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              ord.fabricStatus?.includes('100%') ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span className="font-medium text-slate-700 truncate max-w-[130px]" title={ord.fabricStatus}>
                            {ord.fabricStatus || 'Store Inspection Pending'}
                          </span>
                        </div>
                        {ord.cuttingStatus && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Cut: {ord.cuttingStatus}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">{renderPriorityBadge(ord.priority)}</td>
                      <td className="p-3 text-center">{renderStatusBadge(ord.status)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canExport && onExportSingleOrder && (
                            <button
                              onClick={() => onExportSingleOrder(ord)}
                              title="Export Order Plan (PDF or Excel)"
                              className="p-1 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canCreate && (
                            <button
                              onClick={() => onDuplicateOrder(ord)}
                              title="1-Click Duplicate Order"
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(ord)}
                              title="Edit Production Order"
                              className="p-1 hover:bg-slate-100 rounded text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete production order ${ord.orderNumber}?`)) {
                                  onDeleteOrder(ord.id);
                                }
                              }}
                              title="Delete Order"
                              className="p-1 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SYNC BUYER ORDERS MODAL */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sync Orders from Merchandising / Buyer Order Module
                  </h3>
                  <p className="text-xs text-slate-500">
                    Import confirmed customer purchase orders into Planning &amp; IE with automatic 3.0% cutting buffer and line assignment.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex items-center justify-between text-xs bg-blue-50/60 p-3 rounded-xl border border-blue-200/60">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-blue-900 font-medium">
                  <strong>{buyerOrders.length} Buyer Orders</strong> detected in system database.
                </span>
              </div>
              <button
                onClick={handleSyncAllBuyerOrders}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>1-Click Sync All Orders</span>
              </button>
            </div>

            {/* List of Buyer Orders */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {buyerOrders.map((bo) => {
                const existing = orders.find((o) => o.po === bo.orderNumber || o.buyerOrderId === bo.id);
                const fabricBom = bo.bomItems?.find((b) => b.itemType === 'FABRIC');
                return (
                  <div key={bo.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">{bo.orderNumber}</span>
                        <span className="font-semibold text-slate-800">&bull; {bo.buyerName}</span>
                        <span className="text-slate-500 font-mono">({bo.styleNumber})</span>
                      </div>
                      <div className="text-slate-600 truncate">{bo.styleDescription}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span>
                          Qty: <strong className="text-slate-800">{bo.orderQuantity.toLocaleString()} pcs</strong>
                        </span>
                        <span>
                          Ship Date: <strong className="text-slate-800">{bo.shipDate}</strong>
                        </span>
                        {bo.smv && (
                          <span>
                            SMV: <strong className="text-blue-700">{bo.smv} min</strong>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          {fabricBom?.status === 'RECEIVED' ? 'Fabric In-House' : 'Fabric Sourced'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {existing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Synced ({existing.orderNumber})
                          </span>
                          <button
                            onClick={() => handleSyncSingleBuyerOrder(bo)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer text-xs"
                          >
                            Re-Sync
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSyncSingleBuyerOrder(bo)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Import to Plan</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Production Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingOrder ? 'Edit Production Order' : 'Create New Production Order'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {validationError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Quick Auto-fill from Buyer Orders dropdown */}
            {!editingOrder && buyerOrders.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl">
                <label className="block text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Auto-Fill from Confirmed Buyer Order:</span>
                </label>
                <select
                  onChange={(e) => handleAutoFillFromBuyerOrder(e.target.value)}
                  defaultValue=""
                  className="w-full text-xs p-2 rounded-lg border border-blue-200 bg-white text-slate-800 font-medium"
                >
                  <option value="" disabled>-- Select a Buyer PO to auto-populate fields --</option>
                  {buyerOrders.map((bo) => (
                    <option key={bo.id} value={bo.orderNumber}>
                      {bo.orderNumber} - {bo.buyerName} | {bo.styleNumber} ({bo.orderQuantity.toLocaleString()} pcs)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Production Order # *</label>
                  <input
                    type="text"
                    required
                    value={formData.orderNumber || ''}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="PRD-ORD-2026-001"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer PO Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.po || ''}
                    onChange={(e) => setFormData({ ...formData, po: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="PO-HM-99201"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Buyer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.buyer || ''}
                    onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="H&M, Zara, etc."
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Style Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.style || ''}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="STY-TS-2026"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Product Description</label>
                  <input
                    type="text"
                    value={formData.product || ''}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Men Heavyweight Cotton Crewneck Tee"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Product Category</label>
                  <select
                    value={formData.productCategory || 'Knit Tops'}
                    onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
                  >
                    <option value="Knit Tops">Knit Tops (T-Shirts, Polos)</option>
                    <option value="Fleece Outerwear">Fleece Outerwear (Hoodies, Sweatshirts)</option>
                    <option value="Denim Bottoms">Denim Bottoms (5-Pocket Jeans)</option>
                    <option value="Woven Tops">Woven Tops (Dress & Casual Shirts)</option>
                    <option value="Activewear Bottoms">Activewear (Leggings, Joggers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer Order Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.orderQuantity || ''}
                    onChange={(e) => handleOrderQtyChange(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Planned Quantity (Includes Cutting Allowance) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.plannedQuantity || ''}
                    onChange={(e) => setFormData({ ...formData, plannedQuantity: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Garment SMV (Minutes)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.smv || 11.2}
                    onChange={(e) => setFormData({ ...formData, smv: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Sewing Line</label>
                  <select
                    value={formData.assignedLine || 'Sewing Line 01'}
                    onChange={(e) => setFormData({ ...formData, assignedLine: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
                  >
                    {lines && lines.length > 0 ? (
                      lines.map((l) => (
                        <option key={l.id} value={l.name}>
                          {l.name} ({l.lineCode} &bull; {l.unitName})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Sewing Line 01 (Knit Tops)">Sewing Line 01 (Knit Tops)</option>
                        <option value="Sewing Line 02 (Knit Polo & Fleece)">Sewing Line 02 (Knit Polo & Fleece)</option>
                        <option value="Sewing Line 03 (Woven Bottoms)">Sewing Line 03 (Woven Bottoms)</option>
                        <option value="Sewing Line 04 (Heavy Denim)">Sewing Line 04 (Heavy Denim)</option>
                        <option value="Sewing Line 05 (Casual Shirts)">Sewing Line 05 (Casual Shirts)</option>
                        <option value="Sewing Line 06 (Undergarments & Lingerie)">Sewing Line 06 (Undergarments & Lingerie)</option>
                        <option value="Sewing Line 07 (Activewear & Sports)">Sewing Line 07 (Activewear & Sports)</option>
                        <option value="Sewing Line 08 (Outerwear Jackets)">Sewing Line 08 (Outerwear Jackets)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Production Start Date</label>
                  <input
                    type="date"
                    value={formData.productionStartDate || ''}
                    onChange={(e) => setFormData({ ...formData, productionStartDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ex-Factory Delivery Date</label>
                  <input
                    type="date"
                    value={formData.deliveryDate || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-semibold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fabric & Trims Status</label>
                  <input
                    type="text"
                    value={formData.fabricStatus || ''}
                    onChange={(e) => setFormData({ ...formData, fabricStatus: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                    placeholder="100% In-House - Passed 4-Point"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Order Status</label>
                  <select
                    value={formData.status || 'PLANNED'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductionOrderStatus })}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PLANNED">PLANNED</option>
                    <option value="RELEASED">RELEASED</option>
                    <option value="IN_PRODUCTION">IN PRODUCTION</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Technical &amp; Planning Remarks</label>
                <textarea
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                  placeholder="Material specs, PP sample notes, over-allowance buffer..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {editingOrder ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
