import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      host = 'localhost',
      port = 3306,
      user = 'root',
      password = '',
      database = 'garments_erp',
    } = body;

    const trimmedHost = host.trim();
    const numericPort = Number(port) || 3306;
    const trimmedUser = user.trim();
    const safePass = password || '';
    const trimmedDb = database.trim() || 'garments_erp';

    // 1. Verify connection first
    const testResult = await mysqlManager.testCustomConnection({
      host: trimmedHost,
      port: numericPort,
      user: trimmedUser,
      password: safePass,
      database: trimmedDb,
    });

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.error || 'Connection failed',
        },
        { status: 400 }
      );
    }

    // 2. Persist to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const encodedUser = encodeURIComponent(trimmedUser);
    const encodedPass = encodeURIComponent(safePass);
    const dbUrl = `mysql://${encodedUser}:${encodedPass}@${trimmedHost}:${numericPort}/${trimmedDb}`;

    // Replace or add MySQL vars
    const envLines = envContent.split(/\r?\n/);
    const keysToUpdate: Record<string, string> = {
      DATABASE_URL: `"${dbUrl}"`,
      MYSQL_HOST: `"${trimmedHost}"`,
      MYSQL_PORT: `"${numericPort}"`,
      MYSQL_USER: `"${trimmedUser}"`,
      MYSQL_PASSWORD: `"${safePass}"`,
      MYSQL_DATABASE: `"${trimmedDb}"`,
    };

    const updatedLines = envLines.filter(
      (line) => !Object.keys(keysToUpdate).some((k) => line.trim().startsWith(`${k}=`))
    );

    for (const [k, v] of Object.entries(keysToUpdate)) {
      updatedLines.push(`${k}=${v}`);
    }

    fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf-8');

    // 3. Update in-memory pool configuration
    await mysqlManager.updateConfig({
      host: trimmedHost,
      port: numericPort,
      user: trimmedUser,
      password: safePass,
      database: trimmedDb,
    });

    // 4. Initialize schema and tables
    const initialized = await mysqlManager.initializeSchema();
    if (!initialized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connected to MySQL server, but failed to create database or tables. Please verify user permissions.',
        },
        { status: 500 }
      );
    }

    // 5. Seed data from store to MySQL
    await erpStore.initMysqlSync();

    const tableStats = await mysqlManager.getTableStatistics();

    return NextResponse.json({
      success: true,
      message: `MySQL Enterprise Database setup complete! Database "${trimmedDb}" is online and synchronized.`,
      tables: tableStats,
      telemetry: mysqlManager.getTelemetry(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
