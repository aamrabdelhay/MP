"use client";

import Link from "next/link";
import { ClipboardCheck, UserRoundPlus, GraduationCap } from "lucide-react";
import { UniversityMark } from "@/components/UniversityMark";
import { useLanguage } from "@/app/providers";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Page() {
  const { language } = useLanguage();
  const ar = language === "ar";
  return (
    <main className="site-main">
      <div className="page-width">
        <header className="site-header">
          <div className="brand-lockup">
            <UniversityMark />
            <div><p className="brand-name-ar">جامعة العاصمة</p><p className="brand-name-en">CAPITAL UNIVERSITY</p></div>
          </div>
          <div className="header-actions">
            <span className="header-note"><GraduationCap aria-hidden="true" size={17} />{ar ? "بوابة الزيارات العسكرية" : "Military Visits Portal"}</span>
            <LanguageSwitcher />
          </div>
        </header>
        <section style={{maxWidth: 920, margin: "clamp(36px, 8vh, 90px) auto 70px", textAlign: "center"}}>
          <span className="eyebrow">{ar ? "جامعة العاصمة" : "CAPITAL UNIVERSITY"}</span>
          <h1 style={{fontSize:"clamp(2rem, 5vw, 3.5rem)", lineHeight:1.25, margin:"14px 0"}}>{ar ? "اختر الخدمة المطلوبة" : "Choose a service"}</h1>
          <p style={{color:"var(--muted)", margin:"0 auto 36px", maxWidth:600}}>{ar ? "يمكنك الدخول إلى كشف الحضور أو فتح استمارة تسجيل الطلاب." : "Open the attendance roster or the student registration form."}</p>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 270px), 1fr))", gap:22, textAlign: ar ? "right" : "left"}}>
            <Link href="/attendance" style={{textDecoration:"none", color:"inherit", background:"var(--surface)", border:"1px solid var(--line)", borderRadius:24, padding:"30px 28px", boxShadow:"var(--shadow)", display:"flex", flexDirection:"column", minHeight:235, transition:"transform .2s"}}>
              <span style={{width:58,height:58,borderRadius:18,display:"grid",placeItems:"center",background:"rgba(27,79,138,.1)",color:"var(--navy)",marginBottom:20}}><ClipboardCheck size={29}/></span>
              <strong style={{fontSize:24}}>{ar ? "كشف الحضور" : "Attendance roster"}</strong>
              <span style={{color:"var(--muted)",marginTop:8}}>{ar ? "إدارة الزيارات وأسماء الطلاب وحالات الحضور." : "Manage visits, student names and attendance statuses."}</span>
              <span style={{marginTop:"auto",paddingTop:22,color:"var(--navy)",fontWeight:700}}>{ar ? "فتح كشف الحضور ←" : "Open attendance →"}</span>
            </Link>
            <Link href="/registration" style={{textDecoration:"none", color:"inherit", background:"var(--surface)", border:"1px solid var(--line)", borderRadius:24, padding:"30px 28px", boxShadow:"var(--shadow)", display:"flex", flexDirection:"column", minHeight:235, transition:"transform .2s"}}>
              <span style={{width:58,height:58,borderRadius:18,display:"grid",placeItems:"center",background:"rgba(201,162,39,.13)",color:"#9a7712",marginBottom:20}}><UserRoundPlus size={29}/></span>
              <strong style={{fontSize:24}}>{ar ? "فورم التسجيل" : "Registration form"}</strong>
              <span style={{color:"var(--muted)",marginTop:8}}>{ar ? "فتح استمارة تسجيل الطلاب وإرسال البيانات." : "Open the student registration form and submit details."}</span>
              <span style={{marginTop:"auto",paddingTop:22,color:"var(--navy)",fontWeight:700}}>{ar ? "فتح فورم التسجيل ←" : "Open registration →"}</span>
            </Link>
          </div>
        </section>
        <footer style={{textAlign:"center",color:"var(--muted)",fontSize:13,padding:"0 0 28px"}}>© Capital University</footer>
      </div>
    </main>
  );
}
