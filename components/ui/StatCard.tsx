'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  icon: LucideIcon | React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  tone?: 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'purple' | 'slate';
  progressPercent?: number;
  badge?: string;
  id?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  delta,
  icon,
  iconBgColor,
  iconColor,
  tone,
  progressPercent,
  badge,
  id,
}: StatCardProps) {
  const toneMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700' },
  };

  const finalBgColor =
    iconBgColor || (tone ? toneMap[tone]?.bg : 'bg-blue-50');
  const finalIconColor =
    iconColor || (tone ? toneMap[tone]?.text : 'text-blue-600');

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-5 h-5" />;
    }
    return null;
  };

  return (
    <div
      id={id}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            {badge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${finalBgColor} ${finalIconColor} shrink-0`}>
          {renderIcon()}
        </div>
      </div>

      {(subtitle || delta) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {delta && (
            <span
              className={`font-semibold flex items-center gap-0.5 ${
                delta.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {delta.isPositive ? '↑' : '↓'} {delta.value}
            </span>
          )}
          {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
        </div>
      )}

      {typeof progressPercent === 'number' && (
        <div className="mt-3">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
