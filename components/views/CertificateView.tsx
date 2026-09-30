'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Download,
  ExternalLink,
  PieChart,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building2,
  Users,
  Search,
  Filter,
  Check,
  Package,
  Layers,
  LayoutDashboard,
  Table2,
  Sparkles,
  FileText,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { FactoryCertificate } from '@/lib/types/modules';
import { MOCK_CERTIFICATES } from '@/lib/db/modules-mock-data';

// Subcomponents (Separate Pages)
import { CertificateEntryPage } from '../modules/certificate/CertificateEntryPage';
import { CertificateDetailsPage } from '../modules/certificate/CertificateDetailsPage';
import { DeleteCertificateModal } from '../modules/certificate/DeleteCertificateModal';

type CertificateSubView =
  | { type: 'none' }
  | { type: 'details'; cert: FactoryCertificate }
  | { type: 'add' }
  | { type: 'edit'; cert: FactoryCertificate };

export function CertificateView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  // Load from localStorage or fallback to MOCK_CERTIFICATES
  const [certs, setCerts] = useState<FactoryCertificate[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('erp_factory_certificates_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed parsing stored certificates:', err);
      }
    }
    return MOCK_CERTIFICATES;
  });

  // Save to localStorage whenever certs change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('erp_factory_certificates_v1', JSON.stringify(certs));
      } catch (err) {
        console.warn('Failed saving certificates to localStorage:', err);
      }
    }
  }, [certs]);

  // Dedicated Separate Pages (Details, Add, Edit)
  const [subView, setSubView] = useState<CertificateSubView>({ type: 'none' });

  // Sync subview details when certs state updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = certs.find((c) => c.id === subView.cert.id);
      if (refreshed && refreshed !== subView.cert) {
        setSubView({ type: 'details', cert: refreshed });
      }
    }
  }, [certs, subView]);

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    certificates: FactoryCertificate[];
  } | null>(null);

  // Filters & Search
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalCount = certs.length;
  const validCount = certs.filter((c) => c.status === 'VALID').length;
  const expiringSoonCount = certs.filter((c) => c.status === 'EXPIRING_SOON').length;
  const expiredCount = certs.filter((c) => c.status === 'EXPIRED').length;

  const qualityCount = certs.filter((c) => c.category === 'QUALITY_QMS').length;
  const socialEcoCount = certs.filter(
    (c) => c.category === 'SOCIAL_COMPLIANCE' || c.category === 'ENVIRONMENTAL' || c.category === 'CHEMICAL_SAFETY'
  ).length;

  const linkedOrdersCount = useMemo(() => {
    const s = new Set<string>();
    certs.forEach((c) => {
      if (c.poNumber) s.add(c.poNumber);
    });
    return s.size;
  }, [certs]);

  // CRUD Handlers
  const handleSaveCert = (certToSave: FactoryCertificate) => {
    const exists = certs.some((c) => c.id === certToSave.id);
    if (exists) {
      setCerts((prev) => prev.map((c) => (c.id === certToSave.id ? certToSave : c)));
    } else {
      setCerts((prev) => [certToSave, ...prev]);
    }
    setSubView({ type: 'details', cert: certToSave });
  };

  const handleDeleteCert = (certToDelete: FactoryCertificate) => {
    setDeleteModal({
      isOpen: true,
      certificates: [certToDelete],
    });
  };

  const confirmDelete = () => {
    if (!deleteModal || deleteModal.certificates.length === 0) return;
    const idsToDelete = new Set(deleteModal.certificates.map((c) => c.id));
    setCerts((prev) => prev.filter((c) => !idsToDelete.has(c.id)));

    if (subView.type === 'details' && idsToDelete.has(subView.cert.id)) {
      setSubView({ type: 'none' });
    } else if (subView.type === 'edit' && idsToDelete.has(subView.cert.id)) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.certificates.length;
    showToast(
      count === 1
        ? `Deleted certificate ${deleteModal.certificates[0].certCode}`
        : `Deleted ${count} certificates successfully`
    );
    setDeleteModal(null);
  };

  const triggerDownload = (certName: string) => {
    showToast(`Downloaded official compliance certificate PDF for ${certName}`);
  };

  // Filtered Certificates
  const filteredCerts = certs.filter((c) => {
    let matchesCategory = true;
    if (activeCategoryFilter === 'VALID') matchesCategory = c.status === 'VALID';
    else if (activeCategoryFilter === 'EXPIRING_SOON') matchesCategory = c.status === 'EXPIRING_SOON';
    else if (activeCategoryFilter === 'EXPIRED') matchesCategory = c.status === 'EXPIRED';
    else if (activeCategoryFilter === 'QUALITY') matchesCategory = c.category === 'QUALITY_QMS';
    else if (activeCategoryFilter === 'SOCIAL_ECO') {
      matchesCategory =
        c.category === 'SOCIAL_COMPLIANCE' ||
        c.category === 'ENVIRONMENTAL' ||
        c.category === 'CHEMICAL_SAFETY';
    }

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.certCode.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.issuingBody.toLowerCase().includes(q) ||
      c.certificateNumber.toLowerCase().includes(q) ||
      c.scope.toLowerCase().includes(q) ||
      (c.poNumber && c.poNumber.toLowerCase().includes(q)) ||
      (c.styleNumber && c.styleNumber.toLowerCase().includes(q)) ||
      (c.buyerName && c.buyerName.toLowerCase().includes(q)) ||
      (c.articleName && c.articleName.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  // Table Columns Matching Audit Module Design
  const columns: ColumnDef<FactoryCertificate>[] = [
    {
      key: 'certReference',
      header: 'Certificate Reference',
      sortable: true,
      width: '18%',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center text-blue-600">
            {item.category === 'QUALITY_QMS' ? (
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            ) : item.category === 'SOCIAL_COMPLIANCE' ? (
              <Building2 className="w-4 h-4 text-purple-600" />
            ) : item.category === 'ENVIRONMENTAL' ? (
              <Award className="w-4 h-4 text-emerald-600" />
            ) : (
              <Award className="w-4 h-4 text-indigo-600" />
            )}
          </div>
          <div className="min-w-0">
            <span
              onClick={() => setSubView({ type: 'details', cert: item })}
              className="font-mono font-bold text-blue-700 text-xs block leading-tight hover:underline cursor-pointer"
            >
              {item.certCode}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block leading-tight truncate max-w-[140px]">
              Lic: {item.certificateNumber}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Standard & Issuing Body',
      sortable: true,
      width: '24%',
      render: (item) => (
        <div className="min-w-0">
          <div
            onClick={() => setSubView({ type: 'details', cert: item })}
            className="font-semibold text-slate-900 text-xs truncate max-w-[240px] hover:text-blue-600 cursor-pointer"
            title={item.name}
          >
            {item.name}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[240px]" title={item.issuingBody}>
            {item.issuingBody}
          </div>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Scope & Facility Location',
      sortable: true,
      width: '22%',
      render: (item) => (
        <div className="min-w-0">
          <span className="text-xs font-medium text-slate-800 block truncate max-w-[220px]" title={item.scope}>
            {item.scope}
          </span>
          <span className="text-[10px] text-slate-500 block truncate max-w-[220px]" title={item.facilityLocation}>
            {item.facilityLocation || 'Main Apparel Manufacturing Complex'}
          </span>
        </div>
      ),
    },
    {
      key: 'validUntil',
      header: 'Validity Period',
      sortable: true,
      width: '14%',
      render: (item) => (
        <div className="min-w-0">
          <span className="font-mono text-xs text-slate-800 block">
            {item.validUntil}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">
            From: {item.validFrom}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status & Renewal',
      sortable: true,
      width: '14%',
      align: 'center',
      render: (item) => {
        const isExpiring = item.status === 'EXPIRING_SOON';
        const isExpired = item.status === 'EXPIRED';

        return (
          <div className="text-center">
            <span
              className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                item.status === 'VALID'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : isExpiring
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {item.status.replace('_', ' ')}
            </span>
            <span
              className={`block text-[9px] font-mono font-bold mt-0.5 ${
                item.daysRemaining <= 30
                  ? 'text-rose-600'
                  : item.daysRemaining <= 90
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {item.daysRemaining} days left
            </span>
          </div>
        );
      },
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
            onClick={() => setSubView({ type: 'details', cert: item })}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button (Pencil) */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', cert: item })}
            className="p-1 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Certificate"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={() => triggerDownload(item.name)}
            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
            title="Download Certificate PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button (Trash) */}
          <button
            type="button"
            onClick={() => handleDeleteCert(item)}
            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Certificate"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<FactoryCertificate>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({
          isOpen: true,
          certificates: selected,
        });
      },
    },
  ];

  // ─── RENDER SUBVIEWS (SEPARATE PAGES) ────────────────────────────────────
  if (subView.type === 'details') {
    return (
      <CertificateDetailsPage
        cert={subView.cert}
        onBack={() => setSubView({ type: 'none' })}
        onEdit={(certToEdit) => setSubView({ type: 'edit', cert: certToEdit })}
        onDelete={(certToDelete) => handleDeleteCert(certToDelete)}
        onUpdateCert={handleSaveCert}
        showToast={showToast}
      />
    );
  }

  if (subView.type === 'add' || subView.type === 'edit') {
    return (
      <CertificateEntryPage
        initialCert={subView.type === 'edit' ? subView.cert : null}
        onBack={() => setSubView({ type: 'none' })}
        onSave={handleSaveCert}
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

      {/* Module Header */}
      <ModuleHeader
        id="certificates-vault-module"
        title="Certificates Vault"
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
            label: 'Certificate Records',
            icon: Table2,
            count: `${certs.length}`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setSubView({ type: 'add' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Certificate</span>
          </button>
        }
      />

      {/* ─── VIEW 1: SUMMARY (KPI STAT CARDS) ──────────────────────────────── */}
      {viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Factory Accreditations"
              value={totalCount}
              subtitle="OEKO-TEX, GOTS, ISO, WRAP"
              icon={<Award className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Active Valid Certs"
              value={`${validCount} / ${totalCount}`}
              subtitle="Full Retail Compliance"
              delta={{ value: '100%', isPositive: true, label: 'validity target' }}
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Renewal Due Soon"
              value={expiringSoonCount}
              subtitle="Within 60 Days Notice"
              delta={{ value: `${expiringSoonCount} alerts`, isPositive: expiringSoonCount === 0, label: 'action' }}
              icon={<Clock className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Expired Certificates"
              value={expiredCount}
              subtitle="Immediate Renewal Required"
              delta={{ value: `${expiredCount}`, isPositive: expiredCount === 0, label: 'status' }}
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
            />
            <StatCard
              title="Audit Readiness Rate"
              value={`${Math.round((validCount / (totalCount || 1)) * 100)}%`}
              subtitle="Full Retail Compliance"
              delta={{ value: '100% target', isPositive: true }}
              icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Accreditation Health */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Credential Validity Breakdown
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Audit Readiness</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Valid</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{validCount}</div>
                  <span className="text-[10px] text-slate-500">Fully compliant</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block">Expiring Soon</span>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-1">{expiringSoonCount}</div>
                  <span className="text-[10px] text-slate-500">&lt; 90 days notice</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] text-rose-700 font-semibold block">Expired</span>
                  <div className="text-lg font-bold font-mono text-rose-900 mt-1">{expiredCount}</div>
                  <span className="text-[10px] text-slate-500">Immediate renewal</span>
                </div>
              </div>
            </div>

            {/* Upcoming Renewal Countdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Upcoming Renewals & Expiry Schedule
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Timeline</span>
              </div>
              <div className="space-y-2.5 text-xs">
                {certs.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSubView({ type: 'details', cert: c })}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs hover:text-blue-600 truncate max-w-xs">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Expires: {c.validUntil} • {c.facilityLocation || c.category}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        c.daysRemaining <= 60 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {c.daysRemaining} days left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete Factory Certificates Registry"
            recordCount={filteredCerts.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      )}

      {/* ─── VIEW 2: CERTIFICATE RECORDS (TABLE VIEW) ──────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Pill Tabs matching Audit Module */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('ALL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Certificates</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-slate-800">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('VALID')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'VALID'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50/50'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>100% Valid</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {validCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('EXPIRING_SOON')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'EXPIRING_SOON'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Expiring Soon</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                  {expiringSoonCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('EXPIRED')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'EXPIRED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50/50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Expired</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                  {expiredCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('QUALITY')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'QUALITY'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ISO & QMS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('SOCIAL_ECO')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeCategoryFilter === 'SOCIAL_ECO'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50/50'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Social & Eco</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search certificate, PO, standard, buyer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-52 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Data Table matching Audit Module */}
          <DataTable<FactoryCertificate>
            id="certificates-registry-table"
            data={filteredCerts}
            columns={columns}
            batchActions={batchActions}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteCertificateModal
          isOpen={deleteModal.isOpen}
          certificates={deleteModal.certificates}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
