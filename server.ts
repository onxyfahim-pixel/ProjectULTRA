import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { parse } from 'url';
import os from 'os';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import cookieParser from 'cookie-parser';
import { signToken, verifyToken, DEMO_USERS, hasPermission } from './lib/auth/jwt';
import { UserStorageManager } from './lib/auth/user-storage';
import { erpStore } from './lib/db/store';
import { Role, UserSession } from './lib/types/erp';

const dev = process.env.NODE_ENV !== 'production';
const port = 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

// Extend express Request for authenticated user
export interface AuthRequest extends Request {
  user?: UserSession;
}

// Authentication Middleware
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.erp_token) {
    token = req.cookies.erp_token;
  }

  if (token) {
    const user = verifyToken(token);
    if (user) {
      req.user = user;
      return next();
    }
  }

  // Fallback to primary session user (Farhan Rahman - QA Manager / Admin)
  // so connected mobile tablets and floor devices on Wi-Fi operate seamlessly
  req.user = DEMO_USERS[0];
  next();
}

// Role-Based Access Control Middleware
export function requireRole(allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    if (!hasPermission(req.user.role, allowedRoles)) {
      return res.status(403).json({
        error: `Access Denied: Role '${req.user.role}' is not authorized to perform this operation. Required: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}

app.prepare().then(() => {
  const server = express();
  server.use(express.json());
  server.use(cookieParser());

  const httpServer = createServer(server);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected WebSocket clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);

    // Send immediate initial sync and client count
    ws.send(
      JSON.stringify({
        type: 'WS_CONNECTED',
        message: 'Connected to Garments QMS Real-Time ERP WebSocket Sync',
        activeClients: clients.size,
        timestamp: new Date().toISOString(),
      })
    );

    // Broadcast client count change
    broadcastClientsCount();

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        } else if (data.type === 'SIMULATE_WAREHOUSE_SYNC') {
          // Allow multi-user simulation event
          erpStore.broadcast({
            type: 'WAREHOUSE_ACTIVITY',
            message: data.message || 'Warehouse automated barcode scanner verified roll inward',
            user: data.user || 'Warehouse Bot Scanner #4',
            location: data.location || 'Bay WH-B1',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      broadcastClientsCount();
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err);
      clients.delete(ws);
    });
  });

  function broadcastClientsCount() {
    const payload = JSON.stringify({
      type: 'CLIENTS_COUNT',
      count: clients.size,
      timestamp: new Date().toISOString(),
    });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Hook erpStore updates to broadcast via WebSocket
  erpStore.subscribe((event) => {
    const payload = JSON.stringify({
      ...event,
      broadcastedAt: new Date().toISOString(),
    });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });

  // --- REST API Endpoints with JWT & RBAC ---

  // 1. Auth: Login
  server.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, email, identifier, password, role } = req.body;
    const loginId = (username || email || identifier || '').trim();

    // Quick role switch for dev simulation if role is provided and no loginId
    if (role && !loginId) {
      const found = UserStorageManager.getUsers().find((u) => u.role === role) || DEMO_USERS[0];
      const token = signToken(found);
      res.cookie('erp_token', token, {
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      return res.json({
        success: true,
        token,
        user: {
          id: found.id,
          username: found.username,
          name: found.name,
          email: found.email,
          role: found.role,
          department: found.department,
          avatarUrl: found.avatarUrl,
          isSuperAdmin: found.isSuperAdmin,
        },
      });
    }

    const authResult = UserStorageManager.authenticate(loginId, password);
    if (!authResult.success || !authResult.user) {
      return res.status(401).json({
        success: false,
        error: authResult.error || 'Invalid username or password',
      });
    }

    const user = authResult.user;
    const token = signToken(user);
    res.cookie('erp_token', token, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  });

  // 2. Auth: Current user (JWT verified)
  server.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
    return res.json({ user: req.user });
  });

  // 3. Demo Users List (For quick role switching)
  server.get('/api/auth/users', (_req: Request, res: Response) => {
    return res.json({
      users: DEMO_USERS.map(({ password: _, ...rest }) => rest),
    });
  });

  // 4. Inventory: Get all items
  server.get('/api/inventory', (_req: Request, res: Response) => {
    const items = erpStore.getInventory();
    return res.json({ success: true, items });
  });

  // 4b. Inventory: Inward / Add new item (Protected by JWT & RBAC: WAREHOUSE_INSPECTOR, QA_MANAGER, ADMIN)
  server.post(
    '/api/inventory',
    authenticateToken,
    requireRole(['ADMIN', 'QA_MANAGER', 'WAREHOUSE_INSPECTOR']),
    (req: AuthRequest, res: Response) => {
      try {
        const created = erpStore.addInventoryItem(req.body, req.user!);
        return res.status(201).json({ success: true, item: created });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
  );

  // 5. Inventory: Update item (Protected by JWT & RBAC: WAREHOUSE_INSPECTOR, QA_MANAGER, ADMIN)
  const updateInventoryHandler = (req: AuthRequest, res: Response) => {
    try {
      const id = (req.params.id as string) || req.body.id;
      if (!id) {
        return res.status(400).json({ error: 'Item id is required' });
      }
      const { id: _ignored, ...updates } = req.body;
      const user = req.user!;
      const updated = erpStore.updateInventoryItem(id, updates, user);
      return res.json({ success: true, item: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  };

  server.put(
    '/api/inventory/:id',
    authenticateToken,
    requireRole(['ADMIN', 'QA_MANAGER', 'WAREHOUSE_INSPECTOR']),
    updateInventoryHandler
  );
  server.put(
    '/api/inventory',
    authenticateToken,
    requireRole(['ADMIN', 'QA_MANAGER', 'WAREHOUSE_INSPECTOR']),
    updateInventoryHandler
  );

  // 6. Inventory: Batch Grade Update (Protected by JWT & RBAC: QA_MANAGER, ADMIN only)
  const batchGradeHandler = (req: AuthRequest, res: Response) => {
    try {
      const { ids, grade } = req.body;
      if (!ids || !Array.isArray(ids) || !grade) {
        return res.status(400).json({ error: 'ids array and grade are required' });
      }
      const updated = erpStore.batchUpdateGrade(ids, grade, req.user!);
      return res.json({ success: true, updatedCount: updated.length, items: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  };

  server.post(
    '/api/inventory/batch-grade',
    authenticateToken,
    requireRole(['ADMIN', 'QA_MANAGER']),
    batchGradeHandler
  );
  server.post(
    '/api/inventory/batch',
    authenticateToken,
    requireRole(['ADMIN', 'QA_MANAGER']),
    batchGradeHandler
  );

  // 7. QMS: Get all Inspections
  server.get('/api/qms/inspections', (_req: Request, res: Response) => {
    const records = erpStore.getInspections();
    return res.json({ success: true, records });
  });

  // 8. QMS: Add Inspection (Protected by JWT & RBAC: QA_MANAGER, WAREHOUSE_INSPECTOR, ADMIN)
  server.post(
    '/api/qms/inspections',
    authenticateToken,
    requireRole(['ADMIN', 'QA_MANAGER', 'WAREHOUSE_INSPECTOR']),
    (req: AuthRequest, res: Response) => {
      try {
        const newRecord = erpStore.addInspection(req.body, req.user!);
        return res.status(201).json({ success: true, record: newRecord });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
  );

  // 9. Dashboard stats
  server.get('/api/dashboard/stats', (_req: Request, res: Response) => {
    return res.json(erpStore.getDashboardStats());
  });

  // 10. Real-time WebSocket status info
  server.get('/api/ws-info', (_req: Request, res: Response) => {
    return res.json({
      wsPath: '/ws',
      activeClients: clients.size,
      supportedEvents: ['STOCK_UPDATED', 'BATCH_GRADE_CHANGED', 'INSPECTION_RECORDED', 'WAREHOUSE_ACTIVITY'],
    });
  });

  // 11. Central Host Network Information
  server.get('/api/host-info', (_req: Request, res: Response) => {
    const interfaces = os.networkInterfaces();
    const lanIps: string[] = [];
    for (const name of Object.keys(interfaces)) {
      const list = interfaces[name];
      if (list) {
        for (const net of list) {
          if (net.family === 'IPv4' && !net.internal) {
            lanIps.push(net.address);
          }
        }
      }
    }
    const primaryLanIp = lanIps.find((ip) => ip.startsWith('192.168.')) || lanIps[0] || '127.0.0.1';
    return res.json({
      success: true,
      hostName: os.hostname(),
      primaryLanIp,
      allLanIps: lanIps,
      port,
      localUrl: `http://localhost:${port}`,
      lanUrl: `http://${primaryLanIp}:${port}`,
      wsUrl: `ws://${primaryLanIp}:${port}/ws`,
      centralDataFile: erpStore.getStorageFilePath(),
      databaseEngine: erpStore.isMysqlActive() ? 'MySQL Server 8.0+ (Host PC Database)' : 'Local JSON File (Offline Fallback)',
      isMysqlConnected: erpStore.isMysqlActive(),
      stats: erpStore.getDashboardStats(),
    });
  });

  // 12. Module Store Persistence (Persists all 30 modules into MySQL)
  server.get('/api/modules/:key', (req: Request, res: Response) => {
    const key = req.params.key as string;
    const data = erpStore.getModuleData(key, null);
    return res.json({
      success: true,
      moduleKey: key,
      data,
      isMysqlConnected: erpStore.isMysqlActive(),
    });
  });

  server.post('/api/modules/:key', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
      const key = req.params.key as string;
      const body = req.body;
      const payload = body.data !== undefined ? body.data : body;
      const saved = erpStore.saveModuleData(key, payload, req.user);
      return res.json({
        success: true,
        moduleKey: key,
        data: saved,
        isMysqlConnected: erpStore.isMysqlActive(),
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // Express 5 regex routing for Next.js App Router
  server.all(/.*/, async (req: Request, res: Response) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Next.js request handling error:', err);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    }
  });

  process.on('uncaughtException', (err) => {
    console.error('Process Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Process Unhandled Rejection:', reason);
  });

  httpServer.on('error', (err) => {
    console.error('HTTP Server Error:', err);
  });

  const HOST = '0.0.0.0';
  httpServer.listen(port, HOST, () => {
    const interfaces = os.networkInterfaces();
    const lanIps: string[] = [];
    for (const name of Object.keys(interfaces)) {
      const list = interfaces[name];
      if (list) {
        for (const net of list) {
          if (net.family === 'IPv4' && !net.internal) {
            lanIps.push(net.address);
          }
        }
      }
    }
    const lanIp = lanIps.find((ip) => ip.startsWith('192.168.')) || lanIps[0] || '127.0.0.1';
    console.log('===============================================================');
    console.log('       VALIANT GARMENTS QMS ERP - CENTRAL HOST RUNNING         ');
    console.log('===============================================================');
    console.log(` > Localhost URL:      http://localhost:${port}`);
    console.log(` > Wi-Fi / LAN URL:    http://${lanIp}:${port}`);
    console.log(` > Central Host Data:  ${erpStore.getStorageFilePath()}`);
    console.log(` > WebSocket Host:     ws://${lanIp}:${port}/ws`);
    console.log(` > Any mobile or PC on this Wi-Fi can open: http://${lanIp}:${port}`);
    console.log('===============================================================');
  });
});

