'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserSession, Role, ROLE_PERMISSIONS, RolePermissions } from '@/lib/types/erp';
import { DEMO_USERS } from '@/lib/auth/jwt';
import { RoleDefinition, DEFAULT_SYSTEM_ROLES } from '@/lib/auth/rbac-rules';

export interface AuthContextType {
  user: UserSession;
  token: string | null;
  isAuthenticated: boolean;
  permissions: RolePermissions;
  roles: RoleDefinition[];
  can: (moduleKey: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export') => boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserSession>) => void;
  refreshRoles: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ErpAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_user_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...DEMO_USERS[0], ...parsed };
        } catch (e) {}
      }
    }
    return DEMO_USERS[0];
  });
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_SYSTEM_ROLES);

  // Authenticate session on initial mount
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const storedToken = localStorage.getItem('erp_token');
        if (!storedToken) {
          if (isMounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.user) {
            let finalUser = data.user;
            const savedProfile = localStorage.getItem('erp_user_profile');
            if (savedProfile) {
              try {
                const parsed = JSON.parse(savedProfile);
                if (parsed.id === finalUser.id) {
                  finalUser = { ...finalUser, ...parsed };
                }
              } catch (e) {}
            }
            setUser(finalUser);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('erp_token');
            localStorage.removeItem('erp_user_profile');
            if (isMounted) setIsAuthenticated(false);
          }
        } else {
          localStorage.removeItem('erp_token');
          localStorage.removeItem('erp_user_profile');
          if (isMounted) setIsAuthenticated(false);
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user && data.token) {
        const finalUser = data.user;
        setUser(finalUser);
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('erp_token', data.token);
        localStorage.setItem('erp_user_profile', JSON.stringify(finalUser));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid username or password' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to Host PC.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user_profile');
    document.cookie = 'erp_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setToken(null);
    setIsAuthenticated(false);
    setUser(DEMO_USERS[0]);
  }, []);

  // Fetch roles list on mount and listen to live updates
  const refreshRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/roles');
      if (res.ok) {
        const data = await res.json();
        if (data.roles && Array.isArray(data.roles)) {
          setRoles(data.roles);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshRoles();

    const handleRolesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRoles(e.detail);
      } else {
        refreshRoles();
      }
    };

    window.addEventListener('erp_module_erp_roles_matrix_updated', handleRolesUpdate);
    return () => {
      window.removeEventListener('erp_module_erp_roles_matrix_updated', handleRolesUpdate);
    };
  }, [refreshRoles]);

  const can = useCallback(
    (moduleKey: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export'): boolean => {
      if (!user) return false;
      // Super Admin has full unrestricted access across all modules
      if (
        user.isSuperAdmin ||
        user.role === 'ADMIN' ||
        user.role === 'Super Admin' ||
        user.role === 'super_admin'
      ) {
        return true;
      }

      const userRoleClean = (user.role || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
      const roleDef = roles.find(
        (r) =>
          r.id.toLowerCase() === user.role.toLowerCase() ||
          r.name.toLowerCase() === user.role.toLowerCase() ||
          r.id.toLowerCase().replace(/[\s_-]+/g, '') === userRoleClean ||
          r.name.toLowerCase().replace(/[\s_-]+/g, '') === userRoleClean
      );

      if (!roleDef) {
        return action === 'view' && moduleKey === 'dashboard';
      }

      if (roleDef.isSystemRole || roleDef.id === 'super_admin') {
        return true;
      }

      const mod = roleDef.permissions?.[moduleKey];
      if (!mod) {
        return false;
      }

      return Boolean(mod[action]);
    },
    [user, roles]
  );

  const switchUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        const found = (data.users || []).find((u: any) => u.id === userId);
        if (found) {
          const isSuper = found.isSuperAdmin || found.role === 'Super Admin' || found.role === 'ADMIN';
          const updatedUser: UserSession = { ...found, isSuperAdmin: isSuper };
          setUser(updatedUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('erp_user_profile', JSON.stringify(updatedUser));
          }
        }
      }
    } catch (err) {
      console.warn('Switch user error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchRole = useCallback(async (role: Role) => {
    setIsLoading(true);
    try {
      const isSuper = role === 'ADMIN' || role === 'Super Admin' || role === 'super_admin';
      const updatedUser: UserSession = {
        ...user,
        role,
        isSuperAdmin: isSuper,
      };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('erp_user_profile', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateUserProfile = useCallback((updates: Partial<UserSession>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem('erp_user_profile', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const permissions = user ? (ROLE_PERMISSIONS[user.role as any] || ROLE_PERMISSIONS.OPERATOR) : ROLE_PERMISSIONS.OPERATOR;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        permissions,
        roles,
        can,
        login,
        logout,
        switchRole,
        switchUser,
        updateUserProfile,
        refreshRoles,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useErpAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useErpAuth must be used within an ErpAuthProvider');
  }
  return context;
}
