import { NextResponse } from "next/server";

export function jsonNoStore(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export function getClientAddress(headers: Headers): string {
  // Vercel's reverse proxy supplies X-Forwarded-For. Only the first value is
  // used as the client identifier; absence safely shares a single rate-limit bucket.
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
