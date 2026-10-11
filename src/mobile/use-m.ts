import { useI18n } from "@/lib/i18n";
import { MOBILE_STRINGS, type MobileDict } from "./strings";

export function useM(): MobileDict {
  const { lang } = useI18n();
  return MOBILE_STRINGS[lang];
}
