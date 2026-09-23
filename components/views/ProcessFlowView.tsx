'use client';

import React, { useState } from 'react';
import { GitCommit, Clock, CheckCircle2, Factory, ChevronRight, Layers } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { MOCK_PROCESS_FLOW } from '@/lib/db/modules-mock-data';
import { ProcessFlowStep } from '@/lib/types/modules';

export function ProcessFlowView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [steps] = useState<ProcessFlowStep[]>(MOCK_PROCESS_FLOW);
  const [selectedStep, setSelectedStep] = useState<ProcessFlowStep>(steps[3]); // 4-Point QC default

  const totalLeadTime = steps.reduce((sum, s) => sum + s.leadTimeHours, 0);

  const columns: ColumnDef<ProcessFlowStep>[] = [
    {
      key: 'stepNumber',
      header: 'Seq #',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-100">
          0{item.stepNumber}
        </span>
      ),
    },
    {
      key: 'stageName',
      header: 'Stage Name & Department',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.stageName}</span>
          <div className="text-[11px] text-slate-500 font-mono">{item.department}</div>
        </div>
      ),
    },
    {
      key: 'qualityGate',
      header: 'Quality Gate & Validation Tolerances',
      render: (item) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800 block">{item.qualityGate}</span>
          <span className="text-[11px] text-blue-700 font-mono">Tool: {item.standardTool}</span>
        </div>
      ),
    },
    {
      key: 'transformation',
      header: 'Process Transformation',
      render: (item) => (
        <span className="text-xs text-slate-600 max-w-xs truncate block" title={item.transformation}>
          {item.transformation}
        </span>
      ),
    },
    {
      key: 'leadTimeHours',
      header: 'Lead Time',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {item.leadTimeHours} hrs
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="process-flow-module"
        moduleCode="MOD-26"
        badge="Manufacturing Pipeline"
        title="Garment Manufacturing Quality Process Pipeline"
        subtitle="End-to-end manufacturing flow from yarn intake through cutting, sewing, laundry, finishing to container dispatch"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${steps.length} Production Stages`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Manufacturing Pipeline"
              value={`${steps.length} Stages`}
              subtitle="Yarn to Export Container"
              icon={<GitCommit className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Total Production Cycle"
              value={`${(totalLeadTime / 24).toFixed(1)} Days`}
              subtitle={`${totalLeadTime} Operating Hours`}
              icon={<Clock className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Quality Control Gates"
              value="8 Gates"
              subtitle="100% In-Line Validation"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Automation Level"
              value="CNC & Direct-Drive"
              subtitle="Modern Industry 4.0"
              icon={<Factory className="w-5 h-5" />}
              tone="amber"
            />
          </div>

          {/* Interactive Horizontal Flow Map */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Garment Manufacturing Quality Process Pipeline
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Click on any stage along the manufacturing flow to inspect quality gates, standard tools, and input transformation criteria.
            </p>

            {/* Steps Ribbon */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1">
              {steps.map((step) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setSelectedStep(step)}
                    className={`px-3 py-2.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                      selectedStep.id === step.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                          selectedStep.id === step.id ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {step.stepNumber}
                      </span>
                      <span className="font-semibold text-xs whitespace-nowrap">{step.stageName}</span>
                    </div>
                    <div
                      className={`text-[10px] font-mono mt-1 ${
                        selectedStep.id === step.id ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {step.department} • {step.leadTimeHours}h
                    </div>
                  </button>
                  {step.stepNumber < steps.length && (
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Selected Stage Deep-Dive */}
            {selectedStep && (
              <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700">
                      Step 0{selectedStep.stepNumber} of 0{steps.length}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedStep.stageName}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-1 sm:mt-0">
                    Department: <span className="font-semibold text-slate-900">{selectedStep.department}</span> | 
                    Lead Time: <span className="font-semibold text-slate-900">{selectedStep.leadTimeHours} Hours</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="font-bold text-slate-900 block mb-1">Input Materials &amp; Pre-requisites:</span>
                    <p className="text-slate-700">{selectedStep.inputMaterials}</p>
                    <span className="font-bold text-slate-900 block mt-3 mb-1">Value-Add Transformation:</span>
                    <p className="text-slate-700">{selectedStep.transformation}</p>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 shadow-xs">
                    <span className="font-bold text-blue-900 block mb-1">Mandatory Quality Gate &amp; Tolerances:</span>
                    <p className="text-blue-800 font-medium">{selectedStep.qualityGate}</p>
                    <span className="font-bold text-blue-900 block mt-3 mb-1">Standard Machinery / Instrument:</span>
                    <p className="text-blue-800 font-mono">{selectedStep.standardTool}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <SwitchToListBanner
            label="Open Comprehensive Process Steps & Gates Register"
            recordCount={steps.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="process-flow-table"
            title="Garment Manufacturing Process Stages & Quality Gates"
            subtitle="Full sequential view of production stages, standard machinery, lead times, and quality gate specifications"
            data={steps}
            columns={columns}
            searchPlaceholder="Search stage name, department, quality gate, or tools..."
            searchableKeys={['stageName', 'department', 'qualityGate', 'standardTool']}
          />
        </div>
      )}
    </div>
  );
}
