# DealFlow Lite MVP Build Plan

## Assumptions
- Deployment target: Vercel.
- Database/auth target: Supabase (Postgres + Google OAuth).
- Team: solo builder.
- Goal: recruiter-ready demo quality over enterprise depth.

## Phase 0 - Foundation (Day 1)
Deliverables:
- Initialize Next.js app and design system baseline.
- Connect Supabase project and environment variables.
- Apply `supabase/schema.sql`.
- Implement Google sign-in and sign-out.
- Auto-provision `profiles` row after first login.

Exit criteria:
- User can sign in with Google and land on app shell.
- RLS works; user only sees own data.

## Phase 1 - Core CRM (Days 2-4)
Deliverables:
- Contacts list/detail/create/edit.
- Companies list/create/edit.
- Contact-company linking.
- Tags support and lifecycle stage field.
- Activity timeline on contact detail.

Exit criteria:
- User can create a contact, attach a company, and add notes/activity.
- Contact timeline renders newest-first correctly.

## Phase 2 - Pipeline and Tasks (Days 5-7)
Deliverables:
- Kanban pipeline board with fixed 4 stages.
- Drag-and-drop stage transitions.
- Deal create/edit with amount, expected close date, status.
- Task create/edit with types:
  - `daily_todo`
  - `customer_engagement`
  - `project_task`
- Task views: Today and Upcoming.

Exit criteria:
- Deals move across columns and persist.
- Today/Upcoming filters and done status behave correctly.

## Phase 3 - Mock Email + Dashboard (Days 8-9)
Deliverables:
- 3 default email templates seeded per user.
- Send mock email from contact page.
- Persist email log + mirrored activity entry.
- Dashboard cards:
  - Today tasks
  - Pipeline total (open deals)
  - Recent touch

Exit criteria:
- Mock send adds records and appears in timeline.
- Dashboard metrics match DB state.

## Phase 4 - Import + Search + Japan Fit (Days 10-11)
Deliverables:
- CSV import for contacts and companies (client mapping + validation).
- Keyword search across contact/company/deal/project fields.
- Lightweight semantic search path using embedding columns (optional fallback to keyword-only if time constrained).
- Japan localization baseline:
  - Japanese UI strings
  - JST date handling
  - JPY formatting
  - full-width/half-width-friendly matching

Exit criteria:
- CSV import works with realistic sample files.
- Search can find records via Japanese/English mixed input.

## Phase 5 - Polish for Recruiter Demo (Days 12-13)
Deliverables:
- Visual polish pass (spacing, type scale, responsive behavior).
- Loading/empty/error states for core pages.
- Lightweight analytics event logging:
  - `sign_in_google`
  - `import_csv_contacts`
  - `create_contact`
  - `create_deal`
  - `move_deal_stage`
  - `create_task`
  - `complete_task`
  - `send_mock_email`
- Seed/demo data script.

Exit criteria:
- App is presentable on desktop and mobile.
- Complete demo scenario runs end-to-end without manual fixes.

## Phase 6 - Launch and Handoff (Day 14)
Deliverables:
- Production deploy on Vercel.
- README with setup and demo flow.
- Short recruiter demo script (2-3 minutes).
- Known limitations section documented.

Exit criteria:
- Publicly accessible deployment.
- Clear instructions for interviewer/recruiter walkthrough.

## Testing Checklist (Minimum)
- Auth:
  - New user profile creation on first sign-in.
  - RLS isolation verified with two users.
- CRM:
  - CRUD for Contact/Company/Deal/Task/Activity.
- Pipeline:
  - Drag-and-drop updates deal stage reliably.
- Tasks:
  - Today and Upcoming logic across timezone boundaries (JST).
- Import:
  - CSV malformed rows handled with user-facing errors.
- Search:
  - Name/company/deal/project keyword coverage works.
- Dashboard:
  - Counts and totals match underlying data.

## Risk and Mitigation
- Risk: Vector search adds complexity.
  - Mitigation: ship keyword search first; keep vector path optional.
- Risk: Kanban DnD edge-case bugs.
  - Mitigation: stage transitions are fixed and server-validated.
- Risk: UI polish takes longer than expected.
  - Mitigation: freeze scope and prioritize demo path screens first.

