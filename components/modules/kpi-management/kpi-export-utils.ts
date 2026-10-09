import { KpiMetric } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

export type FooterSignatureMode = 'dual' | 'single' | 'none';

export interface ExportPdfOptions {
  signatureMode?: FooterSignatureMode;
}

// -------------------------------------------------------------
// KPI COMPUTATIONS
// -------------------------------------------------------------

export function computeKpiReportKpis(kpis: KpiMetric[]) {
  const totalKpis = kpis.length;
  const onTrackCount = kpis.filter((k) => k.status === 'ON_TRACK').length;
  const atRiskCount = kpis.filter((k) => k.status === 'AT_RISK').length;
  const criticalCount = kpis.filter((k) => k.status === 'CRITICAL').length;
  const exceededCount = kpis.filter((k) => k.status === 'EXCEEDED').length;

  const onTrackRate = totalKpis > 0 ? Math.round(((onTrackCount + exceededCount) / totalKpis) * 100) : 0;

  const allActions = kpis.flatMap((k) => k.actionItems || []);
  const pendingActionsCount = allActions.filter((a) => !a.completed).length;
  const uniqueDepartments = new Set(kpis.map((k) => k.department).filter(Boolean)).size;

  return {
    totalKpis,
    onTrackCount,
    atRiskCount,
    criticalCount,
    exceededCount,
    onTrackRate,
    allActionsCount: allActions.length,
    pendingActionsCount,
    uniqueDepartments,
  };
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'ON_TRACK':
      return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'On Track' };
    case 'EXCEEDED':
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Exceeded' };
    case 'AT_RISK':
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'At Risk' };
    case 'CRITICAL':
      return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'Critical' };
    default:
      return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: status };
  }
}

// -------------------------------------------------------------
// 1. GLOBAL KPI SUMMARY EXPORTS (PDF & EXCEL)
// -------------------------------------------------------------

export function exportKpiSummaryPdf(
  kpis: KpiMetric[],
  scopeLabel: string = 'All Records',
  options?: ExportPdfOptions
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const metrics = computeKpiReportKpis(kpis);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const config = getModuleExportConfig(pdfSettings, 'kpi_management', 'register');
    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      dateStr,
      config.department
    );

    const rowsHtml = kpis
      .map((k, idx) => {
        const badge = getStatusBadgeStyle(k.status);
        const delta = k.currentValue - k.targetValue;
        const isLowerBetter =
          k.desiredDirection === 'LOWER_IS_BETTER' ||
          k.metricName.toLowerCase().includes('dhu') ||
          k.metricName.toLowerCase().includes('cost');
        const isFavorable = isLowerBetter ? delta <= 0 : delta >= 0;

        const trendSymbol = k.trend === 'UP' ? '▲ UP' : k.trend === 'DOWN' ? '▼ DOWN' : '▬ STABLE';
        const trendColor =
          (k.trend === 'UP' && !isLowerBetter) || (k.trend === 'DOWN' && isLowerBetter)
            ? '#059669'
            : (k.trend === 'UP' && isLowerBetter) || (k.trend === 'DOWN' && !isLowerBetter)
            ? '#b91c1c'
            : '#64748b';

        return `
          <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
            <td style="text-align: center; font-family: monospace; font-size: 8px; color: #64748b;">${idx + 1}</td>
            <td style="font-family: monospace; font-size: 8.5px; font-weight: 700; color: #1e293b;">
              ${k.kpiCode || `KPI-${idx + 1}`}
              <div style="font-size: 7.5px; color: #64748b; font-weight: 400;">${k.frequency || 'Daily'}</div>
            </td>
            <td style="font-size: 8.5px; font-weight: 700; color: #0f172a;">
              ${k.metricName}
              <div style="font-size: 7.5px; color: #64748b; font-weight: 400;">${k.department || 'Operations'}</div>
            </td>
            <td style="font-size: 8px; color: #334155;">
              <span style="display: inline-block; padding: 1.5px 5px; border-radius: 4px; font-size: 7.5px; font-weight: 700; background: #f1f5f9; color: #475569;">
                ${k.category}
              </span>
            </td>
            <td style="text-align: right; font-family: monospace; font-size: 9px; font-weight: 800; color: ${
              isFavorable ? '#047857' : '#b91c1c'
            };">
              ${k.currentValue} ${k.unit}
            </td>
            <td style="text-align: right; font-family: monospace; font-size: 8.5px; color: #475569;">
              ${k.targetValue} ${k.unit}
            </td>
            <td style="font-size: 7.5px; color: #64748b; max-width: 110px;">
              ${k.benchmark || '-'}
            </td>
            <td style="text-align: center; font-family: monospace; font-size: 8px; font-weight: 700; color: ${trendColor};">
              ${trendSymbol}
            </td>
            <td style="text-align: center;">
              <span style="display: inline-block; font-size: 7.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${badge.bg}; color: ${badge.color}; border: 1px solid ${badge.border}; text-transform: uppercase;">
                ${badge.label}
              </span>
            </td>
            <td style="font-size: 8px; color: #475569;">${k.ownerName || '-'}</td>
          </tr>
        `;
      })
      .join('');

    // Action Items Table
    const allActions = kpis.flatMap((k) =>
      (k.actionItems || []).map((a) => ({
        ...a,
        kpiCode: k.kpiCode || k.metricName,
      }))
    );

    const actionRowsHtml = allActions
      .map(
        (a, i) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-family: monospace; font-size: 8px; color: #64748b;">${i + 1}</td>
          <td style="font-family: monospace; font-size: 8px; font-weight: 700; color: #0284c7;">${a.kpiCode}</td>
          <td style="font-size: 8.5px; font-weight: 600; color: #1e293b;">${a.task}</td>
          <td style="font-size: 8px; color: #475569;">${a.assignee} (${a.department || '-'})</td>
          <td style="font-family: monospace; font-size: 8px; color: #64748b;">${a.dueDate}</td>
          <td style="text-align: center;">
            <span style="font-size: 7.5px; font-weight: 700; padding: 1.5px 5px; border-radius: 4px; ${
              a.priority === 'HIGH' ? 'background: #fef2f2; color: #b91c1c;' : 'background: #fffbeb; color: #b45309;'
            }">
              ${a.priority}
            </span>
          </td>
          <td style="text-align: center;">
            <span style="font-size: 7.5px; font-weight: 700; padding: 1.5px 6px; border-radius: 4px; ${
              a.completed ? 'background: #ecfdf5; color: #047857;' : 'background: #f1f5f9; color: #475569;'
            }">
              ${a.completed ? '✓ DONE' : 'OPEN'}
            </span>
          </td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>KPI Scorecard - ${scopeLabel}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 9px;
              line-height: 1.4;
              background: #ffffff;
            }
            .meta-bar {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px 12px;
              margin: 8px 0 12px 0;
              display: flex;
              justify-content: space-between;
              font-size: 8.5px;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 10px;
            }
            .kpi-lbl {
              font-size: 7.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .kpi-val {
              font-size: 14px;
              font-weight: 800;
              font-family: monospace;
              margin-top: 2px;
            }
            .section-title {
              font-size: 10px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              margin: 12px 0 6px 0;
              padding-bottom: 3px;
              border-bottom: 1.5px solid #0f172a;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8.5px;
            }
            th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 700;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              padding: 6px 6px;
              border-bottom: 1.5px solid #cbd5e1;
              text-align: left;
            }
            td {
              padding: 5px 6px;
            }
            .footer-note {
              margin-top: 14px;
              font-size: 7.5px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div class="meta-bar">
            <div>
              <span style="font-weight: 700; color: #1e293b;">Scope:</span>
              <span style="color: #2563eb; font-weight: 700;">${scopeLabel}</span>
              <span style="color: #cbd5e1; margin: 0 6px;">|</span>
              <span style="color: #64748b;">Departments Covered: <strong>${metrics.uniqueDepartments}</strong></span>
            </div>
            <div style="font-family: monospace; font-size: 8.5px; color: #64748b;">
              Export Date: <strong>${dateStr}</strong>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card" style="border-left: 3px solid #0284c7;">
              <div class="kpi-lbl">Total Indicators</div>
              <div class="kpi-val" style="color: #0284c7;">${metrics.totalKpis} KPIs</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #059669;">
              <div class="kpi-lbl">On Track / Exceeded</div>
              <div class="kpi-val" style="color: #059669;">${metrics.onTrackCount + metrics.exceededCount} (${metrics.onTrackRate}%)</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #d97706;">
              <div class="kpi-lbl">At Risk</div>
              <div class="kpi-val" style="color: #d97706;">${metrics.atRiskCount} KPIs</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #b91c1c;">
              <div class="kpi-lbl">Critical Deviation</div>
              <div class="kpi-val" style="color: #b91c1c;">${metrics.criticalCount} KPIs</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #6366f1;">
              <div class="kpi-lbl">Open Action Tasks</div>
              <div class="kpi-val" style="color: #6366f1;">${metrics.pendingActionsCount} Tasks</div>
            </div>
          </div>

          <div class="section-title">
            <span>Key Performance Indicator Scorecard</span>
            <span style="font-size: 8px; font-weight: 500; color: #64748b;">${kpis.length} Metrics Documented</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 85px;">Code & Freq</th>
                <th>Metric Name & Department</th>
                <th style="width: 80px;">Category</th>
                <th style="width: 75px; text-align: right;">Actual</th>
                <th style="width: 75px; text-align: right;">Target</th>
                <th style="width: 110px;">Benchmark</th>
                <th style="width: 60px; text-align: center;">Trend</th>
                <th style="width: 75px; text-align: center;">Health Status</th>
                <th style="width: 100px;">Owner</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          ${
            allActions.length > 0
              ? `
                <div class="section-title" style="margin-top: 18px;">
                  <span>Remediation & Corrective Action Tracker</span>
                  <span style="font-size: 8px; font-weight: 500; color: #64748b;">${allActions.length} Initiatives</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25px;">#</th>
                      <th style="width: 75px;">KPI Code</th>
                      <th>Corrective Action Task</th>
                      <th style="width: 140px;">Assignee & Dept</th>
                      <th style="width: 75px;">Due Date</th>
                      <th style="width: 65px; text-align: center;">Priority</th>
                      <th style="width: 65px; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${actionRowsHtml}
                  </tbody>
                </table>
              `
              : ''
          }

          <div class="footer-note">
            <span>Valiant ERP Quality Management System • Performance Management Suite</span>
            <span>Generated on ${dateStr} • Official KPI Register</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  } catch (err) {
    console.error('Failed to export KPI summary PDF:', err);
  }
}

export function exportKpiSummaryExcel(kpis: KpiMetric[], scopeLabel: string = 'All Records'): void {
  try {
    const dateStr = new Date().toISOString().split('T')[0];

    const kpiRows = kpis
      .map(
        (k, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${k.kpiCode || `KPI-${idx + 1}`}</td>
        <td>${k.metricName}</td>
        <td>${k.category}</td>
        <td>${k.department || ''}</td>
        <td>${k.currentValue}</td>
        <td>${k.targetValue}</td>
        <td>${k.unit}</td>
        <td>${k.benchmark || ''}</td>
        <td>${k.desiredDirection || ''}</td>
        <td>${k.trend}</td>
        <td>${k.status}</td>
        <td>${k.frequency || ''}</td>
        <td>${k.ownerName || ''}</td>
        <td>${k.formula || ''}</td>
      </tr>
    `
      )
      .join('');

    const allActions = kpis.flatMap((k) =>
      (k.actionItems || []).map((a) => ({
        ...a,
        kpiCode: k.kpiCode || k.metricName,
      }))
    );

    const actionRows = allActions
      .map(
        (a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${a.kpiCode}</td>
        <td>${a.task}</td>
        <td>${a.assignee}</td>
        <td>${a.department || ''}</td>
        <td>${a.dueDate}</td>
        <td>${a.priority}</td>
        <td>${a.completed ? 'COMPLETED' : 'OPEN'}</td>
      </tr>
    `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            th { background-color: #0284c7; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
            td { border: 1px solid #cbd5e1; font-size: 10pt; }
            .hdr-tbl td { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>KPI Scorecard & Performance Metrics Register - ${scopeLabel}</h2>
          <table class="hdr-tbl">
            <tr>
              <td>Report Name:</td><td>Factory Key Performance Indicators</td>
              <td>Export Date:</td><td>${dateStr}</td>
            </tr>
            <tr>
              <td>Scope:</td><td>${scopeLabel}</td>
              <td>Total Indicators:</td><td>${kpis.length}</td>
            </tr>
          </table>

          <h3>Master Performance Indicators Scorecard</h3>
          <table>
            <tr>
              <th>#</th>
              <th>KPI Code</th>
              <th>Metric Name</th>
              <th>Category</th>
              <th>Department</th>
              <th>Current Value</th>
              <th>Target Value</th>
              <th>Unit</th>
              <th>Benchmark</th>
              <th>Desired Direction</th>
              <th>Trend</th>
              <th>Status</th>
              <th>Frequency</th>
              <th>Owner</th>
              <th>Formula</th>
            </tr>
            ${kpiRows}
          </table>

          <h3>Remediation & Action Plan Register</h3>
          <table>
            <tr>
              <th>#</th>
              <th>KPI Reference</th>
              <th>Task Description</th>
              <th>Assignee</th>
              <th>Department</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
            ${actionRows}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KPI_Scorecard_${scopeLabel.replace(/\s+/g, '_')}_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export KPI summary Excel:', err);
  }
}

// -------------------------------------------------------------
// 2. SINGLE KPI DOSSIER EXPORTS (PDF & EXCEL)
// -------------------------------------------------------------

export function exportSingleKpiPdf(kpi: KpiMetric): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const config = getModuleExportConfig(pdfSettings, 'kpi_management', 'single', kpi.kpiCode);
    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      dateStr,
      config.department
    );

    const badge = getStatusBadgeStyle(kpi.status);
    const delta = kpi.currentValue - kpi.targetValue;
    const isLowerBetter =
      kpi.desiredDirection === 'LOWER_IS_BETTER' ||
      kpi.metricName.toLowerCase().includes('dhu') ||
      kpi.metricName.toLowerCase().includes('cost');
    const isFavorable = isLowerBetter ? delta <= 0 : delta >= 0;

    const historyRowsHtml = (kpi.history || [])
      .map(
        (h, i) => `
        <tr style="border-bottom: 1px solid #f1f5f9; ${i % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="font-family: monospace; font-size: 8.5px; font-weight: 700; color: #1e293b;">${h.period}</td>
          <td style="text-align: right; font-family: monospace; font-size: 9px; font-weight: 800; color: #0f172a;">${h.value} ${kpi.unit}</td>
          <td style="text-align: right; font-family: monospace; font-size: 8.5px; color: #475569;">${h.target} ${kpi.unit}</td>
          <td style="text-align: right; font-family: monospace; font-size: 8.5px; color: #64748b;">${(h.sampleSize || 0).toLocaleString()} pcs</td>
          <td style="font-size: 8.5px; color: #334155;">${h.loggedBy}</td>
          <td style="font-size: 8px; color: #64748b;">${h.remarks || '-'}</td>
        </tr>
      `
      )
      .join('');

    const actionRowsHtml = (kpi.actionItems || [])
      .map(
        (a, i) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-family: monospace; font-size: 8px; color: #64748b;">${i + 1}</td>
          <td style="font-size: 8.5px; font-weight: 700; color: #1e293b;">${a.task}</td>
          <td style="font-size: 8px; color: #475569;">${a.assignee} (${a.department || '-'})</td>
          <td style="font-family: monospace; font-size: 8.5px; color: #64748b;">${a.dueDate}</td>
          <td style="text-align: center;">
            <span style="font-size: 7.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${
              a.priority === 'HIGH' ? 'background: #fef2f2; color: #b91c1c;' : 'background: #fffbeb; color: #b45309;'
            }">
              ${a.priority}
            </span>
          </td>
          <td style="text-align: center;">
            <span style="font-size: 7.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${
              a.completed ? 'background: #ecfdf5; color: #047857;' : 'background: #f1f5f9; color: #475569;'
            }">
              ${a.completed ? '✓ DONE' : 'IN PROGRESS'}
            </span>
          </td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>KPI Report - ${kpi.kpiCode || kpi.metricName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 9px;
              line-height: 1.4;
              background: #ffffff;
            }
            .info-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              margin: 10px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px 12px;
            }
            .info-lbl {
              font-size: 7.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .info-val {
              font-size: 9.5px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
            }
            .stat-banner {
              background: #ffffff;
              border: 1.5px solid ${badge.border};
              border-radius: 8px;
              padding: 12px 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin: 10px 0;
            }
            .section-title {
              font-size: 9.5px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              margin: 14px 0 6px 0;
              padding-bottom: 3px;
              border-bottom: 1.5px solid #0f172a;
              display: flex;
              justify-content: space-between;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8.5px;
            }
            th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 700;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              padding: 6px 6px;
              border-bottom: 1.5px solid #cbd5e1;
              text-align: left;
            }
            td {
              padding: 5px 6px;
            }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div class="stat-banner">
            <div>
              <div style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                ${kpi.kpiCode || 'KPI'} • ${kpi.category} • ${kpi.department || 'Operations'}
              </div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-top: 2px;">
                ${kpi.metricName}
              </div>
              <div style="font-size: 8px; color: #64748b; margin-top: 2px;">
                Owner: <strong>${kpi.ownerName || 'Department Head'}</strong> • Frequency: <strong>${kpi.frequency || 'Daily'}</strong>
              </div>
            </div>

            <div style="text-align: right;">
              <span style="font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 6px; background: ${badge.bg}; color: ${badge.color}; border: 1.5px solid ${badge.border}; text-transform: uppercase;">
                ${badge.label}
              </span>
              <div style="font-family: monospace; font-size: 18px; font-weight: 900; color: ${isFavorable ? '#047857' : '#b91c1c'}; margin-top: 4px;">
                ${kpi.currentValue} ${kpi.unit}
              </div>
              <div style="font-size: 8px; color: #64748b;">Target: ${kpi.targetValue} ${kpi.unit}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-grid">
              <div>
                <div class="info-lbl">Target Direction</div>
                <div class="info-val">${isLowerBetter ? 'Lower is Better (Minimize)' : 'Higher is Better (Maximize)'}</div>
              </div>
              <div>
                <div class="info-lbl">Global Benchmark</div>
                <div class="info-val">${kpi.benchmark || 'Factory Internal Standard'}</div>
              </div>
              <div>
                <div class="info-lbl">Tolerance Threshold</div>
                <div class="info-val">±${kpi.toleranceThreshold || 0.5} ${kpi.unit}</div>
              </div>
              <div>
                <div class="info-lbl">Current Trend</div>
                <div class="info-val" style="color: ${kpi.trend === 'UP' ? '#2563eb' : kpi.trend === 'DOWN' ? '#d97706' : '#64748b'};">
                  ${kpi.trend}WARD
                </div>
              </div>
            </div>
          </div>

          ${
            kpi.formula || kpi.description
              ? `
                <div class="info-card" style="margin-top: 8px;">
                  ${kpi.formula ? `<div><span class="info-lbl">Calculation Formula:</span> <span style="font-family: monospace; font-weight: 700; color: #0284c7;">${kpi.formula}</span></div>` : ''}
                  ${kpi.description ? `<div style="margin-top: 4px; font-size: 8px; color: #475569;">${kpi.description}</div>` : ''}
                </div>
              `
              : ''
          }

          ${
            kpi.history && kpi.history.length > 0
              ? `
                <div class="section-title">
                  <span>Historical Performance Tracking Log</span>
                  <span style="font-size: 8px; font-weight: 500; color: #64748b;">${kpi.history.length} Data Points</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 80px;">Period</th>
                      <th style="width: 80px; text-align: right;">Logged Value</th>
                      <th style="width: 80px; text-align: right;">Target</th>
                      <th style="width: 90px; text-align: right;">Sample Size</th>
                      <th style="width: 110px;">Logged By</th>
                      <th>Operational Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${historyRowsHtml}
                  </tbody>
                </table>
              `
              : ''
          }

          ${
            kpi.actionItems && kpi.actionItems.length > 0
              ? `
                <div class="section-title" style="margin-top: 14px;">
                  <span>Assigned Corrective & Preventive Action (CAPA) Initiatives</span>
                  <span style="font-size: 8px; font-weight: 500; color: #64748b;">${kpi.actionItems.length} Tasks</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25px;">#</th>
                      <th>Task Description</th>
                      <th style="width: 140px;">Assignee</th>
                      <th style="width: 80px;">Target Date</th>
                      <th style="width: 70px; text-align: center;">Priority</th>
                      <th style="width: 80px; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${actionRowsHtml}
                  </tbody>
                </table>
              `
              : ''
          }

          <div style="margin-top: 25px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 7.5px; color: #94a3b8;">
            <span>Valiant Garments Manufacturing • Quality & Operations Assurance</span>
            <span>Document Code: ${kpi.kpiCode || 'KPI'} • Printed: ${dateStr}</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  } catch (err) {
    console.error('Failed to export single KPI PDF:', err);
  }
}

export function exportSingleKpiExcel(kpi: KpiMetric): void {
  try {
    const dateStr = new Date().toISOString().split('T')[0];

    const historyRows = (kpi.history || [])
      .map(
        (h) => `
      <tr>
        <td>${h.period}</td>
        <td>${h.value}</td>
        <td>${h.target}</td>
        <td>${h.sampleSize || 0}</td>
        <td>${h.loggedBy}</td>
        <td>${h.remarks || ''}</td>
      </tr>
    `
      )
      .join('');

    const actionRows = (kpi.actionItems || [])
      .map(
        (a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${a.task}</td>
        <td>${a.assignee}</td>
        <td>${a.department || ''}</td>
        <td>${a.dueDate}</td>
        <td>${a.priority}</td>
        <td>${a.completed ? 'DONE' : 'IN_PROGRESS'}</td>
      </tr>
    `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            th { background-color: #0284c7; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
            td { border: 1px solid #cbd5e1; font-size: 10pt; }
            .hdr-tbl td { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Performance Metric Dossier - ${kpi.kpiCode || kpi.metricName}</h2>
          <table class="hdr-tbl">
            <tr>
              <td>KPI Code:</td><td>${kpi.kpiCode || ''}</td>
              <td>Date:</td><td>${dateStr}</td>
            </tr>
            <tr>
              <td>Metric Name:</td><td>${kpi.metricName}</td>
              <td>Category:</td><td>${kpi.category}</td>
            </tr>
            <tr>
              <td>Department:</td><td>${kpi.department || ''}</td>
              <td>Owner:</td><td>${kpi.ownerName || ''}</td>
            </tr>
            <tr>
              <td>Current Value:</td><td>${kpi.currentValue} ${kpi.unit}</td>
              <td>Target Value:</td><td>${kpi.targetValue} ${kpi.unit}</td>
            </tr>
            <tr>
              <td>Benchmark:</td><td>${kpi.benchmark || ''}</td>
              <td>Status:</td><td>${kpi.status}</td>
            </tr>
            <tr>
              <td>Formula:</td><td colspan="3">${kpi.formula || ''}</td>
            </tr>
          </table>

          <h3>Historical Performance Log</h3>
          <table>
            <tr>
              <th>Period</th>
              <th>Value</th>
              <th>Target</th>
              <th>Sample Size</th>
              <th>Logged By</th>
              <th>Remarks</th>
            </tr>
            ${historyRows}
          </table>

          <h3>Corrective Actions & Initiatives</h3>
          <table>
            <tr>
              <th>#</th>
              <th>Task</th>
              <th>Assignee</th>
              <th>Department</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
            ${actionRows}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KPI_Report_${(kpi.kpiCode || kpi.metricName).replace(/\s+/g, '_')}_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export single KPI Excel:', err);
  }
}
