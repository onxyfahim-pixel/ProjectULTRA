import { ProcessFlowChart, ProcessFlowStatus } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Process Flow module
 */
export function computeProcessFlowKpis(flows: ProcessFlowChart[]) {
  const total = flows.length;
  const active = flows.filter((f) => f.status === 'ACTIVE').length;
  const draft = flows.filter((f) => f.status === 'DRAFT').length;
  const underReview = flows.filter((f) => f.status === 'UNDER_REVIEW').length;
  const archived = flows.filter((f) => f.status === 'ARCHIVED').length;

  let totalStages = 0;
  let totalCriticalGates = 0;
  let totalLeadHours = 0;

  flows.forEach((f) => {
    totalStages += f.steps?.length || 0;
    (f.steps || []).forEach((s) => {
      if (s.criticalGate) totalCriticalGates += 1;
      totalLeadHours += Number(s.leadTimeHours) || 0;
    });
  });

  const avgLeadDays = total > 0 ? (totalLeadHours / total / 24).toFixed(1) : '0';

  return {
    total,
    active,
    draft,
    underReview,
    archived,
    totalStages,
    totalCriticalGates,
    avgLeadDays,
  };
}

/**
 * Download CSV helper
 */
export function downloadProcessFlowCsv(
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
 * Export Global Process Flow Register PDF
 */
export function exportProcessFlowRegisterPdf(
  flows: ProcessFlowChart[],
  scopeLabel: string = 'All Garment Process Flows'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeProcessFlowKpis(flows);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'process_flow', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const getStatusColor = (status: ProcessFlowStatus) => {
    switch (status) {
      case 'ACTIVE':
        return '#15803d';
      case 'UNDER_REVIEW':
        return '#0284c7';
      case 'DRAFT':
        return '#b45309';
      case 'ARCHIVED':
        return '#64748b';
      default:
        return '#15803d';
    }
  };

  const rowsHtml = flows
    .map((f, idx) => {
      const stepCount = f.steps?.length || 0;
      const criticalCount = (f.steps || []).filter((s) => s.criticalGate).length;
      const hours = (f.steps || []).reduce((sum, s) => sum + (Number(s.leadTimeHours) || 0), 0);
      const days = (hours / 24).toFixed(1);

      return `
        <tr>
          <td style="text-align: center; font-mono; font-size: 8pt; color: #64748b;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${f.flowCode}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${f.title}</div>
            <div style="font-size: 7.5pt; color: #64748b;">${f.description ? f.description.slice(0, 70) + '...' : ''}</div>
          </td>
          <td style="font-size: 8pt; font-weight: 600; color: #2563eb;">${f.productCategory}</td>
          <td style="font-family: monospace; font-size: 8pt; color: #0f172a;">${f.version}</td>
          <td style="font-size: 8pt; color: #475569;">
            ${stepCount} Stages • <strong style="color: #dc2626;">${criticalCount} QC Gates</strong>
          </td>
          <td style="font-family: monospace; font-size: 8pt; color: #0f172a;">
            ${days} Days (${hours}h)
          </td>
          <td style="font-family: monospace; font-size: 7.5pt; color: #334155;">
            ${f.effectiveDate || '2024-01-01'}
          </td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: bold; color: ${getStatusColor(f.status)}; background: #f8fafc; border: 1px solid ${getStatusColor(f.status)}33;">
              ${f.status}
            </span>
          </td>
          <td style="font-size: 7.5pt; color: #475569;">
            <div>Auth: ${f.author || 'Industrial Eng'}</div>
            <div style="color: #64748b;">Appr: ${f.approvedBy || 'QA Head'}</div>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Process_Flow_Register_${new Date().toISOString().slice(0, 10)}</title>
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
            <div class="kpi-lbl">Total Process Flows</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #15803d;">${kpis.active}</div>
            <div class="kpi-lbl">Active & Production-Ready</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #0284c7;">${kpis.underReview}</div>
            <div class="kpi-lbl">Under Review</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${kpis.totalStages}</div>
            <div class="kpi-lbl">Total Process Stages</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #dc2626;">${kpis.totalCriticalGates}</div>
            <div class="kpi-lbl">Critical QC Gates</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${kpis.avgLeadDays} d</div>
            <div class="kpi-lbl">Avg Lead Time</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">#</th>
              <th style="width: 12%;">Flow Code</th>
              <th style="width: 24%;">Process Title</th>
              <th style="width: 12%;">Product Line</th>
              <th style="width: 8%;">Version</th>
              <th style="width: 14%;">Stages &amp; QC Gates</th>
              <th style="width: 10%;">Lead Time</th>
              <th style="width: 8%;">Effective</th>
              <th style="width: 8%; text-align: center;">Status</th>
              <th style="width: 12%;">Sign-off</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Chief Industrial Engineer</div>
            <div class="sign-sub">Method &amp; Flow Engineering</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Head of Production</div>
            <div class="sign-sub">Operational Execution</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Head of Quality Assurance</div>
            <div class="sign-sub">Quality Gates &amp; Standards</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">General Manager (Factory)</div>
            <div class="sign-sub">Executive Approval</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Document Code: <strong>${docCode}</strong> • Ref: ISO 9001:2015 Clause 8.1</span>
          <span>Printed On: ${new Date().toLocaleString()}</span>
          <span>Security Classification: MANUFACTURING TECHNICAL SPECIFICATION</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Global Process Flow Register Excel (.xls)
 */
export function exportProcessFlowRegisterExcel(
  flows: ProcessFlowChart[],
  scopeLabel: string = 'All Garment Process Flows'
): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.processFlowRegister || 'PFC-REG'}`;
  const fileName = `Process_Flows_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = flows
    .map((f, idx) => {
      const stepCount = f.steps?.length || 0;
      const criticalCount = (f.steps || []).filter((s) => s.criticalGate).length;
      const hours = (f.steps || []).reduce((sum, s) => sum + (Number(s.leadTimeHours) || 0), 0);
      const days = (hours / 24).toFixed(1);

      return `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-family: monospace;">${f.flowCode}</td>
          <td>${f.title}</td>
          <td>${f.productCategory}</td>
          <td>${f.department || 'ALL'}</td>
          <td>${f.version}</td>
          <td>${f.status}</td>
          <td>${stepCount}</td>
          <td>${criticalCount}</td>
          <td>${hours}</td>
          <td>${days}</td>
          <td>${f.effectiveDate}</td>
          <td>${f.author}</td>
          <td>${f.approvedBy}</td>
          <td>${f.description}</td>
        </tr>
      `;
    })
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
            <td colspan="15" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="15" style="font-size: 12pt; font-weight: bold;">
              GARMENT MANUFACTURING PROCESS FLOW (PFC) MASTER REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="15" style="color: #64748b;">
              Scope: ${scopeLabel} | Doc Code: ${docCode} | Generated: ${new Date().toLocaleString()}
            </td>
          </tr>
          <tr><td colspan="15"></td></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>Flow Code</th>
              <th>Process Title</th>
              <th>Product Category</th>
              <th>Department</th>
              <th>Version</th>
              <th>Status</th>
              <th>Total Stages</th>
              <th>Critical Gates</th>
              <th>Total Hours</th>
              <th>Total Days</th>
              <th>Effective Date</th>
              <th>Author</th>
              <th>Approved By</th>
              <th>Description</th>
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
 * Export Global Process Flow Register CSV
 */
export function exportProcessFlowRegisterCsv(
  flows: ProcessFlowChart[],
  scopeLabel: string = 'All'
): void {
  const headers = [
    'Flow Code',
    'Process Title',
    'Product Category',
    'Department',
    'Version',
    'Status',
    'Stages Count',
    'Critical Gates',
    'Lead Time Hours',
    'Effective Date',
    'Author',
    'Approved By',
  ];

  const rows = flows.map((f) => [
    f.flowCode,
    f.title,
    f.productCategory,
    f.department || '',
    f.version,
    f.status,
    f.steps?.length || 0,
    (f.steps || []).filter((s) => s.criticalGate).length,
    (f.steps || []).reduce((sum, s) => sum + (Number(s.leadTimeHours) || 0), 0),
    f.effectiveDate || '',
    f.author || '',
    f.approvedBy || '',
  ]);

  const fileName = `Process_Flows_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadProcessFlowCsv(fileName, headers, rows);
}

/**
 * Export Single Process Flow Chart Dossier PDF
 */
export function exportProcessFlowSinglePdf(flow: ProcessFlowChart): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'process_flow', 'single', flow.flowCode);
  const docCode = config.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const totalHours = (flow.steps || []).reduce((sum, s) => sum + (Number(s.leadTimeHours) || 0), 0);
  const totalDays = (totalHours / 24).toFixed(1);
  const criticalCount = (flow.steps || []).filter((s) => s.criticalGate).length;

  const stepsHtml = (flow.steps || [])
    .map(
      (s, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
        <td style="padding: 7px 8px; text-align: center; font-family: monospace; font-weight: bold; color: #1e3a8a;">
          ${s.stepNumber}
        </td>
        <td style="padding: 7px 8px;">
          <div style="font-weight: 700; color: #0f172a;">${s.stageName}</div>
          <div style="font-size: 7.5pt; color: #64748b;">${s.department}</div>
        </td>
        <td style="padding: 7px 8px; font-size: 8pt; color: #334155;">
          ${s.inputMaterials}
        </td>
        <td style="padding: 7px 8px; font-size: 8pt; color: #0f172a;">
          ${s.transformation}
        </td>
        <td style="padding: 7px 8px; font-size: 8pt; color: ${s.criticalGate ? '#b91c1c' : '#0369a1'}; font-weight: 600;">
          ${s.qualityGate}
          ${s.criticalGate ? '<span style="display: block; font-size: 7pt; font-weight: 800; color: #be123c;">[CRITICAL GATE]</span>' : ''}
        </td>
        <td style="padding: 7px 8px; font-size: 7.5pt; color: #475569;">
          ${s.standardTool}
        </td>
        <td style="padding: 7px 8px; font-family: monospace; font-size: 8pt; text-align: right; font-weight: 600; color: #0f172a;">
          ${s.leadTimeHours}h
        </td>
        <td style="padding: 7px 8px; font-size: 7.5pt; color: #475569;">
          ${s.responsibleRole || 'Operator'}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${flow.flowCode}_Process_Flow_Dossier</title>
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
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin: 12px 0 14px 0;
            padding: 10px 14px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
          }
          .kpi-item {
            text-align: center;
          }
          .kpi-val {
            font-size: 13pt;
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
            font-size: 8pt;
            margin-top: 8px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 7px 8px;
            border: 1px solid #0f172a;
            font-size: 7.5pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          td {
            border: 1px solid #cbd5e1;
            vertical-align: middle;
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
            <div class="kpi-val">${flow.productCategory}</div>
            <div class="kpi-lbl">Product Line</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${flow.steps?.length || 0} Stages</div>
            <div class="kpi-lbl">Total Sequence</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #dc2626;">${criticalCount}</div>
            <div class="kpi-lbl">Critical QC Gates</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${totalDays} Days (${totalHours}h)</div>
            <div class="kpi-lbl">Cycle Lead Time</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #15803d;">${flow.status}</div>
            <div class="kpi-lbl">Status / Rev ${flow.version}</div>
          </div>
        </div>

        <div style="font-size: 8.5pt; color: #475569; margin: 6px 0 10px 0; font-style: italic;">
          Process Scope: ${flow.description}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">Seq</th>
              <th style="width: 15%;">Stage &amp; Department</th>
              <th style="width: 15%;">Input Materials</th>
              <th style="width: 20%;">Transformation &amp; Process</th>
              <th style="width: 18%;">Quality Control Gate</th>
              <th style="width: 14%;">Equipment / Tool</th>
              <th style="width: 6%; text-align: right;">Lead</th>
              <th style="width: 8%;">Role</th>
            </tr>
          </thead>
          <tbody>
            ${stepsHtml}
          </tbody>
        </table>

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Prepared By (IE)</div>
            <div class="sign-sub">${flow.author || 'Industrial Engineering'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Production Manager</div>
            <div class="sign-sub">Line Assembly Operations</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Quality Assurance Manager</div>
            <div class="sign-sub">${flow.approvedBy || 'Quality Assurance'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Managing Director</div>
            <div class="sign-sub">Executive Compliance Authorization</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Dossier Reference: <strong>${docCode}</strong> • ISO 9001:2015 Clause 8.1</span>
          <span>Effective: ${flow.effectiveDate}</span>
          <span>Security Classification: MANUFACTURING SECRET &amp; STANDARD</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Single Process Flow Excel (.xls)
 */
export function exportProcessFlowSingleExcel(flow: ProcessFlowChart): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.processFlowDossier || 'PFC-MAP'}-${flow.flowCode}`;
  const fileName = `Process_Flow_${flow.flowCode}_Mapping.xls`;

  const rows = (flow.steps || [])
    .map(
      (s) => `
      <tr>
        <td>${s.stepNumber}</td>
        <td>${s.stageName}</td>
        <td>${s.department}</td>
        <td>${s.inputMaterials}</td>
        <td>${s.transformation}</td>
        <td>${s.qualityGate}</td>
        <td>${s.criticalGate ? 'YES' : 'NO'}</td>
        <td>${s.standardTool}</td>
        <td>${s.leadTimeHours}</td>
        <td>${s.responsibleRole || ''}</td>
        <td>${s.toleranceSpecs || ''}</td>
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
            <td colspan="11" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="11" style="font-size: 12pt; font-weight: bold;">
              MANUFACTURING PROCESS FLOW CHART: ${flow.title}
            </td>
          </tr>
          <tr>
            <td colspan="11" style="color: #64748b;">
              Code: ${flow.flowCode} | Category: ${flow.productCategory} | Version: ${flow.version} | Doc Code: ${docCode}
            </td>
          </tr>
          <tr><td colspan="11"></td></tr>
          <thead>
            <tr>
              <th>Step #</th>
              <th>Stage Name</th>
              <th>Department</th>
              <th>Input Materials</th>
              <th>Process Transformation</th>
              <th>Quality Gate</th>
              <th>Critical Gate</th>
              <th>Equipment / Tools</th>
              <th>Lead Time (Hrs)</th>
              <th>Responsible Role</th>
              <th>Tolerance Specs</th>
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
 * Export Single Process Flow CSV
 */
export function exportProcessFlowSingleCsv(flow: ProcessFlowChart): void {
  const headers = [
    'Step Number',
    'Stage Name',
    'Department',
    'Input Materials',
    'Transformation',
    'Quality Gate',
    'Critical Gate',
    'Equipment Tools',
    'Lead Time Hours',
    'Responsible Role',
    'Tolerance Specs',
  ];

  const rows = (flow.steps || []).map((s) => [
    s.stepNumber,
    s.stageName,
    s.department,
    s.inputMaterials,
    s.transformation,
    s.qualityGate,
    s.criticalGate ? 'YES' : 'NO',
    s.standardTool,
    s.leadTimeHours,
    s.responsibleRole || '',
    s.toleranceSpecs || '',
  ]);

  const fileName = `Process_Flow_${flow.flowCode}_Steps.csv`;
  downloadProcessFlowCsv(fileName, headers, rows);
}
