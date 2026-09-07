import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  index,
  doublePrecision,
} from "drizzle-orm/pg-core";

// ============ ENUMS ============
// Hierarquia piramidal: super_admin → admin → coordinator → leader
export const userRoleEnum = pgEnum("user_role", ["super_admin", "admin", "coordinator", "leader"]);
export const demandStatusEnum = pgEnum("demand_status", ["pendente", "em_andamento", "concluido", "cancelado"]);
export const demandPriorityEnum = pgEnum("demand_priority", ["baixa", "media", "alta", "urgente"]);
export const taskStatusEnum = pgEnum("task_status", ["pendente", "em_andamento", "concluido", "cancelado"]);
export const eventStatusEnum = pgEnum("event_status", ["agendado", "em_andamento", "concluido", "cancelado"]);

// ============ CAMPANHAS ============
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============ USUÁRIOS ============
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").references(() => campaigns.id),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(), // sempre com esse nome
    role: userRoleEnum("role").notNull().default("leader"),
    managerId: integer("manager_id"),       // quem criou/supervisiona
    coordinatorId: integer("coordinator_id"), // p/ leader: coord dono
    territory: text("territory"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_unique").on(t.email),
    index("users_coord_idx").on(t.coordinatorId),
    index("users_manager_idx").on(t.managerId),
  ],
);

// ============ TERRITÓRIO ============
export const municipalities = pgTable("municipalities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  uf: text("uf"),                // Ex: 'PA'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  regionId: integer("region_id").references(() => regions.id),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============ ELEITORES ============
export const voters = pgTable(
  "voters",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").references(() => campaigns.id),
    name: text("name").notNull(),
    phone: text("phone"),                        // (00) 00000-0000
    voterTitle: text("voter_title"),             // 0000 0000 0000  (sensível — oculto p/ leader)
    zone: text("zone"),                          // 0000            (sensível)
    section: text("section"),                    // 0000            (sensível)
    street: text("street"),
    number: text("number"),
    neighborhood: text("neighborhood"),
    city: text("city"),
    uf: text("uf"),
    birthDate: text("birth_date"),               // DD/MM/AAAA
    notes: text("notes"),
    leaderId: integer("leader_id").references(() => users.id),
    coordinatorId: integer("coordinator_id").references(() => users.id),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("voters_coord_idx").on(t.coordinatorId),
    index("voters_leader_idx").on(t.leaderId),
    index("voters_creator_idx").on(t.createdBy),
  ],
);

// ============ DEMANDAS ============
export const demands = pgTable(
  "demands",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    status: demandStatusEnum("status").notNull().default("pendente"),
    priority: demandPriorityEnum("priority").notNull().default("media"),
    voterId: integer("voter_id").references(() => voters.id).notNull(),
    assignedTo: integer("assigned_to").references(() => users.id),
    coordinatorId: integer("coordinator_id").references(() => users.id),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("demands_coord_idx").on(t.coordinatorId),
    index("demands_creator_idx").on(t.createdBy),
    index("demands_voter_idx").on(t.voterId),
  ],
);

// ============ TAREFAS ============
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("pendente"),
    priority: demandPriorityEnum("priority").notNull().default("media"),
    startDate: text("start_date"),        // DD/MM/AAAA
    dueDate: text("due_date"),
    assignedTo: integer("assigned_to").references(() => users.id),
    coordinatorId: integer("coordinator_id").references(() => users.id),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("tasks_coord_idx").on(t.coordinatorId),
    index("tasks_creator_idx").on(t.createdBy),
  ],
);

// ============ EVENTOS ============
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    eventDate: text("event_date").notNull(),
    status: eventStatusEnum("status").notNull().default("agendado"),
    coordinatorId: integer("coordinator_id").references(() => users.id),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("events_coord_idx").on(t.coordinatorId),
    index("events_creator_idx").on(t.createdBy),
  ],
);

// ============ AUDITORIA ============
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actorId: integer("actor_id").references(() => users.id),
    actorRole: userRoleEnum("actor_role"),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: integer("entity_id"),
    detail: text("detail"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    success: boolean("success").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_actor_idx").on(t.actorId),
    index("audit_created_idx").on(t.createdAt),
    index("audit_entity_idx").on(t.entity, t.entityId),
  ],
);
