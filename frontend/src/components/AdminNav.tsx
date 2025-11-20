'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  return (
    <nav className="bg-gray-900 p-4 border-b border-gray-800">
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
    </nav>
  );
}
