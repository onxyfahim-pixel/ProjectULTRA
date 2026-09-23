import { NextRequest, NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { DEMO_USERS } from '@/lib/auth/jwt';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, department, avatarUrl } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    // Update in demo users memory
    const demoIndex = DEMO_USERS.findIndex((u) => u.id === id);
    if (demoIndex !== -1) {
      if (name) DEMO_USERS[demoIndex].name = name;
      if (department) DEMO_USERS[demoIndex].department = department;
      if (avatarUrl) DEMO_USERS[demoIndex].avatarUrl = avatarUrl;
    }

    // Also update in erp_users_list
    const userList = erpStore.getModuleData<any[]>('erp_users_list', []);
    const userIndex = userList.findIndex((u) => u.id === id);
    if (userIndex !== -1) {
      userList[userIndex] = {
        ...userList[userIndex],
        ...(name && { name }),
        ...(department && { department }),
        ...(avatarUrl && { avatarUrl }),
      };
      erpStore.saveModuleData('erp_users_list', userList);
    }

    erpStore.addAuditLog({
      action: 'PROFILE_UPDATED',
      entity: 'UserProfile',
      entityId: id,
      performedBy: name || 'User',
      userRole: DEMO_USERS[demoIndex]?.role || 'ADMIN',
      details: `Profile updated for ${name || id}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: demoIndex !== -1 ? DEMO_USERS[demoIndex] : { id, name, department, avatarUrl },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
