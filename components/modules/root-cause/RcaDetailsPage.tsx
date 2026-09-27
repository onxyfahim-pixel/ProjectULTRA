'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Edit,
  Trash2,
  Building2,
  Image as ImageIcon,
  Check,
  X,
  Layers,
  ZoomIn,
  Clock,
  Info,
  Camera,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
  Paperclip,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Printer,
  ShieldAlert,
  ArrowDown,
  GitPullRequest,
  Tag,
  Share2,
  BookmarkCheck,
  Eye,
  Hash,
} from 'lucide-react';
import { RootCauseCase, RcaStatus, RcaEvidenceImage } from '@/lib/types/modules';
import { DeleteRcaModal } from './DeleteRcaModal';

interface RcaDetailsPageProps {
  rcaCase: RootCauseCase;
  onBack: () => void;
  onEdit: (rcaCase: RootCauseCase) => void;
  onDelete: (rcaCase: RootCauseCase) => void;
  onUpdateCase?: (rcaCase: RootCauseCase) => void;
  showToast: (msg: string) => void;
}

const STATUS_CONFIG: Record<
  RcaStatus,
  { label: string; badgeCls: string; dotCls: string }
> = {
  DRAFT: {
    label: 'Draft Investigation',
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-300',
    dotCls: 'bg-slate-400',
  },
  INVESTIGATING: {
    label: 'Investigating (DMAIC)',
    badgeCls: 'bg-blue-100 text-blue-800 border-blue-300',
    dotCls: 'bg-blue-600',
  },
  ROOT_CAUSE_IDENTIFIED: {
    label: 'Root Cause Isolated',
    badgeCls: 'bg-amber-100 text-amber-800 border-amber-300',
    dotCls: 'bg-amber-600',
  },
  CAPA_ASSIGNED: {
    label: 'CAPA Mandated',
    badgeCls: 'bg-purple-100 text-purple-800 border-purple-300',
    dotCls: 'bg-purple-600',
  },
  VERIFIED_CLOSED: {
    label: 'Verified & Closed',
    badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotCls: 'bg-emerald-600',
  },
  COMPLETED: {
    label: 'Completed & Solved',
    badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotCls: 'bg-emerald-600',
  },
};

const SEVERITY_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  CRITICAL: {
    label: 'Critical Priority',
    cls: 'bg-rose-100 text-rose-800 border-rose-300',
    dot: 'bg-rose-600',
  },
  MAJOR: {
    label: 'Major Deviation',
    cls: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
  },
  MINOR: {
    label: 'Minor Observation',
    cls: 'bg-blue-100 text-blue-800 border-blue-300',
    dot: 'bg-blue-500',
  },
};

export function RcaDetailsPage({
  rcaCase,
  onBack,
  onEdit,
  onDelete,
  onUpdateCase,
  showToast,
}: RcaDetailsPageProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Quick photo upload modal
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  const statusInfo = STATUS_CONFIG[rcaCase.status] || STATUS_CONFIG.COMPLETED;
  const severityInfo = SEVERITY_CONFIG[rcaCase.severity || 'MAJOR'] || SEVERITY_CONFIG.MAJOR;

  // Determine which methods are applied
  const hasFiveWhy =
    (!rcaCase.appliedMethods && Boolean(rcaCase.fiveWhys?.why1)) ||
    (rcaCase.appliedMethods && rcaCase.appliedMethods.includes('FIVE_WHY'));

  const hasFishbone =
    (!rcaCase.appliedMethods && Boolean(rcaCase.fishboneFactors?.man?.length || rcaCase.fishboneFactors?.machine?.length)) ||
    (rcaCase.appliedMethods && rcaCase.appliedMethods.includes('FISHBONE'));

  const handleStatusChange = (newStatus: RcaStatus) => {
    if (!onUpdateCase) return;
    const isClosing = newStatus === 'VERIFIED_CLOSED' || newStatus === 'COMPLETED';
    const updated: RootCauseCase = {
      ...rcaCase,
      status: newStatus,
      actualClosureDate: isClosing ? new Date().toISOString().split('T')[0] : rcaCase.actualClosureDate,
    };
    onUpdateCase(updated);
    showToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
  };

  const handleAddPhotoSubmit = () => {
    if (!newPhotoUrl.trim() || !onUpdateCase) return;
    const newImage: RcaEvidenceImage = {
      id: `img-${Date.now()}`,
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'Defect & Root Cause Investigation Evidence',
      timestamp: new Date().toLocaleString(),
    };

    const updated: RootCauseCase = {
      ...rcaCase,
      evidenceImages: [...(rcaCase.evidenceImages || []), newImage],
    };

    onUpdateCase(updated);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setIsAddPhotoOpen(false);
    showToast('Evidence photo added successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fiveWhySteps = [
    { step: 1, label: 'Why 1: Immediate Symptom', text: rcaCase.fiveWhys?.why1, guidance: 'What is the immediate defect or failure detected?' },
    { step: 2, label: 'Why 2: Direct Mechanism', text: rcaCase.fiveWhys?.why2, guidance: 'Why did the physical condition occur at the point of action?' },
    { step: 3, label: 'Why 3: Process / Parameter Failure', text: rcaCase.fiveWhys?.why3, guidance: 'What technical parameter, setting, or tool was non-conforming?' },
    { step: 4, label: 'Why 4: Standard / Execution Factor', text: rcaCase.fiveWhys?.why4, guidance: 'Why was the parameter incorrectly chosen or uninspected?' },
    { step: 5, label: 'Why 5: Systemic Root Cause', text: rcaCase.fiveWhys?.why5, guidance: 'What management system, training, or SOP breakdown allowed this?' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Return to RCA Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {rcaCase.caseCode}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.badgeCls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotCls}`} />
                {statusInfo.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${severityInfo.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${severityInfo.dot}`} />
                {severityInfo.label}
              </span>
              {hasFiveWhy && (
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                  5-Why Applied
                </span>
              )}
              {hasFishbone && (
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                  6M Fishbone Applied
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {rcaCase.problemTitle}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Quick Select */}
          <select
            value={rcaCase.status}
            onChange={(e) => handleStatusChange(e.target.value as RcaStatus)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="DRAFT">Status: Draft</option>
            <option value="INVESTIGATING">Status: Investigating (DMAIC)</option>
            <option value="ROOT_CAUSE_IDENTIFIED">Status: Root Cause Isolated</option>
            <option value="CAPA_ASSIGNED">Status: CAPA Mandated</option>
            <option value="VERIFIED_CLOSED">Status: Verified &amp; Closed</option>
            <option value="COMPLETED">Status: Completed</option>
          </select>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            title="Print or Export PDF Investigation Dossier"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          <button
            onClick={() => onEdit(rcaCase)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Case</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
            title="Delete this RCA record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Scroll Navigation Strip (All in One Page) */}
      <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto text-xs font-semibold text-slate-600">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">
          Jump to:
        </span>
        <button
          type="button"
          onClick={() => scrollToSection('sec-overview')}
          className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
        >
          1. Overview &amp; Context
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('sec-problem')}
          className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
        >
          2. 5W2H Problem &amp; Containment
        </button>
        {hasFiveWhy && (
          <button
            type="button"
            onClick={() => scrollToSection('sec-5why')}
            className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-blue-700 transition-colors shrink-0 cursor-pointer flex items-center gap-1 text-blue-700 font-bold"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. 5-Why Chain</span>
          </button>
        )}
        {hasFishbone && (
          <button
            type="button"
            onClick={() => scrollToSection('sec-fishbone')}
            className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-indigo-700 transition-colors shrink-0 cursor-pointer flex items-center gap-1 text-indigo-700 font-bold"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>4. 6M Fishbone</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => scrollToSection('sec-capa')}
          className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
        >
          5. CAPA Countermeasures
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('sec-evidence')}
          className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
        >
          6. Evidence Photos ({rcaCase.evidenceImages?.length || 0})
        </button>
      </div>

      {/* SECTION 1: Meta Strip & Systemic Root Cause Banner */}
      <div id="sec-overview" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Department:</span>
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{rcaCase.department || 'Sewing Floor'}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Floor Location:</span>
            <div className="font-semibold text-slate-800 truncate" title={rcaCase.occurredLocation}>
              {rcaCase.occurredLocation}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Style / Garment:</span>
            <div className="font-mono font-semibold text-slate-900 truncate" title={rcaCase.styleAffected}>
              {rcaCase.styleAffected}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Buyer / Order:</span>
            <div className="font-semibold text-slate-800 truncate">
              {rcaCase.buyer || 'Global Buyer'} {rcaCase.orderNumber ? `(${rcaCase.orderNumber})` : ''}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Incident Date:</span>
            <div className="font-mono font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {rcaCase.createdDate}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Investigation Lead:</span>
            <div className="font-semibold text-slate-800 truncate" title={rcaCase.investigationLead}>
              {rcaCase.investigationLead || 'Quality Specialist'}
            </div>
          </div>
        </div>

        {/* Confirmed Systemic Root Cause Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                Confirmed Systemic Root Cause (DMAIC Isolation):
              </div>
              <p className="text-xs sm:text-sm font-semibold text-emerald-950 mt-0.5 leading-relaxed">
                {rcaCase.finalRootCause}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 5W2H Problem Definition & Immediate Containment */}
      <div id="sec-problem" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          5W2H Problem Definition &amp; Containment Action
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">What Happened:</span>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {rcaCase.problemDescription || rcaCase.problemTitle}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Immediate Containment Action (Floor Freeze):
            </span>
            <p className="text-xs text-rose-950 leading-relaxed font-semibold">
              {rcaCase.containmentAction || 'Station stopped; 100% quarantine applied on all work-in-progress.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Who, Where &amp; When:
            </span>
            <div className="text-xs space-y-1 text-slate-700">
              <div>• <strong>Location:</strong> {rcaCase.occurredLocation}</div>
              <div>• <strong>Department:</strong> {rcaCase.department || 'Sewing'}</div>
              <div>• <strong>Investigation Lead:</strong> {rcaCase.investigationLead || 'Quality Specialist'}</div>
              <div>• <strong>Incident Date:</strong> {rcaCase.createdDate}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cross-Functional Investigation Team:
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(rcaCase.teamMembers && rcaCase.teamMembers.length > 0
                ? rcaCase.teamMembers
                : ['Lead QA', 'Floor Supervisor', 'Chief Mechanic']
              ).map((member, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium"
                >
                  <User className="w-3 h-3 text-slate-400" />
                  {member}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: 5-Why Sequential Causality Chain (If Applied) */}
      {hasFiveWhy && (
        <div id="sec-5why" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Five-Why Sequential Causality Analysis (Taiichi Ohno Method)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sequential causality chain drilling down from primary symptom to root cause.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span>Rule: Verify downward (&quot;Why?&quot;) and upward (&quot;Therefore&quot;)</span>
            </div>
          </div>

          {/* Vertical Stepper */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 via-indigo-500 to-rose-500">
            {fiveWhySteps.map((step, idx) => {
              const isRoot = idx === 4;
              return (
                <div key={idx} className="relative group">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-110 ${
                      isRoot
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                        : 'bg-white border-2 border-blue-600 text-blue-700'
                    }`}
                  >
                    {step.step}
                  </div>

                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isRoot
                        ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isRoot ? 'text-rose-900' : 'text-slate-700'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isRoot ? 'FINAL SYSTEMIC ROOT' : `Level ${step.step} of 5`}
                      </span>
                    </div>
                    <p
                      className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                        isRoot ? 'font-semibold text-rose-950' : 'text-slate-800 font-medium'
                      }`}
                    >
                      {step.text || 'No response recorded for this step.'}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>💡 <span className="italic">{step.guidance}</span></span>
                      {idx < 4 && (
                        <span className="font-mono text-blue-600 font-semibold flex items-center gap-1">
                          ↓ Ask Why
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reverse Logic Check */}
          <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Reverse Logic &quot;Therefore&quot; Sanity Check:</span>
              <p className="mt-0.5 leading-relaxed text-blue-800">
                {rcaCase.fiveWhys?.why5} ➔ <em>Therefore</em> {rcaCase.fiveWhys?.why4} ➔ <em>Therefore</em> {rcaCase.fiveWhys?.why3} ➔ <em>Therefore</em> {rcaCase.fiveWhys?.why2} ➔ <em>Result:</em> {rcaCase.fiveWhys?.why1}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: 6M Ishikawa Fishbone Matrix (If Applied) */}
      {hasFishbone && (
        <div id="sec-fishbone" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-indigo-600" />
                Ishikawa Cause &amp; Effect Matrix (6M Manufacturing Categories)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Factor isolation across Man, Machine, Material, Method, Measurement, and Milieu.
              </p>
            </div>
            <div className="text-xs font-mono font-semibold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              Target: {rcaCase.problemTitle}
            </div>
          </div>

          {/* 6M Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                key: 'man',
                title: 'Man (Personnel & Skills)',
                desc: 'Operators, supervisors, line mechanics, training & handling',
                border: 'border-blue-200',
                badge: 'bg-blue-100 text-blue-800',
                factors: rcaCase.fishboneFactors?.man || [],
              },
              {
                key: 'machine',
                title: 'Machine (Equipment & Tooling)',
                desc: 'Needles, feed dogs, timing, clearances, RPM, air pressure',
                border: 'border-indigo-200',
                badge: 'bg-indigo-100 text-indigo-800',
                factors: rcaCase.fishboneFactors?.machine || [],
              },
              {
                key: 'material',
                title: 'Material (Raw Fabric & Trims)',
                desc: 'Fabric thickness, elastane, thread ticket, coating, dye lots',
                border: 'border-amber-200',
                badge: 'bg-amber-100 text-amber-800',
                factors: rcaCase.fishboneFactors?.material || [],
              },
              {
                key: 'method',
                title: 'Method (SOP & Work Instructions)',
                desc: 'Tech packs, style bulletins, changeover SOP, signoff protocols',
                border: 'border-purple-200',
                badge: 'bg-purple-100 text-purple-800',
                factors: rcaCase.fishboneFactors?.method || [],
              },
              {
                key: 'measurement',
                title: 'Measurement (Inspection & Gauges)',
                desc: 'Gauges, tension meters, spectrophotometers, pull testers, lux',
                border: 'border-emerald-200',
                badge: 'bg-emerald-100 text-emerald-800',
                factors: rcaCase.fishboneFactors?.measurement || [],
              },
              {
                key: 'milieu',
                title: 'Milieu (Environment & Plant Conditions)',
                desc: 'Humidity, ambient temperature, static electricity, noise, glare',
                border: 'border-slate-300',
                badge: 'bg-slate-200 text-slate-800',
                factors: rcaCase.fishboneFactors?.milieu || [],
              },
            ].map((category) => (
              <div
                key={category.key}
                className={`p-4 rounded-xl border bg-slate-50/50 hover:bg-white transition-all shadow-2xs ${category.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${category.badge}`}>
                    {category.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {category.factors.length} factor{category.factors.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">{category.desc}</p>

                <ul className="space-y-2">
                  {category.factors.length > 0 ? (
                    category.factors.map((factor, fIdx) => (
                      <li
                        key={fIdx}
                        className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 flex items-start gap-2 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span className="leading-snug">{factor}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-400 italic py-2">
                      No contributing factors isolated under this category.
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: CAPA & Corrective Actions Link */}
      <div id="sec-capa" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              Corrective &amp; Preventive Action (CAPA 8D Countermeasures)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct traceability from isolated root cause into engineering countermeasures.
            </p>
          </div>

          {rcaCase.linkedCapaId && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Linked Ticket:</span>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                {rcaCase.linkedCapaId}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Corrective Action (Immediate) */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600 text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Corrective Action (D5 - Floor Fix)
                </h3>
                <p className="text-[11px] text-blue-700">Immediate action to remove the symptom</p>
              </div>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-blue-100">
              {rcaCase.correctiveAction || 'Retrofit tooling, recalibrate equipment to specification, and purge non-conforming batch.'}
            </p>
          </div>

          {/* Preventive Action (Systemic Poka-Yoke) */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Preventive Action (D7 - Recurrence Prevention)
                </h3>
                <p className="text-[11px] text-emerald-700">Poka-yoke error proofing &amp; SOP revision</p>
              </div>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-emerald-100">
              {rcaCase.preventiveAction || 'Revise style changeover SOP, enforce mandatory digital verification gate, and deploy visual alerts.'}
            </p>
          </div>
        </div>

        {/* Follow-up Verification Log */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">D8 Effectiveness Verification Audit:</span>
            <span className="font-mono text-slate-500">
              Target Closure: {rcaCase.targetClosureDate || '2026-09-28'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {rcaCase.verificationNotes || 'Post-implementation audit of consecutive 3 batches verified zero re-occurrence of defect mode.'}
          </p>
        </div>
      </div>

      {/* SECTION 6: Photographic Evidence & Visual Documentation */}
      <div id="sec-evidence" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              Photographic Evidence &amp; Visual Documentation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              High-resolution photo documentation of defect mode, tooling condition, and corrected samples.
            </p>
          </div>
          <button
            onClick={() => setIsAddPhotoOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Evidence Photo</span>
          </button>
        </div>

        {rcaCase.evidenceImages && rcaCase.evidenceImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rcaCase.evidenceImages.map((img) => (
              <div
                key={img.id}
                className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col"
              >
                <div
                  className="relative aspect-video bg-slate-200 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedPhoto(img.url)}
                >
                  <img
                    src={img.url}
                    alt={img.caption || 'Evidence'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-6 h-6 drop-shadow-md" />
                  </div>
                </div>
                <div className="p-3 text-xs flex-1 flex flex-col justify-between">
                  <p className="font-medium text-slate-800 leading-snug">{img.caption || 'Investigation photo'}</p>
                  {img.timestamp && (
                    <div className="text-[10px] text-slate-400 font-mono mt-2">
                      Captured: {img.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-700">No Evidence Photos Attached</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Attach macro defect photographs, needle conditions, or machine setup sheets to document this RCA.
            </p>
            <button
              onClick={() => setIsAddPhotoOpen(true)}
              className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Upload Evidence Image
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto}
              alt="Enlarged evidence"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                Add RCA Evidence Photo
              </h3>
              <button
                onClick={() => setIsAddPhotoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL <span className="text-rose-500">*</span></label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Caption / Investigation Finding</label>
                <input
                  type="text"
                  placeholder="e.g. Needle throat plate clearance check"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setIsAddPhotoOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPhotoSubmit}
                disabled={!newPhotoUrl.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
              >
                Attach Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteRcaModal
        isOpen={isDeleteModalOpen}
        cases={[rcaCase]}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDelete(rcaCase);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
