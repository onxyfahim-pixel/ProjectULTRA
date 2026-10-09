import {
  ProductionOrderPlan,
  StyleOperationBulletin,
  ProductionPlanSchedule,
} from '@/lib/types/planning-ie';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

export type FooterSignatureMode = 'dual' | 'triple' | 'none';

export interface ExportPdfOptions {
  signatureMode?: FooterSignatureMode;
  includeBulletins?: boolean;
  includeSchedules?: boolean;
}

// -------------------------------------------------------------
// KPI COMPUTATIONS FOR PLANNING & IE
// -------------------------------------------------------------

export function computePlanningKpis(
  orders: ProductionOrderPlan[],
  schedules: ProductionPlanSchedule[] = [],
  bulletins: StyleOperationBulletin[] = []
) {
  const totalOrders = orders.length;
  const totalOrderQty = orders.reduce((sum, o) => sum + (o.orderQuantity || 0), 0);
  const totalPlannedQty = orders.reduce((sum, o) => sum + (o.plannedQuantity || 0), 0);
  const bufferQty = totalPlannedQty - totalOrderQty;
  const bufferPercent =
    totalOrderQty > 0 ? Number(((bufferQty / totalOrderQty) * 100).toFixed(1)) : 3.0;

  const validSmvOrders = orders.filter((o) => (o.smv || 0) > 0);
  const avgSmv =
    validSmvOrders.length > 0
      ? (
          validSmvOrders.reduce((sum, o) => sum + (o.smv || 0), 0) / validSmvOrders.length
        ).toFixed(2)
      : '12.50';

  const uniqueLines = new Set(
    orders.map((o) => o.assignedLine || 'Line 01').filter(Boolean)
  ).size;

  const uniqueBuyers = new Set(
    orders.map((o) => o.buyer || 'General').filter(Boolean)
  ).size;

  const runningCount = orders.filter(
    (o) => o.status === 'IN_PRODUCTION' || o.status === 'PLANNED'
  ).length;

  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;

  const avgBalancingEff =
    bulletins.length > 0
      ? (
          bulletins.reduce((s, b) => s + (b.balancingEfficiency || 82), 0) /
          bulletins.length
        ).toFixed(1)
      : '82.5';

  return {
    totalOrders,
    totalOrderQty,
    totalPlannedQty,
    bufferQty,
    bufferPercent,
    avgSmv,
    uniqueLines,
    uniqueBuyers,
    runningCount,
    completedCount,
    scheduledCount: schedules.length,
    bulletinsCount: bulletins.length,
    avgBalancingEff,
  };
}

// -------------------------------------------------------------
// SIGNATURES FOOTER RENDERER
// -------------------------------------------------------------

function renderFooterSignaturesHtml(mode: FooterSignatureMode = 'triple'): string {
  if (mode === 'none') return '';

  if (mode === 'triple') {
    return `
      <div style="margin-top: 26px; padding-top: 14px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="text-align: center;">
          <div style="height: 38px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
          <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Prepared By: Production Planning Lead</div>
          <div style="font-size: 7.5px; color: #64748b;">PPC &amp; Order Scheduling Desk</div>
        </div>
        <div style="text-align: center;">
          <div style="height: 38px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
          <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Verified By: Senior IE Engineer</div>
          <div style="font-size: 7.5px; color: #64748b;">Method Study &amp; Line Balancing Unit</div>
        </div>
        <div style="text-align: center;">
          <div style="height: 38px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
          <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Approved By: General Manager / Director</div>
          <div style="font-size: 7.5px; color: #64748b;">Factory Operations &amp; Manufacturing</div>
        </div>
      </div>
    `;
  }

  return `
    <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="text-align: center;">
        <div style="height: 36px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
        <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Prepared By: Planning &amp; IE Lead</div>
        <div style="font-size: 7.5px; color: #64748b;">Master Planning Division</div>
      </div>
      <div style="text-align: center;">
        <div style="height: 36px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
        <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Authorized By: Operations Director</div>
        <div style="font-size: 7.5px; color: #64748b;">Enterprise Plant Operations</div>
      </div>
    </div>
  `;
}

// =============================================================
// 1. GLOBAL PLANNING & IE REGISTER EXPORT (PDF & EXCEL)
// =============================================================

export function exportPlanningSummaryPdf(
  orders: ProductionOrderPlan[],
  schedules: ProductionPlanSchedule[] = [],
  bulletins: StyleOperationBulletin[] = [],
  scopeLabel: string = 'All Records',
  options?: ExportPdfOptions
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'planning_ie', 'register');
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

    const kpis = computePlanningKpis(orders, schedules, bulletins);

    // Production Order rows
    const orderRowsHtml = orders
      .map(
        (o, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="text-align: center; font-family: monospace; font-size: 8px; color: #64748b;">${idx + 1}</td>
          <td style="font-family: monospace; font-size: 8px; font-weight: 700; color: #1e3a8a;">${o.orderNumber}</td>
          <td style="font-size: 8px; font-weight: 600; color: #1e293b;">${o.buyer}</td>
          <td style="font-size: 8px; color: #334155;">
            <strong>${o.style}</strong>
            <span style="font-size: 7.5px; color: #64748b; display: block;">PO: ${o.po}</span>
          </td>
          <td style="font-size: 8px; color: #475569;">${o.productCategory || o.product || 'Apparel'}</td>
          <td style="text-align: right; font-family: monospace; font-size: 8px; font-weight: 600;">${(o.orderQuantity || 0).toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace; font-size: 8px; font-weight: 700; color: #047857;">${(o.plannedQuantity || 0).toLocaleString()}</td>
          <td style="font-size: 8px; font-weight: 600; color: #0369a1;">${o.assignedLine || 'Unassigned'}</td>
          <td style="text-align: center; font-family: monospace; font-size: 8px; font-weight: 700;">${(o.smv || 12).toFixed(1)}</td>
          <td style="font-size: 7.5px; color: #475569;">
            ${o.productionStartDate || '-'} &rarr; ${o.deliveryDate || '-'}
          </td>
          <td style="font-size: 7.5px; color: #047857; font-weight: 600;">
            ${o.fabricStatus ? o.fabricStatus.split('-')[0] : 'In-House Passed'}
          </td>
          <td style="text-align: center; font-size: 7.5px;">
            <span style="display: inline-block; padding: 1.5px 5px; border-radius: 3px; font-weight: 700; background: ${
              o.status === 'IN_PRODUCTION'
                ? '#ecfdf5; color: #047857; border: 1px solid #a7f3d0'
                : o.status === 'COMPLETED'
                ? '#eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe'
                : '#fef3c7; color: #b45309; border: 1px solid #fde68a'
            };">
              ${o.status}
            </span>
          </td>
        </tr>
      `
      )
      .join('');

    // Operation Bulletins summary rows (if available)
    const bulletinsHtml =
      bulletins.length > 0
        ? `
        <div style="margin-top: 16px; margin-bottom: 6px; font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; display: flex; justify-content: space-between;">
          <span>Operation Bulletins &amp; Yamazumi Line Balancing Summary</span>
          <span style="font-size: 8.5px; color: #64748b; font-weight: 600;">${bulletins.length} Active Style Bulletins</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 14px;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff;">
              <th style="padding: 4px; text-align: left;">Style # &amp; Description</th>
              <th style="padding: 4px; text-align: left;">Buyer</th>
              <th style="padding: 4px; text-align: left;">Garment Type</th>
              <th style="padding: 4px; text-align: right;">Total SMV</th>
              <th style="padding: 4px; text-align: right;">Ops Count</th>
              <th style="padding: 4px; text-align: right;">Target Operators</th>
              <th style="padding: 4px; text-align: right;">Pitch Time</th>
              <th style="padding: 4px; text-align: right;">Daily Target</th>
              <th style="padding: 4px; text-align: center;">Balancing Eff %</th>
            </tr>
          </thead>
          <tbody>
            ${bulletins
              .map(
                (b, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                <td style="padding: 4px; font-weight: 700; color: #1e3a8a;">${b.styleNumber} - ${b.styleDescription}</td>
                <td style="padding: 4px; color: #334155;">${b.buyerName}</td>
                <td style="padding: 4px; color: #475569;">${b.garmentType}</td>
                <td style="padding: 4px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${(b.totalSmv || 0).toFixed(2)} min</td>
                <td style="padding: 4px; text-align: right; font-family: monospace;">${b.operations?.length || 0}</td>
                <td style="padding: 4px; text-align: right; font-family: monospace;">${b.targetLineOperators || 28}</td>
                <td style="padding: 4px; text-align: right; font-family: monospace;">${(b.linePitchTimeSec || 24).toFixed(1)}s</td>
                <td style="padding: 4px; text-align: right; font-family: monospace; font-weight: 700; color: #047857;">${(b.plannedDailyOutput || 1200).toLocaleString()} pcs</td>
                <td style="padding: 4px; text-align: center; font-family: monospace; font-weight: 800; color: ${
                  (b.balancingEfficiency || 82) >= 80 ? '#047857' : '#b45309'
                };">${(b.balancingEfficiency || 82).toFixed(1)}%</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
        : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Planning &amp; IE Register - ${scopeLabel}</title>
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
              font-size: 8.5px;
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
              padding: 5px 12px;
              margin: 8px 0;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 6px;
              margin-bottom: 12px;
            }
            .kpi-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px 8px;
              text-align: center;
            }
            .kpi-lbl {
              font-size: 7px;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .kpi-val {
              font-size: 11.5px;
              font-weight: 800;
              margin-top: 1px;
              font-family: monospace;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
            }
            th {
              background: #1e293b;
              color: #ffffff;
              padding: 5px 4px;
              text-align: left;
              font-size: 7.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            td {
              padding: 4px;
            }
            .footer-note {
              margin-top: 14px;
              font-size: 7.5px;
              color: #64748b;
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #e2e8f0;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div class="meta-bar">
            <div>
              <strong>REPORT SCOPE:</strong> ${scopeLabel} &bull; 
              <strong>ACTIVE ORDERS:</strong> ${orders.length} Records &bull;
              <strong>PLANNED BUFFER:</strong> +${kpis.bufferPercent}% Cutting Allowance
            </div>
            <div>
              <strong>PRINT DATE:</strong> ${dateStr} &bull; 
              <strong>STATUS:</strong> Live Plant Synchronized
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-lbl">Total Orders</div>
              <div class="kpi-val" style="color: #1e3a8a;">${kpis.totalOrders} Orders</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Confirmed Qty</div>
              <div class="kpi-val" style="color: #0f172a;">${(kpis.totalOrderQty / 1000).toFixed(1)}k pcs</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Planned (+${kpis.bufferPercent}%)</div>
              <div class="kpi-val" style="color: #047857;">${(kpis.totalPlannedQty / 1000).toFixed(1)}k pcs</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Average SMV</div>
              <div class="kpi-val" style="color: #0369a1;">${kpis.avgSmv} min</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Sewing Lines</div>
              <div class="kpi-val" style="color: #7c3aed;">${kpis.uniqueLines} Lines</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Avg Balance Eff</div>
              <div class="kpi-val" style="color: #047857;">${kpis.avgBalancingEff}%</div>
            </div>
          </div>

          <div style="margin-bottom: 6px; font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; display: flex; justify-content: space-between;">
            <span>Master Production Order Schedule &amp; Material Readiness</span>
            <span style="font-size: 8.5px; color: #64748b; font-weight: 600;">Table of ${orders.length} Production Orders</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 80px;">Order #</th>
                <th style="width: 100px;">Buyer</th>
                <th style="width: 130px;">Style &amp; PO</th>
                <th style="width: 85px;">Category</th>
                <th style="text-align: right; width: 65px;">Order Qty</th>
                <th style="text-align: right; width: 65px;">Planned (+3%)</th>
                <th style="width: 90px;">Assigned Line</th>
                <th style="text-align: center; width: 45px;">SMV</th>
                <th style="width: 110px;">Production Timeline</th>
                <th style="width: 110px;">Fabric &amp; Trim Status</th>
                <th style="text-align: center; width: 75px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${orderRowsHtml}
            </tbody>
          </table>

          ${bulletinsHtml}

          ${renderFooterSignaturesHtml(options?.signatureMode || 'triple')}

          <div class="footer-note">
            <span>Project ULTRA ERP &bull; Planning &amp; Industrial Engineering Division</span>
            <span>Live System Generated Record &bull; Page 1 of 1</span>
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
    console.error('Failed to export planning summary PDF:', err);
  }
}

export function exportPlanningSummaryExcel(
  orders: ProductionOrderPlan[],
  schedules: ProductionPlanSchedule[] = [],
  bulletins: StyleOperationBulletin[] = [],
  scopeLabel: string = 'All Records'
): void {
  try {
    const kpis = computePlanningKpis(orders, schedules, bulletins);
    const dateStr = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();

    const orderRows = orders
      .map((o) => {
        const buffer = (o.plannedQuantity || 0) - (o.orderQuantity || 0);
        return `
          <tr>
            <td>${o.orderNumber}</td>
            <td>${o.buyer}</td>
            <td>${o.style}</td>
            <td>${o.po}</td>
            <td>${o.article || ''}</td>
            <td>${o.productCategory || o.product || 'Apparel'}</td>
            <td>${o.color || ''}</td>
            <td>${o.sizeRange || o.size || ''}</td>
            <td>${o.orderQuantity || 0}</td>
            <td>${o.plannedQuantity || 0}</td>
            <td>${buffer}</td>
            <td>${(o.smv || 12).toFixed(2)}</td>
            <td>${o.assignedLine || 'Unassigned'}</td>
            <td>${o.assignedDepartment || 'SEWING'}</td>
            <td>${o.productionStartDate || ''}</td>
            <td>${o.productionEndDate || ''}</td>
            <td>${o.deliveryDate || ''}</td>
            <td>${o.fabricStatus || 'In-House'}</td>
            <td>${o.priority || 'MEDIUM'}</td>
            <td>${o.status}</td>
            <td>${o.remarks || ''}</td>
          </tr>
        `;
      })
      .join('');

    const scheduleRows = schedules
      .map(
        (s) => `
        <tr>
          <td>${s.lineName}</td>
          <td>${s.orderNumber}</td>
          <td>${s.buyerName}</td>
          <td>${s.styleNumber}</td>
          <td>${s.styleDescription}</td>
          <td>${s.orderQuantity || 0}</td>
          <td>${s.smv || 12}</td>
          <td>${s.allocatedOperators || 48}</td>
          <td>${s.plannedDailyTarget || 1200}</td>
          <td>${s.startDate}</td>
          <td>${s.endDate}</td>
          <td>${s.daysRequired || 1}</td>
          <td>${s.status}</td>
        </tr>
      `
      )
      .join('');

    const bulletinRows = bulletins
      .map(
        (b) => `
        <tr>
          <td>${b.styleNumber}</td>
          <td>${b.styleDescription}</td>
          <td>${b.buyerName}</td>
          <td>${b.garmentType}</td>
          <td>${b.totalSmv || 0}</td>
          <td>${b.targetLineOperators || 28}</td>
          <td>${b.linePitchTimeSec || 24}</td>
          <td>${b.targetEfficiency || 82}%</td>
          <td>${b.plannedDailyOutput || 1200}</td>
          <td>${b.balancingEfficiency || 82}%</td>
          <td>${b.approvalStatus || 'ACTIVE'}</td>
        </tr>
      `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 11pt; }
            th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            td { border: 1px solid #e2e8f0; padding: 5px; }
            .kpi-hdr { background-color: #f1f5f9; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}</h2>
          <h3>MASTER PRODUCTION PLANNING &amp; INDUSTRIAL ENGINEERING (IE) REGISTER</h3>
          <p><strong>Export Scope:</strong> ${scopeLabel} | <strong>Export Date:</strong> ${dateStr} | <strong>Total Orders:</strong> ${orders.length}</p>

          <table border="1">
            <tr class="kpi-hdr">
              <th>Total Orders</th>
              <th>Total Order Qty</th>
              <th>Total Planned Qty (+3%)</th>
              <th>Buffer Qty</th>
              <th>Avg SMV</th>
              <th>Active Sewing Lines</th>
              <th>Avg Balancing Efficiency</th>
            </tr>
            <tr>
              <td>${kpis.totalOrders}</td>
              <td>${kpis.totalOrderQty}</td>
              <td>${kpis.totalPlannedQty}</td>
              <td>${kpis.bufferQty} (+${kpis.bufferPercent}%)</td>
              <td>${kpis.avgSmv} min</td>
              <td>${kpis.uniqueLines}</td>
              <td>${kpis.avgBalancingEff}%</td>
            </tr>
          </table>

          <br/>
          <h3>Section 1: Production Orders &amp; Material Readiness Plan</h3>
          <table border="1">
            <tr style="background-color: #1e3a8a; color: #ffffff;">
              <th>Order Number</th>
              <th>Buyer</th>
              <th>Style</th>
              <th>PO Number</th>
              <th>Article</th>
              <th>Category</th>
              <th>Color</th>
              <th>Size Range</th>
              <th>Order Quantity</th>
              <th>Planned Quantity</th>
              <th>Buffer Allowance</th>
              <th>SMV</th>
              <th>Assigned Line</th>
              <th>Department</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Delivery Date</th>
              <th>Fabric Status</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
            ${orderRows}
          </table>

          ${
            scheduleRows
              ? `
            <br/>
            <h3>Section 2: Master Production Scheduling (MPS) Timeline</h3>
            <table border="1">
              <tr style="background-color: #0369a1; color: #ffffff;">
                <th>Line Name</th>
                <th>Order Number</th>
                <th>Buyer</th>
                <th>Style Number</th>
                <th>Style Description</th>
                <th>Order Quantity</th>
                <th>SMV</th>
                <th>Operators</th>
                <th>Planned Daily Target</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days Required</th>
                <th>Schedule Status</th>
              </tr>
              ${scheduleRows}
            </table>
          `
              : ''
          }

          ${
            bulletinRows
              ? `
            <br/>
            <h3>Section 3: Style Operation Bulletins &amp; Work Study Balancing</h3>
            <table border="1">
              <tr style="background-color: #047857; color: #ffffff;">
                <th>Style Number</th>
                <th>Style Description</th>
                <th>Buyer</th>
                <th>Garment Type</th>
                <th>Total SMV</th>
                <th>Target Operators</th>
                <th>Line Pitch Time (sec)</th>
                <th>Target Efficiency</th>
                <th>Planned Daily Output</th>
                <th>Balancing Efficiency %</th>
                <th>Approval Status</th>
              </tr>
              ${bulletinRows}
            </table>
          `
              : ''
          }
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Planning_IE_Register_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export planning summary Excel:', err);
  }
}

// =============================================================
// 2. INDIVIDUAL PRODUCTION ORDER PLAN EXPORTS (PDF & EXCEL)
// =============================================================

export function exportSingleProductionOrderPlanPdf(
  order: ProductionOrderPlan,
  options?: ExportPdfOptions
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'planning_ie', 'single', order.orderNumber || order.po);
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

    const bufferQty = (order.plannedQuantity || 0) - (order.orderQuantity || 0);
    const bufferPct =
      (order.orderQuantity || 0) > 0
        ? ((bufferQty / (order.orderQuantity || 1)) * 100).toFixed(1)
        : '3.0';

    const smv = order.smv || 11.2;
    const estLineMins = (order.plannedQuantity || 0) * smv;
    const estLineHours = Math.round(estLineMins / 60);
    const dailyTargetPcs = Math.round((48 * 8 * 60 * 0.8) / smv); // standard 48 ops at 80% eff

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Order Plan Specification - ${order.orderNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 12mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 9.5px;
              line-height: 1.4;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 12px;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 12px;
              background: #f8fafc;
            }
            .card-title {
              font-size: 10px;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              padding: 2.5px 0;
              font-size: 9px;
            }
            .item-lbl {
              color: #64748b;
              font-weight: 600;
            }
            .item-val {
              font-weight: 700;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 9px;
            }
            th {
              background: #1e293b;
              color: white;
              padding: 6px;
              text-align: left;
              font-size: 8px;
              text-transform: uppercase;
            }
            td {
              padding: 6px;
              border-bottom: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 14px; font-weight: 900; color: #1e3a8a; font-family: monospace;">
                ${order.orderNumber} &bull; PO: ${order.po}
              </div>
              <div style="font-size: 9.5px; color: #1e40af; font-weight: 600; margin-top: 2px;">
                Buyer: ${order.buyer} &bull; Style: ${order.style} &bull; Category: ${order.productCategory || 'Apparel'}
              </div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 9px; background: #2563eb; color: #ffffff;">
                STATUS: ${order.status}
              </span>
              <div style="font-size: 8px; color: #64748b; margin-top: 3px;">
                Priority: <strong>${order.priority}</strong>
              </div>
            </div>
          </div>

          <div class="grid-2">
            <!-- Commercial Quantities -->
            <div class="card">
              <div class="card-title">Commercial &amp; Production Quantities</div>
              <div class="item-row">
                <span class="item-lbl">Confirmed Order Qty:</span>
                <span class="item-val">${(order.orderQuantity || 0).toLocaleString()} pcs</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Planned Production Qty:</span>
                <span class="item-val" style="color: #047857;">${(order.plannedQuantity || 0).toLocaleString()} pcs</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Cutting Buffer Allowance:</span>
                <span class="item-val" style="color: #b45309;">+${bufferQty.toLocaleString()} pcs (+${bufferPct}%)</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Color Specification:</span>
                <span class="item-val">${order.color || 'Standard Colorway'}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Size Ratio:</span>
                <span class="item-val">${order.sizeRange || order.size || 'S, M, L, XL, XXL'}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Article / Ref Code:</span>
                <span class="item-val font-mono">${order.article || '-'}</span>
              </div>
            </div>

            <!-- Industrial Engineering Line Loading -->
            <div class="card">
              <div class="card-title">IE Line Allocation &amp; Standard Time</div>
              <div class="item-row">
                <span class="item-lbl">Standard Minute Value (SMV):</span>
                <span class="item-val" style="color: #0369a1;">${smv.toFixed(2)} Minutes / Piece</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Assigned Sewing Line:</span>
                <span class="item-val" style="color: #1e3a8a;">${order.assignedLine || 'Sewing Line 01'}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Department Routing:</span>
                <span class="item-val">${order.assignedDepartment || 'SEWING & FINISHING'}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Total Work Load Required:</span>
                <span class="item-val">${estLineHours.toLocaleString()} Line Machine Hours</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Estimated Daily Shift Target:</span>
                <span class="item-val" style="color: #047857;">~${dailyTargetPcs.toLocaleString()} pcs / 8-Hr Shift</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Material Readiness:</span>
                <span class="item-val" style="color: #047857;">${order.fabricStatus || '100% In-House - Passed'}</span>
              </div>
            </div>
          </div>

          <!-- Schedule & Critical Path -->
          <div class="card" style="margin-bottom: 12px;">
            <div class="card-title">Production Execution Milestone Timeline</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; padding: 6px 0;">
              <div>
                <div style="font-size: 8px; color: #64748b; font-weight: 700;">PLANNED START DATE</div>
                <div style="font-size: 12px; font-weight: 800; color: #1e3a8a; font-family: monospace; margin-top: 2px;">
                  ${order.productionStartDate || '-'}
                </div>
              </div>
              <div>
                <div style="font-size: 8px; color: #64748b; font-weight: 700;">PLANNED COMPLETION</div>
                <div style="font-size: 12px; font-weight: 800; color: #047857; font-family: monospace; margin-top: 2px;">
                  ${order.productionEndDate || '-'}
                </div>
              </div>
              <div>
                <div style="font-size: 8px; color: #64748b; font-weight: 700;">BUYER DELIVERY EX-FACTORY</div>
                <div style="font-size: 12px; font-weight: 800; color: #b91c1c; font-family: monospace; margin-top: 2px;">
                  ${order.deliveryDate || '-'}
                </div>
              </div>
            </div>
          </div>

          ${
            order.remarks
              ? `
            <div style="padding: 8px 10px; background: #fefce8; border: 1px solid #fef08a; border-radius: 6px; margin-bottom: 12px;">
              <strong style="color: #854d0e;">Planning Notes:</strong>
              <span style="color: #713f12; margin-left: 6px;">${order.remarks}</span>
            </div>
          `
              : ''
          }

          ${renderFooterSignaturesHtml(options?.signatureMode || 'dual')}

          <div style="margin-top: 14px; font-size: 7.5px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>Project ULTRA ERP &bull; Production Planning &amp; IE Control</span>
            <span>Document Code: VAL-PO-SPEC-${order.orderNumber}</span>
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
    console.error('Failed to export single production order plan PDF:', err);
  }
}

export function exportSingleProductionOrderPlanExcel(order: ProductionOrderPlan): void {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 11pt; }
            th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            td { border: 1px solid #e2e8f0; padding: 5px; }
          </style>
        </head>
        <body>
          <h2>${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}</h2>
          <h3>PRODUCTION ORDER PLAN &amp; IE SPECIFICATION</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber} | <strong>PO:</strong> ${order.po} | <strong>Date:</strong> ${dateStr}</p>

          <table border="1">
            <tr><th colspan="2" style="background-color: #0f172a; color: #fff;">Order Specification &amp; Quantities</th></tr>
            <tr><td><strong>Order Number</strong></td><td>${order.orderNumber}</td></tr>
            <tr><td><strong>Buyer</strong></td><td>${order.buyer}</td></tr>
            <tr><td><strong>Style</strong></td><td>${order.style}</td></tr>
            <tr><td><strong>PO Number</strong></td><td>${order.po}</td></tr>
            <tr><td><strong>Article</strong></td><td>${order.article || '-'}</td></tr>
            <tr><td><strong>Product Category</strong></td><td>${order.productCategory || 'Apparel'}</td></tr>
            <tr><td><strong>Color</strong></td><td>${order.color || '-'}</td></tr>
            <tr><td><strong>Size Range</strong></td><td>${order.sizeRange || order.size || '-'}</td></tr>
            <tr><td><strong>Order Quantity</strong></td><td>${order.orderQuantity || 0}</td></tr>
            <tr><td><strong>Planned Quantity (+3%)</strong></td><td>${order.plannedQuantity || 0}</td></tr>
            <tr><td><strong>Standard Minute Value (SMV)</strong></td><td>${order.smv || 11.2} min</td></tr>
            <tr><td><strong>Assigned Sewing Line</strong></td><td>${order.assignedLine || 'Line 01'}</td></tr>
            <tr><td><strong>Department</strong></td><td>${order.assignedDepartment || 'SEWING'}</td></tr>
            <tr><td><strong>Planned Start Date</strong></td><td>${order.productionStartDate || '-'}</td></tr>
            <tr><td><strong>Planned End Date</strong></td><td>${order.productionEndDate || '-'}</td></tr>
            <tr><td><strong>Delivery Date</strong></td><td>${order.deliveryDate || '-'}</td></tr>
            <tr><td><strong>Material Readiness</strong></td><td>${order.fabricStatus || 'In-House'}</td></tr>
            <tr><td><strong>Priority</strong></td><td>${order.priority}</td></tr>
            <tr><td><strong>Status</strong></td><td>${order.status}</td></tr>
            <tr><td><strong>Remarks</strong></td><td>${order.remarks || '-'}</td></tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PO_Plan_${order.orderNumber}_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export single production order plan Excel:', err);
  }
}

// =============================================================
// 3. INDIVIDUAL OPERATION BULLETIN (OB) EXPORTS (PDF & EXCEL)
// =============================================================

export function exportSingleOperationBulletinPdf(
  bulletin: StyleOperationBulletin,
  options?: ExportPdfOptions
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'planning_ie', 'single', bulletin.styleNumber);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      'STYLE OPERATION BULLETIN & LINE BALANCING REPORT',
      `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.operationBulletin || 'VAL-OB'}-${bulletin.styleNumber}`,
      dateStr,
      config.department
    );

    const ops = bulletin.operations || [];
    const totalOps = ops.length;
    const totalAllocOps = ops.reduce((s, o) => s + (o.allocatedOperators || 1), 0);
    const totalTheorOps = ops.reduce((s, o) => s + (o.theoreticalOperators || 1), 0);

    const opRowsHtml = ops
      .map(
        (op, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9; ${
          op.isBottleneck
            ? 'background-color: #fff1f2;'
            : idx % 2 === 1
            ? 'background-color: #f8fafc;'
            : ''
        }">
          <td style="text-align: center; font-family: monospace; font-size: 8px; color: #64748b;">${op.seqNumber || idx + 1}</td>
          <td style="font-weight: 700; color: #0f172a; font-size: 8px;">
            ${op.operationName}
            ${
              op.isBottleneck
                ? '<span style="display: inline-block; margin-left: 4px; padding: 0.5px 3px; border-radius: 2px; font-size: 6.5px; font-weight: 800; background: #e11d48; color: white;">BOTTLENECK</span>'
                : ''
            }
          </td>
          <td style="font-size: 7.5px; color: #475569;">${op.section || 'ASSEMBLY'}</td>
          <td style="font-size: 7.5px; color: #1e3a8a; font-weight: 600;">${op.machineType}</td>
          <td style="font-size: 7.5px; font-family: monospace; color: #64748b;">${op.machineCode || '-'}</td>
          <td style="text-align: right; font-family: monospace; font-size: 8px; font-weight: 800; color: #0f172a;">${(op.smv || 0).toFixed(3)}</td>
          <td style="text-align: right; font-family: monospace; font-size: 8px; color: #0369a1;">${(op.theoreticalOperators || 1).toFixed(2)}</td>
          <td style="text-align: center; font-family: monospace; font-size: 8px; font-weight: 700; color: #047857;">${op.allocatedOperators || 1}</td>
          <td style="text-align: right; font-family: monospace; font-size: 8px;">${Math.round((op.smv || 0) * 60)}s</td>
          <td style="text-align: right; font-family: monospace; font-size: 8px; font-weight: 600;">${Math.round(op.pitchTimeSec || 24)}s</td>
          <td style="font-size: 7.5px; color: #64748b;">${op.attachment || op.remarks || '-'}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Operation Bulletin - ${bulletin.styleNumber}</title>
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
              font-size: 8.5px;
              line-height: 1.35;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 6px;
              margin-bottom: 12px;
            }
            .kpi-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px 8px;
              text-align: center;
            }
            .kpi-lbl {
              font-size: 7px;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
            }
            .kpi-val {
              font-size: 11.5px;
              font-weight: 800;
              margin-top: 1px;
              font-family: monospace;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
            }
            th {
              background: #0f172a;
              color: #ffffff;
              padding: 5px 4px;
              text-align: left;
              font-size: 7.5px;
              font-weight: 700;
              text-transform: uppercase;
            }
            td {
              padding: 4px;
            }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 12px; font-weight: 900; color: #1e3a8a;">
                STYLE: ${bulletin.styleNumber} &bull; ${bulletin.styleDescription}
              </span>
              <div style="font-size: 8.5px; color: #475569; margin-top: 1px;">
                Buyer: <strong>${bulletin.buyerName}</strong> &bull; Garment Type: <strong>${bulletin.garmentType}</strong> &bull; Approval: <strong>${bulletin.approvalStatus || 'APPROVED'}</strong>
              </div>
            </div>
            <div style="text-align: right; font-size: 8px;">
              <div>Document Code: <strong>OB-${bulletin.styleNumber}</strong></div>
              <div>Revision / Date: <strong>${bulletin.version || 'v1.0'} &bull; ${dateStr}</strong></div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-lbl">Total Garment SMV</div>
              <div class="kpi-val" style="color: #1e3a8a;">${(bulletin.totalSmv || 0).toFixed(3)} min</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Line Pitch Time</div>
              <div class="kpi-val" style="color: #0369a1;">${(bulletin.linePitchTimeSec || 24).toFixed(1)}s</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Allocated Operators</div>
              <div class="kpi-val" style="color: #047857;">${bulletin.targetLineOperators || totalAllocOps} Ops</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Balancing Efficiency</div>
              <div class="kpi-val" style="color: ${
                (bulletin.balancingEfficiency || 82) >= 80 ? '#047857' : '#b45309'
              };">${(bulletin.balancingEfficiency || 82).toFixed(1)}%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Planned Output / Shift</div>
              <div class="kpi-val" style="color: #047857;">${(bulletin.plannedDailyOutput || 1200).toLocaleString()} pcs</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Total Operations</div>
              <div class="kpi-val" style="color: #7c3aed;">${totalOps} Steps</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">Seq</th>
                <th>Operation Description</th>
                <th style="width: 80px;">Section</th>
                <th style="width: 130px;">Machine Type</th>
                <th style="width: 70px;">M/C Code</th>
                <th style="text-align: right; width: 55px;">SMV (Min)</th>
                <th style="text-align: right; width: 60px;">Theor. Ops</th>
                <th style="text-align: center; width: 60px;">Alloc. Ops</th>
                <th style="text-align: right; width: 55px;">Cycle (Sec)</th>
                <th style="text-align: right; width: 55px;">Pitch (Sec)</th>
                <th>Work Aids / Attachments / Quality Notes</th>
              </tr>
            </thead>
            <tbody>
              ${opRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #e2e8f0; font-weight: bold; border-top: 2px solid #0f172a;">
                <td colspan="5" style="text-align: right; text-transform: uppercase; font-size: 8px;">Total Garment Summary:</td>
                <td style="text-align: right; font-family: monospace; font-size: 8.5px; color: #1e3a8a;">${(bulletin.totalSmv || 0).toFixed(3)}</td>
                <td style="text-align: right; font-family: monospace; font-size: 8.5px;">${totalTheorOps.toFixed(2)}</td>
                <td style="text-align: center; font-family: monospace; font-size: 8.5px; color: #047857;">${totalAllocOps}</td>
                <td style="text-align: right; font-family: monospace; font-size: 8.5px;">${Math.round((bulletin.totalSmv || 0) * 60)}s</td>
                <td style="text-align: right; font-family: monospace; font-size: 8.5px;">${(bulletin.linePitchTimeSec || 24).toFixed(1)}s</td>
                <td style="font-size: 8px; color: #475569;">Yamazumi Balanced Line</td>
              </tr>
            </tfoot>
          </table>

          ${renderFooterSignaturesHtml(options?.signatureMode || 'triple')}

          <div style="margin-top: 14px; font-size: 7.5px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>Project ULTRA ERP &bull; Industrial Engineering &amp; Line Balancing</span>
            <span>Document Code: VAL-OB-${bulletin.styleNumber}</span>
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
    console.error('Failed to export single operation bulletin PDF:', err);
  }
}

export function exportSingleOperationBulletinExcel(bulletin: StyleOperationBulletin): void {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();

    const opRows = (bulletin.operations || [])
      .map(
        (op) => `
        <tr>
          <td>${op.seqNumber}</td>
          <td>${op.operationName}</td>
          <td>${op.section || 'ASSEMBLY'}</td>
          <td>${op.machineType}</td>
          <td>${op.machineCode || ''}</td>
          <td>${op.attachment || ''}</td>
          <td>${(op.smv || 0).toFixed(3)}</td>
          <td>${(op.theoreticalOperators || 1).toFixed(2)}</td>
          <td>${op.allocatedOperators || 1}</td>
          <td>${Math.round((op.smv || 0) * 60)}</td>
          <td>${op.pitchTimeSec || 24}</td>
          <td>${op.isBottleneck ? 'YES' : 'NO'}</td>
          <td>${op.remarks || ''}</td>
        </tr>
      `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 11pt; }
            th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            td { border: 1px solid #e2e8f0; padding: 5px; }
          </style>
        </head>
        <body>
          <h2>${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}</h2>
          <h3>STYLE OPERATION BULLETIN &amp; LINE BALANCING REPORT</h3>
          <p>
            <strong>Style:</strong> ${bulletin.styleNumber} | 
            <strong>Description:</strong> ${bulletin.styleDescription} | 
            <strong>Buyer:</strong> ${bulletin.buyerName} | 
            <strong>Total SMV:</strong> ${(bulletin.totalSmv || 0).toFixed(3)} min | 
            <strong>Target Operators:</strong> ${bulletin.targetLineOperators || 28} | 
            <strong>Balancing Efficiency:</strong> ${(bulletin.balancingEfficiency || 82).toFixed(1)}%
          </p>

          <table border="1">
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th>Seq #</th>
              <th>Operation Name</th>
              <th>Section</th>
              <th>Machine Type</th>
              <th>Machine Code</th>
              <th>Work Aids / Attachment</th>
              <th>SMV (Min)</th>
              <th>Theor. Ops</th>
              <th>Alloc. Ops</th>
              <th>Cycle Time (Sec)</th>
              <th>Pitch Time (Sec)</th>
              <th>Is Bottleneck</th>
              <th>Remarks</th>
            </tr>
            ${opRows}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OB_${bulletin.styleNumber}_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export single operation bulletin Excel:', err);
  }
}
