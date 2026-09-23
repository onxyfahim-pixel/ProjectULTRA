import { NextRequest, NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';
import { CentralStorageManager } from '@/lib/db/central-storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || (!body.inventory && !body.inspections && !body.modulesData)) {
      return NextResponse.json(
        { success: false, error: 'Invalid backup file: Missing ERP entities.' },
        { status: 400 }
      );
    }

    const inventory = Array.isArray(body.inventory) ? body.inventory : [];
    const inspections = Array.isArray(body.inspections) ? body.inspections : [];
    const productionOrders = Array.isArray(body.productionOrders) ? body.productionOrders : [];
    const auditLogs = Array.isArray(body.auditLogs) ? body.auditLogs : [];
    const modulesData = body.modulesData && typeof body.modulesData === 'object' ? body.modulesData : {};

    // 1. Save to local central storage
    CentralStorageManager.saveCentralData({
      version: 2,
      lastSavedAt: new Date().toISOString(),
      hostSystem: 'Garments QMS ERP Host Center (Restored)',
      inventory,
      inspections,
      productionOrders,
      auditLogs,
      modulesData,
    });

    // 2. Reload erpStore cache
    erpStore.loadFromDisk();

    // 3. Sync to MySQL if active
    if (erpStore.isMysqlActive()) {
      for (const item of inventory) {
        await mysqlManager.upsertInventoryItem(item);
      }
      for (const insp of inspections) {
        await mysqlManager.insertInspection(insp);
      }
      for (const [key, data] of Object.entries(modulesData)) {
        await mysqlManager.saveModuleData(key, data);
      }
    }

    // Log the restore
    erpStore.addAuditLog({
      action: 'DATABASE_BACKUP_RESTORED',
      entity: 'SystemBackup',
      entityId: 'backup_restore',
      performedBy: 'Host Administrator',
      userRole: 'ADMIN',
      details: `Restored ${inventory.length} inventory items, ${inspections.length} inspections, and ${Object.keys(modulesData).length} modules.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Database backup successfully restored!',
      restoredInventoryCount: inventory.length,
      restoredInspectionsCount: inspections.length,
      restoredModulesCount: Object.keys(modulesData).length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
