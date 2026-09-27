'use client';

import React from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Building2,
  UserCheck,
  Download,
  Check,
  ShieldAlert,
  ClipboardList,
  Sliders,
  Share2,
} from 'lucide-react';
import { ProcedureItem } from '@/lib/types/modules';

interface ProcedureDetailsPageProps {
  procedure: ProcedureItem;
  onBack: () => void;
  onEdit: (procedure: ProcedureItem) => void;
  onDuplicate: (procedure: ProcedureItem) => void;
  onDelete: (procedure: ProcedureItem) => void;
  onUpdateStatus?: (updated: ProcedureItem) => void;
  showToast: (msg: string) => void;
}

export function ProcedureDetailsPage({
  procedure,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateStatus,
  showToast,
}: ProcedureDetailsPageProps) {
  const departments = procedure.departmentProcesses || [];
  const relatedDocs = procedure.relatedDocuments || [];
  const distributionList = procedure.distribution || [];
  const responsibilities = procedure.responsibilities || [];

  const handleStatusChange = (newStatus: ProcedureItem['status']) => {
    const updated: ProcedureItem = {
      ...procedure,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateStatus?.(updated);
    showToast(`Procedure status updated to ${newStatus}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP NAVIGATION & ACTION BAR (EXACT STYLE OF BUYER & ORDER MODULE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Procedure Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {procedure.procedureCode}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {procedure.issueNo ? `Issue: ${procedure.issueNo}` : procedure.revision}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  procedure.status === 'ACTIVE' || procedure.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : procedure.status === 'UNDER_REVIEW'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {procedure.status || 'ACTIVE'}
              </span>

              {procedure.controlledDocument !== false && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                  <span>Controlled Document</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {procedure.companyName ? `${procedure.companyName} • ` : ''}
              {procedure.department || 'QUALITY'} •{' '}
              {procedure.documentType || 'Standard Operating Procedure (SOP)'}
            </p>
          </div>
        </div>

        {/* Action Buttons styled like Buyer Order */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status selector */}
          <select
            value={procedure.status || 'ACTIVE'}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="DRAFT">Status: Draft</option>
            <option value="UNDER_REVIEW">Status: Under Review</option>
            <option value="APPROVED">Status: Approved</option>
            <option value="ACTIVE">Status: Active</option>
            <option value="ARCHIVED">Status: Archived</option>
          </select>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Print SOP"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print SOP</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(procedure)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(procedure)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Procedure</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(procedure)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* CLEAN LIGHT-THEMED HEADER CARD (NO DARK CARD) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {procedure.procedureCode}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">
              {procedure.title}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              {procedure.companyName ? `${procedure.companyName} • ` : ''}
              {procedure.documentReference || procedure.procedureCode} • Issue {procedure.issueNo || '01'} ({procedure.revision || 'Rev 1.0'})
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              Status: {procedure.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Quick meta indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
            <span className="font-bold text-slate-800">{procedure.department || 'QUALITY'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Workstation Gate</span>
            <span className="font-bold text-slate-800">{procedure.station.replace(/_/g, ' ')}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Approval Date</span>
            <span className="font-mono font-semibold text-slate-800">{procedure.approvalDate || 'Approved'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Review Date</span>
            <span className="font-mono font-semibold text-slate-800">{procedure.nextReviewDate || 'Annual'}</span>
          </div>
        </div>
      </div>

      {/* DOCUMENT CONTROL SCHEDULE TABLE (MATCHING QMS STANDARD) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Document Control Schedule
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">ISO / QMS Standard Format</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="w-1/3 px-5 py-2.5 font-bold text-slate-600 bg-slate-50/70 border-r border-slate-100">
                  Name of Department
                </td>
                <td className="px-5 py-2.5 font-semibold text-slate-900">
                  {procedure.department || 'QUALITY'}
                </td>
              </tr>
              <tr>
                <td className="px-5 py-2.5 font-bold text-slate-600 bg-slate-50/70 border-r border-slate-100">
                  Document Type
                </td>
                <td className="px-5 py-2.5 text-slate-800">
                  {procedure.documentType || 'Standard Operating Procedure (SOP)'}
                </td>
              </tr>
              <tr>
                <td className="px-5 py-2.5 font-bold text-slate-600 bg-slate-50/70 border-r border-slate-100">
                  Document Reference
                </td>
                <td className="px-5 py-2.5 font-mono font-bold text-blue-700">
                  {procedure.documentReference || procedure.procedureCode}
                </td>
              </tr>
              <tr>
                <td className="px-5 py-2.5 font-bold text-slate-600 bg-slate-50/70 border-r border-slate-100">
                  Issue No &amp; Revision
                </td>
                <td className="px-5 py-2.5 font-mono font-semibold text-slate-800">
                  Issue {procedure.issueNo || '01'} ({procedure.revision})
                </td>
              </tr>
              <tr>
                <td className="px-5 py-2.5 font-bold text-slate-600 bg-slate-50/70 border-r border-slate-100">
                  Author / Prepared By
                </td>
                <td className="px-5 py-2.5 font-semibold text-slate-900">
                  {procedure.authorName || 'Management Representative (MR)'}
                </td>
              </tr>
              <tr>
                <td className="px-5 py-2.5 font-bold text-slate-600 bg-slate-50/70 border-r border-slate-100">
                  Approved By
                </td>
                <td className="px-5 py-2.5 font-semibold text-slate-900">
                  {procedure.approvedByName || 'Managing Director (MD)'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 1.0 PURPOSE & SCOPE & MANDATORY PPE REQUIREMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Purpose and Scope */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1.0 Purpose and Scope
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Clause 1.0</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-3 rounded-xl border border-slate-100">
            {procedure.purposeAndScope ||
              'To define standard manufacturing processes, quality gates, and inspection criteria to guarantee conforming product flow.'}
          </p>
        </div>

        {/* Mandatory PPE & Safety Compliance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Mandatory PPE &amp; Safety Compliance
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              HSE Gate
            </span>
          </div>
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <span className="font-semibold block mb-1">Required Safety Equipment:</span>
            <p className="text-[11px] leading-relaxed text-amber-800">
              {procedure.ppeRequirement || 'Cut-resistant steel mesh gloves, hair nets, safety goggles, anti-static footwear'}
            </p>
          </div>

          {procedure.criticalCheckpoints && procedure.criticalCheckpoints.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Critical Checkpoints:
              </span>
              <ul className="text-xs space-y-1 text-slate-700">
                {procedure.criticalCheckpoints.map((cp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{cp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 2.0 RESPONSIBILITIES & AUTHORITIES MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2.0 Responsibilities &amp; Authorities Matrix
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">RACI Role Matrix</span>
        </div>

        <div className="divide-y divide-slate-100">
          {responsibilities.map((resp, idx) => (
            <div
              key={idx}
              className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors"
            >
              <div className="sm:w-1/3 shrink-0">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span>{resp.role}</span>
                </div>
                {resp.authorityLevel && (
                  <span className="inline-block mt-1 text-[10px] font-medium font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {resp.authorityLevel}
                  </span>
                )}
              </div>
              <div className="sm:w-2/3 text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                {resp.responsibility}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3.0 DEPARTMENT-WISE PROCESS CONTROL STAGES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3.0 Department-wise Process Control Stages ({departments.length} Sections)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Clause 3.0</span>
        </div>

        <div className="space-y-4">
          {departments.map((dept) => (
            <div
              key={dept.departmentCode || dept.departmentName}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                    {dept.departmentCode || '3.0'}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{dept.departmentName}</span>
                </div>
                {dept.inChargeRole && (
                  <span className="text-[11px] text-slate-500">
                    In-Charge: <strong className="text-slate-700">{dept.inChargeRole}</strong>
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100 p-3 space-y-2">
                {dept.steps.map((st) => (
                  <div key={st.stepNumber} className="p-2.5 rounded-lg bg-slate-50/40 text-xs space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="font-mono font-bold text-slate-700 shrink-0">
                          {st.stepNumber}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900">{st.title}</span>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                            {st.description}
                          </p>
                        </div>
                      </div>

                      {st.relatedFormCode && (
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                          {st.relatedFormCode}
                        </span>
                      )}
                    </div>

                    {(st.inspectionFrequency || st.acceptanceCriteria) && (
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 pt-1 pl-6">
                        {st.inspectionFrequency && (
                          <span>Freq: <strong className="text-slate-700">{st.inspectionFrequency}</strong></span>
                        )}
                        {st.acceptanceCriteria && (
                          <span>• Standard: <strong className="text-emerald-700">{st.acceptanceCriteria}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4.0 RELATED DOCUMENTS & QA REPORTS REGISTER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              4.0 Related Documents &amp; Reports ({relatedDocs.length} Records)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Clause 4.0</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Doc Code</th>
                <th className="py-2.5 px-4">Document / Inspection Report Title</th>
                <th className="py-2.5 px-4">Department / Category</th>
                <th className="py-2.5 px-4">Frequency</th>
                <th className="py-2.5 px-4">Retention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {relatedDocs.map((doc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {doc.documentCode}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {doc.documentTitle}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                    {doc.category || 'Quality'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {doc.frequency || 'Standing SOP'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                    {doc.retentionPeriod || '3 Years'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5.0 DISTRIBUTION & CONTROLLED CIRCULATION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              5.0 Distribution &amp; Controlled Circulation Register
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Clause 5.0</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {distributionList.map((dist, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1"
            >
              <div className="font-bold text-slate-900">{dist.departmentOrFile}</div>
              <div className="text-[11px] text-slate-500">
                Custodian: <span className="font-medium text-slate-700">{dist.recipientName || 'Authorized In-Charge'}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-blue-700">
                  {dist.copyType.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{dist.status || 'ACKNOWLEDGED'}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 italic pt-2">
          Note: This standard operating procedure is subject to periodic review to maintain its operational effectiveness.
        </p>
      </div>
    </div>
  );
}
