import { TrainingMatrixItem } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Training module
 */
export function computeTrainingKpis(courses: TrainingMatrixItem[]) {
  const totalCourses = courses.length;
  const totalTrained = courses.reduce((acc, c) => acc + (c.trainedCount || 0), 0);
  const passRates = courses.map((c) => c.passRatePercent || 0).filter((r) => r > 0);
  const avgPassRate = passRates.length > 0 ? Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length) : 0;
  const scheduledCount = courses.filter((c) => c.status === 'SCHEDULED' || c.status === 'IN_PROGRESS').length;
  const completedCount = courses.filter((c) => c.status === 'COMPLETED').length;
  const departments = new Set(courses.map((c) => c.department).filter(Boolean)).size;

  return {
    totalCourses,
    totalTrained,
    avgPassRate,
    scheduledCount,
    completedCount,
    departments,
  };
}

/**
 * Download Training CSV
 */
export function downloadTrainingCsv(
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
 * Export Global Training Matrix PDF
 */
export function exportTrainingMatrixPdf(
  courses: TrainingMatrixItem[],
  scopeLabel: string = 'All Training Programs'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const kpis = computeTrainingKpis(courses);
  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'training', 'register');
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#15803d';
      case 'SCHEDULED':
        return '#0284c7';
      case 'IN_PROGRESS':
        return '#b45309';
      case 'POSTPONED':
      case 'CANCELLED':
        return '#be123c';
      default:
        return '#475569';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#dcfce7';
      case 'SCHEDULED':
        return '#e0f2fe';
      case 'IN_PROGRESS':
        return '#fef3c7';
      case 'POSTPONED':
      case 'CANCELLED':
        return '#ffe4e6';
      default:
        return '#f1f5f9';
    }
  };

  const rowsHtml = courses
    .map(
      (c, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="font-family: monospace; font-weight: 700; color: #1e293b; text-align: center;">${i + 1}</td>
        <td style="font-family: monospace; font-weight: 700; color: #0284c7;">${c.courseCode}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${c.title}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
            ${c.department ? `${c.department} • ` : ''}${c.category ? c.category.replace(/_/g, ' ') : ''}
          </div>
        </td>
        <td style="font-size: 10px; color: #334155;">${c.targetAudience}</td>
        <td style="font-size: 10px; font-weight: 600; color: #1e293b;">${c.trainerName}</td>
        <td style="font-size: 9.5px; color: #475569; text-transform: uppercase;">${c.frequency || 'ANNUAL'}</td>
        <td style="text-align: center; font-weight: 700; font-family: monospace; color: #0f172a;">${c.trainedCount || 0}</td>
        <td style="text-align: center; font-weight: 800; font-family: monospace; color: ${(c.passRatePercent || 0) >= 80 ? '#15803d' : '#be123c'};">
          ${c.passRatePercent || 0}%
        </td>
        <td style="font-family: monospace; font-size: 10px; color: #334155;">${c.nextScheduledDate || 'N/A'}</td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9.5px; font-weight: 700; color: ${getStatusColor(c.status)}; background-color: ${getStatusBg(c.status)};">
            ${c.status.replace(/_/g, ' ')}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Training Matrix Register - ${docCode}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
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
            font-size: 10.5px;
          }
          .kpi-strip {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin: 12px 0 16px 0;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 10px;
            background: #f8fafc;
            text-align: center;
          }
          .kpi-val {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .kpi-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
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
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 7px 8px;
            border: 1px solid #0f172a;
            text-align: left;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          .signatures {
            margin-top: 26px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            page-break-inside: avoid;
          }
          .sign-box {
            border-top: 1px dashed #64748b;
            padding-top: 6px;
            text-align: center;
          }
          .sign-title {
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
          }
          .sign-sub {
            font-size: 8.5px;
            color: #64748b;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <div class="kpi-strip">
          <div class="kpi-card">
            <div class="kpi-val">${kpis.totalCourses}</div>
            <div class="kpi-label">Courses Matrix</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #0284c7;">
            <div class="kpi-val" style="color: #0284c7;">${kpis.totalTrained}</div>
            <div class="kpi-label">Total Trained</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #15803d;">
            <div class="kpi-val" style="color: #15803d;">${kpis.avgPassRate}%</div>
            <div class="kpi-label">Avg Pass Rate</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid #b45309;">
            <div class="kpi-val" style="color: #b45309;">${kpis.scheduledCount}</div>
            <div class="kpi-label">Upcoming Sched.</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #059669;">${kpis.completedCount}</div>
            <div class="kpi-label">Completed Sessions</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${kpis.departments}</div>
            <div class="kpi-label">Depts Covered</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 28px; text-align: center;">#</th>
              <th style="width: 80px;">Course Code</th>
              <th>Course Title & Scope</th>
              <th style="width: 130px;">Target Audience</th>
              <th style="width: 110px;">Trainer / Lead</th>
              <th style="width: 75px;">Frequency</th>
              <th style="width: 65px; text-align: center;">Trained</th>
              <th style="width: 70px; text-align: center;">Pass %</th>
              <th style="width: 90px;">Next Date</th>
              <th style="width: 85px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-title">Prepared By</div>
            <div class="sign-sub">Training Coordinator / HR Officer</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Reviewed By</div>
            <div class="sign-sub">Quality Assurance Manager</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Approved By</div>
            <div class="sign-sub">General Manager / Operations Head</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Social & Technical Auditor</div>
            <div class="sign-sub">Buyer / WRAP Compliance Inspector</div>
          </div>
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
 * Export Training Matrix Excel (.xls)
 */
export function exportTrainingMatrixExcel(
  courses: TrainingMatrixItem[],
  scopeLabel: string = 'All Courses'
): void {
  const kpis = computeTrainingKpis(courses);
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.trainingMatrix || 'TRN-MAT'}`;
  const fileName = `Training_Matrix_Register_${new Date().toISOString().slice(0, 10)}.xls`;

  const rows = courses
    .map(
      (c, i) => `
    <tr>
      <td style="text-align: center;">${i + 1}</td>
      <td style="font-weight: bold; font-family: monospace; color: #0369a1;">${c.courseCode}</td>
      <td style="font-weight: bold;">${c.title}</td>
      <td>${c.category || ''}</td>
      <td>${c.department || ''}</td>
      <td>${c.targetAudience}</td>
      <td>${c.trainerName}</td>
      <td>${c.frequency}</td>
      <td style="text-align: center; font-weight: bold;">${c.trainedCount || 0}</td>
      <td style="text-align: center; font-weight: bold; ${
        (c.passRatePercent || 0) >= 80 ? 'color: #15803d;' : 'color: #be123c;'
      }">${c.passRatePercent || 0}%</td>
      <td>${c.nextScheduledDate || ''}</td>
      <td>${c.venue || ''}</td>
      <td>${c.durationHours || 0} hrs</td>
      <td>${c.isoClause || 'ISO 9001:2015 Clause 7.2'}</td>
      <td style="font-weight: bold; text-align: center;">${c.status}</td>
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
                <x:Name>Training Matrix</x:Name>
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
            <td colspan="15" style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="15" style="font-size: 12pt; font-weight: bold;">
              ENTERPRISE TRAINING MATRIX & WORKFORCE COMPETENCY REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="15" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Scope: ${scopeLabel} | Total Programs: ${kpis.totalCourses} | Total Trained: ${kpis.totalTrained} | Avg Pass Rate: ${kpis.avgPassRate}% | Date: ${new Date().toISOString().slice(0, 10)}
            </td>
          </tr>
          <tr><td colspan="15"></td></tr>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>#</th>
            <th>Course Code</th>
            <th>Course Title</th>
            <th>Category</th>
            <th>Department</th>
            <th>Target Audience</th>
            <th>Trainer</th>
            <th>Frequency</th>
            <th>Trained Personnel</th>
            <th>Pass Rate %</th>
            <th>Next Scheduled Date</th>
            <th>Venue</th>
            <th>Duration</th>
            <th>ISO Standard Clause</th>
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
 * Export Individual Training Program Dossier PDF
 */
export function exportSingleTrainingPdf(course: TrainingMatrixItem): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF exports.');
    return;
  }

  const pdfSettings = loadPdfHeaderSettings();
  const config = getModuleExportConfig(pdfSettings, 'training', 'single', course.courseCode);
  const dynamicHeaderHtml = renderPdfHeaderHtml(
    pdfSettings,
    config.title,
    config.fullDocCode,
    new Date().toISOString().split('T')[0],
    config.department
  );

  const docCode = config.fullDocCode;

  const syllabusList = (course.syllabusTopics || [
    'Introduction to Quality Management System (QMS) requirements',
    'Standard operating procedures, critical inspection points, and defect tolerance thresholds',
    'Practical hands-on evaluation, specimen review, and machine adjustments',
    'Post-training evaluation, examination paper, and corrective feedback cycle',
  ])
    .map(
      (topic, idx) => `
      <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 10.5px;">
        <span style="font-weight: 700; color: #0284c7; font-family: monospace;">Topic 0${idx + 1}:</span>
        <span style="color: #334155;">${topic}</span>
      </div>
    `
    )
    .join('');

  const attendeesRows = (course.attendees || [])
    .slice(0, 15)
    .map(
      (att, idx) => `
      <tr>
        <td style="font-family: monospace; text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: 700;">${att.employeeId || `EMP-${1000 + idx}`}</td>
        <td style="font-weight: 700;">${att.name}</td>
        <td>${att.department || course.department || 'Production'}</td>
        <td>${att.designation || 'Operator / Inspector'}</td>
        <td style="text-align: center; font-weight: 800; font-family: monospace; color: ${(att.finalScore || att.postTestScore || 85) >= 80 ? '#15803d' : '#be123c'};">${att.finalScore || att.postTestScore ? `${att.finalScore || att.postTestScore}%` : 'PASS'}</td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: #dcfce7; color: #166534;">
            ${att.result || (att.attendanceStatus === 'PRESENT' ? 'CERTIFIED' : att.attendanceStatus)}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Training Dossier - ${course.courseCode}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 12mm;
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
            font-size: 11px;
          }
          .hero-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #e2e8f0;
            border-left: 6px solid #0284c7;
            border-radius: 8px;
            padding: 12px 16px;
            background: #f8fafc;
            margin-top: 14px;
            margin-bottom: 16px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #ffffff;
            background: #0284c7;
          }
          .section-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 4px;
            margin-top: 16px;
            margin-bottom: 10px;
          }
          .data-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .data-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
          }
          .data-label {
            font-weight: 700;
            color: #475569;
            font-size: 10.5px;
          }
          .data-value {
            font-weight: 600;
            color: #0f172a;
            font-size: 10.5px;
          }
          .card-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 10px;
            background: #f8fafc;
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
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 6px 8px;
            border: 1px solid #0f172a;
            text-align: left;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          .signatures {
            margin-top: 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            page-break-inside: avoid;
          }
          .sign-box {
            border-top: 1px dashed #64748b;
            padding-top: 6px;
            text-align: center;
          }
          .sign-title {
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
          }
          .sign-sub {
            font-size: 8.5px;
            color: #64748b;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <div class="hero-box">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">
              Official Competency Training Record • Doc Code: ${docCode}
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace;">
              ${course.courseCode} - ${course.title}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              Department: <strong>${course.department || 'Quality Assurance'}</strong> • Target: <strong>${course.targetAudience}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="status-badge">${course.status.replace(/_/g, ' ')}</div>
            <div style="font-size: 10.5px; color: #64748b; margin-top: 4px; font-weight: 600;">
              Next Session: <strong style="color: #0f172a;">${course.nextScheduledDate || 'TBD'}</strong>
            </div>
          </div>
        </div>

        <div class="section-title">1. Course Specifications & Parameters</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Course Code:</span>
            <span class="data-value" style="font-family: monospace; font-weight: 700; color: #0284c7;">${course.courseCode}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Program Category:</span>
            <span class="data-value">${course.category ? course.category.replace(/_/g, ' ') : 'Technical QMS'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Lead Trainer / Instructor:</span>
            <span class="data-value" style="font-weight: 700;">${course.trainerName}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Training Frequency:</span>
            <span class="data-value" style="text-transform: uppercase;">${course.frequency || 'Annual'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Duration & Time Allocation:</span>
            <span class="data-value">${course.durationHours || 4} Hours</span>
          </div>
          <div class="data-item">
            <span class="data-label">Training Venue / Facility:</span>
            <span class="data-value">${course.venue || 'Main QA Training Hall & Demo Line'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Total Trained Candidates:</span>
            <span class="data-value" style="font-weight: 700;">${course.trainedCount || 0} Employees</span>
          </div>
          <div class="data-item">
            <span class="data-label">Historical Pass Rate:</span>
            <span class="data-value" style="font-weight: 800; color: ${(course.passRatePercent || 0) >= 80 ? '#15803d' : '#be123c'};">${course.passRatePercent || 0}%</span>
          </div>
          <div class="data-item">
            <span class="data-label">ISO Standard Compliance Clause:</span>
            <span class="data-value">${course.isoClause || 'ISO 9001:2015 Clause 7.2'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Evaluation Exam Paper Code:</span>
            <span class="data-value" style="font-family: monospace;">${course.examCode || 'EXAM-QMS-STD'}</span>
          </div>
        </div>

        <div class="section-title">2. Curriculum Syllabus & Learning Modules</div>
        <div class="card-box" style="border-left: 4px solid #0284c7;">
          ${syllabusList}
        </div>

        <div class="section-title">3. Sample Candidate Attendance & Competency Evaluation (Recent Cohort)</div>
        ${
          course.attendees && course.attendees.length > 0
            ? `
          <table>
            <thead>
              <tr>
                <th style="width: 28px; text-align: center;">#</th>
                <th style="width: 85px;">Employee ID</th>
                <th>Employee Name</th>
                <th style="width: 100px;">Department</th>
                <th style="width: 110px;">Designation</th>
                <th style="width: 65px; text-align: center;">Score</th>
                <th style="width: 80px; text-align: center;">Result</th>
              </tr>
            </thead>
            <tbody>
              ${attendeesRows}
            </tbody>
          </table>
        `
            : `
          <div class="card-box" style="text-align: center; color: #64748b; font-style: italic;">
            Active curriculum scheduled for execution. Complete trainee roster recorded in QMS database.
          </div>
        `
        }

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-title">Lead Instructor</div>
            <div class="sign-sub">Curriculum Delivery</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Head of HR & Training</div>
            <div class="sign-sub">Competency Endorsement</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Quality Assurance Manager</div>
            <div class="sign-sub">Operational Sign-off</div>
          </div>
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
 * Export Individual Training Program Excel (.xls)
 */
export function exportSingleTrainingExcel(course: TrainingMatrixItem): void {
  const pdfSettings = loadPdfHeaderSettings();
  const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.trainingCurriculum || 'TRN-CURR'}`;
  const fileName = `Training_Curriculum_${course.courseCode}_${new Date().toISOString().slice(0, 10)}.xls`;

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Course Dossier</x:Name>
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
            <td colspan="4" style="font-size: 15pt; font-weight: bold; color: #1e3a8a;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 12pt; font-weight: bold;">
              TRAINING PROGRAM DOSSIER & CURRICULUM SPECIFICATION
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 9pt; color: #64748b;">
              Doc Code: ${docCode} | Course Code: ${course.courseCode} | Date: ${new Date().toISOString().slice(0, 10)}
            </td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9;"><th colspan="4" style="text-align: left; color: #0f172a;">1. COURSE IDENTIFICATION</th></tr>
          <tr><td><strong>Course Code:</strong></td><td>${course.courseCode}</td><td><strong>Title:</strong></td><td>${course.title}</td></tr>
          <tr><td><strong>Category:</strong></td><td>${course.category || 'Technical QMS'}</td><td><strong>Department:</strong></td><td>${course.department || ''}</td></tr>
          <tr><td><strong>Trainer Name:</strong></td><td>${course.trainerName}</td><td><strong>Frequency:</strong></td><td>${course.frequency}</td></tr>
          <tr><td><strong>Target Audience:</strong></td><td>${course.targetAudience}</td><td><strong>Venue:</strong></td><td>${course.venue || ''}</td></tr>
          <tr><td><strong>Duration:</strong></td><td>${course.durationHours || 4} Hours</td><td><strong>Next Date:</strong></td><td>${course.nextScheduledDate || ''}</td></tr>
          <tr><td><strong>Trained Count:</strong></td><td>${course.trainedCount || 0}</td><td><strong>Pass Rate %:</strong></td><td>${course.passRatePercent || 0}%</td></tr>
          <tr><td><strong>ISO Standard Clause:</strong></td><td>${course.isoClause || 'ISO 9001:2015 Clause 7.2'}</td><td><strong>Status:</strong></td><td>${course.status}</td></tr>
          <tr><td><strong>Notes / Remarks:</strong></td><td colspan="3">${course.notes || ''}</td></tr>
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
