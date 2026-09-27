'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Package,
  Sparkles,
  Layers,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Check,
  RefreshCw,
  Plus,
  ShieldCheck,
  Tag,
  UploadCloud,
  Trash2,
  FileCheck,
  Clock,
  ExternalLink,
  Award,
  Globe,
  HelpCircle,
  X,
  Eye,
  Download,
} from 'lucide-react';
import { FactoryCertificate, CertificateAttachment } from '@/lib/types/modules';
import { CertificatePdfPreviewModal } from './CertificatePdfPreviewModal';

interface CertificateEntryPageProps {
  initialCert?: FactoryCertificate | null;
  onBack: () => void;
  onSave: (cert: FactoryCertificate) => void;
  showToast: (msg: string) => void;
}

export function CertificateEntryPage({
  initialCert,
  onBack,
  onSave,
  showToast,
}: CertificateEntryPageProps) {
  const isEditing = Boolean(initialCert);

  // Form State
  const [formData, setFormData] = useState<FactoryCertificate>(() => {
    if (initialCert) {
      return { ...initialCert };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const randNum = Math.floor(10 + Math.random() * 90);

    return {
      id: `crt-${Date.now()}`,
      certCode: `CERT-NEW-${randNum}`,
      name: 'Global Organic Textile Standard (GOTS 6.0)',
      issuingBody: 'Control Union Certifications B.V.',
      certificateNumber: `CU-884${randNum}-GOTS-2026`,
      category: 'ENVIRONMENTAL',
      standardType: 'GOTS 6.0 Scope Certificate',
      validFrom: todayStr,
      validUntil: oneYearLater,
      daysRemaining: 365,
      status: 'VALID',
      scope: 'Organic garment manufacturing: Cutting, sewing, washing, embroidery, packing and dispatch.',
      documentUrl: '#download-cert',
      facilityLocation: 'Apex Organic Weaving & Apparel Ltd, Savar',
      leadAuditor: 'Niels van den Berg (Lead Assessor)',
      auditAgency: 'Control Union Netherlands',
      renewalLeadDays: 60,
      verifiedBy: 'Compliance & Quality Systems Dept',
      remarks: 'Full compliance verified. Meets all chemical restrictions and ethical requirements.',
      qrCode: `QR-CERT-${randNum}`,
      attachments: [
        {
          id: 'att-init-1',
          name: 'Official_Accreditation_Certificate_Copy.pdf',
          size: '2.1 MB',
          fileType: 'application/pdf',
          uploadDate: todayStr,
          url: '#cert-copy',
        },
      ],
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewAttachment, setPreviewAttachment] = useState<CertificateAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownloadAttachment = (att: CertificateAttachment) => {
    try {
      if (att.url && att.url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = att.url;
        link.download = att.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Downloaded ${att.name}`);
        return;
      }
      const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n5 0 obj\n<< /Length 300 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(${formData.name}) Tj\n/F1 12 Tf\n0 -30 Td\n(Issuing Authority: ${formData.issuingBody}) Tj\n0 -20 Td\n(License Number: ${formData.certificateNumber}) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000242 00000 n \n0000000324 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n680\n%%EOF`;
      const blob = new Blob([pdfString], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      showToast(`Downloaded ${att.name}`);
    } catch {
      showToast(`Downloaded ${att.name}`);
    }
  };

  // Recalculate days remaining and status whenever validUntil changes
  useEffect(() => {
    if (formData.validUntil) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(formData.validUntil);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const days = Math.max(0, diffDays);

      let calcStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' = 'VALID';
      if (diffDays <= 0) {
        calcStatus = 'EXPIRED';
      } else if (diffDays <= (formData.renewalLeadDays || 60)) {
        calcStatus = 'EXPIRING_SOON';
      }

      setFormData((prev) => ({
        ...prev,
        daysRemaining: days,
        status: calcStatus,
      }));
    }
  }, [formData.validUntil, formData.renewalLeadDays]);

  // Preset standards
  const presetStandards = [
    { name: 'OEKO-TEX Standard 100', body: 'Hohenstein Textile Testing', cat: 'CHEMICAL_SAFETY' },
    { name: 'GOTS 6.0 Organic Textile', body: 'Control Union Netherlands', cat: 'ENVIRONMENTAL' },
    { name: 'ISO 9001:2015 Quality Management', body: 'BSI Group UK', cat: 'QUALITY_QMS' },
    { name: 'WRAP Gold Certificate', body: 'Worldwide Responsible Accredited Production', cat: 'SOCIAL_COMPLIANCE' },
    { name: 'ZDHC Roadmap to Zero Level 3', body: 'ZDHC Foundation & Eurofins', cat: 'CHEMICAL_SAFETY' },
    { name: 'HIGG FEM 4.0 Verification', body: 'Cascale / SAC / Intertek', cat: 'ENVIRONMENTAL' },
    { name: 'GRS (Global Recycled Standard)', body: 'Textile Exchange / Peterson', cat: 'ENVIRONMENTAL' },
    { name: 'BCI (Better Cotton Initiative)', body: 'Better Cotton / Control Union', cat: 'SUPPLY_CHAIN' },
  ];

  const applyPreset = (preset: typeof presetStandards[0]) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      issuingBody: preset.body,
      category: preset.cat as any,
      standardType: preset.name,
    }));
    showToast(`Applied preset: ${preset.name}`);
  };

  // Upload Attachment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: CertificateAttachment[] = Array.from(files).map((file, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      fileType: file.type || 'application/pdf',
      uploadDate: new Date().toISOString().slice(0, 10),
      url: URL.createObjectURL(file),
    }));

    setFormData((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newAttachments],
    }));
    showToast(`Attached ${newAttachments.length} certificate file(s)`);
  };

  const removeAttachment = (attId: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== attId),
    }));
    showToast('Removed certificate attachment');
  };

  // Generate Unique Cert Code
  const handleGenerateCode = () => {
    const prefix = (formData.category || 'QMS').slice(0, 4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({
      ...prev,
      certCode: `CERT-${prefix}-${rand}`,
    }));
    showToast('Generated fresh certificate code');
  };

  // Form Validation
  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.certCode.trim()) err.certCode = 'Certificate code is required';
    if (!formData.name.trim()) err.name = 'Standard / Certificate name is required';
    if (!formData.issuingBody.trim()) err.issuingBody = 'Issuing body or agency is required';
    if (!formData.certificateNumber.trim()) err.certificateNumber = 'Certificate number is required';
    if (!formData.validFrom) err.validFrom = 'Valid from date is required';
    if (!formData.validUntil) err.validUntil = 'Valid until date is required';
    if (!formData.scope.trim()) err.scope = 'Certified scope description is required';

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fill in required fields highlighted in red');
      return;
    }

    onSave({
      ...formData,
      updatedAt: new Date().toISOString(),
    });
    showToast(isEditing ? `Certificate ${formData.certCode} updated` : `New certificate ${formData.certCode} registered`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── TOP BAR (Clean, Crisp Header styled like Audit Module) ─────────────────────────── */}
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
                {isEditing ? `Edit Certificate: ${initialCert?.certCode}` : 'Register New Certificate'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                formData.status === 'VALID'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : formData.status === 'EXPIRING_SOON'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {formData.status.replace('_', ' ')} ({formData.daysRemaining}d left)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Accreditation vault • Factory compliance credentials & customer PO linkage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Update Certificate' : 'Save Certificate'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── SECTION 1: CERTIFICATION STANDARD DETAILS ──────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Accreditation Credentials & Standards
                </h3>
                <p className="text-xs text-slate-500">
                  Standard specifications, issuing authority, and official accreditation numbers
                </p>
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">Presets:</span>
              {presetStandards.slice(0, 4).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 transition-colors cursor-pointer border border-slate-200"
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cert Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Certificate Code <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Auto-Gen
                </button>
              </div>
              <input
                type="text"
                value={formData.certCode}
                onChange={(e) => setFormData({ ...formData, certCode: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.certCode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
                placeholder="e.g. CERT-GOTS-02"
              />
              {errors.certCode && <p className="text-[10px] text-rose-500 mt-0.5">{errors.certCode}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Audit / Standard Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category || 'QUALITY_QMS'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="QUALITY_QMS">Quality Management (ISO 9001, QMS)</option>
                <option value="SOCIAL_COMPLIANCE">Social & Ethical (WRAP, SMETA, BSCI)</option>
                <option value="ENVIRONMENTAL">Environmental & Organic (GOTS, HIGG, ISO 14001)</option>
                <option value="CHEMICAL_SAFETY">Chemical & Toxicology (OEKO-TEX, ZDHC)</option>
                <option value="TRANSACTION_TC">Transaction Certificate (TC / Chain of Custody)</option>
                <option value="SUPPLY_CHAIN">Supply Chain Origin (BCI, US Cotton, GRS)</option>
              </select>
            </div>

            {/* Official Certificate Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Official Certificate # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.certificateNumber}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.certificateNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
                placeholder="e.g. CU-884210-GOTS-2026"
              />
              {errors.certificateNumber && <p className="text-[10px] text-rose-500 mt-0.5">{errors.certificateNumber}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Certification Standard Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
                placeholder="e.g. Global Organic Textile Standard (GOTS 6.0)"
              />
              {errors.name && <p className="text-[10px] text-rose-500 mt-0.5">{errors.name}</p>}
            </div>

            {/* Issuing Body */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Issuing Certification Body <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.issuingBody}
                onChange={(e) => setFormData({ ...formData, issuingBody: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.issuingBody ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
                placeholder="e.g. Control Union Certifications B.V."
              />
              {errors.issuingBody && <p className="text-[10px] text-rose-500 mt-0.5">{errors.issuingBody}</p>}
            </div>
          </div>

          {/* Certified Scope */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Certified Scope Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                errors.scope ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              }`}
              placeholder="e.g. Organic garment manufacturing: Cutting, sewing, washing, embroidery, packing and dispatch..."
            />
            {errors.scope && <p className="text-[10px] text-rose-500 mt-0.5">{errors.scope}</p>}
          </div>
        </div>

        {/* ─── SECTION 3: VALIDITY PERIOD & RENEWAL SCHEDULE ─────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Validity Period & Automated Renewal Countdown
              </h3>
              <p className="text-xs text-slate-500">
                System computes validity remaining and triggers early renewal alerts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Valid From */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Valid From <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Valid Until */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Valid Until (Expiry) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Renewal Lead Notice Days */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Renewal Alert Lead Time
              </label>
              <select
                value={formData.renewalLeadDays || 60}
                onChange={(e) => setFormData({ ...formData, renewalLeadDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={30}>30 Days Notice</option>
                <option value={60}>60 Days Notice</option>
                <option value={90}>90 Days Notice</option>
                <option value={120}>120 Days Notice</option>
              </select>
            </div>

            {/* Computed Status Preview */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Computed Expiry Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                  formData.status === 'VALID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : formData.status === 'EXPIRING_SOON'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {formData.status.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {formData.daysRemaining} days left
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 4: AUDIT TEAM & FACILITY DETAILS ──────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Facility & Audit Sign-Off Details
              </h3>
              <p className="text-xs text-slate-500">
                Facility locations covered, lead auditor credentials, and internal QA verifications
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Facility Name & Location
              </label>
              <input
                type="text"
                value={formData.facilityLocation || ''}
                onChange={(e) => setFormData({ ...formData, facilityLocation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. Pacific Composite Unit-1, Gazipur"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Lead Auditor / Assessor Name
              </label>
              <input
                type="text"
                value={formData.leadAuditor || ''}
                onChange={(e) => setFormData({ ...formData, leadAuditor: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. Niels van den Berg"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Internal QA Verified By
              </label>
              <input
                type="text"
                value={formData.verifiedBy || ''}
                onChange={(e) => setFormData({ ...formData, verifiedBy: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. Head of QA Compliance"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Audit Remarks & Observations
            </label>
            <textarea
              rows={2}
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Annual audit completed with 100% compliance. All water & energy meters calibrated..."
            />
          </div>
        </div>

        {/* ─── SECTION 5: EVIDENCE DOCUMENT ATTACHMENTS ──────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Accreditation Certificate & Lab Test Documents
                </h3>
                <p className="text-xs text-slate-500">
                  Upload official signed PDF certificate copies, audit reports, and scope attachments
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer self-start sm:self-auto shadow-xs">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Attach Certificate PDF</span>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {formData.attachments && formData.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formData.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                    onClick={() => {
                      setPreviewAttachment(att);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 block truncate hover:text-blue-700 transition-colors" title={att.name}>
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
                      onClick={() => {
                        setPreviewAttachment(att);
                        setIsPreviewOpen(true);
                      }}
                      className="p-1.5 text-slate-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
                      title="Preview PDF Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(att)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                      title="Download PDF File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-50/60 border border-dashed border-slate-300 text-center">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700">No documents attached yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Attach the scanned original PDF issued by the testing laboratory or audit body.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Save & Cancel Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Certificate Changes' : 'Register Certificate'}</span>
          </button>
        </div>
      </form>

      {/* Uploaded Certificate Document Preview Modal */}
      {isPreviewOpen && (
        <CertificatePdfPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewAttachment(null);
          }}
          cert={formData}
          attachment={previewAttachment}
          showToast={showToast}
        />
      )}
    </div>
  );
}
