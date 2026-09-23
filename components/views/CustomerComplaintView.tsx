'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Edit,
  Copy,
  Trash2,
  Search,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Building2,
  ShieldAlert,
  BarChart3,
  User,
  UserCheck,
  Tag,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { CustomerComplaint } from '@/lib/types/modules';
import { MOCK_CUSTOMER_COMPLAINTS } from '@/lib/db/modules-mock-data';
import { AddComplaintModal } from '../modules/customer-complaint/AddComplaintModal';
import { ComplaintDetailsPage } from '../modules/customer-complaint/ComplaintDetailsPage';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';

type ComplaintSubView =
  | { type: 'none' }
  | { type: 'details'; complaint: CustomerComplaint };

export function CustomerComplaintView() {
  const [viewMode, setViewMode] = useState<'summary' | 'list' | 'capa'>('summary');
  const [complaints, setComplaints] = useState<CustomerComplaint[]>(MOCK_CUSTOMER_COMPLAINTS);

  // Dedicated Separate Page for Complaint Details
  const [complaintSubView, setComplaintSubView] = useState<ComplaintSubView>({ type: 'none' });

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    complaints: CustomerComplaint[];
  } | null>(null);

  // Add / Edit Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [complaintToEdit, setComplaintToEdit] = useState<CustomerComplaint | null>(null);

  // Grid vs Table layout mode in CAPA & 8D Cards tab
  const [capaViewType, setCapaViewType] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [capaSearch, setCapaSearch] = useState('');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalClaimsUSD = complaints.reduce((sum, c) => sum + c.claimAmountUSD, 0);
  const openCount = complaints.filter((c) => c.status !== 'SETTLED' && c.status !== 'REJECTED').length;
  const settledCount = complaints.filter((c) => c.status === 'SETTLED').length;
  const settledRate = complaints.length
    ? Math.round((settledCount / complaints.length) * 100)
    : 100;

  // CRUD Handlers
  const handleSaveComplaint = (complaintData: Partial<CustomerComplaint>) => {
    if (complaintToEdit) {
      const updated = complaints.map((c) =>
        c.id === complaintToEdit.id ? ({ ...c, ...complaintData } as CustomerComplaint) : c
      );
      setComplaints(updated);
      if (complaintSubView.type === 'details' && complaintSubView.complaint.id === complaintToEdit.id) {
        setComplaintSubView({
          type: 'details',
          complaint: { ...complaintSubView.complaint, ...complaintData } as CustomerComplaint,
        });
      }
      showToast(`Updated customer claim ${complaintData.complaintNumber}`);
    } else {
      const newComplaint: CustomerComplaint = {
        id: `cmp-${Date.now().toString().slice(-4)}`,
        complaintNumber: complaintData.complaintNumber || `CLM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        buyerName: complaintData.buyerName || 'H&M Hennes & Mauritz',
        brand: complaintData.brand || 'Main Brand Division',
        poNumber: complaintData.poNumber || 'PO-2026-001',
        styleNumber: complaintData.styleNumber || 'STY-001',
        styleDescription: complaintData.styleDescription || 'Garment Export Style',
        defectCategory: complaintData.defectCategory || 'COLOR_SHADING',
        severity: complaintData.severity || 'MAJOR',
        reportedDate: complaintData.reportedDate || new Date().toISOString().split('T')[0],
        targetResolutionDate: complaintData.targetResolutionDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        claimAmountUSD: complaintData.claimAmountUSD || 1500,
        affectedQuantityPcs: complaintData.affectedQuantityPcs || 500,
        sewingLineOrUnit: complaintData.sewingLineOrUnit || 'Sewing Line 02',
        status: complaintData.status || 'LOGGED',
        rootCauseSummary: complaintData.rootCauseSummary || 'Root cause investigation underway.',
        containmentAction: complaintData.containmentAction || '100% quarantine inspection at warehouse stage.',
        correctiveAction: complaintData.correctiveAction || 'Machine calibration and process parameter adjustment.',
        preventiveAction: complaintData.preventiveAction || 'Updated standard operating procedure and daily audit logs.',
        assignedEngineer: complaintData.assignedEngineer || 'Tanzim Ahmed (QA Manager)',
        engineerEmail: complaintData.engineerEmail || 'tanzim.qa@texexport.com',
        engineerPhone: complaintData.engineerPhone || '+880 1712 334455',
        settlementType: complaintData.settlementType || 'RE_SCREENING',
      };
      setComplaints([newComplaint, ...complaints]);
      showToast(`Logged new customer claim ${newComplaint.complaintNumber}`);
    }
    setIsAddModalOpen(false);
    setComplaintToEdit(null);
  };

  const handleDuplicateComplaint = (complaint: CustomerComplaint) => {
    const duplicated: CustomerComplaint = {
      ...complaint,
      id: `cmp-dup-${Date.now().toString().slice(-4)}`,
      complaintNumber: `${complaint.complaintNumber}-CPY`,
      status: 'LOGGED',
    };
    setComplaints([duplicated, ...complaints]);
    showToast(`Duplicated claim as ${duplicated.complaintNumber}`);
  };

  const confirmDeleteComplaints = () => {
    if (!deleteModal || deleteModal.complaints.length === 0) return;
    const idsToDelete = new Set(deleteModal.complaints.map((c) => c.id));
    setComplaints((prev) => prev.filter((c) => !idsToDelete.has(c.id)));

    if (complaintSubView.type === 'details' && idsToDelete.has(complaintSubView.complaint.id)) {
      setComplaintSubView({ type: 'none' });
    }

    const count = deleteModal.complaints.length;
    showToast(
      count === 1
        ? `Deleted customer claim ${deleteModal.complaints[0].complaintNumber}`
        : `Deleted ${count} claims successfully`
    );
    setDeleteModal(null);
  };

  // Filtered Complaints for List view
  const filteredComplaints = complaints.filter((c) => {
    const matchesSeverity = severityFilter === 'ALL' || c.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  // Filtered Complaints for Cards view
  const capaFilteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.complaintNumber.toLowerCase().includes(capaSearch.toLowerCase()) ||
      c.buyerName.toLowerCase().includes(capaSearch.toLowerCase()) ||
      c.poNumber.toLowerCase().includes(capaSearch.toLowerCase()) ||
      c.styleNumber.toLowerCase().includes(capaSearch.toLowerCase()) ||
      c.defectCategory.toLowerCase().includes(capaSearch.toLowerCase()) ||
      c.assignedEngineer.toLowerCase().includes(capaSearch.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || c.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Table Columns Definition matching Buyer & Order module design
  const columns: ColumnDef<CustomerComplaint>[] = [
    {
      key: 'complaintNumber',
      header: 'Claim ID & Date',
      accessorKey: 'complaintNumber',
      sortable: true,
      accessor: (item) => item.complaintNumber,
      cell: (item) => (
        <div>
          <span className="font-mono font-bold text-rose-700 text-xs block">{item.complaintNumber}</span>
          <div className="text-[10px] text-slate-500 font-mono">{item.reportedDate}</div>
        </div>
      ),
    },
    {
      key: 'buyerName',
      header: 'Buyer & Order PO',
      accessorKey: 'buyerName',
      sortable: true,
      accessor: (item) => item.buyerName,
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{item.buyerName}</span>
          <div className="text-[10px] text-slate-500 font-mono">
            PO: <span className="font-semibold text-slate-700">{item.poNumber}</span> • Style: {item.styleNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'defectCategory',
      header: 'Defect Classification',
      accessorKey: 'defectCategory',
      sortable: true,
      accessor: (item) => item.defectCategory,
      filterOptions: [
        { label: 'Color Shading', value: 'COLOR_SHADING' },
        { label: 'Broken Stitch', value: 'BROKEN_STITCH' },
        { label: 'Measurement Tolerance', value: 'MEASUREMENT_OUT_OF_TOLERANCE' },
        { label: 'Fabric Flaw', value: 'FABRIC_FLAW' },
        { label: 'Packaging Error', value: 'PACKAGING_ERROR' },
        { label: 'Stain Soil', value: 'STAIN_SOIL' },
      ],
      cell: (item) => (
        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-medium border border-amber-200 inline-block">
          {item.defectCategory.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      accessorKey: 'severity',
      sortable: true,
      accessor: (item) => item.severity,
      align: 'center',
      filterOptions: [
        { label: 'Critical', value: 'CRITICAL' },
        { label: 'Major', value: 'MAJOR' },
        { label: 'Minor', value: 'MINOR' },
      ],
      cell: (item) => (
        <span
          className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            item.severity === 'CRITICAL'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : item.severity === 'MAJOR'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          {item.severity}
        </span>
      ),
    },
    {
      key: 'claimAmountUSD',
      header: 'Claim Value',
      accessorKey: 'claimAmountUSD',
      sortable: true,
      accessor: (item) => item.claimAmountUSD,
      align: 'right',
      cell: (item) => (
        <div className="text-right">
          <span className="font-mono font-bold text-xs text-rose-700">
            ${item.claimAmountUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            {item.affectedQuantityPcs ? `${item.affectedQuantityPcs.toLocaleString()} pcs` : 'Liability'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      accessor: (item) => item.status,
      filterOptions: [
        { label: 'Logged', value: 'LOGGED' },
        { label: 'Investigating', value: 'INVESTIGATING' },
        { label: 'CAPA Issued', value: 'CAPA_ISSUED' },
        { label: 'Settled', value: 'SETTLED' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
      cell: (item) => {
        const variantMap: Record<string, any> = {
          LOGGED: 'rose',
          INVESTIGATING: 'amber',
          CAPA_ISSUED: 'blue',
          SETTLED: 'emerald',
          REJECTED: 'neutral',
        };
        return <StatusBadge label={item.status.replace('_', ' ')} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
    {
      key: 'assignedEngineer',
      header: 'Lead QA Engineer',
      accessorKey: 'assignedEngineer',
      sortable: true,
      accessor: (item) => item.assignedEngineer,
      cell: (item) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{item.assignedEngineer}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {item.engineerEmail || 'claims.qa@texexport.com'}
          </div>
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
            onClick={() => setComplaintSubView({ type: 'details', complaint: row })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open 8D CAPA Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* 2. Edit Button */}
          <button
            type="button"
            onClick={() => {
              setComplaintToEdit(row);
              setIsAddModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Claim"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* 3. Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateComplaint(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate Claim"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* 4. Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, complaints: [row] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Claim"
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
        title="Customer Complaints & Claims Log"
        activeView={complaintSubView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setComplaintSubView({ type: 'none' });
          setViewMode(mode as 'summary' | 'list' | 'capa');
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Claims Register', count: complaints.length },
          { id: 'capa', label: 'CAPA & 8D Cards', count: complaints.length },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGE IF ACTIVE */}
      {complaintSubView.type === 'details' ? (
        <ComplaintDetailsPage
          complaint={complaintSubView.complaint}
          onBack={() => setComplaintSubView({ type: 'none' })}
          onEdit={(cmp) => {
            setComplaintToEdit(cmp);
            setIsAddModalOpen(true);
          }}
          onDuplicate={(cmp) => {
            handleDuplicateComplaint(cmp);
            setComplaintSubView({ type: 'none' });
          }}
          onDelete={(cmp) => {
            setDeleteModal({ isOpen: true, complaints: [cmp] });
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
                  title="Total Claims Logged"
                  value={complaints.length.toString()}
                  subtitle="YTD Customer Issue Notices"
                  icon={AlertTriangle}
                  tone="rose"
                  delta={{ value: '-14.2%', isPositive: true }}
                />
                <StatCard
                  title="Active Investigations"
                  value={openCount.toString()}
                  subtitle="8D Root Cause & CAPA in Progress"
                  icon={Clock}
                  tone="amber"
                  delta={{ value: `${openCount} Open`, isPositive: false }}
                />
                <StatCard
                  title="Total Claim Liability"
                  value={`$${(totalClaimsUSD / 1000).toFixed(1)}k`}
                  subtitle="Customer Chargeback & Debit Risk"
                  icon={DollarSign}
                  tone="indigo"
                  delta={{ value: '-8.5%', isPositive: true }}
                />
                <StatCard
                  title="Closed Resolution Rate"
                  value={`${settledRate}%`}
                  subtitle="Settled & Signed Off by Buyer"
                  icon={CheckCircle2}
                  tone="emerald"
                  delta={{ value: '+18.3%', isPositive: true }}
                />
              </div>

              {/* Status Breakdown & Top Buyer Claims Accounts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {/* Defect Classification Breakdown */}
                <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-rose-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Defect Pareto Breakdown by Classification
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Open Claims Register →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'COLOR_SHADING', label: 'Color Shading', color: 'bg-rose-500' },
                      { key: 'BROKEN_STITCH', label: 'Broken Stitch / Seam', color: 'bg-amber-500' },
                      { key: 'MEASUREMENT_OUT_OF_TOLERANCE', label: 'Measurement Tolerance', color: 'bg-blue-600' },
                      { key: 'FABRIC_FLAW', label: 'Fabric Flaws', color: 'bg-indigo-600' },
                      { key: 'PACKAGING_ERROR', label: 'Packaging / Barcode', color: 'bg-purple-600' },
                      { key: 'STAIN_SOIL', label: 'Stain / Soil Spot', color: 'bg-slate-700' },
                    ].map((cat) => {
                      const count = complaints.filter((c) => c.defectCategory === cat.key).length;
                      const value = complaints
                        .filter((c) => c.defectCategory === cat.key)
                        .reduce((sum, c) => sum + c.claimAmountUSD, 0);
                      const pct = Math.round((count / (complaints.length || 1)) * 100);

                      return (
                        <div
                          key={cat.key}
                          onClick={() => {
                            setViewMode('list');
                          }}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                              {count} Claims
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`${cat.color} h-full rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{pct}% incidents</span>
                            <span className="font-bold text-rose-700">${value.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Buyer Claims Accounts Widget */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Recent Customer Claims</h3>
                    <button
                      type="button"
                      onClick={() => setViewMode('capa')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      All 8D CAPAs →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {complaints.slice(0, 4).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setComplaintSubView({ type: 'details', complaint: c })}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 p-1 shrink-0 flex items-center justify-center text-rose-600">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{c.buyerName}</div>
                            <div className="text-[10px] text-slate-500">{c.complaintNumber} • {c.defectCategory.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono font-bold text-rose-700">
                            ${c.claimAmountUSD.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">{c.severity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLAIMS REGISTER LIST (DATATABLE WITH UNIFIED SEARCH & FILTERS) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="customer-complaints-table"
                data={filteredComplaints}
                columns={columns}
                searchPlaceholder="Search claim ID, buyer, style, PO, defect, or engineer..."
                searchableKeys={[
                  'complaintNumber',
                  'buyerName',
                  'poNumber',
                  'styleNumber',
                  'defectCategory',
                  'severity',
                  'status',
                  'assignedEngineer',
                ]}
                secondaryAction={
                  <div className="flex items-center gap-2">
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="MAJOR">Major</option>
                      <option value="MINOR">Minor</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="LOGGED">Logged</option>
                      <option value="INVESTIGATING">Investigating</option>
                      <option value="CAPA_ISSUED">CAPA Issued</option>
                      <option value="SETTLED">Settled</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => {
                      setComplaintToEdit(null);
                      setIsAddModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log New Claim</span>
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
                        complaints: selected,
                      });
                    },
                  },
                  {
                    label: 'Export Selected',
                    onClick: (selected) => {
                      showToast(`Exported ${selected.length} customer claims`);
                    },
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 3: CAPA & 8D CARDS (GRID VS TABLE VIEW TOGGLE) */}
          {viewMode === 'capa' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* GRID VIEW RENDERING */}
              {capaViewType === 'grid' && (
                <>
                  {/* Toolbar matching Buyer & Order module */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {/* Search */}
                      <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search claim ID, buyer, defect..."
                          value={capaSearch}
                          onChange={(e) => setCapaSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Severity Filter */}
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                      >
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="MAJOR">Major</option>
                        <option value="MINOR">Minor</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="LOGGED">Logged</option>
                        <option value="INVESTIGATING">Investigating</option>
                        <option value="CAPA_ISSUED">CAPA Issued</option>
                        <option value="SETTLED">Settled</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* GRID VS TABLE TOGGLE matching Buyer & Order module */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setCapaViewType('grid')}
                          className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white text-blue-600 shadow-xs"
                          title="Grid Card View"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Grid</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCapaViewType('table')}
                          className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
                          title="Table List View"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Table</span>
                        </button>
                      </div>

                      {/* LOG CLAIM BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setComplaintToEdit(null);
                          setIsAddModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Log New Claim</span>
                      </button>
                    </div>
                  </div>

                  {/* Cards Grid matching Buyer & Order card styling */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {capaFilteredComplaints.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all space-y-3.5 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Card Header with ID & Severity Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl border border-rose-200 bg-rose-50 p-1 shrink-0 flex items-center justify-center text-rose-600 shadow-2xs">
                                <AlertTriangle className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="font-mono text-[10px] font-bold text-rose-700 uppercase">
                                  {c.complaintNumber}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                  {c.buyerName}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  PO: <span className="font-semibold text-slate-700">{c.poNumber}</span> • Style: {c.styleNumber}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                c.severity === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : c.severity === 'MAJOR'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {c.severity}
                            </span>
                          </div>

                          {/* Claim Metrics Stats */}
                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Claim Value</span>
                              <span className="font-bold text-rose-700 text-xs font-mono">
                                ${c.claimAmountUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Affected Qty</span>
                              <span className="font-bold text-slate-900 text-xs font-mono">
                                {(c.affectedQuantityPcs || 0).toLocaleString()} pcs
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Reported</span>
                              <span className="font-bold text-slate-700 text-xs font-mono">
                                {c.reportedDate.slice(5)}
                              </span>
                            </div>
                          </div>

                          {/* Lead Investigating QA Engineer box matching Buyer Card's Merchandiser */}
                          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/90 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-blue-950 flex items-center gap-1.5 truncate">
                                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="truncate">{c.assignedEngineer}</span>
                              </div>
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded shrink-0">
                                QA Lead
                              </span>
                            </div>
                            <div className="text-slate-600 truncate flex items-center gap-1.5 text-[10px]">
                              <span>{c.engineerEmail || 'claims.qa@texexport.com'}</span>
                              {c.engineerPhone && <span className="text-slate-300">•</span>}
                              {c.engineerPhone && <span className="font-mono text-slate-700 shrink-0">{c.engineerPhone}</span>}
                            </div>
                          </div>

                          {/* Defect Category Chip */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Defect Category:
                            </span>
                            <div>
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-semibold border border-amber-200">
                                {c.defectCategory.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Root Cause Analysis Summary */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 line-clamp-2">
                            <span className="font-semibold text-slate-900 block mb-0.5">8D Root Cause:</span>
                            {c.rootCauseSummary}
                          </div>
                        </div>

                        {/* Card Footer Actions matching Buyer card */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-[10px] text-slate-500 font-mono">
                            Status: {c.status.replace(/_/g, ' ')}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setComplaintToEdit(c);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                              title="Edit Claim"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, complaints: [c] })}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                              title="Delete Claim"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setComplaintSubView({ type: 'details', complaint: c })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <span>View 8D CAPA</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TABLE VIEW RENDERING WITH DATATABLE SORTING & CSV EXPORT */}
              {capaViewType === 'table' && (
                <DataTable
                  id="customer-complaints-capa-table"
                  data={complaints}
                  columns={columns}
                  searchPlaceholder="Search claim ID, buyer, style, defect..."
                  searchableKeys={['complaintNumber', 'buyerName', 'poNumber', 'defectCategory', 'styleNumber', 'assignedEngineer']}
                  secondaryAction={
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setCapaViewType('grid')}
                        className="p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
                        title="Grid Card View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCapaViewType('table')}
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
                        setComplaintToEdit(null);
                        setIsAddModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log New Claim</span>
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
                          complaints: selected,
                        });
                      },
                    },
                    {
                      label: 'Export Selected',
                      onClick: (selected) => {
                        showToast(`Exported ${selected.length} customer claims`);
                      },
                    },
                  ]}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* ADD / EDIT COMPLAINT MODAL */}
      <AddComplaintModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setComplaintToEdit(null);
        }}
        onSave={handleSaveComplaint}
        initialData={complaintToEdit}
      />

      {/* DELETE CONFIRMATION MODAL matching Buyer & Order module */}
      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title={deleteModal.complaints.length > 1 ? 'Delete Customer Claims' : 'Delete Customer Claim'}
          itemTypeLabel="claim"
          confirmLabel={deleteModal.complaints.length > 1 ? 'Delete Customer Claims' : 'Delete Customer Claim'}
          items={deleteModal.complaints.map((c) => ({
            id: c.id,
            title: `${c.complaintNumber} (${c.buyerName})`,
            subtitle: `${c.defectCategory.replace(/_/g, ' ')} • PO ${c.poNumber}`,
            value: `$${c.claimAmountUSD.toLocaleString()}`,
          }))}
          onConfirm={confirmDeleteComplaints}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
