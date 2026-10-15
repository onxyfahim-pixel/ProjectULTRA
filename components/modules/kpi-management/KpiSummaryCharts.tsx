'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PieChart,
  Layers,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  CheckSquare,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { KpiMetric, KpiCategory, KpiStatus, KpiTrend } from '@/lib/types/modules';
import { KPI_CATEGORY_CONFIG } from './kpi-management-data';

interface KpiSummaryChartsProps {
  kpis: KpiMetric[];
  onFilterCategory?: (cat: string) => void;
  onFilterStatus?: (status: string) => void;
  onNavigateToList?: () => void;
  onSelectKpiDetails?: (kpi: KpiMetric) => void;
}

export function KpiSummaryCharts({
  kpis,
  onFilterCategory,
  onFilterStatus,
  onNavigateToList,
  onSelectKpiDetails,
}: KpiSummaryChartsProps) {
  // Selected KPI for historical multi-month trend chart
  const [selectedTrendKpiId, setSelectedTrendKpiId] = useState<string>(() => {
    return kpis[0]?.id || 'kpi-001';
  });

  const [activeHistoryPointIndex, setActiveHistoryPointIndex] = useState<number | null>(null);
  const [hoveredBulletKpiId, setHoveredBulletKpiId] = useState<string | null>(null);

  // Active trend KPI
  const activeTrendKpi = useMemo(() => {
    return kpis.find((k) => k.id === selectedTrendKpiId) || kpis[0];
  }, [kpis, selectedTrendKpiId]);

  // History points for active trend KPI
  const trendHistory = useMemo(() => {
    if (!activeTrendKpi || !activeTrendKpi.history || activeTrendKpi.history.length === 0) {
      // Default 6-month historical curve if history isn't populated
      const cur = activeTrendKpi?.currentValue || 1.8;
      const tgt = activeTrendKpi?.targetValue || 1.5;
      return [
        { id: 'h-1', period: 'Apr 2026', value: cur + 0.8, target: tgt, sampleSize: 125000, remarks: 'Baseline audit' },
        { id: 'h-2', period: 'May 2026', value: cur + 0.5, target: tgt, sampleSize: 132000, remarks: 'Process tuning' },
        { id: 'h-3', period: 'Jun 2026', value: cur + 0.3, target: tgt, sampleSize: 140000, remarks: 'Training conducted' },
        { id: 'h-4', period: 'Jul 2026', value: cur + 0.2, target: tgt, sampleSize: 138000, remarks: 'Machine maintenance' },
        { id: 'h-5', period: 'Aug 2026', value: cur + 0.1, target: tgt, sampleSize: 145000, remarks: 'Stable run' },
        { id: 'h-6', period: 'Sep 2026', value: cur, target: tgt, sampleSize: 110000, remarks: 'Current active performance' },
      ];
    }
    return activeTrendKpi.history;
  }, [activeTrendKpi]);

  // Max and Min values for SVG trend scaling
  const { minVal, maxVal, range } = useMemo(() => {
    const rawVals = trendHistory.flatMap((h) => [h.value, h.target]).filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const vals = rawVals.length > 0 ? rawVals : [0, 100];
    const min = Math.max(0, Math.min(...vals) * 0.85);
    const max = Math.max(...vals) * 1.15;
    return { minVal: min, maxVal: max, range: Math.max(max - min, 0.1) };
  }, [trendHistory]);

  // Health Compliance Metrics
  const healthStats = useMemo(() => {
    const onTrack = kpis.filter((k) => k.status === 'ON_TRACK').length;
    const atRisk = kpis.filter((k) => k.status === 'AT_RISK').length;
    const critical = kpis.filter((k) => k.status === 'CRITICAL').length;
    const total = kpis.length || 1;
    const complianceScore = Math.round(((onTrack + atRisk * 0.5) / total) * 100);

    return {
      onTrack,
      atRisk,
      critical,
      total: kpis.length,
      complianceScore,
      onTrackPct: Math.round((onTrack / total) * 100),
      atRiskPct: Math.round((atRisk / total) * 100),
      criticalPct: Math.round((critical / total) * 100),
    };
  }, [kpis]);

  // Operational Domain Breakdown
  const domainBreakdown = useMemo(() => {
    return Object.entries(KPI_CATEGORY_CONFIG).map(([catKey, cfg]) => {
      const catKpis = kpis.filter((k) => k.category === catKey);
      const onTrackCount = catKpis.filter((k) => k.status === 'ON_TRACK').length;
      const totalCount = catKpis.length;
      const complianceRate = totalCount > 0 ? Math.round((onTrackCount / totalCount) * 100) : 0;

      return {
        key: catKey,
        label: cfg.label,
        count: totalCount,
        onTrackCount,
        complianceRate,
        kpis: catKpis,
      };
    }).filter((d) => d.count > 0);
  }, [kpis]);

  // Calculate First and Last history delta
  const historyDelta = useMemo(() => {
    if (trendHistory.length < 2) return null;
    const first = trendHistory[0].value;
    const last = trendHistory[trendHistory.length - 1].value;
    const diff = Number((last - first).toFixed(2));
    const isLowerBetter = activeTrendKpi?.desiredDirection === 'LOWER_IS_BETTER';
    const isImprovement = isLowerBetter ? diff < 0 : diff > 0;
    return { first, last, diff, isImprovement };
  }, [trendHistory, activeTrendKpi]);

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* ROW 1: INTERACTIVE HISTORICAL TREND LINE & AREA GRAPH (SVG) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200/60">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-slate-900 uppercase flex items-center gap-2">
                Multi-Period KPI Trend &amp; Target Trajectory
                <span className="text-[10px] normal-case bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  6-Month Continuous Flow
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Track historical measurement progression against target benchmarks &amp; Six Sigma tolerance limits
              </p>
            </div>
          </div>

          {/* Metric Selector Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Metric:
            </span>
            <select
              value={selectedTrendKpiId}
              onChange={(e) => setSelectedTrendKpiId(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[260px] truncate"
            >
              {kpis.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kpiCode || 'KPI'} • {k.metricName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected KPI Insight Bar */}
        {activeTrendKpi && (
          <div className="mt-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[11px]">
                {activeTrendKpi.kpiCode || 'KPI'}
              </span>
              <strong className="text-slate-900 font-bold">{activeTrendKpi.metricName}</strong>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{activeTrendKpi.department}</span>
              <span className="text-slate-400">•</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTrendKpi.status === 'ON_TRACK'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : activeTrendKpi.status === 'AT_RISK'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {activeTrendKpi.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-4 font-mono text-[11px] shrink-0">
              <span>
                Current: <strong className="text-blue-700 font-bold">{activeTrendKpi.currentValue} {activeTrendKpi.unit}</strong>
              </span>
              <span>
                Target: <strong className="text-slate-900 font-bold">{activeTrendKpi.targetValue} {activeTrendKpi.unit}</strong>
              </span>
              {historyDelta && (
                <span
                  className={`font-bold flex items-center gap-0.5 ${
                    historyDelta.isImprovement ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {historyDelta.isImprovement ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Math.abs(historyDelta.diff)} {activeTrendKpi.unit} {historyDelta.isImprovement ? 'Improvement' : 'Variance'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* SVG Trend Line & Area Canvas */}
        <div className="mt-4 relative">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 740 220"
              className="w-full h-auto min-w-[560px]"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Chart Coordinates: Left 45, Right 700 (W=655), Top 20, Bottom 175 (H=155) */}
              {/* Horizontal Reference Lines (Steps 0, 0.25, 0.5, 0.75, 1) */}
              {[0, 0.25, 0.5, 0.75, 1].map((s, i) => {
                const val = Number((minVal + s * range).toFixed(1));
                const y = 175 - s * 155;
                return (
                  <g key={i}>
                    <text
                      x="38"
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-400 text-[9px] font-mono"
                      style={{ fontSize: '9px' }}
                    >
                      {val}
                    </text>
                    <line
                      x1="45"
                      y1={y}
                      x2="700"
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? 'none' : '3,3'}
                    />
                  </g>
                );
              })}

              {/* Target Line (Red/Amber dashed) */}
              {(() => {
                const tgt = activeTrendKpi?.targetValue ?? 1.5;
                const normTgt = (tgt - minVal) / range;
                const yTgt = 175 - Math.max(0, Math.min(1, normTgt)) * 155;
                return (
                  <g>
                    <line
                      x1="45"
                      y1={yTgt}
                      x2="700"
                      y2={yTgt}
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    <rect
                      x="615"
                      y={yTgt - 14}
                      width="85"
                      height="13"
                      rx="3"
                      fill="#ffe4e6"
                      stroke="#fecdd3"
                    />
                    <text
                      x="657"
                      y={yTgt - 4}
                      textAnchor="middle"
                      className="fill-rose-700 text-[8px] font-bold font-mono"
                      style={{ fontSize: '8px', fontWeight: 700 }}
                    >
                      Target: {tgt} {activeTrendKpi?.unit}
                    </text>
                  </g>
                );
              })()}

              {/* Path & Points Calculation */}
              {(() => {
                const pointCount = trendHistory.length;
                const usableW = 655;
                const slotW = pointCount > 1 ? usableW / (pointCount - 1) : usableW;

                const points = trendHistory.map((h, idx) => {
                  const x = 45 + idx * slotW;
                  const norm = (h.value - minVal) / range;
                  const y = 175 - Math.max(0, Math.min(1, norm)) * 155;
                  return { x, y, ...h, idx };
                });

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaPath = `${linePath} L ${points[points.length - 1].x} 175 L ${points[0].x} 175 Z`;

                return (
                  <g>
                    {/* Area under curve */}
                    <path d={areaPath} fill="url(#trendAreaGrad)" />

                    {/* Polyline curve */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points with interactive hover */}
                    {points.map((p) => {
                      const isHovered = activeHistoryPointIndex === p.idx;
                      return (
                        <g
                          key={p.idx}
                          className="cursor-pointer"
                          onMouseEnter={() => setActiveHistoryPointIndex(p.idx)}
                          onMouseLeave={() => setActiveHistoryPointIndex(null)}
                        >
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 6 : 4}
                            fill="#ffffff"
                            stroke="#2563eb"
                            strokeWidth={isHovered ? 3 : 2}
                          />

                          {/* Value tag above dot */}
                          <text
                            x={p.x}
                            y={p.y - 7}
                            textAnchor="middle"
                            className="fill-blue-900 text-[9px] font-mono font-bold"
                            style={{ fontSize: '9px', fontWeight: 700 }}
                          >
                            {p.value}
                          </text>

                          {/* Month / Period Label on X-axis */}
                          <text
                            x={p.x}
                            y="195"
                            textAnchor="middle"
                            className={`text-[9px] font-medium ${
                              isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                            }`}
                            style={{ fontSize: '9px' }}
                          >
                            {p.period}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Hovered History Point Card Detail */}
        <div className="mt-2 pt-3 border-t border-slate-100">
          {activeHistoryPointIndex !== null && trendHistory[activeHistoryPointIndex] ? (
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in duration-150">
              <div>
                <span className="font-bold text-blue-900">
                  {trendHistory[activeHistoryPointIndex].period} Audit Log
                </span>
                <span className="text-slate-400 mx-2">•</span>
                <span className="text-slate-600">
                  Notes: {trendHistory[activeHistoryPointIndex].remarks || 'Routine end-of-period KPI log'}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                <span>Value: <strong className="text-blue-700">{trendHistory[activeHistoryPointIndex].value} {activeTrendKpi?.unit}</strong></span>
                <span>Target: <strong className="text-slate-900">{trendHistory[activeHistoryPointIndex].target} {activeTrendKpi?.unit}</strong></span>
                {trendHistory[activeHistoryPointIndex].sampleSize && (
                  <span>Sample: <strong className="text-slate-700">{trendHistory[activeHistoryPointIndex].sampleSize?.toLocaleString()} pcs</strong></span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                Hover any month on the curve to inspect audit remarks, sample size &amp; target variance.
              </span>
              <span className="font-mono text-slate-400">Formula: {activeTrendKpi?.formula || 'Standard ISO 9001 calculation'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ROW 2: TARGET ACCOMPLISHMENT BULLET GRAPH & VARIANCE MATRIX */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ============================================================ */}
        {/* CHART 2: STRATEGIC KPI BULLET PERFORMANCE MATRIX */}
        {/* ============================================================ */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200/60">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-slate-900 uppercase flex items-center gap-2">
                    Strategic KPI Bullet Performance Matrix
                    <span className="text-[10px] normal-case bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Actual vs Target
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Industrial bullet comparison tracking actual values against plant targets &amp; tolerance limits
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] self-start sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span className="text-slate-600 font-medium">On Track</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                  <span className="text-slate-600 font-medium">At Risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                  <span className="text-slate-600 font-medium">Critical</span>
                </div>
              </div>
            </div>

            {/* Bullet Graph Items */}
            <div className="mt-4 space-y-3.5">
              {kpis.slice(0, 6).map((k) => {
                const isLowerBetter = k.desiredDirection === 'LOWER_IS_BETTER';
                const diff = k.currentValue - k.targetValue;
                const isPassed = isLowerBetter ? diff <= 0 : diff >= 0;
                const isHovered = hoveredBulletKpiId === k.id;

                // Normalization for visual bar (e.g. 100% is target)
                const maxBarRef = Math.max(k.targetValue, k.currentValue) * 1.25 || 1;
                const actualWidth = Math.min((k.currentValue / maxBarRef) * 100, 100);
                const targetMarkerPos = Math.min((k.targetValue / maxBarRef) * 100, 100);

                const toneColor =
                  k.status === 'ON_TRACK'
                    ? 'bg-emerald-500'
                    : k.status === 'AT_RISK'
                    ? 'bg-amber-500'
                    : 'bg-rose-500';

                return (
                  <div
                    key={k.id}
                    onMouseEnter={() => setHoveredBulletKpiId(k.id)}
                    onMouseLeave={() => setHoveredBulletKpiId(null)}
                    onClick={() => onSelectKpiDetails?.(k)}
                    className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isHovered
                        ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Top Row: Metric Code, Name, Category, Current vs Target */}
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-slate-500 text-[10px]">
                          {k.kpiCode || 'KPI'}
                        </span>
                        <strong className="text-slate-900 font-bold truncate">
                          {k.metricName}
                        </strong>
                        <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                          ({k.category})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                        <span className="text-slate-900 font-bold">
                          {k.currentValue} {k.unit}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">
                          {k.targetValue} {k.unit}
                        </span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPassed ? 'Goal Met' : 'Off Target'}
                        </span>
                      </div>
                    </div>

                    {/* Bullet Progress Track with Target Goal Line */}
                    <div className="relative w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-1">
                      {/* Actual value filled bar */}
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${toneColor}`}
                        style={{ width: `${Math.max(actualWidth, 3)}%` }}
                      />
                      {/* Target goal line marker */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10 shadow-xs"
                        style={{ left: `${targetMarkerPos}%` }}
                        title={`Target Goal: ${k.targetValue} ${k.unit}`}
                      />
                    </div>

                    {/* Bottom Micro Line */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>
                        Target: {k.targetValue} {k.unit} • {isLowerBetter ? 'Lower is better' : 'Higher is better'}
                      </span>
                      <span className="font-mono text-slate-500">
                        {k.trend === 'UP' && '▲ Trending Up'}
                        {k.trend === 'DOWN' && '▼ Trending Down'}
                        {k.trend === 'STABLE' && '▬ Stable Pace'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick List Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              Showing top 6 strategic KPIs • Total Scorecard: <strong>{kpis.length} metrics</strong>
            </span>
            {onNavigateToList && (
              <button
                type="button"
                onClick={onNavigateToList}
                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                <span>View Complete KPI Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* CHART 3: RADIAL HEALTH COMPLIANCE & DOMAIN MATRIX */}
        {/* ============================================================ */}
        <div className="xl:col-span-5 space-y-6">
          {/* 3A: Radial KPI Health Compliance Donut Ring */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  KPI Health Compliance Scorecard
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">ISO 9001 Clause 9.1</span>
            </div>

            {/* SVG Donut Ring with Center Percentage */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-1">
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />

                  {/* On Track Arc (Emerald) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={`${(healthStats.onTrackPct / 100) * 251.2} 251.2`}
                    strokeDashoffset="0"
                  />

                  {/* At Risk Arc (Amber) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeDasharray={`${(healthStats.atRiskPct / 100) * 251.2} 251.2`}
                    strokeDashoffset={`-${(healthStats.onTrackPct / 100) * 251.2}`}
                  />

                  {/* Critical Arc (Rose) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="12"
                    strokeDasharray={`${(healthStats.criticalPct / 100) * 251.2} 251.2`}
                    strokeDashoffset={`-${((healthStats.onTrackPct + healthStats.atRiskPct) / 100) * 251.2}`}
                  />
                </svg>

                {/* Center Score Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black font-mono text-slate-900 leading-none">
                    {healthStats.complianceScore}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Health Index
                  </span>
                </div>
              </div>

              {/* Status Breakdown Legend & Click Filters */}
              <div className="space-y-2 text-xs w-full sm:w-auto">
                <div
                  onClick={() => {
                    onFilterStatus?.('ON_TRACK');
                    onNavigateToList?.();
                  }}
                  className="flex items-center justify-between gap-4 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-emerald-900">On Track</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-800">
                    {healthStats.onTrack} ({healthStats.onTrackPct}%)
                  </span>
                </div>

                <div
                  onClick={() => {
                    onFilterStatus?.('AT_RISK');
                    onNavigateToList?.();
                  }}
                  className="flex items-center justify-between gap-4 p-2 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-semibold text-amber-900">At Risk</span>
                  </div>
                  <span className="font-mono font-bold text-amber-800">
                    {healthStats.atRisk} ({healthStats.atRiskPct}%)
                  </span>
                </div>

                <div
                  onClick={() => {
                    onFilterStatus?.('CRITICAL');
                    onNavigateToList?.();
                  }}
                  className="flex items-center justify-between gap-4 p-2 rounded-xl bg-rose-50/60 border border-rose-100 hover:bg-rose-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-rose-900">Critical</span>
                  </div>
                  <span className="font-mono font-bold text-rose-800">
                    {healthStats.critical} ({healthStats.criticalPct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3B: Operational Domain Dimension Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  KPIs Across Manufacturing Domains
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Pillars</span>
            </div>

            <div className="space-y-2 text-xs">
              {domainBreakdown.map((d) => (
                <div
                  key={d.key}
                  onClick={() => {
                    onFilterCategory?.(d.key);
                    onNavigateToList?.();
                  }}
                  className="p-2 rounded-xl border border-slate-100 hover:bg-blue-50/30 hover:border-blue-200 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{d.label}</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {d.count} metrics • <strong className="text-emerald-700">{d.complianceRate}% On Track</strong>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${d.complianceRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
