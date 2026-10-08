import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]",
        className,
      )}
      {...props}
    />
  );
}
