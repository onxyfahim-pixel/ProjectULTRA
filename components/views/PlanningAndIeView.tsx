'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Building2,
  ShoppingBag,
  Calendar,
  Gauge,
  Layers,
  Clock,
  Target,
  Package,
  ShieldCheck,
  Calculator,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Printer,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { ModuleHeader, ModuleTabOption } from '@/components/ui/ModuleHeader';
import { BuyerOrder } from '@/lib/types/modules';
import { ProductionOrder } from '@/lib/types/erp';
import {
  StyleOperationBulletin,
  ProductionPlanSchedule,
  TimeMotionStudy,
  OperationBulletinItem,
  ProductionOrderPlan,
  ProductionLineMaster,
  OperationMasterItem,
  MachineMasterItem,
  OperatorMasterItem,
  SkillMatrixItem,
  SkillLevelGrade,
  CapacityPlanningRecord,
  LinePlanningRecord,
  ManpowerPlanningRecord,
  MethodStudyRecord,
  MotionStudyRecord,
  TargetSettingRecord,
  ProductionExecutionRecord,
  HourlyMonitoringRecord,
  WipManagementRecord,
  ProductionLossRecord,
  DowntimeManagementRecord,
  ProductionQualityLink,
  ProductionReworkRecord,
  ProductionRejectionRecord,
  ProductionFollowUpRecord,
  KaizenImprovementRecord,
  ProductionAlertItem,
  UniversalAuditRecord,
} from '@/lib/types/planning-ie';
import {
  getStoredBulletins,
  saveStoredBulletins,
  getStoredSchedules,
  saveStoredSchedules,
  getStoredTimeStudies,
  saveStoredTimeStudies,
  getStoredLines,
  saveStoredLines,
  getStoredMachines,
  saveStoredMachines,
  getStoredOperators,
  saveStoredOperators,
  getStoredSkillMatrix,
  saveStoredSkillMatrix,
  getStoredOperations,
  saveStoredOperations,
  getStoredProductionOrders,
  saveStoredProductionOrders,
  getStoredCapacityPlans,
  saveStoredCapacityPlans,
  getStoredLinePlans,
  saveStoredLinePlans,
  getStoredManpowerPlans,
  saveStoredManpowerPlans,
  getStoredMethodStudies,
  saveStoredMethodStudies,
  getStoredMotionStudies,
  saveStoredMotionStudies,
  getStoredHourlyMonitoring,
  saveStoredHourlyMonitoring,
  getStoredWipTracking,
  saveStoredWipTracking,
  getStoredProductionLosses,
  saveStoredProductionLosses,
  getStoredDowntimeRecords,
  saveStoredDowntimeRecords,
  getStoredQualityLinks,
  saveStoredQualityLinks,
  getStoredReworkRecords,
  saveStoredReworkRecords,
  getStoredRejectionRecords,
  saveStoredRejectionRecords,
  getStoredFollowUpRecords,
  saveStoredFollowUpRecords,
  getStoredKaizenRecords,
  saveStoredKaizenRecords,
  getStoredProductionAlerts,
  saveStoredProductionAlerts,
  getStoredAuditLogs,
  saveStoredAuditLogs,
  addAuditLog,
  INITIAL_FACTORIES,
  INITIAL_TARGET_SETTINGS,
  INITIAL_PRODUCTION_EXECUTIONS,
} from '@/lib/db/planning-ie-store';

import { PlanningDashboardTab } from '@/components/modules/planning-ie/PlanningDashboardTab';
import { MasterDataTab } from '@/components/modules/planning-ie/MasterDataTab';
import { ProductionOrdersTab } from '@/components/modules/planning-ie/ProductionOrdersTab';
import { ProductionPlanningTab } from '@/components/modules/planning-ie/ProductionPlanningTab';
import { CapacityLineTab } from '@/components/modules/planning-ie/CapacityLineTab';
import { OperationBulletinTab } from '@/components/modules/planning-ie/OperationBulletinTab';
import { WorkStudyTab } from '@/components/modules/planning-ie/WorkStudyTab';
import { ExecutionHourlyTab } from '@/components/modules/planning-ie/ExecutionHourlyTab';
import { WipLossTab } from '@/components/modules/planning-ie/WipLossTab';
import { QualityLinkTab } from '@/components/modules/planning-ie/QualityLinkTab';
import { CalculatorsKaizenTab } from '@/components/modules/planning-ie/CalculatorsKaizenTab';
import { ReportsAuditTab } from '@/components/modules/planning-ie/ReportsAuditTab';

interface PlanningAndIeViewProps {
  orders?: BuyerOrder[];
  productionOrders?: ProductionOrder[];
}

export type PlanningTabId =
  | 'dashboard'
  | 'masters'
  | 'orders'
  | 'planning'
  | 'capacity_line'
  | 'bulletin_balance'
  | 'work_study'
  | 'execution_hourly'
  | 'wip_loss'
  | 'quality_link'
  | 'calculators_kaizen'
  | 'reports_audit';

export function PlanningAndIeView({
  orders: propBuyerOrders = [],
  productionOrders: propProdOrders = [],
}: PlanningAndIeViewProps) {
  const [activeTab, setActiveTab] = useState<PlanningTabId>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core Data States
  const [bulletins, setBulletins] = useState<StyleOperationBulletin[]>(getStoredBulletins);
  const [schedules, setSchedules] = useState<ProductionPlanSchedule[]>(getStoredSchedules);
  const [timeStudies, setTimeStudies] = useState<TimeMotionStudy[]>(getStoredTimeStudies);
  const [selectedBulletinId, setSelectedBulletinId] = useState<string>(bulletins[0]?.id || 'ob-1');

  // Master Data States
  const [lines, setLines] = useState<ProductionLineMaster[]>(getStoredLines);
  const [machines, setMachines] = useState<MachineMasterItem[]>(getStoredMachines);
  const [operators, setOperators] = useState<OperatorMasterItem[]>(getStoredOperators);
  const [skillMatrix, setSkillMatrix] = useState<SkillMatrixItem[]>(getStoredSkillMatrix);
  const [operations, setOperations] = useState<OperationMasterItem[]>(getStoredOperations);

  // Production Orders & Planning States
  const [productionOrders, setProductionOrders] = useState<ProductionOrderPlan[]>(getStoredProductionOrders);
  const [capacityPlans, setCapacityPlans] = useState<CapacityPlanningRecord[]>(getStoredCapacityPlans);
  const [linePlans, setLinePlans] = useState<LinePlanningRecord[]>(getStoredLinePlans);
  const [manpowerPlans, setManpowerPlans] = useState<ManpowerPlanningRecord[]>(getStoredManpowerPlans);
  const [methodStudies, setMethodStudies] = useState<MethodStudyRecord[]>(getStoredMethodStudies);
  const [motionStudies, setMotionStudies] = useState<MotionStudyRecord[]>(getStoredMotionStudies);
  const [hourlyRecords, setHourlyRecords] = useState<HourlyMonitoringRecord[]>(getStoredHourlyMonitoring);
  const [wipRecords, setWipRecords] = useState<WipManagementRecord[]>(getStoredWipTracking);
  const [losses, setLosses] = useState<ProductionLossRecord[]>(getStoredProductionLosses);
  const [downtimes, setDowntimes] = useState<DowntimeManagementRecord[]>(getStoredDowntimeRecords);
  const [qualityLinks, setQualityLinks] = useState<ProductionQualityLink[]>(getStoredQualityLinks);
  const [reworks, setReworks] = useState<ProductionReworkRecord[]>(getStoredReworkRecords);
  const [rejections, setRejections] = useState<ProductionRejectionRecord[]>(getStoredRejectionRecords);
  const [followups, setFollowups] = useState<ProductionFollowUpRecord[]>(getStoredFollowUpRecords);
  const [kaizens, setKaizens] = useState<KaizenImprovementRecord[]>(getStoredKaizenRecords);
  const [alerts, setAlerts] = useState<ProductionAlertItem[]>(getStoredProductionAlerts);
  const [auditLogs, setAuditLogs] = useState<UniversalAuditRecord[]>(getStoredAuditLogs);

  // Helper toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync state with storage updates
  useEffect(() => {
    const handleUpdate = () => {
      setBulletins(getStoredBulletins());
      setSchedules(getStoredSchedules());
      setTimeStudies(getStoredTimeStudies());
      setLines(getStoredLines());
      setMachines(getStoredMachines());
      setOperators(getStoredOperators());
      setSkillMatrix(getStoredSkillMatrix());
      setOperations(getStoredOperations());
      setProductionOrders(getStoredProductionOrders());
      setCapacityPlans(getStoredCapacityPlans());
      setLinePlans(getStoredLinePlans());
      setManpowerPlans(getStoredManpowerPlans());
      setMethodStudies(getStoredMethodStudies());
      setMotionStudies(getStoredMotionStudies());
      setHourlyRecords(getStoredHourlyMonitoring());
      setWipRecords(getStoredWipTracking());
      setLosses(getStoredProductionLosses());
      setDowntimes(getStoredDowntimeRecords());
      setQualityLinks(getStoredQualityLinks());
      setReworks(getStoredReworkRecords());
      setRejections(getStoredRejectionRecords());
      setFollowups(getStoredFollowUpRecords());
      setKaizens(getStoredKaizenRecords());
      setAlerts(getStoredProductionAlerts());
      setAuditLogs(getStoredAuditLogs());
    };

    window.addEventListener('erp_bulletins_updated', handleUpdate);
    window.addEventListener('erp_schedules_updated', handleUpdate);
    window.addEventListener('erp_timestudies_updated', handleUpdate);
    window.addEventListener('erp_production_orders_updated', handleUpdate);
    window.addEventListener('erp_hourly_updated', handleUpdate);
    window.addEventListener('erp_wip_updated', handleUpdate);
    window.addEventListener('erp_kaizen_updated', handleUpdate);
    window.addEventListener('erp_audit_updated', handleUpdate);

    return () => {
      window.removeEventListener('erp_bulletins_updated', handleUpdate);
      window.removeEventListener('erp_schedules_updated', handleUpdate);
      window.removeEventListener('erp_timestudies_updated', handleUpdate);
      window.removeEventListener('erp_production_orders_updated', handleUpdate);
      window.removeEventListener('erp_hourly_updated', handleUpdate);
      window.removeEventListener('erp_wip_updated', handleUpdate);
      window.removeEventListener('erp_kaizen_updated', handleUpdate);
      window.removeEventListener('erp_audit_updated', handleUpdate);
    };
  }, []);

  // Universal CSV Export Utility
  const handleExportCsv = (filename: string, rows: any[]) => {
    if (!rows || rows.length === 0) {
      showToast('No records available to export.');
      return;
    }
    const headers = Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== 'object');
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('EXPORT', 'UniversalExport', filename, `Exported ${rows.length} rows to ${filename}`);
    showToast(`Successfully exported ${rows.length} records to ${filename}`);
  };

  // Universal Print Utility
  const handlePrint = (title: string = 'Production & IE Report') => {
    window.print();
    addAuditLog('EXPORT', 'PrintReport', title, `Sent print preview for ${title}`);
  };

  // Operation Bulletin Handlers
  const handleUpdateBulletin = (updated: StyleOperationBulletin) => {
    const next = bulletins.map((b) => (b.id === updated.id ? updated : b));
    setBulletins(next);
    saveStoredBulletins(next);
    addAuditLog('UPDATE', 'StyleOperationBulletin', updated.styleNumber, `Updated OB ${updated.styleNumber}`);
    showToast(`Operation Bulletin for ${updated.styleNumber} updated successfully.`);
  };

  const handleDuplicateBulletin = (source: StyleOperationBulletin) => {
    const copyId = `ob-${Date.now()}`;
    const newBulletin: StyleOperationBulletin = {
      ...source,
      id: copyId,
      styleNumber: `${source.styleNumber}-COPY`,
      styleDescription: `${source.styleDescription} (Duplicate)`,
      version: 'v1.0',
      approvalStatus: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [newBulletin, ...bulletins];
    setBulletins(next);
    saveStoredBulletins(next);
    setSelectedBulletinId(copyId);
    addAuditLog('DUPLICATE', 'StyleOperationBulletin', newBulletin.styleNumber, `Cloned from ${source.styleNumber}`);
    showToast(`Duplicated OB ${source.styleNumber} as ${newBulletin.styleNumber}`);
  };

  const handleAddOperationToBulletin = (bulletinId: string, op: OperationBulletinItem) => {
    const target = bulletins.find((b) => b.id === bulletinId);
    if (!target) return;
    const updatedOps = [...target.operations, op];
    const totalSmv = Math.round(updatedOps.reduce((acc, o) => acc + o.smv, 0) * 100) / 100;
    const totalAllocatedOps = updatedOps.reduce((acc, o) => acc + o.allocatedOperators, 0);

    const updatedBulletin: StyleOperationBulletin = {
      ...target,
      totalSmv,
      targetLineOperators: totalAllocatedOps,
      operations: updatedOps,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateBulletin(updatedBulletin);
  };

  const handleDeleteOperationFromBulletin = (bulletinId: string, opId: string) => {
    const target = bulletins.find((b) => b.id === bulletinId);
    if (!target) return;
    const updatedOps = target.operations
      .filter((o) => o.id !== opId)
      .map((o, idx) => ({ ...o, seqNumber: idx + 1 }));
    const totalSmv = Math.round(updatedOps.reduce((acc, o) => acc + o.smv, 0) * 100) / 100;
    const totalAllocatedOps = updatedOps.reduce((acc, o) => acc + o.allocatedOperators, 0);

    const updatedBulletin: StyleOperationBulletin = {
      ...target,
      totalSmv,
      targetLineOperators: totalAllocatedOps,
      operations: updatedOps,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateBulletin(updatedBulletin);
  };

  // Production Order Handlers
  const handleAddProductionOrder = (newOrder: ProductionOrderPlan) => {
    const next = [newOrder, ...productionOrders];
    setProductionOrders(next);
    saveStoredProductionOrders(next);
    addAuditLog('CREATE', 'ProductionOrderPlan', newOrder.orderNumber, `Added PO ${newOrder.po} (${newOrder.style})`);
    showToast(`Production Order ${newOrder.orderNumber} created successfully.`);
  };

  const handleUpdateProductionOrder = (updated: ProductionOrderPlan) => {
    const next = productionOrders.map((o) => (o.id === updated.id ? updated : o));
    setProductionOrders(next);
    saveStoredProductionOrders(next);
    addAuditLog('UPDATE', 'ProductionOrderPlan', updated.orderNumber, `Modified PO ${updated.po}`);
    showToast(`Production Order ${updated.orderNumber} updated.`);
  };

  const handleDeleteProductionOrder = (id: string) => {
    const orderToDelete = productionOrders.find((o) => o.id === id);
    const next = productionOrders.filter((o) => o.id !== id);
    setProductionOrders(next);
    saveStoredProductionOrders(next);
    if (orderToDelete) {
      addAuditLog('DELETE', 'ProductionOrderPlan', orderToDelete.orderNumber, `Removed PO ${orderToDelete.po}`);
    }
    showToast('Production order removed.');
  };

  const handleDuplicateProductionOrder = (order: ProductionOrderPlan) => {
    const duplicate: ProductionOrderPlan = {
      ...order,
      id: `po-plan-${Date.now()}`,
      orderNumber: `${order.orderNumber}-COPY`,
      po: `${order.po}-CP`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };
    handleAddProductionOrder(duplicate);
  };

  // Production Schedule Handlers
  const handleAddSchedule = (sch: ProductionPlanSchedule) => {
    const next = [sch, ...schedules];
    setSchedules(next);
    saveStoredSchedules(next);
    addAuditLog('CREATE', 'ProductionPlanSchedule', sch.orderNumber, `Scheduled line ${sch.lineName}`);
    showToast(`Schedule for ${sch.styleNumber} added.`);
  };

  const handleUpdateScheduleStatus = (id: string, newStatus: any) => {
    const next = schedules.map((s) => (s.id === id ? { ...s, status: newStatus } : s));
    setSchedules(next);
    saveStoredSchedules(next);
    showToast(`Schedule status updated to ${newStatus}.`);
  };

  // Time Study Handler
  const handleAddTimeStudy = (study: TimeMotionStudy) => {
    const next = [study, ...timeStudies];
    setTimeStudies(next);
    saveStoredTimeStudies(next);
    addAuditLog('CREATE', 'TimeStudy', study.studyCode, `Recorded study for ${study.operationName}`);
    showToast(`Time study ${study.studyCode} recorded successfully.`);
  };

  // Skill Matrix Handler
  const handleUpdateSkillLevel = (id: string, newLevel: SkillLevelGrade) => {
    const next = skillMatrix.map((sk) =>
      sk.id === id
        ? {
            ...sk,
            skillLevel: newLevel,
            trainingNeeded: newLevel < 2,
            certifiedDate: new Date().toISOString().split('T')[0],
          }
        : sk
    );
    setSkillMatrix(next);
    saveStoredSkillMatrix(next);
    showToast('Skill level updated & certified.');
  };

  // Hourly Monitoring Handler
  const handleAddHourlyRecord = (rec: HourlyMonitoringRecord) => {
    const next = [rec, ...hourlyRecords];
    setHourlyRecords(next);
    saveStoredHourlyMonitoring(next);
    addAuditLog('CREATE', 'HourlyMonitoring', `${rec.lineName} (${rec.hourSlot})`, `Logged ${rec.hourlyActual} pcs`);
    showToast(`Hourly output for ${rec.hourSlot} logged.`);
  };

  // Kaizen Handler
  const handleAddKaizen = (rec: KaizenImprovementRecord) => {
    const next = [rec, ...kaizens];
    setKaizens(next);
    saveStoredKaizenRecords(next);
    addAuditLog('CREATE', 'KaizenImprovement', rec.kaizenNumber, `Initiative: ${rec.title}`);
    showToast(`Kaizen initiative ${rec.kaizenNumber} recorded.`);
  };

  // Dismiss Alert Handler
  const handleDismissAlert = (id: string) => {
    const next = alerts.map((a) => (a.id === id ? { ...a, isDismissed: true } : a));
    setAlerts(next);
    saveStoredProductionAlerts(next);
    showToast('Alert acknowledged & dismissed.');
  };

  // Domain Categories for clean navigation
  type NavCategory = 'all' | 'planning' | 'ie' | 'floor' | 'reports';
  const [selectedCategory, setSelectedCategory] = useState<NavCategory>('all');

  interface TabConfig {
    id: PlanningTabId;
    label: string;
    category: NavCategory;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    description: string;
  }

  const allTabs: TabConfig[] = [
    { id: 'dashboard', label: 'Dashboard', category: 'all', icon: LayoutDashboard, description: 'Executive KPIs & Alerts' },
    { id: 'masters', label: 'Factory Masters', category: 'all', icon: Building2, description: 'Hierarchy, M/C & Skills' },
    { id: 'orders', label: 'Production Orders', category: 'planning', icon: ShoppingBag, count: productionOrders.length, description: 'PO & Planned Quantities' },
    { id: 'planning', label: 'MPS Scheduling', category: 'planning', icon: Calendar, count: schedules.length, description: 'Calendar & Gantt Timeline' },
    { id: 'capacity_line', label: 'Capacity & Lines', category: 'planning', icon: Gauge, description: 'Minutes, Load & Changeovers' },
    { id: 'bulletin_balance', label: 'Operation Bulletin', category: 'ie', icon: Layers, count: bulletins.length, description: 'OB & Yamazumi Balancing' },
    { id: 'work_study', label: 'Work Study', category: 'ie', icon: Clock, count: timeStudies.length, description: 'Time, Method & Motion' },
    { id: 'calculators_kaizen', label: 'IE Calculators', category: 'ie', icon: Calculator, count: 11, description: '11 Calculators & Kaizen' },
    { id: 'execution_hourly', label: 'Hourly Monitor', category: 'floor', icon: Target, description: 'Live Shift Execution' },
    { id: 'wip_loss', label: 'WIP & Losses', category: 'floor', icon: Package, description: '6-Stage Flow & Downtime' },
    { id: 'quality_link', label: 'Quality Link', category: 'reports', icon: ShieldCheck, description: 'DHU, Rework & QMS Link' },
    { id: 'reports_audit', label: 'Reports & Audit', category: 'reports', icon: FileSpreadsheet, count: 33, description: '33 Reports & History' },
  ];

  // Filter tabs by selected domain category
  const visibleTabs = useMemo(() => {
    if (selectedCategory === 'all') return allTabs;
    return allTabs.filter((t) => t.category === selectedCategory || t.id === 'dashboard');
  }, [allTabs, selectedCategory]);

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FLUENT RESPONSIVE TOP HEADER & NAVIGATION BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Header Row: Title, Badges, Summary KPIs & Actions */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                IE-PRD-45
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                45 Factory Functions Active
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Live Plant Sync
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Planning &amp; Industrial Engineering (IE)
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Master Production Scheduling (MPS), capacity allocation, Operation Bulletins, line balancing, work study, 6-stage WIP control, and QMS quality integration.
            </p>
          </div>

          {/* Quick Header Actions & Live Metrics */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-start md:self-center">
            <div className="hidden lg:flex items-center gap-2 pr-2 border-r border-slate-200 text-xs">
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Lines Running</span>
                <span className="font-bold text-slate-800 font-mono">{lines.length} Lines</span>
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Avg Balance Eff</span>
                <span className="font-bold text-emerald-700 font-mono">82.5%</span>
              </div>
            </div>

            <button
              onClick={() => handleExportCsv('Production_Orders.csv', productionOrders)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => handlePrint('Planning & IE Master Report')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Category Domain Filter Bar */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200/60 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
              Domain:
            </span>
            {[
              { id: 'all', label: 'All Modules (12)' },
              { id: 'planning', label: 'Planning & Scheduling (3)' },
              { id: 'ie', label: 'Industrial Engineering (3)' },
              { id: 'floor', label: 'Shop Floor & WIP (2)' },
              { id: 'reports', label: 'Quality & Reports (2)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as NavCategory)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 font-medium hidden md:inline shrink-0">
            Select a module to view and manage factory operations
          </span>
        </div>

        {/* Clean, Fluent Module Tabs Row */}
        <div className="p-2 sm:p-2.5 bg-slate-100/60">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 pb-1">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-blue-200/80 font-bold ring-1 ring-blue-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 border border-transparent'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>


      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <PlanningDashboardTab
          bulletins={bulletins}
          schedules={schedules}
          orders={productionOrders}
          alerts={alerts}
          wipRecords={wipRecords}
          hourlyRecords={hourlyRecords}
          onNavigateTab={(tabId) => setActiveTab(tabId as PlanningTabId)}
          onSelectBulletin={(id) => setSelectedBulletinId(id)}
          onDismissAlert={handleDismissAlert}
        />
      )}

      {/* TAB 2: FACTORY & IE MASTERS */}
      {activeTab === 'masters' && (
        <MasterDataTab
          factories={INITIAL_FACTORIES}
          lines={lines}
          operations={operations}
          machines={machines}
          operators={operators}
          skillMatrix={skillMatrix}
          onAddOperation={(op) => {
            const next = [op, ...operations];
            setOperations(next);
            saveStoredOperations(next);
            showToast(`Operation ${op.operationName} added to master library.`);
          }}
          onAddMachine={(m) => {
            const next = [m, ...machines];
            setMachines(next);
            saveStoredMachines(next);
            showToast(`Machine ${m.machineId} added to machine master.`);
          }}
          onAddOperator={(o) => {
            const next = [o, ...operators];
            setOperators(next);
            saveStoredOperators(next);
            showToast(`Operator ${o.name} registered.`);
          }}
          onUpdateSkillLevel={handleUpdateSkillLevel}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* TAB 3: PRODUCTION ORDERS */}
      {activeTab === 'orders' && (
        <ProductionOrdersTab
          orders={productionOrders}
          onAddOrder={handleAddProductionOrder}
          onUpdateOrder={handleUpdateProductionOrder}
          onDeleteOrder={handleDeleteProductionOrder}
          onDuplicateOrder={handleDuplicateProductionOrder}
          onExportCsv={handleExportCsv}
          onPrintOrders={() => handlePrint('Production Orders Register')}
        />
      )}

      {/* TAB 4: PRODUCTION PLANNING & SCHEDULING (MPS & GANTT & TNA) */}
      {activeTab === 'planning' && (
        <ProductionPlanningTab
          schedules={schedules}
          orders={productionOrders}
          onAddSchedule={handleAddSchedule}
          onUpdateScheduleStatus={handleUpdateScheduleStatus}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* TAB 5: CAPACITY & LINE PLANNING */}
      {activeTab === 'capacity_line' && (
        <CapacityLineTab
          capacityPlans={capacityPlans}
          linePlans={linePlans}
          manpowerPlans={manpowerPlans}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* TAB 6: OPERATION BULLETIN & LINE BALANCING */}
      {activeTab === 'bulletin_balance' && (
        <OperationBulletinTab
          bulletins={bulletins}
          selectedBulletinId={selectedBulletinId}
          onSelectBulletin={setSelectedBulletinId}
          onUpdateBulletin={handleUpdateBulletin}
          onDuplicateBulletin={handleDuplicateBulletin}
          onAddOperationToBulletin={handleAddOperationToBulletin}
          onDeleteOperationFromBulletin={handleDeleteOperationFromBulletin}
          onExportCsv={handleExportCsv}
          onPrintOb={() => handlePrint(`Operation Bulletin - ${bulletins.find((b) => b.id === selectedBulletinId)?.styleNumber}`)}
        />
      )}

      {/* TAB 7: WORK STUDY (TIME, METHOD, MOTION) */}
      {activeTab === 'work_study' && (
        <WorkStudyTab
          timeStudies={timeStudies}
          methodStudies={methodStudies}
          motionStudies={motionStudies}
          onAddTimeStudy={handleAddTimeStudy}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* TAB 8: TARGET SETTING, EXECUTION & HOURLY MONITORING */}
      {activeTab === 'execution_hourly' && (
        <ExecutionHourlyTab
          targets={INITIAL_TARGET_SETTINGS}
          executions={INITIAL_PRODUCTION_EXECUTIONS}
          hourlyRecords={hourlyRecords}
          onAddHourlyRecord={handleAddHourlyRecord}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* TAB 9: 6-STAGE WIP & DOWNTIME */}
      {activeTab === 'wip_loss' && (
        <WipLossTab
          wipRecords={wipRecords}
          losses={losses}
          downtimes={downtimes}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* TAB 10: QUALITY LINK & REWORK / REJECTION */}
      {activeTab === 'quality_link' && (
        <QualityLinkTab
          qualityLinks={qualityLinks}
          reworks={reworks}
          rejections={rejections}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* TAB 11: IE CALCULATORS & KAIZEN */}
      {activeTab === 'calculators_kaizen' && (
        <CalculatorsKaizenTab
          kaizenRecords={kaizens}
          onAddKaizen={handleAddKaizen}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* TAB 12: REPORTS & UNIVERSAL AUDIT CENTER */}
      {activeTab === 'reports_audit' && (
        <ReportsAuditTab
          auditLogs={auditLogs}
          onExportCsv={handleExportCsv}
          onPrintReport={(reportName) => handlePrint(reportName)}
        />
      )}
    </div>
  );
}
