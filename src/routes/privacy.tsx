import { createFileRoute, Link } from "@tanstack/react-router";
import { PRIVACY } from "@/lib/privacy";
import { useI18n } from "@/lib/i18n";
import { APP_VERSION } from "@/lib/version";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang, t } = useI18n();
  const policy = PRIVACY[lang];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-medium text-primary">{t.brand}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {policy.title}
      </h1>
      <p className="mt-2 text-sm text-muted">{policy.updated}</p>
      <p className="mt-6 text-sm leading-relaxed text-fg/90">{policy.intro}</p>
      <div className="mt-8 space-y-7">
        {policy.sections.map((section) => (
          <section key={section.h}>
            <h2 className="font-display text-lg font-semibold">{section.h}</h2>
            <div className="mt-2 space-y-2">
              {section.body.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-muted">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 text-xs text-subtle">
        {t.legal.version} {APP_VERSION}
        {" · "}
        <Link to="/" className="hover:text-fg">
          {t.brand}
        </Link>
      </p>
    </main>
  );
}
