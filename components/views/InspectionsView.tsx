'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  BarChart3,
  PieChart,
  XCircle,
  Eye,
  Edit,
  Copy,
  Trash2,
  Layers,
  Search,
  Package,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Sparkles,
  Sliders,
  Check,
  Filter,
  Scale,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Truck,
  Ship,
  ArrowRight,
  ExternalLink,
  CalendarClock,
  FileDown,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { InspectionRecord, InspectionStatus, InspectionStage, InspectionType } from '@/lib/types/erp';
import { BuyerOrder } from '@/lib/types/modules';
import { INITIAL_INSPECTIONS } from '@/lib/db/mock-data';
import { MOCK_BUYER_ORDERS } from '@/lib/db/modules-mock-data';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { calculateQuantityVariance } from '@/lib/aql';
import { InspectionDetailsPage } from '../modules/inspection/InspectionDetailsPage';
import { InspectionEntryPage } from '../modules/inspection/InspectionEntryPage';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';
import { InspectionExportModal } from '../modules/inspection/InspectionExportModal';
import { InspectionSingleExportModal } from '../modules/inspection/InspectionSingleExportModal';

export interface InspectionsViewProps {
  records?: InspectionRecord[];
  onUpdateRecords?: (records: InspectionRecord[]) => void;
  onOpenNewInspection?: () => void;
  orders?: BuyerOrder[];
}

export type SummaryTypeFilter = 'FINAL' | 'PRE_FINAL' | 'INLINE' | 'ALL';

type InspectionSubView =
  | { type: 'none' }
  | { type: 'details'; record: InspectionRecord }
  | { type: 'add'; initialRecord?: Partial<InspectionRecord> }
  | { type: 'edit'; record: InspectionRecord };

const STAGE_LABELS: Record<InspectionStage, string> = {
  FABRIC_INWARD: 'Fabric Inward (4-Point)',
  CUTTING_INSPECTION: 'Cutting & Spreading',
  SEWING_IN_LINE: 'Sewing In-Line QC',
  END_LINE_QC: 'End-Line QC Audit',
  FINISHING_PACKING: 'Finishing & Packing',
};

const TYPE_BADGES: Record<InspectionType, { label: string; cls: string; icon: string }> = {
  INLINE: {
    label: 'Inline',
    cls: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: '🧵',
  },
  PRE_FINAL: {
    label: 'Pre-Final',
    cls: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: '📦',
  },
  FINAL: {
    label: 'Final (FRI)',
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: '🏆',
  },
};

const STATUS_CHIP: Record<InspectionStatus, { cls: string; label: string }> = {
  PASSED: { cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200', label: '✓ Passed' },
  CONDITIONAL_PASS: { cls: 'bg-amber-100 text-amber-800 border border-amber-200', label: '~ Conditional' },
  REJECTED: { cls: 'bg-rose-100 text-rose-800 border border-rose-200', label: '✗ Rejected' },
};

function InspectionStatusChip({ status }: { status: InspectionStatus }) {
  const { cls, label } = STATUS_CHIP[status] || STATUS_CHIP.PASSED;
  return <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export function InspectionsView({
  records: propRecords,
  onUpdateRecords,
  onOpenNewInspection,
  orders = [],
}: InspectionsViewProps) {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [records, setRecords] = useState<InspectionRecord[]>(
    propRecords && propRecords.length > 0 ? propRecords : INITIAL_INSPECTIONS
  );
  const { user, permissions } = useErpAuth();

  // Sync prop records
  useEffect(() => {
    if (propRecords && propRecords.length > 0) {
      setRecords(propRecords);
    }
  }, [propRecords]);

  // Dedicated Separate Sub-Pages Routing (matching BuyerOrderView pattern)
  const [subView, setSubView] = useState<InspectionSubView>({ type: 'none' });

  // Keep details page refreshed if record updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = records.find((r) => r.id === subView.record.id);
      if (refreshed && refreshed !== subView.record) {
        setSubView({ type: 'details', record: refreshed });
      }
    }
  }, [records]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    records: InspectionRecord[];
  } | null>(null);

  // Global & Individual Export States
  const [isGlobalExportModalOpen, setIsGlobalExportModalOpen] = useState(false);
  const [selectedRecordsForExport, setSelectedRecordsForExport] = useState<InspectionRecord[]>([]);
  const [isSingleExportModalOpen, setIsSingleExportModalOpen] = useState(false);
  const [recordForSingleExport, setRecordForSingleExport] = useState<InspectionRecord | null>(null);

  // Filter States for Inspection List
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [buyerFilter, setBuyerFilter] = useState<string>('ALL');

  // Summary Inspection Stage / Type Filter (Default: FINAL)
  const [summaryTypeFilter, setSummaryTypeFilter] = useState<SummaryTypeFilter>('FINAL');

  // Synced Buyer Orders State (Live synced from Buyer Orders module)
  const [syncedOrders, setSyncedOrders] = useState<BuyerOrder[]>(
    orders && orders.length > 0 ? orders : MOCK_BUYER_ORDERS
  );

  // Sync prop orders or storage
  useEffect(() => {
    if (orders && orders.length > 0) {
      setSyncedOrders(orders);
    }
  }, [orders]);

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const stored = localStorage.getItem('erp_buyer_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSyncedOrders(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to sync buyer orders from localStorage', err);
      }
    };
    window.addEventListener('erp_buyer_orders_updated', syncFromStorage);
    return () => window.removeEventListener('erp_buyer_orders_updated', syncFromStorage);
  }, []);

  // Delivery table search & filter states
  const [deliverySearch, setDeliverySearch] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | 'URGENT' | 'PENDING' | 'PASSED'>('ALL');

  // Summary Date Range Filter
  type SummaryDateRange = 'today' | 'this_week' | 'this_month' | 'this_year' | 'all' | 'custom';
  const [summaryDateRange, setSummaryDateRange] = useState<SummaryDateRange>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Date and Stage filtered summary records (Default: Final Inspection)
  const filteredSummaryRecords = useMemo(() => {
    const now = new Date();
    return records.filter((r) => {
      // Stage / Type Filter: Default to 'FINAL'
      if (summaryTypeFilter !== 'ALL') {
        const rType = r.inspectionType || (r.stage === 'FINISHING_PACKING' ? 'FINAL' : 'INLINE');
        if (rType !== summaryTypeFilter) return false;
      }

      if (summaryDateRange === 'all') return true;
      const d = new Date(r.createdAt || '');
      if (isNaN(d.getTime())) return false;
      if (summaryDateRange === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (summaryDateRange === 'this_week') {
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        return d >= weekStart && d <= now;
      }
      if (summaryDateRange === 'this_month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (summaryDateRange === 'this_year') {
        return d.getFullYear() === now.getFullYear();
      }
      if (summaryDateRange === 'custom') {
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : null;
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : null;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      }
      return true;
    });
  }, [records, summaryTypeFilter, summaryDateRange, customStartDate, customEndDate]);

  // Global stage counts across all records for filter badges & 3-stage chart
  const stageCounts = useMemo(() => {
    const finalCount = records.filter(
      (r) => (r.inspectionType || (r.stage === 'FINISHING_PACKING' ? 'FINAL' : 'INLINE')) === 'FINAL'
    ).length;
    const preFinalCount = records.filter((r) => r.inspectionType === 'PRE_FINAL').length;
    const inlineCount = records.filter(
      (r) => (r.inspectionType || 'INLINE') === 'INLINE' && r.stage !== 'FINISHING_PACKING'
    ).length;
    return {
      FINAL: finalCount,
      PRE_FINAL: preFinalCount,
      INLINE: inlineCount,
      ALL: records.length,
    };
  }, [records]);

  // Nearby Delivery Orders synced from Buyer Order module
  const nearbyDeliveryOrders = useMemo(() => {
    return syncedOrders.map((ord) => {
      const dateStr = ord.shipDate || (ord as any).deliveryDate || ord.logistics?.etdDate || '';
      const d = dateStr ? new Date(dateStr) : null;
      const isValidDate = d && !isNaN(d.getTime());

      let daysRemaining = 999;
      let urgency: 'OVERDUE' | 'IMMINENT' | 'APPROACHING' | 'UPCOMING' | 'SCHEDULED' | 'UNDATED' = 'UNDATED';
      let urgencyLabel = 'Date Pending';
      let urgencyBadgeCls = 'bg-slate-100 text-slate-600 border-slate-200';

      if (isValidDate) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        daysRemaining = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          urgency = 'OVERDUE';
          urgencyLabel = `Overdue (${Math.abs(daysRemaining)}d)`;
          urgencyBadgeCls = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        } else if (daysRemaining === 0) {
          urgency = 'IMMINENT';
          urgencyLabel = 'Due Today';
          urgencyBadgeCls = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        } else if (daysRemaining <= 7) {
          urgency = 'IMMINENT';
          urgencyLabel = `Due in ${daysRemaining}d`;
          urgencyBadgeCls = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
        } else if (daysRemaining <= 21) {
          urgency = 'APPROACHING';
          urgencyLabel = `Due in ${daysRemaining}d`;
          urgencyBadgeCls = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
        } else if (daysRemaining <= 45) {
          urgency = 'UPCOMING';
          urgencyLabel = `In ${daysRemaining}d`;
          urgencyBadgeCls = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
        } else {
          urgency = 'SCHEDULED';
          urgencyLabel = `In ${daysRemaining}d`;
          urgencyBadgeCls = 'bg-slate-50 text-slate-600 border-slate-200 font-medium';
        }
      }

      // Check corresponding Final Inspection
      const finalInspection = records.find((r) => {
        const isFinal = (r.inspectionType || (r.stage === 'FINISHING_PACKING' ? 'FINAL' : 'INLINE')) === 'FINAL';
        if (!isFinal) return false;
        if (r.buyerOrderId && r.buyerOrderId === ord.id) return true;
        if (r.orderNumber) {
          if (r.orderNumber.trim() === ord.orderNumber.trim()) return true;
          const parts = r.orderNumber.split(',').map((s) => s.trim());
          if (parts.includes(ord.orderNumber.trim())) return true;
        }
        if (r.poNumbers && r.poNumbers.some((p) => p.trim() === ord.orderNumber.trim())) return true;
        if (
          r.styleNumber &&
          ord.styleNumber &&
          r.styleNumber.trim().toLowerCase() === ord.styleNumber.trim().toLowerCase() &&
          r.buyer?.toLowerCase().includes(ord.buyerName.toLowerCase().split(' ')[0])
        ) {
          return true;
        }
        return false;
      });

      const inspectionStatus: 'PASSED' | 'FAILED' | 'CONDITIONAL' | 'REQUIRED' | 'IN_PRODUCTION' =
        finalInspection
          ? (finalInspection.status === 'PASSED'
              ? 'PASSED'
              : finalInspection.status === 'REJECTED'
              ? 'FAILED'
              : 'CONDITIONAL')
          : (daysRemaining <= 14 || ord.status === 'READY_AUDIT' || ord.status === 'PACKING')
          ? 'REQUIRED'
          : 'IN_PRODUCTION';

      return {
        order: ord,
        deliveryDate: isValidDate ? d : null,
        deliveryDateStr: dateStr,
        daysRemaining,
        urgency,
        urgencyLabel,
        urgencyBadgeCls,
        finalInspection,
        inspectionStatus,
      };
    }).sort((a, b) => {
      if (!a.deliveryDate && !b.deliveryDate) return 0;
      if (!a.deliveryDate) return 1;
      if (!b.deliveryDate) return -1;
      return a.deliveryDate.getTime() - b.deliveryDate.getTime();
    });
  }, [syncedOrders, records]);

  // Filtered delivery orders
  const filteredDeliveryOrders = useMemo(() => {
    return nearbyDeliveryOrders.filter((item) => {
      if (deliveryFilter === 'URGENT') {
        if (item.urgency !== 'OVERDUE' && item.urgency !== 'IMMINENT') return false;
      } else if (deliveryFilter === 'PENDING') {
        if (item.finalInspection && item.finalInspection.status === 'PASSED') return false;
      } else if (deliveryFilter === 'PASSED') {
        if (!item.finalInspection || item.finalInspection.status !== 'PASSED') return false;
      }

      if (deliverySearch.trim()) {
        const q = deliverySearch.toLowerCase().trim();
        const o = item.order;
        const matches =
          o.orderNumber.toLowerCase().includes(q) ||
          o.buyerName.toLowerCase().includes(q) ||
          o.styleNumber.toLowerCase().includes(q) ||
          (o.styleDescription && o.styleDescription.toLowerCase().includes(q)) ||
          (o.brand && o.brand.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [nearbyDeliveryOrders, deliveryFilter, deliverySearch]);

  // Delivery summary counts
  const deliverySummaryCounts = useMemo(() => {
    const total = nearbyDeliveryOrders.length;
    const urgent = nearbyDeliveryOrders.filter(
      (o) => o.urgency === 'OVERDUE' || o.urgency === 'IMMINENT' || o.daysRemaining <= 14
    ).length;
    const pendingInsp = nearbyDeliveryOrders.filter(
      (o) => !o.finalInspection || o.finalInspection.status !== 'PASSED'
    ).length;
    const passed = nearbyDeliveryOrders.filter(
      (o) => o.finalInspection && o.finalInspection.status === 'PASSED'
    ).length;
    return { total, urgent, pendingInsp, passed };
  }, [nearbyDeliveryOrders]);

  // Handler to start prefilled inspection for an order
  const handleStartInspectionForOrder = (ord: BuyerOrder) => {
    const draftRecord: Partial<InspectionRecord> = {
      id: `insp-draft-${Date.now()}`,
      inspectionCode: `QMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      inspectionType: 'FINAL',
      stage: 'FINISHING_PACKING',
      buyerOrderId: ord.id,
      orderNumber: ord.orderNumber,
      buyer: ord.buyerName,
      styleNumber: ord.styleNumber,
      styleDescription: ord.styleDescription || '',
      orderQuantity: ord.orderQuantity,
      lotQuantity: ord.orderQuantity,
      cartonCount: Math.ceil(ord.orderQuantity / 24),
      packedPercent: 100,
      status: 'PASSED',
      passCount: 315,
      sampleSize: 315,
      defectCount: 0,
      majorDefects: 0,
      minorDefects: 0,
      criticalDefects: 0,
      createdAt: new Date().toISOString(),
      inspectorName: user.name || 'Senior QA Auditor',
      factoryUnit: 'Unit 01 (Dhaka Complex)',
      shift: 'General Shift',
      remarks: `Pre-shipment Final Random Inspection (FRI) for Order ${ord.orderNumber}. Synced from Buyer Order Module. Delivery target: ${ord.shipDate || 'N/A'}.`,
    };
    setSubView({ type: 'add', initialRecord: draftRecord });
  };

  // Summary Aggregates
  const summaryAgg = useMemo(() => {
    const recs = filteredSummaryRecords;
    const totalInspectedQty = recs.reduce((s, r) => s + (r.lotQuantity || 0), 0);
    const totalOrderQty = recs.reduce((s, r) => s + (r.orderQuantity || 0), 0);
    const totalExcessQty = recs.reduce((s, r) => s + (r.excessQuantity || 0), 0);
    const totalShortQty = recs.reduce((s, r) => s + (r.shortQuantity || 0), 0);
    const passCount = recs.filter((r) => r.status === 'PASSED').length;
    const failCount = recs.filter((r) => r.status === 'REJECTED').length;
    const recheckCount = recs.filter((r) => r.status === 'CONDITIONAL_PASS').length;
    const total = recs.length || 1;
    const passRate = ((passCount / total) * 100).toFixed(1);
    const failRate = ((failCount / total) * 100).toFixed(1);
    const recheckRate = ((recheckCount / total) * 100).toFixed(1);

    const totalSampled = recs.reduce((s, r) => s + (r.sampleSize || 0), 0);
    const totalDefects = recs.reduce((s, r) => s + (r.defectCount || 0), 0);
    const criticalDefects = recs.reduce((s, r) => s + (r.criticalDefects || 0), 0);
    const majorDefects = recs.reduce((s, r) => s + (r.majorDefects || 0), 0);
    const minorDefects = recs.reduce((s, r) => s + (r.minorDefects || 0), 0);

    const inlineCount = recs.filter((r) => (r.inspectionType || 'INLINE') === 'INLINE').length;
    const preFinalCount = recs.filter((r) => r.inspectionType === 'PRE_FINAL').length;
    const finalCount = recs.filter((r) => r.inspectionType === 'FINAL').length;

    // Top defects aggregation
    const defectMap = new Map<string, { type: string; severity: string; total: number }>();
    recs.forEach((r) => {
      (r.defects || []).forEach((d) => {
        const key = d.defectType;
        const existing = defectMap.get(key);
        if (existing) {
          existing.total += d.count || 1;
        } else {
          defectMap.set(key, { type: d.defectType, severity: d.severity, total: d.count || 1 });
        }
      });
    });
    const topDefects = Array.from(defectMap.values()).sort((a, b) => b.total - a.total).slice(0, 6);
    const maxDefectCount = topDefects.length > 0 ? topDefects[0].total : 1;

    // Buyer performance
    const buyerMap = new Map<string, { buyer: string; totalQty: number; pass: number; fail: number; recheck: number; count: number }>();
    recs.forEach((r) => {
      const b = r.buyer || 'Unknown';
      const existing = buyerMap.get(b);
      if (existing) {
        existing.totalQty += (r.lotQuantity || 0);
        existing.count++;
        if (r.status === 'PASSED') existing.pass++;
        else if (r.status === 'REJECTED') existing.fail++;
        else if (r.status === 'CONDITIONAL_PASS') existing.recheck++;
      } else {
        buyerMap.set(b, {
          buyer: b,
          totalQty: r.lotQuantity || 0,
          count: 1,
          pass: r.status === 'PASSED' ? 1 : 0,
          fail: r.status === 'REJECTED' ? 1 : 0,
          recheck: r.status === 'CONDITIONAL_PASS' ? 1 : 0,
        });
      }
    });
    const buyerPerformance = Array.from(buyerMap.values()).sort((a, b) => b.totalQty - a.totalQty);

    // Per-record bar chart data (order vs inspected)
    const barChartData = recs.slice(0, 8).map((r) => ({
      label: r.buyer?.split(' ')[0] || r.inspectionCode,
      orderQty: r.orderQuantity || 0,
      inspectedQty: r.lotQuantity || 0,
    }));

    return {
      totalInspectedQty, totalOrderQty, totalExcessQty, totalShortQty,
      passCount, failCount, recheckCount, passRate, failRate, recheckRate,
      totalSampled, totalDefects, criticalDefects, majorDefects, minorDefects,
      inlineCount, preFinalCount, finalCount,
      topDefects, maxDefectCount,
      buyerPerformance, barChartData,
      recordCount: recs.length,
    };
  }, [filteredSummaryRecords]);

  // KPIs (used by list tab and stages tab)
  const passedCount = records.filter((r) => r.status === 'PASSED').length;
  const failedCount = records.filter((r) => r.status === 'REJECTED').length;
  const conditionalCount = records.filter((r) => r.status === 'CONDITIONAL_PASS').length;
  const passRate = ((passedCount / (records.length || 1)) * 100).toFixed(1);
  const totalAuditedPcs = records.reduce((sum, r) => sum + r.sampleSize, 0);
  const criticalHolds = records.filter((r) => r.criticalDefects > 0).length;

  const inlineCount = records.filter((r) => (r.inspectionType || 'INLINE') === 'INLINE').length;
  const preFinalCount = records.filter((r) => r.inspectionType === 'PRE_FINAL').length;
  const finalCount = records.filter((r) => r.inspectionType === 'FINAL').length;

  // Handlers for Save, Edit, Duplicate, Delete
  const handleSaveInspection = async (recordData: InspectionRecord) => {
    const existingIndex = records.findIndex((r) => r.id === recordData.id);
    let updatedList: InspectionRecord[];

    if (existingIndex >= 0) {
      updatedList = records.map((r) => (r.id === recordData.id ? recordData : r));
      showToast(`Updated inspection record ${recordData.inspectionCode}`);
      setSubView({ type: 'details', record: recordData });
    } else {
      updatedList = [recordData, ...records];
      showToast(`Logged new ${recordData.inspectionType || ''} inspection ${recordData.inspectionCode}`);
      setSubView({ type: 'none' });
    }

    setRecords(updatedList);
    if (onUpdateRecords) {
      onUpdateRecords(updatedList);
    }

    // Attempt backend persistence
    try {
      if (existingIndex >= 0) {
        await fetch('/api/qms/inspections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData),
        });
      } else {
        await fetch('/api/qms/inspections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData),
        });
      }
    } catch {
      // Offline fallback
    }
  };

  const handleDuplicateInspection = (rec: InspectionRecord) => {
    const duplicated: InspectionRecord = {
      ...rec,
      id: `insp-dup-${Date.now()}`,
      inspectionCode: `QMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...records];
    setRecords(updated);
    if (onUpdateRecords) onUpdateRecords(updated);
    showToast(`Duplicated audit as ${duplicated.inspectionCode}`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal || deleteModal.records.length === 0) return;
    const deleteIds = deleteModal.records.map((r) => r.id);
    const updated = records.filter((r) => !deleteIds.includes(r.id));
    setRecords(updated);
    if (onUpdateRecords) onUpdateRecords(updated);

    const count = deleteModal.records.length;
    showToast(count === 1 ? `Deleted audit ${deleteModal.records[0].inspectionCode}` : `Deleted ${count} inspection audits`);

    if (subView.type === 'details' && deleteModal.records.some((r) => r.id === subView.record.id)) {
      setSubView({ type: 'none' });
    }

    // Backend deletion
    try {
      for (const r of deleteModal.records) {
        await fetch(`/api/qms/inspections?id=${r.id}`, { method: 'DELETE' });
      }
    } catch {
      // ignore
    }

    setDeleteModal(null);
  };

  // Filtered Records
  const filteredRecords = records.filter((r) => {
    const recType = r.inspectionType || 'INLINE';
    const matchesType = typeFilter === 'ALL' || recType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesBuyer = buyerFilter === 'ALL' || r.buyer === buyerFilter;
    return matchesType && matchesStatus && matchesBuyer;
  });

  // Unique Buyers list for dropdown
  const uniqueBuyers = Array.from(new Set(records.map((r) => r.buyer).filter(Boolean)));

  // Batch Actions - Styled identically to Buyer & Order module
  const batchActions: BatchAction<InspectionRecord>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({ isOpen: true, records: selected });
      },
    },
    {
      label: 'Export Selected (PDF/Excel)',
      variant: 'default',
      icon: <FileDown className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setSelectedRecordsForExport(selected);
        setIsGlobalExportModalOpen(true);
      },
    },
    {
      label: 'Sign-Off & Approve',
      variant: 'success',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        if (!permissions.canApproveQualityGrade) {
          showToast(`RBAC Alert: Only QA Managers and Admins can sign off audits. Your role: ${user.role}`);
          return;
        }
        showToast(`Signed off QA certificates for ${selected.length} inspection lot(s).`);
      },
    },
  ];

  // Column Definitions - Rich, Interactive, with Actions Styled like Buyer & Order module
  const columns: ColumnDef<InspectionRecord>[] = [
    {
      key: 'inspectionCode',
      header: 'Audit Code',
      accessorKey: 'inspectionCode',
      sortable: true,
      accessor: (r) => r.inspectionCode,
      cell: (r) => {
        const isCombined =
          r.isCombinedInspection ||
          (r.poNumbers && r.poNumbers.length > 1) ||
          (r.combinedOrders && r.combinedOrders.length > 1) ||
          (r.orderNumber && r.orderNumber.includes(','));
        const poCount =
          r.combinedOrders?.length ||
          r.poNumbers?.length ||
          (r.orderNumber ? r.orderNumber.split(',').length : 1);

        return (
          <div>
            <span className="font-mono font-bold text-blue-700 text-xs block">{r.inspectionCode}</span>
            {isCombined ? (
              <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                ⚡ Combined ({poCount} POs)
              </span>
            ) : r.orderNumber ? (
              <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[140px]">
                PO: {r.orderNumber}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'inspectionType',
      header: 'Inspection Type',
      accessorKey: 'inspectionType',
      sortable: true,
      accessor: (r) => r.inspectionType || 'INLINE',
      cell: (r) => {
        const typeKey: InspectionType = r.inspectionType || 'INLINE';
        const badge = TYPE_BADGES[typeKey] || TYPE_BADGES.INLINE;
        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </span>
        );
      },
    },
    {
      key: 'styleNumber',
      header: 'Style & Lot',
      accessorKey: 'styleNumber',
      sortable: true,
      accessor: (r) => r.styleNumber,
      cell: (r) => (
        <div className="min-w-0">
          <div className="font-mono font-bold text-slate-900 text-xs truncate max-w-[150px]">
            {r.styleNumber}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
            Lot: {r.lotNumber}
          </div>
          {r.styleDescription && (
            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
              {r.styleDescription}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'buyer',
      header: 'Buyer Brand',
      accessorKey: 'buyer',
      sortable: true,
      accessor: (r) => r.buyer,
      cell: (r) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800">{r.buyer}</span>
          {r.factoryUnit && (
            <span className="text-[10px] text-slate-400 block">{r.factoryUnit.split('(')[0]}</span>
          )}
        </div>
      ),
    },
    {
      key: 'lotQuantity',
      header: 'Order / Inspected (Variance)',
      accessorKey: 'lotQuantity',
      sortable: true,
      accessor: (r) => r.lotQuantity || r.orderQuantity || 0,
      cell: (r) => {
        const ord = r.orderQuantity || 10000;
        const insp = r.lotQuantity || ord;
        const diff = insp - ord;
        const pct = ((diff / ord) * 100).toFixed(1);
        const isExcess = diff > 0;
        const isShort = diff < 0;

        return (
          <div className="text-xs">
            <div className="flex items-center gap-1 font-mono font-bold">
              <span className="text-blue-700">{insp.toLocaleString()}</span>
              <span className="text-slate-400 font-normal">/ {ord.toLocaleString()} pcs</span>
            </div>
            <div className="mt-0.5">
              {isExcess && (
                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  +{diff.toLocaleString()} pcs (+{pct}%) Excess
                </span>
              )}
              {isShort && (
                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {diff.toLocaleString()} pcs ({pct}%) Short
                </span>
              )}
              {!isExcess && !isShort && (
                <span className="text-[10px] text-slate-500 font-medium">
                  100% matched
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'sampleSize',
      header: 'AQL Sampling',
      accessorKey: 'sampleSize',
      sortable: true,
      accessor: (r) => r.sampleSize,
      align: 'right',
      cell: (r) => {
        const pr = ((r.passCount / r.sampleSize) * 100).toFixed(0);
        return (
          <div className="text-right">
            <span className="font-mono font-bold text-slate-900 text-xs block">
              {r.passCount}/{r.sampleSize}
            </span>
            <span className="text-[10px] text-slate-400 block">{pr}% pass rate</span>
          </div>
        );
      },
    },
    {
      key: 'defectCount',
      header: 'Defects (Crit/Maj/Min)',
      accessorKey: 'defectCount',
      sortable: true,
      accessor: (r) => r.defectCount,
      cell: (r) => (
        <div className="flex items-center gap-1 text-[10px] font-mono">
          {r.criticalDefects > 0 && (
            <span className="px-1.5 py-0.5 rounded font-black bg-rose-100 text-rose-800 border border-rose-200">
              Crit:{r.criticalDefects}
            </span>
          )}
          {r.majorDefects > 0 && (
            <span className="px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Maj:{r.majorDefects}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Min:{r.minorDefects}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'QC Verdict',
      accessorKey: 'status',
      sortable: true,
      accessor: (r) => r.status,
      cell: (r) => <InspectionStatusChip status={r.status} />,
    },
    {
      key: 'inspectorName',
      header: 'Auditor & Date',
      accessorKey: 'inspectorName',
      sortable: true,
      accessor: (r) => r.inspectorName,
      cell: (r) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800 truncate max-w-[120px]">
            {r.inspectorName.split('(')[0]}
          </div>
          <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      cell: (r) => (
        <div className="flex items-center justify-center gap-1">
          {/* View Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', record: r })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors cursor-pointer"
            title="View full audit details"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>

          {/* Individual Export Button */}
          <button
            type="button"
            onClick={() => {
              setRecordForSingleExport(r);
              setIsSingleExportModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
            title="Export AQL Certificate (PDF or Excel)"
          >
            <FileDown className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', record: r })}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit audit record"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateInspection(r)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate audit record"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, records: [r] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete audit record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification Matching Buyer & Order Module */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Quality Inspection Audit"
          message={
            deleteModal.records.length === 1
              ? `Are you sure you want to permanently delete audit ${deleteModal.records[0].inspectionCode} for style ${deleteModal.records[0].styleNumber}?`
              : `Are you sure you want to permanently delete these ${deleteModal.records.length} inspection audits?`
          }
          items={deleteModal.records.map((r) => ({
            id: r.id,
            title: r.inspectionCode,
            subtitle: `${r.buyer} • Style: ${r.styleNumber} • ${r.stage}`,
            value: `${r.passCount}/${r.sampleSize} (${r.status})`,
          }))}
          itemTypeLabel="inspection record"
          confirmLabel="Delete Audit"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* TOP MODULE HEADER */}
      {subView.type !== 'details' && (
        <ModuleHeader
          title="Inspections"
          activeView={subView.type !== 'none' ? 'list' : viewMode}
          onViewChange={(mode) => {
            setSubView({ type: 'none' });
            setViewMode(mode);
          }}
          customTabs={[
            { id: 'summary', label: 'Summary' },
            { id: 'list', label: 'Inspection List', count: records.length },
            { id: 'stages', label: '3-Stage Pipeline' },
          ]}
          actions={
            <button
              type="button"
              onClick={() => {
                setSelectedRecordsForExport([]);
                setIsGlobalExportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
              title="Global Export: Inspection Register (PDF or Excel)"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Audits</span>
            </button>
          }
        />
      )}

      {/* RENDER DEDICATED SEPARATE SUB-PAGES */}
      {subView.type === 'details' ? (
        <InspectionDetailsPage
          record={subView.record}
          allRecords={records}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(rec) => setSubView({ type: 'edit', record: rec })}
          onDuplicate={handleDuplicateInspection}
          onDelete={(rec) => setDeleteModal({ isOpen: true, records: [rec] })}
          onExport={(rec) => {
            setRecordForSingleExport(rec);
            setIsSingleExportModalOpen(true);
          }}
          onSelectRecord={(rec) => setSubView({ type: 'details', record: rec })}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <InspectionEntryPage
          mode="add"
          record={subView.initialRecord as InspectionRecord | undefined}
          orders={syncedOrders}
          onSave={handleSaveInspection}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <InspectionEntryPage
          mode="edit"
          record={subView.record}
          orders={syncedOrders}
          onSave={handleSaveInspection}
          onCancel={() => setSubView({ type: 'details', record: subView.record })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY DASHBOARD */}
          {viewMode === 'summary' && (
            <div className="space-y-5 animate-in fade-in duration-200">

              {/* ── Inspection Type / Stage Selector Bar (Default: FINAL) ── */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${
                      summaryTypeFilter === 'FINAL'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
                        : summaryTypeFilter === 'PRE_FINAL'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                        : summaryTypeFilter === 'INLINE'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                        : 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-900/20'
                    }`}>
                      {summaryTypeFilter === 'FINAL' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : summaryTypeFilter === 'PRE_FINAL' ? (
                        <Package className="w-5 h-5" />
                      ) : summaryTypeFilter === 'INLINE' ? (
                        <Layers className="w-5 h-5" />
                      ) : (
                        <BarChart3 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          {summaryTypeFilter === 'FINAL'
                            ? 'Final Inspection (FRI) Summary'
                            : summaryTypeFilter === 'PRE_FINAL'
                            ? 'Pre-Final Inspection Summary'
                            : summaryTypeFilter === 'INLINE'
                            ? 'Inline QC Audit Summary'
                            : 'Consolidated Inspection Summary (All Stages)'}
                        </h2>
                        {summaryTypeFilter === 'FINAL' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Default Focus
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {summaryTypeFilter === 'FINAL'
                          ? 'Pre-shipment Final Random Inspection (FRI) metrics, AQL 2.5 defect rates & delivery readiness.'
                          : summaryTypeFilter === 'PRE_FINAL'
                          ? 'Mid-production & finishing stage packaging, assortment & critical measurement checkpoints.'
                          : summaryTypeFilter === 'INLINE'
                          ? 'Cutting & sewing line quality audits, operator SPI performance & needle control logs.'
                          : 'Combined quality intelligence across all 3 production stages (Inline, Pre-Final, and Final FRI).'}
                      </p>
                    </div>
                  </div>

                  {/* Stage Switcher Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    {[
                      {
                        id: 'FINAL' as SummaryTypeFilter,
                        label: 'Final FRI (Default)',
                        icon: '🏆',
                        count: stageCounts.FINAL,
                        activeCls: 'bg-emerald-600 text-white shadow-sm',
                      },
                      {
                        id: 'PRE_FINAL' as SummaryTypeFilter,
                        label: 'Pre-Final',
                        icon: '📦',
                        count: stageCounts.PRE_FINAL,
                        activeCls: 'bg-amber-600 text-white shadow-sm',
                      },
                      {
                        id: 'INLINE' as SummaryTypeFilter,
                        label: 'Inline QC',
                        icon: '🧵',
                        count: stageCounts.INLINE,
                        activeCls: 'bg-blue-600 text-white shadow-sm',
                      },
                      {
                        id: 'ALL' as SummaryTypeFilter,
                        label: 'All Stages',
                        icon: '🌐',
                        count: stageCounts.ALL,
                        activeCls: 'bg-slate-800 text-white shadow-sm',
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSummaryTypeFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          summaryTypeFilter === tab.id
                            ? tab.activeCls
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            summaryTypeFilter === tab.id
                              ? 'bg-white/25 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range Sub-Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Calendar className="w-4 h-4 text-slate-400 mr-1" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Period:</span>
                  {[
                    { key: 'today' as SummaryDateRange, label: 'Today' },
                    { key: 'this_week' as SummaryDateRange, label: 'This Week' },
                    { key: 'this_month' as SummaryDateRange, label: 'This Month' },
                    { key: 'this_year' as SummaryDateRange, label: 'This Year' },
                    { key: 'all' as SummaryDateRange, label: 'All Time' },
                    { key: 'custom' as SummaryDateRange, label: 'Custom Range' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSummaryDateRange(tab.key)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        summaryDateRange === tab.key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                  {summaryDateRange === 'custom' && (
                    <div className="flex items-center gap-2 ml-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <span className="ml-auto text-[11px] font-mono text-slate-400">
                    {summaryAgg.recordCount} audit{summaryAgg.recordCount !== 1 ? 's' : ''} in {summaryTypeFilter === 'ALL' ? 'all stages' : summaryTypeFilter}
                  </span>
                </div>
              </div>

              {/* ── Primary KPI Cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Total Inspection Qty */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Package className="w-3.5 h-3.5 text-blue-500" />
                    Total Inspected Qty
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900">
                    {summaryAgg.totalInspectedQty > 999 ? `${(summaryAgg.totalInspectedQty / 1000).toFixed(1)}k` : summaryAgg.totalInspectedQty}
                  </div>
                  <div className="text-[10px] text-slate-400">Lot / presented pcs</div>
                </div>

                {/* Total Order Qty */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <ClipboardCheck className="w-3.5 h-3.5 text-indigo-500" />
                    Total Order Qty
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900">
                    {summaryAgg.totalOrderQty > 999 ? `${(summaryAgg.totalOrderQty / 1000).toFixed(1)}k` : summaryAgg.totalOrderQty}
                  </div>
                  <div className="text-[10px] text-slate-400">PO ordered pcs</div>
                </div>

                {/* Excess */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    Total Excess Qty
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-700">
                    +{summaryAgg.totalExcessQty.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-500">Overproduction pcs</div>
                </div>

                {/* Short */}
                <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    Total Short Qty
                  </div>
                  <div className="text-2xl font-black font-mono text-rose-700">
                    -{summaryAgg.totalShortQty.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-rose-500">Shortage pcs</div>
                </div>

                {/* Pass */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Passed
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-800">{summaryAgg.passCount}</div>
                  <div className="text-[10px] text-emerald-500">{summaryAgg.passRate}% rate</div>
                </div>

                {/* Fail + Recheck combined mini card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    Fail / Recheck
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black font-mono text-rose-700">{summaryAgg.failCount}</span>
                    <span className="text-xs text-slate-400">/</span>
                    <span className="text-xl font-black font-mono text-amber-600">{summaryAgg.recheckCount}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{summaryAgg.failRate}% / {summaryAgg.recheckRate}%</div>
                </div>
              </div>

              {/* ── NEARBY DELIVERY ORDERS (SYNCED FROM BUYER ORDER MODULE) ── */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          Nearby Delivery Orders (Synced from Buyer Order Module)
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Synced
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Shipment calendar sorted by delivery proximity. Cross-referenced with Pre-Shipment Final Inspection (FRI) readiness.
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Counters Strip */}
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                      Total: <span className="font-bold font-mono text-slate-900">{deliverySummaryCounts.total}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                      Due ≤ 14d: <span className="font-bold font-mono text-rose-800">{deliverySummaryCounts.urgent}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-medium">
                      Pending FRI: <span className="font-bold font-mono text-amber-800">{deliverySummaryCounts.pendingInsp}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                      FRI Passed: <span className="font-bold font-mono text-emerald-800">{deliverySummaryCounts.passed}</span>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar for Delivery Orders */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'ALL' as const, label: `All Orders (${deliverySummaryCounts.total})` },
                      { id: 'URGENT' as const, label: `Due ≤ 14 Days (${deliverySummaryCounts.urgent})` },
                      { id: 'PENDING' as const, label: `Pending FRI (${deliverySummaryCounts.pendingInsp})` },
                      { id: 'PASSED' as const, label: `FRI Passed (${deliverySummaryCounts.passed})` },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setDeliveryFilter(btn.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          deliveryFilter === btn.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={deliverySearch}
                      onChange={(e) => setDeliverySearch(e.target.value)}
                      placeholder="Filter PO#, buyer, style..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Delivery Orders Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Order / PO & Style</th>
                        <th className="py-2.5 px-3">Buyer & Destination</th>
                        <th className="py-2.5 px-3">Delivery Date & Urgency</th>
                        <th className="py-2.5 px-3 text-right">Order Qty</th>
                        <th className="py-2.5 px-3 text-center">Production Stage</th>
                        <th className="py-2.5 px-3 text-center">Final Inspection (FRI)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDeliveryOrders.length > 0 ? (
                        filteredDeliveryOrders.map((item) => {
                          const ord = item.order;
                          const fi = item.finalInspection;
                          return (
                            <tr
                              key={ord.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              {/* PO & Style */}
                              <td className="py-2.5 px-3">
                                <div className="font-mono font-bold text-blue-700 text-xs">
                                  {ord.orderNumber}
                                </div>
                                <div className="font-mono font-semibold text-slate-900 text-[11px]">
                                  {ord.styleNumber}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                                  {ord.styleDescription}
                                </div>
                                {ord.brand && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    {ord.brand}
                                  </span>
                                )}
                              </td>

                              {/* Buyer & Destination */}
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-800 text-xs">
                                  {ord.buyerName}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {ord.logistics?.portOfDischarge ? (
                                    <span className="truncate max-w-[150px] inline-block">
                                      📍 {ord.logistics.portOfDischarge}
                                    </span>
                                  ) : (
                                    ord.season || 'Standard Export'
                                  )}
                                </div>
                                {ord.qualityStandard && (
                                  <div className="text-[10px] font-mono text-slate-500">
                                    Std: {ord.qualityStandard}
                                  </div>
                                )}
                              </td>

                              {/* Delivery Date & Urgency */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {item.deliveryDate
                                      ? item.deliveryDate.toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })
                                      : item.deliveryDateStr}
                                  </span>
                                </div>
                                <div className="mt-1">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${item.urgencyBadgeCls}`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    {item.urgencyLabel}
                                  </span>
                                </div>
                              </td>

                              {/* Order Qty */}
                              <td className="py-2.5 px-3 text-right">
                                <div className="font-mono font-bold text-slate-900 text-xs">
                                  {ord.orderQuantity.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400">pcs</div>
                              </td>

                              {/* Production Stage */}
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    ord.status === 'READY_AUDIT'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : ord.status === 'PACKING'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : ord.status === 'SEWING'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : ord.status === 'SHIPPED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {ord.status}
                                </span>
                                {ord.productionTracking?.overallProgressPercent !== undefined && (
                                  <div className="mt-1 flex items-center justify-center gap-1">
                                    <div className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                      <div
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{
                                          width: `${ord.productionTracking.overallProgressPercent}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400">
                                      {ord.productionTracking.overallProgressPercent}%
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Final Inspection (FRI) Status */}
                              <td className="py-2.5 px-3 text-center">
                                {fi ? (
                                  <div className="space-y-0.5">
                                    <InspectionStatusChip status={fi.status} />
                                    <button
                                      type="button"
                                      onClick={() => setSubView({ type: 'details', record: fi })}
                                      className="block mx-auto text-[10px] font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      title="View audit dossier"
                                    >
                                      {fi.inspectionCode}
                                    </button>
                                  </div>
                                ) : item.inspectionStatus === 'REQUIRED' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    Final FRI Needed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    In Production
                                  </span>
                                )}
                              </td>

                              {/* Action */}
                              <td className="py-2.5 px-3 text-center">
                                {fi ? (
                                  <button
                                    type="button"
                                    onClick={() => setSubView({ type: 'details', record: fi })}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors cursor-pointer"
                                    title="View completed FRI audit dossier"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Audit</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleStartInspectionForOrder(ord)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-all shadow-xs cursor-pointer"
                                    title={`Initiate Pre-Shipment Final Inspection for ${ord.orderNumber}`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Log FRI</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                            No delivery orders found matching filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Chart Row 1: Quantity Reconciliation + Verdict Donut ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Chart 1: Order vs Inspected Quantity Bar Chart */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        Order vs Inspected Quantity Reconciliation
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">PO order qty compared to presented lot qty per inspection</p>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{summaryAgg.barChartData.length} inspections</span>
                  </div>
                  {summaryAgg.barChartData.length > 0 ? (
                    <div className="relative">
                      <svg viewBox="0 0 700 220" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                        {/* Y-axis labels */}
                        {(() => {
                          const maxVal = Math.max(...summaryAgg.barChartData.flatMap(d => [d.orderQty, d.inspectedQty]), 1);
                          const steps = [0, 0.25, 0.5, 0.75, 1];
                          return steps.map((s, i) => {
                            const val = Math.round(maxVal * s);
                            const y = 200 - (s * 170);
                            return (
                              <g key={i}>
                                <text x="45" y={y + 4} textAnchor="end" className="text-[9px] fill-slate-400" style={{fontSize: '9px'}}>{val > 999 ? `${(val/1000).toFixed(0)}k` : val}</text>
                                <line x1="52" y1={y} x2="690" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
                              </g>
                            );
                          });
                        })()}
                        {/* Bars */}
                        {(() => {
                          const maxVal = Math.max(...summaryAgg.barChartData.flatMap(d => [d.orderQty, d.inspectedQty]), 1);
                          const barWidth = 28;
                          const groupWidth = 80;
                          const startX = 70;
                          return summaryAgg.barChartData.map((d, i) => {
                            const x = startX + i * groupWidth;
                            const orderH = (d.orderQty / maxVal) * 170;
                            const inspH = (d.inspectedQty / maxVal) * 170;
                            return (
                              <g key={i}>
                                <rect x={x} y={200 - orderH} width={barWidth} height={orderH} rx="4" fill="#93c5fd" opacity="0.7">
                                  <title>Order: {d.orderQty.toLocaleString()}</title>
                                </rect>
                                <rect x={x + barWidth + 3} y={200 - inspH} width={barWidth} height={inspH} rx="4" fill="#3b82f6">
                                  <title>Inspected: {d.inspectedQty.toLocaleString()}</title>
                                </rect>
                                <text x={x + barWidth} y={215} textAnchor="middle" className="text-[8px] fill-slate-500" style={{fontSize: '8px'}}>{d.label}</text>
                              </g>
                            );
                          });
                        })()}
                      </svg>
                      {/* Legend */}
                      <div className="flex items-center gap-4 justify-center mt-1">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-300 opacity-70" /><span className="text-[10px] text-slate-500">Order Qty</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-[10px] text-slate-500">Inspected Qty</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-xs text-slate-400">No inspection records for selected date range</div>
                  )}
                </div>

                {/* Chart 2: Quality Verdict Donut Ring */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-500" />
                      Verdict Distribution
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">ISO 2859-1</span>
                  </div>
                  {/* SVG Donut */}
                  <div className="flex flex-col items-center">
                    <svg viewBox="0 0 160 160" className="w-36 h-36">
                      {(() => {
                        const total = summaryAgg.passCount + summaryAgg.failCount + summaryAgg.recheckCount || 1;
                        const passAngle = (summaryAgg.passCount / total) * 360;
                        const failAngle = (summaryAgg.failCount / total) * 360;
                        const recheckAngle = (summaryAgg.recheckCount / total) * 360;
                        const r = 60;
                        const cx = 80, cy = 80;
                        const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
                        const arcPath = (startDeg: number, endDeg: number) => {
                          if (endDeg - startDeg >= 359.99) {
                            // Full circle
                            return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
                          }
                          const start = toRad(startDeg);
                          const end = toRad(endDeg);
                          const large = endDeg - startDeg > 180 ? 1 : 0;
                          return `M ${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)}`;
                        };
                        let offset = 0;
                        const segments = [
                          { angle: passAngle, color: '#10b981', label: 'Pass' },
                          { angle: failAngle, color: '#f43f5e', label: 'Fail' },
                          { angle: recheckAngle, color: '#f59e0b', label: 'Recheck' },
                        ].filter(s => s.angle > 0);
                        return (
                          <>
                            {segments.map((seg, i) => {
                              const start = offset;
                              const end = offset + seg.angle;
                              offset = end;
                              return (
                                <path
                                  key={i}
                                  d={arcPath(start, end)}
                                  fill="none"
                                  stroke={seg.color}
                                  strokeWidth="18"
                                  strokeLinecap="round"
                                />
                              );
                            })}
                            <text x={cx} y={cy - 6} textAnchor="middle" className="text-[22px] font-black fill-slate-900" style={{fontSize: '22px', fontWeight: 900}}>
                              {summaryAgg.recordCount}
                            </text>
                            <text x={cx} y={cy + 10} textAnchor="middle" className="text-[9px] fill-slate-400" style={{fontSize: '9px'}}>Total Audits</text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  {/* Legend */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                      <div className="text-[10px] text-emerald-700 font-bold">Passed</div>
                      <div className="text-xl font-black font-mono text-emerald-900">{summaryAgg.passCount}</div>
                      <div className="text-[10px] text-emerald-500">{summaryAgg.passRate}%</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
                      <div className="text-[10px] text-amber-700 font-bold">Recheck</div>
                      <div className="text-xl font-black font-mono text-amber-900">{summaryAgg.recheckCount}</div>
                      <div className="text-[10px] text-amber-500">{summaryAgg.recheckRate}%</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200">
                      <div className="text-[10px] text-rose-700 font-bold">Rejected</div>
                      <div className="text-xl font-black font-mono text-rose-900">{summaryAgg.failCount}</div>
                      <div className="text-[10px] text-rose-500">{summaryAgg.failRate}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Chart Row 2: Defect Severity + 3-Stage Pipeline ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Chart 3: AQL Defect Severity Distribution */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      AQL Defect Severity Breakdown
                    </h3>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{summaryAgg.totalDefects} total</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Critical', count: summaryAgg.criticalDefects, color: 'bg-rose-500', trackColor: 'bg-rose-100', textColor: 'text-rose-700' },
                      { label: 'Major', count: summaryAgg.majorDefects, color: 'bg-amber-500', trackColor: 'bg-amber-100', textColor: 'text-amber-700' },
                      { label: 'Minor', count: summaryAgg.minorDefects, color: 'bg-blue-400', trackColor: 'bg-blue-100', textColor: 'text-blue-700' },
                    ].map((s) => {
                      const pct = summaryAgg.totalDefects > 0 ? (s.count / summaryAgg.totalDefects) * 100 : 0;
                      return (
                        <div key={s.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-bold ${s.textColor}`}>{s.label}</span>
                            <span className="font-mono font-bold text-slate-700">{s.count} <span className="text-slate-400 font-normal">({pct.toFixed(1)}%)</span></span>
                          </div>
                          <div className={`h-3 rounded-full ${s.trackColor} overflow-hidden`}>
                            <div
                              className={`h-full rounded-full ${s.color} transition-all duration-500`}
                              style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Sampled count */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Total Sampled: <b className="text-slate-600 font-mono">{summaryAgg.totalSampled.toLocaleString()} pcs</b></span>
                    <span>DPU: <b className="text-slate-600 font-mono">{summaryAgg.totalSampled > 0 ? ((summaryAgg.totalDefects / summaryAgg.totalSampled) * 100).toFixed(2) : '0.00'}%</b></span>
                  </div>
                </div>

                {/* Chart 4: 3-Stage Inspection Pipeline */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        3-Stage Inspection Pipeline
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Click any stage to filter summary metrics</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('stages')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Pipeline View →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        type: 'INLINE' as SummaryTypeFilter,
                        label: 'Inline Inspection',
                        icon: '🧵',
                        count: stageCounts.INLINE,
                        color: 'bg-blue-500',
                        trackColor: 'bg-blue-100',
                        badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
                      },
                      {
                        type: 'PRE_FINAL' as SummaryTypeFilter,
                        label: 'Pre-Final Inspection',
                        icon: '📦',
                        count: stageCounts.PRE_FINAL,
                        color: 'bg-amber-500',
                        trackColor: 'bg-amber-100',
                        badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
                      },
                      {
                        type: 'FINAL' as SummaryTypeFilter,
                        label: 'Final Inspection (FRI)',
                        icon: '🏆',
                        count: stageCounts.FINAL,
                        color: 'bg-emerald-500',
                        trackColor: 'bg-emerald-100',
                        badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                      },
                    ].map((stage) => {
                      const isSelected = summaryTypeFilter === stage.type;
                      const pct = stageCounts.ALL > 0 ? (stage.count / stageCounts.ALL) * 100 : 0;
                      return (
                        <div
                          key={stage.label}
                          onClick={() => setSummaryTypeFilter(stage.type)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          } space-y-2`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{stage.icon}</span>
                              <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                              {isSelected && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                                  Active Filter
                                </span>
                              )}
                            </div>
                            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${stage.badgeColor}`}>
                              {stage.count} Audits
                            </span>
                          </div>
                          <div className={`h-2.5 rounded-full ${stage.trackColor} overflow-hidden`}>
                            <div
                              className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                              style={{ width: `${Math.max(pct, pct > 0 ? 5 : 0)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{isSelected ? 'Currently focused stage' : 'Click to focus summary'}</span>
                            <span>{pct.toFixed(1)}% of total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Chart Row 3: Top Defects Pareto + Buyer Performance ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Chart 5: Top Garment Defects Ranking (Pareto) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rose-500" />
                      Top Garment Defects (Pareto)
                    </h3>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">Top {summaryAgg.topDefects.length}</span>
                  </div>
                  {summaryAgg.topDefects.length > 0 ? (
                    <div className="space-y-2.5">
                      {summaryAgg.topDefects.map((d, i) => {
                        const pct = (d.total / summaryAgg.maxDefectCount) * 100;
                        const severityColors: Record<string, string> = {
                          CRITICAL: 'bg-rose-500',
                          MAJOR: 'bg-amber-500',
                          MINOR: 'bg-blue-400',
                        };
                        const severityBadge: Record<string, string> = {
                          CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
                          MAJOR: 'bg-amber-100 text-amber-700 border-amber-200',
                          MINOR: 'bg-blue-100 text-blue-700 border-blue-200',
                        };
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-slate-500 font-mono text-[10px] w-4">#{i + 1}</span>
                                <span className="font-semibold text-slate-800 truncate">{d.type}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${severityBadge[d.severity] || severityBadge.MINOR}`}>
                                  {d.severity}
                                </span>
                                <span className="font-mono font-bold text-slate-700">{d.total}</span>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${severityColors[d.severity] || 'bg-slate-400'} transition-all duration-500`}
                                style={{ width: `${Math.max(pct, 5)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">No defects recorded in selected range</div>
                  )}
                </div>

                {/* Chart 6: Buyer Quality & Volume Performance */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      Buyer Quality Performance
                    </h3>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{summaryAgg.buyerPerformance.length} buyers</span>
                  </div>
                  {summaryAgg.buyerPerformance.length > 0 ? (
                    <div className="space-y-2">
                      {summaryAgg.buyerPerformance.map((bp, i) => {
                        const bpTotal = bp.pass + bp.fail + bp.recheck || 1;
                        const bpPassRate = ((bp.pass / bpTotal) * 100).toFixed(0);
                        return (
                          <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-slate-800 truncate">{bp.buyer}</span>
                              <span className="text-[10px] font-mono text-slate-500">{bp.totalQty > 999 ? `${(bp.totalQty/1000).toFixed(1)}k` : bp.totalQty} pcs</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Stacked mini bar */}
                              <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden flex">
                                {bp.pass > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(bp.pass / bpTotal) * 100}%` }} />}
                                {bp.recheck > 0 && <div className="h-full bg-amber-400" style={{ width: `${(bp.recheck / bpTotal) * 100}%` }} />}
                                {bp.fail > 0 && <div className="h-full bg-rose-500" style={{ width: `${(bp.fail / bpTotal) * 100}%` }} />}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                                <span className="font-bold text-emerald-700">{bp.pass}P</span>
                                <span className="text-slate-300">|</span>
                                <span className="font-bold text-amber-600">{bp.recheck}R</span>
                                <span className="text-slate-300">|</span>
                                <span className="font-bold text-rose-600">{bp.fail}F</span>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                Number(bpPassRate) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                Number(bpPassRate) >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>{bpPassRate}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">No buyer data in selected range</div>
                  )}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setSubView({ type: 'add' })}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Log New Quality Inspection
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INSPECTION LIST (MATCHING BUYER & ORDER TABLE AND BUTTON DESIGNS) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="qms-inspections-table"
                data={filteredRecords}
                columns={columns}
                searchPlaceholder="Search audit code, style#, PO#, buyer, auditor, or lot..."
                searchableKeys={[
                  'inspectionCode',
                  'styleNumber',
                  'orderNumber',
                  'buyer',
                  'lotNumber',
                  'inspectorName',
                  'stage',
                ]}
                secondaryAction={
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Inspection Type Filter */}
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Inspection Types</option>
                      <option value="INLINE">🧵 Inline Inspection</option>
                      <option value="PRE_FINAL">📦 Pre-Final Inspection</option>
                      <option value="FINAL">🏆 Final Inspection (FRI)</option>
                    </select>

                    {/* Verdict Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Verdicts</option>
                      <option value="PASSED">Passed</option>
                      <option value="CONDITIONAL_PASS">Conditional Pass</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Buyer Filter */}
                    <select
                      value={buyerFilter}
                      onChange={(e) => setBuyerFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[160px]"
                    >
                      <option value="ALL">All Buyers</option>
                      {uniqueBuyers.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Inspection</span>
                  </button>
                }
                onExport={(exportRecords) => {
                  setSelectedRecordsForExport(exportRecords.length < records.length ? exportRecords : []);
                  setIsGlobalExportModalOpen(true);
                }}
                batchActions={batchActions}
              />
            </div>
          )}

          {/* TAB 3: STAGES BREAKDOWN & PIPELINE */}
          {viewMode === 'stages' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      End-to-End Inspection Pipeline (Inline ➔ Pre-Final ➔ Final)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tracking garment quality audits across all production checkpoints
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Inspection</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Inline Stage Column */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🧵</span>
                        <span className="font-bold text-xs text-slate-900">Inline Inspection</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {inlineCount} Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Checks during cutting lay and active sewing lines. Monitored for stitches per inch (SPI), seam strength, machine tension, and needle control.
                    </p>
                    <div className="space-y-2 pt-2">
                      {records
                        .filter((r) => (r.inspectionType || 'INLINE') === 'INLINE')
                        .slice(0, 4)
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => setSubView({ type: 'details', record: r })}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-2xs transition-all cursor-pointer text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-blue-700">{r.inspectionCode}</span>
                              <InspectionStatusChip status={r.status} />
                            </div>
                            <div className="font-semibold text-slate-800 truncate">{r.styleNumber}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{r.buyer} • {r.passCount}/{r.sampleSize} pass</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Pre-Final Stage Column */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📦</span>
                        <span className="font-bold text-xs text-slate-900">Pre-Final Inspection</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {preFinalCount} Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Conducted when order is 50%–80% packed. Verifies polybags, size & color assortment, folding specs, carton packing, and workmanship prior to final buyer audit.
                    </p>
                    <div className="space-y-2 pt-2">
                      {records
                        .filter((r) => r.inspectionType === 'PRE_FINAL')
                        .slice(0, 4)
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => setSubView({ type: 'details', record: r })}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:shadow-2xs transition-all cursor-pointer text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-amber-700">{r.inspectionCode}</span>
                              <InspectionStatusChip status={r.status} />
                            </div>
                            <div className="font-semibold text-slate-800 truncate">{r.styleNumber}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{r.buyer} • {r.packedPercent || 70}% packed</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Final Stage Column */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏆</span>
                        <span className="font-bold text-xs text-slate-900">Final Random Inspection (FRI)</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {finalCount} Records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Conducted at 100% finished & ≥80% packed. Official buyer acceptance audit with AQL 2.5 Level II sampling, 10-side carton drop test, 100% metal detection, and shipping marks check.
                    </p>
                    <div className="space-y-2 pt-2">
                      {records
                        .filter((r) => r.inspectionType === 'FINAL')
                        .slice(0, 4)
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => setSubView({ type: 'details', record: r })}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-2xs transition-all cursor-pointer text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-emerald-700">{r.inspectionCode}</span>
                              <InspectionStatusChip status={r.status} />
                            </div>
                            <div className="font-semibold text-slate-800 truncate">{r.styleNumber}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{r.buyer} • 100% packed • {r.passCount}/{r.sampleSize} pass</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Global Export Modal: PDF or Excel */}
      <InspectionExportModal
        isOpen={isGlobalExportModalOpen}
        onClose={() => {
          setIsGlobalExportModalOpen(false);
          setSelectedRecordsForExport([]);
        }}
        allRecords={records}
        selectedRecords={selectedRecordsForExport}
      />

      {/* Individual Record Export Modal: PDF or Excel */}
      <InspectionSingleExportModal
        isOpen={isSingleExportModalOpen}
        onClose={() => {
          setIsSingleExportModalOpen(false);
          setRecordForSingleExport(null);
        }}
        record={recordForSingleExport}
      />
    </div>
  );
}
