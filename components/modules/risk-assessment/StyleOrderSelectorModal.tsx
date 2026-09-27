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
  AlertCircle,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { BuyerOrder } from '@/lib/types/modules';
import { MOCK_BUYER_ORDERS } from '@/lib/db/modules-mock-data';

interface StyleOrderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: BuyerOrder) => void;
  selectedOrderId?: string;
  selectedStyleNumber?: string;
}

export function StyleOrderSelectorModal({
  isOpen,
  onClose,
  onSelectOrder,
  selectedOrderId,
  selectedStyleNumber,
}: StyleOrderSelectorModalProps) {
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
        console.warn('Failed parsing stored buyer orders in selector modal:', err);
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
      // Buyer filter
      if (buyerFilter !== 'ALL' && order.buyerName !== buyerFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesStyle = order.styleNumber?.toLowerCase().includes(query);
        const matchesDesc = order.styleDescription?.toLowerCase().includes(query);
        const matchesOrder = order.orderNumber?.toLowerCase().includes(query);
        const matchesBuyer = order.buyerName?.toLowerCase().includes(query);
        const matchesBrand = order.brand?.toLowerCase().includes(query);
        const matchesSeason = order.season?.toLowerCase().includes(query);
        if (
          !matchesStyle &&
          !matchesDesc &&
          !matchesOrder &&
          !matchesBuyer &&
          !matchesBrand &&
          !matchesSeason
        ) {
          return false;
        }
      }
      return true;
    });
  }, [orders, buyerFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Select Product / Style from Buyer &amp; Order Module
              </h3>
              <p className="text-xs text-slate-500">
                Link this risk assessment directly to an approved order style, PO number, and buyer specs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search style number (e.g. STY-TS-2026), PO#, product description, or buyer..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Buyer Select Filter */}
            <div className="w-full sm:w-64 shrink-0">
              <select
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Buyers ({uniqueBuyers.length})</option>
                {uniqueBuyers.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Buyer Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick Filter:</span>
            <button
              type="button"
              onClick={() => setBuyerFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                buyerFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({orders.length})
            </button>
            {uniqueBuyers.map((b) => {
              const count = orders.filter((o) => o.buyerName === b).length;
              const isSelected = buyerFilter === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBuyerFilter(b)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 truncate max-w-[180px] ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={b}
                >
                  {b} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders / Styles Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-h-[58vh]">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No matching style or order found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try searching for another style code, PO number, or reset your buyer filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setBuyerFilter('ALL');
                }}
                className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredOrders.map((order) => {
                const isCurrent =
                  (selectedOrderId && order.id === selectedOrderId) ||
                  (selectedStyleNumber && order.styleNumber === selectedStyleNumber);

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      onSelectOrder(order);
                      onClose();
                    }}
                    className={`relative group rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Thumbnail & Style Identifiers */}
                    <div className="flex items-start gap-3">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                        {order.productImage ? (
                          <img
                            src={order.productImage}
                            alt={order.styleNumber}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Package className="w-7 h-7 text-slate-400" />
                        )}
                      </div>

                      {/* Style Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {order.styleNumber}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {order.orderNumber}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" /> Selected
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {order.styleDescription || 'Garment Product Style'}
                        </h4>

                        <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5 truncate">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700">{order.buyerName}</span>
                          {order.brand && (
                            <span className="text-slate-400">({order.brand})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata Badges */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-500">
                        {order.season && (
                          <span className="font-medium bg-slate-50 px-1.5 py-0.5 rounded-md">
                            {order.season}
                          </span>
                        )}
                        {order.orderQuantity && (
                          <span className="font-mono font-semibold text-slate-700">
                            {order.orderQuantity.toLocaleString()} pcs
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
                        }`}
                      >
                        <span>{isCurrent ? 'Current' : 'Select'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 text-xs">
          <span className="text-slate-500">
            Showing <strong className="text-slate-800">{filteredOrders.length}</strong> styles from Buyer &amp; Order module
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
