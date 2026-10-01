'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Permission, Role, hasPermission as checkPermission } from '@/lib/rbac';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  role: Role;
  storeCode?: string | null;
  mustChangePassword?: boolean;
  permissions: Permission[];
  createdAt?: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasAdmins: boolean;
  can: (permission: Permission) => boolean;
  hasPermission: (permission: Permission) => boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasAdmins, setHasAdmins] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
      if (data.hasAdmins !== undefined) {
        setHasAdmins(data.hasAdmins);
      }
    } catch (err) {
      console.error('Error refreshing admin auth session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setUser(null);
      window.location.href = '/admin/login';
    }
  }, []);

  const can = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      return checkPermission(user, permission);
    },
    [user]
  );

  const value = useMemo<AdminAuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      hasAdmins,
      can,
      hasPermission: can,
      refreshSession,
      logout,
    }),
    [user, loading, hasAdmins, can, refreshSession, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

export function useCan(permission: Permission): boolean {
  const { can } = useAdminAuth();
  return can(permission);
}

export function usePermission(permission: Permission): boolean {
  return useCan(permission);
}
