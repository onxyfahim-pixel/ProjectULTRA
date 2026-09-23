'use client';

import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  PieChart,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  Layers,
  Thermometer,
  Award,
  Filter,
  Search,
  LayoutGrid,
  List,
  X,
  Sparkles,
  BookOpen,
  Wrench,
  ChevronRight,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { LabTestRecord, GarmentIsoTestMethod } from '@/lib/types/modules';
import { MOCK_LAB_TESTS, GARMENT_ISO_TEST_METHODS } from '@/lib/db/modules-mock-data';
import { TestDetailsPage } from '../modules/testing/TestDetailsPage';
import { TestEntryPage } from '../modules/testing/TestEntryPage';
import { DeleteConfirmationModal } from '../modules/buyer-order/DeleteConfirmationModal';

type TestSubView =
  | { type: 'none' }
  | { type: 'details'; test: LabTestRecord }
  | { type: 'add'; initialMethod?: GarmentIsoTestMethod }
  | { type: 'edit'; test: LabTestRecord };

const VERDICT_BADGES: Record<string, { label: string; cls: string }> = {
  PASS: { label: 'Pass', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  FAIL: { label: 'Fail', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
  PENDING: { label: 'Pending', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
};

export function TestingView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [tests, setTests] = useState<LabTestRecord[]>(MOCK_LAB_TESTS);

  // Dedicated Separate Sub-Pages State (Matching Buyer & Order module)
  const [subView, setSubView] = useState<TestSubView>({ type: 'none' });

  // View Layout Mode for Registry: Table vs Visual Card Grid
  const [layoutMode, setLayoutMode] = useState<'table' | 'grid'>('table');
  const [gridSearch, setGridSearch] = useState<string>('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    tests: LabTestRecord[];
  } | null>(null);

  // Filter States
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [buyerFilter, setBuyerFilter] = useState<string>('ALL');

  // ISO Standards Tab Filter
  const [isoCategoryFilter, setIsoCategoryFilter] = useState<string>('ALL');
  const [isoSearchQuery, setIsoSearchQuery] = useState<string>('');

  // Keep details page refreshed if test updates
  React.useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = tests.find((t) => t.id === subView.test.id);
      if (refreshed && refreshed !== subView.test) {
        setSubView({ type: 'details', test: refreshed });
      }
    }
  }, [tests]);

  // Derived Stats
  const passedCount = tests.filter((t) => t.verdict === 'PASS').length;
  const failedCount = tests.filter((t) => t.verdict === 'FAIL').length;
  const pendingCount = tests.filter((t) => t.verdict === 'PENDING').length;
  const passRate = ((passedCount / (tests.length || 1)) * 100).toFixed(1);

  // Filtered Test Records
  const filteredTests = tests.filter((t) => {
    const matchesType = typeFilter === 'ALL' || t.testType === typeFilter;
    const matchesVerdict = verdictFilter === 'ALL' || t.verdict === verdictFilter;
    const matchesBuyer = buyerFilter === 'ALL' || t.buyerName === buyerFilter;

    const q = gridSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.testReportNo.toLowerCase().includes(q) ||
      t.styleNumber.toLowerCase().includes(q) ||
      t.fabricBatch.toLowerCase().includes(q) ||
      (t.buyerName && t.buyerName.toLowerCase().includes(q)) ||
      (t.garmentItem && t.garmentItem.toLowerCase().includes(q)) ||
      t.testStandard.toLowerCase().includes(q) ||
      t.testType.toString().toLowerCase().includes(q);

    return matchesType && matchesVerdict && matchesBuyer && matchesSearch;
  });

  // Filtered ISO Standards
  const filteredIsoStandards = GARMENT_ISO_TEST_METHODS.filter((m) => {
    const matchesCat = isoCategoryFilter === 'ALL' || m.category === isoCategoryFilter;
    const q = isoSearchQuery.toLowerCase().trim();
    const matchesQ =
      !q ||
      m.code.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.isoStandard.toLowerCase().includes(q) ||
      (m.aatccAstmStandard && m.aatccAstmStandard.toLowerCase().includes(q)) ||
      m.description.toLowerCase().includes(q) ||
      m.apparatus.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  // Handlers for Save, Duplicate, Delete
  const handleSaveTest = (savedTest: LabTestRecord) => {
    const index = tests.findIndex((t) => t.id === savedTest.id);
    if (index >= 0) {
      setTests(tests.map((t) => (t.id === savedTest.id ? savedTest : t)));
      showToast(`Updated test report ${savedTest.testReportNo}`);
      setSubView({ type: 'details', test: savedTest });
    } else {
      setTests([savedTest, ...tests]);
      showToast(`Registered lab test report ${savedTest.testReportNo}`);
      setSubView({ type: 'none' });
    }
  };

  const handleDuplicateTest = (record: LabTestRecord) => {
    const duplicated: LabTestRecord = {
      ...record,
      id: `tst-${Date.now()}`,
      testReportNo: `LAB-2026-${Math.floor(100 + Math.random() * 900)}`,
      testDate: new Date().toISOString().split('T')[0],
      verdict: 'PENDING',
      actualResult: 'In progress',
    };
    setTests([duplicated, ...tests]);
    showToast(`Duplicated into new report ${duplicated.testReportNo}`);
    setSubView({ type: 'edit', test: duplicated });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal) return;
    const idsToDelete = new Set(deleteModal.tests.map((t) => t.id));
    setTests(tests.filter((t) => !idsToDelete.has(t.id)));
    showToast(`Deleted ${deleteModal.tests.length} lab test record(s)`);
    setDeleteModal(null);
    setSubView({ type: 'none' });
  };

  // Batch Actions for DataTable
  const batchActions: BatchAction<LabTestRecord>[] = [
    {
      label: 'Delete Selected',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      variant: 'danger',
      onClick: (selected) => setDeleteModal({ isOpen: true, tests: selected }),
    },
    {
      label: 'Export Certificates',
      icon: <Award className="w-3.5 h-3.5" />,
      variant: 'default',
      onClick: (selected) => {
        showToast(`Exported ${selected.length} accredited test certificates (PDF)`);
      },
    },
  ];

  // Column Definitions - Styled like Buyer & Order module
  const columns: ColumnDef<LabTestRecord>[] = [
    {
      key: 'visualEvidence',
      header: 'Visuals',
      width: '80px',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          {/* Apparatus Thumbnail */}
          <div
            onClick={() => setSubView({ type: 'details', test: item })}
            className="w-9 h-9 rounded-md border border-slate-200 overflow-hidden bg-slate-900 shrink-0 cursor-pointer relative group"
            title="View testing apparatus setup"
          >
            {item.testImageUrl ? (
              <img src={item.testImageUrl} alt="Apparatus" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <FlaskConical className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-[7px] font-bold px-0.5 rounded-tl">
              Setup
            </span>
          </div>

          {/* Specimen Result Thumbnail */}
          <div
            onClick={() => setSubView({ type: 'details', test: item })}
            className="w-9 h-9 rounded-md border border-slate-200 overflow-hidden bg-slate-900 shrink-0 cursor-pointer relative group hidden sm:block"
            title="View tested specimen swatch"
          >
            {item.specimenImageUrl ? (
              <img src={item.specimenImageUrl} alt="Specimen" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <Layers className="w-3.5 h-3.5" />
              </div>
            )}
            <span className={`absolute bottom-0 right-0 text-white text-[7px] font-bold px-0.5 rounded-tl ${item.verdict === 'PASS' ? 'bg-emerald-600' : item.verdict === 'FAIL' ? 'bg-rose-600' : 'bg-amber-600'}`}>
              Swatch
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'testReportNo',
      header: 'Report # & Date',
      sortable: true,
      width: '135px',
      accessor: (item) => item.testReportNo,
      cell: (item) => (
        <div>
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', test: item })}
            className="font-mono font-bold text-xs text-blue-700 hover:text-blue-800 hover:underline cursor-pointer block text-left"
          >
            {item.testReportNo}
          </button>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.testDate}</div>
          {item.buyerName && (
            <span className="text-[10px] text-slate-400 font-medium truncate block max-w-[120px]">{item.buyerName}</span>
          )}
        </div>
      ),
    },
    {
      key: 'styleNumber',
      header: 'Style & Item',
      sortable: true,
      width: '155px',
      accessor: (item) => item.styleNumber,
      cell: (item) => (
        <div className="min-w-0">
          <div className="font-bold text-slate-900 text-xs truncate">{item.styleNumber}</div>
          <div className="text-[11px] text-slate-500 truncate">{item.garmentItem || 'Garment Specimen'}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            Batch: {item.fabricBatch}
          </div>
        </div>
      ),
    },
    {
      key: 'testType',
      header: 'Method & Standard',
      sortable: true,
      width: '160px',
      accessor: (item) => item.testType,
      cell: (item) => (
        <div className="min-w-0">
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-100 truncate block max-w-[150px]">
            {item.testType.toString().replace(/_/g, ' ')}
          </span>
          <div className="text-[10px] text-slate-600 font-mono mt-0.5 font-semibold truncate">
            {item.testStandard}
          </div>
        </div>
      ),
    },
    {
      key: 'specAndResult',
      header: 'Buyer Spec vs. Result',
      sortable: true,
      wrap: true,
      width: '210px',
      accessor: (item) => `${item.requirement} ${item.actualResult}`,
      cell: (item) => (
        <div className="space-y-0.5 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 font-sans font-bold uppercase tracking-tight shrink-0">Req:</span>
            <span className="text-slate-700 font-medium truncate max-w-[145px]" title={item.requirement}>
              {item.requirement}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 font-sans font-bold uppercase tracking-tight shrink-0">Act:</span>
            <span
              className={`font-bold truncate ${
                item.verdict === 'PASS'
                  ? 'text-emerald-700'
                  : item.verdict === 'FAIL'
                  ? 'text-rose-700'
                  : 'text-amber-700'
              }`}
            >
              {item.actualResult}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'verdict',
      header: 'Verdict',
      sortable: true,
      align: 'center',
      width: '95px',
      accessor: (item) => item.verdict,
      cell: (item) => {
        const badge = VERDICT_BADGES[item.verdict] || VERDICT_BADGES.PENDING;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
            {item.verdict === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : item.verdict === 'FAIL' ? <XCircle className="w-3 h-3 text-rose-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
            <span>{item.verdict}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '110px',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {/* View Pill Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', test: item })}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>View</span>
          </button>

          {/* Edit Icon Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', test: item })}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Edit Test Report"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Icon Button */}
          <button
            type="button"
            onClick={() => handleDuplicateTest(item)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Duplicate Test"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Icon Button */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, tests: [item] })}
            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete Test"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal - Matching Buyer & Order Module */}
      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          items={deleteModal.tests.map((t) => ({
            id: t.id,
            title: t.testReportNo,
            subtitle: `${t.styleNumber} • ${t.testType} • ${t.verdict}`,
            value: t.testStandard,
          }))}
          itemTypeLabel="laboratory test report"
          confirmLabel="Delete Test Record"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* MODULE HEADER: 3 TABS (Summary, Lab Test Registry, ISO Test Standards) */}
      <ModuleHeader
        title="Apparel Physical & Chemical Laboratory Testing (QMS ISO Standards)"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Lab Test Registry', count: tests.length },
          { id: 'standards', label: 'ISO & AATCC Garments Test Standards', count: GARMENT_ISO_TEST_METHODS.length },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGES */}
      {subView.type === 'details' ? (
        <TestDetailsPage
          test={subView.test}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(t) => setSubView({ type: 'edit', test: t })}
          onDuplicate={handleDuplicateTest}
          onDelete={(t) => setDeleteModal({ isOpen: true, tests: [t] })}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <TestEntryPage
          mode="add"
          test={
            subView.initialMethod
              ? ({
                  id: `tst-${Date.now()}`,
                  testReportNo: `LAB-2026-${Math.floor(100 + Math.random() * 900)}`,
                  styleNumber: 'STY-TS-2026',
                  fabricBatch: 'LOT-FB-8840',
                  testType: subView.initialMethod.name.toUpperCase().replace(/\s+/g, '_').slice(0, 20),
                  testStandard: subView.initialMethod.isoStandard,
                  requirement: subView.initialMethod.acceptanceCriteria,
                  actualResult: 'In progress',
                  verdict: 'PENDING',
                  testedBy: 'Lab Tech. Farhana Akhter',
                  testDate: new Date().toISOString().split('T')[0],
                  labName: 'In-House Accredited Physical Testing Lab',
                  testImageUrl: subView.initialMethod.imageUrl,
                  specimenImageUrl: subView.initialMethod.specimenImageUrl,
                  apparatusUsed: subView.initialMethod.apparatus,
                } as LabTestRecord)
              : null
          }
          onSave={handleSaveTest}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <TestEntryPage
          mode="edit"
          test={subView.test}
          onSave={handleSaveTest}
          onCancel={() => setSubView({ type: 'details', test: subView.test })}
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
                  title="Conducted Lab Tests"
                  value={tests.length.toString()}
                  subtitle="AATCC / ISO Reports"
                  icon={FlaskConical}
                  tone="blue"
                  delta={{ value: '+14.2%', isPositive: true }}
                />
                <StatCard
                  title="Compliance Pass Rate"
                  value={`${passRate}%`}
                  subtitle="Passed Buyer Standards"
                  icon={CheckCircle2}
                  tone="emerald"
                  delta={{ value: `${passedCount} Approved`, isPositive: true }}
                />
                <StatCard
                  title="Failed Out of Spec"
                  value={failedCount.toString()}
                  subtitle="Quarantined Lots"
                  icon={XCircle}
                  tone={failedCount > 0 ? 'rose' : 'emerald'}
                  delta={{ value: failedCount > 0 ? 'Requires Rework' : 'Zero Failures', isPositive: failedCount === 0 }}
                />
                <StatCard
                  title="Testing Turnaround"
                  value="19.4 hrs"
                  subtitle="Target < 24h SLA"
                  icon={Clock}
                  tone="indigo"
                  delta={{ value: 'Within SLA', isPositive: true }}
                />
              </div>

              {/* Graphical Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tests by Category */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Lab Tests by Methodology
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ISO Standards</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {Array.from(new Set(tests.map((t) => t.testType.toString()))).map((type) => {
                      const count = tests.filter((t) => t.testType.toString() === type).length;
                      const pct = Math.round((count / (tests.length || 1)) * 100);
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-slate-700">
                            <span className="font-semibold">{type.replace(/_/g, ' ')}</span>
                            <span className="font-mono text-slate-500">{count} tests ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Verdict Compliance */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Buyer Specification Compliance
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">QA Release</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                      <span className="text-[11px] text-emerald-700 font-bold block">✓ Passed Quality Specs</span>
                      <div className="text-2xl font-black font-mono text-emerald-950">{passedCount} Reports</div>
                      <p className="text-[11px] text-slate-500">Authorized for cutting & shipment release.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-1">
                      <span className="text-[11px] text-rose-700 font-bold block">✗ Out of Specification</span>
                      <div className="text-2xl font-black font-mono text-rose-950">{failedCount} Reports</div>
                      <p className="text-[11px] text-slate-500">Batch quarantined for re-processing / CAPA.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAB TEST REGISTRY (TABLE VIEW OR VISUAL CARD GRID VIEW) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {layoutMode === 'table' ? (
                /* TABLE VIEW WITH DATA TABLE */
                <DataTable
                  id="testing-records-table"
                  data={filteredTests}
                  columns={columns}
                  searchPlaceholder="Search report #, style, batch, test standard, or method..."
                  searchableKeys={['testReportNo', 'styleNumber', 'fabricBatch', 'buyerName', 'garmentItem', 'testStandard', 'testType', 'requirement', 'actualResult']}
                  secondaryAction={
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Test Type Filter */}
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Test Methods</option>
                        <option value="GSM_WEIGHT">GSM Weight</option>
                        <option value="DIMENSIONAL_SHRINKAGE">Dimensional Shrinkage</option>
                        <option value="COLOR_FASTNESS_WASHING">Wash Fastness</option>
                        <option value="COLOR_FASTNESS_CROCKING">Crocking / Rubbing</option>
                        <option value="TENSILE_STRENGTH">Tensile Strength</option>
                        <option value="WATER_REPELLENCY">Water Repellency</option>
                      </select>

                      {/* Verdict Filter */}
                      <select
                        value={verdictFilter}
                        onChange={(e) => setVerdictFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Verdicts</option>
                        <option value="PASS">Pass (Compliant)</option>
                        <option value="FAIL">Fail (Out of Spec)</option>
                        <option value="PENDING">Pending (In Progress)</option>
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
                      <span>Add Test</span>
                    </button>
                  }
                  batchActions={batchActions}
                />
              ) : (
                /* VISUAL CARD GRID VIEW */
                <div className="space-y-4">
                  {/* Grid Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={gridSearch}
                        onChange={(e) => setGridSearch(e.target.value)}
                        placeholder="Search report #, style, test standard, or method..."
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
                      {/* Test Type Filter */}
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Test Methods</option>
                        <option value="GSM_WEIGHT">GSM Weight</option>
                        <option value="DIMENSIONAL_SHRINKAGE">Dimensional Shrinkage</option>
                        <option value="COLOR_FASTNESS_WASHING">Wash Fastness</option>
                        <option value="COLOR_FASTNESS_CROCKING">Crocking / Rubbing</option>
                        <option value="TENSILE_STRENGTH">Tensile Strength</option>
                        <option value="WATER_REPELLENCY">Water Repellency</option>
                      </select>

                      {/* Verdict Filter */}
                      <select
                        value={verdictFilter}
                        onChange={(e) => setVerdictFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        <option value="ALL">All Verdicts</option>
                        <option value="PASS">Pass (Compliant)</option>
                        <option value="FAIL">Fail (Out of Spec)</option>
                        <option value="PENDING">Pending (In Progress)</option>
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

                      {/* Add Test Button - Matching Buyer & Order module */}
                      <button
                        type="button"
                        onClick={() => setSubView({ type: 'add' })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Test</span>
                      </button>
                    </div>
                  </div>

                  {/* Result Count */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                      Showing <strong className="text-slate-800">{filteredTests.length}</strong> accredited lab test records
                    </span>
                    {(typeFilter !== 'ALL' || verdictFilter !== 'ALL' || gridSearch) && (
                      <button
                        type="button"
                        onClick={() => {
                          setTypeFilter('ALL');
                          setVerdictFilter('ALL');
                          setGridSearch('');
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {/* Empty State */}
                  {filteredTests.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                      <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800 mb-1">No test records found</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                        No laboratory reports match your current filter criteria. Reset filters or register a new test.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubView({ type: 'add' })}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                      >
                        + Add New Lab Test
                      </button>
                    </div>
                  ) : (
                    /* RESPONSIVE CARD GRID */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {filteredTests.map((item) => {
                        const badge = VERDICT_BADGES[item.verdict] || VERDICT_BADGES.PENDING;

                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group"
                          >
                            {/* Dual Image Header: Apparatus Setup + Tested Swatch */}
                            <div className="grid grid-cols-2 gap-0.5 bg-slate-900 h-28 relative overflow-hidden">
                              {/* Left: Apparatus Setup */}
                              <div
                                onClick={() => setSubView({ type: 'details', test: item })}
                                className="relative h-full overflow-hidden cursor-pointer group/img"
                              >
                                {item.testImageUrl ? (
                                  <img
                                    src={item.testImageUrl}
                                    alt="Testing apparatus"
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                                    <FlaskConical className="w-5 h-5 text-slate-600" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                                  Apparatus
                                </div>
                              </div>

                              {/* Right: Specimen Result */}
                              <div
                                onClick={() => setSubView({ type: 'details', test: item })}
                                className="relative h-full overflow-hidden cursor-pointer group/img"
                              >
                                {item.specimenImageUrl ? (
                                  <img
                                    src={item.specimenImageUrl}
                                    alt="Specimen swatch"
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                                    <Layers className="w-5 h-5 text-slate-600" />
                                  </div>
                                )}
                                <div className={`absolute top-2 right-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm ${item.verdict === 'PASS' ? 'bg-emerald-600/90' : item.verdict === 'FAIL' ? 'bg-rose-600/90' : 'bg-amber-600/90'}`}>
                                  Swatch
                                </div>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                              <div className="space-y-1.5">
                                {/* Badges Row */}
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    {item.testReportNo}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                                    {item.verdict === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : item.verdict === 'FAIL' ? <XCircle className="w-3 h-3 text-rose-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                                    <span>{item.verdict}</span>
                                  </span>
                                </div>

                                {/* Title & Method */}
                                <div>
                                  <h4
                                    onClick={() => setSubView({ type: 'details', test: item })}
                                    className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                                    title={item.testType.toString()}
                                  >
                                    {item.testType.toString().replace(/_/g, ' ')}
                                  </h4>
                                  <span className="text-[10px] font-mono font-bold text-slate-500 block mt-0.5">
                                    {item.testStandard}
                                  </span>
                                </div>

                                {/* Style & Batch info */}
                                <div className="text-slate-500 text-xs space-y-0.5">
                                  <div className="font-semibold text-slate-800">{item.styleNumber}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">Lot: {item.fabricBatch}</div>
                                  {item.buyerName && (
                                    <div className="text-[10px] text-slate-400 font-medium">Buyer: {item.buyerName}</div>
                                  )}
                                </div>

                                {/* Result Metric Card */}
                                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Req:</span>
                                    <span className="font-mono text-slate-700 font-semibold">{item.requirement}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-200/60 pt-1">
                                    <span className="text-slate-500">Actual:</span>
                                    <span className={`font-mono font-bold ${item.verdict === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      {item.actualResult}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Card Action Buttons: Styled identically to Buyer & Order module */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSubView({ type: 'details', test: item })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="View Test Details"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View</span>
                                </button>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSubView({ type: 'edit', test: item })}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    title="Edit Test Report"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateTest(item)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    title="Duplicate Test Report"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteModal({ isOpen: true, tests: [item] })}
                                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Delete Test Report"
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

          {/* TAB 3: QMS ISO GARMENTS TEST STANDARDS & METHODOLOGIES */}
          {viewMode === 'standards' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      QMS ISO & AATCC Garments Test Methods Library
                    </h3>
                    <p className="text-xs text-slate-500">
                      International laboratory test standards, apparatus specifications, sample specimens, procedures, and pass/fail thresholds
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Lab Test</span>
                  </button>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={isoSearchQuery}
                      onChange={(e) => setIsoSearchQuery(e.target.value)}
                      placeholder="Search ISO code, test name, apparatus, or standard..."
                      className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                    {isoSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setIsoSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5">
                    {['ALL', 'PHYSICAL', 'COLOR_FASTNESS', 'MECHANICAL', 'CHEMICAL', 'SAFETY'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setIsoCategoryFilter(cat)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
                          isoCategoryFilter === cat
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Standards Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredIsoStandards.map((method) => (
                  <div
                    key={method.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview Header */}
                      <div className="grid grid-cols-2 gap-0.5 bg-slate-900 h-44 relative overflow-hidden">
                        {/* Apparatus Photo */}
                        <div className="relative h-full overflow-hidden">
                          <img
                            src={method.imageUrl}
                            alt={method.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                            Apparatus
                          </div>
                        </div>

                        {/* Specimen Photo */}
                        <div className="relative h-full overflow-hidden">
                          {method.specimenImageUrl ? (
                            <img
                              src={method.specimenImageUrl}
                              alt="Specimen"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                              <Layers className="w-6 h-6 text-slate-600" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                            Specimen
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                            {method.code}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {method.category}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            {method.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                            <span className="font-bold text-blue-800">{method.isoStandard}</span>
                            {method.aatccAstmStandard && (
                              <span className="text-slate-500">• {method.aatccAstmStandard}</span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {method.description}
                        </p>

                        <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800 block mb-0.5">⚙️ Apparatus & Equipment:</span>
                            <p className="text-[11px] text-slate-600">{method.apparatus}</p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-800 block mb-0.5">📐 Specimen Sampling:</span>
                            <p className="text-[11px] text-slate-600">{method.sampleSpecimen}</p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                            <span className="font-bold text-emerald-900 block mb-0.5">✓ Standard Acceptance Criteria:</span>
                            <p className="text-[11px] text-emerald-800">{method.acceptanceCriteria}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Accredited ISO/IEC 17025 Method</span>
                      <button
                        type="button"
                        onClick={() => setSubView({ type: 'add', initialMethod: method })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log Test Using This Standard</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
