import { NextRequest, NextResponse } from 'next/server';
import { RoleStorageManager } from '@/lib/auth/role-storage';
import { erpStore } from '@/lib/db/store';

export async function GET() {
  try {
    const roles = RoleStorageManager.getRoles();
    return NextResponse.json({ success: true, roles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = RoleStorageManager.saveRole(body);
    if (!result.success || !result.role) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    erpStore.addAuditLog({
      action: 'ROLE_UPSERTED',
      entity: 'RBAC',
      entityId: result.role.id,
      performedBy: 'Super Administrator',
      userRole: 'Super Admin',
      details: `Saved role "${result.role.name}" with permissions matrix`,
    });

    return NextResponse.json({ success: true, role: result.role });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Role ID is required' }, { status: 400 });
    }

    const result = RoleStorageManager.deleteRole(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    erpStore.addAuditLog({
      action: 'ROLE_DELETED',
      entity: 'RBAC',
      entityId: id,
      performedBy: 'Super Administrator',
      userRole: 'Super Admin',
      details: `Deleted role ${id}`,
    });

    return NextResponse.json({ success: true, message: 'Role deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
