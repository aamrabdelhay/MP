import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[database] DATABASE_URL is missing from the production build environment.");
  process.exit(1);
}

const requiredColumns = {
  registration_requests: [
    "id",
    "full_name",
    "college",
    "department",
    "phone",
    "national_id",
    "address",
    "birth_date",
    "university_type",
    "status",
    "created_at",
  ],
  admin_login_attempts: ["ip_hash", "attempts", "window_started_at", "blocked_until"],
  attendance_visits: ["id", "title", "created_at"],
  attendance_entries: ["id", "visit_id", "full_name", "status", "position", "created_at"],
};

const requiredEnums = {
  request_status: ["new", "old"],
  university_type: ["government", "private"],
};

const sql = postgres(connectionString, {
  max: 1,
  connect_timeout: 10,
  prepare: false,
});

try {
  const columns = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('registration_requests', 'admin_login_attempts', 'attendance_visits', 'attendance_entries')
  `;

  const columnNames = new Map();
  for (const row of columns) {
    const current = columnNames.get(row.table_name) ?? new Set();
    current.add(row.column_name);
    columnNames.set(row.table_name, current);
  }

  const missingColumns = [];
  for (const [table, expected] of Object.entries(requiredColumns)) {
    for (const column of expected) {
      if (!columnNames.get(table)?.has(column)) missingColumns.push(`${table}.${column}`);
    }
  }

  const enumRows = await sql`
    SELECT t.typname AS type_name, e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname IN ('request_status', 'university_type')
  `;

  const enumValues = new Map();
  for (const row of enumRows) {
    const current = enumValues.get(row.type_name) ?? new Set();
    current.add(row.enum_value);
    enumValues.set(row.type_name, current);
  }

  const missingEnumValues = [];
  for (const [type, expected] of Object.entries(requiredEnums)) {
    for (const value of expected) {
      if (!enumValues.get(type)?.has(value)) missingEnumValues.push(`${type}.${value}`);
    }
  }

  if (missingColumns.length || missingEnumValues.length) {
    if (missingColumns.length) {
      console.error("[database] Missing required columns:", missingColumns.join(", "));
    }
    if (missingEnumValues.length) {
      console.error("[database] Missing required enum values:", missingEnumValues.join(", "));
    }
    process.exitCode = 1;
  } else {
    console.log("[database] Production schema verified: registration and admin tables are ready.");
  }
} catch (error) {
  console.error(
    "[database] Production schema verification failed:",
    error instanceof Error ? error.message : "unknown database error",
  );
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 }).catch(() => {});
}
