'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  Layers,
  Thermometer,
  Droplets,
  Calendar,
  User,
  Building2,
  Tag,
  Maximize2,
  FileCheck,
  AlertTriangle,
  Wrench,
  Activity,
  Award,
} from 'lucide-react';
import { LabTestRecord } from '@/lib/types/modules';

interface TestDetailsPageProps {
  test: LabTestRecord;
  onBack: () => void;
  onEdit: (test: LabTestRecord) => void;
  onDuplicate: (test: LabTestRecord) => void;
  onDelete: (test: LabTestRecord) => void;
  showToast: (msg: string) => void;
}

const VERDICT_CONFIG = {
  PASS: {
    label: 'PASSED QUALITY CRITERIA',
    badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    heroBg: 'from-emerald-600 via-teal-700 to-slate-900',
    icon: CheckCircle2,
    tagColor: 'bg-emerald-500',
  },
  FAIL: {
    label: 'FAILED - OUT OF SPECIFICATION',
    badgeCls: 'bg-rose-100 text-rose-800 border-rose-300',
    heroBg: 'from-rose-600 via-red-700 to-slate-900',
    icon: XCircle,
    tagColor: 'bg-rose-500',
  },
  PENDING: {
    label: 'TESTING IN PROGRESS / PENDING',
    badgeCls: 'bg-amber-100 text-amber-800 border-amber-300',
    heroBg: 'from-amber-600 via-orange-600 to-slate-900',
    icon: Clock,
    tagColor: 'bg-amber-500',
  },
};

export function TestDetailsPage({
  test,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  showToast,
}: TestDetailsPageProps) {
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const verdictConfig = VERDICT_CONFIG[test.verdict] || VERDICT_CONFIG.PENDING;
  const VerdictIcon = verdictConfig.icon;

  return (
    <div className="max-w-7xl mx-auto space-y-3.5 animate-in fade-in duration-200">
      {/* TOP ACTION BAR - Matching Buyer & Order Module */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Test Registry"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                {test.testReportNo}
              </h2>
              {/* Verdict Pill */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${verdictConfig.badgeCls}`}>
                <VerdictIcon className="w-3.5 h-3.5" />
                <span>{test.verdict}</span>
              </span>
              {/* Test Type Pill */}
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                {test.testType.toString().replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Standard: <span className="font-semibold text-slate-700">{test.testStandard}</span> • Style: <span className="text-slate-700 font-semibold">{test.styleNumber}</span> • Batch: <span className="text-slate-700 font-mono font-semibold">{test.fabricBatch}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons - Styled identically to Buyer & Order module */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              window.print();
              showToast(`Prepared formal lab certificate for ${test.testReportNo}`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Print Official Accredited Lab Test Certificate"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(test)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Duplicate as new test report entry"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(test)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Edit this lab test record"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Test</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(test)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
            title="Delete this lab test record"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* HERO BANNER SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className={`bg-gradient-to-r ${verdictConfig.heroBg} px-5 py-3.5 text-white`}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                  {test.testReportNo}
                </span>
                <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <VerdictIcon className="w-3 h-3" />
                  <span>{verdictConfig.label}</span>
                </span>
                {test.buyerName && (
                  <span className="text-[11px] font-semibold bg-white/15 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    Buyer: {test.buyerName}
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {test.testType.toString().replace(/_/g, ' ')}
              </h1>
              <p className="text-xs text-slate-100 max-w-3xl mt-0.5 leading-relaxed">
                {test.garmentItem || 'Garment Textile Material'} • Standard: <strong className="text-white font-mono">{test.testStandard}</strong>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20 text-right space-y-0.5">
              <span className="text-[10px] text-white/70 block uppercase font-bold tracking-wider">Accredited Laboratory</span>
              <span className="text-xs font-bold text-white block">{test.labName}</span>
              <span className="text-[10px] text-white/80 block font-mono">Date: {test.testDate}</span>
            </div>
          </div>
        </div>

        {/* DUAL VISUALS: TEST APPARATUS & TESTED SPECIMEN RESULT */}
        <div className="p-3.5 sm:p-4 bg-slate-50/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
              <span>Visual Laboratory Evidence: Testing Apparatus & Specimen Result</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Click photo to enlarge</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. TEST APPARATUS & TESTING PROCEDURE PHOTO */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col">
              <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Testing Apparatus & Standard Setup
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Equipment Standard
                </span>
              </div>

              <div
                onClick={() => setSelectedImageModal(test.testImageUrl || '')}
                className="relative h-40 sm:h-44 bg-slate-950 overflow-hidden cursor-pointer group flex items-center justify-center"
              >
                {test.testImageUrl ? (
                  <>
                    <img
                      src={test.testImageUrl}
                      alt="Testing Apparatus"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                      <Maximize2 className="w-4 h-4" />
                      <span>View Full Image</span>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <FlaskConical className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                    <span>No apparatus photo uploaded</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-700">
                  {test.testStandard}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-700 space-y-0.5">
                <span className="font-bold text-slate-900 block text-[11px]">Instrument Used:</span>
                <p className="text-slate-600 text-[11px] leading-tight">
                  {test.apparatusUsed || 'Calibrated reference textile testing equipment adhering to ISO/AATCC specifications.'}
                </p>
              </div>
            </div>

            {/* 2. TESTED SAMPLE SPECIMEN RESULT PHOTO */}
            <div className={`bg-white rounded-xl border-2 ${test.verdict === 'PASS' ? 'border-emerald-200 hover:border-emerald-300' : test.verdict === 'FAIL' ? 'border-rose-200 hover:border-rose-300' : 'border-amber-200 hover:border-amber-300'} overflow-hidden shadow-xs transition-all flex flex-col`}>
              <div className={`px-3 py-2 border-b flex items-center justify-between ${test.verdict === 'PASS' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : test.verdict === 'FAIL' ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                <div className="flex items-center gap-2">
                  <VerdictIcon className={`w-3.5 h-3.5 ${test.verdict === 'PASS' ? 'text-emerald-600' : test.verdict === 'FAIL' ? 'text-rose-600' : 'text-amber-600'}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Tested Fabric Specimen / Swatch Result
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${verdictConfig.badgeCls}`}>
                  {test.verdict === 'PASS' ? '✓ Criteria Met' : test.verdict === 'FAIL' ? '✗ Out of Spec' : '⏳ Pending'}
                </span>
              </div>

              <div
                onClick={() => setSelectedImageModal(test.specimenImageUrl || '')}
                className="relative h-40 sm:h-44 bg-slate-950 overflow-hidden cursor-pointer group flex items-center justify-center"
              >
                {test.specimenImageUrl ? (
                  <>
                    <img
                      src={test.specimenImageUrl}
                      alt="Tested Specimen Result"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                      <Maximize2 className="w-4 h-4" />
                      <span>View Full Image</span>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                    <span>No specimen swatch photo uploaded</span>
                  </div>
                )}
                <div className={`absolute bottom-2 left-2 ${verdictConfig.tagColor} text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs`}>
                  Result: {test.actualResult}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-700 space-y-0.5">
                <span className="font-bold text-slate-900 block text-[11px]">Evaluation Standard:</span>
                <p className="text-slate-600 text-[11px] leading-tight">
                  Requirement: <strong className="text-slate-800">{test.requirement}</strong> • Actual: <strong className={test.verdict === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>{test.actualResult}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
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
              alt="Enlarged visual evidence"
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* SECTION 1: TEST SPECIFICATION & TECHNICAL PARAMETERS */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
          <FileCheck className="w-3.5 h-3.5 text-blue-600" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
            Test Parameter & ISO Standard Specification
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Buyer Mandated Requirement</div>
            <div className="text-xs font-black text-slate-900 font-mono">{test.requirement}</div>
            <p className="text-[11px] text-slate-500 leading-tight">Contractual threshold defined in buyer technical package.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Actual Measured Lab Result</div>
            <div className={`text-xs font-black font-mono ${test.verdict === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {test.actualResult}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">Quantitative value recorded from test apparatus.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Test Standard Reference</div>
            <div className="text-xs font-black text-blue-700 font-mono">{test.testStandard}</div>
            <p className="text-[11px] text-slate-500 leading-tight">International ISO / AATCC / ASTM test methodology.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Style Number & Lot</div>
            <div className="text-xs font-black text-slate-900">{test.styleNumber}</div>
            <p className="text-[11px] text-slate-500 font-mono leading-tight">Fabric Batch: {test.fabricBatch}</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Certified Lab Officer</div>
            <div className="text-xs font-black text-slate-900">{test.testedBy}</div>
            <p className="text-[11px] text-slate-500 leading-tight">Accredited QA technician signing test report.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Overall Compliance Verdict</div>
            <div className={`text-xs font-black ${test.verdict === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {verdictConfig.label}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">Final QA release authorization for cutting/shipment.</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: ENVIRONMENTAL CONDITIONING & CALIBRATION TRACEABILITY */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
          <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
            Laboratory Environmental Conditioning & Traceability
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ambient Temperature:</span>
            </div>
            <div className="text-sm font-black font-mono text-emerald-950">
              {test.temperatureCelsius ? `${test.temperatureCelsius}°C` : '20.0°C ± 2°C'}
            </div>
            <p className="text-[11px] text-emerald-800 leading-tight">ISO 139 standard atmosphere compliance.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Relative Humidity:</span>
            </div>
            <div className="text-sm font-black font-mono text-blue-950">
              {test.humidityPercentage ? `${test.humidityPercentage}% RH` : '65% ± 4% RH'}
            </div>
            <p className="text-[11px] text-blue-800 leading-tight">Calibrated hygrometer continuous logging.</p>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Specimen Pre-Conditioning:</span>
            </div>
            <div className="text-sm font-black font-mono text-purple-950">
              {test.conditioningHours ? `${test.conditioningHours} Hours` : '24 Hours'}
            </div>
            <p className="text-[11px] text-purple-800 leading-tight">Relaxation conditioning on wire racks prior to test.</p>
          </div>
        </div>
      </div>

      {/* SECTION 3: TECHNICAL ROOT CAUSE & CAPA (IF RECORDED OR FAILED) */}
      {(test.rootCause || test.correctiveAction || test.verdict === 'FAIL') && (
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <Activity className="w-3.5 h-3.5 text-rose-600" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
              Technical Root Cause Investigation & Corrective Action (CAPA)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200 space-y-1">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <span>🔍</span> Root Cause on Record:
              </span>
              <p className="text-rose-800 leading-relaxed text-[11px]">
                {test.rootCause || 'Root cause investigation underway with wet processing and chemical finish supplier.'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span>🛡️</span> Corrective & Preventive Action Plan:
              </span>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                {test.correctiveAction || 'Quarantine batch, re-process with modified stenter parameters, and submit re-test specimens.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: LABORATORY REMARKS & AUDITOR NOTES */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
          <Award className="w-3.5 h-3.5 text-blue-600" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
            Accredited Laboratory Remarks & Quality Authorization
          </h3>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-1 font-sans">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <span>📋</span> Laboratory Floor Notes:
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            {test.remarks || 'Test conducted strictly in accordance with accredited ISO/IEC 17025 standard operating procedures. Results relate only to the specimen lot tested and are cross-referenced with production cut plans.'}
          </p>
        </div>
      </div>
    </div>
  );
}
