import { CalibrationDevice } from '@/lib/types/modules';
import { loadPdfHeaderSettings, renderPdfHeaderHtml, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Calibration module
 */
export function computeCalibrationKpis(devices: CalibrationDevice[]) {
  const total = devices.length;
  const calibrated = devices.filter((d) => d.status === 'CALIBRATED').length;
  const dueSoon = devices.filter((d) => d.status === 'DUE_SOON').length;
  const overdue = devices.filter((d) => d.status === 'OVERDUE').length;

  const complianceRate = total > 0 ? Math.round((calibrated / total) * 100) : 0;
  const thirdPartyCertified = devices.filter((d) => d.isThirdPartyCertified).length;
  const departmentsCount = new Set(devices.map((d) => d.department).filter(Boolean)).size;

  return {
    total,
    calibrated,
    dueSoon,
    overdue,
    complianceRate,
    thirdPartyCertified,
    departmentsCount,
  };
}

/**
 * Download Calibration CSV
 */
export function downloadCalibrationCsv(
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
 * Export printable PDF Calibration Master Register
 */
export function exportCalibrationSummaryPdf(
  devices: CalibrationDevice[],
  scopeLabel: string = 'All Calibration Equipment'
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF report.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const exportConfig = getModuleExportConfig(pdfSettings, 'calibration', 'register');
    const docCode = exportConfig.fullDocCode;
    const kpis = computeCalibrationKpis(devices);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      exportConfig.title,
      docCode,
      new Date().toISOString().split('T')[0],
      exportConfig.department
    );

    const rowsHtml = devices
      .map(
        (d, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 7px 8px; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
          <td style="padding: 7px 8px; font-weight: 700; color: #1e3a8a; font-family: monospace;">${d.deviceTag}</td>
          <td style="padding: 7px 8px; font-weight: 600; color: #0f172a;">
            ${d.deviceName}
            <div style="font-size: 9px; color: #64748b; font-weight: normal;">${d.brandName || 'Brand'} • ${d.model} • SN: ${d.serialNumber || 'N/A'}</div>
          </td>
          <td style="padding: 7px 8px; color: #334155;">
            ${d.location}
            <div style="font-size: 9px; color: #64748b;">${d.department || 'QA Lab'}</div>
          </td>
          <td style="padding: 7px 8px; font-size: 10px; color: #0284c7; font-family: monospace;">
            ${d.standardBasis || 'ISO 17025'}
            <div style="font-size: 9px; color: #15803d; font-weight: bold;">Tol: ${d.accuracyTolerance || '±0.01%'}</div>
          </td>
          <td style="padding: 7px 8px; text-align: center; font-family: monospace; font-size: 10px;">
            ${d.lastCalibrationDate}
          </td>
          <td style="padding: 7px 8px; text-align: center; font-family: monospace; font-size: 10px; font-weight: 700; ${
            d.status === 'OVERDUE'
              ? 'color: #be123c;'
              : d.status === 'DUE_SOON'
              ? 'color: #c2410c;'
              : 'color: #15803d;'
          }">
            ${d.nextDueDate}
          </td>
          <td style="padding: 7px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 9px; font-weight: 800; ${
              d.status === 'CALIBRATED'
                ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;'
                : d.status === 'DUE_SOON'
                ? 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'
                : 'background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3;'
            }">
              ${d.status.replace(/_/g, ' ')}
            </span>
          </td>
          <td style="padding: 7px 8px; font-size: 10px; color: #475569;">
            <div style="font-family: monospace; font-weight: 600; color: #4338ca;">${d.certificateNumber}</div>
            <div style="font-size: 9px; color: #64748b;">${d.calibrationAgency}</div>
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
        <title>Calibration Register - ${docCode}</title>
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
          <div><strong>Generated:</strong> ${new Date().toLocaleString()} • Authorized Metrology QMS Document</div>
        </div>

        <div class="kpi-strip">
          <div class="kpi-card">
            <div class="kpi-val" style="color: #1e3a8a;">${kpis.total}</div>
            <div class="kpi-lbl">Total Devices</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #15803d;">${kpis.calibrated}</div>
            <div class="kpi-lbl">Calibrated & Valid</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #d97706;">${kpis.dueSoon}</div>
            <div class="kpi-lbl">Due Within 30 Days</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #be123c;">${kpis.overdue}</div>
            <div class="kpi-lbl">Overdue Equipment</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #0284c7;">${kpis.complianceRate}%</div>
            <div class="kpi-lbl">Calibration Rate</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #7c3aed;">${kpis.thirdPartyCertified}</div>
            <div class="kpi-lbl">ISO 17025 Third-Party</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th style="width: 95px;">Device Tag</th>
              <th>Equipment Name & Specs</th>
              <th>Location & Dept</th>
              <th>Standard & Tolerance</th>
              <th style="width: 80px; text-align: center;">Last Calib</th>
              <th style="width: 80px; text-align: center;">Next Due</th>
              <th style="width: 85px; text-align: center;">Status</th>
              <th>Certificate & Agency</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Metrology / Calibration Technician</div>
            <div class="sign-sub">Routine Verification & Master Standards</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Testing Laboratory Lead</div>
            <div class="sign-sub">Accreditation & Traceability Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Head of Quality Assurance</div>
            <div class="sign-sub">Instrument Release Authorization</div>
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
    console.error('Failed to export Calibration PDF:', err);
  }
}

/**
 * Export styled Excel (.xls) summary of Calibration register
 */
export function exportCalibrationSummaryExcel(
  devices: CalibrationDevice[],
  fileName: string = 'Calibration_Equipment_Register'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.calibrationRegister || 'CAL-REG'}`;
    const kpis = computeCalibrationKpis(devices);

    const rowsHtml = devices
      .map(
        (d, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="font-weight: bold; border: 1px solid #cbd5e1; font-family: monospace;">${d.deviceTag}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold;">${d.deviceName}</td>
          <td style="border: 1px solid #cbd5e1;">${d.brandName || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1;">${d.model}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${d.serialNumber || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1;">${d.location}</td>
          <td style="border: 1px solid #cbd5e1;">${d.department || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${d.standardBasis || 'ISO 17025'}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${d.accuracyTolerance || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${d.measurementRange || 'N/A'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${d.lastCalibrationDate}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold;">${d.nextDueDate}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${d.calibrationFrequencyMonths} Months</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; ${
            d.status === 'CALIBRATED'
              ? 'background-color: #dcfce7; color: #15803d;'
              : d.status === 'DUE_SOON'
              ? 'background-color: #fef3c7; color: #b45309;'
              : 'background-color: #ffe4e6; color: #be123c;'
          }">
            ${d.status.replace(/_/g, ' ')}
          </td>
          <td style="border: 1px solid #cbd5e1; font-family: monospace;">${d.certificateNumber}</td>
          <td style="border: 1px solid #cbd5e1;">${d.calibrationAgency}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${d.isThirdPartyCertified ? 'YES' : 'NO'}</td>
          <td style="border: 1px solid #cbd5e1;">${d.calibratedBy || 'Internal Metrologist'}</td>
          <td style="border: 1px solid #cbd5e1;">${d.remarks || 'None'}</td>
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
                <x:Name>Calibration Matrix</x:Name>
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
            <td colspan="20" style="font-size: 16px; font-weight: bold; color: #1e3a8a; padding: 10px 0;">
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'} - CALIBRATION MATRIX & EQUIPMENT REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="20" style="font-size: 11px; color: #475569; padding-bottom: 10px;">
              Doc Code: ${docCode} | Exported: ${new Date().toLocaleString()} | ISO/IEC 17025 Traceable Metrology System
            </td>
          </tr>
          <tr>
            <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1;">Total Devices: ${kpis.total}</td>
            <td colspan="3" style="background-color: #dcfce7; font-weight: bold; border: 1px solid #cbd5e1; color: #15803d;">Calibrated: ${kpis.calibrated}</td>
            <td colspan="3" style="background-color: #fef3c7; font-weight: bold; border: 1px solid #cbd5e1; color: #b45309;">Due Soon: ${kpis.dueSoon}</td>
            <td colspan="3" style="background-color: #ffe4e6; font-weight: bold; border: 1px solid #cbd5e1; color: #be123c;">Overdue: ${kpis.overdue}</td>
            <td colspan="4" style="background-color: #e0f2fe; font-weight: bold; border: 1px solid #cbd5e1; color: #0284c7;">Compliance Rate: ${kpis.complianceRate}%</td>
            <td colspan="4" style="background-color: #f3e8ff; font-weight: bold; border: 1px solid #cbd5e1; color: #7c3aed;">ISO 17025 Certified: ${kpis.thirdPartyCertified}</td>
          </tr>
          <tr><td colspan="20"></td></tr>
          <tr style="background-color: #1e3a8a; color: white; font-weight: bold; text-align: left;">
            <th style="border: 1px solid #0f172a; padding: 6px;">#</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Device Tag</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Device Name</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Brand</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Model</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Serial No</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Location</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Department</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Standard Basis</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Tolerance</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Range</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Last Date</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Next Due</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Frequency</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Status</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Cert No</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Agency</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Third Party?</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Calibrated By</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Remarks</th>
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
    console.error('Failed to export Calibration Excel:', err);
  }
}

/**
 * Export official Single Calibration Certificate & Instrument Dossier (PDF)
 */
export function exportSingleCalibrationPdf(device: CalibrationDevice): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable certificate.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const exportConfig = getModuleExportConfig(pdfSettings, 'calibration', 'single', device.deviceTag);
    const docCode = exportConfig.fullDocCode;

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      `${exportConfig.title}: ${device.deviceName}`,
      docCode,
      device.lastCalibrationDate || new Date().toISOString().split('T')[0],
      `${exportConfig.department} • Tag: ${device.deviceTag}`
    );

    const isCalibrated = device.status === 'CALIBRATED';
    const isDueSoon = device.status === 'DUE_SOON';

    const historyRows =
      device.calibrationHistory && device.calibrationHistory.length > 0
        ? `
        <div style="margin-top: 18px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
            4. Historical Calibration Verification Records (${device.calibrationHistory.length} Recorded Cycles)
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Calibration Date</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Expiry Date</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Cert # & Agency</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Standard Basis</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 80px;">Result</th>
              </tr>
            </thead>
            <tbody>
              ${device.calibrationHistory
                .map(
                  (h) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="border: 1px solid #cbd5e1; padding: 5px; font-family: monospace;">${h.calibrationDate}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px; font-family: monospace;">${h.expiryDate}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px;">
                    <div style="font-weight: 600; color: #4338ca;">${h.certificateNumber}</div>
                    <div style="font-size: 9px; color: #64748b;">${h.agency}</div>
                  </td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px; font-family: monospace;">${h.standardUsed}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-weight: bold; color: ${
                    h.result === 'PASS' ? '#15803d' : '#b45309'
                  };">${h.result}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
        : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Calibration Certificate - ${device.deviceTag}</title>
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
            background: ${isCalibrated ? '#f0fdf4' : isDueSoon ? '#fffbeb' : '#fff1f2'};
            border: 2px solid ${isCalibrated ? '#86efac' : isDueSoon ? '#fde68a' : '#fca5a5'};
            border-radius: 12px;
            padding: 16px 20px;
            margin: 16px 0;
          }
          .status-badge {
            font-size: 15px;
            font-weight: 800;
            padding: 5px 18px;
            border-radius: 9999px;
            letter-spacing: 0.5px;
            ${
              isCalibrated
                ? 'background: #15803d; color: white;'
                : isDueSoon
                ? 'background: #d97706; color: white;'
                : 'background: #be123c; color: white;'
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
              ISO/IEC 17025 Accredited Calibration Certificate
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace;">
              ${device.deviceTag}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              ${device.deviceName} • Model: <strong>${device.model}</strong> • SN: <strong style="font-family: monospace;">${device.serialNumber || 'N/A'}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="status-badge">${device.status.replace(/_/g, ' ')}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 700;">
              Expiry: <span style="font-family: monospace; ${isCalibrated ? 'color: #15803d;' : 'color: #be123c;'}">${device.nextDueDate}</span>
            </div>
          </div>
        </div>

        <div class="section-title">1. Equipment Identification & Location</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Instrument Asset Tag:</span>
            <span class="data-value" style="font-family: monospace;">${device.deviceTag}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Equipment Name:</span>
            <span class="data-value">${device.deviceName}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Manufacturer / Brand:</span>
            <span class="data-value">${device.brandName || 'Sartorius / Testing Standard'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Model Designation:</span>
            <span class="data-value" style="font-family: monospace;">${device.model}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Serial Number (SN):</span>
            <span class="data-value" style="font-family: monospace;">${device.serialNumber || 'SN-UNKNOWN'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Installed Location & Dept:</span>
            <span class="data-value">${device.location} (${device.department || 'Lab'})</span>
          </div>
        </div>

        <div class="section-title">2. Metrology Standards & Accuracy Specifications</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Governing Standard Basis:</span>
            <span class="data-value" style="color: #1e3a8a; font-family: monospace;">${device.standardBasis || 'ISO/IEC 17025'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Certified Accuracy Tolerance:</span>
            <span class="data-value" style="color: #15803d; font-family: monospace;">${device.accuracyTolerance || '±0.01% of full scale'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Operating Measurement Range:</span>
            <span class="data-value" style="font-family: monospace;">${device.measurementRange || 'Standard Operational Limits'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Calibration Cycle Interval:</span>
            <span class="data-value">${device.calibrationFrequencyMonths} Calendar Months</span>
          </div>
          <div class="data-item">
            <span class="data-label">Third-Party Accredited?:</span>
            <span class="data-value">${device.isThirdPartyCertified ? 'YES (ISO 17025 Accredited Agency)' : 'Internal Secondary Metrology'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Calibration Agency / Lab:</span>
            <span class="data-value">${device.calibrationAgency}</span>
          </div>
        </div>

        <div class="section-title">3. Current Certificate & Calibration Result</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Official Certificate No:</span>
            <span class="data-value" style="color: #4338ca; font-family: monospace; font-size: 12px;">${device.certificateNumber}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Calibration Verification Date:</span>
            <span class="data-value" style="font-family: monospace;">${device.lastCalibrationDate}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Next Scheduled Recalibration:</span>
            <span class="data-value" style="font-family: monospace; font-weight: 800; color: ${isCalibrated ? '#15803d' : '#be123c'};">${device.nextDueDate}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Verification Result Status:</span>
            <span class="data-value" style="color: #15803d; font-weight: 800;">${device.calibrationResult || 'PASS (Conforms to Specification)'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Certified Metrologist / Officer:</span>
            <span class="data-value">${device.calibratedBy || 'Accredited Lead Metrologist'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Traceability Reference:</span>
            <span class="data-value" style="font-family: monospace;">NIST / ISO Traceable Master Weights</span>
          </div>
        </div>

        ${
          device.remarks
            ? `
          <div style="margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 11px; color: #334155;">
            <strong>Technical Remarks & Environmental Conditions:</strong> ${device.remarks}
          </div>
        `
            : ''
        }

        ${historyRows}

        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Calibrating Metrologist</div>
            <div class="sign-sub">Certified Calibration Technician</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Testing Lab Manager</div>
            <div class="sign-sub">ISO/IEC 17025 Compliance Lead</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">QA Director</div>
            <div class="sign-sub">Instrument Acceptance & Factory Release</div>
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
    console.error('Failed to export Single Calibration PDF:', err);
  }
}

/**
 * Export single calibration equipment record as Excel workbook
 */
export function exportSingleCalibrationExcel(device: CalibrationDevice): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.calibrationCertificate || 'CAL-CERT'}`;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Calibration Certificate</x:Name>
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
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'} - CALIBRATION CERTIFICATE
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 11px; color: #475569; padding-bottom: 12px;">
              Doc Code: ${docCode} | Asset Tag: ${device.deviceTag} | Due Date: ${device.nextDueDate}
            </td>
          </tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">1. INSTRUMENT IDENTIFICATION</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Device Tag:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace; width: 25%; font-weight: bold;">${device.deviceTag}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Device Name:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; width: 25%;">${device.deviceName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Brand:</td>
            <td style="border: 1px solid #cbd5e1;">${device.brandName || 'N/A'}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Model:</td>
            <td style="border: 1px solid #cbd5e1;">${device.model}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Serial Number:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${device.serialNumber || 'N/A'}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Location:</td>
            <td style="border: 1px solid #cbd5e1;">${device.location} (${device.department || 'Lab'})</td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">2. METROLOGY SPECIFICATIONS & CALIBRATION RESULTS</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Standard Basis:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${device.standardBasis || 'ISO 17025'}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Accuracy Tolerance:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${device.accuracyTolerance || 'N/A'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Measurement Range:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace;">${device.measurementRange || 'N/A'}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Calibration Frequency:</td>
            <td style="border: 1px solid #cbd5e1;">${device.calibrationFrequencyMonths} Months</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Certificate Number:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${device.certificateNumber}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Agency:</td>
            <td style="border: 1px solid #cbd5e1;">${device.calibrationAgency}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Last Calibration:</td>
            <td style="border: 1px solid #cbd5e1;">${device.lastCalibrationDate}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Next Due Date:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; color: ${
              device.status === 'CALIBRATED' ? '#15803d' : '#be123c'
            };">${device.nextDueDate}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Status:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1; font-weight: bold; ${
              device.status === 'CALIBRATED'
                ? 'background-color: #dcfce7; color: #15803d;'
                : device.status === 'DUE_SOON'
                ? 'background-color: #fef3c7; color: #b45309;'
                : 'background-color: #ffe4e6; color: #be123c;'
            }">${device.status.replace(/_/g, ' ')}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Remarks:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1;">${device.remarks || 'None'}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Calibration_${device.deviceTag}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    console.error('Failed to export Single Calibration Excel:', err);
  }
}
