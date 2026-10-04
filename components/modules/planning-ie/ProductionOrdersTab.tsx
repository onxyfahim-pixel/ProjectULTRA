'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  Download,
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
} from 'lucide-react';
import {
  ProductionOrderPlan,
  ProductionOrderStatus,
  PriorityLevel,
} from '@/lib/types/planning-ie';

interface ProductionOrdersTabProps {
  orders: ProductionOrderPlan[];
  onAddOrder: (newOrder: ProductionOrderPlan) => void;
  onUpdateOrder: (updated: ProductionOrderPlan) => void;
  onDeleteOrder: (id: string) => void;
  onDuplicateOrder: (order: ProductionOrderPlan) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
  onPrintOrders: () => void;
}

export function ProductionOrdersTab({
  orders,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onDuplicateOrder,
  onExportCsv,
  onPrintOrders,
}: ProductionOrdersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
  });

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
      remarks: '3% over-allowance buffer added for cutting & rework buffer.',
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

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    // 44. Data Validation Checks
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

          {/* Export CSV */}
          <button
            onClick={() => onExportCsv('Production_Orders_Register.csv', filteredOrders)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Print */}
          <button
            onClick={onPrintOrders}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          {/* New Production Order Button */}
          <button
            onClick={openAddModal}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Production Order</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Strip if selected */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <span className="font-semibold text-blue-900">
            {selectedIds.size} production orders selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const selected = orders.filter((o) => selectedIds.has(o.id));
                onExportCsv('Selected_Production_Orders.csv', selected);
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-800 font-semibold hover:bg-blue-100 cursor-pointer"
            >
              Export Selected
            </button>
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
                <th className="p-3">Order # & PO</th>
                <th className="p-3">Buyer & Style</th>
                <th className="p-3">Product Description</th>
                <th className="p-3">Color / Size Range</th>
                <th className="p-3 text-right">Order Qty</th>
                <th className="p-3 text-right">Planned Qty</th>
                <th className="p-3">Dates (Start &rarr; Delivery)</th>
                <th className="p-3">Assigned Line</th>
                <th className="p-3 text-center">Priority</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    No production orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
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
                      <div className="font-mono text-[11px] text-slate-500 font-medium">{ord.po}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{ord.buyer}</div>
                      <div className="text-[11px] font-mono font-medium text-slate-600">{ord.style}</div>
                    </td>
                    <td className="p-3 text-slate-800">
                      <div>{ord.product}</div>
                      <div className="text-[10px] text-slate-400">{ord.article}</div>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{ord.color}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{ord.sizeRange}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {ord.orderQuantity.toLocaleString()} pcs
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-700">
                      {ord.plannedQuantity.toLocaleString()} pcs
                    </td>
                    <td className="p-3 text-[11px] text-slate-600">
                      <div>Start: {ord.productionStartDate}</div>
                      <div className="font-semibold text-emerald-700">Del: {ord.deliveryDate}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{ord.assignedLine}</td>
                    <td className="p-3 text-center">{renderPriorityBadge(ord.priority)}</td>
                    <td className="p-3 text-center">{renderStatusBadge(ord.status)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onDuplicateOrder(ord)}
                          title="1-Click Duplicate Order"
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(ord)}
                          title="Edit Production Order"
                          className="p-1 hover:bg-slate-100 rounded text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              <div className="p-3 my-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Order Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.orderNumber || ''}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Customer PO # *</label>
                  <input
                    type="text"
                    required
                    value={formData.po || ''}
                    onChange={(e) => setFormData({ ...formData, po: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Buyer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.buyer || ''}
                    onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Style Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.style || ''}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Product / Garment Name</label>
                  <input
                    type="text"
                    value={formData.product || ''}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Article Code</label>
                  <input
                    type="text"
                    value={formData.article || ''}
                    onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Colorway</label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Size Range</label>
                  <input
                    type="text"
                    value={formData.sizeRange || ''}
                    onChange={(e) => setFormData({ ...formData, sizeRange: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Order Quantity (pcs) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.orderQuantity || 0}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      setFormData({
                        ...formData,
                        orderQuantity: qty,
                        plannedQuantity: Math.round(qty * 1.03), // 3% auto-allowance
                      });
                    }}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Planned Qty (incl. buffer) *</label>
                  <input
                    type="number"
                    required
                    min={formData.orderQuantity || 1}
                    value={formData.plannedQuantity || 0}
                    onChange={(e) => setFormData({ ...formData, plannedQuantity: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Production Start Date</label>
                  <input
                    type="date"
                    value={formData.productionStartDate || ''}
                    onChange={(e) => setFormData({ ...formData, productionStartDate: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Production End Date</label>
                  <input
                    type="date"
                    value={formData.productionEndDate || ''}
                    onChange={(e) => setFormData({ ...formData, productionEndDate: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Customer Delivery Date</label>
                  <input
                    type="date"
                    value={formData.deliveryDate || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Priority Level</label>
                  <select
                    value={formData.priority || 'HIGH'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Assigned Sewing Line</label>
                  <input
                    type="text"
                    value={formData.assignedLine || ''}
                    onChange={(e) => setFormData({ ...formData, assignedLine: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Lifecycle Status</label>
                  <select
                    value={formData.status || 'PLANNED'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductionOrderStatus })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PLANNED">PLANNED</option>
                    <option value="RELEASED">RELEASED</option>
                    <option value="IN_PRODUCTION">IN PRODUCTION</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Remarks & Special Instructions</label>
                <textarea
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. PP sample approval notes, critical seam folder details..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {editingOrder ? 'Update Order' : 'Save Production Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
