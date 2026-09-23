import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { UserStorageManager } from '@/lib/auth/user-storage';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies.get('erp_token')?.value || '';
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session token' }, { status: 401 });
    }

    // Lookup freshest state from storage
    const latestUser = UserStorageManager.findById(decoded.id);
    if (latestUser && latestUser.isActive === false) {
      return NextResponse.json({ success: false, error: 'Account has been deactivated' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: latestUser
        ? {
            id: latestUser.id,
            username: latestUser.username,
            name: latestUser.name,
            email: latestUser.email,
            role: latestUser.role,
            department: latestUser.department,
            avatarUrl: latestUser.avatarUrl,
            isSuperAdmin: latestUser.isSuperAdmin,
          }
        : decoded,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
