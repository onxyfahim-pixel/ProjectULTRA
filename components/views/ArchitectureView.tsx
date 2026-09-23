'use client';

import React, { useState } from 'react';
import { Database, ShieldCheck, Radio, Server, Code, FileText, CheckCircle2, Zap, Layers, Network } from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { useLiveSync } from '@/hooks/use-live-sync';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';

interface ArchitectureEndpoint {
  id: string;
  name: string;
  type: 'PRISMA_MODEL' | 'EXPRESS_ROUTE' | 'WEBSOCKET_CHANNEL';
  target: string;
  description: string;
  protocolSecurity: string;
}

const ARCHITECTURE_LIST: ArchitectureEndpoint[] = [
  {
    id: 'arch-01',
    name: 'model User',
    type: 'PRISMA_MODEL',
    target: 'prisma/schema.prisma -> "users"',
    description: 'Bcrypt hashed factory accounts with department assignment and Role enum (ADMIN, QA_MANAGER, OPERATOR)',
    protocolSecurity: 'PostgreSQL Relational • Salted Bcrypt',
  },
  {
    id: 'arch-02',
    name: 'model InventoryItem',
    type: 'PRISMA_MODEL',
    target: 'prisma/schema.prisma -> "inventory_items"',
    description: 'Raw fabric roll tracking, lot numbers, metersAvailable, QualityGrade, and StockStatus',
    protocolSecurity: 'PostgreSQL ACID • Audit Timestamps',
  },
  {
    id: 'arch-03',
    name: 'model InspectionRecord',
    type: 'PRISMA_MODEL',
    target: 'prisma/schema.prisma -> "inspections"',
    description: 'AQL 2.5 checkpoints (Fabric, Cutting, Sewing, Packing) with sample size and defect counts',
    protocolSecurity: 'Foreign Key (User & Lot) Cascade',
  },
  {
    id: 'arch-04',
    name: 'model DefectLog',
    type: 'PRISMA_MODEL',
    target: 'prisma/schema.prisma -> "defect_logs"',
    description: 'Garment defect taxonomy: Broken stitch, shade variation, oil stains, needle holes',
    protocolSecurity: 'Relational Link to InspectionRecord',
  },
  {
    id: 'arch-05',
    name: 'model ProductionOrder',
    type: 'PRISMA_MODEL',
    target: 'prisma/schema.prisma -> "production_orders"',
    description: 'Sewing lines 01-08 scheduling, target vs output quantities, line efficiency, and DHU calculations',
    protocolSecurity: 'Real-time WebSocket Broadcast Trigger',
  },
  {
    id: 'arch-06',
    name: 'POST /api/auth/login',
    type: 'EXPRESS_ROUTE',
    target: 'server.ts / routes/auth.ts',
    description: 'Factory operator authentication issuing HMAC SHA-256 JWT Bearer tokens with RBAC claims',
    protocolSecurity: 'JWT Bearer • Rate-Limited',
  },
  {
    id: 'arch-07',
    name: 'GET/POST /api/inventory',
    type: 'EXPRESS_ROUTE',
    target: 'server.ts / routes/inventory.ts',
    description: 'Warehouse fabric rolls CRUD, batch barcode intake, and roll meterage updates',
    protocolSecurity: 'RBAC: canEditInventory required for mutations',
  },
  {
    id: 'arch-08',
    name: 'ws://... /ws/telemetry',
    type: 'WEBSOCKET_CHANNEL',
    target: 'server.ts (WebSocketServer)',
    description: 'Sub-second real-time floor broadcast for barcode scans, grade changes, and quality alerts',
    protocolSecurity: 'JWT Auth Handshake • Ping/Pong Heartbeat',
  },
];

export function ArchitectureView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const { user, permissions } = useErpAuth();
  const { status, latencyMs, activeUsers } = useLiveSync();

  const columns: ColumnDef<ArchitectureEndpoint>[] = [
    {
      key: 'name',
      header: 'Component / Endpoint',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          {item.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Architecture Layer',
      sortable: true,
      filterOptions: [
        { label: 'Prisma Model', value: 'PRISMA_MODEL' },
        { label: 'Express Route', value: 'EXPRESS_ROUTE' },
        { label: 'WebSocket Channel', value: 'WEBSOCKET_CHANNEL' },
      ],
      render: (item) => {
        const colors = {
          PRISMA_MODEL: 'bg-purple-50 text-purple-700 border-purple-200',
          EXPRESS_ROUTE: 'bg-blue-50 text-blue-700 border-blue-200',
          WEBSOCKET_CHANNEL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return (
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${colors[item.type]}`}>
            {item.type.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      key: 'target',
      header: 'Source Target / Table',
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">{item.target}</span>
      ),
    },
    {
      key: 'description',
      header: 'System Purpose & Schema Spec',
      render: (item) => (
        <p className="text-xs text-slate-700 max-w-md">{item.description}</p>
      ),
    },
    {
      key: 'protocolSecurity',
      header: 'Security & Protocol',
      render: (item) => (
        <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
          {item.protocolSecurity}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="architecture-module"
        moduleCode="MOD-32"
        badge="System Architecture"
        title="PostgreSQL, Express, JWT &amp; WebSocket Architecture"
        subtitle="Express 5 API server with JWT/RBAC security, Prisma ORM schema for PostgreSQL, and low-latency WebSocket broadcast engine"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 Metrics"
        listCount={`${ARCHITECTURE_LIST.length} Architecture Specs`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Backend Server"
              value="Express 5 + Next.js"
              subtitle="Port 3000 Unified Gateway"
              icon={<Server className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Database ORM"
              value="PostgreSQL / Prisma"
              subtitle="Relational ACID Pool"
              icon={<Database className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Real-time Stream"
              value={`${latencyMs}ms Latency`}
              subtitle={`${activeUsers} Clients Connected (${status})`}
              icon={<Radio className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Security Protocol"
              value="JWT Bearer RBAC"
              subtitle={`Active Role: ${user.role}`}
              icon={<ShieldCheck className="w-5 h-5" />}
              tone="purple"
            />
          </div>

          {/* 3 Core Backend Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1: Express Server & Next.js Hybrid */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Express + Next.js Server</h3>
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                    server.ts : Port 3000
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                `server.ts` combines Express 5 with Next.js request handling. It mounts REST endpoints
                with CORS, body parsers, and custom WebSocket servers under a unified single-port
                deployment.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Express 5 custom routing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Unified Port 3000 reverse-proxy routing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dual REST API &amp; WebSocket server</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: JWT Authentication & RBAC */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">JWT &amp; RBAC Security</h3>
                  <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                    HMAC SHA-256 Tokens
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict Role-Based Access Control protecting every sensitive mutation. Authenticated via
                JWT Bearer tokens generated from `/api/auth/login`.
              </p>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active User:</span>
                  <strong className="text-slate-900">{user.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Role:</span>
                  <strong className="text-blue-700">{user.role}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inventory Edit:</span>
                  <span className={permissions.canEditInventory ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                    {permissions.canEditInventory ? 'Allowed' : 'Restricted'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Real-Time WebSockets */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Real-Time Sync Engine</h3>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                    WebSocket + Fallback SSE
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Low-latency multi-user synchronization. Stock barcode updates, grade changes, and AQL
                verdicts broadcast immediately to all warehouse operators.
              </p>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sync Status:</span>
                  <strong className="text-emerald-700 uppercase">{status}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Network Latency:</span>
                  <strong className="text-slate-900 font-mono">{latencyMs} ms</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Concurrent Clients:</span>
                  <strong className="text-slate-900">{activeUsers} online</strong>
                </div>
              </div>
            </div>
          </div>

          {/* PostgreSQL & Prisma Schema Representation */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  PostgreSQL Schema with Prisma ORM (`prisma/schema.prisma`)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">provider = &quot;postgresql&quot;</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-bold text-blue-700 font-mono">model User</div>
                <p className="text-[11px] text-slate-500">
                  Stores factory accounts with bcrypt password hashes, department assignments, and
                  `Role` enum (ADMIN, QA_MANAGER, WAREHOUSE_INSPECTOR, PRODUCTION_HEAD, OPERATOR).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-bold text-emerald-700 font-mono">model InventoryItem</div>
                <p className="text-[11px] text-slate-500">
                  Tracks raw fabric rolls, SKU, meters, batch lot, bin location, `QualityGrade`, and
                  `StockStatus` with audit update timestamps.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-bold text-purple-700 font-mono">model InspectionRecord</div>
                <p className="text-[11px] text-slate-500">
                  Captures AQL 2.5 checkpoints (Fabric Inward, Cutting, Sewing, End-Line) with sample
                  size, major/minor defect counts, and inspector relations.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-bold text-amber-700 font-mono">model DefectLog</div>
                <p className="text-[11px] text-slate-500">
                  Root-cause defect taxonomy: Broken stitch, shade variation, needle holes, puckering,
                  skewness, and corrective actions.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-bold text-indigo-700 font-mono">model ProductionOrder</div>
                <p className="text-[11px] text-slate-500">
                  Sewing line assignment (Lines 01-08), target vs output quantities, line efficiency %,
                  and calculated DHU rates.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-bold text-rose-700 font-mono">model AuditLog</div>
                <p className="text-[11px] text-slate-500">
                  Immutable compliance trail logging all user actions, stock adjustments, and quality
                  grade promotions.
                </p>
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Technical Endpoint &amp; Prisma Model Register"
            recordCount={ARCHITECTURE_LIST.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="architecture-components-table"
            title="Backend Endpoints, Prisma Models &amp; WebSocket Channels"
            subtitle="Full technical register of PostgreSQL Prisma models, Express REST routes, and WebSocket telemetry channels"
            data={ARCHITECTURE_LIST}
            columns={columns}
            searchPlaceholder="Search model, endpoint, or layer..."
            searchableKeys={['name', 'type', 'target', 'description', 'protocolSecurity']}
          />
        </div>
      )}
    </div>
  );
}
