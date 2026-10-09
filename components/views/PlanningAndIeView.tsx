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
  FileDown,
  Filter,
  Search,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { ModuleHeader, ModuleTabOption } from '@/components/ui/ModuleHeader';
import { useModulePermission } from '@/hooks/use-module-permission';
import { BuyerOrder } from '@/lib/types/modules';
import { ProductionOrder } from '@/lib/types/erp';
import { PlanningIeExportModal } from '@/components/modules/planning-ie/PlanningIeExportModal';
import { PlanningIeSingleExportModal } from '@/components/modules/planning-ie/PlanningIeSingleExportModal';
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

import {
  ProductionUnit,
  ProductionSection,
  ProductionLine,
} from '@/lib/types/production-management';
import {
  getProductionUnits,
  saveProductionUnits,
  getProductionSections,
  saveProductionSections,
  getProductionLines,
  saveProductionLines,
} from '@/lib/db/production-management-store';
import {
  getProductionRecords,
  getSewingProductionTrackForPO,
} from '@/lib/db/production-records-store';

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
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('planning_ie');
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

  // Live Production Management States (Synchronized with Production & Quality Modules)
  const [managedUnits, setManagedUnits] = useState<ProductionUnit[]>(getProductionUnits);
  const [managedSections, setManagedSections] = useState<ProductionSection[]>(getProductionSections);
  const [managedLines, setManagedLines] = useState<ProductionLine[]>(getProductionLines);
  const [liveProdRecords, setLiveProdRecords] = useState<ProductionOrder[]>(getProductionRecords);

  // Global & Individual Export States (Synchronized with Production & Quality Modules)
  const [isGlobalExportModalOpen, setIsGlobalExportModalOpen] = useState(false);
  const [selectedOrdersForExport, setSelectedOrdersForExport] = useState<ProductionOrderPlan[]>([]);
  const [isSingleExportModalOpen, setIsSingleExportModalOpen] = useState(false);
  const [singleExportOrder, setSingleExportOrder] = useState<ProductionOrderPlan | null>(null);
  const [singleExportBulletin, setSingleExportBulletin] = useState<StyleOperationBulletin | null>(null);
  const [singleExportSchedule, setSingleExportSchedule] = useState<ProductionPlanSchedule | null>(null);

  const handleOpenGlobalExport = () => {
    setSelectedOrdersForExport([]);
    setIsGlobalExportModalOpen(true);
  };

  const handleOpenBatchOrdersExport = (selected: ProductionOrderPlan[]) => {
    setSelectedOrdersForExport(selected);
    setIsGlobalExportModalOpen(true);
  };

  const handleOpenSingleOrderExport = (ord: ProductionOrderPlan) => {
    setSingleExportOrder(ord);
    setSingleExportBulletin(null);
    setSingleExportSchedule(null);
    setIsSingleExportModalOpen(true);
  };

  const handleOpenSingleBulletinExport = (bulletin: StyleOperationBulletin) => {
    setSingleExportBulletin(bulletin);
    setSingleExportOrder(null);
    setSingleExportSchedule(null);
    setIsSingleExportModalOpen(true);
  };

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

    const handleManagementUpdate = () => {
      setManagedUnits(getProductionUnits());
      setManagedSections(getProductionSections());
      setManagedLines(getProductionLines());
    };

    const handleProdRecordsUpdate = () => {
      setLiveProdRecords(getProductionRecords());
    };

    window.addEventListener('erp_bulletins_updated', handleUpdate);
    window.addEventListener('erp_schedules_updated', handleUpdate);
    window.addEventListener('erp_timestudies_updated', handleUpdate);
    window.addEventListener('erp_production_orders_updated', handleUpdate);
    window.addEventListener('erp_hourly_updated', handleUpdate);
    window.addEventListener('erp_wip_updated', handleUpdate);
    window.addEventListener('erp_wip_records_updated', handleUpdate);
    window.addEventListener('erp_buyer_orders_updated', handleUpdate);
    window.addEventListener('erp_kaizen_updated', handleUpdate);
    window.addEventListener('erp_audit_updated', handleUpdate);
    window.addEventListener('erp_production_management_updated', handleManagementUpdate);
    window.addEventListener('erp_production_records_updated', handleProdRecordsUpdate);
    window.addEventListener('erp_sewing_track_updated', handleProdRecordsUpdate);

    return () => {
      window.removeEventListener('erp_bulletins_updated', handleUpdate);
      window.removeEventListener('erp_schedules_updated', handleUpdate);
      window.removeEventListener('erp_timestudies_updated', handleUpdate);
      window.removeEventListener('erp_production_orders_updated', handleUpdate);
      window.removeEventListener('erp_hourly_updated', handleUpdate);
      window.removeEventListener('erp_wip_updated', handleUpdate);
      window.removeEventListener('erp_wip_records_updated', handleUpdate);
      window.removeEventListener('erp_buyer_orders_updated', handleUpdate);
      window.removeEventListener('erp_kaizen_updated', handleUpdate);
      window.removeEventListener('erp_audit_updated', handleUpdate);
      window.removeEventListener('erp_production_management_updated', handleManagementUpdate);
      window.removeEventListener('erp_production_records_updated', handleProdRecordsUpdate);
      window.removeEventListener('erp_sewing_track_updated', handleProdRecordsUpdate);
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

  // Comprehensive Cross-Module Synchronizer
  const handleSyncAllModules = () => {
    let syncedCount = 0;
    let nextProductionOrders = [...productionOrders];

    propBuyerOrders.forEach((bo) => {
      const existingIdx = nextProductionOrders.findIndex(
        (o) => o.po === bo.orderNumber || o.buyerOrderId === bo.id
      );

      const fabricBom = bo.bomItems?.find((b) => b.itemType === 'FABRIC');
      const fabricStatus =
        fabricBom?.status === 'RECEIVED'
          ? '100% In-House - Passed 4-Point Inspection'
          : fabricBom?.status === 'PARTIALLY_RECEIVED'
          ? 'Partial Inward - Ready for Relaxation'
          : 'Fabric Sourced - Pending Mill Delivery';

      const desc = bo.styleDescription.toLowerCase();
      const isDenim = desc.includes('jeans') || desc.includes('denim');
      const isPolo = desc.includes('polo');
      const isHoodie = desc.includes('hoodie') || desc.includes('fleece');
      const isShirt = desc.includes('shirt') && !isPolo;

      let assignedLine = 'Sewing Line 01';
      let productCategory = 'Knit Tops';
      if (isDenim) {
        assignedLine = 'Sewing Line 04';
        productCategory = 'Denim Bottoms';
      } else if (isPolo) {
        assignedLine = 'Sewing Line 02';
        productCategory = 'Knit Tops';
      } else if (isHoodie) {
        assignedLine = 'Sewing Line 03';
        productCategory = 'Fleece Outerwear';
      } else if (isShirt) {
        assignedLine = 'Sewing Line 05';
        productCategory = 'Woven Tops';
      }

      const plannedQty = Math.round(bo.orderQuantity * 1.03); // +3% cutting & rework buffer

      const planRecord: ProductionOrderPlan = {
        id: `po-plan-${bo.orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        orderNumber: `PRD-ORD-${bo.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
        buyer: bo.buyerName,
        style: bo.styleNumber,
        po: bo.orderNumber,
        article: `ART-${bo.styleNumber}`,
        product: bo.styleDescription,
        productCategory,
        color: 'Standard Tech Pack Colorways',
        size: 'S - XXL',
        sizeRange: 'S, M, L, XL, XXL',
        orderQuantity: bo.orderQuantity,
        plannedQuantity: plannedQty,
        productionStartDate: bo.cuttingStartDate || new Date().toISOString().split('T')[0],
        productionEndDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
        deliveryDate: bo.shipDate,
        priority: 'HIGH',
        assignedLine,
        assignedDepartment: 'SEWING',
        status: bo.status === 'SEWING' ? 'IN_PRODUCTION' : bo.status === 'CUTTING' ? 'RELEASED' : 'PLANNED',
        remarks: `Synchronized with Buyer Order ${bo.orderNumber}. 3.0% overcut allowance applied.`,
        createdAt: new Date().toISOString(),
        buyerOrderId: bo.id,
        fabricStatus,
        cuttingStatus: bo.status === 'SEWING' ? '100% Cut & Numbered' : bo.status === 'CUTTING' ? '50% Cut - Spreading Active' : 'Scheduled',
        smv: bo.smv || 14.5,
        fobPrice: bo.fobPrice,
        isSyncedWithBuyerOrder: true,
        syncSource: 'Buyer Order Module',
        fabricReadinessPercent: fabricBom?.status === 'RECEIVED' ? 100 : 70,
      };

      if (existingIdx >= 0) {
        nextProductionOrders[existingIdx] = {
          ...nextProductionOrders[existingIdx],
          ...planRecord,
          id: nextProductionOrders[existingIdx].id,
          orderNumber: nextProductionOrders[existingIdx].orderNumber,
        };
      } else {
        nextProductionOrders = [planRecord, ...nextProductionOrders];
      }
      syncedCount++;
    });

    setProductionOrders(nextProductionOrders);
    saveStoredProductionOrders(nextProductionOrders);

    const u = getProductionUnits();
    const s = getProductionSections();
    const l = getProductionLines();
    const pr = getProductionRecords();
    setManagedUnits(u);
    setManagedSections(s);
    setManagedLines(l);
    setLiveProdRecords(pr);

    addAuditLog(
      'UPDATE',
      'ModuleSync',
      'BuyerOrder-PPC',
      `Synchronized ${syncedCount} Buyer Orders, ${u.length} Units, ${s.length} Sections, ${l.length} Lines into Planning & IE`
    );
    showToast(`Full Plant Sync: ${syncedCount} Buyer Orders, ${u.length} Units, ${s.length} Sections, ${l.length} Lines Live-Synced!`);
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

  // Real Production Management Handlers (Units, Sections, Lines)
  const handleAddUnit = (u: ProductionUnit) => {
    const next = [u, ...managedUnits];
    setManagedUnits(next);
    saveProductionUnits(next);
    addAuditLog('CREATE', 'ProductionUnit', u.unitCode, `Added unit ${u.name}`);
    showToast(`Production Unit "${u.name}" created and synced.`);
  };

  const handleUpdateUnitStatus = (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    const next = managedUnits.map((u) => (u.id === id ? { ...u, status } : u));
    setManagedUnits(next);
    saveProductionUnits(next);
    addAuditLog('UPDATE', 'ProductionUnit', id, `Updated unit status to ${status}`);
    showToast(`Unit status updated to ${status}.`);
  };

  const handleDeleteUnit = (id: string) => {
    const next = managedUnits.filter((u) => u.id !== id);
    setManagedUnits(next);
    saveProductionUnits(next);
    addAuditLog('DELETE', 'ProductionUnit', id, `Removed production unit`);
    showToast(`Production Unit removed.`);
  };

  const handleAddSection = (s: ProductionSection) => {
    const next = [s, ...managedSections];
    setManagedSections(next);
    saveProductionSections(next);
    addAuditLog('CREATE', 'ProductionSection', s.sectionCode, `Added section ${s.name}`);
    showToast(`Section "${s.name}" created and synced.`);
  };

  const handleUpdateSectionStatus = (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    const next = managedSections.map((s) => (s.id === id ? { ...s, status } : s));
    setManagedSections(next);
    saveProductionSections(next);
    addAuditLog('UPDATE', 'ProductionSection', id, `Updated section status to ${status}`);
    showToast(`Section status updated to ${status}.`);
  };

  const handleDeleteSection = (id: string) => {
    const next = managedSections.filter((s) => s.id !== id);
    setManagedSections(next);
    saveProductionSections(next);
    addAuditLog('DELETE', 'ProductionSection', id, `Removed section`);
    showToast(`Section removed.`);
  };

  const handleAddLine = (l: ProductionLine) => {
    const next = [l, ...managedLines];
    setManagedLines(next);
    saveProductionLines(next);
    addAuditLog('CREATE', 'ProductionLine', l.lineCode, `Added line ${l.name}`);
    showToast(`Production Line "${l.name}" created and synced to floor.`);
  };

  const handleUpdateLineStatus = (id: string, status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE') => {
    const next = managedLines.map((l) => (l.id === id ? { ...l, status } : l));
    setManagedLines(next);
    saveProductionLines(next);
    addAuditLog('UPDATE', 'ProductionLine', id, `Updated line status to ${status}`);
    showToast(`Line status changed to ${status}. Live sync dispatched.`);
  };

  const handleDeleteLine = (id: string) => {
    const next = managedLines.filter((l) => l.id !== id);
    setManagedLines(next);
    saveProductionLines(next);
    addAuditLog('DELETE', 'ProductionLine', id, `Removed line`);
    showToast(`Production Line removed.`);
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
                <span className="font-bold text-slate-800 font-mono">{managedLines.length} Lines</span>
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Avg Balance Eff</span>
                <span className="font-bold text-emerald-700 font-mono">82.5%</span>
              </div>
            </div>

            <button
              onClick={handleSyncAllModules}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
              title="Sync Buyer Orders, Fabric Status, and Production Schedules"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Sync All Modules</span>
            </button>

            {canExport && (
              <button
                onClick={handleOpenGlobalExport}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                title="Global Export: Production Orders, MPS & Operation Bulletins (PDF or Excel)"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Export Register</span>
                <span className="sm:hidden">Export</span>
              </button>
            )}

            {canExport && (
              <button
                onClick={() => handleExportCsv('Production_Orders.csv', productionOrders)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            )}

            {canExport && (
              <button
                onClick={() => handlePrint('Planning & IE Master Report')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>
            )}
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
          units={managedUnits}
          sections={managedSections}
          lines={managedLines}
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
          onAddUnit={handleAddUnit}
          onUpdateUnitStatus={handleUpdateUnitStatus}
          onDeleteUnit={handleDeleteUnit}
          onAddSection={handleAddSection}
          onUpdateSectionStatus={handleUpdateSectionStatus}
          onDeleteSection={handleDeleteSection}
          onAddLine={handleAddLine}
          onUpdateLineStatus={handleUpdateLineStatus}
          onDeleteLine={handleDeleteLine}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* TAB 3: PRODUCTION ORDERS */}
      {activeTab === 'orders' && (
        <ProductionOrdersTab
          orders={productionOrders}
          buyerOrders={propBuyerOrders}
          lines={managedLines}
          onAddOrder={handleAddProductionOrder}
          onUpdateOrder={handleUpdateProductionOrder}
          onDeleteOrder={handleDeleteProductionOrder}
          onDuplicateOrder={handleDuplicateProductionOrder}
          onExportCsv={handleExportCsv}
          onPrintOrders={() => handlePrint('Production Orders Register')}
          onExportSingleOrder={handleOpenSingleOrderExport}
          onExportOrdersBatch={handleOpenBatchOrdersExport}
          onOpenGlobalExport={handleOpenGlobalExport}
        />
      )}

      {/* TAB 4: PRODUCTION PLANNING & SCHEDULING (MPS & GANTT & TNA) */}
      {activeTab === 'planning' && (
        <ProductionPlanningTab
          lines={managedLines}
          schedules={schedules}
          orders={productionOrders}
          onAddSchedule={handleAddSchedule}
          onUpdateScheduleStatus={handleUpdateScheduleStatus}
          onExportCsv={handleExportCsv}
          onOpenGlobalExport={handleOpenGlobalExport}
        />
      )}

      {/* TAB 5: CAPACITY & LINE PLANNING */}
      {activeTab === 'capacity_line' && (
        <CapacityLineTab
          lines={managedLines}
          units={managedUnits}
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
          onAddNewBulletin={(newB) => {
            const next = [newB, ...bulletins];
            setBulletins(next);
            saveStoredBulletins(next);
            setSelectedBulletinId(newB.id);
            addAuditLog('CREATE', 'StyleOperationBulletin', newB.styleNumber, `Created OB for ${newB.styleNumber} (${newB.garmentType})`);
            showToast(`Created Operation Bulletin for ${newB.styleNumber}`);
          }}
          onAddOperationToBulletin={handleAddOperationToBulletin}
          onDeleteOperationFromBulletin={handleDeleteOperationFromBulletin}
          onExportCsv={handleExportCsv}
          onPrintOb={() => handlePrint(`Operation Bulletin - ${bulletins.find((b) => b.id === selectedBulletinId)?.styleNumber}`)}
          onExportSingleBulletin={handleOpenSingleBulletinExport}
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
          lines={managedLines}
          productionRecords={liveProdRecords}
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

      {/* GLOBAL EXPORT MODAL */}
      <PlanningIeExportModal
        isOpen={isGlobalExportModalOpen}
        onClose={() => setIsGlobalExportModalOpen(false)}
        allOrders={productionOrders}
        selectedOrders={selectedOrdersForExport}
        schedules={schedules}
        bulletins={bulletins}
      />

      {/* INDIVIDUAL SINGLE EXPORT MODAL */}
      <PlanningIeSingleExportModal
        isOpen={isSingleExportModalOpen}
        onClose={() => {
          setIsSingleExportModalOpen(false);
          setSingleExportOrder(null);
          setSingleExportBulletin(null);
          setSingleExportSchedule(null);
        }}
        order={singleExportOrder}
        bulletin={singleExportBulletin}
        schedule={singleExportSchedule}
      />
    </div>
  );
}
