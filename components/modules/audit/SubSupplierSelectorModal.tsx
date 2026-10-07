'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Check,
  Building2,
  Filter,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Tag,
  Sparkles,
} from 'lucide-react';
import { SubSupplier } from '@/lib/types/modules';
import { MOCK_SUB_SUPPLIERS } from '@/lib/db/modules-mock-data';

interface SubSupplierSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSupplier: (supplier: SubSupplier) => void;
  selectedSupplierId?: string;
  selectedSupplierName?: string;
}

export function SubSupplierSelectorModal({
  isOpen,
  onClose,
  onSelectSupplier,
  selectedSupplierId,
  selectedSupplierName,
}: SubSupplierSelectorModalProps) {
  // Load suppliers from localStorage or fallback to MOCK_SUB_SUPPLIERS
  const [suppliers, setSuppliers] = useState<SubSupplier[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('erp_sub_suppliers_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed parsing stored sub-suppliers:', err);
      }
    }
    return MOCK_SUB_SUPPLIERS;
  });

  // Listen to live updates from SubSupplier module
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('erp_sub_suppliers_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSuppliers(parsed);
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('erp_sub_suppliers_updated', handleUpdate);
    return () => window.removeEventListener('erp_sub_suppliers_updated', handleUpdate);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      if (categoryFilter !== 'ALL' && supplier.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && supplier.complianceStatus !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = supplier.name.toLowerCase().includes(q);
        const matchesCode = supplier.code.toLowerCase().includes(q);
        const matchesCountry = supplier.country.toLowerCase().includes(q);
        const matchesLocation = supplier.facilityLocation?.toLowerCase().includes(q);
        const matchesContact = supplier.contactPerson.toLowerCase().includes(q);
        const matchesEmail = supplier.email.toLowerCase().includes(q);
        const matchesMaterials = supplier.materialsSupplied?.some((m) => m.toLowerCase().includes(q));
        const matchesCerts = supplier.certifications?.some((c) => c.toLowerCase().includes(q));
        return (
          matchesName ||
          matchesCode ||
          matchesCountry ||
          matchesLocation ||
          matchesContact ||
          matchesEmail ||
          matchesMaterials ||
          matchesCerts
        );
      }
      return true;
    });
  }, [suppliers, categoryFilter, statusFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Select Sub-Supplier from SubSupplier Module
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  {suppliers.length} Registered Vendors
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose an audited vendor partner to auto-sync vendor code, facility location, contact details, and compliance rating
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

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by vendor name, code, contact person, country, or certification..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">All Categories</option>
                <option value="FABRIC_MILL">Fabric Mill</option>
                <option value="DYEING_HOUSE">Dyeing & Finishing House</option>
                <option value="TRIMS_BUTTONS">Trims & Buttons</option>
                <option value="ZIPPERS">Zippers</option>
                <option value="LABELS_PACKAGING">Labels & Packaging</option>
                <option value="THREAD_MILL">Thread Mill</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">All Compliance Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PROVISIONAL">Provisional</option>
                <option value="AUDIT_PENDING">Audit Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendors List Body */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No sub-suppliers found matching "{searchQuery}".
            </div>
          ) : (
            filteredSuppliers.map((supplier) => {
              const isSelected =
                supplier.id === selectedSupplierId ||
                supplier.name.toLowerCase() === (selectedSupplierName || '').toLowerCase();

              const categoryBadge =
                supplier.category === 'FABRIC_MILL'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : supplier.category === 'DYEING_HOUSE'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : supplier.category === 'ZIPPERS'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : supplier.category === 'TRIMS_BUTTONS'
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : supplier.category === 'LABELS_PACKAGING'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200';

              return (
                <div
                  key={supplier.id}
                  onClick={() => {
                    onSelectSupplier(supplier);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Logo / Avatar */}
                    {supplier.logoUrl ? (
                      <img
                        src={supplier.logoUrl}
                        alt={supplier.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 border border-slate-200 text-sm">
                        {supplier.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate" title={supplier.name}>
                          {supplier.name}
                        </h4>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {supplier.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryBadge}`}>
                          {supplier.category.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            supplier.complianceStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {supplier.complianceStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{supplier.facilityLocation || supplier.country}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{supplier.contactPerson} ({supplier.phone})</span>
                        </span>
                      </div>

                      {supplier.certifications && supplier.certifications.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {supplier.certifications.slice(0, 3).map((cert, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded"
                            >
                              {cert}
                            </span>
                          ))}
                          {supplier.certifications.length > 3 && (
                            <span className="text-[10px] text-slate-400">
                              +{supplier.certifications.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating & Select Action */}
                  <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Score</span>
                        <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {supplier.auditScore}%
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                        Grade: <strong className="text-blue-700">{supplier.qualityRating}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <span>Select Sub-Supplier</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="font-mono text-slate-800">{filteredSuppliers.length}</strong> of {suppliers.length} vendors synced from SubSupplier module
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
