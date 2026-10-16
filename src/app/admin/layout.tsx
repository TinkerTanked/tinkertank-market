import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import { headers } from 'next/headers';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { AdminRoleProvider } from '@/components/admin/AdminRole';
import { adminRoleFromAuthorization } from '@/lib/adminAuth';

export const metadata: Metadata = {
  title: 'TinkerTank Admin',
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827'
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const role = adminRoleFromAuthorization((await headers()).get('authorization'));

  return (
    <AdminRoleProvider role={role}>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="lg:pl-60">
          <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:pb-10 lg:pt-8">{children}</div>
        </main>
      </div>
    </AdminRoleProvider>
  );
}
