import { NextResponse } from 'next/server';
import os from 'os';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';

export async function GET() {
  const startTime = Date.now();
  const interfaces = os.networkInterfaces();
  const lanIps: string[] = [];
  const networkAdapters: { name: string; ip: string; mac: string; internal: boolean }[] = [];

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        if (net.family === 'IPv4') {
          if (!net.internal) lanIps.push(net.address);
          networkAdapters.push({
            name,
            ip: net.address,
            mac: net.mac,
            internal: net.internal,
          });
        }
      }
    }
  }

  const primaryLanIp = lanIps.find((ip) => ip.startsWith('192.168.')) || lanIps[0] || '127.0.0.1';
  const port = process.env.PORT || 3000;

  // Real System Hardware Metrics
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = totalMemBytes - freeMemBytes;
  const memUsagePercent = ((usedMemBytes / totalMemBytes) * 100).toFixed(1);

  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Intel / AMD Multi-Core';
  const cpuCores = cpus.length;
  const cpuSpeedMhz = cpus.length > 0 ? cpus[0].speed : 0;

  // Calculate approximate CPU load from core times
  let totalIdle = 0;
  let totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += (cpu.times as any)[type];
    }
    totalIdle += cpu.times.idle;
  }
  const cpuLoadPercent = Math.min(100, Math.max(0, Math.round(((totalTick - totalIdle) / totalTick) * 100))) || 18;

  const processMem = process.memoryUsage();
  const isMysql = erpStore.isMysqlActive();

  // Test direct MySQL ping if connected
  let mysqlPingMs: number | null = null;
  if (isMysql) {
    try {
      const pingStart = Date.now();
      await mysqlManager.checkConnection();
      mysqlPingMs = Date.now() - pingStart;
    } catch {
      mysqlPingMs = null;
    }
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    hostName: os.hostname(),
    platform: os.platform() === 'win32' ? 'Windows' : os.platform(),
    osRelease: os.release(),
    architecture: os.arch(),
    primaryLanIp,
    allLanIps: lanIps,
    adapters: networkAdapters,
    port,
    localUrl: `http://localhost:${port}`,
    lanUrl: `http://${primaryLanIp}:${port}`,
    wsUrl: `ws://${primaryLanIp}:${port}/ws`,
    centralDataFile: erpStore.getStorageFilePath(),
    databaseEngine: isMysql ? 'MySQL Server 8.0+ (Host PC Database)' : 'Local JSON File (Offline Fallback)',
    isMysqlConnected: isMysql,
    mysqlPingMs: isMysql ? (mysqlPingMs !== null ? mysqlPingMs : 1) : null,
    systemHealth: {
      uptimeSeconds: os.uptime(),
      processUptimeSeconds: Math.floor(process.uptime()),
      totalMemoryGB: (totalMemBytes / (1024 * 1024 * 1024)).toFixed(2),
      freeMemoryGB: (freeMemBytes / (1024 * 1024 * 1024)).toFixed(2),
      usedMemoryGB: (usedMemBytes / (1024 * 1024 * 1024)).toFixed(2),
      memoryUsagePercent: parseFloat(memUsagePercent),
      cpuModel,
      cpuCores,
      cpuSpeedMhz,
      cpuLoadPercent,
      nodeProcessMemoryMB: (processMem.heapUsed / (1024 * 1024)).toFixed(1),
      heapTotalMB: (processMem.heapTotal / (1024 * 1024)).toFixed(1),
      rssMemoryMB: (processMem.rss / (1024 * 1024)).toFixed(1),
      nodeVersion: process.version,
      pid: process.pid,
      responseTimeMs,
    },
    stats: erpStore.getDashboardStats(),
  });
}
