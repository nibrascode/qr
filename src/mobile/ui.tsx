import type { ReactNode } from "react";
import { Crown, Lock } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";
import { haptic } from "./haptics";
import { useM } from "./use-m";

/** Global paywall sheet. */
export const usePaywall = create<{ open: boolean; show: () => void; hide: () => void }>((set) => ({
  open: false,
  show: () => {
    haptic("tap");
    set({ open: true });
  },
  hide: () => set({ open: false }),
}));

export function ProBadge({ className, locked = true }: { className?: string; locked?: boolean }) {
  const m = useM();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase",
        "pro-gradient",
        className,
      )}
      aria-label={m.proFeature}
    >
      {locked ? <Lock className="size-2.5" /> : <Crown className="size-2.5" />}
      Pro
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]", className)}>{children}</section>
  );
}

export function ScreenTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="font-display text-2xl font-bold tracking-tight">{children}</h1>
      {right}
    </div>
  );
}

/** Wraps a Pro-only control: tapping it while locked opens the paywall. */
export function ProGate({ pro, children }: { pro: boolean; children: ReactNode }) {
  const show = usePaywall((s) => s.show);
  if (pro) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50 select-none" aria-hidden>
        {children}
      </div>
      <button
        type="button"
        className="absolute inset-0 grid place-items-center rounded-2xl bg-bg/30 backdrop-blur-[1px]"
        onClick={show}
      >
        <ProBadge className="px-3 py-1 text-xs" />
      </button>
    </div>
  );
}
