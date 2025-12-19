import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

// Server-side only - never import in client components
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres.js client
// prepare: false is required for Supabase Transaction pooling mode
const client = postgres(connectionString, {
  prepare: false,
  // Connection pool settings for Next.js
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle instance with schema for relational queries
export const db = drizzle(client, {
  schema: { ...schema, ...relations },
});

// Export schema and types for use in queries
export { schema };
export * from './types';

// Type export for typed queries
export type Database = typeof db;
