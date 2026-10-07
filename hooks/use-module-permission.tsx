'use client';

import React from 'react';
import { useErpAuth } from '@/hooks/use-erp-auth';

export interface ModulePermissionsResult {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  isSuperAdmin: boolean;
}

/**
 * Reusable hook to evaluate active user permissions for a given ERP module.
 * Returns boolean flags: canView, canCreate, canEdit, canDelete, canExport, isSuperAdmin.
 */
export function useModulePermission(moduleKey: string): ModulePermissionsResult {
  const { can, user } = useErpAuth();

  const isSuperAdmin = Boolean(
    user?.isSuperAdmin ||
    user?.role === 'ADMIN' ||
    user?.role === 'Super Admin' ||
    user?.role === 'super_admin'
  );

  return {
    canView: can(moduleKey, 'view'),
    canCreate: can(moduleKey, 'create'),
    canEdit: can(moduleKey, 'edit'),
    canDelete: can(moduleKey, 'delete'),
    canExport: can(moduleKey, 'export'),
    isSuperAdmin,
  };
}

/**
 * Conditional permission guards for rendering UI elements
 */
export function CanCreate({ module, children }: { module: string; children: React.ReactNode }) {
  const { canCreate } = useModulePermission(module);
  if (!canCreate) return null;
  return <>{children}</>;
}

export function CanEdit({ module, children }: { module: string; children: React.ReactNode }) {
  const { canEdit } = useModulePermission(module);
  if (!canEdit) return null;
  return <>{children}</>;
}

export function CanDelete({ module, children }: { module: string; children: React.ReactNode }) {
  const { canDelete } = useModulePermission(module);
  if (!canDelete) return null;
  return <>{children}</>;
}

export function CanExport({ module, children }: { module: string; children: React.ReactNode }) {
  const { canExport } = useModulePermission(module);
  if (!canExport) return null;
  return <>{children}</>;
}
