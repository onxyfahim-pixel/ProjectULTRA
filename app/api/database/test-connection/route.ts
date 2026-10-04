import { NextRequest, NextResponse } from 'next/server';
import { mysqlManager } from '@/lib/db/mysql-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { host = 'localhost', port = 3306, user = 'root', password = '', database = 'garments_erp' } = body;

    const result = await mysqlManager.testCustomConnection({
      host: host.trim(),
      port: Number(port) || 3306,
      user: user.trim(),
      password: password || '',
      database: database.trim(),
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully connected to MySQL! Response time: ${result.latencyMs}ms. Version: ${result.serverVersion}`,
        latencyMs: result.latencyMs,
        serverVersion: result.serverVersion,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
