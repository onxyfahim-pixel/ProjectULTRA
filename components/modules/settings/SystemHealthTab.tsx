'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Server,
  RefreshCw,
  Clock,
  Radio,
  Zap,
  Globe,
  Terminal,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface HostTelemetry {
  hostName: string;
  platform: string;
  osRelease: string;
  architecture: string;
  primaryLanIp: string;
  allLanIps: string[];
  port: number;
  localUrl: string;
  lanUrl: string;
  wsUrl: string;
  databaseEngine: string;
  isMysqlConnected: boolean;
  mysqlPingMs: number | null;
  systemHealth: {
    uptimeSeconds: number;
    processUptimeSeconds: number;
    totalMemoryGB: string;
    freeMemoryGB: string;
    usedMemoryGB: string;
    memoryUsagePercent: number;
    nodeProcessMemoryMB: string;
    cpuModel: string;
    cpuCores: number;
    nodeVersion: string;
    pid: number;
    responseTimeMs: number;
  };
  stats: {
    totalInventoryMeters: number;
    totalRolls: number;
    activeOrders: number;
    inspectionCount: number;
    itemCount: number;
    lastSync: string;
  };
}

export function SystemHealthTab() {
  const [telemetry, setTelemetry] = useState<HostTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pingResult, setPingResult] = useState<{ ms: number; timestamp: string } | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const fetchHostInfo = async () => {
    try {
      const res = await fetch('/api/host-info');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error('Failed to fetch host health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostInfo();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHostInfo();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handlePing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/host-info');
      const end = performance.now();
      if (res.ok) {
        const pingTime = Math.round(end - start);
        setPingResult({ ms: pingTime, timestamp: new Date().toLocaleTimeString() });
      }
    } catch {
      setPingResult({ ms: -1, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setIsPinging(false);
    }
  };

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-transparent border border-teal-200/50 dark:border-teal-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Host PC Live Telemetry & System Health</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time monitoring of CPU load, RAM allocation, LAN interfaces, and WebSocket connections on Host PC.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePing}
            disabled={isPinging}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-500 ${isPinging ? 'animate-pulse' : ''}`} />
            {isPinging ? 'Pinging...' : 'Ping Latency'}
          </button>

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              autoRefresh
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-white' : 'text-slate-400'}`} />
            {autoRefresh ? 'Auto 4s: ON' : 'Live Auto-Sync'}
          </button>

          <button
            type="button"
            onClick={fetchHostInfo}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-xs cursor-pointer"
            title="Refresh metrics now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {pingResult && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Host API Roundtrip Latency:</span>
            <span className="font-mono text-sm text-blue-700 dark:text-blue-300">
              {pingResult.ms >= 0 ? `${pingResult.ms} ms` : 'Failed'}
            </span>
          </div>
          <span className="text-[11px] text-blue-500">Tested at {pingResult.timestamp}</span>
        </div>
      )}

      {/* 4 Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RAM Usage */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">System RAM</span>
            <HardDrive className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {telemetry?.systemHealth.memoryUsagePercent || 0}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {telemetry?.systemHealth.usedMemoryGB || '0'} GB / {telemetry?.systemHealth.totalMemoryGB || '0'} GB Used
          </p>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (telemetry?.systemHealth.memoryUsagePercent || 0) > 85
                  ? 'bg-rose-500'
                  : (telemetry?.systemHealth.memoryUsagePercent || 0) > 65
                  ? 'bg-amber-500'
                  : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(telemetry?.systemHealth.memoryUsagePercent || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* CPU Cores */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Host Processor</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {telemetry?.systemHealth.cpuCores || 0} Cores
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={telemetry?.systemHealth.cpuModel}>
            {telemetry?.systemHealth.cpuModel || 'Processor'}
          </p>
          <div className="mt-3 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            Arch: {telemetry?.architecture || 'x64'} ({telemetry?.platform || 'Windows'})
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Process Uptime</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {formatUptime(telemetry?.systemHealth.processUptimeSeconds || 0)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Node.js {telemetry?.systemHealth.nodeVersion || process.version}
          </p>
          <div className="mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            Heap: {telemetry?.systemHealth.nodeProcessMemoryMB || '0'} MB RAM
          </div>
        </div>

        {/* Database Mode */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Database Engine</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white mb-1">
            {telemetry?.isMysqlConnected ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>MySQL 8.0+</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Local JSON</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {telemetry?.isMysqlConnected
              ? `Host Latency: ${telemetry?.mysqlPingMs !== null ? `${telemetry.mysqlPingMs}ms` : '<1ms'}`
              : 'Local Disk Backup Mode'}
          </p>
          <div className="mt-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            Port: 3306 (garments_erp)
          </div>
        </div>
      </div>

      {/* Network & LAN Wi-Fi Connection Details */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Wifi className="w-4 h-4 text-teal-600" />
          Host PC Network & Multi-Device Wi-Fi Endpoints
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
              Local Browser (This Host PC)
            </span>
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 block mb-2 select-all">
              {telemetry?.localUrl || 'http://localhost:3000'}
            </span>
            <span className="text-[11px] text-slate-500">For direct administrative use on this physical computer.</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
              Mobile / Tablet Wi-Fi LAN Address
            </span>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-2 select-all">
              {telemetry?.lanUrl || `http://${telemetry?.primaryLanIp || '192.168.x.x'}:3000`}
            </span>
            <span className="text-[11px] text-slate-500">
              Open this link on any floor tablet or barcode scanner connected to factory Wi-Fi.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
              Real-Time WebSocket Stream
            </span>
            <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 block mb-2 select-all">
              {telemetry?.wsUrl || `ws://${telemetry?.primaryLanIp || '192.168.x.x'}:3000/ws`}
            </span>
            <span className="text-[11px] text-slate-500">
              Provides millisecond live push notifications for stock and QC inspections.
            </span>
          </div>
        </div>

        {/* All Detected LAN IPs */}
        {telemetry?.allLanIps && telemetry.allLanIps.length > 1 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Additional Host Network Interfaces:</span>
            {telemetry.allLanIps.map((ip) => (
              <span key={ip} className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {ip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
