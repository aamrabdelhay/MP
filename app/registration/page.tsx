import { notFound } from "next/navigation";
import { HomePage } from "@/components/HomePage";
import { SITE_MODE } from "@/lib/site-mode";

export const metadata = {
  title: "فورم التسجيل | جامعة العاصمة",
  description: "استمارة تسجيل الطلاب لزيارات جامعة العاصمة.",
  robots: { index: false, follow: false },
};

export default function RegistrationPage() {
  if (SITE_MODE === "cookies") notFound();
  return <HomePage />;
}
