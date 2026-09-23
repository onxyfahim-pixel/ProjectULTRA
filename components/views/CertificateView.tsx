'use client';

import React, { useState } from 'react';
import { Award, ShieldCheck, Clock, AlertTriangle, Download, ExternalLink, PieChart, CheckCircle } from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { FactoryCertificate } from '@/lib/types/modules';
import { MOCK_CERTIFICATES } from '@/lib/db/modules-mock-data';

export function CertificateView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [certs, setCerts] = useState<FactoryCertificate[]>(MOCK_CERTIFICATES);
  const [feedback, setFeedback] = useState<string | null>(null);

  const validCount = certs.filter((c) => c.status === 'VALID').length;
  const expiringSoonCount = certs.filter((c) => c.status === 'EXPIRING_SOON').length;
  const expiredCount = certs.filter((c) => c.status === 'EXPIRED').length;

  const triggerDownload = (certName: string) => {
    setFeedback(`Downloaded official compliance certificate PDF for ${certName}`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const columns: ColumnDef<FactoryCertificate>[] = [
    {
      key: 'certCode',
      header: 'Certificate Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
          {item.certCode}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Certification Standard & Issuing Body',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.name}</span>
          <div className="text-[11px] text-slate-500">{item.issuingBody} • {item.certificateNumber}</div>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Certified Scope',
      render: (item) => (
        <span className="text-xs text-slate-600 truncate max-w-xs block" title={item.scope}>
          {item.scope}
        </span>
      ),
    },
    {
      key: 'validUntil',
      header: 'Validity Period',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-mono text-xs text-slate-800">{item.validUntil}</span>
          <div className="text-[10px] text-slate-500 font-mono">From: {item.validFrom}</div>
        </div>
      ),
    },
    {
      key: 'daysRemaining',
      header: 'Renewal Countdown',
      sortable: true,
      align: 'right',
      render: (item) => (
        <div className="text-right">
          <span
            className={`font-mono font-bold text-xs ${
              item.daysRemaining <= 30
                ? 'text-rose-700'
                : item.daysRemaining <= 90
                ? 'text-amber-700'
                : 'text-emerald-700'
            }`}
          >
            {item.daysRemaining} days left
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterOptions: [
        { label: 'Valid', value: 'VALID' },
        { label: 'Expiring Soon', value: 'EXPIRING_SOON' },
        { label: 'Expired', value: 'EXPIRED' },
      ],
      render: (item) => {
        const variantMap: Record<string, any> = {
          VALID: 'emerald',
          EXPIRING_SOON: 'amber',
          EXPIRED: 'rose',
        };
        return <StatusBadge label={item.status.replace('_', ' ')} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
    {
      key: 'actions',
      header: 'PDF',
      align: 'center',
      render: (item) => (
        <button
          onClick={() => triggerDownload(item.name)}
          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          title="Download Certificate PDF"
        >
          <Download className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="certificates-module"
        moduleCode="MOD-16"
        badge="Accreditations & Compliance"
        title="Factory Compliance & Sustainability Certificates Vault"
        subtitle="Global textile credentials: OEKO-TEX Standard 100, GOTS Organic, ISO 9001:2015, and WRAP Gold"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${certs.length} Credentials`}
      />

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Factory Accreditations"
              value={certs.length}
              subtitle="OEKO-TEX, GOTS, ISO, WRAP"
              icon={<Award className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Active Valid Certs"
              value={`${validCount} / ${certs.length}`}
              subtitle="Full Retail Compliance"
              icon={<ShieldCheck className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Renewal Due Soon"
              value={expiringSoonCount}
              subtitle="Within 60 Days Notice"
              icon={<Clock className="w-5 h-5" />}
              tone={expiringSoonCount > 0 ? 'amber' : 'emerald'}
            />
            <StatCard
              title="Social & Eco Standard"
              value="HIGG / ZDHC"
              subtitle="Zero Discharge Hazardous"
              icon={<AlertTriangle className="w-5 h-5" />}
              tone="indigo"
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
                    Upcoming Renewals
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Timeline</span>
              </div>
              <div className="space-y-2.5 text-xs">
                {certs.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">{c.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Expires: {c.validUntil}</span>
                    </div>
                    <span className={`text-[11px] font-mono font-bold ${c.daysRemaining <= 60 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {c.daysRemaining} days left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete Factory Certificates Registry"
            recordCount={certs.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="certificates-table"
            title="Factory Compliance & Sustainability Certificates Vault"
            subtitle="Global textile credentials: OEKO-TEX Standard 100, GOTS Organic, ISO 9001:2015, and WRAP Gold"
            data={certs}
            columns={columns}
            searchPlaceholder="Search certificates by name, standard, or issuing body..."
            searchableKeys={['certCode', 'name', 'issuingBody', 'certificateNumber', 'scope']}
          />
        </div>
      )}
    </div>
  );
}
