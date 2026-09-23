import { NextRequest, NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { verifyToken, DEMO_USERS, hasPermission } from '@/lib/auth/jwt';

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
  const records = erpStore.getInspections();
  return NextResponse.json({ success: true, records });
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!hasPermission(user.role, ['ADMIN', 'QA_MANAGER', 'WAREHOUSE_INSPECTOR'])) {
      return NextResponse.json(
        { error: `RBAC Violation: Role ${user.role} cannot log QMS inspections.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const newRecord = erpStore.addInspection(body, user);
    return NextResponse.json({ success: true, record: newRecord }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!hasPermission(user.role, ['ADMIN', 'QA_MANAGER', 'WAREHOUSE_INSPECTOR'])) {
      return NextResponse.json(
        { error: `RBAC Violation: Role ${user.role} cannot update QMS inspections.` },
        { status: 403 }
      );
    }

    const { id, ...updates } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Inspection ID is required' }, { status: 400 });
    }

    const updated = erpStore.updateInspection(id, updates, user);
    return NextResponse.json({ success: true, record: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!hasPermission(user.role, ['ADMIN', 'QA_MANAGER'])) {
      return NextResponse.json(
        { error: `RBAC Violation: Role ${user.role} cannot delete QMS inspections.` },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Inspection ID is required' }, { status: 400 });
    }

    const success = erpStore.deleteInspection(id, user);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
