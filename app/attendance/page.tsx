import { notFound } from "next/navigation";
import { AttendancePage } from "@/components/AttendancePage";
import { SITE_MODE } from "@/lib/site-mode";

export const metadata = {
  title: "كشف الحضور | جامعة العاصمة",
  description: "كشف الحضور والغياب والطلاب في الطريق للزيارات العسكرية.",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (SITE_MODE === "cookies") notFound();
  return <AttendancePage />;
}
