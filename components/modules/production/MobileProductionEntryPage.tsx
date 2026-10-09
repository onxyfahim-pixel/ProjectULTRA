'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Smartphone,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Save,
  Search,
  X,
  TrendingUp,
  ShieldCheck,
  Zap,
  Check,
  ChevronRight,
  ChevronLeft,
  Tag,
  Sliders,
  Volume2,
  VolumeX,
  Layers,
  Factory,
  Users,
  Target,
  FileText,
  Activity,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import {
  ProductionOrder,
  HourlyReportEntry,
  DefectCountEntry,
  LineStatus,
  TopDefectSummary,
} from '@/lib/types/erp';
import {
  getProductionUnits,
  getProductionSections,
  getProductionLines,
} from '@/lib/db/production-management-store';
import {
  ProductionUnit,
  ProductionSection,
  ProductionLine,
  ProductionDefectItem,
  ProductionDefectCategory,
  ProductionDefectSeverity,
} from '@/lib/types/production-management';
import {
  getProductionDefects,
  getCommonProductionDefects,
  addProductionDefect,
} from '@/lib/db/production-defects-store';
import { MOCK_BUYER_ORDERS } from '@/lib/db/modules-mock-data';
import { BuyerOrder } from '@/lib/types/modules';
import {
  getSectionTargetForOrder,
  normalizeSectionKey,
  getDefaultSectionTargets,
} from '@/lib/utils/section-target-utils';

export interface MobileProductionEntryPageProps {
  orders: ProductionOrder[];
  initialOrder?: ProductionOrder | null;
  onSave: (order: ProductionOrder) => void;
  onBack: () => void;
  showToast: (msg: string) => void;
}

const DEFAULT_HOURLY_SLOTS = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
];

const SHIFT_OPTIONS = [
  'Shift A (Morning 08:00 - 16:30)',
  'Shift B (Evening 16:30 - 01:00)',
  'Shift C (Night 01:00 - 08:00)',
  'General Day Shift (08:30 - 17:30)',
  'Overtime Extended (17:00 - 21:00)',
];

const POPULAR_BUYERS = [
  'Inditex (Zara)',
  'H&M Global',
  'Nike Apparel',
  'Tommy Hilfiger',
  'Uniqlo (Fast Retailing)',
  'Gap Inc.',
  'M&S (Marks & Spencer)',
  'Next PLC',
  'Adidas',
  'Puma',
  'Levi Strauss & Co.',
  'Decathlon Sport',
];

const QUICK_NOTES = [
  'Needle tension adjusted',
  'Looper thread replaced',
  '100% inline checked',
  'Needle changed',
  'Shade checked OK',
  'Minor rework cleared',
  'Operator guided on seam',
];

const STANDARD_SECTIONS = [
  'Sewing Floor',
  'Cutting Floor',
  'Finishing & Packing',
  'Industrial Washing',
  'Packing & Warehouse',
  'Quality Assurance (QA)',
];

const SECTION_LINE_PRESETS: Record<string, Array<{ id: string; name: string; chief: string; qc: string }>> = {
  'Sewing Floor': [
    { id: 'Line 01', name: 'Sewing Line 01 (Knit Tops)', chief: 'Kabir Hossain', qc: 'Md. Rafiqul Islam' },
    { id: 'Line 02', name: 'Sewing Line 02 (Knit Polo & Fleece)', chief: 'Jahangir Alam', qc: 'Mizanur Rahman' },
    { id: 'Line 03', name: 'Sewing Line 03 (Woven Bottoms)', chief: 'Abul Kashem', qc: 'Nasir Uddin' },
    { id: 'Line 04', name: 'Sewing Line 04 (Heavy Denim)', chief: 'Mahbubur Rahman', qc: 'Al-Amin Hossain' },
    { id: 'Line 05', name: 'Sewing Line 05 (Precision Knit)', chief: 'Shahinur Islam', qc: 'Suman Roy' },
    { id: 'Line 06', name: 'Sewing Line 06 (Fleece Assembly)', chief: 'Delowar Hossain', qc: 'Rokonuzzaman' },
    { id: 'Line 07', name: 'Sewing Line 07 (Cargo & Utility)', chief: 'Kamrul Hasan', qc: 'Mehedi Hasan' },
    { id: 'Line 08', name: 'Sewing Line 08 (Intimates & Activewear)', chief: 'Shahadat Hossain', qc: 'Anisur Rahman' },
  ],
  'Cutting Floor': [
    { id: 'CUT-01', name: 'Cutting Table 01 (Gerber CNC Auto-Cutter)', chief: 'Monir Hossain', qc: 'Harunur Rashid' },
    { id: 'CUT-02', name: 'Cutting Table 02 (Manual Spreader & Band Knife)', chief: 'Selim Reza', qc: 'Biplob Hossain' },
    { id: 'CUT-03', name: 'Cutting Table 03 (Precision Laser Cutter)', chief: 'Tanvir Ahmed', qc: 'Faruk Hossain' },
  ],
  'Finishing & Packing': [
    { id: 'FIN-01', name: 'Finishing Line 01 (Steam Tunnel Pressing)', chief: 'Golam Rabbani', qc: 'Zahirul Islam' },
    { id: 'FIN-02', name: 'Finishing Line 02 (Thread Trimming & Ironing)', chief: 'Moklesur Rahman', qc: 'Shakil Khan' },
    { id: 'FIN-03', name: 'Needle & Metal Detection Station 01', chief: 'Anwar Parvez', qc: 'Nazrul Islam' },
  ],
  'Industrial Washing': [
    { id: 'WASH-01', name: 'Industrial Washing Bay 01 (Enzyme & Stone)', chief: 'Shah Alam', qc: 'Habibur Rahman' },
    { id: 'WASH-02', name: 'Industrial Washing Bay 02 (Ozone & Laser)', chief: 'Nurul Islam', qc: 'Mamunur Rashid' },
  ],
  'Packing & Warehouse': [
    { id: 'PACK-01', name: 'Automatic Carton Packing Line 01', chief: 'Abdul Halim', qc: 'Ashraful Alam' },
    { id: 'PACK-02', name: 'Barcode Scanning & Palletizer Station 02', chief: 'Rezaul Karim', qc: 'Kawsar Ahmed' },
  ],
  'Quality Assurance (QA)': [
    { id: 'QA-01', name: 'Inline Roving QC Audit Station', chief: 'Tareq Rahman', qc: 'Masud Rana' },
    { id: 'QA-02', name: 'End-Line 100% Traffic Inspection Table', chief: 'Zillur Rahman', qc: 'Md. Enamul Haque' },
  ],
};

// Virtual Click Sound generator for tactile hardware feel
function playVirtualClick(freq = 680, duration = 0.03) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio permission or context restrictions
  }
}

// Virtual Haptic Vibration
function triggerHaptic(duration: number | number[] = 15) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function MobileProductionEntryPage({
  orders,
  initialOrder,
  onSave,
  onBack,
  showToast,
}: MobileProductionEntryPageProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobileBrowser, setIsMobileBrowser] = useState(true);
  const [forceDesktopFullscreen, setForceDesktopFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active view tab in mobile: 'qc_logger' | 'setup' | 'summary'
  const [mobileTab, setMobileTab] = useState<'qc_logger' | 'setup' | 'summary'>('qc_logger');

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

  // Detect mobile browser vs desktop browser
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

  // ==========================================
  // 1. FORM STATE (ALL DEFAULT ENTRY OPTIONS)
  // ==========================================
  const [recordDate, setRecordDate] = useState<string>(
    initialOrder?.recordDate ||
      initialOrder?.createdAt?.split('T')[0] ||
      new Date().toISOString().split('T')[0]
  );
  const [shift, setShift] = useState<string>(
    initialOrder?.shift || 'Shift A (Morning 08:00 - 16:30)'
  );
  const [orderNumber, setOrderNumber] = useState<string>(
    initialOrder?.orderNumber || ''
  );
  const [buyer, setBuyer] = useState<string>(initialOrder?.buyer || 'Inditex (Zara)');
  const [styleName, setStyleName] = useState<string>(
    initialOrder?.styleName || 'Cotton Crew Tee'
  );
  const [styleNumber, setStyleNumber] = useState<string>(
    initialOrder?.styleNumber || 'STY-TS-2026'
  );
  const [itemInfo, setItemInfo] = useState<string>(
    initialOrder?.itemInfo || '100% Combed Cotton Single Jersey 180 GSM'
  );
  const [smvTarget, setSmvTarget] = useState<number>(initialOrder?.smvTarget || 14.5);
  const [unit, setUnit] = useState<string>(
    initialOrder?.unit || 'Unit 01 (Dhaka Complex)'
  );
  const [section, setSection] = useState<string>(
    initialOrder?.section || 'Sewing Floor'
  );
  const [lineId, setLineId] = useState<string>(
    initialOrder?.lineId || initialOrder?.sewingLine || 'Sewing Line 01 (Knit Tops)'
  );
  const [status, setStatus] = useState<LineStatus>(initialOrder?.status || 'RUNNING');
  const [targetQuantity, setTargetQuantity] = useState<number>(
    initialOrder?.targetQuantity || 1200
  );
  const [hourlyTarget, setHourlyTarget] = useState<number>(() => {
    if (initialOrder?.hourlyTarget && initialOrder.hourlyTarget > 0) return initialOrder.hourlyTarget;
    return Math.round((initialOrder?.targetQuantity || 1200) / 8);
  });
  const [shiftTarget, setShiftTarget] = useState<number>(() => {
    if (initialOrder?.shiftTarget && initialOrder.shiftTarget > 0) return initialOrder.shiftTarget;
    if (initialOrder?.hourlyTarget && initialOrder.hourlyTarget > 0) return initialOrder.hourlyTarget * 8;
    return initialOrder?.targetQuantity || 1200;
  });
  const [operatorCount, setOperatorCount] = useState<number>(
    initialOrder?.operatorCount || 24
  );
  const [supervisorName, setSupervisorName] = useState<string>(
    initialOrder?.supervisorName || 'Kabir Hossain'
  );
  const [qualityInspector, setQualityInspector] = useState<string>(
    initialOrder?.qualityInspector || 'Md. Rafiqul Islam'
  );
  const [dueDate, setDueDate] = useState<string>(
    initialOrder?.dueDate
      ? initialOrder.dueDate.split('T')[0]
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState<string>(initialOrder?.remarks || '');

  // ==========================================
  // 2. MANAGEMENT STORES: UNITS, SECTIONS, LINES
  // ==========================================
  const [managedUnits, setManagedUnits] = useState<ProductionUnit[]>([]);
  const [managedSections, setManagedSections] = useState<ProductionSection[]>([]);
  const [managedLines, setManagedLines] = useState<ProductionLine[]>([]);

  useEffect(() => {
    const loadManagedData = () => {
      const u = getProductionUnits();
      const s = getProductionSections();
      const l = getProductionLines();
      setManagedUnits(u);
      setManagedSections(s);
      setManagedLines(l);
    };
    loadManagedData();
    window.addEventListener('erp_production_management_updated', loadManagedData);
    return () => window.removeEventListener('erp_production_management_updated', loadManagedData);
  }, []);

  const handleSelectSection = (newSec: string) => {
    setSection(newSec);

    // Dynamic Section-Wise WIP Target & SMV linkage
    const activePO = availableBuyerOrders.find((bo) => bo.orderNumber === orderNumber);
    const secTarget = getSectionTargetForOrder(activePO, newSec);
    setSmvTarget(secTarget.smv);
    setHourlyTarget(secTarget.hourlyTarget);
    setShiftTarget(secTarget.dailyTarget || secTarget.hourlyTarget * 8);
    if (secTarget.manpower) setOperatorCount(secTarget.manpower);

    // Sync all hourly slots in mobile sheet
    setHourlyData((prev) =>
      prev.map((h) => ({
        ...h,
        targetQty: secTarget.hourlyTarget,
      }))
    );

    const presets = SECTION_LINE_PRESETS[newSec];
    if (presets && presets.length > 0) {
      setLineId(presets[0].name);
      setSupervisorName(presets[0].chief);
      setQualityInspector(presets[0].qc);
    }
    showToast(`✓ Switched to ${secTarget.sectionName} • Hourly Target: ${secTarget.hourlyTarget} pcs/hr (SMV ${secTarget.smv}m)`);
  };

  const handleSelectLine = (selectedLineName: string) => {
    setLineId(selectedLineName);
    const found = managedLines.find(
      (l) => l.name === selectedLineName || l.id === selectedLineName || l.lineCode === selectedLineName
    );
    if (found) {
      if (found.unitName) setUnit(found.unitName);
      if (found.lineChief) setSupervisorName(found.lineChief);
      if (found.qualityController) setQualityInspector(found.qualityController);
      if (found.operatorCount) setOperatorCount(found.operatorCount);
      showToast(`Linked line: ${found.name}`);
      return;
    }
    const currentPresets = SECTION_LINE_PRESETS[section] || [];
    const presetFound = currentPresets.find((p) => p.name === selectedLineName || p.id === selectedLineName);
    if (presetFound) {
      setSupervisorName(presetFound.chief);
      setQualityInspector(presetFound.qc);
    }
  };

  // ==========================================
  // 3. DEFECTS MASTER: MODULE MANAGEMENT DEFECTS
  // ==========================================
  const [availableDefects, setAvailableDefects] = useState<ProductionDefectItem[]>([]);
  const [defectCategoryFilter, setDefectCategoryFilter] = useState<string>('ALL');
  const [defectSearchQuery, setDefectSearchQuery] = useState<string>('');
  const [isNewDefectModalOpen, setIsNewDefectModalOpen] = useState(false);
  const [newDefName, setNewDefName] = useState('');
  const [newDefCategory, setNewDefCategory] = useState<ProductionDefectCategory>('Sewing');
  const [newDefSeverity, setNewDefSeverity] = useState<ProductionDefectSeverity>('MAJOR');

  useEffect(() => {
    const loadDefects = () => {
      setAvailableDefects(getProductionDefects());
    };
    loadDefects();
    window.addEventListener('erp_production_defects_updated', loadDefects);
    return () => window.removeEventListener('erp_production_defects_updated', loadDefects);
  }, []);

  // Filtered defects for the mobile pad
  const filteredDefects = useMemo(() => {
    return availableDefects.filter((d) => {
      const q = defectSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
      const matchesCat = defectCategoryFilter === 'ALL' || d.category === defectCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [availableDefects, defectSearchQuery, defectCategoryFilter]);

  // Create inline defect
  const handleCreateNewDefect = () => {
    if (!newDefName.trim()) return;
    const created = addProductionDefect({
      name: newDefName.trim(),
      category: newDefCategory,
      severity: newDefSeverity,
      isCommon: true,
      description: 'Quick added from mobile live floor entry',
    });
    setAvailableDefects(getProductionDefects());
    handleDefectTap(created.name, 1);
    setNewDefName('');
    setIsNewDefectModalOpen(false);
    showToast(`Added defect "${created.name}" to Master Defect Library`);
  };

  // ==========================================
  // 4. PO AUTO-SUGGEST & BUYER ORDERS
  // ==========================================
  const [isPoDropdownOpen, setIsPoDropdownOpen] = useState(false);
  const availableBuyerOrders = useMemo(() => {
    let list: BuyerOrder[] = [...MOCK_BUYER_ORDERS];
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('erp_buyer_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(list.map((o) => o.id));
            parsed.forEach((po) => {
              if (!existingIds.has(po.id)) list.unshift(po);
            });
          }
        }
      }
    } catch {
      // ignore
    }
    return list;
  }, []);

  const filteredBuyerOrders = useMemo(() => {
    if (!orderNumber.trim()) return availableBuyerOrders.slice(0, 8);
    const q = orderNumber.toLowerCase().trim();
    return availableBuyerOrders.filter(
      (bo) =>
        bo.orderNumber.toLowerCase().includes(q) ||
        bo.buyerName.toLowerCase().includes(q) ||
        bo.styleDescription.toLowerCase().includes(q) ||
        bo.styleNumber.toLowerCase().includes(q)
    );
  }, [orderNumber, availableBuyerOrders]);

  const handleSelectBuyerOrder = (bo: BuyerOrder) => {
    setOrderNumber(bo.orderNumber);
    setBuyer(bo.buyerName);
    setStyleName(bo.styleDescription);
    setStyleNumber(bo.styleNumber);
    setTargetQuantity(bo.orderQuantity);
    if (bo.shipDate) setDueDate(bo.shipDate.split('T')[0]);

    // Section-Wise Target resolution from Buyer Order WIP & IE Planning
    const secTarget = getSectionTargetForOrder(bo, section);
    setSmvTarget(secTarget.smv);
    setHourlyTarget(secTarget.hourlyTarget);
    setShiftTarget(secTarget.dailyTarget || secTarget.hourlyTarget * 8);
    if (secTarget.manpower) setOperatorCount(secTarget.manpower);

    // Sync all hourly slots
    setHourlyData((prev) =>
      prev.map((h) => ({
        ...h,
        targetQty: secTarget.hourlyTarget,
      }))
    );

    setIsPoDropdownOpen(false);
    showToast(
      `✓ Loaded PO: ${bo.orderNumber} • ${secTarget.sectionName} Hourly Target: ${secTarget.hourlyTarget} pcs/hr (SMV ${secTarget.smv}m)`
    );
  };

  // ==========================================
  // 5. HOURLY REPORTS STATE (H1 - H8)
  // ==========================================
  const [hourlyData, setHourlyData] = useState<HourlyReportEntry[]>(() => {
    if (initialOrder?.hourlyReports && initialOrder.hourlyReports.length > 0) {
      return initialOrder.hourlyReports;
    }
    const defaultHourlyPace = Math.round((initialOrder?.targetQuantity || 1200) / 8);
    return DEFAULT_HOURLY_SLOTS.map((slot, idx) => ({
      id: `m-hr-${idx + 1}`,
      hourSlot: slot,
      targetQty: defaultHourlyPace,
      checkedQty: 0,
      passedQty: 0,
      defectQty: 0,
      rejectQty: 0,
      defectRate: 0,
      rftRate: 100,
      defectBreakdown: [],
      topDefect: 'None',
      operatorId: `Line 01 Station ${(idx % 8) + 1}`,
      remarks: '',
    }));
  });

  const [activeHourIndex, setActiveHourIndex] = useState<number>(0);
  const currentHour = hourlyData[activeHourIndex] || hourlyData[0];

  // Direct piece count input modal
  const [isDirectInputOpen, setIsDirectInputOpen] = useState(false);
  const [directInputValue, setDirectInputValue] = useState('');

  // Update current active hour helper
  const updateCurrentHour = (updater: (prev: HourlyReportEntry) => HourlyReportEntry) => {
    setHourlyData((prev) => {
      const copy = [...prev];
      if (copy[activeHourIndex]) {
        copy[activeHourIndex] = updater(copy[activeHourIndex]);
      }
      return copy;
    });
  };

  // Adjust output count
  const handleAdjustOutput = (delta: number) => {
    if (soundEnabled) playVirtualClick(delta > 0 ? 750 : 420);
    triggerHaptic(12);

    updateCurrentHour((hr) => {
      const newPassed = Math.max(0, hr.passedQty + delta);
      const totalChecked = newPassed + hr.defectQty + (hr.rejectQty || 0);
      const defRate =
        totalChecked > 0 ? Number(((hr.defectQty / totalChecked) * 100).toFixed(2)) : 0;
      const rft =
        totalChecked > 0
          ? Number((((totalChecked - hr.defectQty) / totalChecked) * 100).toFixed(1))
          : 100;

      return {
        ...hr,
        passedQty: newPassed,
        checkedQty: totalChecked,
        defectRate: defRate,
        rftRate: rft,
      };
    });
  };

  const handleSetOutputDirect = (val: number) => {
    if (soundEnabled) playVirtualClick(800);
    triggerHaptic(20);

    const valid = Math.max(0, val);
    updateCurrentHour((hr) => {
      const totalChecked = valid + hr.defectQty + (hr.rejectQty || 0);
      const defRate =
        totalChecked > 0 ? Number(((hr.defectQty / totalChecked) * 100).toFixed(2)) : 0;
      const rft =
        totalChecked > 0
          ? Number((((totalChecked - hr.defectQty) / totalChecked) * 100).toFixed(1))
          : 100;

      return {
        ...hr,
        passedQty: valid,
        checkedQty: totalChecked,
        defectRate: defRate,
        rftRate: rft,
      };
    });
    setIsDirectInputOpen(false);
  };

  // Defect tap (+1 or -1)
  const handleDefectTap = (defectName: string, delta: number) => {
    if (soundEnabled) playVirtualClick(delta > 0 ? 520 : 380, 0.04);
    triggerHaptic(delta > 0 ? 25 : 10);

    updateCurrentHour((hr) => {
      const existingBreakdown = [...(hr.defectBreakdown || [])];
      const matchIdx = existingBreakdown.findIndex((d) => d.defectType === defectName);

      if (matchIdx >= 0) {
        const nextCount = Math.max(0, existingBreakdown[matchIdx].count + delta);
        if (nextCount === 0) {
          existingBreakdown.splice(matchIdx, 1);
        } else {
          existingBreakdown[matchIdx] = { ...existingBreakdown[matchIdx], count: nextCount };
        }
      } else if (delta > 0) {
        existingBreakdown.push({ defectType: defectName, count: delta });
      }

      const totalDefects = existingBreakdown.reduce((s, d) => s + d.count, 0);
      const totalChecked = hr.passedQty + totalDefects + (hr.rejectQty || 0);
      const defRate =
        totalChecked > 0 ? Number(((totalDefects / totalChecked) * 100).toFixed(2)) : 0;
      const rft =
        totalChecked > 0
          ? Number((((totalChecked - totalDefects) / totalChecked) * 100).toFixed(1))
          : 100;

      const sorted = [...existingBreakdown].sort((a, b) => b.count - a.count);
      const topDef = sorted[0]?.defectType || 'None';

      return {
        ...hr,
        defectQty: totalDefects,
        checkedQty: totalChecked,
        defectRate: defRate,
        rftRate: rft,
        defectBreakdown: existingBreakdown,
        topDefect: topDef,
      };
    });
  };

  // Reject / scrap piece adjustment
  const handleRejectTap = (delta: number) => {
    if (soundEnabled) playVirtualClick(340);
    triggerHaptic(20);

    updateCurrentHour((hr) => {
      const newRejects = Math.max(0, (hr.rejectQty || 0) + delta);
      const totalChecked = hr.passedQty + hr.defectQty + newRejects;
      return {
        ...hr,
        rejectQty: newRejects,
        checkedQty: totalChecked,
      };
    });
  };

  // Add quick tag to remarks
  const handleAddQuickTag = (tagText: string) => {
    if (soundEnabled) playVirtualClick(650);
    updateCurrentHour((hr) => {
      const existing = hr.remarks ? `${hr.remarks}, ` : '';
      return { ...hr, remarks: `${existing}${tagText}` };
    });
    showToast(`Added note tag: "${tagText}"`);
  };

  // Shift Totals Calculation
  const shiftTotals = useMemo(() => {
    const totalPassed = hourlyData.reduce((s, h) => s + (h.passedQty || 0), 0);
    const totalDefects = hourlyData.reduce((s, h) => s + (h.defectQty || 0), 0);
    const totalRejects = hourlyData.reduce((s, h) => s + (h.rejectQty || 0), 0);
    const totalChecked = totalPassed + totalDefects + totalRejects;
    const totalTarget =
      targetQuantity > 0
        ? targetQuantity
        : hourlyData.reduce((s, h) => s + (h.targetQty || 150), 0);
    const avgDhu =
      totalChecked > 0 ? Number(((totalDefects / totalChecked) * 100).toFixed(2)) : 0;
    const avgRft =
      totalChecked > 0
        ? Number((((totalChecked - totalDefects) / totalChecked) * 100).toFixed(1))
        : 100;
    const efficiency =
      totalTarget > 0 ? Number(((totalPassed / totalTarget) * 100).toFixed(1)) : 0;

    return {
      totalPassed,
      totalDefects,
      totalRejects,
      totalChecked,
      totalTarget,
      avgDhu,
      avgRft,
      efficiency,
    };
  }, [hourlyData, targetQuantity]);

  // Save active hour & go to next
  const handleSaveAndNextHour = () => {
    if (soundEnabled) playVirtualClick(900, 0.06);
    triggerHaptic(40);

    showToast(`✓ Hour ${activeHourIndex + 1} saved (${currentHour.passedQty} pcs)`);
    if (activeHourIndex < hourlyData.length - 1) {
      setActiveHourIndex(activeHourIndex + 1);
    }
  };

  // ==========================================
  // 6. FINAL SUBMIT TO CENTRAL RECORD LIST
  // ==========================================
  const handleFinalSubmit = () => {
    if (soundEnabled) playVirtualClick(1000, 0.1);
    triggerHaptic([30, 50, 30]);

    const finalOrderNumber = orderNumber.trim() || `PO-${Math.floor(10000 + Math.random() * 90000)}`;

    // Generate top 3 defects
    const defectMap: Record<string, number> = {};
    hourlyData.forEach((hr) => {
      hr.defectBreakdown?.forEach((db) => {
        if (db.count > 0 && db.defectType && db.defectType !== 'None') {
          defectMap[db.defectType] = (defectMap[db.defectType] || 0) + db.count;
        }
      });
    });
    const top3Defects: TopDefectSummary[] = Object.entries(defectMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([defectType, count]) => ({
        defectType,
        count,
        percentage:
          shiftTotals.totalDefects > 0
            ? Number(((count / shiftTotals.totalDefects) * 100).toFixed(1))
            : 0,
      }));

    // If editing existing order, keep its ID; otherwise create a fresh ID
    const finalRecordId = initialOrder?.id || `po-record-${Date.now()}`;

    const savedOrder: ProductionOrder = {
      id: finalRecordId,
      orderNumber: finalOrderNumber,
      recordDate: recordDate,
      shift: shift,
      buyer: buyer.trim() || 'Inditex (Zara)',
      styleName: styleName.trim() || 'Cotton Crew Tee',
      styleNumber: styleNumber.trim() || 'STY-TS-2026',
      itemInfo: itemInfo.trim(),
      unit: unit,
      section: section,
      sewingLine: lineId,
      lineId: lineId,
      targetQuantity: shiftTotals.totalTarget,
      completedQuantity: shiftTotals.totalPassed,
      totalDefects: shiftTotals.totalDefects,
      defectRate: shiftTotals.avgDhu,
      dhuRate: shiftTotals.avgDhu,
      rftRate: shiftTotals.avgRft,
      efficiencyPercent: shiftTotals.efficiency,
      rejectQuantity: shiftTotals.totalRejects,
      status: status,
      dueDate: dueDate,
      operatorCount: operatorCount,
      supervisorName: supervisorName,
      qualityInspector: qualityInspector,
      smvTarget: smvTarget,
      hourlyTarget: hourlyTarget,
      shiftTarget: shiftTarget,
      top3Defects: top3Defects,
      remarks: remarks || `Logged via Mobile Entry on ${new Date().toLocaleTimeString()}`,
      createdAt: initialOrder?.createdAt || new Date().toISOString(),
      hourlyReports: hourlyData,
    };

    onSave(savedOrder);
  };

  const hourEfficiency =
    currentHour.targetQty > 0
      ? Number(((currentHour.passedQty / currentHour.targetQty) * 100).toFixed(1))
      : 0;

  // ==========================================
  // 7. LIGHT THEME RENDER TREE
  // ==========================================
  const terminalInner = (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-100 text-slate-800 font-sans select-none">
      {/* 1. TOP MOBILE HEADER: Light theme, pristine contrast */}
      <header className="bg-white border-b border-slate-200 px-3.5 pt-3 pb-2.5 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Exit to ERP"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-emerald-700">
                LIVE FLOOR QC ENTRY
              </span>
            </div>
            <h1 className="text-sm font-black text-slate-900 truncate leading-tight">
              {orderNumber || 'New Production Record'}
            </h1>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              showToast(soundEnabled ? 'Muted tactile sounds' : 'Enabled sound clicker');
            }}
            className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            onClick={handleFinalSubmit}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* 2. THREE CLEAN MOBILE TABS: QC LOGGER | ORDER SETUP | SHIFT SUMMARY */}
      <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-between gap-1.5 shrink-0 z-10 text-xs">
        <button
          type="button"
          onClick={() => setMobileTab('qc_logger')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'qc_logger'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>QC Logger</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('setup')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'setup'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Order Setup</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('summary')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'summary'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Shift Data</span>
        </button>
      </div>

      {/* 3. MAIN BODY PER ACTIVE TAB */}
      {mobileTab === 'qc_logger' && (
        <>
          {/* Active PO Quick Strip (Clean Light Card) */}
          <div className="bg-white px-3.5 py-2 border-b border-slate-200 shrink-0 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono font-black text-blue-700 text-sm">
                  {orderNumber || 'PO-NOT-SET'}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 truncate">
                  {buyer}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileTab('setup')}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                <span>Edit Setup</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate max-w-[200px]">{section} • {shift.split('(')[0].trim()}</span>
              <span className="font-mono font-bold text-slate-700">
                {shiftTotals.totalPassed} / {shiftTotals.totalTarget} pcs ({shiftTotals.efficiency}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(shiftTotals.efficiency, 100)}%` }}
              />
            </div>
          </div>

          {/* 8-Hour Carousel (Light Theme) */}
          <div className="px-2 py-1.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-1.5 min-w-max px-1">
              {hourlyData.map((hr, idx) => {
                const isSelected = activeHourIndex === idx;
                const isPassedLogged = hr.passedQty > 0;

                return (
                  <button
                    key={hr.hourSlot}
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playVirtualClick(700);
                      triggerHaptic(10);
                      setActiveHourIndex(idx);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm scale-[1.02]'
                        : isPassedLogged
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-mono tracking-wider opacity-90">
                      H{idx + 1}
                    </span>
                    <span className="text-[11px] font-bold">
                      {hr.hourSlot.split(' - ')[0]}
                    </span>
                    <span
                      className={`text-[9px] px-1 rounded-sm font-mono font-bold ${
                        isSelected
                          ? 'text-blue-100'
                          : isPassedLogged
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {hr.passedQty}p
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable QC Workspace (Light Theme) */}
          <main className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 overscroll-contain">
            {/* SECTION A: GIANT HOURLY OUTPUT COUNTER */}
            <section className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider text-blue-700 block">
                    HOUR {activeHourIndex + 1} • {currentHour.hourSlot}
                  </span>
                  <span className="text-xs text-slate-500">
                    Target: <strong className="text-slate-800 font-mono">{currentHour.targetQty} pcs</strong>
                  </span>
                </div>

                <div
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    hourEfficiency >= 85
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : hourEfficiency >= 75
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  {hourEfficiency}% Pace
                </div>
              </div>

              {/* Number display */}
              <div
                onClick={() => {
                  setDirectInputValue(currentHour.passedQty.toString());
                  setIsDirectInputOpen(true);
                }}
                className="flex flex-col items-center justify-center py-1 cursor-pointer active:scale-98 transition-transform"
                title="Tap to type count directly"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-black text-6xl text-slate-900 tracking-tight">
                    {currentHour.passedQty}
                  </span>
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    pcs passed
                  </span>
                </div>
                <span className="text-[10px] text-blue-600 font-medium">Tap number to edit directly</span>
              </div>

              {/* 6 Tactile increment buttons */}
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  { label: '-5', delta: -5, cls: 'bg-rose-50 text-rose-700 border-rose-200 active:bg-rose-100' },
                  { label: '-1', delta: -1, cls: 'bg-slate-100 text-slate-700 border-slate-200 active:bg-slate-200' },
                  { label: '+1', delta: 1, cls: 'bg-blue-600 text-white border-blue-600 font-black text-sm shadow-xs active:bg-blue-700' },
                  { label: '+5', delta: 5, cls: 'bg-blue-600 text-white border-blue-600 font-black text-sm shadow-xs active:bg-blue-700' },
                  { label: '+10', delta: 10, cls: 'bg-indigo-600 text-white border-indigo-600 font-bold active:bg-indigo-700' },
                  { label: '+25', delta: 25, cls: 'bg-emerald-600 text-white border-emerald-600 font-bold active:bg-emerald-700' },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => handleAdjustOutput(btn.delta)}
                    className={`py-3 rounded-xl border font-mono font-bold text-xs active:scale-92 transition-all flex items-center justify-center cursor-pointer ${btn.cls}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </section>

            {/* SECTION B: QUALITY & DEFECTS PAD (MODULE MANAGEMENT DEFECTS) */}
            <section className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Defect Logger ({availableDefects.length} Master Defects)
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-amber-700 font-bold">{currentHour.defectQty} Def</span>
                  <span className="text-slate-400">•</span>
                  <span className={`font-bold ${currentHour.defectRate <= 2.0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    DHU {currentHour.defectRate}%
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">RFT {currentHour.rftRate}%</span>
                </div>
              </div>

              {/* Category tabs & Search bar */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {['ALL', 'Sewing', 'Fabric', 'Cutting', 'Finishing', 'Washing'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDefectCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                        defectCategoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsNewDefectModalOpen(true)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Defect</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={defectSearchQuery}
                    onChange={(e) => setDefectSearchQuery(e.target.value)}
                    placeholder="Search defects from module management..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* DEFECT TILES MATRIX */}
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-0.5">
                {filteredDefects.map((def) => {
                  const match = (currentHour.defectBreakdown || []).find(
                    (d) => d.defectType === def.name
                  );
                  const count = match?.count || 0;

                  return (
                    <div
                      key={def.id}
                      onClick={() => handleDefectTap(def.name, 1)}
                      className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-between ${
                        count > 0
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="text-[11px] font-bold text-slate-900 truncate">
                          {def.name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] font-mono text-slate-500">
                            {def.code}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1 rounded-sm uppercase ${
                              def.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-700'
                                : def.severity === 'MAJOR'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {def.severity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {count > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDefectTap(def.name, -1);
                            }}
                            className="w-5 h-5 rounded-md bg-white border border-slate-300 active:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center cursor-pointer"
                            title="Minus 1"
                          >
                            -
                          </button>
                        )}
                        <span
                          className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center ${
                            count > 0
                              ? 'bg-amber-500 text-white font-black shadow-xs'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SCRAP REJECTS ROW */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-rose-700 text-[11px] block">
                    Scrap Rejects:
                  </span>
                  <span className="text-[10px] text-slate-500">Unfixable fabric damage</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRejectTap(-1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer border border-slate-300 active:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-rose-700 px-1 text-sm">
                    {currentHour.rejectQty || 0} pcs
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRejectTap(1)}
                    className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center cursor-pointer active:bg-rose-700 shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION C: QUICK QC REMARKS */}
            <section className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                Quick QC Event Tags &amp; Inspector Remarks
              </span>

              <div className="flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAddQuickTag(chip)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 active:bg-slate-200 text-[10px] font-semibold text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={currentHour.remarks || ''}
                onChange={(e) =>
                  updateCurrentHour((hr) => ({ ...hr, remarks: e.target.value }))
                }
                placeholder="Type hourly remark (e.g. tension adjusted on Station 4)..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white"
              />
            </section>
          </main>
        </>
      )}

      {/* TAB 2: ORDER & LINE SETUP (ALL DEFAULT ENTRY OPTIONS MADE ENTERABLE & EDITABLE) */}
      {mobileTab === 'setup' && (
        <main className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 overscroll-contain">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Production Order Setup
              </h2>
            </div>

            {/* PO / Order Number with auto-suggest */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Production Order / PO Number *</span>
                <span className="text-[10px] text-blue-600 font-normal">Type or pick from buyer list</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    setIsPoDropdownOpen(true);
                  }}
                  onFocus={() => setIsPoDropdownOpen(true)}
                  placeholder="e.g. PO-84920 or IND-2026"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
                {orderNumber && (
                  <button
                    type="button"
                    onClick={() => setOrderNumber('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* PO Suggestion Dropdown */}
              {isPoDropdownOpen && filteredBuyerOrders.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto p-1 space-y-1">
                  {filteredBuyerOrders.map((bo) => (
                    <div
                      key={bo.id}
                      onClick={() => handleSelectBuyerOrder(bo)}
                      className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-700">{bo.orderNumber}</span>
                        <span className="text-[10px] text-slate-500">{bo.buyerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">{bo.styleDescription}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 1. Manufacturing Unit */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                1. Manufacturing Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
              >
                {managedUnits.length > 0 ? (
                  managedUnits.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Unit 01 (Dhaka Complex)">Unit 01 (Dhaka Complex)</option>
                    <option value="Unit 02 (Chittagong SEZ)">Unit 02 (Chittagong SEZ)</option>
                    <option value="Unit 03 (Ashulia Modern Plant)">Unit 03 (Ashulia Modern Plant)</option>
                    <option value="Unit 04 (Gazipur Export Zone)">Unit 04 (Gazipur Export Zone)</option>
                  </>
                )}
              </select>
            </div>

            {/* 2. Manufacturing Section */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                2. Manufacturing Section *
              </label>
              <select
                value={section}
                onChange={(e) => handleSelectSection(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold text-blue-700 rounded-xl bg-blue-50/60 border border-blue-200 outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
              >
                {STANDARD_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Production Line / Workstation */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                3. Production Line / Workstation *
              </label>
              <select
                value={lineId}
                onChange={(e) => handleSelectLine(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
              >
                {(
                  SECTION_LINE_PRESETS[section] || SECTION_LINE_PRESETS['Sewing Floor']
                ).map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift & Record Date */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Record Date</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Shift</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.split('(')[0].trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buyer & Style */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Buyer Brand</label>
              <div className="flex gap-1.5">
                <select
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  {POPULAR_BUYERS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Style Name</label>
                <input
                  type="text"
                  value={styleName}
                  onChange={(e) => setStyleName(e.target.value)}
                  placeholder="e.g. Polo Shirt"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Style Number</label>
                <input
                  type="text"
                  value={styleNumber}
                  onChange={(e) => setStyleNumber(e.target.value)}
                  placeholder="e.g. STY-801"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Target Quantity & SMV */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Shift Target</label>
                <input
                  type="number"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Target SMV</label>
                <input
                  type="number"
                  step="0.1"
                  value={smvTarget}
                  onChange={(e) => setSmvTarget(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Operators</label>
                <input
                  type="number"
                  value={operatorCount}
                  onChange={(e) => setOperatorCount(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Supervisor & QC Controller */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Floor Supervisor</label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">QC Inspector</label>
                <input
                  type="text"
                  value={qualityInspector}
                  onChange={(e) => setQualityInspector(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Status & Due Date */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LineStatus)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  <option value="RUNNING">RUNNING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DELAYED">DELAYED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Shipment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Overall Remarks */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Shift Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Shift notes, mechanical issues, attendance notes..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileTab('qc_logger');
                showToast('✓ Order details updated. Switched to Live QC Logger');
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 active:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Done — Return to Live QC Pad
            </button>
          </div>
        </main>
      )}

      {/* TAB 3: SHIFT SUMMARY (ALL 8-HOURS BREAKDOWN) */}
      {mobileTab === 'summary' && (
        <main className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 overscroll-contain">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Passed Pcs</span>
              <span className="font-mono font-black text-xl text-emerald-700">{shiftTotals.totalPassed}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">/ {shiftTotals.totalTarget} Target</span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Defects</span>
              <span className="font-mono font-black text-xl text-amber-600">{shiftTotals.totalDefects}</span>
              <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">DHU {shiftTotals.avgDhu}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">RFT Rate</span>
              <span className="font-mono font-black text-xl text-blue-700">{shiftTotals.avgRft}%</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Efficiency {shiftTotals.efficiency}%</span>
            </div>
          </div>

          {/* 8-Hour Table Overview */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              8-Hour Shift Log Sheet
            </h3>

            <div className="space-y-1.5">
              {hourlyData.map((hr, idx) => (
                <div
                  key={hr.hourSlot}
                  onClick={() => {
                    setActiveHourIndex(idx);
                    setMobileTab('qc_logger');
                  }}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    activeHourIndex === idx
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      Hour {idx + 1}: {hr.hourSlot}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {hr.topDefect !== 'None' ? `Top: ${hr.topDefect}` : 'No defects recorded'}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-800">{hr.passedQty} pcs</span>
                    <span className="text-[10px] text-amber-700 block">{hr.defectQty} def ({hr.defectRate}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* 4. STICKY BOTTOM ACTION BAR (CLEAN LIGHT THEME) */}
      <footer className="p-3 bg-white/95 border-t border-slate-200 shrink-0 space-y-2 pb-[max(env(safe-area-inset-bottom),12px)] z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between text-xs px-1 font-mono">
          <span className="text-slate-600">
            Shift Total: <strong className="text-slate-900 font-bold">{shiftTotals.totalPassed}</strong> / {shiftTotals.totalTarget} pcs
          </span>
          <span className="text-emerald-700 font-bold">
            Efficiency: {shiftTotals.efficiency}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleSaveAndNextHour}
            className="py-3 px-3 rounded-xl bg-blue-600 active:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <span>Save Hour {activeHourIndex + 1}</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleFinalSubmit}
            className="py-3 px-3 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Submit Shift Record</span>
          </button>
        </div>
      </footer>

      {/* MODAL: DIRECT PIECES NUMBER INPUT */}
      {isDirectInputOpen && (
        <div className="fixed inset-0 z-[1000000] bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">Enter Hour Output</h3>
            <p className="text-[11px] text-slate-500">Passed pieces count for Hour {activeHourIndex + 1}</p>

            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={directInputValue}
              onChange={(e) => setDirectInputValue(e.target.value)}
              autoFocus
              className="w-full text-center font-mono font-black text-4xl py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
            />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDirectInputOpen(false)}
                className="py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSetOutputDirect(parseInt(directInputValue) || 0)}
                className="py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Set Count
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW DEFECT INLINE */}
      {isNewDefectModalOpen && (
        <div className="fixed inset-0 z-[1000000] bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Defect to Master List</h3>
              <button
                type="button"
                onClick={() => setIsNewDefectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Defect Name</label>
                <input
                  type="text"
                  value={newDefName}
                  onChange={(e) => setNewDefName(e.target.value)}
                  placeholder="e.g. Broken Needle Hole"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Category</label>
                  <select
                    value={newDefCategory}
                    onChange={(e) => setNewDefCategory(e.target.value as ProductionDefectCategory)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="Sewing">Sewing</option>
                    <option value="Fabric">Fabric</option>
                    <option value="Cutting">Cutting</option>
                    <option value="Finishing">Finishing</option>
                    <option value="Washing">Washing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Severity</label>
                  <select
                    value={newDefSeverity}
                    onChange={(e) => setNewDefSeverity(e.target.value as ProductionDefectSeverity)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="MINOR">MINOR</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewDefectModalOpen(false)}
                className="py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewDefect}
                className="py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Add &amp; Log +1
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  // 100% Full Page on Mobile (Edge-to-Edge, Light Clean Theme)
  if (isMobileBrowser || forceDesktopFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[999999] w-screen h-[100dvh] bg-slate-100 text-slate-800 flex flex-col overflow-hidden select-none touch-manipulation pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        {terminalInner}
      </div>,
      document.body
    );
  }

  // Desktop Browser: Centered Clean Handheld Preview
  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      {/* Desktop Mode Advisory Bar */}
      <div className="w-full max-w-md mb-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-md shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-[11px] font-semibold text-slate-700 truncate">
            Mobile Floor Terminal <span className="text-emerald-600 font-bold">• Full Page on Mobile</span>
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
            onClick={onBack}
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
