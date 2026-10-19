"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Circle, FileSpreadsheet, Navigation, Search, Star, Trash2, UserPlus, X } from "lucide-react";
import * as XLSX from "xlsx";

type Visit = { id: string; title: string; total: number; present: number; absent: number; moving: number; joker: number; unmarked: number; createdAt?: string };
type Entry = { id: string; name: string; status: "present" | "absent" | "moving" | "joker" | "unmarked"; position: number };
type Detail = { visit: Visit; entries: Entry[] };

export function AttendancePage() {
 const router = useRouter();
 const [visits,setVisits]=useState<Visit[]>([]);
 const [selected,setSelected]=useState<Detail|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [search,setSearch]=useState("");
 const [title,setTitle]=useState("");
 const [newName,setNewName]=useState("");
 const [names,setNames]=useState<string[]>([]);
 const [fileName,setFileName]=useState("");
 const [isOnline,setIsOnline]=useState(true);
 useEffect(()=>{
  setIsOnline(navigator.onLine);
  const online=()=>setIsOnline(true),offline=()=>setIsOnline(false);
  window.addEventListener("online",online);window.addEventListener("offline",offline);
  if("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(()=>{});
  try{const cached=localStorage.getItem("attendance-offline-cache");if(cached){const data=JSON.parse(cached);if(!navigator.onLine){setVisits(data.visits||[]);setSelected(data.selected||null);setLoading(false);}}}catch{}
  return()=>{window.removeEventListener("online",online);window.removeEventListener("offline",offline);};
 },[]);
 useEffect(()=>{try{localStorage.setItem("attendance-offline-cache",JSON.stringify({visits,selected}));}catch{}},[visits,selected]);

 const refreshVisits=useCallback(async()=>{
  try { const response=await fetch("/api/attendance",{cache:"no-store"}); const data=await response.json(); if(!response.ok) throw new Error(data.error||"تعذّر تحميل الكشوف"); setVisits(data.visits||[]); }
  catch(error){try{const cached=localStorage.getItem("attendance-offline-cache");if(cached){const data=JSON.parse(cached);setVisits(data.visits||[]);if(!navigator.onLine)setMessage("أنت تعمل دون اتصال. يتم عرض آخر نسخة محفوظة على هذا الجهاز.");else setMessage(error instanceof Error?error.message:"حدث خطأ غير متوقع");}else setMessage(error instanceof Error?error.message:"حدث خطأ غير متوقع");}catch{setMessage("تعذّر تحميل الكشوف المحفوظة.");}}
  finally{setLoading(false);}
 },[]);
 const loadVisit=useCallback(async(id:string)=>{
  try {const response=await fetch("/api/attendance/"+id,{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر فتح الكشف");setSelected(data);setMessage("");}
  catch(error){try{const cached=localStorage.getItem("attendance-offline-cache");const data=cached?JSON.parse(cached):null;const local=data?.selected;if(!navigator.onLine&&local&&local.visit?.id===id){setSelected(local);setMessage("أنت تعمل دون اتصال. التعديلات محفوظة على هذا الجهاز فقط.");}else{setMessage(error instanceof Error?error.message:"تعذّر فتح الكشف");setSelected(null);}}catch{setMessage("تعذّر فتح الكشف");setSelected(null);}}
 },[]);
 useEffect(()=>{void refreshVisits();},[refreshVisits]);
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get("id");if(id)void loadVisit(id);},[loadVisit]);
 const counts=useMemo(()=>{const entries=selected?.entries||[];return {present:entries.filter(e=>e.status==="present").length,absent:entries.filter(e=>e.status==="absent").length,moving:entries.filter(e=>e.status==="moving").length,joker:entries.filter(e=>e.status==="joker").length,unmarked:entries.filter(e=>e.status==="unmarked").length};},[selected]);
 const filtered=useMemo(()=>{const q=search.trim().toLocaleLowerCase("ar");return (selected?.entries||[]).filter(e=>e.name.toLocaleLowerCase("ar").includes(q));},[selected,search]);
 async function chooseFile(file?:File){
  if(!file)return;
  try{
   const buffer=await file.arrayBuffer();const workbook=XLSX.read(buffer,{type:"array"});const sheet=workbook.Sheets[workbook.SheetNames[0]];
   if(!sheet)throw new Error("ملف Excel لا يحتوي على ورقة بيانات.");
   const rows=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,blankrows:false,defval:""});
   if(!rows.length)throw new Error("الملف لا يحتوي على أسماء.");
   const first=rows[0].map(v=>String(v??"").trim());
   const headerIndex=first.findIndex(v=>/^(الاسم|اسم الطالب|اسم الطالبة|اسم الطالب\/ة|name|full name|student name)$/i.test(v));
   const column=headerIndex>=0?headerIndex:Math.max(0,first.findIndex(v=>String(v).trim()!==""));
   const start=headerIndex>=0?1:0;
   const parsed=rows.slice(start).map(row=>String(row[column]??"").replace(/\s+/g," ").trim()).filter(Boolean);
   if(!parsed.length)throw new Error("لم أجد أسماء في العمود الأول. تأكد أن الأسماء في عمود واحد.");
   setNames([...new Set(parsed)]);setFileName(file.name);
   if(!title.trim())setTitle(file.name.replace(/\.(xlsx|xls|csv)$/i,"").replace(/[_-]+/g," ").trim());
   setMessage("");
  }catch(error){setMessage(error instanceof Error?error.message:"تعذّر قراءة الملف");}
 }
 async function createVisit(){
  if(!title.trim()||!names.length){setMessage("اكتب اسم الزيارة وارفع ملف Excel يحتوي على الأسماء.");return;}
  setBusy(true);setMessage("");
  try{const response=await fetch("/api/attendance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:title.trim(),names})});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر إنشاء الكشف");setTitle("");setNames([]);setFileName("");await refreshVisits();router.push("/attendance?id="+data.visit.id);await loadVisit(data.visit.id);}
  catch(error){const text=error instanceof Error?error.message:"حدث خطأ";setMessage(text);}
  finally{setBusy(false);}
 }
 async function changeStatus(entry:Entry,status:Entry["status"]){
  if(!selected)return;
  const previous=selected;setSelected({...selected,entries:selected.entries.map(e=>e.id===entry.id?{...e,status}:e)});
  try{const response=await fetch("/api/attendance/"+selected.visit.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({entryId:entry.id,status})});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر حفظ الحالة");await refreshVisits();}
  catch(error){if(!navigator.onLine){setMessage("تم حفظ التغيير على هذا الجهاز دون اتصال. سيظل محليًا حتى تعود للشبكة.");return;}setSelected(previous);const text=error instanceof Error?error.message:"تعذّر حفظ الحالة";setMessage(text);}
 }
 async function deleteVisit(visit:Visit){
  if(!window.confirm(`هل أنت متأكد من حذف كشف "${visit.title}"؟ سيتم حذف جميع الأسماء وحالات الحضور التابعة له نهائيًا.`))return;
  setBusy(true);setMessage("");
  try{const response=await fetch("/api/attendance/"+visit.id,{method:"DELETE"});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر حذف الكشف");setVisits(current=>current.filter(item=>item.id!==visit.id));setMessage("تم حذف الكشف بنجاح.");}
  catch(error){setMessage(error instanceof Error?error.message:"تعذّر حذف الكشف");}
  finally{setBusy(false);}
 }
 async function addName(){
  if(!selected||!newName.trim())return;setBusy(true);
  try{const response=await fetch("/api/attendance/"+selected.visit.id,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newName.trim()})});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر إضافة الاسم");setSelected({...selected,entries:[...selected.entries,data.entry]});setNewName("");setMessage("");await refreshVisits();}
  catch(error){const text=error instanceof Error?error.message:"تعذّر إضافة الاسم";setMessage(text);}
  finally{setBusy(false);}
 }
 return <main className="attendance-page" dir="rtl">
  <div className="attendance-wrap">
   <header className="attendance-header"><span className={"attendance-kicker "+(isOnline?"":"offline-badge")}>{isOnline?"متصل بالإنترنت":"وضع عدم الاتصال"}</span><div><span className="attendance-kicker">جامعة العاصمة</span><h1>كشف الحضور</h1><p>إدارة حضور الزيارات العسكرية</p></div></header>
   {message&&<div className="attendance-message" role="alert">{message}{message.includes("سجّل الدخول")&&<a href="/admin"> تسجيل الدخول للإدارة</a>}</div>}
   {!selected&&<section className="attendance-upload">
    <div className="attendance-section-title"><FileSpreadsheet size={22}/><div><h2>إنشاء كشف زيارة جديد</h2><p>ارفع ملف Excel يحتوي على الأسماء في عمود واحد.</p></div></div>
    <label className="attendance-label">اسم الزيارة<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={180} placeholder="مثال: زيارة متحف القوات الجوية"/></label>
    <label className="attendance-file"><FileSpreadsheet size={21}/><span>{fileName||"اختيار ملف Excel أو CSV"}</span><input type="file" accept=".xlsx,.xls,.csv" onChange={e=>void chooseFile(e.target.files?.[0])}/></label>
    {names.length>0&&<p className="attendance-file-count">تم استخراج {names.length} اسمًا من الملف.</p>}
    <button className="attendance-orange" disabled={busy||!names.length||!title.trim()} onClick={()=>void createVisit()}>{busy?"جارٍ الحفظ…":"إنشاء كشف الحضور"}</button>
   </section>}
   {selected&&<section className="attendance-roster">
    <div className="attendance-roster-head"><button className="attendance-back" onClick={()=>{setSelected(null);setSearch("");setMessage("");router.push("/attendance");}}><ArrowRight size={17}/> كل الكشوف</button><div><span className="attendance-kicker">كشف الزيارة</span><h2>{selected.visit.title}</h2></div></div>
    <div className="attendance-stats">
     <div className="attendance-stat stat-present"><Check size={20}/><span>حضور</span><strong>{counts.present}</strong></div>
     <div className="attendance-stat stat-absent"><X size={20}/><span>غياب</span><strong>{counts.absent}</strong></div>
     <div className="attendance-stat stat-moving"><Navigation size={19}/><span>في الطريق</span><strong>{counts.moving}</strong></div>
     <div className="attendance-stat stat-joker"><Star size={19}/><span>جوكر (غير محسوب)</span><strong>{counts.joker}</strong></div>
     <div className="attendance-stat stat-unmarked"><Circle size={19}/><span>لم يُحدد</span><strong>{counts.unmarked}</strong></div>
    </div>
    <div className="attendance-tools"><label className="attendance-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم…"/></label><span>{filtered.length} ظاهر · {selected.entries.length-counts.joker} اسم محسوب من إجمالي الكشف</span></div>
    <form className="attendance-add" onSubmit={e=>{e.preventDefault();void addName();}}><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="إضافة اسم جديد إلى الكشف" maxLength={180}/><button disabled={busy||!newName.trim()}><UserPlus size={18}/> إضافة اسم</button></form>
    <div className="attendance-list">{filtered.map((entry,index)=><div className={"attendance-row row-"+entry.status} key={entry.id}><span className="attendance-number">{index+1}</span><span className="attendance-name">{entry.name}</span><div className="attendance-markers" aria-label={"حالة "+entry.name}><button title="حضور" aria-label={"تسجيل حضور "+entry.name} className={entry.status==="present"?"marker-active":""} onClick={()=>void changeStatus(entry,entry.status==="present"?"unmarked":"present")}><Check size={18}/></button><button title="غياب" aria-label={"تسجيل غياب "+entry.name} className={entry.status==="absent"?"marker-active":""} onClick={()=>void changeStatus(entry,entry.status==="absent"?"unmarked":"absent")}><X size={18}/></button><button title="في الطريق للمكان" aria-label={"تسجيل أن "+entry.name+" في الطريق للمكان"} className={entry.status==="moving"?"marker-active":""} onClick={()=>void changeStatus(entry,entry.status==="moving"?"unmarked":"moving")}><Navigation size={17}/></button><button title="جوكر — لا يُحتسب ضمن العدد" aria-label={"تحديد "+entry.name+" كجوكر غير محسوب"} className={entry.status==="joker"?"marker-active":""} onClick={()=>void changeStatus(entry,entry.status==="joker"?"unmarked":"joker")}><Star size={16}/></button><button title="لم يُحدد" aria-label={"إلغاء تحديد "+entry.name} className={entry.status==="unmarked"?"marker-active":""} onClick={()=>void changeStatus(entry,"unmarked")}><Circle size={16}/></button></div></div>)}
    {filtered.length===0&&<p className="attendance-empty">لا توجد أسماء مطابقة للبحث.</p>}</div>
   </section>}
   {!selected&&<section className="attendance-visits"><div className="attendance-section-title"><h2>كشوف الزيارات المحفوظة</h2></div>
    {loading?<p className="attendance-empty">جارٍ تحميل الكشوف…</p>:visits.length===0?<p className="attendance-empty">لا توجد كشوف بعد. سجّل الدخول للإدارة لإنشاء أول كشف.</p>:<div className="attendance-visit-list">{visits.map(visit=><div key={visit.id} className="attendance-visit-card"><button className="attendance-visit-open" onClick={()=>{router.push("/attendance?id="+visit.id);void loadVisit(visit.id);}}><span><strong>{visit.title}</strong><small>{visit.total} اسمًا محسوبًا</small></span><span className="visit-mini-counts"><b>{visit.present} حضور</b><b>{visit.absent} غياب</b><b>{visit.moving} في الطريق</b><b>{visit.joker} جوكر</b><b>{visit.unmarked} لم يُحدد</b></span><ArrowRight size={18}/></button><button className="attendance-delete" disabled={busy} onClick={()=>void deleteVisit(visit)}><Trash2 size={16}/> حذف الكشف</button></div>)}</div>}
   </section>}
   <p className="attendance-security">{isOnline?"تُحفظ البيانات المتصلة على الخادم.":"وضع عدم الاتصال يعرض آخر نسخة محفوظة على هذا الجهاز؛ قد لا تتزامن التعديلات مع الخادم."}</p>
  </div>
 </main>;
}
