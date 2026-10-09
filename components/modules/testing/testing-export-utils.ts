import { LabTestRecord } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Lab Testing module
 */
export function computeTestingKpis(tests: LabTestRecord[]) {
  const total = tests.length;
  const passed = tests.filter((t) => t.verdict === 'PASS').length;
  const failed = tests.filter((t) => t.verdict === 'FAIL').length;
  const pending = tests.filter((t) => t.verdict === 'PENDING').length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const uniqueStandardsCount = new Set(tests.map((t) => t.testStandard).filter(Boolean)).size;
  const uniqueStylesCount = new Set(tests.map((t) => t.styleNumber).filter(Boolean)).size;

  return {
    total,
    passed,
    failed,
    pending,
    passRate,
    uniqueStandardsCount,
    uniqueStylesCount,
  };
}

/**
 * Helper to download CSV
 */
export function downloadTestingCsv(
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
 * Export official printable / PDF Lab Testing master register
 */
export function exportTestingSummaryPdf(
  tests: LabTestRecord[],
  scopeLabel: string = 'All Lab Test Records'
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF report.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'testing', 'register');
    const kpis = computeTestingKpis(tests);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      new Date().toISOString().split('T')[0],
      config.department
    );

    const docCode = config.fullDocCode;

    const rowsHtml = tests
      .map(
        (t, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 7px 8px; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
          <td style="padding: 7px 8px; font-weight: 700; color: #1e3a8a; font-family: monospace;">${t.testReportNo}</td>
          <td style="padding: 7px 8px; font-weight: 600; color: #0f172a;">
            ${t.styleNumber}
            ${t.buyerName ? `<div style="font-size: 9px; color: #64748b; font-weight: normal;">Buyer: ${t.buyerName}</div>` : ''}
          </td>
          <td style="padding: 7px 8px; color: #334155; font-family: monospace; font-size: 10px;">${t.fabricBatch || 'N/A'}</td>
          <td style="padding: 7px 8px; font-weight: 600; color: #0284c7;">
            ${String(t.testType).replace(/_/g, ' ')}
            <div style="font-size: 9px; color: #64748b; font-family: monospace;">${t.testStandard}</div>
          </td>
          <td style="padding: 7px 8px; font-size: 10px; color: #475569; font-family: monospace;">
            <div><span style="font-weight: 700; color: #64748b;">Req:</span> ${t.requirement}</div>
            <div><span style="font-weight: 700; color: #0f172a;">Act:</span> ${t.actualResult}</div>
          </td>
          <td style="padding: 7px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 9px; font-weight: 700; ${
              t.verdict === 'PASS'
                ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;'
                : t.verdict === 'FAIL'
                ? 'background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3;'
                : 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'
            }">
              ${t.verdict}
            </span>
          </td>
          <td style="padding: 7px 8px; font-size: 10px; color: #475569;">
            ${t.testedBy}
            <div style="font-size: 9px; color: #64748b;">${t.labName}</div>
          </td>
          <td style="padding: 7px 8px; font-size: 10px; color: #475569; text-align: right; font-family: monospace;">
            ${t.testDate}
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Laboratory Testing Master Register - ${docCode}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 16px;
            color: #0f172a;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .kpi-strip {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
            margin: 16px 0 20px 0;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 12px;
            text-align: center;
          }
          .kpi-val {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
          }
          .kpi-lbl {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
          }
          .sign-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 36px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .sign-box {
            text-align: center;
          }
          .sign-line {
            border-bottom: 1px dashed #94a3b8;
            height: 38px;
            margin-bottom: 6px;
          }
          .sign-title {
            font-size: 10px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
          }
          .sign-sub {
            font-size: 9px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 11px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          <div><strong>Filter / Scope:</strong> ${scopeLabel}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleString()} • Confidential Lab QMS Record</div>
        </div>

        <div class="kpi-strip">
          <div class="kpi-card">
            <div class="kpi-val" style="color: #1e3a8a;">${kpis.total}</div>
            <div class="kpi-lbl">Total Lab Tests</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #15803d;">${kpis.passed}</div>
            <div class="kpi-lbl">Passed (In Spec)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #be123c;">${kpis.failed}</div>
            <div class="kpi-lbl">Failed (Out of Spec)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #d97706;">${kpis.pending}</div>
            <div class="kpi-lbl">In Progress / Pending</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #0284c7;">${kpis.passRate}%</div>
            <div class="kpi-lbl">Compliance Pass Rate</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #7c3aed;">${kpis.uniqueStandardsCount}</div>
            <div class="kpi-lbl">ISO / ASTM Standards</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th style="width: 105px;">Report #</th>
              <th>Style & Buyer</th>
              <th style="width: 85px;">Fabric Batch</th>
              <th>Test Type & Standard</th>
              <th>Requirement vs Result</th>
              <th style="width: 80px; text-align: center;">Verdict</th>
              <th>Technician & Lab</th>
              <th style="width: 80px; text-align: right;">Test Date</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Lab Testing Technician</div>
            <div class="sign-sub">Physical & Chemical Testing Lab</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Senior QA Lab Chemist / Manager</div>
            <div class="sign-sub">Accredited ISO/IEC 17025 Lead</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Head of Quality Assurance</div>
            <div class="sign-sub">Factory Compliance & Technical Sign-off</div>
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
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export Lab Testing PDF:', err);
  }
}

/**
 * Export styled Excel (.xls) summary of Lab Testing register
 */
export function exportTestingSummaryExcel(
  tests: LabTestRecord[],
  fileName: string = 'Laboratory_Testing_Register'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.testingRegister || 'LAB-REG'}`;
    const kpis = computeTestingKpis(tests);

    const rowsHtml = tests
      .map(
        (t, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="font-weight: bold; border: 1px solid #cbd5e1; font-family: monospace;">${t.testReportNo}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold;">${t.styleNumber}</td>
          <td style="border: 1px solid #cbd5e1;">${t.buyerName || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${t.fabricBatch || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1;">${String(t.testType).replace(/_/g, ' ')}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${t.testStandard}</td>
          <td style="border: 1px solid #cbd5e1;">${t.requirement}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold;">${t.actualResult}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; ${
            t.verdict === 'PASS'
              ? 'background-color: #dcfce7; color: #15803d;'
              : t.verdict === 'FAIL'
              ? 'background-color: #ffe4e6; color: #be123c;'
              : 'background-color: #fef3c7; color: #b45309;'
          }">
            ${t.verdict}
          </td>
          <td style="border: 1px solid #cbd5e1;">${t.testedBy}</td>
          <td style="border: 1px solid #cbd5e1;">${t.labName}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${t.apparatusUsed || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${t.conditioningHours ? `${t.conditioningHours}h` : 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${t.temperatureCelsius ? `${t.temperatureCelsius}°C` : 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${t.humidityPercentage ? `${t.humidityPercentage}%` : 'N/A'}</td>
          <td style="text-align: right; border: 1px solid #cbd5e1;">${t.testDate}</td>
          <td style="border: 1px solid #cbd5e1;">${t.remarks || 'None'}</td>
          <td style="border: 1px solid #cbd5e1;">${t.correctiveAction || 'N/A'}</td>
        </tr>
      `
      )
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Lab Testing Register</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px;">
          <tr>
            <td colspan="19" style="font-size: 16px; font-weight: bold; color: #1e3a8a; padding: 10px 0;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'} - LABORATORY TESTING MASTER REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="19" style="font-size: 11px; color: #475569; padding-bottom: 10px;">
              Doc Code: ${docCode} | Exported: ${new Date().toLocaleString()} | Standards: ISO/IEC 17025 accredited laboratory
            </td>
          </tr>
          <tr>
            <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1;">Total Tests: ${kpis.total}</td>
            <td colspan="3" style="background-color: #dcfce7; font-weight: bold; border: 1px solid #cbd5e1; color: #15803d;">Passed: ${kpis.passed}</td>
            <td colspan="3" style="background-color: #ffe4e6; font-weight: bold; border: 1px solid #cbd5e1; color: #be123c;">Failed: ${kpis.failed}</td>
            <td colspan="3" style="background-color: #fef3c7; font-weight: bold; border: 1px solid #cbd5e1; color: #b45309;">Pending: ${kpis.pending}</td>
            <td colspan="4" style="background-color: #e0f2fe; font-weight: bold; border: 1px solid #cbd5e1; color: #0284c7;">Pass Rate: ${kpis.passRate}%</td>
            <td colspan="3" style="background-color: #f3e8ff; font-weight: bold; border: 1px solid #cbd5e1; color: #7c3aed;">ISO Methods: ${kpis.uniqueStandardsCount}</td>
          </tr>
          <tr><td colspan="19"></td></tr>
          <tr style="background-color: #1e3a8a; color: white; font-weight: bold; text-align: left;">
            <th style="border: 1px solid #0f172a; padding: 6px;">#</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Test Report No</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Style No</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Buyer</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Fabric Batch</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Test Type</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Test Standard</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Requirement</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Actual Result</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Verdict</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Tested By</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Lab Facility</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Apparatus</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Conditioning</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Temp (°C)</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Humidity (%)</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Test Date</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Remarks</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Corrective Action</th>
          </tr>
          ${rowsHtml}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    console.error('Failed to export Lab Testing Excel:', err);
  }
}

/**
 * Export official accredited Laboratory Test Certificate (PDF)
 */
export function exportSingleTestPdf(test: LabTestRecord): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable certificate.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'testing', 'single', test.testReportNo);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      new Date().toISOString().split('T')[0],
      config.department
    );

    const docCode = config.fullDocCode;

    const isPassed = test.verdict === 'PASS';
    const isFailed = test.verdict === 'FAIL';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lab Test Certificate - ${test.testReportNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 14mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 12px;
            color: #0f172a;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .hero-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: ${isPassed ? '#f0fdf4' : isFailed ? '#fff1f2' : '#fffbeb'};
            border: 2px solid ${isPassed ? '#86efac' : isFailed ? '#fca5a5' : '#fde68a'};
            border-radius: 12px;
            padding: 16px 20px;
            margin: 16px 0;
          }
          .verdict-badge {
            font-size: 18px;
            font-weight: 800;
            padding: 6px 18px;
            border-radius: 9999px;
            letter-spacing: 0.5px;
            ${
              isPassed
                ? 'background: #15803d; color: white;'
                : isFailed
                ? 'background: #be123c; color: white;'
                : 'background: #d97706; color: white;'
            }
          }
          .section-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1e3a8a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 4px;
            margin: 16px 0 8px 0;
          }
          .data-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px 16px;
            font-size: 11px;
          }
          .data-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px dotted #e2e8f0;
          }
          .data-label {
            color: #64748b;
            font-weight: 600;
          }
          .data-value {
            font-weight: 700;
            color: #0f172a;
            text-align: right;
          }
          .spec-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 11px;
          }
          .spec-table th {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: left;
            font-weight: 700;
            color: #334155;
          }
          .spec-table td {
            border: 1px solid #cbd5e1;
            padding: 8px;
          }
          .sign-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
          }
          .sign-box {
            text-align: center;
          }
          .sign-line {
            border-bottom: 1px dashed #94a3b8;
            height: 38px;
            margin-bottom: 6px;
          }
          .sign-title {
            font-size: 10px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
          }
          .sign-sub {
            font-size: 9px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        ${dynamicHeaderHtml}

        <div class="hero-box">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">
              Official Accreditation Test Certificate
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; font-family: monospace; margin-top: 2px;">
              ${test.testReportNo}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              Style: <strong>${test.styleNumber}</strong> ${test.buyerName ? `• Buyer: <strong>${test.buyerName}</strong>` : ''} • Batch: <strong>${test.fabricBatch}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="verdict-badge">${test.verdict}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-weight: 600;">
              Tested on: ${test.testDate}
            </div>
          </div>
        </div>

        <div class="section-title">1. Specimen & Order Identification</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Test Report Number:</span>
            <span class="data-value" style="font-family: monospace;">${test.testReportNo}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Style / Article Number:</span>
            <span class="data-value">${test.styleNumber}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Fabric / Material Batch:</span>
            <span class="data-value" style="font-family: monospace;">${test.fabricBatch}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Target Buyer / Brand:</span>
            <span class="data-value">${test.buyerName || 'Standard Production'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">PO / Order Reference:</span>
            <span class="data-value">${test.orderNumber || 'Global Bulk'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Garment / Fabric Item:</span>
            <span class="data-value">${test.garmentItem || 'Knitted / Woven Textile'}</span>
          </div>
        </div>

        <div class="section-title">2. Test Protocol & Environmental Conditions</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Test Type Classification:</span>
            <span class="data-value">${String(test.testType).replace(/_/g, ' ')}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Standard Test Method:</span>
            <span class="data-value" style="color: #1e3a8a; font-family: monospace;">${test.testStandard}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Testing Laboratory:</span>
            <span class="data-value">${test.labName}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Apparatus / Equipment Used:</span>
            <span class="data-value">${test.apparatusUsed || 'Calibrated Standard Apparatus'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Conditioning Duration:</span>
            <span class="data-value">${test.conditioningHours ? `${test.conditioningHours} Hours (ISO Standard)` : '4 Hours Minimum'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Ambient Temperature / Humidity:</span>
            <span class="data-value">${test.temperatureCelsius || 21}°C ± 2°C / ${test.humidityPercentage || 65}% ± 4% RH</span>
          </div>
        </div>

        <div class="section-title">3. Test Criteria, Actual Results & Conformity</div>
        <table class="spec-table">
          <thead>
            <tr>
              <th style="width: 25%;">Test Parameter</th>
              <th style="width: 35%;">Buyer / Standard Specification</th>
              <th style="width: 25%;">Actual Laboratory Result</th>
              <th style="width: 15%; text-align: center;">Conformity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 700; color: #1e3a8a;">${String(test.testType).replace(/_/g, ' ')}</td>
              <td style="color: #334155;">${test.requirement}</td>
              <td style="font-weight: 800; font-family: monospace; font-size: 12px; ${isPassed ? 'color: #15803d;' : isFailed ? 'color: #be123c;' : 'color: #d97706;'}">
                ${test.actualResult}
              </td>
              <td style="text-align: center; font-weight: 800; ${isPassed ? 'color: #15803d;' : isFailed ? 'color: #be123c;' : 'color: #d97706;'}">
                ${test.verdict}
              </td>
            </tr>
          </tbody>
        </table>

        ${
          test.remarks
            ? `
          <div class="section-title">4. Technical Observations & Remarks</div>
          <div style="font-size: 11px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; color: #334155; line-height: 1.5;">
            ${test.remarks}
          </div>
        `
            : ''
        }

        ${
          test.verdict === 'FAIL' && (test.rootCause || test.correctiveAction)
            ? `
          <div class="section-title" style="color: #be123c;">5. Non-Conformance Root Cause & Corrective Action</div>
          <div style="font-size: 11px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px; color: #9f1239; line-height: 1.5;">
            ${test.rootCause ? `<div><strong>Identified Root Cause:</strong> ${test.rootCause}</div>` : ''}
            ${test.correctiveAction ? `<div style="margin-top: 4px;"><strong>Mandatory Corrective Action:</strong> ${test.correctiveAction}</div>` : ''}
          </div>
        `
            : ''
        }

        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Tested By: ${test.testedBy}</div>
            <div class="sign-sub">Certified Textile Lab Technologist</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Senior Lab Chemist</div>
            <div class="sign-sub">Technical Review & ISO 17025 Compliance</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">QA / Technical Director</div>
            <div class="sign-sub">Authorized Factory Release Signatory</div>
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
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error('Failed to export Single Lab Test PDF:', err);
  }
}

/**
 * Export single lab test certificate as Excel workbook
 */
export function exportSingleTestExcel(test: LabTestRecord): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.testReport || 'LAB-TEST'}`;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Test Certificate</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px;">
          <tr>
            <td colspan="4" style="font-size: 16px; font-weight: bold; color: #1e3a8a; padding: 10px 0;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'} - LAB TEST CERTIFICATE
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 11px; color: #475569; padding-bottom: 12px;">
              Doc Code: ${docCode} | Report: ${test.testReportNo} | Date: ${test.testDate}
            </td>
          </tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">1. TEST SPECIMEN & PROTOCOL</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Report Number:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace; width: 25%;">${test.testReportNo}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Style Number:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; width: 25%;">${test.styleNumber}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Fabric Batch:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${test.fabricBatch}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Buyer / Brand:</td>
            <td style="border: 1px solid #cbd5e1;">${test.buyerName || 'Standard'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Test Classification:</td>
            <td style="border: 1px solid #cbd5e1;">${String(test.testType).replace(/_/g, ' ')}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Test Standard:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${test.testStandard}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Testing Laboratory:</td>
            <td style="border: 1px solid #cbd5e1;">${test.labName}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Tested By:</td>
            <td style="border: 1px solid #cbd5e1;">${test.testedBy}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Conditioning:</td>
            <td style="border: 1px solid #cbd5e1;">${test.conditioningHours || 4} Hours</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Environment:</td>
            <td style="border: 1px solid #cbd5e1;">${test.temperatureCelsius || 21}°C, ${test.humidityPercentage || 65}% RH</td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">2. SPECIFICATION VS RESULT</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Standard Requirement:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1;">${test.requirement}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Actual Lab Result:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px;">${test.actualResult}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Final Verdict:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1; font-weight: bold; font-size: 13px; ${
              test.verdict === 'PASS'
                ? 'background-color: #dcfce7; color: #15803d;'
                : test.verdict === 'FAIL'
                ? 'background-color: #ffe4e6; color: #be123c;'
                : 'background-color: #fef3c7; color: #b45309;'
            }">
              ${test.verdict}
            </td>
          </tr>
          ${
            test.remarks
              ? `
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Technical Remarks:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1;">${test.remarks}</td>
          </tr>
          `
              : ''
          }
          ${
            test.verdict === 'FAIL'
              ? `
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; color: #be123c;">Root Cause:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1; color: #be123c;">${test.rootCause || 'Under investigation'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; color: #be123c;">Corrective Action:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1; color: #be123c;">${test.correctiveAction || 'Required before bulk release'}</td>
          </tr>
          `
              : ''
          }
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lab_Certificate_${test.testReportNo}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    console.error('Failed to export Single Lab Test Excel:', err);
  }
}
