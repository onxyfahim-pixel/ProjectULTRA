'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Briefcase,
  User,
  Shield,
  Building2,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  CheckCircle2,
  Layers,
  Check,
  Target,
} from 'lucide-react';
import { JobDescriptionItem, JobDescriptionStatus, JobDescriptionKpi } from '@/lib/types/modules';

interface JobDescriptionEntryPageProps {
  initialJob?: JobDescriptionItem | null;
  onSave: (job: JobDescriptionItem) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const DEPARTMENTS = [
  'Quality Assurance',
  'Fabric Laboratory & Testing',
  'Cutting Division',
  'Sewing Production Lines',
  'Finishing & Export Packing',
  'Internal Audit & Compliance',
  'Industrial Engineering & Work Study',
  'Sample Development & Pre-Production',
  'Maintenance & Utilities',
  'Washing Plant & Chemical Safety',
];

const MANAGEMENT_LEVELS = [
  'L8 Executive Leadership',
  'L7 Director / General Manager',
  'L6 Assistant General Manager',
  'L5 Manager',
  'L4 Section Head / In-Charge',
  'L3 Senior Specialist / Officer',
  'L2 Junior Quality Auditor',
  'L1 Table Checker / Operator',
];

const ISO_CLAUSE_OPTIONS = [
  'ISO 9001:2015 Clause 5.3 (Organizational Roles, Responsibilities & Authorities)',
  'ISO 9001:2015 Clause 7.1.5 (Monitoring & Measuring Resources)',
  'ISO 9001:2015 Clause 7.2 (Competence & Training Records)',
  'ISO 9001:2015 Clause 8.2 (Requirements for Products & Services)',
  'ISO 9001:2015 Clause 8.5.1 (Control of Production & Service Provision)',
  'ISO 9001:2015 Clause 8.6 (Release of Products & Services)',
  'ISO 9001:2015 Clause 8.7 (Control of Nonconforming Outputs)',
  'ISO 9001:2015 Clause 9.2 (Internal Quality Audits)',
  'ISO 9001:2015 Clause 10.2 (Nonconformity & Corrective Action)',
  'ISO 17025:2017 (Testing & Calibration Laboratories)',
  'ZDHC MRSL v3.1 (Chemical & Environmental Compliance)',
];

export function JobDescriptionEntryPage({
  initialJob,
  onSave,
  onCancel,
  showToast,
}: JobDescriptionEntryPageProps) {
  const isEditing = Boolean(initialJob);

  const [activeTab, setActiveTab] = useState<'role_identity' | 'responsibilities_authority' | 'qualifications_kpis' | 'preview'>('role_identity');

  // Form State
  const [formData, setFormData] = useState<JobDescriptionItem>(() => {
    if (initialJob) {
      return JSON.parse(JSON.stringify(initialJob));
    }
    return {
      id: `jd-${Date.now()}`,
      roleCode: 'JD-QA-09',
      title: '',
      department: 'Quality Assurance',
      level: 'L4 Section Head / In-Charge',
      incumbentName: '',
      companyIdNo: '',
      supervisorName: 'Tanzim Ahmed',
      supervisorTitle: 'Head of Quality Assurance (QMS Director)',
      supervisorIdNo: 'EMP-2020-0042',
      status: 'ACTIVE',
      employmentType: 'FULL_TIME',
      educationRequirement: 'Diploma / B.Sc. in Textile Engineering or Apparel Technology',
      experienceYears: 5,
      workstationLocation: 'Main Plant Floor 2, Central QA Station',
      effectiveDate: new Date().toISOString().split('T')[0],
      revision: 'Rev 1.0',
      approvedBy: 'Managing Director & CEO',
      decisionAuthority:
        'Unilateral line-stop authority upon detecting 3 consecutive sewing defects; authority to quarantine non-conforming lots.',
      isoClauseMapping: [
        'ISO 9001:2015 Clause 5.3 (Organizational Roles, Responsibilities & Authorities)',
        'ISO 9001:2015 Clause 7.2 (Competence & Training Records)',
        'ISO 9001:2015 Clause 8.5.1 (Control of Production & Service Provision)',
      ],
      keyResponsibilities: [
        'Conduct daily floor quality inspections per approved buyer tech pack specifications.',
        'Enforce strict adherence to approved sample tolerances and critical measurements.',
        'Maintain daily in-line defect logs and immediately escalate recurring issues.',
      ],
      technicalSkills: [
        'AQL 1.5/2.5 Inspection',
        'Garment Measurement Tolerances',
        'Defect Root Cause Analysis',
      ],
      certificationsRequired: [
        'Certified Quality Controller (QMS)',
      ],
      kpiMetrics: [
        { kpiName: 'Line End-of-Line DHU', target: '< 2.5%', measurementFrequency: 'Daily' },
        { kpiName: 'Audit Checklist On-Time Completion', target: '100%', measurementFrequency: 'Daily' },
      ],
      reportingSubordinates: [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
  });

  // Builder inputs
  const [newResp, setNewResp] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newSubordinate, setNewSubordinate] = useState('');
  const [newKpiName, setNewKpiName] = useState('');
  const [newKpiTarget, setNewKpiTarget] = useState('');
  const [newKpiFreq, setNewKpiFreq] = useState('Daily');

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.roleCode.trim()) errs.roleCode = 'Role code is required (e.g. JD-QA-01)';
    if (!formData.title.trim()) errs.title = 'Job title is required';
    if (!formData.incumbentName?.trim()) errs.incumbentName = 'Designated incumbent name is required';
    if (!formData.companyIdNo?.trim()) errs.companyIdNo = 'Company ID No. is required (e.g. EMP-2024-001)';
    if (!formData.supervisorName?.trim()) errs.supervisorName = 'Supervisor name is required';
    if (formData.keyResponsibilities.length === 0) errs.keyResponsibilities = 'At least 1 responsibility is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (statusOverride?: JobDescriptionStatus) => {
    if (!validate()) {
      showToast('Please fix required fields before saving');
      setActiveTab('role_identity');
      return;
    }

    const toSave: JobDescriptionItem = {
      ...formData,
      status: statusOverride || formData.status || 'ACTIVE',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(toSave);
  };

  // Add/remove handlers
  const handleAddResp = () => {
    if (!newResp.trim()) return;
    setFormData((prev) => ({
      ...prev,
      keyResponsibilities: [...prev.keyResponsibilities, newResp.trim()],
    }));
    setNewResp('');
  };

  const handleRemoveResp = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      keyResponsibilities: prev.keyResponsibilities.filter((_, i) => i !== index),
    }));
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setFormData((prev) => ({
      ...prev,
      technicalSkills: [...prev.technicalSkills, newSkill.trim()],
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      technicalSkills: prev.technicalSkills.filter((s) => s !== skill),
    }));
  };

  const handleAddCert = () => {
    if (!newCert.trim()) return;
    setFormData((prev) => ({
      ...prev,
      certificationsRequired: [...(prev.certificationsRequired || []), newCert.trim()],
    }));
    setNewCert('');
  };

  const handleRemoveCert = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certificationsRequired: (prev.certificationsRequired || []).filter((c) => c !== cert),
    }));
  };

  const handleAddKpi = () => {
    if (!newKpiName.trim() || !newKpiTarget.trim()) return;
    const newKpi: JobDescriptionKpi = {
      kpiName: newKpiName.trim(),
      target: newKpiTarget.trim(),
      measurementFrequency: newKpiFreq,
    };
    setFormData((prev) => ({
      ...prev,
      kpiMetrics: [...(prev.kpiMetrics || []), newKpi],
    }));
    setNewKpiName('');
    setNewKpiTarget('');
  };

  const handleRemoveKpi = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      kpiMetrics: (prev.kpiMetrics || []).filter((_, i) => i !== index),
    }));
  };

  const handleToggleIsoClause = (clause: string) => {
    const current = formData.isoClauseMapping || [];
    if (current.includes(clause)) {
      setFormData({
        ...formData,
        isoClauseMapping: current.filter((c) => c !== clause),
      });
    } else {
      setFormData({
        ...formData,
        isoClauseMapping: [...current, clause],
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP ACTION BAR: Buyer & Order Styling */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Cancel and return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {isEditing ? 'Editing Job Description Profile' : 'New Job Description Entry'}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {formData.title ? formData.title : 'Configure Role & ISO 9001 Responsibilities'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSave('DRAFT' as any)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave('ACTIVE')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save Changes' : 'Publish Job Description'}</span>
          </button>
        </div>
      </div>

      {/* STEP TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('role_identity')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'role_identity'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          1. Role Identity &amp; Incumbent
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('responsibilities_authority')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'responsibilities_authority'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          2. Responsibilities &amp; Authority
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qualifications_kpis')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'qualifications_kpis'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          3. Qualifications, Skills &amp; KPIs
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          4. Live Preview
        </button>
      </div>

      {/* TAB 1: ROLE IDENTITY & INCUMBENT */}
      {activeTab === 'role_identity' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Position &amp; Incumbent Identity (Company ID &amp; Reporting)
            </h2>
            <p className="text-xs text-slate-500">
              Role code, official job title, designated staff name, company ID, and direct supervisor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.roleCode}
                onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                placeholder="e.g. JD-QA-01"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.roleCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } font-mono font-bold`}
              />
              {errors.roleCode && <p className="text-[11px] text-rose-500 mt-1">{errors.roleCode}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Title / Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Sewing Line Quality In-Charge"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } font-medium`}
              />
              {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incumbent Employee Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.incumbentName || ''}
                onChange={(e) => setFormData({ ...formData, incumbentName: e.target.value })}
                placeholder="e.g. Mohammad Ali"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.incumbentName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {errors.incumbentName && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.incumbentName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company ID No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyIdNo || ''}
                onChange={(e) => setFormData({ ...formData, companyIdNo: e.target.value })}
                placeholder="e.g. EMP-2022-0481"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.companyIdNo ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } font-mono font-bold text-blue-700`}
              />
              {errors.companyIdNo && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.companyIdNo}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employment Type
              </label>
              <select
                value={formData.employmentType || 'FULL_TIME'}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              >
                <option value="FULL_TIME">Full Time Permanent</option>
                <option value="CONTRACT">Contractual</option>
                <option value="PROBATIONARY">Probationary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department / Division <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Management Level / Grade
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-700"
              >
                {MANAGEMENT_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workstation Location
              </label>
              <input
                type="text"
                value={formData.workstationLocation || ''}
                onChange={(e) => setFormData({ ...formData, workstationLocation: e.target.value })}
                placeholder="e.g. Sewing Floor 2, Central QA Station"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
            </div>

            {/* Supervisor Details */}
            <div className="md:col-span-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Direct Supervisor / Reporting Line
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Supervisor Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.supervisorName || ''}
                    onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                    placeholder="e.g. Tanzim Ahmed"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  />
                  {errors.supervisorName && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.supervisorName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Supervisor Designation
                  </label>
                  <input
                    type="text"
                    value={formData.supervisorTitle || ''}
                    onChange={(e) => setFormData({ ...formData, supervisorTitle: e.target.value })}
                    placeholder="e.g. Head of Quality Assurance (QMS Director)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Supervisor Company ID
                  </label>
                  <input
                    type="text"
                    value={formData.supervisorIdNo || ''}
                    onChange={(e) => setFormData({ ...formData, supervisorIdNo: e.target.value })}
                    placeholder="e.g. EMP-2020-0042"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab('responsibilities_authority')}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Next: Responsibilities &amp; Authority &rarr;
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: RESPONSIBILITIES & AUTHORITY */}
      {activeTab === 'responsibilities_authority' && (
        <div className="space-y-6">
          {/* Key Responsibilities Builder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Primary Roles &amp; Operational Responsibilities
              </h2>
              <p className="text-xs text-slate-500">
                Itemize specific duties, daily verification tasks, and escalation protocols required by ISO audit standards.
              </p>
            </div>

            <div className="flex gap-2">
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
                placeholder="Enter specific accountability (e.g. Conduct hourly 7-piece roving quality audits on active sewing lines)..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
              <button
                type="button"
                onClick={handleAddResp}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Responsibility</span>
              </button>
            </div>
            {errors.keyResponsibilities && (
              <p className="text-[11px] text-rose-500">{errors.keyResponsibilities}</p>
            )}

            {/* List */}
            <div className="space-y-2">
              {formData.keyResponsibilities.map((resp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-mono text-[10px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 font-medium leading-relaxed">{resp}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveResp(idx)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Authority & ISO Clause Mapping */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                ISO 9001 Clause 5.3 Delegated Decision Authority
              </h2>
              <p className="text-xs text-slate-500">
                Formally define the line-stop authority, material rejection power, and batch quarantine authority.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Decision Authority Statement
              </label>
              <textarea
                rows={3}
                value={formData.decisionAuthority || ''}
                onChange={(e) => setFormData({ ...formData, decisionAuthority: e.target.value })}
                placeholder="e.g. Unilateral authority to mandate line stops upon detecting 3 consecutive sewing defects; authority to quarantine non-conforming lots..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
            </div>

            {/* ISO Clause Checkboxes */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Select Applicable ISO 9001:2015 Audit Clauses:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ISO_CLAUSE_OPTIONS.map((clause) => {
                  const isChecked = (formData.isoClauseMapping || []).includes(clause);
                  return (
                    <label
                      key={clause}
                      onClick={() => handleToggleIsoClause(clause)}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-blue-600 focus:ring-0"
                      />
                      <span className="font-mono text-[11px] leading-tight">{clause}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('role_identity')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                &larr; Back to Role Identity
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qualifications_kpis')}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Next: Qualifications &amp; KPIs &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUALIFICATIONS, SKILLS & KPIS */}
      {activeTab === 'qualifications_kpis' && (
        <div className="space-y-6">
          {/* Qualifications & Skills */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Education, Experience &amp; Technical Competencies
              </h2>
              <p className="text-xs text-slate-500">
                Minimum hiring standards and competencies required per ISO 9001 Clause 7.2.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Educational Degree
                </label>
                <input
                  type="text"
                  value={formData.educationRequirement}
                  onChange={(e) => setFormData({ ...formData, educationRequirement: e.target.value })}
                  placeholder="e.g. Diploma / B.Sc. in Textile Engineering"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Experience (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              {/* Skills Builder */}
              <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Technical Skills &amp; Competencies:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add technical skill (e.g. AQL 1.5 Inspection, Traffic Light Audit)..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Add Skill
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.technicalSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="text-blue-500 hover:text-rose-500 cursor-pointer ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications Builder */}
              <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Mandatory Professional Certifications:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    placeholder="Add certification (e.g. IRCA Lead Auditor, Munsell 100 Hue)..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Add Cert
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(formData.certificationsRequired || []).map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{cert}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(cert)}
                        className="text-emerald-600 hover:text-rose-500 cursor-pointer ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Metrics Builder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Key Performance Indicators (KPIs)
              </h2>
              <p className="text-xs text-slate-500">
                Quantifiable metrics evaluated during quarterly and annual appraisals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                value={newKpiName}
                onChange={(e) => setNewKpiName(e.target.value)}
                placeholder="Metric Name (e.g. Sewing DHU)..."
                className="md:col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
              <input
                type="text"
                value={newKpiTarget}
                onChange={(e) => setNewKpiTarget(e.target.value)}
                placeholder="Target (e.g. < 2.0%)..."
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold"
              />
              <div className="flex gap-2">
                <select
                  value={newKpiFreq}
                  onChange={(e) => setNewKpiFreq(e.target.value)}
                  className="px-2 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 flex-1"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddKpi}
                  className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Add KPI
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {(formData.kpiMetrics || []).map((kpi, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">{kpi.kpiName}</span>
                    <span className="font-mono font-bold text-blue-700">{kpi.target}</span>
                    <span className="font-mono text-[10px] text-slate-500">({kpi.measurementFrequency})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveKpi(idx)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('responsibilities_authority')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                &larr; Back to Responsibilities
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Next: Live Preview &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Job Description Document Preview
              </span>
              <p className="text-xs text-slate-500">
                Review complete role profile before official publication into the ISO 9001 governance register.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {formData.roleCode} • {formData.level}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block text-sm">{formData.title || 'Untitled Role'}</span>
              <div>
                <span className="text-slate-500">Designated Incumbent:</span>{' '}
                <strong className="text-slate-900">{formData.incumbentName || 'Not Designated'}</strong>{' '}
                <span className="font-mono text-blue-700">({formData.companyIdNo || 'ID Missing'})</span>
              </div>
              <div>
                <span className="text-slate-500">Supervisor:</span>{' '}
                <strong className="text-slate-800">{formData.supervisorName || 'Executive Board'}</strong>{' '}
                <span className="text-slate-500">({formData.supervisorTitle})</span>
              </div>
              <div>
                <span className="text-slate-500">Department:</span>{' '}
                <span className="font-semibold text-slate-800">{formData.department}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
              <span className="font-bold text-blue-950 block">Decision Authority Summary:</span>
              <p className="text-slate-700 leading-relaxed">
                {formData.decisionAuthority || 'No explicit decision authority defined.'}
              </p>
              <div className="font-mono text-[11px] text-blue-700 font-semibold pt-1">
                {formData.keyResponsibilities.length} Documented Responsibilities • {formData.technicalSkills.length} Core Skills
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('qualifications_kpis')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              &larr; Back to Qualifications
            </button>

            <button
              type="button"
              onClick={() => handleSave('ACTIVE')}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save & Update Job Description' : 'Publish Job Description'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
