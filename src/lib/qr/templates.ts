import { DEFAULT_DESIGN, type QrDesign, type QrFields, type QrType } from "./types";

export type QrTemplate = {
  id: string;
  type: QrType;
  premium: boolean;
  fields: QrFields;
  design: QrDesign;
};

export const TEMPLATES: QrTemplate[] = [
  {
    id: "wifi",
    type: "wifi",
    premium: false,
    fields: { ssid: "Restaurant-WiFi", password: "", encryption: "WPA", hidden: "false" },
    design: {
      ...DEFAULT_DESIGN,
      fg: "#0f766e",
      dotStyle: "rounded",
      eyeStyle: "rounded",
      frame: "scanme",
      frameColor: "#0f766e",
      frameText: "WI-FI",
    },
  },
  {
    id: "restaurant",
    type: "url",
    premium: true,
    fields: { url: "https://nibrascode.com/menu" },
    design: {
      ...DEFAULT_DESIGN,
      fg: "#7c2d12",
      bg: "#fff7ed",
      dotStyle: "extra-rounded",
      eyeStyle: "leaf",
      frame: "banner",
      frameColor: "#9a3412",
      frameText: "MENU",
    },
  },
  {
    id: "business",
    type: "vcard",
    premium: true,
    fields: {
      firstName: "",
      lastName: "",
      org: "",
      title: "",
      phone: "",
      email: "",
      url: "",
    },
    design: {
      ...DEFAULT_DESIGN,
      fg: "#12141a",
      bg: "#f8fafc",
      dotStyle: "classy",
      eyeStyle: "extra-rounded",
      frame: "quiet",
      frameColor: "#12141a",
    },
  },
  {
    id: "social",
    type: "url",
    premium: true,
    fields: { url: "https://instagram.com/" },
    design: {
      ...DEFAULT_DESIGN,
      gradientEnabled: true,
      gradientFrom: "#0e7490",
      gradientTo: "#134e4a",
      fg: "#134e4a",
      dotStyle: "dots",
      eyeStyle: "dots",
      frame: "scanme",
      frameColor: "#134e4a",
      frameText: "FOLLOW",
    },
  },
  {
    id: "contact",
    type: "vcard",
    premium: false,
    fields: { firstName: "", lastName: "", phone: "", email: "" },
    design: {
      ...DEFAULT_DESIGN,
      fg: "#1e3a5f",
      dotStyle: "rounded",
      eyeStyle: "rounded",
      frame: "none",
    },
  },
  {
    id: "event",
    type: "event",
    premium: true,
    fields: { title: "", start: "", end: "", location: "" },
    design: {
      ...DEFAULT_DESIGN,
      fg: "#111827",
      bg: "#f5f5f4",
      dotStyle: "square",
      eyeStyle: "leaf",
      frame: "ticket",
      frameColor: "#1c1917",
      frameText: "EVENT",
    },
  },
  {
    id: "payment",
    type: "url",
    premium: true,
    fields: { url: "https://" },
    design: {
      ...DEFAULT_DESIGN,
      fg: "#064e3b",
      bg: "#ecfdf5",
      dotStyle: "extra-rounded",
      eyeStyle: "rounded",
      frame: "scanme",
      frameColor: "#064e3b",
      frameText: "PAY",
    },
  },
  {
    id: "whatsapp",
    type: "whatsapp",
    premium: false,
    fields: { phone: "994", text: "Salam!" },
    design: {
      ...DEFAULT_DESIGN,
      fg: "#14532d",
      bg: "#f0fdf4",
      dotStyle: "rounded",
      eyeStyle: "rounded",
      frame: "banner",
      frameColor: "#166534",
      frameText: "CHAT",
    },
  },
];

export function templateById(id: string): QrTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
