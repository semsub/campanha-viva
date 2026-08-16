import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  serial,
  pgEnum,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

// ===== ENUMS =====

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "coordenador_geral",
  "coordenador_regional",
  "coordenador_municipal",
  "lideranca",
  "mobilizador",
  "atendente",
  "auditor",
  "visualizador",
]);

export const demandStatusEnum = pgEnum("demand_status", [
  "aberta",
  "em_analise",
  "aguardando_informacao",
  "encaminhada",
  "em_atendimento",
  "aguardando_terceiro",
  "resolvida",
  "cancelada",
  "encerrada",
]);

export const demandPriorityEnum = pgEnum("demand_priority", [
  "baixa",
  "media",
  "alta",
  "urgente",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pendente",
  "em_andamento",
  "concluida",
  "cancelada",
]);

// ===== CAMPAIGNS =====

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  state: varchar("state", { length: 100 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== USERS =====

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("visualizador"),
  phone: varchar("phone", { length: 30 }),
  active: boolean("active").default(true),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  parentUserId: integer("parent_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// ===== TERRITORIAL STRUCTURE =====

export const municipalities = pgTable("municipalities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  regionId: integer("region_id").references(() => regions.id),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const electoralZones = pgTable("electoral_zones", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 20 }).notNull(),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const electoralSections = pgTable("electoral_sections", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 20 }).notNull(),
  zoneId: integer("zone_id").references(() => electoralZones.id),
  votingLocation: varchar("voting_location", { length: 500 }),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== LEADERSHIPS =====

export const leaderships = pgTable("leaderships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  regionId: integer("region_id").references(() => regions.id),
  neighborhoodId: integer("neighborhood_id").references(() => neighborhoods.id),
  community: varchar("community", { length: 255 }),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  entryDate: date("entry_date"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== VOTERS (ELEITORES) =====

export const voters = pgTable("voters", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  socialName: varchar("social_name", { length: 255 }),
  birthDate: date("birth_date"),
  cpf: varchar("cpf", { length: 14 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  address: varchar("address", { length: 500 }),
  addressNumber: varchar("address_number", { length: 20 }),
  complement: varchar("complement", { length: 255 }),
  cep: varchar("cep", { length: 10 }),
  referencePoint: text("reference_point"),
  registrationStatus: varchar("registration_status", { length: 50 }).default("ativo"),
  // Territorial
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  neighborhoodId: integer("neighborhood_id").references(() => neighborhoods.id),
  regionId: integer("region_id").references(() => regions.id),
  community: varchar("community", { length: 255 }),
  electoralZoneId: integer("electoral_zone_id").references(() => electoralZones.id),
  electoralSectionId: integer("electoral_section_id").references(() => electoralSections.id),
  // Hierarchy
  leadershipId: integer("leadership_id").references(() => leaderships.id),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  // Relationship
  firstContactDate: date("first_contact_date"),
  lastContactDate: date("last_contact_date"),
  contactForm: varchar("contact_form", { length: 100 }),
  // LGPD
  consentGiven: boolean("consent_given").default(false),
  consentDate: timestamp("consent_date"),
  dataRetentionUntil: timestamp("data_retention_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// ===== DEMAND CATEGORIES =====

export const demandCategories = pgTable("demand_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: integer("parent_id"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== DEMANDS =====

export const demands = pgTable("demands", {
  id: serial("id").primaryKey(),
  protocol: varchar("protocol", { length: 50 }).notNull().unique(),
  categoryId: integer("category_id").references(() => demandCategories.id),
  subcategoryId: integer("subcategory_id").references(() => demandCategories.id),
  description: text("description").notNull(),
  priority: demandPriorityEnum("priority").default("media"),
  status: demandStatusEnum("status").default("aberta"),
  // People
  voterId: integer("voter_id").references(() => voters.id),
  leadershipId: integer("leadership_id").references(() => leaderships.id),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  // Dates
  openedAt: timestamp("opened_at").defaultNow(),
  deadline: timestamp("deadline"),
  closedAt: timestamp("closed_at"),
  // Details
  observations: text("observations"),
  result: text("result"),
  rating: integer("rating"),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== DEMAND HISTORY =====

export const demandHistory = pgTable("demand_history", {
  id: serial("id").primaryKey(),
  demandId: integer("demand_id").references(() => demands.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  previousStatus: demandStatusEnum("previous_status"),
  newStatus: demandStatusEnum("new_status"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== TASKS =====

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  createdById: integer("created_by_id").references(() => users.id),
  deadline: timestamp("deadline"),
  priority: demandPriorityEnum("priority").default("media"),
  status: taskStatusEnum("status").default("pendente"),
  demandId: integer("demand_id").references(() => demands.id),
  voterId: integer("voter_id").references(() => voters.id),
  regionId: integer("region_id").references(() => regions.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== EVENTS =====

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }),
  description: text("description"),
  eventDate: timestamp("event_date"),
  endDate: timestamp("end_date"),
  location: varchar("location", { length: 500 }),
  responsibleId: integer("responsible_id").references(() => users.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  regionId: integer("region_id").references(() => regions.id),
  observations: text("observations"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== NOTIFICATIONS =====

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: varchar("type", { length: 50 }),
  read: boolean("read").default(false),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== AUDIT LOG =====

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }),
  entityId: integer("entity_id"),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== COMMUNICATIONS =====

export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).default("comunicado"),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communicationRecipients = pgTable("communication_recipients", {
  id: serial("id").primaryKey(),
  communicationId: integer("communication_id").references(() => communications.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  readAt: timestamp("read_at"),
});
