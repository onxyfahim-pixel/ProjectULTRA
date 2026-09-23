'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  AlertOctagon,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  Filter,
  PieChart,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  Download,
  CheckCircle2,
  Layers,
  MapPin,
  Sliders,
  Image as ImageIcon,
  Tag,
  Search,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { DefectDefinition } from '@/lib/types/modules';
import { MOCK_DEFECTS_LIBRARY } from '@/lib/db/modules-mock-data';
import { DefectDetailsPage } from '../modules/defect-library/DefectDetailsPage';
import { DefectEntryPage } from '../modules/defect-library/DefectEntryPage';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';

type DefectSubView =
  | { type: 'none' }
  | { type: 'details'; defect: DefectDefinition }
  | { type: 'add' }
  | { type: 'edit'; defect: DefectDefinition };

const SEVERITY_BADGES: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: 'Critical', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
  MAJOR: { label: 'Major', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  MINOR: { label: 'Minor', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
};

const ZONE_BADGES: Record<string, { label: string; cls: string }> = {
  ZONE_A_VISIBLE: { label: 'Zone A (Front)', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  ZONE_B_LESS_VISIBLE: { label: 'Zone B (Side/Back)', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ZONE_C_INSIDE: { label: 'Zone C (Inside)', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  ZONE_A: { label: 'Zone A', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  ZONE_B: { label: 'Zone B', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ZONE_C: { label: 'Zone C', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export function DefectsLibraryView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [defects, setDefects] = useState<DefectDefinition[]>(MOCK_DEFECTS_LIBRARY);

  // Dedicated Separate Sub-Pages State
  const [subView, setSubView] = useState<DefectSubView>({ type: 'none' });

  // Keep details page refreshed if defect updates
  React.useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = defects.find((d) => d.id === subView.defect.id);
      if (refreshed && refreshed !== subView.defect) {
        setSubView({ type: 'details', defect: refreshed });
      }
    }
  }, [defects]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    defects: DefectDefinition[];
  } | null>(null);

  // View Layout Mode: Table vs Visual Card Grid
  const [layoutMode, setLayoutMode] = useState<'table' | 'grid'>('table');
  const [gridSearch, setGridSearch] = useState<string>('');

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');

  // Filtered List
  const filteredDefects = defects.filter((d) => {
    const matchesCategory = categoryFilter === 'ALL' || d.category === categoryFilter;
    const matchesSeverity = severityFilter === 'ALL' || d.severity === severityFilter;
    const matchesZone =
      zoneFilter === 'ALL' ||
      d.zone === zoneFilter ||
      (zoneFilter === 'ZONE_A' && (d.zone === 'ZONE_A' || d.zone === 'ZONE_A_VISIBLE')) ||
      (zoneFilter === 'ZONE_B' && (d.zone === 'ZONE_B' || d.zone === 'ZONE_B_LESS_VISIBLE')) ||
      (zoneFilter === 'ZONE_C' && (d.zone === 'ZONE_C' || d.zone === 'ZONE_C_INSIDE'));

    const q = gridSearch.toLowerCase().trim();
    const matchesGridSearch =
      !q ||
      d.defectCode.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.location && d.location.toLowerCase().includes(q)) ||
      (d.isoStandard && d.isoStandard.toLowerCase().includes(q)) ||
      (d.rootCause && d.rootCause.toLowerCase().includes(q)) ||
      (d.rootCauseHint && d.rootCauseHint.toLowerCase().includes(q));

    return matchesCategory && matchesSeverity && matchesZone && matchesGridSearch;
  });

  // Handlers for Save, Edit, Duplicate, Delete
  const handleSaveDefect = (savedDefect: DefectDefinition) => {
    const index = defects.findIndex((d) => d.id === savedDefect.id);
    if (index >= 0) {
      setDefects(defects.map((d) => (d.id === savedDefect.id ? savedDefect : d)));
      showToast(`Updated defect definition ${savedDefect.defectCode}`);
      setSubView({ type: 'details', defect: savedDefect });
    } else {
      setDefects([savedDefect, ...defects]);
      showToast(`Registered new quality defect ${savedDefect.defectCode}`);
      setSubView({ type: 'none' });
    }
  };

  const handleDuplicateDefect = (def: DefectDefinition) => {
    const duplicated: DefectDefinition = {
      ...def,
      id: `def-dup-${Date.now()}`,
      defectCode: `${def.defectCode}-COPY`,
      name: `${def.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setDefects([duplicated, ...defects]);
    showToast(`Duplicated defect as ${duplicated.defectCode}`);
  };

  const handleConfirmDelete = () => {
    if (!deleteModal || deleteModal.defects.length === 0) return;
    const ids = deleteModal.defects.map((d) => d.id);
    setDefects(defects.filter((d) => !ids.includes(d.id)));

    const count = deleteModal.defects.length;
    showToast(count === 1 ? `Deleted defect ${deleteModal.defects[0].defectCode}` : `Deleted ${count} defect definitions`);

    if (subView.type === 'details' && deleteModal.defects.some((d) => d.id === subView.defect.id)) {
      setSubView({ type: 'none' });
    }

    setDeleteModal(null);
  };

  // KPIs
  const criticalCount = defects.filter((d) => d.severity === 'CRITICAL').length;
  const majorCount = defects.filter((d) => d.severity === 'MAJOR').length;
  const minorCount = defects.filter((d) => d.severity === 'MINOR').length;

  const categories = ['ALL', 'SEWING', 'FABRIC', 'STAIN_SOIL', 'MEASUREMENT', 'FINISHING', 'PACKAGING'];

  // Batch Actions - Exactly matching Buyer & Order module
  const batchActions: BatchAction<DefectDefinition>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({ isOpen: true, defects: selected });
      },
    },
    {
      label: 'Export Selected',
      variant: 'default',
      icon: <Download className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        showToast(`Exported ${selected.length} defect specification sheets (PDF/Excel)`);
      },
    },
  ];

  // Column Definitions - Rich, Interactive, Styled like Buyer & Order module
  const columns: ColumnDef<DefectDefinition>[] = [
    {
      key: 'defectImageUrl',
      header: 'Visual Standard',
      render: (item) => (
        <div className="flex items-center gap-2">
          {/* Defect Preview Thumbnail */}
          <div
            onClick={() => setSubView({ type: 'details', defect: item })}
            className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-900 shrink-0 cursor-pointer relative group"
            title="Click to view full comparison"
          >
            {item.defectImageUrl ? (
              <img src={item.defectImageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 bg-rose-600 text-white text-[8px] font-bold px-1 rounded-tl">
              Defect
            </span>
          </div>

          {/* OK Standard Thumbnail */}
          <div
            onClick={() => setSubView({ type: 'details', defect: item })}
            className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-900 shrink-0 cursor-pointer relative group hidden sm:block"
            title="Click to view full comparison"
          >
            {item.okImageUrl ? (
              <img src={item.okImageUrl} alt="Approved standard" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 bg-emerald-600 text-white text-[8px] font-bold px-1 rounded-tl">
              OK
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'defectCode',
      header: 'Code & Category',
      sortable: true,
      accessor: (item) => item.defectCode,
      cell: (item) => (
        <div>
          <span className="font-mono font-bold text-xs text-blue-700 block">
            {item.defectCode}
          </span>
          <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase">
            {item.category}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Defect Name & Anatomical Location',
      sortable: true,
      accessor: (item) => item.name,
      cell: (item) => (
        <div className="min-w-0 max-w-xs">
          <div className="font-bold text-slate-900 text-xs truncate">{item.name}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{item.location || 'Assembly Seam'}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {item.isoStandard || 'ISO 2859-1'}
          </div>
        </div>
      ),
    },
    {
      key: 'zone',
      header: 'Quality Zone',
      sortable: true,
      accessor: (item) => item.zone,
      cell: (item) => {
        const badge = ZONE_BADGES[item.zone] || ZONE_BADGES.ZONE_A_VISIBLE;
        return (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      accessor: (item) => item.severity,
      align: 'center',
      cell: (item) => {
        const badge = SEVERITY_BADGES[item.severity] || SEVERITY_BADGES.MAJOR;
        return (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'rootCause',
      header: 'Root Cause & Floor Fix (CAPA)',
      cell: (item) => (
        <div className="text-[11px] space-y-0.5 max-w-xs">
          <div className="truncate">
            <span className="font-bold text-rose-700">Cause:</span>{' '}
            <span className="text-slate-700">{item.rootCause || item.rootCauseHint || 'Mechanical tension imbalance'}</span>
          </div>
          <div className="truncate">
            <span className="font-bold text-emerald-700">Fix:</span>{' '}
            <span className="text-slate-700">{item.correctiveAction || item.correctiveActionHint || 'Calibrate machine tooling'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      cell: (item) => (
        <div className="flex items-center justify-center gap-1">
          {/* View Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', defect: item })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors cursor-pointer"
            title="View complete defect dossier & dual images"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', defect: item })}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit defect definition"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => handleDuplicateDefect(item)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Duplicate as new defect entry"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, defects: [item] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete defect entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification Matching Buyer & Order Module */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Defect Specification"
          message={
            deleteModal.defects.length === 1
              ? `Are you sure you want to permanently delete defect ${deleteModal.defects[0].defectCode} (${deleteModal.defects[0].name})?`
              : `Are you sure you want to permanently delete these ${deleteModal.defects.length} defect definitions?`
          }
          items={deleteModal.defects.map((d) => ({
            id: d.id,
            title: d.defectCode,
            subtitle: `${d.name} • ${d.category} • ${d.severity}`,
            value: d.isoStandard || 'ISO 2859-1',
          }))}
          itemTypeLabel="defect definition"
          confirmLabel="Delete Defect"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* TOP MODULE HEADER: 3 Tabs (Summary, Defect Catalog, Zones & Standards) */}
      <ModuleHeader
        title="Apparel Quality Defects Library & Visual Standards"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Defect Catalog', count: defects.length },
          { id: 'zones', label: 'Quality Zones (Zone A / B / C) & ISO Standards' },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGES */}
      {subView.type === 'details' ? (
        <DefectDetailsPage
          defect={subView.defect}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(d) => setSubView({ type: 'edit', defect: d })}
          onDuplicate={handleDuplicateDefect}
          onDelete={(d) => setDeleteModal({ isOpen: true, defects: [d] })}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <DefectEntryPage
          mode="add"
          onSave={handleSaveDefect}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <DefectEntryPage
          mode="edit"
          defect={subView.defect}
          onSave={handleSaveDefect}
          onCancel={() => setSubView({ type: 'details', defect: subView.defect })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Cards - Styled identically to Buyer & Order module */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Cataloged Defects"
                  value={defects.length.toString()}
                  subtitle="Global Industry Taxonomy"
                  icon={BookOpen}
                  tone="blue"
                  delta={{ value: '+8.3%', isPositive: true }}
                />
                <StatCard
                  title="Critical Severity Codes"
                  value={criticalCount.toString()}
                  subtitle="Zero-Tolerance Flaws"
                  icon={AlertOctagon}
                  tone="rose"
                  delta={{ value: 'Zero Tolerance', isPositive: false }}
                />
                <StatCard
                  title="Major AQL Defects"
                  value={majorCount.toString()}
                  subtitle="AQL 2.5 / 1.5 Penalties"
                  icon={ShieldAlert}
                  tone="amber"
                  delta={{ value: 'AQL Critical', isPositive: true }}
                />
                <StatCard
                  title="ISO Standards Active"
                  value="ISO 2859-1"
                  subtitle="ASTM D3990 / D5430"
                  icon={Sparkles}
                  tone="indigo"
                  delta={{ value: 'Certified', isPositive: true }}
                />
              </div>

              {/* Severity & Category Distribution Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Severity Breakdown Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-rose-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Defect Severity Tiers & AQL Impact
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">AQL Penalty Impact</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200">
                      <span className="text-[11px] text-rose-700 font-bold block">Critical (0 Tol.)</span>
                      <div className="text-2xl font-black font-mono text-rose-900 mt-1">{criticalCount}</div>
                      <span className="text-[10px] text-slate-500">Needle cut, hole</span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                      <span className="text-[11px] text-amber-700 font-bold block">Major Defect</span>
                      <div className="text-2xl font-black font-mono text-amber-900 mt-1">{majorCount}</div>
                      <span className="text-[10px] text-slate-500">Puckering, stain</span>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                      <span className="text-[11px] text-blue-700 font-bold block">Minor Defect</span>
                      <div className="text-2xl font-black font-mono text-blue-900 mt-1">{minorCount}</div>
                      <span className="text-[10px] text-slate-500">Loose thread</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register New Quality Defect</span>
                  </button>
                </div>

                {/* Category Breakdown Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Defects by Process Domain
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Classification</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {categories.filter((c) => c !== 'ALL').map((cat) => {
                      const count = defects.filter((d) => d.category === cat).length;
                      const pct = Math.round((count / (defects.length || 1)) * 100);
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-slate-700">
                            <span className="font-semibold">{cat.replace('_', ' ')}</span>
                            <span className="font-mono text-slate-500">{count} codes ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEFECT CATALOG (TABLE VIEW OR VISUAL CARD GRID VIEW) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {layoutMode === 'table' ? (
                /* TABLE VIEW WITH DATA TABLE */
                <DataTable
                  id="defects-library-table"
                  data={filteredDefects}
                  columns={columns}
                  searchPlaceholder="Search defect code, name, root cause, location, or standard..."
                  searchableKeys={['defectCode', 'name', 'category', 'description', 'location', 'isoStandard', 'rootCauseHint']}
                  secondaryAction={
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Category Filter */}
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="SEWING">Sewing</option>
                        <option value="FABRIC">Fabric</option>
                        <option value="STAIN_SOIL">Stain / Soil</option>
                        <option value="MEASUREMENT">Measurement</option>
                        <option value="FINISHING">Finishing</option>
                        <option value="PACKAGING">Packaging</option>
                      </select>

                      {/* Severity Filter */}
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical (0 Tol.)</option>
                        <option value="MAJOR">Major (AQL)</option>
                        <option value="MINOR">Minor (Cosmetic)</option>
                      </select>

                      {/* Zone Filter */}
                      <select
                        value={zoneFilter}
                        onChange={(e) => setZoneFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Quality Zones</option>
                        <option value="ZONE_A">Zone A (Prominent)</option>
                        <option value="ZONE_B">Zone B (Secondary)</option>
                        <option value="ZONE_C">Zone C (Interior)</option>
                      </select>

                      {/* View Mode Switcher: Table vs Grid */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setLayoutMode('table')}
                          className="p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white text-blue-700 shadow-xs"
                          title="Table List View"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Table</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLayoutMode('grid')}
                          className="p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
                          title="Visual Card Grid View"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Grid</span>
                        </button>
                      </div>
                    </div>
                  }
                  primaryAction={
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'add' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Defect</span>
                    </button>
                  }
                  batchActions={batchActions}
                />
              ) : (
                /* VISUAL CARD GRID VIEW */
                <div className="space-y-4">
                  {/* Grid Toolbar: Search, Filters, View Mode Toggle, Add Defect Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={gridSearch}
                        onChange={(e) => setGridSearch(e.target.value)}
                        placeholder="Search defect code, name, root cause, location..."
                        className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                      />
                      {gridSearch && (
                        <button
                          type="button"
                          onClick={() => setGridSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      {/* Category Filter */}
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="SEWING">Sewing</option>
                        <option value="FABRIC">Fabric</option>
                        <option value="STAIN_SOIL">Stain / Soil</option>
                        <option value="MEASUREMENT">Measurement</option>
                        <option value="FINISHING">Finishing</option>
                        <option value="PACKAGING">Packaging</option>
                      </select>

                      {/* Severity Filter */}
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical (0 Tol.)</option>
                        <option value="MAJOR">Major (AQL)</option>
                        <option value="MINOR">Minor (Cosmetic)</option>
                      </select>

                      {/* Zone Filter */}
                      <select
                        value={zoneFilter}
                        onChange={(e) => setZoneFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Quality Zones</option>
                        <option value="ZONE_A">Zone A (Prominent)</option>
                        <option value="ZONE_B">Zone B (Secondary)</option>
                        <option value="ZONE_C">Zone C (Interior)</option>
                      </select>

                      {/* View Mode Switcher: Table vs Grid */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setLayoutMode('table')}
                          className="p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
                          title="Table List View"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Table</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLayoutMode('grid')}
                          className="p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white text-blue-700 shadow-xs"
                          title="Visual Card Grid View"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Grid</span>
                        </button>
                      </div>

                      {/* Add Defect Button - Matching Buyer & Order module */}
                      <button
                        type="button"
                        onClick={() => setSubView({ type: 'add' })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Defect</span>
                      </button>
                    </div>
                  </div>

                  {/* Grid Result Count Bar */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                      Showing <strong className="text-slate-800">{filteredDefects.length}</strong> defect standard cards
                    </span>
                    {(categoryFilter !== 'ALL' || severityFilter !== 'ALL' || zoneFilter !== 'ALL' || gridSearch) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter('ALL');
                          setSeverityFilter('ALL');
                          setZoneFilter('ALL');
                          setGridSearch('');
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {/* Empty State */}
                  {filteredDefects.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                      <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800 mb-1">No defect definitions found</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                        No quality defects match your current search and filter criteria. Try resetting filters or register a new defect.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter('ALL');
                          setSeverityFilter('ALL');
                          setZoneFilter('ALL');
                          setGridSearch('');
                        }}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer mr-2"
                      >
                        Clear Filters
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubView({ type: 'add' })}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                      >
                        + Add New Defect
                      </button>
                    </div>
                  ) : (
                    /* RESPONSIVE CARD GRID */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {filteredDefects.map((item) => {
                        const sevBadge = SEVERITY_BADGES[item.severity] || SEVERITY_BADGES.MAJOR;
                        const zoneBadge = ZONE_BADGES[item.zone] || ZONE_BADGES.ZONE_A_VISIBLE;

                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group"
                          >
                            {/* Visual Header: Dual Image Comparison Thumbnails */}
                            <div className="grid grid-cols-2 gap-0.5 bg-slate-900 h-28 relative overflow-hidden">
                              {/* Left: Defect Sample */}
                              <div
                                onClick={() => setSubView({ type: 'details', defect: item })}
                                className="relative h-full overflow-hidden cursor-pointer group/img"
                              >
                                {item.defectImageUrl ? (
                                  <img
                                    src={item.defectImageUrl}
                                    alt={`Defect: ${item.name}`}
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                                    <ImageIcon className="w-5 h-5 text-slate-600" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 bg-rose-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                                  Defect
                                </div>
                              </div>

                              {/* Right: OK Golden Sample */}
                              <div
                                onClick={() => setSubView({ type: 'details', defect: item })}
                                className="relative h-full overflow-hidden cursor-pointer group/img"
                              >
                                {item.okImageUrl ? (
                                  <img
                                    src={item.okImageUrl}
                                    alt={`OK standard: ${item.name}`}
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                                    <ImageIcon className="w-5 h-5 text-slate-600" />
                                  </div>
                                )}
                                <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                                  OK Sample
                                </div>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                              <div className="space-y-1.5">
                                {/* Badges Row */}
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    {item.defectCode}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${sevBadge.cls}`}>
                                      {sevBadge.label}
                                    </span>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${zoneBadge.cls}`}>
                                      {zoneBadge.label}
                                    </span>
                                  </div>
                                </div>

                                {/* Title & Category */}
                                <div>
                                  <h4
                                    onClick={() => setSubView({ type: 'details', defect: item })}
                                    className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </h4>
                                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                                    {item.category}
                                  </span>
                                </div>

                                {/* Anatomical Location & Standard */}
                                <div className="space-y-1 text-slate-500 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate text-[11px] font-medium text-slate-600">{item.location || 'Assembly Seams'}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    Standard: <span className="text-slate-700 font-semibold">{item.isoStandard || 'ISO 2859-1'}</span>
                                  </div>
                                </div>

                                {/* Recorded Root Cause Snippet */}
                                {(item.rootCause || item.rootCauseHint) && (
                                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2 leading-relaxed">
                                    <span className="font-semibold text-slate-700">Cause: </span>
                                    {item.rootCause || item.rootCauseHint}
                                  </p>
                                )}
                              </div>

                              {/* Card Action Buttons: Styled identically to Buyer & Order module */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSubView({ type: 'details', defect: item })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="View Defect Details"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View</span>
                                </button>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSubView({ type: 'edit', defect: item })}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    title="Edit Defect"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateDefect(item)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    title="Duplicate Defect"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteModal({ isOpen: true, defects: [item] })}
                                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Delete Defect"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ZONES & STANDARDS TAXONOMY */}
          {viewMode === 'zones' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Garment Quality Zones (Zone A / Zone B / Zone C)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Industry standard inspection zones defining visual defect tolerances based on anatomical garment position
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Defect</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Zone A Card */}
                  <div className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900 text-sm">Zone A (Highly Prominent)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        Zero Tolerance
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Front chest, collar, neckband, front placket, upper shoulder, and pocket faces. This zone faces the consumer directly.
                    </p>
                    <div className="pt-2 border-t border-rose-100 text-[11px] font-semibold text-rose-800">
                      • Any broken stitch, hole, puckering &gt; 1mm or oil stain is an immediate piece rejection.
                    </div>
                  </div>

                  {/* Zone B Card */}
                  <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 text-sm">Zone B (Secondary Visible)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Standard Tolerance
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Back panel, outer sleeves, lower bottom hem, and side seams. Visible when the wearer moves or turns around.
                    </p>
                    <div className="pt-2 border-t border-amber-100 text-[11px] font-semibold text-amber-800">
                      • Minor cosmetic stitch deviations (&lt; 0.5cm) or loose trimming allowed within AQL 2.5 sample limits.
                    </div>
                  </div>

                  {/* Zone C Card */}
                  <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Zone C (Interior / Hidden)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                        Functional Tolerance
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Interior lining, pocket bag interiors, inner waistband, and underarm seam junctions. Not visible during normal wear.
                    </p>
                    <div className="pt-2 border-t border-slate-200 text-[11px] font-semibold text-slate-700">
                      • Focus is 100% on mechanical seam strength and comfort. Cosmetic flaws within specification are accepted.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
