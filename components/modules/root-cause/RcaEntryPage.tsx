'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Sparkles,
  Layers,
  GitPullRequest,
  Building2,
  Calendar,
  AlertTriangle,
  User,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  HelpCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import { RootCauseCase, RcaStatus, RcaSeverity, RcaEvidenceImage } from '@/lib/types/modules';

interface RcaEntryPageProps {
  mode: 'create' | 'edit';
  initialData?: RootCauseCase;
  onBack: () => void;
  onSave: (rcaCase: RootCauseCase) => void;
  showToast: (msg: string) => void;
}

const INDUSTRY_PRESETS = [
  {
    name: 'Sewing: Skip Stitches on Heavy Fleece (Both Methods)',
    methods: ['FIVE_WHY', 'FISHBONE'],
    data: {
      problemTitle: 'Intermittent Skip Stitches on 6-Ply Pocket Bar Tack',
      occurredLocation: 'Sewing Line 02, Workstation #14',
      styleAffected: 'STY-HD-994 (Hooded Fleece 380 GSM)',
      department: 'Sewing',
      buyer: 'H&M Global',
      orderNumber: 'PO-HM-98214',
      severity: 'CRITICAL' as RcaSeverity,
      investigationLead: 'Engr. Tariqul Islam (Quality Specialist)',
      teamMembers: ['Rashidul Karim (Floor Master)', 'Sultana Begum (Supervisor)'],
      problemDescription: 'High-speed bar tacking on pocket corners exhibited 18% skip stitches, failing lateral seam pull test.',
      containmentAction: '100% quarantine of 320 pcs WIP; stopped bar tack station immediately.',
      fiveWhys: {
        why1: 'Needle deflected and skipped looper thread loop.',
        why2: 'Needle bar penetration force was inadequate for 6-ply fabric at 2,800 RPM.',
        why3: 'Standard needle #14/90 was installed instead of reinforced heavy-duty #16/100 SAN-5.',
        why4: 'Operator selected generic needle box from floor tray without verifying.',
        why5: 'Tech Pack sewing specification bulletin was missing at the workstation during style transition.',
      },
      fishboneFactors: {
        man: ['Operator new to heavy fleece', 'Skipped pre-run needle gauge sign-off'],
        machine: ['Hook clearance 0.10mm (spec 0.05mm)', 'Bar tacker RPM too high (2,800 vs 2,200)'],
        material: ['6-ply fabric thickness variance ±0.8mm', 'Silicone finish causing needle drag'],
        method: ['Tech Pack bulletin not displayed at station', 'Lack of sample swatch signoff'],
        measurement: ['Visual check only; no pull test gauge in initial setup'],
        milieu: ['High humidity (78% RH) causing fabric swelling'],
      },
      finalRootCause: 'Standard Operating Procedure breakdown: Workstation Tech Pack display protocol was bypassed during style changeover.',
      correctiveAction: 'Retrofit Groz-Beckert #16/100 SAN-5 needles, cap RPM at 2,200, and reset hook clearance.',
      preventiveAction: 'Institute mandatory digital tablet Tech Pack sign-off before motor power unlock on specialized sewing stations.',
      linkedCapaId: 'CAPA-2026-003',
      linkedDefectCode: 'SEW-01',
    },
  },
  {
    name: 'Fabric & Cutting: Shade Variation (5-Why Only)',
    methods: ['FIVE_WHY'],
    data: {
      problemTitle: 'Color Shade Variance (Delta-E > 1.4) Across Front Panel Batches',
      occurredLocation: 'Cutting & Fabric Spreading Table 03',
      styleAffected: 'STY-POLO-882 (Pique Polo)',
      department: 'Cutting',
      buyer: 'Zara Inditex',
      orderNumber: 'PO-ZR-44019',
      severity: 'MAJOR' as RcaSeverity,
      investigationLead: 'Nasrin Akhter (Textile Technologist)',
      teamMembers: ['Abdur Rahim (Cutting Manager)', 'Farhana Yasmin (Fabric QA)'],
      problemDescription: 'Tonal shade mismatch between Left & Right chest panels when joined at sewing line.',
      containmentAction: 'Quarantined 14 bundles (420 pcs) cut from Roll #12 and #15; halted bundling on Table 03.',
      fiveWhys: {
        why1: 'Cut panels in the same sewing bundle originated from different fabric rolls.',
        why2: 'Fabric spreader mixed Roll Band B with Roll Band C on the same lay.',
        why3: 'Roll ticketing tags had handwritten shade notations that were smudged.',
        why4: 'Warehouse clerk ran out of printed barcode stickers and used yellow chalk.',
        why5: 'Warehouse thermal barcode printer was offline for 3 days without maintenance escalation.',
      },
      fishboneFactors: {
        man: [],
        machine: [],
        material: [],
        method: [],
        measurement: [],
        milieu: [],
      },
      finalRootCause: 'Absence of automated inventory barcode enforcement and failure of preventive maintenance on warehouse printer.',
      correctiveAction: 'De-bundle all affected lots, match panels under D65 spectrophotometer, and repair printer.',
      preventiveAction: 'Deploy mandatory barcode scanner gate at spreading table requiring QR match before lay sequence.',
      linkedCapaId: 'CAPA-2026-008',
      linkedDefectCode: 'CUT-04',
    },
  },
  {
    name: 'Product Safety: Broken Needle in Packing (Fishbone Only)',
    methods: ['FISHBONE'],
    data: {
      problemTitle: 'Broken Needle Tip Fragment Detected in Metal Detector',
      occurredLocation: 'Finishing & Packing Section, Metal Detector Gate 01',
      styleAffected: 'STY-JCK-441 (Kids Outerwear)',
      department: 'Finishing',
      buyer: 'Nike Sportswear',
      orderNumber: 'PO-NK-65102',
      severity: 'CRITICAL' as RcaSeverity,
      investigationLead: 'Capt. Monirul Islam (Compliance Director)',
      teamMembers: ['Nurul Huda (Finishing Lead)', 'Ayesha Siddika (QA Auditor)'],
      problemDescription: 'Conveyor 9-point metal detector alarmed on carton #48; 2.1mm steel tip found in zipper placket.',
      containmentAction: 'Emergency shutdown of Packing Line 01; 100% quarantine of 1,450 jackets for double-pass screening.',
      fiveWhys: {
        why1: '',
        why2: '',
        why3: '',
        why4: '',
        why5: '',
      },
      fishboneFactors: {
        man: ['Operator bypassed broken needle recovery SOP', 'Mechanic handed replacement without checking'],
        machine: ['Zipper needle deflecting upon hitting resin zipper stop', 'Thread take-up stroke off-sync'],
        material: ['Resin zipper teeth hardness specification exceeding standard'],
        method: ['Mandatory broken needle jigsaw reconstruction bypassed', 'No magnetic search wand on line'],
        measurement: ['Metal detector calibration check delayed by 2 hours'],
        milieu: ['High noise near compressor obscuring needle snap sound'],
      },
      finalRootCause: 'Systemic breakdown in Broken Needle Policy: unauthorized mechanic needle handover bypassed mandatory jigsaw verification gate.',
      correctiveAction: '100% dual-pass metal detection of 1,450 jackets; written warning issued to mechanic and operator.',
      preventiveAction: 'Install biometric needle locker requiring QA Supervisor fingerprint authorization + photo proof.',
      linkedCapaId: 'CAPA-2026-012',
      linkedDefectCode: 'SAF-01',
    },
  },
];

export function RcaEntryPage({
  mode,
  initialData,
  onBack,
  onSave,
  showToast,
}: RcaEntryPageProps) {
  // Method selection state: allows multiple methods (5-Why, Fishbone) or one
  const [appliedMethods, setAppliedMethods] = useState<string[]>(
    initialData?.appliedMethods && initialData.appliedMethods.length > 0
      ? initialData.appliedMethods
      : ['FIVE_WHY', 'FISHBONE']
  );

  // Form State
  const [caseCode, setCaseCode] = useState<string>(
    initialData?.caseCode || `RCA-2026-${Math.floor(10 + Math.random() * 90)}`
  );
  const [problemTitle, setProblemTitle] = useState<string>(initialData?.problemTitle || '');
  const [department, setDepartment] = useState<string>(initialData?.department || 'Sewing');
  const [occurredLocation, setOccurredLocation] = useState<string>(initialData?.occurredLocation || '');
  const [styleAffected, setStyleAffected] = useState<string>(initialData?.styleAffected || '');
  const [buyer, setBuyer] = useState<string>(initialData?.buyer || '');
  const [orderNumber, setOrderNumber] = useState<string>(initialData?.orderNumber || '');
  const [severity, setSeverity] = useState<RcaSeverity>(initialData?.severity || 'MAJOR');
  const [status, setStatus] = useState<RcaStatus>(initialData?.status || 'INVESTIGATING');
  const [createdDate, setCreatedDate] = useState<string>(
    initialData?.createdDate || new Date().toISOString().split('T')[0]
  );
  const [targetClosureDate, setTargetClosureDate] = useState<string>(
    initialData?.targetClosureDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [investigationLead, setInvestigationLead] = useState<string>(initialData?.investigationLead || '');
  const [teamMembersInput, setTeamMembersInput] = useState<string>(
    initialData?.teamMembers?.join(', ') || ''
  );

  // 5W2H Problem Details
  const [problemDescription, setProblemDescription] = useState<string>(initialData?.problemDescription || '');
  const [containmentAction, setContainmentAction] = useState<string>(initialData?.containmentAction || '');

  // 5-Why
  const [why1, setWhy1] = useState<string>(initialData?.fiveWhys?.why1 || '');
  const [why2, setWhy2] = useState<string>(initialData?.fiveWhys?.why2 || '');
  const [why3, setWhy3] = useState<string>(initialData?.fiveWhys?.why3 || '');
  const [why4, setWhy4] = useState<string>(initialData?.fiveWhys?.why4 || '');
  const [why5, setWhy5] = useState<string>(initialData?.fiveWhys?.why5 || '');

  // 6M Fishbone Factors
  const [factors, setFactors] = useState<{
    man: string[];
    machine: string[];
    material: string[];
    method: string[];
    measurement: string[];
    milieu: string[];
  }>({
    man: initialData?.fishboneFactors?.man || [],
    machine: initialData?.fishboneFactors?.machine || [],
    material: initialData?.fishboneFactors?.material || [],
    method: initialData?.fishboneFactors?.method || [],
    measurement: initialData?.fishboneFactors?.measurement || [],
    milieu: initialData?.fishboneFactors?.milieu || [],
  });

  // Current inputs for each 6M category
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({
    man: '',
    machine: '',
    material: '',
    method: '',
    measurement: '',
    milieu: '',
  });

  // Root Cause & CAPA
  const [finalRootCause, setFinalRootCause] = useState<string>(initialData?.finalRootCause || '');
  const [correctiveAction, setCorrectiveAction] = useState<string>(initialData?.correctiveAction || '');
  const [preventiveAction, setPreventiveAction] = useState<string>(initialData?.preventiveAction || '');
  const [linkedCapaId, setLinkedCapaId] = useState<string>(initialData?.linkedCapaId || '');
  const [linkedDefectCode, setLinkedDefectCode] = useState<string>(initialData?.linkedDefectCode || '');

  // Evidence Images
  const [evidenceImages, setEvidenceImages] = useState<RcaEvidenceImage[]>(
    initialData?.evidenceImages || []
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  // Method Toggle Helper
  const toggleMethod = (method: 'FIVE_WHY' | 'FISHBONE') => {
    if (appliedMethods.includes(method)) {
      if (appliedMethods.length === 1) {
        showToast('At least one RCA methodology (5-Why or Fishbone) must remain selected.');
        return;
      }
      setAppliedMethods(appliedMethods.filter((m) => m !== method));
      showToast(`Removed ${method === 'FIVE_WHY' ? '5-Why' : 'Fishbone'} methodology`);
    } else {
      setAppliedMethods([...appliedMethods, method]);
      showToast(`Enabled ${method === 'FIVE_WHY' ? '5-Why' : 'Fishbone'} methodology`);
    }
  };

  // Handle Preset Loading
  const handleLoadPreset = (presetIndex: number) => {
    const p = INDUSTRY_PRESETS[presetIndex];
    if (!p) return;
    setAppliedMethods(p.methods);
    setProblemTitle(p.data.problemTitle);
    setOccurredLocation(p.data.occurredLocation);
    setStyleAffected(p.data.styleAffected);
    setDepartment(p.data.department);
    setBuyer(p.data.buyer);
    setOrderNumber(p.data.orderNumber);
    setSeverity(p.data.severity);
    setInvestigationLead(p.data.investigationLead);
    setTeamMembersInput(p.data.teamMembers.join(', '));
    setProblemDescription(p.data.problemDescription);
    setContainmentAction(p.data.containmentAction);
    setWhy1(p.data.fiveWhys.why1);
    setWhy2(p.data.fiveWhys.why2);
    setWhy3(p.data.fiveWhys.why3);
    setWhy4(p.data.fiveWhys.why4);
    setWhy5(p.data.fiveWhys.why5);
    setFactors(p.data.fishboneFactors);
    setFinalRootCause(p.data.finalRootCause);
    setCorrectiveAction(p.data.correctiveAction);
    setPreventiveAction(p.data.preventiveAction);
    setLinkedCapaId(p.data.linkedCapaId);
    setLinkedDefectCode(p.data.linkedDefectCode);
    showToast(`Loaded template: ${p.name}`);
  };

  // Add factor to 6M
  const handleAddFactor = (cat: 'man' | 'machine' | 'material' | 'method' | 'measurement' | 'milieu') => {
    const val = categoryInputs[cat]?.trim();
    if (!val) return;
    setFactors((prev) => ({
      ...prev,
      [cat]: [...prev[cat], val],
    }));
    setCategoryInputs((prev) => ({ ...prev, [cat]: '' }));
  };

  const handleRemoveFactor = (
    cat: 'man' | 'machine' | 'material' | 'method' | 'measurement' | 'milieu',
    idx: number
  ) => {
    setFactors((prev) => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== idx),
    }));
  };

  // Add evidence photo
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setEvidenceImages([
      ...evidenceImages,
      {
        id: `img-${Date.now()}`,
        url: newImageUrl.trim(),
        caption: newImageCaption.trim() || 'Floor Evidence Image',
        timestamp: new Date().toLocaleString(),
      },
    ]);
    setNewImageUrl('');
    setNewImageCaption('');
  };

  const handleRemoveImage = (id: string) => {
    setEvidenceImages(evidenceImages.filter((img) => img.id !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!problemTitle.trim()) {
      showToast('Error: Problem Title is required.');
      return;
    }
    if (!occurredLocation.trim()) {
      showToast('Error: Floor Location is required.');
      return;
    }
    if (!finalRootCause.trim()) {
      showToast('Error: Isolated Systemic Root Cause statement is required.');
      return;
    }

    if (appliedMethods.length === 0) {
      showToast('Error: Please select at least one RCA methodology (5-Why or Fishbone).');
      return;
    }

    const teamMembers = teamMembersInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    const savedRecord: RootCauseCase = {
      id: initialData?.id || `rca-${Date.now()}`,
      caseCode: caseCode.trim() || `RCA-${Date.now().toString().slice(-4)}`,
      problemTitle: problemTitle.trim(),
      occurredLocation: occurredLocation.trim(),
      styleAffected: styleAffected.trim() || 'General Style',
      department,
      buyer: buyer.trim() || 'Internal Quality',
      orderNumber: orderNumber.trim() || undefined,
      severity,
      status,
      createdDate,
      targetClosureDate,
      investigationLead: investigationLead.trim() || 'Quality Specialist',
      teamMembers,
      problemDescription: problemDescription.trim(),
      containmentAction: containmentAction.trim(),
      appliedMethods,
      fiveWhys: {
        why1: why1.trim() || (appliedMethods.includes('FIVE_WHY') ? 'Immediate defect symptom' : ''),
        why2: why2.trim() || '',
        why3: why3.trim() || '',
        why4: why4.trim() || '',
        why5: why5.trim() || finalRootCause.trim(),
      },
      fishboneFactors: factors,
      finalRootCause: finalRootCause.trim(),
      correctiveAction: correctiveAction.trim(),
      preventiveAction: preventiveAction.trim(),
      linkedCapaId: linkedCapaId.trim() || undefined,
      linkedDefectCode: linkedDefectCode.trim() || undefined,
      evidenceImages,
    };

    onSave(savedRecord);
  };

  const isFiveWhyActive = appliedMethods.includes('FIVE_WHY');
  const isFishboneActive = appliedMethods.includes('FISHBONE');

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Cancel and return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {mode === 'create' ? 'NEW RCA INVESTIGATION' : caseCode}
              </span>
              <span className="text-xs text-slate-500">
                {mode === 'create' ? 'Multi-Methodology DMAIC Form' : 'Update Investigation Record'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {mode === 'create' ? 'Register Root Cause Analysis Investigation' : `Edit RCA: ${problemTitle}`}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Preset Selector */}
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value !== '') {
                  handleLoadPreset(Number(e.target.value));
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-3 py-2 shadow-2xs hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <option value="" disabled>
                ⚡ Load Industry Preset...
              </option>
              {INDUSTRY_PRESETS.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{mode === 'create' ? 'Save Investigation' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Case Identity & Floor Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          1. Investigation Identification &amp; Manufacturing Context
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Case Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={caseCode}
              onChange={(e) => setCaseCode(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="Sewing">Sewing Department</option>
              <option value="Cutting">Cutting &amp; Spreading</option>
              <option value="Finishing">Finishing &amp; Packing</option>
              <option value="Washing">Washing &amp; Wet Processing</option>
              <option value="Knitting">Knitting &amp; Weaving</option>
              <option value="Printing">Embellishment &amp; Print</option>
              <option value="Quality Assurance">Quality Assurance (QA)</option>
              <option value="Safety & Compliance">Safety &amp; Compliance</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Floor Location / Workstation <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sewing Line 02, Workstation #14"
              value={occurredLocation}
              onChange={(e) => setOccurredLocation(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Severity Priority</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as RcaSeverity)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="CRITICAL">🚨 Critical (Safety / Zero Tolerance)</option>
              <option value="MAJOR">⚠️ Major (AQL Defect)</option>
              <option value="MINOR">ℹ️ Minor (Observation / Cosmetic)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Investigation Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RcaStatus)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="INVESTIGATING">Investigating (DMAIC)</option>
              <option value="ROOT_CAUSE_IDENTIFIED">Root Cause Isolated</option>
              <option value="CAPA_ASSIGNED">CAPA Mandated</option>
              <option value="VERIFIED_CLOSED">Verified &amp; Closed</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Style Affected</label>
            <input
              type="text"
              placeholder="e.g. STY-HD-994 (Hooded Fleece)"
              value={styleAffected}
              onChange={(e) => setStyleAffected(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Buyer / Brand</label>
            <input
              type="text"
              placeholder="e.g. H&M Global, Zara, Nike"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Order / PO Number</label>
            <input
              type="text"
              placeholder="e.g. PO-HM-98214"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Incident Date</label>
            <input
              type="date"
              value={createdDate}
              onChange={(e) => setCreatedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Closure Date</label>
            <input
              type="date"
              value={targetClosureDate}
              onChange={(e) => setTargetClosureDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Investigation Lead</label>
            <input
              type="text"
              placeholder="e.g. Tariqul Islam (Lead QA)"
              value={investigationLead}
              onChange={(e) => setInvestigationLead(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Team Members (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Floor Master, Supervisor, Mechanic"
              value={teamMembersInput}
              onChange={(e) => setTeamMembersInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: 5W2H Problem Definition & Immediate Containment */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          2. Quality Non-Conformance &amp; Containment Action
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Quality Incident / Problem Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Excessive Skip Stitches on Heavyweight Fleece Pocket Bar Tack"
              value={problemTitle}
              onChange={(e) => setProblemTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Detailed Problem Statement (What happened, defect rate, pull-test or AQL fail)
              </label>
              <textarea
                rows={3}
                placeholder="Describe the defect symptoms, sample sizes tested, fail criteria..."
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-rose-800 mb-1">
                Immediate Containment Action (Floor freeze, quarantine, segregation)
              </label>
              <textarea
                rows={3}
                placeholder="Describe emergency stoppage, quarantine lots, rework sorting applied..."
                value={containmentAction}
                onChange={(e) => setContainmentAction(e.target.value)}
                className="w-full px-3 py-2 border border-rose-200 bg-rose-50/40 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SELECTABLE ROOT CAUSE METHODS SWITCHER */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 rounded-2xl border border-blue-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Select Root Cause Analysis Methodologies for this Issue
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Choose one method or use both together. Only the selected methodologies will appear in this investigation.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAppliedMethods(['FIVE_WHY', 'FISHBONE']);
                showToast('Enabled Both Methodologies');
              }}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                isFiveWhyActive && isFishboneActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Both Methods
            </button>
            <button
              type="button"
              onClick={() => {
                setAppliedMethods(['FIVE_WHY']);
                showToast('Selected 5-Why Only');
              }}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                isFiveWhyActive && !isFishboneActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              5-Why Only
            </button>
            <button
              type="button"
              onClick={() => {
                setAppliedMethods(['FISHBONE']);
                showToast('Selected Fishbone Only');
              }}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                !isFiveWhyActive && isFishboneActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Fishbone Only
            </button>
          </div>
        </div>

        {/* Selectable Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* 5-Why Method Card */}
          <div
            onClick={() => toggleMethod('FIVE_WHY')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              isFiveWhyActive
                ? 'bg-white border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-90'
            }`}
          >
            <div className="mt-0.5 text-blue-600">
              {isFiveWhyActive ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">5-Why Sequential Causality Analysis</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Sequential linear ladder answering &quot;Why?&quot; 5 times from immediate physical defect down to systemic root cause.
              </p>
              <span className={`text-[10px] font-bold mt-2 inline-block px-2 py-0.5 rounded ${
                isFiveWhyActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {isFiveWhyActive ? '✓ Active in Form' : 'Click to Enable'}
              </span>
            </div>
          </div>

          {/* 6M Fishbone Method Card */}
          <div
            onClick={() => toggleMethod('FISHBONE')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              isFishboneActive
                ? 'bg-white border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-90'
            }`}
          >
            <div className="mt-0.5 text-indigo-600">
              {isFishboneActive ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">6M Ishikawa Fishbone Diagram</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Multi-dimensional brainstorm isolating factors across Man, Machine, Material, Method, Measurement, and Milieu.
              </p>
              <span className={`text-[10px] font-bold mt-2 inline-block px-2 py-0.5 rounded ${
                isFishboneActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {isFishboneActive ? '✓ Active in Form' : 'Click to Enable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: 5-Why Sequential Causality Builder (RENDER ONLY IF SELECTED) */}
      {isFiveWhyActive && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              3. Five-Why Sequential Causality Chain (DMAIC Method)
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                Method 1 of Selected
              </span>
              <button
                type="button"
                onClick={() => toggleMethod('FIVE_WHY')}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                title="Disable 5-Why for this case"
              >
                Disable
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { level: 1, label: 'Why 1: Immediate Defect Symptom', val: why1, setVal: setWhy1, placeholder: 'Why did the garment fail inspection at this point?' },
              { level: 2, label: 'Why 2: Physical / Direct Mechanism', val: why2, setVal: setWhy2, placeholder: 'Why did the physical condition occur mechanically?' },
              { level: 3, label: 'Why 3: Process Parameter / Setting Deviation', val: why3, setVal: setWhy3, placeholder: 'What machine parameter, tooling, or speed setting was off?' },
              { level: 4, label: 'Why 4: Standard / Execution Gap', val: why4, setVal: setWhy4, placeholder: 'Why was that parameter selected or left uninspected?' },
              { level: 5, label: 'Why 5: Systemic Management / SOP Root Cause', val: why5, setVal: setWhy5, placeholder: 'What underlying policy, training, or SOP breakdown allowed this?' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
                  idx === 4 ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono text-xs shrink-0 ${
                    idx === 4 ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  {item.level}
                </div>
                <div className="flex-1 w-full space-y-1">
                  <label className={`block font-bold ${idx === 4 ? 'text-rose-900' : 'text-slate-700'}`}>
                    {item.label}
                  </label>
                  <input
                    type="text"
                    placeholder={item.placeholder}
                    value={item.val}
                    onChange={(e) => item.setVal(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: 6M Ishikawa Fishbone Factors Manager (RENDER ONLY IF SELECTED) */}
      {isFishboneActive && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-indigo-600" />
              {isFiveWhyActive ? '4. Ishikawa Fishbone Factors (6M Categories)' : '3. Ishikawa Fishbone Factors (6M Categories)'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Method {isFiveWhyActive ? '2 of Selected' : '1 of Selected'}
              </span>
              <button
                type="button"
                onClick={() => toggleMethod('FISHBONE')}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                title="Disable Fishbone for this case"
              >
                Disable
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {[
              { key: 'man', label: 'Man (Personnel & Skills)', badge: 'bg-blue-100 text-blue-800' },
              { key: 'machine', label: 'Machine (Equipment & Needles)', badge: 'bg-indigo-100 text-indigo-800' },
              { key: 'material', label: 'Material (Fabric & Trims)', badge: 'bg-amber-100 text-amber-800' },
              { key: 'method', label: 'Method (SOP & Work Instructions)', badge: 'bg-purple-100 text-purple-800' },
              { key: 'measurement', label: 'Measurement (Gauges & Light)', badge: 'bg-emerald-100 text-emerald-800' },
              { key: 'milieu', label: 'Milieu (Environment & Plant)', badge: 'bg-slate-200 text-slate-800' },
            ].map((cat) => {
              const catKey = cat.key as keyof typeof factors;
              return (
                <div key={cat.key} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${cat.badge}`}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {factors[catKey].length} item{factors[catKey].length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Factors Chips */}
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-1.5 bg-white rounded-lg border border-slate-200">
                    {factors[catKey].length > 0 ? (
                      factors[catKey].map((factor, fIdx) => (
                        <span
                          key={fIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] border border-slate-200"
                        >
                          <span>{factor}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFactor(catKey, fIdx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic py-1">No factors added</span>
                    )}
                  </div>

                  {/* Add factor input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder={`Add ${cat.key} factor...`}
                      value={categoryInputs[cat.key]}
                      onChange={(e) =>
                        setCategoryInputs((prev) => ({ ...prev, [cat.key]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFactor(catKey);
                        }
                      }}
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddFactor(catKey)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: Isolated Systemic Root Cause */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Final Isolated Systemic Root Cause Statement <span className="text-rose-500">*</span>
        </h2>
        <p className="text-xs text-slate-500">
          The ultimate conclusion that, if corrected permanently, will eliminate recurrence.
        </p>
        <textarea
          rows={3}
          placeholder="e.g. Standard Operating Procedure breakdown: Workstation Tech Pack display protocol was bypassed during style changeover..."
          value={finalRootCause}
          onChange={(e) => setFinalRootCause(e.target.value)}
          required
          className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/30 rounded-xl text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* SECTION 6: CAPA & Countermeasures Bridge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-600" />
          Recommended Countermeasures (CAPA 8D Linkage)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Immediate Corrective Action (Floor Fix / Rework)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Retrofit Groz-Beckert #16/100 SAN-5 needles on all 4 bar tackers, adjust hook..."
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Preventive Action (Systemic Poka-Yoke / SOP Revision)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Implement mandatory digital tablet Tech Pack signoff before motor power unlock..."
              value={preventiveAction}
              onChange={(e) => setPreventiveAction(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Linked CAPA Ticket Code</label>
            <input
              type="text"
              placeholder="e.g. CAPA-2026-003"
              value={linkedCapaId}
              onChange={(e) => setLinkedCapaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Linked Defect Library Code</label>
            <input
              type="text"
              placeholder="e.g. SEW-01"
              value={linkedDefectCode}
              onChange={(e) => setLinkedDefectCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 7: Photographic Evidence & Visual Attachments */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" />
          Photographic Evidence &amp; Visual Documentation
        </h2>

        {/* Existing Images */}
        {evidenceImages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {evidenceImages.map((img) => (
              <div
                key={img.id}
                className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col"
              >
                <div className="aspect-video bg-slate-200 overflow-hidden">
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5 text-xs flex items-center justify-between">
                  <span className="truncate font-medium text-slate-800" title={img.caption}>
                    {img.caption}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add photo bar */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Photo Description / Caption</label>
              <input
                type="text"
                placeholder="e.g. Needle bar deflected point on 6-ply fleece"
                value={newImageCaption}
                onChange={(e) => setNewImageCaption(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddImage}
              disabled={!newImageUrl.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Image</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="flex items-center justify-end gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{mode === 'create' ? 'Complete & Save Investigation' : 'Save Updated RCA'}</span>
        </button>
      </div>
    </form>
  );
}
