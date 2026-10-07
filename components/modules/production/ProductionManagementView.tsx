'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Factory,
  Layers,
  Users,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Gauge,
  UserCheck,
  X,
  Save,
  Filter,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import {
  ProductionUnit,
  ProductionSection,
  ProductionLine,
  ProductionDefectItem,
  ProductionDefectCategory,
  ProductionDefectSeverity,
} from '@/lib/types/production-management';
import {
  getProductionUnits,
  saveProductionUnits,
  getProductionSections,
  saveProductionSections,
  getProductionLines,
  saveProductionLines,
} from '@/lib/db/production-management-store';
import {
  getProductionDefects,
  saveProductionDefects,
  addProductionDefect,
  updateProductionDefect,
  deleteProductionDefect,
  toggleCommonProductionDefect,
  resetProductionDefectsToDefault,
} from '@/lib/db/production-defects-store';
import { useModulePermission } from '@/hooks/use-module-permission';

interface ProductionManagementViewProps {
  showToast: (msg: string) => void;
}

export function ProductionManagementView({ showToast }: ProductionManagementViewProps) {
  const { canCreate, canEdit, canDelete } = useModulePermission('production');
  const [units, setUnits] = useState<ProductionUnit[]>([]);
  const [sections, setSections] = useState<ProductionSection[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [defects, setDefects] = useState<ProductionDefectItem[]>([]);

  // Sub-tab view: 'lines' | 'units' | 'sections' | 'defects'
  const [activeSubTab, setActiveSubTab] = useState<'lines' | 'units' | 'sections' | 'defects'>('lines');

  // Filters for Lines tab
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filters for Defects tab
  const [defectSearch, setDefectSearch] = useState('');
  const [defectCategoryFilter, setDefectCategoryFilter] = useState<string>('ALL');
  const [defectSeverityFilter, setDefectSeverityFilter] = useState<string>('ALL');
  const [defectCommonFilter, setDefectCommonFilter] = useState<'ALL' | 'COMMON' | 'REGULAR'>('ALL');

  // Modals state
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProductionUnit | null>(null);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ProductionSection | null>(null);

  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState<ProductionDefectItem | null>(null);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'line' | 'unit' | 'section' | 'defect';
    id: string;
    title: string;
  } | null>(null);

  // Load from store
  const refreshData = () => {
    setUnits(getProductionUnits());
    setSections(getProductionSections());
    setLines(getProductionLines());
    setDefects(getProductionDefects());
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener('erp_production_management_updated', handleUpdate);
    window.addEventListener('erp_production_defects_updated', handleUpdate);
    return () => {
      window.removeEventListener('erp_production_management_updated', handleUpdate);
      window.removeEventListener('erp_production_defects_updated', handleUpdate);
    };
  }, []);

  // Filtered Lines
  const filteredLines = useMemo(() => {
    return lines.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.lineCode.toLowerCase().includes(q) ||
        l.lineChief.toLowerCase().includes(q) ||
        l.qualityController.toLowerCase().includes(q) ||
        l.unitName.toLowerCase().includes(q) ||
        l.sectionName.toLowerCase().includes(q);

      const matchesUnit = unitFilter === 'ALL' || l.unitName === unitFilter || l.unitId === unitFilter;
      const matchesSection =
        sectionFilter === 'ALL' || l.sectionName === sectionFilter || l.sectionId === sectionFilter;
      const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;

      return matchesSearch && matchesUnit && matchesSection && matchesStatus;
    });
  }, [lines, searchQuery, unitFilter, sectionFilter, statusFilter]);

  // Unique Chiefs & QCs
  const uniqueChiefs = useMemo(
    () => Array.from(new Set(lines.map((l) => l.lineChief).filter(Boolean))),
    [lines]
  );
  const uniqueQCs = useMemo(
    () => Array.from(new Set(lines.map((l) => l.qualityController).filter(Boolean))),
    [lines]
  );

  // Handle Save Line
  const handleSaveLine = (lineData: Partial<ProductionLine>) => {
    if (editingLine) {
      const updated = lines.map((l) => (l.id === editingLine.id ? ({ ...l, ...lineData } as ProductionLine) : l));
      saveProductionLines(updated);
      setLines(updated);
      showToast(`Updated ${lineData.name} — Chief: ${lineData.lineChief}, QC: ${lineData.qualityController}`);
    } else {
      const newLine: ProductionLine = {
        id: `line-${Date.now()}`,
        name: lineData.name || 'New Line',
        lineCode: lineData.lineCode || `L-${lines.length + 1}`,
        unitId: lineData.unitId || units[0]?.id || 'unit-01',
        unitName: lineData.unitName || units[0]?.name || 'Unit 01',
        sectionId: lineData.sectionId || sections[0]?.id || 'sec-01',
        sectionName: lineData.sectionName || sections[0]?.name || 'Sewing Floor',
        lineChief: lineData.lineChief || 'Unassigned Chief',
        qualityController: lineData.qualityController || 'Unassigned QC',
        targetCapacityPerHour: lineData.targetCapacityPerHour || 140,
        operatorCount: lineData.operatorCount || 48,
        machineCount: lineData.machineCount || 50,
        status: lineData.status || 'ACTIVE',
        remarks: lineData.remarks || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [newLine, ...lines];
      saveProductionLines(updated);
      setLines(updated);
      showToast(`Added new line ${newLine.name} with Chief ${newLine.lineChief} & QC ${newLine.qualityController}`);
    }
    setIsLineModalOpen(false);
    setEditingLine(null);
  };

  // Handle Save Unit
  const handleSaveUnit = (unitData: Partial<ProductionUnit>) => {
    if (editingUnit) {
      const updated = units.map((u) => (u.id === editingUnit.id ? ({ ...u, ...unitData } as ProductionUnit) : u));
      saveProductionUnits(updated);
      setUnits(updated);
      showToast(`Updated Manufacturing Unit: ${unitData.name}`);
    } else {
      const newUnit: ProductionUnit = {
        id: `unit-${Date.now()}`,
        name: unitData.name || 'New Unit',
        unitCode: unitData.unitCode || `UNIT-0${units.length + 1}`,
        location: unitData.location || 'Dhaka, Bangladesh',
        managerName: unitData.managerName || '',
        status: unitData.status || 'ACTIVE',
        description: unitData.description || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [...units, newUnit];
      saveProductionUnits(updated);
      setUnits(updated);
      showToast(`Added Manufacturing Unit: ${newUnit.name}`);
    }
    setIsUnitModalOpen(false);
    setEditingUnit(null);
  };

  // Handle Save Section
  const handleSaveSection = (secData: Partial<ProductionSection>) => {
    if (editingSection) {
      const updated = sections.map((s) => (s.id === editingSection.id ? ({ ...s, ...secData } as ProductionSection) : s));
      saveProductionSections(updated);
      setSections(updated);
      showToast(`Updated Section: ${secData.name}`);
    } else {
      const newSec: ProductionSection = {
        id: `sec-${Date.now()}`,
        name: secData.name || 'New Section',
        sectionCode: secData.sectionCode || `SEC-0${sections.length + 1}`,
        unitId: secData.unitId || units[0]?.id || 'unit-01',
        unitName: secData.unitName || units[0]?.name || 'Unit 01',
        inchargeName: secData.inchargeName || '',
        status: secData.status || 'ACTIVE',
        description: secData.description || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [...sections, newSec];
      saveProductionSections(updated);
      setSections(updated);
      showToast(`Added Section: ${newSec.name}`);
    }
    setIsSectionModalOpen(false);
    setEditingSection(null);
  };

  // Handle Save Defect
  const handleSaveDefect = (defectData: Partial<ProductionDefectItem>) => {
    if (editingDefect) {
      const updated = updateProductionDefect(editingDefect.id, defectData);
      setDefects(updated);
      showToast(`Updated defect: ${defectData.name || editingDefect.name}`);
    } else {
      const newDef = addProductionDefect({
        name: defectData.name || 'New Defect',
        code: defectData.code,
        category: (defectData.category as ProductionDefectCategory) || 'Sewing',
        severity: defectData.severity || 'MAJOR',
        isCommon: defectData.isCommon ?? true,
        description: defectData.description || '',
      });
      setDefects(getProductionDefects());
      showToast(`Added defect: ${newDef.name} (${newDef.category})`);
    }
    setIsDefectModalOpen(false);
    setEditingDefect(null);
  };

  // Quick toggle common tap-palette state
  const handleToggleCommon = (id: string, name: string) => {
    const updated = toggleCommonProductionDefect(id);
    setDefects(updated);
    const item = updated.find((d) => d.id === id);
    showToast(
      item?.isCommon
        ? `Added "${name}" to Quick Tap Palette`
        : `Removed "${name}" from Quick Tap Palette`
    );
  };

  // Reset to default standard defects
  const handleResetDefects = () => {
    if (
      window.confirm(
        'Reset common QC defect list to factory garment defaults? Custom entries will be restored to the 19 standard defects.'
      )
    ) {
      const reset = resetProductionDefectsToDefault();
      setDefects(reset);
      showToast('Reset defect list to factory defaults (19 standard defects)');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'line') {
      const updated = lines.filter((l) => l.id !== itemToDelete.id);
      saveProductionLines(updated);
      setLines(updated);
      showToast(`Deleted production line ${itemToDelete.title}`);
    } else if (itemToDelete.type === 'unit') {
      const updated = units.filter((u) => u.id !== itemToDelete.id);
      saveProductionUnits(updated);
      setUnits(updated);
      showToast(`Deleted manufacturing unit ${itemToDelete.title}`);
    } else if (itemToDelete.type === 'section') {
      const updated = sections.filter((s) => s.id !== itemToDelete.id);
      saveProductionSections(updated);
      setSections(updated);
      showToast(`Deleted section ${itemToDelete.title}`);
    } else if (itemToDelete.type === 'defect') {
      const updated = deleteProductionDefect(itemToDelete.id);
      setDefects(updated);
      showToast(`Deleted defect ${itemToDelete.title}`);
    }
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 5 KEY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Manufacturing Units"
          value={`${units.length} Units`}
          subtitle={`${units.filter((u) => u.status === 'ACTIVE').length} operational facilities`}
          icon={Building2}
          tone="blue"
        />
        <StatCard
          title="Active Sections"
          value={`${sections.length} Sections`}
          subtitle="Sewing, Cutting, Finishing & QA"
          icon={Layers}
          tone="indigo"
        />
        <StatCard
          title="Production Lines"
          value={`${lines.length} Lines`}
          subtitle={`${lines.filter((l) => l.status === 'ACTIVE').length} currently active`}
          icon={Factory}
          tone="emerald"
        />
        <StatCard
          title="Line Chiefs Assigned"
          value={`${uniqueChiefs.length} Chiefs`}
          subtitle="Supervising floor operations"
          icon={UserCheck}
          tone="purple"
        />
        <StatCard
          title="Quality Controllers"
          value={`${uniqueQCs.length} QC Officers`}
          subtitle="Hourly AQL inspection officers"
          icon={ShieldCheck}
          tone="rose"
        />
      </div>

      {/* SUB-TABS & ACTION TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('lines')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'lines'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Lines & Assigned Staff ({lines.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('sections')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'sections'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sections ({sections.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('units')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'units'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Units / Plants ({units.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('defects')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'defects'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Common Defects & QC Palette ({defects.length})</span>
          </button>
        </div>

        {/* Global Add Actions */}
        {canCreate && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingDefect(null);
                setIsDefectModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-700" />
              <span>Add Defect</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingUnit(null);
                setIsUnitModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>Add Unit</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingSection(null);
                setIsSectionModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>Add Section</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingLine(null);
                setIsLineModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Production Line</span>
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: PRODUCTION LINES & ROLES TABLE                         */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'lines' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 p-5">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by line, Line Chief, Quality Controller..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Unit Filter */}
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Units</option>
                {units.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>

              {/* Section Filter */}
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{filteredLines.length}</strong> of{' '}
              {lines.length} lines
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-3">Line Name & Code</th>
                  <th className="py-3 px-3">Unit & Section</th>
                  <th className="py-3 px-3">
                    <span className="inline-flex items-center gap-1.5 text-blue-700">
                      <UserCheck className="w-3.5 h-3.5" />
                      Assigned Line Chief
                    </span>
                  </th>
                  <th className="py-3 px-3">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Assigned Quality Controller
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right">Capacity & Pacing</th>
                  <th className="py-3 px-3 text-right">Operators</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Factory className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No production lines found.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try resetting filters or click &quot;Add Production Line&quot; to configure a new line.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLines.map((line) => (
                    <tr key={line.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Line Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{line.name}</div>
                        <div className="text-[10px] font-mono text-blue-600 font-semibold mt-0.5">
                          Code: {line.lineCode}
                        </div>
                        {line.remarks && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                            {line.remarks}
                          </div>
                        )}
                      </td>

                      {/* Unit & Section */}
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{line.unitName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          {line.sectionName}
                        </div>
                      </td>

                      {/* Line Chief (Supervisor) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0 border border-blue-200">
                            {line.lineChief.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{line.lineChief}</div>
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                              Line Chief / Supervisor
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Quality Controller */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[11px] shrink-0 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{line.qualityController}</div>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                              Quality Controller / QC
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Target Capacity */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-slate-800">
                          {line.targetCapacityPerHour || 140} pcs/hr
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Std Output Target
                        </span>
                      </td>

                      {/* Operators */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-slate-800">{line.operatorCount || 48}</div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {line.machineCount ? `${line.machineCount} m/c` : 'Operators'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            line.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : line.status === 'MAINTENANCE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {line.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLine(line);
                                setIsLineModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                              title="Edit Line & Reassign Line Chief / Quality Controller"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete({
                                  type: 'line',
                                  id: line.id,
                                  title: line.name,
                                });
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                              title="Delete Line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!canEdit && !canDelete && (
                            <span className="text-[10px] text-slate-400 italic">Read-only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: SECTIONS MANAGEMENT                                    */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'sections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((sec) => {
            const secLines = lines.filter(
              (l) => l.sectionName === sec.name || l.sectionId === sec.id
            );
            return (
              <div
                key={sec.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                      {sec.sectionCode}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{sec.name}</h3>
                    <p className="text-xs text-slate-500">{sec.unitName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSection(sec);
                          setIsSectionModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Edit Section"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          setItemToDelete({
                            type: 'section',
                            id: sec.id,
                            title: sec.name,
                          })
                        }
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {sec.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">{sec.description}</p>
                )}

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Section Incharge:</span>
                  <span className="font-bold text-slate-800">{sec.inchargeName || 'Unassigned'}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Assigned Lines:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {secLines.length} Lines
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: UNITS / PLANTS MANAGEMENT                              */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'units' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.map((unit) => {
            const unitLines = lines.filter((l) => l.unitName === unit.name || l.unitId === unit.id);
            const unitSections = sections.filter(
              (s) => s.unitName === unit.name || s.unitId === unit.id
            );

            return (
              <div
                key={unit.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{unit.name}</h3>
                        <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                          {unit.unitCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{unit.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUnit(unit);
                          setIsUnitModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Edit Unit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          setItemToDelete({
                            type: 'unit',
                            id: unit.id,
                            title: unit.name,
                          })
                        }
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {unit.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">{unit.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold">Factory Manager</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {unit.managerName || 'Unassigned'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold">Operations Scope</div>
                    <div className="font-bold text-blue-700 mt-0.5">
                      {unitSections.length} Sections • {unitLines.length} Lines
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 4: COMMON DEFECTS & QC PALETTE MANAGEMENT               */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'defects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 p-5">
          {/* Defect Quick Stat Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Defect Master</div>
              <div className="text-base font-black font-mono text-slate-800 mt-0.5">{defects.length} cataloged</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-700">Quick Tap-to-Add Active</div>
              <div className="text-base font-black font-mono text-amber-900 mt-0.5">
                {defects.filter((d) => d.isCommon).length} in tap palette
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-700">Sewing Section Defects</div>
              <div className="text-base font-black font-mono text-indigo-900 mt-0.5">
                {defects.filter((d) => d.category === 'Sewing').length} standard
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-rose-700">Critical / Major Severity</div>
              <div className="text-base font-black font-mono text-rose-900 mt-0.5">
                {defects.filter((d) => d.severity === 'CRITICAL' || d.severity === 'MAJOR').length} high risk
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={defectSearch}
                  onChange={(e) => setDefectSearch(e.target.value)}
                  placeholder="Search defect by name, code (e.g. DEF-SEW-01), description..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={defectCategoryFilter}
                onChange={(e) => setDefectCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Sewing">Sewing</option>
                <option value="Fabric">Fabric</option>
                <option value="Cutting">Cutting</option>
                <option value="Finishing">Finishing</option>
                <option value="Trims">Trims</option>
                <option value="Packaging">Packaging</option>
              </select>

              {/* Severity Filter */}
              <select
                value={defectSeverityFilter}
                onChange={(e) => setDefectSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="MINOR">Minor</option>
                <option value="MAJOR">Major</option>
                <option value="CRITICAL">Critical</option>
              </select>

              {/* Common Quick-Tap Filter */}
              <select
                value={defectCommonFilter}
                onChange={(e) => setDefectCommonFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Defects</option>
                <option value="COMMON">Only Quick-Tap Palette</option>
                <option value="REGULAR">Regular Catalog Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleResetDefects}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Restore default factory defects (19 standard garment defects)"
                >
                  <span>Reset Defaults</span>
                </button>
              )}
              {canCreate && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDefect(null);
                    setIsDefectModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Defect</span>
                </button>
              )}
            </div>
          </div>

          {/* Defects Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-3">Defect Name & Code</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Quick-Tap Status (Entry Form)</th>
                  <th className="py-3 px-3">Description / Quality Standard</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defects
                  .filter((d) => {
                    const q = defectSearch.toLowerCase().trim();
                    const matchesSearch =
                      !q ||
                      d.name.toLowerCase().includes(q) ||
                      d.code.toLowerCase().includes(q) ||
                      (d.description || '').toLowerCase().includes(q);
                    const matchesCat =
                      defectCategoryFilter === 'ALL' || d.category === defectCategoryFilter;
                    const matchesSev =
                      defectSeverityFilter === 'ALL' || d.severity === defectSeverityFilter;
                    const matchesCom =
                      defectCommonFilter === 'ALL' ||
                      (defectCommonFilter === 'COMMON' ? d.isCommon : !d.isCommon);
                    return matchesSearch && matchesCat && matchesSev && matchesCom;
                  })
                  .map((def) => {
                    const categoryColors: Record<string, string> = {
                      Sewing: 'bg-purple-50 text-purple-700 border-purple-200',
                      Fabric: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                      Cutting: 'bg-amber-50 text-amber-700 border-amber-200',
                      Finishing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      Trims: 'bg-pink-50 text-pink-700 border-pink-200',
                      Packaging: 'bg-slate-100 text-slate-700 border-slate-200',
                    };

                    const severityColors: Record<string, string> = {
                      MINOR: 'bg-blue-50 text-blue-700 border-blue-200',
                      MAJOR: 'bg-amber-50 text-amber-800 border-amber-300',
                      CRITICAL: 'bg-rose-50 text-rose-800 border-rose-300',
                    };

                    return (
                      <tr key={def.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{def.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{def.code}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                              categoryColors[def.category] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {def.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                              severityColors[def.severity] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {def.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleCommon(def.id, def.name)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                              def.isCommon
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
                            }`}
                            title="Click to toggle whether this defect appears in the Quick Tap Palette in Production Entry"
                          >
                            <Sparkles
                              className={`w-3.5 h-3.5 ${
                                def.isCommon ? 'text-amber-600 fill-amber-500' : 'text-slate-400'
                              }`}
                            />
                            <span>{def.isCommon ? '⚡ In Quick Tap Bar' : 'Off (Click to Enable)'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-600 text-[11px] max-w-xs truncate" title={def.description}>
                            {def.description || 'Standard industry inspection defect.'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDefect(def);
                                  setIsDefectModalOpen(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                title="Edit Defect"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  setItemToDelete({
                                    type: 'defect',
                                    id: def.id,
                                    title: def.name,
                                  })
                                }
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Delete Defect"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!canEdit && !canDelete && (
                              <span className="text-[10px] text-slate-400 italic">Read-only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: ADD / EDIT LINE (ASSIGN LINE CHIEF & QUALITY CONTROLLER) */}
      {/* ------------------------------------------------------------- */}
      {isLineModalOpen && (
        <LineModal
          line={editingLine}
          units={units}
          sections={sections}
          onSave={handleSaveLine}
          onClose={() => {
            setIsLineModalOpen(false);
            setEditingLine(null);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: ADD / EDIT UNIT                                      */}
      {/* ------------------------------------------------------------- */}
      {isUnitModalOpen && (
        <UnitModal
          unit={editingUnit}
          onSave={handleSaveUnit}
          onClose={() => {
            setIsUnitModalOpen(false);
            setEditingUnit(null);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: ADD / EDIT SECTION                                   */}
      {/* ------------------------------------------------------------- */}
      {isSectionModalOpen && (
        <SectionModal
          section={editingSection}
          units={units}
          onSave={handleSaveSection}
          onClose={() => {
            setIsSectionModalOpen(false);
            setEditingSection(null);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: ADD / EDIT DEFECT                                    */}
      {/* ------------------------------------------------------------- */}
      {isDefectModalOpen && (
        <DefectModal
          defect={editingDefect}
          onSave={handleSaveDefect}
          onClose={() => {
            setIsDefectModalOpen(false);
            setEditingDefect(null);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: DELETE CONFIRMATION                                  */}
      {/* ------------------------------------------------------------- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Confirm Deletion of {itemToDelete.type.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Are you sure you want to remove <strong className="text-slate-900">{itemToDelete.title}</strong>?
              Records created with this {itemToDelete.type} will retain their historical snapshot.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
              >
                Delete {itemToDelete.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// SUB-MODAL: LINE CONFIGURATION (LINE CHIEF & QC ASSIGNMENT)
// -------------------------------------------------------------------
interface LineModalProps {
  line: ProductionLine | null;
  units: ProductionUnit[];
  sections: ProductionSection[];
  onSave: (data: Partial<ProductionLine>) => void;
  onClose: () => void;
}

function LineModal({ line, units, sections, onSave, onClose }: LineModalProps) {
  const [name, setName] = useState(line?.name || '');
  const [lineCode, setLineCode] = useState(line?.lineCode || '');
  const [unitId, setUnitId] = useState(line?.unitId || units[0]?.id || '');
  const [sectionId, setSectionId] = useState(line?.sectionId || sections[0]?.id || '');
  const [lineChief, setLineChief] = useState(line?.lineChief || '');
  const [qualityController, setQualityController] = useState(line?.qualityController || '');
  const [targetCapacityPerHour, setTargetCapacityPerHour] = useState<number>(
    line?.targetCapacityPerHour || 140
  );
  const [operatorCount, setOperatorCount] = useState<number>(line?.operatorCount || 48);
  const [machineCount, setMachineCount] = useState<number>(line?.machineCount || 52);
  const [status, setStatus] = useState<'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'>(
    line?.status || 'ACTIVE'
  );
  const [remarks, setRemarks] = useState(line?.remarks || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Line name is required.');
      return;
    }
    if (!lineChief.trim()) {
      setError('Please assign a Line Chief to this line.');
      return;
    }
    if (!qualityController.trim()) {
      setError('Please assign a Quality Controller to this line.');
      return;
    }

    const selUnit = units.find((u) => u.id === unitId) || units[0];
    const selSection = sections.find((s) => s.id === sectionId) || sections[0];

    onSave({
      name,
      lineCode: lineCode || `L-${Math.floor(Math.random() * 90 + 10)}`,
      unitId: selUnit.id,
      unitName: selUnit.name,
      sectionId: selSection.id,
      sectionName: selSection.name,
      lineChief,
      qualityController,
      targetCapacityPerHour,
      operatorCount,
      machineCount,
      status,
      remarks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {line ? 'Edit Production Line & Roles' : 'Add New Production Line'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Configure line capacity and assign designated Line Chief and Quality Controller.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Line Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Line Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sewing Line 09 (Polo Tops)"
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Line Code */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Line Code</label>
              <input
                type="text"
                value={lineCode}
                onChange={(e) => setLineCode(e.target.value)}
                placeholder="e.g. L-09"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Manufacturing Unit */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Manufacturing Unit</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Section / Department</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CRITICAL ROLE ASSIGNMENTS HIGHLIGHT BOX */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-emerald-50/60 border border-blue-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Assigned Personnel for this Line</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Line Chief Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Assign Line Chief <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lineChief}
                  onChange={(e) => setLineChief(e.target.value)}
                  placeholder="e.g. Kabir Hossain (Senior Line Sup)"
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-blue-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
                  required
                />
                <p className="text-[10px] text-blue-700/80">
                  Floor supervisor responsible for production pacing.
                </p>
              </div>

              {/* Quality Controller Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Assign Quality Controller <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={qualityController}
                  onChange={(e) => setQualityController(e.target.value)}
                  placeholder="e.g. Md. Rafiqul Islam (QC Auditor)"
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  required
                />
                <p className="text-[10px] text-emerald-700/80">
                  Quality inspector responsible for hourly AQL audits.
                </p>
              </div>
            </div>
          </div>

          {/* Capacities & Pacing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Target Output / Hr</label>
              <input
                type="number"
                value={targetCapacityPerHour}
                onChange={(e) => setTargetCapacityPerHour(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Operators Count</label>
              <input
                type="number"
                value={operatorCount}
                onChange={(e) => setOperatorCount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Remarks / Product Focus</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Focused on heavy knit hoodies and French Terry styles"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{line ? 'Save Line Changes' : 'Create Line'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// SUB-MODAL: UNIT CONFIGURATION
// -------------------------------------------------------------------
interface UnitModalProps {
  unit: ProductionUnit | null;
  onSave: (data: Partial<ProductionUnit>) => void;
  onClose: () => void;
}

function UnitModal({ unit, onSave, onClose }: UnitModalProps) {
  const [name, setName] = useState(unit?.name || '');
  const [unitCode, setUnitCode] = useState(unit?.unitCode || '');
  const [location, setLocation] = useState(unit?.location || '');
  const [managerName, setManagerName] = useState(unit?.managerName || '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(unit?.status || 'ACTIVE');
  const [description, setDescription] = useState(unit?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name,
      unitCode: unitCode || `UNIT-${Math.floor(Math.random() * 90 + 10)}`,
      location: location || 'Dhaka, Bangladesh',
      managerName,
      status,
      description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {unit ? 'Edit Manufacturing Unit' : 'Add Manufacturing Unit'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Unit Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Unit 05 (Narayanganj Plant)"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Unit Code</label>
              <input
                type="text"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder="e.g. UNIT-05"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Location / Address</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kanchpur, Narayanganj"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Factory / Unit Manager</label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="e.g. Engr. Md. Enamul Haque"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Facility details, certifications, product categories..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Save Unit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// SUB-MODAL: SECTION CONFIGURATION
// -------------------------------------------------------------------
interface SectionModalProps {
  section: ProductionSection | null;
  units: ProductionUnit[];
  onSave: (data: Partial<ProductionSection>) => void;
  onClose: () => void;
}

function SectionModal({ section, units, onSave, onClose }: SectionModalProps) {
  const [name, setName] = useState(section?.name || '');
  const [sectionCode, setSectionCode] = useState(section?.sectionCode || '');
  const [unitId, setUnitId] = useState(section?.unitId || units[0]?.id || '');
  const [inchargeName, setInchargeName] = useState(section?.inchargeName || '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(section?.status || 'ACTIVE');
  const [description, setDescription] = useState(section?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const selUnit = units.find((u) => u.id === unitId) || units[0];
    onSave({
      name,
      sectionCode: sectionCode || `SEC-${Math.floor(Math.random() * 90 + 10)}`,
      unitId: selUnit.id,
      unitName: selUnit.name,
      inchargeName,
      status,
      description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {section ? 'Edit Section' : 'Add Section'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Section Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Embroidery & Screen Printing Floor"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Section Code</label>
              <input
                type="text"
                value={sectionCode}
                onChange={(e) => setSectionCode(e.target.value)}
                placeholder="e.g. SEC-EMB"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Manufacturing Unit</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Section Incharge</label>
            <input
              type="text"
              value={inchargeName}
              onChange={(e) => setInchargeName(e.target.value)}
              placeholder="e.g. Md. Kabir Hossain"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Department machinery, process flow, and floor layout..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Save Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// SUB-MODAL: DEFECT MASTER & QC PALETTE
// -------------------------------------------------------------------
interface DefectModalProps {
  defect: ProductionDefectItem | null;
  onSave: (data: Partial<ProductionDefectItem>) => void;
  onClose: () => void;
}

function DefectModal({ defect, onSave, onClose }: DefectModalProps) {
  const [name, setName] = useState(defect?.name || '');
  const [code, setCode] = useState(defect?.code || '');
  const [category, setCategory] = useState<ProductionDefectCategory>(defect?.category || 'Sewing');
  const [severity, setSeverity] = useState<ProductionDefectSeverity>(defect?.severity || 'MAJOR');
  const [isCommon, setIsCommon] = useState<boolean>(defect ? defect.isCommon : true);
  const [description, setDescription] = useState(defect?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      code: code.trim() || `DEF-${category.substring(0, 3)}-${Math.floor(Math.random() * 900 + 100)}`,
      category,
      severity,
      isCommon,
      description: description.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {defect ? 'Edit Common Defect' : 'Add New Common Defect'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Configure defect for line QC inspectors and quick tap bar
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Defect Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Broken Stitch, Oil Stain, Needle Mark..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Defect Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. DEF-SEW-01"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Defect Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductionDefectCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                <option value="Sewing">Sewing</option>
                <option value="Fabric">Fabric</option>
                <option value="Cutting">Cutting</option>
                <option value="Finishing">Finishing</option>
                <option value="Trims">Trims</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as ProductionDefectSeverity)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                <option value="MINOR">Minor (Minor cosmetic alteration)</option>
                <option value="MAJOR">Major (Standard rework / stitch defect)</option>
                <option value="CRITICAL">Critical (AQL rejection / structural flaw)</option>
              </select>
            </div>
            <div className="space-y-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCommon}
                  onChange={(e) => setIsCommon(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold text-amber-950">Show in Quick Tap Bar</span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Inspection Standard & Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Broken or severed stitch loop along seam line exceeding 1 stitch length..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
            >
              Save Defect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
