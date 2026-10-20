"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUp, Check, Circle, Copy, FileSpreadsheet, Moon, Navigation, Pencil, Phone, Search, Star, Sun, Trash2, UserPlus, X } from "lucide-react";
import * as XLSX from "xlsx";

type Visit = { id: string; title: string; total: number; present: number; absent: number; moving: number; joker: number; unmarked: number; createdAt?: string };
type Entry = { id: string; name: string; phone?: string | null; presentAt?: string | null; status: "present" | "absent" | "moving" | "joker" | "unmarked"; position: number };
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
 const [names,setNames]=useState<Array<{name:string;phone:string}>>([]);
 const [fileName,setFileName]=useState("");
 const [isOnline,setIsOnline]=useState(true);
 const [nightMode,setNightMode]=useState(false);
 useEffect(()=>{
  setNightMode(localStorage.getItem("attendance-night-mode")==="true");
  setIsOnline(navigator.onLine);
  const online=()=>setIsOnline(true),offline=()=>setIsOnline(false);
  window.addEventListener("online",online);window.addEventListener("offline",offline);
  if("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(()=>{});
  try{const cached=localStorage.getItem("attendance-offline-cache");if(cached){const data=JSON.parse(cached);setVisits(data.visits||[]);if(data.selected&&(!navigator.onLine||data.selected.visit?.id?.startsWith("local-")))setSelected(data.selected);if(!navigator.onLine)setLoading(false);}}catch{}
  return()=>{window.removeEventListener("online",online);window.removeEventListener("offline",offline);};
 },[]);
 useEffect(()=>{try{localStorage.setItem("attendance-offline-cache",JSON.stringify({visits,selected}));}catch{}},[visits,selected]);

 const refreshVisits=useCallback(async()=>{
  try { const response=await fetch("/api/attendance",{cache:"no-store"}); const data=await response.json(); if(!response.ok) throw new Error(data.error||"تعذّر تحميل الكشوف"); const localVisits=(()=>{try{return (JSON.parse(localStorage.getItem("attendance-offline-cache")||"{}").visits||[]).filter((v:Visit)=>v.id.startsWith("local-"));}catch{return [];}})();setVisits([...(data.visits||[]),...localVisits]); }
  catch(error){try{const cached=localStorage.getItem("attendance-offline-cache");if(cached){const data=JSON.parse(cached);setVisits(data.visits||[]);if(!navigator.onLine)setMessage("أنت تعمل دون اتصال. يتم عرض آخر نسخة محفوظة على هذا الجهاز.");else setMessage(error instanceof Error?error.message:"حدث خطأ غير متوقع");}else setMessage(error instanceof Error?error.message:"حدث خطأ غير متوقع");}catch{setMessage("تعذّر تحميل الكشوف المحفوظة.");}}
  finally{setLoading(false);}
 },[]);
 const loadVisit=useCallback(async(id:string)=>{
  try {const response=await fetch("/api/attendance/"+id,{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر فتح الكشف");setSelected(data);setMessage("");}
  catch(error){try{const cached=localStorage.getItem("attendance-offline-cache");const data=cached?JSON.parse(cached):null;const local=data?.selected;if(local&&local.visit?.id===id&&(id.startsWith("local-")||!navigator.onLine)){setSelected(local);setMessage("أنت تعمل دون اتصال. التعديلات محفوظة على هذا الجهاز فقط.");}else{setMessage(error instanceof Error?error.message:"تعذّر فتح الكشف");setSelected(null);}}catch{setMessage("تعذّر فتح الكشف");setSelected(null);}}
 },[]);
 useEffect(()=>{void refreshVisits();},[refreshVisits]);
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get("id");if(id)void loadVisit(id);},[loadVisit]);
 const counts=useMemo(()=>{const entries=selected?.entries||[];return {present:entries.filter(e=>e.status==="present").length,absent:entries.filter(e=>e.status==="absent").length,moving:entries.filter(e=>e.status==="moving").length,joker:entries.filter(e=>e.status==="joker").length,unmarked:entries.filter(e=>e.status==="unmarked").length};},[selected]);
 const filtered=useMemo(()=>{const q=search.trim().toLocaleLowerCase("ar");const priority:Record<Entry["status"],number>={joker:0,present:1,moving:2,unmarked:3,absent:4};return (selected?.entries||[]).filter(e=>e.name.toLocaleLowerCase("ar").includes(q)).sort((a,b)=>priority[a.status]-priority[b.status]||a.name.localeCompare(b.name,"ar",{sensitivity:"base"})||a.position-b.position);},[selected,search]);
 async function chooseFile(file?:File){
  if(!file)return;
  try{
   const buffer=await file.arrayBuffer();const workbook=XLSX.read(buffer,{type:"array"});const sheet=workbook.Sheets[workbook.SheetNames[0]];
   if(!sheet)throw new Error("ملف Excel لا يحتوي على ورقة بيانات.");
   const rows=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,blankrows:false,defval:"",raw:false});
   if(!rows.length)throw new Error("الملف لا يحتوي على أسماء.");
   const first=rows[0].map(v=>String(v??"").trim());
   const normalizeHeader=(value:string)=>value.toLocaleLowerCase("ar").trim().replaceAll("_"," ").replaceAll("ـ"," ").replace(/\s+/g," ");
   const headerIndex=first.findIndex(v=>/^(الاسم|اسم الطالب|اسم الطالبة|اسم الطالب\/ة|اسم الطالب بالكامل|الاسم بالكامل|اسم المتدرب|name|full name|student name)$/i.test(normalizeHeader(v)));
   let phoneIndex=first.findIndex(v=>/(phone|mobile|telephone|tel|رقم.*(هاتف|تليفون|موبايل|جوال)|هاتف|تليفون|موبايل|جوال|رقم.*(اتصال|محمول))/i.test(normalizeHeader(v)));
   if(phoneIndex<0&&headerIndex<0){const phonePattern=/^[+()\\d٠-٩۰-۹ .-]{7,20}$/;const candidateCount=Math.max(0,...rows.map(row=>row.length));for(let col=1;col<candidateCount;col++){const values=rows.slice(0,Math.min(rows.length,12)).map(row=>String(row[col]??"").trim()).filter(Boolean);if(values.length>=2&&values.filter(value=>phonePattern.test(value)&&/[0-9٠-٩۰-۹]/.test(value)).length/values.length>=0.7){phoneIndex=col;break;}}}
   const column=headerIndex>=0?headerIndex:Math.max(0,first.findIndex(v=>String(v).trim()!==""));
   const start=headerIndex>=0?1:0;
   const parsed=rows.slice(start).map(row=>({name:String(row[column]??"").replace(/\s+/g," ").trim(),phone:phoneIndex>=0?String(row[phoneIndex]??"").trim():""})).filter(entry=>entry.name);
   if(!parsed.length)throw new Error("لم أجد أسماء في العمود الأول. تأكد أن الأسماء في عمود واحد.");
   const unique=[...new Map(parsed.map(entry=>[entry.name.toLocaleLowerCase("ar"),entry])).values()];
   setNames(unique);setFileName(file.name);
   if(!title.trim())setTitle(file.name.replace(/\.(xlsx|xls|csv)$/i,"").replace(/[_-]+/g," ").trim());
   setMessage("");
  }catch(error){setMessage(error instanceof Error?error.message:"تعذّر قراءة الملف");}
 }
 async function createVisit(){
  if(!title.trim()||!names.length){setMessage("اكتب اسم الزيارة وارفع ملف Excel يحتوي على الأسماء.");return;}
  setBusy(true);setMessage("");
  try{const response=await fetch("/api/attendance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:title.trim(),names})});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر إنشاء الكشف");setTitle("");setNames([]);setFileName("");await refreshVisits();router.push("/attendance?id="+data.visit.id);await loadVisit(data.visit.id);}
  catch(error){if(!navigator.onLine||error instanceof TypeError){const id="local-"+crypto.randomUUID();const visit={id,title:title.trim(),total:names.length,present:0,absent:0,moving:0,joker:0,unmarked:names.length,createdAt:new Date().toISOString()};const detail={visit,entries:names.map((entry,index)=>({id:"local-"+crypto.randomUUID(),name:entry.name,phone:entry.phone,status:"unmarked" as const,position:index}))};setVisits(current=>[visit,...current]);setSelected(detail);setTitle("");setNames([]);setFileName("");router.push("/attendance?id="+id);setMessage("تم إنشاء الكشف محليًا دون اتصال. هذا الكشف محفوظ على هذا الجهاز فقط.");}else{const text=error instanceof Error?error.message:"حدث خطأ";setMessage(text);}}
  finally{setBusy(false);}
 }
 async function changeStatus(entry:Entry,status:Entry["status"]){
  if(!selected)return;
  const previous=selected;const presentAt=status==="present"?new Date().toISOString():null;setSelected({...selected,entries:selected.entries.map(e=>e.id===entry.id?{...e,status,presentAt}:e)});
  if(entry.id.startsWith("local-")||!navigator.onLine){setMessage("تم حفظ الحالة على هذا الجهاز.");return;}
  try{const response=await fetch("/api/attendance/"+selected.visit.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({entryId:entry.id,status})});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر حفظ الحالة");if(data.entry)setSelected(current=>current?{...current,entries:current.entries.map(e=>e.id===entry.id?{...e,presentAt:data.entry.presentAt}:e)}:current);await refreshVisits();}
  catch(error){if(!navigator.onLine||error instanceof TypeError){setMessage("تم حفظ التغيير على هذا الجهاز دون اتصال. سيظل محليًا حتى تعود للشبكة.");return;}setSelected(previous);const text=error instanceof Error?error.message:"تعذّر حفظ الحالة";setMessage(text);}
 }
 async function resetAllStatuses(){
  if(!selected||!window.confirm("هل تريد إعادة جميع العلامات إلى لم يُحدد؟"))return;
  const previous=selected;setSelected({...selected,entries:selected.entries.map(e=>({...e,status:"unmarked" as const,presentAt:null}))});
  if(selected.visit.id.startsWith("local-")||!navigator.onLine){setMessage("تمت إعادة جميع العلامات إلى لم يُحدد على هذا الجهاز.");return;}
  try{const response=await fetch("/api/attendance/"+selected.visit.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({resetAll:true})});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّرت إعادة العلامات");await loadVisit(selected.visit.id);await refreshVisits();setMessage("تمت إعادة جميع العلامات إلى لم يُحدد.");}
  catch(error){if(!navigator.onLine||error instanceof TypeError){setMessage("تمت إعادة العلامات محليًا دون اتصال.");return;}setSelected(previous);setMessage(error instanceof Error?error.message:"تعذّرت إعادة العلامات.");}
 }
 function toggleNightMode(){setNightMode(current=>{const next=!current;localStorage.setItem("attendance-night-mode",String(next));return next;});}
 async function copyCounts(){if(!selected)return;const text=`الحضور: ${counts.present}\nالغياب: ${counts.absent}\nفي الطريق: ${counts.moving}\nالجوكر: ${counts.joker}\nلم يُحدد: ${counts.unmarked}`;try{await navigator.clipboard.writeText(text);setMessage("تم نسخ ملخص الحالات.");}catch{setMessage(text);}}
 async function deleteVisit(visit:Visit){
  if(!window.confirm(`هل أنت متأكد من حذف كشف "${visit.title}"؟ سيتم حذف جميع الأسماء وحالات الحضور التابعة له نهائيًا.`))return;
  if(visit.id.startsWith("local-")){setVisits(current=>current.filter(item=>item.id!==visit.id));if(selected?.visit.id===visit.id)setSelected(null);setMessage("تم حذف الكشف المحلي.");return;}
  setBusy(true);setMessage("");
  try{const response=await fetch("/api/attendance/"+visit.id,{method:"DELETE"});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر حذف الكشف");setVisits(current=>current.filter(item=>item.id!==visit.id));setMessage("تم حذف الكشف بنجاح.");}
  catch(error){setMessage(error instanceof Error?error.message:"تعذّر حذف الكشف");}
  finally{setBusy(false);}
 }
 async function editPhone(entry:Entry){if(!selected)return;const phone=window.prompt("رقم الهاتف لـ "+entry.name,entry.phone||"");if(phone===null)return;const previous=selected;const updated={...entry,phone:phone.trim()};setSelected({...selected,entries:selected.entries.map(e=>e.id===entry.id?updated:e)});if(entry.id.startsWith("local-")||!navigator.onLine){setMessage("تم حفظ رقم الهاتف على هذا الجهاز.");return;}try{const response=await fetch("/api/attendance/"+selected.visit.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({entryId:entry.id,phone:updated.phone})});if(!response.ok)throw new Error();setMessage("تم حفظ رقم الهاتف.");}catch(error){if(!navigator.onLine||error instanceof TypeError){setMessage("تم حفظ رقم الهاتف محليًا دون اتصال.");return;}setSelected(previous);setMessage("تعذّر حفظ رقم الهاتف.");}}
 async function editName(entry:Entry){if(!selected)return;const name=window.prompt("تعديل الاسم",entry.name);if(name===null||!name.trim())return;const phone=window.prompt("رقم الهاتف (اتركه فارغًا إذا لا يوجد)",entry.phone||"");if(phone===null)return;const previous=selected;const updated={...entry,name:name.trim(),phone:phone.trim()};setSelected({...selected,entries:selected.entries.map(e=>e.id===entry.id?updated:e)});if(entry.id.startsWith("local-")||!navigator.onLine){setMessage("تم حفظ التعديل على هذا الجهاز.");return;}try{const response=await fetch("/api/attendance/"+selected.visit.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({entryId:entry.id,name:updated.name,phone:updated.phone})});if(!response.ok)throw new Error();setMessage("تم تعديل الاسم ورقم الهاتف.");}catch(error){if(!navigator.onLine||error instanceof TypeError){setMessage("تم حفظ التعديل محليًا دون اتصال.");return;}setSelected(previous);setMessage("تعذّر حفظ التعديل على الخادم.");}}
 async function deleteName(entry:Entry){if(!selected||!window.confirm("هل تريد حذف الاسم "+entry.name+" من الكشف؟"))return;const previous=selected;setSelected({...selected,entries:selected.entries.filter(e=>e.id!==entry.id)});if(entry.id.startsWith("local-")||!navigator.onLine){setMessage("تم حذف الاسم من النسخة المحفوظة على هذا الجهاز.");return;}try{const response=await fetch("/api/attendance/"+selected.visit.id,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({entryId:entry.id})});if(!response.ok)throw new Error();await refreshVisits();setMessage("تم حذف الاسم.");}catch(error){if(!navigator.onLine||error instanceof TypeError){setMessage("تم حذف الاسم محليًا دون اتصال.");return;}setSelected(previous);setMessage("تعذّر حذف الاسم من الخادم.");}}
 async function moveName(entry:Entry,direction:-1|1){if(!selected)return;const list=[...selected.entries].sort((a,b)=>a.position-b.position);const index=list.findIndex(e=>e.id===entry.id);const target=index+direction;if(index<0||target<0||target>=list.length)return;[list[index],list[target]]=[list[target],list[index]];const reordered=list.map((e,i)=>({...e,position:i}));setSelected({...selected,entries:reordered});if(entry.id.startsWith("local-")||!navigator.onLine){setMessage("تم تغيير الترتيب على هذا الجهاز.");return;}try{const responses=await Promise.all(reordered.map(e=>fetch("/api/attendance/"+selected.visit.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({entryId:e.id,position:e.position})})));if(responses.some(response=>!response.ok))throw new Error();setMessage("تم حفظ ترتيب الأسماء.");}catch{setMessage("تعذّر مزامنة الترتيب مع الخادم.");}}
 async function addName(){
  if(!selected||!newName.trim())return; if(selected.visit.id.startsWith("local-")||!navigator.onLine){const entry={id:"local-"+crypto.randomUUID(),name:newName.trim(),status:"unmarked" as const,position:selected.entries.length};setSelected({...selected,entries:[...selected.entries,entry]});setNewName("");setMessage("تمت إضافة الاسم على هذا الجهاز.");return;} setBusy(true);
  try{const response=await fetch("/api/attendance/"+selected.visit.id,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newName.trim()})});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذّر إضافة الاسم");setSelected({...selected,entries:[...selected.entries,data.entry]});setNewName("");setMessage("");await refreshVisits();}
  catch(error){const text=error instanceof Error?error.message:"تعذّر إضافة الاسم";setMessage(text);}
  finally{setBusy(false);}
 }
 return <main className={"attendance-page"+(nightMode?" night-mode":"")} dir="rtl">
  <div className="attendance-wrap">
   <header className="attendance-header"><span className={"attendance-kicker "+(isOnline?"":"offline-badge")}>{isOnline?"متصل بالإنترنت":"وضع عدم الاتصال"}</span><div><span className="attendance-kicker">جامعة العاصمة</span><h1>كشف الحضور</h1><p>إدارة حضور الزيارات العسكرية</p></div><button className="attendance-back" type="button" onClick={toggleNightMode}>{nightMode?<><Sun size={16}/> الوضع النهاري</>:<><Moon size={16}/> الوضع الليلي</>}</button></header>
   {message&&<div className="attendance-message" role="alert">{message}</div>}
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
    <div className="attendance-tools"><label className="attendance-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم…"/></label><span>{filtered.length} ظاهر · {selected.entries.length-counts.joker} اسم محسوب من إجمالي الكشف</span><div className="attendance-tool-actions"><button className="attendance-orange" type="button" onClick={()=>void copyCounts()}><Copy size={16}/> كوبي الحالة</button><button className="attendance-reset" type="button" onClick={()=>void resetAllStatuses()}>إعادة كل العلامات</button></div></div>
    <form className="attendance-add" onSubmit={e=>{e.preventDefault();void addName();}}><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="إضافة اسم جديد إلى الكشف" maxLength={180}/><button disabled={busy||!newName.trim()}><UserPlus size={18}/> إضافة اسم</button></form>
    <div className="attendance-list">{filtered.map((entry,index)=><div className={"attendance-row row-"+entry.status} key={entry.id}><span className="attendance-number">{entry.status==="joker"?"★":filtered.slice(0,index).filter(e=>e.status!=="joker").length+1}</span><span className="attendance-name">{entry.name}{entry.status==="present"&&entry.presentAt&&<small className="attendance-present-time">حضر الساعة {new Intl.DateTimeFormat("ar-EG",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true,timeZone:"Africa/Cairo"}).format(new Date(entry.presentAt))}</small>}</span>{entry.phone?<a className="attendance-phone" href={"tel:"+entry.phone.replace(/[٠-٩۰-۹]/g,d=>String("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(d)%10)).replace(/[^0-9+]/g,"")} aria-label={"اتصال بـ "+entry.name} title={"اتصال بـ "+entry.name}><Phone size={17}/></a>:<button type="button" className="attendance-phone" onClick={()=>void editPhone(entry)} aria-label={"إضافة رقم هاتف لـ "+entry.name} title="أضف رقم الهاتف لتفعيل الاتصال"><Phone size={17}/></button>}<button type="button" className="attendance-row-action" title="تعديل الاسم ورقم الهاتف" onClick={()=>void editName(entry)}><Pencil size={15}/></button><button type="button" className="attendance-row-action" title="تحريك لأعلى" onClick={()=>void moveName(entry,-1)}><ArrowUp size={15}/></button><button type="button" className="attendance-row-action" title="تحريك لأسفل" onClick={()=>void moveName(entry,1)}><ArrowDown size={15}/></button><button type="button" className="attendance-row-action" title="حذف الاسم" onClick={()=>void deleteName(entry)}><Trash2 size={15}/></button><div className="attendance-markers" aria-label={"حالة "+entry.name}><button title="حضور" aria-label={"تسجيل حضور "+entry.name} className={entry.status==="present"?"marker-active":""} onClick={()=>void changeStatus(entry,entry.status==="present"?"unmarked":"present")}><Check size={18}/></button><button title="غياب" aria-label={"تسجيل غياب "+entry.name} className={entry.status==="absent"?"marker-active":""} onClick={()=>void changeStatus(entry,entry.status==="absent"?"unmarked":"absent")}><X size={18}/></button><button title="في الطريق للمكان" aria-label={"تسجيل أن "+entry.name+" في الطريق للمكان"} className={entry.status==="moving"?"marker-active":""} onClick={()=>void changeStatus(entry,entry.status==="moving"?"unmarked":"moving")}><Navigation size={17}/></button><button title="جوكر — لا يُحتسب ضمن العدد" aria-label={"تحديد "+entry.name+" كجوكر غير محسوب"} className={entry.status==="joker"?"marker-active":""} onClick={()=>void changeStatus(entry,entry.status==="joker"?"unmarked":"joker")}><Star size={16}/></button><button title="لم يُحدد" aria-label={"إلغاء تحديد "+entry.name} className={entry.status==="unmarked"?"marker-active":""} onClick={()=>void changeStatus(entry,"unmarked")}><Circle size={16}/></button></div></div>)}
    {filtered.length===0&&<p className="attendance-empty">لا توجد أسماء مطابقة للبحث.</p>}</div>
   </section>}
   {!selected&&<section className="attendance-visits"><div className="attendance-section-title"><h2>كشوف الزيارات المحفوظة</h2></div>
    {loading?<p className="attendance-empty">جارٍ تحميل الكشوف…</p>:visits.length===0?<p className="attendance-empty">لا توجد كشوف محفوظة بعد. ارفع ملفًا لإنشاء أول كشف.</p>:<div className="attendance-visit-list">{visits.map(visit=><div key={visit.id} className="attendance-visit-card"><button className="attendance-visit-open" onClick={()=>{router.push("/attendance?id="+visit.id);void loadVisit(visit.id);}}><span><strong>{visit.title}</strong><small>{visit.total} اسمًا محسوبًا</small></span><span className="visit-mini-counts"><b>{visit.present} حضور</b><b>{visit.absent} غياب</b><b>{visit.moving} في الطريق</b><b>{visit.joker} جوكر</b><b>{visit.unmarked} لم يُحدد</b></span><ArrowRight size={18}/></button><button className="attendance-delete" disabled={busy} onClick={()=>void deleteVisit(visit)}><Trash2 size={16}/> حذف الكشف</button></div>)}</div>}
   </section>}
   <p className="attendance-security">{isOnline?"تُحفظ البيانات المتصلة على الخادم.":"وضع عدم الاتصال يعرض آخر نسخة محفوظة على هذا الجهاز؛ قد لا تتزامن التعديلات مع الخادم."}</p>
  </div>
 </main>;
}
