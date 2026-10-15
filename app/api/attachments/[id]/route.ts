import { NextRequest, NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const att = mysqlManager.getConnectedStatus()
      ? await mysqlManager.getAttachment(id)
      : erpStore.getAttachment(id);

    if (!att) {
      return NextResponse.json({ success: false, error: 'Attachment not found' }, { status: 404 });
    }

    const url = new URL(req.url);
    if (url.searchParams.get('action') === 'download' && att.fileData?.startsWith('data:')) {
      const matches = att.fileData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${att.fileName}"`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      attachment: att,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(req);
    const deleted = erpStore.deleteAttachment(id, user);

    return NextResponse.json({
      success: deleted,
      id,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
