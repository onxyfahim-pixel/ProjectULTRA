import { SopItem } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for SOP Management module
 */
export function computeSopKpis(sops: SopItem[]) {
  const total = sops.length;
  const active = sops.filter((s) => s.status === 'ACTIVE').length;
  const underReview = sops.filter((s) => s.status === 'UNDER_REVIEW' || s.status === 'REVIEW_DUE').length;
  const draft = sops.filter((s) => s.status === 'DRAFT').length;
  const expired = sops.filter((s) => s.status === 'EXPIRED').length;

  const totalSteps = sops.reduce((acc, s) => acc + (s.stepsCount || s.procedure?.length || 0), 0);
  const activeRate = total > 0 ? Math.round((active / total) * 100) : 100;

  return {
    total,
    active,
    underReview,
    draft,
    expired,
    totalSteps,
    activeRate,
  };
}

/**
 * Download CSV helper
 */
export function downloadSopCsv(
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
 * Export Global SOP Master Register PDF
 */
export function exportSopRegisterPdf(
  sops: SopItem[],
  scopeLabel: string = 'All Standard Operating Procedures'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeSopKpis(sops);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'sop_management', 'register');
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
      case 'ACTIVE':
        return '#15803d';
      case 'UNDER_REVIEW':
      case 'REVIEW_DUE':
        return '#b45309';
      case 'DRAFT':
        return '#0284c7';
      case 'EXPIRED':
        return '#dc2626';
      default:
        return '#475569';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#dcfce7';
      case 'UNDER_REVIEW':
      case 'REVIEW_DUE':
        return '#fef3c7';
      case 'DRAFT':
        return '#e0f2fe';
      case 'EXPIRED':
        return '#fee2e2';
      default:
        return '#f1f5f9';
    }
  };

  const rowsHtml = sops
    .map((s, index) => {
      const stepCount = s.stepsCount || s.procedure?.length || 0;

      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${index + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${s.sopNumber}</td>
          <td>
            <strong>${s.title}</strong>
            ${s.process ? `<div style="font-size: 8pt; color: #64748b; margin-top: 2px;">Process: ${s.process}</div>` : ''}
          </td>
          <td>${s.department}</td>
          <td style="text-align: center; font-family: monospace; font-weight: 600;">${s.version || 'v1.0'}</td>
          <td>${s.effectiveDate}</td>
          <td>${s.reviewDate || 'Annual'}</td>
          <td style="text-align: center; font-weight: 600;">${stepCount}</td>
          <td>${s.responsibility ? s.responsibility.slice(0, 45) + (s.responsibility.length > 45 ? '...' : '') : 'All Staff'}</td>
          <td style="text-align: center;">
            <span style="
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 8pt;
              font-weight: bold;
              background-color: ${getStatusBg(s.status)};
              color: ${getStatusColor(s.status)};
            ">
              ${s.status.replace(/_/g, ' ')}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>SOP Master Register - ${new Date().toISOString().slice(0, 10)}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: landscape;
            margin: 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            font-size: 9pt;
            line-height: 1.4;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
            margin: 14px 0 16px 0;
          }
          .kpi-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
          }
          .kpi-title {
            font-size: 7.5pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
          }
          .kpi-value {
            font-size: 14pt;
            font-weight: 800;
            color: #1e3a8a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 8.5pt;
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
          .sign-block {
            margin-top: 25px;
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
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <!-- KPI Summary Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Total SOPs</div>
            <div class="kpi-value">${kpis.total}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Active In-Force</div>
            <div class="kpi-value" style="color: #15803d;">${kpis.active}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Under Review</div>
            <div class="kpi-value" style="color: #b45309;">${kpis.underReview}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Draft</div>
            <div class="kpi-value" style="color: #0284c7;">${kpis.draft}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Total Worksteps</div>
            <div class="kpi-value" style="color: #6366f1;">${kpis.totalSteps}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Compliance Ratio</div>
            <div class="kpi-value" style="color: #0f766e;">${kpis.activeRate}%</div>
          </div>
        </div>

        <!-- Master Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 3%; text-align: center;">#</th>
              <th style="width: 11%;">SOP ID</th>
              <th style="width: 22%;">Standard Operating Procedure</th>
              <th style="width: 12%;">Department</th>
              <th style="width: 6%; text-align: center;">Version</th>
              <th style="width: 9%;">Effective</th>
              <th style="width: 9%;">Review Due</th>
              <th style="width: 5%; text-align: center;">Steps</th>
              <th style="width: 13%;">Primary Responsibility</th>
              <th style="width: 10%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Sign-off Block -->
        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Document Controller</div>
            <div class="sign-sub">Archive & Version Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Process Technical Lead</div>
            <div class="sign-sub">Operational Procedure Review</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Head of QA & Compliance</div>
            <div class="sign-sub">QMS System Conformance</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Plant / General Manager</div>
            <div class="sign-sub">Executive Authorization</div>
          </div>
        </div>

        <!-- Footer Strip -->
        <div class="footer-strip">
          <div>Doc Code: <strong>${docCode}</strong> • Standard: ISO 9001:2015 Clause 7.5.3 Control of Documented Information</div>
          <div>Printed: ${new Date().toLocaleString()} • Page 1 of 1</div>
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
 * Export Global SOPs Excel (.xls)
 */
export function exportSopRegisterExcel(sops: SopItem[]): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.sopRegister || 'SOP-REG'}`;
  const fileName = `SOP_Master_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = sops
    .map(
      (s, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-family: monospace;">${s.sopNumber}</td>
          <td>${s.title}</td>
          <td>${s.department}</td>
          <td>${s.process || ''}</td>
          <td>${s.version || 'v1.0'}</td>
          <td>${s.effectiveDate}</td>
          <td>${s.reviewDate || ''}</td>
          <td>${s.status}</td>
          <td>${s.stepsCount || s.procedure?.length || 0}</td>
          <td>${s.responsibility}</td>
          <td>${s.purpose ? s.purpose.replace(/\n/g, ' ') : ''}</td>
          <td>${s.scope ? s.scope.replace(/\n/g, ' ') : ''}</td>
          <td>${s.safetyInstructions || ''}</td>
          <td>${s.qualityControlPoints?.join('; ') || ''}</td>
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
                <x:Name>SOP Register</x:Name>
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
            <td colspan="15" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="15" style="font-size: 12pt; font-weight: bold;">
              STANDARD OPERATING PROCEDURES (SOP) MASTER REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="15" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Export Date: ${new Date().toISOString().slice(0, 10)} | Standard: ISO 9001:2015 Clause 7.5
            </td>
          </tr>
          <tr><td colspan="15"></td></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>SOP Number</th>
            <th>Title</th>
            <th>Department</th>
            <th>Process</th>
            <th>Version</th>
            <th>Effective Date</th>
            <th>Review Date</th>
            <th>Status</th>
            <th>Worksteps</th>
            <th>Responsibility</th>
            <th>Purpose</th>
            <th>Scope</th>
            <th>Safety Instructions</th>
            <th>QC Checkpoints</th>
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
 * Export Individual SOP Procedure Manual PDF
 */
export function exportSingleSopPdf(sop: SopItem): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'sop_management', 'single', sop.sopNumber);
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const stepsList = (sop.procedure || sop.steps || []);
  const stepsHtml = stepsList
    .map(
      (st) => `
        <div style="margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
          <div style="background-color: #f1f5f9; padding: 6px 10px; font-weight: bold; color: #1e3a8a; display: flex; justify-content: space-between;">
            <span>Step ${st.stepNumber}: ${st.stepTitle}</span>
            ${st.responsibleRole ? `<span style="font-size: 8pt; color: #64748b; font-weight: normal;">Role: ${st.responsibleRole}</span>` : ''}
          </div>
          <div style="padding: 10px; font-size: 8.5pt;">
            <div style="line-height: 1.5; color: #0f172a;">${st.actionDetails}</div>
            
            ${
              st.qualityControlPoints
                ? `
                  <div style="margin-top: 6px; padding: 4px 8px; background-color: #ecfdf5; border-left: 3px solid #10b981; font-size: 8pt; color: #065f46;">
                    <strong>Quality Control Point:</strong> ${st.qualityControlPoints}
                  </div>
                `
                : ''
            }
            ${
              st.safetyInstructions
                ? `
                  <div style="margin-top: 4px; padding: 4px 8px; background-color: #fef2f2; border-left: 3px solid #ef4444; font-size: 8pt; color: #991b1b;">
                    <strong>Safety & PPE:</strong> ${st.safetyInstructions}
                  </div>
                `
                : ''
            }
            ${
              st.requiredTools
                ? `
                  <div style="margin-top: 4px; font-size: 7.5pt; color: #64748b;">
                    <strong>Tools / Equipment:</strong> ${st.requiredTools}
                  </div>
                `
                : ''
            }
          </div>
        </div>
      `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>SOP Manual - ${sop.sopNumber}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: portrait;
            margin: 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            font-size: 9pt;
            line-height: 1.45;
          }
          .section-title {
            background-color: #f1f5f9;
            padding: 6px 10px;
            font-weight: 700;
            font-size: 9.5pt;
            color: #0f172a;
            border-left: 4px solid #1e3a8a;
            margin: 14px 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .info-cell {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 6px 10px;
          }
          .info-label {
            font-size: 7.5pt;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
          }
          .info-val {
            font-size: 9.5pt;
            font-weight: 600;
            color: #0f172a;
            margin-top: 2px;
          }
          .sign-block {
            margin-top: 25px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
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
            margin-top: 25px;
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
        ${dynamicHeaderHtml}

        <!-- 1. Metadata -->
        <div class="section-title">1. Document Profile &amp; Control Data</div>
        <div class="grid-4">
          <div class="info-cell">
            <div class="info-label">SOP Number</div>
            <div class="info-val" style="color: #1e3a8a;">${sop.sopNumber}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Version / Rev</div>
            <div class="info-val">${sop.version || 'v1.0'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Department</div>
            <div class="info-val">${sop.department}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Status</div>
            <div class="info-val" style="color: #15803d;">${sop.status}</div>
          </div>
        </div>

        <div class="grid-4" style="margin-top: 8px;">
          <div class="info-cell">
            <div class="info-label">Effective Date</div>
            <div class="info-val">${sop.effectiveDate}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Review Due</div>
            <div class="info-val">${sop.reviewDate || 'Annual'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Process</div>
            <div class="info-val truncate">${sop.process || 'Operational'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Worksteps</div>
            <div class="info-val" style="color: #0f766e;">${stepsList.length} Steps</div>
          </div>
        </div>

        <!-- 2. Purpose & Scope -->
        <div class="section-title">2. Purpose &amp; Operational Scope</div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 8.5pt;">
          <div style="margin-bottom: 8px;">
            <strong style="color: #1e3a8a;">Purpose:</strong>
            <p style="margin: 2px 0 0 0; line-height: 1.45;">${sop.purpose || 'Defines standardized procedure.'}</p>
          </div>
          <div>
            <strong style="color: #1e3a8a;">Scope of Application:</strong>
            <p style="margin: 2px 0 0 0; line-height: 1.45;">${sop.scope || 'Applies to relevant manufacturing lines and quality stations.'}</p>
          </div>
        </div>

        <!-- 3. Responsibilities & Safety -->
        <div class="section-title">3. Accountability &amp; Safety Requirements</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 8.5pt;">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
            <strong style="color: #1e3a8a;">Designated Roles &amp; Responsibilities:</strong>
            <p style="margin: 4px 0 0 0; line-height: 1.4;">${sop.responsibility || 'All Operators, Supervisors, QA Auditors'}</p>
          </div>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px; color: #991b1b;">
            <strong>Mandatory Safety &amp; PPE Instructions:</strong>
            <p style="margin: 4px 0 0 0; line-height: 1.4;">${sop.safetyInstructions || 'Standard factory PPE and floor safety compliance mandatory.'}</p>
          </div>
        </div>

        <!-- 4. Step-by-Step Procedure -->
        <div class="section-title">4. Step-by-Step Operating Procedure (${stepsList.length} Worksteps)</div>
        ${stepsHtml || '<div style="color: #64748b; padding: 10px; text-align: center;">No discrete procedure steps logged.</div>'}

        <!-- Signatures -->
        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Prepared By</div>
            <div class="sign-sub">${sop.preparedBy || 'Quality Assurance Specialist'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Reviewed By</div>
            <div class="sign-sub">${sop.reviewedBy || 'Technical / Department Head'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Approved By</div>
            <div class="sign-sub">${sop.approvedBy || 'Operations Director'}</div>
          </div>
        </div>

        <div class="footer-strip">
          <div>Doc Code: <strong>${docCode}</strong> • Ref: ${sop.sopNumber}</div>
          <div>Printed: ${new Date().toLocaleString()} • Controlled Copy</div>
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
 * Export Individual SOP Excel (.xls)
 */
export function exportSingleSopExcel(sop: SopItem): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.sopManual || 'SOP-MANUAL'}`;
  const fileName = `SOP_${sop.sopNumber}_${new Date().toISOString().slice(0, 10)}.xls`;

  const stepsList = (sop.procedure || sop.steps || []);
  const stepsRows = stepsList
    .map(
      (st) => `
        <tr>
          <td>${st.stepNumber}</td>
          <td>${st.stepTitle}</td>
          <td>${st.actionDetails}</td>
          <td>${st.responsibleRole || ''}</td>
          <td>${st.qualityControlPoints || ''}</td>
          <td>${st.safetyInstructions || ''}</td>
          <td>${st.requiredTools || ''}</td>
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
                <x:Name>SOP Manual</x:Name>
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
            <td colspan="7" style="font-size: 15pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="7" style="font-size: 12pt; font-weight: bold;">
              STANDARD OPERATING PROCEDURE (SOP) SPECIFICATION
            </td>
          </tr>
          <tr>
            <td colspan="7" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | SOP Number: ${sop.sopNumber} | Version: ${sop.version || 'v1.0'}
            </td>
          </tr>
          <tr><td colspan="7"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="7" style="text-align: left; color: #0f172a;">1. GENERAL DETAILS</th></tr>
          <tr><td><strong>SOP Number:</strong></td><td>${sop.sopNumber}</td><td><strong>Version:</strong></td><td>${sop.version || 'v1.0'}</td><td><strong>Status:</strong></td><td colspan="2">${sop.status}</td></tr>
          <tr><td><strong>Title:</strong></td><td colspan="6">${sop.title}</td></tr>
          <tr><td><strong>Department:</strong></td><td>${sop.department}</td><td><strong>Effective Date:</strong></td><td>${sop.effectiveDate}</td><td><strong>Review Date:</strong></td><td colspan="2">${sop.reviewDate || ''}</td></tr>
          <tr><td><strong>Responsibility:</strong></td><td colspan="6">${sop.responsibility}</td></tr>
          <tr><td><strong>Purpose:</strong></td><td colspan="6">${sop.purpose || ''}</td></tr>
          <tr><td><strong>Scope:</strong></td><td colspan="6">${sop.scope || ''}</td></tr>
          <tr><td><strong>Safety:</strong></td><td colspan="6">${sop.safetyInstructions || ''}</td></tr>
          <tr><td colspan="7"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="7" style="text-align: left; color: #0f172a;">2. STEP-BY-STEP PROCEDURE</th></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>Step #</th>
            <th>Step Title</th>
            <th>Action Details</th>
            <th>Role</th>
            <th>QC Checkpoint</th>
            <th>Safety / PPE</th>
            <th>Required Tools</th>
          </tr>
          ${stepsRows}
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
