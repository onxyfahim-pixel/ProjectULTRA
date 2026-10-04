import { NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';
import {
  INITIAL_INVENTORY,
  INITIAL_INSPECTIONS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_AUDIT_LOGS,
} from '@/lib/db/mock-data';
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
} from '@/lib/db/modules-mock-data';

export async function POST() {
  try {
    const isConnected = await mysqlManager.checkConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: 'MySQL Server is not connected. Please verify your connection settings first.',
        },
        { status: 400 }
      );
    }

    // 1. Initialize schema
    await mysqlManager.initializeSchema();

    // 2. Prepare datasets
    const currentOrders = erpStore.getBuyerOrders();
    const buyerOrders = currentOrders.length > 0 ? currentOrders : MOCK_BUYER_ORDERS;

    const currentRecords = erpStore.getProductionRecords();
    const productionRecords = currentRecords.length > 0 ? currentRecords : INITIAL_PRODUCTION_ORDERS;

    const inventory = erpStore.getInventory().length > 0 ? erpStore.getInventory() : INITIAL_INVENTORY;
    const inspections = erpStore.getInspections().length > 0 ? erpStore.getInspections() : INITIAL_INSPECTIONS;
    const auditLogs = erpStore.getAuditLogs().length > 0 ? erpStore.getAuditLogs() : INITIAL_AUDIT_LOGS;

    // 3. Migrate Buyer Orders into MySQL table
    for (const order of buyerOrders) {
      await mysqlManager.upsertBuyerOrder(order);
    }

    // 4. Migrate Production Records into MySQL table
    for (const rec of productionRecords) {
      await mysqlManager.upsertProductionRecord(rec);
    }

    // 5. Migrate Inventory into MySQL table
    for (const item of inventory) {
      await mysqlManager.upsertInventoryItem(item);
    }

    // 6. Migrate Inspections into MySQL table
    for (const insp of inspections) {
      await mysqlManager.insertInspection(insp);
    }

    // 7. Migrate Audit Logs into MySQL table
    for (const log of auditLogs) {
      await mysqlManager.insertAuditLog(log);
    }

    // 8. Migrate 28 QMS Modules into MySQL module_store
    const moduleMap: Record<string, any> = {
      buyer_orders: buyerOrders,
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
      const current = erpStore.getModuleData(key, data);
      await mysqlManager.saveModuleData(key, current);
    }

    const tableStats = await mysqlManager.getTableStatistics();

    return NextResponse.json({
      success: true,
      message: `Full ERP database migration succeeded! All ${buyerOrders.length} Buyer Orders, ${inventory.length} Inventory Items, ${inspections.length} Inspections, and ${Object.keys(moduleMap).length} QMS modules migrated to MySQL.`,
      tables: tableStats,
      telemetry: mysqlManager.getTelemetry(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
