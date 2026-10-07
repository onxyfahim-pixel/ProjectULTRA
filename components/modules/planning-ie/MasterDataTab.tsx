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
  Link2,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sliders,
  Check,
  X,
} from 'lucide-react';
import {
  ProductionUnit,
  ProductionSection,
  ProductionLine,
} from '@/lib/types/production-management';
import {
  OperationMasterItem,
  MachineMasterItem,
  OperatorMasterItem,
  SkillMatrixItem,
  SkillLevelGrade,
} from '@/lib/types/planning-ie';

interface MasterDataTabProps {
  units: ProductionUnit[];
  sections: ProductionSection[];
  lines: ProductionLine[];
  operations: OperationMasterItem[];
  machines: MachineMasterItem[];
  operators: OperatorMasterItem[];
  skillMatrix: SkillMatrixItem[];
  onAddOperation: (op: OperationMasterItem) => void;
  onAddMachine: (m: MachineMasterItem) => void;
  onAddOperator: (o: OperatorMasterItem) => void;
  onUpdateSkillLevel: (id: string, newLevel: SkillLevelGrade) => void;
  onAddUnit?: (u: ProductionUnit) => void;
  onUpdateUnitStatus?: (id: string, status: 'ACTIVE' | 'INACTIVE') => void;
  onDeleteUnit?: (id: string) => void;
  onAddSection?: (s: ProductionSection) => void;
  onUpdateSectionStatus?: (id: string, status: 'ACTIVE' | 'INACTIVE') => void;
  onDeleteSection?: (id: string) => void;
  onAddLine?: (l: ProductionLine) => void;
  onUpdateLineStatus?: (id: string, status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE') => void;
  onDeleteLine?: (id: string) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
}

type SubTab = 'hierarchy' | 'operations' | 'machines' | 'operators' | 'skill_matrix';
type HierarchyView = 'units' | 'sections' | 'lines';

export function MasterDataTab({
  units,
  sections,
  lines,
  operations,
  machines,
  operators,
  skillMatrix,
  onAddOperation,
  onAddMachine,
  onAddOperator,
  onUpdateSkillLevel,
  onAddUnit,
  onUpdateUnitStatus,
  onDeleteUnit,
  onAddSection,
  onUpdateSectionStatus,
  onDeleteSection,
  onAddLine,
  onUpdateLineStatus,
  onDeleteLine,
  onExportCsv,
}: MasterDataTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('hierarchy');
  const [hierarchyView, setHierarchyView] = useState<HierarchyView>('lines');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');

  // Modals
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // New Line Form State
  const [newLineName, setNewLineName] = useState('');
  const [newLineCode, setNewLineCode] = useState('');
  const [newLineUnitId, setNewLineUnitId] = useState(units[0]?.id || 'unit-01');
  const [newLineSectionId, setNewLineSectionId] = useState(sections[0]?.id || 'sec-01');
  const [newLineChief, setNewLineChief] = useState('');
  const [newLineQC, setNewLineQC] = useState('');
  const [newLineCapacity, setNewLineCapacity] = useState(140);
  const [newLineOperators, setNewLineOperators] = useState(48);
  const [newLineMachines, setNewLineMachines] = useState(52);
  const [newLineRemarks, setNewLineRemarks] = useState('');

  // New Section Form State
  const [newSecName, setNewSecName] = useState('');
  const [newSecCode, setNewSecCode] = useState('');
  const [newSecUnitId, setNewSecUnitId] = useState(units[0]?.id || 'unit-01');
  const [newSecIncharge, setNewSecIncharge] = useState('');
  const [newSecDesc, setNewSecDesc] = useState('');

  // New Unit Form State
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitLocation, setNewUnitLocation] = useState('');
  const [newUnitManager, setNewUnitManager] = useState('');
  const [newUnitDesc, setNewUnitDesc] = useState('');

  // Filtered Lines
  const filteredLines = useMemo(() => {
    return lines.filter((l) => {
      const matchSearch =
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.lineCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.lineChief || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.qualityController || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.unitName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchUnit = selectedUnitFilter === 'ALL' || l.unitId === selectedUnitFilter || l.unitName === selectedUnitFilter;
      return matchSearch && matchUnit;
    });
  }, [lines, searchQuery, selectedUnitFilter]);

  // Filtered Sections
  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sectionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.inchargeName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchUnit = selectedUnitFilter === 'ALL' || s.unitId === selectedUnitFilter || s.unitName === selectedUnitFilter;
      return matchSearch && matchUnit;
    });
  }, [sections, searchQuery, selectedUnitFilter]);

  // Filtered Units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      return (
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.unitCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.managerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.location || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [units, searchQuery]);

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

  // Skill Badge Renderer
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

  const handleCreateLineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineName.trim()) return;
    const parentUnit = units.find((u) => u.id === newLineUnitId) || units[0];
    const parentSec = sections.find((s) => s.id === newLineSectionId) || sections[0];

    const newLine: ProductionLine = {
      id: `line-${Date.now()}`,
      name: newLineName.trim(),
      lineCode: newLineCode.trim() || `L-${lines.length + 1}`,
      unitId: parentUnit?.id || 'unit-01',
      unitName: parentUnit?.name || 'Unit 01 (Dhaka Complex)',
      sectionId: parentSec?.id || 'sec-01',
      sectionName: parentSec?.name || 'Sewing Floor',
      lineChief: newLineChief.trim() || 'Floor Supervisor',
      qualityController: newLineQC.trim() || 'Quality Officer',
      targetCapacityPerHour: Number(newLineCapacity) || 140,
      operatorCount: Number(newLineOperators) || 48,
      machineCount: Number(newLineMachines) || 52,
      status: 'ACTIVE',
      remarks: newLineRemarks.trim() || 'Added via Planning & IE Master Center',
      createdAt: new Date().toISOString(),
    };

    if (onAddLine) {
      onAddLine(newLine);
    }
    setIsLineModalOpen(false);
    setNewLineName('');
    setNewLineCode('');
    setNewLineChief('');
    setNewLineQC('');
  };

  const handleCreateSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecName.trim()) return;
    const parentUnit = units.find((u) => u.id === newSecUnitId) || units[0];

    const newSec: ProductionSection = {
      id: `sec-${Date.now()}`,
      name: newSecName.trim(),
      sectionCode: newSecCode.trim() || `SEC-${sections.length + 1}`,
      unitId: parentUnit?.id || 'unit-01',
      unitName: parentUnit?.name || 'Unit 01 (Dhaka Complex)',
      inchargeName: newSecIncharge.trim() || 'Section Incharge',
      status: 'ACTIVE',
      description: newSecDesc.trim() || 'Production Section',
      createdAt: new Date().toISOString(),
    };

    if (onAddSection) {
      onAddSection(newSec);
    }
    setIsSectionModalOpen(false);
    setNewSecName('');
    setNewSecCode('');
    setNewSecIncharge('');
    setNewSecDesc('');
  };

  const handleCreateUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    const newUnit: ProductionUnit = {
      id: `unit-${Date.now()}`,
      name: newUnitName.trim(),
      unitCode: newUnitCode.trim() || `UNIT-0${units.length + 1}`,
      location: newUnitLocation.trim() || 'Industrial Complex',
      managerName: newUnitManager.trim() || 'Plant Manager',
      status: 'ACTIVE',
      description: newUnitDesc.trim() || 'Manufacturing Unit',
      createdAt: new Date().toISOString(),
    };

    if (onAddUnit) {
      onAddUnit(newUnit);
    }
    setIsUnitModalOpen(false);
    setNewUnitName('');
    setNewUnitCode('');
    setNewUnitLocation('');
    setNewUnitManager('');
    setNewUnitDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Navigation Bar */}
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
            <span>01. Real Factory Hierarchy &amp; Lines ({lines.length})</span>
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
            <span>25. Machine Masters &amp; Utilization ({machines.length})</span>
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

        {/* Global Export Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (subTab === 'operations') onExportCsv('Operations_Master.csv', operations);
              else if (subTab === 'machines') onExportCsv('Machine_Utilization_Master.csv', machines);
              else if (subTab === 'operators') onExportCsv('Operator_Master.csv', operators);
              else if (subTab === 'hierarchy') onExportCsv('Production_Lines_Master.csv', lines);
              else onExportCsv('Skill_Matrix.csv', skillMatrix);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: FACTORY, SECTIONS & LINES HIERARCHY */}
      {subTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Live Sync Banner */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Live Synchronized with Production &amp; Quality Management
                  </h4>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Factory Units, Sections/Floors, and Production Lines are 100% unified in real-time. Any line added, section added, or status changed here updates Production and Quality instantaneously.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setHierarchyView('units')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  hierarchyView === 'units'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Units &amp; Plants ({units.length})
              </button>
              <button
                onClick={() => setHierarchyView('sections')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  hierarchyView === 'sections'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Sections &amp; Floors ({sections.length})
              </button>
              <button
                onClick={() => setHierarchyView('lines')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  hierarchyView === 'lines'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Production Lines ({lines.length})
              </button>
            </div>
          </div>

          {/* VIEW A: PRODUCTION UNITS */}
          {hierarchyView === 'units' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Manufacturing Units &amp; Complex Plants</h4>
                  <p className="text-xs text-slate-500">Operational facilities for knit, denim, woven, and activewear production</p>
                </div>
                <button
                  onClick={() => setIsUnitModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Production Unit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUnits.map((u) => {
                  const assignedLinesCount = lines.filter((l) => l.unitId === u.id || l.unitName === u.name).length;
                  const assignedSecsCount = sections.filter((s) => s.unitId === u.id || s.unitName === u.name).length;

                  return (
                    <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Factory className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {u.unitCode} &bull; {u.location}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (onUpdateUnitStatus) {
                              const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                              onUpdateUnitStatus(u.id, nextStatus);
                            }
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Click to toggle status: ACTIVE <-> INACTIVE"
                        >
                          {u.status}
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{u.description || 'Primary manufacturing facility.'}</p>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Plant Manager</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{u.managerName}</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Sections</div>
                          <div className="text-sm font-bold text-slate-800 mt-0.5">{assignedSecsCount || 5}</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Lines Allocated</div>
                          <div className="text-sm font-bold text-blue-700 mt-0.5">{assignedLinesCount}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW B: SECTIONS & FLOORS */}
          {hierarchyView === 'sections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Plant Sections &amp; Department Floors</h4>
                  <p className="text-xs text-slate-500">Sewing, Cutting, Finishing, Industrial Washing, and Quality Control AQL</p>
                </div>
                <button
                  onClick={() => setIsSectionModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="p-3">Section Name</th>
                        <th className="p-3">Section Code</th>
                        <th className="p-3">Assigned Unit</th>
                        <th className="p-3">Incharge Name</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSections.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{s.name}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{s.sectionCode}</td>
                          <td className="p-3 font-medium text-slate-800">{s.unitName}</td>
                          <td className="p-3 font-semibold text-slate-700">{s.inchargeName}</td>
                          <td className="p-3 text-slate-500 max-w-[220px] truncate">{s.description}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                if (onUpdateSectionStatus) {
                                  const next = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                                  onUpdateSectionStatus(s.id, next);
                                }
                              }}
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer transition-all ${
                                s.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {s.status}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            {onDeleteSection && (
                              <button
                                onClick={() => onDeleteSection(s.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer"
                                title="Delete Section"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW C: PRODUCTION LINES MASTER */}
          {hierarchyView === 'lines' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search lines, supervisors, QC, unit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedUnitFilter}
                    onChange={(e) => setSelectedUnitFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none bg-white text-slate-700 font-medium"
                  >
                    <option value="ALL">All Factory Units</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsLineModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Production Line</span>
                  </button>
                </div>
              </div>

              {/* Lines Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Live Production Lines Master &amp; Allocation
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live sync across Production floor, Quality inspection, and IE planning
                    </p>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{lines.length} Live Synced Lines</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="p-3">Line Name &amp; Code</th>
                        <th className="p-3">Factory Unit</th>
                        <th className="p-3">Section / Floor</th>
                        <th className="p-3">Line Chief</th>
                        <th className="p-3">Quality Controller</th>
                        <th className="p-3 text-center">Hourly Target</th>
                        <th className="p-3 text-center">Operators</th>
                        <th className="p-3 text-center">Machines</th>
                        <th className="p-3 text-center">Live Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLines.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{l.name}</div>
                            <div className="text-[10px] font-mono text-blue-700 font-bold">{l.lineCode}</div>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{l.unitName}</td>
                          <td className="p-3 text-slate-600">{l.sectionName || 'Sewing Floor'}</td>
                          <td className="p-3 font-medium text-slate-700">{l.lineChief || 'Jahangir Alam'}</td>
                          <td className="p-3 font-medium text-indigo-700 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{l.qualityController || 'Md. Rafiqul Islam'}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {l.targetCapacityPerHour || 140} pcs/hr
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700">{l.operatorCount || 48} Ops</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700">{l.machineCount || 52} M/c</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                if (onUpdateLineStatus) {
                                  const next = l.status === 'ACTIVE' ? 'MAINTENANCE' : l.status === 'MAINTENANCE' ? 'INACTIVE' : 'ACTIVE';
                                  onUpdateLineStatus(l.id, next);
                                }
                              }}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                                l.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : l.status === 'MAINTENANCE'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Click to toggle status: ACTIVE -> MAINTENANCE -> INACTIVE"
                            >
                              {l.status}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            {onDeleteLine && (
                              <button
                                onClick={() => onDeleteLine(l.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer"
                                title="Delete Line"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
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
                    <th className="p-3">Seq &amp; Code</th>
                    <th className="p-3">Operation Name</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Machine Type &amp; Class</th>
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
                        {op.operationSequence}. {op.operationCode}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{op.operationName}</td>
                      <td className="p-3">
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {op.department}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{op.machineType}</div>
                        <div className="text-[10px] text-slate-500">{op.machineClass}</div>
                      </td>
                      <td className="p-3 text-slate-600">{op.attachment || 'None'}</td>
                      <td className="p-3 text-center">{renderSkillBadge(op.skillLevel)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{op.smv.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700">{op.sam.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{op.targetPerHour}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">{op.operationCapacityPcs} pcs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MACHINE MASTER */}
      {subTab === 'machines' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                25. Factory Sewing &amp; Special Machine Inventory
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Machine ID</th>
                    <th className="p-3">Type &amp; Category</th>
                    <th className="p-3">Brand &amp; Model</th>
                    <th className="p-3">Assigned Line</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Breakdowns</th>
                    <th className="p-3 text-right">Utilization %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMachines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-700">{m.machineId}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{m.machineType}</div>
                        <div className="text-[10px] text-slate-500">{m.machineCategory}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 font-medium">{m.brand}</div>
                        <div className="text-[10px] text-slate-500">{m.model}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{m.lineName}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.status === 'RUNNING'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">{m.breakdownCountMonth}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">{m.utilizationPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: OPERATOR MASTER */}
      {subTab === 'operators' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                23. Certified Sewing Machine Operators &amp; IE Performance
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Operator ID &amp; Name</th>
                    <th className="p-3">Assigned Line</th>
                    <th className="p-3">Primary Operation</th>
                    <th className="p-3 text-center">Skill Grade</th>
                    <th className="p-3 text-right">Avg Efficiency %</th>
                    <th className="p-3 text-right">DHU %</th>
                    <th className="p-3 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOperators.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{o.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{o.operatorId}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{o.lineName}</td>
                      <td className="p-3 text-slate-700 font-medium">{o.primaryOperation}</td>
                      <td className="p-3 text-center">{renderSkillBadge(o.skillLevel)}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">{o.avgEfficiencyPercent}%</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{o.dhuPercent}%</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700">{o.attendancePercent}%</td>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              24. Operator &times; Operation Competency Skill Matrix
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="p-3">Operator Name</th>
                  <th className="p-3">Operation Code</th>
                  <th className="p-3">Operation Name</th>
                  <th className="p-3 text-center">Skill Grade (0-4)</th>
                  <th className="p-3 text-right">Demonstrated Cycle Time</th>
                  <th className="p-3 text-right">Historical Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {skillMatrix.map((sm) => (
                  <tr key={sm.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{sm.operatorName}</td>
                    <td className="p-3 font-mono font-bold text-blue-700">{sm.operationCode}</td>
                    <td className="p-3 font-medium text-slate-800">{sm.operationName}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {[0, 1, 2, 3, 4].map((grade) => (
                          <button
                            key={grade}
                            onClick={() => onUpdateSkillLevel(sm.id, grade as SkillLevelGrade)}
                            className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                              sm.skillLevel === grade
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">{sm.cycleTimeSec}s</td>
                    <td className="p-3 text-right font-mono font-bold text-blue-700">{sm.efficiencyPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE LINE MODAL */}
      {isLineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Production Line (Live Synced)</h3>
              <button
                onClick={() => setIsLineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateLineSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Line Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sewing Line 09 (Fleece Jackets)"
                  value={newLineName}
                  onChange={(e) => setNewLineName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Line Code</label>
                  <input
                    type="text"
                    placeholder="L-09"
                    value={newLineCode}
                    onChange={(e) => setNewLineCode(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Factory Unit</label>
                  <select
                    value={newLineUnitId}
                    onChange={(e) => setNewLineUnitId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Floor Section</label>
                  <select
                    value={newLineSectionId}
                    onChange={(e) => setNewLineSectionId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Line Chief / Supervisor</label>
                  <input
                    type="text"
                    placeholder="e.g. Jahangir Alam"
                    value={newLineChief}
                    onChange={(e) => setNewLineChief(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target / hr</label>
                  <input
                    type="number"
                    min={1}
                    value={newLineCapacity}
                    onChange={(e) => setNewLineCapacity(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Operators</label>
                  <input
                    type="number"
                    min={1}
                    value={newLineOperators}
                    onChange={(e) => setNewLineOperators(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Machines</label>
                  <input
                    type="number"
                    min={1}
                    value={newLineMachines}
                    onChange={(e) => setNewLineMachines(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quality Controller (QC Officer)</label>
                <input
                  type="text"
                  placeholder="e.g. Md. Rafiqul Islam"
                  value={newLineQC}
                  onChange={(e) => setNewLineQC(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLineModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save &amp; Sync to Production
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SECTION MODAL */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Production Section</h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSectionSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Embroidery Floor"
                  value={newSecName}
                  onChange={(e) => setNewSecName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Section Code</label>
                  <input
                    type="text"
                    placeholder="SEC-EMB"
                    value={newSecCode}
                    onChange={(e) => setNewSecCode(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Factory Unit</label>
                  <select
                    value={newSecUnitId}
                    onChange={(e) => setNewSecUnitId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Section Incharge</label>
                <input
                  type="text"
                  placeholder="e.g. Monir Hossain"
                  value={newSecIncharge}
                  onChange={(e) => setNewSecIncharge(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE UNIT MODAL */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Manufacturing Unit / Plant</h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUnitSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Unit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 05 (Manikganj Knit Composite)"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit Code</label>
                  <input
                    type="text"
                    placeholder="UNIT-05"
                    value={newUnitCode}
                    onChange={(e) => setNewUnitCode(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Plant Manager</label>
                  <input
                    type="text"
                    placeholder="Engr. M. Rahman"
                    value={newUnitManager}
                    onChange={(e) => setNewUnitManager(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Location Address</label>
                <input
                  type="text"
                  placeholder="e.g. Manikganj Highway Industrial Area, Dhaka"
                  value={newUnitLocation}
                  onChange={(e) => setNewUnitLocation(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Plant Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
