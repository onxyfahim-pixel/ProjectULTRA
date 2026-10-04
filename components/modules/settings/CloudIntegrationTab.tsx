'use client';

import React, { useState } from 'react';
import {
  Cloud,
  Server,
  Key,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Send,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  Sliders,
  FileCode,
  HardDrive,
  Cpu,
  Radio,
  Eye,
  EyeOff,
} from 'lucide-react';

interface CloudProvider {
  id: 'aws' | 'gcp' | 'azure' | 'r2';
  name: string;
  badge: string;
  iconColor: string;
  bucket: string;
  region: string;
  endpoint: string;
  status: 'connected' | 'unconfigured' | 'testing';
  isAutoBackup: boolean;
  autoSyncPhotos: boolean;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  system: 'SAP' | 'Oracle NetSuite' | 'FastReact' | 'Custom';
  url: string;
  events: string[];
  status: 'active' | 'paused';
  lastPing: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  role: string;
  created: string;
  lastUsed: string;
}

export function CloudIntegrationTab() {
  // Cloud Storage State
  const [providers, setProviders] = useState<CloudProvider[]>([
    {
      id: 'aws',
      name: 'Amazon Web Services (AWS S3)',
      badge: 'S3 Standard',
      iconColor: 'text-amber-500',
      bucket: 'garments-qms-ultra-apac',
      region: 'ap-southeast-1 (Singapore)',
      endpoint: 'https://s3.ap-southeast-1.amazonaws.com',
      status: 'connected',
      isAutoBackup: true,
      autoSyncPhotos: true,
    },
    {
      id: 'gcp',
      name: 'Google Cloud Storage (GCS)',
      badge: 'Nearline Archive',
      iconColor: 'text-blue-500',
      bucket: 'qms-audit-archives',
      region: 'asia-south1 (Mumbai)',
      endpoint: 'https://storage.googleapis.com',
      status: 'unconfigured',
      isAutoBackup: false,
      autoSyncPhotos: false,
    },
    {
      id: 'azure',
      name: 'Microsoft Azure Blob Storage',
      badge: 'Hot Tier',
      iconColor: 'text-sky-500',
      bucket: 'fabric-inspection-blobs',
      region: 'Southeast Asia',
      endpoint: 'https://garmentsqms.blob.core.windows.net',
      status: 'unconfigured',
      isAutoBackup: false,
      autoSyncPhotos: false,
    },
    {
      id: 'r2',
      name: 'Cloudflare R2 Object Storage',
      badge: 'Zero Egress Fees',
      iconColor: 'text-orange-500',
      bucket: 'qms-edge-cdn-assets',
      region: 'Automatic (Global)',
      endpoint: 'https://*.r2.cloudflarestorage.com',
      status: 'connected',
      isAutoBackup: true,
      autoSyncPhotos: true,
    },
  ]);

  // Selected Storage for editing
  const [selectedProviderId, setSelectedProviderId] = useState<'aws' | 'gcp' | 'azure' | 'r2'>('aws');
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; latency: number } | null>(null);
  const [isTestingProvider, setIsTestingProvider] = useState(false);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([
    {
      id: 'wh-1',
      name: 'SAP S/4HANA Material Master',
      system: 'SAP',
      url: 'https://sap-gateway.enterprise.factory.internal/rest/v2/qms/sync',
      events: ['material.inward', 'inspection.grade_approved', 'lot.quarantine'],
      status: 'active',
      lastPing: '2 mins ago (HTTP 200 OK)',
    },
    {
      id: 'wh-2',
      name: 'FastReact Sewing Floor Schedule',
      system: 'FastReact',
      url: 'https://fastreact.cloud.app/api/webhooks/garments-order-status',
      events: ['order.dhusurpass', 'production.line_stop', 'capa.escalation'],
      status: 'active',
      lastPing: '18 mins ago (HTTP 200 OK)',
    },
    {
      id: 'wh-3',
      name: 'Oracle NetSuite Financials & Purchase Order',
      system: 'Oracle NetSuite',
      url: 'https://restlets.netsuite.com/app/site/hosting/restlet.nl?script=42&deploy=1',
      events: ['inspection.rejected_supplier_debit', 'inventory.consumption'],
      status: 'paused',
      lastPing: '3 hours ago (Paused)',
    },
  ]);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key-1',
      name: 'Factory Floor Tablet Terminal Token',
      prefix: 'ultra_live_948f2...',
      role: 'WAREHOUSE_INSPECTOR',
      created: '2026-08-15',
      lastUsed: 'Just now',
    },
    {
      id: 'key-2',
      name: 'Sewing Line IoT Edge Gateway Key',
      prefix: 'ultra_live_bc71e...',
      role: 'PRODUCTION_HEAD',
      created: '2026-09-01',
      lastUsed: '4 mins ago',
    },
    {
      id: 'key-3',
      name: 'SAP ETL Nightly Sync Service',
      prefix: 'ultra_live_201ae...',
      role: 'ADMIN',
      created: '2026-09-10',
      lastUsed: 'Yesterday 23:59',
    },
  ]);

  // Test Webhook Dispatcher
  const [testWebhookUrl, setTestWebhookUrl] = useState('https://webhook.site/test-qms-listener');
  const [testEvent, setTestEvent] = useState('inspection.batch_completed');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  // New API Key Modal State
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRole, setNewKeyRole] = useState('WAREHOUSE_INSPECTOR');
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  const handleTestStorageConnection = () => {
    setIsTestingProvider(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTestingProvider(false);
      setTestResult({
        provider: selectedProvider.name,
        success: true,
        latency: Math.floor(Math.random() * 45) + 25,
      });
      setProviders((prev) =>
        prev.map((p) => (p.id === selectedProviderId ? { ...p, status: 'connected' } : p))
      );
    }, 900);
  };

  const handleTriggerWebhookTest = () => {
    setDispatching(true);
    setDispatchStatus(null);
    setTimeout(() => {
      setDispatching(false);
      setDispatchStatus(`Successfully delivered ${testEvent} payload to endpoint (200 OK • 42ms)`);
      setTimeout(() => setDispatchStatus(null), 5000);
    }, 750);
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomSecret = `ultra_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      prefix: `${randomSecret.substring(0, 15)}...`,
      role: newKeyRole,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setNewlyCreatedSecret(randomSecret);
    setNewKeyName('');
  };

  const handleRevokeKey = (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? Applications using it will instantly lose access.')) {
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    }
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border border-sky-200/50 dark:border-sky-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-500/20">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cloud Integration &amp; External ERP Systems</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synchronize audit records and roll photos with AWS S3 / Cloudflare R2, connect SAP / NetSuite webhooks, and issue API tokens.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsGeneratingKey(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Generate API Key
          </button>
        </div>
      </div>

      {/* 1. Cloud Storage Providers */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-sky-600" />
              Multi-Cloud Object Storage (Defect Photos &amp; Database Backups)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automatically stream high-resolution fabric defect photos and automated daily SQL backups to offsite cloud buckets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Target Provider:</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProviderId(p.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    selectedProviderId === p.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Provider Configuration Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Cloud className={`w-6 h-6 ${selectedProvider.iconColor}`} />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedProvider.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {selectedProvider.badge}
                    </span>
                    <span className="text-xs text-slate-500">{selectedProvider.region}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedProvider.status === 'connected'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedProvider.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  ></span>
                  {selectedProvider.status === 'connected' ? 'Connected & Verified' : 'Standby / Unlinked'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Storage Bucket / Container Name
                </label>
                <input
                  type="text"
                  value={selectedProvider.bucket}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProviders((prev) =>
                      prev.map((p) => (p.id === selectedProviderId ? { ...p, bucket: val } : p))
                    );
                  }}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Region / Datacenter Identifier
                </label>
                <input
                  type="text"
                  value={selectedProvider.region}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProviders((prev) =>
                      prev.map((p) => (p.id === selectedProviderId ? { ...p, region: val } : p))
                    );
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Access Key ID / Account ID
                </label>
                <input
                  type="password"
                  defaultValue="AKIAIOSFODNN7EXAMPLE"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  defaultValue="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestStorageConnection}
                disabled={isTestingProvider}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 ${isTestingProvider ? 'animate-spin' : ''}`} />
                {isTestingProvider ? 'Testing Cloud Bucket Ping...' : 'Test Storage Handshake'}
              </button>

              {testResult && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Handshake OK: {testResult.latency} ms roundtrip to {selectedProvider.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sync Automation Toggles */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              Automated Cloud Policies
            </h4>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedProvider.autoSyncPhotos}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setProviders((prev) =>
                    prev.map((p) => (p.id === selectedProviderId ? { ...p, autoSyncPhotos: checked } : p))
                  );
                }}
                className="w-4 h-4 text-sky-600 rounded mt-0.5"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Instant Roll Defect Photo Offload
                </span>
                <span className="text-[11px] text-slate-500">
                  Upload raw camera pictures from fabric inspection lines immediately to save host disk.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedProvider.isAutoBackup}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setProviders((prev) =>
                    prev.map((p) => (p.id === selectedProviderId ? { ...p, isAutoBackup: checked } : p))
                  );
                }}
                className="w-4 h-4 text-sky-600 rounded mt-0.5"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Automated Daily Disaster Backup
                </span>
                <span className="text-[11px] text-slate-500">
                  Push encrypted midnight SQL snapshots directly to this cloud repository.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Enterprise ERP Webhooks Integration */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              Enterprise ERP Webhook Pipelines (SAP • NetSuite • FastReact)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Emit real-time events when fabric lots are approved, quarantine holds trigger, or production quotas shift.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{wh.name}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      wh.system === 'SAP'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : wh.system === 'FastReact'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {wh.system}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wh.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {wh.status === 'active' ? 'Active Pipeline' : 'Paused'}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {wh.url}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {wh.events.map((ev) => (
                    <span
                      key={ev}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">{wh.lastPing}</span>
                <button
                  type="button"
                  onClick={() => handleToggleWebhook(wh.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {wh.status === 'active' ? 'Pause Pipeline' : 'Resume Pipeline'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Webhook Ping Tester */}
        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Instant Webhook Event Dispatcher &amp; Ping Simulator
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="url"
                value={testWebhookUrl}
                onChange={(e) => setTestWebhookUrl(e.target.value)}
                placeholder="https://your-webhook-endpoint.com/qms"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
              />
            </div>
            <div>
              <select
                value={testEvent}
                onChange={(e) => setTestEvent(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
              >
                <option value="inspection.batch_completed">inspection.batch_completed</option>
                <option value="order.dhu_critical_exceeded">order.dhu_critical_exceeded</option>
                <option value="capa.issued_to_supplier">capa.issued_to_supplier</option>
                <option value="fabric.quarantine_triggered">fabric.quarantine_triggered</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleTriggerWebhookTest}
              disabled={dispatching}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${dispatching ? 'animate-pulse' : ''}`} />
              {dispatching ? 'Dispatching Ping...' : 'Dispatch Test Payload'}
            </button>

            {dispatchStatus && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                {dispatchStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. API Keys Management */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Enterprise REST &amp; WebSocket API Access Keys ({apiKeys.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Tokens are hashed with Argon2id on Host server</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Key Purpose / Name</th>
                <th className="py-3 px-4">Key Token Prefix</th>
                <th className="py-3 px-4">Bound Role Scope</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {k.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-purple-600 dark:text-purple-400">
                    {k.prefix}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {k.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{k.created}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{k.lastUsed}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRevokeKey(k.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Revoke API key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New API Key Generator Modal */}
      {isGeneratingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                Issue New System API Key
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsGeneratingKey(false);
                  setNewlyCreatedSecret(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {newlyCreatedSecret ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Copy Your Secret Key Now</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    For security purposes, this full token is only shown once. Keep it in a secure environment variable.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-emerald-400 break-all select-all">
                    {newlyCreatedSecret}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedSecret);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsGeneratingKey(false);
                    setNewlyCreatedSecret(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  I Have Safely Saved This Token
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateApiKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Application / Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Warehouse Barcode Scanner Service"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bound Role Permissions
                  </label>
                  <select
                    value={newKeyRole}
                    onChange={(e) => setNewKeyRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="WAREHOUSE_INSPECTOR">WAREHOUSE_INSPECTOR (Fabric Inward / Roll Scan)</option>
                    <option value="PRODUCTION_HEAD">PRODUCTION_HEAD (Cutting &amp; Line Data)</option>
                    <option value="QA_MANAGER">QA_MANAGER (Approve Inspections &amp; CAPAs)</option>
                    <option value="ADMIN">ADMIN (Full Root Integration)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsGeneratingKey(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    Generate &amp; Issue Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
