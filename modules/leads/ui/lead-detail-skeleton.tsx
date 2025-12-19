/**
 * Skeleton loader for the lead detail page
 * Matches the new redesigned layout with profile card + activity tabs
 */

import { CardBox } from '@/modules/shared';

/**
 * Skeleton for the profile card (left column)
 */
export function ProfileCardSkeleton() {
  return (
    <CardBox className="h-fit">
      {/* Header - Horizontal layout */}
      <div className="flex items-start gap-4 pb-4">
        <div className="skeleton w-16 h-16 rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="skeleton skeleton-text w-32 h-5 mb-2" />
          <div className="skeleton skeleton-text w-24 h-4 mb-2" />
          <div className="skeleton w-28 h-7 rounded-full" />
        </div>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2 pb-4">
        <div className="skeleton skeleton-text w-16 h-3" />
        <div className="skeleton w-28 h-8 rounded-md" />
      </div>

      <div className="profile-divider" />

      {/* Contact info items */}
      <div className="space-y-4 py-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="contact-info-row">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="flex-1">
              <div className="skeleton skeleton-text w-12 h-3 mb-1" />
              <div className="skeleton skeleton-text w-full h-4" />
            </div>
          </div>
        ))}
      </div>

      <div className="profile-divider" />

      {/* Metadata */}
      <div className="space-y-2 py-2">
        <div className="flex items-center gap-2">
          <div className="skeleton w-4 h-4" />
          <div className="skeleton skeleton-text w-32 h-3" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton w-4 h-4" />
          <div className="skeleton skeleton-text w-28 h-3" />
        </div>
      </div>

      {/* Edit button */}
      <div className="skeleton w-full h-10 rounded-full mt-4" />
    </CardBox>
  );
}

/**
 * Skeleton for the activity tabs (right column)
 */
export function ActivityTabsSkeleton() {
  return (
    <CardBox className="h-full flex flex-col overflow-hidden p-0">
      {/* Tab headers */}
      <div className="flex border-b border-ld shrink-0 px-4">
        <div className="flex items-center gap-2 py-3 px-2">
          <div className="skeleton w-5 h-5" />
          <div className="skeleton skeleton-text w-24 h-4" />
          <div className="skeleton w-6 h-5 rounded-full" />
        </div>
        <div className="flex items-center gap-2 py-3 px-2">
          <div className="skeleton w-5 h-5" />
          <div className="skeleton skeleton-text w-20 h-4" />
          <div className="skeleton w-6 h-5 rounded-full" />
        </div>
      </div>

      {/* Comment items */}
      <div className="flex-1 overflow-hidden p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="comment-bubble">
            <div className="flex items-start gap-3">
              <div className="skeleton w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="skeleton skeleton-text w-24 h-4" />
                  <div className="skeleton skeleton-text w-16 h-3" />
                </div>
                <div className="skeleton skeleton-text w-full h-4 mb-1" />
                <div className="skeleton skeleton-text w-3/4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="shrink-0 border-t border-ld p-4">
        <div className="flex gap-3 items-end">
          <div className="skeleton flex-1 h-16 rounded-md" />
          <div className="skeleton w-10 h-10 rounded-full shrink-0" />
        </div>
      </div>
    </CardBox>
  );
}

/**
 * Full lead detail page skeleton
 */
export function LeadDetailSkeleton() {
  return (
    <div className="min-w-0">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton skeleton-text w-48 h-7 mb-2" />
          <div className="skeleton skeleton-text w-24 h-4" />
        </div>
        <div className="skeleton w-20 h-9 rounded-full" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Profile Card */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <ProfileCardSkeleton />
        </div>

        {/* Right Column: Activity Tabs */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <div className="h-[calc(100vh-12rem)] min-h-100">
            <ActivityTabsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
