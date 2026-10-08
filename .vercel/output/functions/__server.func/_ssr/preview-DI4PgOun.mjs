import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { s as cn } from "./types-BGbzMcaj.mjs";
import { n as encode, t as QrCodeDataType } from "../_libs/uqr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preview-DI4PgOun.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FINDER = 7;
function isFinder(x, y, n) {
	const inBox = (fx, fy) => x >= fx && x < fx + FINDER && y >= fy && y < fy + FINDER;
	return inBox(0, 0) || inBox(n - FINDER, 0) || inBox(0, n - FINDER);
}
function eyeRadius(style) {
	switch (style) {
		case "rounded": return {
			outer: 1.6,
			inner: .7
		};
		case "extra-rounded": return {
			outer: 2.4,
			inner: 1.1
		};
		case "dots": return {
			outer: 3.5,
			inner: 1.5
		};
		case "leaf": return {
			outer: 2.8,
			inner: 1.2
		};
		default: return {
			outer: .4,
			inner: .2
		};
	}
}
function roundedRectPath(x, y, w, h, r) {
	const radii = typeof r === "number" ? {
		tl: r,
		tr: r,
		br: r,
		bl: r
	} : r;
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
		"Z"
	].join(" ");
}
function modulePath(x, y, dark, style) {
	const n = dark(x, y - 1);
	const s = dark(x, y + 1);
	const e = dark(x + 1, y);
	const w = dark(x - 1, y);
	if (style === "dots") return `M${x + .5} ${y + .12} a0.38 0.38 0 1 0 0.001 0 Z`;
	if (style === "square") return `M${x} ${y}h1v1h-1Z`;
	if (style === "rounded") return roundedRectPath(x + .08, y + .08, .84, .84, .22);
	if (style === "classy") {
		if (!n && !s && !e && !w) return `M${x + .5} ${y + .14} a0.36 0.36 0 1 0 0.001 0 Z`;
		return roundedRectPath(x + .06, y + .06, .88, .88, .18);
	}
	const r = .5;
	return roundedRectPath(x, y, 1, 1, {
		tl: !n && !w ? r : 0,
		tr: !n && !e ? r : 0,
		br: !s && !e ? r : 0,
		bl: !s && !w ? r : 0
	});
}
function drawEye(fx, fy, style, fill) {
	const { outer, inner } = eyeRadius(style);
	const leaf = style === "leaf" ? {
		tl: outer,
		tr: .35,
		br: outer,
		bl: .35
	} : outer;
	const ring = roundedRectPath(fx, fy, FINDER, FINDER, leaf);
	const hole = roundedRectPath(fx + 1, fy + 1, 5, 5, typeof leaf === "number" ? Math.max(outer - .7, .2) : 1.4);
	const pupilR = style === "dots" ? 1.5 : inner;
	return `<path fill="${fill}" fill-rule="evenodd" d="${ring}${hole}"/><path fill="${fill}" d="${roundedRectPath(fx + 2, fy + 2, 3, 3, pupilR)}"/>`;
}
function frameMetrics(design, modules) {
	const quiet = 2;
	const qr = modules + 4;
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
	return {
		quiet,
		qr,
		pad,
		banner,
		width,
		height,
		modules
	};
}
function renderQrSvg(value, design, opts) {
	const encoded = encode(value || "https://nibrascode.com", {
		ecc: "H",
		border: 0,
		boostEcc: true
	});
	const matrix = encoded.data;
	const types = encoded.types;
	const n = encoded.size;
	const m = frameMetrics(design, n);
	const ox = m.pad + m.quiet;
	const oy = m.pad + m.quiet;
	const isDark = (x, y) => {
		if (x < 0 || y < 0 || x >= n || y >= n) return false;
		if (types[y]?.[x] === QrCodeDataType.Position) return false;
		return Boolean(matrix[y]?.[x]);
	};
	const uid = `nq${Math.abs(hash(value + design.fg + design.gradientFrom)).toString(36)}`;
	const fgFill = design.gradientEnabled ? `url(#g-${uid})` : design.fg;
	const eyeFill = design.eyeColorMatch ? fgFill : design.eyeColor;
	const bg = design.transparent ? "none" : design.bg;
	let dots = "";
	for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
		if (!matrix[y]?.[x]) continue;
		if (isFinder(x, y, n)) continue;
		dots += modulePath(x, y, isDark, design.dotStyle);
	}
	const eyes = drawEye(0, 0, design.eyeStyle, eyeFill) + drawEye(n - FINDER, 0, design.eyeStyle, eyeFill) + drawEye(0, n - FINDER, design.eyeStyle, eyeFill);
	const logo = design.logoDataUrl ? (() => {
		const s = n * design.logoSize;
		const x = (n - s) / 2;
		const pad = s * .12;
		return `<rect x="${x - pad / 2}" y="${x - pad / 2}" width="${s + pad}" height="${s + pad}" rx="${s * .18}" fill="${design.transparent ? "#ffffff" : design.bg}"/><image href="${escapeXml(design.logoDataUrl)}" x="${x}" y="${x}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"/>`;
	})() : "";
	const bgImage = design.backgroundImage ? `<image href="${escapeXml(design.backgroundImage)}" x="0" y="0" width="${n}" height="${n}" preserveAspectRatio="xMidYMid slice" opacity="0.22"/>` : "";
	const gradient = design.gradientEnabled ? design.gradientType === "radial" ? `<radialGradient id="g-${uid}" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="${design.gradientFrom}"/><stop offset="100%" stop-color="${design.gradientTo}"/></radialGradient>` : `<linearGradient id="g-${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${design.gradientFrom}"/><stop offset="100%" stop-color="${design.gradientTo}"/></linearGradient>` : "";
	const frameFill = design.frame === "none" ? "none" : design.frameColor;
	const frameShape = design.frame === "none" ? "" : `<rect x="0" y="0" width="${m.width}" height="${m.height}" rx="${design.frame === "ticket" ? 1.4 : 1.1}" fill="${frameFill}"/><rect x="${m.pad * .55}" y="${m.pad * .55}" width="${m.width - m.pad * 1.1}" height="${m.height - m.pad * 1.1}" rx="0.9" fill="${design.transparent ? "#ffffff" : design.bg}"/>`;
	const label = m.banner ? `<text x="${m.width / 2}" y="${m.pad + m.qr + m.banner * .62}" text-anchor="middle" font-family="Sora, Manrope, sans-serif" font-weight="700" font-size="1.45" fill="${design.frame === "none" ? design.fg : "#f8faf8"}" letter-spacing="0.18">${escapeXml((design.frameText || "SCAN ME").toUpperCase())}</text>` : "";
	const brand = opts?.branded ? `<text x="${m.width / 2}" y="${m.height - .35}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="0.72" fill="${design.frame === "none" ? "#8b929c" : "#d1d5db"}">Nibras QR</text>` : "";
	const innerBg = design.transparent && design.frame === "none" ? "" : `<rect x="${ox - m.quiet}" y="${oy - m.quiet}" width="${m.qr}" height="${m.qr}" fill="${bg}"/>`;
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
function escapeXml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function hash(s) {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
	return h;
}
async function svgToPng(svg, px, jpeg = false) {
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
		const quality = jpeg ? .92 : void 0;
		return await new Promise((resolve, reject) => {
			canvas.toBlob((b) => b ? resolve(b) : reject(/* @__PURE__ */ new Error("Export failed")), mime, quality);
		});
	} finally {
		URL.revokeObjectURL(url);
	}
}
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error("Image load failed"));
		img.src = src;
	});
}
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
function QrPreview({ value, design, branded, className }) {
	const svg = (0, import_react.useMemo)(() => renderQrSvg(value, design, { branded }), [
		value,
		design,
		branded
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("w-full overflow-hidden rounded-2xl bg-paper p-3 shadow-[var(--shadow-border)]", design.transparent && "bg-[repeating-conic-gradient(#d4d0c8_0_25%,#efece4_0_50%)] bg-[size:18px_18px]", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full",
			dangerouslySetInnerHTML: { __html: svg }
		})
	});
}
//#endregion
export { svgToPng as i, downloadBlob as n, renderQrSvg as r, QrPreview as t };
