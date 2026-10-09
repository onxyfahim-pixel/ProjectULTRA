'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  History,
  ShieldCheck,
  FileText,
  BarChart3,
  ExternalLink,
  Eye,
  X,
  TrendingUp,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  ProductionOrderPlan,
  TargetSettingRecord,
  ProductionExecutionRecord,
  HourlyMonitoringRecord,
  WipManagementRecord,
  StyleOperationBulletin,
  ProductionPlanSchedule,
  TimeMotionStudy,
  MethodStudyRecord,
  MotionStudyRecord,
  ProductionLossRecord,
  DowntimeManagementRecord,
  KaizenImprovementRecord,
  UniversalAuditRecord,
} from '@/lib/types/planning-ie';
import { BuyerOrder } from '@/lib/types/modules';
import { ProductionOrder } from '@/lib/types/erp';
import { ProductionLine } from '@/lib/types/production-management';
import {
  generateLiveReportData,
  GeneratedReportResult,
  LivePlanningReportContext,
} from '@/lib/utils/planning-ie-live-data';

interface ReportsAuditTabProps {
  productionOrders?: ProductionOrderPlan[];
  buyerOrders?: BuyerOrder[];
  liveProdRecords?: ProductionOrder[];
  wipRecords?: WipManagementRecord[];
  hourlyRecords?: HourlyMonitoringRecord[];
  targets?: TargetSettingRecord[];
  executions?: ProductionExecutionRecord[];
  bulletins?: StyleOperationBulletin[];
  schedules?: ProductionPlanSchedule[];
  timeStudies?: TimeMotionStudy[];
  methodStudies?: MethodStudyRecord[];
  motionStudies?: MotionStudyRecord[];
  lines?: ProductionLine[];
  losses?: ProductionLossRecord[];
  downtimes?: DowntimeManagementRecord[];
  kaizens?: KaizenImprovementRecord[];
  auditLogs: UniversalAuditRecord[];
  onExportCsv: (filename: string, rows: any[]) => void;
  onPrintReport?: (reportName: string) => void;
}

export function ReportsAuditTab({
  productionOrders = [],
  buyerOrders = [],
  liveProdRecords = [],
  wipRecords = [],
  hourlyRecords = [],
  targets = [],
  executions = [],
  bulletins = [],
  schedules = [],
  timeStudies = [],
  methodStudies = [],
  motionStudies = [],
  lines = [],
  losses = [],
  downtimes = [],
  kaizens = [],
  auditLogs = [],
  onExportCsv,
  onPrintReport,
}: ReportsAuditTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'prod_reports' | 'ie_reports' | 'audit_trail'>('prod_reports');
  const [auditSearch, setAuditSearch] = useState('');

  // Live Report Viewer Modal State
  const [selectedReport, setSelectedReport] = useState<GeneratedReportResult | null>(null);
  const [reportTableFilter, setReportTableFilter] = useState('');

  // Build report generation context
  const reportContext: LivePlanningReportContext = useMemo(
    () => ({
      productionOrders,
      buyerOrders,
      liveProdRecords,
      wipRecords,
      hourlyRecords,
      targets,
      executions,
      bulletins,
      schedules,
      timeStudies,
      methodStudies,
      motionStudies,
      lines,
      losses,
      downtimes,
      kaizens,
      auditLogs,
    }),
    [
      productionOrders,
      buyerOrders,
      liveProdRecords,
      wipRecords,
      hourlyRecords,
      targets,
      executions,
      bulletins,
      schedules,
      timeStudies,
      methodStudies,
      motionStudies,
      lines,
      losses,
      downtimes,
      kaizens,
      auditLogs,
    ]
  );

  // 17 Production Reports List
  const productionReports = [
    { id: 'rep-p1', name: '01. Daily Production Summary Report', freq: 'Daily (Every Shift)', desc: 'Consolidated good pcs, target, achievement %, and DHU per line.' },
    { id: 'rep-p2', name: '02. Hourly Production & Variance Report', freq: 'Hourly Real-Time', desc: 'Hour-by-hour output, line pitch variance, and downtime root cause.' },
    { id: 'rep-p3', name: '03. Line-wise Production Performance Report', freq: 'Weekly / Monthly', desc: 'Comprehensive line capacity, target vs actual, and efficiency trend.' },
    { id: 'rep-p4', name: '04. Style-wise Production Report', freq: 'Order Lifecycle', desc: 'Style complexity, actual pace, SMV variance, and bottleneck history.' },
    { id: 'rep-p5', name: '05. PO-wise Production & Delivery Report', freq: 'Per Purchase Order', desc: 'Order quantity vs produced balance and shipping schedule risk.' },
    { id: 'rep-p6', name: '06. Buyer-wise Production & Quality Report', freq: 'Monthly / Quarterly', desc: 'Buyer allocation, output consistency, and acceptance rates.' },
    { id: 'rep-p7', name: '07. Shift-wise Output & Handover Report', freq: 'Per Shift', desc: 'Day vs Evening shift comparative output and bundle handover log.' },
    { id: 'rep-p8', name: '08. 6-Stage WIP Pipeline & Aging Report', freq: 'Daily', desc: 'Cutting to Packing station buffer quantities and aging days.' },
    { id: 'rep-p9', name: '09. Production Rework & Repair Register', freq: 'Daily / Weekly', desc: 'Defect categories, responsible workstations, and repair turnaround.' },
    { id: 'rep-p10', name: '10. Rejection & Scrap Accounting Report', freq: 'Weekly / Monthly', desc: 'Non-repairable garment count, material loss, and scrap cost in USD.' },
    { id: 'rep-p11', name: '11. Machine Downtime & MTTR Report', freq: 'Weekly', desc: 'Breakdowns, electrical stops, MTTR minutes, and MTBF hours.' },
    { id: 'rep-p12', name: '12. Operator & Line Efficiency Report', freq: 'Daily / Monthly', desc: 'Standard minutes earned vs available working minutes.' },
    { id: 'rep-p13', name: '13. Factory Productivity (Pcs/Man-Hour) Report', freq: 'Weekly / Monthly', desc: 'Output per operator hour and line labor productivity trends.' },
    { id: 'rep-p14', name: '14. Factory Capacity Utilization Report', freq: 'Monthly', desc: 'Available minutes vs required minutes and order booking capacity.' },
    { id: 'rep-p15', name: '15. Manpower Allocation & Absenteeism Report', freq: 'Daily', desc: 'Direct/indirect headcount, absenteeism rate %, and staffing gaps.' },
    { id: 'rep-p16', name: '16. Production Plan vs Actual Variance Report', freq: 'Weekly', desc: 'Scheduled MPS daily pace vs actual achieved endline count.' },
    { id: 'rep-p17', name: '17. Order Follow-up & TNA Critical Path Report', freq: 'Daily Executive', desc: 'Days remaining to customer delivery date and shipment alerts.' },
  ];

  // 16 IE Reports List
  const ieReports = [
    { id: 'rep-ie1', name: '01. Style Operation Bulletin (OB) Master Sheet', category: 'Engineering Standards', desc: 'Full sequence, machine class, folder attachment, SMV, and pitch.' },
    { id: 'rep-ie2', name: '02. 5-Cycle Time Study & Rating Benchmark', category: 'Work Measurement', desc: 'Stopwatch cycle times, operator performance rating, and allowances.' },
    { id: 'rep-ie3', name: '03. Method Study & Workstation Ergonomics Report', category: 'Work Improvement', desc: 'Before vs after method analysis, motion reduction, and cost savings.' },
    { id: 'rep-ie4', name: '04. Motion Study & Value-Added Breakdown', category: 'Motion Economy', desc: 'VA, NVA, and unnecessary motion elements with reduction plans.' },
    { id: 'rep-ie5', name: '05. Garment SAM & SMV Standard Catalog', category: 'Database', desc: 'Standard minute values by garment category and operation library.' },
    { id: 'rep-ie6', name: '06. Yamazumi Line Balancing Efficiency Report', category: 'Line Balancing', desc: 'Cycle time vs pitch time workload view and bottleneck solutions.' },
    { id: 'rep-ie7', name: '07. Line Capacity & Pitch Time Analysis', category: 'Capacity', desc: 'Pitch time, takt time, and line throughput limits.' },
    { id: 'rep-ie8', name: '08. Manpower Requirement & Headcount Budget', category: 'Manpower Planning', desc: 'Theoretical vs actual operator and helper requirements.' },
    { id: 'rep-ie9', name: '09. Operator Skill Matrix & Competency Matrix', category: 'Skill Development', desc: 'Operator x Operation multi-skill ratings (0 to 4) and training gaps.' },
    { id: 'rep-ie10', name: '10. Labor Productivity Benchmark Report', category: 'Productivity', desc: 'Output / operator and output / man-hour comparisons.' },
    { id: 'rep-ie11', name: '11. Standard vs Actual Efficiency Variance', category: 'Efficiency', desc: 'Target 85% efficiency comparison against daily floor performance.' },
    { id: 'rep-ie12', name: '12. Machine Fleet Utilization & Health Report', category: 'Machinery', desc: 'Running time, idle time, and breakdown percentages across brands.' },
    { id: 'rep-ie13', name: '13. Line Bottleneck Detection & Resolution Log', category: 'Bottleneck Control', desc: 'Operations with cycle time > pitch time and corrective engineering.' },
    { id: 'rep-ie14', name: '14. Lost Minute & Non-Productive Time (NPT) Report', category: 'Loss Analysis', desc: 'Lost minutes categorized by department responsibility.' },
    { id: 'rep-ie15', name: '15. Kaizen Continuous Improvement Register', category: 'Kaizen & Lean', desc: 'Productivity, motion reduction, and dollar cost savings.' },
    { id: 'rep-ie16', name: '16. Style Changeover Time & Loss Audit', category: 'SMED / Changeover', desc: 'Planned vs actual changeover minutes and fast setup improvements.' },
  ];

  // Handler to view live report on screen
  const handleOpenLiveReport = (reportId: string) => {
    const generated = generateLiveReportData(reportId, reportContext);
    setSelectedReport(generated);
    setReportTableFilter('');
  };

  // Handler to export live report to CSV
  const handleExportLiveReport = (reportId: string, reportName: string) => {
    const generated = generateLiveReportData(reportId, reportContext);
    const filename = `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    onExportCsv(filename, generated.rows);
  };

  // Handler to print live report
  const handlePrintLiveReport = (reportId: string, reportName: string) => {
    const generated = generateLiveReportData(reportId, reportContext);
    setSelectedReport(generated);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Filtered rows inside live report modal
  const filteredReportRows = useMemo(() => {
    if (!selectedReport) return [];
    if (!reportTableFilter.trim()) return selectedReport.rows;
    const q = reportTableFilter.toLowerCase();
    return selectedReport.rows.filter((r) =>
      Object.values(r).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [selectedReport, reportTableFilter]);

  const filteredAudit = auditLogs.filter((a) => {
    return (
      a.entity.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.performedBy.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.recordIdentifier.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.details.toLowerCase().includes(auditSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('prod_reports')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'prod_reports'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>37. Production Reports Center (17 Reports)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ie_reports')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'ie_reports'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>38. IE &amp; Method Study Reports Center (16 Reports)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('audit_trail')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'audit_trail'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>40. Universal Audit Trail &amp; History ({auditLogs.length})</span>
          </button>
        </div>

        <button
          onClick={() => onExportCsv('Universal_System_Audit_Log.csv', auditLogs)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* SUB-VIEW 1: PRODUCTION REPORTS (17 REPORTS) */}
      {activeSubTab === 'prod_reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {productionReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{rep.name}</span>
                  </div>
                  <div className="text-[10px] font-bold text-blue-700 uppercase">{rep.freq}</div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{rep.desc}</p>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                  <button
                    onClick={() => handleOpenLiveReport(rep.id)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="View live report table and interactive summary on screen"
                  >
                    <Eye className="w-3 h-3 text-blue-600" />
                    <span>View Report</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePrintLiveReport(rep.id, rep.name)}
                      className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Print / Save PDF of this report"
                    >
                      <Printer className="w-3 h-3 text-slate-500" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={() => handleExportLiveReport(rep.id, rep.name)}
                      className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Export real calculated CSV data"
                    >
                      <Download className="w-3 h-3" />
                      <span>Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: IE REPORTS (16 REPORTS) */}
      {activeSubTab === 'ie_reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ieReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{rep.name}</span>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-700 uppercase">{rep.category}</div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{rep.desc}</p>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                  <button
                    onClick={() => handleOpenLiveReport(rep.id)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="View live engineering report data"
                  >
                    <Eye className="w-3 h-3 text-indigo-600" />
                    <span>View Report</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePrintLiveReport(rep.id, rep.name)}
                      className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Print / Save PDF"
                    >
                      <Printer className="w-3 h-3 text-slate-500" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={() => handleExportLiveReport(rep.id, rep.name)}
                      className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Export real engineering CSV data"
                    >
                      <Download className="w-3 h-3" />
                      <span>Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: UNIVERSAL AUDIT TRAIL */}
      {activeSubTab === 'audit_trail' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail by user, action, entity, details..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredAudit.length} of {auditLogs.length} audit entries
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Record Key</th>
                    <th className="p-3">Performed By</th>
                    <th className="p-3">Details &bull; Audit Trail Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAudit.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {log.timestamp.replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : log.action === 'DELETE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : log.action === 'EXPORT'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{log.entity}</td>
                      <td className="p-3 font-mono text-blue-700">{log.recordIdentifier}</td>
                      <td className="p-3 text-slate-600">{log.performedBy}</td>
                      <td className="p-3 text-slate-700 max-w-md leading-relaxed">{log.details}</td>
                    </tr>
                  ))}
                  {filteredAudit.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No audit records found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LIVE INTERACTIVE REPORT VIEWER MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/70 shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {selectedReport.category}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {selectedReport.frequency}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Generated: {selectedReport.generatedAt}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedReport.name}
                </h2>
                <p className="text-xs text-slate-600">{selectedReport.desc}</p>
              </div>

              {/* Top Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const filename = `${selectedReport.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
                    onExportCsv(filename, selectedReport.rows);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Close Report Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* KPI Summary Cards Bar */}
            {selectedReport.kpis && selectedReport.kpis.length > 0 && (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/40 border-b border-slate-100 shrink-0">
                {selectedReport.kpis.map((kpi, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {kpi.label}
                    </span>
                    <span
                      className={`text-base font-bold font-mono mt-0.5 block ${
                        kpi.color === 'emerald'
                          ? 'text-emerald-700'
                          : kpi.color === 'amber'
                          ? 'text-amber-700'
                          : kpi.color === 'rose'
                          ? 'text-rose-700'
                          : kpi.color === 'indigo'
                          ? 'text-indigo-700'
                          : 'text-blue-700'
                      }`}
                    >
                      {kpi.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Search Filter Strip */}
            <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="relative w-full max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search table rows (line, style, po, status...)"
                  value={reportTableFilter}
                  onChange={(e) => setReportTableFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-xs font-semibold text-slate-500">
                {filteredReportRows.length} Records Computed
              </div>
            </div>

            {/* Scrollable Data Table */}
            <div className="overflow-auto flex-1 min-h-[300px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="p-3 text-center w-10">#</th>
                    {selectedReport.columns.map((col) => (
                      <th
                        key={col.key}
                        className={`p-3 ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReportRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{rIdx + 1}</td>
                      {selectedReport.columns.map((col) => {
                        const val = row[col.key];
                        return (
                          <td
                            key={col.key}
                            className={`p-3 ${
                              col.align === 'right'
                                ? 'text-right font-mono'
                                : col.align === 'center'
                                ? 'text-center font-mono'
                                : 'text-left'
                            }`}
                          >
                            {col.format === 'badge' ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${
                                  String(val).includes('ON_TARGET') ||
                                  String(val).includes('OPTIMAL') ||
                                  String(val).includes('EXCELLENT') ||
                                  String(val).includes('PASSED') ||
                                  String(val).includes('RESOLVED') ||
                                  String(val).includes('NORMAL')
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : String(val).includes('HIGH_RISK') ||
                                      String(val).includes('BELOW_TARGET') ||
                                      String(val).includes('AGING_ALERT') ||
                                      String(val).includes('CRITICAL') ||
                                      String(val).includes('OVERLOAD')
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {String(val || '-')}
                              </span>
                            ) : typeof val === 'number' ? (
                              val.toLocaleString()
                            ) : (
                              String(val !== undefined && val !== null ? val : '-')
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {filteredReportRows.length === 0 && (
                    <tr>
                      <td colSpan={selectedReport.columns.length + 1} className="p-8 text-center text-slate-400">
                        No report records matching search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="font-semibold">
                Report Source: Real Factory Master &amp; Floor Execution Database
              </span>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer transition-colors shadow-2xs"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
