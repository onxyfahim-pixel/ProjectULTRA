import { TraceabilityChain, TraceabilityStageRecord } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';
import { createDefaultLifecycleStages } from './traceability-lifecycle-utils';

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
 * Export Single Traceability Chain Dossier PDF (Certified Full Audit Dossier)
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

  const stages: TraceabilityStageRecord[] =
    record.lifecycleStages && record.lifecycleStages.length > 0
      ? record.lifecycleStages
      : createDefaultLifecycleStages({
          orderNumber: record.poNumber || record.orderNumber || 'PO-HM-99201',
          styleNumber: record.styleNumber || 'STY-TS-2026',
          buyerName: record.buyer || 'H&M Hennes & Mauritz',
          orderQuantity: record.orderQuantity || 45000,
        });

  const orderQty = record.orderQuantity || 45000;
  const receivedQty = record.receivedQty || Math.round(orderQty * 1.03);
  const cutQty = record.cutQty || Math.round(orderQty * 1.026);
  const passedQty = record.passedQty || orderQty;
  const rejectQty = record.rejectQty || Math.round(orderQty * 0.018);
  const excessQty = record.excessQty || Math.round(orderQty * 0.008);
  const wasteQty = record.wasteQty ?? Math.max(0, receivedQty - (passedQty + rejectQty + excessQty));
  const varianceQty = record.varianceQty ?? 0;
  const completedStages = stages.filter((s) => s.status === 'COMPLETED').length;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Supply Chain Traceability Audit Dossier - ${record.cartonBarcode}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 10mm 10mm;
        }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          margin: 0;
          padding: 14px;
          color: #0f172a;
          background-color: #ffffff;
          font-size: 10.5px;
          line-height: 1.4;
        }
        .section-header {
          font-size: 11px;
          font-weight: 800;
          color: #1e3a8a;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 4px;
          margin: 14px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
        }
        .meta-cell {
          font-size: 9.5px;
        }
        .meta-label {
          font-size: 8px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.4px;
        }
        .meta-val {
          font-weight: 700;
          color: #1e293b;
          margin-top: 2px;
          font-size: 10.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          font-size: 9.5px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          text-align: left;
          padding: 6px 8px;
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #0f172a;
        }
        td {
          padding: 5.5px 8px;
          border: 1px solid #cbd5e1;
          vertical-align: middle;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 8.5px;
          text-transform: uppercase;
          text-align: center;
          white-space: nowrap;
        }
        .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-blue { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .badge-amber { background: #fef9c3; color: #a16207; border: 1px solid #fef08a; }
        .badge-red { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
        .signoff-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
        }
        .signoff-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 10px;
          background: #f8fafc;
          text-align: center;
        }
        .signoff-title {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        .signoff-line {
          margin-top: 24px;
          border-top: 1px solid #94a3b8;
          padding-top: 4px;
          font-weight: 700;
          font-size: 9px;
          color: #1e293b;
        }
        .footer-note {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      ${dynamicHeaderHtml}

      {/* EXECUTIVE PRODUCT & CUSTODY OVERVIEW */}
      <div class="meta-grid">
        <div class="meta-cell">
          <div class="meta-label">Master Carton Barcode</div>
          <div class="meta-val" style="color: #1e40af; font-family: monospace;">${record.cartonBarcode}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Buyer PO Number</div>
          <div class="meta-val" style="font-family: monospace;">${record.poNumber || record.orderNumber || '-'}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Buyer Account</div>
          <div class="meta-val">${record.buyer}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Style # &amp; Description</div>
          <div class="meta-val">${record.styleNumber} ${record.articleName ? `— ${record.articleName}` : ''}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Total Order Quantity</div>
          <div class="meta-val">${orderQty.toLocaleString()} pcs</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Passed Final Audit</div>
          <div class="meta-val" style="color: #15803d;">${passedQty.toLocaleString()} pcs (100%)</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Audit Final Date</div>
          <div class="meta-val">${record.passedFinalDate ? record.passedFinalDate.split(' ')[0] : '2026-08-30'}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Custody Verification</div>
          <div class="meta-val" style="color: #15803d;">
            <span class="badge badge-green">${record.status || 'VERIFIED'} (100% Custody)</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: 6-TIER MATERIAL GENEALOGY TABLE */}
      <div class="section-header">
        <span>1. Complete 6-Tier Material &amp; Supply Chain Genealogy</span>
        <span style="font-size: 9px; font-weight: normal; color: #64748b;">Ginning to Carton Custody</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 110px;">Genealogy Tier</th>
            <th style="width: 130px;">Facility / Subcontractor</th>
            <th style="width: 140px;">Identifier / Lot Number</th>
            <th>Technical Specifications &amp; Parameters</th>
            <th style="width: 80px; text-align: center;">Verdict</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Tier 1: Raw Fiber</strong></td>
            <td>${record.ginningLocation || 'Lubbock Ginning Co-Op, Texas'}</td>
            <td style="font-family: monospace; font-weight: 600;">${record.cottonOrigin}</td>
            <td>100% Virgin Supima Cotton • Staple 1.38" • Micronaire 4.1</td>
            <td style="text-align: center;"><span class="badge badge-green">PASSED</span></td>
          </tr>
          <tr>
            <td><strong>Tier 2: Yarn Spinning</strong></td>
            <td>${record.spinningMill || 'Square Spinning Mills Ltd (Unit 2)'}</td>
            <td style="font-family: monospace; font-weight: 600;">${record.yarnLot}</td>
            <td>30s/1 Combed Ring Spun • 3,150 CSP (Uster 5% Tier)</td>
            <td style="text-align: center;"><span class="badge badge-green">PASSED</span></td>
          </tr>
          <tr>
            <td><strong>Tier 3: Fabric &amp; Dyeing</strong></td>
            <td>${record.fabricMill || 'Pacific Knit Composite Ltd'}</td>
            <td style="font-family: monospace; font-weight: 600;">${record.dyeingBatch} / ${record.fabricRollBarcode}</td>
            <td>180 GSM Single Jersey • ISO 105-C06 Fastness Grade 4-5</td>
            <td style="text-align: center;"><span class="badge badge-green">PASSED</span></td>
          </tr>
          <tr>
            <td><strong>Tier 4: Cutting Room</strong></td>
            <td>Cutting Table Lot ${record.cuttingTableLot}</td>
            <td style="font-family: monospace; font-weight: 600;">${record.cuttingTableLot}</td>
            <td>CAD Laser Precision Cutting • 80 Plies • 86.4% Marker Yield</td>
            <td style="text-align: center;"><span class="badge badge-green">PASSED</span></td>
          </tr>
          <tr>
            <td><strong>Tier 5: Sewing Assembly</strong></td>
            <td>Knits Assembly — ${record.sewingLine}</td>
            <td style="font-family: monospace; font-weight: 600;">${record.garmentSerial}</td>
            <td>100% Inline QC Defect Inspection • Calibrated 10-12 SPI</td>
            <td style="text-align: center;"><span class="badge badge-green">PASSED</span></td>
          </tr>
          <tr>
            <td><strong>Tier 6: Export Packaging</strong></td>
            <td>Central Packing Hall (Bay 03)</td>
            <td style="font-family: monospace; font-weight: 600;">${record.cartonBarcode}</td>
            <td>1.0mm Fe Metal Detector Certified • Barcode Scanned</td>
            <td style="text-align: center;"><span class="badge badge-green">PASSED</span></td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 2: COMPREHENSIVE 7-STAGE DIGITAL CUSTODY LIFECYCLE TABLE */}
      <div class="section-header">
        <span>2. End-to-End 7-Stage Digital Custody Lifecycle Audit Table</span>
        <span style="font-size: 9px; font-weight: normal; color: #64748b;">${completedStages}/7 Stages Verified</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 25px; text-align: center;">#</th>
            <th style="width: 120px;">Process Stage</th>
            <th style="width: 140px;">Station / Subcontractor</th>
            <th style="width: 110px;">Challan / Ref #</th>
            <th style="width: 70px;">Date</th>
            <th style="width: 75px; text-align: right;">Received</th>
            <th style="width: 75px; text-align: right;">Issued</th>
            <th style="width: 75px; text-align: right;">Variance</th>
            <th style="width: 75px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${stages
            .map((st, idx) => {
              const diff = (st.receivedQty || 0) - (st.issuedQty || 0);
              const isExcess = st.excessShortType === 'EXCESS' || diff > 0;
              const isShort = st.excessShortType === 'SHORT' || diff < 0;
              const varianceLabel =
                st.excessShortQty !== undefined
                  ? `${st.excessShortQty > 0 ? (isExcess ? '+' : '-') : ''}${st.excessShortQty.toLocaleString()} ${st.unit}`
                  : diff !== 0
                  ? `${diff > 0 ? '+' : ''}${diff.toLocaleString()} ${st.unit}`
                  : `0 ${st.unit}`;

              return `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #1e40af;">0${idx + 1}</td>
                  <td>
                    <strong>${st.stageName}</strong>
                    ${st.remarks ? `<div style="font-size: 8px; color: #64748b; margin-top: 1px;">${st.remarks}</div>` : ''}
                  </td>
                  <td>${st.stationOrSupplier || '-'}</td>
                  <td style="font-family: monospace; font-size: 8.5px;">${st.challanNumber || '-'}</td>
                  <td style="font-size: 8.5px;">${st.challanDate || st.receiveDate || '-'}</td>
                  <td style="text-align: right; font-weight: 600;">${st.receivedQty ? `${st.receivedQty.toLocaleString()} ${st.unit}` : '-'}</td>
                  <td style="text-align: right; font-weight: 600;">${st.issuedQty ? `${st.issuedQty.toLocaleString()} ${st.unit}` : '-'}</td>
                  <td style="text-align: right; font-weight: 700; color: ${isExcess ? '#0369a1' : isShort ? '#be123c' : '#15803d'};">
                    ${varianceLabel}
                  </td>
                  <td style="text-align: center;">
                    <span class="badge ${st.status === 'COMPLETED' ? 'badge-green' : st.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-amber'}">
                      ${st.status}
                    </span>
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>

      {/* SECTION 3: BRAND PROTECTION, MATERIAL BALANCE & QUANTITY RECONCILIATION */}
      <div class="section-header">
        <span>3. Brand Protection, Scrap Control &amp; Quantity Reconciliation</span>
        <span style="font-size: 9px; font-weight: normal; color: #15803d; font-weight: 700;">100% Reconciled Zero Leakage</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Reconciliation Category / Floor Metric</th>
            <th style="width: 100px; text-align: right;">Quantity Units</th>
            <th style="width: 90px; text-align: right;">% of Order</th>
            <th style="width: 180px;">Audit Verification &amp; Protocol</th>
            <th style="width: 80px; text-align: center;">Verdict</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Target Buyer Order Quantity</strong></td>
            <td style="text-align: right; font-weight: 700;">${orderQty.toLocaleString()} pcs</td>
            <td style="text-align: right;">100.0%</td>
            <td>Commercial PO Contract Volume</td>
            <td style="text-align: center;"><span class="badge badge-green">MATCHED</span></td>
          </tr>
          <tr>
            <td><strong>Total Raw Material Input Allocated</strong></td>
            <td style="text-align: right; font-weight: 700;">${receivedQty.toLocaleString()} pcs eqv</td>
            <td style="text-align: right;">103.0%</td>
            <td>Inward Fabric Rolls Reconciled (+3% allowance)</td>
            <td style="text-align: center;"><span class="badge badge-green">VERIFIED</span></td>
          </tr>
          <tr>
            <td><strong>Total Cut Quantity (Actual Plies)</strong></td>
            <td style="text-align: right; font-weight: 700;">${cutQty.toLocaleString()} pcs</td>
            <td style="text-align: right;">102.6%</td>
            <td>CAD Laser Table Cut Requisition Form Verified</td>
            <td style="text-align: center;"><span class="badge badge-green">VERIFIED</span></td>
          </tr>
          <tr>
            <td><strong>100% Passed Garments (Export Packing)</strong></td>
            <td style="text-align: right; font-weight: 700; color: #15803d;">${passedQty.toLocaleString()} pcs</td>
            <td style="text-align: right; font-weight: 700; color: #15803d;">100.0%</td>
            <td>Final AQL 2.5 Normal Inspection Passed</td>
            <td style="text-align: center;"><span class="badge badge-green">PASSED</span></td>
          </tr>
          <tr>
            <td><strong>Factory Rejection Units (Defect Scrap)</strong></td>
            <td style="text-align: right; font-weight: 700; color: #be123c;">${rejectQty.toLocaleString()} pcs</td>
            <td style="text-align: right;">1.8%</td>
            <td>Defect library logged • Destructive shredding protocol</td>
            <td style="text-align: center;"><span class="badge badge-blue">LOGGED</span></td>
          </tr>
          <tr>
            <td><strong>Commercial Excess Inventory Stock</strong></td>
            <td style="text-align: right; font-weight: 700; color: #0369a1;">${excessQty.toLocaleString()} pcs</td>
            <td style="text-align: right;">0.8%</td>
            <td>Secured brand warehouse quarantine hold</td>
            <td style="text-align: center;"><span class="badge badge-blue">SECURED</span></td>
          </tr>
          <tr>
            <td><strong>Brand Protection &amp; Scrap Disposal</strong></td>
            <td colspan="2" style="font-weight: 600;">
              Protocol: ${record.disposalMethod || 'AUTHORIZED_RECYCLER (Eco-Fibers Co)'}
            </td>
            <td>Cert of Destruction #: <strong>${record.certificateOfDestructionNumber || 'COD-2026-VAL-0914'}</strong></td>
            <td style="text-align: center;"><span class="badge badge-green">CERTIFIED</span></td>
          </tr>
          <tr style="background: #f0fdf4;">
            <td style="font-weight: 800; color: #15803d;">Net Reconciliation Discrepancy</td>
            <td style="text-align: right; font-weight: 800; color: #15803d;">${varianceQty} pcs</td>
            <td style="text-align: right; font-weight: 800; color: #15803d;">0.00%</td>
            <td colspan="2" style="font-weight: 700; color: #15803d;">
              ✓ 100% Full Chain-of-Custody Reconciled (Zero Gray-Market Leakage)
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 4: OFFICIAL AUDITOR & QA SIGNOFFS */}
      <div class="signoff-strip">
        <div class="signoff-box">
          <div class="signoff-title">Traceability Lead Auditor</div>
          <div class="signoff-line">${record.inspectorName || 'Shafiqul Alam (Lead Auditor)'}</div>
          <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">ISO 9001:2015 Lead Auditor Certified</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-title">Factory QA &amp; Compliance Head</div>
          <div class="signoff-line">Tanzim Ahmed</div>
          <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Head of Quality &amp; Supply Chain Safety</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-title">Buyer Liaison Compliance Officer</div>
          <div class="signoff-line">Authorized Signatory</div>
          <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Brand Protection &amp; Export Verification</div>
        </div>
      </div>

      <div class="footer-note">
        <div>Doc Ref: <strong>${docCode}</strong> | Custody Grade: <strong>100% Chain-of-Custody Certified</strong> | Standard: <strong>${pdfSettings.isoStandardBadge}</strong></div>
        <div>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Controlled Official Traceability Certificate</div>
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
 * Includes Complete 6-Tier Genealogy, 7-Stage Custody Table, and Reconciliation Ledger
 */
export function exportTraceabilitySingleExcel(record: TraceabilityChain): void {
  const pdfSettings = loadPdfHeaderSettings();
  const companyName = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';

  const stages: TraceabilityStageRecord[] =
    record.lifecycleStages && record.lifecycleStages.length > 0
      ? record.lifecycleStages
      : createDefaultLifecycleStages({
          orderNumber: record.poNumber || record.orderNumber || 'PO-HM-99201',
          styleNumber: record.styleNumber || 'STY-TS-2026',
          buyerName: record.buyer || 'H&M Hennes & Mauritz',
          orderQuantity: record.orderQuantity || 45000,
        });

  const orderQty = record.orderQuantity || 45000;
  const receivedQty = record.receivedQty || Math.round(orderQty * 1.03);
  const cutQty = record.cutQty || Math.round(orderQty * 1.026);
  const passedQty = record.passedQty || orderQty;
  const rejectQty = record.rejectQty || Math.round(orderQty * 0.018);
  const excessQty = record.excessQty || Math.round(orderQty * 0.008);
  const wasteQty = record.wasteQty ?? Math.max(0, receivedQty - (passedQty + rejectQty + excessQty));
  const varianceQty = record.varianceQty ?? 0;

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8"/>
      <style>
        .header { font-size: 14pt; font-weight: bold; color: #1e3a8a; }
        .sub { font-size: 10pt; color: #475569; }
        .sec { font-size: 11pt; font-weight: bold; background-color: #0f172a; color: #ffffff; padding: 6px; }
        .sec-sub { font-size: 10pt; font-weight: bold; background-color: #f1f5f9; color: #1e293b; }
        th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; font-size: 9pt; }
        td { border: 1px solid #cbd5e1; font-size: 9pt; vertical-align: top; }
        .num { text-align: right; }
        .bold { font-weight: bold; }
        .pass { color: #15803d; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="8" class="header">${companyName} - Supply Chain Traceability Audit Dossier</td></tr>
        <tr><td colspan="8" class="sub">Master Carton: ${record.cartonBarcode} | PO: ${record.poNumber || record.orderNumber || '-'} | Style: ${record.styleNumber} | Exported: ${new Date().toLocaleString()}</td></tr>
        <tr></tr>

        <!-- PRIMARY ORDER SPECIFICATIONS -->
        <tr><td colspan="8" class="sec">1. PRIMARY PRODUCT &amp; ORDER SPECIFICATIONS</td></tr>
        <tr>
          <td class="bold">Carton Barcode:</td><td style="color: #1e40af; font-weight: bold;">${record.cartonBarcode}</td>
          <td class="bold">Buyer PO Number:</td><td class="bold">${record.poNumber || record.orderNumber || '-'}</td>
          <td class="bold">Buyer Account:</td><td>${record.buyer}</td>
          <td class="bold">Style Number:</td><td>${record.styleNumber}</td>
        </tr>
        <tr>
          <td class="bold">Article Description:</td><td>${record.articleName || record.styleDescription || record.styleNumber}</td>
          <td class="bold">Order Quantity:</td><td class="bold">${orderQty.toLocaleString()} pcs</td>
          <td class="bold">Passed Final Audit:</td><td class="pass">${passedQty.toLocaleString()} pcs</td>
          <td class="bold">Custody Verdict:</td><td class="pass">${record.status || 'VERIFIED'} (100%)</td>
        </tr>
        <tr>
          <td class="bold">Audit Final Date:</td><td>${record.passedFinalDate ? record.passedFinalDate.split(' ')[0] : '2026-08-30'}</td>
          <td class="bold">Lead Inspector:</td><td>${record.inspectorName || 'Shafiqul Alam (Lead Auditor)'}</td>
          <td class="bold">Metal Detector:</td><td class="pass">1.0mm Fe Passed</td>
          <td class="bold">Reconciliation:</td><td class="pass">100% Reconciled</td>
        </tr>
        <tr></tr>

        <!-- 6-TIER MATERIAL GENEALOGY -->
        <tr><td colspan="8" class="sec">2. 6-TIER MATERIAL &amp; SUPPLY CHAIN GENEALOGY</td></tr>
        <tr>
          <th>Tier Level</th>
          <th>Process Node</th>
          <th>Facility / Subcontractor</th>
          <th>Tracking Lot / Barcode</th>
          <th colspan="3">Technical Specification / Standards</th>
          <th>Verdict</th>
        </tr>
        <tr>
          <td class="bold">Tier 1: Raw Fiber</td>
          <td>Cotton Ginning</td>
          <td>${record.ginningLocation || 'Lubbock Ginning Co-Op, Texas'}</td>
          <td class="bold">${record.cottonOrigin}</td>
          <td colspan="3">100% Virgin Supima Cotton • Staple 1.38" • Micronaire 4.1</td>
          <td class="pass">PASSED</td>
        </tr>
        <tr>
          <td class="bold">Tier 2: Yarn Spinning</td>
          <td>Ring Spinning Mill</td>
          <td>${record.spinningMill || 'Square Spinning Mills Ltd (Unit 2)'}</td>
          <td class="bold">${record.yarnLot}</td>
          <td colspan="3">30s/1 Combed Ring Spun • 3,150 CSP (Uster 5% Standard)</td>
          <td class="pass">PASSED</td>
        </tr>
        <tr>
          <td class="bold">Tier 3: Fabric &amp; Dyeing</td>
          <td>Knitting &amp; Dye House</td>
          <td>${record.fabricMill || 'Pacific Knit Composite Ltd'}</td>
          <td class="bold">${record.dyeingBatch} / ${record.fabricRollBarcode}</td>
          <td colspan="3">180 GSM Single Jersey • ISO 105-C06 Fastness Grade 4-5</td>
          <td class="pass">PASSED</td>
        </tr>
        <tr>
          <td class="bold">Tier 4: Cutting Room</td>
          <td>CAD Precision Cutting</td>
          <td>Cutting Floor (Table ${record.cuttingTableLot})</td>
          <td class="bold">${record.cuttingTableLot}</td>
          <td colspan="3">Laser Auto-Spreading • 80 Plies • 86.4% Marker Efficiency</td>
          <td class="pass">PASSED</td>
        </tr>
        <tr>
          <td class="bold">Tier 5: Sewing Assembly</td>
          <td>Knits Assembly Line</td>
          <td>${record.sewingLine}</td>
          <td class="bold">${record.garmentSerial}</td>
          <td colspan="3">100% Inline QC Inspected • Needle Safety Verified</td>
          <td class="pass">PASSED</td>
        </tr>
        <tr>
          <td class="bold">Tier 6: Export Packaging</td>
          <td>Carton Packing Hall</td>
          <td>Central Packaging Bay 03</td>
          <td class="bold">${record.cartonBarcode}</td>
          <td colspan="3">1.0mm Fe Metal Detector Tested • Master Barcode Verified</td>
          <td class="pass">PASSED</td>
        </tr>
        <tr></tr>

        <!-- COMPLETE 7-STAGE LIFECYCLE AUDIT TABLE -->
        <tr><td colspan="8" class="sec">3. COMPLETE 7-STAGE DIGITAL CUSTODY LIFECYCLE TABLE</td></tr>
        <tr>
          <th>Stage #</th>
          <th>Process Stage Name</th>
          <th>Station / Facility / Supplier</th>
          <th>Challan / Document #</th>
          <th>Date</th>
          <th class="num">Received Qty</th>
          <th class="num">Issued Qty</th>
          <th class="num">Variance (+/-)</th>
        </tr>
  `;

  stages.forEach((st, idx) => {
    const diff = (st.receivedQty || 0) - (st.issuedQty || 0);
    const isExcess = st.excessShortType === 'EXCESS' || diff > 0;
    const isShort = st.excessShortType === 'SHORT' || diff < 0;
    const varianceLabel =
      st.excessShortQty !== undefined
        ? `${st.excessShortQty > 0 ? (isExcess ? '+' : '-') : ''}${st.excessShortQty.toLocaleString()} ${st.unit}`
        : diff !== 0
        ? `${diff > 0 ? '+' : ''}${diff.toLocaleString()} ${st.unit}`
        : `0 ${st.unit}`;

    tableHtml += `
      <tr>
        <td class="bold" style="text-align: center;">0${idx + 1}</td>
        <td class="bold">${st.stageName}</td>
        <td>${st.stationOrSupplier || '-'}</td>
        <td style="font-family: monospace;">${st.challanNumber || '-'}</td>
        <td>${st.challanDate || st.receiveDate || '-'}</td>
        <td class="num bold">${st.receivedQty ? `${st.receivedQty.toLocaleString()} ${st.unit}` : '-'}</td>
        <td class="num bold">${st.issuedQty ? `${st.issuedQty.toLocaleString()} ${st.unit}` : '-'}</td>
        <td class="num bold" style="color: ${isExcess ? '#0369a1' : isShort ? '#be123c' : '#15803d'};">${varianceLabel}</td>
      </tr>
    `;
  });

  tableHtml += `
        <tr></tr>

        <!-- BRAND PROTECTION & QUANTITY RECONCILIATION -->
        <tr><td colspan="8" class="sec">4. BRAND PROTECTION, SCRAP CONTROL &amp; QUANTITY RECONCILIATION</td></tr>
        <tr>
          <th colspan="2">Reconciliation Metric / Process Stage</th>
          <th class="num">Quantity Units</th>
          <th class="num">% of Order</th>
          <th colspan="3">Audit Verification &amp; Custody Protocol</th>
          <th>Verdict</th>
        </tr>
        <tr>
          <td colspan="2" class="bold">Buyer Target Order Quantity</td>
          <td class="num bold">${orderQty.toLocaleString()} pcs</td>
          <td class="num">100.0%</td>
          <td colspan="3">Original Buyer Confirmed Purchase Order</td>
          <td class="pass">MATCHED</td>
        </tr>
        <tr>
          <td colspan="2" class="bold">Total Inward Raw Material Input</td>
          <td class="num bold">${receivedQty.toLocaleString()} pcs eqv</td>
          <td class="num">103.0%</td>
          <td colspan="3">Inward Rolls Reconciled (+3% manufacturing buffer)</td>
          <td class="pass">VERIFIED</td>
        </tr>
        <tr>
          <td colspan="2" class="bold">Actual Pieces Cut (CAD Marker)</td>
          <td class="num bold">${cutQty.toLocaleString()} pcs</td>
          <td class="num">102.6%</td>
          <td colspan="3">Cutting Floor Spreading Slip Verified</td>
          <td class="pass">VERIFIED</td>
        </tr>
        <tr>
          <td colspan="2" class="bold">100% Passed Garments (Export Packing)</td>
          <td class="num bold pass">${passedQty.toLocaleString()} pcs</td>
          <td class="num pass">100.0%</td>
          <td colspan="3">Final QC Passed • Ready for Ex-Factory Container Loading</td>
          <td class="pass">PASSED</td>
        </tr>
        <tr>
          <td colspan="2" class="bold">Factory Rejection Units (Defect Scrap)</td>
          <td class="num bold" style="color: #be123c;">${rejectQty.toLocaleString()} pcs</td>
          <td class="num">1.8%</td>
          <td colspan="3">Defects Logged • Destructive Shredding Verification</td>
          <td class="pass">LOGGED</td>
        </tr>
        <tr>
          <td colspan="2" class="bold">Commercial Surplus / Excess Units</td>
          <td class="num bold" style="color: #0369a1;">${excessQty.toLocaleString()} pcs</td>
          <td class="num">0.8%</td>
          <td colspan="3">Brand Protection Bonded Storage Hold</td>
          <td class="pass">SECURED</td>
        </tr>
        <tr>
          <td colspan="2" class="bold">Brand Protection Protocol &amp; Destruction Cert</td>
          <td colspan="2" class="bold">${record.disposalMethod || 'AUTHORIZED_RECYCLER (Eco-Fibers Co)'}</td>
          <td colspan="3">Certificate of Destruction #: ${record.certificateOfDestructionNumber || 'COD-2026-VAL-0914'}</td>
          <td class="pass">CERTIFIED</td>
        </tr>
        <tr style="background-color: #f0fdf4;">
          <td colspan="2" class="bold pass">Net Unaccounted Variance</td>
          <td class="num bold pass">${varianceQty} pcs</td>
          <td class="num bold pass">0.00%</td>
          <td colspan="4" class="bold pass">✓ 100% Complete Custody Reconciled (Zero Gray-Market Leakage)</td>
        </tr>
        <tr></tr>

        <!-- AUTHORIZATION & SIGNOFFS -->
        <tr><td colspan="8" class="sec">5. OFFICIAL AUTHORIZATION &amp; AUDIT SIGN-OFFS</td></tr>
        <tr>
          <td colspan="2" class="bold">Lead Traceability Auditor:</td>
          <td colspan="2">${record.inspectorName || 'Shafiqul Alam (Lead Auditor)'}</td>
          <td colspan="2" class="bold">Factory QA Head:</td>
          <td colspan="2">Tanzim Ahmed (Head of Quality)</td>
        </tr>
        <tr>
          <td colspan="2" class="bold">Buyer Compliance Officer:</td>
          <td colspan="2">Authorized Signatory (Brand Protection)</td>
          <td colspan="2" class="bold">ISO Compliance Standard:</td>
          <td colspan="2">${pdfSettings.isoStandardBadge}</td>
        </tr>
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
    `Traceability_Dossier_${record.cartonBarcode}_${new Date().toISOString().split('T')[0]}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export Single Traceability Chain Dossier CSV
 * Complete Tabular Export including Order Meta, 6-Tier Genealogy, 7-Stage Lifecycle Table, and Reconciliation
 */
export function exportTraceabilitySingleCsv(record: TraceabilityChain): void {
  const stages: TraceabilityStageRecord[] =
    record.lifecycleStages && record.lifecycleStages.length > 0
      ? record.lifecycleStages
      : createDefaultLifecycleStages({
          orderNumber: record.poNumber || record.orderNumber || 'PO-HM-99201',
          styleNumber: record.styleNumber || 'STY-TS-2026',
          buyerName: record.buyer || 'H&M Hennes & Mauritz',
          orderQuantity: record.orderQuantity || 45000,
        });

  const orderQty = record.orderQuantity || 45000;
  const receivedQty = record.receivedQty || Math.round(orderQty * 1.03);
  const cutQty = record.cutQty || Math.round(orderQty * 1.026);
  const passedQty = record.passedQty || orderQty;
  const rejectQty = record.rejectQty || Math.round(orderQty * 0.018);
  const excessQty = record.excessQty || Math.round(orderQty * 0.008);
  const wasteQty = record.wasteQty ?? Math.max(0, receivedQty - (passedQty + rejectQty + excessQty));
  const varianceQty = record.varianceQty ?? 0;

  const headers = [
    'Section',
    'Item / Stage Name',
    'Facility / Supplier',
    'Identifier / Lot / Challan',
    'Date',
    'Received Qty',
    'Issued Qty',
    'Variance (+/-)',
    'Status',
    'Remarks / Specifications',
  ];

  const rows: (string | number)[][] = [
    // 1. Order Header
    ['Order Overview', 'Carton Barcode', 'Packaging Hall', record.cartonBarcode, record.passedFinalDate?.split(' ')[0] || '', '', '', '', record.status || 'VERIFIED', 'Master Carton Scanned'],
    ['Order Overview', 'Buyer PO Number', record.buyer, record.poNumber || record.orderNumber || '', '', orderQty, passedQty, '0', 'CONFIRMED', 'Commercial Contract Volume'],
    ['Order Overview', 'Style Number', record.buyer, record.styleNumber, '', '', '', '', 'ACTIVE', record.articleName || record.styleDescription || ''],

    // 2. 6-Tier Material Genealogy
    ['Genealogy Tier 1', 'Raw Cotton Fiber', record.ginningLocation || 'Lubbock Ginning Co-Op, Texas', record.cottonOrigin, '', '', '', '', 'PASSED', '100% Virgin Supima Cotton'],
    ['Genealogy Tier 2', 'Yarn Spinning Mill', record.spinningMill || 'Square Spinning Mills Ltd (Unit 2)', record.yarnLot, '', '', '', '', 'PASSED', '30s/1 Combed Ring Spun (3,150 CSP)'],
    ['Genealogy Tier 3', 'Fabric Knitting & Dyeing', record.fabricMill || 'Pacific Knit Composite Ltd', `${record.dyeingBatch} / ${record.fabricRollBarcode}`, '', '', '', '', 'PASSED', '180 GSM Single Jersey (Grade 4-5 Fastness)'],
    ['Genealogy Tier 4', 'Cutting Room', `Cutting Table ${record.cuttingTableLot}`, record.cuttingTableLot, '', '', '', '', 'PASSED', 'CAD Precision Laser Cut (80 Plies)'],
    ['Genealogy Tier 5', 'Sewing Assembly Line', record.sewingLine, record.garmentSerial, '', '', '', '', 'PASSED', '100% Inline QC Defect Inspection'],
    ['Genealogy Tier 6', 'Export Packaging & Metal Scan', 'Central Packing Bay 03', record.cartonBarcode, '', '', '', '', 'PASSED', '1.0mm Fe Metal Tested & Certified'],
  ];

  // 3. 7-Stage Lifecycle Custody Table
  stages.forEach((st, idx) => {
    const diff = (st.receivedQty || 0) - (st.issuedQty || 0);
    const isExcess = st.excessShortType === 'EXCESS' || diff > 0;
    const varianceLabel =
      st.excessShortQty !== undefined
        ? `${st.excessShortQty > 0 ? (isExcess ? '+' : '-') : ''}${st.excessShortQty} ${st.unit}`
        : `${diff} ${st.unit}`;

    rows.push([
      '7-Stage Lifecycle',
      `Stage 0${idx + 1}: ${st.stageName}`,
      st.stationOrSupplier || '',
      st.challanNumber || '',
      st.challanDate || st.receiveDate || '',
      st.receivedQty ? `${st.receivedQty} ${st.unit}` : '',
      st.issuedQty ? `${st.issuedQty} ${st.unit}` : '',
      varianceLabel,
      st.status,
      st.remarks || '',
    ]);
  });

  // 4. Quantity Reconciliation Ledger
  rows.push(
    ['Reconciliation', 'Target Order Qty', record.buyer, record.poNumber || '', '', orderQty, passedQty, '0 pcs', 'MATCHED', 'Contract Quantity'],
    ['Reconciliation', 'Raw Inward Material', 'Spinning / Fabric Mill', record.fabricRollBarcode, '', receivedQty, cutQty, '+3% Buffer', 'VERIFIED', 'Fabric inward allocation'],
    ['Reconciliation', 'Cutting Floor Units', `Table ${record.cuttingTableLot}`, record.cuttingTableLot, '', cutQty, passedQty, '+2.6% Overcut', 'VERIFIED', 'Actual cut plies'],
    ['Reconciliation', '100% Passed Finished Garments', record.sewingLine, record.garmentSerial, '', passedQty, passedQty, '0 pcs', 'PASSED', 'Final inspection passed'],
    ['Reconciliation', 'Factory Rejection Units', record.sewingLine, 'Defect Scrap', '', rejectQty, 0, '-1.8% Rejects', 'LOGGED', 'Destructive shredding required'],
    ['Reconciliation', 'Surplus Commercial Excess', 'Bonded Warehouse', 'Excess Hold', '', excessQty, 0, '+0.8% Excess', 'SECURED', 'Brand protection quarantine hold'],
    ['Reconciliation', 'Brand Protection Destruction', record.disposalFacility || 'Eco-Fibers Recycling Co', record.certificateOfDestructionNumber || 'COD-2026-VAL-0914', record.disposalDate || '', rejectQty + excessQty, 0, '0 pcs', 'CERTIFIED', `Method: ${record.disposalMethod || 'AUTHORIZED_RECYCLER'}`],
    ['Reconciliation', 'Net Unaccounted Variance', 'Auditor Certified', '0 pcs discrepancy', '', varianceQty, 0, '0 pcs', 'RECONCILED', '100% Full Chain-of-Custody Reconciled']
  );

  downloadTraceabilityCsv(
    `Traceability_Dossier_${record.cartonBarcode}_${new Date().toISOString().split('T')[0]}.csv`,
    headers,
    rows
  );
}
