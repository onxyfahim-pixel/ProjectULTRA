import { AnnualTrainingScheduleItem } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  renderPdfFooterSignaturesHtml,
  PdfSignatureMode,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

export interface TrainingCalendarExportOptions {
  exportType?: 'combined' | 'calendar_only' | 'matrix_only' | 'agenda_only';
  selectedMonth?: number; // 0 = all year, 1..12
  selectedSection?: string; // 'ALL' or section key
  year?: number;
  includeMarkings?: boolean;
  includeMatrix?: boolean;
  includeAgenda?: boolean;
  includeSignatures?: boolean;
  signatureMode?: PdfSignatureMode;
}

const MONTH_NAMES = [
  'Full Year (12M)',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SECTIONS_CONFIG: { key: string; label: string; color: string; bg: string; text: string }[] = [
  { key: 'CUTTING_SECTION', label: 'Cutting Division', color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  { key: 'SEWING_SECTION', label: 'Sewing Production', color: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  { key: 'FINISHING_PACKING', label: 'Finishing & Packing', color: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6' },
  { key: 'FABRIC_LAB', label: 'Fabric Warehouse & Lab', color: '#0d9488', bg: '#ccfbf1', text: '#115e59' },
  { key: 'QUALITY_ASSURANCE', label: 'Quality Assurance', color: '#10b981', bg: '#d1fae5', text: '#065f46' },
  { key: 'MAINTENANCE_SAFETY', label: 'Maintenance & Safety', color: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
];

/**
 * Filter schedule items based on export options
 */
export function filterScheduleForExport(
  items: AnnualTrainingScheduleItem[],
  options?: TrainingCalendarExportOptions
): AnnualTrainingScheduleItem[] {
  const month = options?.selectedMonth ?? 0;
  const section = options?.selectedSection ?? 'ALL';

  return items.filter((item) => {
    const matchesMonth = month === 0 || item.monthIndex === month;
    const matchesSection = section === 'ALL' || item.section === section;
    return matchesMonth && matchesSection;
  });
}

/**
 * Export Visual Training Calendar with Matrix, Date Markings & Session Agenda to PDF
 */
export function exportTrainingCalendarPdf(
  allScheduleItems: AnnualTrainingScheduleItem[],
  options?: TrainingCalendarExportOptions
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const exportType = options?.exportType || 'combined';
  const selectedMonth = options?.selectedMonth ?? 0;
  const selectedSection = options?.selectedSection ?? 'ALL';
  const year = options?.year || 2026;
  const signatureMode = options?.signatureMode || 'quad';

  const filteredItems = filterScheduleForExport(allScheduleItems, options);

  // Compute stats
  const totalSessions = filteredItems.length;
  const completedCount = filteredItems.filter((i) => i.status === 'COMPLETED').length;
  const upcomingCount = filteredItems.filter((i) => i.status === 'UPCOMING').length;
  const scheduledCount = filteredItems.filter((i) => i.status === 'SCHEDULED').length;
  const totalSeats = filteredItems.reduce((acc, i) => acc + (i.targetSeats || 0), 0);

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(
    pdfSettings,
    'training_calendar',
    exportType === 'calendar_only' ? 'single' : 'register'
  );

  const monthLabel = selectedMonth > 0 ? MONTH_NAMES[selectedMonth] : 'Full Year 12-Month Schedule';
  const sectionLabel =
    selectedSection !== 'ALL'
      ? (SECTIONS_CONFIG.find((s) => s.key === selectedSection)?.label || selectedSection)
      : 'All Factory Divisions';

  const customModuleConfig = pdfSettings.moduleWiseConfigs?.['training_calendar'];
  const docTitle =
    (exportType === 'calendar_only' ? customModuleConfig?.singleTitle : customModuleConfig?.registerTitle) ||
    (exportType === 'matrix_only'
      ? `12-Month Section Training Matrix - ${year}`
      : exportType === 'calendar_only'
      ? `Visual Training Calendar & Markings - ${monthLabel} ${year}`
      : `Master Annual Training Calendar & Section Matrix - ${year}`);

  const docCode =
    config.docCode !== 'TRN-CAL' && config.docCode !== 'TRN-MON'
      ? `${config.fullDocCode}-${year}${selectedMonth > 0 ? `-M${String(selectedMonth).padStart(2, '0')}` : ''}`
      : `ULTRA-QA-TRN-CAL-${year}${selectedMonth > 0 ? `-M${String(selectedMonth).padStart(2, '0')}` : ''}`;

  const departmentName = config.department || `Factory Quality Training Division • ${sectionLabel}`;

  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    docTitle,
    docCode,
    new Date().toISOString().split('T')[0],
    departmentName
  );

  const footerSignaturesHtml = renderPdfFooterSignaturesHtml(pdfSettings, {
    moduleKey: 'training_calendar',
    signatureMode: signatureMode,
    slot1Override: { title: 'PREPARED BY', designation: 'Training Coordinator / Executive' },
    slot2Override: { title: 'CHECKED & VERIFIED', designation: 'Head of Quality Assurance (QA)' },
    slot4Override: { title: 'ENDORSED BY', designation: 'HR & Compliance General Manager' },
    slot6Override: { title: 'APPROVED BY', designation: 'Executive Director / Factory GM' },
  });

  // Helper for Status Badge
  const getStatusBadgeHtml = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return `<span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 700; background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;">✓ COMPLETED</span>`;
      case 'UPCOMING':
        return `<span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 700; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">★ UPCOMING</span>`;
      case 'SCHEDULED':
      default:
        return `<span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fde68a;">⏳ SCHEDULED</span>`;
    }
  };

  // 1. RENDER MONTHLY VISUAL CALENDAR GRIDS WITH MARKINGS
  const renderMonthVisualCalendarGrid = (mIndex: number) => {
    const mName = MONTH_NAMES[mIndex];
    const monthItems = allScheduleItems.filter(
      (item) => item.monthIndex === mIndex && (selectedSection === 'ALL' || item.section === selectedSection)
    );

    // Days in month & Start Day of week (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDayOfWeek = new Date(year, mIndex - 1, 1).getDay();
    const daysInMonth = new Date(year, mIndex, 0).getDate();

    // Map sessions by day of month (e.g. 1..31)
    const daySessionsMap: Record<number, AnnualTrainingScheduleItem[]> = {};
    monthItems.forEach((item) => {
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (!daySessionsMap[d]) daySessionsMap[d] = [];
        daySessionsMap[d].push(item);
      }
    });

    const dayHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Generate grid cells
    let cellsHtml = '';
    let dayCount = 1;
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      if (i < firstDayOfWeek || dayCount > daysInMonth) {
        // Blank cell outside month range
        cellsHtml += `<td style="background: #f8fafc; border: 1px solid #e2e8f0; height: 82px; vertical-align: top; padding: 4px; opacity: 0.5;"></td>`;
      } else {
        const currentDay = dayCount;
        const sessions = daySessionsMap[currentDay] || [];
        const hasSession = sessions.length > 0;

        let sessionContentHtml = '';
        if (hasSession) {
          sessionContentHtml = sessions
            .map((s) => {
              const secCfg = SECTIONS_CONFIG.find((sec) => sec.key === s.section) || {
                color: '#3b82f6',
                bg: '#eff6ff',
                text: '#1e40af',
              };
              const isDone = s.status === 'COMPLETED';
              const isUpcoming = s.status === 'UPCOMING';

              return `
              <div style="background: ${secCfg.bg}; border: 1px solid ${secCfg.color}40; border-left: 3px solid ${secCfg.color}; border-radius: 4px; padding: 3px 4px; margin-top: 3px; font-size: 8.5px; line-height: 1.25;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px;">
                  <strong style="color: ${secCfg.text}; font-family: monospace; font-size: 8px;">${s.courseCode}</strong>
                  <span style="font-size: 7.5px; font-weight: 700; color: ${isDone ? '#15803d' : isUpcoming ? '#0369a1' : '#b45309'};">
                    ${isDone ? '✓' : isUpcoming ? '★' : '⏳'} ${s.status}
                  </span>
                </div>
                <div style="font-weight: 700; color: #0f172a; font-size: 8.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s.topicTitle}">
                  ${s.topicTitle}
                </div>
                <div style="font-size: 7.5px; color: #475569; margin-top: 1px;">
                  🕒 ${s.timeSlot} • 📍 ${s.venue}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 7px; color: #64748b; margin-top: 1px;">
                  <span>👤 ${s.trainerName.split(' ')[0]}</span>
                  <span style="font-weight: 600; color: #0f172a;">${s.targetSeats} Seats</span>
                </div>
              </div>
            `;
            })
            .join('');
        }

        cellsHtml += `
          <td style="border: 1px solid #cbd5e1; height: 86px; vertical-align: top; padding: 4px; background: ${hasSession ? '#ffffff' : '#ffffff'}; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${hasSession ? '#e2e8f0' : 'transparent'}; padding-bottom: 2px;">
              <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: ${hasSession ? '#0284c7' : '#475569'}; background: ${hasSession ? '#e0f2fe' : 'transparent'}; padding: 1px 4px; border-radius: 4px;">
                ${currentDay}
              </span>
              ${hasSession ? `<span style="font-size: 7.5px; font-weight: 700; color: #0369a1;">${sessions.length} Session${sessions.length > 1 ? 's' : ''}</span>` : ''}
            </div>
            ${sessionContentHtml}
          </td>
        `;

        dayCount++;
      }

      // Close row every 7 days
      if ((i + 1) % 7 === 0 && i + 1 < totalCells) {
        cellsHtml += `</tr><tr>`;
      }
    }

    return `
      <div class="calendar-month-wrapper" style="margin-bottom: 24px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #ffffff; padding: 8px 14px; border-radius: 8px 8px 0 0;">
          <div style="font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
            📅 ${mName} ${year} - Training Schedule
          </div>
          <div style="font-size: 10px; font-family: monospace; color: #94a3b8;">
            ${monthItems.length} Sessions Planned • ${monthItems.reduce((acc, i) => acc + i.targetSeats, 0)} Seats
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
          <thead>
            <tr style="background: #f1f5f9;">
              ${dayHeaders
                .map(
                  (dh, dhi) => `
                <th style="border: 1px solid #cbd5e1; padding: 6px 2px; text-align: center; font-size: 9.5px; font-weight: 800; color: ${dhi === 0 || dhi === 6 ? '#be123c' : '#1e293b'}; width: 14.28%;">
                  ${dh}
                </th>
              `
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${cellsHtml}
            </tr>
          </tbody>
        </table>
      </div>
    `;
  };

  // Determine which months to render for the Visual Calendar
  let visualCalendarMonthsHtml = '';
  if (exportType === 'combined' || exportType === 'calendar_only') {
    if (selectedMonth > 0) {
      visualCalendarMonthsHtml = renderMonthVisualCalendarGrid(selectedMonth);
    } else {
      // Render months that have active sessions (or all 12)
      const monthsWithData = Array.from(new Set(filteredItems.map((i) => i.monthIndex))).sort((a, b) => a - b);
      const monthsToRender = monthsWithData.length > 0 ? monthsWithData : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      visualCalendarMonthsHtml = monthsToRender.map((mIdx) => renderMonthVisualCalendarGrid(mIdx)).join('');
    }
  }

  // 2. RENDER 12-MONTH SECTION-WISE TRAINING MATRIX TABLE
  let sectionMatrixHtml = '';
  if (exportType === 'combined' || exportType === 'matrix_only') {
    const matrixRows = SECTIONS_CONFIG.map((sec) => {
      const monthCells = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mIdx) => {
        const match = allScheduleItems.find((item) => item.section === sec.key && item.monthIndex === mIdx);
        if (!match) {
          return `<td style="border: 1px solid #e2e8f0; text-align: center; color: #cbd5e1; font-family: monospace; font-size: 10px; padding: 6px 2px;">—</td>`;
        }

        const isDone = match.status === 'COMPLETED';
        const isUpcoming = match.status === 'UPCOMING';
        const bg = isDone ? '#dcfce7' : isUpcoming ? '#e0f2fe' : '#fef3c7';
        const border = isDone ? '#86efac' : isUpcoming ? '#7dd3fc' : '#fde047';
        const textColor = isDone ? '#166534' : isUpcoming ? '#075985' : '#854d0e';

        return `
          <td style="border: 1px solid #cbd5e1; padding: 4px; vertical-align: top; background: #ffffff;">
            <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 4px; padding: 3px; font-size: 8px; line-height: 1.2;">
              <div style="font-weight: 800; font-family: monospace; color: ${textColor}; display: flex; justify-content: space-between;">
                <span>${match.dayOfWeek.slice(0, 3)} ${match.date.slice(8)}</span>
                <span>${match.durationHours}h</span>
              </div>
              <div style="font-weight: 700; color: #0f172a; margin-top: 1px; font-size: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${match.topicTitle}">
                ${match.topicTitle}
              </div>
              <div style="font-family: monospace; font-size: 7.5px; color: #475569; margin-top: 1px;">
                ${match.courseCode}
              </div>
              <div style="font-size: 7px; color: ${textColor}; font-weight: 700; margin-top: 1px;">
                ${match.status}
              </div>
            </div>
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: 800; color: #0f172a; background: #f8fafc; font-size: 10px; white-space: nowrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${sec.color};"></span>
              <span>${sec.label}</span>
            </div>
          </td>
          ${monthCells}
        </tr>
      `;
    }).join('');

    sectionMatrixHtml = `
      <div class="matrix-table-wrapper" style="margin-bottom: 24px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; color: #ffffff; padding: 8px 14px; border-radius: 8px 8px 0 0;">
          <div style="font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
            📊 12-Month Section-Wise Training Matrix (Full Year ${year})
          </div>
          <div style="font-size: 10px; font-family: monospace; color: #cbd5e1;">
            ISO 9001 Clause 7.2 Competency Plan • 6 Factory Divisions
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 9.5px; font-weight: 800; color: #0f172a; min-width: 140px;">
                Section / Division
              </th>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => `
                <th style="border: 1px solid #cbd5e1; padding: 6px 2px; text-align: center; font-size: 9px; font-weight: 800; color: #1e293b;">
                  ${MONTH_NAMES[m].slice(0, 3)}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${matrixRows}
          </tbody>
        </table>
      </div>
    `;
  }

  // 3. RENDER DETAILED DAY-OF-TRAINING SESSION AGENDA
  let agendaTableHtml = '';
  if (exportType === 'combined' || exportType === 'agenda_only') {
    const agendaRows = filteredItems.map((item, index) => {
      const secCfg = SECTIONS_CONFIG.find((sec) => sec.key === item.section);
      return `
        <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: center; font-family: monospace; font-weight: 700;">${index + 1}</td>
          <td style="border: 1px solid #e2e8f0; padding: 6px; font-family: monospace; font-weight: 700; color: #0284c7; white-space: nowrap;">
            ${item.date}<br/><span style="font-size: 8.5px; color: #64748b; font-weight: 600;">${item.dayOfWeek}</span>
          </td>
          <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 9px; white-space: nowrap;">
            <span style="display: inline-block; padding: 2px 5px; border-radius: 4px; background: ${secCfg?.bg || '#f1f5f9'}; color: ${secCfg?.text || '#334155'}; font-weight: 700;">
              ${item.sectionName}
            </span>
          </td>
          <td style="border: 1px solid #e2e8f0; padding: 6px; font-family: monospace; font-weight: 700; color: #475569; font-size: 9px;">
            ${item.courseCode}
          </td>
          <td style="border: 1px solid #e2e8f0; padding: 6px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 10px;">${item.topicTitle}</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
              Target: ${item.mandatoryFor}
            </div>
          </td>
          <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 9px; color: #1e293b;">
            <strong>${item.trainerName}</strong><br/>
            <span style="font-size: 8px; color: #64748b;">${item.venue} • ${item.durationHours}h (${item.timeSlot})</span>
          </td>
          <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: center; font-family: monospace; font-weight: 800; color: #0f172a;">
            ${item.targetSeats}
          </td>
          <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: center;">
            ${getStatusBadgeHtml(item.status)}
          </td>
        </tr>
      `;
    }).join('');

    agendaTableHtml = `
      <div class="agenda-table-wrapper" style="margin-bottom: 24px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: #334155; color: #ffffff; padding: 8px 14px; border-radius: 8px 8px 0 0;">
          <div style="font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
            📋 Master Session Agenda &amp; Compliance Log (${totalSessions} Scheduled Sessions)
          </div>
          <div style="font-size: 10px; font-family: monospace; color: #cbd5e1;">
            Total Target Trainee Seats: ${totalSeats}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
          <thead>
            <tr style="background: #f1f5f9; color: #0f172a;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 32px;">#</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; width: 85px;">Date &amp; Day</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; width: 110px;">Section</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; width: 80px;">Code</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Training Program / Curriculum</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; width: 170px;">Trainer &amp; Venue</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 50px;">Seats</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 85px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${agendaRows}
          </tbody>
        </table>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle} - ${docCode}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 8mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #ffffff;
            font-size: 10px;
          }
          .kpi-strip {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin: 10px 0 16px 0;
          }
          .kpi-card {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 10px;
            background: #f8fafc;
            text-align: center;
          }
          .kpi-val {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            font-family: monospace;
          }
          .kpi-label {
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
            margin-top: 2px;
          }
          .legend-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 6px 12px;
            margin-bottom: 14px;
            font-size: 8.5px;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: 600;
            color: #334155;
          }
          .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .calendar-month-wrapper { page-break-inside: avoid; }
            .matrix-table-wrapper { page-break-inside: avoid; }
            .agenda-table-wrapper { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <!-- EXECUTIVE KPI STRIP -->
        <div class="kpi-strip">
          <div class="kpi-card">
            <div class="kpi-val">${totalSessions}</div>
            <div class="kpi-label">Total Planned Sessions</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #15803d;">${completedCount} Done</div>
            <div class="kpi-label">Completed Sessions</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #0284c7;">${upcomingCount} Upcoming</div>
            <div class="kpi-label">Q4 Target Pipeline</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #b45309;">${scheduledCount} Scheduled</div>
            <div class="kpi-label">Active Bookings</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #6366f1;">${totalSeats} Seats</div>
            <div class="kpi-label">Target Trainee Capacity</div>
          </div>
        </div>

        <!-- SECTION & STATUS COLOR LEGEND -->
        <div class="legend-bar">
          <div style="font-weight: 800; color: #0f172a; text-transform: uppercase;">
            Division Markings:
          </div>
          ${SECTIONS_CONFIG.map(
            (sec) => `
            <div class="legend-item">
              <span class="legend-dot" style="background: ${sec.color};"></span>
              <span>${sec.label}</span>
            </div>
          `
          ).join('')}
          <div style="height: 12px; width: 1px; background: #cbd5e1;"></div>
          <div class="legend-item">
            <span style="color: #15803d; font-weight: 800;">✓ Done</span>
          </div>
          <div class="legend-item">
            <span style="color: #0284c7; font-weight: 800;">★ Upcoming</span>
          </div>
          <div class="legend-item">
            <span style="color: #b45309; font-weight: 800;">⏳ Scheduled</span>
          </div>
        </div>

        <!-- 1. VISUAL MONTHLY CALENDAR GRID WITH MARKINGS -->
        ${visualCalendarMonthsHtml}

        <!-- 2. 12-MONTH SECTION-WISE TRAINING MATRIX TABLE -->
        ${sectionMatrixHtml}

        <!-- 3. DAY-OF-TRAINING MASTER AGENDA TABLE -->
        ${agendaTableHtml}

        <!-- 4. OFFICIAL COMPLIANCE AUTHORIZATION SIGNATURES -->
        ${footerSignaturesHtml}

        <script>
          window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
              window.print();
            }, 600);
          });
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export Annual Training Schedule & Matrix to Excel (.xls HTML table)
 */
export function exportTrainingCalendarExcel(
  allScheduleItems: AnnualTrainingScheduleItem[],
  options?: TrainingCalendarExportOptions
): void {
  const filteredItems = filterScheduleForExport(allScheduleItems, options);
  const year = options?.year || 2026;

  // Build matrix rows
  const matrixRowsHtml = SECTIONS_CONFIG.map((sec) => {
    const monthCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      .map((mIdx) => {
        const match = allScheduleItems.find((item) => item.section === sec.key && item.monthIndex === mIdx);
        if (!match) return `<td style="text-align: center; color: #94a3b8;">-</td>`;
        return `
        <td style="background: ${match.status === 'COMPLETED' ? '#dcfce7' : match.status === 'UPCOMING' ? '#e0f2fe' : '#fef3c7'};">
          <b>${match.dayOfWeek} ${match.date}</b><br/>
          <span>${match.topicTitle}</span><br/>
          <small>${match.courseCode} • ${match.trainerName}</small><br/>
          <b>[${match.status}]</b>
        </td>
      `;
      })
      .join('');

    return `
      <tr>
        <td style="font-weight: bold; background: #f1f5f9;">${sec.label}</td>
        ${monthCols}
      </tr>
    `;
  }).join('');

  // Build agenda rows
  const agendaRowsHtml = filteredItems
    .map(
      (item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${item.date}</td>
      <td>${item.dayOfWeek}</td>
      <td>${item.month}</td>
      <td>${item.sectionName}</td>
      <td>${item.courseCode}</td>
      <td>${item.topicTitle}</td>
      <td>${item.trainerName}</td>
      <td>${item.venue}</td>
      <td>${item.timeSlot}</td>
      <td>${item.durationHours}</td>
      <td>${item.targetSeats}</td>
      <td>${item.status}</td>
      <td>${item.mandatoryFor}</td>
      <td>${item.notes || ''}</td>
    </tr>
  `
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Master Calendar Matrix</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheet>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          th { background-color: #0f172a; color: #ffffff; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 6px; }
          .title { font-size: 16pt; font-weight: bold; color: #0284c7; }
        </style>
      </head>
      <body>
        <div class="title">FACTORY ANNUAL MASTER TRAINING CALENDAR & SECTION MATRIX - ${year}</div>
        <p>Document: ULTRA-QA-TRN-CAL-${year} | Generated: ${new Date().toISOString()}</p>
        <br/>
        <h3>1. 12-MONTH SECTION-WISE TRAINING MATRIX</h3>
        <table>
          <thead>
            <tr>
              <th>Section / Division</th>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => `<th>${MONTH_NAMES[m]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${matrixRowsHtml}
          </tbody>
        </table>

        <br/><br/>
        <h3>2. MASTER SESSION AGENDA & MARKINGS REGISTER</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Day</th>
              <th>Month</th>
              <th>Section</th>
              <th>Course Code</th>
              <th>Training Program Title</th>
              <th>Lead Trainer</th>
              <th>Venue</th>
              <th>Time Slot</th>
              <th>Duration (Hours)</th>
              <th>Target Capacity (Seats)</th>
              <th>Status</th>
              <th>Target Audience</th>
              <th>Notes / Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${agendaRowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Master_Training_Calendar_Matrix_${year}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Download Calendar Schedule CSV
 */
export function exportTrainingCalendarCsv(
  allScheduleItems: AnnualTrainingScheduleItem[],
  options?: TrainingCalendarExportOptions
): void {
  const filtered = filterScheduleForExport(allScheduleItems, options);
  const headers = [
    'Schedule Code',
    'Date',
    'Day of Week',
    'Month',
    'Section Name',
    'Course Code',
    'Topic Title',
    'Trainer Name',
    'Venue',
    'Time Slot',
    'Duration Hours',
    'Target Seats',
    'Status',
    'Mandatory For',
    'Notes',
  ];

  const rows = filtered.map((i) => [
    i.scheduleCode,
    i.date,
    i.dayOfWeek,
    i.month,
    i.sectionName,
    i.courseCode,
    i.topicTitle,
    i.trainerName,
    i.venue,
    i.timeSlot,
    i.durationHours,
    i.targetSeats,
    i.status,
    i.mandatoryFor,
    i.notes || '',
  ]);

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
  link.setAttribute('download', `Training_Calendar_Schedule_${options?.year || 2026}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
