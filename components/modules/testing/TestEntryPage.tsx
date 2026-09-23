'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Check,
  Upload,
  Image as ImageIcon,
  FlaskConical,
  Layers,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Thermometer,
  Droplets,
  Activity,
  Wrench,
  FileCheck,
} from 'lucide-react';
import { LabTestRecord, LabTestType } from '@/lib/types/modules';

interface TestEntryPageProps {
  mode?: 'add' | 'edit';
  test?: LabTestRecord | null;
  onSave: (test: LabTestRecord) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const SAMPLE_APPARATUS_IMAGES = [
  { name: 'GSM Cutter & Precision Balance', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=700&auto=format&fit=crop&q=60' },
  { name: 'Wascator Lab Washer (Shrinkage)', url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=700&auto=format&fit=crop&q=60' },
  { name: 'Electronic Crockmeter (Rubbing)', url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=700&auto=format&fit=crop&q=60' },
  { name: 'Launder-Ometer (Wash Fastness)', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=700&auto=format&fit=crop&q=60' },
];

const SAMPLE_SPECIMEN_IMAGES = [
  { name: 'Single Jersey Swatch (Passed)', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=700&auto=format&fit=crop&q=60' },
  { name: 'Shrinkage Template Grid', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&auto=format&fit=crop&q=60' },
  { name: 'Multi-Fiber Adjacent Strip', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=60' },
  { name: 'Tensile Rupture Specimen', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=700&auto=format&fit=crop&q=60' },
];

const METHOD_PRESETS: Record<string, { standard: string; req: string; apparatus: string; resultExample: string }> = {
  GSM_WEIGHT: {
    standard: 'ASTM D3776 / ISO 3801',
    req: '180 GSM ± 5% (171.0 - 189.0 GSM)',
    apparatus: 'James Heal 100 cm² Circular Sample Cutter & Ohaus Pioneer Precision Balance (0.01g)',
    resultExample: '182.4 GSM',
  },
  DIMENSIONAL_SHRINKAGE: {
    standard: 'ISO 6330:2021 / ISO 5077 / AATCC 135',
    req: 'Length: -5.0% max / Width: -4.0% max / Spirality < 4.0%',
    apparatus: 'Electrolux Wascator FOM71 CLS Reference Lab Washer & Drytec Tumble Dryer',
    resultExample: 'Length: -3.2% / Width: -2.8% / Spirality: 1.8%',
  },
  COLOR_FASTNESS_WASHING: {
    standard: 'ISO 105-C06:2010 A2S (40°C)',
    req: 'Color Change: Grade 4.0 min / Multi-fiber Staining: Grade 3-4 min',
    apparatus: 'Roaches Washtec Rotary Launder-Ometer with stainless steel canisters',
    resultExample: 'Color Change: Grade 4.0 / Multi-fiber: Grade 4.0',
  },
  COLOR_FASTNESS_CROCKING: {
    standard: 'AATCC 8 / ISO 105-X12',
    req: 'Dry Rubbing: Grade 4.0 min / Wet Rubbing: Grade 3.0 min',
    apparatus: 'Electronic Crockmeter with standard square white cotton lawn cloth (9 N load)',
    resultExample: 'Dry: Grade 4.5 / Wet: Grade 3.5',
  },
  TENSILE_STRENGTH: {
    standard: 'ASTM D5034 Grab Method / ISO 13934-1',
    req: 'Warp: 450 N min / Weft: 350 N min',
    apparatus: 'Instron 3365 Universal Constant Rate of Extension (CRE) Tensile Testing Machine',
    resultExample: 'Warp: 468 N / Weft: 362 N',
  },
  TEAR_STRENGTH: {
    standard: 'ISO 13937-1:2000 / ASTM D1424',
    req: 'Warp: 20.0 N min / Weft: 18.0 N min',
    apparatus: 'Digital Elmendorf Falling Pendulum Tear Strength Tester with 32N pendulum',
    resultExample: 'Warp: 22.4 N / Weft: 19.8 N',
  },
  PILLING_RESISTANCE: {
    standard: 'ISO 12945-2:2020 / ASTM D4970',
    req: 'Grade 3.5 minimum after 2,000 revolutions / Grade 3.0 after 5,000 revs',
    apparatus: 'Martindale Abrasion & Pilling Tester (Lissajous figure motion)',
    resultExample: 'Grade 4.0 at 2,000 revs / Grade 3.5 at 5,000 revs',
  },
  PH_VALUE: {
    standard: 'ISO 3071:2020 / AATCC 81',
    req: 'pH 4.0 to 7.5 (Skin contact standard compliant)',
    apparatus: 'Mettler Toledo SevenDirect pH Meter with temperature compensation',
    resultExample: 'pH 6.4 (Neutral / Safe Skin Contact)',
  },
  BUTTON_PULL_STRENGTH: {
    standard: '16 CFR 1500.51-53 / ASTM F963',
    req: '70 N (17 lbs) continuous pull for 10 seconds with zero detachment',
    apparatus: 'SafQ Pneumatic Snap & Button Attachment Security Pull Tester',
    resultExample: 'Holds 85 N for 15s without detachment or fabric tear',
  },
  WATER_REPELLENCY: {
    standard: 'AATCC 22 / ISO 4920 Spray Rating',
    req: 'Initial: Grade 90 min / After 5 Washes: Grade 80 min',
    apparatus: 'AATCC Standard Spray Tester with 45-degree angle test hoop & deionized water funnel',
    resultExample: 'Initial: Grade 100 (ISO 5) / After 5 Washes: Grade 90 (ISO 4)',
  },
};

export function TestEntryPage({
  mode = 'add',
  test,
  onSave,
  onCancel,
  showToast,
}: TestEntryPageProps) {
  // Form State
  const [testReportNo, setTestReportNo] = useState(
    test?.testReportNo || `LAB-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [styleNumber, setStyleNumber] = useState(test?.styleNumber || 'STY-TS-2026');
  const [fabricBatch, setFabricBatch] = useState(test?.fabricBatch || 'LOT-FB-8840');
  const [orderNumber, setOrderNumber] = useState(test?.orderNumber || 'PO-HM-99201');
  const [buyerName, setBuyerName] = useState(test?.buyerName || 'H&M Hennes & Mauritz');
  const [garmentItem, setGarmentItem] = useState(test?.garmentItem || '100% Combed Cotton Single Jersey T-Shirt');
  const [testType, setTestType] = useState<LabTestType | string>(test?.testType || 'GSM_WEIGHT');
  const [testStandard, setTestStandard] = useState(test?.testStandard || 'ASTM D3776 / ISO 3801');
  const [requirement, setRequirement] = useState(test?.requirement || '180 GSM ± 5% (171.0 - 189.0 GSM)');
  const [actualResult, setActualResult] = useState(test?.actualResult || '182.4 GSM');
  const [verdict, setVerdict] = useState<'PASS' | 'FAIL' | 'PENDING'>(test?.verdict || 'PASS');
  const [testedBy, setTestedBy] = useState(test?.testedBy || 'Lab Tech. Farhana Akhter');
  const [testDate, setTestDate] = useState(test?.testDate || new Date().toISOString().split('T')[0]);
  const [labName, setLabName] = useState(test?.labName || 'In-House Accredited Physical Testing Lab');

  // Dual Visuals
  const [testImageUrl, setTestImageUrl] = useState(
    test?.testImageUrl || SAMPLE_APPARATUS_IMAGES[0].url
  );
  const [specimenImageUrl, setSpecimenImageUrl] = useState(
    test?.specimenImageUrl || SAMPLE_SPECIMEN_IMAGES[0].url
  );
  const [apparatusUsed, setApparatusUsed] = useState(
    test?.apparatusUsed || 'James Heal 100 cm² Circular Sample Cutter & Ohaus Pioneer Precision Balance (0.01g)'
  );

  // Environmental Parameters
  const [temperatureCelsius, setTemperatureCelsius] = useState<number>(test?.temperatureCelsius || 20.0);
  const [humidityPercentage, setHumidityPercentage] = useState<number>(test?.humidityPercentage || 65);
  const [conditioningHours, setConditioningHours] = useState<number>(test?.conditioningHours || 24);

  // Root Cause & CAPA
  const [remarks, setRemarks] = useState(test?.remarks || '');
  const [rootCause, setRootCause] = useState(test?.rootCause || '');
  const [correctiveAction, setCorrectiveAction] = useState(test?.correctiveAction || '');

  // Handle Quick Method Presets
  const applyMethodPreset = (typeKey: string) => {
    setTestType(typeKey);
    const preset = METHOD_PRESETS[typeKey];
    if (preset) {
      setTestStandard(preset.standard);
      setRequirement(preset.req);
      setApparatusUsed(preset.apparatus);
      if (mode === 'add') {
        setActualResult(preset.resultExample);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!testReportNo.trim()) {
      showToast('Please specify a valid test report number');
      return;
    }
    if (!styleNumber.trim()) {
      showToast('Please enter a style number');
      return;
    }

    const payload: LabTestRecord = {
      id: test?.id || `tst-${Date.now()}`,
      testReportNo,
      styleNumber,
      fabricBatch,
      orderNumber,
      buyerName,
      garmentItem,
      testType,
      testStandard,
      requirement,
      actualResult,
      verdict,
      testedBy,
      testDate,
      labName,
      testImageUrl,
      specimenImageUrl,
      apparatusUsed,
      temperatureCelsius,
      humidityPercentage,
      conditioningHours,
      remarks,
      rootCause,
      correctiveAction,
      status: 'ACTIVE',
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* TOP HEADER - Matching Buyer & Order Module */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Cancel and return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase font-mono">
                {mode === 'add' ? 'New Lab Test Report' : 'Edit Test Report'}
              </span>
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {testReportNo}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Accredited QMS Garments Material Testing & ISO Laboratory Certification
            </p>
          </div>
        </div>

        {/* Action Buttons: Styled identically to Buyer & Order module */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{mode === 'add' ? 'Save Test Record' : 'Update Test Record'}</span>
          </button>
        </div>
      </div>

      {/* QUICK PRESET SELECTOR: ISO GARMENT TEST METHODS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Auto-Fill QMS ISO Test Method Standard Presets
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Click to populate standard & apparatus</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {Object.keys(METHOD_PRESETS).map((key) => {
            const isSelected = testType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyMethodPreset(key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {key.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION: BASIC ORDER & SPECIMEN METADATA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <FileCheck className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            1. Report Number, Order & Sample Identification
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Test Report # *</label>
            <input
              type="text"
              required
              value={testReportNo}
              onChange={(e) => setTestReportNo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Style Number *</label>
            <input
              type="text"
              required
              value={styleNumber}
              onChange={(e) => setStyleNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fabric Batch / Dye Lot</label>
            <input
              type="text"
              value={fabricBatch}
              onChange={(e) => setFabricBatch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">PO / Order Reference</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Buyer / Brand</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Garment Item / Composition</label>
            <input
              type="text"
              value={garmentItem}
              onChange={(e) => setGarmentItem(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Testing Date</label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Testing Technician</label>
            <input
              type="text"
              value={testedBy}
              onChange={(e) => setTestedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION: DUAL IMAGE UPLOADS (TEST APPARATUS & TESTED SPECIMEN) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ImageIcon className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            2. Laboratory Visual Evidence: Testing Apparatus & Specimen Swatch Photo
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PHOTO 1: TESTING APPARATUS & PROCEDURE */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Testing Apparatus Setup Photo</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Instrument Evidence</span>
            </div>

            {/* Image Preview Box */}
            <div className="h-44 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center">
              {testImageUrl ? (
                <img
                  src={testImageUrl}
                  alt="Apparatus preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 text-slate-400 text-xs">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                  <span>No apparatus image set</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Image URL</label>
              <input
                type="url"
                value={testImageUrl}
                onChange={(e) => setTestImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Or select sample apparatus:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_APPARATUS_IMAGES.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => setTestImageUrl(sample.url)}
                    className="text-[10px] font-medium px-2 py-1 rounded bg-white border border-slate-200 hover:border-blue-400 text-slate-700 cursor-pointer"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PHOTO 2: TESTED SPECIMEN RESULT */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Tested Specimen / Swatch Result Photo</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Result Evidence</span>
            </div>

            {/* Image Preview Box */}
            <div className="h-44 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center">
              {specimenImageUrl ? (
                <img
                  src={specimenImageUrl}
                  alt="Specimen preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 text-slate-400 text-xs">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                  <span>No specimen image set</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Image URL</label>
              <input
                type="url"
                value={specimenImageUrl}
                onChange={(e) => setSpecimenImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Or select sample specimen:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_SPECIMEN_IMAGES.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => setSpecimenImageUrl(sample.url)}
                    className="text-[10px] font-medium px-2 py-1 rounded bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 cursor-pointer"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: TEST PARAMETERS, REQUIREMENT & VERDICT */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Award className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            3. ISO Methodology, Quantitative Results & Verdict
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Test Standard Reference *</label>
            <input
              type="text"
              required
              value={testStandard}
              onChange={(e) => setTestStandard(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Testing Apparatus Model / Equipment Tag</label>
            <input
              type="text"
              value={apparatusUsed}
              onChange={(e) => setApparatusUsed(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Buyer Mandated Requirement *</label>
            <input
              type="text"
              required
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="e.g. 180 GSM ± 5% or Grade 4.0 min"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Actual Measured Laboratory Result *</label>
            <input
              type="text"
              required
              value={actualResult}
              onChange={(e) => setActualResult(e.target.value)}
              placeholder="e.g. 182.4 GSM or Grade 4.5"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* VERDICT SELECTOR CARDS */}
        <div>
          <label className="block font-semibold text-slate-700 text-xs mb-2">Overall Quality Compliance Verdict *</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'PASS', label: 'PASS (Compliant)', desc: 'Meets buyer tolerance and international standard', border: 'border-emerald-300', bg: 'bg-emerald-50 text-emerald-950', icon: CheckCircle2 },
              { id: 'FAIL', label: 'FAIL (Out of Spec)', desc: 'Exceeds tolerance, requires quarantine / reprocessing', border: 'border-rose-300', bg: 'bg-rose-50 text-rose-950', icon: XCircle },
              { id: 'PENDING', label: 'PENDING (In Progress)', desc: 'Awaiting wash cycles or conditioning hours', border: 'border-amber-300', bg: 'bg-amber-50 text-amber-950', icon: Clock },
            ].map((v) => {
              const isSelected = verdict === v.id;
              const IconComp = v.icon;
              return (
                <div
                  key={v.id}
                  onClick={() => setVerdict(v.id as any)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected ? `${v.border} ${v.bg} shadow-xs` : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <IconComp className="w-4 h-4" />
                      <span>{v.label}</span>
                    </span>
                    {isSelected && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80">Selected</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION: ENVIRONMENTAL CONDITIONING */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Thermometer className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            4. Laboratory Environmental Conditioning Parameters (ISO 139)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Temperature (°C)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={temperatureCelsius}
              onChange={(e) => setTemperatureCelsius(parseFloat(e.target.value) || 20.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 20.0°C ± 2.0°C</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Relative Humidity (%RH)</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={humidityPercentage}
              onChange={(e) => setHumidityPercentage(parseFloat(e.target.value) || 65.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 65.0% ± 4.0% RH</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Conditioning Time (Hours)</span>
            </label>
            <input
              type="number"
              value={conditioningHours}
              onChange={(e) => setConditioningHours(parseInt(e.target.value) || 24)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 24h (Min. 4h for quick)</span>
          </div>
        </div>
      </div>

      {/* SECTION: ROOT CAUSE & CAPA (ESPECIALLY IF FAILED) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Activity className="w-4 h-4 text-rose-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            5. Root Cause & Corrective Action (CAPA) - If Failure / Deviation Observed
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Root Cause Investigation on Record</label>
            <textarea
              rows={3}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g. Over-oxidation during bleaching weakened warp yarns, or stenter over-feed insufficient..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Corrective & Preventive Action Plan (CAPA)</label>
            <textarea
              rows={3}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder="e.g. Re-finish batch with anti-static softener, adjust stenter pin-chain tension to -3%..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 text-xs mb-1">Technician Floor Notes & Audit Remarks</label>
          <textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Official laboratory observations, specimen condition, testing anomalies..."
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{mode === 'add' ? 'Save Lab Test Record' : 'Update Lab Test Record'}</span>
        </button>
      </div>
    </form>
  );
}
