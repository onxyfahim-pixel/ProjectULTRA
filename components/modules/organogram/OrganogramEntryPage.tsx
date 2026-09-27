'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  Award,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Layers,
} from 'lucide-react';
import { OrganogramNode, OrganogramStatus } from '@/lib/types/modules';

interface OrganogramEntryPageProps {
  initialNode?: OrganogramNode | null;
  allNodes: OrganogramNode[];
  onSave: (node: OrganogramNode) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export function OrganogramEntryPage({
  initialNode,
  allNodes,
  onSave,
  onCancel,
  showToast,
}: OrganogramEntryPageProps) {
  const isEditing = Boolean(initialNode);

  const [activeTab, setActiveTab] = useState<'profile' | 'hierarchy_authority' | 'preview'>('profile');

  // Form State
  const [formData, setFormData] = useState<OrganogramNode>(() => {
    if (initialNode) {
      return JSON.parse(JSON.stringify(initialNode));
    }
    return {
      id: `org-${Date.now()}`,
      name: '',
      title: '',
      department: 'Quality Assurance',
      grade: 'L5 Manager',
      reportsToId: allNodes.find((n) => n.grade.includes('L7') || n.grade.includes('L8'))?.id || '',
      email: '',
      phone: '+880 1711 000000',
      officeLocation: 'Main Plant, Floor 2',
      headcount: 10,
      status: 'ACTIVE',
      responsibilities: [
        'Maintain daily operational compliance with quality policies and buyer specifications',
        'Direct routine monitoring and audit of production lines',
      ],
      certifications: ['ISO 9001:2015 Lead Auditor', 'Lean Manufacturing Practitioner'],
      decisionAuthority:
        'Authorized to oversee operational quality, sign off validation gates, and initiate corrective actions under corporate QMS.',
      joinedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [newResp, setNewResp] = useState('');
  const [newCert, setNewCert] = useState('');

  // Add / Remove Responsibility
  const handleAddResp = () => {
    if (!newResp.trim()) return;
    setFormData((prev) => ({
      ...prev,
      responsibilities: [...(prev.responsibilities || []), newResp.trim()],
    }));
    setNewResp('');
  };

  const handleRemoveResp = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: (prev.responsibilities || []).filter((_, i) => i !== idx),
    }));
  };

  // Add / Remove Certification
  const handleAddCert = () => {
    if (!newCert.trim()) return;
    setFormData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCert.trim()],
    }));
    setNewCert('');
  };

  const handleRemoveCert = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== idx),
    }));
  };

  // Save Validation
  const handleSave = (statusToSet?: OrganogramStatus) => {
    if (!formData.name.trim()) {
      showToast('Please provide a Leader / Employee Name');
      setActiveTab('profile');
      return;
    }
    if (!formData.title.trim()) {
      showToast('Please provide a Designation / Title');
      setActiveTab('profile');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Please enter an official corporate email address');
      setActiveTab('profile');
      return;
    }

    const nodeToSave: OrganogramNode = {
      ...formData,
      status: statusToSet || formData.status || 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };

    onSave(nodeToSave);
  };

  // Superior Node for display
  const superior = allNodes.find((n) => n.id === formData.reportsToId);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* TOP HEADER & ACTION BAR (EXACT STYLE OF BUYER & ORDER ADD PAGE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Cancel & Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? `Edit Role: ${formData.name}` : 'Add Leadership & Organization Role'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                {formData.grade}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Corporate Governance &amp; Factory Reporting Hierarchy Setup
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSave('ACTIVE')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save Role Changes' : 'Save & Publish Role'}</span>
          </button>
        </div>
      </div>

      {/* FORM TABS */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>1. Leader &amp; Position Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hierarchy_authority')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'hierarchy_authority'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>2. Hierarchy Placement &amp; Authorities</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3. Live Card Preview</span>
        </button>
      </div>

      {/* TAB 1: PROFILE & POSITION */}
      {activeTab === 'profile' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Leadership Identity &amp; Contact Information
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Position Profile</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Full Name */}
              <div className="space-y-1 md:col-span-2">
                <label className="font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Engr. Tanzim Ahmed"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Role Status</label>
                <select
                  value={formData.status || 'ACTIVE'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as OrganogramStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="VACANT">VACANT</option>
                </select>
              </div>

              {/* Title / Designation */}
              <div className="space-y-1 md:col-span-2">
                <label className="font-semibold text-slate-700">Designation / Role Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Head of Quality Assurance (QMS Director)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Grade / Level */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Hierarchy Level / Grade</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="L8 Executive">L8 Executive (VP / C-Level)</option>
                  <option value="L7 Director">L7 Director (Functional Head)</option>
                  <option value="L6 Senior Manager">L6 Senior Manager</option>
                  <option value="L5 Manager">L5 Manager / Divisional Lead</option>
                  <option value="L5 Lead">L5 Lead (Floor Superintendent)</option>
                  <option value="L4 Specialist">L4 Specialist / Supervisor</option>
                  <option value="L3 Officer">L3 Officer / Lead Inspector</option>
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Department / Division</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Executive Management">Executive Management</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Engineering & Productivity">Engineering &amp; Productivity</option>
                  <option value="Testing & Physical Labs">Testing &amp; Physical Labs</option>
                  <option value="Incoming Quality">Incoming Quality &amp; Store</option>
                  <option value="Sewing Operations">Sewing Operations</option>
                  <option value="Finishing Operations">Finishing Operations</option>
                  <option value="Cutting & Pre-Sewing">Cutting &amp; Pre-Sewing</option>
                </select>
              </div>

              {/* Corporate Email */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Official Corporate Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. tanzim.ahmed@garments-erp.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Direct Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +880 1711 500102"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Office Location */}
              <div className="space-y-1 md:col-span-2">
                <label className="font-semibold text-slate-700">Physical Office / Station Location</label>
                <input
                  type="text"
                  value={formData.officeLocation || ''}
                  onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                  placeholder="e.g. Central QMS Tower 2, 3rd Floor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Joined Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Joined Date</label>
                <input
                  type="date"
                  value={formData.joinedDate || ''}
                  onChange={(e) => setFormData({ ...formData, joinedDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HIERARCHY PLACEMENT & AUTHORITIES */}
      {activeTab === 'hierarchy_authority' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Direct Superior & Headcount */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Reporting Chain &amp; Team Span of Control
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Tier Placement</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Direct Superior (Reports To)
                </label>
                <select
                  value={formData.reportsToId || ''}
                  onChange={(e) => setFormData({ ...formData, reportsToId: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Executive Board / CEO (Top Level)</option>
                  {allNodes
                    .filter((n) => n.id !== formData.id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} — {n.title} ({n.grade})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Establishes direct parent-child branch in the factory organizational tree.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Direct &amp; Operational Team Headcount
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.headcount}
                  onChange={(e) => setFormData({ ...formData, headcount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500">
                  Number of floor inspectors, supervisors, and technicians reporting under this division.
                </p>
              </div>
            </div>
          </div>

          {/* Decision Authority & Escalation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Decision Authority &amp; Escalation Boundaries
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                ISO 9001 Clause 5.3
              </span>
            </div>

            <textarea
              rows={3}
              value={formData.decisionAuthority || ''}
              onChange={(e) => setFormData({ ...formData, decisionAuthority: e.target.value })}
              placeholder="e.g. Authorized to stop production line, sign buyer inspection reports, approve CAPA..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Responsibilities Builder */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Key Operational Responsibilities
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newResp}
                onChange={(e) => setNewResp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddResp();
                  }
                }}
                placeholder="Add specific operational duty or RACI responsibility..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddResp}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
              >
                Add Duty
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {(formData.responsibilities || []).map((r, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs gap-2"
                >
                  <span className="text-slate-800">{r}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResp(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications Builder */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Professional Certifications &amp; Audit Credentials
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCert();
                  }
                }}
                placeholder="e.g. ISO 9001:2015 Lead Auditor, Six Sigma Green Belt, ZDHC Manager..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCert}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs"
              >
                Add Credential
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(formData.certifications || []).map((c, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200"
                >
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  <span>{c}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(idx)}
                    className="ml-1 text-purple-400 hover:text-rose-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b pb-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {formData.grade}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{formData.name || 'Untitled Leader'}</h2>
                <p className="text-xs text-slate-600 font-semibold">{formData.title}</p>
                <p className="text-xs text-slate-400 font-mono">{formData.department} • {formData.email}</p>
              </div>

              <div className="text-right font-mono">
                <span className="text-lg font-bold text-slate-900">{formData.headcount}</span>
                <span className="text-[10px] text-slate-400 block">Team Staff</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Reporting Superior</span>
              <p className="font-bold text-slate-900">
                {superior ? `${superior.name} (${superior.title})` : 'Executive Board / CEO'}
              </p>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleSave('ACTIVE')}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Confirm &amp; Publish Position</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
