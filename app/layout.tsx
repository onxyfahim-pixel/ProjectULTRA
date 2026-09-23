import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Garments QMS ERP',
  description: 'Garments Quality Management System & ERP dashboard with unified modular navigation, standard data tables, JWT & RBAC Express backend, PostgreSQL Prisma integration, and real-time WebSocket inventory sync.',
  openGraph: {
    title: 'Garments QMS ERP',
    description: 'Garments Quality Management System & ERP dashboard with unified modular navigation, standard data tables, JWT & RBAC Express backend, PostgreSQL Prisma integration, and real-time WebSocket inventory sync.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Garments QMS ERP',
    description: 'Garments Quality Management System & ERP dashboard with unified modular navigation, standard data tables, JWT & RBAC Express backend, PostgreSQL Prisma integration, and real-time WebSocket inventory sync.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
