'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Check,
  Package,
  Layers,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { BuyerOrder } from '@/lib/types/modules';
import { MOCK_BUYER_ORDERS } from '@/lib/db/modules-mock-data';

interface CertificateOrderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: BuyerOrder) => void;
  selectedPoNumber?: string;
  selectedStyleNumber?: string;
}

export function CertificateOrderSelectorModal({
  isOpen,
  onClose,
  onSelectOrder,
  selectedPoNumber,
  selectedStyleNumber,
}: CertificateOrderSelectorModalProps) {
  // Load Buyer Orders from localStorage if updated, otherwise fallback to MOCK_BUYER_ORDERS
  const [orders, setOrders] = useState<BuyerOrder[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored =
          localStorage.getItem('erp_buyer_orders_v1') ||
          localStorage.getItem('erp_buyer_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed parsing stored buyer orders in certificate modal:', err);
      }
    }
    return MOCK_BUYER_ORDERS;
  });

  // Keep synced if updated in localStorage
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored =
          localStorage.getItem('erp_buyer_orders_v1') ||
          localStorage.getItem('erp_buyer_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('erp_buyer_orders_updated', handleUpdate);
    return () => window.removeEventListener('erp_buyer_orders_updated', handleUpdate);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('ALL');

  // Unique buyer list
  const uniqueBuyers = useMemo(() => {
    const buyerSet = new Set<string>();
    orders.forEach((o) => {
      if (o.buyerName) buyerSet.add(o.buyerName);
    });
    return Array.from(buyerSet);
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (buyerFilter !== 'ALL' && order.buyerName !== buyerFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesStyle = order.styleNumber?.toLowerCase().includes(query);
        const matchesOrder = order.orderNumber?.toLowerCase().includes(query);
        const matchesBuyer = order.buyerName?.toLowerCase().includes(query);
        const matchesDesc = order.styleDescription?.toLowerCase().includes(query);
        const matchesSeason = order.season?.toLowerCase().includes(query);
        return matchesStyle || matchesOrder || matchesBuyer || matchesDesc || matchesSeason;
      }
      return true;
    });
  }, [orders, buyerFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Select PO / Article from Buyer & Order</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {orders.length} Active Orders
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Link this compliance certificate / test accreditation directly to a purchase order or style article
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PO number, Article / Style, Buyer, or Description..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                autoFocus
              />
            </div>

            {/* Buyer Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Buyers ({orders.length})</option>
                {uniqueBuyers.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching orders found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search query or buyer filter.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected =
                order.orderNumber === selectedPoNumber ||
                order.styleNumber === selectedStyleNumber;

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    onSelectOrder(order);
                    onClose();
                  }}
                  className={`group pt-2.5 first:pt-0 p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-400'
                      : 'bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                          {order.orderNumber}
                        </span>
                        <span className="font-bold text-xs text-slate-900">
                          {order.styleNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[11px] font-semibold text-blue-700">
                          {order.buyerName}
                        </span>
                        {order.brand && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({order.brand})
                          </span>
                        )}
                      </div>

                      <h4
                        className="text-xs font-semibold text-slate-800 mt-1 truncate max-w-lg"
                        title={order.styleDescription}
                      >
                        {order.styleDescription}
                      </h4>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>Qty: </span>
                          <strong className="font-mono text-slate-700">
                            {order.orderQuantity.toLocaleString()} pcs
                          </strong>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Ship Date: </span>
                          <span className="font-mono text-slate-700">
                            {order.shipDate}
                          </span>
                        </span>
                        {order.season && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                              {order.season}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Linked</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white transition-all shadow-xs"
                      >
                        <span>Select Order</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
