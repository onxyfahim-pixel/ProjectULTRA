'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Sparkles,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldCheck,
  UploadCloud,
  Trash2,
  Clock,
  Eye,
  Download,
  Users,
  Layers,
  Lock,
} from 'lucide-react';
import { ControlledDocument, DocumentAttachment, DocumentRevision } from '@/lib/types/modules';

interface DocumentControlEntryPageProps {
  initialDoc?: ControlledDocument | null;
  onBack: () => void;
  onSave: (doc: ControlledDocument) => void;
  showToast: (msg: string) => void;
}

export function DocumentControlEntryPage({
  initialDoc,
  onBack,
  onSave,
  showToast,
}: DocumentControlEntryPageProps) {
  const isEditing = Boolean(initialDoc);

  // Form State
  const [formData, setFormData] = useState<ControlledDocument>(() => {
    if (initialDoc) {
      return { ...initialDoc };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const randNum = Math.floor(10 + Math.random() * 90);

    return {
      id: `doc-${Date.now()}`,
      docNumber: `DOC-SOP-QA-${randNum}`,
      title: 'In-Line Garment Construction & Critical Defect Inspection Procedure',
      department: 'Quality Assurance',
      category: 'SOP',
      version: 'Rev 1.0',
      approvedBy: 'Head of Quality Assurance & Technical Operations',
      effectiveDate: todayStr,
      nextReviewDate: oneYearLater,
      status: 'APPROVED_ACTIVE',
      scope: 'Applies to 100% of sewing assembly lines, traffic light inspection points, and inline roving QC examiners.',
      purpose: 'Standardizes statistical in-line defect scoring, root-cause tagging, and 5-garment roaming audit cycles per station.',
      preparedBy: 'Senior QMS Quality Engineer',
      reviewedBy: 'Technical Production Manager',
      isoClause: 'ISO 9001:2015 Clause 7.5.3 (Control of Documented Information)',
      distributionList: ['Central QA Archive', 'Sewing Floor QA Stations', 'Cutting Section Desk', 'Finishing & Packing Booth'],
      confidentialityLevel: 'INTERNAL_CONFIDENTIAL',
      documentLocation: 'Master QA Network Vault / Tier-2 SOPs',
      reviewFrequencyMonths: 12,
      daysRemaining: 365,
      changeLog: [
        {
          id: `rev-init-${Date.now()}`,
          version: 'Rev 1.0',
          releaseDate: todayStr,
          changedBy: 'Senior QMS Quality Engineer',
          approvedBy: 'Head of Quality Assurance & Technical Operations',
          changeDescription: 'Initial formal release and distribution under Master Document Register (MDR).',
          reasonForChange: 'New standard operating procedure deployment.',
        },
      ],
      attachments: [
        {
          id: `att-init-${Date.now()}`,
          name: `DOC_SOP_QA_${randNum}_Official_Approved_Copy.pdf`,
          size: '2.1 MB',
          fileType: 'application/pdf',
          uploadDate: todayStr,
          url: '#doc-copy',
        },
      ],
      remarks: 'Complies with buyer audit guidelines. Controlled hard copies are laminated.',
      qrCode: `QR-DOC-SOP-QA-${randNum}`,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [distributionTagInput, setDistributionTagInput] = useState('');


  // New Revision inline inputs
  const [newRevVersion, setNewRevVersion] = useState('');
  const [newRevDesc, setNewRevDesc] = useState('');

  // Auto calculate days remaining when nextReviewDate changes
  useEffect(() => {
    if (formData.nextReviewDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(formData.nextReviewDate);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData((prev) => ({
        ...prev,
        daysRemaining: Math.max(0, diffDays),
      }));
    }
  }, [formData.nextReviewDate]);

  // Recalculate nextReviewDate when effectiveDate or reviewFrequencyMonths changes
  const updateReviewDate = (effDate: string, freqMonths: number) => {
    try {
      const date = new Date(effDate);
      date.setMonth(date.getMonth() + freqMonths);
      return date.toISOString().slice(0, 10);
    } catch {
      return formData.nextReviewDate;
    }
  };

  const handleEffectiveDateChange = (val: string) => {
    const nextDate = updateReviewDate(val, formData.reviewFrequencyMonths || 12);
    setFormData((prev) => ({
      ...prev,
      effectiveDate: val,
      nextReviewDate: nextDate,
    }));
  };

  const handleFrequencyChange = (months: number) => {
    const nextDate = updateReviewDate(formData.effectiveDate, months);
    setFormData((prev) => ({
      ...prev,
      reviewFrequencyMonths: months,
      nextReviewDate: nextDate,
    }));
  };

  const generateAutoDocNumber = () => {
    const prefixMap: Record<string, string> = {
      POLICY: 'QM',
      SOP: 'SOP',
      WORK_INSTRUCTION: 'WI',
      FORM_TEMPLATE: 'FORM',
      SPECIFICATION: 'SPEC',
    };
    const deptMap: Record<string, string> = {
      'Quality Assurance': 'QA',
      'Cutting Room': 'CUT',
      'Production & Sewing': 'SEW',
      'Finishing & Packing': 'FIN',
      'Quality Lab & Testing': 'LAB',
      'Material Sourcing & R&D': 'MAT',
    };
    const pfx = prefixMap[formData.category] || 'DOC';
    const dept = deptMap[formData.department] || 'GEN';
    const rand = Math.floor(10 + Math.random() * 90);
    const newCode = `DOC-${pfx}-${dept}-${rand}`;
    setFormData((prev) => ({
      ...prev,
      docNumber: newCode,
      qrCode: `QR-${newCode}`,
    }));
    showToast(`Generated new identifier: ${newCode}`);
  };

  const handleAddDistributionTag = () => {
    if (!distributionTagInput.trim()) return;
    const currentList = formData.distributionList || [];
    if (!currentList.includes(distributionTagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        distributionList: [...currentList, distributionTagInput.trim()],
      }));
    }
    setDistributionTagInput('');
  };

  const handleRemoveDistributionTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      distributionList: (prev.distributionList || []).filter((t) => t !== tagToRemove),
    }));
  };

  const handleAddRevisionEntry = () => {
    if (!newRevVersion.trim() || !newRevDesc.trim()) {
      showToast('Please enter both revision number and description.');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const newRev: DocumentRevision = {
      id: `rev-${Date.now()}`,
      version: newRevVersion.trim(),
      releaseDate: todayStr,
      changedBy: formData.preparedBy || 'QA Systems Lead',
      approvedBy: formData.approvedBy || 'Head of QA',
      changeDescription: newRevDesc.trim(),
      reasonForChange: 'Manual change log entry',
    };
    setFormData((prev) => ({
      ...prev,
      version: newRevVersion.trim(),
      changeLog: [newRev, ...(prev.changeLog || [])],
    }));
    setNewRevVersion('');
    setNewRevDesc('');
    showToast(`Added revision record ${newRev.version}`);
  };

  const handleRemoveRevisionEntry = (revId: string) => {
    setFormData((prev) => ({
      ...prev,
      changeLog: (prev.changeLog || []).filter((r) => r.id !== revId),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newAttachments: DocumentAttachment[] = fileList.map((file, idx) => {
      const blobUrl = URL.createObjectURL(file);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        id: `att-${Date.now()}-${idx}`,
        name: file.name,
        size: `${sizeInMB} MB`,
        fileType: file.type || 'application/pdf',
        uploadDate: new Date().toISOString().slice(0, 10),
        url: blobUrl,
        revCaption: `${formData.version} Document Copy`,
      };
    });

    setFormData((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newAttachments],
    }));
    showToast(`Uploaded ${fileList.length} document file${fileList.length > 1 ? 's' : ''}`);
    e.target.value = '';
  };

  const handleUpdateRevCaption = (attId: string, caption: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).map((a) =>
        a.id === attId ? { ...a, revCaption: caption } : a
      ),
    }));
  };

  const handleDownloadAttachment = (att: DocumentAttachment) => {
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
      showToast(`Downloaded ${att.name}`);
    } catch {
      showToast(`Downloaded ${att.name}`);
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== attId),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.docNumber.trim()) newErrors.docNumber = 'Document Number is mandatory';
    if (!formData.title.trim()) newErrors.title = 'Document Title is mandatory';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.version.trim()) newErrors.version = 'Revision / Version is required';
    if (!formData.approvedBy.trim()) newErrors.approvedBy = 'Approver Name is required';
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective Date is required';
    if (!formData.nextReviewDate) newErrors.nextReviewDate = 'Next Review Date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      showToast('Please fix required validation errors before saving.');
      return;
    }

    const cleanedDoc: ControlledDocument = {
      ...formData,
      docNumber: formData.docNumber.trim().toUpperCase(),
      title: formData.title.trim(),
      updatedAt: new Date().toISOString(),
    };

    onSave(cleanedDoc);
    showToast(isEditing ? `Updated controlled document ${cleanedDoc.docNumber}` : `Registered new document ${cleanedDoc.docNumber}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── TOP BAR ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Registry"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-mono">
              {isEditing ? `Edit Controlled Document: ${formData.docNumber}` : 'Register New Controlled Document (MDR)'}
            </h2>
            <p className="text-xs text-slate-500">
              ISO 9001:2015 Clause 7.5.3 Master Document Register &amp; Version Governance
            </p>
          </div>
        </div>

        {/* Buttons matching Certificate module */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isEditing && (
            <button
              type="button"
              onClick={generateAutoDocNumber}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
              title="Generate next available sequential identifier"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Auto-Generate Doc ID</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Document Changes' : 'Publish Controlled Document'}</span>
          </button>
        </div>
      </div>

      {/* ─── FORM SECTIONS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Identification & Classification */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Master Identification &amp; Classification
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Document Number (Identifier) *
              </label>
              <input
                type="text"
                value={formData.docNumber}
                onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                placeholder="e.g. DOC-SOP-SEW-04"
                className={`w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.docNumber ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                }`}
              />
              {errors.docNumber && (
                <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                  {errors.docNumber}
                </span>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Controlled Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Needle Replacement & Broken Needle Search Policy"
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                }`}
              />
              {errors.title && (
                <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                  {errors.title}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Document Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="POLICY">POLICY (Tier 1)</option>
                  <option value="SOP">SOP (Standard Procedure)</option>
                  <option value="WORK_INSTRUCTION">WORK INSTRUCTION (WI)</option>
                  <option value="FORM_TEMPLATE">FORM TEMPLATE</option>
                  <option value="SPECIFICATION">SPECIFICATION (Technical)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Primary Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Cutting Room">Cutting Room</option>
                  <option value="Production & Sewing">Production &amp; Sewing</option>
                  <option value="Finishing & Packing">Finishing &amp; Packing</option>
                  <option value="Quality Lab & Testing">Quality Lab &amp; Testing</option>
                  <option value="Material Sourcing & R&D">Material Sourcing &amp; R&amp;D</option>
                  <option value="Maintenance & Engineering">Maintenance &amp; Engineering</option>
                  <option value="HR & Compliance">HR &amp; Compliance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Confidentiality Level
                </label>
                <select
                  value={formData.confidentialityLevel || 'INTERNAL_CONFIDENTIAL'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confidentialityLevel: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="INTERNAL_CONFIDENTIAL">Internal Confidential</option>
                  <option value="RESTRICTED">Restricted (QA &amp; Management)</option>
                  <option value="GENERAL_FACILITY">General Facility Floor</option>
                  <option value="PUBLIC">Public / External Audit</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ISO 9001 Clause
                </label>
                <input
                  type="text"
                  value={formData.isoClause || ''}
                  onChange={(e) => setFormData({ ...formData, isoClause: e.target.value })}
                  placeholder="e.g. ISO 9001:2015 Clause 7.5.3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Revision & Review Cycle */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Revision, Status &amp; Review Schedule
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Current Revision / Version *
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g. Rev 3.0"
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.version ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Lifecycle Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="APPROVED_ACTIVE">APPROVED ACTIVE (In Effect)</option>
                  <option value="UNDER_REVISION">UNDER REVISION (Review Draft)</option>
                  <option value="OBSOLETE">OBSOLETE (Archived)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Effective Date *
                </label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => handleEffectiveDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Review Cycle
                </label>
                <select
                  value={formData.reviewFrequencyMonths || 12}
                  onChange={(e) => handleFrequencyChange(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={6}>Every 6 Months</option>
                  <option value={12}>Every 12 Months (Annual)</option>
                  <option value={24}>Every 24 Months</option>
                  <option value={36}>Every 36 Months</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Next Review Due *
                </label>
                <input
                  type="date"
                  value={formData.nextReviewDate}
                  onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Authorized Master Physical/Digital Location
              </label>
              <input
                type="text"
                value={formData.documentLocation || ''}
                onChange={(e) => setFormData({ ...formData, documentLocation: e.target.value })}
                placeholder="e.g. Master QA Network Vault / Controlled Docs / Tier-2 SOPs"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 3 & 4: GOVERNANCE & PURPOSE/SCOPE ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Governance & Signatures */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Governance &amp; Authorized Sign-Offs
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Prepared By (Author / Specialist)
              </label>
              <input
                type="text"
                value={formData.preparedBy || ''}
                onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                placeholder="e.g. Senior QMS Lead Specialist"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Reviewed By (Technical Committee / HOD)
              </label>
              <input
                type="text"
                value={formData.reviewedBy || ''}
                onChange={(e) => setFormData({ ...formData, reviewedBy: e.target.value })}
                placeholder="e.g. Technical Operations Committee"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Approved By (Final Signatory) *
              </label>
              <input
                type="text"
                value={formData.approvedBy}
                onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                placeholder="e.g. Head of Quality Assurance & Managing Director"
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.approvedBy ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                }`}
              />
              {errors.approvedBy && (
                <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                  {errors.approvedBy}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Purpose, Scope & Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              4. Objective, Scope &amp; Controlled Distribution
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Document Purpose &amp; Quality Objective
              </label>
              <textarea
                rows={2}
                value={formData.purpose || ''}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Briefly state the goal and mandatory compliance objectives..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Operational Scope &amp; Boundaries
              </label>
              <textarea
                rows={2}
                value={formData.scope || ''}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="Specify target manufacturing units, lines, or operations..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Controlled Copy Distribution Holders
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={distributionTagInput}
                  onChange={(e) => setDistributionTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDistributionTag();
                    }
                  }}
                  placeholder="e.g. Cutting Master Desk"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddDistributionTag}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {(formData.distributionList || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDistributionTag(tag)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 5: REVISION LOG ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              5. Revision History &amp; Modification Log
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">ISO 9001 Clause 7.5.3</span>
        </div>

        <div className="space-y-3">
          {/* Quick add revision line */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newRevVersion}
                onChange={(e) => setNewRevVersion(e.target.value)}
                placeholder="Rev # (e.g. Rev 2.0)"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white"
              />
            </div>
            <div className="sm:col-span-7">
              <input
                type="text"
                value={newRevDesc}
                onChange={(e) => setNewRevDesc(e.target.value)}
                placeholder="Description of changes made..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddRevisionEntry}
                className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                + Add Entry
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 font-mono text-[11px] text-slate-600">
                <tr>
                  <th className="py-2 px-3">Revision</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Changed By</th>
                  <th className="py-2 px-3">Approved By</th>
                  <th className="py-2 px-3">Change Summary</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {(formData.changeLog || []).map((rev) => (
                  <tr key={rev.id}>
                    <td className="py-2 px-3 font-bold text-blue-700">{rev.version}</td>
                    <td className="py-2 px-3 text-slate-600">{rev.releaseDate}</td>
                    <td className="py-2 px-3 text-slate-800">{rev.changedBy}</td>
                    <td className="py-2 px-3 text-slate-800">{rev.approvedBy}</td>
                    <td className="py-2 px-3 text-slate-700 font-sans text-xs">{rev.changeDescription}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveRevisionEntry(rev.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Remove Revision"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── SECTION 6: FILE ATTACHMENTS (MULTIPLE PDF / DOC WITH REV CAPTION) ─── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                6. Document Upload &amp; Revision Captions
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Upload multiple PDF or DOC/DOCX files. Each file can have its own Rev Caption.
            </p>
          </div>
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload PDF / DOC Files</span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-3">
          {(formData.attachments || []).map((att) => (
            <div
              key={att.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 sm:w-1/3">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900 block truncate" title={att.name}>
                    {att.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {att.size} &bull; {att.uploadDate}
                  </span>
                </div>
              </div>

              {/* Rev Caption Input */}
              <div className="flex-1 sm:px-3">
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5 sm:hidden">Rev Caption:</label>
                <input
                  type="text"
                  value={att.revCaption || ''}
                  onChange={(e) => handleUpdateRevCaption(att.id, e.target.value)}
                  placeholder="Rev Caption (e.g. Rev 1.0 Signed Copy)"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(att)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove Attachment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {(!formData.attachments || formData.attachments.length === 0) && (
            <div className="text-center py-6 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl space-y-1.5">
              <UploadCloud className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                No document files uploaded yet.
              </p>
              <p className="text-[11px] text-slate-400">
                Click &quot;Upload PDF / DOC Files&quot; above to select multiple files and assign custom Rev Captions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
