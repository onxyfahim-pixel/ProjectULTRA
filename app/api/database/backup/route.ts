import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { erpStore } from '@/lib/db/store';
import { CentralStorageManager } from '@/lib/db/central-storage';

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// GET: Download or fetch backups list / dump
export async function GET(req: NextRequest) {
  try {
    ensureBackupDir();
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // If requesting download of complete data
    if (action === 'download') {
      const backupData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        hostSystem: 'Garments QMS ERP Host Center',
        databaseEngine: erpStore.isMysqlActive() ? 'MySQL' : 'JSON',
        inventory: erpStore.getInventory(),
        inspections: erpStore.getInspections(),
        productionOrders: erpStore.getProductionOrders(),
        auditLogs: erpStore.getAuditLogs(),
        modulesData: (erpStore as any).modulesData || {},
      };

      return new NextResponse(JSON.stringify(backupData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="erp-backup-${Date.now()}.json"`,
        },
      });
    }

    // List all existing server-side backups
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((fileName) => {
        const filePath = path.join(BACKUP_DIR, fileName);
        const stats = fs.statSync(filePath);
        return {
          fileName,
          sizeBytes: stats.size,
          sizeKB: (stats.size / 1024).toFixed(1),
          createdAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      backups: files,
      backupDirectory: BACKUP_DIR,
      isMysqlConnected: erpStore.isMysqlActive(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Create a new server-side backup file
export async function POST() {
  try {
    ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `erp-backup-${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const snapshot = {
      version: 2,
      backupCreatedAt: new Date().toISOString(),
      hostSystem: 'Garments QMS ERP Host Center',
      databaseEngine: erpStore.isMysqlActive() ? 'MySQL Server 8.0+' : 'Local JSON Disk',
      inventory: erpStore.getInventory(),
      inspections: erpStore.getInspections(),
      productionOrders: erpStore.getProductionOrders(),
      auditLogs: erpStore.getAuditLogs(),
      modulesData: (erpStore as any).modulesData || {},
      stats: erpStore.getDashboardStats(),
    };

    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
    const fileStats = fs.statSync(filePath);

    // Add audit log
    erpStore.addAuditLog({
      action: 'DATABASE_BACKUP_CREATED',
      entity: 'SystemBackup',
      entityId: fileName,
      performedBy: 'Host Administrator',
      userRole: 'ADMIN',
      details: `Created snapshot backup ${fileName} (${(fileStats.size / 1024).toFixed(1)} KB)`,
    });

    return NextResponse.json({
      success: true,
      message: `Backup snapshot saved to ${fileName}`,
      fileName,
      filePath,
      sizeKB: (fileStats.size / 1024).toFixed(1),
      timestamp: snapshot.backupCreatedAt,
      inventoryCount: snapshot.inventory.length,
      inspectionsCount: snapshot.inspections.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
