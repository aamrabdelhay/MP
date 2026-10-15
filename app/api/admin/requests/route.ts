import { NextRequest } from "next/server";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { registrationRequests } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requestHasAdminSession } from "@/lib/auth";
import { jsonNoStore } from "@/lib/http";
import { normalizeDigits } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  if (!requestHasAdminSession(request)) return jsonNoStore({ code: "UNAUTHORIZED" }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") ?? "new";
  if (status !== "new" && status !== "old") {
    return jsonNoStore({ code: "INVALID_STATUS" }, { status: 400 });
  }

  const rawQuery = searchParams.get("q") ?? "";
  const query = normalizeDigits(rawQuery.trim()).slice(0, 100);
  const page = Math.max(1, Math.min(10_000, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1));
  const where = and(
    eq(registrationRequests.status, status),
    query
      ? or(
          ilike(registrationRequests.fullName, `%${escapeLike(query)}%`),
          ilike(registrationRequests.phone, `%${escapeLike(query)}%`),
          ilike(registrationRequests.nationalId, `%${escapeLike(query)}%`),
        )
      : undefined,
  );

  try {
    const db = getDb();
    const [requests, [filteredCount], statusCounts] = await Promise.all([
      db
        .select()
        .from(registrationRequests)
        .where(where)
        .orderBy(desc(registrationRequests.createdAt))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      db.select({ value: count() }).from(registrationRequests).where(where),
      db
        .select({ status: registrationRequests.status, value: count() })
        .from(registrationRequests)
        .groupBy(registrationRequests.status),
    ]);

    const counts = { new: 0, old: 0 };
    for (const row of statusCounts) counts[row.status] = Number(row.value);

    return jsonNoStore({
      requests,
      counts,
      total: Number(filteredCount?.value ?? 0),
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    console.error("[api/admin/requests] Requests could not be loaded.", error instanceof Error ? error.message : "unknown error");
    return jsonNoStore({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
