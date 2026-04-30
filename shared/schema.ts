import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  jsonb,
  timestamp,
  serial,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  provider: text("provider").notNull().default("email"),
  providerId: text("provider_id"),
  avatarUrl: text("avatar_url"),
  team: text("team"),
  position: text("position"),
  preferredFoot: text("preferred_foot"),
  age: integer("age"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const diaryEntries = pgTable("diary_entries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  mood: integer("mood").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  notes: text("notes"),
  skills: jsonb("skills").notNull().default(sql`'[]'::jsonb`),
  videoUrl: text("video_url"),
  mediaType: text("media_type"),
  xpAwarded: integer("xp_awarded").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  provider: true,
  providerId: true,
  avatarUrl: true,
  passwordHash: true,
});

export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlist).pick({
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type Waitlist = typeof waitlist.$inferSelect;
