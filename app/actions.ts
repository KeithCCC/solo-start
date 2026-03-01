"use server";

import { revalidatePath } from "next/cache";
import { getLocalOwnerId, getRepositories } from "@/lib/repositories";
import type { DealStage, TaskType } from "@/src/domain";

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createCompanyAction(formData: FormData): Promise<void> {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const name = str(formData.get("name"));
  if (!name) return;
  await repos.companies.create({
    ownerId,
    name,
    industry: str(formData.get("industry")) || undefined,
    notes: str(formData.get("notes")) || undefined,
  });
  await repos.analytics.track({ ownerId, eventName: "create_company", metadata: {} });
  revalidatePath("/companies");
}

export async function createContactAction(formData: FormData): Promise<void> {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const name = str(formData.get("name"));
  if (!name) return;
  const tags = str(formData.get("tags"))
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  await repos.contacts.create({
    ownerId,
    companyId: str(formData.get("companyId")) || null,
    name,
    email: str(formData.get("email")) || undefined,
    phone: str(formData.get("phone")) || undefined,
    tags,
    lifecycleStage: str(formData.get("lifecycleStage")) || undefined,
    project: str(formData.get("project")) || undefined,
    notes: str(formData.get("notes")) || undefined,
  });
  await repos.analytics.track({ ownerId, eventName: "create_contact", metadata: {} });
  revalidatePath("/contacts");
}

export async function createDealAction(formData: FormData): Promise<void> {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const contactId = str(formData.get("contactId"));
  const title = str(formData.get("title"));
  if (!contactId || !title) return;
  await repos.deals.create({
    ownerId,
    contactId,
    title,
    stage: (str(formData.get("stage")) as DealStage) || "lead",
    amount: Number(str(formData.get("amount")) || "0"),
    status: "open",
    expectedCloseDate: str(formData.get("expectedCloseDate")) || undefined,
    project: str(formData.get("project")) || undefined,
    notes: str(formData.get("notes")) || undefined,
  });
  await repos.analytics.track({ ownerId, eventName: "create_deal", metadata: {} });
  revalidatePath("/deals");
}

export async function moveDealStageAction(formData: FormData): Promise<void> {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const id = str(formData.get("id"));
  const stage = str(formData.get("stage")) as DealStage;
  if (!id || !stage) return;
  await repos.deals.moveStage(ownerId, id, stage);
  await repos.analytics.track({
    ownerId,
    eventName: "move_deal_stage",
    entityType: "deal",
    entityId: id,
    metadata: { stage },
  });
  revalidatePath("/deals");
  revalidatePath("/");
}

export async function createTaskAction(formData: FormData): Promise<void> {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const title = str(formData.get("title"));
  if (!title) return;
  await repos.tasks.create({
    ownerId,
    contactId: str(formData.get("contactId")) || null,
    dealId: str(formData.get("dealId")) || null,
    type: (str(formData.get("type")) as TaskType) || "daily_todo",
    title,
    dueDate: str(formData.get("dueDate")) || undefined,
  });
  await repos.analytics.track({ ownerId, eventName: "create_task", metadata: {} });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function markTaskDoneAction(formData: FormData): Promise<void> {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const id = str(formData.get("id"));
  if (!id) return;
  await repos.tasks.markDone(ownerId, id);
  await repos.analytics.track({
    ownerId,
    eventName: "complete_task",
    entityType: "task",
    entityId: id,
    metadata: {},
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function createActivityAction(formData: FormData): Promise<void> {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const contactId = str(formData.get("contactId"));
  const content = str(formData.get("content"));
  if (!contactId || !content) return;
  await repos.activities.create({
    ownerId,
    contactId,
    dealId: str(formData.get("dealId")) || null,
    type: "note",
    content,
  });
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/");
}

export async function sendMockEmailAction(formData: FormData): Promise<void> {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const contactId = str(formData.get("contactId"));
  const subject = str(formData.get("subject"));
  const body = str(formData.get("body"));
  if (!contactId || !subject || !body) return;
  await repos.email.sendMock({
    ownerId,
    contactId,
    templateId: str(formData.get("templateId")) || null,
    subject,
    body,
  });
  await repos.analytics.track({
    ownerId,
    eventName: "send_mock_email",
    entityType: "contact",
    entityId: contactId,
    metadata: {},
  });
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/");
}

export async function importContactsCsvAction(formData: FormData): Promise<void> {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const csv = str(formData.get("csv"));
  if (!csv) return;

  const [headerLine, ...lines] = csv.split(/\r?\n/).filter((v) => v.trim().length > 0);
  if (!headerLine || lines.length === 0) return;
  const headers = headerLine.split(",").map((v) => v.trim().toLowerCase());
  const rows = lines
    .map((line) => line.split(","))
    .map((parts) => {
      const data: Record<string, string> = {};
      headers.forEach((h, idx) => {
        data[h] = (parts[idx] ?? "").trim();
      });
      return data;
    })
    .filter((r) => r.name);

  await repos.contacts.bulkUpsertFromCsv(
    ownerId,
    rows.map((r) => ({
      ownerId,
      name: r.name,
      email: r.email || undefined,
      phone: r.phone || undefined,
      project: r.project || undefined,
      notes: r.notes || undefined,
      tags: (r.tags || "")
        .split("|")
        .map((v) => v.trim())
        .filter(Boolean),
    }))
  );
  await repos.analytics.track({ ownerId, eventName: "import_csv_contacts", metadata: { rows: rows.length } });
  revalidatePath("/contacts");
  revalidatePath("/import");
}

