"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { navigationItems } from "../config/navigation";
import { Logo } from "@/modules/shared";
import { useSidebar } from "../context/sidebar-context";
import type { UserRole } from "@/db/types";

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const isAdmin = userRole === "admin";

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-darkgray border-r border-ld transition-all duration-300 ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Logo and toggle */}
      <div
        className={`h-15 flex items-center my-2 border-b border-ld transition-all duration-300 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-6"
        }`}
      >
        {!isCollapsed && (
          <Link href="/dashboard">
            <Logo width={120} height={32} />
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-lighthover dark:hover:bg-darkmuted transition-colors"
          title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          {isCollapsed ? (
            <IconChevronRight size={18} className="text-link dark:text-darklink" />
          ) : (
            <IconChevronLeft size={18} className="text-link dark:text-darklink" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`p-4 space-y-1 ${isCollapsed ? "px-2" : ""}`}>
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              title={isCollapsed ? item.title : undefined}
              className={`flex items-center gap-3 py-3 rounded-md text-sm font-medium transition-colors ${
                isCollapsed ? "justify-center px-2" : "px-4"
              } ${
                isActive
                  ? "bg-lightprimary text-primary"
                  : "text-link dark:text-darklink hover:bg-lighthover dark:hover:bg-darkmuted hover:text-primary"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
