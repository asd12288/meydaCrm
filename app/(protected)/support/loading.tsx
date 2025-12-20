import { PageHeader, CardBox } from '@/modules/shared';
import { TicketListSkeleton } from '@/modules/support/ui/ticket-list-skeleton';
import { TicketEmptyStateSkeleton } from '@/modules/support/ui/ticket-detail-skeleton';

export default function SupportLoading() {
  return (
    <div className="min-w-0 flex flex-col h-full">
      <PageHeader
        title="Support"
        description="Gérez vos tickets de support"
      />

      {/* Main split layout skeleton */}
      <CardBox className="!p-0 overflow-hidden flex-1">
        <div className="flex flex-row h-[calc(100vh-180px)] min-h-[500px]">
          {/* Left panel - Ticket List skeleton */}
          <div className="hidden lg:flex lg:flex-col w-[380px] h-full shrink-0 border-r border-ld">
            <TicketListSkeleton count={8} />
          </div>

          {/* Right panel - Empty state skeleton */}
          <div className="flex-1 min-w-0 flex flex-col">
            <TicketEmptyStateSkeleton />
          </div>
        </div>
      </CardBox>
    </div>
  );
}
