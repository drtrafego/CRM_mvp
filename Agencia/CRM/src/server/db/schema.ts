import { pgTable, text, timestamp, uuid, pgEnum, integer, decimal } from "drizzle-orm/pg-core";

// Removed hardcoded statusEnum to support dynamic columns
// export const statusEnum = pgEnum("status", ['new', 'contacted', 'proposal', 'won', 'lost']);

export const columns = pgTable("columns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  organizationId: text("organization_id").notNull(),
  color: text("color"), // Optional color for UI
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  campaignSource: text("campaign_source"),
  status: text("status").notNull(), // Changed from enum to text to match column IDs or titles
  columnId: uuid("column_id").references(() => columns.id), // Link to dynamic columns
  position: integer("position").default(0).notNull(),
  organizationId: text("organization_id").notNull(),
  notes: text("notes"),
  value: decimal("value", { precision: 10, scale: 2 }), // New field for lead value
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: text("organization_id").notNull().unique(),
  companyName: text("company_name"),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Column = typeof columns.$inferSelect;
export type Settings = typeof settings.$inferSelect;
