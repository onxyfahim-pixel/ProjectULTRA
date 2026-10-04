import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import {
  InventoryItem,
  InspectionRecord,
  ProductionOrder,
  AuditLog,
  QualityGrade,
} from '../types/erp';
import { BuyerOrder } from '../types/modules';

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
        connectionLimit: 20,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 8000,
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
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 8000,
  };
}

export interface TableStat {
  name: string;
  rowCount: number;
  engine: string;
  status: 'READY' | 'EMPTY' | 'NOT_CREATED';
  lastUpdated?: string;
}

export class MySqlDatabaseManager {
  private pool: Pool | null = null;
  private currentConfig: PoolOptions | null = null;
  private isConnected: boolean = false;
  private hasInitializedSchema: boolean = false;
  private lastPingMs: number | null = null;
  private lastCheckedAt: string | null = null;
  private serverVersion: string = '';

  public getConfig(): PoolOptions {
    if (!this.currentConfig) {
      this.currentConfig = getMysqlConfig();
    }
    return this.currentConfig;
  }

  public getPool(): Pool {
    if (!this.pool) {
      this.currentConfig = this.getConfig();
      this.pool = mysql.createPool(this.currentConfig);
    }
    return this.pool;
  }

  public async updateConfig(newConfig: Partial<PoolOptions>): Promise<boolean> {
    if (this.pool) {
      try {
        await this.pool.end();
      } catch (err) {
        console.warn('[MySQL] Error closing previous pool:', err);
      }
      this.pool = null;
    }

    const base = this.getConfig();
    this.currentConfig = {
      ...base,
      ...newConfig,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 8000,
    };

    this.hasInitializedSchema = false;
    return this.checkConnection();
  }

  public async testCustomConnection(config: {
    host: string;
    port: number;
    user: string;
    password?: string;
    database?: string;
  }): Promise<{
    success: boolean;
    latencyMs?: number;
    serverVersion?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const conn = await mysql.createConnection({
        host: config.host || 'localhost',
        port: Number(config.port) || 3306,
        user: config.user || 'root',
        password: config.password || '',
        connectTimeout: 4000,
      });

      const [verRows]: [any[], any] = await conn.query('SELECT VERSION() as version');
      const version = verRows[0]?.version || 'MySQL 8.0';
      await conn.end();

      const latencyMs = Date.now() - startTime;
      return { success: true, latencyMs, serverVersion: version };
    } catch (err: any) {
      let friendlyMsg = err.message || 'Connection failed';
      if (err.code === 'ECONNREFUSED') {
        friendlyMsg = `Connection refused on ${config.host}:${config.port}. MySQL Server is not running. Please start MySQL (e.g. from XAMPP Control Panel or Windows Services).`;
      } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        friendlyMsg = `Access denied for user '${config.user}'. Check your MySQL password. (For default XAMPP, password is empty. For MySQL Server, default is often 'root' or 'password').`;
      } else if (err.code === 'ETIMEDOUT') {
        friendlyMsg = `Connection timed out connecting to ${config.host}:${config.port}. Check firewall or host address.`;
      }
      return { success: false, error: friendlyMsg };
    }
  }

  public async checkConnection(): Promise<boolean> {
    const startTime = Date.now();
    try {
      const pool = this.getPool();
      const connection = await pool.getConnection();
      await connection.ping();

      const [verRows]: [any[], any] = await connection.query('SELECT VERSION() as version');
      if (verRows && verRows[0]?.version) {
        this.serverVersion = verRows[0].version;
      }

      connection.release();
      this.isConnected = true;
      this.lastPingMs = Date.now() - startTime;
      this.lastCheckedAt = new Date().toISOString();
      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.lastPingMs = null;
      this.lastCheckedAt = new Date().toISOString();
      return false;
    }
  }

  public getConnectedStatus(): boolean {
    return this.isConnected;
  }

  public getTelemetry() {
    const config = this.getConfig();
    return {
      isConnected: this.isConnected,
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user || 'root',
      database: config.database || 'garments_erp',
      latencyMs: this.lastPingMs,
      serverVersion: this.serverVersion || 'MySQL Server (Host PC)',
      lastCheckedAt: this.lastCheckedAt,
    };
  }

  public async initializeSchema(): Promise<boolean> {
    if (this.hasInitializedSchema && this.isConnected) return true;

    try {
      const baseConfig = this.getConfig();
      const dbName = (baseConfig.database as string) || 'garments_erp';

      // Ensure database exists
      try {
        const rootConnection = await mysql.createConnection({
          host: baseConfig.host,
          port: baseConfig.port,
          user: baseConfig.user,
          password: baseConfig.password,
          connectTimeout: 5000,
        });
        await rootConnection.query(
          `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
        );
        await rootConnection.end();
      } catch (dbErr: any) {
        // Continue if creation fails due to permissions or database already existing
      }

      const pool = this.getPool();

      // 1. Module Store Table (Persists all 30 QMS modules)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS module_store (
          module_key VARCHAR(100) NOT NULL PRIMARY KEY,
          data JSON NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. Buyer Orders Table (Comprehensive order details + 9-Stage WIP Record)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS buyer_orders (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          order_number VARCHAR(191) NOT NULL UNIQUE,
          buyer_name VARCHAR(191) NOT NULL,
          brand VARCHAR(191) DEFAULT '',
          style_number VARCHAR(191) NOT NULL,
          style_description TEXT,
          season VARCHAR(100) DEFAULT '',
          order_quantity INT NOT NULL DEFAULT 0,
          fob_price DOUBLE NOT NULL DEFAULT 0,
          currency VARCHAR(20) DEFAULT 'USD',
          ship_date VARCHAR(50),
          cutting_start_date VARCHAR(50),
          status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
          quality_standard VARCHAR(100) DEFAULT 'AQL 2.5',
          product_image TEXT,
          merchandiser_name VARCHAR(191),
          merchandiser_email VARCHAR(191),
          merchandiser_phone VARCHAR(191),
          smv DOUBLE DEFAULT 0,
          production_target INT DEFAULT 0,
          daily_target INT DEFAULT 0,
          production_tracking JSON,
          wip_record JSON,
          bom_items JSON,
          logistics JSON,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_bo_order (order_number),
          INDEX idx_bo_buyer (buyer_name),
          INDEX idx_bo_style (style_number),
          INDEX idx_bo_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 3. Production Records Table (Floor daily & hourly outputs)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS production_records (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          order_number VARCHAR(191) NOT NULL,
          style_name VARCHAR(191) NOT NULL,
          buyer VARCHAR(191) NOT NULL,
          sewing_line VARCHAR(100) NOT NULL,
          line_id VARCHAR(100),
          section VARCHAR(100) DEFAULT 'SEWING',
          record_date VARCHAR(50),
          target_quantity INT NOT NULL DEFAULT 0,
          completed_quantity INT NOT NULL DEFAULT 0,
          total_defects INT NOT NULL DEFAULT 0,
          defect_rate DOUBLE NOT NULL DEFAULT 0,
          dhu_rate DOUBLE DEFAULT 0,
          rft_rate DOUBLE DEFAULT 100,
          hourly_reports JSON,
          quality_inspector VARCHAR(191),
          status VARCHAR(50) DEFAULT 'RUNNING',
          remarks TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pr_order (order_number),
          INDEX idx_pr_line (sewing_line),
          INDEX idx_pr_section (section),
          INDEX idx_pr_date (record_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 4. Planning & IE Records Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS planning_records (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          po_number VARCHAR(191) NOT NULL UNIQUE,
          style_number VARCHAR(191) NOT NULL,
          buyer_name VARCHAR(191) NOT NULL,
          order_quantity INT NOT NULL DEFAULT 0,
          smv DOUBLE NOT NULL DEFAULT 0,
          target_efficiency DOUBLE NOT NULL DEFAULT 65.0,
          planned_lines JSON,
          critical_path JSON,
          operations_breakdown JSON,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pl_po (po_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 5. Inventory Items Table
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
          INDEX idx_inv_sku (sku),
          INDEX idx_inv_grade (quality_grade),
          INDEX idx_inv_status (status),
          INDEX idx_inv_po (po_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 6. Inspection Records Table
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
          inspection_type VARCHAR(100),
          po_number VARCHAR(191),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ir_code (inspection_code),
          INDEX idx_ir_status (status),
          INDEX idx_ir_stage (stage),
          INDEX idx_ir_po (po_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 7. Production Orders Table (Running lines summary)
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
          INDEX idx_po_num (order_number),
          INDEX idx_po_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 8. Audit Logs Table
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
          INDEX idx_al_entity (entity, entity_id),
          INDEX idx_al_timestamp (timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 9. Users Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          username VARCHAR(191) NOT NULL UNIQUE,
          email VARCHAR(191) NOT NULL UNIQUE,
          name VARCHAR(191) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'WAREHOUSE_INSPECTOR',
          department VARCHAR(100) NOT NULL DEFAULT 'Quality Assurance',
          avatar_url VARCHAR(255),
          is_super_admin BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 10. Database Migrations Ledger
      await pool.query(`
        CREATE TABLE IF NOT EXISTS database_migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL,
          batch INT NOT NULL DEFAULT 1,
          executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      this.isConnected = true;
      this.hasInitializedSchema = true;
      console.log(`[MySQL Host] Connected successfully to MySQL database "${dbName}". All relational tables verified.`);
      return true;
    } catch (err: any) {
      this.isConnected = false;
      console.warn(`[MySQL Host] MySQL unavailable (${err.message}). Local cache active.`);
      return false;
    }
  }

  // --- Table Statistics & Health ---
  public async getTableStatistics(): Promise<TableStat[]> {
    if (!this.isConnected) return [];
    try {
      const pool = this.getPool();
      const tables = [
        'buyer_orders',
        'production_records',
        'inspection_records',
        'inventory_items',
        'production_orders',
        'planning_records',
        'audit_logs',
        'users',
        'module_store',
      ];

      const stats: TableStat[] = [];
      for (const t of tables) {
        try {
          const [rows]: [any[], any] = await pool.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
          const count = rows[0]?.cnt || 0;
          stats.push({
            name: t,
            rowCount: Number(count),
            engine: 'InnoDB',
            status: count > 0 ? 'READY' : 'EMPTY',
            lastUpdated: new Date().toISOString(),
          });
        } catch {
          stats.push({
            name: t,
            rowCount: 0,
            engine: 'InnoDB',
            status: 'NOT_CREATED',
          });
        }
      }
      return stats;
    } catch (err) {
      console.error('[MySQL Host] Error getting table statistics:', err);
      return [];
    }
  }

  // --- Buyer Orders (With WIP Record) ---
  public async loadBuyerOrders(): Promise<BuyerOrder[]> {
    if (!this.isConnected) return [];
    try {
      const pool = this.getPool();
      const [rows]: [any[], any] = await pool.query(
        'SELECT * FROM buyer_orders ORDER BY created_at DESC'
      );
      return rows.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        buyerName: r.buyer_name,
        brand: r.brand || '',
        styleNumber: r.style_number,
        styleDescription: r.style_description || '',
        season: r.season || '',
        orderQuantity: Number(r.order_quantity) || 0,
        fobPrice: Number(r.fob_price) || 0,
        currency: r.currency || 'USD',
        shipDate: r.ship_date || '',
        cuttingStartDate: r.cutting_start_date || '',
        status: r.status,
        qualityStandard: r.quality_standard || 'AQL 2.5',
        productImage: r.product_image || undefined,
        merchandiserName: r.merchandiser_name || undefined,
        merchandiserEmail: r.merchandiser_email || undefined,
        merchandiserPhone: r.merchandiser_phone || undefined,
        smv: Number(r.smv) || 0,
        productionTarget: Number(r.production_target) || 0,
        dailyTarget: Number(r.daily_target) || 0,
        productionTracking: typeof r.production_tracking === 'string' ? JSON.parse(r.production_tracking) : r.production_tracking,
        wipRecord: typeof r.wip_record === 'string' ? JSON.parse(r.wip_record) : r.wip_record,
        bomItems: typeof r.bom_items === 'string' ? JSON.parse(r.bom_items) : r.bom_items,
        logistics: typeof r.logistics === 'string' ? JSON.parse(r.logistics) : r.logistics,
      }));
    } catch (err) {
      console.error('[MySQL Host] Error loading buyer orders:', err);
      return [];
    }
  }

  public async upsertBuyerOrder(order: BuyerOrder): Promise<void> {
    if (!this.isConnected) return;
    try {
      const pool = this.getPool();
      const sql = `
        INSERT INTO buyer_orders (
          id, order_number, buyer_name, brand, style_number, style_description,
          season, order_quantity, fob_price, currency, ship_date, cutting_start_date,
          status, quality_standard, product_image, merchandiser_name, merchandiser_email,
          merchandiser_phone, smv, production_target, daily_target, production_tracking,
          wip_record, bom_items, logistics, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          buyer_name = VALUES(buyer_name),
          brand = VALUES(brand),
          style_number = VALUES(style_number),
          style_description = VALUES(style_description),
          season = VALUES(season),
          order_quantity = VALUES(order_quantity),
          fob_price = VALUES(fob_price),
          currency = VALUES(currency),
          ship_date = VALUES(ship_date),
          cutting_start_date = VALUES(cutting_start_date),
          status = VALUES(status),
          quality_standard = VALUES(quality_standard),
          product_image = VALUES(product_image),
          merchandiser_name = VALUES(merchandiser_name),
          merchandiser_email = VALUES(merchandiser_email),
          merchandiser_phone = VALUES(merchandiser_phone),
          smv = VALUES(smv),
          production_target = VALUES(production_target),
          daily_target = VALUES(daily_target),
          production_tracking = VALUES(production_tracking),
          wip_record = VALUES(wip_record),
          bom_items = VALUES(bom_items),
          logistics = VALUES(logistics),
          updated_at = NOW();
      `;

      await pool.query(sql, [
        order.id,
        order.orderNumber,
        order.buyerName,
        order.brand || '',
        order.styleNumber,
        order.styleDescription || '',
        order.season || '',
        order.orderQuantity || 0,
        order.fobPrice || 0,
        order.currency || 'USD',
        order.shipDate || '',
        order.cuttingStartDate || '',
        order.status || 'PLANNED',
        order.qualityStandard || 'AQL 2.5',
        order.productImage || null,
        order.merchandiserName || null,
        order.merchandiserEmail || null,
        order.merchandiserPhone || null,
        order.smv || 0,
        order.productionTarget || 0,
        order.dailyTarget || 0,
        JSON.stringify(order.productionTracking || {}),
        JSON.stringify(order.wipRecord || {}),
        JSON.stringify(order.bomItems || []),
        JSON.stringify(order.logistics || {}),
      ]);
    } catch (err) {
      console.error('[MySQL Host] Error upserting buyer order:', err);
      throw err;
    }
  }

  public async deleteBuyerOrder(id: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const pool = this.getPool();
      await pool.query('DELETE FROM buyer_orders WHERE id = ? OR order_number = ?', [id, id]);
    } catch (err) {
      console.error('[MySQL Host] Error deleting buyer order:', err);
    }
  }

  // --- Production Records (Daily & Hourly Floor Records) ---
  public async loadProductionRecords(): Promise<ProductionOrder[]> {
    if (!this.isConnected) return [];
    try {
      const pool = this.getPool();
      const [rows]: [any[], any] = await pool.query(
        'SELECT * FROM production_records ORDER BY created_at DESC'
      );
      return rows.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        styleName: r.style_name,
        buyer: r.buyer,
        sewingLine: r.sewing_line,
        lineId: r.line_id || undefined,
        section: r.section || 'SEWING',
        recordDate: r.record_date || '',
        targetQuantity: Number(r.target_quantity) || 0,
        completedQuantity: Number(r.completed_quantity) || 0,
        totalDefects: Number(r.total_defects) || 0,
        defectRate: Number(r.defect_rate) || 0,
        dhuRate: Number(r.dhu_rate) || 0,
        rftRate: Number(r.rft_rate) || 100,
        hourlyReports: typeof r.hourly_reports === 'string' ? JSON.parse(r.hourly_reports) : r.hourly_reports,
        qualityInspector: r.quality_inspector || undefined,
        status: r.status || 'RUNNING',
        remarks: r.remarks || undefined,
        dueDate: r.due_date ? new Date(r.due_date).toISOString() : new Date().toISOString(),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[MySQL Host] Error loading production records:', err);
      return [];
    }
  }

  public async upsertProductionRecord(record: ProductionOrder): Promise<void> {
    if (!this.isConnected) return;
    try {
      const pool = this.getPool();
      const sql = `
        INSERT INTO production_records (
          id, order_number, style_name, buyer, sewing_line, line_id, section, record_date,
          target_quantity, completed_quantity, total_defects, defect_rate, dhu_rate, rft_rate,
          hourly_reports, quality_inspector, status, remarks, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          style_name = VALUES(style_name),
          buyer = VALUES(buyer),
          sewing_line = VALUES(sewing_line),
          line_id = VALUES(line_id),
          section = VALUES(section),
          record_date = VALUES(record_date),
          target_quantity = VALUES(target_quantity),
          completed_quantity = VALUES(completed_quantity),
          total_defects = VALUES(total_defects),
          defect_rate = VALUES(defect_rate),
          dhu_rate = VALUES(dhu_rate),
          rft_rate = VALUES(rft_rate),
          hourly_reports = VALUES(hourly_reports),
          quality_inspector = VALUES(quality_inspector),
          status = VALUES(status),
          remarks = VALUES(remarks),
          updated_at = NOW();
      `;

      await pool.query(sql, [
        record.id,
        record.orderNumber,
        record.styleName,
        record.buyer,
        record.sewingLine,
        record.lineId || null,
        record.section || 'SEWING',
        record.recordDate || null,
        record.targetQuantity || 0,
        record.completedQuantity || 0,
        record.totalDefects || 0,
        record.defectRate || 0,
        record.dhuRate || 0,
        record.rftRate || 100,
        JSON.stringify(record.hourlyReports || []),
        record.qualityInspector || null,
        record.status || 'RUNNING',
        record.remarks || null,
      ]);
    } catch (err) {
      console.error('[MySQL Host] Error upserting production record:', err);
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
        inspectionType: r.inspection_type || undefined,
        poNumber: r.po_number || undefined,
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
          status, inspector_id, inspector_name, buyer, defects, inspection_type, po_number, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          pass_count = VALUES(pass_count),
          defect_count = VALUES(defect_count),
          major_defects = VALUES(major_defects),
          minor_defects = VALUES(minor_defects),
          critical_defects = VALUES(critical_defects),
          defects = VALUES(defects),
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
        record.inspectionType || null,
        (record as any).poNumber || (record.poNumbers && record.poNumbers[0]) || null,
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

  // --- Seed Database If Empty ---
  public async seedIfEmpty(seedData: {
    buyerOrders?: BuyerOrder[];
    productionRecords?: ProductionOrder[];
    inventory: InventoryItem[];
    inspections: InspectionRecord[];
    productionOrders: ProductionOrder[];
    auditLogs: AuditLog[];
    modulesData?: Record<string, any>;
  }): Promise<void> {
    if (!this.isConnected) return;

    try {
      const pool = this.getPool();

      // 1. Seed Buyer Orders
      if (seedData.buyerOrders && seedData.buyerOrders.length > 0) {
        const [boRows]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM buyer_orders');
        if (boRows[0]?.count === 0) {
          console.log(`[MySQL Host] Seeding ${seedData.buyerOrders.length} buyer orders (with WIP records) into MySQL...`);
          for (const bo of seedData.buyerOrders) {
            await this.upsertBuyerOrder(bo);
          }
        }
      }

      // 2. Seed Production Records
      if (seedData.productionRecords && seedData.productionRecords.length > 0) {
        const [prRows]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM production_records');
        if (prRows[0]?.count === 0) {
          console.log(`[MySQL Host] Seeding ${seedData.productionRecords.length} production floor records into MySQL...`);
          for (const pr of seedData.productionRecords) {
            await this.upsertProductionRecord(pr);
          }
        }
      }

      // 3. Seed Inventory
      const [invRows]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM inventory_items');
      if (invRows[0]?.count === 0 && seedData.inventory.length > 0) {
        console.log(`[MySQL Host] Seeding ${seedData.inventory.length} inventory items into MySQL...`);
        for (const item of seedData.inventory) {
          await this.upsertInventoryItem(item);
        }
      }

      // 4. Seed Inspections
      const [inspRows]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM inspection_records');
      if (inspRows[0]?.count === 0 && seedData.inspections.length > 0) {
        console.log(`[MySQL Host] Seeding ${seedData.inspections.length} inspections into MySQL...`);
        for (const insp of seedData.inspections) {
          await this.insertInspection(insp);
        }
      }

      // 5. Seed Production Orders
      const [poRows]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM production_orders');
      if (poRows[0]?.count === 0 && seedData.productionOrders.length > 0) {
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

      // 6. Seed Module Store
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
}

// Global persistent manager instance
const globalForMysql = globalThis as unknown as { mysqlManager?: MySqlDatabaseManager };
if (!globalForMysql.mysqlManager || !(globalForMysql.mysqlManager as any).getTelemetry) {
  globalForMysql.mysqlManager = new MySqlDatabaseManager();
}
export const mysqlManager = globalForMysql.mysqlManager;

