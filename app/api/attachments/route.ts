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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const entityType = url.searchParams.get('entityType') || undefined;
    const entityId = url.searchParams.get('entityId') || undefined;
    const moduleKey = url.searchParams.get('moduleKey') || undefined;
    const includeData = url.searchParams.get('includeData') === 'true';

    let items = mysqlManager.getConnectedStatus()
      ? await mysqlManager.loadAttachments({ entityType, entityId, moduleKey, includeData })
      : [];

    if (!items || items.length === 0) {
      items = erpStore.getAttachments({ entityType, entityId, moduleKey });
    }

    return NextResponse.json({
      success: true,
      attachments: items,
      count: items.length,
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
    const att = body.attachment || body;

    if (!att.fileName || !att.fileData) {
      return NextResponse.json(
        { success: false, error: 'fileName and fileData are required for attachment upload.' },
        { status: 400 }
      );
    }

    const saved = erpStore.upsertAttachment(
      {
        id: att.id,
        entityType: att.entityType || 'GENERAL',
        entityId: att.entityId || 'general',
        moduleKey: att.moduleKey || '',
        fileName: att.fileName,
        fileType: att.fileType || 'document',
        fileSize: att.fileSize || Math.round((att.fileData.length || 0) * 0.75),
        mimeType: att.mimeType || att.fileType || '',
        category: att.category || 'GENERAL_ATTACHMENT',
        fileData: att.fileData,
        uploadedBy: user?.name || att.uploadedBy || 'Current User',
        notes: att.notes,
      },
      user
    );

    return NextResponse.json({
      success: true,
      attachment: saved,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
