'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Check,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Tag,
  Layers,
  Sparkles,
  BookOpen,
  Wrench,
  Activity,
  FileText,
  Sliders,
} from 'lucide-react';
import { DefectDefinition } from '@/lib/types/modules';
import { DefectSeverity } from '@/lib/types/erp';

interface DefectEntryPageProps {
  mode?: 'add' | 'edit';
  defect?: DefectDefinition | null;
  onSave: (defect: DefectDefinition) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const SAMPLE_DEFECT_IMAGES = [
  { name: 'Broken Stitch', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60' },
  { name: 'Puckering Seam', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=60' },
  { name: 'Needle Cut Hole', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60' },
  { name: 'Oil Stain Smear', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60' },
];

const SAMPLE_OK_IMAGES = [
  { name: 'Clean Seam', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60' },
  { name: 'Pressed Placket', url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
  { name: 'Perfect Hem', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60' },
  { name: 'Golden Sample', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60' },
];

export function DefectEntryPage({
  mode = 'add',
  defect,
  onSave,
  onCancel,
  showToast,
}: DefectEntryPageProps) {
  // Form State
  const [defectCode, setDefectCode] = useState(
    defect?.defectCode || `DEF-${Math.floor(100 + Math.random() * 900)}`
  );
  const [name, setName] = useState(defect?.name || '');
  const [category, setCategory] = useState<string>(defect?.category || 'SEWING');
  const [severity, setSeverity] = useState<DefectSeverity>(defect?.severity || 'MAJOR');
  const [zone, setZone] = useState<string>(defect?.zone || 'ZONE_A_VISIBLE');
  const [location, setLocation] = useState<string>(defect?.location || 'Side Seam & Armhole');
  const [isoStandard, setIsoStandard] = useState<string>(defect?.isoStandard || 'ISO 2859-1');
  const [description, setDescription] = useState<string>(defect?.description || '');

  // Dual Images: Defect vs OK Standard
  const [defectImageUrl, setDefectImageUrl] = useState<string>(
    defect?.defectImageUrl || SAMPLE_DEFECT_IMAGES[0].url
  );
  const [okImageUrl, setOkImageUrl] = useState<string>(
    defect?.okImageUrl || SAMPLE_OK_IMAGES[0].url
  );

  // Root Cause, CAPA, Remarks
  const [rootCause, setRootCause] = useState<string>(
    defect?.rootCause || defect?.rootCauseHint || ''
  );
  const [correctiveAction, setCorrectiveAction] = useState<string>(
    defect?.correctiveAction || defect?.correctiveActionHint || ''
  );
  const [suggestedRemedy, setSuggestedRemedy] = useState<string>(
    defect?.suggestedRemedy || ''
  );
  const [remarks, setRemarks] = useState<string>(defect?.remarks || '');
  const [responsibleDepartment, setResponsibleDepartment] = useState<string>(
    defect?.responsibleDepartment || 'Sewing Department'
  );
  const [inspectionCheckpoint, setInspectionCheckpoint] = useState<string>(
    defect?.inspectionCheckpoint || 'Sewing In-Line & End-Line Audit'
  );
  const [frequencyRank, setFrequencyRank] = useState<number>(defect?.frequencyRank || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please enter a defect name');
      return;
    }

    const payload: DefectDefinition = {
      id: defect?.id || `def-${Date.now()}`,
      defectCode,
      name,
      category,
      severity,
      zone,
      location,
      isoStandard,
      description,
      defectImageUrl,
      okImageUrl,
      rootCause,
      rootCauseHint: rootCause,
      correctiveAction,
      correctiveActionHint: correctiveAction,
      suggestedRemedy,
      remarks,
      responsibleDepartment,
      inspectionCheckpoint,
      frequencyRank: Number(frequencyRank),
      status: defect?.status || 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
      {/* Top Navigation Bar - Identical to Buyer & Order Module */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Cancel & return to catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{mode === 'edit' ? 'Edit Defect Specification' : 'Register New Quality Defect'}</span>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {defectCode}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              All-in-one defect definition featuring dual visual standards, ISO classification, root cause analysis & CAPA
            </p>
          </div>
        </div>

        {/* Action Buttons - Styled identically to Buyer & Order module */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{mode === 'edit' ? 'Save Changes' : 'Save & Publish Defect'}</span>
          </button>
        </div>
      </div>

      {/* DUAL IMAGE UPLOAD & PREVIEW SECTION: DEFECT SAMPLE VS OK GOLDEN SAMPLE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>Dual Visual Standard: Defective Sample vs. OK Golden Sample</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Provide both the rejected flaw photo and the approved standard reference for factory floor alignment
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. DEFECT IMAGE INPUT & PREVIEW */}
          <div className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  1. Defective Sample Image (Flaw / Issue)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Reject Sample
              </span>
            </div>

            {/* Preview Box */}
            <div className="h-44 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center relative border border-rose-200">
              {defectImageUrl ? (
                <img
                  src={defectImageUrl}
                  alt="Defect Sample Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <Upload className="w-6 h-6 mx-auto mb-1 text-slate-500" />
                  <span>No image selected</span>
                </div>
              )}
            </div>

            {/* Image URL Input */}
            <div>
              <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                Defect Image URL or Upload Path:
              </label>
              <input
                type="text"
                value={defectImageUrl}
                onChange={(e) => setDefectImageUrl(e.target.value)}
                placeholder="https://... or upload link"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Quick Preset Pickers */}
            <div>
              <span className="block text-[10px] font-semibold text-slate-500 mb-1">Quick Garment Defect Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_DEFECT_IMAGES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setDefectImageUrl(preset.url)}
                    className="px-2 py-1 text-[10px] font-medium rounded-md bg-white border border-rose-200 hover:bg-rose-100/50 text-rose-800 transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. OK GOLDEN SAMPLE IMAGE INPUT & PREVIEW */}
          <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  2. Approved Golden Sample Image (OK Standard)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Golden Standard
              </span>
            </div>

            {/* Preview Box */}
            <div className="h-44 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center relative border border-emerald-200">
              {okImageUrl ? (
                <img
                  src={okImageUrl}
                  alt="OK Standard Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <Upload className="w-6 h-6 mx-auto mb-1 text-slate-500" />
                  <span>No image selected</span>
                </div>
              )}
            </div>

            {/* Image URL Input */}
            <div>
              <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                Approved Standard Image URL or Upload Path:
              </label>
              <input
                type="text"
                value={okImageUrl}
                onChange={(e) => setOkImageUrl(e.target.value)}
                placeholder="https://... or upload link"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Preset Pickers */}
            <div>
              <span className="block text-[10px] font-semibold text-slate-500 mb-1">Quick Golden Sample Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_OK_IMAGES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setOkImageUrl(preset.url)}
                    className="px-2 py-1 text-[10px] font-medium rounded-md bg-white border border-emerald-200 hover:bg-emerald-100/50 text-emerald-800 transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLASSIFICATION & QUALITY METADATA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Classification, Standards & Garment Quality Zone</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Defect Code</label>
            <input
              type="text"
              value={defectCode}
              onChange={(e) => setDefectCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Defect Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
              placeholder="e.g. Broken Stitch / Thread Severance"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
            >
              <option value="CRITICAL">🚨 Critical (0 Tolerance / Immediate Fail)</option>
              <option value="MAJOR">⚠️ Major (AQL 2.5/1.5 Penalty)</option>
              <option value="MINOR">ℹ️ Minor (Cosmetic Tolerance)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Process Domain / Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="SEWING">Sewing & Stitching</option>
              <option value="FABRIC">Fabric & Weaving / Knits</option>
              <option value="STAIN_SOIL">Stain / Soil / Oil</option>
              <option value="MEASUREMENT">Measurement / Dimension</option>
              <option value="FINISHING">Finishing & Pressing</option>
              <option value="PACKAGING">Packaging & Barcodes</option>
              <option value="CUTTING">Cutting & Spreading</option>
              <option value="WASHING">Washing & Dyeing</option>
              <option value="TRIMS_ACCESSORIES">Trims, Buttons & Zippers</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Garment Quality Zone</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="ZONE_A_VISIBLE">Zone A (Front Chest, Collar - Highly Visible)</option>
              <option value="ZONE_B_LESS_VISIBLE">Zone B (Back Body, Outer Sleeves - Secondary)</option>
              <option value="ZONE_C_INSIDE">Zone C (Interior Seams, Lining, Pocket - Hidden)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ISO / Industry Standard</label>
            <input
              type="text"
              value={isoStandard}
              onChange={(e) => setIsoStandard(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="e.g. ISO 2859-1 / ASTM D3990"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Garment Anatomical Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Side Seam & Armhole"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Responsible Section</label>
            <input
              type="text"
              value={responsibleDepartment}
              onChange={(e) => setResponsibleDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Sewing Department Line 04"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Floor Occurrence Rank</label>
            <input
              type="number"
              min="1"
              max="100"
              value={frequencyRank}
              onChange={(e) => setFrequencyRank(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Inspection Checkpoint</label>
            <input
              type="text"
              value={inspectionCheckpoint}
              onChange={(e) => setInspectionCheckpoint(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Sewing In-Line 100% Workstation Audit"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block font-semibold text-slate-700 mb-1">Technical Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of defect visual appearance and how to identify on the line..."
            />
          </div>
        </div>
      </div>

      {/* ROOT CAUSE, CAPA & REMARKS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-600" />
            <span>Root Cause, Corrective Action Plan (CAPA) & Floor Guidance</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-rose-800 mb-1">
              Ishikawa Root Cause Analysis:
            </label>
            <textarea
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Identify machine burr, needle timing, tension disc wear, or yarn brittleness..."
            />
          </div>

          <div>
            <label className="block font-semibold text-amber-800 mb-1">
              Immediate Floor Containment Action:
            </label>
            <textarea
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Immediate floor stoppage, bundle sorting, or machine re-timing required..."
            />
          </div>

          <div>
            <label className="block font-semibold text-emerald-800 mb-1">
              Long-Term Preventive Remedy (Engineering):
            </label>
            <input
              type="text"
              value={suggestedRemedy}
              onChange={(e) => setSuggestedRemedy(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Tooling upgrade, folder guide install, or needle inspection protocol..."
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Auditor Remarks & Floor Instructions:
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Guidance notes for floor inspectors..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{mode === 'edit' ? 'Save Changes' : 'Save & Publish Defect'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
