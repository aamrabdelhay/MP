import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { registrationRequests } from "@/db/schema";
import { requestHasAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();
const statusSchema = z.object({ status: z.enum(["new", "old"]) });

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!requestHasAdminSession(request)) return jsonNoStore({ code: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return jsonNoStore({ code: "NOT_FOUND" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ code: "INVALID_STATUS" }, { status: 400 });

  try {
    const [updated] = await getDb()
      .update(registrationRequests)
      .set({ status: parsed.data.status })
      .where(eq(registrationRequests.id, id))
      .returning({ id: registrationRequests.id, status: registrationRequests.status });

    if (!updated) return jsonNoStore({ code: "NOT_FOUND" }, { status: 404 });
    return jsonNoStore({ ok: true, request: updated });
  } catch (error) {
    console.error("[api/admin/requests/:id] Request status could not be updated.", error instanceof Error ? error.message : "unknown error");
    return jsonNoStore({ code: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!requestHasAdminSession(request)) return jsonNoStore({ code: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return jsonNoStore({ code: "NOT_FOUND" }, { status: 404 });

  try {
    const [deleted] = await getDb()
      .delete(registrationRequests)
      .where(eq(registrationRequests.id, id))
      .returning({ id: registrationRequests.id });

    if (!deleted) return jsonNoStore({ code: "NOT_FOUND" }, { status: 404 });
    return jsonNoStore({ ok: true });
  } catch (error) {
    console.error("[api/admin/requests/:id] Request could not be deleted.", error instanceof Error ? error.message : "unknown error");
    return jsonNoStore({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
