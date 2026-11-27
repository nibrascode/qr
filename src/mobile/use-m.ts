import { useI18n } from "@/lib/i18n";
import { IS_HUAWEI } from "./config";
import { MOBILE_STRINGS, type MobileDict } from "./strings";
import { huaweiDict } from "./strings-store";

export function useM(): MobileDict {
  const { lang } = useI18n();
  return IS_HUAWEI ? huaweiDict(lang) : MOBILE_STRINGS[lang];
}
