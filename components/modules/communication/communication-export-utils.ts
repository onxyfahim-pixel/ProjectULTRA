import { CommunicationNotice } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Communication Portal module
 */
export function computeCommunicationKpis(notices: CommunicationNotice[]) {
  const total = notices.length;
  const urgent = notices.filter((n) => n.urgency === 'HIGH_PRIORITY').length;
  const standard = notices.filter((n) => n.urgency === 'STANDARD').length;
  const lowPriority = notices.filter((n) => n.urgency === 'INFO').length;
  const pinned = notices.filter((n) => n.pinned).length;

  const totalSignoffs = notices.reduce((acc, curr) => acc + (curr.acknowledgedCount || 0), 0);
  const totalTargetRecipients = notices.reduce(
    (acc, curr) => acc + (curr.totalRecipientsCount || 20),
    0
  );
  const overallSignoffRate =
    totalTargetRecipients > 0 ? Math.round((totalSignoffs / totalTargetRecipients) * 100) : 0;

  return {
    total,
    urgent,
    standard,
    lowPriority,
    pinned,
    totalSignoffs,
    totalTargetRecipients,
    overallSignoffRate,
  };
}

/**
 * Download CSV helper
 */
export function downloadCommunicationCsv(
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
 * Export Global Communication Notice Register PDF
 */
export function exportCommunicationRegisterPdf(
  notices: CommunicationNotice[],
  scopeLabel: string = 'All Factory Bulletins'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeCommunicationKpis(notices);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'communication', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH_PRIORITY':
        return '#be123c';
      case 'STANDARD':
        return '#1e40af';
      case 'LOW_PRIORITY':
        return '#15803d';
      default:
        return '#1e40af';
    }
  };

  const rowsHtml = notices
    .map((n, idx) => {
      const totalRecipients = n.totalRecipientsCount || 20;
      const ackCount = n.acknowledgedCount || 0;
      const pct = Math.round((ackCount / Math.max(totalRecipients, 1)) * 100);

      return `
        <tr>
          <td style="text-align: center; font-mono; font-size: 8pt; color: #64748b;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${n.noticeNumber}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${n.title}</div>
            <div style="font-size: 7.5pt; color: #64748b;">By: ${n.author} (${n.authorRole || 'Issuer'})</div>
          </td>
          <td style="font-size: 8pt; font-weight: 600; color: #475569;">
            ${(n.category || 'GENERAL_ANNOUNCEMENT').replace(/_/g, ' ')}
          </td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: bold; color: ${getUrgencyColor(n.urgency)}; background: #f8fafc; border: 1px solid ${getUrgencyColor(n.urgency)}33;">
              ${n.urgency.replace('_', ' ')}
            </span>
          </td>
          <td style="font-size: 8pt; color: #334155;">
            ${n.targetDepartment || 'All Plant'}
          </td>
          <td style="font-family: monospace; font-size: 7.5pt; color: #334155; white-space: nowrap;">
            ${n.publishedDate.split(' ')[0]}
          </td>
          <td style="text-align: right; font-family: monospace; font-size: 8pt;">
            <span style="font-weight: bold; color: #0f172a;">${ackCount}/${totalRecipients}</span>
            <span style="color: ${pct >= 80 ? '#15803d' : '#b45309'}; font-weight: 700; margin-left: 4px;">(${pct}%)</span>
          </td>
          <td style="font-size: 7.5pt; color: #475569;">
            ${n.orderRef ? `PO: ${n.orderRef}<br/>` : ''}
            ${n.buyerRef ? `Buyer: ${n.buyerRef}` : 'Plant Directive'}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Communication_Register_${new Date().toISOString().slice(0, 10)}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 12mm 10mm 12mm;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 15px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .kpi-bar {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
            margin: 12px 0 16px 0;
            padding: 10px 14px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          .kpi-item {
            text-align: center;
          }
          .kpi-val {
            font-size: 14pt;
            font-weight: 800;
            color: #1e3a8a;
            font-family: monospace;
          }
          .kpi-lbl {
            font-size: 7pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-top: 8px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 7px 8px;
            border: 1px solid #0f172a;
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .sign-block {
            margin-top: 24px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
          .sign-box {
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            text-align: center;
          }
          .sign-title {
            font-weight: 700;
            font-size: 8.5pt;
            color: #1e293b;
          }
          .sign-sub {
            font-size: 7.5pt;
            color: #64748b;
          }
          .footer-strip {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8pt;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
          <button onclick="window.print()" style="padding: 6px 14px; background: #1e3a8a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">
            Print / Save as PDF
          </button>
        </div>

        ${dynamicHeaderHtml}

        <div class="kpi-bar">
          <div class="kpi-item">
            <div class="kpi-val">${kpis.total}</div>
            <div class="kpi-lbl">Total Bulletins</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #be123c;">${kpis.urgent}</div>
            <div class="kpi-lbl">High Priority</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #15803d;">${kpis.overallSignoffRate}%</div>
            <div class="kpi-lbl">Sign-off Rate</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${kpis.totalSignoffs}</div>
            <div class="kpi-lbl">Confirmed Sign-offs</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val" style="color: #1e3a8a;">${kpis.pinned}</div>
            <div class="kpi-lbl">Pinned Directives</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-val">${kpis.standard}</div>
            <div class="kpi-lbl">Standard Notices</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">#</th>
              <th style="width: 12%;">Notice #</th>
              <th style="width: 24%;">Bulletin Subject &amp; Issuer</th>
              <th style="width: 14%;">Category</th>
              <th style="width: 10%; text-align: center;">Priority</th>
              <th style="width: 12%;">Target Audience</th>
              <th style="width: 9%;">Date</th>
              <th style="width: 8%; text-align: right;">Sign-offs</th>
              <th style="width: 11%;">Order / Context</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Factory HR &amp; Admin</div>
            <div class="sign-sub">Internal Communications Officer</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Operations Director</div>
            <div class="sign-sub">Plant Manufacturing Oversight</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">QMS Compliance Lead</div>
            <div class="sign-sub">ISO 9001:2015 Clause 7.4</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">General Manager</div>
            <div class="sign-sub">Executive Directives Sign-off</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Document Code: <strong>${docCode}</strong> • Ref: ISO 9001:2015 Clause 7.4</span>
          <span>Printed On: ${new Date().toLocaleString()}</span>
          <span>Security Classification: INTERNAL FACTORY COMMUNICATION</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Global Communication Notice Register Excel (.xls)
 */
export function exportCommunicationRegisterExcel(
  notices: CommunicationNotice[],
  scopeLabel: string = 'All Factory Bulletins'
): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.communicationRegister || 'COM-REG'}`;
  const fileName = `Communication_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = notices
    .map((n, idx) => {
      const totalRecipients = n.totalRecipientsCount || 20;
      const ackCount = n.acknowledgedCount || 0;
      const pct = Math.round((ackCount / Math.max(totalRecipients, 1)) * 100);

      return `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-family: monospace;">${n.noticeNumber}</td>
          <td>${n.title}</td>
          <td>${n.urgency}</td>
          <td>${n.category || 'GENERAL_ANNOUNCEMENT'}</td>
          <td>${n.author}</td>
          <td>${n.targetDepartment}</td>
          <td>${n.publishedDate}</td>
          <td>${n.effectiveUntil || ''}</td>
          <td>${ackCount}</td>
          <td>${totalRecipients}</td>
          <td>${pct}%</td>
          <td>${n.actionRequired || ''}</td>
          <td>${n.buyerRef || ''}</td>
          <td>${n.orderRef || ''}</td>
          <td>${n.styleRef || ''}</td>
        </tr>
      `;
    })
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; }
          td { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="16" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="16" style="font-size: 12pt; font-weight: bold;">
              FACTORY INTERNAL COMMUNICATIONS &amp; DIRECTIVES MASTER REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="16" style="color: #64748b;">
              Scope: ${scopeLabel} | Doc Code: ${docCode} | Generated: ${new Date().toLocaleString()}
            </td>
          </tr>
          <tr><td colspan="16"></td></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>Notice Number</th>
              <th>Title / Subject</th>
              <th>Urgency Priority</th>
              <th>Category</th>
              <th>Author / Issuer</th>
              <th>Target Department</th>
              <th>Published Date</th>
              <th>Effective Until</th>
              <th>Acknowledged Count</th>
              <th>Total Recipients</th>
              <th>Sign-off %</th>
              <th>Action Required</th>
              <th>Buyer Ref</th>
              <th>Order Ref</th>
              <th>Style Ref</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export Global Communication Notice Register CSV
 */
export function exportCommunicationRegisterCsv(
  notices: CommunicationNotice[],
  scopeLabel: string = 'All'
): void {
  const headers = [
    'Notice Number',
    'Title',
    'Urgency',
    'Category',
    'Author',
    'Target Department',
    'Published Date',
    'Effective Until',
    'Acknowledged Count',
    'Total Recipients',
    'Action Required',
    'Buyer Ref',
    'Order Ref',
  ];

  const rows = notices.map((n) => [
    n.noticeNumber,
    n.title,
    n.urgency,
    n.category || 'GENERAL_ANNOUNCEMENT',
    n.author,
    n.targetDepartment,
    n.publishedDate,
    n.effectiveUntil || '',
    n.acknowledgedCount || 0,
    n.totalRecipientsCount || 20,
    n.actionRequired || '',
    n.buyerRef || '',
    n.orderRef || '',
  ]);

  const fileName = `Communication_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCommunicationCsv(fileName, headers, rows);
}

/**
 * Export Single Communication Notice Dossier PDF
 */
export function exportCommunicationSinglePdf(notice: CommunicationNotice): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'communication', 'single', notice.noticeNumber);
  const docCode = config.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const acksHtml = (notice.acknowledgments || [])
    .slice(0, 15)
    .map(
      (ack, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 8pt; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
        <td style="padding: 5px 8px; font-weight: bold; color: #1e3a8a;">${ack.userName}</td>
        <td style="padding: 5px 8px; color: #475569;">${ack.department}</td>
        <td style="padding: 5px 8px; font-family: monospace; color: #0f172a;">${ack.acknowledgedAt}</td>
        <td style="padding: 5px 8px; color: #15803d; font-weight: 600;">✓ Confirmed Digital Signature</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${notice.noticeNumber}_Directive_Dossier</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 14mm 12mm 14mm;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 15px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .notice-badge-box {
            margin: 14px 0;
            padding: 12px 16px;
            border-radius: 8px;
            background: ${notice.urgency === 'HIGH_PRIORITY' ? '#fff1f2' : '#f0fdf4'};
            border: 1px solid ${notice.urgency === 'HIGH_PRIORITY' ? '#fecdd3' : '#bbf7d0'};
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 12px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            background: #ffffff;
          }
          .card-title {
            font-size: 8pt;
            font-weight: 800;
            text-transform: uppercase;
            color: #1e3a8a;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 4px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 8.5pt;
            padding: 3px 0;
            border-bottom: 1px dashed #f1f5f9;
          }
          .meta-label {
            color: #64748b;
            font-weight: 600;
          }
          .meta-value {
            font-weight: 700;
            color: #0f172a;
            text-align: right;
          }
          .content-box {
            margin-top: 14px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 14px 16px;
            background: #ffffff;
          }
          .action-box {
            margin-top: 12px;
            border: 1px solid #fde047;
            border-radius: 8px;
            padding: 10px 14px;
            background: #fefce8;
          }
          .sign-block {
            margin-top: 30px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 25px;
          }
          .sign-box {
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            text-align: center;
          }
          .sign-title {
            font-weight: 700;
            font-size: 8.5pt;
            color: #1e293b;
          }
          .sign-sub {
            font-size: 7.5pt;
            color: #64748b;
          }
          .footer-strip {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8pt;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
          <button onclick="window.print()" style="padding: 6px 14px; background: #1e3a8a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">
            Print / Save as PDF
          </button>
        </div>

        ${dynamicHeaderHtml}

        <div class="notice-badge-box">
          <div>
            <div style="font-size: 13pt; font-weight: 800; color: #0f172a;">${notice.title}</div>
            <div style="font-size: 8.5pt; color: #475569; margin-top: 2px;">
              Category: <strong>${(notice.category || 'ANNOUNCEMENT').replace(/_/g, ' ')}</strong> • Issued By: <strong>${notice.author}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 11pt; font-weight: 800; color: #1e3a8a;">
              ${notice.noticeNumber}
            </div>
            <div style="font-size: 8pt; font-weight: 800; color: ${notice.urgency === 'HIGH_PRIORITY' ? '#be123c' : '#15803d'}; text-transform: uppercase;">
              PRIORITY: ${notice.urgency.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title">Directive Dispatch Information</div>
            <div class="meta-row">
              <span class="meta-label">Target Audience:</span>
              <span class="meta-value">${notice.targetDepartment || 'All Plant Units'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Broadcast Date:</span>
              <span class="meta-value" style="font-family: monospace;">${notice.publishedDate}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Effective Validity:</span>
              <span class="meta-value" style="font-family: monospace;">${notice.effectiveUntil || 'Permanent Directive'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Author Role:</span>
              <span class="meta-value">${notice.authorRole || 'Compliance Director'}</span>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Order Context &amp; Digital Sign-offs</div>
            <div class="meta-row">
              <span class="meta-label">Buyer Reference:</span>
              <span class="meta-value">${notice.buyerRef || 'Factory Wide'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Order / Style Ref:</span>
              <span class="meta-value">${notice.orderRef ? `PO: ${notice.orderRef}` : 'N/A'} ${notice.styleRef ? `(${notice.styleRef})` : ''}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Confirmed Sign-offs:</span>
              <span class="meta-value" style="font-family: monospace; color: #15803d;">
                ${notice.acknowledgedCount || 0} / ${notice.totalRecipientsCount || 20} Personnel
              </span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Notice Status:</span>
              <span class="meta-value" style="color: #1e3a8a;">${notice.pinned ? 'Pinned Directive' : 'Standard Bulletin'}</span>
            </div>
          </div>
        </div>

        <div class="content-box">
          <div style="font-size: 8.5pt; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            Official Directive Statement &amp; Guidance
          </div>
          <div style="font-size: 9pt; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
            ${notice.content}
          </div>
        </div>

        ${
          notice.actionRequired
            ? `
            <div class="action-box">
              <div style="font-size: 8pt; font-weight: 800; color: #854d0e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                Mandatory Action Required by Recipients
              </div>
              <div style="font-size: 8.5pt; color: #713f12; font-weight: 600;">
                ${notice.actionRequired}
              </div>
            </div>
          `
            : ''
        }

        ${
          acksHtml
            ? `
            <div style="margin-top: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background: #0f172a; color: white; padding: 6px 10px; font-weight: 700; font-size: 8pt;">
                Sample Digital Recipient Sign-off Verification Log
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f1f5f9; color: #475569; font-size: 7.5pt; text-transform: uppercase;">
                    <th style="padding: 4px 8px; text-align: left;">Recipient Name</th>
                    <th style="padding: 4px 8px; text-align: left;">Department</th>
                    <th style="padding: 4px 8px; text-align: left;">Timestamp</th>
                    <th style="padding: 4px 8px; text-align: left;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${acksHtml}
                </tbody>
              </table>
            </div>
          `
            : ''
        }

        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Issued By</div>
            <div class="sign-sub">${notice.author}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Operations / Plant Head</div>
            <div class="sign-sub">Directive Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Executive Managing Director</div>
            <div class="sign-sub">Corporate Notice Sanction</div>
          </div>
        </div>

        <div class="footer-strip">
          <span>Dossier Reference: <strong>${docCode}</strong> • ISO 9001:2015 Clause 7.4</span>
          <span>Security Classification: INTERNAL DIRECTIVE</span>
          <span>Printed: ${new Date().toLocaleDateString()}</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Single Communication Notice Excel (.xls)
 */
export function exportCommunicationSingleExcel(notice: CommunicationNotice): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.communicationDossier || 'COM-NOT'}-${notice.noticeNumber}`;
  const fileName = `Notice_${notice.noticeNumber}_Dossier.xls`;

  const ackRows = (notice.acknowledgments || [])
    .map(
      (a) => `
      <tr>
        <td>${a.userName}</td>
        <td>${a.department}</td>
        <td>${a.acknowledgedAt}</td>
        <td>ACKNOWLEDGED</td>
      </tr>
    `
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: left; }
          td { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="4" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 12pt; font-weight: bold;">
              OFFICIAL FACTORY NOTICE: ${notice.title}
            </td>
          </tr>
          <tr>
            <td colspan="4" style="color: #64748b;">
              Notice No: ${notice.noticeNumber} | Priority: ${notice.urgency} | Doc Code: ${docCode}
            </td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr><th colspan="2">Notice Field</th><th colspan="2">Attribute Value</th></tr>
          <tr><td colspan="2">Notice Number</td><td colspan="2">${notice.noticeNumber}</td></tr>
          <tr><td colspan="2">Title / Subject</td><td colspan="2">${notice.title}</td></tr>
          <tr><td colspan="2">Category</td><td colspan="2">${notice.category || 'ANNOUNCEMENT'}</td></tr>
          <tr><td colspan="2">Urgency Priority</td><td colspan="2">${notice.urgency}</td></tr>
          <tr><td colspan="2">Author / Issuer</td><td colspan="2">${notice.author}</td></tr>
          <tr><td colspan="2">Target Department</td><td colspan="2">${notice.targetDepartment}</td></tr>
          <tr><td colspan="2">Published Date</td><td colspan="2">${notice.publishedDate}</td></tr>
          <tr><td colspan="2">Effective Until</td><td colspan="2">${notice.effectiveUntil || 'Permanent'}</td></tr>
          <tr><td colspan="2">Notice Content</td><td colspan="2">${notice.content}</td></tr>
          <tr><td colspan="2">Action Required</td><td colspan="2">${notice.actionRequired || 'None'}</td></tr>
          <tr><td colspan="2">Buyer Ref</td><td colspan="2">${notice.buyerRef || 'N/A'}</td></tr>
          <tr><td colspan="2">Order Ref</td><td colspan="2">${notice.orderRef || 'N/A'}</td></tr>
          <tr><td colspan="4"></td></tr>
          <thead>
            <tr>
              <th>Acknowledged By</th>
              <th>Department</th>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${ackRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export Single Communication Notice CSV
 */
export function exportCommunicationSingleCsv(notice: CommunicationNotice): void {
  const headers = ['Recipient Name', 'Department', 'Sign-off Timestamp', 'Notice Number'];
  const rows = (notice.acknowledgments || []).map((a) => [
    a.userName,
    a.department,
    a.acknowledgedAt,
    notice.noticeNumber,
  ]);

  if (rows.length === 0) {
    rows.push([
      notice.author,
      notice.targetDepartment,
      notice.publishedDate,
      notice.noticeNumber,
    ]);
  }

  const fileName = `Notice_${notice.noticeNumber}_Signoffs.csv`;
  downloadCommunicationCsv(fileName, headers, rows);
}
