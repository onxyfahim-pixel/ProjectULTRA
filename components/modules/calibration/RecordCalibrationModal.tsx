'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Calendar,
  Building2,
  FileCheck2,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react';
import { CalibrationDevice, CalibrationHistoryRecord } from '@/lib/types/modules';

const PRESET_CERTIFICATES = [
  {
    name: 'BSTI-ISO17025-Accredited-Cert.pdf',
    type: 'PDF' as const,
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=60',
    agency: 'National Metrology Institute (BSTI)',
  },
  {
    name: 'TUV-Rheinland-Calibration-Cert.pdf',
    type: 'PDF' as const,
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=60',
    agency: 'TÜV Rheinland Metrology Services',
  },
  {
    name: 'SGS-Official-Certificate-Scan.png',
    type: 'IMAGE' as const,
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=60',
    agency: 'SGS Technical Metrology Bangladesh',
  },
  {
    name: 'Intertek-Metrology-Report.pdf',
    type: 'PDF' as const,
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=60',
    agency: 'Intertek Third-Party Metrology Services',
  },
];

interface RecordCalibrationModalProps {
  device: CalibrationDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDevice: CalibrationDevice) => void;
}

export function RecordCalibrationModal({
  device,
  isOpen,
  onClose,
  onSave,
}: RecordCalibrationModalProps) {
  if (!isOpen || !device) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const certFileInputRef = useRef<HTMLInputElement>(null);

  // Calculate next due date from frequency
  const calculateDefaultExpiry = (dateStr: string, months: number) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + (months || 6));
    return d.toISOString().split('T')[0];
  };

  const [calibrationDate, setCalibrationDate] = useState(todayStr);
  const [frequencyMonths, setFrequencyMonths] = useState(device.calibrationFrequencyMonths || 6);
  const [expiryDate, setExpiryDate] = useState(
    calculateDefaultExpiry(todayStr, device.calibrationFrequencyMonths || 6)
  );
  const [isThirdParty, setIsThirdParty] = useState(device.isThirdPartyCertified ?? true);
  const [agency, setAgency] = useState(device.calibrationAgency || 'National Metrology Institute (BSTI)');
  const [certificateNumber, setCertificateNumber] = useState(
    `CERT-CAL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );

  const [certFileType, setCertFileType] = useState<'PDF' | 'IMAGE'>(
    device.certificateFileType || 'PDF'
  );
  const [certFileName, setCertFileName] = useState<string>(
    device.certificateFileName || 'BSTI-ISO17025-Accredited-Cert.pdf'
  );
  const [certFileUrl, setCertFileUrl] = useState<string>(
    device.certificateFileUrl || PRESET_CERTIFICATES[0].url
  );

  const [calibratedBy, setCalibratedBy] = useState(device.calibratedBy || 'Engr. Metrologist');
  const [result, setResult] = useState<'PASS' | 'ADJUSTED' | 'OUT_OF_TOLERANCE'>('PASS');
  const [toleranceFound, setToleranceFound] = useState('Within permissible ISO 17025 tolerance limits');
  const [remarks, setRemarks] = useState('Routine periodic calibration performed and verified against primary standards.');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
    setCertFileType(isPdf ? 'PDF' : 'IMAGE');
    setCertFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCertFileUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetCert = (preset: typeof PRESET_CERTIFICATES[0]) => {
    setCertFileType(preset.type);
    setCertFileName(preset.name);
    setCertFileUrl(preset.url);
    setAgency(preset.agency);
  };

  const handleDateChange = (newDate: string) => {
    setCalibrationDate(newDate);
    setExpiryDate(calculateDefaultExpiry(newDate, frequencyMonths));
  };

  const handleFrequencyChange = (months: number) => {
    setFrequencyMonths(months);
    setExpiryDate(calculateDefaultExpiry(calibrationDate, months));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newHistoryRecord: CalibrationHistoryRecord = {
      id: `hist-${Date.now()}`,
      calibrationDate,
      expiryDate,
      certificateNumber,
      agency: isThirdParty ? agency : 'Internal QMS Metrology Lab',
      isThirdParty,
      calibratedBy,
      standardUsed: device.standardBasis || 'ISO/IEC 17025:2017',
      result,
      toleranceFound,
      notes: remarks,
      certificateFileName: isThirdParty ? certFileName : undefined,
      certificateFileUrl: isThirdParty ? certFileUrl : undefined,
      certificateFileType: isThirdParty ? certFileType : undefined,
    };

    const updatedDevice: CalibrationDevice = {
      ...device,
      lastCalibrationDate: calibrationDate,
      nextDueDate: expiryDate,
      calibrationFrequencyMonths: frequencyMonths,
      status: 'CALIBRATED',
      isThirdPartyCertified: isThirdParty,
      certificateNumber,
      calibrationAgency: isThirdParty ? agency : 'Internal QMS Metrology Lab',
      certificateFileType: isThirdParty ? certFileType : undefined,
      certificateFileName: isThirdParty ? certFileName : undefined,
      certificateFileUrl: isThirdParty ? certFileUrl : undefined,
      calibratedBy,
      calibrationResult: result,
      remarks,
      calibrationHistory: [newHistoryRecord, ...(device.calibrationHistory || [])],
    };

    onSave(updatedDevice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Calibration Cycle</h3>
              <p className="text-xs text-slate-500 font-mono">
                {device.deviceTag} • {device.deviceName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Compact Spacing) */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Device Summary Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">{device.deviceName}</div>
              <div className="text-[11px] text-slate-500">
                {device.brandName || 'Brand'} • {device.model} • SN: {device.serialNumber || 'SN-UNKNOWN'}
              </div>
            </div>
            <span className="font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
              {device.standardBasis || 'ISO 17025'}
            </span>
          </div>

          {/* Dates & Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Calibration Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={calibrationDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Cycle Frequency <span className="text-rose-500">*</span>
              </label>
              <select
                value={frequencyMonths}
                onChange={(e) => handleFrequencyChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 Month (High Risk)</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months (Standard)</option>
                <option value={12}>12 Months (Annual)</option>
                <option value={24}>24 Months</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Next Expiry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          {/* Uploaded Third-Party Certificate Options (Compact) */}
          <div className="p-3 rounded-xl border border-slate-200 space-y-2.5 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={isThirdParty}
                  onChange={(e) => setIsThirdParty(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Attach Uploaded Third-Party Certificate</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">External Accredited PDF</span>
            </div>

            {isThirdParty && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Accredited Agency <span className="text-[10px] text-slate-400 font-normal">(Editable & Selectable)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        list="modal-agency-suggestions"
                        value={agency}
                        onChange={(e) => setAgency(e.target.value)}
                        placeholder="Type agency name or pick..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                      <datalist id="modal-agency-suggestions">
                        <option value="National Metrology Institute (BSTI)" />
                        <option value="TÜV Rheinland Metrology Services" />
                        <option value="SGS Technical Metrology Bangladesh" />
                        <option value="Intertek Third-Party Metrology Services" />
                        <option value="Bureau Veritas Certification Bangladesh" />
                        <option value="James Heal Certified Calibration Service" />
                        <option value="Instron Global Field Service" />
                        <option value="UL Solutions Metrology" />
                      </datalist>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) setAgency(e.target.value);
                        }}
                        className="px-2 py-1.5 text-[11px] rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 cursor-pointer max-w-[85px] shrink-0"
                        title="Pick agency from presets"
                      >
                        <option value="">Presets ▾</option>
                        <option value="National Metrology Institute (BSTI)">BSTI</option>
                        <option value="TÜV Rheinland Metrology Services">TÜV Rheinland</option>
                        <option value="SGS Technical Metrology Bangladesh">SGS</option>
                        <option value="Intertek Third-Party Metrology Services">Intertek</option>
                        <option value="Bureau Veritas Certification Bangladesh">Bureau Veritas</option>
                        <option value="James Heal Certified Calibration Service">James Heal</option>
                        <option value="Instron Global Field Service">Instron</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Certificate Number
                    </label>
                    <input
                      type="text"
                      required={isThirdParty}
                      value={certificateNumber}
                      onChange={(e) => setCertificateNumber(e.target.value)}
                      placeholder="e.g. CERT-BSTI-2026-881"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Upload Certificate File Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => certFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-400 p-2 rounded-xl flex items-center gap-2 bg-white hover:bg-indigo-50/20 cursor-pointer transition-colors"
                  >
                    <UploadCloud className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-700 text-[11px]">Upload Certificate PDF</div>
                      <div className="text-[9px] text-slate-400">.pdf, .jpg, .png</div>
                    </div>
                    <input
                      ref={certFileInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="p-2 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          certFileType === 'PDF' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {certFileType === 'PDF' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-slate-900 text-[11px] truncate max-w-[140px]" title={certFileName}>
                          {certFileName}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {certFileType} Attached
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center gap-1 flex-wrap mt-1">
                      <span className="text-[9px] text-slate-400 font-medium">Presets:</span>
                      {PRESET_CERTIFICATES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPresetCert(preset)}
                          className={`text-[9px] font-mono px-1 py-0.5 rounded border transition-colors cursor-pointer ${
                            certFileName === preset.name
                              ? 'bg-indigo-100 border-indigo-300 text-indigo-800 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {preset.name.split('-')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results & Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Calibrated By / Lead Engineer
              </label>
              <input
                type="text"
                required
                value={calibratedBy}
                onChange={(e) => setCalibratedBy(e.target.value)}
                placeholder="e.g. Engr. Rafiqul Islam"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Calibration Verdict
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="PASS" className="text-emerald-700">PASS - Within Tolerances</option>
                <option value="ADJUSTED" className="text-amber-700">ADJUSTED - Re-calibrated</option>
                <option value="OUT_OF_TOLERANCE" className="text-rose-700">OUT OF TOLERANCE - Quarantine</option>
              </select>
            </div>
          </div>

          {/* Tolerance Reading & Remarks */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Tolerance / Reading Notes
            </label>
            <input
              type="text"
              value={toleranceFound}
              onChange={(e) => setToleranceFound(e.target.value)}
              placeholder="e.g. Deviation +0.0002g (Limit ±0.001g)"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Remarks & Verification Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Operational details, reference weights used, cleaning done..."
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Update Calibration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
