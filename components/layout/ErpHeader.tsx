'use client';

import React, { useState, useEffect } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
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
  Database,
} from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';

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
  { id: 'inventory', label: 'All Inventory', category: 'MAIN' },
  { id: 'planning_ie', label: 'Planning & IE (Line Balancing, SMV & Scheduling)', category: 'MAIN' },
  { id: 'production', label: 'Production & Quality Management', category: 'MAIN' },
  { id: 'kpi_management', label: 'KPI Management & DHU Analysis', category: 'MAIN' },
  { id: 'quality_goals', label: 'Quality Goal & Achieve', category: 'MAIN' },
  { id: 'report_analysis', label: 'Report And Analysis', category: 'MAIN' },
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
  const { user, logout } = useErpAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<ErpNotification[]>(INITIAL_NOTIFICATIONS);

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

  const { appearance, updateAppearance } = useAppearance();

  let headerBg = 'bg-white text-slate-800 border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs transition-colors shrink-0';
  if (appearance.topbarStyle === 'glassmorphic') {
    headerBg = 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-800 dark:text-slate-100 border-b border-white/40 dark:border-slate-800/60 sticky top-0 z-30 shadow-xs transition-colors shrink-0';
  } else if (appearance.topbarStyle === 'dark_contrast') {
    headerBg = 'bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md transition-colors shrink-0';
  } else if (appearance.topbarStyle === 'accent_tint') {
    headerBg = 'bg-blue-50/90 dark:bg-blue-950/70 backdrop-blur-md text-slate-900 dark:text-white border-b border-blue-200/80 dark:border-blue-900/60 sticky top-0 z-30 shadow-2xs transition-colors shrink-0';
  } else {
    headerBg = 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors shrink-0';
  }

  return (
    <header className={headerBg}>
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
          {/* Quick MySQL Database Status & Launcher Button */}
          <button
            type="button"
            id="topbar-mysql-status-btn"
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab('settings');
                if (typeof window !== 'undefined') {
                  localStorage.setItem('settings_active_tab', 'database_backup');
                  window.dispatchEvent(new CustomEvent('navigate-settings-subtab', { detail: 'database_backup' }));
                }
              }
            }}
            title="MySQL Enterprise Database Manager & Setup Wizard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-xs font-bold shadow-2xs cursor-pointer group"
          >
            <Database className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline font-mono text-[11px] text-slate-700">MySQL Setup</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Database Connected / Ready"></span>
          </button>

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

          {/* Theme Mode Toggle synchronized with Appearance */}
          <button
            type="button"
            onClick={() => {
              const next = appearance.theme === 'dark' ? 'light' : 'dark';
              updateAppearance({ theme: next });
              setIsDarkMode(next === 'dark');
            }}
            title="Toggle Light/Dark Theme"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            {appearance.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          {/* User Profile matching the screenshot layout: Avatar + Name + Designation */}
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationOpen(false);
              }}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left text-xs cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs">
                  {user.name ? user.name.charAt(0) : 'F'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {user.name || 'Fahim'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium leading-tight">
                  {user.designation || (user.role === 'ADMIN' ? 'QMS Executive' : (user.role as string).replace('_', ' '))}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {/* User Dropdown Menu: Shows ONLY User Profile and Logout */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* User Summary Header */}
                <div className="px-3 py-2.5 mb-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-xs">
                      {user.name ? user.name.charAt(0) : 'F'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {user.designation || (user.role === 'ADMIN' ? 'QMS Executive' : (user.role as string).replace('_', ' '))}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* ONLY 2 Actions: User Profile & Logout */}
                <div className="space-y-1">
                  <button
                    type="button"
                    id="header-user-profile-btn"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('settings_active_tab', 'user_profile');
                        window.dispatchEvent(new CustomEvent('navigate-settings-subtab', { detail: 'user_profile' }));
                      }
                      if (onNavigateTab) {
                        onNavigateTab('settings');
                      }
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform border border-blue-200/60 dark:border-blue-900/60 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-bold text-xs leading-tight">User Profile</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight truncate">
                        Personal info, plant &amp; credentials
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    type="button"
                    id="header-logout-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform border border-rose-200/60 dark:border-rose-900/60 shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-bold text-xs leading-tight">Logout</div>
                      <div className="text-[10px] text-rose-400/80 dark:text-rose-400/60 font-normal leading-tight">
                        Sign out of active host session
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-300 dark:text-rose-700 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
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
    </header>
  );
}
