import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import {
  InventoryItem,
  InspectionRecord,
  ProductionOrder,
  AuditLog,
  QualityGrade,
} from '../types/erp';

// Parse MySQL connection options from DATABASE_URL or individual env vars
function getMysqlConfig(): PoolOptions {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && (databaseUrl.startsWith('mysql://') || databaseUrl.startsWith('mariadb://'))) {
    try {
      const url = new URL(databaseUrl);
      return {
        host: url.hostname || 'localhost',
        port: url.port ? parseInt(url.port, 10) : 3306,
        user: decodeURIComponent(url.username || 'root'),
        password: decodeURIComponent(url.password || ''),
        database: url.pathname ? url.pathname.replace(/^\//, '') : 'garments_erp',
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      };
    } catch (err) {
      console.warn('[MySQL Client] Failed to parse DATABASE_URL, using environment variables:', err);
    }
  }

  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'garments_erp',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };
}

class MySqlDatabaseManager {
  private pool: Pool | null = null;
  private isConnected: boolean = false;
  private hasInitializedSchema: boolean = false;

  public getPool(): Pool {
    if (!this.pool) {
      const config = getMysqlConfig();
      this.pool = mysql.createPool(config);
    }
    return this.pool;
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const pool = this.getPool();
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      this.isConnected = true;
      return true;
    } catch (err: any) {
      this.isConnected = false;
      return false;
    }
  }

  public getConnectedStatus(): boolean {
    return this.isConnected;
  }

  public async initializeSchema(): Promise<boolean> {
    if (this.hasInitializedSchema) return this.isConnected;

    try {
      // First ensure the database exists by connecting without DB selection if needed
      const baseConfig = getMysqlConfig();
      const dbName = baseConfig.database || 'garments_erp';

      try {
        const rootConnection = await mysql.createConnection({
          host: baseConfig.host,
          port: baseConfig.port,
          user: baseConfig.user,
          password: baseConfig.password,
        });
        await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await rootConnection.end();
      } catch (dbErr: any) {
        // May fail if user lacks CREATE DB permission; continue attempting pool connection
      }

      const pool = this.getPool();

      // 1. Module Store Table (Persists all 30 QMS modules with native JSON)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS module_store (
          module_key VARCHAR(100) NOT NULL PRIMARY KEY,
          data JSON NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. Inventory Items Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          sku VARCHAR(191) NOT NULL UNIQUE,
          style_number VARCHAR(191) NOT NULL,
          fabric_type VARCHAR(191) NOT NULL,
          color VARCHAR(191) NOT NULL,
          batch_lot VARCHAR(191) NOT NULL,
          roll_count INT NOT NULL DEFAULT 1,
          quantity_meters DOUBLE NOT NULL DEFAULT 0,
          quality_grade VARCHAR(50) NOT NULL DEFAULT 'GRADE_A',
          warehouse_location VARCHAR(191) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'IN_STOCK',
          unit_cost DOUBLE NOT NULL DEFAULT 0,
          unit VARCHAR(50) DEFAULT 'Meters',
          category VARCHAR(100) DEFAULT 'FABRIC',
          supplier_name VARCHAR(191),
          po_number VARCHAR(191),
          buyer_order_id VARCHAR(191),
          buyer_name VARCHAR(191),
          bom_item_id VARCHAR(191),
          updated_by VARCHAR(191) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_sku (sku),
          INDEX idx_grade (quality_grade),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 3. Inspection Records Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS inspection_records (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          inspection_code VARCHAR(191) NOT NULL UNIQUE,
          style_number VARCHAR(191) NOT NULL,
          lot_number VARCHAR(191) NOT NULL,
          stage VARCHAR(100) NOT NULL,
          sample_size INT NOT NULL,
          pass_count INT NOT NULL,
          defect_count INT NOT NULL,
          major_defects INT NOT NULL DEFAULT 0,
          minor_defects INT NOT NULL DEFAULT 0,
          critical_defects INT NOT NULL DEFAULT 0,
          status VARCHAR(50) NOT NULL DEFAULT 'PASSED',
          inspector_id VARCHAR(191) NOT NULL,
          inspector_name VARCHAR(191) NOT NULL,
          buyer VARCHAR(191) NOT NULL,
          defects JSON,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_code (inspection_code),
          INDEX idx_status (status),
          INDEX idx_stage (stage)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 4. Production Orders Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS production_orders (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          order_number VARCHAR(191) NOT NULL UNIQUE,
          buyer VARCHAR(191) NOT NULL,
          style_name VARCHAR(191) NOT NULL,
          target_quantity INT NOT NULL,
          completed_quantity INT NOT NULL DEFAULT 0,
          sewing_line VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
          defect_rate DOUBLE NOT NULL DEFAULT 1.2,
          start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          due_date DATETIME NOT NULL,
          INDEX idx_order_num (order_number),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 5. Audit Logs Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          action VARCHAR(100) NOT NULL,
          entity VARCHAR(100) NOT NULL,
          entity_id VARCHAR(191) NOT NULL,
          performed_by VARCHAR(191) NOT NULL,
          user_role VARCHAR(100) NOT NULL,
          timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          details TEXT,
          INDEX idx_entity (entity, entity_id),
          INDEX idx_timestamp (timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      this.isConnected = true;
      this.hasInitializedSchema = true;
      console.log(`[MySQL Host] Connected successfully to MySQL database "${dbName}". Tables verified.`);
      return true;
    } catch (err: any) {
      this.isConnected = false;
      console.warn(`[MySQL Host] MySQL unavailable (${err.message}). Operating in Local JSON Fallback Mode.`);
      return false;
    }
  }

  // --- Seed MySQL with Existing Data if Empty ---
  public async seedIfEmpty(seedData: {
    inventory: InventoryItem[];
    inspections: InspectionRecord[];
    productionOrders: ProductionOrder[];
    auditLogs: AuditLog[];
    modulesData?: Record<string, any>;
  }): Promise<void> {
    if (!this.isConnected) return;

    try {
      const pool = this.getPool();

      // Check if inventory has records
      const [invRows]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM inventory_items');
      if (invRows[0]?.count === 0 && seedData.inventory.length > 0) {
        console.log(`[MySQL Host] Seeding ${seedData.inventory.length} inventory items into MySQL...`);
        for (const item of seedData.inventory) {
          await this.upsertInventoryItem(item);
        }
      }

      // Check if inspections have records
      const [inspRows]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM inspection_records');
      if (inspRows[0]?.count === 0 && seedData.inspections.length > 0) {
        console.log(`[MySQL Host] Seeding ${seedData.inspections.length} inspections into MySQL...`);
        for (const insp of seedData.inspections) {
          await this.insertInspection(insp);
        }
      }

      // Check production orders
      const [poRows]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM production_orders');
      if (poRows[0]?.count === 0 && seedData.productionOrders.length > 0) {
        console.log(`[MySQL Host] Seeding ${seedData.productionOrders.length} production orders into MySQL...`);
        for (const po of seedData.productionOrders) {
          await pool.query(
            `INSERT IGNORE INTO production_orders 
              (id, order_number, buyer, style_name, target_quantity, completed_quantity, sewing_line, status, defect_rate, start_date, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              po.id,
              po.orderNumber,
              po.buyer,
              po.styleName,
              po.targetQuantity,
              po.completedQuantity,
              po.sewingLine,
              po.status,
              po.defectRate,
              new Date(po.createdAt || Date.now()),
              new Date(po.dueDate || Date.now() + 14 * 86400000),
            ]
          );
        }
      }

      // Check module_store
      if (seedData.modulesData && Object.keys(seedData.modulesData).length > 0) {
        for (const [key, data] of Object.entries(seedData.modulesData)) {
          const [modRows]: [any[], any] = await pool.query(
            'SELECT module_key FROM module_store WHERE module_key = ?',
            [key]
          );
          if (modRows.length === 0) {
            await this.saveModuleData(key, data);
          }
        }
      }

      console.log('[MySQL Host] Initial database verification and seeding complete.');
    } catch (err) {
      console.error('[MySQL Host] Error during seed:', err);
    }
  }

  // --- Inventory Operations ---
  public async loadInventory(): Promise<InventoryItem[]> {
    if (!this.isConnected) return [];
    try {
      const pool = this.getPool();
      const [rows]: [any[], any] = await pool.query(
        'SELECT * FROM inventory_items ORDER BY last_updated_at DESC'
      );
      return rows.map((r) => ({
        id: r.id,
        sku: r.sku,
        styleNumber: r.style_number,
        fabricType: r.fabric_type,
        color: r.color,
        batchLot: r.batch_lot,
        rollCount: r.roll_count,
        quantityMeters: r.quantity_meters,
        qualityGrade: r.quality_grade as QualityGrade,
        warehouseLocation: r.warehouse_location,
        status: r.status,
        unitCost: r.unit_cost,
        unit: r.unit,
        category: r.category,
        supplierName: r.supplier_name,
        poNumber: r.po_number,
        buyerOrderId: r.buyer_order_id,
        buyerName: r.buyer_name,
        bomItemId: r.bom_item_id,
        updatedBy: r.updated_by,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        lastUpdatedAt: r.last_updated_at ? new Date(r.last_updated_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[MySQL Host] Error loading inventory from MySQL:', err);
      return [];
    }
  }

  public async upsertInventoryItem(item: InventoryItem): Promise<void> {
    if (!this.isConnected) return;
    try {
      const pool = this.getPool();
      const sql = `
        INSERT INTO inventory_items (
          id, sku, style_number, fabric_type, color, batch_lot, roll_count, quantity_meters,
          quality_grade, warehouse_location, status, unit_cost, unit, category, supplier_name,
          po_number, buyer_order_id, buyer_name, bom_item_id, updated_by, created_at, last_updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          style_number = VALUES(style_number),
          fabric_type = VALUES(fabric_type),
          color = VALUES(color),
          batch_lot = VALUES(batch_lot),
          roll_count = VALUES(roll_count),
          quantity_meters = VALUES(quantity_meters),
          quality_grade = VALUES(quality_grade),
          warehouse_location = VALUES(warehouse_location),
          status = VALUES(status),
          unit_cost = VALUES(unit_cost),
          unit = VALUES(unit),
          category = VALUES(category),
          supplier_name = VALUES(supplier_name),
          po_number = VALUES(po_number),
          buyer_order_id = VALUES(buyer_order_id),
          buyer_name = VALUES(buyer_name),
          bom_item_id = VALUES(bom_item_id),
          updated_by = VALUES(updated_by),
          last_updated_at = NOW();
      `;

      await pool.query(sql, [
        item.id,
        item.sku,
        item.styleNumber,
        item.fabricType,
        item.color,
        item.batchLot,
        item.rollCount,
        item.quantityMeters,
        item.qualityGrade,
        item.warehouseLocation,
        item.status,
        item.unitCost,
        item.unit || 'Meters',
        item.category || 'FABRIC',
        item.supplierName || null,
        item.poNumber || null,
        item.buyerOrderId || null,
        item.buyerName || null,
        item.bomItemId || null,
        item.updatedBy,
        new Date(item.createdAt || Date.now()),
        new Date(item.lastUpdatedAt || Date.now()),
      ]);
    } catch (err) {
      console.error('[MySQL Host] Failed to upsert inventory item to MySQL:', err);
    }
  }

  public async batchUpdateGrade(ids: string[], grade: QualityGrade, updatedBy: string): Promise<void> {
    if (!this.isConnected || ids.length === 0) return;
    try {
      const pool = this.getPool();
      await pool.query(
        `UPDATE inventory_items SET quality_grade = ?, updated_by = ?, last_updated_at = NOW() WHERE id IN (?)`,
        [grade, updatedBy, ids]
      );
    } catch (err) {
      console.error('[MySQL Host] Failed batch grade update in MySQL:', err);
    }
  }

  // --- QMS Inspections Operations ---
  public async loadInspections(): Promise<InspectionRecord[]> {
    if (!this.isConnected) return [];
    try {
      const pool = this.getPool();
      const [rows]: [any[], any] = await pool.query(
        'SELECT * FROM inspection_records ORDER BY created_at DESC'
      );
      return rows.map((r) => ({
        id: r.id,
        inspectionCode: r.inspection_code,
        styleNumber: r.style_number,
        lotNumber: r.lot_number,
        stage: r.stage,
        sampleSize: r.sample_size,
        passCount: r.pass_count,
        defectCount: r.defect_count,
        majorDefects: r.major_defects,
        minorDefects: r.minor_defects,
        criticalDefects: r.critical_defects,
        status: r.status,
        inspectorId: r.inspector_id,
        inspectorName: r.inspector_name,
        buyer: r.buyer,
        defects: typeof r.defects === 'string' ? JSON.parse(r.defects) : r.defects || [],
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[MySQL Host] Error loading inspections from MySQL:', err);
      return [];
    }
  }

  public async insertInspection(record: InspectionRecord): Promise<void> {
    if (!this.isConnected) return;
    try {
      const pool = this.getPool();
      const sql = `
        INSERT INTO inspection_records (
          id, inspection_code, style_number, lot_number, stage, sample_size,
          pass_count, defect_count, major_defects, minor_defects, critical_defects,
          status, inspector_id, inspector_name, buyer, defects, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          pass_count = VALUES(pass_count),
          defect_count = VALUES(defect_count),
          updated_at = NOW();
      `;

      await pool.query(sql, [
        record.id,
        record.inspectionCode,
        record.styleNumber,
        record.lotNumber,
        record.stage,
        record.sampleSize,
        record.passCount,
        record.defectCount,
        record.majorDefects || 0,
        record.minorDefects || 0,
        record.criticalDefects || 0,
        record.status,
        record.inspectorId,
        record.inspectorName,
        record.buyer,
        JSON.stringify(record.defects || []),
        new Date(record.createdAt || Date.now()),
      ]);
    } catch (err) {
      console.error('[MySQL Host] Failed inserting inspection to MySQL:', err);
    }
  }

  // --- Production Orders Operations ---
  public async loadProductionOrders(): Promise<ProductionOrder[]> {
    if (!this.isConnected) return [];
    try {
      const pool = this.getPool();
      const [rows]: [any[], any] = await pool.query(
        'SELECT * FROM production_orders ORDER BY start_date DESC'
      );
      return rows.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        buyer: r.buyer,
        styleName: r.style_name,
        targetQuantity: r.target_quantity,
        completedQuantity: r.completed_quantity,
        sewingLine: r.sewing_line,
        status: r.status,
        defectRate: r.defect_rate,
        createdAt: r.start_date ? new Date(r.start_date).toISOString() : new Date().toISOString(),
        dueDate: r.due_date ? new Date(r.due_date).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[MySQL Host] Error loading production orders from MySQL:', err);
      return [];
    }
  }

  // --- Audit Logs Operations ---
  public async loadAuditLogs(): Promise<AuditLog[]> {
    if (!this.isConnected) return [];
    try {
      const pool = this.getPool();
      const [rows]: [any[], any] = await pool.query(
        'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200'
      );
      return rows.map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity,
        entityId: r.entity_id,
        performedBy: r.performed_by,
        userRole: r.user_role,
        timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
        details: r.details,
      }));
    } catch (err) {
      console.error('[MySQL Host] Error loading audit logs from MySQL:', err);
      return [];
    }
  }

  public async insertAuditLog(log: AuditLog): Promise<void> {
    if (!this.isConnected) return;
    try {
      const pool = this.getPool();
      await pool.query(
        `INSERT INTO audit_logs (id, action, entity, entity_id, performed_by, user_role, timestamp, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.action,
          log.entity,
          log.entityId,
          log.performedBy,
          log.userRole,
          new Date(log.timestamp || Date.now()),
          log.details || null,
        ]
      );
    } catch (err) {
      console.error('[MySQL Host] Failed inserting audit log to MySQL:', err);
    }
  }

  // --- Module Store (All 30 Modules Persistence) ---
  public async loadAllModulesData(): Promise<Record<string, any>> {
    if (!this.isConnected) return {};
    try {
      const pool = this.getPool();
      const [rows]: [any[], any] = await pool.query('SELECT module_key, data FROM module_store');
      const result: Record<string, any> = {};
      for (const row of rows) {
        result[row.module_key] = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      }
      return result;
    } catch (err) {
      console.error('[MySQL Host] Error loading module data from MySQL:', err);
      return {};
    }
  }

  public async loadModuleData<T>(moduleKey: string, fallback: T): Promise<T> {
    if (!this.isConnected) return fallback;
    try {
      const pool = this.getPool();
      const [rows]: [any[], any] = await pool.query(
        'SELECT data FROM module_store WHERE module_key = ? LIMIT 1',
        [moduleKey]
      );
      if (rows.length > 0 && rows[0].data !== null && rows[0].data !== undefined) {
        return (typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data) as T;
      }
      return fallback;
    } catch (err) {
      console.error(`[MySQL Host] Error loading module "${moduleKey}" from MySQL:`, err);
      return fallback;
    }
  }

  public async saveModuleData<T>(moduleKey: string, data: T): Promise<void> {
    if (!this.isConnected) return;
    try {
      const pool = this.getPool();
      const jsonString = JSON.stringify(data);
      await pool.query(
        `INSERT INTO module_store (module_key, data, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
        [moduleKey, jsonString]
      );
    } catch (err) {
      console.error(`[MySQL Host] Failed saving module "${moduleKey}" to MySQL:`, err);
    }
  }
}

// Global persistent manager instance
const globalForMysql = globalThis as unknown as { mysqlManager?: MySqlDatabaseManager };
export const mysqlManager = globalForMysql.mysqlManager ?? new MySqlDatabaseManager();
if (process.env.NODE_ENV !== 'production') {
  globalForMysql.mysqlManager = mysqlManager;
}
