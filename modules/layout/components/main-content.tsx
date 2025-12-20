"use client";

import { useSidebar } from "../context/sidebar-context";

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={`min-h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? "ml-[72px]" : "ml-64"
      }`}
    >
      {children}
    </div>
  );
}
