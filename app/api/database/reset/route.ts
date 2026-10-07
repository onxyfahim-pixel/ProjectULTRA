import { NextRequest, NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { verifyToken, DEMO_USERS } from '@/lib/auth/jwt';

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
    const body = await req.json().catch(() => ({}));
    const mode = (body.mode || 'blank') as 'blank' | 'defaults';

    const result = await erpStore.resetDatabase(mode, user);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      mode,
      isMysqlConnected: erpStore.isMysqlActive(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
