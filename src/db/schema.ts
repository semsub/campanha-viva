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

// Hierarquia piramidal:
// super_admin → admin → coordinator → leader
export const userRoleEnum = pgEnum("user_role", ["super_admin", "admin", "coordinator", "leader"]);
export const demandStatusEnum = pgEnum("demand_status", [
  "aberta", "em_andamento", "resolvida", "cancelada",
]);
export const demandPriorityEnum = pgEnum("demand_priority", ["baixa", "media", "alta", "urgente"]);
export const taskStatusEnum = pgEnum("task_status", ["pendente", "em_andamento", "concluida"]);

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").default(true),
});

// USERS
// managerId: quem criou/supervisiona este usuário (super_admin cria coord; coord cria leader)
// coordinatorId: para uma liderança, aponta para o coordenador dono; para o próprio coordinator = ele mesmo
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
    territory: text("territory"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

// VOTERS
// createdBy: quem cadastrou (super_admin, coord ou leader)
// leaderId: liderança responsável
// coordinatorId: coordenador dono (para o escopo pertencer só àquele coordenador)
export const voters = pgTable("voters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),                   // (00) 00000-0000
  voterTitle: text("voter_title"),        // Título eleitoral: 0000 0000 0000
  zone: text("zone"),                     // Zona eleitoral
  section: text("section"),               // Seção eleitoral
  street: text("street"),                 // Rua
  number: text("number"),                 // Número
  neighborhood: text("neighborhood"),     // Bairro
  city: text("city"),                     // Município
  birthDate: text("birth_date"),          // DD/MM/AAAA (armazenado como texto para preservar formato)
  notes: text("notes"),
  leaderId: integer("leader_id").references(() => users.id),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// DEMANDS — SEMPRE ligada a um eleitor (histórico do eleitor)
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
