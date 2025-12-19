'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from '../config/navigation';
import type { UserRole } from '@/db/types';

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === 'admin';

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-darkgray border-r border-ld">
      {/* Logo */}
      <div className="h-[70px] flex items-center px-6 border-b border-ld">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          CRM Medya
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-lightprimary text-primary'
                  : 'text-darklink hover:bg-hover hover:text-primary'
              }`}
            >
              <Icon size={20} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
