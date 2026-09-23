import jwt from 'jsonwebtoken';
import { Role, UserSession, AppUser } from '../types/erp';

const JWT_SECRET = process.env.JWT_SECRET || 'garments-qms-erp-secret-key-2026';

export const DEMO_USERS: AppUser[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    name: 'Kazi Farhan (Super Admin)',
    email: 'admin@garmentserp.com',
    role: 'ADMIN',
    department: 'Executive Operations',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    password: 'admin',
    isActive: true,
    isSuperAdmin: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_qa',
    username: 'tania.qa',
    name: 'Tania Ahmed (QA Lead)',
    email: 'qa.lead@garmentserp.com',
    role: 'QA_MANAGER',
    department: 'Quality Assurance & AQL',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
    password: 'qa',
    isActive: true,
    isSuperAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_inspector',
    username: 'rafiq.wh',
    name: 'Rafiqul Islam (Warehouse Inspector)',
    email: 'inspector@garmentserp.com',
    role: 'WAREHOUSE_INSPECTOR',
    department: 'Warehouse & Raw Materials',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    password: 'wh',
    isActive: true,
    isSuperAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_prod',
    username: 'mahmud.prod',
    name: 'Mahmud Hasan (Production Head)',
    email: 'production@garmentserp.com',
    role: 'PRODUCTION_HEAD',
    department: 'Sewing & Assembly Lines',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    password: 'prod',
    isActive: true,
    isSuperAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_operator',
    username: 'shirin.op',
    name: 'Shirin Akter (Line Operator)',
    email: 'operator@garmentserp.com',
    role: 'OPERATOR',
    department: 'Floor Assembly 03',
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
    };
  } catch {
    return null;
  }
}

export function hasPermission(role: Role, requiredRoles: Role[]): boolean {
  if (role === 'ADMIN') return true;
  return requiredRoles.includes(role);
}
