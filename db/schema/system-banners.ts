import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { profiles } from './profiles';
import { bannerTypeEnum, bannerTargetEnum } from './enums';

/**
 * System banners - Developer-created announcements shown to users
 * Developer role can create/manage banners
 * All users can view active banners (filtered by target audience)
 */
export const systemBanners = pgTable(
  'system_banners',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    message: text('message').notNull(),
    type: bannerTypeEnum('type').notNull().default('info'),
    targetAudience: bannerTargetEnum('target_audience').notNull().default('all'),

    isActive: boolean('is_active').notNull().default(true),
    isDismissible: boolean('is_dismissible').notNull().default(true),

    expiresAt: timestamp('expires_at', { withTimezone: true }),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Indexes
    index('system_banners_is_active_idx').on(table.isActive),
    index('system_banners_target_audience_idx').on(table.targetAudience),
    index('system_banners_expires_at_idx').on(table.expiresAt),
    index('system_banners_created_at_idx').on(table.createdAt),

    // RLS Policies

    // Developer can read all banners (for management)
    pgPolicy('developer_read_all_banners', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'developer'`,
    }),

    // Developer can create banners
    pgPolicy('developer_insert_banners', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`public.get_user_role() = 'developer' AND ${table.createdBy} = (select auth.uid())`,
    }),

    // Developer can update banners
    pgPolicy('developer_update_banners', {
      for: 'update',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'developer'`,
      withCheck: sql`public.get_user_role() = 'developer'`,
    }),

    // Developer can delete banners
    pgPolicy('developer_delete_banners', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'developer'`,
    }),

    // All users can read active banners targeting "all"
    pgPolicy('users_read_all_target_banners', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.isActive} = true AND ${table.targetAudience} = 'all' AND (${table.expiresAt} IS NULL OR ${table.expiresAt} > now())`,
    }),

    // Admin users can read active banners targeting "admin"
    pgPolicy('admin_read_admin_target_banners', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.isActive} = true AND ${table.targetAudience} = 'admin' AND public.get_user_role() = 'admin' AND (${table.expiresAt} IS NULL OR ${table.expiresAt} > now())`,
    }),
  ]
);

/**
 * Banner dismissals - Track which users have dismissed which banners
 */
export const bannerDismissals = pgTable(
  'banner_dismissals',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    bannerId: uuid('banner_id')
      .notNull()
      .references(() => systemBanners.id, { onDelete: 'cascade' }),

    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    dismissedAt: timestamp('dismissed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Unique constraint - one dismissal per user per banner
    unique('banner_dismissals_unique').on(table.bannerId, table.userId),

    // Indexes
    index('banner_dismissals_banner_id_idx').on(table.bannerId),
    index('banner_dismissals_user_id_idx').on(table.userId),

    // RLS Policies

    // Users can read their own dismissals
    pgPolicy('users_read_own_dismissals', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),

    // Users can insert their own dismissals
    pgPolicy('users_insert_own_dismissals', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = (select auth.uid())`,
    }),

    // Developer can read all dismissals (for analytics)
    pgPolicy('developer_read_all_dismissals', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'developer'`,
    }),
  ]
);

// Types
export type SystemBanner = typeof systemBanners.$inferSelect;
export type NewSystemBanner = typeof systemBanners.$inferInsert;
export type BannerDismissal = typeof bannerDismissals.$inferSelect;
export type NewBannerDismissal = typeof bannerDismissals.$inferInsert;
