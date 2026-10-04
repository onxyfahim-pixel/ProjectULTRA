import { NextRequest, NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { DEMO_USERS } from '@/lib/auth/jwt';

async function handleProfileUpdate(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      email,
      phone,
      designation,
      department,
      employeeId,
      factoryUnit,
      workShift,
      emergencyContact,
      timezone,
      language,
      bio,
      avatarUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (designation !== undefined) updates.designation = designation;
    if (department !== undefined) updates.department = department;
    if (employeeId !== undefined) updates.employeeId = employeeId;
    if (factoryUnit !== undefined) updates.factoryUnit = factoryUnit;
    if (workShift !== undefined) updates.workShift = workShift;
    if (emergencyContact !== undefined) updates.emergencyContact = emergencyContact;
    if (timezone !== undefined) updates.timezone = timezone;
    if (language !== undefined) updates.language = language;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    // Update in demo users memory
    const demoIndex = DEMO_USERS.findIndex((u) => u.id === id);
    if (demoIndex !== -1) {
      Object.assign(DEMO_USERS[demoIndex], updates);
    }

    // Also update in erp_users_list
    const userList = erpStore.getModuleData<any[]>('erp_users_list', []);
    const userIndex = userList.findIndex((u) => u.id === id);
    if (userIndex !== -1) {
      userList[userIndex] = {
        ...userList[userIndex],
        ...updates,
      };
      erpStore.saveModuleData('erp_users_list', userList);
    }

    erpStore.addAuditLog({
      action: 'PROFILE_UPDATED',
      entity: 'UserProfile',
      entityId: id,
      performedBy: name || (demoIndex !== -1 ? DEMO_USERS[demoIndex].name : 'User'),
      userRole: demoIndex !== -1 ? DEMO_USERS[demoIndex]?.role : 'ADMIN',
      details: `Profile updated for ${name || id} (${designation || 'QMS Executive'})`,
    });

    const finalUser = demoIndex !== -1 ? DEMO_USERS[demoIndex] : { id, ...updates };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: finalUser,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return handleProfileUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleProfileUpdate(req);
}
