import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <p className="footer-credit">
        <span>Designed &amp; Developed by</span>{" "}
        <Link href="/admin" aria-label="Open Capital University admin dashboard">
          Amr Abdelhay
        </Link>
      </p>
    </footer>
  );
}
