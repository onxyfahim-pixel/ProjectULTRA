import { NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';

export async function GET() {
  try {
    const isConnected = await mysqlManager.checkConnection();
    const telemetry = mysqlManager.getTelemetry();
    const tableStats = isConnected ? await mysqlManager.getTableStatistics() : [];
    const dashboardStats = erpStore.getDashboardStats();

    return NextResponse.json({
      success: true,
      isConnected,
      databaseEngine: isConnected ? 'MySQL 8.0+ (Host PC Relational DB)' : 'Local JSON Disk (Offline Fallback)',
      telemetry,
      tables: tableStats,
      stats: dashboardStats,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        isConnected: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
