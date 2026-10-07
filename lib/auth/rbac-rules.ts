export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystemRole?: boolean;
  permissions: Record<string, ModulePermission>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModuleCategoryGroup {
  category: string;
  modules: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
}

export const ERP_MODULE_CATALOG: ModuleCategoryGroup[] = [
  {
    category: 'Core Operations',
    modules: [
      { id: 'dashboard', name: 'Dashboard' },
    ],
  },
  {
    category: 'Supply & Orders',
    modules: [
      { id: 'buyer_order', name: 'Orders & Buyers' },
      { id: 'sub_supplier', name: 'Sub Suppliers' },
      { id: 'inventory', name: 'Stock & Inventory' },
      { id: 'customer_complaint', name: 'Customer Complain' },
    ],
  },
  {
    category: 'Quality & Inspection',
    modules: [
      { id: 'incoming_qc', name: 'Incoming QC' },
      { id: 'production', name: 'Production Quality' },
      { id: 'inspections', name: 'Inspections' },
      { id: 'defects_library', name: 'Defects Library' },
      { id: 'testing', name: 'Lab Testing' },
      { id: 'calibration', name: 'Calibration' },
      { id: 'audit', name: 'Quality Audits' },
      { id: 'capa', name: 'CAPA' },
      { id: 'root_cause', name: 'Root Cause Analysis' },
    ],
  },
  {
    category: 'Compliance & Standards',
    modules: [
      { id: 'risk_assessment', name: 'Risk Assessment' },
      { id: 'traceability', name: 'Traceability Audit' },
      { id: 'certificate', name: 'Factory Certificates' },
      { id: 'document_control', name: 'Controlled Documents' },
      { id: 'sop_management', name: 'SOP Management' },
      { id: 'quality_manual', name: 'Quality Manual' },
      { id: 'procedure', name: 'Procedures Manual' },
      { id: 'process_flow', name: 'Process Flows' },
    ],
  },
  {
    category: 'Organization & Factory',
    modules: [
      { id: 'organogram', name: 'Organogram' },
      { id: 'job_description', name: 'Job Descriptions' },
      { id: 'training', name: 'Training & Exams' },
      { id: 'meeting_minutes', name: 'Meeting Minutes' },
      { id: 'events', name: 'Factory Events' },
      { id: 'communication', name: 'Communication Portal' },
      { id: 'texpedia', name: 'Texpedia' },
    ],
  },
  {
    category: 'Executive & Analytics',
    modules: [
      { id: 'kpi_management', name: 'KPI Management' },
      { id: 'quality_goals', name: 'Quality Goals' },
      { id: 'report_analysis', name: 'Reports & Analysis' },
      { id: 'planning_ie', name: 'Planning & IE' },
    ],
  },
  {
    category: 'System Administration',
    modules: [
      { id: 'settings', name: 'Settings & Backup' },
    ],
  },
];

export const ALL_MODULE_IDS = ERP_MODULE_CATALOG.flatMap((g) => g.modules.map((m) => m.id));

export function createFullPermissions(): Record<string, ModulePermission> {
  const perms: Record<string, ModulePermission> = {};
  ALL_MODULE_IDS.forEach((id) => {
    perms[id] = {
      view: true,
      create: true,
      edit: true,
      delete: true,
      export: true,
    };
  });
  return perms;
}

export function createEmptyPermissions(): Record<string, ModulePermission> {
  const perms: Record<string, ModulePermission> = {};
  ALL_MODULE_IDS.forEach((id) => {
    perms[id] = {
      view: false,
      create: false,
      edit: false,
      delete: false,
      export: false,
    };
  });
  return perms;
}

export const DEFAULT_SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Unrestricted access. Can do anything without restrictions.',
    isSystemRole: true,
    permissions: createFullPermissions(),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'qc_manager',
    name: 'QC Manager',
    description: 'Can manage all QC data, reports, and settings.',
    isSystemRole: false,
    permissions: (() => {
      const p = createEmptyPermissions();
      ALL_MODULE_IDS.forEach((id) => {
        // Can view and export almost all operational modules
        p[id] = {
          view: true,
          create: true,
          edit: true,
          delete: id !== 'settings',
          export: true,
        };
      });
      // Restrict critical system administration
      p['settings'] = { view: true, create: false, edit: false, delete: false, export: false };
      return p;
    })(),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'inspector',
    name: 'Inspector',
    description: 'Can view and create QC records.',
    isSystemRole: false,
    permissions: (() => {
      const p = createEmptyPermissions();
      // Inspection and quality modules
      const allowed = [
        'dashboard',
        'incoming_qc',
        'production',
        'inspections',
        'defects_library',
        'testing',
        'calibration',
        'buyer_order',
        'inventory',
      ];
      allowed.forEach((id) => {
        p[id] = {
          view: true,
          create: id !== 'dashboard',
          edit: false,
          delete: false,
          export: true,
        };
      });
      return p;
    })(),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to dashboards and reports.',
    isSystemRole: false,
    permissions: (() => {
      const p = createEmptyPermissions();
      // Read only on dashboard and reports
      ALL_MODULE_IDS.forEach((id) => {
        p[id] = {
          view: id !== 'settings',
          create: false,
          edit: false,
          delete: false,
          export: id === 'dashboard' || id === 'report_analysis',
        };
      });
      return p;
    })(),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];
