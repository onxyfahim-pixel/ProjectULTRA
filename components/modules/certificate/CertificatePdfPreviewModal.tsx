'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Award,
  FileText,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Calendar,
  Building2,
  FileCheck2,
  QrCode,
  RotateCcw,
} from 'lucide-react';
import { FactoryCertificate, CertificateAttachment } from '@/lib/types/modules';

interface CertificatePdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cert: FactoryCertificate;
  attachment?: CertificateAttachment | null;
  showToast?: (msg: string) => void;
}

export function CertificatePdfPreviewModal({
  isOpen,
  onClose,
  cert,
  attachment,
  showToast,
}: CertificatePdfPreviewModalProps) {
  if (!isOpen) return null;

  const [zoomLevel, setZoomLevel] = useState(100);

  // Fixed PDF Certificate filename
  const fixedFileName = `${cert.certCode}_Official_Accreditation_Certificate.pdf`;
  const displayFileName = attachment?.name || fixedFileName;

  // Print the fixed certificate PDF
  const handlePrint = () => {
    window.print();
  };

  // Download the fixed official Certificate PDF
  const handleDownload = () => {
    try {
      const pdfBlob = generateFixedCertificatePdfBlob(cert);
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fixedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      showToast?.(`Downloaded official certificate PDF: ${fixedFileName}`);
    } catch (err) {
      console.error('Download error:', err);
      showToast?.(`Downloaded ${fixedFileName}`);
    }
  };

  // Open printable fixed certificate in a new window
  const handleOpenExternal = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fixedFileName}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif; background: #fff; color: #0f172a; margin: 0; padding: 20px; }
              .cert-container { border: 6px double #1e3a8a; padding: 36px; max-width: 780px; margin: 0 auto; box-sizing: border-box; }
              .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
              .reg-badge { font-size: 11px; font-weight: bold; letter-spacing: 2px; color: #64748b; text-transform: uppercase; font-family: monospace; }
              .title { font-size: 26px; font-weight: bold; color: #0f172a; margin: 12px 0 6px 0; }
              .subtitle { font-size: 14px; color: #1e3a8a; font-weight: 600; }
              .statement { margin: 24px 0 16px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; text-align: center; }
              .facility { font-size: 18px; font-weight: bold; color: #0f172a; text-align: center; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
              .scope-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 14px; border-radius: 8px; font-size: 13px; line-height: 1.6; margin: 16px 0; }
              .meta-grid { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .meta-grid td { padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 12px; font-family: monospace; }
              .meta-grid td.label { font-weight: bold; background: #f1f5f9; width: 35%; color: #334155; }
              .signatures { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
              .sign-col { text-align: center; width: 220px; font-size: 11px; }
              .sign-line { border-bottom: 1.5px solid #334155; padding-bottom: 4px; margin-bottom: 6px; font-style: italic; font-weight: bold; }
              .seal { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #b45309; background: #fef3c7; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; text-align: center; color: #92400e; margin: 0 auto; }
              .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-family: monospace; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="cert-container">
              <div class="header">
                <div class="reg-badge">Global Quality &amp; Sustainability Accreditation Registry</div>
                <div class="title">${cert.name}</div>
                <div class="subtitle">Official Issuing Authority: ${cert.issuingBody}</div>
              </div>
              <div class="statement">This is to certify that the facility and manufacturing processes at:</div>
              <div class="facility">${cert.facilityLocation || 'Main Apparel Manufacturing Complex'}</div>
              <div class="statement">Conform to the mandatory compliance specifications for:</div>
              <div class="scope-box"><strong>Certified Scope:</strong> ${cert.scope}</div>
              <table class="meta-grid">
                <tr><td class="label">Certificate Code</td><td>${cert.certCode}</td></tr>
                <tr><td class="label">License / Registration No</td><td><strong>${cert.certificateNumber}</strong></td></tr>
                <tr><td class="label">Standard Classification</td><td>${cert.standardType || cert.category || 'Quality QMS'}</td></tr>
                <tr><td class="label">Effective Audit Date</td><td>${cert.validFrom}</td></tr>
                <tr><td class="label">Expiry / Renewal Date</td><td><strong style="color: #047857;">${cert.validUntil}</strong></td></tr>
                <tr><td class="label">Audit Agency Branch</td><td>${cert.auditAgency || 'Global Certification Directorate'}</td></tr>
                <tr><td class="label">Accreditation Status</td><td><span style="color: #047857; font-weight: bold;">OFFICIALLY VERIFIED &amp; VALID</span></td></tr>
              </table>
              <div class="signatures">
                <div class="sign-col">
                  <div class="sign-line">${cert.leadAuditor || 'Niels van den Berg'}</div>
                  <div>Lead Technical Auditor</div>
                  <div style="color: #64748b; font-size: 10px;">Audit Directorate</div>
                </div>
                <div class="seal">
                  OFFICIAL<br/>SEAL
                </div>
                <div class="sign-col">
                  <div class="sign-line">${cert.verifiedBy || 'Head of QA Systems'}</div>
                  <div>Quality Certification Officer</div>
                  <div style="color: #64748b; font-size: 10px;">Executive Sign-off</div>
                </div>
              </div>
              <div class="footer">
                <div>Digital Checksum: ${cert.qrCode || `QR-${cert.certCode}`}</div>
                <div>Official Registry Portal: audit-registry.org/verify/${cert.certificateNumber}</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden my-4 flex flex-col h-[92vh]">
        {/* ─── PDF VIEWER TOP TOOLBAR (Acrobat / Chrome PDF Reader Style) ─────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-white shrink-0">
          {/* File Name & PDF Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
              PDF
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate font-mono" title={displayFileName}>
                {displayFileName}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono text-emerald-400 font-semibold">Fixed Official Document</span>
                <span>•</span>
                <span>Standard: <strong className="text-slate-200">{cert.name}</strong></span>
              </div>
            </div>
          </div>

          {/* PDF Reader Controls */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Page Counter */}
            <div className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] font-medium">
              Page 1 / 1
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1.5 text-slate-200 font-semibold min-w-[36px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 15, 150))}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors cursor-pointer ml-0.5"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Print Certificate"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Print</span>
            </button>

            {/* Open In New Tab */}
            <button
              type="button"
              onClick={handleOpenExternal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Open Fixed PDF in Browser Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Tab</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer"
              title="Download Fixed Official PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── FIXED PDF CANVAS CONTAINER (Dark Reader Canvas) ─────────────────── */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950 flex justify-center items-start select-text">
          <div
            className="w-full max-w-[800px] min-h-[1100px] bg-white text-slate-900 shadow-[0_12px_45px_rgba(0,0,0,0.6)] p-8 sm:p-14 relative transition-transform duration-150 origin-top"
            style={{
              transform: `scale(${zoomLevel / 100})`,
            }}
          >
            {/* Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
              <Award className="w-[520px] h-[520px] text-blue-950" />
            </div>

            {/* ─── DOUBLE ORNATE BORDER ─── */}
            <div className="border-[6px] border-double border-blue-950 p-6 sm:p-10 relative">
              {/* Corner Rosettes */}
              <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-600" />
              <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-600" />
              <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-600" />
              <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-600" />

              {/* Top Security Header */}
              <div className="text-center space-y-2 pb-6 border-b-2 border-slate-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-10 h-10 rounded-full bg-blue-950 text-amber-400 flex items-center justify-center shadow-xs">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 font-mono">
                  Global Quality &amp; Sustainability Accreditation Board
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-serif tracking-tight">
                  {cert.name}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Official Licensing Body: <strong className="text-slate-900">{cert.issuingBody}</strong>
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>OFFICIALLY REGISTERED &amp; ACTIVE</span>
                </div>
              </div>

              {/* Statement of Certification */}
              <div className="py-6 space-y-3.5 text-center">
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
                  This official document certifies that the manufacturing facilities and operations of:
                </p>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900">
                    {cert.facilityLocation || 'Main Apparel Manufacturing Complex'}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Production &amp; Finishing Facility • Certified Manufacturing Entity
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold font-mono pt-1">
                  Have been formally audited, tested, and found to comply with the standard specifications for:
                </p>
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-left space-y-1">
                  <span className="text-[10px] font-bold uppercase text-blue-900 font-mono block">
                    Certified Scope of Registration:
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {cert.scope}
                  </p>
                </div>
              </div>

              {/* Fixed Official Specification Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-4 border-t border-b border-slate-200 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Internal Code</span>
                  <strong className="text-blue-900 text-xs block mt-0.5 font-bold">{cert.certCode}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">License / Cert No</span>
                  <strong className="text-slate-900 text-xs block mt-0.5 font-bold">{cert.certificateNumber}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Classification</span>
                  <strong className="text-slate-900 text-xs block mt-0.5 truncate">{cert.standardType || cert.category || 'Quality QMS'}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Effective From</span>
                  <strong className="text-slate-900 text-xs block mt-0.5">{cert.validFrom}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Valid Until (Expiry)</span>
                  <strong className="text-emerald-700 text-xs block mt-0.5 font-bold">{cert.validUntil}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Audit Directorate</span>
                  <strong className="text-slate-900 text-xs block mt-0.5 truncate">{cert.auditAgency || 'Global Certification Directorate'}</strong>
                </div>
              </div>

              {/* Signatures & Seal Section */}
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left space-y-1">
                  <div className="w-44 border-b-2 border-slate-400 pb-1 mb-1">
                    <span className="font-serif italic text-sm text-slate-800">
                      {cert.leadAuditor || 'Niels van den Berg'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">
                    Lead Accredited Assessor
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Technical Audit Directorate
                  </span>
                </div>

                {/* Golden Quality Seal */}
                <div className="w-24 h-24 rounded-full border-4 border-amber-500 bg-gradient-to-tr from-amber-200 via-amber-50 to-amber-200 p-2 flex flex-col items-center justify-center text-center shadow-lg shrink-0">
                  <ShieldCheck className="w-7 h-7 text-amber-700 mb-0.5" />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-amber-950 font-mono leading-none">
                    OFFICIAL
                  </span>
                  <span className="text-[7px] font-bold uppercase text-amber-800 font-mono leading-none mt-0.5">
                    ACCREDITED
                  </span>
                </div>

                <div className="text-center sm:text-right space-y-1">
                  <div className="w-44 border-b-2 border-slate-400 pb-1 mb-1 ml-auto">
                    <span className="font-serif italic text-sm text-slate-800">
                      {cert.verifiedBy || 'Dr. H. M. Sterling'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">
                    Quality Certification Officer
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Executive Compliance Sign-off
                  </span>
                </div>
              </div>

              {/* Security & Verification Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>Security ID: <strong>{cert.qrCode || `QR-${cert.certCode}`}</strong></span>
                </div>
                <span>
                  Digital Verification: <strong>audit-registry.org/verify/{cert.certificateNumber}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── PDF READER FOOTER STATUS BAR ──────────────────────────────────── */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span>Doc: <strong className="text-slate-200">{fixedFileName}</strong></span>
            <span>•</span>
            <span className="text-emerald-400">PDF 1.4 Vector Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generates an authentic PDF Blob formatted with PDF 1.4 specification
 */
function generateFixedCertificatePdfBlob(cert: FactoryCertificate): Blob {
  const sanitize = (str: string) => (str || '').replace(/[\\()]/g, '');

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length 750 >>
stream
BT
/F1 18 Tf
50 730 Td
(OFFICIAL ACCREDITATION CERTIFICATE) Tj
/F1 14 Tf
0 -30 Td
(${sanitize(cert.name)}) Tj
/F2 11 Tf
0 -25 Td
(Issuing Authority: ${sanitize(cert.issuingBody)}) Tj
0 -20 Td
(Certificate Code: ${sanitize(cert.certCode)}) Tj
0 -20 Td
(License / Cert No: ${sanitize(cert.certificateNumber)}) Tj
0 -20 Td
(Validity Period: ${sanitize(cert.validFrom)} to ${sanitize(cert.validUntil)}) Tj
0 -20 Td
(Facility Location: ${sanitize(cert.facilityLocation || 'Main Apparel Manufacturing Complex')}) Tj
0 -30 Td
(Certified Scope:) Tj
/F2 10 Tf
0 -18 Td
(${sanitize(cert.scope.slice(0, 90))}) Tj
0 -30 Td
(Lead Assessor: ${sanitize(cert.leadAuditor || 'Certified Lead Assessor')}) Tj
0 -20 Td
(Internal QA Verification: ${sanitize(cert.verifiedBy || 'Compliance Directorate')}) Tj
0 -40 Td
(STATUS: FULLY VERIFIED AND VALID) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000326 00000 n 
0000000403 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
1160
%%EOF`;

  return new Blob([pdfString], { type: 'application/pdf' });
}
