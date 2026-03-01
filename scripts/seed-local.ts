import { randomUUID } from "node:crypto";
import path from "node:path";
import { applySqliteSchema, createSqliteRepositories, openSqliteDatabase } from "../src/infrastructure/sqlite";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main(): Promise<void> {
  const dbPath = process.env.LOCAL_DB_PATH ?? path.resolve(process.cwd(), "local", "dealflow-lite.db");
  const ownerId = process.env.LOCAL_OWNER_ID ?? "local-user";
  const shouldReset = process.argv.includes("--reset");

  const db = openSqliteDatabase({ filePath: dbPath });
  applySqliteSchema(db);
  const repos = createSqliteRepositories(db);

  if (shouldReset) {
    db.exec(`
      DELETE FROM analytics_events;
      DELETE FROM email_logs;
      DELETE FROM email_templates;
      DELETE FROM activities;
      DELETE FROM tasks;
      DELETE FROM deals;
      DELETE FROM contacts;
      DELETE FROM companies;
      DELETE FROM profiles;
    `);
  }

  await repos.profiles.upsertLocalProfile({
    id: ownerId,
    displayName: "Local Demo User",
    locale: "ja-JP",
    timezone: "Asia/Tokyo",
  });

  const companyA = await repos.companies.create({
    ownerId,
    name: "株式会社Sora Dynamics",
    industry: "SaaS",
    notes: "インサイドセールス改善に課題あり",
  });
  const companyB = await repos.companies.create({
    ownerId,
    name: "Mizuho Consulting合同会社",
    industry: "Consulting",
    notes: "意思決定が早い",
  });

  const contactA = await repos.contacts.create({
    ownerId,
    companyId: companyA.id,
    name: "Keita Tanaka",
    email: "keita.tanaka@example.jp",
    phone: "090-1234-5678",
    tags: ["hot", "founder"],
    lifecycleStage: "qualified",
    project: "DealFlow導入検討",
    notes: "来週提案希望",
  });
  const contactB = await repos.contacts.create({
    ownerId,
    companyId: companyB.id,
    name: "Yui Sato",
    email: "yui.sato@example.jp",
    tags: ["warm"],
    lifecycleStage: "lead",
    project: "営業KPI可視化",
  });
  const contactC = await repos.contacts.create({
    ownerId,
    name: "Naoki Ueda",
    email: "naoki.ueda@example.jp",
    tags: ["new"],
  });

  const today = new Date();
  await repos.deals.create({
    ownerId,
    contactId: contactA.id,
    title: "Sora Dynamics 初期導入",
    stage: "proposal",
    amount: 480000,
    status: "open",
    expectedCloseDate: toIsoDate(addDays(today, 14)),
    project: "営業効率化",
  });
  await repos.deals.create({
    ownerId,
    contactId: contactB.id,
    title: "Mizuho PoC",
    stage: "qualified",
    amount: 220000,
    status: "open",
    expectedCloseDate: toIsoDate(addDays(today, 21)),
  });
  await repos.deals.create({
    ownerId,
    contactId: contactC.id,
    title: "Ueda Advisory 契約更新",
    stage: "negotiation",
    amount: 150000,
    status: "won",
    expectedCloseDate: toIsoDate(addDays(today, -3)),
  });

  await repos.tasks.create({
    ownerId,
    contactId: contactA.id,
    type: "customer_engagement",
    title: "提案資料の最終送付",
    dueDate: toIsoDate(today),
  });
  const upcomingTask = await repos.tasks.create({
    ownerId,
    contactId: contactB.id,
    type: "project_task",
    title: "PoC要件定義ミーティング設定",
    dueDate: toIsoDate(addDays(today, 2)),
  });
  await repos.tasks.create({
    ownerId,
    type: "daily_todo",
    title: "本日の商談準備",
    dueDate: toIsoDate(today),
  });
  await repos.tasks.markDone(ownerId, upcomingTask.id);

  await repos.activities.create({
    ownerId,
    contactId: contactA.id,
    type: "note",
    content: "初回ヒアリング完了。課題は商談進捗の可視化不足。",
  });
  await repos.activities.create({
    ownerId,
    contactId: contactB.id,
    type: "meeting",
    content: "オンライン打ち合わせを来週火曜に仮設定。",
  });

  await repos.email.seedDefaultTemplates(ownerId);
  const templates = await repos.email.listTemplates(ownerId);
  const template = templates[0];
  if (template) {
    await repos.email.sendMock({
      ownerId,
      contactId: contactA.id,
      templateId: template.id,
      subject: `${template.title} - ご連絡`,
      body: template.body,
    });
  }

  await repos.analytics.track({
    ownerId,
    eventName: "seed_local_data",
    entityType: "system",
    entityId: randomUUID(),
    metadata: { source: "scripts/seed-local.ts" },
  });

  const summary = await repos.dashboard.getSummary(ownerId);
  const contactCount = (await repos.contacts.list(ownerId)).length;
  const dealCount = (await repos.deals.list(ownerId)).length;
  const taskCount = (await repos.tasks.list(ownerId)).length;

  console.log("Local seed completed");
  console.log(`DB: ${dbPath}`);
  console.log(`Owner: ${ownerId}`);
  console.log(`Contacts: ${contactCount}, Deals: ${dealCount}, Tasks: ${taskCount}`);
  console.log(`Dashboard -> Today: ${summary.todayTaskCount}, Pipeline JPY: ${summary.pipelineTotalJpy}`);

  db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

