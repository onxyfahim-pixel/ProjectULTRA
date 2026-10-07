'use client';

import React, { useMemo } from 'react';
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Layers,
  Eye,
  Plus,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  FileText,
  User,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { QualityAudit, AuditTypeDefinition } from '@/lib/types/modules';

interface AuditSummaryDashboardProps {
  audits: QualityAudit[];
  onSelectAudit: (audit: QualityAudit) => void;
  onConductAudit: (initialAuditType?: AuditTypeDefinition) => void;
  onSwitchToList: () => void;
  onSwitchToCalendar: () => void;
}

export function AuditSummaryDashboard({
  audits,
  onSelectAudit,
  onConductAudit,
  onSwitchToList,
  onSwitchToCalendar,
}: AuditSummaryDashboardProps) {
  // ─── KPI METRICS ─────────────────────────────────────────────────────────────
  const totalCount = audits.length;

  const avgAuditScore = useMemo(() => {
    if (totalCount === 0) return 0;
    const sum = audits.reduce(
      (acc, a) => acc + (a.obtainedMarks ?? a.scorePercentage ?? 0),
      0
    );
    return Number((sum / totalCount).toFixed(1));
  }, [audits, totalCount]);

  const passedAudits = useMemo(() => {
    return audits.filter((a) => {
      const hasCritical = (a.criticalNCs ?? 0) > 0;
      if (hasCritical) return false;
      const score = a.obtainedMarks ?? a.scorePercentage ?? 0;
      return a.isPassed !== undefined ? a.isPassed : score >= 80;
    });
  }, [audits]);

  const passRate = totalCount > 0 ? Math.round((passedAudits.length / totalCount) * 100) : 0;

  const totalCriticalNCs = useMemo(
    () => audits.reduce((sum, a) => sum + (a.criticalNCs ?? 0), 0),
    [audits]
  );
  const totalMajorNCs = useMemo(
    () => audits.reduce((sum, a) => sum + (a.majorNCs ?? 0), 0),
    [audits]
  );
  const totalMinorNCs = useMemo(
    () => audits.reduce((sum, a) => sum + (a.minorNCs ?? 0), 0),
    [audits]
  );
  const totalObservations = useMemo(
    () => audits.reduce((sum, a) => sum + (a.observations ?? 0), 0),
    [audits]
  );
  const totalNCs = totalCriticalNCs + totalMajorNCs + totalMinorNCs;

  // ─── CATEGORY BREAKDOWN ──────────────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const stats = {
      INTERNAL: { count: 0, sumScore: 0, passed: 0, label: 'Internal QMS (ISO 9001)', color: 'blue' },
      EXTERNAL: { count: 0, sumScore: 0, passed: 0, label: 'Third-Party / Customer', color: 'indigo' },
      SUB_SUPPLIER: { count: 0, sumScore: 0, passed: 0, label: 'Sub-Supplier Quality', color: 'emerald' },
      SAFETY: { count: 0, sumScore: 0, passed: 0, label: 'Safety & EHS (OSHA)', color: 'amber' },
    };

    audits.forEach((a) => {
      let cat: keyof typeof stats = 'INTERNAL';
      if (
        a.auditCategory === 'SAFETY' ||
        a.auditType === 'SAFETY' ||
        a.auditType === 'SAF-EHS' ||
        a.standard?.toLowerCase().includes('safety')
      ) {
        cat = 'SAFETY';
      } else if (a.auditCategory === 'SUB_SUPPLIER' || a.auditType === 'SUB_SUPPLIER') {
        cat = 'SUB_SUPPLIER';
      } else if (
        a.auditCategory === 'EXTERNAL' ||
        a.auditType === 'EXTERNAL' ||
        a.auditType === 'BUYER_TECHNICAL' ||
        a.auditType === 'SOCIAL_COMPLIANCE'
      ) {
        cat = 'EXTERNAL';
      }

      stats[cat].count += 1;
      const score = a.obtainedMarks ?? a.scorePercentage ?? 0;
      stats[cat].sumScore += score;
      if (score >= 80 && (a.criticalNCs ?? 0) === 0) {
        stats[cat].passed += 1;
      }
    });

    return stats;
  }, [audits]);

  // ─── RECENT CONDUCTED AUDITS (Sorted Descending by Date) ──────────────────────
  const recentAudits = useMemo(() => {
    return [...audits]
      .sort((a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime())
      .slice(0, 5);
  }, [audits]);

  // ─── UPCOMING SCHEDULED AUDITS (Sorted Ascending by nextAuditDate) ───────────
  const upcomingAudits = useMemo(() => {
    return audits
      .filter((a) => a.nextAuditDate)
      .sort((a, b) => new Date(a.nextAuditDate!).getTime() - new Date(b.nextAuditDate!).getTime())
      .slice(0, 4);
  }, [audits]);

  // Next imminent audit
  const nextAudit = upcomingAudits[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── ROW 1: 5 PRIMARY KPI STAT CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total QMS Audits"
          value={totalCount}
          subtitle={`${passedAudits.length} Passed, ${totalCount - passedAudits.length} Require Action`}
          icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Average Audit Score"
          value={`${avgAuditScore}%`}
          subtitle="Target Benchmark ≥ 80%"
          delta={{
            value: avgAuditScore >= 80 ? 'Above Target' : 'Below Target',
            isPositive: avgAuditScore >= 80,
            label: 'benchmark',
          }}
          icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Pass Rate (≥80 Marks)"
          value={`${passRate}%`}
          subtitle={`${passedAudits.length} of ${totalCount} Audits Passed`}
          delta={{ value: `${passRate}%`, isPositive: passRate >= 80, label: 'compliance' }}
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Total Non-Conformances"
          value={totalNCs}
          subtitle={`${totalCriticalNCs} Critical, ${totalMajorNCs} Major`}
          delta={{
            value: totalCriticalNCs > 0 ? `${totalCriticalNCs} Critical` : '0 Critical',
            isPositive: totalCriticalNCs === 0,
            label: totalCriticalNCs > 0 ? 'Urgent CAPA' : 'Under Control',
          }}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Next Scheduled Audit"
          value={nextAudit ? nextAudit.nextAuditDate : 'No Schedule'}
          subtitle={nextAudit ? nextAudit.supplierName || nextAudit.auditeeDepartment : 'All Audits Current'}
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* ─── ROW 2: VISUAL ANALYTICS & CHARTS GRID ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: AUDIT PERFORMANCE BY SCORE (Visual Bar Chart vs Benchmark) ─ */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Audit Performance Scores vs 80% Benchmark</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparative evaluation across recent audit cycles (100-mark standardized scale)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>≥90% Grade A</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>80–89% Passed</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>&lt;80% Fail / Crit</span>
              </span>
            </div>
          </div>

          {/* SVG / HTML Bar Chart with 80% Benchmark Line */}
          <div className="relative pt-6 pb-2">
            {/* Benchmark Guideline Line at 80% */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-amber-400 z-10 pointer-events-none"
              style={{ bottom: '80%' }}
            >
              <span className="absolute right-0 -top-3 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                80% Pass Benchmark
              </span>
            </div>

            {/* Bars container */}
            <div className="h-52 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-slate-200">
              {audits.slice(0, 7).map((audit) => {
                const score = audit.obtainedMarks ?? audit.scorePercentage ?? 0;
                const hasCritical = (audit.criticalNCs ?? 0) > 0;
                const isGradeA = score >= 90 && !hasCritical;
                const isPass = score >= 80 && !hasCritical;

                return (
                  <div
                    key={audit.id}
                    onClick={() => onSelectAudit(audit)}
                    className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end"
                    title={`${audit.auditCode} - ${audit.standard} (${score}%)`}
                  >
                    {/* Tooltip / Score Bubble on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white whitespace-nowrap shadow-md">
                      {score}%
                    </div>

                    {/* Bar Pill */}
                    <div
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-xs relative ${
                        hasCritical
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                          : isGradeA
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                          : isPass
                          ? 'bg-gradient-to-t from-blue-600 to-cyan-400'
                          : 'bg-gradient-to-t from-amber-600 to-amber-400'
                      }`}
                      style={{ height: `${Math.max(12, Math.min(100, score))}%` }}
                    >
                      {hasCritical && (
                        <span className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white animate-ping" />
                      )}
                    </div>

                    {/* Label below bar */}
                    <div className="w-full text-center mt-2">
                      <span className="text-[10px] font-mono font-bold text-slate-700 block truncate group-hover:text-blue-600">
                        {audit.auditCode.replace('AUD-', '')}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        {audit.auditDate.slice(5)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHART 2: NON-CONFORMANCE SEVERITY & RISK MATRIX ──────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Non-Conformance Severity Mix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of {totalNCs} recorded findings by corrective risk tier
            </p>
          </div>

          <div className="space-y-3">
            {/* Critical NCs */}
            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>Critical NCs (Auto-Fail)</span>
                </span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  {totalCriticalNCs}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-rose-200 overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{
                    width: `${totalNCs > 0 ? (totalCriticalNCs / totalNCs) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-rose-600">Immediate containment required</span>
            </div>

            {/* Major NCs */}
            <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Major Non-Conformances</span>
                </span>
                <span className="font-mono font-black text-orange-700 text-sm">
                  {totalMajorNCs}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-orange-200 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: `${totalNCs > 0 ? (totalMajorNCs / totalNCs) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-orange-600">Corrective CAPA plan within 7 days</span>
            </div>

            {/* Minor NCs */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Minor Non-Conformances</span>
                </span>
                <span className="font-mono font-black text-amber-700 text-sm">
                  {totalMinorNCs}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-amber-200 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${totalNCs > 0 ? (totalMinorNCs / totalNCs) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-amber-600">Process fine-tuning & SOP updates</span>
            </div>

            {/* Observations */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Observations Logged</span>
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {totalObservations}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 3: CATEGORY HEALTH & CAPABILITY CARDS ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Internal ISO 9001 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {categoryStats.INTERNAL.count} Audits
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Internal QMS ISO 9001</h4>
            <p className="text-xs text-slate-500 mt-0.5">Leadership, risk & process control</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Average Score:</span>
            <span className="font-mono font-bold text-slate-900">
              {categoryStats.INTERNAL.count > 0
                ? `${(categoryStats.INTERNAL.sumScore / categoryStats.INTERNAL.count).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Pass Rate:</span>
            <span className="font-mono font-bold text-emerald-600">
              {categoryStats.INTERNAL.count > 0
                ? `${Math.round((categoryStats.INTERNAL.passed / categoryStats.INTERNAL.count) * 100)}%`
                : '100%'}
            </span>
          </div>
        </div>

        {/* Card 2: External 3rd Party */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Award className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
              {categoryStats.EXTERNAL.count} Audits
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Third-Party & Customer</h4>
            <p className="text-xs text-slate-500 mt-0.5">H&M, Inditex, WRAP Platinum</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Average Score:</span>
            <span className="font-mono font-bold text-slate-900">
              {categoryStats.EXTERNAL.count > 0
                ? `${(categoryStats.EXTERNAL.sumScore / categoryStats.EXTERNAL.count).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Report Status:</span>
            <span className="font-mono font-bold text-indigo-600">
              Certificates Uploaded
            </span>
          </div>
        </div>

        {/* Card 3: Sub-Supplier Quality */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {categoryStats.SUB_SUPPLIER.count} Audits
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Sub-Supplier Module Sync</h4>
            <p className="text-xs text-slate-500 mt-0.5">Mills, Dyehouses & Accessories</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Average Score:</span>
            <span className="font-mono font-bold text-slate-900">
              {categoryStats.SUB_SUPPLIER.count > 0
                ? `${(categoryStats.SUB_SUPPLIER.sumScore / categoryStats.SUB_SUPPLIER.count).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Directory Sync:</span>
            <span className="font-mono font-bold text-emerald-600">
              Active Two-Way
            </span>
          </div>
        </div>

        {/* Card 4: Safety & EHS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              {categoryStats.SAFETY.count} Audits
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Safety & EHS (ISO 45001)</h4>
            <p className="text-xs text-slate-500 mt-0.5">Fire safety, PPE, chemical health</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Average Score:</span>
            <span className="font-mono font-bold text-slate-900">
              {categoryStats.SAFETY.count > 0
                ? `${(categoryStats.SAFETY.sumScore / categoryStats.SAFETY.count).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Safety Critical Rule:</span>
            <span className="font-mono font-bold text-amber-700">
              Strict Enforcement
            </span>
          </div>
        </div>
      </div>

      {/* ─── ROW 4: RECENT AUDITS FEED & UPCOMING SCHEDULE SPLIT ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT AUDITS REGISTER (2 Columns on large screens) ──────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Recent Audits Registry</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest completed quality evaluations with verified scorecards
              </p>
            </div>
            <button
              type="button"
              onClick={onSwitchToList}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              <span>View All ({totalCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAudits.map((item) => {
              const score = item.obtainedMarks ?? item.scorePercentage ?? 0;
              const hasCritical = (item.criticalNCs ?? 0) > 0;
              const isPass = score >= 80 && !hasCritical;

              const isSafety =
                item.auditCategory === 'SAFETY' ||
                item.auditType === 'SAFETY' ||
                item.standard?.toLowerCase().includes('safety');
              const isSubSupplier =
                item.auditCategory === 'SUB_SUPPLIER' || item.auditType === 'SUB_SUPPLIER';

              return (
                <div
                  key={item.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSafety
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : isSubSupplier
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}
                    >
                      {isSafety ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isSubSupplier ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          onClick={() => onSelectAudit(item)}
                          className="font-mono font-bold text-xs text-blue-700 hover:underline cursor-pointer"
                        >
                          {item.auditCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                            isSafety
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : isSubSupplier
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {item.auditType}
                        </span>
                        {item.subSupplierCode && (
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.subSupplierCode}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.auditDate}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-900 truncate max-w-md">
                        {item.standard}
                      </div>

                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                        <span>{item.supplierName || item.auditeeDepartment}</span>
                        <span>•</span>
                        <span>Auditor: {item.auditorName.split(',')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & View details */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <span
                        className={`font-mono font-black text-xs px-2 py-0.5 rounded-md inline-block ${
                          hasCritical
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isPass
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {score}%
                      </span>
                      <span className="block text-[9px] font-bold text-slate-500 mt-0.5">
                        {hasCritical ? 'FAILED (CRIT)' : isPass ? 'PASSED' : 'ACTION REQ.'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectAudit(item)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                      title="View Audit Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UPCOMING AUDITS ACTION HUB ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Upcoming Audit Schedule</span>
              </h3>
              <button
                type="button"
                onClick={onSwitchToCalendar}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
              >
                Calendar
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled re-audits and compliance renewals
            </p>
          </div>

          <div className="space-y-3">
            {upcomingAudits.length > 0 ? (
              upcomingAudits.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-purple-50/40 border border-slate-200 hover:border-purple-200 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {item.nextAuditDate}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 font-mono">
                        {item.auditType}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-900 line-clamp-1">
                        {item.supplierName || item.auditeeDepartment || item.standard}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {item.standard}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500 truncate max-w-[140px]">
                        Lead: {item.auditorName.split(',')[0]}
                      </span>
                      <button
                        type="button"
                        onClick={() => onConductAudit()}
                        className="font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <span>Conduct Now</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No upcoming audits scheduled.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onConductAudit()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition-all shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Conduct New Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
