'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  GitPullRequest,
  AlertTriangle,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  FileText,
  Plus,
  Trash2,
  HelpCircle,
  Clock,
  Layers,
  Sparkles,
  Paperclip,
  Check,
  X,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Info,
  Search,
  Upload,
  Copy,
  Sliders,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  CapaItem,
  CapaSource,
  CapaSeverity,
  CapaStatus,
  CapaFiveWhys,
  CapaFishboneFactors,
  CapaEvidenceImage,
  CapaIssueItem,
} from '@/lib/types/modules';
import {
  CAPA_ISSUE_PRESETS,
  CORRECTIVE_ACTION_CHIPS,
  PREVENTIVE_ACTION_CHIPS,
  INDUSTRY_EVIDENCE_PHOTOS,
  createBlankIssue,
  createIssueFromPreset,
  CapaIssuePreset,
} from '@/lib/data/capaIssuePresets';

interface CapaEntryPageProps {
  initialCapa?: CapaItem | null;
  onBack: () => void;
  onSave: (capa: CapaItem) => void;
  showToast: (msg: string) => void;
}

const DEPARTMENTS_LIST = [
  'Cutting',
  'Sewing Line 01',
  'Sewing Line 04',
  'Sewing Line 08',
  'Sewing Line 12',
  'Finishing & Packaging',
  'QA/QC Physical Lab',
  'Washing & Dyeing Plant',
  'Warehouse & Storage',
  'Maintenance & Tooling',
  'Sample Development Room',
  'Merchandising & Supply Chain',
];

const ISSUE_CATEGORIES = [
  { value: 'SEWING', label: 'Sewing & Stitching' },
  { value: 'FABRIC', label: 'Fabric & Color Shading' },
  { value: 'NEEDLE_SAFETY', label: 'Needle Safety & Metal Control' },
  { value: 'TRIMS', label: 'Trims, Zippers & Hardware' },
  { value: 'MEASUREMENT', label: 'Measurement & Tolerance' },
  { value: 'FINISHING', label: 'Finishing & Packaging' },
  { value: 'STAIN_SOIL', label: 'Stains, Oil & Soil' },
  { value: 'SOP_COMPLIANCE', label: 'SOP & Quality Compliance' },
  { value: 'OTHER', label: 'Other Operational Finding' },
];

export function CapaEntryPage({
  initialCapa,
  onBack,
  onSave,
  showToast,
}: CapaEntryPageProps) {
  const isEdit = Boolean(initialCapa);

  // 1. Basic Metadata
  const [capaNumber, setCapaNumber] = useState<string>(
    initialCapa?.capaNumber || `CAPA-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [dateRaised, setDateRaised] = useState<string>(
    initialCapa?.dateRaised || new Date().toISOString().split('T')[0]
  );
  const [source, setSource] = useState<CapaSource>(initialCapa?.source || 'INTERNAL_AUDIT');
  const [sourceReference, setSourceReference] = useState<string>(
    initialCapa?.sourceReference || ''
  );
  const [severity, setSeverity] = useState<CapaSeverity>(initialCapa?.severity || 'MAJOR');
  const [department, setDepartment] = useState<string>(
    initialCapa?.department || 'Sewing Line 04'
  );
  const [processStage, setProcessStage] = useState<string>(
    initialCapa?.processStage || 'Assembly Stitching'
  );
  const [responsiblePerson, setResponsiblePerson] = useState<string>(
    initialCapa?.responsiblePerson || ''
  );
  const [raisedBy, setRaisedBy] = useState<string>(
    initialCapa?.raisedBy || 'Internal QA Auditor'
  );
  const [status, setStatus] = useState<CapaStatus>(initialCapa?.status || 'OPEN');

  // 2. Multi-Issue Management State
  const initialIssues: CapaIssueItem[] =
    initialCapa?.issues && initialCapa.issues.length > 0
      ? initialCapa.issues
      : initialCapa?.issueTitle
      ? [
          {
            id: `issue-1-${Date.now()}`,
            issueTitle: initialCapa.issueTitle,
            category: 'SEWING',
            severity: initialCapa.severity || 'MAJOR',
            department: initialCapa.department,
            processStage: initialCapa.processStage,
            description: initialCapa.problemDescription || '',
            correctiveAction: initialCapa.correctiveAction || '',
            preventiveAction: initialCapa.preventiveAction || '',
            evidenceImage: initialCapa.rcaEvidenceImages?.[0]?.url || '',
            evidenceCaption: initialCapa.rcaEvidenceImages?.[0]?.caption || '',
            status: initialCapa.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
            responsiblePerson: initialCapa.responsiblePerson,
            targetDate: initialCapa.targetCompletionDate,
          },
        ]
      : [createIssueFromPreset(CAPA_ISSUE_PRESETS[0])];

  const [issues, setIssues] = useState<CapaIssueItem[]>(initialIssues);
  const [expandedIssueIds, setExpandedIssueIds] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    initialIssues.forEach((issue) => {
      initialMap[issue.id] = true;
    });
    return initialMap;
  });

  // Preset Chooser Modal State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [targetIssueIndexForPreset, setTargetIssueIndexForPreset] = useState<number | null>(null);
  const [presetSearch, setPresetSearch] = useState<string>('');
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>('ALL');

  // Photo Gallery Quick Picker Modal State
  const [photoPickerTargetIndex, setPhotoPickerTargetIndex] = useState<number | null>(null);

  // Overall Problem Statement (5W2H)
  const [problemStatement, setProblemStatement] = useState<string>(
    initialCapa?.problemStatement || ''
  );

  // 3. Containment Action (D3)
  const [containmentAction, setContainmentAction] = useState<string>(
    initialCapa?.containmentAction || ''
  );
  const [containmentDate, setContainmentDate] = useState<string>(
    initialCapa?.containmentDate || new Date().toISOString().split('T')[0]
  );
  const [containmentOwner, setContainmentOwner] = useState<string>(
    initialCapa?.containmentOwner || ''
  );

  // 4. Root Cause Analysis (D4) - 5 Whys
  const [fiveWhys, setFiveWhys] = useState<CapaFiveWhys>(
    initialCapa?.fiveWhys || {
      why1: '',
      why2: '',
      why3: '',
      why4: '',
      why5: '',
      rootCauseConclusion: '',
    }
  );

  // 4b. Fishbone / Ishikawa (6Ms)
  const [fishbone, setFishbone] = useState<CapaFishboneFactors>(
    initialCapa?.fishboneFactors || {
      man: [],
      machine: [],
      material: [],
      method: [],
      measurement: [],
      milieu: [],
    }
  );
  const [newFishboneInput, setNewFishboneInput] = useState<{
    category: keyof CapaFishboneFactors;
    value: string;
  }>({
    category: 'man',
    value: '',
  });

  const [rootCause, setRootCause] = useState<string>(initialCapa?.rootCause || '');
  const [rcaSupportingEvidence, setRcaSupportingEvidence] = useState<string>(
    initialCapa?.rcaSupportingEvidence || ''
  );

  // Additional Evidence Photos
  const [evidenceImages, setEvidenceImages] = useState<CapaEvidenceImage[]>(
    initialCapa?.rcaEvidenceImages || []
  );
  const [completionImages, setCompletionImages] = useState<CapaEvidenceImage[]>(
    initialCapa?.completionEvidenceImages || []
  );

  // Target & Actual Completion Dates
  const [targetCompletionDate, setTargetCompletionDate] = useState<string>(
    initialCapa?.targetCompletionDate ||
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [actualCompletionDate, setActualCompletionDate] = useState<string>(
    initialCapa?.actualCompletionDate || ''
  );

  // 6. Preventive Action & SOP Controls (D7)
  const [sopUpdateRequired, setSopUpdateRequired] = useState<boolean>(
    initialCapa?.sopUpdateRequired || false
  );
  const [sopReference, setSopReference] = useState<string>(
    initialCapa?.sopReference || ''
  );
  const [trainingRequired, setTrainingRequired] = useState<boolean>(
    initialCapa?.trainingRequired || false
  );
  const [trainingDetails, setTrainingDetails] = useState<string>(
    initialCapa?.trainingDetails || ''
  );

  // 7. Verification & Sign-off (D8)
  const [effectivenessVerified, setEffectivenessVerified] = useState<boolean>(
    initialCapa?.effectivenessVerified || false
  );
  const [verificationNotes, setVerificationNotes] = useState<string>(
    initialCapa?.verificationNotes || ''
  );
  const [verifiedBy, setVerifiedBy] = useState<string>(initialCapa?.verifiedBy || '');
  const [verificationDate, setVerificationDate] = useState<string>(
    initialCapa?.verificationDate || ''
  );
  const [effectivenessRating, setEffectivenessRating] = useState<
    'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE' | 'PENDING'
  >(initialCapa?.effectivenessRating || 'PENDING');

  // Custom photo upload for Section 7
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [customPhotoCaption, setCustomPhotoCaption] = useState<string>('');
  const [photoTargetSection, setPhotoTargetSection] = useState<'rca' | 'completion'>('rca');

  // Hidden file inputs for local image upload
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // ────────────────── ISSUE MANAGEMENT HANDLERS ────────────────── //

  const handleAddBlankIssue = () => {
    const newIssue = createBlankIssue(issues.length + 1);
    newIssue.responsiblePerson = responsiblePerson;
    newIssue.targetDate = targetCompletionDate;
    setIssues((prev) => [...prev, newIssue]);
    setExpandedIssueIds((prev) => ({ ...prev, [newIssue.id]: true }));
    showToast(`Added Issue #${issues.length + 1}`);
  };

  const handleOpenPresetModalForNew = () => {
    setTargetIssueIndexForPreset(null);
    setPresetSearch('');
    setPresetCategoryFilter('ALL');
    setIsPresetModalOpen(true);
  };

  const handleOpenPresetModalForExisting = (idx: number) => {
    setTargetIssueIndexForPreset(idx);
    setPresetSearch('');
    setPresetCategoryFilter('ALL');
    setIsPresetModalOpen(true);
  };

  const handleSelectPreset = (preset: CapaIssuePreset) => {
    if (targetIssueIndexForPreset === null) {
      // Append as new issue
      const newIssue = createIssueFromPreset(preset);
      newIssue.responsiblePerson = responsiblePerson || newIssue.responsiblePerson;
      newIssue.targetDate = targetCompletionDate || newIssue.targetDate;
      setIssues((prev) => [...prev, newIssue]);
      setExpandedIssueIds((prev) => ({ ...prev, [newIssue.id]: true }));
      showToast(`Added: ${preset.issueTitle}`);
    } else {
      // Replace existing issue
      const targetIdx = targetIssueIndexForPreset;
      setIssues((prev) => {
        const next = [...prev];
        const existingId = next[targetIdx].id;
        next[targetIdx] = {
          ...createIssueFromPreset(preset),
          id: existingId,
          responsiblePerson: next[targetIdx].responsiblePerson || responsiblePerson,
          targetDate: next[targetIdx].targetDate || targetCompletionDate,
        };
        return next;
      });
      showToast(`Updated Issue #${targetIdx + 1} from preset`);
    }
    setIsPresetModalOpen(false);
  };

  const handleDuplicateIssue = (idx: number) => {
    const sourceIssue = issues[idx];
    const cloned: CapaIssueItem = {
      ...sourceIssue,
      id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      issueTitle: `${sourceIssue.issueTitle} (Copy)`,
    };
    setIssues((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, cloned);
      return next;
    });
    setExpandedIssueIds((prev) => ({ ...prev, [cloned.id]: true }));
    showToast(`Duplicated Issue #${idx + 1}`);
  };

  const handleRemoveIssue = (idx: number) => {
    if (issues.length <= 1) {
      showToast('A CAPA record must have at least one registered issue.');
      return;
    }
    const issueToRemove = issues[idx];
    setIssues((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIssueIds((prev) => {
      const copy = { ...prev };
      delete copy[issueToRemove.id];
      return copy;
    });
    showToast(`Removed Issue #${idx + 1}`);
  };

  const handleUpdateIssueField = (idx: number, field: keyof CapaIssueItem, value: any) => {
    setIssues((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleToggleExpand = (id: string) => {
    setExpandedIssueIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Clickable Suggestion Chips for Issue Actions
  const handleApplyCorrectiveChip = (idx: number, chipText: string) => {
    setIssues((prev) => {
      const next = [...prev];
      const cur = (next[idx].correctiveAction || '').trim();
      next[idx] = {
        ...next[idx],
        correctiveAction: cur ? `${cur}. ${chipText}.` : `${chipText}.`,
      };
      return next;
    });
    showToast('Applied corrective action chip');
  };

  const handleApplyPreventiveChip = (idx: number, chipText: string) => {
    setIssues((prev) => {
      const next = [...prev];
      const cur = (next[idx].preventiveAction || '').trim();
      next[idx] = {
        ...next[idx],
        preventiveAction: cur ? `${cur}. ${chipText}.` : `${chipText}.`,
      };
      return next;
    });
    showToast('Applied preventive action chip');
  };

  // Image Upload File Handler for Issue
  const handleIssueFileUpload = (idx: number, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setIssues((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            evidenceImage: dataUrl,
            evidenceCaption: next[idx].evidenceCaption || file.name,
          };
          return next;
        });
        showToast(`Uploaded evidence photo for Issue #${idx + 1}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetPhotoForIssue = (idx: number, url: string, caption: string) => {
    setIssues((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        evidenceImage: url,
        evidenceCaption: caption,
      };
      return next;
    });
    setPhotoPickerTargetIndex(null);
    showToast(`Attached preset photo to Issue #${idx + 1}`);
  };

  const handleRemoveIssuePhoto = (idx: number) => {
    setIssues((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        evidenceImage: '',
        evidenceCaption: '',
      };
      return next;
    });
    showToast(`Removed photo from Issue #${idx + 1}`);
  };

  // Fishbone item handler
  const handleAddFishboneFactor = () => {
    if (!newFishboneInput.value.trim()) return;
    const cat = newFishboneInput.category;
    setFishbone((prev) => ({
      ...prev,
      [cat]: [...(prev[cat] || []), newFishboneInput.value.trim()],
    }));
    setNewFishboneInput((prev) => ({ ...prev, value: '' }));
  };

  const handleRemoveFishboneFactor = (cat: keyof CapaFishboneFactors, idx: number) => {
    setFishbone((prev) => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== idx),
    }));
  };

  // Add general evidence photo
  const handleAddEvidencePhoto = (url: string, caption: string, target: 'rca' | 'completion') => {
    const newPhoto: CapaEvidenceImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url,
      caption,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: target === 'rca' ? 'ROOT_CAUSE' : 'COMPLETION',
    };
    if (target === 'rca') {
      setEvidenceImages((prev) => [...prev, newPhoto]);
    } else {
      setCompletionImages((prev) => [...prev, newPhoto]);
    }
    showToast(`Added ${target === 'rca' ? 'RCA' : 'Completion'} photo evidence`);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (issues.length === 0 || !issues[0].issueTitle.trim()) {
      showToast('Please register at least one issue with a valid title');
      return;
    }

    if (!responsiblePerson.trim()) {
      showToast('Please specify a responsible lead for the CAPA record');
      return;
    }

    // Determine top-level primary fields for backward compatibility
    const primaryIssue = issues[0];
    const compiledIssueTitle =
      issues.length === 1
        ? primaryIssue.issueTitle.trim()
        : `${primaryIssue.issueTitle.trim()} (+${issues.length - 1} more registered issues)`;

    const compiledProblemDescription = issues
      .map((iss, i) =>
        issues.length > 1
          ? `[Issue #${i + 1}: ${iss.issueTitle}] ${iss.description || 'No detailed observation provided.'}`
          : iss.description || ''
      )
      .filter(Boolean)
      .join('\n\n');

    const compiledCorrectiveAction = issues
      .map((iss, i) =>
        issues.length > 1
          ? `[Issue #${i + 1}] ${iss.correctiveAction || 'Immediate containment and adjustment.'}`
          : iss.correctiveAction
      )
      .filter(Boolean)
      .join('\n\n');

    const compiledPreventiveAction = issues
      .map((iss, i) =>
        issues.length > 1
          ? `[Issue #${i + 1}] ${iss.preventiveAction || 'Standardized procedure update.'}`
          : iss.preventiveAction
      )
      .filter(Boolean)
      .join('\n\n');

    // Aggregate any issue evidence photos into rcaEvidenceImages if not already present
    const issueEvidenceImages: CapaEvidenceImage[] = issues
      .filter((iss) => Boolean(iss.evidenceImage))
      .map((iss, idx) => ({
        id: `img-issue-${iss.id || idx}`,
        url: iss.evidenceImage!,
        caption: `[Issue #${idx + 1}] ${iss.issueTitle}: ${iss.evidenceCaption || 'Evidence photo'}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'ROOT_CAUSE' as const,
      }));

    const combinedRcaImages = [...evidenceImages];
    issueEvidenceImages.forEach((img) => {
      if (!combinedRcaImages.some((existing) => existing.url === img.url)) {
        combinedRcaImages.unshift(img);
      }
    });

    const compiledRootCause =
      rootCause.trim() ||
      fiveWhys.rootCauseConclusion ||
      fiveWhys.why5 ||
      fiveWhys.why1 ||
      `Root cause analysis for ${issues.length} registered issues.`;

    const payload: CapaItem = {
      id: initialCapa?.id || `capa-${Date.now()}`,
      capaNumber,
      dateRaised,
      source,
      sourceReference: sourceReference.trim() || undefined,
      severity,
      department,
      processStage,
      issueTitle: compiledIssueTitle,
      problemDescription: compiledProblemDescription || undefined,
      problemStatement: problemStatement.trim() || undefined,
      issues, // Complete structured multi-issue list!
      rootCause: compiledRootCause,
      fiveWhys,
      fishboneFactors: fishbone,
      rcaSupportingEvidence: rcaSupportingEvidence.trim() || undefined,
      rcaEvidenceImages: combinedRcaImages,
      containmentAction:
        containmentAction.trim() ||
        'Immediate containment, lot segregation, and 100% sorting completed.',
      containmentDate,
      containmentOwner: containmentOwner.trim() || responsiblePerson,
      correctiveAction: compiledCorrectiveAction || 'Permanent corrective actions deployed.',
      preventiveAction: compiledPreventiveAction || 'Standardized preventive controls deployed.',
      sopUpdateRequired,
      sopReference: sopReference.trim() || undefined,
      trainingRequired,
      trainingDetails: trainingDetails.trim() || undefined,
      responsiblePerson: responsiblePerson.trim(),
      raisedBy: raisedBy.trim() || undefined,
      targetCompletionDate,
      actualCompletionDate: actualCompletionDate.trim() || undefined,
      status,
      effectivenessVerified,
      verificationNotes: verificationNotes.trim() || undefined,
      verifiedBy: verifiedBy.trim() || undefined,
      verificationDate: verificationDate.trim() || undefined,
      effectivenessRating,
      completionEvidenceImages: completionImages,
    };

    onSave(payload);
  };

  // Filtered Presets for the Preset Chooser Modal
  const filteredPresets = CAPA_ISSUE_PRESETS.filter((preset) => {
    const matchesCat = presetCategoryFilter === 'ALL' || preset.category === presetCategoryFilter;
    const query = presetSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      preset.issueTitle.toLowerCase().includes(query) ||
      preset.category.toLowerCase().includes(query) ||
      preset.description.toLowerCase().includes(query) ||
      preset.tags.some((t) => t.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* ─── TOP HEADER (Non-Sticky, Solid Background) ────────────────────── */}
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
                {isEdit ? `Edit Record: ${capaNumber}` : 'Raise / Issue New CAPA'}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  severity === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : severity === 'MAJOR'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {severity} SEVERITY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'} Registered
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {source.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              8D Problem Solving Methodology • Multi-Issue CAPA Register • ISO 9001:2015 Clause 10.2
            </p>
          </div>
        </div>

        {/* Action Buttons */}
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
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEdit ? 'Save Changes' : 'Issue CAPA Plan'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── SECTION 1: ORIGIN & CONTEXT ───────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. CAPA Origin & Basic Information</h3>
              <p className="text-[11px] text-slate-500">
                Reference ID, detection date, non-conformance trigger, and location
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                CAPA Ref Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={capaNumber}
                onChange={(e) => setCapaNumber(e.target.value)}
                placeholder="e.g. CAPA-2026-045"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date Raised <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateRaised}
                onChange={(e) => setDateRaised(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Source Trigger <span className="text-rose-500">*</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as CapaSource)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="INTERNAL_AUDIT">Internal Audit (ISO 9001)</option>
                <option value="CUSTOMER_COMPLAINT">Customer / Buyer Complaint</option>
                <option value="NCR">NCR (Non-Conformance Report)</option>
                <option value="SUPPLIER">Sub-Supplier Evaluation</option>
                <option value="QUALITY_INSPECTION">Quality Inspection (AQL / Inward)</option>
                <option value="PROCESS_AUDIT">Process / In-Line Audit</option>
                <option value="LINE_REJECTION">Sewing / Finishing Line Rejection</option>
                <option value="MANAGEMENT_REVIEW">Management Review Finding</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Source Document Reference
              </label>
              <input
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="e.g. AUD-INT-2026-09, CLM-089"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Overall Severity Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as CapaSeverity)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="CRITICAL">CRITICAL (Immediate Stop / Safety / Recall)</option>
                <option value="MAJOR">MAJOR (AQL Failure / Function / Buyer Claim)</option>
                <option value="MINOR">MINOR (Cosmetic / Low Recurrence / Procedural)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department / Unit <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {DEPARTMENTS_LIST.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Process / Operation Stage
              </label>
              <input
                type="text"
                value={processStage}
                onChange={(e) => setProcessStage(e.target.value)}
                placeholder="e.g. Assembly Stitching, Spreading"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Responsible Action Lead <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                placeholder="e.g. Devon Vance (QA Lead)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: REGISTERED ISSUES & ACTION MATRIX (MULTIPLE ISSUES) ─── */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-5 ring-1 ring-blue-100">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">
                    2. Registered Issues & Resolution Matrix (Multiple Issues per Record)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Register all non-conformances in this record with selectable standard presets, dedicated corrective actions, preventive actions, and photographic evidence.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons for Issues */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleOpenPresetModalForNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                title="Select from pre-configured factory quality issues"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Select from Presets</span>
              </button>

              <button
                type="button"
                onClick={handleAddBlankIssue}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Custom Issue</span>
              </button>
            </div>
          </div>

          {/* List of Registered Issues */}
          <div className="space-y-4">
            {issues.map((issue, idx) => {
              const isExpanded = expandedIssueIds[issue.id] ?? true;

              return (
                <div
                  key={issue.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:border-blue-300 transition-all"
                >
                  {/* Issue Header Bar */}
                  <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/80 border-b border-slate-200">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        #{idx + 1}
                      </span>

                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-bold text-xs text-slate-900 truncate max-w-[280px] sm:max-w-md">
                          {issue.issueTitle || `Untitled Issue #${idx + 1}`}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            issue.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : issue.severity === 'MAJOR'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {issue.severity || 'MAJOR'}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 text-slate-700">
                          {issue.category || 'SEWING'}
                        </span>

                        {issue.evidenceImage && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                            <ImageIcon className="w-3 h-3" />
                            <span>Photo Attached</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Issue Control Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Quick Preset Selector for this Issue */}
                      <select
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const found = CAPA_ISSUE_PRESETS.find((p) => p.id === e.target.value);
                          if (found) {
                            handleSelectPreset(found);
                          }
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="hidden sm:block text-[11px] px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold cursor-pointer hover:border-blue-400"
                        title="Pick preset to replace this issue"
                      >
                        <option value="" disabled>
                          Select Preset...
                        </option>
                        {CAPA_ISSUE_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.issueTitle.substring(0, 45)}...
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDuplicateIssue(idx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title="Duplicate this issue"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveIssue(idx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove this issue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleExpand(issue.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Issue Form Body (Collapsible) */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 text-xs">
                      {/* Row 1: Issue Title & Category & Severity */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-7">
                          <label className="block font-semibold text-slate-700 mb-1">
                            Issue Title / Defect Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={issue.issueTitle}
                            onChange={(e) =>
                              handleUpdateIssueField(idx, 'issueTitle', e.target.value)
                            }
                            placeholder="e.g. Needle Control Log Register missing morning shift sign-off"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block font-semibold text-slate-700 mb-1">
                            Category / Defect Group
                          </label>
                          <select
                            value={issue.category || 'SEWING'}
                            onChange={(e) =>
                              handleUpdateIssueField(idx, 'category', e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            {ISSUE_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-slate-700 mb-1">
                            Severity Level
                          </label>
                          <select
                            value={issue.severity || 'MAJOR'}
                            onChange={(e) =>
                              handleUpdateIssueField(idx, 'severity', e.target.value as CapaSeverity)
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="CRITICAL">CRITICAL</option>
                            <option value="MAJOR">MAJOR</option>
                            <option value="MINOR">MINOR</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Problem Description */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Detailed Problem Observation & Scope</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Specific location, bundle number, or defect quantities
                          </span>
                        </label>
                        <textarea
                          rows={2}
                          value={issue.description || ''}
                          onChange={(e) =>
                            handleUpdateIssueField(idx, 'description', e.target.value)
                          }
                          placeholder="Describe specific finding, location, defect symptoms, or inspection findings..."
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </div>

                      {/* Row 3: Corrective & Preventive Action Columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Corrective Action Box */}
                        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-emerald-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Corrective Action for this Issue</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-emerald-700 font-medium">
                              Immediate fix / quarantine
                            </span>
                          </div>

                          <textarea
                            rows={3}
                            required
                            value={issue.correctiveAction}
                            onChange={(e) =>
                              handleUpdateIssueField(idx, 'correctiveAction', e.target.value)
                            }
                            placeholder="Enter immediate actions taken to contain, segregate, and correct this specific problem..."
                            className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-200 text-slate-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                          />

                          {/* Quick Chips for Corrective Action */}
                          <div>
                            <span className="text-[10px] font-bold text-emerald-800 block mb-1">
                              Quick Select Suggestion:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {CORRECTIVE_ACTION_CHIPS.slice(0, 4).map((chip, cIdx) => (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() => handleApplyCorrectiveChip(idx, chip)}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer text-left truncate max-w-[200px]"
                                  title={chip}
                                >
                                  + {chip}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Preventive Action Box */}
                        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-blue-900 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Preventive Action for this Issue</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-blue-700 font-medium">
                              Prevent recurrence / SOP
                            </span>
                          </div>

                          <textarea
                            rows={3}
                            required
                            value={issue.preventiveAction}
                            onChange={(e) =>
                              handleUpdateIssueField(idx, 'preventiveAction', e.target.value)
                            }
                            placeholder="Enter systemic actions, SOP changes, tool upgrades, or training to eliminate recurrence..."
                            className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-slate-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                          />

                          {/* Quick Chips for Preventive Action */}
                          <div>
                            <span className="text-[10px] font-bold text-blue-800 block mb-1">
                              Quick Select Suggestion:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {PREVENTIVE_ACTION_CHIPS.slice(0, 4).map((chip, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => handleApplyPreventiveChip(idx, chip)}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 transition-colors cursor-pointer text-left truncate max-w-[200px]"
                                  title={chip}
                                >
                                  + {chip}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 4: Evidence Photo Panel for this Specific Issue */}
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-purple-600" />
                            <span>Issue Photographic Evidence</span>
                          </label>
                          <span className="text-[10px] text-slate-500">
                            Upload file, select factory preset photo, or paste URL
                          </span>
                        </div>

                        {issue.evidenceImage ? (
                          /* Photo Attached Preview */
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <img
                                src={issue.evidenceImage}
                                alt={issue.evidenceCaption || 'Issue Evidence'}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 space-y-1.5 min-w-0">
                              <label className="block text-[11px] font-semibold text-slate-700">
                                Photo Caption / Annotation
                              </label>
                              <input
                                type="text"
                                value={issue.evidenceCaption || ''}
                                onChange={(e) =>
                                  handleUpdateIssueField(idx, 'evidenceCaption', e.target.value)
                                }
                                placeholder="e.g. Broken needle fragment extracted from seam"
                                className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                              />
                              <div className="flex items-center gap-2 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[issue.id]?.click()}
                                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                                >
                                  Replace Photo
                                </button>
                                <span className="text-slate-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIssuePhoto(idx)}
                                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                                >
                                  Remove Photo
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* No Photo: Direct Easy Input Choices */
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Option 1: File Upload */}
                            <div
                              onClick={() => fileInputRefs.current[issue.id]?.click()}
                              className="p-3 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-blue-50/50 hover:border-blue-400 transition-colors cursor-pointer text-center flex flex-col items-center justify-center gap-1 group"
                            >
                              <Upload className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                              <span className="font-bold text-slate-800 text-xs">
                                Upload Photo File
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Click to select image from PC
                              </span>
                            </div>

                            {/* Option 2: Select from Factory Gallery */}
                            <div
                              onClick={() => setPhotoPickerTargetIndex(idx)}
                              className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-purple-50/50 hover:border-purple-300 transition-colors cursor-pointer text-center flex flex-col items-center justify-center gap-1 group"
                            >
                              <ImageIcon className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                              <span className="font-bold text-slate-800 text-xs">
                                Pick from Gallery
                              </span>
                              <span className="text-[10px] text-slate-400">
                                8 factory defect photo presets
                              </span>
                            </div>

                            {/* Option 3: Paste URL */}
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-center gap-1">
                              <span className="font-semibold text-slate-700 text-[11px]">
                                Paste Image URL:
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="https://..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = (e.target as HTMLInputElement).value.trim();
                                      if (val) {
                                        handleUpdateIssueField(idx, 'evidenceImage', val);
                                      }
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val) {
                                      handleUpdateIssueField(idx, 'evidenceImage', val);
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 focus:outline-hidden"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Hidden native file input for this issue */}
                        <input
                          ref={(el) => {
                            fileInputRefs.current[issue.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleIssueFileUpload(idx, file);
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>

                      {/* Row 5: Per-Issue Status, Lead, and Target Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Issue Status
                          </label>
                          <select
                            value={issue.status || 'OPEN'}
                            onChange={(e) =>
                              handleUpdateIssueField(idx, 'status', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden cursor-pointer text-xs"
                          >
                            <option value="OPEN">Open (Action Pending)</option>
                            <option value="IN_PROGRESS">In Progress (Action Deployed)</option>
                            <option value="RESOLVED">Resolved (Awaiting Sign-off)</option>
                            <option value="CLOSED">Closed (Verified Effective)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Assigned Lead
                          </label>
                          <input
                            type="text"
                            value={issue.responsiblePerson || responsiblePerson}
                            onChange={(e) =>
                              handleUpdateIssueField(idx, 'responsiblePerson', e.target.value)
                            }
                            placeholder="e.g. Sewing Supervisor"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Target Resolution Date
                          </label>
                          <input
                            type="date"
                            value={issue.targetDate || targetCompletionDate}
                            onChange={(e) =>
                              handleUpdateIssueField(idx, 'targetDate', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Another Issue Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200">
            <span className="text-xs text-blue-900 font-semibold">
              Need to record another finding for this CAPA?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenPresetModalForNew}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
              >
                + Preset Issue
              </button>
              <button
                type="button"
                onClick={handleAddBlankIssue}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                + Blank Issue
              </button>
            </div>
          </div>
        </div>

        {/* ─── SECTION 3: IMMEDIATE CONTAINMENT (D3) ─────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Overall Containment Action (D3)</h3>
              <p className="text-[11px] text-slate-500">
                Stop-ship, quarantine, segregation, and 100% sorting to protect customer
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Containment Action Plan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={containmentAction}
                onChange={(e) => setContainmentAction(e.target.value)}
                placeholder="e.g. Immediately quarantined 185 garments produced between 08:00 and 11:30. Ran 100% through 9-point conveyor metal detector."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Containment Execution Date
                </label>
                <input
                  type="date"
                  value={containmentDate}
                  onChange={(e) => setContainmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Containment Lead / Owner
                </label>
                <input
                  type="text"
                  value={containmentOwner}
                  onChange={(e) => setContainmentOwner(e.target.value)}
                  placeholder="e.g. Line QC Supervisor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 4: ROOT CAUSE ANALYSIS - 5 WHYS & FISHBONE (D4) ───── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                4. Root Cause Analysis (D4) — 5-Whys & Ishikawa 6M
              </h3>
              <p className="text-[11px] text-slate-500">
                Drill down past symptoms to identify systemic root causes and contributing factors
              </p>
            </div>
          </div>

          {/* 5 Whys Analysis Cascade */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>Interactive 5-Whys Cascade</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Why 1 to Root Conclusion)
              </span>
            </h4>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((num) => {
                const key = `why${num}` as keyof CapaFiveWhys;
                return (
                  <div key={num} className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-1">
                      W{num}
                    </span>
                    <input
                      type="text"
                      value={fiveWhys[key]}
                      onChange={(e) =>
                        setFiveWhys((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder={`Why did this happen? (Level ${num})...`}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                );
              })}

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 mt-2">
                <label className="block text-xs font-bold text-blue-900 mb-1">
                  Root Cause Conclusion from 5-Whys:
                </label>
                <input
                  type="text"
                  value={fiveWhys.rootCauseConclusion || ''}
                  onChange={(e) =>
                    setFiveWhys((prev) => ({ ...prev, rootCauseConclusion: e.target.value }))
                  }
                  placeholder="Summary of systemic root cause revealed by the 5th why..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white border border-blue-200 text-blue-950 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Ishikawa / Fishbone 6M Categories */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Ishikawa Fishbone Factors (6Ms)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Man, Machine, Material, Method, Measurement, Milieu
              </span>
            </h4>

            {/* Quick Add Factor */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-xl border border-slate-200">
              <select
                value={newFishboneInput.category}
                onChange={(e) =>
                  setNewFishboneInput((prev) => ({
                    ...prev,
                    category: e.target.value as keyof CapaFishboneFactors,
                  }))
                }
                className="px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 font-bold text-slate-800 cursor-pointer"
              >
                <option value="man">Man (Personnel / Training)</option>
                <option value="machine">Machine (Tooling / Equipment)</option>
                <option value="material">Material (Yarn / Trims / Dye)</option>
                <option value="method">Method (SOP / Procedure)</option>
                <option value="measurement">Measurement (Inspection / Gauge)</option>
                <option value="milieu">Milieu (Environment / Workplace)</option>
              </select>
              <input
                type="text"
                value={newFishboneInput.value}
                onChange={(e) =>
                  setNewFishboneInput((prev) => ({ ...prev, value: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFishboneFactor();
                  }
                }}
                placeholder="Enter contributing factor and press Add..."
                className="flex-1 min-w-[200px] px-3 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddFishboneFactor}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                Add Factor
              </button>
            </div>

            {/* Render 6M Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                {
                  key: 'man',
                  label: 'Man (Personnel)',
                  icon: User,
                  color: 'text-blue-700 bg-blue-50 border-blue-200',
                },
                {
                  key: 'machine',
                  label: 'Machine (Equipment)',
                  icon: Layers,
                  color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
                },
                {
                  key: 'material',
                  label: 'Material (Fabric/Trims)',
                  icon: Paperclip,
                  color: 'text-amber-700 bg-amber-50 border-amber-200',
                },
                {
                  key: 'method',
                  label: 'Method (SOPs/Processes)',
                  icon: FileText,
                  color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                },
                {
                  key: 'measurement',
                  label: 'Measurement (Gauges/QA)',
                  icon: CheckCircle2,
                  color: 'text-purple-700 bg-purple-50 border-purple-200',
                },
                {
                  key: 'milieu',
                  label: 'Milieu (Environment/Climate)',
                  icon: Building2,
                  color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
                },
              ].map(({ key, label, icon: IconComp, color }) => {
                const factors = fishbone[key as keyof CapaFishboneFactors] || [];
                return (
                  <div
                    key={key}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <IconComp className="w-3.5 h-3.5 text-slate-500" />
                      <span>{label}</span>
                      <span className="ml-auto text-[10px] font-mono text-slate-400">
                        {factors.length}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {factors.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic block">
                          No factors tagged
                        </span>
                      ) : (
                        factors.map((factor, fIdx) => (
                          <div
                            key={fIdx}
                            className={`flex items-center justify-between gap-1 p-1.5 rounded-lg border text-[11px] ${color}`}
                          >
                            <span className="truncate" title={factor}>
                              {factor}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFishboneFactor(key as keyof CapaFishboneFactors, fIdx)
                              }
                              className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary Root Cause Summary & Supporting Evidence */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Confirmed Primary Root Cause Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="Comprehensive statement of confirmed root cause based on 5-Whys and Fishbone findings..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                RCA Supporting Evidence & Data
              </label>
              <textarea
                rows={2}
                value={rcaSupportingEvidence}
                onChange={(e) => setRcaSupportingEvidence(e.target.value)}
                placeholder="Laboratory pull readings, gauge calibrations, machine counter readings, audit timestamps..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ─── SECTION 5: SYSTEMIC PREVENTIVE CONTROLS & SOP (D7) ─────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                5. Systemic Standardization & QMS Controls (D7)
              </h3>
              <p className="text-[11px] text-slate-500">
                Institutionalize improvements across lines through SOP revisions and personnel training
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* SOP Update */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900">
                <input
                  type="checkbox"
                  checked={sopUpdateRequired}
                  onChange={(e) => setSopUpdateRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Standard Operating Procedure (SOP) Update Required</span>
              </label>
              {sopUpdateRequired && (
                <input
                  type="text"
                  value={sopReference}
                  onChange={(e) => setSopReference(e.target.value)}
                  placeholder="e.g. SOP-QMS-04 (Needle & Sharp Tool Protocol)"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Training Required */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900">
                <input
                  type="checkbox"
                  checked={trainingRequired}
                  onChange={(e) => setTrainingRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Operator & Supervisor Training Required</span>
              </label>
              {trainingRequired && (
                <input
                  type="text"
                  value={trainingDetails}
                  onChange={(e) => setTrainingDetails(e.target.value)}
                  placeholder="e.g. 30-min refresher on digital needle safety for 48 supervisors"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* ─── SECTION 6: CLOSURE STATUS & VERIFICATION (D8) ──────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                6. Verification & Closure Audit Trail (D8)
              </h3>
              <p className="text-[11px] text-slate-500">
                Effectiveness verification, sign-off auditor, and lifecycle status
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                CAPA Lifecycle Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CapaStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="OPEN">Open (Action Pending)</option>
                <option value="IN_PROGRESS">In Progress (Actions Deployed)</option>
                <option value="VERIFICATION_PENDING">Verification Pending (Awaiting Audit)</option>
                <option value="CLOSED">Closed (Verified Effective)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Effectiveness Rating
              </label>
              <select
                value={effectivenessRating}
                onChange={(e) =>
                  setEffectivenessRating(
                    e.target.value as 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE' | 'PENDING'
                  )
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="PENDING">Pending Verification</option>
                <option value="EFFECTIVE">Effective (Zero Recurrence)</option>
                <option value="PARTIALLY_EFFECTIVE">Partially Effective (Minor Adjustments Needed)</option>
                <option value="INEFFECTIVE">Ineffective (Re-open CAPA)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Verified By (Lead Auditor)
              </label>
              <input
                type="text"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                placeholder="e.g. Shahidul Alam (Director of QA)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target / Completion Date
              </label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ─── BOTTOM SAVE BAR ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              All {issues.length} registered issues will be linked to the CAPA resolution matrix and logged for ISO 9001 compliance.
            </span>
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
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEdit ? 'Save Changes' : 'Issue CAPA Plan'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ─── MODAL: PRESET QUALITY ISSUES CHOOSER ───────────────────────── */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Standard Factory Quality Defect Presets
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pick a pre-configured quality issue with pre-filled corrective actions, preventive actions, and photographic evidence.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-2 flex-wrap text-xs">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search preset by defect, keyword (needle, seam, shading, pull test)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={presetCategoryFilter}
                onChange={(e) => setPresetCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {ISSUE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Presets Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredPresets.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No preset quality defects match your search filter.
                </div>
              ) : (
                filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col sm:flex-row gap-3.5 group"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={preset.evidenceImage}
                        alt={preset.issueTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                          {preset.issueTitle}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            preset.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : preset.severity === 'MAJOR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {preset.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold">
                          {preset.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1 text-slate-500">
                        <div className="truncate">
                          <strong className="text-emerald-700">Corrective: </strong>
                          {preset.correctiveAction}
                        </div>
                        <div className="truncate">
                          <strong className="text-blue-700">Preventive: </strong>
                          {preset.preventiveAction}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white group-hover:bg-blue-700 transition-colors shadow-2xs"
                      >
                        {targetIssueIndexForPreset !== null ? 'Apply to Issue' : 'Add to Record'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PHOTO GALLERY PRESET PICKER ─────────────────────────── */}
      {photoPickerTargetIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>Select Industry Evidence Photo</span>
              </h3>
              <button
                type="button"
                onClick={() => setPhotoPickerTargetIndex(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
              {INDUSTRY_EVIDENCE_PHOTOS.map((photo) => (
                <div
                  key={photo.label}
                  onClick={() =>
                    handleSelectPresetPhotoForIssue(
                      photoPickerTargetIndex,
                      photo.url,
                      photo.caption
                    )
                  }
                  className="rounded-xl border border-slate-200 hover:border-blue-500 overflow-hidden cursor-pointer group shadow-2xs bg-slate-50"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2 text-[10px] font-bold text-slate-800 truncate" title={photo.label}>
                    {photo.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
