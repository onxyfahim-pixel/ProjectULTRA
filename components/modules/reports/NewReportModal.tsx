'use client';

import React, { useState } from 'react';
import { X, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  ReportRecord,
  ReportCategory,
  ReportFormat,
  REPORT_CATEGORY_CONFIG,
} from './reports-data';

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: ReportRecord) => void;
}

export function NewReportModal({ isOpen, onClose, onSave }: NewReportModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReportCategory>('QUALITY_SUMMARY');
  const [department, setDepartment] = useState('Quality Assurance & Technical');
  const [period, setPeriod] = useState('September 2026');
  const [format, setFormat] = useState<ReportFormat>('INTERACTIVE');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('Quality Admin');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a report title.');
      return;
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newReport: ReportRecord = {
      id: `RPT-2026-${randomSuffix}`,
      title: title.trim(),
      category,
      period: period.trim() || 'Current Period',
      department: department.trim() || 'Quality Operations',
      generatedDate: new Date().toISOString().split('T')[0],
      generatedBy: author.trim() || 'Quality Specialist',
      status: 'APPROVED',
      format,
      fileSize: '3.2 MB',
      summary:
        summary.trim() ||
        `Comprehensive performance evaluation for ${title.trim()} conducted in ${department} for ${period}. All audited parameters comply with ISO 9001 and buyer AQL benchmarks.`,
      highlights: [
        'Data consolidated from live line-wise QC checkpoint terminals.',
        'Zero critical non-conformances registered during the reporting window.',
        'Target operational efficiency and DHU goals achieved within tolerance.',
      ],
      kpis: [
        { label: 'Overall Pass Rate', value: '97.5%', change: '+1.2%', isPositive: true },
        { label: 'Defect DHU', value: '1.74', change: '-0.18', isPositive: true },
        { label: 'First Time Right', value: '95.0%', change: '+2.0%', isPositive: true },
        { label: 'SLA Adherence', value: '99.1%', change: '+0.5%', isPositive: true },
      ],
      metricsTable: [
        { metric: 'In-Line Inspection Acceptance', target: '> 95.0%', actual: '97.8%', variance: '+2.8%', status: 'PASS' },
        { metric: 'Process Cycle Time SLA', target: '< 4.0 hrs', actual: '3.4 hrs', variance: '-0.6 hrs', status: 'PASS' },
        { metric: 'Material Reconciliation Yield', target: '> 98.0%', actual: '98.6%', variance: '+0.6%', status: 'PASS' },
        { metric: 'Audit Verification Sign-Off', target: '100%', actual: '100%', variance: '0.0%', status: 'PASS' },
      ],
      recommendations: [
        'Maintain daily supervisor reviews on high-speed sewing stations.',
        'Cross-train secondary QA inspectors to sustain high First Time Right levels.',
      ],
      signOff: {
        preparedBy: author.trim() || 'QA Inspector',
        reviewedBy: 'Tariqul Alam (Technical QA Manager)',
        approvedBy: 'Fahim Rahman (VP of Quality)',
        date: new Date().toISOString().split('T')[0],
      },
    };

    onSave(newReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Generate New Analytical Report</h2>
              <p className="text-xs text-slate-500">Compile quality intelligence & export summaries</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Report Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Line 04 Activewear Quality & DHU Variance Analysis"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Report Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {Object.entries(REPORT_CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Period
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g. September 2026 or Q3 2026"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department / Section
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Sewing Quality Division"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ReportFormat)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="INTERACTIVE">Interactive Dashboard</option>
                <option value="PDF">PDF Report Document</option>
                <option value="EXCEL">Excel Data Workbook</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Executive Findings & Scope
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of findings, sample sizes, and inspection scope..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
