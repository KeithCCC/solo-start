# DealFlow Lite MVP - One-Page PRD (v1)

## 1. Product Summary
DealFlow Lite is a Japan-focused, single-user SaaS CRM for freelancers, entrepreneurs, and solo startup CEOs.  
The MVP must look production-grade and modern so recruiters can evaluate both product quality and execution depth.

Core value:
- Manage contacts, deals, tasks, and activity in one place.
- Keep sales execution visible through a Kanban pipeline.
- Support Japanese business usage from day one.

## 2. Goals and Success Criteria
Primary goal:
- Impress recruiters with a working product that feels real and deployable.

MVP success criteria:
- End-to-end demo flow works with no manual DB editing.
- UI quality is modern, coherent, and mobile-friendly.
- Japan-specific UX details are implemented (JST, JPY, Japanese-friendly search behavior).

## 3. Target Users
- Freelancer in B2B sales/work.
- Entrepreneur running early customer development.
- Solo startup CEO managing contacts and pipeline personally.

## 4. Scope (In)
- SaaS web app only.
- Google login via Supabase Auth.
- Single-tenant usage model (no teams/roles).
- CSV import for contacts and companies.
- CRM entities: Contact, Company, Deal, Task, Activity, EmailTemplate.
- Fixed 4-stage pipeline (Kanban with drag-and-drop).
- Task tracking with simple due status.
- Mock email sending from contact context with activity logging.
- Basic dashboard.
- Lightweight analytics events.

## 5. Scope (Out)
- Role/permission management.
- Workflow automation.
- Lead scoring.
- External API integrations.
- Real email delivery.
- Marketing automation and forms.
- Custom objects.

## 6. Japan-Specific Requirements
- Japanese-first copy in UI text.
- JST as default display timezone.
- JPY formatting for deal amount.
- Search normalization for full-width and half-width variants.
- Basic handling of common Japanese company notation variants (e.g., 株式会社 and (株)).

## 7. Functional Requirements
### Auth
- User signs in with Google OAuth only.
- User profile record is provisioned on first sign-in.

### Contact and Company
- Create, edit, list, and view contacts.
- Link contact to company.
- Tag contacts.
- CSV import contacts and companies.

### Pipeline and Deals
- Deal has title, contact link, stage, amount, expected close date, status.
- Kanban columns are fixed:
  - Lead
  - Qualified
  - Proposal
  - Negotiation
- Drag-and-drop changes stage.
- Pipeline total displays sum of open deal amounts.

### Tasks
- Task types:
  - daily_todo
  - customer_engagement
  - project_task
- Due date and status tracking.
- Today and Upcoming views.
- Simple reminder state:
  - none
  - due_today
  - overdue

### Activities and Email
- Log notes, meetings, and mock email sends.
- Contact timeline displays activity history in descending time order.
- 3 fixed email templates for MVP.

### Search
- Keyword search on:
  - Contact name
  - Company/organization
  - Project text
  - Deal title/notes
- Lightweight vector search support for semantic match.

### Dashboard
- Today Tasks: due today and not done.
- Pipeline Total: sum(amount) where deal status is open.
- Recent Touch: latest activity timestamp per contact.

## 8. Non-Functional Requirements
- Deployed on Vercel.
- Supabase Postgres and Auth.
- Responsive layout for desktop and mobile.
- Fast initial load and smooth Kanban interactions for recruiter demo usage.

## 9. Analytics (Lightweight)
Track only high-value events:
- sign_in_google
- import_csv_contacts
- create_contact
- create_deal
- move_deal_stage
- create_task
- complete_task
- send_mock_email

Store minimal payload to keep implementation lightweight.

## 10. Recruiter Demo Script (Must Pass)
1. Sign in with Google.
2. Import a CSV of contacts.
3. Open contact and create a deal.
4. Move deal across Kanban stages.
5. Create a task due today and mark complete.
6. Send a mock email template from contact view.
7. Confirm timeline + dashboard reflect updates.

