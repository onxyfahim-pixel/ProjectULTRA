'use client';

import React from 'react';
import { QualityGrade, StockStatus, InspectionStatus, Role } from '@/lib/types/erp';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'slate'
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'blue'
    | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  const chosenStyle = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap transition-colors ${chosenStyle} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}

export function GradeBadge({ grade }: { grade: QualityGrade }) {
  switch (grade) {
    case 'GRADE_A':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Grade A (Export Ready)
        </Badge>
      );
    case 'GRADE_B':
      return (
        <Badge variant="info">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          Grade B (Commercial)
        </Badge>
      );
    case 'ON_HOLD':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          On Hold (Lab Test)
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          Rejected (Scrap/Rework)
        </Badge>
      );
    default:
      return <Badge>{grade}</Badge>;
  }
}

export function StatusBadge({
  status,
  label,
  variant,
}: {
  status?: StockStatus | InspectionStatus | string;
  label?: string;
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'slate'
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'blue'
    | 'neutral'
    | string;
}) {
  const displayText = label || (status ? status.replace(/_/g, ' ') : '');

  if (variant) {
    return <Badge variant={variant as any}>{displayText}</Badge>;
  }

  switch (status) {
    case 'IN_STOCK':
    case 'PASSED':
    case 'ACTIVE':
    case 'VALID':
    case 'CLOSED':
    case 'COMPLETED':
    case 'ACHIEVED':
    case 'ACCEPTED':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {displayText}
        </Badge>
      );
    case 'ALLOCATED':
    case 'CONDITIONAL_PASS':
    case 'IN_PROGRESS':
    case 'SCHEDULED':
      return (
        <Badge variant="info">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {displayText}
        </Badge>
      );
    case 'INSPECTING':
    case 'RUNNING':
    case 'UNDER_INVESTIGATION':
    case 'DUE_SOON':
    case 'EXPIRING_SOON':
    case 'ACTIONS_PENDING':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {displayText}
        </Badge>
      );
    case 'DISPATCHED':
      return (
        <Badge variant="purple">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {displayText}
        </Badge>
      );
    case 'REJECTED':
    case 'FAILED':
    case 'OVERDUE':
    case 'EXPIRED':
    case 'CRITICAL':
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {displayText}
        </Badge>
      );
    default:
      return <Badge>{displayText}</Badge>;
  }
}

export function RoleBadge({ role }: { role: Role }) {
  const configs: Record<Role, { label: string; variant: BadgeProps['variant'] }> = {
    ADMIN: { label: 'Administrator (Super)', variant: 'purple' },
    QA_MANAGER: { label: 'QA Lead (AQL Authority)', variant: 'info' },
    WAREHOUSE_INSPECTOR: { label: 'Warehouse Inspector', variant: 'success' },
    PRODUCTION_HEAD: { label: 'Production Head', variant: 'warning' },
    OPERATOR: { label: 'Floor Operator', variant: 'default' },
  };

  const config = configs[role] || { label: role, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
