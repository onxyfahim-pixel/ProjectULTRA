import { NextRequest, NextResponse } from 'next/server';
import { UserStorageManager } from '@/lib/auth/user-storage';
import { signToken } from '@/lib/auth/jwt';
import { erpStore } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.username || body.email || body.identifier || '').trim();
    const password = body.password || '';

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Please enter your username/email and password.' },
        { status: 400 }
      );
    }

    const authResult = UserStorageManager.authenticate(identifier, password);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const token = signToken(user);

    // Audit log
    erpStore.addAuditLog({
      action: 'USER_LOGIN',
      entity: 'Authentication',
      entityId: user.id,
      performedBy: user.name,
      userRole: user.role,
      details: `User ${user.username} (${user.name}) logged in successfully.`,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
      },
    });

    // Set cookie
    response.cookies.set('erp_token', token, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
