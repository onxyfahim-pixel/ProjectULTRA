'use client';

import React from 'react';
import { X, Network, Eye, FileDown, Maximize2, ShieldCheck } from 'lucide-react';
import { ProcessFlowChart, ProcessFlowStep } from '@/lib/types/modules';
import { ProcessFlowVisualTree } from './ProcessFlowVisualTree';

interface ProcessFlowVisualTreeModalProps {
  isOpen: boolean;
  flow: ProcessFlowChart | null;
  onClose: () => void;
  onOpenDetails?: (flow: ProcessFlowChart) => void;
  onExport?: (flow: ProcessFlowChart) => void;
}

export function ProcessFlowVisualTreeModal({
  isOpen,
  flow,
  onClose,
  onOpenDetails,
  onExport,
}: ProcessFlowVisualTreeModalProps) {
  if (!isOpen || !flow) return null;

  const isSewing = flow.flowCode.includes('SEW') || flow.title.toLowerCase().includes('sewing');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-6xl max-h-[92vh] bg-slate-900 text-slate-100 rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/60">
                  {flow.flowCode}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {flow.version || 'Rev 1.0'}
                </span>
                {isSewing && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider font-mono">
                    ★ Reference Image Match
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {flow.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExport && (
              <button
                type="button"
                onClick={() => onExport(flow)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Export PDF Dossier"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export PDF</span>
              </button>
            )}

            {onOpenDetails && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDetails(flow);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md cursor-pointer"
                title="Open Full Flowchart Details Page"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Full Details Page</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close Visual Tree Modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Visual Tree Component */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50">
          <ProcessFlowVisualTree flow={flow} />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ISO 9001:2015 Clause 8.1 Quality Operations Standard</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
