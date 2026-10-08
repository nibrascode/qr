import { createFileRoute } from "@tanstack/react-router";
import { Scanner } from "@/components/scan/scanner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/scan")({ component: ScanPage });

function ScanPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <h1 className="mb-6 font-display text-2xl font-semibold">{t.scan.title}</h1>
      <Scanner />
    </main>
  );
}
