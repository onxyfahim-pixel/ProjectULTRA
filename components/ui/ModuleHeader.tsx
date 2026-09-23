'use client';

import React from 'react';
import { LayoutDashboard, Table2, ArrowRight } from 'lucide-react';

export type ModuleViewMode = 'summary' | 'list' | 'buyer' | string;

export interface ModuleTabOption {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number | string;
}

export interface ModuleHeaderProps {
  id?: string;
  className?: string;
  title: string;
  subtitle?: string;
  moduleCode?: string;
  badge?: string;
  activeView: ModuleViewMode;
  onViewChange: (view: any) => void;
  summaryLabel?: string;
  listLabel?: string;
  summaryCount?: number | string;
  listCount?: number | string;
  customTabs?: ModuleTabOption[];
  actions?: React.ReactNode;
}

export function ModuleHeader({
  id = 'module-header',
  className = '',
  title,
  subtitle,
  moduleCode,
  badge,
  activeView,
  onViewChange,
  summaryLabel = 'Summary',
  listLabel = 'List',
  summaryCount,
  listCount,
  customTabs,
  actions,
}: ModuleHeaderProps) {
  const tabsToRender: ModuleTabOption[] = customTabs && customTabs.length > 0
    ? customTabs
    : [
        {
          id: 'summary',
          label: summaryLabel,
          icon: LayoutDashboard,
          count: summaryCount,
        },
        {
          id: 'list',
          label: listLabel,
          icon: Table2,
          count: listCount,
        },
      ];

  return (
    <div id={id} className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Title & Metadata */}
        <div className={subtitle || moduleCode || badge ? 'space-y-1' : ''}>
          {(moduleCode || badge) && (
            <div className="flex items-center gap-2 flex-wrap">
              {moduleCode && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {moduleCode}
                </span>
              )}
              {badge && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {badge}
                </span>
              )}
            </div>
          )}
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Summary / List / Custom Tabs & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented Top View Toggle Buttons */}
          <div
            id={`${id}-tabs`}
            className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs gap-1"
            role="tablist"
          >
            {tabsToRender.map((tab) => {
              const isActive = activeView === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`${id}-${tab.id}-btn`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onViewChange(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {IconComp && <IconComp className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function SwitchToListBanner({
  label = 'View Detailed Records in Data List',
  onSwitchToList,
  recordCount,
}: {
  label?: string;
  onSwitchToList: () => void;
  recordCount?: number;
}) {
  return (
    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="text-xs text-blue-900">
        <span className="font-semibold">Looking for the full register?</span>{' '}
        <span className="text-blue-700">
          {recordCount ? `Showing summary analytics across all ${recordCount} records.` : 'Switch to full list to filter, search, and perform bulk actions.'}
        </span>
      </div>
      <button
        type="button"
        onClick={onSwitchToList}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs shrink-0 cursor-pointer"
      >
        <span>{label}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
