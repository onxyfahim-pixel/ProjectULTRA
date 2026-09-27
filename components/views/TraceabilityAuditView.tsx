'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Search,
  Factory,
  Layers,
  CheckCircle2,
  ChevronRight,
  Eye,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Package,
  Calendar,
  Check,
  Building2,
  LayoutDashboard,
  Table2,
  Sparkles,
  Barcode,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { MOCK_TRACEABILITY_RECORDS } from '@/lib/db/modules-mock-data';
import { TraceabilityChain } from '@/lib/types/modules';

// Subcomponents
import { TraceabilityDetailsPage } from '../modules/traceability/TraceabilityDetailsPage';
import { TraceabilityEntryPage } from '../modules/traceability/TraceabilityEntryPage';
import { DeleteTraceabilityModal } from '../modules/traceability/DeleteTraceabilityModal';

type TraceabilitySubView =
  | { type: 'none' }
  | { type: 'details'; record: TraceabilityChain }
  | { type: 'add' }
  | { type: 'edit'; record: TraceabilityChain };

export function TraceabilityAuditView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  // Load from localStorage or fallback to MOCK_TRACEABILITY_RECORDS
  const [records, setRecords] = useState<TraceabilityChain[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('erp_traceability_records_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed parsing stored traceability records:', err);
      }
    }
    return MOCK_TRACEABILITY_RECORDS;
  });

  // Save to localStorage whenever records change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('erp_traceability_records_v1', JSON.stringify(records));
      } catch (err) {
        console.warn('Failed saving traceability records to localStorage:', err);
      }
    }
  }, [records]);

  // Dedicated Separate Pages (Details, Add, Edit)
  const [subView, setSubView] = useState<TraceabilitySubView>({ type: 'none' });

  // Sync subview details if records update
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = records.find((r) => r.id === subView.record.id);
      if (refreshed && refreshed !== subView.record) {
        setSubView({ type: 'details', record: refreshed });
      }
    }
  }, [records, subView]);

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    records: TraceabilityChain[];
  } | null>(null);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>(records[0]?.cartonBarcode || 'CTN-HM-99201-0428');
  const [selectedRecord, setSelectedRecord] = useState<TraceabilityChain>(records[0] || MOCK_TRACEABILITY_RECORDS[0]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalCount = records.length;
  const verifiedCount = records.filter((r) => (r.status || 'VERIFIED') === 'VERIFIED').length;
  const complianceRate = Math.round((verifiedCount / (totalCount || 1)) * 100);

  const uniqueBuyers = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => {
      if (r.buyer) s.add(r.buyer);
    });
    return Array.from(s);
  }, [records]);

  const uniquePOsCount = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => {
      if (r.poNumber) s.add(r.poNumber);
      else if (r.orderNumber) s.add(r.orderNumber);
    });
    return s.size || totalCount;
  }, [records, totalCount]);

  // CRUD Handlers
  const handleSaveRecord = (recordToSave: TraceabilityChain) => {
    const exists = records.some((r) => r.id === recordToSave.id);
    if (exists) {
      setRecords((prev) => prev.map((r) => (r.id === recordToSave.id ? recordToSave : r)));
    } else {
      setRecords((prev) => [recordToSave, ...prev]);
    }
    setSelectedRecord(recordToSave);
    setSubView({ type: 'details', record: recordToSave });
  };

  const handleDeleteRecord = (recordToDelete: TraceabilityChain) => {
    setDeleteModal({
      isOpen: true,
      records: [recordToDelete],
    });
  };

  const confirmDelete = () => {
    if (!deleteModal || deleteModal.records.length === 0) return;
    const idsToDelete = new Set(deleteModal.records.map((r) => r.id));
    setRecords((prev) => prev.filter((r) => !idsToDelete.has(r.id)));

    if (subView.type === 'details' && idsToDelete.has(subView.record.id)) {
      setSubView({ type: 'none' });
    } else if (subView.type === 'edit' && idsToDelete.has(subView.record.id)) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.records.length;
    showToast(
      count === 1
        ? `Deleted traceability record ${deleteModal.records[0].cartonBarcode}`
        : `Deleted ${count} traceability records successfully`
    );
    setDeleteModal(null);
  };

  const handleAuditTraceSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const q = searchTerm.trim().toLowerCase();
    const found = records.find(
      (r) =>
        r.cartonBarcode.toLowerCase().includes(q) ||
        r.garmentSerial.toLowerCase().includes(q) ||
        r.fabricRollBarcode.toLowerCase().includes(q) ||
        r.styleNumber.toLowerCase().includes(q) ||
        (r.poNumber && r.poNumber.toLowerCase().includes(q))
    );
    if (found) {
      setSelectedRecord(found);
      showToast(`Located traceability genealogy for ${found.cartonBarcode}`);
    } else {
      showToast(`No record found matching "${searchTerm}"`);
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    let matchesFilter = true;
    if (activeFilter === 'VERIFIED') matchesFilter = (r.status || 'VERIFIED') === 'VERIFIED';
    else if (activeFilter === 'KNITS') matchesFilter = r.sewingLine.toLowerCase().includes('knit');
    else if (activeFilter === 'DENIM') matchesFilter = r.sewingLine.toLowerCase().includes('denim') || r.styleNumber.includes('DN');

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.cartonBarcode.toLowerCase().includes(q) ||
      r.garmentSerial.toLowerCase().includes(q) ||
      r.styleNumber.toLowerCase().includes(q) ||
      r.buyer.toLowerCase().includes(q) ||
      r.cottonOrigin.toLowerCase().includes(q) ||
      r.sewingLine.toLowerCase().includes(q) ||
      (r.poNumber && r.poNumber.toLowerCase().includes(q)) ||
      (r.articleName && r.articleName.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  // Table Columns Matching Audit Module Design
  const columns: ColumnDef<TraceabilityChain>[] = [
    {
      key: 'cartonBarcode',
      header: 'Carton Barcode & QR',
      sortable: true,
      width: '20%',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md border border-slate-200 overflow-hidden bg-blue-50 shrink-0 flex items-center justify-center text-blue-600">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span
              onClick={() => setSubView({ type: 'details', record: item })}
              className="font-mono font-bold text-blue-700 text-xs block leading-tight hover:underline cursor-pointer"
            >
              {item.cartonBarcode}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block leading-tight">
              {item.garmentSerial}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'styleNumber',
      header: 'PO & Article / Style',
      sortable: true,
      width: '22%',
      render: (item) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.poNumber ? (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {item.poNumber}
              </span>
            ) : null}
            <span className="font-semibold text-slate-900 text-xs truncate max-w-[150px]">
              {item.styleNumber}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={item.articleName || item.styleDescription}>
            {item.articleName || item.styleDescription || item.buyer}
          </div>
        </div>
      ),
    },
    {
      key: 'buyer',
      header: 'Buyer & Origin Standard',
      sortable: true,
      width: '20%',
      render: (item) => (
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 text-xs truncate max-w-[170px]" title={item.buyer}>
            {item.buyer}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[170px]" title={item.cottonOrigin}>
            {item.cottonOrigin}
          </div>
        </div>
      ),
    },
    {
      key: 'yarnLot',
      header: 'Yarn Lot & Dye Batch',
      sortable: true,
      width: '16%',
      render: (item) => (
        <div className="min-w-0 font-mono">
          <div className="text-xs text-blue-900 font-bold truncate">
            {item.yarnLot}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Batch: {item.dyeingBatch}
          </div>
        </div>
      ),
    },
    {
      key: 'sewingLine',
      header: 'Sewing Line & Seal',
      sortable: true,
      width: '12%',
      render: (item) => (
        <div className="min-w-0">
          <span className="font-mono text-[11px] font-semibold text-slate-800 block truncate">
            {item.sewingLine}
          </span>
          <span className="text-[10px] text-emerald-700 font-mono font-medium block">
            {item.passedFinalDate ? item.passedFinalDate.split(' ')[0] : 'Audited'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '10%',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {/* Details Button (Eye) */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', record: item })}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button (Pencil) */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', record: item })}
            className="p-1 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Traceability Record"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button (Trash) */}
          <button
            type="button"
            onClick={() => handleDeleteRecord(item)}
            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<TraceabilityChain>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({
          isOpen: true,
          records: selected,
        });
      },
    },
  ];

  // ─── RENDER SUBVIEWS (SEPARATE PAGES) ────────────────────────────────────
  if (subView.type === 'details') {
    return (
      <TraceabilityDetailsPage
        record={subView.record}
        onBack={() => setSubView({ type: 'none' })}
        onEdit={(recordToEdit) => setSubView({ type: 'edit', record: recordToEdit })}
        onDelete={(recordToDelete) => {
          handleDeleteRecord(recordToDelete);
        }}
        onUpdateRecord={handleSaveRecord}
        showToast={showToast}
      />
    );
  }

  if (subView.type === 'add' || subView.type === 'edit') {
    return (
      <TraceabilityEntryPage
        initialRecord={subView.type === 'edit' ? subView.record : null}
        onBack={() => setSubView({ type: 'none' })}
        onSave={handleSaveRecord}
        showToast={showToast}
      />
    );
  }

  // ─── RENDER MAIN VIEW ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Header styled identically to Audit Module */}
      <ModuleHeader
        id="traceability-module"
        title="Supply Chain Traceability"
        activeView={viewMode}
        onViewChange={setViewMode}
        customTabs={[
          {
            id: 'summary',
            label: 'Summary',
            icon: LayoutDashboard,
            count: '5 KPIs',
          },
          {
            id: 'list',
            label: 'Traceability Records',
            icon: Table2,
            count: `${records.length}`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setSubView({ type: 'add' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Traceability Entry</span>
          </button>
        }
      />

      {/* ─── VIEW 1: SUMMARY (KPI STAT CARDS & QUICK AUDIT LOOKUP) ─────────── */}
      {viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Chains Tracked"
              value={totalCount}
              subtitle="Digital Master Ledger"
              icon={<QrCode className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Chain Compliance"
              value={`${complianceRate}%`}
              subtitle="Farm to Carton Sealed"
              delta={{ value: '100%', isPositive: true, label: 'standard met' }}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Cotton Origin Standard"
              value="BCI & US Cotton"
              subtitle="Full Chain of Custody"
              delta={{ value: 'Certified', isPositive: true, label: 'sustainable' }}
              icon={<Layers className="w-5 h-5 text-indigo-600" />}
            />
            <StatCard
              title="Scan & Recall Speed"
              value="< 0.4 sec"
              subtitle="RFID & 2D Barcode"
              delta={{ value: '-1.6h', isPositive: true, label: 'vs manual' }}
              icon={<Search className="w-5 h-5 text-purple-600" />}
            />
            <StatCard
              title="Active POs / Articles"
              value={`${uniquePOsCount} Orders`}
              subtitle="Buyer Module Synced"
              icon={<Package className="w-5 h-5 text-amber-600" />}
            />
          </div>

          {/* Barcode Search Bar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h2 className="text-base font-bold text-slate-900">
                End-to-End Supply Chain Traceability Audit
              </h2>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 self-start sm:self-auto">
                Live Scan Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter any Carton Barcode, Garment Serial QR, Fabric Roll ID, or PO Number to pull historical manufacturing genealogy.
            </p>

            <form onSubmit={handleAuditTraceSearch} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. CTN-HM-99201-0428 or GRM-2026-889104"
                  className="w-full pl-9 pr-4 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Audit Trace
              </button>
            </form>
          </div>

          {/* Visual Supply Chain Genealogy Tree */}
          {selectedRecord && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 font-mono">
                      {selectedRecord.cartonBarcode}
                    </span>
                    {selectedRecord.poNumber && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        PO: {selectedRecord.poNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedRecord.articleName || selectedRecord.styleDescription || selectedRecord.styleNumber} • {selectedRecord.buyer}
                  </h3>
                </div>

                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <div className="text-xs font-mono text-slate-500">
                    Audit Passed: <span className="font-semibold text-emerald-700">{selectedRecord.passedFinalDate}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'details', record: selectedRecord })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Details Page</span>
                  </button>
                </div>
              </div>

              <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-6">
                {[
                  {
                    stage: 'Stage 1: Raw Fiber & Cotton Origin',
                    code: selectedRecord.cottonOrigin,
                    details: `Spinning Lot: ${selectedRecord.yarnLot} • ${selectedRecord.ginningLocation || 'Lubbock Ginning Co-Op'}`,
                    color: 'bg-emerald-600',
                  },
                  {
                    stage: 'Stage 2: Dyeing & Fabric Finishing',
                    code: `Batch: ${selectedRecord.dyeingBatch}`,
                    details: `Fabric Roll Barcode: ${selectedRecord.fabricRollBarcode} • ${selectedRecord.fabricMill || 'Pacific Knit Composite Ltd'}`,
                    color: 'bg-indigo-600',
                  },
                  {
                    stage: 'Stage 3: Cutting & Spreading Room',
                    code: `Table Lot: ${selectedRecord.cuttingTableLot}`,
                    details: '100% Ply Height and Tension Verification Approved (CAD Precision)',
                    color: 'bg-blue-600',
                  },
                  {
                    stage: 'Stage 4: Sewing Line Assembly',
                    code: selectedRecord.sewingLine,
                    details: `Garment QR Serial: ${selectedRecord.garmentSerial} • Broken Needle Log Verified`,
                    color: 'bg-amber-600',
                  },
                  {
                    stage: 'Stage 5: Final Metal Detection & Packout',
                    code: `Export Carton: ${selectedRecord.cartonBarcode}`,
                    details: '1.0mm Fe Tested & Pre-Shipment Inspection Sealed',
                    color: 'bg-purple-600',
                  },
                ].map((step, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[33px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-xs ${step.color}`}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {step.stage}
                      </span>
                      <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                        {step.code}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{step.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SwitchToListBanner
            label="Open Traceability Chain Master Ledger"
            recordCount={filteredRecords.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      )}

      {/* ─── VIEW 2: TRACEABILITY RECORDS (TABLE VIEW) ─────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Tabs matching Audit Module */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Chains</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-slate-800">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('VERIFIED')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'VERIFIED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Fully Verified</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {verifiedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('KNITS')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'KNITS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Knits Division</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('DENIM')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeFilter === 'DENIM'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50/50'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                <span>Denim & Outerwear</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search barcode, PO, style, buyer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-52 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <DataTable<TraceabilityChain>
            id="traceability-chains-table"
            title="Traceability Chain Master Ledger"
            subtitle="Explore all verified digital chain of custody records with direct lookup to full process genealogy"
            data={filteredRecords}
            columns={columns}
            batchActions={batchActions}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteTraceabilityModal
          isOpen={deleteModal.isOpen}
          records={deleteModal.records}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
