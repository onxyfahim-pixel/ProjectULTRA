'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Edit,
  Trash2,
  Download,
  Eye,
  ShieldCheck,
  Clock,
  Calendar,
  Layers,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  History,
  FolderGit2,
  FileCheck2,
  ExternalLink,
  Plus,
  FileDown,
} from 'lucide-react';
import { ControlledDocument, DocumentAttachment, DocumentRevision } from '@/lib/types/modules';
import { useModulePermission } from '@/hooks/use-module-permission';
import { DeleteDocumentModal } from './DeleteDocumentModal';
import { DocumentControlSingleExportModal } from './DocumentControlSingleExportModal';

interface DocumentControlDetailsPageProps {
  doc: ControlledDocument;
  onBack: () => void;
  onEdit: (doc: ControlledDocument) => void;
  onDelete?: (doc: ControlledDocument) => void;
  onUpdateDoc?: (doc: ControlledDocument) => void;
  showToast: (msg: string) => void;
}

export function DocumentControlDetailsPage({
  doc,
  onBack,
  onEdit,
  onDelete,
  onUpdateDoc,
  showToast,
}: DocumentControlDetailsPageProps) {
  const { canEdit, canDelete, canExport } = useModulePermission('document_control');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // New Revision Quick Logger Modal
  const [isNewRevModalOpen, setIsNewRevModalOpen] = useState(false);
  const [newRevVersion, setNewRevVersion] = useState('');
  const [newRevDescription, setNewRevDescription] = useState('');
  const [newRevReason, setNewRevReason] = useState('');
  const [newRevAuthor, setNewRevAuthor] = useState('Senior QMS Lead');
  const [newRevApprover, setNewRevApprover] = useState(doc.approvedBy || 'Head of QA');

  const handleDownloadAttachment = (att?: DocumentAttachment | null) => {
    const fileName = att?.name || `${doc.docNumber}_${doc.version.replace(/\s+/g, '_')}_Official_Controlled_Copy.pdf`;
    try {
      if (att?.url && att.url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = att.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Downloaded ${fileName}`);
        return;
      }

      // Generate downloadable PDF Blob
      const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n5 0 obj\n<< /Length 320 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(CONTROLLED DOCUMENT - ${doc.docNumber}) Tj\n/F1 12 Tf\n0 -30 Td\n(${doc.title}) Tj\n0 -20 Td\n(Revision: ${doc.version} | Category: ${doc.category}) Tj\n0 -20 Td\n(Department: ${doc.department} | Effective: ${doc.effectiveDate}) Tj\n0 -20 Td\n(Approved By: ${doc.approvedBy}) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000242 00000 n \n0000000324 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n680\n%%EOF`;
      const blob = new Blob([pdfString], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      showToast(`Downloaded official controlled copy: ${fileName}`);
    } catch {
      showToast(`Downloaded ${fileName}`);
    }
  };



  const handleSaveNewRevision = () => {
    if (!newRevVersion.trim() || !newRevDescription.trim()) {
      showToast('Please provide revision version and change description.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const newRevItem: DocumentRevision = {
      id: `rev-${Date.now()}`,
      version: newRevVersion.trim(),
      releaseDate: todayStr,
      changedBy: newRevAuthor.trim(),
      approvedBy: newRevApprover.trim(),
      changeDescription: newRevDescription.trim(),
      reasonForChange: newRevReason.trim() || 'Scheduled revision update',
    };

    const updatedChangeLog = [newRevItem, ...(doc.changeLog || [])];
    const updatedDoc: ControlledDocument = {
      ...doc,
      version: newRevVersion.trim(),
      effectiveDate: todayStr,
      changeLog: updatedChangeLog,
      updatedAt: new Date().toISOString(),
    };

    onUpdateDoc?.(updatedDoc);
    showToast(`Logged revision ${newRevVersion.trim()} for ${doc.docNumber}`);
    setIsNewRevModalOpen(false);
    setNewRevVersion('');
    setNewRevDescription('');
    setNewRevReason('');
  };

  const daysRemaining = doc.daysRemaining ?? 180;
  const isReviewSoon = daysRemaining <= 60 && doc.status === 'APPROVED_ACTIVE';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 xl:p-8 animate-in fade-in duration-150">
      <div className="w-full max-w-[1920px] mx-auto space-y-6 pb-20">
        {/* ─── TOP BAR (Header matching Certificate module) ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Master Document Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {doc.docNumber}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  doc.status === 'APPROVED_ACTIVE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : doc.status === 'UNDER_REVISION'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {doc.status.replace(/_/g, ' ')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                {doc.version}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                {doc.category.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {doc.title} &bull; Dept: {doc.department} &bull; Approver: {doc.approvedBy}
            </p>
          </div>
        </div>

        {/* Action Buttons - Styled identically to Certificate Module */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Export Document Dossier Button */}
          {canExport && (
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
              title="Export Document Dossier (PDF / Excel / CSV)"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Dossier</span>
            </button>
          )}

          {/* Edit Document Button */}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(doc)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Document</span>
            </button>
          )}

          {/* Delete Document Button */}
          {onDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── SECTION 1: METADATA & GOVERNANCE AUTHORIZATION ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Specifications */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Master Document Specifications
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Document Identifier</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                {doc.docNumber}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Controlled Category</span>
              <span className="font-medium text-slate-900 mt-0.5 block">
                {doc.category.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Current Version / Revision</span>
              <span className="font-mono font-bold text-blue-700 mt-0.5 block">
                {doc.version}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Responsible Department</span>
              <span className="font-medium text-slate-900 mt-0.5 block">
                {doc.department}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Security &amp; Confidentiality</span>
              <span className="font-mono text-slate-700 mt-0.5 block">
                {doc.confidentialityLevel || 'INTERNAL_CONFIDENTIAL'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">ISO 9001:2015 Clause</span>
              <span className="font-mono text-slate-700 mt-0.5 block">
                {doc.isoClause || 'Clause 7.5.3 (Control of Documented Information)'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-500 block">Master Storage Location</span>
            <span className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg block mt-1 border border-slate-100">
              {doc.documentLocation || 'Master QMS Vault / Controlled Docs / Tier-1'}
            </span>
          </div>
        </div>

        {/* Authorization & Review Cycle */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Review Cycle &amp; Governance Sign-Off
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Effective Release Date</span>
              <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                {doc.effectiveDate}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Next Mandatory Review</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                {doc.nextReviewDate}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Review Frequency</span>
              <span className="font-mono text-slate-700 mt-0.5 block">
                Every {doc.reviewFrequencyMonths || 12} Months
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Review Status Notice</span>
              <span
                className={`font-mono text-xs font-bold mt-0.5 inline-block ${
                  daysRemaining <= 30
                    ? 'text-rose-600'
                    : isReviewSoon
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}
              >
                {doc.status === 'OBSOLETE' ? 'Archived Document' : `${daysRemaining} days until review`}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Prepared By:</span>
              <span className="font-semibold text-slate-800">{doc.preparedBy || 'Senior QMS Specialist'}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Reviewed By:</span>
              <span className="font-semibold text-slate-800">{doc.reviewedBy || 'Technical Review Committee'}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-emerald-800 font-semibold">Authorized Sign-off:</span>
              <span className="font-bold text-emerald-950 font-mono">{doc.approvedBy}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: PURPOSE, SCOPE & CONTROLLED COPIES ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Purpose & Scope */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Purpose &amp; Scope of Application
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 block">
                Quality Objective &amp; Purpose
              </span>
              <p className="mt-1 text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {doc.purpose || 'Establishes documented procedures and operational quality guidelines in full compliance with ISO 9001:2015 Clause 7.5.'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 block">
                Scope &amp; Applicability Boundaries
              </span>
              <p className="mt-1 text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {doc.scope || 'Applicable across all designated production lines, quality inspection stages, and testing facilities.'}
              </p>
            </div>
          </div>
        </div>

        {/* Controlled Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Authorized Controlled Copy Distribution
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            Official hard/soft copies issued to designated stations. Reproduction without QMS authorization is strictly prohibited.
          </p>

          <div className="space-y-2">
            {doc.distributionList && doc.distributionList.length > 0 ? (
              doc.distributionList.map((dist, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                      COPY #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{dist}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Distributed
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Central Master QMS Vault Only
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: REVISION & CHANGE HISTORY LOG ───────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Revision &amp; Change Approval Log
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              const currentRevNum = parseFloat(doc.version.replace(/[^\d.]/g, '')) || 1.0;
              const nextRev = `Rev ${(currentRevNum + 0.1).toFixed(1)}`;
              setNewRevVersion(nextRev);
              setIsNewRevModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log New Revision</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50 font-mono text-[11px] text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Revision</th>
                <th className="py-2.5 px-3">Effective Date</th>
                <th className="py-2.5 px-3">Author</th>
                <th className="py-2.5 px-3">Authorized Approver</th>
                <th className="py-2.5 px-3">Reason for Change</th>
                <th className="py-2.5 px-3">Change Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doc.changeLog && doc.changeLog.length > 0 ? (
                doc.changeLog.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {rev.version}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {rev.releaseDate}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {rev.changedBy}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {rev.approvedBy}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {rev.reasonForChange || 'Scheduled revision'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 max-w-sm">
                      {rev.changeDescription}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{doc.version}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{doc.effectiveDate}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{doc.preparedBy || 'QA Systems'}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{doc.approvedBy}</td>
                  <td className="py-2.5 px-3 text-slate-600">Initial Master Publication</td>
                  <td className="py-2.5 px-3 text-slate-800">Original issue under Master Document Register</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SECTION 4: CONTROLLED FILES & ATTACHMENTS ──────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Controlled Digital Attachments &amp; Official Master Copy
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Document Files</span>
        </div>

        <div className="space-y-3">
          {doc.attachments && doc.attachments.length > 0 ? (
            doc.attachments.map((att) => (
              <div
                key={att.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-xs block truncate">
                        {att.name}
                      </span>
                      {att.revCaption && (
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          {att.revCaption}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Size: {att.size} &bull; Uploaded: {att.uploadDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadAttachment(att)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <FileText className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                No attachments uploaded for this document yet.
              </p>
              <p className="text-[11px] text-slate-400">
                Click &quot;Edit Document&quot; above to upload PDF or DOC/DOCX files with revision captions.
              </p>
            </div>
          )}
        </div>

        {/* Security Watermark Note */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2">
          <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Master Document Register Compliance Stamp</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Official controlled files with assigned revision numbers. Unstamped printed documents are considered uncontrolled for factory floor usage.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MODALS ─────────────────────────────────────────────────────────── */}
      <DeleteDocumentModal
        isOpen={isDeleteModalOpen}
        documents={[doc]}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDelete?.(doc);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Log New Revision Modal */}
      {isNewRevModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Log New Controlled Document Revision
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRevModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">New Revision Identifier *</label>
                  <input
                    type="text"
                    value={newRevVersion}
                    onChange={(e) => setNewRevVersion(e.target.value)}
                    placeholder="e.g. Rev 4.3"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason for Revision</label>
                  <input
                    type="text"
                    value={newRevReason}
                    onChange={(e) => setNewRevReason(e.target.value)}
                    placeholder="e.g. Annual audit update"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prepared By (Author)</label>
                  <input
                    type="text"
                    value={newRevAuthor}
                    onChange={(e) => setNewRevAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Authorized Approver</label>
                  <input
                    type="text"
                    value={newRevApprover}
                    onChange={(e) => setNewRevApprover(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Change Description *</label>
                <textarea
                  rows={3}
                  value={newRevDescription}
                  onChange={(e) => setNewRevDescription(e.target.value)}
                  placeholder="Detail the exact modifications made in this revision release..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewRevModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewRevision}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save &amp; Update Revision</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Controlled Document Export Modal */}
      <DocumentControlSingleExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        doc={doc}
      />
      </div>
    </div>
  );
}
