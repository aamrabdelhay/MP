import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata = {
  title: "إدارة الطلبات | جامعة العاصمة",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
