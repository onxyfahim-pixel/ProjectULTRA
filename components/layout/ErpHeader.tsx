'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Radio,
  ChevronDown,
  Menu,
  X,
  Lock,
  PanelLeftOpen,
  PanelLeft,
  Database,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  User,
  Settings,
  Sparkles,
  Wifi,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { useLiveSync } from '@/hooks/use-live-sync';
import { RoleBadge } from '@/components/ui/Badge';
import { DEMO_USERS } from '@/lib/auth/jwt';

interface ErpHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export function ErpHeader({
  onToggleSidebar,
  isSidebarOpen,
  isCollapsed = false,
  onToggleCollapse,
  onNavigateTab,
}: ErpHeaderProps) {
  const { user, logout, switchRole, isLoading } = useErpAuth();
  const { status } = useLiveSync();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showRbacModal, setShowRbacModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [hostInfo, setHostInfo] = useState<{
    databaseEngine: string;
    isMysqlConnected: boolean;
    primaryLanIp: string;
    port: number;
  } | null>(null);

  const lanIp = hostInfo?.primaryLanIp || '192.168.0.100';
  const lanPort = hostInfo?.port || 3000;
  const fullMobileUrl = `http://${lanIp}:${lanPort}`;

  const handleCopyMobileUrl = () => {
    navigator.clipboard.writeText(fullMobileUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Load real host & database status
  useEffect(() => {
    let isMounted = true;
    async function loadHostStatus() {
      try {
        const res = await fetch('/api/host-info');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setHostInfo({
              databaseEngine: data.databaseEngine || (data.isMysqlConnected ? 'MySQL 8.0+' : 'Local JSON DB'),
              isMysqlConnected: Boolean(data.isMysqlConnected),
              primaryLanIp: data.primaryLanIp || '127.0.0.1',
              port: data.port || 3000,
            });
          }
        }
      } catch {
        // Fallback
      }
    }
    loadHostStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Sidebar Drawer Toggle */}
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation drawer"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors cursor-pointer"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          {onToggleCollapse && (
            <button
              id="desktop-sidebar-toggle-btn"
              onClick={onToggleCollapse}
              aria-label="Toggle sidebar collapse (Ctrl+B)"
              title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <PanelLeft className="w-5 h-5" />
              )}
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                  VALIANT QMS ERP
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Industrial AQL 2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Garments Quality Management System &amp; Live Inventory
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right: Real Telemetry Badges & Logged-in User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real Database Engine Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
              {hostInfo?.isMysqlConnected ? 'MySQL 8.0' : 'Local Host DB'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hostInfo?.isMysqlConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>

          {/* Real WebSocket Host Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
              {status === 'connected' ? 'Host Online' : 'Connecting'}
            </span>
          </div>

          {/* Mobile & Wi-Fi Connect Button */}
          <button
            type="button"
            id="mobile-wifi-connect-btn"
            onClick={() => setShowMobileModal(true)}
            title="Connect Mobile or Tablet on Wi-Fi"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors shadow-2xs cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline font-bold">Mobile Access</span>
            <span className="sm:hidden font-bold">Wi-Fi</span>
          </button>

          {/* Current Logged-in User Menu */}
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all text-left text-xs shadow-2xs cursor-pointer"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  @{user.username || user.email.split('@')[0]}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active ERP Session
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{user.name}</div>
                  <div className="text-xs text-slate-500 font-mono">@{user.username || user.email}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <RoleBadge role={user.role} />
                    {user.isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>View RBAC Privileges</span>
                  </button>
                </div>

                {/* Quick Role Simulation for testing */}
                <div className="border-t border-slate-100 dark:border-slate-800 px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">@{u.username} ({u.role})</span>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>

                {/* Sign Out Button */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-2">
                  <button
                    type="button"
                    id="header-logout-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 transition-colors cursor-pointer"
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

      {/* RBAC Permissions Matrix Modal */}
      {showRbacModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Role-Based Access Control (RBAC) Matrix
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRbacModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
              Every API request is guarded by backend Express JWT verification and strict RBAC middleware:
            </p>

            <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Permission</th>
                    <th className="p-2.5 text-center">Super Admin</th>
                    <th className="p-2.5 text-center">QA Lead</th>
                    <th className="p-2.5 text-center">Inspector</th>
                    <th className="p-2.5 text-center">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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

      {/* Mobile & Tablet Wi-Fi Access Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Connect Mobile / Tablet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time Floor Access on Same Wi-Fi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Section */}
            <div className="mt-5 flex flex-col items-center">
              <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    fullMobileUrl
                  )}`}
                  alt="Scan QR Code to open ERP on Mobile"
                  className="w-44 h-44 rounded-lg object-contain"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 flex items-center gap-1.5 font-medium">
                <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Scan with phone camera to open directly
              </p>
            </div>

            {/* Direct URL Box */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Direct Mobile Address:
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 truncate select-all">
                  {fullMobileUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMobileUrl}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Troubleshooting Checklist */}
            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-blue-600" />
                If your phone cannot connect:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Same Wi-Fi:</strong> Phone must be on the exact same Wi-Fi router.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Turn OFF Mobile Data:</strong> If cellular (4G/5G) is active, your phone may ignore local Wi-Fi.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Use http://:</strong> Modern browsers require typing <code>http://</code> (do not type <code>https://</code>).
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Windows Firewall:</strong> Run <code>setup-firewall-as-admin.bat</code> on the Host PC once to set network to Private and open Port 3000.
                </li>
              </ul>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
