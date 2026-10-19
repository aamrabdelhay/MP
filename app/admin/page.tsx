import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata = {
  title: "إدارة الطلبات | جامعة العاصمة",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", padding: "16px 20px 0" }}>
        <Link
          href="/attendance"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            minHeight: 44,
            padding: "11px 20px",
            borderRadius: 12,
            background: "#e8872c",
            color: "#fff",
            fontWeight: 800,
            textDecoration: "none",
            boxShadow: "0 6px 18px #e8872c33",
          }}
        >
          كشف الحضور والزيارات <ArrowLeft aria-hidden="true" size={18} />
        </Link>
      </div>
      <AdminDashboard />
    </>
  );
}
