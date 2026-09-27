'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  LogOut,
  User,
  Settings,
  Bell,
  Maximize,
  Minimize,
  Search,
  Calendar,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { RoleBadge } from '@/components/ui/Badge';
import { DEMO_USERS } from '@/lib/auth/jwt';

interface ErpNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'urgent' | 'warning' | 'success' | 'info';
  read: boolean;
  module?: string;
}

const INITIAL_NOTIFICATIONS: ErpNotification[] = [
  {
    id: 'notif-1',
    title: 'DHU Spike Alert — Line 04',
    message: 'Sewing Line 04 exceeded 3.5% DHU threshold (Current: 4.8%). Broken stitch recurring.',
    timestamp: '10m ago',
    type: 'urgent',
    read: false,
    module: 'production',
  },
  {
    id: 'notif-2',
    title: 'ASTM D5430 Roll Passed',
    message: 'Fabric Roll #LOT-88241 passed 4-Point inspection with 14 penalty pts/100 sq.yd.',
    timestamp: '35m ago',
    type: 'success',
    read: false,
    module: 'incoming_qc',
  },
  {
    id: 'notif-3',
    title: 'CAPA 8D Sign-off Required',
    message: 'Buyer H&M issued CAPA-2024-019 for color shading on Style #HM-8840.',
    timestamp: '1h ago',
    type: 'warning',
    read: false,
    module: 'capa',
  },
  {
    id: 'notif-4',
    title: 'Texpedia Post Verified',
    message: 'QA Lead approved technical solution: "Skipped stitch prevention on denim lockstitch".',
    timestamp: '3h ago',
    type: 'info',
    read: true,
    module: 'texpedia',
  },
];

const SEARCHABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard — Factory Command Center', category: 'MAIN' },
  { id: 'buyer_order', label: 'Buyer & Order Management', category: 'MAIN' },
  { id: 'inventory', label: 'Fabric Inventory & Stocks', category: 'MAIN' },
  { id: 'planning_ie', label: 'Planning & IE (Line Balancing, SMV & Scheduling)', category: 'MAIN' },
  { id: 'production', label: 'Production & Quality Management', category: 'MAIN' },
  { id: 'kpi_management', label: 'KPI Management & DHU Analysis', category: 'MAIN' },
  { id: 'quality_goals', label: 'Quality Goal & Achieve', category: 'MAIN' },
  { id: 'inspections', label: 'In-line & Final Inspections (AQL 2.5)', category: 'QUALITY' },
  { id: 'defects_library', label: 'Defect Library & Fixes', category: 'QUALITY' },
  { id: 'capa', label: 'CAPA (8D Corrective Actions)', category: 'QUALITY' },
  { id: 'customer_complaint', label: 'Customer Complaints & Claims', category: 'QUALITY' },
  { id: 'testing', label: 'Lab & Wash Fastness Testing', category: 'QUALITY' },
  { id: 'calibration', label: 'Calibration (ISO 17025)', category: 'QUALITY' },
  { id: 'incoming_qc', label: 'Incoming QC (ASTM D5430 4-pt)', category: 'QUALITY' },
  { id: 'audit', label: 'Audit ISO 9001:2015 & Technical', category: 'COMPLIANCE' },
  { id: 'risk_assessment', label: 'Risk Assessment (FMEA)', category: 'COMPLIANCE' },
  { id: 'traceability', label: 'Traceability Audit (Carton to Yarn)', category: 'COMPLIANCE' },
  { id: 'certificate', label: 'Compliance Certificates', category: 'COMPLIANCE' },
  { id: 'sub_supplier', label: 'Sub Supplier Tier Rating', category: 'COMPLIANCE' },
  { id: 'sop_management', label: 'SOP Management', category: 'DOCUMENTS' },
  { id: 'quality_manual', label: 'Quality Manual', category: 'DOCUMENTS' },
  { id: 'procedure', label: 'Guidelines & Procedure', category: 'DOCUMENTS' },
  { id: 'process_flow', label: 'Manufacturing Process Flow', category: 'DOCUMENTS' },
  { id: 'document_control', label: 'Document Control Register', category: 'DOCUMENTS' },
  { id: 'job_description', label: 'Job Description Matrix', category: 'DOCUMENTS' },
  { id: 'training', label: 'Training Matrix & Skills', category: 'DOCUMENTS' },
  { id: 'texpedia', label: 'Texpedia Knowledge Community', category: 'COMMUNITY' },
  { id: 'communication', label: 'Communication Floor Portal', category: 'COMMUNITY' },
  { id: 'root_cause', label: 'Root Cause Analysis (Fishbone/5-Why)', category: 'COMMUNITY' },
  { id: 'organogram', label: 'Quality Organogram', category: 'COMMUNITY' },
  { id: 'meeting_minutes', label: 'Quality Meeting Minutes', category: 'COMMUNITY' },
  { id: 'events', label: 'Delegations & Events', category: 'COMMUNITY' },
  { id: 'settings', label: 'System Configuration & Limits', category: 'SYSTEM' },
  { id: 'standards', label: 'Module Standard Blueprint', category: 'SYSTEM' },
  { id: 'architecture', label: 'PostgreSQL & Express Arch', category: 'SYSTEM' },
];

interface ErpHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigateTab?: (tab: any) => void;
  activeTab?: string;
}

export function ErpHeader({
  onToggleSidebar,
  isSidebarOpen,
  isCollapsed = false,
  onToggleCollapse,
  onNavigateTab,
  activeTab,
}: ErpHeaderProps) {
  const { user, logout, switchRole, isLoading } = useErpAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<ErpNotification[]>(INITIAL_NOTIFICATIONS);
  const [showRbacModal, setShowRbacModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Listen to fullscreen changes across all browsers
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(
        Boolean(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const el = document.documentElement as any;

      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isFs) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Native fullscreen not permitted or failed, toggling state:', err);
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: ErpNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.module && onNavigateTab) {
      onNavigateTab(notif.module);
      setIsNotificationOpen(false);
    }
  };

  const matchedModules = globalSearch.trim()
    ? SEARCHABLE_MODULES.filter((m) =>
        m.label.toLowerCase().includes(globalSearch.toLowerCase()) ||
        m.category.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : [];

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs transition-colors shrink-0">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Drawer Toggle / Desktop Collapse & Universal Search Bar */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile Sidebar Toggle */}
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation drawer"
            title="Open navigation menu"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors cursor-pointer border border-slate-200 shadow-2xs"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop Sidebar Toggle Button */}
          {onToggleCollapse && (
            <button
              id="desktop-sidebar-collapse-btn"
              onClick={onToggleCollapse}
              aria-label="Toggle sidebar collapse (Ctrl+B)"
              title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Universal Search Bar matching QMS reference design */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search anything... (Orders, PO, Style, Buyer, Inspection, Defects, CAPA, Audit, Documents, Reports)"
              className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 transition-all shadow-2xs"
            />

            {/* Quick Search Results Dropdown */}
            {isSearchFocused && matchedModules.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 max-h-72 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Matching Modules ({matchedModules.length})
                </div>
                {matchedModules.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab(m.id);
                      setGlobalSearch('');
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <span className="font-medium truncate">{m.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">{m.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Notification, Calendar, Fullscreen, Theme, User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Notifications Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="topbar-notifications-btn"
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                setIsUserMenuOpen(false);
              }}
              title="Quality & Plant Alerts"
              aria-label="Quality & Plant Alerts"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Plant Alerts &amp; QA Feed
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 px-1 py-1">
                  {notifications.map((notif) => {
                    const iconColor =
                      notif.type === 'urgent'
                        ? 'text-rose-600 bg-rose-50'
                        : notif.type === 'warning'
                        ? 'text-amber-600 bg-amber-50'
                        : notif.type === 'success'
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-blue-600 bg-blue-50';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 rounded-xl transition-colors cursor-pointer flex items-start gap-3 ${
                          !notif.read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${iconColor}`}>
                          {notif.type === 'urgent' && <AlertCircle className="w-4 h-4" />}
                          {notif.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                          {notif.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                          {notif.type === 'info' && <Info className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Calendar Quick Action */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('events')}
            title="Quality Calendar &amp; Buyer Schedules"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            id="topbar-fullscreen-toggle-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFullscreen();
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F11)'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className={`p-2 rounded-xl transition-all cursor-pointer shadow-2xs border ${
              isFullscreen
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
            }`}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-blue-600" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Theme Mode Toggle matching picture */}
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Light/Dark Theme"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            {isDarkMode ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          {/* User Profile matching the screenshot layout: Avatar + Fahim + QMS Executive */}
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationOpen(false);
              }}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-xl hover:bg-slate-100 transition-all text-left text-xs cursor-pointer"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs">
                  {user.name.charAt(0) || 'F'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user.name || 'Fahim'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium leading-tight">
                  {user.role === 'ADMIN' ? 'QMS Executive' : (user.role as string).replace('_', ' ')}
                </div>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active ERP Session
                  </div>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">{user.name}</div>
                  <div className="text-xs text-slate-500 font-mono">@{user.username || user.email}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <RoleBadge role={user.role} />
                    {user.isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                        SUPER ADMIN
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-2 py-1.5 space-y-1">
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab('settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>System Settings</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowRbacModal(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>View RBAC Privileges</span>
                  </button>
                </div>

                {/* Quick Role Simulation for testing */}
                <div className="border-t border-slate-100 px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Test Role Switcher
                </div>

                <div className="px-2 space-y-0.5">
                  {DEMO_USERS.map((u) => {
                    const isCurrent = u.role === user.role;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchRole(u.role);
                          setIsUserMenuOpen(false);
                        }}
                        disabled={isLoading}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate">@{u.username} ({u.role})</span>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>

                {/* Sign Out Button */}
                <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                  <button
                    type="button"
                    id="header-logout-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of ERP Host</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for open dropdown menus */}
      {(isUserMenuOpen || isNotificationOpen || isSearchFocused) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsNotificationOpen(false);
            setIsSearchFocused(false);
          }}
        />
      )}

      {/* RBAC Permissions Matrix Modal */}
      {showRbacModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Role-Based Access Control (RBAC) Matrix
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRbacModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Every API request is guarded by backend Express JWT verification and strict RBAC middleware:
            </p>

            <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Permission</th>
                    <th className="p-2.5 text-center">Super Admin</th>
                    <th className="p-2.5 text-center">QA Lead</th>
                    <th className="p-2.5 text-center">Inspector</th>
                    <th className="p-2.5 text-center">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">Create &amp; Manage Users</td>
                    <td className="p-2.5 text-center text-emerald-600 font-bold">✓ (Exclusive)</td>
                    <td className="p-2.5 text-center text-rose-500">✕</td>
                    <td className="p-2.5 text-center text-rose-500">✕</td>
                    <td className="p-2.5 text-center text-rose-500">✕</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Edit Warehouse Stock</td>
                    <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="p-2.5 text-center text-rose-500">✕</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Batch Approve Grade A</td>
                    <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="p-2.5 text-center text-rose-500">✕</td>
                    <td className="p-2.5 text-center text-rose-500">✕</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Conduct QMS Inspections</td>
                    <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="p-2.5 text-center text-rose-500">✕</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRbacModal(false)}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
