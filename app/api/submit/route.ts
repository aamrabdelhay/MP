import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { registrationRequests } from "@/db/schema";
import { registrationSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 32_768) {
    return jsonNoStore({ code: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ code: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore(
      {
        code: "VALIDATION_ERROR",
        fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "form")))],
      },
      { status: 400 },
    );
  }

  try {
    const data = parsed.data;
    const [inserted] = await getDb()
      .insert(registrationRequests)
      .values({
        fullName: data.fullName,
        college: data.college,
        department: data.department.trim() || null,
        phone: data.phone,
        nationalId: data.nationalId,
        address: data.address,
        buildingNumber: data.buildingNumber,
        governorate: data.governorate,
        studyYear: data.studyYear,
        birthDate: data.birthDate,
        universityType: data.universityType,
      })
      .returning({ id: registrationRequests.id });

    return jsonNoStore({ ok: true, id: inserted.id }, { status: 201 });
  } catch (error) {
    const databaseError = error as { code?: string; constraint?: string };
    if (
      databaseError?.code === "23505" &&
      (!databaseError.constraint || databaseError.constraint.includes("national_id"))
    ) {
      return jsonNoStore({ code: "DUPLICATE_NATIONAL_ID" }, { status: 409 });
    }

    console.error("[api/submit] Registration could not be saved.");
    return jsonNoStore({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
