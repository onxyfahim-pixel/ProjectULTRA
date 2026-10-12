/**
 * Universal Audit Trail & Record View Tracking Service
 * Enterprise-grade audit system for Garments QMS ERP.
 * Tracks record creators, editors, timestamps, field-level change diffs,
 * view counts, and synchronizes seamlessly across all modules and the Settings audit trail.
 */

import { AuditLog, RecordChangeDiff, RecordViewEntry, RecordViewStats } from '@/lib/types/erp';
import { INITIAL_AUDIT_LOGS } from '@/lib/db/mock-data';

const STORAGE_KEYS = {
  AUDIT_LOGS: 'erp_universal_audit_logs_v1',
  RECORD_VIEWS: 'erp_record_views_v1',
  LEGACY_AUDIT_LOGS: 'erp_audit_logs',
};

export const AUDIT_LOGS_UPDATED_EVENT = 'erp_audit_logs_updated';
export const RECORD_VIEWS_UPDATED_EVENT = 'erp_record_views_updated';

// Friendly labels for common ERP fields in change diffs
const FIELD_LABEL_MAP: Record<string, string> = {
  status: 'Status',
  orderQuantity: 'Order Quantity (pcs)',
  fobPrice: 'FOB Price (USD)',
  currency: 'Currency',
  shipDate: 'Ship Date / CRD',
  cuttingStartDate: 'Cutting Start Date',
  styleNumber: 'Style Number',
  styleDescription: 'Style Description',
  buyerName: 'Buyer Name',
  buyer: 'Buyer Name',
  brand: 'Brand',
  season: 'Season',
  qualityStandard: 'Quality Standard',
  merchandiserName: 'Merchandiser',
  smv: 'SMV (Standard Minute Value)',
  productionTarget: 'Target Output Quantity',
  targetQuantity: 'Target Quantity (pcs)',
  completedQuantity: 'Completed Output (pcs)',
  sewingLine: 'Sewing / Floor Line',
  lineId: 'Line ID',
  section: 'Production Section',
  shift: 'Shift',
  dueDate: 'Due Date',
  defectRate: 'Defect Rate (%)',
  dhuRate: 'DHU Rate (%)',
  rftRate: 'RFT Rate (%)',
  efficiencyPercent: 'Efficiency (%)',
  totalDefects: 'Total Defects Count',
  rejectQuantity: 'Reject Quantity (pcs)',
  quantityMeters: 'Stock Quantity (Meters)',
  rollCount: 'Roll Count',
  qualityGrade: 'Quality Grade',
  stockStatus: 'Stock Status',
  warehouseLocation: 'Warehouse Location',
  batchLotNumber: 'Batch / Lot Number',
  unitCost: 'Unit Cost (USD)',
  sampleSize: 'AQL Sample Size',
  passCount: 'Pass Count',
  defectCount: 'Defect Count',
  majorDefects: 'Major Defects',
  minorDefects: 'Minor Defects',
  criticalDefects: 'Critical Defects',
  inspectorName: 'Auditor / Inspector',
  rootCause: 'Root Cause (RCA)',
  correctiveAction: 'Corrective Action Plan',
  preventiveAction: 'Preventive Action',
  assignedTo: 'Assigned Specialist',
  priority: 'Priority Level',
  remarks: 'Remarks / Notes',
  score: 'Audit Score (%)',
  grade: 'Audit Grade',
};

// Initial realistic audit seeds for standard ERP entities across modules
const SEED_AUDIT_LOGS: AuditLog[] = [
  ...INITIAL_AUDIT_LOGS.map((log) => ({
    ...log,
    entityCode: log.entityId,
    moduleName: log.entity === 'InventoryItem' ? 'Raw Material Inventory' : 'Quality Inspections',
  })),
  {
    id: 'seed-ord-101-create',
    action: 'CREATE',
    entity: 'BuyerOrder',
    entityId: 'ord-101',
    entityCode: 'PO-HM-99201',
    moduleName: 'Buyer Order Management',
    performedBy: 'Sultana Razia',
    userRole: 'MERCHANDISER',
    userId: 'usr_merch_01',
    timestamp: '2026-09-01T09:30:00.000Z',
    details: 'Initial Purchase Order created for H&M Global (25,000 pcs Organic Crew T-Shirt at $4.85 FOB)',
    changes: [
      { field: 'orderQuantity', fieldLabel: 'Order Quantity (pcs)', oldValue: null, newValue: 25000 },
      { field: 'fobPrice', fieldLabel: 'FOB Price (USD)', oldValue: null, newValue: 4.85 },
      { field: 'status', fieldLabel: 'Status', oldValue: null, newValue: 'PLANNED' },
      { field: 'shipDate', fieldLabel: 'Ship Date / CRD', oldValue: null, newValue: '2026-10-25' },
    ],
  },
  {
    id: 'seed-ord-101-stage',
    action: 'STAGE_PROGRESS',
    entity: 'BuyerOrder',
    entityId: 'ord-101',
    entityCode: 'PO-HM-99201',
    moduleName: 'Buyer Order Management',
    performedBy: 'Jashim Uddin',
    userRole: 'PRODUCTION_MANAGER',
    userId: 'usr_prod_head',
    timestamp: '2026-09-15T14:15:00.000Z',
    details: 'Sewing floor input confirmed. 22,500 pcs progressed into active sewing assembly.',
    changes: [
      { field: 'status', fieldLabel: 'Status', oldValue: 'CUTTING', newValue: 'SEWING' },
    ],
  },
  {
    id: 'seed-po-206-create',
    action: 'CREATE',
    entity: 'ProductionOrder',
    entityId: 'po-206',
    entityCode: 'PO-GAP-2026-19',
    moduleName: 'Production & Quality',
    performedBy: 'Jashim Uddin',
    userRole: 'PRODUCTION_MANAGER',
    userId: 'usr_prod_head',
    timestamp: '2026-10-06T08:00:00.000Z',
    details: 'Scheduled Finishing Line 01 (Steam Tunnel Pressing) run for Gap Cargo Jogger batch (Target: 18,000 pcs).',
    changes: [
      { field: 'targetQuantity', fieldLabel: 'Target Quantity (pcs)', oldValue: null, newValue: 18000 },
      { field: 'sewingLine', fieldLabel: 'Sewing / Floor Line', oldValue: null, newValue: 'Finishing Line 01 (Steam Tunnel Pressing)' },
      { field: 'lineId', fieldLabel: 'Line ID', oldValue: null, newValue: 'FIN-01' },
    ],
  },
  {
    id: 'seed-po-206-update',
    action: 'OUTPUT_LOGGED',
    entity: 'ProductionOrder',
    entityId: 'po-206',
    entityCode: 'PO-GAP-2026-19',
    moduleName: 'Production & Quality',
    performedBy: 'Zahirul Islam',
    userRole: 'QC_AUDITOR',
    userId: 'usr_inspector_fin',
    timestamp: '2026-10-11T16:00:00.000Z',
    details: 'Logged 8 hourly inspection reports (1,017 checked pcs, 1.57% DHU, 0 rejects) on Steam Pressing Line.',
    changes: [
      { field: 'completedQuantity', fieldLabel: 'Completed Output (pcs)', oldValue: 8183, newValue: 9200 },
      { field: 'dhuRate', fieldLabel: 'DHU Rate (%)', oldValue: 1.62, newValue: 1.25 },
    ],
  },
  {
    id: 'seed-insp-001-create',
    action: 'CREATE',
    entity: 'InspectionRecord',
    entityId: 'insp-001',
    entityCode: 'QMS-2026-0891',
    moduleName: 'Quality Inspections',
    performedBy: 'Rafiqul Islam',
    userRole: 'QA_INSPECTOR',
    userId: 'usr_inspector',
    timestamp: '2026-08-02T10:00:00.000Z',
    details: 'Logged Inward Fabric Pre-Final Inspection for Zara lot LOT-TX-8890A (Sample Size: 315 rolls).',
    changes: [
      { field: 'status', fieldLabel: 'Status', oldValue: null, newValue: 'PASSED' },
      { field: 'sampleSize', fieldLabel: 'AQL Sample Size', oldValue: null, newValue: 315 },
      { field: 'passCount', fieldLabel: 'Pass Count', oldValue: null, newValue: 311 },
    ],
  },
  {
    id: 'seed-capa-001-create',
    action: 'CREATE',
    entity: 'CapaItem',
    entityId: 'capa-001',
    entityCode: 'CAPA-2026-01',
    moduleName: 'CAPA (8D Corrective Action)',
    performedBy: 'Tania Ahmed',
    userRole: 'QA_MANAGER',
    userId: 'usr_admin',
    timestamp: '2026-09-18T11:20:00.000Z',
    details: 'Issued 8D Corrective Action for excessive skip stitches on Denim assembly Line 04.',
    changes: [
      { field: 'status', fieldLabel: 'Status', oldValue: null, newValue: 'IN_PROGRESS' },
      { field: 'priority', fieldLabel: 'Priority Level', oldValue: null, newValue: 'HIGH' },
    ],
  },
];

// Helper: Get stored audit logs from localStorage or initialize with seed
export function getStoredAuditLogs(): AuditLog[] {
  if (typeof window === 'undefined') return SEED_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
      return SEED_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_AUDIT_LOGS;
  } catch {
    return SEED_AUDIT_LOGS;
  }
}

// Helper: Save audit logs and dispatch live event
export function saveStoredAuditLogs(logs: AuditLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent(AUDIT_LOGS_UPDATED_EVENT, { detail: logs }));

    // Cross-tab broadcast
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('garments_erp_sync');
        bc.postMessage({ type: 'AUDIT_LOGS_UPDATED', count: logs.length });
        bc.close();
      } catch {}
    }
  } catch {}
}

// Helper: Get view statistics map
function getStoredViewsMap(): Record<string, RecordViewStats> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORD_VIEWS);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveStoredViewsMap(map: Record<string, RecordViewStats>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.RECORD_VIEWS, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(RECORD_VIEWS_UPDATED_EVENT, { detail: map }));
  } catch {}
}

/**
 * Universal diff generator: Compares two versions of an object and extracts human-readable field diffs
 */
export function diffRecordFields(
  oldRecord: Record<string, any> | null | undefined,
  newRecord: Record<string, any> | null | undefined,
  ignoredKeys: string[] = ['id', 'updatedAt', 'lastModifiedAt', 'viewCount', 'views', 'attachments', 'hourlyReports', 'auditTrail']
): RecordChangeDiff[] {
  if (!oldRecord && !newRecord) return [];
  if (!oldRecord && newRecord) {
    return Object.entries(newRecord)
      .filter(([k, v]) => !ignoredKeys.includes(k) && v !== undefined && v !== null && typeof v !== 'object')
      .map(([k, v]) => ({
        field: k,
        fieldLabel: FIELD_LABEL_MAP[k] || formatFieldLabel(k),
        oldValue: null,
        newValue: v,
      }));
  }
  if (oldRecord && !newRecord) {
    return [
      {
        field: 'status',
        fieldLabel: 'Status',
        oldValue: oldRecord.status || 'ACTIVE',
        newValue: 'DELETED',
      },
    ];
  }

  const diffs: RecordChangeDiff[] = [];
  const allKeys = Array.from(new Set([...Object.keys(oldRecord || {}), ...Object.keys(newRecord || {})]));

  for (const key of allKeys) {
    if (ignoredKeys.includes(key)) continue;

    const oldVal = oldRecord?.[key];
    const newVal = newRecord?.[key];

    // Handle primitives, strings, numbers, booleans
    if (typeof oldVal !== 'object' && typeof newVal !== 'object') {
      if (oldVal !== newVal && (oldVal !== undefined || newVal !== undefined)) {
        diffs.push({
          field: key,
          fieldLabel: FIELD_LABEL_MAP[key] || formatFieldLabel(key),
          oldValue: oldVal ?? null,
          newValue: newVal ?? null,
        });
      }
    } else if (typeof oldVal === 'object' || typeof newVal === 'object') {
      // Shallow JSON comparison for dates or sub-objects
      const sOld = JSON.stringify(oldVal);
      const sNew = JSON.stringify(newVal);
      if (sOld !== sNew) {
        // Special friendly formats for stages or simple arrays
        if (Array.isArray(oldVal) && Array.isArray(newVal)) {
          diffs.push({
            field: key,
            fieldLabel: FIELD_LABEL_MAP[key] || formatFieldLabel(key),
            oldValue: `${oldVal.length} item(s)`,
            newValue: `${newVal.length} item(s)`,
          });
        }
      }
    }
  }

  return diffs;
}

function formatFieldLabel(camelCase: string): string {
  return camelCase
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Record a View on an entity record.
 * Tracks view count, viewer metadata, and records a debounced VIEW audit event.
 */
export function trackEntityView(
  arg1:
    | string
    | {
        entity: string;
        entityId: string;
        entityCode?: string;
        moduleName?: string;
        user?: {
          id?: string;
          name?: string;
          role?: string;
          avatarUrl?: string;
        };
      },
  entityIdArg?: string,
  entityCodeArg?: string,
  userNameArg?: string,
  userRoleArg?: string,
  userIdArg?: string
): RecordViewStats {
  let entity: string;
  let entityId: string;
  let entityCode: string | undefined;
  let moduleName: string | undefined;
  let user: { id?: string; name?: string; role?: string; avatarUrl?: string } | undefined;

  if (typeof arg1 === 'object' && arg1 !== null) {
    entity = arg1.entity;
    entityId = arg1.entityId;
    entityCode = arg1.entityCode;
    moduleName = arg1.moduleName;
    user = arg1.user;
  } else {
    entity = arg1;
    entityId = entityIdArg || '';
    entityCode = entityCodeArg;
    user = {
      name: userNameArg,
      role: userRoleArg,
      id: userIdArg,
    };
  }

  if (!entity || !entityId) {
    return { viewCount: 1 };
  }

  const key = `${entity}:${entityId}`;
  const viewsMap = getStoredViewsMap();
  const existing = viewsMap[key] || {
    viewCount: 0,
    history: [],
  };

  const nowISO = new Date().toISOString();
  const userName = user?.name || 'Authorized User';
  const userRole = user?.role || 'VIEWER';
  const userId = user?.id || 'usr_current';

  const newViewEntry: RecordViewEntry = {
    userId,
    userName,
    userRole,
    viewedAt: nowISO,
    device: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop') : 'Web',
  };

  const updatedHistory = [newViewEntry, ...(existing.history || [])].slice(0, 20);
  const updatedStats: RecordViewStats = {
    viewCount: (existing.viewCount || 0) + 1,
    lastViewedAt: nowISO,
    lastViewedBy: userName,
    lastViewedRole: userRole,
    history: updatedHistory,
  };

  viewsMap[key] = updatedStats;
  saveStoredViewsMap(viewsMap);

  // Debounced Audit Log: Check if this user recently logged a VIEW for this record in past 60s
  const currentLogs = getStoredAuditLogs();
  const recentSameView = currentLogs.find(
    (l) =>
      l.entity === entity &&
      l.entityId === entityId &&
      l.action === 'VIEW' &&
      l.performedBy === userName &&
      Date.now() - new Date(l.timestamp).getTime() < 60000
  );

  if (!recentSameView) {
    const viewLog: AuditLog = {
      id: `view-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'VIEW',
      entity,
      entityId,
      entityCode: entityCode || entityId,
      moduleName: moduleName || entity,
      performedBy: userName,
      userRole,
      userId,
      userAvatar: user?.avatarUrl,
      timestamp: nowISO,
      details: `Viewed record ${entityCode || entityId} in ${moduleName || entity} module.`,
      metadata: {
        totalViews: updatedStats.viewCount,
      },
    };

    saveStoredAuditLogs([viewLog, ...currentLogs].slice(0, 500));

    // Async push to server backend API
    if (typeof window !== 'undefined') {
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: viewLog }),
      }).catch(() => {});
    }
  }

  return updatedStats;
}

/**
 * Record a Create Event on an entity record.
 */
export function trackEntityCreate(
  arg1:
    | string
    | {
        entity: string;
        entityId: string;
        entityCode?: string;
        moduleName?: string;
        recordData?: Record<string, any>;
        details?: string;
        user?: {
          id?: string;
          name?: string;
          role?: string;
          avatarUrl?: string;
        };
      },
  entityIdArg?: string,
  entityCodeArg?: string,
  recordDataArg?: Record<string, any>,
  optionsArg?: {
    userName?: string;
    userRole?: string;
    userId?: string;
    userAvatar?: string;
    summary?: string;
    moduleName?: string;
  }
): AuditLog {
  let entity: string;
  let entityId: string;
  let entityCode: string | undefined;
  let moduleName: string | undefined;
  let recordData: Record<string, any> | undefined;
  let details: string | undefined;
  let user: { id?: string; name?: string; role?: string; avatarUrl?: string } | undefined;

  if (typeof arg1 === 'object' && arg1 !== null) {
    entity = arg1.entity;
    entityId = arg1.entityId;
    entityCode = arg1.entityCode;
    moduleName = arg1.moduleName;
    recordData = arg1.recordData;
    details = arg1.details;
    user = arg1.user;
  } else {
    entity = arg1;
    entityId = entityIdArg || '';
    entityCode = entityCodeArg;
    recordData = recordDataArg;
    details = optionsArg?.summary;
    moduleName = optionsArg?.moduleName;
    user = {
      name: optionsArg?.userName,
      role: optionsArg?.userRole,
      id: optionsArg?.userId,
      avatarUrl: optionsArg?.userAvatar,
    };
  }

  const nowISO = new Date().toISOString();
  const userName = user?.name || 'Administrator';
  const userRole = user?.role || 'ADMIN';
  const userId = user?.id || 'usr_current';

  const changes = recordData ? diffRecordFields(null, recordData) : [];

  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: 'CREATE',
    entity,
    entityId,
    entityCode: entityCode || entityId,
    moduleName: moduleName || entity,
    performedBy: userName,
    userRole,
    userId,
    userAvatar: user?.avatarUrl,
    timestamp: nowISO,
    details: details || `Created new ${moduleName || entity} record (${entityCode || entityId}).`,
    changes: changes.slice(0, 15),
  };

  const currentLogs = getStoredAuditLogs();
  saveStoredAuditLogs([newLog, ...currentLogs].slice(0, 500));

  // Async server persist
  if (typeof window !== 'undefined') {
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: newLog }),
    }).catch(() => {});
  }

  return newLog;
}

/**
 * Record an Update Event on an entity record with automatic diff computation.
 */
export function trackEntityUpdate(
  arg1:
    | string
    | {
        entity: string;
        entityId: string;
        entityCode?: string;
        moduleName?: string;
        oldRecord?: Record<string, any>;
        newRecord?: Record<string, any>;
        explicitChanges?: RecordChangeDiff[];
        action?: string;
        details?: string;
        user?: {
          id?: string;
          name?: string;
          role?: string;
          avatarUrl?: string;
        };
      },
  entityIdArg?: string,
  entityCodeArg?: string,
  oldRecordArg?: Record<string, any>,
  newRecordArg?: Record<string, any>,
  optionsArg?: {
    userName?: string;
    userRole?: string;
    userId?: string;
    userAvatar?: string;
    summary?: string;
    moduleName?: string;
    action?: string;
  }
): AuditLog {
  let entity: string;
  let entityId: string;
  let entityCode: string | undefined;
  let moduleName: string | undefined;
  let oldRecord: Record<string, any> | undefined;
  let newRecord: Record<string, any> | undefined;
  let explicitChanges: RecordChangeDiff[] | undefined;
  let action: string | undefined;
  let details: string | undefined;
  let user: { id?: string; name?: string; role?: string; avatarUrl?: string } | undefined;

  if (typeof arg1 === 'object' && arg1 !== null) {
    entity = arg1.entity;
    entityId = arg1.entityId;
    entityCode = arg1.entityCode;
    moduleName = arg1.moduleName;
    oldRecord = arg1.oldRecord;
    newRecord = arg1.newRecord;
    explicitChanges = arg1.explicitChanges;
    action = arg1.action;
    details = arg1.details;
    user = arg1.user;
  } else {
    entity = arg1;
    entityId = entityIdArg || '';
    entityCode = entityCodeArg;
    oldRecord = oldRecordArg;
    newRecord = newRecordArg;
    action = optionsArg?.action;
    details = optionsArg?.summary;
    moduleName = optionsArg?.moduleName;
    user = {
      name: optionsArg?.userName,
      role: optionsArg?.userRole,
      id: optionsArg?.userId,
      avatarUrl: optionsArg?.userAvatar,
    };
  }

  const nowISO = new Date().toISOString();
  const userName = user?.name || 'Administrator';
  const userRole = user?.role || 'ADMIN';
  const userId = user?.id || 'usr_current';

  const changes = explicitChanges || diffRecordFields(oldRecord, newRecord);

  // Check if status specifically changed
  let resolvedAction = action || 'UPDATE';
  if (!action && changes.some((c) => c.field === 'status')) {
    resolvedAction = 'STATUS_CHANGE';
  } else if (!action && changes.some((c) => c.field === 'qualityGrade')) {
    resolvedAction = 'GRADE_CHANGE';
  }

  // Generate friendly details text summarizing the changes
  let summaryDetails = details;
  if (!summaryDetails) {
    if (changes.length > 0) {
      const topDiffs = changes
        .slice(0, 3)
        .map((c) => `${c.fieldLabel}: ${c.oldValue ?? 'None'} → ${c.newValue}`)
        .join(', ');
      summaryDetails = `Updated ${entityCode || entityId}: ${topDiffs}${changes.length > 3 ? ` (+${changes.length - 3} more)` : ''}`;
    } else {
      summaryDetails = `Updated ${moduleName || entity} record (${entityCode || entityId}).`;
    }
  }

  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: resolvedAction,
    entity,
    entityId,
    entityCode: entityCode || entityId,
    moduleName: moduleName || entity,
    performedBy: userName,
    userRole,
    userId,
    userAvatar: user?.avatarUrl,
    timestamp: nowISO,
    details: summaryDetails,
    changes,
  };

  const currentLogs = getStoredAuditLogs();
  saveStoredAuditLogs([newLog, ...currentLogs].slice(0, 500));

  // Async server persist
  if (typeof window !== 'undefined') {
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: newLog }),
    }).catch(() => {});
  }

  return newLog;
}

/**
 * Record a Delete Event on an entity record.
 */
export function trackEntityDelete(
  arg1:
    | string
    | {
        entity: string;
        entityId: string;
        entityCode?: string;
        moduleName?: string;
        deletedRecord?: Record<string, any>;
        details?: string;
        user?: {
          id?: string;
          name?: string;
          role?: string;
          avatarUrl?: string;
        };
      },
  entityIdArg?: string,
  entityCodeArg?: string,
  deletedRecordArg?: Record<string, any>,
  optionsArg?: {
    userName?: string;
    userRole?: string;
    userId?: string;
    userAvatar?: string;
    summary?: string;
    moduleName?: string;
  }
): AuditLog {
  let entity: string;
  let entityId: string;
  let entityCode: string | undefined;
  let moduleName: string | undefined;
  let deletedRecord: Record<string, any> | undefined;
  let details: string | undefined;
  let user: { id?: string; name?: string; role?: string; avatarUrl?: string } | undefined;

  if (typeof arg1 === 'object' && arg1 !== null) {
    entity = arg1.entity;
    entityId = arg1.entityId;
    entityCode = arg1.entityCode;
    moduleName = arg1.moduleName;
    deletedRecord = arg1.deletedRecord;
    details = arg1.details;
    user = arg1.user;
  } else {
    entity = arg1;
    entityId = entityIdArg || '';
    entityCode = entityCodeArg;
    deletedRecord = deletedRecordArg;
    details = optionsArg?.summary;
    moduleName = optionsArg?.moduleName;
    user = {
      name: optionsArg?.userName,
      role: optionsArg?.userRole,
      id: optionsArg?.userId,
      avatarUrl: optionsArg?.userAvatar,
    };
  }

  const nowISO = new Date().toISOString();
  const userName = user?.name || 'Administrator';
  const userRole = user?.role || 'ADMIN';
  const userId = user?.id || 'usr_current';

  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: 'DELETE',
    entity,
    entityId,
    entityCode: entityCode || entityId,
    moduleName: moduleName || entity,
    performedBy: userName,
    userRole,
    userId,
    userAvatar: user?.avatarUrl,
    timestamp: nowISO,
    details: details || `Deleted ${moduleName || entity} record (${entityCode || entityId}).`,
    changes: [
      {
        field: 'status',
        fieldLabel: 'Status',
        oldValue: deletedRecord?.status || 'ACTIVE',
        newValue: 'DELETED',
      },
    ],
  };

  const currentLogs = getStoredAuditLogs();
  saveStoredAuditLogs([newLog, ...currentLogs].slice(0, 500));

  if (typeof window !== 'undefined') {
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: newLog }),
    }).catch(() => {});
  }

  return newLog;
}

/**
 * Fetch all audit logs for a specific entity ID.
 */
export function getAuditHistoryForEntity(entity: string, entityId: string): AuditLog[] {
  const all = getStoredAuditLogs();
  return all.filter((l) => {
    const matchesEntity = !entity || l.entity.toLowerCase() === entity.toLowerCase();
    const matchesId = l.entityId === entityId || (l.entityCode && l.entityCode === entityId);
    return matchesEntity && matchesId;
  });
}

/**
 * Get View Stats for a specific entity ID.
 */
export function getViewStatsForEntity(entity: string, entityId: string): RecordViewStats {
  const key = `${entity}:${entityId}`;
  const viewsMap = getStoredViewsMap();
  const found = viewsMap[key];
  if (found) return found;

  // Fallback defaults if record exists but not tracked yet
  return {
    viewCount: 1,
    lastViewedAt: new Date().toISOString(),
    lastViewedBy: 'System User',
    history: [],
  };
}

/**
 * Export Audit Logs to CSV string
 */
export function exportAuditLogsToCsv(logs: AuditLog[]): string {
  const headers = [
    'Log ID',
    'Timestamp',
    'Action',
    'Module',
    'Target Entity',
    'Record Code / ID',
    'Performed By',
    'User Role',
    'Audit Details',
    'Field Changes Diff',
  ];

  const rows = logs.map((l) => {
    const diffSummary = (l.changes || [])
      .map((c) => `${c.fieldLabel || c.field}: ${c.oldValue ?? 'None'} -> ${c.newValue}`)
      .join(' | ');

    return [
      l.id,
      l.timestamp,
      `"${l.action}"`,
      `"${l.moduleName || l.entity}"`,
      l.entity,
      l.entityCode || l.entityId,
      `"${l.performedBy}"`,
      `"${l.userRole}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${diffSummary.replace(/"/g, '""')}"`,
    ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
