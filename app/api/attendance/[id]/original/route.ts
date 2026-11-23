import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return jsonNoStore({ error: "الكشف غير موجود." }, { status: 404 });
  }

  try {
    const db = getDb();
    await db.execute(sql`ALTER TABLE attendance_visits ADD COLUMN IF NOT EXISTS original_file_name varchar(255), ADD COLUMN IF NOT EXISTS original_file_type varchar(160), ADD COLUMN IF NOT EXISTS original_file_data text`);
    const rows = await db.execute(sql`SELECT original_file_name AS "fileName", original_file_type AS "fileType", original_file_data AS "fileData" FROM attendance_visits WHERE id = ${id}::uuid LIMIT 1`);
    const file = rows[0] as { fileName: string | null; fileType: string | null; fileData: string | null } | undefined;
    if (!file?.fileName || !file.fileData) return jsonNoStore({ error: "لا يوجد ملف أصلي محفوظ لهذا الكشف." }, { status: 404 });

    const bytes = Buffer.from(file.fileData, "base64");
    const safeName = file.fileName.replace(/[\\r\\n"]/g, "_");
    return new Response(bytes, {
      headers: {
        "Content-Type": file.fileType || "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Original attendance file retrieval failed", error);
    return jsonNoStore({ error: "تعذّر فتح الملف الأصلي." }, { status: 500 });
  }
}
