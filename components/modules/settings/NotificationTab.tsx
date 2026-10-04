'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Webhook,
  AlertTriangle,
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
} from 'lucide-react';

export interface NotificationSettings {
  // Channels
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  webhookEnabled: boolean;

  // Email Config
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  emailRecipients: string;
  emailDigestFrequency: 'INSTANT' | 'DAILY_DIGEST' | 'WEEKLY';

  // Webhook
  webhookUrl: string;
  webhookChannel: string;

  // SMS Gateway
  smsProvider: string;
  smsPhoneNumbers: string;

  // Event Triggers
  notifyCriticalDefects: boolean;
  notifyAqlRejections: boolean;
  notifyCapaOverdue: boolean;
  notifyQuarantineInward: boolean;
  notifyCustomerClaims: boolean;
  notifyAuditReminders: boolean;
  notifyStorageAlerts: boolean;

  // Sound & Schedule
  soundAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  inAppEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  webhookEnabled: true,

  smtpHost: 'smtp.mailgun.org',
  smtpPort: 587,
  smtpUser: 'qms-alerts@valiantgarments.com',
  emailRecipients: 'qa.director@valiantgarments.com, factory.gm@valiantgarments.com',
  emailDigestFrequency: 'INSTANT',

  webhookUrl: 'https://hooks.slack.com/services/T00/B00/XXXXX',
  webhookChannel: '#quality-alerts-factory',

  smsProvider: 'Twilio Gateway API',
  smsPhoneNumbers: '+8801711002233, +8801819445566',

  notifyCriticalDefects: true,
  notifyAqlRejections: true,
  notifyCapaOverdue: true,
  notifyQuarantineInward: true,
  notifyCustomerClaims: true,
  notifyAuditReminders: true,
  notifyStorageAlerts: true,

  soundAlerts: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
};

export function NotificationTab() {
  const [config, setConfig] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [savedNotice, setSavedNotice] = useState(false);
  const [testSentNotice, setTestSentNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('garments_erp_notifications_v1');
      if (stored) {
        setConfig((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {
      // fallback
    }
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('garments_erp_notifications_v1', JSON.stringify(config));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleSendTestNotification = () => {
    setTestSentNotice('Test alert dispatched to in-app notification center and connected webhook channel!');
    // If sound enabled, produce a gentle web audio beep
    if (config.soundAlerts && typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch {
        // audio blocked
      }
    }

    setTimeout(() => setTestSentNotice(null), 4000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-200/60 dark:border-amber-900/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Notification &amp; Alert Dispatch Governance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure alert channels, email SMTP, SMS dispatch, webhook web endpoints, and automated quality threshold triggers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>Test Alert</span>
          </button>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Notification dispatch rules and triggers successfully saved!</span>
        </div>
      )}

      {testSentNotice && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>{testSentNotice}</span>
        </div>
      )}

      {/* 1. NOTIFICATION CHANNELS TOGGLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-amber-500" />
          Primary Delivery Channels
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* In-App */}
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
              <div className="text-[11px] text-slate-500 mt-0.5">Top-bar bell counter &amp; toast alerts</div>
            </div>
          </div>

          {/* Email */}
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

          {/* Webhook */}
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
              <div className="text-[11px] text-slate-500 mt-0.5">Slack, Teams &amp; custom endpoints</div>
            </div>
          </div>

          {/* SMS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <input
                type="checkbox"
                checked={config.smsEnabled}
                onChange={(e) => setConfig({ ...config, smsEnabled: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">SMS Gateway Alerts</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Urgent line stoppage text messages</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AUTOMATED EVENT TRIGGERS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Zap className="w-4 h-4 text-amber-500" />
          Critical QMS Event Triggers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {[
            {
              id: 'notifyCriticalDefects',
              label: 'Critical Defect Spikes (> 2.5% DHU)',
              desc: 'Instant broadcast when sewing line reports critical needle holes or seam defects.',
              checked: config.notifyCriticalDefects,
            },
            {
              id: 'notifyAqlRejections',
              label: 'AQL Final Inspection Rejections',
              desc: 'Alert QA Manager immediately when an export shipment FRI audit fails criteria.',
              checked: config.notifyAqlRejections,
            },
            {
              id: 'notifyCapaOverdue',
              label: 'CAPA 8D Overdue & Pending Verification',
              desc: 'Send daily reminder when corrective action plan exceeds target resolution date.',
              checked: config.notifyCapaOverdue,
            },
            {
              id: 'notifyQuarantineInward',
              label: 'Material Inward Quarantine (ASTM > 28 pts)',
              desc: 'Alert Warehouse Store Manager if fabric roll exceeds 4-point penalty tolerance.',
              checked: config.notifyQuarantineInward,
            },
            {
              id: 'notifyCustomerClaims',
              label: 'Customer Complaint / Debit Note Logged',
              desc: 'Notify Commercial Merchandiser and General Manager when buyer claim is received.',
              checked: config.notifyCustomerClaims,
            },
            {
              id: 'notifyAuditReminders',
              label: 'ISO 9001 / WRAP Audit Due Reminders',
              desc: 'Send preparation alerts 14 days and 3 days prior to scheduled factory audit.',
              checked: config.notifyAuditReminders,
            },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => setConfig({ ...config, [item.id]: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded mt-0.5 cursor-pointer"
              />
              <div>
                <div className="font-bold text-slate-900 dark:text-white leading-tight">{item.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 3. EMAIL & WEBHOOK DISPATCH DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Setup */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
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
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SMTP Host Address
                </label>
                <input
                  type="text"
                  value={config.smtpHost}
                  onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Digest Frequency
                </label>
                <select
                  value={config.emailDigestFrequency}
                  onChange={(e) => setConfig({ ...config, emailDigestFrequency: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INSTANT">Instant Alert</option>
                  <option value="DAILY_DIGEST">Daily Summary Digest</option>
                  <option value="WEEKLY">Weekly Executive Report</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Setup */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
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
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500 font-mono text-[11px]"
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
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
