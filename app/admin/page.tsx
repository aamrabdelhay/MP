import { redirect } from "next/navigation";

export const metadata = {
  title: "كشف الحضور | جامعة العاصمة",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  redirect("/attendance");
}
