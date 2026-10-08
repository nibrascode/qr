import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Wifi, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lookupPublicQr, resolveScan } from "@/lib/server/scan";
import { buildPayload } from "@/lib/qr/payload";

const loadPublic = createServerFn({ method: "GET" })
  .validator((code: string) => code)
  .handler(async ({ data: code }) => {
    const qr = await lookupPublicQr(code);
    if (!qr) return { kind: "missing" as const };
    if (!qr.isActive) return { kind: "inactive" as const, name: qr.name, qr };
    return { kind: "page" as const, qr };
  });

export const Route = createFileRoute("/r/$code")({
  server: {
    handlers: {
      GET: async ({ params, request, next }) => {
        const result = await resolveScan(params.code, request);
        if (result.kind === "redirect") {
          return Response.redirect(result.url, 302);
        }
        return next();
      },
    },
  },
  loader: ({ params }) => loadPublic({ data: params.code }),
  component: PublicQrPage,
});

function PublicQrPage() {
  const data = Route.useLoaderData();
  if (data.kind === "missing") {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">QR tapılmadı</h1>
        <p className="mt-2 text-sm text-muted">This code is missing or expired.</p>
      </main>
    );
  }
  if (data.kind === "inactive") {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">{data.name}</h1>
        <p className="mt-2 text-sm text-muted">Bu QR müvəqqəti dayandırılıb.</p>
      </main>
    );
  }

  const qr = data.qr;
  const payload = qr.destination || buildPayload(qr.qrType, qr.payload);

  if (qr.qrType === "wifi") {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-bg-elevated p-6 text-center shadow-[var(--shadow-border)]">
          <Wifi className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 font-display text-xl font-semibold">{qr.payload.ssid}</h1>
          <p className="mt-1 text-sm text-muted">Wi-Fi</p>
          {qr.payload.password && (
            <p className="mt-4 font-mono text-lg">{qr.payload.password}</p>
          )}
          <Button
            className="mt-6"
            onClick={() => void navigator.clipboard.writeText(qr.payload.password ?? "")}
          >
            Şifrəni kopyala
          </Button>
        </div>
      </main>
    );
  }

  if (qr.qrType === "vcard") {
    const vcf = buildPayload("vcard", qr.payload);
    const href = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcf)}`;
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold">
          {qr.payload.firstName} {qr.payload.lastName}
        </h1>
        <p className="mt-1 text-sm text-muted">{qr.payload.org}</p>
        <Button asChild className="mt-6">
          <a href={href} download="contact.vcf">
            <Download /> Kontaktı yüklə
          </a>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-xl font-semibold">{qr.name}</h1>
      <p className="mt-3 break-all font-mono text-sm text-muted">{payload}</p>
      {/^https?:\/\//i.test(payload) && (
        <Button asChild className="mt-6">
          <a href={payload}>Keçidi aç</a>
        </Button>
      )}
    </main>
  );
}
