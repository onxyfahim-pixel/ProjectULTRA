'use client';

import React, { useState } from 'react';
import {
  Gauge,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  PieChart,
  BarChart3,
  Wrench,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Award,
  Layers,
  Cpu,
  FileCheck2,
  ExternalLink,
  Download,
  Calendar,
  Check,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { CalibrationDevice } from '@/lib/types/modules';
import { MOCK_CALIBRATION_DEVICES } from '@/lib/db/modules-mock-data';

// Subcomponents
import { CalibrationDetailsPage } from '../modules/calibration/CalibrationDetailsPage';
import { CalibrationEntryPage } from '../modules/calibration/CalibrationEntryPage';
import { CalibrationCertificateModal } from '../modules/calibration/CalibrationCertificateModal';
import { RecordCalibrationModal } from '../modules/calibration/RecordCalibrationModal';
import { DeleteCalibrationModal } from '../modules/calibration/DeleteCalibrationModal';

type CalibrationSubView =
  | { type: 'none' }
  | { type: 'details'; device: CalibrationDevice }
  | { type: 'add' }
  | { type: 'edit'; device: CalibrationDevice };

export function CalibrationView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [devices, setDevices] = useState<CalibrationDevice[]>(MOCK_CALIBRATION_DEVICES);

  // Dedicated Separate Pages (Details, Add, Edit)
  const [subView, setSubView] = useState<CalibrationSubView>({ type: 'none' });

  // Keep details page refreshed if device data updates
  React.useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = devices.find((d) => d.id === subView.device.id);
      if (refreshed && refreshed !== subView.device) {
        setSubView({ type: 'details', device: refreshed });
      }
    }
  }, [devices]);

  // Modal States
  const [selectedDeviceForCert, setSelectedDeviceForCert] = useState<CalibrationDevice | null>(null);
  const [selectedDeviceForRecord, setSelectedDeviceForRecord] = useState<CalibrationDevice | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    devices: CalibrationDevice[];
  } | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [certAgencyFilter, setCertAgencyFilter] = useState('ALL');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalCount = devices.length;
  const calibratedCount = devices.filter((d) => d.status === 'CALIBRATED').length;
  const dueSoonCount = devices.filter((d) => d.status === 'DUE_SOON').length;
  const overdueCount = devices.filter((d) => d.status === 'OVERDUE').length;
  const thirdPartyCertifiedCount = devices.filter((d) => d.isThirdPartyCertified).length;
  const complianceRate = Math.round((calibratedCount / (totalCount || 1)) * 100);

  // CRUD Handlers
  const handleSaveDevice = (deviceToSave: CalibrationDevice) => {
    const exists = devices.some((d) => d.id === deviceToSave.id);
    if (exists) {
      setDevices(devices.map((d) => (d.id === deviceToSave.id ? deviceToSave : d)));
    } else {
      setDevices([deviceToSave, ...devices]);
    }
    setSubView({ type: 'details', device: deviceToSave });
  };

  const handleDeleteDevice = (deviceToDelete: CalibrationDevice) => {
    setDeleteModal({
      isOpen: true,
      devices: [deviceToDelete],
    });
  };

  const confirmDelete = () => {
    if (!deleteModal || deleteModal.devices.length === 0) return;
    const idsToDelete = new Set(deleteModal.devices.map((d) => d.id));
    setDevices((prev) => prev.filter((d) => !idsToDelete.has(d.id)));

    if (subView.type === 'details' && idsToDelete.has(subView.device.id)) {
      setSubView({ type: 'none' });
    } else if (subView.type === 'edit' && idsToDelete.has(subView.device.id)) {
      setSubView({ type: 'none' });
    }

    const count = deleteModal.devices.length;
    showToast(
      count === 1
        ? `Deleted equipment ${deleteModal.devices[0].deviceTag}`
        : `Deleted ${count} equipment records successfully`
    );
    setDeleteModal(null);
  };

  // Filtered Devices for DataTable
  const filteredDevices = devices.filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesDept =
      deptFilter === 'ALL' ||
      d.department === deptFilter ||
      (d.location && d.location.toLowerCase().includes(deptFilter.toLowerCase()));
    const matchesCert =
      certAgencyFilter === 'ALL' ||
      (certAgencyFilter === 'THIRD_PARTY' && d.isThirdPartyCertified) ||
      (certAgencyFilter === 'IN_HOUSE' && !d.isThirdPartyCertified) ||
      d.calibrationAgency === certAgencyFilter;

    return matchesStatus && matchesDept && matchesCert;
  });

  // Table Columns Matching Buyer & Order UI / Buttons with Compact Gaps
  const columns: ColumnDef<CalibrationDevice>[] = [
    {
      key: 'equipment',
      header: 'Equipment',
      accessorKey: 'deviceTag',
      sortable: true,
      width: '21%',
      accessor: (row) => row.deviceTag,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
            {row.equipmentImage ? (
              <img src={row.equipmentImage} alt={row.deviceName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Cpu className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-mono font-bold text-blue-700 text-xs block leading-tight">
              {row.deviceTag}
            </span>
            <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px] block leading-tight" title={row.deviceName}>
              {row.deviceName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[130px] leading-tight">
              {row.location}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'brandModel',
      header: 'Brand & Model',
      accessorKey: 'brandName',
      sortable: true,
      width: '12%',
      accessor: (row) => row.brandName || '',
      cell: (row) => (
        <div className="min-w-0">
          <div className="font-bold text-slate-900 text-xs truncate max-w-[100px]">{row.brandName || 'Sartorius'}</div>
          <div className="text-[10px] text-slate-600 font-mono truncate max-w-[100px]">{row.model}</div>
          <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{row.department || 'Lab'}</div>
        </div>
      ),
    },
    {
      key: 'serialNumber',
      header: 'Serial No.',
      accessorKey: 'serialNumber',
      sortable: true,
      width: '10%',
      accessor: (row) => row.serialNumber || '',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] inline-block truncate max-w-[100px]">
            {row.serialNumber || 'SN-UNKNOWN'}
          </span>
        </div>
      ),
    },
    {
      key: 'standardBasis',
      header: 'ISO Standard',
      accessorKey: 'standardBasis',
      sortable: true,
      width: '13%',
      accessor: (row) => row.standardBasis || '',
      cell: (row) => (
        <div className="text-xs min-w-0">
          <div className="font-mono font-semibold text-slate-900 truncate max-w-[115px]" title={row.standardBasis}>
            {row.standardBasis || 'ISO/IEC 17025'}
          </div>
          <div className="font-mono text-emerald-700 font-bold text-[10px] truncate max-w-[115px]">
            Tol: {row.accuracyTolerance || '±0.01%'}
          </div>
        </div>
      ),
    },
    {
      key: 'lastCalibrationDate',
      header: 'Calibrated',
      accessorKey: 'lastCalibrationDate',
      sortable: true,
      width: '9%',
      accessor: (row) => row.lastCalibrationDate,
      cell: (row) => (
        <span className="font-mono text-xs text-slate-700 font-medium">
          {row.lastCalibrationDate}
        </span>
      ),
    },
    {
      key: 'nextDueDate',
      header: 'Expiry Date',
      accessorKey: 'nextDueDate',
      sortable: true,
      width: '10%',
      accessor: (row) => row.nextDueDate,
      cell: (row) => {
        const isOverdue = row.status === 'OVERDUE';
        const isDueSoon = row.status === 'DUE_SOON';
        return (
          <div>
            <div className={`font-mono font-bold text-xs ${isOverdue ? 'text-rose-600' : isDueSoon ? 'text-amber-600' : 'text-emerald-700'}`}>
              {row.nextDueDate}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Cycle: {row.calibrationFrequencyMonths} mo
            </div>
          </div>
        );
      },
    },
    {
      key: 'certificate',
      header: 'Certificate',
      accessorKey: 'certificateNumber',
      sortable: true,
      width: '12%',
      accessor: (row) => row.certificateNumber,
      cell: (row) => (
        <div className="text-xs min-w-0">
          <div className="font-mono font-bold text-indigo-700 truncate max-w-[110px]" title={row.certificateNumber}>
            {row.certificateNumber}
          </div>
          <div className="text-[10px] text-slate-500 truncate max-w-[110px]" title={row.calibrationAgency}>
            {row.calibrationAgency}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      width: '6%',
      align: 'center',
      cell: (row) => {
        const variantMap: Record<string, any> = {
          CALIBRATED: 'emerald',
          DUE_SOON: 'amber',
          OVERDUE: 'rose',
        };
        return <StatusBadge label={row.status.replace('_', ' ')} variant={variantMap[row.status] || 'neutral'} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '7%',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* 1. Details Button (Eye) - Opens Separate Details Page */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', device: row })}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Separate Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* 2. Edit Button */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', device: row })}
            className="p-1 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Equipment"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* 3. Record Calibration Button (ShieldCheck) */}
          <button
            type="button"
            onClick={() => setSelectedDeviceForRecord(row)}
            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
            title="Record Calibration"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>

          {/* 4. Certificate Button (Award) */}
          <button
            type="button"
            onClick={() => setSelectedDeviceForCert(row)}
            className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
            title="View Certificate"
          >
            <Award className="w-3.5 h-3.5" />
          </button>

          {/* 5. Delete Button */}
          <button
            type="button"
            onClick={() => handleDeleteDevice(row)}
            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Equipment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<CalibrationDevice>[] = [
    {
      label: 'Record Routine Calibration',
      variant: 'primary',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        const ids = new Set(selected.map((s) => s.id));
        const today = new Date().toISOString().split('T')[0];
        setDevices((prev) =>
          prev.map((d) => {
            if (ids.has(d.id)) {
              const exp = new Date(today);
              exp.setMonth(exp.getMonth() + (d.calibrationFrequencyMonths || 6));
              return {
                ...d,
                status: 'CALIBRATED',
                lastCalibrationDate: today,
                nextDueDate: exp.toISOString().split('T')[0],
              };
            }
            return d;
          })
        );
        showToast(`Recorded routine calibration for ${selected.length} devices`);
      },
    },
    {
      label: 'Export Registry',
      icon: <Download className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        showToast(`Exported ${selected.length} equipment calibration certificates`);
      },
    },
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModal({
          isOpen: true,
          devices: selected,
        });
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Header with Custom Tabs Matching Buyer & Order Module */}
      <ModuleHeader
        id="calibration-devices-module"
        moduleCode="MOD-11"
        badge="Metrology & Equipment"
        title="Equipment & Measurement Devices Calibration Matrix"
        subtitle="Digital analytical balances, GSM cutters, metal detectors, tensile testers, and light cabinets with ISO 17025 traceability"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Equipment Registry', count: devices.length },
          { id: 'entry', label: 'Entry & Calibration', count: 'All-in-One' },
        ]}
      />

      {/* DEDICATED SEPARATE SUB-PAGES */}
      {subView.type === 'details' ? (
        <CalibrationDetailsPage
          device={subView.device}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(dev) => setSubView({ type: 'edit', device: dev })}
          onDelete={handleDeleteDevice}
          onUpdateDevice={(updated) => {
            setDevices(devices.map((d) => (d.id === updated.id ? updated : d)));
            setSubView({ type: 'details', device: updated });
          }}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <CalibrationEntryPage
          onSave={handleSaveDevice}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <CalibrationEntryPage
          initialDevice={subView.device}
          onSave={handleSaveDevice}
          onCancel={() => setSubView({ type: 'details', device: subView.device })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Cards with Tones and Deltas Matching Buyer & Order Module */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Calibrated Equipment"
                  value={totalCount.toString()}
                  subtitle="Lab, Floor & Metal Detectors"
                  icon={Gauge}
                  tone="blue"
                  delta={{ value: '+2 new', isPositive: true }}
                />
                <StatCard
                  title="Active Valid Status"
                  value={`${calibratedCount} / ${totalCount}`}
                  subtitle={`${complianceRate}% compliant with ISO 17025`}
                  icon={CheckCircle2}
                  tone="emerald"
                  delta={{ value: '100% target', isPositive: true }}
                />
                <StatCard
                  title="Overdue / Due Attention"
                  value={`${overdueCount + dueSoonCount} Devices`}
                  subtitle={`${overdueCount} overdue, ${dueSoonCount} due soon`}
                  icon={AlertTriangle}
                  tone={overdueCount > 0 ? 'rose' : dueSoonCount > 0 ? 'amber' : 'emerald'}
                  delta={overdueCount > 0 ? { value: `${overdueCount} Lock`, isPositive: false } : undefined}
                />
                <StatCard
                  title="Third-Party Certified"
                  value={`${thirdPartyCertifiedCount} Devices`}
                  subtitle="SGS, TÜV, BSTI & Intertek"
                  icon={ShieldCheck}
                  tone="indigo"
                  delta={{ value: 'ISO 17025', isPositive: true }}
                />
              </div>

              {/* Charts & Distribution Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calibration Status Distribution */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Calibration Compliance Status
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ISO 17025</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[11px] text-emerald-700 font-semibold block">Valid Certified</span>
                      <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{calibratedCount}</div>
                      <span className="text-[10px] text-slate-500">Ready for testing</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                      <span className="text-[11px] text-amber-700 font-semibold block">Upcoming Due</span>
                      <div className="text-lg font-bold font-mono text-amber-900 mt-1">{dueSoonCount}</div>
                      <span className="text-[10px] text-slate-500">Next 14-30 days</span>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                      <span className="text-[11px] text-rose-700 font-semibold block">Overdue Lock</span>
                      <div className="text-lg font-bold font-mono text-rose-900 mt-1">{overdueCount}</div>
                      <span className="text-[10px] text-slate-500">Do not use on floor</span>
                    </div>
                  </div>
                </div>

                {/* Department Deployment */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Equipment by Department
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Distribution</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {Array.from(new Set(devices.map((d) => d.department || d.location.split(' ')[0]))).map((dept) => {
                      const count = devices.filter((d) => (d.department || d.location.split(' ')[0]) === dept).length;
                      const pct = Math.round((count / (devices.length || 1)) * 100);
                      return (
                        <div key={dept} className="space-y-1">
                          <div className="flex justify-between text-slate-700">
                            <span className="font-medium">{dept}</span>
                            <span className="font-mono text-slate-500">{count} devices ({pct}%)</span>
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

              {/* Upcoming Due & Overdue Equipment Quick Action Panel */}
              {(overdueCount > 0 || dueSoonCount > 0) && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Action Required: Overdue & Upcoming Calibrations</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Immediate renewal</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {devices
                      .filter((d) => d.status === 'OVERDUE' || d.status === 'DUE_SOON')
                      .map((d) => (
                        <div
                          key={d.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${d.status === 'OVERDUE'
                              ? 'bg-rose-50/40 border-rose-200'
                              : 'bg-amber-50/40 border-amber-200'
                            }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900">{d.deviceTag}</span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${d.status === 'OVERDUE' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                                  }`}
                              >
                                {d.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-800 truncate">{d.deviceName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Expiry: <span className="font-bold text-slate-700">{d.nextDueDate}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDeviceForRecord(d)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0 ml-2"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Calibrate</span>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <SwitchToListBanner
                label="Open Equipment Calibration Registry"
                recordCount={devices.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: EQUIPMENT REGISTRY (ONE UNIFIED SEARCH & FILTER BAR WITH ACCENDING/DESCENDING SORTING) */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="calibration-devices-table"
                dense={true}
                data={filteredDevices}
                columns={columns}
                searchPlaceholder="Search equipment by tag, brand, serial, location, or certificate..."
                searchableKeys={[
                  'deviceTag',
                  'deviceName',
                  'brandName',
                  'serialNumber',
                  'model',
                  'location',
                  'department',
                  'standardBasis',
                  'certificateNumber',
                  'calibrationAgency',
                ]}
                secondaryAction={
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="CALIBRATED">Calibrated</option>
                      <option value="DUE_SOON">Due Soon</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>

                    {/* Department Filter */}
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[150px]"
                    >
                      <option value="ALL">All Departments</option>
                      <option value="Fabric Testing Lab">Fabric Lab</option>
                      <option value="Color Fastness Testing Lab">Color Fastness Lab</option>
                      <option value="Physical & Mechanical Testing Lab">Mechanical Lab</option>
                      <option value="Garments Finishing & Packing">Finishing & Packing</option>
                      <option value="Raw Material Warehouse">Warehouse</option>
                    </select>

                    {/* Certificate Agency Filter */}
                    <select
                      value={certAgencyFilter}
                      onChange={(e) => setCertAgencyFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[150px]"
                    >
                      <option value="ALL">All Certificates</option>
                      <option value="THIRD_PARTY">Third-Party ISO 17025</option>
                      <option value="National Metrology Institute (BSTI)">BSTI Metrology</option>
                      <option value="TÜV Rheinland Metrology Services">TÜV Rheinland</option>
                      <option value="SGS Technical Metrology Bangladesh">SGS Bangladesh</option>
                      <option value="Intertek Third-Party Metrology Services">Intertek Services</option>
                    </select>
                  </div>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Equipment</span>
                  </button>
                }
                batchActions={batchActions}
              />
            </div>
          )}

          {/* TAB 3: ENTRY & CALIBRATION */}
          {viewMode === 'entry' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <CalibrationEntryPage
                onSave={handleSaveDevice}
                onCancel={() => setViewMode('list')}
                showToast={showToast}
              />
            </div>
          )}
        </>
      )}

      {/* MODALS */}
      {selectedDeviceForCert && (
        <CalibrationCertificateModal
          device={selectedDeviceForCert}
          isOpen={Boolean(selectedDeviceForCert)}
          onClose={() => setSelectedDeviceForCert(null)}
          showToast={showToast}
        />
      )}

      {selectedDeviceForRecord && (
        <RecordCalibrationModal
          device={selectedDeviceForRecord}
          isOpen={Boolean(selectedDeviceForRecord)}
          onClose={() => setSelectedDeviceForRecord(null)}
          onSave={(updated) => {
            setDevices(devices.map((d) => (d.id === updated.id ? updated : d)));
            showToast(`Recorded new calibration for ${updated.deviceTag} (${updated.certificateNumber})`);
          }}
        />
      )}

      {deleteModal && (
        <DeleteCalibrationModal
          isOpen={deleteModal.isOpen}
          devices={deleteModal.devices}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
