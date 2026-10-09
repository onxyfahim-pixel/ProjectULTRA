import { RiskFmeaItem } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';
import { getRiskLevel } from './riskAssessmentData';

/**
 * Compute summary KPIs for Risk Assessment / FMEA module
 */
export function computeRiskAssessmentKpis(records: RiskFmeaItem[]) {
  const total = records.length;

  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  let totalRpn = 0;

  records.forEach((r) => {
    const rpn = r.rpn || (r.severity || 1) * (r.occurrence || 1) * (r.detection || 1);
    totalRpn += rpn;
    const level = r.riskLevel || getRiskLevel(rpn, r.severity || 1);
    if (level === 'CRITICAL') critical++;
    else if (level === 'HIGH') high++;
    else if (level === 'MEDIUM') medium++;
    else low++;
  });

  const avgRpn = total > 0 ? Math.round(totalRpn / total) : 0;
  const mitigatedOrApproved = records.filter(
    (r) => r.status === 'APPROVED' || r.status === 'MITIGATED'
  ).length;
  const inProgress = records.filter((r) => r.status === 'IN_PROGRESS' || !r.status).length;
  const uniqueStylesCount = new Set(records.map((r) => r.styleNumber).filter(Boolean)).size;

  return {
    total,
    critical,
    high,
    medium,
    low,
    avgRpn,
    mitigatedOrApproved,
    inProgress,
    uniqueStylesCount,
  };
}

/**
 * Download Risk Assessment CSV
 */
export function downloadRiskCsv(
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
 * Export printable PDF Risk Assessment / FMEA Master Register
 */
export function exportRiskSummaryPdf(
  records: RiskFmeaItem[],
  scopeLabel: string = 'All Risk Assessments'
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF report.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'risk_assessment', 'register');
    const kpis = computeRiskAssessmentKpis(records);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      new Date().toISOString().split('T')[0],
      config.department
    );

    const docCode = config.fullDocCode;

    const rowsHtml = records
      .map((r, idx) => {
        const rpn = r.rpn || (r.severity || 1) * (r.occurrence || 1) * (r.detection || 1);
        const level = r.riskLevel || getRiskLevel(rpn, r.severity || 1);

        return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 7px 8px; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
          <td style="padding: 7px 8px; font-weight: 700; color: #1e3a8a; font-family: monospace;">${r.fmeaCode}</td>
          <td style="padding: 7px 8px; font-weight: 600; color: #0f172a;">
            ${r.styleNumber || 'Standard'}
            ${r.buyer ? `<div style="font-size: 9px; color: #64748b;">Buyer: ${r.buyer}</div>` : ''}
          </td>
          <td style="padding: 7px 8px; font-weight: 600; color: #334155;">
            ${r.processStep}
            <div style="font-size: 9px; color: #b91c1c; font-weight: normal;">${r.potentialFailureMode}</div>
          </td>
          <td style="padding: 7px 8px; text-align: center; font-family: monospace; font-size: 10px; color: #475569;">
            ${r.severity} · ${r.occurrence} · ${r.detection}
          </td>
          <td style="padding: 7px 8px; text-align: center; font-family: monospace; font-weight: 800; font-size: 11px; ${
            rpn >= 200
              ? 'color: #be123c;'
              : rpn >= 120
              ? 'color: #c2410c;'
              : rpn >= 60
              ? 'color: #b45309;'
              : 'color: #15803d;'
          }">
            ${rpn}
          </td>
          <td style="padding: 7px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 9px; font-weight: 800; ${
              level === 'CRITICAL'
                ? 'background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3;'
                : level === 'HIGH'
                ? 'background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa;'
                : level === 'MEDIUM'
                ? 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'
                : 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;'
            }">
              ${level}
            </span>
          </td>
          <td style="padding: 7px 8px; font-size: 10px; color: #334155;">
            <div style="font-weight: 600;">${r.mitigationAction}</div>
            <div style="font-size: 9px; color: #64748b;">Lead: ${r.responsibleLead}</div>
          </td>
          <td style="padding: 7px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; ${
              r.status === 'APPROVED' || r.status === 'MITIGATED'
                ? 'background: #f0fdf4; color: #15803d;'
                : 'background: #eff6ff; color: #1d4ed8;'
            }">
              ${r.status || 'IN_PROGRESS'}
            </span>
          </td>
        </tr>
      `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Risk Assessment Register - ${docCode}</title>
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
          <div><strong>Generated:</strong> ${new Date().toLocaleString()} • Authorized FMEA Quality Document</div>
        </div>

        <div class="kpi-strip">
          <div class="kpi-card">
            <div class="kpi-val" style="color: #1e3a8a;">${kpis.total}</div>
            <div class="kpi-lbl">Total Assessments</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #be123c;">${kpis.critical}</div>
            <div class="kpi-lbl">Critical Risks</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #c2410c;">${kpis.high}</div>
            <div class="kpi-lbl">High Risks</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #b45309;">${kpis.medium}</div>
            <div class="kpi-lbl">Medium Risks</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #0f172a;">${kpis.avgRpn}</div>
            <div class="kpi-lbl">Average RPN</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #15803d;">${kpis.mitigatedOrApproved}</div>
            <div class="kpi-lbl">Mitigated / Closed</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th style="width: 95px;">FMEA Code</th>
              <th>Style & Buyer</th>
              <th>Process Step & Failure Mode</th>
              <th style="width: 75px; text-align: center;">S · O · D</th>
              <th style="width: 55px; text-align: center;">RPN</th>
              <th style="width: 75px; text-align: center;">Level</th>
              <th>Mitigation Action & Lead</th>
              <th style="width: 85px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Cross-Functional Risk Team Lead</div>
            <div class="sign-sub">Technical Risk Assessment (IE/QA/Cutting/Sewing)</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Technical Services & Production Manager</div>
            <div class="sign-sub">Operational Controls & Action Approval</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Head of Quality Assurance</div>
            <div class="sign-sub">Pre-Production Meeting & Buyer Sign-off</div>
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
    console.error('Failed to export Risk Assessment PDF:', err);
  }
}

/**
 * Export styled Excel (.xls) summary of Risk Assessment register
 */
export function exportRiskSummaryExcel(
  records: RiskFmeaItem[],
  fileName: string = 'Risk_Assessment_FMEA_Register'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.riskRegister || 'RSK-REG'}`;
    const kpis = computeRiskAssessmentKpis(records);

    const rowsHtml = records
      .map((r, idx) => {
        const rpn = r.rpn || (r.severity || 1) * (r.occurrence || 1) * (r.detection || 1);
        const level = r.riskLevel || getRiskLevel(rpn, r.severity || 1);

        return `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="font-weight: bold; border: 1px solid #cbd5e1; font-family: monospace;">${r.fmeaCode}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold;">${r.styleNumber || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1;">${r.buyer || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1;">${r.orderNumber || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1;">${r.processStep}</td>
          <td style="border: 1px solid #cbd5e1;">${r.potentialFailureMode}</td>
          <td style="border: 1px solid #cbd5e1;">${r.potentialEffect}</td>
          <td style="border: 1px solid #cbd5e1;">${r.potentialCauses || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1;">${r.currentControls || 'N/A'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${r.severity}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${r.occurrence}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${r.detection}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; font-family: monospace;">${rpn}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; ${
            level === 'CRITICAL'
              ? 'background-color: #ffe4e6; color: #be123c;'
              : level === 'HIGH'
              ? 'background-color: #ffedd5; color: #c2410c;'
              : level === 'MEDIUM'
              ? 'background-color: #fef3c7; color: #b45309;'
              : 'background-color: #dcfce7; color: #15803d;'
          }">
            ${level}
          </td>
          <td style="border: 1px solid #cbd5e1;">${r.mitigationAction}</td>
          <td style="border: 1px solid #cbd5e1;">${r.responsibleLead}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${r.targetDate || 'N/A'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${r.status || 'IN_PROGRESS'}</td>
          <td style="border: 1px solid #cbd5e1;">${r.assessorName || 'Central QA'}</td>
        </tr>
      `;
      })
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Risk FMEA Register</x:Name>
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
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'} - RISK ASSESSMENT & FMEA REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="20" style="font-size: 11px; color: #475569; padding-bottom: 10px;">
              Doc Code: ${docCode} | Exported: ${new Date().toLocaleString()} | Failure Mode & Effects Analysis
            </td>
          </tr>
          <tr>
            <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1;">Total Risks: ${kpis.total}</td>
            <td colspan="3" style="background-color: #ffe4e6; font-weight: bold; border: 1px solid #cbd5e1; color: #be123c;">Critical: ${kpis.critical}</td>
            <td colspan="3" style="background-color: #ffedd5; font-weight: bold; border: 1px solid #cbd5e1; color: #c2410c;">High: ${kpis.high}</td>
            <td colspan="3" style="background-color: #fef3c7; font-weight: bold; border: 1px solid #cbd5e1; color: #b45309;">Medium: ${kpis.medium}</td>
            <td colspan="4" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1;">Avg RPN: ${kpis.avgRpn}</td>
            <td colspan="4" style="background-color: #dcfce7; font-weight: bold; border: 1px solid #cbd5e1; color: #15803d;">Mitigated: ${kpis.mitigatedOrApproved}</td>
          </tr>
          <tr><td colspan="20"></td></tr>
          <tr style="background-color: #1e3a8a; color: white; font-weight: bold; text-align: left;">
            <th style="border: 1px solid #0f172a; padding: 6px;">#</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">FMEA Code</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Style No</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Buyer</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Order No</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Process Step</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Potential Failure Mode</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Potential Effect</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Causes</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Controls</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Sev (S)</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Occ (O)</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Det (D)</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">RPN</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Risk Level</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Mitigation Action</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Responsible Lead</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Target Date</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Status</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Assessor</th>
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
    console.error('Failed to export Risk Assessment Excel:', err);
  }
}

/**
 * Export official Single FMEA Risk Assessment Dossier (PDF)
 */
export function exportSingleRiskPdf(record: RiskFmeaItem): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable FMEA report.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'risk_assessment', 'single', record.fmeaCode);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      new Date().toISOString().split('T')[0],
      config.department
    );

    const docCode = config.fullDocCode;

    const rpn = record.rpn || (record.severity || 1) * (record.occurrence || 1) * (record.detection || 1);
    const level = record.riskLevel || getRiskLevel(rpn, record.severity || 1);

    const isCritical = level === 'CRITICAL';
    const isHigh = level === 'HIGH';

    const hasSectionRisks = Array.isArray(record.sectionRisks) && record.sectionRisks.length > 0;

    const sectionsHtml = hasSectionRisks
      ? `
        <div style="margin-top: 18px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
            4. Detailed Section-by-Section Risk Breakdown (${record.sectionRisks!.length} Evaluated Points)
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Section</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Process Step & Failure Mode</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 60px;">S·O·D</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 45px;">RPN</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Action Protocol</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 75px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${record.sectionRisks!
                .map(
                  (s) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: 700; color: #0284c7;">${s.section.replace(/_/g, ' ')}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px;">
                    <div style="font-weight: 600;">${s.processStep}</div>
                    <div style="color: #be123c;">${s.potentialFailureMode}</div>
                  </td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-family: monospace;">${s.severity}·${s.occurrence}·${s.detection}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-weight: bold; font-family: monospace;">${s.rpn}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px;">${s.mitigationAction}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-weight: 600;">${s.status || 'MITIGATED'}</td>
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
        <title>Risk Assessment FMEA - ${record.fmeaCode}</title>
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
            background: ${isCritical ? '#fff1f2' : isHigh ? '#fff7ed' : '#f0fdf4'};
            border: 2px solid ${isCritical ? '#fca5a5' : isHigh ? '#fed7aa' : '#bbf7d0'};
            border-radius: 12px;
            padding: 16px 20px;
            margin: 16px 0;
          }
          .level-badge {
            font-size: 16px;
            font-weight: 800;
            padding: 5px 18px;
            border-radius: 9999px;
            letter-spacing: 0.5px;
            ${
              isCritical
                ? 'background: #be123c; color: white;'
                : isHigh
                ? 'background: #c2410c; color: white;'
                : level === 'MEDIUM'
                ? 'background: #d97706; color: white;'
                : 'background: #15803d; color: white;'
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
          .rpn-card {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            margin: 10px 0;
          }
          .rpn-num {
            font-size: 20px;
            font-weight: 800;
            font-family: monospace;
          }
          .rpn-lbl {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-top: 2px;
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
              Failure Mode & Effects Analysis (FMEA)
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace;">
              ${record.fmeaCode}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              Style: <strong>${record.styleNumber || 'Standard'}</strong> • Buyer: <strong>${record.buyer || 'Global'}</strong> • Process: <strong>${record.processStep}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="level-badge">${level} RISK</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 700;">
              Total RPN: <span style="font-size: 16px; font-family: monospace; ${isCritical ? 'color: #be123c;' : isHigh ? 'color: #c2410c;' : 'color: #15803d;'}">${rpn}</span>
            </div>
          </div>
        </div>

        <div class="section-title">1. Product & Order Context</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">FMEA Document Reference:</span>
            <span class="data-value" style="font-family: monospace;">${record.fmeaCode}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Assessment Type:</span>
            <span class="data-value">${record.assessmentType || 'PROCESS RISK'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Style / Article Number:</span>
            <span class="data-value">${record.styleNumber || 'Bulk Production'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Target Buyer / Brand:</span>
            <span class="data-value">${record.buyer || 'All Buyers'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Purchase Order (PO):</span>
            <span class="data-value">${record.orderNumber || 'Standard'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Assessment Date:</span>
            <span class="data-value">${record.assessmentDate || 'Pre-Production Stage'}</span>
          </div>
        </div>

        <div class="section-title">2. Failure Mode, Effects & Current Controls</div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; line-height: 1.5; margin-bottom: 12px;">
          <div style="margin-bottom: 6px;">
            <strong style="color: #1e3a8a;">Process Step / Operation:</strong> ${record.processStep}
          </div>
          <div style="margin-bottom: 6px;">
            <strong style="color: #be123c;">Potential Failure Mode:</strong> ${record.potentialFailureMode}
          </div>
          <div style="margin-bottom: 6px;">
            <strong style="color: #475569;">Potential Failure Effect:</strong> ${record.potentialEffect}
          </div>
          ${record.potentialCauses ? `<div style="margin-bottom: 6px;"><strong style="color: #475569;">Root Causes:</strong> ${record.potentialCauses}</div>` : ''}
          ${record.currentControls ? `<div><strong style="color: #475569;">Existing Prevention Controls:</strong> ${record.currentControls}</div>` : ''}
        </div>

        <div class="section-title">3. Risk Priority Number (RPN) Evaluation</div>
        <div class="rpn-card">
          <div>
            <div class="rpn-num" style="color: #be123c;">${record.severity} / 10</div>
            <div class="rpn-lbl">Severity (S)</div>
          </div>
          <div>
            <div class="rpn-num" style="color: #c2410c;">${record.occurrence} / 10</div>
            <div class="rpn-lbl">Occurrence (O)</div>
          </div>
          <div>
            <div class="rpn-num" style="color: #d97706;">${record.detection} / 10</div>
            <div class="rpn-lbl">Detection (D)</div>
          </div>
          <div>
            <div class="rpn-num" style="${isCritical ? 'color: #be123c;' : isHigh ? 'color: #c2410c;' : 'color: #15803d;'}">${rpn}</div>
            <div class="rpn-lbl">Final RPN Score</div>
          </div>
        </div>

        <div class="section-title">4. Action Protocol & Mitigation Assignment</div>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; font-size: 11px; line-height: 1.5;">
          <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 4px;">Mandatory Action Protocol:</div>
          <div style="color: #1e293b; margin-bottom: 8px;">${record.mitigationAction}</div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #dbeafe; padding-top: 6px; font-size: 10px; color: #475569;">
            <div><strong>Responsible Lead:</strong> ${record.responsibleLead}</div>
            <div><strong>Target Date:</strong> ${record.targetDate || 'Prior to Bulk Cutting'}</div>
            <div><strong>Status:</strong> <span style="font-weight: bold; color: #15803d;">${record.status || 'IN_PROGRESS'}</span></div>
          </div>
        </div>

        ${sectionsHtml}

        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Risk Assessor: ${record.assessorName || 'Technical Lead'}</div>
            <div class="sign-sub">IE / Pre-Production Engineer</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Production Manager</div>
            <div class="sign-sub">Manufacturing Risk Controls Sign-off</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">QA Director</div>
            <div class="sign-sub">Pre-Production Verification & Release</div>
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
    console.error('Failed to export Single Risk Assessment PDF:', err);
  }
}

/**
 * Export single risk assessment as Excel workbook
 */
export function exportSingleRiskExcel(record: RiskFmeaItem): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.riskReport || 'RSK-FMEA'}`;
    const rpn = record.rpn || (record.severity || 1) * (record.occurrence || 1) * (record.detection || 1);
    const level = record.riskLevel || getRiskLevel(rpn, record.severity || 1);

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>FMEA Report</x:Name>
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
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'} - FMEA RISK REPORT
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 11px; color: #475569; padding-bottom: 12px;">
              Doc Code: ${docCode} | FMEA Ref: ${record.fmeaCode} | Date: ${record.assessmentDate || new Date().toLocaleDateString()}
            </td>
          </tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">1. PRODUCT & PROCESS IDENTIFICATION</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">FMEA Code:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace; width: 25%;">${record.fmeaCode}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Assessment Type:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; width: 25%;">${record.assessmentType || 'PROCESS'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Style Number:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold;">${record.styleNumber || 'Standard'}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Buyer / Brand:</td>
            <td style="border: 1px solid #cbd5e1;">${record.buyer || 'Standard'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Order Number:</td>
            <td style="border: 1px solid #cbd5e1;">${record.orderNumber || 'N/A'}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Process Step:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold;">${record.processStep}</td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">2. FAILURE MODE & RPN MATRIX</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Potential Failure Mode:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1; color: #be123c; font-weight: bold;">${record.potentialFailureMode}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Potential Effect:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1;">${record.potentialEffect}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Severity (S):</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px;">${record.severity} / 10</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Occurrence (O):</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px;">${record.occurrence} / 10</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Detection (D):</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px;">${record.detection} / 10</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">RPN Score:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; font-size: 13px; font-family: monospace;">${rpn}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Risk Priority Level:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1; font-weight: bold; font-size: 13px; ${
              level === 'CRITICAL'
                ? 'background-color: #ffe4e6; color: #be123c;'
                : level === 'HIGH'
                ? 'background-color: #ffedd5; color: #c2410c;'
                : level === 'MEDIUM'
                ? 'background-color: #fef3c7; color: #b45309;'
                : 'background-color: #dcfce7; color: #15803d;'
            }">
              ${level}
            </td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">3. ACTION PROTOCOL & ASSIGNMENT</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Mitigation Protocol:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1;">${record.mitigationAction}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Responsible Lead:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold;">${record.responsibleLead}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Target Date:</td>
            <td style="border: 1px solid #cbd5e1;">${record.targetDate || 'N/A'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Assessment Status:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #15803d;">${record.status || 'IN_PROGRESS'}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Assessor Name:</td>
            <td style="border: 1px solid #cbd5e1;">${record.assessorName || 'Central QA'}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FMEA_${record.fmeaCode}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    console.error('Failed to export Single Risk Assessment Excel:', err);
  }
}
