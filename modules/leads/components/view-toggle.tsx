'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { IconTable, IconLayoutKanban } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export type ViewMode = 'table' | 'kanban';

interface ViewToggleProps {
  currentView: ViewMode;
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleViewChange = (newView: ViewMode) => {
    if (newView === currentView) return;

    // Create new URL with updated view param
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);

    // Reset page to 1 when switching views
    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative inline-flex rounded-lg border border-border bg-surface p-0.5">
      {/* Sliding background indicator */}
      <div
        className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md bg-white dark:bg-dark shadow-sm transition-transform duration-200 ease-out ${
          currentView === 'kanban' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
        }`}
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleViewChange('table')}
        className={`relative z-10 gap-1.5 rounded-md transition-colors duration-200 ${
          currentView === 'table'
            ? 'text-ld'
            : 'text-darklink hover:text-ld hover:bg-transparent'
        }`}
        aria-pressed={currentView === 'table'}
      >
        <IconTable
          size={16}
          className={`transition-transform duration-200 ${currentView === 'table' ? 'scale-110' : ''}`}
        />
        Tableau
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleViewChange('kanban')}
        className={`relative z-10 gap-1.5 rounded-md transition-colors duration-200 ${
          currentView === 'kanban'
            ? 'text-ld'
            : 'text-darklink hover:text-ld hover:bg-transparent'
        }`}
        aria-pressed={currentView === 'kanban'}
      >
        <IconLayoutKanban
          size={16}
          className={`transition-transform duration-200 ${currentView === 'kanban' ? 'scale-110' : ''}`}
        />
        Kanban
      </Button>
    </div>
  );
}
