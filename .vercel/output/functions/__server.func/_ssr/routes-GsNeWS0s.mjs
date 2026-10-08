import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as DEFAULT_DESIGN } from "./types-BGbzMcaj.mjs";
import { A as ChartColumn, d as QrCode, h as Palette, o as Sparkles, s as ShieldCheck, u as ScanLine } from "../_libs/lucide-react.mjs";
import { i as Button, p as useI18n } from "./router-BxAYLhzp.mjs";
import { t as QrPreview } from "./preview-DI4PgOun.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-GsNeWS0s.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const { t } = useI18n();
	const sampleDesign = (0, import_react.useMemo)(() => ({
		...DEFAULT_DESIGN,
		fg: "#042f2e",
		bg: "#ecfdf8",
		gradientEnabled: true,
		gradientFrom: "#0f766e",
		gradientTo: "#2dd4bf",
		dotStyle: "extra-rounded",
		eyeStyle: "rounded",
		frame: "scanme",
		frameColor: "#042f2e",
		frameText: "MENU"
	}), []);
	const features = [
		{
			icon: QrCode,
			title: t.features.create,
			body: t.features.createBody
		},
		{
			icon: Sparkles,
			title: t.features.dynamic,
			body: t.features.dynamicBody
		},
		{
			icon: Palette,
			title: t.features.design,
			body: t.features.designBody
		},
		{
			icon: ChartColumn,
			title: t.features.stats,
			body: t.features.statsBody
		},
		{
			icon: ScanLine,
			title: t.features.scan,
			body: t.features.scanBody
		},
		{
			icon: ShieldCheck,
			title: t.features.export,
			body: t.features.exportBody
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.15fr_0.85fr] md:py-20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-[0.18em] text-primary uppercase",
				children: t.hero.kicker
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl",
				children: t.hero.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 max-w-xl text-base leading-relaxed text-muted",
				children: t.hero.body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					size: "lg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/create",
						children: t.hero.cta
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					size: "lg",
					variant: "outline",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/scan",
						children: t.hero.secondary
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t.hero.point1 }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t.hero.point2 }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t.hero.point3 })
				]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto w-full max-w-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrPreview, {
				value: "https://nibrascode.com",
				design: sampleDesign
			})
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl px-4 py-14",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl font-semibold",
				children: t.features.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
				children: features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(f.icon, { className: "size-5 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-4 font-display text-base font-semibold",
							children: f.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: f.body
						})
					]
				}, f.title))
			})]
		})
	})] });
}
//#endregion
export { Home as component };
