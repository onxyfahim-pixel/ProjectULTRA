'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  UserCheck,
  ShieldCheck,
  Building2,
  Sliders,
  ClipboardList,
  Search,
  ExternalLink,
  Layers,
  Check,
} from 'lucide-react';
import {
  ProcedureItem,
  ProcedureResponsibility,
  ProcedureDepartmentProcess,
  ProcedureRelatedDocument,
  ProcedureDistributionEntry,
  ProcedureStepItem,
  ProcedureStation,
  ControlledDocument,
} from '@/lib/types/modules';
import { getAvailableControlledDocuments } from './procedure-data';

interface ProcedureEntryPageProps {
  initialProcedure?: ProcedureItem | null;
  onSave: (procedure: ProcedureItem) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export function ProcedureEntryPage({
  initialProcedure,
  onSave,
  onCancel,
  showToast,
}: ProcedureEntryPageProps) {
  const isEditing = Boolean(initialProcedure);

  // Active form section tab
  const [activeTab, setActiveTab] = useState<
    'general' | 'scope_roles' | 'processes' | 'related_docs' | 'preview'
  >('general');

  // Available documents from Document Control Module
  const [availableControlledDocs] = useState<ControlledDocument[]>(() =>
    getAvailableControlledDocuments()
  );
  const [isDocControlModalOpen, setIsDocControlModalOpen] = useState(false);
  const [docControlSearch, setDocControlSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState<ProcedureItem>(() => {
    if (initialProcedure) {
      return JSON.parse(JSON.stringify(initialProcedure));
    }
    return {
      id: `prc-${Date.now()}`,
      procedureCode: `PRC-QMS-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      companyName: '',
      department: 'QUALITY',
      documentType: 'Standard Operating Procedure (SOP)',
      documentReference: `SOP/QMS/${Math.floor(1000 + Math.random() * 9000)}`,
      issueNo: '01',
      revision: 'Rev 1.0',
      status: 'ACTIVE',
      approvalDate: new Date().toISOString().split('T')[0],
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      authorName: 'Management Representative (MR)',
      authorSignature: 'Lead QMS Auditor',
      approvedByName: 'Managing Director (MD)',
      approvedBySignature: 'Managing Director',
      controlledDocument: true,
      station: 'FULL_PROCESS_CHAIN',
      purposeAndScope:
        'To define standard manufacturing processes, quality gates, and inspection criteria to guarantee 100% conforming production across the manufacturing chain.',
      responsibilities: [
        {
          id: 'resp-1',
          role: 'Section Managers',
          responsibility: 'Responsible for implementing and maintaining conforming production controls.',
          authorityLevel: 'Executive Operational Authority',
        },
        {
          id: 'resp-2',
          role: 'Line Supervisors & QC Controllers',
          responsibility: 'Responsible for reviewing, auditing, and dispositioning conforming products at every gate.',
          authorityLevel: 'Technical Line Quality Authority',
        },
        {
          id: 'resp-3',
          role: 'Operators & Floor Technicians',
          responsibility: 'Responsible for immediately identifying and segregating non-conforming goods.',
          authorityLevel: 'Floor Execution Authority',
        },
      ],
      departmentProcesses: [
        {
          id: 'dept-init-1',
          departmentName: 'Raw Material Store & Receiving',
          departmentCode: '3.1',
          inChargeRole: 'Warehouse Manager',
          steps: [
            {
              id: 's-1',
              stepNumber: '3.1.1',
              title: 'Goods Arrival & PO Matching',
              description: 'Verify incoming consignments against purchase order and commercial invoice.',
              inspectionFrequency: '100% of shipments',
              acceptanceCriteria: 'Zero carton count discrepancy',
              relatedFormCode: 'DOC-QM-01',
              riskLevel: 'LOW',
            },
            {
              id: 's-2',
              stepNumber: '3.1.2',
              title: 'Fabric 4-Point System Inspection',
              description: 'Inspect 10% of rolls by 4-point system before release to cutting floor.',
              inspectionFrequency: '10% of rolls',
              acceptanceCriteria: 'Penalty points under 24 pts / 100 sq. yds',
              relatedFormCode: 'DOC-QC-1005',
              riskLevel: 'CRITICAL',
            },
          ],
        },
      ],
      relatedDocuments: [
        {
          id: 'rd-1',
          documentTitle: 'Factory Quality Assurance Manual (QAM)',
          documentCode: 'DOC-QM-01',
          category: 'Quality Assurance',
          frequency: 'Standing SOP',
          retentionPeriod: 'Permanent',
          isMandatory: true,
        },
        {
          id: 'rd-2',
          documentTitle: 'Needle Replacement & Broken Needle Search SOP',
          documentCode: 'DOC-SOP-SEW-04',
          category: 'Production & Sewing',
          frequency: 'Daily per line',
          retentionPeriod: '3 Years',
          isMandatory: true,
        },
      ],
      distribution: [
        {
          id: 'dist-1',
          departmentOrFile: 'Central Quality File',
          copyType: 'CONTROLLED_PHYSICAL',
          recipientName: 'Document Controller',
          status: 'ACKNOWLEDGED',
        },
        {
          id: 'dist-2',
          departmentOrFile: 'QMS Intranet Portal',
          copyType: 'CONTROLLED_ELECTRONIC',
          recipientName: 'Head of Quality Assurance',
          status: 'ACKNOWLEDGED',
        },
      ],
      criticalCheckpoints: [
        '100% Ferrous Needle / Metal Detection scan prior to carton packing',
        'Hourly AQL 2.5 random inline stitching audit',
        'Fabric shrinkage testing (10% cotton, 100% spandex)',
      ],
      ppeRequirement: 'Cut-resistant steel mesh gloves, hair nets, safety goggles, anti-static footwear',
      tags: ['QMS', 'SOP', 'ISO 9001:2015'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [newCheckpoint, setNewCheckpoint] = useState('');

  // Add/Remove checkpoint
  const handleAddCheckpoint = () => {
    if (!newCheckpoint.trim()) return;
    setFormData((prev) => ({
      ...prev,
      criticalCheckpoints: [...(prev.criticalCheckpoints || []), newCheckpoint.trim()],
    }));
    setNewCheckpoint('');
  };

  const handleRemoveCheckpoint = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      criticalCheckpoints: (prev.criticalCheckpoints || []).filter((_, i) => i !== index),
    }));
  };

  // Responsibility Handlers
  const handleAddResponsibility = () => {
    const newResp: ProcedureResponsibility = {
      id: `resp-${Date.now()}`,
      role: 'New Role Title',
      responsibility: 'Define operational responsibility...',
      authorityLevel: 'Technical Operational Authority',
    };
    setFormData((prev) => ({
      ...prev,
      responsibilities: [...(prev.responsibilities || []), newResp],
    }));
  };

  const handleUpdateResponsibility = (index: number, field: keyof ProcedureResponsibility, val: string) => {
    setFormData((prev) => {
      const list = [...(prev.responsibilities || [])];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, responsibilities: list };
    });
  };

  const handleRemoveResponsibility = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: (prev.responsibilities || []).filter((_, i) => i !== index),
    }));
  };

  // Department Process Handlers
  const handleAddDepartment = () => {
    const nextCode = `3.${(formData.departmentProcesses?.length || 0) + 1}`;
    const newDept: ProcedureDepartmentProcess = {
      id: `dept-${Date.now()}`,
      departmentName: 'New Manufacturing Department',
      departmentCode: nextCode,
      inChargeRole: 'Section In-Charge',
      steps: [
        {
          id: `step-${Date.now()}`,
          stepNumber: `${nextCode}.1`,
          title: 'Initial Inspection Operation',
          description: 'Step-by-step description of process control operation...',
          inspectionFrequency: '100%',
          acceptanceCriteria: 'Zero defects allowed',
          relatedFormCode: 'DOC-QC-FORM',
          riskLevel: 'MEDIUM',
        },
      ],
    };
    setFormData((prev) => ({
      ...prev,
      departmentProcesses: [...(prev.departmentProcesses || []), newDept],
    }));
  };

  const handleUpdateDepartment = (deptIndex: number, field: keyof ProcedureDepartmentProcess, val: any) => {
    setFormData((prev) => {
      const depts = [...(prev.departmentProcesses || [])];
      depts[deptIndex] = { ...depts[deptIndex], [field]: val };
      return { ...prev, departmentProcesses: depts };
    });
  };

  const handleRemoveDepartment = (deptIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      departmentProcesses: (prev.departmentProcesses || []).filter((_, i) => i !== deptIndex),
    }));
  };

  const handleAddStepToDept = (deptIndex: number) => {
    setFormData((prev) => {
      const depts = [...(prev.departmentProcesses || [])];
      const dept = depts[deptIndex];
      const stepCount = (dept.steps?.length || 0) + 1;
      const stepNumber = `${dept.departmentCode || '3.1'}.${stepCount}`;
      const newStep: ProcedureStepItem = {
        id: `step-${Date.now()}`,
        stepNumber,
        title: `Operation Step ${stepCount}`,
        description: 'Detailed instructions for executing and auditing this step...',
        inspectionFrequency: '10% sample check',
        acceptanceCriteria: 'Compliance with specifications',
        relatedFormCode: 'DOC-QC-FORM',
        riskLevel: 'MEDIUM',
      };
      depts[deptIndex] = {
        ...dept,
        steps: [...(dept.steps || []), newStep],
      };
      return { ...prev, departmentProcesses: depts };
    });
  };

  const handleUpdateStep = (deptIndex: number, stepIndex: number, field: keyof ProcedureStepItem, val: any) => {
    setFormData((prev) => {
      const depts = [...(prev.departmentProcesses || [])];
      const dept = depts[deptIndex];
      const steps = [...dept.steps];
      steps[stepIndex] = { ...steps[stepIndex], [field]: val };
      depts[deptIndex] = { ...dept, steps };
      return { ...prev, departmentProcesses: depts };
    });
  };

  const handleRemoveStep = (deptIndex: number, stepIndex: number) => {
    setFormData((prev) => {
      const depts = [...(prev.departmentProcesses || [])];
      const dept = depts[deptIndex];
      const steps = dept.steps.filter((_, i) => i !== stepIndex);
      depts[deptIndex] = { ...dept, steps };
      return { ...prev, departmentProcesses: depts };
    });
  };

  // Related Documents Handlers - From Document Control Module
  const handleSelectFromDocumentControl = (doc: ControlledDocument) => {
    // Check if already added
    const alreadyExists = (formData.relatedDocuments || []).some(
      (d) => d.documentCode.toLowerCase() === doc.docNumber.toLowerCase()
    );
    if (alreadyExists) {
      showToast(`${doc.docNumber} is already in the related documents list`);
      return;
    }

    const newDoc: ProcedureRelatedDocument = {
      id: `rd-${Date.now()}`,
      documentTitle: doc.title,
      documentCode: doc.docNumber,
      category: doc.department || doc.category || 'Quality',
      frequency: 'Standing SOP',
      retentionPeriod: '3 Years',
      isMandatory: true,
    };

    setFormData((prev) => ({
      ...prev,
      relatedDocuments: [...(prev.relatedDocuments || []), newDoc],
    }));
    showToast(`Added ${doc.docNumber} from Document Control`);
    setIsDocControlModalOpen(false);
  };

  const handleAddManualRelatedDoc = () => {
    const newDoc: ProcedureRelatedDocument = {
      id: `rd-${Date.now()}`,
      documentTitle: 'New Inspection / Audit Report',
      documentCode: `DOC-QC-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Quality Assurance',
      frequency: 'Per Lot',
      retentionPeriod: '3 Years',
      isMandatory: true,
    };
    setFormData((prev) => ({
      ...prev,
      relatedDocuments: [...(prev.relatedDocuments || []), newDoc],
    }));
  };

  const handleUpdateRelatedDoc = (index: number, field: keyof ProcedureRelatedDocument, val: any) => {
    setFormData((prev) => {
      const docs = [...(prev.relatedDocuments || [])];
      docs[index] = { ...docs[index], [field]: val };
      return { ...prev, relatedDocuments: docs };
    });
  };

  const handleRemoveRelatedDoc = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      relatedDocuments: (prev.relatedDocuments || []).filter((_, i) => i !== index),
    }));
  };

  // Distribution Handlers
  const handleAddDistribution = () => {
    const newDist: ProcedureDistributionEntry = {
      id: `dist-${Date.now()}`,
      departmentOrFile: 'Floor Operations Master File',
      copyType: 'CONTROLLED_PHYSICAL',
      recipientName: 'Section In-Charge',
      status: 'ACKNOWLEDGED',
    };
    setFormData((prev) => ({
      ...prev,
      distribution: [...(prev.distribution || []), newDist],
    }));
  };

  const handleUpdateDistribution = (index: number, field: keyof ProcedureDistributionEntry, val: any) => {
    setFormData((prev) => {
      const list = [...(prev.distribution || [])];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, distribution: list };
    });
  };

  const handleRemoveDistribution = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      distribution: (prev.distribution || []).filter((_, i) => i !== index),
    }));
  };

  // Save Validation
  const handleSave = (statusToSet?: ProcedureItem['status']) => {
    if (!formData.title.trim()) {
      showToast('Please provide a Procedure Title');
      setActiveTab('general');
      return;
    }
    if (!formData.procedureCode.trim()) {
      showToast('Please enter a Procedure Code');
      setActiveTab('general');
      return;
    }

    const procedureToSave: ProcedureItem = {
      ...formData,
      status: statusToSet || formData.status || 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };

    onSave(procedureToSave);
  };

  // Filtered controlled docs for modal picker
  const filteredControlledDocs = availableControlledDocs.filter((d) => {
    if (!docControlSearch) return true;
    const q = docControlSearch.toLowerCase();
    return (
      d.docNumber.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      (d.department && d.department.toLowerCase().includes(q))
    );
  });

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
                {isEditing ? `Edit Procedure: ${formData.procedureCode}` : 'Create Standard Operating Procedure'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                {formData.issueNo ? `Issue: ${formData.issueNo}` : formData.revision}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              QMS Conforming Process Control System Architecture
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
            onClick={() => handleSave('DRAFT')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('ACTIVE')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save Changes' : 'Save & Release Procedure'}</span>
          </button>
        </div>
      </div>

      {/* FORM SECTION TABS */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>1. Schedule &amp; Governance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scope_roles')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'scope_roles'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>2. Purpose, Scope &amp; RACI Roles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('processes')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'processes'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>3. Department Process Steps ({formData.departmentProcesses?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('related_docs')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'related_docs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>4. Related Records &amp; Document Control</span>
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
          <FileText className="w-3.5 h-3.5" />
          <span>5. Live Preview</span>
        </button>
      </div>

      {/* TAB 1: GENERAL & GOVERNANCE */}
      {activeTab === 'general' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Document Control Schedule &amp; Information
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">ISO / QMS Reference Form</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Procedure Code */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Procedure Code *</label>
                <input
                  type="text"
                  value={formData.procedureCode}
                  onChange={(e) => setFormData({ ...formData, procedureCode: e.target.value })}
                  placeholder="e.g. PRC-QMS-01"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Document Reference */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Document Reference</label>
                <input
                  type="text"
                  value={formData.documentReference || ''}
                  onChange={(e) => setFormData({ ...formData, documentReference: e.target.value })}
                  placeholder="e.g. SOP/QMS/1163"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Issue No */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Issue No</label>
                <input
                  type="text"
                  value={formData.issueNo || ''}
                  onChange={(e) => setFormData({ ...formData, issueNo: e.target.value })}
                  placeholder="e.g. 05"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Procedure Title (Full Width) */}
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <label className="font-semibold text-slate-700">Procedure Operational Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Standard Procedure for Conforming Process Control"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Company / Facility Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Company / Facility Name</label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter organization or leave blank for default"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Department</label>
                <select
                  value={formData.department || 'QUALITY'}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="QUALITY">QUALITY</option>
                  <option value="PRODUCTION">PRODUCTION</option>
                  <option value="STITCHING">STITCHING</option>
                  <option value="CUTTING">CUTTING</option>
                  <option value="FINISHING">FINISHING</option>
                  <option value="MERCHANDISING">MERCHANDISING</option>
                  <option value="STORE">STORE & WAREHOUSE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              {/* Document Type */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Document Type</label>
                <select
                  value={formData.documentType || 'Standard Operating Procedure (SOP)'}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Standard Operating Procedure (SOP)">Standard Operating Procedure (SOP)</option>
                  <option value="Conforming Process Control">Conforming Process Control</option>
                  <option value="Work Instruction (WI)">Work Instruction (WI)</option>
                  <option value="Quality Operating Procedure (QOP)">Quality Operating Procedure (QOP)</option>
                  <option value="Policy & Compliance Manual">Policy & Compliance Manual</option>
                </select>
              </div>

              {/* Station Allocation */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Floor Workstation Allocation</label>
                <select
                  value={formData.station}
                  onChange={(e) => setFormData({ ...formData, station: e.target.value as ProcedureStation })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="FULL_PROCESS_CHAIN">Full Garment Process Chain</option>
                  <option value="FABRIC_INSPECTION">Fabric Inspection Dock</option>
                  <option value="SPREADING_CUTTING">Spreading & Cutting</option>
                  <option value="FUSING">Fusing Operation</option>
                  <option value="SEWING_ASSEMBLY">Sewing Assembly Line</option>
                  <option value="IRONING_FINISHING">Ironing & Finishing</option>
                  <option value="PACKING_CARTONING">Packing & Cartoning</option>
                  <option value="MERCHANDISING_COMMERCIAL">Marketing & Commercial</option>
                  <option value="QUALITY_ASSURANCE">Quality Assurance & Lab</option>
                </select>
              </div>

              {/* Approval Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Approval Date</label>
                <input
                  type="date"
                  value={formData.approvalDate || ''}
                  onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Next Review Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Next Review Date</label>
                <input
                  type="date"
                  value={formData.nextReviewDate || ''}
                  onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Author / Prepared By */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Author Designation</label>
                <input
                  type="text"
                  value={formData.authorName || ''}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  placeholder="e.g. Management Representative (MR)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Approved By */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Approved By Designation</label>
                <input
                  type="text"
                  value={formData.approvedByName || ''}
                  onChange={(e) => setFormData({ ...formData, approvedByName: e.target.value })}
                  placeholder="e.g. Managing Director (MD)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Controlled Document Switch */}
              <div className="space-y-1 md:col-span-2 lg:col-span-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.controlledDocument !== false}
                    onChange={(e) => setFormData({ ...formData, controlledDocument: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs">
                      Issue as Controlled QMS Document
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Enforces controlled distribution tracking and document governance across factory departments.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PURPOSE, SCOPE & RACI ROLES */}
      {activeTab === 'scope_roles' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 1.0 Purpose & Scope */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1.0 Purpose and Scope
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Clause 1.0</span>
            </div>
            <textarea
              rows={3}
              value={formData.purposeAndScope || ''}
              onChange={(e) => setFormData({ ...formData, purposeAndScope: e.target.value })}
              placeholder="Define operational purpose and manufacturing scope..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PPE & Safety Gate */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Mandatory PPE &amp; Health &amp; Safety Compliance
                </h3>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                HSE Compliance
              </span>
            </div>
            <input
              type="text"
              value={formData.ppeRequirement || ''}
              onChange={(e) => setFormData({ ...formData, ppeRequirement: e.target.value })}
              placeholder="e.g. Cut-resistant steel mesh gloves, hair nets, safety goggles, anti-static footwear"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />

            {/* Critical Checkpoints Builder */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Critical Process Quality Gates
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCheckpoint}
                  onChange={(e) => setNewCheckpoint(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCheckpoint();
                    }
                  }}
                  placeholder="e.g. 100% Needle / Metal Detection scan prior to carton sealing..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddCheckpoint}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
                >
                  Add Gate
                </button>
              </div>

              {formData.criticalCheckpoints && formData.criticalCheckpoints.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {formData.criticalCheckpoints.map((cp, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-slate-800">{cp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCheckpoint(idx)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2.0 Responsibilities and Authorities */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2.0 Responsibilities &amp; Authorities Matrix
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddResponsibility}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
            </div>

            <div className="space-y-3">
              {(formData.responsibilities || []).map((resp, idx) => (
                <div
                  key={resp.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      Role #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveResponsibility(idx)}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Role Title / Designation</label>
                      <input
                        type="text"
                        value={resp.role}
                        onChange={(e) => handleUpdateResponsibility(idx, 'role', e.target.value)}
                        placeholder="e.g. Section Manager"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Authority Scope</label>
                      <input
                        type="text"
                        value={resp.authorityLevel || ''}
                        onChange={(e) => handleUpdateResponsibility(idx, 'authorityLevel', e.target.value)}
                        placeholder="e.g. Executive Operational Authority"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-[11px] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-700">Responsibility Description</label>
                    <textarea
                      rows={2}
                      value={resp.responsibility}
                      onChange={(e) => handleUpdateResponsibility(idx, 'responsibility', e.target.value)}
                      placeholder="Responsible for implementing and maintaining conforming production controls..."
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENT PROCESS STEPS */}
      {activeTab === 'processes' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3.0 Department-wise Process Control Stages
              </h3>
              <p className="text-xs text-slate-500">
                Define the specific sequential control instructions, inspection frequencies, and acceptance standards.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddDepartment}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department Section</span>
            </button>
          </div>

          <div className="space-y-5">
            {(formData.departmentProcesses || []).map((dept, deptIdx) => (
              <div
                key={dept.id || deptIdx}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Department Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={dept.departmentCode || ''}
                      onChange={(e) => handleUpdateDepartment(deptIdx, 'departmentCode', e.target.value)}
                      placeholder="e.g. 3.1"
                      className="w-16 px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-white border border-slate-200 text-blue-700 text-center"
                    />
                    <input
                      type="text"
                      value={dept.departmentName}
                      onChange={(e) => handleUpdateDepartment(deptIdx, 'departmentName', e.target.value)}
                      placeholder="e.g. Cutting Section"
                      className="flex-1 px-3 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={dept.inChargeRole || ''}
                      onChange={(e) => handleUpdateDepartment(deptIdx, 'inChargeRole', e.target.value)}
                      placeholder="In-Charge Role (e.g. Cutting Manager)"
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-slate-200 text-slate-700 max-w-[200px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddStepToDept(deptIdx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Step</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(deptIdx)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Remove Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Steps List */}
                <div className="p-4 space-y-3">
                  {dept.steps.map((st, stepIdx) => (
                    <div
                      key={st.id || stepIdx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={st.stepNumber}
                            onChange={(e) => handleUpdateStep(deptIdx, stepIdx, 'stepNumber', e.target.value)}
                            placeholder="3.1.1"
                            className="w-16 px-2 py-1 text-xs font-mono font-bold rounded-lg bg-white border border-slate-200 text-slate-800 text-center"
                          />
                          <input
                            type="text"
                            value={st.title}
                            onChange={(e) => handleUpdateStep(deptIdx, stepIdx, 'title', e.target.value)}
                            placeholder="Step Operational Title"
                            className="flex-1 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-900"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={st.riskLevel || 'MEDIUM'}
                            onChange={(e) => handleUpdateStep(deptIdx, stepIdx, 'riskLevel', e.target.value)}
                            className="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer"
                          >
                            <option value="LOW">Risk: Low</option>
                            <option value="MEDIUM">Risk: Medium</option>
                            <option value="HIGH">Risk: High</option>
                            <option value="CRITICAL">Risk: Critical</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveStep(deptIdx, stepIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove Step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <textarea
                        rows={2}
                        value={st.description}
                        onChange={(e) => handleUpdateStep(deptIdx, stepIdx, 'description', e.target.value)}
                        placeholder="Detailed operational procedure instruction..."
                        className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />

                      {/* Controls row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Inspection Frequency
                          </label>
                          <input
                            type="text"
                            value={st.inspectionFrequency || ''}
                            onChange={(e) => handleUpdateStep(deptIdx, stepIdx, 'inspectionFrequency', e.target.value)}
                            placeholder="e.g. 100% or AQL 2.5"
                            className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Acceptance Criteria
                          </label>
                          <input
                            type="text"
                            value={st.acceptanceCriteria || ''}
                            onChange={(e) => handleUpdateStep(deptIdx, stepIdx, 'acceptanceCriteria', e.target.value)}
                            placeholder="e.g. Zero critical defects"
                            className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Linked Record / Doc Code
                          </label>
                          <input
                            type="text"
                            value={st.relatedFormCode || ''}
                            onChange={(e) => handleUpdateStep(deptIdx, stepIdx, 'relatedFormCode', e.target.value)}
                            placeholder="e.g. DOC-QM-01"
                            className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-blue-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RELATED QA FORMS & DISTRIBUTION (WITH ERP DOCUMENT CONTROL INTEGRATION) */}
      {activeTab === 'related_docs' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 4.0 Related Documents Register with ERP Document Control Integration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  4.0 Related Documents &amp; Forms Register
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select documents from the ERP Document Control Module or register standard QA forms.
                </p>
              </div>

              {/* Action Buttons: Pick from Document Control vs Add Manual */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocControlModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select from Document Control</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddManualRelatedDoc}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Doc</span>
                </button>
              </div>
            </div>

            {/* Document list */}
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {(formData.relatedDocuments || []).map((doc, idx) => (
                <div key={doc.id || idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={doc.documentCode}
                      onChange={(e) => handleUpdateRelatedDoc(idx, 'documentCode', e.target.value)}
                      placeholder="Doc Number"
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-blue-700"
                    />
                    <input
                      type="text"
                      value={doc.documentTitle}
                      onChange={(e) => handleUpdateRelatedDoc(idx, 'documentTitle', e.target.value)}
                      placeholder="Document / Report Title"
                      className="sm:col-span-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    />
                    <input
                      type="text"
                      value={doc.category || 'Quality'}
                      onChange={(e) => handleUpdateRelatedDoc(idx, 'category', e.target.value)}
                      placeholder="Department / Category"
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRelatedDoc(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 5.0 Distribution List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  5.0 Distribution &amp; Controlled Copy Recipients
                </h3>
                <p className="text-[11px] text-slate-500">
                  Authorized departments and stations holding controlled copies
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDistribution}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Recipient</span>
              </button>
            </div>

            <div className="space-y-2">
              {(formData.distribution || []).map((dist, idx) => (
                <div key={dist.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={dist.departmentOrFile}
                      onChange={(e) => handleUpdateDistribution(idx, 'departmentOrFile', e.target.value)}
                      placeholder="e.g. Central Quality File"
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-900"
                    />
                    <input
                      type="text"
                      value={dist.recipientName || ''}
                      onChange={(e) => handleUpdateDistribution(idx, 'recipientName', e.target.value)}
                      placeholder="Custodian Name / Role"
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700"
                    />
                    <select
                      value={dist.copyType}
                      onChange={(e) => handleUpdateDistribution(idx, 'copyType', e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-[11px]"
                    >
                      <option value="CONTROLLED_PHYSICAL">CONTROLLED PHYSICAL</option>
                      <option value="CONTROLLED_ELECTRONIC">CONTROLLED ELECTRONIC</option>
                      <option value="INFORMATIONAL">INFORMATIONAL</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDistribution(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b pb-4">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {formData.procedureCode}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{formData.title || 'Untitled Procedure'}</h2>
              <p className="text-xs text-slate-500 font-mono">
                {formData.companyName ? `${formData.companyName} • ` : ''}{formData.documentReference} • Issue {formData.issueNo}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold uppercase text-slate-700">1.0 Purpose and Scope</h4>
              <p className="text-slate-800 leading-relaxed">{formData.purposeAndScope}</p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold uppercase text-slate-700">
                3.0 Operational Stages Summary ({formData.departmentProcesses?.length || 0} Departments)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(formData.departmentProcesses || []).map((d) => (
                  <div key={d.departmentName} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">{d.departmentCode} {d.departmentName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{d.steps?.length || 0} operational clauses</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleSave('ACTIVE')}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Confirm &amp; Release Procedure</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT CONTROL SELECTION MODAL */}
      {isDocControlModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDocControlModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Select from ERP Document Control Module
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Choose an approved controlled policy, SOP, or form to link to this procedure.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDocControlModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={docControlSearch}
                onChange={(e) => setDocControlSearch(e.target.value)}
                placeholder="Search by doc number, title, or department..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Document List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {filteredControlledDocs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No matching documents found in Document Control Module.
                </div>
              ) : (
                filteredControlledDocs.map((doc) => {
                  const isAlreadyAdded = (formData.relatedDocuments || []).some(
                    (d) => d.documentCode.toLowerCase() === doc.docNumber.toLowerCase()
                  );
                  return (
                    <div
                      key={doc.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {doc.docNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {doc.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {doc.department} • {doc.category} • {doc.version}
                        </div>
                      </div>

                      {isAlreadyAdded ? (
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Linked</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectFromDocumentControl(doc)}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs shrink-0"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDocControlModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
