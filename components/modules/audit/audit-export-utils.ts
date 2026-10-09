import { QualityAudit, AuditChecklistItem } from '@/lib/types/modules';
import { loadPdfHeaderSettings, renderPdfHeaderHtml, getModuleExportConfig } from '@/lib/pdf/pdf-header-store';

export type FooterSignatureMode = 'dual' | 'triple' | 'none';

export interface ExportPdfOptions {
  signatureMode?: FooterSignatureMode;
  includeChecklist?: boolean;
  includePhotos?: boolean;
  includeRemarks?: boolean;
}


// -------------------------------------------------------------
// KPI COMPUTATIONS FOR AUDIT MODULE
// -------------------------------------------------------------

export function computeAuditKpis(audits: QualityAudit[]) {
  const totalAudits = audits.length;

  const totalScoreSum = audits.reduce(
    (sum, a) => sum + (a.obtainedMarks ?? a.scorePercentage ?? 0),
    0
  );
  const avgScore =
    totalAudits > 0 ? (totalScoreSum / totalAudits).toFixed(1) : '0.0';

  const passedCount = audits.filter((a) => {
    const hasCritical = (a.criticalNCs ?? 0) > 0;
    if (hasCritical) return false;
    return a.isPassed !== undefined
      ? a.isPassed
      : (a.obtainedMarks ?? a.scorePercentage ?? 0) >= (a.passMarks ?? 80);
  }).length;

  const passRate =
    totalAudits > 0 ? Math.round((passedCount / totalAudits) * 100) : 0;

  const totalNCs = audits.reduce((sum, a) => sum + (a.nonConformancesCount || 0), 0);
  const totalCritical = audits.reduce((sum, a) => sum + (a.criticalNCs || 0), 0);
  const totalMajor = audits.reduce((sum, a) => sum + (a.majorNCs || 0), 0);
  const totalMinor = audits.reduce((sum, a) => sum + (a.minorNCs || 0), 0);

  const internalCount = audits.filter(
    (a) =>
      a.auditCategory === 'INTERNAL' ||
      a.auditType === 'INTERNAL' ||
      a.auditType === 'INTERNAL_QMS'
  ).length;

  const externalCount = audits.filter(
    (a) =>
      a.auditCategory === 'EXTERNAL' ||
      a.auditType === 'EXTERNAL' ||
      a.auditType === 'BUYER_TECHNICAL' ||
      a.auditType === 'SOCIAL_COMPLIANCE' ||
      a.auditType === 'SUSTAINABILITY'
  ).length;

  const subSupplierCount = audits.filter(
    (a) => a.auditCategory === 'SUB_SUPPLIER' || a.auditType === 'SUB_SUPPLIER'
  ).length;

  const scheduledCount = audits.filter((a) => a.nextAuditDate).length;

  return {
    totalAudits,
    avgScore,
    passedCount,
    failedCount: totalAudits - passedCount,
    passRate,
    totalNCs,
    totalCritical,
    totalMajor,
    totalMinor,
    internalCount,
    externalCount,
    subSupplierCount,
    scheduledCount,
  };
}

// -------------------------------------------------------------
// SIGNATURES FOOTER RENDERER
// -------------------------------------------------------------

function renderFooterSignaturesHtml(mode: FooterSignatureMode = 'triple'): string {
  if (mode === 'none') return '';

  if (mode === 'triple') {
    return `
      <div style="margin-top: 26px; padding-top: 14px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="text-align: center;">
          <div style="height: 38px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
          <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Lead Quality Auditor</div>
          <div style="font-size: 7.5px; color: #64748b;">Inspection &amp; Assessment Lead</div>
        </div>
        <div style="text-align: center;">
          <div style="height: 38px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
          <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">QA &amp; Compliance Manager</div>
          <div style="font-size: 7.5px; color: #64748b;">Quality Management Systems (QMS)</div>
        </div>
        <div style="text-align: center;">
          <div style="height: 38px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
          <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Managing Director / Factory GM</div>
          <div style="font-size: 7.5px; color: #64748b;">Enterprise Governance &amp; Factory Ops</div>
        </div>
      </div>
    `;
  }

  return `
    <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="text-align: center;">
        <div style="height: 36px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
        <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Audited &amp; Verified By: Lead Auditor</div>
        <div style="font-size: 7.5px; color: #64748b;">Quality Assurance Division</div>
      </div>
      <div style="text-align: center;">
        <div style="height: 36px; border-bottom: 1px dashed #94a3b8; margin-bottom: 5px;"></div>
        <div style="font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Authorized By: Factory Head / GM</div>
        <div style="font-size: 7.5px; color: #64748b;">Plant Operations &amp; Compliance</div>
      </div>
    </div>
  `;
}

// =============================================================
// 1. GLOBAL AUDIT REGISTER EXPORT (PDF & EXCEL)
// =============================================================

export function exportAuditSummaryPdf(
  audits: QualityAudit[],
  scopeLabel: string = 'All Records',
  options?: ExportPdfOptions
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const exportConfig = getModuleExportConfig(pdfSettings, 'audit', 'register');
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      exportConfig.title,
      exportConfig.fullDocCode,
      dateStr,
      exportConfig.department
    );

    const kpis = computeAuditKpis(audits);

    const rowsHtml = audits
      .map((a, idx) => {
        const scoreVal = a.obtainedMarks ?? a.scorePercentage ?? 0;
        const hasCritical = (a.criticalNCs ?? 0) > 0;
        const pass =
          !hasCritical &&
          (a.isPassed !== undefined ? a.isPassed : scoreVal >= (a.passMarks ?? 80));

        const targetScope =
          a.supplierName || a.auditeeDepartment || 'Factory Wide Operations';

        return `
          <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
            <td style="text-align: center; font-family: monospace; font-size: 8px; color: #64748b;">${idx + 1}</td>
            <td style="font-family: monospace; font-size: 8px; font-weight: 700; color: #1e3a8a;">${a.auditCode}</td>
            <td style="font-size: 8px; font-weight: 600; color: #1e293b;">
              ${a.standard}
              <span style="font-size: 7.5px; color: #64748b; display: block;">${a.auditType}</span>
            </td>
            <td style="font-size: 8px; color: #334155;">
              <strong>${targetScope}</strong>
              ${a.subSupplierCode ? `<span style="font-size: 7.5px; color: #047857; display: block;">Vendor Ref: ${a.subSupplierCode}</span>` : ''}
            </td>
            <td style="font-size: 8px; color: #475569;">
              ${a.auditorName}
              <span style="font-size: 7.5px; color: #64748b; display: block;">${a.auditorOrganization || 'QA Team'}</span>
            </td>
            <td style="font-size: 8px; font-family: monospace; color: #334155;">${a.auditDate}</td>
            <td style="text-align: center; font-family: monospace; font-size: 8.5px; font-weight: 800; color: ${
              hasCritical ? '#b91c1c' : pass ? '#047857' : '#b45309'
            };">
              ${scoreVal}%
            </td>
            <td style="text-align: center; font-family: monospace; font-size: 8px; font-weight: 700; color: ${
              (a.criticalNCs || 0) > 0 ? '#b91c1c' : '#64748b'
            };">${a.criticalNCs || 0}</td>
            <td style="text-align: center; font-family: monospace; font-size: 8px; font-weight: 600; color: #b45309;">${a.majorNCs || 0}</td>
            <td style="text-align: center; font-family: monospace; font-size: 8px; color: #475569;">${a.minorNCs || 0}</td>
            <td style="text-align: center; font-size: 7.5px;">
              <span style="display: inline-block; padding: 1.5px 5px; border-radius: 3px; font-weight: 700; background: ${
                hasCritical
                  ? '#fee2e2; color: #991b1b; border: 1px solid #fca5a5'
                  : pass
                  ? '#ecfdf5; color: #047857; border: 1px solid #a7f3d0'
                  : '#fef3c7; color: #b45309; border: 1px solid #fde68a'
              };">
                ${hasCritical ? 'CRITICAL FAIL' : pass ? 'PASS (≥80)' : 'FAIL (<80)'}
              </span>
            </td>
            <td style="font-size: 7.5px; font-family: monospace; color: #64748b;">${a.nextAuditDate || '-'}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Quality Audits Register - ${scopeLabel}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 8.5px;
              line-height: 1.35;
              background: #ffffff;
            }
            .meta-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 5px 12px;
              margin: 8px 0;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 6px;
              margin-bottom: 12px;
            }
            .kpi-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px 8px;
              text-align: center;
            }
            .kpi-lbl {
              font-size: 7px;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .kpi-val {
              font-size: 11.5px;
              font-weight: 800;
              margin-top: 1px;
              font-family: monospace;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
            }
            th {
              background: #1e293b;
              color: #ffffff;
              padding: 5px 4px;
              text-align: left;
              font-size: 7.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            td {
              padding: 4px;
            }
            .footer-note {
              margin-top: 14px;
              font-size: 7.5px;
              color: #64748b;
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #e2e8f0;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div class="meta-bar">
            <div>
              <strong>REPORT SCOPE:</strong> ${scopeLabel} &bull; 
              <strong>TOTAL AUDITS:</strong> ${audits.length} Records &bull;
              <strong>PASSING BENCHMARK:</strong> 80 Marks &bull; No Critical NC
            </div>
            <div>
              <strong>PRINT DATE:</strong> ${dateStr} &bull; 
              <strong>STATUS:</strong> Live Compliance Verified
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-lbl">Total Audits</div>
              <div class="kpi-val" style="color: #1e3a8a;">${kpis.totalAudits} Audits</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Average Score</div>
              <div class="kpi-val" style="color: #0284c7;">${kpis.avgScore}%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Pass Rate (≥80)</div>
              <div class="kpi-val" style="color: #047857;">${kpis.passRate}%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Critical NCs</div>
              <div class="kpi-val" style="color: #b91c1c;">${kpis.totalCritical} Crit</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Major NCs</div>
              <div class="kpi-val" style="color: #b45309;">${kpis.totalMajor} Major</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">Scheduled Follow-ups</div>
              <div class="kpi-val" style="color: #7c3aed;">${kpis.scheduledCount} Audits</div>
            </div>
          </div>

          <div style="margin-bottom: 6px; font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; display: flex; justify-content: space-between;">
            <span>Factory Quality &amp; Compliance Audit Assessment Log</span>
            <span style="font-size: 8.5px; color: #64748b; font-weight: 600;">Table of ${audits.length} Audit Records</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 85px;">Audit Code</th>
                <th style="width: 140px;">Standard &amp; Type</th>
                <th>Auditee Scope / Sub-Supplier</th>
                <th style="width: 120px;">Lead Auditor</th>
                <th style="width: 70px;">Audit Date</th>
                <th style="text-align: center; width: 65px;">Score %</th>
                <th style="text-align: center; width: 45px;">Crit</th>
                <th style="text-align: center; width: 45px;">Maj</th>
                <th style="text-align: center; width: 45px;">Min</th>
                <th style="text-align: center; width: 85px;">Verdict</th>
                <th style="width: 75px;">Next Due</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          ${renderFooterSignaturesHtml(options?.signatureMode || 'triple')}

          <div class="footer-note">
            <span>Project ULTRA ERP &bull; Quality Audits &amp; Compliance Management</span>
            <span>Live System Generated Record &bull; Page 1 of 1</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  } catch (err) {
    console.error('Failed to export audit summary PDF:', err);
  }
}

export function exportAuditSummaryExcel(
  audits: QualityAudit[],
  scopeLabel: string = 'All Records'
): void {
  try {
    const kpis = computeAuditKpis(audits);
    const dateStr = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();

    const auditRows = audits
      .map((a) => {
        const scoreVal = a.obtainedMarks ?? a.scorePercentage ?? 0;
        const hasCritical = (a.criticalNCs ?? 0) > 0;
        const pass =
          !hasCritical &&
          (a.isPassed !== undefined ? a.isPassed : scoreVal >= (a.passMarks ?? 80));

        return `
          <tr>
            <td>${a.auditCode}</td>
            <td>${a.auditType}</td>
            <td>${a.auditCategory || 'INTERNAL'}</td>
            <td>${a.standard}</td>
            <td>${a.auditorName}</td>
            <td>${a.auditorOrganization || 'QA Team'}</td>
            <td>${a.supplierName || a.auditeeDepartment || 'Factory Wide Operations'}</td>
            <td>${a.subSupplierCode || ''}</td>
            <td>${a.auditDate}</td>
            <td>${scoreVal}</td>
            <td>${hasCritical ? 'CRITICAL FAIL' : pass ? 'PASS' : 'FAIL'}</td>
            <td>${a.nonConformancesCount || 0}</td>
            <td>${a.criticalNCs || 0}</td>
            <td>${a.majorNCs || 0}</td>
            <td>${a.minorNCs || 0}</td>
            <td>${a.observations || 0}</td>
            <td>${a.verdict}</td>
            <td>${a.nextAuditDate || ''}</td>
            <td>${a.executiveSummary || ''}</td>
          </tr>
        `;
      })
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 11pt; }
            th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            td { border: 1px solid #e2e8f0; padding: 5px; }
            .kpi-hdr { background-color: #f1f5f9; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}</h2>
          <h3>QUALITY AUDITS &amp; COMPLIANCE ASSESSMENT REGISTER</h3>
          <p><strong>Export Scope:</strong> ${scopeLabel} | <strong>Export Date:</strong> ${dateStr} | <strong>Total Audits:</strong> ${audits.length}</p>

          <table border="1">
            <tr class="kpi-hdr">
              <th>Total Audits</th>
              <th>Average Score %</th>
              <th>Passed Count</th>
              <th>Pass Rate %</th>
              <th>Total NCs</th>
              <th>Critical NCs</th>
              <th>Major NCs</th>
              <th>Minor NCs</th>
            </tr>
            <tr>
              <td>${kpis.totalAudits}</td>
              <td>${kpis.avgScore}%</td>
              <td>${kpis.passedCount}</td>
              <td>${kpis.passRate}%</td>
              <td>${kpis.totalNCs}</td>
              <td>${kpis.totalCritical}</td>
              <td>${kpis.totalMajor}</td>
              <td>${kpis.totalMinor}</td>
            </tr>
          </table>

          <br/>
          <h3>Quality Audits Master Assessment Log</h3>
          <table border="1">
            <tr style="background-color: #1e3a8a; color: #ffffff;">
              <th>Audit Code</th>
              <th>Audit Type</th>
              <th>Category</th>
              <th>Standard</th>
              <th>Lead Auditor</th>
              <th>Auditor Organization</th>
              <th>Auditee Department / Supplier</th>
              <th>Vendor Code</th>
              <th>Audit Date</th>
              <th>Score Marks</th>
              <th>Result</th>
              <th>Total NCs</th>
              <th>Critical NCs</th>
              <th>Major NCs</th>
              <th>Minor NCs</th>
              <th>Observations</th>
              <th>Verdict</th>
              <th>Next Audit Date</th>
              <th>Executive Summary</th>
            </tr>
            ${auditRows}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quality_Audits_Register_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export audit summary Excel:', err);
  }
}

// =============================================================
// 2. INDIVIDUAL QUALITY AUDIT REPORT EXPORTS (PDF & EXCEL)
// =============================================================

export function exportSingleAuditPdf(
  audit: QualityAudit,
  options?: ExportPdfOptions
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const exportConfig = getModuleExportConfig(pdfSettings, 'audit', 'single', audit.auditCode);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      `${exportConfig.title}: ${audit.auditCode}`,
      exportConfig.fullDocCode,
      dateStr,
      `${exportConfig.department} • ${audit.auditType}`
    );

    const scoreVal = audit.obtainedMarks ?? audit.scorePercentage ?? 0;
    const hasCritical = (audit.criticalNCs ?? 0) > 0;
    const isPassed =
      !hasCritical &&
      (audit.isPassed !== undefined ? audit.isPassed : scoreVal >= (audit.passMarks ?? 80));

    const checklist = audit.checklist || [];

    // Collect all evidence photos across all questions
    const allEvidencePhotos: {
      url: string;
      caption?: string;
      timestamp?: string;
      clauseNumber: string;
      subClauseTitle: string;
      status: string;
    }[] = [];

    checklist.forEach((q) => {
      const pList =
        q.evidencePhotos && q.evidencePhotos.length > 0
          ? q.evidencePhotos
          : q.evidencePhoto
          ? [{ id: `p-${q.id}`, url: q.evidencePhoto, caption: q.remark || '', timestamp: q.photoTimestamp }]
          : [];

      pList.forEach((p) => {
        allEvidencePhotos.push({
          url: p.url,
          caption: p.caption,
          timestamp: p.timestamp,
          clauseNumber: q.clauseNumber,
          subClauseTitle: q.subClauseTitle || q.clause,
          status: q.status,
        });
      });
    });

    const checklistRowsHtml = checklist
      .map((q, idx) => {
        const qPhotos =
          q.evidencePhotos && q.evidencePhotos.length > 0
            ? q.evidencePhotos
            : q.evidencePhoto
            ? [{ id: `p-${q.id}`, url: q.evidencePhoto, caption: q.remark || '', timestamp: q.photoTimestamp }]
            : [];

        const qPhotosHtml =
          options?.includePhotos !== false && qPhotos.length > 0
            ? `
            <div style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;">
              ${qPhotos
                .map(
                  (p, pIdx) => `
                <div style="border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; background: #ffffff; width: 60px; box-shadow: 0 1px 2px rgba(0,0,0,0.06);">
                  <img src="${p.url}" alt="Evidence ${pIdx + 1}" style="width: 60px; height: 42px; object-fit: cover; display: block;" onerror="this.style.display='none'" />
                  ${
                    p.caption
                      ? `<div style="font-size: 6px; line-height: 1.1; color: #475569; padding: 1.5px 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60px;" title="${p.caption}">${p.caption}</div>`
                      : ''
                  }
                </div>
              `
                )
                .join('')}
            </div>
          `
            : '';

        return `
        <tr style="border-bottom: 1px solid #f1f5f9; ${
          q.status === 'CRITICAL_NC'
            ? 'background-color: #fff1f2;'
            : q.status === 'MAJOR_NC'
            ? 'background-color: #fef2f2;'
            : q.status === 'MINOR_NC'
            ? 'background-color: #fffbeb;'
            : idx % 2 === 1
            ? 'background-color: #f8fafc;'
            : ''
        }">
          <td style="text-align: center; font-family: monospace; font-size: 8px; color: #64748b;">${idx + 1}</td>
          <td style="font-family: monospace; font-size: 8px; font-weight: 700; color: #1e3a8a;">${q.clauseNumber}</td>
          <td style="font-size: 8px; color: #0f172a;">
            <strong>${q.subClauseTitle || q.clause}</strong>
            <span style="font-size: 7.5px; color: #475569; display: block; margin-top: 1px;">${q.question}</span>
            ${q.guidance ? `<span style="font-size: 7px; color: #64748b; display: block; font-style: italic;">Verification: ${q.guidance}</span>` : ''}
          </td>
          <td style="text-align: center; font-family: monospace; font-size: 8px; font-weight: 700;">${q.score} / ${q.maxScore}</td>
          <td style="text-align: center; font-size: 7.5px;">
            <span style="display: inline-block; padding: 1.5px 5px; border-radius: 3px; font-weight: 700; background: ${
              q.status === 'CONFORMITY'
                ? '#ecfdf5; color: #047857; border: 1px solid #a7f3d0'
                : q.status === 'CRITICAL_NC'
                ? '#fee2e2; color: #991b1b; border: 1px solid #fca5a5'
                : q.status === 'MAJOR_NC'
                ? '#fee2e2; color: #b91c1c; border: 1px solid #fecaca'
                : q.status === 'MINOR_NC'
                ? '#fef3c7; color: #b45309; border: 1px solid #fde68a'
                : '#f1f5f9; color: #475569; border: 1px solid #cbd5e1'
            };">
              ${q.status.replace('_', ' ')}
            </span>
          </td>
          <td style="font-size: 7.5px; color: #334155;">
            <div>${q.remark || '-'}</div>
            ${qPhotosHtml}
          </td>
        </tr>
      `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Audit Report - ${audit.auditCode}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 9px;
              line-height: 1.35;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 12px;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 9px 11px;
              background: #f8fafc;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .card-title {
              font-size: 9.5px;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
              font-size: 8.5px;
            }
            .item-lbl {
              color: #64748b;
              font-weight: 600;
            }
            .item-val {
              font-weight: 700;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 8px;
            }
            th {
              background: #1e293b;
              color: white;
              padding: 5px 4px;
              text-align: left;
              font-size: 7.5px;
              text-transform: uppercase;
            }
            td {
              padding: 4px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
            }
            @media print {
              img {
                max-width: 100% !important;
                page-break-inside: avoid;
              }
              .photo-grid {
                page-break-inside: auto;
              }
              .photo-card {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${headerHtml}

          <!-- Verdict Banner -->
          <div style="background: ${
            hasCritical ? '#fff1f2' : isPassed ? '#ecfdf5' : '#fffbeb'
          }; border: 1.5px solid ${
      hasCritical ? '#fecdd3' : isPassed ? '#a7f3d0' : '#fef08a'
    }; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace;">
                ${audit.auditCode} &bull; ${audit.standard}
              </div>
              <div style="font-size: 9px; color: #475569; margin-top: 2px;">
                Auditee: <strong>${audit.supplierName || audit.auditeeDepartment || 'Factory Operations'}</strong>
                &bull; Lead Auditor: <strong>${audit.auditorName}</strong> (${audit.auditorOrganization || 'QA Team'})
              </div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 5px; font-weight: 900; font-size: 10px; background: ${
                hasCritical ? '#b91c1c' : isPassed ? '#047857' : '#b45309'
              }; color: #ffffff;">
                ${hasCritical ? 'FAILED (CRITICAL NC)' : isPassed ? 'PASSED (≥80 MARKS)' : 'FAILED / ACTION REQ.'}
              </span>
              <div style="font-size: 11px; font-family: monospace; font-weight: 800; color: ${
                hasCritical ? '#b91c1c' : isPassed ? '#047857' : '#b45309'
              }; margin-top: 2px;">
                Score: ${scoreVal}% (${scoreVal} / 100 Marks)
              </div>
            </div>
          </div>

          <div class="grid-2">
            <!-- Audit Metadata Card -->
            <div class="card">
              <div class="card-title">Audit Scope &amp; Specifications</div>
              <div class="item-row">
                <span class="item-lbl">Audit Category:</span>
                <span class="item-val">${audit.auditCategory || audit.auditType}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Standard Reference:</span>
                <span class="item-val">${audit.standard}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Audit Execution Date:</span>
                <span class="item-val font-mono">${audit.auditDate}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Next Recertification Due:</span>
                <span class="item-val font-mono" style="color: #1d4ed8;">${audit.nextAuditDate || 'TBD'}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Vendor / Sub-Supplier Ref:</span>
                <span class="item-val font-mono">${audit.subSupplierCode || 'Direct Facility'}</span>
              </div>
            </div>

            <!-- Findings Breakdown Card -->
            <div class="card">
              <div class="card-title">Non-Conformance (NC) Summary</div>
              <div class="item-row">
                <span class="item-lbl">Total NCs Logged:</span>
                <span class="item-val font-mono font-bold">${audit.nonConformancesCount || 0}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Critical NCs (Auto Fail):</span>
                <span class="item-val font-mono font-bold" style="color: #b91c1c;">${audit.criticalNCs || 0}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Major NCs:</span>
                <span class="item-val font-mono font-bold" style="color: #b45309;">${audit.majorNCs || 0}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Minor NCs:</span>
                <span class="item-val font-mono">${audit.minorNCs || 0}</span>
              </div>
              <div class="item-row">
                <span class="item-lbl">Pass Threshold:</span>
                <span class="item-val font-mono">${audit.passMarks || 80} Marks</span>
              </div>
            </div>
          </div>

          ${
            audit.executiveSummary
              ? `
            <div style="padding: 7px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 10px; break-inside: avoid;">
              <strong style="color: #1e3a8a; font-size: 8.5px; text-transform: uppercase;">Executive Summary &amp; Findings:</strong>
              <div style="color: #334155; font-size: 8.5px; margin-top: 3px; line-height: 1.4;">${audit.executiveSummary}</div>
            </div>
          `
              : ''
          }

          ${
            checklist.length > 0 && options?.includeChecklist !== false
              ? `
            <div style="margin-top: 10px; margin-bottom: 4px; font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; display: flex; justify-content: space-between;">
              <span>Audit Clause Verification &amp; Checklist Assessment</span>
              <span style="font-size: 8px; color: #64748b; font-weight: 600;">${checklist.length} Checkpoints Evaluated</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 25px; text-align: center;">#</th>
                  <th style="width: 50px;">Clause</th>
                  <th>Clause Description &amp; Verification Criteria</th>
                  <th style="text-align: center; width: 55px;">Marks</th>
                  <th style="text-align: center; width: 80px;">Compliance</th>
                  <th style="width: 170px;">Auditor Remarks &amp; Evidence</th>
                </tr>
              </thead>
              <tbody>
                ${checklistRowsHtml}
              </tbody>
            </table>
          `
              : ''
          }

          ${
            options?.includePhotos !== false && allEvidencePhotos.length > 0
              ? `
            <div style="page-break-before: auto; margin-top: 16px; margin-bottom: 6px; font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; display: flex; justify-content: space-between; align-items: center;">
              <span>Audit Photo Evidences &amp; Visual Verification Gallery</span>
              <span style="font-size: 8px; color: #64748b; font-weight: 600;">${allEvidencePhotos.length} Photographic Records Attached</span>
            </div>

            <div class="photo-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px;">
              ${allEvidencePhotos
                .map(
                  (p, pIdx) => `
                <div class="photo-card" style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff; break-inside: avoid; page-break-inside: avoid; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <div style="height: 105px; background: #f8fafc; overflow: hidden; position: relative;">
                    <img src="${p.url}" alt="Audit Evidence ${pIdx + 1}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:8px;color:#94a3b8;\\'>Photo Preview Unavailable</div>'" />
                  </div>
                  <div style="padding: 6px 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                      <span style="font-family: monospace; font-size: 7.5px; font-weight: 800; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 1px 4px; border-radius: 3px;">
                        ${p.clauseNumber}
                      </span>
                      <span style="font-size: 7px; color: #64748b; font-family: monospace;">${p.timestamp || 'Recorded'}</span>
                    </div>
                    <div style="font-size: 8px; font-weight: 700; color: #0f172a; line-height: 1.25; margin-bottom: 2px;">
                      ${p.caption || p.subClauseTitle || 'Visual Verification Record'}
                    </div>
                    <div style="font-size: 7px; color: #64748b; line-height: 1.2;">
                      ${p.subClauseTitle}
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }

          ${
            audit.uploadedFiles && audit.uploadedFiles.length > 0
              ? `
            <div style="margin-top: 14px; margin-bottom: 6px; font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; display: flex; justify-content: space-between;">
              <span>Attached Documents &amp; Certificates</span>
              <span style="font-size: 8px; color: #64748b; font-weight: 600;">${audit.uploadedFiles.length} File(s)</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 30px; text-align: center;">#</th>
                  <th>File Name</th>
                  <th style="width: 80px;">Type</th>
                  <th style="width: 80px;">Size</th>
                  <th style="width: 90px;">Upload Date</th>
                  <th style="width: 90px;">Uploaded By</th>
                </tr>
              </thead>
              <tbody>
                ${audit.uploadedFiles
                  .map(
                    (f, fIdx) => `
                  <tr style="border-bottom: 1px solid #f1f5f9; ${fIdx % 2 === 1 ? 'background: #f8fafc;' : ''}">
                    <td style="text-align: center; font-family: monospace; font-size: 8px; color: #64748b;">${fIdx + 1}</td>
                    <td style="font-weight: 700; color: #1e3a8a; font-size: 8px;">${f.fileName}</td>
                    <td style="font-size: 7.5px; color: #475569;">${f.fileType}</td>
                    <td style="font-size: 7.5px; font-family: monospace; color: #475569;">${f.fileSize}</td>
                    <td style="font-size: 7.5px; font-family: monospace; color: #475569;">${f.uploadDate}</td>
                    <td style="font-size: 7.5px; color: #475569;">${f.uploadedBy || 'Lead Auditor'}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : ''
          }

          ${renderFooterSignaturesHtml(options?.signatureMode || 'dual')}

          <div style="margin-top: 14px; font-size: 7.5px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>Project ULTRA ERP &bull; Quality Audits &amp; Compliance Verification</span>
            <span>Document Code: VAL-AUD-${audit.auditCode}</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  } catch (err) {
    console.error('Failed to export single audit PDF:', err);
  }
}

export function exportSingleAuditExcel(audit: QualityAudit): void {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const pdfSettings = loadPdfHeaderSettings();
    const scoreVal = audit.obtainedMarks ?? audit.scorePercentage ?? 0;
    const hasCritical = (audit.criticalNCs ?? 0) > 0;
    const isPassed =
      !hasCritical &&
      (audit.isPassed !== undefined ? audit.isPassed : scoreVal >= (audit.passMarks ?? 80));

    // Checklist rows with photo count & photo references
    const checklistRows = (audit.checklist || [])
      .map((q, idx) => {
        const photos =
          q.evidencePhotos && q.evidencePhotos.length > 0
            ? q.evidencePhotos
            : q.evidencePhoto
            ? [{ id: `p-${q.id}`, url: q.evidencePhoto, caption: q.remark || '', timestamp: q.photoTimestamp }]
            : [];

        const photoRef = photos
          .map((p, pIdx) => `[Photo ${pIdx + 1}: ${p.caption || 'Evidence'} (${p.url})]`)
          .join(' | ');

        return `
        <tr>
          <td>${idx + 1}</td>
          <td>${q.clauseNumber}</td>
          <td>${q.clause}</td>
          <td>${q.subClauseTitle || ''}</td>
          <td>${q.question}</td>
          <td>${q.guidance || ''}</td>
          <td>${q.score}</td>
          <td>${q.maxScore}</td>
          <td>${q.status}</td>
          <td>${q.remark || ''}</td>
          <td>${photos.length}</td>
          <td>${photoRef}</td>
        </tr>
      `;
      })
      .join('');

    // Evidence photo log table
    const allEvidenceRows: string[] = [];
    let photoCounter = 1;
    (audit.checklist || []).forEach((q) => {
      const photos =
        q.evidencePhotos && q.evidencePhotos.length > 0
          ? q.evidencePhotos
          : q.evidencePhoto
          ? [{ id: `p-${q.id}`, url: q.evidencePhoto, caption: q.remark || '', timestamp: q.photoTimestamp }]
          : [];

      photos.forEach((p) => {
        allEvidenceRows.push(`
          <tr>
            <td>${photoCounter++}</td>
            <td>${q.clauseNumber}</td>
            <td>${q.clause}</td>
            <td>${q.subClauseTitle || ''}</td>
            <td>${q.question}</td>
            <td>${p.caption || q.remark || 'Audit photographic evidence'}</td>
            <td>${p.timestamp || 'Recorded'}</td>
            <td>${p.url}</td>
          </tr>
        `);
      });
    });

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 11pt; }
            th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            td { border: 1px solid #e2e8f0; padding: 5px; vertical-align: top; }
          </style>
        </head>
        <body>
          <h2>${pdfSettings.companyName || 'Valiant Garments Manufacturing Ltd.'}</h2>
          <h3>QUALITY AUDIT ASSESSMENT REPORT</h3>
          <p>
            <strong>Audit Code:</strong> ${audit.auditCode} | 
            <strong>Standard:</strong> ${audit.standard} | 
            <strong>Date:</strong> ${audit.auditDate} | 
            <strong>Score:</strong> ${scoreVal}% | 
            <strong>Result:</strong> ${hasCritical ? 'CRITICAL FAIL' : isPassed ? 'PASS' : 'FAIL'}
          </p>

          <table border="1">
            <tr><th colspan="2" style="background-color: #0f172a; color: #fff;">Audit Metadata &amp; Findings</th></tr>
            <tr><td><strong>Audit Code</strong></td><td>${audit.auditCode}</td></tr>
            <tr><td><strong>Standard</strong></td><td>${audit.standard}</td></tr>
            <tr><td><strong>Audit Type</strong></td><td>${audit.auditType}</td></tr>
            <tr><td><strong>Lead Auditor</strong></td><td>${audit.auditorName} (${audit.auditorOrganization || 'QA Team'})</td></tr>
            <tr><td><strong>Auditee Department / Supplier</strong></td><td>${audit.supplierName || audit.auditeeDepartment || 'Factory Operations'}</td></tr>
            <tr><td><strong>Audit Date</strong></td><td>${audit.auditDate}</td></tr>
            <tr><td><strong>Score (Marks / 100)</strong></td><td>${scoreVal}</td></tr>
            <tr><td><strong>Pass Benchmark</strong></td><td>${audit.passMarks || 80} Marks</td></tr>
            <tr><td><strong>Verdict</strong></td><td>${hasCritical ? 'CRITICAL FAIL' : isPassed ? 'PASS' : 'FAIL'}</td></tr>
            <tr><td><strong>Critical NCs</strong></td><td>${audit.criticalNCs || 0}</td></tr>
            <tr><td><strong>Major NCs</strong></td><td>${audit.majorNCs || 0}</td></tr>
            <tr><td><strong>Minor NCs</strong></td><td>${audit.minorNCs || 0}</td></tr>
            <tr><td><strong>Next Audit Due Date</strong></td><td>${audit.nextAuditDate || '-'}</td></tr>
            <tr><td><strong>Executive Summary</strong></td><td>${audit.executiveSummary || '-'}</td></tr>
          </table>

          ${
            checklistRows
              ? `
            <br/>
            <h3>Audit Checklist &amp; Clause Verification Points</h3>
            <table border="1">
              <tr style="background-color: #1e3a8a; color: #ffffff;">
                <th>#</th>
                <th>Clause #</th>
                <th>Clause Section</th>
                <th>Sub-Clause Title</th>
                <th>Auditing Requirement</th>
                <th>Verification Guidance</th>
                <th>Score</th>
                <th>Max Score</th>
                <th>Status</th>
                <th>Auditor Remarks</th>
                <th>Photo Count</th>
                <th>Photo Evidences &amp; URLs</th>
              </tr>
              ${checklistRows}
            </table>
          `
              : ''
          }

          ${
            allEvidenceRows.length > 0
              ? `
            <br/>
            <h3>Audit Photo Evidences &amp; Visual Verification Log</h3>
            <table border="1">
              <tr style="background-color: #0f172a; color: #ffffff;">
                <th>#</th>
                <th>Clause #</th>
                <th>Clause Section</th>
                <th>Sub-Clause Title</th>
                <th>Auditing Question</th>
                <th>Photo Caption / Observation</th>
                <th>Timestamp</th>
                <th>Image URL</th>
              </tr>
              ${allEvidenceRows.join('')}
            </table>
          `
              : ''
          }
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Report_${audit.auditCode}_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export single audit Excel:', err);
  }
}

