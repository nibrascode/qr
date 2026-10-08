import { encode, QrCodeDataType } from "uqr";
import type { QrDesign } from "./types";

const FINDER = 7;

function isFinder(x: number, y: number, n: number): boolean {
  const inBox = (fx: number, fy: number) =>
    x >= fx && x < fx + FINDER && y >= fy && y < fy + FINDER;
  return inBox(0, 0) || inBox(n - FINDER, 0) || inBox(0, n - FINDER);
}

function eyeRadius(style: QrDesign["eyeStyle"]): { outer: number; inner: number } {
  switch (style) {
    case "rounded":
      return { outer: 1.6, inner: 0.7 };
    case "extra-rounded":
      return { outer: 2.4, inner: 1.1 };
    case "dots":
      return { outer: 3.5, inner: 1.5 };
    case "leaf":
      return { outer: 2.8, inner: 1.2 };
    default:
      return { outer: 0.4, inner: 0.2 };
  }
}

function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | { tl: number; tr: number; br: number; bl: number },
): string {
  const radii =
    typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
  const tl = Math.min(radii.tl, w / 2, h / 2);
  const tr = Math.min(radii.tr, w / 2, h / 2);
  const br = Math.min(radii.br, w / 2, h / 2);
  const bl = Math.min(radii.bl, w / 2, h / 2);
  return [
    `M${x + tl} ${y}`,
    `H${x + w - tr}`,
    `A${tr} ${tr} 0 0 1 ${x + w} ${y + tr}`,
    `V${y + h - br}`,
    `A${br} ${br} 0 0 1 ${x + w - br} ${y + h}`,
    `H${x + bl}`,
    `A${bl} ${bl} 0 0 1 ${x} ${y + h - bl}`,
    `V${y + tl}`,
    `A${tl} ${tl} 0 0 1 ${x + tl} ${y}`,
    "Z",
  ].join(" ");
}

function modulePath(
  x: number,
  y: number,
  dark: (x: number, y: number) => boolean,
  style: QrDesign["dotStyle"],
): string {
  const n = dark(x, y - 1);
  const s = dark(x, y + 1);
  const e = dark(x + 1, y);
  const w = dark(x - 1, y);
  if (style === "dots") {
    return `M${x + 0.5} ${y + 0.12} a0.38 0.38 0 1 0 0.001 0 Z`;
  }
  if (style === "square") {
    return `M${x} ${y}h1v1h-1Z`;
  }
  if (style === "rounded") {
    return roundedRectPath(x + 0.08, y + 0.08, 0.84, 0.84, 0.22);
  }
  if (style === "classy") {
    const isolated = !n && !s && !e && !w;
    if (isolated) {
      return `M${x + 0.5} ${y + 0.14} a0.36 0.36 0 1 0 0.001 0 Z`;
    }
    return roundedRectPath(x + 0.06, y + 0.06, 0.88, 0.88, 0.18);
  }
  // extra-rounded — neighbor-aware corners
  const r = 0.5;
  return roundedRectPath(x, y, 1, 1, {
    tl: !n && !w ? r : 0,
    tr: !n && !e ? r : 0,
    br: !s && !e ? r : 0,
    bl: !s && !w ? r : 0,
  });
}

function drawEye(
  fx: number,
  fy: number,
  style: QrDesign["eyeStyle"],
  fill: string,
): string {
  const { outer, inner } = eyeRadius(style);
  const leaf =
    style === "leaf"
      ? { tl: outer, tr: 0.35, br: outer, bl: 0.35 }
      : outer;
  const ring = roundedRectPath(fx, fy, FINDER, FINDER, leaf);
  const hole = roundedRectPath(fx + 1, fy + 1, 5, 5, typeof leaf === "number" ? Math.max(outer - 0.7, 0.2) : 1.4);
  const pupilR = style === "dots" ? 1.5 : inner;
  const pupil = roundedRectPath(fx + 2, fy + 2, 3, 3, pupilR);
  return `<path fill="${fill}" fill-rule="evenodd" d="${ring}${hole}"/>` +
    `<path fill="${fill}" d="${pupil}"/>`;
}

export function frameMetrics(design: QrDesign, modules: number) {
  const quiet = 2;
  const qr = modules + quiet * 2;
  let pad = 0;
  let banner = 0;
  if (design.frame === "quiet") pad = 1.6;
  if (design.frame === "banner" || design.frame === "scanme") {
    pad = 1.4;
    banner = 3.2;
  }
  if (design.frame === "ticket") {
    pad = 2.2;
    banner = 2.6;
  }
  const width = qr + pad * 2;
  const height = qr + pad * 2 + banner;
  return { quiet, qr, pad, banner, width, height, modules };
}

export function renderQrSvg(
  value: string,
  design: QrDesign,
  opts?: { branded?: boolean },
): string {
  const encoded = encode(value || "https://nibrascode.com", {
    ecc: "H",
    border: 0,
    boostEcc: true,
  });
  const matrix = encoded.data;
  const types = encoded.types;
  const n = encoded.size;
  const m = frameMetrics(design, n);
  const ox = m.pad + m.quiet;
  const oy = m.pad + m.quiet;

  const isDark = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= n || y >= n) return false;
    if (types[y]?.[x] === QrCodeDataType.Position) return false;
    return Boolean(matrix[y]?.[x]);
  };

  const uid = `nq${Math.abs(hash(value + design.fg + design.gradientFrom)).toString(36)}`;
  const fgFill = design.gradientEnabled ? `url(#g-${uid})` : design.fg;
  const eyeFill = design.eyeColorMatch ? fgFill : design.eyeColor;
  const bg = design.transparent ? "none" : design.bg;

  let dots = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!matrix[y]?.[x]) continue;
      if (isFinder(x, y, n)) continue;
      dots += modulePath(x, y, isDark, design.dotStyle);
    }
  }

  const eyes =
    drawEye(0, 0, design.eyeStyle, eyeFill) +
    drawEye(n - FINDER, 0, design.eyeStyle, eyeFill) +
    drawEye(0, n - FINDER, design.eyeStyle, eyeFill);

  const logo = design.logoDataUrl
    ? (() => {
        const s = n * design.logoSize;
        const x = (n - s) / 2;
        const pad = s * 0.12;
        return `<rect x="${x - pad / 2}" y="${x - pad / 2}" width="${s + pad}" height="${s + pad}" rx="${s * 0.18}" fill="${design.transparent ? "#ffffff" : design.bg}"/>` +
          `<image href="${escapeXml(design.logoDataUrl)}" x="${x}" y="${x}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"/>`;
      })()
    : "";

  const bgImage = design.backgroundImage
    ? `<image href="${escapeXml(design.backgroundImage)}" x="0" y="0" width="${n}" height="${n}" preserveAspectRatio="xMidYMid slice" opacity="0.22"/>`
    : "";

  const gradient = design.gradientEnabled
    ? design.gradientType === "radial"
      ? `<radialGradient id="g-${uid}" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="${design.gradientFrom}"/><stop offset="100%" stop-color="${design.gradientTo}"/></radialGradient>`
      : `<linearGradient id="g-${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${design.gradientFrom}"/><stop offset="100%" stop-color="${design.gradientTo}"/></linearGradient>`
    : "";

  const frameFill =
    design.frame === "none" ? "none" : design.frameColor;
  const frameShape =
    design.frame === "none"
      ? ""
      : `<rect x="0" y="0" width="${m.width}" height="${m.height}" rx="${design.frame === "ticket" ? 1.4 : 1.1}" fill="${frameFill}"/>` +
        `<rect x="${m.pad * 0.55}" y="${m.pad * 0.55}" width="${m.width - m.pad * 1.1}" height="${m.height - m.pad * 1.1}" rx="0.9" fill="${design.transparent ? "#ffffff" : design.bg}"/>`;

  const label = m.banner
    ? `<text x="${m.width / 2}" y="${m.pad + m.qr + m.banner * 0.62}" text-anchor="middle" font-family="Sora, Manrope, sans-serif" font-weight="700" font-size="1.45" fill="${design.frame === "none" ? design.fg : "#f8faf8"}" letter-spacing="0.18">${escapeXml((design.frameText || "SCAN ME").toUpperCase())}</text>`
    : "";

  const brand = opts?.branded
    ? `<text x="${m.width / 2}" y="${m.height - 0.35}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="0.72" fill="${design.frame === "none" ? "#8b929c" : "#d1d5db"}">Nibras QR</text>`
    : "";

  const innerBg =
    design.transparent && design.frame === "none"
      ? ""
      : `<rect x="${ox - m.quiet}" y="${oy - m.quiet}" width="${m.qr}" height="${m.qr}" fill="${bg}"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.width} ${m.height}" width="100%" role="img" aria-label="QR code">
  <defs>${gradient}</defs>
  ${frameShape}
  <g transform="translate(${ox} ${oy})">
    ${innerBg}
    ${bgImage}
    <path fill="${fgFill}" d="${dots}"/>
    ${eyes}
    ${logo}
  </g>
  ${label}
  ${brand}
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export async function svgToPng(
  svg: string,
  px: number,
  jpeg = false,
): Promise<Blob> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    if (jpeg) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, px, px);
    }
    ctx.drawImage(img, 0, 0, px, px);
    const mime = jpeg ? "image/jpeg" : "image/png";
    const quality = jpeg ? 0.92 : undefined;
    const out = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
        mime,
        quality,
      );
    });
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
