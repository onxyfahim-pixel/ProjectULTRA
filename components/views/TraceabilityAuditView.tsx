'use client';

import React, { useState } from 'react';
import { QrCode, Search, GitCommit, Factory, Layers, CheckCircle2, ChevronRight, Eye, ShieldCheck } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { MOCK_TRACEABILITY_RECORDS } from '@/lib/db/modules-mock-data';
import { TraceabilityChain } from '@/lib/types/modules';

export function TraceabilityAuditView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [records] = useState<TraceabilityChain[]>(MOCK_TRACEABILITY_RECORDS);
  const [searchTerm, setSearchTerm] = useState<string>('CTN-HM-99201-0428');
  const [selectedRecord, setSelectedRecord] = useState<TraceabilityChain>(records[0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = records.find(
      (r) =>
        r.cartonBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.garmentSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.fabricRollBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.styleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (found) {
      setSelectedRecord(found);
    }
  };

  const columns: ColumnDef<TraceabilityChain>[] = [
    {
      key: 'cartonBarcode',
      header: 'Carton Barcode',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          {item.cartonBarcode}
        </span>
      ),
    },
    {
      key: 'styleNumber',
      header: 'Style & Buyer',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.styleNumber}</span>
          <div className="text-[11px] text-slate-500 font-medium">{item.buyer}</div>
        </div>
      ),
    },
    {
      key: 'garmentSerial',
      header: 'Garment QR Serial',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-slate-700">{item.garmentSerial}</span>
      ),
    },
    {
      key: 'cottonOrigin',
      header: 'Cotton Origin & Yarn Lot',
      render: (item) => (
        <div className="text-xs">
          <span className="text-slate-800 font-medium">{item.cottonOrigin}</span>
          <div className="text-[10px] text-slate-500 font-mono">Lot: {item.yarnLot}</div>
        </div>
      ),
    },
    {
      key: 'sewingLine',
      header: 'Sewing Line',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-700">{item.sewingLine}</span>
      ),
    },
    {
      key: 'passedFinalDate',
      header: 'Audit Sealed Date',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-emerald-700 font-semibold">{item.passedFinalDate}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Inspect',
      align: 'center',
      render: (item) => (
        <button
          onClick={() => {
            setSelectedRecord(item);
            setSearchTerm(item.cartonBarcode);
            setViewMode('summary');
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Genealogy</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="traceability-module"
        moduleCode="MOD-18"
        badge="Supply Chain Custody"
        title="End-to-End Supply Chain Traceability Audit"
        subtitle="Full digital chain of custody from raw cotton origin, spinning, knitting/dyeing, to garment serial and carton barcode"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${records.length} Chains`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Digital Traceability"
              value="100% Tracked"
              subtitle="Yarn to Export Carton"
              icon={<QrCode className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Cotton Origin Standard"
              value="BCI & US Cotton"
              subtitle="Full Chain of Custody"
              icon={<Layers className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Scan Speed"
              value="< 0.4 sec"
              subtitle="Handheld RFID & 2D Barcode"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Trace Recall Window"
              value="< 2 Hours"
              subtitle="Buyer Audit Standard"
              icon={<Factory className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          {/* Barcode Search Bar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              End-to-End Supply Chain Traceability Audit
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter any Carton Barcode, Garment Serial QR, or Fabric Roll ID to generate the full historical manufacturing genealogy.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. CTN-HM-99201-0428 or GRM-2026-889104"
                  className="w-full pl-9 pr-4 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
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
                  <span className="text-xs font-bold text-blue-700 font-mono">
                    {selectedRecord.cartonBarcode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    Style: {selectedRecord.styleNumber} • {selectedRecord.buyer}
                  </h3>
                </div>
                <div className="text-xs font-mono text-slate-500 mt-2 sm:mt-0">
                  Audit Passed: <span className="font-semibold text-emerald-700">{selectedRecord.passedFinalDate}</span>
                </div>
              </div>

              <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-6">
                {[
                  {
                    stage: 'Stage 1: Raw Fiber & Cotton Origin',
                    code: selectedRecord.cottonOrigin,
                    details: `Spinning Lot: ${selectedRecord.yarnLot}`,
                    color: 'bg-emerald-600',
                  },
                  {
                    stage: 'Stage 2: Dyeing & Fabric Finishing',
                    code: `Batch: ${selectedRecord.dyeingBatch}`,
                    details: `Fabric Roll Barcode: ${selectedRecord.fabricRollBarcode}`,
                    color: 'bg-indigo-600',
                  },
                  {
                    stage: 'Stage 3: Cutting & Spreading Room',
                    code: `Table Lot: ${selectedRecord.cuttingTableLot}`,
                    details: '100% Ply Height and Tension Verification Approved',
                    color: 'bg-blue-600',
                  },
                  {
                    stage: 'Stage 4: Sewing Line Assembly',
                    code: selectedRecord.sewingLine,
                    details: `Garment QR Serial: ${selectedRecord.garmentSerial}`,
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
            recordCount={records.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="traceability-chains-table"
            title="Traceability Chain Master Ledger"
            subtitle="Explore all verified chain of custody records with direct lookup to full process genealogy"
            data={records}
            columns={columns}
            searchPlaceholder="Search carton barcode, garment QR serial, style, or buyer..."
            searchableKeys={['cartonBarcode', 'garmentSerial', 'styleNumber', 'buyer', 'cottonOrigin', 'sewingLine']}
          />
        </div>
      )}
    </div>
  );
}
