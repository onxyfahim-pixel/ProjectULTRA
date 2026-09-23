import { NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';

export async function GET() {
  const stats = erpStore.getDashboardStats();
  const productionOrders = erpStore.getProductionOrders();
  const auditLogs = erpStore.getAuditLogs();
  return NextResponse.json({
    ...stats,
    productionOrders,
    recentAuditLogs: auditLogs.slice(0, 5),
  });
}
