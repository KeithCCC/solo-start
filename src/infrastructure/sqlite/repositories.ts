import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type {
  Activity,
  ActivityRepository,
  AnalyticsRepository,
  Company,
  CompanyRepository,
  Contact,
  ContactRepository,
  CreateActivityInput,
  CreateCompanyInput,
  CreateContactInput,
  CreateDealInput,
  CreateTaskInput,
  DashboardRepository,
  DashboardSummary,
  Deal,
  DealRepository,
  DealStage,
  EmailLog,
  EmailRepository,
  EmailTemplate,
  Profile,
  ProfileRepository,
  Repositories,
  SearchQuery,
  SendMockEmailInput,
  Task,
  TaskRepository,
  UUID,
} from "../../domain";

type Row = Record<string, unknown>;

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/株式会社/g, "")
    .replace(/\(株\)/g, "")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function likePattern(keyword?: string): string | null {
  if (!keyword) return null;
  return `%${normalizeSearchText(keyword)}%`;
}

function toCompany(row: Row): Company {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    name: String(row.name),
    industry: row.industry ? String(row.industry) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    searchText: String(row.search_text ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toContact(row: Row): Contact {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    companyId: row.company_id ? String(row.company_id) : null,
    name: String(row.name),
    email: row.email ? String(row.email) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    tags: JSON.parse(String(row.tags_json ?? "[]")),
    lifecycleStage: row.lifecycle_stage ? String(row.lifecycle_stage) : undefined,
    project: row.project ? String(row.project) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    searchText: String(row.search_text ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toDeal(row: Row): Deal {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    contactId: String(row.contact_id),
    title: String(row.title),
    stage: row.stage as Deal["stage"],
    amount: Number(row.amount ?? 0),
    currency: String(row.currency),
    expectedCloseDate: row.expected_close_date ? String(row.expected_close_date) : undefined,
    status: row.status as Deal["status"],
    project: row.project ? String(row.project) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    searchText: String(row.search_text ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toTask(row: Row): Task {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    contactId: row.contact_id ? String(row.contact_id) : null,
    dealId: row.deal_id ? String(row.deal_id) : null,
    type: row.type as Task["type"],
    title: String(row.title),
    dueDate: row.due_date ? String(row.due_date) : undefined,
    status: row.status as Task["status"],
    reminderState: row.reminder_state as Task["reminderState"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toActivity(row: Row): Activity {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    contactId: String(row.contact_id),
    dealId: row.deal_id ? String(row.deal_id) : null,
    type: row.type as Activity["type"],
    content: String(row.content),
    createdAt: String(row.created_at),
  };
}

function toTemplate(row: Row): EmailTemplate {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    title: String(row.title),
    body: String(row.body),
    isSystem: Number(row.is_system ?? 0) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toEmailLog(row: Row): EmailLog {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    contactId: String(row.contact_id),
    templateId: row.template_id ? String(row.template_id) : null,
    subject: String(row.subject),
    body: String(row.body),
    sentAt: String(row.sent_at),
  };
}

function withPagination(sql: string, query?: SearchQuery): string {
  if (!query?.limit) return sql;
  const offset = query.offset ?? 0;
  return `${sql} LIMIT ${query.limit} OFFSET ${offset}`;
}

export function createSqliteRepositories(db: Database.Database): Repositories {
  const profiles: ProfileRepository = {
    async getLocalProfile(): Promise<Profile> {
      const row = db.prepare("SELECT * FROM profiles ORDER BY created_at ASC LIMIT 1").get() as Row | undefined;
      if (!row) throw new Error("No local profile found. Seed profile first.");
      return {
        id: String(row.id),
        displayName: row.display_name ? String(row.display_name) : undefined,
        locale: String(row.locale),
        timezone: String(row.timezone),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      };
    },
    async upsertLocalProfile(patch): Promise<Profile> {
      const existing = db.prepare("SELECT id FROM profiles WHERE id = ?").get(patch.id);
      const ts = nowIso();
      if (existing) {
        db.prepare(
          `UPDATE profiles
           SET display_name = COALESCE(?, display_name),
               locale = COALESCE(?, locale),
               timezone = COALESCE(?, timezone),
               updated_at = ?
           WHERE id = ?`
        ).run(patch.displayName ?? null, patch.locale ?? null, patch.timezone ?? null, ts, patch.id);
      } else {
        db.prepare(
          `INSERT INTO profiles (id, display_name, locale, timezone, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(patch.id, patch.displayName ?? null, patch.locale ?? "ja-JP", patch.timezone ?? "Asia/Tokyo", ts, ts);
      }
      const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(patch.id) as Row;
      return {
        id: String(row.id),
        displayName: row.display_name ? String(row.display_name) : undefined,
        locale: String(row.locale),
        timezone: String(row.timezone),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      };
    },
  };

  const companies: CompanyRepository = {
    async create(input: CreateCompanyInput): Promise<Company> {
      const id = randomUUID();
      const ts = nowIso();
      const searchText = normalizeSearchText(`${input.name} ${input.industry ?? ""} ${input.notes ?? ""}`);
      db.prepare(
        `INSERT INTO companies (id, owner_id, name, industry, notes, search_text, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, input.ownerId, input.name, input.industry ?? null, input.notes ?? null, searchText, ts, ts);
      return (await this.findById(input.ownerId, id)) as Company;
    },
    async update(id, patch): Promise<Company> {
      const current = db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as Row | undefined;
      if (!current) throw new Error("Company not found");
      const nextName = patch.name ?? String(current.name);
      const nextIndustry = patch.industry ?? (current.industry ? String(current.industry) : undefined);
      const nextNotes = patch.notes ?? (current.notes ? String(current.notes) : undefined);
      const searchText = normalizeSearchText(`${nextName} ${nextIndustry ?? ""} ${nextNotes ?? ""}`);
      db.prepare(
        `UPDATE companies
         SET name = ?, industry = ?, notes = ?, search_text = ?, updated_at = ?
         WHERE id = ?`
      ).run(nextName, nextIndustry ?? null, nextNotes ?? null, searchText, nowIso(), id);
      return toCompany(db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as Row);
    },
    async findById(ownerId, id): Promise<Company | null> {
      const row = db.prepare("SELECT * FROM companies WHERE owner_id = ? AND id = ?").get(ownerId, id) as Row | undefined;
      return row ? toCompany(row) : null;
    },
    async list(ownerId, query): Promise<Company[]> {
      const keyword = likePattern(query?.keyword);
      const baseSql = keyword
        ? "SELECT * FROM companies WHERE owner_id = ? AND search_text LIKE ? ORDER BY updated_at DESC"
        : "SELECT * FROM companies WHERE owner_id = ? ORDER BY updated_at DESC";
      const sql = withPagination(baseSql, query);
      const rows = keyword
        ? (db.prepare(sql).all(ownerId, keyword) as Row[])
        : (db.prepare(sql).all(ownerId) as Row[]);
      return rows.map(toCompany);
    },
    async delete(ownerId, id): Promise<void> {
      db.prepare("DELETE FROM companies WHERE owner_id = ? AND id = ?").run(ownerId, id);
    },
  };

  const contacts: ContactRepository = {
    async create(input): Promise<Contact> {
      const id = randomUUID();
      const ts = nowIso();
      const tags = input.tags ?? [];
      const searchText = normalizeSearchText(
        `${input.name} ${input.email ?? ""} ${input.phone ?? ""} ${input.project ?? ""} ${input.notes ?? ""}`
      );
      db.prepare(
        `INSERT INTO contacts (
          id, owner_id, company_id, name, email, phone, tags_json, lifecycle_stage, project, notes, search_text, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        input.ownerId,
        input.companyId ?? null,
        input.name,
        input.email ?? null,
        input.phone ?? null,
        JSON.stringify(tags),
        input.lifecycleStage ?? null,
        input.project ?? null,
        input.notes ?? null,
        searchText,
        ts,
        ts
      );
      return (await this.findById(input.ownerId, id)) as Contact;
    },
    async update(id, patch): Promise<Contact> {
      const current = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Row | undefined;
      if (!current) throw new Error("Contact not found");
      const next = {
        companyId: patch.companyId ?? (current.company_id ? String(current.company_id) : null),
        name: patch.name ?? String(current.name),
        email: patch.email ?? (current.email ? String(current.email) : undefined),
        phone: patch.phone ?? (current.phone ? String(current.phone) : undefined),
        tags: patch.tags ?? JSON.parse(String(current.tags_json ?? "[]")),
        lifecycleStage: patch.lifecycleStage ?? (current.lifecycle_stage ? String(current.lifecycle_stage) : undefined),
        project: patch.project ?? (current.project ? String(current.project) : undefined),
        notes: patch.notes ?? (current.notes ? String(current.notes) : undefined),
      };
      const searchText = normalizeSearchText(
        `${next.name} ${next.email ?? ""} ${next.phone ?? ""} ${next.project ?? ""} ${next.notes ?? ""}`
      );
      db.prepare(
        `UPDATE contacts
         SET company_id = ?, name = ?, email = ?, phone = ?, tags_json = ?, lifecycle_stage = ?, project = ?, notes = ?, search_text = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        next.companyId,
        next.name,
        next.email ?? null,
        next.phone ?? null,
        JSON.stringify(next.tags),
        next.lifecycleStage ?? null,
        next.project ?? null,
        next.notes ?? null,
        searchText,
        nowIso(),
        id
      );
      return toContact(db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Row);
    },
    async findById(ownerId, id): Promise<Contact | null> {
      const row = db.prepare("SELECT * FROM contacts WHERE owner_id = ? AND id = ?").get(ownerId, id) as Row | undefined;
      return row ? toContact(row) : null;
    },
    async list(ownerId, filters): Promise<Contact[]> {
      const clauses = ["owner_id = ?"];
      const args: unknown[] = [ownerId];
      if (filters?.companyId) {
        clauses.push("company_id = ?");
        args.push(filters.companyId);
      }
      if (filters?.tag) {
        clauses.push("tags_json LIKE ?");
        args.push(`%\"${filters.tag}\"%`);
      }
      const keyword = likePattern(filters?.keyword);
      if (keyword) {
        clauses.push("search_text LIKE ?");
        args.push(keyword);
      }
      const baseSql = `SELECT * FROM contacts WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC`;
      const sql = withPagination(baseSql, filters);
      const rows = db.prepare(sql).all(...args) as Row[];
      return rows.map(toContact);
    },
    async bulkUpsertFromCsv(ownerId, rows): Promise<{ inserted: number; updated: number }> {
      let inserted = 0;
      let updated = 0;
      const findByEmail = db.prepare("SELECT id FROM contacts WHERE owner_id = ? AND lower(email) = lower(?) LIMIT 1");
      const findByName = db.prepare("SELECT id FROM contacts WHERE owner_id = ? AND name = ? LIMIT 1");
      const insertStmt = db.prepare(
        `INSERT INTO contacts (
          id, owner_id, company_id, name, email, phone, tags_json, lifecycle_stage, project, notes, search_text, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const updateStmt = db.prepare(
        `UPDATE contacts
         SET company_id = ?, name = ?, email = ?, phone = ?, tags_json = ?, lifecycle_stage = ?, project = ?, notes = ?, search_text = ?, updated_at = ?
         WHERE id = ? AND owner_id = ?`
      );
      const tx = db.transaction((inputRows: CreateContactInput[]) => {
        for (const row of inputRows) {
          const existingByEmail =
            row.email && row.email.trim().length > 0 ? (findByEmail.get(ownerId, row.email) as Row | undefined) : undefined;
          const existingByName = !existingByEmail ? (findByName.get(ownerId, row.name) as Row | undefined) : undefined;
          const existingId = existingByEmail?.id ?? existingByName?.id;
          const ts = nowIso();
          const tags = row.tags ?? [];
          const searchText = normalizeSearchText(
            `${row.name} ${row.email ?? ""} ${row.phone ?? ""} ${row.project ?? ""} ${row.notes ?? ""}`
          );
          if (existingId) {
            updateStmt.run(
              row.companyId ?? null,
              row.name,
              row.email ?? null,
              row.phone ?? null,
              JSON.stringify(tags),
              row.lifecycleStage ?? null,
              row.project ?? null,
              row.notes ?? null,
              searchText,
              ts,
              String(existingId),
              ownerId
            );
            updated += 1;
          } else {
            insertStmt.run(
              randomUUID(),
              ownerId,
              row.companyId ?? null,
              row.name,
              row.email ?? null,
              row.phone ?? null,
              JSON.stringify(tags),
              row.lifecycleStage ?? null,
              row.project ?? null,
              row.notes ?? null,
              searchText,
              ts,
              ts
            );
            inserted += 1;
          }
        }
      });
      tx(rows);
      return { inserted, updated };
    },
    async delete(ownerId, id): Promise<void> {
      db.prepare("DELETE FROM contacts WHERE owner_id = ? AND id = ?").run(ownerId, id);
    },
  };

  const deals: DealRepository = {
    async create(input): Promise<Deal> {
      const id = randomUUID();
      const ts = nowIso();
      const stage = input.stage ?? "lead";
      const amount = input.amount ?? 0;
      const currency = input.currency ?? "JPY";
      const status = input.status ?? "open";
      const searchText = normalizeSearchText(`${input.title} ${input.project ?? ""} ${input.notes ?? ""}`);
      db.prepare(
        `INSERT INTO deals (
          id, owner_id, contact_id, title, stage, amount, currency, expected_close_date, status, project, notes, search_text, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        input.ownerId,
        input.contactId,
        input.title,
        stage,
        amount,
        currency,
        input.expectedCloseDate ?? null,
        status,
        input.project ?? null,
        input.notes ?? null,
        searchText,
        ts,
        ts
      );
      return (await this.findById(input.ownerId, id)) as Deal;
    },
    async update(id, patch): Promise<Deal> {
      const current = db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as Row | undefined;
      if (!current) throw new Error("Deal not found");
      const next = {
        contactId: patch.contactId ?? String(current.contact_id),
        title: patch.title ?? String(current.title),
        stage: patch.stage ?? (current.stage as Deal["stage"]),
        amount: patch.amount ?? Number(current.amount ?? 0),
        currency: patch.currency ?? String(current.currency),
        expectedCloseDate: patch.expectedCloseDate ?? (current.expected_close_date ? String(current.expected_close_date) : undefined),
        status: patch.status ?? (current.status as Deal["status"]),
        project: patch.project ?? (current.project ? String(current.project) : undefined),
        notes: patch.notes ?? (current.notes ? String(current.notes) : undefined),
      };
      const searchText = normalizeSearchText(`${next.title} ${next.project ?? ""} ${next.notes ?? ""}`);
      db.prepare(
        `UPDATE deals
         SET contact_id = ?, title = ?, stage = ?, amount = ?, currency = ?, expected_close_date = ?, status = ?, project = ?, notes = ?, search_text = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        next.contactId,
        next.title,
        next.stage,
        next.amount,
        next.currency,
        next.expectedCloseDate ?? null,
        next.status,
        next.project ?? null,
        next.notes ?? null,
        searchText,
        nowIso(),
        id
      );
      return toDeal(db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as Row);
    },
    async moveStage(ownerId, id, stage): Promise<Deal> {
      db.prepare("UPDATE deals SET stage = ?, updated_at = ? WHERE owner_id = ? AND id = ?").run(stage, nowIso(), ownerId, id);
      const row = db.prepare("SELECT * FROM deals WHERE owner_id = ? AND id = ?").get(ownerId, id) as Row | undefined;
      if (!row) throw new Error("Deal not found");
      return toDeal(row);
    },
    async findById(ownerId, id): Promise<Deal | null> {
      const row = db.prepare("SELECT * FROM deals WHERE owner_id = ? AND id = ?").get(ownerId, id) as Row | undefined;
      return row ? toDeal(row) : null;
    },
    async list(ownerId, filters): Promise<Deal[]> {
      const clauses = ["owner_id = ?"];
      const args: unknown[] = [ownerId];
      if (filters?.stage) {
        clauses.push("stage = ?");
        args.push(filters.stage);
      }
      if (filters?.status) {
        clauses.push("status = ?");
        args.push(filters.status);
      }
      if (filters?.contactId) {
        clauses.push("contact_id = ?");
        args.push(filters.contactId);
      }
      const keyword = likePattern(filters?.keyword);
      if (keyword) {
        clauses.push("search_text LIKE ?");
        args.push(keyword);
      }
      const baseSql = `SELECT * FROM deals WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC`;
      const sql = withPagination(baseSql, filters);
      const rows = db.prepare(sql).all(...args) as Row[];
      return rows.map(toDeal);
    },
    async delete(ownerId, id): Promise<void> {
      db.prepare("DELETE FROM deals WHERE owner_id = ? AND id = ?").run(ownerId, id);
    },
  };

  const tasks: TaskRepository = {
    async create(input): Promise<Task> {
      const id = randomUUID();
      const ts = nowIso();
      db.prepare(
        `INSERT INTO tasks (
          id, owner_id, contact_id, deal_id, type, title, due_date, status, reminder_state, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', 'none', ?, ?)`
      ).run(id, input.ownerId, input.contactId ?? null, input.dealId ?? null, input.type, input.title, input.dueDate ?? null, ts, ts);
      return (await this.findById(input.ownerId, id)) as Task;
    },
    async update(id, patch): Promise<Task> {
      const current = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Row | undefined;
      if (!current) throw new Error("Task not found");
      db.prepare(
        `UPDATE tasks
         SET contact_id = ?, deal_id = ?, type = ?, title = ?, due_date = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        patch.contactId ?? (current.contact_id ? String(current.contact_id) : null),
        patch.dealId ?? (current.deal_id ? String(current.deal_id) : null),
        patch.type ?? current.type,
        patch.title ?? current.title,
        patch.dueDate ?? current.due_date ?? null,
        nowIso(),
        id
      );
      return toTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Row);
    },
    async markDone(ownerId, id): Promise<Task> {
      db.prepare("UPDATE tasks SET status = 'done', reminder_state = 'none', updated_at = ? WHERE owner_id = ? AND id = ?").run(
        nowIso(),
        ownerId,
        id
      );
      const row = db.prepare("SELECT * FROM tasks WHERE owner_id = ? AND id = ?").get(ownerId, id) as Row | undefined;
      if (!row) throw new Error("Task not found");
      return toTask(row);
    },
    async findById(ownerId, id): Promise<Task | null> {
      const row = db.prepare("SELECT * FROM tasks WHERE owner_id = ? AND id = ?").get(ownerId, id) as Row | undefined;
      return row ? toTask(row) : null;
    },
    async list(ownerId, filters): Promise<Task[]> {
      const clauses = ["owner_id = ?"];
      const args: unknown[] = [ownerId];
      if (filters?.status) {
        clauses.push("status = ?");
        args.push(filters.status);
      }
      if (filters?.type) {
        clauses.push("type = ?");
        args.push(filters.type);
      }
      if (filters?.dueDateFrom) {
        clauses.push("due_date >= ?");
        args.push(filters.dueDateFrom);
      }
      if (filters?.dueDateTo) {
        clauses.push("due_date <= ?");
        args.push(filters.dueDateTo);
      }
      if (filters?.keyword) {
        clauses.push("lower(title) LIKE ?");
        args.push(`%${filters.keyword.toLowerCase()}%`);
      }
      const baseSql = `SELECT * FROM tasks WHERE ${clauses.join(" AND ")} ORDER BY due_date ASC, updated_at DESC`;
      const sql = withPagination(baseSql, filters);
      const rows = db.prepare(sql).all(...args) as Row[];
      return rows.map(toTask);
    },
    async delete(ownerId, id): Promise<void> {
      db.prepare("DELETE FROM tasks WHERE owner_id = ? AND id = ?").run(ownerId, id);
    },
  };

  const activities: ActivityRepository = {
    async create(input: CreateActivityInput): Promise<Activity> {
      const id = randomUUID();
      const ts = nowIso();
      db.prepare(
        `INSERT INTO activities (id, owner_id, contact_id, deal_id, type, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(id, input.ownerId, input.contactId, input.dealId ?? null, input.type, input.content, ts);
      return toActivity(db.prepare("SELECT * FROM activities WHERE id = ?").get(id) as Row);
    },
    async listByContact(ownerId, contactId): Promise<Activity[]> {
      const rows = db
        .prepare("SELECT * FROM activities WHERE owner_id = ? AND contact_id = ? ORDER BY created_at DESC")
        .all(ownerId, contactId) as Row[];
      return rows.map(toActivity);
    },
  };

  const email: EmailRepository = {
    async listTemplates(ownerId): Promise<EmailTemplate[]> {
      const rows = db
        .prepare("SELECT * FROM email_templates WHERE owner_id = ? ORDER BY is_system DESC, created_at ASC")
        .all(ownerId) as Row[];
      return rows.map(toTemplate);
    },
    async seedDefaultTemplates(ownerId): Promise<void> {
      const exists = db
        .prepare("SELECT COUNT(*) as count FROM email_templates WHERE owner_id = ? AND is_system = 1")
        .get(ownerId) as Row;
      if (Number(exists.count ?? 0) > 0) return;
      const ts = nowIso();
      const templates = [
        {
          title: "初回ご挨拶",
          body: "お世話になっております。ご挨拶のためご連絡いたしました。",
        },
        {
          title: "ご提案フォロー",
          body: "先日お送りしたご提案について、ご不明点があればお知らせください。",
        },
        {
          title: "打ち合わせお礼",
          body: "本日はお時間をいただきありがとうございました。次のアクションをご共有します。",
        },
      ];
      const stmt = db.prepare(
        `INSERT INTO email_templates (id, owner_id, title, body, is_system, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`
      );
      const tx = db.transaction(() => {
        for (const t of templates) {
          stmt.run(randomUUID(), ownerId, t.title, t.body, ts, ts);
        }
      });
      tx();
    },
    async sendMock(input: SendMockEmailInput): Promise<EmailLog> {
      const id = randomUUID();
      const ts = nowIso();
      db.prepare(
        `INSERT INTO email_logs (id, owner_id, contact_id, template_id, subject, body, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(id, input.ownerId, input.contactId, input.templateId ?? null, input.subject, input.body, ts);
      await activities.create({
        ownerId: input.ownerId,
        contactId: input.contactId,
        type: "email",
        content: `Mock email sent: ${input.subject}`,
      });
      return toEmailLog(db.prepare("SELECT * FROM email_logs WHERE id = ?").get(id) as Row);
    },
    async listLogsByContact(ownerId, contactId): Promise<EmailLog[]> {
      const rows = db
        .prepare("SELECT * FROM email_logs WHERE owner_id = ? AND contact_id = ? ORDER BY sent_at DESC")
        .all(ownerId, contactId) as Row[];
      return rows.map(toEmailLog);
    },
  };

  const analytics: AnalyticsRepository = {
    async track(event): Promise<void> {
      db.prepare(
        `INSERT INTO analytics_events (id, owner_id, event_name, entity_type, entity_id, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        randomUUID(),
        event.ownerId ?? null,
        event.eventName,
        event.entityType ?? null,
        event.entityId ?? null,
        JSON.stringify(event.metadata ?? {}),
        nowIso()
      );
    },
  };

  const dashboard: DashboardRepository = {
    async getSummary(ownerId: UUID): Promise<DashboardSummary> {
      const today = db.prepare("SELECT today_task_count FROM v_dashboard_today_tasks WHERE owner_id = ?").get(ownerId) as Row | undefined;
      const pipe = db
        .prepare("SELECT pipeline_total_jpy FROM v_dashboard_pipeline_total WHERE owner_id = ?")
        .get(ownerId) as Row | undefined;
      const touchRows = db
        .prepare("SELECT contact_id, last_activity_at FROM v_dashboard_recent_touch WHERE owner_id = ? ORDER BY last_activity_at DESC")
        .all(ownerId) as Row[];
      return {
        todayTaskCount: Number(today?.today_task_count ?? 0),
        pipelineTotalJpy: Number(pipe?.pipeline_total_jpy ?? 0),
        recentTouchByContact: touchRows.map((r) => ({
          contactId: String(r.contact_id),
          lastActivityAt: String(r.last_activity_at),
        })),
      };
    },
  };

  return { profiles, companies, contacts, deals, tasks, activities, email, analytics, dashboard };
}
