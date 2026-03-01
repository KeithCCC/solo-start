# DealFlow Lite MVP Build Plan (Local-First)

## Approach
Build a recruiter-ready local product first, then migrate to SaaS.

Principles:
- No auth in early phases.
- SQLite for fast iteration.
- Keep domain/repository boundaries so Supabase migration is low-risk.

## Assumptions
- Team: solo builder.
- Initial runtime: local app only.
- Initial storage: SQLite.
- Later target: Vercel + Supabase (Postgres + Google OAuth).
- Goal: modern, working product demo first; infrastructure second.

## Phase 0 - Local Foundation (Day 1)
Deliverables:
- Initialize Next.js app and UI baseline.
- Add SQLite with migration tooling.
- Define schema for local DB aligned with MVP entities.
- Create repository interfaces for data access:
  - `ContactRepository`
  - `CompanyRepository`
  - `DealRepository`
  - `TaskRepository`
  - `ActivityRepository`
  - `EmailRepository`
- Implement SQLite repository adapters.
- Add app-level "local user" context (single fixed user id).

Exit criteria:
- App boots with seeded local data.
- All reads/writes go through repositories, not direct SQL in UI code.

## Phase 1 - Core CRM (Days 2-4)
Deliverables:
- Contacts list/detail/create/edit.
- Companies list/create/edit.
- Contact-company linking.
- Tags and lifecycle stage support.
- Activity timeline on contact detail.

Exit criteria:
- User can create a contact, link a company, and add activities.
- Timeline ordering and CRUD behavior are stable.

## Phase 2 - Pipeline and Tasks (Days 5-7)
Deliverables:
- Fixed 4-stage Kanban board.
- Drag-and-drop stage updates.
- Deal CRUD with amount/date/status.
- Task CRUD with types:
  - `daily_todo`
  - `customer_engagement`
  - `project_task`
- Today and Upcoming task views.

Exit criteria:
- Kanban changes persist correctly.
- Task filters and due status behave as expected in JST.

## Phase 3 - Mock Email + Dashboard (Days 8-9)
Deliverables:
- 3 default email templates.
- Mock send from contact detail.
- Email send logs + mirrored activity records.
- Dashboard cards:
  - Today tasks
  - Pipeline total (open deals)
  - Recent touch

Exit criteria:
- Mock send flow is end-to-end functional.
- Dashboard values match underlying local DB state.

## Phase 4 - Import + Search + Japan Fit (Days 10-11)
Deliverables:
- CSV import for contacts and companies.
- Keyword search for name/organization/project/deal.
- Japan-focused defaults:
  - Japanese UI copy
  - JST handling
  - JPY formatting
  - full-width/half-width-friendly matching
- Optional lightweight semantic search spike (only if schedule allows).

Exit criteria:
- Realistic CSV files import with validation feedback.
- Search works with Japanese and mixed-language inputs.

## Phase 5 - Recruiter Demo Polish (Days 12-13)
Deliverables:
- Visual polish and responsive tuning.
- Loading/empty/error states.
- Lightweight local analytics events:
  - `create_contact`
  - `create_deal`
  - `move_deal_stage`
  - `create_task`
  - `complete_task`
  - `send_mock_email`
  - `import_csv_contacts`
- Demo seed script + scripted walkthrough.

Exit criteria:
- Local demo runs smoothly in 2-3 minutes.
- Product looks modern and intentional on desktop/mobile.

## Phase 6 - SaaS Migration (Days 14-16)
Deliverables:
- Introduce Supabase Postgres schema and migration path from SQLite.
- Add Google auth and session handling.
- Replace local user context with authenticated user id.
- Implement Supabase repository adapters.
- Add RLS-aligned query patterns.
- Deploy to Vercel preview and production.

Exit criteria:
- Same core features work with Supabase backend.
- Google login flow is stable in local + production.
- No UI-level rewrite required due to repository abstraction.

## Migration Guardrails (Do These From Day 1)
- Use UUID ids in SQLite to match Postgres.
- Keep enum values identical to Postgres plan.
- Store timestamps in ISO-8601 UTC format.
- Never couple UI to SQLite-specific query syntax.
- Keep search as pluggable strategy:
  - local keyword search now
  - Postgres FTS/vector later

## Testing Checklist (Minimum)
- Local mode:
  - CRUD for Contact/Company/Deal/Task/Activity.
  - Kanban persistence.
  - CSV import validation.
  - Dashboard correctness.
- Migration mode:
  - Repository adapter swap passes same tests.
  - Google auth session maps to owner-scoped data.
  - RLS prevents cross-user access.

## Risks and Mitigation
- Risk: local-first drift from production schema.
  - Mitigation: mirror ids/enums/field names from final schema now.
- Risk: migration adds hidden complexity.
  - Mitigation: strict repository contracts and adapter tests.
- Risk: polish competes with migration time.
  - Mitigation: lock feature scope before Phase 6.
