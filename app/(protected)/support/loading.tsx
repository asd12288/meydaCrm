import { PageHeader, CardBox, Spinner } from '@/modules/shared';

export default function SupportLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & Abonnement"
        description="Gerez votre abonnement et vos paiements"
      />

      {/* Subscription status skeleton */}
      <CardBox>
        <div className="h-6 w-48 bg-surface rounded animate-pulse mb-4" />
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </CardBox>

      {/* Plan selector skeleton */}
      <CardBox>
        <div className="h-6 w-36 bg-surface rounded animate-pulse mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 bg-surface rounded-xl animate-pulse" />
          <div className="h-48 bg-surface rounded-xl animate-pulse" />
        </div>
      </CardBox>

      {/* Payment button skeleton */}
      <CardBox>
        <div className="h-6 w-40 bg-surface rounded animate-pulse mb-4" />
        <div className="h-12 bg-surface rounded-lg animate-pulse" />
      </CardBox>

      {/* Payment history skeleton */}
      <CardBox>
        <div className="h-6 w-44 bg-surface rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface rounded animate-pulse" />
          ))}
        </div>
      </CardBox>
    </div>
  );
}
