'use client';

import React from 'react';
import {
  X,
  Compass,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Layers,
  Activity,
  CheckCircle,
  FlaskConical,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export function DemoTourModal({ isOpen, onClose, onNavigateTab }: DemoTourModalProps) {
  if (!isOpen) return null;

  const tourSteps = [
    {
      tabId: 'buyer_order',
      title: '1. Merchandising & Buyer POs',
      badge: 'Order Tracking',
      icon: ShoppingBag,
      color: 'from-blue-600 to-indigo-600',
      description:
        'Manage end-to-end buyer orders for global brands (Nike, H&M, Zara, PVH). Track tech-packs, Bill of Materials (BOM), style-wise order quantities, color breakdowns, and critical path milestones.',
      actionText: 'View Buyer Orders',
    },
    {
      tabId: 'incoming_qc',
      title: '2. Raw Fabric & 4-Point ASTM D5430',
      badge: 'Warehouse QC',
      icon: Layers,
      color: 'from-emerald-600 to-teal-600',
      description:
        'Digital fabric inspection using the global ASTM D5430 4-Point System. Inspect roll-by-roll defect points per 100 sq. yards, verify GSM, shrinkage, width variations, and assign automatic Pass/Fail penalty grades.',
      actionText: 'Open Incoming QC',
    },
    {
      tabId: 'production',
      title: '3. Production Floor & Hourly Lines',
      badge: 'Floor Output',
      icon: Activity,
      color: 'from-amber-600 to-orange-600',
      description:
        'Real-time floor tracking across Spreading, Cutting, Sewing, and Finishing. Track hourly line outputs, defect logging, line balancing, SMV targets, and Defect per Hundred Units (DHU%).',
      actionText: 'View Production Floor',
    },
    {
      tabId: 'inspections',
      title: '4. In-line, Pre-Final & Final AQL Audits',
      badge: 'AQL 2.5 / 1.5',
      icon: CheckCircle,
      color: 'from-purple-600 to-indigo-600',
      description:
        'ISO 2859-1 / ANSI/ASQ Z1.4 digital AQL audit sheets. Record critical, major, and minor defects with automated sample size calculation, digital signature approvals, and downloadable PDF reports.',
      actionText: 'Open AQL Inspections',
    },
    {
      tabId: 'testing',
      title: '5. Lab Testing & ISO 9001 Compliance',
      badge: 'Lab & Wash',
      icon: FlaskConical,
      color: 'from-rose-600 to-pink-600',
      description:
        'Comprehensive physical and chemical laboratory testing: tensile strength, seam slippage, crocking / rub fastness, wash colorfastness, fiber composition, and CAPA 8D corrective actions.',
      actionText: 'View Lab Testing',
    },
    {
      tabId: 'dashboard',
      title: '6. Executive Command Center & Analytics',
      badge: 'Real-Time KPI',
      icon: BarChart3,
      color: 'from-cyan-600 to-blue-600',
      description:
        'High-level plant command center featuring live DHU gauges, Defect Pareto charts, Top defect breakdown, active audit logs, and instant multi-plant telemetry.',
      actionText: 'Go to Command Center',
    },
  ];

  const handleStepClick = (tabId: string) => {
    onNavigateTab(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Interactive Factory Workflow Tour
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  6 Key Modules
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Click any workflow below to instantly navigate to that production module
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid of Steps */}
        <div className="p-4 sm:p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {tourSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.tabId}
                onClick={() => handleStepClick(step.tabId)}
                className="group relative p-4 sm:p-5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-blue-500/60 transition-all cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${step.color} text-white flex items-center justify-center shadow-md`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                        {step.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300">
                      {step.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mt-2">{step.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                  <span>{step.actionText}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
