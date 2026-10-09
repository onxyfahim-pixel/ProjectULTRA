import { ControlledDocument } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Controlled Documents module
 */
export function computeDocControlKpis(docs: ControlledDocument[]) {
  const total = docs.length;
  const active = docs.filter((d) => d.status === 'APPROVED_ACTIVE').length;
  const underRevision = docs.filter((d) => d.status === 'UNDER_REVISION').length;
  const obsolete = docs.filter((d) => d.status === 'OBSOLETE').length;
  const departments = new Set(docs.map((d) => d.department).filter(Boolean)).size;
  const categories = new Set(docs.map((d) => d.category).filter(Boolean)).size;

  return {
    total,
    active,
    underRevision,
    obsolete,
    departments,
    categories,
  };
}

/**
 * Download Document Control CSV
 */
export function downloadDocumentControlCsv(
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
 * Export Global Document Control Register PDF
 */
export function exportDocumentControlRegisterPdf(
  docs: ControlledDocument[],
  scopeLabel: string = 'All Controlled Documents'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeDocControlKpis(docs);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'document_control', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED_ACTIVE':
        return '#15803d';
      case 'UNDER_REVISION':
        return '#b45309';
      case 'OBSOLETE':
        return '#be123c';
      default:
        return '#475569';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'APPROVED_ACTIVE':
        return '#dcfce7';
      case 'UNDER_REVISION':
        return '#fef3c7';
      case 'OBSOLETE':
        return '#ffe4e6';
      default:
        return '#f1f5f9';
    }
  };

  const rowsHtml = docs
    .map(
      (d, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="font-family: monospace; font-weight: 700; color: #1e293b; text-align: center;">${i + 1}</td>
        <td style="font-family: monospace; font-weight: 700; color: #0284c7;">${d.docNumber}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${d.title}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
            ${d.isoClause ? `ISO Clause: ${d.isoClause}` : ''}
          </div>
        </td>
        <td style="font-size: 10px; font-weight: 600; color: #334155; text-transform: uppercase;">${(d.category || '').replace(/_/g, ' ')}</td>
        <td style="font-size: 10px; font-family: monospace; font-weight: 700; text-align: center; color: #1e293b;">${d.version || 'v1.0'}</td>
        <td style="font-size: 10px; color: #475569;">${d.department}</td>
        <td style="font-size: 10px; color: #334155;">${d.approvedBy}</td>
        <td style="font-family: monospace; font-size: 9.5px; color: #334155;">${d.effectiveDate}</td>
        <td style="font-family: monospace; font-size: 9.5px; color: #334155;">${d.nextReviewDate}</td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 700; color: ${getStatusColor(d.status)}; background-color: ${getStatusBg(d.status)};">
            ${d.status.replace(/_/g, ' ')}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Controlled Documents Register - ${docCode}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #ffffff;
            font-size: 10.5px;
          }
          .kpi-strip {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin: 12px 0 16px 0;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 10px;
            background: #f8fafc;
            text-align: center;
          }
          .kpi-val {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .kpi-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 10px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 7px 8px;
            border: 1px solid #0f172a;
            text-align: left;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          .signatures {
            margin-top: 26px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            page-break-inside: avoid;
          }
          .sign-box {
            border-top: 1px dashed #64748b;
            padding-top: 6px;
            text-align: center;
          }
          .sign-title {
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
          }
          .sign-sub {
            font-size: 8.5px;
            color: #64748b;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <div class="kpi-strip">
          <div class="kpi-card">
            <div class="kpi-val">${kpis.total}</div>
            <div class="kpi-label">Master Docs</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #15803d;">
            <div class="kpi-val" style="color: #15803d;">${kpis.active}</div>
            <div class="kpi-label">Active & Approved</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #b45309;">
            <div class="kpi-val" style="color: #b45309;">${kpis.underRevision}</div>
            <div class="kpi-label">Under Revision</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #be123c;">
            <div class="kpi-val" style="color: #be123c;">${kpis.obsolete}</div>
            <div class="kpi-label">Obsolete Archive</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${kpis.departments}</div>
            <div class="kpi-label">Departments</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${kpis.categories}</div>
            <div class="kpi-label">Doc Categories</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 28px; text-align: center;">#</th>
              <th style="width: 85px;">Doc Number</th>
              <th>Document Title & Standard Reference</th>
              <th style="width: 100px;">Category</th>
              <th style="width: 55px; text-align: center;">Ver.</th>
              <th style="width: 110px;">Department</th>
              <th style="width: 105px;">Approved By</th>
              <th style="width: 85px;">Effective</th>
              <th style="width: 85px;">Next Review</th>
              <th style="width: 95px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-title">Document Controller</div>
            <div class="sign-sub">QMS Control Custodian</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Quality Assurance Manager</div>
            <div class="sign-sub">Compliance Review</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Executive Management</div>
            <div class="sign-sub">Final Authorization</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Lead QMS Auditor</div>
            <div class="sign-sub">ISO 9001:2015 Verification</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Document Control Register Excel (.xls)
 */
export function exportDocumentControlRegisterExcel(
  docs: ControlledDocument[],
  scopeLabel: string = 'All Controlled Documents'
): void {
  const kpis = computeDocControlKpis(docs);
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.docControlRegister || 'DOC-REG'}`;
  const fileName = `Controlled_Documents_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = docs
    .map(
      (d, i) => `
    <tr>
      <td style="text-align: center;">${i + 1}</td>
      <td style="font-weight: bold; font-family: monospace; color: #0369a1;">${d.docNumber}</td>
      <td style="font-weight: bold;">${d.title}</td>
      <td>${d.category}</td>
      <td style="text-align: center; font-weight: bold;">${d.version}</td>
      <td>${d.department}</td>
      <td>${d.preparedBy || ''}</td>
      <td>${d.reviewedBy || ''}</td>
      <td>${d.approvedBy}</td>
      <td>${d.effectiveDate}</td>
      <td>${d.nextReviewDate}</td>
      <td>${d.isoClause || ''}</td>
      <td>${d.confidentialityLevel || 'INTERNAL_CONFIDENTIAL'}</td>
      <td style="font-weight: bold; text-align: center; ${
        d.status === 'APPROVED_ACTIVE'
          ? 'color: #15803d;'
          : d.status === 'UNDER_REVISION'
          ? 'color: #b45309;'
          : 'color: #be123c;'
      }">${d.status}</td>
    </tr>
  `
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Controlled Documents</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; }
          td { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="14" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="14" style="font-size: 12pt; font-weight: bold;">
              CONTROLLED DOCUMENTS MASTER REGISTER & QMS ARCHIVE
            </td>
          </tr>
          <tr>
            <td colspan="14" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Scope: ${scopeLabel} | Total Docs: ${kpis.total} | Active: ${kpis.active} | Under Revision: ${kpis.underRevision} | Date: ${new Date().toISOString().slice(0, 10)}
            </td>
          </tr>
          <tr><td colspan="14"></td></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>Doc Number</th>
            <th>Document Title</th>
            <th>Category</th>
            <th>Version</th>
            <th>Department</th>
            <th>Prepared By</th>
            <th>Reviewed By</th>
            <th>Approved By</th>
            <th>Effective Date</th>
            <th>Next Review Date</th>
            <th>ISO Clause</th>
            <th>Confidentiality</th>
            <th>Status</th>
          </tr>
          ${rows}
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
 * Export Individual Controlled Document Dossier PDF
 */
export function exportSingleControlledDocPdf(doc: ControlledDocument): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'document_control', 'single', doc.docNumber);
  const docCode = config.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const revisionRows = (doc.changeLog || [])
    .map(
      (rev, idx) => `
      <tr>
        <td style="font-family: monospace; text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: 700;">${rev.version}</td>
        <td style="font-family: monospace;">${rev.releaseDate}</td>
        <td>${rev.changedBy}</td>
        <td>${rev.approvedBy}</td>
        <td>${rev.reasonForChange || 'Routine review and procedure update'}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Controlled Document Dossier - ${doc.docNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 12mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #ffffff;
            font-size: 11px;
          }
          .hero-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #e2e8f0;
            border-left: 6px solid #0284c7;
            border-radius: 8px;
            padding: 12px 16px;
            background: #f8fafc;
            margin-top: 14px;
            margin-bottom: 16px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #ffffff;
            background: #0284c7;
          }
          .section-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 4px;
            margin-top: 16px;
            margin-bottom: 10px;
          }
          .data-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .data-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
          }
          .data-label {
            font-weight: 700;
            color: #475569;
            font-size: 10.5px;
          }
          .data-value {
            font-weight: 600;
            color: #0f172a;
            font-size: 10.5px;
          }
          .card-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 10px;
            background: #f8fafc;
          }
          .card-title {
            font-weight: 800;
            font-size: 11px;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .card-body {
            font-size: 10.5px;
            line-height: 1.5;
            color: #334155;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 10px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 6px 8px;
            border: 1px solid #0f172a;
            text-align: left;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          .signatures {
            margin-top: 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            page-break-inside: avoid;
          }
          .sign-box {
            border-top: 1px dashed #64748b;
            padding-top: 6px;
            text-align: center;
          }
          .sign-title {
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
          }
          .sign-sub {
            font-size: 8.5px;
            color: #64748b;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <div class="hero-box">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">
              Controlled QMS Document • Doc Code: ${docCode}
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace;">
              ${doc.docNumber} - ${doc.title}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              Version: <strong>${doc.version}</strong> • Department: <strong>${doc.department}</strong> • Category: <strong>${doc.category}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="status-badge">${doc.status.replace(/_/g, ' ')}</div>
            <div style="font-size: 10.5px; color: #64748b; margin-top: 4px; font-weight: 600;">
              Next Review: <strong style="color: #0f172a;">${doc.nextReviewDate}</strong>
            </div>
          </div>
        </div>

        <div class="section-title">1. Document Control Master Metadata</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Document Identification No:</span>
            <span class="data-value" style="font-family: monospace; font-weight: 700; color: #0284c7;">${doc.docNumber}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Classification / Category:</span>
            <span class="data-value">${doc.category.replace(/_/g, ' ')}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Custodian Department:</span>
            <span class="data-value">${doc.department}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Effective Date:</span>
            <span class="data-value" style="font-family: monospace;">${doc.effectiveDate}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Next Mandatory Review Date:</span>
            <span class="data-value" style="font-family: monospace; color: #b45309; font-weight: 700;">${doc.nextReviewDate}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Review Frequency:</span>
            <span class="data-value">${doc.reviewFrequencyMonths || 12} Months</span>
          </div>
          <div class="data-item">
            <span class="data-label">Originator / Prepared By:</span>
            <span class="data-value">${doc.preparedBy || 'Quality Assurance Specialist'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Technical Reviewer:</span>
            <span class="data-value">${doc.reviewedBy || 'Department Head / Lead Auditor'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Authorized Approver:</span>
            <span class="data-value" style="font-weight: 700;">${doc.approvedBy}</span>
          </div>
          <div class="data-item">
            <span class="data-label">ISO 9001:2015 Clause:</span>
            <span class="data-value">${doc.isoClause || 'Clause 7.5 (Documented Information)'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Confidentiality Tier:</span>
            <span class="data-value" style="font-weight: 700; color: #0284c7;">${(doc.confidentialityLevel || 'INTERNAL_CONFIDENTIAL').replace(/_/g, ' ')}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Storage Location:</span>
            <span class="data-value">${doc.documentLocation || 'Central QMS Master Vault & Local Archive'}</span>
          </div>
        </div>

        <div class="section-title">2. Scope & Operational Purpose</div>
        <div class="card-box" style="border-left: 4px solid #0284c7;">
          <div class="card-title">Scope of Application</div>
          <div class="card-body">${doc.scope || 'Applies factory-wide across all active production, quality control, sampling, and compliance inspection processes.'}</div>
        </div>
        <div class="card-box" style="border-left: 4px solid #10b981;">
          <div class="card-title">Document Purpose & Intent</div>
          <div class="card-body">${doc.purpose || 'Establishes standardized procedures, compliance criteria, and verification workflows in alignment with buyer technical specifications.'}</div>
        </div>

        <div class="section-title">3. Document Revision History & Change Log</div>
        ${
          doc.changeLog && doc.changeLog.length > 0
            ? `
          <table>
            <thead>
              <tr>
                <th style="width: 28px; text-align: center;">#</th>
                <th style="width: 60px;">Version</th>
                <th style="width: 85px;">Release Date</th>
                <th style="width: 110px;">Changed By</th>
                <th style="width: 110px;">Approved By</th>
                <th>Reason for Change & Modifications</th>
              </tr>
            </thead>
            <tbody>
              ${revisionRows}
            </tbody>
          </table>
        `
            : `
          <div class="card-box" style="text-align: center; color: #64748b; font-style: italic;">
            Initial baseline release (${doc.version}) approved and effective on ${doc.effectiveDate}.
          </div>
        `
        }

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-title">Document Controller</div>
            <div class="sign-sub">Registration & Versioning</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Quality Assurance Manager</div>
            <div class="sign-sub">Review & Technical Endorsement</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">General Manager</div>
            <div class="sign-sub">Final Executive Approval</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Individual Controlled Document Excel (.xls)
 */
export function exportSingleControlledDocExcel(doc: ControlledDocument): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.controlledDocumentDossier || 'DOC-SPEC'}`;
  const fileName = `Controlled_Doc_${doc.docNumber}_${new Date().toISOString().slice(0, 10)}.xls`;

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Controlled Document</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; }
          td { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="4" style="font-size: 15pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 12pt; font-weight: bold;">
              CONTROLLED DOCUMENT MASTER DOSSIER
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Doc Number: ${doc.docNumber} | Version: ${doc.version} | Date: ${new Date().toISOString().slice(0, 10)}
            </td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">1. DOCUMENT IDENTIFICATION</th></tr>
          <tr><td><strong>Doc Number:</strong></td><td>${doc.docNumber}</td><td><strong>Title:</strong></td><td>${doc.title}</td></tr>
          <tr><td><strong>Category:</strong></td><td>${doc.category}</td><td><strong>Department:</strong></td><td>${doc.department}</td></tr>
          <tr><td><strong>Version:</strong></td><td>${doc.version}</td><td><strong>Status:</strong></td><td>${doc.status}</td></tr>
          <tr><td><strong>Prepared By:</strong></td><td>${doc.preparedBy || ''}</td><td><strong>Reviewed By:</strong></td><td>${doc.reviewedBy || ''}</td></tr>
          <tr><td><strong>Approved By:</strong></td><td>${doc.approvedBy}</td><td><strong>Effective Date:</strong></td><td>${doc.effectiveDate}</td></tr>
          <tr><td><strong>Next Review Date:</strong></td><td>${doc.nextReviewDate}</td><td><strong>ISO Clause:</strong></td><td>${doc.isoClause || ''}</td></tr>
          <tr><td><strong>Confidentiality:</strong></td><td>${doc.confidentialityLevel || 'INTERNAL_CONFIDENTIAL'}</td><td><strong>Location:</strong></td><td>${doc.documentLocation || ''}</td></tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">2. SCOPE & PURPOSE</th></tr>
          <tr><td><strong>Scope:</strong></td><td colspan="3">${doc.scope || ''}</td></tr>
          <tr><td><strong>Purpose:</strong></td><td colspan="3">${doc.purpose || ''}</td></tr>
          <tr><td><strong>Remarks:</strong></td><td colspan="3">${doc.remarks || ''}</td></tr>
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
