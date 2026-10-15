import fs from 'fs';
import path from 'path';
import {
  InventoryItem,
  InspectionRecord,
  ProductionOrder,
  AuditLog,
  AttachmentRecord,
} from '../types/erp';
import {
  INITIAL_INVENTORY,
  INITIAL_INSPECTIONS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_AUDIT_LOGS,
} from './mock-data';

export interface CentralErpData {
  version: number;
  lastSavedAt: string;
  hostSystem: string;
  inventory: InventoryItem[];
  inspections: InspectionRecord[];
  productionOrders: ProductionOrder[];
  auditLogs: AuditLog[];
  modulesData: Record<string, any>;
  attachments?: AttachmentRecord[];
}

// Data directory on the host PC
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'erp-central-store.json');

export class CentralStorageManager {
  private static isInitialized = false;

  private static ensureDirectory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
      // In serverless read-only environment, ignore
    }
  }

  public static getDataFilePath(): string {
    return DATA_FILE;
  }

  public static loadCentralData(): CentralErpData {
    this.ensureDirectory();

    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as CentralErpData;
        if (
          Array.isArray(parsed.inventory) &&
          Array.isArray(parsed.inspections) &&
          Array.isArray(parsed.productionOrders)
        ) {
          let needsUpdate = false;

          // 1. Ensure all INITIAL_PRODUCTION_ORDERS are present and synced with standard sections/lines/orders
          const existingPoMap = new Map(parsed.productionOrders.map((p) => [p.id, p]));
          INITIAL_PRODUCTION_ORDERS.forEach((initOrd) => {
            const existing = existingPoMap.get(initOrd.id);
            if (!existing) {
              parsed.productionOrders.push(initOrd);
              needsUpdate = true;
            } else {
              // Ensure orderNumber, buyer, style, section, line and valid recordDate are synced
              const isSectionMismatch = existing.section !== initOrd.section;
              const isLineMismatch = existing.lineId !== initOrd.lineId;
              const isOrderMismatch = existing.orderNumber !== initOrd.orderNumber;
              const isDateEmpty = !existing.recordDate || existing.recordDate === '';
              if (isSectionMismatch || isLineMismatch || isOrderMismatch || isDateEmpty) {
                Object.assign(existing, {
                  orderNumber: initOrd.orderNumber,
                  buyer: initOrd.buyer,
                  styleName: initOrd.styleName,
                  styleNumber: initOrd.styleNumber,
                  unit: initOrd.unit,
                  section: initOrd.section,
                  sewingLine: initOrd.sewingLine,
                  lineId: initOrd.lineId,
                  recordDate: initOrd.recordDate || existing.recordDate,
                  hourlyReports: existing.hourlyReports && existing.hourlyReports.length > 0 ? existing.hourlyReports : initOrd.hourlyReports,
                  top3Defects: existing.top3Defects && existing.top3Defects.length > 0 ? existing.top3Defects : initOrd.top3Defects,
                });
                needsUpdate = true;
              }
            }
          });

          // 2. Ensure all INITIAL_INSPECTIONS are present and synced
          const existingInspMap = new Map(parsed.inspections.map((i) => [i.id, i]));
          INITIAL_INSPECTIONS.forEach((initInsp) => {
            const existing = existingInspMap.get(initInsp.id);
            if (!existing) {
              parsed.inspections.push(initInsp);
              needsUpdate = true;
            } else {
              const isOrderMismatch = existing.orderNumber !== initInsp.orderNumber;
              const isLineMismatch = existing.lineId !== initInsp.lineId;
              if (isOrderMismatch || isLineMismatch) {
                Object.assign(existing, {
                  orderNumber: initInsp.orderNumber,
                  poNumbers: initInsp.poNumbers,
                  buyer: initInsp.buyer,
                  styleNumber: initInsp.styleNumber,
                  styleDescription: initInsp.styleDescription,
                  sewingLine: initInsp.sewingLine,
                  lineId: initInsp.lineId,
                  stage: initInsp.stage,
                });
                needsUpdate = true;
              }
            }
          });

          if (needsUpdate) {
            this.saveCentralData(parsed);
          }

          return parsed;
        }
      } catch (err) {
        console.error('Failed reading existing ERP database file, resetting from seed:', err);
      }
    }

    // Default initial seed data if not yet created or corrupted
    const initialData: CentralErpData = {
      version: 1,
      lastSavedAt: new Date().toISOString(),
      hostSystem: 'Garments QMS ERP Host Center',
      inventory: [...INITIAL_INVENTORY],
      inspections: [...INITIAL_INSPECTIONS],
      productionOrders: [...INITIAL_PRODUCTION_ORDERS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      modulesData: {},
    };

    this.saveCentralData(initialData);
    return initialData;
  }

  public static saveCentralData(data: CentralErpData): void {
    try {
      this.ensureDirectory();
      const updatedData: CentralErpData = {
        ...data,
        lastSavedAt: new Date().toISOString(),
      };

      const content = JSON.stringify(updatedData, null, 2);
      try {
        fs.writeFileSync(DATA_FILE, content, 'utf-8');
      } catch {
        // Fallback with temp file if directly locked
        const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
        fs.writeFileSync(tempFile, content, 'utf-8');
        try {
          fs.copyFileSync(tempFile, DATA_FILE);
          fs.unlinkSync(tempFile);
        } catch {
          // Ignore transient lock during concurrent static generation
        }
      }
    } catch (err) {
      console.warn('Warning: Could not save ERP data to central host disk:', err);
    }
  }
}
