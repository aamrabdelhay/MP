"use client";

import { Check, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/app/providers";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RegistrationForm } from "@/components/RegistrationForm";
import { UniversityMark } from "@/components/UniversityMark";

export function HomePage() {
  const { language, t } = useLanguage();

  return (
    <main className="site-main home-content">
      <div className="page-width">
        <header className="site-header">
          <div className="brand-lockup" aria-label={t.englishName}>
            <UniversityMark />
            <div>
              <p className="brand-name-ar">{t.siteName}</p>
              <p className="brand-name-en">{language === "ar" ? t.englishName : "جامعة العاصمة"}</p>
            </div>
          </div>
          <div className="header-actions">
            <span className="header-note">
              <GraduationCap aria-hidden="true" size={17} />
              {t.headerNote}
            </span>
            <LanguageSwitcher />
          </div>
        </header>

        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">{t.heroEyebrow}</span>
            <h1 className="hero-title" id="hero-title">
              {t.heroTitle}
              <span className="hero-title-accent">{t.heroAccent}</span>
            </h1>
            <p className="hero-description">{t.heroDescription}</p>
            <ul className="hero-points">
              <li><Check aria-hidden="true" size={15} />{t.heroPointOne}</li>
              <li><Check aria-hidden="true" size={15} />{t.heroPointTwo}</li>
              <li><ShieldCheck aria-hidden="true" size={15} />{t.heroPointThree}</li>
            </ul>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-glow" />
            <div className="hero-seal-panel">
              <div className="seal-grid" />
              <Sparkles className="seal-decoration" strokeWidth={0.5} />
              <div className="seal-stars seal-stars-top"><span /><span /><span /></div>
              <div className="seal-center">
                <UniversityMark />
                <p className="seal-center-ar">جامعة العاصمة</p>
                <p className="seal-center-en">CAPITAL UNIVERSITY</p>
              </div>
              <div className="seal-stars seal-stars-bottom"><span /><span /><span /></div>
              <span className="seal-caption">KNOWLEDGE · AMBITION · FUTURE</span>
            </div>
          </div>
        </section>

        <RegistrationForm />
      </div>
      <LoadingScreen />
    </main>
  );
}
