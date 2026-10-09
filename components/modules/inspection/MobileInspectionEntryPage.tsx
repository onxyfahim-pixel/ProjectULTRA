'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Smartphone,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Save,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronLeft,
  Camera,
  Upload,
  Trash2,
  Eye,
  FileText,
  Package,
  Layers,
  Scale,
  Sliders,
  Sparkles,
  RotateCcw,
  User,
  Tag,
  CheckSquare,
  XCircle,
  FileCheck2,
  Maximize2,
  BadgeAlert,
  Send,
  PenTool,
  Clock,
  Printer,
  ExternalLink,
} from 'lucide-react';
import {
  InspectionRecord,
  InspectionType,
  InspectionStatus,
  InspectionStage,
  DefectItem,
  InspectionSizeBreakdownItem,
  InspectionPhotoEvidence,
  InspectionTestRecord,
  InspectionCompliancePhoto,
  VisualComplianceCategory,
  PackingZeroToleranceItem,
  DefectSeverity,
} from '@/lib/types/erp';
import { BuyerOrder } from '@/lib/types/modules';
import {
  calculateAqlInspection,
  evaluateAqlVerdict,
  calculateQuantityVariance,
  AqlCalculationResult,
} from '@/lib/aql';
import { calculateSizeSamplePickups, deriveSizeBreakdownFromBuyerOrder } from './inspection-size-utils';

export interface MobileInspectionEntryPageProps {
  orders: BuyerOrder[];
  initialRecord?: Partial<InspectionRecord> | null;
  onSave: (record: InspectionRecord) => void;
  onBack?: () => void;
  onCancel?: () => void;
  showToast: (msg: string) => void;
}

// Default 0-tolerance packing check items
const DEFAULT_ZERO_TOLERANCE_ITEMS: PackingZeroToleranceItem[] = [
  { id: 'zt-1', name: 'Mold, Mildew, Damp Odor or Fungus', hasDefect: false, notes: 'Zero tolerance: Immediate lot rejection' },
  { id: 'zt-2', name: 'Live Insects, Bugs or Pest Contamination', hasDefect: false, notes: 'Zero tolerance: Fumigation / rejection' },
  { id: 'zt-3', name: 'Broken Needle Fragment or Sharp Metal Object', hasDefect: false, notes: 'Must pass 1.0mm ferrous detector' },
  { id: 'zt-4', name: 'Wrong Barcode, Size Label Mismatch or Cross-Packing', hasDefect: false, notes: 'Retail scanning compliance' },
  { id: 'zt-5', name: 'Wet Garment / Moisture Exceeding Safety Standard', hasDefect: false, notes: 'Must be below 12% moisture' },
  { id: 'zt-6', name: 'Blood, Bodily Fluid or Chemical Soil Stain', hasDefect: false, notes: 'Biohazard & hygiene safety' },
  { id: 'zt-7', name: 'Missing Mandatory Polybag Choking Warning', hasDefect: false, notes: 'Legal safety requirement' },
];

// Default On-Site Tests
const DEFAULT_ON_SITE_TESTS: InspectionTestRecord[] = [
  { id: 'test-1', testName: 'Barcode Scanning Test (Carton & Polybag)', status: 'PASS', remark: '100% readable via 2D handheld scanner' },
  { id: 'test-2', testName: 'Carton 10-Point Drop Test (ISTA Standard)', status: 'PASS', remark: 'Zero burst seams or carton deformation' },
  { id: 'test-3', testName: 'Needle & Metal Detection Calibration Check', status: 'PASS', remark: 'Passed 1.0mm Fe / 1.2mm Non-Fe test cards' },
  { id: 'test-4', testName: 'Fabric GSM / Unit Area Weight Verification', status: 'PASS', remark: 'Within +/- 3% of buyer approved specimen' },
  { id: 'test-5', testName: 'Fastener / Snap Button 90N Pull Test', status: 'PASS', remark: 'Held 90 Newtons for 10 seconds without detachment' },
  { id: 'test-6', testName: 'Garment Moisture Meter Check (< 12%)', status: 'PASS', remark: 'Digital reading: 8.4% (Dry & Safe)' },
];

// Visual & Compliance Categories
const VISUAL_COMPLIANCE_TABS: { key: VisualComplianceCategory; label: string; desc: string; icon: string }[] = [
  { key: 'CARTON', label: 'Carton & Packing', desc: 'Outer carton, sealing tape, shipping marks & barcode', icon: '📦' },
  { key: 'STICKER', label: 'Stickers & UPC', desc: 'Price ticket, UPC barcode, carton & size stickers', icon: '🏷️' },
  { key: 'ACCESSORIES', label: 'Trims & Accessories', desc: 'Buttons, zippers, pullers, drawstrings & hangtags', icon: '🧵' },
  { key: 'FRONT_BACK_VIEW', label: 'Product Front/Back', desc: 'Full flat-lay view front and back with shape symmetry', icon: '👕' },
  { key: 'RATIO', label: 'Assortment & Ratio', desc: 'Carton packing assortment, color ratio & folding check', icon: '⚖️' },
  { key: 'LABELS', label: 'Labels & Care Tag', desc: 'Main brand label, care instructions, origin & RN#', icon: '🔖' },
  { key: 'POLY_HANGER', label: 'Polybag & Hanger', desc: 'Warning print, poly thickness & hanger specifications', icon: '🛍️' },
  { key: 'OTHER', label: 'Other Verifications', desc: 'Special embellishments, embroidery & wash effects', icon: '✨' },
];

// Common Garment Defects list for fast mobile entry
const COMMON_DEFECT_TYPES = [
  'Skip Stitch',
  'Broken Stitch',
  'Seam Puckering',
  'Open / Raw Seam',
  'Needle Hole / Thread Pull',
  'Oil Stain / Machine Grease',
  'Shade Variation (Band)',
  'Uneven Hem / Cuff',
  'Pleat / Fold Misalignment',
  'Label Position Off-Center',
  'Buttonhole Frayed / Misplaced',
  'Missing Snap / Button',
  'Wavy / Distorted Placket',
  'Polybag Barcode Unreadable',
  'Carton Marking Inaccurate',
  'Loose Thread End (> 1/4")',
  'Measurement Out of Tolerance',
  'Wrong Thread Color',
];

const DEFECT_LOCATIONS = [
  'Front Placket',
  'Collar / Neckline',
  'Left Sleeve',
  'Right Sleeve',
  'Cuff',
  'Bottom Hem',
  'Side Seam (Left)',
  'Side Seam (Right)',
  'Shoulder Seam',
  'Armhole Seam',
  'Back Yoke',
  'Chest Pocket',
  'Waistband',
  'Inside Lining',
  'Main Label',
  'Overall Garment',
];

// Responsive Signature Pad Canvas Component (fits 100% container width)
function SignaturePad({
  label,
  value,
  onChange,
  onClear,
}: {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(Boolean(value));

  // Dynamically match canvas internal width to actual container width
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const targetWidth = Math.max(260, Math.floor(rect.width));
      const targetHeight = 120;

      if (canvas.width !== targetWidth) {
        let prevData: string | null = null;
        if (hasContent && canvas.width > 0) {
          prevData = canvas.toDataURL('image/png');
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const dataToDraw = prevData || value;
        if (dataToDraw) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              setHasContent(true);
            };
            img.src = dataToDraw;
          }
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [value, hasContent]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onClear();
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-800 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          <span>{label}</span>
        </label>
        {hasContent && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg bg-rose-50"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="relative w-full border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs hover:border-blue-400 transition-colors"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[120px] touch-none cursor-crosshair bg-slate-50/50 block"
        />
        {!hasContent && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
            <span>✍️ Sign with finger inside box</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileInspectionEntryPage({
  orders,
  initialRecord,
  onSave,
  onBack,
  onCancel,
  showToast,
}: MobileInspectionEntryPageProps) {
  const triggerBack = () => {
    if (onBack) onBack();
    else if (onCancel) onCancel();
  };

  // Fullscreen & Mobile Viewport Detection
  const [mounted, setMounted] = useState(false);
  const [isMobileBrowser, setIsMobileBrowser] = useState(true);
  const [forceDesktopFullscreen, setForceDesktopFullscreen] = useState(false);

  // Lock background scroll when mobile terminal is active
  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, []);

  // Detect mobile device vs desktop screen
  useEffect(() => {
    const checkIsMobile = () => {
      const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || ''
      );
      const screenMobile = window.innerWidth <= 1024;
      const isTouch =
        typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setIsMobileBrowser(uaMobile || screenMobile || (isTouch && window.innerWidth <= 1280));
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Mobile Entry Step State: 1 to 10
  const [currentStep, setCurrentStep] = useState<number>(1);

  // STEP 1 STATE: PO & Order Information
  const [selectedBuyerOrderId, setSelectedBuyerOrderId] = useState<string>(
    initialRecord?.buyerOrderId || ''
  );
  const [poNumber, setPoNumber] = useState<string>(
    initialRecord?.orderNumber || (initialRecord?.poNumbers?.[0] || 'PO-2026-9041')
  );
  const [buyerName, setBuyerName] = useState<string>(initialRecord?.buyer || 'Inditex (Zara)');
  const [styleNumber, setStyleNumber] = useState<string>(initialRecord?.styleNumber || 'ST-4820-KNIT');
  const [styleDescription, setStyleDescription] = useState<string>(
    initialRecord?.styleDescription || 'Men Crewneck Ribbed Jersey Tee'
  );
  const [inspectionStage, setInspectionStage] = useState<InspectionStage>(
    initialRecord?.stage || 'FINISHING_PACKING'
  );
  const [inspectionType, setInspectionType] = useState<InspectionType>(
    initialRecord?.inspectionType || 'FINAL'
  );
  const [lotNumber, setLotNumber] = useState<string>(initialRecord?.lotNumber || 'LOT-2026-088');
  const [factoryUnit, setFactoryUnit] = useState<string>(initialRecord?.factoryUnit || 'Unit 01 (Dhaka Complex)');
  const [orderQuantity, setOrderQuantity] = useState<number>(initialRecord?.orderQuantity || 10000);

  // STEP 2 STATE: Inspection Quantity Entry (Offered Quantity & Variance)
  const [lotQuantity, setLotQuantity] = useState<number>(
    initialRecord?.lotQuantity || initialRecord?.orderQuantity || 10000
  );
  const [cartonCount, setCartonCount] = useState<number>(
    initialRecord?.cartonCount || Math.ceil((initialRecord?.lotQuantity || 10000) / 24)
  );
  const [packedPercent, setPackedPercent] = useState<number>(initialRecord?.packedPercent || 100);
  const [quantityVarianceNotes, setQuantityVarianceNotes] = useState<string>(initialRecord?.remarks || '');

  // STEP 3 STATE: Sample Pickup Page (Color & Size Breakdown)
  const [sizeBreakdown, setSizeBreakdown] = useState<InspectionSizeBreakdownItem[]>(() => {
    if (initialRecord?.sizeBreakdown && initialRecord.sizeBreakdown.length > 0) {
      return initialRecord.sizeBreakdown;
    }
    return [
      { size: 'S', orderQuantity: 2000, inspectedQuantity: 2000, samplePickupQuantity: 42, colorName: 'Black / Navy' },
      { size: 'M', orderQuantity: 3000, inspectedQuantity: 3000, samplePickupQuantity: 63, colorName: 'Black / Navy' },
      { size: 'L', orderQuantity: 2500, inspectedQuantity: 2500, samplePickupQuantity: 52, colorName: 'Black / Navy' },
      { size: 'XL', orderQuantity: 1500, inspectedQuantity: 1500, samplePickupQuantity: 31, colorName: 'Black / Navy' },
      { size: 'XXL', orderQuantity: 1000, inspectedQuantity: 1000, samplePickupQuantity: 21, colorName: 'Black / Navy' },
    ];
  });

  // STEP 4 STATE: PO Sheet & Sample Carton Photos
  const [poSheetPhotos, setPoSheetPhotos] = useState<InspectionPhotoEvidence[]>(
    initialRecord?.poSheetPhotos || []
  );
  const [sampleCartonPhotos, setSampleCartonPhotos] = useState<InspectionPhotoEvidence[]>(
    initialRecord?.sampleCartonPhotos || []
  );

  // STEP 5 STATE: Test Record Image Capture & Pass/Fail Checks
  const [testRecords, setTestRecords] = useState<InspectionTestRecord[]>(() => {
    if (initialRecord?.testRecords && initialRecord.testRecords.length > 0) {
      return initialRecord.testRecords;
    }
    return DEFAULT_ON_SITE_TESTS;
  });

  // STEP 6 STATE: Visual & Compliance Image Register
  const [compliancePhotos, setCompliancePhotos] = useState<InspectionCompliancePhoto[]>(
    initialRecord?.compliancePhotos || []
  );
  const [activeComplianceTab, setActiveComplianceTab] = useState<VisualComplianceCategory>('CARTON');

  // STEP 7 STATE: Packing Check with 0-Tolerance Critical Verification
  const [packingZeroToleranceChecks, setPackingZeroToleranceChecks] = useState<PackingZeroToleranceItem[]>(() => {
    if (initialRecord?.packingZeroToleranceChecks && initialRecord.packingZeroToleranceChecks.length > 0) {
      return initialRecord.packingZeroToleranceChecks;
    }
    return DEFAULT_ZERO_TOLERANCE_ITEMS;
  });

  // STEP 8 STATE: Defect Entry with Image Upload & AQL Limit Auto-Fail
  const [defectsList, setDefectsList] = useState<DefectItem[]>(
    initialRecord?.defects || []
  );
  const [newDefectType, setNewDefectType] = useState<string>('Skip Stitch');
  const [newDefectSeverity, setNewDefectSeverity] = useState<DefectSeverity>('MAJOR');
  const [newDefectCount, setNewDefectCount] = useState<number>(1);
  const [newDefectLocation, setNewDefectLocation] = useState<string>('Front Placket');
  const [newDefectRemark, setNewDefectRemark] = useState<string>('');
  const [newDefectPhoto, setNewDefectPhoto] = useState<string>('');

  // STEP 9 STATE: Garment Measurement Sheet
  const [measurementSheetPhotos, setMeasurementSheetPhotos] = useState<InspectionPhotoEvidence[]>(
    initialRecord?.measurementSheetPhotos || []
  );
  const [measurementNotes, setMeasurementNotes] = useState<string>('');

  // STEP 10 STATE: Inspector & Factory Representative Dual Sign-off
  const [inspectorName, setInspectorName] = useState<string>(
    initialRecord?.inspectorName || 'Al-Amin Hossain (Senior QA)'
  );
  const [inspectorSignature, setInspectorSignature] = useState<string>(
    initialRecord?.inspectorSignature || ''
  );
  const [representativeName, setRepresentativeName] = useState<string>(
    initialRecord?.representativeName || 'Md. Jahangir Kabir (Factory QA Mgr)'
  );
  const [representativeSignature, setRepresentativeSignature] = useState<string>(
    initialRecord?.representativeSignature || ''
  );

  // Active Lightbox Modal for Photo Zoom
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // PO Live Search Dropdown State
  const [poSearchQuery, setPoSearchQuery] = useState('');
  const [isPoDropdownOpen, setIsPoDropdownOpen] = useState(false);

  // Available Buyer Orders Filtered
  const filteredOrders = useMemo(() => {
    if (!poSearchQuery.trim()) return orders.slice(0, 10);
    const q = poSearchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        o.styleNumber.toLowerCase().includes(q) ||
        o.styleDescription.toLowerCase().includes(q)
    );
  }, [orders, poSearchQuery]);

  // Handle PO selection from dropdown
  const handleSelectOrder = (order: BuyerOrder) => {
    setSelectedBuyerOrderId(order.id);
    setPoNumber(order.orderNumber);
    setBuyerName(order.buyerName);
    setStyleNumber(order.styleNumber);
    setStyleDescription(order.styleDescription);
    setOrderQuantity(order.orderQuantity);
    setLotQuantity(order.orderQuantity);
    if ((order as any).factory || (order as any).factoryUnit) {
      setFactoryUnit((order as any).factory || (order as any).factoryUnit);
    }

    const derivedBreakdown = deriveSizeBreakdownFromBuyerOrder(order);
    if (derivedBreakdown.length > 0) {
      setSizeBreakdown(derivedBreakdown);
    }
    setIsPoDropdownOpen(false);
    showToast(`Loaded Order: ${order.orderNumber} (${order.buyerName})`);
  };

  // Live AQL 2.5 Normal Level II Calculations
  const aqlData: AqlCalculationResult = useMemo(() => {
    return calculateAqlInspection(lotQuantity, '2.5', '4.0');
  }, [lotQuantity]);

  // Recalculate size sample pickups whenever sample size or breakdown changes
  useEffect(() => {
    if (aqlData.sampleSize > 0 && sizeBreakdown.length > 0) {
      const updated = calculateSizeSamplePickups(sizeBreakdown, aqlData.sampleSize);
      setSizeBreakdown(updated);
    }
  }, [aqlData.sampleSize]);

  // Quantity Variance Calculation
  const varianceData = useMemo(() => {
    return calculateQuantityVariance(orderQuantity, lotQuantity);
  }, [orderQuantity, lotQuantity]);

  // Defect Counts Calculation
  const criticalDefectsCount = defectsList.filter((d) => d.severity === 'CRITICAL').reduce((sum, d) => sum + d.count, 0);
  const majorDefectsCount = defectsList.filter((d) => d.severity === 'MAJOR').reduce((sum, d) => sum + d.count, 0);
  const minorDefectsCount = defectsList.filter((d) => d.severity === 'MINOR').reduce((sum, d) => sum + d.count, 0);
  const totalDefectsCount = criticalDefectsCount + majorDefectsCount + minorDefectsCount;

  // Check if any zero-tolerance item has failed
  const hasZeroToleranceFail = useMemo(() => {
    return packingZeroToleranceChecks.some((i) => i.hasDefect);
  }, [packingZeroToleranceChecks]);

  // Evaluate AQL Verdict & Reasons
  const aqlVerdict = useMemo(() => {
    if (hasZeroToleranceFail) {
      return {
        verdict: 'REJECTED' as InspectionStatus,
        reason: 'CRITICAL FAIL: 0-Tolerance defect detected during packing audit.',
      };
    }
    const evaluated = evaluateAqlVerdict(criticalDefectsCount, majorDefectsCount, minorDefectsCount, aqlData);
    return evaluated;
  }, [hasZeroToleranceFail, criticalDefectsCount, majorDefectsCount, minorDefectsCount, aqlData]);

  // Helper for mobile camera / photo upload
  const handleUploadPhoto = (
    file: File,
    onSuccess: (photo: InspectionPhotoEvidence) => void
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const photo: InspectionPhotoEvidence = {
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url,
        caption: file.name,
        remark: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onSuccess(photo);
    };
    reader.readAsDataURL(file);
  };

  // Defect Creation Handler
  const handleAddDefect = () => {
    if (!newDefectType.trim()) return;
    const item: DefectItem = {
      id: `def-${Date.now()}`,
      defectType: newDefectType,
      severity: newDefectSeverity,
      count: newDefectCount,
      location: newDefectLocation,
      photoUrl: newDefectPhoto || undefined,
      remark: newDefectRemark || undefined,
    };
    setDefectsList((prev) => [item, ...prev]);
    setNewDefectRemark('');
    setNewDefectPhoto('');
    showToast(`Logged ${newDefectCount}x ${newDefectType} (${newDefectSeverity})`);
  };

  const handleRemoveDefect = (id: string) => {
    setDefectsList((prev) => prev.filter((d) => d.id !== id));
  };

  // Final Save Handler
  const handleFinalSubmit = () => {
    if (!inspectorSignature) {
      showToast('Please provide Inspector Signature on the Signature Pad');
      return;
    }

    const inspectionCode =
      initialRecord?.inspectionCode ||
      `FRI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const savedRecord: InspectionRecord = {
      id: initialRecord?.id || `insp-${Date.now()}`,
      inspectionCode,
      inspectionType,
      orderNumber: poNumber,
      poNumbers: [poNumber],
      buyerOrderId: selectedBuyerOrderId || undefined,
      styleNumber,
      styleDescription,
      lotNumber,
      stage: inspectionStage,
      sampleSize: aqlData.sampleSize,
      orderQuantity,
      lotQuantity,
      excessQuantity: varianceData.diff > 0 ? varianceData.diff : 0,
      shortQuantity: varianceData.diff < 0 ? Math.abs(varianceData.diff) : 0,
      quantityVariance: varianceData.diff,
      sizeBreakdown,
      aqlCodeLetter: aqlData.codeLetter,
      maxAllowedMajor: aqlData.majorAc,
      majorRejectionPoint: aqlData.majorRe,
      maxAllowedMinor: aqlData.minorAc,
      minorRejectionPoint: aqlData.minorRe,
      maxAllowedCritical: 0,
      cartonCount,
      packedPercent,
      aqlLevel: 'Level II Normal',
      passCount: Math.max(0, aqlData.sampleSize - totalDefectsCount),
      defectCount: totalDefectsCount,
      majorDefects: majorDefectsCount,
      minorDefects: minorDefectsCount,
      criticalDefects: criticalDefectsCount,
      status: aqlVerdict.verdict,
      inspectorId: 'insp-current',
      inspectorName,
      buyer: buyerName,
      factoryUnit,
      unit: factoryUnit,
      createdAt: initialRecord?.createdAt || new Date().toISOString(),
      remarks: quantityVarianceNotes || `Inspected on-site with mobile walkthrough: ${aqlVerdict.verdict}`,
      isMobileEntry: true,
      poSheetPhotos,
      sampleCartonPhotos,
      testRecords,
      compliancePhotos,
      packingZeroToleranceChecks,
      hasZeroToleranceFail,
      measurementSheetPhotos,
      inspectorSignature,
      representativeName,
      representativeSignature,
      defects: defectsList,
    };

    onSave(savedRecord);
    showToast(`Saved Mobile Inspection Record: ${inspectionCode} (${aqlVerdict.verdict})`);
  };

  // Step Titles for Ribbon & Navigation
  const STEP_TITLES = [
    'PO Select',
    'Inspection Qty',
    'Sample Pickup',
    'PO & Carton Photos',
    'Test Records',
    'Visual Compliance',
    '0-Tolerance Check',
    'Defect Entry',
    'Measurements',
    'Signatures & Submit',
  ];

  // ─── TERMINAL INNER COMPONENT ──────────────────────────────────────────
  const terminalInner = (
    <div className="flex flex-col h-full w-full bg-slate-100 text-slate-800 overflow-hidden select-none">
      {/* ─── 1. TOP STICKY MOBILE HEADER ─── */}
      <div className="shrink-0 bg-slate-900 text-white shadow-md border-b border-slate-800 z-40">
        <div className="px-3 py-2 sm:px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={triggerBack}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight truncate">
                  Mobile Inspection Entry
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                Step {currentStep} of 10: {STEP_TITLES[currentStep - 1]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                aqlVerdict.verdict === 'PASSED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
              }`}
            >
              {aqlVerdict.verdict}
            </span>

            {forceDesktopFullscreen && (
              <button
                type="button"
                onClick={() => setForceDesktopFullscreen(false)}
                className="text-[10px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                title="Phone Frame Preview"
              >
                Frame
              </button>
            )}

            <button
              type="button"
              onClick={triggerBack}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-emerald-500 h-1 transition-all duration-300"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>

        {/* Step Navigation Ribbon */}
        <div className="px-2 py-1 flex items-center gap-1 overflow-x-auto no-scrollbar bg-slate-950/80 border-t border-slate-800/60 text-[10px] font-mono">
          {STEP_TITLES.map((title, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <button
                key={title}
                type="button"
                onClick={() => setCurrentStep(stepNum)}
                className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isCompleted
                    ? 'text-emerald-400 hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{stepNum}</span>
                <span className="hidden xs:inline">{title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. MIDDLE SCROLLABLE TOUCH CONTAINER ─── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4 space-y-3.5 w-full max-w-lg mx-auto">
        {/* Active Audit Target Header Card */}
        {poNumber && (
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
                Target Audit Order
              </span>
              <div className="font-bold font-mono text-slate-900 truncate text-[11px] sm:text-xs">
                PO: <span className="text-blue-700">{poNumber}</span> &bull; {styleNumber}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {buyerName} &bull; Lot: {lotQuantity.toLocaleString()} pcs
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] text-slate-400 block font-mono">Sample Qty</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-700">
                {aqlData.sampleSize} pcs
              </span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1: PO SELECTION & AUDIT ORDER
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>1. Select Purchase Order (PO)</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Search active orders or type manually to auto-fill specifications.
              </p>
            </div>

            {/* PO Live Search Input */}
            <div className="relative space-y-1">
              <label className="text-xs font-bold text-slate-700">PO Number / Order Search:</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={poSearchQuery || poNumber}
                  onChange={(e) => {
                    setPoSearchQuery(e.target.value);
                    setPoNumber(e.target.value);
                    setIsPoDropdownOpen(true);
                  }}
                  onFocus={() => setIsPoDropdownOpen(true)}
                  placeholder="Search PO#, Buyer or Style..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-semibold"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isPoDropdownOpen && filteredOrders.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl space-y-1 p-1 z-30">
                  {filteredOrders.map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => handleSelectOrder(ord)}
                      className="w-full text-left p-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-blue-700 truncate">{ord.orderNumber}</div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {ord.buyerName} &bull; {ord.styleNumber}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-semibold text-slate-700 text-[11px]">
                          {ord.orderQuantity.toLocaleString()} pcs
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Order Summary Card */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Buyer:</span>
                <span className="font-bold text-slate-800 truncate block">{buyerName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Style #:</span>
                <span className="font-bold text-slate-800 truncate block font-mono">{styleNumber}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Contracted Qty:</span>
                <span className="font-bold text-blue-700 font-mono block">{orderQuantity.toLocaleString()} pcs</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Lot / Batch #:</span>
                <input
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className="w-full text-xs font-mono font-bold text-slate-800 bg-transparent border-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Inspection Stage / Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Audit Type / Inspection Level:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'INLINE' as InspectionType, label: 'Inline Inspection', sub: 'During Sewing' },
                  { key: 'MIDLINE' as InspectionType, label: 'Midline Audit', sub: '50% Production' },
                  { key: 'PRE_FINAL' as InspectionType, label: 'Pre-Final', sub: '50-80% Packed' },
                  { key: 'FINAL' as InspectionType, label: 'Final (FRI)', sub: '100% Packed (FRI)' },
                ].map((stg) => (
                  <button
                    key={stg.key}
                    type="button"
                    onClick={() => {
                      setInspectionType(stg.key);
                      if (stg.key === 'FINAL') setInspectionStage('FINISHING_PACKING');
                      else if (stg.key === 'INLINE') setInspectionStage('SEWING_IN_LINE');
                    }}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      inspectionType === stg.key
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{stg.label}</div>
                    <div className="text-[10px] text-slate-400">{stg.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Factory Unit */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Manufacturing Unit / Facility:</label>
              <input
                type="text"
                value={factoryUnit}
                onChange={(e) => setFactoryUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
              />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2: INSPECTION QUANTITY ENTRY (OFFERED QTY & PLUS/SHORT)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>2. Inspection Quantity &amp; Variance</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter offered lot quantity to calculate plus (+) or shortage (-) tolerance.
              </p>
            </div>

            {/* Contracted vs Offered Input */}
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Contracted PO Qty:</span>
                <span className="text-sm font-bold font-mono text-slate-800">{orderQuantity.toLocaleString()} pcs</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Offered / Presented Inspection Qty (pcs):</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(0, lotQuantity - 100);
                      setLotQuantity(next);
                      setCartonCount(Math.ceil(next / 24));
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm cursor-pointer shrink-0"
                  >
                    -100
                  </button>
                  <input
                    type="number"
                    value={lotQuantity}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setLotQuantity(val);
                      setCartonCount(Math.ceil(val / 24));
                    }}
                    className="flex-1 px-3 py-2 text-base text-center bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold text-blue-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = lotQuantity + 100;
                      setLotQuantity(next);
                      setCartonCount(Math.ceil(next / 24));
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm cursor-pointer shrink-0"
                  >
                    +100
                  </button>
                </div>
              </div>
            </div>

            {/* Live Plus / Short Variance Alert Card */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${
                varianceData.isExcess
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : varianceData.isShort
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
              }`}
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {varianceData.isExcess ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-emerald-800 truncate">Excess Lot (+{varianceData.percentage}%)</span>
                    </>
                  ) : varianceData.isShort ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-amber-800 truncate">Short Lot ({varianceData.percentage}%)</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-blue-800 truncate">100% Matched</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 truncate">
                  {varianceData.isExcess
                    ? `Over PO by +${varianceData.diff.toLocaleString()} pcs (permitted)`
                    : varianceData.isShort
                    ? `Short by ${Math.abs(varianceData.diff).toLocaleString()} pcs (split shipment)`
                    : 'Lot matches contracted order quantity.'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black font-mono block">
                  {varianceData.diff > 0 ? `+${varianceData.diff.toLocaleString()}` : varianceData.diff.toLocaleString()} pcs
                </span>
                <span className="text-[9px] font-mono text-slate-500">Variance</span>
              </div>
            </div>

            {/* Cartons & Packing Percentage */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Carton Count:</label>
                <input
                  type="number"
                  value={cartonCount}
                  onChange={(e) => setCartonCount(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Packed %:</label>
                <input
                  type="number"
                  value={packedPercent}
                  onChange={(e) => setPackedPercent(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Quantity / Shipment Notes:</label>
              <textarea
                rows={2}
                value={quantityVarianceNotes}
                onChange={(e) => setQuantityVarianceNotes(e.target.value)}
                placeholder="Optional notes regarding carton count or short shipment approval..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 3: SAMPLE PICKUP PAGE (AUTO BREAKDOWN BY COLOR & SIZE)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>3. Sample Pickup &amp; Size Breakdown</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Auto-calculated MIL-STD-105E / ISO 2859-1 Level II sampling plan.
              </p>
            </div>

            {/* AQL Banner Hero */}
            <div className="p-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-xs flex items-center justify-between gap-2">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-blue-300 block">
                  AQL Level II Normal &bull; Code {aqlData.codeLetter}
                </span>
                <div className="text-lg font-black font-mono">
                  Sample: {aqlData.sampleSize} Pcs
                </div>
                <div className="text-[10px] text-blue-200">
                  Cartons: ~{Math.ceil(Math.sqrt(cartonCount) + 1)} boxes
                </div>
              </div>
              <div className="text-right font-mono text-[10px] space-y-1 shrink-0">
                <div className="bg-white/10 px-2 py-0.5 rounded">
                  Major: <strong className="text-emerald-300">Ac {aqlData.majorAc}</strong> / <strong className="text-rose-300">Re {aqlData.majorRe}</strong>
                </div>
                <div className="bg-white/10 px-2 py-0.5 rounded">
                  Minor: <strong className="text-emerald-300">Ac {aqlData.minorAc}</strong> / <strong className="text-rose-300">Re {aqlData.minorRe}</strong>
                </div>
              </div>
            </div>

            {/* Size Breakdown Pickup Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <h4 className="font-bold text-slate-800">Color &amp; Size Pickups:</h4>
                <span className="text-[11px] font-mono text-blue-700 font-semibold">
                  {sizeBreakdown.reduce((s, b) => s + (b.samplePickupQuantity || 0), 0)} / {aqlData.sampleSize} pcs
                </span>
              </div>

              <div className="space-y-2">
                {sizeBreakdown.map((item, idx) => (
                  <div
                    key={item.size || idx}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                          {item.size}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 truncate block">
                            {item.colorName || 'Default Color'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Order: {item.orderQuantity.toLocaleString()} &bull; Lot: {item.inspectedQuantity.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...sizeBreakdown];
                          copy[idx].samplePickupQuantity = Math.max(0, (copy[idx].samplePickupQuantity || 0) - 1);
                          setSizeBreakdown(copy);
                        }}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm active:scale-90 cursor-pointer shadow-2xs"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-blue-700 text-xs">
                        {item.samplePickupQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...sizeBreakdown];
                          copy[idx].samplePickupQuantity = (copy[idx].samplePickupQuantity || 0) + 1;
                          setSizeBreakdown(copy);
                        }}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm active:scale-90 cursor-pointer shadow-2xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 4: PO SHEET & SAMPLE CARTON PHOTO CAPTURE
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>4. PO Sheet &amp; Sample Carton Photos</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Capture official PO spec sheet and picked sample carton photos with remarks.
              </p>
            </div>

            {/* Section A: PO Sheet Photos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">A. Purchase Order (PO) Sheet:</span>
                <span className="text-[10px] font-mono text-slate-400">{poSheetPhotos.length} Captured</span>
              </div>

              <label className="flex items-center justify-center gap-2 p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 hover:bg-blue-100 cursor-pointer active:scale-98 transition-transform">
                <Camera className="w-4 h-4" />
                <span className="text-xs font-bold">Capture / Upload PO Sheet</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadPhoto(f, (p) => setPoSheetPhotos((prev) => [...prev, p]));
                  }}
                />
              </label>

              {poSheetPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {poSheetPhotos.map((photo, idx) => (
                    <div key={photo.id || idx} className="p-2 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                      <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-900">
                        <img src={photo.url || photo.photoUrl} alt="PO Sheet" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(photo.url || photo.photoUrl || '')}
                          className="absolute bottom-1 left-1 p-1 bg-slate-900/80 text-white rounded cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPoSheetPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={photo.remark || ''}
                        onChange={(e) => {
                          const copy = [...poSheetPhotos];
                          copy[idx].remark = e.target.value;
                          setPoSheetPhotos(copy);
                        }}
                        placeholder="Remark..."
                        className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Sample Carton Photos */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">B. Picked Sample Cartons:</span>
                <span className="text-[10px] font-mono text-slate-400">{sampleCartonPhotos.length} Captured</span>
              </div>

              <label className="flex items-center justify-center gap-2 p-3 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-700 hover:bg-emerald-100 cursor-pointer active:scale-98 transition-transform">
                <Camera className="w-4 h-4" />
                <span className="text-xs font-bold">Capture / Upload Carton Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadPhoto(f, (p) => setSampleCartonPhotos((prev) => [...prev, p]));
                  }}
                />
              </label>

              {sampleCartonPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {sampleCartonPhotos.map((photo, idx) => (
                    <div key={photo.id || idx} className="p-2 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                      <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-900">
                        <img src={photo.url || photo.photoUrl} alt="Sample Carton" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(photo.url || photo.photoUrl || '')}
                          className="absolute bottom-1 left-1 p-1 bg-slate-900/80 text-white rounded cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSampleCartonPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={photo.remark || ''}
                        onChange={(e) => {
                          const copy = [...sampleCartonPhotos];
                          copy[idx].remark = e.target.value;
                          setSampleCartonPhotos(copy);
                        }}
                        placeholder="Carton #, markings..."
                        className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 5: ON-SITE PHYSICAL TESTS & TEST RECORDS
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 5 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>5. On-Site Physical Test Records</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pass/Fail verification for standard apparel physical performance tests.
              </p>
            </div>

            <div className="space-y-3">
              {testRecords.map((t, idx) => {
                const isPass = t.status === 'PASS' || t.result === 'PASS';
                return (
                  <div key={t.id || idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-800 leading-tight">{t.testName}</span>
                    </div>

                    {/* Big Touch Pass / Fail Toggle */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...testRecords];
                          copy[idx].status = 'PASS';
                          copy[idx].result = 'PASS';
                          setTestRecords(copy);
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isPass
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>PASS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...testRecords];
                          copy[idx].status = 'FAIL';
                          copy[idx].result = 'FAIL';
                          setTestRecords(copy);
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          !isPass
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>FAIL</span>
                      </button>
                    </div>

                    {/* Camera Capture and Remark */}
                    <div className="flex items-center gap-2">
                      <label className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-1 shrink-0">
                        <Camera className="w-4 h-4" />
                        <span className="text-[10px] font-semibold">{t.photoUrl ? 'Change' : '+ Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleUploadPhoto(f, (p) => {
                                const copy = [...testRecords];
                                copy[idx].photoUrl = p.url;
                                setTestRecords(copy);
                              });
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={t.remark || ''}
                        onChange={(e) => {
                          const copy = [...testRecords];
                          copy[idx].remark = e.target.value;
                          setTestRecords(copy);
                        }}
                        placeholder="Test reading, observations..."
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    {t.photoUrl && (
                      <div className="relative aspect-3/1 rounded-lg overflow-hidden bg-slate-900 mt-1">
                        <img src={t.photoUrl} alt={t.testName} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(t.photoUrl || '')}
                          className="absolute bottom-1 left-1 p-1 bg-slate-900/80 text-white rounded cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 6: VISUAL & COMPLIANCE IMAGE REGISTER
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 6 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>6. Visual &amp; Compliance Photo Register</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload photos for Carton, Stickers, Trims, Front/Back, Ratio, Labels, Polybag.
              </p>
            </div>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {VISUAL_COMPLIANCE_TABS.map((cat) => {
                const count = compliancePhotos.filter((p) => p.category === cat.key).length;
                const isActive = activeComplianceTab === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveComplianceTab(cat.key)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current Active Category Action */}
            {(() => {
              const currentCatInfo = VISUAL_COMPLIANCE_TABS.find((c) => c.key === activeComplianceTab);
              const currentCatPhotos = compliancePhotos.filter((p) => p.category === activeComplianceTab);

              return (
                <div className="space-y-3">
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                    <div>
                      <span className="font-bold">{currentCatInfo?.label}</span>
                      <p className="text-[10px] text-blue-700">{currentCatInfo?.desc}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-blue-800 shrink-0">
                      {currentCatPhotos.length} Photos
                    </span>
                  </div>

                  <label className="flex items-center justify-center gap-2 p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 hover:bg-blue-100 cursor-pointer active:scale-98 transition-transform">
                    <Camera className="w-5 h-5" />
                    <span className="text-xs font-bold">Take / Upload Photo for {currentCatInfo?.label}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          handleUploadPhoto(f, (p) => {
                            const compliancePhoto: InspectionCompliancePhoto = {
                              id: `cp-${Date.now()}`,
                              category: activeComplianceTab,
                              categoryTitle: currentCatInfo?.label || activeComplianceTab,
                              photoUrl: p.url || '',
                              remark: '',
                              timestamp: p.timestamp,
                            };
                            setCompliancePhotos((prev) => [...prev, compliancePhoto]);
                          });
                        }
                      }}
                    />
                  </label>

                  {currentCatPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {currentCatPhotos.map((photo, idx) => (
                        <div key={photo.id || idx} className="p-2 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                          <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-900">
                            <img src={photo.photoUrl} alt="Compliance Photo" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(photo.photoUrl)}
                              className="absolute bottom-1 left-1 p-1 bg-slate-900/80 text-white rounded cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCompliancePhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                              className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={photo.remark || ''}
                            onChange={(e) => {
                              const copy = [...compliancePhotos];
                              const foundIdx = copy.findIndex((p) => p.id === photo.id);
                              if (foundIdx >= 0) copy[foundIdx].remark = e.target.value;
                              setCompliancePhotos(copy);
                            }}
                            placeholder="Add remark..."
                            className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 7: PACKING CHECK WITH 0-TOLERANCE CRITICAL VERIFICATION
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 7 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-rose-600" />
                <span>7. Packing Check (0-Tolerance Critical)</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Critical safety parameters. Any detected defect causes immediate lot rejection!
              </p>
            </div>

            {/* Zero-Tolerance Alert Banner */}
            {hasZeroToleranceFail ? (
              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-center gap-2.5 text-rose-900 animate-pulse">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div className="text-xs">
                  <strong className="block text-rose-700">⚠️ 0-TOLERANCE DEFECT DETECTED!</strong>
                  <span>Audit status is locked to REJECTED. Immediate corrective quarantine required.</span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero tolerance safety checks currently cleared (0 defects).</span>
              </div>
            )}

            {/* 0-Tolerance Checklist Cards */}
            <div className="space-y-2.5">
              {packingZeroToleranceChecks.map((item, idx) => {
                const isFail = item.hasDefect;
                return (
                  <div
                    key={item.id || idx}
                    className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                      isFail
                        ? 'bg-rose-50/70 border-rose-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block leading-tight">{item.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{item.notes}</span>
                      </div>
                    </div>

                    {/* Toggle: Clean/Pass vs Defect Detected */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...packingZeroToleranceChecks];
                          copy[idx].hasDefect = false;
                          copy[idx].isPass = true;
                          copy[idx].defectCount = 0;
                          setPackingZeroToleranceChecks(copy);
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          !isFail
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>✓ Clean / Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...packingZeroToleranceChecks];
                          copy[idx].hasDefect = true;
                          copy[idx].isPass = false;
                          copy[idx].defectCount = (copy[idx].defectCount || 0) + 1;
                          setPackingZeroToleranceChecks(copy);
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isFail
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>⚠️ Defect Found!</span>
                      </button>
                    </div>

                    {/* If failed, show camera capture for critical evidence */}
                    {isFail && (
                      <div className="pt-1.5 border-t border-rose-200/60 flex items-center gap-2">
                        <label className="p-1.5 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-bold cursor-pointer flex items-center gap-1 shrink-0">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Defect Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                handleUploadPhoto(f, (p) => {
                                  const copy = [...packingZeroToleranceChecks];
                                  copy[idx].defectPhoto = p.url;
                                  setPackingZeroToleranceChecks(copy);
                                });
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => {
                            const copy = [...packingZeroToleranceChecks];
                            copy[idx].notes = e.target.value;
                            setPackingZeroToleranceChecks(copy);
                          }}
                          placeholder="Evidence notes..."
                          className="flex-1 text-xs px-2 py-1 bg-white border border-rose-200 rounded-lg focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 8: DEFECT ENTRY WITH IMAGE UPLOAD & AQL AUTO-FAIL
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 8 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>8. Defect Entry &amp; AQL Auto-Evaluation</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Log defects. If counts exceed AQL allowance, audit will automatically fail!
              </p>
            </div>

            {/* AQL Live Allowance Bar */}
            <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300">AQL 2.5 Status:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    aqlVerdict.verdict === 'PASSED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {aqlVerdict.verdict}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-center">
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <div className="text-rose-400 font-bold">Critical: {criticalDefectsCount}</div>
                  <div className="text-[9px] text-slate-400">Max Allowed: 0</div>
                </div>
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <div className={`font-bold ${majorDefectsCount > aqlData.majorAc ? 'text-rose-400' : 'text-emerald-400'}`}>
                    Major: {majorDefectsCount}
                  </div>
                  <div className="text-[9px] text-slate-400">Ac {aqlData.majorAc} / Re {aqlData.majorRe}</div>
                </div>
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <div className={`font-bold ${minorDefectsCount > aqlData.minorAc ? 'text-rose-400' : 'text-emerald-400'}`}>
                    Minor: {minorDefectsCount}
                  </div>
                  <div className="text-[9px] text-slate-400">Ac {aqlData.minorAc} / Re {aqlData.minorRe}</div>
                </div>
              </div>
            </div>

            {/* Quick Defect Add Form */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
              <span className="font-bold text-slate-800 block">Add New Defect:</span>

              {/* Severity Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {(['MINOR', 'MAJOR', 'CRITICAL'] as DefectSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setNewDefectSeverity(sev)}
                    className={`py-1.5 rounded-xl font-bold text-center cursor-pointer transition-all ${
                      newDefectSeverity === sev
                        ? sev === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : sev === 'MAJOR'
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              {/* Fast Defect Type Chips */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Common Types:</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                  {COMMON_DEFECT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewDefectType(type)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        newDefectType === type
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Type & Count Input */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">Defect Name:</label>
                  <input
                    type="text"
                    value={newDefectType}
                    onChange={(e) => setNewDefectType(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Quantity Count:</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setNewDefectCount((c) => Math.max(1, c - 1))}
                      className="w-7 h-7 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-mono font-bold text-xs">{newDefectCount}</span>
                    <button
                      type="button"
                      onClick={() => setNewDefectCount((c) => c + 1)}
                      className="w-7 h-7 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Camera Capture and Add Button */}
              <div className="flex items-center gap-2 pt-1">
                <label className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 cursor-pointer flex items-center gap-1 shrink-0">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-semibold">{newDefectPhoto ? '✓ Photo' : '+ Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadPhoto(f, (p) => setNewDefectPhoto(p.url || ''));
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAddDefect}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95"
                >
                  + Add Defect Log
                </button>
              </div>
            </div>

            {/* List of Logged Defects */}
            {defectsList.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">Logged Defect Register ({defectsList.length}):</span>
                {defectsList.map((d) => (
                  <div key={d.id} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {d.photoUrl && (
                        <img
                          src={d.photoUrl}
                          alt="Defect"
                          onClick={() => setLightboxUrl(d.photoUrl || '')}
                          className="w-8 h-8 rounded-lg object-cover cursor-pointer shrink-0 border border-slate-200"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 truncate block">{d.defectType}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded ${
                              d.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : d.severity === 'MAJOR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {d.severity}
                          </span>
                          <span>&bull; {d.count} pcs</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDefect(d.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 9: GARMENT MEASUREMENT SHEET UPLOAD
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 9 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>9. Garment Measurement Sheet</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload completed POM measurement worksheet or spec tolerance sheets.
              </p>
            </div>

            <label className="flex items-center justify-center gap-2 p-3.5 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 hover:bg-blue-100 cursor-pointer active:scale-98 transition-transform">
              <Camera className="w-5 h-5" />
              <span className="text-xs font-bold">Capture / Upload Measurement Spec Sheet</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadPhoto(f, (p) => setMeasurementSheetPhotos((prev) => [...prev, p]));
                }}
              />
            </label>

            {measurementSheetPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {measurementSheetPhotos.map((photo, idx) => (
                  <div key={photo.id || idx} className="p-2 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                    <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-900">
                      <img src={photo.url || photo.photoUrl} alt="Measurement Sheet" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(photo.url || photo.photoUrl || '')}
                        className="absolute bottom-1 left-1 p-1 bg-slate-900/80 text-white rounded cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeasurementSheetPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={photo.remark || ''}
                      onChange={(e) => {
                        const copy = [...measurementSheetPhotos];
                        copy[idx].remark = e.target.value;
                        setMeasurementSheetPhotos(copy);
                      }}
                      placeholder="POM size, notes..."
                      className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Measurement Deviation Notes (POM):</label>
              <textarea
                rows={2}
                value={measurementNotes}
                onChange={(e) => setMeasurementNotes(e.target.value)}
                placeholder="Enter any POM out-of-tolerance observations (Chest, Length, Collar)..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 10: DUAL SIGNATURE PADS & FINAL UPLOAD
        ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 10 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-600" />
                <span>10. Inspector &amp; Vendor Sign-off</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Dual digital signature pad sign-off before final upload &amp; report generation.
              </p>
            </div>

            {/* Final Status Summary Card */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Audit Final Verdict:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    aqlVerdict.verdict === 'PASSED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {aqlVerdict.verdict}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <div>PO: <strong>{poNumber}</strong> &bull; Sample: <strong>{aqlData.sampleSize} pcs</strong></div>
                <div>0-Tolerance: <strong>{hasZeroToleranceFail ? 'FAILED' : 'CLEARED'}</strong></div>
                <div>Total Defects: <strong>{totalDefectsCount} pcs</strong> (Major: {majorDefectsCount}, Minor: {minorDefectsCount})</div>
              </div>
            </div>

            {/* Lead Inspector Signature */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Lead QA Inspector Name:</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <SignaturePad
                label="Lead Inspector Touch Signature:"
                value={inspectorSignature}
                onChange={(dataUrl) => setInspectorSignature(dataUrl)}
                onClear={() => setInspectorSignature('')}
              />
            </div>

            {/* Factory / Vendor Representative Signature */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Factory / Vendor Representative Name:</label>
                <input
                  type="text"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <SignaturePad
                label="Factory Representative Touch Signature:"
                value={representativeSignature}
                onChange={(dataUrl) => setRepresentativeSignature(dataUrl)}
                onClear={() => setRepresentativeSignature('')}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. BOTTOM STICKY ACTION BAR (ALWAYS ACCESSIBLE ON MOBILE) ─── */}
      <div className="shrink-0 p-3 sm:px-4 bg-white border-t border-slate-200 shadow-lg flex items-center justify-between gap-2.5 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={triggerBack}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Exit
          </button>
        )}

        <div className="text-center font-mono text-[11px] text-slate-400 hidden xs:block">
          <span className="font-bold text-slate-700">{currentStep}</span> / 10
        </div>

        {currentStep < 10 ? (
          <button
            type="button"
            onClick={() => {
              if (currentStep === 1 && !poNumber.trim()) {
                showToast('Please enter or select a Purchase Order');
                return;
              }
              setCurrentStep((s) => Math.min(10, s + 1));
            }}
            className="flex-1 max-w-[240px] py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ml-auto"
          >
            <span>Next: {STEP_TITLES[currentStep].split(' ')[0]}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="flex-1 max-w-[260px] py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ml-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload &amp; Save Inspection</span>
          </button>
        )}
      </div>

      {/* ─── 4. LIGHTBOX MODAL FOR PHOTO ZOOM ─── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-lg max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Inspection Evidence Zoom</span>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-1 flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden">
              <img
                src={lightboxUrl}
                alt="Enlarged Evidence"
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Return Portal Rendering
  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  // 100% Full Page on Mobile Browser (Edge-to-Edge)
  if (isMobileBrowser || forceDesktopFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[999999] w-screen h-[100dvh] bg-slate-100 text-slate-800 flex flex-col overflow-hidden select-none touch-manipulation pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        {terminalInner}
      </div>,
      document.body
    );
  }

  // Desktop Browser: Centered Clean Simulated Handheld Mobile Preview
  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      {/* Desktop Mode Advisory Bar */}
      <div className="w-full max-w-md mb-2 flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-md shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-[11px] font-semibold text-slate-700 truncate">
            Mobile Inspection Terminal <span className="text-emerald-600 font-bold">&bull; Full Page on Mobile</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setForceDesktopFullscreen(true)}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 cursor-pointer transition-colors"
          >
            Fullscreen
          </button>
          <button
            type="button"
            onClick={triggerBack}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            title="Exit"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulated handheld mobile screen on desktop */}
      <div className="w-full max-w-md h-[92vh] max-h-[860px] rounded-[32px] border border-slate-300 bg-white shadow-2xl flex flex-col overflow-hidden">
        {terminalInner}
      </div>
    </div>,
    document.body
  );
}
