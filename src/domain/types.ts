export type UUID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // ISO-8601 UTC string

export type DealStage = "lead" | "qualified" | "proposal" | "negotiation";
export type DealStatus = "open" | "won" | "lost";
export type TaskType = "daily_todo" | "customer_engagement" | "project_task";
export type TaskStatus = "todo" | "in_progress" | "done";
export type ReminderState = "none" | "due_today" | "overdue";
export type ActivityType = "note" | "email" | "meeting";

export interface Profile {
  id: UUID;
  displayName?: string;
  locale: string;
  timezone: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Company {
  id: UUID;
  ownerId: UUID;
  name: string;
  industry?: string;
  notes?: string;
  searchText: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Contact {
  id: UUID;
  ownerId: UUID;
  companyId?: UUID | null;
  name: string;
  email?: string;
  phone?: string;
  tags: string[];
  lifecycleStage?: string;
  project?: string;
  notes?: string;
  searchText: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Deal {
  id: UUID;
  ownerId: UUID;
  contactId: UUID;
  title: string;
  stage: DealStage;
  amount: number;
  currency: string;
  expectedCloseDate?: ISODate;
  status: DealStatus;
  project?: string;
  notes?: string;
  searchText: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Task {
  id: UUID;
  ownerId: UUID;
  contactId?: UUID | null;
  dealId?: UUID | null;
  type: TaskType;
  title: string;
  dueDate?: ISODate;
  status: TaskStatus;
  reminderState: ReminderState;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Activity {
  id: UUID;
  ownerId: UUID;
  contactId: UUID;
  dealId?: UUID | null;
  type: ActivityType;
  content: string;
  createdAt: ISODateTime;
}

export interface EmailTemplate {
  id: UUID;
  ownerId: UUID;
  title: string;
  body: string;
  isSystem: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface EmailLog {
  id: UUID;
  ownerId: UUID;
  contactId: UUID;
  templateId?: UUID | null;
  subject: string;
  body: string;
  sentAt: ISODateTime;
}

export interface AnalyticsEvent {
  id: UUID;
  ownerId?: UUID | null;
  eventName: string;
  entityType?: string;
  entityId?: UUID;
  metadata: Record<string, unknown>;
  createdAt: ISODateTime;
}

export interface DashboardSummary {
  todayTaskCount: number;
  pipelineTotalJpy: number;
  recentTouchByContact: Array<{
    contactId: UUID;
    lastActivityAt: ISODateTime;
  }>;
}

