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

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    // RBAC: Only QA_MANAGER and ADMIN can batch approve / reclassify quality grades
    if (!hasPermission(user.role, ['ADMIN', 'QA_MANAGER'])) {
      return NextResponse.json(
        { error: `RBAC Violation: Only QA Managers and Admins can batch-modify fabric quality grades. Current role: ${user.role}` },
        { status: 403 }
      );
    }

    const { ids, grade } = await req.json();
    if (!ids || !Array.isArray(ids) || !grade) {
      return NextResponse.json({ error: 'ids array and grade are required' }, { status: 400 });
    }

    const updated = erpStore.batchUpdateGrade(ids, grade, user);
    return NextResponse.json({ success: true, count: updated.length, items: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
