'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Factory,
  Cpu,
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Copy,
} from 'lucide-react';
import {
  FactoryMaster,
  ProductionLineMaster,
  OperationMasterItem,
  MachineMasterItem,
  OperatorMasterItem,
  SkillMatrixItem,
  SkillLevelGrade,
} from '@/lib/types/planning-ie';

interface MasterDataTabProps {
  factories: FactoryMaster[];
  lines: ProductionLineMaster[];
  operations: OperationMasterItem[];
  machines: MachineMasterItem[];
  operators: OperatorMasterItem[];
  skillMatrix: SkillMatrixItem[];
  onAddOperation: (op: OperationMasterItem) => void;
  onAddMachine: (m: MachineMasterItem) => void;
  onAddOperator: (o: OperatorMasterItem) => void;
  onUpdateSkillLevel: (id: string, newLevel: SkillLevelGrade) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
}

type SubTab = 'hierarchy' | 'operations' | 'machines' | 'operators' | 'skill_matrix';

export function MasterDataTab({
  factories,
  lines,
  operations,
  machines,
  operators,
  skillMatrix,
  onAddOperation,
  onAddMachine,
  onAddOperator,
  onUpdateSkillLevel,
  onExportCsv,
}: MasterDataTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('hierarchy');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');

  // Filtered Operations
  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      const matchSearch =
        op.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.operationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.machineType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = filterDept === 'ALL' || op.department === filterDept;
      return matchSearch && matchDept;
    });
  }, [operations, searchQuery, filterDept]);

  // Filtered Machines
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      return (
        m.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.machineType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.lineName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [machines, searchQuery]);

  // Filtered Operators
  const filteredOperators = useMemo(() => {
    return operators.filter((o) => {
      return (
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.operatorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.primaryOperation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.lineName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [operators, searchQuery]);

  // Quick Skill Badge Renderer
  const renderSkillBadge = (level: SkillLevelGrade) => {
    const config = {
      0: { label: '0: Not Trained', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
      1: { label: '1: Trainee', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
      2: { label: '2: Basic', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
      3: { label: '3: Competent', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
      4: { label: '4: Expert', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    }[level];
    return (
      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.cls}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('hierarchy')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'hierarchy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>01. Factory Hierarchy & Lines ({lines.length})</span>
          </button>
          <button
            onClick={() => setSubTab('operations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'operations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>07. Operation Library ({operations.length})</span>
          </button>
          <button
            onClick={() => setSubTab('machines')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'machines'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>25. Machine Masters & Utilization ({machines.length})</span>
          </button>
          <button
            onClick={() => setSubTab('operators')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'operators'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>23. Operator Masters ({operators.length})</span>
          </button>
          <button
            onClick={() => setSubTab('skill_matrix')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'skill_matrix'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>24. Skill Matrix (Operator &times; Op)</span>
          </button>
        </div>

        {/* Global Export Button for Current Master */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (subTab === 'operations') onExportCsv('Operations_Master.csv', operations);
              else if (subTab === 'machines') onExportCsv('Machine_Utilization_Master.csv', machines);
              else if (subTab === 'operators') onExportCsv('Operator_Master.csv', operators);
              else if (subTab === 'hierarchy') onExportCsv('Factory_Lines_Master.csv', lines);
              else onExportCsv('Skill_Matrix.csv', skillMatrix);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: FACTORY HIERARCHY */}
      {subTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Factory Plant Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factories.map((fac) => (
              <div
                key={fac.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Factory className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{fac.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{fac.code} &bull; {fac.location}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Operational
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Buildings</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{fac.totalBuildings}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Lines</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{fac.totalLines}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Shifts</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">2 (Day / Evg)</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lines Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Production Lines Master & Capacities
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned unit, line types, floor locations, and standard efficiency benchmarks
                </p>
              </div>
              <div className="text-xs font-bold text-blue-600">{lines.length} Active Lines</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Line Name</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Line Type</th>
                    <th className="p-3">Floor & Building</th>
                    <th className="p-3 text-center">Operator Capacity</th>
                    <th className="p-3 text-center">Machine Capacity</th>
                    <th className="p-3 text-center">Std Efficiency</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{l.name}</td>
                      <td className="p-3 font-mono text-slate-600">{l.lineCode}</td>
                      <td className="p-3">
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {l.lineType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{l.floor}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">{l.capacityOperators} Ops</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">{l.capacityMachines} M/c</td>
                      <td className="p-3 text-center font-mono font-bold text-blue-700">{l.standardEfficiency}%</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            l.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: OPERATION MASTER LIBRARY */}
      {subTab === 'operations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search operations by name, code, machine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none bg-white text-slate-700 font-medium"
              >
                <option value="ALL">All Sections</option>
                <option value="PREPARATION">Preparation</option>
                <option value="ASSEMBLY">Assembly</option>
                <option value="FINISHING">Finishing</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Seq & Code</th>
                    <th className="p-3">Operation Name</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Machine Type & Class</th>
                    <th className="p-3">Attachment / Work Aid</th>
                    <th className="p-3 text-center">Skill Req</th>
                    <th className="p-3 text-right">SMV (min)</th>
                    <th className="p-3 text-right">SAM (min)</th>
                    <th className="p-3 text-right">Target / hr</th>
                    <th className="p-3 text-right">Day Cap (8h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOperations.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-700">
                        #{op.operationSequence} &bull; {op.operationCode}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{op.operationName}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {op.department}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div>{op.machineType}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{op.machineClass}</div>
                      </td>
                      <td className="p-3 text-slate-600 text-[11px] max-w-xs">{op.attachment}</td>
                      <td className="p-3 text-center">{renderSkillBadge(op.skillLevel)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{op.smv.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{op.sam.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700">{op.targetPerHour} pcs</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{op.operationCapacityPcs} pcs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MACHINE MASTERS & UTILIZATION */}
      {subTab === 'machines' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Machine Fleet</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{machines.length} Units</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Juki, Pegasus, Yamato</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Avg Machine Utilization</div>
              <div className="text-xl font-bold text-blue-700 mt-1">87.2%</div>
              <div className="text-[11px] text-blue-600 font-medium mt-0.5">Target &ge; 85%</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Fleet Running Status</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {machines.filter((m) => m.status === 'RUNNING').length} Running
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">1 Under Maintenance</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Mean Time to Repair (MTTR)</div>
              <div className="text-xl font-bold text-indigo-700 mt-1">18.5 min</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Dedicated mechanics on duty</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Machine ID</th>
                    <th className="p-3">Type & Brand</th>
                    <th className="p-3">Serial & Model</th>
                    <th className="p-3">Assigned Line & Op</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Avail Min</th>
                    <th className="p-3 text-right">Run Min</th>
                    <th className="p-3 text-right">Breakdown</th>
                    <th className="p-3 text-right">Utilization %</th>
                    <th className="p-3 text-right">Machine Eff %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMachines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-700">{m.machineId}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{m.machineType}</div>
                        <div className="text-[10px] text-slate-500">{m.brand} &bull; {m.machineCategory}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {m.model} ({m.serialNumber})
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{m.lineName}</div>
                        <div className="text-[11px] text-slate-500">{m.operationName}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.status === 'RUNNING'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : m.status === 'AVAILABLE'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : m.status === 'MAINTENANCE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">{m.availableMinutesDaily}m</td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-900">{m.runningMinutes}m</td>
                      <td className="p-3 text-right font-mono text-rose-600">
                        {m.breakdownMinutes > 0 ? `${m.breakdownMinutes}m` : '0m'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        {m.utilizationPercent.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {m.machineEfficiency.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: OPERATOR MASTERS */}
      {subTab === 'operators' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search operators by name, ID, operation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Showing {filteredOperators.length} Operators
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Operator ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Line & Dept</th>
                    <th className="p-3">Primary Operation</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-center">Skill Level</th>
                    <th className="p-3 text-center">Multi-Skill</th>
                    <th className="p-3 text-center">Attendance</th>
                    <th className="p-3 text-right">Efficiency %</th>
                    <th className="p-3 text-right">Rating Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOperators.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-700">{o.operatorId}</td>
                      <td className="p-3 font-semibold text-slate-900">{o.name}</td>
                      <td className="p-3 text-slate-700">{o.lineName}</td>
                      <td className="p-3 text-slate-800 font-medium">{o.primaryOperation}</td>
                      <td className="p-3 text-center">
                        <span className="font-bold font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {o.grade}
                        </span>
                      </td>
                      <td className="p-3 text-center">{renderSkillBadge(o.skillLevel)}</td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {o.multiSkillCount} Ops
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {o.attendanceStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {o.efficiencyRate.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        {o.performanceRating}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SKILL MATRIX */}
      {subTab === 'skill_matrix' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Operator &times; Operation Skill Competency Matrix
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Levels: 0 = Not Trained, 1 = Trainee, 2 = Basic, 3 = Competent, 4 = Expert
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Training Needed: {skillMatrix.filter((s) => s.trainingNeeded).length} Ops
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Operator Name & ID</th>
                    <th className="p-3">Line</th>
                    <th className="p-3">Operation Evaluated</th>
                    <th className="p-3 text-center">Current Skill Level</th>
                    <th className="p-3 text-center">Change Level</th>
                    <th className="p-3 text-center">Training Gap</th>
                    <th className="p-3 text-slate-500">Certified Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {skillMatrix.map((sk) => (
                    <tr key={sk.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{sk.operatorName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{sk.operatorId}</div>
                      </td>
                      <td className="p-3 text-slate-600">{sk.lineName}</td>
                      <td className="p-3 font-medium text-slate-800">
                        {sk.operationName} <span className="font-mono text-[10px] text-slate-400">({sk.operationCode})</span>
                      </td>
                      <td className="p-3 text-center">{renderSkillBadge(sk.skillLevel)}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                          {([0, 1, 2, 3, 4] as SkillLevelGrade[]).map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => onUpdateSkillLevel(sk.id, lvl)}
                              className={`px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                                sk.skillLevel === lvl
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {sk.trainingNeeded ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Training Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Certified
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{sk.certifiedDate || 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
