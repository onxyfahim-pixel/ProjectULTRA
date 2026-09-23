'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Factory,
  Layers,
  ShieldCheck,
  Target,
  Activity,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Users,
  Tag,
  FileText,
  Zap,
  Gauge,
  HelpCircle,
  TrendingUp,
  Search,
  Check,
  X,
  Award,
  BarChart2,
  Sliders,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  ProductionOrder,
  LineStatus,
  HourlyReportEntry,
  DefectCountEntry,
  TopDefectSummary,
} from '@/lib/types/erp';
import { MOCK_BUYER_ORDERS } from '@/lib/db/modules-mock-data';
import { BuyerOrder } from '@/lib/types/modules';
import {
  getProductionUnits,
  getProductionSections,
  getProductionLines,
} from '@/lib/db/production-management-store';
import {
  ProductionUnit,
  ProductionSection,
  ProductionLine,
} from '@/lib/types/production-management';
import { isSewingSectionRecord } from '@/lib/db/production-records-store';

export interface AddProductionRecordPageProps {
  initialOrder?: ProductionOrder | null;
  onSave: (order: ProductionOrder) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const MANUFACTURING_UNITS = [
  'Unit 01 (Dhaka Complex)',
  'Unit 02 (Chittagong SEZ)',
  'Unit 03 (Ashulia Modern Plant)',
  'Unit 04 (Gazipur Export Zone)',
];

const SECTIONS_AND_LINES = [
  { id: 'Line 01', label: 'Sewing Line 01 (Knit Tops)' },
  { id: 'Line 02', label: 'Sewing Line 02 (Knit Polo & Fleece)' },
  { id: 'Line 03', label: 'Sewing Line 03 (Woven Bottoms)' },
  { id: 'Line 04', label: 'Sewing Line 04 (Heavy Denim)' },
  { id: 'Line 05', label: 'Sewing Line 05 (Precision Knit)' },
  { id: 'Line 06', label: 'Sewing Line 06 (Fleece Assembly)' },
  { id: 'Line 07', label: 'Sewing Line 07 (Cargo & Utility)' },
  { id: 'Line 08', label: 'Sewing Line 08 (Intimates & Activewear)' },
  { id: 'Cutting', label: 'Cutting Floor Section 01' },
  { id: 'Finishing', label: 'Finishing & Packing Section 01' },
  { id: 'Washing', label: 'Industrial Washing Floor' },
];

const SHIFT_OPTIONS = [
  'Shift A (Morning 08:00 - 16:30)',
  'Shift B (Evening 16:30 - 01:00)',
  'Shift C (Night 01:00 - 08:00)',
  'General Day Shift (08:30 - 17:30)',
  'Overtime Extended (17:00 - 21:00)',
];

const BUYERS = [
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

const COMMON_DEFECTS = [
  'Broken Stitch',
  'Skip Stitch',
  'Puckering / Pleats',
  'Oil / Dirt Stain',
  'Raw Edge / Fraying',
  'Open Seam / Run-off',
  'Needle Mark / Fabric Cut',
  'Uneven Hem / Collar',
  'Measurement Out of Spec',
  'Shade Variation',
  'Button / Trim Defect',
  'Wavy Seam',
  'Loose Thread Ends',
];

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

export function AddProductionRecordPage({
  initialOrder,
  onSave,
  onCancel,
  showToast,
}: AddProductionRecordPageProps) {
  const isEditing = Boolean(initialOrder && initialOrder.id);

  // Form State
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
    initialOrder?.styleName || 'Slim Tapered Slub Denim Trouser'
  );
  const [styleNumber, setStyleNumber] = useState<string>(
    initialOrder?.styleNumber || 'STY-DN-502'
  );
  const [itemInfo, setItemInfo] = useState<string>(
    initialOrder?.itemInfo || '98% Cotton 2% Spandex Indigo Denim 12oz'
  );
  const [smvTarget, setSmvTarget] = useState<number>(
    initialOrder?.smvTarget || 18.5
  );
  const [unit, setUnit] = useState<string>(
    initialOrder?.unit || 'Unit 01 (Dhaka Complex)'
  );
  const [section, setSection] = useState<string>(
    initialOrder?.section || initialOrder?.sewingLine || 'Sewing Line 04 (Heavy Denim)'
  );
  const [lineId, setLineId] = useState<string>(initialOrder?.lineId || 'Line 04');
  const [status, setStatus] = useState<LineStatus>(initialOrder?.status || 'RUNNING');
  const [targetQuantity, setTargetQuantity] = useState<number>(
    initialOrder?.targetQuantity || 15000
  );
  const [completedQuantity, setCompletedQuantity] = useState<number>(
    initialOrder?.completedQuantity || 0
  );
  const [totalDefects, setTotalDefects] = useState<number>(
    initialOrder?.totalDefects || 0
  );
  const [dhuRate, setDhuRate] = useState<number>(
    initialOrder?.dhuRate ?? initialOrder?.defectRate ?? 1.15
  );
  const [rftRate, setRftRate] = useState<number>(initialOrder?.rftRate ?? 98.2);
  const [efficiencyPercent, setEfficiencyPercent] = useState<number>(
    initialOrder?.efficiencyPercent ?? 84.5
  );
  const [rejectQuantity, setRejectQuantity] = useState<number>(
    initialOrder?.rejectQuantity ?? 18
  );
  const [dueDate, setDueDate] = useState<string>(
    initialOrder?.dueDate
      ? initialOrder.dueDate.split('T')[0]
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString().split('T')[0]
  );
  const [operatorCount, setOperatorCount] = useState<number>(
    initialOrder?.operatorCount || 48
  );
  const [supervisorName, setSupervisorName] = useState<string>(
    initialOrder?.supervisorName || 'Kabir Hossain (Senior Line Sup)'
  );
  const [qualityInspector, setQualityInspector] = useState<string>(
    initialOrder?.qualityInspector || ''
  );
  const [remarks, setRemarks] = useState<string>(initialOrder?.remarks || '');

  // Managed Units, Sections, Lines from Production Management
  const [managedUnits, setManagedUnits] = useState<ProductionUnit[]>([]);
  const [managedSections, setManagedSections] = useState<ProductionSection[]>([]);
  const [managedLines, setManagedLines] = useState<ProductionLine[]>([]);
  const [selectedManagedLine, setSelectedManagedLine] = useState<ProductionLine | null>(null);

  useEffect(() => {
    const loadManagedData = () => {
      const u = getProductionUnits();
      const s = getProductionSections();
      const l = getProductionLines();
      setManagedUnits(u);
      setManagedSections(s);
      setManagedLines(l);

      // Match initialOrder to line if present
      if (initialOrder?.lineId || initialOrder?.section) {
        const found = l.find(
          (item) =>
            item.id === initialOrder.lineId ||
            item.lineCode === initialOrder.lineId ||
            item.name === initialOrder.section
        );
        if (found) setSelectedManagedLine(found);
      } else if (!initialOrder && l.length > 0) {
        // Pre-select first managed line if creating a fresh record
        const defaultLine = l[0];
        setSelectedManagedLine(defaultLine);
        setUnit(defaultLine.unitName);
        setSection(defaultLine.name);
        setLineId(defaultLine.lineCode || defaultLine.id);
        if (!supervisorName) setSupervisorName(defaultLine.lineChief);
        if (!qualityInspector) setQualityInspector(defaultLine.qualityController);
        if (defaultLine.operatorCount) setOperatorCount(defaultLine.operatorCount);
      }
    };
    loadManagedData();

    window.addEventListener('erp_production_management_updated', loadManagedData);
    return () => window.removeEventListener('erp_production_management_updated', loadManagedData);
  }, [initialOrder]);

  const handleSelectManagedLine = (lineIdOrName: string) => {
    const found = managedLines.find(
      (l) => l.id === lineIdOrName || l.name === lineIdOrName || l.lineCode === lineIdOrName
    );
    if (found) {
      setSelectedManagedLine(found);
      setSection(found.name);
      setLineId(found.lineCode || found.id);
      if (found.unitName) setUnit(found.unitName);
      if (found.lineChief) setSupervisorName(found.lineChief);
      if (found.qualityController) setQualityInspector(found.qualityController);
      if (found.operatorCount) setOperatorCount(found.operatorCount);
      showToast(`Linked ${found.name} — Chief: ${found.lineChief}, QC: ${found.qualityController}`);
    } else {
      setSection(lineIdOrName);
    }
  };

  // PO Auto-Suggest State
  const [poSearchFocus, setPoSearchFocus] = useState<boolean>(false);
  const [selectedBuyerOrder, setSelectedBuyerOrder] = useState<BuyerOrder | null>(null);
  const poDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for PO dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (poDropdownRef.current && !poDropdownRef.current.contains(event.target as Node)) {
        setPoSearchFocus(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available Buyer Orders (from MOCK_BUYER_ORDERS + localStorage if any)
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

  // Filtered PO Suggestions
  const matchingPOs = useMemo(() => {
    if (!orderNumber) return availableBuyerOrders.slice(0, 6);
    const q = orderNumber.toLowerCase().trim();
    return availableBuyerOrders.filter(
      (bo) =>
        bo.orderNumber.toLowerCase().includes(q) ||
        bo.buyerName.toLowerCase().includes(q) ||
        bo.styleNumber.toLowerCase().includes(q) ||
        bo.styleDescription.toLowerCase().includes(q)
    );
  }, [orderNumber, availableBuyerOrders]);

  // Select PO from suggestions and Auto-fill all related fields
  const handleSelectPO = (bo: BuyerOrder) => {
    setSelectedBuyerOrder(bo);
    setOrderNumber(bo.orderNumber);
    setBuyer(bo.buyerName);
    setStyleName(bo.styleDescription);
    setStyleNumber(bo.styleNumber);
    setTargetQuantity(bo.orderQuantity);
    setDueDate(bo.shipDate ? bo.shipDate.split('T')[0] : dueDate);

    // Extract item fabric info from BOM if present
    const fabricBOM = bo.bomItems?.find((b) => b.itemType === 'FABRIC');
    const desc = fabricBOM ? fabricBOM.description : bo.styleDescription;
    setItemInfo(desc);

    // Calculate realistic SMV target based on garment type
    let calculatedSmv = 18.5;
    const lowerStyle = bo.styleDescription.toLowerCase();
    if (lowerStyle.includes('tee') || lowerStyle.includes('t-shirt')) {
      calculatedSmv = 11.2;
    } else if (lowerStyle.includes('polo')) {
      calculatedSmv = 15.0;
    } else if (lowerStyle.includes('jeans') || lowerStyle.includes('denim')) {
      calculatedSmv = 22.4;
    } else if (lowerStyle.includes('jacket') || lowerStyle.includes('outerwear')) {
      calculatedSmv = 28.0;
    } else if (lowerStyle.includes('hoodie') || lowerStyle.includes('fleece')) {
      calculatedSmv = 19.5;
    }
    setSmvTarget(calculatedSmv);

    // Calculate hourly line target: (operators * 60 / SMV) * efficiency
    const hourlyLinePace = Math.round(((operatorCount || 48) * 60 / calculatedSmv) * ((efficiencyPercent || 84.5) / 100));

    // Update hourly slots target to match SMV pacing
    setHourlyReports((prev) =>
      prev.map((h) => ({
        ...h,
        targetQty: hourlyLinePace,
      }))
    );

    setPoSearchFocus(false);
    showToast(`✓ Auto-filled details from Buyer Order PO: ${bo.orderNumber}`);
  };

  // Hourly Reports State with Granular Defect Breakdowns
  const [hourlyReports, setHourlyReports] = useState<HourlyReportEntry[]>(() => {
    if (initialOrder?.hourlyReports && initialOrder.hourlyReports.length > 0) {
      return initialOrder.hourlyReports;
    }
    // Default 8 slots
    return DEFAULT_HOURLY_SLOTS.map((slot, idx) => ({
      id: `hr-init-${Date.now()}-${idx}`,
      hourSlot: slot,
      targetQty: 140,
      checkedQty: 0,
      passedQty: 0,
      defectQty: 0,
      defectRate: 0,
      rftRate: 100,
      defectBreakdown: [],
      topDefect: 'None',
      operatorId: `Station ${(idx % 12) + 1}`,
      remarks: '',
    }));
  });

  // Modal / Popover state for editing Defect Breakdown for a specific hour
  const [activeDefectModalHourIndex, setActiveDefectModalHourIndex] = useState<number | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate Overall Top 3 Defects across all hours
  const top3DefectsSummary: TopDefectSummary[] = useMemo(() => {
    const defectMap: Record<string, number> = {};

    hourlyReports.forEach((hr) => {
      if (hr.defectBreakdown && hr.defectBreakdown.length > 0) {
        hr.defectBreakdown.forEach((db) => {
          if (db.count > 0 && db.defectType && db.defectType !== 'None') {
            defectMap[db.defectType] = (defectMap[db.defectType] || 0) + Number(db.count);
          }
        });
      } else if (hr.topDefect && hr.topDefect !== 'None' && hr.topDefect !== 'None / Clean Pass' && hr.defectQty > 0) {
        defectMap[hr.topDefect] = (defectMap[hr.topDefect] || 0) + Number(hr.defectQty);
      }
    });

    const totalDef = Object.values(defectMap).reduce((a, b) => a + b, 0);

    return Object.entries(defectMap)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([defectType, count]) => ({
        defectType,
        count,
        percentage: totalDef > 0 ? Number(((count / totalDef) * 100).toFixed(1)) : 0,
      }));
  }, [hourlyReports]);

  // Hourly Totals & Summary Calculation
  const hourlySummary = useMemo(() => {
    const totalTarget = hourlyReports.reduce((sum, h) => sum + (Number(h.targetQty) || 0), 0);
    const totalChecked = hourlyReports.reduce((sum, h) => sum + (Number(h.checkedQty) || 0), 0);
    const totalPassed = hourlyReports.reduce((sum, h) => sum + (Number(h.passedQty) || 0), 0);
    const totalDef = hourlyReports.reduce((sum, h) => sum + (Number(h.defectQty) || 0), 0);
    const avgDhu = totalChecked > 0 ? Number(((totalDef / totalChecked) * 100).toFixed(2)) : 0;
    const avgRft = totalChecked > 0 ? Number((Math.max(0, (totalChecked - totalDef) / totalChecked) * 100).toFixed(1)) : 98.5;
    const achievementRate = totalTarget > 0 ? Number(((totalPassed / totalTarget) * 100).toFixed(1)) : 0;

    return {
      totalTarget,
      totalChecked,
      totalPassed,
      totalDefects: totalDef,
      avgDhu,
      avgRft,
      achievementRate,
    };
  }, [hourlyReports]);

  // Update a single hourly report row
  const updateHourlyRow = (
    index: number,
    field: keyof HourlyReportEntry,
    value: any
  ) => {
    setHourlyReports((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      // Auto-recalculate if checkedQty or defectQty changes directly
      if (field === 'checkedQty') {
        const checked = Number(value) || 0;
        const defects = Number(row.defectQty) || 0;
        row.passedQty = Math.max(0, checked - defects);
        row.defectRate = checked > 0 ? Number(((defects / checked) * 100).toFixed(2)) : 0;
        row.rftRate = checked > 0 ? Number((Math.max(0, (checked - defects) / checked) * 100).toFixed(1)) : 100;
      }

      updated[index] = row;
      return updated;
    });
  };

  // Add a specific defect with quantity to an hour's breakdown
  const handleAddDefectToHour = (
    hourIndex: number,
    defectType: string,
    countDelta: number
  ) => {
    setHourlyReports((prev) => {
      const updated = [...prev];
      const row = { ...updated[hourIndex] };
      let breakdown: DefectCountEntry[] = [...(row.defectBreakdown || [])];

      const existingIndex = breakdown.findIndex((d) => d.defectType === defectType);
      if (existingIndex >= 0) {
        const newCount = Math.max(0, breakdown[existingIndex].count + countDelta);
        if (newCount === 0) {
          breakdown = breakdown.filter((_, i) => i !== existingIndex);
        } else {
          breakdown[existingIndex] = { ...breakdown[existingIndex], count: newCount };
        }
      } else if (countDelta > 0) {
        breakdown.push({ defectType, count: countDelta });
      }

      // Sum defects
      const sumDefects = breakdown.reduce((sum, d) => sum + d.count, 0);
      const checked = Number(row.checkedQty) || 0;

      // Auto-calculate passed, DHU%, RFT%
      row.defectBreakdown = breakdown;
      row.defectQty = sumDefects;
      row.passedQty = Math.max(0, checked - sumDefects);
      row.defectRate = checked > 0 ? Number(((sumDefects / checked) * 100).toFixed(2)) : 0;
      row.rftRate = checked > 0 ? Number((Math.max(0, (checked - sumDefects) / checked) * 100).toFixed(1)) : 100;

      // Find top defect for this hour
      if (breakdown.length > 0) {
        const sorted = [...breakdown].sort((a, b) => b.count - a.count);
        row.topDefect = sorted[0].defectType;
      } else {
        row.topDefect = 'None';
      }

      updated[hourIndex] = row;
      return updated;
    });
  };

  // Add new hourly slot
  const handleAddHourRow = () => {
    const lastHour = hourlyReports[hourlyReports.length - 1]?.hourSlot || '17:00 - 18:00';
    const nextStart = parseInt(lastHour.split('-')[1]?.trim().split(':')[0] || '17', 10);
    const nextSlot = `${String(nextStart).padStart(2, '0')}:00 - ${String(nextStart + 1).padStart(2, '0')}:00`;

    setHourlyReports((prev) => [
      ...prev,
      {
        id: `hr-${Date.now()}-${prev.length}`,
        hourSlot: nextSlot,
        targetQty: 130,
        checkedQty: 0,
        passedQty: 0,
        defectQty: 0,
        defectRate: 0,
        rftRate: 100,
        defectBreakdown: [],
        topDefect: 'None',
        operatorId: `Station ${prev.length + 1}`,
        remarks: 'Overtime / Extended Hour',
      },
    ]);
  };

  // Delete hourly row
  const handleDeleteHourRow = (index: number) => {
    if (hourlyReports.length <= 1) {
      showToast('At least one hourly reporting slot must remain.');
      return;
    }
    setHourlyReports((prev) => prev.filter((_, i) => i !== index));
  };

  // Pre-fill standard 8 hours with realistic inspection data
  const handlePreFillStandardHours = () => {
    const sampleDefects = [
      [{ defectType: 'Broken Stitch', count: 2 }, { defectType: 'Skip Stitch', count: 1 }],
      [{ defectType: 'Skip Stitch', count: 2 }],
      [{ defectType: 'Broken Stitch', count: 1 }, { defectType: 'Puckering / Pleats', count: 1 }],
      [{ defectType: 'Oil / Dirt Stain', count: 1 }],
      [{ defectType: 'Open Seam / Run-off', count: 2 }],
      [{ defectType: 'Broken Stitch', count: 2 }, { defectType: 'Raw Edge / Fraying', count: 1 }],
      [{ defectType: 'Skip Stitch', count: 1 }, { defectType: 'Uneven Hem / Collar', count: 1 }],
      [{ defectType: 'Broken Stitch', count: 1 }],
    ];

    const populated: HourlyReportEntry[] = DEFAULT_HOURLY_SLOTS.map((slot, idx) => {
      const breakdown = sampleDefects[idx % sampleDefects.length];
      const sumDef = breakdown.reduce((s, d) => s + d.count, 0);
      const checked = 145;
      const passed = checked - sumDef;
      const dhu = Number(((sumDef / checked) * 100).toFixed(2));
      const rft = Number(((passed / checked) * 100).toFixed(1));

      return {
        id: `hr-std-${Date.now()}-${idx}`,
        hourSlot: slot,
        targetQty: 150,
        checkedQty: checked,
        passedQty: passed,
        defectQty: sumDef,
        defectRate: dhu,
        rftRate: rft,
        defectBreakdown: breakdown,
        topDefect: breakdown[0].defectType,
        operatorId: `Station ${(idx % 8) + 1}`,
        remarks: 'Standard inspection pace',
      };
    });

    setHourlyReports(populated);
    showToast('Loaded standard 8-hour production & QC inspection schedule with defect breakdown.');
  };

  // Sync Hourly Totals directly to Order Overall KPIs
  const handleSyncHourlyToOrder = () => {
    if (hourlySummary.totalPassed === 0 && hourlySummary.totalChecked === 0) {
      showToast('Enter hourly checked & passed figures first.');
      return;
    }
    setCompletedQuantity(hourlySummary.totalPassed);
    setTotalDefects(hourlySummary.totalDefects);
    setDhuRate(hourlySummary.avgDhu);
    setRftRate(hourlySummary.avgRft);
    showToast(`✓ Synced ${hourlySummary.totalPassed} passed pcs & ${hourlySummary.avgDhu}% DHU to Order Summary.`);
  };

  // Save Record
  const handleSave = () => {
    setValidationError(null);

    if (!orderNumber.trim()) {
      setValidationError('Order / PO Number is required. Please type or select a Buyer Order PO.');
      return;
    }
    if (!styleName.trim()) {
      setValidationError('Style Name is required.');
      return;
    }
    if (!recordDate) {
      setValidationError('Record Date is required.');
      return;
    }

    const orderToSave: ProductionOrder = {
      id: initialOrder?.id || `po-${Date.now()}`,
      orderNumber: orderNumber.trim(),
      recordDate: recordDate,
      shift: shift,
      buyer: buyer.trim(),
      styleName: styleName.trim(),
      styleNumber: styleNumber.trim(),
      itemInfo: itemInfo.trim(),
      smvTarget: Number(smvTarget) || 18.5,
      unit: unit,
      section: section,
      targetQuantity: Number(targetQuantity) || 0,
      completedQuantity: Number(completedQuantity) || hourlySummary.totalPassed || 0,
      totalDefects: Number(totalDefects) || hourlySummary.totalDefects || 0,
      defectRate: Number(dhuRate) || hourlySummary.avgDhu || 0,
      dhuRate: Number(dhuRate) || hourlySummary.avgDhu || 0,
      rftRate: Number(rftRate) || hourlySummary.avgRft || 98.2,
      efficiencyPercent: Number(efficiencyPercent) || 84.5,
      rejectQuantity: Number(rejectQuantity) || 0,
      sewingLine: section,
      lineId: lineId,
      status: status,
      dueDate: dueDate,
      operatorCount: Number(operatorCount) || 48,
      supervisorName: supervisorName.trim(),
      qualityInspector: qualityInspector.trim(),
      remarks: remarks.trim(),
      createdAt: initialOrder?.createdAt || new Date().toISOString(),
      hourlyReports: hourlyReports,
      top3Defects: top3DefectsSummary,
    };

    onSave(orderToSave);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Production Orders"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {isEditing ? `Edit Record: ${orderNumber}` : 'New Production & Quality Record'}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{recordDate || 'Select Date'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{shift.split('(')[0].trim()}</span>
              </span>
              {selectedBuyerOrder && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Linked: {selectedBuyerOrder.orderNumber}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Auto-linked Buyer PO, Record Date, Hourly Quality Check (Defect Quantity, DHU% & RFT% auto-calculation), and Top 3 Defect Analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Create Record'}</span>
          </button>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-800 font-semibold animate-in shake">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* SECTION 1: BUYER PO SELECTION & RECORD SPECIFICATIONS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Buyer & Order PO Auto-Link & Record Information
              </h3>
              <p className="text-[11px] text-slate-500">
                Type letters in the PO field to auto-populate Buyer, Style, Item/Fabric info, Order Quantity, SMV Target, and Shipment Date.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
            Step 1 of 3
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PO / Order Number with Typeahead Auto-complete */}
          <div className="relative space-y-1.5 p-3 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200" ref={poDropdownRef}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                Order / PO Number <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded font-semibold">
                Auto-Suggest
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value);
                  setPoSearchFocus(true);
                }}
                onFocus={() => setPoSearchFocus(true)}
                placeholder="Type 'PO', 'HM', 'ZARA', '502'..."
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-blue-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                required
              />
              {orderNumber && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderNumber('');
                    setSelectedBuyerOrder(null);
                  }}
                  className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-blue-700/80">
              Type to search live orders from the Buyer & Order module.
            </p>
            {isSewingSectionRecord({ section, sewingLine: section, lineId } as any) && (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Sewing section checked quantity will automatically sync to PO {orderNumber || '(selected PO)'} in Buyer &amp; Order details page.
                </span>
              </div>
            )}

            {/* Floating PO Suggestions Popover */}
            {poSearchFocus && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-blue-200 shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Matching Buyer Orders ({matchingPOs.length})</span>
                  <span className="text-blue-600 lowercase font-normal">click to auto-fill</span>
                </div>
                {matchingPOs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching buyer PO found. Type custom order number.
                  </div>
                ) : (
                  matchingPOs.map((bo) => (
                    <button
                      key={bo.id}
                      type="button"
                      onClick={() => handleSelectPO(bo)}
                      className="w-full text-left p-3 hover:bg-blue-50/80 transition-colors flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-blue-700">
                          {bo.orderNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700">
                          {bo.buyerName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">
                        <span className="font-mono font-semibold text-slate-800">{bo.styleNumber}</span> — {bo.styleDescription}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5 font-mono">
                        <span>Qty: <strong className="text-slate-700">{bo.orderQuantity.toLocaleString()} pcs</strong></span>
                        <span>•</span>
                        <span>Ship Date: <strong className="text-slate-700">{bo.shipDate}</strong></span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Record Date - CRITICAL REQUIREMENT */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Record Add Date <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setRecordDate(new Date().toISOString().split('T')[0])}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Today
              </button>
            </div>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
              required
            />
            <p className="text-[10px] text-slate-500">Inspection & production record date.</p>
          </div>

          {/* Shift Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Operating Shift
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {SHIFT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">Shift pacing for line operators.</p>
          </div>

          {/* Quality Inspector Name (Manual Entry with Auto-Link Support) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Quality Inspector Name <span className="text-rose-500">*</span>
              </label>
              {selectedManagedLine?.qualityController && qualityInspector === selectedManagedLine.qualityController ? (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                  Linked from Line QC
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">QC Auditor</span>
              )}
            </div>
            <input
              type="text"
              value={qualityInspector}
              onChange={(e) => setQualityInspector(e.target.value)}
              placeholder="e.g. Md. Rafiqul Islam"
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
              required
            />
            <p className="text-[10px] text-slate-500">
              Inspector responsible for hourly garment inspection (auto-assigned from Line QC, editable).
            </p>
          </div>

          {/* Buyer */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Buyer / Client
            </label>
            <select
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {BUYERS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">Auto-filled or select buyer.</p>
          </div>

          {/* Style Description / Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Style Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              placeholder="e.g. Men Heavyweight Cotton Crewneck Tee"
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Style Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Style Code / Number</label>
            <input
              type="text"
              value={styleNumber}
              onChange={(e) => setStyleNumber(e.target.value)}
              placeholder="e.g. STY-TS-2026"
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Item / Fabric Material Info */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Item / Material Info</label>
            <input
              type="text"
              value={itemInfo}
              onChange={(e) => setItemInfo(e.target.value)}
              placeholder="e.g. 100% Combed Cotton Single Jersey 180 GSM"
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Order Quantity (Batch Target) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              Order Quantity (Total Pcs)
            </label>
            <input
              type="number"
              min="1"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SMV Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                SMV Target (Minutes)
              </label>
              <span className="text-[10px] text-slate-400">Pacing benchmark</span>
            </div>
            <input
              type="number"
              step="0.1"
              min="1"
              value={smvTarget}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 18.5;
                setSmvTarget(val);
                // recalculate hourly target
                const pace = Math.round(((operatorCount || 48) * 60 / val) * ((efficiencyPercent || 84.5) / 100));
                setHourlyReports((prev) => prev.map((h) => ({ ...h, targetQty: pace })));
              }}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Shipment Date (Due Date) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Shipment Date / Deadline
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Manufacturing Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Manufacturing Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {(managedUnits.length > 0 ? managedUnits.map((u) => u.name) : MANUFACTURING_UNITS).map(
                (u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Section / Production Line with Auto-Link from Management */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5 text-blue-600" />
                Floor Section & Line <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-blue-600 font-semibold">
                From Management
              </span>
            </div>
            <select
              value={selectedManagedLine?.id || section}
              onChange={(e) => handleSelectManagedLine(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-blue-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
            >
              {managedLines.length > 0 ? (
                managedLines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.lineCode}) • Chief: {l.lineChief} • QC: {l.qualityController}
                  </option>
                ))
              ) : (
                SECTIONS_AND_LINES.map((s) => (
                  <option key={s.id} value={s.label}>
                    {s.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Supervisor / Line Chief Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Line Chief / Supervisor
              </label>
              {selectedManagedLine?.lineChief && supervisorName === selectedManagedLine.lineChief && (
                <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-semibold">
                  Linked from Line Chief
                </span>
              )}
            </div>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="e.g. Kabir Hossain (Senior Line Sup)"
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Active Operators Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Active Operators</label>
            <input
              type="number"
              min="1"
              value={operatorCount}
              onChange={(e) => setOperatorCount(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Line Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Production Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LineStatus)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="RUNNING">RUNNING (Active Production)</option>
              <option value="COMPLETED">COMPLETED (Order Closed)</option>
              <option value="PAUSED">PAUSED (On Hold / Changeover)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: LIVE HOURLY INSPECTION SHEET & DEFECT LOGGING */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Quality Inspector Hourly Monitoring & Defect Logger
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {hourlyReports.length} Hours Tracked
                </span>
                {qualityInspector && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    Inspector: {qualityInspector.split('(')[0].trim()}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Log total checked quantity, record specific defects & their quantities per hour. DHU% and RFT% are auto-generated.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePreFillStandardHours}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Populate standard 8-hour schedule"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Standard 8-Hour Shift</span>
            </button>
            <button
              type="button"
              onClick={handleAddHourRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hour Slot</span>
            </button>
            <button
              type="button"
              onClick={handleSyncHourlyToOrder}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer border border-emerald-200"
              title="Sync total hourly passed pcs & DHU to order total"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sync to Order Summary</span>
            </button>
          </div>
        </div>

        {/* TOP 3 IDENTIFIED DEFECTS WIDGET (AUTO-GENERATED) */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-xl text-white shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Live Top 3 Identified Defects
              </h4>
            </div>
            <span className="text-[10px] text-slate-300 font-mono">
              Auto-aggregated from all hourly QC inspection breakdowns
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            {top3DefectsSummary.length === 0 ? (
              <div className="col-span-3 text-center py-2 text-xs text-slate-400">
                No defects logged in the hourly table yet. Enter checked and defect counts below.
              </div>
            ) : (
              top3DefectsSummary.map((td, rank) => {
                const rankLabels = ['Rank #1 (Major)', 'Rank #2', 'Rank #3'];
                const rankBadges = [
                  'bg-amber-400/20 text-amber-300 border-amber-400/40',
                  'bg-slate-300/20 text-slate-200 border-slate-300/40',
                  'bg-amber-700/30 text-amber-200 border-amber-600/40',
                ];

                return (
                  <div
                    key={td.defectType}
                    className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${rankBadges[rank]}`}>
                        {rankLabels[rank]}
                      </span>
                      <span className="font-mono font-bold text-sm text-white">
                        {td.count} <span className="text-[10px] font-normal text-slate-300">pcs ({td.percentage}%)</span>
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {td.defectType}
                    </div>
                    <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(td.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Hourly Table with Granular Defect Breakdown */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 w-32">Hour Slot</th>
                <th className="py-2.5 px-3 w-24 text-right">Target</th>
                <th className="py-2.5 px-3 w-28 text-right bg-blue-50/50">Total Checked</th>
                <th className="py-2.5 px-3 w-24 text-right bg-rose-50/50">Total Defect</th>
                <th className="py-2.5 px-3 w-24 text-right bg-emerald-50/50">Passed Pcs</th>
                <th className="py-2.5 px-3 w-24 text-right">DHU %</th>
                <th className="py-2.5 px-3 w-24 text-right">RFT %</th>
                <th className="py-2.5 px-3 min-w-[240px]">Defects & Quantities Logged</th>
                <th className="py-2.5 px-3 w-36">Workstation / Remarks</th>
                <th className="py-2.5 px-3 w-10 text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hourlyReports.map((row, index) => {
                const dhuVal = row.defectRate || 0;
                const rftVal = row.rftRate ?? (row.checkedQty > 0 ? Number((Math.max(0, row.checkedQty - row.defectQty) / row.checkedQty * 100).toFixed(1)) : 100);

                const dhuBadgeColor =
                  dhuVal === 0
                    ? 'bg-slate-100 text-slate-700'
                    : dhuVal <= 1.5
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : dhuVal <= 2.5
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';

                const rftBadgeColor =
                  rftVal >= 97
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : rftVal >= 94
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';

                const breakdown = row.defectBreakdown || [];

                return (
                  <tr key={row.id || index} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>

                    {/* Hour Slot */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.hourSlot}
                        onChange={(e) => updateHourlyRow(index, 'hourSlot', e.target.value)}
                        placeholder="08:00 - 09:00"
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    {/* Target Pcs */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        value={row.targetQty}
                        onChange={(e) =>
                          updateHourlyRow(index, 'targetQty', parseInt(e.target.value, 10) || 0)
                        }
                        className="w-full px-2 py-1 text-xs font-mono text-right font-medium bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    {/* Total Checked Pcs */}
                    <td className="py-2.5 px-3 bg-blue-50/20">
                      <input
                        type="number"
                        min="0"
                        value={row.checkedQty}
                        onChange={(e) =>
                          updateHourlyRow(index, 'checkedQty', parseInt(e.target.value, 10) || 0)
                        }
                        className="w-full px-2 py-1 text-xs font-mono text-right font-bold bg-white border border-blue-300 rounded-lg text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                      />
                    </td>

                    {/* Total Defects Found (Auto calculated from breakdown) */}
                    <td className="py-2.5 px-3 text-right bg-rose-50/20">
                      <span className="font-mono font-bold text-xs text-rose-700 bg-rose-100/60 px-2 py-1 rounded-md border border-rose-200">
                        {row.defectQty}
                      </span>
                    </td>

                    {/* Passed Pcs (Auto-calculated: checked - defects) */}
                    <td className="py-2.5 px-3 text-right bg-emerald-50/20">
                      <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-100/60 px-2 py-1 rounded-md border border-emerald-200">
                        {row.passedQty}
                      </span>
                    </td>

                    {/* Auto-generated DHU % */}
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${dhuBadgeColor}`}
                      >
                        {dhuVal.toFixed(2)}%
                      </span>
                    </td>

                    {/* Auto-generated RFT % */}
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${rftBadgeColor}`}
                      >
                        {rftVal.toFixed(1)}%
                      </span>
                    </td>

                    {/* Granular Defects & Quantities Logged */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {breakdown.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No defects</span>
                        ) : (
                          breakdown.map((d) => (
                            <span
                              key={d.defectType}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                            >
                              <span>{d.defectType}:</span>
                              <strong className="font-mono text-rose-900">{d.count}</strong>
                              <button
                                type="button"
                                onClick={() => handleAddDefectToHour(index, d.defectType, -1)}
                                className="ml-0.5 text-rose-400 hover:text-rose-700"
                                title="Reduce count by 1"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveDefectModalHourIndex(index)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 hover:bg-blue-50 text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Defect</span>
                        </button>
                      </div>
                    </td>

                    {/* Remarks / Workstation */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.remarks || ''}
                        onChange={(e) => updateHourlyRow(index, 'remarks', e.target.value)}
                        placeholder="Station / QC note..."
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    {/* Delete Row */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteHourRow(index)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete hour slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Live Hourly KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Target
            </div>
            <div className="text-base font-black font-mono text-slate-900 mt-0.5">
              {hourlySummary.totalTarget.toLocaleString()}{' '}
              <span className="text-[10px] font-normal text-slate-400">pcs</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
              Total Checked
            </div>
            <div className="text-base font-black font-mono text-blue-700 mt-0.5">
              {hourlySummary.totalChecked.toLocaleString()}{' '}
              <span className="text-[10px] font-normal text-slate-400">pcs</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
              Total Passed
            </div>
            <div className="text-base font-black font-mono text-emerald-700 mt-0.5">
              {hourlySummary.totalPassed.toLocaleString()}{' '}
              <span className="text-[10px] font-normal text-slate-400">pcs</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
              Total Defects
            </div>
            <div className="text-base font-black font-mono text-rose-700 mt-0.5">
              {hourlySummary.totalDefects.toLocaleString()}{' '}
              <span className="text-[10px] font-normal text-slate-400">def</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Auto-DHU%
            </div>
            <div
              className={`text-base font-black font-mono mt-0.5 ${
                hourlySummary.avgDhu <= 2.0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {hourlySummary.avgDhu}%
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
              Auto-RFT%
            </div>
            <div className="text-base font-black font-mono text-indigo-700 mt-0.5">
              {hourlySummary.avgRft}%
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: OVERALL SHIFT SUMMARY & QUALITY METRICS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Order Shift Metrics & Supervisor Observations
              </h3>
              <p className="text-[11px] text-slate-500">
                Consolidated production totals, line efficiency, and quality control summary notes.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
            Step 3 of 3
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Completed / Total Output */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Total Output Completed (Pcs)
              </label>
              {hourlySummary.totalPassed > 0 && (
                <button
                  type="button"
                  onClick={() => setCompletedQuantity(hourlySummary.totalPassed)}
                  className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Use Hourly ({hourlySummary.totalPassed})
                </button>
              )}
            </div>
            <input
              type="number"
              min="0"
              value={completedQuantity}
              onChange={(e) => setCompletedQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Line Efficiency % */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-indigo-600" />
              Line Efficiency (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={efficiencyPercent}
              onChange={(e) => setEfficiencyPercent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Right First Time (RFT) % */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Right First Time (RFT %)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={rftRate}
              onChange={(e) => setRftRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Unrecoverable Reject / Scrap */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Reject / Scrap (Pcs)</label>
            <input
              type="number"
              min="0"
              value={rejectQuantity}
              onChange={(e) => setRejectQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-rose-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Supervisor / QA Remarks */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Supervisor & QC In-Charge Remarks / Corrective Actions
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Critical 4-needle overlock tension calibrated. 100% inline needle check passed. Top defect Broken Stitch mitigated by adjusting loop tension."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* QUICK DEFECT LOGGER MODAL / POPOVER FOR ACTIVE HOUR */}
      {activeDefectModalHourIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  Log Defects for Hour: {hourlyReports[activeDefectModalHourIndex]?.hourSlot}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Select defect type and tap + to add count. DHU% and RFT% update automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDefectModalHourIndex(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Common Sewing Defects (Tap to Add):
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_DEFECTS.map((defect) => {
                    const existingCount =
                      hourlyReports[activeDefectModalHourIndex]?.defectBreakdown?.find(
                        (d) => d.defectType === defect
                      )?.count || 0;

                    return (
                      <div
                        key={defect}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          existingCount > 0
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="truncate max-w-[120px]" title={defect}>
                          {defect}
                        </span>
                        <div className="flex items-center gap-1">
                          {existingCount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAddDefectToHour(activeDefectModalHourIndex, defect, -1)
                              }
                              className="w-5 h-5 rounded-md bg-rose-200 hover:bg-rose-300 text-rose-800 flex items-center justify-center font-bold text-xs"
                            >
                              -
                            </button>
                          )}
                          <span className="w-5 text-center font-mono font-bold text-xs">
                            {existingCount}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleAddDefectToHour(activeDefectModalHourIndex, defect, 1)
                            }
                            className="w-5 h-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Hour Summary Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Checked:</span>
                  <span className="font-bold text-slate-900">
                    {hourlyReports[activeDefectModalHourIndex]?.checkedQty || 0} pcs
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Total Defects:</span>
                  <span className="font-bold">
                    {hourlyReports[activeDefectModalHourIndex]?.defectQty || 0} pcs
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Passed Output:</span>
                  <span className="font-bold">
                    {hourlyReports[activeDefectModalHourIndex]?.passedQty || 0} pcs
                  </span>
                </div>
                <div className="flex justify-between text-blue-700 font-bold pt-1 border-t border-slate-200">
                  <span>Auto-DHU% / Auto-RFT%:</span>
                  <span>
                    {hourlyReports[activeDefectModalHourIndex]?.defectRate || 0}% DHU / {hourlyReports[activeDefectModalHourIndex]?.rftRate || 100}% RFT
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDefectModalHourIndex(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Done / Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Strip */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-slate-600">
            Record Date: <strong className="text-blue-700">{recordDate}</strong>
          </span>
          <span className="hidden sm:inline-block text-slate-300">|</span>
          <span className="hidden sm:inline-block font-semibold text-slate-600">
            PO: <strong className="text-slate-800">{orderNumber || '—'}</strong>
          </span>
          <span className="hidden md:inline-block text-slate-300">|</span>
          <span className="hidden md:inline-block font-semibold text-slate-600">
            Hourly Passed: <strong className="text-emerald-700">{hourlySummary.totalPassed} pcs</strong> | DHU: <strong className="text-slate-900">{hourlySummary.avgDhu}%</strong> | RFT: <strong className="text-indigo-700">{hourlySummary.avgRft}%</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Save Production Quality Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
