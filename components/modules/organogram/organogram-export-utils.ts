import { OrganogramNode } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Organogram module
 */
export function computeOrganogramKpis(nodes: OrganogramNode[]) {
  const totalRoles = nodes.length;
  const totalHeadcount = nodes.reduce((sum, n) => sum + (n.headcount || 0), 0);
  const departments = new Set(nodes.map((n) => n.department)).size;
  const activeCount = nodes.filter((n) => (n.status || 'ACTIVE') === 'ACTIVE').length;
  const vacantCount = nodes.filter((n) => n.status === 'VACANT').length;
  const execCount = nodes.filter((n) => n.grade.includes('L8') || n.grade.includes('L7') || n.grade.toLowerCase().includes('exec')).length;

  return {
    totalRoles,
    totalHeadcount,
    departments,
    activeCount,
    vacantCount,
    execCount,
  };
}

/**
 * Download CSV helper
 */
export function downloadOrganogramCsv(
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
 * Export Global Organogram Hierarchy Register PDF
 */
export function exportOrganogramRegisterPdf(
  nodes: OrganogramNode[],
  scopeLabel: string = 'All Organization Roles'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeOrganogramKpis(nodes);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'organogram', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const nodeMap = new Map<string, OrganogramNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const rowsHtml = nodes
    .map((n, idx) => {
      const supervisor = n.reportsToId ? nodeMap.get(n.reportsToId) : null;
      const statusColor = n.status === 'VACANT' ? '#b45309' : n.status === 'ON_LEAVE' ? '#0284c7' : '#15803d';

      return `
        <tr>
          <td style="text-align: center; font-mono; font-size: 8pt; color: #64748b;">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${n.name}</div>
            <div style="font-size: 7.5pt; color: #64748b;">${n.email}</div>
          </td>
          <td>
            <div style="font-weight: 700; color: #1e3a8a;">${n.title}</div>
            <div style="font-size: 7.5pt; color: #475569;">${n.grade}</div>
          </td>
          <td style="font-size: 8pt; font-weight: 600; color: #334155;">${n.department}</td>
          <td style="font-size: 8pt; color: #475569;">
            ${supervisor ? `<div>${supervisor.title}</div><div style="font-size: 7.5pt; color: #64748b;">(${supervisor.name})</div>` : '<strong style="color: #1e3a8a;">Top Executive</strong>'}
          </td>
          <td style="font-family: monospace; font-size: 8pt; text-align: right; font-weight: bold; color: #0f172a;">
            ${n.headcount || 1}
          </td>
          <td style="font-size: 7.5pt; color: #334155; line-height: 1.3;">
            ${n.decisionAuthority ? n.decisionAuthority.slice(0, 90) + '...' : 'Standard department authority'}
          </td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: bold; color: ${statusColor}; background: #f8fafc; border: 1px solid ${statusColor}33;">
              ${n.status || 'ACTIVE'}
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
        <title>Organogram_Register_${new Date().toISOString().slice(0, 10)}</title>
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
            <div class="kpi-val">${kpis.totalRoles}</div>
            <div class="kpi-lbl">Total Key Roles</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #15803d;">${kpis.totalHeadcount}</div>
            <div class="kpi-lbl">Total Workforce</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #0284c7;">${kpis.departments}</div>
            <div class="kpi-lbl">Operating Depts</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #1e3a8a;">${kpis.execCount}</div>
            <div class="kpi-lbl">Executive Roles</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #15803d;">${kpis.activeCount}</div>
            <div class="kpi-lbl">Active Incumbents</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #b45309;">${kpis.vacantCount}</div>
            <div class="kpi-lbl">Vacant Positions</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">#</th>
              <th style="width: 18%;">Incumbent / Contact</th>
              <th style="width: 20%;">Designation &amp; Grade</th>
              <th style="width: 14%;">Department</th>
              <th style="width: 16%;">Reports Directly To</th>
              <th style="width: 6%; text-align: right;">Headcount</th>
              <th style="width: 14%;">Authority Scope</th>
              <th style="width: 8%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Head of Human Resources</div>
            <div class="sign-sub">Corporate Talent &amp; OD</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">QMS Management Rep</div>
            <div class="sign-sub">ISO 9001:2015 Clause 5.3 Audit</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Chief Operating Officer</div>
            <div class="sign-sub">Operational Command</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Managing Director</div>
            <div class="sign-sub">Corporate Executive Sign-off</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Document Code: <strong>${docCode}</strong> • Ref: ISO 9001:2015 Clause 5.3</span>
          <span>Printed On: ${new Date().toLocaleString()}</span>
          <span>Security Classification: INTERNAL ORGANIZATIONAL GOVERNANCE</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Global Organogram Excel (.xls)
 */
export function exportOrganogramRegisterExcel(
  nodes: OrganogramNode[],
  scopeLabel: string = 'All Organization Roles'
): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.organogramRegister || 'ORG-REG'}`;
  const fileName = `Organogram_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const nodeMap = new Map<string, OrganogramNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const rows = nodes
    .map((n, idx) => {
      const supervisor = n.reportsToId ? nodeMap.get(n.reportsToId) : null;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${n.name}</td>
          <td>${n.title}</td>
          <td>${n.department}</td>
          <td>${n.grade}</td>
          <td>${supervisor ? supervisor.title : 'Top Executive'}</td>
          <td>${n.headcount || 1}</td>
          <td>${n.email}</td>
          <td>${n.phone || ''}</td>
          <td>${n.officeLocation || ''}</td>
          <td>${n.status || 'ACTIVE'}</td>
          <td>${n.responsibilities?.join('; ') || ''}</td>
          <td>${n.certifications?.join('; ') || ''}</td>
          <td>${n.decisionAuthority || ''}</td>
          <td>${n.joinedDate || ''}</td>
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
              ORGANIZATIONAL CHART &amp; REPORTING HIERARCHY REGISTER
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
              <th>Incumbent Name</th>
              <th>Designation / Title</th>
              <th>Department</th>
              <th>Grade</th>
              <th>Reports To</th>
              <th>Span Headcount</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Status</th>
              <th>Key Responsibilities</th>
              <th>Certifications</th>
              <th>Decision Authority</th>
              <th>Joined Date</th>
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
 * Export Global Organogram CSV
 */
export function exportOrganogramRegisterCsv(
  nodes: OrganogramNode[],
  scopeLabel: string = 'All'
): void {
  const headers = [
    'Name',
    'Title',
    'Department',
    'Grade',
    'Reports To Title',
    'Headcount',
    'Email',
    'Phone',
    'Office Location',
    'Status',
    'Decision Authority',
    'Joined Date',
  ];

  const nodeMap = new Map<string, OrganogramNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const rows = nodes.map((n) => {
    const supervisor = n.reportsToId ? nodeMap.get(n.reportsToId) : null;
    return [
      n.name,
      n.title,
      n.department,
      n.grade,
      supervisor ? supervisor.title : 'Top Executive',
      n.headcount || 1,
      n.email,
      n.phone || '',
      n.officeLocation || '',
      n.status || 'ACTIVE',
      n.decisionAuthority || '',
      n.joinedDate || '',
    ];
  });

  const fileName = `Organogram_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadOrganogramCsv(fileName, headers, rows);
}

/**
 * Export Single Organogram Role Dossier PDF
 */
export function exportOrganogramSinglePdf(
  node: OrganogramNode,
  allNodes: OrganogramNode[] = []
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'organogram', 'single', node.id);
  const docCode = config.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const nodeMap = new Map<string, OrganogramNode>();
  allNodes.forEach((n) => nodeMap.set(n.id, n));
  const supervisor = node.reportsToId ? nodeMap.get(node.reportsToId) : null;
  const subordinates = allNodes.filter((n) => n.reportsToId === node.id);

  const respHtml = (node.responsibilities || [])
    .map(
      (r, idx) => `
      <div style="padding: 5px 0; border-bottom: 1px dashed #e2e8f0; font-size: 8.5pt; color: #334155;">
        <strong style="color: #1e3a8a;">${idx + 1}.</strong> ${r}
      </div>
    `
    )
    .join('');

  const certsHtml = (node.certifications || [])
    .map(
      (c) => `
      <span style="display: inline-block; padding: 3px 8px; margin: 2px 4px 2px 0; border-radius: 4px; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 8pt; font-weight: 600;">
        ${c}
      </span>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${node.title.replace(/\s+/g, '_')}_Specification_Dossier</title>
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
          .profile-box {
            margin: 14px 0;
            padding: 14px 18px;
            border-radius: 10px;
            background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
            border: 1px solid #bfdbfe;
            display: flex;
            justify-content: space-between;
            align-items: center;
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
            margin-top: 32px;
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

        <div class="profile-box">
          <div>
            <div style="font-size: 14pt; font-weight: 800; color: #0f172a;">${node.name}</div>
            <div style="font-size: 10pt; font-weight: 700; color: #1e3a8a; margin-top: 2px;">${node.title}</div>
            <div style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">
              ${node.department} • <strong style="color: #334155;">${node.grade}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 11pt; font-weight: 800; color: #15803d;">
              ${node.status || 'ACTIVE'}
            </div>
            <div style="font-size: 8pt; color: #64748b; margin-top: 4px;">
              Span: <strong>${node.headcount || 1} staff</strong>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title">Corporate Governance &amp; Reporting</div>
            <div class="meta-row">
              <span class="meta-label">Reports Directly To:</span>
              <span class="meta-value">${supervisor ? supervisor.title : 'Managing Director'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Supervisor Name:</span>
              <span class="meta-value">${supervisor ? supervisor.name : 'Executive Board'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Workforce In Span:</span>
              <span class="meta-value" style="font-family: monospace;">${node.headcount || 1} employees</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Direct Reporting Subordinates:</span>
              <span class="meta-value">${subordinates.length} Key Roles</span>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Contact &amp; Administrative Assignment</div>
            <div class="meta-row">
              <span class="meta-label">Corporate Email:</span>
              <span class="meta-value" style="font-family: monospace; font-size: 8pt;">${node.email}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Direct Phone:</span>
              <span class="meta-value" style="font-family: monospace;">${node.phone || 'Internal Ext.'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Workstation Location:</span>
              <span class="meta-value">${node.officeLocation || 'Main Plant'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Date of Appointment:</span>
              <span class="meta-value" style="font-family: monospace;">${node.joinedDate || '2020-01-01'}</span>
            </div>
          </div>
        </div>

        <div class="scope-box">
          <div style="font-size: 8.5pt; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            Key Organizational Responsibilities &amp; Functions
          </div>
          ${respHtml || '<div style="font-size: 8.5pt; color: #64748b;">Direct execution and maintenance of departmental QMS protocols.</div>'}
        </div>

        <div class="scope-box" style="margin-top: 10px;">
          <div style="font-size: 8.5pt; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            Delegated Decision-Making &amp; Authority Scope
          </div>
          <div style="font-size: 8.5pt; line-height: 1.5; color: #334155;">
            ${node.decisionAuthority || 'Autonomous authority over departmental operations, quality verification, and assigned task allocations.'}
          </div>
        </div>

        ${
          node.certifications && node.certifications.length > 0
            ? `
            <div style="margin-top: 10px;">
              <span style="font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">
                Verified Professional Accreditations
              </span>
              <div>${certsHtml}</div>
            </div>
          `
            : ''
        }

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Incumbent Acknowledgment</div>
            <div class="sign-sub">${node.name}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Direct Supervisor Sign-off</div>
            <div class="sign-sub">${supervisor ? supervisor.name : 'Executive Board'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">HR &amp; Managing Director</div>
            <div class="sign-sub">Corporate Organizational Sanction</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Dossier Reference: <strong>${docCode}</strong> • ISO 9001:2015 Clause 5.3</span>
          <span>Security Classification: INTERNAL GOVERNANCE ONLY</span>
          <span>Printed: ${new Date().toLocaleDateString()}</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Single Organogram Role Excel (.xls)
 */
export function exportOrganogramSingleExcel(
  node: OrganogramNode,
  allNodes: OrganogramNode[] = []
): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.organogramChart || 'ORG-ROLE'}-${node.id}`;
  const fileName = `Organogram_${node.title.replace(/\s+/g, '_')}_Dossier.xls`;

  const nodeMap = new Map<string, OrganogramNode>();
  allNodes.forEach((n) => nodeMap.set(n.id, n));
  const supervisor = node.reportsToId ? nodeMap.get(node.reportsToId) : null;

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
              ORGANIZATIONAL ROLE SPECIFICATION: ${node.title}
            </td>
          </tr>
          <tr>
            <td colspan="4" style="color: #64748b;">
              Incumbent: ${node.name} | Grade: ${node.grade} | Doc Code: ${docCode}
            </td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr><th colspan="2">Organizational Field</th><th colspan="2">Attribute Value</th></tr>
          <tr><td colspan="2">Incumbent Name</td><td colspan="2">${node.name}</td></tr>
          <tr><td colspan="2">Designation / Title</td><td colspan="2">${node.title}</td></tr>
          <tr><td colspan="2">Department</td><td colspan="2">${node.department}</td></tr>
          <tr><td colspan="2">Organizational Grade</td><td colspan="2">${node.grade}</td></tr>
          <tr><td colspan="2">Direct Supervisor</td><td colspan="2">${supervisor ? `${supervisor.title} (${supervisor.name})` : 'Top Executive'}</td></tr>
          <tr><td colspan="2">Span Headcount</td><td colspan="2">${node.headcount || 1} staff</td></tr>
          <tr><td colspan="2">Corporate Email</td><td colspan="2">${node.email}</td></tr>
          <tr><td colspan="2">Direct Phone</td><td colspan="2">${node.phone || 'N/A'}</td></tr>
          <tr><td colspan="2">Workstation Location</td><td colspan="2">${node.officeLocation || 'Main Plant'}</td></tr>
          <tr><td colspan="2">Current Status</td><td colspan="2">${node.status || 'ACTIVE'}</td></tr>
          <tr><td colspan="2">Appointment Date</td><td colspan="2">${node.joinedDate || 'N/A'}</td></tr>
          <tr><td colspan="2">Delegated Decision Authority</td><td colspan="2">${node.decisionAuthority || 'Standard Authority'}</td></tr>
          <tr><td colspan="2">Key Responsibilities</td><td colspan="2">${node.responsibilities?.join('; ') || ''}</td></tr>
          <tr><td colspan="2">Certifications</td><td colspan="2">${node.certifications?.join('; ') || ''}</td></tr>
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
 * Export Single Organogram Role CSV
 */
export function exportOrganogramSingleCsv(
  node: OrganogramNode,
  allNodes: OrganogramNode[] = []
): void {
  const nodeMap = new Map<string, OrganogramNode>();
  allNodes.forEach((n) => nodeMap.set(n.id, n));
  const supervisor = node.reportsToId ? nodeMap.get(node.reportsToId) : null;

  const headers = ['Parameter', 'Value'];
  const rows = [
    ['Incumbent Name', node.name],
    ['Title', node.title],
    ['Department', node.department],
    ['Grade', node.grade],
    ['Reports To', supervisor ? supervisor.title : 'Top Executive'],
    ['Headcount Span', String(node.headcount || 1)],
    ['Email', node.email],
    ['Phone', node.phone || ''],
    ['Office Location', node.officeLocation || ''],
    ['Status', node.status || 'ACTIVE'],
    ['Decision Authority', node.decisionAuthority || ''],
    ['Joined Date', node.joinedDate || ''],
  ];

  const fileName = `Organogram_${node.title.replace(/\s+/g, '_')}_Dossier.csv`;
  downloadOrganogramCsv(fileName, headers, rows);
}
