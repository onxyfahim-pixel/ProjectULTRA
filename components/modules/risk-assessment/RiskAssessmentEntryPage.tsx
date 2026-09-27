'use client';

import React, { useState, useRef, useMemo } from 'react';
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
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Tag,
  Building2,
  Users,
  Eye,
  ZoomIn,
  X,
  Clock,
  Layers,
  Sparkles,
  Info,
  Check,
  Plus,
  Package,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  RiskFmeaItem,
  RiskAssessmentType,
  RiskLevel,
  RiskStatus,
  RiskSectionType,
  RiskSectionItem,
  BuyerOrder,
} from '@/lib/types/modules';
import {
  RISK_ASSESSMENT_TYPES,
  SEVERITY_RUBRIC,
  OCCURRENCE_RUBRIC,
  DETECTION_RUBRIC,
  computeRpn,
  getRiskLevel,
  getRiskLevelBadge,
  SAMPLE_BUYERS,
  SAMPLE_DEPARTMENTS,
} from './riskAssessmentData';
import {
  RISK_SECTIONS,
  RISK_SECTION_ORDER,
  RiskSectionPreset,
  computeSectionRiskStats,
} from './riskAssessmentSections';
import { StyleOrderSelectorModal } from './StyleOrderSelectorModal';
import { RiskSectionPresetModal } from './RiskSectionPresetModal';

interface RiskAssessmentEntryPageProps {
  initialRecord?: RiskFmeaItem | null;
  onBack: () => void;
  onSave: (record: RiskFmeaItem) => void;
  showToast: (msg: string) => void;
}

export function RiskAssessmentEntryPage({
  initialRecord,
  onBack,
  onSave,
  showToast,
}: RiskAssessmentEntryPageProps) {
  const isEditing = !!initialRecord;

  // Assessment Type
  const [assessmentType, setAssessmentType] = useState<RiskAssessmentType>(
    initialRecord?.assessmentType || 'PRODUCT'
  );

  const getPrefix = (type: RiskAssessmentType) => {
    switch (type) {
      case 'PRODUCT':
        return 'RA-PRD';
      case 'PROCESS':
        return 'RA-PRC';
      case 'CRITICAL_PROCESS':
        return 'RA-CRT';
    }
  };

  const [fmeaCode, setFmeaCode] = useState<string>(
    initialRecord?.fmeaCode ||
      `${getPrefix(assessmentType)}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );

  const [assessmentDate, setAssessmentDate] = useState<string>(
    initialRecord?.assessmentDate || new Date().toISOString().split('T')[0]
  );

  const [title, setTitle] = useState<string>(initialRecord?.title || '');

  // ─── BUYER & ORDER MODULE INTEGRATION STATE ──────────────────────────────
  const [styleNumber, setStyleNumber] = useState<string>(
    initialRecord?.styleNumber || 'STY-TS-2026'
  );
  const [buyer, setBuyer] = useState<string>(
    initialRecord?.buyer || 'H&M Hennes & Mauritz'
  );
  const [orderNumber, setOrderNumber] = useState<string>(
    initialRecord?.orderNumber || 'PO-HM-99201'
  );
  const [buyerOrderId, setBuyerOrderId] = useState<string>(
    initialRecord?.buyerOrderId || 'ord-1'
  );
  const [styleDescription, setStyleDescription] = useState<string>(
    initialRecord?.styleDescription || 'Men Heavyweight Cotton Crewneck Tee'
  );
  const [season, setSeason] = useState<string>(
    initialRecord?.season || 'Autumn/Winter 2026'
  );
  const [orderQuantity, setOrderQuantity] = useState<number | undefined>(
    initialRecord?.orderQuantity || 45000
  );
  const [department, setDepartment] = useState<string>(
    initialRecord?.department || 'Sewing Assembly'
  );

  // Manual entry toggle
  const [isManualStyleEntry, setIsManualStyleEntry] = useState(false);
  const [isOrderSelectorOpen, setIsOrderSelectorOpen] = useState(false);

  // Assessor Team
  const [assessorName, setAssessorName] = useState<string>(
    initialRecord?.assessorName || 'Tanvir Ahmed (Senior QA Assessor)'
  );
  const [assessorTeam, setAssessorTeam] = useState<string>(
    initialRecord?.assessorTeam?.join(', ') ||
      'Mahmudul Hasan (IE), Kalam Hossain (Line Supervisor), Rehana Begum (QA)'
  );

  // ─── MULTI-RISK SECTION MANAGEMENT STATE ────────────────────────────────
  // Initialize multiple risks from initialRecord or default initial set
  const [sectionRisks, setSectionRisks] = useState<RiskSectionItem[]>(() => {
    if (initialRecord?.sectionRisks && initialRecord.sectionRisks.length > 0) {
      return initialRecord.sectionRisks;
    }
    // If editing legacy record without sectionRisks, convert the single risk to first item
    if (initialRecord) {
      return [
        {
          id: `sec-${Date.now()}-1`,
          section: initialRecord.primarySection || 'RAW_MATERIAL',
          processStep: initialRecord.processStep || 'Fabric & Construction Spec',
          potentialFailureMode: initialRecord.potentialFailureMode || 'Spec deviation',
          potentialEffect: initialRecord.potentialEffect || '',
          potentialCauses: initialRecord.potentialCauses || '',
          currentControls: initialRecord.currentControls || '',
          severity: initialRecord.severity || 7,
          occurrence: initialRecord.occurrence || 4,
          detection: initialRecord.detection || 3,
          rpn: initialRecord.rpn || computeRpn(7, 4, 3),
          riskLevel: initialRecord.riskLevel || 'MEDIUM',
          mitigationAction: initialRecord.mitigationAction || '',
          responsibleLead: initialRecord.responsibleLead || 'QA Lead',
          targetDate: initialRecord.targetDate || '',
          status: initialRecord.status || 'IN_PROGRESS',
          notes: initialRecord.notes || '',
        },
      ];
    }
    // Default initial sample risks across sections for quick demonstration
    return [
      {
        id: `sec-init-1`,
        section: 'RAW_MATERIAL',
        processStep: 'Fabric Reactive Dyeing & Finishing (Single Jersey 180 GSM)',
        potentialFailureMode: 'Color Bleeding & Wash Crocking Fastness Failure (< Grade 4)',
        potentialEffect: 'Staining of contrast collar rib during washing; buyer lot rejection.',
        potentialCauses: 'Unfixed reactive dye molecules left due to insufficient hot water soaping cycles at textile mill.',
        currentControls: 'Supplier mill test report review only without factory internal cross-check.',
        severity: 8,
        occurrence: 4,
        detection: 3,
        rpn: 96,
        riskLevel: 'MEDIUM',
        mitigationAction: '100% internal lab multi-fiber wash fastness testing (ISO 105-C06) before roll release to cutting floor.',
        responsibleLead: 'Rehana Begum (Fabric Lab QA)',
        targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'IN_PROGRESS',
      },
      {
        id: 'sec-init-2',
        section: 'EMBELLISHMENT',
        processStep: 'Chest Placement Screen Printing (Plastisol / Water-based)',
        potentialFailureMode: 'Screen Print Cracking & Peeling After 5 Domestic Washes',
        potentialEffect: 'Severe customer aesthetic defect; buyer brand degradation and markdown chargeback.',
        potentialCauses: 'Incomplete curing tunnel dwell time (< 2.5 min) or drying temperature under 160°C.',
        currentControls: 'Surface touch check and visual ink opacity inspection only.',
        severity: 8,
        occurrence: 4,
        detection: 3,
        rpn: 96,
        riskLevel: 'MEDIUM',
        mitigationAction: 'Hourly thermo-probe oven temperature profiling + 50-times stretch and wash elasticity test.',
        responsibleLead: 'Mahmudul Hasan (Printing QA)',
        targetDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        status: 'IN_PROGRESS',
      },
      {
        id: 'sec-init-3',
        section: 'PRODUCT_TESTING',
        processStep: 'Seam Elasticity & Collar Assembly Tensile Recovery Test',
        potentialFailureMode: 'Neckline Elasticity Loss & Collar Head Opening Out of Spec (>2cm)',
        potentialEffect: 'Garment rejected at AQL final inspection; difficult head opening wearability.',
        potentialCauses: 'Differential feeding tension ratio out of balance; operator pull during circular feeding.',
        currentControls: 'Manual tape measure check on 5 garments per bundle.',
        severity: 8,
        occurrence: 4,
        detection: 3,
        rpn: 96,
        riskLevel: 'MEDIUM',
        mitigationAction: 'Install tension-free motorized metering roller on overlock machine + collar circumference jig.',
        responsibleLead: 'Mahmudul Hasan (IE Head)',
        targetDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
        status: 'IN_PROGRESS',
      },
      {
        id: 'sec-init-4',
        section: 'LEGAL_REQUIREMENT',
        processStep: 'Care Label Compliance & Translated Fiber Content Audit',
        potentialFailureMode: 'Incorrect Care Label Symbols, Wrong Fiber % Declaration or Missing RN/CA#',
        potentialEffect: 'Immediate customs seizure at port of entry; heavy administrative fines and mandatory re-labeling penalty.',
        potentialCauses: 'Typographical error in tech pack translation or using wrong label batch across mixed styles.',
        currentControls: 'Operator self-check during label attachment operation.',
        severity: 9,
        occurrence: 2,
        detection: 3,
        rpn: 54,
        riskLevel: 'CRITICAL',
        mitigationAction: 'Three-way cross verification protocol: Tech Pack vs. Buyer Care Spec vs. Physical Label Barcode before attachment release.',
        responsibleLead: 'Tanvir Ahmed (Compliance Officer)',
        targetDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        status: 'MITIGATED',
      },
    ];
  });

  // Active section tab for browsing & adding risks
  const [activeSectionTab, setActiveSectionTab] = useState<RiskSectionType | 'ALL'>('ALL');
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(
    sectionRisks[0]?.id || null
  );

  // Preset Modal State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  // Computed Section Statistics
  const sectionStats = useMemo(() => {
    return computeSectionRiskStats(sectionRisks);
  }, [sectionRisks]);

  // Overall Style Risk Level
  const overallRiskBadge = getRiskLevelBadge(sectionStats.overallLevel);

  // Image Uploads (Product & Process)
  const [productImage, setProductImage] = useState<string>(
    initialRecord?.productImage ||
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60'
  );
  const [processImage, setProcessImage] = useState<string>(
    initialRecord?.processImage || ''
  );

  // Preview Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(
    null
  );

  // File Inputs
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const processFileInputRef = useRef<HTMLInputElement>(null);

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      if (uploadEvt.target?.result) {
        setProductImage(uploadEvt.target.result as string);
        showToast('Product Image uploaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      if (uploadEvt.target?.result) {
        setProcessImage(uploadEvt.target.result as string);
        showToast('Process Image uploaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  // Switch Assessment Type
  const handleTypeSelect = (newType: RiskAssessmentType) => {
    setAssessmentType(newType);
    if (!isEditing) {
      setFmeaCode(
        `${getPrefix(newType)}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
      );
    }
  };

  // ─── BUYER & ORDER SELECTION HANDLER ──────────────────────────────────────
  const handleSelectOrderFromModule = (order: BuyerOrder) => {
    setStyleNumber(order.styleNumber);
    setBuyer(order.buyerName);
    setOrderNumber(order.orderNumber);
    setBuyerOrderId(order.id);
    setStyleDescription(order.styleDescription || '');
    setSeason(order.season || '');
    setOrderQuantity(order.orderQuantity);

    // Auto-fill product image from order if available
    if (order.productImage) {
      setProductImage(order.productImage);
    }

    if (!title || title.includes('STY-')) {
      setTitle(`${order.styleNumber} - ${order.styleDescription || order.buyerName} Risk Assessment`);
    }

    showToast(`Linked Style ${order.styleNumber} from Order ${order.orderNumber} (${order.buyerName})`);
  };

  // ─── MULTI-RISK SECTION CRUD HANDLERS ────────────────────────────────────
  const handleAddNewRisk = (targetSection?: RiskSectionType) => {
    const sec: RiskSectionType =
      targetSection || (activeSectionTab === 'ALL' ? 'RAW_MATERIAL' : activeSectionTab);

    const newRiskItem: RiskSectionItem = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      section: sec,
      processStep: `${RISK_SECTIONS[sec]?.label} Parameter Inspection`,
      potentialFailureMode: '',
      potentialEffect: '',
      potentialCauses: '',
      currentControls: '',
      severity: 7,
      occurrence: 4,
      detection: 3,
      rpn: computeRpn(7, 4, 3),
      riskLevel: getRiskLevel(computeRpn(7, 4, 3), 7),
      mitigationAction: '',
      responsibleLead: assessorName ? assessorName.split('(')[0].trim() : 'QA Lead',
      targetDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      status: 'IN_PROGRESS',
      notes: '',
    };

    setSectionRisks((prev) => [newRiskItem, ...prev]);
    setExpandedRiskId(newRiskItem.id);
    showToast(`Added new risk under ${RISK_SECTIONS[sec]?.label}`);
  };

  const handleAddPresetRisk = (preset: RiskSectionPreset) => {
    const rpn = computeRpn(preset.severity, preset.occurrence, preset.detection);
    const newRiskItem: RiskSectionItem = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      section: preset.section,
      processStep: preset.processStep,
      potentialFailureMode: preset.potentialFailureMode,
      potentialEffect: preset.potentialEffect,
      potentialCauses: preset.potentialCauses,
      currentControls: preset.currentControls,
      severity: preset.severity,
      occurrence: preset.occurrence,
      detection: preset.detection,
      rpn,
      riskLevel: getRiskLevel(rpn, preset.severity),
      mitigationAction: preset.mitigationAction,
      responsibleLead: preset.responsibleLead,
      targetDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      status: 'IN_PROGRESS',
      notes: preset.notes || '',
    };

    setSectionRisks((prev) => [newRiskItem, ...prev]);
    setExpandedRiskId(newRiskItem.id);
    showToast(`Added preset: "${preset.potentialFailureMode.slice(0, 35)}..."`);
  };

  const handleUpdateRisk = (
    id: string,
    field: keyof RiskSectionItem,
    value: any
  ) => {
    setSectionRisks((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };

        // Recompute RPN and Risk Level if S, O, or D change
        if (field === 'severity' || field === 'occurrence' || field === 'detection') {
          const s = field === 'severity' ? Number(value) : r.severity;
          const o = field === 'occurrence' ? Number(value) : r.occurrence;
          const d = field === 'detection' ? Number(value) : r.detection;
          updated.rpn = computeRpn(s, o, d);
          updated.riskLevel = getRiskLevel(updated.rpn, s);
        }
        return updated;
      })
    );
  };

  const handleDeleteRisk = (id: string) => {
    if (sectionRisks.length <= 1) {
      showToast('At least one risk item must remain in the assessment.');
      return;
    }
    setSectionRisks((prev) => prev.filter((r) => r.id !== id));
    showToast('Risk item removed');
  };

  const handleDuplicateRisk = (risk: RiskSectionItem) => {
    const duplicated: RiskSectionItem = {
      ...risk,
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      potentialFailureMode: `${risk.potentialFailureMode} (Copy)`,
    };
    setSectionRisks((prev) => [duplicated, ...prev]);
    setExpandedRiskId(duplicated.id);
    showToast('Duplicated risk item');
  };

  // Filtered risks for the current active section tab
  const displayRisks = useMemo(() => {
    if (activeSectionTab === 'ALL') return sectionRisks;
    return sectionRisks.filter((r) => r.section === activeSectionTab);
  }, [sectionRisks, activeSectionTab]);

  // ─── FORM SUBMIT HANDLER ────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!styleNumber.trim()) {
      showToast('Please enter or select a Target Style Number');
      return;
    }

    if (sectionRisks.length === 0) {
      showToast('Please add at least one Risk Item across the sections');
      return;
    }

    // Validate that each risk item has at least failure mode and mitigation
    const invalidItem = sectionRisks.find(
      (r) => !r.potentialFailureMode.trim() || !r.mitigationAction.trim()
    );
    if (invalidItem) {
      setExpandedRiskId(invalidItem.id);
      setActiveSectionTab('ALL');
      showToast(
        `Please provide Failure Mode and Mitigation Action for "${
          invalidItem.processStep || RISK_SECTIONS[invalidItem.section]?.label
        }"`
      );
      return;
    }

    const teamArray = assessorTeam
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Identify primary (highest RPN) risk for top-level backward compatibility
    let primaryRisk = sectionRisks[0];
    for (const r of sectionRisks) {
      if ((r.rpn || 0) > (primaryRisk.rpn || 0)) {
        primaryRisk = r;
      }
    }

    const recordToSave: RiskFmeaItem = {
      id: initialRecord?.id || `ra-${Date.now()}`,
      fmeaCode: fmeaCode.trim() || `RA-${Date.now()}`,
      assessmentType,
      assessmentDate,
      title:
        title.trim() ||
        `${styleNumber.trim()} - ${styleDescription || buyer} Multi-Section Risk Assessment`,
      styleNumber: styleNumber.trim(),
      buyer: buyer.trim(),
      department: department.trim(),

      // Top-level fields filled from primary risk
      processStep: primaryRisk.processStep,
      potentialFailureMode: primaryRisk.potentialFailureMode,
      potentialEffect: primaryRisk.potentialEffect,
      potentialCauses: primaryRisk.potentialCauses,
      currentControls: primaryRisk.currentControls,
      severity: primaryRisk.severity,
      occurrence: primaryRisk.occurrence,
      detection: primaryRisk.detection,
      rpn: primaryRisk.rpn,
      riskLevel: primaryRisk.riskLevel,
      mitigationAction: primaryRisk.mitigationAction,
      responsibleLead: primaryRisk.responsibleLead || assessorName,
      targetDate: primaryRisk.targetDate,
      status: primaryRisk.status || 'IN_PROGRESS',

      // Extended fields
      orderNumber: orderNumber.trim(),
      buyerOrderId: buyerOrderId.trim(),
      styleDescription: styleDescription.trim(),
      season: season.trim(),
      orderQuantity,
      primarySection: primaryRisk.section,
      sectionRisks: sectionRisks,

      productImage: productImage || undefined,
      processImage: processImage || undefined,
      assessorName: assessorName.trim(),
      assessorTeam: teamArray,
      notes: initialRecord?.notes || `${sectionRisks.length} section risks evaluated for this style.`,
      createdAt: initialRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(recordToSave);
    showToast(
      isEditing
        ? `Updated Risk Assessment ${fmeaCode} (${sectionRisks.length} Risks)`
        : `Created Multi-Section Risk Assessment ${fmeaCode} (${sectionRisks.length} Risks)`
    );
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Lightbox Zoom Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">{previewImage.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] w-auto rounded-xl object-contain shadow-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Style & Order Selector Modal */}
      <StyleOrderSelectorModal
        isOpen={isOrderSelectorOpen}
        onClose={() => setIsOrderSelectorOpen(false)}
        onSelectOrder={handleSelectOrderFromModule}
        selectedOrderId={buyerOrderId}
        selectedStyleNumber={styleNumber}
      />

      {/* Preset Risk Picker Modal */}
      <RiskSectionPresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        activeSection={activeSectionTab === 'ALL' ? 'RAW_MATERIAL' : activeSectionTab}
        existingRisks={sectionRisks}
        onAddPreset={handleAddPresetRisk}
      />

      {/* ─── NON-STICKY TOPBAR HEADER ─────────────────────────────────────────── */}
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
                {fmeaCode}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {isEditing ? 'EDITING ASSESSMENT' : 'NEW ASSESSMENT'}
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${overallRiskBadge.badgeClass}`}
              >
                STYLE: {overallRiskBadge.label} (MAX RPN {sectionStats.maxRpn})
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
              {isEditing
                ? `Edit Risk Assessment — ${styleNumber}`
                : `Product Style Risk Assessment (Multi-Section FMEA)`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Assessment ({sectionRisks.length} Risks)</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── 1. ASSESSMENT TYPE SELECTION CARDS ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                1. Select Assessment Scope &amp; Methodology
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">ISO 31000 / AIAG-VDA Standard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {RISK_ASSESSMENT_TYPES.map((typeOption) => {
              const isSelected = assessmentType === typeOption.type;
              return (
                <div
                  key={typeOption.type}
                  onClick={() => handleTypeSelect(typeOption.type)}
                  className={`relative rounded-2xl border p-4.5 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                    isSelected
                      ? `border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs`
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${typeOption.accentBg} ${typeOption.color} ${typeOption.borderColor}`}
                      >
                        {typeOption.badgeLabel}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{typeOption.label}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {typeOption.shortDesc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Evaluates: </span>
                    {typeOption.scopeList.slice(0, 2).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 2. PRODUCT & STYLE SELECTION FROM BUYER AND ORDER MODULE ───────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  2. Target Product Style (Linked to Buyer &amp; Order Module)
                </h2>
                <p className="text-xs text-slate-500">
                  Select a live order style to inherit buyer specifications, PO number, and garment photo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOrderSelectorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer shadow-2xs"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Select from Buyer &amp; Order Module</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualStyleEntry(!isManualStyleEntry)}
                className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                {isManualStyleEntry ? 'Hide Custom Fields' : 'Manual Entry'}
              </button>
            </div>
          </div>

          {/* Active Style Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Product Thumbnail */}
              <div className="relative group w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-xs">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={styleNumber}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-8 h-8 text-slate-400" />
                )}
                {productImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({ url: productImage, title: `${styleNumber} Garment Spec` })
                    }
                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Details Column */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-sm text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {styleNumber || 'NO STYLE SELECTED'}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    PO: {orderNumber || 'N/A'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {buyer || 'Standard Buyer'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {styleDescription || 'Apparel Product Style Description'}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  {season && <span>Season: <strong className="text-slate-700">{season}</strong></span>}
                  {orderQuantity && (
                    <span>
                      Order Qty: <strong className="text-slate-700 font-mono">{orderQuantity.toLocaleString()} pcs</strong>
                    </span>
                  )}
                  <span>Dept: <strong className="text-slate-700">{department}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => setIsOrderSelectorOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
              >
                Change Style
              </button>
            </div>
          </div>

          {/* Collapsible Manual Fields */}
          {isManualStyleEntry && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Manual Style &amp; Order Overrides
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Style Code / Number *
                  </label>
                  <input
                    type="text"
                    value={styleNumber}
                    onChange={(e) => setStyleNumber(e.target.value)}
                    placeholder="e.g. STY-TS-2026"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order / Purchase Order (PO#)
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. PO-HM-99201"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    value={buyer}
                    onChange={(e) => setBuyer(e.target.value)}
                    placeholder="e.g. H&M Hennes & Mauritz"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Line
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {SAMPLE_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Style Description / Garment Name
                  </label>
                  <input
                    type="text"
                    value={styleDescription}
                    onChange={(e) => setStyleDescription(e.target.value)}
                    placeholder="e.g. Men Heavyweight Cotton Crewneck Tee"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Season
                  </label>
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="e.g. Autumn/Winter 2026"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Quantity (Pcs)
                  </label>
                  <input
                    type="number"
                    value={orderQuantity || ''}
                    onChange={(e) => setOrderQuantity(Number(e.target.value) || undefined)}
                    placeholder="e.g. 45000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Assessment Date & Assessor Team Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assessment Date
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Assessor Name
              </label>
              <input
                type="text"
                value={assessorName}
                onChange={(e) => setAssessorName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed (Senior QA)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cross-Functional Team (CFT)
              </label>
              <input
                type="text"
                value={assessorTeam}
                onChange={(e) => setAssessorTeam(e.target.value)}
                placeholder="e.g. IE, Cutting Master, Sewing Supervisor"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ─── 3. MULTI-RISK SECTIONS MANAGER (CORE REQUIREMENT) ───────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  3. Multi-Risk Assessment by Section for {styleNumber}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Add multiple risks categorized under <strong>Raw Material</strong>, <strong>Embellishment</strong>, <strong>Product Testing</strong>, <strong>Legal Requirement</strong>, and more.
              </p>
            </div>

            {/* Quick Section Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Browse Preset Library</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddNewRisk()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Risk</span>
              </button>
            </div>
          </div>

          {/* Section Risk Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Risks</span>
              <span className="text-lg font-mono font-extrabold text-slate-900">
                {sectionStats.totalRisks} Items
              </span>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Maximum RPN</span>
              <span className="text-lg font-mono font-black text-rose-700">
                {sectionStats.maxRpn}
              </span>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Critical / High Risks</span>
              <span className="text-lg font-mono font-extrabold text-amber-700">
                {sectionStats.criticalCount + sectionStats.highCount}
              </span>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Overall Style Rating</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border inline-block mt-0.5 ${overallRiskBadge.badgeClass}`}>
                {overallRiskBadge.label}
              </span>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveSectionTab('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeSectionTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>All Sections</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeSectionTab === 'ALL' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {sectionRisks.length}
              </span>
            </button>

            {RISK_SECTION_ORDER.map((secKey) => {
              const meta = RISK_SECTIONS[secKey];
              const count = sectionStats.sectionCounts[secKey] || 0;
              const isSelected = activeSectionTab === secKey;

              return (
                <button
                  key={secKey}
                  type="button"
                  onClick={() => setActiveSectionTab(secKey)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
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

          {/* Section Header & Subtitle */}
          {activeSectionTab !== 'ALL' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-800">
                  {RISK_SECTIONS[activeSectionTab]?.label} Section
                </span>
                <span className="text-slate-500 ml-2">
                  {RISK_SECTIONS[activeSectionTab]?.shortDesc}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSectionTab(activeSectionTab);
                    setIsPresetModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 cursor-pointer"
                >
                  + Add from {RISK_SECTIONS[activeSectionTab]?.label} Presets
                </button>
                <button
                  type="button"
                  onClick={() => handleAddNewRisk(activeSectionTab)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                >
                  + Add Custom Risk
                </button>
              </div>
            </div>
          )}

          {/* List of Risks in Current Section */}
          <div className="space-y-4">
            {displayRisks.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3 bg-slate-50/50">
                <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">
                  No risks recorded under {activeSectionTab === 'ALL' ? 'this view' : RISK_SECTIONS[activeSectionTab]?.label} yet
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click below to add a common industry failure mode from the library or write a custom risk item.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeSectionTab !== 'ALL') {
                        setIsPresetModalOpen(true);
                      } else {
                        setIsPresetModalOpen(true);
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Browse Preset Library</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddNewRisk(activeSectionTab === 'ALL' ? 'RAW_MATERIAL' : activeSectionTab)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    + Add Custom Risk
                  </button>
                </div>
              </div>
            ) : (
              displayRisks.map((risk, index) => {
                const isExpanded = expandedRiskId === risk.id;
                const secMeta = RISK_SECTIONS[risk.section] || RISK_SECTIONS.OTHER;
                const rpnVal = risk.rpn || computeRpn(risk.severity, risk.occurrence, risk.detection);
                const level = risk.riskLevel || getRiskLevel(rpnVal, risk.severity);
                const badge = getRiskLevelBadge(level);

                return (
                  <div
                    key={risk.id}
                    className={`rounded-2xl border transition-all ${
                      isExpanded
                        ? 'border-blue-300 bg-white shadow-md ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Collapsed / Topbar Header */}
                    <div
                      onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/40 rounded-t-2xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${secMeta.badgeBg} ${secMeta.badgeText} ${secMeta.borderColor}`}
                        >
                          {secMeta.label.toUpperCase()}
                        </span>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate max-w-md sm:max-w-xl">
                            {risk.potentialFailureMode || (
                              <span className="text-slate-400 italic">Enter failure mode...</span>
                            )}
                          </h4>
                          <span className="text-[11px] text-slate-500 truncate block">
                            Process: <strong className="text-slate-700">{risk.processStep || 'Not specified'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-md border ${badge.badgeClass}`}>
                          RPN {rpnVal}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400">
                          S{risk.severity}·O{risk.occurrence}·D{risk.detection}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateRisk(risk);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                          title="Duplicate Risk"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRisk(risk.id);
                          }}
                          className="p-1 rounded-md text-rose-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete Risk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <span className="p-1 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Edit Form */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-100 space-y-5 animate-in fade-in duration-150">
                        {/* Section Selector & Step */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Section Category *
                            </label>
                            <select
                              value={risk.section}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'section', e.target.value as RiskSectionType)
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white font-bold cursor-pointer"
                            >
                              {RISK_SECTION_ORDER.map((sk) => (
                                <option key={sk} value={sk}>
                                  {RISK_SECTIONS[sk].label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Process Step / Component / Material Item *
                            </label>
                            <input
                              type="text"
                              value={risk.processStep}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'processStep', e.target.value)
                              }
                              placeholder="e.g. Single Jersey 180 GSM / Placement Screen Print / 90N Snap Pull"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                              required
                            />
                          </div>
                        </div>

                        {/* Failure Mode & Effect */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Potential Failure Mode *
                            </label>
                            <textarea
                              rows={2}
                              value={risk.potentialFailureMode}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'potentialFailureMode', e.target.value)
                              }
                              placeholder="How can this component or step fail? (e.g. Fabric color bleeding, print cracking, care label symbol wrong)"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Potential Effect on Customer / Product
                            </label>
                            <textarea
                              rows={2}
                              value={risk.potentialEffect}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'potentialEffect', e.target.value)
                              }
                              placeholder="Consequences if failure occurs (e.g. Garment rejected at final AQL, consumer complaint, customs hold)"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Causes & Current Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Potential Root Causes
                            </label>
                            <input
                              type="text"
                              value={risk.potentialCauses || ''}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'potentialCauses', e.target.value)
                              }
                              placeholder="e.g. Insufficient curing temp, operator manual pulling, uncalibrated tension"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Current Controls in Place
                            </label>
                            <input
                              type="text"
                              value={risk.currentControls || ''}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'currentControls', e.target.value)
                              }
                              placeholder="e.g. Supplier test report only, manual roving check"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* ─── FMEA SCORING RATING BARS (S × O × D) ────────────────── */}
                        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-blue-600" />
                              <span>FMEA Quantitative Scoring (1 - 10)</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-600">Calculated RPN:</span>
                              <span className={`font-mono text-sm font-black px-2.5 py-0.5 rounded-md border ${badge.badgeClass}`}>
                                {rpnVal} ({badge.label})
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Severity (S) */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-rose-800">
                                  Severity (S): {risk.severity}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {SEVERITY_RUBRIC[risk.severity]?.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleUpdateRisk(risk.id, 'severity', num)}
                                    className={`flex-1 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                      risk.severity === num
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                    }`}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-1">
                                {SEVERITY_RUBRIC[risk.severity]?.desc}
                              </p>
                            </div>

                            {/* Occurrence (O) */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-800">
                                  Occurrence (O): {risk.occurrence}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {OCCURRENCE_RUBRIC[risk.occurrence]?.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleUpdateRisk(risk.id, 'occurrence', num)}
                                    className={`flex-1 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                      risk.occurrence === num
                                        ? 'bg-amber-600 text-white shadow-2xs'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                                    }`}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-1">
                                {OCCURRENCE_RUBRIC[risk.occurrence]?.desc}
                              </p>
                            </div>

                            {/* Detection (D) */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-800">
                                  Detection (D): {risk.detection}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {DETECTION_RUBRIC[risk.detection]?.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleUpdateRisk(risk.id, 'detection', num)}
                                    className={`flex-1 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                      risk.detection === num
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-1">
                                {DETECTION_RUBRIC[risk.detection]?.desc}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Mitigation Action & Ownership */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Mandatory Mitigation Protocol &amp; Engineering Controls *
                            </label>
                            <input
                              type="text"
                              value={risk.mitigationAction}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'mitigationAction', e.target.value)
                              }
                              placeholder="Prescribe preventive SOP action (e.g. 100% lab wash test report before bulk cutting release)"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Responsible Lead / Officer
                            </label>
                            <input
                              type="text"
                              value={risk.responsibleLead || ''}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'responsibleLead', e.target.value)
                              }
                              placeholder="e.g. Lab Manager / IE Head"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Target Completion Date
                            </label>
                            <input
                              type="date"
                              value={risk.targetDate || ''}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'targetDate', e.target.value)
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Risk Mitigation Status
                            </label>
                            <select
                              value={risk.status || 'IN_PROGRESS'}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'status', e.target.value as RiskStatus)
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white font-semibold cursor-pointer"
                            >
                              <option value="DRAFT">Draft</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="MITIGATED">Mitigated</option>
                              <option value="APPROVED">Approved</option>
                              <option value="CLOSED">Closed</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Verification Notes
                            </label>
                            <input
                              type="text"
                              value={risk.notes || ''}
                              onChange={(e) =>
                                handleUpdateRisk(risk.id, 'notes', e.target.value)
                              }
                              placeholder="e.g. Lab trial batch passed with 98.4% score"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── 4. VISUAL REFERENCE PHOTOS (DUAL: PRODUCT & PROCESS) ──────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                4. Visual Reference Evidence (Product &amp; Process Photos)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">JPG, PNG or Base64</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Product / Garment Spec Image
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Style construction, trim placement or defect detail
                  </span>
                </div>
                {productImage && (
                  <button
                    type="button"
                    onClick={() => setProductImage('')}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              {productImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-4/3 flex items-center justify-center">
                  <img
                    src={productImage}
                    alt="Product Evidence"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({ url: productImage, title: 'Product Garment Reference' })
                      }
                      className="px-3 py-1.5 rounded-lg bg-white text-xs font-bold text-slate-900 shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                    </button>
                    <button
                      type="button"
                      onClick={() => productFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Change
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => productFileInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center aspect-4/3 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">Upload Product Spec Image</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Click to browse or drag file</span>
                </div>
              )}
              <input
                ref={productFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProductImageUpload}
                className="hidden"
              />
            </div>

            {/* Process Image Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Process / Machine Setup Image
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Folder, jig, guide, gauge or workstation arrangement
                  </span>
                </div>
                {processImage && (
                  <button
                    type="button"
                    onClick={() => setProcessImage('')}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              {processImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-4/3 flex items-center justify-center">
                  <img
                    src={processImage}
                    alt="Process Evidence"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({ url: processImage, title: 'Process Jig Reference' })
                      }
                      className="px-3 py-1.5 rounded-lg bg-white text-xs font-bold text-slate-900 shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                    </button>
                    <button
                      type="button"
                      onClick={() => processFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Change
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => processFileInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center aspect-4/3 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">Upload Process Jig Image</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Click to browse or drag file</span>
                </div>
              )}
              <input
                ref={processFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProcessImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* ─── 5. FINAL ACTION BAR ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Ready to Record {sectionRisks.length} Section Risks for {styleNumber}
              </span>
              <span className="text-[11px] text-slate-500">
                Linked to Buyer: {buyer} • PO: {orderNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Complete Assessment</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
