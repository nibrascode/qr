import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutGrid,
  QrCode,
  ScanLine,
  Shapes,
  Sparkles,
} from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LANGS, useI18n } from "@/lib/i18n";
import { APP_VERSION } from "@/lib/version";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function AuthSlot() {
  const { t } = useI18n();
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <Skeleton className="h-8 w-24 rounded-full" />;
  if (user) return <UserButton />;
  return (
    <Button asChild size="sm" variant="outline">
      <Link to="/login">{t.nav.signIn}</Link>
    </Button>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  const current = LANGS.find((l) => l.id === lang) ?? LANGS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="h-9 rounded-lg px-2.5 text-xs font-medium text-muted hover:bg-bg-subtle hover:text-fg"
        aria-label={current.native}
      >
        {current.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.id}
            onSelect={() => setLang(l.id)}
            className={lang === l.id ? "text-primary" : undefined}
          >
            <span className="w-7 text-xs text-subtle">{l.label}</span>
            {l.native}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-fg">
        <QrCode className="size-4" />
      </span>
      <span className="font-display text-sm font-semibold tracking-tight">
        Nibras QR
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/r/")) {
    return <div className="min-h-dvh bg-bg text-fg">{children}</div>;
  }
  const links = [
    { to: "/create", label: t.nav.create, icon: QrCode },
    { to: "/scan", label: t.nav.scan, icon: ScanLine },
    { to: "/templates", label: t.nav.templates, icon: Shapes },
    { to: "/dashboard", label: t.nav.dashboard, icon: LayoutGrid },
    { to: "/pricing", label: t.nav.pricing, icon: Sparkles },
  ] as const;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-fg",
                  pathname === l.to && "bg-bg-subtle text-fg",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <LangToggle />
            <AuthSlot />
          </div>
        </div>
      </header>
      <div className="flex-1 pb-6">{children}</div>
      <footer className="border-t border-border/80 px-4 py-4 pb-20 md:pb-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-subtle">
          <span>
            Nibras QR · {t.legal.version} {APP_VERSION}
          </span>
          <Link to="/privacy" className="hover:text-fg">
            {t.legal.privacy}
          </Link>
        </div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.to || pathname.startsWith(l.to + "/");
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] text-muted",
                  active && "text-primary",
                )}
              >
                <Icon className="size-5" />
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <SignedOut>
        <span className="sr-only">guest</span>
      </SignedOut>
      <SignedIn>
        <span className="sr-only">member</span>
      </SignedIn>
    </div>
  );
}
