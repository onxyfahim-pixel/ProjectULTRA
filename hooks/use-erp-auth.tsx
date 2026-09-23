'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserSession, Role, ROLE_PERMISSIONS, RolePermissions } from '@/lib/types/erp';
import { DEMO_USERS } from '@/lib/auth/jwt';

interface AuthContextType {
  user: UserSession;
  token: string | null;
  isAuthenticated: boolean;
  permissions: RolePermissions;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
  updateUserProfile: (updates: Partial<UserSession>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ErpAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession>(DEMO_USERS[0]);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
            setUser(data.user);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('erp_token');
            if (isMounted) setIsAuthenticated(false);
          }
        } else {
          localStorage.removeItem('erp_token');
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
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('erp_token', data.token);
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
    document.cookie = 'erp_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setToken(null);
    setIsAuthenticated(false);
    setUser(DEMO_USERS[0]);
  }, []);

  const switchRole = useCallback(async (role: Role) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user && data.token) {
          setUser(data.user);
          setToken(data.token);
          setIsAuthenticated(true);
          localStorage.setItem('erp_token', data.token);
        }
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserSession>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const permissions = user ? (ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.OPERATOR) : ROLE_PERMISSIONS.OPERATOR;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        permissions,
        login,
        logout,
        switchRole,
        updateUserProfile,
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
