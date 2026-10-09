import { JobDescriptionItem, JobDescriptionStatus } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Job Descriptions module
 */
export function computeJobKpis(jobs: JobDescriptionItem[]) {
  const total = jobs.length;
  const active = jobs.filter((j) => j.status === 'ACTIVE').length;
  const vacant = jobs.filter((j) => j.status === 'VACANT').length;
  const underRevision = jobs.filter((j) => j.status === 'UNDER_REVISION').length;
  const archived = jobs.filter((j) => j.status === 'ARCHIVED').length;

  const totalExperience = jobs.reduce((acc, j) => acc + (j.experienceYears || 0), 0);
  const avgExperience = total > 0 ? (totalExperience / total).toFixed(1) : '0';
  const filledRate = total > 0 ? Math.round((active / total) * 100) : 100;

  return {
    total,
    active,
    vacant,
    underRevision,
    archived,
    avgExperience,
    filledRate,
  };
}

/**
 * Download CSV helper
 */
export function downloadJobCsv(
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
 * Export Global Job Descriptions Master Register PDF
 */
export function exportJobRegisterPdf(
  jobs: JobDescriptionItem[],
  scopeLabel: string = 'All Position Profiles'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeJobKpis(jobs);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'job_description', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const getStatusColor = (status?: JobDescriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return '#15803d';
      case 'VACANT':
        return '#b45309';
      case 'UNDER_REVISION':
        return '#0284c7';
      case 'ARCHIVED':
        return '#64748b';
      default:
        return '#15803d';
    }
  };

  const getStatusBg = (status?: JobDescriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return '#dcfce7';
      case 'VACANT':
        return '#fef3c7';
      case 'UNDER_REVISION':
        return '#e0f2fe';
      case 'ARCHIVED':
        return '#f1f5f9';
      default:
        return '#dcfce7';
    }
  };

  const rowsHtml = jobs
    .map((j, index) => {
      const responsibilitiesCount = j.keyResponsibilities?.length || 0;
      const skills = j.technicalSkills?.slice(0, 3).join(', ') || 'General Competencies';

      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${index + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${j.roleCode}</td>
          <td>
            <strong>${j.title}</strong>
            ${j.incumbentName ? `<div style="font-size: 8pt; color: #15803d; margin-top: 2px;">Incumbent: ${j.incumbentName}</div>` : '<div style="font-size: 8pt; color: #b45309; margin-top: 2px;">(Position Vacant)</div>'}
          </td>
          <td>${j.department}</td>
          <td><span style="font-size: 8pt; font-weight: 600; padding: 2px 6px; background-color: #f1f5f9; border-radius: 4px;">${j.level}</span></td>
          <td>${j.supervisorTitle || j.supervisorName || 'Department Head'}</td>
          <td style="font-size: 8pt;">${j.educationRequirement}</td>
          <td style="text-align: center; font-weight: 600;">${j.experienceYears} Yrs</td>
          <td style="font-size: 8pt; color: #475569;">${skills}</td>
          <td style="text-align: center;">
            <span style="
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 8pt;
              font-weight: bold;
              background-color: ${getStatusBg(j.status)};
              color: ${getStatusColor(j.status)};
            ">
              ${(j.status || 'ACTIVE').replace(/_/g, ' ')}
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
        <title>Job Descriptions Register - ${new Date().toISOString().slice(0, 10)}</title>
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
            <div class="kpi-title">Total Positions</div>
            <div class="kpi-value">${kpis.total}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Active Positions</div>
            <div class="kpi-value" style="color: #15803d;">${kpis.active}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Vacant Roles</div>
            <div class="kpi-value" style="color: #b45309;">${kpis.vacant}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Under Revision</div>
            <div class="kpi-value" style="color: #0284c7;">${kpis.underRevision}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Avg Exp Required</div>
            <div class="kpi-value" style="color: #6366f1;">${kpis.avgExperience} Yrs</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Staffing Fill Rate</div>
            <div class="kpi-value" style="color: #0f766e;">${kpis.filledRate}%</div>
          </div>
        </div>

        <!-- Master Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 3%; text-align: center;">#</th>
              <th style="width: 10%;">Role Code</th>
              <th style="width: 20%;">Position Title & Incumbent</th>
              <th style="width: 12%;">Department</th>
              <th style="width: 8%;">Level</th>
              <th style="width: 12%;">Reports To</th>
              <th style="width: 13%;">Education Required</th>
              <th style="width: 6%; text-align: center;">Exp</th>
              <th style="width: 10%;">Key Competencies</th>
              <th style="width: 6%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Sign-off Block -->
        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">HR & Admin Manager</div>
            <div class="sign-sub">Organizational Job Analysis</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Department Head</div>
            <div class="sign-sub">Functional Competency Review</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Quality Assurance Director</div>
            <div class="sign-sub">ISO 9001 Clause 5.3 Conformance</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Managing Director</div>
            <div class="sign-sub">Corporate Executive Authorization</div>
          </div>
        </div>

        <!-- Footer Strip -->
        <div class="footer-strip">
          <div>Doc Code: <strong>${docCode}</strong> • Standard: ISO 9001:2015 Clause 5.3 & WRAP Principle 10</div>
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
 * Export Global Job Descriptions Excel (.xls)
 */
export function exportJobRegisterExcel(jobs: JobDescriptionItem[]): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.jobDescriptionRegister || 'JD-REG'}`;
  const fileName = `Job_Descriptions_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = jobs
    .map(
      (j, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-family: monospace;">${j.roleCode}</td>
          <td>${j.title}</td>
          <td>${j.department}</td>
          <td>${j.level}</td>
          <td>${j.incumbentName || 'VACANT'}</td>
          <td>${j.companyIdNo || ''}</td>
          <td>${j.supervisorTitle || j.supervisorName || ''}</td>
          <td>${j.educationRequirement}</td>
          <td>${j.experienceYears}</td>
          <td>${j.status || 'ACTIVE'}</td>
          <td>${j.employmentType || 'FULL_TIME'}</td>
          <td>${j.technicalSkills?.join('; ') || ''}</td>
          <td>${j.keyResponsibilities?.join('; ') || ''}</td>
          <td>${j.isoClauseMapping?.join('; ') || ''}</td>
          <td>${j.decisionAuthority || ''}</td>
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
                <x:Name>JD Register</x:Name>
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
            <td colspan="16" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="16" style="font-size: 12pt; font-weight: bold;">
              ORGANIZATIONAL JOB DESCRIPTIONS &amp; ROLE SPECIFICATION MASTER REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="16" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Export Date: ${new Date().toISOString().slice(0, 10)} | Standard: ISO 9001:2015 Clause 5.3
            </td>
          </tr>
          <tr><td colspan="16"></td></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>Role Code</th>
            <th>Position Title</th>
            <th>Department</th>
            <th>Level</th>
            <th>Incumbent</th>
            <th>Staff ID</th>
            <th>Reports To</th>
            <th>Education Requirement</th>
            <th>Exp (Years)</th>
            <th>Status</th>
            <th>Employment Type</th>
            <th>Technical Competencies</th>
            <th>Key Responsibilities</th>
            <th>ISO Clause Alignment</th>
            <th>Decision Authority</th>
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
 * Export Individual Job Description Specification Dossier PDF
 */
export function exportSingleJobPdf(job: JobDescriptionItem): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'job_description', 'single', job.roleCode);
  const docCode = config.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const respHtml = (job.keyResponsibilities || [])
    .map(
      (r, idx) => `
        <div style="margin-bottom: 6px; padding-left: 12px; border-left: 2px solid #2563eb; font-size: 8.5pt;">
          <strong>${idx + 1}.</strong> ${r}
        </div>
      `
    )
    .join('');

  const skillsHtml = (job.technicalSkills || [])
    .map(
      (s) => `
        <span style="display: inline-block; margin: 2px 4px 2px 0; padding: 3px 8px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 8pt; font-weight: 600;">
          ${s}
        </span>
      `
    )
    .join('');

  const kpisHtml = (job.kpiMetrics || [])
    .map(
      (k, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${k.kpiName}</strong></td>
          <td style="text-align: center; font-weight: bold; color: #1e3a8a;">${k.target}</td>
          <td style="text-align: center;">${k.measurementFrequency}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Job Description - ${job.roleCode}</title>
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
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 8.5pt;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #0f172a;
            font-size: 8pt;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
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

        <!-- 1. Position Profile -->
        <div class="section-title">1. Position Identification &amp; Organizational Placement</div>
        <div class="grid-4">
          <div class="info-cell">
            <div class="info-label">Role Code</div>
            <div class="info-val" style="color: #1e3a8a;">${job.roleCode}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Position Title</div>
            <div class="info-val truncate">${job.title}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Department</div>
            <div class="info-val">${job.department}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Hierarchy Level</div>
            <div class="info-val">${job.level}</div>
          </div>
        </div>

        <div class="grid-4" style="margin-top: 8px;">
          <div class="info-cell">
            <div class="info-label">Current Incumbent</div>
            <div class="info-val" style="color: #15803d;">${job.incumbentName || 'VACANT'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Direct Supervisor</div>
            <div class="info-val truncate">${job.supervisorTitle || job.supervisorName || 'Department Head'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Employment Type</div>
            <div class="info-val">${job.employmentType || 'FULL TIME'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Status</div>
            <div class="info-val">${job.status || 'ACTIVE'}</div>
          </div>
        </div>

        <!-- 2. Competency Specifications -->
        <div class="section-title">2. Competency &amp; Educational Prerequisites</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 8.5pt;">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
            <strong style="color: #1e3a8a;">Minimum Education:</strong>
            <p style="margin: 4px 0 0 0;">${job.educationRequirement}</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
            <strong style="color: #1e3a8a;">Relevant Experience Required:</strong>
            <p style="margin: 4px 0 0 0;">${job.experienceYears} Years direct domain experience</p>
          </div>
        </div>

        <!-- 3. Key Responsibilities -->
        <div class="section-title">3. Core Operational Duties &amp; Key Responsibilities</div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
          ${respHtml || 'No detailed responsibilities documented.'}
        </div>

        <!-- 4. Technical Skills & Tools -->
        <div class="section-title">4. Technical Skills, Tools &amp; Certifications</div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
          ${skillsHtml || 'Standard vocational skills.'}
          ${job.decisionAuthority ? `<div style="margin-top: 8px; font-size: 8pt; color: #475569;"><strong>Authority & Decision Scope:</strong> ${job.decisionAuthority}</div>` : ''}
        </div>

        <!-- 5. Key Performance Indicators (KPIs) -->
        ${
          job.kpiMetrics && job.kpiMetrics.length > 0
            ? `
              <div class="section-title">5. Core Accountability &amp; Performance Metrics (KPIs)</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 5%; text-align: center;">#</th>
                    <th style="width: 50%;">Key Performance Indicator</th>
                    <th style="width: 25%; text-align: center;">Standard Target</th>
                    <th style="width: 20%; text-align: center;">Review Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  ${kpisHtml}
                </tbody>
              </table>
            `
            : ''
        }

        <!-- Signatures -->
        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Employee / Incumbent</div>
            <div class="sign-sub">${job.incumbentName || 'Acknowledged Incumbent'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Direct Supervisor</div>
            <div class="sign-sub">${job.supervisorTitle || 'Department Manager'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Head of HR & Compliance</div>
            <div class="sign-sub">Approved Position Spec</div>
          </div>
        </div>

        <div class="footer-strip">
          <div>Doc Code: <strong>${docCode}</strong> • Ref: ${job.roleCode}</div>
          <div>Printed: ${new Date().toLocaleString()} • Controlled HR Record</div>
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
 * Export Individual Job Description Excel (.xls)
 */
export function exportSingleJobExcel(job: JobDescriptionItem): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.jobDescriptionDossier || 'JD-SPEC'}`;
  const fileName = `JD_${job.roleCode}_${new Date().toISOString().slice(0, 10)}.xls`;

  const respRows = (job.keyResponsibilities || [])
    .map(
      (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td colspan="3">${r}</td>
        </tr>
      `
    )
    .join('');

  const kpiRows = (job.kpiMetrics || [])
    .map(
      (k, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${k.kpiName}</td>
          <td>${k.target}</td>
          <td>${k.measurementFrequency}</td>
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
                <x:Name>Job Description</x:Name>
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
              OFFICIAL JOB DESCRIPTION &amp; ROLE SPECIFICATION
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Role Code: ${job.roleCode} | Title: ${job.title}
            </td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">1. POSITION IDENTIFICATION</th></tr>
          <tr><td><strong>Role Code:</strong></td><td>${job.roleCode}</td><td><strong>Title:</strong></td><td>${job.title}</td></tr>
          <tr><td><strong>Department:</strong></td><td>${job.department}</td><td><strong>Level:</strong></td><td>${job.level}</td></tr>
          <tr><td><strong>Incumbent:</strong></td><td>${job.incumbentName || 'VACANT'}</td><td><strong>Staff ID:</strong></td><td>${job.companyIdNo || ''}</td></tr>
          <tr><td><strong>Supervisor:</strong></td><td>${job.supervisorTitle || job.supervisorName || ''}</td><td><strong>Status:</strong></td><td>${job.status || 'ACTIVE'}</td></tr>
          <tr><td><strong>Education:</strong></td><td>${job.educationRequirement}</td><td><strong>Experience:</strong></td><td>${job.experienceYears} Years</td></tr>
          <tr><td><strong>Technical Skills:</strong></td><td colspan="3">${job.technicalSkills?.join('; ') || ''}</td></tr>
          <tr><td><strong>Authority Scope:</strong></td><td colspan="3">${job.decisionAuthority || ''}</td></tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">2. KEY RESPONSIBILITIES</th></tr>
          ${respRows}
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">3. KEY PERFORMANCE INDICATORS (KPIS)</th></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th colspan="2">KPI Description</th>
            <th>Target</th>
          </tr>
          ${kpiRows}
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
