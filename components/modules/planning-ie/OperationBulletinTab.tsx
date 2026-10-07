'use client';

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sliders,
  Plus,
  Edit,
  Copy,
  Printer,
  Download,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Trash2,
  Save,
} from 'lucide-react';
import {
  StyleOperationBulletin,
  OperationBulletinItem,
  ObApprovalStatus,
  SkillLevelGrade,
} from '@/lib/types/planning-ie';

interface OperationBulletinTabProps {
  bulletins: StyleOperationBulletin[];
  selectedBulletinId: string;
  onSelectBulletin: (id: string) => void;
  onUpdateBulletin: (updated: StyleOperationBulletin) => void;
  onDuplicateBulletin: (b: StyleOperationBulletin) => void;
  onAddNewBulletin?: (newBulletin: StyleOperationBulletin) => void;
  onAddOperationToBulletin: (bulletinId: string, op: OperationBulletinItem) => void;
  onDeleteOperationFromBulletin: (bulletinId: string, opId: string) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
  onPrintOb: () => void;
}

export function OperationBulletinTab({
  bulletins,
  selectedBulletinId,
  onSelectBulletin,
  onUpdateBulletin,
  onDuplicateBulletin,
  onAddNewBulletin,
  onAddOperationToBulletin,
  onDeleteOperationFromBulletin,
  onExportCsv,
  onPrintOb,
}: OperationBulletinTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'grid' | 'yamazumi' | 'balancing'>('grid');
  const [isCreateObOpen, setIsCreateObOpen] = useState(false);

  const currentBulletin = useMemo(() => {
    return bulletins.find((b) => b.id === selectedBulletinId) || bulletins[0];
  }, [bulletins, selectedBulletinId]);

  // Form state for creating a new bulletin
  const [newStyleNumber, setNewStyleNumber] = useState('');
  const [newStyleDesc, setNewStyleDesc] = useState('');
  const [newBuyerName, setNewBuyerName] = useState('H&M Hennes & Mauritz');
  const [newGarmentType, setNewGarmentType] = useState<any>('T-Shirt');
  const [newTargetOps, setNewTargetOps] = useState<number>(28);
  const [newTargetEff, setNewTargetEff] = useState<number>(82);

  // Commercial Style Templates Library
  const STYLE_TEMPLATES = [
    {
      styleNumber: 'STY-TS-2026',
      styleDescription: 'Men Heavyweight Cotton Crewneck Tee 180 GSM',
      buyerName: 'H&M Hennes & Mauritz',
      garmentType: 'T-Shirt',
      totalSmv: 11.2,
      targetOps: 28,
      pitchSec: 24.0,
      eff: 82,
      dailyTarget: 1800,
    },
    {
      styleNumber: 'STY-DN-502',
      styleDescription: 'Slim Fit Washed Indigo Denim Jeans 12oz',
      buyerName: 'Inditex / Zara',
      garmentType: 'Denim Jeans',
      totalSmv: 22.4,
      targetOps: 48,
      pitchSec: 28.0,
      eff: 78,
      dailyTarget: 950,
    },
    {
      styleNumber: 'STY-PL-889',
      styleDescription: 'Pique Cotton Polo with Flat-Knit Collar & Placket',
      buyerName: 'PVH Tommy Hilfiger',
      garmentType: 'Polo Shirt',
      totalSmv: 15.0,
      targetOps: 34,
      pitchSec: 26.5,
      eff: 80,
      dailyTarget: 1400,
    },
    {
      styleNumber: 'STY-HD-770',
      styleDescription: 'French Terry Heavyweight Kangaroo Hoodie 320 GSM',
      buyerName: 'Uniqlo Fast Retailing',
      garmentType: 'Hoodie',
      totalSmv: 19.5,
      targetOps: 42,
      pitchSec: 27.8,
      eff: 84,
      dailyTarget: 1100,
    },
    {
      styleNumber: 'STY-SH-410',
      styleDescription: 'Formal Long Sleeve Poplin Cotton Shirt with Collar Band',
      buyerName: 'Marks & Spencer (M&S)',
      garmentType: 'Woven Shirt',
      totalSmv: 18.2,
      targetOps: 42,
      pitchSec: 26.0,
      eff: 82,
      dailyTarget: 1250,
    },
    {
      styleNumber: 'STY-LG-920',
      styleDescription: 'Women High-Rise Seamless Active Leggings with Gusset',
      buyerName: 'Target / JoyLab Athletic',
      garmentType: 'Activewear',
      totalSmv: 10.8,
      targetOps: 28,
      pitchSec: 23.1,
      eff: 86,
      dailyTarget: 1950,
    },
  ];

  const handleLoadTemplate = (tpl: (typeof STYLE_TEMPLATES)[0]) => {
    const newId = `ob-${Date.now()}`;
    const newBulletin: StyleOperationBulletin = {
      id: newId,
      styleNumber: tpl.styleNumber,
      styleDescription: tpl.styleDescription,
      buyerName: tpl.buyerName,
      garmentType: tpl.garmentType as any,
      totalSmv: tpl.totalSmv,
      targetLineOperators: tpl.targetOps,
      linePitchTimeSec: tpl.pitchSec,
      targetEfficiency: tpl.eff,
      plannedDailyOutput: tpl.dailyTarget,
      balancingEfficiency: 88.5,
      version: 'v1.0',
      approvalStatus: 'IE_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      operations: [
        {
          id: `op-${Date.now()}-1`,
          seqNumber: 1,
          operationName: 'Parts Preparation & Edge Stabilization',
          section: 'PREPARATION',
          machineType: '4-Thread Overlock',
          machineCode: '4T-OVL-01',
          smv: Math.round((tpl.totalSmv * 0.15) * 100) / 100,
          theoreticalOperators: 3,
          allocatedOperators: 3,
          cycleTimeSec: tpl.pitchSec,
          pitchTimeSec: tpl.pitchSec,
          targetPerHour: Math.round(3600 / tpl.pitchSec),
          isBottleneck: false,
        },
        {
          id: `op-${Date.now()}-2`,
          seqNumber: 2,
          operationName: 'Main Panel In-Line Assembly & Contour Joining',
          section: 'ASSEMBLY',
          machineType: 'Single Needle Lockstitch (SNLS)',
          machineCode: 'SNLS-01',
          smv: Math.round((tpl.totalSmv * 0.55) * 100) / 100,
          theoreticalOperators: Math.round(tpl.targetOps * 0.55),
          allocatedOperators: Math.round(tpl.targetOps * 0.55),
          cycleTimeSec: tpl.pitchSec,
          pitchTimeSec: tpl.pitchSec,
          targetPerHour: Math.round(3600 / tpl.pitchSec),
          isBottleneck: false,
        },
        {
          id: `op-${Date.now()}-3`,
          seqNumber: 3,
          operationName: 'Bottom Hemming & Clean Trimming Finish',
          section: 'FINISHING',
          machineType: 'Flatlock 3-Needle Cylinder Bed',
          machineCode: 'FL-01',
          smv: Math.round((tpl.totalSmv * 0.3) * 100) / 100,
          theoreticalOperators: Math.round(tpl.targetOps * 0.3),
          allocatedOperators: Math.round(tpl.targetOps * 0.3),
          cycleTimeSec: tpl.pitchSec,
          pitchTimeSec: tpl.pitchSec,
          targetPerHour: Math.round(3600 / tpl.pitchSec),
          isBottleneck: false,
        },
      ],
    };

    if (onAddNewBulletin) {
      onAddNewBulletin(newBulletin);
    }
    onSelectBulletin(newId);
    setIsCreateObOpen(false);
  };

  // Modals / Add op form
  const [isAddOpOpen, setIsAddOpOpen] = useState(false);
  const [newOpName, setNewOpName] = useState('');
  const [newOpCode, setNewOpCode] = useState('');
  const [newOpSection, setNewOpSection] = useState<'PREPARATION' | 'ASSEMBLY' | 'FINISHING'>('ASSEMBLY');
  const [newOpMachine, setNewOpMachine] = useState('4-Thread Overlock');
  const [newOpMachineCode, setNewOpMachineCode] = useState('4T-OVL-01');
  const [newOpAttachment, setNewOpAttachment] = useState('');
  const [newOpSmv, setNewOpSmv] = useState<number>(1.2);
  const [newOpAllocatedOps, setNewOpAllocatedOps] = useState<number>(2);

  const handleAddOperationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBulletin) return;
    const cycleTimeSec = Math.round(((newOpSmv * 60) / (newOpAllocatedOps || 1)) * 10) / 10;
    const isBottleneck = cycleTimeSec > currentBulletin.linePitchTimeSec;

    const newOp: OperationBulletinItem = {
      id: `op-${Date.now()}`,
      seqNumber: currentBulletin.operations.length + 1,
      operationCode: newOpCode || `OP-${currentBulletin.operations.length + 1}`,
      operationName: newOpName,
      section: newOpSection,
      machineType: newOpMachine,
      machineCode: newOpMachineCode,
      attachment: newOpAttachment,
      smv: newOpSmv,
      sam: Math.round(newOpSmv * 1.12 * 100) / 100,
      theoreticalOperators: Math.round(((newOpSmv * 60) / currentBulletin.linePitchTimeSec) * 10) / 10,
      allocatedOperators: newOpAllocatedOps,
      cycleTimeSec,
      pitchTimeSec: currentBulletin.linePitchTimeSec,
      targetPerHour: Math.round(3600 / cycleTimeSec),
      isBottleneck,
    };

    onAddOperationToBulletin(currentBulletin.id, newOp);
    setIsAddOpOpen(false);
    setNewOpName('');
    setNewOpCode('');
  };

  // Rebalance simulator: adjust operator allocation on an operation and recalculate
  const handleAdjustOperator = (opId: string, delta: number) => {
    if (!currentBulletin) return;
    const updatedOps = currentBulletin.operations.map((op) => {
      if (op.id !== opId) return op;
      const newOps = Math.max(1, op.allocatedOperators + delta);
      const cycleTimeSec = Math.round(((op.smv * 60) / newOps) * 10) / 10;
      const isBottleneck = cycleTimeSec > currentBulletin.linePitchTimeSec;
      return {
        ...op,
        allocatedOperators: newOps,
        cycleTimeSec,
        isBottleneck,
        targetPerHour: Math.round(3600 / cycleTimeSec),
      };
    });

    // Recalculate balancing efficiency
    const totalAllocatedOps = updatedOps.reduce((acc, o) => acc + o.allocatedOperators, 0);
    const maxCycleTime = Math.max(...updatedOps.map((o) => o.cycleTimeSec));
    const totalCycleTime = updatedOps.reduce((acc, o) => acc + o.cycleTimeSec, 0);
    const newBalancingEfficiency =
      maxCycleTime > 0
        ? Math.round((totalCycleTime / (updatedOps.length * maxCycleTime)) * 1000) / 10
        : currentBulletin.balancingEfficiency;

    onUpdateBulletin({
      ...currentBulletin,
      targetLineOperators: totalAllocatedOps,
      balancingEfficiency: newBalancingEfficiency,
      operations: updatedOps,
      updatedAt: new Date().toISOString(),
    });
  };

  // Approval status handler
  const handleStatusChange = (newStatus: ObApprovalStatus) => {
    if (!currentBulletin) return;
    onUpdateBulletin({
      ...currentBulletin,
      approvalStatus: newStatus,
      approvedBy: newStatus === 'ACTIVE' ? 'Kamal Hossain (IE Manager)' : currentBulletin.approvedBy,
      approvalDate: newStatus === 'ACTIVE' ? new Date().toISOString().split('T')[0] : currentBulletin.approvalDate,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Active Bulletins Selector Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                08. Style Operation Bulletin (OB) &amp; Line Balancing
              </h3>
              <p className="text-xs text-slate-500">
                Garment breakdown, SMV / SAM standards, machine allocations, and pitch time balance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateObOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New OB</span>
            </button>
            <button
              onClick={() => onDuplicateBulletin(currentBulletin)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplicate OB</span>
            </button>
            <button
              onClick={onPrintOb}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print OB</span>
            </button>
            <button
              onClick={() => onExportCsv(`${currentBulletin.styleNumber}_Operation_Bulletin.csv`, currentBulletin.operations)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Style Selection Cards - Responsive 6 Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {bulletins.map((b) => (
            <div
              key={b.id}
              onClick={() => onSelectBulletin(b.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedBulletinId === b.id
                  ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-blue-700">{b.styleNumber}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                  {b.garmentType}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-800 line-clamp-1">{b.styleDescription}</div>
              <div className="text-[10px] text-slate-500 truncate">{b.buyerName}</div>
              <div className="flex items-center justify-between text-[10px] font-mono mt-2 pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-500">
                  SMV: <strong className="text-slate-900">{b.totalSmv}m</strong>
                </span>
                <span className="text-emerald-700 font-bold">Bal: {b.balancingEfficiency}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Style OB Header Info & Key Metrics */}
      {currentBulletin && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-blue-700">{currentBulletin.styleNumber}</span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-sm font-semibold text-slate-800">{currentBulletin.styleDescription}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  OB Version {currentBulletin.version || 'v1.2'}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Buyer: <strong>{currentBulletin.buyerName}</strong> &bull; Garment Type: <strong>{currentBulletin.garmentType}</strong> &bull; Total Operations: <strong>{currentBulletin.operations.length}</strong>
              </div>
            </div>

            {/* Approval Workflow Stage */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">39. Approval Status:</span>
              <select
                value={currentBulletin.approvalStatus || 'ACTIVE'}
                onChange={(e) => handleStatusChange(e.target.value as ObApprovalStatus)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-emerald-800"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="IE_REVIEW">IE REVIEW</option>
                <option value="IE_MANAGER_APPROVAL">IE MANAGER APPROVAL</option>
                <option value="ACTIVE">ACTIVE (APPROVED)</option>
                <option value="REVISED">REVISED</option>
                <option value="OBSOLETE">OBSOLETE</option>
              </select>
            </div>
          </div>

          {/* Key OB Parameters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Garment SMV</div>
              <div className="text-lg font-bold font-mono text-blue-700 mt-1">{currentBulletin.totalSmv} min</div>
              <div className="text-[10px] text-slate-500 font-mono">SAM: {(currentBulletin.totalSmv * 1.12).toFixed(2)}m</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Target Line Operators</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-1">{currentBulletin.targetLineOperators} Ops</div>
              <div className="text-[10px] text-slate-500">Allocated headcount</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Line Pitch Time</div>
              <div className="text-lg font-bold font-mono text-indigo-700 mt-1">{currentBulletin.linePitchTimeSec} sec</div>
              <div className="text-[10px] text-slate-500">Benchmark cycle pace</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Balancing Efficiency</div>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-1">{currentBulletin.balancingEfficiency}%</div>
              <div className="text-[10px] text-emerald-600 font-medium">Benchmark &ge; 85%</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Planned Output / Day</div>
              <div className="text-lg font-bold font-mono text-purple-700 mt-1">{currentBulletin.plannedDailyOutput} pcs</div>
              <div className="text-[10px] text-slate-500">8-hour shift output</div>
            </div>
          </div>

          {/* Sub Navigation: Operations Grid vs Yamazumi Workload Chart vs Line Balance */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Operations Table ({currentBulletin.operations.length})
              </button>
              <button
                onClick={() => setActiveSubTab('yamazumi')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'yamazumi'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>12. Yamazumi Workload Chart</span>
              </button>
              <button
                onClick={() => setActiveSubTab('balancing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'balancing'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Line Balance Optimizer</span>
              </button>
            </div>

            <button
              onClick={() => setIsAddOpOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Operation</span>
            </button>
          </div>

          {/* SUB-VIEW 1: OPERATIONS GRID */}
          {activeSubTab === 'grid' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3 w-12 text-center">Seq</th>
                    <th className="p-3">Operation Code &amp; Name</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Machine &amp; Attachment</th>
                    <th className="p-3 text-right">SMV</th>
                    <th className="p-3 text-center">Theo Ops</th>
                    <th className="p-3 text-center">Alloc Ops</th>
                    <th className="p-3 text-right">Cycle Time</th>
                    <th className="p-3 text-right">Pitch Time</th>
                    <th className="p-3 text-right">Target / hr</th>
                    <th className="p-3 text-center">Bottleneck?</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentBulletin.operations.map((op) => (
                    <tr
                      key={op.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        op.isBottleneck ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-700">#{op.seqNumber}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{op.operationName}</div>
                        {op.operationCode && (
                          <div className="font-mono text-[10px] text-slate-400">{op.operationCode}</div>
                        )}
                        {op.remarks && <div className="text-[10px] text-amber-700 mt-0.5">{op.remarks}</div>}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {op.section}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800">{op.machineType}</div>
                        <div className="font-mono text-[10px] text-slate-400">{op.machineCode}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{op.smv.toFixed(2)}</td>
                      <td className="p-3 text-center font-mono text-slate-600">{op.theoreticalOperators}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustOperator(op.id, -1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-slate-900 w-4 text-center">
                            {op.allocatedOperators}
                          </span>
                          <button
                            onClick={() => handleAdjustOperator(op.id, 1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{op.cycleTimeSec}s</td>
                      <td className="p-3 text-right font-mono text-slate-500">{op.pitchTimeSec}s</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700">
                        {op.targetPerHour || Math.round(3600 / op.cycleTimeSec)} pcs
                      </td>
                      <td className="p-3 text-center">
                        {op.isBottleneck ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <Flame className="w-3 h-3 text-amber-600" />
                            Bottleneck
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Balanced
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Remove operation "${op.operationName}" from OB?`)) {
                              onDeleteOperationFromBulletin(currentBulletin.id, op.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete operation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-VIEW 2: YAMAZUMI WORKLOAD CHART */}
          {activeSubTab === 'yamazumi' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-900">Yamazumi Workload Balancing Chart Guide:</div>
                <p>
                  Bars represent operation cycle times (seconds). The red dashed line denotes line pitch time ({currentBulletin.linePitchTimeSec}s). Operations exceeding pitch time create factory bottlenecks, while operations significantly below pitch time leave idle capacity.
                </p>
              </div>

              <div className="space-y-3">
                {currentBulletin.operations.map((op) => {
                  const maxDisplaySec = 35;
                  const barWidthPercent = Math.min(100, (op.cycleTimeSec / maxDisplaySec) * 100);
                  const pitchLinePercent = (currentBulletin.linePitchTimeSec / maxDisplaySec) * 100;

                  return (
                    <div key={op.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-md">
                          #{op.seqNumber}. {op.operationName} ({op.machineType})
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span>Alloc: {op.allocatedOperators} Ops</span>
                          <strong className={op.isBottleneck ? 'text-amber-700' : 'text-slate-900'}>
                            {op.cycleTimeSec}s
                          </strong>
                        </div>
                      </div>

                      <div className="w-full h-6 bg-slate-100 rounded-lg relative overflow-hidden flex items-center">
                        {/* Red Pitch Line */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                          style={{ left: `${pitchLinePercent}%` }}
                          title={`Pitch Time: ${currentBulletin.linePitchTimeSec}s`}
                        ></div>

                        {/* Workload Bar */}
                        <div
                          className={`h-full rounded-md transition-all flex items-center justify-end px-2 text-[10px] font-bold text-white ${
                            op.isBottleneck ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${barWidthPercent}%` }}
                        >
                          {op.cycleTimeSec}s
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: LINE BALANCE OPTIMIZER */}
          {activeSubTab === 'balancing' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900">Line Balance Efficiency Optimizer</h4>
                  <p className="text-slate-500 mt-0.5">
                    Adjust operator headcount per operation in the table above to eliminate bottlenecks and optimize balancing efficiency.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Current Balancing Score</div>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    {currentBulletin.balancingEfficiency}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800">1. Split Operations</div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    For operations with cycle times &gt; {currentBulletin.linePitchTimeSec}s, split preparation and assembly steps across 2 workstations.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800">2. Add Helper / Floater</div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Assign a dedicated bundle trimmer or notch aligner to relieve the bottleneck operator.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800">3. Upgrade Automation Work Aids</div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Deploy pneumatic folders, electronic pullers, or automatic scissors to cut cycle time by 15-25%.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Operation to Bulletin Modal */}
      {isAddOpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Add Operation to {currentBulletin?.styleNumber} OB
              </h3>
              <button
                onClick={() => setIsAddOpOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddOperationSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Operation Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Back Yoke Join with Lap Seam"
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Operation Code</label>
                  <input
                    type="text"
                    placeholder="e.g. OP-KN-12"
                    value={newOpCode}
                    onChange={(e) => setNewOpCode(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Section</label>
                  <select
                    value={newOpSection}
                    onChange={(e) => setNewOpSection(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="PREPARATION">PREPARATION</option>
                    <option value="ASSEMBLY">ASSEMBLY</option>
                    <option value="FINISHING">FINISHING</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Machine Type</label>
                  <input
                    type="text"
                    value={newOpMachine}
                    onChange={(e) => setNewOpMachine(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Machine Code</label>
                  <input
                    type="text"
                    value={newOpMachineCode}
                    onChange={(e) => setNewOpMachineCode(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Attachment / Folder / Work Aid</label>
                <input
                  type="text"
                  placeholder="e.g. Folder 1/4 inch, pneumatic tensioner..."
                  value={newOpAttachment}
                  onChange={(e) => setNewOpAttachment(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Standard Minute Value (SMV) *</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    value={newOpSmv}
                    onChange={(e) => setNewOpSmv(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Allocated Operators *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newOpAllocatedOps}
                    onChange={(e) => setNewOpAllocatedOps(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Operation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW OPERATION BULLETIN MODAL */}
      {isCreateObOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Create Style Operation Bulletin (OB)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Load a pre-engineered commercial garment template or start a new style line balancing sequence.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateObOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>1-Click Load Commercial Style Template:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STYLE_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.styleNumber}
                    onClick={() => handleLoadTemplate(tpl)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-blue-700 group-hover:text-blue-800">
                        {tpl.styleNumber}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                        {tpl.garmentType}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 line-clamp-1">{tpl.styleDescription}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tpl.buyerName}</div>
                    <div className="flex items-center justify-between text-[11px] font-mono mt-2 pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-500">
                        SMV: <strong>{tpl.totalSmv}m</strong>
                      </span>
                      <span className="text-emerald-700 font-bold">{tpl.dailyTarget} pcs/day</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateObOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
