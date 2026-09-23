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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(req);

    if (!hasPermission(user.role, ['ADMIN', 'QA_MANAGER', 'WAREHOUSE_INSPECTOR'])) {
      return NextResponse.json(
        { error: `RBAC Access Denied: Role ${user.role} does not have edit permissions.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = erpStore.updateInventoryItem(id, body, user);
    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
