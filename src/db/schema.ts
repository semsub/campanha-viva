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

// Hierarquia: super_admin → coordinator → leader → eleitores
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "coordinator",
  "leader",
]);

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").default(true),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").references(() => campaigns.id),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    // bcrypt da senha — o Super Admin pode redefinir a de qualquer usuário
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("leader"),
    // vínculo hierárquico: quem criou/supervisiona este usuário
    managerId: integer("manager_id"),
    // escopo territorial textual (região/bairro/município)
    territory: text("territory"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

// Trilha de auditoria — quem, quando, o quê, antes/depois, IP
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  actorId: integer("actor_id").references(() => users.id),
  action: text("action").notNull(), // ex.: login, password_reset, user_create
  entity: text("entity"),
  entityId: integer("entity_id"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  ip: text("ip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
