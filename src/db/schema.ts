import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["super_admin", "coordinator", "coordenador_regional", "leader", "lideranca"]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const demandStatusEnum = pgEnum("demand_status", ["aberta", "em_andamento", "resolvida", "cancelada"]);
export const demandPriorityEnum = pgEnum("demand_priority", ["baixa", "media", "alta", "urgente"]);
export const taskStatusEnum = pgEnum("task_status", ["pendente", "em_andamento", "concluida"]);

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  state: text("state"),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").default(true),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("leader"),
    managerId: integer("manager_id"),
    coordinatorId: integer("coordinator_id"),
    parentUserId: integer("parent_user_id"),
    campaignId: integer("campaign_id").references(() => campaigns.id),
    territory: text("territory"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const voters = pgTable("voters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  voterTitle: text("voter_title"),
  zone: text("zone"),
  section: text("section"),
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  birthDate: text("birth_date"),
  notes: text("notes"),
  leaderId: integer("leader_id").references(() => users.id),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const demands = pgTable("demands", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: demandStatusEnum("status").notNull().default("aberta"),
  priority: demandPriorityEnum("priority").notNull().default("media"),
  voterId: integer("voter_id").references(() => voters.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("pendente"),
  dueDate: text("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  eventDate: text("event_date").notNull(),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  actorId: integer("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: integer("entity_id"),
  detail: text("detail"),
  ip: text("ip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const demandCategories = pgTable("demand_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  icon: text("icon"),
  color: text("color"),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  campaignId: integer("campaign_id").references(() => campaigns.id),
});

export const municipalities = pgTable("municipalities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state"),
  campaignId: integer("campaign_id").references(() => campaigns.id),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
});

export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  regionId: integer("region_id").references(() => regions.id),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
});

export const electoralZones = pgTable("electoral_zones", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
});

export const electoralSections = pgTable("electoral_sections", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(),
  zoneId: integer("zone_id").references(() => electoralZones.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
});
