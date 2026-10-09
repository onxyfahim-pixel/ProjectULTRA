import { Role } from '../types/erp';

export type AlertSeverity = 'urgent' | 'warning' | 'info' | 'success';

export interface ModuleAlertDefinition {
  id: string;
  name: string;
  module: string;
  category: 'BUYER_ORDERS' | 'PRODUCTION_IE' | 'QUALITY_QC' | 'COMPLIANCE_AUDIT' | 'INVENTORY_WH' | 'GENERAL_HR';
  description: string;
  defaultSeverity: AlertSeverity;
  defaultRoles: string[]; // Role names allowed by default
}

export interface ErpNotificationItem {
  id: string;
  alertTypeId: string;
  title: string;
  message: string;
  module: string;
  severity: AlertSeverity;
  timestamp: string;
  read: boolean;
  targetRoles?: string[]; // Specific roles; if empty/undefined, all roles with view permission for module receive it
  targetUserId?: string; // Optional specific user
  linkId?: string;
  metadata?: Record<string, any>;
}

export interface RoleNotificationRule {
  alertTypeId: string;
  enabled: boolean;
  allowedRoles: string[];
}

export interface NotificationConfig {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  webhookEnabled: boolean;
  soundAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  emailRecipients: string;
  smtpHost: string;
  webhookUrl: string;
  webhookChannel: string;
  // Threshold values
  dhuThresholdPercent: number; // default: 3.0%
  nearbyCrdDays: number; // default: 10 days
  targetDeficitPercent: number; // default: 15%
  lineReportDelayMinutes: number; // default: 60 mins
  // Alert rules by alertTypeId
  alertRules: Record<string, RoleNotificationRule>;
}

// Comprehensive catalog of all alert types from all ERP modules
export const MODULE_ALERT_CATALOG: ModuleAlertDefinition[] = [
  // 1. BUYER & ORDERS MODULE
  {
    id: 'new_order_added',
    name: 'New Buyer Order Added',
    module: 'buyer_order',
    category: 'BUYER_ORDERS',
    description: 'Triggered instantly when a new buyer purchase order (PO) or style is registered in the system.',
    defaultSeverity: 'info',
    defaultRoles: ['Super Admin', 'QC Manager', 'Viewer'],
  },
  {
    id: 'nearby_crd_order',
    name: 'Nearby CRD Delivery Date Alert',
    module: 'buyer_order',
    category: 'BUYER_ORDERS',
    description: 'Triggered when an active buyer order delivery date (CRD) is approaching within the configured threshold days.',
    defaultSeverity: 'warning',
    defaultRoles: ['Super Admin', 'QC Manager', 'Viewer'],
  },
  {
    id: 'shipment_delay_risk',
    name: 'Shipment Milestone Delay Risk',
    module: 'buyer_order',
    category: 'BUYER_ORDERS',
    description: 'Triggered when production pace indicates critical risk of missing the planned ex-factory shipment milestone.',
    defaultSeverity: 'urgent',
    defaultRoles: ['Super Admin', 'QC Manager'],
  },
  {
    id: 'sample_approval_pending',
    name: 'Sample Fit Approval Pending',
    module: 'buyer_order',
    category: 'BUYER_ORDERS',
    description: 'Notification when Fit sample, Size Set, or PP sample review is awaiting buyer comments or sign-off.',
    defaultSeverity: 'info',
    defaultRoles: ['Super Admin', 'QC Manager'],
  },

  // 2. PRODUCTION & PLANNING IE MODULE
  {
    id: 'target_alert',
    name: 'Production Hourly Target Shortfall',
    module: 'production',
    category: 'PRODUCTION_IE',
    description: 'Triggered when hourly line output is lower than target threshold (e.g. > 15% below target SMV rate).',
    defaultSeverity: 'warning',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },
  {
    id: 'line_report_not_submitted',
    name: 'Line Report Not Submitted Alert',
    module: 'production',
    category: 'PRODUCTION_IE',
    description: 'Triggered when a sewing/finishing line hourly quality or production report is missing past schedule.',
    defaultSeverity: 'urgent',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },
  {
    id: 'dhu_alert',
    name: 'DHU Quality Spike Alert',
    module: 'production',
    category: 'PRODUCTION_IE',
    description: 'Triggered immediately when line DHU (Defects per Hundred Units) exceeds the upper control limit (> 3.0%).',
    defaultSeverity: 'urgent',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },
  {
    id: 'low_line_efficiency',
    name: 'Low Line Efficiency Alert (< 60%)',
    module: 'planning_ie',
    category: 'PRODUCTION_IE',
    description: 'Alert when line balancing efficiency drops below the critical 60% threshold during active shift.',
    defaultSeverity: 'warning',
    defaultRoles: ['Super Admin', 'QC Manager'],
  },
  {
    id: 'machine_breakdown_alert',
    name: 'Critical Sewing Machine Breakdown',
    module: 'production',
    category: 'PRODUCTION_IE',
    description: 'Notifies floor supervisors and maintenance when a key workstation machine experiences downtime.',
    defaultSeverity: 'urgent',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },

  // 3. QUALITY ASSURANCE & INSPECTIONS MODULE
  {
    id: 'aql_critical_failure',
    name: 'AQL Final Inspection Rejection',
    module: 'inspections',
    category: 'QUALITY_QC',
    description: 'Alert dispatched immediately when an export shipment FRI audit fails AQL 1.5/2.5 acceptance criteria.',
    defaultSeverity: 'urgent',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },
  {
    id: 'incoming_quarantine_alert',
    name: 'Raw Material Fabric Quarantine (ASTM D5430 > 28 pts)',
    module: 'incoming_qc',
    category: 'QUALITY_QC',
    description: 'Triggered when incoming raw fabric roll exceeds 4-point penalty score and is placed in quarantine.',
    defaultSeverity: 'warning',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },
  {
    id: 'critical_defect_spike',
    name: 'Critical Defect Cluster Outbreak',
    module: 'defects_library',
    category: 'QUALITY_QC',
    description: 'Alert when recurring critical defects (e.g. broken needle, oil stain, skipped stitch) cluster on a line.',
    defaultSeverity: 'urgent',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },
  {
    id: 'lab_test_failure',
    name: 'Lab Fastness & Shrinkage Test Failure',
    module: 'testing',
    category: 'QUALITY_QC',
    description: 'Alert when fabric wash fastness, rub fastness, or dimensional stability test fails buyer spec.',
    defaultSeverity: 'warning',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },
  {
    id: 'calibration_overdue',
    name: 'Equipment Calibration Due / Overdue',
    module: 'calibration',
    category: 'QUALITY_QC',
    description: 'Dispatches notice when QA testing instruments (GSM balance, Tensile tester) reach ISO 17025 verification date.',
    defaultSeverity: 'warning',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },

  // 4. CAPA, ROOT CAUSE & COMPLIANCE AUDITS
  {
    id: 'capa_overdue',
    name: 'CAPA 8D Resolution Overdue',
    module: 'capa',
    category: 'COMPLIANCE_AUDIT',
    description: 'Daily reminder when 8D corrective & preventive action plan exceeds the agreed implementation deadline.',
    defaultSeverity: 'urgent',
    defaultRoles: ['Super Admin', 'QC Manager'],
  },
  {
    id: 'customer_claim_alert',
    name: 'Buyer Customer Complaint / Claim Logged',
    module: 'customer_complaint',
    category: 'COMPLIANCE_AUDIT',
    description: 'Alert dispatched when a buyer logs an official defect claim, debit note, or store return complaint.',
    defaultSeverity: 'urgent',
    defaultRoles: ['Super Admin', 'QC Manager', 'Viewer'],
  },
  {
    id: 'upcoming_audit_alert',
    name: 'ISO 9001 / WRAP / BSCI Factory Audit Due',
    module: 'audit',
    category: 'COMPLIANCE_AUDIT',
    description: 'Broadcast reminders 14 days and 3 days prior to external third-party or buyer technical compliance audits.',
    defaultSeverity: 'info',
    defaultRoles: ['Super Admin', 'QC Manager', 'Viewer'],
  },
  {
    id: 'high_risk_fmea_alert',
    name: 'High FMEA Risk Index Detected (RPN > 150)',
    module: 'risk_assessment',
    category: 'COMPLIANCE_AUDIT',
    description: 'Alert when manufacturing risk assessment scores severe occurrence or failure severity in style analysis.',
    defaultSeverity: 'warning',
    defaultRoles: ['Super Admin', 'QC Manager'],
  },

  // 5. INVENTORY, SUB-SUPPLIERS & DOCUMENTATION
  {
    id: 'low_stock_warning',
    name: 'Raw Material Low Stock Warning',
    module: 'inventory',
    category: 'INVENTORY_WH',
    description: 'Triggered when allocated fabric rolls, sewing thread spools, or trims drop below safety buffer stock.',
    defaultSeverity: 'warning',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector', 'Viewer'],
  },
  {
    id: 'sub_supplier_rating_alert',
    name: 'Tier-2 Sub-Supplier Quality Downgrade',
    module: 'sub_supplier',
    category: 'INVENTORY_WH',
    description: 'Alert when a washing plant, printing mill, or dye house delivery rating falls below acceptable tier grade.',
    defaultSeverity: 'info',
    defaultRoles: ['Super Admin', 'QC Manager'],
  },
  {
    id: 'sop_review_due',
    name: 'SOP & Quality Manual Periodic Review Due',
    module: 'sop_management',
    category: 'GENERAL_HR',
    description: 'Reminder when factory Standard Operating Procedures reach annual compliance review deadline.',
    defaultSeverity: 'info',
    defaultRoles: ['Super Admin', 'QC Manager'],
  },
  {
    id: 'training_matrix_due',
    name: 'Operator Skill Training Recertification Due',
    module: 'training',
    category: 'GENERAL_HR',
    description: 'Alert when sewing operators or end-line QC auditors are due for periodic eye test or skill recertification.',
    defaultSeverity: 'info',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector'],
  },
  {
    id: 'floor_notice_broadcast',
    name: 'Factory Floor Emergency Notice Broadcast',
    module: 'communication',
    category: 'GENERAL_HR',
    description: 'Broadcasted to all personnel when plant management releases an urgent quality or operational bulletin.',
    defaultSeverity: 'info',
    defaultRoles: ['Super Admin', 'QC Manager', 'Inspector', 'Viewer'],
  },
];

// Seed initial notifications demonstrating all key module alerts
export const INITIAL_ERP_NOTIFICATIONS: ErpNotificationItem[] = [
  {
    id: 'notif-1',
    alertTypeId: 'dhu_alert',
    title: 'DHU Quality Spike Alert — Line 04',
    message: 'Sewing Line 04 exceeded 3.5% DHU threshold (Current: 4.8%). Broken stitch and seam puckering recurring on Style #NK-204.',
    module: 'production',
    severity: 'urgent',
    timestamp: '10m ago',
    read: false,
    linkId: 'line-04',
  },
  {
    id: 'notif-2',
    alertTypeId: 'nearby_crd_order',
    title: 'Nearby CRD Delivery Date Alert — Style #HM-8840',
    message: 'Buyer H&M Order PO-9842 (25,000 pcs) CRD is approaching in 5 days (Oct 12, 2026). Sewing completion currently at 82%.',
    module: 'buyer_order',
    severity: 'warning',
    timestamp: '25m ago',
    read: false,
    linkId: 'po-9842',
  },
  {
    id: 'notif-3',
    alertTypeId: 'target_alert',
    title: 'Hourly Target Shortfall Alert — Line 02',
    message: 'Line 02 produced 82 pcs vs 110 pcs hourly target (25.4% deficit). Bottle-neck identified at collar attach operation.',
    module: 'production',
    severity: 'warning',
    timestamp: '40m ago',
    read: false,
    linkId: 'line-02',
  },
  {
    id: 'notif-4',
    alertTypeId: 'line_report_not_submitted',
    title: 'Line Report Not Submitted — Line 07',
    message: 'Hourly QC Traffic Light report for 15:00 - 16:00 not submitted by Line 07 Floor Supervisor. Overdue by 45 minutes.',
    module: 'production',
    severity: 'urgent',
    timestamp: '50m ago',
    read: false,
    linkId: 'line-07',
  },
  {
    id: 'notif-5',
    alertTypeId: 'new_order_added',
    title: 'New Buyer Order Added — PO-99420 (Zara Knits)',
    message: 'Zara International added new purchase order PO-99420 for 18,500 pcs Cotton Pique Polo. CRD: Nov 15, 2026.',
    module: 'buyer_order',
    severity: 'info',
    timestamp: '1h ago',
    read: false,
    linkId: 'po-99420',
  },
  {
    id: 'notif-6',
    alertTypeId: 'aql_critical_failure',
    title: 'AQL FRI Final Audit Rejection — Style #NK-408',
    message: 'Final Random Inspection failed AQL 2.5 criteria for Nike Men Fleece Hoodie (5 critical needle marks found in carton 18).',
    module: 'inspections',
    severity: 'urgent',
    timestamp: '2h ago',
    read: false,
    linkId: 'insp-408',
  },
  {
    id: 'notif-7',
    alertTypeId: 'incoming_quarantine_alert',
    title: 'Material Inward Quarantine Alert — Lot #88241',
    message: 'Fabric Lot #88241 Single Jersey 100% Cotton scored 32 pts/100 sq.yd (ASTM D5430). Placed in quarantine warehouse.',
    module: 'incoming_qc',
    severity: 'warning',
    timestamp: '3h ago',
    read: true,
    linkId: 'lot-88241',
  },
  {
    id: 'notif-8',
    alertTypeId: 'capa_overdue',
    title: 'CAPA 8D Resolution Overdue — CAPA-2024-019',
    message: 'Corrective Action Plan for Color Shading on Levi\'s Denim 511 is 3 days past target verification date.',
    module: 'capa',
    severity: 'urgent',
    timestamp: '5h ago',
    read: true,
    linkId: 'capa-2024-019',
  },
  {
    id: 'notif-9',
    alertTypeId: 'calibration_overdue',
    title: 'Calibration Overdue Alert — Lab Balance #LAB-04',
    message: 'Digital Precision Balance #LAB-04 in Fabric Physical Lab is due for ISO 17025 annual re-calibration verification.',
    module: 'calibration',
    severity: 'warning',
    timestamp: 'Yesterday',
    read: true,
    linkId: 'cal-lab-04',
  },
  {
    id: 'notif-10',
    alertTypeId: 'customer_claim_alert',
    title: 'Customer Complaint Logged — Marks & Spencer',
    message: 'Buyer M&S issued formal quality claim #CLM-2024-08 regarding shade band variation in shipment batch #441.',
    module: 'customer_complaint',
    severity: 'urgent',
    timestamp: 'Yesterday',
    read: true,
    linkId: 'clm-2024-08',
  },
  {
    id: 'notif-11',
    alertTypeId: 'low_stock_warning',
    title: 'Low Material Stock Alert — YKK Zippers #Z-441',
    message: 'Warehouse stock of YKK Metal Teeth Zipper #Z-441 dropped below reorder buffer (120 pcs remaining, 1,500 pcs required).',
    module: 'inventory',
    severity: 'warning',
    timestamp: '2d ago',
    read: true,
    linkId: 'inv-z441',
  },
];

// Helper to construct initial default notification rules
export function buildDefaultNotificationConfig(): NotificationConfig {
  const alertRules: Record<string, RoleNotificationRule> = {};

  MODULE_ALERT_CATALOG.forEach((def) => {
    alertRules[def.id] = {
      alertTypeId: def.id,
      enabled: true,
      allowedRoles: [...def.defaultRoles],
    };
  });

  return {
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    webhookEnabled: true,
    soundAlerts: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    emailRecipients: 'qa.director@valiantgarments.com, factory.gm@valiantgarments.com',
    smtpHost: 'smtp.mailgun.org',
    webhookUrl: 'https://hooks.slack.com/services/T00/B00/XXXXX',
    webhookChannel: '#quality-alerts-factory',
    dhuThresholdPercent: 3.0,
    nearbyCrdDays: 10,
    targetDeficitPercent: 15,
    lineReportDelayMinutes: 60,
    alertRules,
  };
}

const STORAGE_KEY_NOTIFS = 'garments_erp_notifications_items_v2';
const STORAGE_KEY_CONFIG = 'garments_erp_notifications_config_v2';

// Browser-safe Central Notification Manager
export class NotificationService {
  public static getNotifications(): ErpNotificationItem[] {
    if (typeof window === 'undefined') return INITIAL_ERP_NOTIFICATIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Seed initial
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(INITIAL_ERP_NOTIFICATIONS));
    return [...INITIAL_ERP_NOTIFICATIONS];
  }

  public static saveNotifications(items: ErpNotificationItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('erp_notifications_updated', { detail: items }));
    } catch {}
  }

  public static getConfig(): NotificationConfig {
    const defaults = buildDefaultNotificationConfig();
    if (typeof window === 'undefined') return defaults;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaults,
          ...parsed,
          alertRules: { ...defaults.alertRules, ...(parsed.alertRules || {}) },
        };
      }
    } catch {}
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(defaults));
    return defaults;
  }

  public static saveConfig(cfg: NotificationConfig): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
      window.dispatchEvent(new CustomEvent('erp_notification_config_updated', { detail: cfg }));
    } catch {}
  }

  // Filter notifications strictly based on the user's role and module permissions
  public static filterForUser(
    notifications: ErpNotificationItem[],
    user: { id?: string; role?: string; isSuperAdmin?: boolean } | null,
    can: (moduleKey: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export') => boolean,
    config: NotificationConfig = this.getConfig()
  ): ErpNotificationItem[] {
    if (!user) return [];

    const isSuper = Boolean(
      user.isSuperAdmin ||
      user.role === 'ADMIN' ||
      user.role === 'Super Admin' ||
      (user.role as string) === 'super_admin'
    );

    return notifications.filter((notif) => {
      // 1. Alert Rule check: is this alert type enabled in config?
      const rule = config.alertRules[notif.alertTypeId];
      if (rule && rule.enabled === false) {
        return false;
      }

      // 2. Direct user targeting
      if (notif.targetUserId && user.id && notif.targetUserId !== user.id) {
        return false;
      }

      // Super Admin receives all enabled alerts
      if (isSuper) return true;

      // 3. Module permission gate: user MUST have view permission for the alert's module!
      if (notif.module && !can(notif.module, 'view')) {
        return false;
      }

      // 4. Role configuration check: is user's role allowed to receive this alert?
      if (rule && rule.allowedRoles && rule.allowedRoles.length > 0) {
        const userRole = (user.role || '').trim();
        const userRoleClean = userRole.toLowerCase().replace(/[\s_-]+/g, '');
        const roleAllowed = rule.allowedRoles.some(
          (r) =>
            r.toLowerCase() === userRole.toLowerCase() ||
            r.toLowerCase().replace(/[\s_-]+/g, '') === userRoleClean ||
            r === 'All'
        );
        if (!roleAllowed) {
          return false;
        }
      }

      return true;
    });
  }

  // Dispatch a new alert
  public static triggerAlert(payload: {
    alertTypeId: string;
    title: string;
    message: string;
    module?: string;
    severity?: AlertSeverity;
    targetRoles?: string[];
    targetUserId?: string;
    linkId?: string;
    metadata?: Record<string, any>;
  }): ErpNotificationItem {
    const catalogItem = MODULE_ALERT_CATALOG.find((m) => m.id === payload.alertTypeId);
    const mod = payload.module || catalogItem?.module || 'dashboard';
    const sev = payload.severity || catalogItem?.defaultSeverity || 'info';

    const newAlert: ErpNotificationItem = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      alertTypeId: payload.alertTypeId,
      title: payload.title,
      message: payload.message,
      module: mod,
      severity: sev,
      timestamp: 'Just now',
      read: false,
      targetRoles: payload.targetRoles || catalogItem?.defaultRoles,
      targetUserId: payload.targetUserId,
      linkId: payload.linkId,
      metadata: payload.metadata,
    };

    const current = this.getNotifications();
    const updated = [newAlert, ...current.slice(0, 49)]; // keep 50 freshest
    this.saveNotifications(updated);

    // Play subtle audio chime if enabled
    const cfg = this.getConfig();
    if (cfg.soundAlerts && typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = sev === 'urgent' ? 987.77 : 659.25;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } catch {}
    }

    return newAlert;
  }
}
