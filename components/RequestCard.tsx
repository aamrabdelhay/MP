"use client";

import { Archive, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { useLanguage } from "@/app/providers";
import { CopyButton } from "@/components/CopyButton";
import type { Language } from "@/lib/i18n";

export type AdminRequest = {
  id: string;
  fullName: string;
  college: string;
  department: string | null;
  phone: string;
  nationalId: string;
  address: string;
  birthDate: string;
  universityType: "government" | "private";
  status: "new" | "old";
  createdAt: string;
};

export type RequestStatus = "new" | "old";

type DisplayField = {
  key: "fullName" | "college" | "department" | "phone" | "nationalId" | "address" | "birthDate" | "university" | "createdAt";
  label: string;
  value: string;
};

export function getRequestFields(request: AdminRequest, language: Language, noDepartmentLabel: string, labels: {
  fullName: string;
  college: string;
  department: string;
  phone: string;
  nationalId: string;
  address: string;
  birthDate: string;
  university: string;
  createdAt: string;
  governmentUniversity: string;
  privateUniversity: string;
}): DisplayField[] {
  const locale = language === "ar" ? "ar-EG" : "en-GB";
  let dateOfBirth = request.birthDate;
  let submittedAt = request.createdAt;
  try {
    const date = new Date(`${request.birthDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      dateOfBirth = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
    }
    const created = new Date(request.createdAt);
    if (!Number.isNaN(created.getTime())) {
      submittedAt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(created);
    }
  } catch {
    // Fall back to the ISO values if the browser has incomplete Intl support.
  }

  return [
    { key: "fullName", label: labels.fullName, value: request.fullName },
    { key: "college", label: labels.college, value: request.college },
    { key: "department", label: labels.department, value: request.department?.trim() || noDepartmentLabel },
    { key: "phone", label: labels.phone, value: request.phone },
    { key: "nationalId", label: labels.nationalId, value: request.nationalId },
    { key: "address", label: labels.address, value: request.address },
    { key: "birthDate", label: labels.birthDate, value: dateOfBirth },
    {
      key: "university",
      label: labels.university,
      value: request.universityType === "government" ? labels.governmentUniversity : labels.privateUniversity,
    },
    { key: "createdAt", label: labels.createdAt, value: submittedAt },
  ];
}

export function formatRequestForCopy(fields: DisplayField[]): string {
  return fields.map((field) => `${field.label}: ${field.value}`).join("\n");
}

type RequestCardProps = {
  request: AdminRequest;
  busy: boolean;
  onCopied: (request: AdminRequest) => void | Promise<void>;
  onCopyFailure: () => void;
  onStatusChange: (request: AdminRequest, status: RequestStatus) => void;
  onDelete: (request: AdminRequest) => void;
};

export function RequestCard({ request, busy, onCopied, onCopyFailure, onStatusChange, onDelete }: RequestCardProps) {
  const { language, t } = useLanguage();
  const fields = getRequestFields(request, language, t.admin.noDepartment, {
    ...t.admin.fields,
    governmentUniversity: t.governmentUniversity,
    privateUniversity: t.privateUniversity,
  });
  const initial = Array.from(request.fullName.trim())[0] ?? "؟";
  const targetStatus: RequestStatus = request.status === "new" ? "old" : "new";

  return (
    <article className="request-card" aria-labelledby={`request-name-${request.id}`}>
      <header className="request-card-header">
        <div className="request-card-identity">
          <span className="request-avatar" aria-hidden="true">{initial}</span>
          <div>
            <h3 className="request-card-title" id={`request-name-${request.id}`}>{request.fullName}</h3>
            <p className="request-card-subtitle" dir="ltr">{request.phone}</p>
          </div>
        </div>
        <div className="request-actions">
          <button
            className="icon-text-button"
            type="button"
            onClick={() => onStatusChange(request, targetStatus)}
            disabled={busy}
            aria-label={request.status === "new" ? t.admin.moveOld : t.admin.moveNew}
            title={request.status === "new" ? t.admin.moveOld : t.admin.moveNew}
          >
            {busy ? <LoaderCircle aria-hidden="true" size={15} className="button-spinner" /> : request.status === "new" ? <Archive aria-hidden="true" size={15} /> : <RotateCcw aria-hidden="true" size={15} />}
            <span>{request.status === "new" ? t.admin.moveOld : t.admin.moveNew}</span>
          </button>
          <button
            className="icon-only-button"
            type="button"
            onClick={() => onDelete(request)}
            disabled={busy}
            aria-label={t.admin.delete}
            title={t.admin.delete}
          >
            {busy ? <LoaderCircle aria-hidden="true" size={15} className="button-spinner" /> : <Trash2 aria-hidden="true" size={15} />}
          </button>
        </div>
      </header>

      <div className="request-fields">
        {fields.map((field) => (
          <div className="request-data-row" key={field.key}>
            <span className="request-data-label">{field.label}</span>
            <span className="request-data-value" dir={field.key === "phone" || field.key === "nationalId" ? "ltr" : "auto"}>
              {field.value}
            </span>
            <CopyButton
              value={field.value}
              label={t.admin.copyAll}
              accessibleLabel={`${language === "ar" ? "نسخ" : "Copy"} ${field.label}`}
              className="request-data-copy"
              onCopied={() => onCopied(request)}
              onFailure={onCopyFailure}
              disabled={busy}
            />
          </div>
        ))}
      </div>

      <footer className="request-card-footer">
        <CopyButton
          value={formatRequestForCopy(fields)}
          label={t.admin.copyAll}
          accessibleLabel={`${t.admin.copyAll}: ${request.fullName}`}
          variant="text"
          onCopied={() => onCopied(request)}
          onFailure={onCopyFailure}
          disabled={busy}
        />
        <span className="request-status-pill">{request.status === "new" ? t.admin.newRequests : t.admin.oldRequests}</span>
      </footer>
    </article>
  );
}
