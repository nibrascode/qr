import { useState } from "react";
import { ChevronRight, Crown, ExternalLink, LogOut, Moon, RefreshCcw, ShieldCheck, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { LANGS, LOCALE, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { backendConfigured } from "../config";
import { haptic } from "../haptics";
import { NIBRAS_CODE_URL, openUrl } from "../links";
import { useNav } from "../nav";
import { usePrefs } from "../prefs";
import { purchasesAvailable, restore } from "../purchases";
import { useIsPro, useSession } from "../session";
import { MOBILE_VERSION } from "../version";
import { Card, ScreenTitle, usePaywall } from "../ui";
import { useM } from "../use-m";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.6v3h4c2.4-2.2 3.5-5.4 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-4-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.3v3.1C3.3 21.3 7.4 24 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.5l4.1-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.1 15.2 0 12 0 7.4 0 3.3 2.7 1.3 6.5l4.1 3.1C6.3 6.8 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

export function AccountScreen() {
  const { t, lang, setLang } = useI18n();
  const m = useM();
  const { user, busy, signIn, signOut, deleteAccount, storePro, setStorePro } = useSession();
  const openSub = useNav((s) => s.open);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isPro = useIsPro();
  const showPaywall = usePaywall((s) => s.show);
  const { theme, setTheme } = usePrefs();

  const onSignIn = async () => {
    try {
      await signIn();
      haptic("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.login.error;
      if (/cancel/i.test(msg)) return;
      toast.error(/network|timeout|connect|fetch/i.test(msg) ? m.offline : msg);
    }
  };

  const onRestore = async () => {
    try {
      const res = await restore();
      setStorePro(res);
      toast[res.pro ? "success" : "message"](res.pro ? m.restored : m.nothingToRestore);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const onDelete = async () => {
    try {
      await deleteAccount();
      setConfirmDelete(false);
      haptic("success");
      toast.success(m.deleteDone);
    } catch {
      haptic("error");
      toast.error(m.deleteFailed);
    }
  };

  const manage = async () => {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: "https://play.google.com/store/account/subscriptions?package=com.nibras.qr" });
  };

  return (
    <div className="space-y-5 px-4 py-4">
      <ScreenTitle>{m.account}</ScreenTitle>

      <Card>
        {user ? (
          <div className="flex items-center gap-3">
            {user.image ? (
              <img src={user.image} alt="" className="size-12 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="grid size-12 place-items-center rounded-full bg-bg-subtle text-sm font-semibold">
                {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{user.name ?? user.email}</p>
              <p className="truncate text-xs text-subtle">{user.email}</p>
            </div>
            <Button size="icon" variant="ghost" aria-label={m.signOut} disabled={busy} onClick={() => void signOut()}>
              <LogOut />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-semibold">{m.signedOut}</p>
            <p className="text-xs text-muted">{backendConfigured ? m.signInHint : m.notConfigured}</p>
            <Button
              variant="outline"
              className="h-12 w-full gap-2.5 rounded-xl"
              disabled={busy || !backendConfigured || !Capacitor.isNativePlatform()}
              onClick={() => void onSignIn()}
            >
              <GoogleMark />
              {t.login.google}
            </Button>
            <button type="button" className="block w-full text-center text-[11px] text-subtle underline" onClick={() => openSub("privacy")}>
              {t.legal.privacy}
            </button>
          </div>
        )}
      </Card>

      {isPro ? (
        <section className="rounded-2xl pro-gradient p-4 text-white shadow-lg shadow-fuchsia-500/20">
          <div className="flex items-center gap-3">
            <Crown className="size-7" />
            <div className="flex-1">
              <p className="font-display text-lg font-bold">{m.proActive}</p>
              {storePro?.expiresAt && (
                <p className="text-xs text-white/85">
                  {m.expires}: {new Date(storePro.expiresAt).toLocaleDateString(LOCALE[lang])}
                </p>
              )}
            </div>
          </div>
          {storePro?.expiresAt && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => void manage()}>
              {m.manage}
            </Button>
          )}
        </section>
      ) : (
        <button
          type="button"
          onClick={showPaywall}
          className="press shimmer flex w-full items-center gap-3 rounded-2xl pro-gradient p-4 text-start text-white"
        >
          <Crown className="size-7 shrink-0" />
          <span className="flex-1">
            <span className="block font-display text-lg font-bold">{m.proBannerTitle}</span>
            <span className="block text-xs text-white/85">{m.proBannerBody}</span>
          </span>
          <ChevronRight className="rtl:rotate-180" />
        </button>
      )}
      {!isPro && purchasesAvailable() && (
        <Button variant="ghost" size="sm" onClick={() => void onRestore()}>
          <RefreshCcw /> {m.restore}
        </Button>
      )}

      <Card className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">{m.theme}</p>
          <div className="grid grid-cols-2 gap-2">
            {(["dark", "light"] as const).map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => {
                  haptic("tap");
                  setTheme(th);
                }}
                className={cn(
                  "press flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm",
                  theme === th ? "bg-primary text-primary-fg" : "bg-bg-subtle",
                )}
              >
                {th === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                {th === "dark" ? m.dark : m.light}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">{m.language}</p>
          <div className="grid grid-cols-5 gap-2">
            {LANGS.map((l) => (
              <Button key={l.id} size="sm" variant={lang === l.id ? "default" : "outline"} onClick={() => setLang(l.id)}>
                {l.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-1">
        <p className="mb-1 text-sm font-medium">{m.about}</p>
        <button type="button" className="press flex w-full items-center gap-3 rounded-xl py-2 text-start text-sm" onClick={() => openSub("privacy")}>
          <ShieldCheck className="size-4 text-primary" />
          <span className="flex-1">{t.legal.privacy}</span>
          <ChevronRight className="size-4 text-subtle rtl:rotate-180" />
        </button>
        <button type="button" className="press flex w-full items-center gap-3 rounded-xl py-2 text-start text-sm" onClick={() => void openUrl(NIBRAS_CODE_URL)}>
          <ExternalLink className="size-4 text-primary" />
          <span className="flex-1">{m.madeBy}</span>
          <span className="text-xs text-subtle">nibrascode.com</span>
        </button>
        <p className="pt-1 text-xs text-subtle">
          Nibras QR · {t.legal.version} {MOBILE_VERSION}
        </p>
      </Card>

      {user && (
        <Card className="space-y-3 border border-red-500/30">
          {!confirmDelete ? (
            <Button variant="ghost" className="w-full gap-2 text-red-500" disabled={busy} onClick={() => { haptic("warning"); setConfirmDelete(true); }}>
              <Trash2 className="size-4" /> {m.deleteAccount}
            </Button>
          ) : (
            <>
              <p className="font-semibold text-red-500">{m.deleteAccount}</p>
              <p className="text-xs text-muted">{m.deleteBody}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>
                  {t.common.cancel}
                </Button>
                <Button className="bg-red-600 text-white hover:bg-red-600/90" disabled={busy} onClick={() => void onDelete()}>
                  {m.deleteConfirm}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
