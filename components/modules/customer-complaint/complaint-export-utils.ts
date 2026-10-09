import { CustomerComplaint } from '@/lib/types/modules';
import { loadPdfHeaderSettings, renderPdfHeaderHtml, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Customer Complaint module
 */
export function computeComplaintKpis(complaints: CustomerComplaint[]) {
  const total = complaints.length;
  const totalClaimsUSD = complaints.reduce((sum, c) => sum + (c.claimAmountUSD || 0), 0);
  const settled = complaints.filter((c) => c.status === 'SETTLED').length;
  const investigating = complaints.filter((c) => c.status === 'INVESTIGATING').length;
  const capaIssued = complaints.filter((c) => c.status === 'CAPA_ISSUED').length;
  const logged = complaints.filter((c) => c.status === 'LOGGED').length;
  const rejected = complaints.filter((c) => c.status === 'REJECTED').length;
  const critical = complaints.filter((c) => c.severity === 'CRITICAL').length;
  const settlementRate = total > 0 ? Math.round((settled / total) * 100) : 0;
  const buyersCount = new Set(complaints.map((c) => c.buyerName).filter(Boolean)).size;

  return {
    total,
    totalClaimsUSD,
    settled,
    investigating,
    capaIssued,
    logged,
    rejected,
    critical,
    settlementRate,
    buyersCount,
  };
}

/**
 * CSV download helper
 */
export function downloadComplaintCsv(
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
 * Export official printable / PDF Customer Complaint master register
 */
export function exportComplaintSummaryPdf(
  complaints: CustomerComplaint[],
  scopeLabel: string = 'All Active Customer Claims'
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF report.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const exportConfig = getModuleExportConfig(pdfSettings, 'complaint', 'register');
    const docCode = exportConfig.fullDocCode;
    const kpis = computeComplaintKpis(complaints);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      exportConfig.title,
      docCode,
      new Date().toISOString().split('T')[0],
      exportConfig.department
    );

    const rowsHtml = complaints
      .map(
        (c, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="font-family:monospace; font-weight:700; color:#1e3a8a;">${c.complaintNumber}</td>
          <td style="font-weight:600; color:#0f172a;">${c.buyerName}</td>
          <td style="color:#475569; font-mono; font-size:9.5px;">${c.styleNumber}</td>
          <td style="color:#64748b; font-mono; font-size:9px;">${c.poNumber}</td>
          <td><span style="display:inline-block; padding:1px 6px; font-size:9px; font-weight:600; border-radius:4px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;">${c.defectCategory.replace(/_/g, ' ')}</span></td>
          <td>
            <span style="display:inline-block; padding:1px 6px; font-size:9px; font-weight:700; border-radius:4px; ${
              c.severity === 'CRITICAL'
                ? 'background:#fef2f2; color:#b91c1c; border:1px solid #fecaca;'
                : c.severity === 'MAJOR'
                ? 'background:#fffbeb; color:#b45309; border:1px solid #fde68a;'
                : 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;'
            }">
              ${c.severity}
            </span>
          </td>
          <td style="font-family:monospace; font-weight:700; color:#b91c1c; text-align:right;">$${c.claimAmountUSD.toLocaleString()}</td>
          <td>
            <span style="display:inline-block; padding:1px 6px; font-size:9px; font-weight:700; border-radius:4px; ${
              c.status === 'SETTLED'
                ? 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;'
                : c.status === 'CAPA_ISSUED'
                ? 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;'
                : c.status === 'INVESTIGATING'
                ? 'background:#fffbeb; color:#b45309; border:1px solid #fde68a;'
                : 'background:#fef2f2; color:#b91c1c; border:1px solid #fecaca;'
            }">
              ${c.status.replace(/_/g, ' ')}
            </span>
          </td>
          <td style="color:#475569; font-size:9px;">${c.assignedEngineer}</td>
          <td style="color:#64748b; font-size:9px;">${c.reportedDate}</td>
        </tr>`
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Claims Register - ${docCode}</title>
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
            Export Scope: ${scopeLabel} • Claims Count: ${complaints.length} Records • Total Liability: $${kpis.totalClaimsUSD.toLocaleString()} USD
          </div>
          <div class="kpi-strip">
            <div class="kpi-card"><div class="kpi-lbl">Total Claims</div><div class="kpi-val">${kpis.total}</div></div>
            <div class="kpi-card" style="background:#fef2f2; border-color:#fecaca;"><div class="kpi-lbl" style="color:#991b1b;">Total Liability</div><div class="kpi-val" style="color:#991b1b;">$${kpis.totalClaimsUSD.toLocaleString()}</div></div>
            <div class="kpi-card" style="background:#fffbeb; border-color:#fde68a;"><div class="kpi-lbl" style="color:#854d0e;">Investigating / CAPA</div><div class="kpi-val" style="color:#854d0e;">${kpis.investigating + kpis.capaIssued}</div></div>
            <div class="kpi-card" style="background:#f0fdf4; border-color:#bbf7d0;"><div class="kpi-lbl" style="color:#166534;">Settled Claims</div><div class="kpi-val" style="color:#166534;">${kpis.settled}</div></div>
            <div class="kpi-card"><div class="kpi-lbl">Settlement Rate</div><div class="kpi-val">${kpis.settlementRate}%</div></div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:11%;">Claim Ref</th>
                <th style="width:15%;">Buyer Name</th>
                <th style="width:10%;">Style No</th>
                <th style="width:10%;">Buyer PO</th>
                <th style="width:14%;">Defect Category</th>
                <th style="width:7%;">Severity</th>
                <th style="width:9%; text-align:right;">Claim (USD)</th>
                <th style="width:10%;">Status</th>
                <th style="width:8%;">QA Lead</th>
                <th style="width:6%;">Reported</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="sign-strip">
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Customer Care Lead</div><div class="sign-dept">Client Relations &amp; QA</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">QA Technical Manager</div><div class="sign-dept">Quality Assurance Division</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Head of Merchandising</div><div class="sign-dept">Buyer Accounts Commercial</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Managing Director</div><div class="sign-dept">Executive Management</div></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export Customer Complaints PDF:', err);
  }
}

/**
 * Export Customer Complaints register as styled Excel workbook (.xls)
 */
export function exportComplaintSummaryExcel(
  complaints: CustomerComplaint[],
  scopeLabel: string = 'All Active Customer Claims'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const kpis = computeComplaintKpis(complaints);
    const companyName = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';

    const rowsHtml = complaints
      .map(
        (c, idx) => `
        <tr>
          <td style="font-weight:bold; color:#1e3a8a; border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.complaintNumber}</td>
          <td style="font-weight:600; border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.buyerName}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.styleNumber}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.poNumber}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.defectCategory}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; font-weight:bold; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.severity}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:right; font-weight:bold; color:#b91c1c; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">$${c.claimAmountUSD}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; font-weight:bold; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.status}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.assignedEngineer}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.reportedDate}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${c.rootCauseSummary || '-'}</td>
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
            <tr><td colspan="11" style="font-size:12pt; font-weight:bold; color:#0f172a;">Customer Claims &amp; Quality Complaints Master Register</td></tr>
            <tr><td colspan="11" style="font-size:9pt; color:#64748b; padding-bottom:8px;">Scope: ${scopeLabel} | Total: ${complaints.length} Claims | Generated: ${new Date().toLocaleString()}</td></tr>
          </table>
          <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
            <tr>
              <td colspan="2" style="background:#eff6ff; border:1px solid #93c5fd; padding:8px; text-align:center;"><div style="font-size:9pt; color:#1e40af;">Total Claims</div><div style="font-size:14pt; font-weight:bold; color:#1e3a8a;">${kpis.total}</div></td>
              <td colspan="2" style="background:#fef2f2; border:1px solid #fca5a5; padding:8px; text-align:center;"><div style="font-size:9pt; color:#991b1b;">Total Liability</div><div style="font-size:14pt; font-weight:bold; color:#dc2626;">$${kpis.totalClaimsUSD.toLocaleString()}</div></td>
              <td colspan="2" style="background:#fffbeb; border:1px solid #fde68a; padding:8px; text-align:center;"><div style="font-size:9pt; color:#92400e;">Active Claims</div><div style="font-size:14pt; font-weight:bold; color:#b45309;">${kpis.investigating + kpis.capaIssued}</div></td>
              <td colspan="2" style="background:#ecfdf5; border:1px solid #86efac; padding:8px; text-align:center;"><div style="font-size:9pt; color:#065f46;">Settled</div><div style="font-size:14pt; font-weight:bold; color:#047857;">${kpis.settled}</div></td>
              <td colspan="3" style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; text-align:center;"><div style="font-size:9pt; color:#334155;">Settlement Rate</div><div style="font-size:14pt; font-weight:bold; color:#1e293b;">${kpis.settlementRate}%</div></td>
            </tr>
          </table>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background:#1e293b; color:#ffffff;">
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Claim Ref</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Buyer Name</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Style No</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Buyer PO</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Defect Category</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Severity</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:right;">Claim (USD)</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Status</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">QA Lead</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Reported</th>
                <th style="padding:6px 8px; border:1px solid #0f172a; text-align:left;">Root Cause Summary</th>
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
    link.setAttribute('download', `customer_claims_register_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export Customer Complaints Excel:', err);
  }
}

/**
 * Export single customer complaint 8D investigation sheet as official printable / PDF
 */
export function exportSingleComplaintPdf(complaint: CustomerComplaint): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable investigation sheet.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const exportConfig = getModuleExportConfig(pdfSettings, 'complaint', 'single', complaint.complaintNumber);
    const docCode = exportConfig.fullDocCode;

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      `${exportConfig.title}: ${complaint.complaintNumber}`,
      docCode,
      complaint.reportedDate || new Date().toISOString().split('T')[0],
      `${exportConfig.department} • ${complaint.buyerName} Style ${complaint.styleNumber}`
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${complaint.complaintNumber} - 8D Investigation Report</title>
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
            .claim-banner { display: flex; justify-content: space-between; align-items: center; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; }
            .box-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; }
            .box-title { font-size: 10.5px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
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

          <div class="claim-banner" style="${
            complaint.status === 'SETTLED'
              ? 'background:#f0fdf4; border:1px solid #86efac; color:#166534;'
              : complaint.status === 'REJECTED'
              ? 'background:#f1f5f9; border:1px solid #cbd5e1; color:#475569;'
              : 'background:#fef2f2; border:1px solid #fecaca; color:#991b1b;'
          }">
            <div>
              <div style="font-size:13px; font-weight:800; text-transform:uppercase;">
                DISPUTED CLAIM: $${complaint.claimAmountUSD.toLocaleString()} USD &bull; STATUS: ${complaint.status.replace(/_/g, ' ')}
              </div>
              <div style="font-size:10px; margin-top:2px;">
                Settlement Type: <strong>${complaint.settlementType ? complaint.settlementType.replace(/_/g, ' ') : 'UNDER NEGOTIATION'}</strong> &bull; Resolution: <strong>${complaint.resolutionDate || 'Pending Final Agreement'}</strong>
              </div>
            </div>
            <div style="text-align:right;">
              <span class="badge" style="background:#fff; color:#0f172a; border:1px solid #cbd5e1; font-size:10px;">
                ${complaint.severity} SEVERITY
              </span>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><span class="meta-lbl">Claim Ref:</span><span class="meta-val font-mono">${complaint.complaintNumber}</span></div>
            <div class="meta-item"><span class="meta-lbl">Retail Buyer:</span><span class="meta-val">${complaint.buyerName}</span></div>
            <div class="meta-item"><span class="meta-lbl">Brand / Division:</span><span class="meta-val">${complaint.brand || 'Retail Global'}</span></div>
            <div class="meta-item"><span class="meta-lbl">Style No:</span><span class="meta-val font-mono">${complaint.styleNumber}</span></div>
            <div class="meta-item"><span class="meta-lbl">Buyer PO:</span><span class="meta-val font-mono">${complaint.poNumber}</span></div>
            <div class="meta-item"><span class="meta-lbl">Defect Category:</span><span class="meta-val">${complaint.defectCategory.replace(/_/g, ' ')}</span></div>
            <div class="meta-item"><span class="meta-lbl">Affected Garments:</span><span class="meta-val">${(complaint.affectedQuantityPcs || 0).toLocaleString()} pcs</span></div>
            <div class="meta-item"><span class="meta-lbl">QA Lead:</span><span class="meta-val">${complaint.assignedEngineer}</span></div>
          </div>

          <!-- Problem & Buyer Feedback -->
          <div class="box-card" style="border-left:4px solid #ef4444; background:#fef2f2;">
            <div class="box-title" style="color:#b91c1c;">1. Defect Observation &amp; Buyer Notification</div>
            <div style="font-weight:600; color:#0f172a; margin-bottom:4px;">${complaint.styleDescription || complaint.defectCategory.replace(/_/g, ' ')}</div>
            <div style="color:#475569; line-height:1.5;">${complaint.buyerFeedback || 'Buyer reported critical non-conformance exceeding acceptable AQL thresholds upon destination distribution center delivery.'}</div>
          </div>

          <!-- Root Cause Analysis -->
          <div class="box-card" style="border-left:4px solid #3b82f6; background:#eff6ff;">
            <div class="box-title" style="color:#1d4ed8;">2. Factory Root Cause Analysis (RCA)</div>
            <div style="color:#475569; line-height:1.5;">${complaint.rootCauseSummary || 'Floor investigation determined production seam calibration failure combined with inline inspection sampling bypass.'}</div>
            <div style="font-size:9.5px; color:#64748b; margin-top:4px;">
              Manufacturing Source: <strong>${complaint.sewingLineOrUnit || 'Floor Sewing Section'}</strong>
            </div>
          </div>

          <!-- Containment & Corrective Action -->
          <div class="box-card" style="border-left:4px solid #f59e0b; background:#fffbeb;">
            <div class="box-title" style="color:#b45309;">3. Containment &amp; Corrective Action Taken</div>
            <div style="color:#475569; line-height:1.5; margin-bottom:4px;"><strong>Containment:</strong> ${complaint.containmentAction || 'Full warehouse lot quarantined and 100% re-inspected.'}</div>
            <div style="color:#475569; line-height:1.5;"><strong>Corrective Action:</strong> ${complaint.correctiveAction || 'Machine reset, operator retraining, and revised inline QA frequency instituted.'}</div>
          </div>

          <!-- Preventive Action & Standardization -->
          <div class="box-card" style="border-left:4px solid #10b981; background:#f0fdf4;">
            <div class="box-title" style="color:#047857;">4. Preventive Action &amp; Systemic Standardization</div>
            <div style="color:#475569; line-height:1.5;">${complaint.preventiveAction || 'SOP updated, critical tolerance parameters locked in pre-production tech pack, and buyer pre-shipment sign-off checklist verified.'}</div>
          </div>

          <div class="sign-strip">
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Investigating Engineer</div><div class="sign-dept">${complaint.assignedEngineer}</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Merchandiser In-Charge</div><div class="sign-dept">Commercial Accounts</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Head of Quality (QMS)</div><div class="sign-dept">Quality Compliance</div></div>
            <div class="sign-col"><div class="sign-line"></div><div class="sign-role">Executive Sign-off</div><div class="sign-dept">General Manager</div></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export single complaint PDF:', err);
  }
}

/**
 * Export single complaint as styled Excel workbook (.xls)
 */
export function exportSingleComplaintExcel(complaint: CustomerComplaint): void {
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
            <tr><td colspan="4" style="font-size:13pt; font-weight:bold; color:#0f172a;">Customer Claim Investigation: ${complaint.complaintNumber}</td></tr>
            <tr><td colspan="4" style="font-size:9pt; color:#64748b; padding-bottom:8px;">Buyer: ${complaint.buyerName} | Style: ${complaint.styleNumber} | Generated: ${new Date().toLocaleString()}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#f1f5f9;">
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; width:20%;">Claim Ref:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; width:30%; font-family:monospace; font-weight:bold; color:#1e3a8a;">${complaint.complaintNumber}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; width:20%;">Reported Date:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; width:30%;">${complaint.reportedDate}</td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Buyer Name:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${complaint.buyerName}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Brand:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${complaint.brand || 'Retail'}</td>
            </tr>
            <tr style="background:#f1f5f9;">
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Style Number:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-family:monospace;">${complaint.styleNumber}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Buyer PO:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-family:monospace;">${complaint.poNumber}</td>
            </tr>
            <tr>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Defect Category:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${complaint.defectCategory}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Severity:</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; color:${complaint.severity === 'CRITICAL' ? '#b91c1c' : '#1d4ed8'};">${complaint.severity}</td>
            </tr>
            <tr style="background:#fef2f2;">
              <td style="border:1px solid #fca5a5; padding:6px; font-weight:bold; color:#991b1b;">Claim Amount (USD):</td>
              <td style="border:1px solid #fca5a5; padding:6px; font-weight:bold; color:#dc2626; font-size:12pt;">$${complaint.claimAmountUSD.toLocaleString()}</td>
              <td style="border:1px solid #fca5a5; padding:6px; font-weight:bold; color:#991b1b;">Claim Status:</td>
              <td style="border:1px solid #fca5a5; padding:6px; font-weight:bold; color:#991b1b;">${complaint.status}</td>
            </tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">1. Defect Summary &amp; Buyer Feedback</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${complaint.buyerFeedback || 'Claim registered by buyer destination warehouse.'}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">2. Factory Root Cause Analysis</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${complaint.rootCauseSummary || 'Root cause investigation completed by QA team.'}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">3. Containment &amp; Corrective Action</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${complaint.correctiveAction || complaint.containmentAction || 'Actions implemented on production line.'}</td></tr>
          </table>

          <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#1e293b; color:#fff;"><th colspan="4" style="padding:6px; text-align:left;">4. Preventive Action &amp; Settlement</th></tr>
            <tr><td colspan="4" style="border:1px solid #cbd5e1; padding:8px;">${complaint.preventiveAction || 'SOP update and training documented.'}</td></tr>
            <tr style="background:#f1f5f9;">
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Settlement Type:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${complaint.settlementType || 'Under negotiation'}</td>
              <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold;">Resolution Date:</td>
              <td style="border:1px solid #cbd5e1; padding:6px;">${complaint.resolutionDate || 'Pending'}</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${complaint.complaintNumber}_Claim_Report.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export single complaint Excel:', err);
  }
}
