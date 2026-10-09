import { CapaItem } from '@/lib/types/modules';
import { loadPdfHeaderSettings, renderPdfHeaderHtml, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for CAPA module
 */
export function computeCapaKpis(capas: CapaItem[]) {
  const total = capas.length;
  const closed = capas.filter((c) => c.status === 'CLOSED').length;
  const inProgress = capas.filter((c) => c.status === 'IN_PROGRESS').length;
  const verificationPending = capas.filter((c) => c.status === 'VERIFICATION_PENDING').length;
  const open = capas.filter((c) => c.status === 'OPEN').length;
  const critical = capas.filter((c) => c.severity === 'CRITICAL').length;
  const major = capas.filter((c) => c.severity === 'MAJOR').length;
  const minor = capas.filter((c) => c.severity === 'MINOR').length;
  const closedRate = total > 0 ? Math.round((closed / total) * 100) : 0;
  const effectivenessVerifiedCount = capas.filter((c) => c.effectivenessVerified).length;
  const departmentsCount = new Set(capas.map((c) => c.department).filter(Boolean)).size;

  return {
    total,
    closed,
    inProgress,
    verificationPending,
    open,
    critical,
    major,
    minor,
    closedRate,
    effectivenessVerifiedCount,
    departmentsCount,
  };
}

/**
 * Helper to download CSV
 */
export function downloadCapaCsv(
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
 * Export official printable / PDF CAPA master register
 */
export function exportCapaSummaryPdf(
  capas: CapaItem[],
  scopeLabel: string = 'All Active CAPA Records'
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF report.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const exportConfig = getModuleExportConfig(pdfSettings, 'capa', 'register');
    const docCode = exportConfig.fullDocCode;
    const kpis = computeCapaKpis(capas);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      exportConfig.title,
      docCode,
      new Date().toISOString().split('T')[0],
      exportConfig.department
    );

    const rowsHtml = capas
      .map(
        (c, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="font-family:monospace; font-weight:700; color:#1e3a8a;">${c.capaNumber}</td>
          <td style="font-weight:600; color:#0f172a;">${c.issueTitle}</td>
          <td><span style="display:inline-block; padding:1px 6px; font-size:9px; font-weight:600; border-radius:4px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;">${c.source.replace(/_/g, ' ')}</span></td>
          <td style="color:#475569;">${c.department || 'QA General'}</td>
          <td>
            <span style="display:inline-block; padding:1px 6px; font-size:9px; font-weight:700; border-radius:4px; ${
              c.severity === 'CRITICAL'
                ? 'background:#fef2f2; color:#b91c1c; border:1px solid #fecaca;'
                : c.severity === 'MAJOR'
                ? 'background:#fffbeb; color:#b45309; border:1px solid #fde68a;'
                : 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;'
            }">
              ${c.severity || 'MAJOR'}
            </span>
          </td>
          <td style="color:#334155; font-size:9.5px;">${c.responsiblePerson}</td>
          <td style="color:#64748b; font-family:monospace; font-size:9px;">${c.targetCompletionDate}</td>
          <td style="color:#475569; font-size:9.5px; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.rootCause || '-'}</td>
          <td>
            <span style="display:inline-block; padding:1px 6px; font-size:9px; font-weight:700; border-radius:4px; ${
              c.status === 'CLOSED'
                ? 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;'
                : c.status === 'VERIFICATION_PENDING'
                ? 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;'
                : c.status === 'IN_PROGRESS'
                ? 'background:#fffbeb; color:#b45309; border:1px solid #fde68a;'
                : 'background:#fef2f2; color:#b91c1c; border:1px solid #fecaca;'
            }">
              ${c.status.replace(/_/g, ' ')}
            </span>
          </td>
        </tr>`
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CAPA Master Register - ${docCode}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a; margin: 0; padding: 14px; font-size: 11px; background: #fff;
            }
            .print-btn-bar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
            .print-btn { background: #1e3a8a; color: #fff; border: none; padding: 6px 14px; font-weight: 600; border-radius: 6px; cursor: pointer; font-size: 11px; }
            .print-btn:hover { background: #1d4ed8; }
            .kpi-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 12px 0 16px 0; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; text-align: center; }
            .kpi-lbl { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #64748b; }
            .kpi-val { font-size: 17px; font-weight: 800; color: #0f172a; margin-top: 2px; }
            .data-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
            .data-table th { background: #1e293b; color: #fff; padding: 6px 8px; text-align: left; border: 1px solid #0f172a; font-weight: 700; font-size: 9.5px; }
            .data-table td { padding: 5px 8px; border: 1px solid #e2e8f0; }
            .sign-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 26px; border-top: 1px solid #cbd5e1; padding-top: 14px; page-break-inside: avoid; }
            .sign-col { text-align: center; }
            .sign-line { border-bottom: 1.5px solid #475569; height: 26px; margin-bottom: 4px; }
            .sign-role { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #334155; }
            .sign-dept { font-size: 8px; color: #64748b; }
            @media print { .print-btn-bar { display: none !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="print-btn-bar">
            <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
            <button class="print-btn" style="background:#64748b;" onclick="window.close()">Close Window</button>
          </div>
          ${dynamicHeaderHtml}
          <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:6px 12px; border-radius:6px; font-size:10px; font-weight:600; color:#1e40af; margin-bottom:10px;">
            Export Scope: ${scopeLabel} • Record Count: ${capas.length} Files • Generated: ${new Date().toLocaleString()}
          </div>
          <div class="kpi-strip">
            <div class="kpi-card"><div class="kpi-lbl">Total CAPA Files</div><div class="kpi-val">${kpis.total}</div></div>
            <div class="kpi-card" style="background:#f0fdf4; border-color:#bbf7d0;"><div class="kpi-lbl" style="color:#166534;">Closed &amp; Verified</div><div class="kpi-val" style="color:#166534;">${kpis.closed}</div></div>
            <div class="kpi-card" style="background:#fffbeb; border-color:#fde68a;"><div class="kpi-lbl" style="color:#854d0e;">In Progress</div><div class="kpi-val" style="color:#854d0e;">${kpis.inProgress}</div></div>
            <div class="kpi-card" style="background:#fef2f2; border-color:#fecaca;"><div class="kpi-lbl" style="color:#991b1b;">Critical Priority</div><div class="kpi-val" style="color:#991b1b;">${kpis.critical}</div></div>
            <div class="kpi-card"><div class="kpi-lbl">Resolution Rate</div><div class="kpi-val">${kpis.closedRate}%</div></div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:11%;">CAPA Ref</th>
                <th style="width:24%;">Issue Title</th>
                <th style="width:12%;">Trigger Source</th>
                <th style="width:11%;">Department</th>
                <th style="width:8%;">Severity</th>
                <th style="width:11%;">Lead</th>
                <th style="width:9%;">Target Date</th>
                <th style="width:14%;">Identified Root Cause</th>
                <th style="width:10%;">8D Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="sign-strip">
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">CAPA Coordinator</div><div class="sign-dept">Quality Assurance DGM</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Responsible Lead</div><div class="sign-dept">Department In-Charge</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Quality Head (QMS)</div><div class="sign-dept">Quality Assurance Head</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">General Manager</div><div class="sign-dept">Factory Operations</div></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export CAPA register PDF:', err);
  }
}

/**
 * Export CAPA master register as styled Excel workbook (.xls)
 */
export function exportCapaSummaryExcel(
  capas: CapaItem[],
  scopeLabel: string = 'All Active CAPA Records'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const kpis = computeCapaKpis(capas);
    const companyName = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';

    const rowsHtml = capas
      .map(
        (c, idx) => `
        <tr>
          <td style="font-weight:bold; color:#1e3a8a; border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.capaNumber}</td>
          <td style="font-weight:600; border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.issueTitle}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.source}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.department || 'QA'}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; font-weight:bold; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.severity || 'MAJOR'}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.responsiblePerson}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.targetCompletionDate}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.rootCause || '-'}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; font-weight:bold; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.status}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.effectivenessVerified ? 'YES' : 'NO'}</td>
        </tr>`
      )
      .join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0f172a; }
            table { border-collapse: collapse; }
          </style>
        </head>
        <body>
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr><td colspan="10" style="font-size:16pt; font-weight:bold; color:#1e3a8a; padding:8px 0;">${companyName}</td></tr>
            <tr><td colspan="10" style="font-size:12pt; font-weight:bold; color:#0f172a;">CAPA 8D Corrective &amp; Preventive Action Master Register</td></tr>
            <tr><td colspan="10" style="font-size:9pt; color:#64748b; padding-bottom:8px;">Scope: ${scopeLabel} | Total: ${capas.length} Files | Generated: ${new Date().toLocaleString()}</td></tr>
          </table>
          <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
            <tr>
              <td colspan="2" style="background:#eff6ff; border:1px solid #93c5fd; padding:8px; text-align:center;"><div style="font-size:9pt; color:#1e40af;">Total CAPA</div><div style="font-size:14pt; font-weight:bold; color:#1e3a8a;">${kpis.total}</div></td>
              <td colspan="2" style="background:#ecfdf5; border:1px solid #86efac; padding:8px; text-align:center;"><div style="font-size:9pt; color:#065f46;">Closed &amp; Verified</div><div style="font-size:14pt; font-weight:bold; color:#047857;">${kpis.closed}</div></td>
              <td colspan="2" style="background:#fffbeb; border:1px solid #fde68a; padding:8px; text-align:center;"><div style="font-size:9pt; color:#92400e;">In Progress</div><div style="font-size:14pt; font-weight:bold; color:#b45309;">${kpis.inProgress}</div></td>
              <td colspan="2" style="background:#fef2f2; border:1px solid #fca5a5; padding:8px; text-align:center;"><div style="font-size:9pt; color:#991b1b;">Critical</div><div style="font-size:14pt; font-weight:bold; color:#dc2626;">${kpis.critical}</div></td>
              <td colspan="2" style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; text-align:center;"><div style="font-size:9pt; color:#334155;">Resolution Rate</div><div style="font-size:14pt; font-weight:bold; color:#1e293b;">${kpis.closedRate}%</div></td>
            </tr>
          </table>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background:#1e293b; color:#ffffff;">
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">CAPA Ref</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Issue Title</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Source</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Department</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Severity</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Responsible Lead</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Target Date</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Root Cause</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Status</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Verified</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `capa_master_register_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export CAPA register Excel:', err);
  }
}

/**
 * Export single CAPA 8D resolution report as official printable / PDF
 */
export function exportSingleCapaPdf(capa: CapaItem): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable report.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const exportConfig = getModuleExportConfig(pdfSettings, 'capa', 'single', capa.capaNumber);
    const docCode = exportConfig.fullDocCode;

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      `${exportConfig.title}: ${capa.capaNumber}`,
      docCode,
      capa.dateRaised || new Date().toISOString().split('T')[0],
      `${exportConfig.department} • ISO 9001:2015 Clause 10.2`
    );

    const fiveWhysHtml = capa.fiveWhys
      ? `
      <div class="box-card" style="background:#f8fafc; border-left:4px solid #3b82f6; margin-top:8px;">
        <div class="box-title" style="color:#1d4ed8;">5-Whys Iterative Root Cause Breakdown</div>
        <ol style="margin:4px 0 0 16px; padding:0; line-height:1.6;">
          ${capa.fiveWhys.why1 ? `<li><strong>Why 1:</strong> ${capa.fiveWhys.why1}</li>` : ''}
          ${capa.fiveWhys.why2 ? `<li><strong>Why 2:</strong> ${capa.fiveWhys.why2}</li>` : ''}
          ${capa.fiveWhys.why3 ? `<li><strong>Why 3:</strong> ${capa.fiveWhys.why3}</li>` : ''}
          ${capa.fiveWhys.why4 ? `<li><strong>Why 4:</strong> ${capa.fiveWhys.why4}</li>` : ''}
          ${capa.fiveWhys.why5 ? `<li><strong>Why 5 (Root):</strong> ${capa.fiveWhys.why5}</li>` : ''}
        </ol>
      </div>`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${capa.capaNumber} - CAPA 8D Report</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a; margin: 0; padding: 14px; font-size: 11px; background: #fff;
            }
            .print-btn-bar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
            .print-btn { background: #1e3a8a; color: #fff; border: none; padding: 6px 14px; font-weight: 600; border-radius: 6px; cursor: pointer; font-size: 11px; }
            .print-btn:hover { background: #1d4ed8; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin: 12px 0; }
            .meta-item { font-size: 10px; }
            .meta-lbl { font-weight: 600; color: #475569; }
            .meta-val { font-weight: 700; color: #0f172a; margin-left: 4px; }
            .badge { display: inline-block; padding: 1px 6px; font-size: 9px; font-weight: 700; border-radius: 4px; }
            .step-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; }
            .step-title { font-size: 11px; font-weight: 700; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
            .box-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; }
            .box-title { font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
            .sign-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 14px; page-break-inside: avoid; }
            .sign-col { text-align: center; }
            .sign-line { border-bottom: 1.5px solid #475569; height: 26px; margin-bottom: 4px; }
            .sign-role { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #334155; }
            .sign-dept { font-size: 8px; color: #64748b; }
            @media print { .print-btn-bar { display: none !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="print-btn-bar">
            <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
            <button class="print-btn" style="background:#64748b;" onclick="window.close()">Close Window</button>
          </div>
          ${dynamicHeaderHtml}

          <div class="meta-grid">
            <div class="meta-item"><span class="meta-lbl">CAPA Ref:</span><span class="meta-val font-mono">${capa.capaNumber}</span></div>
            <div class="meta-item"><span class="meta-lbl">Date Raised:</span><span class="meta-val">${capa.dateRaised || 'N/A'}</span></div>
            <div class="meta-item"><span class="meta-lbl">Trigger Source:</span><span class="meta-val">${capa.source.replace(/_/g, ' ')}</span></div>
            <div class="meta-item"><span class="meta-lbl">Department:</span><span class="meta-val">${capa.department || 'QA'}</span></div>
            <div class="meta-item"><span class="meta-lbl">Severity:</span><span class="badge ${capa.severity === 'CRITICAL' ? 'style="background:#fef2f2; color:#b91c1c;"' : 'style="background:#eff6ff; color:#1d4ed8;"'}">${capa.severity || 'MAJOR'}</span></div>
            <div class="meta-item"><span class="meta-lbl">Responsible Lead:</span><span class="meta-val">${capa.responsiblePerson}</span></div>
            <div class="meta-item"><span class="meta-lbl">Target Date:</span><span class="meta-val">${capa.targetCompletionDate}</span></div>
            <div class="meta-item"><span class="meta-lbl">8D Status:</span><span class="badge ${capa.status === 'CLOSED' ? 'style="background:#ecfdf5; color:#047857;"' : 'style="background:#fffbeb; color:#b45309;"'}">${capa.status.replace(/_/g, ' ')}</span></div>
          </div>

          <!-- D1 & D2: Problem Statement -->
          <div class="step-box" style="border-left:4px solid #ef4444; background:#fef2f2;">
            <div class="step-title" style="color:#b91c1c;">
              <span>D1-D2. Problem Definition &amp; Non-Conformance Statement</span>
              <span style="font-size:9.5px; font-weight:600;">Raised By: ${capa.raisedBy || 'QMS Lead'}</span>
            </div>
            <div style="font-weight:700; font-size:11.5px; color:#0f172a; margin-bottom:4px;">${capa.issueTitle}</div>
            <div style="color:#475569; line-height:1.5;">${capa.problemDescription || capa.problemStatement || 'No extended statement provided.'}</div>
          </div>

          <!-- D3: Containment Action -->
          <div class="step-box" style="border-left:4px solid #f59e0b; background:#fffbeb;">
            <div class="step-title" style="color:#b45309;">
              <span>D3. Immediate Containment Action (Stop-the-Bleeding)</span>
              <span style="font-size:9.5px; font-weight:600;">Date: ${capa.containmentDate || 'Immediate'}</span>
            </div>
            <div style="color:#475569; line-height:1.5;">${capa.containmentAction || 'No containment recorded.'}</div>
          </div>

          <!-- D4: Root Cause Analysis -->
          <div class="step-box" style="border-left:4px solid #3b82f6; background:#eff6ff;">
            <div class="step-title" style="color:#1d4ed8;">
              <span>D4. Root Cause Analysis (RCA Verification)</span>
            </div>
            <div style="font-weight:600; color:#0f172a; margin-bottom:4px;">Core Finding: ${capa.rootCause}</div>
            ${fiveWhysHtml}
          </div>

          <!-- D5 & D6: Permanent Corrective Action -->
          <div class="step-box" style="border-left:4px solid #10b981; background:#f0fdf4;">
            <div class="step-title" style="color:#047857;">
              <span>D5-D6. Permanent Corrective Action (PCA Implementation)</span>
            </div>
            <div style="color:#475569; line-height:1.5;">${capa.correctiveAction || 'Corrective action plan underway.'}</div>
          </div>

          <!-- D7: Preventive Action & Standardization -->
          <div class="step-box" style="border-left:4px solid #8b5cf6; background:#faf5ff;">
            <div class="step-title" style="color:#6d28d9;">
              <span>D7. Preventive Action &amp; Systemic Standardization</span>
            </div>
            <div style="color:#475569; line-height:1.5; margin-bottom:6px;">${capa.preventiveAction || 'Preventive measures documented in SOP.'}</div>
            <div style="display:flex; gap:16px; font-size:10px; color:#475569; border-top:1px dashed #d8b4fe; padding-top:4px;">
              <span>SOP Update: <strong>${capa.sopUpdateRequired ? 'YES (' + (capa.sopReference || 'Standard SOP') + ')' : 'NO'}</strong></span>
              <span>Operator Training: <strong>${capa.trainingRequired ? 'YES (' + (capa.trainingDetails || 'Re-training completed') + ')' : 'NO'}</strong></span>
            </div>
          </div>

          <!-- D8: Verification of Effectiveness -->
          <div class="step-box" style="border-left:4px solid #059669; background:#ecfdf5;">
            <div class="step-title" style="color:#065f46;">
              <span>D8. Verification of Effectiveness &amp; Team Recognition</span>
              <span style="font-size:9.5px; font-weight:700;">Status: ${capa.effectivenessRating || (capa.effectivenessVerified ? 'EFFECTIVE' : 'PENDING')}</span>
            </div>
            <div style="color:#475569; line-height:1.5;">
              ${capa.verificationNotes || (capa.effectivenessVerified ? 'Corrective actions verified on floor with zero reoccurrence across subsequent production batches.' : 'Post-implementation verification pending.')}
            </div>
            <div style="font-size:9.5px; color:#64748b; margin-top:4px;">
              Verified By: <strong>${capa.verifiedBy || 'Quality Assurance Lead'}</strong> &bull; Verification Date: <strong>${capa.verificationDate || capa.actualCompletionDate || 'Pending'}</strong>
            </div>
          </div>

          <div class="sign-strip">
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Investigation Lead</div><div class="sign-dept">${capa.responsiblePerson}</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Floor / Production Head</div><div class="sign-dept">${capa.department || 'Operations'}</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Quality Assurance Manager</div><div class="sign-dept">Quality Compliance</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Factory General Manager</div><div class="sign-dept">Operations &amp; Executive</div></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export single CAPA PDF:', err);
  }
}

/**
 * Export single CAPA 8D report to styled Excel workbook (.xls)
 */
export function exportSingleCapaExcel(capa: CapaItem): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const companyName = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0f172a; }
            table { border-collapse: collapse; }
          </style>
        </head>
        <body>
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr><td colspan="4" style="font-size:16pt; font-weight:bold; color:#1e3a8a; padding:8px 0;">${companyName}</td></tr>
            <tr><td colspan="4" style="font-size:13pt; font-weight:bold; color:#0f172a;">8D CAPA Resolution Record: ${capa.capaNumber}</td></tr>
            <tr><td colspan="4" style="font-size:9pt; color:#64748b; padding-bottom:8px;">ISO 9001:2015 Clause 10.2 | Generated: ${new Date().toLocaleString()}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#f1f5f9;">
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; width:20%;">CAPA Ref:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; width:30%; font-family:monospace; font-weight:bold; color:#1e3a8a;">${capa.capaNumber}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; width:20%;">Date Raised:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; width:30%;">${capa.dateRaised || 'N/A'}</td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Trigger Source:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${capa.source}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Department:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${capa.department || 'QA'}</td>
            </tr>
            <tr style="background:#f1f5f9;">
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Severity:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; color:${capa.severity === 'CRITICAL' ? '#b91c1c' : '#1d4ed8'};">${capa.severity || 'MAJOR'}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">8D Status:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${capa.status}</td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Responsible Lead:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${capa.responsiblePerson}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Target Completion:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${capa.targetCompletionDate}</td>
            </tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">D1-D2. Problem Definition &amp; Non-Conformance</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px; font-weight:bold; background:#f8fafc;">${capa.issueTitle}</td></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${capa.problemDescription || capa.problemStatement || '-'}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">D3. Containment Action</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${capa.containmentAction || '-'}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">D4. Root Cause Analysis (5-Whys)</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px; font-weight:bold; background:#f8fafc;">Core Cause: ${capa.rootCause}</td></tr>
            ${capa.fiveWhys?.why1 ? `<tr><td style="border:1px solid #cbd5e1; padding:5px; font-weight:bold; width:15%;">Why 1:</td><td colspan="3" style="border:1px solid #cbd5e1; padding:5px;">${capa.fiveWhys.why1}</td></tr>` : ''}
            ${capa.fiveWhys?.why2 ? `<tr><td style="border:1px solid #cbd5e1; padding:5px; font-weight:bold; width:15%;">Why 2:</td><td colspan="3" style="border:1px solid #cbd5e1; padding:5px;">${capa.fiveWhys.why2}</td></tr>` : ''}
            ${capa.fiveWhys?.why3 ? `<tr><td style="border:1px solid #cbd5e1; padding:5px; font-weight:bold; width:15%;">Why 3:</td><td colspan="3" style="border:1px solid #cbd5e1; padding:5px;">${capa.fiveWhys.why3}</td></tr>` : ''}
            ${capa.fiveWhys?.why4 ? `<tr><td style="border:1px solid #cbd5e1; padding:5px; font-weight:bold; width:15%;">Why 4:</td><td colspan="3" style="border:1px solid #cbd5e1; padding:5px;">${capa.fiveWhys.why4}</td></tr>` : ''}
            ${capa.fiveWhys?.why5 ? `<tr><td style="border:1px solid #cbd5e1; padding:5px; font-weight:bold; width:15%;">Why 5 (Root):</td><td colspan="3" style="border:1px solid #cbd5e1; padding:5px;">${capa.fiveWhys.why5}</td></tr>` : ''}
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">D5-D6. Permanent Corrective Action</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${capa.correctiveAction || '-'}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">D7. Preventive Action &amp; Standardization</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${capa.preventiveAction || '-'}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">D8. Verification of Effectiveness</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${capa.verificationNotes || (capa.effectivenessVerified ? 'Effectiveness verified with zero defects across subsequent lots.' : 'Pending')}</td></tr>
            <tr style="background:#f1f5f9;">
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Verified By:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${capa.verifiedBy || 'QA Team'}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Verification Date:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${capa.verificationDate || capa.actualCompletionDate || 'Pending'}</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${capa.capaNumber}_8D_Resolution_Report.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export single CAPA Excel:', err);
  }
}
