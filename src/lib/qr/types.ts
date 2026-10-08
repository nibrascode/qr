export const QR_TYPES = [
  "url",
  "text",
  "phone",
  "email",
  "whatsapp",
  "wifi",
  "vcard",
  "location",
  "sms",
  "event",
  "app",
] as const;

export type QrType = (typeof QR_TYPES)[number];

export const DOT_STYLES = [
  "square",
  "rounded",
  "dots",
  "classy",
  "extra-rounded",
] as const;
export type DotStyle = (typeof DOT_STYLES)[number];

export const EYE_STYLES = [
  "square",
  "rounded",
  "dots",
  "leaf",
  "extra-rounded",
] as const;
export type EyeStyle = (typeof EYE_STYLES)[number];

export const FRAME_STYLES = [
  "none",
  "quiet",
  "banner",
  "scanme",
  "ticket",
] as const;
export type FrameStyle = (typeof FRAME_STYLES)[number];

export type QrFields = Record<string, string>;

export type QrDesign = {
  fg: string;
  bg: string;
  transparent: boolean;
  gradientEnabled: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientType: "linear" | "radial";
  dotStyle: DotStyle;
  eyeStyle: EyeStyle;
  eyeColor: string;
  eyeColorMatch: boolean;
  logoDataUrl: string | null;
  logoSize: number;
  frame: FrameStyle;
  frameColor: string;
  frameText: string;
  backgroundImage: string | null;
};

export const DEFAULT_DESIGN: QrDesign = {
  fg: "#12141a",
  bg: "#ffffff",
  transparent: false,
  gradientEnabled: false,
  gradientFrom: "#0f766e",
  gradientTo: "#2dd4bf",
  gradientType: "linear",
  dotStyle: "square",
  eyeStyle: "square",
  eyeColor: "#12141a",
  eyeColorMatch: true,
  logoDataUrl: null,
  logoSize: 0.2,
  frame: "none",
  frameColor: "#12141a",
  frameText: "SCAN ME",
  backgroundImage: null,
};

export type Plan = "free" | "premium" | "business";

export const PLAN_LIMITS: Record<
  Plan,
  {
    dynamic: number;
    svg: boolean;
    pdf: boolean;
    designPro: boolean;
    stats: boolean;
    folders: boolean;
    hq: boolean;
    api: boolean;
    branded: boolean;
  }
> = {
  free: {
    dynamic: 0,
    svg: false,
    pdf: false,
    designPro: false,
    stats: false,
    folders: false,
    hq: false,
    api: false,
    branded: true,
  },
  premium: {
    dynamic: 50,
    svg: true,
    pdf: true,
    designPro: true,
    stats: true,
    folders: true,
    hq: true,
    api: false,
    branded: false,
  },
  business: {
    dynamic: 500,
    svg: true,
    pdf: true,
    designPro: true,
    stats: true,
    folders: true,
    hq: true,
    api: true,
    branded: false,
  },
};

export function isPremiumDesign(d: QrDesign): boolean {
  return (
    d.transparent ||
    d.gradientEnabled ||
    d.dotStyle !== "square" ||
    d.eyeStyle !== "square" ||
    Boolean(d.logoDataUrl) ||
    d.frame !== "none" ||
    Boolean(d.backgroundImage) ||
    (!d.eyeColorMatch && d.eyeColor.toLowerCase() !== d.fg.toLowerCase())
  );
}

export type SavedQr = {
  id: string;
  folderId: string | null;
  shortCode: string;
  name: string;
  qrType: QrType;
  isDynamic: boolean;
  isActive: boolean;
  payload: QrFields;
  destination: string;
  design: QrDesign;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: string;
};

export type ScanPoint = { day: string; count: number };
export type DeviceShare = { device: string; count: number };
export type CountryShare = { country: string; count: number };

export type QrStats = {
  total: number;
  last7: number;
  last30: number;
  series: ScanPoint[];
  devices: DeviceShare[];
  countries: CountryShare[];
};

export type Profile = {
  userId: string;
  plan: Plan;
  apiKey: string | null;
  createdAt: string;
  dynamicCount: number;
};
