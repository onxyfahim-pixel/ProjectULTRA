'use client';

import React, { useState, useEffect } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import {
  ShieldCheck,
  Shield,
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
  Palette,
  Trash2,
  Check,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';
import {
  NotificationService,
  ErpNotificationItem,
} from '@/lib/notifications/notification-service';

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
  const { user, logout, can } = useErpAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [allNotifications, setAllNotifications] = useState<ErpNotificationItem[]>([]);
  const [notifConfig, setNotifConfig] = useState(NotificationService.getConfig());
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'buyer' | 'production' | 'quality'>('all');

  useEffect(() => {
    const load = () => {
      setAllNotifications(NotificationService.getNotifications());
      setNotifConfig(NotificationService.getConfig());
    };
    load();

    const handleNotifUpdate = () => load();
    window.addEventListener('erp_notifications_updated', handleNotifUpdate);
    window.addEventListener('erp_notification_config_updated', handleNotifUpdate);

    return () => {
      window.removeEventListener('erp_notifications_updated', handleNotifUpdate);
      window.removeEventListener('erp_notification_config_updated', handleNotifUpdate);
    };
  }, []);

  // Filter alerts specifically for this active user based on their role and module permissions
  const userNotifications = React.useMemo(() => {
    return NotificationService.filterForUser(allNotifications, user, can, notifConfig);
  }, [allNotifications, user, can, notifConfig]);

  const displayedNotifications = React.useMemo(() => {
    if (notifFilter === 'unread') return userNotifications.filter((n) => !n.read);
    if (notifFilter === 'buyer') return userNotifications.filter((n) => n.module === 'buyer_order');
    if (notifFilter === 'production') {
      return userNotifications.filter((n) => n.module === 'production' || n.module === 'planning_ie');
    }
    if (notifFilter === 'quality') {
      return userNotifications.filter(
        (n) =>
          n.module === 'inspections' ||
          n.module === 'defects_library' ||
          n.module === 'incoming_qc' ||
          n.module === 'testing' ||
          n.module === 'calibration' ||
          n.module === 'capa'
      );
    }
    return userNotifications;
  }, [userNotifications, notifFilter]);

  const unreadCount = userNotifications.filter((n) => !n.read).length;

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
    const userNotifIds = new Set(userNotifications.map((n) => n.id));
    const updated = allNotifications.map((n) => (userNotifIds.has(n.id) ? { ...n, read: true } : n));
    NotificationService.saveNotifications(updated);
  };

  const handleNotificationClick = (notif: ErpNotificationItem) => {
    const updated = allNotifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
    NotificationService.saveNotifications(updated);
    if (notif.module && onNavigateTab) {
      onNavigateTab(notif.module);
      setIsNotificationOpen(false);
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = allNotifications.filter((n) => n.id !== id);
    NotificationService.saveNotifications(updated);
  };

  const handleClearAll = () => {
    const userNotifIds = new Set(userNotifications.map((n) => n.id));
    const updated = allNotifications.filter((n) => !userNotifIds.has(n.id));
    NotificationService.saveNotifications(updated);
  };

  const handleOpenNotificationSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('settings_active_tab', 'notification');
      window.dispatchEvent(new CustomEvent('navigate-settings-subtab', { detail: 'notification' }));
    }
    if (onNavigateTab) {
      onNavigateTab('settings');
    }
    setIsNotificationOpen(false);
  };

  const matchedModules = globalSearch.trim()
    ? SEARCHABLE_MODULES.filter((m) => {
        if (!can(m.id, 'view')) return false;
        return (
          m.label.toLowerCase().includes(globalSearch.toLowerCase()) ||
          m.category.toLowerCase().includes(globalSearch.toLowerCase())
        );
      })
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

          {/* Notifications Button & Dropdown with Role-Aware Filtering */}
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
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Role-Based Notification Panel Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[420px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Alert Center
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                      {userNotifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                          title="Clear all alerts"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Role Targeting Banner */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="truncate">
                      Role Access: <span className="font-bold text-slate-800 dark:text-slate-200">{user.role || 'Super Admin'}</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {userNotifications.length} permitted {userNotifications.length === 1 ? 'alert' : 'alerts'}
                    </span>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
                    {[
                      { id: 'all', label: `All (${userNotifications.length})` },
                      { id: 'unread', label: `Unread (${unreadCount})` },
                      { id: 'buyer', label: 'Orders' },
                      { id: 'production', label: 'Production' },
                      { id: 'quality', label: 'Quality & QC' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setNotifFilter(tab.id as any)}
                        className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                          notifFilter === tab.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications Scrollable List */}
                <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 flex-1 px-1 py-1 min-h-[160px] max-h-[380px]">
                  {displayedNotifications.length === 0 ? (
                    <div className="py-12 px-6 text-center text-slate-400 dark:text-slate-500 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <Check className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No notifications in this view
                      </p>
                      <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
                        Alerts are filtered in real-time according to permissions for <span className="font-semibold text-slate-800 dark:text-slate-200">"{user.role || 'Viewer'}"</span>.
                      </p>
                    </div>
                  ) : (
                    displayedNotifications.map((notif) => {
                      const iconColor =
                        notif.severity === 'urgent'
                          ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60'
                          : notif.severity === 'warning'
                          ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60'
                          : notif.severity === 'success'
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60'
                          : 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60';

                      const moduleBadge = notif.module
                        ? notif.module.replace(/_/g, ' ').toUpperCase()
                        : 'SYSTEM';

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 group relative ${
                            !notif.read
                              ? 'bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 border shadow-2xs ${iconColor}`}>
                            {notif.severity === 'urgent' && <AlertCircle className="w-4 h-4" />}
                            {notif.severity === 'warning' && <AlertTriangle className="w-4 h-4" />}
                            {notif.severity === 'success' && <CheckCircle2 className="w-4 h-4" />}
                            {notif.severity === 'info' && <Info className="w-4 h-4" />}
                          </div>

                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {moduleBadge}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                • {notif.timestamp}
                              </span>
                            </div>

                            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {notif.title}
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                              {notif.message}
                            </p>

                            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Open module view</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </div>
                          </div>

                          {/* Delete single notification button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                            className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2.5 right-2 cursor-pointer"
                            title="Dismiss alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2 absolute top-2 right-2.5 group-hover:opacity-0 transition-opacity" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Link to Notification Settings */}
                <div className="p-2.5 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenNotificationSettings}
                    className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Notification Settings &amp; Role Matrix</span>
                  </button>

                  <span className="text-[10px] text-slate-400">
                    Auto-synced
                  </span>
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
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate flex items-center justify-between">
                      <span>{user.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {user.role || 'Super Admin'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {user.designation || (user.role === 'ADMIN' ? 'QMS Executive' : (user.role as string).replace('_', ' '))}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Actions: User Profile, Appearance Setting, Users & Roles (Super Admin Only), Logout */}
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
                    id="header-appearance-btn"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('settings_active_tab', 'appearance');
                        window.dispatchEvent(new CustomEvent('navigate-settings-subtab', { detail: 'appearance' }));
                      }
                      if (onNavigateTab) {
                        onNavigateTab('settings');
                      }
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform border border-purple-200/60 dark:border-purple-900/60 shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-bold text-xs leading-tight">Appearance Setting</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight truncate">
                        Visual themes, colors &amp; display styles
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {(user?.isSuperAdmin || user?.role === 'Super Admin' || user?.role === 'ADMIN') && (
                    <button
                      type="button"
                      id="header-users-rbac-btn"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('settings_active_tab', 'users_rbac');
                          window.dispatchEvent(new CustomEvent('navigate-settings-subtab', { detail: 'users_rbac' }));
                        }
                        if (onNavigateTab) {
                          onNavigateTab('settings');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform border border-indigo-200/60 dark:border-indigo-900/60 shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-bold text-xs leading-tight">Users &amp; Roles</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight truncate">
                          RBAC permissions &amp; access control matrix
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  )}

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
