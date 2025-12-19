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

We prefer a module system organization.

Use:

- `/src/modules/<domain>/...` for domain features
- `/src/shared/...` for cross-cutting utilities

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

App Router (`/app`) should stay thin:

- route file renders a View from a module
- minimal glue (auth guard, metadata, etc.)

Example:

- `app/(protected)/leads/page.tsx` -> `return <LeadsListView />`
- `src/modules/leads/views/leads-list-view.tsx`

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

1. Supabase schema + RLS + profiles bootstrapping
2. Auth (login + protected routes + role guard)
3. Leads table (assigned-only for sales; all for admin)
4. Lead detail (edit all fields + comments + history)
5. Admin users screen (create user + reset password)
6. Import v1: CSV end-to-end (upload -> parse -> commit)
7. Import v2: XLSX support + mapping polish
8. Dashboard widgets (history feed + leads by status)

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

End of CLAUDE.md
