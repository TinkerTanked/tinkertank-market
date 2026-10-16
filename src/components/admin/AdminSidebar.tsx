'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  FireIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useAdminRole } from './AdminRole';

// Mentors look after students; the super admin looks after customers.
const mentorNavigation = [
  { name: 'Check-in', href: '/admin/schedule', icon: ClipboardDocumentCheckIcon },
  { name: 'Students', href: '/admin/students', icon: UserGroupIcon }
];

const superNavigation = [
  { name: 'Check-in', href: '/admin/schedule', icon: ClipboardDocumentCheckIcon },
  { name: 'Customers', href: '/admin/customers', icon: UsersIcon },
  { name: 'Subscriptions', href: '/admin/ignite-subscriptions', icon: FireIcon },
  { name: 'Students', href: '/admin/students', icon: UserGroupIcon },
  { name: 'Bookings', href: '/admin/bookings', icon: DocumentTextIcon },
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Sales', href: '/admin/analytics', icon: ChartBarIcon }
];

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

function RoleBadge() {
  const role = useAdminRole();
  if (!role) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white">
      {role === 'super' && <ShieldCheckIcon className="h-3.5 w-3.5" />}
      {role === 'super' ? 'Super admin' : 'Mentor'}
    </span>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname() || '';
  const [moreOpen, setMoreOpen] = useState(false);
  const navigation = useAdminRole() === 'super' ? superNavigation : mentorNavigation;
  // Up to four tabs fit on a phone; anything beyond three goes under "More".
  const primaryMobile = navigation.length > 4 ? navigation.slice(0, 3) : navigation;
  const moreMobile = navigation.length > 4 ? navigation.slice(3) : [];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center justify-between gap-2 bg-gray-900 px-5">
          <span className="text-base font-semibold text-white">TinkerTank Admin</span>
          <RoleBadge />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map(item => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  active ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={clsx('h-5 w-5 flex-shrink-0', active ? 'text-orange-600' : 'text-gray-400')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-gray-900 px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <span className="text-base font-semibold text-white">TinkerTank Admin</span>
        <RoleBadge />
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className={clsx(
          'fixed inset-x-0 bottom-0 z-40 grid border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden',
          primaryMobile.length + (moreMobile.length ? 1 : 0) === 4 ? 'grid-cols-4' : 'grid-cols-2'
        )}
        aria-label="Admin"
      >
        {primaryMobile.map(item => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium', active ? 'text-orange-600' : 'text-gray-500')}
            >
              <item.icon className="h-6 w-6" />
              {item.name}
            </Link>
          );
        })}
        {moreMobile.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={clsx(
              'flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
              moreMobile.some(item => isActive(pathname, item.href)) ? 'text-orange-600' : 'text-gray-500'
            )}
          >
            <EllipsisHorizontalIcon className="h-6 w-6" />
            More
          </button>
        )}
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More admin pages">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-base font-semibold text-gray-900">More</span>
              <button type="button" onClick={() => setMoreOpen(false)} className="-mr-2 rounded-full p-2 text-gray-500" aria-label="Close">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4">
              {moreMobile.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={clsx(
                    'flex min-h-[56px] items-center gap-3 rounded-xl border px-4 text-sm font-medium',
                    isActive(pathname, item.href) ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-700'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
