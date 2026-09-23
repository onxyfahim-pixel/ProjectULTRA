'use client';

import React, { useState } from 'react';
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
  Database,
  Search,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'buyer_order'
  | 'sub_supplier'
  | 'customer_complaint'
  | 'inventory'
  | 'incoming_qc'
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
  | 'settings'
  | 'standards'
  | 'architecture';

interface NavItem {
  id: NavTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
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
  const [sidebarSearch, setSidebarSearch] = useState('');

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'Overview & Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Executive Dashboard',
          description: 'Factory KPIs & Defect Overview',
          icon: LayoutDashboard,
          badge: 'Live',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
      ],
    },
    {
      groupTitle: '1. Sourcing & Order Management',
      items: [
        {
          id: 'buyer_order',
          label: 'Buyer and Order',
          description: 'Export POs, styles & SMV targets',
          icon: ShoppingBag,
          badge: '6 POs',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
          id: 'sub_supplier',
          label: 'Sub Supplier',
          description: 'Mills, yarn & trim tier rating',
          icon: Truck,
          badge: 'Tier 1',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        },
        {
          id: 'customer_complaint',
          label: 'Customer Complaint',
          description: 'Buyer claims, CAPA & debit notes',
          icon: MessageSquareWarning,
          badge: 'Open',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        },
        {
          id: 'inventory',
          label: 'Inventory',
          description: 'Real-time WebSocket fabric stock',
          icon: Boxes,
          badge: 'WS Live',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          id: 'incoming_qc',
          label: 'Incoming QC',
          description: 'ASTM D5430 4-pt & trim AQL',
          icon: Layers,
          badge: 'ASTM',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        },
      ],
    },
    {
      groupTitle: '2. Quality & Manufacturing',
      items: [
        {
          id: 'production',
          label: 'Production and Quality',
          description: 'Sewing lines 01-08 & DHU rates',
          icon: Factory,
          badge: 'Active',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        },
        {
          id: 'inspections',
          label: 'Inspection',
          description: 'In-line, end-line & final carton',
          icon: ClipboardCheck,
          badge: 'AQL 2.5',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
          id: 'defects_library',
          label: 'Defects Library',
          description: 'Standard codes & floor fixes',
          icon: BookOpen,
          badge: 'Z1.4',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        {
          id: 'testing',
          label: 'Testing',
          description: 'Textile lab & wash fastness',
          icon: FlaskConical,
          badge: 'AATCC',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        },
        {
          id: 'calibration',
          label: 'Calibration',
          description: 'Scale, cutter & metal detector',
          icon: Gauge,
          badge: 'ISO 17025',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        },
      ],
    },
    {
      groupTitle: '3. Quality Assurance & Continuous Improvement',
      items: [
        {
          id: 'kpi_management',
          label: 'KPI Management',
          description: 'DHU, RFT, CoQ & Cut-to-ship',
          icon: BarChart3,
        },
        {
          id: 'quality_goals',
          label: 'Quality Goal and Achieve',
          description: 'Strategic plant quality targets',
          icon: Target,
        },
        {
          id: 'audit',
          label: 'Audit',
          description: 'Buyer technical & ISO audits',
          icon: ShieldCheck,
        },
        {
          id: 'capa',
          label: 'CAPA',
          description: 'Corrective & preventive action (8D)',
          icon: GitPullRequest,
          badge: '8D',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        },
        {
          id: 'root_cause',
          label: 'Root Cause Analysis',
          description: '5-Why & 6M Ishikawa fishbone',
          icon: HelpCircle,
        },
        {
          id: 'risk_assessment',
          label: 'Risk Assessment',
          description: 'Failure mode & effects (FMEA)',
          icon: ShieldAlert,
          badge: 'RPN',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        {
          id: 'traceability',
          label: 'Tracibility Audit',
          description: 'Carton to yarn barcode genealogy',
          icon: QrCode,
          badge: '100% Barcode',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        },
      ],
    },
    {
      groupTitle: '4. Governance, Standards & SOPs',
      items: [
        {
          id: 'certificate',
          label: 'Certificate',
          description: 'OEKO-TEX, GOTS, ISO & WRAP',
          icon: Award,
          badge: 'Valid',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          id: 'document_control',
          label: 'Document Control',
          description: 'Master register & revisions',
          icon: Files,
        },
        {
          id: 'sop_management',
          label: 'Sop Management',
          description: 'Standard operating procedures',
          icon: BookMarked,
        },
        {
          id: 'quality_manual',
          label: 'Quality manual',
          description: 'ISO 9001 policy & clauses',
          icon: Book,
        },
        {
          id: 'procedure',
          label: 'Procedure',
          description: 'Workstation safety & PPE rules',
          icon: ClipboardList,
        },
        {
          id: 'process_flow',
          label: 'Process Flow',
          description: 'Manufacturing pipeline gates',
          icon: GitCommit,
        },
      ],
    },
    {
      groupTitle: '5. Human Capital & Plant Communication',
      items: [
        {
          id: 'organogram',
          label: 'Organogram',
          description: 'Quality division hierarchy tree',
          icon: Users,
        },
        {
          id: 'job_description',
          label: 'Job description',
          description: 'Role competencies & skills',
          icon: Briefcase,
        },
        {
          id: 'training',
          label: 'Training',
          description: 'Matrix, needle policy & exams',
          icon: GraduationCap,
        },
        {
          id: 'meeting_minutes',
          label: 'Meeting minutes',
          description: 'Management reviews & tasks',
          icon: Calendar,
        },
        {
          id: 'events',
          label: 'Events',
          description: 'Buyer delegations & schedules',
          icon: CalendarDays,
        },
        {
          id: 'communication',
          label: 'Communication portal',
          description: 'Instant quality floor bulletins',
          icon: Send,
          badge: 'Broadcast',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        },
      ],
    },
    {
      groupTitle: '6. System Settings & Architecture',
      items: [
        {
          id: 'settings',
          label: 'Setting',
          description: 'AQL limits, needle timer & WS',
          icon: Settings,
        },
        {
          id: 'standards',
          label: 'Module Standard Blueprint',
          description: 'Template for future ERP modules',
          icon: Layers,
          badge: 'Spec',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        {
          id: 'architecture',
          label: 'PostgreSQL & Express Arch',
          description: 'Prisma, JWT, RBAC & WS Engine',
          icon: Database,
          badge: 'Stack',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        },
      ],
    },
  ];

  const searchFilter = sidebarSearch.trim().toLowerCase();

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
        className={`fixed top-0 bottom-0 left-0 bg-white text-slate-700 border-r border-slate-200/90 z-40 transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col shadow-xs ${
          isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Sidebar Header */}
        <div className={`p-3.5 border-b border-slate-100 bg-slate-50/50 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="flex items-center justify-between mb-2">
            {!isCollapsed ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-800 truncate">
                  Garments QMS ERP
                </span>
              </div>
            ) : (
              <div className="mx-auto">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold text-xs" title="Garments QMS ERP (30 Modules)">
                  QMS
                </div>
              </div>
            )}

            {/* Desktop Collapse / Expand Toggle Button */}
            {onToggleCollapse && (
              <button
                type="button"
                id="sidebar-collapse-toggle-btn"
                onClick={onToggleCollapse}
                className={`hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer ${
                  isCollapsed ? 'mx-auto mt-1' : ''
                }`}
                title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            )}
          </div>

          {!isCollapsed ? (
            /* Quick Filter Search Expanded */
            <div className="relative mt-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search 30 modules..."
                className="w-full bg-white text-slate-900 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 shadow-2xs"
              />
            </div>
          ) : (
            /* Quick Search Icon in Collapsed Mode */
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer mt-1"
              title="Click to search modules"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className={`flex-1 overflow-y-auto space-y-4 ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {navGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter(
              (item) =>
                !searchFilter ||
                item.label.toLowerCase().includes(searchFilter) ||
                item.description.toLowerCase().includes(searchFilter)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {!isCollapsed ? (
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="truncate">{group.groupTitle}</span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {visibleItems.length}
                    </span>
                  </div>
                ) : (
                  <div className="my-2 border-t border-slate-200/60 relative group flex justify-center">
                    <div className="hidden group-hover:block absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded whitespace-nowrap z-50 shadow-lg pointer-events-none">
                      {group.groupTitle}
                    </div>
                  </div>
                )}

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <div key={item.id} className="relative group">
                      <button
                        id={`sidebar-nav-${item.id}`}
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        className={`w-full rounded-xl transition-all duration-150 flex items-center cursor-pointer ${
                          isCollapsed
                            ? 'justify-center p-2.5'
                            : 'justify-between p-2.5 text-left'
                        } ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs font-medium'
                            : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                        }`}
                        title={isCollapsed ? `${item.label} — ${item.description}` : undefined}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                          <div
                            className={`rounded-lg shrink-0 transition-colors ${
                              isCollapsed ? 'p-1.5' : 'p-1.5'
                            } ${
                              isActive
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:text-slate-900 group-hover:bg-slate-200'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          {!isCollapsed && (
                            <div className="min-w-0">
                              <div className={`text-xs font-semibold truncate leading-snug ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                {item.label}
                              </div>
                              <div
                                className={`text-[10px] truncate leading-tight mt-0.5 ${
                                  isActive ? 'text-blue-100' : 'text-slate-500'
                                }`}
                              >
                                {item.description}
                              </div>
                            </div>
                          )}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${
                              isActive
                                ? 'bg-blue-500 text-white border-blue-400'
                                : item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {isCollapsed && item.badge && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 border border-white" />
                        )}
                      </button>

                      {/* Hover Tooltip in Collapsed Mode */}
                      {isCollapsed && (
                        <div className="hidden group-hover:flex flex-col fixed left-20 ml-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 border border-slate-800">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-mono">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-300 font-normal">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer Note or Mini Collapse Button */}
        {!isCollapsed ? (
          <div className="p-3 m-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-slate-800">30 Unified QMS Modules</div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Press <kbd className="px-1 py-0.5 text-[9px] font-mono bg-white border border-slate-200 rounded text-slate-600 shadow-2xs">Ctrl+B</kbd> to collapse sidebar for maximum screen area.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="Expand Sidebar (Ctrl+B)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
