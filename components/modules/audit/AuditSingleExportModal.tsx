'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileDown,
  ShieldCheck,
  Building2,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Camera,
  Eye,
  ImageIcon,
  Check,
  ExternalLink,
  Download,
  FileText,
  User,
  Tag,
  Maximize2,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  QualityAudit,
  AuditChecklistItem,
  AuditPhotoEvidence,
  AuditUploadedFile,
} from '@/lib/types/modules';
import {
  exportSingleAuditPdf,
  exportSingleAuditExcel,
} from './audit-export-utils';
import { loadPdfHeaderSettings } from '@/lib/pdf/pdf-header-store';
import { ISO_9001_DEFAULT_CHECKLIST } from './iso9001ChecklistData';

interface AuditSingleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: QualityAudit | null;
}

interface GalleryPhotoItem extends AuditPhotoEvidence {
  clauseNumber: string;
  clauseTitle: string;
  questionText: string;
  status: string;
  remark?: string;
}

export function AuditSingleExportModal({
  isOpen,
  onClose,
  audit,
}: AuditSingleExportModalProps) {
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClause, setSelectedClause] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFORMITY' | 'NC_ONLY' | 'WITH_PHOTOS'>('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'checklist' | 'gallery' | 'scope'>('all');

  // Export content configuration toggles
  const [includeChecklist, setIncludeChecklist] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeRemarks, setIncludeRemarks] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);

  // Lightbox modal for full-size photo preview
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhotoItem | null>(null);

  // Handle escape key to close lightbox or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxPhoto) {
          setLightboxPhoto(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, isOpen, onClose]);

  if (!isOpen || !audit) return null;

  const pdfSettings = loadPdfHeaderSettings();
  const scoreVal = audit.obtainedMarks ?? audit.scorePercentage ?? 0;
  const hasCritical = (audit.criticalNCs ?? 0) > 0;
  const isPassed =
    !hasCritical &&
    (audit.isPassed !== undefined ? audit.isPassed : scoreVal >= (audit.passMarks ?? 80));

  const auditeeTitle =
    audit.supplierName || audit.auditeeDepartment || 'Factory Operations';

  const checklist: AuditChecklistItem[] = useMemo(() => {
    if (audit.checklist && audit.checklist.length > 0) {
      return audit.checklist;
    }
    const cat =
      audit.auditCategory ||
      (audit.auditType === 'INTERNAL' || audit.auditType === 'INTERNAL_QMS'
        ? 'INTERNAL'
        : audit.auditType === 'SUB_SUPPLIER'
        ? 'SUB_SUPPLIER'
        : 'EXTERNAL');
    return cat === 'INTERNAL' ? ISO_9001_DEFAULT_CHECKLIST : [];
  }, [audit]);

  const auditWithChecklist: QualityAudit = useMemo(
    () => ({
      ...audit,
      checklist,
    }),
    [audit, checklist]
  );

  // Helper to extract photos from any checklist question item
  const getQuestionPhotos = (q: AuditChecklistItem): AuditPhotoEvidence[] => {
    if (q.evidencePhotos && q.evidencePhotos.length > 0) {
      return q.evidencePhotos;
    }
    if (q.evidencePhoto) {
      return [
        {
          id: `p-${q.id}`,
          url: q.evidencePhoto,
          caption: q.remark || `Evidence for Clause ${q.clauseNumber}`,
          timestamp: q.photoTimestamp || 'Recorded',
        },
      ];
    }
    return [];
  };

  // Collect all photos across all questions for the gallery view
  const allAuditPhotos: GalleryPhotoItem[] = useMemo(() => {
    const list: GalleryPhotoItem[] = [];
    checklist.forEach((q) => {
      const photos = getQuestionPhotos(q);
      photos.forEach((p) => {
        list.push({
          ...p,
          clauseNumber: q.clauseNumber,
          clauseTitle: q.subClauseTitle || q.clause,
          questionText: q.question,
          status: q.status,
          remark: q.remark,
        });
      });
    });
    return list;
  }, [checklist]);

  // Extract unique clauses for the clause filter dropdown
  const uniqueClauses = useMemo(() => {
    const set = new Set<string>();
    checklist.forEach((q) => {
      if (q.clause) set.add(q.clause);
    });
    return Array.from(set);
  }, [checklist]);

  // Filter questions based on search query, clause, and status
  const filteredChecklist = useMemo(() => {
    return checklist.filter((q) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const qry = searchQuery.toLowerCase();
        const matchCode = (q.clauseNumber || '').toLowerCase().includes(qry);
        const matchTitle = (q.subClauseTitle || '').toLowerCase().includes(qry);
        const matchClause = (q.clause || '').toLowerCase().includes(qry);
        const matchQuestion = (q.question || '').toLowerCase().includes(qry);
        const matchRemark = (q.remark || '').toLowerCase().includes(qry);
        if (!matchCode && !matchTitle && !matchClause && !matchQuestion && !matchRemark) {
          return false;
        }
      }

      // 2. Clause Filter
      if (selectedClause !== 'ALL' && q.clause !== selectedClause) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter === 'CONFORMITY') {
        if (q.status !== 'CONFORMITY') return false;
      } else if (statusFilter === 'NC_ONLY') {
        if (
          q.status !== 'CRITICAL_NC' &&
          q.status !== 'MAJOR_NC' &&
          q.status !== 'MINOR_NC' &&
          q.status !== 'NON_CONFORMITY'
        ) {
          return false;
        }
      } else if (statusFilter === 'WITH_PHOTOS') {
        const photos = getQuestionPhotos(q);
        if (photos.length === 0) return false;
      }

      return true;
    });
  }, [checklist, searchQuery, selectedClause, statusFilter]);

  // Counts for quick KPI chips
  const conformitiesCount = checklist.filter((q) => q.status === 'CONFORMITY').length;
  const criticalCount = checklist.filter((q) => q.status === 'CRITICAL_NC').length;
  const majorCount = checklist.filter((q) => q.status === 'MAJOR_NC').length;
  const minorCount = checklist.filter((q) => q.status === 'MINOR_NC').length;
  const questionsWithPhotosCount = checklist.filter((q) => getQuestionPhotos(q).length > 0).length;

  // Handle PDF Export
  const handleExportPdf = () => {
    exportSingleAuditPdf(auditWithChecklist, {
      includeChecklist,
      includePhotos,
      includeRemarks,
      signatureMode: includeSignatures ? 'triple' : 'none',
    });
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    exportSingleAuditExcel(auditWithChecklist);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ─── STICKY HEADER ────────────────────────────────────────────── */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold font-mono text-white tracking-wide">
                  {audit.auditCode}
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    hasCritical
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  }`}
                >
                  {hasCritical ? 'CRITICAL FAIL' : isPassed ? 'PASSED (≥80)' : 'FAILED / ACTION REQ.'}
                </span>
                <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                  {audit.standard}
                </span>
                <span className="text-[11px] font-semibold text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-700/40 hidden sm:inline-block">
                  {audit.auditType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Export Preview: Full Checklist Questions Table, Photo Evidences &amp; Verification Report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Export PDF in header */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {/* Quick Export Excel in header */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/80 rounded-lg transition-colors cursor-pointer"
              title="Export as Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close Export Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── LINKED PDF HEADER STORE BANNER ──────────────────────────── */}
        <div className="px-5 py-2.5 bg-blue-50/90 border-b border-blue-100 flex items-center justify-between text-xs text-blue-950 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">
              <strong>Enterprise Report Header:</strong>{' '}
              {pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'} &bull; Document Code:{' '}
              <span className="font-mono font-semibold text-blue-800">VAL-AUD-{audit.auditCode}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] text-blue-700 font-medium hidden md:inline-block">
              Auditee: <strong>{auditeeTitle}</strong>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Header Synced
            </span>
          </div>
        </div>

        {/* ─── TOOLBAR: CONTROLS, TABS & EXPORT OPTIONS ────────────────── */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          {/* Top row: Tab Navigation & Export Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All Sections
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'checklist'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Questions Table ({checklist.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'gallery'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Photo Gallery ({allAuditPhotos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('scope')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'scope'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Scope &amp; Summary
              </button>
            </div>

            {/* Export Inclusions Checkboxes */}
            <div className="flex items-center gap-3 text-xs text-slate-700 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Include in PDF:
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeChecklist}
                  onChange={(e) => setIncludeChecklist(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="font-semibold text-slate-800">Questions Table</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="font-semibold text-slate-800">Evidence Photos</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeRemarks}
                  onChange={(e) => setIncludeRemarks(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="font-semibold text-slate-800">Remarks</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="font-semibold text-slate-800">Signatures</span>
              </label>
            </div>
          </div>

          {/* Bottom row: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clause, requirement, remark, criteria..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-400 mr-1 hidden md:inline-block">Filter:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({checklist.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CONFORMITY')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === 'CONFORMITY'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Conformity ({conformitiesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('NC_ONLY')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === 'NC_ONLY'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                NCs ({criticalCount + majorCount + minorCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('WITH_PHOTOS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                  statusFilter === 'WITH_PHOTOS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>Photos ({questionsWithPhotosCount})</span>
              </button>

              {/* Clause dropdown */}
              {uniqueClauses.length > 1 && (
                <select
                  value={selectedClause}
                  onChange={(e) => setSelectedClause(e.target.value)}
                  className="px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
                >
                  <option value="ALL">All Clauses</option>
                  {uniqueClauses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* ─── SCROLLABLE PAGE BODY ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {/* SECTION 1: AUDIT SCOPE & EXECUTIVE SUMMARY */}
          {(activeTab === 'all' || activeTab === 'scope') && (
            <div className="space-y-4">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                {/* 1. Score & Verdict Hero */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider">Evaluation Score</span>
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-extrabold font-mono ${
                        hasCritical ? 'text-rose-600' : isPassed ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {scoreVal}%
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      ({scoreVal} / 100 Marks)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Pass Benchmark: <strong>{audit.passMarks ?? 80} Marks</strong> &bull;{' '}
                    <span
                      className={`font-bold ${
                        hasCritical ? 'text-rose-600' : isPassed ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {hasCritical ? 'Critical Fail' : isPassed ? 'Passed' : 'Needs Action'}
                    </span>
                  </div>
                </div>

                {/* 2. Audit Scope & Facility */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider">Auditee Facility</span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate" title={auditeeTitle}>
                    {auditeeTitle}
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div>Type: <strong className="text-slate-700">{audit.auditType}</strong></div>
                    {audit.subSupplierCode && (
                      <div>Vendor Ref: <strong className="text-emerald-700">{audit.subSupplierCode}</strong></div>
                    )}
                  </div>
                </div>

                {/* 3. Lead Auditor & Date */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider">Auditor &amp; Schedule</span>
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate" title={audit.auditorName}>
                    {audit.auditorName}
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div>Date: <span className="font-mono font-semibold text-slate-700">{audit.auditDate}</span></div>
                    <div>Next Due: <span className="font-mono font-semibold text-blue-700">{audit.nextAuditDate || 'TBD'}</span></div>
                  </div>
                </div>

                {/* 4. Non-Conformances & Photos */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider">Findings &amp; Photos</span>
                    <Camera className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-2xl font-bold font-mono text-slate-900">
                        {audit.nonConformancesCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Total NCs</span>
                    </div>
                    <div className="h-7 w-px bg-slate-200" />
                    <div>
                      <span className="text-2xl font-bold font-mono text-blue-600">
                        {allAuditPhotos.length}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Photos Attached</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 flex gap-2 font-mono">
                    <span className="text-rose-600 font-bold">{audit.criticalNCs || 0} Crit</span> &bull;{' '}
                    <span className="text-amber-600 font-bold">{audit.majorNCs || 0} Maj</span> &bull;{' '}
                    <span className="text-slate-600">{audit.minorNCs || 0} Min</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary Note (if any) */}
              {audit.executiveSummary && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Executive Summary &amp; Findings Overview</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {audit.executiveSummary}
                  </p>
                </div>
              )}

              {/* Uploaded Documents List (if any) */}
              {audit.uploadedFiles && audit.uploadedFiles.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Associated Audit Documents &amp; Certificates</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 font-bold">
                      {audit.uploadedFiles.length} File(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {audit.uploadedFiles.map((f, idx) => (
                      <div
                        key={f.id || idx}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate" title={f.fileName}>
                            {f.fileName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {f.fileSize} &bull; {f.uploadDate}
                          </div>
                        </div>
                        {f.fileUrl && (
                          <a
                            href={f.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 hover:text-blue-800 shrink-0"
                            title="Open Document"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: COMPLETE AUDIT QUESTIONS & CHECKLIST TABLE */}
          {(activeTab === 'all' || activeTab === 'checklist') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Section Header */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Audit Verification Checklist &amp; Questionnaire Findings
                  </h4>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Showing {filteredChecklist.length} of {checklist.length} Questions
                  </span>
                </div>
                <div className="text-xs text-slate-500 hidden sm:block">
                  Click on any photo thumbnail to inspect in full resolution
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                      <th className="py-2.5 px-3 text-center w-12 font-mono">#</th>
                      <th className="py-2.5 px-3 w-28">Clause</th>
                      <th className="py-2.5 px-4 min-w-[280px]">Requirement &amp; Verification Criteria</th>
                      <th className="py-2.5 px-3 text-center w-20">Marks</th>
                      <th className="py-2.5 px-3 text-center w-28">Status</th>
                      <th className="py-2.5 px-4 min-w-[220px]">Auditor Remarks</th>
                      <th className="py-2.5 px-4 min-w-[180px]">Evidence Photos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredChecklist.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <div className="max-w-xs mx-auto space-y-2">
                            <Search className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs font-bold text-slate-700">No questions match your filter</p>
                            <p className="text-[11px] text-slate-400">
                              Try clearing your search query or changing status filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredChecklist.map((q, idx) => {
                        const photos = getQuestionPhotos(q);

                        return (
                          <tr
                            key={q.id || idx}
                            className={`hover:bg-blue-50/30 transition-colors ${
                              q.status === 'CRITICAL_NC'
                                ? 'bg-rose-50/40'
                                : q.status === 'MAJOR_NC'
                                ? 'bg-amber-50/30'
                                : idx % 2 === 1
                                ? 'bg-slate-50/40'
                                : 'bg-white'
                            }`}
                          >
                            {/* # */}
                            <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold align-top">
                              {idx + 1}
                            </td>

                            {/* Clause */}
                            <td className="py-3 px-3 align-top">
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px] block w-fit">
                                {q.clauseNumber}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-1 line-clamp-2">
                                {q.clause}
                              </span>
                            </td>

                            {/* Requirement & Criteria */}
                            <td className="py-3 px-4 align-top">
                              <div className="font-bold text-slate-900 text-xs mb-1">
                                {q.subClauseTitle || q.clause}
                              </div>
                              <p className="text-slate-600 text-[11.5px] leading-relaxed mb-1.5">
                                {q.question}
                              </p>
                              {q.guidance && (
                                <div className="text-[10.5px] text-slate-500 bg-slate-100/80 p-1.5 rounded-lg border border-slate-200/80 italic">
                                  <strong>Verification Criteria:</strong> {q.guidance}
                                </div>
                              )}
                            </td>

                            {/* Marks */}
                            <td className="py-3 px-3 text-center font-mono align-top">
                              <span
                                className={`font-bold text-xs ${
                                  q.score === q.maxScore
                                    ? 'text-emerald-700'
                                    : q.score > 0
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                                }`}
                              >
                                {q.score}
                              </span>
                              <span className="text-slate-400 text-[10px]"> / {q.maxScore}</span>
                            </td>

                            {/* Compliance Status */}
                            <td className="py-3 px-3 text-center align-top">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  q.status === 'CONFORMITY'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : q.status === 'CRITICAL_NC'
                                    ? 'bg-rose-100 text-rose-900 border-rose-300 font-black'
                                    : q.status === 'MAJOR_NC'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : q.status === 'MINOR_NC'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                {q.status.replace(/_/g, ' ')}
                              </span>
                            </td>

                            {/* Remarks */}
                            <td className="py-3 px-4 text-slate-700 text-[11.5px] align-top">
                              {q.remark ? (
                                <div className="space-y-1">
                                  <p className="leading-relaxed">{q.remark}</p>
                                </div>
                              ) : (
                                <span className="text-slate-300 italic text-xs">-</span>
                              )}
                            </td>

                            {/* Evidence Photos */}
                            <td className="py-3 px-4 align-top">
                              {photos.length > 0 ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {photos.map((photo, pIdx) => (
                                      <div
                                        key={photo.id || pIdx}
                                        onClick={() =>
                                          setLightboxPhoto({
                                            ...photo,
                                            clauseNumber: q.clauseNumber,
                                            clauseTitle: q.subClauseTitle || q.clause,
                                            questionText: q.question,
                                            status: q.status,
                                            remark: q.remark,
                                          })
                                        }
                                        className="relative group w-14 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md hover:border-blue-500 hover:ring-2 hover:ring-blue-400/30 transition-all shrink-0"
                                        title={photo.caption || 'Click to view full photo'}
                                      >
                                        <img
                                          src={photo.url}
                                          alt={`Evidence ${pIdx + 1}`}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                          onError={(e) => {
                                            (e.currentTarget as HTMLElement).style.display = 'none';
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Eye className="w-3.5 h-3.5 text-white" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold font-mono">
                                    <Camera className="w-3 h-3 text-blue-500" />
                                    <span>{photos.length} Photo{photos.length > 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300 italic text-[11px]">No photo</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: DEDICATED VISUAL PHOTO EVIDENCE GALLERY */}
          {(activeTab === 'all' || activeTab === 'gallery') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Audit Photo Evidences &amp; Visual Verification Gallery
                  </h4>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {allAuditPhotos.length} Total Photographic Evidence Record{allAuditPhotos.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-xs text-slate-500 hidden sm:block">
                  High-resolution photo evidence documented during walkthrough
                </div>
              </div>

              {allAuditPhotos.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No image evidence attached</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Photos captured during the physical walkthrough or audit inspection checklist will appear here and embed automatically into exports.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {allAuditPhotos.map((photo, pIdx) => (
                    <div
                      key={photo.id || pIdx}
                      onClick={() => setLightboxPhoto(photo)}
                      className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all overflow-hidden flex flex-col cursor-pointer"
                    >
                      {/* Image Preview Container */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Evidence Photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                          <span className="text-white text-[11px] font-semibold flex items-center gap-1">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Click to Zoom</span>
                          </span>
                        </div>

                        {/* Clause badge overlay */}
                        <div className="absolute top-2 left-2">
                          <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs">
                            {photo.clauseNumber}
                          </span>
                        </div>

                        {/* Status chip overlay */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow-2xs ${
                              photo.status === 'CONFORMITY'
                                ? 'bg-emerald-500 text-white'
                                : photo.status === 'CRITICAL_NC'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {photo.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Photo Information Body */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                            {photo.caption || photo.clauseTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                            {photo.clauseTitle}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{photo.timestamp || 'Recorded'}</span>
                          <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                            Inspect <Eye className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: ENTERPRISE AUDIT SIGNATURES */}
          {(activeTab === 'all' || activeTab === 'scope') && includeSignatures && (
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Enterprise Governance &amp; Verification Sign-off</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="h-10 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1">
                    <span className="text-xs font-mono text-slate-600 font-bold">{audit.auditorName}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 uppercase">Lead Quality Auditor</div>
                  <div className="text-[10px] text-slate-500">Inspection &amp; Assessment Lead</div>
                </div>

                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="h-10 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1">
                    <span className="text-xs font-mono text-slate-400 italic">Signature on Record</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 uppercase">QA &amp; Compliance Manager</div>
                  <div className="text-[10px] text-slate-500">Quality Management Systems (QMS)</div>
                </div>

                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="h-10 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1">
                    <span className="text-xs font-mono text-slate-400 italic">Executive Approval</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 uppercase">Managing Director / Factory GM</div>
                  <div className="text-[10px] text-slate-500">Plant Governance &amp; Operations</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── STICKY FOOTER ────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span className="font-mono font-semibold text-slate-700">VAL-AUD-{audit.auditCode}</span>
            <span>&bull;</span>
            <span>{checklist.length} Checkpoints</span>
            <span>&bull;</span>
            <span className="text-blue-700 font-bold">{allAuditPhotos.length} Photo Evidences</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export Excel (.xls)</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>

        {/* ─── LIGHTBOX MODAL FOR FULL-SIZE PHOTO PREVIEW ───────────────── */}
        {lightboxPhoto && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setLightboxPhoto(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header */}
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs bg-blue-600 px-2 py-0.5 rounded text-white">
                    Clause {lightboxPhoto.clauseNumber}
                  </span>
                  <div className="text-xs font-bold truncate max-w-md">
                    {lightboxPhoto.caption || lightboxPhoto.clauseTitle}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxPhoto(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lightbox Image View */}
              <div className="p-3 bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={lightboxPhoto.url}
                  alt={lightboxPhoto.caption || 'Evidence'}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>

              {/* Lightbox Details Bar */}
              <div className="p-4 bg-white border-t border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">
                    {lightboxPhoto.clauseTitle}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Timestamp: <span className="font-mono font-medium">{lightboxPhoto.timestamp || 'Recorded'}</span> &bull; Status:{' '}
                    <span className="font-bold text-slate-700">{lightboxPhoto.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={lightboxPhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Original</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxPhoto(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
