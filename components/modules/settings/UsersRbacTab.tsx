'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  PlusCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Image as ImageIcon,
  Sparkles,
  LogIn,
  RefreshCw,
  Info,
  CheckSquare,
  Square,
  Activity,
  ShoppingBag,
  Truck,
  Inbox,
  MessageSquareWarning,
  Layers,
  Factory,
  ClipboardCheck,
  BookOpen,
  FlaskConical,
  Gauge,
  GitPullRequest,
  HelpCircle,
  QrCode,
  Award,
  Files,
  BookMarked,
  Book,
  ClipboardList,
  GitCommit,
  Briefcase,
  GraduationCap,
  Calendar,
  CalendarDays,
  Send,
  Lightbulb,
  BarChart3,
  Target,
  FileBarChart,
  Sliders,
  Settings,
} from 'lucide-react';
import { AppUser, Role } from '@/lib/types/erp';
import { useErpAuth } from '@/hooks/use-erp-auth';
import {
  RoleDefinition,
  ModulePermission,
  ERP_MODULE_CATALOG,
  ALL_MODULE_IDS,
  createFullPermissions,
  createEmptyPermissions,
  DEFAULT_SYSTEM_ROLES,
} from '@/lib/auth/rbac-rules';

// Icon mapping for each module ID in the Access Control Matrix
const MODULE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: Activity,
  buyer_order: ShoppingBag,
  sub_supplier: Truck,
  inventory: Inbox,
  customer_complaint: MessageSquareWarning,
  incoming_qc: CheckSquare,
  production: Factory,
  inspections: ClipboardCheck,
  defects_library: BookOpen,
  testing: FlaskConical,
  calibration: Gauge,
  audit: ShieldCheck,
  capa: GitPullRequest,
  root_cause: HelpCircle,
  risk_assessment: ShieldAlert,
  traceability: QrCode,
  certificate: Award,
  document_control: Files,
  sop_management: BookMarked,
  quality_manual: Book,
  procedure: ClipboardList,
  process_flow: GitCommit,
  organogram: Users,
  job_description: Briefcase,
  training: GraduationCap,
  meeting_minutes: Calendar,
  events: CalendarDays,
  communication: Send,
  texpedia: Lightbulb,
  kpi_management: BarChart3,
  quality_goals: Target,
  report_analysis: FileBarChart,
  planning_ie: Sliders,
  settings: Settings,
};

export function UsersRbacTab() {
  const { user: currentUser, roles, refreshRoles, switchUser, switchRole } = useErpAuth();

  // Top tab: 'users' or 'roles'
  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'users'>('roles');

  // Users State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Add / Edit User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'Inspector',
    department: 'Quality Inspection',
    avatarUrl: '',
    isActive: true,
  });

  // Role Modal State (Image 2)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleForm, setRoleForm] = useState<{
    id: string;
    name: string;
    description: string;
    isSystemRole: boolean;
    permissions: Record<string, ModulePermission>;
  }>({
    id: '',
    name: '',
    description: '',
    isSystemRole: false,
    permissions: createEmptyPermissions(),
  });

  // Matrix accordion collapse state by category
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ERP_MODULE_CATALOG.forEach((cat) => {
      init[cat.category] = true; // All open by default
    });
    return init;
  });

  // Action notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch registered users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    refreshRoles();

    const handleUsersUpdate = () => fetchUsers();
    const handleRolesUpdate = () => refreshRoles();

    window.addEventListener('erp_module_erp_users_list_updated', handleUsersUpdate);
    window.addEventListener('erp_module_erp_roles_matrix_updated', handleRolesUpdate);

    return () => {
      window.removeEventListener('erp_module_erp_users_list_updated', handleUsersUpdate);
      window.removeEventListener('erp_module_erp_roles_matrix_updated', handleRolesUpdate);
    };
  }, [refreshRoles]);

  // Count active users per role
  const userCountByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const rName = u.role || 'Viewer';
      counts[rName] = (counts[rName] || 0) + 1;
      // Also map normalized ADMIN to Super Admin
      if (u.role === 'ADMIN' || u.isSuperAdmin) {
        counts['Super Admin'] = (counts['Super Admin'] || 0) + 1;
        counts['super_admin'] = (counts['super_admin'] || 0) + 1;
      }
    });
    return counts;
  }, [users]);

  // -------------------------------------------------------------
  // Role Matrix Actions
  // -------------------------------------------------------------
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      id: '',
      name: '',
      description: '',
      isSystemRole: false,
      permissions: createEmptyPermissions(),
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: RoleDefinition) => {
    setEditingRole(role);
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: Boolean(role.isSystemRole || role.id === 'super_admin'),
      permissions: role.permissions || (role.isSystemRole ? createFullPermissions() : createEmptyPermissions()),
    });
    setIsRoleModalOpen(true);
  };

  const handleToggleCategoryAccordion = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handlePermissionChange = (
    moduleId: string,
    action: 'view' | 'create' | 'edit' | 'delete' | 'export',
    value: boolean
  ) => {
    if (roleForm.isSystemRole || roleForm.id === 'super_admin') {
      return; // Super admin permissions cannot be altered
    }

    setRoleForm((prev) => {
      const currentMod = prev.permissions[moduleId] || {
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      };

      const updatedMod = { ...currentMod, [action]: value };
      // If creating/editing/deleting/exporting, view should automatically be true
      if (value && action !== 'view') {
        updatedMod.view = true;
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleId]: updatedMod,
        },
      };
    });
  };

  const handleToggleCategoryAll = (categoryModules: Array<{ id: string; name: string }>, check: boolean) => {
    if (roleForm.isSystemRole || roleForm.id === 'super_admin') return;

    setRoleForm((prev) => {
      const nextPerms = { ...prev.permissions };
      categoryModules.forEach((m) => {
        nextPerms[m.id] = {
          view: check,
          create: check,
          edit: check,
          delete: check,
          export: check,
        };
      });
      return { ...prev, permissions: nextPerms };
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      alert('Please enter a role name.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: RoleDefinition = {
        id: roleForm.id || `role_${roleForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        isSystemRole: roleForm.isSystemRole,
        permissions: roleForm.isSystemRole ? createFullPermissions() : roleForm.permissions,
      };

      const res = await fetch('/api/auth/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsRoleModalOpen(false);
        refreshRoles();
        setNotification({
          type: 'success',
          text: `Role "${payload.name}" and access control matrix saved successfully!`,
        });
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to save role');
      }
    } catch (err: any) {
      alert(err.message || 'Network error saving role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete role "${roleName}"?`)) return;

    try {
      const res = await fetch(`/api/auth/roles?id=${roleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        refreshRoles();
        setNotification({ type: 'success', text: `Role "${roleName}" deleted successfully.` });
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to delete role');
      }
    } catch (err: any) {
      alert(err.message || 'Network error deleting role');
    }
  };

  // -------------------------------------------------------------
  // User Management Actions
  // -------------------------------------------------------------
  const togglePasswordReveal = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const copyPassword = (userId: string, pass?: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setShowModalPassword(true);
    setUserForm({
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'Inspector',
      department: 'Quality Inspection',
      avatarUrl: `https://images.unsplash.com/photo-${['1535713875002-d1d0cf377fde', '1494790108377-be9c29b29330', '1507003211169-0a1dd7228f2d', '1534528741775-53994a69daeb', '1580489944761-15a19d654956'][Math.floor(Math.random() * 5)]}?w=150&h=150&fit=crop&crop=face`,
      isActive: true,
    });
    setIsAddUserModalOpen(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setShowModalPassword(false);
    setUserForm({
      username: user.username || user.email.split('@')[0],
      name: user.name,
      email: user.email,
      password: user.password || '',
      role: user.role || 'Inspector',
      department: user.department || 'Operations',
      avatarUrl: user.avatarUrl || '',
      isActive: user.isActive !== false,
    });
    setIsAddUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const isSuper = userForm.role === 'Super Admin' || userForm.role === 'ADMIN' || (userForm.role as string) === 'super_admin';

      if (editingUser) {
        // Update user
        const payload: any = {
          id: editingUser.id,
          name: userForm.name.trim(),
          username: userForm.username.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          department: userForm.department.trim(),
          isActive: userForm.isActive,
          isSuperAdmin: isSuper,
          avatarUrl: userForm.avatarUrl.trim() || undefined,
        };
        if (userForm.password.trim()) {
          payload.password = userForm.password.trim();
        }

        const res = await fetch('/api/auth/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setIsAddUserModalOpen(false);
          fetchUsers();
          setNotification({ type: 'success', text: `User "${data.user.name}" updated successfully!` });
          setTimeout(() => setNotification(null), 4000);
        } else {
          alert(data.error || 'Failed to update user');
        }
      } else {
        // Create user
        const payload = {
          ...userForm,
          username: userForm.username.trim(),
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          department: userForm.department.trim(),
          isSuperAdmin: isSuper,
          avatarUrl: userForm.avatarUrl.trim() || undefined,
        };

        const res = await fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setIsAddUserModalOpen(false);
          fetchUsers();
          setNotification({
            type: 'success',
            text: `User "${data.user.name}" (@${data.user.username}) created successfully${isSuper ? ' as Super Administrator' : ''}!`,
          });
          setTimeout(() => setNotification(null), 4000);
        } else {
          alert(data.error || 'Failed to create user');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Network error saving user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (user.id === 'usr_admin') {
      alert('The primary root Super Admin account cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user account "${user.name}" (@${user.username})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/users?id=${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchUsers();
        setNotification({ type: 'success', text: `User "${user.name}" deleted successfully.` });
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      alert(err.message || 'Network error deleting user');
    }
  };

  const handleQuickSwitchUser = async (user: AppUser) => {
    await switchUser(user.id);
    setNotification({
      type: 'success',
      text: `Switched active session to ${user.name} (${user.role}). Testing live module permissions!`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        (u.role && u.role.toLowerCase().includes(q))
    );
  }, [users, userSearchQuery]);

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold border shadow-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header matching Images 1 & 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Users &amp; Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage user access, assign roles, and configure module permissions.
          </p>
        </div>

        {/* Segmented Control Toggle: [Users] vs [Roles & Permissions] */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
          <button
            type="button"
            id="tab-users-toggle-btn"
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users
          </button>

          <button
            type="button"
            id="tab-roles-toggle-btn"
            onClick={() => setActiveSubTab('roles')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'roles'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Roles &amp; Permissions
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: ROLES & PERMISSIONS TAB (Exact Match to Image 1)                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Subheader & Create Role Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Roles define what users can see and do within the application. Assign roles to users to grant them specific
              permissions.
            </p>

            <button
              type="button"
              id="create-role-btn"
              onClick={handleOpenCreateRole}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Create Role
            </button>
          </div>

          {/* Role Cards Grid matching Image 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((role) => {
              const assignedCount =
                userCountByRole[role.name] ||
                (role.id === 'super_admin' ? userCountByRole['Super Admin'] || 1 : 0);

              const isSuper = role.id === 'super_admin' || role.isSystemRole;

              return (
                <div
                  key={role.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Shield Icon + Title + Edit Icon */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                          <Shield className="w-5 h-5 stroke-[2]" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{role.name}</h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditRole(role)}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={`Edit ${role.name} Permissions`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Role Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed min-h-[38px]">
                      {role.description || 'Custom role with defined module permissions.'}
                    </p>
                  </div>

                  {/* Bottom Row: User Count + View Permissions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {assignedCount} {assignedCount === 1 ? 'User' : 'Users'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenEditRole(role)}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline transition-colors cursor-pointer"
                    >
                      View Permissions
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: USERS TAB (Exact Match to Image 3)                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          {/* Search bar + Add User button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                id="search-users-input"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="button"
              id="add-user-btn"
              onClick={handleOpenAddUser}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>

          {/* Users Table matching Image 3 with Profile Photo & Password Visibility */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loadingUsers ? 'Loading users...' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const initial = (u.name || u.username || 'U').charAt(0).toUpperCase();
                    const isCurrentUser = currentUser?.id === u.id;
                    const isSuperAdminAccount = u.id === 'usr_admin' || u.isSuperAdmin || u.role === 'Super Admin' || u.role === 'ADMIN';

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* User: Avatar Photo + Name + @username • email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <span className="absolute inset-0 flex items-center justify-center -z-10 select-none">
                                {initial}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                <span>{u.name}</span>
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                                    You
                                  </span>
                                )}
                                {isSuperAdminAccount && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    Super Admin
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                @{u.username || 'user'} • {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role: Pill with Shield outline + Role Name */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium text-xs ${
                            isSuperAdminAccount
                              ? 'border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                          }`}>
                            <Shield className={`w-3.5 h-3.5 ${isSuperAdminAccount ? 'text-indigo-500' : 'text-slate-400'}`} />
                            {u.role || 'Viewer'}
                          </span>
                        </td>

                        {/* Password: Super Admin Viewable with Toggle Eye & Copy */}
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 px-2.5 py-1 rounded-lg">
                            <span className="font-mono text-xs tracking-wider text-slate-800 dark:text-slate-200 select-all min-w-[70px]">
                              {revealedPasswords[u.id] ? (u.password || '••••••••') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordReveal(u.id)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                              title={revealedPasswords[u.id] ? "Hide password" : "Show password"}
                            >
                              {revealedPasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyPassword(u.id, u.password)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer relative"
                              title="Copy password to clipboard"
                            >
                              {copiedUserId === u.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status: Pill with green dot + Active */}
                        <td className="py-3.5 px-4">
                          {u.isActive !== false ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-medium text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Last Active */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                          {u.lastLoginAt ? 'Just now' : 'Just now'}
                        </td>

                        {/* Actions: Edit + Delete + Switch User */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {/* Switch to this user for live RBAC testing */}
                            {!isCurrentUser && (
                              <button
                                type="button"
                                onClick={() => handleQuickSwitchUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                title={`Switch to ${u.name} session to test ${u.role} access`}
                              >
                                <LogIn className="w-4 h-4" />
                              </button>
                            )}

                            {/* Edit user */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              title="Edit user details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete user */}
                            {u.id !== 'usr_admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ROLE DETAILS & ACCESS CONTROL MATRIX (Exact Match to Image 2)       */}
      {/* ========================================================================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                  ROLE DETAILS
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure role metadata and module-level permission capabilities.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Form Inputs: Role Name & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    disabled={roleForm.isSystemRole || roleForm.id === 'super_admin'}
                    placeholder="e.g. QC Supervisor"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Short description of role responsibilities..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Notice Banner (Image 2) */}
              {(roleForm.isSystemRole || roleForm.id === 'super_admin') && (
                <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3 text-indigo-900 dark:text-indigo-200 text-xs">
                  <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    The Super Admin role is a system role. Its name and core permissions cannot be restricted. Super
                    Admins can do anything without restrictions.
                  </div>
                </div>
              )}

              {/* ACCESS CONTROL MATRIX Section Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                    ACCESS CONTROL MATRIX
                  </h3>
                  {!roleForm.isSystemRole && roleForm.id !== 'super_admin' && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Click category to expand/collapse</span>
                    </div>
                  )}
                </div>

                {/* Permissions Matrix Table matching Image 2 */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <th className="py-3 px-4 w-1/3">Module</th>
                        <th className="py-3 px-3 text-center">View</th>
                        <th className="py-3 px-3 text-center">Create</th>
                        <th className="py-3 px-3 text-center">Edit</th>
                        <th className="py-3 px-3 text-center">Manage / Delete</th>
                        <th className="py-3 px-3 text-center">Export</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                      {ERP_MODULE_CATALOG.map((group) => {
                        const isExpanded = expandedCategories[group.category] !== false;
                        const isSuperAdminRole = roleForm.isSystemRole || roleForm.id === 'super_admin';

                        return (
                          <React.Fragment key={group.category}>
                            {/* Category Accordion Header Row */}
                            <tr
                              onClick={() => handleToggleCategoryAccordion(group.category)}
                              className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 cursor-pointer select-none transition-colors border-t border-slate-200 dark:border-slate-800"
                            >
                              <td colSpan={6} className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-slate-400" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span>{group.category}</span>
                                    <span className="text-[10px] font-normal text-slate-400">
                                      ({group.modules.length} {group.modules.length === 1 ? 'module' : 'modules'})
                                    </span>
                                  </div>

                                  {!isSuperAdminRole && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCategoryAll(group.modules, true)}
                                        className="hover:underline cursor-pointer"
                                      >
                                        Select All
                                      </button>
                                      <span>•</span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCategoryAll(group.modules, false)}
                                        className="hover:underline text-slate-400 hover:text-slate-600 cursor-pointer"
                                      >
                                        Clear All
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Category Module Rows */}
                            {isExpanded &&
                              group.modules.map((mod) => {
                                const IconComponent = MODULE_ICON_MAP[mod.id] || CheckSquare;
                                const perm = roleForm.permissions[mod.id] || {
                                  view: false,
                                  create: false,
                                  edit: false,
                                  delete: false,
                                  export: false,
                                };

                                return (
                                  <tr
                                    key={mod.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                  >
                                    {/* Module Name + Icon */}
                                    <td className="py-2.5 px-4 pl-8">
                                      <div className="flex items-center gap-2.5">
                                        <IconComponent className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                          {mod.name}
                                        </span>
                                      </div>
                                    </td>

                                    {/* View Checkbox */}
                                    <td className="py-2.5 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSuperAdminRole || Boolean(perm.view)}
                                        disabled={isSuperAdminRole}
                                        onChange={(e) => handlePermissionChange(mod.id, 'view', e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                      />
                                    </td>

                                    {/* Create Checkbox */}
                                    <td className="py-2.5 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSuperAdminRole || Boolean(perm.create)}
                                        disabled={isSuperAdminRole}
                                        onChange={(e) => handlePermissionChange(mod.id, 'create', e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                      />
                                    </td>

                                    {/* Edit Checkbox */}
                                    <td className="py-2.5 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSuperAdminRole || Boolean(perm.edit)}
                                        disabled={isSuperAdminRole}
                                        onChange={(e) => handlePermissionChange(mod.id, 'edit', e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                      />
                                    </td>

                                    {/* Manage / Delete Checkbox */}
                                    <td className="py-2.5 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSuperAdminRole || Boolean(perm.delete)}
                                        disabled={isSuperAdminRole}
                                        onChange={(e) => handlePermissionChange(mod.id, 'delete', e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                      />
                                    </td>

                                    {/* Export Checkbox */}
                                    <td className="py-2.5 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSuperAdminRole || Boolean(perm.export)}
                                        disabled={isSuperAdminRole}
                                        onChange={(e) => handlePermissionChange(mod.id, 'export', e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer matching Image 2 */}
            <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveRole}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Roles & Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT USER                                                     */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                {editingUser ? `Edit User & Credentials: ${editingUser.name}` : 'Add New User'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* Profile Photo / Avatar URL with Live Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-lg shrink-0 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
                  {userForm.avatarUrl ? (
                    <img
                      src={userForm.avatarUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span className="absolute inset-0 flex items-center justify-center -z-10 select-none">
                    {(userForm.name || userForm.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Profile Photo URL
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomAvatars = [
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
                        ];
                        const pick = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
                        setUserForm({ ...userForm, avatarUrl: pick });
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Random Photo
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={userForm.avatarUrl}
                    onChange={(e) => setUserForm({ ...userForm, avatarUrl: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. javed_qc"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {editingUser ? 'Password' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModalPassword((prev) => !prev)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                    >
                      {showModalPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showModalPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      placeholder={editingUser ? 'Password' : 'Set password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-3 py-2 pr-9 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword((prev) => !prev)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Display Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Javed Hossain"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="user@garmentserp.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    disabled={editingUser?.id === 'usr_admin'}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    {/* Ensure Super Admin is always selectable by Super Admin */}
                    {!roles.some((r) => r.name === 'Super Admin' || r.id === 'super_admin') && (
                      <option value="Super Admin">Super Admin</option>
                    )}
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name === 'Super Admin' || r.id === 'super_admin' ? '👑 Super Admin' : r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cutting / Quality"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Super Admin Special Callout */}
              {(userForm.role === 'Super Admin' || userForm.role === 'ADMIN') && (
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs animate-in fade-in">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">
                    <span className="font-bold">Super Administrator Account:</span> This user will have unrestricted permissions across all modules, security matrix policies, user management, and system settings.
                  </div>
                </div>
              )}

              {editingUser && editingUser.id !== 'usr_admin' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="user-active-toggle"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                  />
                  <label htmlFor="user-active-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Account Active (uncheck to suspend login)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingUser ? 'Update User & Password' : 'Save & Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
