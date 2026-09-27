'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  ShieldCheck,
  ShieldAlert,
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
  Camera,
  Plus,
  Users,
  Printer,
  Tag,
  CheckCircle2,
  Zap,
  Package,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  RiskFmeaItem,
  RiskStatus,
  RiskSectionType,
  RiskSectionItem,
} from '@/lib/types/modules';
import {
  getRiskLevel,
  getRiskLevelBadge,
  SEVERITY_RUBRIC,
  OCCURRENCE_RUBRIC,
  DETECTION_RUBRIC,
  computeRpn,
} from './riskAssessmentData';
import {
  RISK_SECTIONS,
  RISK_SECTION_ORDER,
  computeSectionRiskStats,
} from './riskAssessmentSections';

interface RiskAssessmentDetailsPageProps {
  record: RiskFmeaItem;
  onBack: () => void;
  onEdit: (record: RiskFmeaItem) => void;
  onDelete: (record: RiskFmeaItem) => void;
  onUpdateStatus?: (updatedRecord: RiskFmeaItem) => void;
  showToast: (msg: string) => void;
}

export function RiskAssessmentDetailsPage({
  record,
  onBack,
  onEdit,
  onDelete,
  onUpdateStatus,
  showToast,
}: RiskAssessmentDetailsPageProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(
    null
  );

  // Active section tab for multi-risk viewing
  const [activeSectionFilter, setActiveSectionFilter] = useState<RiskSectionType | 'ALL'>(
    'ALL'
  );

  const rpnVal = record.rpn || record.severity * record.occurrence * record.detection;
  const riskLevel = record.riskLevel || getRiskLevel(rpnVal, record.severity);
  const levelBadge = getRiskLevelBadge(riskLevel);

  // Section Risks Analysis
  const hasMultipleRisks = Array.isArray(record.sectionRisks) && record.sectionRisks.length > 0;
  const sectionStats = useMemo(() => {
    if (!hasMultipleRisks) return null;
    return computeSectionRiskStats(record.sectionRisks!);
  }, [hasMultipleRisks, record.sectionRisks]);

  const displayedSectionRisks = useMemo(() => {
    if (!hasMultipleRisks) return [];
    if (activeSectionFilter === 'ALL') return record.sectionRisks!;
    return record.sectionRisks!.filter((r) => r.section === activeSectionFilter);
  }, [hasMultipleRisks, record.sectionRisks, activeSectionFilter]);

  const typeLabel =
    record.assessmentType === 'PRODUCT'
      ? 'Product Risk Assessment'
      : record.assessmentType === 'CRITICAL_PROCESS'
      ? 'Critical Process Risk Assessment'
      : 'Process Risk Assessment';

  const typeBadgeClass =
    record.assessmentType === 'PRODUCT'
      ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
      : record.assessmentType === 'CRITICAL_PROCESS'
      ? 'bg-rose-100 text-rose-800 border-rose-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';

  const handleStatusChange = (newStatus: RiskStatus) => {
    const updated = { ...record, status: newStatus, updatedAt: new Date().toISOString() };
    if (onUpdateStatus) {
      onUpdateStatus(updated);
    }
    showToast(`Assessment status updated to ${newStatus}`);
  };

  const handleUpdateItemStatus = (itemId: string, newStatus: RiskStatus) => {
    if (!record.sectionRisks) return;
    const updatedList = record.sectionRisks.map((item) =>
      item.id === itemId ? { ...item, status: newStatus } : item
    );
    const updatedRecord = { ...record, sectionRisks: updatedList, updatedAt: new Date().toISOString() };
    if (onUpdateStatus) {
      onUpdateStatus(updatedRecord);
    }
    showToast(`Updated risk item status to ${newStatus}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Lightbox Zoom Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">{selectedPhoto.title}</h4>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[65vh] w-auto rounded-xl object-contain shadow-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── NON-STICKY TOPBAR HEADER ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back to Risk Register"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                {record.fmeaCode}
              </span>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${typeBadgeClass}`}>
                {record.assessmentType || 'PRODUCT'}
              </span>
              {record.orderNumber && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  PO: {record.orderNumber}
                </span>
              )}
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  record.status === 'APPROVED' || record.status === 'MITIGATED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : record.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {record.status || 'IN_PROGRESS'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
              {record.title || record.processStep}
            </h1>
          </div>
        </div>

        {/* Topbar Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Print Assessment / Export PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(record)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Assessment</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(record)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* ─── LINKED PRODUCT & ORDER PROFILE BANNER ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            {/* Style Thumbnail */}
            <div
              onClick={() => {
                if (record.productImage) {
                  setSelectedPhoto({ url: record.productImage, title: `${record.styleNumber} Photo` });
                }
              }}
              className="w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center cursor-pointer shadow-xs"
            >
              {record.productImage ? (
                <img
                  src={record.productImage}
                  alt={record.styleNumber}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              ) : (
                <Package className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {record.styleNumber || 'STYLE NOT SPECIFIED'}
                </span>
                {record.orderNumber && (
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    PO: {record.orderNumber}
                  </span>
                )}
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {record.buyer || 'General Factory'}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {record.styleDescription || record.title || 'Product Style Assessment'}
              </h2>

              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                {record.potentialFailureMode}
              </p>
            </div>
          </div>

          {/* Big Score Card */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0 self-start lg:self-center">
            <div className="text-center px-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                {hasMultipleRisks ? 'Highest Risk RPN' : 'Risk Priority Number'}
              </span>
              <div className="text-3xl font-mono font-black text-slate-900 mt-0.5">
                {hasMultipleRisks ? sectionStats?.maxRpn : rpnVal}
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                {hasMultipleRisks
                  ? `${record.sectionRisks?.length} Total Risks Identified`
                  : `S(${record.severity}) × O(${record.occurrence}) × D(${record.detection})`}
              </span>
            </div>

            <div className="h-12 w-px bg-slate-200" />

            <div className="space-y-1">
              <div className={`px-3 py-1 rounded-xl border text-xs font-bold ${levelBadge.badgeClass}`}>
                {levelBadge.label}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {(hasMultipleRisks ? sectionStats?.maxRpn || 0 : rpnVal) >= 80
                  ? 'Mandatory Poka-Yoke'
                  : 'Standard Monitoring'}
              </span>
            </div>
          </div>
        </div>

        {/* Scope Metadata Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Style Number</span>
            <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 block truncate">
              {record.styleNumber || 'N/A'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Buyer / Brand</span>
            <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
              {record.buyer || 'General Factory'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Season &amp; Qty</span>
            <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
              {record.season ? `${record.season} ` : ''}
              {record.orderQuantity ? `(${record.orderQuantity.toLocaleString()} pcs)` : ''}
              {!record.season && !record.orderQuantity ? 'N/A' : ''}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Department</span>
            <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
              {record.department || 'Production Line'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Assessment Date</span>
            <span className="text-xs font-mono font-bold text-blue-700 mt-0.5 block">
              {record.assessmentDate || 'Recent'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Lead Assessor</span>
            <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
              {record.assessorName || 'QA Lead'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── MULTI-SECTION RISKS REGISTER (CORE COMPONENT) ────────────────────── */}
      {hasMultipleRisks && sectionStats && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Section-wise Risk Register for {record.styleNumber}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation across <strong>Raw Material</strong>, <strong>Embellishment</strong>, <strong>Product Testing</strong>, <strong>Legal Requirement</strong>, and more.
              </p>
            </div>

            {/* Quick Section Risk Stats Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                {sectionStats.totalRisks} Total Risks
              </span>
              {sectionStats.criticalCount > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold font-mono">
                  {sectionStats.criticalCount} Critical
                </span>
              )}
              {sectionStats.highCount > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold font-mono">
                  {sectionStats.highCount} High
                </span>
              )}
            </div>
          </div>

          {/* Section Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveSectionFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeSectionFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>All Sections</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeSectionFilter === 'ALL' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {record.sectionRisks?.length}
              </span>
            </button>

            {RISK_SECTION_ORDER.map((secKey) => {
              const meta = RISK_SECTIONS[secKey];
              const count = sectionStats.sectionCounts[secKey] || 0;
              if (count === 0) return null;
              const isSelected = activeSectionFilter === secKey;

              return (
                <button
                  key={secKey}
                  type="button"
                  onClick={() => setActiveSectionFilter(secKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${meta.badgeBg} ${meta.badgeText} border-2 ${meta.borderColor} shadow-2xs`
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{meta.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/80' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Risks Cards in Section */}
          <div className="space-y-4 pt-1">
            {displayedSectionRisks.map((item, idx) => {
              const secMeta = RISK_SECTIONS[item.section] || RISK_SECTIONS.OTHER;
              const itemRpn = item.rpn || computeRpn(item.severity, item.occurrence, item.detection);
              const itemLevel = item.riskLevel || getRiskLevel(itemRpn, item.severity);
              const itemBadge = getRiskLevelBadge(itemLevel);

              return (
                <div
                  key={item.id || idx}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Top Bar of Risk Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${secMeta.badgeBg} ${secMeta.badgeText} ${secMeta.borderColor}`}
                      >
                        {secMeta.label.toUpperCase()}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {item.potentialFailureMode}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-md border ${itemBadge.badgeClass}`}>
                          RPN {itemRpn}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          S{item.severity} · O{item.occurrence} · D{item.detection}
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={item.status || 'IN_PROGRESS'}
                        onChange={(e) =>
                          handleUpdateItemStatus(item.id, e.target.value as RiskStatus)
                        }
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="MITIGATED">Mitigated</option>
                        <option value="APPROVED">Approved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Body Details: Process step, effect, causes, controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Process Step / Component:
                        </span>
                        <span className="font-semibold text-slate-800">{item.processStep}</span>
                      </div>
                      {item.potentialEffect && (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Potential Effect on Garment / Buyer:
                          </span>
                          <span className="text-slate-700 leading-relaxed">{item.potentialEffect}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {item.potentialCauses && (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Root Causes:
                          </span>
                          <span className="text-slate-700 leading-relaxed">{item.potentialCauses}</span>
                        </div>
                      )}
                      {item.currentControls && (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Current Controls:
                          </span>
                          <span className="text-slate-700 leading-relaxed">{item.currentControls}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mandatory Mitigation Action Box */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Prescribed Engineering Mitigation Protocol</span>
                      </span>
                      <span className="text-[11px] text-emerald-800 font-medium">
                        Lead: <strong>{item.responsibleLead || 'QA Lead'}</strong>
                        {item.targetDate ? ` • Due: ${item.targetDate}` : ''}
                      </span>
                    </div>
                    <p className="text-slate-900 font-medium leading-relaxed">
                      {item.mitigationAction}
                    </p>
                  </div>

                  {item.notes && (
                    <div className="text-[11px] text-slate-500 italic">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── DUAL IMAGE SHOWCASE (PRODUCT & PROCESS IMAGES) ──────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Visual Reference Evidence (Product &amp; Process Workstation)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">2 Attached Angles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image Card */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  PRODUCT SPEC / DEFECT
                </span>
                <span className="text-xs font-semibold text-slate-800">Garment Analysis</span>
              </div>
              {record.productImage && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhoto({ url: record.productImage!, title: 'Product Evaluation Image' })
                  }
                  className="p-1 rounded-md text-blue-600 hover:bg-blue-50 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              )}
            </div>

            {record.productImage ? (
              <div
                onClick={() =>
                  setSelectedPhoto({ url: record.productImage!, title: 'Product Evaluation Image' })
                }
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-4/3 flex items-center justify-center cursor-pointer shadow-xs"
              >
                <img
                  src={record.productImage}
                  alt="Product Evidence"
                  className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-xl bg-white/90 text-xs font-bold text-slate-900 shadow-md flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5" /> Click to Enlarge
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center aspect-4/3 bg-white">
                <Camera className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-semibold text-slate-600">No Product Image Attached</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Click Edit to upload garment photos</span>
              </div>
            )}
          </div>

          {/* Process Image Card */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  PROCESS / MACHINE JIG
                </span>
                <span className="text-xs font-semibold text-slate-800">Workstation Setup</span>
              </div>
              {record.processImage && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhoto({ url: record.processImage!, title: 'Process Workstation Image' })
                  }
                  className="p-1 rounded-md text-blue-600 hover:bg-blue-50 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              )}
            </div>

            {record.processImage ? (
              <div
                onClick={() =>
                  setSelectedPhoto({ url: record.processImage!, title: 'Process Workstation Image' })
                }
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-4/3 flex items-center justify-center cursor-pointer shadow-xs"
              >
                <img
                  src={record.processImage}
                  alt="Process Workstation"
                  className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-xl bg-white/90 text-xs font-bold text-slate-900 shadow-md flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5" /> Click to Enlarge
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center aspect-4/3 bg-white">
                <Camera className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-semibold text-slate-600">No Process Image Attached</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Click Edit to upload machine setup photos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── PRIMARY FMEA PARAMETER BREAKDOWN (FOR LEGACY OR PRIMARY RISK) ───── */}
      {!hasMultipleRisks && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                FMEA Parameter Breakdown &amp; Scoring Rubrics
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">
              RPN = {record.severity} × {record.occurrence} × {record.detection} = {rpnVal}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Severity Card */}
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-200 text-rose-900 font-mono font-bold text-[11px] flex items-center justify-center">
                    S
                  </span>
                  <span>Severity (Impact)</span>
                </span>
                <span className="text-sm font-mono font-extrabold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                  {record.severity} / 10
                </span>
              </div>
              <div className="text-xs font-semibold text-rose-950">
                {SEVERITY_RUBRIC[record.severity]?.label}
              </div>
              <p className="text-[11px] text-rose-800 leading-tight">
                {SEVERITY_RUBRIC[record.severity]?.desc}
              </p>
            </div>

            {/* Occurrence Card */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-amber-200 text-amber-900 font-mono font-bold text-[11px] flex items-center justify-center">
                    O
                  </span>
                  <span>Occurrence (Frequency)</span>
                </span>
                <span className="text-sm font-mono font-extrabold text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                  {record.occurrence} / 10
                </span>
              </div>
              <div className="text-xs font-semibold text-amber-950">
                {OCCURRENCE_RUBRIC[record.occurrence]?.label}
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                {OCCURRENCE_RUBRIC[record.occurrence]?.desc}
              </p>
            </div>

            {/* Detection Card */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-200 text-blue-900 font-mono font-bold text-[11px] flex items-center justify-center">
                    D
                  </span>
                  <span>Detection (Control)</span>
                </span>
                <span className="text-sm font-mono font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                  {record.detection} / 10
                </span>
              </div>
              <div className="text-xs font-semibold text-blue-950">
                {DETECTION_RUBRIC[record.detection]?.label}
              </div>
              <p className="text-[11px] text-blue-800 leading-tight">
                {DETECTION_RUBRIC[record.detection]?.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── CROSS-FUNCTIONAL EVALUATION TEAM (CFT) ─────────────────────────── */}
      {record.assessorTeam && record.assessorTeam.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Cross-Functional Evaluation Team (CFT)
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {record.assessorTeam.map((member, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>{member}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
