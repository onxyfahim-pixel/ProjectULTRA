'use client';

import React, { useState } from 'react';
import { X, Factory, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ProductionOrder } from '@/lib/types/erp';

interface LogOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ProductionOrder[];
  onSave: (entry: OutputLogEntry) => void;
}

export interface OutputLogEntry {
  id: string;
  productionOrderId: string;
  orderNumber: string;
  lineId: string;
  styleName: string;
  buyer: string;
  date: string;
  shift: 'A' | 'B' | 'C';
  hour?: string;
  plannedOutput: number;
  actualOutput: number;
  rejectedPcs: number;
  reworkPcs: number;
  dhuPercent: number;
  efficiencyPercent: number;
  operatorCount: number;
  remarks: string;
  loggedBy: string;
  loggedAt: string;
}

export function LogOutputModal({ isOpen, onClose, orders, onSave }: LogOutputModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [shift, setShift] = useState<'A' | 'B' | 'C'>('A');
  const [hour, setHour] = useState('');
  const [plannedOutput, setPlannedOutput] = useState('');
  const [actualOutput, setActualOutput] = useState('');
  const [rejectedPcs, setRejectedPcs] = useState('0');
  const [reworkPcs, setReworkPcs] = useState('0');
  const [operatorCount, setOperatorCount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const calcEfficiency = () => {
    const planned = parseFloat(plannedOutput) || 0;
    const actual = parseFloat(actualOutput) || 0;
    if (planned === 0) return 0;
    return Math.round((actual / planned) * 100);
  };

  const calcDHU = () => {
    const actual = parseFloat(actualOutput) || 0;
    const rejected = parseFloat(rejectedPcs) || 0;
    const rework = parseFloat(reworkPcs) || 0;
    if (actual === 0) return 0;
    return (((rejected + rework) / actual) * 100).toFixed(2);
  };

  const handleSave = () => {
    if (!selectedOrderId) { setError('Please select a production order.'); return; }
    if (!plannedOutput || !actualOutput) { setError('Planned and actual output are required.'); return; }
    if (!operatorCount) { setError('Operator count is required.'); return; }

    const eff = calcEfficiency();
    const dhu = parseFloat(calcDHU().toString());

    const entry: OutputLogEntry = {
      id: `out-${Date.now()}`,
      productionOrderId: selectedOrderId,
      orderNumber: selectedOrder?.orderNumber || '',
      lineId: selectedOrder?.lineId || selectedOrder?.sewingLine || '',
      styleName: selectedOrder?.styleName || '',
      buyer: selectedOrder?.buyer || '',
      date: new Date().toISOString().split('T')[0],
      shift,
      hour: hour || undefined,
      plannedOutput: parseFloat(plannedOutput),
      actualOutput: parseFloat(actualOutput),
      rejectedPcs: parseFloat(rejectedPcs) || 0,
      reworkPcs: parseFloat(reworkPcs) || 0,
      dhuPercent: dhu,
      efficiencyPercent: eff,
      operatorCount: parseInt(operatorCount) || 0,
      remarks,
      loggedBy: 'Floor Supervisor',
      loggedAt: new Date().toISOString(),
    };

    onSave(entry);
    onClose();
    // Reset
    setSelectedOrderId(''); setShift('A'); setHour(''); setPlannedOutput('');
    setActualOutput(''); setRejectedPcs('0'); setReworkPcs('0');
    setOperatorCount(''); setRemarks(''); setError('');
  };

  if (!isOpen) return null;

  const eff = calcEfficiency();
  const dhu = calcDHU();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Log Production Output</h2>
              <p className="text-xs text-indigo-100">Record hourly / shift output and DHU data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Production Order Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Production Line Order *
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => { setSelectedOrderId(e.target.value); setError(''); }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option value="">— Select Production Order —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} • {o.sewingLine} • {o.buyer} — {o.styleName}
                </option>
              ))}
            </select>
            {selectedOrder && (
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2">
                  <div className="text-indigo-500 font-semibold">Line</div>
                  <div className="font-bold text-indigo-900">{selectedOrder.lineId || selectedOrder.sewingLine}</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                  <div className="text-blue-500 font-semibold">Target Qty</div>
                  <div className="font-bold text-blue-900">{selectedOrder.targetQuantity.toLocaleString()} pcs</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                  <div className="text-emerald-500 font-semibold">Completed So Far</div>
                  <div className="font-bold text-emerald-900">{selectedOrder.completedQuantity.toLocaleString()} pcs</div>
                </div>
              </div>
            )}
          </div>

          {/* Shift / Hour */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Shift *</label>
              <div className="flex gap-2">
                {(['A', 'B', 'C'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setShift(s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                      shift === s
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    Shift {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Hour (optional)</label>
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">— Full Shift Total —</option>
                {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Output Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Planned Output (Pcs) *</label>
              <input
                type="number"
                value={plannedOutput}
                onChange={(e) => setPlannedOutput(e.target.value)}
                placeholder="e.g. 500"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Actual Output (Pcs) *</label>
              <input
                type="number"
                value={actualOutput}
                onChange={(e) => setActualOutput(e.target.value)}
                placeholder="e.g. 462"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Defects / Rework */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Rejected Pcs</label>
              <input
                type="number"
                value={rejectedPcs}
                onChange={(e) => setRejectedPcs(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Rework Pcs</label>
              <input
                type="number"
                value={reworkPcs}
                onChange={(e) => setReworkPcs(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Operators on Line</label>
              <input
                type="number"
                value={operatorCount}
                onChange={(e) => setOperatorCount(e.target.value)}
                placeholder="e.g. 45"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Computed KPIs */}
          {(plannedOutput || actualOutput) && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-500 mb-1">Efficiency Rate</div>
                <div className={`text-2xl font-black font-mono ${eff >= 85 ? 'text-emerald-600' : eff >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>
                  {eff}%
                </div>
                <div className="text-[10px] text-slate-400">{eff >= 85 ? '✓ Above Target' : eff >= 75 ? 'Near Target' : '⚠ Below Target'}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-500 mb-1">DHU Rate</div>
                <div className={`text-2xl font-black font-mono ${parseFloat(dhu.toString()) <= 2 ? 'text-emerald-600' : parseFloat(dhu.toString()) <= 3 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {dhu}%
                </div>
                <div className="text-[10px] text-slate-400">Defects per 100 units</div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Remarks / Observations</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="Bottleneck, breakdown, style difficulty, late material, etc."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Output Log
          </button>
        </div>
      </div>
    </div>
  );
}
