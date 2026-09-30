'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  BookMarked,
  Edit,
  Trash2,
  Download,
  ShieldCheck,
  Clock,
  Calendar,
  Layers,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  GraduationCap,
  FileCheck2,
  FileText,
  Plus,
  ListChecks,
  HardHat,
  Wrench,
  UserCheck,
  Award,
  Sparkles,
  Check,
  Eye,
} from 'lucide-react';
import {
  SopItem,
  SopStep,
  SopAcknowledgement,
  SopTrainingRecord,
  DocumentAttachment,
} from '@/lib/types/modules';
import { DeleteSopModal } from './DeleteSopModal';

interface SopDetailsPageProps {
  sop: SopItem;
  onBack: () => void;
  onEdit: (sop: SopItem) => void;
  onDelete?: (sop: SopItem) => void;
  onUpdateSop?: (sop: SopItem) => void;
  showToast: (msg: string) => void;
}

export function SopDetailsPage({
  sop,
  onBack,
  onEdit,
  onDelete,
  onUpdateSop,
  showToast,
}: SopDetailsPageProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Quick Modal: Add SOP Acknowledgement Sign-off
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [ackEmpId, setAckEmpId] = useState('');
  const [ackEmpName, setAckEmpName] = useState('');
  const [ackRole, setAckRole] = useState('');
  const [ackNote, setAckNote] = useState('');

  // Quick Modal: Log Training Session
  const [isTrainModalOpen, setIsTrainModalOpen] = useState(false);
  const [trainTopic, setTrainTopic] = useState(`${sop.sopNumber}: ${sop.title}`);
  const [trainerName, setTrainerName] = useState(sop.approval?.approvedBy || 'Senior Quality Lead');
  const [traineesCount, setTraineesCount] = useState<number>(10);
  const [avgScore, setAvgScore] = useState<number>(95);
  const [trainNotes, setTrainNotes] = useState('');

  const handleDownloadAttachment = (att?: DocumentAttachment | null) => {
    const fileName = att?.name || `${sop.sopNumber}_${sop.version.replace(/\s+/g, '_')}_Official_SOP.pdf`;
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

      const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n5 0 obj\n<< /Length 380 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(STANDARD OPERATING PROCEDURE: ${sop.sopNumber}) Tj\n/F1 12 Tf\n0 -28 Td\n(${sop.title}) Tj\n0 -20 Td\n(Department: ${sop.department} | Process: ${sop.process}) Tj\n0 -20 Td\n(Version: ${sop.version} | Status: ${sop.status}) Tj\n0 -20 Td\n(Effective Date: ${sop.effectiveDate} | Review Date: ${sop.reviewDate}) Tj\n0 -20 Td\n(Responsibility: ${sop.responsibility}) Tj\n0 -28 Td\n(Purpose: ${sop.purpose.slice(0, 80)}...) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000242 00000 n \n0000000324 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n720\n%%EOF`;
      const blob = new Blob([pdfString], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      showToast(`Downloaded official SOP document: ${fileName}`);
    } catch {
      showToast(`Downloaded ${fileName}`);
    }
  };

  const handleSaveAcknowledgement = () => {
    if (!ackEmpName.trim() || !ackRole.trim()) {
      showToast('Please provide employee name and operational role.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const newAck: SopAcknowledgement = {
      id: `ack-${Date.now()}`,
      employeeId: ackEmpId.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      employeeName: ackEmpName.trim(),
      role: ackRole.trim(),
      department: sop.department,
      acknowledgedDate: todayStr,
      status: 'ACKNOWLEDGED',
      signatureNote: ackNote.trim() || 'Direct workstation training sign-off',
    };

    const updatedAcknowledgements = [newAck, ...(sop.acknowledgements || [])];
    const updatedSop: SopItem = {
      ...sop,
      acknowledgements: updatedAcknowledgements,
      updatedAt: new Date().toISOString(),
    };

    onUpdateSop?.(updatedSop);
    showToast(`Recorded SOP acknowledgement for ${newAck.employeeName}`);
    setIsAckModalOpen(false);
    setAckEmpId('');
    setAckEmpName('');
    setAckRole('');
    setAckNote('');
  };

  const handleSaveTrainingRecord = () => {
    if (!trainTopic.trim() || !trainerName.trim()) {
      showToast('Please provide training topic and trainer name.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const newTrain: SopTrainingRecord = {
      id: `trn-${Date.now()}`,
      trainingTopic: trainTopic.trim(),
      trainerName: trainerName.trim(),
      trainingDate: todayStr,
      traineesCount: Number(traineesCount) || 1,
      averageScorePercent: Number(avgScore) || 90,
      passRatePercent: Number(avgScore) >= 80 ? 100 : 85,
      status: 'COMPLETED',
      notes: trainNotes.trim() || 'Floor operational assessment passed.',
    };

    const updatedTraining = [newTrain, ...(sop.trainingRecords || [])];
    const updatedSop: SopItem = {
      ...sop,
      trainingRecords: updatedTraining,
      updatedAt: new Date().toISOString(),
    };

    onUpdateSop?.(updatedSop);
    showToast(`Logged training session: ${newTrain.trainingTopic}`);
    setIsTrainModalOpen(false);
    setTrainNotes('');
  };

  const stepsList: SopStep[] =
    sop.procedure && sop.procedure.length > 0
      ? sop.procedure
      : sop.steps && sop.steps.length > 0
      ? sop.steps
      : [];

  const daysRemaining = sop.expiryReminderDays ?? sop.daysRemaining ?? 120;
  const isExpiringSoon = daysRemaining <= 60 && sop.status === 'ACTIVE';
  const isExpired = daysRemaining <= 0 || sop.status === 'EXPIRED';

  const acksList = sop.acknowledgements || [];
  const trainingList = sop.trainingRecords || [];
  const equipmentList = sop.requiredEquipment || [];
  const qcPointsList = sop.qualityControlPoints || [];

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
        {/* ─── TOP BAR (Header matching Document Control module) ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to SOP Master Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {sop.sopNumber}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  sop.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : sop.status === 'UNDER_REVIEW' || sop.status === 'DRAFT'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {sop.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                {sop.version}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                {sop.department}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {sop.process}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {sop.title} &bull; Responsibility: {sop.responsibility}
            </p>
          </div>
        </div>

        {/* Action Buttons - Styled identically to Document Control Module */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Edit SOP Button */}
          <button
            type="button"
            onClick={() => onEdit(sop)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit SOP</span>
          </button>

          {/* Delete SOP Button */}
          {onDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete SOP"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── SECTION 1: SOP OVERVIEW, LIFECYCLE & GOVERNANCE APPROVAL ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SOP Specifications & Process */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              SOP Identification &amp; Process Scope
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">SOP Identifier</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                {sop.sopNumber}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Operating Process</span>
              <span className="font-medium text-slate-900 mt-0.5 block">
                {sop.process}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Department</span>
              <span className="font-medium text-slate-900 mt-0.5 block">
                {sop.department}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Version</span>
              <span className="font-mono font-bold text-blue-700 mt-0.5 block">
                {sop.version}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[11px] text-slate-500 block">Designated Responsibility</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {sop.responsibility}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule, Expiry Reminder & Approvals */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Review Cycle &amp; Expiry Reminder
              </h3>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isExpired
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : isExpiringSoon
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING SOON' : 'VALID & ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Effective Date</span>
              <span className="font-mono text-slate-800 mt-0.5 block">
                {sop.effectiveDate}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Review Due Date</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                {sop.reviewDate}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Expiry Reminder</span>
              <span
                className={`font-mono font-bold mt-0.5 block ${
                  isExpired
                    ? 'text-rose-600'
                    : isExpiringSoon
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}
              >
                {daysRemaining} Days Remaining
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Approval Date</span>
              <span className="font-mono text-slate-800 mt-0.5 block">
                {sop.approval?.approvalDate || sop.effectiveDate}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Prepared By</span>
              <span className="font-medium text-slate-900 mt-0.5 block">
                {sop.approval?.preparedBy || sop.preparedBy || 'Quality Lead'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Approved By</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {sop.approval?.approvedBy || sop.approvedBy || 'Director of QA'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: PURPOSE & SCOPE ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Operational Purpose
            </h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans bg-blue-50/40 p-3.5 rounded-xl border border-blue-100">
            {sop.purpose}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Operational Scope
            </h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            {sop.scope || sop.applicability}
          </p>
        </div>
      </div>

      {/* ─── SECTION 3: SAFETY INSTRUCTIONS & REQUIRED EQUIPMENT ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safety Instructions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HardHat className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Safety Instructions &amp; Floor Hazards
            </h3>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                {sop.safetyInstructions}
              </p>
            </div>
          </div>
        </div>

        {/* Required Equipment */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Required Equipment &amp; Inspection Tools
            </h3>
          </div>
          {equipmentList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {equipmentList.map((eq, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{eq}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Standard floor tooling and machinery required.</p>
          )}
        </div>
      </div>

      {/* ─── SECTION 4: STEP-BY-STEP PROCEDURE & QUALITY CONTROL POINTS ───────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Standard Operating Procedure &amp; Quality Control Points
            </h3>
          </div>
          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
            {stepsList.length} Operating Steps
          </span>
        </div>

        {stepsList.length > 0 ? (
          <div className="space-y-3">
            {stepsList.map((step) => (
              <div
                key={step.id}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {step.stepNumber}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {step.stepTitle}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {step.responsibleRole && (
                      <span className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                        Role: {step.responsibleRole}
                      </span>
                    )}
                    {step.requiredTools && (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        Tool: {step.requiredTools}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed pl-8">
                  {step.actionDetails}
                </p>

                {(step.qualityControlPoints || step.checkpoint) && (
                  <div className="ml-8 mt-1 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900 block text-[11px]">Quality Control Point / Acceptance Criterion:</span>
                      <span className="text-emerald-800 text-xs">{step.qualityControlPoints || step.checkpoint}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <ListChecks className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No procedure steps defined yet.</p>
            <p className="text-[11px] text-slate-500">Click &quot;Edit SOP&quot; above to add steps and quality control points.</p>
          </div>
        )}
      </div>

      {/* ─── SECTION 5: SOP ACKNOWLEDGEMENT ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                SOP Operator Acknowledgement &amp; Sign-off Register
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Workstation operators and supervisors who have read and confirmed adherence to this standard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAckModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sign-off</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50 font-mono text-[11px] text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Employee ID</th>
                <th className="py-2.5 px-3">Employee Name</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Sign-off Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {acksList.length > 0 ? (
                acksList.map((ack) => (
                  <tr key={ack.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{ack.employeeId}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{ack.employeeName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{ack.role}</td>
                    <td className="py-2.5 px-3 text-slate-600">{ack.department}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{ack.acknowledgedDate}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {ack.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 italic text-[11px]">{ack.signatureNote || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500 text-xs">
                    No operator sign-offs recorded yet. Click &quot;Add Sign-off&quot; to register team acknowledgement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SECTION 6: SOP TRAINING RECORDS ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                SOP Training Sessions &amp; Competency Assessment
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Classroom and on-the-job training records, attendance, and practical comprehension pass rates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTrainModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Training Session</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50 font-mono text-[11px] text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Topic</th>
                <th className="py-2.5 px-3">Trainer</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Trainees</th>
                <th className="py-2.5 px-3">Avg Score</th>
                <th className="py-2.5 px-3">Pass Rate</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {trainingList.length > 0 ? (
                trainingList.map((trn) => (
                  <tr key={trn.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{trn.trainingTopic}</td>
                    <td className="py-2.5 px-3 text-slate-700">{trn.trainerName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{trn.trainingDate}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{trn.traineesCount} Workers</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{trn.averageScorePercent}%</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{trn.passRatePercent}%</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {trn.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500 text-xs">
                    No training records logged yet. Click &quot;Log Training Session&quot; to record operator training.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SECTION 7: ATTACHMENTS (DIRECT DOWNLOAD) ────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Official Procedure Documents &amp; Visual Work Instructions
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Controlled PDFs, checklist tally sheets, and laminated workstation cards.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {sop.attachments && sop.attachments.length > 0 ? (
            sop.attachments.map((att) => (
              <div
                key={att.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block truncate" title={att.name}>
                      {att.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {att.size} &bull; Uploaded: {att.uploadDate}
                    </span>
                  </div>
                </div>

                {att.revCaption && (
                  <div className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-semibold">
                    {att.revCaption}
                  </div>
                )}

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
                No attachments uploaded for this procedure yet.
              </p>
              <p className="text-[11px] text-slate-400">
                Click &quot;Edit SOP&quot; above to attach official PDF or DOC manuals.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODALS ─────────────────────────────────────────────────────────── */}
      <DeleteSopModal
        isOpen={isDeleteModalOpen}
        sops={[sop]}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDelete?.(sop);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Modal: Add Acknowledgement */}
      {isAckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Add Operator Acknowledgement Sign-off
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAckModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={ackEmpId}
                    onChange={(e) => setAckEmpId(e.target.value)}
                    placeholder="e.g. EMP-QC-142"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employee Name *</label>
                  <input
                    type="text"
                    value={ackEmpName}
                    onChange={(e) => setAckEmpName(e.target.value)}
                    placeholder="e.g. Salma Khatun"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Designated Role *</label>
                <input
                  type="text"
                  value={ackRole}
                  onChange={(e) => setAckRole(e.target.value)}
                  placeholder="e.g. Sewing Line QC / Senior Operator"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sign-off Remarks</label>
                <textarea
                  rows={2}
                  value={ackNote}
                  onChange={(e) => setAckNote(e.target.value)}
                  placeholder="e.g. Received training and verified step sequence on station."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAckModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAcknowledgement}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Save Sign-off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Log Training Session */}
      {isTrainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Log SOP Training Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTrainModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Training Topic *</label>
                <input
                  type="text"
                  value={trainTopic}
                  onChange={(e) => setTrainTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trainer / Facilitator *</label>
                <input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainees Count</label>
                  <input
                    type="number"
                    value={traineesCount}
                    onChange={(e) => setTraineesCount(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Average Score (%)</label>
                  <input
                    type="number"
                    value={avgScore}
                    onChange={(e) => setAvgScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Training Notes</label>
                <textarea
                  rows={2}
                  value={trainNotes}
                  onChange={(e) => setTrainNotes(e.target.value)}
                  placeholder="Document practical trial results and floor verification..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTrainModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTrainingRecord}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Save Training Record
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
