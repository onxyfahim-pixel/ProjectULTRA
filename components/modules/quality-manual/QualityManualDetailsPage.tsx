'use client';

import React from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Copy,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  FileCheck,
  Check,
  Award,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { QualityManualSection, QualityManualStatus } from '@/lib/types/modules';

interface QualityManualDetailsPageProps {
  section: QualityManualSection;
  onBack: () => void;
  onEdit: (section: QualityManualSection) => void;
  onDuplicate: (section: QualityManualSection) => void;
  onDelete: (section: QualityManualSection) => void;
  onUpdateStatus?: (updated: QualityManualSection) => void;
  showToast: (msg: string) => void;
}

export function QualityManualDetailsPage({
  section,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateStatus,
  showToast,
}: QualityManualDetailsPageProps) {
  const handleStatusChange = (newStatus: QualityManualStatus) => {
    const updated: QualityManualSection = {
      ...section,
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
      {/* TOP ACTION BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Back to Quality Manual Chapters"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                {section.chapterNumber}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                {section.clauseReference}
              </span>
              <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                {section.version || 'Rev 1.0'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">{section.title}</h1>
          </div>
        </div>

        {/* Action Buttons: Buyer & Order Style */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Status selector */}
          <select
            value={section.status || 'ACTIVE'}
            onChange={(e) => handleStatusChange(e.target.value as QualityManualStatus)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 cursor-pointer transition-colors"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="DRAFT">DRAFT</option>
            <option value="OBSOLETE">OBSOLETE</option>
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
            onClick={() => onDuplicate(section)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(section)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Chapter</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(section)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* METADATA HIGHLIGHT CARDS (All clean light styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Responsible Department</span>
          </div>
          <div className="font-bold text-slate-900 text-sm">{section.responsibleDepartment}</div>
          <div className="text-[11px] text-slate-500 font-mono">Custodian &amp; Audit Owner</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Executive Sign-Off</span>
          </div>
          <div className="font-bold text-slate-900 text-sm truncate" title={section.approvedBy}>
            {section.approvedBy || 'Managing Director'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Management Representative</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Effective Date</span>
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm">
            {section.effectiveDate || section.updatedAt}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Next Review: {section.nextReviewDate || 'Annual Review'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Standard Compliance</span>
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">
            {section.isoStandard || 'ISO 9001:2015'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {section.confidentiality || 'GENERAL_FACILITY'}
          </div>
        </div>
      </div>

      {/* SECTION 1: EXECUTIVE SUMMARY & OPERATIONAL SCOPE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Executive Summary &amp; Operational Scope
          </h2>
          <p className="text-xs text-slate-500">
            Mandatory policy scope and high-level corporate governance framework for this chapter.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="font-bold text-slate-900 text-xs block">Chapter Summary:</span>
          <p className="text-xs text-slate-700 leading-relaxed">{section.summary}</p>
        </div>

        {section.scope && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
            <span className="font-bold text-slate-900 block">Applicable Operational Scope:</span>
            <p className="text-slate-700 leading-relaxed">{section.scope}</p>
          </div>
        )}
      </div>

      {/* SECTION 2: MANDATORY QUALITY POLICY COMMITMENTS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Executive Quality Policy Commitments
          </h2>
          <p className="text-xs text-slate-500">
            Binding operational principles enforced across all manufacturing shifts, quality gates, and supplier relationships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(section.policyCommitments && section.policyCommitments.length > 0
            ? section.policyCommitments
            : [
                'Every department lead must ensure daily adherence to approved technical specifications and tech packs.',
                'No substandard fabric or trims may be released into cutting without formal laboratory approval.',
                'Operators are empowered with unilateral Stop-the-Line authority upon discovering recurring sewing defects.',
                'Complete traceability maintained from raw greige yarn inward to export carton dispatch.',
              ]
          ).map((commitment, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 flex items-start gap-2.5 text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <p className="text-slate-800 font-medium leading-relaxed">{commitment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: COMPLIANCE REQUIREMENTS & VERIFICATION MATRIX */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Compliance Requirements &amp; Verification Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Audit checkpoints, evidence records, and verification frequencies mandated by ISO 9001:2015.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
            {section.complianceRequirements?.length || 3} Monitored Checkpoints
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Audit Requirement</th>
                <th className="py-2.5 px-3">Verification Evidence &amp; Method</th>
                <th className="py-2.5 px-3">Audit Frequency</th>
                <th className="py-2.5 px-3 text-right">Conformance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(section.complianceRequirements && section.complianceRequirements.length > 0
                ? section.complianceRequirements
                : [
                    {
                      id: 'comp-def-1',
                      requirement: 'Documented procedure operational in daily manufacturing routines',
                      verificationMethod: 'Workstation floor audits and operator logs',
                      frequency: 'Monthly',
                      status: 'COMPLIANT' as const,
                    },
                    {
                      id: 'comp-def-2',
                      requirement: 'Staff training records signed and uploaded to HR module',
                      verificationMethod: 'Training attendance sheets & skill exams',
                      frequency: 'Quarterly',
                      status: 'COMPLIANT' as const,
                    },
                    {
                      id: 'comp-def-3',
                      requirement: 'Equipment calibrated with valid ISO 17025 certificates',
                      verificationMethod: 'Physical calibration sticker & certificate review',
                      frequency: 'Semi-Annual',
                      status: 'COMPLIANT' as const,
                    },
                  ]
              ).map((req, idx) => (
                <tr key={req.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium text-slate-900 max-w-xs">{req.requirement}</td>
                  <td className="py-3 px-3 text-slate-600">{req.verificationMethod}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{req.frequency}</td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        req.status === 'COMPLIANT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'NEEDS_ACTION'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{req.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: LINKED CONTROLLED DOCUMENTS & PROCEDURES */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Associated Controlled Documents &amp; Procedures
          </h2>
          <p className="text-xs text-slate-500">
            Directly referenced SOPs, procedures, forms, and policies in the ERP Document Control registry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(section.linkedDocuments && section.linkedDocuments.length > 0
            ? section.linkedDocuments
            : [
                { docNumber: 'DOC-QMS-001', title: 'Quality Management System Policy Manual', docType: 'POLICY' as const },
                { docNumber: 'PRC-CUT-01', title: 'Fabric Spreading & Natural Relaxation Protocol', docType: 'PROCEDURE' as const },
                { docNumber: 'SOP-QMS-02', title: 'Internal Quality Audit Standard Operating Procedure', docType: 'SOP' as const },
              ]
          ).map((doc, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                    {doc.docNumber}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                    {doc.docType}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate" title={doc.title}>
                  {doc.title}
                </div>
              </div>
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: REVISION HISTORY & SIGN-OFF LOG */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Revision History &amp; Approval Governance
          </h2>
          <p className="text-xs text-slate-500">
            Traceable changelog maintaining ISO 9001 Clause 7.5 documented information integrity.
          </p>
        </div>

        <div className="space-y-3">
          {(section.revisionHistory && section.revisionHistory.length > 0
            ? section.revisionHistory
            : [
                {
                  revision: section.version || 'Rev 1.0',
                  changeDate: section.updatedAt,
                  changedBy: section.author || 'QA Director',
                  description: 'Initial release and ISO 9001:2015 alignment approval.',
                },
              ]
          ).map((rev, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {rev.revision}
                  </span>
                  <span className="font-medium text-slate-900">{rev.description}</span>
                </div>
                <div className="text-[11px] text-slate-500">Changed by: {rev.changedBy}</div>
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0">{rev.changeDate}</span>
            </div>
          ))}
        </div>

        {/* Executive Sign-Off Signature Box */}
        <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Prepared By:
            </span>
            <div className="font-bold text-slate-900">{section.author || 'Tanzim Ahmed'}</div>
            <div className="text-[10px] text-slate-500">Quality Assurance Director</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Reviewed By:
            </span>
            <div className="font-bold text-slate-900">{section.reviewedBy || 'Mahmudul Hasan'}</div>
            <div className="text-[10px] text-slate-500">General Manager Operations</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
            <span className="text-[10px] font-mono text-blue-700 uppercase font-bold block">
              Approved By:
            </span>
            <div className="font-bold text-blue-950">{section.approvedBy || 'Managing Director'}</div>
            <div className="text-[10px] text-blue-700 font-medium">Executive Management Sign-Off</div>
          </div>
        </div>
      </div>
    </div>
  );
}
