'use client';

import AdminNav from '@/components/AdminNav';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <div className="min-h-screen bg-black text-white">
      {!isLoginPage && <AdminNav />}
      <main className={isLoginPage ? '' : 'p-8'}>{children}</main>
    </div>
  );
}
