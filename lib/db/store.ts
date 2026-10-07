import {
  InventoryItem,
  InspectionRecord,
  ProductionOrder,
  AuditLog,
  QualityGrade,
  RealTimeEvent,
  UserSession,
} from '../types/erp';
import { BuyerOrder } from '../types/modules';
import { CentralStorageManager, CentralErpData } from './central-storage';
import { mysqlManager } from './mysql-client';
import { MOCK_BUYER_ORDERS } from './modules-mock-data';
import { INITIAL_INVENTORY, INITIAL_INSPECTIONS, INITIAL_PRODUCTION_ORDERS } from './mock-data';

// Persistent repository backed by Host MySQL Database with Local JSON Fallback & Dual-Sync
class ErpDataStore {
  private buyerOrders: BuyerOrder[] = [];
  private productionRecords: ProductionOrder[] = [];
  private inventory: InventoryItem[] = [];
  private inspections: InspectionRecord[] = [];
  private productionOrders: ProductionOrder[] = [];
  private auditLogs: AuditLog[] = [];
  private modulesData: Record<string, any> = {};
  private listeners: Set<(event: RealTimeEvent) => void> = new Set();
  private mysqlConnected: boolean = false;
  private isSyncingMysql: boolean = false;

  constructor() {
    // 1. Instantly load from local disk so in-memory cache is ready for incoming requests
    this.loadFromDisk();
    // 2. Asynchronously initialize MySQL, create tables if needed, and sync data
    this.initMysqlSync();
  }

  public loadFromDisk(): void {
    const central: CentralErpData = CentralStorageManager.loadCentralData();
    this.inventory = central.inventory || [];
    this.inspections = central.inspections || [];
    this.productionOrders = central.productionOrders || [];
    this.auditLogs = central.auditLogs || [];
    this.modulesData = central.modulesData || {};

    // Buyer orders from modulesData (respect user deletions even if empty [])
    if (this.modulesData.buyer_orders && Array.isArray(this.modulesData.buyer_orders)) {
      this.buyerOrders = this.modulesData.buyer_orders;
    } else if (this.modulesData.buyer_orders === undefined) {
      this.buyerOrders = [...MOCK_BUYER_ORDERS];
    }

    // Production floor records (respect user deletions even if empty [])
    if (this.modulesData.production_records && Array.isArray(this.modulesData.production_records)) {
      this.productionRecords = this.modulesData.production_records;
    } else if (this.modulesData.production_records === undefined && this.productionOrders && this.productionOrders.length > 0) {
      this.productionRecords = this.productionOrders;
    }

    console.log(
      `[ERP Host Central] Loaded ${this.buyerOrders.length} buyer orders, ${this.inventory.length} inventory items, ${this.inspections.length} inspections from disk cache.`
    );
  }

  public async initMysqlSync(): Promise<void> {
    if (this.isSyncingMysql) return;
    this.isSyncingMysql = true;

    try {
      const connected = await mysqlManager.initializeSchema();
      this.mysqlConnected = connected;

      if (connected) {
        // Seed MySQL if it's a fresh database
        await mysqlManager.seedIfEmpty({
          buyerOrders: this.buyerOrders,
          productionRecords: this.productionRecords,
          inventory: this.inventory,
          inspections: this.inspections,
          productionOrders: this.productionOrders,
          auditLogs: this.auditLogs,
          modulesData: this.modulesData,
        });

        // Load latest state from MySQL relational tables
        const [mysqlOrders, mysqlRecords, mysqlInv, mysqlInsp, mysqlPo, mysqlAudit, mysqlModules] =
          await Promise.all([
            mysqlManager.loadBuyerOrders(),
            mysqlManager.loadProductionRecords(),
            mysqlManager.loadInventory(),
            mysqlManager.loadInspections(),
            mysqlManager.loadProductionOrders(),
            mysqlManager.loadAuditLogs(),
            mysqlManager.loadAllModulesData(),
          ]);

        if (mysqlOrders.length > 0) {
          this.buyerOrders = mysqlOrders;
          this.modulesData.buyer_orders = mysqlOrders;
        }
        if (mysqlRecords.length > 0) {
          this.productionRecords = mysqlRecords;
          this.modulesData.production_records = mysqlRecords;
        }
        if (mysqlInv.length > 0) this.inventory = mysqlInv;
        if (mysqlInsp.length > 0) this.inspections = mysqlInsp;
        if (mysqlPo.length > 0) this.productionOrders = mysqlPo;
        if (mysqlAudit.length > 0) this.auditLogs = mysqlAudit;
        if (Object.keys(mysqlModules).length > 0) {
          this.modulesData = { ...this.modulesData, ...mysqlModules };
        }

        // Sync back to disk for local backup
        this.persistToDisk();
        console.log('[ERP Host MySQL] Live sync complete. Host PC MySQL Database is ACTIVE.');
      }
    } catch (err: any) {
      this.mysqlConnected = false;
      console.warn('[ERP Host MySQL] MySQL sync deferred:', err.message);
    } finally {
      this.isSyncingMysql = false;
    }
  }

  private persistToDisk(): void {
    this.modulesData.buyer_orders = this.buyerOrders;
    this.modulesData.production_records = this.productionRecords;

    CentralStorageManager.saveCentralData({
      version: 2,
      lastSavedAt: new Date().toISOString(),
      hostSystem: 'Garments QMS ERP Host Center (MySQL Dual-Engine)',
      inventory: this.inventory,
      inspections: this.inspections,
      productionOrders: this.productionOrders,
      auditLogs: this.auditLogs,
      modulesData: this.modulesData,
    });
  }

  public isMysqlActive(): boolean {
    return this.mysqlConnected && mysqlManager.getConnectedStatus();
  }

  public getStorageFilePath(): string {
    return CentralStorageManager.getDataFilePath();
  }

  public subscribe(callback: (event: RealTimeEvent) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public broadcast(event: RealTimeEvent) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in event listener:', err);
      }
    });
  }

  // --- Buyer Orders (With WIP Record) ---
  public getBuyerOrders(): BuyerOrder[] {
    return this.buyerOrders.map((bo) => {
      if (
        !bo.wipRecord ||
        Object.keys(bo.wipRecord).length <= 2 ||
        (!bo.wipRecord.cuttingActual && !bo.wipRecord.sewingComplete && !bo.wipRecord.packedQuantity)
      ) {
        const mockMatch = MOCK_BUYER_ORDERS.find((m) => m.orderNumber === bo.orderNumber || m.id === bo.id);
        if (mockMatch && mockMatch.wipRecord) {
          return {
            ...bo,
            productionTracking: bo.productionTracking || mockMatch.productionTracking,
            wipRecord: mockMatch.wipRecord,
          };
        }
      }
      return bo;
    });
  }

  public getBuyerOrder(idOrPo: string): BuyerOrder | undefined {
    const clean = (idOrPo || '').trim().toLowerCase();
    return this.buyerOrders.find(
      (o) => o.id === idOrPo || o.orderNumber.toLowerCase() === clean
    );
  }

  public upsertBuyerOrder(order: BuyerOrder, user?: UserSession): BuyerOrder {
    const index = this.buyerOrders.findIndex(
      (o) => o.id === order.id || o.orderNumber.toLowerCase() === (order.orderNumber || '').trim().toLowerCase()
    );

    let savedOrder: BuyerOrder;
    if (index >= 0) {
      savedOrder = {
        ...this.buyerOrders[index],
        ...order,
      };
      this.buyerOrders[index] = savedOrder;
    } else {
      savedOrder = {
        ...order,
        id: order.id || `bo-${Date.now().toString().slice(-5)}`,
      };
      this.buyerOrders.unshift(savedOrder);
    }

    this.persistToDisk();

    // Commit to MySQL asynchronously
    mysqlManager.upsertBuyerOrder(savedOrder).catch((err) => {
      console.error('[MySQL Error] Failed upserting buyer order to MySQL:', err);
    });

    if (user) {
      this.addAuditLog({
        action: index >= 0 ? 'UPDATE_BUYER_ORDER' : 'CREATE_BUYER_ORDER',
        entity: 'BuyerOrder',
        entityId: savedOrder.id,
        performedBy: user.name,
        userRole: user.role,
        details: `${index >= 0 ? 'Updated' : 'Created'} PO ${savedOrder.orderNumber} (${savedOrder.buyerName} - ${savedOrder.styleNumber}) with WIP Tracking`,
      });
    }

    this.broadcast({
      type: 'BUYER_ORDER_UPSERTED',
      order: savedOrder,
      user: user?.name || 'System',
      timestamp: new Date().toISOString(),
    });

    return savedOrder;
  }

  public deleteBuyerOrder(id: string, user?: UserSession): boolean {
    const index = this.buyerOrders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (index === -1) return false;

    const removed = this.buyerOrders[index];
    this.buyerOrders.splice(index, 1);
    this.persistToDisk();

    mysqlManager.deleteBuyerOrder(removed.id).catch((err) => {
      console.error('[MySQL Error] Failed deleting buyer order from MySQL:', err);
    });

    if (user) {
      this.addAuditLog({
        action: 'DELETE_BUYER_ORDER',
        entity: 'BuyerOrder',
        entityId: removed.id,
        performedBy: user.name,
        userRole: user.role,
        details: `Deleted PO ${removed.orderNumber} (${removed.buyerName})`,
      });
    }

    this.broadcast({
      type: 'BUYER_ORDER_DELETED',
      id: removed.id,
      orderNumber: removed.orderNumber,
      user: user?.name || 'System',
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // --- Production Records (Floor Output) ---
  public getProductionRecords(): ProductionOrder[] {
    return [...this.productionRecords];
  }

  public upsertProductionRecord(record: ProductionOrder, user?: UserSession): ProductionOrder {
    const index = this.productionRecords.findIndex((r) => r.id === record.id);
    let saved: ProductionOrder;
    if (index >= 0) {
      saved = { ...this.productionRecords[index], ...record };
      this.productionRecords[index] = saved;
    } else {
      saved = { ...record, id: record.id || `pr-${Date.now().toString().slice(-5)}` };
      this.productionRecords.unshift(saved);
    }

    this.persistToDisk();

    mysqlManager.upsertProductionRecord(saved).catch((err) => {
      console.error('[MySQL Error] Failed upserting production record:', err);
    });

    this.broadcast({
      type: 'PRODUCTION_RECORD_UPSERTED',
      record: saved,
      user: user?.name || 'System',
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  public deleteProductionRecord(id: string, user?: UserSession): boolean {
    const index = this.productionRecords.findIndex((r) => r.id === id || r.orderNumber === id);
    if (index === -1) return false;

    const removed = this.productionRecords[index];
    this.productionRecords.splice(index, 1);
    this.persistToDisk();

    mysqlManager.deleteProductionRecord(removed.id).catch((err) => {
      console.error('[MySQL Error] Failed deleting production record from MySQL:', err);
    });

    if (user) {
      this.addAuditLog({
        action: 'DELETE_PRODUCTION_RECORD',
        entity: 'ProductionOrder',
        entityId: removed.id,
        performedBy: user.name,
        userRole: user.role,
        details: `Deleted production record ${removed.orderNumber} (${removed.buyer})`,
      });
    }

    this.broadcast({
      type: 'PRODUCTION_RECORD_DELETED',
      id: removed.id,
      orderNumber: removed.orderNumber,
      user: user?.name || 'System',
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // --- Inventory Operations ---
  public getInventory(): InventoryItem[] {
    return [...this.inventory];
  }

  public getInventoryItem(id: string): InventoryItem | undefined {
    return this.inventory.find((item) => item.id === id);
  }

  public updateInventoryItem(
    id: string,
    updates: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>,
    user: UserSession
  ): InventoryItem {
    const index = this.inventory.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Inventory item with id ${id} not found`);
    }

    const previous = this.inventory[index];
    const updated: InventoryItem = {
      ...previous,
      ...updates,
      updatedBy: user.name,
      lastUpdatedAt: new Date().toISOString(),
    };

    this.inventory[index] = updated;
    this.persistToDisk();

    // Async commit to MySQL
    mysqlManager.upsertInventoryItem(updated).catch((err) => {
      console.error('[MySQL Error] Failed updating inventory item:', err);
    });

    // Log audit
    this.addAuditLog({
      action: 'STOCK_UPDATE',
      entity: 'InventoryItem',
      entityId: id,
      performedBy: user.name,
      userRole: user.role,
      details: `Updated ${Object.keys(updates).join(', ')} on SKU ${updated.sku} (Now ${updated.quantityMeters}m / ${updated.rollCount} rolls)`,
    });

    // Broadcast real-time event to all connected users
    this.broadcast({
      type: 'STOCK_UPDATED',
      item: updated,
      user: user.name,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public batchUpdateGrade(
    ids: string[],
    grade: QualityGrade,
    user: UserSession
  ): InventoryItem[] {
    const updatedItems: InventoryItem[] = [];

    this.inventory = this.inventory.map((item) => {
      if (ids.includes(item.id)) {
        const updated = {
          ...item,
          qualityGrade: grade,
          updatedBy: user.name,
          lastUpdatedAt: new Date().toISOString(),
        };
        updatedItems.push(updated);
        return updated;
      }
      return item;
    });

    this.persistToDisk();

    // Async batch update in MySQL
    mysqlManager.batchUpdateGrade(ids, grade, user.name).catch((err) => {
      console.error('[MySQL Error] Failed batch update in MySQL:', err);
    });

    this.addAuditLog({
      action: 'BATCH_GRADE_UPDATE',
      entity: 'InventoryItem',
      entityId: ids.join(','),
      performedBy: user.name,
      userRole: user.role,
      details: `Batch changed grade to ${grade} for ${ids.length} fabric batches`,
    });

    this.broadcast({
      type: 'BATCH_GRADE_CHANGED',
      ids,
      grade,
      user: user.name,
      timestamp: new Date().toISOString(),
    });

    return updatedItems;
  }

  public addInventoryItem(
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'lastUpdatedAt'>,
    user: UserSession
  ): InventoryItem {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now().toString().slice(-4)}`,
      updatedBy: user.name,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };

    this.inventory.unshift(newItem);
    this.persistToDisk();

    // Async commit to MySQL
    mysqlManager.upsertInventoryItem(newItem).catch((err) => {
      console.error('[MySQL Error] Failed adding inventory item to MySQL:', err);
    });

    this.addAuditLog({
      action: 'ADD_INVENTORY',
      entity: 'InventoryItem',
      entityId: newItem.id,
      performedBy: user.name,
      userRole: user.role,
      details: `Inward stock registered for SKU ${newItem.sku} (${newItem.quantityMeters}m)`,
    });

    this.broadcast({
      type: 'STOCK_UPDATED',
      item: newItem,
      user: user.name,
      timestamp: new Date().toISOString(),
    });

    return newItem;
  }

  // --- QMS Inspection Operations ---
  public getInspections(): InspectionRecord[] {
    return [...this.inspections];
  }

  public addInspection(
    data: Omit<InspectionRecord, 'id' | 'createdAt' | 'inspectionCode'>,
    user: UserSession
  ): InspectionRecord {
    const code = `QMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: InspectionRecord = {
      ...data,
      id: `insp-${Date.now().toString().slice(-4)}`,
      inspectionCode: code,
      inspectorId: user.id,
      inspectorName: user.name,
      createdAt: new Date().toISOString(),
    };

    this.inspections.unshift(newRecord);
    this.persistToDisk();

    // Async commit to MySQL
    mysqlManager.insertInspection(newRecord).catch((err) => {
      console.error('[MySQL Error] Failed inserting inspection to MySQL:', err);
    });

    this.addAuditLog({
      action: 'QMS_INSPECTION',
      entity: 'InspectionRecord',
      entityId: newRecord.id,
      performedBy: user.name,
      userRole: user.role,
      details: `Conducted ${newRecord.stage} inspection (${newRecord.status}) on Lot ${newRecord.lotNumber}`,
    });

    this.broadcast({
      type: 'INSPECTION_RECORDED',
      record: newRecord,
      user: user.name,
      timestamp: new Date().toISOString(),
    });

    return newRecord;
  }

  public updateInspection(
    id: string,
    updates: Partial<InspectionRecord>,
    user: UserSession
  ): InspectionRecord {
    const index = this.inspections.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Inspection record ${id} not found`);
    }

    const updated: InspectionRecord = {
      ...this.inspections[index],
      ...updates,
      id,
    };

    this.inspections[index] = updated;
    this.persistToDisk();

    mysqlManager.insertInspection(updated).catch((err) => {
      console.error('[MySQL Error] Failed updating inspection in MySQL:', err);
    });

    this.addAuditLog({
      action: 'UPDATE_INSPECTION',
      entity: 'InspectionRecord',
      entityId: id,
      performedBy: user.name,
      userRole: user.role,
      details: `Updated ${updated.inspectionType || ''} inspection (${updated.status}) for ${updated.styleNumber}`,
    });

    this.broadcast({
      type: 'INSPECTION_RECORDED',
      record: updated,
      user: user.name,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public deleteInspection(id: string, user: UserSession): boolean {
    const index = this.inspections.findIndex((i) => i.id === id);
    if (index === -1) return false;

    const removed = this.inspections[index];
    this.inspections.splice(index, 1);
    this.persistToDisk();

    this.addAuditLog({
      action: 'DELETE_INSPECTION',
      entity: 'InspectionRecord',
      entityId: id,
      performedBy: user.name,
      userRole: user.role,
      details: `Deleted inspection ${removed.inspectionCode} (${removed.styleNumber})`,
    });

    this.broadcast({
      type: 'INSPECTION_DELETED',
      id,
      user: user.name,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // --- Production Orders ---
  public getProductionOrders(): ProductionOrder[] {
    return [...this.productionOrders];
  }

  // --- Module Data Persistence (Stores any of the 30 QMS modules into MySQL) ---
  public getModuleData<T>(moduleKey: string, fallback: T): T {
    if (this.modulesData && this.modulesData[moduleKey] !== undefined) {
      return this.modulesData[moduleKey] as T;
    }
    return fallback;
  }

  public saveModuleData<T>(moduleKey: string, data: T, user?: UserSession): T {
    this.modulesData[moduleKey] = data;

    if (moduleKey === 'buyer_orders' && Array.isArray(data)) {
      this.buyerOrders = data as BuyerOrder[];
    } else if (moduleKey === 'production_records' && Array.isArray(data)) {
      this.productionRecords = data as ProductionOrder[];
    }

    this.persistToDisk();

    // Async commit to MySQL module_store
    mysqlManager.saveModuleData(moduleKey, data).catch((err) => {
      console.error(`[MySQL Error] Failed saving module "${moduleKey}" to MySQL:`, err);
    });

    if (user) {
      this.addAuditLog({
        action: 'MODULE_DATA_UPDATE',
        entity: moduleKey,
        entityId: moduleKey,
        performedBy: user.name,
        userRole: user.role,
        details: `Updated data for module ${moduleKey}`,
      });
    }

    this.broadcast({
      type: 'MODULE_DATA_UPDATED',
      moduleKey,
      data,
      user: user?.name || 'Central System',
      timestamp: new Date().toISOString(),
    });

    return data;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
    this.persistToDisk();

    // Async commit to MySQL audit_logs
    mysqlManager.insertAuditLog(newLog).catch((err) => {
      console.error('[MySQL Error] Failed inserting audit log to MySQL:', err);
    });
  }

  // --- Aggregated Dashboard Stats ---
  public getDashboardStats() {
    const totalInventoryMeters = this.inventory.reduce((acc, curr) => acc + curr.quantityMeters, 0);
    const totalRolls = this.inventory.reduce((acc, curr) => acc + curr.rollCount, 0);
    const gradeACount = this.inventory.filter((i) => i.qualityGrade === 'GRADE_A').length;
    const gradeAPercentage = this.inventory.length ? ((gradeACount / this.inventory.length) * 100).toFixed(1) : '0.0';

    const recentInspections = this.inspections.slice(0, 10);
    const totalInspectedSamples = recentInspections.reduce((acc, curr) => acc + curr.sampleSize, 0);
    const totalPassed = recentInspections.reduce((acc, curr) => acc + curr.passCount, 0);
    const passRate = totalInspectedSamples ? ((totalPassed / totalInspectedSamples) * 100).toFixed(1) : '98.5';

    const activeOrders = this.productionOrders.filter((po) => po.status === 'RUNNING').length;
    const avgDefectRate = (
      this.productionOrders.reduce((acc, curr) => acc + curr.defectRate, 0) / (this.productionOrders.length || 1)
    ).toFixed(2);

    return {
      totalInventoryMeters,
      totalRolls,
      gradeAPercentage,
      passRate,
      activeOrders,
      avgDefectRate,
      inspectionCount: this.inspections.length,
      itemCount: this.inventory.length,
      buyerOrdersCount: this.buyerOrders.length,
      databaseEngine: this.isMysqlActive() ? 'MySQL Server 8.0+ (Host PC Database)' : 'Local JSON Store (Offline Fallback)',
      isMysqlConnected: this.isMysqlActive(),
      storageFile: this.getStorageFilePath(),
      lastSync: new Date().toISOString(),
    };
  }

  public async resetDatabase(
    mode: 'blank' | 'defaults',
    user?: UserSession
  ): Promise<{ success: boolean; message: string }> {
    if (mode === 'blank') {
      this.inventory = [];
      this.inspections = [];
      this.productionOrders = [];
      this.productionRecords = [];
      this.buyerOrders = [];
      this.modulesData = {};
      this.persistToDisk();

      if (this.isMysqlActive()) {
        await mysqlManager.resetDatabase('blank');
      }

      this.addAuditLog({
        action: 'SYSTEM_RESET_BLANK',
        entity: 'SystemStore',
        entityId: 'global',
        performedBy: user?.name || 'Administrator',
        userRole: user?.role || 'ADMIN',
        details: 'ERP purged to clean slate. All records wiped for fresh live operation.',
      });

      this.broadcast({
        type: 'SYSTEM_RESET',
        mode: 'blank',
        user: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      });

      return { success: true, message: 'ERP completely cleared to a clean slate (0 records).' };
    } else {
      this.buyerOrders = [...MOCK_BUYER_ORDERS];
      this.inventory = [...INITIAL_INVENTORY];
      this.inspections = [...INITIAL_INSPECTIONS];
      this.productionOrders = [...INITIAL_PRODUCTION_ORDERS];
      this.productionRecords = [...INITIAL_PRODUCTION_ORDERS];
      this.persistToDisk();

      if (this.isMysqlActive()) {
        await mysqlManager.resetDatabase('defaults');
        await mysqlManager.seedIfEmpty({
          buyerOrders: this.buyerOrders,
          productionRecords: this.productionRecords,
          inventory: this.inventory,
          inspections: this.inspections,
          productionOrders: this.productionOrders,
          auditLogs: this.auditLogs,
          modulesData: this.modulesData,
        });
      }

      this.addAuditLog({
        action: 'SYSTEM_RESET_DEFAULTS',
        entity: 'SystemStore',
        entityId: 'global',
        performedBy: user?.name || 'Administrator',
        userRole: user?.role || 'ADMIN',
        details: 'ERP restored to factory sample baseline.',
      });

      this.broadcast({
        type: 'SYSTEM_RESET',
        mode: 'defaults',
        user: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      });

      return { success: true, message: 'ERP reset to factory baseline defaults.' };
    }
  }
}

// Global persistent instance in Node runtime
const globalForErp = globalThis as unknown as { erpStore?: ErpDataStore };
if (!globalForErp.erpStore || !(globalForErp.erpStore as any).getBuyerOrders) {
  globalForErp.erpStore = new ErpDataStore();
}
export const erpStore = globalForErp.erpStore;

