import Link from "next/link";
import { SITE_MODE } from "@/lib/site-mode";

export function Footer() {
  if (SITE_MODE === "cookies") return null;
  return (
    <footer className="site-footer">
      <p className="footer-credit">
        <span>Designed &amp; Developed by</span>{" "}
        <Link href="/admin" aria-label="Open Capital University admin dashboard">Amr Abdelhay</Link>
      </p>
    </footer>
  );
}
