'use client';

import React from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  MessageSquareWarning,
  Boxes,
  Layers,
  Factory,
  ClipboardCheck,
  BookOpen,
  FlaskConical,
  Gauge,
  BarChart3,
  Target,
  ShieldCheck,
  GitPullRequest,
  HelpCircle,
  ShieldAlert,
  QrCode,
  Award,
  Files,
  BookMarked,
  Book,
  ClipboardList,
  GitCommit,
  Users,
  Briefcase,
  GraduationCap,
  Calendar,
  CalendarDays,
  Send,
  Settings,
  FileBarChart,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Lightbulb,
  X,
  User,
  HelpCircle as LifeBuoy,
  Sliders,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'buyer_order'
  | 'sub_supplier'
  | 'customer_complaint'
  | 'inventory'
  | 'incoming_qc'
  | 'planning_ie'
  | 'production'
  | 'inspections'
  | 'defects_library'
  | 'testing'
  | 'calibration'
  | 'kpi_management'
  | 'quality_goals'
  | 'audit'
  | 'capa'
  | 'root_cause'
  | 'risk_assessment'
  | 'traceability'
  | 'certificate'
  | 'document_control'
  | 'sop_management'
  | 'quality_manual'
  | 'procedure'
  | 'process_flow'
  | 'organogram'
  | 'job_description'
  | 'training'
  | 'meeting_minutes'
  | 'events'
  | 'communication'
  | 'texpedia'
  | 'settings'
  | 'report_analysis';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasChevron?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

interface ErpSidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ErpSidebar({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: ErpSidebarProps) {
  // Navigation organized exactly as shown in the reference QMS design with all ERP modules included
  const navGroups: NavGroup[] = [
    {
      groupTitle: 'MAIN',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'buyer_order',
          label: 'Buyer & Order',
          icon: ShoppingBag,
        },
        {
          id: 'inventory',
          label: 'All Inventory',
          icon: Boxes,
        },
        {
          id: 'planning_ie',
          label: 'Planning & IE',
          icon: Sliders,
          hasChevron: true,
        },
        {
          id: 'production',
          label: 'Production & Quality',
          icon: Factory,
          hasChevron: true,
        },
        {
          id: 'kpi_management',
          label: 'KPI Management',
          icon: BarChart3,
          hasChevron: true,
        },
        {
          id: 'quality_goals',
          label: 'Quality Goal',
          icon: Target,
          hasChevron: true,
        },
        {
          id: 'report_analysis',
          label: 'Report And Analysis',
          icon: FileBarChart,
        },
      ],
    },
    {
      groupTitle: 'QUALITY',
      items: [
        {
          id: 'inspections',
          label: 'Inspection',
          icon: ClipboardCheck,
        },
        {
          id: 'defects_library',
          label: 'Defect Library',
          icon: BookOpen,
        },
        {
          id: 'capa',
          label: 'CAPA',
          icon: GitPullRequest,
        },
        {
          id: 'customer_complaint',
          label: 'Customer Complaint',
          icon: MessageSquareWarning,
        },
        {
          id: 'testing',
          label: 'Testing',
          icon: FlaskConical,
        },
        {
          id: 'calibration',
          label: 'Calibration',
          icon: Gauge,
        },
        {
          id: 'incoming_qc',
          label: 'Incoming QC',
          icon: Layers,
        },
      ],
    },
    {
      groupTitle: 'COMPLIANCE',
      items: [
        {
          id: 'audit',
          label: 'Audit ISO 9001:2015',
          icon: ShieldCheck,
        },
        {
          id: 'risk_assessment',
          label: 'Risk Assessment',
          icon: ShieldAlert,
        },
        {
          id: 'traceability',
          label: 'Traceability Audit',
          icon: QrCode,
        },
        {
          id: 'certificate',
          label: 'Certificate',
          icon: Award,
        },
        {
          id: 'sub_supplier',
          label: 'Sub Supplier',
          icon: Truck,
        },
      ],
    },
    {
      groupTitle: 'DOCUMENTS',
      items: [
        {
          id: 'sop_management',
          label: 'SOP Management',
          icon: BookMarked,
        },
        {
          id: 'quality_manual',
          label: 'Quality Manual',
          icon: Book,
        },
        {
          id: 'procedure',
          label: 'Guidelines & Procedure',
          icon: ClipboardList,
        },
        {
          id: 'process_flow',
          label: 'Process Flow',
          icon: GitCommit,
        },
        {
          id: 'document_control',
          label: 'Document Control',
          icon: Files,
        },
        {
          id: 'job_description',
          label: 'Job Description',
          icon: Briefcase,
        },
        {
          id: 'training',
          label: 'Training',
          icon: GraduationCap,
        },
      ],
    },
    {
      groupTitle: 'COMMUNITY & COLLABORATION',
      items: [
        {
          id: 'texpedia',
          label: 'Texpedia Knowledge Base',
          icon: Lightbulb,
        },
        {
          id: 'communication',
          label: 'Communication Portal',
          icon: Send,
        },
        {
          id: 'root_cause',
          label: 'Root Cause Analysis',
          icon: HelpCircle,
        },
        {
          id: 'organogram',
          label: 'Organogram',
          icon: Users,
        },
        {
          id: 'meeting_minutes',
          label: 'Meeting Minutes',
          icon: Calendar,
        },
        {
          id: 'events',
          label: 'Delegations & Events',
          icon: CalendarDays,
        },
      ],
    },
    {
      groupTitle: 'SYSTEM & SETTINGS',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
        },
      ],
    },
  ];

  const { appearance } = useAppearance();

  const isDarkSidebar =
    appearance.sidebarStyle === 'dark_slate' ||
    appearance.sidebarStyle === 'vibrant_accent' ||
    appearance.sidebarStyle === 'deep_indigo';

  let asideBg = 'bg-white text-slate-700 border-r border-slate-200/80';
  if (appearance.sidebarStyle === 'dark_slate') {
    asideBg = 'bg-slate-900 text-slate-200 border-r border-slate-800 shadow-xl';
  } else if (appearance.sidebarStyle === 'frosted_glass') {
    asideBg = 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-800 dark:text-slate-200 border-r border-white/40 dark:border-slate-800/60 shadow-lg';
  } else if (appearance.sidebarStyle === 'vibrant_accent') {
    asideBg = 'bg-gradient-to-b from-blue-950 via-slate-900 to-indigo-950 text-white border-r border-blue-900/40 shadow-2xl';
  } else if (appearance.sidebarStyle === 'deep_indigo') {
    asideBg = 'bg-indigo-950 text-indigo-100 border-r border-indigo-900/60 shadow-2xl';
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="erp-main-sidebar"
        className={`fixed top-0 bottom-0 left-0 ${asideBg} z-40 transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col shadow-xs h-full shrink-0 ${
          isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header matching QMS ERP reference design */}
        <div className={`border-b ${isDarkSidebar ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'} ${isCollapsed ? 'p-2.5' : 'px-4 py-3.5'}`}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className={`font-bold text-sm tracking-tight leading-tight ${isDarkSidebar ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    QMS ERP
                  </div>
                  <div className={`text-[10px] font-medium tracking-tight truncate ${isDarkSidebar ? 'text-slate-400' : 'text-slate-400'}`}>
                    Garments Quality Management
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                {onToggleCollapse && (
                  <button
                    type="button"
                    id="sidebar-collapse-toggle-btn"
                    onClick={onToggleCollapse}
                    className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    title="Collapse Sidebar"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close sidebar drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Collapsed Mode: Centered Logo + Expand Button */
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 cursor-pointer"
                title="QMS ERP — Garments Quality Management (Click to expand)"
                onClick={onToggleCollapse}
              >
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>

              {onToggleCollapse && (
                <button
                  type="button"
                  id="sidebar-expand-toggle-btn"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Expand Sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Groups with clean uppercase section titles */}
        <div className={`flex-1 overflow-y-auto space-y-4 pb-6 ${isCollapsed ? 'p-2' : 'px-3 py-3'}`}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              {!isCollapsed ? (
                <div className={`px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider select-none ${
                  isDarkSidebar ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {group.groupTitle}
                </div>
              ) : (
                <div className={`my-2 border-t relative group flex justify-center ${isDarkSidebar ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div className="hidden group-hover:block absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded whitespace-nowrap z-50 shadow-lg pointer-events-none">
                    {group.groupTitle}
                  </div>
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                const activeClasses = isDarkSidebar
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                  : 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold shadow-2xs';

                const inactiveClasses = isDarkSidebar
                  ? 'text-slate-300 hover:text-white hover:bg-white/10 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60 font-medium';

                return (
                  <div key={item.id} className="relative group">
                    <button
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full rounded-xl transition-all duration-150 flex items-center justify-between cursor-pointer ${
                        isCollapsed
                          ? 'justify-center p-2'
                          : 'px-3 py-2 text-left'
                      } ${isActive ? activeClasses : inactiveClasses}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? isDarkSidebar ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                              : isDarkSidebar ? 'text-slate-400 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />

                        {!isCollapsed && (
                          <span className="text-xs truncate">{item.label}</span>
                        )}
                      </div>

                      {!isCollapsed && item.hasChevron && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive
                              ? isDarkSidebar ? 'text-white/60' : 'text-blue-400'
                              : isDarkSidebar ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-300 group-hover:text-slate-400'
                          }`}
                        />
                      )}
                    </button>

                    {/* Hover Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="hidden group-hover:flex items-center fixed left-20 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 border border-slate-800 font-semibold">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Quick Links matching screenshot: Settings, Help & Support, Profile */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-100 space-y-0.5 bg-slate-50/40">
            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('communication')}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-slate-400" />
              <span>Help &amp; Support</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Profile</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
