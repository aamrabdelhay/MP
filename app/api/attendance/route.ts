import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { requestHasAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const createSchema = z.object({ title: z.string().trim().min(1).max(180), names: z.array(z.union([z.string().trim().min(1).max(180),z.object({name:z.string().trim().min(1).max(180),phone:z.string().trim().max(40).optional()})])).min(1).max(2000) });
export async function GET() {
 try {
  const result = await getDb().execute(sql`SELECT v.id,v.title,v.created_at AS "createdAt",COUNT(e.id) FILTER (WHERE e.status <> 'joker')::int AS total,COUNT(e.id) FILTER (WHERE e.status='present')::int AS present,COUNT(e.id) FILTER (WHERE e.status='absent')::int AS absent,COUNT(e.id) FILTER (WHERE e.status='unmarked')::int AS unmarked,COUNT(e.id) FILTER (WHERE e.status='moving')::int AS moving,COUNT(e.id) FILTER (WHERE e.status='joker')::int AS joker FROM attendance_visits v LEFT JOIN attendance_entries e ON e.visit_id=v.id GROUP BY v.id ORDER BY v.created_at DESC`);
  return jsonNoStore({visits:result});
 } catch(error) { console.error("Attendance list failed",error); return jsonNoStore({error:"تعذّر تحميل كشوف الحضور. تأكد من إعداد قاعدة البيانات."},{status:500}); }
}
export async function POST(request:NextRequest) {
 if(!requestHasAdminSession(request)) return jsonNoStore({error:"سجّل الدخول إلى الإدارة أولاً لإضافة كشف حضور."},{status:401});
 let body:unknown; try { body=await request.json(); } catch { return jsonNoStore({error:"البيانات المرسلة غير صحيحة."},{status:400}); }
 const parsed=createSchema.safeParse(body);
 if(!parsed.success) return jsonNoStore({error:"أدخل اسم الزيارة وقائمة أسماء صحيحة."},{status:400});
 const normalized=parsed.data.names.map(item=>{const entry=typeof item==="string"?{name:item,phone:""}:item;return {name:entry.name.replace(/\s+/g," ").trim(),phone:entry.phone??""};}).filter(entry=>entry.name);
 const names=[...new Map(normalized.map(entry=>[entry.name.toLocaleLowerCase("ar"),entry])).values()];
 if(!names.length) return jsonNoStore({error:"لم يتم العثور على أسماء في الملف."},{status:400});
 try {
  const db=getDb(); const result=await db.execute(sql`INSERT INTO attendance_visits(title) VALUES(${parsed.data.title}) RETURNING id,title`);
  const visit=result[0] as {id:string;title:string}|undefined; if(!visit) throw new Error("Could not create visit");
  for(let i=0;i<names.length;i++) await db.execute(sql`INSERT INTO attendance_entries(visit_id,full_name,phone_number,position) VALUES(${visit.id}::uuid,${names[i].name},${names[i].phone||null},${i})`);
  return jsonNoStore({visit},{status:201});
 } catch(error) { console.error("Attendance create failed",error); return jsonNoStore({error:"تعذّر حفظ كشف الحضور. حاول مرة أخرى."},{status:500}); }
}
