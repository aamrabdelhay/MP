import "server-only";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "capital_admin_session";
export const ADMIN_SESSION_DURATION_SECONDS = 4 * 60 * 60;

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "2030";
}

function getSessionSecret(): string {
  const configured = process.env.ADMIN_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET must be configured with at least 32 characters in production.");
  }

  // A deterministic development-only fallback keeps first-run setup simple.
  return `development-only:${process.env.ADMIN_PASSWORD || "2030"}:do-not-deploy`;
}

export function passwordsMatch(candidate: string, expected: string): boolean {
  const candidateDigest = createHash("sha256").update(candidate).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export function createAdminSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ expiresAt: Date.now() + ADMIN_SESSION_DURATION_SECONDS * 1000, version: 1 }),
  ).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator <= 0 || separator === token.length - 1) return false;

  const payload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  let expectedSignature: Buffer;
  let actualSignature: Buffer;
  try {
    expectedSignature = createHmac("sha256", getSessionSecret()).update(payload).digest();
    actualSignature = Buffer.from(suppliedSignature, "base64url");
  } catch {
    return false;
  }

  if (actualSignature.length !== expectedSignature.length) return false;
  if (!timingSafeEqual(actualSignature, expectedSignature)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      expiresAt?: unknown;
      version?: unknown;
    };
    return data.version === 1 && typeof data.expiresAt === "number" && data.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function requestHasAdminSession(request: NextRequest): boolean {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export function setAdminSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

/** A keyed digest avoids storing a visitor's raw IP address in PostgreSQL. */
export function hashLoginIdentifier(identifier: string): string {
  return createHmac("sha256", getSessionSecret()).update(identifier).digest("hex");
}
