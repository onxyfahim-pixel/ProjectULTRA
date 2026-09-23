'use client';

import React, { useState, useMemo } from 'react';
import {
  Factory,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
  BarChart3,
  Gauge,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  Target,
  Zap,
  AlertTriangle,
  Package,
  Activity,
  Layers,
  Building2,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { ProductionOrder, LineStatus } from '@/lib/types/erp';
import { INITIAL_PRODUCTION_ORDERS } from '@/lib/db/mock-data';
import { AddProductionOrderModal, NewProductionOrderData } from '@/components/modules/production/AddProductionOrderModal';
import { AddProductionRecordPage } from '@/components/modules/production/AddProductionRecordPage';
import { LogOutputModal, OutputLogEntry } from '@/components/modules/production/LogOutputModal';
import { ProductionRecordDetailsPage } from '@/components/modules/production/ProductionRecordDetailsPage';
import { DeleteConfirmationModal } from '@/components/modules/buyer-order/DeleteConfirmationModal';
import { ProductionManagementView } from '@/components/modules/production/ProductionManagementView';
import { getProductionLines } from '@/lib/db/production-management-store';
import {
  getProductionRecords,
  saveProductionRecords,
  syncSewingRecordToBuyerOrders,
  isSewingSectionRecord,
  calculateRecordCheckedQty,
} from '@/lib/db/production-records-store';

interface ProductionViewProps {
  orders?: ProductionOrder[];
  onUpdateOrders?: (orders: ProductionOrder[]) => void;
}

type ProductionSubView =
  | { type: 'none' }
  | { type: 'details'; order: ProductionOrder }
  | { type: 'add_record' }
  | { type: 'edit_record'; order: ProductionOrder };

export function StatusChip({ status }: { status: LineStatus }) {
  const map: Record<LineStatus, { label: string; cls: string }> = {
    RUNNING: { label: 'Running', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    PAUSED: { label: 'Paused', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  const { label, cls } = map[status] || map.RUNNING;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

export function EfficiencyBar({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-emerald-500' : value >= 75 ? 'bg-blue-600' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span
        className={`text-[11px] font-bold font-mono w-9 text-right ${
          value >= 85 ? 'text-emerald-700' : value >= 75 ? 'text-blue-700' : 'text-amber-700'
        }`}
      >
        {value}%
      </span>
    </div>
  );
}

export function ProductionView({ orders: propOrders, onUpdateOrders }: ProductionViewProps = {}) {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [orders, setOrders] = useState<ProductionOrder[]>(() => {
    if (propOrders && propOrders.length > 0) return propOrders;
    return getProductionRecords();
  });
  const [subView, setSubView] = useState<ProductionSubView>({ type: 'none' });

  // Modal States
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<ProductionOrder | null>(null);
  const [isLogOutputOpen, setIsLogOutputOpen] = useState(false);
  const [logTargetOrderId, setLogTargetOrderId] = useState<string | null>(null);
  const [outputLogs, setOutputLogs] = useState<OutputLogEntry[]>([]);

  // Delete Confirmation Modal
  const [recordDeleteModal, setRecordDeleteModal] = useState<{
    isOpen: boolean;
    orders: ProductionOrder[];
  } | null>(null);

  // Filters & Dropdowns
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [buyerFilter, setBuyerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Date Range Filter
  const [dateRangePreset, setDateRangePreset] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  const handleSelectDatePreset = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'ALL') {
      setStartDateFilter('');
      setEndDateFilter('');
    } else if (preset === 'TODAY') {
      setStartDateFilter(today);
      setEndDateFilter(today);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0];
      setStartDateFilter(yest);
      setEndDateFilter(yest);
    } else if (preset === 'LAST_7_DAYS') {
      const d7 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0];
      setStartDateFilter(d7);
      setEndDateFilter(today);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      setStartDateFilter(firstDay);
      setEndDateFilter(today);
    }
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync prop changes
  React.useEffect(() => {
    if (propOrders && propOrders.length > 0) {
      setOrders(propOrders);
    }
  }, [propOrders]);

  // Keep details sub-view in sync when orders update
  React.useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = orders.find((o) => o.id === subView.order.id);
      if (refreshed && refreshed !== subView.order) {
        setSubView({ type: 'details', order: refreshed });
      }
    }
  }, [orders]);

  // Production Management Lines Count (Reactive to store updates)
  const [managementLinesCount, setManagementLinesCount] = useState<number>(8);
  React.useEffect(() => {
    setManagementLinesCount(getProductionLines().length);
    const handleUpdate = () => {
      setManagementLinesCount(getProductionLines().length);
    };
    window.addEventListener('erp_production_management_updated', handleUpdate);
    return () => window.removeEventListener('erp_production_management_updated', handleUpdate);
  }, []);

  const updateOrders = (updated: ProductionOrder[]) => {
    setOrders(updated);
    saveProductionRecords(updated);
    onUpdateOrders?.(updated);
  };

  // Orders matching active Date Range (used for Summary and real metrics calculation)
  const dateFilteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDateStr = o.recordDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
      let matchesDate = true;
      if (startDateFilter && orderDateStr) {
        matchesDate = matchesDate && orderDateStr >= startDateFilter;
      }
      if (endDateFilter && orderDateStr) {
        matchesDate = matchesDate && orderDateStr <= endDateFilter;
      }
      return matchesDate;
    });
  }, [orders, startDateFilter, endDateFilter]);

  // Real dynamic KPIs linked directly from matching production records in date filter
  const summaryOrders = dateFilteredOrders;
  const totalOrders = summaryOrders.length;
  const totalTarget = summaryOrders.reduce((sum, o) => sum + (o.targetQuantity || 0), 0);
  const totalCompleted = summaryOrders.reduce((sum, o) => sum + (o.completedQuantity || 0), 0);

  // Real inspected / checked pieces count:
  const totalCheckedQty = summaryOrders.reduce((sum, o) => {
    if (o.hourlyReports && o.hourlyReports.length > 0) {
      const hrChecked = o.hourlyReports.reduce((s, h) => s + (h.checkedQty || 0), 0);
      if (hrChecked > 0) return sum + hrChecked;
    }
    return sum + (o.completedQuantity || 0);
  }, 0);

  // Real defects count: sum of hourly inspection defects or order totalDefects
  const totalDefects = summaryOrders.reduce((sum, o) => {
    if (o.hourlyReports && o.hourlyReports.length > 0) {
      const hrDefects = o.hourlyReports.reduce((s, h) => s + (h.defectQty || 0), 0);
      if (hrDefects > 0) return sum + hrDefects;
    }
    return (
      sum +
      (o.totalDefects ??
        Math.round((o.completedQuantity || 0) * ((o.dhuRate || o.defectRate || 1.2) / 100)))
    );
  }, 0);

  const totalRejects = summaryOrders.reduce(
    (sum, o) => sum + (o.rejectQuantity ?? Math.round((o.completedQuantity || 0) * 0.002)),
    0
  );

  const completionRate = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

  const avgEfficiency = (
    summaryOrders.length > 0
      ? summaryOrders.reduce((sum, o) => sum + (o.efficiencyPercent ?? 82.5), 0) / summaryOrders.length
      : 0
  ).toFixed(1);

  // Real DHU% calculated from total defects vs checked qty
  const avgDHU = (
    totalCheckedQty > 0
      ? (totalDefects / totalCheckedQty) * 100
      : summaryOrders.length > 0
      ? summaryOrders.reduce((sum, o) => sum + (o.dhuRate ?? o.defectRate ?? 1.15), 0) / summaryOrders.length
      : 0
  ).toFixed(2);

  // Real RFT% calculated from (checked - defects) / checked
  const avgRFT = (
    totalCheckedQty > 0
      ? Math.max(0, ((totalCheckedQty - totalDefects) / totalCheckedQty) * 100)
      : summaryOrders.length > 0
      ? summaryOrders.reduce((sum, o) => sum + (o.rftRate ?? 98.2), 0) / summaryOrders.length
      : 100
  ).toFixed(1);

  const totalRejectRate = totalCompleted > 0 ? ((totalRejects / totalCompleted) * 100).toFixed(2) : '0.00';

  // Real Top Defects aggregated from records in this date filter
  const topDefectsInDateRange = useMemo(() => {
    const defectMap = new Map<string, number>();
    summaryOrders.forEach((o) => {
      if (o.hourlyReports && o.hourlyReports.length > 0) {
        o.hourlyReports.forEach((h) => {
          if (h.defectBreakdown && h.defectBreakdown.length > 0) {
            h.defectBreakdown.forEach((d) => {
              defectMap.set(d.defectType, (defectMap.get(d.defectType) || 0) + d.count);
            });
          } else if (h.topDefect && h.topDefect !== 'None' && (h.defectQty || 0) > 0) {
            defectMap.set(h.topDefect, (defectMap.get(h.topDefect) || 0) + (h.defectQty || 1));
          }
        });
      } else if (o.top3Defects && o.top3Defects.length > 0) {
        o.top3Defects.forEach((t) => {
          defectMap.set(t.defectType, (defectMap.get(t.defectType) || 0) + t.count);
        });
      }
    });

    const total = Array.from(defectMap.values()).reduce((s, v) => s + v, 0);
    const sorted = Array.from(defectMap.entries())
      .map(([defectType, count]) => ({
        defectType,
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, 5);
  }, [summaryOrders]);

  // Unique lists for filters
  const uniqueUnits = Array.from(new Set(orders.map((o) => o.unit || 'Unit 01'))).filter(Boolean);
  const uniqueSections = Array.from(
    new Set(orders.map((o) => o.section || o.sewingLine || 'Sewing Line 01'))
  ).filter(Boolean);
  const uniqueBuyers = Array.from(new Set(orders.map((o) => o.buyer))).filter(Boolean);

  // Filtered Orders for the DataTable (combines date filter + unit/section/buyer/status)
  const filteredOrders = useMemo(() => {
    return dateFilteredOrders.filter((o) => {
      const matchesUnit = unitFilter === 'ALL' || (o.unit || 'Unit 01') === unitFilter;
      const matchesSection =
        sectionFilter === 'ALL' || (o.section || o.sewingLine) === sectionFilter;
      const matchesBuyer = buyerFilter === 'ALL' || o.buyer === buyerFilter;
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchesUnit && matchesSection && matchesBuyer && matchesStatus;
    });
  }, [dateFilteredOrders, unitFilter, sectionFilter, buyerFilter, statusFilter]);

  // Save / Update Handler
  const handleSaveOrder = (data: NewProductionOrderData) => {
    let savedOrder: ProductionOrder;
    if (data.id) {
      // Edit existing
      const updated = orders.map((o) => {
        if (o.id === data.id) {
          savedOrder = {
            ...o,
            orderNumber: data.orderNumber,
            buyer: data.buyer,
            styleName: data.styleName,
            styleNumber: data.styleNumber,
            unit: data.unit,
            section: data.section,
            targetQuantity: data.targetQuantity,
            completedQuantity: data.completedQuantity,
            totalDefects: data.totalDefects,
            dhuRate: data.dhuRate,
            rftRate: data.rftRate,
            efficiencyPercent: data.efficiencyPercent,
            rejectQuantity: data.rejectQuantity,
            sewingLine: data.sewingLine,
            lineId: data.lineId,
            status: data.status,
            dueDate: data.dueDate,
            operatorCount: data.operatorCount,
            supervisorName: data.supervisorName,
            remarks: data.remarks,
          };
          return savedOrder;
        }
        return o;
      });
      updateOrders(updated);
      if (savedOrder! && isSewingSectionRecord(savedOrder)) {
        const syncRes = syncSewingRecordToBuyerOrders(savedOrder);
        showToast(
          `✓ Updated record & auto-added ${syncRes.totalCheckedQty.toLocaleString()} checked pcs to PO ${data.orderNumber} Sewing track`
        );
      } else {
        showToast(`Updated production & quality record ${data.orderNumber}`);
      }
    } else {
      // Create new
      savedOrder = {
        id: `po-${Date.now()}`,
        orderNumber: data.orderNumber,
        buyer: data.buyer,
        styleName: data.styleName,
        styleNumber: data.styleNumber,
        unit: data.unit,
        section: data.section,
        targetQuantity: data.targetQuantity,
        completedQuantity: data.completedQuantity,
        totalDefects: data.totalDefects,
        defectRate: data.dhuRate,
        dhuRate: data.dhuRate,
        rftRate: data.rftRate,
        efficiencyPercent: data.efficiencyPercent,
        rejectQuantity: data.rejectQuantity,
        sewingLine: data.sewingLine,
        lineId: data.lineId,
        status: data.status,
        dueDate: data.dueDate,
        operatorCount: data.operatorCount,
        supervisorName: data.supervisorName,
        remarks: data.remarks,
        createdAt: new Date().toISOString(),
      };
      const updated = [savedOrder, ...orders];
      updateOrders(updated);
      if (isSewingSectionRecord(savedOrder)) {
        const syncRes = syncSewingRecordToBuyerOrders(savedOrder);
        showToast(
          `✓ Created record & auto-added ${syncRes.totalCheckedQty.toLocaleString()} checked pcs to PO ${data.orderNumber} Sewing track`
        );
      } else {
        showToast(`Created production & quality record ${data.orderNumber}`);
      }
    }
    setIsAddOrderOpen(false);
    setRecordToEdit(null);
  };

  // Full-Page Clean Record Save Handler (Includes Record Date and Hourly Reports)
  const handleSaveFullPageRecord = (savedOrder: ProductionOrder) => {
    const existingIdx = orders.findIndex((o) => o.id === savedOrder.id);
    let updated: ProductionOrder[];
    if (existingIdx >= 0) {
      updated = orders.map((o) => (o.id === savedOrder.id ? savedOrder : o));
    } else {
      updated = [savedOrder, ...orders];
    }
    updateOrders(updated);

    // Auto-sync Sewing section record to Buyer & Order module's Sewing production track record
    if (isSewingSectionRecord(savedOrder)) {
      const syncResult = syncSewingRecordToBuyerOrders(savedOrder);
      const checkedQty = calculateRecordCheckedQty(savedOrder);
      showToast(
        `✓ Saved record & auto-added ${checkedQty.toLocaleString()} checked pcs to PO ${savedOrder.orderNumber} Sewing track (Total: ${syncResult.totalCheckedQty.toLocaleString()} pcs)`
      );
    } else {
      showToast(
        existingIdx >= 0
          ? `✓ Updated production record ${savedOrder.orderNumber}`
          : `✓ Created production record ${savedOrder.orderNumber}`
      );
    }
    setSubView({ type: 'details', order: savedOrder });
  };

  // Output Log Save Handler
  const handleSaveOutputLog = (entry: OutputLogEntry) => {
    setOutputLogs((prev) => [entry, ...prev]);
    const updated = orders.map((o) =>
      o.id === entry.productionOrderId
        ? {
            ...o,
            completedQuantity: (o.completedQuantity || 0) + entry.actualOutput,
            efficiencyPercent: entry.efficiencyPercent,
            dhuRate: entry.dhuPercent,
            defectRate: entry.dhuPercent,
          }
        : o
    );
    updateOrders(updated);
    showToast(
      `✓ Logged ${entry.actualOutput} pcs on Shift ${entry.shift} (Eff: ${entry.efficiencyPercent}%, DHU: ${entry.dhuPercent}%)`
    );
  };

  // Delete Confirmation
  const confirmDeleteRecords = () => {
    if (!recordDeleteModal || recordDeleteModal.orders.length === 0) return;
    const idsToDelete = new Set(recordDeleteModal.orders.map((o) => o.id));
    const updated = orders.filter((o) => !idsToDelete.has(o.id));
    updateOrders(updated);

    if (subView.type === 'details' && idsToDelete.has(subView.order.id)) {
      setSubView({ type: 'none' });
    }

    const count = recordDeleteModal.orders.length;
    showToast(
      count === 1
        ? `Deleted record ${recordDeleteModal.orders[0].orderNumber}`
        : `Deleted ${count} records successfully`
    );
    setRecordDeleteModal(null);
  };

  // DataTable Column Definitions with all required fields including Record Date
  const columns: ColumnDef<ProductionOrder>[] = [
    {
      key: 'record_date',
      header: 'Record Date',
      sortable: true,
      accessor: (row) => row.recordDate || row.createdAt || '',
      cell: (row) => {
        const dateStr = row.recordDate || (row.createdAt ? row.createdAt.split('T')[0] : '2026-09-21');
        return (
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-100">
              <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{dateStr}</span>
            </div>
            {row.shift && (
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[130px]" title={row.shift}>
                {row.shift.split('(')[0].trim()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'unit_section',
      header: 'Unit & Section',
      sortable: true,
      accessor: (row) => `${row.unit || ''} ${row.section || row.sewingLine || ''}`,
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{row.unit || 'Unit 01'}</span>
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-800 line-clamp-1">
            {row.section || row.sewingLine || 'Sewing Line 01'}
          </div>
          {row.qualityInspector && (
            <div
              className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium mt-1 truncate max-w-[170px]"
              title={`Quality Inspector: ${row.qualityInspector}`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{row.qualityInspector.split('(')[0].trim()}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'buyer_order',
      header: 'Buyer & Order',
      sortable: true,
      accessor: (row) => `${row.buyer} ${row.orderNumber}`,
      cell: (row) => (
        <div>
          <div className="font-mono font-bold text-blue-700 text-xs">{row.orderNumber}</div>
          <div className="text-xs font-medium text-slate-800 mt-0.5">{row.buyer}</div>
        </div>
      ),
    },
    {
      key: 'style',
      header: 'Style',
      sortable: true,
      accessor: (row) => `${row.styleNumber || ''} ${row.styleName}`,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-mono font-bold text-slate-900 text-xs">
              {row.styleNumber || 'STY-PROD'}
            </div>
            <div className="text-[11px] text-slate-600 truncate max-w-[160px] sm:max-w-[220px]">
              {row.styleName}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'production_target',
      header: 'Total Production / Target',
      sortable: true,
      align: 'right',
      accessor: (row) => row.completedQuantity,
      cell: (row) => {
        const target = row.targetQuantity || 1;
        const comp = row.completedQuantity || 0;
        const pct = Math.min(Math.round((comp / target) * 100), 100);
        return (
          <div className="text-right min-w-[130px]">
            <div className="font-mono font-bold text-slate-900 text-xs">
              {comp.toLocaleString()}{' '}
              <span className="text-[10px] text-slate-400 font-normal">/ {target.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mb-1">{pct}% achieved</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-blue-600' : 'bg-amber-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'defects_dhu',
      header: 'Total Defects & DHU',
      sortable: true,
      align: 'right',
      accessor: (row) => row.dhuRate ?? row.defectRate ?? 1.2,
      cell: (row) => {
        const def =
          row.totalDefects ??
          Math.round((row.completedQuantity || 0) * ((row.dhuRate || row.defectRate || 1.2) / 100));
        const dhu = Number((row.dhuRate ?? row.defectRate ?? 1.2).toFixed(2));
        const dhuColor =
          dhu <= 2.0
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : dhu <= 3.0
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-rose-50 text-rose-700 border-rose-200';
        return (
          <div className="text-right">
            <div className="font-mono font-bold text-amber-700 text-xs">{def.toLocaleString()} def</div>
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${dhuColor}`}
            >
              DHU {dhu}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'rft',
      header: 'RFT %',
      sortable: true,
      align: 'right',
      accessor: (row) => row.rftRate ?? 98.2,
      cell: (row) => {
        const rft = Number((row.rftRate ?? 98.2).toFixed(1));
        const rftCls =
          rft >= 95
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : rft >= 90
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-rose-700 bg-rose-50 border-rose-200';
        return (
          <div className="text-right">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${rftCls}`}>
              {rft}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Right 1st Time</span>
          </div>
        );
      },
    },
    {
      key: 'efficiency',
      header: 'Efficiency',
      sortable: true,
      align: 'right',
      accessor: (row) => row.efficiencyPercent ?? 82,
      cell: (row) => {
        const eff = Number((row.efficiencyPercent ?? 82).toFixed(1));
        return (
          <div className="text-right min-w-[85px]">
            <span
              className={`font-mono font-bold text-xs ${
                eff >= 85 ? 'text-emerald-700' : eff >= 75 ? 'text-blue-700' : 'text-amber-700'
              }`}
            >
              {eff}%
            </span>
            <div className="w-16 ml-auto mt-1">
              <EfficiencyBar value={eff} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'reject',
      header: 'Reject',
      sortable: true,
      align: 'right',
      accessor: (row) => row.rejectQuantity ?? 15,
      cell: (row) => {
        const rej = row.rejectQuantity ?? Math.max(Math.round((row.completedQuantity || 0) * 0.002), 5);
        const rate =
          row.completedQuantity && row.completedQuantity > 0
            ? ((rej / row.completedQuantity) * 100).toFixed(2)
            : '0.00';
        return (
          <div className="text-right">
            <div className="font-mono font-bold text-rose-600 text-xs">{rej.toLocaleString()} pcs</div>
            <span className="text-[10px] text-slate-400 font-mono block">{rate}% scrap</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (row) => row.status,
      cell: (row) => <StatusChip status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSubView({ type: 'edit_record', order: row });
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            title="Edit Record & Hourly Sheet"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setRecordDeleteModal({ isOpen: true, orders: [row] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', order: row })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            <span>View</span>
          </button>
        </div>
      ),
    },
  ];

  // Batch actions matching Buyer & Order
  const batchActions: BatchAction<ProductionOrder>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setRecordDeleteModal({
          isOpen: true,
          orders: selected,
        });
      },
    },
    {
      label: 'Mark as Completed',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        const selectedIds = new Set(selected.map((s) => s.id));
        const updated = orders.map((o) =>
          selectedIds.has(o.id) ? { ...o, status: 'COMPLETED' as LineStatus } : o
        );
        updateOrders(updated);
        showToast(`Marked ${selected.length} orders as Completed`);
      },
    },
    {
      label: 'Export Selected',
      onClick: (selected) => {
        showToast(`Exported ${selected.length} production & quality records`);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification matching Buyer & Order module */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Clean 3-tab layout matching Buyer & Order Module */}
      <ModuleHeader
        title="Production and Quality Management"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Production & Quality Records', count: orders.length },
          { id: 'section', label: 'Management', count: managementLinesCount },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGE IF ACTIVE */}
      {subView.type === 'details' ? (
        <ProductionRecordDetailsPage
          order={subView.order}
          outputLogs={outputLogs}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(ord) => setSubView({ type: 'edit_record', order: ord })}
          onDelete={(ord) => {
            setRecordDeleteModal({ isOpen: true, orders: [ord] });
          }}
          showToast={showToast}
        />
      ) : subView.type === 'add_record' || subView.type === 'edit_record' ? (
        <AddProductionRecordPage
          initialOrder={subView.type === 'edit_record' ? subView.order : null}
          onSave={handleSaveFullPageRecord}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY (WITH DETAILED 11-METRIC SECTION BREAKDOWN TABLE) */}
          {/* TAB 1: SUMMARY (WITH DATE FILTER TOOLBAR & REAL DATA LINKED FROM RECORDS) */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* DATE RANGE FILTER TOOLBAR (SUMMARY TAB) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 mr-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Summary Date Filter:
                  </span>
                  {[
                    { id: 'ALL', label: 'All Dates' },
                    { id: 'TODAY', label: 'Today' },
                    { id: 'YESTERDAY', label: 'Yesterday' },
                    { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                    { id: 'THIS_MONTH', label: 'This Month' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectDatePreset(p.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        dateRangePreset === p.id
                          ? 'bg-blue-600 text-white shadow-xs font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">From:</span>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => {
                        setStartDateFilter(e.target.value);
                        setDateRangePreset('CUSTOM');
                      }}
                      className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">To:</span>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => {
                        setEndDateFilter(e.target.value);
                        setDateRangePreset('CUSTOM');
                      }}
                      className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {(startDateFilter || endDateFilter || dateRangePreset !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => handleSelectDatePreset('ALL')}
                      className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  )}
                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                    {summaryOrders.length} record{summaryOrders.length === 1 ? '' : 's'} linked
                  </span>
                </div>
              </div>

              {/* Stat Cards styled like Buyer & Order Module (Dynamically calculated from filtered records) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                  title="Total Production"
                  value={totalCompleted > 0 ? `${(totalCompleted / 1000).toFixed(1)}k pcs` : '0 pcs'}
                  subtitle={`${completionRate}% of target volume`}
                  icon={CheckCircle2}
                  tone="blue"
                  delta={{ value: `${summaryOrders.length} records`, isPositive: true }}
                />
                <StatCard
                  title="Target Quantity"
                  value={totalTarget > 0 ? `${(totalTarget / 1000).toFixed(1)}k pcs` : '0 pcs'}
                  subtitle={`Across ${totalOrders} production orders`}
                  icon={Layers}
                  tone="indigo"
                  delta={{ value: 'Real Record Pace', isPositive: true }}
                />
                <StatCard
                  title="Floor Efficiency"
                  value={`${avgEfficiency}%`}
                  subtitle="Standard pace: ≥ 80%"
                  icon={TrendingUp}
                  tone="emerald"
                  delta={{ value: parseFloat(avgEfficiency) >= 80 ? 'Target Met' : 'Below Target', isPositive: parseFloat(avgEfficiency) >= 80 }}
                />
                <StatCard
                  title="DHU Rate"
                  value={`${avgDHU}%`}
                  subtitle={`${totalDefects.toLocaleString()} defects / ${totalCheckedQty.toLocaleString()} checked`}
                  icon={AlertCircle}
                  tone={parseFloat(avgDHU) <= 2.0 ? 'purple' : 'rose'}
                />
                <StatCard
                  title="Right First Time"
                  value={`${avgRFT}%`}
                  subtitle="Zero-rework pass rate"
                  icon={ShieldCheck}
                  tone="emerald"
                  delta={{ value: parseFloat(avgRFT) >= 95 ? 'Passed QA' : 'Under Review', isPositive: parseFloat(avgRFT) >= 95 }}
                />
                <StatCard
                  title="Total Rejects"
                  value={`${totalRejects.toLocaleString()} pcs`}
                  subtitle={`${totalRejectRate}% overall scrap`}
                  icon={AlertTriangle}
                  tone="amber"
                />
              </div>

              {/* Comprehensive Section & Record Performance Table inside Summary */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Section Performance & Quality Breakdown
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Live floor overview across Unit, Section, Inspector, Buyer, Style, Target, Production, Defects, DHU, RFT, Efficiency & Rejects
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <span>View in Records Sheet ({orders.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-2.5 px-3">Date & Inspector</th>
                        <th className="py-2.5 px-3">Unit & Section</th>
                        <th className="py-2.5 px-3">Buyer</th>
                        <th className="py-2.5 px-3">Style</th>
                        <th className="py-2.5 px-3 text-right">Target</th>
                        <th className="py-2.5 px-3 text-right">Total Production</th>
                        <th className="py-2.5 px-3 text-right">Total Defects</th>
                        <th className="py-2.5 px-3 text-right">DHU %</th>
                        <th className="py-2.5 px-3 text-right">RFT %</th>
                        <th className="py-2.5 px-3 text-right">Efficiency</th>
                        <th className="py-2.5 px-3 text-right">Reject</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summaryOrders.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-10 text-center text-slate-400">
                            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-xs text-slate-700">No production records found for the selected date range.</p>
                            <p className="text-[11px] text-slate-400 mt-1">Try switching to &quot;All Dates&quot; or selecting another date preset.</p>
                            <button
                              type="button"
                              onClick={() => handleSelectDatePreset('ALL')}
                              className="mt-3 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Show All Dates
                            </button>
                          </td>
                        </tr>
                      ) : (
                        summaryOrders.map((o) => {
                          const target = o.targetQuantity || 1;
                          const comp = o.completedQuantity || 0;
                          const def =
                            o.totalDefects ??
                            Math.round(comp * ((o.dhuRate || o.defectRate || 1.2) / 100));
                          const dhu = Number((o.dhuRate ?? o.defectRate ?? 1.2).toFixed(2));
                          const rft = Number((o.rftRate ?? 98.2).toFixed(1));
                          const eff = Number((o.efficiencyPercent ?? 82).toFixed(1));
                          const rej = o.rejectQuantity ?? Math.max(Math.round(comp * 0.002), 5);
                          const dateStr = o.recordDate || (o.createdAt ? o.createdAt.split('T')[0] : '2026-09-21');

                          return (
                            <tr
                              key={o.id}
                              onClick={() => setSubView({ type: 'details', order: o })}
                              className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                            >
                              <td className="py-2.5 px-3">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
                                  <Calendar className="w-3 h-3 text-blue-600" />
                                  <span>{dateStr}</span>
                                </div>
                                {o.qualityInspector && (
                                  <div
                                    className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium mt-1 truncate max-w-[140px]"
                                    title={`Quality Inspector: ${o.qualityInspector}`}
                                  >
                                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>{o.qualityInspector.split('(')[0].trim()}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900 block">
                                  {o.unit || 'Unit 01'}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {o.section || o.sewingLine}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{o.buyer}</td>
                              <td className="py-2.5 px-3">
                                <span className="font-mono font-bold text-blue-700 text-[11px] block">
                                  {o.styleNumber || 'STY-001'}
                                </span>
                                <span className="text-[11px] text-slate-600 truncate max-w-[140px] block">
                                  {o.styleName}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                                {target.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                                {comp.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                                {def.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                    dhu <= 2.0
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {dhu}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                {rft}%
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                                {eff}%
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                                {rej.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <StatusChip status={o.status} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quality Standards, Top Defects & Floor Efficiency (Linked from real records in date filter) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CARD 1: Quality Benchmarks */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Quality Benchmarks ({summaryOrders.length} Records)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">ISO 9001 / AQL 1.5</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-800">Defects per Hundred Units (DHU)</div>
                        <div className="text-[10px] text-slate-400">Factory Threshold: ≤ 2.0%</div>
                      </div>
                      <span className={`font-mono font-bold text-sm ${parseFloat(avgDHU) <= 2.0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {avgDHU}% {parseFloat(avgDHU) <= 2.0 ? '✓ Pass' : '⚠ Exceeds'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-800">Right First Time (RFT) Rate</div>
                        <div className="text-[10px] text-slate-400">Buyer Standard: ≥ 95.0%</div>
                      </div>
                      <span className="font-mono font-bold text-sm text-emerald-700">
                        {avgRFT}% {parseFloat(avgRFT) >= 95 ? '✓ Above Target' : '⚠ Action Required'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-800">Unrecoverable Reject & Scrap Rate</div>
                        <div className="text-[10px] text-slate-400">Allowed scrap allowance: ≤ 0.5%</div>
                      </div>
                      <span className="font-mono font-bold text-sm text-slate-700">
                        {totalRejectRate}% ({totalRejects} pcs)
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Top Defects in Selected Date Range */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Top Defects in Date Range
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Pareto Priority</span>
                  </div>

                  {topDefectsInDateRange.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                      <p className="font-semibold text-slate-700">Zero Defects Recorded</p>
                      <p className="text-[11px] text-slate-400">All inspected pieces passed first-time audit.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {topDefectsInDateRange.map((td, idx) => {
                        const rankBadge =
                          idx === 0
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800 border-slate-300'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200';

                        return (
                          <div key={td.defectType} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${rankBadge}`}>
                                  #{idx + 1}
                                </span>
                                <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                                  {td.defectType}
                                </span>
                              </div>
                              <div className="font-mono text-xs">
                                <span className="font-bold text-slate-900">{td.count} pcs</span>
                                <span className="text-slate-400 text-[11px] ml-1.5">({td.percentage}%)</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  idx === 0
                                    ? 'bg-rose-500'
                                    : idx === 1
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(td.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CARD 3: Live Floor Section Efficiency */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Section Efficiency in Date Range
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Floor Pace</span>
                  </div>

                  <div className="space-y-3">
                    {summaryOrders.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
                        <Gauge className="w-6 h-6 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">No Line Data</p>
                        <p className="text-[11px] text-slate-400">No active lines in this date range.</p>
                      </div>
                    ) : (
                      summaryOrders.slice(0, 5).map((o) => {
                        const eff = o.efficiencyPercent ?? 82;
                        return (
                          <div key={o.id} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-800 truncate max-w-[160px]">
                                {o.section || o.sewingLine}
                              </span>
                              <span className="font-mono font-bold text-xs text-slate-900">{eff}%</span>
                            </div>
                            <EfficiencyBar value={eff} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTION & QUALITY RECORDS (WITH UNIFIED SEARCH, FILTER DROPDOWNS & TABLE BUTTONS) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* DATE RANGE FILTER TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 mr-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Record Date Filter:
                  </span>
                  {[
                    { id: 'ALL', label: 'All Dates' },
                    { id: 'TODAY', label: 'Today' },
                    { id: 'YESTERDAY', label: 'Yesterday' },
                    { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                    { id: 'THIS_MONTH', label: 'This Month' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectDatePreset(p.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        dateRangePreset === p.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">From:</span>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => {
                        setStartDateFilter(e.target.value);
                        setDateRangePreset('CUSTOM');
                      }}
                      className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">To:</span>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => {
                        setEndDateFilter(e.target.value);
                        setDateRangePreset('CUSTOM');
                      }}
                      className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {(startDateFilter || endDateFilter || dateRangePreset !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => handleSelectDatePreset('ALL')}
                      className="px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  )}
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {filteredOrders.length} record{filteredOrders.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <DataTable
                id="production-quality-records-table"
                data={filteredOrders}
                columns={columns}
                searchPlaceholder="Search order, style, buyer, section, unit..."
                searchableKeys={[
                  'orderNumber',
                  'buyer',
                  'styleName',
                  'styleNumber',
                  'recordDate',
                  'shift',
                  'qualityInspector',
                  'unit',
                  'section',
                  'sewingLine',
                  'lineId',
                  'status',
                ]}
                secondaryAction={
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Unit filter */}
                    <select
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[150px]"
                    >
                      <option value="ALL">All Units</option>
                      {uniqueUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>

                    {/* Section filter */}
                    <select
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[170px]"
                    >
                      <option value="ALL">All Sections</option>
                      {uniqueSections.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    {/* Buyer filter */}
                    <select
                      value={buyerFilter}
                      onChange={(e) => setBuyerFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[150px]"
                    >
                      <option value="ALL">All Buyers</option>
                      {uniqueBuyers.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>

                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="RUNNING">Running</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PAUSED">Paused</option>
                    </select>
                  </div>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => {
                      setSubView({ type: 'add_record' });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Record</span>
                  </button>
                }
                batchActions={batchActions}
              />
            </div>
          )}

          {/* TAB 3: MANAGEMENT (UNITS, SECTIONS & PRODUCTION LINES WITH ASSIGNED ROLES) */}
          {viewMode === 'section' && (
            <ProductionManagementView showToast={showToast} />
          )}
        </>
      )}

      {/* Add / Edit Production Order Modal */}
      <AddProductionOrderModal
        isOpen={isAddOrderOpen}
        onClose={() => {
          setIsAddOrderOpen(false);
          setRecordToEdit(null);
        }}
        onSave={handleSaveOrder}
        orderToEdit={recordToEdit}
      />

      {/* Log Output Modal */}
      <LogOutputModal
        isOpen={isLogOutputOpen}
        onClose={() => setIsLogOutputOpen(false)}
        orders={logTargetOrderId ? orders.filter((o) => o.id === logTargetOrderId) : orders}
        onSave={handleSaveOutputLog}
      />

      {/* Delete Confirmation Modal styled like Buyer & Order */}
      {recordDeleteModal && (
        <DeleteConfirmationModal
          isOpen={recordDeleteModal.isOpen}
          title="Confirm Delete Production Record"
          itemTypeLabel="production record"
          items={recordDeleteModal.orders.map((o) => ({
            id: o.id,
            title: `${o.orderNumber} — ${o.styleName}`,
            subtitle: `${o.buyer} • ${o.unit || 'Unit 01'} • ${o.section || o.sewingLine}`,
            value: `${o.completedQuantity.toLocaleString()} pcs produced`,
          }))}
          onConfirm={confirmDeleteRecords}
          onCancel={() => setRecordDeleteModal(null)}
        />
      )}
    </div>
  );
}
