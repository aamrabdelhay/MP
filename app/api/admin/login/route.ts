import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { adminLoginAttempts } from "@/db/schema";
import { createAdminSessionToken, getAdminPassword, hashLoginIdentifier, passwordsMatch, setAdminSessionCookie } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getClientAddress, jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const loginSchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4_096) return jsonNoStore({ code: "INVALID_REQUEST" }, { status: 413 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ code: "INVALID_REQUEST" }, { status: 400 });

  // A valid administrator password must not be blocked by a missing rate-limit table.
  // Failed attempts still require persistent storage and fail closed if it is unavailable.
  if (passwordsMatch(parsed.data.password, getAdminPassword())) {
    let token: string;
    try {
      token = createAdminSessionToken();
    } catch (error) {
      console.error("[api/admin/login] Admin session could not be created.", error instanceof Error ? error.message : "unknown error");
      return jsonNoStore({ code: "LOGIN_UNAVAILABLE" }, { status: 503 });
    }

    const response = jsonNoStore({ ok: true });
    setAdminSessionCookie(response, token);

    try {
      const ipHash = hashLoginIdentifier(getClientAddress(request.headers));
      await getDb().delete(adminLoginAttempts).where(eq(adminLoginAttempts.ipHash, ipHash));
    } catch (error) {
      // Clearing the successful attempt is best-effort; signing in should not depend
      // on a rate-limit table that may be awaiting its migration.
      console.warn("[api/admin/login] Could not clear successful login attempt.", error instanceof Error ? error.message : "unknown error");
    }
    return response;
  }

  try {
    const db = getDb();
    const ipHash = hashLoginIdentifier(getClientAddress(request.headers));
    const [existing] = await db
      .select({ blockedUntil: adminLoginAttempts.blockedUntil })
      .from(adminLoginAttempts)
      .where(eq(adminLoginAttempts.ipHash, ipHash))
      .limit(1);

    if (existing?.blockedUntil && existing.blockedUntil.getTime() > Date.now()) {
      const retryAfter = Math.max(1, Math.ceil((existing.blockedUntil.getTime() - Date.now()) / 1000));
      const response = jsonNoStore({ code: "RATE_LIMITED" }, { status: 429 });
      response.headers.set("Retry-After", String(retryAfter));
      return response;
    }

    const expiredWindow = sql`(
      ${adminLoginAttempts.windowStartedAt} <= NOW() - (${WINDOW_MINUTES} * INTERVAL '1 minute')
      OR (
        ${adminLoginAttempts.blockedUntil} IS NOT NULL
        AND ${adminLoginAttempts.blockedUntil} <= NOW()
      )
    )`;

    const [attempt] = await db
      .insert(adminLoginAttempts)
      .values({ ipHash, attempts: 1, windowStartedAt: new Date(), blockedUntil: null })
      .onConflictDoUpdate({
        target: adminLoginAttempts.ipHash,
        set: {
          attempts: sql`CASE WHEN ${expiredWindow} THEN 1 ELSE ${adminLoginAttempts.attempts} + 1 END`,
          windowStartedAt: sql`CASE WHEN ${expiredWindow} THEN NOW() ELSE ${adminLoginAttempts.windowStartedAt} END`,
          blockedUntil: sql`CASE
            WHEN ${expiredWindow} THEN NULL
            WHEN ${adminLoginAttempts.attempts} + 1 >= ${MAX_ATTEMPTS}
              THEN NOW() + (${WINDOW_MINUTES} * INTERVAL '1 minute')
            ELSE ${adminLoginAttempts.blockedUntil}
          END`,
        },
      })
      .returning({ attempts: adminLoginAttempts.attempts, blockedUntil: adminLoginAttempts.blockedUntil });

    if (attempt?.attempts >= MAX_ATTEMPTS && attempt.blockedUntil) {
      const retryAfter = Math.max(1, Math.ceil((attempt.blockedUntil.getTime() - Date.now()) / 1000));
      const response = jsonNoStore({ code: "RATE_LIMITED" }, { status: 429 });
      response.headers.set("Retry-After", String(retryAfter));
      return response;
    }
    return jsonNoStore({ code: "INVALID_PASSWORD" }, { status: 401 });
  } catch (error) {
    console.error("[api/admin/login] Login service is unavailable.", error instanceof Error ? error.message : "unknown error");
    return jsonNoStore({ code: "LOGIN_UNAVAILABLE" }, { status: 503 });
  }
}