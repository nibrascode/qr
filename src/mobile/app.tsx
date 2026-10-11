import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, QrCode, ScanLine, Shapes, UserRound } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Toaster } from "sonner";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AccountScreen } from "./screens/account";
import { CreateScreen } from "./screens/create";
import { SavedScreen } from "./screens/saved";
import { ScanScreen } from "./screens/scan";
import { TemplatesScreen } from "./screens/templates";
import { useSession } from "./session";
import { useM } from "./use-m";

type Tab = "create" | "scan" | "templates" | "saved" | "account";

function Shell() {
  const { t } = useI18n();
  const m = useM();
  const [tab, setTab] = useState<Tab>("create");
  const backOverride = useRef<(() => boolean) | null>(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const init = useSession((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  // Android back: close the scanner, else go to "create", else exit.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    void import("@capacitor/app").then(async ({ App }) => {
      const handle = await App.addListener("backButton", () => {
        if (backOverride.current?.()) return;
        if (tabRef.current !== "create") setTab("create");
        else void App.exitApp();
      });
      remove = () => void handle.remove();
    });
    return () => remove?.();
  }, []);

  const registerBack = useCallback((fn: (() => boolean) | null) => {
    backOverride.current = fn;
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof QrCode }[] = [
    { id: "create", label: t.nav.create, icon: QrCode },
    { id: "scan", label: t.nav.scan, icon: ScanLine },
    { id: "templates", label: t.nav.templates, icon: Shapes },
    { id: "saved", label: m.saved, icon: LayoutGrid },
    { id: "account", label: m.account, icon: UserRound },
  ];
  const upgrade = () => setTab("account");

  return (
    <div className="min-h-dvh bg-bg pt-[env(safe-area-inset-top)] text-fg">
      <main className="mx-auto max-w-xl pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {tab === "create" && <CreateScreen onUpgrade={upgrade} />}
        {tab === "scan" && <ScanScreen registerBack={registerBack} />}
        {tab === "templates" && <TemplatesScreen onUse={() => setTab("create")} onUpgrade={upgrade} />}
        {tab === "saved" && <SavedScreen onOpen={() => setTab("create")} />}
        {tab === "account" && <AccountScreen />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map((x) => {
            const Icon = x.icon;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => setTab(x.id)}
                aria-current={tab === x.id ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] text-muted",
                  tab === x.id && "text-primary",
                )}
              >
                <Icon className="size-5" />
                {x.label}
              </button>
            );
          })}
        </div>
      </nav>
      <Toaster theme="dark" position="top-center" offset="calc(env(safe-area-inset-top) + 12px)" />
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
