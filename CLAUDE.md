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

- Admin can read/write everything.
- Sales can only read/write:
  - leads where `assigned_to = auth.uid()`
  - comments/history linked to those leads

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

### Supabase Edge Functions (server-only)

- `SUPABASE_SERVICE_ROLE_KEY` (in Supabase secrets)

Never put service role key in client-side code.

### Supabase Project Info (for Claude MCP)

- **Project ID**: `owwyxrxojltmupqrvqcp`
- **Project Name**: `crm-medya`
- **Region**: `eu-central-1`
- **Database Host**: `db.owwyxrxojltmupqrvqcp.supabase.co`

---

## 10.1) Supabase MCP Tools (Claude Integration)

Claude has access to Supabase via MCP (Model Context Protocol). Use these tools for database operations:

### Available Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| `mcp__supabase__list_tables` | List all tables in the database | Check schema |
| `mcp__supabase__execute_sql` | Run SELECT queries (read-only) | Query data |
| `mcp__supabase__apply_migration` | Apply DDL changes (CREATE, ALTER) | Schema changes |
| `mcp__supabase__list_migrations` | List applied migrations | Check migration history |
| `mcp__supabase__get_advisors` | Security/performance recommendations | Audit RLS policies |
| `mcp__supabase__generate_typescript_types` | Generate TypeScript types | Update `db/types.ts` |

### Usage Examples

```
# List all tables
mcp__supabase__list_tables(project_id="owwyxrxojltmupqrvqcp")

# Run a query
mcp__supabase__execute_sql(
  project_id="owwyxrxojltmupqrvqcp",
  query="SELECT * FROM subscriptions LIMIT 5"
)

# Apply a migration
mcp__supabase__apply_migration(
  project_id="owwyxrxojltmupqrvqcp",
  name="add_new_column",
  query="ALTER TABLE leads ADD COLUMN notes TEXT"
)

# Check security advisors
mcp__supabase__get_advisors(
  project_id="owwyxrxojltmupqrvqcp",
  type="security"
)
```

### Important Notes

- Always use the project ID `owwyxrxojltmupqrvqcp` for this CRM
- Use `apply_migration` for DDL (schema changes), `execute_sql` for DML (data queries)
- Check security advisors after schema changes to verify RLS policies
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
```

| File | Contents |
|------|----------|
| `roles.ts` | `ROLES`, `ROLE_LABELS`, `ROLE_OPTIONS` |
| `lead-fields.ts` | `LEAD_FIELD_LABELS` (all field display names) |
| `lead-statuses.ts` | `LEAD_STATUSES`, `LEAD_STATUS_COLORS`, `LEAD_STATUS_OPTIONS` |
| `history.ts` | `HISTORY_EVENT_TYPES`, `HISTORY_EVENT_LABELS` |

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

End of CLAUDE.md
