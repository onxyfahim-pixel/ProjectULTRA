'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Cpu,
  FileCheck,
  FileText,
  Building2,
  MapPin,
  Plus,
  ExternalLink,
  Printer,
  Download,
  Info,
  Layers,
  Sparkles,
  QrCode,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { CalibrationDevice } from '@/lib/types/modules';
import { CalibrationCertificateModal } from './CalibrationCertificateModal';
import { RecordCalibrationModal } from './RecordCalibrationModal';
import { DeleteCalibrationModal } from './DeleteCalibrationModal';

interface CalibrationDetailsPageProps {
  device: CalibrationDevice;
  onBack: () => void;
  onEdit: (device: CalibrationDevice) => void;
  onDelete?: (device: CalibrationDevice) => void;
  onUpdateDevice: (updated: CalibrationDevice) => void;
  showToast: (msg: string) => void;
}

export function CalibrationDetailsPage({
  device,
  onBack,
  onEdit,
  onDelete,
  onUpdateDevice,
  showToast,
}: CalibrationDetailsPageProps) {
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Expiry calculation
  const today = new Date();
  const expiryDate = new Date(device.nextDueDate);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const isDueSoon = diffDays >= 0 && diffDays <= 30;

  const statusVariant = isOverdue
    ? { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', label: 'OVERDUE' }
    : isDueSoon
      ? { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'DUE SOON' }
      : { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'CALIBRATED' };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Navigation & Action Bar (Matching BuyerOrderDetailsPage) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Equipment Registry"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {device.deviceTag}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusVariant.bg} ${statusVariant.text} ${statusVariant.border}`}>
                {statusVariant.label}
              </span>
              {device.isThirdPartyCertified && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  <span>ISO 17025 Third-Party Certified</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {device.brandName || 'Brand'} • {device.model} • SN: {device.serialNumber || 'SN-UNKNOWN'} • {device.location}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Record New Calibration */}
          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
            title="Log new calibration event"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Record Calibration</span>
          </button>

          {/* 2. View Certificate */}
          <button
            type="button"
            onClick={() => setIsCertModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-200 cursor-pointer"
            title="View Third-Party Calibration Certificate"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certificate</span>
          </button>

          {/* 3. Edit Equipment */}
          <button
            type="button"
            onClick={() => onEdit(device)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Edit equipment specifications"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {/* 4. Delete */}
          {onDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 cursor-pointer"
              title="Delete this equipment record"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Stat Cards Matching Buyer & Order Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Expiry Date & Countdown */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Calibration Expiry Date</span>
            <Clock className={`w-4 h-4 ${isOverdue ? 'text-rose-600' : isDueSoon ? 'text-amber-600' : 'text-emerald-600'}`} />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {device.nextDueDate}
          </div>
          <div className="text-[11px] font-semibold">
            {isOverdue ? (
              <span className="text-rose-600 font-bold">⚠️ Expired {Math.abs(diffDays)} days ago</span>
            ) : isDueSoon ? (
              <span className="text-amber-600 font-bold">⚠️ Due in {diffDays} days</span>
            ) : (
              <span className="text-emerald-600 font-bold">✓ Valid for next {diffDays} days</span>
            )}
          </div>
        </div>

        {/* Stat 2: Last Calibrated Date */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Last Calibrated Date</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {device.lastCalibrationDate}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Cycle: <span className="font-bold text-slate-700">{device.calibrationFrequencyMonths} Months</span>
          </div>
        </div>

        {/* Stat 3: Certificate Number */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Third-Party Certificate</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold font-mono text-indigo-700 truncate" title={device.certificateNumber}>
            {device.certificateNumber}
          </div>
          <div className="text-[11px] text-slate-500 truncate" title={device.calibrationAgency}>
            {device.calibrationAgency}
          </div>
        </div>

        {/* Stat 4: Standard Basis & Tolerance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Metrology Standard</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xs font-bold font-mono text-slate-900 truncate" title={device.standardBasis || 'ISO 17025'}>
            {device.standardBasis?.split('/')[0] || 'ISO/IEC 17025'}
          </div>
          <div className="text-[11px] font-mono text-emerald-700 font-bold truncate">
            Tolerance: {device.accuracyTolerance || '± 0.01%'}
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (1 col): Equipment Profile Card */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Equipment Specifications</span>
            </h3>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
              {device.deviceTag}
            </span>
          </div>

          {/* Equipment Image Preview */}
          <div className="w-full h-44 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative group">
            {device.equipmentImage ? (
              <img
                src={device.equipmentImage}
                alt={device.deviceName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Cpu className="w-10 h-10 mb-1" />
                <span className="text-xs">No Equipment Photo</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-mono backdrop-blur-xs">
              {device.brandName || 'Lab Apparatus'} • {device.model}
            </div>
          </div>

          {/* Specifications Table */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Equipment Name:</span>
              <span className="font-semibold text-slate-900 text-right max-w-[180px]">{device.deviceName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Brand Name:</span>
              <span className="font-bold text-blue-700">{device.brandName || 'Sartorius'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Model:</span>
              <span className="font-mono text-slate-800">{device.model}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Serial Number:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {device.serialNumber || 'SN-UNKNOWN'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Department:</span>
              <span className="font-medium text-slate-800">{device.department || 'Physical Lab'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Physical Location:</span>
              <span className="text-slate-700">{device.location}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Measurement Range:</span>
              <span className="font-mono font-semibold text-slate-800">{device.measurementRange || '0 - 100%'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Permissible Tolerance:</span>
              <span className="font-mono font-bold text-emerald-700">{device.accuracyTolerance || '± 0.01%'}</span>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Standards, Third Party Certificate & History */}
        <div className="lg:col-span-2 space-y-5">
          {/* Card: Metrology Standard & Third Party Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Metrology Standard (ISP based) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>ISO / ISP Standard Basis</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Traceable
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Accredited Standard:</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {device.standardBasis || 'ISO/IEC 17025:2017 Competence of Calibration Labs'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Primary Reference Standard:</span>
                  <span className="text-slate-700">Class E2 Mass Weights & Laser Interferometer Standards</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Environmental Operating Conditions:</span>
                  <span className="font-mono text-slate-800">20°C ± 2°C • 65% ± 4% RH (ISO Conditioning)</span>
                </div>
                {device.remarks && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Inspector Notes:</span>
                    <p className="text-slate-600 italic text-[11px]">{device.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Third-Party Certificate Information (Uploaded External PDF / Document) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Uploaded Third-Party Certificate</span>
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                    ISO 17025
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      device.certificateFileType === 'IMAGE'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {device.certificateFileType === 'IMAGE' ? 'UPLOADED IMAGE' : 'UPLOADED PDF'}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Accredited External Agency:</span>
                  <span className="font-bold text-slate-900">{device.calibrationAgency}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Certificate Number:</span>
                  <span className="font-mono font-bold text-indigo-700 text-xs">{device.certificateNumber}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Lead Metrologist:</span>
                  <span className="text-slate-700">{device.calibratedBy || 'Lead Technical Auditor'}</span>
                </div>

                {/* Attached File Summary */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        device.certificateFileType === 'IMAGE'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-rose-100 text-rose-600'
                      }`}
                    >
                      {device.certificateFileType === 'IMAGE' ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 text-[11px] truncate max-w-[170px]" title={device.certificateFileName || 'Accredited-Certificate.pdf'}>
                        {device.certificateFileName || `${device.certificateNumber}.pdf`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Uploaded External Document
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCertModalOpen(true)}
                    className="px-2 py-1 text-[10px] font-bold rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Preview
                  </button>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCertModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-2xs"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>View Uploaded Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        `Downloaded Certificate ${device.certificateNumber} as ${device.certificateFileType || 'PDF'}`
                      )
                    }
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                    title="Download Certificate File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Table Inside: Calibration History Log */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Calibration Logs & Traceability History
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Calibration</span>
              </button>
            </div>

            {/* Compact Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-2">Calibration Date</th>
                    <th className="py-2 px-2">Expiry Date</th>
                    <th className="py-2 px-2">Certificate No.</th>
                    <th className="py-2 px-2">Agency / Auditor</th>
                    <th className="py-2 px-2">Tolerance / Deviation</th>
                    <th className="py-2 px-2 text-center">Verdict</th>
                    <th className="py-2 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {device.calibrationHistory && device.calibrationHistory.length > 0 ? (
                    device.calibrationHistory.map((hist) => (
                      <tr key={hist.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-1.5 px-2 font-semibold text-slate-900 whitespace-nowrap">
                          {hist.calibrationDate}
                        </td>
                        <td className="py-1.5 px-2 text-emerald-700 font-semibold whitespace-nowrap">
                          {hist.expiryDate}
                        </td>
                        <td className="py-1.5 px-2">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                            {hist.certificateNumber}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 font-sans text-slate-700">
                          <div className="font-medium text-[11px] truncate max-w-[120px]">{hist.agency}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{hist.calibratedBy}</div>
                        </td>
                        <td className="py-1.5 px-2 text-slate-600 text-[11px] truncate max-w-[140px]">
                          {hist.toleranceFound}
                        </td>
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${hist.result === 'PASS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : hist.result === 'ADJUSTED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                          >
                            {hist.result}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setIsCertModalOpen(true)}
                            className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 cursor-pointer"
                            title="View Certificate"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400 font-sans">
                        No previous calibration logs recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CalibrationCertificateModal
        device={device}
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        showToast={showToast}
      />

      <RecordCalibrationModal
        device={device}
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={(updated) => {
          onUpdateDevice(updated);
          showToast(`Recorded new calibration for ${updated.deviceTag} (${updated.certificateNumber})`);
        }}
      />

      {onDelete && (
        <DeleteCalibrationModal
          isOpen={isDeleteModalOpen}
          devices={[device]}
          onConfirm={() => {
            setIsDeleteModalOpen(false);
            onDelete(device);
          }}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
