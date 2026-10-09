import { FactoryCertificate } from '@/lib/types/modules';
import { loadPdfHeaderSettings, renderPdfHeaderHtml, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Certificates Vault module
 */
export function computeCertificateKpis(certs: FactoryCertificate[]) {
  const total = certs.length;
  const valid = certs.filter((c) => c.status === 'VALID').length;
  const expiringSoon = certs.filter((c) => c.status === 'EXPIRING_SOON').length;
  const expired = certs.filter((c) => c.status === 'EXPIRED').length;

  const quality = certs.filter((c) => c.category === 'QUALITY_QMS').length;
  const socialEco = certs.filter(
    (c) =>
      c.category === 'SOCIAL_COMPLIANCE' ||
      c.category === 'ENVIRONMENTAL' ||
      c.category === 'CHEMICAL_SAFETY'
  ).length;

  const linkedPos = new Set(certs.map((c) => c.poNumber).filter(Boolean)).size;
  const validityRate = total > 0 ? Math.round((valid / total) * 100) : 100;

  return {
    total,
    valid,
    expiringSoon,
    expired,
    quality,
    socialEco,
    linkedPos,
    validityRate,
  };
}

/**
 * Download CSV helper
 */
export function downloadCertificateCsv(
  fileName: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  try {
    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const val = cell !== null && cell !== undefined ? String(cell) : '';
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    console.error('Failed to download CSV:', err);
  }
}

/**
 * Export Global Certificate Master Register PDF
 */
export function exportCertificateRegisterPdf(
  certs: FactoryCertificate[],
  scopeLabel: string = 'All Factory Certificates'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeCertificateKpis(certs);
  const pdfSettings = loadPdfHeaderSettings();
  const exportConfig = getModuleExportConfig(pdfSettings, 'certificate', 'register');
  const docCode = exportConfig.fullDocCode;
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    exportConfig.title,
    docCode,
    new Date().toISOString().split('T')[0],
    exportConfig.department
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALID':
        return '#15803d';
      case 'EXPIRING_SOON':
        return '#b45309';
      case 'EXPIRED':
        return '#be123c';
      default:
        return '#15803d';
    }
  };

  const rowsHtml = certs
    .map(
      (c, index) => `
      <tr>
        <td style="text-align: center; font-mono; font-size: 8pt; color: #64748b;">${index + 1}</td>
        <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${c.certCode}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a;">${c.name}</div>
          <div style="font-size: 7.5pt; color: #64748b;">${c.issuingBody}</div>
        </td>
        <td style="font-family: monospace; font-size: 8pt; color: #334155;">${c.certificateNumber}</td>
        <td><span style="font-size: 7.5pt; font-weight: 600; color: #475569;">${(c.category || 'QUALITY_QMS').replace('_', ' ')}</span></td>
        <td style="font-size: 8pt; color: #334155;">${c.scope ? c.scope.slice(0, 75) + (c.scope.length > 75 ? '...' : '') : 'Full manufacturing & export scope'}</td>
        <td style="font-family: monospace; font-size: 8pt; white-space: nowrap;">
          ${c.validFrom} to <strong>${c.validUntil}</strong>
        </td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: bold; color: ${getStatusColor(c.status)}; background: #f8fafc; border: 1px solid ${getStatusColor(c.status)}33;">
            ${c.status.replace('_', ' ')}
          </span>
          <div style="font-size: 7pt; font-weight: 600; color: #64748b; margin-top: 2px;">
            ${c.daysRemaining} days left
          </div>
        </td>
        <td style="font-size: 8pt; color: #475569;">
          ${c.poNumber ? `<span style="font-family: monospace; font-weight: 600; color: #1e40af;">PO: ${c.poNumber}</span><br/>` : ''}
          ${c.buyerName ? `<span style="font-size: 7.5pt; color: #64748b;">${c.buyerName}</span>` : 'Factory Wide'}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certificates_Register_${new Date().toISOString().slice(0, 10)}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 12mm 10mm 12mm;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 15px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .kpi-bar {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
            margin: 12px 0 16px 0;
            padding: 10px 14px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          .kpi-item {
            text-align: center;
          }
          .kpi-val {
            font-size: 14pt;
            font-weight: 800;
            color: #1e3a8a;
            font-family: monospace;
          }
          .kpi-lbl {
            font-size: 7pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-top: 8px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 7px 8px;
            border: 1px solid #0f172a;
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .sign-block {
            margin-top: 24px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
          .sign-box {
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            text-align: center;
          }
          .sign-title {
            font-weight: 700;
            font-size: 8.5pt;
            color: #1e293b;
          }
          .sign-sub {
            font-size: 7.5pt;
            color: #64748b;
          }
          .footer-strip {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8pt;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
          <button onclick="window.print()" style="padding: 6px 14px; background: #1e3a8a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">
            Print / Save as PDF
          </button>
        </div>

        ${dynamicHeaderHtml}

        <div class="kpi-bar">
          <div class="kpi-item">
            <div class="kpi-val">${kpis.total}</div>
            <div class="kpi-lbl">Total Certificates</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #15803d;">${kpis.valid}</div>
            <div class="kpi-lbl">Valid & Active</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #b45309;">${kpis.expiringSoon}</div>
            <div class="kpi-lbl">Expiring Soon</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #be123c;">${kpis.expired}</div>
            <div class="kpi-lbl">Expired</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${kpis.quality}</div>
            <div class="kpi-lbl">Quality / QMS</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${kpis.socialEco}</div>
            <div class="kpi-lbl">Social / Eco / Chem</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">#</th>
              <th style="width: 10%;">Cert Code</th>
              <th style="width: 22%;">Standard & Body</th>
              <th style="width: 12%;">License / Cert No</th>
              <th style="width: 11%;">Category</th>
              <th style="width: 18%;">Certified Scope</th>
              <th style="width: 13%;">Validity Window</th>
              <th style="width: 8%; text-align: center;">Status</th>
              <th style="width: 12%;">Order Link</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Head of Compliance</div>
            <div class="sign-sub">Corporate Social & Environmental</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Lead QA Auditor</div>
            <div class="sign-sub">Technical Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">General Manager (QMS)</div>
            <div class="sign-sub">Quality Management Systems</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Managing Director</div>
            <div class="sign-sub">Executive Sign-off</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Document Code: <strong>${docCode}</strong> • Ref: ISO 9001:2015 Clause 8.4</span>
          <span>Printed On: ${new Date().toLocaleString()}</span>
          <span>Security Notice: CONFIDENTIAL COMPLIANCE VAULT</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Global Certificates Excel (.xls)
 */
export function exportCertificateRegisterExcel(
  certs: FactoryCertificate[],
  scopeLabel: string = 'All Factory Certificates'
): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.certificateRegister || 'CERT-REG'}`;
  const fileName = `Certificates_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = certs
    .map(
      (c, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-family: monospace;">${c.certCode}</td>
          <td>${c.name}</td>
          <td>${c.issuingBody}</td>
          <td>${c.certificateNumber}</td>
          <td>${c.category || 'QUALITY_QMS'}</td>
          <td>${c.scope}</td>
          <td>${c.facilityLocation || 'Main Facility'}</td>
          <td>${c.validFrom}</td>
          <td>${c.validUntil}</td>
          <td>${c.daysRemaining}</td>
          <td>${c.status}</td>
          <td>${c.poNumber || ''}</td>
          <td>${c.styleNumber || ''}</td>
          <td>${c.buyerName || ''}</td>
          <td>${c.leadAuditor || ''}</td>
          <td>${c.verifiedBy || ''}</td>
        </tr>
      `
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; }
          td { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="17" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="17" style="font-size: 12pt; font-weight: bold;">
              FACTORY ACCREDITATION &amp; COMPLIANCE CERTIFICATES MASTER REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="17" style="color: #64748b;">
              Scope: ${scopeLabel} | Doc Code: ${docCode} | Generated: ${new Date().toLocaleString()}
            </td>
          </tr>
          <tr><td colspan="17"></td></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>Cert Code</th>
              <th>Certificate Name</th>
              <th>Issuing Body</th>
              <th>License / Cert No</th>
              <th>Category</th>
              <th>Scope</th>
              <th>Facility Location</th>
              <th>Valid From</th>
              <th>Valid Until</th>
              <th>Days Remaining</th>
              <th>Status</th>
              <th>PO Number</th>
              <th>Style Number</th>
              <th>Buyer Name</th>
              <th>Lead Auditor</th>
              <th>Verified By</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export Global Certificates CSV
 */
export function exportCertificateRegisterCsv(
  certs: FactoryCertificate[],
  scopeLabel: string = 'All'
): void {
  const headers = [
    'Cert Code',
    'Certificate Name',
    'Issuing Body',
    'License / Cert No',
    'Category',
    'Scope',
    'Facility Location',
    'Valid From',
    'Valid Until',
    'Days Remaining',
    'Status',
    'PO Number',
    'Style Number',
    'Buyer Name',
    'Lead Auditor',
    'Verified By',
  ];

  const rows = certs.map((c) => [
    c.certCode,
    c.name,
    c.issuingBody,
    c.certificateNumber,
    c.category || 'QUALITY_QMS',
    c.scope,
    c.facilityLocation || '',
    c.validFrom,
    c.validUntil,
    c.daysRemaining,
    c.status,
    c.poNumber || '',
    c.styleNumber || '',
    c.buyerName || '',
    c.leadAuditor || '',
    c.verifiedBy || '',
  ]);

  const fileName = `Certificates_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCertificateCsv(fileName, headers, rows);
}

/**
 * Export Single Certificate Dossier PDF
 */
export function exportCertificateSinglePdf(cert: FactoryCertificate): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const exportConfig = getModuleExportConfig(pdfSettings, 'certificate', 'single', cert.certCode);
  const docCode = exportConfig.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    `${exportConfig.title}: ${cert.name}`,
    docCode,
    cert.validFrom || new Date().toISOString().split('T')[0],
    `${exportConfig.department} • Standard: ${cert.name}`
  );

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${cert.certCode}_Compliance_Dossier</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 14mm 12mm 14mm;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 15px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cert-badge-box {
            margin: 14px 0;
            padding: 14px 18px;
            border-radius: 10px;
            background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .cert-title {
            font-size: 15pt;
            font-weight: 800;
            color: #0f172a;
          }
          .cert-sub {
            font-size: 9pt;
            color: #475569;
            margin-top: 3px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 14px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            background: #ffffff;
          }
          .card-title {
            font-size: 8.5pt;
            font-weight: 800;
            text-transform: uppercase;
            color: #1e3a8a;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 4px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 8.5pt;
            padding: 4px 0;
            border-bottom: 1px dashed #f1f5f9;
          }
          .meta-label {
            color: #64748b;
            font-weight: 600;
          }
          .meta-value {
            font-weight: 700;
            color: #0f172a;
            text-align: right;
          }
          .scope-box {
            margin-top: 14px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            background: #f8fafc;
          }
          .sign-block {
            margin-top: 35px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 25px;
          }
          .sign-box {
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            text-align: center;
          }
          .sign-title {
            font-weight: 700;
            font-size: 8.5pt;
            color: #1e293b;
          }
          .sign-sub {
            font-size: 7.5pt;
            color: #64748b;
          }
          .footer-strip {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8pt;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
          <button onclick="window.print()" style="padding: 6px 14px; background: #1e3a8a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">
            Print / Save as PDF
          </button>
        </div>

        ${dynamicHeaderHtml}

        <div class="cert-badge-box">
          <div>
            <div class="cert-title">${cert.name}</div>
            <div class="cert-sub">Issuing Accreditation Body: <strong>${cert.issuingBody}</strong></div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 11pt; font-weight: 800; color: #1e3a8a;">${cert.certCode}</div>
            <div style="font-size: 8pt; font-weight: bold; color: ${cert.status === 'VALID' ? '#15803d' : '#b45309'};">
              STATUS: ${cert.status}
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title">Accreditation Identification</div>
            <div class="meta-row">
              <span class="meta-label">License / Cert No:</span>
              <span class="meta-value" style="font-family: monospace;">${cert.certificateNumber}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Standard Category:</span>
              <span class="meta-value">${(cert.category || 'QUALITY_QMS').replace('_', ' ')}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Facility / Unit:</span>
              <span class="meta-value">${cert.facilityLocation || 'Main Apparel Manufacturing Complex'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Audit Agency:</span>
              <span class="meta-value">${cert.auditAgency || cert.issuingBody}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Lead Auditor:</span>
              <span class="meta-value">${cert.leadAuditor || 'Certified Lead Assessor'}</span>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Validity &amp; Order Governance</div>
            <div class="meta-row">
              <span class="meta-label">Effective From:</span>
              <span class="meta-value" style="font-family: monospace;">${cert.validFrom}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Valid Until:</span>
              <span class="meta-value" style="font-family: monospace; color: #1e3a8a;">${cert.validUntil}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Days to Expiration:</span>
              <span class="meta-value">${cert.daysRemaining} days remaining</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Linked Buyer PO:</span>
              <span class="meta-value">${cert.poNumber ? `PO: ${cert.poNumber}` : 'Factory Wide Blanket'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Buyer / Style:</span>
              <span class="meta-value">${cert.buyerName || 'General'} ${cert.styleNumber ? `(${cert.styleNumber})` : ''}</span>
            </div>
          </div>
        </div>

        <div class="scope-box">
          <div style="font-size: 8.5pt; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            Certified Manufacturing Scope &amp; Processes
          </div>
          <div style="font-size: 8.5pt; line-height: 1.6; color: #334155;">
            ${cert.scope}
          </div>
          ${
            cert.remarks
              ? `<div style="margin-top: 8px; font-size: 8pt; color: #64748b; font-style: italic;">Special Remarks: ${cert.remarks}</div>`
              : ''
          }
        </div>

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Lead Compliance Auditor</div>
            <div class="sign-sub">${cert.leadAuditor || 'Accredited Lead Auditor'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">QA Verification Officer</div>
            <div class="sign-sub">${cert.verifiedBy || 'Dr. H. M. Sterling'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Head of Sustainability</div>
            <div class="sign-sub">Executive Quality Directorate</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Dossier Code: <strong>${docCode}</strong></span>
          <span>Security QR: ${cert.qrCode || `QR-${cert.certCode}`}</span>
          <span>Digital Verification: audit-registry.org/verify/${cert.certificateNumber}</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Single Certificate Dossier Excel (.xls)
 */
export function exportCertificateSingleExcel(cert: FactoryCertificate): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.certificateDossier || 'CERT-SPEC'}-${cert.certCode}`;
  const fileName = `Certificate_${cert.certCode}_Dossier.xls`;

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: left; }
          td { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="4" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 12pt; font-weight: bold;">
              OFFICIAL COMPLIANCE CERTIFICATE SPECIFICATION DOSSIER
            </td>
          </tr>
          <tr>
            <td colspan="4" style="color: #64748b;">
              Cert Code: ${cert.certCode} | License: ${cert.certificateNumber} | Doc Code: ${docCode}
            </td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr><th colspan="2">Parameter</th><th colspan="2">Certified Value</th></tr>
          <tr><td colspan="2">Certificate Reference</td><td colspan="2">${cert.certCode}</td></tr>
          <tr><td colspan="2">Standard / Accredit Name</td><td colspan="2">${cert.name}</td></tr>
          <tr><td colspan="2">Issuing Body</td><td colspan="2">${cert.issuingBody}</td></tr>
          <tr><td colspan="2">License / Registration Number</td><td colspan="2">${cert.certificateNumber}</td></tr>
          <tr><td colspan="2">Standard Category</td><td colspan="2">${cert.category || 'QUALITY_QMS'}</td></tr>
          <tr><td colspan="2">Facility Location</td><td colspan="2">${cert.facilityLocation || 'Main Apparel Manufacturing Complex'}</td></tr>
          <tr><td colspan="2">Effective Start Date</td><td colspan="2">${cert.validFrom}</td></tr>
          <tr><td colspan="2">Valid Until Date</td><td colspan="2">${cert.validUntil}</td></tr>
          <tr><td colspan="2">Days to Expiration</td><td colspan="2">${cert.daysRemaining}</td></tr>
          <tr><td colspan="2">Current Status</td><td colspan="2">${cert.status}</td></tr>
          <tr><td colspan="2">Linked PO Number</td><td colspan="2">${cert.poNumber || 'N/A'}</td></tr>
          <tr><td colspan="2">Buyer Name</td><td colspan="2">${cert.buyerName || 'N/A'}</td></tr>
          <tr><td colspan="2">Style Number</td><td colspan="2">${cert.styleNumber || 'N/A'}</td></tr>
          <tr><td colspan="2">Lead Auditor</td><td colspan="2">${cert.leadAuditor || 'N/A'}</td></tr>
          <tr><td colspan="2">Verified By</td><td colspan="2">${cert.verifiedBy || 'N/A'}</td></tr>
          <tr><td colspan="2">Certified Scope Description</td><td colspan="2">${cert.scope}</td></tr>
          <tr><td colspan="2">Remarks / Conditions</td><td colspan="2">${cert.remarks || 'None'}</td></tr>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export Single Certificate Dossier CSV
 */
export function exportCertificateSingleCsv(cert: FactoryCertificate): void {
  const headers = ['Parameter', 'Value'];
  const rows = [
    ['Cert Code', cert.certCode],
    ['Certificate Name', cert.name],
    ['Issuing Body', cert.issuingBody],
    ['License Number', cert.certificateNumber],
    ['Category', cert.category || 'QUALITY_QMS'],
    ['Facility Location', cert.facilityLocation || ''],
    ['Valid From', cert.validFrom],
    ['Valid Until', cert.validUntil],
    ['Days Remaining', String(cert.daysRemaining)],
    ['Status', cert.status],
    ['Linked PO', cert.poNumber || ''],
    ['Buyer', cert.buyerName || ''],
    ['Style', cert.styleNumber || ''],
    ['Lead Auditor', cert.leadAuditor || ''],
    ['Verified By', cert.verifiedBy || ''],
    ['Scope', cert.scope],
    ['Remarks', cert.remarks || ''],
  ];

  const fileName = `Certificate_${cert.certCode}_Dossier.csv`;
  downloadCertificateCsv(fileName, headers, rows);
}
