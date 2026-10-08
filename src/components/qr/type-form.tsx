import type { ComponentProps, ReactNode } from "react";
import { QR_TYPES, type QrType } from "@/lib/qr/types";
import { useGenerator } from "@/lib/qr/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe,
  Type,
  Phone,
  Mail,
  MessageCircle,
  Wifi,
  Contact,
  MapPin,
  MessageSquare,
  Calendar,
  AppWindow,
} from "lucide-react";

const ICONS: Record<QrType, typeof Globe> = {
  url: Globe,
  text: Type,
  phone: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  wifi: Wifi,
  vcard: Contact,
  location: MapPin,
  sms: MessageSquare,
  event: Calendar,
  app: AppWindow,
};

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function TypePicker() {
  const { t } = useI18n();
  const type = useGenerator((s) => s.type);
  const setType = useGenerator((s) => s.setType);
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {QR_TYPES.map((id) => {
        const Icon = ICONS[id];
        const active = type === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setType(id)}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs transition-colors",
              active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-bg-elevated text-muted hover:text-fg",
            )}
          >
            <Icon className="size-4" />
            {t.types[id]}
          </button>
        );
      })}
    </div>
  );
}

export function TypeForm() {
  const { t } = useI18n();
  const type = useGenerator((s) => s.type);
  const fields = useGenerator((s) => s.fields);
  const setField = useGenerator((s) => s.setField);
  const f = (key: string, props?: ComponentProps<typeof Input>) => (
    <Field id={key} label={t.fields[key as keyof typeof t.fields] ?? key}>
      <Input
        id={key}
        value={fields[key] ?? ""}
        onChange={(e) => setField(key, e.target.value)}
        {...props}
      />
    </Field>
  );

  switch (type) {
    case "url":
      return f("url", { placeholder: "https://", inputMode: "url" });
    case "text":
      return (
        <Field id="text" label={t.fields.text}>
          <Textarea
            id="text"
            value={fields.text ?? ""}
            onChange={(e) => setField("text", e.target.value)}
            rows={5}
          />
        </Field>
      );
    case "phone":
      return f("phone", { inputMode: "tel", placeholder: "+994" });
    case "email":
      return (
        <div className="space-y-3">
          {f("email", { type: "email" })}
          {f("subject")}
          <Field id="body" label={t.fields.body}>
            <Textarea
              id="body"
              value={fields.body ?? ""}
              onChange={(e) => setField("body", e.target.value)}
            />
          </Field>
        </div>
      );
    case "whatsapp":
      return (
        <div className="space-y-3">
          {f("phone", { inputMode: "tel", placeholder: "99450..." })}
          {f("text")}
        </div>
      );
    case "wifi":
      return (
        <div className="space-y-3">
          {f("ssid")}
          {f("password", { type: "text" })}
          <Field id="encryption" label={t.fields.encryption}>
            <select
              id="encryption"
              value={fields.encryption ?? "WPA"}
              onChange={(e) => setField("encryption", e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-bg-elevated px-3 text-sm"
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">Open</option>
            </select>
          </Field>
        </div>
      );
    case "vcard":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {f("firstName")}
          {f("lastName")}
          {f("org")}
          {f("title")}
          {f("phone", { inputMode: "tel" })}
          {f("email", { type: "email" })}
          {f("url", { inputMode: "url" })}
          {f("city")}
        </div>
      );
    case "location":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {f("lat", { placeholder: "40.4093" })}
          {f("lng", { placeholder: "49.8671" })}
          <div className="sm:col-span-2">{f("query")}</div>
        </div>
      );
    case "sms":
      return (
        <div className="space-y-3">
          {f("phone", { inputMode: "tel" })}
          {f("text")}
        </div>
      );
    case "event":
      return (
        <div className="space-y-3">
          {f("title")}
          {f("start", { type: "datetime-local" })}
          {f("end", { type: "datetime-local" })}
          {f("location")}
          <Field id="description" label={t.fields.description}>
            <Textarea
              id="description"
              value={fields.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
            />
          </Field>
        </div>
      );
    case "app":
      return f("url", { placeholder: "https://apps.apple.com/..." });
    default:
      return null;
  }
}
