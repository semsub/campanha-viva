import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password"),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  role: text("role").notNull().default("USER"),
  campaignId: integer("campaign_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voters = pgTable("voters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const demands = pgTable("demands", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  protocol: text("protocol"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const demandCategories = pgTable("demand_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
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
});

export const electoralZones = pgTable("electoral_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});
