'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  GitPullRequest,
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
  ChevronRight,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import { CapaItem, CapaStatus, CapaEvidenceImage } from '@/lib/types/modules';
import { DeleteCapaModal } from './DeleteCapaModal';

interface CapaDetailsPageProps {
  capa: CapaItem;
  onBack: () => void;
  onEdit: (capa: CapaItem) => void;
  onDelete?: (capa: CapaItem) => void;
  onUpdateCapa?: (capa: CapaItem) => void;
  showToast: (msg: string) => void;
}

export function CapaDetailsPage({
  capa,
  onBack,
  onEdit,
  onDelete,
  onUpdateCapa,
  showToast,
}: CapaDetailsPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'rca' | 'evidence' | 'signoff'>('overview');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Quick photo upload modal/state
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoType, setNewPhotoType] = useState<'ROOT_CAUSE' | 'BEFORE' | 'AFTER' | 'COMPLETION'>('COMPLETION');

  // Combined Evidence Photos (including per-issue photographic evidence)
  const issuePhotos: CapaEvidenceImage[] = (capa.issues || [])
    .filter((iss) => Boolean(iss.evidenceImage))
    .map((iss, idx) => ({
      id: `iss-photo-${iss.id || idx}`,
      url: iss.evidenceImage!,
      caption: `[Issue #${idx + 1}] ${iss.issueTitle}: ${iss.evidenceCaption || 'Evidence photo'}`,
      timestamp: iss.targetDate || capa.dateRaised || 'Recorded',
      type: 'ROOT_CAUSE' as const,
    }));

  const allPhotos: CapaEvidenceImage[] = [
    ...issuePhotos,
    ...(capa.rcaEvidenceImages || []),
    ...(capa.completionEvidenceImages || []),
  ];

  // Quick Status Transition
  const handleQuickStatusChange = (newStatus: CapaStatus) => {
    if (!onUpdateCapa) return;
    const isClosed = newStatus === 'CLOSED';
    const updated: CapaItem = {
      ...capa,
      status: newStatus,
      effectivenessVerified: isClosed ? true : capa.effectivenessVerified,
      actualCompletionDate: isClosed ? new Date().toISOString().split('T')[0] : capa.actualCompletionDate,
      verificationDate: isClosed ? new Date().toISOString().split('T')[0] : capa.verificationDate,
      effectivenessRating: isClosed ? 'EFFECTIVE' : capa.effectivenessRating,
    };
    onUpdateCapa(updated);
    showToast(`CAPA status updated to ${newStatus.replace(/_/g, ' ')}`);
  };

  // Add Photo Handler
  const handleAddPhotoSubmit = () => {
    if (!newPhotoUrl.trim() || !onUpdateCapa) return;
    const newImage: CapaEvidenceImage = {
      id: `img-${Date.now()}`,
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'CAPA photographic evidence',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: newPhotoType,
    };

    const updated: CapaItem = {
      ...capa,
      completionEvidenceImages: [...(capa.completionEvidenceImages || []), newImage],
    };
    onUpdateCapa(updated);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setIsAddPhotoOpen(false);
    showToast('Evidence photo added successfully');
  };

  // 8D Stepper Logic
  const steps = [
    { code: 'D1', label: 'Team', completed: true },
    { code: 'D2', label: 'Problem', completed: Boolean(capa.issueTitle) },
    { code: 'D3', label: 'Containment', completed: Boolean(capa.containmentAction) },
    { code: 'D4', label: 'Root Cause', completed: Boolean(capa.rootCause || capa.fiveWhys?.why1) },
    { code: 'D5', label: 'Corrective', completed: Boolean(capa.correctiveAction) },
    { code: 'D6', label: 'Implemented', completed: capa.status !== 'OPEN' },
    { code: 'D7', label: 'Preventive', completed: Boolean(capa.preventiveAction) },
    { code: 'D8', label: 'Verified', completed: capa.status === 'CLOSED' || capa.effectivenessVerified },
  ];

  const severityBadge = (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
        capa.severity === 'CRITICAL'
          ? 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-400'
          : capa.severity === 'MAJOR'
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-blue-50 text-blue-800 border-blue-200'
      }`}
    >
      {capa.severity || 'MAJOR'} SEVERITY
    </span>
  );

  const statusBadge = (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
        capa.status === 'CLOSED'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : capa.status === 'VERIFICATION_PENDING'
          ? 'bg-blue-50 text-blue-800 border-blue-200'
          : capa.status === 'IN_PROGRESS'
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-rose-50 text-rose-800 border-rose-200'
      }`}
    >
      {capa.status.replace(/_/g, ' ')}
    </span>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* ─── TOP HEADER BAR (Non-Sticky, Solid White) ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to CAPA Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {capa.capaNumber}
              </h2>
              {statusBadge}
              {severityBadge}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {capa.source.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Department: {capa.department || 'General QA'} • Lead: {capa.responsiblePerson} • Target: {capa.targetCompletionDate}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick status transition dropdown */}
          <select
            value={capa.status}
            onChange={(e) => handleQuickStatusChange(e.target.value as CapaStatus)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Quick update CAPA lifecycle stage"
          >
            <option value="OPEN">Status: OPEN</option>
            <option value="IN_PROGRESS">Status: IN PROGRESS</option>
            <option value="VERIFICATION_PENDING">Status: VERIFICATION PENDING</option>
            <option value="CLOSED">Status: CLOSED & VERIFIED</option>
          </select>

          {onDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              title="Delete this CAPA record"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(capa)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Edit CAPA Resolution Plan"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Plan</span>
          </button>
        </div>
      </div>

      {/* ─── 8D DISCIPLINE STEPPER PROGRESS BAR ───────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <GitPullRequest className="w-4 h-4 text-blue-600" />
            <span>8D Problem Solving Methodology Progress</span>
          </span>
          <span className="font-mono text-slate-500 font-semibold">
            {steps.filter((s) => s.completed).length} of 8 Disciplines Complete
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-xs">
          {steps.map((step, idx) => (
            <div
              key={step.code}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                step.completed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 font-mono font-bold text-xs">
                <span>{step.code}</span>
                {step.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </div>
              <div className="text-[11px] font-semibold mt-0.5 truncate">{step.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── NAVIGATION TABS ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: '8D Action Plan & Overview', icon: FileText, count: 'D1-D7' },
          { id: 'rca', label: '5-Whys & Fishbone Diagram', icon: Sparkles, count: 'D4 RCA' },
          { id: 'evidence', label: 'Completion Evidence & Photos', icon: ImageIcon, count: `${allPhotos.length} Photos` },
          { id: 'signoff', label: 'Verification & Closure Sign-off', icon: ShieldCheck, count: 'D8 Audit' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: 8D ACTION PLAN & OVERVIEW ─────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Multi-Issue Resolution Matrix (if multiple issues registered) */}
          {capa.issues && capa.issues.length > 0 ? (
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-4 ring-1 ring-blue-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-blue-50 text-blue-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Registered Issues & Resolution Matrix ({capa.issues.length} {capa.issues.length === 1 ? 'Issue' : 'Issues'})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Individual non-conformances with respective corrective actions, preventive actions, and photographic evidence.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Resolved: {capa.issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length} / {capa.issues.length}
                  </span>
                </div>
              </div>

              {/* Issue Cards */}
              <div className="space-y-3.5">
                {capa.issues.map((iss, idx) => (
                  <div
                    key={iss.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {iss.issueTitle}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            iss.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : iss.severity === 'MAJOR'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {iss.severity || 'MAJOR'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                          {iss.category || 'SEWING'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            iss.status === 'CLOSED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : iss.status === 'RESOLVED'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : iss.status === 'IN_PROGRESS'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {iss.status || 'OPEN'}
                        </span>
                      </div>
                    </div>

                    {iss.description && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {iss.description}
                      </p>
                    )}

                    {/* Actions and Evidence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                      {/* Corrective Action */}
                      <div className={`p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-1 ${iss.evidenceImage ? 'md:col-span-5' : 'md:col-span-6'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Corrective Action</span>
                        </span>
                        <p className="text-slate-800 text-[11px] leading-relaxed">
                          {iss.correctiveAction || 'Immediate containment deployed.'}
                        </p>
                      </div>

                      {/* Preventive Action */}
                      <div className={`p-3 rounded-lg border border-blue-200 bg-blue-50/40 space-y-1 ${iss.evidenceImage ? 'md:col-span-5' : 'md:col-span-6'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Preventive Action</span>
                        </span>
                        <p className="text-slate-800 text-[11px] leading-relaxed">
                          {iss.preventiveAction || 'Preventive procedure deployed.'}
                        </p>
                      </div>

                      {/* Evidence Thumbnail */}
                      {iss.evidenceImage && (
                        <div className="md:col-span-2 p-2 rounded-lg border border-slate-200 bg-white flex flex-col items-center justify-center text-center space-y-1">
                          <div
                            onClick={() => setSelectedPhoto(iss.evidenceImage!)}
                            className="relative w-full aspect-video rounded-md overflow-hidden bg-slate-100 cursor-pointer group"
                            title="Click to zoom evidence photo"
                          >
                            <img
                              src={iss.evidenceImage}
                              alt={iss.evidenceCaption || 'Evidence'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-4 h-4" />
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-500 font-medium truncate max-w-full" title={iss.evidenceCaption || 'Evidence photo'}>
                            {iss.evidenceCaption || 'Evidence'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                      <span>Owner: <strong>{iss.responsiblePerson || capa.responsiblePerson}</strong></span>
                      <span>Target Date: <strong>{iss.targetDate || capa.targetCompletionDate}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Fallback Single Executive Issue Card */
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Non-Conformance & Problem Statement (D2)
                </span>
                <span className="text-xs font-mono text-slate-400">Date Raised: {capa.dateRaised || '2026-09-14'}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {capa.issueTitle}
              </h3>
              {capa.problemDescription && (
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {capa.problemDescription}
                </p>
              )}
              {capa.problemStatement && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs">
                  <span className="font-bold text-blue-900 block mb-1">5W2H Problem Statement:</span>
                  <p className="text-blue-950 font-mono text-[11px] leading-relaxed">{capa.problemStatement}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions Grid: Containment, Corrective, Preventive */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Containment */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-amber-700">
                <Clock className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  D3: Containment Action
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed min-h-[60px]">
                {capa.containmentAction}
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Owner: {capa.containmentOwner || capa.responsiblePerson}</span>
                <span>Date: {capa.containmentDate || 'Immediate'}</span>
              </div>
            </div>

            {/* Corrective */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-blue-700">
                <CheckCircle2 className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  D5: Permanent Corrective
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed min-h-[60px]">
                {capa.correctiveAction}
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Target: {capa.targetCompletionDate}</span>
                <span className="font-semibold text-blue-700">Lead: {capa.responsiblePerson}</span>
              </div>
            </div>

            {/* Preventive */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  D7: Preventive Measures
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed min-h-[60px]">
                {capa.preventiveAction}
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col gap-1">
                {capa.sopReference && (
                  <span className="font-mono text-emerald-800">SOP: {capa.sopReference}</span>
                )}
                {capa.trainingDetails && (
                  <span className="text-slate-600 truncate" title={capa.trainingDetails}>
                    Training: {capa.trainingDetails}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Department & Operational Context Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Operational Scope & Ownership
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Department / Section</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{capa.department || 'Sewing Division'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Process Stage</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{capa.processStage || 'In-line Operation'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Originator / Auditor</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{capa.raisedBy || 'Internal QA Lead'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Source Reference</span>
                <span className="font-mono font-bold text-blue-700 mt-0.5 block">{capa.sourceReference || 'Direct Audit Finding'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: ROOT CAUSE ANALYSIS (5 WHYS & ISHIKAWA) ──────────────── */}
      {activeTab === 'rca' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Confirmed Primary Root Cause Banner */}
          <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirmed Primary Root Cause (D4)</span>
            </div>
            <p className="text-sm font-semibold text-rose-950 leading-relaxed">
              {capa.rootCause}
            </p>
            {capa.rcaSupportingEvidence && (
              <div className="pt-2 border-t border-rose-200/60 text-xs text-rose-800">
                <span className="font-bold">Supporting Evidence: </span>
                <span>{capa.rcaSupportingEvidence}</span>
              </div>
            )}
          </div>

          {/* 5-Whys Visual Cascade */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  5-Whys Drill-Down Investigation Cascade
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">Why-Why Analysis</span>
            </div>

            <div className="space-y-3">
              {[
                { level: 1, text: capa.fiveWhys?.why1 },
                { level: 2, text: capa.fiveWhys?.why2 },
                { level: 3, text: capa.fiveWhys?.why3 },
                { level: 4, text: capa.fiveWhys?.why4 },
                { level: 5, text: capa.fiveWhys?.why5 },
              ].map(({ level, text }) => {
                if (!text) return null;
                return (
                  <div key={level} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                        W{level}
                      </div>
                      {level < 5 && <div className="w-0.5 h-4 bg-blue-200 my-1" />}
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                      {text}
                    </div>
                  </div>
                );
              })}

              {capa.fiveWhys?.rootCauseConclusion && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 font-semibold flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">5-Whys Synthesis Conclusion:</span>
                    <span>{capa.fiveWhys.rootCauseConclusion}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ishikawa / Fishbone 6M Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Ishikawa Fishbone Cause-and-Effect Diagram (6Ms)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">6M Matrix</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {(
                [
                  { key: 'man', label: 'Man (Personnel)', icon: User, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                  { key: 'machine', label: 'Machine (Equipment)', icon: Layers, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                  { key: 'material', label: 'Material (Fabric/Trims)', icon: Paperclip, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                  { key: 'method', label: 'Method (SOPs/Processes)', icon: FileText, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { key: 'measurement', label: 'Measurement (Gauges/QA)', icon: CheckCircle2, color: 'text-purple-700 bg-purple-50 border-purple-200' },
                  { key: 'milieu', label: 'Milieu (Environment/Climate)', icon: Building2, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
                ] as const
              ).map(({ key, label, icon: IconComp, color }) => {
                const factors = capa.fishboneFactors?.[key] || [];
                return (
                  <div key={key} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <IconComp className="w-4 h-4 text-slate-500" />
                      <span>{label}</span>
                      <span className="ml-auto text-[10px] font-mono text-slate-400">
                        {factors.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {factors.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic block">No secondary factors</span>
                      ) : (
                        factors.map((factor, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border text-[11px] leading-snug font-medium ${color}`}
                          >
                            {factor}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: COMPLETION EVIDENCE & PHOTOS ──────────────────────────── */}
      {activeTab === 'evidence' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Photographic Audit Evidence Gallery
              </h3>
              <p className="text-[11px] text-slate-500">
                Before & after images, micro-caliper readings, and verified floor installations
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddPhotoOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Attach New Photo</span>
            </button>
          </div>

          {allPhotos.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Evidence Photos Attached</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload photos of the defect, root cause investigation, or the completed corrective action installation.
              </p>
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Attach First Photo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {allPhotos.map((img) => (
                <div
                  key={img.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow group"
                >
                  <div
                    onClick={() => setSelectedPhoto(img.url)}
                    className="relative aspect-video bg-slate-100 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || 'Evidence'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        img.type === 'ROOT_CAUSE'
                          ? 'bg-rose-600 text-white'
                          : img.type === 'BEFORE'
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {img.type || 'EVIDENCE'}
                    </span>
                  </div>
                  <div className="p-3 text-xs space-y-1">
                    <p className="font-semibold text-slate-800 truncate" title={img.caption}>
                      {img.caption || 'Photographic Evidence'}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Timestamp: {img.timestamp || 'Recorded'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: VERIFICATION & CLOSURE (D8) ────────────────────────────── */}
      {activeTab === 'signoff' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Effectiveness Banner */}
          <div
            className={`p-5 rounded-2xl border shadow-xs space-y-3 ${
              capa.status === 'CLOSED'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>D8: Effectiveness Verification & Closure Status</span>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-current">
                {capa.effectivenessRating || (capa.status === 'CLOSED' ? 'EFFECTIVE' : 'PENDING')}
              </span>
            </div>

            <p className="text-xs leading-relaxed">
              {capa.verificationNotes ||
                (capa.status === 'CLOSED'
                  ? 'Follow-up inspection confirmed zero recurrence across subsequent production lots. Corrective action deemed 100% effective.'
                  : 'Verification audit is scheduled after 30 days of continuous production monitoring to validate zero recurrence.')}
            </p>

            <div className="pt-2 border-t border-current/20 flex items-center justify-between text-xs">
              <span>Auditor / Verifier: <strong>{capa.verifiedBy || 'Pending Assignment'}</strong></span>
              <span>Verification Date: <strong>{capa.verificationDate || capa.targetCompletionDate}</strong></span>
            </div>
          </div>

          {/* Closure Actions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Audit Sign-off Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="font-bold text-slate-800 block">Close and Certify CAPA</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Lock CAPA resolution plan, stamp digital closure audit trail, and notify buyer and quality manager.
                </p>
                <button
                  type="button"
                  onClick={() => handleQuickStatusChange('CLOSED')}
                  disabled={capa.status === 'CLOSED'}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    capa.status === 'CLOSED'
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {capa.status === 'CLOSED' ? 'Already Closed & Verified' : 'Mark as Closed & Verified'}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="font-bold text-slate-800 block">Re-open for Adjustment</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  If recurrence is detected or effectiveness is partial, return CAPA to In Progress for revised RCA.
                </p>
                <button
                  type="button"
                  onClick={() => handleQuickStatusChange('IN_PROGRESS')}
                  disabled={capa.status === 'IN_PROGRESS'}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                >
                  Set to In Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD PHOTO MODAL ──────────────────────────────────────────────── */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Attach Evidence Photo</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Photo URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Evidence Phase
                </label>
                <select
                  value={newPhotoType}
                  onChange={(e) => setNewPhotoType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="ROOT_CAUSE">D4: Root Cause / Defect Inspection</option>
                  <option value="BEFORE">D3: Before / Quarantined Condition</option>
                  <option value="AFTER">D5: After / Corrective Tooling</option>
                  <option value="COMPLETION">D6: Full Completion & Sign-off</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Caption / Description
                </label>
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="e.g. Needle plate orifice micro-inspection"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPhotoSubmit}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Upload Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── IMAGE ZOOM MODAL ─────────────────────────────────────────────── */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-4xl w-full max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900">
            <img
              src={selectedPhoto}
              alt="Zoomed Evidence"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
      <DeleteCapaModal
        isOpen={isDeleteModalOpen}
        capas={[capa]}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          if (onDelete) {
            onDelete(capa);
          }
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
