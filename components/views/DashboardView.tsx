'use client';

import React, { useState } from 'react';
import {
  Boxes,
  ClipboardCheck,
  Factory,
  Percent,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { GradeBadge, StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { InventoryItem, InspectionRecord, ProductionOrder } from '@/lib/types/erp';
import { useLiveSync } from '@/hooks/use-live-sync';
import { useErpAuth } from '@/hooks/use-erp-auth';

interface DashboardViewProps {
  inventory: InventoryItem[];
  inspections: InspectionRecord[];
  productionOrders: ProductionOrder[];
  onNavigateTab: (tab: any) => void;
  onOpenNewInspection: () => void;
  onOpenStockAdjust: (item: InventoryItem) => void;
}

export function DashboardView({
  inventory,
  inspections,
  productionOrders,
  onNavigateTab,
  onOpenNewInspection,
  onOpenStockAdjust,
}: DashboardViewProps) {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const { user, permissions } = useErpAuth();
  const { recentEvents, latencyMs, activeUsers, simulateMultiUserActivity } = useLiveSync();

  // Metric computations
  const totalMeters = inventory.reduce((acc, curr) => acc + curr.quantityMeters, 0);
  const totalRolls = inventory.reduce((acc, curr) => acc + curr.rollCount, 0);
  const gradeACount = inventory.filter((i) => i.qualityGrade === 'GRADE_A').length;
  const gradeAPct = inventory.length ? ((gradeACount / inventory.length) * 100).toFixed(1) : '0';

  const totalInspected = inspections.reduce((acc, curr) => acc + curr.sampleSize, 0);
  const totalPassed = inspections.reduce((acc, curr) => acc + curr.passCount, 0);
  const aqlPassRate = totalInspected ? ((totalPassed / totalInspected) * 100).toFixed(1) : '98.5';

  const activeLinesCount = productionOrders.filter((p) => p.status === 'RUNNING').length;

  // Recent Inspections Columns for the standard table
  const inspectionColumns: ColumnDef<InspectionRecord>[] = [
    {
      key: 'inspectionCode',
      header: 'Code',
      sortable: true,
      render: (item) => <span className="font-mono font-bold text-blue-700">{item.inspectionCode}</span>,
    },
    {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      filterOptions: [
        { label: 'Fabric Inward', value: 'FABRIC_INWARD' },
        { label: 'Cutting Inspection', value: 'CUTTING_INSPECTION' },
        { label: 'Sewing In-Line', value: 'SEWING_IN_LINE' },
        { label: 'End-Line QC', value: 'END_LINE_QC' },
        { label: 'Finishing & Packing', value: 'FINISHING_PACKING' },
      ],
      render: (item) => (
        <span className="font-medium text-slate-800">
          {item.stage.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'styleNumber',
      header: 'Style / PO',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">{item.styleNumber}</div>
          <div className="text-[11px] text-slate-500">{item.buyer}</div>
        </div>
      ),
    },
    {
      key: 'sampleSize',
      header: 'Sample / Defect',
      sortable: true,
      render: (item) => (
        <div className="text-xs">
          <span className="font-semibold">{item.passCount}</span>
          <span className="text-slate-400">/{item.sampleSize}</span>
          {item.defectCount > 0 && (
            <span className="ml-2 text-rose-600 font-bold">({item.defectCount} def.)</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'AQL Verdict',
      sortable: true,
      filterOptions: [
        { label: 'Passed', value: 'PASSED' },
        { label: 'Conditional Pass', value: 'CONDITIONAL_PASS' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'inspectorName',
      header: 'Inspector',
      sortable: true,
      render: (item) => (
        <span className="text-slate-600 text-xs">{item.inspectorName}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Universal Module Header with Top Summary and List Toggle Buttons */}
      <ModuleHeader
        id="dashboard-module-header"
        moduleCode="MOD-00"
        badge="Executive Overview"
        title="Garments Quality Assurance &amp; Warehouse ERP"
        subtitle="Unified industrial executive dashboard featuring live WebSocket inventory updates and floor telemetry"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${inspections.length} Quality Audits`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Welcome Banner */}
          <div className="bg-white text-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Plant Quality Status
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live WebSocket Sync
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Floor Quality Monitoring &amp; Warehouse Operations
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Real-time plant floor overview: AQL sampling checkpoints, fabric stock grade distribution, and active sewing lines pace.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="quick-new-inspection-btn"
                onClick={onOpenNewInspection}
                disabled={!permissions.canPerformInspection}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Log AQL Inspection</span>
              </button>
              <button
                id="dashboard-simulate-scan-btn"
                onClick={simulateMultiUserActivity}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Broadcast automated RFID warehouse scan to verify WebSocket sync"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulate Scan</span>
              </button>
            </div>
          </div>

          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              id="stat-total-meters"
              title="Total Fabric Stock"
              value={`${totalMeters.toLocaleString()} m`}
              subtitle={`${totalRolls} total rolls in warehouse`}
              delta={{ value: '+420 m today', isPositive: true }}
              icon={Boxes}
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
              progressPercent={78}
            />
            <StatCard
              id="stat-grade-a-ratio"
              title="Grade A Quality Ratio"
              value={`${gradeAPct}%`}
              subtitle="Meets high-spec export tolerance"
              delta={{ value: '+1.4% this batch', isPositive: true }}
              icon={Percent}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-600"
              progressPercent={Number(gradeAPct)}
            />
            <StatCard
              id="stat-aql-pass-rate"
              title="AQL 2.5 Pass Rate"
              value={`${aqlPassRate}%`}
              subtitle="Across 6 inspection checkpoints"
              delta={{ value: '0.3% defect margin', isPositive: true }}
              icon={ClipboardCheck}
              iconBgColor="bg-indigo-50"
              iconColor="text-indigo-600"
              progressPercent={Number(aqlPassRate)}
            />
            <StatCard
              id="stat-active-lines"
              title="Active Sewing Lines"
              value={`${activeLinesCount} / 8`}
              subtitle="Target vs actual completion: 84%"
              delta={{ value: '98.2% on-time pace', isPositive: true }}
              icon={Factory}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-600"
              progressPercent={84}
            />
          </div>

          {/* Grid: Defect Pareto Chart & Real-Time Sync Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {/* Defect Classification Pareto */}
            <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Top Defect Frequency (DHU Pareto Analysis)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Continuous root-cause categorization across garment production floors
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  AQL Threshold: 2.5%
                </span>
              </div>

              <div className="mt-4 space-y-3.5">
                {[
                  { type: 'Shade & Delta-E Color Variation', count: 32, pct: 36, color: 'bg-rose-500' },
                  { type: 'Broken Stitch / Skip Overlock', count: 24, pct: 27, color: 'bg-amber-500' },
                  { type: 'Weft Slub & Tension Puckering', count: 16, pct: 18, color: 'bg-blue-500' },
                  { type: 'Needle Holes & Fiber Snagging', count: 11, pct: 12, color: 'bg-indigo-500' },
                  { type: 'Skewness / Bowing salvage > 1.5%', count: 6, pct: 7, color: 'bg-slate-400' },
                ].map((defect) => (
                  <div key={defect.type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{defect.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{defect.count} occurrences</span>
                        <span className="font-bold text-slate-900">{defect.pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${defect.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${defect.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Critical tolerances enforced per ISO 2859-1 AQL standards</span>
                <button
                  onClick={() => onNavigateTab('inspections')}
                  className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Full QMS Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Real-Time WebSocket Multi-User Stream */}
            <div className="bg-white text-slate-800 rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="text-sm font-bold text-slate-900">Live Warehouse WS Feed</h3>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {latencyMs}ms Latency
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Broadcast channel synchronizing {activeUsers} active warehouse users and automated barcode scanners:
                </p>

                {/* Event List */}
                <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto pr-1 text-xs">
                  {recentEvents.length === 0 ? (
                    <div className="p-4 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 text-center">
                      Listening for live events... Click &quot;Simulate Scan&quot; above to test broadcast!
                    </div>
                  ) : (
                    recentEvents.slice(0, 5).map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 animate-in fade-in duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-700 text-[11px]">
                            {evt.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(evt as any).timestamp
                              ? new Date((evt as any).timestamp).toLocaleTimeString()
                              : 'Just now'}
                          </span>
                        </div>
                        <div className="text-slate-800 text-xs font-medium">
                          {(evt as any).message ||
                            ((evt as any).item
                              ? `Stock updated: ${(evt as any).item.sku} (${(evt as any).item.quantityMeters}m)`
                              : `Inspection logged for ${(evt as any).record?.lotNumber}`)}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>By: {(evt as any).user || 'Warehouse Bot'}</span>
                          {(evt as any).location && (
                            <span className="font-mono text-emerald-700 font-medium">{(evt as any).location}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">WebSocket / Express 5 API</span>
                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage Fabric Stock</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Comprehensive Quality Inspections Register"
            recordCount={inspections.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable<InspectionRecord>
            id="dashboard-recent-inspections-table"
            title="Comprehensive QMS Inspections &amp; Audit Verdicts"
            subtitle="Standard table architecture with sortable column headers, filter search, and header dropdowns"
            data={inspections}
            columns={inspectionColumns}
            searchPlaceholder="Search style number, inspection code, or buyer..."
            searchableKeys={['inspectionCode', 'styleNumber', 'buyer', 'inspectorName', 'stage']}
            defaultSortKey="inspectionCode"
            defaultSortDirection="desc"
          />
        </div>
      )}
    </div>
  );
}
