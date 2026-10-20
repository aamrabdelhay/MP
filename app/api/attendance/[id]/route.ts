import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const validId=z.string().uuid();
export async function GET(_request:NextRequest,context:{params:Promise<{id:string}>}) {
 const {id}=await context.params; if(!validId.safeParse(id).success) return jsonNoStore({error:"الكشف غير موجود."},{status:404});
 try {
  const db=getDb(); await db.execute(sql`ALTER TABLE attendance_entries ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ`); const visits=await db.execute(sql`SELECT id,title,created_at AS "createdAt" FROM attendance_visits WHERE id=${id}::uuid LIMIT 1`);
  if(!visits.length) return jsonNoStore({error:"الكشف غير موجود."},{status:404});
  const entries=await db.execute(sql`SELECT id,full_name AS name,phone_number AS phone,status,position,status_changed_at AS "presentAt" FROM attendance_entries WHERE visit_id=${id}::uuid ORDER BY position,created_at`);
  return jsonNoStore({visit:visits[0],entries});
 } catch(error) { console.error("Attendance detail failed",error); return jsonNoStore({error:"تعذّر تحميل الأسماء."},{status:500}); }
}
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}) {
 const {id}=await context.params; if(!validId.safeParse(id).success) return jsonNoStore({error:"الكشف غير موجود."},{status:404});
 let body:unknown; try {body=await request.json();} catch {return jsonNoStore({error:"البيانات غير صحيحة."},{status:400});}
 const reset=z.object({resetAll:z.literal(true)}).safeParse(body);
 try {
  const db=getDb(); await db.execute(sql`ALTER TABLE attendance_entries ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ`);
  if(reset.success){await db.execute(sql`UPDATE attendance_entries SET status='unmarked',status_changed_at=NULL WHERE visit_id=${id}::uuid`);return jsonNoStore({success:true,resetAll:true});}
 } catch(error) {console.error("Attendance reset failed",error);return jsonNoStore({error:"تعذّرت إعادة العلامات."},{status:500});}
 const parsed=z.object({entryId:z.string().uuid(),status:z.enum(["unmarked","present","absent","moving","joker"]).optional(),name:z.string().trim().min(1).max(180).optional(),phone:z.string().trim().max(40).optional(),position:z.number().int().min(0).max(100000).optional()}).refine(v=>v.status!==undefined||v.name!==undefined||v.phone!==undefined||v.position!==undefined).safeParse(body);
 if(!parsed.success) return jsonNoStore({error:"اختيار الحالة غير صحيح."},{status:400});
 try {
  const result=await getDb().execute(sql`UPDATE attendance_entries SET status=COALESCE(${parsed.data.status??null},status), full_name=COALESCE(${parsed.data.name?.replace(/\\s+/g," ").trim()??null},full_name), phone_number=COALESCE(${parsed.data.phone??null},phone_number), position=COALESCE(${parsed.data.position??null},position) WHERE id=${parsed.data.entryId}::uuid AND visit_id=${id}::uuid RETURNING id,full_name AS name,phone_number AS phone,status,position`);
  if(!result.length) return jsonNoStore({error:"الاسم غير موجود في هذا الكشف."},{status:404});
  return jsonNoStore({entry:result[0]});
 } catch(error) {console.error("Attendance status update failed",error);return jsonNoStore({error:"تعذّر حفظ الحالة."},{status:500});}
}
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}) {
 const {id}=await context.params; if(!validId.safeParse(id).success) return jsonNoStore({error:"الكشف غير موجود."},{status:404});
 let body:unknown;try{body=await request.json();}catch{return jsonNoStore({error:"البيانات غير صحيحة."},{status:400});}
 const parsed=z.object({name:z.string().trim().min(1).max(180),phone:z.string().trim().max(40).optional()}).safeParse(body);
 if(!parsed.success)return jsonNoStore({error:"اكتب اسمًا صحيحًا."},{status:400});
 try {
  const result=await getDb().execute(sql`INSERT INTO attendance_entries(visit_id,full_name,phone_number,position) VALUES(${id}::uuid,${parsed.data.name.replace(/\s+/g," ").trim()},${parsed.data.phone??null},COALESCE((SELECT MAX(position)+1 FROM attendance_entries WHERE visit_id=${id}::uuid),0)) RETURNING id,full_name AS name,phone_number AS phone,status,position`);
  if(!result.length)return jsonNoStore({error:"تعذّر إضافة الاسم."},{status:500});
  return jsonNoStore({entry:result[0]},{status:201});
 }catch(error){console.error("Attendance add name failed",error);return jsonNoStore({error:"تعذّر إضافة الاسم. تأكد من وجود الكشف."},{status:500});}
}

export async function DELETE(request:NextRequest,context:{params:Promise<{id:string}>}) {
 const {id}=await context.params; if(!validId.safeParse(id).success) return jsonNoStore({error:"الكشف غير موجود."},{status:404});
 try {
  let body:unknown=null;try{body=await request.json();}catch{}
  const entryPayload=z.object({entryId:z.string().uuid()}).safeParse(body);
  if(entryPayload.success){
   const deleted=await getDb().execute(sql`DELETE FROM attendance_entries WHERE id=${entryPayload.data.entryId}::uuid AND visit_id=${id}::uuid RETURNING id`);
   if(!deleted.length)return jsonNoStore({error:"الاسم غير موجود في هذا الكشف."},{status:404});
   return jsonNoStore({success:true,deletedEntry:true});
  }
  const result=await getDb().execute(sql`DELETE FROM attendance_visits WHERE id=${id}::uuid RETURNING id`);
  if(!result.length) return jsonNoStore({error:"الكشف غير موجود أو تم حذفه بالفعل."},{status:404});
  return jsonNoStore({success:true});
 } catch(error) {console.error("Attendance delete failed",error);return jsonNoStore({error:"تعذّر حذف الكشف. حاول مرة أخرى."},{status:500});}
}
