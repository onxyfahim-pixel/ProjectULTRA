import { InventoryItem, ReceiveRecord, IssueRecord } from '@/lib/types/erp';
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

export function computeStockKpis(items: InventoryItem[]) {
  const totalSKUs = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + (i.quantityMeters || 0), 0);
  const totalValuation = items.reduce((sum, i) => sum + (i.quantityMeters || 0) * (i.unitCost || 0), 0);
  const totalRolls = items.reduce((sum, i) => sum + (i.rollCount || 0), 0);
  const gradeACount = items.filter((i) => i.qualityGrade === 'GRADE_A').length;
  const onHoldCount = items.filter((i) => i.qualityGrade === 'ON_HOLD' || i.qualityGrade === 'REJECTED').length;
  const avgCost = totalQuantity > 0 ? totalValuation / totalQuantity : 0;

  return {
    totalSKUs,
    totalQuantity,
    totalValuation,
    totalRolls,
    gradeACount,
    onHoldCount,
    avgCost,
  };
}

export function computeReceiveKpis(records: ReceiveRecord[]) {
  const totalGRNs = records.length;
  const totalReceivedQty = records.reduce((sum, r) => sum + (r.receivedQty || 0), 0);
  const totalRollsReceived = records.reduce((sum, r) => sum + (r.rollsReceived || 0), 0);
  const passedCount = records.filter((r) => r.qcStatus === 'PASSED').length;
  const quarantineCount = records.filter((r) => r.qcStatus === 'QUARANTINE' || r.qcStatus === 'REJECTED').length;
  const uniqueSuppliers = new Set(records.map((r) => r.supplierName)).size;

  return {
    totalGRNs,
    totalReceivedQty,
    totalRollsReceived,
    passedCount,
    quarantineCount,
    uniqueSuppliers,
  };
}

export function computeIssueKpis(records: IssueRecord[]) {
  const totalSIVs = records.length;
  const totalIssuedQty = records.reduce((sum, s) => sum + (s.issuedQty || 0), 0);
  const totalRollsIssued = records.reduce((sum, s) => sum + (s.rollsIssued || 0), 0);
  const cuttingQty = records
    .filter((s) => s.issuedTo === 'CUTTING_FLOOR' || s.departmentDetail?.toLowerCase().includes('cutting'))
    .reduce((sum, s) => sum + (s.issuedQty || 0), 0);
  const sewingQty = totalIssuedQty - cuttingQty;
  const uniqueRequisitions = new Set(records.map((s) => s.requisitionNumber)).size;

  return {
    totalSIVs,
    totalIssuedQty,
    totalRollsIssued,
    cuttingQty,
    sewingQty,
    uniqueRequisitions,
  };
}

// -------------------------------------------------------------
// HELPER: SIGNATURE HTML (DEFAULT NONE)
// -------------------------------------------------------------
export function renderFooterSignaturesHtml(
  mode: FooterSignatureMode = 'none',
  leftRole = 'STORE IN-CHARGE',
  leftDept = 'Inventory Control & Warehouse Dept',
  rightRole = 'FACTORY MANAGER',
  rightDept = 'Operations & Quality Directorate'
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
// 1. STOCK LEDGER EXPORTS (GLOBAL & INDIVIDUAL)
// =============================================================

export function exportStockSummaryPdf(
  items: InventoryItem[],
  scopeLabel: string = 'All Records',
  options?: ExportPdfOptions
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF stock ledger.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'inventory', 'register');
    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      today,
      config.department
    );

    const kpis = computeStockKpis(items);

    const rowsHtml = items
      .map((item, idx) => {
        const val = (item.quantityMeters || 0) * (item.unitCost || 0);
        const gradeColor =
          item.qualityGrade === 'GRADE_A'
            ? 'background: #dcfce7; color: #166534;'
            : item.qualityGrade === 'GRADE_B'
            ? 'background: #dbeafe; color: #1e40af;'
            : 'background: #fef2f2; color: #991b1b;';

        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="text-align: center; color: #64748b; font-size: 9px;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: 700; color: #1e3a8a;">${item.sku}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a;">${item.fabricType}</div>
              <div style="font-size: 8.5px; color: #64748b;">${item.color} • Lot: ${item.batchLot}</div>
            </td>
            <td>
              <span style="display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 8px; font-weight: 700; background: #f1f5f9; color: #475569;">
                ${item.category || 'FABRIC'}
              </span>
            </td>
            <td style="font-family: monospace; color: #2563eb; font-weight: 600;">${item.styleNumber || '-'}</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700;">
              ${(item.quantityMeters || 0).toLocaleString()} ${item.unit || 'm'}
            </td>
            <td style="text-align: center; font-family: monospace;">${item.rollCount || 0}</td>
            <td style="text-align: right; font-family: monospace;">$${(item.unitCost || 0).toFixed(2)}</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700; color: #047857;">
              $${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style="text-align: center;">
              <span style="display: inline-block; padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${gradeColor}">
                ${item.qualityGrade || 'GRADE_A'}
              </span>
            </td>
            <td style="font-family: monospace; font-weight: 600; color: #334155; font-size: 8.5px;">${item.warehouseLocation || '-'}</td>
            <td style="font-size: 8.5px; color: #475569;">${item.supplierName || '-'}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Master Stock Ledger - ${today}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 10mm 12mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 9.5px; line-height: 1.35; }
            .action-bar { background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .btn-print { background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
            .btn-close { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; margin-left: 8px; cursor: pointer; }
            .kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 12px 0; }
            .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; text-align: center; }
            .kpi-lbl { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .kpi-val { font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px; }
            table.detail-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
            table.detail-table th { background: #0f172a; color: white; text-align: left; padding: 6px 7px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; }
            table.detail-table td { padding: 4.5px 7px; border: 1px solid #cbd5e1; vertical-align: middle; }
            @media print { .action-bar { display: none !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <div>
              <div style="font-weight: 700; font-size: 13px;">Master Stock Ledger Export</div>
              <div style="font-size: 10px; color: #94a3b8;">Scope: ${scopeLabel} • ${items.length} Material SKUs</div>
            </div>
            <div>
              <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
              <button class="btn-close" onclick="window.close()">Close</button>
            </div>
          </div>

          ${dynamicHeaderHtml}

          <!-- KPI Summary Strip -->
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-lbl">Total Stock SKUs</div>
              <div class="kpi-val">${kpis.totalSKUs}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Total Physical Units</div>
              <div class="kpi-val">${kpis.totalQuantity.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Stored Rolls / Units</div>
              <div class="kpi-val">${kpis.totalRolls.toLocaleString()}</div>
            </div>
            <div class="kpi-card" style="background: #f0fdf4; border-color: #bbf7d0;">
              <div class="kpi-lbl">Total Stock Valuation</div>
              <div class="kpi-val" style="color: #166534;">$${kpis.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Grade A Export %</div>
              <div class="kpi-val" style="color: #1e40af;">${kpis.totalSKUs > 0 ? Math.round((kpis.gradeACount / kpis.totalSKUs) * 100) : 0}%</div>
            </div>
          </div>

          <!-- Table -->
          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 110px;">SKU Code</th>
                <th>Material &amp; Specification</th>
                <th style="width: 90px;">Category</th>
                <th style="width: 95px;">Order Ref</th>
                <th style="width: 85px; text-align: right;">Quantity</th>
                <th style="width: 45px; text-align: center;">Rolls</th>
                <th style="width: 65px; text-align: right;">Unit Cost</th>
                <th style="width: 85px; text-align: right;">Total Val ($)</th>
                <th style="width: 70px; text-align: center;">Grade</th>
                <th style="width: 80px;">Bay Loc</th>
                <th>Supplier / Mill</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <!-- Totals row -->
              <tr style="background: #e2e8f0; font-weight: 700;">
                <td colspan="5" style="text-align: right; padding: 6px;">TOTAL MASTER STOCK BALANCE:</td>
                <td style="text-align: right; font-family: monospace;">${kpis.totalQuantity.toLocaleString()}</td>
                <td style="text-align: center; font-family: monospace;">${kpis.totalRolls}</td>
                <td style="text-align: right; font-family: monospace;">Avg $${kpis.avgCost.toFixed(2)}</td>
                <td style="text-align: right; font-family: monospace; color: #166534;">$${kpis.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td colspan="3" style="font-size: 8.5px; color: #475569;">${kpis.totalSKUs} Raw Material Lines Monitored</td>
              </tr>
            </tbody>
          </table>

          ${renderFooterSignaturesHtml(options?.signatureMode || 'none')}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export stock summary PDF:', err);
    alert('An unexpected error occurred while generating the stock ledger PDF.');
  }
}

export function exportStockSummaryExcel(
  items: InventoryItem[],
  fileName: string = 'Stock_Ledger_Export',
  scopeLabel: string = 'All Records'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const company = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';
    const dateStr = new Date().toLocaleString();
    const kpis = computeStockKpis(items);

    const rowsHtml = items
      .map(
        (i, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${i.sku}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold;">${i.fabricType}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${i.color}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${i.category || 'FABRIC'}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 5px;">${i.batchLot}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 5px;">${i.styleNumber || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${i.poNumber || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${i.buyerName || '-'}</td>
          <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${i.quantityMeters}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${i.unit || 'm'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${i.rollCount || 0}</td>
          <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${(i.unitCost || 0).toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold; color: #047857; border: 1px solid #cbd5e1; padding: 5px;">${((i.quantityMeters || 0) * (i.unitCost || 0)).toFixed(2)}</td>
          <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${i.qualityGrade || 'GRADE_A'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${i.warehouseLocation || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${i.status || 'IN_STOCK'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${i.supplierName || '-'}</td>
        </tr>
      `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, sans-serif; font-size: 11pt; color: #0f172a; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 5px; }
          </style>
        </head>
        <body>
          <h2>${company}</h2>
          <div style="font-size: 12pt; font-weight: bold; color: #1e3a8a; margin-bottom: 6px;">
            MASTER RAW MATERIAL STOCK LEDGER (${scopeLabel})
          </div>
          <div style="color: #64748b; font-size: 9pt; margin-bottom: 15px;">Generated: ${dateStr}</div>

          <table>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td>TOTAL SKUs: ${kpis.totalSKUs}</td>
              <td>TOTAL QUANTITY: ${kpis.totalQuantity.toLocaleString()}</td>
              <td>TOTAL ROLLS: ${kpis.totalRolls}</td>
              <td style="color: #166534;">TOTAL VALUATION: $${kpis.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>SKU</th>
                <th>Material Description</th>
                <th>Color</th>
                <th>Category</th>
                <th>Batch / Lot</th>
                <th>Style Number</th>
                <th>PO Number</th>
                <th>Buyer</th>
                <th style="text-align: right;">Quantity</th>
                <th style="text-align: center;">Unit</th>
                <th style="text-align: center;">Rolls</th>
                <th style="text-align: right;">Unit Cost ($)</th>
                <th style="text-align: right;">Total Valuation ($)</th>
                <th style="text-align: center;">Grade</th>
                <th>Warehouse Bay</th>
                <th>Stock Status</th>
                <th>Supplier / Mill</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td colspan="9" style="text-align: right;">TOTAL:</td>
                <td style="text-align: right;">${kpis.totalQuantity}</td>
                <td></td>
                <td style="text-align: center;">${kpis.totalRolls}</td>
                <td></td>
                <td style="text-align: right; color: #166534;">${kpis.totalValuation.toFixed(2)}</td>
                <td colspan="4"></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFileName = fileName.endsWith('.xls') ? fileName : `${fileName}_${Date.now()}.xls`;
    link.setAttribute('download', cleanFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export stock summary Excel:', err);
    alert('An unexpected error occurred while generating the Excel spreadsheet.');
  }
}

export function exportSingleStockItemPdf(
  item: InventoryItem,
  linkedGrns: ReceiveRecord[] = [],
  linkedIssues: IssueRecord[] = [],
  options?: ExportPdfOptions
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF document.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'inventory', 'single', item.sku);
    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      today,
      config.department
    );

    const val = (item.quantityMeters || 0) * (item.unitCost || 0);

    const grnRowsHtml = linkedGrns.length > 0
      ? linkedGrns
          .map((g, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="text-align: center; color: #64748b;">${idx + 1}</td>
              <td style="font-family: monospace; font-weight: 700; color: #1e3a8a;">${g.grnNumber}</td>
              <td style="font-family: monospace;">${g.date}</td>
              <td>${g.supplierName}</td>
              <td style="text-align: right; font-family: monospace; font-weight: 700; color: #047857;">+${g.receivedQty.toLocaleString()} ${g.unit}</td>
              <td style="text-align: center; font-family: monospace;">${g.rollsReceived || '-'}</td>
              <td style="text-align: center;">${g.qualityGrade}</td>
              <td style="font-size: 8.5px; color: #475569;">${g.receivedBy}</td>
            </tr>
          `)
          .join('')
      : '<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 8px;">No inward delivery records directly linked.</td></tr>';

    const issueRowsHtml = linkedIssues.length > 0
      ? linkedIssues
          .map((s, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="text-align: center; color: #64748b;">${idx + 1}</td>
              <td style="font-family: monospace; font-weight: 700; color: #92400e;">${s.sivNumber}</td>
              <td style="font-family: monospace;">${s.date}</td>
              <td>${s.departmentDetail}</td>
              <td style="text-align: right; font-family: monospace; font-weight: 700; color: #b45309;">-${s.issuedQty.toLocaleString()} ${s.unit}</td>
              <td style="font-family: monospace;">${s.poNumber || '-'}</td>
              <td style="font-size: 8.5px; color: #475569;">${s.purpose || 'Floor Issue'}</td>
            </tr>
          `)
          .join('')
      : '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 8px;">No floor issue vouchers recorded for this item.</td></tr>';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SKU-${item.sku} - Stock Specification</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 10px; line-height: 1.4; }
            .action-bar { background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .btn-print { background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
            .btn-close { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; margin-left: 8px; cursor: pointer; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 14px 0 6px 0; padding-bottom: 3px; border-bottom: 1.5px solid #cbd5e1; }
            .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; margin-bottom: 12px; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 12px; font-size: 9.5px; }
            .info-lbl { font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase; }
            .info-val { font-size: 10px; font-weight: 700; color: #0f172a; margin-top: 1px; }
            .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
            .kpi-box { background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; text-align: center; }
            table.detail-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 12px; }
            table.detail-table th { background: #0f172a; color: white; text-align: left; padding: 5px 6px; font-size: 8px; font-weight: 700; text-transform: uppercase; }
            table.detail-table td { padding: 4.5px 6px; border: 1px solid #cbd5e1; vertical-align: middle; }
            @media print { .action-bar { display: none !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <div>
              <div style="font-weight: 700; font-size: 13px;">Raw Material Stock Tag: ${item.sku}</div>
              <div style="font-size: 10px; color: #94a3b8;">${item.fabricType} • Location: ${item.warehouseLocation}</div>
            </div>
            <div>
              <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
              <button class="btn-close" onclick="window.close()">Close</button>
            </div>
          </div>

          ${dynamicHeaderHtml}

          <!-- Material Specification Header Card -->
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <div style="font-size: 16px; font-weight: 900; color: #1e3a8a; font-family: monospace;">SKU: ${item.sku}</div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${item.fabricType}</div>
              </div>
              <div>
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">
                  ${item.status || 'IN_STOCK'}
                </span>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="info-lbl">Category</div>
                <div class="info-val">${item.category || 'FABRIC'}</div>
              </div>
              <div>
                <div class="info-lbl">Color / Shade</div>
                <div class="info-val">${item.color}</div>
              </div>
              <div>
                <div class="info-lbl">Batch / Lot #</div>
                <div class="info-val" style="font-family: monospace;">${item.batchLot}</div>
              </div>
              <div>
                <div class="info-lbl">Allocated PO Number</div>
                <div class="info-val" style="font-family: monospace; color: #2563eb;">${item.poNumber || 'GENERAL STORE'}</div>
              </div>
              <div>
                <div class="info-lbl">Style Reference</div>
                <div class="info-val">${item.styleNumber || '-'}</div>
              </div>
              <div>
                <div class="info-lbl">Buyer / Account</div>
                <div class="info-val">${item.buyerName || '-'}</div>
              </div>
              <div>
                <div class="info-lbl">Warehouse Bay / Rack</div>
                <div class="info-val" style="color: #047857;">${item.warehouseLocation}</div>
              </div>
              <div>
                <div class="info-lbl">Mill / Supplier</div>
                <div class="info-val">${item.supplierName || 'Standard Mill'}</div>
              </div>
              <div>
                <div class="info-lbl">Quality Inspection Grade</div>
                <div class="info-val">${item.qualityGrade || 'GRADE_A'}</div>
              </div>
            </div>
          </div>

          <!-- Commercial & Volume KPI Row -->
          <div class="kpi-row">
            <div class="kpi-box">
              <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">Current Stock Balance</div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px;">
                ${(item.quantityMeters || 0).toLocaleString()} ${item.unit || 'm'}
              </div>
            </div>
            <div class="kpi-box">
              <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">Roll / Unit Count</div>
              <div style="font-size: 15px; font-weight: 900; color: #1e40af; font-family: monospace; margin-top: 2px;">
                ${item.rollCount || 0} Rolls
              </div>
            </div>
            <div class="kpi-box">
              <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">Unit Cost</div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px;">
                $${(item.unitCost || 0).toFixed(2)}
              </div>
            </div>
            <div class="kpi-box" style="background: #f0fdf4; border-color: #bbf7d0;">
              <div style="font-size: 8px; color: #166534; font-weight: 700; text-transform: uppercase;">Total Asset Valuation</div>
              <div style="font-size: 15px; font-weight: 900; color: #166534; font-family: monospace; margin-top: 2px;">
                $${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <!-- Inward GRN Deliveries -->
          <div class="section-title">Inward Material Receipts (Goods Received Notes - GRN)</div>
          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 100px;">GRN Number</th>
                <th style="width: 80px;">Date</th>
                <th>Supplier / Mill</th>
                <th style="width: 90px; text-align: right;">Received Qty</th>
                <th style="width: 50px; text-align: center;">Rolls</th>
                <th style="width: 65px; text-align: center;">QC Grade</th>
                <th>Inspected By</th>
              </tr>
            </thead>
            <tbody>
              ${grnRowsHtml}
            </tbody>
          </table>

          <!-- Outward Floor Issue History (SIV) -->
          <div class="section-title">Factory Floor Issuance History (Store Issue Vouchers - SIV)</div>
          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 100px;">SIV Number</th>
                <th style="width: 80px;">Date</th>
                <th>Destination Floor / Line</th>
                <th style="width: 90px; text-align: right;">Issued Qty</th>
                <th style="width: 90px;">PO Reference</th>
                <th>Requisition Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${issueRowsHtml}
            </tbody>
          </table>

          ${renderFooterSignaturesHtml(options?.signatureMode || 'none')}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export single stock item PDF:', err);
    alert('An unexpected error occurred while generating the stock item PDF.');
  }
}

export function exportSingleStockItemExcel(
  item: InventoryItem,
  linkedGrns: ReceiveRecord[] = [],
  linkedIssues: IssueRecord[] = []
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const company = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';
    const dateStr = new Date().toLocaleString();
    const val = (item.quantityMeters || 0) * (item.unitCost || 0);

    const grnRows = linkedGrns
      .map(
        (g, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px;">${g.grnNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${g.date}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${g.supplierName}</td>
          <td style="text-align: right; font-weight: bold; color: #047857; border: 1px solid #cbd5e1; padding: 4px;">+${g.receivedQty} ${g.unit}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px;">${g.rollsReceived || '-'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px;">${g.qualityGrade}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${g.receivedBy}</td>
        </tr>
      `
      )
      .join('');

    const issueRows = linkedIssues
      .map(
        (s, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px;">${s.sivNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${s.date}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${s.departmentDetail}</td>
          <td style="text-align: right; font-weight: bold; color: #b45309; border: 1px solid #cbd5e1; padding: 4px;">-${s.issuedQty} ${s.unit}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${s.poNumber || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${s.purpose || '-'}</td>
        </tr>
      `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, sans-serif; font-size: 11pt; color: #0f172a; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
            th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 5px; }
          </style>
        </head>
        <body>
          <h2>${company}</h2>
          <div style="font-size: 13pt; font-weight: bold; color: #1e3a8a;">
            RAW MATERIAL ITEM SPECIFICATION: SKU ${item.sku}
          </div>
          <div style="color: #64748b; font-size: 9pt; margin-bottom: 12px;">Export Date: ${dateStr}</div>

          <!-- Section 1 -->
          <table>
            <tr style="background: #f1f5f9; font-weight: bold;"><td colspan="4">SECTION 1: ITEM SPECIFICATIONS</td></tr>
            <tr>
              <td style="width: 20%; font-weight: bold;">SKU Code</td>
              <td style="width: 30%; font-family: monospace;">${item.sku}</td>
              <td style="width: 20%; font-weight: bold;">Material Name</td>
              <td style="width: 30%;">${item.fabricType}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Category</td>
              <td>${item.category || 'FABRIC'}</td>
              <td style="font-weight: bold;">Color / Shade</td>
              <td>${item.color}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Batch / Lot</td>
              <td style="font-family: monospace;">${item.batchLot}</td>
              <td style="font-weight: bold;">Warehouse Bay</td>
              <td>${item.warehouseLocation}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Physical Balance</td>
              <td style="font-weight: bold;">${item.quantityMeters} ${item.unit || 'm'} (${item.rollCount || 0} Rolls)</td>
              <td style="font-weight: bold;">Unit Cost / Valuation</td>
              <td style="font-weight: bold; color: #047857;">$${(item.unitCost || 0).toFixed(2)} / Total $${val.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Section 2 -->
          <table>
            <tr style="background: #f1f5f9; font-weight: bold;"><td colspan="8">SECTION 2: INWARD DELIVERIES (GRN)</td></tr>
            <thead>
              <tr>
                <th>#</th><th>GRN Number</th><th>Date</th><th>Supplier</th><th>Received Qty</th><th>Rolls</th><th>Grade</th><th>Inspected By</th>
              </tr>
            </thead>
            <tbody>
              ${grnRows || '<tr><td colspan="8" style="text-align:center;">No inward receipts</td></tr>'}
            </tbody>
          </table>

          <!-- Section 3 -->
          <table>
            <tr style="background: #f1f5f9; font-weight: bold;"><td colspan="7">SECTION 3: OUTWARD DISPATCHES (SIV)</td></tr>
            <thead>
              <tr>
                <th>#</th><th>SIV Number</th><th>Date</th><th>Department / Floor</th><th>Issued Qty</th><th>PO Reference</th><th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${issueRows || '<tr><td colspan="7" style="text-align:center;">No outward issues</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SKU_${item.sku}_Specification_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export single stock item Excel:', err);
    alert('An unexpected error occurred while generating the Excel spreadsheet.');
  }
}

// =============================================================
// 2. RECEIVE REGISTER (GRN) EXPORTS (GLOBAL & INDIVIDUAL)
// =============================================================

export function exportReceiveSummaryPdf(
  records: ReceiveRecord[],
  scopeLabel: string = 'All Records',
  options?: ExportPdfOptions
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF GRN register.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();
    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      'GOODS RECEIVED NOTE (GRN) INWARD REGISTER SUMMARY',
      `GRN-REG-${today.replace(/-/g, '')}`,
      today,
      'Materials Receiving, Quality Inspection & Raw Materials Store'
    );

    const kpis = computeReceiveKpis(records);

    const rowsHtml = records
      .map((r, idx) => {
        const qcColor =
          r.qcStatus === 'PASSED'
            ? 'background: #dcfce7; color: #166534;'
            : r.qcStatus === 'QUARANTINE'
            ? 'background: #fef3c7; color: #92400e;'
            : 'background: #fee2e2; color: #991b1b;';

        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="text-align: center; color: #64748b; font-size: 9px;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: 700; color: #166534;">${r.grnNumber}</td>
            <td style="font-family: monospace;">${r.date}</td>
            <td style="font-weight: 700; color: #0f172a;">${r.supplierName}</td>
            <td>
              <div style="font-weight: 700; color: #1e3a8a;">${r.itemName}</div>
              <div style="font-size: 8.5px; color: #64748b;">${r.sku} • Lot: ${r.batchLot}</div>
            </td>
            <td style="font-family: monospace; color: #2563eb;">${r.poNumber || '-'}</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700; color: #166534;">
              +${r.receivedQty.toLocaleString()} ${r.unit}
            </td>
            <td style="text-align: center; font-family: monospace;">${r.rollsReceived || '-'}</td>
            <td style="text-align: center;">
              <span style="display: inline-block; padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${qcColor}">
                ${r.qcStatus}
              </span>
            </td>
            <td style="text-align: center; font-weight: 700;">${r.qualityGrade}</td>
            <td style="font-family: monospace; font-size: 8.5px;">${r.warehouseLocation}</td>
            <td style="font-size: 8.5px; color: #475569;">${r.receivedBy}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GRN Inward Register - ${today}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 10mm 12mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 9.5px; line-height: 1.35; }
            .action-bar { background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .btn-print { background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
            .btn-close { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; margin-left: 8px; cursor: pointer; }
            .kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 12px 0; }
            .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; text-align: center; }
            .kpi-lbl { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .kpi-val { font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px; }
            table.detail-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
            table.detail-table th { background: #0f172a; color: white; text-align: left; padding: 6px 7px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; }
            table.detail-table td { padding: 4.5px 7px; border: 1px solid #cbd5e1; vertical-align: middle; }
            @media print { .action-bar { display: none !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <div>
              <div style="font-weight: 700; font-size: 13px;">Goods Received Note (GRN) Inward Register</div>
              <div style="font-size: 10px; color: #94a3b8;">Scope: ${scopeLabel} • ${records.length} Shipments Inwarded</div>
            </div>
            <div>
              <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
              <button class="btn-close" onclick="window.close()">Close</button>
            </div>
          </div>

          ${dynamicHeaderHtml}

          <!-- KPI Summary Strip -->
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-lbl">Total GRNs Recorded</div>
              <div class="kpi-val">${kpis.totalGRNs}</div>
            </div>
            <div class="kpi-card" style="background: #f0fdf4; border-color: #bbf7d0;">
              <div class="kpi-lbl">Total Inward Quantity</div>
              <div class="kpi-val" style="color: #166534;">+${kpis.totalReceivedQty.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Total Rolls Inwarded</div>
              <div class="kpi-val">${kpis.totalRollsReceived.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">QC Passed Shipments</div>
              <div class="kpi-val" style="color: #047857;">${kpis.passedCount} (${kpis.totalGRNs > 0 ? Math.round((kpis.passedCount / kpis.totalGRNs) * 100) : 0}%)</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Unique Mills / Suppliers</div>
              <div class="kpi-val" style="color: #1e40af;">${kpis.uniqueSuppliers} Mills</div>
            </div>
          </div>

          <!-- Table -->
          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 95px;">GRN Number</th>
                <th style="width: 75px;">Date</th>
                <th>Supplier / Mill</th>
                <th>Material &amp; Lot</th>
                <th style="width: 90px;">PO Reference</th>
                <th style="width: 95px; text-align: right;">Inward Qty</th>
                <th style="width: 45px; text-align: center;">Rolls</th>
                <th style="width: 70px; text-align: center;">QC Status</th>
                <th style="width: 65px; text-align: center;">Grade</th>
                <th style="width: 75px;">Bay Loc</th>
                <th>Received By</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <!-- Totals row -->
              <tr style="background: #e2e8f0; font-weight: 700;">
                <td colspan="6" style="text-align: right; padding: 6px;">TOTAL INWARD RAW MATERIALS DELIVERED:</td>
                <td style="text-align: right; font-family: monospace; color: #166534;">+${kpis.totalReceivedQty.toLocaleString()}</td>
                <td style="text-align: center; font-family: monospace;">${kpis.totalRollsReceived}</td>
                <td colspan="4" style="font-size: 8.5px; color: #475569;">${kpis.passedCount} shipments approved under standard AQL testing</td>
              </tr>
            </tbody>
          </table>

          ${renderFooterSignaturesHtml(options?.signatureMode || 'none')}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export receive summary PDF:', err);
    alert('An unexpected error occurred while generating the GRN summary PDF.');
  }
}

export function exportReceiveSummaryExcel(
  records: ReceiveRecord[],
  fileName: string = 'GRN_Receive_Register_Export',
  scopeLabel: string = 'All Records'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const company = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';
    const dateStr = new Date().toLocaleString();
    const kpis = computeReceiveKpis(records);

    const rowsHtml = records
      .map(
        (r, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #166534; border: 1px solid #cbd5e1; padding: 5px;">${r.grnNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${r.date}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold;">${r.supplierName}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${r.itemName}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 5px;">${r.sku}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 5px;">${r.batchLot}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 5px;">${r.poNumber || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${r.challanNumber || '-'}</td>
          <td style="text-align: right; font-weight: bold; color: #166534; border: 1px solid #cbd5e1; padding: 5px;">${r.receivedQty}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${r.unit}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${r.rollsReceived || 0}</td>
          <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${r.qcStatus}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${r.qualityGrade}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${r.warehouseLocation}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${r.receivedBy}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${r.notes || '-'}</td>
        </tr>
      `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, sans-serif; font-size: 11pt; color: #0f172a; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 5px; }
          </style>
        </head>
        <body>
          <h2>${company}</h2>
          <div style="font-size: 12pt; font-weight: bold; color: #166534; margin-bottom: 6px;">
            GOODS RECEIVED NOTE (GRN) INWARD REGISTER (${scopeLabel})
          </div>
          <div style="color: #64748b; font-size: 9pt; margin-bottom: 15px;">Generated: ${dateStr}</div>

          <table>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td>TOTAL GRNs: ${kpis.totalGRNs}</td>
              <td style="color: #166534;">TOTAL INWARD: +${kpis.totalReceivedQty.toLocaleString()}</td>
              <td>TOTAL ROLLS: ${kpis.totalRollsReceived}</td>
              <td>QC PASSED: ${kpis.passedCount}</td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>GRN Number</th>
                <th>Date</th>
                <th>Supplier / Mill</th>
                <th>Item Description</th>
                <th>SKU</th>
                <th>Batch / Lot</th>
                <th>PO Number</th>
                <th>Challan #</th>
                <th style="text-align: right;">Received Qty</th>
                <th style="text-align: center;">Unit</th>
                <th style="text-align: center;">Rolls</th>
                <th style="text-align: center;">QC Status</th>
                <th style="text-align: center;">Grade</th>
                <th>Warehouse Bay</th>
                <th>Received By</th>
                <th>Inspection Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td colspan="9" style="text-align: right;">TOTAL:</td>
                <td style="text-align: right; color: #166534;">+${kpis.totalReceivedQty}</td>
                <td></td>
                <td style="text-align: center;">${kpis.totalRollsReceived}</td>
                <td colspan="5"></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFileName = fileName.endsWith('.xls') ? fileName : `${fileName}_${Date.now()}.xls`;
    link.setAttribute('download', cleanFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export receive summary Excel:', err);
    alert('An unexpected error occurred while generating the Excel spreadsheet.');
  }
}

export function exportSingleReceiveRecordPdf(
  record: ReceiveRecord,
  matchedItem?: InventoryItem,
  options?: ExportPdfOptions
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable GRN slip.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();
    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      `GOODS RECEIVED NOTE & QC PASS SLIP: GRN ${record.grnNumber}`,
      `GRN-${record.grnNumber}`,
      today,
      'Raw Materials Receiving, QC Inspection & Warehouse Intake'
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GRN-${record.grnNumber} - Inspection Slip</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 10px; line-height: 1.4; }
            .action-bar { background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .btn-print { background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
            .btn-close { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; margin-left: 8px; cursor: pointer; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 14px 0 6px 0; padding-bottom: 3px; border-bottom: 1.5px solid #cbd5e1; }
            .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; margin-bottom: 12px; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 12px; font-size: 9.5px; }
            .info-lbl { font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase; }
            .info-val { font-size: 10px; font-weight: 700; color: #0f172a; margin-top: 1px; }
            .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
            .kpi-box { background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; text-align: center; }
            @media print { .action-bar { display: none !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <div>
              <div style="font-weight: 700; font-size: 13px;">Goods Received Note: ${record.grnNumber}</div>
              <div style="font-size: 10px; color: #94a3b8;">${record.supplierName} • Inward Date: ${record.date}</div>
            </div>
            <div>
              <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
              <button class="btn-close" onclick="window.close()">Close</button>
            </div>
          </div>

          ${dynamicHeaderHtml}

          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <div style="font-size: 16px; font-weight: 900; color: #166534; font-family: monospace;">GRN: ${record.grnNumber}</div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${record.itemName}</div>
              </div>
              <div>
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">
                  ${record.qcStatus}
                </span>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="info-lbl">Supplier / Mill</div>
                <div class="info-val" style="color: #1e3a8a;">${record.supplierName}</div>
              </div>
              <div>
                <div class="info-lbl">Delivery Challan #</div>
                <div class="info-val" style="font-family: monospace;">${record.challanNumber || 'DC-PENDING'}</div>
              </div>
              <div>
                <div class="info-lbl">Inward Date</div>
                <div class="info-val" style="font-family: monospace;">${record.date}</div>
              </div>
              <div>
                <div class="info-lbl">Material SKU</div>
                <div class="info-val" style="font-family: monospace;">${record.sku}</div>
              </div>
              <div>
                <div class="info-lbl">Batch / Lot #</div>
                <div class="info-val" style="font-family: monospace;">${record.batchLot}</div>
              </div>
              <div>
                <div class="info-lbl">Category</div>
                <div class="info-val">${record.category || 'FABRIC'}</div>
              </div>
              <div>
                <div class="info-lbl">Allocated PO Number</div>
                <div class="info-val" style="font-family: monospace; color: #2563eb;">${record.poNumber || 'GENERAL INTAKE'}</div>
              </div>
              <div>
                <div class="info-lbl">Allocated Style</div>
                <div class="info-val">${record.styleNumber || '-'}</div>
              </div>
              <div>
                <div class="info-lbl">Buyer / Account</div>
                <div class="info-val">${record.buyerName || '-'}</div>
              </div>
              <div>
                <div class="info-lbl">Warehouse Bay</div>
                <div class="info-val" style="color: #047857;">${record.warehouseLocation}</div>
              </div>
              <div>
                <div class="info-lbl">Quality Grade</div>
                <div class="info-val">${record.qualityGrade}</div>
              </div>
              <div>
                <div class="info-lbl">Received By Storeman</div>
                <div class="info-val">${record.receivedBy}</div>
              </div>
            </div>
          </div>

          <!-- Volume Summary -->
          <div class="kpi-row">
            <div class="kpi-box" style="background: #f0fdf4; border-color: #bbf7d0;">
              <div style="font-size: 8px; color: #166534; font-weight: 700; text-transform: uppercase;">Inward Verified Quantity</div>
              <div style="font-size: 16px; font-weight: 900; color: #166534; font-family: monospace; margin-top: 2px;">
                +${record.receivedQty.toLocaleString()} ${record.unit}
              </div>
            </div>
            <div class="kpi-box">
              <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">Rolls / Packages Count</div>
              <div style="font-size: 16px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px;">
                ${record.rollsReceived || 0} Rolls
              </div>
            </div>
            <div class="kpi-box">
              <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">Quality Audit Rating</div>
              <div style="font-size: 16px; font-weight: 900; color: #047857; font-family: monospace; margin-top: 2px;">
                ${record.qualityGrade}
              </div>
            </div>
            <div class="kpi-box">
              <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">Current Live Balance</div>
              <div style="font-size: 16px; font-weight: 900; color: #1e40af; font-family: monospace; margin-top: 2px;">
                ${matchedItem ? matchedItem.quantityMeters.toLocaleString() + ' ' + (matchedItem.unit || 'm') : 'Synced'}
              </div>
            </div>
          </div>

          <!-- Inspection Remarks -->
          <div class="section-title">Quality Assurance &amp; Store Intake Notes</div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; font-size: 9.5px; background: white; margin-bottom: 14px;">
            <strong>Remarks:</strong> ${record.notes || 'Full delivery inspected. 0 shaded lots detected, shrinkage within ±2.0% tolerance, fabric width verified against mill packing list.'}
          </div>

          ${renderFooterSignaturesHtml(
            options?.signatureMode || 'none',
            'RECEIVED BY (STORE)',
            'Raw Materials Receiving Section',
            'QC AUDITOR PASS',
            'Quality Control & Laboratory Dept'
          )}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export single receive record PDF:', err);
    alert('An unexpected error occurred while generating the GRN PDF slip.');
  }
}

export function exportSingleReceiveRecordExcel(
  record: ReceiveRecord,
  matchedItem?: InventoryItem
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const company = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';
    const dateStr = new Date().toLocaleString();

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, sans-serif; font-size: 11pt; color: #0f172a; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
            th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 5px; }
          </style>
        </head>
        <body>
          <h2>${company}</h2>
          <div style="font-size: 13pt; font-weight: bold; color: #166534;">
            GOODS RECEIVED NOTE (GRN) VOUCHER: ${record.grnNumber}
          </div>
          <div style="color: #64748b; font-size: 9pt; margin-bottom: 12px;">Export Date: ${dateStr}</div>

          <table>
            <tr style="background: #f1f5f9; font-weight: bold;"><td colspan="4">GRN VOUCHER PARAMETERS</td></tr>
            <tr>
              <td style="width: 20%; font-weight: bold;">GRN Number</td>
              <td style="width: 30%; font-family: monospace; font-weight: bold; color: #166534;">${record.grnNumber}</td>
              <td style="width: 20%; font-weight: bold;">Inward Date</td>
              <td style="width: 30%; font-family: monospace;">${record.date}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Supplier / Mill</td>
              <td style="font-weight: bold;">${record.supplierName}</td>
              <td style="font-weight: bold;">Delivery Challan</td>
              <td style="font-family: monospace;">${record.challanNumber || '-'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Material Item</td>
              <td style="font-weight: bold;">${record.itemName}</td>
              <td style="font-weight: bold;">SKU / Lot</td>
              <td style="font-family: monospace;">${record.sku} (Lot: ${record.batchLot})</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Allocated PO</td>
              <td style="font-family: monospace; color: #1d4ed8;">${record.poNumber || '-'}</td>
              <td style="font-weight: bold;">Allocated Style</td>
              <td>${record.styleNumber || '-'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Received Quantity</td>
              <td style="font-weight: bold; color: #166534; font-size: 12pt;">+${record.receivedQty} ${record.unit} (${record.rollsReceived || 0} Rolls)</td>
              <td style="font-weight: bold;">QC Status / Grade</td>
              <td style="font-weight: bold;">${record.qcStatus} (${record.qualityGrade})</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Warehouse Bay</td>
              <td>${record.warehouseLocation}</td>
              <td style="font-weight: bold;">Received By</td>
              <td>${record.receivedBy}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Inspection Remarks</td>
              <td colspan="3">${record.notes || 'Inspection passed with 0 defects.'}</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GRN_${record.grnNumber}_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export single receive record Excel:', err);
    alert('An unexpected error occurred while generating the Excel spreadsheet.');
  }
}

// =============================================================
// 3. ISSUE REGISTER (SIV) EXPORTS (GLOBAL & INDIVIDUAL)
// =============================================================

export function exportIssueSummaryPdf(
  records: IssueRecord[],
  scopeLabel: string = 'All Records',
  options?: ExportPdfOptions
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable SIV summary PDF.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();
    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      'STORE ISSUE VOUCHER (SIV) MATERIAL ISSUANCE REGISTER',
      `SIV-REG-${today.replace(/-/g, '')}`,
      today,
      'Factory Floor Requisitions, Material Dispatch & Consumption Tracking'
    );

    const kpis = computeIssueKpis(records);

    const rowsHtml = records
      .map((s, idx) => {
        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="text-align: center; color: #64748b; font-size: 9px;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: 700; color: #92400e;">${s.sivNumber}</td>
            <td style="font-family: monospace;">${s.date}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a;">${s.departmentDetail}</div>
              <div style="font-size: 8.5px; color: #64748b;">Req: ${s.requisitionNumber}</div>
            </td>
            <td>
              <div style="font-weight: 700; color: #1e3a8a;">${s.itemName}</div>
              <div style="font-size: 8.5px; color: #64748b;">SKU: ${s.sku}</div>
            </td>
            <td style="font-family: monospace; color: #2563eb;">${s.poNumber || '-'}</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700; color: #b45309;">
              -${s.issuedQty.toLocaleString()} ${s.unit}
            </td>
            <td style="text-align: center; font-family: monospace;">${s.rollsIssued || '-'}</td>
            <td style="font-size: 8.5px; color: #334155;">${s.purpose || '-'}</td>
            <td style="font-size: 8.5px; color: #047857; font-weight: 600;">${s.receivedByFloor}</td>
            <td style="font-size: 8.5px; color: #64748b;">${s.issuedBy}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SIV Issue Register - ${today}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 10mm 12mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 9.5px; line-height: 1.35; }
            .action-bar { background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .btn-print { background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
            .btn-close { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; margin-left: 8px; cursor: pointer; }
            .kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 12px 0; }
            .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; text-align: center; }
            .kpi-lbl { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .kpi-val { font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px; }
            table.detail-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
            table.detail-table th { background: #0f172a; color: white; text-align: left; padding: 6px 7px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; }
            table.detail-table td { padding: 4.5px 7px; border: 1px solid #cbd5e1; vertical-align: middle; }
            @media print { .action-bar { display: none !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <div>
              <div style="font-weight: 700; font-size: 13px;">Store Issue Voucher (SIV) Material Register</div>
              <div style="font-size: 10px; color: #94a3b8;">Scope: ${scopeLabel} • ${records.length} Vouchers Issued</div>
            </div>
            <div>
              <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
              <button class="btn-close" onclick="window.close()">Close</button>
            </div>
          </div>

          ${dynamicHeaderHtml}

          <!-- KPI Summary Strip -->
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-lbl">Total SIV Vouchers</div>
              <div class="kpi-val">${kpis.totalSIVs}</div>
            </div>
            <div class="kpi-card" style="background: #fffbeb; border-color: #fde68a;">
              <div class="kpi-lbl">Total Issued Volume</div>
              <div class="kpi-val" style="color: #92400e;">-${kpis.totalIssuedQty.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Cutting Floor Dispatch</div>
              <div class="kpi-val" style="color: #b45309;">${kpis.cuttingQty.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Sewing &amp; Trims Floor</div>
              <div class="kpi-val" style="color: #1e40af;">${kpis.sewingQty.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Requisitions Fulfilled</div>
              <div class="kpi-val">${kpis.uniqueRequisitions} Reqs</div>
            </div>
          </div>

          <!-- Table -->
          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 95px;">SIV Number</th>
                <th style="width: 75px;">Date</th>
                <th>Floor / Department</th>
                <th>Material &amp; SKU</th>
                <th style="width: 90px;">PO Reference</th>
                <th style="width: 95px; text-align: right;">Issued Qty</th>
                <th style="width: 45px; text-align: center;">Rolls</th>
                <th>Requisition Purpose</th>
                <th>Floor Receiver</th>
                <th>Store Issuer</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <!-- Totals row -->
              <tr style="background: #e2e8f0; font-weight: 700;">
                <td colspan="6" style="text-align: right; padding: 6px;">TOTAL RAW MATERIAL DISPATCH TO PRODUCTION:</td>
                <td style="text-align: right; font-family: monospace; color: #92400e;">-${kpis.totalIssuedQty.toLocaleString()}</td>
                <td style="text-align: center; font-family: monospace;">${kpis.totalRollsIssued}</td>
                <td colspan="3" style="font-size: 8.5px; color: #475569;">${kpis.totalSIVs} Store Issue Vouchers Authenticated</td>
              </tr>
            </tbody>
          </table>

          ${renderFooterSignaturesHtml(options?.signatureMode || 'none')}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export issue summary PDF:', err);
    alert('An unexpected error occurred while generating the SIV summary PDF.');
  }
}

export function exportIssueSummaryExcel(
  records: IssueRecord[],
  fileName: string = 'SIV_Issue_Register_Export',
  scopeLabel: string = 'All Records'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const company = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';
    const dateStr = new Date().toLocaleString();
    const kpis = computeIssueKpis(records);

    const rowsHtml = records
      .map(
        (s, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #92400e; border: 1px solid #cbd5e1; padding: 5px;">${s.sivNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${s.date}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold;">${s.departmentDetail}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 5px;">${s.requisitionNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${s.itemName}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 5px;">${s.sku}</td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 5px;">${s.poNumber || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${s.styleNumber || '-'}</td>
          <td style="text-align: right; font-weight: bold; color: #92400e; border: 1px solid #cbd5e1; padding: 5px;">-${s.issuedQty}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${s.unit}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${s.rollsIssued || 0}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${s.purpose || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${s.receivedByFloor}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${s.issuedBy}</td>
        </tr>
      `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, sans-serif; font-size: 11pt; color: #0f172a; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 5px; }
          </style>
        </head>
        <body>
          <h2>${company}</h2>
          <div style="font-size: 12pt; font-weight: bold; color: #92400e; margin-bottom: 6px;">
            STORE ISSUE VOUCHER (SIV) MATERIAL REGISTER (${scopeLabel})
          </div>
          <div style="color: #64748b; font-size: 9pt; margin-bottom: 15px;">Generated: ${dateStr}</div>

          <table>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td>TOTAL SIVs: ${kpis.totalSIVs}</td>
              <td style="color: #92400e;">TOTAL ISSUED: -${kpis.totalIssuedQty.toLocaleString()}</td>
              <td>CUTTING FLOOR: ${kpis.cuttingQty.toLocaleString()}</td>
              <td>REQUISITIONS: ${kpis.uniqueRequisitions}</td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>SIV Number</th>
                <th>Date</th>
                <th>Department / Floor</th>
                <th>Requisition #</th>
                <th>Item Description</th>
                <th>SKU</th>
                <th>PO Number</th>
                <th>Style Number</th>
                <th style="text-align: right;">Issued Qty</th>
                <th style="text-align: center;">Unit</th>
                <th style="text-align: center;">Rolls</th>
                <th>Purpose</th>
                <th>Received By Floor</th>
                <th>Issued By Store</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td colspan="9" style="text-align: right;">TOTAL:</td>
                <td style="text-align: right; color: #92400e;">-${kpis.totalIssuedQty}</td>
                <td></td>
                <td style="text-align: center;">${kpis.totalRollsIssued}</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFileName = fileName.endsWith('.xls') ? fileName : `${fileName}_${Date.now()}.xls`;
    link.setAttribute('download', cleanFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export issue summary Excel:', err);
    alert('An unexpected error occurred while generating the Excel spreadsheet.');
  }
}

export function exportSingleIssueRecordPdf(
  record: IssueRecord,
  matchedItem?: InventoryItem,
  options?: ExportPdfOptions
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable SIV voucher.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();
    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      `STORE ISSUE VOUCHER & REQUISITION CHALLAN: SIV ${record.sivNumber}`,
      `SIV-${record.sivNumber}`,
      today,
      'Factory Floor Material Requisition, Store Dispatch & Stock Transfer'
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SIV-${record.sivNumber} - Issue Voucher</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 10px; line-height: 1.4; }
            .action-bar { background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .btn-print { background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
            .btn-close { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; margin-left: 8px; cursor: pointer; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 14px 0 6px 0; padding-bottom: 3px; border-bottom: 1.5px solid #cbd5e1; }
            .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; margin-bottom: 12px; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 12px; font-size: 9.5px; }
            .info-lbl { font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase; }
            .info-val { font-size: 10px; font-weight: 700; color: #0f172a; margin-top: 1px; }
            .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
            .kpi-box { background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; text-align: center; }
            @media print { .action-bar { display: none !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <div>
              <div style="font-weight: 700; font-size: 13px;">Store Issue Voucher: ${record.sivNumber}</div>
              <div style="font-size: 10px; color: #94a3b8;">Destination: ${record.departmentDetail} • Date: ${record.date}</div>
            </div>
            <div>
              <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
              <button class="btn-close" onclick="window.close()">Close</button>
            </div>
          </div>

          ${dynamicHeaderHtml}

          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <div style="font-size: 16px; font-weight: 900; color: #92400e; font-family: monospace;">SIV: ${record.sivNumber}</div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${record.itemName}</div>
              </div>
              <div>
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; background: #fef3c7; color: #92400e; border: 1px solid #fde68a;">
                  AUTHORIZED ISSUE
                </span>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="info-lbl">Requisition Number</div>
                <div class="info-val" style="font-family: monospace;">${record.requisitionNumber}</div>
              </div>
              <div>
                <div class="info-lbl">Issue Date</div>
                <div class="info-val" style="font-family: monospace;">${record.date}</div>
              </div>
              <div>
                <div class="info-lbl">Target Floor / Line</div>
                <div class="info-val" style="color: #1e3a8a;">${record.departmentDetail}</div>
              </div>
              <div>
                <div class="info-lbl">Material SKU</div>
                <div class="info-val" style="font-family: monospace;">${record.sku}</div>
              </div>
              <div>
                <div class="info-lbl">Category</div>
                <div class="info-val">${record.category || 'FABRIC'}</div>
              </div>
              <div>
                <div class="info-lbl">Allocated PO Number</div>
                <div class="info-val" style="font-family: monospace; color: #2563eb;">${record.poNumber || '-'}</div>
              </div>
              <div>
                <div class="info-lbl">Style Reference</div>
                <div class="info-val">${record.styleNumber || '-'}</div>
              </div>
              <div>
                <div class="info-lbl">Buyer / Account</div>
                <div class="info-val">${record.buyerName || '-'}</div>
              </div>
              <div>
                <div class="info-lbl">Requisition Purpose</div>
                <div class="info-val">${record.purpose || 'Production Line Loading'}</div>
              </div>
              <div>
                <div class="info-lbl">Floor Line Receiver</div>
                <div class="info-val" style="color: #047857;">${record.receivedByFloor}</div>
              </div>
              <div>
                <div class="info-lbl">Store Issuer</div>
                <div class="info-val">${record.issuedBy}</div>
              </div>
              <div>
                <div class="info-lbl">Authorized Approver</div>
                <div class="info-val">${record.approvedBy || 'Store Manager'}</div>
              </div>
            </div>
          </div>

          <!-- Volume Summary -->
          <div class="kpi-row">
            <div class="kpi-box" style="background: #fffbeb; border-color: #fde68a;">
              <div style="font-size: 8px; color: #92400e; font-weight: 700; text-transform: uppercase;">Issued Quantity</div>
              <div style="font-size: 16px; font-weight: 900; color: #92400e; font-family: monospace; margin-top: 2px;">
                -${record.issuedQty.toLocaleString()} ${record.unit}
              </div>
            </div>
            <div class="kpi-box">
              <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">Rolls / Packages Dispatched</div>
              <div style="font-size: 16px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px;">
                ${record.rollsIssued || 0} Rolls
              </div>
            </div>
            <div class="kpi-box">
              <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">Requisition Fulfillment</div>
              <div style="font-size: 16px; font-weight: 900; color: #047857; font-family: monospace; margin-top: 2px;">
                100% Complete
              </div>
            </div>
            <div class="kpi-box">
              <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">Remaining Stock on Hand</div>
              <div style="font-size: 16px; font-weight: 900; color: #1e40af; font-family: monospace; margin-top: 2px;">
                ${matchedItem ? matchedItem.quantityMeters.toLocaleString() + ' ' + (matchedItem.unit || 'm') : 'Deducted'}
              </div>
            </div>
          </div>

          <!-- Compliance Note -->
          <div class="section-title">Store Dispatch &amp; Floor Custody Notice</div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; font-size: 9.5px; background: white; margin-bottom: 14px;">
            <strong>Custody Handover:</strong> The material quantities listed on this Store Issue Voucher (SIV) have been verified, physically inspected, and handed over to the receiving production line. Any cutting waste variances or line rejects must be reported via Material Return Slip (MRS).
          </div>

          ${renderFooterSignaturesHtml(
            options?.signatureMode || 'none',
            'ISSUED BY (STORE)',
            'Central Warehouse Section',
            'RECEIVED BY (FLOOR LINE)',
            'Line Production Supervisor'
          )}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export single issue record PDF:', err);
    alert('An unexpected error occurred while generating the SIV PDF voucher.');
  }
}

export function exportSingleIssueRecordExcel(
  record: IssueRecord,
  matchedItem?: InventoryItem
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const company = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';
    const dateStr = new Date().toLocaleString();

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, sans-serif; font-size: 11pt; color: #0f172a; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
            th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 5px; }
          </style>
        </head>
        <body>
          <h2>${company}</h2>
          <div style="font-size: 13pt; font-weight: bold; color: #92400e;">
            STORE ISSUE VOUCHER (SIV): ${record.sivNumber}
          </div>
          <div style="color: #64748b; font-size: 9pt; margin-bottom: 12px;">Export Date: ${dateStr}</div>

          <table>
            <tr style="background: #f1f5f9; font-weight: bold;"><td colspan="4">SIV VOUCHER PARAMETERS</td></tr>
            <tr>
              <td style="width: 20%; font-weight: bold;">SIV Number</td>
              <td style="width: 30%; font-family: monospace; font-weight: bold; color: #92400e;">${record.sivNumber}</td>
              <td style="width: 20%; font-weight: bold;">Issue Date</td>
              <td style="width: 30%; font-family: monospace;">${record.date}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Destination Floor / Line</td>
              <td style="font-weight: bold;">${record.departmentDetail}</td>
              <td style="font-weight: bold;">Requisition Number</td>
              <td style="font-family: monospace;">${record.requisitionNumber}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Material Item</td>
              <td style="font-weight: bold;">${record.itemName}</td>
              <td style="font-weight: bold;">SKU Code</td>
              <td style="font-family: monospace;">${record.sku}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Allocated PO Number</td>
              <td style="font-family: monospace; color: #1d4ed8;">${record.poNumber || '-'}</td>
              <td style="font-weight: bold;">Allocated Style</td>
              <td>${record.styleNumber || '-'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Issued Quantity</td>
              <td style="font-weight: bold; color: #92400e; font-size: 12pt;">-${record.issuedQty} ${record.unit} (${record.rollsIssued || 0} Rolls)</td>
              <td style="font-weight: bold;">Purpose</td>
              <td>${record.purpose || 'Production Floor Issue'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Floor Receiver</td>
              <td style="font-weight: bold; color: #047857;">${record.receivedByFloor}</td>
              <td style="font-weight: bold;">Store Issuer</td>
              <td>${record.issuedBy}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Approver</td>
              <td colspan="3">${record.approvedBy || 'Store Manager'}</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SIV_${record.sivNumber}_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export single issue record Excel:', err);
    alert('An unexpected error occurred while generating the Excel spreadsheet.');
  }
}
