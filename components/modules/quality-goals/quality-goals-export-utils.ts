import { QualityGoal } from '@/lib/types/modules';
import {
  loadPdfHeaderSettings,
  renderPdfHeaderHtml,
  getModuleExportConfig,
} from '@/lib/pdf/pdf-header-store';

export type FooterSignatureMode = 'dual' | 'single' | 'none';

export interface ExportPdfOptions {
  signatureMode?: FooterSignatureMode;
}

// -------------------------------------------------------------
// KPI COMPUTATIONS
// -------------------------------------------------------------

export function computeGoalsReportKpis(goals: QualityGoal[]) {
  const totalGoals = goals.length;
  const achievedCount = goals.filter((g) => g.status === 'ACHIEVED').length;
  const inProgressCount = goals.filter((g) => g.status === 'IN_PROGRESS').length;
  const behindCount = goals.filter((g) => g.status === 'BEHIND').length;

  const avgProgress =
    totalGoals > 0
      ? Math.round(goals.reduce((sum, g) => sum + (g.percentageAchieved || 0), 0) / totalGoals)
      : 0;

  const allMilestones = goals.flatMap((g) => g.milestones || []);
  const completedMilestones = allMilestones.filter((m) => m.completed).length;

  const allActionPlans = goals.flatMap((g) => g.actionPlans || []);
  const pendingActions = allActionPlans.filter((a) => !a.completed).length;

  const uniqueDepartments = new Set(goals.map((g) => g.department).filter(Boolean)).size;

  return {
    totalGoals,
    achievedCount,
    inProgressCount,
    behindCount,
    avgProgress,
    totalMilestones: allMilestones.length,
    completedMilestones,
    pendingActions,
    uniqueDepartments,
  };
}

function getGoalStatusBadgeStyle(status: string) {
  switch (status) {
    case 'ACHIEVED':
      return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Achieved (100%)' };
    case 'IN_PROGRESS':
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'In Progress' };
    case 'BEHIND':
      return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'Behind Target' };
    case 'PLANNED':
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Planned' };
    default:
      return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: status };
  }
}

// -------------------------------------------------------------
// 1. GLOBAL QUALITY GOALS SUMMARY EXPORTS (PDF & EXCEL)
// -------------------------------------------------------------

export function exportQualityGoalsSummaryPdf(
  goals: QualityGoal[],
  scopeLabel: string = 'All Records',
  options?: ExportPdfOptions
): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'quality_goals', 'register');
    const metrics = computeGoalsReportKpis(goals);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      dateStr,
      config.department
    );

    const rowsHtml = goals
      .map((g, idx) => {
        const badge = getGoalStatusBadgeStyle(g.status);
        const progress = Math.min(100, Math.max(0, g.percentageAchieved || 0));

        return `
          <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
            <td style="text-align: center; font-family: monospace; font-size: 8px; color: #64748b;">${idx + 1}</td>
            <td style="font-family: monospace; font-size: 8.5px; font-weight: 700; color: #1e293b;">
              ${g.goalCode || `QG-${idx + 1}`}
              <div style="font-size: 7.5px; color: #64748b; font-weight: 400;">Due: ${g.deadline}</div>
            </td>
            <td style="font-size: 8.5px; font-weight: 700; color: #0f172a;">
              ${g.goalTitle}
              <div style="font-size: 7.5px; color: #64748b; font-weight: 400;">${g.department || 'Quality Assurance'}</div>
            </td>
            <td style="font-size: 8px; color: #334155;">
              <span style="display: inline-block; padding: 1.5px 5px; border-radius: 4px; font-size: 7.5px; font-weight: 700; background: #f1f5f9; color: #475569;">
                ${g.pillar ? g.pillar.replace(/_/g, ' ') : 'Strategic'}
              </span>
            </td>
            <td style="font-size: 8px; color: #475569;">
              ${g.targetMetric}
            </td>
            <td style="font-size: 7.5px; color: #64748b;">
              ${g.baseline}
            </td>
            <td style="font-size: 8px; font-weight: 700; color: #0284c7;">
              ${g.target}
            </td>
            <td style="font-size: 8px; font-weight: 700; color: #0f172a;">
              ${g.currentAchievement}
            </td>
            <td style="text-align: center; width: 65px;">
              <div style="font-family: monospace; font-size: 8.5px; font-weight: 800; color: ${
                progress >= 90 ? '#047857' : progress >= 70 ? '#2563eb' : '#b45309'
              };">
                ${progress}%
              </div>
            </td>
            <td style="text-align: center;">
              <span style="display: inline-block; font-size: 7.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${badge.bg}; color: ${badge.color}; border: 1px solid ${badge.border}; text-transform: uppercase;">
                ${badge.label}
              </span>
            </td>
            <td style="font-size: 8px; color: #475569;">${g.ownerName}</td>
          </tr>
        `;
      })
      .join('');

    // Milestones summary table
    const allMilestones = goals.flatMap((g) =>
      (g.milestones || []).map((m) => ({
        ...m,
        goalCode: g.goalCode || g.goalTitle,
      }))
    );

    const milestoneRowsHtml = allMilestones
      .map(
        (m, i) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-family: monospace; font-size: 8px; color: #64748b;">${i + 1}</td>
          <td style="font-family: monospace; font-size: 8px; font-weight: 700; color: #0284c7;">${m.goalCode}</td>
          <td style="font-size: 8.5px; font-weight: 600; color: #1e293b;">${m.title}</td>
          <td style="font-family: monospace; font-size: 8px; color: #64748b;">${m.targetDate}</td>
          <td style="text-align: center; font-family: monospace; font-size: 8px; color: #475569;">${m.weightPercentage || 25}%</td>
          <td style="text-align: center;">
            <span style="font-size: 7.5px; font-weight: 700; padding: 1.5px 6px; border-radius: 4px; ${
              m.completed ? 'background: #ecfdf5; color: #047857;' : 'background: #eff6ff; color: #1d4ed8;'
            }">
              ${m.completed ? `✓ COMPLETED (${m.completedDate || 'Done'})` : 'IN PROGRESS'}
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
          <meta charset="utf-8" />
          <title>Quality Goals Register - ${scopeLabel}</title>
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
              font-size: 9px;
              line-height: 1.4;
              background: #ffffff;
            }
            .meta-bar {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px 12px;
              margin: 8px 0 12px 0;
              display: flex;
              justify-content: space-between;
              font-size: 8.5px;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 10px;
            }
            .kpi-lbl {
              font-size: 7.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .kpi-val {
              font-size: 14px;
              font-weight: 800;
              font-family: monospace;
              margin-top: 2px;
            }
            .section-title {
              font-size: 10px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              margin: 12px 0 6px 0;
              padding-bottom: 3px;
              border-bottom: 1.5px solid #0f172a;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8.5px;
            }
            th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 700;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              padding: 6px 6px;
              border-bottom: 1.5px solid #cbd5e1;
              text-align: left;
            }
            td {
              padding: 5px 6px;
            }
            .footer-note {
              margin-top: 14px;
              font-size: 7.5px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div class="meta-bar">
            <div>
              <span style="font-weight: 700; color: #1e293b;">Scope:</span>
              <span style="color: #2563eb; font-weight: 700;">${scopeLabel}</span>
              <span style="color: #cbd5e1; margin: 0 6px;">|</span>
              <span style="color: #64748b;">Departments In Scope: <strong>${metrics.uniqueDepartments}</strong></span>
            </div>
            <div style="font-family: monospace; font-size: 8.5px; color: #64748b;">
              Export Date: <strong>${dateStr}</strong>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card" style="border-left: 3px solid #0284c7;">
              <div class="kpi-lbl">Total Objectives</div>
              <div class="kpi-val" style="color: #0284c7;">${metrics.totalGoals} Goals</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #059669;">
              <div class="kpi-lbl">Achieved (100%)</div>
              <div class="kpi-val" style="color: #059669;">${metrics.achievedCount} Goals</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #2563eb;">
              <div class="kpi-lbl">In Progress</div>
              <div class="kpi-val" style="color: #2563eb;">${metrics.inProgressCount} Goals</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #b91c1c;">
              <div class="kpi-lbl">Behind Target</div>
              <div class="kpi-val" style="color: #b91c1c;">${metrics.behindCount} Goals</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #6366f1;">
              <div class="kpi-lbl">Average Completion</div>
              <div class="kpi-val" style="color: #6366f1;">${metrics.avgProgress}%</div>
            </div>
          </div>

          <div class="section-title">
            <span>Strategic Quality Objectives Register</span>
            <span style="font-size: 8px; font-weight: 500; color: #64748b;">${goals.length} Strategic Mandates</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 85px;">Code & Due</th>
                <th>Objective Title & Department</th>
                <th style="width: 100px;">Strategic Pillar</th>
                <th style="width: 90px;">Target Metric</th>
                <th style="width: 75px;">Baseline</th>
                <th style="width: 90px;">Target</th>
                <th style="width: 100px;">Current Result</th>
                <th style="width: 55px; text-align: center;">Achieved</th>
                <th style="width: 80px; text-align: center;">Status</th>
                <th style="width: 95px;">Lead Owner</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          ${
            allMilestones.length > 0
              ? `
                <div class="section-title" style="margin-top: 18px;">
                  <span>Strategic Milestones & Phased Execution Roadmap</span>
                  <span style="font-size: 8px; font-weight: 500; color: #64748b;">${metrics.completedMilestones} of ${metrics.totalMilestones} Completed</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25px;">#</th>
                      <th style="width: 85px;">Goal Code</th>
                      <th>Phase / Milestone Deliverable</th>
                      <th style="width: 80px;">Target Date</th>
                      <th style="width: 65px; text-align: center;">Weight</th>
                      <th style="width: 130px; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${milestoneRowsHtml}
                  </tbody>
                </table>
              `
              : ''
          }

          <div class="footer-note">
            <span>Valiant ERP Quality Management System • Strategic Objectives Module</span>
            <span>Generated on ${dateStr} • Official Quality Goals Register</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  } catch (err) {
    console.error('Failed to export quality goals summary PDF:', err);
  }
}

export function exportQualityGoalsSummaryExcel(goals: QualityGoal[], scopeLabel: string = 'All Records'): void {
  try {
    const dateStr = new Date().toISOString().split('T')[0];

    const goalRows = goals
      .map(
        (g, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${g.goalCode || `QG-${idx + 1}`}</td>
        <td>${g.goalTitle}</td>
        <td>${g.pillar || ''}</td>
        <td>${g.department || ''}</td>
        <td>${g.targetMetric}</td>
        <td>${g.baseline}</td>
        <td>${g.target}</td>
        <td>${g.currentAchievement}</td>
        <td>${g.percentageAchieved}%</td>
        <td>${g.startDate || ''}</td>
        <td>${g.deadline}</td>
        <td>${g.status}</td>
        <td>${g.priority || ''}</td>
        <td>${g.ownerName}</td>
        <td>${g.approvedBy || ''}</td>
        <td>${g.description || ''}</td>
      </tr>
    `
      )
      .join('');

    const allMilestones = goals.flatMap((g) =>
      (g.milestones || []).map((m) => ({
        ...m,
        goalCode: g.goalCode || g.goalTitle,
      }))
    );

    const milestoneRows = allMilestones
      .map(
        (m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${m.goalCode}</td>
        <td>${m.title}</td>
        <td>${m.targetDate}</td>
        <td>${m.weightPercentage || 25}%</td>
        <td>${m.completed ? 'COMPLETED' : 'IN_PROGRESS'}</td>
        <td>${m.completedDate || ''}</td>
      </tr>
    `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            th { background-color: #0284c7; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
            td { border: 1px solid #cbd5e1; font-size: 10pt; }
            .hdr-tbl td { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Quality Goals & Strategic Objectives Register - ${scopeLabel}</h2>
          <table class="hdr-tbl">
            <tr>
              <td>Report Name:</td><td>Corporate Quality Goals & Achievements</td>
              <td>Export Date:</td><td>${dateStr}</td>
            </tr>
            <tr>
              <td>Scope:</td><td>${scopeLabel}</td>
              <td>Total Objectives:</td><td>${goals.length}</td>
            </tr>
          </table>

          <h3>Master Quality Goals & Objectives</h3>
          <table>
            <tr>
              <th>#</th>
              <th>Goal Code</th>
              <th>Goal Title</th>
              <th>Strategic Pillar</th>
              <th>Department</th>
              <th>Target Metric</th>
              <th>Baseline</th>
              <th>Target</th>
              <th>Current Achievement</th>
              <th>% Achieved</th>
              <th>Start Date</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Owner</th>
              <th>Approved By</th>
              <th>Description</th>
            </tr>
            ${goalRows}
          </table>

          <h3>Milestones & Roadmap Implementation</h3>
          <table>
            <tr>
              <th>#</th>
              <th>Goal Reference</th>
              <th>Milestone Phase</th>
              <th>Target Date</th>
              <th>Weight %</th>
              <th>Status</th>
              <th>Completion Date</th>
            </tr>
            ${milestoneRows}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quality_Goals_${scopeLabel.replace(/\s+/g, '_')}_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export quality goals summary Excel:', err);
  }
}

// -------------------------------------------------------------
// 2. SINGLE QUALITY GOAL CHARTER EXPORTS (PDF & EXCEL)
// -------------------------------------------------------------

export function exportSingleQualityGoalPdf(goal: QualityGoal): void {
  try {
    const pdfSettings = loadPdfHeaderSettings();
    const config = getModuleExportConfig(pdfSettings, 'quality_goals', 'single', goal.goalCode);

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const headerHtml = renderPdfHeaderHtml(
      pdfSettings,
      config.title,
      config.fullDocCode,
      dateStr,
      config.department
    );

    const badge = getGoalStatusBadgeStyle(goal.status);
    const progress = Math.min(100, Math.max(0, goal.percentageAchieved || 0));

    const milestoneRowsHtml = (goal.milestones || [])
      .map(
        (m, i) => `
        <tr style="border-bottom: 1px solid #f1f5f9; ${i % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="font-family: monospace; font-size: 8px; color: #64748b;">${i + 1}</td>
          <td style="font-size: 8.5px; font-weight: 700; color: #1e293b;">${m.title}</td>
          <td style="font-family: monospace; font-size: 8.5px; color: #64748b;">${m.targetDate}</td>
          <td style="text-align: center; font-family: monospace; font-size: 8.5px; color: #475569;">${m.weightPercentage || 25}%</td>
          <td style="text-align: center;">
            <span style="font-size: 7.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${
              m.completed ? 'background: #ecfdf5; color: #047857;' : 'background: #eff6ff; color: #1d4ed8;'
            }">
              ${m.completed ? `✓ COMPLETED (${m.completedDate || 'Done'})` : 'IN PROGRESS'}
            </span>
          </td>
        </tr>
      `
      )
      .join('');

    const actionPlanRowsHtml = (goal.actionPlans || [])
      .map(
        (a, i) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-family: monospace; font-size: 8px; color: #64748b;">${i + 1}</td>
          <td style="font-size: 8.5px; font-weight: 700; color: #1e293b;">${a.task}</td>
          <td style="font-size: 8px; color: #475569;">${a.assignee} (${a.department || '-'})</td>
          <td style="font-family: monospace; font-size: 8.5px; color: #64748b;">${a.dueDate}</td>
          <td style="text-align: center;">
            <span style="font-size: 7.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${
              a.completed ? 'background: #ecfdf5; color: #047857;' : 'background: #f1f5f9; color: #475569;'
            }">
              ${a.completed ? `✓ DONE (${a.completedDate || ''})` : 'OPEN'}
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
          <meta charset="utf-8" />
          <title>Goal Charter - ${goal.goalCode || goal.goalTitle}</title>
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
              line-height: 1.4;
              background: #ffffff;
            }
            .info-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              margin: 10px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px 12px;
            }
            .info-lbl {
              font-size: 7.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .info-val {
              font-size: 9.5px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
            }
            .stat-banner {
              background: #ffffff;
              border: 1.5px solid ${badge.border};
              border-radius: 8px;
              padding: 12px 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin: 10px 0;
            }
            .progress-container {
              background: #f1f5f9;
              border-radius: 9999px;
              height: 10px;
              width: 100%;
              overflow: hidden;
              margin-top: 6px;
            }
            .progress-bar {
              background: ${progress >= 90 ? '#059669' : progress >= 70 ? '#2563eb' : '#d97706'};
              height: 100%;
              border-radius: 9999px;
              width: ${progress}%;
            }
            .section-title {
              font-size: 9.5px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              margin: 14px 0 6px 0;
              padding-bottom: 3px;
              border-bottom: 1.5px solid #0f172a;
              display: flex;
              justify-content: space-between;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8.5px;
            }
            th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 700;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              padding: 6px 6px;
              border-bottom: 1.5px solid #cbd5e1;
              text-align: left;
            }
            td {
              padding: 5px 6px;
            }
          </style>
        </head>
        <body>
          ${headerHtml}

          <div class="stat-banner">
            <div>
              <div style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                ${goal.goalCode || 'QG'} • ${goal.pillar ? goal.pillar.replace(/_/g, ' ') : 'Strategic Objective'} • ${goal.department || 'Executive QA'}
              </div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-top: 2px;">
                ${goal.goalTitle}
              </div>
              <div style="font-size: 8px; color: #64748b; margin-top: 2px;">
                Lead Owner: <strong>${goal.ownerName}</strong> • Approved By: <strong>${goal.approvedBy || 'Managing Director'}</strong>
              </div>
            </div>

            <div style="text-align: right;">
              <span style="font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 6px; background: ${badge.bg}; color: ${badge.color}; border: 1.5px solid ${badge.border}; text-transform: uppercase;">
                ${badge.label}
              </span>
              <div style="font-family: monospace; font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">
                ${progress}% Achieved
              </div>
              <div style="font-size: 8px; color: #64748b;">Deadline: ${goal.deadline}</div>
            </div>
          </div>

          <!-- Progress Bar Banner -->
          <div class="info-card">
            <div style="display: flex; justify-content: space-between; font-size: 8.5px; font-weight: 700;">
              <span>Target Achievement Progress</span>
              <span style="color: #2563eb;">${progress}% Completed</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar"></div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-grid">
              <div>
                <div class="info-lbl">Target Metric</div>
                <div class="info-val">${goal.targetMetric}</div>
              </div>
              <div>
                <div class="info-lbl">Historical Baseline</div>
                <div class="info-val">${goal.baseline}</div>
              </div>
              <div>
                <div class="info-lbl">Target Goal</div>
                <div class="info-val" style="color: #0284c7;">${goal.target}</div>
              </div>
              <div>
                <div class="info-lbl">Current Realized Result</div>
                <div class="info-val" style="color: #047857;">${goal.currentAchievement}</div>
              </div>
            </div>
          </div>

          ${
            goal.description
              ? `
                <div class="info-card" style="margin-top: 8px;">
                  <div class="info-lbl">Executive Mandate & ISO 9001 Clause Alignment:</div>
                  <div style="margin-top: 3px; font-size: 8.5px; color: #334155; line-height: 1.5;">${goal.description}</div>
                </div>
              `
              : ''
          }

          ${
            goal.milestones && goal.milestones.length > 0
              ? `
                <div class="section-title">
                  <span>Implementation Milestones & Phased Roadmap</span>
                  <span style="font-size: 8px; font-weight: 500; color: #64748b;">${goal.milestones.length} Phases</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25px;">#</th>
                      <th>Deliverable / Phase Description</th>
                      <th style="width: 85px;">Target Date</th>
                      <th style="width: 65px; text-align: center;">Weight</th>
                      <th style="width: 140px; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${milestoneRowsHtml}
                  </tbody>
                </table>
              `
              : ''
          }

          ${
            goal.actionPlans && goal.actionPlans.length > 0
              ? `
                <div class="section-title" style="margin-top: 14px;">
                  <span>Action Initiatives & Department Directives</span>
                  <span style="font-size: 8px; font-weight: 500; color: #64748b;">${goal.actionPlans.length} Initiatives</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25px;">#</th>
                      <th>Directive / Task</th>
                      <th style="width: 150px;">Responsible Lead</th>
                      <th style="width: 85px;">Target Date</th>
                      <th style="width: 90px; text-align: center;">Execution Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${actionPlanRowsHtml}
                  </tbody>
                </table>
              `
              : ''
          }

          <div style="margin-top: 25px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 7.5px; color: #94a3b8;">
            <span>Valiant Garments Manufacturing • Quality Policy & Objectives</span>
            <span>Document Code: ${goal.goalCode || 'QG'} • Printed: ${dateStr}</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  } catch (err) {
    console.error('Failed to export single quality goal PDF:', err);
  }
}

export function exportSingleQualityGoalExcel(goal: QualityGoal): void {
  try {
    const dateStr = new Date().toISOString().split('T')[0];

    const milestoneRows = (goal.milestones || [])
      .map(
        (m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${m.title}</td>
        <td>${m.targetDate}</td>
        <td>${m.weightPercentage || 25}%</td>
        <td>${m.completed ? 'COMPLETED' : 'IN_PROGRESS'}</td>
        <td>${m.completedDate || ''}</td>
      </tr>
    `
      )
      .join('');

    const actionPlanRows = (goal.actionPlans || [])
      .map(
        (a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${a.task}</td>
        <td>${a.assignee}</td>
        <td>${a.department || ''}</td>
        <td>${a.dueDate}</td>
        <td>${a.completed ? 'DONE' : 'OPEN'}</td>
      </tr>
    `
      )
      .join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            th { background-color: #0284c7; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
            td { border: 1px solid #cbd5e1; font-size: 10pt; }
            .hdr-tbl td { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Quality Goal Charter - ${goal.goalCode || goal.goalTitle}</h2>
          <table class="hdr-tbl">
            <tr>
              <td>Goal Code:</td><td>${goal.goalCode || ''}</td>
              <td>Date:</td><td>${dateStr}</td>
            </tr>
            <tr>
              <td>Goal Title:</td><td>${goal.goalTitle}</td>
              <td>Pillar:</td><td>${goal.pillar || ''}</td>
            </tr>
            <tr>
              <td>Department:</td><td>${goal.department || ''}</td>
              <td>Lead Owner:</td><td>${goal.ownerName}</td>
            </tr>
            <tr>
              <td>Target Metric:</td><td>${goal.targetMetric}</td>
              <td>Baseline:</td><td>${goal.baseline}</td>
            </tr>
            <tr>
              <td>Target:</td><td>${goal.target}</td>
              <td>Achievement:</td><td>${goal.currentAchievement}</td>
            </tr>
            <tr>
              <td>% Achieved:</td><td>${goal.percentageAchieved}%</td>
              <td>Status:</td><td>${goal.status}</td>
            </tr>
            <tr>
              <td>Timeline:</td><td>${goal.startDate || ''} to ${goal.deadline}</td>
              <td>Approved By:</td><td>${goal.approvedBy || ''}</td>
            </tr>
            <tr>
              <td>Mandate:</td><td colspan="3">${goal.description || ''}</td>
            </tr>
          </table>

          <h3>Milestones & Roadmap Execution</h3>
          <table>
            <tr>
              <th>#</th>
              <th>Milestone Phase</th>
              <th>Target Date</th>
              <th>Weight %</th>
              <th>Status</th>
              <th>Completed Date</th>
            </tr>
            ${milestoneRows}
          </table>

          <h3>Action Plan Initiatives</h3>
          <table>
            <tr>
              <th>#</th>
              <th>Task</th>
              <th>Assignee</th>
              <th>Department</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
            ${actionPlanRows}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quality_Goal_${(goal.goalCode || goal.goalTitle).replace(/\s+/g, '_')}_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export single quality goal Excel:', err);
  }
}
