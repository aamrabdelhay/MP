import { z } from "zod";

/** Converts Arabic-Indic and Eastern Arabic numerals to Western numerals. */
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
    return digit;
  });
}

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPastISODate(value: string): boolean {
  return isValidCalendarDate(value) && value < todayISODate();
}

const VALID_GOVERNORATE_CODES = new Set([
  "01", // Cairo
  "02", // Alexandria
  "03", // Port Said
  "04", // Suez
  "11", // Damietta
  "12", // Dakahlia
  "13", // Sharqia
  "14", // Qalyubia
  "15", // Kafr El Sheikh
  "16", // Gharbia
  "17", // Menoufia
  "18", // Beheira
  "19", // Ismailia
  "21", // Giza
  "22", // Beni Suef
  "23", // Fayoum
  "24", // Minya
  "25", // Assiut
  "26", // Sohag
  "27", // Qena
  "28", // Aswan
  "29", // Luxor
  "31", // Red Sea
  "32", // New Valley
  "33", // Matrouh
  "34", // North Sinai
  "35", // South Sinai
  "88", // Born outside Egypt
]);

/** Returns the birth date encoded in a structurally valid Egyptian ID, or null. */
export function getNationalIdBirthDate(value: string): string | null {
  const id = normalizeDigits(value);
  if (!/^\d{14}$/.test(id) || (id[0] !== "2" && id[0] !== "3")) return null;

  const yearInCentury = Number(id.slice(1, 3));
  const year = (id[0] === "2" ? 1900 : 2000) + yearInCentury;
  const month = id.slice(3, 5);
  const day = id.slice(5, 7);
  const birthDate = `${String(year).padStart(4, "0")}-${month}-${day}`;

  if (!isValidCalendarDate(birthDate) || !isPastISODate(birthDate)) return null;
  if (!VALID_GOVERNORATE_CODES.has(id.slice(7, 9))) return null;
  return birthDate;
}

function nationalIdIssue(value: string): string | null {
  const id = normalizeDigits(value);
  if (!/^\d{14}$/.test(id)) return "يجب أن يتكون الرقم القومي من 14 رقمًا.";
  if (id[0] !== "2" && id[0] !== "3") return "يجب أن يبدأ الرقم القومي بالرقم 2 أو 3.";

  const yearInCentury = Number(id.slice(1, 3));
  const year = (id[0] === "2" ? 1900 : 2000) + yearInCentury;
  const birthDate = `${String(year).padStart(4, "0")}-${id.slice(3, 5)}-${id.slice(5, 7)}`;
  if (!isValidCalendarDate(birthDate)) return "تاريخ الميلاد داخل الرقم القومي غير صحيح.";
  if (!isPastISODate(birthDate)) return "تاريخ الميلاد داخل الرقم القومي يجب أن يكون في الماضي.";
  if (!VALID_GOVERNORATE_CODES.has(id.slice(7, 9))) return "كود المحافظة في الرقم القومي غير صحيح.";
  return null;
}

const fullNameSchema = z
  .string()
  .trim()
  .min(1, "الاسم مطلوب.")
  .max(160, "الاسم أطول من المسموح.")
  .superRefine((value, context) => {
    const words = value.split(/\s+/).filter(Boolean);
    if (words.length < 4) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "اكتب الاسم رباعيًّا (أربعة أجزاء على الأقل)." });
      return;
    }

    const isValidNamePart = (word: string) => {
      const characters = Array.from(word);
      const letters = characters.filter((character) => /\p{L}/u.test(character));
      const onlyArabicOrLatinLetters = characters.every((character) => {
        if (/\p{M}/u.test(character)) return true;
        return (
          /\p{L}/u.test(character) &&
          (/\p{Script=Arabic}/u.test(character) || /\p{Script=Latin}/u.test(character))
        );
      });
      return letters.length >= 2 && onlyArabicOrLatinLetters;
    };

    if (words.some((word) => !isValidNamePart(word))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب أن يتكوّن كل جزء من حرفين على الأقل، دون أرقام أو رموز.",
      });
    }
  });

const phoneSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeDigits(value).trim() : value),
  z.string().regex(/^01[0125]\d{8}$/, "أدخل رقم موبايل مصريًا صحيحًا من 11 رقمًا."),
);

const nationalIdSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeDigits(value).trim() : value),
  z.string().superRefine((value, context) => {
    const issue = nationalIdIssue(value);
    if (issue) context.addIssue({ code: z.ZodIssueCode.custom, message: issue });
  }),
);

export const registrationSchema = z
  .object({
    fullName: fullNameSchema,
    college: z.string().trim().min(1, "الكلية مطلوبة.").max(160, "اسم الكلية أطول من المسموح."),
    department: z.string().trim().max(160, "اسم القسم أطول من المسموح.").default(""),
    phone: phoneSchema,
    nationalId: nationalIdSchema,
    address: z.string().trim().min(10, "العنوان يجب ألا يقل عن 10 أحرف.").max(500, "العنوان أطول من المسموح."),
    birthDate: z
      .string()
      .trim()
      .refine(isPastISODate, "اختر تاريخ ميلاد صحيحًا في الماضي."),
    universityType: z.enum(["government", "private"], {
      required_error: "اختر الجامعة.",
      invalid_type_error: "اختر الجامعة.",
    }),
  })
  .superRefine((value, context) => {
    const idBirthDate = getNationalIdBirthDate(value.nationalId);
    if (idBirthDate && isPastISODate(value.birthDate) && value.birthDate !== idBirthDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthDate"],
        message: "تاريخ الميلاد لا يطابق التاريخ المسجل في الرقم القومي.",
      });
    }
  });

export type RegistrationData = z.infer<typeof registrationSchema>;

export type RegistrationFormDraft = {
  fullName: string;
  college: string;
  department: string;
  phone: string;
  nationalId: string;
  address: string;
  birthDate: string;
  universityType: string;
};

export type RegistrationField = keyof RegistrationFormDraft;
export type FieldValidity = "valid" | "invalid" | "neutral";

export function getFieldValidity(
  field: RegistrationField,
  values: RegistrationFormDraft,
): FieldValidity {
  if (field === "department") {
    return values.department.trim() ? "valid" : "neutral";
  }

  const parsed = registrationSchema.safeParse(values);
  if (parsed.success) return "valid";
  return parsed.error.issues.some((issue) => issue.path[0] === field) ? "invalid" : "valid";
}

export function isRegistrationValid(values: RegistrationFormDraft): boolean {
  return registrationSchema.safeParse(values).success;
}

