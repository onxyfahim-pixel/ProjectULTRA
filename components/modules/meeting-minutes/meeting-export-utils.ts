import { MeetingMinutesItem, MeetingStatus } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Meeting Minutes module
 */
export function computeMeetingKpis(meetings: MeetingMinutesItem[]) {
  const total = meetings.length;
  const closed = meetings.filter((m) => m.status === 'CLOSED').length;
  const pendingActionsMtg = meetings.filter((m) => m.status === 'ACTIONS_PENDING').length;
  const inReview = meetings.filter((m) => m.status === 'IN_REVIEW').length;
  const draft = meetings.filter((m) => m.status === 'DRAFT').length;
  const totalAttendees = meetings.reduce((acc, m) => acc + (m.attendeesCount || m.attendees?.length || 0), 0);
  
  // Total action items & closed action items
  let totalActions = 0;
  let closedActions = 0;
  meetings.forEach((m) => {
    if (m.actionItems) {
      totalActions += m.actionItems.length;
      closedActions += m.actionItems.filter((a) => a.completed).length;
    }
  });

  const actionResolutionRate = totalActions > 0 ? Math.round((closedActions / totalActions) * 100) : 100;

  return {
    total,
    closed,
    pendingActionsMtg,
    inReview,
    draft,
    totalAttendees,
    totalActions,
    closedActions,
    actionResolutionRate,
  };
}

/**
 * Download CSV helper
 */
export function downloadMeetingCsv(
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
 * Export Global Meeting Minutes Master Register PDF
 */
export function exportMeetingRegisterPdf(
  meetings: MeetingMinutesItem[],
  scopeLabel: string = 'All Meetings'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeMeetingKpis(meetings);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'meeting_minutes', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const getStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case 'CLOSED':
        return '#15803d';
      case 'ACTIONS_PENDING':
        return '#b45309';
      case 'IN_REVIEW':
        return '#0284c7';
      default:
        return '#475569';
    }
  };

  const getStatusBg = (status: MeetingStatus) => {
    switch (status) {
      case 'CLOSED':
        return '#dcfce7';
      case 'ACTIONS_PENDING':
        return '#fef3c7';
      case 'IN_REVIEW':
        return '#e0f2fe';
      default:
        return '#f1f5f9';
    }
  };

  const rowsHtml = meetings
    .map((m, index) => {
      const actionCount = m.actionItems?.length || 0;
      const closedCount = m.actionItems?.filter((a) => a.completed).length || 0;

      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${index + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${m.meetingCode}</td>
          <td>
            <strong>${m.title}</strong>
            ${m.agenda ? `<div style="font-size: 8pt; color: #64748b; margin-top: 2px;">${m.agenda.slice(0, 75)}${m.agenda.length > 75 ? '...' : ''}</div>` : ''}
          </td>
          <td><span style="font-size: 8pt; font-weight: 600; padding: 2px 6px; background-color: #f1f5f9; border-radius: 4px;">${m.meetingType ? m.meetingType.replace(/_/g, ' ') : 'GENERAL'}</span></td>
          <td>${m.meetingDate} ${m.meetingTime ? `<br/><span style="font-size: 8pt; color: #64748b;">${m.meetingTime}</span>` : ''}</td>
          <td>${m.venue || 'HQ Boardroom'}</td>
          <td>${m.chairperson}</td>
          <td style="text-align: center;">${m.attendeesCount || m.attendees?.length || 0}</td>
          <td style="text-align: center;">
            <span style="font-weight: 600;">${closedCount}/${actionCount}</span>
          </td>
          <td style="text-align: center;">
            <span style="
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 8pt;
              font-weight: bold;
              background-color: ${getStatusBg(m.status)};
              color: ${getStatusColor(m.status)};
            ">
              ${m.status.replace(/_/g, ' ')}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MOM Master Register - ${new Date().toISOString().slice(0, 10)}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: landscape;
            margin: 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            font-size: 9pt;
            line-height: 1.4;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
            margin: 14px 0 16px 0;
          }
          .kpi-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
          }
          .kpi-title {
            font-size: 7.5pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
          }
          .kpi-value {
            font-size: 14pt;
            font-weight: 800;
            color: #1e3a8a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 8.5pt;
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
          .sign-block {
            margin-top: 25px;
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
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <!-- KPI Summary Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Total Meetings</div>
            <div class="kpi-value">${kpis.total}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Closed / Resolved</div>
            <div class="kpi-value" style="color: #15803d;">${kpis.closed}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Actions Pending</div>
            <div class="kpi-value" style="color: #b45309;">${kpis.pendingActionsMtg}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Total Attendees</div>
            <div class="kpi-value" style="color: #6366f1;">${kpis.totalAttendees}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Open Action Items</div>
            <div class="kpi-value" style="color: #dc2626;">${kpis.totalActions - kpis.closedActions}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Action Resolution</div>
            <div class="kpi-value" style="color: #0f766e;">${kpis.actionResolutionRate}%</div>
          </div>
        </div>

        <!-- Master Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 3%; text-align: center;">#</th>
              <th style="width: 10%;">MOM Code</th>
              <th style="width: 20%;">Meeting Title & Scope</th>
              <th style="width: 11%;">Type</th>
              <th style="width: 10%;">Date & Time</th>
              <th style="width: 10%;">Venue</th>
              <th style="width: 12%;">Chairperson</th>
              <th style="width: 6%; text-align: center;">Attendees</th>
              <th style="width: 8%; text-align: center;">Actions Done</th>
              <th style="width: 10%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Sign-off Block -->
        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Recorded By (Scribe)</div>
            <div class="sign-sub">Secretariat / Admin Officer</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Meeting Chairperson</div>
            <div class="sign-sub">Lead Executive / Division Head</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Head of Quality & Compliance</div>
            <div class="sign-sub">Action Items Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Managing Director / COO</div>
            <div class="sign-sub">Corporate Executive Sign-off</div>
          </div>
        </div>

        <!-- Footer Strip -->
        <div class="footer-strip">
          <div>Doc Code: <strong>${docCode}</strong> • ISO 9001:2015 Clause 9.3 Management Review Records</div>
          <div>Printed: ${new Date().toLocaleString()} • Page 1 of 1</div>
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
 * Export Global Meeting Minutes Excel (.xls)
 */
export function exportMeetingRegisterExcel(meetings: MeetingMinutesItem[]): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.meetingMinutesRegister || 'MOM-REG'}`;
  const fileName = `MOM_Master_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = meetings
    .map(
      (m, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-family: monospace;">${m.meetingCode}</td>
          <td>${m.title}</td>
          <td>${m.meetingType || 'GENERAL'}</td>
          <td>${m.meetingDate}</td>
          <td>${m.meetingTime || ''}</td>
          <td>${m.venue || ''}</td>
          <td>${m.chairperson}</td>
          <td>${m.scribeName || ''}</td>
          <td>${m.buyerName || ''}</td>
          <td>${m.orderPoNumber || ''}</td>
          <td>${m.styleNumber || ''}</td>
          <td>${m.attendeesCount || m.attendees?.length || 0}</td>
          <td>${m.actionItems?.length || 0}</td>
          <td>${m.actionItems?.filter((a) => a.completed).length || 0}</td>
          <td>${m.status}</td>
        </tr>
      `
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>MOM Register</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
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
              OFFICIAL MINUTES OF MEETING (MOM) & ACTION ITEMS MASTER REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="16" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Export Date: ${new Date().toISOString().slice(0, 10)} | Standard: ISO 9001:2015 Clause 9.3
            </td>
          </tr>
          <tr><td colspan="16"></td></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>MOM Code</th>
            <th>Title</th>
            <th>Meeting Type</th>
            <th>Date</th>
            <th>Time</th>
            <th>Venue</th>
            <th>Chairperson</th>
            <th>Scribe</th>
            <th>Buyer</th>
            <th>Order / PO</th>
            <th>Style</th>
            <th>Attendees</th>
            <th>Total Actions</th>
            <th>Closed Actions</th>
            <th>Status</th>
          </tr>
          ${rows}
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
 * Export Individual Meeting Minutes PDF Dossier
 */
export function exportSingleMeetingPdf(meeting: MeetingMinutesItem): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'meeting_minutes', 'single', meeting.meetingCode);
  const docCode = config.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const attendeesHtml = (meeting.attendees || [])
    .map(
      (att, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${att.name}</strong></td>
          <td>${att.organization || 'FACTORY'}</td>
          <td>${att.department || ''}</td>
          <td>${att.role || 'Member'}</td>
          <td style="text-align: center;">${att.attendanceStatus === 'PRESENT' ? '<span style="color: #15803d; font-weight: bold;">Present</span>' : '<span style="color: #be123c;">' + att.attendanceStatus + '</span>'}</td>
          <td style="height: 24px; border-bottom: 1px dotted #94a3b8; text-align: center;">
            ${att.signatureConfirmed ? '<span style="font-size: 7.5pt; color: #15803d; font-weight: bold;">✓ Confirmed</span>' : ''}
          </td>
        </tr>
      `
    )
    .join('');

  const discussionNotesHtml = (meeting.discussionNotes || [])
    .map(
      (note, idx) => `
        <div style="margin-bottom: 6px; padding-left: 12px; border-left: 2px solid #3b82f6;">
          <span style="font-weight: bold; color: #1e3a8a;">Point ${idx + 1}:</span> ${note}
        </div>
      `
    )
    .join('');

  const actionItemsHtml = (meeting.actionItems || [])
    .map(
      (item, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${item.task}</strong>${item.verificationNotes ? `<br/><span style="font-size: 7.5pt; color: #64748b;">${item.verificationNotes}</span>` : ''}</td>
          <td>${item.assignee}</td>
          <td>${item.department || ''}</td>
          <td style="text-align: center; font-weight: 600;">${item.dueDate || 'TBD'}</td>
          <td style="text-align: center;">
            <span style="
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 7.5pt;
              font-weight: bold;
              background-color: ${item.completed ? '#dcfce7' : '#fef3c7'};
              color: ${item.completed ? '#15803d' : '#b45309'};
            ">
              ${item.completed ? 'COMPLETED' : 'PENDING'}
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
        <title>MOM Dossier - ${meeting.meetingCode}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: portrait;
            margin: 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            font-size: 9pt;
            line-height: 1.45;
          }
          .section-title {
            background-color: #f1f5f9;
            padding: 6px 10px;
            font-weight: 700;
            font-size: 9.5pt;
            color: #0f172a;
            border-left: 4px solid #1e3a8a;
            margin: 14px 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .info-cell {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 6px 10px;
          }
          .info-label {
            font-size: 7.5pt;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
          }
          .info-val {
            font-size: 9.5pt;
            font-weight: 600;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 8.5pt;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #0f172a;
            font-size: 8pt;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .sign-block {
            margin-top: 25px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
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
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <!-- 1. General Meeting Profile -->
        <div class="section-title">1. Meeting Profile &amp; Governance Details</div>
        <div class="grid-4">
          <div class="info-cell">
            <div class="info-label">MOM Code</div>
            <div class="info-val" style="color: #1e3a8a;">${meeting.meetingCode}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Meeting Type</div>
            <div class="info-val">${meeting.meetingType ? meeting.meetingType.replace(/_/g, ' ') : 'GENERAL'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Date &amp; Time</div>
            <div class="info-val">${meeting.meetingDate} ${meeting.meetingTime ? `(${meeting.meetingTime})` : ''}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Status</div>
            <div class="info-val" style="color: #15803d;">${meeting.status}</div>
          </div>
        </div>

        <div class="grid-4" style="margin-top: 8px;">
          <div class="info-cell">
            <div class="info-label">Venue / Room</div>
            <div class="info-val">${meeting.venue || 'HQ Conference Room'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Chairperson</div>
            <div class="info-val">${meeting.chairperson}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Scribe / Secretariat</div>
            <div class="info-val">${meeting.scribeName || 'Admin Desk'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Buyer / Style Ref</div>
            <div class="info-val">${meeting.buyerName || 'Internal'} ${meeting.styleNumber ? `• ${meeting.styleNumber}` : ''}</div>
          </div>
        </div>

        <!-- 2. Agenda & Objectives -->
        <div class="section-title">2. Meeting Agenda &amp; Key Objectives</div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
          <p style="margin: 0; font-size: 9pt; white-space: pre-wrap;">${meeting.agenda || 'Standard Agenda'}</p>
        </div>

        <!-- 3. Discussion Points & Deliberations -->
        ${
          meeting.discussionNotes && meeting.discussionNotes.length > 0
            ? `
              <div class="section-title">3. Key Deliberations &amp; Discussion Points</div>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
                ${discussionNotesHtml}
              </div>
            `
            : ''
        }

        <!-- 4. Attendees Attendance Register -->
        <div class="section-title">4. Official Attendees &amp; Attendance Log (${meeting.attendeesCount || meeting.attendees?.length || 0} Attended)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 25%;">Attendee Name</th>
              <th style="width: 18%;">Organization</th>
              <th style="width: 15%;">Department</th>
              <th style="width: 15%;">Role</th>
              <th style="width: 10%; text-align: center;">Status</th>
              <th style="width: 12%;">Signature</th>
            </tr>
          </thead>
          <tbody>
            ${attendeesHtml || '<tr><td colspan="7" style="text-align: center; color: #64748b;">No formal attendee register records attached</td></tr>'}
          </tbody>
        </table>

        <!-- 5. Action Items & Resolution Matrix -->
        <div class="section-title">5. Agreed Action Items &amp; Accountability Log (${meeting.actionItems?.length || 0} Items)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 40%;">Task / Action Description</th>
              <th style="width: 18%;">Assignee</th>
              <th style="width: 15%;">Department</th>
              <th style="width: 12%; text-align: center;">Due Date</th>
              <th style="width: 10%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${actionItemsHtml || '<tr><td colspan="6" style="text-align: center; color: #64748b;">No action items recorded for this session</td></tr>'}
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Recorded By</div>
            <div class="sign-sub">${meeting.scribeName || 'Secretariat Officer'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Meeting Chairperson</div>
            <div class="sign-sub">${meeting.chairperson}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Corporate Compliance Approval</div>
            <div class="sign-sub">${meeting.approvedBy || 'Quality Assurance Director'}</div>
          </div>
        </div>

        <div class="footer-strip">
          <div>Doc Code: <strong>${docCode}</strong> • Ref: ${meeting.meetingCode}</div>
          <div>Printed: ${new Date().toLocaleString()} • Official Factory Record</div>
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
 * Export Individual Meeting Minutes Excel (.xls)
 */
export function exportSingleMeetingExcel(meeting: MeetingMinutesItem): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.meetingMinutesDossier || 'MOM-SPEC'}`;
  const fileName = `MOM_${meeting.meetingCode}_${new Date().toISOString().slice(0, 10)}.xls`;

  const attendeesRows = (meeting.attendees || [])
    .map(
      (a, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${a.name}</td>
          <td>${a.organization || 'FACTORY'}</td>
          <td>${a.department || ''}</td>
          <td>${a.role || 'Member'}</td>
          <td>${a.attendanceStatus}</td>
        </tr>
      `
    )
    .join('');

  const actionRows = (meeting.actionItems || [])
    .map(
      (act, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${act.task}</td>
          <td>${act.assignee}</td>
          <td>${act.department || ''}</td>
          <td>${act.dueDate || ''}</td>
          <td>${act.completed ? 'COMPLETED' : 'PENDING'}</td>
          <td>${act.verificationNotes || ''}</td>
        </tr>
      `
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>MOM Summary</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; }
          td { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="7" style="font-size: 15pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="7" style="font-size: 12pt; font-weight: bold;">
              OFFICIAL MINUTES OF MEETING (MOM) DOSSIER
            </td>
          </tr>
          <tr>
            <td colspan="7" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Meeting Code: ${meeting.meetingCode} | Date: ${meeting.meetingDate}
            </td>
          </tr>
          <tr><td colspan="7"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="7" style="text-align: left; color: #0f172a;">1. GENERAL DETAILS</th></tr>
          <tr><td><strong>Meeting Code:</strong></td><td>${meeting.meetingCode}</td><td><strong>Date:</strong></td><td>${meeting.meetingDate} ${meeting.meetingTime || ''}</td><td><strong>Status:</strong></td><td colspan="2">${meeting.status}</td></tr>
          <tr><td><strong>Title:</strong></td><td colspan="6">${meeting.title}</td></tr>
          <tr><td><strong>Meeting Type:</strong></td><td>${meeting.meetingType || 'GENERAL'}</td><td><strong>Venue:</strong></td><td>${meeting.venue || ''}</td><td><strong>Chairperson:</strong></td><td colspan="2">${meeting.chairperson}</td></tr>
          <tr><td><strong>Buyer:</strong></td><td>${meeting.buyerName || 'N/A'}</td><td><strong>Order/PO:</strong></td><td>${meeting.orderPoNumber || 'N/A'}</td><td><strong>Style:</strong></td><td colspan="2">${meeting.styleNumber || 'N/A'}</td></tr>
          <tr><td><strong>Agenda:</strong></td><td colspan="6">${meeting.agenda || ''}</td></tr>
          <tr><td colspan="7"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="7" style="text-align: left; color: #0f172a;">2. ATTENDEES LIST</th></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>Name</th>
            <th>Organization</th>
            <th>Department</th>
            <th>Role</th>
            <th colspan="2">Status</th>
          </tr>
          ${attendeesRows}
          <tr><td colspan="7"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="7" style="text-align: left; color: #0f172a;">3. ACTION ITEMS LOG</th></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th colspan="2">Action / Task</th>
            <th>Assignee</th>
            <th>Department</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
          ${actionRows}
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
