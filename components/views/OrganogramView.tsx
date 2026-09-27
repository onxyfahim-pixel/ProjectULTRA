'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  ChevronDown,
  Network,
  Mail,
  Award,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Download,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  CornerDownRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { OrganogramNode, OrganogramStatus } from '@/lib/types/modules';
import { INITIAL_ORGANOGRAM_NODES } from '../modules/organogram/organogram-data';
import { OrganogramDetailsPage } from '../modules/organogram/OrganogramDetailsPage';
import { OrganogramEntryPage } from '../modules/organogram/OrganogramEntryPage';
import { DeleteOrganogramModal } from '../modules/organogram/DeleteOrganogramModal';

type OrganogramSubView =
  | { type: 'none' }
  | { type: 'details'; node: OrganogramNode }
  | { type: 'add' }
  | { type: 'edit'; node: OrganogramNode };

export function OrganogramView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  // Load nodes from localStorage or fallback to INITIAL_ORGANOGRAM_NODES
  const [nodes, setNodes] = useState<OrganogramNode[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('erp_organogram_nodes_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to parse stored organogram nodes:', err);
      }
    }
    return INITIAL_ORGANOGRAM_NODES;
  });

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('erp_organogram_nodes_v1', JSON.stringify(nodes));
      } catch (err) {
        console.warn('Failed saving organogram nodes to localStorage:', err);
      }
    }
  }, [nodes]);

  // Subview State (Details, Add, Edit)
  const [subView, setSubView] = useState<OrganogramSubView>({ type: 'none' });

  // Sync subview node if data updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = nodes.find((n) => n.id === subView.node.id);
      if (refreshed && refreshed !== subView.node) {
        setSubView({ type: 'details', node: refreshed });
      }
    }
  }, [nodes, subView]);

  // Modal State for Deletions
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    nodes: OrganogramNode[];
  } | null>(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct lists for filters
  const departments = Array.from(new Set(nodes.map((n) => n.department))).sort();
  const grades = Array.from(new Set(nodes.map((n) => n.grade))).sort();

  // Filtered nodes
  const filteredNodes = nodes.filter((n) => {
    const matchesDept = departmentFilter === 'ALL' || n.department === departmentFilter;
    const matchesGrade = gradeFilter === 'ALL' || n.grade === gradeFilter;
    const matchesStatus = statusFilter === 'ALL' || (n.status || 'ACTIVE') === statusFilter;
    return matchesDept && matchesGrade && matchesStatus;
  });

  // Hierarchy tier calculations
  const totalHeadcount = nodes.reduce((sum, n) => sum + (n.headcount || 0), 0);
  const topNode = nodes.find((n) => !n.reportsToId) || nodes[0];
  const secondTier = nodes.filter((n) => n.reportsToId === topNode?.id);
  const thirdTier = nodes.filter((n) => secondTier.some((st) => st.id === n.reportsToId));
  const fourthTier = nodes.filter((n) => thirdTier.some((tt) => tt.id === n.reportsToId));

  // CRUD Handlers
  const handleCreateNode = (newNode: OrganogramNode) => {
    const updated = [newNode, ...nodes];
    setNodes(updated);
    setSubView({ type: 'details', node: newNode });
    showToast(`Successfully added role: ${newNode.title}`);
  };

  const handleUpdateNode = (updatedNode: OrganogramNode) => {
    const updated = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    setNodes(updated);
    if (subView.type === 'edit' || subView.type === 'details') {
      setSubView({ type: 'details', node: updatedNode });
    }
    showToast(`Saved updates for ${updatedNode.name}`);
  };

  const handleDuplicateNode = (node: OrganogramNode) => {
    const duplicated: OrganogramNode = {
      ...JSON.parse(JSON.stringify(node)),
      id: `org-${Date.now()}`,
      name: `${node.name} (Duplicate)`,
      title: `${node.title} (Copy)`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...nodes];
    setNodes(updated);
    setSubView({ type: 'details', node: duplicated });
    showToast(`Duplicated role: ${duplicated.title}`);
  };

  const confirmDeleteNodes = () => {
    if (!deleteModal) return;
    const idsToDelete = new Set(deleteModal.nodes.map((n) => n.id));
    const updated = nodes.filter((n) => !idsToDelete.has(n.id));
    setNodes(updated);

    if (subView.type === 'details' && idsToDelete.has(subView.node.id)) {
      setSubView({ type: 'none' });
    }
    showToast(`Deleted ${deleteModal.nodes.length} organization role record(s)`);
    setDeleteModal(null);
  };

  // Helper avatar initials
  const getInitials = (name: string) => {
    return name
      .replace(/^(Engr\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, '')
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // 6 Compact Table Columns (Table fit, NO horizontal scroll)
  const columns: ColumnDef<OrganogramNode>[] = [
    {
      key: 'grade',
      header: 'Level & Status',
      sortable: true,
      render: (item) => {
        const isVacant = item.status === 'VACANT';
        const isLeave = item.status === 'ON_LEAVE';
        return (
          <div className="space-y-1">
            <span className="inline-block font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {item.grade}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isVacant ? 'bg-amber-500' : isLeave ? 'bg-slate-400' : 'bg-emerald-500'
                }`}
              />
              <span
                className={`text-[10px] font-semibold uppercase font-mono ${
                  isVacant ? 'text-amber-700' : isLeave ? 'text-slate-500' : 'text-emerald-700'
                }`}
              >
                {item.status || 'ACTIVE'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'name',
      header: 'Leader Name & Title',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-mono font-bold text-xs text-blue-700 shrink-0">
            {getInitials(item.name)}
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setSubView({ type: 'details', node: item })}
              className="font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors text-left block truncate cursor-pointer"
              title={item.name}
            >
              {item.name}
            </button>
            <div className="text-[11px] font-medium text-slate-600 truncate" title={item.title}>
              {item.title}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{item.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department / Unit',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold inline-block">
            {item.department}
          </span>
          {item.officeLocation && (
            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span>{item.officeLocation}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'reportsToId',
      header: 'Reporting Superior',
      render: (item) => {
        const superior = nodes.find((n) => n.id === item.reportsToId);
        if (!superior) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              <Shield className="w-3 h-3 text-indigo-600" />
              <span>Executive Board</span>
            </span>
          );
        }
        return (
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setSubView({ type: 'details', node: superior })}
              className="text-xs font-semibold text-slate-800 hover:text-blue-600 transition-colors block truncate text-left cursor-pointer"
            >
              {superior.name}
            </button>
            <div className="text-[10px] text-slate-500 font-mono">{superior.grade}</div>
          </div>
        );
      },
    },
    {
      key: 'headcount',
      header: 'Direct Team',
      sortable: true,
      align: 'right',
      render: (item) => {
        const directSubCount = nodes.filter((n) => n.reportsToId === item.id).length;
        return (
          <div className="text-right">
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {item.headcount} Staff
            </span>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {directSubCount} Direct {directSubCount === 1 ? 'Lead' : 'Leads'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {/* Details Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', node: item })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Separate Role Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', node: item })}
            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
            title="Edit Role Profile"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateNode(item)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate Role Template"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, nodes: [item] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Role"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: 3-tab layout (Summary, Leadership Register, Interactive Hierarchy Tree) */}
      <ModuleHeader
        id="organogram-module"
        moduleCode="MOD-24"
        badge="Governance & Org Chart"
        title="Quality Assurance & Operations Organizational Chart (Organogram)"
        subtitle="Hierarchical reporting structure from VP Operations down to specialized quality leads and laboratory technologists"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Leadership Register', count: nodes.length },
          { id: 'tree', label: 'Interactive Org Chart Tree' },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <OrganogramDetailsPage
          node={subView.node}
          allNodes={nodes}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(n) => setSubView({ type: 'edit', node: n })}
          onDelete={(n) => setDeleteModal({ isOpen: true, nodes: [n] })}
          onNavigateToNode={(n) => setSubView({ type: 'details', node: n })}
          onUpdateStatus={handleUpdateNode}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <OrganogramEntryPage
          allNodes={nodes}
          onSave={handleCreateNode}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <OrganogramEntryPage
          initialNode={subView.node}
          allNodes={nodes}
          onSave={handleUpdateNode}
          onCancel={() => setSubView({ type: 'details', node: subView.node })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 4 StatCards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Leadership Roster"
                  value={nodes.length}
                  subtitle="Active Governance Positions"
                  icon={Users}
                  tone="blue"
                  delta={{ value: '+2 Positions', isPositive: true }}
                />
                <StatCard
                  title="Total QA & Operations"
                  value={`${totalHeadcount} Staff`}
                  subtitle="Operational Factory Headcount"
                  icon={UserCheck}
                  tone="emerald"
                />
                <StatCard
                  title="Hierarchical Depth"
                  value="L8 to L4"
                  subtitle="5 Executive Management Tiers"
                  icon={Shield}
                  tone="indigo"
                />
                <StatCard
                  title="Quality Line Autonomy"
                  value="ISO 9001:2015"
                  subtitle="Direct Board Reporting Access"
                  icon={Award}
                  tone="amber"
                />
              </div>

              {/* Clean Light-Themed Highlight Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>ISO 9001 Clause 5.3 Organizational Roles &amp; Authorities</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Garments Manufacturing Quality Governance Matrix
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Clear reporting hierarchy ensuring uncompromised quality assurance independence.
                    Autonomous authority to halt non-conforming lines, enforce buyer AQL standards, and approve laboratory batch releases.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {topNode && (
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'details', node: topNode })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>View Top Executive</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Organization Role</span>
                  </button>
                </div>
              </div>

              {/* Summary Interactive Hierarchy Cards */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      High-Level Reporting Structure
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any leader card to view their complete role profile, subordinates, authority boundaries, and certifications.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 self-start sm:self-auto">
                    {nodes.length} Positions • 100% Filled
                  </span>
                </div>

                {/* Tier 1: Executive Top Node */}
                {topNode && (
                  <div className="flex justify-center">
                    <div
                      onClick={() => setSubView({ type: 'details', node: topNode })}
                      className="bg-white border-2 border-blue-500 hover:border-blue-600 hover:shadow-md transition-all p-4 rounded-2xl text-center max-w-sm w-full cursor-pointer group"
                    >
                      <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider block">
                        {topNode.grade} • {topNode.department}
                      </span>
                      <h4 className="text-sm font-bold mt-1 text-slate-900 group-hover:text-blue-600 transition-colors">
                        {topNode.name}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">{topNode.title}</p>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                        <span>{topNode.officeLocation}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          {topNode.headcount} Org Headcount
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-0.5 h-5 bg-slate-300 mx-auto" />

                {/* Tier 2: Division Heads / Directors */}
                <div>
                  <div className="text-center mb-3">
                    <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase tracking-wider">
                      Tier 2: Division Directors &amp; AGMs
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {secondTier.map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSubView({ type: 'details', node })}
                        className="bg-white border border-blue-200 hover:border-blue-500 hover:shadow-md transition-all p-4 rounded-xl text-left cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-blue-700 font-bold uppercase">
                            {node.grade}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                            {node.headcount} Staff
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {node.name}
                        </h5>
                        <p className="text-[11px] text-slate-600 mt-0.5">{node.title}</p>
                        <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                          <span>{node.department}</span>
                          <span className="text-blue-600 font-semibold group-hover:underline">View Profile &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-0.5 h-5 bg-slate-300 mx-auto" />

                {/* Tier 3: Quality Managers & Department Leads */}
                <div>
                  <div className="text-center mb-3">
                    <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase tracking-wider">
                      Tier 3: Section Leads &amp; Operations Managers
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {thirdTier.map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSubView({ type: 'details', node })}
                        className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all p-3 rounded-xl text-left cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-slate-500 font-medium">
                            {node.grade}
                          </span>
                          <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                            {node.headcount} Staff
                          </span>
                        </div>
                        <h6 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {node.name}
                        </h6>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">{node.title}</p>
                        <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400 truncate">
                          {node.department}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <SwitchToListBanner
                label="Open Full Organizational Master Roster & Reporting Matrix"
                recordCount={nodes.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: LEADERSHIP REGISTER (Compact Table, No Horizontal Scroll) */}
          {viewMode === 'list' && (
            <div className="animate-in fade-in duration-200">
              <DataTable
                id="organogram-table"
                title="Quality Assurance & Operations Organogram Register"
                subtitle="Complete tabular list of designated leaders, grades, reporting lines, and headcount allocations"
                data={filteredNodes}
                columns={columns}
                searchPlaceholder="Search leader name, title, department, grade, or email..."
                searchableKeys={['name', 'title', 'department', 'grade', 'email', 'officeLocation']}
                secondaryAction={
                  <div className="flex items-center gap-2">
                    {/* Department filter */}
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    {/* Grade filter */}
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Levels</option>
                      {grades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>

                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ON_LEAVE">On Leave</option>
                      <option value="VACANT">Vacant</option>
                    </select>
                  </div>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Organization Role</span>
                  </button>
                }
                batchActions={[
                  {
                    label: 'Delete Selected',
                    variant: 'danger',
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      setDeleteModal({
                        isOpen: true,
                        nodes: selected,
                      });
                    },
                  },
                  {
                    label: 'Export Roster',
                    icon: <Download className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      showToast(`Exported ${selected.length} organogram role records`);
                    },
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 3: INTERACTIVE ORG CHART TREE */}
          {viewMode === 'tree' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Comprehensive Organization Tree &amp; Departmental Cascades
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hierarchical drill-down of all QA divisions, reporting chains, and team sizes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="ALL">Filter: All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Role</span>
                  </button>
                </div>
              </div>

              {/* Tree Hierarchy Canvas */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
                {/* Level 1: Root Node */}
                <div className="flex justify-center">
                  <div
                    onClick={() => setSubView({ type: 'details', node: topNode })}
                    className="p-5 rounded-2xl border-2 border-blue-500 bg-white hover:shadow-lg transition-all text-center max-w-md w-full cursor-pointer group"
                  >
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 mb-2">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      <span>{topNode.grade} • Executive Leadership</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {topNode.name}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">{topNode.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{topNode.department}</p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                      <span>{topNode.email}</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {topNode.headcount} Staff
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-slate-300 mx-auto" />

                {/* Level 2: Directors & AGM Nodes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {secondTier
                    .filter((n) => departmentFilter === 'ALL' || n.department === departmentFilter)
                    .map((secondNode) => {
                      const directSubs = nodes.filter((n) => n.reportsToId === secondNode.id);
                      return (
                        <div
                          key={secondNode.id}
                          className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-3"
                        >
                          <div
                            onClick={() => setSubView({ type: 'details', node: secondNode })}
                            className="bg-white p-4 rounded-xl border border-blue-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-mono text-blue-700 font-bold">
                                {secondNode.grade}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                                {secondNode.headcount} Total Staff
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {secondNode.name}
                            </h5>
                            <p className="text-[11px] text-slate-600 mt-0.5">{secondNode.title}</p>
                            <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                              <span>{secondNode.department}</span>
                              <span className="text-blue-600 font-semibold group-hover:underline">
                                Inspect &rarr;
                              </span>
                            </div>
                          </div>

                          {/* Direct Subordinates under this Director */}
                          {directSubs.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider px-1">
                                Direct Reports ({directSubs.length})
                              </div>
                              <div className="space-y-2">
                                {directSubs.map((sub) => {
                                  const subOfSubCount = nodes.filter((n) => n.reportsToId === sub.id).length;
                                  return (
                                    <div
                                      key={sub.id}
                                      onClick={() => setSubView({ type: 'details', node: sub })}
                                      className="bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex items-center justify-between gap-3"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">
                                            {sub.grade}
                                          </span>
                                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                            {sub.name}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-600 truncate mt-0.5">
                                          {sub.title}
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          {sub.headcount} Staff
                                        </span>
                                        {subOfSubCount > 0 && (
                                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                            {subOfSubCount} Sub-leads
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <DeleteOrganogramModal
          isOpen={deleteModal.isOpen}
          nodes={deleteModal.nodes}
          onConfirm={confirmDeleteNodes}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
