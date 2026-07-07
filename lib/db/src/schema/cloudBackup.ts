import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const cloudBackupsTable = pgTable("cloud_backups", {
  deviceId: text("device_id").primaryKey(),
  data: text("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type CloudBackup = typeof cloudBackupsTable.$inferSelect;
