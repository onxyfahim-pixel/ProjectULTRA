import { FactoryEventItem, EventStatus } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Events & Delegation module
 */
export function computeEventKpis(events: FactoryEventItem[]) {
  const total = events.length;
  const concluded = events.filter((e) => e.status === 'CONCLUDED').length;
  const inProgress = events.filter((e) => e.status === 'IN_PROGRESS').length;
  const upcoming = events.filter((e) => e.status === 'UPCOMING').length;
  const highPriority = events.filter((e) => e.priority === 'CRITICAL' || e.priority === 'HIGH').length;

  const totalAttendees = events.reduce(
    (acc, e) => acc + (e.attendeesCount || e.delegationMembers?.length || 0),
    0
  );

  let totalChecklistItems = 0;
  let completedChecklistItems = 0;
  events.forEach((e) => {
    if (e.preparationChecklist) {
      totalChecklistItems += e.preparationChecklist.length;
      completedChecklistItems += e.preparationChecklist.filter((c) => c.completed).length;
    }
  });

  const avgReadiness =
    events.length > 0
      ? Math.round(
          events.reduce((acc, e) => acc + (e.readinessPercentage || 0), 0) / events.length
        )
      : 100;

  return {
    total,
    concluded,
    inProgress,
    upcoming,
    highPriority,
    totalAttendees,
    totalChecklistItems,
    completedChecklistItems,
    avgReadiness,
  };
}

/**
 * Download CSV helper
 */
export function downloadEventCsv(
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
 * Export Global Factory Events Master Register PDF
 */
export function exportEventRegisterPdf(
  events: FactoryEventItem[],
  scopeLabel: string = 'All Events'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeEventKpis(events);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'events', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'CONCLUDED':
        return '#15803d';
      case 'IN_PROGRESS':
        return '#b45309';
      case 'UPCOMING':
        return '#0284c7';
      case 'POSTPONED':
        return '#7e22ce';
      default:
        return '#475569';
    }
  };

  const getStatusBg = (status: EventStatus) => {
    switch (status) {
      case 'CONCLUDED':
        return '#dcfce7';
      case 'IN_PROGRESS':
        return '#fef3c7';
      case 'UPCOMING':
        return '#e0f2fe';
      case 'POSTPONED':
        return '#f3e8ff';
      default:
        return '#f1f5f9';
    }
  };

  const rowsHtml = events
    .map((e, index) => {
      const attendees = e.attendeesCount || e.delegationMembers?.length || 0;
      const readiness = e.readinessPercentage || 0;

      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${index + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${e.eventCode}</td>
          <td>
            <strong>${e.title}</strong>
            ${e.buyerName ? `<div style="font-size: 8pt; color: #64748b; margin-top: 2px;">Buyer: ${e.buyerName}</div>` : ''}
          </td>
          <td><span style="font-size: 8pt; font-weight: 600; padding: 2px 6px; background-color: #f1f5f9; border-radius: 4px;">${e.type ? String(e.type).replace(/_/g, ' ') : 'EVENT'}</span></td>
          <td>${e.eventDate} ${e.timeSlot ? `<br/><span style="font-size: 8pt; color: #64748b;">${e.timeSlot}</span>` : ''}</td>
          <td>${e.location}</td>
          <td>${e.leadOrganizer}</td>
          <td style="text-align: center;">${attendees}</td>
          <td style="text-align: center;">
            <div style="font-weight: 600; color: ${readiness >= 90 ? '#15803d' : readiness >= 60 ? '#b45309' : '#dc2626'};">${readiness}%</div>
          </td>
          <td style="text-align: center;">
            <span style="
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 8pt;
              font-weight: bold;
              background-color: ${getStatusBg(e.status)};
              color: ${getStatusColor(e.status)};
            ">
              ${e.status.replace(/_/g, ' ')}
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
        <title>Factory Events Master Register - ${new Date().toISOString().slice(0, 10)}</title>
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
            <div class="kpi-title">Total Events</div>
            <div class="kpi-value">${kpis.total}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Concluded</div>
            <div class="kpi-value" style="color: #15803d;">${kpis.concluded}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Upcoming</div>
            <div class="kpi-value" style="color: #0284c7;">${kpis.upcoming}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Delegates & Attendees</div>
            <div class="kpi-value" style="color: #6366f1;">${kpis.totalAttendees}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">High Priority</div>
            <div class="kpi-value" style="color: #be123c;">${kpis.highPriority}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Avg Readiness</div>
            <div class="kpi-value" style="color: #0f766e;">${kpis.avgReadiness}%</div>
          </div>
        </div>

        <!-- Master Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 3%; text-align: center;">#</th>
              <th style="width: 10%;">Event Code</th>
              <th style="width: 22%;">Event Title & Buyer</th>
              <th style="width: 12%;">Type</th>
              <th style="width: 10%;">Date & Time</th>
              <th style="width: 11%;">Location</th>
              <th style="width: 12%;">Lead Organizer</th>
              <th style="width: 6%; text-align: center;">Delegates</th>
              <th style="width: 6%; text-align: center;">Readiness</th>
              <th style="width: 8%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Sign-off Block -->
        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Protocol & Event Lead</div>
            <div class="sign-sub">Operational Coordination</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Factory Operations Manager</div>
            <div class="sign-sub">Floor & Department Readiness</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Head of QA & Compliance</div>
            <div class="sign-sub">Audit & Protocol Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Executive Director</div>
            <div class="sign-sub">Executive Protocol Endorsement</div>
          </div>
        </div>

        <!-- Footer Strip -->
        <div class="footer-strip">
          <div>Doc Code: <strong>${docCode}</strong> • Standard: Buyer Protocol & Factory Visit SOP</div>
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
 * Export Global Events Excel (.xls)
 */
export function exportEventRegisterExcel(events: FactoryEventItem[]): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.factoryEventsRegister || 'EVT-REG'}`;
  const fileName = `Factory_Events_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = events
    .map(
      (e, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-family: monospace;">${e.eventCode}</td>
          <td>${e.title}</td>
          <td>${e.type ? String(e.type).replace(/_/g, ' ') : 'EVENT'}</td>
          <td>${e.eventDate}</td>
          <td>${e.endDate || ''}</td>
          <td>${e.timeSlot || ''}</td>
          <td>${e.location}</td>
          <td>${e.leadOrganizer}</td>
          <td>${e.buyerName || ''}</td>
          <td>${e.department || ''}</td>
          <td>${e.priority || 'MEDIUM'}</td>
          <td>${e.attendeesCount || e.delegationMembers?.length || 0}</td>
          <td>${e.readinessPercentage || 0}%</td>
          <td>${e.status}</td>
          <td>${e.agendaSummary || ''}</td>
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
                <x:Name>Events Register</x:Name>
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
              FACTORY EVENTS, BUYER VISITS & AUDIT DELEGATIONS MASTER REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="16" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Export Date: ${new Date().toISOString().slice(0, 10)} | Standard: Protocol & Operations SOP
            </td>
          </tr>
          <tr><td colspan="16"></td></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>Event Code</th>
            <th>Title</th>
            <th>Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Time Slot</th>
            <th>Location</th>
            <th>Lead Organizer</th>
            <th>Buyer</th>
            <th>Department</th>
            <th>Priority</th>
            <th>Delegates</th>
            <th>Readiness %</th>
            <th>Status</th>
            <th>Agenda Summary</th>
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
 * Export Individual Event Dossier PDF
 */
export function exportSingleEventPdf(event: FactoryEventItem): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'events', 'single', event.eventCode);
  const docCode = config.fullDocCode;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const delegatesHtml = (event.delegationMembers || [])
    .map(
      (del, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${del.name}</strong></td>
          <td>${del.organization}</td>
          <td>${del.department || ''}</td>
          <td>${del.role}</td>
          <td style="text-align: center;">${del.confirmed ? '<span style="color: #15803d; font-weight: bold;">Confirmed</span>' : '<span style="color: #b45309;">Invited</span>'}</td>
        </tr>
      `
    )
    .join('');

  const itineraryHtml = (event.itinerary || [])
    .map(
      (it, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 600;">${it.timeSlot}</td>
          <td><strong>${it.activity}</strong></td>
          <td>${it.location}</td>
          <td>${it.facilitator}</td>
        </tr>
      `
    )
    .join('');

  const checklistHtml = (event.preparationChecklist || [])
    .map(
      (chk, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${chk.task}</strong></td>
          <td>${chk.responsiblePerson}</td>
          <td style="text-align: center; font-weight: 600;">${chk.dueDate || 'TBD'}</td>
          <td style="text-align: center;">
            <span style="
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 7.5pt;
              font-weight: bold;
              background-color: ${chk.completed ? '#dcfce7' : '#fee2e2'};
              color: ${chk.completed ? '#15803d' : '#be123c'};
            ">
              ${chk.completed ? 'COMPLETED' : 'PENDING'}
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
        <title>Event Dossier - ${event.eventCode}</title>
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

        <!-- 1. Profile -->
        <div class="section-title">1. Event Profile &amp; Protocol Parameters</div>
        <div class="grid-4">
          <div class="info-cell">
            <div class="info-label">Event Code</div>
            <div class="info-val" style="color: #1e3a8a;">${event.eventCode}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Event Type</div>
            <div class="info-val">${event.type ? String(event.type).replace(/_/g, ' ') : 'EVENT'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Date &amp; Time</div>
            <div class="info-val">${event.eventDate} ${event.timeSlot ? `(${event.timeSlot})` : ''}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Status</div>
            <div class="info-val" style="color: #15803d;">${event.status}</div>
          </div>
        </div>

        <div class="grid-4" style="margin-top: 8px;">
          <div class="info-cell">
            <div class="info-label">Location / Floor</div>
            <div class="info-val">${event.location}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Lead Organizer</div>
            <div class="info-val">${event.leadOrganizer}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Buyer / Organization</div>
            <div class="info-val">${event.buyerName || 'Internal Factory'}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Readiness %</div>
            <div class="info-val" style="color: #0f766e;">${event.readinessPercentage || 0}%</div>
          </div>
        </div>

        <!-- 2. Description & Agenda -->
        <div class="section-title">2. Objectives &amp; Executive Summary</div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
          <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 4px;">${event.title}</div>
          <p style="margin: 0; font-size: 8.5pt; white-space: pre-wrap;">${event.description || event.agendaSummary || 'No formal briefing description specified.'}</p>
        </div>

        <!-- 3. Delegation Members -->
        <div class="section-title">3. Official Delegation &amp; Key Attendees (${event.delegationMembers?.length || event.attendeesCount || 0} Persons)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 30%;">Delegate Name</th>
              <th style="width: 20%;">Organization</th>
              <th style="width: 20%;">Department</th>
              <th style="width: 15%;">Role</th>
              <th style="width: 10%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${delegatesHtml || '<tr><td colspan="6" style="text-align: center; color: #64748b;">No formal delegation members logged</td></tr>'}
          </tbody>
        </table>

        <!-- 4. Schedule & Itinerary -->
        <div class="section-title">4. Agenda Timeline &amp; Activity Itinerary (${event.itinerary?.length || 0} Steps)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 15%;">Time Slot</th>
              <th style="width: 45%;">Activity / Agenda Topic</th>
              <th style="width: 20%;">Location</th>
              <th style="width: 15%;">Facilitator</th>
            </tr>
          </thead>
          <tbody>
            ${itineraryHtml || '<tr><td colspan="5" style="text-align: center; color: #64748b;">No detailed schedule itinerary items recorded</td></tr>'}
          </tbody>
        </table>

        <!-- 5. Readiness Checklist -->
        <div class="section-title">5. Event Readiness &amp; Protocol Checklist (${event.preparationChecklist?.length || 0} Items)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 50%;">Preparation Task</th>
              <th style="width: 20%;">Responsible Person</th>
              <th style="width: 13%; text-align: center;">Due Date</th>
              <th style="width: 12%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${checklistHtml || '<tr><td colspan="5" style="text-align: center; color: #64748b;">No readiness checklist items attached</td></tr>'}
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="sign-block">
          <div class="sign-box">
            <div class="sign-title">Protocol Coordinator</div>
            <div class="sign-sub">${event.leadOrganizer}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Operations / Plant Head</div>
            <div class="sign-sub">Operational Clearance</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Compliance Director</div>
            <div class="sign-sub">Executive Quality Sign-off</div>
          </div>
        </div>

        <div class="footer-strip">
          <div>Doc Code: <strong>${docCode}</strong> • Ref: ${event.eventCode}</div>
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
 * Export Individual Event Excel (.xls)
 */
export function exportSingleEventExcel(event: FactoryEventItem): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.factoryEventDossier || 'EVT-SPEC'}`;
  const fileName = `Event_${event.eventCode}_${new Date().toISOString().slice(0, 10)}.xls`;

  const delegatesRows = (event.delegationMembers || [])
    .map(
      (d, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${d.name}</td>
          <td>${d.organization}</td>
          <td>${d.department || ''}</td>
          <td>${d.role}</td>
          <td>${d.confirmed ? 'Confirmed' : 'Invited'}</td>
        </tr>
      `
    )
    .join('');

  const itineraryRows = (event.itinerary || [])
    .map(
      (it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${it.timeSlot}</td>
          <td>${it.activity}</td>
          <td>${it.location}</td>
          <td>${it.facilitator}</td>
        </tr>
      `
    )
    .join('');

  const checklistRows = (event.preparationChecklist || [])
    .map(
      (chk, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${chk.task}</td>
          <td>${chk.responsiblePerson}</td>
          <td>${chk.dueDate}</td>
          <td>${chk.completed ? 'COMPLETED' : 'PENDING'}</td>
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
                <x:Name>Event Dossier</x:Name>
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
            <td colspan="6" style="font-size: 15pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="6" style="font-size: 12pt; font-weight: bold;">
              OFFICIAL FACTORY EVENT, DELEGATION &amp; VISIT DOSSIER
            </td>
          </tr>
          <tr>
            <td colspan="6" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Event Code: ${event.eventCode} | Date: ${event.eventDate}
            </td>
          </tr>
          <tr><td colspan="6"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="6" style="text-align: left; color: #0f172a;">1. GENERAL DETAILS</th></tr>
          <tr><td><strong>Event Code:</strong></td><td>${event.eventCode}</td><td><strong>Date:</strong></td><td>${event.eventDate} ${event.timeSlot || ''}</td><td><strong>Status:</strong></td><td>${event.status}</td></tr>
          <tr><td><strong>Title:</strong></td><td colspan="5">${event.title}</td></tr>
          <tr><td><strong>Type:</strong></td><td>${event.type ? String(event.type).replace(/_/g, ' ') : 'EVENT'}</td><td><strong>Location:</strong></td><td>${event.location}</td><td><strong>Organizer:</strong></td><td>${event.leadOrganizer}</td></tr>
          <tr><td><strong>Buyer:</strong></td><td>${event.buyerName || 'Internal'}</td><td><strong>Readiness:</strong></td><td>${event.readinessPercentage || 0}%</td><td><strong>Priority:</strong></td><td>${event.priority || 'MEDIUM'}</td></tr>
          <tr><td colspan="6"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="6" style="text-align: left; color: #0f172a;">2. DELEGATION MEMBERS</th></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>Name</th>
            <th>Organization</th>
            <th>Department</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
          ${delegatesRows}
          <tr><td colspan="6"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="6" style="text-align: left; color: #0f172a;">3. ITINERARY SCHEDULE</th></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>Time Slot</th>
            <th colspan="2">Activity</th>
            <th>Location</th>
            <th>Facilitator</th>
          </tr>
          ${itineraryRows}
          <tr><td colspan="6"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="6" style="text-align: left; color: #0f172a;">4. READINESS CHECKLIST</th></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th colspan="2">Task</th>
            <th>Responsible</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
          ${checklistRows}
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
