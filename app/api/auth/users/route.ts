import { NextRequest, NextResponse } from 'next/server';
import { UserStorageManager } from '@/lib/auth/user-storage';
import { erpStore } from '@/lib/db/store';
import { Role } from '@/lib/types/erp';

export async function GET() {
  try {
    const users = UserStorageManager.getUsers();
    // Return users including passwords and avatarUrls for Super Admin viewing/managing in settings
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, name, email, password, role, department, avatarUrl, isSuperAdmin } = body;

    if (!username || !password || !name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Username, password, name, email, and role are required.' },
        { status: 400 }
      );
    }

    const isSuper = Boolean(
      isSuperAdmin ||
      role === 'ADMIN' ||
      role === 'Super Admin' ||
      (role as string) === 'super_admin'
    );

    const result = UserStorageManager.createUser({
      username,
      name,
      email,
      password,
      role: role as Role,
      department: department || 'Operations',
      avatarUrl,
      isSuperAdmin: isSuper,
    });

    if (!result.success || !result.user) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    erpStore.addAuditLog({
      action: 'USER_CREATED',
      entity: 'UserManagement',
      entityId: result.user.id,
      performedBy: 'Super Administrator',
      userRole: 'ADMIN',
      details: `Created user @${result.user.username} (${result.user.name}) with role ${result.user.role}`,
    });

    return NextResponse.json({ success: true, user: result.user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, password, role, department, isActive, name, avatarUrl, isSuperAdmin } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    const isSuper = (role === 'Super Admin' || role === 'ADMIN' || (role as string) === 'super_admin')
      ? true
      : isSuperAdmin;

    const result = UserStorageManager.updateUser(id, {
      ...(username && { username }),
      ...(password && { password }),
      ...(role && { role: role as Role }),
      ...(department && { department }),
      ...(isActive !== undefined && { isActive }),
      ...(name && { name }),
      ...(avatarUrl && { avatarUrl }),
      ...(isSuper !== undefined && { isSuperAdmin: isSuper }),
    });

    if (!result.success || !result.user) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    erpStore.addAuditLog({
      action: 'USER_UPDATED',
      entity: 'UserManagement',
      entityId: id,
      performedBy: 'Super Administrator',
      userRole: 'ADMIN',
      details: `Updated attributes for user @${result.user.username} (${result.user.name})`,
    });

    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    const result = UserStorageManager.deleteUser(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    erpStore.addAuditLog({
      action: 'USER_DELETED',
      entity: 'UserManagement',
      entityId: id,
      performedBy: 'Super Administrator',
      userRole: 'ADMIN',
      details: `Deleted user ${id}`,
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
