import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { QR_PRIVACY } from "../privacy-text";
import { openUrl, QR_PRIVACY_URL } from "../links";
import { ScreenTitle } from "../ui";
import { useM } from "../use-m";

/** Bundled privacy policy: works offline. AZ text for AZ, English otherwise. */
export function PrivacyScreen() {
  const { lang, t } = useI18n();
  const m = useM();
  const policy = lang === "az" ? QR_PRIVACY.az : QR_PRIVACY.en;
  return (
    <div className="space-y-3 px-4 py-4" dir="ltr" lang={lang === "az" ? "az" : "en"}>
      <ScreenTitle>{t.legal.privacy}</ScreenTitle>
      <p className="text-xs text-subtle">{policy.updated}</p>
      {policy.paragraphs.map((p) =>
        /^\d+\.\s/.test(p) ? (
          <h2 key={p} className="pt-2 font-display text-base font-semibold">
            {p}
          </h2>
        ) : (
          <p key={p} className="text-sm leading-relaxed text-muted">
            {p}
          </p>
        ),
      )}
      <Button variant="outline" className="mt-2 w-full gap-2" onClick={() => void openUrl(QR_PRIVACY_URL)}>
        <ExternalLink className="size-4" /> {m.privacyWeb}
      </Button>
    </div>
  );
}
