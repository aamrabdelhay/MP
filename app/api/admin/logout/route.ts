import { NextRequest } from "next/server";
import { clearAdminSessionCookie, requestHasAdminSession } from "@/lib/auth";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authenticated = requestHasAdminSession(request);
  const response = jsonNoStore(
    authenticated ? { ok: true } : { code: "UNAUTHORIZED" },
    { status: authenticated ? 200 : 401 },
  );
  // Clear stale cookies as well, even if their session has already expired.
  clearAdminSessionCookie(response);
  return response;
}
