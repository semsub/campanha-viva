import {
  pgTable, pgEnum, serial, text, timestamp, boolean, integer, uniqueIndex, index,
} from "drizzle-orm/pg-core";

// Hierarquia: super_admin → admin → coordinator → leader
export const userRoleEnum = pgEnum("user_role", ["super_admin", "admin", "coordinator", "leader"]);
export const demandStatusEnum = pgEnum("demand_status", ["pendente", "em_andamento", "concluido", "cancelado"]);
export const demandPriorityEnum = pgEnum("demand_priority", ["baixa", "media", "alta", "urgente"]);
export const taskStatusEnum = pgEnum("task_status", ["pendente", "em_andamento", "concluido", "cancelado"]);
export const eventStatusEnum = pgEnum("event_status", ["agendado", "em_andamento", "concluido", "cancelado"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("leader"),
  // Só p/ leader: id do coordenador dono. Para coord: NULL (ele é seu próprio dono).
  coordinatorId: integer("coordinator_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("users_email_uidx").on(t.email),
  index("users_coord_idx").on(t.coordinatorId),
]);

export const voters = pgTable("voters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),                 // (00) 00000-0000
  voterTitle: text("voter_title"),      // 0000 0000 0000 — SENSÍVEL (leader não vê)
  zone: text("zone"),                   // 0000 — SENSÍVEL
  section: text("section"),             // 0000 — SENSÍVEL
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  birthDate: text("birth_date"),        // DD/MM/AAAA
  notes: text("notes"),
  // Dono do registro
  leaderId: integer("leader_id").references(() => users.id),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("voters_coord_idx").on(t.coordinatorId),
  index("voters_leader_idx").on(t.leaderId),
  index("voters_creator_idx").on(t.createdBy),
]);

export const demands = pgTable("demands", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: demandStatusEnum("status").notNull().default("pendente"),
  priority: demandPriorityEnum("priority").notNull().default("media"),
  voterId: integer("voter_id").references(() => voters.id).notNull(),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("demands_coord_idx").on(t.coordinatorId),
  index("demands_creator_idx").on(t.createdBy),
  index("demands_voter_idx").on(t.voterId),
]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("pendente"),
  priority: demandPriorityEnum("priority").notNull().default("media"),
  startDate: text("start_date"),        // DD/MM/AAAA
  dueDate: text("due_date"),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  eventDate: text("event_date").notNull(),
  status: eventStatusEnum("status").notNull().default("agendado"),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => users.id),
  actorRole: userRoleEnum("actor_role"),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: integer("entity_id"),
  detail: text("detail"),
  ip: text("ip"),
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("audit_actor_idx").on(t.actorId),
  index("audit_created_idx").on(t.createdAt),
]);
