import { useMemo } from "react";
import { renderQrSvg } from "@/lib/qr/render";
import type { QrDesign } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

export function QrPreview({
  value,
  design,
  branded,
  className,
}: {
  value: string;
  design: QrDesign;
  branded?: boolean;
  className?: string;
}) {
  const svg = useMemo(
    () => renderQrSvg(value, design, { branded }),
    [value, design, branded],
  );
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl bg-paper p-3 shadow-[var(--shadow-border)]",
        design.transparent &&
          "bg-[repeating-conic-gradient(#d4d0c8_0_25%,#efece4_0_50%)] bg-[size:18px_18px]",
        className,
      )}
    >
      <div className="w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
