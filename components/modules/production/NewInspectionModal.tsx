'use client';

import React, { useState } from 'react';
import { X, ClipboardList, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { InspectionRecord, InspectionStage, InspectionStatus } from '@/lib/types/erp';

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<InspectionRecord, 'id' | 'createdAt' | 'inspectionCode'>) => void;
}

const STAGES: { value: InspectionStage; label: string; description: string }[] = [
  { value: 'FABRIC_INWARD', label: 'Fabric Inward (4-Point)', description: 'Inbound raw fabric AQL 4-point scoring' },
  { value: 'CUTTING_INSPECTION', label: 'Cutting & Spreading', description: 'Lay marker, splice & shade inspection' },
  { value: 'SEWING_IN_LINE', label: 'Sewing In-Line QC', description: 'Inline operation quality check by roaming inspector' },
  { value: 'END_LINE_QC', label: 'End-Line QC Audit', description: 'AQL 2.5 sampling at end of sewing line' },
  { value: 'FINISHING_PACKING', label: 'Finishing & Packing', description: 'Packing, measurement, label & barcode verification' },
];

const BUYERS = [
  'H&M Hennes & Mauritz', 'Inditex (Zara)', 'Nike Apparel', 'Adidas', 'PVH (Tommy Hilfiger)',
  'Gap Inc.', 'Fast Retailing (Uniqlo)', 'M&S (Marks & Spencer)', 'Next PLC',
];

const INSPECTORS = [
  'Tania Ahmed (QA Manager)', 'Rafiqul Islam (Senior QC)', 'Kazi Farhan (QC Inspector)',
  'Nazmul Haque (Inline QC)', 'Sharmin Akter (End-Line QC)',
];

export function NewInspectionModal({ isOpen, onClose, onSave }: NewInspectionModalProps) {
  const [stage, setStage] = useState<InspectionStage>('END_LINE_QC');
  const [styleNumber, setStyleNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [buyer, setBuyer] = useState('');
  const [inspector, setInspector] = useState('');
  const [sampleSize, setSampleSize] = useState('');
  const [passCount, setPassCount] = useState('');
  const [majorDefects, setMajorDefects] = useState('0');
  const [minorDefects, setMinorDefects] = useState('0');
  const [criticalDefects, setCriticalDefects] = useState('0');
  const [defectNotes, setDefectNotes] = useState('');
  const [error, setError] = useState('');

  const defectCount = (parseInt(majorDefects) || 0) + (parseInt(minorDefects) || 0) + (parseInt(criticalDefects) || 0);
  const defectRate = sampleSize ? (defectCount / parseInt(sampleSize) * 100).toFixed(1) : '0';
  const passRate = sampleSize && passCount ? (parseInt(passCount) / parseInt(sampleSize) * 100).toFixed(1) : '0';

  const getAutoStatus = (): InspectionStatus => {
    const crit = parseInt(criticalDefects) || 0;
    const maj = parseInt(majorDefects) || 0;
    const ss = parseInt(sampleSize) || 1;
    if (crit > 0) return 'REJECTED';
    // AQL 2.5: accept if major <= 2% of sample, conditional if <= 4%
    const majRate = (maj / ss) * 100;
    if (majRate > 4) return 'REJECTED';
    if (majRate > 2) return 'CONDITIONAL_PASS';
    return 'PASSED';
  };

  const status = getAutoStatus();

  const handleSave = () => {
    if (!styleNumber) { setError('Style number is required.'); return; }
    if (!lotNumber) { setError('Lot number is required.'); return; }
    if (!buyer) { setError('Buyer is required.'); return; }
    if (!inspector) { setError('Inspector name is required.'); return; }
    if (!sampleSize || parseInt(sampleSize) <= 0) { setError('Valid sample size is required.'); return; }
    if (!passCount) { setError('Pass count is required.'); return; }

    onSave({
      styleNumber,
      lotNumber,
      stage,
      sampleSize: parseInt(sampleSize),
      passCount: parseInt(passCount),
      defectCount,
      majorDefects: parseInt(majorDefects) || 0,
      minorDefects: parseInt(minorDefects) || 0,
      criticalDefects: parseInt(criticalDefects) || 0,
      status,
      inspectorId: `usr_${inspector.toLowerCase().split(' ')[0]}`,
      inspectorName: inspector.split(' (')[0],
      buyer,
      defects: defectNotes ? [{ id: `d-${Date.now()}`, defectType: defectNotes, severity: parseInt(criticalDefects) > 0 ? 'CRITICAL' : parseInt(majorDefects) > 0 ? 'MAJOR' : 'MINOR', count: defectCount, location: 'Various' }] : [],
    });

    onClose();
    setStage('END_LINE_QC'); setStyleNumber(''); setLotNumber(''); setBuyer('');
    setInspector(''); setSampleSize(''); setPassCount(''); setMajorDefects('0');
    setMinorDefects('0'); setCriticalDefects('0'); setDefectNotes(''); setError('');
  };

  if (!isOpen) return null;

  const statusColors = {
    PASSED: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    CONDITIONAL_PASS: 'bg-amber-50 border-amber-200 text-amber-800',
    REJECTED: 'bg-rose-50 border-rose-200 text-rose-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Log New AQL Inspection</h2>
              <p className="text-xs text-blue-100">ISO 2859-1 / AQL 2.5 Sampling Audit Record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stage Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">QC Checkpoint Stage *</label>
            <div className="grid grid-cols-1 gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStage(s.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    stage === s.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="font-semibold text-sm">{s.label}</div>
                  <div className={`text-[11px] mt-0.5 ${stage === s.value ? 'text-blue-100' : 'text-slate-400'}`}>{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style, Lot, Buyer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Style / Article Number *</label>
              <input
                value={styleNumber}
                onChange={(e) => setStyleNumber(e.target.value)}
                placeholder="e.g. STY-HM-2026-01"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Lot / Batch Number *</label>
              <input
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="e.g. LOT-TX-9041A"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Buyer Brand *</label>
              <select
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">— Select Buyer —</option>
                {BUYERS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">QC Inspector / Auditor *</label>
              <select
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">— Select Inspector —</option>
                {INSPECTORS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Sampling Results */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              AQL 2.5 Sampling Results
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sample Size (Pcs) *</label>
                <input
                  type="number"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pass Count (Pcs) *</label>
                <input
                  type="number"
                  value={passCount}
                  onChange={(e) => setPassCount(e.target.value)}
                  placeholder="e.g. 192"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-rose-600 mb-1">Critical Defects</label>
                <input
                  type="number"
                  value={criticalDefects}
                  onChange={(e) => setCriticalDefects(e.target.value)}
                  className="w-full border border-rose-200 rounded-lg px-2.5 py-2 text-sm font-bold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-rose-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-600 mb-1">Major Defects</label>
                <input
                  type="number"
                  value={majorDefects}
                  onChange={(e) => setMajorDefects(e.target.value)}
                  className="w-full border border-amber-200 rounded-lg px-2.5 py-2 text-sm font-bold text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Minor Defects</label>
                <input
                  type="number"
                  value={minorDefects}
                  onChange={(e) => setMinorDefects(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Live Verdict */}
            {sampleSize && (
              <div className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold ${statusColors[status]}`}>
                <div>
                  <div className="text-[11px] font-semibold opacity-70">AQL Verdict (Auto-Calculated)</div>
                  <div className="text-base">{status.replace('_', ' ')}</div>
                </div>
                <div className="text-right text-[11px] font-semibold opacity-80">
                  <div>Pass Rate: {passRate}%</div>
                  <div>Defect Rate: {defectRate}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Defect Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Defect Description / Notes</label>
            <textarea
              value={defectNotes}
              onChange={(e) => setDefectNotes(e.target.value)}
              rows={2}
              placeholder="Describe main defects found: type, location, severity observation..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Submit Inspection Record
          </button>
        </div>
      </div>
    </div>
  );
}
