import { NextRequest, NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';
import { verifyToken, DEMO_USERS } from '@/lib/auth/jwt';
import { AuditLog } from '@/lib/types/erp';

function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = req.cookies.get('erp_token')?.value || '';
  }
  return (token ? verifyToken(token) : null) || DEMO_USERS[0];
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const entity = url.searchParams.get('entity');
    const entityId = url.searchParams.get('entityId');
    const search = url.searchParams.get('search');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 200;

    let logs: AuditLog[] = [];
    if (mysqlManager.getConnectedStatus()) {
      logs = await mysqlManager.loadAuditLogs();
    }
    if (!logs || logs.length === 0) {
      logs = erpStore.getAuditLogs();
    }

    if (entity) {
      logs = logs.filter((l) => l.entity.toLowerCase() === entity.toLowerCase());
    }
    if (entityId) {
      logs = logs.filter((l) => l.entityId === entityId || (l.entityCode && l.entityCode === entityId));
    }
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          l.performedBy.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs.slice(0, limit),
      count: logs.length,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const logData = body.log || body;

    const saved = erpStore.addAuditLog({
      action: logData.action || 'UPDATE',
      entity: logData.entity || 'GeneralEntity',
      entityId: logData.entityId || 'general',
      entityCode: logData.entityCode || logData.entityId,
      moduleName: logData.moduleName,
      performedBy: logData.performedBy || user.name,
      userRole: logData.userRole || user.role,
      details: logData.details || 'User operation registered.',
      changes: logData.changes,
      metadata: logData.metadata,
    });

    return NextResponse.json({
      success: true,
      log: saved,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
