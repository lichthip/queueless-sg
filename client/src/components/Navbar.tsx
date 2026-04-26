'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function Navbar() {
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={clsx(
        'text-sm font-medium transition-colors',
        path === href ? 'text-red-600' : 'text-slate-600 hover:text-slate-900',
      )}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <span className="font-semibold text-slate-900 text-lg">QueueLess</span>
          <span className="text-slate-400 text-sm font-medium">SG</span>
        </Link>
        <div className="flex items-center gap-6">
          {link('/', 'Live Queue')}
          {link('/dashboard', 'Staff Portal')}
        </div>
      </div>
    </nav>
  );
}