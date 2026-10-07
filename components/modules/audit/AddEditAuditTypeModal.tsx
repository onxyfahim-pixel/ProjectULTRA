'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Users,
  Sparkles,
  Building2,
  Layers,
  Award,
  HelpCircle,
  Percent,
  Sliders,
  Check,
  Flame,
} from 'lucide-react';
import { AuditTypeDefinition, AuditCategory } from '@/lib/types/modules';

interface AddEditAuditTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (auditType: AuditTypeDefinition, templateSource?: string) => void;
  auditTypeToEdit?: AuditTypeDefinition | null;
  existingTypes: AuditTypeDefinition[];
}

export function AddEditAuditTypeModal({
  isOpen,
  onClose,
  onSave,
  auditTypeToEdit,
  existingTypes,
}: AddEditAuditTypeModalProps) {
  const isEditing = Boolean(auditTypeToEdit);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AuditCategory>('SAFETY');
  const [standard, setStandard] = useState('');
  const [description, setDescription] = useState('');
  const [defaultAuditorOrg, setDefaultAuditorOrg] = useState('');
  const [defaultDepartment, setDefaultDepartment] = useState('');
  const [passMarksThreshold, setPassMarksThreshold] = useState<number>(80);
  const [criticalNcFailsAudit, setCriticalNcFailsAudit] = useState<boolean>(true);
  const [badgeColor, setBadgeColor] = useState<string>('amber');
  const [templateSource, setTemplateSource] = useState<string>('none');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auditTypeToEdit) {
      setCode(auditTypeToEdit.code);
      setName(auditTypeToEdit.name);
      setCategory(auditTypeToEdit.category || 'CUSTOM');
      setStandard(auditTypeToEdit.standard);
      setDescription(auditTypeToEdit.description);
      setDefaultAuditorOrg(auditTypeToEdit.defaultAuditorOrg || '');
      setDefaultDepartment(auditTypeToEdit.defaultDepartment || '');
      setPassMarksThreshold(auditTypeToEdit.passMarksThreshold || 80);
      setCriticalNcFailsAudit(auditTypeToEdit.criticalNcFailsAudit !== false);
      setBadgeColor(auditTypeToEdit.badgeColor || 'blue');
      setTemplateSource('none');
    } else {
      setCode('SAF-01');
      setName('Safety & Fire Hazard Inspection');
      setCategory('SAFETY');
      setStandard('ISO 45001 / National Fire Safety Code');
      setDescription(
        'Periodic assessment of factory floor fire exits, firefighting readiness, machine guarding, and personal safety gear.'
      );
      setDefaultAuditorOrg('EHS & Safety Inspection Division');
      setDefaultDepartment('Cutting, Sewing & Maintenance');
      setPassMarksThreshold(85);
      setCriticalNcFailsAudit(true);
      setBadgeColor('amber');
      setTemplateSource('none');
    }
    setError(null);
  }, [auditTypeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an Audit Type Name.');
      return;
    }
    if (!code.trim()) {
      setError('Please specify an Audit Code (e.g. SAF-EHS).');
      return;
    }
    if (!standard.trim()) {
      setError('Please provide the governing standard or regulation.');
      return;
    }

    const newTypeDef: AuditTypeDefinition = {
      id: auditTypeToEdit?.id || `type-custom-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      standard: standard.trim(),
      description: description.trim(),
      defaultAuditorOrg: defaultAuditorOrg.trim() || undefined,
      defaultDepartment: defaultDepartment.trim() || undefined,
      passMarksThreshold: Number(passMarksThreshold) || 80,
      criticalNcFailsAudit,
      badgeColor,
      totalAvailableMarks: auditTypeToEdit?.totalAvailableMarks || 100,
      scoringScheme: auditTypeToEdit?.scoringScheme || {
        conformityRate: 1.0,
        minorNcRate: 0.75,
        majorNcRate: 0.5,
        criticalNcRate: 0.0,
      },
      isSystemDefault: auditTypeToEdit?.isSystemDefault || false,
      createdAt: auditTypeToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newTypeDef, isEditing ? undefined : templateSource);
    onClose();
  };

  const colorOptions = [
    { label: 'Amber / Safety', value: 'amber', bg: 'bg-amber-500' },
    { label: 'Blue / Quality', value: 'blue', bg: 'bg-blue-600' },
    { label: 'Emerald / 5S', value: 'emerald', bg: 'bg-emerald-600' },
    { label: 'Purple / Compliance', value: 'purple', bg: 'bg-purple-600' },
    { label: 'Indigo / Vendor', value: 'indigo', bg: 'bg-indigo-600' },
    { label: 'Rose / Critical', value: 'rose', bg: 'bg-rose-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              {category === 'SAFETY' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : category === 'COMPLIANCE' ? (
                <Users className="w-5 h-5 text-purple-600" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Edit Audit Type & Standard' : 'Create New Audit Type'}
              </h3>
              <p className="text-xs text-slate-500">
                Define the audit category, standard criteria, and passing benchmark.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Code & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Audit Type Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAF-EHS, ISO-9001, 5S-LEAN"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Short reference prefix for audit reports.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Audit Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as AuditCategory;
                  setCategory(val);
                  if (val === 'SAFETY') setBadgeColor('amber');
                  else if (val === 'COMPLIANCE') setBadgeColor('purple');
                  else if (val === 'SUB_SUPPLIER') setBadgeColor('indigo');
                  else if (val === 'INTERNAL') setBadgeColor('blue');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer bg-white"
              >
                <option value="SAFETY">Safety, Fire & EHS</option>
                <option value="INTERNAL">Internal QMS / Quality</option>
                <option value="COMPLIANCE">Social Compliance & Labor</option>
                <option value="SUB_SUPPLIER">Sub-Supplier & Vendor</option>
                <option value="EXTERNAL">Buyer / External Body</option>
                <option value="CUSTOM">Custom Technical Audit</option>
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Audit Type Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Safety, Health & Environment (EHS) Audit"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          {/* Standard & Framework */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Governing Standard / Audit Framework <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              placeholder="e.g. ISO 45001:2018 / OSHA / Factory Safety Code"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Description & Scope</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe scope, covered sections, equipment inspections..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Department & Auditor Org */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Default Auditor Organization
              </label>
              <input
                type="text"
                value={defaultAuditorOrg}
                onChange={(e) => setDefaultAuditorOrg(e.target.value)}
                placeholder="e.g. EHS & Occupational Safety Dept."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Default Target Department(s)
              </label>
              <input
                type="text"
                value={defaultDepartment}
                onChange={(e) => setDefaultDepartment(e.target.value)}
                placeholder="e.g. Factory Wide Operations"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Marking & Passing Threshold Options */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Marking System & Evaluation Benchmarks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Pass Threshold Percentage (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={passMarksThreshold}
                    onChange={(e) => setPassMarksThreshold(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-white"
                  />
                  <span className="text-[11px] text-slate-500 font-mono">
                    (Standard is 80% or 85%)
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Color Tag Indicator
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setBadgeColor(c.value)}
                      className={`w-6 h-6 rounded-full ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                        badgeColor === c.value
                          ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {badgeColor === c.value && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Critical NC Immediate Failure Switch */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Critical NC Immediate Failure Rule</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  If even 1 Critical Non-Conformance is discovered, the entire audit fails immediately
                  regardless of score.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalNcFailsAudit}
                  onChange={(e) => setCriticalNcFailsAudit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>
          </div>

          {/* Starter Template (Only when creating new) */}
          {!isEditing && (
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
              <label className="font-bold text-blue-900 text-xs block">
                Initial Questions Starter Template
              </label>
              <select
                value={templateSource}
                onChange={(e) => setTemplateSource(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-blue-300 text-xs text-slate-800 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="none">Start with an empty questionnaire</option>
                <option value="type-safety-ehs">
                  Clone from Safety & EHS Question Bank (Fire, Machine Guards, PPE, Chemicals)
                </option>
                <option value="type-5s-lean">
                  Clone from 5S Lean Workplace Bank (Sort, Set in order, Shine, Sustain)
                </option>
                <option value="type-social-compliance">
                  Clone from Social Compliance & Labor Bank (Hours, Wages, Grievance)
                </option>
                <option value="type-iso-9001">
                  Clone from ISO 9001:2015 Core QMS Clauses (Clause 4-10)
                </option>
              </select>
              <p className="text-[10px] text-blue-700">
                You can always add, edit, import, or delete questions later from the Management tab.
              </p>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs hover:shadow cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Changes' : 'Create Audit Type'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
