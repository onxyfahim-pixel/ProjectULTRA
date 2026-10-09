import { ProcedureItem, ProcedureStatus } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Procedures module
 */
export function computeProcedureKpis(procedures: ProcedureItem[]) {
  const total = procedures.length;
  const active = procedures.filter((p) => (p.status || 'ACTIVE') === 'ACTIVE').length;
  const underReview = procedures.filter((p) => p.status === 'UNDER_REVIEW').length;
  const draft = procedures.filter((p) => p.status === 'DRAFT').length;
  const obsolete = procedures.filter((p) => p.status === 'ARCHIVED').length;

  let totalSteps = 0;
  let totalForms = 0;
  procedures.forEach((p) => {
    if (p.departmentProcesses) {
      p.departmentProcesses.forEach((d) => {
        totalSteps += d.steps?.length || 0;
      });
    } else if (p.criticalCheckpoints) {
      totalSteps += p.criticalCheckpoints.length;
    }
    if (p.relatedDocuments) {
      totalForms += p.relatedDocuments.length;
    }
  });

  return {
    total,
    active,
    underReview,
    draft,
    obsolete,
    totalSteps,
    totalForms,
  };
}

/**
 * Download CSV helper
 */
export function downloadProcedureCsv(
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
 * Export Global Procedure Register PDF
 */
export function exportProcedureRegisterPdf(
  procedures: ProcedureItem[],
  scopeLabel: string = 'All Standard Procedures'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeProcedureKpis(procedures);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'procedure', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const getStatusColor = (status?: ProcedureStatus) => {
    switch (status) {
      case 'ACTIVE':
        return '#15803d';
      case 'UNDER_REVIEW':
        return '#0284c7';
      case 'DRAFT':
        return '#b45309';
      case 'ARCHIVED':
        return '#be123c';
      default:
        return '#15803d';
    }
  };

  const rowsHtml = procedures
    .map((p, idx) => {
      const stepCount = (p.departmentProcesses || []).reduce(
        (acc, d) => acc + (d.steps?.length || 0),
        0
      );
      const formCount = (p.relatedDocuments || []).length;
      const status = p.status || 'ACTIVE';

      return `
        <tr>
          <td style="text-align: center; font-mono; font-size: 8pt; color: #64748b;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${p.procedureCode}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${p.title}</div>
            <div style="font-size: 7.5pt; color: #64748b;">Ref: ${p.documentReference || p.documentType || 'SOP'}</div>
          </td>
          <td style="font-size: 8pt; font-weight: 600; color: #334155;">${p.department || 'QUALITY'}</td>
          <td style="font-family: monospace; font-size: 8pt; color: #0f172a;">
            ${p.issueNo ? `Issue ${p.issueNo}` : ''} / ${p.revision}
          </td>
          <td style="font-size: 8pt; color: #475569;">
            ${stepCount || p.criticalCheckpoints?.length || 0} Steps
            ${formCount > 0 ? ` • <span style="color: #2563eb;">${formCount} Forms</span>` : ''}
          </td>
          <td style="font-family: monospace; font-size: 7.5pt; color: #334155;">
            Eff: ${p.effectiveDate || p.createdAt?.slice(0, 10) || '2024-01-01'}<br/>
            <span style="color: #64748b;">Rev: ${p.nextReviewDate || 'Annual'}</span>
          </td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: bold; color: ${getStatusColor(status)}; background: #f8fafc; border: 1px solid ${getStatusColor(status)}33;">
              ${status.replace('_', ' ')}
            </span>
          </td>
          <td style="font-size: 7.5pt; color: #475569;">
            <div>Auth: <strong>${p.authorName || 'QMS Lead'}</strong></div>
            <div style="color: #64748b;">Appr: ${p.approvedByName || 'MD'}</div>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Procedures_Register_${new Date().toISOString().slice(0, 10)}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 12mm 10mm 12mm;
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
            <div class="kpi-lbl">Total Procedures</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #15803d;">${kpis.active}</div>
            <div class="kpi-lbl">Active & In-Force</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #0284c7;">${kpis.underReview}</div>
            <div class="kpi-lbl">Under Review</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #b45309;">${kpis.draft}</div>
            <div class="kpi-lbl">Draft SOPs</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${kpis.totalSteps}</div>
            <div class="kpi-lbl">Process Gates / Steps</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${kpis.totalForms}</div>
            <div class="kpi-lbl">Linked QA Forms</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">#</th>
              <th style="width: 12%;">Doc Number</th>
              <th style="width: 24%;">Procedure Title</th>
              <th style="width: 12%;">Department</th>
              <th style="width: 10%;">Issue / Rev</th>
              <th style="width: 12%;">Steps &amp; Forms</th>
              <th style="width: 11%;">Validity Dates</th>
              <th style="width: 8%; text-align: center;">Status</th>
              <th style="width: 13%;">Signatories</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Prepared By (MR)</div>
            <div class="sign-sub">Management Representative</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Reviewed By (HOD)</div>
            <div class="sign-sub">Head of Department</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Verified By (QA Dir)</div>
            <div class="sign-sub">Director of Quality &amp; Compliance</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Approved By (MD)</div>
            <div class="sign-sub">Managing Director</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Document Code: <strong>${docCode}</strong> • Ref: ISO 9001:2015 Clause 4.4</span>
          <span>Printed On: ${new Date().toLocaleString()}</span>
          <span>Security Classification: CONTROLLED QMS DOCUMENT</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Global Procedure Register Excel (.xls)
 */
export function exportProcedureRegisterExcel(
  procedures: ProcedureItem[],
  scopeLabel: string = 'All Standard Procedures'
): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.procedureRegister || 'PRC-REG'}`;
  const fileName = `Procedures_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = procedures
    .map(
      (p, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-family: monospace;">${p.procedureCode}</td>
          <td>${p.title}</td>
          <td>${p.department || 'QUALITY'}</td>
          <td>${p.documentType || 'SOP'}</td>
          <td>${p.issueNo || '01'}</td>
          <td>${p.revision}</td>
          <td>${p.status || 'ACTIVE'}</td>
          <td>${p.effectiveDate || ''}</td>
          <td>${p.nextReviewDate || ''}</td>
          <td>${p.authorName || ''}</td>
          <td>${p.approvedByName || ''}</td>
          <td>${p.station || ''}</td>
          <td>${p.criticalCheckpoints?.join('; ') || ''}</td>
          <td>${p.ppeRequirement || ''}</td>
          <td>${p.purposeAndScope || ''}</td>
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
            <td colspan="16" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="16" style="font-size: 12pt; font-weight: bold;">
              STANDARD OPERATING PROCEDURES (SOP) MASTER REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="16" style="color: #64748b;">
              Scope: ${scopeLabel} | Doc Code: ${docCode} | Generated: ${new Date().toLocaleString()}
            </td>
          </tr>
          <tr><td colspan="16"></td></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>Doc Code</th>
              <th>Procedure Title</th>
              <th>Department</th>
              <th>Document Type</th>
              <th>Issue No</th>
              <th>Revision</th>
              <th>Status</th>
              <th>Effective Date</th>
              <th>Review Date</th>
              <th>Author</th>
              <th>Approved By</th>
              <th>Station / Process</th>
              <th>Checkpoints</th>
              <th>PPE Requirement</th>
              <th>Purpose &amp; Scope</th>
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
 * Export Global Procedure Register CSV
 */
export function exportProcedureRegisterCsv(
  procedures: ProcedureItem[],
  scopeLabel: string = 'All'
): void {
  const headers = [
    'Procedure Code',
    'Title',
    'Department',
    'Document Type',
    'Issue No',
    'Revision',
    'Status',
    'Effective Date',
    'Review Date',
    'Author',
    'Approved By',
    'Station',
    'Checkpoints Count',
    'Purpose',
  ];

  const rows = procedures.map((p) => [
    p.procedureCode,
    p.title,
    p.department || '',
    p.documentType || 'SOP',
    p.issueNo || '01',
    p.revision,
    p.status || 'ACTIVE',
    p.effectiveDate || '',
    p.nextReviewDate || '',
    p.authorName || '',
    p.approvedByName || '',
    p.station || '',
    p.criticalCheckpoints?.length || 0,
    p.purposeAndScope || '',
  ]);

  const fileName = `Procedures_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadProcedureCsv(fileName, headers, rows);
}

/**
 * Export Single Procedure Dossier PDF (Complete SOP Specification Manual)
 */
export function exportProcedureSinglePdf(procedure: ProcedureItem): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'procedure', 'single', procedure.procedureCode);
  const docCode = config.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const departmentsHtml = (procedure.departmentProcesses || [])
    .map(
      (dept, dIdx) => `
      <div style="margin-top: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #0f172a; color: white; padding: 7px 12px; font-weight: 700; font-size: 9pt; display: flex; justify-content: space-between;">
          <span>${dept.departmentCode || `3.${dIdx + 1}`} ${dept.departmentName}</span>
          <span style="font-size: 8pt; color: #94a3b8;">${dept.steps?.length || 0} Process Steps</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
          <thead>
            <tr style="background: #f1f5f9; color: #475569; font-size: 7.5pt; text-transform: uppercase;">
              <th style="padding: 5px 8px; border-bottom: 1px solid #cbd5e1; width: 6%; text-align: center;">Step</th>
              <th style="padding: 5px 8px; border-bottom: 1px solid #cbd5e1; width: 22%;">Operation</th>
              <th style="padding: 5px 8px; border-bottom: 1px solid #cbd5e1; width: 36%;">Process Description</th>
              <th style="padding: 5px 8px; border-bottom: 1px solid #cbd5e1; width: 22%;">Quality Control Gate</th>
              <th style="padding: 5px 8px; border-bottom: 1px solid #cbd5e1; width: 14%;">Responsible</th>
            </tr>
          </thead>
          <tbody>
            ${(dept.steps || [])
              .map(
                (step, sIdx) => `
                <tr style="border-bottom: 1px solid #e2e8f0; ${sIdx % 2 === 1 ? 'background: #f8fafc;' : ''}">
                  <td style="padding: 6px 8px; text-align: center; font-family: monospace; font-weight: bold; color: #1e3a8a;">
                    ${step.stepNumber || `${dIdx + 1}.${sIdx + 1}`}
                  </td>
                  <td style="padding: 6px 8px; font-weight: 700; color: #0f172a;">${step.title}</td>
                  <td style="padding: 6px 8px; color: #334155; line-height: 1.4;">${step.description}</td>
                  <td style="padding: 6px 8px; color: #0369a1; font-weight: 600;">${step.acceptanceCriteria || step.inspectionFrequency || 'Quality Gate'}</td>
                  <td style="padding: 6px 8px; color: #475569;">${step.relatedFormCode || dept.inChargeRole || 'Operator / QC'}</td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    )
    .join('');

  const responsibilitiesHtml = (procedure.responsibilities || [])
    .map(
      (r) => `
      <div style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 8.5pt;">
        <span style="font-weight: 700; color: #1e3a8a;">${r.role}:</span>
        <span style="color: #334155; margin-left: 4px;">${r.responsibility}</span>
        ${r.authorityLevel ? `<span style="font-size: 7.5pt; color: #64748b; margin-left: 6px;">[${r.authorityLevel}]</span>` : ''}
      </div>
    `
    )
    .join('');

  const relatedDocsHtml = (procedure.relatedDocuments || [])
    .map(
      (doc) => `
      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; font-size: 8pt;">
        <span style="font-family: monospace; font-weight: bold; color: #2563eb;">${doc.documentCode}</span>
        <span style="color: #0f172a; font-weight: 600;">${doc.documentTitle}</span>
        <span style="color: #64748b;">${doc.category || doc.frequency || 'Digital Record'}</span>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${procedure.procedureCode}_SOP_Dossier</title>
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
          .doc-header-box {
            margin: 14px 0;
            padding: 12px 16px;
            border-radius: 8px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 10px;
            font-size: 8.5pt;
          }
          .section-title {
            font-size: 9.5pt;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 4px;
            margin-top: 16px;
            margin-bottom: 8px;
          }
          .sign-block {
            margin-top: 30px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
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
            margin-top: 24px;
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

        <div class="doc-header-box">
          <div>
            <div style="font-size: 7pt; text-transform: uppercase; color: #64748b; font-weight: 700;">Procedure Title</div>
            <div style="font-weight: 800; color: #0f172a; font-size: 10pt;">${procedure.title}</div>
            <div style="font-family: monospace; color: #1e3a8a; font-weight: 700; margin-top: 2px;">${procedure.procedureCode}</div>
          </div>
          <div>
            <div style="font-size: 7pt; text-transform: uppercase; color: #64748b; font-weight: 700;">Department</div>
            <div style="font-weight: 700; color: #0f172a;">${procedure.department || 'QUALITY'}</div>
            <div style="color: #64748b; font-size: 7.5pt;">Station: ${procedure.station}</div>
          </div>
          <div>
            <div style="font-size: 7pt; text-transform: uppercase; color: #64748b; font-weight: 700;">Revision Status</div>
            <div style="font-family: monospace; font-weight: 700; color: #0f172a;">${procedure.revision}</div>
            <div style="font-size: 7.5pt; color: #15803d; font-weight: 600;">Status: ${procedure.status || 'ACTIVE'}</div>
          </div>
          <div>
            <div style="font-size: 7pt; text-transform: uppercase; color: #64748b; font-weight: 700;">Effective Dates</div>
            <div style="font-family: monospace; font-size: 7.5pt; color: #0f172a;">Eff: ${procedure.effectiveDate || '2024-03-10'}</div>
            <div style="font-family: monospace; font-size: 7.5pt; color: #64748b;">Rev: ${procedure.nextReviewDate || '2025-03-07'}</div>
          </div>
        </div>

        <div class="section-title">1.0 Purpose &amp; Scope</div>
        <div style="font-size: 8.5pt; line-height: 1.6; color: #334155; padding: 4px 0;">
          ${procedure.purposeAndScope || 'To establish systematic operation control, standard operating practices, and defect prevention gates.'}
        </div>

        <div class="section-title">2.0 Responsibilities &amp; Authorities</div>
        <div style="margin-bottom: 8px;">
          ${responsibilitiesHtml || '<div style="font-size: 8.5pt; color: #64748b;">All floor staff, supervisors, and QC inspectors adhere to this procedure.</div>'}
        </div>

        <div class="section-title">3.0 Department-Wise Operational Process Steps</div>
        ${departmentsHtml || '<div style="font-size: 8.5pt; color: #64748b;">Follow critical checkpoints as established in the QA manual.</div>'}

        ${
          relatedDocsHtml
            ? `
            <div class="section-title">4.0 Related Controlled Documents &amp; Forms</div>
            <div style="margin-bottom: 8px;">
              ${relatedDocsHtml}
            </div>
          `
            : ''
        }

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Prepared By</div>
            <div class="sign-sub">${procedure.authorName || 'Management Representative'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Technical Review</div>
            <div class="sign-sub">${procedure.authorSignature || 'Lead QA Auditor'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Department Approval</div>
            <div class="sign-sub">${procedure.approvedByName || 'HOD Production & Quality'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Executive Authorization</div>
            <div class="sign-sub">${procedure.approvedBySignature || 'Managing Director'}</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Dossier Reference: <strong>${docCode}</strong></span>
          <span>Security Classification: ISO 9001:2015 CONTROLLED PROCEDURE</span>
          <span>Generated: ${new Date().toLocaleDateString()}</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Single Procedure Dossier Excel (.xls)
 */
export function exportProcedureSingleExcel(procedure: ProcedureItem): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.procedureDossier || 'PRC-SPEC'}-${procedure.procedureCode}`;
  const fileName = `Procedure_${procedure.procedureCode}_Specification.xls`;

  let processRows = '';
  (procedure.departmentProcesses || []).forEach((dept) => {
    (dept.steps || []).forEach((s) => {
      processRows += `
        <tr>
          <td>${dept.departmentName}</td>
          <td>${s.stepNumber}</td>
          <td>${s.title}</td>
          <td>${s.description}</td>
          <td>${s.acceptanceCriteria || s.inspectionFrequency || ''}</td>
          <td>${s.relatedFormCode || dept.inChargeRole || ''}</td>
        </tr>
      `;
    });
  });

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
            <td colspan="6" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="6" style="font-size: 12pt; font-weight: bold;">
              STANDARD OPERATING PROCEDURE (SOP) SPECIFICATION
            </td>
          </tr>
          <tr>
            <td colspan="6" style="color: #64748b;">
              Code: ${procedure.procedureCode} | Title: ${procedure.title} | Doc Code: ${docCode}
            </td>
          </tr>
          <tr><td colspan="6"></td></tr>
          <tr><th colspan="2">Parameter</th><th colspan="4">Value</th></tr>
          <tr><td colspan="2">Procedure Number</td><td colspan="4">${procedure.procedureCode}</td></tr>
          <tr><td colspan="2">Title</td><td colspan="4">${procedure.title}</td></tr>
          <tr><td colspan="2">Department</td><td colspan="4">${procedure.department || 'QUALITY'}</td></tr>
          <tr><td colspan="2">Issue No</td><td colspan="4">${procedure.issueNo || '01'}</td></tr>
          <tr><td colspan="2">Revision</td><td colspan="4">${procedure.revision}</td></tr>
          <tr><td colspan="2">Status</td><td colspan="4">${procedure.status || 'ACTIVE'}</td></tr>
          <tr><td colspan="2">Effective Date</td><td colspan="4">${procedure.effectiveDate || ''}</td></tr>
          <tr><td colspan="2">Review Date</td><td colspan="4">${procedure.nextReviewDate || ''}</td></tr>
          <tr><td colspan="2">Prepared By</td><td colspan="4">${procedure.authorName || ''}</td></tr>
          <tr><td colspan="2">Approved By</td><td colspan="4">${procedure.approvedByName || ''}</td></tr>
          <tr><td colspan="2">Purpose &amp; Scope</td><td colspan="4">${procedure.purposeAndScope || ''}</td></tr>
          <tr><td colspan="6"></td></tr>
          <thead>
            <tr>
              <th>Department</th>
              <th>Step #</th>
              <th>Operation Name</th>
              <th>Process Description</th>
              <th>Quality Gate</th>
              <th>Responsible Role</th>
            </tr>
          </thead>
          <tbody>
            ${processRows}
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
 * Export Single Procedure Dossier CSV
 */
export function exportProcedureSingleCsv(procedure: ProcedureItem): void {
  const headers = ['Department', 'Step Number', 'Operation Name', 'Description', 'Quality Gate', 'Responsible Role'];
  const rows: (string | number)[][] = [];

  (procedure.departmentProcesses || []).forEach((dept) => {
    (dept.steps || []).forEach((s) => {
      rows.push([
        dept.departmentName,
        s.stepNumber,
        s.title,
        s.description,
        s.acceptanceCriteria || s.inspectionFrequency || '',
        s.relatedFormCode || dept.inChargeRole || '',
      ]);
    });
  });

  if (rows.length === 0) {
    rows.push([
      procedure.department || 'QUALITY',
      '1',
      procedure.title,
      procedure.purposeAndScope || '',
      'Standard QC',
      'Operator',
    ]);
  }

  const fileName = `Procedure_${procedure.procedureCode}_Steps.csv`;
  downloadProcedureCsv(fileName, headers, rows);
}
