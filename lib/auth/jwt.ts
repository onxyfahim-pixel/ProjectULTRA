import jwt from 'jsonwebtoken';
import { Role, UserSession, AppUser } from '../types/erp';

const JWT_SECRET = process.env.JWT_SECRET || 'garments-qms-erp-secret-key-2026';

export const DEMO_USERS: AppUser[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'Super Admin',
    department: 'Executive Operations & QMS',
    designation: 'Director of Quality & Enterprise Compliance',
    phone: '+880 1711-234567',
    employeeId: 'VG-QMS-2024-001',
    factoryUnit: 'Unit 01 — Gazipur Industrial Complex',
    workShift: 'General Shift (08:00 - 17:00)',
    emergencyContact: '+880 1819-876543 (Factory Security Ops)',
    timezone: 'Asia/Dhaka (GMT+6)',
    language: 'English (US)',
    bio: 'Lead Garments Quality Director with 14+ years experience overseeing ISO 9001:2015, AQL 1.5/2.5 audits, Lean Six Sigma deployment, and buyer compliance protocols across international apparel brands.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    password: 'admin',
    isActive: true,
    isSuperAdmin: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_qa',
    username: 'tania.qa',
    name: 'Tania Ahmed',
    email: 'qa.lead@garmentserp.com',
    role: 'QC Manager',
    department: 'Quality Assurance & AQL',
    designation: 'Senior QA Manager (Knits & Woven)',
    phone: '+880 1722-345678',
    employeeId: 'VG-QA-2024-042',
    factoryUnit: 'Unit 01 — Gazipur Industrial Complex',
    workShift: 'Morning Shift (07:30 - 16:30)',
    emergencyContact: '+880 1711-001122',
    timezone: 'Asia/Dhaka (GMT+6)',
    language: 'English (US)',
    bio: 'Quality Assurance Lead specializing in statistical process control, DHU reduction, and ASTM/AATCC lab testing procedures.',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
    password: 'qa',
    isActive: true,
    isSuperAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_inspector',
    username: 'rafiq.wh',
    name: 'Rafiqul Islam',
    email: 'inspector@garmentserp.com',
    role: 'Inspector',
    department: 'Warehouse & Raw Materials',
    designation: 'Raw Material & Fabric Inspector (4-Point)',
    phone: '+880 1733-456789',
    employeeId: 'VG-WH-2024-108',
    factoryUnit: 'Unit 02 — Ashulia Dyeing & Warehouse',
    workShift: 'General Shift (08:00 - 17:00)',
    emergencyContact: '+880 1722-998877',
    timezone: 'Asia/Dhaka (GMT+6)',
    language: 'English (US)',
    bio: 'Certified Fabric Inspection Specialist trained under ASTM D5430 4-Point System and AQL standard lot sampling.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    password: 'wh',
    isActive: true,
    isSuperAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_prod',
    username: 'mahmud.prod',
    name: 'Mahmud Hasan',
    email: 'production@garmentserp.com',
    role: 'PRODUCTION_HEAD',
    department: 'Sewing & Assembly Lines',
    designation: 'Chief Production Officer (CPO)',
    phone: '+880 1744-567890',
    employeeId: 'VG-PR-2024-005',
    factoryUnit: 'Unit 01 — Gazipur Industrial Complex',
    workShift: 'General Shift (08:00 - 17:00)',
    emergencyContact: '+880 1733-112233',
    timezone: 'Asia/Dhaka (GMT+6)',
    language: 'English (US)',
    bio: 'Industrial Production Engineer with 18+ years leading high-volume garment manufacturing lines, SMV optimization, and line balancing.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    password: 'prod',
    isActive: true,
    isSuperAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_operator',
    username: 'shirin.op',
    name: 'Shirin Akter',
    email: 'operator@garmentserp.com',
    role: 'Viewer',
    department: 'Floor Assembly 03',
    designation: 'Senior QC Line Auditor & Needle Guard Inspector',
    phone: '+880 1755-678901',
    employeeId: 'VG-OP-2024-319',
    factoryUnit: 'Unit 01 — Gazipur Industrial Complex',
    workShift: 'Shift A (06:00 - 14:00)',
    emergencyContact: '+880 1744-223344',
    timezone: 'Asia/Dhaka (GMT+6)',
    language: 'Bengali / English',
    bio: 'Sewing Line Quality Auditor specializing in seam puckering detection, broken stitch analysis, and traffic light QC inspection.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    password: 'op',
    isActive: true,
    isSuperAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export function signToken(user: UserSession): string {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      username: user.username || user.email.split('@')[0],
      role: user.role,
      department: user.department,
      avatarUrl: user.avatarUrl,
      isSuperAdmin: user.isSuperAdmin || user.role === 'ADMIN',
      phone: user.phone,
      designation: user.designation,
      employeeId: user.employeeId,
      factoryUnit: user.factoryUnit,
      workShift: user.workShift,
      emergencyContact: user.emergencyContact,
      timezone: user.timezone,
      language: user.language,
      bio: user.bio,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      name: string;
      email: string;
      username?: string;
      role: Role;
      department: string;
      avatarUrl?: string;
      isSuperAdmin?: boolean;
      phone?: string;
      designation?: string;
      employeeId?: string;
      factoryUnit?: string;
      workShift?: string;
      emergencyContact?: string;
      timezone?: string;
      language?: string;
      bio?: string;
    };

    return {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      username: decoded.username || decoded.email.split('@')[0],
      role: decoded.role,
      department: decoded.department,
      avatarUrl: decoded.avatarUrl,
      isSuperAdmin: decoded.isSuperAdmin || decoded.role === 'ADMIN',
      phone: decoded.phone,
      designation: decoded.designation,
      employeeId: decoded.employeeId,
      factoryUnit: decoded.factoryUnit,
      workShift: decoded.workShift,
      emergencyContact: decoded.emergencyContact,
      timezone: decoded.timezone,
      language: decoded.language,
      bio: decoded.bio,
    };
  } catch {
    return null;
  }
}

export function hasPermission(role: Role, requiredRoles: Role[]): boolean {
  if (role === 'ADMIN') return true;
  return requiredRoles.includes(role);
}
