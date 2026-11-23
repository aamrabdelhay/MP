import { notFound } from "next/navigation";
import { CookieShop } from "@/components/CookieShop";
import { SITE_MODE } from "@/lib/site-mode";

export const metadata = {
  title: "COOKIE CLUB | كوكيز على مزاجك",
  description: "كوكيز طازج، شوكولاتة غنية، ومولتن كيك.",
  robots: { index: false, follow: false },
};

export default function CookieStorePage() {
  if (SITE_MODE !== "cookies") notFound();
  return <CookieShop />;
}
