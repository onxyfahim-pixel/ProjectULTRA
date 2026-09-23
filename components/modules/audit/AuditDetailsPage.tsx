'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Edit,
  Trash2,
  Building2,
  Image as ImageIcon,
  Download,
  Check,
  X,
  Layers,
  ZoomIn,
  Clock,
  Info,
  FileCheck,
  Camera,
  Plus,
  Search,
  UploadCloud,
  ShieldAlert,
} from 'lucide-react';
import { QualityAudit, AuditChecklistItem, AuditPhotoEvidence } from '@/lib/types/modules';
import { ISO_9001_DEFAULT_CHECKLIST, calculateAuditScore } from './iso9001ChecklistData';
import { DeleteAuditModal } from './DeleteAuditModal';
import { AddQuestionModal } from './AddQuestionModal';

interface AuditDetailsPageProps {
  audit: QualityAudit;
  onBack: () => void;
  onEdit: (audit: QualityAudit) => void;
  onDelete?: (audit: QualityAudit) => void;
  onUpdateAudit?: (audit: QualityAudit) => void;
  showToast: (msg: string) => void;
}

export function AuditDetailsPage({
  audit,
  onBack,
  onEdit,
  onDelete,
  onUpdateAudit,
  showToast,
}: AuditDetailsPageProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'findings' | 'files' | 'signoff'>('feed');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [clauseFilter, setClauseFilter] = useState<string>('ALL');
  const [questionSearchQuery, setQuestionSearchQuery] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);

  const category =
    audit.auditCategory ||
    (audit.auditType === 'INTERNAL' || audit.auditType === 'INTERNAL_QMS'
      ? 'INTERNAL'
      : audit.auditType === 'SUB_SUPPLIER'
      ? 'SUB_SUPPLIER'
      : 'EXTERNAL');

  const initialChecklist = useMemo(() => {
    if (audit.checklist && audit.checklist.length > 0) {
      return audit.checklist;
    }
    return category === 'INTERNAL' ? ISO_9001_DEFAULT_CHECKLIST : [];
  }, [audit.checklist, category]);

  const [localChecklist, setLocalChecklist] = useState<AuditChecklistItem[]>(initialChecklist);

  // Sync if audit prop updates externally
  React.useEffect(() => {
    if (audit.checklist && audit.checklist.length > 0) {
      setLocalChecklist(audit.checklist);
    }
  }, [audit.checklist]);

  const checklist = localChecklist;

  const score = audit.obtainedMarks ?? audit.scorePercentage;
  const criticalCount =
    audit.criticalNCs ??
    checklist.filter((i) => i.status === 'CRITICAL_NC').length;
  const majorCount =
    audit.majorNCs ??
    checklist.filter((i) => i.status === 'MAJOR_NC').length;
  const minorCount =
    audit.minorNCs ??
    checklist.filter((i) => i.status === 'MINOR_NC' || i.status === 'NON_CONFORMITY').length;
  const hasCriticalFail = criticalCount > 0;
  const isPassed = !hasCriticalFail && (audit.isPassed !== undefined ? audit.isPassed : score >= 80);

  // Dynamic counts per clause
  const clauseCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: checklist.length };
    checklist.forEach((item) => {
      const clauseKey = item.clause.split(':')[0].trim();
      counts[clauseKey] = (counts[clauseKey] || 0) + 1;
    });
    return counts;
  }, [checklist]);

  const filteredChecklist = useMemo(() => {
    const q = questionSearchQuery.trim().toLowerCase();
    return checklist.filter((item) => {
      const matchesClause =
        clauseFilter === 'ALL' || item.clause.toLowerCase().includes(clauseFilter.toLowerCase());
      const matchesSearch =
        !q ||
        item.clauseNumber.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        item.subClauseTitle.toLowerCase().includes(q) ||
        (item.remark && item.remark.toLowerCase().includes(q));
      return matchesClause && matchesSearch;
    });
  }, [checklist, clauseFilter, questionSearchQuery]);

  // Multiple Image Upload directly in Details view
  const handleDetailsPhotosUpload = (itemId: string, files: FileList) => {
    const fileArray = Array.from(files);
    const readers = fileArray.map((file) => {
      return new Promise<AuditPhotoEvidence>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            url: e.target?.result as string,
            caption: file.name,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((newPhotos) => {
      const updatedChecklist = checklist.map((q) => {
        if (q.id === itemId) {
          const existing = q.evidencePhotos || (q.evidencePhoto ? [{ id: 'p-legacy', url: q.evidencePhoto }] : []);
          return {
            ...q,
            evidencePhotos: [...existing, ...newPhotos],
            evidencePhoto: newPhotos[0]?.url || q.evidencePhoto,
          };
        }
        return q;
      });
      setLocalChecklist(updatedChecklist);
      if (onUpdateAudit) {
        onUpdateAudit({
          ...audit,
          checklist: updatedChecklist,
        });
      }
      showToast(`Uploaded ${newPhotos.length} image evidence(s)`);
    });
  };

  const handleAddQuestion = (newItem: AuditChecklistItem) => {
    const updated = [newItem, ...checklist];
    setLocalChecklist(updated);
    if (onUpdateAudit) {
      onUpdateAudit({
        ...audit,
        checklist: updated,
      });
    }
  };

  const handleImportQuestions = (newItems: AuditChecklistItem[]) => {
    const updated = [...checklist, ...newItems];
    setLocalChecklist(updated);
    if (onUpdateAudit) {
      onUpdateAudit({
        ...audit,
        checklist: updated,
      });
    }
  };

  const ncItems = useMemo(() => {
    return checklist.filter(
      (item) =>
        item.status === 'CRITICAL_NC' ||
        item.status === 'MAJOR_NC' ||
        item.status === 'MINOR_NC' ||
        item.status === 'NON_CONFORMITY'
    );
  }, [checklist]);

  const clauseOptions = [
    { label: `All Clauses (${clauseCounts['ALL'] || 0})`, value: 'ALL' },
    { label: `Clause 4: Context (${clauseCounts['Clause 4'] || 0})`, value: 'Clause 4' },
    { label: `Clause 5: Leadership (${clauseCounts['Clause 5'] || 0})`, value: 'Clause 5' },
    { label: `Clause 6: Planning (${clauseCounts['Clause 6'] || 0})`, value: 'Clause 6' },
    { label: `Clause 7: Support (${clauseCounts['Clause 7'] || 0})`, value: 'Clause 7' },
    { label: `Clause 8: Operation (${clauseCounts['Clause 8'] || 0})`, value: 'Clause 8' },
    { label: `Clause 9: Evaluation (${clauseCounts['Clause 9'] || 0})`, value: 'Clause 9' },
    { label: `Clause 10: Improvement (${clauseCounts['Clause 10'] || 0})`, value: 'Clause 10' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── TOP BAR (Clean, Crisp Header) ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Audits List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {audit.auditCode}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                hasCriticalFail
                  ? 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-400'
                  : isPassed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {hasCriticalFail
                  ? 'FAILED (CRITICAL NC FOUND)'
                  : isPassed
                  ? 'PASSED (≥80 MARKS)'
                  : 'FAILED / ACTION REQ.'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {category === 'INTERNAL'
                  ? 'INTERNAL ISO 9001'
                  : category === 'EXTERNAL'
                  ? 'EXTERNAL'
                  : 'SUB-SUPPLIER'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {audit.standard} • Date: {audit.auditDate} • Next: {audit.nextAuditDate}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              title="Delete this audit record"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(audit)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
            title="Edit Audit Details"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Audit</span>
          </button>
        </div>
      </div>

      {/* ─── CLEAN LIGHT EVALUATION SCORECARD ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Scorecard Hero Box - Light, Clean, High-End Aesthetic */}
        <div className="md:col-span-2 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 rounded-2xl p-6 border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-blue-900 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Audit Performance Evaluation</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
              hasCriticalFail
                ? 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-400'
                : isPassed
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              {hasCriticalFail
                ? 'CRITICAL NC: AUDIT FAILED'
                : isPassed
                ? 'GRADE A: CONFORMANT'
                : 'ACTION PLAN REQUIRED'}
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900">
              {score}
            </div>
            <div className="text-slate-500 text-sm font-semibold">
              / 100 Total Marks
            </div>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 ml-auto">
              Pass Target: 80 Marks
            </span>
          </div>

          {/* Clean Light Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 font-mono mb-1.5">
              <span>0%</span>
              <span className="text-blue-700 font-bold">80 Marks Pass Benchmark</span>
              <span>100%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200/80 overflow-hidden relative border border-slate-300/40">
              <div
                className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-amber-500 z-10"
                title="80% Pass Benchmark"
              />
              <div
                className={`h-full rounded-full transition-all ${
                  isPassed
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Findings & Non-Conformances Metric */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Non-Conformances
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {audit.nonConformancesCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              {criticalCount > 0 && (
                <>
                  <span className="font-semibold text-rose-700 font-mono bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    {criticalCount} Critical
                  </span>
                  <span>•</span>
                </>
              )}
              <span className="font-semibold text-orange-600 font-mono">{majorCount} Major</span>
              <span>•</span>
              <span className="font-semibold text-amber-600 font-mono">{minorCount} Minor</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Observations logged: {audit.observations || 0}
          </div>
        </div>

        {/* Lead Auditor & Next Audit Metric */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Lead Auditor & Scope
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900 truncate">
              {audit.auditorName}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {audit.auditorOrganization || 'Valiant Quality Assurance'}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Next: {audit.nextAuditDate}</span>
          </div>
        </div>
      </div>

      {/* ─── TABS NAVIGATION ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'feed'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ISO 9001:2015 Question Records</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/40 text-white font-mono">
            {checklist.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('findings')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'findings'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Findings & NCs (CAPA)</span>
          {ncItems.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
              {ncItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'files'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Attached Documents</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
            {audit.uploadedFiles?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('signoff')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'signoff'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Sign-off & Governance</span>
        </button>
      </div>

      {/* ─── TAB 1: ALL QUESTIONS INCLUDED IN RECORD LIST WITH DATES ───────── */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Question Toolbar: Search bar, + Add Question, Import, and Clause Filter Buttons */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search 112 questions by clause, text, needle, calibration..."
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                  {questionSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setQuestionSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span className="text-xs text-slate-500 font-mono hidden md:inline">
                  Showing {filteredChecklist.length} of {checklist.length}
                </span>
              </div>

              {/* Action Buttons: Add Custom Question, Bulk Import */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddQuestionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Question</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddQuestionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  title="Upload / Paste questions from list"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Import Questions</span>
                </button>
              </div>
            </div>

            {/* Clause Navigation Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {clauseOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setClauseFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    clauseFilter === opt.value
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Record List with Visible Dates & Multiple Image Gallery */}
          <div className="space-y-3">
            {filteredChecklist.map((item) => {
              const photos: AuditPhotoEvidence[] =
                item.evidencePhotos && item.evidencePhotos.length > 0
                  ? item.evidencePhotos
                  : item.evidencePhoto
                  ? [{ id: 'p-1', url: item.evidencePhoto, timestamp: item.photoTimestamp }]
                  : [];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                >
                  {/* Header: Clause info + Question Date + Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          Clause {item.clauseNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {item.clause}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {item.subClauseTitle}
                        </span>
                        {/* Explicitly Visible Verified Date */}
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-bold">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>Date: {audit.auditDate}</span>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                        {item.question}
                      </h4>

                      {item.guidance && (
                        <p className="text-xs text-slate-500 italic">
                          Verification Criteria: {item.guidance}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono shrink-0 border ${
                      item.status === 'CONFORMITY'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : item.status === 'CRITICAL_NC'
                        ? 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-400'
                        : item.status === 'MAJOR_NC'
                        ? 'bg-orange-50 text-orange-800 border-orange-200'
                        : item.status === 'MINOR_NC' || item.status === 'NON_CONFORMITY'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : item.status === 'NA'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {item.status === 'CONFORMITY'
                        ? 'Conformity (100%)'
                        : item.status === 'MINOR_NC'
                        ? 'Minor NC (75%)'
                        : item.status === 'MAJOR_NC'
                        ? 'Major NC (50%)'
                        : item.status === 'CRITICAL_NC'
                        ? 'Critical NC (0% Fail)'
                        : item.status === 'NA'
                        ? 'N/A (Excluded)'
                        : item.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Remarks & Multiple Photo Evidences Viewer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700">
                          Auditor Findings & Observations:
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Audited on {audit.auditDate}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed italic">
                        {item.remark || 'Standard protocol verified conformant without non-conformance.'}
                      </p>
                    </div>

                    {/* Multiple Image Evidences Gallery & Direct Upload */}
                    <div>
                      {photos.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-blue-600" />
                              <span>Image Evidences ({photos.length})</span>
                            </span>
                            <label className="text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1 font-bold text-[11px] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors">
                              <Plus className="w-3 h-3" />
                              <span>+ Attach More Images</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleDetailsPhotosUpload(item.id, e.target.files);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {photos.map((photo, pIdx) => (
                              <div
                                key={photo.id || pIdx}
                                className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video group cursor-pointer"
                                onClick={() => setSelectedPhoto(photo.url)}
                              >
                                <img
                                  src={photo.url}
                                  alt="Evidence"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </div>
                                {photo.timestamp && (
                                  <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-white font-mono text-[9px]">
                                    {photo.timestamp}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <label className="p-3 rounded-xl bg-slate-50/50 hover:bg-blue-50/30 border border-dashed border-slate-200 hover:border-blue-400 text-slate-500 hover:text-blue-700 text-center flex items-center justify-center gap-2 h-full cursor-pointer transition-colors">
                          <Camera className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold">Select & Upload Image Evidences (Multiple)</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleDetailsPhotosUpload(item.id, e.target.files);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: FINDINGS & NON-CONFORMANCES (CAPA) ──────────────────────── */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Audit Non-Conformances & Corrective Action Items</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Items requiring containment, root cause analysis (5-Whys), and preventive actions.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-100 text-rose-800">
                {audit.nonConformancesCount} Findings
              </span>
            </div>

            {ncItems.length > 0 ? (
              <div className="space-y-3">
                {ncItems.map((nc) => {
                  const isCrit = nc.status === 'CRITICAL_NC';
                  const isMaj = nc.status === 'MAJOR_NC';
                  return (
                    <div
                      key={nc.id}
                      className={`p-4 rounded-xl border space-y-2 text-xs ${
                        isCrit
                          ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-400'
                          : isMaj
                          ? 'border-orange-200 bg-orange-50/30'
                          : 'border-amber-200 bg-amber-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-white ${
                            isCrit ? 'bg-rose-600' : isMaj ? 'bg-orange-600' : 'bg-amber-600'
                          }`}>
                            Clause {nc.clauseNumber}
                          </span>
                          <span className="font-bold text-slate-900">{nc.clause}</span>
                          <span className="text-[10px] font-mono text-slate-500">Date: {audit.auditDate}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCrit
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isMaj
                            ? 'bg-orange-100 text-orange-800 border-orange-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {isCrit
                            ? 'CRITICAL NON-CONFORMITY (AUDIT FAIL REASON)'
                            : isMaj
                            ? 'MAJOR NON-CONFORMITY (50% MARKS)'
                            : 'MINOR NON-CONFORMITY (75% MARKS)'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800">{nc.question}</div>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-slate-700 italic">
                        <span className="font-bold text-slate-900 not-italic block mb-0.5">Auditor Finding:</span>
                        {nc.remark || 'Non-conformance documented during audit walkthrough.'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                {audit.nonConformancesCount === 0 ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <div className="font-bold text-slate-900 text-sm">Zero Non-Conformances Found</div>
                    <p>The facility fully conforms to audited standard specifications.</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-left">
                    <div className="font-bold text-slate-800">
                      Summary of {audit.nonConformancesCount} Findings:
                    </div>
                    <p className="text-slate-600 italic">
                      {audit.executiveSummary || 'Non-conformances logged in external audit report file.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: ATTACHED REPORTS & FILES ───────────────────────────────── */}
      {activeTab === 'files' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Attached Reports & Documentation</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official PDF audit reports, formal supplier evaluations, and compliance records.
              </p>
            </div>
          </div>

          {audit.uploadedFiles && audit.uploadedFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {audit.uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-blue-600 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate" title={file.fileName}>
                        {file.fileName}
                      </span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        {file.fileSize} • Uploaded {file.uploadDate}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showToast(`Downloading ${file.fileName}...`);
                    }}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer shrink-0 ml-3"
                    title="Download attached file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <div>No external audit files attached to this record yet.</div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: EXECUTIVE SUMMARY & SIGNOFF ─────────────────────────────── */}
      {activeTab === 'signoff' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Executive Sign-off & Audit Governance</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Formal audit conclusion, management reviews, and next scheduled surveillance date.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 block">Executive Summary & General Comments:</span>
            <p className="text-slate-600 leading-relaxed italic">
              {audit.executiveSummary ||
                'The audit was conducted strictly in accordance with ISO 9001:2015 surveillance audit guidelines. General management and operational personnel demonstrated full transparency and cooperation throughout the assessment.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Lead Auditor Sign-off
              </span>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="h-10 border-b border-slate-300 flex items-end font-serif italic text-blue-900 font-bold text-sm">
                  {audit.auditorName}
                </div>
                <div className="font-bold text-slate-900 mt-2">{audit.auditorName}</div>
                <div className="text-slate-500 text-[11px]">{audit.auditorOrganization || 'Lead Auditor'}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">Signed on {audit.auditDate}</div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Auditee Factory Representative
              </span>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="h-10 border-b border-slate-300 flex items-end font-serif italic text-slate-800 font-bold text-sm">
                  {audit.leadAuditee || 'Authorized QA Management'}
                </div>
                <div className="font-bold text-slate-900 mt-2">{audit.leadAuditee || 'Auditee Head'}</div>
                <div className="text-slate-500 text-[11px]">Factory QMS Directorate</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">Next Re-audit: {audit.nextAuditDate}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteAuditModal
        isOpen={isDeleteModalOpen}
        audits={[audit]}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDelete?.(audit);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Lightbox Modal for Question Evidence Photos */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto}
              alt="Full Evidence"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Add / Import Question Modal */}
      <AddQuestionModal
        isOpen={isAddQuestionModalOpen}
        onClose={() => setIsAddQuestionModalOpen(false)}
        onAddQuestion={handleAddQuestion}
        onImportQuestions={handleImportQuestions}
        showToast={showToast}
      />
    </div>
  );
}
