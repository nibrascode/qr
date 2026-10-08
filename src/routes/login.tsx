import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode } from "lucide-react";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n";
import { APP_VERSION } from "@/lib/version";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.6v3h4c2.4-2.2 3.5-5.4 3.5-8.7Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-4-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.3v3.1C3.3 21.3 7.4 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.5l4.1-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.1 15.2 0 12 0 7.4 0 3.3 2.7 1.3 6.5l4.1 3.1C6.3 6.8 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}

function Login() {
  const { t } = useI18n();
  const google = GROK_PROVIDERS.find((p) => p.idp === "google");

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-5xl items-center gap-10 px-4 py-10 md:grid-cols-2">
      <div className="hidden md:block">
        <div className="flex items-center gap-2 text-primary">
          <QrCode className="size-5" />
          <span className="text-sm font-medium">Nibras QR</span>
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
          {t.tagline}
        </h1>
        <p className="mt-4 max-w-sm text-muted">{t.login.body}</p>
      </div>
      <div className="mx-auto w-full max-w-sm space-y-5">
        <h2 className="font-display text-xl font-semibold">{t.login.title}</h2>
        {authEnabled && google ? (
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full gap-2.5 text-sm"
            onClick={() => signIn(google.providerId, { callbackURL: "/dashboard" })}
          >
            <GoogleMark />
            {t.login.google}
          </Button>
        ) : (
          <p className="text-sm text-muted">{t.login.error}</p>
        )}
        <p className="text-center text-xs text-subtle">
          <Link to="/privacy" className="hover:text-muted">
            {t.legal.privacy}
          </Link>
          <span className="mx-2">·</span>
          <span>
            {t.legal.version} {APP_VERSION}
          </span>
        </p>
      </div>
    </main>
  );
}
