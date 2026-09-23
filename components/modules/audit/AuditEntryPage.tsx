'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  Plus,
  Building2,
  Calendar,
  ShieldCheck,
  Award,
  Users,
  Layers,
  HelpCircle,
  Eye,
  Info,
  Check,
  X,
  FileCheck,
  Tag,
  Clock,
  ZoomIn,
  Search,
  RotateCcw,
  UploadCloud,
  ShieldAlert,
} from 'lucide-react';
import { AddQuestionModal } from './AddQuestionModal';
import {
  QualityAudit,
  AuditChecklistItem,
  AuditUploadedFile,
  AuditQuestionStatus,
  AuditCategory,
  AuditPhotoEvidence,
} from '@/lib/types/modules';
import {
  ISO_9001_DEFAULT_CHECKLIST,
  calculateAuditScore,
} from './iso9001ChecklistData';

interface AuditEntryPageProps {
  initialAudit?: QualityAudit | null;
  onBack: () => void;
  onSave: (audit: QualityAudit) => void;
  showToast: (msg: string) => void;
}

// ─── MEMOIZED QUESTION CARD (PREVENTS LAG ACROSS 112 QUESTIONS) ──────────────
interface QuestionCardProps {
  item: AuditChecklistItem;
  onStatusChange: (id: string, newStatus: AuditQuestionStatus) => void;
  onRemarkChange: (id: string, remarkText: string) => void;
  onPhotosUpload: (id: string, files: FileList) => void;
  onRemovePhoto: (id: string, photoId: string) => void;
  onPreviewPhoto: (url: string) => void;
}

const QuestionCard = React.memo(function QuestionCard({
  item,
  onStatusChange,
  onRemarkChange,
  onPhotosUpload,
  onRemovePhoto,
  onPreviewPhoto,
}: QuestionCardProps) {
  // Local state for remark to isolate typing and prevent parent re-renders
  const [localRemark, setLocalRemark] = useState(item.remark || '');

  const handleBlur = () => {
    if (localRemark !== item.remark) {
      onRemarkChange(item.id, localRemark);
    }
  };

  // Combine multiple photos array with backward compatibility for single photo
  const photos: AuditPhotoEvidence[] = useMemo(() => {
    if (item.evidencePhotos && item.evidencePhotos.length > 0) {
      return item.evidencePhotos;
    }
    if (item.evidencePhoto) {
      return [{ id: 'p-legacy', url: item.evidencePhoto, timestamp: item.photoTimestamp || 'Recorded' }];
    }
    return [];
  }, [item.evidencePhotos, item.evidencePhoto, item.photoTimestamp]);

  return (
    <div
      className={`bg-white rounded-2xl p-5 border transition-all ${
        item.status === 'CRITICAL_NC'
          ? 'border-rose-400 ring-2 ring-rose-400/40 bg-rose-50/25'
          : item.status === 'MAJOR_NC'
          ? 'border-orange-300 ring-1 ring-orange-300/40 bg-orange-50/20'
          : item.status === 'MINOR_NC' || item.status === 'NON_CONFORMITY'
          ? 'border-amber-300 ring-1 ring-amber-300/40 bg-amber-50/15'
          : item.status === 'CONFORMITY'
          ? 'border-emerald-200/60 bg-emerald-50/10'
          : item.status === 'NA'
          ? 'border-slate-200 bg-slate-50/50'
          : 'border-slate-200'
      }`}
    >
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
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
          </div>

          <h4 className="text-sm font-bold text-slate-900 leading-snug pt-1">
            {item.question}
          </h4>

          {item.guidance && (
            <p className="text-xs text-slate-500 italic pt-0.5">
              Criteria: {item.guidance}
            </p>
          )}
        </div>

        {/* 5 Status Options: Conformity (100%), Minor NC (75%), Major NC (50%), Critical NC (0% Fail), N/A (Excluded) */}
        <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-xl flex-wrap">
          <button
            type="button"
            onClick={() => onStatusChange(item.id, 'CONFORMITY')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              item.status === 'CONFORMITY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
            title="Conformity: 100% of question marks"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Conformity</span>
            <span className="text-[10px] opacity-80 font-mono">(100%)</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(item.id, 'MINOR_NC')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              item.status === 'MINOR_NC' || item.status === 'NON_CONFORMITY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
            }`}
            title="Minor NC: 75% of question marks"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Minor NC</span>
            <span className="text-[10px] opacity-80 font-mono">(75%)</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(item.id, 'MAJOR_NC')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              item.status === 'MAJOR_NC'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-orange-700 hover:bg-orange-50'
            }`}
            title="Major NC: 50% of question marks"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Major NC</span>
            <span className="text-[10px] opacity-80 font-mono">(50%)</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(item.id, 'CRITICAL_NC')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              item.status === 'CRITICAL_NC'
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400'
                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
            }`}
            title="Critical NC: 0% of question marks — 1 Critical NC triggers Audit Failure!"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Critical NC</span>
            <span className="text-[10px] opacity-80 font-mono">(0% Fail)</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(item.id, 'NA')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              item.status === 'NA'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="N/A: Excluded from calculation"
          >
            <span>N/A</span>
            <span className="text-[10px] opacity-80 font-mono">(Excl.)</span>
          </button>
        </div>
      </div>

      {/* Remarks & Multiple Photo Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Auditor Remark & Evidence Description
          </label>
          <textarea
            rows={2}
            value={localRemark}
            onChange={(e) => setLocalRemark(e.target.value)}
            onBlur={handleBlur}
            placeholder="Enter findings, verification notes, or SOP reference..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Multiple Photo Evidences Upload Section */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">
              Multiple Image Evidences ({photos.length})
            </label>
            {photos.length > 0 && (
              <label className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                <Plus className="w-3 h-3" />
                <span>Add More Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onPhotosUpload(item.id, e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            )}
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((photo, pIdx) => (
                <div
                  key={photo.id || pIdx}
                  className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center"
                >
                  <img
                    src={photo.url}
                    alt="Evidence"
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => onPreviewPhoto(photo.url)}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPreviewPhoto(photo.url)}
                      className="p-1 rounded-md bg-white/90 text-slate-800 hover:bg-white transition-colors cursor-pointer"
                      title="Enlarge photo"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(item.id, photo.id)}
                      className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {photo.timestamp && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-white font-mono text-[9px]">
                      {photo.timestamp}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-xs font-medium text-slate-600 cursor-pointer transition-colors">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Select & Upload Image Evidences (Multiple Supported)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onPhotosUpload(item.id, e.target.files);
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
});

// ─── MAIN AUDIT ENTRY PAGE ───────────────────────────────────────────────────
export function AuditEntryPage({
  initialAudit,
  onBack,
  onSave,
  showToast,
}: AuditEntryPageProps) {
  const defaultCategory: AuditCategory =
    initialAudit?.auditCategory ||
    (initialAudit?.auditType === 'INTERNAL' || initialAudit?.auditType === 'INTERNAL_QMS'
      ? 'INTERNAL'
      : initialAudit?.auditType === 'SUB_SUPPLIER'
      ? 'SUB_SUPPLIER'
      : 'EXTERNAL');

  const [category, setCategory] = useState<AuditCategory>(defaultCategory);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  const [auditCode, setAuditCode] = useState(
    initialAudit?.auditCode ||
      `AUD-${category === 'INTERNAL' ? 'INT' : category === 'EXTERNAL' ? 'EXT' : 'SUB'}-${Date.now().toString().slice(-4)}`
  );
  const [standard, setStandard] = useState(
    initialAudit?.standard ||
      (category === 'INTERNAL'
        ? 'ISO 9001:2015 Quality Management System'
        : category === 'SUB_SUPPLIER'
        ? 'Sub-Supplier QMS & Facility Evaluation'
        : 'ISO 9001:2015 / Buyer Technical Standard')
  );
  const [auditorName, setAuditorName] = useState(
    initialAudit?.auditorName || 'Engr. Tareq Rahman (Lead Auditor)'
  );
  const [auditorOrganization, setAuditorOrganization] = useState(
    initialAudit?.auditorOrganization ||
      (category === 'INTERNAL'
        ? 'Valiant Internal Quality Assurance Dept.'
        : category === 'SUB_SUPPLIER'
        ? 'Valiant Vendor Quality Division'
        : 'SGS International / Buyer QA')
  );
  const [auditeeDepartment, setAuditeeDepartment] = useState(
    initialAudit?.auditeeDepartment || 'Cutting, Sewing Line 01-12 & Lab QC'
  );
  const [leadAuditee, setLeadAuditee] = useState(
    initialAudit?.leadAuditee || 'Rafiqul Islam (QA Manager)'
  );
  const [auditDate, setAuditDate] = useState(
    initialAudit?.auditDate || new Date().toISOString().split('T')[0]
  );
  const [nextAuditDate, setNextAuditDate] = useState(
    initialAudit?.nextAuditDate ||
      new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [executiveSummary, setExecutiveSummary] = useState(
    initialAudit?.executiveSummary || ''
  );

  // ─── INTERNAL AUDIT CHECKLIST STATE ──────────────────────────────────────
  const [checklist, setChecklist] = useState<AuditChecklistItem[]>(() => {
    if (initialAudit?.checklist && initialAudit.checklist.length > 0) {
      return initialAudit.checklist;
    }
    return JSON.parse(JSON.stringify(ISO_9001_DEFAULT_CHECKLIST));
  });

  const [clauseFilter, setClauseFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [questionSearchQuery, setQuestionSearchQuery] = useState<string>('');
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);

  // Real-time Score Calculation
  const internalScoreResult = useMemo(() => {
    return calculateAuditScore(checklist);
  }, [checklist]);

  // Dynamic counts per clause
  const clauseCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: checklist.length };
    checklist.forEach((item) => {
      const clauseKey = item.clause.split(':')[0].trim(); // e.g. "Clause 4"
      counts[clauseKey] = (counts[clauseKey] || 0) + 1;
    });
    return counts;
  }, [checklist]);

  // ─── EXTERNAL & SUB-SUPPLIER STATE ───────────────────────────────────────
  const [externalScore, setExternalScore] = useState<number>(
    initialAudit?.obtainedMarks ?? initialAudit?.scorePercentage ?? 92
  );
  const [criticalNCs, setCriticalNCs] = useState<number>(initialAudit?.criticalNCs ?? 0);
  const [majorNCs, setMajorNCs] = useState<number>(initialAudit?.majorNCs ?? 0);
  const [minorNCs, setMinorNCs] = useState<number>(
    initialAudit?.minorNCs ?? initialAudit?.nonConformancesCount ?? 2
  );
  const [observations, setObservations] = useState<number>(initialAudit?.observations ?? 3);
  const [uploadedFiles, setUploadedFiles] = useState<AuditUploadedFile[]>(
    initialAudit?.uploadedFiles || []
  );

  const [supplierName, setSupplierName] = useState(
    initialAudit?.supplierName || 'Apex Spinning & Knitting Mills Ltd.'
  );
  const [supplierCategory, setSupplierCategory] = useState(
    initialAudit?.supplierCategory || 'Fabric Mill (Knits & Woven)'
  );
  const [approvalStatus, setApprovalStatus] = useState<
    'APPROVED' | 'CONDITIONAL' | 'PENDING' | 'REJECTED'
  >(initialAudit?.approvalStatus || 'APPROVED');

  // Fast Memoized Handlers for snappy zero-lag response with 5-tier scoring
  const handleQuestionStatusChange = useCallback((id: string, newStatus: AuditQuestionStatus) => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const weight = item.maxScore || 1;
          let updatedScore = 0;
          if (newStatus === 'CONFORMITY') {
            updatedScore = weight * 1.0;
          } else if (newStatus === 'MINOR_NC') {
            updatedScore = Number((weight * 0.75).toFixed(2));
          } else if (newStatus === 'MAJOR_NC') {
            updatedScore = Number((weight * 0.50).toFixed(2));
          } else if (newStatus === 'CRITICAL_NC') {
            updatedScore = 0;
          } else if (newStatus === 'NA') {
            updatedScore = 0;
          } else if (newStatus === 'NON_CONFORMITY') {
            updatedScore = Number((weight * 0.75).toFixed(2));
          }

          return {
            ...item,
            status: newStatus,
            score: updatedScore,
          };
        }
        return item;
      })
    );
  }, []);

  const handleQuestionRemarkChange = useCallback((id: string, remarkText: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, remark: remarkText } : item))
    );
  }, []);

  // Multiple Image Upload Handler
  const handleMultiplePhotosUpload = useCallback((id: string, fileList: FileList) => {
    const files = Array.from(fileList);
    const readers = files.map((file) => {
      return new Promise<AuditPhotoEvidence>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            url: e.target?.result as string,
            caption: file.name,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((newPhotos) => {
      setChecklist((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const existing = item.evidencePhotos || (item.evidencePhoto ? [{ id: 'p-1', url: item.evidencePhoto }] : []);
            return {
              ...item,
              evidencePhotos: [...existing, ...newPhotos],
              evidencePhoto: newPhotos[0]?.url || item.evidencePhoto,
            };
          }
          return item;
        })
      );
      showToast(`Uploaded ${newPhotos.length} image evidence(s)`);
    });
  }, [showToast]);

  const handleRemovePhoto = useCallback((id: string, photoId: string) => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const existing = item.evidencePhotos || (item.evidencePhoto ? [{ id: 'p-legacy', url: item.evidencePhoto }] : []);
          const updatedPhotos = existing.filter((p) => p.id !== photoId);
          return {
            ...item,
            evidencePhotos: updatedPhotos,
            evidencePhoto: updatedPhotos[0]?.url,
          };
        }
        return item;
      })
    );
  }, []);

  const handleAddQuestion = useCallback((newItem: AuditChecklistItem) => {
    setChecklist((prev) => [newItem, ...prev]);
  }, []);

  const handleImportQuestions = useCallback((newItems: AuditChecklistItem[]) => {
    setChecklist((prev) => [...prev, ...newItems]);
  }, []);

  const handleResetDefaultChecklist = useCallback(() => {
    setChecklist(JSON.parse(JSON.stringify(ISO_9001_DEFAULT_CHECKLIST)));
    showToast('Reset to 112 Official ISO 9001:2015 Questions');
  }, [showToast]);

  const handleReportFileUpload = (file: File) => {
    const newFile: AuditUploadedFile = {
      id: `file-${Date.now()}`,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      fileType: file.type || 'application/pdf',
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: auditorName,
      fileUrl: URL.createObjectURL(file),
    };
    setUploadedFiles((prev) => [newFile, ...prev]);
    showToast(`File "${file.name}" attached`);
  };

  const handleRemoveReportFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSaveAudit = () => {
    if (!auditCode.trim()) {
      showToast('Please provide an Audit Reference Code');
      return;
    }
    if (!standard.trim()) {
      showToast('Please specify the Audited Standard');
      return;
    }

    let finalScore = 0;
    let finalPassed = false;
    let finalNCs = 0;
    let finalCritical = 0;
    let finalMajor = 0;
    let finalMinor = 0;
    let finalVerdict: QualityAudit['verdict'] = 'PASSED_GRADE_A';

    if (category === 'INTERNAL') {
      finalScore = internalScoreResult.obtainedMarks;
      finalCritical = internalScoreResult.criticalNcCount;
      finalMajor = internalScoreResult.majorNcCount;
      finalMinor = internalScoreResult.minorNcCount;
      finalNCs = internalScoreResult.nonConformityCount;
      finalPassed = internalScoreResult.isPassed;

      // If 1 Critical NC found -> Immediately FAILED!
      if (finalCritical > 0) {
        finalVerdict = 'FAILED';
        finalPassed = false;
      } else if (finalScore >= 90) {
        finalVerdict = 'PASSED_GRADE_A';
      } else if (finalScore >= 80) {
        finalVerdict = 'PASSED_WITH_OBSERVATIONS';
      } else if (finalScore >= 60) {
        finalVerdict = 'ACTION_PLAN_REQUIRED';
      } else {
        finalVerdict = 'FAILED';
      }
    } else {
      finalScore = Number(externalScore);
      finalCritical = Number(criticalNCs);
      finalMajor = Number(majorNCs);
      finalMinor = Number(minorNCs);
      finalNCs = finalCritical + finalMajor + finalMinor;
      finalPassed = finalCritical === 0 && finalScore >= 80;

      // If 1 Critical NC found -> Immediately FAILED!
      if (finalCritical > 0) {
        finalVerdict = 'FAILED';
      } else if (finalScore >= 90) {
        finalVerdict = 'PASSED_GRADE_A';
      } else if (finalScore >= 80) {
        finalVerdict = 'PASSED_WITH_OBSERVATIONS';
      } else if (finalScore >= 60) {
        finalVerdict = 'ACTION_PLAN_REQUIRED';
      } else {
        finalVerdict = 'FAILED';
      }
    }

    const savedAudit: QualityAudit = {
      id: initialAudit?.id || `aud-${Date.now()}`,
      auditCode: auditCode.trim(),
      auditType: category,
      auditCategory: category,
      standard: standard.trim(),
      auditorName: auditorName.trim(),
      auditorOrganization: auditorOrganization.trim(),
      auditeeDepartment: auditeeDepartment.trim(),
      supplierName: category === 'SUB_SUPPLIER' ? supplierName.trim() : undefined,
      supplierCategory: category === 'SUB_SUPPLIER' ? supplierCategory.trim() : undefined,
      auditDate,
      totalMarks: 100,
      obtainedMarks: finalScore,
      passMarks: 80,
      scorePercentage: finalScore,
      isPassed: finalPassed,
      nonConformancesCount: finalNCs,
      criticalNCs: finalCritical,
      majorNCs: finalMajor,
      minorNCs: finalMinor,
      observations: category === 'INTERNAL' ? 2 : observations,
      verdict: finalVerdict,
      nextAuditDate,
      executiveSummary: executiveSummary.trim() || undefined,
      leadAuditee: leadAuditee.trim(),
      approvalStatus: category === 'SUB_SUPPLIER' ? approvalStatus : undefined,
      checklist: category === 'INTERNAL' ? checklist : undefined,
      uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    };

    onSave(savedAudit);
  };

  const filteredChecklist = useMemo(() => {
    const q = questionSearchQuery.trim().toLowerCase();
    return checklist.filter((item) => {
      const matchesClause =
        clauseFilter === 'ALL' || item.clause.toLowerCase().includes(clauseFilter.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;
      const matchesSearch =
        !q ||
        item.clauseNumber.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        item.subClauseTitle.toLowerCase().includes(q) ||
        (item.remark && item.remark.toLowerCase().includes(q));
      return matchesClause && matchesStatus && matchesSearch;
    });
  }, [checklist, clauseFilter, statusFilter, questionSearchQuery]);

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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {initialAudit ? `Edit Audit: ${initialAudit.auditCode}` : 'Conduct Audit'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {category === 'INTERNAL'
                  ? 'INTERNAL ISO 9001'
                  : category === 'EXTERNAL'
                  ? 'EXTERNAL'
                  : 'SUB-SUPPLIER'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              100-mark evaluation • 80-mark pass benchmark
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
            onClick={handleSaveAudit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Record</span>
          </button>
        </div>
      </div>

      {/* ─── 3 AUDIT TYPE SELECTOR TABS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setCategory('INTERNAL');
            setStandard('ISO 9001:2015 Quality Management System');
            setAuditorOrganization('Valiant Internal Quality Assurance Dept.');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            category === 'INTERNAL'
              ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-xl ${category === 'INTERNAL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Live ISO Feed
            </span>
          </div>
          <div className="font-bold text-slate-900 text-sm">Internal QMS Audit</div>
          <div className="text-xs text-slate-500 mt-0.5">
            ISO 9001:2015 checklist ({checklist.length} questions) with live scoring and multi-photo evidence.
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategory('EXTERNAL');
            setStandard('H&M / Buyer Technical & Quality Standard');
            setAuditorOrganization('SGS International / Buyer Technical Hub');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            category === 'EXTERNAL'
              ? 'bg-indigo-50/70 border-indigo-400 shadow-xs ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-xl ${category === 'EXTERNAL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Award className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              File & Score
            </span>
          </div>
          <div className="font-bold text-slate-900 text-sm">External & Buyer Audit</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Third-party certifications (SGS, BV, H&M) with score entry and report attachment.
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategory('SUB_SUPPLIER');
            setStandard('Sub-Supplier QMS & Facility Evaluation');
            setAuditorOrganization('Valiant Vendor Quality Division');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            category === 'SUB_SUPPLIER'
              ? 'bg-emerald-50/70 border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-xl ${category === 'SUB_SUPPLIER' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Vendor Score
            </span>
          </div>
          <div className="font-bold text-slate-900 text-sm">Sub-Supplier Audit</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Evaluate fabric mills and trims suppliers with rating and approval status.
          </div>
        </button>
      </div>

      {/* ─── GENERAL AUDIT SCOPE CARD ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Audit Information & Scope</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Audit Reference Code *</label>
            <input
              type="text"
              value={auditCode}
              onChange={(e) => setAuditCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. AUD-INT-ISO-2026"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Standard Audited *</label>
            <input
              type="text"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. ISO 9001:2015 QMS"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Lead Auditor Name *</label>
            <input
              type="text"
              value={auditorName}
              onChange={(e) => setAuditorName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Engr. Tareq Rahman"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Auditing Body / Agency</label>
            <input
              type="text"
              value={auditorOrganization}
              onChange={(e) => setAuditorOrganization(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. SGS Bangladesh / Valiant QA"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Audit Date</label>
            <input
              type="date"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Next Scheduled Re-Audit</label>
            <input
              type="date"
              value={nextAuditDate}
              onChange={(e) => setNextAuditDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {category === 'SUB_SUPPLIER' ? (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Sub-Supplier Name *</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Apex Spinning & Knitting"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Supplier Category</label>
                <select
                  value={supplierCategory}
                  onChange={(e) => setSupplierCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Fabric Mill (Knits & Woven)">Fabric Mill (Knits & Woven)</option>
                  <option value="Trims & Accessories (Zippers, Buttons)">Trims & Accessories (Zippers, Buttons)</option>
                  <option value="Dyeing & Finishing House">Dyeing & Finishing House</option>
                  <option value="Washing & Garment Dyeing">Washing & Garment Dyeing</option>
                  <option value="Embroidery & Printing Plant">Embroidery & Printing Plant</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Audited Department / Lines</label>
                <input
                  type="text"
                  value={auditeeDepartment}
                  onChange={(e) => setAuditeeDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Cutting, Sewing Line 01-12"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lead Auditee Representative</label>
                <input
                  type="text"
                  value={leadAuditee}
                  onChange={(e) => setLeadAuditee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Rafiqul Islam (QA Manager)"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── WORKFLOW A: INTERNAL AUDIT (CLEAN LIGHT EVALUATION SCORECARD) ──── */}
      {category === 'INTERNAL' && (
        <div className="space-y-6">
          {/* Light Evaluation Scoreboard Banner */}
          <div className="bg-gradient-to-br from-blue-50/70 via-white to-slate-50 rounded-2xl p-5 border border-blue-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  internalScoreResult.hasCriticalFail
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {internalScoreResult.hasCriticalFail ? (
                    <ShieldAlert className="w-8 h-8" />
                  ) : (
                    <ShieldCheck className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    ISO 9001:2015 Live Scoring Engine ({checklist.length} Questions)
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-3xl font-black font-mono text-slate-900">
                      {internalScoreResult.obtainedMarks}{' '}
                      <span className="text-sm font-normal text-slate-500">/ 100 Marks</span>
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wide border ${
                        internalScoreResult.hasCriticalFail
                          ? 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-400'
                          : internalScoreResult.isPassed
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {internalScoreResult.hasCriticalFail
                        ? 'AUDIT FAILED (CRITICAL NC FOUND)'
                        : internalScoreResult.isPassed
                        ? 'PASSED (≥80 MARKS)'
                        : 'FAILED (<80 MARKS)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress and Counters */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-[10px] uppercase text-emerald-700 font-bold">Conformity (100%)</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-emerald-800">
                    {internalScoreResult.conformityCount}
                  </div>
                </div>

                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-[10px] uppercase text-amber-700 font-bold">Minor NC (75%)</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-amber-800">
                    {internalScoreResult.minorNcCount}
                  </div>
                </div>

                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-[10px] uppercase text-orange-700 font-bold">Major NC (50%)</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-orange-800">
                    {internalScoreResult.majorNcCount}
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-xl border text-center shadow-2xs ${
                  internalScoreResult.criticalNcCount > 0
                    ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="text-[10px] uppercase text-rose-700 font-bold">Critical NC (0% Fail)</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-rose-800">
                    {internalScoreResult.criticalNcCount}
                  </div>
                </div>

                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">N/A Excluded</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-slate-700">
                    {internalScoreResult.naCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Failure Rule Banner */}
            {internalScoreResult.hasCriticalFail && (
              <div className="p-3.5 rounded-xl bg-rose-600 text-white flex items-center gap-3 shadow-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold uppercase tracking-wider block">
                    Critical Non-Conformance Detected — Audit Automatically Failed
                  </span>
                  <span>
                    {internalScoreResult.criticalNcCount} Critical Non-Conformance finding(s) detected. As per audit protocol, finding even 1 Critical NC automatically results in an immediate <strong>Audit Fail</strong> regardless of total marks earned ({internalScoreResult.obtainedMarks}/100).
                  </span>
                </div>
              </div>
            )}

            {/* Live Progress Bar */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex justify-between text-xs mb-1.5 text-slate-500 font-mono">
                <span>0 Marks</span>
                <span className="text-blue-700 font-bold">80 Marks Pass Benchmark</span>
                <span>100 Marks</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden relative">
                <div
                  className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-amber-500 z-10"
                  title="80% Pass Benchmark"
                />
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    internalScoreResult.hasCriticalFail
                      ? 'bg-rose-600'
                      : internalScoreResult.isPassed
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-600'
                      : 'bg-gradient-to-r from-rose-500 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, internalScoreResult.scorePercentage))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Toolbar: Search, Add Question, Import, and Clause Filter Navigation */}
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

              {/* Action Buttons: Add Custom Question, Bulk Import, Reset */}
              <div className="flex items-center gap-2 flex-wrap">
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
                  <span>Import / Upload Questions</span>
                </button>

                {checklist.length !== ISO_9001_DEFAULT_CHECKLIST.length && (
                  <button
                    type="button"
                    onClick={handleResetDefaultChecklist}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors cursor-pointer"
                    title="Reset to official 112 questions"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset (112)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Clause & Status Filters */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
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

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden"
                >
                  <option value="ALL">All Findings ({checklist.length})</option>
                  <option value="CONFORMITY">Conformity (100%)</option>
                  <option value="MINOR_NC">Minor NC (75%)</option>
                  <option value="MAJOR_NC">Major NC (50%)</option>
                  <option value="CRITICAL_NC">Critical NC (0% Fail)</option>
                  <option value="NA">N/A (Excluded)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Questions List (Memoized without lag) */}
          <div className="space-y-4">
            {filteredChecklist.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No questions match the selected filter.
              </div>
            ) : (
              filteredChecklist.map((item) => (
                <QuestionCard
                  key={item.id}
                  item={item}
                  onStatusChange={handleQuestionStatusChange}
                  onRemarkChange={handleQuestionRemarkChange}
                  onPhotosUpload={handleMultiplePhotosUpload}
                  onRemovePhoto={handleRemovePhoto}
                  onPreviewPhoto={(url) => setSelectedPhotoPreview(url)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── WORKFLOW B: EXTERNAL AUDIT ────────────────────────────────────── */}
      {category === 'EXTERNAL' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>External Certification & Buyer Evaluation</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record score, non-conformances, and attach official third-party audit report.
              </p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                criticalNCs > 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200 ring-1 ring-rose-400'
                  : externalScore >= 80
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {criticalNCs > 0
                  ? 'RESULT: FAILED (CRITICAL NC FOUND)'
                  : externalScore >= 80
                  ? 'RESULT: PASS (≥80)'
                  : 'RESULT: FAIL (<80)'}
              </span>
            </div>
          </div>

          {/* Score & NC Entry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Overall Score (0–100) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={externalScore}
                  onChange={(e) => setExternalScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xl font-bold font-mono text-blue-700 rounded-xl border border-slate-200 bg-white focus:outline-hidden"
                />
                <span className="text-xs font-bold text-slate-400">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">Pass benchmark: 80 marks.</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200">
              <label className="text-xs font-bold text-rose-800 block mb-1">
                Critical NCs (Auto Fail)
              </label>
              <input
                type="number"
                min="0"
                value={criticalNCs}
                onChange={(e) => setCriticalNCs(Number(e.target.value))}
                className="w-full px-3 py-2 text-xl font-bold font-mono text-rose-700 rounded-xl border border-rose-300 bg-white focus:outline-hidden"
              />
              <span className="text-[10px] text-rose-600 block mt-1">1 Critical = Immediate Fail.</span>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200">
              <label className="text-xs font-bold text-orange-800 block mb-1">
                Major Non-Conformances
              </label>
              <input
                type="number"
                min="0"
                value={majorNCs}
                onChange={(e) => setMajorNCs(Number(e.target.value))}
                className="w-full px-3 py-2 text-xl font-bold font-mono text-orange-700 rounded-xl border border-orange-300 bg-white focus:outline-hidden"
              />
              <span className="text-[10px] text-orange-600 block mt-1">50% mark weighting.</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200">
              <label className="text-xs font-bold text-amber-800 block mb-1">
                Minor Non-Conformances
              </label>
              <input
                type="number"
                min="0"
                value={minorNCs}
                onChange={(e) => setMinorNCs(Number(e.target.value))}
                className="w-full px-3 py-2 text-xl font-bold font-mono text-amber-700 rounded-xl border border-amber-300 bg-white focus:outline-hidden"
              />
              <span className="text-[10px] text-amber-600 block mt-1">75% mark weighting.</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Observations
              </label>
              <input
                type="number"
                min="0"
                value={observations}
                onChange={(e) => setObservations(Number(e.target.value))}
                className="w-full px-3 py-2 text-xl font-bold font-mono text-slate-700 rounded-xl border border-slate-200 bg-white focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Recommendations.</span>
            </div>
          </div>

          {/* Audit Report File Upload */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 block">
              Official Audit Report File Upload
            </label>

            <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer text-center">
              <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Click to browse or drag and drop official Audit Report (PDF / Image)
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                PDF, JPG, PNG files supported
              </span>
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleReportFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 block">Attached Documents ({uploadedFiles.length})</span>
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="font-bold text-slate-900 block">{file.fileName}</span>
                        <span className="text-slate-500 text-[11px]">
                          {file.fileSize} • Uploaded {file.uploadDate}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReportFile(file.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Executive Summary & Findings
            </label>
            <textarea
              rows={3}
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              placeholder="Summary of external auditor comments and findings..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}

      {/* ─── WORKFLOW C: SUB-SUPPLIER AUDIT ────────────────────────────────── */}
      {category === 'SUB_SUPPLIER' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Sub-Supplier Quality Evaluation</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluate fabric knitting, dyeing, and trim vendor manufacturing capability.
              </p>
            </div>
            <div>
              <select
                value={approvalStatus}
                onChange={(e: any) => setApprovalStatus(e.target.value)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                  approvalStatus === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : approvalStatus === 'CONDITIONAL'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                <option value="APPROVED">STATUS: APPROVED (TIER-1)</option>
                <option value="CONDITIONAL">STATUS: CONDITIONAL</option>
                <option value="PENDING">STATUS: PENDING</option>
                <option value="REJECTED">STATUS: DISQUALIFIED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Vendor Audit Score (0–100) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={externalScore}
                  onChange={(e) => setExternalScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xl font-bold font-mono text-emerald-700 rounded-xl border border-slate-200 bg-white"
                />
                <span className="text-xs font-bold text-slate-400">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">Passing requirement: 80 marks.</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200">
              <label className="text-xs font-bold text-rose-800 block mb-1">
                Critical NCs (Fail Rule)
              </label>
              <input
                type="number"
                min="0"
                value={criticalNCs}
                onChange={(e) => setCriticalNCs(Number(e.target.value))}
                className="w-full px-3 py-2 text-xl font-bold font-mono text-rose-700 rounded-xl border border-rose-300 bg-white"
              />
              <span className="text-[10px] text-rose-600 block mt-1">Disqualifying findings.</span>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200">
              <label className="text-xs font-bold text-orange-800 block mb-1">
                Major Non-Conformances
              </label>
              <input
                type="number"
                min="0"
                value={majorNCs}
                onChange={(e) => setMajorNCs(Number(e.target.value))}
                className="w-full px-3 py-2 text-xl font-bold font-mono text-orange-700 rounded-xl border border-orange-300 bg-white"
              />
              <span className="text-[10px] text-orange-600 block mt-1">Critical findings.</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200">
              <label className="text-xs font-bold text-amber-800 block mb-1">
                Minor Observations / NCs
              </label>
              <input
                type="number"
                min="0"
                value={minorNCs}
                onChange={(e) => setMinorNCs(Number(e.target.value))}
                className="w-full px-3 py-2 text-xl font-bold font-mono text-amber-700 rounded-xl border border-amber-300 bg-white"
              />
              <span className="text-[10px] text-amber-600 block mt-1">Advisory items.</span>
            </div>
          </div>

          {/* Supplier Report Upload */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 block">
              Supplier Evaluation Report Upload
            </label>
            <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer text-center">
              <Upload className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-xs font-bold text-slate-800">
                Attach Supplier Evaluation PDF or Verification Photos
              </span>
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleReportFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-900 block">{file.fileName}</span>
                        <span className="text-slate-500 text-[11px]">{file.fileSize} • {file.uploadDate}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReportFile(file.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Assessment Summary
            </label>
            <textarea
              rows={3}
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              placeholder="Record evaluation summary of supplier quality and process controls..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}

      {/* ─── BOTTOM SUBMISSION BAR ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs text-slate-500">
          Ready to save audit record to the registry.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAudit}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save & Complete Audit</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Question Evidence Photos */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              type="button"
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhotoPreview}
              alt="Enlarged Evidence"
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
