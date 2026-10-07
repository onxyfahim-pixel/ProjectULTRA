import { RoleDefinition, DEFAULT_SYSTEM_ROLES } from './rbac-rules';
import { erpStore } from '../db/store';

const ROLES_MODULE_KEY = 'erp_roles_matrix';

export class RoleStorageManager {
  // Get all roles from store or seed with defaults
  public static getRoles(): RoleDefinition[] {
    const stored = erpStore.getModuleData<RoleDefinition[]>(ROLES_MODULE_KEY, []);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      erpStore.saveModuleData(ROLES_MODULE_KEY, DEFAULT_SYSTEM_ROLES);
      return [...DEFAULT_SYSTEM_ROLES];
    }

    // Ensure Super Admin always exists
    const hasAdmin = stored.some((r) => r.id === 'super_admin' || r.isSystemRole);
    if (!hasAdmin) {
      const merged = [DEFAULT_SYSTEM_ROLES[0], ...stored];
      erpStore.saveModuleData(ROLES_MODULE_KEY, merged);
      return merged;
    }

    return stored;
  }

  // Find a role by ID or normalized name
  public static findRole(idOrName: string): RoleDefinition | undefined {
    const roles = this.getRoles();
    const clean = idOrName.trim().toLowerCase().replace(/[\s_-]+/g, '');
    return roles.find(
      (r) =>
        r.id.toLowerCase() === idOrName.trim().toLowerCase() ||
        r.name.toLowerCase() === idOrName.trim().toLowerCase() ||
        r.id.toLowerCase().replace(/[\s_-]+/g, '') === clean ||
        r.name.toLowerCase().replace(/[\s_-]+/g, '') === clean
    );
  }

  // Save or update a role
  public static saveRole(role: RoleDefinition): { success: boolean; role?: RoleDefinition; error?: string } {
    if (!role.name || !role.name.trim()) {
      return { success: false, error: 'Role name is required.' };
    }

    const roles = this.getRoles();
    const existingIndex = roles.findIndex((r) => r.id === role.id);

    const now = new Date().toISOString();
    let updatedRole: RoleDefinition;

    if (existingIndex >= 0) {
      // If updating super_admin, keep system role flags
      if (roles[existingIndex].id === 'super_admin') {
        updatedRole = {
          ...roles[existingIndex],
          description: role.description || roles[existingIndex].description,
          updatedAt: now,
        };
      } else {
        updatedRole = {
          ...roles[existingIndex],
          ...role,
          updatedAt: now,
        };
      }
      roles[existingIndex] = updatedRole;
    } else {
      // Create new role
      const roleId = role.id || `role_${role.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
      updatedRole = {
        ...role,
        id: roleId,
        isSystemRole: false,
        createdAt: now,
        updatedAt: now,
      };
      roles.push(updatedRole);
    }

    erpStore.saveModuleData(ROLES_MODULE_KEY, roles);
    return { success: true, role: updatedRole };
  }

  // Delete a role (cannot delete system roles)
  public static deleteRole(roleId: string): { success: boolean; error?: string } {
    if (roleId === 'super_admin') {
      return { success: false, error: 'The Super Admin role cannot be deleted.' };
    }

    const roles = this.getRoles();
    const target = roles.find((r) => r.id === roleId);

    if (!target) {
      return { success: false, error: 'Role not found.' };
    }

    if (target.isSystemRole) {
      return { success: false, error: 'System roles cannot be deleted.' };
    }

    const filtered = roles.filter((r) => r.id !== roleId);
    erpStore.saveModuleData(ROLES_MODULE_KEY, filtered);
    return { success: true };
  }

  // Check if a role has permission for a specific module action
  public static hasPermission(
    roleIdOrName: string,
    moduleKey: string,
    action: 'view' | 'create' | 'edit' | 'delete' | 'export'
  ): boolean {
    if (
      roleIdOrName === 'ADMIN' ||
      roleIdOrName === 'super_admin' ||
      roleIdOrName === 'Super Admin'
    ) {
      return true;
    }

    const role = this.findRole(roleIdOrName);
    if (!role) {
      return false;
    }

    if (role.isSystemRole || role.id === 'super_admin') {
      return true;
    }

    const modPerm = role.permissions?.[moduleKey];
    if (!modPerm) {
      return false;
    }

    return Boolean(modPerm[action]);
  }
}
