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
  const items = erpStore.getInventory();
  return NextResponse.json({ success: true, items });
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!hasPermission(user.role, ['ADMIN', 'QA_MANAGER', 'WAREHOUSE_INSPECTOR'])) {
      return NextResponse.json(
        { error: `Role ${user.role} cannot add inventory items.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const created = erpStore.addInventoryItem(body, user);
    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
