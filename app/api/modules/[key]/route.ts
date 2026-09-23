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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const data = erpStore.getModuleData(key, null);
    return NextResponse.json({
      success: true,
      moduleKey: key,
      data,
      isMysqlConnected: erpStore.isMysqlActive(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const user = getUserFromRequest(req);
    const body = await req.json();

    const saved = erpStore.saveModuleData(key, body.data !== undefined ? body.data : body, user);

    return NextResponse.json({
      success: true,
      moduleKey: key,
      data: saved,
      isMysqlConnected: erpStore.isMysqlActive(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
