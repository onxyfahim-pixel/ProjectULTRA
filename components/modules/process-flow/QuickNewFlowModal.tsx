'use client';

import React, { useState } from 'react';
import { X, Plus, Sparkles, Network } from 'lucide-react';
import { ProcessFlowChart, ProcessFlowStep } from '@/lib/types/modules';
import { INITIAL_PROCESS_FLOW_CHARTS } from './process-flow-data';

interface QuickNewFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (flow: ProcessFlowChart) => void;
}

export function QuickNewFlowModal({
  isOpen,
  onClose,
  onCreate,
}: QuickNewFlowModalProps) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Sewing Production');
  const [productCategory, setProductCategory] = useState('Knitwear & T-Shirts');
  const [templateIndex, setTemplateIndex] = useState<number>(0);

  if (!isOpen) return null;

  const templates = [
    {
      name: '🧵 Sewing Section Quality Flow (Exact Image Match)',
      codePrefix: 'PFC-SEW',
      desc: '18 stages with Pre-Production Meeting, Trim Card, SPI, Critical Process, Traffic Light, and Pass/Fail decision loops.',
      steps: INITIAL_PROCESS_FLOW_CHARTS[0]?.steps || [],
      department: 'Sewing Production & Quality Assurance',
      category: 'Knit & Woven Sewing Assembly',
      hours: 57,
    },
    {
      name: '👕 Master Garment Manufacturing Flow',
      codePrefix: 'PFC-GAR',
      desc: 'End-to-end full factory pipeline from Yarn Inward to Export Packing.',
      steps: INITIAL_PROCESS_FLOW_CHARTS[1]?.steps || [],
      department: 'Garment Manufacturing Operations',
      category: 'Knitwear & T-Shirts',
      hours: 218,
    },
    {
      name: '✂️ Spreading & CAD Automatic Cutting Room Flow',
      codePrefix: 'PFC-CUT',
      desc: 'Fabric relaxation, tensionless spreading, CNC cutting, bundle ticketing, and fusing.',
      steps: INITIAL_PROCESS_FLOW_CHARTS[2]?.steps || [],
      department: 'CAD, Spreading & Cutting Department',
      category: 'Knitwear & Woven Apparel',
      hours: 46,
    },
    {
      name: '👖 Woven Denim Wet & Dry Processing Flow',
      codePrefix: 'PFC-DNM',
      desc: 'Hand scraping, whiskers, PP spray, enzyme wash, resin curing oven, and tinting.',
      steps: INITIAL_PROCESS_FLOW_CHARTS[3]?.steps || [],
      department: 'Denim Laundry & Wet Processing',
      category: 'Woven Denim Jeans & Jackets',
      hours: 48,
    },
    {
      name: '📦 Finishing, 100% Needle Detection & Packing Flow',
      codePrefix: 'PFC-FIN',
      desc: 'Thread trimming, steam pressing, 9-point visual scan, 2-head metal detection, and export packing.',
      steps: INITIAL_PROCESS_FLOW_CHARTS[4]?.steps || [],
      department: 'Finishing, QC & Packing Facility',
      category: 'Export Apparel Packing',
      hours: 26,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selTemplate = templates[templateIndex] || templates[0];
    const flowTitle = title.trim() || selTemplate.name.replace(/^[^\w]+/, '').trim();
    const randomNum = Math.floor(10 + Math.random() * 90);
    const flowCode = `${selTemplate.codePrefix}-${randomNum}`;

    const newFlow: ProcessFlowChart = {
      id: `pfc-${Date.now()}`,
      flowCode,
      title: flowTitle,
      productCategory: productCategory || selTemplate.category,
      department: department || selTemplate.department,
      version: 'Rev 1.0',
      status: 'ACTIVE',
      author: 'Industrial Engineering (IE) Team',
      approvedBy: 'Head of Quality Assurance',
      effectiveDate: new Date().toISOString().split('T')[0],
      description: selTemplate.desc,
      steps: (selTemplate.steps || []).map((st: ProcessFlowStep, idx: number) => ({
        ...st,
        id: `pfs-${Date.now()}-${idx + 1}`,
        stepNumber: idx + 1,
      })),
      totalLeadTimeHours: selTemplate.hours,
      criticalGatesCount: (selTemplate.steps || []).filter((s: ProcessFlowStep) => s.criticalGate).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreate(newFlow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Create New Process Flowchart
              </h3>
              <p className="text-xs text-slate-500">
                Instantly generates a visual flowchart tree on a clean white canvas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Template Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              1. Choose Flowchart Architecture Template
            </label>
            <div className="space-y-2">
              {templates.map((tpl, idx) => {
                const isSelected = templateIndex === idx;
                return (
                  <div
                    key={tpl.name}
                    onClick={() => {
                      setTemplateIndex(idx);
                      if (!title) {
                        setDepartment(tpl.department);
                        setProductCategory(tpl.category);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      checked={isSelected}
                      onChange={() => setTemplateIndex(idx)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {tpl.name}
                        </span>
                        <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                          {tpl.steps.length} Stages
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {tpl.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flowchart Name */}
          <div className="space-y-1 pt-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              2. Flowchart Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. ${templates[templateIndex].name.replace(/^[^\w]+/, '').trim()}`}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">
                Product Category
              </label>
              <input
                type="text"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create &amp; Open Visual Tree</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
