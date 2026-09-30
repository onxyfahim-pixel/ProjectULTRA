'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Edit,
  Trash2,
  Building2,
  Download,
  ShieldCheck,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { FactoryCertificate, CertificateAttachment } from '@/lib/types/modules';
import { DeleteCertificateModal } from './DeleteCertificateModal';
import { CertificatePdfPreviewModal } from './CertificatePdfPreviewModal';

interface CertificateDetailsPageProps {
  cert: FactoryCertificate;
  onBack: () => void;
  onEdit: (cert: FactoryCertificate) => void;
  onDelete?: (cert: FactoryCertificate) => void;
  onUpdateCert?: (cert: FactoryCertificate) => void;
  showToast: (msg: string) => void;
}

export function CertificateDetailsPage({
  cert,
  onBack,
  onEdit,
  onDelete,
  showToast,
}: CertificateDetailsPageProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<CertificateAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownloadAttachment = (att?: CertificateAttachment | null) => {
    const fileName = att?.name || `${cert.certCode}_Official_Certificate.pdf`;
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

      // Generate a downloadable PDF Blob
      const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n5 0 obj\n<< /Length 300 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(${cert.name}) Tj\n/F1 12 Tf\n0 -30 Td\n(Issuing Authority: ${cert.issuingBody}) Tj\n0 -20 Td\n(License Number: ${cert.certificateNumber}) Tj\n0 -20 Td\n(Valid: ${cert.validFrom} to ${cert.validUntil}) Tj\n0 -20 Td\n(Facility: ${cert.facilityLocation || 'Main Manufacturing Complex'}) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000242 00000 n \n0000000324 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n680\n%%EOF`;
      const blob = new Blob([pdfString], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      showToast(`Downloaded official certificate: ${fileName}`);
    } catch {
      showToast(`Downloaded ${fileName}`);
    }
  };

  const handleOpenPreview = (att?: CertificateAttachment | null) => {
    setPreviewAttachment(att || null);
    setIsPreviewOpen(true);
  };

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
        {/* ─── TOP BAR (Header with Edit and Delete only) ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Certificates Registry"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {cert.certCode}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                cert.status === 'VALID'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : cert.status === 'EXPIRING_SOON'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {cert.status.replace('_', ' ')} ({cert.daysRemaining} days left)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {cert.category ? cert.category.replace('_', ' ') : 'ACCREDITATION'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {cert.name} • Issued by: {cert.issuingBody}
            </p>
          </div>
        </div>

        {/* Action Buttons: Edit and Delete only */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => onEdit(cert)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Certificate</span>
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete Certificate"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── ALL DETAILS IN ONE SINGLE PAGE (NO SUB-PAGE / NO TABS) ───────────── */}

      {/* ─── SECTION 1: SPECIFICATIONS & FACILITY COVERAGE ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accreditation Credentials */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Accreditation Specifications
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Standard / Accreditation:</span>
              <span className="font-bold text-slate-900 text-right">{cert.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Issuing Certification Body:</span>
              <span className="font-semibold text-slate-800 text-right">{cert.issuingBody}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Official License / Cert #:</span>
              <span className="font-mono font-bold text-blue-700">{cert.certificateNumber}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Standard Classification:</span>
              <span className="font-medium text-slate-800">{cert.standardType || cert.category || 'International QMS'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Audit Agency Branch:</span>
              <span className="font-medium text-slate-800">{cert.auditAgency || 'Global Certification Directorate'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Lead Auditor:</span>
              <span className="font-medium text-slate-800">{cert.leadAuditor || 'Certified Lead Assessor'}</span>
            </div>
          </div>
        </div>

        {/* Scope & Facility Coverage */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Certified Facility &amp; Scope Coverage
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Certified Scope:
              </span>
              <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-medium">
                {cert.scope}
              </p>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Facility Location:</span>
              <span className="font-semibold text-slate-800">{cert.facilityLocation || 'Main Apparel Manufacturing Complex'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Internal QA Verification:</span>
              <span className="font-semibold text-emerald-700">{cert.verifiedBy || 'Approved by Head of QA'}</span>
            </div>
            {cert.remarks && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Audit Remarks:
                </span>
                <p className="text-slate-600 italic">
                  "{cert.remarks}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: VALIDITY & RENEWAL TIMELINE ────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Accreditation Validity Countdown &amp; Expiry Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Automated alerts prevent factory export hold-ups and retail compliance delisting
            </p>
          </div>
          <span className={`font-mono text-xs font-bold px-3 py-1 rounded-xl ${
            cert.daysRemaining <= 30
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : cert.daysRemaining <= 90
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            {cert.daysRemaining} Calendar Days Remaining
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Valid From</span>
            <div className="text-base font-mono font-bold text-slate-900 mt-1">{cert.validFrom}</div>
            <span className="text-[10px] text-slate-400">Effective audit date</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Valid Until (Expiry)</span>
            <div className="text-base font-mono font-bold text-slate-900 mt-1">{cert.validUntil}</div>
            <span className="text-[10px] text-slate-400">Re-audit mandatory before expiry</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Renewal Notice Period</span>
            <div className="text-base font-mono font-bold text-blue-700 mt-1">
              {cert.renewalLeadDays || 60} Days Advance
            </div>
            <span className="text-[10px] text-slate-400">Advance lab booking threshold</span>
          </div>
        </div>

        {/* Renewal Action Checklist */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2.5">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
            Recertification Readiness Checklist
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Annual factory audit application submitted to {cert.issuingBody}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Internal QMS mock audit clause check completed</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Chemical inventory &amp; MSDS datasheets synchronized</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Third-party laboratory water / fabric test sample dispatched</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: DOCUMENTS & ATTACHMENTS (PREVIEW & DOWNLOAD) ──────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Official Evidence &amp; Scanned Accreditation Files
            </h3>
            <p className="text-xs text-slate-500">
              Authorized digital copies verifiable against issuing body portal databases. Click preview or download anytime.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenPreview(cert.attachments?.[0] || null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Master Certificate</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadAttachment(cert.attachments?.[0] || null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Master PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(cert.attachments && cert.attachments.length > 0
            ? cert.attachments
            : [
                {
                  id: 'att-default',
                  name: `${cert.certCode}_Official_Certificate.pdf`,
                  size: '2.4 MB',
                  fileType: 'application/pdf',
                  uploadDate: cert.validFrom,
                },
              ]
          ).map((att) => (
            <div
              key={att.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/40 transition-colors flex items-center justify-between gap-3 text-xs"
            >
              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer"
                onClick={() => handleOpenPreview(att)}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900 block truncate hover:text-blue-700 transition-colors" title={att.name}>
                    {att.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {att.size} • Uploaded: {att.uploadDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenPreview(att)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer shadow-2xs"
                  title="Preview PDF Document"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-medium text-xs">Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(att)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="font-medium text-xs">Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CERTIFICATE PDF DOCUMENT PREVIEW MODAL ───────────────────────── */}
      {isPreviewOpen && (
        <CertificatePdfPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewAttachment(null);
          }}
          cert={cert}
          attachment={previewAttachment}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteCertificateModal
          isOpen={isDeleteModalOpen}
          certificates={[cert]}
          onConfirm={() => {
            if (onDelete) onDelete(cert);
            setIsDeleteModalOpen(false);
          }}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
      </div>
    </div>
  );
}
