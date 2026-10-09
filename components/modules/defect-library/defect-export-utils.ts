import { DefectDefinition } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Defects Library
 */
export function computeDefectKpis(defects: DefectDefinition[]) {
  const total = defects.length;
  const critical = defects.filter((d) => d.severity === 'CRITICAL').length;
  const major = defects.filter((d) => d.severity === 'MAJOR').length;
  const minor = defects.filter((d) => d.severity === 'MINOR').length;
  const active = defects.filter((d) => !d.status || d.status === 'ACTIVE').length;
  const departments = new Set(defects.map((d) => d.responsibleDepartment).filter(Boolean)).size;
  const categories = new Set(defects.map((d) => d.category).filter(Boolean)).size;

  return {
    total,
    critical,
    major,
    minor,
    active,
    departments,
    categories,
  };
}

/**
 * Download Defect CSV
 */
export function downloadDefectCsv(
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
 * Export Global Defect Catalog PDF
 */
export function exportDefectCatalogPdf(
  defects: DefectDefinition[],
  scopeLabel: string = 'All Defects'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeDefectKpis(defects);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'defect_library', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;
  const printDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const getSeverityColor = (sev: string) => {
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

  const getSeverityBg = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return '#ffe4e6';
      case 'MAJOR':
        return '#fef3c7';
      case 'MINOR':
        return '#dbeafe';
      default:
        return '#f1f5f9';
    }
  };

  const formatZone = (zone: string) => {
    if (!zone) return 'General';
    if (zone.includes('ZONE_A')) return 'Zone A (Front/Prominent)';
    if (zone.includes('ZONE_B')) return 'Zone B (Side/Back)';
    if (zone.includes('ZONE_C')) return 'Zone C (Inside/Hidden)';
    return zone.replace(/_/g, ' ');
  };

  const rowsHtml = defects
    .map(
      (d, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="font-family: monospace; font-weight: 700; color: #1e293b; text-align: center;">${i + 1}</td>
        <td style="font-family: monospace; font-weight: 700; color: #0284c7;">${d.defectCode}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${d.name}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${(d.description || '').slice(0, 75)}${(d.description || '').length > 75 ? '...' : ''}</div>
        </td>
        <td style="font-size: 10px; font-weight: 600; color: #334155; text-transform: uppercase;">${(d.category || '').replace(/_/g, ' ')}</td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9.5px; font-weight: 700; color: ${getSeverityColor(d.severity)}; background-color: ${getSeverityBg(d.severity)};">
            ${d.severity}
          </span>
        </td>
        <td style="font-size: 10px; color: #334155;">${formatZone(d.zone)}</td>
        <td style="font-size: 10px; color: #475569;">${d.responsibleDepartment || 'Garment Production'}</td>
        <td style="font-size: 10px; color: #475569;">${d.inspectionCheckpoint || 'End of Line'}</td>
        <td style="font-size: 9.5px; font-family: monospace; color: #64748b;">${d.isoStandard || 'ISO 9001 / AQL'}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Defects Catalog Register - ${docCode}</title>
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
            <div class="kpi-label">Total Defects</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #be123c;">
            <div class="kpi-val" style="color: #be123c;">${kpis.critical}</div>
            <div class="kpi-label">Critical Defects</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #b45309;">
            <div class="kpi-val" style="color: #b45309;">${kpis.major}</div>
            <div class="kpi-label">Major Defects</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #1d4ed8;">
            <div class="kpi-val" style="color: #1d4ed8;">${kpis.minor}</div>
            <div class="kpi-label">Minor Defects</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #059669;">${kpis.active}</div>
            <div class="kpi-label">Active Specs</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${kpis.categories}</div>
            <div class="kpi-label">Categories</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 28px; text-align: center;">#</th>
              <th style="width: 80px;">Defect Code</th>
              <th>Defect Name & Description</th>
              <th style="width: 105px;">Category</th>
              <th style="width: 75px; text-align: center;">Severity</th>
              <th style="width: 110px;">Zone Classification</th>
              <th style="width: 115px;">Department</th>
              <th style="width: 105px;">Inspection Point</th>
              <th style="width: 95px;">Standard Reference</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-title">Prepared By</div>
            <div class="sign-sub">Quality Systems Specialist / IE</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Reviewed By</div>
            <div class="sign-sub">Quality Assurance Manager</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Approved By</div>
            <div class="sign-sub">Head of Production & Operations</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Buyer Compliance Audit</div>
            <div class="sign-sub">Authorized Technical Auditor</div>
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
 * Export Defect Catalog Excel (.xls)
 */
export function exportDefectCatalogExcel(
  defects: DefectDefinition[],
  scopeLabel: string = 'All Defects'
): void {
  const kpis = computeDefectKpis(defects);
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.defectCatalog || 'DEF-CAT'}`;
  const fileName = `Defects_Catalog_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = defects
    .map(
      (d, i) => `
    <tr>
      <td style="text-align: center;">${i + 1}</td>
      <td style="font-weight: bold; font-family: monospace; color: #0369a1;">${d.defectCode}</td>
      <td style="font-weight: bold;">${d.name}</td>
      <td>${d.category || ''}</td>
      <td style="font-weight: bold; text-align: center; ${
        d.severity === 'CRITICAL'
          ? 'color: #be123c; background-color: #ffe4e6;'
          : d.severity === 'MAJOR'
          ? 'color: #b45309; background-color: #fef3c7;'
          : 'color: #1d4ed8; background-color: #dbeafe;'
      }">${d.severity}</td>
      <td>${d.zone || ''}</td>
      <td>${d.responsibleDepartment || ''}</td>
      <td>${d.inspectionCheckpoint || ''}</td>
      <td>${d.isoStandard || ''}</td>
      <td>${d.rootCause || d.rootCauseHint || ''}</td>
      <td>${d.correctiveAction || d.correctiveActionHint || ''}</td>
      <td>${d.suggestedRemedy || ''}</td>
      <td>${d.status || 'ACTIVE'}</td>
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
                <x:Name>Defects Catalog</x:Name>
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
            <td colspan="13" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="13" style="font-size: 12pt; font-weight: bold;">
              DEFECTS CATALOG & QUALITY ASSURANCE SPECIFICATIONS REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="13" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Scope: ${scopeLabel} | Total Defects: ${kpis.total} (Critical: ${kpis.critical}, Major: ${kpis.major}, Minor: ${kpis.minor}) | Date: ${new Date().toISOString().slice(0, 10)}
            </td>
          </tr>
          <tr><td colspan="13"></td></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>Defect Code</th>
            <th>Defect Name</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Zone</th>
            <th>Department</th>
            <th>Checkpoint</th>
            <th>Standard Reference</th>
            <th>Root Cause</th>
            <th>Corrective Action</th>
            <th>Remedy Guideline</th>
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
 * Export Individual Defect Specification Card PDF
 */
export function exportSingleDefectPdf(defect: DefectDefinition): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'defect_library', 'single', defect.defectCode);
  const docCode = config.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const getSeverityColor = (sev: string) => {
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

  const formatZone = (zone: string) => {
    if (!zone) return 'General';
    if (zone.includes('ZONE_A')) return 'Zone A (Front & Prominent - Zero Tolerance)';
    if (zone.includes('ZONE_B')) return 'Zone B (Side / Lower Back - Restricted)';
    if (zone.includes('ZONE_C')) return 'Zone C (Inside & Concealed - Limited Allowance)';
    return zone.replace(/_/g, ' ');
  };

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Defect Specification - ${defect.defectCode}</title>
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
            border-left: 6px solid ${getSeverityColor(defect.severity)};
            border-radius: 8px;
            padding: 12px 16px;
            background: #f8fafc;
            margin-top: 14px;
            margin-bottom: 16px;
          }
          .severity-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #ffffff;
            background: ${getSeverityColor(defect.severity)};
          }
          .section-title {
            font-size: 12px;
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
          .visual-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 10px;
            margin-bottom: 16px;
          }
          .img-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            background: #f8fafc;
            text-align: center;
          }
          .img-card-header {
            padding: 6px 10px;
            font-size: 10.5px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .img-container {
            height: 180px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
          }
          .img-container img {
            max-height: 170px;
            max-width: 95%;
            object-fit: contain;
          }
          .action-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 10px;
            background: #f8fafc;
          }
          .action-title {
            font-weight: 800;
            font-size: 11px;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .action-body {
            font-size: 10.5px;
            line-height: 1.5;
            color: #334155;
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
              Standard Defect Master Card • Doc Code: ${docCode}
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace;">
              ${defect.defectCode} - ${defect.name}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              Category: <strong>${(defect.category || '').replace(/_/g, ' ')}</strong> • Department: <strong>${defect.responsibleDepartment || 'Garment Production'}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="severity-badge">${defect.severity} DEFECT</div>
            <div style="font-size: 10.5px; color: #64748b; margin-top: 4px; font-weight: 600;">
              Zone: ${formatZone(defect.zone)}
            </div>
          </div>
        </div>

        <div class="section-title">1. Defect Definition & Scope</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Defect Identification Code:</span>
            <span class="data-value" style="font-family: monospace; font-weight: 700; color: #0284c7;">${defect.defectCode}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Defect Classification:</span>
            <span class="data-value">${defect.category || 'Garment Construction'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Severity Level:</span>
            <span class="data-value" style="font-weight: 700; color: ${getSeverityColor(defect.severity)};">${defect.severity}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Acceptance Zone:</span>
            <span class="data-value">${formatZone(defect.zone)}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Inspection Checkpoint:</span>
            <span class="data-value">${defect.inspectionCheckpoint || 'End of Line / QC Station'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Responsible Department:</span>
            <span class="data-value">${defect.responsibleDepartment || 'Sewing & Assembly'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">International Reference Standard:</span>
            <span class="data-value">${defect.isoStandard || 'ISO 2859-1 / AQL Standard'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Catalog Status:</span>
            <span class="data-value" style="color: #059669; font-weight: 700;">${defect.status || 'ACTIVE'}</span>
          </div>
        </div>

        <div class="action-card" style="border-left: 4px solid #0284c7;">
          <div class="action-title">Defect Description & Visual Manifestation</div>
          <div class="action-body">${defect.description || 'Defect manifests as deviation from technical specification sheet and visual golden seal sample.'}</div>
        </div>

        <div class="section-title">2. Visual Benchmark Standards</div>
        <div class="visual-box">
          <div class="img-card" style="border-color: #fca5a5;">
            <div class="img-card-header" style="background-color: #fee2e2; color: #991b1b;">
              ✕ Defective Sample (REJECT)
            </div>
            <div class="img-container">
              ${
                defect.defectImageUrl
                  ? `<img src="${defect.defectImageUrl}" alt="Defect Visual Sample" />`
                  : `<div style="color: #94a3b8; font-style: italic;">No defect photograph uploaded</div>`
              }
            </div>
          </div>
          <div class="img-card" style="border-color: #86efac;">
            <div class="img-card-header" style="background-color: #dcfce7; color: #166534;">
              ✓ Approved Sample (GOLDEN SEAL - OK)
            </div>
            <div class="img-container">
              ${
                defect.okImageUrl
                  ? `<img src="${defect.okImageUrl}" alt="OK Benchmark Sample" />`
                  : `<div style="color: #94a3b8; font-style: italic;">Golden seal standard conforming</div>`
              }
            </div>
          </div>
        </div>

        <div class="section-title">3. Root Cause & Preventive Protocol</div>
        <div class="action-card" style="border-left: 4px solid #f59e0b;">
          <div class="action-title">Potential Root Cause Analysis</div>
          <div class="action-body">${defect.rootCause || defect.rootCauseHint || 'Improper machine tension, operator handling deviation, or raw material variation.'}</div>
        </div>

        <div class="action-card" style="border-left: 4px solid #10b981;">
          <div class="action-title">Immediate Corrective & Preventive Action (CAPA)</div>
          <div class="action-body">${defect.correctiveAction || defect.correctiveActionHint || 'Adjust machine parameters, re-calibrate tension meters, and provide on-line operator retraining.'}</div>
        </div>

        ${
          defect.suggestedRemedy
            ? `
          <div class="action-card" style="border-left: 4px solid #6366f1;">
            <div class="action-title">Suggested Rework / Remedy Guidelines</div>
            <div class="action-body">${defect.suggestedRemedy}</div>
          </div>
        `
            : ''
        }

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-title">Technical QA Specialist</div>
            <div class="sign-sub">Standards Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Quality Assurance Manager</div>
            <div class="sign-sub">Approval & Release</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Production Floor Lead</div>
            <div class="sign-sub">Implementation & Training</div>
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
 * Export Individual Defect Specification Excel (.xls)
 */
export function exportSingleDefectExcel(defect: DefectDefinition): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.defectSpecSheet || 'DEF-SPEC'}`;
  const fileName = `Defect_Spec_${defect.defectCode}_${new Date().toISOString().slice(0, 10)}.xls`;

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Defect Specification</x:Name>
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
              TECHNICAL DEFECT SPECIFICATION CARD
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Defect Code: ${defect.defectCode} | Date: ${new Date().toISOString().slice(0, 10)}
            </td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">1. DEFECT IDENTIFICATION</th></tr>
          <tr><td><strong>Defect Code:</strong></td><td>${defect.defectCode}</td><td><strong>Defect Name:</strong></td><td>${defect.name}</td></tr>
          <tr><td><strong>Category:</strong></td><td>${defect.category || ''}</td><td><strong>Severity:</strong></td><td style="font-weight: bold; color: ${defect.severity === 'CRITICAL' ? '#be123c' : defect.severity === 'MAJOR' ? '#b45309' : '#1d4ed8'};">${defect.severity}</td></tr>
          <tr><td><strong>Zone:</strong></td><td>${defect.zone || ''}</td><td><strong>Status:</strong></td><td>${defect.status || 'ACTIVE'}</td></tr>
          <tr><td><strong>Department:</strong></td><td>${defect.responsibleDepartment || ''}</td><td><strong>Checkpoint:</strong></td><td>${defect.inspectionCheckpoint || ''}</td></tr>
          <tr><td><strong>Standard Reference:</strong></td><td colspan="3">${defect.isoStandard || 'ISO 9001 / AQL'}</td></tr>
          <tr><td><strong>Description:</strong></td><td colspan="3">${defect.description || ''}</td></tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">2. ROOT CAUSE & PREVENTIVE GUIDELINES</th></tr>
          <tr><td><strong>Potential Root Cause:</strong></td><td colspan="3">${defect.rootCause || defect.rootCauseHint || ''}</td></tr>
          <tr><td><strong>Corrective Action (CAPA):</strong></td><td colspan="3">${defect.correctiveAction || defect.correctiveActionHint || ''}</td></tr>
          <tr><td><strong>Remedy / Rework Guidelines:</strong></td><td colspan="3">${defect.suggestedRemedy || ''}</td></tr>
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
