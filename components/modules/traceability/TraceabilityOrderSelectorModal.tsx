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

interface TraceabilityOrderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: BuyerOrder) => void;
  selectedPoNumber?: string;
  selectedStyleNumber?: string;
}

export function TraceabilityOrderSelectorModal({
  isOpen,
  onClose,
  onSelectOrder,
  selectedPoNumber,
  selectedStyleNumber,
}: TraceabilityOrderSelectorModalProps) {
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
                Choose a purchase order or style article to automatically populate traceability custody records
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

            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setBuyerFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  buyerFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Buyers
              </button>
              {uniqueBuyers.map((buyer) => (
                <button
                  key={buyer}
                  type="button"
                  onClick={() => setBuyerFilter(buyer)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    buyerFilter === buyer
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {buyer.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List of Orders */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1 max-h-[55vh]">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No matching POs or styles found</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setBuyerFilter('ALL');
                }}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected =
                (selectedPoNumber && order.orderNumber === selectedPoNumber) ||
                (selectedStyleNumber && order.styleNumber === selectedStyleNumber);

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    onSelectOrder(order);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                      {order.productImage ? (
                        <img
                          src={order.productImage}
                          alt={order.styleNumber}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {order.orderNumber}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {order.styleNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {order.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-800 mt-1 truncate">
                        {order.styleDescription || 'Apparel Article'}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-slate-700">{order.buyerName}</span>
                        </span>
                        <span>•</span>
                        <span>Qty: <strong className="text-slate-800 font-mono">{order.orderQuantity?.toLocaleString()} pcs</strong></span>
                        {order.season && (
                          <>
                            <span>•</span>
                            <span>{order.season}</span>
                          </>
                        )}
                        {order.shipDate && (
                          <>
                            <span>•</span>
                            <span>Ship: {order.shipDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-500">
          <span>Click any order to sync PO Number, Article, and Buyer details.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
