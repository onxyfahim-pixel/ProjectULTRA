import { InspectionRecord } from '@/lib/types/erp';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';
import { syncRecordCheckpoints } from './inspection-checkpoints';
import { deriveSizeBreakdownFromBuyerOrder } from './inspection-size-utils';

export type FooterSignatureMode = 'dual' | 'single' | 'none';

export interface ExportPdfOptions {
  signatureMode?: FooterSignatureMode;
}

// -------------------------------------------------------------
// KPI COMPUTATIONS
// -------------------------------------------------------------

export function computeInspectionKpis(records: InspectionRecord[]) {
  const totalInspections = records.length;
  const passedCount = records.filter((r) => r.status === 'PASSED').length;
  const conditionalCount = records.filter((r) => r.status === 'CONDITIONAL_PASS').length;
  const rejectedCount = records.filter((r) => r.status === 'REJECTED').length;
  const passRate = totalInspections > 0 ? Math.round((passedCount / totalInspections) * 100) : 0;
  
  const totalSamples = records.reduce((sum, r) => sum + (r.sampleSize || 0), 0);
  const criticalDefects = records.reduce((sum, r) => sum + (r.criticalDefects || 0), 0);
  const majorDefects = records.reduce((sum, r) => sum + (r.majorDefects || 0), 0);
  const minorDefects = records.reduce((sum, r) => sum + (r.minorDefects || 0), 0);
  const totalDefects = criticalDefects + majorDefects + minorDefects;

  const uniqueBuyers = new Set(records.map((r) => r.buyer).filter(Boolean)).size;

  return {
    totalInspections,
    passedCount,
    conditionalCount,
    rejectedCount,
    passRate,
    totalSamples,
    criticalDefects,
    majorDefects,
    minorDefects,
    totalDefects,
    uniqueBuyers,
  };
}

// -------------------------------------------------------------
// HELPER: SIGNATURE HTML (DEFAULT NONE)
// -------------------------------------------------------------
export function renderFooterSignaturesHtml(
  mode: FooterSignatureMode = 'none',
  leftRole = 'QUALITY CONTROL AUDITOR',
  leftDept = 'Quality Assurance & AQL Dept',
  rightRole = 'QA / QUALITY DIRECTOR',
  rightDept = 'Quality Management Directorate'
): string {
  if (!mode || mode === 'none') {
    return '';
  }
  if (mode === 'single') {
    return `
      <div style="display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 14px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid;">
        <div style="width: 250px; text-align: center;">
          <div style="border-bottom: 1.5px solid #475569; height: 32px; margin-bottom: 6px;"></div>
          <div style="font-size: 9px; font-weight: 800; color: #1e293b; letter-spacing: 0.3px;">${rightRole}</div>
          <div style="font-size: 8px; color: #64748b;">${rightDept}</div>
        </div>
      </div>
    `;
  }
  return `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 48px; max-width: 650px; margin: 22px auto 0 auto; padding-top: 14px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid;">
      <div style="text-align: center;">
        <div style="border-bottom: 1.5px solid #475569; height: 32px; margin-bottom: 6px;"></div>
        <div style="font-size: 9px; font-weight: 800; color: #1e293b; letter-spacing: 0.3px;">${leftRole}</div>
        <div style="font-size: 8px; color: #64748b;">${leftDept}</div>
      </div>
      <div style="text-align: center;">
        <div style="border-bottom: 1.5px solid #475569; height: 32px; margin-bottom: 6px;"></div>
        <div style="font-size: 9px; font-weight: 800; color: #1e293b; letter-spacing: 0.3px;">${rightRole}</div>
        <div style="font-size: 8px; color: #64748b;">${rightDept}</div>
      </div>
    </div>
  `;
}

// =============================================================
// 1. GLOBAL INSPECTION SUMMARY EXPORTS (PDF & EXCEL)
// =============================================================

export function exportInspectionSummaryPdf(
  records: InspectionRecord[],
  scopeLabel: string = 'All Records',
  options?: ExportPdfOptions
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'inspection', 'register');
    const kpis = computeInspectionKpis(records);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      dateStr,
      config.department
    );

    const rowsHtml = records
      .map((r, idx) => {
        const isPassed = r.status === 'PASSED';
        const isConditional = r.status === 'CONDITIONAL_PASS';
        const statusBg = isPassed ? '#ecfdf5' : isConditional ? '#fffbeb' : '#fef2f2';
        const statusColor = isPassed ? '#047857' : isConditional ? '#b45309' : '#b91c1c';

        const poDisplay = r.poNumbers && r.poNumbers.length > 0 ? r.poNumbers.join(', ') : r.orderNumber || '-';

        return `
          <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
            <td style="font-family: monospace; font-size: 8.5px; font-weight: 700; color: #0284c7;">
              ${r.inspectionCode}
              <div style="font-size: 8px; color: #64748b; font-weight: 400;">${new Date(r.createdAt).toLocaleDateString()}</div>
            </td>
            <td style="font-size: 9px;">
              <div style="font-weight: 700; color: #1e293b; font-family: monospace;">${poDisplay}</div>
              <div style="font-size: 8px; color: #64748b;">Style: ${r.styleNumber}</div>
            </td>
            <td style="font-size: 9px; font-weight: 600; color: #475569;">${r.buyer || '-'}</td>
            <td style="font-size: 8.5px; color: #334155;">
              <span style="display: inline-block; padding: 1.5px 5px; border-radius: 4px; background: #f1f5f9; font-weight: 600;">
                ${r.stage?.replace(/_/g, ' ') || 'Final FRI'}
              </span>
            </td>
            <td style="text-align: right; font-family: monospace; font-size: 9px; font-weight: 700; color: #0f172a;">
              ${(r.sampleSize || 0).toLocaleString()}
            </td>
            <td style="text-align: center; font-family: monospace; font-size: 8.5px;">
              <span style="color: ${r.criticalDefects > 0 ? '#b91c1c' : '#64748b'}; font-weight: ${r.criticalDefects > 0 ? '800' : '400'};">C:${r.criticalDefects || 0}</span>
              <span style="color: #cbd5e1; margin: 0 2px;">/</span>
              <span style="color: ${r.majorDefects > 0 ? '#b45309' : '#64748b'}; font-weight: ${r.majorDefects > 0 ? '700' : '400'};">M:${r.majorDefects || 0}</span>
              <span style="color: #cbd5e1; margin: 0 2px;">/</span>
              <span style="color: #64748b;">m:${r.minorDefects || 0}</span>
            </td>
            <td style="text-align: center;">
              <span style="display: inline-block; font-size: 7.5px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; text-transform: uppercase; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}30;">
                ${r.status?.replace('_', ' ')}
              </span>
            </td>
            <td style="font-size: 8.5px; color: #64748b;">${r.inspectorName?.split('(')[0] || '-'}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Quality Inspection Register - ${scopeLabel}</title>
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
              line-height: 1.35;
              background: #ffffff;
            }
            .meta-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px 12px;
              margin: 10px 0;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 10px;
              text-align: center;
            }
            .kpi-lbl {
              font-size: 7.5px;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .kpi-val {
              font-size: 13px;
              font-weight: 800;
              font-family: monospace;
              margin-top: 2px;
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
              <span style="color: #0284c7; font-weight: 700;">${scopeLabel}</span>
              <span style="color: #cbd5e1; margin: 0 6px;">|</span>
              <span style="color: #64748b;">Buyer Brands: <strong>${kpis.uniqueBuyers}</strong></span>
            </div>
            <div style="font-family: monospace; font-size: 8.5px; color: #64748b;">
              Export Date: <strong>${dateStr}</strong>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card" style="border-left: 3px solid #0284c7;">
              <div class="kpi-lbl">Total Audits Logged</div>
              <div class="kpi-val" style="color: #0284c7;">${kpis.totalInspections} Audits</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #059669;">
              <div class="kpi-lbl">Overall AQL Pass Rate</div>
              <div class="kpi-val" style="color: #059669;">${kpis.passRate}% Passed</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #b91c1c;">
              <div class="kpi-lbl">Rejections / On-Hold</div>
              <div class="kpi-val" style="color: #b91c1c;">${kpis.rejectedCount} Rejected (${kpis.conditionalCount} Cond.)</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #4f46e5;">
              <div class="kpi-lbl">Total Sample Garments</div>
              <div class="kpi-val" style="color: #4f46e5;">${kpis.totalSamples.toLocaleString()} pcs</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 105px;">Audit Code / Date</th>
                <th>Order / PO # &amp; Style</th>
                <th style="width: 95px;">Buyer</th>
                <th style="width: 110px;">Inspection Stage</th>
                <th style="width: 75px; text-align: right;">Sample Size</th>
                <th style="width: 100px; text-align: center;">Defects (Crit/Maj/Min)</th>
                <th style="width: 85px; text-align: center;">AQL Result</th>
                <th style="width: 95px;">Auditor</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          ${renderFooterSignaturesHtml(options?.signatureMode || 'none')}

          <div class="footer-note">
            <span>Project ULTRA ERP • Quality Assurance &amp; ISO 2859-1 Inspection System</span>
            <span>Document Generated on ${dateStr} • Page 1 of 1</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  } catch (err) {
    console.error('Failed to export inspection summary PDF:', err);
  }
}

export function exportInspectionSummaryExcel(
  records: InspectionRecord[],
  scopeLabel: string = 'All Records'
): void {
  try {
    const kpis = computeInspectionKpis(records);
    const dateStr = new Date().toISOString().split('T')[0];

    const rows = records
      .map((r) => {
        const poDisplay = r.poNumbers && r.poNumbers.length > 0 ? r.poNumbers.join(', ') : r.orderNumber || '';
        return `
          <tr>
            <td>${r.inspectionCode}</td>
            <td>${new Date(r.createdAt).toISOString().split('T')[0]}</td>
            <td>${poDisplay}</td>
            <td>${r.buyer || ''}</td>
            <td>${r.styleNumber || ''}</td>
            <td>${r.styleDescription || ''}</td>
            <td>${r.stage || ''}</td>
            <td>${r.inspectionType || ''}</td>
            <td>${r.lotQuantity || 0}</td>
            <td>${r.sampleSize || 0}</td>
            <td>${r.criticalDefects || 0}</td>
            <td>${r.majorDefects || 0}</td>
            <td>${r.minorDefects || 0}</td>
            <td>${r.defectCount || 0}</td>
            <td>${r.status}</td>
            <td>${r.inspectorName || ''}</td>
            <td>${r.remarks || ''}</td>
          </tr>
        `;
      })
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            th { background-color: #0284c7; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
            td { border: 1px solid #cbd5e1; font-size: 10pt; }
            .kpi-hdr { background-color: #f1f5f9; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Quality Assurance &amp; AQL Inspection Master Register</h2>
          <p><strong>Scope:</strong> ${scopeLabel} | <strong>Export Date:</strong> ${dateStr} | <strong>Total Audits:</strong> ${kpis.totalInspections}</p>
          <table>
            <tr class="kpi-hdr">
              <td colspan="3">Pass Rate: ${kpis.passRate}%</td>
              <td colspan="3">Passed: ${kpis.passedCount}</td>
              <td colspan="3">Conditional: ${kpis.conditionalCount}</td>
              <td colspan="3">Rejected: ${kpis.rejectedCount}</td>
              <td colspan="5">Total Sampled: ${kpis.totalSamples.toLocaleString()} pcs</td>
            </tr>
            <tr>
              <th>Inspection Code</th>
              <th>Date</th>
              <th>PO / Order #</th>
              <th>Buyer</th>
              <th>Style Number</th>
              <th>Style Description</th>
              <th>Stage</th>
              <th>Type</th>
              <th>Lot Qty</th>
              <th>Sample Size</th>
              <th>Critical Defects</th>
              <th>Major Defects</th>
              <th>Minor Defects</th>
              <th>Total Defects</th>
              <th>Verdict</th>
              <th>Inspector</th>
              <th>Remarks</th>
            </tr>
            ${rows}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quality_Inspection_Register_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export inspection summary Excel:', err);
  }
}

// =============================================================
// 2. INDIVIDUAL INSPECTION RECORD EXPORTS (PDF & EXCEL)
// =============================================================

export function exportSingleInspectionPdf(
  record: InspectionRecord,
  options?: ExportPdfOptions
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'inspection', 'single', record.inspectionCode || `QA-${record.id}`);
    const dateStr = new Date(record.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      dateStr,
      config.department
    );

    const isPassed = record.status === 'PASSED';
    const isConditional = record.status === 'CONDITIONAL_PASS';
    const verdictBg = isPassed ? '#ecfdf5' : isConditional ? '#fffbeb' : '#fef2f2';
    const verdictColor = isPassed ? '#047857' : isConditional ? '#b45309' : '#b91c1c';

    const poDisplay = record.poNumbers && record.poNumbers.length > 0 ? record.poNumbers.join(', ') : record.orderNumber || '-';

    // Size Breakdown Data & Rows
    const sizeItems = record.sizeBreakdown && record.sizeBreakdown.length > 0
      ? record.sizeBreakdown
      : deriveSizeBreakdownFromBuyerOrder(null, record.lotQuantity || record.orderQuantity || 10000, record.sampleSize || 315);

    const totalOrderQty = sizeItems.reduce((s, i) => s + (Number(i.orderQuantity) || 0), 0);
    const totalInspQty = sizeItems.reduce((s, i) => s + (Number(i.inspectedQuantity) || 0), 0);
    const totalSamplePickup = sizeItems.reduce((s, i) => s + (Number(i.samplePickupQuantity) || 0), 0);
    const totalDefectsSize = sizeItems.reduce((s, i) => s + (Number(i.defectCount) || 0), 0);
    const netVariance = totalInspQty - totalOrderQty;

    const sizeRowsHtml = sizeItems
      .map((item, idx) => {
        const diff = (item.inspectedQuantity || 0) - (item.orderQuantity || 0);
        const diffStr = diff > 0 ? `+${diff.toLocaleString()}` : diff < 0 ? `${diff.toLocaleString()}` : '0';
        const diffColor = diff > 0 ? '#047857' : diff < 0 ? '#b91c1c' : '#64748b';
        const sharePct = totalSamplePickup > 0 ? ((item.samplePickupQuantity / totalSamplePickup) * 100).toFixed(1) : '0';
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="font-family: monospace; font-size: 8px; color: #64748b; text-align: center;">${idx + 1}</td>
            <td style="font-size: 8.5px; font-weight: 800; color: #0f172a; font-family: monospace;">${item.size}</td>
            <td style="text-align: right; font-family: monospace; font-size: 8.5px; font-weight: 600; color: #334155;">${(item.orderQuantity || 0).toLocaleString()}</td>
            <td style="text-align: right; font-family: monospace; font-size: 8.5px; font-weight: 800; color: #1e40af; background: #eff6ff;">${(item.inspectedQuantity || 0).toLocaleString()}</td>
            <td style="text-align: right; font-family: monospace; font-size: 8px; font-weight: 700; color: ${diffColor};">${diffStr}</td>
            <td style="text-align: right; font-family: monospace; font-size: 8.5px; font-weight: 800; color: #4338ca; background: #eef2ff;">${item.samplePickupQuantity || 0}</td>
            <td style="text-align: center; font-family: monospace; font-size: 8px; color: #475569;">${sharePct}%</td>
            <td style="text-align: center; font-family: monospace; font-size: 8px; font-weight: 700; color: ${(item.defectCount || 0) > 0 ? '#b91c1c' : '#64748b'};">${item.defectCount || 0}</td>
            <td style="text-align: center;">
              <span style="font-size: 7.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; ${
                item.status === 'FAIL' || (item.defectCount || 0) > 3
                  ? 'background: #fef2f2; color: #b91c1c;'
                  : 'background: #ecfdf5; color: #047857;'
              }">
                ${item.status === 'FAIL' || (item.defectCount || 0) > 3 ? 'FAIL' : 'PASS'}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    // Defects table
    const defectRowsHtml = (record.defects || [])
      .map(
        (d, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-family: monospace; font-size: 8.5px; color: #64748b;">${idx + 1}</td>
          <td style="font-size: 8.5px; font-weight: 700; color: #1e293b;">
            ${d.defectType}
            ${d.remark ? `<div style="font-size: 7.5px; color: #64748b; font-style: italic;">Remark: ${d.remark}</div>` : ''}
          </td>
          <td style="font-size: 8.5px;">
            <span style="font-size: 7.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; background: ${
              d.severity === 'CRITICAL' ? '#fef2f2; color: #b91c1c;' : d.severity === 'MAJOR' ? '#fffbeb; color: #b45309;' : '#f1f5f9; color: #475569;'
            }">
              ${d.severity}
            </span>
          </td>
          <td style="text-align: right; font-family: monospace; font-size: 8.5px; font-weight: 700; color: #0f172a;">${d.count}</td>
          <td style="font-size: 8.5px; color: #64748b;">${d.location || '-'}</td>
          <td style="text-align: center; width: 55px;">
            ${d.photoUrl ? `<img src="${d.photoUrl}" style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" />` : '<span style="color: #cbd5e1; font-size: 7.5px;">-</span>'}
          </td>
        </tr>
      `
      )
      .join('');

    // Checkpoints Verification Checklist (11 Standard Points)
    const syncedCheckpoints = syncRecordCheckpoints(record.checkpoints);
    const checkpointRowsHtml = syncedCheckpoints
      .map(
        (cp, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-family: monospace; font-size: 8px; color: #64748b; width: 25px;">${idx + 1}</td>
          <td style="font-size: 8.5px; font-weight: 700; color: #1e293b;">${cp.checkpoint}</td>
          <td style="font-size: 8px; color: #64748b;">${cp.category}</td>
          <td style="text-align: center; width: 100px;">
            <span style="display: inline-block; font-size: 8px; font-weight: 800; padding: 2px 7px; border-radius: 4px; ${
              cp.status === 'PASS'
                ? 'background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;'
                : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'
            }">
              ${cp.status === 'PASS' ? '✓ OK / PASS' : '✗ DISCREPANCY'}
            </span>
          </td>
        </tr>
      `
      )
      .join('');

    // Zero-Tolerance Packing Checks
    const ztChecks = record.packingZeroToleranceChecks || [];
    const ztFailedItem = ztChecks.find((z) => !z.isPass || (z.defectCount && z.defectCount > 0));
    const hasZtFail = record.hasZeroToleranceFail || Boolean(ztFailedItem);

    const ztRowsHtml = ztChecks
      .map(
        (z, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-family: monospace; font-size: 8px; color: #64748b; width: 25px;">${idx + 1}</td>
          <td style="font-size: 8.5px; font-weight: 700; color: #1e293b;">${z.name}</td>
          <td style="text-align: center; font-size: 8.5px; font-family: monospace; font-weight: 700; color: ${(z.defectCount ?? 0) > 0 ? '#b91c1c' : '#059669'};">
            ${z.defectCount || 0}
          </td>
          <td style="text-align: center; width: 95px;">
            <span style="display: inline-block; font-size: 7.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; ${
              z.isPass && (z.defectCount || 0) === 0
                ? 'background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;'
                : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'
            }">
              ${z.isPass && (z.defectCount || 0) === 0 ? '✓ PASS (0-TOL)' : '✗ FAILED (0-TOL)'}
            </span>
          </td>
          <td style="font-size: 8px; color: #64748b;">${z.notes || '-'}</td>
        </tr>
      `
      )
      .join('');

    // On-Site Test Records
    const testRecords = record.testRecords || [];
    const testRowsHtml = testRecords
      .map(
        (t, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-family: monospace; font-size: 8px; color: #64748b; width: 25px;">${idx + 1}</td>
          <td style="font-size: 8.5px; font-weight: 700; color: #1e293b;">${t.testName}</td>
          <td style="font-size: 8.5px; color: #334155; font-family: monospace;">${t.value || '-'}</td>
          <td style="text-align: center; width: 85px;">
            <span style="display: inline-block; font-size: 7.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; ${
              t.result === 'PASS'
                ? 'background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;'
                : 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'
            }">
              ${t.result === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </span>
          </td>
          <td style="font-size: 8px; color: #64748b;">${t.notes || '-'}</td>
        </tr>
      `
      )
      .join('');

    // Photographic Evidence
    const allEvidencePhotos = [
      ...(record.poSheetPhotos || []).map((p) => ({ ...p, label: 'PO Sheet' })),
      ...(record.sampleCartonPhotos || []).map((p) => ({ ...p, label: 'Sample Carton' })),
      ...(record.compliancePhotos || []).map((p) => ({ ...p, label: p.categoryTitle || p.category })),
      ...(record.measurementSheetPhotos || []).map((p) => ({ ...p, label: 'Measurement Sheet' })),
    ];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Inspection Certificate - ${record.inspectionCode}</title>
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
            .verdict-banner {
              background: ${verdictBg};
              border: 1.5px solid ${verdictColor};
              border-radius: 8px;
              padding: 10px 16px;
              margin: 12px 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .kpi-row {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin: 10px 0;
            }
            .kpi-box {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 8px 10px;
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8.5px;
              margin-top: 8px;
            }
            th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 700;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              padding: 6px;
              border-bottom: 1.5px solid #cbd5e1;
              text-align: left;
            }
            td {
              padding: 5px 6px;
            }
            .section-title {
              font-size: 10px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1.5px solid #0284c7;
              padding-bottom: 3px;
              margin: 14px 0 6px 0;
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

          <!-- Verdict Banner -->
          <div class="verdict-banner">
            <div>
              <div style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: ${verdictColor}; letter-spacing: 0.5px;">
                Final Quality Inspection Verdict
              </div>
              <div style="font-size: 16px; font-weight: 900; color: ${verdictColor}; margin-top: 2px;">
                ${record.status === 'PASSED' ? 'PASSED — READY FOR SHIPMENT' : record.status === 'CONDITIONAL_PASS' ? 'CONDITIONAL PASS — SORTING REQUIRED' : 'REJECTED — FAILED AQL LIMITS'}
              </div>
            </div>
            <div style="text-align: right; font-family: monospace;">
              <div style="font-size: 8px; color: #64748b;">AQL Standard ISO 2859-1</div>
              <div style="font-size: 11px; font-weight: 800; color: #1e293b;">Level II (Crit 0 / Maj 2.5 / Min 4.0)</div>
            </div>
          </div>

          <!-- Order & Audit Details -->
          <div class="info-card">
            <div class="info-grid">
              <div>
                <div class="info-lbl">Audit Report #</div>
                <div class="info-val" style="color: #0284c7; font-family: monospace;">${record.inspectionCode}</div>
              </div>
              <div>
                <div class="info-lbl">Audit Date</div>
                <div class="info-val font-mono">${dateStr}</div>
              </div>
              <div>
                <div class="info-lbl">Inspection Stage</div>
                <div class="info-val">${record.stage?.replace(/_/g, ' ') || 'Final FRI'}</div>
              </div>
              <div>
                <div class="info-lbl">Inspection Type</div>
                <div class="info-val">${record.inspectionType || 'FRI'}</div>
              </div>
              <div>
                <div class="info-lbl">Purchase Order #</div>
                <div class="info-val" style="color: #2563eb; font-family: monospace;">${poDisplay}</div>
              </div>
              <div>
                <div class="info-lbl">Buyer / Brand</div>
                <div class="info-val">${record.buyer}</div>
              </div>
              <div>
                <div class="info-lbl">Garment Style #</div>
                <div class="info-val font-mono">${record.styleNumber}</div>
              </div>
              <div>
                <div class="info-lbl">Lot / Batch #</div>
                <div class="info-val font-mono">${record.lotNumber || 'LOT-MAIN'}</div>
              </div>
            </div>
          </div>

          <!-- Sample & Limits Breakdown -->
          <div class="kpi-row">
            <div class="kpi-box" style="border-top: 3px solid #0284c7;">
              <div class="info-lbl">Sample Garments</div>
              <div style="font-size: 15px; font-weight: 900; font-family: monospace; color: #0284c7; margin-top: 2px;">
                ${(record.sampleSize || 0).toLocaleString()} pcs
              </div>
              <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">Lot Qty: ${(record.lotQuantity || record.orderQuantity || 0).toLocaleString()}</div>
            </div>
            <div class="kpi-box" style="border-top: 3px solid ${record.criticalDefects > 0 ? '#b91c1c' : '#059669'};">
              <div class="info-lbl">Critical Defects</div>
              <div style="font-size: 15px; font-weight: 900; font-family: monospace; color: ${record.criticalDefects > 0 ? '#b91c1c' : '#059669'}; margin-top: 2px;">
                ${record.criticalDefects || 0}
              </div>
              <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">Max Allowed: 0</div>
            </div>
            <div class="kpi-box" style="border-top: 3px solid ${record.majorDefects > (record.maxAllowedMajor || 3) ? '#b91c1c' : '#059669'};">
              <div class="info-lbl">Major Defects</div>
              <div style="font-size: 15px; font-weight: 900; font-family: monospace; color: ${record.majorDefects > (record.maxAllowedMajor || 3) ? '#b91c1c' : '#059669'}; margin-top: 2px;">
                ${record.majorDefects || 0}
              </div>
              <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">Max Allowed: ${record.maxAllowedMajor ?? 3}</div>
            </div>
            <div class="kpi-box" style="border-top: 3px solid ${record.minorDefects > (record.maxAllowedMinor || 7) ? '#b45309' : '#059669'};">
              <div class="info-lbl">Minor Defects</div>
              <div style="font-size: 15px; font-weight: 900; font-family: monospace; color: ${record.minorDefects > (record.maxAllowedMinor || 7) ? '#b45309' : '#059669'}; margin-top: 2px;">
                ${record.minorDefects || 0}
              </div>
              <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">Max Allowed: ${record.maxAllowedMinor ?? 7}</div>
            </div>
          </div>

          <!-- Size-Wise Breakdown & Sample Pickup Plan Table -->
          <div class="section-title">Final Inspection Size-Wise Breakdown &amp; Sample Pickup Plan</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 60px;">Size</th>
                <th style="width: 80px; text-align: right;">Order Qty</th>
                <th style="width: 90px; text-align: right;">Inspected Lot</th>
                <th style="width: 80px; text-align: right;">Variance</th>
                <th style="width: 85px; text-align: right;">Sample Pickup</th>
                <th style="width: 75px; text-align: center;">Share %</th>
                <th style="width: 70px; text-align: center;">Defects</th>
                <th style="width: 75px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${sizeRowsHtml}
            </tbody>
            <tfoot>
              <tr style="font-weight: 800; background: #f8fafc; border-top: 1.5px solid #cbd5e1;">
                <td colspan="2" style="text-align: right; text-transform: uppercase; font-size: 7.5px; color: #475569;">Total Aggregate:</td>
                <td style="text-align: right; font-family: monospace;">${totalOrderQty.toLocaleString()}</td>
                <td style="text-align: right; font-family: monospace; color: #1e40af;">${totalInspQty.toLocaleString()}</td>
                <td style="text-align: right; font-family: monospace; color: ${netVariance > 0 ? '#047857' : netVariance < 0 ? '#b91c1c' : '#64748b'};">${netVariance > 0 ? `+${netVariance.toLocaleString()}` : netVariance.toLocaleString()}</td>
                <td style="text-align: right; font-family: monospace; color: #4338ca;">${totalSamplePickup.toLocaleString()}</td>
                <td style="text-align: center; font-family: monospace;">100.0%</td>
                <td style="text-align: center; font-family: monospace; color: ${totalDefectsSize > 0 ? '#b91c1c' : '#64748b'};">${totalDefectsSize}</td>
                <td style="text-align: center; color: #047857;">LOT PASS</td>
              </tr>
            </tfoot>
          </table>

          ${
            hasZtFail
              ? `
                <div style="background: #fef2f2; border: 1.5px solid #ef4444; border-radius: 8px; padding: 8px 12px; margin: 8px 0; color: #991b1b;">
                  <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Critical Quality Breach Notice</div>
                  <div style="font-size: 11px; font-weight: 900; margin-top: 1px;">CRITICAL ZERO-TOLERANCE DEFECT DETECTED — SHIPMENT BLOCKED</div>
                  <div style="font-size: 8px; color: #b91c1c; margin-top: 2px;">
                    Inspection lot failed zero-tolerance technical standards (mold, needle, live insects, wrong barcode, dampness, or sharp hazard). Goods quarantined for 100% sort and correction.
                  </div>
                </div>
              `
              : ''
          }

          <!-- Defect Itemization Table -->
          ${
            record.defects && record.defects.length > 0
              ? `
                <div class="section-title">Itemized Defect Breakdown &amp; Photographic Evidence</div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 30px;">#</th>
                      <th>Defect Classification</th>
                      <th style="width: 80px;">Severity</th>
                      <th style="width: 60px; text-align: right;">Count</th>
                      <th style="width: 130px;">Garment Location</th>
                      <th style="width: 55px; text-align: center;">Photo</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${defectRowsHtml}
                  </tbody>
                </table>
              `
              : `
                <div style="margin: 12px 0; padding: 10px; background: #ecfdf5; border-radius: 6px; text-align: center; color: #047857; font-weight: 700; font-size: 8.5px;">
                  ✓ Zero visual defects identified during sample inspection.
                </div>
              `
          }

          <!-- Packing Check: Zero Tolerance Parameters -->
          ${
            ztRowsHtml
              ? `
                <div class="section-title">Packing Check — Zero-Tolerance Parameters Verification</div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25px;">#</th>
                      <th>Zero-Tolerance Checkpoint</th>
                      <th style="width: 70px; text-align: center;">Defects</th>
                      <th style="width: 95px; text-align: center;">Verification</th>
                      <th>Auditor Observations</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ztRowsHtml}
                  </tbody>
                </table>
              `
              : ''
          }

          <!-- On-Site Physical Test Records -->
          ${
            testRowsHtml
              ? `
                <div class="section-title">On-Site Physical Test Records &amp; Verification</div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25px;">#</th>
                      <th>Quality Test Routine</th>
                      <th style="width: 120px;">Specification / Value</th>
                      <th style="width: 85px; text-align: center;">Test Result</th>
                      <th>Observations &amp; Standards</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${testRowsHtml}
                  </tbody>
                </table>
              `
              : ''
          }

          <!-- Inspection Checkpoints Verification Checklist -->
          <div class="section-title">Inspection Checkpoints Verification (11 Standard Points)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th>Inspection Checkpoint</th>
                <th style="width: 140px;">Category</th>
                <th style="width: 105px; text-align: center;">Tik Verification</th>
              </tr>
            </thead>
            <tbody>
              ${checkpointRowsHtml}
            </tbody>
          </table>

          <!-- Audit Photographic Evidences Register -->
          ${
            allEvidencePhotos.length > 0
              ? `
                <div class="section-title">Photographic Evidences &amp; Compliance Register (${allEvidencePhotos.length} Images)</div>
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-top: 6px;">
                  ${allEvidencePhotos.slice(0, 18).map((p) => `
                    <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #f8fafc; text-align: center;">
                      <div style="height: 52px; overflow: hidden; background: #e2e8f0;">
                        <img src="${p.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                      </div>
                      <div style="padding: 2px 4px; font-size: 7px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${p.label}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `
              : ''
          }

          ${
            record.remarks
              ? `
                <div style="margin-top: 12px; padding: 6px 10px; background: #f8fafc; border-left: 3px solid #0284c7; font-size: 8px; color: #334155;">
                  <strong>Inspector Remarks:</strong> ${record.remarks}
                </div>
              `
              : ''
          }

          <!-- Dual Authorization & Signature Endorsement -->
          <div style="margin-top: 18px; page-break-inside: avoid;">
            <div class="section-title" style="margin-bottom: 8px;">Official Quality Authorization &amp; Dual Sign-Off</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <!-- Lead Quality Inspector -->
              <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc; text-align: center;">
                <div style="font-size: 7.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.3px;">Lead Quality Assurance Auditor</div>
                <div style="height: 52px; display: flex; align-items: center; justify-content: center; margin: 4px 0; border-bottom: 1px dashed #cbd5e1;">
                  ${record.inspectorSignature ? `<img src="${record.inspectorSignature}" style="max-height: 48px; max-width: 100%; object-fit: contain;" />` : `<span style="font-size: 8px; color: #94a3b8; font-style: italic;">Auditor Signature On File</span>`}
                </div>
                <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${record.inspectorName || 'Lead Auditor'}</div>
                <div style="font-size: 7.5px; color: #64748b;">Auditor ID: ${record.inspectorId || 'QC-01'} • Date: ${dateStr}</div>
              </div>

              <!-- Factory Representative -->
              <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc; text-align: center;">
                <div style="font-size: 7.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.3px;">Factory / Vendor Authorized Representative</div>
                <div style="height: 52px; display: flex; align-items: center; justify-content: center; margin: 4px 0; border-bottom: 1px dashed #cbd5e1;">
                  ${record.representativeSignature ? `<img src="${record.representativeSignature}" style="max-height: 48px; max-width: 100%; object-fit: contain;" />` : `<span style="font-size: 8px; color: #94a3b8; font-style: italic;">Factory Representative Sign</span>`}
                </div>
                <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${record.representativeName || 'Factory Representative'}</div>
                <div style="font-size: 7.5px; color: #64748b;">Production Floor: ${record.factoryUnit || 'Unit 01'} • Date: ${dateStr}</div>
              </div>
            </div>
          </div>

          <div class="footer-note">
            <span>Project ULTRA ERP • Quality Assurance &amp; Technical Inspection Directorate</span>
            <span>Inspector: ${record.inspectorName || 'Lead Auditor'} • ID: ${record.inspectorId || 'QC-01'}</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  } catch (err) {
    console.error('Failed to export single inspection PDF:', err);
  }
}

export function exportSingleInspectionExcel(record: InspectionRecord): void {
  try {
    const dateStr = new Date(record.createdAt).toISOString().split('T')[0];
    const poDisplay = record.poNumbers && record.poNumbers.length > 0 ? record.poNumbers.join(', ') : record.orderNumber || '';

    const defectRows = (record.defects || [])
      .map(
        (d, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${d.defectType}</td>
          <td>${d.severity}</td>
          <td>${d.count}</td>
          <td>${d.location || ''}</td>
        </tr>
      `
      )
      .join('');

    const syncedCheckpoints = syncRecordCheckpoints(record.checkpoints);
    const checkpointRows = syncedCheckpoints
      .map(
        (c, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight: bold;">${c.checkpoint}</td>
          <td>${c.category}</td>
          <td style="font-weight: bold; color: ${c.status === 'PASS' ? '#047857' : '#b91c1c'};">
            ${c.status === 'PASS' ? '✓ PASS (OK)' : '✗ DISCREPANCY'}
          </td>
        </tr>
      `
      )
      .join('');

    // Zero-Tolerance Packing Checks for Excel
    const ztChecksExcel = (record.packingZeroToleranceChecks || []).map((z, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-weight: bold;">${z.name}</td>
        <td style="text-align: center; color: ${(z.defectCount ?? 0) > 0 ? '#b91c1c' : '#047857'}; font-weight: bold;">${z.defectCount || 0}</td>
        <td style="font-weight: bold; color: ${z.isPass && (z.defectCount || 0) === 0 ? '#047857' : '#b91c1c'};">
          ${z.isPass && (z.defectCount || 0) === 0 ? '✓ PASS (0-TOL)' : '✗ FAILED (0-TOL)'}
        </td>
        <td>${z.notes || ''}</td>
      </tr>
    `).join('');

    // On-site Physical Test Records for Excel
    const testRecordsExcel = (record.testRecords || []).map((t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-weight: bold;">${t.testName}</td>
        <td>${t.value || ''}</td>
        <td style="font-weight: bold; color: ${t.result === 'PASS' ? '#047857' : '#b91c1c'};">
          ${t.result === 'PASS' ? '✓ PASS' : '✗ FAIL'}
        </td>
        <td>${t.notes || ''}</td>
      </tr>
    `).join('');

    // Photo Evidences Log for Excel
    const allPhotosExcel = [
      ...(record.poSheetPhotos || []).map((p) => ({ category: 'PO Sheet', remark: p.remark, date: p.capturedAt })),
      ...(record.sampleCartonPhotos || []).map((p) => ({ category: 'Sample Carton', remark: p.remark, date: p.capturedAt })),
      ...(record.compliancePhotos || []).map((p) => ({ category: p.categoryTitle || p.category, remark: p.remark, date: p.capturedAt })),
      ...(record.measurementSheetPhotos || []).map((p) => ({ category: 'Measurement Sheet', remark: p.remark, date: p.capturedAt })),
    ].map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-weight: bold;">${p.category}</td>
        <td>${p.remark || 'Evidence photo verified'}</td>
        <td>${p.date ? new Date(p.date).toLocaleString() : ''}</td>
        <td style="color: #047857; font-weight: bold;">✓ Captured &amp; Verified</td>
      </tr>
    `).join('');

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
          <h2>Quality Inspection Audit Report - ${record.inspectionCode}</h2>
          <table class="hdr-tbl">
            <tr>
              <td>Report #:</td><td>${record.inspectionCode}</td>
              <td>Date:</td><td>${dateStr}</td>
            </tr>
            <tr>
              <td>PO / Order:</td><td>${poDisplay}</td>
              <td>Buyer:</td><td>${record.buyer}</td>
            </tr>
            <tr>
              <td>Style:</td><td>${record.styleNumber} (${record.styleDescription || ''})</td>
              <td>Stage:</td><td>${record.stage}</td>
            </tr>
            <tr>
              <td>Sample Size:</td><td>${record.sampleSize} pcs</td>
              <td>Verdict:</td><td>${record.status}</td>
            </tr>
            <tr>
              <td>Critical Defects:</td><td>${record.criticalDefects || 0}</td>
              <td>Major Defects:</td><td>${record.majorDefects || 0}</td>
            </tr>
            <tr>
              <td>Minor Defects:</td><td>${record.minorDefects || 0}</td>
              <td>Inspector:</td><td>${record.inspectorName || ''}</td>
            </tr>
          </table>

          <!-- Size-Wise Breakdown & Sample Pickup Matrix -->
          <h3>Final Inspection Size Breakdown &amp; Sample Pickup Specification</h3>
          <table>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Garment Size</th>
              <th>Order Qty (pcs)</th>
              <th>Inspected / Offered Lot (pcs)</th>
              <th>Lot Variance (Plus/Short)</th>
              <th>Sample Pickup Qty (pcs)</th>
              <th>Sampling Share %</th>
              <th>Defects Found</th>
              <th>QC Verdict</th>
            </tr>
            ${(() => {
              const sizeItemsExcel = record.sizeBreakdown && record.sizeBreakdown.length > 0
                ? record.sizeBreakdown
                : deriveSizeBreakdownFromBuyerOrder(null, record.lotQuantity || record.orderQuantity || 10000, record.sampleSize || 315);
              const totalOrd = sizeItemsExcel.reduce((s, i) => s + (Number(i.orderQuantity) || 0), 0);
              const totalInsp = sizeItemsExcel.reduce((s, i) => s + (Number(i.inspectedQuantity) || 0), 0);
              const totalPick = sizeItemsExcel.reduce((s, i) => s + (Number(i.samplePickupQuantity) || 0), 0);
              const totalDef = sizeItemsExcel.reduce((s, i) => s + (Number(i.defectCount) || 0), 0);
              const diffTot = totalInsp - totalOrd;

              const rows = sizeItemsExcel.map((item, idx) => {
                const diff = (item.inspectedQuantity || 0) - (item.orderQuantity || 0);
                const share = totalPick > 0 ? ((item.samplePickupQuantity / totalPick) * 100).toFixed(1) : '0';
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="font-weight: bold;">${item.size}</td>
                    <td style="text-align: right;">${item.orderQuantity || 0}</td>
                    <td style="text-align: right; font-weight: bold; color: #1e40af;">${item.inspectedQuantity || 0}</td>
                    <td style="text-align: right;">${diff > 0 ? `+${diff}` : diff}</td>
                    <td style="text-align: right; font-weight: bold; color: #4338ca;">${item.samplePickupQuantity || 0}</td>
                    <td style="text-align: center;">${share}%</td>
                    <td style="text-align: center;">${item.defectCount || 0}</td>
                    <td style="text-align: center;">${item.status || 'PASS'}</td>
                  </tr>
                `;
              }).join('');

              const footer = `
                <tr style="font-weight: bold; background-color: #f1f5f9;">
                  <td colspan="2" style="text-align: right;">Total Aggregate:</td>
                  <td style="text-align: right;">${totalOrd}</td>
                  <td style="text-align: right; color: #1e40af;">${totalInsp}</td>
                  <td style="text-align: right;">${diffTot > 0 ? `+${diffTot}` : diffTot}</td>
                  <td style="text-align: right; color: #4338ca;">${totalPick}</td>
                  <td style="text-align: center;">100.0%</td>
                  <td style="text-align: center;">${totalDef}</td>
                  <td style="text-align: center;">${record.status}</td>
                </tr>
              `;

              return rows + footer;
            })()}
          </table>

          <h3>Defect Itemization Log</h3>
          <table>
            <tr>
              <th>#</th>
              <th>Defect Type</th>
              <th>Severity</th>
              <th>Count</th>
              <th>Location</th>
            </tr>
            ${defectRows}
          </table>

          <h3>Inspection Checkpoints Verification (11 Standard Points)</h3>
          <table>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Inspection Checkpoint</th>
              <th>Category</th>
              <th>Tik Verification Status</th>
            </tr>
            ${checkpointRows}
          </table>

          ${
            ztChecksExcel
              ? `
                <h3>Packing Check: Zero-Tolerance Critical Parameters</h3>
                <table>
                  <tr>
                    <th style="width: 30px;">#</th>
                    <th>Zero-Tolerance Parameter</th>
                    <th>Defects Count</th>
                    <th>Verification Status</th>
                    <th>Inspector Observations</th>
                  </tr>
                  ${ztChecksExcel}
                </table>
              `
              : ''
          }

          ${
            testRecordsExcel
              ? `
                <h3>On-Site Physical Test Records &amp; Verification</h3>
                <table>
                  <tr>
                    <th style="width: 30px;">#</th>
                    <th>Quality Test Routine</th>
                    <th>Measured Value / Specification</th>
                    <th>Result</th>
                    <th>Standards &amp; Notes</th>
                  </tr>
                  ${testRecordsExcel}
                </table>
              `
              : ''
          }

          ${
            allPhotosExcel
              ? `
                <h3>Audit Photographic Evidences &amp; Verification Register</h3>
                <table>
                  <tr>
                    <th style="width: 30px;">#</th>
                    <th>Evidence Category</th>
                    <th>Caption &amp; Remarks</th>
                    <th>Captured Timestamp</th>
                    <th>Verification Status</th>
                  </tr>
                  ${allPhotosExcel}
                </table>
              `
              : ''
          }

          <h3>Official Quality Authorization &amp; Endorsement Sign-Off</h3>
          <table>
            <tr>
              <th colspan="2">Lead Quality Assurance Auditor</th>
              <th colspan="2">Factory / Vendor Authorized Representative</th>
            </tr>
            <tr>
              <td style="font-weight: bold;">Inspector Name:</td><td>${record.inspectorName || 'Lead Auditor'} (${record.inspectorId || 'QC-01'})</td>
              <td style="font-weight: bold;">Representative Name:</td><td>${record.representativeName || 'Factory Representative'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Digital Sign Status:</td><td>${record.inspectorSignature ? '✓ Electronically Signed' : 'Signed On Physical Paper'}</td>
              <td style="font-weight: bold;">Factory Rep Sign:</td><td>${record.representativeSignature ? '✓ Electronically Signed' : 'Signed On Physical Paper'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Audit Date:</td><td>${dateStr}</td>
              <td style="font-weight: bold;">Production Unit:</td><td>${record.factoryUnit || 'Unit 01'}</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quality_Report_${record.inspectionCode}_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export single inspection Excel:', err);
  }
}
