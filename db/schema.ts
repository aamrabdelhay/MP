import {
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  date,
} from "drizzle-orm/pg-core";

export const universityTypeEnum = pgEnum("university_type", ["government", "private"]);
export const requestStatusEnum = pgEnum("request_status", ["new", "old"]);

export const registrationRequests = pgTable(
  "registration_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    college: varchar("college", { length: 160 }).notNull(),
    department: varchar("department", { length: 160 }),
    phone: varchar("phone", { length: 11 }).notNull(),
    nationalId: varchar("national_id", { length: 14 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    birthDate: date("birth_date", { mode: "string" }).notNull(),
    universityType: universityTypeEnum("university_type").notNull(),
    status: requestStatusEnum("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    nationalIdUnique: uniqueIndex("registration_requests_national_id_unique").on(table.nationalId),
    statusCreatedAtIndex: index("registration_requests_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
    phoneIndex: index("registration_requests_phone_idx").on(table.phone),
  }),
);

/**
 * Login failures are kept centrally so the admin rate limit still works across
 * serverless instances. The IP itself is never stored, only an HMAC digest.
 */
export const adminLoginAttempts = pgTable("admin_login_attempts", {
  ipHash: varchar("ip_hash", { length: 64 }).primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true, mode: "date" }),
});

export type RegistrationRequest = typeof registrationRequests.$inferSelect;
export type NewRegistrationRequest = typeof registrationRequests.$inferInsert;
