'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Target,
  Percent,
  TrendingUp,
  Building2,
  Calendar,
  Layers,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  KpiMetric,
  KpiCategory,
  KpiStatus,
  KpiTrend,
  KpiFrequency,
} from '@/lib/types/modules';

interface KpiEntryPageProps {
  initialKpi?: KpiMetric | null;
  onSave: (kpi: KpiMetric) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export function KpiEntryPage({
  initialKpi,
  onSave,
  onCancel,
  showToast,
}: KpiEntryPageProps) {
  const isEditing = Boolean(initialKpi);

  // Form State
  const [kpiCode, setKpiCode] = useState(
    initialKpi?.kpiCode || `KPI-QA-${String(Math.floor(Math.random() * 90) + 10)}`
  );
  const [metricName, setMetricName] = useState(initialKpi?.metricName || '');
  const [category, setCategory] = useState<KpiCategory>(
    (initialKpi?.category as KpiCategory) || 'QUALITY'
  );
  const [department, setDepartment] = useState(
    initialKpi?.department || 'Sewing Production (Lines 01-12)'
  );
  const [ownerName, setOwnerName] = useState(
    initialKpi?.ownerName || 'Tanzim Ahmed (Head of Quality)'
  );

  // Targets & Quantities
  const [currentValue, setCurrentValue] = useState<number>(initialKpi?.currentValue ?? 0);
  const [targetValue, setTargetValue] = useState<number>(initialKpi?.targetValue ?? 0);
  const [unit, setUnit] = useState(initialKpi?.unit || '%');
  const [benchmark, setBenchmark] = useState(
    initialKpi?.benchmark || '< 2.0% World-Class Garment Standard'
  );
  const [desiredDirection, setDesiredDirection] = useState<'LOWER_IS_BETTER' | 'HIGHER_IS_BETTER'>(
    initialKpi?.desiredDirection || 'LOWER_IS_BETTER'
  );
  const [toleranceThreshold, setToleranceThreshold] = useState<number>(
    initialKpi?.toleranceThreshold ?? 0.5
  );

  // Operational Timing & Formula
  const [frequency, setFrequency] = useState<KpiFrequency>(
    (initialKpi?.frequency as KpiFrequency) || 'DAILY'
  );
  const [formula, setFormula] = useState(
    initialKpi?.formula || '(Total Defects Found / Total Units Inspected) * 100'
  );
  const [description, setDescription] = useState(
    initialKpi?.description || 'Operational quality indicator monitored continuously on production floor.'
  );

  // Health & Trend
  const [status, setStatus] = useState<KpiStatus>(initialKpi?.status || 'ON_TRACK');
  const [trend, setTrend] = useState<KpiTrend>(initialKpi?.trend || 'STABLE');

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!metricName.trim()) {
      showToast('Please specify the metric name');
      return;
    }

    if (isNaN(currentValue) || isNaN(targetValue)) {
      showToast('Please enter valid numeric values for Current and Target');
      return;
    }

    const kpiToSave: KpiMetric = {
      id: initialKpi?.id || `kpi-${Date.now()}`,
      kpiCode: kpiCode.trim().toUpperCase(),
      metricName: metricName.trim(),
      category,
      department: department.trim(),
      ownerName: ownerName.trim(),
      currentValue: Number(currentValue),
      targetValue: Number(targetValue),
      unit: unit.trim(),
      benchmark: benchmark.trim(),
      status,
      trend,
      frequency,
      formula: formula.trim(),
      desiredDirection,
      toleranceThreshold: Number(toleranceThreshold),
      description: description.trim(),
      history: initialKpi?.history || [
        {
          id: `h-${Date.now()}`,
          period: 'Sep 2026',
          value: Number(currentValue),
          target: Number(targetValue),
          loggedBy: ownerName.split('(')[0].trim(),
          remarks: 'Baseline measurement initialized',
        },
      ],
      actionItems: initialKpi?.actionItems || [],
      lastUpdated: new Date().toISOString().split('T')[0],
      createdAt: initialKpi?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(kpiToSave);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Header & Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Cancel and return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {kpiCode}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {isEditing ? 'Edit Performance Indicator' : 'New Performance Indicator'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {isEditing ? `Edit: ${initialKpi?.metricName}` : 'Configure Quality & Operations Performance Metric'}
            </h1>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Metric' : 'Publish KPI Metric'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Metric Scope & Identification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Target className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Metric Scope &amp; Identification
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Metric Code *</label>
              <input
                type="text"
                value={kpiCode}
                onChange={(e) => setKpiCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-blue-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Domain / Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as KpiCategory)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="QUALITY">Quality Assurance</option>
                <option value="PRODUCTIVITY">Plant Productivity</option>
                <option value="DELIVERY">Supply Chain &amp; Delivery</option>
                <option value="COST">Cost &amp; Efficiency</option>
                <option value="SAFETY">Product Safety &amp; Metal Det.</option>
                <option value="COMPLIANCE">Social &amp; ESG Compliance</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Performance Indicator Name *</label>
              <input
                type="text"
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                placeholder="e.g., Sewing Floor DHU (Defects per Hundred Units)"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Responsible Department / Section</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Sewing Production Lines 01-12 or Cutting Floor"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Metric Owner / Governance Head</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g., Tanzim Ahmed (Head of Quality)"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Quantitative Targets & Specifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Percent className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Quantitative Targets &amp; Benchmarks
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Current Baseline Value *</label>
              <input
                type="number"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Factory Target Value *</label>
              <input
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit of Measure *</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., %, % of FOB, Incidents, PPM"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Optimization Direction *</label>
              <select
                value={desiredDirection}
                onChange={(e) => setDesiredDirection(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              >
                <option value="LOWER_IS_BETTER">Lower is Better (e.g. DHU, Cost, Defect)</option>
                <option value="HIGHER_IS_BETTER">Higher is Better (e.g. RFT, Yield, OTIF)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tolerance Threshold (+/-)</label>
              <input
                type="number"
                step="any"
                value={toleranceThreshold}
                onChange={(e) => setToleranceThreshold(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Industry Benchmark Reference</label>
              <input
                type="text"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                placeholder="e.g., < 2.0% World-Class Benchmark"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Operational Measurement & Frequency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Operational Measurement &amp; Calculation Rules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Evaluation Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as KpiFrequency)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              >
                <option value="DAILY">Daily Production Floor Monitoring</option>
                <option value="WEEKLY">Weekly Quality Review</option>
                <option value="MONTHLY">Monthly Executive Scorecard</option>
                <option value="PER_SHIPMENT">Per Export Shipment Inspection</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Mathematical Formula</label>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="e.g., (Total Defects / Total Inspected Pieces) * 100"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-800"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-semibold text-slate-700 block mb-1">Operational Description &amp; Scope</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how data is collected, sample sizes, and review procedures..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Initial Health Status & Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              4. Governance Health Status &amp; Directional Trajectory
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Initial Health Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as KpiStatus)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
              >
                <option value="ON_TRACK">On Track (Compliant with Target)</option>
                <option value="AT_RISK">At Risk (Variance within 5%)</option>
                <option value="CRITICAL">Critical (Remediation CAPA Required)</option>
                <option value="EXCEEDED">Exceeded (Outperforming Benchmark)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Directional Trend</label>
              <select
                value={trend}
                onChange={(e) => setTrend(e.target.value as KpiTrend)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
              >
                <option value="UP">Upward Movement</option>
                <option value="DOWN">Downward Movement</option>
                <option value="STABLE">Stable Trajectory</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Metric' : 'Publish KPI Metric'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
