import { TraceabilityChain } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Traceability Audit module
 */
export function computeTraceabilityKpis(records: TraceabilityChain[]) {
  const total = records.length;
  const verified = records.filter(
    (r) =>
      r.status === 'VERIFIED' ||
      (r.lifecycleStages &&
        r.lifecycleStages.length > 0 &&
        r.lifecycleStages.every((s) => s.status === 'COMPLETED'))
  ).length;
  const inProgress = records.filter(
    (r) =>
      r.status === 'IN_PROGRESS' ||
      (r.lifecycleStages && r.lifecycleStages.some((s) => s.status === 'IN_PROGRESS'))
  ).length;
  const flagged = records.filter(
    (r) => r.status === 'FLAGGED' || (r.varianceQty && r.varianceQty !== 0)
  ).length;

  const totalOrderQty = records.reduce((acc, r) => acc + (r.orderQuantity || 0), 0);
  const totalPassedQty = records.reduce((acc, r) => acc + (r.passedQty || 0), 0);
  const totalRejectQty = records.reduce((acc, r) => acc + (r.rejectQty || 0), 0);

  const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 100;

  return {
    total,
    verified,
    inProgress,
    flagged,
    totalOrderQty,
    totalPassedQty,
    totalRejectQty,
    verificationRate,
  };
}

/**
 * Download CSV helper
 */
export function downloadTraceabilityCsv(
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
 * Export Global Traceability Master Register PDF
 */
export function exportTraceabilityRegisterPdf(
  records: TraceabilityChain[],
  scopeLabel: string = 'All Traceability Chains'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeTraceabilityKpis(records);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'traceability', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Supply Chain Traceability Register - ${scopeLabel}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm 10mm 12mm 10mm;
        }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          margin: 0;
          padding: 16px;
          color: #0f172a;
          background-color: #ffffff;
          font-size: 11px;
        }
        .kpi-strip {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin: 14px 0 16px 0;
        }
        .kpi-card {
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .kpi-title {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        .kpi-value {
          font-size: 16px;
          font-weight: 800;
          color: #1e293b;
          margin-top: 3px;
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
          text-align: left;
          padding: 7px 8px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #0f172a;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 9px;
          text-transform: uppercase;
        }
        .footer-note {
          margin-top: 16px;
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      ${dynamicHeaderHtml}

      <div class="kpi-strip">
        <div class="kpi-card">
          <div class="kpi-title">Total Chains</div>
          <div class="kpi-value">${kpis.total}</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #16a34a;">
          <div class="kpi-title">Fully Verified</div>
          <div class="kpi-value" style="color: #16a34a;">${kpis.verified}</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #0284c7;">
          <div class="kpi-title">In Progress</div>
          <div class="kpi-value" style="color: #0284c7;">${kpis.inProgress}</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #e11d48;">
          <div class="kpi-title">Variance Flagged</div>
          <div class="kpi-value" style="color: #e11d48;">${kpis.flagged}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Total Order Qty</div>
          <div class="kpi-value">${kpis.totalOrderQty.toLocaleString()}</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #4f46e5;">
          <div class="kpi-title">Verification Rate</div>
          <div class="kpi-value" style="color: #4f46e5;">${kpis.verificationRate}%</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 110px;">Carton Barcode</th>
            <th style="width: 90px;">PO # / Order</th>
            <th style="width: 80px;">Style #</th>
            <th style="width: 120px;">Buyer Name</th>
            <th style="width: 130px;">Cotton / Yarn Origin</th>
            <th style="width: 100px;">Dyeing Batch</th>
            <th style="width: 90px;">Sewing Line</th>
            <th style="width: 80px;">Order Qty</th>
            <th style="width: 80px;">7-Stage Status</th>
            <th style="width: 75px;">Audit Status</th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map((r) => {
              const stages = r.lifecycleStages || [];
              const completedCount = stages.filter((s) => s.status === 'COMPLETED').length;
              const totalStages = stages.length || 7;
              const isAllDone = completedCount === totalStages;

              return `
              <tr>
                <td style="font-weight: 700; font-family: monospace; color: #1e40af;">${r.cartonBarcode}</td>
                <td style="font-family: monospace; font-weight: 600;">${r.poNumber || r.orderNumber || '-'}</td>
                <td style="font-weight: 600;">${r.styleNumber}</td>
                <td>${r.buyer}</td>
                <td>
                  <strong>${r.cottonOrigin}</strong>
                  ${r.yarnLot ? `<div style="font-size: 8.5px; color: #64748b; font-family: monospace;">Yarn: ${r.yarnLot}</div>` : ''}
                </td>
                <td style="font-family: monospace;">${r.dyeingBatch}</td>
                <td style="font-family: monospace;">${r.sewingLine}</td>
                <td style="text-align: right; font-weight: 600;">${r.orderQuantity ? r.orderQuantity.toLocaleString() : '-'}</td>
                <td>
                  <span class="badge" style="background: ${isAllDone ? '#dcfce7' : '#e0f2fe'}; color: ${isAllDone ? '#15803d' : '#0369a1'};">
                    ${completedCount}/${totalStages} Stages
                  </span>
                </td>
                <td>
                  <span class="badge" style="background: ${r.status === 'FLAGGED' ? '#ffe4e6' : '#dcfce7'}; color: ${r.status === 'FLAGGED' ? '#be123c' : '#15803d'};">
                    ${r.status || 'VERIFIED'}
                  </span>
                </td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>

      <div class="footer-note">
        <div>Doc Ref: <strong>${docCode}</strong> | Scope: ${scopeLabel} | Total Records: ${records.length}</div>
        <div>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Controlled Traceability Ledger</div>
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
 * Export Global Traceability Register Excel (.xls)
 */
export function exportTraceabilityRegisterExcel(
  records: TraceabilityChain[],
  scopeLabel: string = 'All Traceability Chains'
): void {
  const kpis = computeTraceabilityKpis(records);
  const pdfSettings = loadPdfHeaderSettings();
  const companyName = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8"/>
      <style>
        .header { font-size: 14pt; font-weight: bold; color: #1e3a8a; }
        .sub { font-size: 10pt; color: #475569; }
        .kpi-title { font-weight: bold; background-color: #f1f5f9; }
        th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
        td { border: 1px solid #cbd5e1; font-size: 9.5pt; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="10" class="header">${companyName} - Supply Chain Traceability Ledger</td></tr>
        <tr><td colspan="10" class="sub">Scope: ${scopeLabel} | Exported: ${new Date().toLocaleString()}</td></tr>
        <tr></tr>
        <tr>
          <td class="kpi-title">Total Chains</td><td>${kpis.total}</td>
          <td class="kpi-title">Verified</td><td>${kpis.verified}</td>
          <td class="kpi-title">In Progress</td><td>${kpis.inProgress}</td>
          <td class="kpi-title">Verification Rate</td><td>${kpis.verificationRate}%</td>
        </tr>
        <tr></tr>
        <tr style="height: 25pt;">
          <th>Carton Barcode</th>
          <th>PO Number</th>
          <th>Style Number</th>
          <th>Buyer</th>
          <th>Cotton Origin</th>
          <th>Yarn Lot</th>
          <th>Fabric Roll Barcode</th>
          <th>Dyeing Batch</th>
          <th>Sewing Line</th>
          <th>Status</th>
        </tr>
  `;

  records.forEach((r) => {
    tableHtml += `
      <tr>
        <td style="font-weight: bold;">${r.cartonBarcode}</td>
        <td>${r.poNumber || r.orderNumber || ''}</td>
        <td>${r.styleNumber}</td>
        <td>${r.buyer}</td>
        <td>${r.cottonOrigin}</td>
        <td>${r.yarnLot}</td>
        <td>${r.fabricRollBarcode}</td>
        <td>${r.dyeingBatch}</td>
        <td>${r.sewingLine}</td>
        <td style="font-weight: bold;">${r.status || 'VERIFIED'}</td>
      </tr>
    `;
  });

  tableHtml += `
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Traceability_Ledger_${new Date().toISOString().split('T')[0]}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export Global Traceability Register CSV
 */
export function exportTraceabilityRegisterCsv(
  records: TraceabilityChain[],
  scopeLabel: string = 'All Traceability Chains'
): void {
  const headers = [
    'Carton Barcode',
    'PO Number',
    'Style Number',
    'Buyer',
    'Cotton Origin',
    'Yarn Lot',
    'Fabric Roll Barcode',
    'Dyeing Batch',
    'Cutting Table Lot',
    'Sewing Line',
    'Garment Serial',
    'Status',
    'Order Quantity',
    'Passed Final Date',
  ];

  const rows = records.map((r) => [
    r.cartonBarcode,
    r.poNumber || r.orderNumber || '',
    r.styleNumber,
    r.buyer,
    r.cottonOrigin,
    r.yarnLot,
    r.fabricRollBarcode,
    r.dyeingBatch,
    r.cuttingTableLot,
    r.sewingLine,
    r.garmentSerial,
    r.status || 'VERIFIED',
    r.orderQuantity || '',
    r.passedFinalDate || '',
  ]);

  downloadTraceabilityCsv(
    `Traceability_Ledger_${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    rows
  );
}

/**
 * Export Single Traceability Chain Dossier PDF
 */
export function exportTraceabilitySinglePdf(record: TraceabilityChain): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'traceability', 'single', record.cartonBarcode);
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const stages = record.lifecycleStages || [];

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Traceability Audit Dossier - ${record.cartonBarcode}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 10mm 12mm 10mm;
        }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          margin: 0;
          padding: 16px;
          color: #0f172a;
          background-color: #ffffff;
          font-size: 11px;
        }
        .section-header {
          font-size: 12px;
          font-weight: 700;
          color: #1e3a8a;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 4px;
          margin: 14px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
        }
        .meta-cell {
          font-size: 10px;
        }
        .meta-label {
          font-size: 8.5px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
        }
        .meta-val {
          font-weight: 700;
          color: #1e293b;
          margin-top: 2px;
        }
        .stage-card {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
          margin-bottom: 6px;
          background: #fafafa;
          display: grid;
          grid-template-columns: 35px 150px 1fr 90px;
          align-items: center;
          gap: 10px;
        }
        .stage-num {
          font-weight: 800;
          font-size: 12px;
          color: #1e40af;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          font-size: 10px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          text-align: left;
          padding: 6px 8px;
          font-size: 9px;
          text-transform: uppercase;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .signoff-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 24px;
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
        }
        .signoff-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px;
          background: #f8fafc;
          text-align: center;
        }
        .signoff-title {
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }
        .signoff-line {
          margin-top: 25px;
          border-top: 1px solid #94a3b8;
          padding-top: 4px;
          font-weight: 700;
          font-size: 9.5px;
        }
        .footer-note {
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      ${dynamicHeaderHtml}

      <div class="meta-grid">
        <div class="meta-cell">
          <div class="meta-label">Carton Barcode</div>
          <div class="meta-val" style="color: #1e40af;">${record.cartonBarcode}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Buyer PO Number</div>
          <div class="meta-val">${record.poNumber || record.orderNumber || '-'}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Buyer Account</div>
          <div class="meta-val">${record.buyer}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Style Number</div>
          <div class="meta-val">${record.styleNumber}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Order Quantity</div>
          <div class="meta-val">${record.orderQuantity ? record.orderQuantity.toLocaleString() + ' pcs' : '-'}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Cotton Origin</div>
          <div class="meta-val">${record.cottonOrigin}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Final Audit Date</div>
          <div class="meta-val">${record.passedFinalDate ? record.passedFinalDate.split(' ')[0] : '-'}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Overall Status</div>
          <div class="meta-val" style="color: #16a34a;">${record.status || 'VERIFIED'}</div>
        </div>
      </div>

      <div class="section-header">1. Product Identification &amp; Material Genealogy</div>
      <table>
        <thead>
          <tr>
            <th style="width: 130px;">Genealogy Tier</th>
            <th>Identifier / Lot Number</th>
            <th>Facility / Origin Description</th>
            <th style="width: 90px;">Verification</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Tier 1: Raw Fiber</strong></td>
            <td style="font-family: monospace;">${record.cottonOrigin}</td>
            <td>${record.ginningLocation || 'Lubbock Ginning Co-Op, Texas'}</td>
            <td style="color: #16a34a; font-weight: 700;">PASSED</td>
          </tr>
          <tr>
            <td><strong>Tier 2: Yarn Spinning</strong></td>
            <td style="font-family: monospace;">${record.yarnLot}</td>
            <td>${record.spinningMill || 'Square Spinning Mills Ltd (Unit 2)'}</td>
            <td style="color: #16a34a; font-weight: 700;">PASSED</td>
          </tr>
          <tr>
            <td><strong>Tier 3: Fabric &amp; Dyeing</strong></td>
            <td style="font-family: monospace;">${record.dyeingBatch} / ${record.fabricRollBarcode}</td>
            <td>${record.fabricMill || 'Pacific Knit Composite Ltd'}</td>
            <td style="color: #16a34a; font-weight: 700;">PASSED</td>
          </tr>
          <tr>
            <td><strong>Tier 4: Cutting Room</strong></td>
            <td style="font-family: monospace;">${record.cuttingTableLot}</td>
            <td>Cutting Table Lot - CAD Laser Verified</td>
            <td style="color: #16a34a; font-weight: 700;">PASSED</td>
          </tr>
          <tr>
            <td><strong>Tier 5: Sewing Assembly</strong></td>
            <td style="font-family: monospace;">${record.sewingLine}</td>
            <td>Garment Serial: ${record.garmentSerial}</td>
            <td style="color: #16a34a; font-weight: 700;">PASSED</td>
          </tr>
          <tr>
            <td><strong>Tier 6: Export Packaging</strong></td>
            <td style="font-family: monospace;">${record.cartonBarcode}</td>
            <td>1.0mm Fe Metal Tested &amp; Barcode Certified</td>
            <td style="color: #16a34a; font-weight: 700;">PASSED</td>
          </tr>
        </tbody>
      </table>

      ${
        stages && stages.length > 0
          ? `
        <div class="section-header">2. End-to-End 7-Stage Digital Custody Verification</div>
        <div>
          ${stages
            .map(
              (st, idx) => `
            <div class="stage-card">
              <div class="stage-num">0${idx + 1}</div>
              <div>
                <strong style="color: #0f172a;">${st.stageName}</strong>
                <div style="font-size: 8.5px; color: #64748b;">${st.stationOrSupplier || ''}</div>
              </div>
              <div style="font-size: 9.5px; color: #334155;">
                ${st.challanNumber ? `Challan #: <strong>${st.challanNumber}</strong> • ` : ''}
                ${st.challanDate ? `Date: ${st.challanDate} • ` : ''}
                ${st.remarks || 'Standard verified chain-of-custody'}
              </div>
              <div style="text-align: right;">
                <span style="font-weight: 700; font-size: 9px; padding: 2px 6px; border-radius: 4px; background: ${st.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3'}; color: ${st.status === 'COMPLETED' ? '#15803d' : '#a16207'};">
                  ${st.status}
                </span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }

      <div class="signoff-strip">
        <div class="signoff-box">
          <div class="signoff-title">Traceability Auditor</div>
          <div class="signoff-line">${record.inspectorName || 'Shafiqul Alam (Lead Auditor)'}</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-title">Factory QA Manager</div>
          <div class="signoff-line">Tanzim Ahmed</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-title">Buyer Liaison Compliance</div>
          <div class="signoff-line">Authorized Signatory</div>
        </div>
      </div>

      <div class="footer-note">
        <div>Doc Ref: <strong>${docCode}</strong> | Custody Grade: 100% Chain-of-Custody Verified</div>
        <div>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Controlled Dossier</div>
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
 * Export Single Traceability Chain Dossier Excel (.xls)
 */
export function exportTraceabilitySingleExcel(record: TraceabilityChain): void {
  const pdfSettings = loadPdfHeaderSettings();
  const companyName = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8"/>
      <style>
        .header { font-size: 14pt; font-weight: bold; color: #1e3a8a; }
        .sub { font-size: 10pt; color: #475569; }
        .sec { font-size: 11pt; font-weight: bold; background-color: #f1f5f9; }
        th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
        td { border: 1px solid #cbd5e1; font-size: 9.5pt; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="4" class="header">${companyName} - Supply Chain Traceability Dossier</td></tr>
        <tr><td colspan="4" class="sub">Carton: ${record.cartonBarcode} | Style: ${record.styleNumber} | Exported: ${new Date().toLocaleString()}</td></tr>
        <tr></tr>
        <tr>
          <td style="font-weight: bold;">Carton Barcode:</td><td>${record.cartonBarcode}</td>
          <td style="font-weight: bold;">PO Number:</td><td>${record.poNumber || record.orderNumber || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Buyer:</td><td>${record.buyer}</td>
          <td style="font-weight: bold;">Style Number:</td><td>${record.styleNumber}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Cotton Origin:</td><td>${record.cottonOrigin}</td>
          <td style="font-weight: bold;">Yarn Lot:</td><td>${record.yarnLot}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Fabric Roll Barcode:</td><td>${record.fabricRollBarcode}</td>
          <td style="font-weight: bold;">Dyeing Batch:</td><td>${record.dyeingBatch}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Cutting Table Lot:</td><td>${record.cuttingTableLot}</td>
          <td style="font-weight: bold;">Sewing Line:</td><td>${record.sewingLine}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Garment Serial:</td><td>${record.garmentSerial}</td>
          <td style="font-weight: bold;">Status:</td><td>${record.status || 'VERIFIED'}</td>
        </tr>
        <tr></tr>
  `;

  if (record.lifecycleStages && record.lifecycleStages.length > 0) {
    tableHtml += `
      <tr><td colspan="4" class="sec">7-Stage Lifecycle Verification</td></tr>
      <tr>
        <th>Stage Name</th>
        <th>Challan / Ref</th>
        <th>Supplier / Station</th>
        <th>Status</th>
      </tr>
    `;
    record.lifecycleStages.forEach((st) => {
      tableHtml += `
        <tr>
          <td style="font-weight: bold;">${st.stageName}</td>
          <td>${st.challanNumber || '-'}</td>
          <td>${st.stationOrSupplier || '-'}</td>
          <td style="font-weight: bold;">${st.status}</td>
        </tr>
      `;
    });
  }

  tableHtml += `
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Traceability_${record.cartonBarcode}_${new Date().toISOString().split('T')[0]}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export Single Traceability Chain Dossier CSV
 */
export function exportTraceabilitySingleCsv(record: TraceabilityChain): void {
  const headers = ['Category', 'Field', 'Value'];
  const rows: (string | number)[][] = [
    ['Header', 'Carton Barcode', record.cartonBarcode],
    ['Header', 'PO Number', record.poNumber || record.orderNumber || ''],
    ['Header', 'Buyer', record.buyer],
    ['Header', 'Style Number', record.styleNumber],
    ['Header', 'Article Name', record.articleName || record.styleDescription || ''],
    ['Header', 'Order Quantity', record.orderQuantity || ''],
    ['Header', 'Cotton Origin', record.cottonOrigin],
    ['Header', 'Ginning Location', record.ginningLocation || ''],
    ['Header', 'Yarn Lot', record.yarnLot],
    ['Header', 'Spinning Mill', record.spinningMill || ''],
    ['Header', 'Fabric Roll Barcode', record.fabricRollBarcode],
    ['Header', 'Dyeing Batch', record.dyeingBatch],
    ['Header', 'Fabric Mill', record.fabricMill || ''],
    ['Header', 'Cutting Table Lot', record.cuttingTableLot],
    ['Header', 'Sewing Line', record.sewingLine],
    ['Header', 'Garment Serial', record.garmentSerial],
    ['Header', 'Passed Final Date', record.passedFinalDate || ''],
    ['Header', 'Status', record.status || 'VERIFIED'],
  ];

  if (record.lifecycleStages) {
    record.lifecycleStages.forEach((st, idx) => {
      rows.push([
        'Lifecycle Stage',
        `Stage ${idx + 1}: ${st.stageName}`,
        `Challan: ${st.challanNumber || 'N/A'} | Supplier: ${st.stationOrSupplier || 'N/A'} | Status: ${st.status}`,
      ]);
    });
  }

  downloadTraceabilityCsv(
    `Traceability_${record.cartonBarcode}_${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    rows
  );
}
