# CLAUDE.md — Pulse CRM (Next.js 16 + Supabase + Vercel)

This file provides persistent context for Claude Code while developing this repository.
It defines the product scope, architecture, folder conventions, coding standards, and safe workflows.

---

## 0) Mission & Scope (what we are building)

We are replacing an old CRM with a simpler, more reliable CRM.

### MVP modules (must ship)

- Auth (Supabase Auth): email-like login + password (no real emails required)
- Roles: `admin` and `sales`
- Admin:
  - create sales users (no self-register)
  - reset user passwords
  - upload leads from file (CSV + XLSX)
  - assign leads (bulk + single)
  - view/edit all leads
- Sales:
  - view only their assigned leads
  - edit all lead fields, status, and comments
  - change own password
- Leads:
  - table list with filters + search + pagination (20k+ records)
  - lead detail page (full fields) + comments + history (audit timeline)
- Import system:
  - end-to-end upload + parsing + validation + safe commit
  - resumable and non-corrupting
- App language: French UI everywhere

### Explicit non-goals for MVP (do NOT build unless asked)

- Self registration / email reset flows
- Gmail sync, workflows, automations
- Complex multi-tenant teams (only admin/sales, per-lead assignment)

---

## 1) Tech Stack & Key Constraints

### Frontend / Backend-for-Frontend

- Next.js 16.x (App Router)
- Route Handlers for server endpoints where needed
- Next.js "Proxy" convention (Next 16 rename of middleware) if we need request-level routing/auth gates
- Tailwind + UI8 template:
  https://ui8.net/wrappixel/products/materialm-nextjs-tailwind-admin-template

### Data / Auth

- Supabase Postgres (RLS enabled)
- Supabase Auth (email/password)
- Supabase Storage (private bucket for import files)
- Supabase Edge Functions for privileged operations and long-running import processing

### ORM

- Drizzle may be used for typed queries + schema representation.
- The source of truth for permissions is always Postgres RLS.

### Deployment

- Vercel for Next.js frontend
- Supabase hosts DB/Auth/Storage/Functions

### Security constraints (never violate)

- Do NOT store Supabase service role key in Next.js/Vercel environment.
- All privileged actions happen in Supabase Edge Functions.
- All access control must be enforced by RLS, not only UI logic.

---

## 2) Product Rules (invariants)

### Auth

- No public signup UI.
- Only admins create users.
- Admin can reset any user password.
- Sales can change their own password.

### Authorization

**Roles:**
- **admin**: Full access to everything. Creates users, manages leads, imports, support tickets.
- **sales**: Access only to their assigned leads and related comments/history.
- **developer** (internal): Secret role for support ticket responders. Not exposed in user creation UI.

**Role permissions:**
- Admin can read/write everything.
- Sales can only read/write:
  - leads where `assigned_to = auth.uid()`
  - comments/history linked to those leads
- Developer can:
  - View all support tickets and comments
  - Add comments/replies to tickets
  - Edit their own comments
  - Receive notifications for ticket activity
  - Cannot create tickets, change status, or delete anything

### Data integrity

- All lead edits must be reflected in `lead_history` (audit timeline).
- Leads are soft-deleted (use `deleted_at`) unless explicitly required otherwise.
- Imports must be chunked, resumable, and never partially corrupt final tables.

### Language

- UI, status labels, validation messages in French.
- Keep internal keys in English when helpful (`status_key`) but display strings in French.

---

## 3) Repository Structure (module-oriented)

**IMPORTANT: Next.js 16 does NOT use a `/src` folder. All code lives at the project root.**

We prefer a module system organization.

Use:

- `/modules/<domain>/...` for domain features
- `/lib/...` for cross-cutting utilities
- `/db/...` for database schema, types, and connection (Drizzle)

Each module follows this convention:

- `config/` constants, route config, feature flags
- `hooks/` React hooks (client-only), data hooks, UI hooks
- `lib/` domain logic, server actions, queries, helpers
- `types/` domain types, zod schemas, DTOs
- `ui/` presentational UI primitives used by this module
- `components/` composite components
- `layouts/` layouts specific to this module
- `views/` page-level view components rendered by app routes
- `index.ts` barrel exports for the module

Database folder structure (`/db`):

- `schema/` - Drizzle table definitions with RLS policies
- `relations.ts` - Drizzle relations for type-safe joins
- `types.ts` - Inferred TypeScript types
- `index.ts` - Database connection singleton

App Router (`/app`) should stay thin:

- route file renders a View from a module
- minimal glue (auth guard, metadata, etc.)

Example:

- `app/(protected)/leads/page.tsx` -> `return <LeadsListView />`
- `modules/leads/views/leads-list-view.tsx`

---

## 4) Data Model (high level)

Core tables:

- `profiles` (id = auth.users.id, role, display_name)
- `leads` (full lead fields + assigned_to)
- `lead_comments` (lead_id, author_id, body)
- `lead_history` (lead_id, actor_id, event_type, before/after json)
- `import_jobs`
- `import_rows` (optional but recommended for validation & resumability)

Indexing expectations:

- leads: `(assigned_to, updated_at desc)`, `(assigned_to, status)`, `external_id`
- text search (optional): trigram index on name/email/phone

RLS expectations:

- Profiles: admin read all; user read own.
- Leads/comments/history: admin all; sales only assigned leads.

### RLS Helper Function

**IMPORTANT**: All admin-checking RLS policies use the `public.get_user_role()` function:

```sql
CREATE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid()
$$;
```

This function uses `SECURITY DEFINER` to bypass RLS and prevent infinite recursion when checking if a user is admin. All policies that need to check admin role MUST use `public.get_user_role() = 'admin'` instead of querying the profiles table directly.

---

## 5) Supabase Edge Functions (required)

Privileged functions (service role):

1. `admin-create-user`
   - input: { email, password, displayName, role }
   - creates auth user + profiles row
2. `admin-reset-password`
   - input: { userId, newPassword }
3. `import-parse`
   - reads file from Storage
   - parses CSV/XLSX
   - writes `import_rows` with validation errors
   - updates `import_jobs`
4. `import-commit`
   - chunked upserts into `leads`
   - writes `lead_history` events
   - marks rows imported/skipped

Important:

- Edge Functions must validate the caller is admin.
- Never trust client role checks—always verify server-side using profiles + auth.

---

## 6) Next.js 16 patterns (how to build)

### Server vs Client components

- Default to Server Components.
- Use `"use client"` only for interactive UI (tables, forms, toasts).
- Data fetching:
  - Prefer server actions / server-side queries for initial page loads.
  - Keep client fetching for live refresh or infinite scrolling if needed.

### Proxy (Next 16)

- Only add `proxy.ts` if we truly need request-level behavior (rewrites/redirects/auth gating).
- Prefer route-level guards and Supabase session checks unless a Proxy is required.

### API surface

- Prefer Next route handlers for internal endpoints only when useful.
- Prefer Edge Functions for privileged and heavy tasks (imports, admin user mgmt).

---

## 7) UX requirements (match old CRM but modern)

### Leads table

- Pagination (server-side), fast filters, global search
- Bulk select + bulk assign (admin only)
- Column set: match import fields where possible
- French labels
- Sticky header, quick status badge editing

### Lead detail page

- Full editable fields
- Comments thread (chronological)
- History timeline (audit events: assignment, edits, status changes, imports)

### Import UI (admin)

- Upload (CSV/XLSX)
- Preview + mapping (auto map French column names)
- Validation summary (invalid rows)
- Start import -> show progress
- After import: go to leads list with filter “Import du jour”

### Users UI (admin)

- Create user: (email-like login, displayName, role, initial password)
- Reset password (sets a new password; user logs in with it)
- Optional: disable user (future)

### Account UI (sales/admin)

- Change own password
- Change display name (optional)

---

## 8) Coding Standards

### TypeScript

- Strict types, no `any` unless unavoidable (document why).
- Validate external input with Zod (especially import rows and function inputs).

### Database & security

- Never implement authorization only in client.
- Assume any client can call any endpoint.
- RLS is the final guardrail.

### Naming

- Code identifiers in English.
- UI strings in French.
- Keep statuses as stable keys + display labels:
  - e.g. `status_key = "no_answer"`, `status_label = "Pas de réponse"`
  - If we must store only one value, store the French label consistently.

### Formatting

- Use Prettier defaults.
- Keep functions small. Prefer pure helpers in `lib/`.

---

## 9) Claude Code Working Agreement (how Claude should operate)

When working in this repo:

### Always do this first

1. Restate the task in 1–3 bullets.
2. Propose a short plan (steps).
3. Identify what files/modules will be touched.
4. Confirm any missing product decisions only if truly blocking.

### Work style

- Make small, reviewable changes.
- Prefer incremental commits (or clearly separated edits).
- After changes, run checks (lint/typecheck/tests) or at least describe what to run.

### Never do these

- Don’t add self-signup flows.
- Don’t store service-role keys in the app.
- Don’t bypass RLS by using admin privileges in the frontend.
- Don’t introduce new patterns that fight the module structure.

### Definition of done for a feature

- Works end-to-end in UI
- Respects role rules (admin vs sales)
- Writes history events when updating leads
- Handles errors with French messages
- Doesn’t break build or typecheck

---

## 10) Environment Variables (expected)

### Next.js / Vercel (public)

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Vercel (server-only, set in Vercel dashboard)

- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

### Upstash QStash (for import job queue)

- `QSTASH_TOKEN` - QStash API token (from https://console.upstash.com/qstash)
- `QSTASH_CURRENT_SIGNING_KEY` - For webhook signature verification
- `QSTASH_NEXT_SIGNING_KEY` - For key rotation

### Upstash Redis (for caching)

- `UPSTASH_REDIS_REST_URL` - Redis REST API URL (e.g., https://xxx.upstash.io)
- `UPSTASH_REDIS_REST_TOKEN` - Redis REST API token

### Application URL

- `APP_URL` - Full application URL (e.g., https://your-app.vercel.app)
- Auto-detected from `VERCEL_URL` if not set

### Vercel Deployment Protection (for QStash callbacks)

- `VERCEL_AUTOMATION_BYPASS_SECRET` - Bypass secret for Vercel Deployment Protection
  - Required when Deployment Protection is enabled on production
  - Get from Vercel Dashboard → Settings → Deployment Protection → Protection Bypass for Automation
  - Allows QStash to call API routes without SSO authentication

### Supabase Edge Functions (server-only)

- `SUPABASE_SERVICE_ROLE_KEY` (in Supabase secrets)

Never put service role key in client-side code.

### Supabase Project Info (for Claude MCP)

- **Project ID**: `owwyxrxojltmupqrvqcp`
- **Project Name**: `crm-medya`
- **Region**: `eu-central-1`
- **Database Host**: `db.owwyxrxojltmupqrvqcp.supabase.co`

### PostHog Analytics (for internal tracking)

- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host (https://eu.i.posthog.com for EU)

**Dashboard**: https://eu.posthog.com

---

## 10.1) Analytics (PostHog + Vercel)

### What's Tracked Automatically

| Feature | Tool | Notes |
|---------|------|-------|
| Page views | PostHog | Every navigation |
| Click tracking | PostHog | All button/link clicks |
| Session replays | PostHog | Watch user sessions |
| Error tracking | PostHog | JS exceptions |
| User identification | PostHog | Links events to users (name, role) |
| Traffic analytics | Vercel Analytics | Visitors, geography |
| Performance | Vercel Speed Insights | Core Web Vitals |

### Files Structure

```
lib/analytics/
├── index.tsx           # Main provider + exports
├── posthog-provider.tsx # PostHog initialization
├── identify.tsx        # User identification component
└── events.ts           # Custom event helpers
```

### Using Custom Events

Import the `analytics` helper in any **client component**:

```typescript
import { analytics } from '@/lib/analytics';

// After a successful action:
analytics.leadStatusChanged({
  leadId: lead.id,
  from: 'nouveau',
  to: 'contacté',
});

analytics.bulkLeadsTransferred({
  leadCount: 5,
  fromUserId: 'uuid-1',
  toUserId: 'uuid-2',
});

analytics.commentAdded({ leadId: 'uuid' });

analytics.searchPerformed({
  query: 'dupont',
  resultsCount: 12,
});

analytics.importCompleted({
  rowCount: 500,
  fileType: 'xlsx',
  durationMs: 3000,
});

analytics.featureUsed('bulk_export', { format: 'csv' });
```

### Available Events

| Event | Properties | When to Use |
|-------|------------|-------------|
| `leadStatusChanged` | `leadId`, `from`, `to` | Status dropdown change |
| `leadTransferred` | `leadId`, `fromUserId`, `toUserId` | Single lead transfer |
| `bulkLeadsTransferred` | `leadCount`, `fromUserId`, `toUserId` | Bulk transfer |
| `commentAdded` | `leadId` | After comment saved |
| `searchPerformed` | `query`, `resultsCount`, `filters?` | After search |
| `importStarted` | `fileType`, `fileName` | Import begins |
| `importCompleted` | `rowCount`, `fileType`, `durationMs?` | Import success |
| `importFailed` | `error`, `fileType?` | Import error |
| `userCreated` | `role` | Admin creates user |
| `featureUsed` | `feature`, `...props` | Generic feature tracking |

### Testing Locally

1. Set `ENABLE_DEV_TRACKING = true` in `lib/analytics/posthog-provider.tsx`
2. Open browser DevTools → Console
3. Navigate around, you'll see `[PostHog] Capturing event: ...`
4. Check https://eu.posthog.com → Activity for live events
5. **Remember to set back to `false` before deploying**

### PostHog Dashboard Quick Links

- **Activity Feed**: See live events
- **Persons**: View individual users (Marie, Jean, etc.)
- **Session Replays**: Watch user sessions
- **Error Tracking**: View JS errors
- **Insights**: Create funnels, trends, retention charts
- **Dashboards**: Build custom dashboards

---

## 10.2) Database Migrations (Best Practice)

### Preferred Approach: Local Migration Files

**Always create migrations as local files** instead of using MCP `apply_migration` directly:

```bash
# Create a new migration file
npx supabase migration new add_new_column

# Edit the generated file in supabase/migrations/YYYYMMDDHHMMSS_add_new_column.sql
# Add your SQL (CREATE, ALTER, etc.)

# Test locally
npx supabase db reset   # Reapply all migrations + seed

# Commit and push with your PR
git add supabase/migrations/
git commit -m "feat: add new column to leads"
```

**Why local files are better:**

| Local Migration Files | MCP `apply_migration` |
|-----------------------|----------------------|
| ✅ Version controlled in git | ❌ Not tracked in git |
| ✅ Reviewable in PRs | ❌ Applied directly, no review |
| ✅ Testable locally with `db reset` | ❌ Applied to remote only |
| ✅ Auto-applied to preview branches | ❌ Must manually re-apply |
| ✅ Team can see schema changes | ❌ Only visible in DB |
| ✅ Reproducible across environments | ❌ Environment-specific |

### Supabase MCP Tools (Read-Only & Exploration)

Claude has access to Supabase via MCP. Use these tools for **querying and exploration only**:

| Tool | Description | When to Use |
|------|-------------|-------------|
| `mcp__supabase__list_tables` | List all tables | Check current schema |
| `mcp__supabase__execute_sql` | Run SELECT queries | Query data, debug issues |
| `mcp__supabase__list_migrations` | List applied migrations | Verify migration status |
| `mcp__supabase__get_advisors` | Security/performance tips | Audit RLS policies |
| `mcp__supabase__generate_typescript_types` | Generate TS types | Update `db/types.ts` |

### MCP Usage Examples

```
# List all tables
mcp__supabase__list_tables(project_id="owwyxrxojltmupqrvqcp")

# Run a query (read-only)
mcp__supabase__execute_sql(
  project_id="owwyxrxojltmupqrvqcp",
  query="SELECT * FROM leads LIMIT 5"
)

# Check security advisors after schema changes
mcp__supabase__get_advisors(
  project_id="owwyxrxojltmupqrvqcp",
  type="security"
)
```

### When MCP `apply_migration` is Acceptable

Only use `mcp__supabase__apply_migration` for:
- **Quick prototyping** during early exploration (then recreate as local file)
- **Emergency hotfixes** that need immediate production deployment (rare)
- **One-time data fixes** that don't need to be reproducible

**After using MCP apply_migration, always:**
1. Create a matching local migration file for reproducibility
2. Or document why it was a one-time operation

### Important Notes

- Project ID: `owwyxrxojltmupqrvqcp`
- Always check security advisors after schema changes
- Generated TypeScript types should be reviewed before committing

---

## 11) Suggested Commands (adjust to actual package manager)

Common:

- `pnpm dev` / `npm run dev`
- `pnpm lint`
- `pnpm typecheck`

Supabase local (if used):

- `supabase start`
- `supabase db reset`
- `supabase migration new <name>`
- `supabase functions serve <function-name>`

Vercel local (optional):

- `vercel dev`

If commands differ, update this section.

---

## 12) Implementation Roadmap (MVP order)

1. ~~Supabase schema + RLS + profiles bootstrapping~~ ✅ DONE
2. ~~Auth (login + protected routes + role guard)~~ ✅ DONE
3. Leads table (assigned-only for sales; all for admin)
4. Lead detail (edit all fields + comments + history)
5. Admin users screen (create user + reset password)
6. Import v1: CSV end-to-end (upload -> parse -> commit)
7. Import v2: XLSX support + mapping polish
8. Dashboard widgets (history feed + leads by status)

### Phase 1 & 2 Implementation Notes

**Database (Phase 1):**
- 6 tables: profiles, leads, lead_comments, lead_history, import_jobs, import_rows
- RLS policies for admin/sales roles
- Profile creation trigger on auth.users insert
- Storage bucket `imports` for file uploads
- Migrations: `initial_schema_with_rls`, `add_profile_trigger_and_storage`, `fix_profile_trigger`

**Auth (Phase 2):**
- Username-based login (no email required) - internally uses `username@crm.local`
- Next.js 16 `proxy.ts` for session management (not middleware.ts)
- Supabase SSR with `@supabase/ssr` package
- Protected routes with role guards
- Edge Function `admin-create-user` for user creation

**Module Structure Created:**
- `modules/auth/` - login, logout, session management
- `modules/layout/` - sidebar, header, dashboard layout
- `modules/shared/` - CardBox, Spinner, PageHeader
- `lib/supabase/` - client, server, proxy utilities

**Routes Created:**
- `/login` - Login page
- `/dashboard` - Dashboard (placeholder)
- `/leads` - Leads list (placeholder)
- `/leads/[id]` - Lead detail (placeholder)
- `/users` - Admin only (placeholder)
- `/import` - Admin only (placeholder)
- `/account` - Account settings (placeholder)

---

## 13) Project Management (Notion)

The detailed project plan, phases, and task tracking are maintained in Notion:

- **Notion Page**: [Pulse CRM - Project Plan & Task Management](https://www.notion.so/2ce0795a035381999f76f6e2e6468800)
- **Tasks Database**: 63 tasks across 8 phases with Status, Priority, and Estimated Hours

When working on this project:

- Check Notion for current phase and task priorities
- Update task status in Notion when completing work
- Reference the phase breakdown for implementation order

The CLAUDE.md file contains technical specifications and coding standards.
The Notion page contains project management, task tracking, and progress.

---

## 14) Notes for future (optional)

- Add Activities module (tasks/RDV) if required later
- Add export and reporting
- Add soft disable user and lead reassignment tools
- Add full-text search and saved filters
- Complete privacy compliance and data encryption (RGPD/GDPR, encrypt sensitive fields at rest)

---

## 15) Design System (MaterialM Template - MANDATORY)

All UI components MUST be copied/inspired from the MaterialM Next.js Admin Template.

### Design Source Location

- **Template Path**: `/design/MaterialM-nextjs-admin-template-main/`
- **Main Package**: `packages/main/` (use this as primary reference)
- **Components**: `packages/main/src/app/components/`

### Required UI Libraries (match template)

- Flowbite React - Primary component library
- shadcn/ui (Radix UI) - Advanced components (Dialog, Dropdown, Tabs)
- Tailwind CSS - Styling
- Tabler Icons - Icon set (`@tabler/icons-react`)
- TanStack React Table - Data tables
- React Hook Form + Zod - Form handling
- ApexCharts - Charts and visualizations

### Component Reference Paths

| Need | Use Template Path |
|------|-------------------|
| Data tables (leads list) | `components/react-tables/pagination/` |
| Forms | `components/form-components/` |
| Cards/Containers | `components/shared/CardBox.tsx` |
| Modals/Dialogs | `components/shadcn-ui/Dialog/` |
| Dropdowns | `components/shadcn-ui/Dropdown/` |
| Sidebar navigation | `components/ui-components/Sidebar/` |
| Badges/Status | `components/shadcn-ui/Badge/` |
| Dashboard widgets | `components/dashboards/crm/` |
| Charts | `components/charts/` |

### Design Rules (MUST follow)

1. **Never create custom UI** - Always copy/adapt from template first
2. **Use CardBox wrapper** - All page sections use `CardBox` component
3. **Follow Tailwind classes** - Use template's class patterns exactly
4. **Match color palette** - Use CSS variables from template (primary, secondary, success, warning, error)
5. **Use Tabler Icons** - Import from `@tabler/icons-react`
6. **Table component** - Use TanStack React Table with template patterns
7. **Form validation** - Use React Hook Form + Zod (template pattern)

### Color Palette (CSS Variables)

**Theme Colors:**
- Primary: `--color-primary` (#00A1FF), `--color-secondary` (#8965E5)
- Status: `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- Light variants: `--color-lightprimary`, `--color-lightsuccess`, etc.

**Neutral Colors (Zinc-based palette):**
| Variable | Light Mode | Dark Mode | Use For |
|----------|------------|-----------|---------|
| `--color-dark` | #18181b | - | Base dark color, card bg in dark |
| `--color-lightgray` | #fafafa | #27272a | Page background |
| `--color-surface` | #f4f4f5 | #27272a | Content surface |
| `--color-border` | #e4e4e7 | #3f3f46 | Borders |
| `--color-darkborder` | #3f3f46 | - | Dark mode borders |
| `--color-darklink` | #71717a | #a1a1aa | Muted text |

**Design Principles:**
- Light mode: Gray background (#fafafa) with white cards for contrast
- Dark mode: Neutral grays (Zinc) instead of blue-tinted colors
- Cards use `bg-white dark:bg-dark` with subtle borders

### Pre-built CSS Classes (globals.css) - USE THESE FIRST

The `app/globals.css` contains pre-built utility classes. **Always use these before writing inline Tailwind.**

#### Text & Colors
| Class | Use For |
|-------|---------|
| `.text-ld` | Dark/light adaptive text color |
| `.text-primary-ld` | Text that turns primary on hover |
| `.border-ld` | Dark/light adaptive border |
| `.bg-hover` | Background highlight on hover |

#### Cards & Titles
| Class | Use For |
|-------|---------|
| `.card-title` | Card heading (18px, semibold) |
| `.card-subtitle` | Card subheading (14px, medium) |

#### Form Controls
| Class | Use For |
|-------|---------|
| `.form-control` | Wrapper for input with border |
| `.form-control-input` | Standalone styled input |
| `.form-control-rounded` | Pill-shaped input |
| `.select-md` | Styled select dropdown |
| `.checkbox` | Styled checkbox |

#### Buttons
| Class | Use For |
|-------|---------|
| `.ui-button` | Primary action button (rounded pill) |
| `.ui-button-small` | Smaller action button |
| `.btn-circle` | Round icon button (32px) |
| `.btn-circle-hover` | Round icon button with hover effect |
| `.btn-primary`, `.btn-success`, etc. | Colored buttons with hover states |

#### Dropdowns
| Class | Use For |
|-------|---------|
| `.dropdown` | Dropdown container with shadow |
| `.ui-dropdown` | Styled dropdown menu |
| `.ui-dropdown-item` | Dropdown menu item |
| `.ui-dropdown-animation` | Dropdown animation |

#### Badges (Status indicators)
| Class | Use For |
|-------|---------|
| `.badge-primary`, `.badge-secondary` | Light background badges |
| `.badge-success`, `.badge-warning`, `.badge-error`, `.badge-info` | Status badges |
| `.badge-solid-*` | Solid background variants |

#### Layout
| Class | Use For |
|-------|---------|
| `.container` | Centered container (1200px max) |
| `.left-part` | Sidebar panel (320px) |
| `.h-n80` | Full height minus header |

### DRY Principle - Add Reusable Classes to globals.css

**When you find yourself repeating the same Tailwind pattern 3+ times, ADD IT TO globals.css.**

Example workflow:
```css
/* BAD: Repeating the same pattern everywhere */
<div className="flex items-center gap-2 text-sm text-darklink">
<div className="flex items-center gap-2 text-sm text-darklink">
<div className="flex items-center gap-2 text-sm text-darklink">

/* GOOD: Add to globals.css */
.meta-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-darklink);
}

/* Then use */
<div className="meta-text">
```

**Rules for adding new classes:**
1. Must be used in 3+ places
2. Use CSS variables for colors (not hardcoded)
3. Support dark mode with `.dark` prefix
4. Add comment describing purpose
5. Follow existing naming patterns (`.ui-*`, `.form-*`, `.badge-*`)

### Typography

- Font: Inter (Google Fonts)
- Headings: Use template's heading classes
- Body: text-sm (14px), text-base (16px)

### Layout Pattern

```tsx
// Page layout pattern (from template)
import CardBox from '@/components/shared/CardBox';

export default function PageName() {
  return (
    <CardBox>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">Page Title</h4>
        {/* Actions */}
      </div>
      {/* Content */}
    </CardBox>
  );
}
```

### Component Copy Strategy

When building UI:

1. Find the component in `design/.../packages/main/src/app/components/`
2. Copy to `/src/shared/` or `/src/modules/<domain>/ui/`
3. Adapt for CRM needs (French labels, Supabase data binding)
4. Remove unused features from copied component

### Before Building Any UI

1. Check if template has a similar component
2. Copy the component structure
3. Adapt for CRM needs (French labels, data binding)
4. Maintain template's styling patterns

---

## 16) Shared Utilities & DRY Components

The codebase follows strict DRY (Don't Repeat Yourself) principles. Always use these shared utilities instead of duplicating code.

### Shared UI Components (`modules/shared/`)

Import from `@/modules/shared`:

#### Core UI Components

| Component | Purpose | Usage |
|-----------|---------|-------|
| `Button` | Universal button (from `@/components/ui/button`) | `<Button variant="primary" size="sm">Label</Button>` |
| `Modal` | Reusable modal with escape/scroll lock | `<Modal isOpen={isOpen} onClose={close} title="Title">{children}</Modal>` |
| `CardBox` | Card container wrapper | `<CardBox>content</CardBox>` |
| `Spinner` | Loading spinner | `<Spinner size="sm" />` |
| `PageHeader` | Page title with breadcrumb | `<PageHeader title="Leads" />` |

#### Form Components

| Component | Purpose | Usage |
|-----------|---------|-------|
| `FormField` | Input with label + error message | `<FormField label="Nom" error={errors.name?.message} {...register('name')} />` |
| `FormPasswordField` | Password field with label + error | `<FormPasswordField label="Mot de passe" error={errors.password?.message} {...register('password')} />` |
| `FormTextarea` | Textarea field with label + error | `<FormTextarea label="Notes" error={errors.notes?.message} {...register('notes')} />` |
| `FormSelect` | Native select (simple cases only) | `<FormSelect label="Rôle" options={ROLE_OPTIONS} {...register('role')} />` |
| `FormSelectDropdown` | **Custom styled dropdown (PREFERRED)** | Use with `Controller` from RHF - see example below |
| `FormAlert` | Alert box (error/success/warning/info) | `<FormAlert type="error" message={error} />` |
| `FormErrorAlert` | Conditional error alert | `<FormErrorAlert error={error} />` |
| `FormSuccessAlert` | Conditional success alert | `<FormSuccessAlert show={success} message="Saved!" />` |
| `FormActions` | Submit/cancel button row | `<FormActions isPending={isPending} submitLabel="Save" onCancel={close} />` |
| `PasswordInput` | Password input with show/hide toggle | `<PasswordInput {...register('password')} error={!!errors.password} />` |

#### Dropdown & Selection Components

| Component | Purpose | Usage |
|-----------|---------|-------|
| `DropdownMenu` | Custom dropdown menu (click to open) | `<DropdownMenu trigger={...}><DropdownMenuContent>...</DropdownMenuContent></DropdownMenu>` |
| `DropdownMenuItem` | Dropdown menu item | `<DropdownMenuItem onClick={...}>Label</DropdownMenuItem>` |
| `DropdownMenuDivider` | Dropdown separator line | `<DropdownMenuDivider />` |
| `Select` | Styled native select (non-form) | `<Select options={opts} value={v} onChange={fn} />` |
| `InlineSelect` | Compact inline select | `<InlineSelect options={opts} value={v} onChange={fn} />` |

#### Table & List Components

| Component | Purpose | Usage |
|-----------|---------|-------|
| `TableSkeleton` | Generic table skeleton loader | `<TableSkeleton headerColumns={['w-32', 'w-28']} rowCount={5} rowColumns={['w-40', 'w-24']} />` |
| `TableEmptyState` | Empty state row for tables | `<TableEmptyState colSpan={columns.length} message="Aucun résultat" />` |
| `Pagination` | Universal pagination controls | `<Pagination total={100} page={1} pageSize={25} totalPages={4} onPageChange={fn} />` |
| `SearchInput` | Debounced search input | `<SearchInput value={q} onChange={setQ} placeholder="Rechercher..." />` |
| `EmptyState` | Empty state display | `<EmptyState icon={IconInbox} title="Aucun résultat" />` |

#### Toast System

| Component | Purpose | Usage |
|-----------|---------|-------|
| `useToast` | Toast notifications hook | `const { toast } = useToast(); toast.success('Message');` |
| `ToastProvider` | Toast context provider | Wrap app in `<ToastProvider>` |

#### Error Boundaries (`react-error-boundary`)

Component-level error isolation. One widget fails, others keep working.

| Component | Purpose | Usage |
|-----------|---------|-------|
| `ErrorBoundary` | Catches render errors in children | `<ErrorBoundary FallbackComponent={ErrorFallback}>...</ErrorBoundary>` |
| `ErrorFallback` | Default error UI with retry (French) | `<ErrorBoundary FallbackComponent={ErrorFallback}>` |
| `SectionErrorFallback` | Compact error UI for cards/sections | `<ErrorBoundary FallbackComponent={SectionErrorFallback}>` |
| `useErrorBoundary` | Catch async/event errors | `const { showBoundary } = useErrorBoundary();` |

**Pattern: Wrap Suspense with ErrorBoundary**
```tsx
import { ErrorBoundary, SectionErrorFallback } from '@/modules/shared';

<ErrorBoundary FallbackComponent={SectionErrorFallback}>
  <Suspense fallback={<Skeleton />}>
    <DataSection />
  </Suspense>
</ErrorBoundary>
```

**Pattern: Catch async errors with hook**
```tsx
import { useErrorBoundary } from '@/modules/shared';

function MyComponent() {
  const { showBoundary } = useErrorBoundary();

  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      showBoundary(error); // Shows in nearest ErrorBoundary
    }
  };
}
```

**When to use:**
- Wrap dashboard sections (Suspense + ErrorBoundary)
- Wrap complex components (tables, kanban, charts)
- Wrap modal content (not the modal shell)
- Use `useErrorBoundary` for async operations that might crash

### Shared Hooks (`modules/shared/hooks/`)

| Hook | Purpose | Returns |
|------|---------|---------|
| `useFormState` | Form state management | `{ isPending, startTransition, error, setError, success, setSuccess, resetAll, handleFormSuccess }` |
| `useModal` | Modal open/close state | `{ isOpen, data, open, close }` |

### Form CSS Classes (`globals.css`)

| Class | Purpose |
|-------|---------|
| `.form-label` | Form field labels |
| `.form-error` | Inline validation error text |
| `.form-warning` | Warning hint text |
| `.alert-error` | Error message box |
| `.alert-success` | Success message box |
| `.alert-warning` | Warning message box |
| `.alert-info` | Info message box |
| `.form-actions` | Form button row with border-top |
| `.form-actions-plain` | Form button row without border |
| `.btn-primary-action` | Primary submit button |
| `.btn-secondary-action` | Secondary/cancel button |
| `.profile-label` | Small uppercase metadata label |
| `.card-header-icon` | Card header with icon |

### Utility Libraries (`lib/`)

#### Validation Helpers (`lib/validation.ts`)

```typescript
import { extractValidationError, validateWithSchema, passwordSchema, displayNameSchema } from '@/lib/validation';

// Extract first error from Zod result
const error = extractValidationError(result, 'Default message');

// Validate with standardized result
const { success, data, error } = validateWithSchema(schema, input);

// Reusable schemas
passwordSchema    // min 6 chars, max 100
displayNameSchema // min 2 chars, max 100
emailSchema       // optional email validation
roleEnum          // z.enum(['admin', 'sales'])
```

#### Error Handling (`lib/errors.ts`)

```typescript
import { getErrorMessage, logActionError, actionSuccess, actionError, FR_MESSAGES } from '@/lib/errors';

// Extract message from unknown error
const message = getErrorMessage(error);

// Log with context
logActionError('createUser', error);

// Standardized action results
return actionSuccess(data);
return actionError(FR_MESSAGES.UNAUTHORIZED);

// French error messages
FR_MESSAGES.UNAUTHENTICATED  // 'Non authentifié'
FR_MESSAGES.SESSION_EXPIRED  // 'Session expirée'
FR_MESSAGES.UNAUTHORIZED     // "Vous n'avez pas accès..."
FR_MESSAGES.INVALID_DATA     // 'Données invalides'
FR_MESSAGES.NOT_FOUND        // 'Ressource non trouvée'
```

#### Redis Caching (`lib/cache/`)

```typescript
import { getCached, invalidateCache, invalidateDashboardCache, invalidateSalesUsersCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// Cache data with automatic TTL
const data = await getCached(
  CACHE_KEYS.DASHBOARD_ADMIN,      // Cache key
  async () => fetchDashboardData(), // Fetcher function
  CACHE_TTL.DASHBOARD              // TTL in seconds (60)
);

// Invalidate specific cache keys
await invalidateCache(CACHE_KEYS.SALES_USERS);

// Invalidate all dashboard caches (use after lead mutations)
await invalidateDashboardCache();

// Invalidate sales users cache (use after user changes)
await invalidateSalesUsersCache();

// Cache keys
CACHE_KEYS.DASHBOARD_ADMIN        // 'dashboard:admin'
CACHE_KEYS.DASHBOARD_SALES(id)    // 'dashboard:sales:{userId}'
CACHE_KEYS.SALES_USERS            // 'users:sales:list'

// TTL values (seconds)
CACHE_TTL.DASHBOARD  // 60 (1 minute)
CACHE_TTL.SALES_USERS // 300 (5 minutes)
FR_MESSAGES.SUCCESS_UPDATE   // 'Modifications enregistrées'
```

### Centralized Constants (`lib/constants/`)

```typescript
import { ROLES, ROLE_LABELS, ROLE_OPTIONS, getRoleLabel } from '@/lib/constants';
import { LEAD_FIELD_LABELS, getLeadFieldLabel } from '@/lib/constants';
import { LEAD_STATUSES, LEAD_STATUS_COLORS, getStatusColor } from '@/lib/constants';
import { HISTORY_EVENT_LABELS, getHistoryEventLabel } from '@/lib/constants';
import { TOAST } from '@/lib/constants';
import { ICON_SIZE } from '@/lib/constants';
import { TEXTAREA_ROWS } from '@/lib/constants';
import { DISPLAY_LIMITS } from '@/lib/constants';
import { TIMING } from '@/lib/constants';
```

| File | Contents |
|------|----------|
| `roles.ts` | `ROLES`, `ROLE_LABELS`, `ROLE_OPTIONS` |
| `lead-fields.ts` | `LEAD_FIELD_LABELS` (all field display names) |
| `lead-statuses.ts` | `LEAD_STATUSES`, `LEAD_STATUS_COLORS`, `LEAD_STATUS_OPTIONS` |
| `history.ts` | `HISTORY_EVENT_TYPES`, `HISTORY_EVENT_LABELS` |
| `toast-messages.ts` | `TOAST` (all French toast messages) |
| `icon-sizes.ts` | `ICON_SIZE` (XS=14, SM=16, MD=18, LG=20, XL=24, XXL=32) |
| `form-dimensions.ts` | `TEXTAREA_ROWS` (SINGLE_LINE, COMMENT, MEETING_NOTES, etc.) |
| `display-limits.ts` | `DISPLAY_LIMITS` (dashboard widgets, import previews, slicing) |
| `timing.ts` | `TIMING` (form delays, animation durations, debounce values) |

#### Toast Messages (`TOAST`)

```typescript
// Success messages
TOAST.LEAD_DELETED           // 'Lead supprimé'
TOAST.LEAD_TRANSFERRED       // 'Lead transféré avec succès'
TOAST.COMMENT_ADDED          // 'Commentaire ajouté'
TOAST.MEETING_CREATED        // 'Rendez-vous créé'
TOAST.USER_DELETED           // 'Utilisateur supprimé'
TOAST.BANNER_CREATED         // 'Annonce créée avec succès'

// Pluralization helpers
TOAST.LEADS_ASSIGNED(5)      // '5 leads assignés'
TOAST.LEADS_PARTIAL_ASSIGNED(3, 5) // '3/5 leads assignés'

// Error messages
TOAST.GENERIC_ERROR          // 'Une erreur est survenue'
TOAST.ERROR_DELETE           // 'Erreur lors de la suppression'
TOAST.PAYMENT_ERROR          // 'Une erreur est survenue. Veuillez réessayer.'
```

#### Textarea Rows (`TEXTAREA_ROWS`)

```typescript
TEXTAREA_ROWS.SINGLE_LINE    // 1 - ticket reply, kanban quick comment
TEXTAREA_ROWS.COMMENT        // 2 - lead comments
TEXTAREA_ROWS.MEETING_NOTES  // 3 - meeting form notes
TEXTAREA_ROWS.LEAD_NOTES     // 4 - lead edit form notes
TEXTAREA_ROWS.BANNER_CONTENT // 4 - banner messages
TEXTAREA_ROWS.NOTE_CONTENT   // 6 - sticky notes
TEXTAREA_ROWS.SUPPORT_TICKET // 6 - support ticket description
```

#### Display Limits (`DISPLAY_LIMITS`)

```typescript
// Dashboard widgets
DISPLAY_LIMITS.LEADS_STATS_CARD      // 6
DISPLAY_LIMITS.TOP_PERFORMERS        // 5
DISPLAY_LIMITS.RECENT_ACTIVITIES     // 6

// Import/mapping
DISPLAY_LIMITS.SAMPLE_ROWS_PREVIEW   // 5
DISPLAY_LIMITS.MAPPING_SAMPLE_VALUES // 3
DISPLAY_LIMITS.IMPORT_ROWS_PREVIEW   // 30

// Field display
DISPLAY_LIMITS.CHANGED_FIELDS        // 5
DISPLAY_LIMITS.VALUE_SAMPLE_LENGTH   // 50
```

#### Timing Constants (`TIMING`)

```typescript
// Form success delays (milliseconds)
TIMING.SUCCESS_DELAY_DEFAULT   // 1000 - standard form success
TIMING.SUCCESS_DELAY_PASSWORD  // 1500 - password changes
TIMING.SUCCESS_DELAY_QUICK     // 500  - quick actions (meetings)

// Animation delays
TIMING.UPLOAD_PROGRESS_CLEAR   // 500  - clear upload progress
TIMING.KANBAN_DROP_ANIMATION   // 250  - kanban card drop
TIMING.COLUMN_PULSE_ANIMATION  // 300  - column count change pulse
TIMING.FOCUS_DELAY             // 0    - input focus delay

// Debounce
TIMING.SEARCH_DEBOUNCE         // 300  - search input debounce
```

### Lead History Helpers (`modules/leads/lib/history-helpers.ts`)

```typescript
import {
  createHistoryEntry,
  createStatusChangeHistory,
  createAssignmentHistory,
  createUpdateHistory,
  createCommentHistory
} from '@/modules/leads/lib/history-helpers';

// Create any history entry
await createHistoryEntry(supabase, {
  lead_id, actor_id, event_type,
  before_data, after_data, metadata
});

// Convenience helpers
await createStatusChangeHistory(supabase, leadId, actorId, oldStatus, newStatus);
await createAssignmentHistory(supabase, leadId, actorId, oldAssignee, newAssignee);
await createUpdateHistory(supabase, leadId, actorId, beforeData, afterData);
await createCommentHistory(supabase, leadId, actorId, commentId, preview);
```

### Example: Refactored Form Component

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconCheck } from '@tabler/icons-react';
import {
  FormField,
  FormErrorAlert,
  FormSuccessAlert,
  FormActions,
  useFormState,
} from '@/modules/shared';

export function MyForm({ onSuccess, onCancel }) {
  const { isPending, startTransition, error, setError, success, handleFormSuccess, resetAll } =
    useFormState();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(mySchema),
  });

  const onSubmit = (data) => {
    resetAll();
    startTransition(async () => {
      const result = await myAction(data);
      if (result.error) {
        setError(result.error);
      } else {
        handleFormSuccess({ onSuccess, onSuccessDelay: 1000 });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Nom"
        error={errors.name?.message}
        {...register('name')}
      />

      <FormErrorAlert error={error} />
      <FormSuccessAlert show={success} message="Enregistré avec succès" />

      <FormActions
        isPending={isPending}
        submitLabel="Enregistrer"
        submitIcon={<IconCheck size={18} />}
        onCancel={onCancel}
      />
    </form>
  );
}
```

### DRY Rules (MUST follow)

#### Component Usage Rules (STRICT)

1. **NEVER use raw `<button>`** - Always use `Button` from `@/components/ui/button`
2. **NEVER use native `<select>` in forms** - Use `FormSelectDropdown` with RHF `Controller`
3. **NEVER use native `<select>` in UI** - Use `DropdownMenu` for custom dropdowns
4. **NEVER create custom dropdown logic** - Use `DropdownMenu` component
5. **NEVER create custom modal logic** - Use `Modal` component
6. **NEVER create custom pagination** - Use `Pagination` component
7. **NEVER create custom search input** - Use `SearchInput` component
8. **NEVER create custom toast system** - Use `useToast` hook
9. **NEVER create custom empty states** - Use `EmptyState` component

#### Form Pattern Rules

10. **Never duplicate form state** - Use `useFormState()` hook
11. **Never duplicate alerts** - Use `FormErrorAlert` / `FormSuccessAlert`
12. **Never duplicate form buttons** - Use `FormActions` component
13. **Never duplicate password field patterns** - Use `FormPasswordField` component
14. **Never duplicate textarea field patterns** - Use `FormTextarea` component
15. **Never duplicate form success handling** - Use `handleFormSuccess` from `useFormState` hook

#### Data & Constants Rules

16. **Never hardcode French messages** - Use `FR_MESSAGES` from `lib/errors.ts`
17. **Never duplicate constants** - Import from `lib/constants/`
18. **Never duplicate history creation** - Use history helpers
19. **Never duplicate table skeleton patterns** - Use `TableSkeleton` component
20. **Never duplicate table empty states** - Use `TableEmptyState` component

#### Error Boundary Rules

21. **Always wrap Suspense with ErrorBoundary** - Prevents streaming failures from crashing
22. **Use `SectionErrorFallback` for dashboard/cards** - Compact error UI
23. **Use `ErrorFallback` for major sections** - Full error UI with message
24. **Use `useErrorBoundary` for async errors** - Catches errors that boundaries can't (event handlers, async)

### FormSelectDropdown Usage (with React Hook Form)

**IMPORTANT**: For form selects, use `FormSelectDropdown` with RHF `Controller`:

```tsx
import { Controller } from 'react-hook-form';
import { FormSelectDropdown } from '@/modules/shared';

// In your form:
<Controller
  name="role"
  control={control}
  render={({ field }) => (
    <FormSelectDropdown
      label="Rôle"
      options={ROLE_OPTIONS}
      value={field.value}
      onChange={field.onChange}
      error={errors.role?.message}
    />
  )}
/>
```

### Creating New Reusable Components

**When to create a new shared component:**

1. You see the same UI pattern repeated 2+ times
2. You're about to copy-paste UI code from another file
3. The component has clear, reusable props interface
4. It follows existing patterns in `modules/shared/`

**Process for creating new shared components:**

1. Create in `modules/shared/ui/` with clear name
2. Export from `modules/shared/index.ts`
3. Document in this file (CLAUDE.md) in the Shared UI Components table
4. Update all existing usages to use the new component

**Before writing ANY UI code, check:**

1. Does a shared component exist? → Use it
2. Is this pattern repeated elsewhere? → Create shared component first
3. Am I using native HTML elements? → Check for shared alternatives

---

## 17) Development Workflow (Two-Tier: Local + Preview)

### Overview

Development uses a **two-tier workflow**:

| Tier | Environment | Use For |
|------|-------------|---------|
| **Local** | `supabase start` (Docker) | Day-to-day development, instant feedback |
| **Preview** | Supabase Branch (auto on PR) | Integration testing, team review |

### Tier 1: Local Development (Recommended for daily work)

Run a complete Supabase stack locally in Docker:

```bash
# Start local Supabase (PostgreSQL + Auth + Storage + Edge Functions)
npx supabase start

# Local dashboard: http://localhost:54323
# Local API:       http://localhost:54321
# Local DB:        postgresql://postgres:postgres@localhost:54322/postgres

# Start app against local Supabase
npm run dev
```

**Benefits:**
- ✅ Instant feedback (no network latency)
- ✅ Works offline
- ✅ Free (no quota usage)
- ✅ Completely isolated - break things without fear
- ✅ Migrations applied automatically from `supabase/migrations/`
- ✅ Seed data applied from `supabase/seed.sql`

**Local Test Credentials:**

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | 123456 |
| Sales | marie | 123456 |
| Sales | jean | 123456 |
| Sales | sophie | 123456 |

**Local Commands:**
```bash
npx supabase start     # Start local stack
npx supabase stop      # Stop local stack
npx supabase db reset  # Reset DB + reapply migrations + seed
npx supabase status    # Show local service URLs
```

### Tier 2: Preview Branches (Auto on PR)

When you open a PR, everything happens automatically:

1. **Supabase** creates a preview branch (forks from production)
2. **Migrations** in your PR are applied to the preview branch
3. **Seed data** runs on preview branch
4. **Vercel** deploys preview with auto-synced credentials
5. **Merge** → migrations apply to production, preview branch deleted

| Environment | Supabase | Git Branch | Vercel |
|-------------|----------|------------|--------|
| **Production** | `owwyxrxojltmupqrvqcp` | `main` | Production |
| **Preview** | Auto-created | feature branches | Preview (auto-synced) |

### Daily Workflow

```bash
# Morning setup
git pull origin main
npx supabase start      # Local DB running
npm run dev             # App at http://localhost:3000

# Develop your feature
# - Edit code
# - Create migrations with: npx supabase migration new my_migration
# - Test locally (full isolation)

# Ready for review
git push -u origin feature/my-feature
gh pr create

# Automatic:
# → Supabase creates preview branch
# → Vercel deploys with correct credentials
# → Test on Vercel preview URL

# Merge PR
# → Migrations apply to production
# → Preview branch auto-deleted
```

### Creating Migrations

```bash
# Create new migration file
npx supabase migration new add_new_column

# Edit the file in supabase/migrations/XXXX_add_new_column.sql

# Test locally
npx supabase db reset   # Reapply all migrations

# Push with PR
git add supabase/migrations/
git commit -m "feat: add new column"
git push
```

### Safety Rules (MUST follow)

1. **NEVER** modify production directly - always use PRs
2. **ALWAYS** wait for Supabase Preview status check before merging
3. **NEVER** run DELETE/DROP/TRUNCATE on production without explicit user confirmation
4. **ALWAYS** verify `project_id` before executing SQL via MCP tools:
   - Production: `owwyxrxojltmupqrvqcp`
5. **NEVER** put real/sensitive data in `supabase/seed.sql`

### GitHub Branch Protection

The `main` branch has protection rules enabled:
- Requires pull request before merging
- Requires status checks to pass (build + Supabase Preview)
- No direct pushes allowed

### Configuration Files

| File | Purpose |
|------|---------|
| `supabase/config.toml` | Project config (auth, storage, Edge Functions) |
| `supabase/seed.sql` | Sample data for local + preview branches |
| `supabase/migrations/*.sql` | Database migrations |
| `supabase/functions/` | Edge Functions |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Local won't start | `docker ps` to check Docker, `npx supabase stop --no-backup` to reset |
| Migration failed | Check Supabase dashboard → Branches → View logs |
| Seed data missing | `npx supabase db reset` locally, or delete/recreate PR branch |
| Schema drift | Rebase your feature branch from main |
| Wrong credentials | Vercel auto-syncs on PR open, wait 1-2 min |

### Scripts for Data Management

| Script | Purpose |
|--------|---------|
| `scripts/clear-production-leads.ts` | Clear all leads (requires --confirm) |
| `scripts/import-all-leads.ts` | Import XLSX + CSV leads |

---

End of CLAUDE.md
