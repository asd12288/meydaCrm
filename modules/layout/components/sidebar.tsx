"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { navigationItems, navGroups } from "../config/navigation";
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
  const isDeveloper = userRole === "developer";

  // Filter items based on role
  const visibleItems = navigationItems.filter((item) => {
    // If roles array is specified, check if user role is in it
    if (item.roles) {
      return item.roles.includes(userRole);
    }
    // Otherwise, use adminOnly check (backward compatibility)
    return !item.adminOnly || isAdmin;
  });

  // Filter groups based on role and whether they have visible items
  const visibleGroups = navGroups.filter((group) => {
    if (group.adminOnly && !isAdmin && !isDeveloper) return false;
    return visibleItems.some((item) => item.group === group.id);
  });

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-darkgray border-r border-border shadow-sm transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Logo and toggle */}
      <div
        className={`h-16 flex items-center border-b border-border transition-all duration-300 shrink-0 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-5"
        }`}
      >
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center">
            <Logo size="md" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={toggleSidebar}
          title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          {isCollapsed ? (
            <IconChevronRight size={18} className="text-darklink" />
          ) : (
            <IconChevronLeft size={18} className="text-darklink" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {visibleGroups.map((group, groupIndex) => {
          const groupItems = visibleItems.filter(
            (item) => item.group === group.id
          );

          return (
            <div key={group.id} className={groupIndex > 0 ? "mt-4" : ""}>
              {/* Group label */}
              {!isCollapsed && (
                <div className="px-5 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-darklink/70">
                    {group.label}
                  </span>
                </div>
              )}

              {/* Divider for collapsed mode */}
              {isCollapsed && groupIndex > 0 && (
                <div className="mx-3 mb-3 border-t border-border" />
              )}

              {/* Group items */}
              <div className={`space-y-1 ${isCollapsed ? "px-2" : "px-3"}`}>
                {groupItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      title={isCollapsed ? item.title : undefined}
                      className={`group flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isCollapsed ? "justify-center px-2" : "px-3"
                      } ${
                        isActive
                          ? "bg-primary text-white shadow-sm"
                          : "text-darklink hover:bg-lightgray dark:hover:bg-darkgray hover:text-ld"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={`shrink-0 transition-transform duration-200 ${
                          !isActive ? "group-hover:scale-110" : ""
                        }`}
                      />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer - version or branding */}
      {!isCollapsed && (
        <div className="shrink-0 px-5 py-4 border-t border-border">
          <p className="text-xs text-darklink/50 text-center">
            Pulse CRM v1.0
          </p>
        </div>
      )}
    </aside>
  );
}
