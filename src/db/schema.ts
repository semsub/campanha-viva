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
  date,
} from "drizzle-orm/pg-core";

/* ================================================================
   ENUMS
   ================================================================ */
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "coordinator",
  "leader",
]);

export const demandStatusEnum = pgEnum("demand_status", [
  "aberta",
  "em_analise",
  "aguardando_info",
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

/* ================================================================
   CAMPANHA
   ================================================================ */
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").default(true),
});

/* ================================================================
   ESTRUTURA TERRITORIAL
   ================================================================ */
export const municipalities = pgTable("municipalities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull().default("PA"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  regionId: integer("region_id").references(() => regions.id),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const electoralZones = pgTable("electoral_zones", {
  id: serial("id").primaryKey(),
  zone: text("zone").notNull(),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ================================================================
   USUÁRIOS (Super Admin / Coordenador / Liderança)
   ================================================================ */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").references(() => campaigns.id),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("leader"),
    managerId: integer("manager_id"),
    territory: text("territory"),
    regionId: integer("region_id").references(() => regions.id),
    neighborhoodId: integer("neighborhood_id").references(() => neighborhoods.id),
    municipalityId: integer("municipality_id").references(() => municipalities.id),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

/* ================================================================
   LIDERANÇAS (metadata/vínculo territorial do líder)
   ================================================================ */
export const leaderships = pgTable("leaderships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  regionId: integer("region_id").references(() => regions.id),
  neighborhoodId: integer("neighborhood_id").references(() => neighborhoods.id),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  community: text("community"),
  active: boolean("active").notNull().default(true),
  entryDate: date("entry_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ================================================================
   ELEITORES (voters)
   ================================================================ */
export const voters = pgTable(
  "voters",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    socialName: text("social_name"),
    birthDate: date("birth_date"),
    cpf: text("cpf"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    addressNumber: text("address_number"),
    complement: text("complement"),
    neighborhoodId: integer("neighborhood_id").references(() => neighborhoods.id),
    municipalityId: integer("municipality_id").references(() => municipalities.id),
    regionId: integer("region_id").references(() => regions.id),
    cep: text("cep"),
    referencePoint: text("reference_point"),
    electoralZone: text("electoral_zone"),
    electoralSection: text("electoral_section"),
    votingLocation: text("voting_location"),
    leadershipId: integer("leadership_id").references(() => leaderships.id),
    coordinatorId: integer("coordinator_id").references(() => users.id),
    registeredById: integer("registered_by_id").references(() => users.id),
    firstContactDate: date("first_contact_date"),
    lastContactDate: date("last_contact_date"),
    contactMethod: text("contact_method"),
    status: text("status").notNull().default("ativo"),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("voters_phone_idx").on(t.phone),
    index("voters_name_idx").on(t.name),
    index("voters_leadership_idx").on(t.leadershipId),
  ],
);

/* ================================================================
   CATEGORIAS DE DEMANDAS (configuráveis pelo Super Admin)
   ================================================================ */
export const demandCategories = pgTable("demand_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  icon: text("icon"),
  color: text("color"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ================================================================
   DEMANDAS
   ================================================================ */
export const demands = pgTable(
  "demands",
  {
    id: serial("id").primaryKey(),
    protocol: text("protocol").notNull(),
    categoryId: integer("category_id").references(() => demandCategories.id),
    subcategoryId: integer("subcategory_id").references(() => demandCategories.id),
    description: text("description").notNull(),
    priority: demandPriorityEnum("priority").notNull().default("media"),
    status: demandStatusEnum("status").notNull().default("aberta"),
    voterId: integer("voter_id").references(() => voters.id),
    leadershipId: integer("leadership_id").references(() => leaderships.id),
    coordinatorId: integer("coordinator_id").references(() => users.id),
    assignedToId: integer("assigned_to_id").references(() => users.id),
    regionId: integer("region_id").references(() => regions.id),
    neighborhoodId: integer("neighborhood_id").references(() => neighborhoods.id),
    deadline: date("deadline"),
    closedAt: timestamp("closed_at"),
    result: text("result"),
    notes: text("notes"),
    createdById: integer("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("demands_protocol_unique").on(t.protocol),
    index("demands_status_idx").on(t.status),
    index("demands_category_idx").on(t.categoryId),
  ],
);

/* ================================================================
   TAREFAS
   ================================================================ */
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  createdById: integer("created_by_id").references(() => users.id),
  demandId: integer("demand_id").references(() => demands.id),
  voterId: integer("voter_id").references(() => voters.id),
  priority: demandPriorityEnum("priority").notNull().default("media"),
  status: taskStatusEnum("status").notNull().default("pendente"),
  regionId: integer("region_id").references(() => regions.id),
  deadline: date("deadline"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ================================================================
   EVENTOS
   ================================================================ */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("reuniao"),
  eventDate: timestamp("event_date"),
  location: text("location"),
  responsibleId: integer("responsible_id").references(() => users.id),
  regionId: integer("region_id").references(() => regions.id),
  createdById: integer("created_by_id").references(() => users.id),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ================================================================
   AUDITORIA
   ================================================================ */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    actorId: integer("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: integer("entity_id"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_logs_actor_idx").on(t.actorId)],
);
