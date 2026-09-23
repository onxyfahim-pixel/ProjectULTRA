'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ErpAuthProvider, useErpAuth } from '@/hooks/use-erp-auth';
import { useLiveSync } from '@/hooks/use-live-sync';
import { ErpHeader } from '@/components/layout/ErpHeader';
import { ErpSidebar, NavTab } from '@/components/layout/ErpSidebar';
import { LoginPage } from '@/components/auth/LoginPage';

// Views
import { DashboardView } from '@/components/views/DashboardView';
import { InventoryView } from '@/components/views/InventoryView';
import { InspectionsView } from '@/components/views/InspectionsView';
import { ProductionView } from '@/components/views/ProductionView';
import { StandardsView } from '@/components/views/StandardsView';
import { ArchitectureView } from '@/components/views/ArchitectureView';

// 30 Garments QMS Modules
import { BuyerOrderView } from '@/components/views/BuyerOrderView';
import { SubSupplierView } from '@/components/views/SubSupplierView';
import { CustomerComplaintView } from '@/components/views/CustomerComplaintView';
import { IncomingQcView } from '@/components/views/IncomingQcView';
import { DefectsLibraryView } from '@/components/views/DefectsLibraryView';
import { TestingView } from '@/components/views/TestingView';
import { CalibrationView } from '@/components/views/CalibrationView';
import { KpiManagementView } from '@/components/views/KpiManagementView';
import { QualityGoalsView } from '@/components/views/QualityGoalsView';
import { AuditView } from '@/components/views/AuditView';
import { CapaView } from '@/components/views/CapaView';
import { RootCauseAnalysisView } from '@/components/views/RootCauseAnalysisView';
import { RiskAssessmentView } from '@/components/views/RiskAssessmentView';
import { TraceabilityAuditView } from '@/components/views/TraceabilityAuditView';
import { CertificateView } from '@/components/views/CertificateView';
import { DocumentControlView } from '@/components/views/DocumentControlView';
import { SopManagementView } from '@/components/views/SopManagementView';
import { QualityManualView } from '@/components/views/QualityManualView';
import { ProcedureView } from '@/components/views/ProcedureView';
import { ProcessFlowView } from '@/components/views/ProcessFlowView';
import { OrganogramView } from '@/components/views/OrganogramView';
import { JobDescriptionView } from '@/components/views/JobDescriptionView';
import { TrainingView } from '@/components/views/TrainingView';
import { MeetingMinutesView } from '@/components/views/MeetingMinutesView';
import { EventsView } from '@/components/views/EventsView';
import { CommunicationPortalView } from '@/components/views/CommunicationPortalView';
import { SettingsView } from '@/components/views/SettingsView';

// Modals
import { StockAdjustModal } from '@/components/modals/StockAdjustModal';
import { NewInspectionModal } from '@/components/modals/NewInspectionModal';
import { InwardBatchModal } from '@/components/modals/InwardBatchModal';
import {
  InventoryItem,
  InspectionRecord,
  ProductionOrder,
  QualityGrade,
  ReceiveRecord,
} from '@/lib/types/erp';
import {
  INITIAL_INVENTORY,
  INITIAL_INSPECTIONS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_RECEIVE_REGISTRY,
} from '@/lib/db/mock-data';
import { BuyerOrder } from '@/lib/types/modules';
import { MOCK_BUYER_ORDERS } from '@/lib/db/modules-mock-data';

function ErpAppContent() {
  const { token } = useErpAuth();

  // Navigation State & Responsive Sidebar Collapse
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Keyboard shortcut (Ctrl+B / Cmd+B) for instant sidebar collapse toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Core Data State
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [inspections, setInspections] = useState<InspectionRecord[]>(INITIAL_INSPECTIONS);
  const [productionOrders, setProductionOrders] =
    useState<ProductionOrder[]>(INITIAL_PRODUCTION_ORDERS);
  const [orders, setOrders] = useState<BuyerOrder[]>(MOCK_BUYER_ORDERS);
  const [receiveRecords, setReceiveRecords] = useState<ReceiveRecord[]>(INITIAL_RECEIVE_REGISTRY);

  // Modal States
  const [stockAdjustItem, setStockAdjustItem] = useState<InventoryItem | null>(null);
  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);

  // Bidirectional Synchronization: When materials are received in Inventory (or Buyer Order module)
  const handleReceiveMaterialLinkedToOrder = useCallback(
    (record: ReceiveRecord, itemUpdate?: Partial<InventoryItem>) => {
      setReceiveRecords((prev) => [record, ...prev]);

      if (itemUpdate) {
        setInventory((prev) => {
          const idx = prev.findIndex((i) => i.id === record.itemId || i.sku === record.sku);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              quantityMeters: next[idx].quantityMeters + record.receivedQty,
              qualityGrade: record.qualityGrade,
              poNumber: record.poNumber || next[idx].poNumber,
              styleNumber: record.styleNumber || next[idx].styleNumber,
              buyerOrderId: record.buyerOrderId || next[idx].buyerOrderId,
              buyerName: record.buyerName || next[idx].buyerName,
              bomItemId: record.bomItemId || next[idx].bomItemId,
              lastUpdatedAt: new Date().toISOString(),
            };
            return next;
          } else {
            const newItem: InventoryItem = {
              id: record.itemId || `inv-${Date.now()}`,
              sku: record.sku,
              category: record.category,
              styleNumber: record.styleNumber || record.poNumber || 'GENERAL-STOCK',
              fabricType: record.itemName,
              color: 'Standard',
              batchLot: record.batchLot,
              rollCount: record.rollsReceived || 0,
              quantityMeters: record.receivedQty,
              unit: record.unit,
              qualityGrade: record.qualityGrade,
              warehouseLocation: record.warehouseLocation,
              status: 'IN_STOCK',
              unitCost: itemUpdate?.unitCost || 3.0,
              updatedBy: record.receivedBy,
              lastUpdatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              supplierName: record.supplierName,
              poNumber: record.poNumber,
              buyerOrderId: record.buyerOrderId,
              buyerName: record.buyerName,
              bomItemId: record.bomItemId,
            };
            return [newItem, ...prev];
          }
        });
      }

      // Update matching Buyer Order's BOM items & fulfillment in real time!
      setOrders((prevOrders) =>
        prevOrders.map((ord) => {
          if (
            ord.id === record.buyerOrderId ||
            ord.orderNumber.toLowerCase() === record.poNumber?.toLowerCase()
          ) {
            let bomFound = false;
            const updatedBom = (ord.bomItems || []).map((bom) => {
              const isMatch =
                (record.bomItemId && bom.id === record.bomItemId) ||
                (record.bomItemCode && bom.itemCode === record.bomItemCode) ||
                (!record.bomItemId &&
                  !bomFound &&
                  ((bom.itemType === 'FABRIC' && record.category === 'FABRIC') ||
                    (bom.itemType === 'THREAD' && record.category === 'SEWING_THREAD') ||
                    (bom.itemType === 'ZIPPER' && record.category === 'ZIPPERS') ||
                    (bom.itemType === 'BUTTON' && record.category === 'TRIMS_BUTTONS') ||
                    (bom.itemType === 'LABEL' && record.category === 'LABELS_PACKAGING')));

              if (isMatch && !bomFound) {
                bomFound = true;
                const newRecQty = (bom.receivedQty || 0) + record.receivedQty;
                return {
                  ...bom,
                  receivedQty: newRecQty,
                  status: newRecQty >= bom.totalRequired ? ('RECEIVED' as const) : ('PARTIALLY_RECEIVED' as const),
                  grnNumber: record.grnNumber,
                  receivedDate: record.date,
                  qcGrade: record.qualityGrade,
                  inventoryItemId: record.itemId,
                };
              }
              return bom;
            });

            return {
              ...ord,
              bomItems: updatedBom,
            };
          }
          return ord;
        })
      );
    },
    []
  );

  // Fetch initial live data from backend REST API
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const [invRes, qmsRes, statsRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/qms/inspections'),
          fetch('/api/dashboard/stats'),
        ]);

        if (invRes.ok) {
          const invData = await invRes.json();
          if (isMounted && Array.isArray(invData.items) && invData.items.length > 0) {
            setInventory(invData.items);
          }
        }

        if (qmsRes.ok) {
          const qmsData = await qmsRes.json();
          if (isMounted && Array.isArray(qmsData.records) && qmsData.records.length > 0) {
            setInspections(qmsData.records);
          }
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (isMounted && Array.isArray(statsData.productionOrders)) {
            setProductionOrders(statsData.productionOrders);
          }
        }
      } catch (err) {
        console.warn('Initial REST fetch fallback to in-memory store:', err);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle live WebSocket/SSE events
  const handleLiveEvent = useCallback((event: any) => {
    if (event.type === 'INVENTORY_UPDATE' || event.type === 'STOCK_ADJUSTED') {
      const updatedItem = event.payload?.item;
      if (updatedItem && updatedItem.id) {
        setInventory((prev) => {
          const index = prev.findIndex((i) => i.id === updatedItem.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...next[index], ...updatedItem };
            return next;
          }
          return [updatedItem, ...prev];
        });
      }
    } else if (event.type === 'BATCH_GRADE_UPDATED') {
      const { ids, grade } = event.payload || {};
      if (Array.isArray(ids) && grade) {
        setInventory((prev) =>
          prev.map((item) =>
            ids.includes(item.id)
              ? {
                  ...item,
                  qualityGrade: grade,
                  lastUpdatedAt: new Date().toISOString(),
                  updatedBy: event.payload?.updatedBy || 'Live WS',
                }
              : item
          )
        );
      }
    } else if (event.type === 'AQL_INSPECTION_SUBMITTED') {
      const record = event.payload?.record;
      if (record && record.id) {
        setInspections((prev) => [record, ...prev]);
      }
    }
  }, []);

  useLiveSync(handleLiveEvent);

  // Sync Buyer Orders from storage when updated across modules
  useEffect(() => {
    const handleBuyerOrdersUpdated = () => {
      try {
        const raw = localStorage.getItem('erp_buyer_orders_v1') || localStorage.getItem('erp_buyer_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('erp_buyer_orders_updated', handleBuyerOrdersUpdated);
    return () => window.removeEventListener('erp_buyer_orders_updated', handleBuyerOrdersUpdated);
  }, []);

  // Handle production orders update with auto-sync to matching Buyer Orders' Sewing track
  const handleUpdateProductionOrders = useCallback((newProdOrders: ProductionOrder[]) => {
    setProductionOrders(newProdOrders);

    // Auto-sync sewing checked quantity to matching Buyer Orders
    setOrders((prevBuyerOrders) => {
      return prevBuyerOrders.map((bo) => {
        const poNum = (bo.orderNumber || '').trim().toLowerCase();
        const matchingSewingRecords = newProdOrders.filter((po) => {
          const recPO = (po.orderNumber || '').trim().toLowerCase();
          const matches = recPO === poNum || poNum.includes(recPO) || recPO.includes(poNum);
          const isSewing =
            (po.section && po.section.toLowerCase().includes('sew')) ||
            (po.sewingLine && po.sewingLine.toLowerCase().includes('sew')) ||
            (po.lineId && po.lineId.toLowerCase().includes('line')) ||
            (!po.section?.toLowerCase().includes('cut') &&
              !po.section?.toLowerCase().includes('wash') &&
              !po.section?.toLowerCase().includes('finish'));
          return matches && isSewing;
        });

        if (matchingSewingRecords.length === 0) return bo;

        const totalSewingChecked = matchingSewingRecords.reduce((sum, rec) => {
          if (rec.hourlyReports && rec.hourlyReports.length > 0) {
            const hrChecked = rec.hourlyReports.reduce((s, h) => s + (Number(h.checkedQty) || 0), 0);
            if (hrChecked > 0) return sum + hrChecked;
          }
          return sum + (Number(rec.completedQuantity) || 0);
        }, 0);

        const currentStages = bo.productionTracking?.stages || [];
        const updatedStages = currentStages.map((st) => {
          if (st.stage === 'SEWING') {
            return {
              ...st,
              actualPcs: totalSewingChecked, // ONLY Sewing Total Checked Quantity
              status:
                totalSewingChecked >= (st.plannedPcs || bo.orderQuantity)
                  ? ('COMPLETED' as const)
                  : totalSewingChecked > 0
                  ? ('IN_PROGRESS' as const)
                  : st.status,
              inspector: matchingSewingRecords[0]?.qualityInspector || st.inspector,
              notes: `Auto-linked from sewing records (${totalSewingChecked.toLocaleString()} checked pcs)`,
            };
          }
          return st;
        });

        return {
          ...bo,
          productionTracking: {
            currentStage: bo.productionTracking?.currentStage || 'SEWING',
            overallProgressPercent: Math.min(100, Math.round((totalSewingChecked / bo.orderQuantity) * 100)),
            stages: updatedStages,
          },
        };
      });
    });
  }, []);

  // Handlers
  const handleSaveStockAdjust = async (id: string, updates: Partial<InventoryItem>) => {
    const res = await fetch('/api/inventory', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update inventory');
    }

    const data = await res.json();
    if (data.item) {
      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, ...data.item } : i)));
    }
  };

  const handleBatchGradeUpdate = async (ids: string[], grade: QualityGrade) => {
    const res = await fetch('/api/inventory/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ ids, grade }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to batch update grade');
    }

    setInventory((prev) =>
      prev.map((i) =>
        ids.includes(i.id)
          ? { ...i, qualityGrade: grade, lastUpdatedAt: new Date().toISOString() }
          : i
      )
    );
  };

  const handleSaveInspection = async (
    recordData: Omit<InspectionRecord, 'id' | 'createdAt' | 'inspectionCode'>
  ) => {
    const res = await fetch('/api/qms/inspections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(recordData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit inspection');
    }

    const data = await res.json();
    if (data.record) {
      setInspections((prev) => [data.record, ...prev]);
    }
  };

  const handleInwardFabric = async (
    itemData: Omit<InventoryItem, 'id' | 'lastUpdatedAt' | 'updatedBy'>
  ) => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(itemData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to inward fabric');
    }

    const data = await res.json();
    if (data.item) {
      setInventory((prev) => [data.item, ...prev]);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 font-sans antialiased text-slate-900">
      {/* Universal Industrial Header */}
      <ErpHeader
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isSidebarOpen={isMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Unified Standard Sidebar */}
        <ErpSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Main Content Area - Full fluid widescreen up to 1920px with smooth independent vertical scrolling */}
        <main className="flex-1 overflow-y-auto min-h-0 w-full bg-slate-50/60">
          <div className="w-full max-w-[1920px] mx-auto p-3 sm:p-5 lg:p-7 xl:p-8 space-y-6 pb-20">
            {activeTab === 'dashboard' && (
              <DashboardView
                inventory={inventory}
                inspections={inspections}
                productionOrders={productionOrders}
                onNavigateTab={setActiveTab}
                onOpenNewInspection={() => setIsNewInspectionOpen(true)}
                onOpenStockAdjust={(item) => {
                  setStockAdjustItem(item);
                  setIsStockAdjustOpen(true);
                }}
              />
            )}

            {/* 30 QMS ERP Modules */}
            {activeTab === 'buyer_order' && (
              <BuyerOrderView
                orders={orders}
                onUpdateOrders={setOrders}
                inventory={inventory}
                receiveRecords={receiveRecords}
                onReceiveMaterial={handleReceiveMaterialLinkedToOrder}
              />
            )}
            {activeTab === 'sub_supplier' && <SubSupplierView />}
            {activeTab === 'customer_complaint' && <CustomerComplaintView />}
            
            {activeTab === 'inventory' && (
              <InventoryView
                items={inventory}
                orders={orders}
                onOpenStockAdjust={(item) => {
                  setStockAdjustItem(item);
                  setIsStockAdjustOpen(true);
                }}
                onBatchGradeUpdate={handleBatchGradeUpdate}
                onAddNewItem={() => setIsInwardModalOpen(true)}
                onReceiveRecord={handleReceiveMaterialLinkedToOrder}
              />
            )}

            {activeTab === 'incoming_qc' && (
              <IncomingQcView
                inventoryItems={inventory}
                onUpdateInventoryItem={(updated) => {
                  setInventory((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                }}
              />
            )}
            {activeTab === 'production' && (
              <ProductionView
                orders={productionOrders}
                onUpdateOrders={handleUpdateProductionOrders}
              />
            )}
            
            {activeTab === 'inspections' && (
              <InspectionsView
                records={inspections}
                onUpdateRecords={setInspections}
                onOpenNewInspection={() => setIsNewInspectionOpen(true)}
                orders={orders}
              />
            )}

            {activeTab === 'defects_library' && <DefectsLibraryView />}
            {activeTab === 'testing' && <TestingView />}
            {activeTab === 'calibration' && <CalibrationView />}
            {activeTab === 'kpi_management' && <KpiManagementView />}
            {activeTab === 'quality_goals' && <QualityGoalsView />}
            {activeTab === 'audit' && <AuditView />}
            {activeTab === 'capa' && <CapaView />}
            {activeTab === 'root_cause' && <RootCauseAnalysisView />}
            {activeTab === 'risk_assessment' && <RiskAssessmentView />}
            {activeTab === 'traceability' && <TraceabilityAuditView />}
            {activeTab === 'certificate' && <CertificateView />}
            {activeTab === 'document_control' && <DocumentControlView />}
            {activeTab === 'sop_management' && <SopManagementView />}
            {activeTab === 'quality_manual' && <QualityManualView />}
            {activeTab === 'procedure' && <ProcedureView />}
            {activeTab === 'process_flow' && <ProcessFlowView />}
            {activeTab === 'organogram' && <OrganogramView />}
            {activeTab === 'job_description' && <JobDescriptionView />}
            {activeTab === 'training' && <TrainingView />}
            {activeTab === 'meeting_minutes' && <MeetingMinutesView />}
            {activeTab === 'events' && <EventsView />}
            {activeTab === 'communication' && <CommunicationPortalView />}
            {activeTab === 'settings' && <SettingsView />}

            {/* Architecture and Standards Reference */}
            {activeTab === 'standards' && <StandardsView />}
            {activeTab === 'architecture' && <ArchitectureView />}
          </div>
        </main>
      </div>

      {/* Modals */}
      <StockAdjustModal
        item={stockAdjustItem}
        isOpen={isStockAdjustOpen}
        onClose={() => {
          setIsStockAdjustOpen(false);
          setStockAdjustItem(null);
        }}
        onSave={handleSaveStockAdjust}
      />

      <NewInspectionModal
        isOpen={isNewInspectionOpen}
        onClose={() => setIsNewInspectionOpen(false)}
        onSave={handleSaveInspection}
      />

      <InwardBatchModal
        isOpen={isInwardModalOpen}
        onClose={() => setIsInwardModalOpen(false)}
        onSave={handleInwardFabric}
      />
    </div>
  );
}

function ErpAppShell() {
  const { isAuthenticated, isLoading } = useErpAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <div className="text-sm font-bold text-slate-300">Connecting to Valiant Garments ERP Host...</div>
        <div className="text-xs text-slate-500 mt-1 font-mono">Port: 3000 • Initializing Security Context</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <ErpAppContent />;
}

export default function Page() {
  return (
    <ErpAuthProvider>
      <ErpAppShell />
    </ErpAuthProvider>
  );
}
