import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-black text-rose-500 mb-2">404</h1>
        <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">
          The requested resource or route does not exist. Please return to the dashboard.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-lg transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
