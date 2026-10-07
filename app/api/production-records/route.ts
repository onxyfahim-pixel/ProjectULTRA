import { NextRequest, NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';
import { verifyToken, DEMO_USERS } from '@/lib/auth/jwt';
import { ProductionOrder } from '@/lib/types/erp';

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

export async function GET() {
  try {
    let records: ProductionOrder[] = [];
    if (mysqlManager.getConnectedStatus()) {
      records = await mysqlManager.loadProductionRecords();
    }
    if (!records || records.length === 0) {
      records = erpStore.getProductionRecords();
    }

    return NextResponse.json({
      success: true,
      records,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
      count: records.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const recordData: ProductionOrder = body.record || body;

    const saved = erpStore.upsertProductionRecord(recordData, user);

    return NextResponse.json({
      success: true,
      record: saved,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || '';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required for deletion.' },
        { status: 400 }
      );
    }

    const deleted = erpStore.deleteProductionRecord(id, user);

    return NextResponse.json({
      success: deleted,
      id,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
