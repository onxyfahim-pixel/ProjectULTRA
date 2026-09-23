'use client';

import React, { useState } from 'react';
import { Briefcase, GraduationCap, CheckCircle2, Award, ChevronRight, Layers, Users } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { JobDescriptionItem } from '@/lib/types/modules';
import { MOCK_JOB_DESCRIPTIONS } from '@/lib/db/modules-mock-data';

export function JobDescriptionView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [jobs] = useState<JobDescriptionItem[]>(MOCK_JOB_DESCRIPTIONS);

  const departments = Array.from(new Set(jobs.map((j) => j.department)));

  const columns: ColumnDef<JobDescriptionItem>[] = [
    {
      key: 'roleCode',
      header: 'Role Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
          {item.roleCode}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Designation & Department',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
          <div className="text-[11px] text-slate-500">{item.department} • {item.level}</div>
        </div>
      ),
    },
    {
      key: 'keyResponsibilities',
      header: 'Primary Accountabilities',
      render: (item) => (
        <ul className="text-xs text-slate-700 space-y-0.5 max-w-sm">
          {item.keyResponsibilities.slice(0, 2).map((r, idx) => (
            <li key={idx} className="flex items-start gap-1">
              <span className="text-blue-600 font-bold">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'educationRequirement',
      header: 'Education & Experience',
      render: (item) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{item.educationRequirement}</div>
          <div className="text-[11px] text-slate-500 font-mono">Min. {item.experienceYears} Years Experience</div>
        </div>
      ),
    },
    {
      key: 'technicalSkills',
      header: 'Competencies',
      render: (item) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {item.technicalSkills.map((sk, idx) => (
            <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              {sk}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="job-descriptions-module"
        moduleCode="MOD-23"
        badge="Human Capital & Roles"
        title="Quality Assurance Job Descriptions & Competency Framework"
        subtitle="Role responsibilities, educational requirements, and technical skills matrices for factory quality personnel"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${jobs.length} Job Profiles`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Defined Job Profiles"
              value={jobs.length}
              subtitle="QMS Competency Standard"
              icon={<Briefcase className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Technical Certifications"
              value="ISO & Six Sigma"
              subtitle="Mandatory Qualification"
              icon={<GraduationCap className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Role Clarity"
              value="100% Documented"
              subtitle="Signed Job Descriptions"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Appraisal Alignment"
              value="KPI Linked"
              subtitle="Bonus & Performance Score"
              icon={<Award className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Hierarchy */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Department Distribution
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">QMS Org</span>
              </div>
              <div className="space-y-2">
                {departments.map((dept) => {
                  const deptJobs = jobs.filter((j) => j.department === dept);
                  return (
                    <div key={dept} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-xs font-semibold text-slate-800">{dept}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {deptJobs.map((j) => j.title).join(', ')}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {deptJobs.length} roles
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Competency Standard Highlights */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Core Technical Competencies
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Skills Matrix</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {Array.from(new Set(jobs.flatMap((j) => j.technicalSkills))).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete QA Job Profiles & Competency Matrix"
            recordCount={jobs.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="job-descriptions-table"
            title="Quality Assurance Job Descriptions & Competency Framework"
            subtitle="Role responsibilities, educational requirements, and technical skills matrices for factory quality personnel"
            data={jobs}
            columns={columns}
            searchPlaceholder="Search role title, department, or required skills..."
            searchableKeys={['roleCode', 'title', 'department', 'educationRequirement']}
          />
        </div>
      )}
    </div>
  );
}
