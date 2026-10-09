import { SubSupplier } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

/**
 * Compute summary KPIs for Sub-Suppliers
 */
export function computeSubSupplierKpis(suppliers: SubSupplier[]) {
  const total = suppliers.length;
  const approved = suppliers.filter((s) => s.complianceStatus === 'APPROVED').length;
  const provisional = suppliers.filter((s) => s.complianceStatus === 'PROVISIONAL').length;
  const auditPending = suppliers.filter((s) => s.complianceStatus === 'AUDIT_PENDING').length;
  const blacklisted = suppliers.filter((s) => s.complianceStatus === 'BLACKLISTED').length;

  const validAuditScores = suppliers.map((s) => s.auditScore).filter((score) => typeof score === 'number' && !isNaN(score));
  const avgAuditScore =
    validAuditScores.length > 0
      ? Math.round(validAuditScores.reduce((acc, curr) => acc + curr, 0) / validAuditScores.length)
      : 0;

  const validOtd = suppliers.map((s) => s.onTimeDeliveryRate).filter((r): r is number => typeof r === 'number' && !isNaN(r));
  const avgOtd =
    validOtd.length > 0
      ? Math.round(validOtd.reduce((acc, curr) => acc + curr, 0) / validOtd.length)
      : 96;

  const validDefectRates = suppliers.map((s) => s.defectRatePercent).filter((d): d is number => typeof d === 'number' && !isNaN(d));
  const avgDefectRate =
    validDefectRates.length > 0
      ? Number((validDefectRates.reduce((acc, curr) => acc + curr, 0) / validDefectRates.length).toFixed(1))
      : 1.8;

  const categoriesCount = new Set(suppliers.map((s) => s.category).filter(Boolean)).size;

  return {
    total,
    approved,
    provisional,
    auditPending,
    blacklisted,
    avgAuditScore,
    avgOtd,
    avgDefectRate,
    categoriesCount,
  };
}

/**
 * Download Sub-Supplier CSV
 */
export function downloadSubSupplierCsv(
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
 * Export printable PDF Sub-Supplier Master Register
 */
export function exportSubSupplierSummaryPdf(
  suppliers: SubSupplier[],
  scopeLabel: string = 'All Sub-Suppliers & Mills'
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF report.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'sub_supplier', 'register');
    const kpis = computeSubSupplierKpis(suppliers);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      new Date().toISOString().split('T')[0],
      config.department
    );

    const docCode = config.fullDocCode;

    const rowsHtml = suppliers
      .map(
        (s, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 7px 8px; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
          <td style="padding: 7px 8px; font-weight: 700; color: #1e3a8a; font-family: monospace;">${s.code}</td>
          <td style="padding: 7px 8px; font-weight: 700; color: #0f172a;">
            ${s.name}
            <div style="font-size: 9px; color: #64748b; font-weight: normal;">${s.facilityLocation || s.country}</div>
          </td>
          <td style="padding: 7px 8px; font-weight: 600; color: #0369a1;">
            ${s.category.replace(/_/g, ' ')}
          </td>
          <td style="padding: 7px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 800; ${
              s.qualityRating === 'A+' || s.qualityRating === 'A'
                ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;'
                : s.qualityRating === 'B'
                ? 'background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;'
                : 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'
            }">
              ${s.qualityRating}
            </span>
          </td>
          <td style="padding: 7px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 9px; font-weight: 700; ${
              s.complianceStatus === 'APPROVED'
                ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;'
                : s.complianceStatus === 'PROVISIONAL'
                ? 'background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;'
                : s.complianceStatus === 'AUDIT_PENDING'
                ? 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'
                : 'background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3;'
            }">
              ${s.complianceStatus.replace(/_/g, ' ')}
            </span>
          </td>
          <td style="padding: 7px 8px; font-family: monospace; font-size: 11px; text-align: center; font-weight: 700; color: #0f172a;">
            ${s.auditScore}%
          </td>
          <td style="padding: 7px 8px; font-size: 10px; color: #334155;">
            <div style="font-weight: 600;">${s.contactPerson}</div>
            <div style="font-size: 9px; color: #64748b;">${s.email} • ${s.phone}</div>
          </td>
          <td style="padding: 7px 8px; font-size: 10px; color: #475569; text-align: right; font-family: monospace;">
            ${s.lastAuditDate || 'Pending'}
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
        <title>Sub-Supplier Master Register - ${docCode}</title>
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
          <div><strong>Generated:</strong> ${new Date().toLocaleString()} • Authorized Sourcing QMS Document</div>
        </div>

        <div class="kpi-strip">
          <div class="kpi-card">
            <div class="kpi-val" style="color: #1e3a8a;">${kpis.total}</div>
            <div class="kpi-lbl">Total Suppliers</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #15803d;">${kpis.approved}</div>
            <div class="kpi-lbl">Approved Mills</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #0284c7;">${kpis.provisional}</div>
            <div class="kpi-lbl">Provisional Status</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #d97706;">${kpis.auditPending}</div>
            <div class="kpi-lbl">Audit Pending</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #7c3aed;">${kpis.avgAuditScore}%</div>
            <div class="kpi-lbl">Avg Audit Score</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #0f172a;">${kpis.avgOtd}%</div>
            <div class="kpi-lbl">Avg On-Time Delivery</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th style="width: 85px;">Mill Code</th>
              <th>Supplier Name & Facility</th>
              <th>Material Category</th>
              <th style="width: 65px; text-align: center;">Grade</th>
              <th style="width: 95px; text-align: center;">Status</th>
              <th style="width: 75px; text-align: center;">Audit %</th>
              <th>Key Contact & Details</th>
              <th style="width: 85px; text-align: right;">Last Audit</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Head of Supply Chain & Sourcing</div>
            <div class="sign-sub">Vendor Onboarding & Qualification</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Senior Auditor - Social & Technical Compliance</div>
            <div class="sign-sub">ISO 9001 / WRAP / HIGG Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Managing Director / COO</div>
            <div class="sign-sub">Approved Vendor List Sign-off</div>
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
    console.error('Failed to export Sub-Supplier PDF:', err);
  }
}

/**
 * Export styled Excel (.xls) summary of Sub-Supplier register
 */
export function exportSubSupplierSummaryExcel(
  suppliers: SubSupplier[],
  fileName: string = 'Sub_Supplier_Master_Register'
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.supplierRegister || 'SUP-REG'}`;
    const kpis = computeSubSupplierKpis(suppliers);

    const rowsHtml = suppliers
      .map(
        (s, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="font-weight: bold; border: 1px solid #cbd5e1; font-family: monospace;">${s.code}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold;">${s.name}</td>
          <td style="border: 1px solid #cbd5e1;">${s.category.replace(/_/g, ' ')}</td>
          <td style="border: 1px solid #cbd5e1;">${s.country}</td>
          <td style="border: 1px solid #cbd5e1;">${s.facilityLocation || 'N/A'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold;">${s.qualityRating}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; ${
            s.complianceStatus === 'APPROVED'
              ? 'background-color: #dcfce7; color: #15803d;'
              : s.complianceStatus === 'PROVISIONAL'
              ? 'background-color: #e0f2fe; color: #0284c7;'
              : s.complianceStatus === 'AUDIT_PENDING'
              ? 'background-color: #fef3c7; color: #b45309;'
              : 'background-color: #ffe4e6; color: #be123c;'
          }">
            ${s.complianceStatus.replace(/_/g, ' ')}
          </td>
          <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold;">${s.auditScore}%</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${s.leadTimeDays} Days</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${s.onTimeDeliveryRate || 95}%</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${s.defectRatePercent || 1.5}%</td>
          <td style="border: 1px solid #cbd5e1;">${s.contactPerson}</td>
          <td style="border: 1px solid #cbd5e1;">${s.email}</td>
          <td style="border: 1px solid #cbd5e1;">${s.phone}</td>
          <td style="border: 1px solid #cbd5e1;">${s.assignedQALead || 'N/A'}</td>
          <td style="text-align: right; border: 1px solid #cbd5e1;">${s.lastAuditDate || 'N/A'}</td>
          <td style="text-align: right; border: 1px solid #cbd5e1;">${s.nextAuditDate || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1;">${(s.certifications || []).join(', ') || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1;">${(s.materialsSupplied || []).join(', ') || 'N/A'}</td>
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
                <x:Name>Sub-Suppliers Register</x:Name>
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
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'} - SUB-SUPPLIER & MILL REGISTER
            </td>
          </tr>
          <tr>
            <td colspan="20" style="font-size: 11px; color: #475569; padding-bottom: 10px;">
              Doc Code: ${docCode} | Exported: ${new Date().toLocaleString()} | Approved Vendor List
            </td>
          </tr>
          <tr>
            <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1;">Total Suppliers: ${kpis.total}</td>
            <td colspan="3" style="background-color: #dcfce7; font-weight: bold; border: 1px solid #cbd5e1; color: #15803d;">Approved: ${kpis.approved}</td>
            <td colspan="3" style="background-color: #e0f2fe; font-weight: bold; border: 1px solid #cbd5e1; color: #0284c7;">Provisional: ${kpis.provisional}</td>
            <td colspan="3" style="background-color: #fef3c7; font-weight: bold; border: 1px solid #cbd5e1; color: #b45309;">Audit Pending: ${kpis.auditPending}</td>
            <td colspan="4" style="background-color: #f3e8ff; font-weight: bold; border: 1px solid #cbd5e1; color: #7c3aed;">Avg Audit: ${kpis.avgAuditScore}%</td>
            <td colspan="4" style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; color: #0f172a;">Avg OTD: ${kpis.avgOtd}%</td>
          </tr>
          <tr><td colspan="20"></td></tr>
          <tr style="background-color: #1e3a8a; color: white; font-weight: bold; text-align: left;">
            <th style="border: 1px solid #0f172a; padding: 6px;">#</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Supplier Code</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Supplier Name</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Category</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Country</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Facility Location</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Quality Rating</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Compliance Status</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Audit Score</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Lead Time</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">OTD Rate</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Defect Rate</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Contact Person</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Email</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Phone</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Assigned QA</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Last Audit</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Next Audit</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Certifications</th>
            <th style="border: 1px solid #0f172a; padding: 6px;">Materials Supplied</th>
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
    console.error('Failed to export Sub-Supplier Excel:', err);
  }
}

/**
 * Export official Supplier Qualification & Audit Profile (PDF)
 */
export function exportSingleSupplierPdf(supplier: SubSupplier): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable profile.');
      return;
    }

    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'sub_supplier', 'single', supplier.code);

    const dynamicHeaderHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      new Date().toISOString().split('T')[0],
      config.department
    );

    const docCode = config.fullDocCode;

    const isApproved = supplier.complianceStatus === 'APPROVED';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Supplier Dossier - ${supplier.code}</title>
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
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 20px;
            margin: 16px 0;
          }
          .status-badge {
            font-size: 15px;
            font-weight: 800;
            padding: 5px 16px;
            border-radius: 9999px;
            letter-spacing: 0.5px;
            ${
              isApproved
                ? 'background: #15803d; color: white;'
                : supplier.complianceStatus === 'PROVISIONAL'
                ? 'background: #0284c7; color: white;'
                : supplier.complianceStatus === 'AUDIT_PENDING'
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
          .chips-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 6px;
          }
          .chip {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
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
              Approved Vendor Dossier & Mill Profile
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 2px;">
              ${supplier.name}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              Code: <strong style="font-family: monospace;">${supplier.code}</strong> • Category: <strong>${supplier.category.replace(/_/g, ' ')}</strong> • Country: <strong>${supplier.country}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="status-badge">${supplier.complianceStatus.replace(/_/g, ' ')}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 700;">
              Quality Rating: <span style="color: #1e3a8a; font-size: 14px;">${supplier.qualityRating}</span>
            </div>
          </div>
        </div>

        <div class="section-title">1. Organization & Contact Identification</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Vendor Code:</span>
            <span class="data-value" style="font-family: monospace;">${supplier.code}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Supplier Category:</span>
            <span class="data-value">${supplier.category.replace(/_/g, ' ')}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Country & Location:</span>
            <span class="data-value">${supplier.facilityLocation || supplier.country}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Key Contact Person:</span>
            <span class="data-value">${supplier.contactPerson}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Official Email:</span>
            <span class="data-value">${supplier.email}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Direct Phone:</span>
            <span class="data-value">${supplier.phone}</span>
          </div>
        </div>

        <div class="section-title">2. Quality Audit & Compliance Performance</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Audit Score Rating:</span>
            <span class="data-value" style="color: #15803d; font-size: 13px;">${supplier.auditScore}%</span>
          </div>
          <div class="data-item">
            <span class="data-label">Vendor Quality Tier:</span>
            <span class="data-value">Grade ${supplier.qualityRating}</span>
          </div>
          <div class="data-item">
            <span class="data-label">On-Time Delivery Rate:</span>
            <span class="data-value">${supplier.onTimeDeliveryRate || 96}%</span>
          </div>
          <div class="data-item">
            <span class="data-label">Factory Defect Rate:</span>
            <span class="data-value">${supplier.defectRatePercent || 1.8}%</span>
          </div>
          <div class="data-item">
            <span class="data-label">Last Audit Performed:</span>
            <span class="data-value">${supplier.lastAuditDate || 'Initial Onboarding'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Next Scheduled Audit:</span>
            <span class="data-value">${supplier.nextAuditDate || 'Annual Review'}</span>
          </div>
        </div>

        <div class="section-title">3. Capacity, Terms & Assigned QA Governance</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Monthly Production Capacity:</span>
            <span class="data-value">${supplier.capacityPerMonth || '850,000 Yds / Units'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Standard Lead Time:</span>
            <span class="data-value">${supplier.leadTimeDays} Calendar Days</span>
          </div>
          <div class="data-item">
            <span class="data-label">Minimum Order Quantity (MOQ):</span>
            <span class="data-value">${supplier.moq || '1,000 Pcs / Yds'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Commercial Payment Terms:</span>
            <span class="data-value">${supplier.paymentTerms || 'LC at 60 Days'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Assigned QA Lead:</span>
            <span class="data-value">${supplier.assignedQALead || 'Central Mill QA Team'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">QA Lead Contact:</span>
            <span class="data-value">${supplier.assignedQAEmail || 'vendor.qa@valiantgarments.com'}</span>
          </div>
        </div>

        <div class="section-title">4. Accredited Certifications</div>
        <div class="chips-container">
          ${(supplier.certifications && supplier.certifications.length > 0
            ? supplier.certifications
            : ['OEKO-TEX Standard 100', 'GOTS Organic', 'ISO 9001:2015', 'ZDHC Level 3', 'GRS Global Recycled']
          )
            .map((cert) => `<div class="chip">✓ ${cert}</div>`)
            .join('')}
        </div>

        <div class="section-title">5. Core Materials & Items Supplied</div>
        <div class="chips-container">
          ${(supplier.materialsSupplied && supplier.materialsSupplied.length > 0
            ? supplier.materialsSupplied
            : ['Single Jersey Cotton', 'CVC Fleece', 'Rib 1x1 Elastane', 'French Terry']
          )
            .map((mat) => `<div class="chip" style="background: #f1f5f9; color: #334155; border-color: #cbd5e1;">• ${mat}</div>`)
            .join('')}
        </div>

        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Vendor Compliance Officer</div>
            <div class="sign-sub">Technical Verification</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Head of Supply Chain</div>
            <div class="sign-sub">Procurement Governance</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-title">Quality Assurance Director</div>
            <div class="sign-sub">Approved Vendor List Sign-off</div>
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
    console.error('Failed to export Single Sub-Supplier PDF:', err);
  }
}

/**
 * Export single supplier details as Excel workbook
 */
export function exportSingleSupplierExcel(supplier: SubSupplier): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const docCode = `${pdfSettings.docCodePrefix || 'VAL'}-${pdfSettings.recordDocCodes?.supplierAudit || 'SUP-AUD'}`;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Supplier Dossier</x:Name>
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
              ${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'} - VENDOR DOSSIER
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 11px; color: #475569; padding-bottom: 12px;">
              Doc Code: ${docCode} | Vendor: ${supplier.name} (${supplier.code}) | Date: ${new Date().toLocaleDateString()}
            </td>
          </tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">1. SUPPLIER IDENTIFICATION</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Vendor Code:</td>
            <td style="border: 1px solid #cbd5e1; font-family: monospace; width: 25%;">${supplier.code}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Supplier Name:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; width: 25%;">${supplier.name}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Category:</td>
            <td style="border: 1px solid #cbd5e1;">${supplier.category.replace(/_/g, ' ')}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Country / Location:</td>
            <td style="border: 1px solid #cbd5e1;">${supplier.facilityLocation || supplier.country}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Contact Person:</td>
            <td style="border: 1px solid #cbd5e1;">${supplier.contactPerson}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Email & Phone:</td>
            <td style="border: 1px solid #cbd5e1;">${supplier.email} / ${supplier.phone}</td>
          </tr>
          <tr><td colspan="4"></td></tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px;">2. QUALITY & COMPLIANCE METRICS</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Quality Rating:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; font-size: 13px;">${supplier.qualityRating}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Compliance Status:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold;">${supplier.complianceStatus.replace(/_/g, ' ')}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Audit Score:</td>
            <td style="border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px;">${supplier.auditScore}%</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Lead Time Days:</td>
            <td style="border: 1px solid #cbd5e1;">${supplier.leadTimeDays} Days</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">On-Time Delivery Rate:</td>
            <td style="border: 1px solid #cbd5e1;">${supplier.onTimeDeliveryRate || 96}%</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Defect Rate %:</td>
            <td style="border: 1px solid #cbd5e1;">${supplier.defectRatePercent || 1.8}%</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Last Audit Date:</td>
            <td style="border: 1px solid #cbd5e1;">${supplier.lastAuditDate || 'N/A'}</td>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Next Audit Date:</td>
            <td style="border: 1px solid #cbd5e1;">${supplier.nextAuditDate || 'N/A'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Certifications:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1;">${(supplier.certifications || []).join(', ')}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1;">Materials Supplied:</td>
            <td colspan="3" style="border: 1px solid #cbd5e1;">${(supplier.materialsSupplied || []).join(', ')}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Supplier_Profile_${supplier.code}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    console.error('Failed to export Single Supplier Excel:', err);
  }
}
