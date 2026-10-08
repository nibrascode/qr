import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as PLAN_LIMITS, s as cn } from "./types-BGbzMcaj.mjs";
import { D as Copy, E as Download, c as Share2 } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as Button, p as useI18n } from "./router-BxAYLhzp.mjs";
import { i as svgToPng, n as downloadBlob, r as renderQrSvg } from "./preview-DI4PgOun.mjs";
import { t as require_jspdf_node_min } from "../_libs/jspdf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/export-bar-DxNFHtOD.js
var import_jsx_runtime = require_jsx_runtime();
var import_jspdf_node_min = require_jspdf_node_min();
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("flex h-11 w-full rounded-lg border border-border bg-bg-elevated px-3 text-sm text-fg placeholder:text-subtle", "transition-[box-shadow,border-color] duration-150 ease-out", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70", "disabled:opacity-50", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-medium text-muted", className),
		...props
	});
}
function blobToDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(/* @__PURE__ */ new Error("read failed"));
		reader.readAsDataURL(blob);
	});
}
function ExportBar({ value, design, name, plan, onLocked }) {
	const { t } = useI18n();
	const limits = PLAN_LIMITS[plan];
	const branded = limits.branded;
	const fileBase = (name || "nibras-qr").replace(/[^\w\-]+/g, "-").slice(0, 40);
	const svg = () => renderQrSvg(value, design, { branded });
	const exportPng = async (jpeg = false) => {
		const px = limits.hq ? 2048 : 640;
		const blob = await svgToPng(svg(), px, jpeg);
		downloadBlob(blob, `${fileBase}.${jpeg ? "jpg" : "png"}`);
	};
	const exportSvg = () => {
		if (!limits.svg) return onLocked();
		const blob = new Blob([svg()], { type: "image/svg+xml" });
		downloadBlob(blob, `${fileBase}.svg`);
	};
	const exportPdf = async () => {
		if (!limits.pdf) return onLocked();
		const dataUrl = await blobToDataUrl(await svgToPng(svg(), 1600));
		const doc = new import_jspdf_node_min.jsPDF({
			orientation: "portrait",
			unit: "pt",
			format: "a4"
		});
		const w = 360;
		const x = 235.27999999999997 / 2;
		const y = 140;
		doc.setFillColor(9, 10, 12);
		doc.rect(0, 0, 595.28, 841.89, "F");
		doc.addImage(dataUrl, "PNG", x, y, w, w);
		doc.setTextColor(238, 241, 244);
		doc.setFontSize(11);
		doc.text(name || "Nibras QR", 297.64, 528, { align: "center" });
		doc.save(`${fileBase}.pdf`);
	};
	const copy = async () => {
		const blob = await svgToPng(svg(), 1024);
		try {
			await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
			toast.success(t.export.copied);
		} catch {
			await navigator.clipboard.writeText(value);
			toast.success(t.export.copied);
		}
	};
	const share = async () => {
		const blob = await svgToPng(svg(), 1024);
		const file = new File([blob], `${fileBase}.png`, { type: "image/png" });
		if (navigator.share && navigator.canShare?.({ files: [file] })) {
			await navigator.share({
				files: [file],
				title: name || "QR"
			});
			return;
		}
		await copy();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => void exportPng(false),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}),
					" ",
					t.export.png
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				onClick: () => void exportPng(true),
				children: t.export.jpg
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				onClick: exportSvg,
				children: t.export.svg
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				onClick: () => void exportPdf(),
				children: t.export.pdf
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				size: "icon",
				onClick: () => void copy(),
				"aria-label": t.export.copy,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				size: "icon",
				onClick: () => void share(),
				"aria-label": t.export.share,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {})
			})
		]
	});
}
//#endregion
export { Input as n, Label as r, ExportBar as t };
