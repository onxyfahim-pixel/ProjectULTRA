'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Award,
  Calendar,
  Building2,
  Tag,
  FileCheck2,
  FileText,
  Trash2,
  Plus,
  RotateCcw,
  Image as ImageIcon,
  UploadCloud,
  File,
  X,
  ExternalLink,
  Eye,
  Check,
} from 'lucide-react';
import { CalibrationDevice } from '@/lib/types/modules';
import { CalibrationCertificateModal } from './CalibrationCertificateModal';

interface CalibrationEntryPageProps {
  initialDevice?: CalibrationDevice | null;
  onSave: (device: CalibrationDevice) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const PRESET_EQUIPMENT_IMAGES = [
  {
    label: 'Digital Precision Balance',
    url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format&fit=crop&q=60',
    brand: 'Sartorius',
    standard: 'ISO/IEC 17025 / OIML R76',
    tolerance: '± 0.001 g',
  },
  {
    label: 'GSM Circular Sample Cutter',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60',
    brand: 'James Heal',
    standard: 'ISO 3801 / ASTM D3776',
    tolerance: '100 cm² ± 0.2 cm²',
  },
  {
    label: 'Conveyor Metal Detector',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    brand: 'Lock Inspection / Hashima',
    standard: 'M&S / H&M Needle Policy',
    tolerance: '1.0 mm Fe / 1.2 mm Non-Fe',
  },
  {
    label: 'Universal Tensile Strength Tester',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60',
    brand: 'Instron',
    standard: 'ISO 7500-1 / ASTM D5034',
    tolerance: '± 0.5% Force',
  },
  {
    label: 'Color Matching Light Cabinet',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=60',
    brand: 'VeriVide',
    standard: 'ISO 105-J01 / ASTM D1729',
    tolerance: '1000 - 1400 Lux (D65)',
  },
  {
    label: 'Digital Thickness Gauge',
    url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=60',
    brand: 'Mitutoyo',
    standard: 'ISO 5084 / ASTM D1777',
    tolerance: '± 0.01 mm',
  },
  {
    label: 'Electronic Crockmeter',
    url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60',
    brand: 'SDL Atlas',
    standard: 'AATCC 8 / ISO 105-X12',
    tolerance: '9.0 N ± 0.2 N Load',
  },
  {
    label: 'Fabric Moisture Meter',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60',
    brand: 'Aqua-Boy / KERN',
    standard: 'ASTM D2654 / ISO 6741',
    tolerance: '± 0.2% Regain',
  },
];

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

export function CalibrationEntryPage({
  initialDevice,
  onSave,
  onCancel,
  showToast,
}: CalibrationEntryPageProps) {
  const isEdit = Boolean(initialDevice);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewCertOpen, setIsPreviewCertOpen] = useState(false);

  // Helper date function
  const todayStr = new Date().toISOString().split('T')[0];
  const calculateDefaultExpiry = (dateStr: string, months: number) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + (months || 6));
    return d.toISOString().split('T')[0];
  };

  // Form State
  const [deviceTag, setDeviceTag] = useState(
    initialDevice?.deviceTag || `CAL-EQ-${Math.floor(10 + Math.random() * 90)}`
  );
  const [deviceName, setDeviceName] = useState(initialDevice?.deviceName || '');
  const [brandName, setBrandName] = useState(initialDevice?.brandName || 'Sartorius');
  const [model, setModel] = useState(initialDevice?.model || '');
  const [serialNumber, setSerialNumber] = useState(
    initialDevice?.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [equipmentImage, setEquipmentImage] = useState(
    initialDevice?.equipmentImage || PRESET_EQUIPMENT_IMAGES[0].url
  );
  const [location, setLocation] = useState(initialDevice?.location || 'Fabric Testing Lab Room 102');
  const [department, setDepartment] = useState(initialDevice?.department || 'Fabric Testing Lab');
  const [standardBasis, setStandardBasis] = useState(
    initialDevice?.standardBasis || 'ISO/IEC 17025:2017'
  );
  const [accuracyTolerance, setAccuracyTolerance] = useState(
    initialDevice?.accuracyTolerance || '± 0.001 g'
  );
  const [measurementRange, setMeasurementRange] = useState(
    initialDevice?.measurementRange || '0 - 220 g'
  );

  const [calibrationDate, setCalibrationDate] = useState(
    initialDevice?.lastCalibrationDate || todayStr
  );
  const [frequencyMonths, setFrequencyMonths] = useState(
    initialDevice?.calibrationFrequencyMonths || 6
  );
  const [expiryDate, setExpiryDate] = useState(
    initialDevice?.nextDueDate || calculateDefaultExpiry(todayStr, 6)
  );

  // Third-Party Certificate Options (Uploaded external file, not generated)
  const [isThirdParty, setIsThirdParty] = useState(
    initialDevice?.isThirdPartyCertified ?? true
  );
  const [agency, setAgency] = useState(
    initialDevice?.calibrationAgency || 'National Metrology Institute (BSTI)'
  );
  const [certificateNumber, setCertificateNumber] = useState(
    initialDevice?.certificateNumber ||
      `CERT-BSTI-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [calibratedBy, setCalibratedBy] = useState(
    initialDevice?.calibratedBy || 'Engr. M. Rahman (Metrologist)'
  );
  const [calibrationResult, setCalibrationResult] = useState<'PASS' | 'ADJUSTED' | 'OUT_OF_TOLERANCE'>(
    initialDevice?.calibrationResult || 'PASS'
  );
  const [remarks, setRemarks] = useState(
    initialDevice?.remarks || 'ISO 17025 external third-party multi-point verification passed.'
  );

  // Uploaded Certificate Document (PDF or Image)
  const [certFileType, setCertFileType] = useState<'PDF' | 'IMAGE'>(
    initialDevice?.certificateFileType || 'PDF'
  );
  const [certFileName, setCertFileName] = useState(
    initialDevice?.certificateFileName || 'BSTI-ISO17025-Accredited-Cert.pdf'
  );
  const [certFileUrl, setCertFileUrl] = useState(
    initialDevice?.certificateFileUrl ||
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=60'
  );
  const [certFileSize, setCertFileSize] = useState('1.4 MB');

  // Handle Preset Equipment Click
  const handleSelectPreset = (preset: typeof PRESET_EQUIPMENT_IMAGES[0]) => {
    setEquipmentImage(preset.url);
    if (!deviceName) setDeviceName(preset.label);
    if (!brandName) setBrandName(preset.brand);
    if (!standardBasis) setStandardBasis(preset.standard);
    if (!accuracyTolerance) setAccuracyTolerance(preset.tolerance);
  };

  // Handle Certificate File Upload (PDF or Image)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const type: 'PDF' | 'IMAGE' = isPdf ? 'PDF' : 'IMAGE';
    setCertFileType(type);
    setCertFileName(file.name);
    setCertFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = () => {
      setCertFileUrl(reader.result as string);
      showToast(`Uploaded certificate file: ${file.name} (${type})`);
    };
    reader.readAsDataURL(file);
  };

  // Handle Preset Certificate Selection
  const handleSelectPresetCert = (preset: typeof PRESET_CERTIFICATES[0]) => {
    setCertFileName(preset.name);
    setCertFileType(preset.type);
    setCertFileUrl(preset.url);
    setAgency(preset.agency);
    showToast(`Loaded sample uploaded certificate: ${preset.name}`);
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

    if (!deviceName.trim()) {
      showToast('Please enter an equipment name');
      return;
    }

    const today = new Date();
    const exp = new Date(expiryDate);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const status = diff < 0 ? 'OVERDUE' : diff <= 30 ? 'DUE_SOON' : 'CALIBRATED';

    const savedDevice: CalibrationDevice = {
      id: initialDevice?.id || `cal-${Date.now()}`,
      deviceTag,
      deviceName,
      brandName,
      model,
      serialNumber,
      equipmentImage,
      location,
      department,
      standardBasis,
      accuracyTolerance,
      measurementRange,
      lastCalibrationDate: calibrationDate,
      nextDueDate: expiryDate,
      calibrationFrequencyMonths: frequencyMonths,
      status,
      isThirdPartyCertified: isThirdParty,
      certificateNumber,
      calibrationAgency: isThirdParty ? agency : 'Internal QMS Metrology Lab',
      certificateFileName: isThirdParty ? certFileName : undefined,
      certificateFileUrl: isThirdParty ? certFileUrl : undefined,
      certificateFileType: isThirdParty ? certFileType : undefined,
      calibratedBy,
      calibrationResult,
      remarks,
      calibrationHistory: initialDevice?.calibrationHistory || [
        {
          id: `hist-${Date.now()}`,
          calibrationDate,
          expiryDate,
          certificateNumber,
          agency: isThirdParty ? agency : 'Internal QMS Metrology Lab',
          isThirdParty,
          calibratedBy,
          standardUsed: standardBasis,
          result: calibrationResult,
          toleranceFound: accuracyTolerance,
          notes: remarks,
          certificateFileName: certFileName,
          certificateFileUrl: certFileUrl,
          certificateFileType: certFileType,
        },
      ],
    };

    onSave(savedDevice);
    showToast(
      isEdit
        ? `Updated equipment specifications for ${savedDevice.deviceTag}`
        : `Registered calibrated equipment ${savedDevice.deviceTag}`
    );
  };

  const previewDeviceForModal: CalibrationDevice = {
    id: 'preview',
    deviceTag,
    deviceName: deviceName || 'Equipment Preview',
    brandName,
    model,
    serialNumber,
    equipmentImage,
    location,
    department,
    standardBasis,
    accuracyTolerance,
    measurementRange,
    lastCalibrationDate: calibrationDate,
    nextDueDate: expiryDate,
    calibrationFrequencyMonths: frequencyMonths,
    status: 'CALIBRATED',
    isThirdPartyCertified: isThirdParty,
    certificateNumber,
    calibrationAgency: agency,
    certificateFileName: certFileName,
    certificateFileUrl: certFileUrl,
    certificateFileType: certFileType,
    calibratedBy,
    calibrationResult,
    remarks,
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Top Header Bar (Compact) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Back to Registry"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{isEdit ? 'Edit Equipment Specs' : 'Equipment Calibration Entry'}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                {deviceTag}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Register equipment with brand, serial number, ISP standards, and uploaded third-party PDF certificate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEdit ? 'Save Changes' : 'Save Equipment'}</span>
          </button>
        </div>
      </div>

      {/* COMPACT ENTRY FORM WITH REDUCED GAPS */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        {/* Section 1: Equipment Profile & Specifications */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              1. Equipment Identification & Physical Attributes
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Equipment Tag / Asset ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={deviceTag}
                onChange={(e) => setDeviceTag(e.target.value)}
                placeholder="e.g. CAL-BAL-01"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Equipment Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Digital Analytical Balance"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Brand / Manufacturer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Sartorius, James Heal, Lock, Instron"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Model / Type <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Entris II 220g"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Serial Number (SN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-SAR-884210"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Department / Lab Division
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Fabric Testing Lab">Fabric Testing Lab</option>
                <option value="Color Fastness Testing Lab">Color Fastness Lab</option>
                <option value="Physical & Mechanical Testing Lab">Physical & Mechanical Lab</option>
                <option value="Garments Finishing & Packing">Garments Finishing & Packing</option>
                <option value="Raw Material Warehouse">Raw Material Warehouse</option>
                <option value="Sewing Floor">Sewing Floor Quality</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Physical Location / Room Bench
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Fabric Testing Lab Room 102 Bench B"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Equipment Image Presets (Compact) */}
          <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
            <div className="w-10 h-8 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
              {equipmentImage ? (
                <img src={equipmentImage} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] w-full">
              <span className="text-slate-400 text-[10px] shrink-0 font-medium">Quick Equipment:</span>
              {PRESET_EQUIPMENT_IMAGES.slice(0, 5).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-left shrink-0 transition-colors cursor-pointer text-[10px] font-medium ${
                    equipmentImage === preset.url
                      ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-3.5 h-3.5 rounded object-cover" />
                  <span>{preset.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: ISP / ISO Standard Basis */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              2. Metrology Standards & ISP Basis
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Standard Basis (ISO / ASTM) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={standardBasis}
                onChange={(e) => setStandardBasis(e.target.value)}
                placeholder="e.g. ISO/IEC 17025, ASTM D3776"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Measurement Operational Range
              </label>
              <input
                type="text"
                value={measurementRange}
                onChange={(e) => setMeasurementRange(e.target.value)}
                placeholder="e.g. 0.001 g - 220 g, 0 - 5000 N"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Permissible Accuracy / Tolerance <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={accuracyTolerance}
                onChange={(e) => setAccuracyTolerance(e.target.value)}
                placeholder="e.g. ± 0.001 g, ± 0.5%"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold text-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Calibration Cycle & UPLOADED Third-Party Certificate (Not Generated) */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
            <Award className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              3. Calibration Cycle & Uploaded Third-Party Certificate
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Calibration Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={calibrationDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Cycle Frequency
              </label>
              <select
                value={frequencyMonths}
                onChange={(e) => handleFrequencyChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 Month (High Risk)</option>
                <option value={3}>3 Months (Cutter Blades)</option>
                <option value={6}>6 Months (Precision Balances)</option>
                <option value={12}>12 Months (Annual Tensile)</option>
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

          {/* Third-Party Uploaded Certificate Box (Reduced Gap, Clear Non-Generated Notice) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-xs">
                <input
                  type="checkbox"
                  checked={isThirdParty}
                  onChange={(e) => setIsThirdParty(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Attach Third-Party Certificate (Uploaded PDF / Image)</span>
              </label>
              <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Official External Document • Not System Generated
              </span>
            </div>

            {isThirdParty && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200 text-xs">
                {/* Agency, Cert No, Auditor Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Accredited Agency <span className="text-[10px] text-slate-400 font-normal">(Editable & Selectable)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        list="entry-agency-suggestions"
                        value={agency}
                        onChange={(e) => setAgency(e.target.value)}
                        placeholder="Type agency name or pick from list..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                      <datalist id="entry-agency-suggestions">
                        <option value="National Metrology Institute (BSTI)" />
                        <option value="TÜV Rheinland Metrology Services" />
                        <option value="SGS Technical Metrology Bangladesh" />
                        <option value="Intertek Third-Party Metrology Services" />
                        <option value="Bureau Veritas Certification Bangladesh" />
                        <option value="James Heal Certified Calibration Service" />
                        <option value="Instron Global Field Service" />
                        <option value="UL Solutions Metrology" />
                        <option value="Shirley Technologies (BTTG)" />
                      </datalist>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) setAgency(e.target.value);
                        }}
                        className="px-2 py-1.5 text-[11px] rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 cursor-pointer max-w-[85px] shrink-0"
                        title="Pick agency from standard presets"
                      >
                        <option value="">Presets ▾</option>
                        <option value="National Metrology Institute (BSTI)">BSTI</option>
                        <option value="TÜV Rheinland Metrology Services">TÜV Rheinland</option>
                        <option value="SGS Technical Metrology Bangladesh">SGS</option>
                        <option value="Intertek Third-Party Metrology Services">Intertek</option>
                        <option value="Bureau Veritas Certification Bangladesh">Bureau Veritas</option>
                        <option value="James Heal Certified Calibration Service">James Heal</option>
                        <option value="Instron Global Field Service">Instron</option>
                        <option value="UL Solutions Metrology">UL Solutions</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Certificate Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={isThirdParty}
                      value={certificateNumber}
                      onChange={(e) => setCertificateNumber(e.target.value)}
                      placeholder="e.g. CERT-BSTI-2026-778"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Lead Metrologist / Auditor
                    </label>
                    <input
                      type="text"
                      value={calibratedBy}
                      onChange={(e) => setCalibratedBy(e.target.value)}
                      placeholder="e.g. Engr. M. Rahman"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Uploaded Certificate File Card & Controls (Ultra-Compact) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Upload Box */}
                  <div
                    onClick={() => certFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-400 p-2.5 rounded-xl flex items-center gap-3 bg-white hover:bg-indigo-50/20 cursor-pointer transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs">
                        Upload Third-Party Certificate PDF
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Supports .pdf, .jpg, .png (Max 15MB)
                      </div>
                    </div>
                    <input
                      ref={certFileInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Attached Document Summary Card */}
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            certFileType === 'PDF'
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {certFileType === 'PDF' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-mono font-bold text-slate-900 text-xs truncate max-w-[150px]"
                            title={certFileName}
                          >
                            {certFileName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {certFileType} Document • {certFileSize}
                          </div>
                        </div>
                      </div>

                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => setIsPreviewCertOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </button>
                    </div>

                    {/* Presets */}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1 flex-wrap mt-1">
                      <span className="text-[9px] text-slate-400 font-medium">Sample PDF:</span>
                      {PRESET_CERTIFICATES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPresetCert(preset)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            certFileName === preset.name
                              ? 'bg-indigo-100 border-indigo-300 text-indigo-800 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {preset.name.split('-')[0]} ({preset.type})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Calibration Verdict / Result
              </label>
              <select
                value={calibrationResult}
                onChange={(e) => setCalibrationResult(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="PASS" className="text-emerald-700">PASS - Within Tolerances</option>
                <option value="ADJUSTED" className="text-amber-700">ADJUSTED - Re-zeroed</option>
                <option value="OUT_OF_TOLERANCE" className="text-rose-700">OUT OF TOLERANCE - Quarantine</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Audit Remarks & Verification Notes
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Multi-point certified calibration notes..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Form Actions (Compact) */}
        <div className="pt-2.5 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEdit ? 'Update Equipment Specs' : 'Save & Register Calibrated Equipment'}</span>
          </button>
        </div>
      </form>

      {/* Uploaded Certificate Document Preview Modal */}
      {isPreviewCertOpen && (
        <CalibrationCertificateModal
          device={previewDeviceForModal}
          isOpen={isPreviewCertOpen}
          onClose={() => setIsPreviewCertOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
