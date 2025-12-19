import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  // Schema location (Next.js 16 has no src folder)
  schema: './db/schema/index.ts',

  // Output migrations to supabase folder
  out: './supabase/migrations',

  // PostgreSQL dialect
  dialect: 'postgresql',

  // Database connection
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // Enable role management for RLS policies
  entities: {
    roles: {
      // Use Supabase provider to exclude internal Supabase roles
      provider: 'supabase',
    },
  },

  // Verbose output for debugging
  verbose: true,

  // Strict mode for safer migrations
  strict: true,
});
