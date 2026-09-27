'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Award,
  ChevronRight,
  Layers,
  Users,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  Download,
  Building2,
  User,
  Shield,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { JobDescriptionItem, JobDescriptionStatus } from '@/lib/types/modules';
import { INITIAL_JOB_DESCRIPTIONS } from '../modules/job-description/job-description-data';
import { JobDescriptionDetailsPage } from '../modules/job-description/JobDescriptionDetailsPage';
import { JobDescriptionEntryPage } from '../modules/job-description/JobDescriptionEntryPage';
import { DeleteJobDescriptionModal } from '../modules/job-description/DeleteJobDescriptionModal';

type JobDescriptionSubView =
  | { type: 'none' }
  | { type: 'details'; job: JobDescriptionItem }
  | { type: 'add' }
  | { type: 'edit'; job: JobDescriptionItem };

export function JobDescriptionView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  // Load from localStorage or fallback to INITIAL_JOB_DESCRIPTIONS
  const [jobs, setJobs] = useState<JobDescriptionItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('erp_job_descriptions_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed parsing stored job descriptions:', err);
      }
    }
    return INITIAL_JOB_DESCRIPTIONS;
  });

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('erp_job_descriptions_v1', JSON.stringify(jobs));
      } catch (err) {
        console.warn('Failed saving job descriptions to localStorage:', err);
      }
    }
  }, [jobs]);

  // Subview State (Details, Add, Edit)
  const [subView, setSubView] = useState<JobDescriptionSubView>({ type: 'none' });

  // Sync subview job if data updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = jobs.find((j) => j.id === subView.job.id);
      if (refreshed && refreshed !== subView.job) {
        setSubView({ type: 'details', job: refreshed });
      }
    }
  }, [jobs, subView]);

  // Modal State for Deletions
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    jobs: JobDescriptionItem[];
  } | null>(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct lists for filters
  const departments = Array.from(new Set(jobs.map((j) => j.department))).sort();

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => {
    const matchesDept = departmentFilter === 'ALL' || j.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || (j.status || 'ACTIVE') === statusFilter;
    return matchesDept && matchesStatus;
  });

  // CRUD Handlers
  const handleCreateJob = (newJob: JobDescriptionItem) => {
    const updated = [newJob, ...jobs];
    setJobs(updated);
    setSubView({ type: 'details', job: newJob });
    showToast(`Successfully created job profile ${newJob.roleCode}`);
  };

  const handleUpdateJob = (updatedJob: JobDescriptionItem) => {
    const updated = jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j));
    setJobs(updated);
    if (subView.type === 'edit' || subView.type === 'details') {
      setSubView({ type: 'details', job: updatedJob });
    }
    showToast(`Saved updates to job profile ${updatedJob.roleCode}`);
  };

  const handleDuplicateJob = (job: JobDescriptionItem) => {
    const duplicated: JobDescriptionItem = {
      ...JSON.parse(JSON.stringify(job)),
      id: `jd-${Date.now()}`,
      roleCode: `${job.roleCode}-COPY`,
      title: `${job.title} (Copy)`,
      incumbentName: '',
      companyIdNo: '',
      status: 'VACANT',
      revision: 'Rev 1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [duplicated, ...jobs];
    setJobs(updated);
    setSubView({ type: 'details', job: duplicated });
    showToast(`Duplicated job profile as ${duplicated.roleCode}`);
  };

  const confirmDeleteJobs = () => {
    if (!deleteModal) return;
    const idsToDelete = new Set(deleteModal.jobs.map((j) => j.id));
    const updated = jobs.filter((j) => !idsToDelete.has(j.id));
    setJobs(updated);

    if (subView.type === 'details' && idsToDelete.has(subView.job.id)) {
      setSubView({ type: 'none' });
    }
    showToast(`Deleted ${deleteModal.jobs.length} job description record(s)`);
    setDeleteModal(null);
  };

  // Helper avatar initials
  const getInitials = (name?: string) => {
    if (!name) return 'VA';
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
  const columns: ColumnDef<JobDescriptionItem>[] = [
    {
      key: 'roleCode',
      header: 'Role & Status',
      sortable: true,
      render: (item) => {
        const isVacant = item.status === 'VACANT';
        const isReview = item.status === 'UNDER_REVISION';
        return (
          <div className="space-y-1">
            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 inline-block">
              {item.roleCode}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isVacant ? 'bg-amber-500' : isReview ? 'bg-indigo-500' : 'bg-emerald-500'
                }`}
              />
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                {item.level.split(' ')[0]} • {item.status || 'ACTIVE'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Designation & Incumbent',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-mono font-bold text-xs text-blue-700 shrink-0">
            {getInitials(item.incumbentName)}
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setSubView({ type: 'details', job: item })}
              className="font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors text-left block truncate cursor-pointer"
              title={item.title}
            >
              {item.title}
            </button>
            <div className="text-[11px] text-slate-600 font-medium truncate flex items-center gap-1.5 mt-0.5">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{item.incumbentName || 'Position Vacant'}</span>
              {item.companyIdNo && (
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                  {item.companyIdNo}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department & Station',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-800 block truncate">
            {item.department}
          </span>
          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <span>{item.workstationLocation || 'Central Plant Floor'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'supervisor',
      header: 'Direct Supervisor',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-slate-800 truncate">
            {item.supervisorName || 'Executive Board'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            {item.supervisorTitle || 'Department Head'} {item.supervisorIdNo ? `(${item.supervisorIdNo})` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'experience',
      header: 'Experience & Degree',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
            Min. {item.experienceYears} Years
          </span>
          <div className="text-[10px] text-slate-500 truncate max-w-[130px]" title={item.educationRequirement}>
            {item.educationRequirement}
          </div>
        </div>
      ),
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
            onClick={() => setSubView({ type: 'details', job: item })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Separate Job Description Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', job: item })}
            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
            title="Edit Role Profile"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateJob(item)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate Role Template"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, jobs: [item] })}
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

      {/* TOP HEADER: 3-tab layout (Summary, Job Profiles Register, Competency & Skills Matrix) */}
      <ModuleHeader
        id="job-descriptions-module"
        moduleCode="MOD-23"
        badge="Human Capital & Roles"
        title="Quality Assurance Job Descriptions & Competency Framework (ISO 9001:2015)"
        subtitle="Role accountabilities, company employee IDs, supervisor reporting chains, and ISO audit competency matrices"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Job Profiles Register', count: jobs.length },
          { id: 'competency', label: 'Competency & Skills Matrix' },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <JobDescriptionDetailsPage
          job={subView.job}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(j) => setSubView({ type: 'edit', job: j })}
          onDuplicate={(j) => handleDuplicateJob(j)}
          onDelete={(j) => setDeleteModal({ isOpen: true, jobs: [j] })}
          onUpdateStatus={handleUpdateJob}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <JobDescriptionEntryPage
          onSave={handleCreateJob}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <JobDescriptionEntryPage
          initialJob={subView.job}
          onSave={handleUpdateJob}
          onCancel={() => setSubView({ type: 'details', job: subView.job })}
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
                  title="Defined Job Profiles"
                  value={jobs.length}
                  subtitle="QMS Competency Standard"
                  icon={Briefcase}
                  tone="blue"
                  delta={{ value: '+2 Roles Configured', isPositive: true }}
                />
                <StatCard
                  title="ISO Clause 5.3 & 7.2"
                  value="100% Mapped"
                  subtitle="Explicit Delegated Authority"
                  icon={ShieldCheck}
                  tone="emerald"
                />
                <StatCard
                  title="Designated Staff"
                  value={`${jobs.filter((j) => j.status === 'ACTIVE').length} / ${jobs.length}`}
                  subtitle="Active Assigned Personnel"
                  icon={Users}
                  tone="indigo"
                />
                <StatCard
                  title="Technical Certifications"
                  value="IRCA & ASQ"
                  subtitle="Mandatory Auditor Credentials"
                  icon={Award}
                  tone="amber"
                />
              </div>

              {/* Clean Light-Themed Highlight Banner: Buyer & Order Style Buttons */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>ISO 9001:2015 Clause 5.3 Organizational Roles &amp; Authorities</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Garments Quality Assurance Job Competency Register
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Formal job descriptions establishing employee company ID numbers, direct supervisor reporting lines,
                    unilateral line-stop decision authorities, and technical skill certifications required for buyer compliance.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const master = jobs[0] || INITIAL_JOB_DESCRIPTIONS[0];
                      setSubView({ type: 'details', job: master });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View QA Director Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Create Job Description</span>
                  </button>
                </div>
              </div>

              {/* Department Distribution & Competencies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department Hierarchy */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Departmental Distribution &amp; Incumbents
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {departments.length} Divisions
                    </span>
                  </div>
                  <div className="space-y-2">
                    {departments.map((dept) => {
                      const deptJobs = jobs.filter((j) => j.department === dept);
                      return (
                        <div
                          key={dept}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-800">{dept}</span>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {deptJobs.map((j) => `${j.title} (${j.incumbentName || 'Vacant'})`).join(' • ')}
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0 ml-2">
                            {deptJobs.length} {deptJobs.length === 1 ? 'Role' : 'Roles'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Core Technical Competencies */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Evaluated Technical Competencies
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">Skills Matrix</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {Array.from(new Set(jobs.flatMap((j) => j.technicalSkills))).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Mandatory Professional Certifications:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(jobs.flatMap((j) => j.certificationsRequired || []))).map((cert, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <SwitchToListBanner
                label="Open Full Job Profiles Register & Competency Matrix"
                recordCount={jobs.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: JOB PROFILES REGISTER (Compact Table, No Horizontal Scroll) */}
          {viewMode === 'list' && (
            <div className="animate-in fade-in duration-200">
              <DataTable
                id="job-descriptions-table"
                title="Quality Assurance Job Descriptions Register (ISO 9001:2015)"
                subtitle="Complete registry of roles, employee company IDs, supervisor reporting lines, and delegated decision authorities"
                data={filteredJobs}
                columns={columns}
                searchPlaceholder="Search role code, job title, incumbent name, company ID, or supervisor..."
                searchableKeys={['roleCode', 'title', 'incumbentName', 'companyIdNo', 'supervisorName', 'department']}
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

                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active Incumbent</option>
                      <option value="VACANT">Vacant Position</option>
                      <option value="UNDER_REVISION">Under Revision</option>
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
                    <span>+ Create Job Description</span>
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
                        jobs: selected,
                      });
                    },
                  },
                  {
                    label: 'Export Register',
                    icon: <Download className="w-3.5 h-3.5" />,
                    onClick: (selected) => {
                      showToast(`Exported ${selected.length} job description records`);
                    },
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 3: COMPETENCY & SKILLS MATRIX */}
          {viewMode === 'competency' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ISO 9001 Clause 7.2 Competency &amp; Authority Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive cross-functional audit mapping of employee technical capabilities and delegated decision authorities.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubView({ type: 'add' })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Role</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800">
                          {job.roleCode}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {job.level.split(' ')[0]}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{job.title}</h4>
                      <div className="text-[11px] text-slate-600 font-medium">
                        Incumbent: <strong>{job.incumbentName || 'Vacant'}</strong>{' '}
                        {job.companyIdNo && <span className="font-mono text-blue-700">({job.companyIdNo})</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Supervisor: {job.supervisorName} ({job.supervisorTitle})
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                        <strong>Authority:</strong> {job.decisionAuthority}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Min. {job.experienceYears} Yrs Exp
                      </span>
                      <button
                        type="button"
                        onClick={() => setSubView({ type: 'details', job })}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <span>Inspect Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <DeleteJobDescriptionModal
          isOpen={deleteModal.isOpen}
          jobs={deleteModal.jobs}
          onConfirm={confirmDeleteJobs}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
