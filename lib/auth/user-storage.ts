import { AppUser, Role } from '../types/erp';
import { DEMO_USERS } from './jwt';
import { erpStore } from '../db/store';

const USERS_MODULE_KEY = 'erp_users_list';

export class UserStorageManager {
  // Get all users from store (MySQL or disk fallback)
  public static getUsers(): AppUser[] {
    const stored = erpStore.getModuleData<AppUser[]>(USERS_MODULE_KEY, []);
    if (!stored || stored.length === 0) {
      // Initialize with DEMO_USERS
      erpStore.saveModuleData(USERS_MODULE_KEY, DEMO_USERS);
      return [...DEMO_USERS];
    }

    // Ensure Super Admin exists in the list
    const hasAdmin = stored.some((u) => u.username === 'admin' || u.isSuperAdmin);
    if (!hasAdmin) {
      const merged = [DEMO_USERS[0], ...stored];
      erpStore.saveModuleData(USERS_MODULE_KEY, merged);
      return merged;
    }

    return stored;
  }

  // Find user by username or email
  public static findByIdentifier(identifier: string): AppUser | undefined {
    const clean = identifier.trim().toLowerCase();
    const users = this.getUsers();
    return users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean)
    );
  }

  // Find user by ID
  public static findById(id: string): AppUser | undefined {
    const users = this.getUsers();
    return users.find((u) => u.id === id);
  }

  // Authenticate user with username/email and password
  public static authenticate(identifier: string, password: string): { success: boolean; user?: AppUser; error?: string } {
    if (!identifier || !password) {
      return { success: false, error: 'Username/Email and Password are required.' };
    }

    const user = this.findByIdentifier(identifier);
    if (!user) {
      return { success: false, error: 'Invalid username or password.' };
    }

    if (user.isActive === false) {
      return { success: false, error: 'This account has been deactivated by the Super Administrator.' };
    }

    // Check password
    if (user.password !== password) {
      return { success: false, error: 'Invalid username or password.' };
    }

    // Update last login
    this.updateLastLogin(user.id);

    return { success: true, user };
  }

  private static updateLastLogin(id: string): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index !== -1) {
      users[index].lastLoginAt = new Date().toISOString();
      erpStore.saveModuleData(USERS_MODULE_KEY, users);
    }
  }

  // Create new user (Super Admin only)
  public static createUser(data: {
    username: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    department: string;
    avatarUrl?: string;
  }): { success: boolean; user?: AppUser; error?: string } {
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    if (!cleanUsername || !data.password || !data.name || !cleanEmail) {
      return { success: false, error: 'Username, password, name, and email are required.' };
    }

    const users = this.getUsers();

    if (users.some((u) => u.username && u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: `Username "${cleanUsername}" is already taken. Please choose another.` };
    }

    if (users.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: `Email "${cleanEmail}" is already registered.` };
    }

    const newUser: AppUser = {
      id: `usr_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      username: cleanUsername,
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password,
      role: data.role,
      department: data.department || 'Operations',
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      isActive: true,
      isSuperAdmin: data.role === 'ADMIN',
      createdAt: new Date().toISOString(),
    };

    const updated = [newUser, ...users];
    erpStore.saveModuleData(USERS_MODULE_KEY, updated);

    return { success: true, user: newUser };
  }

  // Update user
  public static updateUser(id: string, updates: Partial<AppUser>): { success: boolean; user?: AppUser; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, error: 'User not found.' };
    }

    // Cannot change super admin username or deactivate super admin
    if (users[index].id === 'usr_admin') {
      if (updates.isActive === false) {
        return { success: false, error: 'Super Admin account cannot be deactivated.' };
      }
      if (updates.role && updates.role !== 'ADMIN') {
        return { success: false, error: 'Super Admin role cannot be changed.' };
      }
    }

    // If username is being changed, verify uniqueness
    if (updates.username && updates.username.toLowerCase() !== users[index].username.toLowerCase()) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (users.some((u) => u.id !== id && u.username.toLowerCase() === cleanUsername)) {
        return { success: false, error: `Username "${cleanUsername}" is already taken.` };
      }
      updates.username = cleanUsername;
    }

    const updatedUser = {
      ...users[index],
      ...updates,
    };

    users[index] = updatedUser;
    erpStore.saveModuleData(USERS_MODULE_KEY, users);

    return { success: true, user: updatedUser };
  }

  // Delete user
  public static deleteUser(id: string): { success: boolean; error?: string } {
    if (id === 'usr_admin') {
      return { success: false, error: 'Super Admin account cannot be deleted.' };
    }

    const users = this.getUsers();
    const filtered = users.filter((u) => u.id !== id);

    if (filtered.length === users.length) {
      return { success: false, error: 'User not found.' };
    }

    erpStore.saveModuleData(USERS_MODULE_KEY, filtered);
    return { success: true };
  }
}
