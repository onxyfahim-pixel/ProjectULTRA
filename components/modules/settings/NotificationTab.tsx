'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Webhook,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Send,
  Save,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Sliders,
  Check,
  Zap,
  Filter,
  Users,
  Shield,
  ShoppingBag,
  Factory,
  CheckSquare,
  FileText,
  Inbox,
  Award,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';
import {
  NotificationService,
  NotificationConfig,
  MODULE_ALERT_CATALOG,
  ModuleAlertDefinition,
  buildDefaultNotificationConfig,
} from '@/lib/notifications/notification-service';

export function NotificationTab() {
  const { user, roles, can } = useErpAuth();
  const isSuperAdmin = Boolean(user?.isSuperAdmin || user?.role === 'Super Admin' || user?.role === 'ADMIN');

  const [config, setConfig] = useState<NotificationConfig>(() => NotificationService.getConfig());
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [testSentNotice, setTestSentNotice] = useState<string | null>(null);
  const [testAlertId, setTestAlertId] = useState<string>('nearby_crd_order');

  // Load config on mount & listen to updates
  useEffect(() => {
    const load = () => {
      setConfig(NotificationService.getConfig());
    };
    load();

    const handleUpdate = () => load();
    window.addEventListener('erp_notification_config_updated', handleUpdate);
    return () => {
      window.removeEventListener('erp_notification_config_updated', handleUpdate);
    };
  }, []);

  // System available roles list
  const availableRoleNames = useMemo(() => {
    const list = roles.map((r) => r.name);
    if (!list.includes('Super Admin')) list.unshift('Super Admin');
    if (!list.includes('QC Manager')) list.push('QC Manager');
    if (!list.includes('Inspector')) list.push('Inspector');
    if (!list.includes('Viewer')) list.push('Viewer');
    return Array.from(new Set(list));
  }, [roles]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    NotificationService.saveConfig(config);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetDefaults = () => {
    if (!confirm('Reset all notification rules, role matrix, and thresholds to factory defaults?')) return;
    const defaults = buildDefaultNotificationConfig();
    setConfig(defaults);
    NotificationService.saveConfig(defaults);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Toggle alert on/off
  const handleToggleAlert = (alertTypeId: string, enabled: boolean) => {
    setConfig((prev) => {
      const currentRule = prev.alertRules[alertTypeId] || {
        alertTypeId,
        enabled: true,
        allowedRoles: ['Super Admin', 'QC Manager'],
      };
      return {
        ...prev,
        alertRules: {
          ...prev.alertRules,
          [alertTypeId]: {
            ...currentRule,
            enabled,
          },
        },
      };
    });
  };

  // Toggle role in allowedRoles list for a specific alert
  const handleToggleRoleForAlert = (alertTypeId: string, roleName: string) => {
    setConfig((prev) => {
      const currentRule = prev.alertRules[alertTypeId] || {
        alertTypeId,
        enabled: true,
        allowedRoles: ['Super Admin', 'QC Manager'],
      };

      const currentRoles = currentRule.allowedRoles || [];
      const hasRole = currentRoles.includes(roleName);
      const updatedRoles = hasRole
        ? currentRoles.filter((r) => r !== roleName)
        : [...currentRoles, roleName];

      return {
        ...prev,
        alertRules: {
          ...prev.alertRules,
          [alertTypeId]: {
            ...currentRule,
            allowedRoles: updatedRoles,
          },
        },
      };
    });
  };

  // Set all roles or clear roles for an alert
  const handleSelectAllRolesForAlert = (alertTypeId: string, selectAll: boolean) => {
    setConfig((prev) => {
      const currentRule = prev.alertRules[alertTypeId] || {
        alertTypeId,
        enabled: true,
        allowedRoles: [],
      };
      return {
        ...prev,
        alertRules: {
          ...prev.alertRules,
          [alertTypeId]: {
            ...currentRule,
            allowedRoles: selectAll ? [...availableRoleNames] : ['Super Admin'],
          },
        },
      };
    });
  };

  // Trigger test sample alert
  const handleSendTestNotification = () => {
    const catalogItem = MODULE_ALERT_CATALOG.find((m) => m.id === testAlertId) || MODULE_ALERT_CATALOG[0];

    const sampleMessages: Record<string, { title: string; message: string }> = {
      new_order_added: {
        title: 'New Buyer Order Added — PO-99480 (Next Retail)',
        message: 'Next Retail added PO-99480 for 30,000 pcs Men Denim Slim Jeans. Ex-Factory delivery: Nov 22, 2026.',
      },
      nearby_crd_order: {
        title: 'Nearby CRD Delivery Date Alert — Style #Z-902',
        message: `Active Order PO-8831 (Zara Knits) delivery is approaching within ${config.nearbyCrdDays} days (Oct 16, 2026). Packaging progress currently at 74%.`,
      },
      shipment_delay_risk: {
        title: 'Shipment Milestone Delay Risk — PO-7714',
        message: 'Style #HM-4402 running 4 days behind planned sewing output milestone. Critical risk of air-freight delay.',
      },
      target_alert: {
        title: 'Hourly Target Shortfall Alert — Sewing Line 03',
        message: `Line 03 produced 78 pcs vs 100 pcs hourly target (${config.targetDeficitPercent}%+ deficit). Thread breakage at feed-off-the-arm station.`,
      },
      line_report_not_submitted: {
        title: 'Line Report Not Submitted Alert — Line 06',
        message: `Line 06 hourly quality audit report has not been submitted. Overdue by ${config.lineReportDelayMinutes} minutes. Floor supervisor alerted.`,
      },
      dhu_alert: {
        title: 'DHU Quality Spike Alert — Line 05 (4.8% DHU)',
        message: `Sewing Line 05 exceeded ${config.dhuThresholdPercent}% critical limit with 4.8% DHU. Broken needle and skipped stitches detected.`,
      },
      aql_critical_failure: {
        title: 'AQL Final Inspection Rejection — Style #NK-882',
        message: 'FRI audit rejected under AQL 1.5 standard. 4 critical needle punctures and oil marks found in sample cartons.',
      },
      incoming_quarantine_alert: {
        title: 'Material Inward Quarantine Alert — Lot #7741',
        message: 'Single Jersey fabric roll #7741 scored 34 points/100 sq.yd (ASTM D5430 > 28 pts limit). Put into Quarantine Bay A.',
      },
      calibration_overdue: {
        title: 'Equipment Calibration Due — Digital Tensile Tester',
        message: 'Testing lab tensile strength machine #TT-02 has reached ISO 17025 annual re-calibration deadline.',
      },
      capa_overdue: {
        title: 'CAPA 8D Resolution Overdue — CAPA-2024-022',
        message: 'Target date exceeded by 3 days for seam slippage corrective action verification on woven cargo trousers.',
      },
      customer_claim_alert: {
        title: 'Customer Complaint / Claim Logged — H&M Sweden',
        message: 'Buyer H&M logged formal debit claim #CLM-2026-14 regarding button pull test failure in batch #09.',
      },
      low_stock_warning: {
        title: 'Raw Material Low Stock Warning — 100% Cotton Yarn 30s',
        message: 'Spinning raw yarn cones buffer stock dropped below safety threshold (140 kg remaining, 1,200 kg required).',
      },
    };

    const chosen = sampleMessages[testAlertId] || {
      title: `${catalogItem.name} — Live Test`,
      message: `Simulated real-time alert dispatched for module "${catalogItem.module.replace(/_/g, ' ')}" to all permitted roles.`,
    };

    NotificationService.triggerAlert({
      alertTypeId: catalogItem.id,
      title: chosen.title,
      message: chosen.message,
      module: catalogItem.module,
      severity: catalogItem.defaultSeverity,
    });

    setTestSentNotice(`Alert "${chosen.title}" successfully dispatched to topbar alert center with chime!`);
    setTimeout(() => setTestSentNotice(null), 4000);
  };

  // Filter alerts by category and search
  const filteredCatalog = useMemo(() => {
    return MODULE_ALERT_CATALOG.filter((item) => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.module.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-200/60 dark:border-blue-900/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Notification &amp; Alert Engine Settings</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Role-Based RBAC
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure real-time quality triggers, nearby CRD orders, DHU spikes, target alerts, and role recipient access across all 30 ERP modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Notification dispatch rules, alert triggers, and role routing matrix successfully saved!</span>
        </div>
      )}

      {testSentNotice && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{testSentNotice}</span>
        </div>
      )}

      {/* 1. INTERACTIVE LIVE ALERT SIMULATOR & TESTER */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Live Alert Dispatcher &amp; Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate module events in real time to verify that permitted roles receive instant alerts in the topbar notification box with audio chimes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
            <select
              value={testAlertId}
              onChange={(e) => setTestAlertId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <optgroup label="Buyer & Orders">
                <option value="new_order_added">Buyer Order: New Order Added</option>
                <option value="nearby_crd_order">Buyer Order: Nearby CRD Order</option>
                <option value="shipment_delay_risk">Buyer Order: Shipment Delay Risk</option>
              </optgroup>
              <optgroup label="Production & Planning">
                <option value="target_alert">Production: Hourly Target Shortfall</option>
                <option value="line_report_not_submitted">Production: Line Report Not Submitted</option>
                <option value="dhu_alert">Production: DHU Quality Spike Alert</option>
              </optgroup>
              <optgroup label="Quality & Inspections">
                <option value="aql_critical_failure">Quality: AQL FRI Rejection</option>
                <option value="incoming_quarantine_alert">Quality: Material Quarantine (ASTM D5430)</option>
                <option value="calibration_overdue">Quality: Calibration Due / Overdue</option>
              </optgroup>
              <optgroup label="Compliance & Inventory">
                <option value="capa_overdue">Compliance: CAPA 8D Overdue</option>
                <option value="customer_claim_alert">Compliance: Customer Claim Logged</option>
                <option value="low_stock_warning">Inventory: Raw Material Low Stock</option>
              </optgroup>
            </select>

            <button
              type="button"
              onClick={handleSendTestNotification}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ALERT THRESHOLD PARAMETERS CARD */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-blue-600" />
          Automated Threshold Governance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* DHU Alert Threshold */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              DHU Quality Spike Threshold
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="15"
                value={config.dhuThresholdPercent}
                onChange={(e) => setConfig({ ...config, dhuThresholdPercent: parseFloat(e.target.value) || 3.0 })}
                className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-500">% DHU</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Triggers urgent DHU alert when sewing/finishing lines exceed this defect rate.
            </p>
          </div>

          {/* Nearby CRD Days */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              Nearby CRD Order Warning
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="60"
                value={config.nearbyCrdDays}
                onChange={(e) => setConfig({ ...config, nearbyCrdDays: parseInt(e.target.value) || 10 })}
                className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-500">Days</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Alerts merchandisers and factory GM when purchase order delivery date is approaching.
            </p>
          </div>

          {/* Target Deficit % */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              Production Target Deficit
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="50"
                value={config.targetDeficitPercent}
                onChange={(e) => setConfig({ ...config, targetDeficitPercent: parseInt(e.target.value) || 15 })}
                className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-500">% Below Target</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Dispatches warning when hourly production line output falls behind target SMV rate.
            </p>
          </div>

          {/* Line Report Overdue Grace Minutes */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              Line Report Overdue Grace
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="240"
                value={config.lineReportDelayMinutes}
                onChange={(e) => setConfig({ ...config, lineReportDelayMinutes: parseInt(e.target.value) || 60 })}
                className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-500">Minutes</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Dispatches escalation notice when floor supervisor fails to submit hourly QC report.
            </p>
          </div>
        </div>
      </div>

      {/* 3. ALL MODULE ALERT TRIGGERS & ROLE-BASED ACCESS MATRIX */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              All Module Alert Triggers &amp; Role Access Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enable/disable specific alert types and select exactly which user roles are permitted to receive each alert.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search alert types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Modules' },
            { id: 'BUYER_ORDERS', label: 'Buyer & Orders' },
            { id: 'PRODUCTION_IE', label: 'Production & IE' },
            { id: 'QUALITY_QC', label: 'Quality & Inspections' },
            { id: 'COMPLIANCE_AUDIT', label: 'Compliance & Audits' },
            { id: 'INVENTORY_WH', label: 'Inventory & Trims' },
            { id: 'GENERAL_HR', label: 'Documentation & HR' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Alert Rules Cards Grid */}
        <div className="space-y-3.5">
          {filteredCatalog.map((item) => {
            const rule = config.alertRules[item.id] || {
              alertTypeId: item.id,
              enabled: true,
              allowedRoles: item.defaultRoles,
            };

            const isEnabled = rule.enabled !== false;
            const allowedRoles = rule.allowedRoles || [];

            const severityColor =
              item.defaultSeverity === 'urgent'
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60'
                : item.defaultSeverity === 'warning'
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60'
                : 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isEnabled
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
                    : 'border-slate-200/60 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/40 opacity-60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Checkbox + Title + Description */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleToggleAlert(item.id, e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 mt-1 cursor-pointer"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase border ${severityColor}`}>
                          {item.defaultSeverity}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.module}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Role Recipient Selector */}
                  <div className="lg:max-w-md w-full pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-500" />
                        Permitted Role Recipients:
                      </span>

                      {isEnabled && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleSelectAllRolesForAlert(item.id, true)}
                            className="font-semibold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleSelectAllRolesForAlert(item.id, false)}
                            className="font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Admin Only
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Role Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {availableRoleNames.map((rName) => {
                        const isSelected = allowedRoles.includes(rName);
                        const isSuperAdminRole = rName === 'Super Admin';

                        return (
                          <button
                            key={rName}
                            type="button"
                            disabled={!isEnabled || isSuperAdminRole}
                            onClick={() => handleToggleRoleForAlert(item.id, rName)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-transparent hover:border-slate-300'
                            } disabled:opacity-75 disabled:cursor-default`}
                            title={
                              isSuperAdminRole
                                ? 'Super Admin always receives alerts'
                                : `Toggle ${rName} recipient access`
                            }
                          >
                            <span className="flex items-center gap-1">
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                              <span>{rName}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PRIMARY DELIVERY CHANNELS */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-blue-600" />
          Primary Delivery Channels
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* In-App Center */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <input
                type="checkbox"
                checked={config.inAppEnabled}
                onChange={(e) => setConfig({ ...config, inAppEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">In-App Alert Center</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Top-bar bell counter &amp; role-filtered alerts</div>
            </div>
          </div>

          {/* Sound Audio Chime */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <input
                type="checkbox"
                checked={config.soundAlerts}
                onChange={(e) => setConfig({ ...config, soundAlerts: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Live Audio Chime</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Subtle audio cue on urgent plant events</div>
            </div>
          </div>

          {/* Email SMTP */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="checkbox"
                checked={config.emailEnabled}
                onChange={(e) => setConfig({ ...config, emailEnabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Email Notifications</div>
              <div className="text-[11px] text-slate-500 mt-0.5">SMTP alerts for managers &amp; buyers</div>
            </div>
          </div>

          {/* Webhook Slack/Teams */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Webhook className="w-5 h-5" />
              </div>
              <input
                type="checkbox"
                checked={config.webhookEnabled}
                onChange={(e) => setConfig({ ...config, webhookEnabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Webhook Integration</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Slack, Teams &amp; custom webhooks</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. EMAIL & WEBHOOK DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <Mail className="w-4 h-4 text-blue-600" />
            Email Alert Configuration
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Email List (Comma-separated)
              </label>
              <input
                type="text"
                value={config.emailRecipients}
                onChange={(e) => setConfig({ ...config, emailRecipients: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                SMTP Host Address
              </label>
              <input
                type="text"
                value={config.smtpHost}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <Webhook className="w-4 h-4 text-purple-600" />
            Slack / Teams Webhook Dispatch
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Incoming Webhook Endpoint URL
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Channel Name
              </label>
              <input
                type="text"
                value={config.webhookChannel}
                onChange={(e) => setConfig({ ...config, webhookChannel: e.target.value })}
                placeholder="#factory-quality-alerts"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
