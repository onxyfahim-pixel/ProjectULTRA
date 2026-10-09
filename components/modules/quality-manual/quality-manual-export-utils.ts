import { QualityManualSection, QualityManualStatus } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Quality Manual module
 */
export function computeQualityManualKpis(sections: QualityManualSection[]) {
  const total = sections.length;
  const active = sections.filter((s) => (s.status || 'ACTIVE') === 'ACTIVE').length;
  const underReview = sections.filter((s) => s.status === 'UNDER_REVIEW').length;
  const draft = sections.filter((s) => s.status === 'DRAFT').length;
  const obsolete = sections.filter((s) => s.status === 'OBSOLETE').length;

  let totalCommitments = 0;
  let totalComplianceReqs = 0;
  let compliantReqs = 0;

  sections.forEach((s) => {
    if (s.policyCommitments) {
      totalCommitments += s.policyCommitments.length;
    }
    if (s.complianceRequirements) {
      totalComplianceReqs += s.complianceRequirements.length;
      compliantReqs += s.complianceRequirements.filter((c) => c.status === 'COMPLIANT').length;
    }
  });

  const complianceRate =
    totalComplianceReqs > 0 ? Math.round((compliantReqs / totalComplianceReqs) * 100) : 100;

  return {
    total,
    active,
    underReview,
    draft,
    obsolete,
    totalCommitments,
    totalComplianceReqs,
    complianceRate,
  };
}

/**
 * Download CSV helper
 */
export function downloadQualityManualCsv(
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
 * Export Global Quality Manual Register PDF
 */
export function exportQualityManualRegisterPdf(
  sections: QualityManualSection[],
  scopeLabel: string = 'All Manual Chapters'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeQualityManualKpis(sections);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'quality_manual', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const getStatusColor = (status?: QualityManualStatus) => {
    switch (status) {
      case 'ACTIVE':
        return '#15803d';
      case 'UNDER_REVIEW':
        return '#b45309';
      case 'DRAFT':
        return '#0284c7';
      case 'OBSOLETE':
        return '#be123c';
      default:
        return '#15803d';
    }
  };

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Quality Manual Master Register - ${scopeLabel}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm 10mm 12mm 10mm;
        }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          margin: 0;
          padding: 16px;
          color: #0f172a;
          background-color: #ffffff;
          font-size: 11px;
        }
        .kpi-strip {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin: 14px 0 16px 0;
        }
        .kpi-card {
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .kpi-title {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        .kpi-value {
          font-size: 16px;
          font-weight: 800;
          color: #1e293b;
          margin-top: 3px;
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
          text-align: left;
          padding: 7px 8px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #0f172a;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 9px;
          text-transform: uppercase;
        }
        .footer-note {
          margin-top: 16px;
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      ${dynamicHeaderHtml}

      <div class="kpi-strip">
        <div class="kpi-card">
          <div class="kpi-title">Total Chapters</div>
          <div class="kpi-value">${kpis.total}</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #16a34a;">
          <div class="kpi-title">Active Policies</div>
          <div class="kpi-value" style="color: #16a34a;">${kpis.active}</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #d97706;">
          <div class="kpi-title">Under Review</div>
          <div class="kpi-value" style="color: #d97706;">${kpis.underReview}</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #0284c7;">
          <div class="kpi-title">Draft Mode</div>
          <div class="kpi-value" style="color: #0284c7;">${kpis.draft}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Policy Commitments</div>
          <div class="kpi-value">${kpis.totalCommitments}</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #4f46e5;">
          <div class="kpi-title">Compliance Rate</div>
          <div class="kpi-value" style="color: #4f46e5;">${kpis.complianceRate}%</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 70px;">Chapter</th>
            <th style="width: 140px;">Clause Reference</th>
            <th>Chapter Title &amp; Strategic Scope</th>
            <th style="width: 130px;">Custodian Dept</th>
            <th style="width: 65px;">Rev / Ver</th>
            <th style="width: 80px;">Effective</th>
            <th style="width: 80px;">Next Review</th>
            <th style="width: 85px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${sections
            .map(
              (s) => `
            <tr>
              <td style="font-weight: 700; font-family: monospace; color: #1e40af;">${s.chapterNumber}</td>
              <td style="font-weight: 600; color: #334155;">${s.clauseReference}</td>
              <td>
                <strong style="color: #0f172a;">${s.title}</strong>
                ${s.summary ? `<div style="color: #64748b; font-size: 9px; margin-top: 2px;">${s.summary.slice(0, 110)}${s.summary.length > 110 ? '...' : ''}</div>` : ''}
              </td>
              <td>${s.responsibleDepartment}</td>
              <td style="font-family: monospace; font-weight: 600;">${s.version || 'Rev 1.0'}</td>
              <td>${s.effectiveDate || '-'}</td>
              <td>${s.nextReviewDate || '-'}</td>
              <td>
                <span class="badge" style="background: ${getStatusColor(s.status)}15; color: ${getStatusColor(s.status)}; border: 1px solid ${getStatusColor(s.status)}40;">
                  ${s.status || 'ACTIVE'}
                </span>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer-note">
        <div>Doc Ref: <strong>${docCode}</strong> | Scope: ${scopeLabel} | Total Records: ${sections.length}</div>
        <div>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Controlled QMS Register</div>
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
 * Export Global Quality Manual Register Excel (.xls)
 */
export function exportQualityManualRegisterExcel(
  sections: QualityManualSection[],
  scopeLabel: string = 'All Manual Chapters'
): void {
  const kpis = computeQualityManualKpis(sections);
  const pdfSettings = loadPdfHeaderSettings();
  const companyName = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8"/>
      <style>
        .header { font-size: 14pt; font-weight: bold; color: #1e3a8a; }
        .sub { font-size: 10pt; color: #475569; }
        .kpi-title { font-weight: bold; background-color: #f1f5f9; }
        .kpi-val { font-weight: bold; font-size: 11pt; }
        th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
        td { border: 1px solid #cbd5e1; font-size: 9.5pt; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="8" class="header">${companyName} - Quality Manual Master Register</td></tr>
        <tr><td colspan="8" class="sub">Scope: ${scopeLabel} | Exported: ${new Date().toLocaleString()}</td></tr>
        <tr></tr>
        <tr>
          <td class="kpi-title">Total Chapters</td><td>${kpis.total}</td>
          <td class="kpi-title">Active</td><td>${kpis.active}</td>
          <td class="kpi-title">Under Review</td><td>${kpis.underReview}</td>
          <td class="kpi-title">Compliance Rate</td><td>${kpis.complianceRate}%</td>
        </tr>
        <tr></tr>
        <tr style="height: 25pt;">
          <th>Chapter</th>
          <th>Clause Reference</th>
          <th>Chapter Title</th>
          <th>Custodian Department</th>
          <th>Revision</th>
          <th>Effective Date</th>
          <th>Next Review</th>
          <th>Status</th>
        </tr>
  `;

  sections.forEach((s) => {
    tableHtml += `
      <tr>
        <td style="font-weight: bold;">${s.chapterNumber}</td>
        <td>${s.clauseReference}</td>
        <td>${s.title}</td>
        <td>${s.responsibleDepartment}</td>
        <td>${s.version || 'Rev 1.0'}</td>
        <td>${s.effectiveDate || '-'}</td>
        <td>${s.nextReviewDate || '-'}</td>
        <td style="font-weight: bold;">${s.status || 'ACTIVE'}</td>
      </tr>
    `;
  });

  tableHtml += `
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Quality_Manual_Register_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export Global Quality Manual Register CSV
 */
export function exportQualityManualRegisterCsv(
  sections: QualityManualSection[],
  scopeLabel: string = 'All Manual Chapters'
): void {
  const headers = [
    'Chapter Number',
    'Clause Reference',
    'Title',
    'Custodian Department',
    'Revision',
    'Effective Date',
    'Next Review Date',
    'Status',
    'Approved By',
    'Scope',
    'Summary',
  ];

  const rows = sections.map((s) => [
    s.chapterNumber,
    s.clauseReference,
    s.title,
    s.responsibleDepartment,
    s.version || 'Rev 1.0',
    s.effectiveDate || '',
    s.nextReviewDate || '',
    s.status || 'ACTIVE',
    s.approvedBy || '',
    s.scope || '',
    s.summary || '',
  ]);

  downloadQualityManualCsv(
    `Quality_Manual_Register_${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    rows
  );
}

/**
 * Export Single Quality Manual Chapter Dossier PDF
 */
export function exportQualityManualSinglePdf(section: QualityManualSection): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'quality_manual', 'single', section.chapterNumber);
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Quality Manual Dossier - ${section.chapterNumber}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 10mm 12mm 10mm;
        }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          margin: 0;
          padding: 16px;
          color: #0f172a;
          background-color: #ffffff;
          font-size: 11px;
        }
        .section-header {
          font-size: 12px;
          font-weight: 700;
          color: #1e3a8a;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 4px;
          margin: 14px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
        }
        .meta-cell {
          font-size: 10px;
        }
        .meta-label {
          font-size: 8.5px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
        }
        .meta-val {
          font-weight: 700;
          color: #1e293b;
          margin-top: 2px;
        }
        .box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px;
          background: #fafafa;
          margin-bottom: 10px;
          line-height: 1.5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          font-size: 10px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          text-align: left;
          padding: 6px 8px;
          font-size: 9px;
          text-transform: uppercase;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .bullet-list {
          margin: 4px 0;
          padding-left: 18px;
        }
        .bullet-list li {
          margin-bottom: 4px;
        }
        .signoff-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 24px;
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
        }
        .signoff-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px;
          background: #f8fafc;
          text-align: center;
        }
        .signoff-title {
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }
        .signoff-line {
          margin-top: 25px;
          border-top: 1px solid #94a3b8;
          padding-top: 4px;
          font-weight: 700;
          font-size: 9.5px;
        }
        .footer-note {
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      ${dynamicHeaderHtml}

      <div class="meta-grid">
        <div class="meta-cell">
          <div class="meta-label">Chapter Number</div>
          <div class="meta-val" style="color: #1e40af;">${section.chapterNumber}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">ISO Standard Clause</div>
          <div class="meta-val">${section.clauseReference}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Custodian Department</div>
          <div class="meta-val">${section.responsibleDepartment}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Status</div>
          <div class="meta-val" style="color: #16a34a;">${section.status || 'ACTIVE'}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Document Revision</div>
          <div class="meta-val">${section.version || 'Rev 1.0'}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Effective Date</div>
          <div class="meta-val">${section.effectiveDate || '-'}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Next Review Due</div>
          <div class="meta-val">${section.nextReviewDate || '-'}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Confidentiality Tier</div>
          <div class="meta-val">${section.confidentiality || 'GENERAL_FACILITY'}</div>
        </div>
      </div>

      <div class="section-header">1. Executive Overview &amp; Policy Scope</div>
      <div class="box">
        <strong style="color: #0f172a; font-size: 12px; display: block; margin-bottom: 4px;">${section.title}</strong>
        <p style="margin: 0 0 6px 0; color: #334155;">${section.summary}</p>
        ${section.scope ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-size: 10px; color: #475569;"><strong>Operational Scope:</strong> ${section.scope}</div>` : ''}
      </div>

      ${
        section.policyCommitments && section.policyCommitments.length > 0
          ? `
        <div class="section-header">2. Governing Policy Commitments &amp; Directives</div>
        <div class="box">
          <ul class="bullet-list">
            ${section.policyCommitments.map((com) => `<li><strong>${com}</strong></li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${
        section.complianceRequirements && section.complianceRequirements.length > 0
          ? `
        <div class="section-header">3. Compliance Verification &amp; Audit Requirements Matrix</div>
        <table>
          <thead>
            <tr>
              <th style="width: 200px;">Mandatory Requirement</th>
              <th>Verification Method</th>
              <th style="width: 90px;">Audit Frequency</th>
              <th style="width: 90px;">Conformance</th>
            </tr>
          </thead>
          <tbody>
            ${section.complianceRequirements
              .map(
                (c) => `
              <tr>
                <td><strong>${c.requirement}</strong></td>
                <td>${c.verificationMethod}</td>
                <td>${c.frequency}</td>
                <td style="font-weight: 700; color: ${c.status === 'COMPLIANT' ? '#16a34a' : '#d97706'};">${c.status}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }

      ${
        section.linkedDocuments && section.linkedDocuments.length > 0
          ? `
        <div class="section-header">4. Linked Standard Operating Procedures &amp; Controlled Forms</div>
        <table>
          <thead>
            <tr>
              <th style="width: 130px;">Doc Identifier</th>
              <th>Document Title / Protocol Reference</th>
              <th style="width: 110px;">Classification</th>
            </tr>
          </thead>
          <tbody>
            ${section.linkedDocuments
              .map(
                (d) => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: #1e40af;">${d.docNumber}</td>
                <td>${d.title}</td>
                <td style="font-weight: 600;">${d.docType}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }

      ${
        section.revisionHistory && section.revisionHistory.length > 0
          ? `
        <div class="section-header">5. Document Revision History</div>
        <table>
          <thead>
            <tr>
              <th style="width: 80px;">Revision</th>
              <th style="width: 90px;">Change Date</th>
              <th style="width: 140px;">Author / Changed By</th>
              <th>Description of Amendments</th>
            </tr>
          </thead>
          <tbody>
            ${section.revisionHistory
              .map(
                (r) => `
              <tr>
                <td style="font-family: monospace; font-weight: 700;">${r.revision}</td>
                <td>${r.changeDate}</td>
                <td>${r.changedBy}</td>
                <td>${r.description}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }

      <div class="signoff-strip">
        <div class="signoff-box">
          <div class="signoff-title">Authored By</div>
          <div class="signoff-line">${section.author || 'Head of Quality Assurance'}</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-title">Reviewed By</div>
          <div class="signoff-line">${section.reviewedBy || 'General Manager Operations'}</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-title">Approved &amp; Authorized By</div>
          <div class="signoff-line">${section.approvedBy || 'Managing Director & CEO'}</div>
        </div>
      </div>

      <div class="footer-note">
        <div>Doc Ref: <strong>${docCode}</strong> | Classification: ${section.confidentiality || 'GENERAL_FACILITY'}</div>
        <div>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Controlled QMS Chapter Spec</div>
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
 * Export Single Quality Manual Chapter Dossier Excel (.xls)
 */
export function exportQualityManualSingleExcel(section: QualityManualSection): void {
  const pdfSettings = loadPdfHeaderSettings();
  const companyName = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8"/>
      <style>
        .header { font-size: 14pt; font-weight: bold; color: #1e3a8a; }
        .sub { font-size: 10pt; color: #475569; }
        .sec { font-size: 11pt; font-weight: bold; background-color: #f1f5f9; }
        th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
        td { border: 1px solid #cbd5e1; font-size: 9.5pt; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="4" class="header">${companyName} - Quality Manual Chapter Dossier</td></tr>
        <tr><td colspan="4" class="sub">Chapter: ${section.chapterNumber} - ${section.title} | Exported: ${new Date().toLocaleString()}</td></tr>
        <tr></tr>
        <tr>
          <td style="font-weight: bold;">Chapter Number:</td><td>${section.chapterNumber}</td>
          <td style="font-weight: bold;">Clause Reference:</td><td>${section.clauseReference}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Department:</td><td>${section.responsibleDepartment}</td>
          <td style="font-weight: bold;">Status:</td><td>${section.status || 'ACTIVE'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Revision:</td><td>${section.version || 'Rev 1.0'}</td>
          <td style="font-weight: bold;">Effective Date:</td><td>${section.effectiveDate || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Next Review:</td><td>${section.nextReviewDate || '-'}</td>
          <td style="font-weight: bold;">Approved By:</td><td>${section.approvedBy || '-'}</td>
        </tr>
        <tr></tr>
        <tr><td colspan="4" class="sec">Summary & Scope</td></tr>
        <tr><td colspan="4">${section.summary}</td></tr>
        ${section.scope ? `<tr><td colspan="4"><strong>Scope:</strong> ${section.scope}</td></tr>` : ''}
        <tr></tr>
  `;

  if (section.policyCommitments && section.policyCommitments.length > 0) {
    tableHtml += `
      <tr><td colspan="4" class="sec">Policy Commitments</td></tr>
    `;
    section.policyCommitments.forEach((c, idx) => {
      tableHtml += `<tr><td>${idx + 1}</td><td colspan="3">${c}</td></tr>`;
    });
    tableHtml += `<tr></tr>`;
  }

  if (section.complianceRequirements && section.complianceRequirements.length > 0) {
    tableHtml += `
      <tr><td colspan="4" class="sec">Compliance Verification Matrix</td></tr>
      <tr>
        <th>Requirement</th>
        <th>Verification Method</th>
        <th>Frequency</th>
        <th>Status</th>
      </tr>
    `;
    section.complianceRequirements.forEach((c) => {
      tableHtml += `
        <tr>
          <td>${c.requirement}</td>
          <td>${c.verificationMethod}</td>
          <td>${c.frequency}</td>
          <td>${c.status}</td>
        </tr>
      `;
    });
    tableHtml += `<tr></tr>`;
  }

  tableHtml += `
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Quality_Manual_${section.chapterNumber}_${new Date().toISOString().split('T')[0]}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export Single Quality Manual Chapter Dossier CSV
 */
export function exportQualityManualSingleCsv(section: QualityManualSection): void {
  const headers = ['Category', 'Field', 'Value'];
  const rows: (string | number)[][] = [
    ['Header', 'Chapter Number', section.chapterNumber],
    ['Header', 'Title', section.title],
    ['Header', 'Clause Reference', section.clauseReference],
    ['Header', 'Responsible Department', section.responsibleDepartment],
    ['Header', 'Status', section.status || 'ACTIVE'],
    ['Header', 'Version', section.version || 'Rev 1.0'],
    ['Header', 'Effective Date', section.effectiveDate || ''],
    ['Header', 'Next Review Date', section.nextReviewDate || ''],
    ['Header', 'Approved By', section.approvedBy || ''],
    ['Header', 'Author', section.author || ''],
    ['Header', 'Reviewed By', section.reviewedBy || ''],
    ['Header', 'Confidentiality', section.confidentiality || 'GENERAL_FACILITY'],
    ['Details', 'Summary', section.summary || ''],
    ['Details', 'Scope', section.scope || ''],
  ];

  if (section.policyCommitments) {
    section.policyCommitments.forEach((com, idx) => {
      rows.push(['Policy Commitment', `Commitment ${idx + 1}`, com]);
    });
  }

  if (section.complianceRequirements) {
    section.complianceRequirements.forEach((c, idx) => {
      rows.push([
        'Compliance Requirement',
        `Req ${idx + 1}: ${c.requirement}`,
        `Method: ${c.verificationMethod} | Freq: ${c.frequency} | Status: ${c.status}`,
      ]);
    });
  }

  if (section.linkedDocuments) {
    section.linkedDocuments.forEach((d) => {
      rows.push(['Linked Document', d.docNumber, `${d.title} (${d.docType})`]);
    });
  }

  downloadQualityManualCsv(
    `Quality_Manual_${section.chapterNumber}_${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    rows
  );
}
