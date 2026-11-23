import type { Metadata, Viewport } from "next";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Footer } from "@/components/Footer";
import { SITE_MODE } from "@/lib/site-mode";

const isCookieMode = SITE_MODE === "cookies";

export const metadata: Metadata = {
  title: isCookieMode ? "COOKIE CLUB | كوكيز على مزاجك" : "جامعة العاصمة | Capital University",
  description: isCookieMode
    ? "كوكيز طازج، شوكولاتة غنية، ومولتن كيك."
    : "بوابة التسجيل الإلكتروني لجامعة العاصمة — Capital University online registration portal.",
  applicationName: isCookieMode ? "COOKIE CLUB" : "كشف الحضور - جامعة العاصمة",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: isCookieMode ? "#6b4437" : "#0F3563",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="app-frame">
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
