import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password"),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  role: text("role").notNull().default("USER"),
  campaignId: integer("campaign_id"),
  managerId: integer("manager_id"),
  coordinatorId: integer("coordinator_id"),
  leaderId: integer("leader_id"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const voters = pgTable("voters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  campaignId: integer("campaign_id"),
  coordinatorId: integer("coordinator_id"),
  createdBy: integer("created_by"),
  leaderId: integer("leader_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const demands = pgTable("demands", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("PENDING").notNull(),
  priority: text("priority").default("NORMAL"),
  category: text("category"),
  campaignId: integer("campaign_id"),
  createdBy: integer("created_by"),
  assignedTo: integer("assigned_to"),
  coordinatorId: integer("coordinator_id"),
  leaderId: integer("leader_id"),
  voterId: integer("voter_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("PENDING").notNull(),
  priority: text("priority").default("NORMAL"),
  campaignId: integer("campaign_id"),
  createdBy: integer("created_by"),
  assignedTo: integer("assigned_to"),
  coordinatorId: integer("coordinator_id"),
  leaderId: integer("leader_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date"),
  eventDate: text("event_date"),
  location: text("location"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  status: text("status").default("PENDING"),
  campaignId: integer("campaign_id"),
  createdBy: integer("created_by"),
  coordinatorId: integer("coordinator_id"),
  leaderId: integer("leader_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  protocol: text("protocol"),
  entity: text("entity"),
  entityId: integer("entity_id"),
  detail: text("detail"),
  ip: text("ip"),
  actorId: integer("actor_id"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const demandCategories = pgTable("demand_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  icon: text("icon"),
  color: text("color"),
  sortOrder: integer("sort_order"),
  active: boolean("active").default(true),
});

export const municipalities = pgTable("municipalities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state"),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  municipalityId: integer("municipality_id"),
});

export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  regionId: integer("region_id"),
  municipalityId: integer("municipality_id"),
});

export const electoralZones = pgTable("electoral_zones", {
  id: serial("id").primaryKey(),
  name: text("name"),
  zone: text("zone"),
  municipalityId: integer("municipality_id"),
});
