import type { RegistrationField } from "@/lib/validation";

export type Language = "ar" | "en";

type Messages = {
  languageButton: string;
  siteName: string;
  englishName: string;
  headerNote: string;
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  heroPointOne: string;
  heroPointTwo: string;
  heroPointThree: string;
  formTitle: string;
  formDescription: string;
  fields: Record<RegistrationField, string>;
  placeholders: Record<"fullName" | "college" | "department" | "phone" | "nationalId" | "address", string>;
  help: Record<"fullName" | "phone" | "nationalId" | "address" | "birthDate" | "department", string>;
  optional: string;
  selectUniversity: string;
  governmentUniversity: string;
  privateUniversity: string;
  submit: string;
  submitting: string;
  validationSummary: string;
  duplicateError: string;
  genericSubmitError: string;
  networkError: string;
  successTitle: string;
  successDescription: string;
  resetForm: string;
  statusValid: string;
  statusInvalid: string;
  statusOptional: string;
  mismatchBirthDate: string;
  nationalIdEnglishOnly: string;
  admin: {
    title: string;
    description: string;
    accessLabel: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    login: string;
    loggingIn: string;
    loginError: string;
    loginServiceUnavailable: string;
    tooManyAttempts: string;
    logout: string;
    newRequests: string;
    oldRequests: string;
    searchPlaceholder: string;
    copyVisible: string;
    copyAll: string;
    emptyRequests: string;
    emptySearch: string;
    loadingRequests: string;
    loadMore: string;
    moveOld: string;
    moveNew: string;
    delete: string;
    deleted: string;
    confirmDelete: string;
    copied: string;
    copyFailed: string;
    requestsLoadError: string;
    statusUpdateError: string;
    deleteError: string;
    networkError: string;
    loginRequired: string;
    fields: Record<"fullName" | "college" | "department" | "phone" | "nationalId" | "address" | "buildingNumber" | "governorate" | "studyYear" | "birthDate" | "university" | "createdAt", string>;
    backToSite: string;
    noDepartment: string;
    pageCount: (shown: number, total: number) => string;
  };
};

const ar: Messages = {
  languageButton: "English",
  siteName: "جامعة العاصمة",
  englishName: "Capital University",
  headerNote: "بوابة التسجيل الإلكتروني",
  heroEyebrow: "",
  heroTitle: "بوابة الزيارات العسكرية",
  heroAccent: "",
  heroDescription: "",
  heroPointOne: "",
  heroPointTwo: "",
  heroPointThree: "",
  formTitle: "استمارة التسجيل",
  formDescription: "",
  fields: {
    fullName: "الاسم رباعي",
    college: "الكلية",
    department: "القسم",
    phone: "رقم التليفون",
    nationalId: "الرقم القومي",
    address: "العنوان",
    birthDate: "تاريخ الميلاد",
    universityType: "اختر الجامعة",
    studyYear: "الفرقة الدراسية",
    governorate: "المحافظة",
    buildingNumber: "رقم العمارة",
  },
  placeholders: {
    fullName: "اكتب اسمك الرباعي",
    college: "مثال: كلية الهندسة",
    department: "مثال: هندسة الحاسبات (اختياري)",
    phone: "01xxxxxxxxx",
    nationalId: "14 رقمًا",
    address: "المحافظة، المدينة، الشارع، ورقم العقار",
  },
  help: {
    fullName: "",
    phone: "",
    nationalId: "",
    address: "",
    birthDate: "يجب أن يطابق تاريخ الميلاد المسجل في الرقم القومي.",
    department: "",
  },
  optional: "اختياري",
  selectUniversity: "",
  governmentUniversity: "جامعة العاصمة الحكومية",
  privateUniversity: "جامعة العاصمة الأهلية",
  submit: "تسليم",
  submitting: "جارٍ إرسال الطلب...",
  validationSummary: "يرجى استكمال الحقول المطلوبة والتأكد من صحة البيانات.",
  duplicateError: "تم تسجيل طلب سابق بهذا الرقم القومي. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع إدارة الجامعة.",
  genericSubmitError: "تعذّر حفظ الطلب الآن. حاول مرة أخرى بعد قليل.",
  networkError: "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.",
  successTitle: "تم استلام طلبك بنجاح",
  successDescription: "شكرًا لاهتمامك بجامعة العاصمة. سنراجع بياناتك ونتواصل معك عند الحاجة.",
  resetForm: "تقديم طلب جديد",
  statusValid: "مكتمل",
  statusInvalid: "مطلوب أو غير صحيح",
  statusOptional: "اختياري",
  mismatchBirthDate: "تاريخ الميلاد لا يطابق التاريخ المسجل في الرقم القومي.",
  nationalIdEnglishOnly: "اكتب الرقم القومي بالأرقام الإنجليزية فقط.",
  admin: {
    title: "لوحة إدارة الطلبات",
    description: "إدارة طلبات التسجيل الواردة إلى جامعة العاصمة.",
    accessLabel: "دخول الإدارة",
    passwordLabel: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة مرور الإدارة",
    login: "دخول آمن",
    loggingIn: "جارٍ التحقق...",
    loginError: "كلمة المرور غير صحيحة. حاول مرة أخرى.",
    loginServiceUnavailable: "خدمة تسجيل الدخول غير متاحة حاليًا. يرجى مراجعة إعداد قاعدة البيانات وترحيل الجداول.",
    tooManyAttempts: "تم إيقاف المحاولات مؤقتًا لكثرة المحاولات الخاطئة. حاول لاحقًا.",
    logout: "تسجيل الخروج",
    newRequests: "الطلبات الجديدة",
    oldRequests: "الطلبات القديمة",
    searchPlaceholder: "ابحث بالاسم أو رقم الهاتف أو الرقم القومي",
    copyVisible: "نسخ الطلبات الظاهرة",
    copyAll: "نسخ الكل",
    emptyRequests: "لا توجد طلبات في هذا القسم حتى الآن.",
    emptySearch: "لا توجد نتائج مطابقة للبحث.",
    loadingRequests: "جارٍ تحميل الطلبات...",
    loadMore: "عرض المزيد",
    moveOld: "نقل للقديمة",
    moveNew: "إعادة للجديدة",
    delete: "حذف الطلب",
    deleted: "تم حذف الطلب بنجاح.",
    confirmDelete: "هل أنت متأكد من حذف هذا الطلب نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
    copied: "تم النسخ",
    copyFailed: "تعذّر النسخ. حاول تحديد النص ونسخه يدويًا.",
    requestsLoadError: "تعذّر تحميل الطلبات. تحقق من الاتصال وحاول مرة أخرى.",
    statusUpdateError: "تعذّر تحديث حالة الطلب.",
    deleteError: "تعذّر حذف الطلب.",
    networkError: "تعذّر الاتصال بالخادم. حاول مرة أخرى.",
    loginRequired: "انتهت الجلسة. سجّل الدخول مرة أخرى.",
    fields: {
      fullName: "الاسم",
      college: "الكلية",
      department: "القسم",
      phone: "رقم التليفون",
      nationalId: "الرقم القومي",
      address: "العنوان",
      buildingNumber: "رقم العمارة",
      governorate: "المحافظة",
      studyYear: "الفرقة الدراسية",
      birthDate: "تاريخ الميلاد",
      university: "الجامعة",
      createdAt: "تاريخ ووقت التقديم",
    },
    backToSite: "العودة إلى صفحة التسجيل",
    noDepartment: "—",
    pageCount: (shown, total) => `عرض ${shown} من ${total} طلب`,
  },
};

const en: Messages = {
  languageButton: "العربية",
  siteName: "Capital University",
  englishName: "Capital University",
  headerNote: "Online registration portal",
  heroEyebrow: "",
  heroTitle: "Military Visits Portal",
  heroAccent: "",
  heroDescription: "",
  heroPointOne: "",
  heroPointTwo: "",
  heroPointThree: "",
  formTitle: "Registration form",
  formDescription: "",
  fields: {
    fullName: "Full name (four parts)",
    college: "College",
    department: "Department",
    phone: "Mobile number",
    nationalId: "National ID",
    address: "Address",
    birthDate: "Date of birth",
    universityType: "Choose a university",
    studyYear: "Study year",
    governorate: "Governorate",
    buildingNumber: "Building number",
  },
  placeholders: {
    fullName: "Enter your four-part name",
    college: "For example: Faculty of Engineering",
    department: "For example: Computer Engineering (optional)",
    phone: "01xxxxxxxxx",
    nationalId: "14 digits",
    address: "Governorate, city, street and building number",
  },
  help: {
    fullName: "",
    phone: "",
    nationalId: "",
    address: "",
    birthDate: "Must match the date of birth encoded in your national ID.",
    department: "",
  },
  optional: "Optional",
  selectUniversity: "",
  governmentUniversity: "Capital University — Government",
  privateUniversity: "Capital University — Private / Ahleya",
  submit: "Submit application",
  submitting: "Submitting your application...",
  validationSummary: "Please complete the required fields and check your details.",
  duplicateError: "An application with this national ID has already been submitted. If you think this is an error, please contact the university.",
  genericSubmitError: "We could not save your application right now. Please try again shortly.",
  networkError: "Could not reach the server. Check your internet connection and try again.",
  successTitle: "Application received",
  successDescription: "Thank you for choosing Capital University. We will review your details and contact you if needed.",
  resetForm: "Submit another application",
  statusValid: "Complete",
  statusInvalid: "Required or invalid",
  statusOptional: "Optional",
  mismatchBirthDate: "This date does not match the date encoded in the national ID.",
  nationalIdEnglishOnly: "Enter the national ID using English digits only.",
  admin: {
    title: "Applications dashboard",
    description: "Manage registration applications submitted to Capital University.",
    accessLabel: "Administrator sign in",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter the administrator password",
    login: "Sign in securely",
    loggingIn: "Verifying...",
    loginError: "The password is incorrect. Please try again.",
    loginServiceUnavailable: "The sign-in service is unavailable. Check the database configuration and migrations.",
    tooManyAttempts: "Too many incorrect attempts. Sign-in is temporarily paused; try again later.",
    logout: "Sign out",
    newRequests: "New requests",
    oldRequests: "Old requests",
    searchPlaceholder: "Search by name, phone or national ID",
    copyVisible: "Copy visible requests",
    copyAll: "Copy all",
    emptyRequests: "There are no requests in this section yet.",
    emptySearch: "No matching requests were found.",
    loadingRequests: "Loading applications...",
    loadMore: "Load more",
    moveOld: "Move to old",
    moveNew: "Move back to new",
    delete: "Delete request",
    deleted: "Request deleted.",
    confirmDelete: "Are you sure you want to permanently delete this application? This cannot be undone.",
    copied: "Copied",
    copyFailed: "Could not copy. Please select and copy the text manually.",
    requestsLoadError: "Could not load applications. Check your connection and try again.",
    statusUpdateError: "Could not update the application status.",
    deleteError: "Could not delete the application.",
    networkError: "Could not reach the server. Please try again.",
    loginRequired: "Your session expired. Please sign in again.",
    fields: {
      fullName: "Name",
      college: "College",
      department: "Department",
      phone: "Mobile number",
      nationalId: "National ID",
      address: "Address",
      buildingNumber: "Building number",
      governorate: "Governorate",
      studyYear: "Study year",
      birthDate: "Date of birth",
      university: "University",
      createdAt: "Submitted",
    },
    backToSite: "Back to registration",
    noDepartment: "—",
    pageCount: (shown, total) => `Showing ${shown} of ${total} applications`,
  },
};

export const messages: Record<Language, Messages> = { ar, en };
export type AppMessages = Messages;
