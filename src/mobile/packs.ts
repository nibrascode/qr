/** Template packs for the mobile app (Pro packs are locked for free users). */
import type { Lang } from "@/lib/i18n";
import { defaultFields } from "@/lib/qr/payload";
import { DEFAULT_DESIGN, type QrDesign, type QrFields, type QrType } from "@/lib/qr/types";

type L = Record<Lang, string>;
export type PackId = "basic" | "business" | "restaurant" | "event" | "social";
export type MobileTemplate = { id: string; pack: PackId; name: L; type: QrType; fields: QrFields; design: QrDesign };

export const PACKS: { id: PackId; pro: boolean; name: L; emoji: string }[] = [
  { id: "basic", pro: false, emoji: "✨", name: { az: "Əsas", ar: "أساسي", ru: "Базовые", tr: "Temel" } },
  { id: "business", pro: true, emoji: "💼", name: { az: "Biznes", ar: "أعمال", ru: "Бизнес", tr: "İş" } },
  { id: "restaurant", pro: true, emoji: "🍽️", name: { az: "Restoran", ar: "مطعم", ru: "Ресторан", tr: "Restoran" } },
  { id: "event", pro: true, emoji: "🎟️", name: { az: "Tədbir", ar: "فعالية", ru: "События", tr: "Etkinlik" } },
  { id: "social", pro: true, emoji: "📣", name: { az: "Sosial", ar: "تواصل", ru: "Соцсети", tr: "Sosyal" } },
];

const d = (p: Partial<QrDesign>): QrDesign => ({ ...DEFAULT_DESIGN, ...p });
const grad = (from: string, to: string, extra: Partial<QrDesign> = {}): QrDesign =>
  d({ gradientEnabled: true, gradientFrom: from, gradientTo: to, fg: to, ...extra });

export const MOBILE_TEMPLATES: MobileTemplate[] = [
  // basic (free)
  { id: "b-wifi", pack: "basic", type: "wifi", name: { az: "Wi-Fi", ar: "واي فاي", ru: "Wi-Fi", tr: "Wi-Fi" },
    fields: { ssid: "", password: "", encryption: "WPA", hidden: "false" }, design: d({ fg: "#0f766e", dotStyle: "rounded" }) },
  { id: "b-link", pack: "basic", type: "url", name: { az: "Link", ar: "رابط", ru: "Ссылка", tr: "Link" },
    fields: { url: "https://" }, design: d({ fg: "#1e293b" }) },
  { id: "b-whatsapp", pack: "basic", type: "whatsapp", name: { az: "WhatsApp", ar: "واتساب", ru: "WhatsApp", tr: "WhatsApp" },
    fields: { phone: "", text: "" }, design: d({ fg: "#15803d", dotStyle: "rounded" }) },
  { id: "b-contact", pack: "basic", type: "vcard", name: { az: "Kontakt", ar: "جهة اتصال", ru: "Контакт", tr: "Kişi" },
    fields: {}, design: d({ fg: "#1e3a8a" }) },
  // business
  { id: "biz-card", pack: "business", type: "vcard", name: { az: "Vizit kartı", ar: "بطاقة عمل", ru: "Визитка", tr: "Kartvizit" },
    fields: {}, design: grad("#0f172a", "#334155", { bg: "#f8fafc", dotStyle: "classy", eyeStyle: "extra-rounded", frame: "quiet", frameColor: "#0f172a" }) },
  { id: "biz-review", pack: "business", type: "url", name: { az: "Rəy bildir", ar: "قيّمنا", ru: "Отзыв", tr: "Yorum yap" },
    fields: { url: "https://g.page/r/" }, design: grad("#f59e0b", "#b45309", { dotStyle: "dots", eyeStyle: "rounded", frame: "scanme", frameColor: "#b45309", frameText: "★ REVIEW" }) },
  { id: "biz-pay", pack: "business", type: "url", name: { az: "Ödəniş", ar: "الدفع", ru: "Оплата", tr: "Ödeme" },
    fields: { url: "https://" }, design: grad("#059669", "#064e3b", { bg: "#ecfdf5", dotStyle: "extra-rounded", eyeStyle: "leaf", frame: "banner", frameColor: "#064e3b", frameText: "PAY" }) },
  { id: "biz-linkedin", pack: "business", type: "url", name: { az: "LinkedIn", ar: "لينكدإن", ru: "LinkedIn", tr: "LinkedIn" },
    fields: { url: "https://linkedin.com/in/" }, design: d({ fg: "#0a66c2", eyeColorMatch: false, eyeColor: "#004182", dotStyle: "rounded", eyeStyle: "rounded", frame: "scanme", frameColor: "#0a66c2", frameText: "CONNECT" }) },
  // restaurant
  { id: "rest-menu", pack: "restaurant", type: "url", name: { az: "Menyu", ar: "القائمة", ru: "Меню", tr: "Menü" },
    fields: { url: "https://" }, design: grad("#ea580c", "#7c2d12", { bg: "#fff7ed", dotStyle: "extra-rounded", eyeStyle: "leaf", frame: "banner", frameColor: "#9a3412", frameText: "MENU" }) },
  { id: "rest-wifi", pack: "restaurant", type: "wifi", name: { az: "Qonaq Wi-Fi", ar: "واي فاي الضيوف", ru: "Гостевой Wi-Fi", tr: "Misafir Wi-Fi" },
    fields: { ssid: "", password: "", encryption: "WPA", hidden: "false" }, design: d({ fg: "#7c2d12", bg: "#fffbeb", dotStyle: "dots", eyeStyle: "rounded", frame: "scanme", frameColor: "#7c2d12", frameText: "FREE WI-FI" }) },
  { id: "rest-order", pack: "restaurant", type: "whatsapp", name: { az: "Sifariş", ar: "اطلب", ru: "Заказ", tr: "Sipariş" },
    fields: { phone: "", text: "" }, design: grad("#22c55e", "#14532d", { bg: "#f0fdf4", dotStyle: "rounded", eyeStyle: "extra-rounded", frame: "ticket", frameColor: "#166534", frameText: "ORDER" }) },
  // event
  { id: "ev-invite", pack: "event", type: "event", name: { az: "Dəvətnamə", ar: "دعوة", ru: "Приглашение", tr: "Davetiye" },
    fields: {}, design: grad("#a855f7", "#4c1d95", { bg: "#faf5ff", dotStyle: "classy", eyeStyle: "leaf", frame: "ticket", frameColor: "#4c1d95", frameText: "RSVP" }) },
  { id: "ev-ticket", pack: "event", type: "text", name: { az: "Bilet", ar: "تذكرة", ru: "Билет", tr: "Bilet" },
    fields: { text: "TICKET-0001" }, design: d({ fg: "#111827", bg: "#f5f5f4", eyeStyle: "leaf", frame: "ticket", frameColor: "#1c1917", frameText: "ADMIT ONE" }) },
  { id: "ev-wedding", pack: "event", type: "url", name: { az: "Toy", ar: "زفاف", ru: "Свадьба", tr: "Düğün" },
    fields: { url: "https://" }, design: grad("#f472b6", "#9d174d", { bg: "#fdf2f8", dotStyle: "dots", eyeStyle: "extra-rounded", frame: "quiet", frameColor: "#9d174d", frameText: "♥" }) },
  // social
  { id: "so-instagram", pack: "social", type: "url", name: { az: "Instagram", ar: "إنستغرام", ru: "Instagram", tr: "Instagram" },
    fields: { url: "https://instagram.com/" }, design: grad("#f59e0b", "#c026d3", { dotStyle: "dots", eyeStyle: "extra-rounded", frame: "scanme", frameColor: "#c026d3", frameText: "FOLLOW" }) },
  { id: "so-tiktok", pack: "social", type: "url", name: { az: "TikTok", ar: "تيك توك", ru: "TikTok", tr: "TikTok" },
    fields: { url: "https://tiktok.com/@" }, design: d({ fg: "#010101", eyeColorMatch: false, eyeColor: "#fe2c55", dotStyle: "rounded", eyeStyle: "rounded", frame: "banner", frameColor: "#010101", frameText: "TIKTOK" }) },
  { id: "so-youtube", pack: "social", type: "url", name: { az: "YouTube", ar: "يوتيوب", ru: "YouTube", tr: "YouTube" },
    fields: { url: "https://youtube.com/@" }, design: d({ fg: "#b91c1c", dotStyle: "extra-rounded", eyeStyle: "rounded", frame: "scanme", frameColor: "#dc2626", frameText: "SUBSCRIBE" }) },
  { id: "so-telegram", pack: "social", type: "url", name: { az: "Telegram", ar: "تيليجرام", ru: "Telegram", tr: "Telegram" },
    fields: { url: "https://t.me/" }, design: grad("#38bdf8", "#0369a1", { dotStyle: "rounded", eyeStyle: "leaf", frame: "quiet", frameColor: "#0369a1", frameText: "JOIN" }) },
];

export function templateFields(t: MobileTemplate): QrFields {
  return { ...defaultFields(t.type), ...t.fields };
}
