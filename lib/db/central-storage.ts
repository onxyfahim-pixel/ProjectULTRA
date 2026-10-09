import fs from 'fs';
import path from 'path';
import {
  InventoryItem,
  InspectionRecord,
  ProductionOrder,
  AuditLog,
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
}

// Data directory on the host PC
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'erp-central-store.json');

export class CentralStorageManager {
  private static isInitialized = false;

  private static ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
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
