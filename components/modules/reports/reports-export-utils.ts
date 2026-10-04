'use client';

import { loadPdfHeaderSettings, renderPdfHeaderHtml } from '@/lib/pdf/pdf-header-store';

/**
 * Universal Export Utilities for Project ULTRA Reports & Analytics Suite
 * Supports:
 * 1. Formatted CSV download with UTF-8 BOM (Excel compatible)
 * 2. Formatted Excel (HTML/XML based .xls) with styled headers, metadata, and grid lines
 * 3. Official Printable / PDF window with factory headers, KPI scorecards, tables, and dual sign-off blocks
 */

export interface ExportMetaItem {
  label: string;
  value: string;
}

export interface PrintableKpiBadge {
  label: string;
  value: string;
  subtext?: string;
  status?: 'pass' | 'warn' | 'fail' | 'neutral';
}

export interface PrintableReportConfig {
  reportTitle: string;
  reportCode: string;
  category: string;
  generatedDate?: string;
  generatedBy?: string;
  meta: ExportMetaItem[];
  kpis?: PrintableKpiBadge[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  summaryNotes?: string[];
  comparisonData?: {
    title: string;
    entityA: string;
    entityB: string;
    metrics: { label: string; valA: string | number; valB: string | number; delta: string }[];
  };
}

/**
 * Download standard CSV with UTF-8 BOM so special symbols and numbers display correctly in Excel
 */
export function downloadCsv(
  fileName: string,
  headers: string[],
  rows: (string | number)[][],
  meta?: ExportMetaItem[]
): void {
  try {
    const csvRows: string[] = [];

    // Optional metadata header rows
    if (meta && meta.length > 0) {
      meta.forEach((m) => {
        csvRows.push(`"${m.label.replace(/"/g, '""')}","${String(m.value).replace(/"/g, '""')}"`);
      });
      csvRows.push(''); // Empty line separator
    }

    // Header row
    csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

    // Data rows
    rows.forEach((row) => {
      const formattedRow = row.map((cell) => {
        if (cell === null || cell === undefined) return '""';
        const str = String(cell).replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(formattedRow.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to download CSV:', err);
  }
}

/**
 * Download Excel-compatible file (.xls) with HTML table styling, factory headers, and colored KPI badges
 */
export function downloadExcel(
  fileName: string,
  config: PrintableReportConfig
): void {
  try {
    const safeTitle = config.reportTitle.replace(/[<>]/g, '');
    const safeCode = config.reportCode.replace(/[<>]/g, '');

    const metaHtml = config.meta
      .map(
        (m) =>
          `<tr><td style="font-weight:bold; background-color:#f1f5f9; padding:4px 8px; border:1px solid #cbd5e1;">${m.label}</td><td style="padding:4px 8px; border:1px solid #cbd5e1;">${m.value}</td></tr>`
      )
      .join('');

    const kpiHtml = config.kpis && config.kpis.length > 0
      ? `<tr><td colspan="${config.tableHeaders.length}" style="padding:10px 0;"><table style="width:100%; border-collapse:collapse;"><tr>${config.kpis
        .map(
          (k) =>
            `<td style="padding:10px; border:1px solid #94a3b8; background-color:#f8fafc; text-align:center;">
                <div style="font-size:11px; color:#64748b; text-transform:uppercase;">${k.label}</div>
                <div style="font-size:18px; font-weight:bold; color:#0f172a; margin-top:4px;">${k.value}</div>
                ${k.subtext ? `<div style="font-size:10px; color:#475569;">${k.subtext}</div>` : ''}
              </td>`
        )
        .join('')}</tr></table></td></tr>`
      : '';

    const tableHeaderHtml = config.tableHeaders
      .map(
        (h) =>
          `<th style="background-color:#1e293b; color:#ffffff; font-weight:bold; padding:8px 10px; border:1px solid #0f172a; text-align:left;">${h}</th>`
      )
      .join('');

    const tableRowsHtml = config.tableRows
      .map((row, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        const cells = row
          .map(
            (cell) =>
              `<td style="padding:6px 10px; border:1px solid #cbd5e1; background-color:${bg};">${cell !== null && cell !== undefined ? String(cell) : ''}</td>`
          )
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #0f172a; }
            table { border-collapse: collapse; }
          </style>
        </head>
        <body>
          <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
            <tr>
              <td colspan="${config.tableHeaders.length}" style="font-size:16pt; font-weight:bold; color:#1e3a8a; padding:10px 0;">
                ${loadPdfHeaderSettings().companyName || 'APEX HORIZON TEXTILE & APPAREL LTD'}
              </td>
            </tr>
            <tr>
              <td colspan="${config.tableHeaders.length}" style="font-size:13pt; font-weight:bold; color:#0f172a;">
                ${safeTitle} (${safeCode})
              </td>
            </tr>
            <tr>
              <td colspan="${config.tableHeaders.length}" style="font-size:9pt; color:#64748b; padding-bottom:12px;">
                Category: ${config.category} | Generated: ${config.generatedDate || new Date().toLocaleString()} | User: ${config.generatedBy || 'ERP System Master'}
              </td>
            </tr>
          </table>

          <table style="margin-bottom:15px; border-collapse:collapse;">
            ${metaHtml}
          </table>

          <table style="width:100%; border-collapse:collapse;">
            ${kpiHtml}
            <thead>
              <tr>${tableHeaderHtml}</tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.endsWith('.xls') ? fileName : `${fileName}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to download Excel file:', err);
  }
}

/**
 * Open official printable report in separate preview window for printing or Save as PDF
 */
export function printReportPdf(config: PrintableReportConfig): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to generate the printable PDF report.');
      return;
    }

    const safeTitle = config.reportTitle;
    const safeCode = config.reportCode;
    const pdfSettings = loadPdfHeaderSettings();
    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      safeTitle,
      safeCode,
      config.generatedDate || new Date().toISOString().split('T')[0],
      config.category || 'Quality Assurance & Technical Compliance'
    );

    const metaItemsHtml = config.meta
      .map(
        (m) => `
        <div class="meta-item">
          <span class="meta-label">${m.label}:</span>
          <span class="meta-val">${m.value}</span>
        </div>`
      )
      .join('');

    const kpiCardsHtml = config.kpis && config.kpis.length > 0
      ? `
      <div class="kpi-grid">
        ${config.kpis
        .map((k) => {
          const badgeClass =
            k.status === 'pass'
              ? 'kpi-pass'
              : k.status === 'warn'
                ? 'kpi-warn'
                : k.status === 'fail'
                  ? 'kpi-fail'
                  : 'kpi-neutral';
          return `
            <div class="kpi-card ${badgeClass}">
              <div class="kpi-lbl">${k.label}</div>
              <div class="kpi-val">${k.value}</div>
              ${k.subtext ? `<div class="kpi-sub">${k.subtext}</div>` : ''}
            </div>`;
        })
        .join('')}
      </div>`
      : '';

    const comparisonHtml = config.comparisonData
      ? `
      <div class="comparison-box">
        <div class="comp-title">Comparative Variance Analysis: ${config.comparisonData.entityA} vs ${config.comparisonData.entityB}</div>
        <table class="comp-table">
          <thead>
            <tr>
              <th>Performance Metric</th>
              <th>${config.comparisonData.entityA}</th>
              <th>${config.comparisonData.entityB}</th>
              <th>Variance (Delta)</th>
            </tr>
          </thead>
          <tbody>
            ${config.comparisonData.metrics
        .map(
          (m) => `
              <tr>
                <td style="font-weight:600;">${m.label}</td>
                <td>${m.valA}</td>
                <td>${m.valB}</td>
                <td style="font-weight:700; color:${String(m.delta).startsWith('+') ? '#047857' : String(m.delta).startsWith('-') ? '#b91c1c' : '#334155'};">${m.delta}</td>
              </tr>`
        )
        .join('')}
          </tbody>
        </table>
      </div>`
      : '';

    const thHtml = config.tableHeaders.map((h) => `<th>${h}</th>`).join('');
    const trHtml = config.tableRows
      .map((row) => {
        const tds = row.map((c) => `<td>${c !== null && c !== undefined ? c : '-'}</td>`).join('');
        return `<tr>${tds}</tr>`;
      })
      .join('');

    const notesHtml = config.summaryNotes && config.summaryNotes.length > 0
      ? `
      <div class="notes-box">
        <div class="notes-title">Quality Assurance & Operations Remarks</div>
        <ul>
          ${config.summaryNotes.map((n) => `<li>${n}</li>`).join('')}
        </ul>
      </div>`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${safeCode} - ${safeTitle}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 16px;
              font-size: 11px;
            }
            .header-banner {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 10px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .company-name {
              font-size: 18px;
              font-weight: 800;
              color: #1e3a8a;
              letter-spacing: 0.5px;
            }
            .factory-sub {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
            }
            .report-title-box {
              margin-top: 6px;
            }
            .report-title {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
            }
            .report-code-badge {
              font-family: monospace;
              font-weight: 700;
              background: #eff6ff;
              color: #1d4ed8;
              border: 1px solid #bfdbfe;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              margin-left: 6px;
            }
            .meta-strip {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 12px;
              margin-bottom: 12px;
            }
            .meta-item {
              font-size: 10.5px;
            }
            .meta-label {
              font-weight: 600;
              color: #475569;
            }
            .meta-val {
              color: #0f172a;
              font-weight: 500;
              margin-left: 4px;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(${config.kpis ? Math.min(config.kpis.length, 6) : 4}, 1fr);
              gap: 8px;
              margin-bottom: 14px;
            }
            .kpi-card {
              border-radius: 6px;
              padding: 8px 10px;
              border: 1px solid #e2e8f0;
              text-align: center;
            }
            .kpi-lbl {
              font-size: 9.5px;
              text-transform: uppercase;
              font-weight: 700;
              color: #475569;
              letter-spacing: 0.4px;
            }
            .kpi-val {
              font-size: 16px;
              font-weight: 800;
              margin-top: 2px;
            }
            .kpi-sub {
              font-size: 9px;
              color: #64748b;
              margin-top: 2px;
            }
            .kpi-pass { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
            .kpi-warn { background: #fefce8; border-color: #fef08a; color: #854d0e; }
            .kpi-fail { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
            .kpi-neutral { background: #f8fafc; border-color: #e2e8f0; color: #1e293b; }

            .comparison-box {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px 12px;
              margin-bottom: 12px;
            }
            .comp-title {
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 6px;
              text-transform: uppercase;
            }
            .comp-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            .comp-table th {
              background: #e2e8f0;
              color: #334155;
              padding: 4px 8px;
              text-align: left;
              border: 1px solid #cbd5e1;
            }
            .comp-table td {
              padding: 4px 8px;
              border: 1px solid #cbd5e1;
              background: #fff;
            }

            table.data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
              font-size: 10px;
            }
            table.data-table th {
              background: #1e293b;
              color: #ffffff;
              padding: 6px 8px;
              text-align: left;
              border: 1px solid #0f172a;
              font-weight: 700;
              font-size: 10px;
            }
            table.data-table td {
              padding: 5px 8px;
              border: 1px solid #e2e8f0;
              color: #1e293b;
            }
            table.data-table tr:nth-child(even) td {
              background: #f8fafc;
            }

            .notes-box {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 6px;
              padding: 8px 12px;
              margin-bottom: 16px;
            }
            .notes-title {
              font-size: 10.5px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 4px;
            }
            .notes-box ul {
              margin: 0;
              padding-left: 16px;
              color: #334155;
            }
            .notes-box li {
              margin-bottom: 2px;
            }

            .sign-off-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              margin-top: 24px;
              padding-top: 14px;
              border-top: 1px solid #cbd5e1;
              page-break-inside: avoid;
            }
            .sign-col {
              text-align: center;
            }
            .sign-line {
              border-bottom: 1.5px solid #475569;
              height: 28px;
              margin-bottom: 4px;
            }
            .sign-role {
              font-size: 9.5px;
              font-weight: 700;
              color: #334155;
              text-transform: uppercase;
            }
            .sign-dept {
              font-size: 8.5px;
              color: #64748b;
            }

            .print-btn-bar {
              margin-bottom: 12px;
              display: flex;
              justify-content: flex-end;
              gap: 8px;
            }
            .print-btn {
              background: #1e40af;
              color: #fff;
              border: none;
              padding: 6px 14px;
              font-weight: 600;
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
            }
            .print-btn:hover {
              background: #1d4ed8;
            }
            @media print {
              .print-btn-bar {
                display: none !important;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-btn-bar">
            <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
            <button class="print-btn" style="background:#64748b;" onclick="window.close()">Close Window</button>
          </div>

          ${dynamicHeaderHtml}

          <div class="meta-strip">
            ${metaItemsHtml}
          </div>

          ${kpiCardsHtml}

          ${comparisonHtml}

          <table class="data-table">
            <thead>
              <tr>${thHtml}</tr>
            </thead>
            <tbody>
              ${trHtml}
            </tbody>
          </table>

          ${notesHtml}

          <div class="sign-off-grid">
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-role">Prepared By (QA/IE)</div>
              <div class="sign-dept">Floor In-Charge</div>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-role">Verified By (Production)</div>
              <div class="sign-dept">Production Manager</div>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-role">Quality Head (QMS)</div>
              <div class="sign-dept">Quality Assurance DGM</div>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-role">Approved By</div>
              <div class="sign-dept">Factory General Manager</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to open printable report window:', err);
  }
}
