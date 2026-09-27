'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Sparkles,
  BookMarked,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ShieldCheck,
  UploadCloud,
  Trash2,
  Clock,
  Download,
  Users,
  Layers,
  HardHat,
  ListChecks,
  ChevronUp,
  ChevronDown,
  Wrench,
  FileCheck2,
} from 'lucide-react';
import { SopItem, SopStep, DocumentAttachment } from '@/lib/types/modules';

interface SopEntryPageProps {
  initialSop?: SopItem | null;
  onBack: () => void;
  onSave: (sop: SopItem) => void;
  showToast: (msg: string) => void;
}

export function SopEntryPage({
  initialSop,
  onBack,
  onSave,
  showToast,
}: SopEntryPageProps) {
  const isEditing = Boolean(initialSop);

  // Form State
  const [formData, setFormData] = useState<SopItem>(() => {
    if (initialSop) {
      return { ...initialSop };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const randNum = Math.floor(10 + Math.random() * 90);

    return {
      id: `sop-${Date.now()}`,
      sopNumber: `SOP-SEW-${randNum}`,
      title: 'In-Line 5-Garment Roaming Quality Audit & Traffic Light Scoring Protocol',
      department: 'Sewing Operations',
      process: 'In-Line Roaming Inspection & Statistical Scoring',
      version: 'v1.0',
      revision: 'v1.0',
      effectiveDate: todayStr,
      reviewDate: oneYearLater,
      status: 'ACTIVE',
      purpose: 'Standardize statistical in-line roving defect scoring, root-cause tagging, and immediate corrective action triggers across sewing assembly lines.',
      scope: '100% of active sewing workstations, roving quality controllers, and sewing line supervisors.',
      responsibility: 'Roving QC Examiners, Sewing Line Supervisors, Quality Assurance Lead',
      safetyInstructions: 'Roving inspectors must never place hands or measuring tapes near moving needle bars. In event of Red traffic light score, line supervisor must be summoned immediately within 5 minutes.',
      qualityControlPoints: [
        '0 defects = Green PASS; 1 minor defect = Amber CAUTION; 2+ defects or 1 critical = Red STOP.',
        'Preceding 15 garments must be 100% screened if Red light is triggered.',
        'Sample size strictly fixed at exactly 5 consecutively sewn garments per workstation.',
      ],
      requiredEquipment: [
        'Digital QC Tablet with Barcode Scanner',
        'Overhead 1,000 Lux Inspection Magnifier Lamp',
        'Approved Style Golden Sample Reference Swatch',
        'Traffic Light Inspection Flags (Green / Amber / Red)',
      ],
      stepsCount: 4,
      procedure: [
        {
          id: `step-init-1-${Date.now()}`,
          stepNumber: 1,
          stepTitle: 'Unannounced Station Visit & Style Swatch Check',
          actionDetails: 'Approach workstation unannounced. Check bundle ticket, garment style code, and verified golden sample construction details.',
          qualityControlPoints: 'Garment style matches active production run sheet 100%.',
          responsibleRole: 'Roving QC Examiner',
          requiredTools: 'Approved Golden Sample & Spec Sheet',
        },
        {
          id: `step-init-2-${Date.now()}`,
          stepNumber: 2,
          stepTitle: '5-Garment Consecutive Sampling',
          actionDetails: 'Collect 5 consecutively finished pieces directly from machine output trough before trimming or piling.',
          qualityControlPoints: 'Sample size must equal exactly 5 garments.',
          responsibleRole: 'Roving QC Examiner',
        },
        {
          id: `step-init-3-${Date.now()}`,
          stepNumber: 3,
          stepTitle: 'Traffic Light Scoring & Defect Classification',
          actionDetails: 'Inspect seams, tension, stitches per inch (SPI), and measurements. Assign Green (0 defects), Amber (1 minor), or Red (2+ defects / 1 critical).',
          qualityControlPoints: 'All defect codes accurately tagged in ERP.',
          responsibleRole: 'Roving QC Examiner',
        },
        {
          id: `step-init-4-${Date.now()}`,
          stepNumber: 4,
          stepTitle: 'Supervisor Intervention & Corrective Action',
          actionDetails: 'If Red light is flagged, supervisor stops machine, investigates root cause (needle, thread, machine feed), and re-screens preceding 15 pieces.',
          qualityControlPoints: 'Root cause logged and machine re-certified before restart.',
          responsibleRole: 'Sewing Line Supervisor',
        },
      ],
      approval: {
        preparedBy: 'Senior QMS Quality Engineer',
        preparedDate: todayStr,
        reviewedBy: 'Sewing Quality Manager',
        reviewedDate: todayStr,
        approvedBy: 'Head of Quality Assurance',
        approvalDate: todayStr,
      },
      approvedBy: 'Head of Quality Assurance',
      preparedBy: 'Senior QMS Quality Engineer',
      reviewedBy: 'Sewing Quality Manager',
      attachments: [
        {
          id: `att-init-${Date.now()}`,
          name: `SOP_SEW_${randNum}_Inline_Audit_Procedure.pdf`,
          size: '2.1 MB',
          fileType: 'application/pdf',
          uploadDate: todayStr,
          revCaption: 'v1.0 Approved Controlled Copy',
        },
      ],
      expiryReminderDays: 365,
      expiryStatus: 'VALID',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [equipmentInput, setEquipmentInput] = useState('');
  const [qcPointInput, setQcPointInput] = useState('');

  // Step Builder state
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepAction, setNewStepAction] = useState('');
  const [newStepQcPoint, setNewStepQcPoint] = useState('');
  const [newStepRole, setNewStepRole] = useState('');
  const [newStepTools, setNewStepTools] = useState('');

  // Auto calculate days remaining when reviewDate changes
  useEffect(() => {
    if (formData.reviewDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(formData.reviewDate);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData((prev) => ({
        ...prev,
        expiryReminderDays: Math.max(0, diffDays),
        expiryStatus: diffDays <= 0 ? 'EXPIRED' : diffDays <= 60 ? 'EXPIRING_SOON' : 'VALID',
      }));
    }
  }, [formData.reviewDate]);

  // Recalculate reviewDate based on review interval months
  const handleIntervalChange = (months: number) => {
    try {
      const base = new Date(formData.effectiveDate || new Date().toISOString().slice(0, 10));
      base.setMonth(base.getMonth() + months);
      const newReviewDate = base.toISOString().slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        reviewDate: newReviewDate,
      }));
    } catch {
      // ignore
    }
  };

  const generateAutoSopNumber = () => {
    const deptMap: Record<string, string> = {
      'Warehouse & Fabric QC': 'FAB',
      'Cutting Room': 'CUT',
      'Sewing Operations': 'SEW',
      'Finishing & Packing': 'FIN',
      'Quality Assurance': 'QA',
      'Quality Lab & Testing': 'LAB',
      'Maintenance & Engineering': 'MNT',
      'HR & Compliance': 'CMP',
    };
    const code = deptMap[formData.department] || 'GEN';
    const rand = Math.floor(10 + Math.random() * 90);
    const newSopId = `SOP-${code}-${rand}`;
    setFormData((prev) => ({
      ...prev,
      sopNumber: newSopId,
    }));
    showToast(`Generated SOP ID: ${newSopId}`);
  };

  // Required Equipment tags
  const handleAddEquipment = () => {
    if (!equipmentInput.trim()) return;
    const current = formData.requiredEquipment || [];
    if (!current.includes(equipmentInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        requiredEquipment: [...current, equipmentInput.trim()],
      }));
    }
    setEquipmentInput('');
  };

  const handleRemoveEquipment = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredEquipment: (prev.requiredEquipment || []).filter((e) => e !== item),
    }));
  };

  // Quality Control Points tags
  const handleAddQcPoint = () => {
    if (!qcPointInput.trim()) return;
    const current = formData.qualityControlPoints || [];
    setFormData((prev) => ({
      ...prev,
      qualityControlPoints: [...current, qcPointInput.trim()],
    }));
    setQcPointInput('');
  };

  const handleRemoveQcPoint = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      qualityControlPoints: (prev.qualityControlPoints || []).filter((_, idx) => idx !== index),
    }));
  };

  // Step Builder Handlers
  const handleAddStep = () => {
    if (!newStepTitle.trim() || !newStepAction.trim()) {
      showToast('Step Title and Action Details are required.');
      return;
    }

    const currentSteps = formData.procedure || formData.steps || [];
    const newStepItem: SopStep = {
      id: `step-${Date.now()}`,
      stepNumber: currentSteps.length + 1,
      stepTitle: newStepTitle.trim(),
      actionDetails: newStepAction.trim(),
      qualityControlPoints: newStepQcPoint.trim() || undefined,
      responsibleRole: newStepRole.trim() || undefined,
      requiredTools: newStepTools.trim() || undefined,
    };

    const updated = [...currentSteps, newStepItem];
    setFormData((prev) => ({
      ...prev,
      procedure: updated,
      steps: updated,
      stepsCount: updated.length,
    }));

    setNewStepTitle('');
    setNewStepAction('');
    setNewStepQcPoint('');
    setNewStepRole('');
    setNewStepTools('');
    showToast(`Added Step ${newStepItem.stepNumber}`);
  };

  const handleRemoveStep = (id: string) => {
    const current = formData.procedure || formData.steps || [];
    const filtered = current.filter((s) => s.id !== id);
    const renumbered = filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setFormData((prev) => ({
      ...prev,
      procedure: renumbered,
      steps: renumbered,
      stepsCount: renumbered.length,
    }));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.procedure || formData.steps || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const renumbered = list.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setFormData((prev) => ({
      ...prev,
      procedure: renumbered,
      steps: renumbered,
    }));
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const newAttachments: DocumentAttachment[] = [];

    Array.from(files).forEach((file, index) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const blobUrl = URL.createObjectURL(file);

      newAttachments.push({
        id: `att-${Date.now()}-${index}`,
        name: file.name,
        size: `${sizeMB} MB`,
        fileType: file.type || 'application/pdf',
        uploadDate: todayStr,
        url: blobUrl,
        revCaption: `${formData.version} Standard Document`,
      });
    });

    setFormData((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newAttachments],
    }));

    showToast(`Uploaded ${newAttachments.length} document file(s).`);
    e.target.value = '';
  };

  const handleRemoveAttachment = (attId: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== attId),
    }));
  };

  const handleDownloadAttachmentFile = (att: DocumentAttachment) => {
    const fileName = att.name;
    try {
      if (att.url && att.url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = att.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Downloaded ${fileName}`);
        return;
      }

      const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n5 0 obj\n<< /Length 300 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(SOP: ${formData.sopNumber} - ${formData.version}) Tj\n/F1 12 Tf\n0 -30 Td\n(${formData.title}) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000242 00000 n \n0000000324 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n680\n%%EOF`;
      const blob = new Blob([pdfString], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      showToast(`Downloaded ${fileName}`);
    } catch {
      showToast(`Downloaded ${fileName}`);
    }
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.sopNumber.trim()) newErrors.sopNumber = 'SOP ID is required.';
    if (!formData.title.trim()) newErrors.title = 'SOP Title is required.';
    if (!formData.department.trim()) newErrors.department = 'Department is required.';
    if (!formData.process.trim()) newErrors.process = 'Process is required.';
    if (!formData.purpose.trim()) newErrors.purpose = 'Purpose is required.';
    if (!formData.scope.trim()) newErrors.scope = 'Scope is required.';
    if (!formData.responsibility.trim()) newErrors.responsibility = 'Responsibility is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please complete all mandatory SOP fields.');
      return;
    }

    const payload: SopItem = {
      ...formData,
      stepsCount: (formData.procedure || formData.steps || []).length,
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    showToast(
      isEditing
        ? `Updated standard operating procedure ${payload.sopNumber}`
        : `Created new standard operating procedure ${payload.sopNumber}`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      {/* ─── TOP BAR (Header matching Document Control module) ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Cancel and Return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? `Edit SOP: ${formData.sopNumber}` : 'Create Standard Operating Procedure'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Configure operational procedure steps, quality control points, safety instructions, and equipment'
                : 'Register a new operational standard into the factory SOP library'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {!isEditing && (
            <button
              type="button"
              onClick={generateAutoSopNumber}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Auto-generate SOP ID"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Generate SOP ID</span>
            </button>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save SOP Record</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 1: SOP IDENTIFICATION, PROCESS & VERSION ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookMarked className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. SOP Identification &amp; Process
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                SOP ID *
              </label>
              <input
                type="text"
                value={formData.sopNumber}
                onChange={(e) => setFormData({ ...formData, sopNumber: e.target.value })}
                placeholder="e.g. SOP-FAB-001"
                className={`w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sopNumber ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                }`}
              />
              {errors.sopNumber && (
                <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                  {errors.sopNumber}
                </span>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                SOP Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. 4-Point Fabric Inspection &amp; Defect Grading Standard"
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
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Warehouse & Fabric QC">Warehouse &amp; Fabric QC</option>
                  <option value="Cutting Room">Cutting Room</option>
                  <option value="Sewing Operations">Sewing Operations</option>
                  <option value="Finishing & Packing">Finishing &amp; Packing</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Quality Lab & Testing">Quality Lab &amp; Testing</option>
                  <option value="Maintenance & Engineering">Maintenance &amp; Engineering</option>
                  <option value="HR & Compliance">HR &amp; Compliance</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Operating Process *
                </label>
                <input
                  type="text"
                  value={formData.process}
                  onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                  placeholder="e.g. Fabric 4-Point Inspection"
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.process ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Version *
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value, revision: e.target.value })}
                  placeholder="e.g. v3.1"
                  className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dates, Schedule & Expiry Reminder */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Effective Date &amp; Expiry Reminder
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Effective Date *
                </label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Review Due Date *
                </label>
                <input
                  type="date"
                  value={formData.reviewDate}
                  onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Quick Schedule Cycle
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleIntervalChange(6)}
                  className="py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  +6 Months
                </button>
                <button
                  type="button"
                  onClick={() => handleIntervalChange(12)}
                  className="py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  +12 Months (Annual)
                </button>
                <button
                  type="button"
                  onClick={() => handleIntervalChange(24)}
                  className="py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  +24 Months
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Expiry Reminder Status Preview
              </label>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-700">
                  {formData.expiryReminderDays ?? 120} Days Remaining Until Review
                </span>
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (formData.expiryReminderDays ?? 120) <= 0
                      ? 'bg-rose-100 text-rose-800'
                      : (formData.expiryReminderDays ?? 120) <= 60
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {(formData.expiryReminderDays ?? 120) <= 0
                    ? 'EXPIRED'
                    : (formData.expiryReminderDays ?? 120) <= 60
                    ? 'EXPIRING SOON'
                    : 'VALID'}
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Responsibility *
              </label>
              <input
                type="text"
                value={formData.responsibility}
                onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                placeholder="e.g. Fabric QC Inspector, Warehouse Quality Lead"
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.responsibility ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: PURPOSE & SCOPE ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <label className="font-bold text-slate-700 text-xs flex items-center justify-between">
            <span>Operational Purpose *</span>
            <span className="text-[10px] text-slate-400 font-normal">Why procedure exists</span>
          </label>
          <textarea
            rows={4}
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="State the primary operational purpose, compliance standard, and quality thresholds..."
            className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed ${
              errors.purpose ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
            }`}
          />
          {errors.purpose && (
            <span className="text-[10px] text-rose-600 font-semibold block">{errors.purpose}</span>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <label className="font-bold text-slate-700 text-xs flex items-center justify-between">
            <span>Operational Scope *</span>
            <span className="text-[10px] text-slate-400 font-normal">Applicable lines / styles</span>
          </label>
          <textarea
            rows={4}
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value, applicability: e.target.value })}
            placeholder="Define the boundary of applicability (e.g. 100% of received rolls before cutting)..."
            className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed ${
              errors.scope ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
            }`}
          />
          {errors.scope && (
            <span className="text-[10px] text-rose-600 font-semibold block">{errors.scope}</span>
          )}
        </div>
      </div>

      {/* ─── SECTION 3: SAFETY INSTRUCTIONS & REQUIRED EQUIPMENT ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safety Instructions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HardHat className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Safety Instructions &amp; Floor Hazards
            </h3>
          </div>
          <textarea
            rows={4}
            value={formData.safetyInstructions}
            onChange={(e) => setFormData({ ...formData, safetyInstructions: e.target.value })}
            placeholder="Specify mandatory safety protocols, hazard controls, emergency stops, and operator protection..."
            className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          />
        </div>

        {/* Required Equipment */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Required Equipment &amp; Inspection Tools
            </h3>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEquipment();
                }
              }}
              placeholder="Add tool/equipment (e.g. Digital Lux Meter)..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddEquipment}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              + Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
            {(formData.requiredEquipment || []).map((eq) => (
              <span
                key={eq}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200"
              >
                <span>{eq}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEquipment(eq)}
                  className="text-indigo-400 hover:text-indigo-800 ml-1 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SECTION 4: QUALITY CONTROL POINTS ───────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Quality Control Points &amp; Critical Acceptance Tolerances
          </h3>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={qcPointInput}
            onChange={(e) => setQcPointInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddQcPoint();
              }
            }}
            placeholder="Add quality checkpoint criteria (e.g. Penalty score <= 28 points / 100 sq yds)..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddQcPoint}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            + Add Criteria
          </button>
        </div>

        <div className="space-y-1.5 pt-1">
          {(formData.qualityControlPoints || []).map((qc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-950"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{qc}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveQcPoint(idx)}
                className="text-emerald-500 hover:text-emerald-800 p-0.5 font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 5: PROCEDURE BUILDER ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Procedure: Step-by-Step Sequence &amp; Execution
            </h3>
          </div>
          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
            {(formData.procedure || formData.steps || []).length} Operating Steps
          </span>
        </div>

        {/* Step Input Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="font-bold text-slate-800">
            Add Operating Step #{(formData.procedure || formData.steps || []).length + 1}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Step Title *</label>
              <input
                type="text"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="e.g. Surface Inspection &amp; Penalty Point Tagging"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Responsible Role</label>
              <input
                type="text"
                value={newStepRole}
                onChange={(e) => setNewStepRole(e.target.value)}
                placeholder="e.g. Fabric QC Inspector"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Detailed Action Instructions *</label>
            <textarea
              rows={2}
              value={newStepAction}
              onChange={(e) => setNewStepAction(e.target.value)}
              placeholder="State the exact physical and operational steps to perform..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Quality Control Point / Criteria</label>
              <input
                type="text"
                value={newStepQcPoint}
                onChange={(e) => setNewStepQcPoint(e.target.value)}
                placeholder="e.g. Max 4 points per linear yard"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Required Equipment / Tools</label>
              <input
                type="text"
                value={newStepTools}
                onChange={(e) => setNewStepTools(e.target.value)}
                placeholder="e.g. Adhesive Arrow Stickers"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAddStep}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Append Step to Procedure</span>
            </button>
          </div>
        </div>

        {/* Existing Steps */}
        <div className="space-y-3">
          {(formData.procedure || formData.steps || []).map((step, idx) => (
            <div
              key={step.id}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {step.stepTitle}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveStep(idx, 'up')}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                    title="Move Step Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (formData.procedure || formData.steps || []).length - 1}
                    onClick={() => handleMoveStep(idx, 'down')}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                    title="Move Step Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(step.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer ml-1"
                    title="Delete Step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-slate-700 pl-8 leading-relaxed">
                {step.actionDetails}
              </p>

              <div className="pl-8 flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                {(step.qualityControlPoints || step.checkpoint) && (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    QC Point: {step.qualityControlPoints || step.checkpoint}
                  </span>
                )}
                {step.responsibleRole && (
                  <span className="text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded">
                    Role: {step.responsibleRole}
                  </span>
                )}
                {step.requiredTools && (
                  <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Tool: {step.requiredTools}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 6: APPROVALS ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-4 h-4 text-purple-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            6. Operational Governance &amp; Approvals
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Prepared By (Author)</label>
            <input
              type="text"
              value={formData.approval?.preparedBy || formData.preparedBy || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preparedBy: e.target.value,
                  approval: { ...formData.approval, preparedBy: e.target.value } as any,
                })
              }
              placeholder="e.g. Chief Fabric Technologist"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Reviewed By</label>
            <input
              type="text"
              value={formData.approval?.reviewedBy || formData.reviewedBy || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reviewedBy: e.target.value,
                  approval: { ...formData.approval, reviewedBy: e.target.value } as any,
                })
              }
              placeholder="e.g. Warehouse Quality Lead"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Approved By (Signatory)</label>
            <input
              type="text"
              value={formData.approval?.approvedBy || formData.approvedBy || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  approvedBy: e.target.value,
                  approval: { ...formData.approval, approvedBy: e.target.value } as any,
                })
              }
              placeholder="e.g. Director of QA &amp; Testing"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ─── SECTION 7: ATTACHMENTS ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                7. Official Attachments &amp; Visual Work Instructions
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Upload PDF or DOC files for official distribution to floor workstations.
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
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900 block truncate" title={att.name}>
                    {att.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {att.size} &bull; {att.uploadDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadAttachmentFile(att)}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                  title="Test Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  title="Remove Attachment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {(!formData.attachments || formData.attachments.length === 0) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1">
              <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">No procedure files attached yet.</p>
              <p className="text-[11px] text-slate-400">Click &quot;Upload PDF / DOC Files&quot; above to add official documents.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM SUBMIT BAR ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isEditing ? 'Save SOP Changes' : 'Register New SOP'}</span>
        </button>
      </div>
    </form>
  );
}
