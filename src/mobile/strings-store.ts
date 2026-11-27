import { useI18n, type Lang } from "@/lib/i18n";
import { MOBILE_STRINGS, type MobileDict } from "./strings";

/**
 * Huawei build: the same UI strings with "Google Play" → "AppGallery"
 * (paywall subtitle, legal line, store-unavailable message, …).
 */
const cache = new Map<Lang, MobileDict>();
export function huaweiDict(lang: Lang): MobileDict {
  let d = cache.get(lang);
  if (!d) {
    d = Object.fromEntries(
      Object.entries(MOBILE_STRINGS[lang]).map(([k, v]) => [k, typeof v === "string" ? v.replace(/Google Play/g, "AppGallery") : v]),
    ) as MobileDict;
    cache.set(lang, d);
  }
  return d;
}

/** Email-code sign-in (Huawei build only). */
const AUTH = {
  az: {
    emailSignIn: "E-poçt ilə daxil ol",
    emailPlaceholder: "E-poçt ünvanı",
    sendCode: "Kod göndər",
    codeSent: "{email} ünvanına 6 rəqəmli kod göndərdik.",
    codePlaceholder: "6 rəqəmli kod",
    verifyCode: "Təsdiq et",
    changeEmail: "Başqa e-poçt",
    or: "və ya",
    invalidEmail: "Düzgün e-poçt ünvanı yaz.",
  },
  en: {
    emailSignIn: "Sign in with email",
    emailPlaceholder: "Email address",
    sendCode: "Send code",
    codeSent: "We sent a 6-digit code to {email}.",
    codePlaceholder: "6-digit code",
    verifyCode: "Verify",
    changeEmail: "Use another email",
    or: "or",
    invalidEmail: "Enter a valid email address.",
  },
  ar: {
    emailSignIn: "الدخول بالبريد الإلكتروني",
    emailPlaceholder: "البريد الإلكتروني",
    sendCode: "إرسال الرمز",
    codeSent: "أرسلنا رمزاً من 6 أرقام إلى {email}.",
    codePlaceholder: "رمز من 6 أرقام",
    verifyCode: "تأكيد",
    changeEmail: "بريد آخر",
    or: "أو",
    invalidEmail: "أدخل بريداً إلكترونياً صحيحاً.",
  },
  ru: {
    emailSignIn: "Войти по email",
    emailPlaceholder: "Адрес email",
    sendCode: "Отправить код",
    codeSent: "Мы отправили 6-значный код на {email}.",
    codePlaceholder: "6-значный код",
    verifyCode: "Подтвердить",
    changeEmail: "Другой email",
    or: "или",
    invalidEmail: "Введите корректный email.",
  },
  tr: {
    emailSignIn: "E-posta ile giriş yap",
    emailPlaceholder: "E-posta adresi",
    sendCode: "Kod gönder",
    codeSent: "{email} adresine 6 haneli kod gönderdik.",
    codePlaceholder: "6 haneli kod",
    verifyCode: "Doğrula",
    changeEmail: "Başka e-posta",
    or: "veya",
    invalidEmail: "Geçerli bir e-posta adresi gir.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function useAuthM() {
  const { lang } = useI18n();
  return AUTH[lang];
}

/** Extra package name (Huawei weekly subscription). */
const PLANS = {
  az: { weekly: "Həftəlik" },
  en: { weekly: "Weekly" },
  ar: { weekly: "أسبوعي" },
  ru: { weekly: "Неделя" },
  tr: { weekly: "Haftalık" },
} satisfies Record<Lang, { weekly: string }>;

export function usePlanLabels() {
  const { lang } = useI18n();
  return PLANS[lang];
}
