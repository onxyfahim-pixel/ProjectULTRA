'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Layers,
  Sparkles,
  BookOpen,
  MapPin,
  Clock,
  User,
  Sliders,
  Check,
  AlertOctagon,
  Image as ImageIcon,
  Tag,
  Wrench,
  Activity,
  Maximize2,
  CheckSquare,
} from 'lucide-react';
import { DefectDefinition } from '@/lib/types/modules';

interface DefectDetailsPageProps {
  defect: DefectDefinition;
  onBack: () => void;
  onEdit: (defect: DefectDefinition) => void;
  onDuplicate: (defect: DefectDefinition) => void;
  onDelete: (defect: DefectDefinition) => void;
  showToast: (msg: string) => void;
}

const SEVERITY_CONFIG: Record<string, { label: string; cls: string; heroBg: string; textCls: string; icon: string }> = {
  CRITICAL: {
    label: 'Critical Defect (Zero Tolerance)',
    cls: 'bg-rose-100 text-rose-800 border-rose-300',
    heroBg: 'from-rose-600 via-red-700 to-slate-900',
    textCls: 'text-rose-700',
    icon: '🚨',
  },
  MAJOR: {
    label: 'Major Defect (AQL Penalty)',
    cls: 'bg-amber-100 text-amber-800 border-amber-300',
    heroBg: 'from-amber-600 via-orange-600 to-slate-900',
    textCls: 'text-amber-700',
    icon: '⚠️',
  },
  MINOR: {
    label: 'Minor Defect (Cosmetic)',
    cls: 'bg-blue-100 text-blue-800 border-blue-300',
    heroBg: 'from-blue-600 via-indigo-700 to-slate-900',
    textCls: 'text-blue-700',
    icon: 'ℹ️',
  },
};

const ZONE_LABELS: Record<string, { label: string; badge: string; desc: string }> = {
  ZONE_A_VISIBLE: {
    label: 'Zone A (Highly Prominent)',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Front chest, collar, upper body & face. Zero tolerance for visible flaws.',
  },
  ZONE_B_LESS_VISIBLE: {
    label: 'Zone B (Secondary Visible)',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Back body, outer sleeves, lower hem. Minor commercial tolerances apply.',
  },
  ZONE_C_INSIDE: {
    label: 'Zone C (Interior / Hidden)',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Inner lining, pocket bag, inside waistband. Structural standard applies.',
  },
  ZONE_A: {
    label: 'Zone A (Prominent)',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Front chest, collar, face. Zero tolerance.',
  },
  ZONE_B: {
    label: 'Zone B (Secondary)',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Back panels, outer sleeves. Standard tolerance.',
  },
  ZONE_C: {
    label: 'Zone C (Hidden)',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Interior seams, lining, pockets.',
  },
};

export function DefectDetailsPage({
  defect,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  showToast,
}: DefectDetailsPageProps) {
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const severityConfig = SEVERITY_CONFIG[defect.severity] || SEVERITY_CONFIG.MAJOR;
  const zoneConfig = ZONE_LABELS[defect.zone] || ZONE_LABELS.ZONE_A_VISIBLE;

  return (
    <div className="max-w-7xl mx-auto space-y-3.5 animate-in fade-in duration-200">
      {/* Top Action Bar - Exactly matching Buyer & Order module */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Defect Library Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-1.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                {defect.defectCode}
              </h2>
              {/* Severity Pill */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityConfig.cls}`}>
                <span>{severityConfig.icon}</span>
                <span>{defect.severity}</span>
              </span>
              {/* Zone Pill */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${zoneConfig.badge}`}>
                <span>{zoneConfig.label}</span>
              </span>
              {/* Category Pill */}
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {defect.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Standard: <span className="font-semibold text-slate-700">{defect.isoStandard || 'ISO 2859-1'}</span> • Location: <span className="text-slate-700 font-semibold">{defect.location || 'Assembly Seams'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons - Styled identically to Buyer & Order module */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              window.print();
              showToast('Ready for printing visual defect standard sheet');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Print Defect Specification Sheet"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Spec Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(defect)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Duplicate as new defect entry"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(defect)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Edit this defect entry"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Defect</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(defect)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
            title="Delete this defect entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* DUAL IMAGE COMPARISON HERO SECTION: DEFECT SAMPLE VS OK GOLDEN SAMPLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Hero Header */}
        <div className={`bg-gradient-to-r ${severityConfig.heroBg} px-5 py-3.5 text-white`}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                  {defect.defectCode}
                </span>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Rank #{defect.frequencyRank || 1} Floor Occurrence
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {defect.name}
              </h1>
              <p className="text-xs text-slate-100 max-w-3xl mt-0.5 leading-relaxed">
                {defect.description}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 text-right">
              <span className="text-[9px] text-white/70 block uppercase font-bold tracking-wider">Quality Standard</span>
              <span className="text-sm font-black font-mono text-white">{defect.isoStandard || 'ISO 2859-1'}</span>
              <span className="text-[10px] text-white/80 block mt-0.5">{defect.responsibleDepartment || 'Sewing QA'}</span>
            </div>
          </div>
        </div>

        {/* SIDE-BY-SIDE DUAL IMAGE COMPARISON CARDS */}
        <div className="p-3.5 bg-slate-50/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Visual Inspection Standard: Defect Sample vs. Approved OK Golden Sample</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Click image to enlarge</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. DEFECTIVE SAMPLE CARD */}
            <div className="bg-white rounded-xl border-2 border-rose-200 overflow-hidden shadow-xs hover:border-rose-300 transition-all flex flex-col">
              <div className="bg-rose-50 px-3.5 py-2 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                    Defective Sample (Rejected Flaw)
                  </span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  ✗ Not Acceptable
                </span>
              </div>

              <div
                onClick={() => setSelectedImageModal(defect.defectImageUrl || '')}
                className="relative h-40 sm:h-44 bg-slate-950 overflow-hidden cursor-pointer group flex items-center justify-center"
              >
                {defect.defectImageUrl ? (
                  <>
                    <img
                      src={defect.defectImageUrl}
                      alt={`Defect: ${defect.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View Full Image</span>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-1 opacity-50" />
                    <span>No defect image uploaded yet</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-rose-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold border border-rose-400">
                  Flaw: {defect.name}
                </div>
              </div>

              <div className="p-2.5 bg-rose-50/40 border-t border-rose-100 text-xs text-rose-950 space-y-0.5">
                <div className="font-bold flex items-center gap-1 text-rose-900 text-[11px]">
                  <span>Rejection Criteria:</span>
                </div>
                <p className="text-rose-800 leading-snug text-[11px]">
                  {defect.description || 'Presence of thread interruption, irregular loop formation, or surface flaw.'}
                </p>
              </div>
            </div>

            {/* 2. OK / APPROVED GOLDEN SAMPLE CARD */}
            <div className="bg-white rounded-xl border-2 border-emerald-200 overflow-hidden shadow-xs hover:border-emerald-300 transition-all flex flex-col">
              <div className="bg-emerald-50 px-3.5 py-2 border-b border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Approved Golden Sample (OK Standard)
                  </span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Benchmark Quality
                </span>
              </div>

              <div
                onClick={() => setSelectedImageModal(defect.okImageUrl || '')}
                className="relative h-40 sm:h-44 bg-slate-950 overflow-hidden cursor-pointer group flex items-center justify-center"
              >
                {defect.okImageUrl ? (
                  <>
                    <img
                      src={defect.okImageUrl}
                      alt={`Approved OK Standard for ${defect.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View Full Image</span>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-50" />
                    <span>No approved golden sample image uploaded yet</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-emerald-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-400">
                  Golden Standard: Pass
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/40 border-t border-emerald-100 text-xs text-emerald-950 space-y-0.5">
                <div className="font-bold flex items-center gap-1 text-emerald-900 text-[11px]">
                  <span>Acceptance Standard:</span>
                </div>
                <p className="text-emerald-800 leading-snug text-[11px]">
                  Continuous uniform stitch formation with balanced tension, clean fabric face, and exact SPI calibration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL FOR IMAGE FULLSCREEN PREVIEW */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-10 transition-colors"
            >
              ✕
            </button>
            <img
              src={selectedImageModal}
              alt="Enlarged visual"
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* SECTION 1: TECHNICAL CLASSIFICATION & QUALITY SPECIFICATIONS */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
            Technical Classification & Quality Specifications
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Quality Zone & Tolerance</div>
            <div className="text-xs font-black text-slate-900">{zoneConfig.label}</div>
            <p className="text-[11px] text-slate-500 leading-tight">{zoneConfig.desc}</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Garment Location</div>
            <div className="text-xs font-black text-slate-900">{defect.location || 'All Seams'}</div>
            <p className="text-[11px] text-slate-500 leading-tight">Primary anatomical checkpoint during inspection.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">ISO / ASTM Standard</div>
            <div className="text-xs font-black font-mono text-blue-700">{defect.isoStandard || 'ISO 2859-1'}</div>
            <p className="text-[11px] text-slate-500 leading-tight">Referenced in international buyer quality manuals.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Severity Tier</div>
            <div className={`text-xs font-black ${severityConfig.textCls}`}>{severityConfig.label}</div>
            <p className="text-[11px] text-slate-500 leading-tight">AQL classification score & batch impact.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Responsible Department</div>
            <div className="text-xs font-black text-slate-900">{defect.responsibleDepartment || 'Sewing Department'}</div>
            <p className="text-[11px] text-slate-500 leading-tight">Production section accountable for preventative audit.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Inspection Checkpoint</div>
            <div className="text-xs font-black text-slate-900">{defect.inspectionCheckpoint || 'End-Line Audit'}</div>
            <p className="text-[11px] text-slate-500 leading-tight">Audit station where this defect must be intercepted.</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: ROOT CAUSE ANALYSIS */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
          <Activity className="w-3.5 h-3.5 text-rose-600" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
            Recorded Root Cause
          </h3>
        </div>

        <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200">
          <span className="text-xs font-bold text-rose-900 block mb-0.5">Root Cause on Record:</span>
          <p className="text-xs text-rose-800 leading-relaxed font-sans">
            {defect.rootCause || defect.rootCauseHint || 'No specific root cause recorded for this defect entry.'}
          </p>
        </div>
      </div>

      {/* SECTION 3: CORRECTIVE & PREVENTIVE ACTION PLAN (CAPA) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
          <Wrench className="w-3.5 h-3.5 text-emerald-600" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
            Corrective & Preventive Action Plan (CAPA)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>⚡</span> 1. Immediate Containment Action (Floor Stoppage):
            </span>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              {defect.correctiveAction || defect.correctiveActionHint || 'Immediately stop the workstation. Quarantine the previous 30 garments and conduct 100% rework.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span>🛡️</span> 2. Long-Term Preventive Engineering Remedy:
            </span>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              {defect.suggestedRemedy || 'Calibrate machine tooling, install magnetic guide folders, and incorporate daily needle inspection sheets.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: FLOOR OPERATIONAL GUIDANCE & QUALITY REMARKS */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
            Floor Operational Guidance & Quality Remarks
          </h3>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-1 font-sans">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <span>📋</span> Quality Auditor Floor Notes:
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            {defect.remarks || 'Standard visual inspection guideline. Floor inspectors must cross-reference this sample card whenever seam abnormalities are detected during line audits.'}
          </p>
        </div>
      </div>
    </div>
  );
}
