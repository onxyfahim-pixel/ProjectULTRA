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
              const isOrderMismatch = !existing.orderNumber || existing.orderNumber !== initInsp.orderNumber;
              const isLineMismatch = existing.lineId !== initInsp.lineId;
              const isQtyMissing =
                existing.lotQuantity === undefined ||
                existing.orderQuantity === undefined ||
                existing.excessQuantity === undefined ||
                existing.shortQuantity === undefined;

              if (isOrderMismatch || isLineMismatch || isQtyMissing || existing.status !== initInsp.status) {
                Object.assign(existing, {
                  orderNumber: initInsp.orderNumber,
                  poNumbers: initInsp.poNumbers,
                  buyer: initInsp.buyer,
                  styleNumber: initInsp.styleNumber,
                  styleDescription: initInsp.styleDescription,
                  sewingLine: initInsp.sewingLine,
                  lineId: initInsp.lineId,
                  stage: initInsp.stage,
                  inspectionType: initInsp.inspectionType || existing.inspectionType,
                  orderQuantity: initInsp.orderQuantity,
                  lotQuantity: initInsp.lotQuantity,
                  excessQuantity: initInsp.excessQuantity,
                  shortQuantity: initInsp.shortQuantity,
                  quantityVariance: initInsp.quantityVariance,
                  status: initInsp.status,
                  cartonCount: initInsp.cartonCount ?? existing.cartonCount,
                  packedPercent: initInsp.packedPercent ?? existing.packedPercent,
                  sizeBreakdown: existing.sizeBreakdown && existing.sizeBreakdown.length > 0 ? existing.sizeBreakdown : initInsp.sizeBreakdown,
                  combinedOrders: existing.combinedOrders && existing.combinedOrders.length > 0 ? existing.combinedOrders : initInsp.combinedOrders,
                });
                needsUpdate = true;
              }
            }
          });

          // 3. For any remaining inspections without explicit quantities, reconcile from sizeBreakdown or PO
          parsed.inspections.forEach((r) => {
            let changed = false;
            if (!r.orderNumber && (r as any).poNumber) {
              r.orderNumber = (r as any).poNumber;
              changed = true;
            }
            if (r.orderQuantity === undefined || r.orderQuantity === null || r.orderQuantity === 0) {
              if (r.sizeBreakdown && r.sizeBreakdown.length > 0) {
                r.orderQuantity = r.sizeBreakdown.reduce((sum, s) => sum + (Number(s.orderQuantity) || 0), 0);
              } else if (r.combinedOrders && r.combinedOrders.length > 0) {
                r.orderQuantity = r.combinedOrders.reduce((sum, c) => sum + (Number(c.orderQuantity) || 0), 0);
              } else {
                const po = r.orderNumber || (r as any).poNumber;
                if (po === 'PO-HM-99201') r.orderQuantity = 45000;
                else if (po === 'PO-ZARA-4482' || po?.includes('PO-ZR')) r.orderQuantity = 28000;
                else if (po === 'PO-PVH-7729' || po === 'PO-TH-1190') r.orderQuantity = 32000;
                else if (po === 'PO-LEV-1109' || po === 'PO-LS-5519') r.orderQuantity = 15000;
                else if (po === 'PO-DEC-3310') r.orderQuantity = 60000;
                else r.orderQuantity = 10000;
              }
              changed = true;
            }
            if (r.lotQuantity === undefined || r.lotQuantity === null || r.lotQuantity === 0) {
              if (r.sizeBreakdown && r.sizeBreakdown.length > 0) {
                r.lotQuantity = r.sizeBreakdown.reduce((sum, s) => sum + (Number(s.inspectedQuantity) || 0), 0);
              } else {
                const st = r.inspectionType || (r.stage === 'FINISHING_PACKING' ? 'FINAL' : 'INLINE');
                if (st === 'FINAL') {
                  r.lotQuantity = r.orderQuantity;
                } else if (st === 'PRE_FINAL') {
                  r.lotQuantity = Math.round(r.orderQuantity * 0.7);
                } else {
                  r.lotQuantity = Math.round(r.orderQuantity * 0.3);
                }
              }
              changed = true;
            }
            const diff = (r.lotQuantity || 0) - (r.orderQuantity || 0);
            if (r.excessQuantity === undefined || r.shortQuantity === undefined || r.quantityVariance === undefined) {
              r.excessQuantity = diff > 0 ? diff : 0;
              r.shortQuantity = diff < 0 ? Math.abs(diff) : 0;
              r.quantityVariance = diff;
              changed = true;
            }
            if (changed) needsUpdate = true;
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
