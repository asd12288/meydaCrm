# CLAUDE.md — CRM Medya (Next.js 16 + Supabase + Netlify)

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

- Netlify for Next.js frontend
- Supabase hosts DB/Auth/Storage/Functions

### Security constraints (never violate)

- Do NOT store Supabase service role key in Next.js/Netlify environment.
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

### Next.js / Netlify (public + anon key)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Edge Functions (server-only)

- `SUPABASE_SERVICE_ROLE_KEY` (in Supabase secrets)
- Any extra parsing secrets if needed

Never put service role key in Netlify.

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

Netlify local (optional):

- `netlify dev`

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

- **Notion Page**: [CRM Medya - Project Plan & Task Management](https://www.notion.so/2ce0795a035381999f76f6e2e6468800)
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

- Primary: `--color-primary`, `--color-secondary`
- Status: `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- Light variants: `--color-lightprimary`, `--color-lightsuccess`, etc.
- Surface: `--color-surface`, `--color-bordergray`

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

End of CLAUDE.md
