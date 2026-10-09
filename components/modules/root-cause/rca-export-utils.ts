import { RootCauseCase } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Root Cause Analysis (RCA) module
 */
export function computeRcaKpis(cases: RootCauseCase[]) {
  const total = cases.length;
  const closed = cases.filter((c) => c.status === 'VERIFIED_CLOSED' || c.status === 'COMPLETED').length;
  const investigating = cases.filter((c) => c.status === 'INVESTIGATING').length;
  const rootCauseIsolated = cases.filter(
    (c) => c.status === 'ROOT_CAUSE_IDENTIFIED' || c.status === 'CAPA_ASSIGNED'
  ).length;
  const criticalCount = cases.filter((c) => c.severity === 'CRITICAL').length;
  const closureRate = total > 0 ? Math.round((closed / total) * 100) : 0;

  return {
    total,
    closed,
    investigating,
    rootCauseIsolated,
    criticalCount,
    closureRate,
  };
}

/**
 * Download RCA CSV
 */
export function downloadRcaCsv(
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
 * Export Global RCA Master Register PDF
 */
export function exportRcaRegisterPdf(
  cases: RootCauseCase[],
  scopeLabel: string = 'All RCA Cases'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeRcaKpis(cases);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'rca', 'register');
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
      case 'VERIFIED_CLOSED':
      case 'COMPLETED':
        return '#15803d';
      case 'CAPA_ASSIGNED':
        return '#7e22ce';
      case 'ROOT_CAUSE_IDENTIFIED':
        return '#b45309';
      case 'INVESTIGATING':
        return '#0284c7';
      default:
        return '#475569';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'VERIFIED_CLOSED':
      case 'COMPLETED':
        return '#dcfce7';
      case 'CAPA_ASSIGNED':
        return '#f3e8ff';
      case 'ROOT_CAUSE_IDENTIFIED':
        return '#fef3c7';
      case 'INVESTIGATING':
        return '#e0f2fe';
      default:
        return '#f1f5f9';
    }
  };

  const getSeverityColor = (sev?: string) => {
    switch (sev) {
      case 'CRITICAL':
        return '#be123c';
      case 'MAJOR':
        return '#b45309';
      case 'MINOR':
        return '#1d4ed8';
      default:
        return '#475569';
    }
  };

  const rowsHtml = cases
    .map(
      (c, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="font-family: monospace; font-weight: 700; color: #1e293b; text-align: center;">${i + 1}</td>
        <td style="font-family: monospace; font-weight: 700; color: #0284c7;">${c.caseCode}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${c.problemTitle}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
            ${c.styleAffected ? `Style: ${c.styleAffected} • ` : ''}${c.buyer ? `Buyer: ${c.buyer}` : ''}
          </div>
        </td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; color: ${getSeverityColor(c.severity)}; background-color: #f8fafc; border: 1px solid #e2e8f0;">
            ${c.severity || 'MAJOR'}
          </span>
        </td>
        <td style="font-size: 10px; color: #475569;">${c.department || 'Production'}</td>
        <td style="font-size: 10px; color: #475569;">${c.occurredLocation}</td>
        <td style="font-size: 10px; font-weight: 600; color: #1e293b;">${c.investigationLead || 'Quality Lead'}</td>
        <td style="font-size: 9.5px; color: #334155;">
          ${(c.finalRootCause || 'Under investigation').slice(0, 65)}${(c.finalRootCause || '').length > 65 ? '...' : ''}
        </td>
        <td style="font-family: monospace; font-size: 9.5px; color: #334155;">${c.targetClosureDate || c.createdDate}</td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 700; color: ${getStatusColor(c.status)}; background-color: ${getStatusBg(c.status)};">
            ${c.status.replace(/_/g, ' ')}
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
        <title>RCA Master Register - ${docCode}</title>
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
            <div class="kpi-label">RCA Cases</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #15803d;">
            <div class="kpi-val" style="color: #15803d;">${kpis.closed}</div>
            <div class="kpi-label">Closed & Verified</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #b45309;">
            <div class="kpi-val" style="color: #b45309;">${kpis.rootCauseIsolated}</div>
            <div class="kpi-label">Cause Isolated</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #0284c7;">
            <div class="kpi-val" style="color: #0284c7;">${kpis.investigating}</div>
            <div class="kpi-label">Investigating</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #be123c;">
            <div class="kpi-val" style="color: #be123c;">${kpis.criticalCount}</div>
            <div class="kpi-label">Critical Severity</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #059669;">${kpis.closureRate}%</div>
            <div class="kpi-label">Closure Rate</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 28px; text-align: center;">#</th>
              <th style="width: 80px;">Case Code</th>
              <th>Problem Title & Context</th>
              <th style="width: 65px; text-align: center;">Severity</th>
              <th style="width: 95px;">Department</th>
              <th style="width: 95px;">Location</th>
              <th style="width: 105px;">Investigation Lead</th>
              <th>Root Cause Summary</th>
              <th style="width: 80px;">Target Date</th>
              <th style="width: 95px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-title">Lead Investigator</div>
            <div class="sign-sub">Root Cause Analysis Lead</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">QA Operations Manager</div>
            <div class="sign-sub">Technical Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Head of Production</div>
            <div class="sign-sub">CAPA Implementation Approval</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Buyer Quality Representative</div>
            <div class="sign-sub">Audit Review & Acceptance</div>
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
 * Export RCA Register Excel (.xls)
 */
export function exportRcaRegisterExcel(
  cases: RootCauseCase[],
  scopeLabel: string = 'All RCA Cases'
): void {
  const kpis = computeRcaKpis(cases);
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.rcaRegister || 'RCA-REG'}`;
  const fileName = `RCA_Master_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = cases
    .map(
      (c, i) => `
    <tr>
      <td style="text-align: center;">${i + 1}</td>
      <td style="font-weight: bold; font-family: monospace; color: #0369a1;">${c.caseCode}</td>
      <td style="font-weight: bold;">${c.problemTitle}</td>
      <td style="font-weight: bold; text-align: center; ${
        c.severity === 'CRITICAL' ? 'color: #be123c;' : c.severity === 'MAJOR' ? 'color: #b45309;' : 'color: #1d4ed8;'
      }">${c.severity || 'MAJOR'}</td>
      <td>${c.styleAffected || ''}</td>
      <td>${c.buyer || ''}</td>
      <td>${c.orderNumber || ''}</td>
      <td>${c.department || ''}</td>
      <td>${c.occurredLocation}</td>
      <td>${c.investigationLead || ''}</td>
      <td>${c.finalRootCause}</td>
      <td>${c.containmentAction || ''}</td>
      <td>${c.correctiveAction || ''}</td>
      <td>${c.preventiveAction || ''}</td>
      <td>${c.createdDate}</td>
      <td>${c.targetClosureDate || ''}</td>
      <td>${c.actualClosureDate || ''}</td>
      <td style="font-weight: bold; text-align: center;">${c.status}</td>
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
                <x:Name>RCA Register</x:Name>
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
            <td colspan="18" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="18" style="font-size: 12pt; font-weight: bold;">
              ROOT CAUSE ANALYSIS (RCA) MASTER INVESTIGATION REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="18" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Scope: ${scopeLabel} | Total Cases: ${kpis.total} | Closed: ${kpis.closed} | Rate: ${kpis.closureRate}% | Date: ${new Date().toISOString().slice(0, 10)}
            </td>
          </tr>
          <tr><td colspan="18"></td></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>Case Code</th>
            <th>Problem Title</th>
            <th>Severity</th>
            <th>Style</th>
            <th>Buyer</th>
            <th>Order #</th>
            <th>Department</th>
            <th>Location</th>
            <th>Investigator</th>
            <th>Final Root Cause</th>
            <th>Containment Action</th>
            <th>Corrective Action</th>
            <th>Preventive Action</th>
            <th>Created Date</th>
            <th>Target Closure</th>
            <th>Actual Closure</th>
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
 * Export Individual RCA Case Dossier PDF
 */
export function exportSingleRcaPdf(rcaCase: RootCauseCase): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'rca', 'single', rcaCase.caseCode);
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const whys = rcaCase.fiveWhys || {
    why1: 'Initial operational deviation detected during line QC check.',
    why2: 'Tool / machine parameters shifted beyond certified tolerances.',
    why3: 'Operator did not verify golden sample calibration before run.',
    why4: 'Lack of automated inline sensor verification at start-of-shift.',
    why5: 'Absence of fail-safe interlocking checklist protocol.',
  };

  const fishbone = rcaCase.fishboneFactors || {
    man: ['Operator fatigue', 'Skill variance'],
    machine: ['Tension variance', 'Needle deflection'],
    material: ['GSM variation', 'Yarn elongation'],
    method: ['Incorrect feed rate', 'Skip check'],
    measurement: ['Gauge calibration due', 'Lighting issue'],
    milieu: ['Ambient humidity', 'Static charge'],
  };

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>RCA Investigation Report - ${rcaCase.caseCode}</title>
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
            border-left: 6px solid #8b5cf6;
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
            background: #8b5cf6;
          }
          .section-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 4px;
            margin-top: 14px;
            margin-bottom: 10px;
          }
          .data-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 12px;
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
          .whys-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 12px;
          }
          .why-item {
            display: flex;
            gap: 8px;
            padding: 6px 10px;
            border-radius: 6px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            font-size: 10.5px;
          }
          .why-num {
            font-weight: 800;
            font-family: monospace;
            color: #8b5cf6;
            min-width: 55px;
          }
          .fishbone-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          }
          .fish-col {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px;
            background: #f8fafc;
          }
          .fish-head {
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
            color: #1e293b;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-bottom: 4px;
          }
          .fish-item {
            font-size: 9.5px;
            color: #475569;
            margin-bottom: 2px;
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
              8D Problem Elimination Dossier • Doc Code: ${docCode}
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace;">
              ${rcaCase.caseCode} - ${rcaCase.problemTitle}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              Style: <strong>${rcaCase.styleAffected}</strong> • Location: <strong>${rcaCase.occurredLocation}</strong> • Department: <strong>${rcaCase.department || 'Garment Assembly'}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="status-badge">${rcaCase.status.replace(/_/g, ' ')}</div>
            <div style="font-size: 10.5px; color: #64748b; margin-top: 4px; font-weight: 600;">
              Target Closure: <strong style="color: #0f172a;">${rcaCase.targetClosureDate || rcaCase.createdDate}</strong>
            </div>
          </div>
        </div>

        <div class="section-title">1. Incident Context & Investigation Parameters</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">RCA Case Code:</span>
            <span class="data-value" style="font-family: monospace; font-weight: 700; color: #8b5cf6;">${rcaCase.caseCode}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Severity Level:</span>
            <span class="data-value" style="font-weight: 700; color: ${rcaCase.severity === 'CRITICAL' ? '#be123c' : '#b45309'};">${rcaCase.severity || 'MAJOR'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Lead Investigator:</span>
            <span class="data-value" style="font-weight: 700;">${rcaCase.investigationLead || 'Quality Specialist'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Created / Detected Date:</span>
            <span class="data-value" style="font-family: monospace;">${rcaCase.createdDate}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Buyer / Customer:</span>
            <span class="data-value">${rcaCase.buyer || 'Standard Buyer Account'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Production Order Number:</span>
            <span class="data-value" style="font-family: monospace;">${rcaCase.orderNumber || 'PO-PROD-LIVE'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Linked Defect Code:</span>
            <span class="data-value" style="font-family: monospace;">${rcaCase.linkedDefectCode || 'DEF-SEW-004'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Associated CAPA Plan ID:</span>
            <span class="data-value" style="font-family: monospace;">${rcaCase.linkedCapaId || 'CAPA-2026-LIVE'}</span>
          </div>
        </div>

        <div class="card-box" style="border-left: 4px solid #f59e0b;">
          <div class="card-title">D1 / D2: Immediate Containment Action Taken</div>
          <div class="card-body">${rcaCase.containmentAction || 'Quarantined 2,400 affected pieces at line end; 100% sorting audit executed; recalibrated machine tension.'}</div>
        </div>

        <div class="section-title">2. 5-Why Problem Tree Analysis</div>
        <div class="whys-container">
          <div class="why-item">
            <span class="why-num">1. Why:</span>
            <span>${whys.why1}</span>
          </div>
          <div class="why-item">
            <span class="why-num">2. Why:</span>
            <span>${whys.why2}</span>
          </div>
          <div class="why-item">
            <span class="why-num">3. Why:</span>
            <span>${whys.why3}</span>
          </div>
          <div class="why-item">
            <span class="why-num">4. Why:</span>
            <span>${whys.why4}</span>
          </div>
          <div class="why-item" style="border-left: 3px solid #be123c; background: #fff1f2;">
            <span class="why-num" style="color: #be123c;">5. ROOT:</span>
            <span style="font-weight: 700; color: #9f1239;">${whys.why5}</span>
          </div>
        </div>

        <div class="section-title">3. Ishikawa 6M Fishbone Factors</div>
        <div class="fishbone-grid">
          <div class="fish-col">
            <div class="fish-head">1. Man (Operator / Skills)</div>
            ${(fishbone.man || ['Operator training variance']).map((f) => `<div class="fish-item">• ${f}</div>`).join('')}
          </div>
          <div class="fish-col">
            <div class="fish-head">2. Machine (Equipment / Tooling)</div>
            ${(fishbone.machine || ['Tension gauge deviation']).map((f) => `<div class="fish-item">• ${f}</div>`).join('')}
          </div>
          <div class="fish-col">
            <div class="fish-head">3. Material (Fabric / Trims)</div>
            ${(fishbone.material || ['Yarn tensile variation']).map((f) => `<div class="fish-item">• ${f}</div>`).join('')}
          </div>
          <div class="fish-col">
            <div class="fish-head">4. Method (Procedure / SOP)</div>
            ${(fishbone.method || ['Feed rate calibration']).map((f) => `<div class="fish-item">• ${f}</div>`).join('')}
          </div>
          <div class="fish-col">
            <div class="fish-head">5. Measurement (Quality Gauges)</div>
            ${(fishbone.measurement || ['Lighting & visual angle']).map((f) => `<div class="fish-item">• ${f}</div>`).join('')}
          </div>
          <div class="fish-col">
            <div class="fish-head">6. Milieu (Environment)</div>
            ${(fishbone.milieu || ['Ambient moisture']).map((f) => `<div class="fish-item">• ${f}</div>`).join('')}
          </div>
        </div>

        <div class="section-title">4. Isolated Root Cause & Corrective Actions (CAPA)</div>
        <div class="card-box" style="border-left: 4px solid #be123c; background: #fff1f2;">
          <div class="card-title" style="color: #9f1239;">Final Isolated Root Cause</div>
          <div class="card-body" style="font-weight: 700; color: #881337;">${rcaCase.finalRootCause}</div>
        </div>

        <div class="card-box" style="border-left: 4px solid #10b981;">
          <div class="card-title" style="color: #065f46;">Corrective Action Plan</div>
          <div class="card-body">${rcaCase.correctiveAction || 'Replaced dull feed components, re-calibrated tensioning servo motors, and executed 100% rework verification.'}</div>
        </div>

        <div class="card-box" style="border-left: 4px solid #3b82f6;">
          <div class="card-title" style="color: #1e40af;">Preventive Action Plan (Poke-Yoke / Systemic)</div>
          <div class="card-body">${rcaCase.preventiveAction || 'Instituted shift-start digital verification checks; integrated optical sensor stop-motion into line automation.'}</div>
        </div>

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-title">Investigation Lead</div>
            <div class="sign-sub">Analysis & Problem Solving</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">QA Operations Manager</div>
            <div class="sign-sub">CAPA Mandate & Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Operations Director</div>
            <div class="sign-sub">Executive Closure & Sign-off</div>
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
 * Export Individual RCA Case Excel (.xls)
 */
export function exportSingleRcaExcel(rcaCase: RootCauseCase): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.rcaDossier || 'RCA-8D'}`;
  const fileName = `RCA_Investigation_${rcaCase.caseCode}_${new Date().toISOString().slice(0, 10)}.xls`;

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>RCA Dossier</x:Name>
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
              8D ROOT CAUSE INVESTIGATION & PROBLEM SOLVING REPORT
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Case Code: ${rcaCase.caseCode} | Date: ${new Date().toISOString().slice(0, 10)}
            </td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">1. INCIDENT PROFILE</th></tr>
          <tr><td><strong>Case Code:</strong></td><td>${rcaCase.caseCode}</td><td><strong>Severity:</strong></td><td>${rcaCase.severity || 'MAJOR'}</td></tr>
          <tr><td><strong>Problem Title:</strong></td><td colspan="3">${rcaCase.problemTitle}</td></tr>
          <tr><td><strong>Style:</strong></td><td>${rcaCase.styleAffected}</td><td><strong>Buyer:</strong></td><td>${rcaCase.buyer || ''}</td></tr>
          <tr><td><strong>Department:</strong></td><td>${rcaCase.department || ''}</td><td><strong>Location:</strong></td><td>${rcaCase.occurredLocation}</td></tr>
          <tr><td><strong>Investigator:</strong></td><td>${rcaCase.investigationLead || ''}</td><td><strong>Status:</strong></td><td>${rcaCase.status}</td></tr>
          <tr><td><strong>Containment Action:</strong></td><td colspan="3">${rcaCase.containmentAction || ''}</td></tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">2. 5-WHY ANALYSIS</th></tr>
          <tr><td><strong>Why 1:</strong></td><td colspan="3">${rcaCase.fiveWhys?.why1 || ''}</td></tr>
          <tr><td><strong>Why 2:</strong></td><td colspan="3">${rcaCase.fiveWhys?.why2 || ''}</td></tr>
          <tr><td><strong>Why 3:</strong></td><td colspan="3">${rcaCase.fiveWhys?.why3 || ''}</td></tr>
          <tr><td><strong>Why 4:</strong></td><td colspan="3">${rcaCase.fiveWhys?.why4 || ''}</td></tr>
          <tr><td><strong>Why 5 (Root Cause):</strong></td><td colspan="3" style="font-weight: bold; color: #be123c;">${rcaCase.fiveWhys?.why5 || rcaCase.finalRootCause}</td></tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">3. RESOLUTION & CAPA</th></tr>
          <tr><td><strong>Final Root Cause:</strong></td><td colspan="3" style="font-weight: bold;">${rcaCase.finalRootCause}</td></tr>
          <tr><td><strong>Corrective Action:</strong></td><td colspan="3">${rcaCase.correctiveAction || ''}</td></tr>
          <tr><td><strong>Preventive Action:</strong></td><td colspan="3">${rcaCase.preventiveAction || ''}</td></tr>
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
