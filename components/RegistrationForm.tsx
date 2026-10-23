"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, LoaderCircle, Send } from "lucide-react";
import { useLanguage } from "@/app/providers";
import { Field } from "@/components/Field";
import { DotIndicator } from "@/components/DotIndicator";
import {
  getFieldValidity,
  getNationalIdBirthDate,
  isRegistrationValid,
  registrationSchema,
  todayISODate,
  type RegistrationField,
  type RegistrationFormDraft,
} from "@/lib/validation";

type FormMessage = { type: "success" | "error"; text: string } | null;

const EMPTY_FORM: RegistrationFormDraft = {
  fullName: "",
  college: "",
  department: "",
  phone: "",
  nationalId: "",
  address: "",
  buildingNumber: "",
  governorate: "",
  studyYear: "",
  birthDate: "",
  universityType: "",
};

export function RegistrationForm() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState<RegistrationFormDraft>({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<FormMessage>(null);
  const [saved, setSaved] = useState(false);
  const [nationalIdEntryError, setNationalIdEntryError] = useState("");

  const validity = useMemo(() => {
    const result = {} as Record<RegistrationField, ReturnType<typeof getFieldValidity>>;
    (Object.keys(form) as RegistrationField[]).forEach((field) => {
      result[field] = getFieldValidity(field, form);
    });
    return result;
  }, [form]);

  const dateFromId = getNationalIdBirthDate(form.nationalId);
  const dateMismatch = Boolean(dateFromId && form.birthDate && dateFromId !== form.birthDate);
  const formIsValid = isRegistrationValid(form) && !nationalIdEntryError;

  function updateField(field: RegistrationField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setSaved(false);
  }

  function handleTextChange(field: RegistrationField) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateField(field, event.currentTarget.value);
    };
  }

  function handleNationalIdChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    if (/[٠-٩۰-۹]/.test(value) || /[^0-9]/.test(value)) {
      setNationalIdEntryError(t.nationalIdEnglishOnly);
      setMessage(null);
      setSaved(false);
      return;
    }

    setNationalIdEntryError("");
    setMessage(null);
    setSaved(false);
    setForm((current) => {
      const next = { ...current, nationalId: value };
      const encodedBirthDate = getNationalIdBirthDate(value);
      if (encodedBirthDate) next.birthDate = encodedBirthDate;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      setMessage({ type: "error", text: t.validationSummary });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = (await response.json().catch(() => ({}))) as { code?: string };

      if (response.status === 409 || result.code === "DUPLICATE_NATIONAL_ID") {
        setMessage({ type: "error", text: t.duplicateError });
        return;
      }
      if (!response.ok) {
        setMessage({ type: "error", text: result.code === "VALIDATION_ERROR" ? t.validationSummary : t.genericSubmitError });
        return;
      }

      setForm({ ...EMPTY_FORM });
      setSaved(true);
      setMessage({ type: "success", text: t.successDescription });
      window.setTimeout(() => {
        setSaved(false);
        setMessage((current) => (current?.type === "success" ? null : current));
      }, 6500);
    } catch {
      setMessage({ type: "error", text: t.networkError });
    } finally {
      setSubmitting(false);
    }
  }

  const validityLabels = {
    validLabel: t.statusValid,
    invalidLabel: t.statusInvalid,
    neutralLabel: t.statusOptional,
  };

  return (
    <section className="registration-shell" id="registration" aria-labelledby="registration-title">
      <div className="registration-card">
        <div className="registration-heading">
          <div>
            <h2 id="registration-title">{t.formTitle}</h2>
            {t.formDescription ? <p>{t.formDescription}</p> : null}
          </div>
        </div>

        <form className="registration-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <Field
              id="fullName"
              label={t.fields.fullName}
              validity={validity.fullName}
              {...validityLabels}
              hint={t.help.fullName}
              wide
            >
              <input
                className="field-control"
                id="fullName"
                aria-describedby="fullName-hint"
                name="fullName"
                type="text"
                autoComplete="name"
                dir="auto"
                placeholder={t.placeholders.fullName}
                value={form.fullName}
                onChange={handleTextChange("fullName")}
                maxLength={160}
                required
                aria-required="true"
                aria-invalid={validity.fullName === "invalid" && Boolean(form.fullName.trim())}
              />
            </Field>

            <Field
              id="college"
              label={t.fields.college}
              validity={validity.college}
              {...validityLabels}
            >
              <input
                className="field-control"
                id="college"
                name="college"
                type="text"
                autoComplete="organization-title"
                dir="auto"
                placeholder={t.placeholders.college}
                value={form.college}
                onChange={handleTextChange("college")}
                maxLength={160}
                required
                aria-required="true"
                aria-invalid={validity.college === "invalid" && Boolean(form.college.trim())}
              />
            </Field>

            <Field
              id="department"
              label={t.fields.department}
              validity={validity.department}
              {...validityLabels}
              hint={t.help.department}
            >
              <input
                className="field-control"
                id="department"
                aria-describedby="department-hint"
                name="department"
                type="text"
                dir="auto"
                placeholder={t.placeholders.department}
                value={form.department}
                onChange={handleTextChange("department")}
                maxLength={160}
                aria-required="false"
              />
            </Field>

            <Field
              id="phone"
              label={t.fields.phone}
              validity={validity.phone}
              {...validityLabels}
              hint={t.help.phone}
            >
              <input
                className="field-control field-control--ltr"
                id="phone"
                aria-describedby="phone-hint"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                dir="ltr"
                placeholder={t.placeholders.phone}
                value={form.phone}
                onChange={handleTextChange("phone")}
                maxLength={11}
                required
                aria-required="true"
                aria-invalid={validity.phone === "invalid" && Boolean(form.phone.trim())}
              />
            </Field>

            <Field
              id="nationalId"
              label={t.fields.nationalId}
              validity={validity.nationalId}
              {...validityLabels}
              hint={nationalIdEntryError ? undefined : t.help.nationalId}
              errorHint={nationalIdEntryError || undefined}
            >
              <input
                className="field-control field-control--ltr"
                id="nationalId"
                aria-describedby="nationalId-hint"
                name="nationalId"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                placeholder={t.placeholders.nationalId}
                value={form.nationalId}
                onChange={handleNationalIdChange}
                maxLength={14}
                required
                aria-required="true"
                aria-invalid={Boolean(nationalIdEntryError) || (validity.nationalId === "invalid" && Boolean(form.nationalId.trim()))}
              />
            </Field>

            <Field id="studyYear" label={t.fields.studyYear} validity={validity.studyYear} {...validityLabels}>
              <select className="field-control field-control--select" id="studyYear" name="studyYear" value={form.studyYear} onChange={(event) => updateField("studyYear", event.currentTarget.value)} required aria-required="true" aria-invalid={validity.studyYear === "invalid" && Boolean(form.studyYear)}>
                <option value="">{language === "ar" ? "اختر الفرقة الدراسية" : "Select study year"}</option>
                <option value="الأولى">{language === "ar" ? "الأولى" : "First"}</option>
                <option value="الثانية">{language === "ar" ? "الثانية" : "Second"}</option>
                <option value="الثالثة">{language === "ar" ? "الثالثة" : "Third"}</option>
                <option value="الرابعة">{language === "ar" ? "الرابعة" : "Fourth"}</option>
                <option value="الخامسة">{language === "ar" ? "الخامسة" : "Fifth"}</option>
                <option value="السادسة">{language === "ar" ? "السادسة" : "Sixth"}</option>
                <option value="دراسات عليا">{language === "ar" ? "دراسات عليا" : "Postgraduate"}</option>
              </select>
            </Field>
            <Field id="governorate" label={t.fields.governorate} validity={validity.governorate} {...validityLabels}>
              <select className="field-control field-control--select" id="governorate" name="governorate" value={form.governorate} onChange={(event) => updateField("governorate", event.currentTarget.value)} required aria-required="true" aria-invalid={validity.governorate === "invalid" && Boolean(form.governorate)}>
                <option value="">{language === "ar" ? "اختر المحافظة" : "Select governorate"}</option>
                <option value="القاهرة">{language === "ar" ? "القاهرة" : "Cairo"}</option>
                <option value="الجيزة">{language === "ar" ? "الجيزة" : "Giza"}</option>
                <option value="الإسكندرية">{language === "ar" ? "الإسكندرية" : "Alexandria"}</option>
                <option value="الدقهلية">{language === "ar" ? "الدقهلية" : "Dakahlia"}</option>
                <option value="البحر الأحمر">{language === "ar" ? "البحر الأحمر" : "Red Sea"}</option>
                <option value="البحيرة">{language === "ar" ? "البحيرة" : "Beheira"}</option>
                <option value="الفيوم">{language === "ar" ? "الفيوم" : "Fayoum"}</option>
                <option value="الغربية">{language === "ar" ? "الغربية" : "Gharbia"}</option>
                <option value="الإسماعيلية">{language === "ar" ? "الإسماعيلية" : "Ismailia"}</option>
                <option value="المنوفية">{language === "ar" ? "المنوفية" : "Menoufia"}</option>
                <option value="المنيا">{language === "ar" ? "المنيا" : "Minya"}</option>
                <option value="القليوبية">{language === "ar" ? "القليوبية" : "Qalyubia"}</option>
                <option value="الوادي الجديد">{language === "ar" ? "الوادي الجديد" : "New Valley"}</option>
                <option value="السويس">{language === "ar" ? "السويس" : "Suez"}</option>
                <option value="أسوان">{language === "ar" ? "أسوان" : "Aswan"}</option>
                <option value="أسيوط">{language === "ar" ? "أسيوط" : "Assiut"}</option>
                <option value="بني سويف">{language === "ar" ? "بني سويف" : "Beni Suef"}</option>
                <option value="بورسعيد">{language === "ar" ? "بورسعيد" : "Port Said"}</option>
                <option value="دمياط">{language === "ar" ? "دمياط" : "Damietta"}</option>
                <option value="الشرقية">{language === "ar" ? "الشرقية" : "Sharqia"}</option>
                <option value="جنوب سيناء">{language === "ar" ? "جنوب سيناء" : "South Sinai"}</option>
                <option value="كفر الشيخ">{language === "ar" ? "كفر الشيخ" : "Kafr El Sheikh"}</option>
                <option value="مطروح">{language === "ar" ? "مطروح" : "Matrouh"}</option>
                <option value="الأقصر">{language === "ar" ? "الأقصر" : "Luxor"}</option>
                <option value="قنا">{language === "ar" ? "قنا" : "Qena"}</option>
                <option value="شمال سيناء">{language === "ar" ? "شمال سيناء" : "North Sinai"}</option>
                <option value="سوهاج">{language === "ar" ? "سوهاج" : "Sohag"}</option>
              </select>
            </Field>
            <Field id="address" label={t.fields.address} validity={validity.address} {...validityLabels} hint={t.help.address}>
              <textarea className="field-textarea" id="address" name="address" autoComplete="street-address" dir="auto" placeholder={t.placeholders.address} value={form.address} onChange={handleTextChange("address")} maxLength={500} required aria-required="true" aria-invalid={validity.address === "invalid" && Boolean(form.address.trim())} />
            </Field>
            <Field id="buildingNumber" label={t.fields.buildingNumber} validity={validity.buildingNumber} {...validityLabels}>
              <input className="field-control" id="buildingNumber" name="buildingNumber" type="text" dir="auto" placeholder={language === "ar" ? "رقم العمارة" : "Building number"} value={form.buildingNumber} onChange={handleTextChange("buildingNumber")} maxLength={30} required aria-required="true" aria-invalid={validity.buildingNumber === "invalid" && Boolean(form.buildingNumber.trim())} />
            </Field>

            <Field
              id="birthDate"
              label={t.fields.birthDate}
              validity={validity.birthDate}
              {...validityLabels}
              hint={dateMismatch ? undefined : t.help.birthDate}
              errorHint={dateMismatch ? t.mismatchBirthDate : undefined}
            >
              <input
                className="field-control field-control--ltr"
                id="birthDate"
                aria-describedby="birthDate-hint"
                name="birthDate"
                type="date"
                autoComplete="bday"
                dir="ltr"
                max={todayISODate()}
                value={form.birthDate}
                onChange={handleTextChange("birthDate")}
                required
                aria-required="true"
                aria-invalid={validity.birthDate === "invalid" && Boolean(form.birthDate)}
              />
            </Field>

            <fieldset className="field choice-fieldset" aria-invalid={validity.universityType === "invalid"} aria-describedby="universityType-hint">
              <legend className="field-label-row field-legend-wrap">
                <span className="field-legend">
                  <DotIndicator validity={validity.universityType} {...validityLabels} />
                  <span>{t.fields.universityType}</span>
                </span>
              </legend>
              {t.selectUniversity ? <p className="choice-description" id="universityType-hint">{t.selectUniversity}</p> : null}
              <div className="choice-options">
                <label className={`choice-card${form.universityType === "government" ? " choice-card--selected" : ""}`}>
                  <input
                    type="radio"
                    name="universityType"
                    value="government"
                    checked={form.universityType === "government"}
                    onChange={() => updateField("universityType", "government")}
                    required
                  />
                  <span>{t.governmentUniversity}</span>
                </label>
                <label className={`choice-card${form.universityType === "private" ? " choice-card--selected" : ""}`}>
                  <input
                    type="radio"
                    name="universityType"
                    value="private"
                    checked={form.universityType === "private"}
                    onChange={() => updateField("universityType", "private")}
                    required
                  />
                  <span>{t.privateUniversity}</span>
                </label>
              </div>
            </fieldset>
          </div>

          <div className="form-bottom">
            <button className="primary-button" type="submit" disabled={!formIsValid || submitting}>
              {submitting ? (
                <LoaderCircle aria-hidden="true" size={17} className="button-spinner" />
              ) : saved ? (
                <CheckCircle2 aria-hidden="true" size={17} />
              ) : (
                <Send aria-hidden="true" size={16} />
              )}
              <span>{submitting ? t.submitting : t.submit}</span>
              {!submitting && !saved ? <ArrowLeft aria-hidden="true" size={15} /> : null}
            </button>
          </div>

          {message ? (
            <div className={`form-message form-message--${message.type}`} role={message.type === "error" ? "alert" : "status"}>
              {message.type === "success" ? <CheckCircle2 aria-hidden="true" size={18} /> : <CircleAlert aria-hidden="true" size={18} />}
              <div>
                {saved ? <strong>{t.successTitle}. </strong> : null}
                <span>{message.text}</span>
                {saved ? (
                  <div className="success-actions">
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        setMessage(null);
                        setSaved(false);
                        document.getElementById("registration")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      {t.resetForm}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
