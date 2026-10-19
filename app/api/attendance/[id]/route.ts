import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { requestHasAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const validId=z.string().uuid();
export async function GET(_request:NextRequest,context:{params:Promise<{id:string}>}) {
 const {id}=await context.params; if(!validId.safeParse(id).success) return jsonNoStore({error:"الكشف غير موجود."},{status:404});
 try {
  const db=getDb(); const visits=await db.execute(sql`SELECT id,title,created_at AS "createdAt" FROM attendance_visits WHERE id=${id}::uuid LIMIT 1`);
  if(!visits.length) return jsonNoStore({error:"الكشف غير موجود."},{status:404});
  const entries=await db.execute(sql`SELECT id,full_name AS name,status,position FROM attendance_entries WHERE visit_id=${id}::uuid ORDER BY position,created_at`);
  return jsonNoStore({visit:visits[0],entries});
 } catch(error) { console.error("Attendance detail failed",error); return jsonNoStore({error:"تعذّر تحميل الأسماء."},{status:500}); }
}
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}) {
 if(!requestHasAdminSession(request)) return jsonNoStore({error:"سجّل الدخول إلى الإدارة أولاً لتعديل الكشف."},{status:401});
 const {id}=await context.params; if(!validId.safeParse(id).success) return jsonNoStore({error:"الكشف غير موجود."},{status:404});
 let body:unknown; try {body=await request.json();} catch {return jsonNoStore({error:"البيانات غير صحيحة."},{status:400});}
 const parsed=z.object({entryId:z.string().uuid(),status:z.enum(["unmarked","present","absent","moving"])}).safeParse(body);
 if(!parsed.success) return jsonNoStore({error:"اختيار الحالة غير صحيح."},{status:400});
 try {
  const result=await getDb().execute(sql`UPDATE attendance_entries SET status=${parsed.data.status} WHERE id=${parsed.data.entryId}::uuid AND visit_id=${id}::uuid RETURNING id,status`);
  if(!result.length) return jsonNoStore({error:"الاسم غير موجود في هذا الكشف."},{status:404});
  return jsonNoStore({entry:result[0]});
 } catch(error) {console.error("Attendance status update failed",error);return jsonNoStore({error:"تعذّر حفظ الحالة."},{status:500});}
}
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}) {
 if(!requestHasAdminSession(request)) return jsonNoStore({error:"سجّل الدخول إلى الإدارة أولاً لإضافة أسماء."},{status:401});
 const {id}=await context.params; if(!validId.safeParse(id).success) return jsonNoStore({error:"الكشف غير موجود."},{status:404});
 let body:unknown;try{body=await request.json();}catch{return jsonNoStore({error:"البيانات غير صحيحة."},{status:400});}
 const parsed=z.object({name:z.string().trim().min(1).max(180)}).safeParse(body);
 if(!parsed.success)return jsonNoStore({error:"اكتب اسمًا صحيحًا."},{status:400});
 try {
  const result=await getDb().execute(sql`INSERT INTO attendance_entries(visit_id,full_name,position) VALUES(${id}::uuid,${parsed.data.name.replace(/\s+/g," ").trim()},COALESCE((SELECT MAX(position)+1 FROM attendance_entries WHERE visit_id=${id}::uuid),0)) RETURNING id,full_name AS name,status,position`);
  if(!result.length)return jsonNoStore({error:"تعذّر إضافة الاسم."},{status:500});
  return jsonNoStore({entry:result[0]},{status:201});
 }catch(error){console.error("Attendance add name failed",error);return jsonNoStore({error:"تعذّر إضافة الاسم. تأكد من وجود الكشف."},{status:500});}
}
