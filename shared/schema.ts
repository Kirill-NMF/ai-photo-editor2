import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Server-side session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage shared by Google and Telegram authentication.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Telegram Auth fields
  telegramId: varchar("telegram_id").unique(),
  telegramUsername: varchar("telegram_username"),
  
  // API rate limiting fields
  apiRequestsCount: integer("api_requests_count").notNull().default(0),
  apiRequestsResetDate: timestamp("api_requests_reset_date"),
  promoCodeUsed: boolean("promo_code_used").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects table - Groups images and edits into projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("projects_user_id_idx").on(table.userId),
  index("projects_user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
]);

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Images table - Stores uploaded images and their metadata
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  parentImageId: integer("parent_image_id").references((): any => images.id, { onDelete: "cascade" }),
  isOriginal: integer("is_original").notNull().default(1),
  originalUrl: text("original_url").notNull(),
  currentUrl: text("current_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("images_user_id_idx").on(table.userId),
  index("images_project_id_idx").on(table.projectId),
  index("images_parent_id_idx").on(table.parentImageId),
  index("images_user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
  index("images_project_id_created_at_idx").on(table.projectId, table.createdAt.desc()),
]);

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;

// Edits table - Stores edit history for images
export const edits = pgTable("edits", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").notNull().references(() => images.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  resultUrl: text("result_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  savedImageId: integer("saved_image_id").references(() => images.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("edits_image_id_idx").on(table.imageId),
  index("edits_user_id_idx").on(table.userId),
  index("edits_saved_image_id_idx").on(table.savedImageId),
  index("edits_image_id_created_at_idx").on(table.imageId, table.createdAt.desc()),
  index("edits_user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
]);

export const insertEditSchema = createInsertSchema(edits).omit({
  id: true,
  createdAt: true,
});

export type InsertEdit = z.infer<typeof insertEditSchema>;
export type Edit = typeof edits.$inferSelect;
