'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Award,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Calendar,
  Building2,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { CalibrationDevice } from '@/lib/types/modules';

interface CalibrationCertificateModalProps {
  device: CalibrationDevice;
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export function CalibrationCertificateModal({
  device,
  isOpen,
  onClose,
  showToast,
}: CalibrationCertificateModalProps) {
  if (!isOpen) return null;

  const [zoomLevel, setZoomLevel] = useState(100);

  const isPdf =
    device.certificateFileType === 'PDF' ||
    !device.certificateFileType ||
    device.certificateFileName?.toLowerCase().endsWith('.pdf');

  const fileName =
    device.certificateFileName ||
    `${device.certificateNumber || 'ISO17025-Cert'}.${isPdf ? 'pdf' : 'png'}`;

  // Default fallback sample PDF data URL if none attached
  const fileUrl =
    device.certificateFileUrl ||
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80';

  // Print the uploaded file
  const handlePrint = () => {
    if (!fileUrl) return;

    const iframe = document.getElementById('uploaded-pdf-viewer-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      } catch (e) {
        // Fallback for cross-origin or restricted frames
      }
    }

    // Open file URL directly and print
    const printWindow = window.open(fileUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      window.print();
    }
  };

  // Real download of the uploaded file
  const handleDownload = () => {
    if (!fileUrl) {
      showToast?.('No certificate file found to download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || `${device.certificateNumber || 'calibration-certificate'}.${isPdf ? 'pdf' : 'png'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast?.(`Downloaded ${fileName}`);
    } catch (err) {
      console.error('Download error:', err);
      window.open(fileUrl, '_blank');
      showToast?.(`Opening ${fileName} for download`);
    }
  };

  const handleOpenExternal = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      showToast?.('No file URL available');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col h-[90vh]">
        {/* Modal Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50/95 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isPdf ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-[260px] sm:max-w-md font-mono" title={fileName}>
                  {fileName}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    isPdf
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {isPdf ? 'UPLOADED PDF' : 'UPLOADED IMAGE'}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>External Third-Party Certificate</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">
                Agency: <span className="font-semibold text-slate-800">{device.calibrationAgency}</span> • Cert No: <span className="font-semibold text-slate-800">{device.certificateNumber}</span>
              </p>
            </div>
          </div>

          {/* Viewer Controls */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 text-slate-600 font-semibold min-w-[36px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 15, 160))}
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenExternal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              title="Open uploaded file in full browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Tab</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              title="Print uploaded certificate"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs"
              title="Download uploaded certificate file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Sub-bar */}
        <div className="bg-slate-100/95 border-b border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span>
              Device: <strong className="text-slate-900">{device.deviceTag}</strong> ({device.deviceName})
            </span>
            <span>•</span>
            <span>
              Calibrated: <strong className="text-slate-900">{device.lastCalibrationDate}</strong>
            </span>
            <span>•</span>
            <span>
              Expiry Date: <strong className="text-emerald-700 font-bold">{device.nextDueDate}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-sans">Accredited Agency:</span>
            <span className="px-2 py-0.5 rounded bg-white text-indigo-800 border border-slate-200 font-bold text-[10px]">
              {device.calibrationAgency}
            </span>
          </div>
        </div>

        {/* Actual Uploaded File Document Viewer Canvas */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 bg-slate-200/80 flex items-center justify-center">
          <div
            className="w-full h-full rounded-xl bg-white border border-slate-300 shadow-md overflow-hidden flex flex-col"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}
          >
            {/* If uploaded file is a PDF */}
            {isPdf ? (
              <div className="w-full h-full flex flex-col bg-slate-100">
                {/* Embedded PDF iframe / object viewer */}
                <object
                  data={fileUrl}
                  type="application/pdf"
                  className="w-full flex-1 rounded-xl"
                >
                  <iframe
                    id="uploaded-pdf-viewer-frame"
                    src={fileUrl}
                    className="w-full h-full border-0 rounded-xl bg-white"
                    title="Uploaded PDF Certificate"
                  >
                    <div className="p-8 text-center bg-white space-y-4 m-6 rounded-xl border border-slate-200">
                      <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm">
                        Uploaded Certificate PDF Document ({fileName})
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Your browser can view or download this uploaded PDF document directly.
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleOpenExternal}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                        >
                          Open PDF in New Window
                        </button>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                        >
                          Download PDF File
                        </button>
                      </div>
                    </div>
                  </iframe>
                </object>
              </div>
            ) : (
              /* If uploaded file is an Image Scan */
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50 overflow-auto">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-h-[650px] w-auto max-w-full rounded-lg border border-slate-300 shadow-md object-contain"
                />
                <p className="text-xs text-slate-500 font-mono mt-3">
                  Uploaded External Calibration Certificate Scan • {fileName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono text-[11px] truncate max-w-md">
            File: <strong>{fileName}</strong> (Uploaded External Document • {device.calibrationAgency})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
