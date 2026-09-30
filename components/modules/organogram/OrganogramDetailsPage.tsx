'use client';

import React from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Users,
  UserCheck,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  ChevronRight,
  ShieldCheck,
  Building2,
  Check,
  Briefcase,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { OrganogramNode } from '@/lib/types/modules';

interface OrganogramDetailsPageProps {
  node: OrganogramNode;
  allNodes: OrganogramNode[];
  onBack: () => void;
  onEdit: (node: OrganogramNode) => void;
  onDelete: (node: OrganogramNode) => void;
  onNavigateToNode?: (node: OrganogramNode) => void;
  onUpdateStatus?: (updated: OrganogramNode) => void;
  showToast: (msg: string) => void;
}

export function OrganogramDetailsPage({
  node,
  allNodes,
  onBack,
  onEdit,
  onDelete,
  onNavigateToNode,
  onUpdateStatus,
  showToast,
}: OrganogramDetailsPageProps) {
  // Find reporting superior
  const superior = allNodes.find((n) => n.id === node.reportsToId);

  // Find direct subordinates
  const subordinates = allNodes.filter((n) => n.reportsToId === node.id);

  const handleStatusChange = (newStatus: OrganogramNode['status']) => {
    const updated: OrganogramNode = {
      ...node,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateStatus?.(updated);
    showToast(`Status updated to ${newStatus}`);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 xl:p-8 animate-in fade-in duration-150">
      <div className="w-full max-w-[1920px] mx-auto space-y-6 pb-20">
        {/* TOP NAVIGATION & ACTION BAR (EXACT STYLE OF BUYER & ORDER MODULE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Organogram Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {node.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                {node.grade}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${
                  node.status === 'ACTIVE' || !node.status
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : node.status === 'ON_LEAVE'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {node.status || 'ACTIVE'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Building2 className="w-3 h-3 text-indigo-600" />
                <span>{node.department}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {node.title} • Direct Team Headcount: {node.headcount} Staff
            </p>
          </div>
        </div>

        {/* Action Buttons styled like Buyer Order */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick status selector */}
          <select
            value={node.status || 'ACTIVE'}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ACTIVE">Status: Active</option>
            <option value="ON_LEAVE">Status: On Leave</option>
            <option value="VACANT">Status: Vacant</option>
          </select>


          <button
            type="button"
            onClick={() => onEdit(node)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Edit Leadership Node"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Role</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(node)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
            title="Delete Leadership Node"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* LEADER OVERVIEW CARD (CLEAN LIGHT THEME - NO DARK CARD) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-xs shrink-0">
              {node.name.replace(/^(Engr\.|Dr\.|Mr\.|Ms\.)\s*/, '').charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{node.name}</h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {node.grade}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700">{node.title}</p>
              <div className="flex items-center flex-wrap gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{node.department}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${node.email}`} className="text-blue-600 hover:underline">
                    {node.email}
                  </a>
                </span>
                {node.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{node.phone}</span>
                  </span>
                )}
                {node.officeLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{node.officeLocation}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Team Responsibility</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{node.headcount}</div>
            <span className="text-xs text-emerald-700 font-semibold">Direct &amp; Operational Staff</span>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Reporting Line</span>
            <div className="text-xs font-bold text-slate-800 mt-1 truncate">
              {superior ? superior.name : 'Executive Board / CEO'}
            </div>
            <span className="text-[10px] text-slate-500">{superior ? superior.title : 'Supreme Governance'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Subordinates</span>
            <div className="text-lg font-bold text-blue-700 mt-0.5 font-mono">
              {subordinates.length} Key Roles
            </div>
            <span className="text-[10px] text-slate-500">Under direct reporting hierarchy</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Audit Competency</span>
            <div className="text-sm font-bold text-purple-700 mt-0.5 truncate">
              {node.certifications?.[0] || 'ISO 9001 Certified'}
            </div>
            <span className="text-[10px] text-slate-500">{node.certifications?.length || 1} Professional Credentials</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Governance Level</span>
            <div className="text-sm font-bold text-emerald-700 mt-0.5">Autonomous Authority</div>
            <span className="text-[10px] text-slate-500 font-mono">ISO 9001 Clause 5.3</span>
          </div>
        </div>
      </div>

      {/* REPORTING HIERARCHY CHAIN (SUPERIOR -> CURRENT -> SUBORDINATES) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Reporting Chain &amp; Hierarchy Placement
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Tier Relationship</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-2">
          {/* Superior Card */}
          <div className="w-full md:w-72 p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
              Reports Directly To
            </span>
            {superior ? (
              <div
                onClick={() => onNavigateToNode?.(superior)}
                className="cursor-pointer hover:text-blue-600 transition-colors"
              >
                <div className="text-xs font-bold text-slate-900">{superior.name}</div>
                <div className="text-[11px] text-slate-600">{superior.title}</div>
                <span className="inline-block mt-1 font-mono text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.2 rounded">
                  {superior.grade}
                </span>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-700 py-1">
                Executive Board of Directors / CEO
              </div>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 shrink-0" />

          {/* Current Node (Highlighted) */}
          <div className="w-full md:w-80 p-4 rounded-xl border-2 border-blue-600 bg-blue-50/40 text-center space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider block font-mono">
              Current Position
            </span>
            <div className="text-sm font-bold text-slate-900">{node.name}</div>
            <div className="text-xs font-semibold text-slate-700">{node.title}</div>
            <div className="text-[11px] text-slate-500">{node.department}</div>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 shrink-0" />

          {/* Subordinates Summary Card */}
          <div className="w-full md:w-72 p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
              Direct Subordinates
            </span>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {subordinates.length} Leads
            </div>
            <span className="text-[11px] text-slate-500">
              Total Division: <strong>{node.headcount} Staff</strong>
            </span>
          </div>
        </div>
      </div>

      {/* AUTHORITIES & CORE RESPONSIBILITIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Decision Authority & Escalation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Decision Authority &amp; Escalation Scope
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              Authorized
            </span>
          </div>
          <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs text-slate-800 leading-relaxed font-sans">
            {node.decisionAuthority ||
              'Authorized to oversee operational quality, sign off validation gates, and initiate corrective actions under corporate QMS.'}
          </div>

          {/* Professional Certifications */}
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
              Verified Certifications &amp; Credentials
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(node.certifications || ['ISO 9001:2015 Lead Auditor', 'Lean Practitioner']).map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200"
                >
                  <Award className="w-3 h-3 text-purple-600" />
                  <span>{c}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Key Responsibilities */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Operational Responsibilities
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">RACI Role</span>
          </div>

          <ul className="space-y-2 text-xs text-slate-700">
            {(node.responsibilities || [
              'Maintain daily operational compliance with quality policies and buyer specifications',
              'Direct routine monitoring and audit of production lines',
              'Collaborate with Industrial Engineering on motion study and productivity standards',
            ]).map((r, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* DIRECT SUBORDINATES TABLE */}
      {subordinates.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Direct Reports &amp; Subordinate Leadership ({subordinates.length} Roles)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Tier Below</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Level</th>
                  <th className="py-2.5 px-4">Subordinate Name &amp; Email</th>
                  <th className="py-2.5 px-4">Designation</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4 text-right">Team</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subordinates.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700">
                      {sub.grade}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{sub.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{sub.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {sub.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {sub.department}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {sub.headcount} Staff
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigateToNode?.(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
