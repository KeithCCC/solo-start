import type {
  Activity,
  AnalyticsEvent,
  Company,
  Contact,
  DashboardSummary,
  Deal,
  DealStage,
  EmailLog,
  EmailTemplate,
  Profile,
  Task,
  UUID,
} from "./types";

export interface SearchQuery {
  keyword?: string;
  limit?: number;
  offset?: number;
}

export interface ContactFilters extends SearchQuery {
  companyId?: UUID;
  tag?: string;
}

export interface DealFilters extends SearchQuery {
  stage?: DealStage;
  status?: Deal["status"];
  contactId?: UUID;
}

export interface TaskFilters extends SearchQuery {
  dueDateFrom?: string;
  dueDateTo?: string;
  status?: Task["status"];
  type?: Task["type"];
}

export interface CreateCompanyInput {
  ownerId: UUID;
  name: string;
  industry?: string;
  notes?: string;
}

export interface CreateContactInput {
  ownerId: UUID;
  companyId?: UUID | null;
  name: string;
  email?: string;
  phone?: string;
  tags?: string[];
  lifecycleStage?: string;
  project?: string;
  notes?: string;
}

export interface CreateDealInput {
  ownerId: UUID;
  contactId: UUID;
  title: string;
  stage?: Deal["stage"];
  amount?: number;
  currency?: string;
  expectedCloseDate?: string;
  status?: Deal["status"];
  project?: string;
  notes?: string;
}

export interface CreateTaskInput {
  ownerId: UUID;
  contactId?: UUID | null;
  dealId?: UUID | null;
  type: Task["type"];
  title: string;
  dueDate?: string;
}

export interface CreateActivityInput {
  ownerId: UUID;
  contactId: UUID;
  dealId?: UUID | null;
  type: Activity["type"];
  content: string;
}

export interface SendMockEmailInput {
  ownerId: UUID;
  contactId: UUID;
  templateId?: UUID | null;
  subject: string;
  body: string;
}

export interface CompanyRepository {
  create(input: CreateCompanyInput): Promise<Company>;
  update(id: UUID, patch: Partial<CreateCompanyInput>): Promise<Company>;
  findById(ownerId: UUID, id: UUID): Promise<Company | null>;
  list(ownerId: UUID, query?: SearchQuery): Promise<Company[]>;
  delete(ownerId: UUID, id: UUID): Promise<void>;
}

export interface ContactRepository {
  create(input: CreateContactInput): Promise<Contact>;
  update(id: UUID, patch: Partial<CreateContactInput>): Promise<Contact>;
  findById(ownerId: UUID, id: UUID): Promise<Contact | null>;
  list(ownerId: UUID, filters?: ContactFilters): Promise<Contact[]>;
  bulkUpsertFromCsv(ownerId: UUID, rows: CreateContactInput[]): Promise<{ inserted: number; updated: number }>;
  delete(ownerId: UUID, id: UUID): Promise<void>;
}

export interface DealRepository {
  create(input: CreateDealInput): Promise<Deal>;
  update(id: UUID, patch: Partial<CreateDealInput>): Promise<Deal>;
  moveStage(ownerId: UUID, id: UUID, stage: DealStage): Promise<Deal>;
  findById(ownerId: UUID, id: UUID): Promise<Deal | null>;
  list(ownerId: UUID, filters?: DealFilters): Promise<Deal[]>;
  delete(ownerId: UUID, id: UUID): Promise<void>;
}

export interface TaskRepository {
  create(input: CreateTaskInput): Promise<Task>;
  update(id: UUID, patch: Partial<CreateTaskInput>): Promise<Task>;
  markDone(ownerId: UUID, id: UUID): Promise<Task>;
  findById(ownerId: UUID, id: UUID): Promise<Task | null>;
  list(ownerId: UUID, filters?: TaskFilters): Promise<Task[]>;
  delete(ownerId: UUID, id: UUID): Promise<void>;
}

export interface ActivityRepository {
  create(input: CreateActivityInput): Promise<Activity>;
  listByContact(ownerId: UUID, contactId: UUID): Promise<Activity[]>;
}

export interface EmailRepository {
  listTemplates(ownerId: UUID): Promise<EmailTemplate[]>;
  seedDefaultTemplates(ownerId: UUID): Promise<void>;
  sendMock(input: SendMockEmailInput): Promise<EmailLog>;
  listLogsByContact(ownerId: UUID, contactId: UUID): Promise<EmailLog[]>;
}

export interface AnalyticsRepository {
  track(event: Omit<AnalyticsEvent, "id" | "createdAt">): Promise<void>;
}

export interface DashboardRepository {
  getSummary(ownerId: UUID): Promise<DashboardSummary>;
}

export interface ProfileRepository {
  getLocalProfile(): Promise<Profile>;
  upsertLocalProfile(patch: Partial<Profile> & Pick<Profile, "id">): Promise<Profile>;
}

export interface Repositories {
  profiles: ProfileRepository;
  companies: CompanyRepository;
  contacts: ContactRepository;
  deals: DealRepository;
  tasks: TaskRepository;
  activities: ActivityRepository;
  email: EmailRepository;
  analytics: AnalyticsRepository;
  dashboard: DashboardRepository;
}

