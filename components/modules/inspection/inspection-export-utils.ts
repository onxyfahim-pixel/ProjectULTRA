import { InspectionRecord } from '@/lib/types/erp';
import { loadPdfHeaderSettings, renderPdfHeaderHtml } from '@/lib/pdf/pdf-header-store';
import { syncRecordCheckpoints } from './inspection-checkpoints';

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
    const kpis = computeInspectionKpis(records);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const today = new Date().toISOString().split('T')[0];
    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      'QUALITY ASSURANCE & AQL AUDIT MASTER REGISTER',
      `QA-REG-${today.replace(/-/g, '')}`,
      dateStr,
      'Quality Assurance & Compliance Division'
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
    const dateStr = new Date(record.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      'AQL QUALITY INSPECTION CERTIFICATE & AUDIT REPORT',
      record.inspectionCode || `QA-${record.id}`,
      dateStr,
      'Quality Assurance & Compliance Division'
    );

    const isPassed = record.status === 'PASSED';
    const isConditional = record.status === 'CONDITIONAL_PASS';
    const verdictBg = isPassed ? '#ecfdf5' : isConditional ? '#fffbeb' : '#fef2f2';
    const verdictColor = isPassed ? '#047857' : isConditional ? '#b45309' : '#b91c1c';

    const poDisplay = record.poNumbers && record.poNumbers.length > 0 ? record.poNumbers.join(', ') : record.orderNumber || '-';

    // Defects table
    const defectRowsHtml = (record.defects || [])
      .map(
        (d, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-family: monospace; font-size: 8.5px; color: #64748b;">${idx + 1}</td>
          <td style="font-size: 8.5px; font-weight: 700; color: #1e293b;">${d.defectType}</td>
          <td style="font-size: 8.5px;">
            <span style="font-size: 7.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; background: ${
              d.severity === 'CRITICAL' ? '#fef2f2; color: #b91c1c;' : d.severity === 'MAJOR' ? '#fffbeb; color: #b45309;' : '#f1f5f9; color: #475569;'
            }">
              ${d.severity}
            </span>
          </td>
          <td style="text-align: right; font-family: monospace; font-size: 8.5px; font-weight: 700; color: #0f172a;">${d.count}</td>
          <td style="font-size: 8.5px; color: #64748b;">${d.location || '-'}</td>
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

          <!-- Defect Itemization Table -->
          ${
            record.defects && record.defects.length > 0
              ? `
                <div class="section-title">Itemized Defect Breakdown</div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 30px;">#</th>
                      <th>Defect Classification</th>
                      <th style="width: 90px;">Severity</th>
                      <th style="width: 70px; text-align: right;">Count</th>
                      <th style="width: 140px;">Garment Location</th>
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

          ${
            record.remarks
              ? `
                <div style="margin-top: 12px; padding: 6px 10px; background: #f8fafc; border-left: 3px solid #0284c7; font-size: 8px; color: #334155;">
                  <strong>Inspector Remarks:</strong> ${record.remarks}
                </div>
              `
              : ''
          }

          ${renderFooterSignaturesHtml(options?.signatureMode || 'none')}

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
