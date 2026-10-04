'use client';

import { BuyerOrder } from '@/lib/types/modules';
import { InventoryItem, ReceiveRecord } from '@/lib/types/erp';
import { loadPdfHeaderSettings, renderPdfHeaderHtml } from '@/lib/pdf/pdf-header-store';
import {
  computeWIPRecordForPO,
  calculateWIPPipelineMetrics,
} from '@/lib/db/wip-record-store';

/**
 * Universal Export Utilities for Buyer & Order Management Module
 * Supports:
 * 1. Global Export: Detailed Summary Sheet (PDF or Excel) of All or Selected records
 * 2. Individual PO Export: Comprehensive Tech Pack & Specification Sheet (PDF or Excel)
 * 3. Dynamic header linked directly from System Settings (Company Profile & Export Template)
 */

export interface ExportSummaryKpis {
  totalOrders: number;
  totalQuantity: number;
  totalFobValue: number;
  avgFobPrice: number;
  uniqueBuyers: number;
  plannedOrders: number;
  inProgressOrders: number;
  shippedOrders: number;
}

export function computeBuyerOrderKpis(orders: BuyerOrder[]): ExportSummaryKpis {
  const totalOrders = orders.length;
  const totalQuantity = orders.reduce((sum, o) => sum + (Number(o.orderQuantity) || 0), 0);
  const totalFobValue = orders.reduce(
    (sum, o) => sum + (Number(o.orderQuantity) || 0) * (Number(o.fobPrice) || 0),
    0
  );
  const avgFobPrice = totalQuantity > 0 ? totalFobValue / totalQuantity : 0;
  const uniqueBuyers = new Set(orders.map((o) => o.buyerName).filter(Boolean)).size;

  const plannedOrders = orders.filter((o) => o.status === 'PLANNED').length;
  const inProgressOrders = orders.filter((o) =>
    ['CUTTING', 'SEWING', 'PACKING', 'READY_AUDIT'].includes(o.status)
  ).length;
  const shippedOrders = orders.filter((o) => o.status === 'SHIPPED').length;

  return {
    totalOrders,
    totalQuantity,
    totalFobValue,
    avgFobPrice,
    uniqueBuyers,
    plannedOrders,
    inProgressOrders,
    shippedOrders,
  };
}

export type FooterSignatureMode = 'dual' | 'single' | 'none';

export interface ExportPdfOptions {
  signatureMode?: FooterSignatureMode;
}

/**
 * Renders streamlined footer signature blocks.
 * Eliminates redundant middle signature tiers and provides dual, single, or no-signature layouts.
 */
export function renderFooterSignaturesHtml(
  mode: FooterSignatureMode = 'none',
  leftRole = 'ORDER ISSUED BY',
  leftDept = 'Merchandising Sourcing Lead',
  rightRole = 'COMMERCIAL APPROVAL',
  rightDept = 'General Manager / Operations Head'
): string {
  if (!mode || mode === 'none') {
    return '';
  }
  if (mode === 'single') {
    return `
      <!-- Single Authorization Sign-Off -->
      <div style="display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 14px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid;">
        <div style="width: 260px; text-align: center;">
          <div style="border-bottom: 1.5px solid #475569; height: 32px; margin-bottom: 6px;"></div>
          <div style="font-size: 9px; font-weight: 800; color: #1e293b; letter-spacing: 0.3px;">${rightRole}</div>
          <div style="font-size: 8px; color: #64748b;">${rightDept}</div>
        </div>
      </div>
    `;
  }
  return `
    <!-- Streamlined Dual Sign-Off Grid -->
    <div class="sign-grid">
      <div class="sign-col">
        <div class="sign-line"></div>
        <div class="sign-role">${leftRole}</div>
        <div class="sign-dept">${leftDept}</div>
      </div>
      <div class="sign-col">
        <div class="sign-line"></div>
        <div class="sign-role">${rightRole}</div>
        <div class="sign-dept">${rightDept}</div>
      </div>
    </div>
  `;
}

/**
 * GLOBAL EXPORT: PDF Detailed Summary Sheet
 * Renders linked PDF Header from Settings, summary KPIs, comprehensive data table,
 * and streamlined authorization sign-offs.
 */
export function exportBuyerOrdersSummaryPdf(
  orders: BuyerOrder[],
  scopeLabel: string = 'All Records',
  options?: ExportPdfOptions
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to generate the printable PDF summary sheet.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();
    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      'BUYER PURCHASE ORDER REGISTER & PRODUCTION PIPELINE SUMMARY',
      `PO-REG-${today.replace(/-/g, '')}`,
      today,
      'Global Merchandising, Planning & Technical Compliance Division'
    );

    const kpis = computeBuyerOrderKpis(orders);

    const tableRowsHtml = orders
      .map((ord, idx) => {
        const value = ord.orderQuantity * ord.fobPrice;
        const statusColors: Record<string, { bg: string; text: string; border: string }> = {
          PLANNED: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
          CUTTING: { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
          SEWING: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
          PACKING: { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
          READY_AUDIT: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
          SHIPPED: { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
        };
        const badge = statusColors[ord.status] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };

        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="text-align: center; font-weight: 600; color: #64748b;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: 700; color: #0f172a;">${ord.orderNumber}</td>
            <td>
              <div style="font-weight: 700; color: #1e3a8a;">${ord.buyerName}</div>
              <div style="font-size: 8.5px; color: #64748b;">${ord.brand || 'Main Line'}</div>
            </td>
            <td>
              <div style="font-family: monospace; font-weight: 700; color: #1d4ed8;">${ord.styleNumber}</div>
              <div style="font-size: 8.5px; color: #475569; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${ord.styleDescription || '-'}
              </div>
            </td>
            <td style="font-size: 9px; color: #475569;">${ord.season || '-'}</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">
              ${ord.orderQuantity.toLocaleString()} pcs
            </td>
            <td style="text-align: right; font-family: monospace; color: #475569;">
              $${ord.fobPrice.toFixed(2)}
            </td>
            <td style="text-align: right; font-family: monospace; font-weight: 700; color: #047857;">
              $${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style="text-align: center; font-family: monospace; font-size: 9px; color: #475569;">
              ${ord.cuttingStartDate || '-'}
            </td>
            <td style="text-align: center; font-family: monospace; font-size: 9px; font-weight: 600; color: #0f172a;">
              ${ord.shipDate || '-'}
            </td>
            <td style="text-align: center;">
              <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 8.5px; font-weight: 700; background: ${badge.bg}; color: ${badge.text}; border: 1px solid ${badge.border};">
                ${ord.status.replace(/_/g, ' ')}
              </span>
            </td>
            <td style="font-size: 9px;">
              <div style="font-weight: 600; color: #1e293b;">${ord.merchandiserName?.split('(')[0] || 'Assigned Lead'}</div>
              <div style="font-size: 8px; color: #64748b;">${ord.merchandiserEmail || '-'}</div>
            </td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PO-REG-${today} - Buyer & Order Master Summary</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 14px;
              font-size: 9.5px;
              line-height: 1.35;
            }
            .action-bar {
              background: #0f172a;
              color: #ffffff;
              padding: 10px 16px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 14px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .action-bar h1 {
              font-size: 13px;
              font-weight: 700;
              margin: 0;
            }
            .btn-print {
              background: #2563eb;
              color: white;
              border: none;
              padding: 6px 14px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.2s;
            }
            .btn-print:hover {
              background: #1d4ed8;
            }
            .btn-close {
              background: #334155;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 11px;
              margin-left: 8px;
              cursor: pointer;
            }
            .meta-strip {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 7px 10px;
              margin-bottom: 10px;
              font-size: 9.5px;
            }
            .meta-item {
              display: flex;
              gap: 4px;
            }
            .meta-label {
              font-weight: 700;
              color: #475569;
            }
            .meta-val {
              font-weight: 600;
              color: #0f172a;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi-card {
              border-radius: 6px;
              padding: 8px 6px;
              border: 1px solid #e2e8f0;
              text-align: center;
              background: #ffffff;
            }
            .kpi-lbl {
              font-size: 8px;
              text-transform: uppercase;
              font-weight: 700;
              color: #64748b;
              letter-spacing: 0.3px;
            }
            .kpi-val {
              font-size: 13.5px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 1px;
              font-family: monospace;
            }
            .kpi-sub {
              font-size: 7.5px;
              color: #64748b;
              margin-top: 1px;
            }
            .kpi-highlight {
              background: #f0fdf4;
              border-color: #bbf7d0;
            }
            .kpi-highlight .kpi-val {
              color: #166534;
            }
            table.summary-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 9px;
            }
            table.summary-table th {
              background: #1e293b;
              color: #ffffff;
              padding: 6px 6px;
              text-align: left;
              border: 1px solid #0f172a;
              font-weight: 700;
              font-size: 8.5px;
              text-transform: uppercase;
              letter-spacing: 0.2px;
            }
            table.summary-table td {
              padding: 4px 6px;
              border: 1px solid #cbd5e1;
              vertical-align: middle;
            }
            .totals-row td {
              background: #f1f5f9 !important;
              font-weight: 800 !important;
              color: #0f172a !important;
              border-top: 2px solid #0f172a !important;
              border-bottom: 2px solid #0f172a !important;
            }
            .notes-box {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 6px;
              padding: 6px 10px;
              margin-bottom: 12px;
              font-size: 8.5px;
              color: #1e3a8a;
            }
            .sign-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 48px;
              max-width: 680px;
              margin: 20px auto 0 auto;
              padding-top: 14px;
              border-top: 1px dashed #cbd5e1;
              page-break-inside: avoid;
            }
            .sign-col {
              text-align: center;
            }
            .sign-line {
              border-bottom: 1.5px solid #475569;
              height: 30px;
              margin-bottom: 6px;
            }
            .sign-role {
              font-size: 9px;
              font-weight: 800;
              color: #1e293b;
              letter-spacing: 0.3px;
            }
            .sign-dept {
              font-size: 8px;
              color: #64748b;
            }
            @media print {
              .action-bar {
                display: none !important;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <div>
              <h1>Buyer & Order Module - Printable Summary Sheet</h1>
              <div style="font-size: 10px; color: #94a3b8;">
                Scope: ${scopeLabel} • ${orders.length} Purchase Orders • PDF Header linked from Settings
              </div>
            </div>
            <div>
              <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
              <button class="btn-close" onclick="window.close()">Close Preview</button>
            </div>
          </div>

          ${dynamicHeaderHtml}

          <!-- Metadata Strip -->
          <div class="meta-strip">
            <div class="meta-item">
              <span class="meta-label">Export Scope:</span>
              <span class="meta-val">${scopeLabel}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Orders Count:</span>
              <span class="meta-val">${orders.length} Purchase Orders</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Active Buyers:</span>
              <span class="meta-val">${kpis.uniqueBuyers} Global Brands</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated Timestamp:</span>
              <span class="meta-val">${new Date().toLocaleString()}</span>
            </div>
          </div>

          <!-- KPI Summary Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-lbl">Total Orders</div>
              <div class="kpi-val">${kpis.totalOrders}</div>
              <div class="kpi-sub">PO Contracts</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Total Volume</div>
              <div class="kpi-val">${kpis.totalQuantity.toLocaleString()}</div>
              <div class="kpi-sub">Garment Pieces</div>
            </div>
            <div class="kpi-card kpi-highlight">
              <div class="kpi-lbl">Total FOB Value</div>
              <div class="kpi-val">$${(kpis.totalFobValue / 1000).toFixed(1)}k</div>
              <div class="kpi-sub">$${kpis.totalFobValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Avg. FOB Unit Price</div>
              <div class="kpi-val">$${kpis.avgFobPrice.toFixed(2)}</div>
              <div class="kpi-sub">Per Finished Garment</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">In-Production</div>
              <div class="kpi-val">${kpis.inProgressOrders}</div>
              <div class="kpi-sub">Cut / Sew / Pack / Audit</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Shipped & Gated</div>
              <div class="kpi-val">${kpis.shippedOrders}</div>
              <div class="kpi-sub">${orders.length > 0 ? Math.round((kpis.shippedOrders / orders.length) * 100) : 0}% Realized</div>
            </div>
          </div>

          <!-- Detailed Orders Summary Table -->
          <table class="summary-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 80px;">PO Number</th>
                <th style="width: 120px;">Buyer / Brand</th>
                <th style="width: 160px;">Style & Description</th>
                <th style="width: 70px;">Season</th>
                <th style="width: 75px; text-align: right;">Order Qty</th>
                <th style="width: 65px; text-align: right;">FOB Price</th>
                <th style="width: 90px; text-align: right;">Total FOB ($)</th>
                <th style="width: 75px; text-align: center;">Cutting Start</th>
                <th style="width: 75px; text-align: center;">Ex-Factory</th>
                <th style="width: 85px; text-align: center;">Stage Status</th>
                <th>Assigned Merchandiser</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
              <!-- Totals Row -->
              <tr class="totals-row">
                <td colspan="5" style="text-align: right; text-transform: uppercase;">
                  GRAND TOTAL SUMMARY (${orders.length} PURCHASE ORDERS):
                </td>
                <td style="text-align: right; font-family: monospace;">
                  ${kpis.totalQuantity.toLocaleString()} pcs
                </td>
                <td style="text-align: right; font-family: monospace;">
                  Avg: $${kpis.avgFobPrice.toFixed(2)}
                </td>
                <td style="text-align: right; font-family: monospace; color: #047857;">
                  $${kpis.totalFobValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td colspan="4" style="text-align: right; font-size: 8.5px; color: #475569;">
                  Total Commercial Volume Realized Across ${kpis.uniqueBuyers} Buyers
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Compliance & Operations Remarks -->
          <div class="notes-box">
            <strong>Operational Compliance & Commercial Audit Notice:</strong> This purchase order summary report has been verified against active ERP floor inventories, Bill of Materials (BOM) allocations, and production tracking milestones. All styles adhere to international buyer AQL standards (AQL 1.5 / 2.5 Major/Minor). Any variances in cutting yield, sewing output, or delivery schedule must be escalated to the Merchandising Lead and QA Director immediately.
          </div>

          ${renderFooterSignaturesHtml(
            options?.signatureMode || 'none',
            'PREPARED BY',
            'Senior Merchandiser / Production Coordinator',
            'COMMERCIAL APPROVAL',
            'Executive Director / Managing Director'
          )}

          <script>
            // Auto-trigger print after render
            window.addEventListener('DOMContentLoaded', function() {
              setTimeout(function() {
                window.focus();
                // User can click button or browser print dialog
              }, 300);
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export Buyer Orders Summary PDF:', err);
    alert('An unexpected error occurred while generating the PDF.');
  }
}

/**
 * GLOBAL EXPORT: Excel (.xls formatted HTML/XML workbook) Detailed Summary Sheet
 * Full multi-column export with styling, company header from settings, KPI summary, and totals.
 */
export function exportBuyerOrdersSummaryExcel(
  orders: BuyerOrder[],
  fileName: string = 'Buyer_Orders_Master_Summary',
  scopeLabel: string = 'All Records'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const kpis = computeBuyerOrderKpis(orders);
    const company = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';
    const dateStr = new Date().toLocaleString();

    const tableRowsHtml = orders
      .map((ord, idx) => {
        const val = ord.orderQuantity * ord.fobPrice;
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `
          <tr style="background-color: ${bg};">
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${ord.orderNumber}</td>
            <td style="font-weight: bold; color: #1e3a8a; border: 1px solid #cbd5e1; padding: 6px;">${ord.buyerName}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px;">${ord.brand || 'Main'}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${ord.styleNumber}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px;">${ord.styleDescription || '-'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px;">${ord.season || '-'}</td>
            <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${ord.orderQuantity}</td>
            <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px;">${ord.fobPrice.toFixed(2)}</td>
            <td style="text-align: right; font-weight: bold; color: #047857; border: 1px solid #cbd5e1; padding: 6px;">${val.toFixed(2)}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${ord.currency || 'USD'}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${ord.cuttingStartDate || '-'}</td>
            <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${ord.shipDate || '-'}</td>
            <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${ord.status}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px;">${ord.merchandiserName || '-'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px;">${ord.merchandiserEmail || '-'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px;">${ord.qualityStandard || 'AQL 1.5 Major'}</td>
          </tr>
        `;
      })
      .join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #0f172a; }
            table { border-collapse: collapse; width: 100%; }
            th { background-color: #1e293b; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #0f172a; text-align: left; }
            td { padding: 6px; border: 1px solid #cbd5e1; font-size: 10pt; }
            .kpi-table td { border: 1px solid #94a3b8; padding: 8px 12px; text-align: center; background: #f8fafc; }
            .totals-row td { background-color: #e2e8f0; font-weight: bold; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
          </style>
        </head>
        <body>
          <!-- Factory Header from Settings -->
          <table>
            <tr>
              <td colspan="17" style="font-size: 18pt; font-weight: bold; color: #1e3a8a; padding: 10px 0;">
                ${company}
              </td>
            </tr>
            <tr>
              <td colspan="17" style="font-size: 11pt; color: #475569;">
                ${pdfSettings.factoryAddress || 'Global Apparel Manufacturing Complex'} • Tel: ${pdfSettings.phone || ''} • Email: ${pdfSettings.email || ''}
              </td>
            </tr>
            <tr>
              <td colspan="17" style="font-size: 14pt; font-weight: bold; color: #0f172a; padding-top: 10px;">
                BUYER PURCHASE ORDER REGISTER & PRODUCTION PIPELINE DETAILED SUMMARY
              </td>
            </tr>
            <tr>
              <td colspan="17" style="font-size: 9pt; color: #64748b; padding-bottom: 12px;">
                Export Scope: ${scopeLabel} | Total POs: ${orders.length} | Generated: ${dateStr} | System: Project ULTRA Garments QMS ERP
              </td>
            </tr>
          </table>

          <!-- KPI Summary Strip -->
          <table class="kpi-table" style="margin-bottom: 16px;">
            <tr>
              <td>
                <div style="font-size: 9pt; color: #64748b; font-weight: bold;">TOTAL ORDERS</div>
                <div style="font-size: 16pt; font-weight: bold; color: #0f172a;">${kpis.totalOrders} POs</div>
              </td>
              <td>
                <div style="font-size: 9pt; color: #64748b; font-weight: bold;">TOTAL ORDER QUANTITY</div>
                <div style="font-size: 16pt; font-weight: bold; color: #0f172a;">${kpis.totalQuantity.toLocaleString()} pcs</div>
              </td>
              <td>
                <div style="font-size: 9pt; color: #64748b; font-weight: bold;">TOTAL FOB VALUE (USD)</div>
                <div style="font-size: 16pt; font-weight: bold; color: #047857;">$${kpis.totalFobValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </td>
              <td>
                <div style="font-size: 9pt; color: #64748b; font-weight: bold;">AVG. FOB UNIT PRICE</div>
                <div style="font-size: 16pt; font-weight: bold; color: #0f172a;">$${kpis.avgFobPrice.toFixed(2)}</div>
              </td>
              <td>
                <div style="font-size: 9pt; color: #64748b; font-weight: bold;">UNIQUE BUYERS</div>
                <div style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">${kpis.uniqueBuyers} Brands</div>
              </td>
              <td>
                <div style="font-size: 9pt; color: #64748b; font-weight: bold;">IN-PRODUCTION PIPELINE</div>
                <div style="font-size: 16pt; font-weight: bold; color: #d97706;">${kpis.inProgressOrders} Active POs</div>
              </td>
            </tr>
          </table>

          <!-- Master Data Grid -->
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>PO Number</th>
                <th>Buyer Name</th>
                <th>Brand Division</th>
                <th>Style Number</th>
                <th>Style Description</th>
                <th>Season</th>
                <th style="text-align: right;">Order Qty (pcs)</th>
                <th style="text-align: right;">FOB Price ($)</th>
                <th style="text-align: right;">Total FOB Value ($)</th>
                <th style="text-align: center;">Currency</th>
                <th style="text-align: center;">Cutting Start</th>
                <th style="text-align: center;">Ex-Factory / Ship Date</th>
                <th style="text-align: center;">Production Status</th>
                <th>Merchandiser Name</th>
                <th>Merchandiser Email</th>
                <th>Quality Standard</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
              <!-- Grand Totals Row -->
              <tr class="totals-row">
                <td colspan="7" style="text-align: right; font-weight: bold;">
                  GRAND TOTAL SUMMARY (${orders.length} PURCHASE ORDERS):
                </td>
                <td style="text-align: right; font-weight: bold;">${kpis.totalQuantity}</td>
                <td style="text-align: right; font-weight: bold;">Avg: $${kpis.avgFobPrice.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold; color: #047857;">$${kpis.totalFobValue.toFixed(2)}</td>
                <td colspan="7" style="font-size: 9pt; color: #475569;">
                  Total Commercial Volume Realized Across ${kpis.uniqueBuyers} Global Apparel Buyers
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
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
    console.error('Failed to export Buyer Orders Summary Excel:', err);
    alert('An unexpected error occurred while generating the Excel spreadsheet.');
  }
}

/**
 * INDIVIDUAL RECORD EXPORT: PDF Tech Pack & Purchase Order Specification Sheet
 * Contains comprehensive PO data, style details, WIP production stages, complete BOM items,
 * linked inward GRN receipts, and dual sign-off blocks.
 */
export function exportSingleBuyerOrderPdf(
  order: BuyerOrder,
  linkedGrn: ReceiveRecord[] = [],
  linkedInventory: InventoryItem[] = [],
  options?: ExportPdfOptions
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to generate the printable PDF document.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();
    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      `PURCHASE ORDER SPECIFICATION & TECH PACK: PO ${order.orderNumber}`,
      `PO-SPEC-${order.orderNumber}`,
      today,
      'Apparel Merchandising, Production Control & Quality Assurance'
    );

    const totalValue = order.orderQuantity * order.fobPrice;

    // BOM Table Rows
    const bomItems = order.bomItems || [];
    const bomRowsHtml =
      bomItems.length > 0
        ? bomItems
          .map((b, idx) => {
            const req = b.totalRequired || (b.consumptionPerGarment || 0) * order.orderQuantity;
            const rec = b.receivedQty || 0;
            const bal = Math.max(0, req - rec);
            return `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="text-align: center; color: #64748b;">${idx + 1}</td>
                <td><strong style="color: #1e3a8a;">${b.itemType}</strong></td>
                <td style="font-family: monospace; font-weight: 600;">${b.itemCode}</td>
                <td style="font-size: 8.5px;">${b.description || '-'}</td>
                <td style="font-size: 8.5px; color: #475569;">${b.supplier || 'Standard Mill'}</td>
                <td style="text-align: right; font-family: monospace;">${(b.consumptionPerGarment || 0).toFixed(4)}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700;">${req.toLocaleString()} ${b.unit}</td>
                <td style="text-align: right; font-family: monospace; color: #047857; font-weight: 700;">${rec.toLocaleString()} ${b.unit}</td>
                <td style="text-align: right; font-family: monospace; color: ${bal > 0 ? '#b91c1c' : '#475569'};">${bal.toLocaleString()} ${b.unit}</td>
                <td style="text-align: center;">
                  <span style="display: inline-block; padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${b.status === 'RECEIVED'
                ? 'background: #dcfce7; color: #166534;'
                : b.status === 'PARTIALLY_RECEIVED'
                  ? 'background: #fef3c7; color: #92400e;'
                  : 'background: #f1f5f9; color: #475569;'
              }">
                    ${b.status}
                  </span>
                </td>
              </tr>
            `;
          })
          .join('')
        : `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 10px;">No Bill of Materials (BOM) items recorded for this order.</td></tr>`;

    // Linked GRN Material Inwarding Rows
    const grnRowsHtml =
      linkedGrn.length > 0
        ? linkedGrn
          .map((g, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="text-align: center; color: #64748b;">${idx + 1}</td>
                <td style="font-family: monospace; font-weight: 700; color: #047857;">${g.grnNumber}</td>
                <td style="font-family: monospace;">${g.date}</td>
                <td><strong>${g.itemName}</strong> <span style="font-size: 8px; color: #64748b;">(${g.category})</span></td>
                <td style="font-size: 8.5px;">${g.supplierName}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700;">${g.receivedQty.toLocaleString()} ${g.unit}</td>
                <td style="text-align: center; font-size: 8.5px; font-weight: 700; color: #047857;">${g.qualityGrade || 'GRADE_A'}</td>
                <td style="font-family: monospace; font-size: 8.5px;">${g.warehouseLocation || 'Rack Store'}</td>
                <td style="text-align: center;">
                  <span style="padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; background: #ecfdf5; color: #065f46;">
                    ${g.qcStatus}
                  </span>
                </td>
              </tr>
            `)
          .join('')
        : `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 10px;">No inward raw material receipts (GRN) linked to this purchase order yet.</td></tr>`;

    // WIP Details - Auto-resolve from live floor records and production stages
    const wip =
      order.wipRecord &&
      (order.wipRecord.cuttingActual > 0 ||
        order.wipRecord.sewingComplete > 0 ||
        order.wipRecord.packedQuantity > 0 ||
        order.wipRecord.inspectionCompletedQuantity > 0)
        ? order.wipRecord
        : computeWIPRecordForPO(
            order.orderNumber,
            order.orderQuantity,
            order.wipRecord,
            order.productionTracking?.stages,
            order.status,
            order.styleNumber
          );

    const wipMetrics = calculateWIPPipelineMetrics(wip, order.orderQuantity);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PO-${order.orderNumber} - Detailed Specification & Tech Pack</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 16px;
              font-size: 10px;
              line-height: 1.4;
            }
            .action-bar {
              background: #0f172a;
              color: #ffffff;
              padding: 10px 16px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 14px;
            }
            .btn-print {
              background: #2563eb;
              color: white;
              border: none;
              padding: 6px 14px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            }
            .btn-close {
              background: #334155;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 11px;
              margin-left: 8px;
              cursor: pointer;
            }
            .section-title {
              font-size: 11.5px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-top: 14px;
              margin-bottom: 6px;
              padding-bottom: 3px;
              border-bottom: 1.5px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .spec-card {
              display: grid;
              grid-template-columns: 140px 1fr;
              gap: 14px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 12px;
              background: #f8fafc;
              margin-bottom: 14px;
            }
            .prod-img {
              width: 140px;
              height: 150px;
              object-fit: cover;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
              background: #ffffff;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px 12px;
              font-size: 9.5px;
            }
            .info-item {
              margin-bottom: 2px;
            }
            .info-lbl {
              font-size: 8.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
            }
            .info-val {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
            }
            .kpi-row {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi-box {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 7px;
              text-align: center;
            }
            .kpi-box-lbl {
              font-size: 8px;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
            }
            .kpi-box-val {
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
              font-family: monospace;
              margin-top: 1px;
            }
            table.detail-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 9px;
            }
            table.detail-table th {
              background: #1e293b;
              color: #ffffff;
              padding: 5px 6px;
              text-align: left;
              border: 1px solid #0f172a;
              font-weight: 700;
              font-size: 8.5px;
              text-transform: uppercase;
            }
            table.detail-table td {
              padding: 4px 6px;
              border: 1px solid #cbd5e1;
              vertical-align: middle;
            }
            .sign-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 48px;
              max-width: 650px;
              margin: 22px auto 0 auto;
              padding-top: 14px;
              border-top: 1px dashed #cbd5e1;
              page-break-inside: avoid;
            }
            .sign-col { text-align: center; }
            .sign-line { border-bottom: 1.5px solid #475569; height: 32px; margin-bottom: 6px; }
            .sign-role { font-size: 9px; font-weight: 800; color: #1e293b; letter-spacing: 0.3px; }
            .sign-dept { font-size: 8px; color: #64748b; }
            @media print {
              .action-bar { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <div>
              <div style="font-weight: 700; font-size: 13px;">Purchase Order Detailed Specification: PO ${order.orderNumber}</div>
              <div style="font-size: 10px; color: #94a3b8;">Buyer: ${order.buyerName} • Style: ${order.styleNumber} • PDF Header Linked from Settings</div>
            </div>
            <div>
              <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
              <button class="btn-close" onclick="window.close()">Close Preview</button>
            </div>
          </div>

          ${dynamicHeaderHtml}

          <!-- Product Specification & Overview -->
          <div class="spec-card">
            <div>
              ${order.productImage
        ? `<img src="${order.productImage}" alt="${order.styleDescription}" class="prod-img" />`
        : `<div class="prod-img" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;font-weight:bold;">NO IMAGE</div>`
      }
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <div style="font-size: 15px; font-weight: 900; color: #0f172a; font-family: monospace;">
                    PO: ${order.orderNumber}
                  </div>
                  <div style="font-size: 11px; font-weight: 700; color: #2563eb;">
                    ${order.styleDescription || 'Garment Production Order'}
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;">
                    ${order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-lbl">Buyer / Account</div>
                  <div class="info-val" style="color: #1e3a8a;">${order.buyerName}</div>
                </div>
                <div class="info-item">
                  <div class="info-lbl">Brand / Division</div>
                  <div class="info-val">${order.brand || 'Main Brand'}</div>
                </div>
                <div class="info-item">
                  <div class="info-lbl">Style Code</div>
                  <div class="info-val" style="font-family: monospace; color: #2563eb;">${order.styleNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-lbl">Season / Collection</div>
                  <div class="info-val">${order.season || 'SS-2026'}</div>
                </div>
                <div class="info-item">
                  <div class="info-lbl">Cutting Start Date</div>
                  <div class="info-val" style="font-family: monospace;">${order.cuttingStartDate || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-lbl">Ex-Factory / Ship Date</div>
                  <div class="info-val" style="font-family: monospace; color: #b91c1c;">${order.shipDate}</div>
                </div>
                <div class="info-item">
                  <div class="info-lbl">Assigned Merchandiser</div>
                  <div class="info-val">${order.merchandiserName || 'Merchandising Team'}</div>
                </div>
                <div class="info-item">
                  <div class="info-lbl">Quality Standard</div>
                  <div class="info-val">${order.qualityStandard || 'AQL 1.5 Major / 2.5 Minor'}</div>
                </div>
                <div class="info-item">
                  <div class="info-lbl">SMV / Daily Target</div>
                  <div class="info-val">${order.smv ? `${order.smv} min` : '18.5 min'} • ${order.dailyTarget ? `${order.dailyTarget} pcs/d` : '1,200 pcs/d'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Commercial Strip -->
          <div class="kpi-row">
            <div class="kpi-box">
              <div class="kpi-box-lbl">Order Quantity</div>
              <div class="kpi-box-val">${order.orderQuantity.toLocaleString()} pcs</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-box-lbl">FOB Unit Price</div>
              <div class="kpi-box-val">$${order.fobPrice.toFixed(2)}</div>
            </div>
            <div class="kpi-box" style="background: #f0fdf4; border-color: #bbf7d0;">
              <div class="kpi-box-lbl">Total FOB Commercial Value</div>
              <div class="kpi-box-val" style="color: #166534;">$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-box-lbl">Currency / Terms</div>
              <div class="kpi-box-val">${order.currency || 'USD'} • LC 60D</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-box-lbl">Materials Inwarded</div>
              <div class="kpi-box-val" style="color: #1e40af;">${linkedGrn.length} Receipts</div>
            </div>
          </div>

          <!-- Production WIP & Floor Pipeline Tracking -->
          <div class="section-title">
            <span>Production Work-in-Progress (WIP) &amp; Floor Pipeline Progress</span>
            <span style="font-size: 8.5px; font-weight: 700; color: #2563eb;">
              Overall Progress: ${wipMetrics.overallProgressPercent}% • Synced with Live Floor Tracks
            </span>
          </div>

          <div class="kpi-row" style="margin-bottom: 8px;">
            <div class="kpi-box">
              <div class="kpi-box-lbl">1. Cutting Output</div>
              <div class="kpi-box-val">${(wip.cuttingActual || 0).toLocaleString()} pcs</div>
              <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">
                Target: ${(wip.cuttingPlanned || order.orderQuantity).toLocaleString()} (${wipMetrics.cuttingProgressPct}%)
              </div>
            </div>
            <div class="kpi-box">
              <div class="kpi-box-lbl">2. Sewing Assembly</div>
              <div class="kpi-box-val" style="color: #1d4ed8;">${(wip.sewingComplete || 0).toLocaleString()} pcs</div>
              <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">
                Input: ${(wip.sewingInput || order.orderQuantity).toLocaleString()} • WIP: ${wipMetrics.sewingFloorWip.toLocaleString()}
              </div>
            </div>
            <div class="kpi-box">
              <div class="kpi-box-lbl">3. Finishing Dept</div>
              <div class="kpi-box-val">${(wip.finishingQuantity || 0).toLocaleString()} pcs</div>
              <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">
                Floor WIP: ${wipMetrics.finishingFloorWip.toLocaleString()} pcs
              </div>
            </div>
            <div class="kpi-box">
              <div class="kpi-box-lbl">4. Packed &amp; Cartoned</div>
              <div class="kpi-box-val" style="color: #6b21a8;">${(wip.packedQuantity || 0).toLocaleString()} pcs</div>
              <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">
                Packing WIP: ${wipMetrics.packingFloorWip.toLocaleString()} pcs
              </div>
            </div>
            <div class="kpi-box" style="background: #f0fdf4; border-color: #bbf7d0;">
              <div class="kpi-box-lbl">5. Final QA Passed</div>
              <div class="kpi-box-val" style="color: #047857;">${(wip.inspectionCompletedQuantity || 0).toLocaleString()} pcs</div>
              <div style="font-size: 7.5px; color: #047857; margin-top: 1px;">
                ${wip.inspectionCompletedQuantity >= order.orderQuantity ? '100% Passed' : 'Inspection Passed'}
              </div>
            </div>
          </div>

          <!-- Multi-Stage Production Breakdown Table -->
          <table class="detail-table" style="margin-bottom: 12px;">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 140px;">Production Stage</th>
                <th style="width: 75px; text-align: right;">Target / Plan</th>
                <th style="width: 75px; text-align: right;">Output Completed</th>
                <th style="width: 75px; text-align: right;">Floor WIP Queue</th>
                <th style="width: 55px; text-align: center;">Progress</th>
                <th style="width: 75px; text-align: center;">Stage Status</th>
                <th>Tracking Reference / Data Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center; color: #64748b;">1</td>
                <td><strong>Fabric Spreading &amp; Cutting</strong></td>
                <td style="text-align: right; font-family: monospace;">${(wip.cuttingPlanned || order.orderQuantity).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${(wip.cuttingActual || 0).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; color: #64748b;">${Math.max(0, (wip.cuttingPlanned || order.orderQuantity) - wip.cuttingActual).toLocaleString()} pcs</td>
                <td style="text-align: center; font-family: monospace; font-weight: 600;">${wipMetrics.cuttingProgressPct}%</td>
                <td style="text-align: center;">
                  <span style="padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${wip.cuttingActual >= (wip.cuttingPlanned || order.orderQuantity) ? 'background: #dcfce7; color: #166534;' : wip.cuttingActual > 0 ? 'background: #dbeafe; color: #1e40af;' : 'background: #f1f5f9; color: #475569;'}">
                    ${wip.cuttingActual >= (wip.cuttingPlanned || order.orderQuantity) ? 'COMPLETED' : wip.cuttingActual > 0 ? 'IN PROGRESS' : 'PENDING'}
                  </span>
                </td>
                <td style="font-size: 8.5px; color: #475569;">${wip.syncSources?.cutting || 'Cutting Floor Schedule'}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td style="text-align: center; color: #64748b;">2</td>
                <td><strong>Sewing Assembly Lines</strong></td>
                <td style="text-align: right; font-family: monospace;">${(wip.sewingInput || order.orderQuantity).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; color: #1d4ed8;">${(wip.sewingComplete || 0).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; color: #b45309; font-weight: 600;">${wipMetrics.sewingFloorWip.toLocaleString()} pcs</td>
                <td style="text-align: center; font-family: monospace; font-weight: 600;">${Math.min(100, Math.round(((wip.sewingComplete || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center;">
                  <span style="padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${wip.sewingComplete >= order.orderQuantity ? 'background: #dcfce7; color: #166534;' : wip.sewingComplete > 0 ? 'background: #dbeafe; color: #1e40af;' : 'background: #f1f5f9; color: #475569;'}">
                    ${wip.sewingComplete >= order.orderQuantity ? 'COMPLETED' : wip.sewingComplete > 0 ? 'IN PROGRESS' : 'PENDING'}
                  </span>
                </td>
                <td style="font-size: 8.5px; color: #475569;">${wip.syncSources?.sewing || 'Inline Assembly Lines'}</td>
              </tr>
              ${wip.washApplicable ? `
              <tr>
                <td style="text-align: center; color: #64748b;">-</td>
                <td><strong>Garment Wash &amp; Wet Process</strong></td>
                <td style="text-align: right; font-family: monospace;">${(wip.washSent || 0).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700;">${(wip.washReceived || 0).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; color: #64748b;">${wipMetrics.washFloorWip.toLocaleString()} pcs</td>
                <td style="text-align: center; font-family: monospace;">${wip.washSent > 0 ? Math.min(100, Math.round((wip.washReceived / wip.washSent) * 100)) : 0}%</td>
                <td style="text-align: center;">
                  <span style="padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${wip.washReceived >= wip.washSent && wip.washSent > 0 ? 'background: #dcfce7; color: #166534;' : 'background: #fef3c7; color: #92400e;'}">
                    ${wip.washReceived >= wip.washSent && wip.washSent > 0 ? 'COMPLETED' : 'IN PROGRESS'}
                  </span>
                </td>
                <td style="font-size: 8.5px; color: #475569;">Wash Plant &amp; Industrial Laundry Unit</td>
              </tr>
              ` : ''}
              <tr>
                <td style="text-align: center; color: #64748b;">3</td>
                <td><strong>Finishing &amp; Ironing Department</strong></td>
                <td style="text-align: right; font-family: monospace;">${(wip.washApplicable ? wip.washReceived : wip.sewingComplete).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${(wip.finishingQuantity || 0).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; color: #64748b;">${wipMetrics.finishingFloorWip.toLocaleString()} pcs</td>
                <td style="text-align: center; font-family: monospace; font-weight: 600;">${Math.min(100, Math.round(((wip.finishingQuantity || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center;">
                  <span style="padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${wip.finishingQuantity >= order.orderQuantity ? 'background: #dcfce7; color: #166534;' : wip.finishingQuantity > 0 ? 'background: #dbeafe; color: #1e40af;' : 'background: #f1f5f9; color: #475569;'}">
                    ${wip.finishingQuantity >= order.orderQuantity ? 'COMPLETED' : wip.finishingQuantity > 0 ? 'IN PROGRESS' : 'PENDING'}
                  </span>
                </td>
                <td style="font-size: 8.5px; color: #475569;">${wip.syncSources?.finishing || 'Thread Suck &amp; Tunnel Finish'}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td style="text-align: center; color: #64748b;">4</td>
                <td><strong>Polybagging &amp; Carton Packing</strong></td>
                <td style="text-align: right; font-family: monospace;">${(wip.finishingQuantity || order.orderQuantity).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; color: #6b21a8;">${(wip.packedQuantity || 0).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; color: #64748b;">${wipMetrics.packingFloorWip.toLocaleString()} pcs</td>
                <td style="text-align: center; font-family: monospace; font-weight: 600;">${Math.min(100, Math.round(((wip.packedQuantity || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center;">
                  <span style="padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${wip.packedQuantity >= order.orderQuantity ? 'background: #dcfce7; color: #166534;' : wip.packedQuantity > 0 ? 'background: #f3e8ff; color: #6b21a8;' : 'background: #f1f5f9; color: #475569;'}">
                    ${wip.packedQuantity >= order.orderQuantity ? 'COMPLETED' : wip.packedQuantity > 0 ? 'IN PROGRESS' : 'PENDING'}
                  </span>
                </td>
                <td style="font-size: 8.5px; color: #475569;">Barcode Scanning &amp; Master Carton Pack</td>
              </tr>
              <tr>
                <td style="text-align: center; color: #64748b;">5</td>
                <td><strong>Final Quality Assurance &amp; Audit</strong></td>
                <td style="text-align: right; font-family: monospace;">${(wip.packedQuantity || order.orderQuantity).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; color: #047857;">${(wip.inspectionCompletedQuantity || 0).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; color: #64748b;">${wipMetrics.inspectionWip.toLocaleString()} pcs</td>
                <td style="text-align: center; font-family: monospace; font-weight: 600;">${Math.min(100, Math.round(((wip.inspectionCompletedQuantity || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center;">
                  <span style="padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${wip.inspectionCompletedQuantity >= order.orderQuantity ? 'background: #dcfce7; color: #166534;' : wip.inspectionCompletedQuantity > 0 ? 'background: #dcfce7; color: #166534;' : 'background: #f1f5f9; color: #475569;'}">
                    ${wip.inspectionCompletedQuantity >= order.orderQuantity ? 'PASSED' : wip.inspectionCompletedQuantity > 0 ? 'INSPECTION PASS' : 'PENDING'}
                  </span>
                </td>
                <td style="font-size: 8.5px; color: #475569;">${wip.syncSources?.inspection || 'QA Pre-Shipment Inspection (AQL Standard)'}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td style="text-align: center; color: #64748b;">6</td>
                <td><strong>Commercial Dispatch / Shipped</strong></td>
                <td style="text-align: right; font-family: monospace;">${order.orderQuantity.toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${(wip.shippedQuantity || 0).toLocaleString()} pcs</td>
                <td style="text-align: right; font-family: monospace; color: #64748b;">${wipMetrics.readyToShipWip.toLocaleString()} pcs</td>
                <td style="text-align: center; font-family: monospace; font-weight: 600;">${Math.min(100, Math.round(((wip.shippedQuantity || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center;">
                  <span style="padding: 1.5px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; ${wip.shippedQuantity >= order.orderQuantity ? 'background: #dcfce7; color: #166534;' : wipMetrics.readyToShipWip > 0 ? 'background: #fef3c7; color: #92400e;' : 'background: #f1f5f9; color: #475569;'}">
                    ${wip.shippedQuantity >= order.orderQuantity ? 'SHIPPED' : wipMetrics.readyToShipWip > 0 ? 'READY TO SHIP' : 'PENDING'}
                  </span>
                </td>
                <td style="font-size: 8.5px; color: #475569;">Commercial Invoicing &amp; Forwarder Gate Out</td>
              </tr>
            </tbody>
          </table>

          <!-- Bill of Materials (BOM) Matrix -->
          <div class="section-title">
            <span>Bill of Materials (BOM) Requirements & Inwarding Status</span>
            <span style="font-size: 8.5px; font-weight: 600; color: #64748b;">${bomItems.length} Allocated Trims & Fabrics</span>
          </div>
          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 80px;">Item Type</th>
                <th style="width: 90px;">Item Code</th>
                <th>Material Description</th>
                <th style="width: 110px;">Mill / Supplier</th>
                <th style="width: 65px; text-align: right;">Cons/pc</th>
                <th style="width: 75px; text-align: right;">Total Required</th>
                <th style="width: 75px; text-align: right;">Received</th>
                <th style="width: 70px; text-align: right;">Balance</th>
                <th style="width: 75px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${bomRowsHtml}
            </tbody>
          </table>

          <!-- Linked GRN Material Inwarding Records -->
          <div class="section-title">
            <span>Linked Inward Material Receipts (Goods Received Notes - GRN)</span>
            <span style="font-size: 8.5px; font-weight: 600; color: #64748b;">${linkedGrn.length} Inward Deliveries Recorded</span>
          </div>
          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 85px;">GRN Number</th>
                <th style="width: 75px;">Inward Date</th>
                <th>Material Item & Category</th>
                <th style="width: 110px;">Supplier / Mill</th>
                <th style="width: 80px; text-align: right;">Received Qty</th>
                <th style="width: 65px; text-align: center;">QC Grade</th>
                <th style="width: 80px;">Bin Location</th>
                <th style="width: 70px; text-align: center;">QC Status</th>
              </tr>
            </thead>
            <tbody>
              ${grnRowsHtml}
            </tbody>
          </table>

          ${renderFooterSignaturesHtml(
            options?.signatureMode || 'none',
            'ORDER ISSUED BY',
            'Merchandising Sourcing Lead',
            'COMMERCIAL APPROVAL',
            'General Manager / Operations Head'
          )}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export Single Buyer Order PDF:', err);
    alert('An unexpected error occurred while generating the PO PDF specification.');
  }
}

/**
 * INDIVIDUAL RECORD EXPORT: Excel (.xls formatted HTML/XML workbook) Single PO Sheet
 * Exports complete PO data, Style specifications, BOM matrix, and GRN receipts into an Excel workbook.
 */
export function exportSingleBuyerOrderExcel(
  order: BuyerOrder,
  linkedGrn: ReceiveRecord[] = [],
  linkedInventory: InventoryItem[] = []
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const company = pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.';
    const dateStr = new Date().toLocaleString();
    const totalVal = order.orderQuantity * order.fobPrice;

    // Resolve live WIP Record with floor tracks and production stages
    const wip =
      order.wipRecord &&
      (order.wipRecord.cuttingActual > 0 ||
        order.wipRecord.sewingComplete > 0 ||
        order.wipRecord.packedQuantity > 0 ||
        order.wipRecord.inspectionCompletedQuantity > 0)
        ? order.wipRecord
        : computeWIPRecordForPO(
            order.orderNumber,
            order.orderQuantity,
            order.wipRecord,
            order.productionTracking?.stages,
            order.status,
            order.styleNumber
          );
    const wipMetrics = calculateWIPPipelineMetrics(wip, order.orderQuantity);

    // BOM rows
    const bomRowsHtml = (order.bomItems || [])
      .map((b, idx) => {
        const req = b.totalRequired || (b.consumptionPerGarment || 0) * order.orderQuantity;
        const rec = b.receivedQty || 0;
        const bal = Math.max(0, req - rec);
        return `
          <tr>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${idx + 1}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${b.itemType}</td>
            <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 5px;">${b.itemCode}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px;">${b.description || '-'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px;">${b.supplier || '-'}</td>
            <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${b.consumptionPerGarment || 0}</td>
            <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${req}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${b.unit}</td>
            <td style="text-align: right; font-weight: bold; color: #047857; border: 1px solid #cbd5e1; padding: 5px;">${rec}</td>
            <td style="text-align: right; font-weight: bold; color: #b91c1c; border: 1px solid #cbd5e1; padding: 5px;">${bal}</td>
            <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${b.status}</td>
          </tr>
        `;
      })
      .join('');

    // GRN rows
    const grnRowsHtml = linkedGrn
      .map(
        (g, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${idx + 1}</td>
          <td style="font-weight: bold; color: #047857; border: 1px solid #cbd5e1; padding: 5px;">${g.grnNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${g.date}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${g.itemName}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${g.category}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${g.supplierName}</td>
          <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${g.receivedQty}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${g.unit}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${g.qualityGrade || 'GRADE_A'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px;">${g.warehouseLocation || '-'}</td>
          <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${g.qcStatus}</td>
        </tr>
      `
      )
      .join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #0f172a; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 14px; }
            th { background-color: #1e293b; color: #ffffff; font-weight: bold; padding: 7px; border: 1px solid #0f172a; text-align: left; }
            td { padding: 5px; border: 1px solid #cbd5e1; font-size: 10pt; }
            .section-header { background-color: #0f172a; color: #ffffff; font-size: 12pt; font-weight: bold; padding: 8px; }
            .info-label { background-color: #f1f5f9; font-weight: bold; color: #475569; }
          </style>
        </head>
        <body>
          <!-- Factory Header -->
          <table>
            <tr>
              <td colspan="11" style="font-size: 18pt; font-weight: bold; color: #1e3a8a; padding: 10px 0;">
                ${company}
              </td>
            </tr>
            <tr>
              <td colspan="11" style="font-size: 10pt; color: #475569;">
                ${pdfSettings.factoryAddress || 'Global Apparel Manufacturing Complex'} • Tel: ${pdfSettings.phone || ''} • Email: ${pdfSettings.email || ''}
              </td>
            </tr>
            <tr>
              <td colspan="11" style="font-size: 14pt; font-weight: bold; color: #0f172a; padding-top: 10px;">
                PURCHASE ORDER & TECH PACK SPECIFICATION: ${order.orderNumber}
              </td>
            </tr>
            <tr>
              <td colspan="11" style="font-size: 9pt; color: #64748b; padding-bottom: 12px;">
                Buyer: ${order.buyerName} | Style: ${order.styleNumber} | Generated: ${dateStr} | System: Project ULTRA Garments QMS ERP
              </td>
            </tr>
          </table>

          <!-- PO Master Specifications -->
          <table>
            <tr>
              <td colspan="4" class="section-header">SECTION 1: PURCHASE ORDER & STYLE DETAILS</td>
            </tr>
            <tr>
              <td class="info-label" style="width: 20%;">Purchase Order (PO #)</td>
              <td style="width: 30%; font-weight: bold; color: #0f172a;">${order.orderNumber}</td>
              <td class="info-label" style="width: 20%;">Production Status</td>
              <td style="width: 30%; font-weight: bold; color: #1e40af;">${order.status}</td>
            </tr>
            <tr>
              <td class="info-label">Buyer Name</td>
              <td style="font-weight: bold; color: #1e3a8a;">${order.buyerName}</td>
              <td class="info-label">Brand / Division</td>
              <td>${order.brand || 'Main'}</td>
            </tr>
            <tr>
              <td class="info-label">Style Number</td>
              <td style="font-weight: bold; color: #2563eb;">${order.styleNumber}</td>
              <td class="info-label">Season / Collection</td>
              <td>${order.season || 'SS-2026'}</td>
            </tr>
            <tr>
              <td class="info-label">Style Description</td>
              <td colspan="3">${order.styleDescription || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Cutting Start Date</td>
              <td>${order.cuttingStartDate || 'N/A'}</td>
              <td class="info-label">Ex-Factory / Ship Date</td>
              <td style="font-weight: bold; color: #b91c1c;">${order.shipDate}</td>
            </tr>
            <tr>
              <td class="info-label">Assigned Merchandiser</td>
              <td>${order.merchandiserName || '-'}</td>
              <td class="info-label">Merchandiser Email</td>
              <td>${order.merchandiserEmail || '-'}</td>
            </tr>
            <tr>
              <td class="info-label">Standard Minute Value (SMV)</td>
              <td>${order.smv ? `${order.smv} min` : '18.5 min'}</td>
              <td class="info-label">Quality Standard</td>
              <td>${order.qualityStandard || 'AQL 1.5 Major'}</td>
            </tr>
          </table>

          <!-- Commercial Matrix -->
          <table>
            <tr>
              <td colspan="4" class="section-header">SECTION 2: COMMERCIAL VALUES &amp; VOLUME</td>
            </tr>
            <tr>
              <td class="info-label" style="width: 20%;">Order Quantity</td>
              <td style="width: 30%; font-weight: bold;">${order.orderQuantity.toLocaleString()} pcs</td>
              <td class="info-label" style="width: 20%;">FOB Price (Per Unit)</td>
              <td style="width: 30%; font-weight: bold;">$${order.fobPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="info-label">Total Commercial FOB Value</td>
              <td colspan="3" style="font-size: 13pt; font-weight: bold; color: #047857;">
                $${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${order.currency || 'USD'}
              </td>
            </tr>
          </table>

          <!-- Production WIP Tracking Matrix -->
          <table>
            <tr>
              <td colspan="7" class="section-header">SECTION 3: PRODUCTION WORK-IN-PROGRESS (WIP) &amp; FLOOR PIPELINE</td>
            </tr>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th style="width: 220px;">Manufacturing Stage</th>
                <th style="text-align: right;">Target / Plan (Pcs)</th>
                <th style="text-align: right;">Completed Output (Pcs)</th>
                <th style="text-align: right;">Floor WIP Queue (Pcs)</th>
                <th style="text-align: center;">Stage Progress (%)</th>
                <th style="text-align: center;">Stage Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">1</td>
                <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">Fabric Spreading &amp; Cutting</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${(wip.cuttingPlanned || order.orderQuantity).toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${(wip.cuttingActual || 0).toLocaleString()}</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${Math.max(0, (wip.cuttingPlanned || order.orderQuantity) - wip.cuttingActual).toLocaleString()}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${wipMetrics.cuttingProgressPct}%</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${wip.cuttingActual >= (wip.cuttingPlanned || order.orderQuantity) ? 'COMPLETED' : wip.cuttingActual > 0 ? 'IN PROGRESS' : 'PENDING'}</td>
              </tr>
              <tr>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">2</td>
                <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">Sewing Assembly Line Output</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${(wip.sewingInput || order.orderQuantity).toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; color: #1e40af; border: 1px solid #cbd5e1; padding: 5px;">${(wip.sewingComplete || 0).toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; color: #b45309; border: 1px solid #cbd5e1; padding: 5px;">${wipMetrics.sewingFloorWip.toLocaleString()}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${Math.min(100, Math.round(((wip.sewingComplete || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${wip.sewingComplete >= order.orderQuantity ? 'COMPLETED' : wip.sewingComplete > 0 ? 'IN PROGRESS' : 'PENDING'}</td>
              </tr>
              ${wip.washApplicable ? `
              <tr>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">-</td>
                <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">Garment Washing &amp; Wet Processing</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${(wip.washSent || 0).toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${(wip.washReceived || 0).toLocaleString()}</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${wipMetrics.washFloorWip.toLocaleString()}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${wip.washSent > 0 ? Math.min(100, Math.round((wip.washReceived / wip.washSent) * 100)) : 0}%</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${wip.washReceived >= wip.washSent && wip.washSent > 0 ? 'COMPLETED' : 'IN PROGRESS'}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">3</td>
                <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">Thread Trimming &amp; Finishing Floor</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${(wip.washApplicable ? wip.washReceived : wip.sewingComplete).toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${(wip.finishingQuantity || 0).toLocaleString()}</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${wipMetrics.finishingFloorWip.toLocaleString()}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${Math.min(100, Math.round(((wip.finishingQuantity || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${wip.finishingQuantity >= order.orderQuantity ? 'COMPLETED' : wip.finishingQuantity > 0 ? 'IN PROGRESS' : 'PENDING'}</td>
              </tr>
              <tr>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">4</td>
                <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">Polybagging &amp; Carton Packaging</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${(wip.finishingQuantity || order.orderQuantity).toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; color: #6b21a8; border: 1px solid #cbd5e1; padding: 5px;">${(wip.packedQuantity || 0).toLocaleString()}</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${wipMetrics.packingFloorWip.toLocaleString()}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${Math.min(100, Math.round(((wip.packedQuantity || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${wip.packedQuantity >= order.orderQuantity ? 'COMPLETED' : wip.packedQuantity > 0 ? 'IN PROGRESS' : 'PENDING'}</td>
              </tr>
              <tr>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">5</td>
                <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">Final Quality Audit &amp; Inspection Pass</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${(wip.packedQuantity || order.orderQuantity).toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; color: #047857; border: 1px solid #cbd5e1; padding: 5px;">${(wip.inspectionCompletedQuantity || 0).toLocaleString()}</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${wipMetrics.inspectionWip.toLocaleString()}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${Math.min(100, Math.round(((wip.inspectionCompletedQuantity || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${wip.inspectionCompletedQuantity >= order.orderQuantity ? 'PASSED' : wip.inspectionCompletedQuantity > 0 ? 'INSPECTION PASS' : 'PENDING'}</td>
              </tr>
              <tr>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">6</td>
                <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">Commercial Dispatch &amp; Shipped</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${order.orderQuantity.toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${(wip.shippedQuantity || 0).toLocaleString()}</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px;">${wipMetrics.readyToShipWip.toLocaleString()}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px;">${Math.min(100, Math.round(((wip.shippedQuantity || 0) / order.orderQuantity) * 100))}%</td>
                <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 5px;">${wip.shippedQuantity >= order.orderQuantity ? 'SHIPPED' : wipMetrics.readyToShipWip > 0 ? 'READY TO SHIP' : 'PENDING'}</td>
              </tr>
              <tr style="background-color: #f1f5f9;">
                <td colspan="5" style="font-weight: bold; padding: 6px;">Overall Manufacturing Pipeline Completion</td>
                <td colspan="2" style="font-weight: bold; font-size: 11pt; color: #1e40af; text-align: center;">${wipMetrics.overallProgressPercent}% Complete</td>
              </tr>
            </tbody>
          </table>

          <!-- Bill of Materials (BOM) Table -->
          <table>
            <tr>
              <td colspan="11" class="section-header">SECTION 4: BILL OF MATERIALS (BOM) MATRIX</td>
            </tr>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th>Item Type</th>
                <th>Item Code</th>
                <th>Description</th>
                <th>Supplier / Mill</th>
                <th style="text-align: right;">Cons/pc</th>
                <th style="text-align: right;">Total Req</th>
                <th style="text-align: center;">Unit</th>
                <th style="text-align: right;">Received</th>
                <th style="text-align: right;">Balance</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${bomRowsHtml || '<tr><td colspan="11" style="text-align:center;">No BOM recorded</td></tr>'}
            </tbody>
          </table>

          <!-- Linked GRN Receipts -->
          <table>
            <tr>
              <td colspan="11" class="section-header">SECTION 5: LINKED INWARD RAW MATERIAL DELIVERIES (GRN)</td>
            </tr>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th>GRN Number</th>
                <th>Inward Date</th>
                <th>Material Item</th>
                <th>Category</th>
                <th>Supplier</th>
                <th style="text-align: right;">Received Qty</th>
                <th style="text-align: center;">Unit</th>
                <th style="text-align: center;">Grade</th>
                <th>Warehouse Location</th>
                <th style="text-align: center;">QC Status</th>
              </tr>
            </thead>
            <tbody>
              ${grnRowsHtml || '<tr><td colspan="11" style="text-align:center;">No inward receipts linked</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PO_${order.orderNumber}_Specification_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Failed to export Single Buyer Order Excel:', err);
    alert('An unexpected error occurred while generating the PO Excel spreadsheet.');
  }
}
