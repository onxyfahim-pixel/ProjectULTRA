import { IncomingQCLot } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Incoming QC module
 */
export function computeIncomingQcKpis(lots: IncomingQCLot[]) {
  const total = lots.length;
  const accepted = lots.filter((l) => l.result === 'ACCEPTED').length;
  const rejected = lots.filter((l) => l.result === 'REJECTED').length;
  const conditional = lots.filter((l) => l.result === 'CONDITIONAL_ACCEPT').length;
  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const totalReceived = lots.reduce((sum, l) => sum + (l.receivedQuantity || 0), 0);
  const totalInspected = lots.reduce((sum, l) => sum + (l.inspectedQuantity || 0), 0);
  const suppliersCount = new Set(lots.map((l) => l.supplierName).filter(Boolean)).size;
  const gradeACount = lots.filter((l) => l.qualityGradeAssigned === 'GRADE_A').length;

  return {
    total,
    accepted,
    rejected,
    conditional,
    acceptanceRate,
    totalReceived,
    totalInspected,
    suppliersCount,
    gradeACount,
  };
}

/**
 * CSV download helper
 */
export function downloadIncomingQcCsv(
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
 * Export official printable / PDF Incoming QC master register
 */
export function exportIncomingQcSummaryPdf(
  lots: IncomingQCLot[],
  scopeLabel: string = 'All Active Inward Lots'
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF report.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'incoming_qc', 'register');
    const docCode = config.fullDocCode;
    const kpis = computeIncomingQcKpis(lots);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      new Date().toISOString().split('T')[0],
      config.department
    );

    const rowsHtml = lots
      .map(
        (l, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="font-family:monospace; font-weight:700; color:#1e3a8a;">${l.lotNumber}</td>
          <td style="font-weight:600; color:#0f172a;">${l.materialName || l.lotNumber}</td>
          <td><span style="display:inline-block; padding:1px 6px; font-size:9px; font-weight:600; border-radius:4px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;">${l.materialCategory.replace(/_/g, ' ')}</span></td>
          <td style="color:#0f172a; font-weight:500;">${l.supplierName}</td>
          <td style="color:#64748b; font-family:monospace; font-size:9px;">${l.poNumber || '-'}</td>
          <td style="font-family:monospace; font-size:9.5px;">${l.receivedQuantity.toLocaleString()} ${l.unit}</td>
          <td style="font-family:monospace; font-weight:600; font-size:9.5px; color:#1e3a8a;">${l.inspectedQuantity.toLocaleString()} ${l.unit}</td>
          <td>
            <span style="display:inline-block; padding:1px 6px; font-size:9px; font-weight:700; border-radius:4px; ${
              l.result === 'ACCEPTED'
                ? 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;'
                : l.result === 'CONDITIONAL_ACCEPT'
                ? 'background:#fffbeb; color:#b45309; border:1px solid #fde68a;'
                : 'background:#fef2f2; color:#b91c1c; border:1px solid #fecaca;'
            }">
              ${l.result.replace(/_/g, ' ')}
            </span>
          </td>
          <td style="font-weight:700; font-size:9px; color:#475569;">${l.qualityGradeAssigned || 'GRADE_A'}</td>
          <td style="color:#475569; font-size:9px;">${l.inspectorName}</td>
          <td style="color:#64748b; font-size:9px;">${l.inspectionDate}</td>
        </tr>`
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Incoming QC Register - ${docCode}</title>
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
            Export Scope: ${scopeLabel} • Inward Lots: ${lots.length} Records • Generated: ${new Date().toLocaleString()}
          </div>
          <div class="kpi-strip">
            <div class="kpi-card"><div class="kpi-lbl">Total Lots Received</div><div class="kpi-val">${kpis.total}</div></div>
            <div class="kpi-card" style="background:#f0fdf4; border-color:#bbf7d0;"><div class="kpi-lbl" style="color:#166534;">Accepted</div><div class="kpi-val" style="color:#166534;">${kpis.accepted}</div></div>
            <div class="kpi-card" style="background:#fffbeb; border-color:#fde68a;"><div class="kpi-lbl" style="color:#854d0e;">Conditional</div><div class="kpi-val" style="color:#854d0e;">${kpis.conditional}</div></div>
            <div class="kpi-card" style="background:#fef2f2; border-color:#fecaca;"><div class="kpi-lbl" style="color:#991b1b;">Rejected / Hold</div><div class="kpi-val" style="color:#991b1b;">${kpis.rejected}</div></div>
            <div class="kpi-card"><div class="kpi-lbl">Lot Acceptance Rate</div><div class="kpi-val">${kpis.acceptanceRate}%</div></div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:11%;">Lot Number</th>
                <th style="width:20%;">Material Name</th>
                <th style="width:11%;">Category</th>
                <th style="width:13%;">Supplier / Mill</th>
                <th style="width:9%;">PO Ref</th>
                <th style="width:8%;">Inward Qty</th>
                <th style="width:8%;">Tested Qty</th>
                <th style="width:8%;">Verdict</th>
                <th style="width:6%;">Grade</th>
                <th style="width:8%;">Inspector</th>
                <th style="width:8%;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="sign-strip">
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">IQC Receiving Inspector</div><div class="sign-dept">Quality Control Division</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Lab / Materials Tech</div><div class="sign-dept">Fabric &amp; Trims Testing Lab</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Warehouse Manager</div><div class="sign-dept">Materials Storage &amp; GRN</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Quality Head (QMS)</div><div class="sign-dept">Quality Assurance DGM</div></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export Incoming QC PDF:', err);
  }
}

/**
 * Export Incoming QC register as styled Excel workbook (.xls)
 */
export function exportIncomingQcSummaryExcel(
  lots: IncomingQCLot[],
  scopeLabel: string = 'All Active Inward Lots'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const kpis = computeIncomingQcKpis(lots);
    const companyName = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';

    const rowsHtml = lots
      .map(
        (l, idx) => `
        <tr>
          <td style="font-weight:bold; color:#1e3a8a; border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.lotNumber}</td>
          <td style="font-weight:600; border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.materialName || l.lotNumber}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.materialCategory}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.supplierName}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.poNumber || '-'}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:right; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.receivedQuantity} ${l.unit}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:right; font-weight:bold; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.inspectedQuantity} ${l.unit}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; font-weight:bold; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.result}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.qualityGradeAssigned || 'GRADE_A'}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.inspectorName}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${l.inspectionDate}</td>
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
            <tr><td colspan="11" style="font-size:16pt; font-weight:bold; color:#1e3a8a; padding:8px 0;">${companyName}</td></tr>
            <tr><td colspan="11" style="font-size:12pt; font-weight:bold; color:#0f172a;">Incoming Quality Control (IQC) Master Receiving Register</td></tr>
            <tr><td colspan="11" style="font-size:9pt; color:#64748b; padding-bottom:8px;">Scope: ${scopeLabel} | Total: ${lots.length} Lots | Generated: ${new Date().toLocaleString()}</td></tr>
          </table>
          <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
            <tr>
              <td colspan="2" style="background:#eff6ff; border:1px solid #93c5fd; padding:8px; text-align:center;"><div style="font-size:9pt; color:#1e40af;">Total Inward Lots</div><div style="font-size:14pt; font-weight:bold; color:#1e3a8a;">${kpis.total}</div></td>
              <td colspan="2" style="background:#ecfdf5; border:1px solid #86efac; padding:8px; text-align:center;"><div style="font-size:9pt; color:#065f46;">Accepted</div><div style="font-size:14pt; font-weight:bold; color:#047857;">${kpis.accepted}</div></td>
              <td colspan="2" style="background:#fffbeb; border:1px solid #fde68a; padding:8px; text-align:center;"><div style="font-size:9pt; color:#92400e;">Conditional</div><div style="font-size:14pt; font-weight:bold; color:#b45309;">${kpis.conditional}</div></td>
              <td colspan="2" style="background:#fef2f2; border:1px solid #fca5a5; padding:8px; text-align:center;"><div style="font-size:9pt; color:#991b1b;">Rejected / Hold</div><div style="font-size:14pt; font-weight:bold; color:#dc2626;">${kpis.rejected}</div></td>
              <td colspan="3" style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; text-align:center;"><div style="font-size:9pt; color:#334155;">Acceptance Rate</div><div style="font-size:14pt; font-weight:bold; color:#1e293b;">${kpis.acceptanceRate}%</div></td>
            </tr>
          </table>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background:#1e293b; color:#ffffff;">
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Lot Number</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Material Name</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Category</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Supplier / Mill</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">PO Ref</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:right;">Inward Qty</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:right;">Tested Qty</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Verdict</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Grade</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Inspector</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Date</th>
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
    link.setAttribute('download', `incoming_qc_register_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export Incoming QC Excel:', err);
  }
}

/**
 * Export single lot QC Certificate as official printable / PDF
 */
export function exportSingleIncomingQcPdf(lot: IncomingQCLot): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable certificate.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'incoming_qc', 'single', lot.lotNumber);
    const docCode = config.fullDocCode;

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      lot.inspectionDate || new Date().toISOString().split('T')[0],
      config.department
    );

    // Build category-specific test parameters table
    let testParamsRows = '';
    if (lot.materialCategory === 'FABRIC') {
      testParamsRows = `
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">4-Point System Defect Score</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:#1e3a8a;">${lot.pointsPer100SqYd ?? '-'} pts / 100 sq yd</td><td style="padding:5px; border:1px solid #cbd5e1;">≤ 28 pts / 100 sq yd</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:${(lot.pointsPer100SqYd || 0) <= 28 ? '#047857' : '#b91c1c'};">${(lot.pointsPer100SqYd || 0) <= 28 ? 'PASS' : 'FAIL'}</td></tr>
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Actual Fabric Weight (GSM)</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">${lot.actualGsm ?? '-'} GSM</td><td style="padding:5px; border:1px solid #cbd5e1;">Target: ${lot.targetGsm ?? '-'} GSM (± 5%)</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">Var: ${lot.gsmVariancePercent ? `${lot.gsmVariancePercent}%` : 'Normal'}</td></tr>
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Usable Roll Width</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">${lot.rollWidthInches ?? '-'} inches</td><td style="padding:5px; border:1px solid #cbd5e1;">Cuttable width verified</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:#047857;">PASS</td></tr>
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Color Spectro Variance (Delta E)</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">${lot.deltaE ?? '-'} ΔE</td><td style="padding:5px; border:1px solid #cbd5e1;">≤ 1.0 ΔE vs Approved Master</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:${(lot.deltaE || 0) <= 1.0 ? '#047857' : '#b91c1c'};">${(lot.deltaE || 0) <= 1.0 ? 'PASS' : 'HOLD'}</td></tr>
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Bowing &amp; Skewing %</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">Bow: ${lot.bowingPercent ?? 0}% | Skew: ${lot.skewingPercent ?? 0}%</td><td style="padding:5px; border:1px solid #cbd5e1;">≤ 2.5% max torque</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:#047857;">PASS</td></tr>
      `;
    } else if (lot.materialCategory === 'SEWING_THREAD') {
      testParamsRows = `
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Tensile Tenacity (cN/dtex)</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">${lot.tensileStrengthCndtex ?? 38.5} cN/dtex</td><td style="padding:5px; border:1px solid #cbd5e1;">≥ 35.0 cN/dtex (ASTM D204)</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:#047857;">PASS</td></tr>
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Sewability Breakdown Rate</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">${lot.sewabilityBreaksPer100m ?? 0} breaks / 100m</td><td style="padding:5px; border:1px solid #cbd5e1;">≤ 1 break / 100m seam run</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:#047857;">PASS</td></tr>
      `;
    } else if (lot.materialCategory === 'ZIPPERS') {
      testParamsRows = `
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Chain Crosswise Strength (N)</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">${lot.chainCrosswiseStrengthN ?? 440} N</td><td style="padding:5px; border:1px solid #cbd5e1;">≥ 400 N (ASTM D2061)</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:#047857;">PASS</td></tr>
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Slider Lock Holding Force</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">${lot.sliderLockStrengthN ?? 80} N</td><td style="padding:5px; border:1px solid #cbd5e1;">≥ 70 N holding force</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:#047857;">PASS</td></tr>
      `;
    } else if (lot.materialCategory === 'TRIMS_BUTTONS') {
      testParamsRows = `
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Snap / Button Pull Force</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">${lot.pullForceNewtons ?? 110} N (10 sec)</td><td style="padding:5px; border:1px solid #cbd5e1;">≥ 90 N holding 10s (ASTM F963)</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:#047857;">PASS</td></tr>
      `;
    } else {
      testParamsRows = `
        <tr><td style="padding:5px; border:1px solid #cbd5e1; font-weight:600;">Physical / Performance Check</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold;">Visual &amp; Dimensional Conformity</td><td style="padding:5px; border:1px solid #cbd5e1;">AQL 1.0 / 2.5 Normal Inspection</td><td style="padding:5px; border:1px solid #cbd5e1; font-weight:bold; color:#047857;">PASS</td></tr>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${lot.lotNumber} - QC Certificate</title>
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
            .verdict-banner { display: flex; justify-content: space-between; align-items: center; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; }
            .data-table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 10px 0; }
            .data-table th { background: #1e293b; color: #fff; padding: 6px 8px; text-align: left; border: 1px solid #0f172a; font-weight: 700; }
            .data-table td { padding: 5px 8px; border: 1px solid #e2e8f0; }
            .sign-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 26px; border-top: 1px solid #cbd5e1; padding-top: 14px; page-break-inside: avoid; }
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

          <div class="verdict-banner" style="${
            lot.result === 'ACCEPTED'
              ? 'background:#f0fdf4; border:1px solid #86efac; color:#166534;'
              : lot.result === 'CONDITIONAL_ACCEPT'
              ? 'background:#fffbeb; border:1px solid #fde68a; color:#854d0e;'
              : 'background:#fef2f2; border:1px solid #fecaca; color:#991b1b;'
          }">
            <div>
              <div style="font-size:14px; font-weight:800; text-transform:uppercase;">
                OFFICIAL QC VERDICT: ${lot.result.replace(/_/g, ' ')}
              </div>
              <div style="font-size:10px; margin-top:2px;">
                Assigned Quality Grade: <strong>${lot.qualityGradeAssigned || 'GRADE_A'}</strong> &bull; Shade: <strong>${lot.shadeEvaluation ? lot.shadeEvaluation.replace(/_/g, ' ') : 'APPROVED MATCH'}</strong>
              </div>
            </div>
            <div style="text-align:right;">
              <span style="display:inline-block; padding:3px 10px; font-size:11px; font-weight:800; border-radius:4px; ${
                lot.result === 'ACCEPTED' ? 'background:#166534; color:#fff;' : 'background:#991b1b; color:#fff;'
              }">
                ${lot.result === 'ACCEPTED' ? 'RELEASED TO CUTTING' : 'HOLD / QUARANTINE'}
              </span>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><span class="meta-lbl">Lot Ref:</span><span class="meta-val font-mono">${lot.lotNumber}</span></div>
            <div class="meta-item"><span class="meta-lbl">Material:</span><span class="meta-val">${lot.materialName || lot.materialCategory}</span></div>
            <div class="meta-item"><span class="meta-lbl">Category:</span><span class="meta-val">${lot.materialCategory.replace(/_/g, ' ')}</span></div>
            <div class="meta-item"><span class="meta-lbl">Supplier / Mill:</span><span class="meta-val">${lot.supplierName}</span></div>
            <div class="meta-item"><span class="meta-lbl">PO Number:</span><span class="meta-val">${lot.poNumber || 'PO-2026-VAL'}</span></div>
            <div class="meta-item"><span class="meta-lbl">Style Ref:</span><span class="meta-val">${lot.styleNumber || 'BULK-PROD'}</span></div>
            <div class="meta-item"><span class="meta-lbl">Inward Qty:</span><span class="meta-val">${lot.receivedQuantity.toLocaleString()} ${lot.unit}</span></div>
            <div class="meta-item"><span class="meta-lbl">Inspected Qty:</span><span class="meta-val font-mono">${lot.inspectedQuantity.toLocaleString()} ${lot.unit}</span></div>
          </div>

          <div style="font-weight:700; font-size:11px; color:#0f172a; margin-top:14px; margin-bottom:4px;">Technical Quality &amp; Laboratory Test Results</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:35%;">Quality Standard / Parameter</th>
                <th style="width:25%;">Recorded Value</th>
                <th style="width:25%;">Tolerance Benchmark</th>
                <th style="width:15%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${testParamsRows}
            </tbody>
          </table>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px; margin-top:10px;">
            <div style="font-weight:700; font-size:10px; color:#475569; text-transform:uppercase; margin-bottom:3px;">Inspection Remarks &amp; Warehouse Clearance</div>
            <div style="color:#334155; line-height:1.5;">${lot.notes || 'Full batch checked in accordance with international apparel quality standards. Approved for immediate warehouse intake and cutting department release.'}</div>
          </div>

          <div class="sign-strip">
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Receiving QC Inspector</div><div class="sign-dept">${lot.inspectorName}</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Lab Technologist</div><div class="sign-dept">Physical Testing Lab</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Warehouse In-Charge</div><div class="sign-dept">Materials Storage</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Quality Assurance DGM</div><div class="sign-dept">QMS Compliance</div></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export single Incoming QC certificate PDF:', err);
  }
}

/**
 * Export single lot QC Certificate as styled Excel workbook (.xls)
 */
export function exportSingleIncomingQcExcel(lot: IncomingQCLot): void {
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
            <tr><td colspan="4" style="font-size:13pt; font-weight:bold; color:#0f172a;">Material Inspection Certificate: ${lot.lotNumber}</td></tr>
            <tr><td colspan="4" style="font-size:9pt; color:#64748b; padding-bottom:8px;">Category: ${lot.materialCategory} | Generated: ${new Date().toLocaleString()}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#f1f5f9;">
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; width:20%;">Lot Number:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; width:30%; font-family:monospace; font-weight:bold; color:#1e3a8a;">${lot.lotNumber}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; width:20%;">Material Name:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; width:30%; font-weight:bold;">${lot.materialName || lot.lotNumber}</td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Supplier / Mill:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${lot.supplierName}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">PO Number:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${lot.poNumber || '-'}</td>
            </tr>
            <tr style="background:#f1f5f9;">
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Received Qty:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${lot.receivedQuantity} ${lot.unit}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Inspected Qty:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${lot.inspectedQuantity} ${lot.unit}</td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">QC Verdict:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; color:${lot.result === 'ACCEPTED' ? '#047857' : '#b91c1c'};">${lot.result}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Assigned Grade:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${lot.qualityGradeAssigned || 'GRADE_A'}</td>
            </tr>
            <tr style="background:#f1f5f9;">
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Inspector:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${lot.inspectorName}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Inspection Date:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${lot.inspectionDate}</td>
            </tr>
          </table>

          <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">Inspector Remarks &amp; Warehouse Clearance</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${lot.notes || 'Full batch checked in accordance with international apparel quality standards.'}</td></tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${lot.lotNumber}_QC_Certificate.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export single lot Excel:', err);
  }
}
