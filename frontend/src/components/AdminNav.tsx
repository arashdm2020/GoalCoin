'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navLinks = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Reviewers', href: '/admin/reviewers' },
  { name: 'Submissions', href: '/admin/submissions' },
  { name: 'Memberships', href: '/admin/memberships' },
  { name: 'Commissions', href: '/admin/commissions' },
  { name: 'Leaderboard', href: '/admin/leaderboard' },
  { name: 'Settings', href: '/admin/settings' },
  { name: 'Emails', href: '/admin/emails' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_header');
    router.push('/admin/login');
  };

  return (
    <nav className="bg-gray-900 p-4 border-b border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href} className={`px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                {link.name}
              </Link>
            );
          })}
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}
