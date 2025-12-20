'use client';

import { useState, useRef } from 'react';
import { IconLogout, IconUser, IconChevronDown, IconShield } from '@tabler/icons-react';
import Link from 'next/link';
import { logout } from '@/modules/auth/lib/actions';
import { ThemeSwitcher, UserAvatar } from '@/modules/shared';
import { useClickOutside } from '@/modules/shared/hooks/use-click-outside';
import { NotificationBell } from '@/modules/notifications';

interface HeaderProps {
  displayName: string;
  role: string;
  avatar: string | null;
}

export function Header({ displayName, role, avatar }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAdmin = role === 'admin';
  const roleLabel = isAdmin ? 'Administrateur' : 'Commercial';

  useClickOutside(dropdownRef, () => setIsDropdownOpen(false), isDropdownOpen);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-darkgray/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-5 xl:px-6">
        {/* Left side - can add breadcrumb or search here */}
        <div className="flex items-center gap-4">
          {/* Placeholder for future breadcrumb/search */}
        </div>

        {/* Right side - user actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeSwitcher />

          {/* Divider */}
          <div className="w-px h-8 bg-border mx-2" />

          {/* Notifications */}
          <NotificationBell />

          {/* Divider */}
          <div className="w-px h-8 bg-border mx-2" />

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-lightgray dark:hover:bg-darkgray transition-colors"
            >
              <UserAvatar name={displayName} avatar={avatar} size="md" />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-ld leading-tight">{displayName}</p>
                <p className="text-xs text-darklink flex items-center gap-1">
                  {isAdmin && <IconShield size={12} />}
                  {roleLabel}
                </p>
              </div>
              <IconChevronDown
                size={16}
                className={`text-darklink transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark rounded-xl border border-border shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-border bg-lightgray dark:bg-darkgray">
                  <p className="text-sm font-semibold text-ld">{displayName}</p>
                  <p className="text-xs text-darklink">{roleLabel}</p>
                </div>

                {/* Menu items */}
                <div className="py-2">
                  <Link
                    href="/account"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-ld hover:bg-lightgray dark:hover:bg-darkgray transition-colors"
                  >
                    <IconUser size={18} className="text-darklink" />
                    <span>Mon compte</span>
                  </Link>

                  <div className="my-2 border-t border-border" />

                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors"
                    >
                      <IconLogout size={18} />
                      <span>Deconnexion</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
