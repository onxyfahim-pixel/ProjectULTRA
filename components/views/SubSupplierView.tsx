'use client';

import React, { useState } from 'react';
import {
  Building2,
  Award,
  ShieldCheck,
  Clock,
  Mail,
  Phone,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  LayoutGrid,
  List,
  Factory,
  Check,
  User,
  UserCheck,
  Layers,
  MapPin,
  ExternalLink,
  FileCheck,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { SubSupplier } from '@/lib/types/modules';
import { MOCK_SUB_SUPPLIERS } from '@/lib/db/modules-mock-data';
import { AddSubSupplierModal } from '../modules/sub-supplier/AddSubSupplierModal';
import { SubSupplierDetailsPage } from '../modules/sub-supplier/SubSupplierDetailsPage';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';

type SupplierSubView =
  | { type: 'none' }
  | { type: 'details'; supplier: SubSupplier };

export function SubSupplierView() {
  const [viewMode, setViewMode] = useState<'summary' | 'list' | 'profiles'>('summary');
  const [suppliers, setSuppliers] = useState<SubSupplier[]>(MOCK_SUB_SUPPLIERS);

  // Dedicated Separate Page for Supplier Details
  const [supplierSubView, setSupplierSubView] = useState<SupplierSubView>({ type: 'none' });

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    suppliers: SubSupplier[];
  } | null>(null);

  // Add / Edit Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<SubSupplier | null>(null);

  // Grid vs Table layout mode in Vendor Profiles tab
  const [profileViewType, setProfileViewType] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [complianceFilter, setComplianceFilter] = useState('ALL');
  const [profileSearch, setProfileSearch] = useState('');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalSuppliers = suppliers.length;
  const approvedCount = suppliers.filter((s) => s.complianceStatus === 'APPROVED').length;
  const avgAuditScore = (
    suppliers.reduce((sum, s) => sum + s.auditScore, 0) / (suppliers.length || 1)
  ).toFixed(1);
  const avgLeadTime = (
    suppliers.reduce((sum, s) => sum + s.leadTimeDays, 0) / (suppliers.length || 1)
  ).toFixed(1);

  // CRUD Handlers
  const handleSaveSupplier = (supplierData: Partial<SubSupplier>) => {
    if (supplierToEdit) {
      const updated = suppliers.map((s) =>
        s.id === supplierToEdit.id ? ({ ...s, ...supplierData } as SubSupplier) : s
      );
      setSuppliers(updated);
      if (supplierSubView.type === 'details' && supplierSubView.supplier.id === supplierToEdit.id) {
        setSupplierSubView({ type: 'details', supplier: { ...supplierSubView.supplier, ...supplierData } as SubSupplier });
      }
      showToast(`Updated sub-supplier ${supplierData.name}`);
    } else {
      const newSupplier: SubSupplier = {
        id: `sup-${Date.now().toString().slice(-4)}`,
        code: supplierData.code || `SUP-NEW-${Math.floor(100 + Math.random() * 900)}`,
        name: supplierData.name || 'New Mill Partner Ltd',
        category: supplierData.category || 'FABRIC_MILL',
        country: supplierData.country || 'Bangladesh',
        facilityLocation: supplierData.facilityLocation || 'Industrial Hub',
        contactPerson: supplierData.contactPerson || 'Key Account Rep',
        email: supplierData.email || 'mill.rep@supplychain.com',
        phone: supplierData.phone || '+880 1711 000000',
        qualityRating: supplierData.qualityRating || 'A+',
        complianceStatus: supplierData.complianceStatus || 'APPROVED',
        auditScore: supplierData.auditScore || 95.0,
        leadTimeDays: supplierData.leadTimeDays || 14,
        logoUrl: supplierData.logoUrl || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=150&auto=format&fit=crop&q=60',
        capacityPerMonth: supplierData.capacityPerMonth || '1,500,000 Yards',
        onTimeDeliveryRate: supplierData.onTimeDeliveryRate || 98.5,
        defectRatePercent: supplierData.defectRatePercent || 0.5,
        assignedQALead: supplierData.assignedQALead || 'Tariqul Islam (Fabric QA)',
        assignedQAEmail: supplierData.assignedQAEmail || 'tariqul.fabric@texexport.com',
        assignedQAPhone: supplierData.assignedQAPhone || '+880 1711 902341',
        moq: supplierData.moq || '1,000 Yards',
        paymentTerms: supplierData.paymentTerms || 'LC 60 Days',
        certifications: supplierData.certifications || [
          'OEKO-TEX Standard 100',
          'Higg Facility Environmental Module (FEM 3.0)',
          'ISO 9001:2015',
        ],
        materialsSupplied: supplierData.materialsSupplied || ['Combed Cotton Single Jersey 180 GSM'],
      };
      setSuppliers([newSupplier, ...suppliers]);
      showToast(`Registered new sub-supplier ${newSupplier.name}`);
    }
    setIsAddModalOpen(false);
    setSupplierToEdit(null);
  };

  const handleDuplicateSupplier = (supplier: SubSupplier) => {
    const duplicated: SubSupplier = {
      ...supplier,
      id: `sup-dup-${Date.now().toString().slice(-4)}`,
      code: `${supplier.code}-CPY`,
      name: `${supplier.name} (Copy)`,
    };
    setSuppliers([duplicated, ...suppliers]);
    showToast(`Duplicated supplier as ${duplicated.code}`);
  };

  const confirmDeleteSuppliers = () => {
    if (!deleteModal || deleteModal.suppliers.length === 0) return;
    const idsToDelete = new Set(deleteModal.suppliers.map((s) => s.id));
    setSuppliers((prev) => prev.filter((s) => !idsToDelete.has(s.id)));

    if (supplierSubView.type === 'details' && idsToDelete.has(supplierSubView.supplier.id)) {
      setSupplierSubView({ type: 'none' });
    }

    const count = deleteModal.suppliers.length;
    showToast(
      count === 1
        ? `Deleted sub-supplier ${deleteModal.suppliers[0].name}`
        : `Deleted ${count} sub-suppliers successfully`
    );
    setDeleteModal(null);
  };

  // Filtered Suppliers for List view
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesCompliance = complianceFilter === 'ALL' || s.complianceStatus === complianceFilter;
    return matchesCategory && matchesCompliance;
  });

  // Filtered Suppliers for Profiles Grid view
  const profileFilteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(profileSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(profileSearch.toLowerCase()) ||
      s.country.toLowerCase().includes(profileSearch.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(profileSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(profileSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesCompliance = complianceFilter === 'ALL' || s.complianceStatus === complianceFilter;
    return matchesSearch && matchesCategory && matchesCompliance;
  });

  // Table Columns Definition matching Buyer & Order module design
  const columns: ColumnDef<SubSupplier>[] = [
    {
      key: 'name',
      header: 'Supplier / Mill',
      accessorKey: 'name',
      sortable: true,
      accessor: (item) => item.name,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
            {item.logoUrl ? (
              <img src={item.logoUrl} alt={item.name} className="w-full h-full object-contain rounded-lg" />
            ) : (
              <Building2 className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-900 text-xs block truncate">{item.name}</span>
            <div className="text-[10px] text-slate-500 font-mono">
              <span className="text-blue-700 font-bold">{item.code}</span> • {item.country}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Material Category',
      accessorKey: 'category',
      sortable: true,
      accessor: (item) => item.category,
      filterOptions: [
        { label: 'Fabric Mill', value: 'FABRIC_MILL' },
        { label: 'Dyeing House', value: 'DYEING_HOUSE' },
        { label: 'Zippers', value: 'ZIPPERS' },
        { label: 'Thread Mill', value: 'THREAD_MILL' },
        { label: 'Labels & Packaging', value: 'LABELS_PACKAGING' },
        { label: 'Trims & Buttons', value: 'TRIMS_BUTTONS' },
      ],
      cell: (item) => (
        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200">
          {item.category.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'qualityRating',
      header: 'QMS Grade',
      accessorKey: 'qualityRating',
      sortable: true,
      accessor: (item) => item.qualityRating,
      align: 'center',
      cell: (item) => (
        <span
          className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border ${
            item.qualityRating === 'A+'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : item.qualityRating === 'A'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          Grade {item.qualityRating}
        </span>
      ),
    },
    {
      key: 'auditScore',
      header: 'Audit Score',
      accessorKey: 'auditScore',
      sortable: true,
      accessor: (item) => item.auditScore,
      align: 'right',
      cell: (item) => (
        <div className="text-right">
          <span className="font-mono font-bold text-xs text-slate-900">
            {item.auditScore.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Higg / Technical</span>
        </div>
      ),
    },
    {
      key: 'leadTimeDays',
      header: 'Lead Time',
      accessorKey: 'leadTimeDays',
      sortable: true,
      accessor: (item) => item.leadTimeDays,
      align: 'right',
      cell: (item) => (
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-blue-700">
            {item.leadTimeDays} days
          </span>
          <span className="text-[10px] text-slate-400 block">From PO</span>
        </div>
      ),
    },
    {
      key: 'complianceStatus',
      header: 'Compliance Status',
      accessorKey: 'complianceStatus',
      sortable: true,
      accessor: (item) => item.complianceStatus,
      filterOptions: [
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Provisional', value: 'PROVISIONAL' },
        { label: 'Audit Pending', value: 'AUDIT_PENDING' },
        { label: 'Blacklisted', value: 'BLACKLISTED' },
      ],
      cell: (item) => {
        const variantMap: Record<string, any> = {
          APPROVED: 'emerald',
          PROVISIONAL: 'amber',
          AUDIT_PENDING: 'blue',
          BLACKLISTED: 'rose',
        };
        return <StatusBadge label={item.complianceStatus.replace('_', ' ')} variant={variantMap[item.complianceStatus] || 'neutral'} />;
      },
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      accessorKey: 'contactPerson',
      sortable: true,
      accessor: (item) => item.contactPerson,
      cell: (item) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{item.contactPerson}</div>
          <div className="text-[11px] text-slate-500 font-mono">{item.email}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* 1. View / Details Button */}
          <button
            type="button"
            onClick={() => setSupplierSubView({ type: 'details', supplier: row })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Sub-Supplier Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* 2. Edit Button */}
          <button
            type="button"
            onClick={() => {
              setSupplierToEdit(row);
              setIsAddModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Sub-Supplier"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* 3. Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateSupplier(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate Sub-Supplier"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* 4. Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, suppliers: [row] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Sub-Supplier"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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

      {/* TOP HEADER: Clean 3-tab layout matching Buyer & Order module */}
      <ModuleHeader
        title="Sub-Supplier & Vendor Management"
        activeView={supplierSubView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSupplierSubView({ type: 'none' });
          setViewMode(mode as 'summary' | 'list' | 'profiles');
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Supplier Matrix', count: suppliers.length },
          { id: 'profiles', label: 'Vendor Profiles', count: suppliers.length },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGE IF ACTIVE */}
      {supplierSubView.type === 'details' ? (
        <SubSupplierDetailsPage
          supplier={supplierSubView.supplier}
          onBack={() => setSupplierSubView({ type: 'none' })}
          onEdit={(sup) => {
            setSupplierToEdit(sup);
            setIsAddModalOpen(true);
          }}
          onDuplicate={(sup) => {
            handleDuplicateSupplier(sup);
            setSupplierSubView({ type: 'none' });
          }}
          onDelete={(sup) => {
            setDeleteModal({ isOpen: true, suppliers: [sup] });
          }}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Cards matching Buyer & Order design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Qualified Sub-Suppliers"
                  value={totalSuppliers.toString()}
                  subtitle="Tier-2 Certified Mills"
                  icon={Building2}
                  tone="blue"
                  delta={{ value: '+12.5%', isPositive: true }}
                />
                <StatCard
                  title="Approved Compliance"
                  value={`${approvedCount} / ${totalSuppliers}`}
                  subtitle="ISO 9001 & Higg FEM Ready"
                  icon={ShieldCheck}
                  tone="emerald"
                  delta={{ value: '+8.2%', isPositive: true }}
                />
                <StatCard
                  title="Avg Technical Audit"
                  value={`${avgAuditScore}%`}
                  subtitle="QMS Quality Rating Benchmark"
                  icon={Award}
                  tone="indigo"
                  delta={{ value: '+3.4%', isPositive: true }}
                />
                <StatCard
                  title="Avg Sourcing Lead Time"
                  value={`${avgLeadTime} Days`}
                  subtitle="From Mill PO to Factory Gate"
                  icon={Clock}
                  tone="amber"
                  delta={{ value: '-2.1 days', isPositive: true }}
                />
              </div>

              {/* Status Breakdown & Top Certified Mills Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {/* Sourcing Category Breakdown */}
                <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Vendor Sourcing by Material Category
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Open Supplier Matrix →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'FABRIC_MILL', label: 'Fabric Mills', color: 'bg-blue-600' },
                      { key: 'DYEING_HOUSE', label: 'Dyeing & Finishing', color: 'bg-indigo-600' },
                      { key: 'ZIPPERS', label: 'Zippers & Sliders', color: 'bg-emerald-600' },
                      { key: 'THREAD_MILL', label: 'Thread Mills', color: 'bg-purple-600' },
                      { key: 'LABELS_PACKAGING', label: 'Labels & Packaging', color: 'bg-amber-600' },
                      { key: 'TRIMS_BUTTONS', label: 'Buttons & Hardware', color: 'bg-rose-600' },
                    ].map((cat) => {
                      const count = suppliers.filter((s) => s.category === cat.key).length;
                      const pct = Math.round((count / (suppliers.length || 1)) * 100);

                      return (
                        <div
                          key={cat.key}
                          onClick={() => {
                            setCategoryFilter(cat.key);
                            setViewMode('list');
                          }}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                              {count} Mills
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`${cat.color} h-full rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {pct}% of active sourcing base
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Certified Mills Widget */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Top Certified Mills</h3>
                    <button
                      type="button"
                      onClick={() => setViewMode('profiles')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      All Profiles →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {suppliers.slice(0, 4).map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSupplierSubView({ type: 'details', supplier: s })}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg border border-slate-200 bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                            {s.logoUrl ? (
                              <img src={s.logoUrl} alt={s.name} className="w-full h-full object-contain rounded-md" />
                            ) : (
                              <Building2 className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{s.name}</div>
                            <div className="text-[10px] text-slate-500">{s.country} • {s.category.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono font-bold text-emerald-700">
                            {s.auditScore.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">{s.leadTimeDays}d lead</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUPPLIER MATRIX LIST (ONE UNIFIED SEARCH & FILTER BAR WITH ACCENDING/DESCENDING SORTING) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="sub-suppliers-table"
                data={filteredSuppliers}
                columns={columns}
                searchPlaceholder="Search vendor by name, code, material, country, or contact..."
                searchableKeys={[
                  'name',
                  'code',
                  'category',
                  'country',
                  'contactPerson',
                  'email',
                  'qualityRating',
                  'complianceStatus',
                ]}
                secondaryAction={
                  <div className="flex items-center gap-2">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="FABRIC_MILL">Fabric Mills</option>
                      <option value="DYEING_HOUSE">Dyeing Houses</option>
                      <option value="ZIPPERS">Zippers</option>
                      <option value="THREAD_MILL">Thread Mills</option>
                      <option value="LABELS_PACKAGING">Labels &amp; Packaging</option>
                      <option value="TRIMS_BUTTONS">Trims &amp; Buttons</option>
                    </select>

                    <select
                      value={complianceFilter}
                      onChange={(e) => setComplianceFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Compliance</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PROVISIONAL">Provisional</option>
                      <option value="AUDIT_PENDING">Audit Pending</option>
                      <option value="BLACKLISTED">Blacklisted</option>
                    </select>
                  </div>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => {
                      setSupplierToEdit(null);
                      setIsAddModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sub-Supplier</span>
                  </button>
                }
                batchActions={[
                  {
                    label: 'Delete Selected',
                    variant: 'danger',
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      setDeleteModal({
                        isOpen: true,
                        suppliers: selected,
                      });
                    },
                  },
                  {
                    label: 'Export Selected',
                    onClick: (selected) => {
                      showToast(`Exported ${selected.length} sub-suppliers`);
                    },
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 3: VENDOR PROFILES (WITH ADD SUPPLIER BUTTON & GRID/TABLE VIEW TOGGLE) */}
          {viewMode === 'profiles' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* GRID VIEW RENDERING */}
              {profileViewType === 'grid' && (
                <>
                  {/* Toolbar for Grid View matching Buyer & Order module */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {/* Search */}
                      <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search vendor name, code, material..."
                          value={profileSearch}
                          onChange={(e) => setProfileSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Category Filter */}
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="FABRIC_MILL">Fabric Mills</option>
                        <option value="DYEING_HOUSE">Dyeing Houses</option>
                        <option value="ZIPPERS">Zippers</option>
                        <option value="THREAD_MILL">Thread Mills</option>
                        <option value="LABELS_PACKAGING">Labels &amp; Packaging</option>
                        <option value="TRIMS_BUTTONS">Trims &amp; Buttons</option>
                      </select>

                      {/* Compliance Filter */}
                      <select
                        value={complianceFilter}
                        onChange={(e) => setComplianceFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                      >
                        <option value="ALL">All Compliance</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PROVISIONAL">Provisional</option>
                        <option value="AUDIT_PENDING">Audit Pending</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* GRID VS TABLE TOGGLE matching Buyer & Order module */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setProfileViewType('grid')}
                          className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white text-blue-600 shadow-xs"
                          title="Grid Card View"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Grid</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileViewType('table')}
                          className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
                          title="Table List View"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Table</span>
                        </button>
                      </div>

                      {/* ADD SUB-SUPPLIER BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setSupplierToEdit(null);
                          setIsAddModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Sub-Supplier</span>
                      </button>
                    </div>
                  </div>

                  {/* Vendor Cards Grid matching Buyer & Order card styling */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {profileFilteredSuppliers.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3.5 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Card Header with Logo & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                                {s.logoUrl ? (
                                  <img
                                    src={s.logoUrl}
                                    alt={s.name}
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                ) : (
                                  <Building2 className="w-6 h-6 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-mono text-[10px] font-bold text-blue-700 uppercase">
                                  {s.code}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                  {s.name}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  {s.country} • {s.category.replace(/_/g, ' ')}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                s.qualityRating === 'A+'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : s.qualityRating === 'A'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              Grade {s.qualityRating}
                            </span>
                          </div>

                          {/* Technical & Sourcing Metrics Stats */}
                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Audit Score</span>
                              <span className="font-bold text-slate-900 text-xs font-mono">
                                {s.auditScore.toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Lead Time</span>
                              <span className="font-bold text-blue-700 text-xs font-mono">
                                {s.leadTimeDays} Days
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">On-Time SLA</span>
                              <span className="font-bold text-emerald-700 text-xs font-mono">
                                {s.onTimeDeliveryRate || 98.5}%
                              </span>
                            </div>
                          </div>

                          {/* Assigned In-House QA Lead matching Buyer Card's Merchandiser */}
                          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/90 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-blue-950 flex items-center gap-1.5 truncate">
                                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="truncate">{s.assignedQALead || 'Assigned QA Lead'}</span>
                              </div>
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded shrink-0">
                                QA Lead
                              </span>
                            </div>
                            <div className="text-slate-600 truncate flex items-center gap-1.5 text-[10px]">
                              {s.assignedQAEmail && <span className="truncate">{s.assignedQAEmail}</span>}
                              {s.assignedQAEmail && s.assignedQAPhone && <span className="text-slate-300">•</span>}
                              {s.assignedQAPhone && <span className="font-mono text-slate-700 shrink-0">{s.assignedQAPhone}</span>}
                            </div>
                          </div>

                          {/* Primary Mill Contact */}
                          <div className="text-[11px] space-y-0.5 pt-0.5 text-slate-600">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="text-[10px] text-slate-400 font-normal">Contact:</span>
                              <span className="truncate">{s.contactPerson}</span>
                            </div>
                            <div className="text-slate-500 truncate text-[10px] pl-5">{s.email} • {s.phone}</div>
                          </div>

                          {/* Environmental Accreditations Chips */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Verified Accreditations:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {(s.certifications || ['OEKO-TEX 100', 'Higg FEM 3.0', 'ISO 9001']).slice(0, 2).map((p, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-medium border border-blue-100 truncate max-w-[200px]"
                                >
                                  {p}
                                </span>
                              ))}
                              {(s.certifications?.length || 3) > 2 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                                  +{(s.certifications?.length || 3) - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions matching Buyer card */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-[10px] text-slate-500 font-mono">
                            Terms: {s.paymentTerms || 'LC 60 Days'}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSupplierToEdit(s);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                              title="Edit Supplier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, suppliers: [s] })}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                              title="Delete Supplier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSupplierSubView({ type: 'details', supplier: s })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <span>Mill Profile</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TABLE VIEW RENDERING WITH DATATABLE SORTING & CSV EXPORT */}
              {profileViewType === 'table' && (
                <DataTable
                  id="sub-suppliers-profile-table"
                  data={suppliers}
                  columns={columns}
                  searchPlaceholder="Search vendor by name, code, country, or contact..."
                  searchableKeys={['name', 'code', 'country', 'contactPerson', 'category', 'email']}
                  secondaryAction={
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setProfileViewType('grid')}
                        className="p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
                        title="Grid Card View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileViewType('table')}
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
                        setSupplierToEdit(null);
                        setIsAddModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Sub-Supplier</span>
                    </button>
                  }
                  batchActions={[
                    {
                      label: 'Delete Selected',
                      variant: 'danger',
                      icon: <Trash2 className="w-3.5 h-3.5" />,
                      onClick: (selected) => {
                        setDeleteModal({
                          isOpen: true,
                          suppliers: selected,
                        });
                      },
                    },
                    {
                      label: 'Export Selected',
                      onClick: (selected) => {
                        showToast(`Exported ${selected.length} vendors`);
                      },
                    },
                  ]}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* ADD / EDIT SUB-SUPPLIER MODAL */}
      <AddSubSupplierModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSupplierToEdit(null);
        }}
        onSave={handleSaveSupplier}
        initialData={supplierToEdit}
      />

      {/* DELETE CONFIRMATION MODAL matching Buyer & Order module */}
      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title={deleteModal.suppliers.length > 1 ? 'Delete Sub-Suppliers' : 'Delete Sub-Supplier'}
          itemTypeLabel="sub-supplier"
          confirmLabel={deleteModal.suppliers.length > 1 ? 'Delete Sub-Suppliers' : 'Delete Sub-Supplier'}
          items={deleteModal.suppliers.map((s) => ({
            id: s.id,
            title: `${s.name} (${s.code})`,
            subtitle: `${s.category.replace(/_/g, ' ')} • ${s.country}`,
            value: `Grade ${s.qualityRating}`,
          }))}
          onConfirm={confirmDeleteSuppliers}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
