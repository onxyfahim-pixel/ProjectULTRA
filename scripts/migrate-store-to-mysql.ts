import { mysqlManager } from '../lib/db/mysql-client';
import { CentralStorageManager } from '../lib/db/central-storage';
import {
  INITIAL_INVENTORY,
  INITIAL_INSPECTIONS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_AUDIT_LOGS,
} from '../lib/db/mock-data';
import {
  MOCK_BUYER_ORDERS,
  MOCK_BUYER_PROFILES,
  MOCK_SUB_SUPPLIERS,
  MOCK_CUSTOMER_COMPLAINTS,
  MOCK_INCOMING_QC,
  MOCK_DEFECTS_LIBRARY,
  MOCK_LAB_TESTS,
  MOCK_CALIBRATION_DEVICES,
  MOCK_KPIS,
  MOCK_QUALITY_GOALS,
  MOCK_AUDITS,
  MOCK_CAPA,
  MOCK_ROOT_CAUSE_CASES,
  MOCK_RISK_FMEAS,
  MOCK_TRACEABILITY_RECORDS,
  MOCK_CERTIFICATES,
  MOCK_CONTROLLED_DOCS,
  MOCK_SOPS,
  MOCK_QUALITY_MANUAL,
  MOCK_PROCEDURES,
  MOCK_PROCESS_FLOW,
  MOCK_ORGANOGRAM,
  MOCK_JOB_DESCRIPTIONS,
  MOCK_TRAINING_MODULES,
  MOCK_MEETING_MINUTES,
  MOCK_FACTORY_EVENTS,
  MOCK_NOTICES,
  MOCK_SYSTEM_SETTINGS,
} from '../lib/db/modules-mock-data';

async function migrateAllDataToMySQL() {
  console.log('================================================================');
  console.log('     VALIANT GARMENTS QMS ERP - MYSQL HOST MIGRATION TOOL       ');
  console.log('================================================================\n');

  console.log('[*] Testing MySQL connection on Host PC...');
  const connected = await mysqlManager.checkConnection();

  if (!connected) {
    console.error('\n[ERROR] Could not connect to MySQL Server on localhost:3306.');
    console.error('Please verify that:');
    console.error('1. MySQL Server is installed and running.');
    console.error('2. DATABASE_URL or MYSQL_PASSWORD in .env.local matches your MySQL root password.');
    console.error('Example .env.local: DATABASE_URL="mysql://root:password@localhost:3306/garments_erp"\n');
    process.exit(1);
  }

  console.log('[OK] MySQL Server is reached. Initializing tables...');
  await mysqlManager.initializeSchema();

  // Load existing data from local central disk store if present
  console.log('[*] Loading existing data from local storage...');
  const diskData = CentralStorageManager.loadCentralData();

  const inventory = (diskData.inventory && diskData.inventory.length > 0) ? diskData.inventory : INITIAL_INVENTORY;
  const inspections = (diskData.inspections && diskData.inspections.length > 0) ? diskData.inspections : INITIAL_INSPECTIONS;
  const productionOrders = (diskData.productionOrders && diskData.productionOrders.length > 0) ? diskData.productionOrders : INITIAL_PRODUCTION_ORDERS;
  const auditLogs = (diskData.auditLogs && diskData.auditLogs.length > 0) ? diskData.auditLogs : INITIAL_AUDIT_LOGS;

  // 1. Migrate Inventory
  console.log(`[*] Migrating ${inventory.length} inventory items into MySQL (inventory_items)...`);
  for (const item of inventory) {
    await mysqlManager.upsertInventoryItem(item);
  }

  // 2. Migrate Inspections
  console.log(`[*] Migrating ${inspections.length} inspection records into MySQL (inspection_records)...`);
  for (const insp of inspections) {
    await mysqlManager.insertInspection(insp);
  }

  // 3. Migrate Production Orders
  console.log(`[*] Migrating ${productionOrders.length} production orders into MySQL (production_orders)...`);
  const pool = mysqlManager.getPool();
  for (const po of productionOrders) {
    await pool.query(
      `INSERT INTO production_orders 
        (id, order_number, buyer, style_name, target_quantity, completed_quantity, sewing_line, status, defect_rate, start_date, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        buyer = VALUES(buyer),
        style_name = VALUES(style_name),
        target_quantity = VALUES(target_quantity),
        completed_quantity = VALUES(completed_quantity),
        sewing_line = VALUES(sewing_line),
        status = VALUES(status),
        defect_rate = VALUES(defect_rate);`,
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

  // 4. Migrate Audit Logs
  console.log(`[*] Migrating ${auditLogs.length} audit logs into MySQL (audit_logs)...`);
  for (const log of auditLogs) {
    await mysqlManager.insertAuditLog(log);
  }

  // 5. Migrate ALL 28 Garments QMS Modules into MySQL module_store
  console.log('[*] Migrating all 28 Garments QMS module datasets into MySQL (module_store)...');
  const moduleMap: Record<string, any> = {
    buyer_orders: MOCK_BUYER_ORDERS,
    buyer_profiles: MOCK_BUYER_PROFILES,
    sub_suppliers: MOCK_SUB_SUPPLIERS,
    customer_complaints: MOCK_CUSTOMER_COMPLAINTS,
    incoming_qc: MOCK_INCOMING_QC,
    defects_library: MOCK_DEFECTS_LIBRARY,
    testing_records: MOCK_LAB_TESTS,
    calibration_devices: MOCK_CALIBRATION_DEVICES,
    kpi_metrics: MOCK_KPIS,
    quality_goals: MOCK_QUALITY_GOALS,
    audits: MOCK_AUDITS,
    capa: MOCK_CAPA,
    root_cause: MOCK_ROOT_CAUSE_CASES,
    risk_assessment: MOCK_RISK_FMEAS,
    traceability: MOCK_TRACEABILITY_RECORDS,
    certificates: MOCK_CERTIFICATES,
    document_control: MOCK_CONTROLLED_DOCS,
    sop: MOCK_SOPS,
    quality_manual: MOCK_QUALITY_MANUAL,
    procedures: MOCK_PROCEDURES,
    process_flows: MOCK_PROCESS_FLOW,
    organogram: MOCK_ORGANOGRAM,
    job_descriptions: MOCK_JOB_DESCRIPTIONS,
    training: MOCK_TRAINING_MODULES,
    meeting_minutes: MOCK_MEETING_MINUTES,
    events: MOCK_FACTORY_EVENTS,
    communication_notices: MOCK_NOTICES,
    system_settings: MOCK_SYSTEM_SETTINGS,
  };

  for (const [key, data] of Object.entries(moduleMap)) {
    // If disk store already had customized module data, prefer that over mock
    const existing = diskData.modulesData && diskData.modulesData[key] ? diskData.modulesData[key] : data;
    await mysqlManager.saveModuleData(key, existing);
  }

  console.log('\n================================================================');
  console.log('   [SUCCESS] ALL ERP DATA STORED IN HOST PC MYSQL DATABASE!     ');
  console.log('================================================================');
  console.log('✓ Database:           garments_erp');
  console.log('✓ Tables:             inventory_items, inspection_records, production_orders, audit_logs, module_store');
  console.log(`✓ Inventory Items:    ${inventory.length}`);
  console.log(`✓ Inspection Records: ${inspections.length}`);
  console.log(`✓ Production Orders:  ${productionOrders.length}`);
  console.log(`✓ Audit Logs:         ${auditLogs.length}`);
  console.log(`✓ QMS Modules Saved:  ${Object.keys(moduleMap).length} modules in module_store`);
  console.log('================================================================\n');

  process.exit(0);
}

migrateAllDataToMySQL().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
