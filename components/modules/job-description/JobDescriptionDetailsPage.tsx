'use client';

import React from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Copy,
  Briefcase,
  User,
  ShieldCheck,
  CheckCircle2,
  Building2,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  Clock,
  Layers,
  Check,
  ChevronRight,
  Shield,
  Target,
  Users,
} from 'lucide-react';
import { JobDescriptionItem, JobDescriptionStatus } from '@/lib/types/modules';

interface JobDescriptionDetailsPageProps {
  job: JobDescriptionItem;
  onBack: () => void;
  onEdit: (job: JobDescriptionItem) => void;
  onDuplicate: (job: JobDescriptionItem) => void;
  onDelete: (job: JobDescriptionItem) => void;
  onUpdateStatus?: (updated: JobDescriptionItem) => void;
  showToast: (msg: string) => void;
}

export function JobDescriptionDetailsPage({
  job,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateStatus,
  showToast,
}: JobDescriptionDetailsPageProps) {
  const handleStatusChange = (newStatus: JobDescriptionStatus) => {
    const updated: JobDescriptionItem = {
      ...job,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onUpdateStatus?.(updated);
    showToast(`Status updated to ${newStatus}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP ACTION BAR: Buyer & Order Styling */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Back to Job Descriptions Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                {job.roleCode}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {job.level}
              </span>
              <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                {job.revision || 'Rev 1.0'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">{job.title}</h1>
          </div>
        </div>

        {/* Action Buttons: Buyer & Order Style */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Status selector */}
          <select
            value={job.status || 'ACTIVE'}
            onChange={(e) => handleStatusChange(e.target.value as JobDescriptionStatus)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 cursor-pointer transition-colors"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="VACANT">VACANT</option>
            <option value="UNDER_REVISION">UNDER REVISION</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => onDuplicate(job)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(job)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(job)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* METADATA HIGHLIGHT CARDS (All clean light styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Incumbent & Company ID */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <User className="w-4 h-4 text-blue-600" />
            <span>Designated Incumbent</span>
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">
            {job.incumbentName || 'Position Vacant'}
          </div>
          <div className="text-[11px] font-mono text-blue-700 font-bold">
            Company ID: {job.companyIdNo || 'N/A'}
          </div>
        </div>

        {/* Direct Supervisor & ID */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Direct Supervisor</span>
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">
            {job.supervisorName || 'Executive Board'}
          </div>
          <div className="text-[11px] font-mono text-slate-500 truncate">
            {job.supervisorTitle || 'VP QA'} {job.supervisorIdNo ? `(${job.supervisorIdNo})` : ''}
          </div>
        </div>

        {/* Department & Location */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Department &amp; Station</span>
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">{job.department}</div>
          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{job.workstationLocation || 'Central Plant Floor'}</span>
          </div>
        </div>

        {/* Minimum Experience & Level */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <GraduationCap className="w-4 h-4 text-amber-600" />
            <span>Experience &amp; Grade</span>
          </div>
          <div className="font-bold text-slate-900 text-sm">
            Min. {job.experienceYears} Years
          </div>
          <div className="text-[11px] font-mono text-slate-500 font-medium">
            Grade: {job.level} • {job.employmentType || 'FULL_TIME'}
          </div>
        </div>
      </div>

      {/* SECTION 1: ISO 9001 DECISION AUTHORITY & AUDIT CLAUSES */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              ISO 9001:2015 Clause 5.3 &amp; 7.2 Decision Authority &amp; Scope
            </h2>
            <p className="text-xs text-slate-500">
              Formally delegated authority to enforce quality parameters, halt non-conforming lines, and release lots.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 self-start sm:self-auto">
            Mandated Under ISO 9001 Clause 5.3
          </span>
        </div>

        {/* Decision Authority Box */}
        <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-blue-950 text-xs uppercase tracking-wider">
              Autonomous Decision Authority:
            </span>
          </div>
          <p className="text-xs text-blue-900 leading-relaxed font-medium">
            {job.decisionAuthority ||
              'Autonomous authority to mandate line stops upon detecting recurring defects and enforce approved buyer specifications.'}
          </p>
        </div>

        {/* ISO Clause Mapping Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Applicable Standard Clauses:
          </span>
          <div className="flex flex-wrap gap-2">
            {(job.isoClauseMapping && job.isoClauseMapping.length > 0
              ? job.isoClauseMapping
              : [
                  'ISO 9001:2015 Clause 5.3 (Organizational Roles & Authorities)',
                  'ISO 9001:2015 Clause 7.2 (Competence & Training)',
                  'ISO 9001:2015 Clause 8.5 (Control of Production)',
                ]
            ).map((clause, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-medium"
              >
                {clause}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: KEY RESPONSIBILITIES & ACCOUNTABILITIES */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Primary Roles &amp; Operational Responsibilities
            </h2>
            <p className="text-xs text-slate-500">
              Daily job duties, compliance monitoring protocols, and operational handoff checklists.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {job.keyResponsibilities.length} Key Responsibilities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {job.keyResponsibilities.map((resp, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px] font-bold">
                {idx + 1}
              </div>
              <p className="text-slate-800 leading-relaxed font-medium">{resp}</p>
            </div>
          ))}
        </div>

        {/* Subordinate Direct Reports */}
        {job.reportingSubordinates && job.reportingSubordinates.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Direct Subordinate Reporting Roles:
            </span>
            <div className="flex flex-wrap gap-2">
              {job.reportingSubordinates.map((sub, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: EDUCATION, SKILLS & MANDATORY CERTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Education & Experience */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Educational &amp; Experience Credentials
            </h2>
            <p className="text-xs text-slate-500">
              Minimum hiring threshold and proven track record required for this role.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                Required Educational Degree:
              </span>
              <div className="font-bold text-slate-900 text-sm">{job.educationRequirement}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                Minimum Industry Experience:
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {job.experienceYears} Years in Garment Manufacturing / Quality Management
              </div>
            </div>

            {/* Certifications */}
            {job.certificationsRequired && job.certificationsRequired.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">
                  Mandatory Professional Certifications:
                </span>
                <div className="space-y-1.5">
                  {job.certificationsRequired.map((cert, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center gap-2 text-emerald-900 font-medium"
                    >
                      <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Competencies Matrix */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Technical Competencies Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated during recruitment, quarterly appraisals, and ISO 9001 Clause 7.2 audits.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.technicalSkills.map((skill, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-blue-600" />
                <span>{skill}</span>
              </div>
            ))}
          </div>

          {job.notes && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block">Auditor Reference Note:</span>
              <p>{job.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: KEY PERFORMANCE INDICATORS (KPIS) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Key Performance Indicators (KPIs) &amp; Evaluation Benchmarks
            </h2>
            <p className="text-xs text-slate-500">
              Objective metrics reviewed during monthly management reviews and annual performance appraisals.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
            {job.kpiMetrics?.length || 3} Monitored KPIs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Performance Metric / KPI</th>
                <th className="py-2.5 px-3">Target Benchmark</th>
                <th className="py-2.5 px-3">Evaluation Frequency</th>
                <th className="py-2.5 px-3 text-right">Alignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(job.kpiMetrics && job.kpiMetrics.length > 0
                ? job.kpiMetrics
                : [
                    { kpiName: 'Process Quality DHU', target: '< 2.5%', measurementFrequency: 'Daily' },
                    { kpiName: 'Buyer Audit Pass Rate', target: '≥ 98.5%', measurementFrequency: 'Per Shipment' },
                    { kpiName: 'Corrective Action (CAPA) On-Time Closure', target: '100%', measurementFrequency: 'Monthly' },
                  ]
              ).map((kpi, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{kpi.kpiName}</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">{kpi.target}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{kpi.measurementFrequency}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Target className="w-3 h-3" />
                      <span>ISO Aligned</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: GOVERNANCE SIGN-OFF */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Job Description Governance &amp; Executive Authorization
          </h2>
          <p className="text-xs text-slate-500">
            Formally executed per ISO 9001 Clause 5.3. Countersigned copies retained in personnel records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Incumbent Employee Acknowledgment:
            </span>
            <div className="font-bold text-slate-900">{job.incumbentName || 'Employee Name'}</div>
            <div className="text-[10px] text-slate-500 font-mono">
              ID: {job.companyIdNo || 'EMP-XXXX-XXXX'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Direct Supervisor Review:
            </span>
            <div className="font-bold text-slate-900">{job.supervisorName || 'Supervisor Name'}</div>
            <div className="text-[10px] text-slate-500">{job.supervisorTitle || 'Department Head'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
            <span className="text-[10px] font-mono text-blue-700 uppercase font-bold block">
              Executive Approval &amp; HR Validation:
            </span>
            <div className="font-bold text-blue-950">{job.approvedBy || 'Managing Director & CEO'}</div>
            <div className="text-[10px] text-blue-700 font-medium">Valid ISO 9001 Sign-off</div>
          </div>
        </div>
      </div>
    </div>
  );
}
