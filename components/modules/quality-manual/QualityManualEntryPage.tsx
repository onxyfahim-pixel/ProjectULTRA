'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Award,
  Layers,
  FileText,
  AlertCircle,
  FileCheck,
  Check,
} from 'lucide-react';
import {
  QualityManualSection,
  QualityManualStatus,
  QualityManualComplianceItem,
  QualityManualLinkedDoc,
} from '@/lib/types/modules';

interface QualityManualEntryPageProps {
  initialSection?: QualityManualSection | null;
  onSave: (section: QualityManualSection) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const ISO_CLAUSE_PRESETS = [
  'ISO 9001:2015 Clause 4.1 - 4.4 (Context of Organization)',
  'ISO 9001:2015 Clause 5.1 - 5.3 (Leadership & Policy)',
  'ISO 9001:2015 Clause 6.1 - 6.3 (Planning & Risk Actions)',
  'ISO 9001:2015 Clause 7.1 - 7.5 (Support & Resources)',
  'ISO 9001:2015 Clause 8.1 - 8.7 (Operational Control)',
  'ISO 9001:2015 Clause 9.1 - 9.3 (Performance Evaluation)',
  'ISO 9001:2015 Clause 10.1 - 10.3 (Improvement & CAPA)',
  'ISO 14001:2015 / ZDHC MRSL v3.1 (Chemical & Environmental)',
];

const DEPARTMENTS = [
  'Quality Assurance',
  'Executive Board',
  'Industrial Engineering & QA',
  'Cutting & Spreading Operations',
  'Sewing Production Lines',
  'Central Fabric & Testing Lab',
  'Finishing & Export Packing',
  'Human Resources & Compliance',
  'Maintenance & Utilities',
  'Washing Plant & Environmental Compliance',
];

export function QualityManualEntryPage({
  initialSection,
  onSave,
  onCancel,
  showToast,
}: QualityManualEntryPageProps) {
  const isEditing = Boolean(initialSection);

  const [activeTab, setActiveTab] = useState<'profile' | 'commitments_compliance' | 'governance_preview'>('profile');

  // Form State
  const [formData, setFormData] = useState<QualityManualSection>(() => {
    if (initialSection) {
      return JSON.parse(JSON.stringify(initialSection));
    }
    return {
      id: `qm-${Date.now()}`,
      chapterNumber: 'QM-09',
      title: '',
      clauseReference: ISO_CLAUSE_PRESETS[4],
      summary: '',
      responsibleDepartment: 'Quality Assurance',
      status: 'ACTIVE',
      version: 'Rev 1.0',
      effectiveDate: new Date().toISOString().split('T')[0],
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      approvedBy: 'Managing Director & CEO',
      author: 'QA Director',
      reviewedBy: 'General Manager Operations',
      scope: 'Applies to factory cutting, sewing, finishing lines, and certified quality controllers.',
      isoStandard: 'ISO 9001:2015',
      confidentiality: 'GENERAL_FACILITY',
      policyCommitments: [
        'Mandatory compliance with buyer approved technical packs and AQL 1.5 standard specifications.',
        'Continuous calibration of measurement instruments and inspection lighting boxes.',
      ],
      complianceRequirements: [
        {
          id: `comp-${Date.now()}-1`,
          requirement: 'Operational adherence audited during shift quality inspections',
          verificationMethod: 'Floor Quality Log & Inspection Checklist',
          frequency: 'Daily',
          status: 'COMPLIANT',
        },
      ],
      linkedDocuments: [
        { docNumber: 'DOC-QMS-001', title: 'Quality Management System Policy Manual', docType: 'POLICY' },
      ],
      revisionHistory: [
        {
          revision: 'Rev 1.0',
          changeDate: new Date().toISOString().split('T')[0],
          changedBy: 'QA Director',
          description: 'Initial release and authorization.',
        },
      ],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
  });

  // New item inputs
  const [newCommitment, setNewCommitment] = useState('');
  const [newReqText, setNewReqText] = useState('');
  const [newReqMethod, setNewReqMethod] = useState('');
  const [newReqFreq, setNewReqFreq] = useState('Monthly');

  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<QualityManualLinkedDoc['docType']>('SOP');

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.chapterNumber.trim()) errs.chapterNumber = 'Chapter number is required (e.g. QM-01)';
    if (!formData.title.trim()) errs.title = 'Chapter title is required';
    if (!formData.clauseReference.trim()) errs.clauseReference = 'ISO clause reference is required';
    if (!formData.summary.trim()) errs.summary = 'Executive summary is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (statusOverride?: QualityManualStatus) => {
    if (!validateForm()) {
      showToast('Please fix required fields before saving');
      setActiveTab('profile');
      return;
    }

    const toSave: QualityManualSection = {
      ...formData,
      status: statusOverride || formData.status || 'ACTIVE',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(toSave);
  };

  // Add commitment
  const handleAddCommitment = () => {
    if (!newCommitment.trim()) return;
    setFormData((prev) => ({
      ...prev,
      policyCommitments: [...(prev.policyCommitments || []), newCommitment.trim()],
    }));
    setNewCommitment('');
  };

  const handleRemoveCommitment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      policyCommitments: (prev.policyCommitments || []).filter((_, i) => i !== index),
    }));
  };

  // Add compliance item
  const handleAddComplianceItem = () => {
    if (!newReqText.trim()) return;
    const newItem: QualityManualComplianceItem = {
      id: `comp-${Date.now()}`,
      requirement: newReqText.trim(),
      verificationMethod: newReqMethod.trim() || 'Floor inspection and log review',
      frequency: newReqFreq,
      status: 'COMPLIANT',
    };
    setFormData((prev) => ({
      ...prev,
      complianceRequirements: [...(prev.complianceRequirements || []), newItem],
    }));
    setNewReqText('');
    setNewReqMethod('');
    setNewReqFreq('Monthly');
  };

  const handleRemoveComplianceItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      complianceRequirements: (prev.complianceRequirements || []).filter((r) => r.id !== id),
    }));
  };

  // Add linked doc
  const handleAddLinkedDoc = () => {
    if (!newDocNumber.trim() || !newDocTitle.trim()) return;
    const newDoc: QualityManualLinkedDoc = {
      docNumber: newDocNumber.trim().toUpperCase(),
      title: newDocTitle.trim(),
      docType: newDocType,
    };
    setFormData((prev) => ({
      ...prev,
      linkedDocuments: [...(prev.linkedDocuments || []), newDoc],
    }));
    setNewDocNumber('');
    setNewDocTitle('');
  };

  const handleRemoveLinkedDoc = (docNumber: string) => {
    setFormData((prev) => ({
      ...prev,
      linkedDocuments: (prev.linkedDocuments || []).filter((d) => d.docNumber !== docNumber),
    }));
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
              {isEditing ? 'Editing Master Chapter' : 'New Quality Manual Entry'}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {formData.title ? formData.title : 'Configure ISO 9001 Quality Chapter'}
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
            onClick={() => handleSave('DRAFT')}
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
            <span>{isEditing ? 'Save Changes' : 'Publish Chapter'}</span>
          </button>
        </div>
      </div>

      {/* STEP TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          1. Chapter Profile &amp; ISO Clause
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commitments_compliance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'commitments_compliance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          2. Policy Commitments &amp; Compliance Matrix
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('governance_preview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'governance_preview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          3. Governance, Linkages &amp; Preview
        </button>
      </div>

      {/* TAB 1: CHAPTER PROFILE & ISO CLAUSE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Chapter Identification &amp; ISO 9001 Alignment
            </h2>
            <p className="text-xs text-slate-500">
              Core standard clause classification, numbering, and executive ownership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chapter Number / Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.chapterNumber}
                onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
                placeholder="e.g. QM-01 or Chapter 05"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.chapterNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold`}
              />
              {errors.chapterNumber && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.chapterNumber}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chapter Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Leadership Commitment, Quality Policy & Line-Stop Authority"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium`}
              />
              {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ISO 9001 Clause Reference <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.clauseReference}
                onChange={(e) => setFormData({ ...formData, clauseReference: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-semibold text-slate-800"
              >
                {ISO_CLAUSE_PRESETS.map((clause) => (
                  <option key={clause} value={clause}>
                    {clause}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custodian Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.responsibleDepartment}
                onChange={(e) => setFormData({ ...formData, responsibleDepartment: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Version</label>
              <input
                type="text"
                value={formData.version || 'Rev 1.0'}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date</label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Next Review Due</label>
              <input
                type="date"
                value={formData.nextReviewDate}
                onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Executive Chapter Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="High-level narrative outlining the purpose, scope, and operational expectations of this chapter..."
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.summary ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
              />
              {errors.summary && <p className="text-[11px] text-rose-500 mt-1">{errors.summary}</p>}
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operational Scope &amp; Applicable Units
              </label>
              <input
                type="text"
                value={formData.scope || ''}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="e.g. Applies to Fabric Warehouse, Cutting Units 1-4, Sewing Lines A-D, and Central Lab"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab('commitments_compliance')}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Next: Commitments &amp; Compliance &rarr;
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: POLICY COMMITMENTS & COMPLIANCE MATRIX */}
      {activeTab === 'commitments_compliance' && (
        <div className="space-y-6">
          {/* Commitments Builder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Executive Quality Policy Commitments
              </h2>
              <p className="text-xs text-slate-500">
                Define the mandatory quality rules and operational principles that must be enforced under this chapter.
              </p>
            </div>

            {/* Input to add commitment */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCommitment}
                onChange={(e) => setNewCommitment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCommitment();
                  }
                }}
                placeholder="Enter mandatory policy commitment (e.g. 100% of fabric rolls inspected under 4-point system)..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCommitment}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>

            {/* List of commitments */}
            <div className="space-y-2">
              {(formData.policyCommitments || []).map((commitment, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-200 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-3">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className="text-slate-800 font-medium leading-relaxed">{commitment}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCommitment(idx)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Matrix Builder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                ISO 9001 Compliance Audit Checkpoints
              </h2>
              <p className="text-xs text-slate-500">
                Define the specific audit checkpoints, evidence verification methods, and audit frequencies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                value={newReqText}
                onChange={(e) => setNewReqText(e.target.value)}
                placeholder="Audit requirement statement..."
                className="md:col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
              <input
                type="text"
                value={newReqMethod}
                onChange={(e) => setNewReqMethod(e.target.value)}
                placeholder="Evidence / Verification method..."
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
              <div className="flex gap-2">
                <select
                  value={newReqFreq}
                  onChange={(e) => setNewReqFreq(e.target.value)}
                  className="px-2 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 flex-1"
                >
                  <option value="Daily">Daily</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annual">Semi-Annual</option>
                  <option value="Annual">Annual</option>
                  <option value="Per Lot">Per Lot</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddComplianceItem}
                  className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Compliance Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Audit Requirement</th>
                    <th className="py-2.5 px-3">Evidence Verification</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(formData.complianceRequirements || []).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{req.requirement}</td>
                      <td className="py-2.5 px-3 text-slate-600">{req.verificationMethod}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{req.frequency}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveComplianceItem(req.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                &larr; Back to Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('governance_preview')}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Next: Governance &amp; Preview &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOVERNANCE, LINKAGES & PREVIEW */}
      {activeTab === 'governance_preview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Document References &amp; Sign-Off Authority
              </h2>
              <p className="text-xs text-slate-500">
                Link to existing ERP Document Control records and assign signatory responsibilities.
              </p>
            </div>

            {/* Linked Documents Builder */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                Link Associated SOP / Procedure:
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newDocNumber}
                  onChange={(e) => setNewDocNumber(e.target.value)}
                  placeholder="Doc # (e.g. SOP-QMS-02)"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono w-full sm:w-44"
                />
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Document Title (e.g. Internal Quality Audit SOP)"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white flex-1"
                />
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as any)}
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                >
                  <option value="SOP">SOP</option>
                  <option value="PROCEDURE">PROCEDURE</option>
                  <option value="POLICY">POLICY</option>
                  <option value="FORM">FORM</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddLinkedDoc}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Link Doc
                </button>
              </div>

              {/* Linked docs chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(formData.linkedDocuments || []).map((doc) => (
                  <div
                    key={doc.docNumber}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                  >
                    <span className="font-mono font-bold text-blue-700">{doc.docNumber}</span>
                    <span className="text-slate-700">{doc.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLinkedDoc(doc.docNumber)}
                      className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer ml-1"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Signatories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Author / Prepared By</label>
                <input
                  type="text"
                  value={formData.author || ''}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Tanzim Ahmed (QA Director)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reviewed By</label>
                <input
                  type="text"
                  value={formData.reviewedBy || ''}
                  onChange={(e) => setFormData({ ...formData, reviewedBy: e.target.value })}
                  placeholder="e.g. Mahmudul Hasan (GM Operations)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Approved By (Executive Sign-Off)</label>
                <input
                  type="text"
                  value={formData.approvedBy || ''}
                  onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                  placeholder="e.g. Managing Director & CEO"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Chapter Preview
              </span>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {formData.chapterNumber} • {formData.version || 'Rev 1.0'}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{formData.title || 'Untitled Chapter'}</h3>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {formData.clauseReference} • {formData.responsibleDepartment}
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {formData.summary || 'No summary text provided yet.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('commitments_compliance')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                &larr; Back to Commitments
              </button>

              <button
                type="button"
                onClick={() => handleSave('ACTIVE')}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save & Update Chapter' : 'Publish Quality Chapter'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
