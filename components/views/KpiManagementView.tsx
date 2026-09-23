'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Target, CheckCircle2, AlertCircle, PieChart, Layers } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { KpiMetric } from '@/lib/types/modules';
import { MOCK_KPIS } from '@/lib/db/modules-mock-data';

export function KpiManagementView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [kpis, setKpis] = useState<KpiMetric[]>(MOCK_KPIS);

  const onTrackCount = kpis.filter((k) => k.status === 'ON_TRACK').length;
  const atRiskCount = kpis.filter((k) => k.status === 'AT_RISK').length;
  const criticalCount = kpis.filter((k) => k.status === 'CRITICAL').length;

  const columns: ColumnDef<KpiMetric>[] = [
    {
      key: 'metricName',
      header: 'Quality & Operations Metric',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.metricName}</span>
          <div className="text-[11px] text-slate-500 font-mono">Benchmark: {item.benchmark}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Domain',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
          {item.category}
        </span>
      ),
    },
    {
      key: 'currentValue',
      header: 'Actual Achievement',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          {item.currentValue} {item.unit}
        </span>
      ),
    },
    {
      key: 'targetValue',
      header: 'Factory Target',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">
          {item.targetValue} {item.unit}
        </span>
      ),
    },
    {
      key: 'trend',
      header: 'Directional Trend',
      align: 'center',
      render: (item) => {
        const isPositive =
          (item.trend === 'DOWN' && item.metricName.includes('DHU')) ||
          (item.trend === 'DOWN' && item.metricName.includes('Cost')) ||
          (item.trend === 'UP' && !item.metricName.includes('DHU') && !item.metricName.includes('Cost'));

        return (
          <div className="flex items-center justify-center gap-1 font-mono text-xs font-semibold">
            {item.trend === 'UP' ? (
              <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
            ) : item.trend === 'DOWN' ? (
              <TrendingDown className={`w-4 h-4 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
            ) : (
              <span className="text-slate-400">—</span>
            )}
            <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>{item.trend}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'KPI Health Status',
      sortable: true,
      filterOptions: [
        { label: 'On Track', value: 'ON_TRACK' },
        { label: 'At Risk', value: 'AT_RISK' },
        { label: 'Critical', value: 'CRITICAL' },
      ],
      render: (item) => {
        const variantMap: Record<string, any> = {
          ON_TRACK: 'emerald',
          AT_RISK: 'amber',
          CRITICAL: 'rose',
        };
        return <StatusBadge label={item.status.replace('_', ' ')} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="kpi-management-module"
        moduleCode="MOD-13"
        badge="Executive Scorecard & Analytics"
        title="Executive Quality & Manufacturing Performance Scorecard"
        subtitle="Key Quality Indicators: DHU, Right First Time (RFT), Cut-to-Ship Ratio, Cost of Quality, and On-Time Delivery"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${kpis.length} Indicators`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Floor DHU Rate"
              value="1.8%"
              subtitle="Target < 1.5% Defect Rate"
              icon={<Target className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Right First Time (RFT)"
              value="94.6%"
              subtitle="World-Class Benchmark >95%"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Final Audit Pass"
              value="98.8%"
              subtitle="Pre-Shipment Inspections"
              icon={<BarChart3 className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Cost of Quality (CoQ)"
              value="1.15%"
              subtitle="Percent of Total FOB Turnover"
              icon={<AlertCircle className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KPI Health Status */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    KPI Health Status
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Target Tracking</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">On Track</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{onTrackCount}</div>
                  <span className="text-[10px] text-slate-500">Meeting targets</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block">At Risk</span>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-1">{atRiskCount}</div>
                  <span className="text-[10px] text-slate-500">Within 5% variance</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] text-rose-700 font-semibold block">Critical</span>
                  <div className="text-lg font-bold font-mono text-rose-900 mt-1">{criticalCount}</div>
                  <span className="text-[10px] text-slate-500">Action plan required</span>
                </div>
              </div>
            </div>

            {/* Domains Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    KPIs by Operational Domain
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Dimensions</span>
              </div>
              <div className="space-y-2 text-xs">
                {Array.from(new Set(kpis.map((k) => k.category))).map((cat) => {
                  const count = kpis.filter((k) => k.category === cat).length;
                  const pct = Math.round((count / (kpis.length || 1)) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span className="font-medium">{cat}</span>
                        <span className="font-mono text-slate-500">{count} metrics ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete KPI Performance Scorecard"
            recordCount={kpis.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="kpi-management-table"
            title="Executive Quality & Manufacturing Performance Scorecard"
            subtitle="Key Quality Indicators: DHU, Right First Time (RFT), Cut-to-Ship Ratio, Cost of Quality, and On-Time Delivery"
            data={kpis}
            columns={columns}
            searchPlaceholder="Search performance metrics or benchmarks..."
            searchableKeys={['metricName', 'category', 'benchmark']}
          />
        </div>
      )}
    </div>
  );
}
