import { AttendancePage } from "@/components/AttendancePage";

export const metadata = {
  title: "كشف الحضور | جامعة العاصمة",
  description: "كشف الحضور والغياب والطلاب في الطريق للزيارات العسكرية.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AttendancePage />;
}
