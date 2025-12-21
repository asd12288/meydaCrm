import { Suspense } from 'react';
import { PageHeader, SectionErrorFallback } from '@/modules/shared';
import { ErrorBoundary } from 'react-error-boundary';
import { getNotes } from '../lib/actions';
import { NotesCanvas } from '../components/notes-canvas';

async function NotesContent() {
  const { notes, error } = await getNotes();

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  return <NotesCanvas notes={notes} />;
}

function NotesLoadingSkeleton() {
  return (
    <div className="notes-canvas-container">
      <div className="notes-canvas-toolbar">
        <div className="h-5 w-20 bg-lightgray dark:bg-darkgray rounded animate-pulse" />
        <div className="h-8 w-32 bg-lightgray dark:bg-darkgray rounded animate-pulse" />
      </div>
      <div className="notes-canvas">
        {/* Skeleton Post-it notes */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-amber-100 dark:bg-amber-900/30 rounded animate-pulse"
            style={{
              left: 100 + i * 260,
              top: 100 + (i % 2) * 220,
              width: 240,
              height: 200,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export async function NotesView() {
  return (
    <div className="space-y-4">
      <PageHeader title="Mes notes" />

      <ErrorBoundary FallbackComponent={SectionErrorFallback}>
        <Suspense fallback={<NotesLoadingSkeleton />}>
          <NotesContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
