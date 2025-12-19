"use client";

import { useSidebar } from "../context/sidebar-context";

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={`flex-1 min-w-0 overflow-x-auto transition-all duration-300 ${
        isCollapsed ? "ml-18" : "ml-64"
      }`}
    >
      {children}
    </div>
  );
}
