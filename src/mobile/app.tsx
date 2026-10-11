import { useCallback, useEffect, useRef } from "react";
import { ArrowLeft, Home, LayoutGrid, QrCode, ScanLine, UserRound } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Toaster } from "sonner";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useNav, type Tab } from "./nav";
import { Onboarding } from "./onboarding";
import { Paywall } from "./paywall";
import { usePrefs } from "./prefs";
import { AccountScreen } from "./screens/account";
import { BarcodeScreen } from "./screens/barcode";
import { BatchScreen } from "./screens/batch";
import { CreateScreen } from "./screens/create";
import { DynamicScreen } from "./screens/dynamic";
import { HomeScreen } from "./screens/home";
import { SavedScreen } from "./screens/saved";
import { ScanScreen } from "./screens/scan";
import { TemplatesScreen } from "./screens/templates";
import { useSession } from "./session";
import { usePaywall } from "./ui";
import { useM } from "./use-m";

function Shell() {
  const { t } = useI18n();
  const m = useM();
  const { tab, sub, go, back } = useNav();
  const backOverride = useRef<(() => boolean) | null>(null);
  const init = useSession((s) => s.init);
  const { loaded, onboarded, load, theme } = usePrefs();

  useEffect(() => {
    void load();
    void init();
  }, [init, load]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, sub]);

  // Android back: scanner → paywall → sub-screen → home → exit.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    void import("@capacitor/app").then(async ({ App }) => {
      const handle = await App.addListener("backButton", () => {
        if (backOverride.current?.()) return;
        if (usePaywall.getState().open) return usePaywall.getState().hide();
        if (!useNav.getState().back()) void App.exitApp();
      });
      remove = () => void handle.remove();
    });
    return () => remove?.();
  }, []);

  const registerBack = useCallback((fn: (() => boolean) | null) => {
    backOverride.current = fn;
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof QrCode }[] = [
    { id: "home", label: m.home, icon: Home },
    { id: "create", label: t.nav.create, icon: QrCode },
    { id: "scan", label: t.nav.scan, icon: ScanLine },
    { id: "library", label: m.library, icon: LayoutGrid },
    { id: "account", label: m.account, icon: UserRound },
  ];

  if (!loaded) return <div className="min-h-dvh bg-bg" />;

  return (
    <div className="min-h-dvh bg-bg pt-[env(safe-area-inset-top)] text-fg">
      <main key={`${tab}/${sub ?? ""}`} className="screen-in mx-auto max-w-xl pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {sub && (
          <button type="button" onClick={back} className="mx-4 mt-3 -mb-1 flex items-center gap-1 text-sm text-muted">
            <ArrowLeft className="size-4 rtl:rotate-180" />
          </button>
        )}
        {sub === "templates" && <TemplatesScreen />}
        {sub === "barcode" && <BarcodeScreen />}
        {sub === "batch" && <BatchScreen />}
        {sub === "dynamic" && <DynamicScreen />}
        {!sub && tab === "home" && <HomeScreen />}
        {!sub && tab === "create" && <CreateScreen />}
        {!sub && tab === "scan" && <ScanScreen registerBack={registerBack} />}
        {!sub && tab === "library" && <SavedScreen />}
        {!sub && tab === "account" && <AccountScreen />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map((x) => {
            const Icon = x.icon;
            const active = tab === x.id && !sub;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => go(x.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-15 flex-col items-center justify-center gap-1 text-[10px] text-muted transition-colors",
                  tab === x.id && "text-primary",
                )}
              >
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-all", tab === x.id && "bg-primary/15")}>
                  <Icon className="size-5" />
                </span>
                {x.label}
              </button>
            );
          })}
        </div>
      </nav>
      <Paywall />
      {!onboarded && <Onboarding />}
      <Toaster theme={theme} position="top-center" offset="calc(env(safe-area-inset-top) + 12px)" />
    </div>
  );
}

export function MobileApp() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}
