import { NextResponse } from 'next/server';
import os from 'os';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';

export async function GET() {
  const startTime = Date.now();
  const interfaces = os.networkInterfaces();
  const lanIps: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        if (net.family === 'IPv4' && !net.internal) {
          lanIps.push(net.address);
        }
      }
    }
  }

  const primaryLanIp = lanIps.find((ip) => ip.startsWith('192.168.')) || lanIps[0] || '127.0.0.1';
  const port = process.env.PORT || 3000;

  // System Health Metrics
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = totalMemBytes - freeMemBytes;
  const memUsagePercent = ((usedMemBytes / totalMemBytes) * 100).toFixed(1);

  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown Processor';
  const cpuCores = cpus.length;

  const processMem = process.memoryUsage();

  // Test direct MySQL ping if connected
  let mysqlPingMs: number | null = null;
  const isMysql = erpStore.isMysqlActive();
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
    platform: os.platform(),
    osRelease: os.release(),
    architecture: os.arch(),
    primaryLanIp,
    allLanIps: lanIps,
    port,
    localUrl: `http://localhost:${port}`,
    lanUrl: `http://${primaryLanIp}:${port}`,
    wsUrl: `ws://${primaryLanIp}:${port}/ws`,
    centralDataFile: erpStore.getStorageFilePath(),
    databaseEngine: isMysql ? 'MySQL Server 8.0+ (Host Database)' : 'Local JSON File (Offline Fallback)',
    isMysqlConnected: isMysql,
    mysqlPingMs,
    systemHealth: {
      uptimeSeconds: os.uptime(),
      processUptimeSeconds: Math.floor(process.uptime()),
      totalMemoryGB: (totalMemBytes / (1024 * 1024 * 1024)).toFixed(2),
      freeMemoryGB: (freeMemBytes / (1024 * 1024 * 1024)).toFixed(2),
      usedMemoryGB: (usedMemBytes / (1024 * 1024 * 1024)).toFixed(2),
      memoryUsagePercent: parseFloat(memUsagePercent),
      nodeProcessMemoryMB: (processMem.heapUsed / (1024 * 1024)).toFixed(1),
      cpuModel,
      cpuCores,
      nodeVersion: process.version,
      pid: process.pid,
      responseTimeMs,
    },
    stats: erpStore.getDashboardStats(),
  });
}

